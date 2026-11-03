"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { assertProposalAccess, assertProposalModulesAccess, denyUnlessAllowed } from "@/lib/brand-access"
// No revalidatePath here: the builder, the preview and the client page are all dynamic (read on every visit), and
// revalidating made every click in the builder re-render the whole builder page on the server (~1s per request).

export async function createProposalModule(proposalId: string, type: string, order: number) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return denied
    const supabase = await createAdminClient()

    const titles: Record<string, string> = {
        intro: "Introdução",
        pricing: "Investimento & Condições",
        timeline: "Cronograma",
        case_study: "Case de Estudo",
        custom: "Seção Personalizada"
    }

    const { data: module, error } = await supabase
        .from('proposal_modules')
        .insert({
            proposal_id: proposalId,
            type: type,
            title: titles[type] || "Nova página",
            order: order,
            content_json: {}
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating proposal module:", error)
        return { success: false, error: error.message }
    }

    return { success: true, module }
}

/** Several pages deleted in one request (the builder groups deletes made in a row) */
export async function deleteProposalModules(proposalId: string, ids: string[]) {
    if (!ids.length) return { success: true }
    // SECURITY: the admin client bypasses RLS, so verify the user may act on these pages
    const denied = await denyUnlessAllowed(() => assertProposalModulesAccess(ids))
    if (denied) return denied
    const supabase = await createAdminClient()
    const { error } = await supabase.from('proposal_modules').delete().in('id', ids).eq('proposal_id', proposalId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

/** Several page titles in one request (the builder renumbers «03. O Desafio» after a page is added, moved or removed) */
export async function renameProposalModules(proposalId: string, items: { id: string, title: string }[]) {
    if (!items.length) return { success: true }
    // SECURITY: the admin client bypasses RLS, so verify the user may act on these pages
    const denied = await denyUnlessAllowed(() => assertProposalModulesAccess(items.map(i => i.id)))
    if (denied) return denied
    const supabase = await createAdminClient()
    const results = await Promise.all(items.map(i =>
        supabase.from('proposal_modules').update({ title: String(i.title).slice(0, 120), updated_at: new Date().toISOString() }).eq('id', i.id).eq('proposal_id', proposalId)
    ))
    const failed = results.find(r => r.error)
    if (failed?.error) return { success: false, error: failed.error.message }
    return { success: true }
}

/** A page made from a ready-made component (the builder's «Componentes» library) */
export async function createProposalModuleWithContent(
    proposalId: string,
    page: { type: string, title: string, content_json: Record<string, unknown> },
    order: number,
) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return denied
    const allowedTypes = ['intro', 'text', 'timeline', 'pricing', 'signature', 'custom']
    const supabase = await createAdminClient()

    const { data: module, error } = await supabase
        .from('proposal_modules')
        .insert({
            proposal_id: proposalId,
            type: allowedTypes.includes(page.type) ? page.type : 'custom',
            title: String(page.title || 'Nova página').slice(0, 120),
            order,
            content_json: page.content_json || {},
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating proposal module from component:", error)
        return { success: false, error: error.message }
    }

    return { success: true, module }
}

export async function updateProposalModuleContent(moduleId: string, content: Record<string, any>, proposalId?: string) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalModulesAccess([moduleId]))
    if (denied) return denied
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('proposal_modules')
        .update({
            content_json: content,
            updated_at: new Date().toISOString()
        })
        .eq('id', moduleId)

    if (error) {
        console.error("Error updating proposal module content:", error)
        return { success: false, error: error.message }
    }


    return { success: true }
}

export async function deleteProposalModule(moduleId: string, proposalId?: string) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalModulesAccess([moduleId]))
    if (denied) return denied
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('proposal_modules')
        .delete()
        .eq('id', moduleId)

    if (error) {
        console.error("Error deleting proposal module:", error)
        return { success: false, error: error.message }
    }


    return { success: true }
}

export async function updateProposalModule(moduleId: string, updates: Record<string, any>, proposalId?: string) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalModulesAccess([moduleId]))
    if (denied) return denied
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('proposal_modules')
        .update({
            // SECURITY: `updates` comes from the client; never let it move the section to another proposal
            ...Object.fromEntries(Object.entries(updates || {}).filter(([key]) => key !== 'id' && key !== 'proposal_id')),
            updated_at: new Date().toISOString()
        })
        .eq('id', moduleId)

    if (error) {
        console.error("Error updating proposal module:", error)
        return { success: false, error: error.message }
    }


    return { success: true }
}

/** A copy of a page's content where every block, section and column has a new id (the copy never shares ids
 *  with the original, so selecting a section on one page never opens it on the other) */
function withNewIds<T>(content: T): T {
    const fresh = () => Math.random().toString(36).slice(2, 11)
    const walk = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(walk)
        if (value && typeof value === "object") {
            const o: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(value)) o[k] = k === "id" && typeof v === "string" ? fresh() : walk(v)
            return o
        }
        return value
    }
    return walk(content) as T
}

export async function duplicateProposalModule(moduleId: string, proposalId: string) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalModulesAccess([moduleId]))
    if (denied) return denied
    const supabase = await createAdminClient()

    // Get source module
    const { data: source, error: fetchError } = await supabase
        .from('proposal_modules')
        .select('*')
        .eq('id', moduleId)
        .single()

    if (fetchError || !source) {
        return { success: false, error: "Module not found" }
    }

    // Get max order
    const { data: maxOrderData } = await supabase
        .from('proposal_modules')
        .select('order')
        .eq('proposal_id', proposalId)
        .order('order', { ascending: false })
        .limit(1)

    const nextOrder = (maxOrderData?.[0]?.order ?? source.order) + 1

    const { data: newModule, error: insertError } = await supabase
        .from('proposal_modules')
        .insert({
            proposal_id: proposalId,
            type: source.type,
            title: `${source.title} (Copy)`,
            content_json: withNewIds(source.content_json),
            order: nextOrder,
            is_hidden: source.is_hidden,
            is_locked: source.is_locked
        })
        .select()
        .single()

    if (insertError) {
        console.error("Error duplicating proposal module:", insertError)
        return { success: false, error: insertError.message }
    }

    return { success: true, module: newModule }
}

export async function reorderProposalModules(items: { id: string, order: number }[]) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalModulesAccess(items.map(item => item.id)))
    if (denied) return denied
    const supabase = await createAdminClient()

    const updates = items.map(item =>
        supabase
            .from('proposal_modules')
            .update({ order: item.order })
            .eq('id', item.id)
    )

    await Promise.all(updates)

    return { success: true }
}

export async function addProposalPages(proposalId: string, pageTitles: string[]) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return denied
    const supabase = await createAdminClient()

    // Get current max order
    const { data: existingModules } = await supabase
        .from('proposal_modules')
        .select('order')
        .eq('proposal_id', proposalId)
        .order('order', { ascending: false })
        .limit(1)

    const maxOrder = existingModules?.[0]?.order ?? -1

    const modulesData = pageTitles.map((title, index) => ({
        proposal_id: proposalId,
        title: title,
        type: 'custom',
        order: maxOrder + 1 + index,
        content_json: {}
    }))

    const { data: insertedModules, error } = await supabase
        .from('proposal_modules')
        .insert(modulesData)
        .select()

    if (error) {
        console.error("Error adding proposal pages:", error)
        return { success: false, error: error.message }
    }

    return { success: true, modules: insertedModules }
}

export async function getProposalModules(proposalId: string) {
    // SECURITY: the admin client bypasses RLS; proposal sections are for the proposal's team only
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return []
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('proposal_modules')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('order', { ascending: true })

    if (error) {
        console.error("Error fetching proposal modules:", error)
        return []
    }

    return data || []
}
