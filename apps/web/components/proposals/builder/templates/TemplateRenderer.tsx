"use client"

import React, { useState } from "react"
import { BlockRenderer } from "../editor/blocks/BlockRenderer"
import { Block } from "../editor/types"

interface TemplateRendererProps {
    blocks: Block[]
    onUpdateBlocks: (blocks: Block[]) => void
    isReadOnly?: boolean
}

export function TemplateRenderer({ blocks, onUpdateBlocks, isReadOnly = false }: TemplateRendererProps) {
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

    const handleUpdateBlock = (blockId: string, content: any) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content } : b)
        onUpdateBlocks(newBlocks)
    }

    const handleDeleteBlock = (blockId: string) => {
        const newBlocks = blocks.filter(b => b.id !== blockId)
        onUpdateBlocks(newBlocks)
        setSelectedBlockId(null)
    }

    return (
        <div className="flex flex-col w-full min-h-[500px] bg-white text-gray-900 p-12">
            <div className="max-w-[1080px] mx-auto w-full space-y-8">
                {blocks.map((block) => (
                    <div
                        key={block.id}
                        className="relative group/section"
                    >
                        <BlockRenderer
                            block={block}
                            isReadOnly={isReadOnly}
                            onUpdate={handleUpdateBlock}
                            onSelect={setSelectedBlockId}
                            activeBlockId={selectedBlockId}
                            onDelete={handleDeleteBlock}
                        />

                        {/* Visual indicator of section in edit mode */}
                        {!isReadOnly && (
                            <div className="absolute -inset-4 border border-transparent group-hover/section:border-dashed group-hover/section:border-pink-200 pointer-events-none rounded-xl transition-colors" />
                        )}
                    </div>
                ))}

                {blocks.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                        Nenhum bloco neste template.
                    </div>
                )}
            </div>
        </div>
    )
}
