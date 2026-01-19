-- ============================================================================
-- COMPREHENSIVE DATABASE OPERATIONS SCRIPT
-- ============================================================================
-- Purpose: Full database inspection, user identity normalization, and sample data
-- Date: 2026-01-19
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- Or via: supabase db execute --file scripts/comprehensive-db-operations.sql
-- ============================================================================

-- ============================================================================
-- PART A: DATABASE INSPECTION SUMMARY
-- ============================================================================

-- 1. Check all profiles
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'SECTION A: DATABASE INSPECTION';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Current profiles
SELECT 'PROFILES:' as section,
       id, email, full_name, student_id, course, year,
       created_at
FROM profiles
ORDER BY created_at;

-- Current units with ownership
SELECT 'UNITS (with ownership):' as section,
       u.id,
       u.user_id,
       p.email as owner_email,
       u.code,
       u.name,
       u.color
FROM units u
LEFT JOIN profiles p ON u.user_id = p.id
WHERE u.deleted_at IS NULL
ORDER BY p.email, u.code;

-- Current events
SELECT 'EVENTS:' as section,
       id,
       COALESCE(user_id::text, 'PUBLIC') as owner,
       title,
       start_at,
       category,
       location
FROM events
WHERE deleted_at IS NULL
ORDER BY start_at;

-- Current deadlines with ownership
SELECT 'DEADLINES (with ownership):' as section,
       d.id,
       p.email as owner_email,
       d.title,
       d.unit_code,
       d.due_date,
       d.type,
       d.completed
FROM deadlines d
LEFT JOIN profiles p ON d.user_id = p.id
WHERE d.deleted_at IS NULL
ORDER BY d.due_date;

-- Database statistics
SELECT 'STATISTICS:' as section,
       (SELECT COUNT(*) FROM profiles) as profiles,
       (SELECT COUNT(*) FROM units WHERE deleted_at IS NULL) as units,
       (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL) as events,
       (SELECT COUNT(*) FROM deadlines WHERE deleted_at IS NULL) as deadlines,
       (SELECT COUNT(*) FROM class_times) as class_times,
       (SELECT COUNT(*) FROM gamification_profiles) as gamification_profiles;

-- ============================================================================
-- PART B: CREATE PROFILE FOR pouya@mq.edu.au
-- ============================================================================

DO $$
DECLARE
    v_user_id uuid;
    v_existing_profile_id uuid;
    v_email text := 'pouya@mq.edu.au';
    v_full_name text := 'Pouya Developer';
    v_student_id text := '15555';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'SECTION B: CREATE/UPDATE PROFILE FOR pouya@mq.edu.au';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';

    -- Check if profile with this email already exists
    SELECT id INTO v_existing_profile_id FROM profiles WHERE email = v_email;

    IF v_existing_profile_id IS NOT NULL THEN
        RAISE NOTICE '✅ Profile already exists with ID: %', v_existing_profile_id;

        -- Update the profile
        UPDATE profiles
        SET full_name = v_full_name,
            student_id = v_student_id,
            updated_at = NOW()
        WHERE id = v_existing_profile_id;

        RAISE NOTICE '✅ Updated profile with full_name=% and student_id=%', v_full_name, v_student_id;

        -- Ensure gamification profile exists
        INSERT INTO gamification_profiles (user_id, xp, streak_days, longest_streak)
        VALUES (v_existing_profile_id, 100, 5, 10)
        ON CONFLICT (user_id) DO NOTHING;

    ELSE
        RAISE NOTICE '⚠️ No profile found for %. Creating one...', v_email;

        -- For demo purposes, create a profile with a new UUID
        -- In production, this should match auth.users.id
        v_user_id := gen_random_uuid();

        INSERT INTO profiles (id, email, full_name, student_id, course, year)
        VALUES (v_user_id, v_email, v_full_name, v_student_id, 'Computer Science', '2026');

        -- Note: This will fail if there's no matching auth.users entry due to FK constraint
        -- In that case, create the auth user first via Supabase dashboard or API

        RAISE NOTICE '✅ Created new profile with ID: %', v_user_id;
    END IF;
END $$;

-- Show the profile after creation/update
SELECT 'PROFILE AFTER UPDATE:' as section,
       id, email, full_name, student_id, course, year, created_at, updated_at
FROM profiles
WHERE email = 'pouya@mq.edu.au';

-- ============================================================================
-- PART C: USER IDENTITY VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'SECTION C: USER IDENTITY VERIFICATION';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Check for any orphan records (data without valid user ownership)
SELECT 'ORPHAN CHECK - Units without valid user:' as check_type,
       COUNT(*) as orphan_count
FROM units u
WHERE u.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.user_id);

SELECT 'ORPHAN CHECK - Deadlines without valid user:' as check_type,
       COUNT(*) as orphan_count
FROM deadlines d
WHERE d.deleted_at IS NULL
  AND d.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = d.user_id);

-- Verify user ownership model
SELECT 'OWNERSHIP VERIFICATION:' as section,
       p.email,
       COUNT(DISTINCT u.id) as units,
       COUNT(DISTINCT d.id) as deadlines,
       COUNT(DISTINCT e.id) as events
FROM profiles p
LEFT JOIN units u ON p.id = u.user_id AND u.deleted_at IS NULL
LEFT JOIN deadlines d ON p.id = d.user_id AND d.deleted_at IS NULL
LEFT JOIN events e ON p.id = e.user_id AND e.deleted_at IS NULL
GROUP BY p.email
ORDER BY p.email;

-- ============================================================================
-- PART D: SAMPLE DATA GENERATION FOR 3 DEMO USERS
-- ============================================================================

DO $$
DECLARE
    v_user1_id uuid;
    v_user2_id uuid;
    v_user3_id uuid;
    v_unit1_id uuid;
    v_unit2_id uuid;
    v_unit3_id uuid;
    v_unit4_id uuid;
    v_unit5_id uuid;
    v_unit6_id uuid;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'SECTION D: SAMPLE DATA GENERATION';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';

    -- Get existing user IDs (assuming they exist)
    SELECT id INTO v_user1_id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 0;
    SELECT id INTO v_user2_id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO v_user3_id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 2;

    -- If we don't have 3 users, skip sample data generation
    IF v_user1_id IS NULL THEN
        RAISE NOTICE '⚠️ No users found. Skipping sample data generation.';
        RAISE NOTICE 'Please create at least one user first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found users:';
    RAISE NOTICE '  User 1: %', v_user1_id;
    RAISE NOTICE '  User 2: %', COALESCE(v_user2_id::text, 'N/A');
    RAISE NOTICE '  User 3: %', COALESCE(v_user3_id::text, 'N/A');

    -- =========================================================================
    -- UNITS FOR USER 1
    -- =========================================================================

    -- Unit 1: COMP2310
    INSERT INTO units (id, user_id, code, name, color, description, building, room)
    VALUES (
        gen_random_uuid(),
        v_user1_id,
        'COMP2310',
        'Systems, Networks and Concurrency',
        '#A6192E',
        'Introduction to operating systems, networking, and concurrent programming',
        'C5C',
        '204'
    )
    ON CONFLICT (user_id, code) DO UPDATE SET
        name = EXCLUDED.name,
        color = EXCLUDED.color,
        updated_at = NOW()
    RETURNING id INTO v_unit1_id;

    -- Unit 2: COMP3310
    INSERT INTO units (id, user_id, code, name, color, description, building, room)
    VALUES (
        gen_random_uuid(),
        v_user1_id,
        'COMP3310',
        'Computer Networks',
        '#3B82F6',
        'Advanced computer networking concepts and protocols',
        'W6A',
        '101'
    )
    ON CONFLICT (user_id, code) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    RETURNING id INTO v_unit2_id;

    -- Get the unit IDs if they weren't returned (due to conflict)
    IF v_unit1_id IS NULL THEN
        SELECT id INTO v_unit1_id FROM units WHERE user_id = v_user1_id AND code = 'COMP2310';
    END IF;
    IF v_unit2_id IS NULL THEN
        SELECT id INTO v_unit2_id FROM units WHERE user_id = v_user1_id AND code = 'COMP3310';
    END IF;

    -- Class times for User 1's units
    DELETE FROM class_times WHERE unit_id = v_unit1_id;
    DELETE FROM class_times WHERE unit_id = v_unit2_id;

    INSERT INTO class_times (unit_id, day, start_time, end_time) VALUES
        (v_unit1_id, 'Monday', '09:00', '11:00'),
        (v_unit1_id, 'Wednesday', '14:00', '15:00'),
        (v_unit2_id, 'Tuesday', '10:00', '12:00'),
        (v_unit2_id, 'Thursday', '10:00', '12:00');

    -- Deadlines for User 1
    INSERT INTO deadlines (user_id, unit_id, unit_code, title, description, due_date, priority, type)
    VALUES
        (v_user1_id, v_unit1_id, 'COMP2310', 'Assignment 1: Process Scheduling',
         'Implement a process scheduler with different algorithms',
         '2026-01-25 23:59:00+11', 'High', 'Assignment'),
        (v_user1_id, v_unit1_id, 'COMP2310', 'Lab Report 1',
         'Report on network analysis lab',
         '2026-01-30 17:00:00+11', 'Medium', 'Assignment'),
        (v_user1_id, v_unit2_id, 'COMP3310', 'Network Protocol Quiz',
         'Quiz on TCP/IP protocols',
         '2026-02-05 14:00:00+11', 'Medium', 'Quiz'),
        (v_user1_id, v_unit2_id, 'COMP3310', 'Midterm Exam',
         'Covers weeks 1-6 material',
         '2026-02-15 09:00:00+11', 'Urgent', 'Exam')
    ON CONFLICT DO NOTHING;

    -- Events for User 1 (personal events)
    INSERT INTO events (user_id, title, description, start_at, end_at, all_day, location, building, category)
    VALUES
        (v_user1_id, 'Study Group Meeting',
         'Weekly study group for COMP2310',
         '2026-01-22 15:00:00+11', '2026-01-22 17:00:00+11',
         false, 'Library Study Room 3', 'C3C', 'Academic'),
        (v_user1_id, 'Project Team Meeting',
         'Team meeting for network project',
         '2026-01-24 14:00:00+11', '2026-01-24 16:00:00+11',
         false, 'Engineering Building Room 201', 'E6A', 'Academic')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Created sample data for User 1';

    -- =========================================================================
    -- UNITS FOR USER 2 (if exists)
    -- =========================================================================

    IF v_user2_id IS NOT NULL THEN
        -- Unit 1: COMP2420
        INSERT INTO units (id, user_id, code, name, color, description, building, room)
        VALUES (
            gen_random_uuid(),
            v_user2_id,
            'COMP2420',
            'Introduction to Data Management',
            '#10B981',
            'Database systems and data analysis fundamentals',
            'C3C',
            '308'
        )
        ON CONFLICT (user_id, code) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        RETURNING id INTO v_unit3_id;

        -- Unit 2: STAT2170
        INSERT INTO units (id, user_id, code, name, color, description, building, room)
        VALUES (
            gen_random_uuid(),
            v_user2_id,
            'STAT2170',
            'Statistical Methods',
            '#8B5CF6',
            'Introduction to statistical analysis and probability',
            'E7B',
            '102'
        )
        ON CONFLICT (user_id, code) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        RETURNING id INTO v_unit4_id;

        -- Get unit IDs if not returned
        IF v_unit3_id IS NULL THEN
            SELECT id INTO v_unit3_id FROM units WHERE user_id = v_user2_id AND code = 'COMP2420';
        END IF;
        IF v_unit4_id IS NULL THEN
            SELECT id INTO v_unit4_id FROM units WHERE user_id = v_user2_id AND code = 'STAT2170';
        END IF;

        -- Class times for User 2's units
        DELETE FROM class_times WHERE unit_id = v_unit3_id;
        DELETE FROM class_times WHERE unit_id = v_unit4_id;

        INSERT INTO class_times (unit_id, day, start_time, end_time) VALUES
            (v_unit3_id, 'Monday', '14:00', '16:00'),
            (v_unit3_id, 'Friday', '09:00', '10:00'),
            (v_unit4_id, 'Tuesday', '13:00', '15:00'),
            (v_unit4_id, 'Thursday', '13:00', '14:00');

        -- Deadlines for User 2
        INSERT INTO deadlines (user_id, unit_id, unit_code, title, description, due_date, priority, type)
        VALUES
            (v_user2_id, v_unit3_id, 'COMP2420', 'Database Design Project',
             'Design and implement a relational database',
             '2026-01-28 23:59:00+11', 'Urgent', 'Assignment'),
            (v_user2_id, v_unit3_id, 'COMP2420', 'SQL Practice Quiz',
             'Quiz on SQL queries and optimization',
             '2026-02-03 10:00:00+11', 'Medium', 'Quiz'),
            (v_user2_id, v_unit4_id, 'STAT2170', 'Statistical Analysis Report',
             'Report on hypothesis testing',
             '2026-02-10 23:59:00+11', 'High', 'Assignment')
        ON CONFLICT DO NOTHING;

        -- Events for User 2
        INSERT INTO events (user_id, title, description, start_at, end_at, all_day, location, building, category)
        VALUES
            (v_user2_id, 'Data Science Workshop',
             'Introduction to Python for data analysis',
             '2026-01-23 10:00:00+11', '2026-01-23 12:00:00+11',
             false, 'Computer Lab 2', 'C5C', 'Academic')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE '✅ Created sample data for User 2';
    END IF;

    -- =========================================================================
    -- UNITS FOR USER 3 (if exists)
    -- =========================================================================

    IF v_user3_id IS NOT NULL THEN
        -- Unit 1: COMP3600
        INSERT INTO units (id, user_id, code, name, color, description, building, room)
        VALUES (
            gen_random_uuid(),
            v_user3_id,
            'COMP3600',
            'Algorithms',
            '#F59E0B',
            'Design and analysis of algorithms',
            'W3A',
            '215'
        )
        ON CONFLICT (user_id, code) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        RETURNING id INTO v_unit5_id;

        -- Unit 2: COMP3620
        INSERT INTO units (id, user_id, code, name, color, description, building, room)
        VALUES (
            gen_random_uuid(),
            v_user3_id,
            'COMP3620',
            'Artificial Intelligence',
            '#EF4444',
            'Fundamentals of AI and machine learning',
            'C5C',
            '310'
        )
        ON CONFLICT (user_id, code) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        RETURNING id INTO v_unit6_id;

        -- Get unit IDs if not returned
        IF v_unit5_id IS NULL THEN
            SELECT id INTO v_unit5_id FROM units WHERE user_id = v_user3_id AND code = 'COMP3600';
        END IF;
        IF v_unit6_id IS NULL THEN
            SELECT id INTO v_unit6_id FROM units WHERE user_id = v_user3_id AND code = 'COMP3620';
        END IF;

        -- Class times for User 3's units
        DELETE FROM class_times WHERE unit_id = v_unit5_id;
        DELETE FROM class_times WHERE unit_id = v_unit6_id;

        INSERT INTO class_times (unit_id, day, start_time, end_time) VALUES
            (v_unit5_id, 'Wednesday', '11:00', '13:00'),
            (v_unit5_id, 'Friday', '11:00', '12:00'),
            (v_unit6_id, 'Monday', '10:00', '12:00'),
            (v_unit6_id, 'Wednesday', '09:00', '10:00');

        -- Deadlines for User 3
        INSERT INTO deadlines (user_id, unit_id, unit_code, title, description, due_date, priority, type)
        VALUES
            (v_user3_id, v_unit5_id, 'COMP3600', 'Algorithm Analysis Assignment',
             'Analyze complexity of sorting algorithms',
             '2026-01-27 23:59:00+11', 'High', 'Assignment'),
            (v_user3_id, v_unit6_id, 'COMP3620', 'AI Project Proposal',
             'Proposal for AI project',
             '2026-02-01 17:00:00+11', 'Medium', 'Assignment'),
            (v_user3_id, v_unit5_id, 'COMP3600', 'Midterm Examination',
             'Covers graph algorithms and dynamic programming',
             '2026-02-12 09:00:00+11', 'Urgent', 'Exam')
        ON CONFLICT DO NOTHING;

        -- Events for User 3
        INSERT INTO events (user_id, title, description, start_at, end_at, all_day, location, building, category)
        VALUES
            (v_user3_id, 'AI Research Seminar',
             'Guest lecture on latest AI developments',
             '2026-01-25 14:00:00+11', '2026-01-25 16:00:00+11',
             false, 'Lecture Theatre 1', 'C5C', 'Academic')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE '✅ Created sample data for User 3';
    END IF;

    -- =========================================================================
    -- PUBLIC EVENTS (shared across all users)
    -- =========================================================================

    INSERT INTO events (user_id, title, description, start_at, end_at, all_day, location, building, category, image_url)
    VALUES
        (NULL, 'Welcome Week Kickoff',
         'Join us for the official start of Welcome Week with live music, food stalls, and campus tours!',
         '2026-01-20 10:00:00+11', '2026-01-20 16:00:00+11',
         false, 'Campus Center Lawn', 'C5C', 'Social', '/images/events/welcome-week.jpg'),
        (NULL, 'Career Fair 2026',
         'Meet top employers from tech, finance, healthcare, and more. Bring your resume!',
         '2026-01-22 09:00:00+11', '2026-01-22 17:00:00+11',
         false, 'Sports Center Hall', 'W6A', 'Career', '/images/events/career-fair.jpg'),
        (NULL, 'Free Pizza Friday',
         'Complimentary pizza and networking with fellow students. First come, first served!',
         '2026-01-24 12:00:00+11', '2026-01-24 14:00:00+11',
         false, 'Library Courtyard', 'C3C', 'Free Food', '/images/events/pizza-friday.jpg'),
        (NULL, 'Study Skills Workshop',
         'Learn effective study techniques, time management, and exam preparation strategies.',
         '2026-01-28 14:00:00+11', '2026-01-28 16:00:00+11',
         false, 'Learning Commons Room 204', 'W3A', 'Academic', '/images/events/study-workshop.jpg'),
        (NULL, 'Tech Talk: AI in Education',
         'Industry experts discuss the future of artificial intelligence in higher education.',
         '2026-02-05 16:00:00+11', '2026-02-05 18:00:00+11',
         false, 'Engineering Building Auditorium', 'C5C', 'Academic', '/images/events/tech-talk.jpg'),
        (NULL, 'Campus Club Fair',
         'Discover and join student clubs and organizations. Over 100 clubs represented!',
         '2026-02-10 11:00:00+11', '2026-02-10 15:00:00+11',
         false, 'Student Union Building', 'C5C', 'Social', '/images/events/club-fair.jpg')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Created public events';

END $$;

-- ============================================================================
-- PART E: FINAL VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'SECTION E: FINAL VERIFICATION';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Final database state
SELECT 'FINAL PROFILE STATE:' as section,
       id, email, full_name, student_id, course, year
FROM profiles
ORDER BY created_at;

SELECT 'FINAL UNITS STATE (per user):' as section,
       p.email,
       u.code,
       u.name
FROM profiles p
LEFT JOIN units u ON p.id = u.user_id AND u.deleted_at IS NULL
ORDER BY p.email, u.code;

SELECT 'ALL EVENTS (including public):' as section,
       COALESCE(p.email, 'PUBLIC') as owner,
       e.title,
       e.start_at,
       e.category,
       e.location
FROM events e
LEFT JOIN profiles p ON e.user_id = p.id
WHERE e.deleted_at IS NULL
ORDER BY e.start_at;

SELECT 'FINAL STATISTICS:' as section,
       (SELECT COUNT(*) FROM profiles) as profiles,
       (SELECT COUNT(*) FROM units WHERE deleted_at IS NULL) as units,
       (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL) as events,
       (SELECT COUNT(*) FROM deadlines WHERE deleted_at IS NULL) as deadlines,
       (SELECT COUNT(*) FROM class_times) as class_times;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
