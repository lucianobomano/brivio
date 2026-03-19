-- Add elapsed_time and subtasks columns to tasks table
-- Run this in Supabase SQL Editor
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS elapsed_time INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);