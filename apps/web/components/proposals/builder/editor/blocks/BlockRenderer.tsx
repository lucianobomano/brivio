"use client"

import React from "react"
import { Block } from "../types"

import { cn } from "@/lib/utils"

import { LayoutBlock } from "./LayoutBlock"
import { MediaBlock } from "./MediaBlock"
import { EmbedBlock } from "./EmbedBlock"
// The list is the brandbook's (same block, bar and settings panel in both editors)
import { ListBlock } from "@/components/brandbook/editor/blocks/ListBlock"
import { AnimatedBlock } from "@/components/brandbook/editor/AnimatedBlock"
import { useGoogleFont } from "@/components/brandbook/editor/blocks/BlockUtils"
import { uploadProjectMedia } from "@/app/actions/projects"
import { toast as uploadToast } from "sonner"

/** Picture of a list marker, kept with the project's media */
const uploadListMarker = async (file: File): Promise<string | null> => {
    const id = uploadToast.loading("A carregar a imagem…")
    try {
        const r = await uploadProjectMedia(file)
        if (r.success && "url" in r && r.url) { uploadToast.success("Imagem carregada", { id }); return r.url }
    } catch { /* reported below */ }
    uploadToast.error("Não foi possível carregar a imagem.", { id })
    return null
}
import { CompositeBlock } from "./CompositeBlock"
// The button is the brandbook editor's block (its bar, styles, animations and icons)
import { ButtonBlock } from "@/components/brandbook/editor/blocks/ButtonBlock"
import { PaletteBlock } from "./PaletteBlock"
// The line is the brandbook one (same bar, «Linha» panel and look in both editors)
import { SeparatorBlock } from "@/components/brandbook/editor/blocks/SeparatorBlock"
import { PricingTableBlock } from "./PricingTableBlock"
import { ScopeListBlock } from "./ScopeListBlock"
import { TimelineBlock } from "./TimelineBlock"
import { TextBlockToolbar } from "./TextBlockToolbar"
import { BlockChrome } from "./BlockChrome"
import { useBrandDesign } from "../BrandDesignContext"

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
}

import {
    AutoResizeTextarea,
    detectTransform,
    detectFormats,
    detectListFormat,
    detectAlign,
    detectColor,
    detectHeight,
    detectOutline,
    detectFontSize
} from "./BlockUtils"

const ResizableWrapper = ({
    children,
    width,
    height,
    onWidthChange,
    onHeightChange,
    isFocused,
    isReadOnly,
    className
}: {
    children: React.ReactNode,
    width?: string | number,
    height?: string | number,
    onWidthChange: (width: string) => void,
    onHeightChange?: (height: string) => void,
    isFocused: boolean,
    isReadOnly?: boolean,
    className?: string
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = React.useState<'left' | 'right' | 'top' | 'bottom' | null>(null);

    const handlePointerDownHorizontal = (e: React.PointerEvent, side: 'left' | 'right') => {
        if (isReadOnly) return;
        e.preventDefault();
        e.stopPropagation();

        const handleElement = e.currentTarget as HTMLElement;
        try {
            handleElement.setPointerCapture(e.pointerId);
        } catch {}

        setIsResizing(side);

        const startX = e.clientX;
        const startWidth = containerRef.current?.offsetWidth || 0;
        const maxWidth = containerRef.current?.parentElement?.offsetWidth || 1200;

        if (containerRef.current) {
            containerRef.current.style.transition = 'none';
        }

        const prevUserSelect = document.body.style.userSelect;
        const prevCursor = document.body.style.cursor;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';

        let rafId: number | null = null;
        let latestWidth = startWidth;

        const handlePointerMove = (mmE: PointerEvent) => {
            const delta = mmE.clientX - startX;
            let newWidth = side === 'right' ? startWidth + delta : startWidth - delta;

            newWidth = Math.max(80, Math.min(newWidth, maxWidth));
            latestWidth = newWidth;

            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    if (containerRef.current) {
                        containerRef.current.style.width = `${latestWidth}px`;
                    }
                });
            }
        };

        const handlePointerUp = (upE: PointerEvent) => {
            try {
                handleElement.releasePointerCapture(upE.pointerId);
            } catch {}

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            document.body.style.userSelect = prevUserSelect;
            document.body.style.cursor = prevCursor;

            setIsResizing(null);

            if (containerRef.current) {
                containerRef.current.style.transition = '';
                const finalWidth = `${latestWidth}px`;
                containerRef.current.style.width = finalWidth;
                onWidthChange(finalWidth);
            }

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    const handlePointerDownVertical = (e: React.PointerEvent, side: 'top' | 'bottom') => {
        if (isReadOnly || !onHeightChange) return;
        e.preventDefault();
        e.stopPropagation();

        const handleElement = e.currentTarget as HTMLElement;
        try {
            handleElement.setPointerCapture(e.pointerId);
        } catch {}

        setIsResizing(side);

        const startY = e.clientY;
        const startHeight = containerRef.current?.offsetHeight || 0;

        if (containerRef.current) {
            containerRef.current.style.transition = 'none';
        }

        const innerTextarea = containerRef.current?.querySelector('textarea') as HTMLTextAreaElement | null;
        if (innerTextarea) {
            innerTextarea.style.transition = 'none';
        }

        const prevUserSelect = document.body.style.userSelect;
        const prevCursor = document.body.style.cursor;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';

        let rafId: number | null = null;
        let latestHeight = startHeight;

        const handlePointerMove = (mmE: PointerEvent) => {
            const delta = mmE.clientY - startY;
            let newHeight = side === 'bottom' ? startHeight + delta : startHeight - delta;

            newHeight = Math.max(24, Math.min(newHeight, 1600));
            latestHeight = newHeight;

            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    if (containerRef.current) {
                        containerRef.current.style.height = `${latestHeight}px`;
                        containerRef.current.style.minHeight = `${latestHeight}px`;
                    }
                    if (innerTextarea) {
                        innerTextarea.style.height = `${latestHeight}px`;
                        innerTextarea.style.minHeight = `${latestHeight}px`;
                    }
                });
            }
        };

        const handlePointerUp = (upE: PointerEvent) => {
            try {
                handleElement.releasePointerCapture(upE.pointerId);
            } catch {}

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            document.body.style.userSelect = prevUserSelect;
            document.body.style.cursor = prevCursor;

            setIsResizing(null);

            if (containerRef.current) {
                containerRef.current.style.transition = '';
                const finalHeight = `${latestHeight}px`;
                containerRef.current.style.height = finalHeight;
                containerRef.current.style.minHeight = finalHeight;
                if (innerTextarea) {
                    innerTextarea.style.transition = '';
                    innerTextarea.style.height = finalHeight;
                    innerTextarea.style.minHeight = finalHeight;
                }
                onHeightChange(finalHeight);
            }

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: width || '100%',
                maxWidth: '100%',
                minHeight: height || 'auto',
                position: 'relative'
            }}
            className={cn(
                "mx-auto transition-[width,min-height] duration-200 ease-out max-w-full",
                isResizing && "transition-none",
                className
            )}
        >
            {children}
            {isFocused && !isReadOnly && (
                <>
                    {/* Right Handle */}
                    <div
                        onPointerDown={(e) => handlePointerDownHorizontal(e, 'right')}
                        className={cn(
                            "absolute top-0 right-[-10px] w-[20px] h-full cursor-ew-resize z-[110] flex items-center justify-center group/handle"
                        )}
                    >
                        <div className={cn(
                            "w-[6px] h-32 max-h-[80%] rounded-full transition-all bg-[#ff0054]",
                            isResizing === 'right' ? "scale-x-125 shadow-lg" : "scale-x-100 opacity-0 group-hover/handle:opacity-100"
                        )} />
                    </div>
                    {/* Left Handle */}
                    <div
                        onPointerDown={(e) => handlePointerDownHorizontal(e, 'left')}
                        className={cn(
                            "absolute top-0 left-[-10px] w-[20px] h-full cursor-ew-resize z-[110] flex items-center justify-center group/handle"
                        )}
                    >
                        <div className={cn(
                            "w-[6px] h-32 max-h-[80%] rounded-full transition-all bg-[#ff0054]",
                            isResizing === 'left' ? "scale-x-125 shadow-lg" : "scale-x-100 opacity-0 group-hover/handle:opacity-100"
                        )} />
                    </div>
                    {/* Bottom Handle */}
                    {onHeightChange && (
                        <div
                            onPointerDown={(e) => handlePointerDownVertical(e, 'bottom')}
                            className={cn(
                                "absolute bottom-[-10px] left-0 h-[20px] w-full cursor-ns-resize z-[110] flex items-center justify-center group/handle"
                            )}
                        >
                            <div className={cn(
                                "w-32 max-w-[80%] h-[6px] rounded-full transition-all bg-[#ff0054]",
                                isResizing === 'bottom' ? "scale-y-125 shadow-lg" : "scale-y-100 opacity-0 group-hover/handle:opacity-100"
                            )} />
                        </div>
                    )}
                    {/* Top Handle */}
                    {onHeightChange && (
                        <div
                            onPointerDown={(e) => handlePointerDownVertical(e, 'top')}
                            className={cn(
                                "absolute top-[-10px] left-0 h-[20px] w-full cursor-ns-resize z-[110] flex items-center justify-center group/handle"
                            )}
                        >
                            <div className={cn(
                                "w-32 max-w-[80%] h-[6px] rounded-full transition-all bg-[#ff0054]",
                                isResizing === 'top' ? "scale-y-125 shadow-lg" : "scale-y-100 opacity-0 group-hover/handle:opacity-100"
                            )} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const HeadlineBlock = ({ block, isReadOnly, onUpdate, onSelect, onDelete, onMove, onDuplicate, onCopy }: BlockProps) => {
    const { getStyleById } = useBrandDesign()
    const [isHovered, setIsHovered] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    // Determine which global style to use
    const styleId = (block.variant === 'h2' || block.content?.text?.startsWith('##')) ? 'h2' : 'h1'
    const globalStyle = getStyleById(styleId)

    return (
        <div className="group/block relative w-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}>
            {/* Context bar: the brandbook editor's text bar */}
            {!isReadOnly && (
                <TextBlockToolbar
                    block={block}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onMove={onMove}
                    onDuplicate={onDuplicate}
                    onCopy={onCopy}
                    hovered={isHovered}
                    focused={isFocused}
                    globalStyle={globalStyle}
                    isHeading={true}
                />
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
                isFocused={isFocused}
                isReadOnly={isReadOnly}
            >
                <AutoResizeTextarea
                    value={block.content.text || ""}
                    readOnly={isReadOnly}
                    onChange={(e: any) => onUpdate(block.id, { ...block.content, text: e.target.value })}
                    onFocus={() => {
                        onSelect?.(block.id)
                        setIsFocused(true)
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Heading"
                    className={cn(
                        "w-full min-h-0 bg-transparent border border-transparent rounded-none shadow-none focus:ring-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 font-bold placeholder:text-gray-400/50 leading-tight transition-colors",
                        !isReadOnly && "hover:border-[#FF0054] focus:border-[#FF0054]"
                    )}
                    style={{
                        fontFamily: block.content.style?.fontFamily || globalStyle?.font,
                        fontWeight: block.content.style?.fontWeight || globalStyle?.weight,
                        letterSpacing: block.content.style?.letterSpacing || (globalStyle?.spacing ? `${globalStyle.spacing}em` : undefined),
                        lineHeight: block.content.style?.lineHeight || globalStyle?.height,
                        fontSize: block.content.style?.fontSize || (globalStyle?.size ? `${globalStyle.size}px` : undefined),
                        color: block.content.style?.color || globalStyle?.color,
                        textTransform: block.content.style?.textTransform || (globalStyle?.casing === 'none' ? undefined : globalStyle?.casing) as any,
                        ...block.content.style // Local overrides take precedence for other properties
                    }}
                />
            </ResizableWrapper>
        </div>
    )
}

const TextBlock = ({ block, isReadOnly, onUpdate, onSelect, onDelete, onMove, onDuplicate, onCopy }: BlockProps) => {
    const { getStyleById } = useBrandDesign()
    const [isHovered, setIsHovered] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const globalStyle = getStyleById('body')

    return (
        <div className="w-full group/block relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}>
            {/* Context bar: the brandbook editor's text bar */}
            {!isReadOnly && (
                <TextBlockToolbar
                    block={block}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onMove={onMove}
                    onDuplicate={onDuplicate}
                    onCopy={onCopy}
                    hovered={isHovered}
                    focused={isFocused}
                    globalStyle={globalStyle}
                    isHeading={false}
                />
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
                isFocused={isFocused}
                isReadOnly={isReadOnly}
            >
                <AutoResizeTextarea
                    value={block.content.text || ""}
                    readOnly={isReadOnly}
                    onChange={(e: any) => onUpdate(block.id, { ...block.content, text: e.target.value })}
                    onFocus={() => {
                        onSelect?.(block.id)
                        setIsFocused(true)
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Type something..."
                    className={cn(
                        "w-full min-h-0 bg-transparent border border-transparent rounded-none shadow-none focus:ring-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 resize-none leading-relaxed transition-colors",
                        !isReadOnly && "hover:border-[#FF0054] focus:border-[#FF0054]"
                    )}
                    style={{
                        fontFamily: block.content.style?.fontFamily || globalStyle?.font,
                        fontWeight: block.content.style?.fontWeight || globalStyle?.weight,
                        letterSpacing: block.content.style?.letterSpacing || (globalStyle?.spacing ? `${globalStyle.spacing}em` : undefined),
                        lineHeight: block.content.style?.lineHeight || globalStyle?.height,
                        fontSize: block.content.style?.fontSize || (globalStyle?.size ? `${globalStyle.size}px` : undefined),
                        color: block.content.style?.color || globalStyle?.color,
                        textTransform: block.content.style?.textTransform || (globalStyle?.casing === 'none' ? undefined : globalStyle?.casing) as any,
                        ...block.content.style
                    }}
                />
            </ResizableWrapper>
        </div>
    )
}


export function BlockRenderer({ block, isReadOnly, onUpdate, onAddBlock, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy }: BlockProps) {
    // A font picked for a text or a list is fetched here too, not only where it was picked: a new tab (the
    // client page, «Visualizar», the PDF) otherwise shows the fallback font
    useGoogleFont(block?.content?.style?.fontFamily)
    useGoogleFont(block?.content?.list?.fontFamily)
    useGoogleFont(block?.content?.list?.descFontFamily)
    const design = useBrandDesign()
    if (!block) return null

    const commonProps = { block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove }
    const textProps = { ...commonProps, onDuplicate, onCopy }
    // Blocks without a bar of their own get the brandbook context bar (the block-level delete lives there)
    const chrome = (label: string, node: React.ReactNode) => (
        <BlockChrome label={label} blockId={block.id} isReadOnly={isReadOnly} activeBlockId={activeBlockId} onSelect={onSelect} onMove={onMove} onDelete={onDelete}>
            {node}
        </BlockChrome>
    )
    const innerProps = { ...commonProps, onDelete: undefined }

    switch (block.type as string) {
        case 'layout':
            // Need onAddBlock for this to work fully
            return <LayoutBlock {...commonProps} onAddBlock={onAddBlock || (() => { })} />

        case 'headline':
        case 'heading': // Add alias for safety
            return <HeadlineBlock {...textProps} />

        case 'text':
            if (['h1', 'h2', 'h3'].includes(block.variant || '')) {
                return <HeadlineBlock {...textProps} />
            }
            return <TextBlock {...textProps} />

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
        case 'code': // Using ListBlock for snippet for now or simple text?
            return (
                <AnimatedBlock animation={block.content?.animation} settings={block.content?.animationSettings} isEnabled={!!isReadOnly}>
                    <ListBlock {...commonProps} onDuplicate={onDuplicate} onCopy={onCopy} ownAnimationPanel bodyStyle={design.getStyleById('body')} uploadImage={uploadListMarker} />
                </AnimatedBlock>
            )

        case 'composite':
            return <CompositeBlock {...commonProps} />

        case 'separator':
        case 'divider':
            {
                // Space around the line (its «margem»): the brandbook applies it around every block, here it is done for the line
                const m = block.content?.style?.margin || {}
                const px = (v: unknown) => v === undefined || v === "" ? undefined : `${Number(v) || 0}px`
                return (
                    <AnimatedBlock animation={block.content?.animation} settings={block.content?.animationSettings} isEnabled={!!isReadOnly}>
                        <div className="w-full" style={{ marginTop: px(m.top), marginBottom: px(m.bottom), paddingLeft: px(m.left), paddingRight: px(m.right) }}>
                            <SeparatorBlock {...commonProps} onDuplicate={onDuplicate} onCopy={onCopy} ownAnimationPanel />
                        </div>
                    </AnimatedBlock>
                )
            }

        case 'spacer':
            return <div style={{ height: block.content?.style?.height || '48px' }} className="w-full" />

        case 'button':
            return <ButtonBlock {...commonProps} />

        case 'palette':
            return chrome("Paleta", <PaletteBlock {...innerProps} />)

        case 'pricing-table':
            return chrome("Tabela de preços", <PricingTableBlock {...innerProps} />)

        case 'scope-list':
            return chrome("Lista de escopo", <ScopeListBlock {...innerProps} />)

        case 'timeline':
            return chrome("Linha do tempo", <TimelineBlock {...innerProps} />)

        default:
            return <TextBlock {...textProps} />
    }
}
