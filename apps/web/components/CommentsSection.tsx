"use client"

import * as React from "react"
import { ThumbsUp, MessageCircle, Trash2, CornerDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    getProjectComments,
    addProjectComment,
    toggleCommentLike,
    deleteProjectComment,
    type ProjectCommentType
} from "@/app/actions/project-comments"

interface CommentsSectionProps {
    projectId: string
    currentUserAvatar?: string | null
    currentUserId?: string | null
    onCommentAdded?: () => void
}

export function CommentsSection({ projectId, currentUserAvatar, currentUserId, onCommentAdded }: CommentsSectionProps) {
    const [comments, setComments] = React.useState<ProjectCommentType[]>([])
    const [newComment, setNewComment] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null)
    const [replyContent, setReplyContent] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(true)
    const commentInputRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (commentInputRef.current) {
            commentInputRef.current.style.height = '80px'
            commentInputRef.current.style.height = `${commentInputRef.current.scrollHeight}px`
        }
    }, [newComment])

    // Load comments
    React.useEffect(() => {
        loadComments()
    }, [projectId])

    const loadComments = async () => {
        setIsLoading(true)
        try {
            const data = await getProjectComments(projectId)
            setComments(data)
        } catch (error) {
            console.error('Error loading comments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitComment = async () => {
        if (!newComment.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await addProjectComment(projectId, newComment)
            if (result.success && result.comment) {
                setComments(prev => [result.comment!, ...prev])
                setNewComment("")
                onCommentAdded?.()
            }
        } catch (error) {
            console.error('Error adding comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitReply = async (parentId: string) => {
        if (!replyContent.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await addProjectComment(projectId, replyContent, parentId)
            if (result.success && result.comment) {
                setComments(prev => prev.map(comment => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: [...comment.replies, result.comment!]
                        }
                    }
                    return comment
                }))
                setReplyContent("")
                setReplyingTo(null)
            }
        } catch (error) {
            console.error('Error adding reply:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        try {
            const result = await toggleCommentLike(commentId)
            if (result.success) {
                if (isReply && parentId) {
                    setComments(prev => prev.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: comment.replies.map(reply => {
                                    if (reply.id === commentId) {
                                        return {
                                            ...reply,
                                            isLiked: result.isLiked,
                                            likes_count: result.likesCount || 0
                                        }
                                    }
                                    return reply
                                })
                            }
                        }
                        return comment
                    }))
                } else {
                    setComments(prev => prev.map(comment => {
                        if (comment.id === commentId) {
                            return {
                                ...comment,
                                isLiked: result.isLiked,
                                likes_count: result.likesCount || 0
                            }
                        }
                        return comment
                    }))
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error)
        }
    }

    const handleDelete = async (commentId: string, isReply: boolean = false, parentId?: string) => {
        try {
            const result = await deleteProjectComment(commentId)
            if (result.success) {
                if (isReply && parentId) {
                    setComments(prev => prev.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: comment.replies.filter(reply => reply.id !== commentId)
                            }
                        }
                        return comment
                    }))
                } else {
                    setComments(prev => prev.filter(c => c.id !== commentId))
                }
            }
        } catch (error) {
            console.error('Error deleting comment:', error)
        }
    }

    const formatDate = (date: Date | null) => {
        if (!date) return ''
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'agora'
        if (minutes < 60) return `${minutes}m`
        if (hours < 24) return `${hours}h`
        if (days < 7) return `${days}d`
        return new Date(date).toLocaleDateString('pt-BR')
    }

    return (
        <div className="w-full">
            {/* Comment Input */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-bg-3 overflow-hidden flex-shrink-0">
                        {currentUserAvatar ? (
                            <img src={currentUserAvatar} alt="You" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-accent-indigo/30 to-accent-blue/30" />
                        )}
                    </div>
                    <div className="flex-1">
                        <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="O que você achou desse projeto?"
                            className="w-full min-h-[80px] h-[80px] resize-none bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-indigo transition-colors overflow-hidden"
                        />
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={handleSubmitComment}
                                disabled={!newComment.trim() || isSubmitting}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                                    newComment.trim() && !isSubmitting
                                        ? "bg-accent-indigo text-white hover:bg-accent-indigo/90"
                                        : "bg-[#3a3a3a] text-gray-500 cursor-not-allowed"
                                )}
                            >
                                {isSubmitting ? 'Publicando...' : 'Publicar comentário'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando comentários...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Seja o primeiro a comentar neste projeto!
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={currentUserId}
                            onLike={handleLike}
                            onDelete={handleDelete}
                            onReply={(id) => setReplyingTo(id)}
                            replyingTo={replyingTo}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onSubmitReply={handleSubmitReply}
                            isSubmitting={isSubmitting}
                            formatDate={formatDate}
                            onReplyContentChange={setReplyContent}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

// Individual Comment Item
function CommentItem({
    comment,
    currentUserId,
    onLike,
    onDelete,
    onReply,
    replyingTo,
    replyContent,
    setReplyContent,
    onSubmitReply,
    isSubmitting,
    formatDate,
    isReply = false,
    parentId
}: {
    comment: ProjectCommentType
    currentUserId?: string | null
    onLike: (id: string, isReply?: boolean, parentId?: string) => void
    onDelete: (id: string, isReply?: boolean, parentId?: string) => void
    onReply: (id: string) => void
    replyingTo: string | null
    replyContent: string
    setReplyContent: (value: string) => void
    onSubmitReply: (parentId: string) => void
    isSubmitting: boolean
    formatDate: (date: Date | null) => string
    onReplyContentChange?: (content: string) => void
    isReply?: boolean
    parentId?: string
}) {
    const isOwner = currentUserId === comment.author.id

    return (
        <div className={cn("bg-[#1a1a1a] rounded-xl p-5", isReply && "ml-12 bg-[#222]")}>
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-bg-3 overflow-hidden flex-shrink-0">
                    {comment.author.avatar_url ? (
                        <img src={comment.author.avatar_url} alt={comment.author.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-accent-indigo/30 to-accent-blue/30 flex items-center justify-center text-xs font-bold text-white">
                            {comment.author.name.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{comment.author.name}</span>
                        <span className="text-gray-500 text-xs">• {formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={() => onLike(comment.id, isReply, parentId)}
                            className={cn(
                                "flex items-center gap-1.5 text-xs transition-colors",
                                comment.isLiked ? "text-accent-indigo" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <ThumbsUp className={cn("w-4 h-4", comment.isLiked && "fill-current")} />
                            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                        </button>
                        {!isReply && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Responder
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={() => onDelete(comment.id, isReply, parentId)}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                        <div className="mt-4 flex items-start gap-3">
                            <CornerDownRight className="w-4 h-4 text-gray-500 mt-2" />
                            <ReplyInput
                                value={replyContent}
                                onChange={(val) => setReplyContent(val)}
                                onSubmit={() => onSubmitReply(comment.id)}
                                onCancel={() => onReply('')}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-3">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            onLike={onLike}
                            onDelete={onDelete}
                            onReply={onReply}
                            replyingTo={replyingTo}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onSubmitReply={onSubmitReply}
                            isSubmitting={isSubmitting}
                            formatDate={formatDate}
                            isReply={true}
                            parentId={comment.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function ReplyInput({
    value,
    onChange,
    onSubmit,
    onCancel,
    isSubmitting
}: {
    value: string
    onChange: (val: string) => void
    onSubmit: () => void
    onCancel: () => void
    isSubmitting: boolean
}) {
    const ref = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (ref.current) {
            ref.current.style.height = '64px'
            ref.current.style.height = `${ref.current.scrollHeight}px`
        }
    }, [value])

    return (
        <div className="flex-1">
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Escreva sua resposta..."
                className="w-full min-h-[64px] h-[64px] resize-none bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-indigo transition-colors overflow-hidden"
                autoFocus
            />
            <div className="flex gap-2 mt-2">
                <button
                    onClick={onSubmit}
                    disabled={!value.trim() || isSubmitting}
                    className="px-4 py-1.5 bg-accent-indigo text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-accent-indigo/90 transition-all"
                >
                    Responder
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-1.5 bg-[#3a3a3a] text-gray-300 rounded-lg text-xs font-medium hover:bg-[#4a4a4a] transition-all"
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}
