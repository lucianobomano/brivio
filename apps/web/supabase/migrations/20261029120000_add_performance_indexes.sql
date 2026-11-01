-- Performance: index the foreign keys used in the app's hot query paths.
-- Postgres does not index foreign keys automatically. Current tables are small,
-- so the gain today is modest; these keep page loads fast as data grows.
-- Safe to re-run (IF NOT EXISTS). Rollback: DROP INDEX IF EXISTS <name>;

-- Auth / workspace resolution (every authenticated page)
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON public.workspaces(created_by);

-- Projects pipeline / roadmap / focus
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_brand_id ON public.projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_workspace_position ON public.project_stages(workspace_id, position);
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON public.project_notes(project_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON public.tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);

-- Sprints
CREATE INDEX IF NOT EXISTS idx_sprints_workspace_id ON public.sprints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON public.sprints(project_id);

-- Brandbooks (editor + share pages)
CREATE INDEX IF NOT EXISTS idx_brandbooks_brand_id_created_at ON public.brandbooks(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brandbook_modules_brandbook_order ON public.brandbook_modules(brandbook_id, "order");

-- Assets
CREATE INDEX IF NOT EXISTS idx_assets_workspace_id ON public.assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_brand_id ON public.assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_assets_folder_id ON public.assets(folder_id);

-- BrandOps canvas
CREATE INDEX IF NOT EXISTS idx_brand_objects_space_id ON public.brand_objects(space_id);
CREATE INDEX IF NOT EXISTS idx_brand_nodes_space_id ON public.brand_nodes(space_id);
CREATE INDEX IF NOT EXISTS idx_brand_relationships_space_id ON public.brand_relationships(space_id);

-- Proposals / standups
CREATE INDEX IF NOT EXISTS idx_proposal_modules_proposal_id ON public.proposal_modules(proposal_id);
CREATE INDEX IF NOT EXISTS idx_standup_updates_standup_id ON public.standup_updates(standup_id);

-- Remaining foreign keys without an index (generated from pg_constraint)
CREATE INDEX IF NOT EXISTS idx_asset_folders_brand_id ON public.asset_folders(brand_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_parent_id ON public.asset_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_workspace_id ON public.asset_folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_uploader_id ON public.assets(uploader_id);
CREATE INDEX IF NOT EXISTS idx_awards_project_id ON public.awards(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_decisions_brand_id ON public.brand_decisions(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_decisions_space_id ON public.brand_decisions(space_id);
CREATE INDEX IF NOT EXISTS idx_brand_flows_brand_id ON public.brand_flows(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_nodes_object_id ON public.brand_nodes(object_id);
CREATE INDEX IF NOT EXISTS idx_brand_objects_brand_id ON public.brand_objects(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_spaces_brand_id ON public.brand_spaces(brand_id);
CREATE INDEX IF NOT EXISTS idx_brandbook_templates_brand_id ON public.brandbook_templates(brand_id);
CREATE INDEX IF NOT EXISTS idx_brandbook_templates_created_by ON public.brandbook_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_community_comments_author_id ON public.community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON public.community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_brand_id ON public.community_posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON public.conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_workspace_id ON public.crm_companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON public.crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace_id ON public.crm_contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_stages_pipeline_id ON public.crm_deal_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company_id ON public.crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON public.crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage_id ON public.crm_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_workspace_id ON public.crm_deals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_workspace_id ON public.crm_pipelines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace_id ON public.integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_job_proposals_designer_id ON public.job_proposals(designer_id);
CREATE INDEX IF NOT EXISTS idx_job_proposals_job_id ON public.job_proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_brand_id ON public.jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON public.pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_billings_project_id ON public.project_billings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_billings_proposal_id ON public.project_billings(proposal_id);
CREATE INDEX IF NOT EXISTS idx_project_comment_likes_user_id ON public.project_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_author_id ON public.project_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent_id ON public.project_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contracts_project_id ON public.project_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_credits_project_id ON public.project_credits(project_id);
CREATE INDEX IF NOT EXISTS idx_project_credits_user_id ON public.project_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON public.project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON public.project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_dependency_id ON public.projects(dependency_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage_id ON public.projects(stage_id);
CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal_id ON public.proposal_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_brand_id ON public.proposals(brand_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_template_id ON public.proposals(template_id);
CREATE INDEX IF NOT EXISTS idx_receipts_billing_id ON public.receipts(billing_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON public.receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON public.receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_saved_components_brand_id ON public.saved_components(brand_id);
CREATE INDEX IF NOT EXISTS idx_social_links_creator_id ON public.social_links(creator_id);
CREATE INDEX IF NOT EXISTS idx_standup_team_members_user_id ON public.standup_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_standup_teams_leader_id ON public.standup_teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_standup_updates_user_id ON public.standup_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_standups_created_by ON public.standups(created_by);
CREATE INDEX IF NOT EXISTS idx_standups_team_id ON public.standups(team_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON public.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_user_id ON public.task_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
