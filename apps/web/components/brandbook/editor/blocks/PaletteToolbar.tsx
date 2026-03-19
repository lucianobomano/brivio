import React from "react"
import { Plus, Copy, Trash2, ArrowUp, ArrowDown, Settings, Zap, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaletteToolbarProps {
    onAddColor: () => void
    onDelete?: () => void
    onDuplicate?: () => void
    onCopy?: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    onSettings?: (e: React.MouseEvent) => void
    onAnimate?: () => void
    className?: string
}

export const PaletteToolbar = ({
    onAddColor,
    onDelete,
    onDuplicate,
    onCopy,
    onMoveUp,
    onMoveDown,
    onSettings,
    onAnimate,
    className
}: PaletteToolbarProps) => {
    return (
        <div className={cn(
            "flex items-center bg-[#15161B] rounded-[4px] h-[36px] shadow-lg",
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
            <div className="flex items-center px-2 gap-1.5">
                <button
                    onClick={(e) => { e.stopPropagation(); onAddColor() }}
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2B32] rounded text-[#888] hover:text-white transition-colors"
                    title="Add Color"
                >
                    <Plus className="w-4 h-4 text-[#FF0054]" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">Adicionar cor</span>
                </button>

                <div className="w-[1px] h-[16px] bg-[#333] mx-1" />

                <button
                    onClick={(e) => { e.stopPropagation(); onSettings?.(e) }}
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

                <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-blue-400 transition-colors"
                    title="Duplicate Block"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onCopy?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-blue-400 transition-colors"
                    title="Copy Block"
                >
                    <Copy className="w-4 h-4" />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.() }}
                    className="p-1.5 hover:bg-[#2A2B32] rounded text-[#888] hover:text-[#FF0054] transition-colors"
                    title="Delete Block"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
