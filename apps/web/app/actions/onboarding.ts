'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Ensure user exists in public.users (Backfill for pre-trigger users)
    const { data: dbUser } = await supabase.from('users').select('id').eq('id', user.id).single()
    if (!dbUser) {
        await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || 'User',
        })
    }

    const workspaceName = formData.get("workspaceName") as string
    const workspaceType = formData.get("workspaceType") as 'personal' | 'agency' | 'company'
    const brandName = formData.get("brandName") as string

    // Simple slug generation
    const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)

    // 1. Create Workspace
    const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
            name: workspaceName,
            slug: slug,
            type: workspaceType,
            created_by: user.id
        })
        .select()
        .single()

    if (wsError) {
        console.error("Workspace creation error:", wsError)
        throw new Error("Failed to create workspace")
    }

    // 2. Add user as owner in workspace_members
    const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner',
            accepted_at: new Date().toISOString()
        })

    if (memberError) {
        console.error("Member creation error:", memberError)
        // Cleanup might be needed here in production
        throw new Error("Failed to add member to workspace")
    }

    // 3. Create First Brand (if provided)
    if (brandName) {
        const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)
        const { error: brandError } = await supabase
            .from('brands')
            .insert({
                workspace_id: workspace.id,
                name: brandName,
                slug: brandSlug,
                status: 'active'
            })

        if (brandError) {
            console.error("Brand creation error:", brandError)
            // Continue anyway, it's optional
        }
    }

    // 4. Redirect
    redirect('/dashboard')
}
