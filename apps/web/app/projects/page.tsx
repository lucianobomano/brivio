import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProjectsClient, type Project } from "@/components/projects/ProjectsClient"
import { getProjectPipeline_v2 } from "@/app/actions/projects"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export default async function ProjectsPage(props: {
    searchParams: Promise<{ workspaceId?: string }>
}) {
    const { workspaceId } = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const projects = await getProjectPipeline_v2() as Project[]

    // Check if we have a workspaceId in the URL, otherwise get the first one
    let targetWorkspaceId = workspaceId

    if (!targetWorkspaceId) {
        const { data: members } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .limit(1)
        targetWorkspaceId = members?.[0]?.workspace_id
    }

    if (!targetWorkspaceId) {
        const { data: ownedWs } = await supabase
            .from('workspaces')
            .select('id')
            .eq('created_by', user.id)
            .limit(1)
            .single()
        targetWorkspaceId = ownedWs?.id
    }

    let initialStages = []
    let initialWorkspace = null
    if (targetWorkspaceId) {
        const [{ data: stages }, { data: ws }] = await Promise.all([
            supabase
                .from('project_stages')
                .select('*')
                .eq('workspace_id', targetWorkspaceId)
                .order('position', { ascending: true }),
            supabase
                .from('workspaces')
                .select('*')
                .eq('id', targetWorkspaceId)
                .single()
        ])
        initialStages = stages || []
        initialWorkspace = ws
    }

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    // Fetch user profile and creator profile for UnifiedHeader
    const { data: profile } = await supabase
        .from('users')
        .select('name, avatar_url, cover_url, profile_type')
        .eq('id', user.id)
        .single()

    const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('category')
        .eq('user_id', user.id)
        .single()

    const appUser = {
        id: user.id,
        email: user.email || "",
        profile: profile ? {
            name: profile.name,
            avatar_url: profile.avatar_url,
            cover_url: profile.cover_url,
            profile_type: profile.profile_type
        } : undefined,
        creatorProfile: creatorProfile ? {
            category: creatorProfile.category
        } : undefined
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false} workspaceId={targetWorkspaceId} initialWorkspace={initialWorkspace}>
            <ProjectsClient
                initialProjects={projects}
                initialStages={initialStages}
                workspaceId={targetWorkspaceId}
                initialWorkspace={initialWorkspace}
                user={appUser}
            />
        </AuthLayoutInner>
    )
}
