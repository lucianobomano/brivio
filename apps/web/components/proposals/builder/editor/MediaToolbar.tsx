import React from "react"
import { ArrowUp, ArrowDown, Paperclip, Link, MousePointer2, Settings, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaToolbarProps {
    onMoveUp?: () => void
    onMoveDown?: () => void
    onUpload?: () => void
    onLink?: () => void
    onSelect?: () => void
    onSettings?: () => void
    onDelete?: () => void
    className?: string
}

export const MediaToolbar = ({
    onMoveUp,
    onMoveDown,
    onUpload,
    onLink,
    onSelect,
    onSettings,
    onDelete,
    className
}: MediaToolbarProps) => {
    return (
        <div className={cn(
            "absolute -top-14 left-1/2 -translate-x-1/2 flex items-center bg-[#15161B] rounded-[4px] h-[36px] shadow-lg",
            "after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-[#15161B]",
            className
        )}>
            {/* Move Group */}
            <div className="flex items-center px-1 border-r border-[#333]">
                <button
                    onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Move Up"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Move Down"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            </div>

            {/* Actions Group */}
            <div className="flex items-center px-1 gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onUpload?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Change Media"
                >
                    <Paperclip className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onLink?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Link"
                >
                    <Link className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Select"
                >
                    <MousePointer2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onSettings?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
