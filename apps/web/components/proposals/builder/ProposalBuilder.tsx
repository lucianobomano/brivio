"use client"

import React, { useState, useRef } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core"
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Clock, SlidersHorizontal, Bell, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

import { MainCanvas } from "./editor/MainCanvas"
import { BrandDesignProvider } from "./editor/BrandDesignContext"

const AssetLibrary = dynamic(() => import("./editor/AssetLibrary").then(m => m.AssetLibrary), { ssr: false })
const BrandSettingsPanel = dynamic(() => import("./editor/BrandSettingsPanel").then(m => m.BrandSettingsPanel), { ssr: false })

import { createProposalModule, reorderProposalModules, updateProposalModuleContent, updateProposalModule, deleteProposalModule, duplicateProposalModule } from "@/app/actions/proposal-builder"



interface ProposalBuilderProps {
    initialModules: any[]
    proposalId: string
    brandId: string
    proposalIdentifier?: string
    isReadOnly?: boolean
}





export default function ProposalBuilder({ initialModules, proposalId, brandId, proposalIdentifier = '', isReadOnly = false }: ProposalBuilderProps) {
    const router = useRouter()

    // Determine effective modules (filter out internal settings module)
    const [items, setItems] = useState<any[]>(initialModules.filter(m => m.type !== 'settings'))
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(initialModules.find(m => m.type !== 'settings')?.id || null)

    // Block Selection State (Lifted up from MainCanvas)
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [isPreviewMode, setIsPreviewMode] = useState(isReadOnly)
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false)

    // DND State
    const [activeDragId, setActiveDragId] = useState<string | null>(null)

    // Persistence Refs
    const activeSaveTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

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
        const result = await createProposalModule(proposalId, type, order)

        if (result.success && result.module) {
            setItems([...items, result.module])
            setSelectedModuleId(result.module.id)
        }
    }

    const handleUpdateModule = (moduleId: string, newContent: any) => {
        setItems(prev => prev.map(item =>
            item.id === moduleId
                ? { ...item, content_json: newContent }
                : item
        ))

        if (activeSaveTimeouts.current[moduleId]) {
            clearTimeout(activeSaveTimeouts.current[moduleId])
        }

        activeSaveTimeouts.current[moduleId] = setTimeout(async () => {
            await updateProposalModuleContent(moduleId, newContent, proposalId)
            delete activeSaveTimeouts.current[moduleId]
        }, 1000)
    }

    const handleRenameModule = async (moduleId: string, newTitle: string) => {
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, title: newTitle } : m))
        await updateProposalModule(moduleId, { title: newTitle }, proposalId)
    }

    const handleDuplicateModule = async (moduleId: string) => {
        const result = await duplicateProposalModule(moduleId, proposalId)
        if (result.success && result.module) {
            setItems(prev => [...prev, result.module])
            setSelectedModuleId(result.module.id)
        }
    }

    const handleDeleteModule = async (moduleId: string) => {
        setItems(prev => prev.filter(m => m.id !== moduleId))
        if (selectedModuleId === moduleId) {
            setSelectedModuleId(null)
        }
        await deleteProposalModule(moduleId, proposalId)
    }

    const handleToggleVisibility = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newVal = !item.is_hidden
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, is_hidden: newVal } : m))
        await updateProposalModule(moduleId, { is_hidden: newVal }, proposalId)
    }

    const handleToggleLock = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newVal = !item.is_locked
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, is_locked: newVal } : m))
        await updateProposalModule(moduleId, { is_locked: newVal }, proposalId)
    }

    const handleToggleFullscreen = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newVal = !item.is_fullscreen
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, is_fullscreen: newVal } : m))
        await updateProposalModule(moduleId, { is_fullscreen: newVal }, proposalId)
    }



    return (
        <BrandDesignProvider brandId={brandId} proposalId={proposalId} initialModules={initialModules}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={({ active }) => setActiveDragId(active.id as string)}
                onDragEnd={async (event) => {
                    const { active, over } = event
                    if (over && active.id !== over.id) {
                        setItems((items) => {
                            const oldIndex = items.findIndex((item) => item.id === active.id)
                            const newIndex = items.findIndex((item) => item.id === over.id)
                            const newOrder = arrayMove(items, oldIndex, newIndex)

                            // Optimistic update
                            const updates = newOrder.map((item, index) => ({ id: item.id, order: index }))
                            reorderProposalModules(updates) // Fire and forget for now

                            return newOrder
                        })
                    }
                    setActiveDragId(null)
                }}
            >
                <div className="flex h-screen overflow-hidden bg-bg-2 flex-row relative text-white">

                    {/* Main Content Area - Full Width (Sidebar Removed) */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">

                        {/* Top Bar Actions (Fixed top/right) */}
                        {!isReadOnly && (
                            <div className="absolute top-4 right-6 z-50 flex items-center gap-4">
                                {/* Control Group */}
                                <div className="h-[52px] bg-[#111116] px-2 pl-6 rounded-full flex items-center shadow-2xl border border-[#222]">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => window.open(`/proposals/${proposalId}/view`, '_blank')}
                                            className="text-[11px] font-black text-white uppercase tracking-[0.2em] bg-[#EF0050] px-6 py-2 rounded-full hover:bg-[#EF0050]/90 transition-all shadow-[0_4px_15px_rgba(239,0,80,0.3)] hover:scale-105 active:scale-95"
                                        >
                                            Visualizar
                                        </button>

                                        <div className="h-[20px] w-[1px] bg-[#333] mx-1"></div>

                                        <span className={cn(
                                            "text-[15px] font-medium transition-colors cursor-pointer",
                                            isPreviewMode ? "text-white" : "text-[#555]"
                                        )} onClick={() => setIsPreviewMode(true)}>
                                            Preview
                                        </span>

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
                                        onClick={() => router.push('/projects')}
                                        className="text-[#888] hover:text-white transition-colors"
                                    >
                                        <Home className="w-5 h-5" />
                                    </button>
                                    {/* Gradient Circle */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00FF94] via-[#0000FF] to-[#FF0054]" />
                                </div>
                            </div>
                        )}

                        {/* Floating Section Navigator */}
                        {!isPreviewMode && (
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-3">
                                {items.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedModuleId(item.id)}
                                        className={cn(
                                            "group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border",
                                            selectedModuleId === item.id
                                                ? "bg-[#EF0050] border-[#EF0050] text-white shadow-lg shadow-[#EF0050]/20 scale-110"
                                                : "bg-[#111] border-[#222] text-[#555] hover:border-[#444] hover:text-white"
                                        )}
                                    >
                                        <span className="text-[10px] font-bold">{(idx + 1).toString().padStart(2, '0')}</span>

                                        {/* Tooltip labels */}
                                        <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 rounded-md bg-black/90 border border-white/10 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                                            {item.title}
                                            <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-black/90" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <MainCanvas
                            activeModule={activeModule}
                            activeBlockId={activeBlockId}
                            onSelectBlock={setActiveBlockId}
                            onUpdateModule={handleUpdateModule}
                            isReadOnly={isPreviewMode}
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
            </DndContext >
        </BrandDesignProvider>
    )
}
