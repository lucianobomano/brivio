"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AddSectionDialog } from "./AddSectionDialog"
import { AddItemDialog } from "./AddItemDialog"
import { SectionSettingsPanel, SectionSettings, isFullScreenSection, fullScreenHeight, sectionGradientCss } from "./SectionSettingsPanel"
import { createMarqueeContent } from "./blocks/marquee"
import { createFooterContent } from "./blocks/footer"
import { createLogoShowcaseContent } from "./blocks/logoShowcase"
import { createLogoSizeContent } from "./blocks/logoSize"
import { createLogoMisuseContent } from "./blocks/logoMisuse"
import { createTypeSpecimenContent } from "./blocks/typeSpecimen"
import { createColorAccordionContent } from "./blocks/colorAccordion"
import { createIconSpecimenContent } from "./blocks/iconSpecimen"
import { createPhotoGradeContent } from "./blocks/photoGrade"
import { createSocialMockupContent } from "./blocks/socialMockup"
import { Block, BrivioClipboardItem, ClipboardItemType } from "./types"
import { BlockRenderer } from "./blocks/BlockRenderer"
import { ArrowUp, ArrowDown, Clipboard, Check, X, Zap } from "lucide-react"
import { AnimatedBlock } from "./AnimatedBlock"
import { getHoverProps, HoverEffect } from "./hoverEffects"
import { useBrandDesign } from "./BrandDesignContext"
import { SectionContext } from "./SectionContext"
import { EditorHistoryProvider, useEditorHistoryOptional } from "./EditorHistoryContext"
import { EditorToast } from "./EditorToast"
import { SaveComponentModal } from "./SaveComponentModal"
import { toast } from "sonner"
import { FloatingPanel } from "./FloatingPanel"
import { useHoverIntent } from "./blocks/BlockContextBar"
import { CoverBackdrop } from "./CoverBackdrop"
import { CoverBar, CoverPanel } from "./CoverPanel"
import { isCoverSection, type CoverSettings } from "./cover"

// Helper Component for Section Divider
const SectionDivider = ({ onClick, onPaste, onClear, hasClipboard }: { onClick: () => void, onPaste?: () => void, onClear?: () => void, hasClipboard?: boolean }) => (
    <div className={cn(
        "relative transition-all duration-200 flex items-center justify-center group my-2",
        hasClipboard ? "h-11 py-1" : "h-4"
    )}>
        <div className={cn(
            "absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed transition-colors",
            hasClipboard ? "border-[#FF0054]/60" : "border-gray-200"
        )} />
        <div className="relative z-10 flex gap-2 items-center">
            {hasClipboard && onPaste ? (
                <div className="flex items-center gap-1.5 bg-[#15161B] p-1 rounded-full shadow-xl border border-[#FF0054]/50 animate-in fade-in zoom-in-95">
                    <button
                        onClick={onPaste}
                        className="bg-[#FF0054] hover:bg-[#D90046] text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm animate-pulse cursor-pointer"
                        title="Colar bloco copiado como nova seção aqui"
                    >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Colar como nova seção</span>
                    </button>
                    <button
                        onClick={onClick}
                        className="text-gray-400 hover:text-white px-3 py-1.5 text-xs font-medium transition-colors rounded-full hover:bg-white/10 cursor-pointer"
                    >
                        + Add Section
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear?.(); }}
                        className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                        title="Cancelar cópia"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={onClick}
                    className="bg-[#FF0054] text-white px-4 py-1.5 rounded-full text-xs font-medium opacity-50 hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 cursor-pointer"
                >
                    <span>+ Add Section</span>
                </button>
            )}
        </div>
    </div>
)

// Helper Component for Section Wrapper
interface SectionWrapperProps {
    id?: string
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
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
    hoverEffect?: HoverEffect
    /** Covers: their own context bar and settings change the section settings directly */
    onUpdateSettings?: (patch: Partial<SectionSettings> & { cover?: CoverSettings }) => void
    onCopy?: () => void
    onDuplicate?: () => void
    onDelete?: () => void
    brandId?: string
    moduleId?: string
}

const getSectionHeight = (settingsHeight?: string) => {
    // fit: as tall as the content · fill: grows with the page (flex), no fixed minimum
    if (!settingsHeight || settingsHeight === 'auto' || settingsHeight === 'fit' || settingsHeight === 'fill') return undefined
    switch (settingsHeight) {
        case 'XS': return '150px'
        case 'S': return '250px'
        case 'M': return '385px'
        case 'L': return '500px'
        case 'XL': return '650px'
        default: return settingsHeight
    }
}

const SectionWrapper = ({
    id,
    children,
    onMoveUp,
    onMoveDown,
    onEdit,
    onAnimate,
    isFirst,
    isLast,
    settingsPanel,
    settings,
    isReadOnly,
    responsiveDevice,
    hoverEffect,
    onUpdateSettings,
    onCopy,
    onDuplicate,
    onDelete,
    brandId,
    moduleId
}: SectionWrapperProps) => {
    const sectionHover = isReadOnly ? getHoverProps(hoverEffect) : { className: '', style: {} }
    // Covers: animated background + their own context bar and settings
    const cover = isCoverSection(settings)
    const coverSettings = (settings as { cover?: CoverSettings } | undefined)?.cover
    const [coverHovered, coverHover] = useHoverIntent()
    const [coverPanelOpen, setCoverPanelOpen] = useState(false)

    // Radial gradient shapes are drawn in pixels of the section (so a circle stays a circle): measure it
    const sectionRef = React.useRef<HTMLDivElement>(null)
    const [sectionBox, setSectionBox] = useState<{ width: number, height: number }>()
    const measuresGradient = settings?.backgroundType === 'gradient' && settings?.backgroundGradient?.type === 'radial'
    useEffect(() => {
        const el = sectionRef.current
        if (!el || !measuresGradient) return
        const ro = new ResizeObserver(() => setSectionBox({ width: el.clientWidth, height: el.clientHeight }))
        ro.observe(el)
        return () => ro.disconnect()
    }, [measuresGradient])

    // Margin and corner rounding. In the editor the margin adds to the room kept for the section toolbar
    const margin = settings?.sectionMargin
    const radius = settings?.sectionRadius
    const marginX = (margin?.left || 0) + (margin?.right || 0)
    const hasRadius = !!radius && (radius.top || radius.right || radius.bottom || radius.left) > 0
    const boxStyle: React.CSSProperties = {
        ...(margin ? {
            marginTop: (isReadOnly ? 0 : 32) + (margin.top || 0),
            marginBottom: (isReadOnly ? 0 : 16) + (margin.bottom || 0),
            marginLeft: margin.left || undefined,
            marginRight: margin.right || undefined,
            width: marginX ? `calc(100% - ${marginX}px)` : undefined,
        } : {}),
        ...(hasRadius ? {
            borderRadius: `${radius!.top || 0}px ${radius!.right || 0}px ${radius!.bottom || 0}px ${radius!.left || 0}px`,
            // Clip the content to the corners on the page; the editor keeps the toolbar (outside the box) visible
            overflow: isReadOnly ? 'hidden' : undefined,
        } : {}),
    }
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

    const { settings: brandDesignSettings } = useBrandDesign()
    const effectiveSectionBg = (
        settings?.backgroundType === 'color' || !settings?.backgroundType
            ? (settings?.backgroundColor && settings.backgroundColor !== 'transparent' ? settings.backgroundColor : undefined)
            : settings?.backgroundType === 'gradient' && settings?.backgroundGradient?.stops?.[0]?.color
                ? settings.backgroundGradient.stops[0].color
                : undefined
    ) || brandDesignSettings?.main_project_bg || '#ffffff'

    return (
        <SectionContext.Provider value={{ sectionId: id, backgroundColor: effectiveSectionBg }}>
            <div
                ref={sectionRef}
                id={id ? `section-${id}` : undefined}
                data-section-id={id}
                {...(cover && !isReadOnly ? coverHover : {})}
            className={cn(
                "relative transition-colors w-full scroll-mt-6",
                // Fill container: takes all the height left on the page; the content inside stretches with it
                settings?.height === 'fill' && "flex-1 flex flex-col",
                isReadOnly ? "border-0 mb-0" : "group border border-dashed border-gray-200 hover:border-[#FF0054] mb-4 mt-[32px]",
                sectionHover.className
            )}
            style={{
                ...sectionHover.style,
                ...boxStyle,
                // Full screen: exactly the screen height (minus the margin); taller content can still grow it
                minHeight: isFullScreenSection(settings) ? fullScreenHeight(settings) : getSectionHeight(settings?.height),
                backgroundColor: settings?.backgroundType === 'color' || !settings?.backgroundType ? settings?.backgroundColor : undefined,
                // Covers draw their image in the backdrop (so it can move)
                backgroundImage: settings?.backgroundType === 'image' && settings?.backgroundImage
                    ? (cover ? undefined : `url(${settings.backgroundImage})`)
                    : settings?.backgroundType === 'gradient' && settings?.backgroundGradient
                        ? sectionGradientCss(settings.backgroundGradient, sectionBox)
                        : undefined,
                backgroundSize: settings?.backgroundType === 'image' ? 'cover' : undefined,
                backgroundPosition: settings?.backgroundType === 'image' ? 'center' : undefined,
                paddingTop: settings?.isFullHeight ? 0 : (settings?.sectionPadding?.top ?? 40),
                paddingRight: settings?.isFullWidth ? 0 : (settings?.sectionPadding?.right ?? 40),
                paddingBottom: settings?.isFullHeight ? 0 : (settings?.sectionPadding?.bottom ?? 40),
                paddingLeft: settings?.isFullWidth ? 0 : (settings?.sectionPadding?.left ?? 40),
            }}
        >
            {cover && (
                <CoverBackdrop
                    cover={coverSettings}
                    image={settings?.backgroundType === 'image' ? settings?.backgroundImage : undefined}
                    hostRef={sectionRef}
                    radius={boxStyle.borderRadius as string | undefined}
                />
            )}

            {cover && !isReadOnly && settings && onUpdateSettings && (coverHovered || coverPanelOpen) && (
                <div className="absolute left-1/2 top-4 -translate-x-1/2 z-[60]" {...coverHover}>
                    <CoverBar
                        settings={settings}
                        settingsOpen={coverPanelOpen}
                        onSettings={() => setCoverPanelOpen(open => !open)}
                        onEffect={(effect) => onUpdateSettings({ cover: { ...coverSettings, effect } })}
                        onEditSection={(e) => { setCoverPanelOpen(false); onEdit(e) }}
                        onAnimate={onAnimate}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onCopy={onCopy}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                        isFirst={isFirst}
                        isLast={isLast}
                    />
                    {coverPanelOpen && (
                        <FloatingPanel placement="bottom-center" offset={10}>
                            <CoverPanel
                                settings={settings}
                                onChange={onUpdateSettings}
                                onClose={() => setCoverPanelOpen(false)}
                                brandId={brandId}
                                moduleId={moduleId}
                            />
                        </FloatingPanel>
                    )}
                </div>
            )}

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
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnimate(); }}
                            title="Animar secção"
                            className="bg-[#FF0054] text-white w-[36px] h-[28px] flex items-center justify-center hover:bg-[#D90046] rounded-t-[4px]"
                        >
                            <Zap className="w-4 h-4" />
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
                    cover && "relative z-[1]",
                    (isFullScreenSection(settings) || (settings?.height && settings.height !== 'auto' && settings.height !== 'fit')) && "flex-1"
                )}
                style={{
                    justifyContent: getJustifyContent(),
                    alignItems: getAlignItems(),
                    // Inside the padding, so the section doesn't end up taller than the screen
                    minHeight: isFullScreenSection(settings) ? fullScreenHeight(settings, true) : getSectionHeight(settings?.height)
                }}
            >
                {children}
            </div>
            {/* Overlay for inactive blocks if needed, but not requested */}
        </div>
        </SectionContext.Provider>
    )
}

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9)

/** Blocks that hold columns of blocks: sections / layouts, and footers (their rows of native columns) */
const isContainer = (b: Block) => (b.type === 'layout' || b.type === 'footer') && Array.isArray(b.content?.columns)

/** Adds a block at the end of a column, wherever that column's layout is (a section, a layout in a column, a footer) */
const insertIntoColumn = (list: Block[], parentId: string, columnId: string, newBlock: Block): Block[] =>
    list.map((b: Block) => {
        if (!isContainer(b)) return b
        const columns = b.content.columns as Array<{ id: string, blocks?: Block[] }>
        return {
            ...b,
            content: {
                ...b.content,
                columns: columns.map(col => b.id === parentId && col.id === columnId
                    ? { ...col, blocks: [...(col.blocks || []), newBlock] }
                    : { ...col, blocks: insertIntoColumn(col.blocks || [], parentId, columnId, newBlock) }),
            },
        }
    })

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
    footer?: React.ReactNode
}

export function MainCanvas({
    brandId,
    activeModule,
    onUpdateModule,
    activeBlockId,
    onSelectBlock,
    isReadOnly = false,
    onAnimate,
    responsiveDevice = 'widescreen',
    footer
}: MainCanvasProps) {
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
    const [isAddItemOpen, setIsAddItemOpen] = useState(false)
    // Context for adding blocks (if null, adds to root)
    const [addingContext, setAddingContext] = useState<{ parentId?: string, columnId?: string, insertIndex?: number } | null>(null)
    const [panelInitialPos, setPanelInitialPos] = useState<{ top: number, left: number } | null>(null)
    const [clipboard, setClipboard] = useState<BrivioClipboardItem | null>(null)
    const [isSaveComponentOpen, setIsSaveComponentOpen] = useState(false)
    const [blockToSave, setBlockToSave] = useState<Block | null>(null)

    useEffect(() => {
        const syncClipboard = () => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('brivio_clipboard')
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved)
                        if (parsed && typeof parsed === 'object') {
                            if ('itemType' in parsed && 'data' in parsed) {
                                setClipboard(parsed as BrivioClipboardItem)
                            } else if ('id' in parsed) {
                                const itemType: ClipboardItemType = parsed.type === 'layout' ? 'section' : 'block'
                                setClipboard({
                                    itemType,
                                    data: parsed,
                                    label: parsed.type || 'Bloco'
                                })
                            }
                        }
                    } catch (err) {
                        console.error("Failed to parse clipboard", err)
                    }
                } else {
                    setClipboard(null)
                }
            }
        }

        syncClipboard()

        const handleClipboardUpdate = (e: any) => {
            if (e.detail) {
                setClipboard(e.detail)
            } else {
                syncClipboard()
            }
        }

        window.addEventListener('brivio_clipboard_update', handleClipboardUpdate)
        window.addEventListener('storage', syncClipboard)

        return () => {
            window.removeEventListener('brivio_clipboard_update', handleClipboardUpdate)
            window.removeEventListener('storage', syncClipboard)
        }
    }, [])

    const { settings, isResizingGlobal } = useBrandDesign()

    // Dynamic width based on responsive selector
    const getResponsiveWidth = () => {
        switch (responsiveDevice) {
            case 'mobile': return 'max-w-[400px]'
            case 'desktop': return 'max-w-none'
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
                    fontWeight: 500
                }
            }
        } else if (type === 'palette') {
            content = {
                colors: []
            }
        } else if (type === 'social-mockup') {
            content = { ...createSocialMockupContent() }
        } else if (type === 'motif-field') {
            content = { settings: {} }
        } else if (type === 'photo-grade') {
            content = { ...createPhotoGradeContent() }
        } else if (type === 'icon-specimen') {
            content = { ...createIconSpecimenContent() }
        } else if (type === 'color-accordion') {
            content = { ...createColorAccordionContent() }
        } else if (type === 'type-specimen') {
            content = { ...createTypeSpecimenContent() }
        } else if (type === 'logo-misuse') {
            content = { ...createLogoMisuseContent() }
        } else if (type === 'logo-size') {
            content = { ...createLogoSizeContent() }
        } else if (type === 'logo-showcase') {
            content = { ...createLogoShowcaseContent() }
        } else if (type === 'footer') {
            content = { ...createFooterContent() }
        } else if (type === 'marquee') {
            content = { ...createMarqueeContent() }
        } else if (type === 'index') {
            // Starts in pages mode: lists the brandbook pages from the side menu and follows its changes
            content = {
                items: [],
                settings: { source: 'pages' }
            }
        } else if (['image', 'video'].includes(type)) {
            content = { url: "", caption: "" }
        } else if (type === 'story') {
            content = {
                slides: [
                    {
                        id: generateId(),
                        title: "Brief but concise",
                        description: "By keeping the brand message, image, and tone of voice consistent, remember, identity guidelines are for everyday life at the company."
                    },
                    {
                        id: generateId(),
                        title: "Consistent & clear",
                        description: "Every touchpoint matters. Make sure visual and verbal identity work harmoniously across all mediums."
                    },
                    {
                        id: generateId(),
                        title: "Adaptable for the future",
                        description: "Guidelines should evolve with your brand while staying true to its core foundation and principles."
                    }
                ],
                settings: {
                    autoplay: false,
                    duration: 5,
                    accentColor: '#2563EB',
                    barColor: '#E2E8F0',
                    buttonColor: '#2563EB',
                    align: 'left'
                }
            }
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
            newBlocks = insertIntoColumn(blocks, addingContext.parentId, addingContext.columnId || '', newBlock)
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
                    if (content && typeof content === 'object' && 'position' in content) {
                        const { position, ...restContent } = content as { position?: { x: number; y: number } }
                        return {
                            ...b,
                            content: Object.keys(restContent).length > 0 ? (typeof b.content === 'object' ? { ...b.content, ...restContent } : restContent) : b.content,
                            position: position !== undefined ? position : b.position
                        }
                    }
                    return {
                        ...b,
                        content: content as Block['content']
                    }
                }
                if (isContainer(b)) {
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
                } else if (isContainer(b)) {
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

    const handleCopySection = (sectionId: string) => {
        const section = blocks.find(b => b.id === sectionId)
        if (!section) return

        const colCount = section.content?.columns?.length || 1
        const clipboardItem: BrivioClipboardItem = {
            itemType: 'section',
            data: section,
            label: `Seção (${colCount} ${colCount === 1 ? 'coluna' : 'colunas'})`
        }
        setClipboard(clipboardItem)
        localStorage.setItem('brivio_clipboard', JSON.stringify(clipboardItem))
        window.dispatchEvent(new CustomEvent('brivio_clipboard_update', { detail: clipboardItem }))
        try {
            navigator.clipboard.writeText(JSON.stringify(clipboardItem))
        } catch { /* ignore */ }

        toast.success("Seção copiada para a área de transferência!", {
            description: "Opções de colar disponíveis apenas entre as seções."
        })
    }

    const handleCopyBlock = (blockId: string) => {
        // Check if copying a root section
        const rootSection = blocks.find(b => b.id === blockId)
        if (rootSection) {
            handleCopySection(blockId)
            return
        }

        const findBlock = (list: Block[]): Block | null => {
            for (const b of list) {
                if (b.id === blockId) return b
                if (isContainer(b)) {
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
            const blockNames: Record<string, string> = {
                heading: 'Título',
                text: 'Texto',
                image: 'Imagem',
                video: 'Vídeo',
                layout: 'Layout',
                button: 'Botão',
                palette: 'Paleta de Cores',
                gallery: 'Galeria',
                carousel: 'Carrossel',
                embed: 'Embed',
                list: 'Lista',
                story: 'Story Slider'
            }
            const name = blockNames[block.type] || block.type || 'Bloco'

            const clipboardItem: BrivioClipboardItem = {
                itemType: 'block',
                data: block,
                label: name
            }
            setClipboard(clipboardItem)
            localStorage.setItem('brivio_clipboard', JSON.stringify(clipboardItem))
            window.dispatchEvent(new CustomEvent('brivio_clipboard_update', { detail: clipboardItem }))
            try {
                navigator.clipboard.writeText(JSON.stringify(clipboardItem))
            } catch { /* ignore */ }

            toast.success(`${name} copiado para a área de transferência!`, {
                description: "Opções de colar disponíveis dentro das colunas."
            })
        }
    }

    const handlePasteSection = (insertIndex?: number) => {
        if (!clipboard || clipboard.itemType !== 'section' || !clipboard.data) return

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

        const newSection = deepCloneWithNewIds(JSON.parse(JSON.stringify(clipboard.data))) as Block
        let newBlocks = [...blocks]

        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= newBlocks.length) {
            newBlocks.splice(insertIndex, 0, newSection)
        } else {
            newBlocks.push(newSection)
        }

        setBlocks(newBlocks, 'Paste section')
        if (onUpdateModule && activeModule && !historyContext) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
        toast.success("Seção colada com sucesso!")
    }

    const handlePasteBlock = (parentId?: string, columnId?: string, insertIndex?: number) => {
        if (!clipboard) return

        if (clipboard.itemType === 'section') {
            handlePasteSection(insertIndex)
            return
        }

        if (clipboard.itemType !== 'block' || !clipboard.data) return

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

        const newBlock = deepCloneWithNewIds(JSON.parse(JSON.stringify(clipboard.data))) as Block
        let newBlocks = [...blocks]

        if (parentId && columnId) {
            newBlocks = insertIntoColumn(blocks, parentId, columnId, newBlock)
            setBlocks(newBlocks, 'Paste block')
            if (onUpdateModule && activeModule && !historyContext) {
                onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
            }
            toast.success("Bloco colado com sucesso!")
        }
    }

    const handleClearClipboard = useCallback(() => {
        console.log('[MainCanvas] handleClearClipboard called')
        setClipboard(null)
        localStorage.removeItem('brivio_clipboard')
        try {
            navigator.clipboard.writeText('')
        } catch { /* ignore */ }
        toast.info("Área de transferência limpa.")
    }, [])

    const handleDeleteBlock = (blockId: string) => {
        console.log('[MainCanvas] handleDeleteBlock called for:', blockId)

        // Find the block type before deleting
        const findBlockType = (list: Block[]): string | null => {
            for (const b of list) {
                if (b.id === blockId) return b.type
                if (isContainer(b)) {
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
                if (isContainer(b)) {
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

    const handleSaveAsComponent = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId)
        if (block) {
            setBlockToSave(block)
            setIsSaveComponentOpen(true)
            onSelectBlock(null) // Close settings panel
        }
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
                <SaveComponentModal
                    isOpen={isSaveComponentOpen}
                    onClose={() => {
                        setIsSaveComponentOpen(false)
                        setBlockToSave(null)
                    }}
                    block={blockToSave}
                    brandId={brandId}
                />
            </div>
        )
    }

    return (
        <>
            <div
                data-page-scroller
                className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-white p-0 custom-scrollbar relative transition-colors duration-300 flex flex-col"
                style={{ backgroundColor: (activeModule.content_json?.pageBackground as string | undefined) || settings.main_project_bg }}
            >
                {/* data-bleed-root: page width that edge-to-edge blocks (slider gallery) stretch to */}
                <div data-bleed-root className={cn(
                    "w-full flex-1 bg-transparent p-0 relative transition-all duration-300 flex flex-col",
                    getResponsiveWidth(),
                    responsiveDevice !== 'widescreen' && "mx-auto",
                    !isReadOnly && "pt-[80px]"
                )}>
                    {isResizingGlobal && (
                        <div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-[1000] flex justify-center">
                            <div className={cn(
                                "h-full grid grid-cols-12 gap-[32px]",
                                responsiveDevice === 'desktop' ? "w-[1070px]" : responsiveDevice === 'widescreen' ? "w-[1452px]" : "w-[400px]"
                            )}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="h-full bg-[#FF0054]/5 border-x border-[#FF0054]/10" />
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="w-full text-gray-600 flex-1 flex flex-col">
                        <div className={cn("w-full flex-1 flex flex-col", !isReadOnly ? "space-y-6" : "")}>
                            {blocks.length > 0 ? (
                                <>
                                    {/* Divider before first section */}
                                    {!isReadOnly && (
                                        <SectionDivider
                                            onClick={() => {
                                                setAddingContext({ insertIndex: 0 })
                                                setIsAddSectionOpen(true)
                                            }}
                                            onPaste={() => handlePasteSection(0)}
                                            onClear={handleClearClipboard}
                                            hasClipboard={clipboard?.itemType === 'section'}
                                        />
                                    )}

                                    {blocks.map((block, index) => (
                                        <React.Fragment key={block.id}>
                                            {/* The section's animation plays on the whole section, background included */}
                                            <AnimatedBlock animation={block.content?.animation} settings={block.content?.animationSettings} isEnabled={isReadOnly} className={block.content?.settings?.height === 'fill' ? "flex-1 flex flex-col" : undefined}>
                                            <SectionWrapper
                                                id={block.id}
                                                onMoveUp={() => handleMoveBlock(index, 'up')}
                                                onMoveDown={() => handleMoveBlock(index, 'down')}
                                                onEdit={(e: React.MouseEvent) => {
                                                    const rect = e.currentTarget.getBoundingClientRect()
                                                    // Position to the left of the button (280px width + 10px gap)
                                                    setPanelInitialPos({ top: rect.top, left: rect.left - 290 })
                                                    onSelectBlock(activeBlockId === block.id ? null : block.id)
                                                }}
                                                onAnimate={() => {
                                                    onSelectBlock(block.id)
                                                    onAnimate?.()
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
                                                            onDuplicate={() => handleDuplicateBlock(block.id)}
                                                            onCopy={() => handleCopySection(block.id)}
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
                                                responsiveDevice={responsiveDevice}
                                                hoverEffect={block.content?.hoverEffect}
                                                onUpdateSettings={(patch) => handleUpdateSectionSettings(block.id, { ...block.content.settings, ...patch })}
                                                onCopy={() => handleCopySection(block.id)}
                                                onDuplicate={() => handleDuplicateBlock(block.id)}
                                                onDelete={() => handleDeleteBlock(block.id)}
                                                brandId={brandId}
                                                moduleId={activeModule.id}
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
                                                    responsiveDevice={responsiveDevice}
                                                    clipboard={clipboard}
                                                    onPasteBlock={handlePasteBlock}
                                                    disableAnimation
                                                />
                                            </SectionWrapper>
                                            </AnimatedBlock>

                                            {!isReadOnly && (
                                                <SectionDivider
                                                    onClick={() => {
                                                        setAddingContext({ insertIndex: index + 1 })
                                                        setIsAddSectionOpen(true)
                                                    }}
                                                    onPaste={() => handlePasteSection(index + 1)}
                                                    onClear={handleClearClipboard}
                                                    hasClipboard={clipboard?.itemType === 'section'}
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

                                            {clipboard?.itemType === 'section' && (
                                                <div className="flex gap-1 items-center">
                                                    <Button
                                                        onClick={() => handlePasteSection()}
                                                        className="bg-[#8E8E8E] hover:bg-[#7A7A7A] text-white font-semibold px-6 shadow-sm rounded-full h-11 tracking-wide text-sm flex items-center gap-2 border-none"
                                                    >
                                                        <Clipboard className="w-4 h-4" />
                                                        <span>Colar Seção</span>
                                                    </Button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleClearClipboard(); }}
                                                        className="w-11 h-11 rounded-full bg-[#8E8E8E]/20 text-[#8E8E8E] hover:text-green-500 hover:bg-green-500/10 transition-all flex items-center justify-center border border-[#8E8E8E]/30"
                                                        title="Limpar Área de Transferência"
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

                {/* Brandbook Footer - Always strictly the last component */}
                <div className={cn("w-full shrink-0 z-10", !isReadOnly && "mt-auto")}>
                    {footer}
                </div>
            </div>

            <SaveComponentModal
                isOpen={isSaveComponentOpen}
                onClose={() => {
                    setIsSaveComponentOpen(false)
                    setBlockToSave(null)
                }}
                block={blockToSave}
                brandId={brandId}
            />

            <AddSectionDialog
                isOpen={isAddSectionOpen}
                onOpenChange={(open) => {
                    setIsAddSectionOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
                hasClipboard={clipboard?.itemType === 'section'}
                onPaste={() => handlePasteSection(addingContext?.insertIndex)}
                onClearClipboard={handleClearClipboard}
            />

            <AddItemDialog
                isOpen={isAddItemOpen}
                onOpenChange={(open) => {
                    setIsAddItemOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
                hasClipboard={clipboard?.itemType === 'block'}
                onPaste={() => handlePasteBlock(addingContext?.parentId, addingContext?.columnId)}
                onClearClipboard={handleClearClipboard}
            />

            {/* Floating Clipboard Indicator Bar */}
            {clipboard && !isReadOnly && (
                <div className="fixed bottom-6 right-8 z-[9998] flex items-center gap-3 bg-[#15161B] text-white border-2 border-[#FF0054] px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0054] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF0054]"></span>
                        </span>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Clipboard className="w-3.5 h-3.5 text-[#FF0054]" />
                                {clipboard.itemType === 'section'
                                    ? `Seção copiada (${clipboard.label || '1 seção'})`
                                    : clipboard.itemType === 'column'
                                    ? `Coluna copiada (${clipboard.label || '1 coluna'})`
                                    : `Bloco copiado (${clipboard.label || '1 bloco'})`}
                            </span>
                            <span className="text-[11px] text-gray-400">
                                {clipboard.itemType === 'section'
                                    ? 'Opções de colar exibidas entre as seções'
                                    : clipboard.itemType === 'column'
                                    ? 'Opções de colar exibidas dentro das seções'
                                    : 'Opções de colar exibidas dentro das colunas'}
                            </span>
                        </div>
                    </div>
                    <div className="h-6 w-[1px] bg-white/20 mx-1" />
                    <button
                        onClick={handleClearClipboard}
                        className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 font-medium cursor-pointer"
                        title="Limpar área de transferência"
                    >
                        <X className="w-3.5 h-3.5" />
                        Limpar
                    </button>
                </div>
            )}
        </>
    )
}

/** A page without blocks: one array, so its history does not see a new page on every render */
const EMPTY_BLOCKS: Block[] = []

// Wrapper component that provides history context
export function MainCanvasWithHistory(props: MainCanvasProps) {
    const { activeModule, onUpdateModule, isReadOnly } = props
    const initialBlocks = (activeModule?.content_json?.blocks || EMPTY_BLOCKS) as Block[]

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
            historyKey={activeModule?.id}
            enabled={!isReadOnly}
        >
            <MainCanvas {...props} />
            <EditorToast />
        </EditorHistoryProvider>
    )
}
