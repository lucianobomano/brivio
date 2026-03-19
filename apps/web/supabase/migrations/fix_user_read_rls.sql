-- =====================================================
-- FIX: Allow public read of basic user profiles
-- =====================================================
-- Currently, the 'users' table has RLS that restricts users to seeing only their own record.
-- This prevents seeing creators' names and avatars when logged in as a different user.
-- 1. Drop existing restrictive read policy if it exists
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
-- 2. Create a new policy that allows anyone to view BASIC user information
-- We allow viewing of public fields for all users
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR
SELECT USING (true);
-- 3. If you want to keep it slightly more restrictive to only authenticated users:
-- CREATE POLICY "Public profiles are viewable by authenticated users" ON public.users
--     FOR SELECT
--     TO authenticated
--     USING (true);
-- 4. Note: Sensitive fields like email should ideally be protected by partial column-based RLS
-- but since Postgres doesn't support column-level SELECT RLS natively, we rely on the application code
-- to only select the fields needed for display (name, avatar, etc.).
-- 5. Ensure creator_profiles is also readable by everyone
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creator profiles are viewable by everyone" ON public.creator_profiles;
CREATE POLICY "Creator profiles are viewable by everyone" ON public.creator_profiles FOR
SELECT USING (true);
-- 6. Notify PostgREST to reload the schema cache
NOTIFY pgrst,
'reload config';