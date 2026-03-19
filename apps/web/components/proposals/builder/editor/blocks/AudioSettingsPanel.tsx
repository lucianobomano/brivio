import React, { useState, useEffect, useRef } from "react"
import { X, Upload, Trash } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioSettingsPanelProps {
    onClose: () => void
    settings: any
    onUpdate: (settings: any) => void
    onUploadAudio: () => void
    onUploadImage: () => void
    onDelete: () => void
}

export const AudioSettingsPanel = ({ onClose, settings, onUpdate, onUploadAudio, onUploadImage, onDelete }: AudioSettingsPanelProps) => {
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

    // Default values
    const bgType = settings?.backgroundType || 'color'
    const bgColor = settings?.backgroundColor || '#422600'
    const colors = [
        '#55C274', '#F4D42F', '#E0261E', '#4B2A0F', '#E76F00', '#0042DA', '#EF007F', '#9D00E7', // Row 1
        '#9ca3af', '#2a2a2a', '#9D00E7', '#00B5B5', '#F5DEB3', '#2F4F4F', '#6FFFB0', '#251607'  // Row 2
    ]

    return (
        <div
            className="w-[300px] h-[500px] flex flex-col bg-[#15161B] rounded-lg shadow-2xl border border-[#333] z-[200] overflow-hidden"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                position: 'relative'
            }}
        >
            {/* Header */}
            <div
                className="h-[48px] bg-[#FF0054] flex items-center justify-between px-4 cursor-move shrink-0 touch-none select-none"
                onMouseDown={startDrag}
            >
                <span className="text-white font-medium">Edit audio</span>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    className="w-5 h-5 bg-black rounded-full flex items-center justify-center hover:bg-black/80 transition-colors pointer-events-auto z-50"
                    onMouseDown={e => e.stopPropagation()}
                >
                    <span className="sr-only">Close</span>
                </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">

                {/* Audio File Section */}
                <div className="space-y-2">
                    <label className="text-[#97A1B3] text-xs">Alterar áudio</label>
                    <div
                        className="h-[120px] border border-dashed border-[#333] hover:border-[#FF0054] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#1A1C23]"
                        onClick={onUploadAudio}
                    >
                        <Upload className="w-6 h-6 text-[#666] mb-2" />
                        <span className="text-white font-medium text-sm">Upload audio</span>
                        <span className="text-[#666] text-[10px]">or click to upload from your computer</span>
                    </div>
                </div>

                <div className="w-full h-[1px] bg-[#333] shrink-0" />

                {/* Background Type Toggle */}
                <div className="space-y-2">
                    <label className="text-[#97A1B3] text-xs">Tipo de fundo</label>
                    <div className="bg-[#1A1C23] p-[2px] rounded-lg flex h-[32px] border border-[#333]">
                        <button
                            onClick={() => onUpdate({ backgroundType: 'image' })}
                            className={cn(
                                "flex-1 rounded-[6px] text-xs font-medium transition-all",
                                bgType === 'image' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white"
                            )}
                        >
                            Image
                        </button>
                        <button
                            onClick={() => onUpdate({ backgroundType: 'color' })}
                            className={cn(
                                "flex-1 rounded-[6px] text-xs font-medium transition-all",
                                bgType === 'color' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white"
                            )}
                        >
                            Cor
                        </button>
                    </div>
                </div>

                {/* Color Picker Section (Visible if Color) */}
                {bgType === 'color' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Gradient / Color Preview */}
                        <div
                            className="w-full h-[80px] rounded-lg border border-[#333]"
                            style={{
                                background: `linear-gradient(to right, #e0e0e0, ${bgColor})`
                            }}
                        />

                        {/* Hex Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={bgColor}
                                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                                className="w-full bg-[#1A1C23] border border-[#333] rounded-[4px] h-[32px] px-3 text-sm text-[#97A1B3] outline-none focus:border-[#FF0054] text-center"
                            />
                        </div>

                        {/* Color Grid */}
                        <div className="grid grid-cols-8 gap-2">
                            {colors.map((c, i) => (
                                <button
                                    key={i}
                                    className={cn(
                                        "w-6 h-6 rounded-[2px] hover:scale-110 transition-transform",
                                        bgColor === c && "ring-1 ring-white"
                                    )}
                                    style={{ backgroundColor: c }}
                                    onClick={() => onUpdate({ backgroundColor: c })}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Image Upload Section (Visible if Image) */}
                {bgType === 'image' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div
                            className="h-[120px] border border-dashed border-[#333] hover:border-[#FF0054] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#1A1C23]"
                            onClick={onUploadImage}
                        >
                            <Upload className="w-6 h-6 text-[#666] mb-2" />
                            <span className="text-white font-medium text-sm">Upload image</span>
                            <span className="text-[#666] text-[10px] text-center px-2">or click to upload from your computer</span>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="h-[48px] border-t border-[#333] bg-[#15161B] px-4 flex items-center justify-end shrink-0 relative">
                <div className="absolute bottom-3 left-4">
                    <Trash className="w-4 h-4 text-[#E0261E] cursor-pointer hover:text-[#FF0054]" onClick={onDelete} />
                </div>
                <div className="absolute bottom-3 right-4">
                    <span className="text-[#E0261E] text-xs font-medium cursor-pointer hover:text-[#FF0054]" onClick={onDelete}>Delete áudio</span>
                </div>
            </div>
        </div>
    )
}
