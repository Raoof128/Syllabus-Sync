-- Corrected Database Schema for Syllabus Sync
-- Matches website TypeScript types and API expectations
-- This is a reference schema - use supabase/migrations for actual deployment

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

CREATE TABLE public.units (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  description text,
  location jsonb, -- Stores {"building": "C5C", "room": "204"}
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_code_format CHECK (code ~ '^[A-Z]{3,4}\d{3,4}$'),
  CONSTRAINT units_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
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
  title text NOT NULL,
  description text,
  unit_code text NOT NULL, -- References unit code (soft reference for flexibility)
  due_date timestamp with time zone NOT NULL,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Urgent'::text])),
  type text NOT NULL DEFAULT 'Assignment' CHECK (type = ANY (ARRAY['Assignment'::text, 'Exam'::text, 'Quiz'::text, 'Presentation'::text])),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deadlines_pkey PRIMARY KEY (id)
);

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS idx_class_times_unit_id ON public.class_times(unit_id);
CREATE INDEX IF NOT EXISTS idx_class_times_day ON public.class_times(day);
CREATE INDEX IF NOT EXISTS idx_deadlines_unit_code ON public.deadlines(unit_code);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_completed ON public.deadlines(completed);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
