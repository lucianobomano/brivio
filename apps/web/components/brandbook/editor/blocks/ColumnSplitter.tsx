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

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const handleElement = e.currentTarget as HTMLElement
        try {
            handleElement.setPointerCapture(e.pointerId)
        } catch {}

        setIsDragging(true)
        onResizeStart(index)

        const startX = e.clientX
        const prevUserSelect = document.body.style.userSelect
        const prevCursor = document.body.style.cursor
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'

        let rafId: number | null = null
        let latestDelta = 0

        const handlePointerMove = (moveEvent: PointerEvent) => {
            latestDelta = moveEvent.clientX - startX
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    rafId = null
                    onResize(index, latestDelta)
                })
            }
        }

        const handlePointerUp = (upEvent: PointerEvent) => {
            try {
                handleElement.releasePointerCapture(upEvent.pointerId)
            } catch {}

            if (rafId !== null) {
                cancelAnimationFrame(rafId)
                rafId = null
            }

            setIsDragging(false)
            onResize(index, latestDelta)
            onResizeEnd()

            document.body.style.userSelect = prevUserSelect
            document.body.style.cursor = prevCursor

            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
            window.removeEventListener('pointercancel', handlePointerUp)
        }

        window.addEventListener('pointermove', handlePointerMove, { passive: true })
        window.addEventListener('pointerup', handlePointerUp)
        window.addEventListener('pointercancel', handlePointerUp)
    }, [index, onResize, onResizeEnd, onResizeStart])

    return (
        <div
            className="absolute top-0 bottom-0 w-[24px] -ml-[12px] z-30 flex items-center justify-center cursor-col-resize group select-none pointer-events-auto"
            style={{ left: 'calc(100% + 1rem)' }} // Centered in gap-8 (2rem)
            onPointerDown={handlePointerDown}
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
