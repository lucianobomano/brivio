"use client"

import React, { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { useDebounce } from "@/lib/utils" // Ensure this exists or use a local hook
import { updateModuleContent } from "@/app/actions/brandbook"

interface TextModuleProps {
    moduleId: string
    content: {
        text?: string
    }
    isReadOnly?: boolean
}

export function TextModule({ moduleId, content, isReadOnly }: TextModuleProps) {
    const [text, setText] = useState(content?.text || "")
    const [isSaving, setIsSaving] = useState(false)

    // Simple debounce implementation if utils doesn't have one, 
    // but assuming we'll implement a save trigger on blur or debounce

    const handleBlur = async () => {
        if (text === content?.text) return

        setIsSaving(true)
        await updateModuleContent(moduleId, { text })
        setIsSaving(false)
    }

    return (
        <div className="space-y-4">
            {isReadOnly ? (
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-text-secondary">
                    {text || "No content yet."}
                </div>
            ) : (
                <div className="relative">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onBlur={handleBlur}
                        placeholder="Start writing your brand story here..."
                        className="min-h-[150px] bg-bg-2 border-none focus:ring-1 focus:ring-accent-indigo resize-none text-lg leading-relaxed p-6"
                    />
                    {isSaving && (
                        <span className="absolute bottom-4 right-4 text-xs text-text-secondary animate-pulse">
                            Saving...
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
