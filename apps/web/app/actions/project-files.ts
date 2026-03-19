"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ProjectFile {
    id: string
    project_id: string
    name: string
    file_url: string
    type: string
    size: number
    created_at: string
}

export async function getProjectFiles(projectId: string) {
    const supabase = await createClient()
    const { data: files, error } = await supabase
        .from('project_media')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching project files:", error)
        return []
    }

    return files as ProjectFile[]
}

export async function uploadProjectFile(projectId: string, file: File, name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `files/${fileName}`

    const { error: uploadError } = await adminSupabase.storage
        .from('project-media')
        .upload(filePath, file)

    if (uploadError) {
        return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = adminSupabase.storage
        .from('project-media')
        .getPublicUrl(filePath)

    const { data: record, error: dbError } = await supabase
        .from('project_media')
        .insert({
            project_id: projectId,
            name: name || file.name,
            file_url: publicUrl,
            type: file.type,
            size: file.size
        })
        .select()
        .single()

    if (dbError) {
        return { success: false, error: dbError.message }
    }

    revalidatePath('/projects')
    return { success: true, file: record }
}

export async function deleteProjectFile(fileId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_media')
        .delete()
        .eq('id', fileId)

    if (error) {
        console.error("Error deleting project file:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}
