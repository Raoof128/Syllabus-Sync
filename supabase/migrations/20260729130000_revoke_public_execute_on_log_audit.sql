-- BA-0032 (P2): log_audit() is still reachable by anon via a PUBLIC grant.
--
-- 20260729120000 revoked EXECUTE from `anon` and made the guard fail-closed.
-- The guard holds — an anon probe against production returned
-- `42501 Unauthorized audit log write attempt` — but it reached the function
-- body to get there, which means the grant layer did not stop it.
--
-- Cause: log_audit carries an explicit grant to PUBLIC, which `anon` inherits.
-- Revoking from `anon` removes only the direct grant and leaves PUBLIC intact.
-- Every other definer function in this audit ends at
-- `authenticated, postgres, service_role`; log_audit is the outlier.
--
-- This also fixes a blind spot in the previous migration's own verification: it
-- joined aclexplode() to pg_roles to look for 'anon', but a PUBLIC grant has
-- grantee = 0 and joins to no role at all, so it passed while PUBLIC was still
-- granted. The check below counts grantee = 0 explicitly.
--
-- Idempotent: REVOKE.

REVOKE EXECUTE ON FUNCTION public.log_audit(
  text, text, uuid, jsonb, jsonb, text, jsonb, uuid, text, text
) FROM PUBLIC;

-- Verification: no definer function touched by this audit may be executable by
-- anon, either directly or by inheriting a PUBLIC grant.
DO $$
DECLARE
  v_offending text;
BEGIN
  SELECT string_agg(DISTINCT p.proname || ' (' ||
           CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE 'anon' END || ')', ', ')
  INTO v_offending
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
  LEFT JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND acl.privilege_type = 'EXECUTE'
    AND (acl.grantee = 0 OR r.rolname = 'anon')
    AND p.proname IN (
      'log_audit', 'update_streak', 'award_xp', 'ensure_user_profile',
      'get_xp_leaderboard', 'get_my_deadline_analytics',
      'get_my_activity_summary', 'ensure_my_gamification_profile'
    );

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0032 verification failed: anon can still execute: %', v_offending;
  END IF;
END
$$;
