import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProjectsClient, type Project } from "@/components/projects/ProjectsClient"
import { getProjectPipeline_v2 } from "@/app/actions/projects"
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider"
import { getDefaultWorkspace } from "@/lib/workspace"

export default async function ProjectsPage(props: {
    searchParams: Promise<{ workspaceId?: string }>
}) {
    const { workspaceId } = await props.searchParams
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // Check if we have a workspaceId in the URL, otherwise get the first one
    const resolveWorkspace = async () => {
        // PERFORMANCE: the default workspace (first membership, else owned) is the same
        // memoized lookup the (app) layout already ran for this request
        const defaultWorkspace = workspaceId ? null : await getDefaultWorkspace()
        const targetWorkspaceId: string | undefined = workspaceId || defaultWorkspace?.id

        let initialStages = []
        let initialWorkspace = null
        if (targetWorkspaceId) {
            const [{ data: stages }, { data: ws }] = await Promise.all([
                supabase
                    .from('project_stages')
                    .select('*')
                    .eq('workspace_id', targetWorkspaceId)
                    .order('position', { ascending: true }),
                defaultWorkspace
                    ? Promise.resolve({ data: defaultWorkspace })
                    : supabase
                        .from('workspaces')
                        .select('*')
                        .eq('id', targetWorkspaceId)
                        .single()
            ])
            initialStages = stages || []
            initialWorkspace = ws
        }

        return { targetWorkspaceId, initialStages, initialWorkspace }
    }

    // PERFORMANCE: these queries are independent, so they run in parallel instead of one after another
    const [
        projects,
        { targetWorkspaceId, initialStages, initialWorkspace },
        { data: profile },
        { data: creatorProfile },
    ] = await Promise.all([
        getProjectPipeline_v2() as Promise<Project[]>,
        resolveWorkspace(),
        // Fetch user profile and creator profile for UnifiedHeader
        supabase
            .from('users')
            .select('name, avatar_url, cover_url, profile_type')
            .eq('id', user.id)
            .single(),
        supabase
            .from('creator_profiles')
            .select('category')
            .eq('user_id', user.id)
            .single(),
    ])

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

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
        <WorkspaceProvider initialWorkspaceId={targetWorkspaceId} initialWorkspace={initialWorkspace}>
            <ProjectsClient
                initialProjects={projects}
                initialStages={initialStages}
                workspaceId={targetWorkspaceId}
                initialWorkspace={initialWorkspace}
                user={appUser}
            />
        </WorkspaceProvider>
    )
}
