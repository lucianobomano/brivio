"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getServices() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: profile } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!profile) return []

    const { data: services, error } = await supabase
        .from('services')
        .select(`
            *,
            projects:service_projects(
                project:projects(*)
            )
        `)
        .eq('creator_id', profile.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching services:", error)
        return []
    }

    return services || []
}

export async function addService(data: {
    title: string;
    description: string;
    price: string;
    delivery: string;
    image: string;
    cover_url?: string;
    project_ids?: string[];
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const { data: profile } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!profile) return { success: false, error: "Creator profile not found" }

    const { project_ids, ...serviceParams } = data

    const { data: newService, error } = await supabase
        .from('services')
        .insert({
            creator_id: profile.id,
            ...serviceParams
        })
        .select()
        .single()

    if (error) {
        console.error("Error adding service:", error)
        return { success: false, error: error.message }
    }

    if (project_ids && project_ids.length > 0) {
        const { error: projectError } = await supabase
            .from('service_projects')
            .insert(project_ids.map(pid => ({
                service_id: newService.id,
                project_id: pid
            })))

        if (projectError) {
            console.error("Error linking projects:", projectError)
        }
    }

    revalidatePath('/settings')
    revalidatePath(`/creators/${user.id}`)
    return { success: true }
}

export async function updateService(id: string, data: {
    title?: string;
    description?: string;
    price?: string;
    delivery?: string;
    image?: string;
    cover_url?: string;
    project_ids?: string[];
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const { project_ids, ...serviceParams } = data

    const { error } = await supabase
        .from('services')
        .update(serviceParams)
        .eq('id', id)

    if (error) {
        console.error("Error updating service:", error)
        return { success: false, error: error.message }
    }

    if (project_ids !== undefined) {
        // Simple strategy: delete and re-insert
        await supabase
            .from('service_projects')
            .delete()
            .eq('service_id', id)

        if (project_ids.length > 0) {
            await supabase
                .from('service_projects')
                .insert(project_ids.map(pid => ({
                    service_id: id,
                    project_id: pid
                })))
        }
    }

    revalidatePath('/settings')
    revalidatePath(`/creators/${user.id}`)
    return { success: true }
}

export async function deleteService(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error deleting service:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    revalidatePath(`/creators/${user.id}`)
    return { success: true }
}
