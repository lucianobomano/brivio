"use client"

import React from "react"
import { Block } from "../types"
// import { TextBlock } from "./BlockRenderer" // Circular?
// We'll reimplement or pass components. 
// For simplicity, CompositeBlock will just manage its own layout and use basic inputs/images.
// Or we can import MediaBlock and use it.

import { MediaBlock } from "./MediaBlock"
// import { Textarea } from "@/components/ui/textarea"
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
import { TextToolbar } from "../TextToolbar"

interface CompositeBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onDelete?: (id: string) => void
    onSelect?: (id: string | null) => void // Propagated from parents if available
    onMove?: (id: string, direction: 'up' | 'down') => void
}

export const CompositeBlock = ({ block, isReadOnly, onUpdate, onDelete, onSelect, onMove }: CompositeBlockProps) => {
    // Content structure: { image: { url, ... }, text: "...", reverse: boolean }
    const { image, text } = block.content || {}

    // Check if text content is empty to conditionally allow deletion via the media placeholder


    // Helper to update sub-fields
    const updateContent = (field: string, value: any) => {
        onUpdate(block.id, { ...block.content, [field]: value })
    }

    // Dummy block wrapper for MediaBlock re-use
    const mediaBlockWrapper: Block = {
        id: block.id + '_media',
        type: 'image',
        content: image || {},
        variant: 'default'
    }

    const handleMediaUpdate = (_: string, newMediaContent: any) => {
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
                className="w-full relative group/text"
                onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
            >
                {/* Toolbar on Hover */}
                {!isReadOnly && (
                    <div className="opacity-0 group-hover/text:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity absolute bottom-full left-0 z-10 w-full pb-2.5">
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
                            currentFont={block.content?.style?.fontFamily || 'Inter'}
                            onFontChange={(font) => {
                                updateContent('style', { ...block.content?.style, fontFamily: font })
                            }}
                            currentLineHeight={block.content?.style?.lineHeight || '1.5'}
                            onLineHeightChange={(height) => {
                                updateContent('style', { ...block.content?.style, lineHeight: height })
                            }}
                            activeFormats={detectFormats(block.content?.style)}
                            onFormat={(type) => {
                                const style = { ...block.content?.style }
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
                                updateContent('style', style)
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
                            color={detectColor(block.content?.style)}
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
                            currentFontSize={detectFontSize(block.content?.style)}
                            onFontSizeChange={(size) => {
                                updateContent('style', { ...block.content?.style, fontSize: size })
                            }}
                        />
                    </div>
                )}

                <AutoResizeTextarea
                    value={text !== undefined && text !== null ? text : "Este é apenas um espaço em branco à espera da sua voz criativa. Substitua este texto quando a ideia certa aparecer."}
                    onChange={(e: any) => updateContent('text', e.target.value)}
                    onFocus={() => onSelect?.(block.id)}
                    readOnly={isReadOnly}
                    // Using exact same styling as TextBlock
                    className="w-full min-h-0 bg-transparent border border-transparent rounded-none shadow-none hover:border-[#FF0054] focus:border-[#FF0054] focus:ring-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 resize-none leading-relaxed transition-colors"
                    style={{
                        fontSize: block.content?.style?.fontSize,
                        ...block.content?.style
                    }}
                />
            </div>
        </div>
    )
}
