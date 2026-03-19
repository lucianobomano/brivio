"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Contract {
    id: string
    project_id: string
    name: string
    file_url: string
    status: 'draft' | 'pending' | 'signed' | 'expired'
    created_at: string
}

export async function getProjectContracts(projectId: string) {
    const supabase = await createClient()
    const { data: contracts, error } = await supabase
        .from('project_contracts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching project contracts:", error)
        return []
    }

    return contracts as Contract[]
}

export async function createProjectContract(projectId: string, data: { name: string; file_url: string; status?: Contract['status'] }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const { data: contract, error } = await supabase
        .from('project_contracts')
        .insert({
            project_id: projectId,
            name: data.name,
            file_url: data.file_url,
            status: data.status || 'draft'
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating project contract:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true, contract }
}

export async function updateContractStatus(contractId: string, status: Contract['status']) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_contracts')
        .update({ status })
        .eq('id', contractId)

    if (error) {
        console.error("Error updating contract status:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function deleteContract(contractId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_contracts')
        .delete()
        .eq('id', contractId)

    if (error) {
        console.error("Error deleting contract:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}
