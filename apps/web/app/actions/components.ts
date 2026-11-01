"use server"

import { prisma } from "@/lib/prisma"
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { BRAND_ACCESS_ERROR, canAccessBrand, isSuperAdmin } from "@/lib/brand-access"

export async function saveComponent(data: { name: string, content_json: any, is_public: boolean, brand_id?: string }) {
    // SECURITY: Prisma bypasses RLS; components are saved into a brand the user belongs to
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Unauthorized" }
    if (data.brand_id && !(await canAccessBrand(data.brand_id))) return { success: false, error: BRAND_ACCESS_ERROR }
    try {
        const component = await prisma.savedComponent.create({
            data: {
                name: data.name,
                content_json: data.content_json,
                is_public: data.is_public,
                brand_id: data.brand_id || null
            }
        })

        return { success: true, component }
    } catch (error) {
        console.error("Failed to save component:", error)
        return { success: false, error: "Falha ao salvar componente" }
    }
}

export async function getComponents(brand_id: string) {
    try {
        // PERFORMANCE: one Supabase round-trip instead of Prisma; admin client keeps Prisma's access level.
        // brand_id goes into a PostgREST or() filter string, so only accept a UUID.
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brand_id || "")
        // A brand's private components are for its members; everyone else sees only public ones
        const ownBrand = isUuid && await canAccessBrand(brand_id)
        const supabase = await createAdminClient()
        let query = supabase.from('saved_components').select('*')
        query = ownBrand ? query.or(`is_public.eq.true,brand_id.eq.${brand_id}`) : query.eq('is_public', true)
        const { data: components, error } = await query.order('created_at', { ascending: false })
        if (error) throw error

        return { success: true, components: components || [] }
    } catch (error) {
        console.error("Failed to fetch components:", error)
        return { success: false, error: "Falha ao buscar componentes" }
    }
}

// ---------- Ready-made templates edited by superadmins ----------
// An edited template is stored as a saved component that no brand sees in its own list (no brand, not
// public), named "__preset__:<template id>". The library reads them for everyone and shows the edited
// version in place of the built-in one; only superadmins can write or remove them.

const PRESET_PREFIX = '__preset__:'

export interface PresetOverride {
    presetId: string
    name: string
    description?: string
    kind: 'section' | 'column' | 'block'
    data: unknown
    updatedAt?: string
}

export async function getPresetOverrides(): Promise<{ success: boolean, overrides: PresetOverride[] }> {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('saved_components')
            .select('name, content_json, created_at')
            .is('brand_id', null)
            .like('name', `${PRESET_PREFIX}%`)
        if (error) throw error
        const overrides = (data || []).map((row: { name: string, content_json: Omit<PresetOverride, 'presetId'>, created_at: string }) => ({
            ...row.content_json,
            presetId: row.name.slice(PRESET_PREFIX.length),
            updatedAt: row.created_at,
        }))
        return { success: true, overrides }
    } catch (error) {
        console.error("Failed to fetch template overrides:", error)
        return { success: false, overrides: [] }
    }
}

export async function savePresetOverride(override: PresetOverride) {
    // SECURITY: only platform superadmins rewrite the ready-made templates everyone sees
    if (!(await isSuperAdmin())) return { success: false, error: "Apenas superadministradores podem editar templates" }
    if (!/^[a-z0-9-]+$/i.test(override.presetId || '')) return { success: false, error: "Template inválido" }
    try {
        const supabase = await createAdminClient()
        const name = `${PRESET_PREFIX}${override.presetId}`
        const { error: delError } = await supabase.from('saved_components').delete().is('brand_id', null).eq('name', name)
        if (delError) throw delError
        const { error } = await supabase.from('saved_components').insert({
            name,
            brand_id: null,
            is_public: false,
            content_json: { name: override.name, description: override.description || '', kind: override.kind, data: override.data },
        })
        if (error) throw error
        return { success: true }
    } catch (error) {
        console.error("Failed to save template override:", error)
        return { success: false, error: "Falha ao guardar o template" }
    }
}

export async function resetPresetOverride(presetIds: string | string[]) {
    if (!(await isSuperAdmin())) return { success: false, error: "Apenas superadministradores podem editar templates" }
    try {
        const supabase = await createAdminClient()
        const names = (Array.isArray(presetIds) ? presetIds : [presetIds]).filter(id => /^[a-z0-9-]+$/i.test(id)).map(id => `${PRESET_PREFIX}${id}`)
        const { error } = await supabase.from('saved_components').delete().is('brand_id', null).in('name', names)
        if (error) throw error
        return { success: true }
    } catch (error) {
        console.error("Failed to reset template:", error)
        return { success: false, error: "Falha ao repor o template" }
    }
}
