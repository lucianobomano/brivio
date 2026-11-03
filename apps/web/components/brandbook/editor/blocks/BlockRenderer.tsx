"use client"

import React from "react"
import { Block, BrivioClipboardItem, BlockLink } from "../types"

import { cn } from "@/lib/utils"

import { LayoutBlock } from "./LayoutBlock"
import { MediaBlock } from "./MediaBlock"
import { EmbedBlock } from "./EmbedBlock"
import { Magnetic, MaskReveal, lightTextStyle, useLightProgress } from "../scrollFx"
import { ListBlock } from "./ListBlock"
import { CompositeBlock } from "./CompositeBlock"
import { ButtonBlock } from "./ButtonBlock"
import { PaletteBlock } from "./PaletteBlock"
import { SeparatorBlock } from "./SeparatorBlock"
import { MarqueeBlock } from "./MarqueeBlock"
import { FooterBlock } from "./FooterBlock"
import { LogoShowcaseBlock } from "./LogoShowcaseBlock"
import { LogoSizeBlock } from "./LogoSizeBlock"
import { LogoMisuseBlock } from "./LogoMisuseBlock"
import { TypeSpecimenBlock } from "./TypeSpecimenBlock"
import { ColorAccordionBlock } from "./ColorAccordionBlock"
import { IconSpecimenBlock } from "./IconSpecimenBlock"
import { PhotoGradeBlock } from "./PhotoGradeBlock"
import { MotifFieldBlock } from "./MotifFieldBlock"
import { SocialMockupBlock } from "./SocialMockupBlock"
import { StoryBlock } from "./StoryBlock"
import { IndexBlock } from "./IndexBlock"
import { getHoverProps } from "../hoverEffects"
import { TextToolbar } from "../TextToolbar"
import { useBrandDesign } from "../BrandDesignContext"
import { AnimatedBlock } from "../AnimatedBlock"
import { EDITOR_COLLISION_PADDING } from "../editorLayout"
import { DraggableBlockWrapper } from "./DraggableBlockWrapper"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { DialogClose, DialogTitle } from "@radix-ui/react-dialog"
import { Clipboard, Link as LinkIcon } from "lucide-react"

interface BlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onAddBlock?: (parentId: string, columnId: string, type: string, variant?: string) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onAnimate?: () => void
    /** Set when a parent (the section wrapper) already plays this block's animation */
    disableAnimation?: boolean
    align?: 'left' | 'center' | 'right'
    isFreeFlow?: boolean
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
    clipboard?: BrivioClipboardItem | null
    onPasteBlock?: (parentId?: string, columnId?: string, insertIndex?: number) => void
}

import {
    AutoResizeTextarea,
    ResizableWrapper,
    detectTransform,
    detectFormats,
    detectListFormat,
    detectAlign,
    detectColor,
    detectHeight,
    detectOutline,
    detectFontSize,
    detectWeight,
    detectBackgroundColor,
    scrollPageToTop,
    useGoogleFont
} from "./BlockUtils"

/** Which text block currently owns the (single) text toolbar, shared by all text blocks on the page */
const textToolbarOwner = { id: null as string | null, listeners: new Set<() => void>() }
const setTextToolbarOwner = (id: string | null) => {
    if (textToolbarOwner.id === id) return
    textToolbarOwner.id = id
    textToolbarOwner.listeners.forEach(listener => listener())
}
const useTextToolbarOwner = () => React.useSyncExternalStore(
    (onChange) => { textToolbarOwner.listeners.add(onChange); return () => { textToolbarOwner.listeners.delete(onChange) } },
    () => textToolbarOwner.id,
    () => null
)

const EditableTextBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate, align, responsiveDevice, type }: BlockProps & { type: 'heading' | 'body' }) => {
    const { getStyleById, onSelectModule } = useBrandDesign()
    const [isFocused, setIsFocused] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [isLinkOpen, setIsLinkOpen] = React.useState(false)

    // Determine global style
    const styleId = type === 'heading'
        ? ((block.variant === 'h2' || block.content?.text?.startsWith('##')) ? 'h2' : 'h1')
        : 'body'
    const globalStyle = getStyleById(styleId)
    const isHeading = type === 'heading'
    useGoogleFont(block.content.style?.fontFamily)
    // "Acender com scroll": the text lights up from top to bottom as it scrolls in (Preview / shared link)
    const lightsUp = !!isReadOnly && block.content?.animation === 'acender'
    const lightRef = useLightProgress(lightsUp)
    // Letter spacing in % of the font size: the block's own value (em or px), else the global text style
    const [letterSpacingPreview, setLetterSpacingPreview] = React.useState<number | null>(null)
    const currentLetterSpacing = (() => {
        const raw = block.content.style?.letterSpacing
        if (typeof raw === 'string' && raw.trim().endsWith('em')) return Math.round(parseFloat(raw) * 1000) / 10
        if (typeof raw === 'string' && raw.trim().endsWith('px')) {
            const size = parseFloat(block.content.style?.fontSize || globalStyle?.size || '16') || 16
            return Math.round((parseFloat(raw) / size) * 1000) / 10
        }
        return globalStyle?.spacing ? Math.round(parseFloat(String(globalStyle.spacing)) * 1000) / 10 : 0
    })()
    const [lineHeightPreview, setLineHeightPreview] = React.useState<number | null>(null)
    const letterSpacingOverride = {
        ...(letterSpacingPreview !== null ? { letterSpacing: `${letterSpacingPreview / 100}em` } : {}),
        ...(lineHeightPreview !== null ? { lineHeight: lineHeightPreview } : {}),
    }

    // Two separate things: the column alignment places the text BOX; the text alignment (toolbar) aligns the
    // LINES inside it. Without its own width, a box in a centered / right column hugs its text so it can move.
    const textAlign = block.content.style?.textAlign || 'left'
    const hugText = !block.content.style?.width && (align === 'center' || align === 'right')
    const hugTextareaStyle: React.CSSProperties = hugText
        ? ({ width: 'auto', minWidth: '2ch', maxWidth: '100%', fieldSizing: 'content' } as React.CSSProperties)
        : {}

    // Only one text toolbar at a time: the text being edited (or with a panel of its own open) owns it;
    // hovering another text shows that one's toolbar only while no text owns it
    const toolbarOwner = useTextToolbarOwner()
    const claimsToolbar = !isReadOnly && ((activeBlockId === block.id && isFocused) || isSettingsOpen || isLinkOpen)
    React.useEffect(() => {
        if (claimsToolbar) setTextToolbarOwner(block.id)
        else if (textToolbarOwner.id === block.id) setTextToolbarOwner(null)
    }, [claimsToolbar, block.id])
    React.useEffect(() => () => { if (textToolbarOwner.id === block.id) setTextToolbarOwner(null) }, [block.id])
    const isToolbarVisible = !isReadOnly && (claimsToolbar || (isHovered && (toolbarOwner === null || toolbarOwner === block.id)))
    const hasCustomBottomMargin = block.content?.style?.margin?.bottom !== undefined && block.content?.style?.margin?.bottom !== ''

    const blockLink = block.content?.link as BlockLink | undefined

    const handleLinkClick = (e: React.MouseEvent) => {
        if (!blockLink) return
        e.stopPropagation()

        if (blockLink.type === 'url' && blockLink.url === '#top') {
            scrollPageToTop(e.currentTarget as HTMLElement)
        } else if (blockLink.type === 'url' && blockLink.url) {
            let targetUrl = blockLink.url.trim()
            if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.startsWith('/') && !targetUrl.startsWith('#') && !targetUrl.startsWith('mailto:')) {
                targetUrl = 'https://' + targetUrl
            }
            window.open(targetUrl, blockLink.target || '_blank', 'noopener,noreferrer')
        } else if (blockLink.type === 'internal' && blockLink.moduleId) {
            if (onSelectModule) {
                onSelectModule(blockLink.moduleId)
            }
        } else if (blockLink.type === 'section' && blockLink.sectionId) {
            const targetEl = document.getElementById(`section-${blockLink.sectionId}`) || document.getElementById(blockLink.sectionId)
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }
    }

    return (
        <div
            className={cn(
                // No default bottom margin: the column's "Espaçamento" sets the space between items
                "group/block relative w-full overflow-visible hover:z-50",
                activeBlockId === block.id && "z-50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            {/* Toolbar using Portal to stay on screen */}
            {!isReadOnly && (
                <PopoverPrimitive.Root open={isToolbarVisible} modal={false}>
                    <PopoverPrimitive.Anchor asChild>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0" />
                    </PopoverPrimitive.Anchor>
                    <PopoverPrimitive.Portal>
                        <PopoverPrimitive.Content
                            side="top"
                            align="center"
                            sideOffset={12}
                            collisionPadding={EDITOR_COLLISION_PADDING}
                            className="z-[2000] outline-none"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="animate-in fade-in zoom-in-95 duration-200">
                                <TextToolbar
                                    onDelete={onDelete ? () => onDelete(block.id) : undefined}
                                    onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                                    onCopy={onCopy ? () => onCopy(block.id) : undefined}
                                    activeTransform={detectTransform(block.content.text || "")}
                                    onTransform={(t) => {
                                        const text = block.content.text || ""
                                        let newText = text
                                        if (t === 'uppercase') newText = text.toUpperCase()
                                        if (t === 'lowercase') newText = text.toLowerCase()
                                        if (t === 'sentence') newText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
                                        if (t === 'capitalize') newText = text.replace(/\b\w/g, (c: string) => c.toUpperCase())
                                        onUpdate(block.id, { ...block.content, text: newText })
                                    }}
                                    currentFont={block.content.style?.fontFamily || globalStyle?.font || 'Inter'}
                                    onFontChange={(font) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, fontFamily: font } })
                                    }}
                                    currentLineHeight={block.content.style?.lineHeight || globalStyle?.height || (isHeading ? '1.1' : '1.5')}
                                    onLineHeightChange={(h) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, lineHeight: h } })
                                    }}
                                    currentLetterSpacing={currentLetterSpacing}
                                    onLetterSpacingPreview={setLetterSpacingPreview}
                                    onLineHeightPreview={setLineHeightPreview}
                                    onLetterSpacingChange={(percent) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, letterSpacing: `${percent / 100}em` } })
                                    }}
                                    currentFontSize={detectFontSize(block.content.style)}
                                    onFontSizeChange={(size) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, fontSize: size } })
                                    }}
                                    activeFormats={detectFormats(block.content.style)}
                                    onFormat={(fmt) => {
                                        const style = { ...block.content.style }
                                        if (fmt === 'italic') style.fontStyle = style.fontStyle === 'italic' ? 'normal' : 'italic'
                                        if (fmt === 'underline') {
                                             const dec = style.textDecoration || ''
                                             style.textDecoration = dec.includes('underline') ? dec.replace('underline', '').trim() : `${dec} underline`.trim()
                                        }
                                        if (fmt === 'strikethrough') {
                                             const dec = style.textDecoration || ''
                                             style.textDecoration = dec.includes('line-through') ? dec.replace('line-through', '').trim() : `${dec} line-through`.trim()
                                        }
                                        onUpdate(block.id, { ...block.content, style })
                                    }}
                                    currentWeight={detectWeight(block.content.style, globalStyle?.weight)}
                                    onWeightChange={(w) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, fontWeight: w } })
                                    }}
                                    activeListFormat={detectListFormat(block.content.style)}
                                    onListFormat={(listFmt) => {
                                        const style = { ...block.content.style }
                                        if (listFmt) {
                                            if (style.display === 'list-item' && style.listStyleType === listFmt) {
                                                delete style.display; delete style.listStyleType; delete style.listStylePosition; delete style.marginLeft
                                            } else {
                                                style.display = 'list-item'; style.listStyleType = listFmt; style.listStylePosition = 'inside'; style.marginLeft = '1em'
                                            }
                                        }
                                        onUpdate(block.id, { ...block.content, style })
                                    }}
                                    activeAlign={detectAlign(block.content.style)}
                                    onAlign={(a) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, textAlign: a } })
                                    }}
                                    color={detectColor(block.content.style)}
                                    onColorChange={(c) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, color: c } })
                                    }}
                                    backgroundColor={detectBackgroundColor(block.content.style)}
                                    onBackgroundColorChange={(c) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, backgroundColor: c } })
                                    }}
                                    width={block.content.style?.width}
                                    onWidthChange={(w) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, width: w } })
                                    }}
                                    heightValue={block.content.style?.height}
                                    onHeightChangePx={(h) => {
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, height: h } })
                                    }}
                                    heightSettings={detectHeight(block.content.style)}
                                    onHeightSettingsChange={(step) => {
                                        let val: string | undefined = undefined
                                        if (step === 3) val = '40px'
                                        if (step === 5) val = '80px'
                                        if (step === 8) val = '160px'
                                        if (step === 100) val = '400px'
                                        onUpdate(block.id, { ...block.content, style: { ...block.content.style, minHeight: val, height: undefined } })
                                    }}
                                    onOrderChange={(dir) => {
                                        if (onMove) {
                                            onMove(block.id, dir);
                                        } else {
                                            const currentZ = parseInt(block.content.style?.zIndex || '0')
                                            const newZ = dir === 'up' ? currentZ + 1 : currentZ - 1
                                            onUpdate(block.id, { ...block.content, style: { ...block.content.style, zIndex: newZ } })
                                        }
                                    }}
                                    outline={detectOutline(block.content.style)}
                                    onOutlineChange={(side) => {
                                        const style = { ...block.content.style }
                                        const key = side === 'top' ? 'borderTop' : side === 'right' ? 'borderRight' : side === 'bottom' ? 'borderBottom' : 'borderLeft'
                                        if (style[key]) delete style[key]; else style[key] = `2px solid currentColor`
                                        onUpdate(block.id, { ...block.content, style })
                                    }}
                                    textStyle={block.content.style}
                                    onTextStyleChange={(patch) => onUpdate(block.id, { ...block.content, style: { ...block.content.style, ...patch } })}
                                    margin={block.content.style?.margin}
                                    onMarginChange={(m) => {
                                        onUpdate(block.id, {
                                            ...block.content,
                                            style: { ...block.content.style, margin: m }
                                        })
                                    }}
                                    onAnimate={onAnimate}
                                    onSettingsOpenChange={setIsSettingsOpen}
                                    link={blockLink}
                                    onLinkChange={(newLink) => onUpdate(block.id, { ...block.content, link: newLink })}
                                    onLinkOpenChange={setIsLinkOpen}
                                />
                            </div>
                        </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                </PopoverPrimitive.Root>
            )}

            <ResizableWrapper
                width={block.content.style?.width}
                height={block.content.style?.height}
                onWidthChange={(newWidth) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, width: newWidth }
                })}
                onHeightChange={(newHeight) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, height: newHeight }
                })}
                isFocused={isFocused || activeBlockId === block.id}
                isReadOnly={isReadOnly}
                align={align}
                hug={hugText}
                responsiveDevice={responsiveDevice}
            >
                {isReadOnly ? (
                    <div
                        ref={lightsUp ? (el) => { lightRef.current = el } : undefined}
                        data-text-role={isHeading ? 'heading' : 'body'}
                        onClick={blockLink ? handleLinkClick : undefined}
                        className={cn(
                            "w-full max-w-full min-h-0 bg-transparent border border-transparent rounded-none shadow-none focus:ring-0 outline-none focus:outline-none transition-colors whitespace-pre-wrap break-words",
                            isHeading ? "placeholder:text-gray-400/50 leading-tight text-gray-900" : "text-gray-600 leading-relaxed",
                            block.content.style?.backgroundColor ? "p-4" : "p-0",
                            blockLink && "cursor-pointer hover:opacity-85 transition-all underline underline-offset-4 decoration-[#FF0054]/40 hover:decoration-[#FF0054]"
                        )}
                        title={
                            blockLink
                                ? `Link: ${blockLink.type === 'url' ? blockLink.url : blockLink.type === 'internal' ? (blockLink.moduleTitle || 'Página') : (blockLink.sectionTitle || 'Seção')}`
                                : undefined
                        }
                        style={{
                            fontFamily: globalStyle?.font,
                            fontWeight: globalStyle?.weight,
                            letterSpacing: globalStyle?.spacing ? `${globalStyle.spacing}em` : undefined,
                            lineHeight: globalStyle?.height,
                            fontSize: globalStyle?.size ? `${globalStyle.size}px` : undefined,
                            color: globalStyle?.color,
                            textTransform: (globalStyle?.casing === 'none' ? undefined : globalStyle?.casing) as React.CSSProperties['textTransform'],
                            ...block.content.style,
                            ...letterSpacingOverride,
                            textAlign,
                            maxWidth: '100%',
                            height: block.content.style?.height || 'auto',
                            minHeight: '0px',
                            ...(lightsUp ? lightTextStyle(String(block.content.style?.color || globalStyle?.color || '#141414')) : {}),
                        }}
                    >
                        {block.content.text || ""}
                    </div>
                ) : (
                    <div className={cn("relative", hugText ? "w-fit max-w-full" : "w-full", block.content.style?.height && "h-full min-h-[inherit]")}>
                        <AutoResizeTextarea
                            value={block.content.text || ""}
                            readOnly={isReadOnly}
                            onChange={(e) => onUpdate(block.id, { ...block.content, text: e.target.value })}
                            onFocus={() => {
                                onSelect?.(block.id)
                                setIsFocused(true)
                            }}
                            onBlur={() => setIsFocused(false)}
                            placeholder={isHeading ? "Heading" : "Type something..."}
                            fixedHeight={block.content.style?.height}
                            className={cn(
                                "break-words max-w-full w-full min-h-0 bg-transparent border rounded-none shadow-none focus:ring-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors",
                                isHeading ? "placeholder:text-gray-400/50 leading-tight text-gray-900" : "text-gray-600 leading-relaxed",
                                isToolbarVisible ? "border-[#FF0054]" : "border-transparent hover:border-[#FF0054] focus:border-[#FF0054]",
                                block.content.style?.backgroundColor ? "p-4" : "p-0",
                                block.content.style?.height && "h-full min-h-[inherit]"
                            )}
                            style={{
                                fontFamily: globalStyle?.font,
                                fontWeight: globalStyle?.weight,
                                letterSpacing: globalStyle?.spacing ? `${globalStyle.spacing}em` : undefined,
                                lineHeight: globalStyle?.height,
                                fontSize: globalStyle?.size ? `${globalStyle.size}px` : undefined,
                                color: globalStyle?.color,
                                textTransform: (globalStyle?.casing === 'none' ? undefined : globalStyle?.casing) as React.CSSProperties['textTransform'],
                                ...block.content.style,
                                ...letterSpacingOverride,
                                ...hugTextareaStyle,
                                textAlign
                            }}
                        />
                        {blockLink && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsLinkOpen(true)
                                }}
                                className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] text-[#FF0054] bg-[#FF0054]/10 border border-[#FF0054]/25 px-2 py-0.5 rounded-md select-none max-w-max hover:bg-[#FF0054]/20 transition-colors cursor-pointer"
                                title="Editar link configurado"
                            >
                                <LinkIcon className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[260px]">
                                    {blockLink.type === 'url'
                                        ? blockLink.url
                                        : blockLink.type === 'internal'
                                            ? `Página: ${blockLink.moduleTitle || 'Interna'}`
                                            : `Seção: ${blockLink.sectionTitle || 'Seção'}`}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </ResizableWrapper>
        </div>
    )
}

/** Interaction effects chosen in Animar (Preview / shared link): mask reveals and magnetic elements */
const withScrollEffect = (node: React.ReactNode, effect?: string | null) => {
    if (effect === 'magnetico') return <Magnetic>{node}</Magnetic>
    if (effect === 'mascara' || effect === 'mascara_circulo' || effect === 'mascara_arco') {
        return <MaskReveal shape={effect === 'mascara_circulo' ? 'circle' : effect === 'mascara_arco' ? 'arch' : 'petal'}>{node}</MaskReveal>
    }
    return node
}

export function BlockRenderer({ block, isReadOnly, onUpdate, onAddBlock, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate, align, isFreeFlow, responsiveDevice, clipboard, onPasteBlock, disableAnimation }: BlockProps) {
    if (!block) return null

    const commonProps = { block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate, align, isFreeFlow, responsiveDevice, clipboard, onPasteBlock }

    const renderBlock = () => {
        switch (block.type as string) {
            case 'layout':
                return <LayoutBlock {...commonProps} onAddBlock={onAddBlock || (() => { })} />
            case 'headline':
            case 'heading':
                return <EditableTextBlock {...commonProps} type="heading" />
            case 'text':
                if (['h1', 'h2', 'h3'].includes(block.variant || '')) {
                    return <EditableTextBlock {...commonProps} type="heading" />
                }
                return <EditableTextBlock {...commonProps} type="body" />
            case 'image':
            case 'video':
            case 'audio':
            case 'gallery':
            case 'carousel':
                return <MediaBlock {...commonProps} />
            case 'embed':
            case 'download':
                return <EmbedBlock {...commonProps} />
            case 'list':
            case 'code':
                return <ListBlock {...commonProps} />
            case 'composite':
                return <CompositeBlock {...commonProps} />
            case 'separator':
            case 'divider':
                return <SeparatorBlock {...commonProps} />
            case 'spacer':
                return <div className="h-12 w-full" />
            case 'button':
                return <ButtonBlock {...commonProps} />
            case 'palette':
                return <PaletteBlock {...commonProps} />
            case 'story':
                return <StoryBlock {...commonProps} />
            case 'index':
                return <IndexBlock {...commonProps} />
            case 'marquee':
                return <MarqueeBlock {...commonProps} />
            case 'footer':
                return <FooterBlock {...commonProps} onAddBlock={onAddBlock} />
            case 'logo-showcase':
                return <LogoShowcaseBlock {...commonProps} />
            case 'logo-size':
                return <LogoSizeBlock {...commonProps} />
            case 'logo-misuse':
                return <LogoMisuseBlock {...commonProps} />
            case 'type-specimen':
                return <TypeSpecimenBlock {...commonProps} />
            case 'color-accordion':
                return <ColorAccordionBlock {...commonProps} />
            case 'icon-specimen':
                return <IconSpecimenBlock {...commonProps} />
            case 'photo-grade':
                return <PhotoGradeBlock {...commonProps} />
            case 'motif-field':
                return <MotifFieldBlock {...commonProps} />
            case 'social-mockup':
                return <SocialMockupBlock {...commonProps} />
            default:
                return <EditableTextBlock {...commonProps} type="body" />
        }
    }

    const margin = block.content?.style?.margin
    const hasMargin = margin && (
        (margin.top !== undefined && margin.top !== '') ||
        (margin.bottom !== undefined && margin.bottom !== '') ||
        (margin.left !== undefined && margin.left !== '') ||
        (margin.right !== undefined && margin.right !== '')
    )
    const marginStyle: React.CSSProperties = hasMargin ? {
        marginTop: margin.top !== undefined && margin.top !== '' ? `${margin.top}px` : undefined,
        marginBottom: margin.bottom !== undefined && margin.bottom !== '' ? `${margin.bottom}px` : undefined,
        marginLeft: margin.left !== undefined && margin.left !== '' ? `${margin.left}px` : undefined,
        marginRight: margin.right !== undefined && margin.right !== '' ? `${margin.right}px` : undefined,
    } : {}
    const horizontalMargin = (hasMargin ? (Number(margin.left) || 0) + (Number(margin.right) || 0) : 0)
    // Hover state plays in preview / public view only, like animations
    const blockHover = isReadOnly ? getHoverProps(block.content?.hoverEffect) : { className: '', style: {} }
    if (horizontalMargin) marginStyle.width = `calc(100% - ${horizontalMargin}px)`

    return (
        <AnimatedBlock
            animation={block.content?.animation}
            settings={block.content?.animationSettings}
            isEnabled={isReadOnly && !disableAnimation}
        >
            <DraggableBlockWrapper
                block={block}
                isReadOnly={isReadOnly}
                isFreeFlow={isFreeFlow}
                onUpdate={onUpdate}
                onSelect={() => onSelect?.(block.id)}
                activeBlockId={activeBlockId}
                responsiveDevice={responsiveDevice}
            >
                <div
                    className={cn("w-full min-w-0 max-w-full transition-all duration-200 overflow-visible", blockHover.className)}
                    style={{ ...marginStyle, ...blockHover.style }}
                >
                    {withScrollEffect(renderBlock(), isReadOnly ? block.content?.animation : null)}
                </div>
            </DraggableBlockWrapper>
        </AnimatedBlock>
    )
}
