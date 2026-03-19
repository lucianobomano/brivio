import React from "react"
import { X, Check, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TextSettingsPanelProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    color: string
    onColorChange: (color: string) => void
    height: number
    onHeightChange: (step: number) => void
    onOrderChange: (direction: 'up' | 'down') => void
    outline: { top: boolean; right: boolean; bottom: boolean; left: boolean }
    onOutlineChange: (side: 'top' | 'right' | 'bottom' | 'left') => void
    trigger?: React.ReactNode
}

const PRESET_COLORS = [
    "#4CAF50", "#FFEB3B", "#F44336", "#3E2723", "#FF9800", "#0023F5", "#E91E63", "#9C27B0",
    "#9E9E9E", "#212121", "#9C27B0", "#00BCD4", "#FFE0B2", "#263238", "#69F0AE", "#3E2723",
    "#3F51B5", "#4A148C", "#C5E1A5", "#FF80AB", "#00E676", "#F0F4C3", "#FF5252", "#311B92"
]

const HEIGHT_OPTIONS = [1, 3, 5, 8, 100]

export function TextSettingsPanel({
    isOpen,
    onOpenChange,
    color,
    onColorChange,
    height,
    onHeightChange,
    onOrderChange,
    outline,
    onOutlineChange,
    trigger
}: TextSettingsPanelProps) {
    // Local state for hex input to allow typing before commit
    const [hexInput, setHexInput] = React.useState(color)

    React.useEffect(() => {
        setHexInput(color)
    }, [color])

    const handleHexSubmit = () => {
        if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
            onColorChange(hexInput)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent
                side="right"
                align="start"
                className="w-[280px] p-0 bg-[#15161B] border-none shadow-2xl rounded-lg overflow-hidden flex flex-col gap-4 pb-6"
                style={{ zIndex: 100 }}
            >
                {/* Header */}
                <div className="h-[48px] bg-[#FF0054] flex items-center justify-between px-4 shrink-0">
                    <span className="text-white font-medium">Editar texto</span>
                    <button onClick={() => onOpenChange(false)} className="text-black/50 hover:text-black transition-colors">
                        <div className="w-5 h-5 bg-[#15161B] rounded-full flex items-center justify-center">
                            {/* The image shows a black circle? No, it looks like a close/minimize button. 
                                Actually in the image top right is a BLACK circle. 
                            */}
                            <div className="w-full h-full rounded-full bg-[#15161B]" />
                        </div>
                    </button>
                </div>

                <div className="px-4 flex flex-col gap-4">
                    {/* Color Picker Area */}
                    {/* Represents the Saturation/Value area */}
                    <div
                        className="w-full h-[140px] rounded-sm relative cursor-crosshair border border-white/10"
                        style={{ backgroundColor: color }}
                    >
                        {/* This would be the interactive area. For now just visual placeholder or native input trigger */}
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    {/* Hex Input Row */}
                    <div className="flex gap-2 h-[40px]">
                        <div className="flex-1 bg-[#1F2029] rounded flex items-center px-3 border border-[#333]">
                            <span className="text-gray-500 mr-2">#</span>
                            <input
                                value={hexInput.replace('#', '')}
                                onChange={(e) => setHexInput('#' + e.target.value)}
                                className="bg-transparent text-gray-300 w-full outline-none font-mono text-sm uppercase"
                            />
                        </div>
                        <button
                            onClick={handleHexSubmit}
                            className="w-[50px] bg-[#FF0054] rounded flex items-center justify-center hover:bg-[#D90045] transition-colors"
                        >
                            <Check className="text-white w-5 h-5" />
                        </button>
                    </div>

                    {/* Preset Colors Grid */}
                    <div className="grid grid-cols-8 gap-2">
                        {PRESET_COLORS.map((c, i) => (
                            <button
                                key={i}
                                onClick={() => onColorChange(c)}
                                className="w-6 h-6 rounded-sm hover:scale-110 transition-transform ring-1 ring-white/10"
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="h-[1px] bg-[#333] w-full" />

                    {/* Height (Altura) */}
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">Altura</span>
                        <div className="flex items-center justify-between px-2">
                            {HEIGHT_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => onHeightChange(opt)}
                                    className={cn(
                                        "text-sm transition-colors w-8 h-8 rounded flex items-center justify-center",
                                        height === opt ? "text-[#FF0054] font-bold" : "text-gray-500 hover:text-white"
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-[#333] w-full" />

                    {/* Order (Ordem) */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Ordem</span>
                            <div className="flex gap-4">
                                <button onClick={() => onOrderChange('up')} className="text-gray-400 hover:text-white hover:bg-[#333] p-1 rounded">
                                    <ArrowUp className="w-5 h-5" />
                                </button>
                                <button onClick={() => onOrderChange('down')} className="text-gray-400 hover:text-white hover:bg-[#333] p-1 rounded">
                                    <ArrowDown className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] bg-[#333] w-full" />

                    {/* Outline (Contorno) */}
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">Contorno</span>
                        <div className="grid grid-cols-4 gap-2 w-full">
                            <button
                                onClick={() => onOutlineChange('top')}
                                className={cn(
                                    "flex-1 h-10 border border-[#333] bg-[#1F2029] relative hover:border-[#FF0054] transition-colors rounded",
                                    outline.top && "border-[#FF0054]"
                                )}
                            >
                                <div className="absolute inset-x-0 top-0 h-3 bg-[#666]" />
                            </button>

                            <button
                                onClick={() => onOutlineChange('right')}
                                className={cn(
                                    "flex-1 h-10 border border-[#333] bg-[#1F2029] relative hover:border-[#FF0054] transition-colors rounded",
                                    outline.right && "border-[#FF0054]"
                                )}
                            >
                                <div className="absolute inset-y-0 right-0 w-3 bg-[#666]" />
                            </button>

                            <button
                                onClick={() => onOutlineChange('bottom')}
                                className={cn(
                                    "flex-1 h-10 border border-[#333] bg-[#1F2029] relative hover:border-[#FF0054] transition-colors rounded",
                                    outline.bottom && "border-[#FF0054]"
                                )}
                            >
                                <div className="absolute inset-x-0 bottom-0 h-3 bg-[#666]" />
                            </button>

                            <button
                                onClick={() => onOutlineChange('left')}
                                className={cn(
                                    "flex-1 h-10 border border-[#333] bg-[#1F2029] relative hover:border-[#FF0054] transition-colors rounded",
                                    outline.left && "border-[#FF0054]"
                                )}
                            >
                                <div className="absolute inset-y-0 left-0 w-3 bg-[#666]" />
                            </button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
