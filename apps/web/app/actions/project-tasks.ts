'use server'

import { prisma } from '@/lib/prisma'
import { createClient, createAdminClient, getCurrentUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { invalidateShareRoadmap } from "@/lib/share-cache"
import { ACCESS_ERROR, canAccessProject } from "@/lib/brand-access"

/** The project of a task, when the signed-in user may change it */
async function getAccessibleTaskProject(taskId: string): Promise<string | null> {
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { project_id: true } })
    if (!task?.project_id || !(await canAccessProject(task.project_id))) return null
    return task.project_id
}

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const user = await getCurrentUser()
    return user
}

export async function getProjectTasks(projectId: string) {
    // SECURITY: the admin client bypasses RLS, so only project members may list its tasks
    if (!(await canAccessProject(projectId))) return []
    try {
        // PERFORMANCE: one Supabase round-trip instead of Prisma; admin client keeps Prisma's access level
        const supabase = await createAdminClient()
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('id, title, status')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })
        if (error) throw error
        return (tasks || []).map(task => ({
            id: task.id,
            title: task.title,
            completed: task.status === 'done'
        }))
    } catch (error: unknown) {
        console.error('Error fetching project tasks:', error)
        return []
    }
}

export async function createProjectTask(projectId: string, title: string, description?: string) {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: 'Você precisa estar logado' }
    if (!(await canAccessProject(projectId))) return { success: false, error: ACCESS_ERROR }

    try {
        // Attempt to create the enum type if it's missing (Postgres specific)
        try {
            await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
                        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
                    END IF;
                END
                $$;
            `)
        } catch {
            console.log("Could not ensure enum type, proceeding anyway...")
        }

        const task = await prisma.task.create({
            data: {
                project_id: projectId,
                title,
                description,
                created_by: user.id,
                status: 'todo',
                priority: 'medium'
            }
        })
        invalidateShareRoadmap()
        revalidatePath('/projects')
        return { success: true, task: { id: task.id, title: task.title, completed: false } }
    } catch (error: unknown) {
        console.error('Error creating project task (Prisma):', error)

        const message = error instanceof Error ? error.message : String(error)

        if (message.includes("task_status")) {
            return { success: false, error: "O sistema detectou um problema na estrutura da base de dados (enum task_status em falta). Por favor, contacte o suporte." }
        }

        return { success: false, error: message || 'Erro ao criar tarefa' }
    }
}

export async function toggleProjectTask(taskId: string, completed: boolean) {
    // SECURITY: this used to update any task by id, even without a session
    if (!(await getAccessibleTaskProject(taskId))) return { success: false, error: ACCESS_ERROR }
    try {
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                status: completed ? 'done' : 'todo',
                updated_at: new Date()
            }
        })
        invalidateShareRoadmap()
        revalidatePath('/projects')
        return { success: true, task }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('Error toggling task (Prisma):', error)
        return { success: false, error: message || 'Erro ao atualizar tarefa' }
    }
}

export async function deleteProjectTask(taskId: string) {
    if (!(await getAccessibleTaskProject(taskId))) return { success: false, error: ACCESS_ERROR }
    try {
        await prisma.task.delete({
            where: { id: taskId }
        })
        invalidateShareRoadmap()
        revalidatePath('/projects')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('Error deleting task (Prisma):', error)
        return { success: false, error: message || 'Erro ao deletar tarefa' }
    }
}
