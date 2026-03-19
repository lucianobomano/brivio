"use server"

import { createClient } from "@/lib/supabase/server"

export async function getJobs(filters?: { status?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from('jobs')
        .select(`
            *,
            brand:brands(name, logo_url)
        `)

    if (filters?.status && filters.status !== 'All') {
        query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching jobs:", error)
        return []
    }

    return data
}

export async function getJobById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('jobs')
        .select(`
            *,
            brand:brands(*),
            creator:users(*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error("Error fetching job:", error)
        return null
    }

    return data
}
