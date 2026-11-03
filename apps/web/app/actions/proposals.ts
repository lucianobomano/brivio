"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { assertProposalAccess, assertBrandAccess, getUserWorkspaceIds, denyUnlessAllowed } from "@/lib/brand-access"
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

    // SECURITY: the admin client bypasses RLS, so the project (and brand, if set) must be the user's
    const deniedCreate = await denyUnlessAllowed(async () => {
        const { data: project } = await adminSupabase.from('projects').select('workspace_id').eq('id', data.project_id).maybeSingle()
        const workspaceIds = await getUserWorkspaceIds()
        if (!project?.workspace_id || !workspaceIds.includes(project.workspace_id)) throw new Error()
        if (brand_id) await assertBrandAccess(brand_id)
    })
    if (deniedCreate) return deniedCreate

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

    // SECURITY: the admin client bypasses RLS, so verify the user may edit this proposal
    const denied = await denyUnlessAllowed(() => assertProposalAccess(data.id))
    if (denied) return denied

    // Sanitize optional UUID fields
    const brand_id = data.brand_id === "" ? null : data.brand_id
    const template_id = data.template_id === "" ? null : data.template_id

    // SECURITY: and that a re-assigned brand is one of theirs too
    if (brand_id) {
        const deniedBrand = await denyUnlessAllowed(() => assertBrandAccess(brand_id))
        if (deniedBrand) return deniedBrand
    }

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
                    .select('name, content_json')
                    .eq('id', template_id)
                    .single()
                // A saved template fills its fields with this proposal's project and client
                const { data: named } = await adminSupabase.from('proposals').select('projects(name), brands(name)').eq('id', data.id).maybeSingle()

                const { getTemplateModules } = await import("../proposals/builder/utils")
                const defaultModules = getTemplateModules(data.id, template_id, templateData?.name, {
                    content: (templateData as any)?.content_json,
                    projectName: (named as any)?.projects?.name ?? null,
                    clientName: (named as any)?.brands?.name ?? null,
                })

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

type PricedItem = { price?: number | string | null, quantity?: number | string | null }
type ModuleWithBlocks = { type?: string | null, content_json?: { blocks?: { type?: string, content?: { items?: PricedItem[] } }[] } | null }

/**
 * What the proposal is worth: the services of «Editar proposta» (proposal_items) or, when there are none,
 * the price tables written in the editor; then the discount.
 */
export async function proposalTotal(p: { discount_value?: number | null, discount_type?: string | null }, items: PricedItem[] | null | undefined, modules: ModuleWithBlocks[] | null | undefined) {
    const sum = (list: PricedItem[]) => list.reduce((acc, i) => acc + (Number(i.price) || 0) * (i.quantity == null || i.quantity === '' ? 1 : Number(i.quantity) || 0), 0)
    let subtotal = items?.length ? sum(items) : 0
    if (!items?.length) {
        for (const m of modules || []) {
            for (const b of m.content_json?.blocks || []) {
                if (b.type === 'pricing-table' && Array.isArray(b.content?.items)) subtotal += sum(b.content!.items!)
            }
        }
    }
    const discount = Number(p.discount_value) || 0
    const total = p.discount_type === 'percent' ? subtotal * (1 - discount / 100) : subtotal - discount
    return Math.max(0, Math.round(total * 100) / 100)
}

function addBusinessDays(fromIso: string, days: number) {
    const d = new Date(fromIso)
    let left = days
    while (left > 0) {
        d.setUTCDate(d.getUTCDate() + 1)
        const wd = d.getUTCDay()
        if (wd !== 0 && wd !== 6) left--
    }
    return d.toISOString()
}

export type ProposalRow = {
    id: string
    project_id: string
    brand_id: string | null
    identifier: string
    status: string
    validity_days: number | null
    discount_value: number | null
    discount_type: string | null
    template_id: string | null
    created_at: string
    updated_at: string | null
    total: number
    expires_at: string | null
    brand_name: string | null
    [key: string]: unknown
}

export async function getProposalsByProject(projectId: string): Promise<ProposalRow[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('proposals')
        .select(`
            *,
            proposal_items (*),
            proposal_modules (type, content_json),
            brand:brands (name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Get proposals error:", error)
        return []
    }

    return Promise.all((data || []).map(async (row) => {
        const { proposal_modules, brand, ...rest } = row as typeof row & { proposal_modules?: ModuleWithBlocks[], brand?: { name?: string } | { name?: string }[] | null }
        const total = await proposalTotal(rest, rest.proposal_items, proposal_modules)
        // Valid for N business days (as the form says) from when it was created
        const expires_at = rest.validity_days && rest.validity_days > 0 ? addBusinessDays(rest.created_at, rest.validity_days) : null
        const b = Array.isArray(brand) ? brand[0] : brand
        return { ...rest, total, expires_at, brand_name: b?.name || null } as ProposalRow
    }))
}

/** Next free «PRyyyy-mm-nnnn» of the project's workspace (the sequence restarts every month) */
export async function getNextProposalIdentifier(projectId: string): Promise<string> {
    const now = new Date()
    const prefix = `PR${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`
    const fallback = `${prefix}0001`
    try {
        const supabase = await createClient()
        const { data: project } = await supabase.from('projects').select('workspace_id').eq('id', projectId).maybeSingle()
        if (!project?.workspace_id) return fallback
        const { data: rows } = await supabase
            .from('proposals')
            .select('identifier, project:projects!inner(workspace_id)')
            .eq('project.workspace_id', project.workspace_id)
            .like('identifier', `${prefix}%`)
        const max = (rows || []).reduce((acc, r) => {
            const n = parseInt(String(r.identifier).slice(prefix.length), 10)
            return Number.isFinite(n) && n > acc ? n : acc
        }, 0)
        return `${prefix}${String(max + 1).padStart(4, '0')}`
    } catch {
        return fallback
    }
}

const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'rejected'] as const

export async function setProposalStatus(proposalId: string, status: (typeof PROPOSAL_STATUSES)[number]) {
    if (!PROPOSAL_STATUSES.includes(status)) return { success: false, error: "Estado inválido" }
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this proposal
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return denied
    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase
        .from('proposals')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', proposalId)
    if (error) {
        console.error("Set proposal status error:", error)
        return { success: false, error: error.message }
    }
    revalidatePath('/projects')
    return { success: true }
}

export async function getProposalTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('proposal_templates')
        // The pages of saved templates stay on the server: the picker only needs to show them
        .select('id, name, preview_image, description, page_count, workspace_id, updated_at')
        .order('name', { ascending: true })

    if (error) {
        console.error("Get templates error:", error)
        return []
    }

    // The team's own templates first (newest first), then the built-in ones
    return [...(data || [])].sort((x: any, y: any) => (x.workspace_id ? 0 : 1) - (y.workspace_id ? 0 : 1) || (x.workspace_id ? String(y.updated_at || "").localeCompare(String(x.updated_at || "")) : 0))
}

export async function deleteProposal(proposalId: string) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return denied
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
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this data
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return denied
    const supabase = await createAdminClient()

    // 1. Fetch template details to get the name/slug
    const { data: template } = await supabase
        .from('proposal_templates')
        .select('name, content_json')
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
    const { data: named } = await supabase.from('proposals').select('projects(name), brands(name)').eq('id', proposalId).maybeSingle()
    const defaultModules = getTemplateModules(proposalId, templateId, template?.name, {
        content: (template as any)?.content_json,
        projectName: (named as any)?.projects?.name ?? null,
        clientName: (named as any)?.brands?.name ?? null,
    })

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
