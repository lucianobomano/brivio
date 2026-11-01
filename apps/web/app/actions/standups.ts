"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { ACCESS_ERROR, canAccessStandup, canAccessStandupTeam, canAccessWorkspace, getUserWorkspaceIds } from "@/lib/brand-access"

// standup_team_members.user_id references auth.users (not public.users), so PostgREST can't embed
// the profile; load the public.users rows for the given ids in one extra query instead.
async function getUsersByIds(supabase: any, ids: string[]): Promise<Map<string, any>> {
    const unique = [...new Set(ids.filter(Boolean))]
    if (unique.length === 0) return new Map()
    const { data, error } = await supabase.from('users').select('*').in('id', unique)
    if (error) throw error
    return new Map((data || []).map((u: any) => [u.id, u]))
}

export async function getWorkspaceTeams(workspaceId: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }
    // SECURITY: reads use the admin client, so the caller must belong to the workspace
    if (!(await canAccessWorkspace(workspaceId))) return { success: false, error: ACCESS_ERROR }

    try {
        // Fetch teams in the workspace
        // PERFORMANCE: Supabase (one HTTP round-trip) instead of Prisma; admin client keeps Prisma's access level
        const supabase = await createAdminClient()
        const { data: teams, error } = await supabase
            .from('standup_teams')
            .select('id, name, members:standup_team_members(*)')
            .eq('workspace_id', workspaceId)

        if (error) throw error

        return {
            success: true,
            teams: (teams || []).map(t => ({
                id: t.id,
                name: t.name,
                members: t.members, // Added members to match usage map in modal
                memberCount: t.members?.length || 0
            }))
        }
    } catch (e) {
        console.error("Error fetching teams:", e)
        return { success: false, error: "Failed to fetch teams" }
    }
}

export async function getWorkspaceMembers(workspaceId: string) {
    const user = await getCurrentUser()
    if (!user) return []
    if (!(await canAccessWorkspace(workspaceId))) return []

    try {
        const supabase = await createAdminClient()
        const { data: members, error } = await supabase
            .from('workspace_members')
            .select('user:users(id, name, avatar_url)')
            .eq('workspace_id', workspaceId)

        if (error) throw error

        return (members || [])
            .map((m: any) => (Array.isArray(m.user) ? m.user[0] : m.user))
            .filter((u: any) => u)
            .map((u: any) => ({
                id: u.id,
                name: u.name,
                avatar_url: u.avatar_url
            }))
    } catch (e) {
        console.error("Error fetching members:", e)
        return []
    }
}

export async function createStandupTeam(data: { name: string, leaderId: string, memberIds: string[], workspaceId: string }) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }
    if (!(await canAccessWorkspace(data.workspaceId))) return { success: false, error: ACCESS_ERROR }

    if (!(prisma as any).standupTeam) {
        return { success: false, error: "Server restart required (Prisma)" }
    }

    try {
        const newTeam = await prisma.standupTeam.create({
            data: {
                name: data.name,
                leader_id: data.leaderId,
                workspace_id: data.workspaceId,
                members: {
                    create: data.memberIds.map(uid => ({
                        user_id: uid
                    }))
                }
            }
        })

        revalidatePath('/standups')
        return { success: true, team: newTeam }
    } catch (error: any) {
        console.error("Error creating team:", error)
        return { success: false, error: error.message || "Failed to create team" }
    }
}

// Update interface check will be ignored by Prisma, but using (prisma as any) allows it.
export async function createStandup(data: {
    teamId: string,
    name: string,
    frequency: string,
    reminderTime: string,
    days: string[],
    questions: string[],
    targetAudience: "leader" | "all",
    coverUrl?: string // Add new optional param
}) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }
    if (!(await canAccessStandupTeam(data.teamId))) return { success: false, error: ACCESS_ERROR }

    if (!(prisma as any).standup) {
        return { success: false, error: "Server restart required (Prisma)" }
    }

    try {
        const created = await prisma.standup.create({
            data: {
                team_id: data.teamId,
                name: data.name,
                frequency: data.frequency,
                reminder_time: data.reminderTime,
                schedule_days: data.days,
                questions: data.questions as any,
                target_audience: data.targetAudience,
                target_audience: data.targetAudience,
                // cover_url: data.coverUrl, // Temporarily removed to allow raw update
                created_by: user.id
            }
        })

        // Manual update for cover_url until Prisma Client is regenerated
        if (data.coverUrl) {
            await prisma.$executeRaw`
                UPDATE standups 
                SET cover_url = ${data.coverUrl} 
                WHERE id = ${created.id}::uuid
            `
        }
        revalidatePath('/standups')
        return { success: true, id: created.id }
    } catch (error) {
        console.error("Error creating standup:", error)
        return { success: false, error: "Failed to create standup" }
    }
}

export async function getStandups(workspaceId: string | undefined) {
    const user = await getCurrentUser()
    if (!user) return []

    try {
        // PERFORMANCE: one Supabase query (teams + members + standups incl. cover_url) replaces two
        // sequential Prisma queries, one of which read cover_url for every standup in the database
        const supabase = await createAdminClient()
        let query = supabase
            .from('standup_teams')
            .select('id, name, members:standup_team_members(user_id), standups(id, name, cover_url)')
        // SECURITY: without a workspace this used to return the teams of every workspace
        if (workspaceId) {
            if (!(await canAccessWorkspace(workspaceId))) return []
            query = query.eq('workspace_id', workspaceId)
        } else {
            const workspaceIds = await getUserWorkspaceIds()
            if (workspaceIds.length === 0) return []
            query = query.in('workspace_id', workspaceIds)
        }

        const { data: teams, error } = await query
        if (error) throw error

        const usersById = await getUsersByIds(supabase, (teams || []).flatMap((t: any) => (t.members || []).map((m: any) => m.user_id)))
        for (const team of (teams || []) as any[]) {
            team.members = (team.members || []).map((m: any) => ({ ...m, user: usersById.get(m.user_id) }))
        }

        // Flatten
        const result = []
        for (const team of (teams || []) as any[]) {
            for (const standup of team.standups || []) {
                // Determine gradient...
                const gradients = [
                    "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500",
                    "bg-gradient-to-br from-black via-zinc-900 to-orange-900",
                    "bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900",
                    "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700",
                    "bg-gradient-to-br from-rose-500 via-red-600 to-orange-700"
                ]
                const hash = standup.id.charCodeAt(0) % gradients.length

                result.push({
                    id: standup.id.substring(0, 3).toUpperCase(),
                    fullId: standup.id,
                    name: standup.name,
                    subtitle: team.name,
                    gradient: gradients[hash],
                    coverUrl: standup.cover_url,
                    members: (team.members || []).map((m: any) => m.user?.avatar_url || m.user?.name?.charAt(0))
                })
            }
        }
        return result
    } catch (error) {
        console.error("Error getting standups:", error)
        return []
    }
}

export async function deleteStandup(standupId: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }
    if (!(await canAccessStandup(standupId))) return { success: false, error: ACCESS_ERROR }

    try {
        await prisma.standup.delete({
            where: { id: standupId }
        })
        revalidatePath('/standups')
        return { success: true }
    } catch (error) {
        console.error("Error deleting standup:", error)
        return { success: false, error: "Failed to delete standup" }
    }
}

export async function getStandupById(standupId: string) {
    const user = await getCurrentUser()
    if (!user) return null
    if (!(await canAccessStandup(standupId))) return null

    try {
        const supabase = await createAdminClient()
        const { data: standup, error } = await supabase
            .from('standups')
            .select('*, team:standup_teams(*)')
            .eq('id', standupId)
            .maybeSingle()
        if (error) throw error
        return standup
    } catch (error) {
        console.error("Error getting standup:", error)
        return null
    }
}

export async function updateStandup(standupId: string, data: {
    teamId: string,
    name: string,
    frequency: string,
    reminderTime: string,
    days: string[],
    questions: string[],
    targetAudience: "leader" | "all",
    coverUrl?: string
}) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }
    // The standup must be reachable now, and may only be moved to a team the user can access
    const [canEdit, canUseTeam] = await Promise.all([canAccessStandup(standupId), canAccessStandupTeam(data.teamId)])
    if (!canEdit || !canUseTeam) return { success: false, error: ACCESS_ERROR }

    try {
        await prisma.standup.update({
            where: { id: standupId },
            data: {
                team_id: data.teamId,
                name: data.name,
                frequency: data.frequency,
                reminder_time: data.reminderTime,
                schedule_days: data.days,
                questions: data.questions as any,
                target_audience: data.targetAudience,
                target_audience: data.targetAudience,
                // cover_url: data.coverUrl, // Handled via raw query below
            }
        })

        // Manual update for cover_url
        if (data.coverUrl !== undefined) {
            await prisma.$executeRaw`
                UPDATE standups 
                SET cover_url = ${data.coverUrl} 
                WHERE id = ${standupId}::uuid
            `
        }
        revalidatePath('/standups')
        return { success: true }
    } catch (error) {
        console.error("Error updating standup:", error)
        return { success: false, error: "Failed to update standup" }
    }
}

export async function getStandupDetails(standupId: string) {
    const user = await getCurrentUser()
    if (!user) return null
    if (!(await canAccessStandup(standupId))) return null

    try {
        // PERFORMANCE: standup + updates load in parallel via Supabase (was two sequential Prisma queries)
        const supabase = await createAdminClient()
        const [{ data: standup, error: standupError }, { data: updates, error: updatesError }] = await Promise.all([
            supabase
                .from('standups')
                .select('*, team:standup_teams(*, members:standup_team_members(*))')
                .eq('id', standupId)
                .maybeSingle(),
            // Fetch updates for 'today' (mocked as recent for now, or use actual date filtering)
            supabase
                .from('standup_updates')
                .select('*, user:users(name, avatar_url, role_global)')
                .eq('standup_id', standupId)
                .order('created_at', { ascending: false }),
        ])

        if (standupError) throw standupError
        if (updatesError) throw updatesError
        if (!standup) return null

        if (standup.team) {
            const usersById = await getUsersByIds(supabase, (standup.team.members || []).map((m: any) => m.user_id))
            standup.team.members = (standup.team.members || []).map((m: any) => ({ ...m, user: usersById.get(m.user_id) }))
        }

        return {
            ...standup,
            updates: (updates || []).map((u: any) => ({
                id: u.id,
                user: {
                    id: u.user_id,
                    name: u.user?.name,
                    role: u.user?.role_global,
                    avatar: u.user?.avatar_url
                },
                content: u.content,
                mood: u.mood,
                blockers: u.blockers,
                kudos: u.kudos,
                created_at: u.created_at
            }))
        }
    } catch (error) {
        console.error("Error getting standup details:", error)
        return null
    }
}

export async function submitStandupUpdate(standupId: string, data: {
    content: any[],
    mood: string,
    blockers: string
}) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }
    if (!(await canAccessStandup(standupId))) return { success: false, error: ACCESS_ERROR }

    try {
        // Use raw SQL because Prisma Client might not have StandupUpdate yet
        await prisma.$executeRaw`
            INSERT INTO standup_updates (standup_id, user_id, content, mood, blockers, created_at)
            VALUES (
                ${standupId}::uuid, 
                ${user.id}::uuid, 
                ${JSON.stringify(data.content)}::jsonb, 
                ${data.mood}, 
                ${data.blockers},
                NOW()
            )
        `
        revalidatePath(`/standups/${standupId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Error submitting update:", error)
        return { success: false, error: error.message || "Failed to submit" }
    }
}
