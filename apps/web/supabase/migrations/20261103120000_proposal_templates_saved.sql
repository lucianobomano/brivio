-- Proposal templates saved from a proposal: all its pages and its theme, shared with the workspace's team.
-- The built-in templates (workspace_id NULL, no content_json) keep working as before.

ALTER TABLE public.proposal_templates
    ADD COLUMN IF NOT EXISTS content_json jsonb,
    ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS page_count integer,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS proposal_templates_workspace_idx ON public.proposal_templates (workspace_id);

-- Read: the built-in templates for everyone signed in, a workspace's own templates for its members only
DROP POLICY IF EXISTS rls_proposal_templates_read ON public.proposal_templates;
CREATE POLICY rls_proposal_templates_read ON public.proposal_templates FOR SELECT TO authenticated
    USING (workspace_id IS NULL OR public.rls_is_workspace_member(workspace_id) OR public.rls_is_superadmin());

-- Writes go through the server (admin client, after the access checks); no write policy for clients
