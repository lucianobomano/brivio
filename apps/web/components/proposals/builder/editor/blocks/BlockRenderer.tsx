"use client"

import React from "react"
import { Block } from "../types"

import { cn } from "@/lib/utils"

import { LayoutBlock } from "./LayoutBlock"
import { MediaBlock } from "./MediaBlock"
import { EmbedBlock } from "./EmbedBlock"
import { ListBlock } from "./ListBlock"
import { CompositeBlock } from "./CompositeBlock"
import { ButtonBlock } from "./ButtonBlock"
import { PaletteBlock } from "./PaletteBlock"
import { SeparatorBlock } from "./SeparatorBlock"
import { PricingTableBlock } from "./PricingTableBlock"
import { ScopeListBlock } from "./ScopeListBlock"
import { TimelineBlock } from "./TimelineBlock"
import { TextToolbar } from "../TextToolbar"
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
    onWidthChange,
    isFocused,
    isReadOnly,
    className
}: {
    children: React.ReactNode,
    width?: string | number,
    onWidthChange: (width: string) => void,
    isFocused: boolean,
    isReadOnly?: boolean,
    className?: string
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = React.useState<'left' | 'right' | null>(null);

    const handleMouseDown = (e: React.MouseEvent, side: 'left' | 'right') => {
        if (isReadOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(side);

        const startX = e.pageX;
        const startWidth = containerRef.current?.offsetWidth || 0;
        const maxWidth = containerRef.current?.parentElement?.offsetWidth || 1200;

        const handleMouseMove = (mmE: MouseEvent) => {
            const delta = mmE.pageX - startX;
            let newWidth = side === 'right' ? startWidth + delta : startWidth - delta;

            // Constraints
            newWidth = Math.max(200, Math.min(newWidth, maxWidth));
            onWidthChange(`${newWidth}px`);
        };

        const handleMouseUp = () => {
            setIsResizing(null);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            ref={containerRef}
            style={{ width: width || '100%', position: 'relative' }}
            className={cn("mx-auto transition-[width] duration-75", className)}
        >
            {children}
            {isFocused && !isReadOnly && (
                <>
                    {/* Right Handle */}
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        className={cn(
                            "absolute top-1/4 right-[-4px] w-[6px] h-1/2 cursor-ew-resize z-50 rounded-full transition-all group/handle",
                            isResizing === 'right' ? "bg-[#ff0054]" : "bg-transparent hover:bg-[#ff0054]/50"
                        )}
                    >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#ff0054] opacity-0 group-hover/handle:opacity-100 transition-opacity" />
                    </div>
                    {/* Left Handle */}
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'left')}
                        className={cn(
                            "absolute top-1/4 left-[-4px] w-[6px] h-1/2 cursor-ew-resize z-50 rounded-full transition-all group/handle",
                            isResizing === 'left' ? "bg-[#ff0054]" : "bg-transparent hover:bg-[#ff0054]/50"
                        )}
                    >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#ff0054] opacity-0 group-hover/handle:opacity-100 transition-opacity" />
                    </div>
                </>
            )}
        </div>
    );
}

const HeadlineBlock = ({ block, isReadOnly, onUpdate, onSelect, onDelete, onMove }: BlockProps) => {
    const { getStyleById } = useBrandDesign()
    const [isFocused, setIsFocused] = React.useState(false)
    // Determine which global style to use
    const styleId = (block.variant === 'h2' || block.content?.text?.startsWith('##')) ? 'h2' : 'h1'
    const globalStyle = getStyleById(styleId)

    return (
        <div className="mb-4 group/block relative w-full" onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}>
            {/* Toolbar on Hover or if Menu Open */}
            {!isReadOnly && (
                <div className="opacity-0 group-hover/block:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity">
                    <TextToolbar
                        onDelete={onDelete ? () => onDelete(block.id) : undefined}
                        activeTransform={detectTransform(block.content.text || "")}
                        onTransform={(type) => {
                            const text = block.content.text || ""
                            let newText = text
                            if (type === 'uppercase') newText = text.toUpperCase()
                            if (type === 'lowercase') newText = text.toLowerCase()
                            if (type === 'sentence') newText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
                            if (type === 'capitalize') newText = text.replace(/\b\w/g, (c: string) => c.toUpperCase())

                            onUpdate(block.id, { ...block.content, text: newText })
                        }}
                        currentFont={block.content.style?.fontFamily || globalStyle?.font || 'Inter'}
                        onFontChange={(font) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, fontFamily: font }
                            })
                        }}
                        currentLineHeight={block.content.style?.lineHeight || globalStyle?.height || '1.1'}
                        onLineHeightChange={(height) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, lineHeight: height }
                            })
                        }}
                        activeFormats={detectFormats(block.content.style)}
                        onFormat={(type) => {
                            const style = { ...block.content.style }
                            if (type === 'bold') {
                                style.fontWeight = style.fontWeight === 'bold' ? 'normal' : 'bold'
                            }
                            if (type === 'italic') {
                                style.fontStyle = style.fontStyle === 'italic' ? 'normal' : 'italic'
                            }
                            if (type === 'underline') {
                                let decoration = style.textDecoration || ''
                                if (decoration.includes('underline')) {
                                    decoration = decoration.replace('underline', '').trim()
                                } else {
                                    decoration = `${decoration} underline`.trim()
                                }
                                style.textDecoration = decoration
                            }
                            if (type === 'strikethrough') {
                                let decoration = style.textDecoration || ''
                                if (decoration.includes('line-through')) {
                                    decoration = decoration.replace('line-through', '').trim()
                                } else {
                                    decoration = `${decoration} line-through`.trim()
                                }
                                style.textDecoration = decoration
                            }
                            onUpdate(block.id, { ...block.content, style })
                        }}
                        activeListFormat={detectListFormat(block.content.style)}
                        onListFormat={(type) => {
                            const style = { ...block.content.style }
                            if (type) {
                                if (style.display === 'list-item' && style.listStyleType === type) {
                                    // Toggle off
                                    delete style.display
                                    delete style.listStyleType
                                    delete style.listStylePosition
                                    delete style.marginLeft
                                } else {
                                    // Enable
                                    style.display = 'list-item'
                                    style.listStyleType = type
                                    style.listStylePosition = 'inside'
                                    style.marginLeft = '1em'
                                }
                            }
                            onUpdate(block.id, { ...block.content, style })
                        }}
                        activeAlign={detectAlign(block.content.style)}
                        onAlign={(align) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, textAlign: align }
                            })
                        }}
                        color={detectColor(block.content.style)}
                        onColorChange={(color) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, color }
                            })
                        }}
                        heightSettings={detectHeight(block.content.style)}
                        onHeightSettingsChange={(step) => {
                            let val = 'auto'
                            if (step === 3) val = '40px'
                            if (step === 5) val = '80px'
                            if (step === 8) val = '160px'
                            if (step === 100) val = '400px'

                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, minHeight: val }
                            })
                        }}
                        onOrderChange={(dir) => {
                            if (onMove) {
                                onMove(block.id, dir);
                            } else {
                                // Fallback to Z-Index if no reordering provided (e.g. root level?)
                                const currentZ = parseInt(block.content.style?.zIndex || '0')
                                const newZ = dir === 'up' ? currentZ + 1 : currentZ - 1
                                onUpdate(block.id, {
                                    ...block.content,
                                    style: { ...block.content.style, zIndex: newZ }
                                })
                            }
                        }}
                        outline={detectOutline(block.content.style)}
                        onOutlineChange={(side) => {
                            const style = { ...block.content.style }
                            const key = side === 'top' ? 'borderTop' : side === 'right' ? 'borderRight' : side === 'bottom' ? 'borderBottom' : 'borderLeft'
                            if (style[key]) {
                                delete style[key]
                            } else {
                                style[key] = `2px solid currentColor`
                            }
                            onUpdate(block.id, { ...block.content, style })
                        }}
                        currentFontSize={detectFontSize(block.content.style)}
                        onFontSizeChange={(size) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, fontSize: size }
                            })
                        }}
                    />
                </div>
            )}
            <ResizableWrapper
                width={block.content.style?.width}
                onWidthChange={(newWidth) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, width: newWidth }
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

const TextBlock = ({ block, isReadOnly, onUpdate, onSelect, onDelete, onMove }: BlockProps) => {
    const { getStyleById } = useBrandDesign()
    const [isFocused, setIsFocused] = React.useState(false)
    const globalStyle = getStyleById('body')

    return (
        <div className="mb-4 w-full group/block relative" onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}>
            {/* Toolbar on Hover or if Menu Open */}
            {!isReadOnly && (
                <div className="opacity-0 group-hover/block:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity">
                    <TextToolbar
                        onDelete={onDelete ? () => onDelete(block.id) : undefined}
                        activeTransform={detectTransform(block.content.text || "")}
                        onTransform={(type) => {
                            const text = block.content.text || ""
                            let newText = text
                            if (type === 'uppercase') newText = text.toUpperCase()
                            if (type === 'lowercase') newText = text.toLowerCase()
                            if (type === 'sentence') newText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
                            if (type === 'capitalize') newText = text.replace(/\b\w/g, (c: string) => c.toUpperCase())

                            onUpdate(block.id, { ...block.content, text: newText })
                        }}
                        currentFont={block.content.style?.fontFamily || globalStyle?.font || 'Inter'}
                        onFontChange={(font) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, fontFamily: font }
                            })
                        }}
                        currentLineHeight={block.content.style?.lineHeight || globalStyle?.height || '1.5'}
                        onLineHeightChange={(height) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, lineHeight: height }
                            })
                        }}
                        activeFormats={detectFormats(block.content.style)}
                        onFormat={(type) => {
                            const style = { ...block.content.style }
                            if (type === 'bold') {
                                style.fontWeight = style.fontWeight === 'bold' ? 'normal' : 'bold'
                            }
                            if (type === 'italic') {
                                style.fontStyle = style.fontStyle === 'italic' ? 'normal' : 'italic'
                            }
                            if (type === 'underline') {
                                let decoration = style.textDecoration || ''
                                if (decoration.includes('underline')) {
                                    decoration = decoration.replace('underline', '').trim()
                                } else {
                                    decoration = `${decoration} underline`.trim()
                                }
                                style.textDecoration = decoration
                            }
                            if (type === 'strikethrough') {
                                let decoration = style.textDecoration || ''
                                if (decoration.includes('line-through')) {
                                    decoration = decoration.replace('line-through', '').trim()
                                } else {
                                    decoration = `${decoration} line-through`.trim()
                                }
                                style.textDecoration = decoration
                            }
                            onUpdate(block.id, { ...block.content, style })
                        }}
                        activeListFormat={detectListFormat(block.content.style)}
                        onListFormat={(type) => {
                            const style = { ...block.content.style }
                            if (type) {
                                if (style.display === 'list-item' && style.listStyleType === type) {
                                    // Toggle off
                                    delete style.display
                                    delete style.listStyleType
                                    delete style.listStylePosition
                                    delete style.marginLeft
                                } else {
                                    // Enable
                                    style.display = 'list-item'
                                    style.listStyleType = type
                                    style.listStylePosition = 'inside'
                                    style.marginLeft = '1em'
                                }
                            }
                            onUpdate(block.id, { ...block.content, style })
                        }}
                        activeAlign={detectAlign(block.content.style)}
                        onAlign={(align) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, textAlign: align }
                            })
                        }}
                        color={detectColor(block.content.style)}
                        onColorChange={(color) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, color }
                            })
                        }}
                        heightSettings={detectHeight(block.content.style)}
                        onHeightSettingsChange={(step) => {
                            let val = 'auto'
                            if (step === 3) val = '40px'
                            if (step === 5) val = '80px'
                            if (step === 8) val = '160px'
                            if (step === 100) val = '400px'

                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, minHeight: val }
                            })
                        }}
                        onOrderChange={(dir) => {
                            if (onMove) {
                                onMove(block.id, dir);
                            } else {
                                const currentZ = parseInt(block.content.style?.zIndex || '0')
                                const newZ = dir === 'up' ? currentZ + 1 : currentZ - 1
                                onUpdate(block.id, {
                                    ...block.content,
                                    style: { ...block.content.style, zIndex: newZ }
                                })
                            }
                        }}
                        outline={detectOutline(block.content.style)}
                        onOutlineChange={(side) => {
                            const style = { ...block.content.style }
                            const key = side === 'top' ? 'borderTop' : side === 'right' ? 'borderRight' : side === 'bottom' ? 'borderBottom' : 'borderLeft'
                            if (style[key]) {
                                delete style[key]
                            } else {
                                style[key] = `2px solid currentColor`
                            }
                            onUpdate(block.id, { ...block.content, style })
                        }}
                        currentFontSize={detectFontSize(block.content.style)}
                        onFontSizeChange={(size) => {
                            onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, fontSize: size }
                            })
                        }}
                    />
                </div>
            )}
            <ResizableWrapper
                width={block.content.style?.width}
                onWidthChange={(newWidth) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, width: newWidth }
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


export function BlockRenderer({ block, isReadOnly, onUpdate, onAddBlock, onSelect, activeBlockId, onDelete, onMove }: BlockProps) {
    if (!block) return null

    const commonProps = { block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove }

    switch (block.type as string) {
        case 'layout':
            // Need onAddBlock for this to work fully
            return <LayoutBlock {...commonProps} onAddBlock={onAddBlock || (() => { })} />

        case 'headline':
        case 'heading': // Add alias for safety
            return <HeadlineBlock {...commonProps} />

        case 'text':
            if (['h1', 'h2', 'h3'].includes(block.variant || '')) {
                return <HeadlineBlock {...commonProps} />
            }
            return <TextBlock {...commonProps} />

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
            return <ListBlock {...commonProps} />

        case 'composite':
            return <CompositeBlock {...commonProps} />

        case 'separator':
        case 'divider':
            return <SeparatorBlock {...commonProps} />

        case 'spacer':
            return <div style={{ height: block.content?.style?.height || '48px' }} className="w-full" />

        case 'button':
            return <ButtonBlock {...commonProps} />

        case 'palette':
            return <PaletteBlock {...commonProps} />

        case 'pricing-table':
            return <PricingTableBlock {...commonProps} />

        case 'scope-list':
            return <ScopeListBlock {...commonProps} />

        case 'timeline':
            return <TimelineBlock {...commonProps} />

        default:
            return <TextBlock {...commonProps} />
    }
}
