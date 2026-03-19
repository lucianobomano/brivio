
import React, { useState } from "react"
import { Download, X, Trash2 } from "lucide-react" // Using X for close if needed, but image shows circle
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ButtonSettingsPanelProps {
    settings: any // block.content.settings or merged style
    onUpdate: (updates: any) => void
    onClose: () => void
    onDelete?: () => void
}

export function ButtonSettingsPanel({ settings, onUpdate, onClose, onDelete }: ButtonSettingsPanelProps) {
    // Helper to update style directly
    const updateStyle = (key: string, value: any) => {
        onUpdate({
            style: { ...settings.style, [key]: value }
        })
    }

    const updateHoverIdx = (key: string, value: any) => {
        onUpdate({
            hover: { ...settings.hover, [key]: value }
        })
    }

    // Default values
    const hoverEnabled = settings.hover?.enabled || false

    // Drag logic
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = React.useRef({ x: 0, y: 0 })
    const startPosRef = React.useRef({ x: 0, y: 0 })

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault() // Prevent text selection
        setIsDragging(true)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        startPosRef.current = { ...position }
    }

    React.useEffect(() => {
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

    return (
        <div
            className="w-[320px] bg-[#111116] rounded-lg overflow-hidden shadow-2xl border border-[#222] text-sm font-sans z-[100] flex flex-col max-h-[500px]"
            onClick={e => e.stopPropagation()}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Header - Drag Handle */}
            <div
                className={cn(
                    "bg-[#FF0054] h-[48px] px-4 flex items-center justify-between transition-colors shrink-0",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                onMouseDown={handleMouseDown}
            >
                <span className="font-medium text-white text-base select-none">Button settings</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    className="w-5 h-5 rounded-full bg-[#15161B]/50 hover:bg-[#15161B]/80 transition-colors flex items-center justify-center shrink-0"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
                >
                    <X className="w-3 h-3 text-white" />
                </button>
            </div>

            <div className="p-5 space-y-6 text-[#888] overflow-y-auto custom-scrollbar">
                {/* URL */}
                <div className="space-y-2">
                    <Input
                        placeholder="Paste URL or choose page or anchor"
                        value={settings.url || ""}
                        onChange={(e) => onUpdate({ url: e.target.value })}
                        className="bg-transparent border-0 border-b border-[#333] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#FF0054] placeholder:text-[#555] h-8 text-white"
                    />
                </div>

                {/* Download */}
                <div className="flex items-center justify-between group cursor-pointer hover:text-white transition-colors">
                    <span>Add download</span>
                    <Download className="w-4 h-4" />
                </div>

                <div className="h-[1px] bg-[#222] w-full" />

                {/* Normal Color */}
                <div className="space-y-4">
                    <span className="block text-[#888]">Cor do botão</span>
                    <div className="flex items-center justify-between">
                        <span>Background</span> {/* Corrected label from image artifact 'Background hover' to standard logic, user can rename if needed but 'Background' is safer */}
                        <div className="relative">
                            <input
                                type="color"
                                value={settings.style?.backgroundColor || '#FF0054'}
                                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                            <div
                                className="w-6 h-6 rounded-full border border-white/10"
                                style={{ backgroundColor: settings.style?.backgroundColor || '#FF0054' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-[1px] bg-[#222] w-full" />



                {/* Hover Toggle */}
                <div className="flex items-center justify-between">
                    <span>Activar hover</span>
                    <SwitchPrimitives.Root
                        checked={hoverEnabled}
                        onCheckedChange={(checked) => onUpdate({ hover: { ...settings.hover, enabled: checked } })}
                        className={cn(
                            "peer inline-flex h-[27px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                            "data-[state=checked]:bg-[#FF0054] data-[state=unchecked]:bg-[#515151]"
                        )}
                    >
                        <SwitchPrimitives.Thumb
                            className={cn(
                                "pointer-events-none block h-[23px] w-[23px] rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[23px] data-[state=unchecked]:translate-x-0",
                                "data-[state=checked]:bg-[#ffffff] data-[state=unchecked]:bg-[#97A1B3]"
                            )}
                        />
                    </SwitchPrimitives.Root>
                </div>

                {/* Hover Options (Conditional) */}
                {hoverEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <span>Background hover</span>
                            <div className="relative">
                                <input
                                    type="color"
                                    value={settings.hover?.backgroundColor || '#00FF94'}
                                    onChange={(e) => updateHoverIdx('backgroundColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                                <div
                                    className="w-6 h-6 rounded-full border border-white/10"
                                    style={{ backgroundColor: settings.hover?.backgroundColor || '#00FF94' }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Text hover</span>
                            <div className="relative">
                                <input
                                    type="color"
                                    value={settings.hover?.color || '#ffffff'}
                                    onChange={(e) => updateHoverIdx('color', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                                <div
                                    className="w-6 h-6 rounded-full border border-white/10"
                                    style={{ backgroundColor: settings.hover?.color || '#ffffff' }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Border hover</span>
                            <div className="relative">
                                <input
                                    type="color"
                                    value={settings.hover?.borderColor || '#3333FF'}
                                    onChange={(e) => updateHoverIdx('borderColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                                <div
                                    className="w-6 h-6 rounded-full border border-white/10"
                                    style={{ backgroundColor: settings.hover?.borderColor || '#3333FF' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="h-[1px] bg-[#222] w-full" />

                {/* Dimensions */}
                <div className="space-y-4">
                    <span>Dimensão</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[#555]">w</span>
                            <Input
                                value={settings.style?.width?.replace('px', '') || ''}
                                onChange={(e) => updateStyle('width', `${e.target.value}px`)}
                                className="w-16 h-8 bg-transparent border-b border-[#333] px-0 rounded-none focus-visible:ring-0 text-white"
                                placeholder="00"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#555]">h</span>
                            <Input
                                value={settings.style?.height?.replace('px', '') || ''}
                                onChange={(e) => updateStyle('height', `${e.target.value}px`)}
                                className="w-16 h-8 bg-transparent border-b border-[#333] px-0 rounded-none focus-visible:ring-0 text-white"
                                placeholder="00"
                            />
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center justify-between text-xs text-[#666]">
                        {['10%', '30%', '50%', '100%'].map(p => (
                            <button
                                key={p}
                                onClick={() => updateStyle('width', p)}
                                className={cn(
                                    "hover:text-white transition-colors",
                                    settings.style?.width === p && "text-[#FF0054] font-medium border border-[#FF0054] px-1 rounded bg-[#FF0054]/10"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[1px] bg-[#222] w-full" />

                {/* Radius */}
                <div className="flex items-center justify-between">
                    <span>Radius</span> {/* Typo in design 'Raidius' corrected */}
                    <Input
                        value={settings.style?.borderRadius?.replace('px', '') || ''}
                        onChange={(e) => updateStyle('borderRadius', `${e.target.value}px`)}
                        className="w-12 h-8 bg-transparent border-b border-[#333] px-0 rounded-none focus-visible:ring-0 text-right text-white"
                        placeholder="00"
                    />
                </div>

                {/* Border */}
                <div className="flex items-center justify-between">
                    <span>Border</span>
                    <Input
                        value={settings.style?.borderWidth?.replace('px', '') || ''}
                        onChange={(e) => updateStyle('borderWidth', `${e.target.value}px`)}
                        className="w-12 h-8 bg-transparent border-b border-[#333] px-0 rounded-none focus-visible:ring-0 text-right text-white"
                        placeholder="00"
                    />
                </div>

                <div className="h-[1px] bg-[#222] w-full" />

                {/* Delete */}
                <button
                    onClick={onDelete}
                    className="flex items-center justify-between w-full text-[#FF4444] hover:text-[#FF6666] transition-colors group"
                >
                    <span>Delete button</span>
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
