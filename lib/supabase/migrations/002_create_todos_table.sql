-- Migration: Create todos table for To-Do List widget
-- Purpose: Store user tasks separate from academic deadlines
-- Date: 2026-01-24

-- ============================================================================
-- TODOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON public.todos(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Revoke from anon
REVOKE ALL ON public.todos FROM anon;

-- Grant to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;

-- ============================================================================
-- RLS POLICIES
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
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.todos IS 'User to-do items for the To-Do List widget';
COMMENT ON COLUMN public.todos.priority IS 'Priority: Low, Medium, or High';
COMMENT ON COLUMN public.todos.completed_at IS 'Timestamp when the task was marked complete';
COMMENT ON COLUMN public.todos.deleted_at IS 'Soft delete timestamp';
