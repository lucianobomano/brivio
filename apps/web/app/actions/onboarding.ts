'use server'

import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { safeNext } from "@/lib/auth-helpers"

const WORKSPACE_TYPES = ['personal', 'agency', 'company'] as const
type WorkspaceType = typeof WORKSPACE_TYPES[number]

/** URL-safe slug with a short random suffix (accents dropped) */
const slugify = (text: string) =>
    (text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'workspace')
    + '-' + Math.random().toString(36).slice(2, 7)

/**
 * First visit after signing up: the user's workspace (and, optionally, their first brand).
 * Safe to call twice: a user who already belongs to a workspace keeps it.
 */
export async function completeOnboarding(formData: FormData): Promise<{ error: string } | void> {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const supabase = await createClient()
    const workspaceName = String(formData.get("workspaceName") || "").trim().slice(0, 80)
    const rawType = String(formData.get("workspaceType") || "personal")
    const workspaceType: WorkspaceType = (WORKSPACE_TYPES as readonly string[]).includes(rawType) ? rawType as WorkspaceType : 'personal'
    const brandName = String(formData.get("brandName") || "").trim().slice(0, 80)
    const next = safeNext(String(formData.get("next") || ""))

    if (!workspaceName) return { error: 'Dá um nome ao teu espaço de trabalho.' }

    // Profile row (created by the sign-up trigger; backfilled here for older accounts)
    const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
    if (!profile) {
        await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilizador',
        })
    }

    // Already has a workspace (double submit, back button): keep it
    const { data: existing } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle()
    let workspaceId = existing?.workspace_id as string | undefined

    if (!workspaceId) {
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({ name: workspaceName, slug: slugify(workspaceName), type: workspaceType, created_by: user.id })
            .select('id')
            .single()
        if (wsError || !workspace) {
            console.error("[onboarding] workspace:", wsError)
            return { error: 'Não foi possível criar o espaço de trabalho. Tenta de novo.' }
        }
        workspaceId = workspace.id

        const { error: memberError } = await supabase
            .from('workspace_members')
            .insert({ workspace_id: workspaceId, user_id: user.id, role: 'owner', accepted_at: new Date().toISOString() })
        if (memberError) {
            console.error("[onboarding] membership:", memberError)
            return { error: 'Não foi possível concluir a configuração. Tenta de novo.' }
        }
    }

    // First brand (optional)
    if (brandName) {
        const { error: brandError } = await supabase
            .from('brands')
            .insert({ workspace_id: workspaceId, name: brandName, slug: slugify(brandName), status: 'active' })
        if (brandError) console.error("[onboarding] brand:", brandError)
    }

    revalidatePath('/', 'layout')
    redirect(next)
}
