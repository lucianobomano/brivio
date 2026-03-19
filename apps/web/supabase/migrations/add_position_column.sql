-- Add 'position' column for drag-and-drop reordering
-- Run this in Supabase SQL Editor
-- 1. Add column
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION DEFAULT 0;
-- 2. Initialize position for existing tasks
-- Orders them by creation date with a gap of 1000 to allow insertion
WITH ranked_tasks AS (
    SELECT id,
        ROW_NUMBER() OVER (
            PARTITION BY list_id,
            status
            ORDER BY created_at
        ) as rn
    FROM public.tasks
)
UPDATE public.tasks
SET position = ranked_tasks.rn * 1000
FROM ranked_tasks
WHERE public.tasks.id = ranked_tasks.id;
-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(position);