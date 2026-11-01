'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { invalidateShareRoadmap } from "@/lib/share-cache"
import { ACCESS_ERROR, canAccessProject } from "@/lib/brand-access"
import { loadProjectMeetings } from "@/lib/project-data"

export interface ProjectMeeting {
    id: string
    project_id: string
    stage_id?: string | null
    title: string
    description?: string | null
    meeting_date: string
    location?: string | null
    status: string
    created_at: string
}

/**
 * Creates a new meeting for a project.
 */
export async function createProjectMeeting(
    projectId: string,
    title: string,
    meetingDate: string,
    stageId?: string | null,
    description?: string,
    location?: string
) {
    if (!(await canAccessProject(projectId))) return { success: false, error: ACCESS_ERROR }
    try {
        const result = await prisma.$queryRawUnsafe<any[]>(`
            INSERT INTO project_meetings (project_id, stage_id, title, description, meeting_date, location)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5::timestamptz, $6)
            RETURNING *;
        `, projectId, stageId || null, title, description || null, meetingDate, location || null)

        const meeting = result?.[0]

        invalidateShareRoadmap()
        revalidatePath('/roadmap')
        revalidatePath(`/share/[assetId]/roadmap`, 'page')
        return { success: true, meeting }
    } catch (error: any) {
        console.error("[createProjectMeeting] Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Updates an existing meeting.
 */
export async function updateProjectMeeting(
    meetingId: string,
    projectId: string,
    updates: {
        title?: string
        description?: string | null
        meeting_date?: string
        location?: string | null
        stage_id?: string | null
        status?: string
    }
) {
    if (!(await canAccessProject(projectId))) return { success: false, error: ACCESS_ERROR }
    try {
        const setClauses: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (updates.title !== undefined) {
            setClauses.push(`title = $${paramIndex}`)
            values.push(updates.title)
            paramIndex++
        }
        if (updates.description !== undefined) {
            setClauses.push(`description = $${paramIndex}`)
            values.push(updates.description)
            paramIndex++
        }
        if (updates.meeting_date !== undefined) {
            setClauses.push(`meeting_date = $${paramIndex}::timestamptz`)
            values.push(updates.meeting_date)
            paramIndex++
        }
        if (updates.location !== undefined) {
            setClauses.push(`location = $${paramIndex}`)
            values.push(updates.location)
            paramIndex++
        }
        if (updates.stage_id !== undefined) {
            setClauses.push(`stage_id = $${paramIndex}::uuid`)
            values.push(updates.stage_id)
            paramIndex++
        }
        if (updates.status !== undefined) {
            setClauses.push(`status = $${paramIndex}`)
            values.push(updates.status)
            paramIndex++
        }

        setClauses.push('updated_at = NOW()')
        values.push(meetingId)
        values.push(projectId)

        await prisma.$executeRawUnsafe(
            `UPDATE project_meetings SET ${setClauses.join(', ')} WHERE id = $${paramIndex}::uuid AND project_id = $${paramIndex + 1}::uuid`,
            ...values
        )

        invalidateShareRoadmap()
        revalidatePath('/roadmap')
        revalidatePath(`/share/[assetId]/roadmap`, 'page')
        return { success: true }
    } catch (error: any) {
        console.error("[updateProjectMeeting] Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Deletes a meeting.
 */
export async function deleteProjectMeeting(meetingId: string, projectId: string) {
    if (!(await canAccessProject(projectId))) return { success: false, error: ACCESS_ERROR }
    try {
        await prisma.$executeRawUnsafe(
            `DELETE FROM project_meetings WHERE id = $1::uuid AND project_id = $2::uuid`,
            meetingId,
            projectId
        )

        invalidateShareRoadmap()
        revalidatePath('/roadmap')
        revalidatePath(`/share/[assetId]/roadmap`, 'page')
        return { success: true }
    } catch (error: any) {
        console.error("[deleteProjectMeeting] Error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Fetches all meetings for a project, ordered by date.
 */
export async function getProjectMeetings(projectId: string): Promise<ProjectMeeting[]> {
    // SECURITY: callable from the browser, so members only (the public share page uses loadProjectMeetings)
    if (!(await canAccessProject(projectId))) return []
    return loadProjectMeetings(projectId)
}
