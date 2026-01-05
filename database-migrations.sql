-- Database Migration Script for Syllabus Sync
-- Run these commands in order to migrate from the original schema to the corrected one

-- =============================================================================
-- STEP 1: Create the notifications table (completely new)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['deadline'::text, 'event'::text, 'class'::text, 'system'::text])),
  read boolean NOT NULL DEFAULT false,
  link text,
  related_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- =============================================================================
-- STEP 2: Migrate units table structure
-- =============================================================================

-- Add new location JSONB column
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS location jsonb;

-- Migrate existing building/room data to location JSONB (run this only once!)
-- UPDATE public.units
-- SET location = jsonb_build_object('building', building, 'room', room)
-- WHERE location IS NULL AND building IS NOT NULL;

-- Remove old columns after migration is complete
-- ALTER TABLE public.units DROP COLUMN IF EXISTS building;
-- ALTER TABLE public.units DROP COLUMN IF EXISTS room;

-- =============================================================================
-- STEP 3: Create class_times table (separate from units)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.class_times (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  day text NOT NULL CHECK (day = ANY (ARRAY['Monday'::text, 'Tuesday'::text, 'Wednesday'::text, 'Thursday'::text, 'Friday'::text, 'Saturday'::text, 'Sunday'::text])),
  start_time text NOT NULL,
  end_time text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_times_pkey PRIMARY KEY (id),
  CONSTRAINT class_times_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id)
);

-- Migrate existing schedule data from units to class_times (run this only once!)
-- This assumes the schedule is stored as JSONB in the units table
-- INSERT INTO public.class_times (unit_id, day, start_time, end_time)
-- SELECT
--   u.id as unit_id,
--   (schedule_item->>'day') as day,
--   (schedule_item->>'startTime') as start_time,
--   (schedule_item->>'endTime') as end_time
-- FROM public.units u,
--      jsonb_array_elements(u.schedule) as schedule_item
-- WHERE u.schedule IS NOT NULL;

-- Remove schedule column from units after migration
-- ALTER TABLE public.units DROP COLUMN IF EXISTS schedule;

-- =============================================================================
-- STEP 4: Update deadlines table structure
-- =============================================================================

-- Add new columns
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS unit_code text;
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- Migrate existing data (run this only once!)
-- UPDATE public.deadlines
-- SET unit_code = (SELECT code FROM public.units WHERE id = unit_id)
-- WHERE unit_code IS NULL AND unit_id IS NOT NULL;

-- Migrate due_at to due_date (run this only once!)
-- UPDATE public.deadlines
-- SET due_date = due_at
-- WHERE due_date IS NULL AND due_at IS NOT NULL;

-- Drop old columns after migration
-- ALTER TABLE public.deadlines DROP COLUMN IF EXISTS unit_id;
-- ALTER TABLE public.deadlines DROP COLUMN IF EXISTS due_at;

-- =============================================================================
-- STEP 5: Update events table structure
-- =============================================================================

-- Add building column
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS building text;

-- Rename columns to match new schema (run this only once!)
-- ALTER TABLE public.events RENAME COLUMN date TO event_date;
-- ALTER TABLE public.events RENAME COLUMN time TO event_time;
-- ALTER TABLE public.events RENAME COLUMN imageUrl TO image_url;

-- =============================================================================
-- STEP 6: Add user_id to required tables
-- =============================================================================

-- Add user_id to deadlines if it doesn't exist
-- ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS user_id uuid;
-- ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add user_id to units if it doesn't exist
-- ALTER TABLE public.units ADD COLUMN IF NOT EXISTS user_id uuid;
-- ALTER TABLE public.units ADD CONSTRAINT units_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES public.users(id);

-- =============================================================================
-- STEP 7: Create indexes for better performance
-- =============================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Class times indexes
CREATE INDEX IF NOT EXISTS idx_class_times_unit_id ON public.class_times(unit_id);
CREATE INDEX IF NOT EXISTS idx_class_times_day ON public.class_times(day);

-- Deadlines indexes
CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON public.deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_unit_code ON public.deadlines(unit_code);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_completed ON public.deadlines(completed);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_user_id ON public.units(user_id);
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units(code);

-- =============================================================================
-- STEP 8: Enable Row Level Security (RLS) - Optional but recommended
-- =============================================================================

-- Enable RLS on all tables
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.class_times ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (customize as needed)
-- CREATE POLICY "Users can view their own data" ON public.units
--   FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can view their own deadlines" ON public.deadlines
--   FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Everyone can view events" ON public.events
--   FOR SELECT USING (true);

-- CREATE POLICY "Users can view their own notifications" ON public.notifications
--   FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 9: Verification queries
-- =============================================================================

-- Check table structures
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name IN ('users', 'units', 'class_times', 'deadlines', 'events', 'notifications')
-- ORDER BY table_name, ordinal_position;

-- Check foreign key constraints
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
--   AND tc.table_name IN ('units', 'class_times', 'deadlines', 'events', 'notifications');

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- After running all migrations, you can verify with:
-- SELECT 'Migration completed successfully!' as status;
