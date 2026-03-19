-- FIX STATUS COLUMN TYPE
-- Run this in Supabase SQL Editor to allow all task statuses
-- 1. Convert status column to TEXT (this removes the enum restriction)
ALTER TABLE public.tasks
ALTER COLUMN status TYPE TEXT;
-- 2. Ensure default value is 'backlog'
ALTER TABLE public.tasks
ALTER COLUMN status
SET DEFAULT 'backlog';
-- 3. Drop the restrictive enum type (optional, cleans up the database)
DROP TYPE IF EXISTS task_status;