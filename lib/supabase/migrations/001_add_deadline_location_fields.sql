-- Migration: Add location fields to deadlines table
-- Purpose: Enable exams to store building, room, and color information
-- Date: 2026-01-24

-- Add building column for exam location (e.g., "C5C")
ALTER TABLE public.deadlines 
ADD COLUMN IF NOT EXISTS building TEXT;

-- Add room column for exam room number (e.g., "204")
ALTER TABLE public.deadlines 
ADD COLUMN IF NOT EXISTS room TEXT;

-- Add color column for custom display color override
ALTER TABLE public.deadlines 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.deadlines.building IS 'Building code for exam location (e.g., C5C)';
COMMENT ON COLUMN public.deadlines.room IS 'Room number for exam location (e.g., 204)';
COMMENT ON COLUMN public.deadlines.color IS 'Custom color override for display in calendar';
