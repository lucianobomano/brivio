import React, { useState, useEffect, useRef } from "react"
import { Upload, Download, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch" // Assuming Switch exists, or I will implement a custom one to match design exactly
// If Switch doesn't exist, I'll build a custom toggle.
// I will verify common UI components later, but for now I'll write the code assuming I can use standard HTML/CSS for the specific toggle design requested.

interface DownloadSettingsPanelProps {
    onClose: () => void
    settings: any
    onUpdate: (settings: any) => void
    onUpload: () => void
    onDelete: () => void
}

export const DownloadSettingsPanel = ({ onClose, settings, onUpdate, onUpload, onDelete }: DownloadSettingsPanelProps) => {
    // Custom Draggable Logic
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartPos = useRef({ x: 0, y: 0 })
    const panelStartPos = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            const dx = e.clientX - dragStartPos.current.x
            const dy = e.clientY - dragStartPos.current.y
            setPosition({
                x: panelStartPos.current.x + dx,
                y: panelStartPos.current.y + dy
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

    const startDrag = (e: React.MouseEvent) => {
        setIsDragging(true)
        dragStartPos.current = { x: e.clientX, y: e.clientY }
        panelStartPos.current = { ...position }
    }

    // Settings Values
    const bgColor = settings?.backgroundColor || '#15161B' // Default dark
    const textColor = settings?.textColor || '#ffffff' // Default white (since bg is dark)
    const hoverEnabled = settings?.hoverEnabled || false
    const hoverBgColor = settings?.hoverBackgroundColor || '#FF0054'
    const hoverTextColor = settings?.hoverTextColor || '#FFFFFF'
    const hoverBorderColor = settings?.hoverBorderColor || '#0042DA'
    const width = settings?.width || '112px'
    const height = settings?.height || '112px'
    const radius = settings?.borderRadius || '0'
    const border = settings?.borderWidth || '0'

    // Helper for color input
    const ColorInput = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => (
        <label className={cn("w-8 h-8 rounded-full border border-white/10 cursor-pointer relative overflow-hidden", className)} style={{ backgroundColor: value }}>
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
        </label>
    )

    return (
        <div
            className="w-[280px] max-h-[500px] flex flex-col bg-[#111216] rounded-lg shadow-2xl border border-[#333] z-[200] overflow-hidden"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div
                className="h-[48px] bg-[#FF0054] flex items-center justify-between px-4 cursor-move shrink-0 touch-none select-none relative"
                onMouseDown={startDrag}
            >
                <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Download settings</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    className="w-5 h-5 bg-black rounded-full flex items-center justify-center hover:bg-black/80 transition-colors pointer-events-auto z-50 cursor-pointer"
                    onMouseDown={e => e.stopPropagation()}
                >
                    <span className="sr-only">Close</span>
                </button>
            </div>

            {/* Content SCROLLABLE */}
            <div className="flex-1 overflow-y-auto p-5 py-6 flex flex-col gap-6 text-[#97A1B3] text-sm custom-scrollbar bg-[#111216]">

                {/* 1. Add download */}
                <div className="flex items-center justify-between cursor-pointer hover:text-white transition-colors" onClick={onUpload}>
                    <span>Add download</span>
                    <Upload className="w-5 h-5" />
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 2. Cor do fundo */}
                <div className="flex flex-col gap-4">
                    <span className="text-[#97A1B3]">Cor do fundo</span>

                    {/* Default Background (labeled 'Background hover' in mockup but that's confusing, using 'Background') */}
                    <div className="flex items-center justify-between">
                        <span>Background</span>
                        <ColorInput value={bgColor} onChange={(c) => onUpdate({ backgroundColor: c })} />
                    </div>

                    {/* New: Alterar cor do texto */}
                    <div className="flex items-center justify-between">
                        <span>Alterar cor do texto</span>
                        <ColorInput value={textColor} onChange={(c) => onUpdate({ textColor: c })} />
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 3. Activar hover */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span>Activar hover</span>
                        {/* Custom Toggle Switch */}
                        <button
                            type="button"
                            onClick={() => onUpdate({ hoverEnabled: !hoverEnabled })}
                            className={cn(
                                "w-12 h-7 rounded-full relative transition-colors duration-200 ease-in-out",
                                hoverEnabled ? "bg-[#FF0054]" : "bg-[#333]"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out",
                                hoverEnabled ? "left-6" : "left-1"
                            )} />
                        </button>
                    </div>

                    {/* Hover Options - Conditional Visibility */}
                    {hoverEnabled && (
                        <div className="flex flex-col gap-4 pl-4 border-l border-[#333] ml-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between">
                                <span>Background hover</span>
                                <ColorInput value={hoverBgColor} onChange={(c) => onUpdate({ hoverBackgroundColor: c })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Text hover</span>
                                <ColorInput value={hoverTextColor} onChange={(c) => onUpdate({ hoverTextColor: c })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Border hover</span>
                                <ColorInput value={hoverBorderColor} onChange={(c) => onUpdate({ hoverBorderColor: c })} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 4. Dimensão */}
                <div className="flex items-center justify-between">
                    <span>Dimensão</span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#1A1C23] border border-transparent hover:border-[#333] rounded px-2 py-1">
                            <span className="text-[#555] text-xs">w</span>
                            <input
                                type="text"
                                value={width.replace('px', '')}
                                onChange={(e) => onUpdate({ width: `${e.target.value}px` })}
                                className="w-8 bg-transparent text-right outline-none text-[#97A1B3]"
                                placeholder="00"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-[#1A1C23] border border-transparent hover:border-[#333] rounded px-2 py-1">
                            <span className="text-[#555] text-xs">h</span>
                            <input
                                type="text"
                                value={height.replace('px', '')}
                                onChange={(e) => onUpdate({ height: `${e.target.value}px` })}
                                className="w-8 bg-transparent text-right outline-none text-[#97A1B3]"
                                placeholder="00"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 5. Radius */}
                <div className="flex items-center justify-between">
                    <span>Radius</span>
                    <div className="flex items-center bg-[#1A1C23] border border-transparent hover:border-[#333] rounded px-2 py-1 w-16 justify-end">
                        <input
                            type="text"
                            value={radius.replace('px', '')}
                            onChange={(e) => onUpdate({ borderRadius: `${e.target.value}px` })}
                            className="w-full bg-transparent text-right outline-none text-[#97A1B3]"
                            placeholder="00"
                        />
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 6. Border */}
                <div className="flex items-center justify-between">
                    <span>Border</span>
                    <div className="flex items-center bg-[#1A1C23] border border-transparent hover:border-[#333] rounded px-2 py-1 w-16 justify-end">
                        <input
                            type="text"
                            value={border.replace('px', '')}
                            onChange={(e) => onUpdate({ borderWidth: `${e.target.value}px` })}
                            className="w-full bg-transparent text-right outline-none text-[#97A1B3]"
                            placeholder="00"
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
