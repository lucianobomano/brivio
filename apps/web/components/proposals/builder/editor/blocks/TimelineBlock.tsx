"use client"

import React from "react"
import { Plus, Trash2 } from "lucide-react"
import { AutoResizeTextarea } from "./BlockUtils"

interface TimelineBlockProps {
    block: any
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onDelete?: (id: string) => void
}

export const TimelineBlock = ({ block, isReadOnly, onUpdate, onDelete }: TimelineBlockProps) => {
    const items = block.content.items || [
        { title: "Início", date: "Semana 1", description: "Kickoff e planejamento" },
        { title: "Meio", date: "Semana 4", description: "Design e Desenvolvimento" },
        { title: "Fim", date: "Semana 8", description: "Entrega e Ajustes" }
    ]

    const handleUpdateItem = (index: number, field: string, value: string) => {
        const newItems = [...items]
        newItems[index][field] = value
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleAddItem = () => {
        const newItems = [...items, { title: "Novo Marco", date: "Data", description: "Breve descrição" }]
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_: any, i: number) => i !== index)
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    return (
        <div className="mb-12 group/block relative w-full pt-12">
            <div className="relative flex justify-between items-start gap-8 overflow-x-auto pb-8 custom-scrollbar scroll-px-8 px-8">
                {/* Connecting Line - More technical look */}
                <div className="absolute top-[51px] left-0 right-0 h-[1px] bg-white/10 z-0 mx-20" />

                {items.map((item: any, index: number) => (
                    <div key={index} className="relative z-10 flex flex-col items-center min-w-[220px] group/item px-4">
                        {/* Dot - Elevated */}
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md group-hover/item:border-black transition-all">
                            <div className="w-2 h-2 rounded-full bg-inherit group-hover/item:bg-white animate-pulse" />
                        </div>

                        {/* Content */}
                        <div className="text-center space-y-3 w-full">
                            <input
                                type="text"
                                value={item.date}
                                readOnly={isReadOnly}
                                onChange={(e) => handleUpdateItem(index, 'date', e.target.value)}
                                className="w-full text-[11px] font-black uppercase tracking-[0.2em] text-inherit opacity-50 bg-transparent text-center border-none p-0 focus:ring-0"
                                placeholder="PHASE"
                            />
                            <input
                                type="text"
                                value={item.title}
                                readOnly={isReadOnly}
                                onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                                className="w-full text-[18px] font-bold text-inherit bg-transparent text-center border-none p-0 focus:ring-0 leading-tight"
                                placeholder="Milestone"
                            />
                            <AutoResizeTextarea
                                value={item.description}
                                readOnly={isReadOnly}
                                onChange={(e: any) => handleUpdateItem(index, 'description', e.target.value)}
                                className="w-full text-sm text-inherit opacity-60 bg-transparent text-center border-none p-0 focus:ring-0 leading-relaxed font-light"
                                placeholder="Details..."
                            />
                        </div>

                        {!isReadOnly && (
                            <button
                                onClick={() => handleRemoveItem(index)}
                                className="absolute -top-12 opacity-0 group-hover/item:opacity-100 text-red-500 transition-opacity p-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}

                {!isReadOnly && (
                    <button
                        onClick={handleAddItem}
                        className="flex-shrink-0 w-10 h-10 mt-[32px] rounded-full border border-white/20 flex items-center justify-center text-inherit opacity-40 hover:opacity-100 hover:border-white transition-all ml-4"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {!isReadOnly && onDelete && (
                <button
                    onClick={() => onDelete(block.id)}
                    className="absolute -right-8 top-0 opacity-0 group-hover/block:opacity-100 p-2 text-inherit opacity-40 hover:text-red-500 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
