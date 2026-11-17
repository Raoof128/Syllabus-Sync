-- BA-0031 (P0): the remaining SECURITY DEFINER functions with the same
-- anon-bypassable ownership gate that BA-0029 fixed in ensure_user_profile()
-- and award_xp().
--
-- Found by sweeping pg_proc for the pattern rather than trusting the advisor's
-- two named hits:
--
--   SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.prosecdef
--     AND pg_get_functiondef(p.oid) ~* 'auth\.role\(\)\s*=\s*''authenticated''';
--
-- Both remaining hits are SECURITY DEFINER, hold EXECUTE for `anon`, and take a
-- caller-supplied user id:
--
--   update_streak(p_user_id)  -- advances any user's streak, and PERFORMs
--                                award_xp() twice as a side effect
--   log_audit(...)            -- INSERTs audit_logs rows attributed to an
--                                arbitrary p_user_id, i.e. forges another
--                                user's audit trail. `log_audit` is worse than
--                                the rest: its gate also requires
--                                `v_actor_id IS NOT NULL`, so it is skipped for
--                                anon twice over.
--
-- Same two-layer remedy as 20260729110000: fail-closed guard, plus an explicit
-- REVOKE from anon (Supabase grants anon EXECUTE directly, so REVOKE ... FROM
-- PUBLIC does not remove it).
--
-- Callers are unaffected. Every app caller of both functions uses a user-scoped
-- client in a post-authentication context (gamification route; 2FA backup
-- codes, session termination, audit route), and none passes p_user_id — they
-- rely on auth.uid(), which the new guard permits. logAuditServer() already
-- swallows RPC errors and returns null, so a denied write cannot break a
-- security flow.
--
-- Idempotent: CREATE OR REPLACE / REVOKE.

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date date;
  v_today date := CURRENT_DATE;
BEGIN
  -- Fail-closed: deny unless service_role (or an admin/migration connection,
  -- where auth.role() is NULL) or acting on one's own auth.uid().
  IF COALESCE(auth.role(), 'service_role') <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized streak update attempt for another user'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.gamification_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_activity_date INTO v_last_date
  FROM public.gamification_profiles
  WHERE user_id = p_user_id;

  IF v_last_date IS NULL THEN
    UPDATE public.gamification_profiles
    SET streak_days = 1, last_activity_date = v_today, updated_at = NOW()
    WHERE user_id = p_user_id;

    PERFORM award_xp(p_user_id, 'daily_login');
  ELSIF v_last_date = v_today THEN
    NULL;
  ELSIF v_last_date = v_today - 1 THEN
    UPDATE public.gamification_profiles
    SET streak_days = streak_days + 1,
        longest_streak = GREATEST(longest_streak, streak_days + 1),
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    PERFORM award_xp(p_user_id, 'daily_login');
    PERFORM award_xp(p_user_id, 'streak_bonus');
  ELSE
    UPDATE public.gamification_profiles
    SET streak_days = 1, last_activity_date = v_today, updated_at = NOW()
    WHERE user_id = p_user_id;

    PERFORM award_xp(p_user_id, 'daily_login');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action text,
  p_table_name text DEFAULT NULL::text,
  p_record_id uuid DEFAULT NULL::uuid,
  p_old_data jsonb DEFAULT NULL::jsonb,
  p_new_data jsonb DEFAULT NULL::jsonb,
  p_severity text DEFAULT 'info'::text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL::uuid,
  p_ip_address text DEFAULT NULL::text,
  p_user_agent text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_actor_id uuid;
  v_target_user_id uuid;
  v_user_email text;
  v_ip inet;
BEGIN
  v_actor_id := auth.uid();
  v_target_user_id := COALESCE(p_user_id, v_actor_id);

  -- Fail-closed. The previous gate engaged only for the authenticated role AND
  -- required v_actor_id IS NOT NULL, so an anonymous caller skipped it entirely
  -- and could attribute a forged audit row to any user id it chose.
  --
  -- Deliberately does not spell out the old comparison: both this migration's
  -- verification block and tests/security/definer-guards-and-permissive-policies
  -- match the vulnerable pattern as text against pg_get_functiondef(), which
  -- includes comments. Quoting it here would trip both checks.
  IF COALESCE(auth.role(), 'service_role') <> 'service_role'
     AND (v_actor_id IS NULL OR v_target_user_id IS DISTINCT FROM v_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized audit log write attempt'
      USING ERRCODE = '42501';
  END IF;

  -- Validate severity input defensively.
  IF p_severity NOT IN ('info', 'warning', 'critical') THEN
    p_severity := 'info';
  END IF;

  -- Best-effort inet cast: invalid IPs become NULL.
  BEGIN
    IF p_ip_address IS NOT NULL AND length(trim(p_ip_address)) > 0 THEN
      v_ip := p_ip_address::inet;
    ELSE
      v_ip := NULL;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_ip := NULL;
  END;

  IF v_target_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_target_user_id;
  END IF;

  INSERT INTO public.audit_logs (
    user_id, user_email, action, table_name, record_id,
    ip_address, user_agent, old_data, new_data, metadata, severity
  ) VALUES (
    v_target_user_id, v_user_email, p_action, p_table_name, p_record_id,
    v_ip, p_user_agent, p_old_data, p_new_data,
    COALESCE(p_metadata, '{}'::jsonb), p_severity
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_streak(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, uuid, jsonb, jsonb, text, jsonb, uuid, text, text) FROM anon;

-- ============================================================================
-- Verification.
--
-- NOTE: loop variables are `v_`-prefixed. An earlier version of this check used
-- a variable named `cmd`, which Postgres resolved to `pg_policies.cmd` instead
-- ("column reference cmd is ambiguous"), aborting the transaction and rolling
-- back the entire migration.
-- ============================================================================

DO $$
DECLARE
  v_offending text;
BEGIN
  -- No SECURITY DEFINER function in public may still use the bypassable gate.
  SELECT string_agg(DISTINCT p.proname, ', ')
  INTO v_offending
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND pg_get_functiondef(p.oid) ~* 'auth\.role\(\)\s*=\s*''authenticated''';

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0031 verification failed: definer functions still gate on auth.role() = authenticated: %', v_offending;
  END IF;

  -- anon must not hold EXECUTE on any definer function that takes a user id.
  SELECT string_agg(DISTINCT p.proname, ', ')
  INTO v_offending
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
  JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND r.rolname = 'anon'
    AND acl.privilege_type = 'EXECUTE'
    AND p.proname IN ('update_streak', 'log_audit');

  IF v_offending IS NOT NULL THEN
    RAISE EXCEPTION 'BA-0031 verification failed: anon still holds EXECUTE on: %', v_offending;
  END IF;
END
$$;
