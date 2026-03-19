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
import { TextToolbar } from "../TextToolbar"
import { useBrandDesign } from "../BrandDesignContext"
import { AnimatedBlock } from "../AnimatedBlock"
import { DraggableBlockWrapper } from "./DraggableBlockWrapper"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { DialogClose, DialogTitle } from "@radix-ui/react-dialog"
import { Clipboard } from "lucide-react"

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
    align?: 'left' | 'center' | 'right'
    isFreeFlow?: boolean
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
    detectBackgroundColor
} from "./BlockUtils"

const EditableTextBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate, align, type }: BlockProps & { type: 'heading' | 'body' }) => {
    const { getStyleById } = useBrandDesign()
    const [isFocused, setIsFocused] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

    // Determine global style
    const styleId = type === 'heading'
        ? ((block.variant === 'h2' || block.content?.text?.startsWith('##')) ? 'h2' : 'h1')
        : 'body'
    const globalStyle = getStyleById(styleId)
    const isHeading = type === 'heading'

    return (
        <div
            className={cn(
                "mb-4 group/block relative w-full overflow-visible hover:z-50",
                activeBlockId === block.id && "z-50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            {/* Toolbar using Portal to stay on screen */}
            {!isReadOnly && (
                <PopoverPrimitive.Root open={isHovered || isSettingsOpen || (activeBlockId === block.id && isFocused)} modal={false}>
                    <PopoverPrimitive.Anchor asChild>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0" />
                    </PopoverPrimitive.Anchor>
                    <PopoverPrimitive.Portal>
                        <PopoverPrimitive.Content
                            side="top"
                            align="center"
                            sideOffset={12}
                            collisionPadding={10}
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
                                    onAnimate={onAnimate}
                                    onSettingsOpenChange={setIsSettingsOpen}
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
            >
                {isReadOnly ? (
                    <div
                        className={cn(
                            "w-full max-w-full min-h-0 bg-transparent border border-transparent rounded-none shadow-none focus:ring-0 outline-none focus:outline-none transition-colors whitespace-pre-wrap break-words",
                            isHeading ? "placeholder:text-gray-400/50 leading-tight text-gray-900" : "text-gray-600 leading-relaxed",
                            block.content.style?.backgroundColor ? "p-4" : "p-0"
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
                            height: block.content.style?.height || 'auto',
                            minHeight: '0px'
                        }}
                    >
                        {block.content.text || ""}
                    </div>
                ) : (
                    <AutoResizeTextarea
                        value={block.content.text || ""}
                        readOnly={isReadOnly}
                        className="break-words max-w-full"
                        onChange={(e) => onUpdate(block.id, { ...block.content, text: e.target.value })}
                        onFocus={() => {
                            onSelect?.(block.id)
                            setIsFocused(true)
                        }}
                        onBlur={() => setIsFocused(false)}
                        placeholder={isHeading ? "Heading" : "Type something..."}
                        fixedHeight={block.content.style?.height}
                        className={cn(
                            "w-full min-h-0 bg-transparent border border-transparent rounded-none shadow-none focus:ring-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors",
                            isHeading ? "placeholder:text-gray-400/50 leading-tight text-gray-900" : "text-gray-600 leading-relaxed",
                            !isReadOnly && "hover:border-[#FF0054] focus:border-[#FF0054]",
                            block.content.style?.backgroundColor ? "p-4" : "p-0"
                        )}
                        style={{
                            fontFamily: globalStyle?.font,
                            fontWeight: globalStyle?.weight,
                            letterSpacing: globalStyle?.spacing ? `${globalStyle.spacing}em` : undefined,
                            lineHeight: globalStyle?.height,
                            fontSize: globalStyle?.size ? `${globalStyle.size}px` : undefined,
                            color: globalStyle?.color,
                            textTransform: (globalStyle?.casing === 'none' ? undefined : globalStyle?.casing) as React.CSSProperties['textTransform'],
                            ...block.content.style
                        }}
                    />
                )}
            </ResizableWrapper>
        </div>
    )
}

export function BlockRenderer({ block, isReadOnly, onUpdate, onAddBlock, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate, align, isFreeFlow }: BlockProps) {
    if (!block) return null

    const commonProps = { block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate, align, isFreeFlow }

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
            default:
                return <EditableTextBlock {...commonProps} type="body" />
        }
    }

    return (
        <AnimatedBlock
            animation={block.content?.animation}
            isEnabled={isReadOnly}
        >
            <DraggableBlockWrapper
                block={block}
                isReadOnly={isReadOnly}
                isFreeFlow={isFreeFlow}
                onUpdate={onUpdate}
                onSelect={() => onSelect?.(block.id)}
            >
                {renderBlock()}
            </DraggableBlockWrapper>
        </AnimatedBlock>
    )
}
