'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export async function fixProjectSchema() {
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE IF EXISTS public.projects 
            ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
        `)
        return { success: true }
    } catch (error: any) {
        console.error("Migration error:", error)
        return { success: false, error: error.message }
    }
}

export async function updateProjectPosition(projectId: string, newPosition: number, stageId?: string) {
    try {
        const isStageUuid = stageId && isUuid(stageId);

        if (isStageUuid) {
            await prisma.$executeRawUnsafe(`
                UPDATE public.projects 
                SET position = $1, stage_id = $2::uuid, updated_at = NOW()
                WHERE id = $3::uuid
            `, newPosition, stageId, projectId)
        } else if (stageId) {
            // Check if it's a known status
            const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done', 'canceled'];
            if (statuses.includes(stageId)) {
                await prisma.$executeRawUnsafe(`
                    UPDATE public.projects 
                    SET position = $1, status = $2::project_status, updated_at = NOW()
                    WHERE id = $3::uuid
                `, newPosition, stageId as any, projectId)
            } else {
                // Otherwise assume it's a category
                await prisma.$executeRawUnsafe(`
                    UPDATE public.projects 
                    SET position = $1, category = $2, updated_at = NOW()
                    WHERE id = $3::uuid
                `, newPosition, stageId, projectId)
            }
        } else {
            await prisma.$executeRawUnsafe(`
                UPDATE public.projects 
                SET position = $1, updated_at = NOW()
                WHERE id = $2::uuid
            `, newPosition, projectId)
        }

        revalidatePath('/projects')
        return { success: true }
    } catch (error: any) {
        console.error("Position update error (Raw):", error)
        return { success: false, error: error.message }
    }
}

export async function updateBatchProjectPositions(updates: { id: string, position: number, stageId?: string }[]) {
    try {
        // We use a transaction or serial execution for safety
        for (const update of updates) {
            const isStageUuid = update.stageId && isUuid(update.stageId);

            if (isStageUuid) {
                await prisma.$executeRawUnsafe(`
                    UPDATE public.projects 
                    SET position = $1, stage_id = $2::uuid, updated_at = NOW()
                    WHERE id = $3::uuid
                `, update.position, update.stageId, update.id)
            } else if (update.stageId) {
                const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done', 'canceled'];
                if (statuses.includes(update.stageId)) {
                    await prisma.$executeRawUnsafe(`
                        UPDATE public.projects 
                        SET position = $1, status = $2::project_status, updated_at = NOW()
                        WHERE id = $3::uuid
                    `, update.position, update.stageId as any, update.id)
                } else {
                    await prisma.$executeRawUnsafe(`
                        UPDATE public.projects 
                        SET position = $1, category = $2, updated_at = NOW()
                        WHERE id = $3::uuid
                    `, update.position, update.stageId, update.id)
                }
            } else {
                await prisma.$executeRawUnsafe(`
                    UPDATE public.projects 
                    SET position = $1, updated_at = NOW()
                    WHERE id = $2::uuid
                `, update.position, update.id)
            }
        }

        revalidatePath('/projects')
        return { success: true }
    } catch (error: any) {
        console.error("Batch position update error:", error)
        return { success: false, error: error.message }
    }
}
