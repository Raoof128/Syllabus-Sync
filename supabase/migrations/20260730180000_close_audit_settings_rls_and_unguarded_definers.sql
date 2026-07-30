-- ============================================================================
-- RTA-0024 / RTA-0025: audit_settings has no RLS, and five SECURITY DEFINER
-- functions are client-reachable with no ownership check.
--
-- Found by the 2026-07-30 runtime audit. NOT APPLIED by that audit — this file
-- ships unapplied and takes effect on the next `supabase db push`.
--
-- WHY THIS MATTERS
--
-- 1. public.audit_settings is the ONLY table in the whole chain that never gets
--    ENABLE ROW LEVEL SECURITY. Verified by counting CREATE TABLE targets (27)
--    against ALTER TABLE ... ENABLE ROW LEVEL SECURITY targets (26); this table
--    is the entire delta. It also never receives a REVOKE.
--
-- 2. public.cleanup_old_audit_logs() is SECURITY DEFINER, reads its retention
--    window FROM that table, and has no GRANT or REVOKE anywhere in the chain.
--
--    Chained, those two give an unauthenticated caller holding only the
--    publishable anon key a way to destroy the security audit trail:
--      PATCH  /rest/v1/audit_settings?key=eq.audit_log_retention_days {"value":"0"}
--      POST   /rest/v1/rpc/cleanup_old_audit_logs
--    -> DELETE FROM audit_logs WHERE created_at < now() - interval '0 days'
--
--    Even without step 1, any client can force the >=90-day purge on demand,
--    repeatedly.
--
--    The "REVOKE FROM PUBLIC is not enough" premise is not an assumption in this
--    project: BA-0032 recorded exactly this for log_audit() — Supabase issues
--    DIRECT grants to anon and authenticated, and revoking PUBLIC leaves those
--    untouched. 20260729110000 states the same. So every REVOKE below names
--    anon and authenticated explicitly.
--
-- 3. Three more definers are client-executable with NO ownership check at all.
--    They escaped the BA-0029/BA-0031/BA-0049 sweeps because those sweeps look
--    for a BROKEN guard (`auth.role() = 'authenticated'`) and these have no
--    guard to match:
--      add_sample_class_times(uuid)   - writes class_times rows into ANY user's
--                                       units, bypassing RLS. Zero callers.
--      purge_deleted_records(int)     - caller-controlled window; a negative
--                                       value moves the cutoff into the future
--                                       and hard-deletes every soft-deleted row
--                                       for every user, destroying restore.
--      refresh_analytics_views()      - three REFRESH MATERIALIZED VIEW
--                                       CONCURRENTLY full scans per call.
--    purge_deleted_records and refresh_analytics_views already carry
--    REVOKE ... FROM PUBLIC, which per (2) is insufficient on its own.
--
-- 4. Eight live definers never pin search_path, and there is no
--    `ALTER FUNCTION ... SET search_path` anywhere in the chain (grep: zero
--    hits). An unpinned definer inherits the CALLER's search_path, which
--    PostgREST sets to "public, extensions". This is defence-in-depth, not a
--    live hole: the chain never grants CREATE on any schema, and PG15+ removes
--    CREATE on public from PUBLIC. Pinned here so it cannot become live.
--
-- Functions are NOT dropped even where they have zero callers — revoking is
-- reversible and a drop is not. Removal is tracked separately.
--
-- ----------------------------------------------------------------------------
-- VERIFIED AGAINST PRODUCTION, 2026-07-30 (read-only catalogue queries via
-- `supabase db query --linked`; no write, no migration applied):
--
--   * audit_settings, cleanup_old_audit_logs(), add_sample_class_times(uuid) and
--     cleanup_expired_webauthn_challenges() DO NOT EXIST in production. Points 1
--     and part of 2 above are therefore REPLAY-ONLY — real for any environment
--     built from this chain, not live today. Every block is guarded accordingly.
--   * NO table in public lacks RLS in production (0 rows).
--   * LIVE AND ANON-REACHABLE: purge_deleted_records(integer) and
--     refresh_analytics_views(), both SECURITY DEFINER, both with an UNPINNED
--     search_path, both holding EXECUTE for anon AND authenticated. Neither has
--     any application caller — the only repository mentions are generated entries
--     in lib/supabase/database.types.ts. These two are the real live findings.
--   * Six SECURITY DEFINER functions in public have an unpinned search_path:
--     the two above plus the trigger functions handle_new_user_profile(),
--     on_deadline_completed(), on_unit_created() and protect_profile_fields().
--     Confirmed safe to pin: none of them references auth., storage. or
--     extensions., so `search_path = public` cannot change their resolution.
--   * NOT exploitable today: anon and authenticated hold USAGE but NOT CREATE on
--     both public and extensions (pg_namespace.nspacl), so the unpinned path
--     cannot be hijacked by a client role. Point 4 is defence-in-depth, as stated.
-- ----------------------------------------------------------------------------
--
-- Idempotent and safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. audit_settings: enable RLS and remove client access entirely.
--
--    GUARDED, because live catalogue verification (2026-07-30, read-only via
--    `supabase db query --linked`) showed this table DOES NOT EXIST in
--    production, along with cleanup_old_audit_logs(). The audit-trail-destruction
--    chain described above is therefore a REPLAY-ONLY defect: it is real for any
--    environment built from this migration chain (`supabase db reset`, staging, a
--    DR rebuild), and not a live production hole.
--
--    An unguarded ALTER TABLE here would raise 42P01 and abort the push against
--    production. Keeping the block, guarded, so a chain-built environment is
--    still corrected.
--
--    There is no user-scoped read here — this is operator configuration, so
--    service_role is the only legitimate consumer and no policy is needed. With
--    RLS on and no policy the table is default-deny for anon/authenticated even
--    if a default grant remains.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'audit_settings' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'ALTER TABLE public.audit_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.audit_settings FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE public.audit_settings FROM anon';
    EXECUTE 'REVOKE ALL ON TABLE public.audit_settings FROM authenticated';
    EXECUTE 'GRANT ALL ON TABLE public.audit_settings TO service_role';
  ELSE
    RAISE NOTICE 'audit_settings absent (expected in production); skipping';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Revoke client EXECUTE on the five unguarded / cost-bearing definers.
--    Guarded with pg_get_function_identity_arguments lookups so the migration
--    does not fail on an environment where a function was already dropped
--    out-of-band (the chain and production are known to diverge — see BA-0030,
--    BA-0048, BA-0049).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fn text;
  target text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'cleanup_old_audit_logs',
    'add_sample_class_times',
    'purge_deleted_records',
    'refresh_analytics_views',
    'cleanup_expired_webauthn_challenges'
  ]
  LOOP
    FOR target IN
      SELECT format('public.%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      WHERE p.pronamespace = 'public'::regnamespace
        AND p.proname = fn
    LOOP
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', target);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', target);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', target);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target);
    END LOOP;
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Pin search_path on every SECURITY DEFINER function in public that lacks
--    it. Catalog-driven rather than a hand-list, so a definer added later
--    without a pin is caught by the verification block below rather than
--    silently missed — which is how these eight accumulated.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  target text;
BEGIN
  FOR target IN
    SELECT format('public.%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prosecdef                                    -- SECURITY DEFINER
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) AS c(setting)
          WHERE c.setting LIKE 'search_path=%'
        )
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', target);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Verification. Fails the migration rather than reporting success on a
-- half-applied state, matching the pattern used by the 2026-07-29/30 hardening
-- migrations.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  unprotected int;
  unpinned int;
BEGIN
  -- audit_settings must now have RLS.
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.audit_settings'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'audit_settings still does not have RLS enabled';
  END IF;

  -- No public table may be left without RLS.
  SELECT count(*) INTO unprotected
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

  IF unprotected > 0 THEN
    RAISE EXCEPTION 'Tables in public without RLS: %', unprotected;
  END IF;

  -- No SECURITY DEFINER function in public may be left with an unpinned path.
  SELECT count(*) INTO unpinned
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.prosecdef
    AND (
      p.proconfig IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS c(setting)
        WHERE c.setting LIKE 'search_path=%'
      )
    );

  IF unpinned > 0 THEN
    RAISE EXCEPTION 'SECURITY DEFINER functions without a pinned search_path: %', unpinned;
  END IF;
END
$$;
