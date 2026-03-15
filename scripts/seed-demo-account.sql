-- ============================================================================
-- DEMO ACCOUNT SEED SCRIPT — Syllabus Sync
-- ============================================================================
-- Creates a fully populated demo account for stakeholder demonstrations.
--
-- USAGE:
--   1. Create the user first via Supabase Dashboard:
--      Authentication > Users > Add User (email + password)
--      Email: charanya.demo@mq.edu.au
--      Password: Demo2024!MQ
--      Check "Auto Confirm User"
--
--   2. Copy the user's UUID from the dashboard.
--
--   3. Replace the placeholder UUID below with the real one:
--      \set demo_uid '''<paste-uuid-here>'''
--
--   4. Run this script in the Supabase SQL Editor.
--
-- TO RESET: Run the cleanup section at the bottom first, then re-run the seed.
-- ============================================================================

-- ============================================================================
-- STEP 0: Set the demo user ID
-- ============================================================================
-- IMPORTANT: Replace this UUID with the actual user ID from Supabase Dashboard.
-- After creating the user in Dashboard > Authentication > Users,
-- click on the user to find their UUID.

DO $$
DECLARE
  v_uid uuid;
  v_now timestamptz := NOW();

  -- Unit IDs (fixed so we can reference them in class_times and deadlines)
  v_unit1 uuid := gen_random_uuid();
  v_unit2 uuid := gen_random_uuid();
  v_unit3 uuid := gen_random_uuid();
  v_unit4 uuid := gen_random_uuid();

BEGIN
  -- ========================================================================
  -- Look up the demo user by email
  -- ========================================================================
  SELECT id INTO v_uid FROM auth.users WHERE email = 'charanya.demo@mq.edu.au';

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Demo user not found. Create the user first via Supabase Dashboard with email: charanya.demo@mq.edu.au';
  END IF;

  RAISE NOTICE 'Seeding demo data for user: %', v_uid;

  -- ========================================================================
  -- STEP 1: Profile (upsert)
  -- ========================================================================
  INSERT INTO public.profiles (id, email, full_name, student_id, course, year, faculty, created_at, updated_at)
  VALUES (
    v_uid,
    'charanya.demo@mq.edu.au',
    'Charanya Ravi',
    '46012345',
    'Bachelor of Information Technology',
    '3',
    'Faculty of Science and Engineering',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name   = EXCLUDED.full_name,
    student_id  = EXCLUDED.student_id,
    course      = EXCLUDED.course,
    year        = EXCLUDED.year,
    faculty     = EXCLUDED.faculty,
    updated_at  = v_now;

  RAISE NOTICE '  ✓ Profile created/updated';

  -- ========================================================================
  -- STEP 2: User Preferences
  -- ========================================================================
  INSERT INTO public.user_preferences (user_id, theme, notifications_enabled, email_notifications,
    push_notifications, deadline_notifications_enabled, class_notifications_enabled,
    event_notifications_enabled, deadline_reminder_timing_minutes, class_reminder_timing_minutes,
    event_reminder_timing_minutes)
  VALUES (
    v_uid, 'system', true, true, true, true, true, true, 1440, 15, 60
  )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '  ✓ User preferences set';

  -- ========================================================================
  -- STEP 3: Gamification Profile
  -- ========================================================================
  INSERT INTO public.gamification_profiles (user_id, xp, streak_days, longest_streak, last_activity_date)
  VALUES (v_uid, 425, 7, 14, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    xp = 425,
    streak_days = 7,
    longest_streak = 14,
    last_activity_date = CURRENT_DATE;

  RAISE NOTICE '  ✓ Gamification profile set (Level ~4, 7-day streak)';

  -- ========================================================================
  -- STEP 4: Units (4 units with real MQ building IDs)
  -- ========================================================================
  -- Clean existing units for this user first (soft delete)
  UPDATE public.units SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.units (id, user_id, code, name, color, description, location, notification_enabled, created_at)
  VALUES
    (v_unit1, v_uid, 'COMP2350',
     'Computer Networks',
     '#3B82F6',
     'Network architectures, protocols, TCP/IP stack, and security fundamentals.',
     '{"building": "9WW", "room": "201"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit2, v_uid, 'ISYS3001',
     'Information Systems Management',
     '#10B981',
     'IT strategy, governance, enterprise architecture, and digital transformation.',
     '{"building": "4ER", "room": "303"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit3, v_uid, 'COMP3850',
     'Professional Practice in IT',
     '#8B5CF6',
     'Industry placement unit. Capstone project with real-world client engagement.',
     '{"building": "12WW", "room": "105"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit4, v_uid, 'STAT2372',
     'Applied Statistics',
     '#F59E0B',
     'Regression analysis, ANOVA, hypothesis testing, and statistical computing in R.',
     '{"building": "6WW", "room": "G02"}'::jsonb,
     true, v_now - INTERVAL '30 days');

  RAISE NOTICE '  ✓ 4 units created (COMP2350, ISYS3001, COMP3850, STAT2372)';

  -- ========================================================================
  -- STEP 5: Class Times (realistic weekly schedule)
  -- ========================================================================
  -- COMP2350: Mon lecture + Wed tutorial
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit1, 'Monday',    '09:00', '11:00'),
    (v_unit1, 'Wednesday', '14:00', '15:00');

  -- ISYS3001: Tue lecture + Thu workshop
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit2, 'Tuesday',  '10:00', '12:00'),
    (v_unit2, 'Thursday', '13:00', '15:00');

  -- COMP3850: Wed seminar + Fri lab
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit3, 'Wednesday', '10:00', '12:00'),
    (v_unit3, 'Friday',    '09:00', '11:00');

  -- STAT2372: Mon tutorial + Thu lecture
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit4, 'Monday',   '14:00', '15:00'),
    (v_unit4, 'Thursday', '10:00', '12:00');

  RAISE NOTICE '  ✓ 8 class time slots created across Mon–Fri';

  -- ========================================================================
  -- STEP 6: Deadlines (7 — mix of upcoming, completed, and types)
  -- ========================================================================
  UPDATE public.deadlines SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.deadlines (user_id, title, description, unit_code, due_date, priority, type,
    building, room, completed, notification_enabled, created_at)
  VALUES
    -- Upcoming
    (v_uid, 'Assignment 2: Network Protocol Analysis',
     'Analyse TCP handshake traces using Wireshark. Submit a report with packet captures.',
     'COMP2350', v_now + INTERVAL '4 days',  'High', 'Assignment',
     '9WW', '201', false, true, v_now - INTERVAL '14 days'),

    (v_uid, 'Quiz 3: Enterprise Architecture',
     'Online quiz covering TOGAF, Zachman frameworks, and EA governance.',
     'ISYS3001', v_now + INTERVAL '6 days',  'Medium', 'Quiz',
     '4ER', '303', false, true, v_now - INTERVAL '7 days'),

    (v_uid, 'Capstone Project Milestone 2',
     'Client requirements document and initial wireframes due. Present to supervisor.',
     'COMP3850', v_now + INTERVAL '12 days', 'High', 'Assignment',
     '12WW', '105', false, true, v_now - INTERVAL '21 days'),

    (v_uid, 'Midterm Exam: Applied Statistics',
     'Covers Weeks 1–6. Topics: probability, distributions, hypothesis testing, regression.',
     'STAT2372', v_now + INTERVAL '16 days', 'Urgent', 'Exam',
     '6WW', 'G02', false, true, v_now - INTERVAL '10 days'),

    (v_uid, 'IT Strategy Case Study Presentation',
     'Group presentation on digital transformation at a major Australian bank.',
     'ISYS3001', v_now + INTERVAL '20 days', 'Medium', 'Presentation',
     '4ER', '303', false, true, v_now - INTERVAL '5 days'),

    -- Completed
    (v_uid, 'Lab Report 1: TCP/IP Configuration',
     'Document network configuration steps and subnet calculations.',
     'COMP2350', v_now - INTERVAL '6 days',  'Medium', 'Assignment',
     '9WW', '201', true, false, v_now - INTERVAL '20 days'),

    (v_uid, 'Tutorial Worksheet: Probability Distributions',
     'Exercises on normal, binomial, and Poisson distributions using R.',
     'STAT2372', v_now - INTERVAL '3 days',  'Low', 'Assignment',
     '6WW', 'G02', true, false, v_now - INTERVAL '10 days');

  RAISE NOTICE '  ✓ 7 deadlines created (5 upcoming, 2 completed)';

  -- ========================================================================
  -- STEP 7: Events (12 — across all categories, valid buildings)
  -- ========================================================================
  UPDATE public.events SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.events (user_id, title, description, start_at, end_at, all_day,
    location, building, room, category, notification_enabled, created_at)
  VALUES
    -- ACADEMIC (3)
    (v_uid, 'AI & Machine Learning Workshop',
     'Hands-on workshop with TensorFlow and real-world datasets. Laptops required.',
     v_now + INTERVAL '3 days' + TIME '13:00', v_now + INTERVAL '3 days' + TIME '16:00',
     false, '9 Wally''s Walk, Building 9WW', '9WW', '201',
     'Academic', true, v_now - INTERVAL '5 days'),

    (v_uid, 'Research Skills Bootcamp',
     'Library-hosted session on academic databases, citation tools, and systematic reviews.',
     v_now + INTERVAL '5 days' + TIME '10:00', v_now + INTERVAL '5 days' + TIME '12:00',
     false, 'Waranara Library', 'LIB', NULL,
     'Academic', true, v_now - INTERVAL '3 days'),

    (v_uid, 'Cybersecurity Guest Lecture: Ethical Hacking',
     'Industry speaker from CrowdStrike on penetration testing and red-team operations.',
     v_now + INTERVAL '8 days' + TIME '14:00', v_now + INTERVAL '8 days' + TIME '16:00',
     false, '12 Wally''s Walk, Building 12WW', '12WW', '201',
     'Academic', true, v_now - INTERVAL '2 days'),

    -- CAREER (3)
    (v_uid, 'Tech Career Fair 2026',
     'Meet 50+ employers including Google, Atlassian, Canva, and Commonwealth Bank. Bring your resume.',
     v_now + INTERVAL '10 days' + TIME '10:00', v_now + INTERVAL '10 days' + TIME '16:00',
     false, '18 Wally''s Walk, Central Hub', '18WW', 'Atrium',
     'Career', true, v_now - INTERVAL '14 days'),

    (v_uid, 'Resume & LinkedIn Workshop',
     'Career advisors help polish your resume and LinkedIn profile. BYO laptop.',
     v_now + INTERVAL '6 days' + TIME '11:00', v_now + INTERVAL '6 days' + TIME '13:00',
     false, '4 Eastern Road, Business School', '4ER', '201',
     'Career', true, v_now - INTERVAL '7 days'),

    (v_uid, 'Google Engineering Info Session',
     'Hear from MQ alumni at Google about SWE internships and graduate programs.',
     v_now + INTERVAL '14 days' + TIME '17:00', v_now + INTERVAL '14 days' + TIME '19:00',
     false, 'Lotus Theatre', 'LOTUS', NULL,
     'Career', true, v_now - INTERVAL '10 days'),

    -- SOCIAL (3)
    (v_uid, 'International Student Mixer',
     'Meet students from around the world. Games, music, and free snacks.',
     v_now + INTERVAL '2 days' + TIME '17:00', v_now + INTERVAL '2 days' + TIME '20:00',
     false, 'UBar & Central Courtyard', 'UBAR', NULL,
     'Social', true, v_now - INTERVAL '4 days'),

    (v_uid, 'Trivia Night: Science & Tech Edition',
     'Teams of 4–6. Prizes for top 3 teams. Hosted by the Computing Society.',
     v_now + INTERVAL '7 days' + TIME '18:00', v_now + INTERVAL '7 days' + TIME '21:00',
     false, 'Macquarie Theatre', 'MQTH', NULL,
     'Social', true, v_now - INTERVAL '6 days'),

    (v_uid, 'Outdoor Movie Night: Campus Under the Stars',
     'Free screening on the sports fields. Bring a blanket. Popcorn provided.',
     v_now + INTERVAL '9 days' + TIME '19:00', v_now + INTERVAL '9 days' + TIME '22:00',
     false, 'Sports Fields', 'FIELDS', NULL,
     'Social', true, v_now - INTERVAL '3 days'),

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

    (v_uid, 'Welcome BBQ — Sport & Aquatic Centre',
     'Burgers, halal, and vegetarian options. Live music by student bands.',
     v_now + INTERVAL '11 days' + TIME '12:00', v_now + INTERVAL '11 days' + TIME '15:00',
     false, 'Sport & Aquatic Centre', 'SPORT', 'Outdoor Area',
     'Free Food', true, v_now - INTERVAL '8 days');

  RAISE NOTICE '  ✓ 12 events created (3 Academic, 3 Career, 3 Social, 3 Free Food)';

  -- ========================================================================
  -- STEP 8: Notifications (5 — mix of types and read states)
  -- ========================================================================
  DELETE FROM public.notifications WHERE user_id = v_uid;

  INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
  VALUES
    (v_uid, 'Welcome to Syllabus Sync!',
     'Your academic dashboard is ready. Add units, track deadlines, and explore campus events.',
     'system', true, v_now - INTERVAL '30 days'),

    (v_uid, 'Assignment Due in 4 Days',
     'Network Protocol Analysis (COMP2350) is due soon. Don''t forget to submit your Wireshark captures.',
     'deadline', false, v_now - INTERVAL '1 hour'),

    (v_uid, 'Tech Career Fair — 10 Days Away',
     'The Tech Career Fair 2026 is coming up. 50+ employers including Google and Atlassian.',
     'event', false, v_now - INTERVAL '6 hours'),

    (v_uid, 'COMP2350 Class Tomorrow',
     'Your Computer Networks lecture starts at 9:00 AM in 9WW Room 201.',
     'class', true, v_now - INTERVAL '1 day'),

    (v_uid, 'Level Up! You reached Level 4',
     'Keep up the momentum! Complete more deadlines to earn XP and climb the leaderboard.',
     'system', true, v_now - INTERVAL '3 days');

  RAISE NOTICE '  ✓ 5 notifications created';

  -- ========================================================================
  -- STEP 9: XP Events (audit trail for gamification)
  -- ========================================================================
  DELETE FROM public.xp_events WHERE user_id = v_uid;

  INSERT INTO public.xp_events (user_id, event_type, xp_amount, metadata, created_at)
  VALUES
    (v_uid, 'profile_completed', 50,  '{"field": "all"}'::jsonb,       v_now - INTERVAL '28 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "COMP2350"}'::jsonb,   v_now - INTERVAL '27 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "ISYS3001"}'::jsonb,   v_now - INTERVAL '27 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "COMP3850"}'::jsonb,   v_now - INTERVAL '26 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "STAT2372"}'::jsonb,   v_now - INTERVAL '26 days'),
    (v_uid, 'daily_login',       10,  '{"day": 1}'::jsonb,             v_now - INTERVAL '7 days'),
    (v_uid, 'daily_login',       10,  '{"day": 2}'::jsonb,             v_now - INTERVAL '6 days'),
    (v_uid, 'daily_login',       10,  '{"day": 3}'::jsonb,             v_now - INTERVAL '5 days'),
    (v_uid, 'daily_login',       10,  '{"day": 4}'::jsonb,             v_now - INTERVAL '4 days'),
    (v_uid, 'daily_login',       10,  '{"day": 5}'::jsonb,             v_now - INTERVAL '3 days'),
    (v_uid, 'streak_bonus',      25,  '{"streak": 5}'::jsonb,          v_now - INTERVAL '3 days'),
    (v_uid, 'daily_login',       10,  '{"day": 6}'::jsonb,             v_now - INTERVAL '2 days'),
    (v_uid, 'daily_login',       10,  '{"day": 7}'::jsonb,             v_now - INTERVAL '1 day'),
    (v_uid, 'deadline_completed',50,  '{"title": "Lab Report 1"}'::jsonb,      v_now - INTERVAL '6 days'),
    (v_uid, 'deadline_completed',50,  '{"title": "Tutorial Worksheet"}'::jsonb, v_now - INTERVAL '3 days'),
    (v_uid, 'level_up_bonus',    30,  '{"level": 4}'::jsonb,           v_now - INTERVAL '3 days');

  RAISE NOTICE '  ✓ 16 XP events logged (total 425 XP)';

  -- ========================================================================
  -- DONE
  -- ========================================================================
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'DEMO SEED COMPLETE for charanya.demo@mq.edu.au';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Profile:       Charanya Ravi — B. IT, Year 3, Sci & Eng';
  RAISE NOTICE 'Units:         4 (COMP2350, ISYS3001, COMP3850, STAT2372)';
  RAISE NOTICE 'Class Times:   8 slots (Mon–Fri)';
  RAISE NOTICE 'Deadlines:     7 (5 upcoming, 2 completed)';
  RAISE NOTICE 'Events:        12 (3 Academic, 3 Career, 3 Social, 3 Free Food)';
  RAISE NOTICE 'Gamification:  425 XP, Level ~4, 7-day streak';
  RAISE NOTICE 'Notifications: 5';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

END $$;
