"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface SaveTemplateParams {
    name: string
    description?: string
    thumbnailUrl?: string
    category?: string
    modulesJson: any[]
    isPublic?: boolean
    brandId?: string
}

/**
 * Save the current brandbook as a template
 */
export async function saveBrandbookAsTemplate(params: SaveTemplateParams) {
    console.log('[Templates] Saving brandbook as template:', params.name)

    try {
        const supabase = await createAdminClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('[Templates] Auth error:', authError)
            return { success: false, error: 'Utilizador não autenticado' }
        }

        // Prepare modules data - strip IDs and update timestamps to make them generic
        const cleanModules = params.modulesJson.map((module, index) => ({
            type: module.type,
            title: module.title,
            content_json: module.content_json,
            order: index,
            // Don't include IDs - they'll be generated when template is used
        }))

        const { data, error } = await supabase
            .from('brandbook_templates')
            .insert({
                name: params.name,
                description: params.description || null,
                thumbnail_url: params.thumbnailUrl || null,
                category: params.category || 'custom',
                modules_json: cleanModules,
                is_public: params.isPublic || false,
                created_by: user.id,
                brand_id: params.brandId || null,
            })
            .select()
            .single()

        if (error) {
            console.error('[Templates] Insert error:', error)
            return { success: false, error: error.message }
        }

        console.log('[Templates] Template saved successfully:', data.id)
        revalidatePath('/brand')

        return { success: true, template: data }

    } catch (error) {
        console.error('[Templates] Unexpected error:', error)
        return { success: false, error: 'Erro inesperado ao salvar template' }
    }
}

/**
 * Get all available templates (public + user's own)
 */
export async function getBrandbookTemplates(category?: string) {
    console.log('[Templates] Fetching templates, category:', category)

    try {
        const supabase = await createAdminClient()

        let query = supabase
            .from('brandbook_templates')
            .select('*')
            .order('created_at', { ascending: false })

        if (category && category !== 'all') {
            query = query.eq('category', category)
        }

        const { data, error } = await query

        if (error) {
            console.error('[Templates] Fetch error:', error)
            return { success: false, error: error.message, templates: [] }
        }

        return { success: true, templates: data || [] }

    } catch (error) {
        console.error('[Templates] Unexpected error:', error)
        return { success: false, error: 'Erro ao buscar templates', templates: [] }
    }
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(templateId: string) {
    console.log('[Templates] Fetching template:', templateId)

    try {
        const supabase = await createAdminClient()

        const { data, error } = await supabase
            .from('brandbook_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (error) {
            console.error('[Templates] Fetch error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, template: data }

    } catch (error) {
        console.error('[Templates] Unexpected error:', error)
        return { success: false, error: 'Erro ao buscar template' }
    }
}

/**
 * Delete a template (only owner can delete)
 */
export async function deleteTemplate(templateId: string) {
    console.log('[Templates] Deleting template:', templateId)

    try {
        const supabase = await createAdminClient()

        const { error } = await supabase
            .from('brandbook_templates')
            .delete()
            .eq('id', templateId)

        if (error) {
            console.error('[Templates] Delete error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/brand')
        return { success: true }

    } catch (error) {
        console.error('[Templates] Unexpected error:', error)
        return { success: false, error: 'Erro ao apagar template' }
    }
}
