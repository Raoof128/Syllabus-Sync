-- Data Migration Helpers for Syllabus Sync
-- Use these queries to migrate existing data to the new schema

-- =============================================================================
-- HELPER: Migrate units location data
-- =============================================================================

-- Step 1: Check current units structure
-- SELECT id, building, room, location FROM public.units LIMIT 5;

-- Step 2: Migrate flat building/room to JSONB location
UPDATE public.units
SET location = jsonb_build_object('building', building, 'room', room)
WHERE location IS NULL
  AND (building IS NOT NULL OR room IS NOT NULL);

-- Step 3: Verify migration
-- SELECT id, building, room, location FROM public.units WHERE location IS NOT NULL LIMIT 5;

-- Step 4: Clean up old columns (only after verifying migration)
-- ALTER TABLE public.units DROP COLUMN IF EXISTS building;
-- ALTER TABLE public.units DROP COLUMN IF EXISTS room;

-- =============================================================================
-- HELPER: Migrate units schedule to class_times
-- =============================================================================

-- Step 1: Check current schedule data
-- SELECT id, schedule FROM public.units WHERE schedule IS NOT NULL AND jsonb_array_length(schedule) > 0 LIMIT 3;

-- Step 2: Extract and insert class times from schedule
INSERT INTO public.class_times (unit_id, day, start_time, end_time)
SELECT
  u.id as unit_id,
  (schedule_item->>'day') as day,
  (schedule_item->>'startTime') as start_time,
  (schedule_item->>'endTime') as end_time
FROM public.units u,
     jsonb_array_elements(u.schedule) as schedule_item
WHERE u.schedule IS NOT NULL
  AND jsonb_array_length(u.schedule) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.class_times ct
    WHERE ct.unit_id = u.id
  );

-- Step 3: Verify class times were created
-- SELECT ct.*, u.code FROM public.class_times ct
-- JOIN public.units u ON u.id = ct.unit_id
-- LIMIT 10;

-- Step 4: Remove schedule column (only after verifying)
-- ALTER TABLE public.units DROP COLUMN IF EXISTS schedule;

-- =============================================================================
-- HELPER: Migrate deadlines fields
-- =============================================================================

-- Step 1: Check current deadline structure
-- SELECT id, unit_id, due_at, unit_code, due_date FROM public.deadlines LIMIT 5;

-- Step 2: Migrate unit_id to unit_code
UPDATE public.deadlines
SET unit_code = (
  SELECT code FROM public.units WHERE id = deadlines.unit_id
)
WHERE unit_code IS NULL
  AND unit_id IS NOT NULL;

-- Step 3: Migrate due_at to due_date
UPDATE public.deadlines
SET due_date = due_at
WHERE due_date IS NULL
  AND due_at IS NOT NULL;

-- Step 4: Verify migrations
-- SELECT id, unit_id, unit_code, due_at, due_date FROM public.deadlines LIMIT 5;

-- Step 5: Remove old columns (only after verifying)
-- ALTER TABLE public.deadlines DROP COLUMN IF EXISTS unit_id;
-- ALTER TABLE public.deadlines DROP COLUMN IF EXISTS due_at;

-- =============================================================================
-- HELPER: Migrate events fields
-- =============================================================================

-- Step 1: Check current events structure
-- SELECT id, date, time, event_date, event_time FROM public.events LIMIT 3;

-- Step 2: Rename columns (if they haven't been renamed yet)
-- ALTER TABLE public.events RENAME COLUMN date TO event_date;
-- ALTER TABLE public.events RENAME COLUMN time TO event_time;
-- ALTER TABLE public.events RENAME COLUMN imageUrl TO image_url;

-- =============================================================================
-- HELPER: Add user_id to tables (if missing)
-- =============================================================================

-- For development/demo purposes, you might want to set a default user_id
-- Replace '00000000-0000-0000-0000-000000000000' with actual user ID

-- UPDATE public.units SET user_id = '00000000-0000-0000-0000-000000000000'
-- WHERE user_id IS NULL;

-- UPDATE public.deadlines SET user_id = '00000000-0000-0000-0000-000000000000'
-- WHERE user_id IS NULL;

-- UPDATE public.notifications SET user_id = '00000000-0000-0000-0000-000000000000'
-- WHERE user_id IS NULL;

-- =============================================================================
-- HELPER: Populate sample data (for development)
-- =============================================================================

-- Insert sample events
INSERT INTO public.events (title, description, event_date, event_time, location, building, category, created_at)
VALUES
  ('Welcome Week Kickoff', 'Join us for the official start of Welcome Week!', '2026-01-15', '10:00 AM', 'Campus Center', 'C5C', 'Social', now()),
  ('Career Fair 2026', 'Meet top employers from tech, finance, and more', '2026-01-20', '9:00 AM', 'Sports Center', 'W6A', 'Career', now()),
  ('Free Pizza Friday', 'Complimentary pizza and networking', '2026-01-24', '12:00 PM', 'Library Courtyard', 'C3C', 'Free Food', now()),
  ('Study Skills Workshop', 'Learn effective study techniques', '2026-01-28', '2:00 PM', 'Learning Commons', 'W3A', 'Academic', now())
ON CONFLICT DO NOTHING;

-- Insert sample notifications (requires user_id)
-- INSERT INTO public.notifications (user_id, title, message, type, link, created_at)
-- VALUES
--   ('00000000-0000-0000-0000-000000000000', 'Welcome to Syllabus Sync!', 'Get started by adding your units and deadlines.', 'system', '/home', now()),
--   ('00000000-0000-0000-0000-000000000000', 'Assignment Due Soon', 'Your COMP2310 assignment is due in 2 days.', 'deadline', '/calendar', now())
-- ON CONFLICT DO NOTHING;

-- =============================================================================
-- HELPER: Data validation queries
-- =============================================================================

-- Check data integrity after migration
-- SELECT 'Units with location' as check_type, COUNT(*) as count FROM public.units WHERE location IS NOT NULL
-- UNION ALL
-- SELECT 'Class times created' as check_type, COUNT(*) as count FROM public.class_times
-- UNION ALL
-- SELECT 'Deadlines with due_date' as check_type, COUNT(*) as count FROM public.deadlines WHERE due_date IS NOT NULL
-- UNION ALL
-- SELECT 'Events with event_date' as check_type, COUNT(*) as count FROM public.events WHERE event_date IS NOT NULL;

-- Find any data issues
-- SELECT 'Units without location' as issue, COUNT(*) as count FROM public.units WHERE location IS NULL OR location = '{}'::jsonb
-- UNION ALL
-- SELECT 'Deadlines without due_date' as issue, COUNT(*) as count FROM public.deadlines WHERE due_date IS NULL
-- UNION ALL
-- SELECT 'Units without user_id' as issue, COUNT(*) as count FROM public.units WHERE user_id IS NULL
-- UNION ALL
-- SELECT 'Deadlines without user_id' as issue, COUNT(*) as count FROM public.deadlines WHERE user_id IS NULL;

-- =============================================================================
-- ROLLBACK HELPERS (use with caution!)
-- =============================================================================

-- To rollback location migration:
-- UPDATE public.units SET building = location->>'building', room = location->>'room' WHERE location IS NOT NULL;

-- To rollback class_times migration:
-- UPDATE public.units SET schedule = (
--   SELECT jsonb_agg(
--     jsonb_build_object('id', ct.id, 'day', ct.day, 'startTime', ct.start_time, 'endTime', ct.end_time)
--   )
--   FROM public.class_times ct WHERE ct.unit_id = units.id
-- );

-- Always backup your data before running migrations!
