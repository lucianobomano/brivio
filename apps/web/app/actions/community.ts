"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCommunityPosts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch Community Posts
    const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(`
            *,
            author:users(*),
            likes:community_likes(
                user_id,
                user:users(avatar_url)
            ),
            comments:community_comments(count)
        `)
        .order('created_at', { ascending: false })

    if (postsError) {
        console.error("Error fetching community posts:", postsError)
    }

    const transformedPosts = (posts || []).map(p => {
        const likes = p.likes || []
        const likers = likes.map((l: any) => l.user?.avatar_url).filter(Boolean)
        const isLiked = user ? likes.some((l: any) => l.user_id === user.id) : false

        return {
            ...p,
            type: 'post',
            likes_count: likes.length,
            liked_by_user: isLiked,
            likers: likers,
            comments_count: p.comments?.[0]?.count || 0
        }
    })

    // 2. Fetch Projects (Works)
    let communityProjects = []

    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
            *,
            author:users!created_by(*),
            likes:project_likes(
                user_id,
                user:users(avatar_url)
            ),
            comments:project_comments(count)
        `)
        .eq('type', 'work')
        .eq('status', 'done')
        .order('created_at', { ascending: false })

    if (projectsError) {
        const { data: fallbackProjects } = await supabase
            .from('projects')
            .select(`
                *,
                author:users!created_by(*)
            `)
            .eq('status', 'done')
            .order('created_at', { ascending: false })

        communityProjects = fallbackProjects || []
    } else {
        communityProjects = projects || []
    }

    const transformedProjects = communityProjects.map(p => {
        // Try to get an image from content if cover_url is missing
        let fallbackImage = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;

        if (!p.cover_url && Array.isArray(p.content_json)) {
            const firstImageBlock = p.content_json.find((b: any) => b.type === 'image' && b.content?.url);
            if (firstImageBlock) {
                fallbackImage = firstImageBlock.content.url;
            } else {
                const firstGridBlock = p.content_json.find((b: any) => b.type === 'grid' && b.content?.images?.length > 0);
                if (firstGridBlock) {
                    fallbackImage = firstGridBlock.content.images[0].url;
                }
            }
        }

        const likes = p.likes || []
        // Extract avatars, filtering out those without avatars if preferred, but usually we show a placeholder.
        // We will map to an array of avatar URLs.
        const likers = likes
            .map((l: any) => l.user?.avatar_url)
            .filter(Boolean) // Remove nulls if any

        // We might want to pass total likes count separate from the avatars array if we limit avatars
        const likesCount = likes.length

        const isLiked = user ? likes.some((l: any) => l.user_id === user.id) : false

        return {
            ...p,
            title: p.name,
            type: 'project',
            image_url: p.cover_url || fallbackImage,
            likes_count: likesCount,
            comments_count: p.comments?.[0]?.count || 0,
            liked_by_user: isLiked,
            likers: likers
        };
    })

    return [...transformedPosts, ...transformedProjects].sort((a, b) => {
        const dateB = new Date(b.created_at || b.published_at || 0).getTime()
        const dateA = new Date(a.created_at || 0).getTime()
        return dateB - dateA
    })
}

export async function likePost(postId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Check if liked
    const { data: existingLike } = await supabase
        .from('community_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()

    if (existingLike) {
        // Unlike
        await supabase
            .from('community_likes')
            .delete()
            .eq('id', existingLike.id)
    } else {
        // Like
        await supabase
            .from('community_likes')
            .insert({ user_id: user.id, post_id: postId })
    }

    revalidatePath('/')
    revalidatePath('/community')
    return { success: true }
}
