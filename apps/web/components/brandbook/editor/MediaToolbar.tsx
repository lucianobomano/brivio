import React from "react"
import { ArrowUp, ArrowDown, Paperclip, Link, MousePointer2, Settings, Trash2, Zap, RotateCcw, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaToolbarProps {
    onMoveUp?: () => void
    onMoveDown?: () => void
    onUpload?: () => void
    onLink?: () => void
    onSelect?: () => void
    onSettings?: () => void
    onDelete: () => void // Changed to required
    onDuplicate?: () => void
    onCopy?: () => void
    onAnimate?: () => void
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
    onDuplicate,
    onCopy,
    onAnimate,
    className
}: MediaToolbarProps) => {
    return (
        <div className={cn(
            "flex items-center bg-[#15161B] rounded-[4px] h-[36px] shadow-lg border border-[#333] relative",
            className
        )}>
            {/* Pointer triangle/arrow at bottom center */}
            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#15161B]" />
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
                    onClick={(e) => { e.stopPropagation(); onAnimate?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-[#FF0054] transition-colors"
                    title="Animar bloco"
                >
                    <Zap className="w-4 h-4 fill-transparent hover:fill-[#FF0054]" />
                </button>
                {/* Duplicate */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-blue-400 transition-colors"
                    title="Duplicate"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
                {/* Copy */}
                <button
                    onClick={(e) => { e.stopPropagation(); onCopy?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-blue-400 transition-colors"
                    title="Copy"
                >
                    <Copy className="w-4 h-4" />
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
