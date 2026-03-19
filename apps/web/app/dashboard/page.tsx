import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./DashboardClient"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"
import { getWorkspaces } from "@/app/actions/projects"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const workspaces = await getWorkspaces()
    const workspaceShort = (workspaces as any[])?.[0]
    const hasWorkspace = !!workspaceShort
    const workspaceName = workspaceShort?.name || null
    const workspaceId = workspaceShort?.id || null

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Creative Director"
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false}>
            <DashboardClient
                userName={userData.name}
                hasWorkspace={hasWorkspace}
                workspaceName={workspaceName}
                workspaceId={workspaceId}
            />
        </AuthLayoutInner>
    )
}
