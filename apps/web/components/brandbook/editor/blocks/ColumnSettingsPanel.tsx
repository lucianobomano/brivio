import React from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Lock, Unlock } from "lucide-react"
import { Label } from "@/components/ui/label"

interface ColumnSettingsPanelProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    children?: React.ReactNode // Trigger

    // Props matching requirements
    minHeight: string
    onMinHeightChange: (val: string) => void

    backgroundColor: string
    onBackgroundColorChange: (color: string) => void

    onUploadBackground: () => void

    radius: number
    onRadiusChange: (val: number) => void

    borderWidth: number
    onBorderWidthChange: (val: number) => void
    borderColor: string
    onBorderColorChange: (color: string) => void
    borderStyle: string
    onBorderStyleChange: (style: string) => void

    isFixed: boolean
    onFixedChange: (fixed: boolean) => void

    alignHorizontal?: 'left' | 'center' | 'right'
    onAlignHorizontalChange?: (align: 'left' | 'center' | 'right') => void
    alignVertical?: 'top' | 'middle' | 'bottom'
    onAlignVerticalChange?: (align: 'top' | 'middle' | 'bottom') => void

    padding?: { isLocked: boolean; top: number; right: number; bottom: number; left: number }
    onPaddingChange?: (padding: { isLocked: boolean; top: number; right: number; bottom: number; left: number }) => void

    blockGap?: number
    onBlockGapChange?: (gap: number) => void

    isFreeFlow?: boolean
    onFreeFlowChange?: (val: boolean) => void

    // New: Manual width/height and fullWidth/fullHeight toggles for individual column
    columnWidth?: string
    onColumnWidthChange?: (val: string) => void
    columnHeight?: string
    onColumnHeightChange?: (val: string) => void
    isFullWidth?: boolean
    onFullWidthChange?: (val: boolean) => void
    isFullHeight?: boolean
    onFullHeightChange?: (val: boolean) => void

    onReset: () => void
}

export function ColumnSettingsPanel({
    isOpen,
    onOpenChange,
    children,
    minHeight,
    onMinHeightChange,
    backgroundColor,
    onBackgroundColorChange,
    onUploadBackground,
    radius,
    onRadiusChange,
    borderWidth,
    onBorderWidthChange,
    borderColor,
    onBorderColorChange,
    borderStyle,
    onBorderStyleChange,
    isFixed,
    onFixedChange,
    alignHorizontal = 'left',
    onAlignHorizontalChange,
    alignVertical = 'middle',
    onAlignVerticalChange,
    padding = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 },
    onPaddingChange,
    blockGap = 16,
    onBlockGapChange,
    isFreeFlow = false,
    onFreeFlowChange,
    columnWidth = 'auto',
    onColumnWidthChange,
    columnHeight = 'auto',
    onColumnHeightChange,
    isFullWidth = false,
    onFullWidthChange,
    isFullHeight = false,
    onFullHeightChange,
    onReset
}: ColumnSettingsPanelProps) {
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            setDragOffset({
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
        setIsDragging(true)
        setDragStart({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
        })
    }

    // Reset offset when closed
    React.useEffect(() => {
        if (!isOpen) {
            setDragOffset({ x: 0, y: 0 })
        }
    }, [isOpen])

    const handlePaddingLockChange = () => {
        onPaddingChange?.({ ...padding, isLocked: !padding.isLocked })
    }

    const handlePaddingChange = (side: 'all' | 'top' | 'right' | 'bottom' | 'left', value: string) => {
        const numVal = parseInt(value, 10) || 0
        const newPadding = { ...padding }

        if (side === 'all') {
            newPadding.top = numVal
            newPadding.right = numVal
            newPadding.bottom = numVal
            newPadding.left = numVal
        } else if (side === 'top') {
            newPadding.top = numVal
        } else if (side === 'right') {
            newPadding.right = numVal
        } else if (side === 'bottom') {
            newPadding.bottom = numVal
        } else if (side === 'left') {
            newPadding.left = numVal
        }

        onPaddingChange?.(newPadding)
    }

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            {/* Panel matches image: Width ~280-300px, Dark theme */}
            <PopoverContent
                side="left"
                align="start"
                className="w-[300px] p-0 bg-[#15161B] border-none shadow-2xl rounded-lg overflow-hidden flex flex-col"
                style={{ zIndex: 100, transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`, maxHeight: '680px' }}
            >
                {/* Header: Pink background, "Column settings", Circle icon */}
                <div
                    className="sticky top-0 z-10 h-[48px] bg-[#FF0054] flex items-center justify-between px-4 shrink-0 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                >
                    <span className="text-white font-medium text-[15px]">Column settings</span>
                    <button onClick={(e) => { e.stopPropagation(); onOpenChange(false) }} className="text-black/50 hover:text-black transition-colors outline-none cursor-pointer" onMouseDown={(e) => e.stopPropagation()}>
                        {/* Black circle icon from image */}
                        <div className="w-5 h-5 bg-[#15161B] rounded-full" />
                    </button>
                </div>

                <div
                    className="p-4 flex flex-col gap-3 text-white/90 text-sm overflow-y-auto flex-1 column-settings-scroll"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    <style>{`
                        .column-settings-scroll::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {/* Minimum Height */}
                    <div className="h-[50px] pb-2.5 flex items-center justify-between border-b border-[#333]">
                        <span className="font-light text-gray-400">Minimum height</span>
                        <div className="flex items-center">
                            <input
                                value={minHeight === 'auto' ? 'Auto' : minHeight}
                                onChange={(e) => onMinHeightChange(e.target.value)}
                                className="bg-transparent text-right text-white/70 outline-none w-[60px]"
                                placeholder="Auto"
                            />
                        </div>
                    </div>

                    {/* Column Dimensions (New) */}
                    <div className="py-3 border-b border-[#333]">
                        <span className="font-light text-gray-400 text-xs uppercase tracking-wider">Dimensões da coluna</span>

                        {/* Manual Width/Height inputs */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[#666] text-[10px]">Largura (w)</span>
                                <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[30px]">
                                    <input
                                        type="text"
                                        value={columnWidth}
                                        onChange={(e) => onColumnWidthChange?.(e.target.value)}
                                        placeholder="auto"
                                        disabled={isFullWidth}
                                        className="bg-transparent border-none text-white text-xs w-full outline-none disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[#666] text-[10px]">Altura (h)</span>
                                <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[30px]">
                                    <input
                                        type="text"
                                        value={columnHeight}
                                        onChange={(e) => onColumnHeightChange?.(e.target.value)}
                                        placeholder="auto"
                                        disabled={isFullHeight}
                                        className="bg-transparent border-none text-white text-xs w-full outline-none disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Full Width Toggle */}
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-gray-400 text-sm">Largura total</span>
                            <button
                                onClick={() => onFullWidthChange?.(!isFullWidth)}
                                className={cn(
                                    "w-[44px] h-[24px] rounded-full relative transition-colors duration-200",
                                    isFullWidth ? "bg-[#FF0054]" : "bg-[#2A2B35]"
                                )}
                            >
                                <div className={cn(
                                    "w-[20px] h-[20px] rounded-full bg-white absolute top-[2px] transition-transform duration-200 shadow-md",
                                    isFullWidth ? "translate-x-[22px]" : "translate-x-[2px]"
                                )} />
                            </button>
                        </div>

                        {/* Full Height Toggle */}
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-gray-400 text-sm">Altura total</span>
                            <button
                                onClick={() => onFullHeightChange?.(!isFullHeight)}
                                className={cn(
                                    "w-[44px] h-[24px] rounded-full relative transition-colors duration-200",
                                    isFullHeight ? "bg-[#FF0054]" : "bg-[#2A2B35]"
                                )}
                            >
                                <div className={cn(
                                    "w-[20px] h-[20px] rounded-full bg-white absolute top-[2px] transition-transform duration-200 shadow-md",
                                    isFullHeight ? "translate-x-[22px]" : "translate-x-[2px]"
                                )} />
                            </button>
                        </div>
                    </div>

                    {/* Block Gap / Spacing between blocks */}
                    <div className="py-3 border-b border-[#333]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-light text-gray-400">Espaçamento</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min={0}
                                    value={blockGap}
                                    onChange={(e) => onBlockGapChange?.(parseInt(e.target.value) || 0)}
                                    className="bg-[#1A1A20] text-right text-white/70 outline-none w-[40px] px-1 py-0.5 rounded border border-[#333] text-xs"
                                />
                                <span className="text-gray-500 text-xs">px</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {[0, 8, 16, 24, 32].map((gap) => (
                                <button
                                    key={gap}
                                    onClick={() => onBlockGapChange?.(gap)}
                                    className={cn(
                                        "flex-1 h-[28px] flex items-center justify-center rounded transition-colors text-xs",
                                        blockGap === gap
                                            ? "bg-[#FF0054] text-white"
                                            : "bg-[#1A1A20] text-gray-400 hover:bg-[#2A2B35] hover:text-white"
                                    )}
                                >
                                    {gap}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Padding */}
                    <div className="flex flex-col gap-2 border-b border-[#333] pb-4 pt-3">
                        <div className="flex items-center justify-between">
                            <Label className="font-light text-gray-400">Padding</Label>
                            <button
                                onClick={handlePaddingLockChange}
                                className="text-[#666] hover:text-white transition-colors"
                                title={padding.isLocked ? "Unlock individual padding" : "Lock uniform padding"}
                            >
                                {padding.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                        </div>

                        {padding.isLocked ? (
                            /* Locked - Single Value */
                            <div className="flex items-center justify-between w-full mt-2">
                                <span className="text-[#666] text-[10px] font-medium">ALL</span>
                                <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[26px] w-[60px]">
                                    <input
                                        type="text"
                                        value={padding.top}
                                        onChange={(e) => handlePaddingChange('all', e.target.value)}
                                        className="bg-transparent border-none text-white text-xs w-full text-right outline-none px-1"
                                    />
                                    <span className="text-[#666] text-[10px] select-none">px</span>
                                </div>
                            </div>
                        ) : (
                            /* Unlocked - 4 Inputs */
                            <div className="grid grid-cols-4 gap-1">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[#666] text-[9px]">T</span>
                                    <input
                                        type="text"
                                        value={padding.top}
                                        onChange={(e) => handlePaddingChange('top', e.target.value)}
                                        className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[#666] text-[9px]">R</span>
                                    <input
                                        type="text"
                                        value={padding.right}
                                        onChange={(e) => handlePaddingChange('right', e.target.value)}
                                        className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[#666] text-[9px]">B</span>
                                    <input
                                        type="text"
                                        value={padding.bottom}
                                        onChange={(e) => handlePaddingChange('bottom', e.target.value)}
                                        className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[#666] text-[9px]">L</span>
                                    <input
                                        type="text"
                                        value={padding.left}
                                        onChange={(e) => handlePaddingChange('left', e.target.value)}
                                        className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Background Color */}
                    <div className="mt-2.5 h-[50px] pb-2.5 flex items-center justify-between border-b border-[#333]">
                        <span className="font-light text-gray-400">Background color</span>
                        <div className="relative w-6 h-6 rounded-full overflow-hidden cursor-pointer ring-1 ring-white/10" style={{ backgroundColor }}>
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => onBackgroundColorChange(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Upload background */}
                    <div className="mt-2.5 h-[50px] pb-2.5 flex items-center justify-between border-b border-[#333] cursor-pointer hover:bg-white/5 transition-colors" onClick={onUploadBackground}>
                        <span className="font-light text-gray-400">Upload background</span>
                        {/* No icon in screenshot, just text? Or implies action. I'll leave as text row for now. Image has no Right component. */}
                    </div>

                    {/* Radius */}
                    <div className="mt-2.5 h-[50px] pb-2.5 flex items-center justify-between border-b border-[#333]">
                        <span className="font-light text-gray-400">Radius</span>
                        <input
                            type="number"
                            min={0}
                            value={radius}
                            onChange={(e) => onRadiusChange(parseInt(e.target.value) || 0)}
                            className="bg-transparent text-right text-white/70 outline-none w-[60px]"
                        />
                    </div>

                    {/* Border */}
                    <div className="mt-2.5 h-[50px] pb-2.5 flex items-center justify-between border-b border-[#333]">
                        <span className="font-light text-gray-400">Border</span>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={0}
                                value={borderWidth}
                                onChange={(e) => onBorderWidthChange(parseInt(e.target.value) || 0)}
                                className="bg-transparent text-right text-white/70 outline-none w-[40px]"
                            />
                            {/* Border Style Selector */}
                            <select
                                value={borderStyle || 'dashed'} // Default dashed logic
                                onChange={(e) => onBorderStyleChange(e.target.value)}
                                className="bg-[#15161B] text-white/70 text-xs outline-none border border-white/10 rounded h-6 w-[70px]"
                            >
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                            <div className="relative w-6 h-6 rounded-full overflow-hidden cursor-pointer ring-1 ring-white/10" style={{ backgroundColor: borderColor }}>
                                <input
                                    type="color"
                                    value={borderColor}
                                    onChange={(e) => onBorderColorChange(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Free Flow Toggle */}
                    <div className="mt-2.5 h-[50px] pb-2.5 flex items-center justify-between border-b border-[#333]">
                        <span className="font-light text-gray-400">Free-flow grid</span>
                        <button
                            onClick={() => onFreeFlowChange?.(!isFreeFlow)}
                            className={cn(
                                "w-[44px] h-[24px] rounded-full relative transition-colors duration-200",
                                isFreeFlow ? "bg-[#FF0054]" : "bg-[#2A2B35]"
                            )}
                        >
                            <div className={cn(
                                "w-[20px] h-[20px] rounded-full bg-white absolute top-[2px] transition-transform duration-200 shadow-md",
                                isFreeFlow ? "translate-x-[22px]" : "translate-x-[2px]"
                            )} />
                        </button>
                    </div>

                    {/* Fixed position */}
                    <div className="mt-2.5 h-[50px] pb-2.5 flex items-center justify-between border-b border-[#333]">
                        <span className="font-light text-gray-400">Fixed position</span>
                        <button
                            onClick={() => onFixedChange(!isFixed)}
                            className={cn(
                                "w-[44px] h-[24px] rounded-full relative transition-colors duration-200",
                                isFixed ? "bg-[#FF0054]" : "bg-[#2A2B35]"
                            )}
                        >
                            <div className={cn(
                                "w-[20px] h-[20px] rounded-full bg-white absolute top-[2px] transition-transform duration-200 shadow-md",
                                isFixed ? "translate-x-[22px]" : "translate-x-[2px]"
                            )} />
                        </button>
                    </div>

                    {/* Alignment Section */}
                    <div className="flex flex-col gap-2 py-3 border-b border-[#333]">
                        <span className="font-light text-gray-400 text-xs uppercase tracking-wider">Alinhamento</span>
                        <div className="flex gap-1 w-full bg-[#1A1A20] rounded-[4px] p-1">
                            {/* Horizontal Alignment */}
                            <button
                                onClick={() => onAlignHorizontalChange?.('left')}
                                className={cn(
                                    "flex-1 h-[28px] flex items-center justify-center rounded-[2px] transition-colors",
                                    alignHorizontal === 'left' ? "bg-[#FF0054] text-white" : "text-[#666] hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Alinhar à esquerda"
                            >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="2" width="1.5" height="10" fill="currentColor" />
                                    <rect x="4" y="4" width="6" height="2" fill="currentColor" />
                                    <rect x="4" y="8" width="8" height="2" fill="currentColor" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onAlignHorizontalChange?.('center')}
                                className={cn(
                                    "flex-1 h-[28px] flex items-center justify-center rounded-[2px] transition-colors",
                                    alignHorizontal === 'center' ? "bg-[#FF0054] text-white" : "text-[#666] hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Centralizar horizontalmente"
                            >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="6.25" y="2" width="1.5" height="10" fill="currentColor" />
                                    <rect x="3" y="4" width="8" height="2" fill="currentColor" />
                                    <rect x="2" y="8" width="10" height="2" fill="currentColor" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onAlignHorizontalChange?.('right')}
                                className={cn(
                                    "flex-1 h-[28px] flex items-center justify-center rounded-[2px] transition-colors",
                                    alignHorizontal === 'right' ? "bg-[#FF0054] text-white" : "text-[#666] hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Alinhar à direita"
                            >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="11.5" y="2" width="1.5" height="10" fill="currentColor" />
                                    <rect x="4" y="4" width="6" height="2" fill="currentColor" />
                                    <rect x="2" y="8" width="8" height="2" fill="currentColor" />
                                </svg>
                            </button>

                            <div className="w-[1px] h-[20px] bg-[#333] self-center mx-1" />

                            {/* Vertical Alignment */}
                            <button
                                onClick={() => onAlignVerticalChange?.('top')}
                                className={cn(
                                    "flex-1 h-[28px] flex items-center justify-center rounded-[2px] transition-colors",
                                    alignVertical === 'top' ? "bg-[#FF0054] text-white" : "text-[#666] hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Alinhar ao topo"
                            >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="2" y="1" width="10" height="1.5" fill="currentColor" />
                                    <rect x="4" y="4" width="2" height="6" fill="currentColor" />
                                    <rect x="8" y="4" width="2" height="8" fill="currentColor" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onAlignVerticalChange?.('middle')}
                                className={cn(
                                    "flex-1 h-[28px] flex items-center justify-center rounded-[2px] transition-colors",
                                    alignVertical === 'middle' ? "bg-[#FF0054] text-white" : "text-[#666] hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Centralizar verticalmente"
                            >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="2" y="6.25" width="10" height="1.5" fill="currentColor" />
                                    <rect x="4" y="3" width="2" height="8" fill="currentColor" />
                                    <rect x="8" y="2" width="2" height="10" fill="currentColor" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onAlignVerticalChange?.('bottom')}
                                className={cn(
                                    "flex-1 h-[28px] flex items-center justify-center rounded-[2px] transition-colors",
                                    alignVertical === 'bottom' ? "bg-[#FF0054] text-white" : "text-[#666] hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Alinhar ao fundo"
                            >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="2" y="11.5" width="10" height="1.5" fill="currentColor" />
                                    <rect x="4" y="4" width="2" height="6" fill="currentColor" />
                                    <rect x="8" y="2" width="2" height="8" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="p-4 mt-2 flex justify-center">
                        <button
                            onClick={onReset}
                            className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors uppercase tracking-wider"
                        >
                            Reset to default
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover >
    )
}
