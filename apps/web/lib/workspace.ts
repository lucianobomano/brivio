import { cache } from "react"
import { createClient, getCurrentUser } from "@/lib/supabase/server"

/**
 * The signed-in user's default workspace row: first membership, falling back to a
 * workspace they own. Memoized per request so the (app) layout and its pages share
 * one lookup instead of each querying workspace_members.
 */
export const getDefaultWorkspace = cache(async () => {
    const user = await getCurrentUser()
    if (!user) return null

    const supabase = await createClient()
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace:workspaces(*)')
        .eq('user_id', user.id)
        .limit(1)

    let workspace: any = members?.[0]?.workspace
    workspace = Array.isArray(workspace) ? workspace[0] : workspace

    if (!workspace) {
        const { data: ownedWs } = await supabase
            .from('workspaces')
            .select('*')
            .eq('created_by', user.id)
            .limit(1)
            .maybeSingle()
        workspace = ownedWs
    }

    return workspace || null
})
