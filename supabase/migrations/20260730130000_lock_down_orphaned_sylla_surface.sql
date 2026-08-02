-- BA-0049 (P2): remove client reach from the orphaned `sylla_*` AI surface, and
-- put it on the record.
--
-- `sylla_ai_requests`, `sylla_active_generations` and four `sylla_*` functions
-- exist in production but appear in NO migration file and have NO calling code in
-- this repository. They were built for an AI chat/upload feature that has never
-- shipped — created directly against production, outside the migration workflow
-- the documentation describes as the source of truth. This migration is the first
-- record of them.
--
-- The two tables are inert: RLS is enabled with zero policies, so RLS
-- default-deny blocks client access even though both carry broad grants to `anon`
-- and `authenticated`.
--
-- The four functions are NOT inert. All are SECURITY DEFINER, which bypasses RLS
-- outright, and all four grant EXECUTE to `anon` and `authenticated`. Three take a
-- caller-supplied identifier with no ownership check — the same defect class as
-- BA-0029 and BA-0031:
--
--   sylla_reserve_chat_request(p_user_id, p_anon_id, p_ip_hash, ...)
--       burn another user's daily AI quota (anon_daily_limit is 3), or rotate
--       p_anon_id / p_ip_hash to evade one's own limit
--   sylla_reserve_upload_request(p_user_id)
--       consume another user's upload quota (limit 2/day)
--   sylla_finalize_request(p_request_id, p_status, tokens...)
--       mark another user's request succeeded/failed and set its token counts
--   sylla_cleanup_old_ai_requests()
--       let anyone trigger the 45-day retention delete
--
-- REACH IS REMOVED RATHER THAN OBJECTS DROPPED. `service_role` and `postgres`
-- keep full access, so the feature can still be developed and re-granting is a
-- single statement when it ships. Dropping would destroy work this repository
-- cannot see, which is not a call to make from here. Both tables are empty today,
-- so nothing is lost either way.
--
-- Idempotent: REVOKE only.

-- BA-0053: these objects exist only in production as unmanaged schema -- no
-- migration creates them -- so a bare REVOKE aborts every clean replay with
-- `relation "public.sylla_ai_requests" does not exist`. Guarded per object so
-- the lockdown still applies wherever the objects are present.
DO $$
BEGIN
  IF to_regclass('public.sylla_ai_requests') IS NOT NULL THEN
    REVOKE ALL ON TABLE public.sylla_ai_requests FROM anon, authenticated;
  END IF;
  IF to_regclass('public.sylla_active_generations') IS NOT NULL THEN
    REVOKE ALL ON TABLE public.sylla_active_generations FROM anon, authenticated;
  END IF;
END
$$;

-- BA-0053: these were bare REVOKEs naming exact signatures, which abort on any
-- database where the functions are absent -- every clean replay, since nothing
-- creates them. Resolved from the catalog instead, which is both runnable
-- everywhere and immune to the signature-mismatch no-op the block below already
-- guards against for sylla_finalize_request.
DO $$
DECLARE
  v_sig text;
BEGIN
  FOR v_sig IN
    SELECT 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'sylla%'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', v_sig);
    RAISE NOTICE 'BA-0049: revoked client EXECUTE on %', v_sig;
  END LOOP;
END
$$;

-- sylla_finalize_request's exact signature is resolved from the catalog: it takes
-- five arguments whose types were not asserted when this was written, and naming
-- them wrongly would make the REVOKE a silent no-op.
DO $$
DECLARE
  v_sig text;
BEGIN
  FOR v_sig IN
    SELECT 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sylla_finalize_request'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', v_sig);
    RAISE NOTICE 'BA-0049: revoked client EXECUTE on %', v_sig;
  END LOOP;
END
$$;

-- ============================================================================
-- Verification. Catalog-driven: covers every current and future sylla_* object,
-- so an object added later without a migration still fails this check.
-- ============================================================================

DO $$
DECLARE
  v_offending text;
BEGIN
  -- No sylla_* function may be executable by a client role or by PUBLIC.
  SELECT string_agg(DISTINCT p.proname, ', ')
  INTO v_offending
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
  LEFT JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND p.proname LIKE 'sylla%'
    AND acl.privilege_type = 'EXECUTE'
    AND (acl.grantee = 0 OR r.rolname IN ('anon', 'authenticated'));

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0049 verification failed: sylla_* functions still client-executable: %', v_offending;
  END IF;

  -- No sylla_* table may grant anything to a client role.
  SELECT string_agg(DISTINCT c.relname, ', ')
  INTO v_offending
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(c.relacl) AS acl
  JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname LIKE 'sylla%'
    AND r.rolname IN ('anon', 'authenticated');

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0049 verification failed: sylla_* tables still granted to client roles: %', v_offending;
  END IF;

  -- And service_role must retain access, or the feature becomes undevelopable.
  -- BA-0053: this assertion is only meaningful where the function exists. On a
  -- database without the unmanaged sylla_* surface -- every clean replay -- the
  -- NOT EXISTS is trivially true and the migration aborts claiming service_role
  -- "lost" a privilege it never held. Scoped to the present case so absence is
  -- a no-op while a genuine regression still fails loudly.
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sylla_reserve_chat_request'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
    JOIN pg_roles r ON r.oid = acl.grantee
    WHERE n.nspname = 'public' AND p.proname = 'sylla_reserve_chat_request'
      AND acl.privilege_type = 'EXECUTE' AND r.rolname = 'service_role'
  ) THEN
    RAISE EXCEPTION 'BA-0049 verification failed: service_role lost EXECUTE on sylla_reserve_chat_request';
  END IF;
END
$$;
