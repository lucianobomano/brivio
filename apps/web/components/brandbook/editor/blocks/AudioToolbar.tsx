import React from "react"
import { Paperclip, Link, MousePointerClick, Settings, Trash, Zap, RotateCcw, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioToolbarProps {
    onUpload: () => void
    onLink: () => void
    onSelect: () => void
    onSettings: () => void
    onDelete: () => void
    onDuplicate?: () => void
    onCopy?: () => void
    onAnimate?: () => void
    className?: string
}

export const AudioToolbar = ({
    onUpload,
    onLink,
    onSelect,
    onSettings,
    onDelete,
    onDuplicate,
    onCopy,
    onAnimate,
    className
}: AudioToolbarProps) => {
    return (
        <div className={cn(
            "flex items-center bg-[#15161B] rounded-[4px] px-3 h-[40px] gap-3 shadow-lg border border-[#333]",
            className
        )}>
            {/* Change Label */}
            <span className="text-[#97A1B3] text-sm font-medium pr-1">
                Change
            </span>

            {/* Divider */}
            <div className="w-[1px] h-[16px] bg-[#333]" />

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); onUpload() }} className="p-1.5 text-[#97A1B3] hover:text-white transition-colors rounded-sm hover:bg-white/10" title="Upload">
                    <Paperclip className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onLink() }} className="p-1.5 text-[#97A1B3] hover:text-white transition-colors rounded-sm hover:bg-white/10" title="Link">
                    <Link className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onSelect() }} className="p-1.5 text-[#97A1B3] hover:text-white transition-colors rounded-sm hover:bg-white/10" title="Select">
                    <MousePointerClick className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAnimate?.() }} className="p-1.5 text-[#97A1B3] hover:text-[#FF0054] transition-colors rounded-sm hover:bg-white/10" title="Animar bloco">
                    <Zap className="w-4 h-4 fill-transparent hover:fill-[#FF0054]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDuplicate?.() }} className="p-1.5 text-[#97A1B3] hover:text-blue-400 transition-colors rounded-sm hover:bg-white/10" title="Duplicate">
                    <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onCopy?.() }} className="p-1.5 text-[#97A1B3] hover:text-blue-400 transition-colors rounded-sm hover:bg-white/10" title="Copy">
                    <Copy className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 text-[#97A1B3] hover:text-[#FF0054] transition-colors rounded-sm hover:bg-white/10" title="Delete">
                    <Trash className="w-4 h-4" />
                </button>
            </div>

            {/* Pointer triangle/arrow at bottom center */}
            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#15161B]" />
        </div>
    )
}
