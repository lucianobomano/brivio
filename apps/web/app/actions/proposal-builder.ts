"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createProposalModule(proposalId: string, type: string, order: number) {
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
            title: titles[type] || "Nova Seção",
            order: order,
            content_json: {}
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating proposal module:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/proposals/[id]/builder`)
    return { success: true, module }
}

export async function updateProposalModuleContent(moduleId: string, content: Record<string, any>, proposalId?: string) {
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

    if (proposalId) {
        revalidatePath(`/proposals/${proposalId}/builder`)
    }

    return { success: true }
}

export async function deleteProposalModule(moduleId: string, proposalId?: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('proposal_modules')
        .delete()
        .eq('id', moduleId)

    if (error) {
        console.error("Error deleting proposal module:", error)
        return { success: false, error: error.message }
    }

    if (proposalId) {
        revalidatePath(`/proposals/${proposalId}/builder`)
    }

    return { success: true }
}

export async function updateProposalModule(moduleId: string, updates: Record<string, any>, proposalId?: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('proposal_modules')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', moduleId)

    if (error) {
        console.error("Error updating proposal module:", error)
        return { success: false, error: error.message }
    }

    if (proposalId) {
        revalidatePath(`/proposals/${proposalId}/builder`)
    }

    return { success: true }
}

export async function duplicateProposalModule(moduleId: string, proposalId: string) {
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
            content_json: source.content_json,
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

    revalidatePath(`/proposals/${proposalId}/builder`)
    return { success: true, module: newModule }
}

export async function reorderProposalModules(items: { id: string, order: number }[]) {
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

    revalidatePath(`/proposals/[id]/builder`)
    return { success: true, modules: insertedModules }
}

export async function getProposalModules(proposalId: string) {
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
