-- =====================================================
-- TRIGGER: Auto-create creator_profile for new users
-- =====================================================
-- This trigger automatically creates a creator_profile record
-- whenever a new user is inserted into the users table.
-- This ensures every user has an associated creator_profile.
-- 1. Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.create_creator_profile_for_new_user() RETURNS TRIGGER AS $$ BEGIN -- Insert a new creator_profile for the newly created user
INSERT INTO public.creator_profiles (
        id,
        user_id,
        location,
        website,
        category,
        type,
        country,
        works_count,
        soty_count,
        sotm_count,
        sotd_count,
        hm_count,
        about,
        experience,
        expertise,
        tools,
        languages,
        education
    )
VALUES (
        gen_random_uuid(),
        NEW.id,
        NULL,
        -- location (to be filled by user)
        NULL,
        -- website (to be filled by user)
        'Creativo',
        -- default category
        'Individual',
        -- default type
        NULL,
        -- country (to be filled by user)
        0,
        -- works_count
        0,
        -- soty_count
        0,
        -- sotm_count
        0,
        -- sotd_count
        0,
        -- hm_count
        NULL,
        -- about (to be filled by user)
        '[]'::jsonb,
        -- experience
        ARRAY []::text [],
        -- expertise
        '[]'::jsonb,
        -- tools
        '[]'::jsonb,
        -- languages
        '[]'::jsonb -- education
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Drop the trigger if it already exists (to avoid duplicate)
DROP TRIGGER IF EXISTS trigger_create_creator_profile ON public.users;
-- 3. Create the trigger that fires AFTER INSERT on users table
CREATE TRIGGER trigger_create_creator_profile
AFTER
INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_creator_profile_for_new_user();
-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_creator_profile_for_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_creator_profile_for_new_user() TO authenticated;
-- 5. Notify PostgREST to reload the schema cache
NOTIFY pgrst,
'reload config';
-- =====================================================
-- OPTIONAL: Create profiles for existing users without one
-- =====================================================
-- Run this to populate creator_profiles for existing users
-- who don't already have a profile:
INSERT INTO public.creator_profiles (
        id,
        user_id,
        category,
        type,
        works_count,
        soty_count,
        sotm_count,
        sotd_count,
        hm_count,
        experience,
        expertise,
        tools,
        languages,
        education
    )
SELECT gen_random_uuid(),
    u.id,
    'Creativo',
    'Individual',
    0,
    0,
    0,
    0,
    0,
    '[]'::jsonb,
    ARRAY []::text [],
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb
FROM public.users u
WHERE NOT EXISTS (
        SELECT 1
        FROM public.creator_profiles cp
        WHERE cp.user_id = u.id
    );