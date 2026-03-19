"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Block } from "../types"
import { cn } from "@/lib/utils"

interface DraggableBlockWrapperProps {
    block: Block
    children: React.ReactNode
    isReadOnly?: boolean
    onUpdate: (id: string, updates: Partial<Block>) => void
    isFreeFlow?: boolean
    onSelect?: () => void
}

export const DraggableBlockWrapper = ({
    block,
    children,
    isReadOnly,
    onUpdate,
    isFreeFlow,
    onSelect
}: DraggableBlockWrapperProps) => {
    const [isDragging, setIsDragging] = useState(false)

    if (!isFreeFlow) {
        // No wrapper needed - just return children directly
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
                "absolute z-10 transition-all",
                !isReadOnly && (isDragging ? "cursor-grabbing" : "cursor-grab hover:ring-1 hover:ring-[#FF0054]/30"),
                isDragging && "z-[100] opacity-90 shadow-2xl scale-[1.02]"
            )}
            style={{ touchAction: 'none' }}
        >
            {children}
        </motion.div>
    )
}
