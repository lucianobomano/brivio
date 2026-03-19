"use server"

import { createClient } from "@/lib/supabase/server"

export async function getSettingsData() {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return null

    // Fetch user and creator profile info
    const { data: userData, error } = await supabase
        .from('users')
        .select(`
            *,
            creator_profile:creator_profiles(
                *,
                social_links(*)
            )
        `)
        .eq('id', authUser.id)
        .single()

    console.log("Settings Data Fetch:", {
        userData,
        error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
        authUserId: authUser.id,
        creatorProfile: userData?.creator_profile
    })

    if (error) {
        console.error("Settings fetch error:", error)
    }

    if (!userData) return null

    // Get user's published projects for service association
    const { data: userProjects } = await supabase
        .from('projects')
        .select('id, name, cover_url')
        .eq('created_by', authUser.id)
        .order('created_at', { ascending: false })

    // Get current workspace (the one created by user or first membership)
    let workspace = null

    // First try to find workspace created by this user
    const { data: createdWorkspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', authUser.id)
        .limit(1)
        .single()

    workspace = createdWorkspace

    if (!workspace) {
        const { data: memberData } = await supabase
            .from('workspace_members')
            .select('workspace:workspaces(*)')
            .eq('user_id', authUser.id)
            .limit(1)
            .single()

        workspace = memberData?.workspace || null
    }

    // Get services
    let services = []
    if (userData.creator_profile) {
        const { data: servicesData } = await supabase
            .from('services')
            .select(`
                *,
                projects:service_projects(
                    project:projects(id, name, cover_url)
                )
            `)
            .eq('creator_id', userData.creator_profile.id)
            .order('created_at', { ascending: false })

        services = servicesData || []
    }

    return {
        user: userData,
        creatorProfile: userData.creator_profile,
        workspace,
        services,
        userProjects: userProjects || []
    }
}
