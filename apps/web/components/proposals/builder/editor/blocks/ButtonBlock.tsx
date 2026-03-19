
import React, { useState } from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
// import { TextToolbar } from "../TextToolbar" // Replaced by ButtonSettingsPanel
import { ButtonSettingsPanel } from "./ButtonSettingsPanel"
import {
    detectFontSize
} from "./BlockUtils"

interface BlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
}

export const ButtonBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove }: BlockProps) => {
    const [isHovered, setIsHovered] = useState(false)

    // Merge styles logic
    const baseStyle = block.content.style || {}
    const hoverSettings = block.content.hover || {}

    // Determine active style based on hover state
    const currentStyle = {
        ...baseStyle,
        backgroundColor: (hoverSettings.enabled && isHovered && hoverSettings.backgroundColor) ? hoverSettings.backgroundColor : (baseStyle.backgroundColor || '#FF0054'),
        color: (hoverSettings.enabled && isHovered && hoverSettings.color) ? hoverSettings.color : (baseStyle.color || '#ffffff'),
        borderColor: (hoverSettings.enabled && isHovered && hoverSettings.borderColor) ? hoverSettings.borderColor : (baseStyle.borderColor || 'transparent'),
        // Ensure format
        borderWidth: baseStyle.borderWidth || '0px',
        borderStyle: baseStyle.borderWidth ? 'solid' : 'none',
        transition: 'all 0.2s ease-in-out'
    }

    const isSelected = activeBlockId === block.id

    return (
        <div className="mb-4 w-full flex"
            style={{ justifyContent: block.content.style?.textAlign || 'flex-start' }}
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            <div className="relative group/button-wrapper">
                {/* Settings Panel - Replaces TextToolbar */}
                {!isReadOnly && isSelected && (
                    <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <ButtonSettingsPanel
                            settings={block.content}
                            onUpdate={(updates) => onUpdate(block.id, { ...block.content, ...updates })}
                            onClose={() => onSelect?.(null)}
                            onDelete={() => onDelete?.(block.id)}
                        />
                    </div>
                )}

                <div
                    className={cn(
                        "flex items-center justify-center transition-all duration-200",
                        isReadOnly ? "cursor-pointer" : "cursor-text",
                        // Default hover effect if not overridden by custom hover settings
                        (!hoverSettings.enabled) && "hover:opacity-90 active:scale-95"
                    )}
                    style={{
                        ...currentStyle,
                        // Dimensions override from style object, need to ensure units
                        width: baseStyle.width || '150px',
                        height: baseStyle.height || '40px',
                        borderRadius: baseStyle.borderRadius || '9999px',
                        // Force flex center for text
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <input
                        type="text"
                        value={block.content.text || ""}
                        readOnly={isReadOnly}
                        onChange={(e) => onUpdate(block.id, { ...block.content, text: e.target.value })}
                        onFocus={() => onSelect?.(block.id)}
                        placeholder="Button"
                        className={cn(
                            "bg-transparent border-none shadow-none outline-none p-0 m-0 text-center w-full h-full cursor-inherit",
                            "focus:ring-0 focus:outline-none focus:border-none",
                            // Inherit text color from parent currentStyle
                            "text-inherit"
                        )}
                        style={{
                            fontSize: baseStyle.fontSize || '16px',
                            fontWeight: baseStyle.fontWeight || '500',
                            textAlign: 'center',
                            color: 'inherit'
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
