'use server'

import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ROADMAP_TEMPLATES } from "@/lib/roadmap-templates"

export interface RoadmapStage {
    id: string
    name: string
    color: string
    position: number
    tasks: {
        id: string
        title: string
        status: string
        completed: boolean
        cover_url?: string
        description?: string
        estimated_time?: number
        start_date?: string
        due_date?: string
        sprint_id?: string
        stage_id?: string
        priority?: string
        elapsed_time?: number
        assignee?: {
            id: string
            name: string
            avatar_url?: string
        }
    }[]
    progress: number
}

/**
 * Fetches all stages for a project's workspace and groups existing project tasks by stage_id.
 */
export async function getProjectRoadmap(projectId: string) {
    const supabase = await createClient()

    // 1. Get Project to find workspace_id
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (pError || !project?.workspace_id) {
        console.error("[getProjectRoadmap] Project or Workspace not found:", pError)
        return []
    }

    // 2. Get Stages for that workspace
    const { data: stages, error: sError } = await supabase
        .from('project_stages')
        .select('*')
        .eq('workspace_id', project.workspace_id)
        .order('position', { ascending: true })

    if (sError) {
        console.error("[getProjectRoadmap] Error fetching stages:", sError)
        return []
    }

    // 3. Get Tasks for this project
    // We use Prisma for tasks to ensure we can read the newly added stage_id if needed, 
    // but actually Supabase client is also fine if we don't have types yet.
    const { data: tasks, error: tError } = await supabase
        .from('tasks')
        .select(`
            id, 
            title, 
            status, 
            stage_id, 
            completed, 
            cover_url, 
            description, 
            estimated_time, 
            start_date, 
            due_date,
            elapsed_time,
            sprint_id,
            priority,
            assignee:users!tasks_assignee_id_fkey(id, name, avatar_url)
        `)
        .eq('project_id', projectId)

    if (tError) {
        console.error("[getProjectRoadmap] Error fetching tasks:", tError)
    }

    // 4. Group tasks by stage and filter stages without tasks for this project
    const roadmap: RoadmapStage[] = stages
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
                    assignee: t.assignee ? (Array.isArray(t.assignee) ? t.assignee[0] : t.assignee) : undefined
                }))

            const completedCount = stageTasks.filter(t => t.completed).length
            const totalCount = stageTasks.length
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

            return {
                id: stage.id,
                name: stage.name,
                color: stage.color,
                position: stage.position,
                tasks: stageTasks,
                progress
            }
        })
        .filter(stage => stage.tasks.length > 0)

    return roadmap
}

/**
 * Gets roadmap stats for client-facing view
 */
export async function getRoadmapStats(projectId: string) {
    const roadmap = await getProjectRoadmap(projectId)

    if (!roadmap || roadmap.length === 0) {
        return null
    }

    // Calculate global progress
    const totalTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.length, 0)
    const completedTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.filter(t => t.completed).length, 0)
    const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Find current phase (first phase that's not 100% complete)
    const currentPhase = roadmap.find(stage => stage.progress < 100) || roadmap[roadmap.length - 1]
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
 * Assigns a task to a roadmap stage (phase).
 */
export async function updateTaskStage(taskId: string, stageId: string, projectId: string) {
    try {
        // Using Prisma Raw for safety with the manually added column
        await prisma.$executeRawUnsafe(`
            UPDATE public.tasks 
            SET stage_id = $1::uuid, updated_at = NOW()
            WHERE id = $2::uuid
        `, stageId, taskId)

        revalidatePath(`/roadmap`)
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[updateTaskStage] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Updates a task's position and optionally its stage.
 */
export async function updateTaskPosition(taskId: string, position: number, stageId: string, projectId: string) {
    try {
        await prisma.$executeRawUnsafe(`
            UPDATE public.tasks 
            SET position = $1, stage_id = $2::uuid, updated_at = NOW()
            WHERE id = $3::uuid
        `, position, stageId, taskId)

        revalidatePath(`/roadmap`)
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[updateTaskPosition] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Batch updates task positions.
 */
export async function updateBatchTaskPositions(updates: { id: string, position: number, stageId: string }[], projectId: string) {
    try {
        for (const update of updates) {
            await prisma.$executeRawUnsafe(`
                UPDATE public.tasks 
                SET position = $1, stage_id = $2::uuid, updated_at = NOW()
                WHERE id = $3::uuid
            `, update.position, update.stageId, update.id)
        }

        revalidatePath(`/roadmap`)
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[updateBatchTaskPositions] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Updates a stage's position.
 */
export async function updateStagePosition(stageId: string, newPosition: number) {
    try {
        await prisma.$executeRawUnsafe(`
            UPDATE public.project_stages
            SET position = $1, updated_at = NOW()
            WHERE id = $2::uuid
        `, newPosition, stageId)
        revalidatePath('/roadmap')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[updateStagePosition] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Creates a new roadmap stage.
 */
export async function createRoadmapStage(workspaceId: string, name: string, color: string) {
    try {
        const lastStage = await prisma.$queryRawUnsafe<{ position: number }[]>(`
            SELECT position FROM public.project_stages
            WHERE workspace_id = $1::uuid
            ORDER BY position DESC
            LIMIT 1
        `, workspaceId)

        const newPosition = (lastStage?.[0]?.position || 0) + 1000

        await prisma.$executeRawUnsafe(`
            INSERT INTO public.project_stages (id, workspace_id, name, color, position, created_at, updated_at)
            VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, NOW(), NOW())
        `, workspaceId, name, color, newPosition)

        revalidatePath('/roadmap')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[createRoadmapStage] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Deletes a roadmap stage.
 */
export async function deleteRoadmapStage(stageId: string) {
    try {
        await prisma.$executeRawUnsafe(`
            DELETE FROM public.project_stages
            WHERE id = $1::uuid
        `, stageId)
        revalidatePath('/roadmap')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[deleteRoadmapStage] Error:", error)
        return { success: false, error: message }
    }
}
/**
 * Updates a roadmap stage.
 */
export async function updateRoadmapStage(stageId: string, name: string, color: string) {
    try {
        await prisma.$executeRawUnsafe(`
            UPDATE public.project_stages
            SET name = $1, color = $2, updated_at = NOW()
            WHERE id = $3::uuid
        `, name, color, stageId)

        revalidatePath('/roadmap')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[updateRoadmapStage] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Batch updates stage positions.
 */
export async function reorderRoadmapStages(updates: { id: string, position: number }[]) {
    try {
        for (const update of updates) {
            await prisma.$executeRawUnsafe(`
                UPDATE public.project_stages
                SET position = $1, updated_at = NOW()
                WHERE id = $2::uuid
            `, update.position, update.id)
        }

        revalidatePath('/roadmap')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[reorderRoadmapStages] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Applies a roadmap template to a workspace.
 */
export async function applyRoadmapTemplate(workspaceId: string, templateId: string, projectId?: string) {
    try {
        const supabase = await createClient()
        const template = ROADMAP_TEMPLATES.find(t => t.id === templateId)
        if (!template) {
            return { success: false, error: 'Template não encontrado' }
        }

        // 1. Get Project to verify workspace if projectId is provided
        let targetWorkspaceId = workspaceId
        let projectStartDate = new Date()

        if (projectId) {
            const { data: project } = await supabase
                .from('projects')
                .select('workspace_id, start_date')
                .eq('id', projectId)
                .single()
            if (project?.workspace_id) {
                targetWorkspaceId = project.workspace_id
            }
            if (project?.start_date) {
                projectStartDate = new Date(project.start_date)
            }
        }

        if (!targetWorkspaceId) {
            return { success: false, error: 'Workspace ID não fornecido' }
        }

        // 2. Get existing stages for this workspace to avoid duplicates and reuse IDs
        const { data: existingStages } = await supabase
            .from('project_stages')
            .select('id, name')
            .eq('workspace_id', targetWorkspaceId)

        let currentTaskStartDate = new Date(projectStartDate)

        // 3. Create/Select stages and create tasks
        for (let i = 0; i < template.stages.length; i++) {
            const stageTemplate = template.stages[i]
            const position = (i + 1) * 1000

            let stageId;
            const existing = existingStages?.find(s => s.name === stageTemplate.name)

            if (existing) {
                stageId = existing.id
            } else {
                const { data: newStage, error: stageError } = await supabase
                    .from('project_stages')
                    .insert({
                        workspace_id: targetWorkspaceId,
                        name: stageTemplate.name,
                        color: stageTemplate.color,
                        position: position
                    })
                    .select()
                    .single()

                if (stageError) throw stageError
                stageId = newStage.id
            }

            // Create tasks for this project if projectId is provided
            if (projectId && stageTemplate.tasks) {
                for (const taskTemplate of stageTemplate.tasks) {
                    const estimatedMinutes = (taskTemplate.duration_days || 0) * 24 * 60
                    const taskDueDate = new Date(currentTaskStartDate)
                    taskDueDate.setDate(taskDueDate.getDate() + (taskTemplate.duration_days || 1))

                    const { error: taskError } = await supabase
                        .from('tasks')
                        .insert({
                            project_id: projectId,
                            stage_id: stageId,
                            title: taskTemplate.title,
                            description: taskTemplate.description || '',
                            status: 'backlog',
                            completed: false,
                            estimated_time: estimatedMinutes,
                            priority: taskTemplate.priority || 'medium',
                            start_date: currentTaskStartDate.toISOString(),
                            due_date: taskDueDate.toISOString()
                        })

                    if (taskError) throw taskError

                    // Sequential tasking: next task starts when this one ends
                    currentTaskStartDate = new Date(taskDueDate)
                }
            }
        }

        // 4. Update project duration
        if (projectId) {
            await supabase
                .from('projects')
                .update({ due_date: currentTaskStartDate.toISOString() })
                .eq('id', projectId)
        }

        revalidatePath('/roadmap')
        if (projectId) revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[applyRoadmapTemplate] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Checks if all tasks in the current stage of a project are completed,
 * and if so, advances the project to the next stage in the roadmap.
 */
export async function advanceProjectStage(projectId: string) {
    try {
        const supabase = await createClient()

        // 1. Get current project stage
        const { data: project } = await supabase
            .from('projects')
            .select('workspace_id, stage_id')
            .eq('id', projectId)
            .single()

        if (!project?.stage_id || !project.workspace_id) {
            console.log("[advanceProjectStage] Project or stage_id not found")
            return { success: false }
        }

        // 2. Check if all tasks in current stage are complete
        const { data: tasks } = await supabase
            .from('tasks')
            .select('completed, status')
            .eq('project_id', projectId)
            .eq('stage_id', project.stage_id)

        if (!tasks || tasks.length === 0) {
            console.log("[advanceProjectStage] No tasks in current stage")
            return { success: false }
        }

        const allComplete = tasks.every(t => t.completed || t.status === 'done')

        if (!allComplete) {
            console.log("[advanceProjectStage] Not all tasks complete")
            return { success: false }
        }

        // 3. Get all stages for this workspace
        const { data: stages } = await supabase
            .from('project_stages')
            .select('id, position, name')
            .eq('workspace_id', project.workspace_id)
            .order('position', { ascending: true })

        if (!stages) return { success: false }

        // 4. Find current stage index
        const currentIndex = stages.findIndex(s => s.id === project.stage_id)
        if (currentIndex === -1 || currentIndex === stages.length - 1) {
            console.log("[advanceProjectStage] Already at last stage or current stage not found")
            return { success: false }
        }

        // 5. Advance to next stage
        const nextStage = stages[currentIndex + 1]

        const { error: updateError } = await supabase
            .from('projects')
            .update({ stage_id: nextStage.id })
            .eq('id', projectId)

        if (updateError) {
            console.error("[advanceProjectStage] Error updating project stage:", updateError)
            return { success: false, error: updateError.message }
        }

        console.log(`[advanceProjectStage] Advanced project ${projectId} to stage: ${nextStage.name}`)

        revalidatePath(`/projects/${projectId}`)
        revalidatePath('/roadmap')
        revalidatePath('/projects')

        return { success: true, nextStageId: nextStage.id, nextStageName: nextStage.name }
    } catch (error: unknown) {
        console.error("[advanceProjectStage] Error:", error)
        return { success: false }
    }
}

/**
 * Creates a new task for a roadmap stage.
 */
export async function createRoadmapTask(
    projectId: string,
    stageId: string,
    title: string,
    priority: string = 'medium',
    description?: string,
    estimatedTime?: number,
    startDate?: string,
    dueDate?: string,
    assigneeId?: string,
    sprintId?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                stage_id: stageId,
                title,
                description,
                status: 'backlog',
                priority,
                estimated_time: estimatedTime,
                start_date: startDate,
                due_date: dueDate,
                assignee_id: assigneeId,
                sprint_id: sprintId,
                completed: false,
                created_by: user?.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/roadmap')
        revalidatePath(`/projects/${projectId}`)
        return { success: true, task }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("[createRoadmapTask] Error:", error)
        return { success: false, error: message }
    }
}

/**
 * Toggles completion of a roadmap task.
 */
export async function toggleRoadmapTask(taskId: string, projectId: string) {
    try {
        const supabase = await createClient()

        const { data: task } = await supabase
            .from('tasks')
            .select('completed')
            .eq('id', taskId)
            .single()

        if (!task) return { success: false }

        const newCompleted = !task.completed
        const { error } = await supabase
            .from('tasks')
            .update({
                completed: newCompleted,
                status: newCompleted ? 'done' : 'backlog',
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId)

        if (error) throw error

        revalidatePath('/roadmap')
        revalidatePath(`/projects/${projectId}`)
        return { success: true, completed: newCompleted }
    } catch (error: unknown) {
        console.error("[toggleRoadmapTask] Error:", error)
        return { success: false }
    }
}

/**
 * Deletes a roadmap task.
 */
export async function deleteRoadmapTask(taskId: string, projectId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (error) throw error

        revalidatePath('/roadmap')
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("[deleteRoadmapTask] Error:", error)
        return { success: false }
    }
}

/**
 * Updates a roadmap task title.
 */
export async function updateRoadmapTask(taskId: string, title: string, projectId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('tasks')
            .update({ title, updated_at: new Date().toISOString() })
            .eq('id', taskId)

        if (error) throw error

        revalidatePath('/roadmap')
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("[updateRoadmapTask] Error:", error)
        return { success: false }
    }
}

/**
 * Fetches members of the workspace associated with a project.
 */
export async function getProjectMembers(projectId: string) {
    const supabase = await createClient()

    // 1. Get workspace_id
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (!project?.workspace_id) return []

    // 2. Get members
    const { data: members, error } = await supabase
        .from('workspace_members')
        .select(`
            id,
            role,
            user:users (
                id,
                name,
                avatar_url,
                email
            )
        `)
        .eq('workspace_id', project.workspace_id)

    if (error) {
        console.error("[getProjectMembers] Error:", error)
        return []
    }

    interface WorkspaceMemberResult {
        id: string;
        role: string;
        user: {
            id: string;
            name: string;
            avatar_url: string;
            email: string;
        };
    }

    return (members as unknown as WorkspaceMemberResult[]).map((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatar_url: m.user.avatar_url,
        email: m.user.email,
        role: m.role
    }))
}

/**
 * Updates full task details.
 */
export async function updateRoadmapTaskDetails(
    taskId: string,
    projectId: string,
    updates: {
        title?: string
        description?: string
        cover_url?: string
        priority?: string
        estimated_time?: number
        elapsed_time?: number
        start_date?: string
        due_date?: string
        assignee_id?: string
        status?: string
        completed?: boolean
        sprint_id?: string | null
    }
) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('tasks')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId)

        if (error) throw error

        revalidatePath('/roadmap')
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: unknown) {
        console.error("[updateRoadmapTaskDetails] Error:", error)
        return { success: false }
    }
}
