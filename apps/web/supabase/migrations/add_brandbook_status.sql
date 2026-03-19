-- Migration: Add status to brandbooks
-- Description: Adds a status column to track visibility of brandbooks.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'brandbooks'
        AND column_name = 'status'
) THEN
ALTER TABLE public.brandbooks
ADD COLUMN status TEXT DEFAULT 'draft';
-- Optional: Sync with is_public if it exists
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'brandbooks'
        AND column_name = 'is_public'
) THEN
UPDATE public.brandbooks
SET status = 'public'
WHERE is_public = true;
END IF;
END IF;
END $$;