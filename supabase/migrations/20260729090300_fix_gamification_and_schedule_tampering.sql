-- BA-0026 (P1): three independent tampering vectors reported together by Lane D.
--
-- Idempotent throughout: REVOKE/DROP POLICY/CREATE OR REPLACE/guarded index
-- creation are all safe to re-run.

-- ============================================================================
-- Part A: gamification_profiles permits self-service XP tampering.
--
-- "Users can update their own gamification profile" only checks
-- `auth.uid() = user_id`, not which columns/values are written, and
-- `GRANT SELECT, INSERT, UPDATE ... TO authenticated`
-- (20260124000000_complete_schema_initialization.sql:276,334) lets a client
-- bypass award_xp()/update_streak() entirely:
--   supabase.from('gamification_profiles').update({ xp: 999999999 })
-- 20260214000000_harden_gamification_rpc.sql hardened the RPC functions but
-- never touched this table-level grant, so the direct-write path stayed open.
--
-- Fix: revoke direct INSERT/UPDATE from authenticated. award_xp()/
-- update_streak() are SECURITY DEFINER and run as the table owner, which
-- bypasses RLS/grants regardless of what authenticated is revoked -- so the
-- legitimate mutation path is unaffected.
-- ============================================================================

REVOKE INSERT, UPDATE ON public.gamification_profiles FROM authenticated;

DROP POLICY IF EXISTS "Users can insert their own gamification profile" ON public.gamification_profiles;
DROP POLICY IF EXISTS "Users can update their own gamification profile" ON public.gamification_profiles;

-- The revoke above breaks one legitimate caller: app/api/gamification/route.ts
-- lazily creates a missing profile with a direct
-- `.from('gamification_profiles').insert({ user_id })` on a user-scoped client,
-- which runs as `authenticated`. Without a replacement, a first-time profile
-- fetch would 500 for any user lacking a row (BA-0028).
--
-- This is the narrowest possible replacement: it takes no arguments, so the
-- caller cannot name a victim, and it creates a row only for auth.uid() —
-- closing the write path without reopening the BA-0022 IDOR. It cannot be used
-- to set xp/streak values; those remain the exclusive province of award_xp()
-- and update_streak().
CREATE OR REPLACE FUNCTION public.ensure_my_gamification_profile()
RETURNS SETOF public.gamification_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.gamification_profiles (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
    SELECT * FROM public.gamification_profiles WHERE user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_gamification_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_gamification_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_my_gamification_profile() TO service_role;

-- ============================================================================
-- Part B: on_deadline_completed() permits double/duplicate XP awards.
--
-- The trigger (20260114014506_schema_cleanup_and_normalization.sql) fires
-- award_xp('deadline_completed'/'deadline_early') on every false->true
-- transition of deadlines.completed, and nothing stops a user from toggling
-- it false then true again via the normal API to re-earn XP indefinitely.
-- xp_events never had a UNIQUE constraint on (user_id, event_type, reference_id).
--
-- Fix: a UNIQUE index as a schema-level backstop, plus an idempotency check
-- inside award_xp() itself so a duplicate call is a no-op rather than racing
-- the index (and gives a clean, catchable response instead of a constraint
-- violation for legitimate double-submits, e.g. a retried request).
-- ============================================================================

-- Production already holds 6 rows that violate this constraint: three pairs,
-- all written at 2026-01-30 06:14:12 within a 2.6-second window — one
-- double-submitted request, not XP farming. An unconditional unique index
-- would abort this migration.
--
-- The index is therefore bounded to events written from this migration
-- onwards. Deleting the historical rows was considered and rejected: it would
-- leave that user's xp_events ledger summing to 60 XP less than their
-- gamification_profiles.xp balance, and correcting the balance instead would
-- visibly remove XP (and possibly a level) from a real user to tidy up a
-- four-month-old bug that has already been paid out.
CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_events_user_event_ref
  ON public.xp_events (user_id, event_type, reference_id)
  WHERE reference_id IS NOT NULL
    AND created_at > TIMESTAMPTZ '2026-07-29 11:40:00+00';

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
  -- Authenticated callers may only mutate their own profile.
  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized XP award attempt for another user'
      USING ERRCODE = '42501';
  END IF;

  -- Idempotency guard: a given (user, event_type, reference_id) may only be
  -- awarded once. Backed by uq_xp_events_user_event_ref as a hard constraint.
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

REVOKE ALL ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) TO service_role;

-- ============================================================================
-- Part C: schedule_members permits reassignment to arbitrary users/roles.
--
-- "Schedule owners can update members" (20260220100000_realtime_offline.sql)
-- has USING (schedule_id IN (owner's schedules)) and no WITH CHECK, so
-- Postgres reuses USING for the new row too -- user_id and role are
-- completely unconstrained. A schedule owner can:
--   update schedule_members set user_id = '<arbitrary-uuid>', role = 'owner'
-- to hijack a membership row or self-grant co-ownership.
--
-- Fix: WITH CHECK blocks self-granting 'owner' through a bare UPDATE. RLS
-- predicates cannot compare OLD vs NEW columns on their own, so a BEFORE
-- UPDATE trigger blocks reassigning an existing row's user_id outside of
-- service_role (the RLS ownership predicate already limits *who* can reach
-- this trigger to begin with).
-- ============================================================================

DROP POLICY IF EXISTS "Schedule owners can update members" ON public.schedule_members;
CREATE POLICY "Schedule owners can update members"
  ON public.schedule_members FOR UPDATE
  USING (
    schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid())
    AND role <> 'owner'
  );

CREATE OR REPLACE FUNCTION public.prevent_schedule_member_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Reassigning a schedule membership to a different user is not allowed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schedule_members_prevent_reassignment ON public.schedule_members;
CREATE TRIGGER schedule_members_prevent_reassignment
  BEFORE UPDATE ON public.schedule_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_schedule_member_reassignment();

-- Verification. Fails loudly rather than silently leaving any of the three
-- vectors live.
DO $$
DECLARE
  fn_body text;
BEGIN
  -- Part A: authenticated must not hold INSERT/UPDATE on gamification_profiles.
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL aclexplode(c.relacl) AS acl
    JOIN pg_roles r ON r.oid = acl.grantee
    WHERE n.nspname = 'public' AND c.relname = 'gamification_profiles'
      AND r.rolname = 'authenticated'
      AND acl.privilege_type IN ('INSERT', 'UPDATE')
  ) THEN
    RAISE EXCEPTION 'BA-0026a verification failed: authenticated can still INSERT/UPDATE gamification_profiles';
  END IF;

  -- Part B: award_xp must contain the idempotency guard, and the unique index must exist.
  SELECT pg_get_functiondef(p.oid)
  INTO fn_body
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'award_xp';

  IF fn_body IS NULL OR fn_body !~* 'already_awarded' THEN
    RAISE EXCEPTION 'BA-0026b verification failed: award_xp is missing its idempotency guard';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uq_xp_events_user_event_ref'
  ) THEN
    RAISE EXCEPTION 'BA-0026b verification failed: uq_xp_events_user_event_ref index is missing';
  END IF;

  -- Part C: the update policy must carry a WITH CHECK, and the trigger must exist.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schedule_members'
      AND policyname = 'Schedule owners can update members'
      AND with_check IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'BA-0026c verification failed: schedule_members update policy has no WITH CHECK';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'schedule_members'
      AND t.tgname = 'schedule_members_prevent_reassignment'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'BA-0026c verification failed: reassignment-prevention trigger is missing';
  END IF;
END
$$;
