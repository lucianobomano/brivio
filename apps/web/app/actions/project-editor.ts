"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ProjectStatus } from "@prisma/client"

export async function createProjectDraft() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    // Check if Service Role Key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon client.")
    }

    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // 1. Ensure User exists in public.users
    const { data: publicUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

    if (!publicUser) {
        await adminSupabase.from('users').insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url
        })
    }

    // 2. Find or Create Workspace
    const { data: workspace } = await adminSupabase
        .from('workspaces')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .single()

    let workspaceId = workspace?.id

    if (!workspaceId) {
        const slug = "workspace-" + Math.random().toString(36).substring(2, 7)
        const { data: newWS } = await adminSupabase
            .from('workspaces')
            .insert({
                name: "My Workspace",
                slug,
                type: 'personal',
                created_by: user.id
            })
            .select()
            .single()

        if (newWS) workspaceId = newWS.id
    }

    // 3. Create Project Draft (using user client to respect RLS, but if RLS fails, we know why)
    // Actually, let's use the user client here so policies can be tested
    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            name: "Untitled Project",
            status: 'planning',
            created_by: user.id,
            workspace_id: workspaceId,
            content_json: [],
            type: 'work'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating project draft:', error)
        // If still failing RLS, explain it to the user
        if (error.code === '42501') {
            return { success: false, error: "Permissions error: Please run the SQL fix provided to allow project creation." }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true, project }
}

export async function saveProjectContent(projectId: string, data: {
    name?: string,
    description?: string,
    content_json?: any[],
    tags?: string[],
    category?: string,
    cover_url?: string,
    visibility?: string
}) {
    const supabase = await createClient()

    // We update the project record. 
    // Metadata can be stored in the main table or separated if needed.
    const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', projectId)

    if (error) {
        console.error('Error saving project content:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function publishProject(projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'done',
            published_at: new Date().toISOString()
        })
        .eq('id', projectId)

    if (error) {
        console.error('Error publishing project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/community')
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function uploadProjectMedia(formData: FormData) {
    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File

    if (!projectId || !file) {
        return { success: false, error: "Missing project ID or file." }
    }

    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // 1. Ensure Bucket exists
    const { data: buckets } = await adminSupabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === 'project-media')

    if (!bucketExists) {
        const { error: bucketError } = await adminSupabase.storage.createBucket('project-media', {
            public: true,
            allowedMimeTypes: ['image/*', 'video/*'],
            fileSizeLimit: 52428800 // 50MB
        })
        if (bucketError) {
            console.error('Error creating bucket:', bucketError)
            return { success: false, error: "Failed to initialize storage." }
        }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `projects/${fileName}`

    const { error: uploadError } = await adminSupabase.storage
        .from('project-media')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Error uploading media:', uploadError)
        return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = adminSupabase.storage
        .from('project-media')
        .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
}
