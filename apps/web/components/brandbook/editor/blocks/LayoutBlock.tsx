"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
// Cyclical dependency risk? We will import BlockRenderer dynamically or pass it as prop? 
// Usually better to have a generic renderer or Import it.
// React handles circular imports fine usually for components if implementation is clean.
import { BlockRenderer } from "./BlockRenderer"
import { Plus, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ColumnSettingsPanel } from "./ColumnSettingsPanel"
import { useState, useRef, useEffect } from "react"
import { ColumnSplitter } from "./ColumnSplitter"
import { useBrandDesign } from "../BrandDesignContext"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"

interface LayoutBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onAddBlock: (parentId: string, columnId: string, type: string, variant?: string) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onAnimate?: () => void
}

export const LayoutBlock = ({ block, isReadOnly, onUpdate, onAddBlock, onSelect, activeBlockId, onDuplicate, onAnimate }: LayoutBlockProps) => {
    const { brandId } = useBrandDesign()
    // Determine columns from variant or content
    // content.columns = [{ id: 'col-1', blocks: [] }, ...]
    const columns = block.content.columns || []

    const colCount = columns.length

    // Grid class based on colCount
    const getGridClass = (count: number) => {
        switch (count) {
            case 2: return "grid-cols-1 sm:grid-cols-2"
            case 3: return "grid-cols-1 sm:grid-cols-3"
            case 4: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            default: return "grid-cols-1"
        }
    }

    const getHeight = (settingsHeight: string | undefined) => {
        if (!settingsHeight) return 'auto' // Default to auto for fit-to-content

        switch (settingsHeight) {
            case 'XS': return '150px'
            case 'S': return '250px'
            case 'M': return '385px'
            case 'L': return '500px'
            case 'XL': return '650px'
            default: return settingsHeight // Custom value like '385px'
        }
    }

    const handleColumnUpdate = (colId: string, blockId: string, newContent: any) => {
        const newColumns = columns.map((col: any) => {
            if (col.id === colId) {
                return {
                    ...col,
                    blocks: col.blocks.map((b: Block) => b.id === blockId ? { ...b, content: newContent } : b)
                }
            }
            return col
        })
        onUpdate(block.id, { ...block.content, columns: newColumns })
    }

    const handleColumnSettingsChange = (colId: string, settings: any) => {
        const newColumns = columns.map((col: any) => {
            if (col.id === colId) {
                // Special handling for minHeight to ensure units
                if (settings.minHeight) {
                    const val = settings.minHeight
                    if (val !== 'auto' && !isNaN(val) && val !== '') {
                        settings.minHeight = `${val}px`
                    }
                    if (val === '') settings.minHeight = 'auto'
                }
                return {
                    ...col,
                    settings: { ...col.settings, ...settings }
                }
            }
            return col
        })
        onUpdate(block.id, { ...block.content, columns: newColumns })
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, colId: string) => {
        const file = e.target.files?.[0]
        if (file && brandId) {
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('brandId', brandId)
                formData.append('moduleId', block.id)

                const result = await uploadBrandbookMedia(formData)
                if (result.success && result.url) {
                    handleColumnSettingsChange(colId, { backgroundImage: result.url })
                } else {
                    console.error('Failed to upload column background:', result.error)
                    alert('Erro ao carregar fundo da coluna.')
                }
            } catch (err) {
                console.error('Error in column background upload:', err)
            }
        }
    }

    const handleBlockMove = (blockId: string, direction: 'up' | 'down') => {
        const newColumns = columns.map((col: any) => {
            const blockIndex = col.blocks.findIndex((b: Block) => b.id === blockId)
            if (blockIndex === -1) return col

            const newBlocks = [...col.blocks]
            const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1

            // Bounds check
            if (targetIndex < 0 || targetIndex >= newBlocks.length) return col

            // Swap
            const temp = newBlocks[blockIndex]
            newBlocks[blockIndex] = newBlocks[targetIndex]
            newBlocks[targetIndex] = temp

            return {
                ...col,
                blocks: newBlocks
            }
        })

        onUpdate(block.id, { ...block.content, columns: newColumns })
    }

    const handleBlockDuplicate = (blockId: string) => {
        const generateId = () => Math.random().toString(36).substr(2, 9)

        const newColumns = columns.map((col: any) => {
            const blockIndex = col.blocks.findIndex((b: Block) => b.id === blockId)
            if (blockIndex === -1) return col

            // Found the block, duplicate it
            const blockToClone = col.blocks[blockIndex]
            const clonedBlock = JSON.parse(JSON.stringify(blockToClone))
            clonedBlock.id = generateId()

            // Insert the clone after the original
            const newBlocks = [...col.blocks]
            newBlocks.splice(blockIndex + 1, 0, clonedBlock)

            return {
                ...col,
                blocks: newBlocks
            }
        })

        onUpdate(block.id, { ...block.content, columns: newColumns })
    }

    const handleColumnMove = (index: number, direction: 'left' | 'right') => {
        const newColumns = [...columns]
        const targetIndex = direction === 'left' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= newColumns.length) return

        // Swap columns
        const temp = newColumns[index]
        newColumns[index] = newColumns[targetIndex]
        newColumns[targetIndex] = temp

        let updatedContent = { ...block.content, columns: newColumns }

        // Swap widths if they exist in settings
        const currentWidths = block.content.settings?.columnWidths || []
        if (currentWidths.length === newColumns.length) {
            const newWidths = [...currentWidths]
            const tempW = newWidths[index]
            newWidths[index] = newWidths[targetIndex]
            newWidths[targetIndex] = tempW

            updatedContent.settings = {
                ...updatedContent.settings,
                columnWidths: newWidths
            }
            // Update local state to reflect change immediately without waiting for prop sync sometimes
            setLocalWidths(newWidths)
        }

        onUpdate(block.id, updatedContent)
    }

    // State to track open panel for specific column
    const [openSettingsColId, setOpenSettingsColId] = useState<string | null>(null)

    // Track width changes during drag locally before committing to block content
    // This makes dragging smooth without triggering full block updates on every frame if expensive
    // But for React scale, updating state is usually fine.
    // We need to initialize column widths if unlocked
    const isGridUnlocked = block.content.settings?.isGridUnlocked || false
    const [localWidths, setLocalWidths] = useState<number[]>([])

    // Ref to access localWidths inside useEffect without adding it to dependencies (avoiding loops)
    const localWidthsRef = useRef(localWidths)
    useEffect(() => { localWidthsRef.current = localWidths }, [localWidths])

    // Track previous unlock state to distinguish "Locking" from "Refining Grid"
    const prevIsGridUnlocked = useRef(isGridUnlocked)
    useEffect(() => { prevIsGridUnlocked.current = isGridUnlocked }, [isGridUnlocked])

    const getWidthsFromOption = (count: number, option: number): number[] => {
        if (count === 2) {
            switch (option) {
                case 0: return [1, 1]
                case 1: return [1, 3]
                case 2: return [3, 1]
            }
        }
        if (count === 3) {
            switch (option) {
                case 0: return [1, 1, 1]
                case 1: return [2, 1, 1]
                case 2: return [1, 2, 1]
                case 3: return [1, 1, 2]
            }
        }
        return Array(count).fill(1)
    }

    // Initialize or sync widths when unlocked
    useEffect(() => {
        const propWidths = block.content.settings?.columnWidths
        // Helper to check equality to avoid loops
        const areWidthsEqual = (a: number[], b: number[]) => {
            if (a.length !== b.length) return false
            return a.every((val, index) => val === b[index])
        }

        if (propWidths && propWidths.length > 0) {
            if (!areWidthsEqual(localWidthsRef.current, propWidths)) {
                setLocalWidths(propWidths)
            }
        } else if (isGridUnlocked) {
            // If unlocked but no custom widths, initialize from current grid option
            if (localWidthsRef.current.length === 0) {
                const defaultWidths = getWidthsFromOption(colCount, block.content.settings?.gridOption || 0)
                setLocalWidths(defaultWidths)
            }
        } else {
            // Locked and no custom widths.
            // ONLY clear if we did NOT just switch from Unlocked -> Locked.
            // If we just locked, we want to visually PERSIST the custom widths (acting as Edit Mode toggle).
            // If we didn't just lock (meaning we are already locked and maybe changed grid preset), then clear.
            const justLocked = prevIsGridUnlocked.current === true && isGridUnlocked === false

            if (!justLocked && localWidthsRef.current.length > 0) {
                setLocalWidths([])
            }
        }
    }, [isGridUnlocked, colCount, block.content.settings?.columnWidths, block.content.settings?.gridOption])

    // Ref to store widths at the start of a drag operation
    const dragStartWidths = useRef<number[]>([])

    const handleResizeStart = () => {
        dragStartWidths.current = [...localWidths]
    }

    const handleResize = (index: number, delta: number) => {
        // index is the splitter index. Splitter i is between Col i and Col i+1
        if (dragStartWidths.current.length === 0) return

        // Calculate delta in fr units
        // We need container width to convert px delta to fr
        const container = document.getElementById(`layout-block-${block.id}`)
        if (!container) return

        const gapPixels = 32 // gap-8 = 2rem = 32px
        const totalGap = gapPixels * (colCount - 1)
        const availableWidth = container.offsetWidth - totalGap

        // Avoid divide by zero
        if (availableWidth <= 0) return

        const totalFr = dragStartWidths.current.reduce((sum, w) => sum + w, 0)

        // 1px snapping logic:
        // Convert starting width to pure pixels
        const startLeftFr = dragStartWidths.current[index]
        const startRightFr = dragStartWidths.current[index + 1]

        const startLeftPx = (startLeftFr / totalFr) * availableWidth

        // Calculate new Left Pixel Width, strictly rounded to integer for "1px snap"
        // delta is relative to start location
        const newLeftPx = Math.round(startLeftPx + delta)

        // Convert back to Fr
        const newLeftFr = (newLeftPx / availableWidth) * totalFr
        const sumFr = startLeftFr + startRightFr
        const newRightFr = sumFr - newLeftFr

        const newWidths = [...dragStartWidths.current]

        // Constraints (min 10% of totalFr, max 90% of totalFr)
        const minFr = totalFr * 0.1

        // Check constraints against the calculated potential values
        if (newLeftFr < minFr || newRightFr < minFr) return

        newWidths[index] = newLeftFr
        newWidths[index + 1] = newRightFr

        setLocalWidths(newWidths)
    }

    const handleResizeEnd = () => {
        // Commit new widths to block content
        // Use ref to get LATEST localWidths since this callback might be stale (closed over at drag start)
        onUpdate(block.id, {
            ...block.content,
            settings: {
                ...block.content.settings,
                columnWidths: localWidthsRef.current
            }
        })
    }

    const getGridTemplate = (count: number, option: number) => {
        if (count === 1) {
            return "1fr"
        }
        if (count === 2) {
            switch (option) {
                case 0: return "repeat(2, 1fr)" // 50/50
                case 1: return "1fr 3fr"        // 25/75 (Index 1)
                case 2: return "3fr 1fr"        // 75/25 (Index 2)
            }
        }
        if (count === 3) {
            switch (option) {
                case 0: return "repeat(3, 1fr)" // 33/33/33
                case 1: return "2fr 1fr 1fr"    // 50/25/25
                case 2: return "1fr 2fr 1fr"    // 25/50/25
                case 3: return "1fr 1fr 2fr"    // 25/25/50
            }
        }
        if (count === 4) {
            return "repeat(4, 1fr)"
        }
        return `repeat(${count}, 1fr)`
    }

    const appliedTemplate = localWidths.length === colCount
        ? localWidths.map(w => `${w}fr`).join(' ')
        : getGridTemplate(colCount, block.content.settings?.gridOption || 0) || undefined

    const aspectRatio = block.content.settings?.aspectRatio
    const hasAspectRatio = aspectRatio && aspectRatio !== 'auto'
    const isFullWidth = block.content.settings?.isFullWidth || false
    const isFullHeight = block.content.settings?.isFullHeight || false
    const noColumnGap = block.content.settings?.noColumnGap || false
    const columnGap = block.content.settings?.columnGap ?? 32
    const gapValue = noColumnGap ? 0 : columnGap

    return (
        <div
            className={cn("grid w-full h-full min-h-0 transition-all duration-300 relative overflow-visible", getGridClass(colCount))}
            id={`layout-block-${block.id}`}
            style={{
                padding: '0px',
                gap: `${gapValue}px`,
                gridTemplateColumns: appliedTemplate,
                aspectRatio: hasAspectRatio ? aspectRatio.replace(':', '/') : undefined,
                maxHeight: '100%'
            }}
        >
            {columns.map((col: any, index: number) => {
                // Alignment helpers for this column
                // In flex-col: alignItems = horizontal, justifyContent = vertical
                const getAlignItems = () => {
                    // Horizontal alignment (left/center/right)
                    switch (col.settings?.alignHorizontal) {
                        case 'center': return 'center'
                        case 'right': return 'flex-end'
                        default: return 'flex-start' // left
                    }
                }
                const getJustifyContent = () => {
                    // Vertical alignment (top/middle/bottom)
                    switch (col.settings?.alignVertical) {
                        case 'top': return 'flex-start'
                        case 'bottom': return 'flex-end'
                        default: return 'center' // middle (default)
                    }
                }

                return (
                    <div
                        key={col.id}
                        className={cn(
                            "relative group/col flex flex-col transition-all duration-300 overflow-visible w-full",
                            col.blocks && col.blocks.length > 0 ? "min-h-0" : `min-h-[32px] ${!isReadOnly ? "border border-dashed border-gray-200 hover:border-[#FF0054]" : ""}`
                        )}
                        style={{
                            gap: `${col.settings?.blockGap ?? 16}px`,
                            minHeight: col.blocks?.some((b: any) => b.type === 'gallery' || b.type === 'carousel')
                                ? 'auto'
                                : (col.settings?.minHeight && col.settings.minHeight !== 'auto'
                                    ? col.settings.minHeight
                                    : (hasAspectRatio ? '100%' : getHeight(block.content.settings?.height))),
                            paddingTop: col.settings?.padding?.top ?? (isFullHeight ? 0 : (block.content.settings?.padding?.top ?? 24)),
                            paddingBottom: col.settings?.padding?.bottom ?? (isFullHeight ? 0 : (block.content.settings?.padding?.bottom ?? 24)),
                            paddingLeft: col.settings?.padding?.left ?? (isFullWidth ? 0 : (block.content.settings?.padding?.left ?? 24)),
                            paddingRight: col.settings?.padding?.right ?? (isFullWidth ? 0 : (block.content.settings?.padding?.right ?? 24)),
                            backgroundColor: col.settings?.backgroundColor || 'transparent',
                            backgroundImage: col.settings?.backgroundImage ? `url(${col.settings.backgroundImage})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: `${col.settings?.radius || 0}px`,
                            borderWidth: col.settings?.borderWidth ? `${col.settings.borderWidth}px` : undefined,
                            borderColor: col.settings?.borderColor || undefined,
                            borderStyle: col.settings?.borderWidth ? (col.settings?.borderStyle || 'dashed') : undefined,
                            position: col.settings?.isFixed ? 'sticky' : undefined, // Assuming fixed -> sticky for now + top 0
                            top: col.settings?.isFixed ? 0 : undefined,
                            zIndex: col.settings?.isFixed ? 10 : undefined,
                            // Individual column width/height settings
                            width: col.settings?.isFullWidth ? '100%' : (col.settings?.columnWidth && col.settings.columnWidth !== 'auto' ? col.settings.columnWidth : undefined),
                            height: col.settings?.isFullHeight ? '100%' : (col.settings?.columnHeight && col.settings.columnHeight !== 'auto' ? col.settings.columnHeight : '100%'),
                            maxHeight: '100%',
                            justifyContent: getJustifyContent(),
                            alignItems: getAlignItems(),
                        }}
                    >
                        {/* Hidden File Input for Background Upload */}
                        <input
                            type="file"
                            id={`upload-bg-${col.id}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, col.id)}
                        />

                        {/* Column Settings Trigger Overlay */}
                        {!isReadOnly && (
                            <div className="absolute top-0 left-0 z-50 opacity-0 group-hover/col:opacity-100 transition-opacity flex items-center gap-2 -translate-y-full">
                                <ColumnSettingsPanel
                                    isOpen={openSettingsColId === col.id}
                                    onOpenChange={(open) => setOpenSettingsColId(open ? col.id : null)}
                                    minHeight={col.settings?.minHeight ? col.settings.minHeight.replace('px', '') : 'auto'}
                                    onMinHeightChange={(val) => handleColumnSettingsChange(col.id, { minHeight: val })}
                                    backgroundColor={col.settings?.backgroundColor || '#ffffff'} // Default logic?
                                    onBackgroundColorChange={(color) => handleColumnSettingsChange(col.id, { backgroundColor: color })}
                                    onUploadBackground={() => document.getElementById(`upload-bg-${col.id}`)?.click()}
                                    radius={col.settings?.radius || 0}
                                    onRadiusChange={(val) => handleColumnSettingsChange(col.id, { radius: val })}
                                    borderWidth={col.settings?.borderWidth || 0}
                                    onBorderWidthChange={(val) => handleColumnSettingsChange(col.id, { borderWidth: val })}
                                    borderColor={col.settings?.borderColor || '#000000'}
                                    onBorderColorChange={(color) => handleColumnSettingsChange(col.id, { borderColor: color })}
                                    borderStyle={col.settings?.borderStyle || 'dashed'}
                                    onBorderStyleChange={(style) => handleColumnSettingsChange(col.id, { borderStyle: style })}
                                    isFixed={col.settings?.isFixed || false}
                                    onFixedChange={(val) => handleColumnSettingsChange(col.id, { isFixed: val })}
                                    padding={col.settings?.padding || block.content.settings?.padding || { isLocked: true, top: 24, right: 24, bottom: 24, left: 24 }}
                                    onPaddingChange={(val) => handleColumnSettingsChange(col.id, { padding: val })}
                                    alignHorizontal={col.settings?.alignHorizontal || 'left'}
                                    onAlignHorizontalChange={(align) => handleColumnSettingsChange(col.id, { alignHorizontal: align })}
                                    alignVertical={col.settings?.alignVertical || 'top'}
                                    onAlignVerticalChange={(align) => handleColumnSettingsChange(col.id, { alignVertical: align })}
                                    blockGap={col.settings?.blockGap ?? 16}
                                    onBlockGapChange={(gap) => handleColumnSettingsChange(col.id, { blockGap: gap })}
                                    isFreeFlow={col.settings?.isFreeFlow || false}
                                    onFreeFlowChange={(val) => handleColumnSettingsChange(col.id, { isFreeFlow: val })}
                                    columnWidth={col.settings?.columnWidth || 'auto'}
                                    onColumnWidthChange={(val) => handleColumnSettingsChange(col.id, { columnWidth: val })}
                                    columnHeight={col.settings?.columnHeight || 'auto'}
                                    onColumnHeightChange={(val) => handleColumnSettingsChange(col.id, { columnHeight: val })}
                                    isFullWidth={col.settings?.isFullWidth || false}
                                    onFullWidthChange={(val) => handleColumnSettingsChange(col.id, { isFullWidth: val })}
                                    isFullHeight={col.settings?.isFullHeight || false}
                                    onFullHeightChange={(val) => handleColumnSettingsChange(col.id, { isFullHeight: val })}
                                    onReset={() => handleColumnSettingsChange(col.id, {
                                        minHeight: 'auto',
                                        padding: { isLocked: true, top: 24, right: 24, bottom: 24, left: 24 },
                                        backgroundColor: null,
                                        backgroundImage: null,
                                        radius: 0,
                                        borderWidth: 0,
                                        borderColor: null,
                                        borderStyle: 'dashed',
                                        isFixed: false,
                                        alignHorizontal: 'left',
                                        alignVertical: 'top',
                                        blockGap: 16,
                                        isFreeFlow: false,
                                        columnWidth: 'auto',
                                        columnHeight: 'auto',
                                        isFullWidth: false,
                                        isFullHeight: false
                                    })}
                                >
                                    <button
                                        className="bg-[#FF0054] text-white text-[10px] px-2 h-[24px] rounded-t-[4px] font-medium tracking-wide flex items-center gap-1 hover:bg-[#D90048] transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Edit column
                                    </button>
                                </ColumnSettingsPanel>

                                {colCount > 1 && (
                                    <div className="flex bg-[#FF0054] rounded-t-[4px] h-[24px] overflow-hidden">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleColumnMove(index, 'left') }}
                                            disabled={index === 0}
                                            className="px-2 hover:bg-[#D90048] disabled:opacity-50 transition-colors flex items-center justify-center text-white border-r border-white/20"
                                        >
                                            <ArrowLeft className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleColumnMove(index, 'right') }}
                                            disabled={index === colCount - 1}
                                            className="px-2 hover:bg-[#D90048] disabled:opacity-50 transition-colors flex items-center justify-center text-white"
                                        >
                                            <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Column Content Wrapper - Limited to Column Height and Allows Toolbars to Float */}
                        <div className="flex-1 w-full h-full min-h-0 overflow-visible relative flex flex-col" style={{ justifyContent: getJustifyContent(), alignItems: getAlignItems() }}>
                            {col.blocks.map((b: Block) => (
                                <div
                                    key={b.id}
                                    className={cn(
                                        "w-full flex flex-col transition-all duration-300 shrink-0 overflow-visible"
                                    )}
                                    style={{ alignItems: getAlignItems() }}
                                >
                                    <BlockRenderer
                                        block={b}
                                        isReadOnly={isReadOnly}
                                        onUpdate={(id, content) => handleColumnUpdate(col.id, id, content)}
                                        onAddBlock={onAddBlock}
                                        onSelect={onSelect}
                                        activeBlockId={activeBlockId}
                                        onMove={handleBlockMove}
                                        onDuplicate={handleBlockDuplicate}
                                        onAnimate={onAnimate}
                                        align={col.settings?.alignHorizontal || 'left'}
                                        isFreeFlow={col.settings?.isFreeFlow}
                                        onDelete={(id) => {
                                            // Deleting a block inside a column
                                            const newColumns = columns.map((c: any) => {
                                                if (c.id === col.id) {
                                                    return {
                                                        ...c,
                                                        blocks: c.blocks.filter((blk: Block) => blk.id !== id)
                                                    }
                                                }
                                                return c
                                            })
                                            onUpdate(block.id, { ...block.content, columns: newColumns })
                                        }}
                                    />
                                </div>
                            ))}

                            {/* Add Button for this column */}
                            {!isReadOnly && (
                                <Button
                                    variant="ghost"
                                    className="w-[65%] mx-auto h-8 border border-dashed text-gray-400 hover:text-pink-500 hover:border-pink-500 hover:bg-pink-50 mt-4 mb-2 shrink-0"
                                    onClick={() => {
                                        onAddBlock(block.id, col.id, 'request_dialog')
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Item
                                </Button>
                            )}
                        </div>

                        {/* Splitter (Only if unlocked and not last column) */}
                        {isGridUnlocked && !isReadOnly && index < colCount - 1 && (
                            <ColumnSplitter
                                index={index}
                                onResizeStart={handleResizeStart}
                                onResize={handleResize}
                                onResizeEnd={handleResizeEnd}
                            />
                        )}
                    </div>
                )
            }
            )}
        </div>
    )
}
