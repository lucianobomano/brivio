"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

interface SortableItemProps {
    id: string
    children: React.ReactNode
    isOverlay?: boolean
}

export function SortableItem({ id, children, isOverlay }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    // If overlay, render a clean snapshot without drag handles acting up
    if (isOverlay) {
        return (
            <div className="relative group bg-bg-1 rounded-xl border border-accent-indigo shadow-2xl scale-105 cursor-grabbing z-50">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-text-secondary">
                    <GripVertical className="w-5 h-5" />
                </div>
                <div className="pl-10">
                    {children}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group bg-bg-1 hover:bg-bg-1/80 rounded-xl border border-bg-3 border-transparent hover:border-bg-3 transition-colors mb-4"
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-bg-3 group-hover:text-text-secondary cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <GripVertical className="w-5 h-5" />
            </div>
            <div className="group-hover:pl-0 transition-all">
                {children}
            </div>
        </div>
    )
}
