"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createBrandbookModule(brandbookId: string, type: string, order: number) {
    // Use Admin Client to bypass RLS
    const supabase = await createAdminClient()

    // Validate module type against enum (basic check)
    // In a real app we'd strict check against the enum definition

    // Default titles based on type
    const titles: Record<string, string> = {
        history: "Our History",
        mission: "Mission & Vision",
        archetype: "Brand Archetype",
        voice_tone: "Voice & Tone",
        logo: "Logo Guidelines",
        palette: "Color Palette",
        typography: "Typography",
        photography: "Photography",
        illustration: "Illustration",
        icons: "Iconography",
        grid: "Layout & Grid",
        applications: "Brand Applications",
        motion: "Motion Guidelines",
        forbidden: "Do's & Don'ts",
        download_center: "Download Center",
        custom: "Custom Section"
    }

    const { data: module, error } = await supabase
        .from('brandbook_modules')
        .insert({
            brandbook_id: brandbookId,
            type: type,
            title: titles[type] || "New Section",
            order: order,
            content_json: {} // Default empty content
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating module:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/brand/[brandId]/brandbook`)
    return { success: true, module }
}

export async function updateModuleContent(moduleId: string, content: Record<string, any>, brandId?: string) {
    console.log('[Server Action] updateModuleContent called:', { moduleId, contentKeys: Object.keys(content || {}), brandId })
    const supabase = await createAdminClient()

    console.log('[Server Action] Updating brandbook_modules. content_json size:', JSON.stringify(content).length)
    // Log a small sample of content to verify structure
    console.log('[Server Action] Payload sample:', JSON.stringify(content).substring(0, 200) + '...')

    const { error } = await supabase
        .from('brandbook_modules')
        .update({
            content_json: content
        })
        .eq('id', moduleId)

    if (error) {
        console.error("Error updating module content:", error)
        return { success: false, error: error.message }
    }

    console.log('[Server Action] updateModuleContent success for:', moduleId)

    if (brandId) {
        revalidatePath(`/brand/${brandId}/brandbook`)
    }

    return { success: true }
}

export async function updateModule(moduleId: string, data: Record<string, any>, brandId?: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('brandbook_modules').update(data).eq('id', moduleId)
    if (error) return { success: false, error: error.message }
    if (brandId) revalidatePath(`/brand/${brandId}/brandbook`)
    return { success: true }
}

export async function deleteModule(moduleId: string, brandId?: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('brandbook_modules')
        .delete()
        .eq('id', moduleId)

    if (error) {
        console.error("Error deleting module:", error)
        return { success: false, error: error.message }
    }

    if (brandId) {
        revalidatePath(`/brand/${brandId}/brandbook`)
    } else {
        revalidatePath(`/brand/[brandId]/brandbook`)
    }

    return { success: true }
}

export async function duplicateModule(moduleId: string, brandId?: string) {
    const supabase = await createAdminClient()

    // 1. Fetch original
    const { data: original, error: fetchError } = await supabase
        .from('brandbook_modules')
        .select('*')
        .eq('id', moduleId)
        .single()

    if (fetchError || !original) {
        console.error("Error fetching original module for duplication:", fetchError)
        return { success: false, error: fetchError?.message || "Module not found" }
    }

    // 2. Insert copy
    const { data: copy, error: insertError } = await supabase
        .from('brandbook_modules')
        .insert({
            brandbook_id: original.brandbook_id,
            type: original.type,
            title: `${original.title} (Copy)`,
            content_json: original.content_json,
            category: original.category,
            order: original.order + 1 // Place it right after
        })
        .select()
        .single()

    if (insertError) {
        console.error("Error creating duplicate module:", insertError)
        return { success: false, error: insertError.message }
    }

    if (brandId) {
        revalidatePath(`/brand/${brandId}/brandbook`)
    }

    return { success: true, module: copy }
}

export async function reorderModules(items: { id: string, order: number, category?: string }[]) {
    console.log('[reorderModules] Saving', items.length, 'modules:', items.map(i => ({ id: i.id.substring(0, 8), order: i.order, category: i.category })))

    const supabase = await createAdminClient()

    // Update each module with order and category
    const updates = items.map(item =>
        supabase
            .from('brandbook_modules')
            .update({
                order: item.order,
                category: item.category // Always update category, even if undefined
            })
            .eq('id', item.id)
    )

    const results = await Promise.all(updates)

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
        console.error('[reorderModules] Errors:', errors.map(e => e.error))
        return { success: false, error: 'Some updates failed' }
    }

    console.log('[reorderModules] All updates successful')
    return { success: true }
}

// Map page title to module type
function mapPageToModuleType(title: string): string {
    const map: Record<string, string> = {
        "Visão geral": "mission",
        "DNA da marca": "archetype",
        "História da marca": "history",
        "Logo": "logo",
        "Cores": "palette",
        "Tipografia": "typography",
        "Iconografia": "icons",
        "Imagens & Fotografia": "photography",
        "Ilustração": "illustration",
        "Grid & Layouts": "grid",
        "Elementos gráficos": "custom",
        "Motion design": "motion",
        "Aplicações digitais": "applications",
        "Aplicações offline": "applications",
        "Personalidade da marca": "custom",
        "Tom de voz": "voice_tone",
        "Linguagem preferencial": "custom",
        "Slogans e taglines": "custom",
        "Naming system": "custom",
        "Storytelling base": "custom",
        "Copywriting guidelines": "custom",
        "Som da marca": "custom",
        "Identidade olfativa": "custom",
        "Identidade tátil": "custom",
        "Identidade gustativa": "custom",
        "Experiência multimodal": "custom",
        "Guia de estilo visual": "custom"
    }
    return map[title] || "custom"
}

export async function updateModuleCategory(moduleId: string, category: string, brandId?: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('brandbook_modules')
        .update({ category })
        .eq('id', moduleId)

    if (error) {
        console.error("Error updating module category:", error)
        return { success: false, error: error.message }
    }

    if (brandId) revalidatePath(`/brand/${brandId}/brandbook`)
    return { success: true }
}

import { mapPageToCategory } from "@/lib/brandbook-utils"


export async function addBrandbookPages(brandbookId: string, newPageTitles: string[]) {
    const supabase = await createAdminClient()

    // Get current max order
    const { data: existingModules } = await supabase
        .from('brandbook_modules')
        .select('order, title')
        .eq('brandbook_id', brandbookId)
        .order('order', { ascending: false })
        .limit(1)

    const maxOrder = existingModules?.[0]?.order ?? -1

    // Get existing page titles to avoid duplicates
    const { data: allModules } = await supabase
        .from('brandbook_modules')
        .select('title')
        .eq('brandbook_id', brandbookId)

    const existingTitles = new Set(allModules?.map(m => m.title.toLowerCase()) || [])

    // Filter out pages that already exist
    const pagesToAdd = newPageTitles.filter(title =>
        !existingTitles.has(title.toLowerCase())
    )

    if (pagesToAdd.length === 0) {
        return { success: true, addedCount: 0 }
    }

    // Create module data
    const modulesData = pagesToAdd.map((pageTitle, index) => ({
        brandbook_id: brandbookId,
        title: pageTitle,
        type: mapPageToModuleType(pageTitle),
        order: maxOrder + 1 + index,
        category: mapPageToCategory(pageTitle),
        content_json: {}
    }))

    const { data: insertedModules, error } = await supabase
        .from('brandbook_modules')
        .insert(modulesData)
        .select()

    if (error) {
        console.error("Error adding pages:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/brand/[brandId]/brandbook`)
    return { success: true, addedCount: pagesToAdd.length, modules: insertedModules }
}

// Upload media files for brandbook blocks (video, audio, images)
// Returns a permanent URL instead of base64 data URL
export async function uploadBrandbookMedia(formData: FormData) {
    console.log('[Server Action] uploadBrandbookMedia started')
    const supabase = await createAdminClient()

    const file = formData.get("file") as File
    const brandId = formData.get("brandId") as string
    const moduleId = formData.get("moduleId") as string

    if (!file || !brandId) {
        console.error('[Server Action] uploadBrandbookMedia: Missing file or brandId')
        return { success: false, error: "Missing file or brandId" }
    }

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `brandbook/${brandId}/${moduleId || 'general'}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        console.log('[Server Action] Uploading to "assets" bucket:', fileName)

        // Upload to 'assets' bucket
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('assets')
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) {
            console.error('[Server Action] Storage upload error:', uploadError)
            throw uploadError
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName)

        console.log('[Server Action] Upload success. Public URL:', publicUrl)
        return { success: true, url: publicUrl }
    } catch (error) {
        console.error("Upload brandbook media error:", error)
        return { success: false, error: (error as Error).message || "Failed to upload media" }
    }
}

export async function getPublicBrandbooks() {
    const supabase = await createAdminClient()

    // Fetch brandbooks with public status (or is_public = true)
    // We'll try to find ones that are public. 
    // Since the user said they don't have the column yet, we might need to handle that,
    // but usually in these tasks we assume the column will be there or we add it.

    const { data: brandbooks, error } = await supabase
        .from('brandbooks')
        .select(`
            *,
            brand:brands(
                id,
                name,
                logo_url,
                slug,
                primary_color
            )
        `)
        // Try filtering by is_public or status. 
        // We'll use a generic approach for now or just fetch all and filter in JS if needed to avoid SQL errors
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching public brandbooks:", error)
        return []
    }

    // Temporary filtering until the column is officially in the DB and synced
    // We check for visibility = 'public', status = 'public', or is_public = true
    return (brandbooks || []).filter(b => {
        const isPublicVisibility = b.visibility === 'public';
        const isPublicStatus = b.status === 'public';
        const isPublicBool = b.is_public === true;
        return (isPublicVisibility || isPublicStatus || isPublicBool) && b.brand;
    })
}
