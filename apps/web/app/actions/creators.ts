"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCreators(filters?: { category?: string, type?: string, country?: string }) {
    const supabase = await createAdminClient()

    // Fetch from users table primarily
    let query = supabase
        .from('users')
        .select(`
            *,
            profile:creator_profiles(*)
        `)
        .eq('role_global', 'designer')

    // Note: Since category/type/country are in creator_profiles, we filter on the joined table
    if (filters?.category && filters.category !== 'All') {
        query = query.eq('profile.category', filters.category)
    }
    if (filters?.type && filters.type !== 'All') {
        query = query.eq('profile.type', filters.type)
    }
    if (filters?.country && filters.country !== 'All') {
        query = query.eq('profile.country', filters.country)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching creators:", error)
        return []
    }

    if (!data) return []

    // Map to a consistent structure where 'user' is the primary object
    return data.map(item => {
        const userObj = Array.isArray(item) ? item[0] : item;
        const profileObj = Array.isArray(item.profile) ? item.profile[0] : item.profile;

        return {
            ...profileObj,
            user: userObj
        };
    })
}

export async function getCreatorById(id: string) {
    // Public fetching uses Admin Client to safely bypass RLS on users table
    const supabase = await createAdminClient()

    // First try to get the creator profile
    const { data: creatorProfile, error: profileError } = await supabase
        .from('creator_profiles')
        .select(`
            *,
            user:users(*),
            social_links(*)
        `)
        .eq('user_id', id)
        .maybeSingle()

    if (profileError) {
        console.error("Error fetching creator profile:", profileError)
    }

    // Fetch projects separately as they are linked to User.id, not CreatorProfile.id
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', id)

    if (projectsError) {
        console.error("Error fetching projects:", projectsError)
    }

    // Fetch services if creator profile exists
    let services = []
    if (creatorProfile) {
        const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select(`
                *,
                projects:service_projects(
                    project:projects(id, name, cover_url)
                )
            `)
            .eq('creator_id', creatorProfile.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (servicesError) {
            console.error("Error fetching services:", servicesError)
        } else {
            services = servicesData || []
        }
    }

    // If creator profile exists, combine and return it
    if (creatorProfile) {
        // Normalize user data if it's returned as an array
        const normalizedUser = Array.isArray(creatorProfile.user)
            ? creatorProfile.user[0]
            : creatorProfile.user;

        return {
            ...creatorProfile,
            user: normalizedUser,
            projects: projects || [],
            services: services
        }
    }

    // If no creator profile, try to get basic user data
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

    if (userError || !userData) {
        console.error("Error fetching user:", userError)
        return null
    }

    // Return a minimal creator-like structure from user data
    return {
        user_id: userData.id,
        user: userData,
        category: userData.category || "Creativo",
        type: userData.profile_type || "Individual",
        country: userData.country || "Global",
        location: userData.state ? `${userData.state}, ${userData.country}` : userData.country || "Earth",
        website: userData.website || null,
        about: userData.about || userData.bio || null,
        expertise: userData.expertise || [],
        tools: [],
        languages: [],
        experience: [],
        education: [],
        works_count: 0,
        soty_count: 0,
        sotm_count: 0,
        sotd_count: 0,
        social_links: [],
        projects: projects || [],
        services: []
    }
}

export async function followCreator(followingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .single()

    if (existingFollow) {
        await supabase.from('follows').delete().eq('id', existingFollow.id)
    } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: followingId })
    }

    revalidatePath(`/creators/${followingId}`)
    return { success: true }
}
