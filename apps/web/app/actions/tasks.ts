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

    // Sort tasks by position or created_at if needed, though client can do it.
    // Supabase returns tasks as an array on the list object.

    console.log("[getTaskLists] Found lists:", lists?.length || 0)
    return lists as TaskListWithTasks[]
}

export async function getTaskList(listId: string) {
    const supabase = await createClient()

    const { data: list, error } = await supabase
        .from('task_lists')
        .select('*')
        .eq('id', listId)
        .single()

    if (error) {
        console.error("Error fetching list:", error)
        return null
    }

    return list as TaskList
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

    // Debug: Check list ownership
    const { data: list, error: listError } = await supabase
        .from('task_lists')
        .select('id, user_id')
        .eq('id', data.listId)
        .single()

    console.log("[createTask] List check:", list, "Error:", listError)

    if (!list) return { success: false, error: "List not found" }
    if (list.user_id !== user.id) return { success: false, error: "List belongs to another user" }

    // Calculate position: max position + 1000
    const { data: maxPosTask } = await supabase
        .from('tasks')
        .select('position')
        .eq('list_id', data.listId)
        .eq('status', data.status)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosTask?.position || 0) + 1000

    const { data: task, error } = await supabase
        .from('tasks')
        .insert({
            list_id: data.listId,
            title: data.title,
            status: data.status,
            estimated_time: data.estimatedTime || 0,
            elapsed_time: 0,
            subtasks: [],
            completed: false,
            position: newPosition,
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating task:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/tasks/${data.listId}`)
    return { success: true, task }
}

export async function getTasksByList(listId: string): Promise<Task[]> {
    const supabase = await createClient()

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true })

    if (error) {
        console.error("Error fetching tasks:", error)
        return []
    }

    // Map tasks to ensure all fields have default values
    return (tasks || []).map(task => ({
        ...task,
        elapsed_time: task.elapsed_time ?? 0,
        subtasks: task.subtasks ?? [],
        position: task.position ?? 0,
    })) as Task[]
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

