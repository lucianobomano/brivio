import React, { useState } from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { Trash2, Settings, X, Zap, Copy, CopyPlus, Check, ArrowUp, ArrowDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { MarginSettingsControl } from "./MarginSettingsControl"
import { FloatingPanel } from "../FloatingPanel"
import { SmoothColorInput } from "../SmoothColorInput"

interface SeparatorBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    onDelete?: (id: string) => void
    onAnimate?: () => void
    onCopy?: (id: string) => void
    onDuplicate?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    align?: 'left' | 'center' | 'right'
}

export const SeparatorBlock = ({ block, isReadOnly, onUpdate, onSelect, onDelete, onAnimate, onCopy, onDuplicate, onMove, align }: SeparatorBlockProps) => {
    const [showSettings, setShowSettings] = useState(false)
    const [copied, setCopied] = useState(false)
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
    // Line width: "100%" = full width; otherwise a manual width in px or % (lines saved without one are full width)
    const isFullWidth = !style.width || style.width === '100%'
    const widthUnit: 'px' | '%' = typeof style.width === 'string' && style.width.trim().endsWith('%') ? '%' : 'px'
    const widthValue = parseFloat(style.width) || (widthUnit === '%' ? 50 : 240)
    const setWidth = (value: number, unit: 'px' | '%') =>
        handleUpdate({ width: `${Math.max(1, unit === '%' ? Math.min(100, value) : value)}${unit}` })
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
            className="group/separator relative w-full py-0 flex items-center"
            style={{
                justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
            }}
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            {/* Hit area expansion: allows hovering even if the line is 1px thick */}
            {!isReadOnly && (
                <div className="absolute -inset-y-4 inset-x-0 z-0 cursor-pointer" />
            )}

            {/* Actions Toolbar - Visible on Hover (Edit Mode) */}
            {!isReadOnly && !showSettings && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/separator:opacity-100 transition-opacity flex gap-2 z-10"
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

                    {/* Animate Button */}
                    <div
                        className="cursor-pointer bg-black text-white p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform"
                        onClick={(e) => {
                            e.stopPropagation()
                            onAnimate?.()
                        }}
                    >
                        <Zap className="w-4 h-4" />
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
                // Top layer: always above the page content (blocks, columns, sections)
                <FloatingPanel placement="bottom-center" offset={8}>
                <div
                    className="w-[320px] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - DRAGGABLE */}
                    <div
                        className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move"
                        onMouseDown={handleMouseDown}
                    >
                        <span className="text-white font-medium text-lg">Line settings</span>
                        <button
                            className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => setShowSettings(false)}
                        >
                            <span className="sr-only">Fechar</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="bg-[#1F1F25] p-5 flex flex-col gap-0 border border-white/5">
                        {/* Width Toggle */}
                        <div className="flex items-center justify-between py-2 border-b border-white/10 pb-4">
                            <span className="text-gray-400 text-sm">Largura total</span>
                            <Switch
                                checked={isFullWidth}
                                onCheckedChange={(checked) => {
                                    // Turning it off starts from a 240 px line, adjustable below
                                    handleUpdate({
                                        width: checked ? '100%' : '240px',
                                        maxWidth: 'none'
                                    })
                                }}
                                className="data-[state=checked]:bg-[#FF0054]"
                            />
                        </div>

                        {/* Manual width (only when not full width) */}
                        {!isFullWidth && (
                            <div className="flex items-center justify-between py-4 border-b border-white/10">
                                <span className="text-gray-400 text-sm">Largura</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={widthUnit === '%' ? 100 : 4000}
                                        value={widthValue}
                                        onChange={(e) => setWidth(Number(e.target.value) || 1, widthUnit)}
                                        className="w-16 h-6 bg-transparent text-right text-gray-300 text-sm focus:outline-none border-b border-transparent hover:border-white/20 focus:border-[#FF0054] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <div className="flex gap-0.5 bg-white/5 rounded p-0.5">
                                        {(['px', '%'] as const).map(unit => (
                                            <button
                                                key={unit}
                                                onClick={() => setWidth(unit === '%' ? 50 : 240, unit)}
                                                className={cn("w-7 h-5 rounded text-[11px] transition-colors", widthUnit === unit ? "bg-[#FF0054] text-white" : "text-gray-400 hover:text-white")}
                                            >
                                                {unit}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

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
                                    <SmoothColorInput
                                        type="color"
                                        value={color}
                                        onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                                        className="absolute -top-2 -left-2 w-16 h-16 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Margins */}
                        <MarginSettingsControl
                            margin={style.margin}
                            onChange={(m) => handleUpdate({ margin: m })}
                        />
                    </div>

                    {/* Actions: move, copy, duplicate, delete */}
                    <div className="bg-[#1F1F25] border border-t-0 border-white/5 px-3 h-[52px] flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            {([['up', ArrowUp, 'Mover para cima'], ['down', ArrowDown, 'Mover para baixo']] as const).map(([dir, Icon, label]) => (
                                <button
                                    key={dir}
                                    type="button"
                                    title={label}
                                    disabled={!onMove}
                                    onClick={() => onMove?.(block.id, dir)}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#97A1B3] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                title={copied ? "Linha copiada" : "Copiar"}
                                disabled={!onCopy}
                                onClick={() => {
                                    onCopy?.(block.id)
                                    setCopied(true)
                                    window.setTimeout(() => setCopied(false), 1500)
                                }}
                                className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none",
                                    copied ? "text-green-400 bg-green-500/10" : "text-[#97A1B3] hover:text-white hover:bg-white/5"
                                )}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                type="button"
                                title="Duplicar"
                                disabled={!onDuplicate}
                                onClick={() => onDuplicate?.(block.id)}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#97A1B3] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <CopyPlus className="w-4 h-4" />
                            </button>
                            <div className="w-px h-5 bg-white/10 mx-1" />
                            <button
                                type="button"
                                title="Eliminar"
                                disabled={!onDelete}
                                onClick={() => { setShowSettings(false); onDelete?.(block.id) }}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#97A1B3] hover:text-[#FF0054] hover:bg-[#FF0054]/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
                </FloatingPanel>
            )}

            {/* The Separator Line */}
            <div
                className={cn(
                    "rounded-full transition-all duration-300"
                )}
                style={{
                    height: style.height || '3px',
                    backgroundColor: style.backgroundColor || '#000000',
                    // The saved width was ignored before (always full width)
                    width: isFullWidth ? '100%' : style.width,
                    maxWidth: '100%',
                    // A shorter line sits where the column alignment says
                    marginLeft: !isFullWidth && (align === 'center' || align === 'right') ? 'auto' : undefined,
                    marginRight: !isFullWidth && align === 'center' ? 'auto' : undefined,
                }}
            />
        </div>
    )
}
