"use client"

import React, { useState, useRef, useMemo } from "react"
import {
    DndContext,
    rectIntersection,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core"
import {
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Clock, SlidersHorizontal, Bell, Home, BookmarkPlus, Monitor, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

import { LeftSidebar } from "./editor/LeftSidebar"
import { getEffectiveCategory } from "@/lib/brandbook-utils"
import { MainCanvasWithHistory } from "./editor/MainCanvas"
import { DeleteConfirmationModal } from "./editor/DeleteConfirmationModal"

const AssetLibrary = dynamic(() => import("./editor/AssetLibrary").then(m => m.AssetLibrary), { ssr: false })
const BrandSettingsPanel = dynamic(() => import("./editor/BrandSettingsPanel").then(m => m.BrandSettingsPanel), { ssr: false })
const SaveAsTemplateModal = dynamic(() => import("./editor/SaveAsTemplateModal").then(m => m.SaveAsTemplateModal), { ssr: false })
import { AnimationPanel } from "./editor/AnimationPanel"

import { createBrandbookModule, reorderModules, updateModuleContent, updateModule, updateModuleCategory, deleteModule, duplicateModule } from "@/app/actions/brandbook"
import { BrandDesignProvider } from "./editor/BrandDesignContext"
import { Block, EditorContent } from "./editor/types"



interface UserData {
    name: string
    avatar_url?: string
}

interface BrandbookModule {
    id: string
    brandbook_id: string
    title: string
    type: string
    order: number
    category: string
    content_json: Record<string, unknown>
    isHidden?: boolean
    isLocked?: boolean
    isFullscreen?: boolean
    created_at?: string
    updated_at?: string
}

interface BrandbookEditorProps {
    initialModules: BrandbookModule[]
    brandbookId: string
    brandId: string
    brandName?: string
    isReadOnly?: boolean
    userData?: UserData | null
}

export default function BrandbookEditor({
    initialModules,
    brandbookId,
    brandId,
    brandName = '',
    isReadOnly = false,
    userData = null
}: BrandbookEditorProps) {
    const router = useRouter()

    // Determine effective modules (either from props or defaults)
    const effectiveModules = initialModules


    const [items, setItems] = useState<BrandbookModule[]>(initialModules)
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(initialModules[0]?.id || null)

    // Block Selection State (Lifted up from MainCanvas)
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [isPreviewMode, setIsPreviewMode] = useState(isReadOnly)
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
    const [responsiveDevice, setResponsiveDevice] = useState<'desktop' | 'widescreen' | 'mobile'>('widescreen')
    const [isResponsiveMenuOpen, setIsResponsiveMenuOpen] = useState(false)
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; moduleId: string | null }>({
        isOpen: false,
        moduleId: null
    })

    const [isAnimationPanelOpen, setIsAnimationPanelOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    // DND State
    const [activeDragId, setActiveDragId] = useState<string | null>(null)

    // Persistence Refs
    const activeSaveTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
    const latestContentRef = useRef<Record<string, any>>({}) // Track latest content to avoid saving old versions

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Derived state
    const activeModule = items.find(m => m.id === selectedModuleId) || null

    async function handleAddModule(type: string) {
        const order = items.length
        const result = await createBrandbookModule(brandbookId, type, order)

        if (result.success && result.module) {
            setItems([...items, result.module])
            setSelectedModuleId(result.module.id)
        }
    }

    const handleUpdateModule = (moduleId: string, newContent: any) => {
        console.log('[BrandbookEditor] Update requested for:', moduleId)

        // 1. Update local state immediately for UI responsiveness
        setItems(prev => prev.map(item =>
            item.id === moduleId
                ? { ...item, content_json: newContent }
                : item
        ))

        // 2. Track latest content in ref to ensure server save uses most recent data
        latestContentRef.current[moduleId] = newContent

        // 3. Debounced server save
        if (activeSaveTimeouts.current[moduleId]) {
            clearTimeout(activeSaveTimeouts.current[moduleId])
        }

        activeSaveTimeouts.current[moduleId] = setTimeout(async () => {
            const contentToSave = latestContentRef.current[moduleId]
            console.log('[BrandbookEditor] Triggering server save for:', moduleId)

            try {
                console.log('[BrandbookEditor] Starting server save for module:', moduleId)
                const result = await updateModuleContent(moduleId, contentToSave, brandId)
                if (result.success) {
                    console.log('[BrandbookEditor] Server save successful for module:', moduleId)
                } else {
                    console.error('[BrandbookEditor] Server save failed:', result.error)
                    alert('Erro ao salvar alterações no servidor: ' + result.error)
                }
            } catch (err) {
                console.error('[BrandbookEditor] Error during server save:', err)
            } finally {
                delete activeSaveTimeouts.current[moduleId]
            }
        }, 1500) // Slightly longer debounce to ensure all rapid changes are captured
    }

    const handleRenameModule = async (moduleId: string, newTitle: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return

        const newCategory = getEffectiveCategory({ ...item, title: newTitle })

        setItems(prev => prev.map(m =>
            m.id === moduleId
                ? { ...m, title: newTitle, category: newCategory }
                : m
        ))

        await updateModule(moduleId, { title: newTitle, category: newCategory }, brandId)
    }

    const handleDuplicateModule = async (moduleId: string) => {
        const result = await duplicateModule(moduleId, brandId)
        if (result.success && result.module) {
            setItems(prev => [...prev, result.module])
            setSelectedModuleId(result.module.id)
        } else {
            console.error("Failed to duplicate module:", result.error)
            alert("Erro ao duplicar a página.")
        }
    }

    const handleDeleteModule = (moduleId: string) => {
        setDeleteModal({ isOpen: true, moduleId })
    }

    const confirmDelete = async () => {
        const moduleId = deleteModal.moduleId
        if (!moduleId) return

        setItems(prev => prev.filter(m => m.id !== moduleId))
        if (selectedModuleId === moduleId) {
            setSelectedModuleId(null)
        }

        // If it's a "new-" module not yet saved to DB, we just remove it from state
        if (moduleId.startsWith('new-')) return

        const result = await deleteModule(moduleId, brandId)
        if (!result.success) {
            console.error("Failed to delete module:", result.error)
            alert("Erro ao eliminar a página no servidor.")
        }
    }

    const handleToggleVisibility = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newValue = !item.isHidden
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, isHidden: newValue } : m))
        await updateModule(moduleId, { isHidden: newValue }, brandId)
    }

    const handleToggleLock = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newValue = !item.isLocked
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, isLocked: newValue } : m))
        await updateModule(moduleId, { isLocked: newValue }, brandId)
    }

    const handleToggleFullscreen = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newValue = !item.isFullscreen
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, isFullscreen: newValue } : m))
        await updateModule(moduleId, { isFullscreen: newValue }, brandId)
    }



    const handleSelectAnimation = (animationId: string) => {
        if (!activeBlockId || !activeModule) return

        const updateBlocksRecursively = (blocks: Block[]): Block[] => {
            return blocks.map(block => {
                if (block.id === activeBlockId) {
                    return {
                        ...block,
                        content: {
                            ...block.content,
                            animation: animationId
                        }
                    }
                }
                if (block.type === 'layout' && block.content?.columns) {
                    return {
                        ...block,
                        content: {
                            ...block.content,
                            columns: block.content.columns.map((col: any) => ({
                                ...col,
                                blocks: updateBlocksRecursively(col.blocks || [])
                            }))
                        }
                    }
                }
                return block
            })
        }

        const editorContent = activeModule.content_json as unknown as EditorContent
        const newBlocks = updateBlocksRecursively(editorContent.blocks || [])
        handleUpdateModule(activeModule.id, { ...editorContent, blocks: newBlocks })
    }

    const activeBlockAnimation = useMemo(() => {
        if (!activeBlockId || !activeModule) return null

        const findBlockRecursively = (blocks: Block[]): Block | null => {
            for (const block of blocks) {
                if (block.id === activeBlockId) return block
                if (block.type === 'layout' && block.content?.columns) {
                    for (const col of block.content.columns) {
                        const found = findBlockRecursively(col.blocks || [])
                        if (found) return found
                    }
                }
            }
            return null
        }

        const editorContent = activeModule.content_json as unknown as EditorContent
        const block = findBlockRecursively(editorContent.blocks || [])
        return block?.content?.animation || null
    }, [activeBlockId, activeModule])

    return (
        <BrandDesignProvider brandId={brandId}>
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={({ active }) => setActiveDragId(active.id as string)}
                onDragOver={({ active, over }) => {
                    if (!over) return // Ensure 'over' is not null
                    if (!over.id) return

                    const activeId = active.id as string
                    const overIdStr = over.id as string

                    // Get currently active item
                    const activeItem = items.find(i => i.id === activeId)
                    if (!activeItem) return

                    const currentCategory = getEffectiveCategory(activeItem)

                    // Possible category IDs from LeftSidebar
                    const categoryIds = ['overview', 'visual_guide', 'verbal_identity', 'visual_identity', 'sensory_identity', 'others']
                    const isOverContainer = categoryIds.includes(overIdStr)

                    let targetCategory = currentCategory

                    if (isOverContainer) {
                        targetCategory = overIdStr
                    } else {
                        const overItem = items.find(i => i.id === overIdStr)
                        if (overItem) {
                            targetCategory = getEffectiveCategory(overItem)
                        }
                    }

                    if (currentCategory !== targetCategory) {
                        setItems(prev => {
                            const newItems = prev.map(item =>
                                item.id === activeId
                                    ? { ...item, category: targetCategory }
                                    : item
                            )
                            return newItems
                        })
                        // Persist category change early (optimistic)
                        updateModuleCategory(activeId, targetCategory, brandId)
                    }
                }}
                onDragEnd={async (event) => {
                    const { active, over } = event
                    if (over) {
                        const activeId = active.id as string
                        const overIdStr = over.id as string

                        setItems((items) => {
                            const oldIndex = items.findIndex((item) => item.id === activeId)
                            const overIndex = items.findIndex((item) => item.id === overIdStr)

                            let newItems = [...items]

                            if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
                                const [moved] = newItems.splice(oldIndex, 1)
                                newItems.splice(overIndex, 0, moved)
                            }

                            // Persistence - preserve explicitly set categories
                            const updates = newItems.map((item, index) => ({
                                id: item.id,
                                order: index,
                                category: item.category != null ? item.category : getEffectiveCategory(item)
                            }))
                            console.log('[BrandbookEditor] Saving:', updates.map(u => `${u.id.slice(0, 6)}:${u.category}`).join(', '))
                            reorderModules(updates)
                            return newItems
                        })
                    }
                    setActiveDragId(null)
                }}
            >
                <div className="flex w-full h-screen overflow-hidden overflow-x-hidden bg-bg-2 flex-row relative text-white">

                    {/* 1. Sidebar - Full Height (First child in flex-row) */}
                    <LeftSidebar
                        modules={items}
                        activeModuleId={selectedModuleId}
                        onSelectModule={setSelectedModuleId}
                        onAddModule={handleAddModule}
                        onRenameModule={handleRenameModule}
                        onDuplicateModule={handleDuplicateModule}
                        onDeleteModule={handleDeleteModule}
                        onToggleVisibility={handleToggleVisibility}
                        onToggleLock={handleToggleLock}
                        onToggleFullscreen={handleToggleFullscreen}
                        brandName={brandName}
                        brandbookId={brandbookId}
                        onPagesAdded={(newModules) => {
                            setItems(prev => [...prev, ...newModules])
                        }}
                        isReadOnly={isReadOnly}
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />

                    {/* 2. Main Content Area - Column (Canvas + Footer) */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">

                        {/* Top Bar Actions (Fixed top/right) */}
                        {!isReadOnly && (
                            <div className="absolute top-4 right-6 z-[1000] flex items-center gap-4">
                                {/* Control Group */}
                                <div className="h-[52px] bg-[#111116] px-2 pl-6 rounded-full flex items-center shadow-2xl border border-[#222]">
                                    <div className="flex items-center gap-4">
                                        {/* Responsive device selector + Preview text */}
                                        <div className="flex items-center gap-0">
                                            {/* Responsive Device Selector */}
                                            <div
                                                className="relative"
                                                onMouseEnter={() => setIsResponsiveMenuOpen(true)}
                                                onMouseLeave={() => setIsResponsiveMenuOpen(false)}
                                            >
                                                <button className="text-[#888] hover:text-white transition-colors p-1 pr-3">
                                                    <Monitor className="w-4 h-4" />
                                                </button>

                                                {/* Popover Menu */}
                                                {isResponsiveMenuOpen && (
                                                    <>
                                                        {/* Invisible bridge to keep popover open when moving from button to popover */}
                                                        <div className="absolute top-full left-0 w-full h-4"></div>

                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[140px] bg-[#1A1A1F] border border-[#333] rounded-lg shadow-xl z-[100] py-2">
                                                            {/* Triangle tail - 12px height, centered */}
                                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-[#333]"></div>
                                                            <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[11px] border-b-[#1A1A1F]"></div>
                                                            <button
                                                                onClick={() => { setResponsiveDevice('desktop'); setIsResponsiveMenuOpen(false); }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-[#2A2A30] transition-colors text-left",
                                                                    responsiveDevice === 'desktop' ? "text-white" : "text-[#888]"
                                                                )}
                                                            >
                                                                <Monitor className="w-4 h-4" />
                                                                <span className="text-sm">Desktop</span>
                                                            </button>
                                                            <button
                                                                onClick={() => { setResponsiveDevice('widescreen'); setIsResponsiveMenuOpen(false); }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-[#2A2A30] transition-colors text-left",
                                                                    responsiveDevice === 'widescreen' ? "text-white" : "text-[#888]"
                                                                )}
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="2" y="5" width="20" height="12" rx="1" />
                                                                    <path d="M8 21h8" />
                                                                    <path d="M12 17v4" />
                                                                </svg>
                                                                <span className="text-sm">Wide screen</span>
                                                            </button>
                                                            <button
                                                                onClick={() => { setResponsiveDevice('mobile'); setIsResponsiveMenuOpen(false); }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-[#2A2A30] transition-colors text-left",
                                                                    responsiveDevice === 'mobile' ? "text-white" : "text-[#888]"
                                                                )}
                                                            >
                                                                <Smartphone className="w-4 h-4" />
                                                                <span className="text-sm">Mobile</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Vertical Separator */}
                                            <div className="h-[16px] w-[1px] bg-[#333] mr-3"></div>

                                            {/* Preview Text */}
                                            <span className={cn(
                                                "text-[15px] font-medium transition-colors cursor-pointer",
                                                isPreviewMode ? "text-white" : "text-[#555]"
                                            )} onClick={() => setIsPreviewMode(true)}>
                                                Preview
                                            </span>
                                        </div>

                                        {/* Custom Toggle Switch */}
                                        <div
                                            className="w-[52px] h-[28px] bg-[#222] rounded-full relative cursor-pointer"
                                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                                        >
                                            <div className={cn(
                                                "absolute top-[2px] w-[24px] h-[24px] bg-[#333] rounded-full shadow-sm transition-all duration-300",
                                                !isPreviewMode ? "left-[26px] bg-[#333]" : "left-[2px] bg-[#333]" // Thumb position
                                            )} />
                                        </div>

                                        <span className={cn(
                                            "text-[15px] font-medium transition-colors cursor-pointer",
                                            !isPreviewMode ? "text-white" : "text-[#555]"
                                        )} onClick={() => setIsPreviewMode(false)}>
                                            Edit
                                        </span>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-[20px] w-[1px] bg-[#333] mx-6"></div>

                                    {/* Library Link */}
                                    <button
                                        onClick={() => setIsAssetLibraryOpen(true)}
                                        className="text-[15px] font-medium text-[#888] hover:text-white transition-colors mr-4"
                                    >
                                        Asset library
                                    </button>
                                </div>

                                {/* Profile/Settings Group */}
                                <div className="h-[52px] bg-[#111116] px-4 rounded-full flex items-center gap-5 shadow-2xl border border-[#222]">
                                    <button className="text-[#888] hover:text-white transition-colors">
                                        <Clock className="w-5 h-5" />
                                    </button>
                                    <button
                                        className="text-[#888] hover:text-white transition-colors"
                                        onClick={() => setIsSettingsPanelOpen(true)}
                                    >
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                    <button className="text-[#888] hover:text-white transition-colors">
                                        <Bell className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => router.push('/brands')}
                                        className="text-[#888] hover:text-white transition-colors"
                                        title="Voltar para Brands"
                                    >
                                        <Home className="w-5 h-5" />
                                    </button>
                                    {/* Save as Template Button */}
                                    <button
                                        onClick={() => setIsTemplateModalOpen(true)}
                                        className="text-[#888] hover:text-[#FF0054] transition-colors"
                                        title="Salvar como Template"
                                    >
                                        <BookmarkPlus className="w-5 h-5" />
                                    </button>
                                    {/* User Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0054] to-[#88007F] p-[2px] shadow-lg overflow-hidden">
                                        <div className="w-full h-full rounded-full bg-[#111116] overflow-hidden flex items-center justify-center relative">
                                            {userData?.avatar_url ? (
                                                <Image
                                                    src={userData.avatar_url}
                                                    alt={userData.name || "User"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] font-bold text-white uppercase">
                                                    {userData?.name?.charAt(0) || "U"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <MainCanvasWithHistory
                            brandId={brandId}
                            activeModule={activeModule}
                            activeBlockId={activeBlockId}
                            onSelectBlock={setActiveBlockId}
                            onUpdateModule={handleUpdateModule}
                            isReadOnly={isPreviewMode}
                            onAnimate={() => setIsAnimationPanelOpen(true)}
                            responsiveDevice={responsiveDevice}
                        />

                        <DeleteConfirmationModal
                            isOpen={deleteModal.isOpen}
                            onClose={() => setDeleteModal({ isOpen: false, moduleId: null })}
                            onConfirm={confirmDelete}
                            title="Eliminar página"
                            message="Esta ação é irreversível. Todos os brandbooks, assets e projetos associados a esta marca serão eliminados permanentemente."
                        />

                        {/* Footer - Pinned to bottom of content column */}
                        <div className="h-8 bg-black flex items-center justify-center text-[10px] text-text-tertiary border-t border-bg-3 select-none z-10 shrink-0">
                            Powered by Brivio coverage and Bhoo Agency
                        </div>

                        <DragOverlay>
                            {activeDragId ? (
                                <div className="p-2 bg-bg-3 text-white rounded shadow-lg flex items-center gap-2 w-64 opacity-90 border border-accent-indigo">
                                    <span className="truncate">{items.find(i => i.id === activeDragId)?.title}</span>
                                </div>
                            ) : null}
                        </DragOverlay>

                    </div>

                </div>

                <BrandSettingsPanel
                    isOpen={isSettingsPanelOpen}
                    onClose={() => setIsSettingsPanelOpen(false)}
                    brandId={brandId}
                />

                <AssetLibrary
                    isOpen={isAssetLibraryOpen}
                    onClose={() => setIsAssetLibraryOpen(false)}
                    brandId={brandId}
                />

                <SaveAsTemplateModal
                    isOpen={isTemplateModalOpen}
                    onClose={() => setIsTemplateModalOpen(false)}
                    modules={items}
                    brandId={brandId}
                    brandName={brandName}
                />

                <AnimationPanel
                    isOpen={isAnimationPanelOpen && !isPreviewMode}
                    onClose={() => setIsAnimationPanelOpen(false)}
                    onSelectAnimation={handleSelectAnimation}
                    initialAnimation={activeBlockAnimation}
                />
            </DndContext >
        </BrandDesignProvider >
    )
}
