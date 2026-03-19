"use client"

import React, { useState, useEffect, useRef } from "react"
import { Paperclip, Link as LinkIcon, MousePointer2, Trash2, Settings, Download, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageToolbarProps {
    onUpload: () => void
    onAttach: () => void
    onLink: (url: string) => void
    onHoverImage: () => void
    onToggle2x: () => void
    onDelete: () => void
    onSettings: () => void
    activeSettings: {
        link?: string
        is2x?: boolean
        hasAttachment?: boolean
        hasHoverImage?: boolean
    }
}

export const ImageToolbar = ({
    onUpload,
    onAttach,
    onLink,
    onHoverImage,
    onToggle2x,
    onDelete,
    onSettings,
    activeSettings
}: ImageToolbarProps) => {
    const [isLinkOpen, setIsLinkOpen] = useState(false)
    const [linkInput, setLinkInput] = useState(activeSettings.link || "")
    const linkInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isLinkOpen && linkInputRef.current) {
            linkInputRef.current.focus()
        }
    }, [isLinkOpen])

    const handleLinkSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        onLink(linkInput)
        setIsLinkOpen(false)
    }

    return (
        <div
            className="flex items-center bg-[#111116] rounded-[4px] px-1 py-1 h-[32px] gap-[1px] shadow-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Change Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onUpload() }}
                className="px-3 h-full text-[13px] font-medium text-[#3b82f6] hover:text-[#60a5fa] border-r border-white/10 transition-colors"
                title="Change Image"
            >
                Change
            </button>

            {/* Attach */}
            <button
                onClick={(e) => { e.stopPropagation(); onAttach() }}
                className={cn(
                    "w-[28px] h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors relative",
                    activeSettings.hasAttachment && "text-[#FF0054]"
                )}
                title="Attach File"
            >
                <Paperclip className="w-4 h-4" />
                {activeSettings.hasAttachment && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF0054] rounded-full" />}
            </button>

            {/* Link */}
            <div className="relative">
                <button
                    onClick={(e) => { e.stopPropagation(); setIsLinkOpen(!isLinkOpen) }}
                    className={cn(
                        "w-[28px] h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors",
                        activeSettings.link && "text-[#FF0054]"
                    )}
                    title="Add Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>

                {/* Link Popup */}
                {isLinkOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#111116] border border-white/10 p-2 rounded-lg shadow-2xl flex items-center gap-2 z-[50]">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111116] border-t border-l border-white/10 rotate-45" />
                        <form onSubmit={handleLinkSubmit} className="relative z-10 flex items-center gap-2">
                            <input
                                ref={linkInputRef}
                                type="text"
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                placeholder="Paste URL..."
                                className="bg-black/50 border border-white/10 text-white text-xs px-2 py-1.5 rounded w-[200px] focus:outline-none focus:border-[#FF0054]"
                            />
                            <button type="submit" className="text-xs bg-[#FF0054] text-white px-2 py-1.5 rounded hover:bg-[#D90046]">
                                Save
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Hover Image */}
            <button
                onClick={(e) => { e.stopPropagation(); onHoverImage() }}
                className={cn(
                    "w-[28px] h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors relative",
                    activeSettings.hasHoverImage && "text-[#FF0054]"
                )}
                title="Set Hover Image"
            >
                <MousePointer2 className="w-4 h-4" />
                {activeSettings.hasHoverImage && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF0054] rounded-full" />}
            </button>

            {/* 2x Toggle */}
            <button
                onClick={(e) => { e.stopPropagation(); onToggle2x() }}
                className={cn(
                    "w-[28px] h-full flex items-center justify-center text-[11px] font-bold transition-colors",
                    activeSettings.is2x ? "text-white" : "text-gray-400 hover:text-white"
                )}
                title="Toggle 2x Size"
            >
                2x
            </button>

            {/* Delete */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="w-[28px] h-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                title="Delete"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* Settings */}
            <div className="w-[1px] h-[16px] bg-white/10 mx-0.5" />
            <button
                onClick={(e) => { e.stopPropagation(); onSettings() }}
                className="w-[28px] h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                title="Settings"
            >
                <Settings className="w-4 h-4" />
            </button>
        </div>
    )
}
