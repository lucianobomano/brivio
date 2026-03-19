"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface UserProfile {
    id: string
    name: string
    email: string
    avatar_url?: string
    bio?: string
    notification_preferences: {
        channels: { email: boolean; push: boolean; slack: boolean }
        events: { proposal_viewed: boolean; payment_received: boolean }
    }
}

export interface WorkspaceSettings {
    id: string
    name: string
    slug: string
    logo_url?: string
    logo_dark_url?: string
    favicon_url?: string
    primary_color?: string
    legal_name?: string
    tax_id?: string
    fiscal_address?: string
    website?: string
    default_currency: string
    language: string
    custom_domain?: string
    smtp_config?: any
}

// USER SETTINGS
export async function updateProfile(data: Partial<UserProfile>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const { error } = await supabase
        .from('users')
        .update({
            name: data.name,
            avatar_url: data.avatar_url,
            bio: data.bio,
            notification_preferences: data.notification_preferences,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
    return { success: true }
}

export async function updateSocialLinks(links: { platform: string; url: string }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const { error } = await supabase
        .from('creator_profiles')
        .update({
            social_links: links,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
}

// WORKSPACE SETTINGS
export async function updateWorkspaceSettings(workspaceId: string, data: Partial<WorkspaceSettings>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    // Verify membership/admin role could be added here
    const { data: updatedData, error } = await supabase
        .from('workspaces')
        .update({
            name: data.name,
            legal_name: data.legal_name,
            tax_id: data.tax_id,
            fiscal_address: data.fiscal_address,
            website: data.website,
            default_currency: data.default_currency,
            language: data.language,
            primary_color: data.primary_color,
            logo_url: data.logo_url,
            logo_dark_url: data.logo_dark_url,
            favicon_url: data.favicon_url,
            custom_domain: data.custom_domain,
            smtp_config: data.smtp_config
        })
        .eq('id', workspaceId)
        .select()

    if (error) {
        console.error("Error updating workspace:", error)
        return { success: false, error: error.message }
    }

    if (!updatedData || updatedData.length === 0) {
        console.error("No workspace updated. Check RLS or workspace ID.")
        return { success: false, error: "No changes saved. You might not have permission." }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function getWorkspaceData(workspaceId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()

    if (error) return null
    return data as WorkspaceSettings
}

export async function getUserData() {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

    if (error) return null
    return data as UserProfile
}

export async function searchDesigners(query: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5)

    if (error) {
        console.error("Search error:", error)
        return []
    }

    return data
}

export async function createWorkspaceWithSettings(data: {
    name: string,
    theme: 'light' | 'dark',
    members: { type: 'platform' | 'email', value: string }[]
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    // 1. Create Workspace
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)
    const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
            name: data.name,
            slug: slug,
            settings: { theme: data.theme },
            created_by: user.id
        })
        .select()
        .single()

    if (wsError) {
        console.error("Workspace creation error:", wsError)
        return { success: false, error: "Failed to create workspace" }
    }

    // 2. Add owner
    const { error: ownerError } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner',
            accepted_at: new Date().toISOString()
        })

    if (ownerError) {
        console.error("Owner creation error:", ownerError)
        return { success: false, error: "Failed to add owner" }
    }

    // 3. Invite members
    for (const member of data.members) {
        if (member.type === 'platform') {
            await supabase.from('workspace_members').insert({
                workspace_id: workspace.id,
                user_id: member.value,
                role: 'editor', // Default role for invited members
                status: 'pending'
            })
        } else {
            // Here you would typically send an email invitation
            // For now, we'll track it in an invitations table or similar if exists
            // Or just log it
            console.log(`Inviting ${member.value} via email`)
        }
    }

    revalidatePath('/dashboard')
    return { success: true, workspaceId: workspace.id }
}

export type WorkspaceMember = {
    id: string
    user_id: string
    role: 'owner' | 'admin' | 'editor' | 'member' | 'viewer'
    status: 'pending' | 'active' | 'inactive'
    invited_at: string
    joined_at?: string
    user: {
        id: string
        name: string
        email: string
        avatar_url?: string
    } | null
}

export async function getWorkspaceMembers(workspaceId: string) {
    const supabase = await createClient()

    // Check permissions could be done here or relied on RLS

    const { data, error } = await supabase
        .from('workspace_members')
        .select(`
            *,
            user:users!user_id (
                id,
                name,
                email,
                avatar_url
            )
        `)
        .eq('workspace_id', workspaceId)
        .order('invited_at', { ascending: false })

    if (error) {
        console.error("Error fetching members:", error)
        return []
    }

    return data as WorkspaceMember[]
}

export async function inviteMember(workspaceId: string, email: string, role: string) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { success: false, error: "Unauthorized" }

    // 1. Check if user exists in the system
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

    if (existingUser) {
        // User exists, add directly to workspace
        const { error } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspaceId,
                user_id: existingUser.id,
                role: role,
                status: 'pending', // Or active depending on policy
                invited_at: new Date().toISOString()
            })

        if (error) {
            if (error.code === '23505') return { success: false, error: "User is already a member" }
            return { success: false, error: error.message }
        }
    } else {
        // User doesn't exist. 
        // In a real scenario, we'd create a "pending_invites" record usually.
        // For now, we'll return an error saying user must be registered, 
        // OR we could create a placeholder user logic if the system supported it.
        return { success: false, error: "User not found. They must register first." }
    }

    revalidatePath('/')
    return { success: true }
}

export async function removeMember(memberId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    // RLS should handle permission checks (only admins/owners can delete)

    const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
}
