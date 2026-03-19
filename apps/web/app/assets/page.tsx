
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"
import { AssetsClient } from "@/components/assets/AssetsClient"

export default async function AssetsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get default workspace
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)

    const targetWorkspaceId = members?.[0]?.workspace_id

    const currentUserData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <AuthLayoutInner user={currentUserData} showSidebar={false} workspaceId={targetWorkspaceId}>
            <AssetsClient />
        </AuthLayoutInner>
    )
}
