"use client"

import * as React from "react"
import { X, Maximize2, Pencil, Share2, Bookmark, ThumbsUp, Eye, MessageCircle, ChevronRight, Instagram, Facebook, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageViewer } from "./ImageViewer"
import { CommentsSection } from "./CommentsSection"
import { toggleProjectLike } from "@/app/actions/projects"

interface BlockSettings {
    backgroundColor?: string
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
    textAlign?: 'left' | 'center' | 'right'
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    fontFamily?: string
    color?: string
    textColor?: string
    fullWidth?: boolean
    gridGap?: number
    blankHeight?: number
}

interface GridImage {
    id: string
    url: string
    name: string
}

interface GridBlockContent {
    images: GridImage[]
    layout: '2-cols' | '3-cols' | '4-cols' | 'masonry'
}

interface EditorBlock {
    id: string
    type: 'text' | 'image' | 'video' | 'grid' | 'blank'
    content: any
    settings?: BlockSettings
}

interface AuthorProject {
    id: string
    name: string
    cover_url?: string
}

interface ProjectViewerModalProps {
    isOpen: boolean
    onClose: () => void
    project: {
        id: string
        name: string
        content_json: any
        category?: string
        tags?: string[]
        cover_url?: string
        author?: string
        avatar?: string
        likes?: number
        views?: number
        comments?: number
        published_at?: string
        created_at?: string
    }
    authorProjects?: AuthorProject[]
    onEdit?: () => void
    onSelectProject?: (projectId: string) => void
}

export function ProjectViewerModal({ isOpen, onClose, project, authorProjects = [], onEdit, onSelectProject }: ProjectViewerModalProps) {
    const [viewerState, setViewerState] = React.useState<{ isOpen: boolean, images: string[], index: number }>({
        isOpen: false,
        images: [],
        index: 0
    })
    const [isLiked, setIsLiked] = React.useState(false)
    const [likesCount, setLikesCount] = React.useState(project.likes || 0)
    const [viewsCount, setViewsCount] = React.useState(project.views || 0)
    const [commentsCount, setCommentsCount] = React.useState(project.comments || 0)
    const [isLiking, setIsLiking] = React.useState(false)
    const [statsLoaded, setStatsLoaded] = React.useState(false)

    React.useEffect(() => {
        if (!isOpen) {
            setViewerState({ isOpen: false, images: [], index: 0 })
            setStatsLoaded(false)
        }
    }, [isOpen])

    // Load all project stats on mount
    React.useEffect(() => {
        if (isOpen && project.id && !statsLoaded) {
            import('@/app/actions/projects').then(({ getProjectStats }) => {
                getProjectStats(project.id).then(result => {
                    setIsLiked(result.isLiked)
                    setLikesCount(result.likesCount)
                    setViewsCount(result.viewsCount)
                    setCommentsCount(result.commentsCount)
                    setStatsLoaded(true)
                })
            })
        }
    }, [isOpen, project.id, statsLoaded])

    const handleToggleLike = async () => {
        if (isLiking) return
        setIsLiking(true)

        try {
            const result = await toggleProjectLike(project.id)
            if (result.success) {
                setIsLiked(result.isLiked || false)
                setLikesCount(result.likesCount || 0)
            }
        } catch (error) {
            console.error('Error toggling like:', error)
        } finally {
            setIsLiking(false)
        }
    }

    // Refresh stats periodically or after actions
    const refreshStats = React.useCallback(async () => {
        try {
            const { getProjectStats } = await import('@/app/actions/projects')
            const result = await getProjectStats(project.id)
            setIsLiked(result.isLiked)
            setLikesCount(result.likesCount)
            setViewsCount(result.viewsCount)
            setCommentsCount(result.commentsCount)
        } catch (error) {
            console.error('Error refreshing stats:', error)
        }
    }, [project.id])

    if (!isOpen) return null

    const handleOpenViewer = (images: string[], index: number) => {
        setViewerState({ isOpen: true, images, index })
    }

    const content = project.content_json
    const blocks = Array.isArray(content) ? content : (content as any)?.blocks || []
    const projectSettings = !Array.isArray(content) ? (content as any)?.settings : { blockGap: 0 }

    const formattedDate = project.created_at
        ? new Date(project.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Data não disponível'

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col h-full w-full">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/[0.85] z-[0]" onClick={onClose} />

            {/* Header - Fixed at top, transparent */}
            <header className="h-[72px] flex items-center justify-between px-6 shrink-0 z-[60] relative">
                <div className="flex items-center gap-4 pl-[230px]">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-bg-3 overflow-hidden flex items-center justify-center">
                        {project.avatar ? (
                            <img src={project.avatar} alt="Author" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-accent-indigo/30 to-accent-blue/30 flex items-center justify-center text-sm font-bold text-white">
                                {project.author?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>

                    {/* Project Name & Author */}
                    <div className="flex flex-col">
                        <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">{project.name}</h2>
                        <div className="flex items-center gap-2 text-[13px] text-gray-400">
                            <span>{project.author || 'Unknown'}</span>
                            {onEdit && (
                                <>
                                    <span>·</span>
                                    <button
                                        onClick={onEdit}
                                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Editar projeto
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </header>

            {/* Content - Full height, no rounded corners */}
            <main className="flex-1 overflow-y-auto custom-scrollbar z-[10] relative flex flex-col items-center">
                {/* Main Content Area with Sidebar */}
                <div className="flex gap-[25px]">
                    {/* Main Project Container */}
                    <div className="w-[1400px] bg-white dark:bg-bg-1 p-4 md:px-12 md:pb-12 md:pt-0 relative ml-[88px]">
                        <div
                            className="flex flex-col"
                            style={{ gap: `${projectSettings?.blockGap ?? 0}px` }}
                        >
                            {blocks.map((block: EditorBlock) => (
                                <ViewerBlock
                                    key={block.id}
                                    block={block}
                                    onOpenViewer={handleOpenViewer}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Social Buttons Sidebar */}
                    <div className="flex flex-col gap-4 pt-8 sticky top-8 h-fit self-start">
                        {/* Social Networks */}
                        <button
                            className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-all"
                            onClick={() => window.open('https://instagram.com', '_blank')}
                            title="Instagram"
                        >
                            <Instagram className="w-5 h-5" />
                        </button>
                        <button
                            className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-all"
                            onClick={() => window.open('https://facebook.com', '_blank')}
                            title="Facebook"
                        >
                            <Facebook className="w-5 h-5" />
                        </button>
                        <button
                            className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-all"
                            onClick={() => window.open('https://twitter.com', '_blank')}
                            title="X (Twitter)"
                        >
                            <Twitter className="w-5 h-5" />
                        </button>

                        {/* Save Button */}
                        <button className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-all" title="Salvar">
                            <Bookmark className="w-5 h-5" />
                        </button>

                        {/* Share Button */}
                        <button
                            className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-all"
                            title="Compartilhar"
                            onClick={() => {
                                const url = `${window.location.origin}/project/${project.id}`;
                                navigator.clipboard.writeText(url);
                                alert("Link do projeto copiado!");
                            }}
                        >
                            <Share2 className="w-5 h-5" />
                        </button>

                        {/* Like Button */}
                        <button
                            onClick={handleToggleLike}
                            disabled={isLiking}
                            title={isLiked ? "Descurtir" : "Curtir"}
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                isLiked
                                    ? "bg-accent-indigo text-white"
                                    : "bg-accent-indigo text-white hover:scale-110"
                            )}
                        >
                            <ThumbsUp className={cn("w-5 h-5", isLiked && "fill-current")} />
                        </button>
                    </div>
                </div>

                {/* Section 1: Stats Section - Dark gradient bg */}
                <section className="bg-gradient-to-b from-[#0a0a0a] to-[#111] py-16 mx-auto" style={{ width: '1400px' }}>
                    <div className="w-full px-4 flex flex-col items-center justify-center">
                        {/* Like Button - Interactive */}
                        <button
                            onClick={handleToggleLike}
                            disabled={isLiking}
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300 transform",
                                isLiked
                                    ? "bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30 scale-110"
                                    : "bg-gradient-to-br from-accent-indigo to-accent-blue hover:scale-110 hover:shadow-lg hover:shadow-accent-indigo/30",
                                isLiking && "opacity-50 cursor-wait"
                            )}
                        >
                            <ThumbsUp className={cn(
                                "w-7 h-7 text-white transition-transform duration-300",
                                isLiked && "fill-current"
                            )} />
                        </button>

                        {/* Like prompt/status */}
                        <p className="text-gray-400 text-xs mb-4">
                            {isLiked ? 'Você curtiu este projeto!' : 'Clique para curtir este projeto'}
                        </p>

                        {/* Project Name */}
                        <h3 className="text-2xl font-bold text-white uppercase tracking-wider mb-6">{project.name}</h3>

                        {/* Stats Row */}
                        <div className="flex items-center gap-8 mb-6">
                            <div className="flex flex-col items-center">
                                <div className={cn(
                                    "flex items-center gap-2 text-lg font-bold transition-colors",
                                    isLiked ? "text-pink-400" : "text-white"
                                )}>
                                    <ThumbsUp className={cn("w-5 h-5", isLiked && "fill-current")} />
                                    <span>{likesCount}</span>
                                </div>
                                <span className="text-gray-500 text-xs mt-1">Curtidas</span>
                            </div>
                            <div className="w-px h-8 bg-gray-700" />
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 text-lg font-bold text-white">
                                    <Eye className="w-5 h-5" />
                                    <span>{viewsCount}</span>
                                </div>
                                <span className="text-gray-500 text-xs mt-1">Visualizações</span>
                            </div>
                            <div className="w-px h-8 bg-gray-700" />
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 text-lg font-bold text-white">
                                    <MessageCircle className="w-5 h-5" />
                                    <span>{commentsCount}</span>
                                </div>
                                <span className="text-gray-500 text-xs mt-1">Comentários</span>
                            </div>
                        </div>

                        {/* Published Date */}
                        <p className="text-gray-500 text-sm">
                            Publicado em: <span className="text-gray-400">{formattedDate}</span>
                        </p>
                    </div>
                </section>

                {/* Section 2: Author Projects - Dark grey bg, 420px */}
                <section className="bg-[#191919] py-10 mx-auto" style={{ minHeight: '420px', width: '1400px' }}>
                    <div className="w-full px-8">
                        {/* Author Header */}
                        <div className="flex items-center gap-4 mb-6 ml-[95px]">
                            <div className="w-12 h-12 rounded-full bg-bg-3 overflow-hidden">
                                {project.avatar ? (
                                    <img src={project.avatar} alt="Author" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-accent-indigo/30 to-accent-blue/30 flex items-center justify-center text-sm font-bold text-white">
                                        {project.author?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-white font-bold">{project.author || 'Unknown'}</p>
                                {onEdit && (
                                    <button
                                        onClick={onEdit}
                                        className="flex items-center gap-1 px-3 py-1 bg-accent-indigo rounded-full text-white text-xs font-medium mt-1"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Editar projeto
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Projects Grid - Centered */}
                        <div className="flex justify-center">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {authorProjects.filter(p => p.id !== project.id).slice(0, 4).map((proj) => (
                                    <div
                                        key={proj.id}
                                        onClick={() => onSelectProject?.(proj.id)}
                                        className="w-[280px] h-[200px] rounded-lg bg-[#2a2a2a] overflow-hidden cursor-pointer group transition-transform hover:scale-105"
                                    >
                                        {proj.cover_url ? (
                                            <img
                                                src={proj.cover_url}
                                                alt={proj.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-accent-indigo/20 to-accent-blue/20 flex items-center justify-center text-gray-500 text-sm">
                                                {proj.name}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {authorProjects.filter(p => p.id !== project.id).length > 4 && (
                                    <button className="w-[50px] h-[200px] rounded-lg bg-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                )}
                                {authorProjects.filter(p => p.id !== project.id).length === 0 && (
                                    <div className="col-span-4 text-center text-gray-500 py-8">
                                        Nenhum outro projeto deste autor
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Comments - Dark bg matching app design */}
                <section className="bg-[#0f0f0f] py-12 mx-auto" style={{ width: '1400px' }}>
                    <div className="max-w-[900px] mx-auto px-4">
                        <h3 className="text-white text-lg font-semibold mb-6">Comentários ({commentsCount})</h3>
                        <CommentsSection
                            projectId={project.id}
                            currentUserAvatar={project.avatar}
                            onCommentAdded={refreshStats}
                        />
                    </div>
                </section>
            </main>

            {/* Image Viewer */}
            <ImageViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                images={viewerState.images}
                currentIndex={viewerState.index}
                onNavigate={(index) => setViewerState(prev => ({ ...prev, index }))}
            />
        </div>
    )
}

// ViewerBlock - Exactly matches SortableBlock in previewMode=true
function ViewerBlock({ block, onOpenViewer }: {
    block: EditorBlock,
    onOpenViewer: (images: string[], index: number) => void
}) {
    const isFullWidth = block.settings?.fullWidth

    return (
        <div
            style={{
                backgroundColor: block.settings?.backgroundColor || 'transparent',
                paddingTop: `${block.settings?.paddingTop ?? 0}px`,
                paddingBottom: `${block.settings?.paddingBottom ?? 0}px`,
                marginLeft: isFullWidth ? '-48px' : 0,
                marginRight: isFullWidth ? '-48px' : 0,
            }}
            className="group relative rounded-sm transition-all"
        >
            <div className={isFullWidth ? 'px-0' : 'px-4 md:px-0'}>
                <div style={{
                    paddingLeft: `${block.settings?.paddingLeft || 0}px`,
                    paddingRight: `${block.settings?.paddingRight || 0}px`
                }}>
                    {/* Text Block */}
                    {block.type === 'text' && (
                        <div
                            style={{
                                textAlign: block.settings?.textAlign || 'left',
                                fontSize: `${block.settings?.fontSize || 22}px`,
                                fontWeight: block.settings?.fontWeight || 'normal',
                                fontFamily: block.settings?.fontFamily || 'inherit',
                                color: block.settings?.textColor || 'inherit',
                            }}
                            className="w-full leading-[1.6] min-h-0 whitespace-pre-wrap p-0"
                        >
                            {block.content || ''}
                        </div>
                    )}

                    {/* Image Block */}
                    {block.type === 'image' && block.content?.url && (
                        <div
                            className="relative group/img overflow-hidden cursor-zoom-in"
                            onClick={() => onOpenViewer([block.content.url], 0)}
                        >
                            <img src={block.content.url} alt={block.content.name || 'Uploaded image'} className="w-full h-auto" />
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                        </div>
                    )}

                    {/* Video Block */}
                    {block.type === 'video' && block.content?.url && (
                        <div className="relative overflow-hidden">
                            <video src={block.content.url} controls className="w-full h-auto" />
                        </div>
                    )}

                    {/* Grid Block */}
                    {block.type === 'grid' && (
                        <ViewerGridBlock
                            content={(block.content as GridBlockContent) || { images: [], layout: '2-cols' }}
                            gridGap={block.settings?.gridGap}
                            onOpenViewer={onOpenViewer}
                        />
                    )}

                    {/* Blank Block */}
                    {block.type === 'blank' && (
                        <div
                            className="relative flex items-center justify-center transition-all bg-transparent"
                            style={{ height: `${block.settings?.blankHeight || 80}px` }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// Grid Block Component for Viewer
function ViewerGridBlock({
    content,
    gridGap,
    onOpenViewer
}: {
    content: GridBlockContent,
    gridGap?: number,
    onOpenViewer: (images: string[], index: number) => void
}) {
    const getGridCols = () => {
        switch (content.layout) {
            case '2-cols': return 'grid-cols-2'
            case '3-cols': return 'grid-cols-3'
            case '4-cols': return 'grid-cols-4'
            case 'masonry': return 'grid-cols-2 md:grid-cols-3'
            default: return 'grid-cols-2'
        }
    }

    if (content.images.length === 0) {
        return null
    }

    const allImageUrls = content.images.map(img => img.url)

    return (
        <div
            className={cn("grid", getGridCols())}
            style={{ gap: `${gridGap ?? 8}px` }}
        >
            {content.images.map((image, idx) => (
                <div
                    key={image.id}
                    className="relative group/img overflow-hidden cursor-zoom-in h-full"
                    onClick={() => onOpenViewer(allImageUrls, idx)}
                >
                    <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                </div>
            ))}
        </div>
    )
}
