-- ============================================================================
-- DEMO ACCOUNT SEED — Lizzy Clarkson (Student)
-- ============================================================================
-- USAGE:
--   1. Create user in Supabase Dashboard > Authentication > Users > Add User
--      Email: lizzy.demo@mq.edu.au   Password: Demo2024!MQ
--      Check "Auto Confirm User"
--   2. Run this script in the Supabase SQL Editor.
--   3. To reset: run reset-demo-lizzy.sql first, then re-run this.
-- ============================================================================

DO $$
DECLARE
  v_uid uuid;
  v_now timestamptz := NOW();

  v_unit1 uuid := gen_random_uuid();
  v_unit2 uuid := gen_random_uuid();
  v_unit3 uuid := gen_random_uuid();
  v_unit4 uuid := gen_random_uuid();

BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'lizzy.demo@mq.edu.au';

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'User not found. Create the user first in Supabase Dashboard with email: lizzy.demo@mq.edu.au';
  END IF;

  RAISE NOTICE 'Seeding demo data for Lizzy Clarkson: %', v_uid;

  -- ========================================================================
  -- Profile
  -- ========================================================================
  INSERT INTO public.profiles (id, email, full_name, student_id, course, year, faculty, created_at, updated_at)
  VALUES (
    v_uid,
    'lizzy.demo@mq.edu.au',
    'Lizzy Clarkson',
    '46023456',
    'Bachelor of Computing (Cyber Security)',
    '2',
    'Faculty of Science and Engineering',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    student_id = EXCLUDED.student_id,
    course     = EXCLUDED.course,
    year       = EXCLUDED.year,
    faculty    = EXCLUDED.faculty,
    updated_at = v_now;

  RAISE NOTICE '  ✓ Profile created/updated';

  -- ========================================================================
  -- User Preferences
  -- ========================================================================
  INSERT INTO public.user_preferences (user_id, theme, notifications_enabled, email_notifications,
    push_notifications, deadline_notifications_enabled, class_notifications_enabled,
    event_notifications_enabled, deadline_reminder_timing_minutes, class_reminder_timing_minutes,
    event_reminder_timing_minutes)
  VALUES (v_uid, 'system', true, true, true, true, true, true, 1440, 15, 60)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '  ✓ User preferences set';

  -- ========================================================================
  -- Gamification Profile
  -- ========================================================================
  INSERT INTO public.gamification_profiles (user_id, xp, streak_days, longest_streak, last_activity_date)
  VALUES (v_uid, 310, 5, 11, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    xp = 310, streak_days = 5, longest_streak = 11, last_activity_date = CURRENT_DATE;

  RAISE NOTICE '  ✓ Gamification profile set (Level ~3, 5-day streak)';

  -- ========================================================================
  -- Units (4 units — Cyber Security focus)
  -- ========================================================================
  UPDATE public.units SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.units (id, user_id, code, name, color, description, location, notification_enabled, created_at)
  VALUES
    (v_unit1, v_uid, 'COMP1350',
     'IT Security Fundamentals',
     '#EF4444',
     'Introduction to information security: cryptography, access control, network security, risk management.',
     '{"building": "9WW", "room": "104"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit2, v_uid, 'COMP2250',
     'Data Structures and Algorithms',
     '#3B82F6',
     'Arrays, linked lists, trees, graphs, sorting, searching, complexity analysis.',
     '{"building": "12WW", "room": "210"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit3, v_uid, 'MATH1020',
     'Linear Algebra',
     '#F59E0B',
     'Vectors, matrices, systems of equations, eigenvalues, and applications to computing.',
     '{"building": "6WW", "room": "G02"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit4, v_uid, 'COMP2050',
     'Software Engineering',
     '#10B981',
     'Software development lifecycle, Agile methodology, testing, version control, and teamwork.',
     '{"building": "4ER", "room": "305"}'::jsonb,
     true, v_now - INTERVAL '30 days');

  RAISE NOTICE '  ✓ 4 units created (COMP1350, COMP2250, MATH1020, COMP2050)';

  -- ========================================================================
  -- Class Times
  -- ========================================================================
  -- COMP1350: Mon lecture + Wed lab
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit1, 'Monday',    '11:00', '13:00'),
    (v_unit1, 'Wednesday', '09:00', '11:00');

  -- COMP2250: Tue lecture + Thu tutorial
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit2, 'Tuesday',  '13:00', '15:00'),
    (v_unit2, 'Thursday', '09:00', '10:00');

  -- MATH1020: Mon tutorial + Wed lecture
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit3, 'Monday',    '15:00', '16:00'),
    (v_unit3, 'Wednesday', '13:00', '15:00');

  -- COMP2050: Tue workshop + Fri lecture
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit4, 'Tuesday',  '09:00', '11:00'),
    (v_unit4, 'Friday',   '10:00', '12:00');

  RAISE NOTICE '  ✓ 8 class time slots created across Mon–Fri';

  -- ========================================================================
  -- Deadlines (7 — mix of upcoming & completed)
  -- ========================================================================
  UPDATE public.deadlines SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.deadlines (user_id, title, description, unit_code, due_date, priority, type,
    building, room, completed, notification_enabled, created_at)
  VALUES
    -- Upcoming
    (v_uid, 'Assignment 2: Symmetric Encryption Lab',
     'Implement AES-256 encryption and decryption in Python. Include test vectors and a write-up on key management.',
     'COMP1350', v_now + INTERVAL '5 days', 'High', 'Assignment',
     '9WW', '104', false, true, v_now - INTERVAL '14 days'),

    (v_uid, 'Lab 4: Binary Search Trees',
     'Implement BST insertion, deletion, and traversal. Analyse time complexity for each operation.',
     'COMP2250', v_now + INTERVAL '7 days', 'Medium', 'Assignment',
     '12WW', '210', false, true, v_now - INTERVAL '7 days'),

    (v_uid, 'Quiz 2: Matrix Operations',
     'Online quiz on matrix multiplication, determinants, and inverse matrices.',
     'MATH1020', v_now + INTERVAL '10 days', 'Medium', 'Quiz',
     '6WW', 'G02', false, true, v_now - INTERVAL '5 days'),

    (v_uid, 'Sprint 2 Demo: Team Project',
     'Present sprint deliverables to the tutor. Show working user stories with unit tests.',
     'COMP2050', v_now + INTERVAL '14 days', 'High', 'Presentation',
     '4ER', '305', false, true, v_now - INTERVAL '10 days'),

    (v_uid, 'Midterm Exam: IT Security',
     'Covers Weeks 1–6. Topics: cryptographic protocols, access control models, threat modelling.',
     'COMP1350', v_now + INTERVAL '18 days', 'Urgent', 'Exam',
     '9WW', '104', false, true, v_now - INTERVAL '3 days'),

    -- Completed
    (v_uid, 'Assignment 1: Caesar Cipher',
     'Implemented Caesar cipher with frequency analysis for decryption.',
     'COMP1350', v_now - INTERVAL '5 days', 'Medium', 'Assignment',
     '9WW', '104', true, false, v_now - INTERVAL '20 days'),

    (v_uid, 'Tutorial 3: Eigenvalues Practice',
     'Exercises on eigenvalue computation and diagonalisation.',
     'MATH1020', v_now - INTERVAL '3 days', 'Low', 'Assignment',
     '6WW', 'G02', true, false, v_now - INTERVAL '10 days');

  RAISE NOTICE '  ✓ 7 deadlines created (5 upcoming, 2 completed)';

  -- ========================================================================
  -- Events (12 — across all categories)
  -- ========================================================================
  UPDATE public.events SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.events (user_id, title, description, start_at, end_at, all_day,
    location, building, room, category, notification_enabled, created_at)
  VALUES
    -- ACADEMIC (3)
    (v_uid, 'Capture the Flag: Intro to CTFs',
     'Beginner-friendly CTF competition hosted by the MQ Cyber Society. No experience needed.',
     v_now + INTERVAL '3 days' + TIME '14:00', v_now + INTERVAL '3 days' + TIME '18:00',
     false, '9 Wally''s Walk, 9WW', '9WW', '104',
     'Academic', true, v_now - INTERVAL '5 days'),

    (v_uid, 'Algorithms Problem-Solving Session',
     'Weekly drop-in for COMP2250 students. Practice LeetCode-style problems with tutors.',
     v_now + INTERVAL '5 days' + TIME '16:00', v_now + INTERVAL '5 days' + TIME '18:00',
     false, '12 Wally''s Walk, 12WW', '12WW', '210',
     'Academic', true, v_now - INTERVAL '3 days'),

    (v_uid, 'Academic Writing Workshop',
     'Library session on structuring technical reports and referencing standards.',
     v_now + INTERVAL '8 days' + TIME '10:00', v_now + INTERVAL '8 days' + TIME '12:00',
     false, 'Waranara Library', 'LIB', NULL,
     'Academic', true, v_now - INTERVAL '4 days'),

    -- CAREER (3)
    (v_uid, 'Tech Career Fair 2026',
     'Meet 50+ employers including Google, Atlassian, Canva, and Commonwealth Bank. Bring your resume.',
     v_now + INTERVAL '10 days' + TIME '10:00', v_now + INTERVAL '10 days' + TIME '16:00',
     false, '18 Wally''s Walk, Central Hub', '18WW', 'Atrium',
     'Career', true, v_now - INTERVAL '14 days'),

    (v_uid, 'Women in Cyber — Panel Discussion',
     'Hear from women working in cybersecurity at CrowdStrike, ASD, and Commonwealth Bank.',
     v_now + INTERVAL '6 days' + TIME '17:00', v_now + INTERVAL '6 days' + TIME '19:00',
     false, 'Lotus Theatre', 'LOTUS', NULL,
     'Career', true, v_now - INTERVAL '8 days'),

    (v_uid, 'CrowdStrike Internship Info Night',
     'Learn about cybersecurity internships and graduate roles at CrowdStrike APAC.',
     v_now + INTERVAL '13 days' + TIME '18:00', v_now + INTERVAL '13 days' + TIME '20:00',
     false, '4 Eastern Road, Business School', '4ER', '201',
     'Career', true, v_now - INTERVAL '6 days'),

    -- SOCIAL (3)
    (v_uid, 'Computing Society Games Night',
     'Board games, Mario Kart tournament, and snacks. All welcome!',
     v_now + INTERVAL '2 days' + TIME '17:00', v_now + INTERVAL '2 days' + TIME '20:00',
     false, 'UBar & Central Courtyard', 'UBAR', NULL,
     'Social', true, v_now - INTERVAL '4 days'),

    (v_uid, 'Outdoor Movie Night: Campus Under the Stars',
     'Free screening on the sports fields. Bring a blanket. Popcorn provided.',
     v_now + INTERVAL '9 days' + TIME '19:00', v_now + INTERVAL '9 days' + TIME '22:00',
     false, 'Sports Fields', 'FIELDS', NULL,
     'Social', true, v_now - INTERVAL '3 days'),

    (v_uid, 'International Student Mixer',
     'Meet students from around the world. Games, music, and free snacks.',
     v_now + INTERVAL '7 days' + TIME '17:00', v_now + INTERVAL '7 days' + TIME '20:00',
     false, 'Macquarie Theatre', 'MQTH', NULL,
     'Social', true, v_now - INTERVAL '5 days'),

    -- FREE FOOD (3)
    (v_uid, 'Pizza Friday — Engineering Society',
     'Free pizza for all engineering and computing students. Vegan options available.',
     v_now + INTERVAL '4 days' + TIME '12:00', v_now + INTERVAL '4 days' + TIME '13:30',
     false, '9 Wally''s Walk, Engineering', '9WW', 'Foyer',
     'Free Food', true, v_now - INTERVAL '2 days'),

    (v_uid, 'Free Coffee Week — Library Cafe',
     'One free barista coffee per student per day. Just show your student ID.',
     v_now + INTERVAL '1 day', v_now + INTERVAL '5 days',
     true, 'Library Cafe', 'LIBCAFE', NULL,
     'Free Food', true, v_now - INTERVAL '1 day'),

    (v_uid, 'Cyber Society Welcome BBQ',
     'Meet the MQ Cyber Security Society. Burgers, halal, and veg options.',
     v_now + INTERVAL '11 days' + TIME '12:00', v_now + INTERVAL '11 days' + TIME '14:00',
     false, 'Sport & Aquatic Centre', 'SPORT', 'Outdoor Area',
     'Free Food', true, v_now - INTERVAL '7 days');

  RAISE NOTICE '  ✓ 12 events created (3 Academic, 3 Career, 3 Social, 3 Free Food)';

  -- ========================================================================
  -- Notifications
  -- ========================================================================
  DELETE FROM public.notifications WHERE user_id = v_uid;

  INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
  VALUES
    (v_uid, 'Welcome to Syllabus Sync!',
     'Your academic dashboard is ready. Add units, track deadlines, and explore campus events.',
     'system', true, v_now - INTERVAL '30 days'),

    (v_uid, 'Assignment Due in 5 Days',
     'Symmetric Encryption Lab (COMP1350) is due soon. Don''t forget to submit!',
     'deadline', false, v_now - INTERVAL '2 hours'),

    (v_uid, 'CTF Competition — 3 Days Away',
     'Capture the Flag beginner event at 9WW Room 104. No experience needed!',
     'event', false, v_now - INTERVAL '5 hours'),

    (v_uid, 'COMP2250 Lecture Tomorrow',
     'Data Structures and Algorithms starts at 1:00 PM in 12WW Room 210.',
     'class', true, v_now - INTERVAL '1 day'),

    (v_uid, 'Level Up! You reached Level 3',
     'Keep going! Complete more deadlines and log in daily to earn XP.',
     'system', true, v_now - INTERVAL '4 days');

  RAISE NOTICE '  ✓ 5 notifications created';

  -- ========================================================================
  -- XP Events
  -- ========================================================================
  DELETE FROM public.xp_events WHERE user_id = v_uid;

  INSERT INTO public.xp_events (user_id, event_type, xp_amount, metadata, created_at)
  VALUES
    (v_uid, 'profile_completed', 50,  '{"field": "all"}'::jsonb,        v_now - INTERVAL '28 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "COMP1350"}'::jsonb,    v_now - INTERVAL '27 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "COMP2250"}'::jsonb,    v_now - INTERVAL '27 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "MATH1020"}'::jsonb,    v_now - INTERVAL '26 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "COMP2050"}'::jsonb,    v_now - INTERVAL '26 days'),
    (v_uid, 'daily_login',       10,  '{"day": 1}'::jsonb,              v_now - INTERVAL '5 days'),
    (v_uid, 'daily_login',       10,  '{"day": 2}'::jsonb,              v_now - INTERVAL '4 days'),
    (v_uid, 'daily_login',       10,  '{"day": 3}'::jsonb,              v_now - INTERVAL '3 days'),
    (v_uid, 'daily_login',       10,  '{"day": 4}'::jsonb,              v_now - INTERVAL '2 days'),
    (v_uid, 'daily_login',       10,  '{"day": 5}'::jsonb,              v_now - INTERVAL '1 day'),
    (v_uid, 'streak_bonus',      25,  '{"streak": 5}'::jsonb,           v_now - INTERVAL '1 day'),
    (v_uid, 'deadline_completed',50,  '{"title": "Caesar Cipher"}'::jsonb,     v_now - INTERVAL '5 days'),
    (v_uid, 'deadline_completed',50,  '{"title": "Eigenvalues Practice"}'::jsonb, v_now - INTERVAL '3 days'),
    (v_uid, 'level_up_bonus',    30,  '{"level": 3}'::jsonb,            v_now - INTERVAL '3 days');

  RAISE NOTICE '  ✓ 14 XP events logged (total 310 XP, missing 45 XP from misc)';

  -- ========================================================================
  -- DONE
  -- ========================================================================
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'DEMO SEED COMPLETE for lizzy.demo@mq.edu.au';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Profile:       Lizzy Clarkson — B. Computing (Cyber Security), Year 2';
  RAISE NOTICE 'Units:         4 (COMP1350, COMP2250, MATH1020, COMP2050)';
  RAISE NOTICE 'Class Times:   8 slots (Mon–Fri)';
  RAISE NOTICE 'Deadlines:     7 (5 upcoming, 2 completed)';
  RAISE NOTICE 'Events:        12 (3 Academic, 3 Career, 3 Social, 3 Free Food)';
  RAISE NOTICE 'Gamification:  310 XP, Level ~3, 5-day streak';
  RAISE NOTICE 'Notifications: 5';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

END $$;
