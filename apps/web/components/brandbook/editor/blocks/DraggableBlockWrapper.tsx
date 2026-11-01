"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"
import { useFreeFlow } from "./FreeFlowContext"

interface DraggableBlockWrapperProps {
    block: Block
    children: React.ReactNode
    isReadOnly?: boolean
    onUpdate: (id: string, updates: Partial<Block>) => void
    isFreeFlow?: boolean
    onSelect?: () => void
    activeBlockId?: string | null
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
}

/** Arrow keys nudge the block (or the selection) by 1px, 10px with Shift */
const NUDGE: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

/**
 * Free movement of a block inside its column. As in most editors (Notion, Framer, Webflow), the block is moved
 * by a handle of its own, outside its left edge: the block itself stays free to click, select and edit.
 * Dragging, guides, axis lock, selection and alignment come from the column's FreeFlowScope.
 */
export const DraggableBlockWrapper = ({
    block,
    children,
    isReadOnly,
    isFreeFlow,
    onSelect,
    activeBlockId,
}: DraggableBlockWrapperProps) => {
    const flow = useFreeFlow()

    if (!isFreeFlow) {
        // No wrapper needed when free flow is off
        return <>{children}</>
    }

    const editable = !isReadOnly && !!flow
    const isDragging = !!flow?.dragging?.ids.includes(block.id)
    const isSelected = !!flow?.isSelected(block.id)
    const x = (block.position?.x ?? 0) + (isDragging ? flow!.dragging!.dx : 0)
    const y = (block.position?.y ?? 0) + (isDragging ? flow!.dragging!.dy : 0)

    return (
        <div
            data-free-block={block.id}
            className={cn(
                "relative z-10 w-full group/free-block",
                isDragging && "z-[100] select-none",
                // Selected with others (and not the block being edited, which shows its own box)
                editable && isSelected && block.id !== activeBlockId && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-2"
            )}
            style={{ transform: x || y ? `translate(${x}px, ${y}px)` : undefined }}
        >
            {editable && (
                <button
                    type="button"
                    data-free-handle
                    aria-label="Mover bloco"
                    aria-pressed={isSelected}
                    title={'Arraste para mover · Shift: num só eixo · Alt: sem guias\nClique: selecionar · Shift/Ctrl + clique: juntar à seleção\nSetas: 1px · Shift + setas: 10px'}
                    onPointerDown={(e) => {
                        if (e.button !== 0) return
                        // The column underneath must not start its own drag
                        e.stopPropagation()
                        e.preventDefault()
                        if (!isSelected) onSelect?.()
                        flow!.startDrag(block.id, e)
                    }}
                    onKeyDown={(e) => {
                        const step = NUDGE[e.key]
                        if (!step) return
                        e.preventDefault()
                        e.stopPropagation()
                        const d = e.shiftKey ? 10 : 1
                        flow!.nudge(block.id, step[0] * d, step[1] * d)
                    }}
                    className={cn(
                        // Outside the left edge, level with the first line
                        "absolute -left-8 top-0 z-30 w-6 h-7 flex items-center justify-center rounded-md border shadow-sm",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0054]/40",
                        "transition-[opacity,background-color,color] duration-150 touch-none",
                        // Invisible margin that also bridges the gap to the block, so the handle doesn't vanish on the way
                        "before:absolute before:-inset-y-1.5 before:-left-1.5 before:-right-3 before:content-['']",
                        isDragging || isSelected
                            ? "opacity-100 bg-[#FF0054] text-white border-[#FF0054]"
                            : "opacity-0 group-hover/free-block:opacity-100 focus-visible:opacity-100 bg-white text-[#FF0054] border-[#FF0054]/30 hover:bg-[#FF0054] hover:text-white hover:border-[#FF0054]",
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    )}
                >
                    <GripVertical className="w-4 h-4" />
                </button>
            )}
            {children}
        </div>
    )
}
