import { StandupHeader } from "@/components/standups/StandupHeader"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RoadmapClient } from "./RoadmapClient"
import { getProjectRoadmap, RoadmapStage } from "@/app/actions/roadmap"
import { getProjectPipeline_v2 } from "@/app/actions/projects"
import { getProjectNotes } from "@/app/actions/notes"

interface ProjectBase {
    id: string
    name: string
    workspace_id?: string
}

export default async function RoadmapPage({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all user projects for the selector
    const projects = await getProjectPipeline_v2() as ProjectBase[]

    // Select the first project if none specified
    const selectedProjectId = params.projectId || (projects.length > 0 ? projects[0].id : null)

    let roadmapData: RoadmapStage[] = []
    let selectedProject: ProjectBase | null = null
    let initialNotes: any[] = []

    if (selectedProjectId) {
        roadmapData = await getProjectRoadmap(selectedProjectId)
        selectedProject = projects.find(p => p.id === selectedProjectId) || null
        const notesRes = await getProjectNotes(selectedProjectId)
        initialNotes = notesRes.notes || []
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-0">
            <StandupHeader />
            <div className="flex-1">
                <RoadmapClient
                    initialProjects={projects}
                    initialRoadmap={roadmapData}
                    selectedProjectId={selectedProjectId}
                    selectedProject={selectedProject}
                    initialNotes={initialNotes}
                />
            </div>
        </div>
    )
}
