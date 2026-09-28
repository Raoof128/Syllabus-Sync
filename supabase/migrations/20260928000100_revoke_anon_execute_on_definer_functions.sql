-- BA-0060 (P2): SECURITY DEFINER functions executable by anon under Supabase's
-- default privileges — including the rate-limit store.
--
-- Supabase provisions `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON
-- FUNCTIONS TO anon, authenticated, service_role`, so every function a
-- migration creates is granted to `anon` DIRECTLY. Several migrations then
-- "lock down" a function with `REVOKE ... FROM PUBLIC` only
-- (20260217093000_rate_limits.sql, 20260216090000_harden_security_functions.sql),
-- which removes the pseudo-role grant and leaves the direct one intact. It is
-- the function-level twin of BA-0055, and the reason BA-0032 had to revoke
-- log_audit from `anon` by name.
--
-- The 2026-08-02 audit recorded "ratelimit_* not client-callable" as REFUTED.
-- That check ran against a replay whose bootstrap did not reproduce Supabase's
-- default function grant. Rebuilt with it (tools/database/verify-fresh-build.sh
-- now does), the anon role can:
--
--   SELECT ratelimit_set('login:<ip-hash>', 0, 0, 0);   -- zero any limiter key
--   SELECT ratelimit_increment('<victim-key>', 60000);  -- or exhaust one
--
-- i.e. bypass brute-force protection on sign-in, MFA and password reset, or
-- lock a user out, whenever the Postgres store is the active rate-limit backend
-- (lib/services/rateLimitService.ts selects it whenever the Upstash/KV
-- variables are absent). The app only ever calls these through the
-- service-role client, so client roles have no legitimate use for them.
--
-- The other definer functions anon could reach all refuse a NULL auth.uid()
-- (verified by replay: no data returned or modified), so for those this is
-- defence in depth. Rather than enumerate them — enumerated lists are how this
-- project keeps missing the next instance — revoke anon from every definer
-- function in `public`.
--
-- Idempotent: REVOKE.

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, PUBLIC', fn);
  END LOOP;
END
$$;

-- Server-only: the rate-limit store is used exclusively by the service-role
-- client, so signed-in users must not be able to reset their own limits either.
REVOKE EXECUTE ON FUNCTION public.ratelimit_get(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ratelimit_set(text, integer, bigint, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ratelimit_increment(text, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() FROM authenticated;

-- Verification: no definer function may be executable by anon, directly or via
-- PUBLIC; and the rate-limit store must not be reachable by any client role.
DO $$
DECLARE
  v_anon text;
  v_ratelimit text;
BEGIN
  SELECT string_agg(p.oid::regprocedure::text, ', ')
  INTO v_anon
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE');

  IF v_anon IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0060 verification failed: anon can execute definer functions: %', v_anon;
  END IF;

  SELECT string_agg(p.proname, ', ')
  INTO v_ratelimit
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('ratelimit_get', 'ratelimit_set', 'ratelimit_increment',
                      'cleanup_expired_rate_limits')
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

  IF v_ratelimit IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0060 verification failed: authenticated can execute: %', v_ratelimit;
  END IF;
END
$$;
