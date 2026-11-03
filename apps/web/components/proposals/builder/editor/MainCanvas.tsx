"use client"

import React, { useState, useEffect, useRef } from "react"
import { TextModule } from "../modules/TextModule"
import { PaletteModule } from "../modules/PaletteModule"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AddSectionDialog } from "./AddSectionDialog"
import { AddItemDialog } from "./AddItemDialog"
import { pageBackground, pageTextColor } from "../../pageBackground"
import { PAGE_FORMATS, resolvePage, type PageSetting } from "../../pageFormats"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { SectionSettingsPanel, type SectionSettings } from "@/components/brandbook/editor/SectionSettingsPanel"
import { sectionStyles } from "../../sectionStyle"
import { uploadProjectMedia } from "@/app/actions/projects"
import { Block } from "./types"
import { BlockRenderer } from "./blocks/BlockRenderer"
import { ColorInput } from "@/components/ui/color-input"
import { BackgroundFillEditor, FillLayer, gradientStyle, hasFill, defaultGradient, type BackgroundFill } from "@/components/brandbook/editor/backgroundFill"
import { clearClipboard, copyBlock, findBlock, pasteBlock, useHasClipboard } from "./blockClipboard"
import { toast as clipToast } from "sonner"
// «Guardar como componente»: the brandbook's dialog, saving into the proposal's brand library
import { SaveComponentModal } from "@/components/brandbook/editor/SaveComponentModal"
import { ArrowUp, ArrowDown, Ruler, AlertTriangle, Plus, ChevronDown, Sparkles, Clapperboard, Eye, EyeOff, Copy, Trash2, Check, ZoomIn, ZoomOut } from "lucide-react"
import { useBrandDesign } from "./BrandDesignContext"

// Helper Component for Section Divider
/** «+ Adicionar secção» on the top or bottom edge of a section, crossed in half by the edge (no room between sections) */
const EdgeAddButton = ({ edge, onClick }: { edge: "top" | "bottom", onClick: () => void }) => (
    <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className={cn(
            "absolute left-1/2 -translate-x-1/2 z-20 bg-[#FF0054] text-white px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity duration-200 shadow-sm",
            edge === "top" ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2"
        )}
    >
        + Adicionar secção
    </button>
)

// Section of a page: its look comes from the section settings (the brandbook panel), like on the client page
const SectionWrapper = ({ children, onMoveUp, onMoveDown, onEdit, isFirst, isLast, settingsPanel, settings, isReadOnly, pageHeight, onAddAbove, onAddBelow }: any) => {
    const ref = React.useRef<HTMLDivElement>(null)
    const [box, setBox] = useState<{ width: number, height: number }>()
    const look = sectionStyles(settings, { isReadOnly, defaultPadding: 40, box, pageHeight })
    // Radial gradients are drawn in pixels of the section (a circle stays a circle)
    useEffect(() => {
        const el = ref.current
        if (!el || !look.measuresGradient) return
        const ro = new ResizeObserver(() => setBox({ width: el.clientWidth, height: el.clientHeight }))
        ro.observe(el)
        return () => ro.disconnect()
    }, [look.measuresGradient])

    return (
        <div
            ref={ref}
            data-proposal-section
            className={cn(
                // The editing guide is an outline drawn inside the section: a border would add 1px above and below
                // every section (a white line between sections without margin, editor taller than the client page)
                "relative transition-colors w-full",
                look.fills && "flex-1 flex flex-col",
                !isReadOnly && "group outline outline-1 outline-dashed -outline-offset-1 outline-gray-200 hover:outline-[#FF0054]"
            )}
            style={look.outer}
        >
            {/* Toolbar - Only show if NOT read only */}
            {!isReadOnly && (
                <div className={cn(
                    "absolute -top-[28px] left-0 right-0 flex justify-between items-end transition-opacity z-10 px-[1px]",
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
            <div className={cn("flex flex-col w-full min-h-0", look.innerGrows && "flex-1")} style={look.inner}>
                {children}
            </div>
            {!isReadOnly && onAddAbove && <EdgeAddButton edge="top" onClick={onAddAbove} />}
            {!isReadOnly && onAddBelow && <EdgeAddButton edge="bottom" onClick={onAddBelow} />}
        </div>
    )
}

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9)

/** One page of the proposal: its sheet, its options when selected, and the buttons to add a page after it */
function PageEditor({ activeModule, index, isSelected, onSelectPage, onUpdateModule, activeBlockId: selectedBlockId, onSelectBlock, isReadOnly = false, actions, zoom = 1, brandId }: {
    zoom?: number
    brandId?: string | null
    activeModule: any
    index: number
    isSelected: boolean
    onSelectPage: (id: string) => void
    onUpdateModule?: (id: string, content: any) => void
    activeBlockId: string | null
    onSelectBlock: (id: string | null) => void
    isReadOnly?: boolean
    actions: PageActions
}) {
    // The open section / selected block belongs to the selected page only: two pages can hold blocks with the
    // same id (a page duplicated before ids were renewed), and both would open their panel
    const activeBlockId = isSelected ? selectedBlockId : null
    const sheetRef = useRef<HTMLDivElement>(null)
    const [contentHeight, setContentHeight] = useState(0)
    useEffect(() => {
        const el = sheetRef.current
        if (!el) return
        // Height of the page's content (it may be taller than a page with a format, which then cuts it)
        // Where the last section ends (not scrollHeight: the «Adicionar secção» buttons stick out of the sections
        // by half their height, and that is not content)
        const measure = () => {
            let bottom = 0
            el.querySelectorAll<HTMLElement>("[data-proposal-section]").forEach(sec => {
                if (sec.parentElement?.closest("[data-proposal-section]")) return
                const mb = parseFloat(getComputedStyle(sec).marginBottom) || 0
                bottom = Math.max(bottom, sec.offsetTop + sec.offsetHeight + mb)
            })
            setContentHeight(bottom)
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [activeModule])
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
    const [isAddItemOpen, setIsAddItemOpen] = useState(false)
    const [blocks, setBlocks] = useState<Block[]>([])
    // Context for adding blocks (if null, adds to root)
    const [addingContext, setAddingContext] = useState<{ parentId?: string, columnId?: string, insertIndex?: number } | null>(null)
    const [panelInitialPos, setPanelInitialPos] = useState<{ top: number, left: number } | null>(null)
    const { settings } = useBrandDesign()

    // Initialize blocks from activeModule content
    useEffect(() => {
        if (activeModule?.content_json?.blocks) {
            setBlocks(activeModule.content_json.blocks)
        } else {
            // New or legacy module without blocks
            setBlocks([])
        }
    }, [activeModule])

    const hasClipboard = useHasClipboard()
    // «Colar» in the add dialog: the copied block (new ids) where the new item would go
    const handlePasteBlock = () => {
        const pasted = pasteBlock()
        if (!pasted || !addingContext) return
        if (!addingContext.parentId) {
            const at = addingContext.insertIndex ?? blocks.length
            const next = [...blocks]
            next.splice(at, 0, pasted)
            setBlocks(next)
            setAddingContext(null)
            setIsAddSectionOpen(false)
            if (onUpdateModule && activeModule) onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: next })
            return
        }
        const insertInto = (list: Block[]): Block[] => list.map(b => {
            if (b.type !== 'layout') return b
            const columns = (b.content.columns || []).map((col: any) =>
                b.id === addingContext.parentId && col.id === addingContext.columnId
                    ? { ...col, blocks: [...(col.blocks || []), pasted] }
                    : { ...col, blocks: insertInto(col.blocks || []) })
            return { ...b, content: { ...b.content, columns } }
        })
        const newBlocks = insertInto(blocks)
        setBlocks(newBlocks)
        setAddingContext(null)
        setIsAddItemOpen(false)
        if (onUpdateModule && activeModule) onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
    }

    const handleRequestAdd = (parentId: string, columnId: string) => {
        if (isReadOnly) return
        setAddingContext({ parentId, columnId })
        setIsAddItemOpen(true)
    }

    const handleAddBlock = (type: string, variant?: string) => {
        let content: any = { text: "" }

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
                    ratio: 0
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
        } else if (type === 'pricing-table') {
            content = {
                items: [
                    { description: "Item de Exemplo", quantity: 1, price: 0 }
                ]
            }
        } else if (type === 'scope-list') {
            content = {
                items: [
                    { text: "Entregável 01", checked: true }
                ]
            }
        } else if (type === 'timeline') {
            content = {
                items: [
                    { title: "Início", date: "Semana 1", description: "Descrição do marco" }
                ]
            }
        }

        const newBlock: Block = {
            id: generateId(),
            type: type as any,
            variant: variant,
            content: content
        }

        let newBlocks = [...blocks]

        if (addingContext?.parentId) {
            // Into a column, at any depth (columns → subcolumns)
            if (type === 'layout') newBlock.content.settings = { ...newBlock.content.settings, height: undefined }
            const insertInto = (list: Block[]): Block[] => list.map(b => {
                if (b.type !== 'layout') return b
                const columns = (b.content.columns || []).map((col: any) => {
                    if (b.id === addingContext.parentId && col.id === addingContext.columnId) {
                        return { ...col, blocks: [...(col.blocks || []), newBlock] }
                    }
                    return { ...col, blocks: insertInto(col.blocks || []) }
                })
                return { ...b, content: { ...b.content, columns } }
            })
            newBlocks = insertInto(blocks)
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

    const handleUpdateBlock = (blockId: string, content: any) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content } : b)
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
        const index = blocks.findIndex(b => b.id === blockId)
        if (index === -1) return
        const blockToClone = blocks[index]
        const newBlock = {
            ...blockToClone,
            id: generateId(),
            content: JSON.parse(JSON.stringify(blockToClone.content))
        }
        const newBlocks = [...blocks]
        newBlocks.splice(index + 1, 0, newBlock)
        setBlocks(newBlocks)

        if (onUpdateModule && activeModule) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleDeleteBlock = (blockId: string) => {
        const newBlocks = blocks.filter(b => b.id !== blockId)
        setBlocks(newBlocks)
        onSelectBlock(null)

        if (onUpdateModule && activeModule) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    // Cut / copy a section: kept in the proposal clipboard, pasted from «Adicionar secção» (any page)
    const handleCopySection = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId)
        if (!block) return
        copyBlock(block)
    }
    const handleCutBlock = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId)
        if (!block) return
        copyBlock(block)
        handleDeleteBlock(blockId)
        clipToast.success("Secção cortada. Cole-a em «Adicionar secção».")
    }

    const [blockToSave, setBlockToSave] = useState<Block | null>(null)
    const handleSaveAsComponent = (blockId: string) => {
        if (!brandId) {
            clipToast.error("Esta proposta não tem uma marca associada: os componentes guardam-se na biblioteca da marca.")
            return
        }
        const block = blocks.find(b => b.id === blockId)
        if (!block) return
        setBlockToSave(block)
        onSelectBlock(null)
    }

    const handleUpdateSectionSettings = (blockId: string, newSettings: SectionSettings) => {
        const blockIndex = blocks.findIndex(b => b.id === blockId)
        if (blockIndex === -1) return

        const currentBlock = blocks[blockIndex]
        const currentCols = currentBlock.content.columns || []
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

    if (!activeModule) return null

    const page = resolvePage(activeModule.content_json?.page)
    const sheetHeight = page.height ?? 600
    const pageBg = pageBackground(activeModule.content_json?.style) || { backgroundColor: settings?.main_project_bg || '#ffffff' }
    const overflows = page.height != null && contentHeight > page.height + 1
    const textColor = pageTextColor(activeModule.content_json?.style)

    return (
        <div
            data-page-id={activeModule.id}
            className="flex flex-col items-center"
            // Preview: sheets a short gap apart (like Word); continuous web pages joined, with only a line between them
            style={{ scrollMarginTop: 96 / zoom, marginTop: isReadOnly && page.height != null ? 6 / zoom : 0, marginBottom: isReadOnly && page.height != null ? 6 / zoom : 0 }}
        >
            {/* Above the sheet: the page's name on the left, its options on the right when selected */}
            {!isReadOnly && (
                <div className="w-full flex items-end justify-between gap-4 min-h-[22px]" style={{ width: page.width, marginBottom: 8 / zoom }}>
                    <span className={cn("text-[13px] font-medium truncate select-none", isSelected ? "text-gray-800" : "text-gray-400")}>
                        Página {index + 1}
                        <span className="text-gray-400 font-normal"> · {page.label}</span>
                        {activeModule.is_hidden && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-medium">Oculta</span>}
                        {overflows && <span className="ml-2 inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium align-middle" title="O que passar da altura da página fica cortado ou passa para outra folha ao imprimir."><AlertTriangle className="w-3 h-3" /> Conteúdo a mais</span>}
                    </span>
                </div>
            )}

            <div className="relative isolate group/sheet">
            {/* Options of the selected page: outside the sheet, along its top-right corner, one under the other */}
            {!isReadOnly && isSelected && (
                <div data-page-toolbar className="absolute top-0 left-full z-[40]" style={{ zoom: 1 / zoom, marginLeft: 16 }}>
                    <PageToolbar
                        module={activeModule}
                        palette={settings?.color_palette || []}
                        onUpdatePage={(fn) => actions.onUpdatePage(activeModule.id, fn)}
                        onChangeFormat={() => actions.onChangeFormat(activeModule.id)}
                        onToggleHidden={() => actions.onToggleHidden(activeModule.id)}
                        onDuplicate={() => actions.onDuplicatePage(activeModule.id)}
                        onDelete={() => actions.onDeletePage(activeModule.id)}
                    />
                </div>
            )}

            {/* The sheet: dashed brand outline on hover, kept while the page is selected */}
            <div
                ref={sheetRef}
                data-page-sheet
                onMouseDown={() => { if (!isReadOnly && !isSelected) onSelectPage(activeModule.id) }}
                className={cn(
                    // A column: a section set to «fill» takes the height left on the page
                    "relative flex flex-col transition-opacity duration-150",
                    activeModule.is_hidden && "opacity-60"
                )}
                style={{
                    // A format is a fixed size: «fill» or more content never make the page taller, and what doesn't
                    // fit is cut at the bottom edge (as on the client page and in the PDF). Only the bottom is cut, so
                    // the section bars above and the panels at the sides stay visible
                    width: page.width, ...(page.height != null ? { height: page.height, clipPath: "inset(-10000px -10000px 0 -10000px)" } : { minHeight: sheetHeight }), ...pageBg,
                    ...(isReadOnly && page.height == null && index > 0 ? { borderTop: `${1 / zoom}px solid rgba(0,0,0,0.12)` } : {}),
                }}
            >
                {/* Picture / gradient of the page, on its own layer (its filters never touch the content) */}
                <FillLayer fill={activeModule.content_json?.style?.fill} />
                <div data-page-content className="relative prose max-w-none text-gray-600 flex-1 flex flex-col w-full min-h-0" style={textColor ? { color: textColor } : undefined}>
                    {blocks.length > 0 ? (
                        <div className="flex-1 flex flex-col">

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
                                                    onSaveAsComponent={() => handleSaveAsComponent(block.id)}
                                                    onCopy={() => handleCopySection(block.id)}
                                                    onDuplicate={() => handleDuplicateBlock(block.id)}
                                                    onDelete={() => handleDeleteBlock(block.id)}
                                                    brandId=""
                                                    moduleId={activeModule.id}
                                                    uploadImage={uploadProjectMedia}
                                                    hiddenFeatures={["scrollEffect", "freeFlow"]}
                                                    initialTop={panelInitialPos?.top}
                                                    initialLeft={panelInitialPos?.left}
                                                />
                                            )
                                        }
                                        settings={block.content.settings}
                                        isReadOnly={isReadOnly}
                                        pageHeight={page.height}
                                        onAddAbove={index === 0 ? () => { setAddingContext({ insertIndex: 0 }); setIsAddSectionOpen(true) } : undefined}
                                        onAddBelow={() => { setAddingContext({ insertIndex: index + 1 }); setIsAddSectionOpen(true) }}
                                    >
                                        <BlockRenderer
                                            block={block}
                                            isReadOnly={isReadOnly}
                                            onUpdate={handleUpdateBlock}
                                            onAddBlock={(parentId, colId) => handleRequestAdd(parentId, colId)}
                                            onSelect={onSelectBlock}
                                            activeBlockId={activeBlockId}
                                            // A block that is a section by itself: its bar moves and deletes the section
                                            onMove={(_, dir) => handleMoveBlock(index, dir)}
                                            onDelete={(id) => handleDeleteBlock(id)}
                                            onDuplicate={(id) => handleDuplicateBlock(id)}
                                            onCopy={(id) => { const found = findBlock(blocks, id); if (found) { copyBlock(found); clipToast.success("Bloco copiado.") } }}
                                        />
                                    </SectionWrapper>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        /* Empty page: only the button, in the middle of the page */
                        !isReadOnly && (
                            <div className="absolute inset-0 flex items-center justify-center not-prose">
                                <Button
                                    onClick={() => {
                                        onSelectPage(activeModule.id)
                                        setAddingContext(null)
                                        setIsAddSectionOpen(true)
                                    }}
                                    className="bg-[#FF0054] hover:bg-[#D90046] text-white font-medium px-8 shadow-lg shadow-pink-500/20 rounded-full h-10 tracking-wide"
                                >
                                    + Adicionar secção
                                </Button>
                            </div>
                        )
                    )}
                </div>

                {/* Content cut at the bottom: a dashed amber line on the edge says so */}
                {!isReadOnly && overflows && (
                    <div className="absolute left-0 right-0 bottom-0 z-30 pointer-events-none border-b border-dashed border-amber-400" style={{ borderBottomWidth: 1 / zoom }} />
                )}
            </div>
            {/* Frame of the sheet (shadow, and the dashed brand outline on hover / while selected): apart from the
                sheet so the cut at the bottom doesn't cut them. Same thickness and distance on screen at any zoom */}
            {!isReadOnly && (
                <div
                    aria-hidden
                    className={cn(
                        "absolute inset-0 pointer-events-none outline-dashed shadow-[0_8px_40px_rgba(0,0,0,0.10)] transition-[outline-color] duration-150 -z-[1]",
                        isSelected ? "outline-[#FF0054]" : "outline-transparent group-hover/sheet:outline-[#FF0054]/60"
                    )}
                    style={{ outlineWidth: 1 / zoom, outlineOffset: 6 / zoom }}
                />
            )}
            </div>

            {/* Below the sheet: a page like this one, or a page in another format */}
            {!isReadOnly && (
                <div className="relative z-40 flex items-center gap-2 mt-3 mb-7" style={{ zoom: 1 / zoom }}>
                    <button
                        type="button"
                        onClick={() => actions.onAddPageAfter(activeModule.id, activeModule.content_json?.page || { format: "web" }, activeModule.content_json?.style)}
                        title="Nova página com o mesmo formato, cor e efeitos desta"
                        className="h-9 px-4 rounded-full bg-white border border-gray-200 shadow-sm text-[13px] font-medium text-gray-700 hover:border-[#FF0054] hover:text-[#FF0054] inline-flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Adicionar página
                    </button>
                    <AddPageSplitButton
                        compact
                        onAdd={(p) => actions.onAddPageAfter(activeModule.id, p)}
                    />
                </div>
            )}

            <AddSectionDialog
                isOpen={isAddSectionOpen}
                onOpenChange={(open) => {
                    setIsAddSectionOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
                hasClipboard={hasClipboard}
                onPaste={handlePasteBlock}
                onClearClipboard={clearClipboard}
            />

            <SaveComponentModal
                isOpen={!!blockToSave}
                onClose={() => setBlockToSave(null)}
                block={blockToSave as any}
                brandId={brandId || ""}
            />

            <AddItemDialog
                isOpen={isAddItemOpen}
                onOpenChange={(open) => {
                    setIsAddItemOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
                hasClipboard={hasClipboard}
                onPaste={handlePasteBlock}
                onClearClipboard={clearClipboard}
            />
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Adding pages
// ---------------------------------------------------------------------------------------------

// Every format, paper in both orientations, for the «+ ⌄» menu
const FORMAT_CHOICES: PageSetting[] = PAGE_FORMATS.flatMap(f =>
    f.rotatable ? [{ format: f.id, orientation: "portrait" as const }, { format: f.id, orientation: "landscape" as const }] : [{ format: f.id }]
)

// The format the «+» part repeats: the last one picked in the menu (A4 vertical until then)
let lastPickedFormat: PageSetting = { format: "a4", orientation: "portrait" }

function FormatThumb({ setting, size = 40 }: { setting: PageSetting, size?: number }) {
    const r = resolvePage(setting)
    const ratio = r.height ? r.width / r.height : 1080 / 1500
    const w = ratio >= 1 ? size : size * ratio
    const h = ratio >= 1 ? size / ratio : size
    return <div className={cn("rounded-[2px] border border-gray-400 bg-white", !r.height && "border-dashed border-b-0 rounded-b-none")} style={{ width: w, height: h }} />
}

/** «+ ⌄»: the «+» adds a page in the last format picked; the chevron lists every format */
export function AddPageSplitButton({ onAdd, compact = false, label = "Adicionar página" }: { onAdd: (page: PageSetting) => void, compact?: boolean, label?: string }) {
    const [open, setOpen] = useState(false)
    const [, force] = useState(0)
    const last = resolvePage(lastPickedFormat)
    return (
        <div className={cn("inline-flex items-stretch rounded-full shadow-sm overflow-hidden", compact ? "h-9 bg-white border border-gray-200" : "h-11 bg-[#FF0054] shadow-lg shadow-pink-500/20")}>
            <button
                type="button"
                onClick={() => onAdd(lastPickedFormat)}
                title={`Nova página ${last.label}`}
                aria-label={`Adicionar página ${last.label}`}
                className={cn("inline-flex items-center gap-2 transition-colors", compact ? "px-3 text-gray-700 hover:text-[#FF0054]" : "px-6 text-white font-semibold text-[14px] hover:bg-[#D90046]")}
            >
                <Plus className="w-4 h-4" />{!compact && label}
            </button>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        aria-label="Escolher o formato da página"
                        className={cn("px-2.5 inline-flex items-center border-l transition-colors", compact ? "border-gray-200 text-gray-500 hover:text-[#FF0054]" : "border-white/25 text-white hover:bg-[#D90046]")}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="center" className="w-[420px] p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-[140]">
                    {(["documento", "ecra"] as const).map(group => (
                        <div key={group} className="mb-2 last:mb-0">
                            <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group === "documento" ? "Documento" : "Ecrã"}</p>
                            <div className="grid grid-cols-4 gap-1.5">
                                {FORMAT_CHOICES.filter(c => resolvePage(c).format.group === group).map(c => {
                                    const r = resolvePage(c)
                                    return (
                                        <button
                                            key={`${c.format}-${c.orientation || ""}`}
                                            type="button"
                                            onClick={() => { lastPickedFormat = c; force(n => n + 1); setOpen(false); onAdd(c) }}
                                            className="rounded-lg border border-transparent hover:border-[#FF0054] hover:bg-[#FF0054]/[0.04] p-2 flex flex-col items-center gap-1.5 text-center"
                                        >
                                            <div className="h-[44px] flex items-center justify-center"><FormatThumb setting={c} /></div>
                                            <span className="text-[11px] font-medium text-gray-700 leading-tight">{r.format.label}</span>
                                            {r.format.rotatable && <span className="text-[10px] text-gray-400 -mt-1">{c.orientation === "landscape" ? "Horizontal" : "Vertical"}</span>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </PopoverContent>
            </Popover>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Options of the selected page
// ---------------------------------------------------------------------------------------------

export const PAGE_ANIMATIONS = [
    { id: "none", label: "Nenhuma" },
    { id: "fade", label: "Aparecer" },
    { id: "rise", label: "Subir" },
    { id: "zoom", label: "Aproximar" },
] as const
export const PAGE_TRANSITIONS = [
    { id: "none", label: "Nenhuma" },
    { id: "fade", label: "Desvanecer" },
    { id: "slide-up", label: "Deslizar para cima" },
    { id: "slide-left", label: "Deslizar da direita" },
    { id: "zoom", label: "Ampliar" },
] as const

const COLOR_PRESETS = ["#ffffff", "#f5f5f4", "#fafaf9", "#111111", "#000000", "#0a2540", "#041019", "#1a1a1a", "#ff0054", "#fde68a", "#dbeafe", "#dcfce7"]

function ToolButton({ label, active, danger, onClick, children }: { label: string, active?: boolean, danger?: boolean, onClick?: () => void, children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            className={cn(
                "h-8 min-w-8 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors",
                danger ? "text-red-500 hover:bg-red-50" : active ? "bg-[#FF0054]/10 text-[#FF0054]" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
        >
            {children}
        </button>
    )
}

function OptionList({ options, value, onPick }: { options: readonly { id: string, label: string }[], value: string, onPick: (id: string) => void }) {
    return (
        <div className="flex flex-col">
            {options.map(o => (
                <button key={o.id} type="button" onClick={() => onPick(o.id)} className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-left hover:bg-gray-50", value === o.id ? "text-[#FF0054] font-semibold" : "text-gray-700")}>
                    {o.label}
                    {value === o.id && <Check className="w-3.5 h-3.5" />}
                </button>
            ))}
        </div>
    )
}

function PageToolbar({ module, palette, onUpdatePage, onChangeFormat, onToggleHidden, onDuplicate, onDelete }: {
    module: any
    palette: string[]
    onUpdatePage: (fn: (content: any) => any) => void
    onChangeFormat: () => void
    onToggleHidden: () => void
    onDuplicate: () => void
    onDelete: () => void
}) {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const style = module.content_json?.style || {}
    const pageSetting = module.content_json?.page || {}
    const color: string = typeof style.backgroundColor === "string" ? style.backgroundColor : ""
    const setColor = (c: string | null) => onUpdatePage(content => {
        const nextStyle = { ...(content.style || {}) }
        if (c) { nextStyle.backgroundColor = c; delete nextStyle.backgroundImage } else delete nextStyle.backgroundColor
        return { ...content, style: nextStyle }
    })
    const setPageField = (key: "animation" | "transition", v: string) => onUpdatePage(content => ({ ...content, page: { ...(content.page || { format: "web" }), [key]: v } }))
    const fill: BackgroundFill | undefined = style.fill
    const setFill = (next: BackgroundFill | null) => onUpdatePage(content => {
        const nextStyle = { ...(content.style || {}) }
        if (next && next.type !== "none") nextStyle.fill = next; else delete nextStyle.fill
        return { ...content, style: nextStyle }
    })
    // What the button shows: the picture, the gradient or the colour
    const swatch: React.CSSProperties = hasFill(fill)
        ? fill!.type === "image" ? { backgroundImage: `url("${fill!.image!.url}")`, backgroundSize: "cover", backgroundPosition: "center" } : gradientStyle({ ...defaultGradient(), ...fill!.gradient! })
        : { background: color || "#ffffff" }

    return (
        <div className="flex flex-col items-center gap-0.5 p-1 rounded-xl bg-white border border-gray-200 shadow-md" onMouseDown={e => e.stopPropagation()}>
            <Popover>
                <PopoverTrigger asChild>
                    <span><ToolButton label="Fundo da página"><span className="w-4 h-4 rounded-full border border-gray-300" style={swatch} /></ToolButton></span>
                </PopoverTrigger>
                <PopoverContent
                    side="right" align="start" sideOffset={10} collisionPadding={16}
                    // The colour picker opens on its own layer: using it must not close this panel
                    onInteractOutside={(e) => { if ((e.target as HTMLElement | null)?.closest?.("[data-color-picker]")) e.preventDefault() }}
                    className="w-[320px] p-0 bg-[#1F1F25] border border-white/5 rounded-2xl shadow-2xl z-[140] overflow-hidden flex flex-col max-h-[min(720px,calc(100vh-32px))]">
                    <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between shrink-0">
                        <span className="text-white font-medium text-lg">Fundo da página</span>
                        <PopoverPrimitive.Close className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0">
                            <span className="sr-only">Fechar</span>
                        </PopoverPrimitive.Close>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
                        <BackgroundFillEditor
                            value={fill}
                            onChange={setFill}
                            upload={uploadProjectMedia}
                            color={
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-6 gap-1.5">
                                        {[...new Set([...palette, ...COLOR_PRESETS])].slice(0, 18).map(c => (
                                            <button key={c} type="button" onClick={() => setColor(c)} aria-label={c} title={c} className={cn("w-8 h-8 rounded-md border", color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-[#FF0054] ring-offset-2 ring-offset-[#1F1F25] border-transparent" : "border-white/10")} style={{ background: c }} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ColorInput type="color" value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#ffffff"} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer" aria-label="Escolher outra cor" />
                                        <span className="flex-1 text-[12px] text-[#97A1B3] font-mono">{color || "Cor do tema"}</span>
                                        {color && <button type="button" onClick={() => setColor(null)} className="text-[12px] text-[#97A1B3] hover:text-white">Repor</button>}
                                    </div>
                                    <p className="text-[11px] text-[#666]">A cor fica por baixo da imagem ou do gradiente.</p>
                                </div>
                            }
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                    <span><ToolButton label="Animação do conteúdo" active={!!pageSetting.animation && pageSetting.animation !== "none"}><Sparkles className="w-4 h-4" /></ToolButton></span>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" sideOffset={10} className="w-[220px] p-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[140]">
                    <p className="px-3 pt-1 pb-2 text-[11px] text-gray-400">As secções entram uma a uma quando o cliente chega à página.</p>
                    <OptionList options={PAGE_ANIMATIONS} value={pageSetting.animation || "none"} onPick={v => setPageField("animation", v)} />
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                    <span><ToolButton label="Transição da página" active={!!pageSetting.transition && pageSetting.transition !== "none"}><Clapperboard className="w-4 h-4" /></ToolButton></span>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" sideOffset={10} className="w-[220px] p-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[140]">
                    <p className="px-3 pt-1 pb-2 text-[11px] text-gray-400">Como a página entra no ecrã do cliente.</p>
                    <OptionList options={PAGE_TRANSITIONS} value={pageSetting.transition || "none"} onPick={v => setPageField("transition", v)} />
                </PopoverContent>
            </Popover>
            <ToolButton label="Formato da página" onClick={onChangeFormat}><Ruler className="w-4 h-4" /></ToolButton>
            <span className="h-px w-5 bg-gray-200 my-0.5" />
            <ToolButton label={module.is_hidden ? "Mostrar ao cliente" : "Ocultar do cliente"} active={!!module.is_hidden} onClick={onToggleHidden}>{module.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</ToolButton>
            <ToolButton label="Duplicar página" onClick={onDuplicate}><Copy className="w-4 h-4" /></ToolButton>
            {/* Deleting asks in a small panel beside the bar */}
            <Popover open={confirmDelete} onOpenChange={setConfirmDelete}>
                <PopoverTrigger asChild>
                    <span><ToolButton label="Eliminar página" danger active={confirmDelete}><Trash2 className="w-4 h-4" /></ToolButton></span>
                </PopoverTrigger>
                <PopoverContent side="right" align="center" sideOffset={10} className="w-[220px] p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-[140]">
                    <p className="text-[13px] font-semibold text-gray-900">Eliminar esta página?</p>
                    <p className="text-[12px] text-gray-500 mt-1">As secções da página são apagadas com ela.</p>
                    <div className="flex items-center justify-end gap-1.5 mt-3">
                        <button type="button" onClick={() => setConfirmDelete(false)} className="h-8 px-3 rounded-lg text-[12px] text-gray-600 hover:bg-gray-100">Cancelar</button>
                        <button type="button" onClick={() => { setConfirmDelete(false); onDelete() }} className="h-8 px-3 rounded-lg bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600">Eliminar</button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// The canvas: every page, one under the other, with zoom (Ctrl + wheel) and pan (Space + drag)
// ---------------------------------------------------------------------------------------------

export type PageActions = {
    onUpdatePage: (id: string, fn: (content: any) => any) => void
    onAddPageAfter: (afterId: string | null, page: PageSetting, style?: Record<string, unknown>) => void
    onDuplicatePage: (id: string) => void
    onDeletePage: (id: string) => void
    onToggleHidden: (id: string) => void
    onChangeFormat: (id: string) => void
}

interface MainCanvasProps {
    modules: any[]
    selectedId: string | null
    onSelectPage: (id: string | null) => void
    onUpdateModule?: (id: string, content: any) => void
    activeBlockId: string | null
    onSelectBlock: (id: string | null) => void
    isReadOnly?: boolean
    actions: PageActions
    /** Scrolls to a page (the navigator on the left); n changes on every request */
    scrollTo?: { id: string, n: number } | null
    /** Brand of the proposal: «Guardar como componente» saves sections into its library */
    brandId?: string | null
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
const isTyping = (el: EventTarget | null) => {
    const e = el as HTMLElement | null
    return !!e && (e.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.tagName))
}

export function MainCanvas({ modules, selectedId, onSelectPage, onUpdateModule, activeBlockId, onSelectBlock, isReadOnly = false, actions, scrollTo, brandId }: MainCanvasProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [viewport, setViewport] = useState(1200)
    const [userZoom, setUserZoom] = useState<number | null>(null)
    const [spaceDown, setSpaceDown] = useState(false)
    const [panning, setPanning] = useState(false)
    const panStart = useRef<{ x: number, y: number, left: number, top: number } | null>(null)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setViewport(e.contentRect.width))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // «Ajustar»: the widest page fits the canvas (never above 100%)
    const widest = modules.reduce((w, m) => Math.max(w, resolvePage(m.content_json?.page).width), 0) || 1080
    const fit = Math.max(MIN_ZOOM, Math.min(1, (viewport - 2 * 120) / widest))
    const zoom = userZoom ?? fit
    const zoomRef = useRef(zoom)
    zoomRef.current = zoom

    // Zoom keeping the point under the cursor (or the centre) where it is
    const zoomTo = React.useCallback((next: number, anchor?: { x: number, y: number }) => {
        const el = scrollRef.current
        const z0 = zoomRef.current
        const z1 = clampZoom(next)
        if (!el || z1 === z0) { setUserZoom(z1); return }
        const rect = el.getBoundingClientRect()
        const ax = anchor ? anchor.x - rect.left : rect.width / 2
        const ay = anchor ? anchor.y - rect.top : rect.height / 2
        const cx = (el.scrollLeft + ax) / z0
        const cy = (el.scrollTop + ay) / z0
        setUserZoom(z1)
        requestAnimationFrame(() => {
            el.scrollLeft = cx * z1 - ax
            el.scrollTop = cy * z1 - ay
        })
    }, [])

    // Ctrl + wheel (and the trackpad pinch, which arrives as Ctrl + wheel)
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return
            e.preventDefault()
            const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025))
            zoomTo(zoomRef.current * factor, { x: e.clientX, y: e.clientY })
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [zoomTo, modules.length])

    // Keyboard: Ctrl +/−/0 for zoom; Space held for the hand tool
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomTo(zoomRef.current * 1.2) }
            else if ((e.ctrlKey || e.metaKey) && e.key === "-") { e.preventDefault(); zoomTo(zoomRef.current / 1.2) }
            else if ((e.ctrlKey || e.metaKey) && e.key === "0") { e.preventDefault(); setUserZoom(null) }
            else if (e.code === "Space" && !isTyping(e.target) && !e.repeat) { e.preventDefault(); setSpaceDown(true) }
            else if (e.code === "Space" && !isTyping(e.target)) e.preventDefault()
        }
        const up = (e: KeyboardEvent) => { if (e.code === "Space") { setSpaceDown(false); setPanning(false); panStart.current = null } }
        const blur = () => { setSpaceDown(false); setPanning(false); panStart.current = null }
        window.addEventListener("keydown", down)
        window.addEventListener("keyup", up)
        window.addEventListener("blur", blur)
        return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur) }
    }, [zoomTo])

    useEffect(() => {
        if (!scrollTo) return
        const el = scrollRef.current?.querySelector(`[data-page-id="${scrollTo.id}"]`)
        el?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [scrollTo])

    // A click on the canvas outside every page (and outside the page options) clears the selection
    const onCanvasMouseDown = (e: React.MouseEvent) => {
        if (spaceDown || e.button !== 0) return
        const t = e.target as HTMLElement
        // Panels on the top layer (portals) still send their clicks here through React: they are never «outside»
        if (!(e.currentTarget as HTMLElement).contains(t)) return
        if (t.closest("[data-page-sheet],[data-page-toolbar],button,a,input,textarea,select,[role=dialog]")) return
        onSelectPage(null)
        onSelectBlock(null)
    }

    const onMouseDownCapture = (e: React.MouseEvent) => {
        if (!spaceDown || e.button !== 0) return
        // The hand tool: the drag moves the canvas and never reaches the page under it
        e.preventDefault()
        e.stopPropagation()
        const el = scrollRef.current!
        panStart.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
        setPanning(true)
    }
    useEffect(() => {
        if (!panning) return
        const move = (e: MouseEvent) => {
            const s = panStart.current, el = scrollRef.current
            if (!s || !el) return
            el.scrollLeft = s.left - (e.clientX - s.x)
            el.scrollTop = s.top - (e.clientY - s.y)
        }
        const up = () => { setPanning(false); panStart.current = null }
        window.addEventListener("mousemove", move)
        window.addEventListener("mouseup", up)
        return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
    }, [panning])

    return (
        <div className="flex-1 h-full relative overflow-hidden bg-[#ececef]">
            <div
                ref={scrollRef}
                onMouseDownCapture={onMouseDownCapture}
                onMouseDown={onCanvasMouseDown}
                // No scrollbars at any zoom: the canvas moves with the wheel, the trackpad and Space + drag
                className="absolute inset-0 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ cursor: panning ? "grabbing" : spaceDown ? "grab" : undefined, userSelect: spaceDown ? "none" : undefined }}
            >
                {modules.length === 0 ? (
                    /* Empty document: only the button, in the middle of the canvas */
                    <div className="min-h-full flex items-center justify-center">
                        {!isReadOnly && <AddPageSplitButton onAdd={(p) => actions.onAddPageAfter(null, p)} />}
                    </div>
                ) : (
                    <div className="min-w-full w-max flex justify-center">
                        <div style={{ zoom }} className="flex flex-col items-center px-[120px] pt-[110px] pb-[160px]">
                            {modules.map((m, i) => (
                                <PageEditor
                                    key={m.id}
                                    activeModule={m}
                                    index={i}
                                    isSelected={m.id === selectedId}
                                    onSelectPage={onSelectPage}
                                    onUpdateModule={onUpdateModule}
                                    activeBlockId={activeBlockId}
                                    onSelectBlock={onSelectBlock}
                                    isReadOnly={isReadOnly}
                                    actions={actions}
                                    zoom={zoom}
                                    brandId={brandId}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Zoom */}
            {modules.length > 0 && (
                <div className="absolute right-5 bottom-5 z-[60] flex items-center gap-0.5 p-1 rounded-xl bg-white border border-gray-200 shadow-md" title="Ctrl + roda do rato para aproximar · Espaço + arrastar para mover">
                    <ToolButton label="Afastar (Ctrl −)" onClick={() => zoomTo(zoom / 1.2)}><ZoomOut className="w-4 h-4" /></ToolButton>
                    <button type="button" onClick={() => setUserZoom(null)} title="Ajustar ao ecrã (Ctrl 0)" className={cn("h-8 w-14 rounded-lg text-[12px] font-semibold tabular-nums hover:bg-gray-100", userZoom == null ? "text-[#FF0054]" : "text-gray-700")}>
                        {Math.round(zoom * 100)}%
                    </button>
                    <ToolButton label="Aproximar (Ctrl +)" onClick={() => zoomTo(zoom * 1.2)}><ZoomIn className="w-4 h-4" /></ToolButton>
                </div>
            )}
        </div>
    )
}
