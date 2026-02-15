-- ============================================================================
-- SYLLABUS SYNC DATABASE SCHEMA
-- ============================================================================
-- This schema defines the complete database structure for the Syllabus Sync
-- university campus management application.
--
-- SECURITY: This schema includes proper user_id columns and RLS policies
-- to ensure each user can only access their own data.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- User profiles linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  student_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- UNITS TABLE
-- ============================================================================
-- Academic units/courses - SECURITY: user_id scoped
CREATE TABLE IF NOT EXISTS public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT,
  building TEXT,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- CLASS TIMES TABLE
-- ============================================================================
-- Class schedule times for units
CREATE TABLE IF NOT EXISTS public.class_times (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT class_times_pkey PRIMARY KEY (id),
  CONSTRAINT class_times_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE
);

-- ============================================================================
-- DEADLINES TABLE
-- ============================================================================
-- Assignment deadlines - SECURITY: user_id scoped
CREATE TABLE IF NOT EXISTS public.deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unit_code TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  type TEXT NOT NULL DEFAULT 'Assignment',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  building TEXT,              -- For exams: building code (e.g., "C5C")
  room TEXT,                  -- For exams: room number (e.g., "204")
  color TEXT,                 -- Custom color override for display
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT deadlines_pkey PRIMARY KEY (id),
  CONSTRAINT deadlines_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- TODOS TABLE
-- ============================================================================
-- User to-do items - SECURITY: user_id scoped
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date TIMESTAMPTZ,           -- Optional due date
  completed_at TIMESTAMPTZ,       -- When the task was completed
  deleted_at TIMESTAMPTZ,         -- Soft delete timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Campus events - SECURITY: user_id optional (NULL = public event)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  building TEXT,
  category TEXT NOT NULL DEFAULT 'Academic',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- User notifications - SECURITY: user_id scoped
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
-- User settings and preferences - SECURITY: user_id scoped
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

-- User gamification profile - XP, streaks, level snapshot
CREATE TABLE IF NOT EXISTS public.gamification_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT gamification_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- XP events audit log - transaction history for all XP changes
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type = ANY (ARRAY[
    'deadline_completed'::text,
    'deadline_early'::text,
    'daily_login'::text,
    'streak_bonus'::text,
    'unit_added'::text,
    'event_attended'::text,
    'profile_completed'::text,
    'first_deadline'::text,
    'weekly_goal'::text,
    'level_up_bonus'::text
  ])),
  xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
  reference_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT xp_events_pkey PRIMARY KEY (id),
  CONSTRAINT xp_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- XP configuration - configurable XP amounts per action
CREATE TABLE IF NOT EXISTS public.xp_config (
  event_type TEXT PRIMARY KEY,
  base_xp INTEGER NOT NULL CHECK (base_xp > 0),
  description TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units(code);
CREATE INDEX IF NOT EXISTS idx_units_user_id ON public.units(user_id);

-- Class times indexes
CREATE INDEX IF NOT EXISTS idx_class_times_unit_id ON public.class_times(unit_id);
CREATE INDEX IF NOT EXISTS idx_class_times_day ON public.class_times(day);

-- Deadlines indexes
CREATE INDEX IF NOT EXISTS idx_deadlines_unit_code ON public.deadlines(unit_code);
CREATE INDEX IF NOT EXISTS idx_deadlines_completed ON public.deadlines(completed);
CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON public.deadlines(user_id);

-- Todos indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON public.todos(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_gamification_profiles_user_id ON public.gamification_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON public.xp_events(created_at);
CREATE INDEX IF NOT EXISTS idx_xp_events_event_type ON public.xp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_xp_events_reference_id ON public.xp_events(reference_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - ENABLE
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PERMISSIONS - REVOKE FROM ANON (Security)
-- ============================================================================

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.units FROM anon;
REVOKE ALL ON public.class_times FROM anon;
REVOKE ALL ON public.deadlines FROM anon;
REVOKE ALL ON public.todos FROM anon;
REVOKE ALL ON public.events FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.user_preferences FROM anon;
REVOKE ALL ON public.gamification_profiles FROM anon;
REVOKE ALL ON public.xp_events FROM anon;

-- Grant to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_times TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deadlines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.gamification_profiles TO authenticated;
GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT SELECT ON public.xp_config TO authenticated;

-- Allow anon to read public events only
GRANT SELECT ON public.events TO anon;

-- ============================================================================
-- PROFILES RLS POLICIES
-- SECURITY: Users can only view and modify their own profile
-- ============================================================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- UNITS RLS POLICIES
-- SECURITY: Users can only access their own units
-- ============================================================================

CREATE POLICY "Users can view their own units"
  ON public.units FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own units"
  ON public.units FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own units"
  ON public.units FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own units"
  ON public.units FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- CLASS TIMES RLS POLICIES
-- SECURITY: Users can only access class times for their own units
-- ============================================================================

CREATE POLICY "Users can view class_times for their units"
  ON public.class_times FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE units.id = class_times.unit_id AND units.user_id = auth.uid()));

CREATE POLICY "Users can insert class_times for their units"
  ON public.class_times FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE units.id = class_times.unit_id AND units.user_id = auth.uid()));

CREATE POLICY "Users can update class_times for their units"
  ON public.class_times FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE units.id = class_times.unit_id AND units.user_id = auth.uid()));

CREATE POLICY "Users can delete class_times for their units"
  ON public.class_times FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE units.id = class_times.unit_id AND units.user_id = auth.uid()));

-- ============================================================================
-- DEADLINES RLS POLICIES
-- SECURITY: Users can only access their own deadlines
-- ============================================================================

CREATE POLICY "Users can view their own deadlines"
  ON public.deadlines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deadlines"
  ON public.deadlines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deadlines"
  ON public.deadlines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deadlines"
  ON public.deadlines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TODOS RLS POLICIES
-- SECURITY: Users can only access their own todos
-- ============================================================================

CREATE POLICY "Users can view their own todos"
  ON public.todos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos"
  ON public.todos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON public.todos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON public.todos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- EVENTS RLS POLICIES
-- SECURITY: Public events (user_id IS NULL) are readable by all,
-- private events only by owner
-- ============================================================================

-- Authenticated users can view public events OR their own
CREATE POLICY "Users can view public or their own events"
  ON public.events FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Anonymous users can only view public events
CREATE POLICY "Anyone can view public events"
  ON public.events FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Users can insert their own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS RLS POLICIES
-- SECURITY: Users can only access their own notifications
-- ============================================================================

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER PREFERENCES RLS POLICIES
-- SECURITY: Users can only access their own preferences
-- ============================================================================

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- GAMIFICATION RLS POLICIES
-- SECURITY: Users can only access their own gamification data
-- ============================================================================

CREATE POLICY "Users can view their own gamification profile"
  ON public.gamification_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification profile"
  ON public.gamification_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification profile"
  ON public.gamification_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own xp events"
  ON public.xp_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Note: xp_events INSERT is handled by SECURITY DEFINER functions (triggers)
-- This prevents users from awarding themselves XP directly

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Profile creation function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL,
  p_student_id text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- SECURITY: Validate that the caller is creating their own profile
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create profile for another user';
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    v_result := jsonb_build_object(
      'success', true,
      'profile_id', p_user_id,
      'message', 'Profile already exists'
    );
    RETURN v_result;
  END IF;

  -- Insert the profile (SECURITY DEFINER bypasses RLS)
  INSERT INTO public.profiles (id, email, full_name, student_id)
  VALUES (p_user_id, p_email, p_full_name, p_student_id);

  v_result := jsonb_build_object(
    'success', true,
    'profile_id', p_user_id,
    'message', 'Profile created successfully'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
REVOKE EXECUTE ON FUNCTION create_user_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- ============================================================================
-- PROFILE PROTECTION TRIGGER
-- Prevents unauthorized changes to sensitive profile fields
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing student_id after initial set
  IF OLD.student_id IS NOT NULL AND NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    RAISE EXCEPTION 'Cannot modify student_id after it has been set';
  END IF;

  -- Prevent changing email directly
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Cannot modify email directly. Use the authentication flow.';
  END IF;

  -- Auto-update the updated_at timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_fields();

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_profiles_updated_at BEFORE UPDATE ON public.gamification_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ATOMIC UNIT CREATION FUNCTION
-- Creates a unit with its schedule in a single transaction
-- ============================================================================

CREATE OR REPLACE FUNCTION create_unit_with_schedule(
  p_user_id UUID,
  p_code TEXT,
  p_name TEXT,
  p_color TEXT,
  p_building TEXT,
  p_room TEXT,
  p_description TEXT DEFAULT NULL,
  p_schedule JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_unit_id UUID;
  v_schedule_item JSONB;
  v_result JSONB;
BEGIN
  -- Validate user owns this request
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create unit for another user';
  END IF;

  -- Generate unit ID
  v_unit_id := gen_random_uuid();

  -- Insert the unit
  INSERT INTO public.units (id, user_id, code, name, color, building, room, description)
  VALUES (v_unit_id, p_user_id, p_code, p_name, p_color, p_building, p_room, p_description);

  -- Insert class times if provided
  FOR v_schedule_item IN SELECT * FROM jsonb_array_elements(p_schedule)
  LOOP
    INSERT INTO public.class_times (unit_id, day, start_time, end_time)
    VALUES (
      v_unit_id,
      v_schedule_item->>'day',
      v_schedule_item->>'startTime',
      v_schedule_item->>'endTime'
    );
  END LOOP;

  -- Return the created unit with schedule
  SELECT jsonb_build_object(
    'id', u.id,
    'code', u.code,
    'name', u.name,
    'color', u.color,
    'building', u.building,
    'room', u.room,
    'description', u.description,
    'schedule', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', ct.id,
        'day', ct.day,
        'startTime', ct.start_time,
        'endTime', ct.end_time
      )) FROM public.class_times ct WHERE ct.unit_id = u.id),
      '[]'::JSONB
    )
  ) INTO v_result
  FROM public.units u
  WHERE u.id = v_unit_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
REVOKE EXECUTE ON FUNCTION create_unit_with_schedule FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_unit_with_schedule TO authenticated;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
