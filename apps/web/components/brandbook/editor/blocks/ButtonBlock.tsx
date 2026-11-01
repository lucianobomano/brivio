
import React, { useState } from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
// import { TextToolbar } from "../TextToolbar" // Replaced by ButtonSettingsPanel
import { ButtonSettingsPanel } from "./ButtonSettingsPanel"
import { getButtonAnimationClass } from "./buttonPresets"
import { FloatingPanel } from "../FloatingPanel"
import { BUTTON_ICONS, ButtonIconSettings } from "./buttonIcons"
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
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onAnimate?: () => void
    align?: 'left' | 'center' | 'right'
}

export const ButtonBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate, align }: BlockProps) => {
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
    // Ready-made animation chosen in the Animações tab (CSS classes in globals.css)
    const animationClass = getButtonAnimationClass(block.content.buttonAnimation)
    // Optional icon (left / right / icon only), drawn in the button text color unless it has its own
    const iconSettings = block.content.icon as ButtonIconSettings | undefined
    const Icon = iconSettings?.name ? BUTTON_ICONS[iconSettings.name] : undefined
    const iconPosition = iconSettings?.position || 'right'
    const iconOnly = !!Icon && iconPosition === 'only'
    const renderIcon = () => Icon && (
        <Icon
            aria-hidden
            className={cn(
                "shrink-0 transition-transform duration-200",
                iconSettings?.hoverShift && (iconPosition === 'left' ? "group-hover/btn:-translate-x-1" : iconPosition === 'right' ? "group-hover/btn:translate-x-1" : "group-hover/btn:scale-110")
            )}
            style={{ width: iconSettings?.size || 18, height: iconSettings?.size || 18, color: iconSettings?.color || 'currentColor' }}
            strokeWidth={2}
        />
    )
    const labelStyle: React.CSSProperties = {
        fontSize: baseStyle.fontSize || '16px',
        fontWeight: baseStyle.fontWeight || '500',
        textAlign: 'center',
        color: 'inherit',
    }

    // The button follows the column alignment unless it was placed explicitly in its own panel (buttonAlign).
    // textAlign used to hold that choice too, and new buttons were created with 'center' (meant for the label),
    // so only the panel-only values 'flex-start' / 'flex-end' still count as an explicit choice
    const legacyAlign = block.content.style?.textAlign
    const explicitAlign: string | undefined = block.content.style?.buttonAlign
        ?? (legacyAlign === 'flex-start' || legacyAlign === 'flex-end' ? legacyAlign : undefined)
    const effectiveJustify = explicitAlign
        ? explicitAlign
        : (align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start')

    const hasCustomBottomMargin = baseStyle.margin?.bottom !== undefined && baseStyle.margin?.bottom !== ''

    return (
        // No default bottom margin: the column's "Espaçamento" sets the space between items
        <div className={cn("w-full flex")}
            style={{ justifyContent: effectiveJustify }}
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            <div className="relative group/button-wrapper">
                {/* Settings Panel - Replaces TextToolbar */}
                {!isReadOnly && isSelected && (
                    <FloatingPanel placement="right-center">
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <ButtonSettingsPanel
                            settings={block.content}
                            onUpdate={(updates) => onUpdate(block.id, { ...block.content, ...updates })}
                            onClose={() => onSelect?.(null)}
                            onDelete={() => onDelete?.(block.id)}
                            onDuplicate={() => onDuplicate?.(block.id)}
                            onCopy={() => onCopy?.(block.id)}
                            onAnimate={onAnimate}
                        />
                    </div>
                    </FloatingPanel>
                )}

                <div
                    className={cn(
                        "flex items-center justify-center gap-2 transition-all duration-200 group/btn",
                        isReadOnly ? "cursor-pointer" : "cursor-text",
                        // Default hover effect if not overridden by custom hover settings or a ready-made animation
                        (!hoverSettings.enabled && !animationClass) && "hover:opacity-90 active:scale-95",
                        animationClass
                    )}
                    style={{
                        ...currentStyle,
                        ...(animationClass ? { '--ba-s': block.content.buttonAnimationSpeed ?? 1 } as React.CSSProperties : {}),
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
                    {iconPosition === 'left' && renderIcon()}
                    {iconOnly ? (
                        <>
                            {renderIcon()}
                            <span className="sr-only">{block.content.text}</span>
                        </>
                    ) : isReadOnly && Icon ? (
                        // Published: the label is plain text, exactly as wide as its words, next to the icon
                        <span className="whitespace-nowrap" style={labelStyle}>{block.content.text}</span>
                    ) : (
                    <input
                        type="text"
                        value={block.content.text || ""}
                        readOnly={isReadOnly}
                        onChange={(e) => onUpdate(block.id, { ...block.content, text: e.target.value })}
                        onFocus={() => onSelect?.(block.id)}
                        placeholder="Button"
                        className={cn(
                            "bg-transparent border-none shadow-none outline-none p-0 m-0 text-center h-full cursor-inherit",
                            // With an icon the label hugs its text so both sit together in the middle
                            Icon ? "min-w-[2ch] max-w-full" : "w-full",
                            "focus:ring-0 focus:outline-none focus:border-none",
                            // Inherit text color from parent currentStyle
                            "text-inherit"
                        )}
                        style={{ ...labelStyle, ...(Icon ? { fieldSizing: 'content' } as React.CSSProperties : {}) }}
                    />
                    )}
                    {iconPosition === 'right' && renderIcon()}
                </div>
            </div>
        </div>
    )
}
