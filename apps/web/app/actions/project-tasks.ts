'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getProjectTasks(projectId: string) {
    try {
        const tasks = await prisma.task.findMany({
            where: { project_id: projectId },
            orderBy: { created_at: 'asc' }
        })
        return tasks.map(task => ({
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
    try {
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                status: completed ? 'done' : 'todo',
                updated_at: new Date()
            }
        })
        revalidatePath('/projects')
        return { success: true, task }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('Error toggling task (Prisma):', error)
        return { success: false, error: message || 'Erro ao atualizar tarefa' }
    }
}

export async function deleteProjectTask(taskId: string) {
    try {
        await prisma.task.delete({
            where: { id: taskId }
        })
        revalidatePath('/projects')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('Error deleting task (Prisma):', error)
        return { success: false, error: message || 'Erro ao deletar tarefa' }
    }
}
