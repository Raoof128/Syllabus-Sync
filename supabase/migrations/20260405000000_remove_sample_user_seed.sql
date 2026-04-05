-- ============================================================================
-- Remove sample-data seeding for new users
-- ============================================================================
-- The previous migration 20260108140000_add_event_date_columns.sql installed
-- a trigger that seeded every new signup with demo units (COMP2310, MATH1001,
-- HIST2002, COMP1010), demo deadlines, demo notifications, and demo class
-- times. This was useful for early development but is wrong for real users:
-- they expect an empty account after signing up.
--
-- This migration:
--   1. Drops the trigger and functions so NO future signup gets seeded.
--   2. Deletes existing seeded rows for any user who already received them,
--      matched by the exact (code, name) fingerprint to avoid collateral
--      damage to rows users may have legitimately created themselves.
-- ============================================================================

-- STEP 1: Drop the seeding trigger and functions
DROP TRIGGER IF EXISTS on_auth_user_created_seed_data ON auth.users;
DROP FUNCTION IF EXISTS public.seed_new_user_data() CASCADE;
DROP FUNCTION IF EXISTS public.add_sample_class_times(uuid) CASCADE;

-- STEP 2: Delete seeded deadlines (by exact title + unit_code fingerprint).
-- Cascades handle any downstream rows that reference these deadlines.
DELETE FROM public.deadlines
WHERE (title, unit_code) IN (
  ('Assignment 1: Network Fundamentals', 'COMP2310'),
  ('Quiz 1: Linear Algebra Basics',      'MATH1001'),
  ('Essay: Revolution & Reform',         'HIST2002'),
  ('Lab Report 1',                       'COMP1010'),
  ('Midterm Exam',                       'MATH1001'),
  ('Group Presentation',                 'COMP2310')
);

-- STEP 3: Delete seeded units (by exact code + name fingerprint).
-- Class times reference units by FK, so cascade must be in place.
DELETE FROM public.units
WHERE (code, name) IN (
  ('COMP2310', 'Networking'),
  ('MATH1001', 'Foundations of Mathematics'),
  ('HIST2002', 'Modern Europe: 1789-1914'),
  ('COMP1010', 'Introduction to Programming')
);

-- STEP 4: Delete seeded welcome notifications (by exact title fingerprint).
DELETE FROM public.notifications
WHERE title IN (
  'Welcome to Syllabus Sync!',
  'Check Out the Campus Map',
  'Upcoming Deadline',
  'Career Fair This Week!'
)
AND type IN ('system', 'deadline', 'event');
