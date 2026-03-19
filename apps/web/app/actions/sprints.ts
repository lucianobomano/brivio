"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type SprintStatus = 'planned' | 'active' | 'completed'

export interface Sprint {
    id: string
    workspace_id: string | null
    project_id: string | null
    name: string
    goal: string | null
    status: SprintStatus
    start_date: string | null
    end_date: string | null
    created_at: string
    updated_at: string
}

export async function getSprint(sprintId: string) {
    const supabase = await createClient()

    const { data: sprint, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .single()

    if (error) {
        console.error("[getSprint] Error:", error)
        return null
    }

    return sprint as Sprint
}

export async function createSprint(data: {
    name: string
    goal?: string
    projectId?: string
    workspaceId?: string
    startDate?: string
    endDate?: string
    status?: SprintStatus
}) {
    const supabase = await createClient()

    const { data: sprint, error } = await supabase
        .from('sprints')
        .insert({
            name: data.name,
            goal: data.goal,
            project_id: data.projectId,
            workspace_id: data.workspaceId,
            start_date: data.startDate,
            end_date: data.endDate,
            status: data.status || 'planned',
        })
        .select()
        .single()

    if (error) {
        console.error("[createSprint] Error:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/sprints')
    if (data.projectId) revalidatePath(`/projects/${data.projectId}`)
    return { success: true, sprint }
}

export async function getSprints(filters: { projectId?: string; workspaceId?: string }) {
    const supabase = await createClient()

    let query = supabase.from('sprints').select('*')

    if (filters.projectId) {
        query = query.eq('project_id', filters.projectId)
    }
    if (filters.workspaceId) {
        query = query.eq('workspace_id', filters.workspaceId)
    }

    const { data: sprints, error } = await query.order('start_date', { ascending: true })

    if (error) {
        console.error("[getSprints] Error:", error)
        return []
    }

    return sprints as Sprint[]
}

export async function updateSprint(sprintId: string, data: Partial<Sprint>) {
    const supabase = await createClient()

    const { data: sprint, error } = await supabase
        .from('sprints')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', sprintId)
        .select()
        .single()

    if (error) {
        console.error("[updateSprint] Error:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/sprints')
    if (sprint.project_id) revalidatePath(`/projects/${sprint.project_id}`)
    return { success: true, sprint }
}

export async function deleteSprint(sprintId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId)

    if (error) {
        console.error("[deleteSprint] Error:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/sprints')
    return { success: true }
}

export async function assignTaskToSprint(taskId: string, sprintId: string | null) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tasks')
        .update({ sprint_id: sprintId, updated_at: new Date().toISOString() })
        .eq('id', taskId)

    if (error) {
        console.error("[assignTaskToSprint] Error:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/tasks')
    revalidatePath('/sprints')
    return { success: true }
}

export async function getSprintTasks(sprintId: string) {
    const supabase = await createClient()

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            *,
            assignee:users!tasks_assignee_id_fkey(id, name, avatar_url),
            subtasks(*)
        `)
        .eq('sprint_id', sprintId)
        .order('position', { ascending: true })

    if (error) {
        console.error("[getSprintTasks] Error:", error)
        return []
    }

    // Ensure subtasks are typed correctly and sorted if necessary
    const typedTasks = tasks.map((t: any) => ({
        ...t,
        subtasks: t.subtasks?.sort((a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []
    }))

    return typedTasks
}
