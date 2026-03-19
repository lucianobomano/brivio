import { Navbar } from "@/components/layout/Navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FocusClient } from "./FocusClient"
import { getProjectRoadmap } from "@/app/actions/roadmap"
import { getProjectPipeline_v2 } from "@/app/actions/projects"
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider"

interface PageProps {
    searchParams: { projectId?: string }
}

export default async function FocusPage({ searchParams: searchParamsPromise }: PageProps) {
    const searchParams = await searchParamsPromise
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all user projects
    const rawProjects = await getProjectPipeline_v2()
    const projects = rawProjects as any[]

    // Fetch tasks for these projects to show in gallery
    const projectIds = projects.map(p => p.id)
    let enrichedProjects = [...projects]

    if (projectIds.length > 0) {
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('*')
            .in('project_id', projectIds)
            .order('created_at', { ascending: true })

        enrichedProjects = projects.map(p => ({
            ...p,
            tasks: allTasks?.filter(t => t.project_id === p.id) || []
        }))
    }

    // Do NOT auto-select if none specified, to show gallery
    const selectedProjectId = searchParams.projectId

    let roadmapData: any[] = []
    let selectedProject: any = null

    if (selectedProjectId) {
        roadmapData = await getProjectRoadmap(selectedProjectId)
        const found = enrichedProjects.find(p => p.id === selectedProjectId)
        selectedProject = found || null
    }

    // Determine workspaceId to ensure WorkspaceProvider works
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)

    const targetWorkspaceId = members?.[0]?.workspace_id

    return (
        <WorkspaceProvider initialWorkspaceId={targetWorkspaceId}>
            <div className="flex flex-col min-h-screen bg-bg-0">
                {!selectedProjectId && <Navbar />}
                <div className="flex-1">
                    <FocusClient
                        projects={enrichedProjects}
                        initialRoadmap={roadmapData}
                        selectedProject={selectedProject}
                    />
                </div>
            </div>
        </WorkspaceProvider>
    )
}
