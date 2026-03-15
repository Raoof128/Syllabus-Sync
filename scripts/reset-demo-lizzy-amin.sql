-- ============================================================================
-- RESET DEMO ACCOUNTS — Lizzy Clarkson & Amin Beheshti
-- ============================================================================
-- Cleans all seeded data for both demo users without deleting auth accounts.
-- Run this in Supabase SQL Editor BEFORE re-running the seed scripts.
--
-- Safe for production: only touches rows belonging to these two demo users.
-- ============================================================================

DO $$
DECLARE
  v_emails text[] := ARRAY['lizzy.demo@mq.edu.au', 'amin.demo@mq.edu.au'];
  v_email text;
  v_uid uuid;
  v_unit_ids uuid[];
BEGIN

  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

    IF v_uid IS NULL THEN
      RAISE NOTICE 'User % not found — skipping.', v_email;
      CONTINUE;
    END IF;

    RAISE NOTICE 'Resetting demo data for %: %', v_email, v_uid;

    -- Collect unit IDs for cascade cleanup
    SELECT array_agg(id) INTO v_unit_ids FROM public.units WHERE user_id = v_uid;

    -- Delete class_times (no soft delete on this table)
    IF v_unit_ids IS NOT NULL THEN
      DELETE FROM public.class_times WHERE unit_id = ANY(v_unit_ids);
      RAISE NOTICE '  ✓ Class times deleted';
    END IF;

    -- Hard-delete user-scoped data
    DELETE FROM public.units         WHERE user_id = v_uid;
    DELETE FROM public.deadlines     WHERE user_id = v_uid;
    DELETE FROM public.events        WHERE user_id = v_uid;
    DELETE FROM public.notifications WHERE user_id = v_uid;
    DELETE FROM public.xp_events     WHERE user_id = v_uid;
    DELETE FROM public.todos         WHERE user_id = v_uid;

    RAISE NOTICE '  ✓ Units, deadlines, events, notifications, XP events, todos deleted';

    -- Reset gamification profile
    UPDATE public.gamification_profiles
    SET xp = 0, streak_days = 0, longest_streak = 0, last_activity_date = NULL
    WHERE user_id = v_uid;

    RAISE NOTICE '  ✓ Gamification profile reset';

    -- Reset profile fields
    UPDATE public.profiles
    SET full_name  = NULL,
        student_id = NULL,
        course     = NULL,
        year       = NULL,
        faculty    = NULL,
        updated_at = NOW()
    WHERE id = v_uid;

    RAISE NOTICE '  ✓ Profile fields cleared';
    RAISE NOTICE '──────────────────────────────────────────';

  END LOOP;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'RESET COMPLETE — ready to re-seed with seed-demo-lizzy.sql';
  RAISE NOTICE '                                    and seed-demo-amin.sql';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

END $$;
