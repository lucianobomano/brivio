import React, { useState, useRef, useEffect } from "react"
import { Block } from "../types"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
// import { Input } from "@/components/ui/input" 
import { hexToRgb, rgbToCmyk, getSimulatedPantone } from "./ColorUtils"
import { ColorSettingsPanel } from "./ColorSettingsPanel"

interface BlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
}

interface ColorSettings {
    showPantone?: boolean
    showCmyk?: boolean
    showRgb?: boolean
    hover?: { enabled: boolean }
}

interface ColorData {
    id: string
    name: string
    value: string
    settings?: ColorSettings
}

const ColorCard = ({
    color,
    isReadOnly,
    onUpdate,
    onDelete,
    settings: globalSettings, // Rename to distinguish from local
    onClick,
    cardHeight,
    onResizeStart
}: {
    color: ColorData,
    isReadOnly?: boolean,
    onUpdate: (updates: Partial<ColorData>) => void,
    onDelete: () => void,
    settings?: any,
    onClick?: () => void,
    cardHeight: number,
    onResizeStart?: (e: React.MouseEvent) => void
}) => {
    const rgb = hexToRgb(color.value) || { r: 0, g: 0, b: 0 }
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    const pantone = getSimulatedPantone(color.value)

    // Merge global settings with local color settings
    // Priority: Local > Global > Default
    const effectiveSettings = {
        ...globalSettings,
        ...color.settings,
        hover: { ...globalSettings?.hover, ...color.settings?.hover }
    }

    const hoverEnabled = effectiveSettings?.hover?.enabled !== false
    const showPantone = effectiveSettings?.showPantone !== false
    const showCmyk = effectiveSettings?.showCmyk !== false
    const showRgb = effectiveSettings?.showRgb !== false

    return (
        <div
            className={cn(
                "w-full bg-white border border-gray-200 relative group/card flex flex-col transition-all duration-300",
                hoverEnabled && "hover:border-[0.5px] hover:border-[#FF0054]"
            )}
            style={{ height: `${cardHeight}px` }}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            {/* Delete Tooltip */}
            {!isReadOnly && (
                <div
                    className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-50 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                    <div className="relative bg-[#1A1A1A] text-white p-2 rounded-md shadow-lg flex items-center justify-center">
                        <Trash2 className="w-5 h-5" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1A1A1A]"></div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="h-[40px] bg-white px-4 flex items-center shrink-0 border-b border-gray-100 z-10 relative">
                <input
                    type="text"
                    value={color.name}
                    readOnly={isReadOnly}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="w-full h-full bg-transparent border-none outline-none text-gray-800 font-medium placeholder:text-gray-400 text-sm"
                    placeholder="Nome da cor"
                />
            </div>

            {/* Color Group */}
            <div className="relative w-full flex-1 min-h-0 overflow-hidden">
                <div
                    className="w-full h-full cursor-pointer shadow-none"
                    style={{ backgroundColor: color.value }}
                />

                {/* Info Overlay */}
                {hoverEnabled && (
                    <div
                        className="absolute inset-x-0 bottom-0 bg-white translate-y-[101%] group-hover/card:translate-y-0 transition-transform duration-500 ease-out z-10 p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-100 flex flex-col justify-center h-auto"
                        style={{
                            backgroundColor: globalSettings?.styles?.overlayBg || '#ffffff', // Visual styles might remain global or be local too? User said "settings ... options show pantone/cmyk/rgb". Let's keep visual styles global for consistency unless specified. User said "configurações das cores e dos card color precisam ser individuais". This might include styles. Let's start with the toggles.
                            color: globalSettings?.styles?.textColor || '#000000'
                        }}
                    >
                        <div className="space-y-3 text-sm font-mono" style={{ color: globalSettings?.styles?.textColor || 'inherit' }}>
                            {showRgb && (
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold opacity-70">RGB:</span>
                                    <span>{rgb.r} {rgb.g} {rgb.b}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="font-semibold opacity-70">HEX:</span>
                                <span className="uppercase">{color.value}</span>
                            </div>
                            {showCmyk && (
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold opacity-70">CMYK:</span>
                                    <span>{cmyk.c} {cmyk.m} {cmyk.y} {cmyk.k}</span>
                                </div>
                            )}
                            {showPantone && (
                                <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-100/20">
                                    <span className="font-semibold opacity-70">Pantone:</span>
                                    <span>{pantone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Handle */}
            {hoverEnabled && !isReadOnly && (
                <div
                    className="h-[0.5px] w-full bg-[#FF0054] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 absolute bottom-0 left-0 z-30 cursor-ns-resize flex items-center justify-center"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onResizeStart?.(e);
                    }}
                >
                    <div className="w-[20px] h-[20px] rounded-full bg-[#FF0054] shadow-sm" />
                </div>
            )}
        </div>
    )
}

export const PaletteBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId }: BlockProps) => {
    // Content structure: { colors: [ ... ], settings: { ... } }
    const colors: ColorData[] = block.content.colors || []
    const globalSettings = block.content.settings || {
        hover: { enabled: true },
        showPantone: true,
        showCmyk: true,
        showRgb: true
    }
    const cardHeight = block.content.styles?.cardHeight || 400

    const [activeColorId, setActiveColorId] = useState<string | null>(null)

    // Resizing State
    const [isResizing, setIsResizing] = useState(false)
    const startYRef = useRef(0)
    const startHeightRef = useRef(0)

    // Clear active color if block is deselected
    React.useEffect(() => {
        if (activeBlockId !== block.id) {
            setActiveColorId(null)
        }
    }, [activeBlockId, block.id])

    // Resize Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            const deltaY = e.clientY - startYRef.current
            const newHeight = Math.max(200, startHeightRef.current + deltaY) // Min height 200px

            // Debounce or just update live? Live is better for UX.
            // onUpdate is expensive? Depends. Local state for smoothness then sync?
            // Let's try updating directly first. If laggy, use local state + onUpdate on mouseUp.
            onUpdate(block.id, {
                ...block.content,
                styles: { ...block.content.styles, cardHeight: newHeight }
            })
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'ns-resize'
        } else {
            document.body.style.cursor = 'default'
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'default'
        }
    }, [isResizing, block.id, block.content, onUpdate])

    const handleResizeStart = (e: React.MouseEvent) => {
        setIsResizing(true)
        startYRef.current = e.clientY
        startHeightRef.current = cardHeight
    }

    const handleAddColor = () => {
        const newColor: ColorData = {
            id: Math.random().toString(36).substr(2, 9),
            name: "Nome da cor",
            value: "#D9D9D9",
            settings: { ...globalSettings } // Initialize with current global settings
        }
        onUpdate(block.id, {
            ...block.content,
            colors: [...colors, newColor]
        })
    }

    const handleUpdateColor = (colorId: string, updates: Partial<ColorData>) => {
        const newColors = colors.map(c => c.id === colorId ? { ...c, ...updates } : c)
        onUpdate(block.id, {
            ...block.content,
            colors: newColors
        })
    }

    const handleDeleteColor = (colorId: string) => {
        const newColors = colors.filter(c => c.id !== colorId)
        if (activeColorId === colorId) setActiveColorId(null)
        onUpdate(block.id, {
            ...block.content,
            colors: newColors
        })
    }

    const handleUpdateBlockSettings = (updates: any) => {
        // updates can contain 'settings' or 'colors' or 'styles'
        // Merge accordingly
        onUpdate(block.id, {
            ...block.content,
            ...updates,
            settings: { ...globalSettings, ...updates.settings }, // Deep merge logic simplified
            styles: { ...block.content.styles, ...updates.styles },
        })
    }

    const activeColor = colors.find(c => c.id === activeColorId) || null

    return (
        <>
            <div
                className="w-full max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 justify-items-center"
                onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
            >
                {/* Add Card */}
                {!isReadOnly && (
                    <div
                        className={cn(
                            "w-full bg-white border-dashed border-2 border-gray-200 flex items-center justify-center cursor-pointer transition-all duration-300 group shrink-0",
                            "hover:border-[#FF0054]"
                        )}
                        style={{ height: `${cardHeight}px` }}
                        onClick={handleAddColor}
                    >
                        <div className="w-[50px] h-[50px] bg-[#FF0054] rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <Plus className="w-8 h-8 text-white" />
                        </div>
                    </div>
                )}

                {/* Color Cards */}
                {colors.map(color => (
                    <ColorCard
                        key={color.id}
                        color={color}
                        isReadOnly={isReadOnly}
                        settings={{ ...globalSettings, styles: block.content.styles }}
                        cardHeight={cardHeight}
                        onUpdate={(updates) => handleUpdateColor(color.id, updates)}
                        onDelete={() => handleDeleteColor(color.id)}
                        onResizeStart={handleResizeStart}
                        onClick={() => {
                            if (!isReadOnly) {
                                onSelect?.(block.id)
                                setActiveColorId(color.id)
                            }
                        }}
                    />
                ))}
            </div>

            {/* Settings Panel */}
            {!isReadOnly && activeColorId && activeColor && activeBlockId === block.id && (
                <ColorSettingsPanel
                    color={activeColor}
                    settings={{ ...globalSettings, styles: block.content.styles }}
                    onUpdateBlock={handleUpdateBlockSettings}
                    onUpdateColor={(id, updates) => handleUpdateColor(id, updates)}
                    onClose={() => setActiveColorId(null)}
                />
            )}
        </>
    )
}
