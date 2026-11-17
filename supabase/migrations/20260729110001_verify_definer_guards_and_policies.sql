-- BA-0029 + BA-0030 verification.
--
-- Separate file only because 20260729110000 had already been applied by the time
-- this block was debugged, so it could no longer be edited in place.
--
-- These checks first failed with `column reference "cmd" is ambiguous`: the
-- PL/pgSQL loop variables `tbl`/`cmd` collided with `pg_policies.tbl`/`.cmd`
-- inside the EXISTS subquery. Postgres resolves the column, not the variable,
-- and errors out. They are prefixed `v_` below. The failure aborted the
-- enclosing transaction, which is why the first push attempt rolled back
-- wholesale and looked like a visibility problem rather than a plain bug.
--
-- Read-only: raises or does nothing. Safe to re-run.

-- ============================================================================
-- Verification. Fails loudly rather than silently leaving either vector live.
-- ============================================================================

DO $$
DECLARE
  offending text;
  fn_body text;
  v_tbl text;
  v_cmd text;
BEGIN
  -- Part A.1: neither guarded function may still gate on auth.role() = 'authenticated'.
  FOR fn_body IN
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('ensure_user_profile', 'award_xp')
  LOOP
    IF fn_body ~* 'auth\.role\(\)\s*=\s*''authenticated''' THEN
      RAISE EXCEPTION 'BA-0029 verification failed: a definer function still gates on auth.role() = authenticated';
    END IF;
    IF fn_body !~* 'auth\.uid\(\)\s+IS\s+NULL' THEN
      RAISE EXCEPTION 'BA-0029 verification failed: a definer function is missing its NULL-uid rejection';
    END IF;
  END LOOP;

  -- Part A.2: anon must hold EXECUTE on none of them.
  SELECT string_agg(DISTINCT p.proname, ', ')
  INTO offending
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
  JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND r.rolname = 'anon'
    AND acl.privilege_type = 'EXECUTE'
    AND p.proname IN (
      'ensure_user_profile', 'award_xp', 'get_xp_leaderboard',
      'get_my_deadline_analytics', 'get_my_activity_summary',
      'ensure_my_gamification_profile'
    );

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0029 verification failed: anon still holds EXECUTE on: %', offending;
  END IF;

  -- Part B.1: no permissive policy on these tables may be unconditionally true.
  SELECT string_agg(pol.tablename || '.' || pol.policyname, ', ')
  INTO offending
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.tablename IN ('events', 'deadlines', 'units', 'class_times')
    AND pol.permissive = 'PERMISSIVE'
    AND (
      btrim(COALESCE(pol.qual, '')) = 'true'
      OR btrim(COALESCE(pol.with_check, '')) = 'true'
    );

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0030 verification failed: always-true policies remain: %', offending;
  END IF;

  -- Part B.2: and each table must still have a usable owner-scoped policy for
  -- every command, so this migration cannot have locked users out of their
  -- own data.
  FOREACH v_tbl IN ARRAY ARRAY['events', 'deadlines', 'units', 'class_times'] LOOP
    FOREACH v_cmd IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies pol
        WHERE pol.schemaname = 'public' AND pol.tablename = v_tbl AND pol.cmd = v_cmd
          AND (COALESCE(pol.qual, '') || COALESCE(pol.with_check, '')) ~* 'auth\.uid\(\)'
      ) THEN
        RAISE EXCEPTION 'BA-0030 verification failed: % has no auth.uid()-scoped % policy left', v_tbl, v_cmd;
      END IF;
    END LOOP;
  END LOOP;
END
$$;
