"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Block } from "../types"
import { useBrandDesign } from "../BrandDesignContext"

import { MediaBlock } from "./MediaBlock"
// import { Textarea } from "@/components/ui/textarea"
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
    detectWeight
} from "./BlockUtils"
import { TextToolbar } from "../TextToolbar"

interface CompositeBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: Block['content']) => void
    onDelete?: (id: string) => void
    onSelect?: (id: string | null) => void // Propagated from parents if available
    onMove?: (id: string, direction: 'up' | 'down') => void
    activeBlockId?: string | null
    align?: 'left' | 'center' | 'right'
}

export const CompositeBlock = ({ block, isReadOnly, onUpdate, onDelete, onSelect, onMove, align, activeBlockId }: CompositeBlockProps) => {
    const { getStyleById } = useBrandDesign()
    const globalStyle = getStyleById('body') // Fallback to body for composite text

    // Content structure: { image: { url, ... }, text: "...", reverse: boolean }
    const { image, text } = block.content || {}

    // Check if text content is empty to conditionally allow deletion via the media placeholder


    const [isFocused, setIsFocused] = React.useState(false)

    // Helper to update sub-fields
    const updateContent = (field: string, value: Block['content']) => {
        onUpdate(block.id, { ...block.content, [field]: value })
    }

    // Dummy block wrapper for MediaBlock re-use
    const mediaBlockWrapper: Block = {
        id: block.id + '_media',
        type: 'image',
        content: image || {},
        variant: 'default'
    }

    const handleMediaUpdate = (_: string, newMediaContent: Block['content']) => {
        updateContent('image', newMediaContent)
    }

    return (
        <div className="flex flex-col gap-4 group/composite w-full">
            {/* Media Side */}
            <div className="w-full">
                <MediaBlock
                    block={mediaBlockWrapper}
                    isReadOnly={isReadOnly}
                    onUpdate={handleMediaUpdate}
                    // Pass onDelete only if the rest of the block is empty.
                    // This ensures the "Empty Block" delete action only appears when the WHOLE composite block is empty.
                    onDelete={onDelete ? () => onDelete(block.id) : undefined}
                    // Allow hover on the entire composite block (text side too) to trigger the delete button visibility
                    deleteButtonClassName="group-hover/media:opacity-100"
                    onSelect={() => onSelect?.(block.id)}
                />
            </div>

            {/* Text Side - Wrapped in group/text for Toolbar Hover */}
            <div
                className={cn("w-full relative group/text", activeBlockId === block.id && "z-50")}
                onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
            >
                {/* Toolbar on Hover or if Focused/Selected */}
                {!isReadOnly && (
                    <div className={cn(
                        "opacity-0 transition-opacity absolute bottom-full left-0 z-[100] w-full pb-2.5 overflow-visible",
                        // Only show on hover if no other block is being edited or if it's this block
                        (!activeBlockId || activeBlockId === block.id) && "group-hover/text:opacity-100 hover:opacity-100",
                        // Keep visible while focused
                        (activeBlockId === block.id && isFocused) && "opacity-100",
                        "has-[[data-state=open]]:opacity-100"
                    )}>
                        <TextToolbar
                            onDelete={onDelete ? () => onDelete(block.id) : undefined}
                            activeTransform={detectTransform(text || "")}
                            onTransform={(type) => {
                                const currentText = text || ""
                                let newText = currentText
                                if (type === 'uppercase') newText = currentText.toUpperCase()
                                if (type === 'lowercase') newText = currentText.toLowerCase()
                                if (type === 'sentence') newText = currentText.charAt(0).toUpperCase() + currentText.slice(1).toLowerCase()
                                if (type === 'capitalize') newText = currentText.replace(/\b\w/g, (c: string) => c.toUpperCase())

                                updateContent('text', newText)
                            }}
                            currentFont={block.content?.style?.fontFamily || globalStyle?.font || 'Inter'}
                            onFontChange={(font) => {
                                updateContent('style', { ...block.content?.style, fontFamily: font })
                            }}
                            currentLineHeight={block.content?.style?.lineHeight || globalStyle?.height || '1.5'}
                            onLineHeightChange={(height) => {
                                updateContent('style', { ...block.content?.style, lineHeight: height })
                            }}
                            activeFormats={detectFormats(block.content?.style)}
                            onFormat={(type) => {
                                const style = { ...block.content?.style }
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
                                updateContent('style', style)
                            }}
                            currentWeight={detectWeight(block.content?.style, globalStyle?.weight)}
                            onWeightChange={(weight) => {
                                updateContent('style', { ...block.content?.style, fontWeight: weight })
                            }}
                            activeListFormat={detectListFormat(block.content?.style)}
                            onListFormat={(type) => {
                                const style = { ...block.content?.style }
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
                                updateContent('style', style)
                            }}
                            activeAlign={detectAlign(block.content?.style)}
                            onAlign={(align) => {
                                updateContent('style', { ...block.content?.style, textAlign: align })
                            }}
                            color={detectColor(block.content?.style) || globalStyle?.color}
                            onColorChange={(color) => {
                                updateContent('style', { ...block.content?.style, color })
                            }}
                            heightSettings={detectHeight(block.content?.style)}
                            onHeightSettingsChange={(step) => {
                                let val = 'auto'
                                if (step === 3) val = '40px'
                                if (step === 5) val = '80px'
                                if (step === 8) val = '160px'
                                if (step === 100) val = '400px'

                                updateContent('style', { ...block.content?.style, minHeight: val })
                            }}
                            onOrderChange={(dir) => {
                                if (onMove) {
                                    onMove(block.id, dir)
                                } else {
                                    const currentZ = parseInt(block.content?.style?.zIndex || '0')
                                    const newZ = dir === 'up' ? currentZ + 1 : currentZ - 1
                                    updateContent('style', { ...block.content?.style, zIndex: newZ })
                                }
                            }}
                            outline={detectOutline(block.content?.style)}
                            onOutlineChange={(side) => {
                                const style = { ...block.content?.style }
                                const key = side === 'top' ? 'borderTop' : side === 'right' ? 'borderRight' : side === 'bottom' ? 'borderBottom' : 'borderLeft'
                                if (style[key]) {
                                    delete style[key]
                                } else {
                                    style[key] = `2px solid currentColor`
                                }
                                updateContent('style', style)
                            }}
                            currentFontSize={detectFontSize(block.content?.style) || (globalStyle?.size ? `${globalStyle.size}px` : '16px')}
                            onFontSizeChange={(size) => {
                                updateContent('style', { ...block.content?.style, fontSize: size })
                            }}
                        />
                    </div>
                )}

                <ResizableWrapper
                    width={block.content?.style?.width}
                    height={block.content?.style?.height}
                    onWidthChange={(newWidth) => updateContent('style', { ...block.content?.style, width: newWidth })}
                    onHeightChange={(newHeight) => updateContent('style', { ...block.content?.style, height: newHeight })}
                    isFocused={isFocused || activeBlockId === block.id}
                    isReadOnly={isReadOnly}
                    align={align}
                    className="w-full"
                >
                    <AutoResizeTextarea
                        value={text !== undefined && text !== null ? text : "Este é apenas um espaço em branco à espera da sua voz criativa. Substitua este texto quando a ideia certa aparecer."}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateContent('text', e.target.value)}
                        onFocus={() => {
                            onSelect?.(block.id)
                            setIsFocused(true)
                        }}
                        onBlur={() => setIsFocused(false)}
                        readOnly={isReadOnly}
                        fixedHeight={block.content?.style?.height}
                        // Using exact same styling as TextBlock
                        className="w-full max-w-full break-words min-h-0 bg-transparent border border-transparent rounded-none shadow-none hover:border-[#FF0054] focus:border-[#FF0054] focus:ring-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 resize-none leading-relaxed transition-colors"
                        style={{
                            fontFamily: globalStyle?.font,
                            fontWeight: globalStyle?.weight,
                            letterSpacing: globalStyle?.spacing ? `${globalStyle.spacing}em` : undefined,
                            lineHeight: globalStyle?.height,
                            fontSize: globalStyle?.size ? `${globalStyle.size}px` : undefined,
                            color: globalStyle?.color,
                            textTransform: (globalStyle?.casing === 'none' ? undefined : globalStyle?.casing) as any,
                            ...block.content?.style
                        }}
                    />
                </ResizableWrapper>
            </div>
        </div>
    )
}
