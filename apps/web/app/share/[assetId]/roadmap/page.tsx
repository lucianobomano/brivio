import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getRoadmapStats } from "@/app/actions/roadmap"
import { ClientRoadmapView } from "./ClientRoadmapView"

export default async function ClientRoadmapPage({ params }: { params: Promise<{ assetId: string }> }) {
    const { assetId } = await params
    const supabase = await createClient()

    // Fetch project details
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('*, brands(*)')
        .eq('id', assetId)
        .single()

    if (pError || !project) {
        return notFound()
    }

    const roadmapStats = await getRoadmapStats(assetId)

    // If no roadmap data, show empty state instead of 404
    const emptyRoadmap = {
        phases: [],
        globalProgress: 0,
        currentPhaseName: 'Pendente',
        totalTasks: 0,
        completedTasks: 0
    }

    const stats = roadmapStats || emptyRoadmap

    return (
        <ClientRoadmapView
            project={project}
            roadmap={stats.phases}
            globalProgress={stats.globalProgress}
            currentPhaseName={stats.currentPhaseName}
        />
    )
}
