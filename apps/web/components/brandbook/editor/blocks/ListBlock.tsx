"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { Check, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { TextToolbar } from "../TextToolbar"
import { useBrandDesign } from "../BrandDesignContext"
import { detectAlign, detectColor, detectFontSize, detectFormats, detectWeight, detectLineHeight } from "./BlockUtils"
import { DraggableBlockWrapper } from "./DraggableBlockWrapper"

interface ListBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onAnimate?: () => void
    align?: 'left' | 'center' | 'right'
    isFreeFlow?: boolean
}

export const ListBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate, isFreeFlow }: ListBlockProps) => {
    const { getStyleById } = useBrandDesign()
    const globalStyle = getStyleById('body')
    const [isFocused, setIsFocused] = React.useState(false)

    const items = block.content.items || [] // [{ text: string, type?: 'do'|'dont' }]
    const variant = block.variant // 'do-dont' or 'list'

    const handleAddItem = (type: 'do' | 'dont' | 'default' = 'default') => {
        const newItem = { text: "", type: variant === 'do-dont' ? type : 'default' }
        onUpdate(block.id, { ...block.content, items: [...items, newItem] })
    }

    const handleUpdateItem = (index: number, val: string) => {
        const newItems = [...items]
        newItems[index].text = val
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index)
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const toolbar = !isReadOnly && (
        <div className={cn(
            "opacity-0 transition-opacity absolute bottom-full left-0 z-50 w-full pb-2 overflow-visible",
            (!activeBlockId || activeBlockId === block.id) && "group-hover/block:opacity-100",
            (activeBlockId === block.id && isFocused) && "opacity-100",
            "has-[[data-state=open]]:opacity-100"
        )}>
            <TextToolbar
                onDelete={onDelete ? () => onDelete(block.id) : undefined}
                onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                onCopy={onCopy ? () => onCopy(block.id) : undefined}
                onOrderChange={onMove ? (dir) => onMove(block.id, dir) : undefined}
                currentFont={block.content.style?.fontFamily || globalStyle?.font}
                onFontChange={(font) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, fontFamily: font }
                })}
                onFormat={(type) => {
                    const style = { ...block.content.style }
                    if (type === 'italic') style.fontStyle = style.fontStyle === 'italic' ? 'normal' : 'italic'
                    if (type === 'underline') style.textDecoration = style.textDecoration?.includes('underline') ? style.textDecoration.replace('underline', '').trim() : `${style.textDecoration || ''} underline`.trim()
                    if (type === 'strikethrough') style.textDecoration = style.textDecoration?.includes('line-through') ? style.textDecoration.replace('line-through', '').trim() : `${style.textDecoration || ''} line-through`.trim()
                    onUpdate(block.id, { ...block.content, style })
                }}
                activeFormats={detectFormats(block.content.style)}
                currentWeight={detectWeight(block.content.style, globalStyle?.weight)}
                onWeightChange={(weight) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, fontWeight: weight }
                })}
                currentFontSize={detectFontSize(block.content.style)}
                onFontSizeChange={(size) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, fontSize: size }
                })}
                color={detectColor(block.content.style)}
                onColorChange={(color) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, color }
                })}
                activeAlign={detectAlign(block.content.style)}
                onAlign={(a) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, textAlign: a }
                })}
                currentLineHeight={detectLineHeight(block.content.style, globalStyle?.height)}
                onLineHeightChange={(h) => onUpdate(block.id, {
                    ...block.content,
                    style: { ...block.content.style, lineHeight: h }
                })}
                onAnimate={onAnimate}
            />
        </div>
    )

    const contentStyle = {
        fontFamily: globalStyle?.font,
        fontWeight: globalStyle?.weight,
        fontSize: globalStyle?.size ? `${globalStyle.size}px` : undefined,
        lineHeight: globalStyle?.height,
        color: globalStyle?.color,
        ...block.content.style
    }

    const content = (
        <div className="w-full">
            {variant === 'do-dont' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={contentStyle}>
                    {/* Do's Column */}
                    <div className="bg-green-50/50 p-6 rounded-lg border border-green-100">
                        <h3 className="text-green-700 font-bold mb-4 flex items-center gap-2">
                            <span className="bg-green-100 p-1 rounded"><Check className="w-4 h-4" /></span> DO
                        </h3>
                        <div className="space-y-3">
                            {items.filter((i: any) => i.type === 'do').map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <Input
                                        value={item.text}
                                        onFocus={() => { onSelect?.(block.id); setIsFocused(true) }}
                                        onBlur={() => setIsFocused(false)}
                                        onChange={(e) => {
                                            const realIndex = items.indexOf(item)
                                            handleUpdateItem(realIndex, e.target.value)
                                        }}
                                        className="bg-transparent border-transparent hover:border-green-200 focus:bg-white h-auto py-0 px-2"
                                        placeholder="Add a DO item..."
                                        readOnly={isReadOnly}
                                    />
                                </div>
                            ))}
                            {!isReadOnly && (
                                <Button variant="ghost" size="sm" onClick={() => handleAddItem('do')} className="text-green-600 hover:text-green-700 hover:bg-green-100">
                                    <Plus className="w-3 h-3 mr-1" /> Add DO
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Don'ts Column */}
                    <div className="bg-red-50/50 p-6 rounded-lg border border-red-100">
                        <h3 className="text-red-700 font-bold mb-4 flex items-center gap-2">
                            <span className="bg-red-100 p-1 rounded"><X className="w-4 h-4" /></span> DON'T
                        </h3>
                        <div className="space-y-3">
                            {items.filter((i: any) => i.type === 'dont').map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <Input
                                        value={item.text}
                                        onFocus={() => { onSelect?.(block.id); setIsFocused(true) }}
                                        onBlur={() => setIsFocused(false)}
                                        onChange={(e) => {
                                            const realIndex = items.indexOf(item)
                                            handleUpdateItem(realIndex, e.target.value)
                                        }}
                                        className="bg-transparent border-transparent hover:border-red-200 focus:bg-white h-auto py-0 px-2"
                                        placeholder="Add a DON'T item..."
                                        readOnly={isReadOnly}
                                    />
                                </div>
                            ))}
                            {!isReadOnly && (
                                <Button variant="ghost" size="sm" onClick={() => handleAddItem('dont')} className="text-red-600 hover:text-red-700 hover:bg-red-100">
                                    <Plus className="w-3 h-3 mr-1" /> Add DON'T
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="pl-4">
                    <ul className="space-y-2" style={contentStyle}>
                        {items.map((item: any, i: number) => (
                            <li key={i} className="flex items-start gap-2 group">
                                <span className="mt-2.5 w-1.5 h-1.5 bg-pink-500 rounded-full shrink-0" />
                                <div className="flex-1">
                                    <Input
                                        value={item.text}
                                        onFocus={() => { onSelect?.(block.id); setIsFocused(true) }}
                                        onBlur={() => setIsFocused(false)}
                                        onChange={(e) => handleUpdateItem(i, e.target.value)}
                                        className="bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto text-inherit font-inherit"
                                        placeholder="List item..."
                                        readOnly={isReadOnly}
                                    />
                                </div>
                                {!isReadOnly && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500" onClick={() => handleRemoveItem(i)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                    {!isReadOnly && (
                        <Button variant="ghost" size="sm" onClick={() => handleAddItem('default')} className="mt-2 text-gray-400 hover:text-pink-500">
                            <Plus className="w-3 h-3 mr-2" /> Add Item
                        </Button>
                    )}
                </div>
            )}
        </div>
    )

    return (
        <div
            className={cn(
                "mb-4 group/block relative w-full",
                activeBlockId === block.id && "z-50"
            )}
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            {toolbar}
            {content}
        </div>
    )
}
