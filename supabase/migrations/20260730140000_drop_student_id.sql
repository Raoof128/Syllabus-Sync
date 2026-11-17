-- BA-0050: stop collecting and storing student IDs.
--
-- Owner decision on 2026-07-30, taken after BA-0048 exposed every user's
-- profile (email, full name, student ID) to any logged-in account for roughly
-- six months. The student ID was the most sensitive field in that set and the
-- only one the application never used for anything: it was collected at signup,
-- stored, and displayed back to its owner. No logic read it, no query filtered
-- on it, and no integration consumed it.
--
-- Removing the column takes the field out of the blast radius of any future
-- access-control defect. That is the whole point: the surest protection for data
-- is not holding it.
--
-- Sequence already completed before this migration runs:
--   1. UPDATE public.profiles SET student_id = NULL  (16 rows carried a value)
--   2. Collection removed from the signup and profile-management flows, the
--      profiles API, the client store, and 140 translation keys across 35
--      locales; deployed as Worker version 2bec54b5 and verified with a live
--      signup that no longer sends the field.
-- Dropping the column only now means production never wrote to a missing column.
--
-- IRREVERSIBLE. The 16 stored values are already gone and no backup of them was
-- kept, by intent.

-- public.user_details selects student_id, so the column cannot be dropped while
-- the view exists. The view is recreated first, WITH (security_invoker = true).
--
-- That option is not optional here. Without it a view runs with its owner's
-- privileges and RLS on profiles stops applying to callers, which is the exact
-- BA-0021 defect. It has been lost twice already, both times through a routine
-- DROP/CREATE that did not carry the option forward. This is that same pattern,
-- so the option is set explicitly and re-checked below.
DROP VIEW IF EXISTS public.user_details;

CREATE VIEW public.user_details
WITH (security_invoker = true) AS
SELECT p.id,
    p.email,
    p.full_name,
    p.faculty,
    p.course,
    p.year,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    gp.xp,
    gp.streak_days,
    gp.longest_streak,
    gp.last_activity_date,
        CASE
            WHEN gp.xp IS NULL OR gp.xp < 0 THEN 1
            ELSE LEAST(100::double precision, floor(sqrt(gp.xp::double precision / 25::double precision)) + 1::double precision)::integer
        END AS level
   FROM profiles p
     LEFT JOIN gamification_profiles gp ON p.id = gp.user_id;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS student_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'student_id'
  ) THEN
    RAISE EXCEPTION 'BA-0050 verification failed: profiles.student_id still exists';
  END IF;

  -- Guard against over-reach: the fields the app does use must survive.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'BA-0050 verification failed: profiles.email is missing';
  END IF;

  -- The recreated view must not have lost security_invoker (BA-0021).
  IF NOT COALESCE(
    (SELECT option_value::boolean
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace,
            pg_options_to_table(c.reloptions)
      WHERE n.nspname = 'public' AND c.relname = 'user_details'
        AND option_name = 'security_invoker'),
    false
  ) THEN
    RAISE EXCEPTION 'BA-0050 verification failed: user_details lost security_invoker, reopening BA-0021';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_details' AND column_name = 'student_id'
  ) THEN
    RAISE EXCEPTION 'BA-0050 verification failed: user_details still exposes student_id';
  END IF;
END
$$;
