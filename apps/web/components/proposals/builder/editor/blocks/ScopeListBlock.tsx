"use client"

import React from "react"
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AutoResizeTextarea } from "./BlockUtils"

interface ScopeListBlockProps {
    block: any
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onDelete?: (id: string) => void
}

export const ScopeListBlock = ({ block, isReadOnly, onUpdate, onDelete }: ScopeListBlockProps) => {
    const items = block.content.items || [{ text: "Item de escopo", checked: true }]

    const handleUpdateItem = (index: number, text: string) => {
        const newItems = [...items]
        newItems[index].text = text
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleToggleItem = (index: number) => {
        if (isReadOnly) return
        const newItems = [...items]
        newItems[index].checked = !newItems[index].checked
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleAddItem = () => {
        const newItems = [...items, { text: "", checked: true }]
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_: any, i: number) => i !== index)
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    return (
        <div className="mb-10 group/block relative w-full">
            <div className="space-y-4 max-w-4xl mx-auto">
                {items.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 group/item border-b border-white/5 pb-4 last:border-0">
                        <button
                            onClick={() => handleToggleItem(index)}
                            className={cn(
                                "mt-0.5 transition-all duration-300",
                                item.checked ? "text-inherit scale-110" : "text-inherit opacity-20 hover:opacity-50"
                            )}
                        >
                            {item.checked ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 underline" />}
                        </button>
                        <div className="flex-1">
                            <AutoResizeTextarea
                                value={item.text}
                                readOnly={isReadOnly}
                                onChange={(e: any) => handleUpdateItem(index, e.target.value)}
                                placeholder="Descreva a entrega..."
                                className={cn(
                                    "w-full bg-transparent border-none p-0 text-inherit font-medium focus:ring-0 leading-snug text-lg",
                                    !item.checked && "opacity-30 line-through"
                                )}
                            />
                        </div>
                        {!isReadOnly && items.length > 1 && (
                            <button
                                onClick={() => handleRemoveItem(index)}
                                className="opacity-0 group-hover/item:opacity-100 text-red-500 transition-opacity p-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}

                {!isReadOnly && (
                    <button
                        onClick={handleAddItem}
                        className="flex items-center gap-3 text-inherit opacity-40 text-[11px] font-black uppercase tracking-[0.3em] mt-8 hover:opacity-100 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        NOVO ENTREGÁVEL
                    </button>
                )}
            </div>

            {!isReadOnly && onDelete && (
                <button
                    onClick={() => onDelete(block.id)}
                    className="absolute -right-8 top-0 opacity-0 group-hover/block:opacity-100 p-2 text-inherit opacity-30 hover:text-red-500 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
