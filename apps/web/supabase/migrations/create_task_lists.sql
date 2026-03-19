-- Create task_lists table for Blitz Tasks feature
-- Run this migration in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS public.task_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#8c92c7',
    icon_url TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_task_lists_user_id ON public.task_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_archived ON public.task_lists(archived);
-- Enable RLS
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
-- RLS Policies
CREATE POLICY "Users can view own lists" ON public.task_lists FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own lists" ON public.task_lists FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.task_lists FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.task_lists FOR DELETE USING (auth.uid() = user_id);