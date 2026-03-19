import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"
import { StandupDetailClient } from "@/components/standups/StandupDetailClient"

import { getStandupDetails } from "@/app/actions/standups"

export default async function StandupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
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

    const standup = await getStandupDetails(id)

    if (!standup) {
        return <div>Standup not found</div>
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false} workspaceId={targetWorkspaceId}>
            <StandupDetailClient initialStandup={standup} currentUser={user} />
        </AuthLayoutInner>
    )
}
