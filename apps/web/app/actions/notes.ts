"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addProjectNote(
    projectId: string,
    content: string,
    isFromClient: boolean,
    authorName: string = "Cliente"
) {
    try {
        let finalAuthorName = authorName

        // Se não for do cliente, tenta usar o nome do utilizador autenticado
        if (!isFromClient) {
            const supabase = await createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                if (session.user.user_metadata?.full_name) {
                    finalAuthorName = session.user.user_metadata.full_name
                } else if (session.user.user_metadata?.name) {
                    finalAuthorName = session.user.user_metadata.name
                } else {
                    finalAuthorName = "Equipa Brivio"
                }
            }
        }

        const result = await prisma.$queryRaw`
            INSERT INTO project_notes (project_id, content, is_from_client, author_name)
            VALUES (${projectId}::uuid, ${content}, ${isFromClient}, ${finalAuthorName})
            RETURNING *;
        `
        const note = Array.isArray(result) ? result[0] : null

        revalidatePath(`/roadmap`)
        revalidatePath(`/share/[assetId]/roadmap`, 'page')
        
        return { success: true, note }
    } catch (error: any) {
        console.error("Error adding project note:", error)
        return { success: false, error: "Failed to add project note" }
    }
}

export async function getProjectNotes(projectId: string) {
    try {
        const notes = await prisma.$queryRaw`
            SELECT * FROM project_notes 
            WHERE project_id = ${projectId}::uuid 
            ORDER BY created_at ASC
        `
        return { success: true, notes }
    } catch (error) {
        console.error("Error fetching project notes:", error)
        return { success: false, error: "Failed to fetch project notes" }
    }
}
