-- ============================================================================
-- SYLLABUS SYNC DATABASE SCHEMA
-- ============================================================================
-- This schema defines the complete database structure for the Syllabus Sync
-- university campus management application.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- User profiles linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  student_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- UNITS TABLE
-- ============================================================================
-- Academic units/courses
CREATE TABLE IF NOT EXISTS public.units (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT,
  location JSONB, -- { building: string, room: string }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT units_code_format CHECK (code ~ '^[A-Z]{3}\d{3}$'),
  CONSTRAINT units_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================================
-- CLASS TIMES TABLE
-- ============================================================================
-- Class schedule times for units
CREATE TABLE IF NOT EXISTS public.class_times (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT class_times_day_enum CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  CONSTRAINT class_times_time_format CHECK (
    start_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' AND
    end_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
  ),
  CONSTRAINT class_times_valid_times CHECK (start_time < end_time)
);

-- ============================================================================
-- DEADLINES TABLE
-- ============================================================================
-- Assignment deadlines
CREATE TABLE IF NOT EXISTS public.deadlines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  unit_code TEXT NOT NULL REFERENCES public.units(code) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  type TEXT NOT NULL DEFAULT 'Assignment',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT deadlines_priority_enum CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  CONSTRAINT deadlines_type_enum CHECK (type IN ('Assignment', 'Exam', 'Quiz', 'Presentation')),
  CONSTRAINT deadlines_future_date CHECK (due_date > NOW())
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- User notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT notifications_type_enum CHECK (type IN ('deadline', 'event', 'class', 'system'))
);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Campus events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  building TEXT, -- Optional building reference
  category TEXT NOT NULL DEFAULT 'Academic',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT events_category_enum CHECK (category IN ('Career', 'Social', 'Academic', 'Free Food')),
  CONSTRAINT events_time_format CHECK (time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
-- User settings and preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_preferences_theme_enum CHECK (theme IN ('light', 'dark', 'system'))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units(code);
CREATE INDEX IF NOT EXISTS idx_units_created_at ON public.units(created_at);

-- Class times indexes
CREATE INDEX IF NOT EXISTS idx_class_times_unit_id ON public.class_times(unit_id);
CREATE INDEX IF NOT EXISTS idx_class_times_day ON public.class_times(day);

-- Deadlines indexes
CREATE INDEX IF NOT EXISTS idx_deadlines_unit_code ON public.deadlines(unit_code);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_completed ON public.deadlines(completed);
CREATE INDEX IF NOT EXISTS idx_deadlines_created_at ON public.deadlines(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_building ON public.events(building);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Allow users to view all profiles (for mentions, etc.)
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- UNITS POLICIES (Public read, authenticated create/update)
-- ============================================================================

-- Allow all users to view units
CREATE POLICY "units_select_policy" ON public.units
  FOR SELECT USING (true);

-- Allow authenticated users to create units
CREATE POLICY "units_insert_policy" ON public.units
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update units
CREATE POLICY "units_update_policy" ON public.units
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete units
CREATE POLICY "units_delete_policy" ON public.units
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- CLASS TIMES POLICIES
-- ============================================================================

-- Allow all users to view class times
CREATE POLICY "class_times_select_policy" ON public.class_times
  FOR SELECT USING (true);

-- Allow authenticated users to manage class times
CREATE POLICY "class_times_insert_policy" ON public.class_times
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "class_times_update_policy" ON public.class_times
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "class_times_delete_policy" ON public.class_times
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- DEADLINES POLICIES
-- ============================================================================

-- Allow all users to view deadlines
CREATE POLICY "deadlines_select_policy" ON public.deadlines
  FOR SELECT USING (true);

-- Allow authenticated users to manage deadlines
CREATE POLICY "deadlines_insert_policy" ON public.deadlines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "deadlines_update_policy" ON public.deadlines
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "deadlines_delete_policy" ON public.deadlines
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- NOTIFICATIONS POLICIES (User-specific)
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create notifications (for their own account)
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_policy" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- EVENTS POLICIES (Public read, admin create/update)
-- ============================================================================

-- Allow all users to view events
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT USING (true);

-- Allow authenticated users to create events (could be restricted to admins)
CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- USER PREFERENCES POLICIES (User-specific)
-- ============================================================================

-- Users can only view their own preferences
CREATE POLICY "user_preferences_select_policy" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own preferences
CREATE POLICY "user_preferences_insert_policy" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "user_preferences_update_policy" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "user_preferences_delete_policy" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA SEEDING (Optional)
-- ============================================================================

-- Note: Initial data seeding should be done through the application
-- or via separate migration scripts to avoid conflicts

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for tables that need live updates
-- Note: These would be configured in Supabase dashboard or via SQL
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.deadlines;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
