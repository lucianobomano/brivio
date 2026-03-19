"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AddSectionDialog } from "./AddSectionDialog"
import { AddItemDialog } from "./AddItemDialog"
import { SectionSettingsPanel, SectionSettings } from "./SectionSettingsPanel"
import { Block } from "./types"
import { BlockRenderer } from "./blocks/BlockRenderer"
import { ArrowUp, ArrowDown, Clipboard, Check } from "lucide-react"
import { useBrandDesign } from "./BrandDesignContext"
import { EditorHistoryProvider, useEditorHistoryOptional } from "./EditorHistoryContext"
import { EditorToast } from "./EditorToast"

// Helper Component for Section Divider
const SectionDivider = ({ onClick, onPaste, onClear, hasClipboard }: { onClick: () => void, onPaste?: () => void, onClear?: () => void, hasClipboard?: boolean }) => (
    <div className="relative h-4 flex items-center justify-center group my-1">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-200" />
        <div className="relative z-10 flex gap-2">
            <button
                onClick={onClick}
                className="bg-[#FF0054] text-white px-4 py-1.5 rounded-full text-xs font-medium opacity-50 hover:opacity-100 transition-opacity duration-200 flex items-center gap-2"
            >
                <span>+ Add Section</span>
            </button>
            {hasClipboard && onPaste && (
                <div className="flex gap-1">
                    <button
                        onClick={onPaste}
                        className="bg-[#111] text-white px-4 py-1.5 rounded-full text-xs font-medium opacity-50 hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 border border-white/10"
                    >
                        <Clipboard className="w-3 h-3" />
                        <span>Paste</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear?.(); }}
                        className="bg-[#111] text-white w-[30px] h-[30px] rounded-full text-xs font-medium opacity-50 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center border border-white/10 hover:text-green-400 hover:border-green-400/50"
                        title="Clear Clipboard"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    </div>
)

// Helper Component for Section Wrapper
interface SectionWrapperProps {
    children: React.ReactNode
    onMoveUp: () => void
    onMoveDown: () => void
    onEdit: (e: React.MouseEvent) => void
    onAnimate: () => void
    isFirst: boolean
    isLast: boolean
    settingsPanel?: React.ReactNode
    settings?: SectionSettings
    isReadOnly?: boolean
}

const SectionWrapper = ({
    children,
    onMoveUp,
    onMoveDown,
    onEdit,
    isFirst,
    isLast,
    settingsPanel,
    settings,
    isReadOnly
}: Omit<SectionWrapperProps, 'onAnimate'>) => {
    const getAlignItems = () => {
        // Horizontal alignment (left/center/right)
        // For flex-col, alignItems controls horizontal alignment
        // Use 'stretch' as default to ensure children take full width
        switch (settings?.alignHorizontal) {
            case 'left': return 'flex-start'
            case 'center': return 'center'
            case 'right': return 'flex-end'
            default: return 'stretch' // Default to stretch so children take full width
        }
    }

    const getJustifyContent = () => {
        // Vertical alignment (top/middle/bottom)
        switch (settings?.alignVertical) {
            case 'middle': return 'center'
            case 'bottom': return 'flex-end'
            default: return 'flex-start' // top
        }
    }

    return (
        <div
            className={cn(
                "relative transition-colors w-full",
                isReadOnly ? "border-0 mb-0" : "group border border-dashed border-gray-200 hover:border-[#FF0054] mb-4 mt-[32px]"
            )}
            style={{
                height: settings?.aspectRatio === '16:9' ? '100vh' : undefined,
                backgroundColor: settings?.backgroundType === 'color' || !settings?.backgroundType ? settings?.backgroundColor : undefined,
                backgroundImage: settings?.backgroundType === 'image' && settings?.backgroundImage
                    ? `url(${settings.backgroundImage})`
                    : settings?.backgroundType === 'gradient' && settings?.backgroundGradient
                        ? settings.backgroundGradient.type === 'linear'
                            ? `linear-gradient(${settings.backgroundGradient.angle}deg, ${settings.backgroundGradient.stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`
                            : `radial-gradient(circle, ${settings.backgroundGradient.stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`
                        : undefined,
                backgroundSize: settings?.backgroundType === 'image' ? 'cover' : undefined,
                backgroundPosition: settings?.backgroundType === 'image' ? 'center' : undefined,
                paddingTop: settings?.isFullHeight ? 0 : (settings?.sectionPadding?.top ?? 40),
                paddingRight: settings?.isFullWidth ? 0 : (settings?.sectionPadding?.right ?? 40),
                paddingBottom: settings?.isFullHeight ? 0 : (settings?.sectionPadding?.bottom ?? 40),
                paddingLeft: settings?.isFullWidth ? 0 : (settings?.sectionPadding?.left ?? 40),
            }}
        >
            {/* Toolbar - Only show if NOT read only */}
            {!isReadOnly && (
                <div className={cn(
                    "absolute top-0 left-0 right-0 flex justify-between items-start transition-opacity z-10 px-[1px] -translate-y-full",
                    settingsPanel ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <div className="flex gap-[1px]">
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                            disabled={isFirst}
                            className="bg-[#FF0054] text-white w-[36px] h-[28px] flex items-center justify-center disabled:opacity-50 hover:bg-[#D90046] rounded-t-[4px]"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                            disabled={isLast}
                            className="bg-[#FF0054] text-white w-[36px] h-[28px] flex items-center justify-center disabled:opacity-50 hover:bg-[#D90046] rounded-t-[4px]"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(e); }}
                            className="bg-[#FF0054] text-white px-6 h-[28px] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#D90046] rounded-t-[4px] flex items-center"
                        >
                            Editar secção
                        </button>
                        {/* Settings Panel anchored to the button - Positioned to the LEFT (right-full) to stay on screen */}
                        {settingsPanel && (
                            <div className="absolute top-0 right-[calc(100%+4px)] z-[100] cursor-default" onClick={(e) => e.stopPropagation()}>
                                {settingsPanel}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Content wrapper with alignment */}
            <div
                className={cn(
                    "flex flex-col w-full min-h-0",
                    settings?.aspectRatio === '16:9' && "h-full"
                )}
                style={{
                    justifyContent: getJustifyContent(),
                    alignItems: getAlignItems(),
                    maxHeight: '100%'
                }}
            >
                {children}
            </div>
            {/* Overlay for inactive blocks if needed, but not requested */}
        </div>
    )
}

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9)

interface ModuleContent {
    blocks: Block[]
    [key: string]: unknown
}

interface MainCanvasProps {
    brandId: string
    activeModule: { id: string; content_json: ModuleContent } | null
    onUpdateModule?: (id: string, content: ModuleContent) => void
    activeBlockId: string | null
    onSelectBlock: (id: string | null) => void
    isReadOnly?: boolean
    onAnimate?: () => void
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
}

export function MainCanvas({
    brandId,
    activeModule,
    onUpdateModule,
    activeBlockId,
    onSelectBlock,
    isReadOnly = false,
    onAnimate,
    responsiveDevice = 'widescreen'
}: MainCanvasProps) {
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
    const [isAddItemOpen, setIsAddItemOpen] = useState(false)
    // Context for adding blocks (if null, adds to root)
    const [addingContext, setAddingContext] = useState<{ parentId?: string, columnId?: string, insertIndex?: number } | null>(null)
    const [panelInitialPos, setPanelInitialPos] = useState<{ top: number, left: number } | null>(null)
    const [clipboard, setClipboard] = useState<Block | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('brivio_clipboard')
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (parsed && typeof parsed === 'object' && 'id' in parsed) {
                        // Use a timeout to avoid calling setState synchronously in an effect
                        setTimeout(() => {
                            setClipboard(parsed as Block)
                        }, 0)
                    }
                } catch (err) {
                    console.error("Failed to parse clipboard", err)
                }
            }
        }
    }, [])

    const { settings } = useBrandDesign()

    // Dynamic width based on responsive selector
    const getResponsiveWidth = () => {
        switch (responsiveDevice) {
            case 'mobile': return 'max-w-[400px]'
            case 'desktop': return 'max-w-[1280px]'
            case 'widescreen': return 'max-w-none'
            default: return 'max-w-none'
        }
    }

    // Use editor history context (optional - returns null when not wrapped in provider)
    const historyContext = useEditorHistoryOptional()

    // Local state fallback when not wrapped in history provider
    const [localBlocks, setLocalBlocks] = useState<Block[]>(() => (activeModule?.content_json?.blocks || []) as Block[])
    const [prevModuleId, setPrevModuleId] = useState(activeModule?.id)

    // Adjust state when module changes
    if (activeModule?.id !== prevModuleId) {
        setPrevModuleId(activeModule?.id)
        setLocalBlocks((activeModule?.content_json?.blocks || []) as Block[])
    }

    // Use context blocks if available, otherwise local
    const blocks = historyContext?.blocks ?? localBlocks
    const setBlocks = historyContext?.setBlocks ?? setLocalBlocks
    const showDeleteToast = historyContext?.showDeleteToast


    const handleRequestAdd = (parentId: string, columnId: string) => {
        if (isReadOnly) return
        setAddingContext({ parentId, columnId })
        setIsAddItemOpen(true)
    }

    const handleAddBlock = (type: string, variant?: string) => {
        let content: Record<string, unknown> = { text: "" }

        // Initialize specific content structures
        if (type === 'heading') {
            content = {
                text: "Este é um Título padrão Brivio°",
                style: { fontSize: '82px' }
            }
        } else if (type === 'text') {
            content = {
                text: "Este é apenas um espaço em branco à espera da sua voz criativa. Substitua este texto quando a ideia certa aparecer.",
                style: { fontSize: '20px' }
            }
        }
        if (type === 'layout') {
            const cols = parseInt(variant?.split('-')[0] || '1')
            content = {
                columns: Array.from({ length: cols }).map(() => ({
                    id: generateId(),
                    blocks: []
                })),
                settings: {
                    columns: cols,
                    height: '385px',
                    paddingLock: true,
                    ratio: 0,
                    columnWidths: Array(cols).fill(1),
                    padding: { isLocked: true, top: 24, right: 24, bottom: 24, left: 24 }
                }
            }
        } else if (type === 'list' || type === 'do-dont') {
            content = { items: [] }
            if (variant === 'do-dont') content.items = [{ text: "", type: 'do' }, { text: "", type: 'dont' }]
        } else if (type === 'composite') {
            content = {
                image: null,
                text: "Este é apenas um espaço em branco à espera da sua voz criativa. Substitua este texto quando a ideia certa aparecer.",
                heading: "",
                reverse: false,
                style: { color: '#374151' } // Default to gray-700 equivalent
            }
        } else if (type === 'button') {
            content = {
                text: "Botão brivio°",
                style: {
                    backgroundColor: '#FF0054',
                    width: '150px',
                    height: '40px',
                    fontSize: '16px',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    textAlign: 'center',
                    fontWeight: 500
                }
            }
        } else if (type === 'palette') {
            content = {
                colors: []
            }
        } else if (['image', 'video'].includes(type)) {
            content = { url: "", caption: "" }
        }

        const newBlock: Block = {
            id: generateId(),
            type: type as Block['type'],
            variant: variant,
            content: content
        }

        let newBlocks = [...blocks]

        if (addingContext?.parentId) {
            // Add to nested column
            newBlocks = blocks.map((b: Block) => {
                if (b.id === addingContext.parentId && b.type === 'layout') {
                    const newColumns = b.content.columns.map((col: Record<string, unknown>) => {
                        if (col.id === addingContext.columnId) {
                            return { ...col, blocks: [...(col.blocks as Block[] || []), newBlock] }
                        }
                        return col
                    })
                    return { ...b, content: { ...b.content, columns: newColumns } }
                }
                return b
            })
        } else if (addingContext?.insertIndex !== undefined) {
            // Insert at specific index (Divider)
            newBlocks.splice(addingContext.insertIndex, 0, newBlock)
        } else {
            // Add to root (end)
            newBlocks = [...blocks, newBlock]
        }

        setBlocks(newBlocks)
        setAddingContext(null) // Reset context
        setIsAddSectionOpen(false)
        setIsAddItemOpen(false)

        // Optimistic update of parent/server state
        if (onUpdateModule && activeModule) {
            const updatedContent = {
                ...activeModule.content_json,
                blocks: newBlocks
            }
            console.log('[MainCanvas] Calling onUpdateModule with:', { moduleId: activeModule.id, blocksCount: newBlocks.length })
            onUpdateModule(activeModule.id, updatedContent)
        }
    }

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        if (isReadOnly || !activeModule) return
        const newBlocks = [...blocks]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= newBlocks.length) return

        // Swap
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
        setBlocks(newBlocks)

        // Persist
        if (onUpdateModule) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleUpdateBlock = (blockId: string, content: Record<string, unknown>) => {
        console.log('[MainCanvas] handleUpdateBlock called for:', blockId)

        const updateRecursive = (list: Block[]): Block[] => {
            return list.map(b => {
                if (b.id === blockId) {
                    // If content has position, lift it to the block level
                    const { position, ...restContent } = content as { position?: { x: number; y: number } }
                    return {
                        ...b,
                        content: restContent as Block['content'],
                        position: position || b.position
                    }
                }
                if (b.type === 'layout' && b.content?.columns) {
                    const newColumns = (b.content.columns as unknown[]).map((col: unknown) => {
                        const c = col as { id: string, blocks: Block[] }
                        return {
                            ...c,
                            blocks: updateRecursive(c.blocks || [])
                        }
                    })
                    return { ...b, content: { ...b.content, columns: newColumns } }
                }
                return b
            })
        }

        const newBlocks = updateRecursive(blocks)
        setBlocks(newBlocks)

        // Persist to server (debounced in parent)
        if (onUpdateModule && activeModule) {
            const updatedContent = {
                ...activeModule.content_json,
                blocks: newBlocks
            }
            onUpdateModule(activeModule.id, updatedContent)
        }
    }

    const handleDuplicateBlock = (blockId: string) => {
        console.log('[MainCanvas] handleDuplicateBlock called for:', blockId)

        let blockToClone: Block | null = null

        const findAndCloneRecursive = (list: Block[]): Block[] => {
            const newList: Block[] = []
            for (const b of list) {
                newList.push(b)
                if (b.id === blockId) {
                    blockToClone = JSON.parse(JSON.stringify(b))
                    if (blockToClone) {
                        blockToClone.id = generateId()
                        newList.push(blockToClone)
                    }
                } else if (b.type === 'layout' && b.content?.columns) {
                    const newColumns = (b.content.columns as unknown[]).map((col: unknown) => {
                        const c = col as { id: string, blocks: Block[] }
                        return {
                            ...c,
                            blocks: findAndCloneRecursive(c.blocks || [])
                        }
                    })
                    b.content.columns = newColumns
                }
            }
            return newList
        }

        const newBlocks = findAndCloneRecursive(JSON.parse(JSON.stringify(blocks)))
        setBlocks(newBlocks)

        if (onUpdateModule && activeModule) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleCopyBlock = (blockId: string) => {
        const findBlock = (list: Block[]): Block | null => {
            for (const b of list) {
                if (b.id === blockId) return b
                if (b.type === 'layout' && b.content?.columns) {
                    for (const col of b.content.columns) {
                        const found = findBlock(col.blocks || [])
                        if (found) return found
                    }
                }
            }
            return null
        }

        const block = findBlock(blocks)
        if (block) {
            setClipboard(block)
            localStorage.setItem('brivio_clipboard', JSON.stringify(block))
            // Also try to copy to system clipboard
            try {
                navigator.clipboard.writeText(JSON.stringify(block))
            } catch { /* ignore */ }
        }
    }

    const handlePasteBlock = (parentId?: string, columnId?: string, insertIndex?: number) => {
        if (!clipboard) return

        const deepCloneWithNewIds = (obj: unknown): unknown => {
            if (Array.isArray(obj)) {
                return obj.map(item => deepCloneWithNewIds(item))
            } else if (obj && typeof obj === 'object') {
                const newObj: Record<string, unknown> = { ...(obj as Record<string, unknown>) }
                if (newObj.id) newObj.id = generateId()
                for (const key in newObj) {
                    if (key !== 'id') {
                        newObj[key] = deepCloneWithNewIds(newObj[key])
                    }
                }
                return newObj
            }
            return obj
        }

        const newBlock = deepCloneWithNewIds(JSON.parse(JSON.stringify(clipboard))) as Block
        let newBlocks = [...blocks]

        if (parentId && columnId) {
            newBlocks = blocks.map((b: Block) => {
                if (b.id === parentId && b.type === 'layout') {
                    const columns = (b.content.columns || []) as Array<{ id: string, blocks: Block[] }>
                    const newColumns = columns.map(c => {
                        if (c.id === columnId) {
                            return { ...c, blocks: [...(c.blocks || []), newBlock] }
                        }
                        return c
                    })
                    return { ...b, content: { ...b.content, columns: newColumns } }
                }
                return b
            })
        } else if (insertIndex !== undefined) {
            newBlocks.splice(insertIndex, 0, newBlock)
        } else {
            newBlocks.push(newBlock)
        }

        setBlocks(newBlocks, 'Paste element')
        if (onUpdateModule && activeModule && !historyContext) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleClearClipboard = useCallback(() => {
        console.log('[MainCanvas] handleClearClipboard called')
        setClipboard(null)
        localStorage.removeItem('brivio_clipboard')
        try {
            navigator.clipboard.writeText('')
        } catch { /* ignore */ }
    }, [])

    const handleDeleteBlock = (blockId: string) => {
        console.log('[MainCanvas] handleDeleteBlock called for:', blockId)

        // Find the block type before deleting
        const findBlockType = (list: Block[]): string | null => {
            for (const b of list) {
                if (b.id === blockId) return b.type
                if (b.type === 'layout' && b.content?.columns) {
                    for (const col of b.content.columns) {
                        const found = findBlockType(col.blocks || [])
                        if (found) return found
                    }
                }
            }
            return null
        }
        const deletedBlockType = findBlockType(blocks)

        const deleteRecursive = (list: Block[]): Block[] => {
            return list.filter((b: Block) => b.id !== blockId).map((b: Block) => {
                if (b.type === 'layout' && b.content?.columns) {
                    const newColumns = (b.content.columns as unknown[]).map((col: unknown) => {
                        const c = col as { id: string, blocks: Block[] }
                        return {
                            ...c,
                            blocks: deleteRecursive(c.blocks || [])
                        }
                    })
                    return { ...b, content: { ...b.content, columns: newColumns } }
                }
                return b
            })
        }

        const newBlocks = deleteRecursive(blocks)
        setBlocks(newBlocks, 'Delete block')
        onSelectBlock(null)

        // Show toast with undo shortcut
        if (showDeleteToast && deletedBlockType) {
            showDeleteToast(deletedBlockType)
        }

        if (onUpdateModule && activeModule && !historyContext) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleCutBlock = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId)
        if (block) {
            try {
                navigator.clipboard.writeText(JSON.stringify(block))
            } catch (e) {
                console.error("Failed to copy to clipboard", e)
            }
        }
        handleDeleteBlock(blockId)
    }

    const handleSaveAsComponent = () => {
        alert("Funcionalidade de salvar componente em desenvolvimento.")
    }

    const handleUpdateSectionSettings = (blockId: string, newSettings: SectionSettings) => {
        const blockIndex = blocks.findIndex(b => b.id === blockId)
        if (blockIndex === -1) return

        const currentBlock = blocks[blockIndex]
        const currentCols = (currentBlock.content.columns as unknown[]) || []
        const currentCount = currentCols.length
        const newCount = newSettings.columns

        let newCols = [...currentCols]

        // Handle Column Resizing
        if (newCount > currentCount) {
            // Add columns
            const toAdd = newCount - currentCount
            for (let i = 0; i < toAdd; i++) {
                newCols.push({ id: generateId(), blocks: [] })
            }
        } else if (newCount < currentCount) {
            // Remove columns (truncate)
            newCols = newCols.slice(0, newCount)
        }

        const updatedContent = {
            ...currentBlock.content,
            columns: newCols,
            settings: newSettings
        }

        handleUpdateBlock(blockId, updatedContent)
    }

    if (!activeModule) {
        return (
            <div className="flex-1 h-full bg-white p-8 pt-16 custom-scrollbar flex flex-col items-center relative">
                {!isReadOnly && (
                    <div className="mb-8 mt-4">
                        <Button
                            onClick={() => {
                                setAddingContext(null)
                                setIsAddSectionOpen(true)
                            }}
                            className="bg-pink-300 hover:bg-pink-400 text-white font-medium px-8 shadow-lg shadow-pink-500/20 rounded-md h-10"
                        >
                            Add Sessão
                        </Button>
                    </div>
                )}
                <div className="text-center text-gray-500 max-w-md">
                    <h2 className="text-xl font-medium text-gray-900 mb-2">Editor Canvas</h2>
                    <p>Select a module from the sidebar{isReadOnly ? "." : " or click \"Add Sessão\" to create a new one."}</p>
                </div>
                <AddSectionDialog
                    isOpen={isAddSectionOpen}
                    onOpenChange={(open) => {
                        setIsAddSectionOpen(open)
                        if (!open) setAddingContext(null)
                    }}
                    onSelectBlock={handleAddBlock}
                    hasClipboard={!!clipboard}
                    onPaste={() => handlePasteBlock(undefined, undefined, addingContext?.insertIndex)}
                    onClearClipboard={handleClearClipboard}
                />
                <AddItemDialog
                    isOpen={isAddItemOpen}
                    onOpenChange={(open) => {
                        setIsAddItemOpen(open)
                        if (!open) setAddingContext(null)
                    }}
                    onSelectBlock={handleAddBlock}
                    hasClipboard={!!clipboard}
                    onPaste={() => handlePasteBlock(addingContext?.parentId, addingContext?.columnId)}
                    onClearClipboard={handleClearClipboard}
                />
            </div>
        )
    }

    return (
        <>
            <div
                className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-white p-0 custom-scrollbar relative transition-colors duration-300"
                style={{ backgroundColor: settings.main_project_bg }}
            >
                <div className={cn(
                    "w-full min-h-[800px] bg-transparent p-0 relative overflow-visible transition-all duration-300",
                    getResponsiveWidth(),
                    responsiveDevice !== 'widescreen' && "mx-auto",
                    !isReadOnly && "pt-[80px]"
                )}>
                    <div className="w-full text-gray-600 overflow-visible">
                        <div className={cn("w-full", !isReadOnly ? "space-y-6" : "", "overflow-visible")}>
                            {blocks.length > 0 ? (
                                <>
                                    {/* Divider before first section */}
                                    {!isReadOnly && (
                                        <SectionDivider
                                            onClick={() => {
                                                setAddingContext({ insertIndex: 0 })
                                                setIsAddSectionOpen(true)
                                            }}
                                            onPaste={() => handlePasteBlock(undefined, undefined, 0)}
                                            onClear={handleClearClipboard}
                                            hasClipboard={!!clipboard}
                                        />
                                    )}

                                    {blocks.map((block, index) => (
                                        <React.Fragment key={block.id}>
                                            <SectionWrapper
                                                onMoveUp={() => handleMoveBlock(index, 'up')}
                                                onMoveDown={() => handleMoveBlock(index, 'down')}
                                                onEdit={(e: React.MouseEvent) => {
                                                    const rect = e.currentTarget.getBoundingClientRect()
                                                    // Position to the left of the button (280px width + 10px gap)
                                                    setPanelInitialPos({ top: rect.top, left: rect.left - 290 })
                                                    onSelectBlock(activeBlockId === block.id ? null : block.id)
                                                }}
                                                isFirst={index === 0}
                                                isLast={index === blocks.length - 1}
                                                settingsPanel={
                                                    activeBlockId === block.id && (
                                                        <SectionSettingsPanel
                                                            settings={block.content.settings}
                                                            onUpdate={(newSettings) => handleUpdateSectionSettings(block.id, newSettings)}
                                                            onClose={() => onSelectBlock(null)}
                                                            onCut={() => handleCutBlock(block.id)}
                                                            onSaveAsComponent={() => handleSaveAsComponent()}
                                                            onDuplicate={() => handleDuplicateBlock(block.id)}
                                                            onCopy={() => handleCopyBlock(block.id)}
                                                            onDelete={() => handleDeleteBlock(block.id)}
                                                            initialTop={panelInitialPos?.top}
                                                            initialLeft={panelInitialPos?.left}
                                                            brandId={brandId}
                                                            moduleId={activeModule.id}
                                                        />
                                                    )
                                                }
                                                settings={block.content.settings}
                                                isReadOnly={isReadOnly}
                                            >
                                                <BlockRenderer
                                                    block={block}
                                                    isReadOnly={isReadOnly}
                                                    onUpdate={handleUpdateBlock}
                                                    onAddBlock={(parentId, colId) => handleRequestAdd(parentId, colId)}
                                                    onSelect={onSelectBlock}
                                                    activeBlockId={activeBlockId}
                                                    onDelete={handleDeleteBlock}
                                                    onDuplicate={handleDuplicateBlock}
                                                    onCopy={handleCopyBlock}
                                                    onAnimate={() => onAnimate?.()}
                                                    align={block.content.settings?.alignHorizontal || 'center'}
                                                />
                                            </SectionWrapper>

                                            {!isReadOnly && (
                                                <SectionDivider
                                                    onClick={() => {
                                                        setAddingContext({ insertIndex: index + 1 })
                                                        setIsAddSectionOpen(true)
                                                    }}
                                                    onPaste={() => handlePasteBlock(undefined, undefined, index + 1)}
                                                    onClear={handleClearClipboard}
                                                    hasClipboard={!!clipboard}
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </>
                            ) : (
                                /* Empty State */
                                !isReadOnly && (
                                    <>
                                        <div className="flex justify-center items-center gap-4 py-8">
                                            <Button
                                                onClick={() => {
                                                    setAddingContext(null)
                                                    setIsAddSectionOpen(true)
                                                }}
                                                className="bg-[#FF85A1] hover:bg-[#FF7091] text-white font-semibold px-6 shadow-sm rounded-full h-11 tracking-wide text-sm flex items-center gap-2 border-none"
                                            >
                                                <span>+ Add Section</span>
                                            </Button>

                                            {clipboard && (
                                                <div className="flex gap-1 items-center">
                                                    <Button
                                                        onClick={() => handlePasteBlock()}
                                                        className="bg-[#8E8E8E] hover:bg-[#7A7A7A] text-white font-semibold px-6 shadow-sm rounded-full h-11 tracking-wide text-sm flex items-center gap-2 border-none"
                                                    >
                                                        <Clipboard className="w-4 h-4" />
                                                        <span>Paste</span>
                                                    </Button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleClearClipboard(); }}
                                                        className="w-11 h-11 rounded-full bg-[#8E8E8E]/20 text-[#8E8E8E] hover:text-green-500 hover:bg-green-500/10 transition-all flex items-center justify-center border border-[#8E8E8E]/30"
                                                        title="Clear Clipboard"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center p-12 text-gray-400 italic">
                                            Start adding sections to build your page.
                                        </div>
                                    </>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AddSectionDialog
                isOpen={isAddSectionOpen}
                onOpenChange={(open) => {
                    setIsAddSectionOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
                hasClipboard={!!clipboard}
                onPaste={() => handlePasteBlock(undefined, undefined, addingContext?.insertIndex)}
                onClearClipboard={handleClearClipboard}
            />

            <AddItemDialog
                isOpen={isAddItemOpen}
                onOpenChange={(open) => {
                    setIsAddItemOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
                hasClipboard={!!clipboard}
                onPaste={() => handlePasteBlock(addingContext?.parentId, addingContext?.columnId)}
                onClearClipboard={handleClearClipboard}
            />
        </>
    )
}

// Wrapper component that provides history context
export function MainCanvasWithHistory(props: MainCanvasProps) {
    const { activeModule, onUpdateModule } = props
    const initialBlocks = (activeModule?.content_json?.blocks || []) as Block[]

    const handleBlocksChange = useCallback((newBlocks: Block[]) => {
        if (onUpdateModule && activeModule) {
            onUpdateModule(activeModule.id, {
                ...activeModule.content_json,
                blocks: newBlocks
            })
        }
    }, [onUpdateModule, activeModule])

    return (
        <EditorHistoryProvider
            initialBlocks={initialBlocks}
            onBlocksChange={handleBlocksChange}
        >
            <MainCanvas {...props} />
            <EditorToast />
        </EditorHistoryProvider>
    )
}
