"use client"

import * as React from "react"
import {
    X,
    Image as ImageIcon,
    Type,
    Video as VideoIcon,
    Grid,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Plus,
    Minus,
    Trash2,
    MoveVertical,
    ArrowLeft,
    Upload,
    Settings2,
    RefreshCw,
    GripVertical,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Palette,
    Maximize2,
    Minimize2,
    SquareDashed,
    Eye,
    Pencil,
    Copy,
} from "lucide-react"
import { ImageViewer } from "./ImageViewer"
import { motion, AnimatePresence } from "framer-motion"

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { saveProjectContent, publishProject, uploadProjectMedia } from "@/app/actions/project-editor"

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


interface EditorBlock {
    id: string
    type: 'text' | 'image' | 'video' | 'grid' | 'blank'
    content: any // Using any for now to handle unions safely in state updates
    settings?: BlockSettings
}


interface GridImage {
    id: string
    url: string
    name: string
}

interface GridBlockContent {
    images: { id: string; url: string; name: string }[]
    layout: '2-cols' | '3-cols' | '4-cols' | 'masonry'
}

interface ProjectEditorModalProps {
    isOpen: boolean
    onClose: () => void
    initialProject?: {
        id: string
        name: string
        content_json: EditorBlock[]
        category?: string
        tags?: string[]
        cover_url?: string
        visibility?: string
    }
}

export function ProjectEditorModal({ isOpen, onClose, initialProject }: ProjectEditorModalProps) {
    const [step, setStep] = React.useState<1 | 2>(1)
    const [blocks, setBlocks] = React.useState<EditorBlock[]>(() => {
        const content = initialProject?.content_json
        if (Array.isArray(content)) return content
        if (content && typeof content === 'object') return (content as any).blocks || []
        return []
    })
    const [projectSettings, setProjectSettings] = React.useState({
        blockGap: (() => {
            const content = initialProject?.content_json
            if (content && typeof content === 'object' && !Array.isArray(content)) {
                return (content as any).settings?.blockGap ?? 0
            }
            return 0
        })()
    })
    const [showProjectSettings, setShowProjectSettings] = React.useState(false)
    const [title, setTitle] = React.useState(initialProject?.name || "")
    const [category, setCategory] = React.useState(initialProject?.category || "")
    const [tags, setTags] = React.useState(initialProject?.tags?.join(", ") || "")
    const [isSaving, setIsSaving] = React.useState(false)
    const [isPublishing, setIsPublishing] = React.useState(false)
    const [activeId, setActiveId] = React.useState<string | null>(null)
    const [previewMode, setPreviewMode] = React.useState(false)
    const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(initialProject?.cover_url || null)
    const [isUploadingCover, setIsUploadingCover] = React.useState(false)
    const coverInputRef = React.useRef<HTMLInputElement>(null)
    const [visibility, setVisibility] = React.useState<'everyone' | 'private'>(initialProject?.visibility as any || 'everyone')
    const [viewerState, setViewerState] = React.useState<{ isOpen: boolean, images: string[], index: number }>({
        isOpen: false,
        images: [],
        index: 0
    })
    const titleRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto'
            titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
        }
    }, [title])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleAddBlock = (type: EditorBlock['type'], index?: number) => {
        const newBlock: EditorBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: type === 'text' ? '' : type === 'grid' ? { images: [], layout: '2-cols' } : {},
            settings: type === 'blank' ? { blankHeight: 80 } : undefined
        }

        if (typeof index === 'number') {
            setBlocks(prev => {
                const newBlocks = [...prev]
                newBlocks.splice(index, 0, newBlock)
                return newBlocks
            })
        } else {
            setBlocks(prev => [...prev, newBlock])
        }
    }


    const handleUpdateBlock = (id: string, content: any) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
    }

    const handleUpdateBlockSettings = (id: string, settings: BlockSettings) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, settings: { ...b.settings, ...settings } } : b))
    }

    const handleDeleteBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id))
    }

    const handleDuplicateBlock = (id: string) => {
        setBlocks((prev) => {
            const index = prev.findIndex(b => b.id === id)
            if (index === -1) return prev
            const blockToCopy = prev[index]
            const newBlock: EditorBlock = {
                ...blockToCopy,
                id: Math.random().toString(36).substr(2, 9),
                content: JSON.parse(JSON.stringify(blockToCopy.content)),
                settings: blockToCopy.settings ? { ...blockToCopy.settings } : undefined
            }
            const newBlocks = [...prev]
            newBlocks.splice(index + 1, 0, newBlock)
            return newBlocks
        })
    }

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !initialProject?.id) return
        setIsUploadingCover(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('projectId', initialProject.id)
            const res = await uploadProjectMedia(formData)
            if (res.success && res.url) {
                setCoverImageUrl(res.url)
            } else {
                alert("Cover upload failed: " + res.error)
            }
        } catch (err) {
            console.error("Cover upload error:", err)
        }
        setIsUploadingCover(false)
    }

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id)
                const newIndex = items.findIndex(i => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
        setActiveId(null)
    }

    const handleMoveBlockUp = (id: string) => {
        setBlocks((items) => {
            const index = items.findIndex(i => i.id === id)
            if (index > 0) {
                return arrayMove(items, index, index - 1)
            }
            return items
        })
    }

    const handleMoveBlockDown = (id: string) => {
        setBlocks((items) => {
            const index = items.findIndex(i => i.id === id)
            if (index < items.length - 1) {
                return arrayMove(items, index, index + 1)
            }
            return items
        })
    }

    const handleSave = async () => {
        if (!initialProject?.id) return
        setIsSaving(true)
        const res = await saveProjectContent(initialProject.id, {
            name: title,
            content_json: {
                blocks,
                settings: projectSettings
            },
            category: category,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
            cover_url: coverImageUrl || undefined,
            visibility: visibility
        } as any)

        if (!res.success) {
            alert("Error saving project: " + res.error)
        }
        setIsSaving(false)
        return res.success
    }

    const handlePublish = async () => {
        if (!initialProject?.id) return
        setIsPublishing(true)
        const saved = await handleSave()
        if (saved) {
            const res = await publishProject(initialProject.id)
            if (res.success) {
                onClose()
            } else {
                alert("Error publishing project: " + res.error)
            }
        }
        setIsPublishing(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[99999] bg-bg-1 flex flex-col w-screen h-screen overflow-hidden text-text-primary">
            {/* Header */}
            <header className="h-[72px] border-b border-bg-3 bg-white dark:bg-bg-1 flex items-center justify-between px-8 shrink-0 z-[60]">
                <div className="flex items-center gap-4 w-[200px]">
                    {step === 1 ? (
                        <button onClick={onClose} className="p-2 hover:bg-bg-3 rounded-full transition-colors">
                            <X className="w-5 h-5 text-text-secondary" />
                        </button>
                    ) : (
                        <button onClick={() => setStep(1)} className="p-2 hover:bg-bg-3 rounded-full transition-colors flex items-center gap-2 text-sm font-bold text-text-secondary">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}
                </div>

                <div className="flex-1 flex justify-center py-2">
                    <textarea
                        ref={titleRef}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent border-none text-[17px] font-bold text-text-primary text-center focus:outline-none focus:ring-0 min-w-[300px] w-full max-w-[500px] resize-none overflow-hidden leading-tight"
                        placeholder="Name your project"
                        rows={1}
                    />
                </div>

                {/* Preview/Edit Toggle */}
                <div className="flex items-center gap-2 bg-bg-2 rounded-full p-1">
                    <button
                        onClick={() => setPreviewMode(false)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${!previewMode
                            ? 'bg-white dark:bg-bg-1 text-accent-indigo shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </button>
                    <button
                        onClick={() => setPreviewMode(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${previewMode
                            ? 'bg-white dark:bg-bg-1 text-accent-indigo shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        Preview
                    </button>
                </div>

                <div className="flex items-center gap-4 w-[200px] justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-[14px] font-bold text-text-secondary hover:text-text-primary transition-colors"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            className="bg-accent-indigo px-6 py-2.5 rounded-full text-[14px] font-bold text-white shadow-lg hover:shadow-accent-indigo/20 transition-all hover:scale-105 active:scale-95"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="bg-accent-indigo px-6 py-2.5 rounded-full text-[14px] font-bold text-white shadow-lg hover:shadow-accent-indigo/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {isPublishing ? "Publishing..." : "Publish"}
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col relative">
                {step === 1 ? (
                    <>
                        <main className="flex-1 overflow-y-auto bg-bg-2 py-20 px-4 custom-scrollbar">
                            <div className="max-w-[1400px] mx-auto bg-white dark:bg-bg-1 min-h-[calc(100vh-160px)] shadow-lg rounded-sm p-4 md:px-12 md:pb-12 md:pt-0 relative mb-32">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={({ active }) => setActiveId(active.id as string)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div
                                        className="flex flex-col"
                                        style={{ gap: `${projectSettings.blockGap}px` }}
                                    >
                                        <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                                            {blocks.map((block, index) => (
                                                <SortableBlock
                                                    key={block.id}
                                                    block={block}
                                                    projectId={initialProject?.id || ''}
                                                    onUpdate={(content) => handleUpdateBlock(block.id, content)}
                                                    onUpdateSettings={(settings) => handleUpdateBlockSettings(block.id, settings)}
                                                    onDelete={() => handleDeleteBlock(block.id)}
                                                    onMoveUp={() => handleMoveBlockUp(block.id)}
                                                    onMoveDown={() => handleMoveBlockDown(block.id)}
                                                    onDuplicate={() => handleDuplicateBlock(block.id)}
                                                    onInsert={(type, pos) => handleAddBlock(type, pos === 'top' ? index : index + 1)}
                                                    previewMode={previewMode}
                                                    onOpenViewer={(images, index) => setViewerState({ isOpen: true, images, index })}
                                                />
                                            ))}

                                        </SortableContext>
                                    </div>

                                    <DragOverlay>
                                        {activeId ? (
                                            <div className="bg-bg-3 p-4 rounded-xl border border-accent-indigo opacity-70 cursor-grabbing shadow-2xl">
                                                Moving block...
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>

                                {/* Image Viewer */}
                                <ImageViewer
                                    isOpen={viewerState.isOpen}
                                    onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                                    images={viewerState.images}
                                    currentIndex={viewerState.index}
                                    onNavigate={(index) => setViewerState(prev => ({ ...prev, index }))}
                                />

                                {blocks.length === 0 && (
                                    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-16 py-20">
                                        <h2 className="text-[28px] font-medium text-text-primary">
                                            Comece a criar seu projeto:
                                        </h2>
                                        <div className="flex items-center justify-center gap-12">
                                            <EmptyStateButton
                                                icon={<ImageIcon className="w-7 h-7" />}
                                                label="Imagem"
                                                onClick={() => handleAddBlock('image')}
                                            />
                                            <EmptyStateButton
                                                icon={<Type className="w-7 h-7" />}
                                                label="Texto"
                                                onClick={() => handleAddBlock('text')}
                                            />
                                            <EmptyStateButton
                                                icon={<Grid className="w-7 h-7" />}
                                                label="Grade de fotos"
                                                onClick={() => handleAddBlock('grid')}
                                            />
                                            <EmptyStateButton
                                                icon={<VideoIcon className="w-7 h-7" />}
                                                label="Vídeo e áudio"
                                                onClick={() => handleAddBlock('video')}
                                            />
                                            <EmptyStateButton
                                                icon={<SquareDashed className="w-7 h-7" />}
                                                label="Espaço em branco"
                                                onClick={() => handleAddBlock('blank')}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>

                        {/* Floating Toolbar - Hidden in preview mode */}
                        {!previewMode && (
                            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white dark:bg-bg-1 p-1.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-bg-3 flex items-center z-[100] scale-110">
                                <div className="flex items-center px-4 py-2 border-r border-bg-3 mr-1">
                                    <div className="p-2 bg-accent-indigo/10 rounded-lg mr-3">
                                        <Plus className="w-4 h-4 text-accent-indigo" />
                                    </div>
                                    <span className="text-[12px] font-bold text-text-primary whitespace-nowrap">Add Content</span>
                                </div>
                                <ToolbarButton icon={<ImageIcon className="w-5 h-5" />} label="Image" onClick={() => handleAddBlock('image')} />
                                <ToolbarButton icon={<Type className="w-5 h-5" />} label="Text" onClick={() => handleAddBlock('text')} />
                                <ToolbarButton icon={<Grid className="w-5 h-5" />} label="Grid" onClick={() => handleAddBlock('grid')} />
                                <ToolbarButton icon={<VideoIcon className="w-5 h-5" />} label="Video" onClick={() => handleAddBlock('video')} />
                                <ToolbarButton icon={<SquareDashed className="w-5 h-5" />} label="Blank" onClick={() => handleAddBlock('blank')} />
                                <div className="h-10 w-[1px] bg-bg-3 mx-2" />
                                <button
                                    onClick={() => setShowProjectSettings(!showProjectSettings)}
                                    className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all group ${showProjectSettings ? 'bg-bg-3' : 'hover:bg-bg-2'}`}
                                >
                                    <div className={`transition-colors ${showProjectSettings ? 'text-accent-indigo' : 'text-text-secondary group-hover:text-accent-indigo'}`}>
                                        <Settings2 className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[11px] font-bold transition-colors ${showProjectSettings ? 'text-text-secondary' : 'text-text-tertiary group-hover:text-text-secondary'}`}>Canvas</span>
                                </button>

                                {showProjectSettings && (
                                    <div className="absolute bottom-[calc(100%+20px)] left-1/2 -translate-x-1/2 bg-white dark:bg-bg-1 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-bg-3 w-[280px] z-[110] animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-bold text-text-primary">Canvas Settings</h3>
                                            <button onClick={() => setShowProjectSettings(false)} className="text-text-tertiary hover:text-text-primary">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-xs text-text-secondary">
                                                    <span>Block Gap</span>
                                                    <span className="font-bold text-accent-indigo bg-accent-indigo/10 px-2 py-0.5 rounded">{projectSettings.blockGap}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="200"
                                                    step="4"
                                                    value={projectSettings.blockGap}
                                                    onChange={(e) => setProjectSettings({ ...projectSettings, blockGap: parseInt(e.target.value) })}
                                                    className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer accent-accent-indigo"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </>
                ) : (
                    /* Step 2: Project Metadata */
                    <main className="flex-1 overflow-y-auto bg-bg-2 py-20 px-4 custom-scrollbar flex justify-center">
                        <div className="max-w-2xl w-full space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold text-text-primary">Project Info</h2>
                                <div
                                    onClick={() => coverInputRef.current?.click()}
                                    className="relative aspect-[4/3] w-64 bg-bg-3 rounded-2xl border-2 border-dashed border-bg-4 hover:border-accent-indigo transition-all flex flex-col items-center justify-center gap-3 text-text-tertiary cursor-pointer group shadow-inner overflow-hidden"
                                >
                                    {coverImageUrl ? (
                                        <>
                                            <img src={coverImageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                                                <Upload className="w-6 h-6" />
                                                <span className="text-[14px] font-bold">Change Cover</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-bg-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {isUploadingCover ? <RefreshCw className="w-6 h-6 animate-spin text-accent-indigo" /> : <Upload className="w-6 h-6" />}
                                            </div>
                                            <span className="text-[14px] font-bold">{isUploadingCover ? 'Uploading...' : 'Edit Cover Image'}</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleCoverUpload}
                                />
                            </section>

                            <section className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-white dark:bg-bg-1 border border-bg-3 rounded-2xl px-6 py-4 text-[15px] font-medium focus:ring-2 focus:ring-accent-indigo outline-none shadow-sm transition-all"
                                    >
                                        <option value="">Select a Category</option>
                                        <option value="ui-ux">UI/UX Design</option>
                                        <option value="branding">Branding</option>
                                        <option value="illustration">Illustration</option>
                                        <option value="architecture">Architecture</option>
                                        <option value="photography">Photography</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest">Tags</label>
                                    <input
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full bg-white dark:bg-bg-1 border border-bg-3 rounded-2xl px-6 py-4 text-[15px] font-medium placeholder:text-text-tertiary focus:ring-2 focus:ring-accent-indigo outline-none shadow-sm transition-all"
                                        placeholder="Add descriptive tags (e.g. Minimalist, Case Study)"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest">Visibility</label>
                                    <div
                                        onClick={() => setVisibility(v => v === 'everyone' ? 'private' : 'everyone')}
                                        className="flex items-center gap-3 p-6 bg-white dark:bg-bg-1 rounded-2xl border border-bg-3 shadow-sm cursor-pointer hover:border-accent-indigo transition-all select-none"
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${visibility === 'everyone' ? 'bg-green-500 shadow-green-500/50' : 'bg-amber-500 shadow-amber-500/50'}`} />
                                        <span className="text-[15px] font-bold text-text-primary capitalize">{visibility}</span>
                                        <div className="ml-auto text-text-tertiary">
                                            <RefreshCw className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </main>
                )}
            </div>
        </div>
    )
}

function EmptyStateButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-4 group"
        >
            <div className="w-[88px] h-[88px] rounded-full bg-[#ff005410] flex items-center justify-center text-accent-indigo group-hover:bg-accent-indigo group-hover:text-white transition-all duration-200 group-hover:scale-105">
                {icon}
            </div>
            <span className="text-[14px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
        </button>
    )
}

function ToolbarButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-bg-2 transition-all group"
        >
            <div className="text-text-secondary group-hover:text-accent-indigo transition-colors overflow-hidden">
                {icon}
            </div>
            <span className="text-[11px] font-bold text-text-tertiary transition-colors group-hover:text-text-secondary">{label}</span>
        </button>
    )
}


function BlockStyleControls({
    settings,
    onUpdate,
    type,
    onClose
}: {
    settings: BlockSettings,
    onUpdate: (s: BlockSettings) => void,
    type: string,
    onClose: () => void
}) {
    const [position, setPosition] = React.useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
    const [customColor, setCustomColor] = React.useState('#000000')
    const [customTextColor, setCustomTextColor] = React.useState('#000000')
    const bgColorInputRef = React.useRef<HTMLInputElement>(null)
    const textColorInputRef = React.useRef<HTMLInputElement>(null)
    const popoverRef = React.useRef<HTMLDivElement>(null)


    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                })
            }
        }
        const handleMouseUp = () => setIsDragging(false)

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragStart])

    const colors = [
        { name: 'Transparent', value: 'transparent' },
        { name: 'White', value: '#ffffff' },
        { name: 'Black', value: '#000000' },
        { name: 'Gray', value: '#f3f4f6' },
        { name: 'Brand', value: '#ff0054' },
        { name: 'Accent', value: '#4f46e5' }
    ]

    const fonts = [
        { name: 'Padrão', value: 'inherit' },
        { name: 'Inter', value: 'Inter, sans-serif' },
        { name: 'Roboto', value: 'Roboto, sans-serif' },
        { name: 'Outfit', value: 'Outfit, sans-serif' },
        { name: 'Poppins', value: 'Poppins, sans-serif' },
        { name: 'Playfair', value: 'Playfair Display, serif' },
        { name: 'Montserrat', value: 'Montserrat, sans-serif' },
        { name: 'Open Sans', value: 'Open Sans, sans-serif' },
        { name: 'Mono', value: 'monospace' },
    ]

    const isMediaBlock = type === 'grid' || type === 'image' || type === 'video' || type === 'blank'
    const isGridBlock = type === 'grid'


    const handleCustomColorApply = (color: string) => {
        onUpdate({ backgroundColor: color })
    }

    const handleCustomTextColorApply = (color: string) => {
        onUpdate({ textColor: color })
    }

    return (
        <div
            ref={popoverRef}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className="absolute left-full top-0 ml-3 bg-bg-1 border border-bg-3 rounded-lg shadow-2xl w-[320px] max-h-[580px] z-[100] animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden"
        >

            {/* Draggable Header - Fixed */}
            <div
                onMouseDown={handleMouseDown}
                className="h-[40px] min-h-[40px] bg-[#ff0054] flex items-center justify-between px-4 cursor-move select-none rounded-t-lg"
            >
                <span className="text-[13px] font-bold text-white">Configurações do Bloco</span>
                <button
                    onClick={onClose}
                    className="w-[15px] h-[15px] rounded-full bg-black hover:bg-gray-800 transition-colors flex items-center justify-center"
                />
            </div>

            {/* Scrollable Content */}
            <div
                className="popover-scroll p-5 space-y-5 overflow-y-auto flex-1"
            >
                <style>{`
                    .popover-scroll {
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                    }
                    .popover-scroll::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {/* Full Width Toggle - Only for media blocks */}
                {isMediaBlock && (
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Largura</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onUpdate({ fullWidth: false })}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${!settings.fullWidth ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo' : 'border-bg-3 text-text-tertiary hover:border-text-tertiary'}`}
                            >
                                <Minimize2 className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Normal</span>
                            </button>
                            <button
                                onClick={() => onUpdate({ fullWidth: true })}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${settings.fullWidth ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo' : 'border-bg-3 text-text-tertiary hover:border-text-tertiary'}`}
                            >
                                <Maximize2 className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Full</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Grid Gap - Only for grid blocks */}
                {isGridBlock && (
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Espaço entre Imagens</label>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-text-tertiary font-medium">Gap: {settings.gridGap ?? 8}px</span>
                            <div className="relative h-6 flex items-center">
                                <input
                                    type="range" min="0" max="32" step="2"
                                    value={settings.gridGap ?? 8}
                                    onChange={(e) => onUpdate({ gridGap: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer accent-accent-indigo"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Background Color */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Cor de Fundo</label>
                    <div className="flex gap-2.5 flex-wrap">
                        {colors.map(color => (
                            <button
                                key={color.value}
                                title={color.name}
                                onClick={() => onUpdate({ backgroundColor: color.value })}
                                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${settings.backgroundColor === color.value ? 'border-accent-indigo shadow-md ring-2 ring-accent-indigo/20' : 'border-bg-3 hover:border-text-tertiary'}`}
                                style={{ backgroundColor: color.value === 'transparent' ? undefined : color.value }}
                            >
                                {color.value === 'transparent' && (
                                    <div className="w-full h-full bg-white relative overflow-hidden rounded-full">
                                        <div className="absolute inset-x-0 top-[45%] h-[2px] bg-red-500 rotate-45" />
                                    </div>
                                )}
                            </button>
                        ))}
                        {/* Custom color picker button */}
                        <div className="relative">
                            <button
                                title="Cor personalizada"
                                onClick={() => bgColorInputRef.current?.click()}
                                className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center border-bg-3 hover:border-text-tertiary"
                                style={{ background: 'linear-gradient(135deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)' }}
                            >
                                <Plus className="w-4 h-4 text-white drop-shadow-md" />
                            </button>
                            <input
                                ref={bgColorInputRef}
                                type="color"
                                value={customColor}
                                onChange={(e) => {
                                    setCustomColor(e.target.value)
                                    handleCustomColorApply(e.target.value)
                                }}
                                className="absolute opacity-0 w-0 h-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Block Spacing */}
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Espaçamento do Bloco (px)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-text-tertiary font-medium">Topo: {settings.paddingTop || 0}px</span>
                            <div className="relative h-6 flex items-center">
                                <input
                                    type="range" min="0" max="200" step="10"
                                    value={settings.paddingTop || 0}
                                    onChange={(e) => onUpdate({ paddingTop: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer accent-accent-indigo"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-text-tertiary font-medium">Base: {settings.paddingBottom || 0}px</span>
                            <div className="relative h-6 flex items-center">
                                <input
                                    type="range" min="0" max="200" step="10"
                                    value={settings.paddingBottom || 0}
                                    onChange={(e) => onUpdate({ paddingBottom: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer accent-accent-indigo"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Formatting Controls */}
                {type === 'text' && (
                    <div className="space-y-4 border-t border-bg-3 pt-5">
                        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Formatação de Texto</label>

                        <div className="flex flex-col gap-3">
                            {/* Font Family Selector */}
                            <div className="space-y-2">
                                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Fonte</span>
                                <select
                                    value={settings.fontFamily || 'inherit'}
                                    onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                                    className="w-full bg-bg-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-text-primary border border-bg-3 outline-none focus:border-accent-indigo"
                                >
                                    {fonts.map(font => (
                                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                            {font.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Alignment */}
                            <div className="flex items-center gap-1 bg-bg-2 p-1 rounded-lg self-start">
                                <button
                                    onClick={() => onUpdate({ textAlign: 'left' })}
                                    className={`p-2 rounded-md transition-all ${settings.textAlign === 'left' ? 'bg-bg-1 text-accent-indigo shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                                >
                                    <AlignLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onUpdate({ textAlign: 'center' })}
                                    className={`p-2 rounded-md transition-all ${settings.textAlign === 'center' ? 'bg-bg-1 text-accent-indigo shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                                >
                                    <AlignCenter className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onUpdate({ textAlign: 'right' })}
                                    className={`p-2 rounded-md transition-all ${settings.textAlign === 'right' ? 'bg-bg-1 text-accent-indigo shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                                >
                                    <AlignRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Bold and Size */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onUpdate({ fontWeight: settings.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                    className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${settings.fontWeight === 'bold' ? 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo' : 'bg-bg-2 text-text-tertiary border-transparent hover:border-bg-3'}`}
                                >
                                    <Bold className="w-4 h-4" />
                                    <span className="text-[12px] font-bold">Negrito</span>
                                </button>

                                <div className="flex-1 flex items-center gap-2 bg-bg-2 px-3 py-2 rounded-lg border border-transparent">
                                    <span className="text-[11px] text-text-tertiary font-bold uppercase shrink-0">Tamanho</span>
                                    <select
                                        value={settings.fontSize || 22}
                                        onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                                        className="bg-transparent text-[13px] font-bold text-text-primary w-full outline-none"
                                    >
                                        {[14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 64].map(s => (
                                            <option key={s} value={s}>{s}px</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Text Color */}
                            <div className="space-y-2">
                                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Cor do Texto</span>
                                <div className="flex gap-2 flex-wrap items-center">
                                    {['#111827', '#6B7280', '#ffffff', '#ff0054', '#4f46e5'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => onUpdate({ textColor: color })}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${settings.textColor === color ? 'border-accent-indigo ring-2 ring-accent-indigo/20' : 'border-bg-3'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    {/* Custom text color picker */}
                                    <div className="relative">
                                        <button
                                            title="Cor personalizada"
                                            onClick={() => textColorInputRef.current?.click()}
                                            className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center border-bg-3 hover:border-text-tertiary"
                                            style={{ background: 'linear-gradient(135deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)' }}
                                        >
                                            <Plus className="w-3 h-3 text-white drop-shadow-md" />
                                        </button>
                                        <input
                                            ref={textColorInputRef}
                                            type="color"
                                            value={customTextColor}
                                            onChange={(e) => {
                                                setCustomTextColor(e.target.value)
                                                handleCustomTextColorApply(e.target.value)
                                            }}
                                            className="absolute opacity-0 w-0 h-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Text Container Padding */}
                            <div className="space-y-3 border-t border-bg-3 pt-4">
                                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Padding do Contentor</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] text-text-tertiary font-medium">Esquerda: {settings.paddingLeft || 0}px</span>
                                        <input
                                            type="range" min="0" max="100" step="5"
                                            value={settings.paddingLeft || 0}
                                            onChange={(e) => onUpdate({ paddingLeft: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer accent-accent-indigo"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] text-text-tertiary font-medium">Direita: {settings.paddingRight || 0}px</span>
                                        <input
                                            type="range" min="0" max="100" step="5"
                                            value={settings.paddingRight || 0}
                                            onChange={(e) => onUpdate({ paddingRight: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer accent-accent-indigo"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Blank Block Height Control */}
                {type === 'blank' && (
                    <div className="space-y-3 border-t border-bg-3 pt-5">
                        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Altura do Espaço</label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-text-secondary font-medium">{settings.blankHeight || 80}px</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onUpdate({ blankHeight: Math.max(20, (settings.blankHeight || 80) - 10) })}
                                        className="w-6 h-6 rounded-full bg-bg-2 hover:bg-bg-3 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onUpdate({ blankHeight: Math.min(500, (settings.blankHeight || 80) + 10) })}
                                        className="w-6 h-6 rounded-full bg-bg-2 hover:bg-bg-3 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="500"
                                step="10"
                                value={settings.blankHeight || 80}
                                onChange={(e) => onUpdate({ blankHeight: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer accent-accent-indigo"
                            />
                            <div className="flex justify-between text-[10px] text-text-tertiary">
                                <span>20px</span>
                                <span>500px</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

function InserterButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="w-9 h-9 bg-[#F9F9F9] rounded-full flex items-center justify-center text-[#ff0054] hover:bg-white transition-all transform hover:scale-110 active:scale-95 shadow-md flex-shrink-0"
        >
            {icon}
        </button>
    )
}

function BlockInserter({ onInsert, position }: { onInsert: (type: EditorBlock['type']) => void, position: 'top' | 'bottom' }) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    return (
        <div
            className={`absolute left-0 right-0 h-[2px] z-[100] group/inserter flex items-center justify-center transition-all duration-300 pointer-events-none ${isExpanded ? 'opacity-100 h-14' : 'opacity-0 group-hover/block:opacity-100'}`}
            style={{
                [position]: '-1px',
                transform: position === 'top' ? 'translateY(-50%)' : 'translateY(50%)'
            }}
        >
            {/* The line */}
            <div
                className={`absolute left-0 right-0 h-[1px] bg-[#ff0054] transition-all duration-300 ${isExpanded ? 'opacity-0' : 'opacity-100'}`}
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />

            <div className="relative pointer-events-auto">
                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        <motion.button
                            key="plus"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => setIsExpanded(true)}
                            className="w-7 h-7 bg-[#ff0054] rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(255,0,84,0.3)] hover:scale-110 transition-transform active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ scale: 0.8, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 10 }}
                            className="bg-[#ff0054] rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_10px_30px_rgba(255,0,84,0.4)] relative border border-white/10"
                        >
                            <InserterButton icon={<ImageIcon className="w-4 h-4" />} label="Image" onClick={() => { onInsert('image'); setIsExpanded(false); }} />
                            <InserterButton icon={<Type className="w-4 h-4" />} label="Text" onClick={() => { onInsert('text'); setIsExpanded(false); }} />
                            <InserterButton icon={<Grid className="w-4 h-4" />} label="Grid" onClick={() => { onInsert('grid'); setIsExpanded(false); }} />
                            <InserterButton icon={<VideoIcon className="w-4 h-4" />} label="Video" onClick={() => { onInsert('video'); setIsExpanded(false); }} />
                            <InserterButton icon={<SquareDashed className="w-4 h-4" />} label="Blank" onClick={() => { onInsert('blank'); setIsExpanded(false); }} />
                            <div className="w-[1px] h-4 bg-white/20 mx-1" />
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function SortableBlock({ block, projectId, onUpdate, onUpdateSettings, onDelete, onDuplicate, onMoveUp, onMoveDown, onInsert, previewMode, onOpenViewer }: {
    block: EditorBlock,
    projectId: string,
    onUpdate: (content: any) => void,
    onUpdateSettings: (settings: BlockSettings) => void,
    onDelete: () => void,
    onDuplicate: () => void,
    onMoveUp: () => void,
    onMoveDown: () => void,
    onInsert: (type: EditorBlock['type'], position: 'top' | 'bottom') => void,
    previewMode: boolean,
    onOpenViewer: (images: string[], index: number) => void
}) {




    const [showGridEditor, setShowGridEditor] = React.useState(false)
    const [showStyles, setShowStyles] = React.useState(false)
    const imageInputRef = React.useRef<HTMLInputElement>(null)
    const videoInputRef = React.useRef<HTMLInputElement>(null)
    const [isUploadingImage, setIsUploadingImage] = React.useState(false)
    const [isUploadingVideo, setIsUploadingVideo] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (block.type === 'text' && textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [block.content, block.type, previewMode])

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: block.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !projectId) return
        setIsUploadingImage(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('projectId', projectId)
            const res = await uploadProjectMedia(formData)
            if (res.success && res.url) {
                onUpdate({ url: res.url, name: file.name })
            } else {
                alert("Image upload failed: " + res.error)
            }
        } catch (err) {
            console.error("Image upload error:", err)
        }
        setIsUploadingImage(false)
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !projectId) return
        setIsUploadingVideo(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('projectId', projectId)
            const res = await uploadProjectMedia(formData)
            if (res.success && res.url) {
                onUpdate({ url: res.url, name: file.name })
            } else {
                alert("Video upload failed: " + res.error)
            }
        } catch (err) {
            console.error("Video upload error:", err)
        }
        setIsUploadingVideo(false)
        if (videoInputRef.current) videoInputRef.current.value = ''
    }

    const isFullWidth = block.settings?.fullWidth

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                backgroundColor: block.settings?.backgroundColor || 'transparent',
                paddingTop: `${block.settings?.paddingTop ?? 0}px`,
                paddingBottom: `${block.settings?.paddingBottom ?? 0}px`,
                marginLeft: isFullWidth ? '-48px' : 0,
                marginRight: isFullWidth ? '-48px' : 0,
            }}
            className="group group/block relative rounded-sm transition-all hover:z-[70]"
        >
            {!previewMode && (
                <>
                    <BlockInserter onInsert={(type) => onInsert(type, 'top')} position="top" />
                    <BlockInserter onInsert={(type) => onInsert(type, 'bottom')} position="bottom" />
                </>
            )}

            {/* Left side controls - 23px from container inner left edge - Hidden in preview mode */}
            {!previewMode && (
                <div
                    className="absolute top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2 z-[80]"
                    style={{ left: '-25px' }}
                >
                    <div {...attributes} {...listeners} className="p-2.5 cursor-grab active:cursor-grabbing text-text-secondary hover:text-accent-indigo bg-bg-1 rounded-full shadow-lg border border-bg-3 transition-colors">
                        <MoveVertical className="w-4 h-4" />
                    </div>

                    <button
                        onClick={() => setShowStyles(!showStyles)}
                        className={`p-2.5 text-text-secondary hover:text-accent-indigo bg-bg-1 rounded-full shadow-lg border border-bg-3 transition-colors ${showStyles ? 'text-accent-indigo border-accent-indigo' : ''}`}
                    >
                        <Palette className="w-4 h-4" />
                    </button>

                    {block.type === 'grid' && (
                        <button
                            onClick={() => setShowGridEditor(true)}
                            className="p-2.5 text-text-secondary hover:text-accent-indigo bg-bg-1 rounded-full shadow-lg border border-bg-3 transition-colors"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={onDuplicate} title="Duplicar bloco" className="p-2.5 text-text-secondary hover:text-accent-indigo bg-bg-1 rounded-full shadow-lg border border-bg-3 transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} title="Excluir bloco" className="p-2.5 text-text-secondary hover:text-red-500 bg-bg-1 rounded-full shadow-lg border border-bg-3 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>

                    {showStyles && (
                        <BlockStyleControls
                            settings={block.settings || {}}
                            type={block.type}
                            onUpdate={onUpdateSettings}
                            onClose={() => setShowStyles(false)}
                        />
                    )}
                </div>
            )}

            {/* Right side - Up/Down buttons - 23px from container inner right edge - Hidden in preview mode */}
            {!previewMode && (
                <div
                    className="absolute top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 z-[80]"
                    style={{ right: '-25px' }}
                >
                    <button
                        onClick={onMoveUp}
                        className="p-2 text-text-secondary hover:text-accent-indigo bg-bg-1 rounded-full shadow-lg border border-bg-3 transition-colors hover:scale-110"
                        title="Mover para cima"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onMoveDown}
                        className="p-2 text-text-secondary hover:text-accent-indigo bg-bg-1 rounded-full shadow-lg border border-bg-3 transition-colors hover:scale-110"
                        title="Mover para baixo"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className={isFullWidth ? 'px-0' : 'px-4 md:px-0'}>
                <div style={{
                    paddingLeft: `${block.settings?.paddingLeft || 0}px`,
                    paddingRight: `${block.settings?.paddingRight || 0}px`
                }}>
                    {block.type === 'text' && (
                        <>
                            {previewMode ? (
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
                            ) : (
                                <textarea
                                    ref={textareaRef}
                                    value={block.content}
                                    onChange={(e) => onUpdate(e.target.value)}
                                    placeholder="Click to start typing..."
                                    style={{
                                        textAlign: block.settings?.textAlign || 'left',
                                        fontSize: `${block.settings?.fontSize || 22}px`,
                                        fontWeight: block.settings?.fontWeight || 'normal',
                                        fontFamily: block.settings?.fontFamily || 'inherit',
                                        color: block.settings?.textColor || 'inherit',
                                    }}
                                    className="w-full bg-transparent border-none resize-none leading-[1.6] placeholder:text-text-tertiary focus:outline-none min-h-[40px] p-0"
                                />
                            )}
                        </>
                    )}


                    {block.type === 'image' && !block.content?.url && !previewMode && (
                        <>
                            <div className="min-h-[300px] border border-bg-3 rounded-sm bg-bg-1 flex flex-col items-center justify-center gap-8 py-12 relative overflow-hidden">
                                {isUploadingImage ? (
                                    <div className="flex flex-col items-center gap-4 animate-pulse">
                                        <div className="w-14 h-14 rounded-full bg-bg-3 flex items-center justify-center">
                                            <RefreshCw className="w-7 h-7 text-accent-indigo animate-spin" />
                                        </div>
                                        <span className="text-[16px] font-medium text-text-secondary">Enviando imagem...</span>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-[20px] font-normal text-text-primary">Adicione uma imagem:</h3>
                                        <button
                                            onClick={() => imageInputRef.current?.click()}
                                            className="flex flex-col items-center gap-4 group"
                                        >
                                            <div className="w-[88px] h-[88px] rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover:bg-accent-indigo group-hover:text-white transition-all duration-200 group-hover:scale-105">
                                                <ImageIcon className="w-7 h-7" />
                                            </div>
                                            <span className="text-[14px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">Carregar Imagem</span>
                                        </button>
                                    </>
                                )}
                            </div>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </>
                    )}

                    {block.type === 'image' && block.content?.url && (
                        <div
                            className="relative group/img rounded-sm overflow-hidden cursor-zoom-in"
                            onClick={() => onOpenViewer([block.content.url], 0)}
                        >
                            <img src={block.content.url} alt={block.content.name || 'Uploaded image'} className="w-full h-auto" />
                            {!previewMode && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            imageInputRef.current?.click()
                                        }}
                                        className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg text-text-primary transition-all"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {block.type === 'video' && !block.content?.url && !previewMode && (
                        <>
                            <div className="min-h-[300px] border border-bg-3 rounded-sm bg-bg-1 flex flex-col items-center justify-center gap-8 py-12 relative overflow-hidden">
                                {isUploadingVideo ? (
                                    <div className="flex flex-col items-center gap-4 animate-pulse">
                                        <div className="w-14 h-14 rounded-full bg-bg-3 flex items-center justify-center">
                                            <RefreshCw className="w-7 h-7 text-accent-indigo animate-spin" />
                                        </div>
                                        <span className="text-[16px] font-medium text-text-secondary">Enviando vídeo...</span>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-[20px] font-normal text-text-primary">Adicione um vídeo:</h3>
                                        <button
                                            onClick={() => videoInputRef.current?.click()}
                                            className="flex flex-col items-center gap-4 group"
                                        >
                                            <div className="w-[88px] h-[88px] rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover:bg-accent-indigo group-hover:text-white transition-all duration-200 group-hover:scale-105">
                                                <VideoIcon className="w-7 h-7" />
                                            </div>
                                            <span className="text-[14px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">Carregar Vídeo</span>
                                        </button>
                                    </>
                                )}
                            </div>
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                        </>
                    )}

                    {block.type === 'video' && block.content?.url && (
                        <div className="relative group/vid rounded-sm overflow-hidden">
                            <video src={block.content.url} controls className="w-full h-auto" />
                            {!previewMode && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/vid:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            videoInputRef.current?.click()
                                        }}
                                        className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg text-text-primary transition-all"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <input
                                        ref={videoInputRef}
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {block.type === 'grid' && (
                        <GridBlockComponent
                            content={(block.content as GridBlockContent) || { images: [], layout: '2-cols' }}
                            onUpdate={(newContent) => onUpdate(newContent)}
                            showEditor={showGridEditor && !previewMode}
                            onCloseEditor={() => setShowGridEditor(false)}
                            projectId={projectId}
                            isFullWidth={isFullWidth}
                            gridGap={block.settings?.gridGap}
                            previewMode={previewMode}
                            onOpenViewer={onOpenViewer}
                        />
                    )}

                    {block.type === 'blank' && (
                        <div
                            className={`relative rounded-sm flex items-center justify-center transition-all ${previewMode
                                ? 'bg-transparent'
                                : 'border border-dashed border-bg-3 bg-bg-1/50 group/blank hover:border-accent-indigo/30'
                                }`}
                            style={{ height: `${block.settings?.blankHeight || 80}px` }}
                        >
                            {!previewMode && (
                                <div className="flex items-center gap-2 text-text-tertiary opacity-0 group-hover/blank:opacity-100 transition-opacity">
                                    <SquareDashed className="w-4 h-4" />
                                    <span className="text-[12px] font-medium">Espaço em branco ({block.settings?.blankHeight || 80}px)</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


// Grid Block Component
function GridBlockComponent({
    content,
    onUpdate,
    showEditor,
    onCloseEditor,
    projectId,
    isFullWidth,
    gridGap,
    previewMode,
    onOpenViewer
}: {
    content: GridBlockContent,
    onUpdate: (content: GridBlockContent) => void,
    showEditor: boolean,
    onCloseEditor: () => void,
    projectId: string,
    isFullWidth?: boolean,
    gridGap?: number,
    previewMode: boolean,
    onOpenViewer: (images: string[], index: number) => void
}) {


    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [localLayout, setLocalLayout] = React.useState(content.layout)
    const [isUploading, setIsUploading] = React.useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || !projectId) return

        setIsUploading(true)
        const currentImages = [...content.images]
        const newImages: GridImage[] = []

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('projectId', projectId)
                const res = await uploadProjectMedia(formData)
                if (res.success && res.url) {
                    newImages.push({
                        id: Math.random().toString(36).substr(2, 9),
                        url: res.url,
                        name: file.name
                    })
                } else {
                    console.error("Upload failed for file:", file.name, res.error)
                    alert(`Upload failed for ${file.name}: ${res.error}`)
                }
            }

            if (newImages.length > 0) {
                onUpdate({
                    ...content,
                    images: [...currentImages, ...newImages]
                })
            }
        } catch (err) {
            console.error("Error in handleFileSelect:", err)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = content.images.findIndex(i => i.id === active.id)
            const newIndex = content.images.findIndex(i => i.id === over.id)
            onUpdate({
                ...content,
                images: arrayMove(content.images, oldIndex, newIndex)
            })
        }
    }

    const handleDeleteImage = (imageId: string) => {
        onUpdate({
            ...content,
            images: content.images.filter(img => img.id !== imageId)
        })
    }

    const handleReplaceImage = async (imageId: string, file: File) => {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)
        const res = await uploadProjectMedia(formData)
        if (res.success && res.url) {
            onUpdate({
                ...content,
                images: content.images.map(img => img.id === imageId ? { ...img, url: res.url! } : img)
            })
        } else {
            alert("Image replace failed: " + res.error)
        }
        setIsUploading(false)
    }

    const handleLayoutChange = (layout: GridBlockContent['layout']) => {
        setLocalLayout(layout)
        onUpdate({ ...content, layout })
    }

    const getGridCols = () => {
        switch (content.layout) {
            case '2-cols': return 'grid-cols-2'
            case '3-cols': return 'grid-cols-3'
            case '4-cols': return 'grid-cols-4'
            case 'masonry': return 'grid-cols-2 md:grid-cols-3'
            default: return 'grid-cols-2'
        }
    }

    // Empty State or Uploading state
    if (content.images.length === 0) {
        return (
            <>
                <div className="min-h-[400px] border border-bg-3 rounded-sm bg-bg-1 flex flex-col items-center justify-center gap-12 py-16 relative overflow-hidden group/grid">
                    {/* Indicator dot */}
                    <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-accent-indigo" />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-6 animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-bg-3 flex items-center justify-center">
                                <RefreshCw className="w-8 h-8 text-accent-indigo animate-spin" />
                            </div>
                            <h3 className="text-[20px] font-medium text-text-secondary">Enviando imagens...</h3>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-[22px] font-normal text-text-primary">
                                Adicione fotos para criar sua grade:
                            </h3>

                            <div className="flex items-center justify-center gap-12">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center gap-4 group"
                                >
                                    <div className="w-[88px] h-[88px] rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover:bg-accent-indigo group-hover:text-white transition-all duration-200 group-hover:scale-105">
                                        <ImageIcon className="w-7 h-7" />
                                    </div>
                                    <span className="text-[14px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">Imagem</span>
                                </button>
                            </div>
                        </>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Edit Popup - Always available */}
                {showEditor && (
                    <div className="fixed inset-0 z-[100000] bg-black/60 flex items-center justify-center p-4" onClick={onCloseEditor}>
                        <div className="bg-bg-1 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-bg-3" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-bg-3 flex items-center justify-between">
                                <h3 className="text-[18px] font-bold text-text-primary">Editar Grade</h3>
                                <button onClick={onCloseEditor} className="p-2 hover:bg-bg-2 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-text-secondary" />
                                </button>
                            </div>

                            <div className="p-6 space-y-8 overflow-y-auto max-h-[60vh]">
                                {/* Layout Selection */}
                                <div className="space-y-4">
                                    <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest">Layout da Grade</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {(['2-cols', '3-cols', '4-cols', 'masonry'] as const).map((layout) => (
                                            <button
                                                key={layout}
                                                onClick={() => handleLayoutChange(layout)}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${localLayout === layout
                                                    ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo'
                                                    : 'border-bg-3 hover:border-accent-indigo/50 text-text-primary'
                                                    }`}
                                            >
                                                <Grid className="w-6 h-6" />
                                                <span className="text-[11px] font-bold">
                                                    {layout === '2-cols' ? '2 Colunas' :
                                                        layout === '3-cols' ? '3 Colunas' :
                                                            layout === '4-cols' ? '4 Colunas' : 'Masonry'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Images Call-to-action */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest">Imagens (0)</label>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-[13px] font-bold text-accent-indigo hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Adicionar imagens
                                        </button>
                                    </div>
                                    <p className="text-[14px] text-text-tertiary text-center py-8">
                                        Nenhuma imagem adicionada ainda
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-bg-3 flex justify-end">
                                <button
                                    onClick={onCloseEditor}
                                    className="bg-accent-indigo text-white px-6 py-2.5 rounded-full text-[14px] font-bold hover:scale-105 transition-transform"
                                >
                                    Concluído
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }


    // Grid with images
    const isMasonry = content.layout === 'masonry'

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={content.images.map(img => img.id)}
                    strategy={rectSortingStrategy}
                >
                    {isMasonry ? (
                        // Masonry layout using CSS columns
                        <div
                            className="columns-2 md:columns-3 lg:columns-4"
                            style={{ gap: `${gridGap ?? 8}px`, columnGap: `${gridGap ?? 8}px` }}
                        >
                            {content.images.map((image, index) => (
                                <GridImageItem
                                    key={image.id}
                                    image={image}
                                    index={index}
                                    allImages={content.images}
                                    previewMode={previewMode}
                                    isMasonry={true}
                                    gridGap={gridGap}
                                    handleDelete={handleDeleteImage}
                                    onOpenViewer={onOpenViewer}
                                />
                            ))}
                        </div>
                    ) : (
                        // Regular grid layout
                        <div
                            className={`grid ${getGridCols()}`}
                            style={{ gap: `${gridGap ?? 8}px` }}
                        >
                            {content.images.map((image, index) => (
                                <GridImageItem
                                    key={image.id}
                                    image={image}
                                    index={index}
                                    allImages={content.images}
                                    previewMode={previewMode}
                                    isMasonry={false}
                                    handleDelete={handleDeleteImage}
                                    onOpenViewer={onOpenViewer}
                                />
                            ))}
                        </div>
                    )}
                </SortableContext>
            </DndContext>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Edit Popup */}
            {showEditor && (
                <div className="fixed inset-0 z-[100000] bg-black/60 flex items-center justify-center p-4" onClick={onCloseEditor}>
                    <div className="bg-bg-1 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-bg-3" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-bg-3 flex items-center justify-between">
                            <h3 className="text-[18px] font-bold text-text-primary">Editar Grade</h3>
                            <button onClick={onCloseEditor} className="p-2 hover:bg-bg-2 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-text-secondary" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8 overflow-y-auto max-h-[60vh]">
                            {/* Layout Selection */}
                            <div className="space-y-4">
                                <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest">Layout da Grade</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {(['2-cols', '3-cols', '4-cols', 'masonry'] as const).map((layout) => (
                                        <button
                                            key={layout}
                                            onClick={() => handleLayoutChange(layout)}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${localLayout === layout
                                                ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo'
                                                : 'border-bg-3 hover:border-accent-indigo/50 text-text-primary'
                                                }`}
                                        >
                                            <Grid className="w-6 h-6" />
                                            <span className="text-[11px] font-bold">
                                                {layout === '2-cols' ? '2 Colunas' :
                                                    layout === '3-cols' ? '3 Colunas' :
                                                        layout === '4-cols' ? '4 Colunas' : 'Masonry'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Images Management */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[13px] font-bold text-text-secondary uppercase tracking-widest">Imagens ({content.images.length})</label>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="text-[13px] font-bold text-accent-indigo hover:underline flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        {isUploading ? "Enviando..." : "Adicionar mais"}
                                    </button>
                                </div>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={content.images.map(img => img.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid grid-cols-4 gap-3">
                                            {content.images.map((image) => (
                                                <SortableGridItem
                                                    key={image.id}
                                                    image={image}
                                                    onDelete={() => handleDeleteImage(image.id)}
                                                    onReplace={(file) => handleReplaceImage(image.id, file)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </div>

                        <div className="p-6 border-t border-bg-3 flex justify-end">
                            <button
                                onClick={onCloseEditor}
                                className="bg-accent-indigo text-white px-6 py-2.5 rounded-full text-[14px] font-bold hover:scale-105 transition-transform"
                            >
                                Concluído
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}


function GridImageItem({
    image,
    handleDelete,
    onOpenViewer,
    allImages,
    index,
    previewMode,
    isMasonry,
    gridGap
}: {
    image: GridImage,
    handleDelete: (id: string) => void,
    onOpenViewer: (images: string[], index: number) => void,
    allImages: GridImage[],
    index: number,
    previewMode: boolean,
    isMasonry: boolean,
    gridGap?: number
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: image.id, disabled: previewMode })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group/img rounded-sm overflow-hidden transition-shadow ${isMasonry ? 'break-inside-avoid shadow-sm group-hover/img:shadow-xl' : 'h-full'} ${!previewMode ? 'cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-accent-indigo/50' : 'cursor-zoom-in shadow-md hover:shadow-2xl'} ${isDragging ? 'opacity-50 ring-2 ring-accent-indigo z-50' : ''}`}
            onClick={() => {
                if (previewMode) {
                    onOpenViewer(allImages.map(img => img.url), index)
                }
            }}
        >
            <img
                src={image.url}
                alt={image.name}
                className={`w-full transition-transform duration-500 ${isMasonry ? 'h-auto' : 'h-full object-cover'} ${previewMode ? 'group-hover/img:scale-105' : ''}`}
                style={isMasonry ? { marginBottom: `${gridGap ?? 8}px` } : {}}
            />
            {!previewMode && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div {...attributes} {...listeners} className="p-2 bg-white rounded-lg text-text-primary hover:bg-accent-indigo hover:text-white transition-colors cursor-grab shadow-lg">
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onOpenViewer(allImages.map(img => img.url), index)
                        }}
                        className="p-2 bg-white rounded-lg text-text-primary hover:bg-accent-indigo hover:text-white transition-colors shadow-lg"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(image.id)
                        }}
                        className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}

function SortableGridItem({ image, onDelete, onReplace }: { image: GridImage, onDelete: () => void, onReplace: (file: File) => void }) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: image.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`aspect-square relative group/thumb rounded-lg overflow-hidden border border-bg-3 ${isDragging ? 'shadow-2xl opacity-50' : ''}`}
        >
            <img src={image.url} alt={image.name} className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div {...attributes} {...listeners} className="p-1.5 bg-white rounded-md text-text-primary cursor-grab active:cursor-grabbing hover:bg-accent-indigo hover:text-white transition-colors">
                    <GripVertical className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 bg-white rounded-md text-text-primary hover:bg-accent-indigo hover:text-white transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 bg-white rounded-md text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onReplace(file)
                }}
                className="hidden"
            />
        </div>
    )
}
