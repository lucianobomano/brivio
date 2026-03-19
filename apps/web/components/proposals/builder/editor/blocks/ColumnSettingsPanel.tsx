import React from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Upload } from "lucide-react"

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
                style={{ zIndex: 100, transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
            >
                {/* Header: Pink background, "Column settings", Circle icon */}
                <div
                    className="h-[48px] bg-[#FF0054] flex items-center justify-between px-4 shrink-0 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                >
                    <span className="text-white font-medium text-[15px]">Column settings</span>
                    <button onClick={() => onOpenChange(false)} className="text-black/50 hover:text-black transition-colors outline-none cursor-pointer" onMouseDown={(e) => e.stopPropagation()}>
                        {/* Black circle icon from image */}
                        <div className="w-5 h-5 bg-[#15161B] rounded-full" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-0 text-white/90 text-sm">
                    {/* Minimum Height */}
                    <div className="h-[50px] flex items-center justify-between border-b border-[#333]">
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

                    {/* Background Color */}
                    <div className="h-[50px] flex items-center justify-between border-b border-[#333]">
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
                    <div className="h-[50px] flex items-center justify-between border-b border-[#333] cursor-pointer hover:bg-white/5 transition-colors" onClick={onUploadBackground}>
                        <span className="font-light text-gray-400">Ubload backgroun</span>
                        {/* No icon in screenshot, just text? Or implies action. I'll leave as text row for now. Image has no Right component. */}
                    </div>

                    {/* Radius */}
                    <div className="h-[50px] flex items-center justify-between border-b border-[#333]">
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
                    <div className="h-[50px] flex items-center justify-between border-b border-[#333]">
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

                    {/* Fixed position */}
                    <div className="h-[50px] flex items-center justify-between">
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

                    {/* Reset Button */}
                    <div className="p-4 border-t border-[#333] mt-2 flex justify-center">
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
