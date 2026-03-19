-- COMPREHENSIVE FIX FOR TASKS TABLE
-- Run this ENTIRE block in Supabase SQL Editor
-- 1. Refresh schema cache
NOTIFY pgrst,
'reload config';
-- 2. Ensure table exists with base fields
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 3. Add ALL required columns (safe to run even if they exist)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES public.task_lists(id) ON DELETE CASCADE;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'backlog';
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 0;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS elapsed_time INTEGER DEFAULT 0;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
-- 4. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON public.tasks(list_id);
-- 5. Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- 6. Reset RLS Policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks via list" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks via list" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks via list" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks via list" ON public.tasks;
-- 7. Create Simple Policies (Assuming list access implies task access)
CREATE POLICY "Users can view tasks via list" ON public.tasks FOR
SELECT USING (
        list_id IN (
            SELECT id
            FROM public.task_lists
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can create tasks via list" ON public.tasks FOR
INSERT WITH CHECK (
        list_id IN (
            SELECT id
            FROM public.task_lists
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update tasks via list" ON public.tasks FOR
UPDATE USING (
        list_id IN (
            SELECT id
            FROM public.task_lists
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete tasks via list" ON public.tasks FOR DELETE USING (
    list_id IN (
        SELECT id
        FROM public.task_lists
        WHERE user_id = auth.uid()
    )
);