"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
// Cyclical dependency risk? We will import BlockRenderer dynamically or pass it as prop? 
// Usually better to have a generic renderer or Import it.
// React handles circular imports fine usually for components if implementation is clean.
import { BlockRenderer } from "./BlockRenderer"
import { copyBlock } from "../blockClipboard"
import { toast as clipToast } from "sonner"
import { Plus, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
// The column panel is the brandbook editor's: same options in both editors
import { ColumnSettingsPanel } from "@/components/brandbook/editor/blocks/ColumnSettingsPanel"
import { borderCss, hasBorder, resolveBorder } from "@/components/brandbook/editor/BorderControl"
import { getHoverProps } from "@/components/brandbook/editor/hoverEffects"
import { fullScreenHeight } from "@/components/brandbook/editor/SectionSettingsPanel"
import { useState, useRef, useEffect } from "react"
import { ColumnSplitter } from "./ColumnSplitter"
import { uploadProjectMedia } from "@/app/actions/projects"
import { toast } from "sonner"

/** «200» → «200px»; «auto» or empty → none */
const toCssSize = (value: unknown): string | undefined => {
    const text = value === undefined || value === null ? '' : String(value).trim()
    if (!text || text.toLowerCase() === 'auto') return undefined
    return /^-?\d+(\.\d+)?$/.test(text) ? `${text}px` : text
}

interface LayoutBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onAddBlock: (parentId: string, columnId: string, type: string, variant?: string) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
}

export const LayoutBlock = ({ block, isReadOnly, onUpdate, onAddBlock, onSelect, activeBlockId }: LayoutBlockProps) => {
    // Determine columns from variant or content
    // content.columns = [{ id: 'col-1', blocks: [] }, ...]
    const columns = block.content.columns || []

    const colCount = columns.length

    // Grid class based on colCount
    const getGridClass = (count: number) => {
        switch (count) {
            case 2: return "grid-cols-1 md:grid-cols-2"
            case 3: return "grid-cols-1 md:grid-cols-3"
            case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            default: return "grid-cols-1"
        }
    }

    const getHeight = (settingsHeight: string | undefined) => {
        if (!settingsHeight || settingsHeight === 'fit') return 'auto' // Default to auto for fit-to-content
        // Fill container: the section grows with the page; the columns take the section's room
        if (settingsHeight === 'fill') return '100%'
        if (settingsHeight === '100vh') return fullScreenHeight(block.content.settings, true)

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
        e.target.value = ''
        if (!file) return
        const toastId = toast.loading("A carregar a imagem…")
        const res = await uploadProjectMedia(file)
        if (res.success && res.url) {
            handleColumnSettingsChange(colId, { backgroundImage: res.url })
            toast.success("Imagem de fundo aplicada", { id: toastId })
        } else {
            toast.error("Não foi possível carregar a imagem.", { id: toastId })
        }
    }

    const handleDuplicateColumn = (colId: string) => {
        const colIndex = columns.findIndex((c: any) => c.id === colId)
        if (colIndex === -1) return
        const reId = (b: any): any => ({
            ...b,
            id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...(b.type === 'layout' && Array.isArray(b.content?.columns)
                ? { content: { ...b.content, columns: b.content.columns.map((c: any) => ({ ...c, id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, blocks: (c.blocks || []).map(reId) })) } }
                : {}),
        })
        const source = JSON.parse(JSON.stringify(columns[colIndex]))
        const clone = { ...source, id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, blocks: (source.blocks || []).map(reId) }
        const newColumns = [...columns]
        newColumns.splice(colIndex + 1, 0, clone)
        onUpdate(block.id, { ...block.content, columns: newColumns, settings: { ...block.content.settings, columns: newColumns.length, columnWidths: Array(newColumns.length).fill(1) } })
        setOpenSettingsColId(null)
    }

    const handleDeleteColumn = (colId: string) => {
        if (columns.length <= 1) {
            toast.error("A secção precisa de ter pelo menos uma coluna.")
            return
        }
        const newColumns = columns.filter((c: any) => c.id !== colId)
        onUpdate(block.id, { ...block.content, columns: newColumns, settings: { ...block.content.settings, columns: newColumns.length, columnWidths: Array(newColumns.length).fill(1) } })
        setOpenSettingsColId(null)
    }

    // A copy of a block right under it, in the same column (new ids inside too)
    const handleBlockDuplicate = (blockId: string) => {
        const fresh = () => Math.random().toString(36).slice(2, 11)
        const renew = (value: any): any => Array.isArray(value) ? value.map(renew)
            : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'id' && typeof v === 'string' ? fresh() : renew(v)]))
            : value
        const newColumns = columns.map((col: any) => {
            const i = (col.blocks || []).findIndex((b: Block) => b.id === blockId)
            if (i === -1) return col
            const next = [...col.blocks]
            next.splice(i + 1, 0, renew(col.blocks[i]))
            return { ...col, blocks: next }
        })
        onUpdate(block.id, { ...block.content, columns: newColumns })
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
        return undefined
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

    // Section alignment positions the columns themselves (their content has its own column alignment).
    // Vertical: 'top' keeps columns stretched to the row; 'middle'/'bottom' let them shrink to their content and align.
    const sectionAlignHorizontal = block.content.settings?.alignHorizontal || 'center'
    const sectionAlignVertical = block.content.settings?.alignVertical || 'top'
    const alignColumnsVertically = sectionAlignVertical === 'middle' || sectionAlignVertical === 'bottom'
    const columnJustifySelf = sectionAlignHorizontal === 'left' ? 'start' : sectionAlignHorizontal === 'right' ? 'end' : 'center'
    const columnAlignSelf = sectionAlignVertical === 'middle' ? 'center' : sectionAlignVertical === 'bottom' ? 'end' : undefined

    // Vertical direction: the columns become full-width rows stacked top to bottom
    const isVertical = block.content.settings?.columnDirection === 'vertical'
    const sectionHeight = block.content.settings?.height
    const hasSectionHeight = !!sectionHeight && sectionHeight !== 'auto' && sectionHeight !== 'fit'
    const toTracks = (min: string) => (appliedTemplate || `repeat(${Math.max(1, colCount)}, 1fr)`).replace(/(\d*\.?\d+)fr/g, `minmax(${min}, $1fr)`)

    // Distribution of the columns along the direction ('fill' shares all the room; the rest keep their size)
    const distribution = block.content.settings?.columnDistribution || (isVertical ? 'packed' : 'fill')
    const isFill = distribution === 'fill'
    // Column widths: «Ajustar ao conteúdo» columns take their content's width (never more than the row),
    // «Preencher» columns share what the others leave; the rest keep their share of the grid
    const hasWidthModes = columns.some((c: any) => c.settings?.widthMode)
    const columnTracks = (() => {
        const base = appliedTemplate || `repeat(${Math.max(1, colCount)}, 1fr)`
        const m = /^repeat\((\d+),\s*([^)]+)\)$/.exec(base.trim())
        const list: string[] = m ? Array(Number(m[1])).fill(m[2].trim()) : base.trim().split(/\s+/)
        return columns.map((c: any, i: number) => c.settings?.widthMode === 'fit' ? 'fit-content(100%)'
            : c.settings?.widthMode === 'fill' ? 'minmax(0, 1fr)'
            : (list[i] || '1fr').replace(/^(\d*\.?\d+)fr$/, 'minmax(0, $1fr)')).join(' ')
    })()
    const packedAlign = isVertical
        ? (sectionAlignVertical === 'middle' ? 'center' : sectionAlignVertical === 'bottom' ? 'end' : 'start')
        : (sectionAlignHorizontal === 'left' ? 'start' : sectionAlignHorizontal === 'right' ? 'end' : 'center')
    const contentAlign = isFill ? undefined
        : distribution === 'between' ? 'space-between'
        : distribution === 'around' ? 'space-around'
        : distribution === 'evenly' ? 'space-evenly'
        : packedAlign
    const needsSectionHeight = hasSectionHeight && !hasAspectRatio && (isVertical || alignColumnsVertically)

    return (
        <div className="w-full h-full flex flex-col relative overflow-visible">
            <div
                className={cn(
                    "grid w-full flex-1 min-h-0 relative overflow-visible transition-all duration-300",
                    isVertical ? "grid-cols-1" : getGridClass(colCount)
                )}
                id={`layout-block-${block.id}`}
                style={{
                    padding: '0px',
                    gap: `${gapValue}px`,
                    // minmax(0, fr) keeps every column at its share of the section's width
                    gridTemplateColumns: isVertical ? 'minmax(0, 1fr)' : (isFill ? (hasWidthModes ? columnTracks : toTracks('0')) : `repeat(${colCount}, auto)`),
                    gridTemplateRows: isVertical && isFill && hasSectionHeight ? toTracks('min-content') : undefined,
                    justifyContent: !isVertical ? contentAlign : undefined,
                    alignContent: isVertical ? contentAlign : undefined,
                    aspectRatio: hasAspectRatio ? aspectRatio.replace(':', '/') : undefined,
                    minHeight: needsSectionHeight ? getHeight(sectionHeight) : undefined,
                    maxHeight: '100%',
                }}
            >
                {columns.map((col: any, index: number) => {
                    // In flex-col: alignItems = horizontal, justifyContent = vertical
                    const getAlignItems = () => col.settings?.alignHorizontal === 'center' ? 'center' : col.settings?.alignHorizontal === 'right' ? 'flex-end' : 'flex-start'
                    const getJustifyContent = () => col.settings?.alignVertical === 'top' ? 'flex-start' : col.settings?.alignVertical === 'bottom' ? 'flex-end' : 'center'
                    const colHover = isReadOnly ? getHoverProps(col.settings?.hoverEffect) : { className: '', style: {} }
                    // Sizes set on the column itself win over what it would inherit from the section
                    const colWidth = toCssSize(col.settings?.columnWidth)
                    const colHeight = toCssSize(col.settings?.columnHeight)
                    const colMinHeight = toCssSize(col.settings?.minHeight)
                    const heightMode: 'fit' | 'fill' | undefined = colHeight ? undefined
                        : (col.settings?.heightMode || (col.settings?.isFullHeight ? 'fill' : undefined))
                    // Subcolumns: the column's items sit side by side, one per slot
                    const subColumns = Math.min(4, Math.max(1, Number(col.settings?.subColumns) || 1))
                    const hasSubColumns = subColumns > 1
                    const itemGap: number = col.settings?.blockGap ?? 16
                    const contentDistribution = col.settings?.contentDistribution
                    const itemsJustify = contentDistribution === 'between' ? 'space-between'
                        : contentDistribution === 'around' ? 'space-around'
                        : contentDistribution === 'evenly' ? 'space-evenly'
                        : undefined
                    const emptySlots = hasSubColumns ? Math.max(0, subColumns - (col.blocks?.length || 0)) : 0

                    return (
                        <div
                            key={col.id}
                            className={cn(
                                "relative group/col flex flex-col overflow-visible w-full transition-all duration-300",
                                colHover.className,
                                // Editing guides are outlines drawn inside the column: a border would make it 2px taller than on the client page
                                col.blocks && col.blocks.length > 0 ? "min-h-0" : `min-h-[32px] ${!isReadOnly ? "outline outline-1 outline-dashed -outline-offset-1 outline-gray-200 hover:outline-[#FF0054]" : ""}`,
                                !isReadOnly && col.blocks?.length > 0 && !hasBorder(resolveBorder(col.settings)) && "outline outline-1 outline-dashed -outline-offset-1 outline-transparent hover:outline-[#FF0054]",
                                !isReadOnly && !hasBorder(resolveBorder(col.settings)) && openSettingsColId === col.id && "!border-[#FF0054]"
                            )}
                            style={{
                                gap: `${itemGap}px`,
                                minWidth: 0,
                                ...colHover.style,
                                minHeight: colHeight
                                    ? (colMinHeight ? `max(${colHeight}, ${colMinHeight})` : colHeight)
                                    : heightMode === 'fit' ? colMinHeight
                                    : col.blocks?.some((b: any) => b.type === 'gallery' || b.type === 'carousel')
                                    ? 'auto'
                                    : (colMinHeight
                                        ? colMinHeight
                                        : (alignColumnsVertically || isVertical ? undefined : (hasAspectRatio ? '100%' : getHeight(block.content.settings?.height)))),
                                paddingTop: col.settings?.padding?.top ?? (isFullHeight ? 0 : (block.content.settings?.padding?.top ?? 24)),
                                paddingBottom: col.settings?.padding?.bottom ?? (isFullHeight ? 0 : (block.content.settings?.padding?.bottom ?? 24)),
                                paddingLeft: col.settings?.padding?.left ?? (isFullWidth ? 0 : (block.content.settings?.padding?.left ?? 24)),
                                paddingRight: col.settings?.padding?.right ?? (isFullWidth ? 0 : (block.content.settings?.padding?.right ?? 24)),
                                backgroundColor: col.settings?.backgroundColor || 'transparent',
                                backgroundImage: col.settings?.backgroundImage ? `url(${col.settings.backgroundImage})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: `${col.settings?.radius || 0}px`,
                                // Border per side (or the single width saved before)
                                ...borderCss(resolveBorder(col.settings)),
                                position: col.settings?.isFixed ? 'sticky' : undefined,
                                top: col.settings?.isFixed ? 0 : undefined,
                                zIndex: col.settings?.isFixed ? 10 : undefined,
                                width: col.settings?.isFullWidth || col.settings?.widthMode === 'fill' ? '100%' : col.settings?.widthMode === 'fit' ? 'fit-content' : (colWidth || (!isVertical && !isFill ? 'fit-content' : undefined)),
                                maxWidth: '100%',
                                height: heightMode === 'fill' ? '100%' : (heightMode === 'fit' || colHeight || alignColumnsVertically ? 'auto' : '100%'),
                                justifySelf: columnJustifySelf,
                                alignSelf: heightMode === 'fill' ? 'stretch' : (columnAlignSelf || (colHeight || heightMode === 'fit' ? 'start' : undefined)),
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

                            {/* Column toolbar: settings (the brandbook's column panel) and moving the column */}
                            {!isReadOnly && (
                                <div className="absolute top-0 left-0 z-50 opacity-0 group-hover/col:opacity-100 transition-opacity flex items-center gap-2 -translate-y-full">
                                    <ColumnSettingsPanel
                                        isOpen={openSettingsColId === col.id}
                                        onOpenChange={(open) => setOpenSettingsColId(open ? col.id : null)}
                                        minHeight={col.settings?.minHeight ? String(col.settings.minHeight).replace('px', '') : 'auto'}
                                        onMinHeightChange={(val) => handleColumnSettingsChange(col.id, { minHeight: val })}
                                        backgroundColor={col.settings?.backgroundColor || '#ffffff'}
                                        onBackgroundColorChange={(color) => handleColumnSettingsChange(col.id, { backgroundColor: color })}
                                        onUploadBackground={() => document.getElementById(`upload-bg-${col.id}`)?.click()}
                                        radius={col.settings?.radius || 0}
                                        onRadiusChange={(val) => handleColumnSettingsChange(col.id, { radius: val })}
                                        border={resolveBorder(col.settings)}
                                        onBorderChange={(b) => handleColumnSettingsChange(col.id, { border: b, borderWidth: b.isLocked ? b.top : 0, borderColor: b.color, borderStyle: b.style })}
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
                                        alignVertical={col.settings?.alignVertical || 'middle'}
                                        onAlignVerticalChange={(align) => handleColumnSettingsChange(col.id, { alignVertical: align })}
                                        blockGap={itemGap}
                                        onBlockGapChange={(gap) => handleColumnSettingsChange(col.id, { blockGap: gap })}
                                        subColumns={subColumns}
                                        onSubColumnsChange={(count) => handleColumnSettingsChange(col.id, { subColumns: count })}
                                        contentDistribution={col.settings?.contentDistribution || 'packed'}
                                        onContentDistributionChange={(value) => handleColumnSettingsChange(col.id, { contentDistribution: value })}
                                        hoverEffect={col.settings?.hoverEffect}
                                        onHoverEffectChange={(effect) => handleColumnSettingsChange(col.id, { hoverEffect: effect })}
                                        columnWidth={col.settings?.columnWidth || 'auto'}
                                        onColumnWidthChange={(val) => handleColumnSettingsChange(col.id, { columnWidth: val })}
                                        columnHeight={col.settings?.columnHeight || 'auto'}
                                        onColumnHeightChange={(val) => handleColumnSettingsChange(col.id, { columnHeight: val, heightMode: undefined, isFullHeight: false })}
                                        isFullWidth={col.settings?.isFullWidth || false}
                                        onFullWidthChange={(val) => handleColumnSettingsChange(col.id, { isFullWidth: val })}
                                        isFullHeight={col.settings?.isFullHeight || false}
                                        onFullHeightChange={(val) => handleColumnSettingsChange(col.id, { isFullHeight: val })}
                                        heightMode={heightMode}
                                        widthMode={col.settings?.widthMode}
                                        onWidthModeChange={(mode) => handleColumnSettingsChange(col.id, { widthMode: mode, ...(mode ? { columnWidth: 'auto', isFullWidth: false } : {}) })}
                                        onHeightModeChange={(mode) => handleColumnSettingsChange(col.id, { heightMode: mode, isFullHeight: false, columnHeight: 'auto' })}
                                        onReset={() => handleColumnSettingsChange(col.id, {
                                            minHeight: 'auto',
                                            padding: { isLocked: true, top: 24, right: 24, bottom: 24, left: 24 },
                                            backgroundColor: null,
                                            backgroundImage: null,
                                            radius: 0,
                                            borderWidth: 0,
                                            border: null,
                                            borderColor: null,
                                            borderStyle: 'dashed',
                                            isFixed: false,
                                            alignHorizontal: 'left',
                                            alignVertical: 'top',
                                            blockGap: 16,
                                            subColumns: 1,
                                            contentDistribution: 'packed',
                                            hoverEffect: undefined,
                                            columnWidth: 'auto',
                                            columnHeight: 'auto',
                                            heightMode: undefined,
                                            isFullWidth: false,
                                            isFullHeight: false
                                        })}
                                        onDuplicateColumn={() => handleDuplicateColumn(col.id)}
                                        onDeleteColumn={() => handleDeleteColumn(col.id)}
                                        isLocked={col.settings?.isLocked || false}
                                        onToggleLock={() => handleColumnSettingsChange(col.id, { isLocked: !col.settings?.isLocked })}
                                    >
                                        <button
                                            className="bg-[#FF0054] text-white text-[10px] px-2 h-[24px] rounded-t-[4px] font-medium tracking-wide flex items-center gap-1 hover:bg-[#D90048] transition-colors cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                        >
                                            Editar coluna
                                        </button>
                                    </ColumnSettingsPanel>

                                    {!hasSubColumns && col.blocks?.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onAddBlock(block.id, col.id, 'request_dialog') }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            title="Adicionar item a esta coluna"
                                            className="bg-[#FF0054] text-white text-[10px] px-2 h-[24px] rounded-t-[4px] font-medium tracking-wide flex items-center gap-1 hover:bg-[#D90048] transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Item
                                        </button>
                                    )}

                                    {colCount > 1 && (
                                        <div className="flex bg-[#FF0054] rounded-t-[4px] h-[24px] overflow-hidden">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleColumnMove(index, 'left') }}
                                                disabled={index === 0}
                                                aria-label="Mover coluna para a esquerda"
                                                className="px-2 hover:bg-[#D90048] disabled:opacity-50 transition-colors flex items-center justify-center text-white border-r border-white/20"
                                            >
                                                <ArrowLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleColumnMove(index, 'right') }}
                                                disabled={index === colCount - 1}
                                                aria-label="Mover coluna para a direita"
                                                className="px-2 hover:bg-[#D90048] disabled:opacity-50 transition-colors flex items-center justify-center text-white"
                                            >
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Column content: the items, stacked or in subcolumns */}
                            <div
                                className={cn(
                                    "flex-1 w-full h-full min-h-0 overflow-visible relative",
                                    hasSubColumns ? "grid" : "flex flex-col",
                                    // A negative spacing overlaps the items (CSS gap can't be negative)
                                    !hasSubColumns && itemGap < 0 && "[&>*+*]:mt-[var(--col-item-overlap)]",
                                    // The page typography (prose) gives pictures a top / bottom margin: an item aligned to the
                                    // top or bottom of its column must touch the edge (only the column padding stays)
                                    "[&_img]:m-0 [&_figure]:m-0 [&_video]:m-0"
                                )}
                                style={hasSubColumns ? {
                                    gridTemplateColumns: `repeat(${subColumns}, minmax(0, 1fr))`,
                                    gap: `${Math.max(0, itemGap)}px`,
                                    alignContent: itemsJustify || getJustifyContent(),
                                } : {
                                    gap: `${Math.max(0, itemGap)}px`,
                                    ...(itemGap < 0 ? { '--col-item-overlap': `${itemGap}px` } as React.CSSProperties : {}),
                                    justifyContent: itemsJustify || getJustifyContent(),
                                    alignItems: getAlignItems(),
                                }}
                            >
                                {col.blocks.map((b: Block) => (
                                    <div key={b.id} className="w-full min-w-0 max-w-full flex flex-col shrink-0 overflow-visible transition-all duration-300" style={{ alignItems: getAlignItems() }}>
                                        <BlockRenderer
                                            block={b}
                                            isReadOnly={isReadOnly}
                                            onUpdate={(id, content) => handleColumnUpdate(col.id, id, content)}
                                            onAddBlock={onAddBlock}
                                            onSelect={onSelect}
                                            activeBlockId={activeBlockId}
                                            onMove={handleBlockMove}
                                            onDuplicate={handleBlockDuplicate}
                                            onCopy={(id) => {
                                                const found = col.blocks.find((blk: Block) => blk.id === id)
                                                if (found) { copyBlock(found); clipToast.success("Bloco copiado. Cole-o em «Adicionar item».") }
                                            }}
                                            onDelete={(id) => {
                                                // Deleting a block inside a column
                                                const newColumns = columns.map((c: any) => c.id === col.id ? { ...c, blocks: c.blocks.filter((blk: Block) => blk.id !== id) } : c)
                                                onUpdate(block.id, { ...block.content, columns: newColumns })
                                            }}
                                        />
                                    </div>
                                ))}

                                {/* Empty subcolumns: each one takes one item */}
                                {!isReadOnly && Array.from({ length: emptySlots }).map((_, i) => (
                                    <div key={`slot-${i}`} className="min-h-[120px] w-full border border-dashed border-gray-300 rounded-md flex items-center justify-center p-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAddBlock(block.id, col.id, 'request_dialog') }}
                                            className="h-8 px-3 rounded-md flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-pink-500 hover:bg-pink-50/50 transition-colors"
                                            title="Adicionar um item a esta subcoluna"
                                        >
                                            <Plus className="w-4 h-4" /> Item
                                        </button>
                                    </div>
                                ))}

                                {/* Add Button for this column (with subcolumns, the empty slots add instead) */}
                                {/* Empty column: the button in the middle. With content it lives in the column bar above (never over
                                    the content, and the editor page stays as tall as the client's) */}
                                {!isReadOnly && !hasSubColumns && !col.blocks?.length && (
                                    <Button
                                        variant="ghost"
                                        className="h-8 border border-dashed text-gray-400 hover:text-pink-500 hover:border-pink-500 hover:bg-pink-50 shrink-0 w-[65%] mx-auto mt-2 mb-2"
                                        onClick={() => onAddBlock(block.id, col.id, 'request_dialog')}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Adicionar item
                                    </Button>
                                )}
                            </div>

                            {/* Splitter (Only if unlocked and not last column) */}
                            {isGridUnlocked && !isReadOnly && !isVertical && index < colCount - 1 && (
                                <ColumnSplitter
                                    index={index}
                                    onResizeStart={handleResizeStart}
                                    onResize={handleResize}
                                    onResizeEnd={handleResizeEnd}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
