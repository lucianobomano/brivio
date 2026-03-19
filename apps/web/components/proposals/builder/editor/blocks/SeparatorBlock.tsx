import React, { useState } from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { Trash2, Settings, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface SeparatorBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    onDelete?: (id: string) => void
}

export const SeparatorBlock = ({ block, isReadOnly, onUpdate, onSelect, onDelete }: SeparatorBlockProps) => {
    const [showSettings, setShowSettings] = useState(false)
    const style = block.content?.style || {}

    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
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
    }, [isDragging, dragStart])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
    }

    // Default values
    const isFullWidth = style.width === '100%'
    const thickness = parseInt(style.height || '3')
    const color = style.backgroundColor || '#000000'

    const handleUpdate = (updates: any) => {
        onUpdate(block.id, {
            ...block.content,
            style: { ...style, ...updates }
        })
    }

    return (
        <div
            className="group/separator relative w-full py-8 flex justify-center"
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            {/* Actions Toolbar - Visible on Hover (Edit Mode) */}
            {!isReadOnly && !showSettings && (
                <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/separator:opacity-100 transition-opacity flex gap-2 z-10"
                >
                    {/* Settings Button */}
                    <div
                        className="cursor-pointer bg-black text-white p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowSettings(true)
                        }}
                    >
                        <Settings className="w-4 h-4" />
                    </div>

                    {/* Delete Button */}
                    <div
                        className="cursor-pointer bg-black text-white p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete?.(block.id)
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </div>
                </div>
            )}

            {/* Settings Popup Panel */}
            {showSettings && (
                <div
                    className="absolute top-[100%] left-1/2 z-50 w-[320px] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - DRAGGABLE */}
                    <div
                        className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move"
                        onMouseDown={handleMouseDown}
                    >
                        <span className="text-white font-medium text-lg">Line settings</span>
                        <div
                            className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors"
                            onClick={() => setShowSettings(false)}
                        >
                            <X className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="bg-[#1F1F25] p-5 flex flex-col gap-0 border border-white/5">
                        {/* Width Toggle */}
                        <div className="flex items-center justify-between py-2 border-b border-white/10 pb-4">
                            <span className="text-gray-400 text-sm">Largura total</span>
                            <Switch
                                checked={isFullWidth}
                                onCheckedChange={(checked) => {
                                    handleUpdate({
                                        width: checked ? '100%' : undefined,
                                        maxWidth: checked ? 'none' : '1080px'
                                    })
                                }}
                                className="data-[state=checked]:bg-[#FF0054]"
                            />
                        </div>

                        {/* Thickness Input */}
                        <div className="flex items-center justify-between py-4 border-b border-white/10">
                            <span className="text-gray-400 text-sm">Espessura</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={thickness}
                                    onChange={(e) => handleUpdate({ height: `${e.target.value}px` })}
                                    className="w-12 h-6 bg-transparent text-right text-gray-300 text-sm focus:outline-none border-b border-transparent hover:border-white/20 focus:border-[#FF0054]"
                                />
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="flex items-center justify-between pt-4">
                            <span className="text-gray-400 text-sm">Cor</span>
                            <div className="relative group/color">
                                <div
                                    className="w-8 h-8 rounded-full border border-white/20 cursor-pointer shadow-sm relative overflow-hidden"
                                    style={{ backgroundColor: color }}
                                >
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                                        className="absolute -top-2 -left-2 w-16 h-16 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* The Separator Line */}
            <div
                className={cn(
                    "rounded-full transition-all duration-300",
                    isFullWidth ? "w-full" : "w-full max-w-[1080px]"
                )}
                style={{
                    height: style.height || '3px',
                    backgroundColor: style.backgroundColor || '#000000',
                    maxWidth: isFullWidth ? 'none' : '1080px'
                }}
            />
        </div>
    )
}
