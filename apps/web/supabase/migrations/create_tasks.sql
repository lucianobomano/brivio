-- Create tasks table for Kanban board
-- Run this migration in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.task_lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'backlog',
    -- backlog, this_week, today, done
    estimated_time INTEGER DEFAULT 0,
    -- in minutes
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- RLS Policies (via task_lists ownership)
CREATE POLICY "Users can view tasks in their lists" ON public.tasks FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.task_lists
            WHERE task_lists.id = tasks.list_id
                AND task_lists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can create tasks in their lists" ON public.tasks FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.task_lists
            WHERE task_lists.id = tasks.list_id
                AND task_lists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update tasks in their lists" ON public.tasks FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.task_lists
            WHERE task_lists.id = tasks.list_id
                AND task_lists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete tasks in their lists" ON public.tasks FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.task_lists
        WHERE task_lists.id = tasks.list_id
            AND task_lists.user_id = auth.uid()
    )
);