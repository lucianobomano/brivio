"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"

interface DraggableBlockWrapperProps {
    block: Block
    children: React.ReactNode
    isReadOnly?: boolean
    onUpdate: (id: string, updates: Partial<Block>) => void
    isFreeFlow?: boolean
    onSelect?: () => void
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
}

export const DraggableBlockWrapper = ({
    block,
    children,
    isReadOnly,
    onUpdate,
    isFreeFlow,
    onSelect,
}: DraggableBlockWrapperProps) => {
    const [isDragging, setIsDragging] = useState(false)

    if (!isFreeFlow) {
        // No wrapper needed when free flow is off
        return <>{children}</>
    }

    return (
        <motion.div
            drag={!isReadOnly}
            dragMomentum={false}
            dragElastic={0}
            initial={false}
            animate={{
                x: block.position?.x ?? 0,
                y: block.position?.y ?? 0,
            }}
            onPointerDown={(e) => {
                // Prevent drag from propagating to parent column when interacting with or dragging this block
                e.stopPropagation()
            }}
            onDragStart={() => {
                setIsDragging(true)
                onSelect?.()
            }}
            onDragEnd={(_, info) => {
                setIsDragging(false)
                const newX = (block.position?.x ?? 0) + info.offset.x
                const newY = (block.position?.y ?? 0) + info.offset.y
                onUpdate(block.id, { position: { x: newX, y: newY } })
            }}
            className={cn(
                "relative z-10 w-full group/free-block",
                !isReadOnly && (isDragging ? "cursor-grabbing" : "cursor-grab hover:ring-1 hover:ring-[#FF0054]/40"),
                isDragging && "z-[100] opacity-90 shadow-2xl scale-[1.01]"
            )}
            style={{ touchAction: 'none' }}
        >
            {/* Visual indicator badge when hovered in free-flow mode */}
            {!isReadOnly && (
                <div
                    className="absolute -top-3 left-2 z-30 opacity-0 group-hover/free-block:opacity-100 transition-opacity flex items-center gap-1 bg-[#FF0054] text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm select-none pointer-events-none"
                >
                    <GripVertical className="w-3 h-3" />
                    <span>Mover bloco</span>
                </div>
            )}
            {children}
        </motion.div>
    )
}

