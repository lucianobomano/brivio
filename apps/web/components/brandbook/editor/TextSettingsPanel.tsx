import React from "react"
import { Check, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TextSettingsPanelProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    color: string
    onColorChange: (color: string) => void
    backgroundColor?: string
    onBackgroundColorChange?: (color: string) => void
    height: number
    onHeightChange: (step: number) => void
    width?: string | number
    heightValue?: string | number
    onWidthChange?: (val: string) => void
    onHeightChangePx?: (val: string) => void
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
    backgroundColor,
    onBackgroundColorChange,
    height,
    onHeightChange,
    width,
    heightValue,
    onWidthChange,
    onHeightChangePx,
    onOrderChange,
    outline,
    onOutlineChange,
    trigger
}: TextSettingsPanelProps) {
    // Local state for hex input to allow typing before commit
    const [hexInput, setHexInput] = React.useState(color)
    const [bgHexInput, setBgHexInput] = React.useState(backgroundColor || '#ffffff')
    const [widthInput, setWidthInput] = React.useState(width?.toString() || '')
    const [heightInput, setHeightInput] = React.useState(heightValue?.toString() || '')

    React.useEffect(() => {
        setHexInput(color)
    }, [color])

    React.useEffect(() => {
        if (backgroundColor) setBgHexInput(backgroundColor)
    }, [backgroundColor])

    React.useEffect(() => {
        setWidthInput(width?.toString() || '')
    }, [width])

    React.useEffect(() => {
        setHeightInput(heightValue?.toString() || '')
    }, [heightValue])

    const handleHexSubmit = () => {
        if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
            onColorChange(hexInput)
        }
    }

    const handleBgHexSubmit = () => {
        if (/^#[0-9A-F]{6}$/i.test(bgHexInput)) {
            onBackgroundColorChange?.(bgHexInput)
        }
    }

    // Dragging state (aligned with SectionSettingsPanel)
    const [position, setPosition] = React.useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
    const panelRef = React.useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
        e.preventDefault()
    }

    React.useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragStart])

    // Reset position when panel closes
    React.useEffect(() => {
        if (!isOpen) {
            setPosition({ x: 0, y: 0 })
        }
    }, [isOpen])

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange} modal={false}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent
                ref={panelRef}
                side="right"
                align="start"
                className="w-[280px] p-0 bg-[#15161B] border-none shadow-2xl rounded-lg overflow-hidden flex flex-col gap-4 pb-6 custom-scrollbar max-h-[680px] overflow-y-auto"
                style={{
                    zIndex: 2100,
                    transform: `translate(${position.x}px, ${position.y}px)`
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onFocusOutside={(e) => e.preventDefault()}
            >
                {/* Header - Draggable */}
                <div
                    className={cn(
                        "sticky top-0 z-10 h-[48px] bg-[#FF0054] flex items-center justify-between px-4 shrink-0 shadow-md",
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleMouseDown}
                >
                    <span className="text-white font-medium select-none">Editar texto</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenChange(false) }}
                        className="text-black/50 hover:text-black transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="w-5 h-5 bg-[#15161B] rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        </div>
                    </button>
                </div>

                <div className="px-4 flex flex-col gap-4">
                    {/* Color Picker Area (Text Color) */}
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">Cor do texto</span>
                        <div
                            className="w-full h-[100px] rounded-sm relative cursor-crosshair border border-white/10"
                            style={{ backgroundColor: color }}
                        >
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => onColorChange(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>

                        {/* Hex Input Row */}
                        <div className="flex gap-2 h-[34px]">
                            <div className="flex-1 bg-[#1F2029] rounded flex items-center px-3 border border-[#333]">
                                <span className="text-gray-500 mr-2">#</span>
                                <input
                                    value={hexInput.replace('#', '')}
                                    onChange={(e) => setHexInput('#' + e.target.value)}
                                    className="bg-transparent text-gray-300 w-full outline-none font-mono text-xs uppercase"
                                />
                            </div>
                            <button
                                onClick={handleHexSubmit}
                                className="w-[40px] bg-[#FF0054] rounded flex items-center justify-center hover:bg-[#D90045] transition-colors"
                            >
                                <Check className="text-white w-4 h-4" />
                            </button>
                        </div>

                        {/* Preset Colors Grid */}
                        <div className="grid grid-cols-8 gap-2">
                            {PRESET_COLORS.slice(0, 16).map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => onColorChange(c)}
                                    className="w-5 h-5 rounded-sm hover:scale-110 transition-transform ring-1 ring-white/10"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-[#333] w-full" />

                    {/* Background Color Area */}
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">Cor do fundo</span>
                        <div
                            className="w-full h-[60px] rounded-sm relative cursor-crosshair border border-white/10"
                            style={{ backgroundColor: backgroundColor || 'transparent' }}
                        >
                            <input
                                type="color"
                                value={backgroundColor || '#ffffff'}
                                onChange={(e) => onBackgroundColorChange?.(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {!backgroundColor && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="2" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Bg Hex Input Row */}
                        <div className="flex gap-2 h-[34px]">
                            <div className="flex-1 bg-[#1F2029] rounded flex items-center px-3 border border-[#333]">
                                <span className="text-gray-500 mr-2">#</span>
                                <input
                                    value={bgHexInput.replace('#', '')}
                                    onChange={(e) => setBgHexInput('#' + e.target.value)}
                                    className="bg-transparent text-gray-300 w-full outline-none font-mono text-xs uppercase"
                                />
                            </div>
                            <button
                                onClick={handleBgHexSubmit}
                                className="w-[40px] bg-[#FF0054] rounded flex items-center justify-center hover:bg-[#D90045] transition-colors"
                            >
                                <Check className="text-white w-4 h-4" />
                            </button>
                        </div>

                        {/* Preset Bg Colors Grid */}
                        <div className="grid grid-cols-8 gap-2">
                            {PRESET_COLORS.slice(0, 15).map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => onBackgroundColorChange?.(c)}
                                    className="w-5 h-5 rounded-sm hover:scale-110 transition-transform ring-1 ring-white/10"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <button
                                onClick={() => onBackgroundColorChange?.('')}
                                className="w-5 h-5 rounded-sm bg-transparent border border-white/10 flex items-center justify-center overflow-hidden hover:bg-white/5 relative"
                                title="Transparent"
                            >
                                <div className="absolute inset-0 pointer-events-none">
                                    <svg className="w-full h-full" viewBox="0 0 20 20" preserveAspectRatio="none">
                                        <line x1="0" y1="20" x2="20" y2="0" stroke="#EF4444" strokeWidth="2" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-[#333] w-full" />

                    {/* Height (Altura) Steps */}
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">Altura (Presets)</span>
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
                                    {opt === 100 ? 'MAX' : opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-[#333] w-full" />

                    {/* Dimensions (Dimensões) */}
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">Dimensões manuais</span>
                        <div className="flex gap-4 text-xs text-[#666]">
                            <div className="flex flex-col gap-1 flex-1">
                                <span>Largura (w)</span>
                                <input
                                    type="text"
                                    className="bg-[#1F2029] text-white border border-[#333] rounded px-2 h-[34px] text-xs focus:ring-1 focus:ring-[#FF0054] outline-none w-full"
                                    value={widthInput}
                                    placeholder="auto"
                                    onChange={(e) => setWidthInput(e.target.value)}
                                    onBlur={() => onWidthChange?.(widthInput)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onWidthChange?.(widthInput)
                                            e.currentTarget.blur()
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <span>Altura (h)</span>
                                <input
                                    type="text"
                                    className="bg-[#1F2029] text-white border border-[#333] rounded px-2 h-[34px] text-xs focus:ring-1 focus:ring-[#FF0054] outline-none w-full"
                                    value={heightInput}
                                    placeholder="auto"
                                    onChange={(e) => setHeightInput(e.target.value)}
                                    onBlur={() => onHeightChangePx?.(heightInput)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onHeightChangePx?.(heightInput)
                                            e.currentTarget.blur()
                                        }
                                    }}
                                />
                            </div>
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
                                <div className="absolute inset-x-0 top-0 h-2 bg-[#666]" />
                            </button>

                            <button
                                onClick={() => onOutlineChange('right')}
                                className={cn(
                                    "flex-1 h-10 border border-[#333] bg-[#1F2029] relative hover:border-[#FF0054] transition-colors rounded",
                                    outline.right && "border-[#FF0054]"
                                )}
                            >
                                <div className="absolute inset-y-0 right-0 w-2 bg-[#666]" />
                            </button>

                            <button
                                onClick={() => onOutlineChange('bottom')}
                                className={cn(
                                    "flex-1 h-10 border border-[#333] bg-[#1F2029] relative hover:border-[#FF0054] transition-colors rounded",
                                    outline.bottom && "border-[#FF0054]"
                                )}
                            >
                                <div className="absolute inset-x-0 bottom-0 h-2 bg-[#666]" />
                            </button>

                            <button
                                onClick={() => onOutlineChange('left')}
                                className={cn(
                                    "flex-1 h-10 border border-[#333] bg-[#1F2029] relative hover:border-[#FF0054] transition-colors rounded",
                                    outline.left && "border-[#FF0054]"
                                )}
                            >
                                <div className="absolute inset-y-0 left-0 w-2 bg-[#666]" />
                            </button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
