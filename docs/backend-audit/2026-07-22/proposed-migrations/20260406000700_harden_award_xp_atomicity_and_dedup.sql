-- ============================================================================
-- SECURITY / INTEGRITY FIX (Lane D audit, P1-8 + P2-13)
-- ----------------------------------------------------------------------------
-- P1-8: on_deadline_completed() fires on every false->true transition of
-- deadlines.completed, and the standard deadlines UPDATE policy lets the
-- owner toggle `completed` freely. Since xp_events only had a non-unique
-- index on (user_id, event_type, reference_id), a user could repeatedly
-- toggle completed=false/true on the same deadline to farm unlimited
-- 'deadline_completed'/'deadline_early' XP.
--
-- P2-13: award_xp()/update_streak() (final version, 20260214000000) read
-- gamification_profiles.xp into a variable, compute v_new_xp in PL/pgSQL,
-- then UPDATE ... SET xp = v_new_xp -- a non-atomic read-then-write that can
-- lose an update under concurrent calls for the same user.
--
-- Fix, in one migration since both touch award_xp():
--   1. Add a partial UNIQUE index on xp_events(user_id, event_type,
--      reference_id) WHERE reference_id IS NOT NULL as a hard DB-level
--      backstop against duplicate awards for the same (user, event, thing).
--   2. Redefine award_xp() to short-circuit (no-op, xp_awarded: 0) if that
--      exact award already exists, and to use an atomic `xp = xp + amount`
--      UPDATE ... RETURNING instead of read-then-write, closing the lost-
--      update race.
-- ============================================================================

-- Clean up any pre-existing duplicate award rows before adding the unique
-- index, otherwise CREATE UNIQUE INDEX would fail. Keep the earliest row per
-- (user_id, event_type, reference_id) and drop the rest. This is the only
-- reasonable automatic remediation for data that should never have existed;
-- it does NOT touch gamification_profiles.xp (already-awarded totals stand),
-- it only de-duplicates the audit-log rows going forward.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'xp_events'
  ) THEN
    DELETE FROM public.xp_events x
    WHERE x.reference_id IS NOT NULL
      AND x.id NOT IN (
        SELECT DISTINCT ON (user_id, event_type, reference_id) id
        FROM public.xp_events
        WHERE reference_id IS NOT NULL
        ORDER BY user_id, event_type, reference_id, created_at ASC, id ASC
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_events_user_event_ref
  ON public.xp_events (user_id, event_type, reference_id)
  WHERE reference_id IS NOT NULL;

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

  -- Idempotency guard: never award the same (user, event_type, reference_id)
  -- twice. Backstopped by uq_xp_events_user_event_ref for concurrent callers.
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
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_old_level := calculate_level(v_old_xp);

  IF p_event_type = 'streak_bonus' AND v_streak_days > 0 THEN
    v_xp_amount := v_base_xp * v_streak_days;
  END IF;

  -- Insert the audit row first; if a concurrent caller raced us and already
  -- inserted the same (user, event_type, reference_id) row, the unique index
  -- raises unique_violation and we treat it as "already awarded" rather than
  -- double-crediting gamification_profiles.xp below.
  BEGIN
    INSERT INTO public.xp_events (user_id, event_type, xp_amount, reference_id, metadata)
    VALUES (p_user_id, p_event_type, v_xp_amount, p_reference_id, p_metadata);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('xp_awarded', 0, 'already_awarded', true);
  END;

  -- Atomic increment (no read-then-write lost-update race).
  UPDATE public.gamification_profiles
  SET xp = xp + v_xp_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING xp INTO v_new_xp;

  v_new_level := calculate_level(v_new_xp);

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
    WHERE user_id = p_user_id
    RETURNING xp INTO v_new_xp;
  END IF;

  RETURN jsonb_build_object(
    'xp_awarded', v_xp_amount,
    'old_xp', v_old_xp,
    'new_xp', v_new_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) TO service_role;

COMMENT ON FUNCTION public.award_xp(uuid, text, uuid, jsonb) IS
  'Ownership-checked, idempotent (per user/event_type/reference_id), atomic '
  'XP award. See Lane D audit P1-8 (duplicate award) and P2-13 (lost-update '
  'race).';
