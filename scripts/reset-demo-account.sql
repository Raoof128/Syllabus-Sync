-- ============================================================================
-- RESET DEMO ACCOUNT — Syllabus Sync
-- ============================================================================
-- Cleans all seeded data for the demo user without deleting the auth account.
-- Run this in Supabase SQL Editor BEFORE re-running seed-demo-account.sql.
--
-- Safe for production: only touches rows belonging to the demo user.
-- ============================================================================

DO $$
DECLARE
  v_uid uuid;
  v_unit_ids uuid[];
BEGIN
  -- Find the demo user
  SELECT id INTO v_uid FROM auth.users WHERE email = 'charanya.demo@mq.edu.au';

  IF v_uid IS NULL THEN
    RAISE NOTICE 'Demo user not found — nothing to reset.';
    RETURN;
  END IF;

  RAISE NOTICE 'Resetting demo data for user: %', v_uid;

  -- Collect unit IDs for cascade cleanup
  SELECT array_agg(id) INTO v_unit_ids FROM public.units WHERE user_id = v_uid;

  -- Delete class_times (no soft delete on this table)
  IF v_unit_ids IS NOT NULL THEN
    DELETE FROM public.class_times WHERE unit_id = ANY(v_unit_ids);
    RAISE NOTICE '  ✓ Class times deleted';
  END IF;

  -- Hard-delete user-scoped data (avoids soft-deleted clutter on re-seed)
  DELETE FROM public.units         WHERE user_id = v_uid;
  DELETE FROM public.deadlines     WHERE user_id = v_uid;
  DELETE FROM public.events        WHERE user_id = v_uid;
  DELETE FROM public.notifications WHERE user_id = v_uid;
  DELETE FROM public.xp_events     WHERE user_id = v_uid;
  DELETE FROM public.todos         WHERE user_id = v_uid;

  RAISE NOTICE '  ✓ Units, deadlines, events, notifications, XP events, todos deleted';

  -- Reset gamification profile (keep row, zero out values)
  UPDATE public.gamification_profiles
  SET xp = 0, streak_days = 0, longest_streak = 0, last_activity_date = NULL
  WHERE user_id = v_uid;

  RAISE NOTICE '  ✓ Gamification profile reset';

  -- Reset profile fields (keep the row, clear optional fields)
  UPDATE public.profiles
  SET full_name  = NULL,
      student_id = NULL,
      course     = NULL,
      year       = NULL,
      faculty    = NULL,
      updated_at = NOW()
  WHERE id = v_uid;

  RAISE NOTICE '  ✓ Profile fields cleared';

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'DEMO RESET COMPLETE — ready to re-seed with seed-demo-account.sql';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

END $$;
