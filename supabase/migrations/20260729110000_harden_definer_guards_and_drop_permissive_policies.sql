-- BA-0029 (P0) + BA-0030 (P0): found by running `supabase db advisors` against
-- production after the first five audit migrations landed, then confirmed with
-- live probes using only the publishable anon key.
--
-- Idempotent throughout: DROP POLICY IF EXISTS / REVOKE / CREATE OR REPLACE.

-- ============================================================================
-- Part A (BA-0029): `auth.role() = 'authenticated'` guards are skipped for anon.
--
-- ensure_user_profile() and award_xp() are SECURITY DEFINER and guard with:
--
--     IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id
--
-- For an anonymous caller auth.role() is 'anon', so the condition is false and
-- the guard never fires. Crucially, `REVOKE ALL ON FUNCTION ... FROM PUBLIC`
-- does NOT shut this out: Supabase grants EXECUTE to `anon` and `authenticated`
-- explicitly, and revoking PUBLIC leaves those direct grants untouched. The
-- earlier migrations in this audit assumed otherwise.
--
-- Proven against production 2026-07-29 with the anon key alone:
--   POST /rest/v1/rpc/award_xp {"p_user_id":"<any>","p_event_type":"<bogus>"}
--   -> {"code":"P0001","message":"Unknown XP event type: ..."}
-- Reaching the event-type lookup proves the ownership guard was bypassed. With
-- a valid event type this awards XP to an arbitrary user; the same shape against
-- ensure_user_profile overwrites any user's profile email.
--
-- Fix is two-layered:
--   1. Make the guard fail-closed — deny unless the caller is service_role (or
--      an admin/migration connection, where auth.role() is NULL) or is acting
--      on its own auth.uid().
--   2. Revoke EXECUTE from anon explicitly, so the anon key cannot reach these
--      functions at all.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Fail-closed. COALESCE covers admin/migration/pg_cron connections, where
    -- auth.role() is NULL and there is no JWT to check.
    IF COALESCE(auth.role(), 'service_role') <> 'service_role'
       AND (auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id) THEN
        RAISE EXCEPTION 'Unauthorized profile write attempt' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (p_user_id, p_email, COALESCE(p_full_name, ''), NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    INSERT INTO public.gamification_profiles (user_id, xp, streak_days, longest_streak, created_at, updated_at)
    VALUES (p_user_id, 0, 0, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_event_type text,
  p_reference_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_xp integer;
  v_xp_amount integer;
  v_old_xp integer;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
  v_streak_days integer;
  v_level_up_bonus integer;
BEGIN
  -- Fail-closed; see ensure_user_profile above.
  IF COALESCE(auth.role(), 'service_role') <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized XP award attempt for another user'
      USING ERRCODE = '42501';
  END IF;

  -- Idempotency guard (BA-0026b): a given (user, event_type, reference_id) may
  -- only be awarded once. Deliberately unbounded by date, unlike the backing
  -- index, so it also covers rows predating this audit.
  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.xp_events
    WHERE user_id = p_user_id
      AND event_type = p_event_type
      AND reference_id = p_reference_id
  ) THEN
    RETURN jsonb_build_object('xp_awarded', 0, 'already_awarded', true);
  END IF;

  SELECT base_xp INTO v_base_xp FROM public.xp_config WHERE event_type = p_event_type;
  IF v_base_xp IS NULL THEN
    RAISE EXCEPTION 'Unknown XP event type: %', p_event_type;
  END IF;

  v_xp_amount := v_base_xp;

  INSERT INTO public.gamification_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT xp, streak_days INTO v_old_xp, v_streak_days
  FROM public.gamification_profiles
  WHERE user_id = p_user_id;

  v_old_level := calculate_level(v_old_xp);

  IF p_event_type = 'streak_bonus' AND v_streak_days > 0 THEN
    v_xp_amount := v_base_xp * v_streak_days;
  END IF;

  v_new_xp := v_old_xp + v_xp_amount;
  v_new_level := calculate_level(v_new_xp);

  INSERT INTO public.xp_events (user_id, event_type, xp_amount, reference_id, metadata)
  VALUES (p_user_id, p_event_type, v_xp_amount, p_reference_id, p_metadata);

  UPDATE public.gamification_profiles
  SET xp = v_new_xp, updated_at = NOW()
  WHERE user_id = p_user_id;

  IF v_new_level > v_old_level THEN
    v_level_up_bonus := 10 * v_new_level;

    INSERT INTO public.xp_events (user_id, event_type, xp_amount, metadata)
    VALUES (
      p_user_id,
      'level_up_bonus',
      v_level_up_bonus,
      jsonb_build_object('old_level', v_old_level, 'new_level', v_new_level)
    );

    UPDATE public.gamification_profiles
    SET xp = xp + v_level_up_bonus, updated_at = NOW()
    WHERE user_id = p_user_id;

    v_new_xp := v_new_xp + v_level_up_bonus;
  END IF;

  RETURN jsonb_build_object(
    'xp_awarded', v_xp_amount,
    'old_xp', v_old_xp,
    'new_xp', v_new_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'already_awarded', false
  );
END;
$$;

-- Layer 2: take the anon key off every definer function that reads or writes
-- user data. get_my_* and ensure_my_* already no-op for a NULL auth.uid(), but
-- get_xp_leaderboard would otherwise serve the top-100 roster to the open
-- internet, and defence in depth is the point.
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_xp_leaderboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_deadline_analytics() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_activity_summary() FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_my_gamification_profile() FROM anon;

-- ============================================================================
-- Part B (BA-0030): duplicate permissive policies with USING (true).
--
-- events, deadlines, units and class_times each carry BOTH a correct
-- owner-scoped policy AND a `<table>_{select,insert,update,delete}` policy whose
-- USING/WITH CHECK is literally `true` (public.<table> policies from
-- 20260104000000_initial_schema.sql). Postgres ORs permissive policies
-- together, so the always-true one wins outright and the owner check is dead
-- weight: any authenticated user can UPDATE or DELETE any other user's rows.
--
-- 20260114011650 dropped some of these, but production still has all sixteen —
-- the migration chain and the live database disagree, so this migration is
-- written to act on the database as it actually is, and verifies the result.
--
-- Reads are not presently reachable by anon (it holds no table-level SELECT
-- grant on these four; PostgREST returns 401/42501), but the policies are
-- removed regardless so a future grant cannot silently open them.
--
-- Every command retains an owner-scoped equivalent, verified below:
--   events      : "Users can {view,insert,update,delete} their own events"
--   deadlines   : "Users can {view,insert,update,delete} their own deadlines"
--   units       : "Users can {view,insert,update,delete} their own units"
--   class_times : "Users can {view,insert,update,delete} class_times for their units"
-- ============================================================================

DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

DROP POLICY IF EXISTS "deadlines_select" ON public.deadlines;
DROP POLICY IF EXISTS "deadlines_insert" ON public.deadlines;
DROP POLICY IF EXISTS "deadlines_update" ON public.deadlines;
DROP POLICY IF EXISTS "deadlines_delete" ON public.deadlines;

DROP POLICY IF EXISTS "units_select" ON public.units;
DROP POLICY IF EXISTS "units_insert" ON public.units;
DROP POLICY IF EXISTS "units_update" ON public.units;
DROP POLICY IF EXISTS "units_delete" ON public.units;

DROP POLICY IF EXISTS "class_times_select" ON public.class_times;
DROP POLICY IF EXISTS "class_times_insert" ON public.class_times;
DROP POLICY IF EXISTS "class_times_update" ON public.class_times;
DROP POLICY IF EXISTS "class_times_delete" ON public.class_times;

-- Verification lives in 20260729110001. It was originally at the foot of this
-- file, but contained a bug (a PL/pgSQL loop variable named `cmd` shadowed by
-- `pg_policies.cmd`) that aborted the transaction and rolled the whole push
-- back. By the time that was diagnosed this migration had already been applied,
-- so the corrected checks live in the following migration rather than here.
