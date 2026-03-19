'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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

    const comments = await prisma.projectComment.findMany({
        where: {
            project_id: projectId,
            parent_id: null // Only top-level comments
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar_url: true
                }
            },
            replies: {
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar_url: true
                        }
                    },
                    likes: user ? {
                        where: { user_id: user.id }
                    } : false,
                    replies: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                    avatar_url: true
                                }
                            }
                        },
                        orderBy: { created_at: 'asc' }
                    }
                },
                orderBy: { created_at: 'asc' }
            },
            likes: user ? {
                where: { user_id: user.id }
            } : false
        },
        orderBy: { created_at: 'desc' }
    })

    return comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        likes_count: comment.likes_count,
        created_at: comment.created_at,
        author: comment.author,
        isLiked: Array.isArray(comment.likes) && comment.likes.length > 0,
        replies: comment.replies.map(reply => ({
            id: reply.id,
            content: reply.content,
            likes_count: reply.likes_count,
            created_at: reply.created_at,
            author: reply.author,
            isLiked: Array.isArray(reply.likes) && reply.likes.length > 0,
            replies: reply.replies.map(nestedReply => ({
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
