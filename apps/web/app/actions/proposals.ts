"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ProposalItem = {
    id?: string
    name: string
    quantity: number
    price: number
}

export type ProposalData = {
    id?: string
    project_id: string
    brand_id?: string
    identifier: string
    status?: string
    cover_image?: string
    objective?: string
    presentation?: string
    validity_days?: number
    immediate_availability?: boolean
    duration_value?: string
    duration_unit?: string
    billing_type?: string
    discount_value?: number
    discount_type?: string
    observations?: string
    template_id?: string
    payment_methods?: string[]
    items: ProposalItem[]
}

export async function createProposal(data: ProposalData) {
    const adminSupabase = await createAdminClient()
    const { data: { user } } = await (await createClient()).auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    // Sanitize optional UUID fields
    const brand_id = data.brand_id === "" ? null : data.brand_id
    const template_id = data.template_id === "" ? null : data.template_id

    // 1. Insert the main proposal
    const { data: proposal, error: proposalError } = await adminSupabase
        .from('proposals')
        .insert({
            project_id: data.project_id,
            brand_id,
            identifier: data.identifier,
            status: data.status || 'draft',
            cover_image: data.cover_image,
            objective: data.objective,
            presentation: data.presentation,
            validity_days: data.validity_days,
            immediate_availability: data.immediate_availability,
            duration_value: data.duration_value,
            duration_unit: data.duration_unit,
            billing_type: data.billing_type,
            discount_value: data.discount_value,
            discount_type: data.discount_type,
            observations: data.observations,
            template_id,
            payment_methods: data.payment_methods
        })
        .select()
        .single()

    if (proposalError) {
        console.error("Create proposal error:", proposalError)
        return { success: false, error: proposalError.message }
    }

    // 2. Insert line items
    if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
            proposal_id: proposal.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        }))

        const { error: itemsError } = await adminSupabase
            .from('proposal_items')
            .insert(itemsToInsert)

        if (itemsError) {
            console.error("Create proposal items error:", itemsError)
            return { success: false, error: "Proposal created but failed to add items" }
        }
    }

    revalidatePath('/projects')
    return { success: true, proposalId: proposal.id }
}

export async function updateProposal(data: ProposalData) {
    if (!data.id) return { success: false, error: "Proposal ID is required" }

    const adminSupabase = await createAdminClient()
    const { data: { user } } = await (await createClient()).auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    // Sanitize optional UUID fields
    const brand_id = data.brand_id === "" ? null : data.brand_id
    const template_id = data.template_id === "" ? null : data.template_id

    // 1. Update the main proposal
    const { data: previousProposal } = await adminSupabase
        .from('proposals')
        .select('template_id')
        .eq('id', data.id)
        .single()

    const { error: proposalError } = await adminSupabase
        .from('proposals')
        .update({
            brand_id,
            identifier: data.identifier,
            status: data.status,
            cover_image: data.cover_image,
            objective: data.objective,
            presentation: data.presentation,
            validity_days: data.validity_days,
            immediate_availability: data.immediate_availability,
            duration_value: data.duration_value,
            duration_unit: data.duration_unit,
            billing_type: data.billing_type,
            discount_value: data.discount_value,
            discount_type: data.discount_type,
            observations: data.observations,
            template_id,
            payment_methods: data.payment_methods,
            updated_at: new Date().toISOString()
        })
        .eq('id', data.id)

    if (proposalError) {
        console.error("Update proposal error:", proposalError)
        return { success: false, error: proposalError.message }
    }

    // New logic: If template_id changed or was set, and there are NO modules (or only empty ones), seed them.
    if (template_id) {
        const { data: existingModules } = await adminSupabase
            .from('proposal_modules')
            .select('id, content_json')
            .eq('proposal_id', data.id)

        const isEffectivelyEmpty = !existingModules || existingModules.length === 0 ||
            existingModules.every(m => !m.content_json?.blocks || m.content_json.blocks.length === 0);

        // If template changed OR empty modules, and we have a template set
        if (isEffectivelyEmpty || (previousProposal?.template_id && previousProposal.template_id !== template_id)) {
            // If it's a NEW template, we clear the old "empty" or previous template modules
            if (isEffectivelyEmpty || previousProposal?.template_id !== template_id) {
                await adminSupabase.from('proposal_modules').delete().eq('proposal_id', data.id)

                const { data: templateData } = await adminSupabase
                    .from('proposal_templates')
                    .select('name')
                    .eq('id', template_id)
                    .single()

                const { getTemplateModules } = await import("../proposals/builder/utils")
                const defaultModules = getTemplateModules(data.id, template_id, templateData?.name)

                await adminSupabase.from('proposal_modules').insert(defaultModules)
            }
        }
    }

    // 2. Refresh items
    await adminSupabase.from('proposal_items').delete().eq('proposal_id', data.id)

    if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
            proposal_id: data.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        }))

        const { error: itemsError } = await adminSupabase
            .from('proposal_items')
            .insert(itemsToInsert)

        if (itemsError) {
            console.error("Update proposal items error:", itemsError)
        }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function getProposalsByProject(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('proposals')
        .select(`
            *,
            proposal_items (*),
            proposal_templates (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Get proposals error:", error)
        return []
    }

    return data || []
}

export async function getProposalTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error("Get templates error:", error)
        return []
    }

    return data || []
}

export async function deleteProposal(proposalId: string) {
    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase
        .from('proposals')
        .delete()
        .eq('id', proposalId)

    if (error) {
        console.error("Delete proposal error:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function saveProposalTemplate(proposalId: string, templateId: string) {
    const supabase = await createAdminClient()

    // 1. Fetch template details to get the name/slug
    const { data: template } = await supabase
        .from('proposal_templates')
        .select('name')
        .eq('id', templateId)
        .single()

    // 2. Update proposal with selected template
    const { error: updateError } = await supabase
        .from('proposals')
        .update({ template_id: templateId })
        .eq('id', proposalId)

    if (updateError) {
        console.error("Error updating proposal template:", updateError)
        return { success: false, error: updateError.message }
    }

    // 3. Clear existing modules for this proposal to allow clean re-seed
    await supabase.from('proposal_modules').delete().eq('proposal_id', proposalId)

    // 4. Seed new modules
    const { getTemplateModules } = await import("../proposals/builder/utils")
    const defaultModules = getTemplateModules(proposalId, templateId, template?.name)

    const { error: insertError } = await supabase
        .from('proposal_modules')
        .insert(defaultModules)

    if (insertError) {
        console.error("Error seeding modules:", insertError)
    }

    revalidatePath(`/proposals/${proposalId}/builder`)
    revalidatePath(`/proposals/${proposalId}/view`)
    return { success: true }
}
