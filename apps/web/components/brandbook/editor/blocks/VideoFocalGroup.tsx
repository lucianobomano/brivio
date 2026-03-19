import React from "react"
import { Paperclip, Link, MousePointer2, Settings, Trash2, Zap, RotateCcw, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoFocalGroupProps {
    onChange: () => void
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

export function VideoFocalGroup({
    onChange,
    onUpload,
    onLink,
    onSelect,
    onSettings,
    onDelete,
    onDuplicate,
    onCopy,
    onAnimate,
    className
}: VideoFocalGroupProps) {
    return (
        <div className={cn("flex flex-col items-center", className)}>
            {/* Toolbar Container */}
            <div className="flex items-center bg-[#15161B] border border-[#333] rounded-[6px] shadow-xl px-1 py-1 gap-1 h-[42px] relative z-50">
                {/* Change Button */}
                <button
                    onClick={onChange}
                    className="px-3 text-[14px] text-[#A1A1AA] hover:text-white font-medium transition-colors"
                >
                    Change
                </button>

                {/* Divider */}
                <div className="w-[1px] h-[20px] bg-[#333] mx-1" />

                {/* Icons Group */}
                <div className="flex items-center gap-1">
                    {/* Paperclip (Assets/Upload) */}
                    <button
                        onClick={onUpload}
                        className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Upload/Assets"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Link */}
                    <button
                        onClick={onLink}
                        className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Link"
                    >
                        <Link className="w-4 h-4" />
                    </button>

                    {/* Cursor/Select */}
                    <button
                        onClick={onSelect}
                        className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Select Block"
                    >
                        <div className="border border-current rounded-[2px] w-4 h-3 flex items-center justify-center relative">
                            <MousePointer2 className="w-2 h-2 absolute -bottom-1 -right-1 fill-current" />
                        </div>
                    </button>

                    {/* Settings */}
                    <button
                        onClick={onSettings}
                        className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* Animate */}
                    <button
                        onClick={onAnimate}
                        className="p-2 text-[#A1A1AA] hover:text-[#FF0054] hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Animar bloco"
                    >
                        <Zap className="w-4 h-4 fill-transparent hover:fill-[#FF0054]" />
                    </button>

                    {/* Duplicate */}
                    <button
                        onClick={onDuplicate}
                        className="p-2 text-[#A1A1AA] hover:text-blue-400 hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Duplicate"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Copy */}
                    <button
                        onClick={onCopy}
                        className="p-2 text-[#A1A1AA] hover:text-blue-400 hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Copy"
                    >
                        <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={onDelete}
                        className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-[4px] transition-all"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Triangle Caret */}
            <div className="w-3 h-3 bg-[#15161B] border-r border-b border-[#333] rotate-45 -mt-[6px] z-40 relative" />
        </div>
    )
}
