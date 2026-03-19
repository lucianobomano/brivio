"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Trash2, X, Undo2 } from 'lucide-react'
import { useEditorHistory } from './EditorHistoryContext'

export function EditorToast() {
    const { toastData, dismissToast, undo, canUndo } = useEditorHistory()

    if (!toastData) return null

    const handleUndo = () => {
        if (canUndo) {
            undo()
        }
        dismissToast()
    }

    return (
        <div
            className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-200",
                toastData.visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 pointer-events-none"
            )}
        >
            <div className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1F] border border-[#333] rounded-xl shadow-2xl backdrop-blur-sm">
                {/* Icon */}
                <div className="shrink-0">
                    <Trash2 className="w-4 h-4 text-[#FF6B6B]" />
                </div>

                {/* Message */}
                <div className="flex-1">
                    <p className="text-sm text-white">{toastData.message}</p>
                    <p className="text-xs text-[#888] mt-0.5">
                        Pressione{' '}
                        <kbd className="px-1.5 py-0.5 bg-[#333] rounded text-[#aaa] font-mono text-[10px]">
                            {toastData.shortcut}
                        </kbd>
                        {' '}para desfazer
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {canUndo && (
                        <button
                            onClick={handleUndo}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#333] hover:bg-[#444] rounded-lg text-sm text-white transition-colors"
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                            Desfazer
                        </button>
                    )}
                    <button
                        onClick={dismissToast}
                        className="p-1 hover:bg-[#333] rounded-md transition-colors"
                    >
                        <X className="w-4 h-4 text-[#666] hover:text-white" />
                    </button>
                </div>
            </div>
        </div>
    )
}
