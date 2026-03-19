import { Navbar } from "@/components/layout/Navbar"
import { CreatorsPoolClient } from "@/components/CreatorsPoolClient"
import { getCreators } from "@/app/actions/creators"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export default async function CreatorsPoolPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const creatorsData = await getCreators()

    const initialCreators = creatorsData.map(creator => {
        const userData = creator.user;

        return {
            id: creator.id || userData.id, // Profile ID or User ID as fallback
            user_id: userData.id,
            name: userData.name || "Unknown",
            isPro: userData.role_global === 'designer',
            location: creator.location || (userData.state ? `${userData.state}, ${userData.country}` : userData.country || "Earth"),
            website: creator.website || userData.website || "#",
            category: creator.category || userData.category || "General",
            type: creator.type || userData.profile_type || "Individual",
            country: creator.country || userData.country || "Global",
            awards: {
                p: creator.works_count?.toString() || "0",
                w: creator.soty_count?.toString() || "0",
                l: creator.sotm_count?.toString() || "0",
                s: creator.sotd_count?.toString() || "0"
            },
            avatar: userData.avatar_url || null,
            initials: userData.name?.substring(0, 2).toUpperCase() || "??",
            featuredImage: "bg-gradient-to-br from-accent-indigo/10 to-transparent"
        }
    })

    // Get default workspace
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)

    const targetWorkspaceId = members?.[0]?.workspace_id

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false} workspaceId={targetWorkspaceId}>
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col min-h-screen relative">
                    <CreatorsPoolClient initialCreators={initialCreators} />
                </main>
            </div>
        </AuthLayoutInner>
    )
}
