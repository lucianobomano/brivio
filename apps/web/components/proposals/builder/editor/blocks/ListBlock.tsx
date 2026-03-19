"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { Check, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ListBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
}

export const ListBlock = ({ block, isReadOnly, onUpdate }: ListBlockProps) => {
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

    if (variant === 'do-dont') {
        return (
            <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                        onChange={(e) => {
                                            // Find real index in main array
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
            </div>
        )
    }

    // Default List
    return (
        <div className="w-full pl-4">
            <ul className="space-y-2">
                {items.map((item: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 group">
                        <span className="mt-2 w-1.5 h-1.5 bg-pink-500 rounded-full shrink-0" />
                        <div className="flex-1">
                            <Input
                                value={item.text}
                                onChange={(e) => handleUpdateItem(i, e.target.value)}
                                className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base"
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
    )
}
