import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getRoadmapStats } from "@/app/actions/roadmap"
import { getProjectNotes } from "@/app/actions/notes"
import { ClientRoadmapView } from "./ClientRoadmapView"

export default async function ClientRoadmapPage({ 
    params,
    searchParams
}: { 
    params: Promise<{ assetId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { assetId } = await params
    const resolvedSearchParams = await searchParams
    const initialLayout = typeof resolvedSearchParams.layout === 'string' ? resolvedSearchParams.layout : 'default'
    const initialBg = typeof resolvedSearchParams.bg === 'string' ? resolvedSearchParams.bg : 'default'
    
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
    const { notes } = await getProjectNotes(assetId)

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
            initialLayout={initialLayout as any}
            initialBg={initialBg}
            initialNotes={notes || []}
        />
    )
}
