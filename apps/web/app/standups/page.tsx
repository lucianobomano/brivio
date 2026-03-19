import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"
import { StandupListClient } from "@/components/standups/StandupListClient"
import { getStandups } from "@/app/actions/standups"

export default async function StandupPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Determine workspaceId to ensure WorkspaceProvider works
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)

    const targetWorkspaceId = members?.[0]?.workspace_id

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Team Member"
    }

    const standups = await getStandups(targetWorkspaceId)

    return (
        <AuthLayoutInner user={userData} showSidebar={false} workspaceId={targetWorkspaceId}>
            <StandupListClient workspaceId={targetWorkspaceId} initialStandups={standups} />
        </AuthLayoutInner>
    )
}
