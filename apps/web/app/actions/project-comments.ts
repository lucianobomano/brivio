'use server'

import { prisma } from '@/lib/prisma'
import { createClient, createAdminClient, getCurrentUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canViewProject } from '@/lib/brand-access'

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const user = await getCurrentUser()
    return user
}

export interface CommentAuthor {
    id: string
    name: string
    avatar_url: string | null
}

export interface ProjectCommentType {
    id: string
    content: string
    likes_count: number
    created_at: Date | null
    author: CommentAuthor
    replies: ProjectCommentType[]
    isLiked?: boolean
}

// Get all comments for a project
export async function getProjectComments(projectId: string): Promise<ProjectCommentType[]> {
    const user = await getAuthenticatedUser()
    // SECURITY: comments of unpublished projects are for its members only
    if (!(await canViewProject(projectId))) return []

    // PERFORMANCE: Prisma's nested include ran one query per level (comments, authors, replies,
    // likes...), each a separate round-trip. Load every comment of the project plus the viewer's
    // likes in two parallel Supabase queries and rebuild the 3-level tree in memory.
    // Admin client keeps the access level Prisma had.
    const supabase = await createAdminClient()
    const [{ data: rows, error }, { data: likeRows }] = await Promise.all([
        supabase
            .from('project_comments')
            .select('id, parent_id, content, likes_count, created_at, author:users!project_comments_author_id_fkey(id, name, avatar_url)')
            .eq('project_id', projectId),
        user
            ? supabase
                .from('project_comment_likes')
                .select('comment_id, project_comments!inner(project_id)')
                .eq('user_id', user.id)
                .eq('project_comments.project_id', projectId)
            : Promise.resolve({ data: [] as { comment_id: string }[] }),
    ])

    if (error) {
        console.error("Error fetching project comments:", error)
        return []
    }

    const likedIds = new Set((likeRows || []).map((l: any) => l.comment_id))
    const all = (rows || []).map((c: any) => ({
        ...c,
        author: Array.isArray(c.author) ? c.author[0] : c.author,
        created_at: c.created_at ? new Date(c.created_at) : null,
    }))
    const byCreated = (dir: 1 | -1) => (a: any, b: any) => dir * ((a.created_at?.getTime() ?? 0) - (b.created_at?.getTime() ?? 0))
    const childrenOf = (parentId: string) => all.filter(c => c.parent_id === parentId).sort(byCreated(1))

    const comments = all.filter(c => !c.parent_id).sort(byCreated(-1)).map(c => ({
        ...c,
        likes: likedIds.has(c.id) ? [c.id] : [],
        replies: childrenOf(c.id).map(r => ({
            ...r,
            likes: likedIds.has(r.id) ? [r.id] : [],
            replies: childrenOf(r.id),
        })),
    }))

    return comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        likes_count: comment.likes_count,
        created_at: comment.created_at,
        author: comment.author,
        isLiked: Array.isArray(comment.likes) && comment.likes.length > 0,
        replies: comment.replies.map((reply: any) => ({
            id: reply.id,
            content: reply.content,
            likes_count: reply.likes_count,
            created_at: reply.created_at,
            author: reply.author,
            isLiked: Array.isArray(reply.likes) && reply.likes.length > 0,
            replies: reply.replies.map((nestedReply: any) => ({
                id: nestedReply.id,
                content: nestedReply.content,
                likes_count: 0,
                created_at: nestedReply.created_at,
                author: nestedReply.author,
                isLiked: false,
                replies: []
            }))
        }))
    }))
}

// Add a new comment or reply
export async function addProjectComment(
    projectId: string,
    content: string,
    parentId?: string | null
): Promise<{ success: boolean; error?: string; comment?: ProjectCommentType }> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Você precisa estar logado para comentar' }
    }

    if (!content.trim()) {
        return { success: false, error: 'O comentário não pode estar vazio' }
    }

    if (!(await canViewProject(projectId))) {
        return { success: false, error: 'Sem acesso a este projeto' }
    }
    // A reply must stay in the same project as its parent
    if (parentId) {
        const parent = await prisma.projectComment.findUnique({ where: { id: parentId }, select: { project_id: true } })
        if (!parent || parent.project_id !== projectId) {
            return { success: false, error: 'Comentário não encontrado' }
        }
    }

    try {
        const comment = await prisma.projectComment.create({
            data: {
                project_id: projectId,
                author_id: user.id,
                parent_id: parentId || null,
                content: content.trim()
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar_url: true
                    }
                }
            }
        })

        revalidatePath('/community')

        return {
            success: true,
            comment: {
                id: comment.id,
                content: comment.content,
                likes_count: 0,
                created_at: comment.created_at,
                author: comment.author,
                isLiked: false,
                replies: []
            }
        }
    } catch (error) {
        console.error('Error adding comment:', error)
        return { success: false, error: 'Erro ao adicionar comentário' }
    }
}

// Like/unlike a comment
export async function toggleCommentLike(
    commentId: string
): Promise<{ success: boolean; error?: string; isLiked?: boolean; likesCount?: number }> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Você precisa estar logado para curtir' }
    }

    try {
        const comment = await prisma.projectComment.findUnique({ where: { id: commentId }, select: { project_id: true } })
        if (!comment || !(await canViewProject(comment.project_id))) {
            return { success: false, error: 'Comentário não encontrado' }
        }

        const existingLike = await prisma.projectCommentLike.findUnique({
            where: {
                comment_id_user_id: {
                    comment_id: commentId,
                    user_id: user.id
                }
            }
        })

        if (existingLike) {
            // Unlike
            await prisma.projectCommentLike.delete({
                where: { id: existingLike.id }
            })
            await prisma.projectComment.update({
                where: { id: commentId },
                data: { likes_count: { decrement: 1 } }
            })

            const updated = await prisma.projectComment.findUnique({
                where: { id: commentId },
                select: { likes_count: true }
            })

            return { success: true, isLiked: false, likesCount: updated?.likes_count || 0 }
        } else {
            // Like
            await prisma.projectCommentLike.create({
                data: {
                    comment_id: commentId,
                    user_id: user.id
                }
            })
            await prisma.projectComment.update({
                where: { id: commentId },
                data: { likes_count: { increment: 1 } }
            })

            const updated = await prisma.projectComment.findUnique({
                where: { id: commentId },
                select: { likes_count: true }
            })

            return { success: true, isLiked: true, likesCount: updated?.likes_count || 0 }
        }
    } catch (error) {
        console.error('Error toggling like:', error)
        return { success: false, error: 'Erro ao curtir comentário' }
    }
}

// Delete own comment
export async function deleteProjectComment(
    commentId: string
): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Você precisa estar logado' }
    }

    try {
        const comment = await prisma.projectComment.findUnique({
            where: { id: commentId },
            select: { author_id: true }
        })

        if (!comment) {
            return { success: false, error: 'Comentário não encontrado' }
        }

        if (comment.author_id !== user.id) {
            return { success: false, error: 'Você só pode deletar seus próprios comentários' }
        }

        await prisma.projectComment.delete({
            where: { id: commentId }
        })

        revalidatePath('/community')
        return { success: true }
    } catch (error) {
        console.error('Error deleting comment:', error)
        return { success: false, error: 'Erro ao deletar comentário' }
    }
}
