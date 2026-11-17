-- BA-0048 (P0): every authenticated user could read every user's profile.
--
-- `public.profiles` carried `profiles_select`: PERMISSIVE, FOR SELECT, role
-- `public` (which includes `authenticated`), `USING (true)` — sitting alongside
-- the correct `"Users can view their own profile"` with `USING (auth.uid() = id)`.
-- Postgres ORs permissive policies together, so the unconditional one won and the
-- ownership check was dead weight. `authenticated` holds the table-level SELECT
-- grant, so the exposure was reachable by anyone with an account.
--
-- PROVEN against production 2026-07-30: a throwaway account created seconds
-- earlier read 30 profile rows — every user's email and full name, plus 16
-- student IDs.
--
-- This audit missed it twice, and both misses had the same cause:
--   * BA-0021 concluded "no live PII exposure" from `public.user_details`, the
--     view, which genuinely is secured. The base table's policies were never
--     checked.
--   * BA-0030 dropped always-true policies from the four tables Supabase's
--     advisor named (events, deadlines, units, class_times) rather than sweeping
--     the catalog. `profiles` has the identical defect.
-- Trusting a derived object, or a supplied list, over the catalog. The
-- verification below therefore sweeps every table in `public`.
--
-- Idempotent: DROP POLICY IF EXISTS.

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

-- `"Users can view their own profile"` (authenticated, USING auth.uid() = id) is
-- retained and is now the only SELECT path. Every read in the codebase is already
-- self-scoped — app/api/profiles/route.ts and app/auth/callback/route.ts both
-- filter `.eq('id', <caller>)`, and /api/health uses the service-role client — so
-- nothing legitimate depended on the unconditional policy.

-- ============================================================================
-- Verification: catalog sweep, not a table list.
--
-- Fails if ANY table in `public` has a PERMISSIVE policy whose USING or
-- WITH CHECK is unconditionally true AND is reachable by a client role.
--
-- `xp_config` is the one deliberate exception: it holds the XP-per-event-type
-- lookup (no user data), and every authenticated client is meant to read it to
-- render the gamification UI. It is allow-listed by name so that the sweep stays
-- exhaustive for everything else rather than being weakened to accommodate it.
-- ============================================================================

DO $$
DECLARE
  v_offending text;
BEGIN
  SELECT string_agg(
           pol.tablename || '.' || pol.policyname ||
           ' [' || array_to_string(pol.roles, ',') || ' ' || pol.cmd || ']',
           ', ' ORDER BY pol.tablename, pol.policyname
         )
  INTO v_offending
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.permissive = 'PERMISSIVE'
    AND (
      btrim(COALESCE(pol.qual, '')) = 'true'
      OR btrim(COALESCE(pol.with_check, '')) = 'true'
    )
    AND (
      'public' = ANY(pol.roles)
      OR 'anon' = ANY(pol.roles)
      OR 'authenticated' = ANY(pol.roles)
    )
    AND pol.tablename <> 'xp_config';

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0048 verification failed: unconditional client-reachable policies remain: %', v_offending;
  END IF;

  -- And profiles must still be readable by its owner.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'
      AND COALESCE(qual, '') ~* 'auth\.uid\(\)'
  ) THEN
    RAISE EXCEPTION 'BA-0048 verification failed: profiles has no owner-scoped SELECT policy left';
  END IF;
END
$$;
