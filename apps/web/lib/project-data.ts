import { createAdminClient } from "@/lib/supabase/server"
import type { ProjectMeeting } from "@/app/actions/meetings"

/**
 * Unchecked project loaders for the public share roadmap (keyed by the project id in the link)
 * and for server actions after their own access check. Kept outside "use server" files so they
 * are not callable from the browser, and free of cookies() so they can run inside unstable_cache.
 */

export async function loadProjectNotes(projectId: string) {
    try {
        // PERFORMANCE: one HTTP round-trip via Supabase instead of several Postgres round-trips via Prisma
        const supabase = await createAdminClient()
        const { data: notes, error } = await supabase
            .from('project_notes')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })

        if (error) throw error
        return { success: true, notes: notes || [] }
    } catch (error) {
        console.error("Error fetching project notes:", error)
        return { success: false, error: "Failed to fetch project notes" }
    }
}

export async function loadProjectMeetings(projectId: string): Promise<ProjectMeeting[]> {
    try {
        const supabase = await createAdminClient()
        const { data: meetings, error } = await supabase
            .from('project_meetings')
            .select('*')
            .eq('project_id', projectId)
            .order('meeting_date', { ascending: true })

        if (error) throw error

        return (meetings || []).map(m => ({
            ...m,
            meeting_date: m.meeting_date?.toISOString?.() || m.meeting_date,
            created_at: m.created_at?.toISOString?.() || m.created_at,
        }))
    } catch (error) {
        console.error("[getProjectMeetings] Error:", error)
        return []
    }
}
