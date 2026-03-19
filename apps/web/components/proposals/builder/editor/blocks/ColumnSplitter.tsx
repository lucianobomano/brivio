"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ChevronsLeftRight } from "lucide-react"

interface ColumnSplitterProps {
    index: number
    onResizeStart: (index: number) => void
    onResize: (index: number, delta: number) => void
    onResizeEnd: () => void
}

export const ColumnSplitter = ({ index, onResizeStart, onResize, onResizeEnd }: ColumnSplitterProps) => {
    const [isDragging, setIsDragging] = useState(false)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
        onResizeStart(index)

        const startX = e.clientX

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX
            // We pass the absolute delta, parent handles the rest? 
            // Better to pass delta from start or delta from last frame? 
            // usually delta from start is easier if parent tracks start widths.
            // Let's pass simple delta for now, but commonly we need accumulated delta.
            // Actually, for "drag to resize", we probably want the current delta since start.
            onResize(index, moveEvent.clientX - startX)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            onResizeEnd()
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'unset'
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'col-resize'
    }, [index, onResize, onResizeEnd, onResizeStart])

    return (
        <div
            className="absolute top-0 bottom-0 w-[24px] -ml-[12px] z-30 flex items-center justify-center cursor-col-resize group select-none pointer-events-auto"
            style={{ left: 'calc(100% + 1rem)' }} // Centered in gap-8 (2rem)
            onMouseDown={handleMouseDown}
        >
            {/* Dashed Line */}
            <div className={`h-full w-[1px] border-l border-dashed border-[#FF0054] transition-opacity ${isDragging ? 'opacity-100' : 'opacity-100 group-hover:opacity-100'}`} />

            {/* Handle */}
            <div className={`absolute w-[24px] h-[24px] bg-[#FF0054] rounded-full flex items-center justify-center shadow-md transition-transform ${isDragging ? 'scale-110' : 'scale-100 group-hover:scale-110'}`}>
                <ChevronsLeftRight className="w-3 h-3 text-white" />
            </div>
        </div>
    )
}
