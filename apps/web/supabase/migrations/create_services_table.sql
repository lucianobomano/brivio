-- =====================================================
-- MIGRATION: Create services table & project associations
-- =====================================================
-- Run this in your Supabase SQL Editor
-- 1. Create the services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price TEXT,
    delivery TEXT,
    image TEXT,
    -- Gradient class or image URL
    cover_url TEXT,
    -- Path to custom cover image in storage
    is_active BOOLEAN DEFAULT true
);
-- 2. Create the service_projects join table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.service_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    UNIQUE(service_id, project_id)
);
-- 3. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_services_creator_id ON public.services(creator_id);
CREATE INDEX IF NOT EXISTS idx_service_projects_service_id ON public.service_projects(service_id);
CREATE INDEX IF NOT EXISTS idx_service_projects_project_id ON public.service_projects(project_id);
-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_projects ENABLE ROW LEVEL SECURITY;
-- 5. Create RLS Policies for Services
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services FOR
SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Creators can manage their own services" ON public.services;
CREATE POLICY "Creators can manage their own services" ON public.services FOR ALL TO authenticated USING (
    creator_id IN (
        SELECT id
        FROM public.creator_profiles
        WHERE user_id = auth.uid()
    )
) WITH CHECK (
    creator_id IN (
        SELECT id
        FROM public.creator_profiles
        WHERE user_id = auth.uid()
    )
);
-- 6. Create RLS Policies for Service Projects
DROP POLICY IF EXISTS "Public can view service projects" ON public.service_projects;
CREATE POLICY "Public can view service projects" ON public.service_projects FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Creators can manage their own service projects" ON public.service_projects;
CREATE POLICY "Creators can manage their own service projects" ON public.service_projects FOR ALL TO authenticated USING (
    service_id IN (
        SELECT id
        FROM public.services
        WHERE creator_id IN (
                SELECT id
                FROM public.creator_profiles
                WHERE user_id = auth.uid()
            )
    )
) WITH CHECK (
    service_id IN (
        SELECT id
        FROM public.services
        WHERE creator_id IN (
                SELECT id
                FROM public.creator_profiles
                WHERE user_id = auth.uid()
            )
    )
);
-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS trigger_update_services_updated_at ON public.services;
CREATE TRIGGER trigger_update_services_updated_at BEFORE
UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 8. Notify PostgREST
NOTIFY pgrst,
'reload config';