"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { invalidateShareRoadmap } from "@/lib/share-cache"
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { ACCESS_ERROR, canAccessProject } from "@/lib/brand-access"
import { loadProjectNotes } from "@/lib/project-data"

export async function addProjectNote(
    projectId: string,
    content: string,
    isFromClient: boolean,
    authorName: string = "Cliente"
) {
    try {
        let finalAuthorName = authorName

        if (!content?.trim() || content.length > 5000) return { success: false, error: "Nota inválida." }

        if (isFromClient) {
            // Clients post from the public share roadmap (no account); the link is keyed by project id
            const admin = await createAdminClient()
            const { data: project } = await admin.from('projects').select('id').eq('id', projectId).maybeSingle()
            if (!project) return { success: false, error: ACCESS_ERROR }
            finalAuthorName = (authorName || "Cliente").slice(0, 80)
        } else {
            // SECURITY: team notes need a signed-in member of the project
            const user = await getCurrentUser()
            if (!user || !(await canAccessProject(projectId))) return { success: false, error: ACCESS_ERROR }
            finalAuthorName = user.user_metadata?.full_name || user.user_metadata?.name || "Equipa Brivio"
        }

        const result = await prisma.$queryRaw`
            INSERT INTO project_notes (project_id, content, is_from_client, author_name)
            VALUES (${projectId}::uuid, ${content}, ${isFromClient}, ${finalAuthorName})
            RETURNING *;
        `
        const note = Array.isArray(result) ? result[0] : null

        invalidateShareRoadmap()
        revalidatePath(`/roadmap`)
        revalidatePath(`/share/[assetId]/roadmap`, 'page')
        
        return { success: true, note }
    } catch (error: any) {
        console.error("Error adding project note:", error)
        return { success: false, error: "Failed to add project note" }
    }
}

export async function getProjectNotes(projectId: string) {
    // SECURITY: callable from the browser, so members only (the public share page uses loadProjectNotes)
    if (!(await canAccessProject(projectId))) return { success: false, error: ACCESS_ERROR }
    return loadProjectNotes(projectId)
}
