"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Billing {
    id: string
    project_id: string
    identifier: string
    amount: number
    currency: string
    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
    due_date: string
    issued_at: string
    file_url?: string
    proposal_id?: string
    proposal?: {
        identifier: string
    }
}

export async function getProjectBillings(projectId: string) {
    const supabase = await createClient()
    const { data: billings, error } = await supabase
        .from('project_billings')
        .select('*, proposal:proposals(identifier)')
        .eq('project_id', projectId)
        .order('issued_at', { ascending: false })

    if (error) {
        console.error("Error fetching project billings:", error)
        return []
    }

    return billings as Billing[]
}

export async function createProjectBilling(projectId: string, data: Partial<Billing>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const { data: billing, error } = await supabase
        .from('project_billings')
        .insert({
            project_id: projectId,
            identifier: data.identifier,
            amount: data.amount,
            currency: data.currency || 'EUR',
            status: data.status || 'pending',
            due_date: data.due_date,
            file_url: data.file_url,
            proposal_id: data.proposal_id,
            issued_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating project billing:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true, billing }
}

export async function updateBillingStatus(billingId: string, status: Billing['status']) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_billings')
        .update({ status })
        .eq('id', billingId)

    if (error) {
        console.error("Error updating billing status:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function deleteBilling(billingId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_billings')
        .delete()
        .eq('id', billingId)

    if (error) {
        console.error("Error deleting billing:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}
