"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { BUILTIN_BRANDBOOK_TEMPLATES, BuiltinBrandbookTemplate } from "@/lib/brandbook-templates"
import { mapPageToCategory } from "@/lib/brandbook-utils"
import { checkIsAdmin } from "@/app/actions/admin"
import { BUILTIN_OVERRIDE_PREFIX, getBuiltinOverrides, isBuiltinOverrideRow, resolveTemplateModules } from "@/lib/brandbook-template-store"
import { createBrand } from "@/app/actions/brands"

interface SaveTemplateParams {
    name: string
    description?: string
    thumbnailUrl?: string
    category?: string
    modulesJson: any[]
    isPublic?: boolean
    brandId?: string
}

export interface UnifiedTemplate {
    id: string
    name: string
    description: string
    category: string
    categoryLabel: string
    tags: string[]
    accentColor: string
    gradient: string
    thumbnail_url?: string | null
    is_public: boolean
    is_builtin: boolean
    is_mine?: boolean
    created_by?: string | null
    modules_json: any[]
    created_at?: string
    /** Built-in template whose pages a superadmin has edited */
    is_edited?: boolean
}

const CATEGORY_STYLES: Record<string, { label: string; gradient: string; accentColor: string; tags: string[] }> = {
    agency: {
        label: 'Agência & Criativo',
        gradient: 'linear-gradient(135deg, #2D0A31 0%, #FF0054 100%)',
        accentColor: '#FF0054',
        tags: ['Agência', 'Criativo', 'Design System']
    },
    creative: {
        label: 'Agência & Criativo',
        gradient: 'linear-gradient(135deg, #2D0A31 0%, #FF0054 100%)',
        accentColor: '#FF0054',
        tags: ['Agência', 'Criativo', 'Design System']
    },
    minimalist: {
        label: 'Editorial & Minimal',
        gradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        accentColor: '#FFFFFF',
        tags: ['Minimal', 'Editorial', 'Tipografia']
    },
    minimal: {
        label: 'Editorial & Minimal',
        gradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        accentColor: '#FFFFFF',
        tags: ['Minimal', 'Editorial', 'Tipografia']
    },
    tech: {
        label: 'Tech & SaaS',
        gradient: 'linear-gradient(135deg, #0A2540 0%, #00D4B2 100%)',
        accentColor: '#00D4B2',
        tags: ['SaaS', 'Digital', 'UI/UX']
    },
    startup: {
        label: 'Tech & SaaS',
        gradient: 'linear-gradient(135deg, #0A2540 0%, #00D4B2 100%)',
        accentColor: '#00D4B2',
        tags: ['SaaS', 'Digital', 'UI/UX']
    },
    luxury: {
        label: 'Luxo & Lifestyle',
        gradient: 'linear-gradient(135deg, #1F1C18 0%, #C5A880 100%)',
        accentColor: '#C5A880',
        tags: ['Luxo', 'Premium', 'Herança']
    },
    corporate: {
        label: 'Corporativo',
        gradient: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
        accentColor: '#3B82F6',
        tags: ['Corporativo', 'Governança', 'Institucional']
    },
    custom: {
        label: 'Personalizado',
        gradient: 'linear-gradient(135deg, #1A102F 0%, #88007F 100%)',
        accentColor: '#88007F',
        tags: ['Personalizado', 'Brandbook']
    }
}

/**
 * Save the current brandbook as a template
 */
export async function saveBrandbookAsTemplate(params: SaveTemplateParams) {
    console.log('[Templates] Saving brandbook as template:', params.name)

    try {
        // 1. Authenticate user from session cookies
        const client = await createClient()
        const { data: { user }, error: authError } = await client.auth.getUser()

        if (authError || !user) {
            console.error('[Templates] Auth error:', authError)
            return { success: false, error: 'Utilizador não autenticado' }
        }

        // 2. Check if user is Super Admin
        const { isAdmin, role } = await checkIsAdmin(user.email)
        const isSuperAdmin = (isAdmin && role === 'superadmin') || user.app_metadata?.is_superadmin === true
        console.log('[Templates] User saving template:', { email: user.email, isSuperAdmin, role })

        const adminSupabase = await createAdminClient()

        // 3. Gather modules - ensure complete content from client or database
        let sourceModules: any[] = params.modulesJson || []

        if (params.brandId) {
            // Find brandbook for brand to enrich content if client state had any unrendered modules
            const { data: brandbook } = await adminSupabase
                .from('brandbooks')
                .select('id')
                .eq('brand_id', params.brandId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (brandbook) {
                const { data: dbModules } = await adminSupabase
                    .from('brandbook_modules')
                    .select('*')
                    .eq('brandbook_id', brandbook.id)
                    .order('order', { ascending: true })

                if (dbModules && dbModules.length > 0) {
                    if (!sourceModules || sourceModules.length === 0) {
                        sourceModules = dbModules
                    } else {
                        // Merge: ensure all modules from DB are present, and enrich any empty content_json
                        sourceModules = sourceModules.map(clientMod => {
                            const dbMod = dbModules.find(dm => dm.id === clientMod.id || dm.title === clientMod.title)
                            const clientEmpty = !clientMod.content_json || (typeof clientMod.content_json === 'object' && Object.keys(clientMod.content_json).length === 0)
                            if (clientEmpty && dbMod?.content_json && Object.keys(dbMod.content_json).length > 0) {
                                return {
                                    ...clientMod,
                                    type: clientMod.type || dbMod.type,
                                    category: clientMod.category || dbMod.category,
                                    content_json: dbMod.content_json
                                }
                            }
                            return clientMod
                        })
                    }
                }
            }
        }

        if (!sourceModules || sourceModules.length === 0) {
            return { success: false, error: 'Não foi possível encontrar seções para salvar neste template' }
        }

        // 4. Prepare and deeply clone modules (preserving all sections, columns, components, blocks, styles and files)
        const cleanModules = sourceModules.map((module, index) => {
            let content = module.content_json || {}
            if (typeof content === 'string') {
                try {
                    content = JSON.parse(content)
                } catch {
                    content = {}
                }
            }

            // Deep clone to ensure complete data isolation
            const deepClonedContent = JSON.parse(JSON.stringify(content))

            return {
                type: module.type || 'custom',
                title: module.title || `Página ${index + 1}`,
                content_json: deepClonedContent,
                order: index,
                category: module.category || mapPageToCategory(module.title)
            }
        })

        // 5. Resolve thumbnail (use custom or brand's cover/logo)
        let thumbnailUrl = params.thumbnailUrl || null
        if (!thumbnailUrl && params.brandId) {
            const { data: brand } = await adminSupabase
                .from('brands')
                .select('logo_url')
                .eq('id', params.brandId)
                .maybeSingle()
            thumbnailUrl = brand?.logo_url || null
        }

        // 6. Public status: Super Admin can make it public by default, or respect parameter
        const isPublic = params.isPublic !== undefined ? params.isPublic : (isSuperAdmin ? true : false)

        const { data, error } = await adminSupabase
            .from('brandbook_templates')
            .insert({
                name: params.name,
                description: params.description || null,
                thumbnail_url: thumbnailUrl,
                category: params.category || 'custom',
                modules_json: cleanModules,
                is_public: isPublic,
                created_by: user.id,
                brand_id: params.brandId || null,
            })
            .select()
            .single()

        if (error) {
            console.error('[Templates] Insert error:', error)
            return { success: false, error: error.message }
        }

        console.log('[Templates] Template saved successfully:', data.id, 'Modules count:', cleanModules.length)
        revalidatePath('/brand')
        revalidatePath('/brands')

        return { success: true, template: data }

    } catch (error: any) {
        console.error('[Templates] Unexpected error:', error)
        return { success: false, error: error?.message || 'Erro inesperado ao salvar template' }
    }
}

/**
 * Get all available templates (combines built-in curated templates and database custom templates)
 */
export async function getBrandbookTemplates(category?: string): Promise<{
    success: boolean
    templates: UnifiedTemplate[]
    error?: string
}> {
    console.log('[Templates] Fetching unified templates, category:', category)

    try {
        // Current user for is_mine detection
        let currentUserId: string | null = null
        try {
            const client = await createClient()
            const { data: { user } } = await client.auth.getUser()
            currentUserId = user?.id || null
        } catch {}

        // 1. Built-in templates (with a superadmin's edits, when there are any)
        let overrides: Record<string, { modules: any[] }> = {}
        try { overrides = await getBuiltinOverrides(await createAdminClient()) } catch {}
        const builtinTemplates: UnifiedTemplate[] = BUILTIN_BRANDBOOK_TEMPLATES.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            categoryLabel: t.categoryLabel,
            tags: t.tags,
            accentColor: t.accentColor,
            gradient: t.gradient,
            thumbnail_url: t.thumbnail_url || null,
            is_public: true,
            is_builtin: true,
            is_mine: false,
            created_by: null,
            modules_json: overrides[t.id]?.modules || t.modules_json,
            is_edited: !!overrides[t.id],
        }))

        // 2. Fetch from Supabase database
        let dbTemplates: UnifiedTemplate[] = []
        try {
            const adminSupabase = await createAdminClient()
            let query = adminSupabase
                .from('brandbook_templates')
                .select('*')
                .order('created_at', { ascending: false })

            const { data, error } = await query

            if (!error && data) {
                // Edited built-in pages are stored as hidden rows: not templates of their own
                dbTemplates = data.filter((t: any) => !isBuiltinOverrideRow(t)).map((t: any) => {
                    const catStyle = CATEGORY_STYLES[t.category] || CATEGORY_STYLES.custom
                    return {
                        id: t.id,
                        name: t.name,
                        description: t.description || 'Template personalizado criado pelo utilizador.',
                        category: t.category || 'custom',
                        categoryLabel: catStyle.label,
                        tags: catStyle.tags,
                        accentColor: catStyle.accentColor,
                        gradient: catStyle.gradient,
                        thumbnail_url: t.thumbnail_url || null,
                        is_public: !!t.is_public,
                        is_builtin: false,
                        is_mine: currentUserId ? t.created_by === currentUserId : false,
                        created_by: t.created_by || null,
                        modules_json: Array.isArray(t.modules_json) ? t.modules_json : [],
                        created_at: t.created_at
                    }
                })
            }
        } catch (dbErr) {
            console.warn('[Templates] Warning fetching DB templates:', dbErr)
        }

        // 3. Merge lists: DB templates first so user and admin templates are highlighted
        let allTemplates = [...dbTemplates, ...builtinTemplates]

        // 4. Apply category filter if requested
        if (category && category !== 'all') {
            if (category === 'mine') {
                allTemplates = dbTemplates.filter(t => t.is_mine || !t.is_builtin)
            } else if (category === 'custom') {
                allTemplates = dbTemplates
            } else {
                allTemplates = allTemplates.filter(t => {
                    if (category === 'agency') return t.category === 'agency' || t.category === 'creative'
                    if (category === 'minimalist') return t.category === 'minimalist' || t.category === 'minimal'
                    if (category === 'tech') return t.category === 'tech' || t.category === 'startup'
                    return t.category === category
                })
            }
        }

        return { success: true, templates: allTemplates }

    } catch (error: any) {
        console.error('[Templates] Unexpected error in getBrandbookTemplates:', error)
        // Fallback to built-in templates so UI is never empty
        return {
            success: true,
            templates: BUILTIN_BRANDBOOK_TEMPLATES.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                categoryLabel: t.categoryLabel,
                tags: t.tags,
                accentColor: t.accentColor,
                gradient: t.gradient,
                thumbnail_url: null,
                is_public: true,
                is_builtin: true,
                is_mine: false,
                created_by: null,
                modules_json: t.modules_json
            }))
        }
    }
}

/**
 * Get a single template by ID (checks built-in first, then database)
 */
export async function getTemplateById(templateId: string): Promise<{
    success: boolean
    template?: UnifiedTemplate
    error?: string
}> {
    console.log('[Templates] Fetching template:', templateId)

    // Check built-in
    const builtin = BUILTIN_BRANDBOOK_TEMPLATES.find(t => t.id === templateId)
    if (builtin) {
        return {
            success: true,
            template: {
                id: builtin.id,
                name: builtin.name,
                description: builtin.description,
                category: builtin.category,
                categoryLabel: builtin.categoryLabel,
                tags: builtin.tags,
                accentColor: builtin.accentColor,
                gradient: builtin.gradient,
                thumbnail_url: null,
                is_public: true,
                is_builtin: true,
                modules_json: (await resolveTemplateModules(await createAdminClient(), builtin.id)) || builtin.modules_json
            }
        }
    }

    try {
        const supabase = await createAdminClient()

        const { data, error } = await supabase
            .from('brandbook_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (error || !data) {
            console.error('[Templates] Fetch error:', error)
            return { success: false, error: error?.message || 'Template não encontrado' }
        }

        return {
            success: true,
            template: {
                id: data.id,
                name: data.name,
                description: data.description || '',
                category: data.category || 'custom',
                categoryLabel: data.category || 'Personalizado',
                tags: ['Personalizado'],
                accentColor: '#FF0054',
                gradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                thumbnail_url: data.thumbnail_url || null,
                is_public: !!data.is_public,
                is_builtin: false,
                modules_json: Array.isArray(data.modules_json) ? data.modules_json : []
            }
        }

    } catch (error: any) {
        console.error('[Templates] Unexpected error:', error)
        return { success: false, error: 'Erro ao buscar template' }
    }
}

/**
 * Apply a template to an existing brand
 */
export async function applyTemplateToExistingBrand(params: {
    brandId: string
    templateId: string
    replaceExisting?: boolean
}): Promise<{
    success: boolean
    brandId?: string
    error?: string
}> {
    const { brandId, templateId, replaceExisting = true } = params
    console.log('[Templates] Applying template to brand:', { brandId, templateId, replaceExisting })

    try {
        const client = await createClient()
        const { data: { user } } = await client.auth.getUser()
        if (!user) {
            return { success: false, error: 'Utilizador não autenticado' }
        }

        const adminSupabase = await createAdminClient()

        // 1. Verify brand exists
        const { data: brand, error: brandError } = await adminSupabase
            .from('brands')
            .select('id, name')
            .eq('id', brandId)
            .single()

        if (brandError || !brand) {
            return { success: false, error: 'Marca não encontrada' }
        }

        // 2. Resolve template modules
        const templateModules: any[] = (await resolveTemplateModules(adminSupabase, templateId)) || []

        if (!templateModules || templateModules.length === 0) {
            return { success: false, error: 'O template selecionado não contém seções válidas' }
        }

        // 3. Find or create brandbook for this brand
        let { data: brandbook } = await adminSupabase
            .from('brandbooks')
            .select('id')
            .eq('brand_id', brandId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!brandbook) {
            const { data: newBb, error: createBbError } = await adminSupabase
                .from('brandbooks')
                .insert({
                    brand_id: brandId,
                    title: 'Brand Book',
                    version: '1.0',
                    visibility: 'draft',
                    is_public: false
                })
                .select('id')
                .single()

            if (createBbError || !newBb) {
                return { success: false, error: 'Não foi possível inicializar o Brand Book da marca' }
            }
            brandbook = newBb
        }

        // 4. Optionally replace or append modules
        if (replaceExisting) {
            await adminSupabase
                .from('brandbook_modules')
                .delete()
                .eq('brandbook_id', brandbook.id)
        }

        // 5. Prepare and insert template modules
        const modulesData = templateModules.map((mod: any, index: number) => ({
            brandbook_id: brandbook.id,
            title: mod.title,
            type: mod.type,
            content_json: mod.content_json || {},
            order: index,
            category: mod.category || mapPageToCategory(mod.title)
        }))

        const { error: insertError } = await adminSupabase
            .from('brandbook_modules')
            .insert(modulesData)

        if (insertError) {
            console.error('[Templates] Error inserting template modules:', insertError)
            return { success: false, error: 'Erro ao inserir páginas do template no Brand Book' }
        }

        // 6. Update brand timestamp
        await adminSupabase
            .from('brands')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', brandId)

        revalidatePath('/brands')
        revalidatePath(`/brand/${brandId}`)
        revalidatePath(`/brand/${brandId}/brandbook`)

        return { success: true, brandId }

    } catch (error: any) {
        console.error('[Templates] Unexpected error in applyTemplateToExistingBrand:', error)
        return { success: false, error: error.message || 'Erro inesperado ao aplicar template' }
    }
}

/**
 * Fetch user's brands list for the modal selector
 */
export async function getUserBrandsForTemplateModal(): Promise<{
    id: string
    name: string
    slug: string
    updated_at: string
    primary_color?: string | null
    logo_url?: string | null
}[]> {
    try {
        const client = await createClient()
        const { data: { user } } = await client.auth.getUser()
        if (!user) return []

        const adminSupabase = await createAdminClient()

        const { data: members } = await adminSupabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)

        const workspaceIds = members?.map(m => m.workspace_id) || []

        const { data: brands } = await adminSupabase
            .from('brands')
            .select('id, name, slug, updated_at, primary_color, logo_url')
            .in('workspace_id', workspaceIds)
            .order('updated_at', { ascending: false })

        return brands || []
    } catch (e) {
        console.error('[Templates] Error getting user brands:', e)
        return []
    }
}

/**
 * Delete a template (only owner can delete)
 */
export async function deleteTemplate(templateId: string) {
    console.log('[Templates] Deleting template:', templateId)

    try {
        const client = await createClient()
        const { data: { user }, error: authError } = await client.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Utilizador não autenticado' }
        }

        const { isAdmin, role } = await checkIsAdmin(user.email)
        const isSuperAdmin = (isAdmin && role === 'superadmin') || user.app_metadata?.is_superadmin === true

        const supabase = await createAdminClient()

        // Fetch template to verify ownership
        const { data: template } = await supabase
            .from('brandbook_templates')
            .select('created_by')
            .eq('id', templateId)
            .maybeSingle()

        if (!template) {
            return { success: false, error: 'Template não encontrado' }
        }

        if (!isSuperAdmin && template.created_by !== user.id) {
            return { success: false, error: 'Não tem permissão para eliminar este template' }
        }

        const { error } = await supabase
            .from('brandbook_templates')
            .delete()
            .eq('id', templateId)

        if (error) {
            console.error('[Templates] Delete error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/brand')
        revalidatePath('/brands')
        return { success: true }

    } catch (error: any) {
        console.error('[Templates] Unexpected error:', error)
        return { success: false, error: error?.message || 'Erro ao apagar template' }
    }
}

// ---------------------------------------------------------------------------------------------
// Editing a template in place (superadmins only)
// ---------------------------------------------------------------------------------------------

/** The signed-in user when they are a superadmin */
async function superAdminUser() {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return null
    if (user.app_metadata?.is_superadmin === true) return user
    const { isAdmin, role } = await checkIsAdmin(user.email)
    return isAdmin && role === 'superadmin' ? user : null
}

/** Whether the signed-in user can edit brandbook templates */
export async function canEditBrandbookTemplates(): Promise<boolean> {
    try { return !!(await superAdminUser()) } catch { return false }
}

/**
 * Opens a template for editing: a draft brand gets the template's pages, edited in the normal editor
 * (opened with ?editTemplate=<id>); saving writes the pages back into the same template.
 */
export async function startTemplateEdit(templateId: string): Promise<{ success: boolean, brandId?: string, error?: string }> {
    const user = await superAdminUser()
    if (!user) return { success: false, error: 'Apenas superadministradores podem editar templates' }
    const found = await getTemplateById(templateId)
    if (!found.success || !found.template) return { success: false, error: found.error || 'Template não encontrado' }

    const formData = new FormData()
    formData.append('name', `Template · ${found.template.name}`)
    formData.append('templateId', templateId)
    formData.append('description', `Rascunho de edição do template «${found.template.name}». Pode ser eliminado depois de guardar.`)
    const created = await createBrand(formData)
    if (!created.success || !created.brandId) return { success: false, error: created.error || 'Não foi possível abrir o template para edição' }
    return { success: true, brandId: created.brandId }
}

/** Writes the edited pages into the same template (built-in templates keep them as their edited version) */
export async function saveTemplateEdits(params: { templateId: string, modules: any[] }): Promise<{ success: boolean, error?: string }> {
    const user = await superAdminUser()
    if (!user) return { success: false, error: 'Apenas superadministradores podem editar templates' }
    const { templateId, modules } = params
    if (!Array.isArray(modules) || modules.length === 0) return { success: false, error: 'O template tem de ter pelo menos uma página' }

    const cleanModules = modules.map((module: any, index: number) => {
        let content = module.content_json || {}
        if (typeof content === 'string') {
            try { content = JSON.parse(content) } catch { content = {} }
        }
        return {
            type: module.type || 'custom',
            title: module.title || `Página ${index + 1}`,
            content_json: JSON.parse(JSON.stringify(content)),
            order: index,
            category: module.category || mapPageToCategory(module.title),
        }
    })

    try {
        const admin = await createAdminClient()
        const builtin = BUILTIN_BRANDBOOK_TEMPLATES.find(t => t.id === templateId)
        if (builtin) {
            const name = `${BUILTIN_OVERRIDE_PREFIX}${templateId}`
            const { data: existing } = await admin.from('brandbook_templates').select('id').eq('name', name).limit(1).maybeSingle()
            const { error } = existing
                ? await admin.from('brandbook_templates').update({ modules_json: cleanModules }).eq('id', existing.id)
                : await admin.from('brandbook_templates').insert({
                    name,
                    description: `Versão editada do template «${builtin.name}»`,
                    category: builtin.category,
                    modules_json: cleanModules,
                    is_public: false,
                    created_by: user.id,
                    brand_id: null,
                })
            if (error) return { success: false, error: error.message }
        } else {
            const { data: row } = await admin.from('brandbook_templates').select('id').eq('id', templateId).maybeSingle()
            if (!row) return { success: false, error: 'Template não encontrado' }
            const { error } = await admin.from('brandbook_templates').update({ modules_json: cleanModules }).eq('id', templateId)
            if (error) return { success: false, error: error.message }
        }
        revalidatePath('/brand')
        revalidatePath('/brands')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error?.message || 'Erro ao guardar o template' }
    }
}

/** Brings a built-in template back to its original pages */
export async function resetBuiltinTemplate(templateId: string): Promise<{ success: boolean, error?: string }> {
    const user = await superAdminUser()
    if (!user) return { success: false, error: 'Apenas superadministradores podem editar templates' }
    if (!BUILTIN_BRANDBOOK_TEMPLATES.some(t => t.id === templateId)) return { success: false, error: 'Só os templates da Brivio têm versão original' }
    const admin = await createAdminClient()
    const { error } = await admin.from('brandbook_templates').delete().eq('name', `${BUILTIN_OVERRIDE_PREFIX}${templateId}`)
    if (error) return { success: false, error: error.message }
    revalidatePath('/brands')
    return { success: true }
}
