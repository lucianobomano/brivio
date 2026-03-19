import React from "react"
import { Paperclip, Link, MousePointerClick, Settings, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" 
// Using simple titles for now to avoid bulky jsx if tooltip not strictly requested, but user said "exactly like image". Image 1 has hover state implied? No tooltip visible.

interface AudioToolbarProps {
    onUpload: () => void
    onLink: () => void
    onSelect: () => void
    onSettings: () => void
    onDelete: () => void
    className?: string
}

export const AudioToolbar = ({ onUpload, onLink, onSelect, onSettings, onDelete, className }: AudioToolbarProps) => {
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
                <button onClick={(e) => { e.stopPropagation(); onUpload() }} className="p-1.5 text-[#97A1B3] hover:text-white transition-colors rounded-sm hover:bg-white/10">
                    <Paperclip className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onLink() }} className="p-1.5 text-[#97A1B3] hover:text-white transition-colors rounded-sm hover:bg-white/10">
                    <Link className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onSelect() }} className="p-1.5 text-[#97A1B3] hover:text-white transition-colors rounded-sm hover:bg-white/10">
                    <MousePointerClick className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onSettings() }} className="p-1.5 text-[#97A1B3] hover:text-white transition-colors rounded-sm hover:bg-white/10">
                    <Settings className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 text-[#97A1B3] hover:text-[#FF0054] transition-colors rounded-sm hover:bg-white/10">
                    <Trash className="w-4 h-4" />
                </button>
            </div>

            {/* Pointer triangle/arrow at bottom center */}
            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#15161B]" />
        </div>
    )
}
