import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PaletteSettings {
    aspectRatio?: string
    style?: number
    columns?: number
    gapHorizontal?: number
    gapVertical?: number
    radius?: number
    borderWidth?: number
    borderColor?: string
    customWidth?: number
    customHeight?: number
    fullWidth?: boolean
    layout?: 'grid' | 'list' | 'circles' | 'row' | 'tall' | 'horizontal' | 'mosaic'
    hover?: { enabled: boolean }
    showPantone?: boolean
    showCmyk?: boolean
    showRgb?: boolean
    styles?: {
        radius?: number
        borderWidth?: number
        borderColor?: string
        overlayBg?: string
        textColor?: string
        cardHeight?: number
        fontColor?: string
        previewColor?: string
    }
}

export const DEFAULT_PALETTE_SETTINGS: PaletteSettings = {
    hover: { enabled: true },
    showPantone: true,
    showCmyk: true,
    showRgb: true,
    layout: 'grid',
    columns: 3,
    gapHorizontal: 32,
    gapVertical: 32,
    customWidth: 300,
    customHeight: 400,
    radius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    styles: {
        radius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    }
}

interface PaletteSettingsPanelProps {
    settings?: Partial<PaletteSettings>
    onUpdate: (newSettings: Partial<PaletteSettings>) => void
    onClose: () => void
    initialTop?: number
    initialLeft?: number
}

export function PaletteSettingsPanel({
    settings,
    onUpdate,
    onClose,
    initialTop = 100,
    initialLeft = 100
}: PaletteSettingsPanelProps) {
    // Draggable state
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
        const handleMouseUp = () => setIsDragging(false)

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragStart])

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
    }

    const updateValue = (key: keyof PaletteSettings, value: string | number | boolean | undefined) => {
        onUpdate({ [key]: value })
    }

    return createPortal(
        <div
            className="fixed z-[9999] bg-[#15161B] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: initialTop,
                left: initialLeft,
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: '280px',
                height: '600px'
            }}
        >
            {/* Header */}
            <div
                className="h-[50px] bg-[#FF0054] px-5 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <span className="text-white font-medium text-[15px]">Pallete block setting</span>
                <button
                    onClick={onClose}
                    className="w-[20px] h-[20px] bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                    <X className="w-3 h-3 text-white" strokeWidth={3} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar">

                {/* 1. Dimensão */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[#A0A0A0] text-[12px]">Dimensão</span>
                        <div className="flex gap-3 text-[12px]">
                            <div className={cn(
                                "flex gap-1 items-center bg-white/5 rounded px-1.5 py-0.5 border border-white/10 group/w transition-opacity",
                                settings?.fullWidth && "opacity-40 pointer-events-none"
                            )}>
                                <span className="text-[#666] font-mono">w</span>
                                <input
                                    type="text"
                                    value={settings?.fullWidth ? '--' : (settings?.customWidth || '')}
                                    placeholder="--"
                                    disabled={settings?.fullWidth}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value.replace(/\D/g, ''))
                                        updateValue('customWidth', isNaN(val) ? undefined : val)
                                    }}
                                    className="bg-transparent border-none text-[#A0A0A0] w-[35px] text-right outline-none text-[12px] group-hover/w:text-white transition-colors disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="flex gap-1 items-center bg-white/5 rounded px-1.5 py-0.5 border border-white/10 group/h">
                                <span className="text-[#666] font-mono">h</span>
                                <input
                                    type="text"
                                    value={settings?.customHeight || ''}
                                    placeholder="--"
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value.replace(/\D/g, ''))
                                        updateValue('customHeight', isNaN(val) ? undefined : val)
                                    }}
                                    className="bg-transparent border-none text-[#A0A0A0] w-[35px] text-right outline-none text-[12px] group-hover/h:text-white transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center flex-wrap gap-y-2">
                        {['Nenhum', '1:1', '3:2', '4:5', '16:9', '9:16'].map((ratio) => (
                            <button
                                key={ratio}
                                onClick={() => updateValue('aspectRatio', ratio === 'Nenhum' ? undefined : ratio)}
                                className={cn(
                                    "text-[12px] transition-colors px-1",
                                    (settings?.aspectRatio === ratio || (ratio === 'Nenhum' && !settings?.aspectRatio)) ? "text-white" : "text-[#666] hover:text-[#A0A0A0]"
                                )}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>

                    {/* 7. Largura Total (Moved here) */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-[#A0A0A0] text-[12px]">Largura total</span>
                        <button
                            onClick={() => updateValue('fullWidth', !settings?.fullWidth)}
                            className={cn(
                                "w-[30px] h-[16px] rounded-full relative transition-colors duration-200 outline-none",
                                settings?.fullWidth ? "bg-[#FF0054]" : "bg-[#333]"
                            )}
                        >
                            <div className={cn(
                                "absolute top-[2px] w-[12px] h-[12px] bg-white rounded-full transition-all duration-200",
                                settings?.fullWidth ? "left-[16px]" : "left-[2px]"
                            )} />
                        </button>
                    </div>
                </div>

                <div className="h-[1px] bg-white/5 w-full" />

                {/* 2. Estilo */}
                <div className="flex flex-col gap-3">
                    <span className="text-[#A0A0A0] text-[12px]">Estilo</span>
                    <div className="flex justify-between px-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                onClick={() => updateValue('style', s)}
                                className={cn(
                                    "text-[12px] transition-colors",
                                    (settings?.style || 1) === s ? "text-white font-bold" : "text-[#666] hover:text-[#A0A0A0]"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[1px] bg-white/5 w-full" />

                {/* Layout Selection */}
                <div className="flex flex-col gap-3">
                    <span className="text-[#A0A0A0] text-[12px]">Layout</span>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        {[
                            { id: 'grid', label: 'Grid' },
                            { id: 'list', label: 'Lista' },
                            { id: 'circles', label: 'Círculos' },
                            { id: 'row', label: 'Linha' },
                            { id: 'tall', label: 'Tall' },
                            { id: 'horizontal', label: 'Horizontal' },
                            { id: 'mosaic', label: 'Mosaic' }
                        ].map((layout) => (
                            <button
                                key={layout.id}
                                onClick={() => updateValue('layout', layout.id)}
                                className={cn(
                                    "flex-1 py-1.5 rounded text-[11px] font-medium transition-all border",
                                    (settings?.layout || 'grid') === layout.id
                                        ? "bg-[#FF0054] text-white border-[#FF0054]"
                                        : "bg-white/5 text-[#666] border-white/5 hover:text-[#A0A0A0]"
                                )}
                            >
                                {layout.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[1px] bg-white/5 w-full" />

                {/* 3. Número de colunas */}
                <div className="flex flex-col gap-3">
                    <span className="text-[#A0A0A0] text-[12px]">Número de colunas</span>
                    <div className="flex justify-between px-2">
                        {[1, 2, 3, 4].map((c) => (
                            <button
                                key={c}
                                onClick={() => updateValue('columns', c)}
                                className={cn(
                                    "text-[12px] transition-colors",
                                    (settings?.columns || 3) === c ? "text-white font-bold" : "text-[#666] hover:text-[#A0A0A0]"
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. Espaçamento Horizontal */}
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[#A0A0A0] text-[13px] font-medium">Espaçamento Cores</span>
                    <div className="relative group/input">
                        <div className="flex items-center bg-transparent border border-white/10 rounded px-3 h-[28px] w-[75px] group-hover/input:border-white/20 transition-colors">
                            <input
                                type="text"
                                value={(settings?.gapHorizontal ?? DEFAULT_PALETTE_SETTINGS.gapHorizontal ?? 0).toString().padStart(2, '0')}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0
                                    updateValue('gapHorizontal', val)
                                }}
                                className="bg-transparent border-none text-white text-[12px] w-full text-right outline-none pr-1"
                            />
                            <span className="text-[#666] text-[10px] select-none lowercase">px</span>
                        </div>
                    </div>
                </div>

                {/* 4.5. Espaçamento Vertical */}
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[#A0A0A0] text-[13px] font-medium">Espaçamento Cards</span>
                    <div className="relative group/input">
                        <div className="flex items-center bg-transparent border border-white/10 rounded px-3 h-[28px] w-[75px] group-hover/input:border-white/20 transition-colors">
                            <input
                                type="text"
                                value={(settings?.gapVertical ?? DEFAULT_PALETTE_SETTINGS.gapVertical ?? 0).toString().padStart(2, '0')}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0
                                    updateValue('gapVertical', val)
                                }}
                                className="bg-transparent border-none text-white text-[12px] w-full text-right outline-none pr-1"
                            />
                            <span className="text-[#666] text-[10px] select-none lowercase">px</span>
                        </div>
                    </div>
                </div>

                <div className="h-[1px] bg-white/5 w-full mt-1" />

                {/* 5. Radius */}
                <div className="flex items-center justify-between">
                    <span className="text-[#A0A0A0] text-[13px]">Radius</span>
                    <div className="relative group/input">
                        <div className="flex items-center bg-transparent border border-white/10 rounded px-3 h-[28px] w-[75px] group-hover/input:border-white/20 transition-colors">
                            <input
                                type="text"
                                value={(settings?.radius || 0).toString().padStart(2, '0')}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0
                                    updateValue('radius', val)
                                }}
                                className="bg-transparent border-none text-white text-[12px] w-full text-right outline-none pr-1"
                            />
                            <span className="text-[#666] text-[10px] select-none lowercase">px</span>
                        </div>
                    </div>
                </div>

                {/* 6. Border */}
                <div className="flex items-center justify-between">
                    <span className="text-[#A0A0A0] text-[13px]">Border</span>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={(settings?.borderWidth || 0).toString().padStart(2, '0')}
                            onChange={(e) => {
                                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0
                                updateValue('borderWidth', val)
                            }}
                            className="bg-transparent border-none text-white text-[12px] w-[20px] text-right outline-none"
                        />
                        <div className="relative">
                            <input
                                type="color"
                                value={settings?.borderColor || '#FFFFFF'}
                                onChange={(e) => updateValue('borderColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div
                                className="w-8 h-8 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: settings?.borderColor || '#FFFFFF' }}
                            />
                        </div>
                    </div>
                </div>

            </div>

        </div>,
        document.body
    )
}
