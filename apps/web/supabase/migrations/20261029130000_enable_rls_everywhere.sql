-- SECURITY: close every public table to direct access with the public anon key.
--
-- Before this migration 44 of 66 public tables had RLS disabled while the anon and authenticated
-- roles held full table grants, so anyone with the anon key (shipped in the browser bundle) could
-- read and modify them through the REST API — including admin_users (self-promotion to superadmin).
--
-- Server code that uses the service-role client or Prisma bypasses RLS and is unaffected; the
-- policies below cover the code paths that use the user's session (server RLS client and browser).
-- All policies are granted to `authenticated` only: anon gets nothing on these tables.
--
-- Rollback for a single table: ALTER TABLE public.<t> DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies can look up membership without recursing
-- through the RLS of the tables they consult)
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rls_is_superadmin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false)
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE lower(email) = lower(auth.jwt() ->> 'email') AND role = 'superadmin'
        )
$$;

CREATE OR REPLACE FUNCTION public.rls_is_workspace_member(ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT ws IS NOT NULL AND (
        EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = ws AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = ws AND created_by = auth.uid())
    )
$$;

CREATE OR REPLACE FUNCTION public.rls_can_access_brand(b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT b IS NOT NULL AND (
        EXISTS (SELECT 1 FROM public.brands WHERE id = b AND public.rls_is_workspace_member(workspace_id))
        OR public.rls_is_superadmin()
    )
$$;

CREATE OR REPLACE FUNCTION public.rls_can_access_project(p uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT p IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p AND (created_by = auth.uid() OR public.rls_is_workspace_member(workspace_id))
    )
$$;

-- Members, plus anyone for published (portfolio/community) projects — mirrors the projects SELECT policy
CREATE OR REPLACE FUNCTION public.rls_can_view_project(p uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.rls_can_access_project(p)
        OR EXISTS (SELECT 1 FROM public.projects WHERE id = p AND status = 'done')
$$;

CREATE OR REPLACE FUNCTION public.rls_can_access_brandbook(bb uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.brandbooks WHERE id = bb AND public.rls_can_access_brand(brand_id))
$$;

CREATE OR REPLACE FUNCTION public.rls_can_view_brandbook(bb uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.brandbooks
        WHERE id = bb AND (is_public = true OR visibility = 'public' OR public.rls_can_access_brand(brand_id))
    )
$$;

CREATE OR REPLACE FUNCTION public.rls_can_access_space(s uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.brand_spaces WHERE id = s AND public.rls_can_access_brand(brand_id))
$$;

CREATE OR REPLACE FUNCTION public.rls_can_access_proposal(pr uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.proposals
        WHERE id = pr AND (public.rls_can_access_brand(brand_id) OR public.rls_can_access_project(project_id))
    )
$$;

CREATE OR REPLACE FUNCTION public.rls_can_access_standup_team(t uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.standup_teams st
        WHERE st.id = t AND (
            st.leader_id = auth.uid()
            OR public.rls_is_workspace_member(st.workspace_id)
            OR EXISTS (SELECT 1 FROM public.standup_team_members m WHERE m.team_id = st.id AND m.user_id = auth.uid())
        )
    )
$$;

REVOKE EXECUTE ON FUNCTION
    public.rls_is_superadmin(), public.rls_is_workspace_member(uuid), public.rls_can_access_brand(uuid),
    public.rls_can_access_project(uuid), public.rls_can_view_project(uuid), public.rls_can_access_brandbook(uuid),
    public.rls_can_view_brandbook(uuid), public.rls_can_access_space(uuid), public.rls_can_access_proposal(uuid),
    public.rls_can_access_standup_team(uuid)
FROM anon, public;
GRANT EXECUTE ON FUNCTION
    public.rls_is_superadmin(), public.rls_is_workspace_member(uuid), public.rls_can_access_brand(uuid),
    public.rls_can_access_project(uuid), public.rls_can_view_project(uuid), public.rls_can_access_brandbook(uuid),
    public.rls_can_view_brandbook(uuid), public.rls_can_access_space(uuid), public.rls_can_access_proposal(uuid),
    public.rls_can_access_standup_team(uuid)
TO authenticated, service_role;

-- document_templates had no owner column; new rows record their author
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

-- ---------------------------------------------------------------------------------------------
-- Enable RLS on every table that had it off
-- ---------------------------------------------------------------------------------------------

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;            -- no policies: service role only
ALTER TABLE public.asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brandbook_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brandbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standup_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------------------------

-- Asset library: rows are scoped to a brand or a workspace (a few legacy rows to neither: uploader only)
CREATE POLICY rls_asset_folders_member ON public.asset_folders FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id) OR public.rls_can_access_brand(brand_id))
    WITH CHECK (public.rls_is_workspace_member(workspace_id) OR public.rls_can_access_brand(brand_id));
CREATE POLICY rls_assets_member ON public.assets FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id) OR public.rls_can_access_brand(brand_id) OR uploader_id = auth.uid())
    WITH CHECK (public.rls_is_workspace_member(workspace_id) OR public.rls_can_access_brand(brand_id) OR uploader_id = auth.uid());

-- Brand data (BrandOps, settings, saved components)
CREATE POLICY rls_brand_decisions_member ON public.brand_decisions FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id)) WITH CHECK (public.rls_can_access_brand(brand_id));
CREATE POLICY rls_brand_flows_member ON public.brand_flows FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id)) WITH CHECK (public.rls_can_access_brand(brand_id));
CREATE POLICY rls_brand_objects_member ON public.brand_objects FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id)) WITH CHECK (public.rls_can_access_brand(brand_id));
CREATE POLICY rls_brand_settings_member ON public.brand_settings FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id)) WITH CHECK (public.rls_can_access_brand(brand_id));
CREATE POLICY rls_brand_spaces_member ON public.brand_spaces FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id)) WITH CHECK (public.rls_can_access_brand(brand_id));
CREATE POLICY rls_brand_nodes_member ON public.brand_nodes FOR ALL TO authenticated
    USING (public.rls_can_access_space(space_id)) WITH CHECK (public.rls_can_access_space(space_id));
CREATE POLICY rls_brand_relationships_member ON public.brand_relationships FOR ALL TO authenticated
    USING (public.rls_can_access_space(space_id)) WITH CHECK (public.rls_can_access_space(space_id));
CREATE POLICY rls_saved_components_read ON public.saved_components FOR SELECT TO authenticated
    USING (is_public = true OR public.rls_can_access_brand(brand_id));
CREATE POLICY rls_saved_components_write ON public.saved_components FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id)) WITH CHECK (public.rls_can_access_brand(brand_id));

-- Brandbooks: published ones are readable by any signed-in user, edits are for brand members
CREATE POLICY rls_brandbooks_read ON public.brandbooks FOR SELECT TO authenticated
    USING (is_public = true OR visibility = 'public' OR public.rls_can_access_brand(brand_id));
CREATE POLICY rls_brandbooks_write ON public.brandbooks FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id)) WITH CHECK (public.rls_can_access_brand(brand_id));
CREATE POLICY rls_brandbook_modules_read ON public.brandbook_modules FOR SELECT TO authenticated
    USING (public.rls_can_view_brandbook(brandbook_id));
CREATE POLICY rls_brandbook_modules_write ON public.brandbook_modules FOR ALL TO authenticated
    USING (public.rls_can_access_brandbook(brandbook_id)) WITH CHECK (public.rls_can_access_brandbook(brandbook_id));

-- Proposals
CREATE POLICY rls_proposals_member ON public.proposals FOR ALL TO authenticated
    USING (public.rls_can_access_brand(brand_id) OR public.rls_can_access_project(project_id))
    WITH CHECK (public.rls_can_access_brand(brand_id) OR public.rls_can_access_project(project_id));
CREATE POLICY rls_proposal_modules_member ON public.proposal_modules FOR ALL TO authenticated
    USING (public.rls_can_access_proposal(proposal_id)) WITH CHECK (public.rls_can_access_proposal(proposal_id));
CREATE POLICY rls_proposal_items_member ON public.proposal_items FOR ALL TO authenticated
    USING (public.rls_can_access_proposal(proposal_id)) WITH CHECK (public.rls_can_access_proposal(proposal_id));
CREATE POLICY rls_proposal_templates_read ON public.proposal_templates FOR SELECT TO authenticated USING (true);

-- Project-scoped data
CREATE POLICY rls_awards_read ON public.awards FOR SELECT TO authenticated USING (public.rls_can_view_project(project_id));
CREATE POLICY rls_awards_write ON public.awards FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_project_credits_read ON public.project_credits FOR SELECT TO authenticated USING (public.rls_can_view_project(project_id));
CREATE POLICY rls_project_credits_write ON public.project_credits FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_project_media_read ON public.project_media FOR SELECT TO authenticated USING (public.rls_can_view_project(project_id));
CREATE POLICY rls_project_media_write ON public.project_media FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_project_notes_member ON public.project_notes FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_invoices_member ON public.invoices FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_invoice_items_member ON public.invoice_items FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id))
    WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id));
CREATE POLICY rls_receipts_member ON public.receipts FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_project_comments_read ON public.project_comments FOR SELECT TO authenticated
    USING (public.rls_can_view_project(project_id));
CREATE POLICY rls_project_comments_insert ON public.project_comments FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND public.rls_can_view_project(project_id));
CREATE POLICY rls_project_comments_own ON public.project_comments FOR UPDATE TO authenticated
    USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY rls_project_comments_delete ON public.project_comments FOR DELETE TO authenticated
    USING (author_id = auth.uid());
CREATE POLICY rls_project_comment_likes_read ON public.project_comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_project_comment_likes_own ON public.project_comment_likes FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Workspace-scoped data
CREATE POLICY rls_sprints_member ON public.sprints FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id) OR public.rls_can_access_project(project_id))
    WITH CHECK (public.rls_is_workspace_member(workspace_id) OR public.rls_can_access_project(project_id));
CREATE POLICY rls_integrations_member ON public.integrations FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id)) WITH CHECK (public.rls_is_workspace_member(workspace_id));
CREATE POLICY rls_conversations_member ON public.conversations FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id)) WITH CHECK (public.rls_is_workspace_member(workspace_id));
CREATE POLICY rls_messages_read ON public.messages FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id));
CREATE POLICY rls_messages_insert ON public.messages FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id));
CREATE POLICY rls_messages_own ON public.messages FOR UPDATE TO authenticated
    USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY rls_messages_delete ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Personal data
CREATE POLICY rls_task_lists_own ON public.task_lists FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY rls_notifications_own ON public.notifications FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY rls_pomodoro_sessions_own ON public.pomodoro_sessions FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY rls_time_entries_own ON public.time_entries FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY rls_task_comments_read ON public.task_comments FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id));
CREATE POLICY rls_task_comments_insert ON public.task_comments FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id));
CREATE POLICY rls_task_comments_own ON public.task_comments FOR UPDATE TO authenticated
    USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY rls_task_comments_delete ON public.task_comments FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY rls_standup_updates_read ON public.standup_updates FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.standups s WHERE s.id = standup_id AND public.rls_can_access_standup_team(s.team_id)));
CREATE POLICY rls_standup_updates_own ON public.standup_updates FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY rls_document_templates_read ON public.document_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_document_templates_insert ON public.document_templates FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());
CREATE POLICY rls_document_templates_own ON public.document_templates FOR UPDATE TO authenticated
    USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY rls_document_templates_delete ON public.document_templates FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- Community / marketplace: public to signed-in users, writes by the author
CREATE POLICY rls_community_posts_read ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_community_posts_own ON public.community_posts FOR ALL TO authenticated
    USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY rls_community_comments_read ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_community_comments_own ON public.community_comments FOR ALL TO authenticated
    USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY rls_community_likes_read ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_community_likes_own ON public.community_likes FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY rls_follows_read ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_follows_own ON public.follows FOR ALL TO authenticated
    USING (follower_id = auth.uid()) WITH CHECK (follower_id = auth.uid());
CREATE POLICY rls_social_links_read ON public.social_links FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_social_links_own ON public.social_links FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid()));
CREATE POLICY rls_jobs_read ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY rls_jobs_own ON public.jobs FOR ALL TO authenticated
    USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY rls_job_proposals_read ON public.job_proposals FOR SELECT TO authenticated
    USING (designer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.created_by = auth.uid()));
CREATE POLICY rls_job_proposals_insert ON public.job_proposals FOR INSERT TO authenticated
    WITH CHECK (designer_id = auth.uid());
CREATE POLICY rls_job_proposals_update ON public.job_proposals FOR UPDATE TO authenticated
    USING (designer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.created_by = auth.uid()));
CREATE POLICY rls_job_proposals_delete ON public.job_proposals FOR DELETE TO authenticated
    USING (designer_id = auth.uid());

-- ---------------------------------------------------------------------------------------------
-- Tables that already had RLS but with policies open to everyone (or to any signed-in user)
-- ---------------------------------------------------------------------------------------------

-- project_meetings had USING (true) for role public (readable and writable with the anon key); the
-- others allowed any signed-in user to read every workspace's CRM, billing, contract and standup data
DO $$ DECLARE r record; BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN (
        'project_meetings', 'project_billings', 'project_contracts',
        'crm_companies', 'crm_contacts', 'crm_deals', 'crm_pipelines', 'crm_deal_stages',
        'standups', 'standup_teams', 'standup_team_members'
    ) LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

CREATE POLICY rls_project_meetings_member ON public.project_meetings FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_project_billings_member ON public.project_billings FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_project_contracts_member ON public.project_contracts FOR ALL TO authenticated
    USING (public.rls_can_access_project(project_id)) WITH CHECK (public.rls_can_access_project(project_id));
CREATE POLICY rls_crm_companies_member ON public.crm_companies FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id)) WITH CHECK (public.rls_is_workspace_member(workspace_id));
CREATE POLICY rls_crm_contacts_member ON public.crm_contacts FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id)) WITH CHECK (public.rls_is_workspace_member(workspace_id));
CREATE POLICY rls_crm_deals_member ON public.crm_deals FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id)) WITH CHECK (public.rls_is_workspace_member(workspace_id));
CREATE POLICY rls_crm_pipelines_member ON public.crm_pipelines FOR ALL TO authenticated
    USING (public.rls_is_workspace_member(workspace_id)) WITH CHECK (public.rls_is_workspace_member(workspace_id));
CREATE POLICY rls_crm_deal_stages_member ON public.crm_deal_stages FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = pipeline_id AND public.rls_is_workspace_member(p.workspace_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = pipeline_id AND public.rls_is_workspace_member(p.workspace_id)));
CREATE POLICY rls_standup_teams_member ON public.standup_teams FOR ALL TO authenticated
    USING (public.rls_can_access_standup_team(id))
    WITH CHECK (public.rls_is_workspace_member(workspace_id) OR leader_id = auth.uid());
CREATE POLICY rls_standup_team_members_member ON public.standup_team_members FOR ALL TO authenticated
    USING (public.rls_can_access_standup_team(team_id)) WITH CHECK (public.rls_can_access_standup_team(team_id));
CREATE POLICY rls_standups_member ON public.standups FOR ALL TO authenticated
    USING (created_by = auth.uid() OR public.rls_can_access_standup_team(team_id))
    WITH CHECK (created_by = auth.uid() OR public.rls_can_access_standup_team(team_id));

-- ---------------------------------------------------------------------------------------------
-- Storage: any signed-in user could overwrite or delete any file in the `assets` and
-- `project-media` buckets (other brands' logos, brandbook media, payment proofs). Updates and
-- deletes through the user's session are now limited to files that user uploaded; server code
-- uploads with the service role after its own access checks.
-- ---------------------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Manage project-media" ON storage.objects;

CREATE POLICY rls_storage_owner_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id IN ('assets', 'project-media') AND owner_id = auth.uid()::text)
    WITH CHECK (bucket_id IN ('assets', 'project-media') AND owner_id = auth.uid()::text);
CREATE POLICY rls_storage_owner_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id IN ('assets', 'project-media') AND owner_id = auth.uid()::text);
