import React from "react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyBlockActionsProps {
    onDelete?: () => void
    className?: string
}

export function EmptyBlockActions({ onDelete, className }: EmptyBlockActionsProps) {
    if (!onDelete) return null

    return (
        <div
            className={cn(
                "absolute -top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-0 transition-opacity duration-200",
                className
            )}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
            }}
        >
            {/* Tooltip Body */}
            <div className="bg-[#1F1F25] text-white p-2.5 rounded-lg shadow-xl cursor-pointer hover:bg-black transition-colors flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
            </div>

            {/* Arrow */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1F1F25] mt-[-1px]" />
        </div>
    )
}
