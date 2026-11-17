-- BA-0025 (P0): webauthn_challenges RLS policies are reachable by the anon key.
--
-- The three client-facing policies on `public.webauthn_challenges`
-- (20260207000000_add_webauthn_tables.sql, faithfully re-created rather than
-- fixed at 20260214003000_restore_missing_core_security_tables.sql):
--
--   CREATE POLICY "Users can view own challenges" ... USING (auth.uid() = user_id OR user_id IS NULL);
--   CREATE POLICY "Users can insert challenges" ... WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
--   CREATE POLICY "Users can delete own challenges" ... USING (auth.uid() = user_id OR user_id IS NULL);
--
-- have no `TO authenticated` clause, so they apply to PUBLIC -- which
-- includes the `anon` role. No table-level REVOKE narrows this back. Combined
-- with the `OR user_id IS NULL` branch (meant for pre-authentication
-- registration/login challenges), any unauthenticated caller can read,
-- insert, or delete every in-flight passkey ceremony system-wide via a plain
-- PostgREST call using the anon key shipped in the web bundle -- no account
-- required. An attacker can harvest challenge values or run a standing
-- `delete from webauthn_challenges where user_id is null` to deny service to
-- every user's passkey registration/login.
--
-- lib/security/webauthn.ts is the only code in this repo that touches this
-- table, and it does so exclusively via createAdminClient() (service_role),
-- which bypasses RLS entirely. These client-facing policies therefore serve
-- no legitimate purpose for the app as it exists today; the correct fix is to
-- remove them and leave only the service_role policy.
--
-- Idempotent: DROP POLICY IF EXISTS is safe to re-run.

DROP POLICY IF EXISTS "Users can view own challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Users can insert challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Users can delete own challenges" ON public.webauthn_challenges;

-- "Service role full access to challenges" (20260214003000) is untouched and
-- remains the only way to reach this table; service_role bypasses RLS
-- regardless, but the explicit policy documents intent.

-- Verification. Fails loudly rather than silently leaving the table
-- reachable by anon/authenticated via a stray policy with no TO clause.
DO $$
DECLARE
  offending text;
BEGIN
  SELECT string_agg(pol.policyname, ', ')
  INTO offending
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.tablename = 'webauthn_challenges'
    AND NOT (
      pol.roles IS NOT NULL
      AND pol.roles = ARRAY['service_role']::name[]
    );

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0025 verification failed: webauthn_challenges has policies reachable outside service_role: %', offending;
  END IF;
END
$$;
