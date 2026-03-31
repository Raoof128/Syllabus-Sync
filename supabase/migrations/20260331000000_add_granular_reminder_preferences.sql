-- Split deadline reminders into assignment/exam, add todo reminders
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS assignment_notifications_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS exam_notifications_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS todo_notifications_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS assignment_reminder_timing_minutes integer NOT NULL DEFAULT 1440,
ADD COLUMN IF NOT EXISTS exam_reminder_timing_minutes integer NOT NULL DEFAULT 1440,
ADD COLUMN IF NOT EXISTS todo_reminder_timing_minutes integer NOT NULL DEFAULT 60;

-- Backfill from existing deadline settings
UPDATE public.user_preferences
SET assignment_notifications_enabled = COALESCE(deadline_notifications_enabled, true),
    exam_notifications_enabled = COALESCE(deadline_notifications_enabled, true),
    todo_notifications_enabled = true,
    assignment_reminder_timing_minutes = COALESCE(deadline_reminder_timing_minutes, 1440),
    exam_reminder_timing_minutes = COALESCE(deadline_reminder_timing_minutes, 1440),
    todo_reminder_timing_minutes = 60;

-- Add constraints (ADD CONSTRAINT does not support IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_assignment_reminder_timing'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT chk_assignment_reminder_timing
        CHECK (assignment_reminder_timing_minutes >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_exam_reminder_timing'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT chk_exam_reminder_timing
        CHECK (exam_reminder_timing_minutes >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_todo_reminder_timing'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT chk_todo_reminder_timing
        CHECK (todo_reminder_timing_minutes >= 0);
  END IF;
END
$$;
