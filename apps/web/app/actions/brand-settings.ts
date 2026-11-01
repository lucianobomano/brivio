'use server'

import { createAdminClient } from "@/lib/supabase/server"
import { BRAND_ACCESS_ERROR, assertBrandAccess, canAccessBrand, canViewBrand, denyUnlessAllowed } from "@/lib/brand-access"
import { revalidatePath } from "next/cache"

export async function getBrandSettings(brandId: string) {
    // SECURITY: design settings (colours, fonts) are readable by members and, for brands with a
    // published brandbook, by its viewers; only members may create the default row or change anything.
    if (!(await canViewBrand(brandId))) return { error: BRAND_ACCESS_ERROR }
    const supabase = await createAdminClient()

    // First try to get existing settings
    const { data: settings, error } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('brand_id', brandId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching brand settings:', error)
        return { error: error.message }
    }

    // Get brand info (logo, favicon, description, name)
    const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('name, logo_url, favicon_url, description')
        .eq('id', brandId)
        .single()

    if (brandError) {
        console.error('Error fetching brand:', brandError)
    }

    // If no settings exist, create default ones
    if (!settings && !(await canAccessBrand(brandId))) {
        return { settings: null, brand }
    }
    if (!settings) {
        const { data: newSettings, error: createError } = await supabase
            .from('brand_settings')
            .insert({
                brand_id: brandId,
                visibility: 'visible',
                color_palette: ['#4F46E5', '#9333EA', '#EAB308', '#1E1B4B'],
                font_styles: {}, // Will rely on context defaults if empty
                menu_background: '#F4F4F4',
                highlights_bg: '#ffffff',
                highlights_text: '#0C56FF'
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating default settings:', createError)
            return { error: createError.message }
        }

        return { settings: newSettings, brand }
    }

    return { settings, brand }
}

export async function updateBrandSettings(brandId: string, field: string, value: any) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this brand
    const denied = await denyUnlessAllowed(() => assertBrandAccess(brandId))
    if (denied) return denied
    // `field` comes from the client: never let it rewrite the row's identity
    if (field === 'id' || field === 'brand_id') return { success: false, error: 'Field not allowed' }
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('brand_settings')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('brand_id', brandId)

    if (error) {
        console.error(`Error updating setting ${field}:`, error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/brand/${brandId}`)
    return { success: true }
}

export async function updateBrandInfo(brandId: string, field: string, value: any) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this brand
    const denied = await denyUnlessAllowed(() => assertBrandAccess(brandId))
    if (denied) return denied
    const supabase = await createAdminClient()

    // Fields allowed to be updated in brands table from settings
    const allowedFields = ['name', 'logo_url', 'favicon_url', 'description']
    if (!allowedFields.includes(field)) {
        return { success: false, error: 'Field not allowed' }
    }

    const { error } = await supabase
        .from('brands')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', brandId)

    if (error) {
        console.error(`Error updating brand info ${field}:`, error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/brand/${brandId}`)
    return { success: true }
}

export async function updateBrandColorPalette(brandId: string, palette: string[]) {
    return updateBrandSettings(brandId, 'color_palette', palette)
}

export async function updateBrandFontStyles(brandId: string, fontStyles: any) {
    return updateBrandSettings(brandId, 'font_styles', fontStyles)
}

export async function uploadBrandAsset(formData: FormData) {
    const supabase = await createAdminClient()
    const file = formData.get('file') as File
    const brandId = formData.get('brandId') as string
    const type = formData.get('type') as string // 'logo' or 'favicon'

    if (!file || !brandId || !type) {
        return { success: false, error: 'Missing required fields' }
    }

    // SECURITY: the admin client bypasses storage policies, so only members may upload
    const denied = await denyUnlessAllowed(() => assertBrandAccess(brandId))
    if (denied) return denied

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${brandId}/${type}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to 'assets' bucket (or 'public' if you prefer, but reusing assets is safe)
        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath)

        return { success: true, url: publicUrl }
    } catch (error) {
        console.error('Error uploading brand asset:', error)
        return { success: false, error: (error as Error).message }
    }
}
