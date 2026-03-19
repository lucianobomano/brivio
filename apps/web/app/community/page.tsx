import { Navbar } from "@/components/layout/Navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CommunityClient } from "@/components/CommunityClient"
import { getCommunityPosts } from "@/app/actions/community"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export default async function CommunityPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const postsData = await getCommunityPosts()

    const initialPosts = postsData.map(post => ({
        id: post.id,
        author: post.author?.name || "Unknown",
        authorId: post.author?.id,
        avatar: post.author?.avatar_url,
        image: post.image_url,
        title: post.title,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        tags: post.tags || [],
        liked: post.liked_by_user || false,
        category: post.category,
        content_json: post.content_json,
        type: post.type,
        created_at: post.created_at,
        likers: post.likers || []
    }))

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
                    <CommunityClient initialPosts={initialPosts} />
                </main>
            </div>
        </AuthLayoutInner>
    )
}
