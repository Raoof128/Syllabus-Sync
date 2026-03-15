-- ============================================================================
-- DEMO ACCOUNT SEED — Amin Beheshti (Student)
-- ============================================================================
-- USAGE:
--   1. Create user in Supabase Dashboard > Authentication > Users > Add User
--      Email: amin.demo@mq.edu.au   Password: Demo2024!MQ
--      Check "Auto Confirm User"
--   2. Run this script in the Supabase SQL Editor.
--   3. To reset: run reset-demo-professors.sql first, then re-run this.
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
  SELECT id INTO v_uid FROM auth.users WHERE email = 'amin.demo@mq.edu.au';

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'User not found. Create the user first in Supabase Dashboard with email: amin.demo@mq.edu.au';
  END IF;

  RAISE NOTICE 'Seeding demo data for Amin Beheshti: %', v_uid;

  -- ========================================================================
  -- Profile
  -- ========================================================================
  INSERT INTO public.profiles (id, email, full_name, student_id, course, year, faculty, created_at, updated_at)
  VALUES (
    v_uid,
    'amin.demo@mq.edu.au',
    'Amin Beheshti',
    '46034567',
    'Master of Data Science',
    '1',
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
  VALUES (v_uid, 'dark', true, true, true, true, true, true, 1440, 15, 60)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '  ✓ User preferences set';

  -- ========================================================================
  -- Gamification Profile
  -- ========================================================================
  INSERT INTO public.gamification_profiles (user_id, xp, streak_days, longest_streak, last_activity_date)
  VALUES (v_uid, 520, 9, 16, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    xp = 520, streak_days = 9, longest_streak = 16, last_activity_date = CURRENT_DATE;

  RAISE NOTICE '  ✓ Gamification profile set (Level ~4, 9-day streak)';

  -- ========================================================================
  -- Units (4 units — Data Science focus)
  -- ========================================================================
  UPDATE public.units SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.units (id, user_id, code, name, color, description, location, notification_enabled, created_at)
  VALUES
    (v_unit1, v_uid, 'DATA2001',
     'Data Science',
     '#8B5CF6',
     'Introduction to data science pipelines: data wrangling, exploratory analysis, visualisation, and reproducibility.',
     '{"building": "4ER", "room": "303"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit2, v_uid, 'COMP6210',
     'Big Data Technologies',
     '#EF4444',
     'Hadoop, Spark, NoSQL databases, distributed computing, and scalable data processing.',
     '{"building": "9WW", "room": "201"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit3, v_uid, 'STAT2170',
     'Statistical Modelling',
     '#3B82F6',
     'Regression, GLMs, model diagnostics, and Bayesian approaches using R.',
     '{"building": "6WW", "room": "G02"}'::jsonb,
     true, v_now - INTERVAL '30 days'),

    (v_unit4, v_uid, 'COMP6200',
     'Machine Learning',
     '#10B981',
     'Supervised and unsupervised learning, neural networks, evaluation metrics, and scikit-learn.',
     '{"building": "12WW", "room": "105"}'::jsonb,
     true, v_now - INTERVAL '30 days');

  RAISE NOTICE '  ✓ 4 units created (DATA2001, COMP6210, STAT2170, COMP6200)';

  -- ========================================================================
  -- Class Times
  -- ========================================================================
  -- DATA2001: Mon lecture + Wed lab
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit1, 'Monday',    '10:00', '12:00'),
    (v_unit1, 'Wednesday', '14:00', '16:00');

  -- COMP6210: Tue lecture + Thu lab
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit2, 'Tuesday',  '14:00', '16:00'),
    (v_unit2, 'Thursday', '10:00', '12:00');

  -- STAT2170: Mon tutorial + Wed lecture
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit3, 'Monday',    '14:00', '15:00'),
    (v_unit3, 'Wednesday', '10:00', '12:00');

  -- COMP6200: Tue workshop + Fri lecture
  INSERT INTO public.class_times (unit_id, day, start_time, end_time) VALUES
    (v_unit4, 'Tuesday',  '10:00', '12:00'),
    (v_unit4, 'Friday',   '09:00', '11:00');

  RAISE NOTICE '  ✓ 8 class time slots created across Mon–Fri';

  -- ========================================================================
  -- Deadlines (7 — mix of upcoming & completed)
  -- ========================================================================
  UPDATE public.deadlines SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.deadlines (user_id, title, description, unit_code, due_date, priority, type,
    building, room, completed, notification_enabled, created_at)
  VALUES
    -- Upcoming
    (v_uid, 'Assignment 2: Exploratory Data Analysis',
     'Use Python/Pandas to clean, explore, and visualise the Melbourne Housing dataset. Submit a Jupyter notebook.',
     'DATA2001', v_now + INTERVAL '4 days', 'High', 'Assignment',
     '4ER', '303', false, true, v_now - INTERVAL '14 days'),

    (v_uid, 'Lab 3: Spark RDD Operations',
     'Implement word count, filtering, and aggregation using PySpark. Compare performance with pandas.',
     'COMP6210', v_now + INTERVAL '6 days', 'Medium', 'Assignment',
     '9WW', '201', false, true, v_now - INTERVAL '7 days'),

    (v_uid, 'Quiz 2: Regression Diagnostics',
     'Online quiz covering residual analysis, multicollinearity, influential observations, and model selection.',
     'STAT2170', v_now + INTERVAL '9 days', 'Medium', 'Quiz',
     '6WW', 'G02', false, true, v_now - INTERVAL '5 days'),

    (v_uid, 'Project Proposal: ML Classification',
     'Submit a 2-page proposal for the ML group project. Define the problem, dataset, and baseline model.',
     'COMP6200', v_now + INTERVAL '13 days', 'High', 'Assignment',
     '12WW', '105', false, true, v_now - INTERVAL '10 days'),

    (v_uid, 'Midterm Exam: Big Data Technologies',
     'Covers Hadoop ecosystem, MapReduce paradigm, Spark architecture, and NoSQL data models.',
     'COMP6210', v_now + INTERVAL '18 days', 'Urgent', 'Exam',
     '9WW', '201', false, true, v_now - INTERVAL '3 days'),

    -- Completed
    (v_uid, 'Assignment 1: Data Wrangling Pipeline',
     'Built an ETL pipeline to clean and transform ABS census data using Python.',
     'DATA2001', v_now - INTERVAL '6 days', 'Medium', 'Assignment',
     '4ER', '303', true, false, v_now - INTERVAL '20 days'),

    (v_uid, 'Tutorial 2: Simple Linear Regression',
     'Exercises on fitting regression models, interpreting coefficients, and R-squared.',
     'STAT2170', v_now - INTERVAL '4 days', 'Low', 'Assignment',
     '6WW', 'G02', true, false, v_now - INTERVAL '11 days');

  RAISE NOTICE '  ✓ 7 deadlines created (5 upcoming, 2 completed)';

  -- ========================================================================
  -- Events (12 — across all categories)
  -- ========================================================================
  UPDATE public.events SET deleted_at = v_now WHERE user_id = v_uid AND deleted_at IS NULL;

  INSERT INTO public.events (user_id, title, description, start_at, end_at, all_day,
    location, building, room, category, notification_enabled, created_at)
  VALUES
    -- ACADEMIC (3)
    (v_uid, 'Kaggle Competition Kickoff',
     'MQ Data Science Society hosts a campus-wide Kaggle challenge. Form teams of 3-5.',
     v_now + INTERVAL '3 days' + TIME '15:00', v_now + INTERVAL '3 days' + TIME '18:00',
     false, '4 Eastern Road, 4ER', '4ER', '303',
     'Academic', true, v_now - INTERVAL '6 days'),

    (v_uid, 'Research Seminar: LLMs and Data Governance',
     'Guest speaker from CSIRO on responsible AI and large language model governance frameworks.',
     v_now + INTERVAL '7 days' + TIME '14:00', v_now + INTERVAL '7 days' + TIME '16:00',
     false, 'Lotus Theatre', 'LOTUS', NULL,
     'Academic', true, v_now - INTERVAL '10 days'),

    (v_uid, 'R Workshop: Advanced ggplot2',
     'Library-hosted workshop on publication-quality data visualisation with ggplot2 and plotly.',
     v_now + INTERVAL '5 days' + TIME '10:00', v_now + INTERVAL '5 days' + TIME '12:00',
     false, 'Waranara Library', 'LIB', NULL,
     'Academic', true, v_now - INTERVAL '4 days'),

    -- CAREER (3)
    (v_uid, 'Tech Career Fair 2026',
     'Meet 50+ employers including Google, Atlassian, Canva, and Commonwealth Bank. Bring your resume.',
     v_now + INTERVAL '10 days' + TIME '10:00', v_now + INTERVAL '10 days' + TIME '16:00',
     false, '18 Wally''s Walk, Central Hub', '18WW', 'Atrium',
     'Career', true, v_now - INTERVAL '14 days'),

    (v_uid, 'Data Engineering Careers Panel',
     'Panellists from Canva, Atlassian, and Westpac discuss career paths in data engineering.',
     v_now + INTERVAL '8 days' + TIME '17:00', v_now + INTERVAL '8 days' + TIME '19:00',
     false, '4 Eastern Road, Business School', '4ER', '201',
     'Career', true, v_now - INTERVAL '8 days'),

    (v_uid, 'Google Summer of Code Info Session',
     'Learn about GSoC projects, application tips, and hear from past MQ participants.',
     v_now + INTERVAL '14 days' + TIME '16:00', v_now + INTERVAL '14 days' + TIME '18:00',
     false, '12 Wally''s Walk, 12WW', '12WW', '201',
     'Career', true, v_now - INTERVAL '7 days'),

    -- SOCIAL (3)
    (v_uid, 'Data Science Society Games Night',
     'Board games, data trivia, and prizes. Pizza and drinks provided.',
     v_now + INTERVAL '2 days' + TIME '17:00', v_now + INTERVAL '2 days' + TIME '20:00',
     false, 'UBar & Central Courtyard', 'UBAR', NULL,
     'Social', true, v_now - INTERVAL '4 days'),

    (v_uid, 'Postgrad Social — Meet Your Cohort',
     'Casual mixer for all postgrad coursework and research students.',
     v_now + INTERVAL '6 days' + TIME '16:00', v_now + INTERVAL '6 days' + TIME '18:00',
     false, 'Macquarie Theatre', 'MQTH', NULL,
     'Social', true, v_now - INTERVAL '5 days'),

    (v_uid, 'Outdoor Movie Night: Campus Under the Stars',
     'Free screening on the sports fields. Bring a blanket. Popcorn provided.',
     v_now + INTERVAL '9 days' + TIME '19:00', v_now + INTERVAL '9 days' + TIME '22:00',
     false, 'Sports Fields', 'FIELDS', NULL,
     'Social', true, v_now - INTERVAL '3 days'),

    -- FREE FOOD (3)
    (v_uid, 'Free Coffee Week — Library Cafe',
     'One free barista coffee per student per day. Just show your student ID.',
     v_now + INTERVAL '1 day', v_now + INTERVAL '5 days',
     true, 'Library Cafe', 'LIBCAFE', NULL,
     'Free Food', true, v_now - INTERVAL '1 day'),

    (v_uid, 'Postgrad Welcome Morning Tea',
     'Free pastries, coffee, and tea for all postgraduate students. Meet the Dean.',
     v_now + INTERVAL '4 days' + TIME '10:00', v_now + INTERVAL '4 days' + TIME '11:30',
     false, '18 Wally''s Walk, Central Hub', '18WW', 'Level 3',
     'Free Food', true, v_now - INTERVAL '6 days'),

    (v_uid, 'Welcome BBQ — Sport & Aquatic Centre',
     'Burgers, halal, and vegetarian options. Live music by student bands.',
     v_now + INTERVAL '11 days' + TIME '12:00', v_now + INTERVAL '11 days' + TIME '15:00',
     false, 'Sport & Aquatic Centre', 'SPORT', 'Outdoor Area',
     'Free Food', true, v_now - INTERVAL '8 days');

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

    (v_uid, 'Assignment Due in 4 Days',
     'Exploratory Data Analysis (DATA2001) is due soon. Submit your Jupyter notebook!',
     'deadline', false, v_now - INTERVAL '1 hour'),

    (v_uid, 'Kaggle Kickoff — 3 Days Away',
     'MQ Data Science Society Kaggle challenge at 4ER Room 303.',
     'event', false, v_now - INTERVAL '4 hours'),

    (v_uid, 'COMP6210 Lecture Tomorrow',
     'Big Data Technologies starts at 2:00 PM in 9WW Room 201.',
     'class', true, v_now - INTERVAL '1 day'),

    (v_uid, 'Level Up! You reached Level 4',
     'Keep the momentum going! Complete deadlines and log in daily to earn more XP.',
     'system', true, v_now - INTERVAL '5 days');

  RAISE NOTICE '  ✓ 5 notifications created';

  -- ========================================================================
  -- XP Events
  -- ========================================================================
  DELETE FROM public.xp_events WHERE user_id = v_uid;

  INSERT INTO public.xp_events (user_id, event_type, xp_amount, metadata, created_at)
  VALUES
    (v_uid, 'profile_completed', 50,  '{"field": "all"}'::jsonb,          v_now - INTERVAL '28 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "DATA2001"}'::jsonb,      v_now - INTERVAL '27 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "COMP6210"}'::jsonb,      v_now - INTERVAL '27 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "STAT2170"}'::jsonb,      v_now - INTERVAL '26 days'),
    (v_uid, 'unit_added',        25,  '{"unit": "COMP6200"}'::jsonb,      v_now - INTERVAL '26 days'),
    (v_uid, 'daily_login',       10,  '{"day": 1}'::jsonb,                v_now - INTERVAL '9 days'),
    (v_uid, 'daily_login',       10,  '{"day": 2}'::jsonb,                v_now - INTERVAL '8 days'),
    (v_uid, 'daily_login',       10,  '{"day": 3}'::jsonb,                v_now - INTERVAL '7 days'),
    (v_uid, 'daily_login',       10,  '{"day": 4}'::jsonb,                v_now - INTERVAL '6 days'),
    (v_uid, 'daily_login',       10,  '{"day": 5}'::jsonb,                v_now - INTERVAL '5 days'),
    (v_uid, 'streak_bonus',      25,  '{"streak": 5}'::jsonb,             v_now - INTERVAL '5 days'),
    (v_uid, 'daily_login',       10,  '{"day": 6}'::jsonb,                v_now - INTERVAL '4 days'),
    (v_uid, 'daily_login',       10,  '{"day": 7}'::jsonb,                v_now - INTERVAL '3 days'),
    (v_uid, 'streak_bonus',      25,  '{"streak": 7}'::jsonb,             v_now - INTERVAL '3 days'),
    (v_uid, 'daily_login',       10,  '{"day": 8}'::jsonb,                v_now - INTERVAL '2 days'),
    (v_uid, 'daily_login',       10,  '{"day": 9}'::jsonb,                v_now - INTERVAL '1 day'),
    (v_uid, 'deadline_completed',50,  '{"title": "Data Wrangling Pipeline"}'::jsonb, v_now - INTERVAL '6 days'),
    (v_uid, 'deadline_completed',50,  '{"title": "Linear Regression Tut"}'::jsonb,   v_now - INTERVAL '4 days'),
    (v_uid, 'level_up_bonus',    30,  '{"level": 3}'::jsonb,              v_now - INTERVAL '6 days'),
    (v_uid, 'level_up_bonus',    30,  '{"level": 4}'::jsonb,              v_now - INTERVAL '3 days'),
    (v_uid, 'event_attended',    15,  '{"event": "R Workshop"}'::jsonb,   v_now - INTERVAL '5 days');

  RAISE NOTICE '  ✓ 21 XP events logged (total 520 XP)';

  -- ========================================================================
  -- DONE
  -- ========================================================================
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'DEMO SEED COMPLETE for amin.demo@mq.edu.au';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Profile:       Amin Beheshti — M. Data Science, Year 1';
  RAISE NOTICE 'Units:         4 (DATA2001, COMP6210, STAT2170, COMP6200)';
  RAISE NOTICE 'Class Times:   8 slots (Mon–Fri)';
  RAISE NOTICE 'Deadlines:     7 (5 upcoming, 2 completed)';
  RAISE NOTICE 'Events:        12 (3 Academic, 3 Career, 3 Social, 3 Free Food)';
  RAISE NOTICE 'Gamification:  520 XP, Level ~4, 9-day streak';
  RAISE NOTICE 'Notifications: 5';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

END $$;
