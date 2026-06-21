"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getProjectById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            creator:users!created_by(*),
            brand:brands(*),
            media:project_media(*),
            credits:project_credits(*),
            awards:awards(*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error("Error fetching project details:", error)
        // Attempt fallback without joins if complex fetch fails
        if (error.code === 'PGRST200') {
            const { data: fallback } = await supabase
                .from('projects')
                .select(`
                    *,
                    creator:users!created_by(*)
                `)
                .eq('id', id)
                .single()
            return fallback
        }
        return null
    }

    return data
}

export async function toggleProjectLike(projectId: string): Promise<{ success: boolean; isLiked?: boolean; likesCount?: number; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Você precisa estar logado para curtir' }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

    if (existingLike) {
        // Unlike
        await supabase
            .from('project_likes')
            .delete()
            .eq('id', existingLike.id)

        const { count } = await supabase
            .from('project_likes')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

        revalidatePath('/community')
        revalidatePath('/')
        return { success: true, isLiked: false, likesCount: count || 0 }
    } else {
        // Like
        await supabase
            .from('project_likes')
            .insert({ project_id: projectId, user_id: user.id })

        const { count } = await supabase
            .from('project_likes')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

        revalidatePath('/community')
        revalidatePath('/')
        return { success: true, isLiked: true, likesCount: count || 0 }
    }
}

export async function getProjectLikeStatus(projectId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { count } = await supabase
        .from('project_likes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

    if (!user) {
        return { isLiked: false, likesCount: count || 0 }
    }

    const { data: existingLike } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

    return { isLiked: !!existingLike, likesCount: count || 0 }
}

export async function trackProjectView(projectId: string): Promise<void> {
    const supabase = await createClient()

    // Increment view count
    try {
        await supabase.rpc('increment_project_views', { project_id: projectId })
    } catch {
        // Fallback for direct update if RPC fails
        await supabase
            .from('projects')
            .update({ views: 1 }) // This is just a dummy, ideally use RPC
            .eq('id', projectId)
    }
}

export async function getProjectStats(projectId: string): Promise<{
    likesCount: number
    viewsCount: number
    commentsCount: number
    isLiked: boolean
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get likes count
    const { count: likesCount } = await supabase
        .from('project_likes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

    // Get comments count
    const { count: commentsCount } = await supabase
        .from('project_comments')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

    // Get project views
    const { data: project } = await supabase
        .from('projects')
        .select('views')
        .eq('id', projectId)
        .single()

    // Check if user liked
    let isLiked = false
    if (user) {
        const { data: existingLike } = await supabase
            .from('project_likes')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single()
        isLiked = !!existingLike
    }

    return {
        likesCount: likesCount || 0,
        viewsCount: project?.views || 0,
        commentsCount: commentsCount || 0,
        isLiked
    }
}

export async function getProjectPipeline_v2() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let workspaceIds: string[] = []
    try {
        const { data: members, error: membersError } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)

        if (!membersError) {
            workspaceIds = members?.map(m => m.workspace_id) || []
        }
    } catch (e) {
        console.error("Unexpected error in workspace_members fetch:", e)
    }

    let query = supabase
        .from('projects')
        .select(`
            *,
            brand:brands(*),
            creator:users!created_by(id, name, avatar_url),
            tasks(id, title, completed, assignee:users!tasks_assignee_id_fkey(name))
        `)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

    if (workspaceIds.length > 0) {
        query = query.in('workspace_id', workspaceIds)
    } else {
        query = query.eq('created_by', user.id)
    }

    const { data: projects, error } = await query

    if (error) {
        console.error("Error fetching project pipeline:", error.message)
        return []
    }

    return (projects as unknown[]) || []
}

export async function getProjectStages(workspaceId: string) {
    const supabase = await createClient()
    const { data: stages, error } = await supabase
        .from('project_stages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true })

    if (error) {
        console.error("Error fetching project stages:", error)
        return []
    }

    return stages
}

export async function createProjectStage(data: { workspace_id: string, name: string, color: string, position: number }) {
    const supabase = await createClient()
    const { data: stage, error } = await supabase
        .from('project_stages')
        .insert(data)
        .select()
        .single()

    if (error) {
        console.error("Error creating project stage:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true, stage }
}

export async function updateProjectStage(stageId: string, data: Partial<{ name: string, color: string, position: number }>) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_stages')
        .update(data)
        .eq('id', stageId)

    if (error) {
        console.error("Error updating project stage:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function deleteProjectStage(stageId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_stages')
        .delete()
        .eq('id', stageId)

    if (error) {
        console.error("Error deleting project stage:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function updateProjectStatusLabel(projectId: string, statusLabel: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authorized" }

    // SECURITY: Verify the user is a member of the project's workspace
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (!project) return { success: false, error: "Project not found" }

    const { data: membership } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', project.workspace_id)
        .eq('user_id', user.id)
        .single()

    if (!membership) return { success: false, error: "Not authorized" }

    const { error } = await supabase
        .from('projects')
        .update({ status_label: statusLabel })
        .eq('id', projectId)

    if (error) {
        console.error("Error updating project status label:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function updateProjectStage_v2(projectId: string, status: string, isStageId: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    const updateData: Record<string, string | null> = {
        updated_at: new Date().toISOString()
    }

    if (isStageId) {
        updateData.stage_id = status
    } else {
        updateData.status = status
    }

    const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)

    if (error) {
        console.error("Error updating project stage:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function createNewProject(data: {
    name: string
    brand_id?: string
    status?: string
    stage_id?: string
    category?: string
    workspace_id: string
    description?: string
    priority?: string
    start_date?: string
    due_date?: string
    cover_url?: string
    type?: string
    tags?: string[]
    template_id?: string
    budget_type?: string
    budget_amount?: number
    currency?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    const insertData: Record<string, string | number | string[] | undefined | null> = {
        name: data.name,
        brand_id: data.brand_id || null,
        workspace_id: data.workspace_id || null,
        description: data.description || null,
        category: data.category || null,
        priority: data.priority,
        start_date: data.start_date || null,
        due_date: data.due_date || null,
        cover_url: data.cover_url || null,
        tags: data.tags,
        budget_type: data.budget_type || null,
        budget_amount: data.budget_amount,
        currency: data.currency,
        created_by: user.id
    }

    // Handle Stage vs Status
    const validStatuses = ['prospecting', 'discovery', 'planning', 'in_progress', 'review', 'done', 'delivery', 'archived']

    if (data.stage_id && data.stage_id.trim() !== "") {
        insertData.stage_id = data.stage_id
        insertData.status = (data.status && validStatuses.includes(data.status)) ? data.status : 'planning'
    } else {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.status || '')
        if (isUuid) {
            insertData.stage_id = data.status
            insertData.status = 'planning'
        } else {
            insertData.status = (data.status && validStatuses.includes(data.status)) ? data.status : 'planning'
        }
    }

    const validTypes = ['work', 'project']
    insertData.type = (data.type && validTypes.includes(data.type)) ? data.type : 'project'

    const { data: project, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.error("Error creating project:", error)
        return { success: false, error: error.message }
    }

    // Apply roadmap template if provided
    if (data.template_id) {
        const { applyRoadmapTemplate } = await import("./roadmap")
        await applyRoadmapTemplate(data.workspace_id, data.template_id, project.id)
    }

    revalidatePath('/projects')
    return { success: true, data: project }
}


export async function getWorkspaces() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: members, error } = await supabase
        .from('workspace_members')
        .select('workspace:workspaces(*)')
        .eq('user_id', user.id)

    if (error) {
        console.error("Error fetching workspaces:", error)
        return []
    }

    return members?.map(m => m.workspace).filter(Boolean) || []
}

export async function uploadProjectMedia(file: File) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(filePath, file)

    if (uploadError) {
        return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('project-media')
        .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
}

export async function updateProjectTimeline(projectId: string, data: {
    start_date?: string
    due_date?: string
    progress?: number
    dependency_id?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    const { error } = await supabase
        .from('projects')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

    if (error) {
        console.error("Error updating project timeline:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function updateProjectTags(projectId: string, tags: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    const { error } = await supabase
        .from('projects')
        .update({
            tags,
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

    if (error) {
        console.error("Error updating project tags:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function updateProjectDescription(projectId: string, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    const { error } = await supabase
        .from('projects')
        .update({
            description,
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

    if (error) {
        console.error("Error updating project description:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function bulkUpdateProjectCategory(oldCategory: string, newCategory: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    let query = supabase
        .from('projects')
        .update({
            category: newCategory,
            updated_at: new Date().toISOString()
        })

    if (oldCategory === 'uncategorized') {
        query = query.is('category', null)
    } else {
        query = query.eq('category', oldCategory)
    }

    const { error } = await query

    if (error) {
        console.error("Error bulk updating categories:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function updateProject(id: string, data: {
    name?: string
    brand_id?: string
    status?: string
    stage_id?: string
    category?: string
    description?: string
    priority?: string
    start_date?: string
    due_date?: string
    cover_url?: string
    type?: string
    tags?: string[]
    budget_type?: string
    budget_amount?: number
    currency?: string
    position?: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Not authorized" }

    const updateData: Record<string, string | number | string[] | undefined | null | boolean | Date> = {
        updated_at: new Date().toISOString()
    }

    if (data.name !== undefined) updateData.name = data.name || null
    if (data.brand_id !== undefined) updateData.brand_id = data.brand_id || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.category !== undefined) updateData.category = data.category || null
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.start_date !== undefined) updateData.start_date = data.start_date || null
    if (data.due_date !== undefined) updateData.due_date = data.due_date || null
    if (data.cover_url !== undefined) updateData.cover_url = data.cover_url || null
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.budget_type !== undefined) updateData.budget_type = data.budget_type || null
    if (data.budget_amount !== undefined) updateData.budget_amount = data.budget_amount
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.position !== undefined) updateData.position = data.position
    if (data.stage_id !== undefined) updateData.stage_id = data.stage_id || null

    const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)

    if (error) {
        console.error("Error updating project:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function archiveProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authorized" }

    // SECURITY: Verify the user is a member of the project's workspace
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', id)
        .single()

    if (!project) return { success: false, error: "Project not found" }

    const { data: membership } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', project.workspace_id)
        .eq('user_id', user.id)
        .single()

    if (!membership) return { success: false, error: "Not authorized" }

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'archived',
            status_label: 'Arquivado',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error("Error archiving project:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function deleteProject(id: string) {
    // Use admin client to bypass RLS — the anon client's DELETE is blocked by RLS policies
    const supabase = await createAdminClient()

    // Verify the caller is authenticated before proceeding
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return { success: false, error: "Not authorized" }

    // SECURITY: Verify the user is a member of the project's workspace before deletion
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id, created_by')
        .eq('id', id)
        .single()

    if (!project) return { success: false, error: "Project not found" }

    const { data: membership } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', project.workspace_id)
        .eq('user_id', user.id)
        .single()

    if (!membership) return { success: false, error: "Not authorized" }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error deleting project:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function duplicateProject(id: string) {
    const supabase = await createClient()
    const { data: original, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !original) {
        console.error("Error fetching project to duplicate:", fetchError)
        return { success: false, error: fetchError?.message || "Project not found" }
    }

    // Clone project
    const { id: _, created_at: _c, updated_at: _u, views: _v, ...rest } = original
    const duplicateData = {
        ...rest,
        name: `${original.name} (cópia)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert(duplicateData)
        .select()
        .single()

    if (insertError || !newProject) {
        console.error("Error inserting duplicated project:", insertError)
        return { success: false, error: insertError?.message || "Failed to create duplicate project" }
    }

    // Fetch original project tasks
    const { data: originalTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)

    if (originalTasks && originalTasks.length > 0) {
        const tasksToInsert = originalTasks.map((t: any) => {
            const { id: _, created_at: _tc, updated_at: _tu, ...taskRest } = t
            return {
                ...taskRest,
                project_id: newProject.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        })

        const { error: tasksInsertError } = await supabase
            .from('tasks')
            .insert(tasksToInsert)

        if (tasksInsertError) {
            console.error("Error duplicating project tasks:", tasksInsertError)
        }
    }

    revalidatePath('/projects')
    return { success: true, data: newProject }
}
