import { Navbar } from "@/components/layout/Navbar"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CommunityClient } from "@/components/CommunityClient"
import { getCommunityPosts } from "@/app/actions/community"

export default async function CommunityPage() {
    const supabase = await createClient()
    const user = await getCurrentUser()

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

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <>
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col min-h-screen relative">
                    <CommunityClient initialPosts={initialPosts} />
                </main>
            </div>
        </>
    )
}
