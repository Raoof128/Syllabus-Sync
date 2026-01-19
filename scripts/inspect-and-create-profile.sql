-- ============================================================================
-- DATABASE OPERATIONS SCRIPT
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE NEW USER PROFILE
-- Email: pouya@mq.edu.au
-- Full Name: Pouya Developer
-- Student ID: 15555
-- ============================================================================

-- First, let's see what users exist
SELECT 'EXISTING AUTH USERS:' as info;
-- Note: auth.users can only be accessed via admin API

-- Check existing profiles
SELECT 'EXISTING PROFILES:' as info;
SELECT id, email, full_name, student_id, course, year, created_at
FROM profiles;

-- Insert new profile (if auth user already exists with this email)
-- If no auth user exists yet, you'll need to create one via Supabase Auth first
-- This assumes the auth user ID is known or will be set

-- If you need to insert directly (for demo purposes with a generated UUID):
-- Note: In production, profiles.id should match auth.users.id

DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'pouya@mq.edu.au';
    v_full_name text := 'Pouya Developer';
    v_student_id text := '15555';
BEGIN
    -- Check if profile with this email already exists
    SELECT id INTO v_user_id FROM profiles WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'Profile already exists for email %. ID: %', v_email, v_user_id;

        -- Update the profile with the correct info
        UPDATE profiles
        SET full_name = v_full_name,
            student_id = v_student_id,
            updated_at = NOW()
        WHERE email = v_email;

        RAISE NOTICE 'Updated profile with full_name and student_id';
    ELSE
        RAISE NOTICE 'No profile found for %. Please create auth user first.', v_email;
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: VIEW ALL EVENTS
-- ============================================================================

SELECT 'ALL EVENTS IN DATABASE:' as info;
SELECT
    id,
    COALESCE(user_id::text, 'PUBLIC') as owner,
    title,
    description,
    start_at,
    end_at,
    all_day,
    location,
    building,
    category,
    created_at
FROM events
ORDER BY start_at ASC;

-- ============================================================================
-- SECTION 3: VIEW ALL UNITS (with ownership)
-- ============================================================================

SELECT 'ALL UNITS IN DATABASE:' as info;
SELECT
    u.id,
    u.user_id,
    p.email as owner_email,
    u.code,
    u.name,
    u.color,
    u.description,
    u.building,
    u.room,
    u.created_at
FROM units u
LEFT JOIN profiles p ON u.user_id = p.id
ORDER BY u.code;

-- ============================================================================
-- SECTION 4: VIEW ALL DEADLINES (with ownership)
-- ============================================================================

SELECT 'ALL DEADLINES IN DATABASE:' as info;
SELECT
    d.id,
    d.user_id,
    p.email as owner_email,
    d.title,
    d.unit_code,
    d.due_date,
    d.priority,
    d.type,
    d.completed
FROM deadlines d
LEFT JOIN profiles p ON d.user_id = p.id
ORDER BY d.due_date ASC;

-- ============================================================================
-- SECTION 5: DATABASE STATISTICS
-- ============================================================================

SELECT 'DATABASE STATISTICS:' as info;
SELECT
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM units) as total_units,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM deadlines) as total_deadlines,
    (SELECT COUNT(*) FROM class_times) as total_class_times,
    (SELECT COUNT(*) FROM notifications) as total_notifications,
    (SELECT COUNT(*) FROM gamification_profiles) as total_gamification_profiles,
    (SELECT COUNT(*) FROM xp_events) as total_xp_events;
