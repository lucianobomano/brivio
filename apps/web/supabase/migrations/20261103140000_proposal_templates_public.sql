-- Saved proposal templates can be shared with every user of the platform (public), not only the team.

ALTER TABLE public.proposal_templates
    ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS proposal_templates_public_idx ON public.proposal_templates (is_public) WHERE is_public;

-- Read: built-in templates and public ones for everyone signed in, a team's private templates for its members
DROP POLICY IF EXISTS rls_proposal_templates_read ON public.proposal_templates;
CREATE POLICY rls_proposal_templates_read ON public.proposal_templates FOR SELECT TO authenticated
    USING (workspace_id IS NULL OR is_public OR public.rls_is_workspace_member(workspace_id) OR public.rls_is_superadmin());
