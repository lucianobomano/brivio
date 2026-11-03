import { getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RoadmapClient } from "./RoadmapClient"
import { getProjectRoadmap, getRoadmapsSummary, RoadmapStage } from "@/app/actions/roadmap"
import { getProjectOptions } from "@/app/actions/projects"
import { getProjectNotes } from "@/app/actions/notes"
import { getProjectMeetings } from "@/app/actions/meetings"

interface ProjectBase {
    id: string
    name: string
    workspace_id?: string | null
}

export default async function RoadmapPage({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string }>
}) {
    const params = await searchParams
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // PERFORMANCE: per-project data is independent, so it is fetched in parallel.
    // When projectId is in the URL it can also start alongside the project list.
    const fetchProjectData = (projectId: string) => Promise.all([
        getProjectRoadmap(projectId),
        getProjectNotes(projectId),
        getProjectMeetings(projectId),
    ])

    const [projects, earlyProjectData] = await Promise.all([
        getProjectOptions(),
        params.projectId ? fetchProjectData(params.projectId) : Promise.resolve(null),
    ])

    // Summary of every roadmap for the table (the detail opens in a full-screen modal)
    const summariesPromise = getRoadmapsSummary(projects.map(p => p.id))

    // Select the first project if none specified
    const selectedProjectId = params.projectId || (projects.length > 0 ? projects[0].id : null)

    let roadmapData: RoadmapStage[] = []
    let selectedProject: ProjectBase | null = null
    let initialNotes: any[] = []
    let initialMeetings: any[] = []

    if (selectedProjectId) {
        const [roadmap, notesRes, meetings] = earlyProjectData ?? await fetchProjectData(selectedProjectId)
        roadmapData = roadmap
        selectedProject = projects.find(p => p.id === selectedProjectId) || null
        initialNotes = notesRes.notes || []
        initialMeetings = meetings
    }

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    // The page draws its own shell (side menu + breadcrumb bar), like Projects
    return (
        <RoadmapClient
            initialProjects={projects}
            initialRoadmap={roadmapData}
            selectedProjectId={selectedProjectId}
            selectedProject={selectedProject}
            initialNotes={initialNotes}
            initialMeetings={initialMeetings}
            summaries={await summariesPromise}
            openOnLoad={!!params.projectId}
        />
    )
}
