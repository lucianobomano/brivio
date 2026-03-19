
import React, { useState, useRef, useEffect } from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"
import { PaletteSettings } from "./PaletteSettingsPanel"

interface ColorSettings {
    showPantone?: boolean
    showCmyk?: boolean
    showRgb?: boolean
    hover?: { enabled: boolean }
    styles?: { fontColor?: string; previewColor?: string }
    [key: string]: any
}

interface ColorData {
    name?: string
    value?: string
    settings?: ColorSettings
}

interface ColorSettingsPanelProps {
    color: { id: string, name: string, value: string, settings?: ColorSettings } | null
    settings: PaletteSettings
    onUpdateBlock: (updates: Partial<PaletteSettings>) => void
    onUpdateColor: (colorId: string, updates: Partial<ColorData>) => void
    onClose: () => void
}

export function ColorSettingsPanel({ color, settings, onUpdateBlock, onUpdateColor, onClose }: ColorSettingsPanelProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const startPosRef = useRef({ x: 0, y: 0 })



    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        startPosRef.current = { ...position }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            const dx = e.clientX - dragStartRef.current.x
            const dy = e.clientY - dragStartRef.current.y
            setPosition({
                x: startPosRef.current.x + dx,
                y: startPosRef.current.y + dy
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    if (!color) return null

    // Style settings
    const updateStyle = (key: string, value: string | number) => {
        onUpdateBlock({
            styles: { ...settings?.styles, [key]: value } as any
        })
    }

    const updateColorStyle = (key: string, value: string | undefined) => {
        onUpdateColor(color.id, {
            settings: {
                ...color.settings,
                styles: { ...color.settings?.styles, [key]: value }
            }
        })
    }

    const presets = ["#6366F1", "#FF0054", "#A855F7", "#FACC15", "#111827", "#10B981"] // Sample brand colors

    return (
        <div
            className="w-[300px] bg-[#111116] rounded-lg overflow-hidden shadow-2xl border border-[#222] text-sm font-sans z-[100] flex flex-col fixed left-[50%] top-[20%]"
            onClick={e => e.stopPropagation()}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Header */}
            <div
                className={cn(
                    "bg-[#FF0054] h-[40px] px-4 flex items-center justify-between transition-colors shrink-0",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                onMouseDown={handleMouseDown}
            >
                <span className="font-medium text-white text-base select-none">Color</span>
                <div
                    className="w-3 h-3 rounded-full bg-black cursor-pointer hover:scale-110 transition-transform"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            </div>

            <div className="p-4 space-y-6 text-[#888] max-h-[600px] overflow-y-auto custom-scrollbar">

                {/* Main Color Picker (Simulation) */}
                <div className="space-y-3">
                    {/* Big Area */}
                    <div className="w-full h-[120px] rounded-lg relative overflow-hidden group">
                        <div
                            className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-black"
                            style={{ backgroundColor: color.value }}
                        />
                        <input
                            type="color"
                            value={color.value}
                            onChange={(e) => onUpdateColor(color.id, { value: e.target.value })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                    {/* Hue Slider (Fake/Native driven) */}
                    <div className="w-full h-3 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 relative">
                        <div className="w-3 h-3 bg-white rounded-full absolute top-0 left-0 shadow-sm border border-black/10 transform translate-x-[0px]" /> {/* Static visual */}
                    </div>

                    {/* Hex & Name Input */}
                    <div className="space-y-2">
                        <div className="bg-[#1A1A1A] rounded border border-[#333] p-2 flex items-center group/name">
                            <span className="text-[10px] uppercase font-bold text-[#444] mr-2 shrink-0">Name</span>
                            <input
                                type="text"
                                value={color.name}
                                onChange={(e) => onUpdateColor(color.id, { name: e.target.value })}
                                className="bg-transparent border-none text-white text-sm w-full outline-none focus:text-[#FF0054] transition-colors"
                                placeholder="Color name"
                            />
                        </div>

                        <div className="bg-[#1A1A1A] rounded border border-[#333] p-2 flex items-center group/hex">
                            <span className="text-[10px] uppercase font-bold text-[#444] mr-2 shrink-0">Hex</span>
                            <input
                                type="text"
                                value={color.value.toUpperCase()}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val && !val.startsWith('#')) val = '#' + val;
                                    // Simple validation: only hex chars and #
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                        onUpdateColor(color.id, { value: val });
                                    }
                                }}
                                className="bg-transparent border-none text-white font-mono text-center w-full outline-none focus:text-[#FF0054] transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Brand Colors */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[#888]">Brand colors</span>
                        <span className="text-[#444] text-xl leading-none">...</span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {presets.map(p => (
                            <button
                                key={p}
                                onClick={() => onUpdateColor(color.id, { value: p })}
                                className={cn(
                                    "w-8 h-8 rounded-full border border-white/10 transition-transform hover:scale-110",
                                    color.value === p && "ring-2 ring-white"
                                )}
                                style={{ backgroundColor: p }}
                            />
                        ))}
                    </div>
                </div>

                <div className="h-[1px] bg-[#222] w-full" />

                {/* Toggles */}
                <div className="space-y-4">
                    {[
                        { label: 'Activar hover', key: 'enabled', section: 'hover' }, // Mapped to hover logic
                        { label: 'Show Pantone', key: 'showPantone' },
                        { label: 'Show CMYK', key: 'showCmyk' },
                        { label: 'Show RGB', key: 'showRgb' },
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between">
                            <span>{item.label}</span>
                            <SwitchPrimitives.Root
                                checked={item.section === 'hover'
                                    ? (color.settings?.hover?.enabled ?? settings?.hover?.enabled) !== false
                                    : (color.settings?.[item.key] ?? settings?.[item.key]) !== false
                                }
                                onCheckedChange={(c) => {
                                    if (item.section === 'hover') {
                                        onUpdateColor(color.id, {
                                            settings: {
                                                ...color.settings,
                                                hover: { ...color.settings?.hover, enabled: c }
                                            }
                                        })
                                    } else {
                                        onUpdateColor(color.id, {
                                            settings: {
                                                ...color.settings,
                                                [item.key]: c
                                            }
                                        })
                                    }
                                }}
                                className={cn(
                                    "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                                    "data-[state=checked]:bg-[#97A1B3] data-[state=unchecked]:bg-[#515151]" // Image shows Grey active? No, usually active is color. Image toggle looks Grey/White. 
                                    // Image: 'Activar hover' is OFF (Grey/DarkGrey). 'Show Pantone' is OFF.
                                    // User said: "Implement toggle... custom CSS". I'll use the one from ButtonSettings but updated colors if needed. 
                                    // Image shows: Thumb white, Track grey. 
                                )}
                            >
                                <SwitchPrimitives.Thumb
                                    className={cn(
                                        "pointer-events-none block h-[20px] w-[20px] rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-0",
                                        "bg-white"
                                    )}
                                />
                            </SwitchPrimitives.Root>
                        </div>
                    ))}
                </div>
                <div className="h-[1px] bg-[#222] w-full" />

                {/* Visual Colors */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span>Values text color</span>
                        <div className="relative w-8 h-8 rounded-full bg-[#888] cursor-pointer overflow-hidden border border-white/10">
                            <input type="color" className="opacity-0 w-full h-full absolute inset-0"
                                onChange={(e) => updateStyle('textColor', e.target.value)}
                                value={settings?.styles?.textColor || '#888888'}
                            />
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: settings?.styles?.textColor || '#888888' }} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Values background</span>
                        <div className="relative w-8 h-8 rounded-full bg-white cursor-pointer overflow-hidden border border-white/10">
                            <input type="color" className="opacity-0 w-full h-full absolute inset-0"
                                onChange={(e) => updateStyle('overlayBg', e.target.value)}
                                value={settings?.styles?.overlayBg || '#ffffff'}
                            />
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: settings?.styles?.overlayBg || '#ffffff' }} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>HEX preview color</span>
                        <div className="relative w-8 h-8 rounded-full bg-white cursor-pointer overflow-hidden border border-white/10">
                            {/* This might be the color of the text in the preview? Or something else. Implementing as generic color picker. */}
                            <input type="color" className="opacity-0 w-full h-full absolute inset-0"
                                onChange={(e) => updateStyle('previewColor', e.target.value)}
                                value={settings?.styles?.previewColor || '#ffffff'}
                            />
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: settings?.styles?.previewColor || '#ffffff' }} />
                        </div>
                    </div>

                    <div className="h-[1px] bg-[#222] my-2" />

                    <div className="flex items-center justify-between">
                        <span className="text-[#FF0054] font-semibold">Individual Font Color</span>
                        <div className="flex items-center gap-2">
                            {color.settings?.styles?.fontColor && (
                                <button
                                    onClick={() => updateColorStyle('fontColor', undefined)}
                                    className="text-[10px] text-[#FF0054] hover:underline"
                                >
                                    Reset
                                </button>
                            )}
                            <div className="relative w-8 h-8 rounded-full bg-white cursor-pointer overflow-hidden border border-white/10">
                                <input type="color" className="opacity-0 w-full h-full absolute inset-0"
                                    onChange={(e) => updateColorStyle('fontColor', e.target.value)}
                                    value={color.settings?.styles?.fontColor || '#ffffff'}
                                />
                                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: color.settings?.styles?.fontColor || '#ffffff' }} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
