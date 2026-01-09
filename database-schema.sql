-- Database Schema for Syllabus Sync
-- Last Updated: 2026-01-08
-- This is a reference schema - actual database uses supabase/migrations
--
-- IMPORTANT: The API mappers (app/api/_lib/mappers.ts) handle both:
--   - JSONB location field (preferred)
--   - Flat building/room columns (legacy/current remote)
--
-- Migrations Applied:
--   - 20260108131028: Added user_id columns and RLS policies
--   - 20260108140000: Event column fixes and seed data triggers
--   - 20260108150000: Fixed RLS policies with TO authenticated, added class_times RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  student_id text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Note: Remote database uses flat building/room columns instead of location JSONB
-- The API mappers handle both formats for backwards compatibility
CREATE TABLE public.units (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL, -- Owner of this unit (security: user-scoped data)
  code text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  description text,
  -- Remote uses: building text, room text (flat columns)
  -- Preferred: location jsonb storing {"building": "C5C", "room": "204"}
  building text,
  room text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT units_user_code_unique UNIQUE (user_id, code) -- Each user can have unique unit codes
);

CREATE TABLE public.class_times (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL,
  day text NOT NULL CHECK (day = ANY (ARRAY['Monday'::text, 'Tuesday'::text, 'Wednesday'::text, 'Thursday'::text, 'Friday'::text, 'Saturday'::text, 'Sunday'::text])),
  start_time text NOT NULL, -- "09:00" format
  end_time text NOT NULL, -- "11:00" format
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_times_pkey PRIMARY KEY (id),
  CONSTRAINT class_times_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE,
  CONSTRAINT class_times_time_format CHECK (
    start_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' AND
    end_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
  ),
  CONSTRAINT class_times_valid_times CHECK (start_time < end_time)
);

CREATE TABLE public.deadlines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL, -- Owner of this deadline (security: user-scoped data)
  title text NOT NULL,
  description text,
  unit_code text NOT NULL, -- References unit code (soft reference for flexibility)
  due_date timestamp with time zone NOT NULL,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Urgent'::text])),
  type text NOT NULL DEFAULT 'Assignment' CHECK (type = ANY (ARRAY['Assignment'::text, 'Exam'::text, 'Quiz'::text, 'Presentation'::text])),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deadlines_pkey PRIMARY KEY (id),
  CONSTRAINT deadlines_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid, -- Owner of this event (NULL = public/shared event, security: user-scoped data)
  title text NOT NULL,
  description text NOT NULL,
  event_date date NOT NULL,
  event_time text NOT NULL, -- "2:00 PM" or "14:00" format
  location text NOT NULL,
  building text, -- For map navigation
  category text NOT NULL DEFAULT 'Academic' CHECK (category = ANY (ARRAY['Career'::text, 'Social'::text, 'Academic'::text, 'Free Food'::text])),
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Accept both 24h format (HH:MM) and 12h format (H:MM AM/PM)
  CONSTRAINT events_time_format CHECK (event_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$|^(1[0-2]|0?[1-9]):[0-5][0-9] [AP]M$')
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system' CHECK (type = ANY (ARRAY['deadline'::text, 'event'::text, 'class'::text, 'system'::text])),
  read boolean NOT NULL DEFAULT false,
  link text,
  related_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  theme text DEFAULT 'system' CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units(code);
CREATE INDEX IF NOT EXISTS idx_units_user_id ON public.units(user_id);
CREATE INDEX IF NOT EXISTS idx_class_times_unit_id ON public.class_times(unit_id);
CREATE INDEX IF NOT EXISTS idx_class_times_day ON public.class_times(day);
CREATE INDEX IF NOT EXISTS idx_deadlines_unit_code ON public.deadlines(unit_code);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_completed ON public.deadlines(completed);
CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON public.deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- CRITICAL: All policies use TO authenticated to block anonymous access
-- ============================================================================

-- Enable RLS on all user-scoped tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Revoke anonymous access from all user-scoped tables
REVOKE ALL ON public.units FROM anon;
REVOKE ALL ON public.class_times FROM anon;
REVOKE ALL ON public.deadlines FROM anon;
REVOKE ALL ON public.events FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.user_preferences FROM anon;
REVOKE ALL ON public.profiles FROM anon;

-- Grant to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_times TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deadlines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Units: Users can only access their own units
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

-- Class Times: Users can only access class_times for their own units
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

-- Deadlines: Users can only access their own deadlines
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

-- Events: Users can view public events (user_id IS NULL) or their own events
CREATE POLICY "Users can view public or their own events"
  ON public.events FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

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

-- Notifications: Users can only access their own notifications
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

-- User Preferences: Users can only access their own preferences
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

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- SECURITY: Restrict profile updates to safe columns only
-- student_id and email are protected - can only be set by admin/trigger
-- Users can only update: full_name, avatar_url
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Ensure student_id cannot be changed by comparing old vs new
    -- This is enforced via a trigger below for complete protection
  );

-- Trigger function to prevent modification of sensitive profile fields
CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing student_id after initial set (only admin can change via separate process)
  IF OLD.student_id IS NOT NULL AND NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    RAISE EXCEPTION 'Cannot modify student_id after it has been set';
  END IF;
  
  -- Prevent changing email (should only change via auth flow)
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

-- Policy for profile insertion (needed for signup flow)
-- This allows users to insert their own profile row during signup
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- SECURITY: Allow profile creation for new users during registration
-- This handles cases where Supabase auth hooks create profiles before authentication is fully established
-- The policy is temporary and will be removed once the user is properly authenticated
CREATE POLICY "Allow new user profile creation"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- SECURITY FIX: Allow profile creation during user registration
-- This handles Supabase auth hooks that may create profiles before full authentication
-- The policy allows inserts where the ID matches the authenticated user's ID
-- This prevents the "Database error saving new user" during signup
CREATE POLICY "Allow profile creation during user registration"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ATOMIC TRANSACTION FUNCTIONS
-- SECURITY: These functions ensure data consistency and prevent orphaned records
-- ============================================================================

/**
 * Create a unit with its class times in a single atomic transaction
 * This prevents orphaned units if class_times insertion fails
 */
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
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create unit for another user';
  END IF;

  -- Generate unit ID
  v_unit_id := uuid_generate_v4();

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
GRANT EXECUTE ON FUNCTION create_unit_with_schedule TO authenticated;

-- ============================================================================
-- GAMIFICATION SYSTEM - XP, Levels, Streaks
-- Phase 1: MVP implementation for visual progression feedback
-- ============================================================================

/**
 * gamification_profiles - Current state snapshot for each user
 * This is the "scoreboard" that the UI fetches to display XP/level/streak
 */
CREATE TABLE public.gamification_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak_days integer NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date date, -- NULL if never active
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gamification_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

/**
 * xp_events - Audit log of all XP changes (transaction history)
 * Used for debugging, anti-cheat, and future features like charts
 */
CREATE TABLE public.xp_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY[
    'deadline_completed'::text,    -- Completing a deadline
    'deadline_early'::text,        -- Completing deadline early (bonus)
    'daily_login'::text,           -- First activity of the day
    'streak_bonus'::text,          -- Bonus for maintaining streak
    'unit_added'::text,            -- Adding a new unit
    'event_attended'::text,        -- Marking event as attended
    'profile_completed'::text,     -- Completing profile info
    'first_deadline'::text,        -- First deadline ever completed
    'weekly_goal'::text,           -- Weekly completion goal
    'level_up_bonus'::text         -- Bonus XP on level up
  ])),
  xp_amount integer NOT NULL CHECK (xp_amount > 0),
  reference_id uuid, -- Optional: ID of related entity (deadline_id, unit_id, etc.)
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional context (deadline title, etc.)
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xp_events_pkey PRIMARY KEY (id),
  CONSTRAINT xp_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for gamification tables
CREATE INDEX IF NOT EXISTS idx_gamification_profiles_user_id ON public.gamification_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON public.xp_events(created_at);
CREATE INDEX IF NOT EXISTS idx_xp_events_event_type ON public.xp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_xp_events_reference_id ON public.xp_events(reference_id);

-- Enable RLS on gamification tables
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- Revoke anonymous access
REVOKE ALL ON public.gamification_profiles FROM anon;
REVOKE ALL ON public.xp_events FROM anon;

-- Grant to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.gamification_profiles TO authenticated;
GRANT SELECT, INSERT ON public.xp_events TO authenticated;

-- RLS Policies for gamification_profiles
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

-- RLS Policies for xp_events (read-only for users, inserts via triggers)
CREATE POLICY "Users can view their own xp events"
  ON public.xp_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Note: xp_events INSERT is handled by SECURITY DEFINER functions (triggers)
-- This prevents users from awarding themselves XP directly

-- ============================================================================
-- XP CONFIGURATION - Easy to tune without code changes
-- ============================================================================

-- XP amounts for each action (can be adjusted without migrations)
CREATE TABLE IF NOT EXISTS public.xp_config (
  event_type text PRIMARY KEY,
  base_xp integer NOT NULL CHECK (base_xp > 0),
  description text
);

INSERT INTO public.xp_config (event_type, base_xp, description) VALUES
  ('deadline_completed', 25, 'Completing any deadline'),
  ('deadline_early', 10, 'Bonus for completing 24h+ before due date'),
  ('daily_login', 5, 'First activity of the day'),
  ('streak_bonus', 5, 'Per day of streak (multiplied by streak_days)'),
  ('unit_added', 15, 'Adding a new unit to schedule'),
  ('event_attended', 10, 'Marking a campus event as attended'),
  ('profile_completed', 50, 'One-time bonus for completing profile'),
  ('first_deadline', 25, 'One-time bonus for first deadline completed'),
  ('weekly_goal', 50, 'Completing 5+ deadlines in a week'),
  ('level_up_bonus', 10, 'Bonus XP on level up (multiplied by new level)')
ON CONFLICT (event_type) DO NOTHING;

-- Make xp_config readable by authenticated users
GRANT SELECT ON public.xp_config TO authenticated;

-- ============================================================================
-- XP LEVEL CALCULATION - Derived function (not stored)
-- ============================================================================

/**
 * Calculate level from XP using a progressive curve
 * Level 1: 0-99 XP
 * Level 2: 100-249 XP
 * Level 3: 250-449 XP
 * Level n: Uses formula floor(sqrt(xp / 50)) + 1, capped at level 100
 */
CREATE OR REPLACE FUNCTION calculate_level(p_xp integer)
RETURNS integer AS $$
BEGIN
  IF p_xp < 0 THEN
    RETURN 1;
  END IF;
  -- Progressive curve: each level requires more XP
  -- Level 1: 0-49, Level 2: 50-149, Level 3: 150-299, etc.
  RETURN LEAST(100, FLOOR(SQRT(p_xp::float / 25)) + 1)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Calculate XP required to reach a specific level
 */
CREATE OR REPLACE FUNCTION xp_for_level(p_level integer)
RETURNS integer AS $$
BEGIN
  IF p_level <= 1 THEN
    RETURN 0;
  END IF;
  RETURN ((p_level - 1) * (p_level - 1) * 25)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- GAMIFICATION TRIGGERS - Automatic XP awards
-- ============================================================================

/**
 * Award XP to a user (internal function, called by triggers)
 * This is SECURITY DEFINER to ensure consistent XP awards
 */
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id uuid,
  p_event_type text,
  p_reference_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_base_xp integer;
  v_xp_amount integer;
  v_old_xp integer;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
  v_streak_days integer;
  v_level_up_bonus integer;
BEGIN
  -- Get base XP for this event type
  SELECT base_xp INTO v_base_xp FROM public.xp_config WHERE event_type = p_event_type;
  IF v_base_xp IS NULL THEN
    RAISE EXCEPTION 'Unknown XP event type: %', p_event_type;
  END IF;
  
  v_xp_amount := v_base_xp;
  
  -- Get current user profile (create if doesn't exist)
  INSERT INTO public.gamification_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT xp, streak_days INTO v_old_xp, v_streak_days
  FROM public.gamification_profiles
  WHERE user_id = p_user_id;
  
  v_old_level := calculate_level(v_old_xp);
  
  -- Apply streak multiplier for streak_bonus
  IF p_event_type = 'streak_bonus' AND v_streak_days > 0 THEN
    v_xp_amount := v_base_xp * v_streak_days;
  END IF;
  
  -- Calculate new XP
  v_new_xp := v_old_xp + v_xp_amount;
  v_new_level := calculate_level(v_new_xp);
  
  -- Record the XP event
  INSERT INTO public.xp_events (user_id, event_type, xp_amount, reference_id, metadata)
  VALUES (p_user_id, p_event_type, v_xp_amount, p_reference_id, p_metadata);
  
  -- Update user's total XP
  UPDATE public.gamification_profiles
  SET xp = v_new_xp, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Award level up bonus if leveled up
  IF v_new_level > v_old_level THEN
    v_level_up_bonus := 10 * v_new_level;
    
    INSERT INTO public.xp_events (user_id, event_type, xp_amount, metadata)
    VALUES (p_user_id, 'level_up_bonus', v_level_up_bonus, 
            jsonb_build_object('old_level', v_old_level, 'new_level', v_new_level));
    
    UPDATE public.gamification_profiles
    SET xp = xp + v_level_up_bonus, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_new_xp := v_new_xp + v_level_up_bonus;
  END IF;
  
  RETURN jsonb_build_object(
    'xp_awarded', v_xp_amount,
    'old_xp', v_old_xp,
    'new_xp', v_new_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Update daily streak when user performs an action
 */
CREATE OR REPLACE FUNCTION update_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_last_date date;
  v_today date := CURRENT_DATE;
  v_streak integer;
  v_longest integer;
BEGIN
  -- Ensure profile exists
  INSERT INTO public.gamification_profiles (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT last_activity_date, streak_days, longest_streak 
  INTO v_last_date, v_streak, v_longest
  FROM public.gamification_profiles
  WHERE user_id = p_user_id;
  
  IF v_last_date IS NULL THEN
    -- First activity ever
    UPDATE public.gamification_profiles
    SET streak_days = 1, last_activity_date = v_today, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Award daily login XP
    PERFORM award_xp(p_user_id, 'daily_login');
    
  ELSIF v_last_date = v_today THEN
    -- Already active today, do nothing
    NULL;
    
  ELSIF v_last_date = v_today - 1 THEN
    -- Consecutive day - increment streak
    UPDATE public.gamification_profiles
    SET streak_days = streak_days + 1,
        longest_streak = GREATEST(longest_streak, streak_days + 1),
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Award daily login + streak bonus
    PERFORM award_xp(p_user_id, 'daily_login');
    PERFORM award_xp(p_user_id, 'streak_bonus');
    
  ELSE
    -- Streak broken - reset to 1
    UPDATE public.gamification_profiles
    SET streak_days = 1, last_activity_date = v_today, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Award daily login XP
    PERFORM award_xp(p_user_id, 'daily_login');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Trigger: Award XP when a deadline is completed
 */
CREATE OR REPLACE FUNCTION on_deadline_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_is_early boolean;
  v_is_first boolean;
BEGIN
  -- Only trigger when completed changes from false to true
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    -- Update streak
    PERFORM update_streak(NEW.user_id);
    
    -- Check if this is the user's first completed deadline
    SELECT NOT EXISTS (
      SELECT 1 FROM public.deadlines 
      WHERE user_id = NEW.user_id AND completed = true AND id != NEW.id
    ) INTO v_is_first;
    
    IF v_is_first THEN
      PERFORM award_xp(NEW.user_id, 'first_deadline', NEW.id, 
                       jsonb_build_object('title', NEW.title));
    END IF;
    
    -- Award base completion XP
    PERFORM award_xp(NEW.user_id, 'deadline_completed', NEW.id,
                     jsonb_build_object('title', NEW.title, 'unit_code', NEW.unit_code));
    
    -- Check if completed early (24h+ before due date)
    IF NEW.due_date > NOW() + INTERVAL '24 hours' THEN
      PERFORM award_xp(NEW.user_id, 'deadline_early', NEW.id,
                       jsonb_build_object('hours_early', 
                         EXTRACT(EPOCH FROM (NEW.due_date - NOW())) / 3600));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER deadline_completed_trigger
  AFTER UPDATE OF completed ON public.deadlines
  FOR EACH ROW
  EXECUTE FUNCTION on_deadline_completed();

/**
 * Trigger: Award XP when a new unit is added
 */
CREATE OR REPLACE FUNCTION on_unit_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Update streak
  PERFORM update_streak(NEW.user_id);
  
  -- Award XP for adding a unit
  PERFORM award_xp(NEW.user_id, 'unit_added', NEW.id,
                   jsonb_build_object('code', NEW.code, 'name', NEW.name));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER unit_created_trigger
  AFTER INSERT ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION on_unit_created();

-- ============================================================================
-- PROFILE CREATION FUNCTION - Bypasses RLS for signup flow
-- ============================================================================

/**
 * Create a user profile during signup - SECURITY DEFINER to bypass RLS
 * This function is called by the signup API to create profiles safely
 */
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
  -- Validate that the caller is creating their own profile
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create profile for another user';
  END IF;

  -- Insert the profile
  INSERT INTO public.profiles (id, email, full_name, student_id)
  VALUES (p_user_id, p_email, p_full_name, p_student_id);

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'profile_id', p_user_id,
    'message', 'Profile created successfully'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- Grant execute on gamification functions
GRANT EXECUTE ON FUNCTION calculate_level TO authenticated;
GRANT EXECUTE ON FUNCTION xp_for_level TO authenticated;
