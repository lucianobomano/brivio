"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ==================== INTERFACES ====================

export interface TaskList {
    id: string
    title: string
    color: string
    icon_url?: string | null
    user_id: string
    created_at: string
    updated_at: string
    archived: boolean
}

export interface Subtask {
    id: string
    title: string
    completed: boolean
}

export interface Task {
    id: string
    list_id: string
    title: string
    status: "backlog" | "this_week" | "today" | "done"
    estimated_time: number // in minutes
    elapsed_time: number // in minutes
    completed: boolean
    subtasks: Subtask[]
    position: number
    created_at: string
    updated_at: string
}

export type TaskStatus = "backlog" | "this_week" | "today" | "done"

// ==================== TASK LIST ACTIONS ====================

export async function createTaskList(data: {
    title: string
    color: string
    userId: string
}) {
    const supabase = await createClient()

    console.log("[createTaskList] Creating list:", data)

    const { data: list, error } = await supabase
        .from('task_lists')
        .insert({
            title: data.title,
            color: data.color,
            user_id: data.userId,
            archived: false,
        })
        .select()
        .single()

    if (error) {
        console.error("[createTaskList] Error creating list:", error)
        return { success: false, error: error.message }
    }

    console.log("[createTaskList] Created list:", list)
    revalidatePath('/tasks')
    return { success: true, list }
}

export interface ProjectCardItem {
    id: string
    name: string
    color: string
    brand?: {
        id: string
        name: string
        logo_url?: string | null
    } | null
    category?: string | null
    tasks: Task[]
    pendingCount: number
    totalEstimatedMinutes: number
    updated_at?: string
    created_at?: string
}

const PROJECT_CARD_PALETTES = [
    "linear-gradient(135deg, #0070F3 0%, #00DFD8 100%)",
    "linear-gradient(135deg, #7928CA 0%, #FF0080 100%)",
    "linear-gradient(135deg, #FF4D4D 0%, #F9CB28 100%)",
    "linear-gradient(135deg, #0575E6 0%, #00F260 100%)",
    "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)",
    "linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)",
    "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
]

function getDeterministicColor(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % PROJECT_CARD_PALETTES.length
    return PROJECT_CARD_PALETTES[index]
}

export async function getUserProjectsWithTasks(userId: string): Promise<ProjectCardItem[]> {
    const supabase = await createClient()

    let workspaceIds: string[] = []
    try {
        const { data: members } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', userId)

        if (members) {
            workspaceIds = members.map(m => m.workspace_id)
        }
    } catch (e) {
        console.error("Error fetching workspace members:", e)
    }

    let query = supabase
        .from('projects')
        .select(`
            id,
            name,
            category,
            workspace_id,
            created_by,
            created_at,
            updated_at,
            brand:brands(id, name, logo_url),
            tasks(
                id,
                title,
                status,
                completed,
                estimated_time,
                elapsed_time,
                position,
                created_at
            )
        `)
        .order('updated_at', { ascending: false })

    if (workspaceIds.length > 0) {
        query = query.or(`created_by.eq.${userId},workspace_id.in.(${workspaceIds.join(',')})`)
    } else {
        query = query.eq('created_by', userId)
    }

    const { data: projects, error } = await query

    if (error) {
        console.error("[getUserProjectsWithTasks] Error:", error.message)
        return []
    }

    return (projects || []).map((p: any) => {
        const color = getDeterministicColor(p.id || p.name)
        const rawTasks = p.tasks || []

        const tasks: Task[] = rawTasks.map((t: any) => {
            let status: TaskStatus = "backlog"
            if (t.status === "done" || t.completed) status = "done"
            else if (t.status === "today") status = "today"
            else if (t.status === "this_week" || t.status === "in_progress") status = "this_week"
            else if (t.status === "backlog" || t.status === "todo") status = "backlog"

            return {
                id: t.id,
                list_id: p.id,
                title: t.title || "Untitled Task",
                status,
                estimated_time: t.estimated_time || 0,
                elapsed_time: t.elapsed_time || 0,
                completed: !!t.completed || status === "done",
                subtasks: [],
                position: t.position || 0,
                created_at: t.created_at || new Date().toISOString(),
                updated_at: t.updated_at || new Date().toISOString(),
            }
        }).sort((a: Task, b: Task) => (a.position || 0) - (b.position || 0))

        const pendingTasks = tasks.filter(t => !t.completed)
        const totalEstimatedMinutes = pendingTasks.reduce((acc, t) => acc + (t.estimated_time || 0), 0)

        return {
            id: p.id,
            name: p.name,
            color,
            brand: p.brand,
            category: p.category,
            tasks,
            pendingCount: pendingTasks.length,
            totalEstimatedMinutes,
            updated_at: p.updated_at,
            created_at: p.created_at,
        }
    })
}

export async function createQuickProject(data: {
    name: string
    userId: string
}) {
    const supabase = await createClient()

    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', data.userId)
        .limit(1)

    const workspaceId = members?.[0]?.workspace_id || null

    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            name: data.name,
            created_by: data.userId,
            workspace_id: workspaceId,
            status: 'planning',
            type: 'project'
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating quick project:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/tasks')
    revalidatePath('/projects')
    return { success: true, project }
}

export interface TaskListWithTasks extends TaskList {
    tasks: Task[]
}

export async function getTaskLists(userId: string) {
    const supabase = await createClient()

    console.log("[getTaskLists] Fetching lists for user:", userId)

    const { data: lists, error } = await supabase
        .from('task_lists')
        .select(`
            *,
            tasks (
                id,
                title,
                status,
                estimated_time,
                completed,
                position
            )
        `)
        .eq('user_id', userId)
        .eq('archived', false)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("[getTaskLists] Error fetching lists:", error)
        return []
    }

    console.log("[getTaskLists] Found lists:", lists?.length || 0)
    return lists as TaskListWithTasks[]
}

export async function getTaskList(listId: string) {
    const supabase = await createClient()

    // 1. Try task_lists
    const { data: list, error } = await supabase
        .from('task_lists')
        .select('*')
        .eq('id', listId)
        .single()

    if (list && !error) {
        return list as TaskList
    }

    // 2. Try projects
    const { data: project, error: projError } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            created_by,
            created_at,
            updated_at,
            brand:brands(id, name, logo_url)
        `)
        .eq('id', listId)
        .single()

    if (project && !projError) {
        const color = getDeterministicColor(project.id || project.name)
        return {
            id: project.id,
            title: project.name,
            color,
            icon_url: (project.brand as any)?.logo_url || null,
            user_id: project.created_by,
            created_at: project.created_at,
            updated_at: project.updated_at,
            archived: false,
        } as TaskList
    }

    return null
}

export async function archiveTaskList(listId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('task_lists')
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq('id', listId)

    if (error) {
        console.error("Error archiving list:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/tasks')
    return { success: true }
}

// ==================== TASK ACTIONS ====================

export async function createTask(data: {
    listId: string
    title: string
    status: TaskStatus
    estimatedTime?: number
}) {
    const supabase = await createClient()

    // Debug: Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log("[createTask] User:", user?.id, "Auth Error:", authError)

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    // 1. Check if listId is a task_list
    const { data: list } = await supabase
        .from('task_lists')
        .select('id, user_id')
        .eq('id', data.listId)
        .single()

    const isTaskList = !!list
    let isProject = false

    if (!isTaskList) {
        // 2. Check if listId is a project
        const { data: project } = await supabase
            .from('projects')
            .select('id, created_by')
            .eq('id', data.listId)
            .single()

        if (project) {
            isProject = true
        }
    }

    if (!isTaskList && !isProject) {
        return { success: false, error: "List or Project not found" }
    }

    // Calculate position: max position + 1000
    const { data: maxPosTask } = await supabase
        .from('tasks')
        .select('position')
        .or(`list_id.eq.${data.listId},project_id.eq.${data.listId}`)
        .eq('status', data.status)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosTask?.position || 0) + 1000

    const insertData: Record<string, unknown> = {
        title: data.title,
        status: data.status,
        estimated_time: data.estimatedTime || 0,
        elapsed_time: 0,
        subtasks: [],
        completed: data.status === "done",
        position: newPosition,
        created_by: user.id
    }

    if (isTaskList) {
        insertData.list_id = data.listId
    } else {
        insertData.project_id = data.listId
    }

    const { data: task, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.error("Error creating task:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${data.listId}`)
    revalidatePath('/tasks')
    return { success: true, task }
}

export async function getTasksByList(listId: string): Promise<Task[]> {
    const supabase = await createClient()

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`list_id.eq.${listId},project_id.eq.${listId}`)
        .order('position', { ascending: true })

    if (error) {
        console.error("Error fetching tasks:", error)
        return []
    }

    // Map tasks to ensure all fields have default values
    return (tasks || []).map(task => {
        let status: TaskStatus = "backlog"
        if (task.status === "done" || task.completed) status = "done"
        else if (task.status === "today") status = "today"
        else if (task.status === "this_week" || task.status === "in_progress") status = "this_week"
        else if (task.status === "backlog" || task.status === "todo") status = "backlog"

        return {
            ...task,
            status,
            list_id: task.list_id || task.project_id || listId,
            elapsed_time: task.elapsed_time ?? 0,
            subtasks: task.subtasks ?? [],
            position: task.position ?? 0,
            estimated_time: task.estimated_time ?? 0,
        }
    }) as Task[]
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, listId: string) {
    const supabase = await createClient()

    const completed = status === "done"

    const { error } = await supabase
        .from('tasks')
        .update({
            status,
            completed,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) {
        console.error("Error updating task status:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    revalidatePath('/tasks')
    return { success: true }
}

export async function updateTaskPosition(
    taskId: string,
    status: TaskStatus,
    position: number,
    listId: string
) {
    const supabase = await createClient()

    const completed = status === "done"

    const { error } = await supabase
        .from('tasks')
        .update({
            status,
            position,
            completed,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) {
        console.error("Error updating task position:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    revalidatePath('/tasks')
    return { success: true }
}

export async function updateTask(taskId: string, data: {
    title?: string
    estimatedTime?: number
}, listId: string) {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.title !== undefined) updateData.title = data.title
    if (data.estimatedTime !== undefined) updateData.estimated_time = data.estimatedTime

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

    if (error) {
        console.error("Error updating task:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    revalidatePath('/tasks')
    return { success: true }
}

export async function deleteTask(taskId: string, listId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) {
        console.error("Error deleting task:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    revalidatePath('/tasks')
    return { success: true }
}

// ==================== TASK TIME ACTIONS ====================

export async function updateTaskTime(taskId: string, field: 'estimated_time' | 'elapsed_time', minutes: number, listId: string) {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
        [field]: minutes,
        updated_at: new Date().toISOString()
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

    if (error) {
        console.error("Error updating task time:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    revalidatePath('/tasks')
    return { success: true }
}

export async function toggleTaskComplete(taskId: string, listId: string) {
    const supabase = await createClient()

    // First get current state
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('completed, status')
        .eq('id', taskId)
        .single()

    if (fetchError || !task) {
        console.error("Error fetching task:", fetchError)
        return { success: false, error: fetchError?.message || "Task not found" }
    }

    const newCompleted = !task.completed
    const newStatus = newCompleted ? 'done' : task.status

    const { error } = await supabase
        .from('tasks')
        .update({
            completed: newCompleted,
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) {
        console.error("Error toggling task:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    revalidatePath('/tasks')
    return { success: true, completed: newCompleted }
}

const statusOrder: TaskStatus[] = ['backlog', 'this_week', 'today', 'done']

export async function moveTaskToColumn(taskId: string, direction: 'left' | 'right', listId: string) {
    const supabase = await createClient()

    // First get current status
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single()

    if (fetchError || !task) {
        console.error("Error fetching task:", fetchError)
        return { success: false, error: fetchError?.message || "Task not found" }
    }

    const currentIndex = statusOrder.indexOf(task.status as TaskStatus)
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= statusOrder.length) {
        return { success: false, error: "Cannot move further" }
    }

    const newStatus = statusOrder[newIndex]
    const completed = newStatus === 'done'

    const { error } = await supabase
        .from('tasks')
        .update({
            status: newStatus,
            completed,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) {
        console.error("Error moving task:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    return { success: true, newStatus }
}

// ==================== SUBTASK ACTIONS ====================

export async function addSubtask(taskId: string, title: string, listId: string) {
    const supabase = await createClient()

    // First get current subtasks
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('subtasks')
        .eq('id', taskId)
        .single()

    if (fetchError || !task) {
        console.error("Error fetching task:", fetchError)
        return { success: false, error: fetchError?.message || "Task not found" }
    }

    const subtasks = (task.subtasks as Subtask[]) || []
    const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        title,
        completed: false
    }

    const { error } = await supabase
        .from('tasks')
        .update({
            subtasks: [...subtasks, newSubtask],
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) {
        console.error("Error adding subtask:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    return { success: true, subtask: newSubtask }
}

export async function toggleSubtask(taskId: string, subtaskId: string, listId: string) {
    const supabase = await createClient()

    // First get current subtasks
    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('subtasks')
        .eq('id', taskId)
        .single()

    if (fetchError || !task) {
        console.error("Error fetching task:", fetchError)
        return { success: false, error: fetchError?.message || "Task not found" }
    }

    const subtasks = (task.subtasks as Subtask[]) || []
    const updatedSubtasks = subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )

    const { error } = await supabase
        .from('tasks')
        .update({
            subtasks: updatedSubtasks,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) {
        console.error("Error toggling subtask:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${listId}`)
    return { success: true }
}

