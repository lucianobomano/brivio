'use server'

/**
 * Team of the workspace: members, roles and invitations.
 * Reads go through the user's client (members can see each other). Changes need the service role
 * (workspace_members has no update/delete policies), so every change first checks that the signed-in user
 * is an owner or admin of the workspace.
 */

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminClient, createClient, getCurrentUser } from "@/lib/supabase/server"
import { getDefaultWorkspace } from "@/lib/workspace"

export type TeamRole = 'owner' | 'admin' | 'member' | 'client_viewer'
export type TeamMember = {
    id: string
    user_id: string
    role: TeamRole
    invited_at: string | null
    accepted_at: string | null
    name: string
    email: string
    avatar_url: string | null
}

const ASSIGNABLE: TeamRole[] = ['admin', 'member', 'client_viewer']
type Result<T = undefined> = { success: true, data?: T } | { success: false, error: string }
const fail = (error: string): { success: false, error: string } => ({ success: false, error })

async function context() {
    const user = await getCurrentUser()
    if (!user) return null
    const workspace = await getDefaultWorkspace()
    if (!workspace) return null
    const supabase = await createClient()
    const { data: me } = await supabase.from('workspace_members').select('role').eq('workspace_id', workspace.id).eq('user_id', user.id).maybeSingle()
    const role = (me?.role as TeamRole | undefined) || (workspace.created_by === user.id ? 'owner' : undefined)
    return { user, workspace, workspaceId: workspace.id as string, role, canManage: role === 'owner' || role === 'admin', supabase }
}

export async function getTeam() {
    const ctx = await context()
    if (!ctx) return null
    const { data: rows } = await ctx.supabase
        .from('workspace_members')
        .select('id, user_id, role, invited_at, accepted_at, user:users(name, email, avatar_url)')
        .eq('workspace_id', ctx.workspaceId)

    type Row = { id: string, user_id: string, role: TeamRole, invited_at: string | null, accepted_at: string | null, user: { name: string, email: string, avatar_url: string | null } | { name: string, email: string, avatar_url: string | null }[] | null }
    let members: TeamMember[] = ((rows || []) as Row[]).map(r => {
        const u = Array.isArray(r.user) ? r.user[0] : r.user
        return { id: r.id, user_id: r.user_id, role: r.role, invited_at: r.invited_at, accepted_at: r.accepted_at, name: u?.name || u?.email?.split('@')[0] || 'Sem nome', email: u?.email || '', avatar_url: u?.avatar_url || null }
    })

    // Invitations already used (the person signed in): mark them accepted
    const pending = members.filter(m => !m.accepted_at)
    if (pending.length) {
        const admin = await createAdminClient()
        const accepted: string[] = []
        await Promise.all(pending.map(async m => {
            const { data } = await admin.auth.admin.getUserById(m.user_id)
            if (data?.user?.last_sign_in_at) accepted.push(m.id)
        }))
        if (accepted.length) {
            const now = new Date().toISOString()
            await admin.from('workspace_members').update({ accepted_at: now }).in('id', accepted)
            members = members.map(m => accepted.includes(m.id) ? { ...m, accepted_at: now } : m)
        }
    }

    const order: Record<TeamRole, number> = { owner: 0, admin: 1, member: 2, client_viewer: 3 }
    members.sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name))
    return { workspaceName: ctx.workspace.name as string, me: ctx.user.id, myRole: ctx.role || 'member', canManage: ctx.canManage, members }
}

export async function inviteMember(input: { email: string, role: TeamRole }): Promise<Result<TeamMember>> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    if (!ctx.canManage) return fail('Só os proprietários e administradores podem convidar pessoas.')
    const email = String(input.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Escreve um email válido.')
    if (!ASSIGNABLE.includes(input.role)) return fail('Papel inválido.')
    if (input.role === 'admin' && ctx.role !== 'owner') return fail('Só o proprietário pode convidar administradores.')

    const admin = await createAdminClient()
    const { data: existing } = await admin.from('users').select('id, name, email, avatar_url').ilike('email', email).maybeSingle()

    let userId = existing?.id as string | undefined
    let name = existing?.name as string | undefined
    let avatar = (existing?.avatar_url as string | null | undefined) ?? null
    let invitedNew = false

    if (userId) {
        const { data: already } = await admin.from('workspace_members').select('id').eq('workspace_id', ctx.workspaceId).eq('user_id', userId).maybeSingle()
        if (already) return fail('Esta pessoa já faz parte da equipa.')
    } else {
        // No account yet: Supabase sends the invitation email (through the project's SMTP)
        const h = await headers()
        const origin = h.get('origin') || `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${origin}/auth/callback?next=/dashboard`,
            data: { invited_to_workspace: ctx.workspaceId, invited_by: ctx.user.id },
        })
        if (error || !data?.user) {
            console.error('[team] invite:', error)
            return fail(/rate limit/i.test(error?.message || '') ? 'Enviaste demasiados convites seguidos. Tenta dentro de alguns minutos.' : 'Não foi possível enviar o convite. Confirma o email e tenta de novo.')
        }
        userId = data.user.id
        name = email.split('@')[0]
        avatar = null
        invitedNew = true
    }

    const now = new Date().toISOString()
    const { data: row, error } = await admin
        .from('workspace_members')
        .insert({ workspace_id: ctx.workspaceId, user_id: userId, role: input.role, invited_at: now, accepted_at: invitedNew ? null : now })
        .select('id, user_id, role, invited_at, accepted_at')
        .single()
    if (error || !row) return fail('Não foi possível adicionar a pessoa à equipa.')
    revalidatePath('/team')
    return { success: true, data: { ...(row as Omit<TeamMember, 'name' | 'email' | 'avatar_url'>), name: name || email, email, avatar_url: avatar } }
}

async function memberOfWorkspace(memberId: string, workspaceId: string) {
    const admin = await createAdminClient()
    const { data } = await admin.from('workspace_members').select('id, user_id, role').eq('id', memberId).eq('workspace_id', workspaceId).maybeSingle()
    return { admin, member: data as { id: string, user_id: string, role: TeamRole } | null }
}

export async function updateMemberRole(memberId: string, role: TeamRole): Promise<Result> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    if (!ctx.canManage) return fail('Só os proprietários e administradores podem mudar papéis.')
    if (!ASSIGNABLE.includes(role)) return fail('Papel inválido.')
    if (role === 'admin' && ctx.role !== 'owner') return fail('Só o proprietário pode nomear administradores.')
    const { admin, member } = await memberOfWorkspace(memberId, ctx.workspaceId)
    if (!member) return fail('Membro não encontrado.')
    if (member.role === 'owner') return fail('O papel do proprietário não pode ser alterado.')
    if (member.role === 'admin' && ctx.role !== 'owner') return fail('Só o proprietário pode alterar um administrador.')
    const { error } = await admin.from('workspace_members').update({ role }).eq('id', memberId)
    if (error) return fail('Não foi possível mudar o papel.')
    revalidatePath('/team')
    return { success: true }
}

export async function removeMember(memberId: string): Promise<Result> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const { admin, member } = await memberOfWorkspace(memberId, ctx.workspaceId)
    if (!member) return fail('Membro não encontrado.')
    const leaving = member.user_id === ctx.user.id
    if (!leaving && !ctx.canManage) return fail('Só os proprietários e administradores podem remover pessoas.')
    if (member.role === 'owner') return fail('O proprietário não pode ser removido da equipa.')
    if (member.role === 'admin' && !leaving && ctx.role !== 'owner') return fail('Só o proprietário pode remover um administrador.')
    const { error } = await admin.from('workspace_members').delete().eq('id', memberId)
    if (error) return fail('Não foi possível remover a pessoa.')
    revalidatePath('/team')
    return { success: true }
}
