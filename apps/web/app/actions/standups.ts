"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// Get current user helper
async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getWorkspaceTeams(workspaceId: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }

    if (!(prisma as any).standupTeam) {
        console.error("Prisma client outdated in getWorkspaceTeams")
        return { success: false, error: "Prisma client outdated" }
    }

    try {
        // Fetch teams in the workspace
        const teams = await prisma.standupTeam.findMany({
            where: { workspace_id: workspaceId },
            include: {
                members: true, // Need members for counting length in some usages
                _count: {
                    select: { members: true }
                }
            }
        })

        console.log(`Fetched ${teams.length} teams for workspace ${workspaceId}`)

        return {
            success: true,
            teams: teams.map(t => ({
                id: t.id,
                name: t.name,
                members: t.members, // Added members to match usage map in modal
                memberCount: t._count.members
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

    try {
        const members = await prisma.workspaceMember.findMany({
            where: { workspace_id: workspaceId },
            include: { user: true }
        })

        return members
            .map(m => m.user)
            .filter(u => u !== null)
            .map(u => ({
                id: u!.id,
                name: u!.name,
                avatar_url: u!.avatar_url
            }))
    } catch (e) {
        console.error("Error fetching members:", e)
        return []
    }
}

export async function createStandupTeam(data: { name: string, leaderId: string, memberIds: string[], workspaceId: string }) {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Not authorized" }

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

    if (!(prisma as any).standupTeam) {
        // Safe guard for calling findMany on undefined
        return []
    }

    try {
        const whereClause: any = {}
        if (workspaceId) {
            whereClause.workspace_id = workspaceId
        }

        const teams = await prisma.standupTeam.findMany({
            where: whereClause,
            include: {
                members: {
                    include: { user: true }
                },
                standups: true
            }
        })

        // Fetch cover URLs purely via raw SQL to bypass stale Prisma client
        const coverUrls = await prisma.$queryRaw<Array<{ id: string, cover_url: string | null }>>`
            SELECT id, cover_url FROM standups
        `
        const coverMap = new Map(coverUrls.map((c: any) => [c.id, c.cover_url]))

        // Flatten
        const result = []
        for (const team of teams) {
            for (const standup of team.standups) {
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
                    coverUrl: coverMap.get(standup.id) || (standup as any).cover_url, // Prefer raw fetch
                    members: team.members.map((m: any) => m.user.avatar_url || m.user.name.charAt(0))
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

    try {
        const standup = await prisma.standup.findUnique({
            where: { id: standupId },
            include: { team: true }
        })
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

    try {
        const standup = await prisma.standup.findUnique({
            where: { id: standupId },
            include: {
                team: {
                    include: {
                        members: {
                            include: { user: true }
                        }
                    }
                }
            }
        })

        if (!standup) return null

        // Fetch updates for 'today' (mocked as recent for now, or use actual date filtering)
        // Since Prisma Client is stale, we use raw query to fetch updates
        const updates = await prisma.$queryRaw<Array<any>>`
            SELECT su.*, u.name as user_name, u.avatar_url, u.role_global 
            FROM standup_updates su
            JOIN users u ON su.user_id = u.id
            WHERE su.standup_id = ${standupId}::uuid
            ORDER BY su.created_at DESC
        `

        return {
            ...standup,
            updates: updates.map(u => ({
                id: u.id,
                user: {
                    id: u.user_id,
                    name: u.user_name,
                    role: u.role_global,
                    avatar: u.avatar_url
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
