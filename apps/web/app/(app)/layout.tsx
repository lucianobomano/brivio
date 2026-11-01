import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import { getDefaultWorkspace } from "@/lib/workspace"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

/**
 * Shared shell for the authenticated app pages (route group, no effect on URLs).
 * Layouts persist across client-side navigations, so the shell (bottom navigation,
 * workspace context) is fetched and mounted once instead of on every page, and each
 * page's loading.tsx renders inside it with the real navigation still visible.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // Default workspace: first membership, falling back to a workspace the user owns
    const workspace = await getDefaultWorkspace()
    // Signed up but never finished setting up: the onboarding creates the workspace first
    if (!workspace) {
        redirect('/onboarding')
    }

    const userData = {
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false} workspaceId={workspace?.id} initialWorkspace={workspace}>
            {children}
        </AuthLayoutInner>
    )
}
