import { createAdminClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { unstable_cache } from "next/cache"
import { SHARE_ROADMAP_TAG } from "@/lib/share-cache"
import { projectStages } from "@/lib/roadmap-stages"
import { loadProjectMeetings, loadProjectNotes } from "@/lib/project-data"
import { ClientRoadmapView } from "./ClientRoadmapView"

/**
 * Public roadmap data fetcher using admin client (bypasses RLS).
 * This is needed because the share page is public and viewers are not authenticated.
 */
async function getPublicRoadmapStats(projectId: string) {
    const supabase = await createAdminClient()

    // 3. Get Tasks for this project (only depends on projectId, so it starts right away)
    const tasksPromise = supabase
        .from('tasks')
        .select('id, title, status, stage_id, completed, cover_url, description, estimated_time, start_date, due_date, elapsed_time, sprint_id, priority')
        .eq('project_id', projectId)

    // 1. Get Project to find workspace_id
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (pError || !project?.workspace_id) {
        return null
    }

    // 2. Get Stages for that workspace
    const { data: stages, error: sError } = await supabase
        .from('project_stages')
        .select('id, name, color, position, start_date, due_date')
        .eq('workspace_id', project.workspace_id)
        .order('position', { ascending: true })

    if (sError || !stages) {
        return null
    }

    const { data: tasks } = await tasksPromise

    // 4. The project's phases (with tasks, plus the rest of their template) and their tasks
    const roadmap = projectStages(stages, tasks || [])
        .map(stage => {
            const stageTasks = (tasks || [])
                .filter(t => t.stage_id === stage.id)
                .map(t => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    completed: t.completed || t.status === 'done',
                    cover_url: t.cover_url,
                    description: t.description,
                    estimated_time: t.estimated_time,
                    elapsed_time: t.elapsed_time || 0,
                    start_date: t.start_date,
                    due_date: t.due_date,
                    sprint_id: t.sprint_id,
                    stage_id: t.stage_id,
                    priority: t.priority,
                }))

            const completedCount = stageTasks.filter(t => t.completed).length
            const totalCount = stageTasks.length
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

            return {
                id: stage.id,
                name: stage.name,
                color: stage.color,
                position: stage.position,
                start_date: stage.start_date || null,
                due_date: stage.due_date || null,
                tasks: stageTasks,
                progress
            }
        })

    if (roadmap.length === 0) {
        return null
    }

    const totalTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.length, 0)
    const completedTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.filter(t => t.completed).length, 0)
    const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const currentPhase = roadmap.find(stage => stage.progress < 100) || (completedTasks === totalTasks ? { name: 'Concluído' } : roadmap[roadmap.length - 1])
    const currentPhaseName = currentPhase?.name || 'Início'

    return {
        phases: roadmap,
        globalProgress,
        currentPhaseName,
        totalTasks,
        completedTasks
    }
}

/**
 * PERFORMANCE: public viewers share one cached copy per project instead of hitting the
 * database on every visit. Mutations call invalidateShareRoadmap() (tag), and the 60s
 * revalidate bounds staleness for any write path that doesn't.
 */
const getShareRoadmapData = unstable_cache(
    async (assetId: string) => {
        // Use admin client to bypass RLS — this is a public page
        const supabase = await createAdminClient()

        // Everything here is keyed by assetId, so it loads in parallel.
        // Notes/meetings are only rendered after the project is confirmed to exist.
        const [{ data: project, error: pError }, roadmapStats, { notes }, meetings, { data: invoices }] = await Promise.all([
            // Fetch project details
            supabase
                .from('projects')
                .select('*, brands(*)')
                .eq('id', assetId)
                .single(),
            getPublicRoadmapStats(assetId),
            loadProjectNotes(assetId),
            loadProjectMeetings(assetId),
            // The client's real name: projects have no client field, invoices do
            supabase
                .from('invoices')
                .select('client_name')
                .eq('project_id', assetId)
                .not('client_name', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1),
        ])

        const brand = project ? (Array.isArray(project.brands) ? project.brands[0] : project.brands) : null
        const clientName: string | null = (brand?.name as string | undefined)?.trim() || (invoices?.[0]?.client_name as string | undefined)?.trim() || null

        return { project: pError ? null : project, roadmapStats, notes, meetings, clientName }
    },
    ['share-roadmap-data'],
    { tags: [SHARE_ROADMAP_TAG], revalidate: 60 }
)

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
    
    const { project, roadmapStats, notes, meetings, clientName } = await getShareRoadmapData(assetId)

    if (!project) {
        return notFound()
    }

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
            clientName={clientName}
            roadmap={stats.phases}
            globalProgress={stats.globalProgress}
            currentPhaseName={stats.currentPhaseName}
            initialLayout={initialLayout as any}
            initialBg={initialBg}
            initialNotes={notes || []}
            initialMeetings={meetings || []}
        />
    )
}
