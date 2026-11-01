import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FocusClient } from "./FocusClient"
import { getProjectRoadmap } from "@/app/actions/roadmap"
import { getProjectPipeline_v2 } from "@/app/actions/projects"

interface PageProps {
    searchParams: { projectId?: string }
}

export default async function FocusPage({ searchParams: searchParamsPromise }: PageProps) {
    const searchParams = await searchParamsPromise
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // Do NOT auto-select if none specified, to show gallery
    const selectedProjectId = searchParams.projectId

    // PERFORMANCE: projects and roadmap are independent, so they run in parallel
    // (the workspace for WorkspaceProvider now comes from the shared (app) layout)
    const [rawProjects, roadmapData] = await Promise.all([
        // Fetch all user projects
        getProjectPipeline_v2(),
        selectedProjectId ? getProjectRoadmap(selectedProjectId) : Promise.resolve([] as any[]),
    ])
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

    const selectedProject: any = selectedProjectId
        ? enrichedProjects.find(p => p.id === selectedProjectId) || null
        : null

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <>
            <div className="flex flex-col min-h-screen bg-bg-0">
                <div className="flex-1">
                    <FocusClient
                        projects={enrichedProjects}
                        initialRoadmap={roadmapData}
                        selectedProject={selectedProject}
                    />
                </div>
            </div>
        </>
    )
}
