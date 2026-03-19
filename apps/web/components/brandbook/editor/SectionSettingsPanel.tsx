import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
    X,
    RotateCcw,
    Scissors,
    LayoutGrid,
    Copy,
    Trash2,
    Lock,
    Unlock,
    Upload,
    Loader2,
    Plus,
    Minus
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"

export interface GradientStop {
    color: string
    offset: number // 0 to 100
}

export interface SectionGradient {
    type: 'linear' | 'radial'
    angle: number
    stops: GradientStop[]
}

// Define the settings shape matching our UI controls
export interface SectionSettings {
    columns: number
    padding: {
        isLocked: boolean
        top: number
        right: number
        bottom: number
        left: number
    }
    sectionPadding?: {
        isLocked: boolean
        top: number
        right: number
        bottom: number
        left: number
    }
    height: string
    aspectRatio: string
    isZoomImage: boolean
    isVisible: boolean
    backgroundImage?: string
    backgroundColor?: string
    backgroundType?: 'color' | 'image' | 'gradient'
    backgroundGradient?: SectionGradient
    gridOption?: number
    isGridUnlocked?: boolean
    distribution?: string
    rowPadding?: string
    columnWidths?: number[]
    isFullWidth?: boolean
    isFullHeight?: boolean
    alignHorizontal?: 'left' | 'center' | 'right'
    alignVertical?: 'top' | 'middle' | 'bottom'
    noColumnGap?: boolean
    columnGap?: number
}

interface SectionSettingsPanelProps {
    settings?: Partial<SectionSettings>
    onUpdate: (newSettings: SectionSettings) => void
    onClose: () => void
    // Actions
    onCut: () => void
    onSaveAsComponent: () => void
    onDuplicate: () => void
    onCopy: () => void
    onDelete: () => void
    initialTop?: number
    initialLeft?: number
    brandId: string
    moduleId: string
}

export function SectionSettingsPanel({
    settings,
    onUpdate,
    onClose,
    onCut,
    onSaveAsComponent,
    onDuplicate,
    onCopy,
    onDelete,
    initialTop = 100,
    initialLeft = 100,
    brandId,
    moduleId
}: SectionSettingsPanelProps) {
    const [selectedTab, setSelectedTab] = useState<'image' | 'color' | 'gradient'>(settings?.backgroundType || 'color')

    // Initialize state from props or defaults
    const [selectedCol, setSelectedCol] = useState(settings?.columns || 1)

    const [isPaddingLocked, setIsPaddingLocked] = useState(settings?.padding?.isLocked ?? true)
    const [paddingTop, setPaddingTop] = useState(settings?.padding?.top || 0)
    const [paddingRight, setPaddingRight] = useState(settings?.padding?.right || 0)
    const [paddingBottom, setPaddingBottom] = useState(settings?.padding?.bottom || 0)
    const [paddingLeft, setPaddingLeft] = useState(settings?.padding?.left || 0)

    const [isSectionPaddingLocked, setIsSectionPaddingLocked] = useState(settings?.sectionPadding?.isLocked ?? true)
    const [secPaddingTop, setSecPaddingTop] = useState(settings?.sectionPadding?.top || 0)
    const [secPaddingRight, setSecPaddingRight] = useState(settings?.sectionPadding?.right || 0)
    const [secPaddingBottom, setSecPaddingBottom] = useState(settings?.sectionPadding?.bottom || 0)
    const [secPaddingLeft, setSecPaddingLeft] = useState(settings?.sectionPadding?.left || 0)

    const [selectedHeight, setSelectedHeight] = useState(settings?.height || '')
    const [selectedRatio, setSelectedRatio] = useState(settings?.aspectRatio || '')
    const [gridOption, setGridOption] = useState(settings?.gridOption || 0)
    const [isGridUnlocked, setIsGridUnlocked] = useState(settings?.isGridUnlocked || false)
    const [distribution, setDistribution] = useState(settings?.distribution || 'between-full')
    const [rowPadding, setRowPadding] = useState(settings?.rowPadding || 'S')
    const [isZoomImage, setIsZoomImage] = useState(settings?.isZoomImage || false)
    const [isVisible, setIsVisible] = useState(settings?.isVisible ?? true)
    const [backgroundImage, setBackgroundImage] = useState(settings?.backgroundImage)
    const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor || 'transparent')
    const [isFullWidth, setIsFullWidth] = useState(settings?.isFullWidth || false)
    const [isFullHeight, setIsFullHeight] = useState(settings?.isFullHeight || false)
    const [alignHorizontal, setAlignHorizontal] = useState<'left' | 'center' | 'right'>(settings?.alignHorizontal || 'center')
    const [alignVertical, setAlignVertical] = useState<'top' | 'middle' | 'bottom'>(settings?.alignVertical || 'top')
    const [noColumnGap, setNoColumnGap] = useState(settings?.noColumnGap || false)
    const [columnGap, setColumnGap] = useState(settings?.columnGap ?? 32)

    // Store previous padding values for restoration
    const [prevSecPaddingLeft, setPrevSecPaddingLeft] = useState(settings?.sectionPadding?.left || 40)
    const [prevSecPaddingRight, setPrevSecPaddingRight] = useState(settings?.sectionPadding?.right || 40)
    const [prevSecPaddingTop, setPrevSecPaddingTop] = useState(settings?.sectionPadding?.top || 40)
    const [prevSecPaddingBottom, setPrevSecPaddingBottom] = useState(settings?.sectionPadding?.bottom || 40)

    const [backgroundGradient, setBackgroundGradient] = useState<SectionGradient>(settings?.backgroundGradient || {
        type: 'linear',
        angle: 90,
        stops: [
            { color: '#FF0054', offset: 0 },
            { color: '#0000FF', offset: 100 }
        ]
    })

    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
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
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
    }

    // Helper to emit updates
    const emitUpdate = (updates: Partial<SectionSettings>) => {
        const currentSettings: SectionSettings = {
            columns: selectedCol,
            padding: {
                isLocked: isPaddingLocked,
                top: paddingTop,
                right: paddingRight,
                bottom: paddingBottom,
                left: paddingLeft
            },
            sectionPadding: {
                isLocked: isSectionPaddingLocked,
                top: secPaddingTop,
                right: secPaddingRight,
                bottom: secPaddingBottom,
                left: secPaddingLeft
            },
            height: selectedHeight,
            aspectRatio: selectedRatio,
            gridOption: gridOption,
            isGridUnlocked: isGridUnlocked,
            distribution: distribution,
            rowPadding: rowPadding,
            isZoomImage: isZoomImage,
            isVisible: isVisible,
            backgroundImage: backgroundImage,
            backgroundColor: backgroundColor,
            backgroundType: selectedTab,
            backgroundGradient: backgroundGradient,
            isFullWidth: isFullWidth,
            isFullHeight: isFullHeight,
            alignHorizontal: alignHorizontal,
            alignVertical: alignVertical,
            noColumnGap: noColumnGap,
            columnGap: columnGap
        }
        // Merge with existing settings to preserve unmanaged fields (like columnWidths)
        onUpdate({ ...(settings || {}), ...currentSettings, ...updates })
    }

    // Effect to sync separate states if needed? 
    // Ideally we just call emitUpdate on every change.

    const handleColChange = (col: number) => {
        setSelectedCol(col)
        setSelectedCol(col)
        // Reset columns widths and options when column count changes
        emitUpdate({ columns: col, columnWidths: undefined, gridOption: 0 })
    }

    const handleHeightChange = (size: string) => {
        setSelectedHeight(size)
        emitUpdate({ height: size })
    }

    const handleRatioChange = (ratio: string) => {
        setSelectedRatio(ratio)
        emitUpdate({ aspectRatio: ratio })
    }

    const handleGridOptionChange = (opt: number) => {
        setGridOption(opt)
        // Reset custom widths when a standard preset is chosen and Lock grid
        setIsGridUnlocked(false)
        emitUpdate({ gridOption: opt, columnWidths: undefined, isGridUnlocked: false })
    }

    const handleGridUnlockChange = (unlocked: boolean) => {
        setIsGridUnlocked(unlocked)
        // If unlocking, clear the specific grid preset visual (set to -1) so it shows as "Custom"
        if (unlocked) {
            setGridOption(-1)
            emitUpdate({ isGridUnlocked: unlocked, gridOption: undefined })
        } else {
            emitUpdate({ isGridUnlocked: unlocked })
        }
    }

    const handleDistributionChange = (dist: string) => {
        setDistribution(dist)
        emitUpdate({ distribution: dist })
    }

    const handleRowPaddingPreset = (preset: 'S' | 'M' | 'L' | 'XL') => {
        setRowPadding(preset)
        // Apply styling logic
        let t = secPaddingTop
        let b = secPaddingBottom

        if (preset === 'S') {
            t = 40; b = 40;
        } else if (preset === 'M') {
            t = 0; b = 0;
        } else if (preset === 'L') {
            b = 0;
        } else if (preset === 'XL') {
            t = 0;
        }

        setSecPaddingTop(t)
        setSecPaddingBottom(b)

        emitUpdate({
            rowPadding: preset,
            sectionPadding: {
                isLocked: isSectionPaddingLocked,
                top: t, right: secPaddingRight, bottom: b, left: secPaddingLeft
            }
        })
    }

    const handleZoomImageChange = (val: boolean) => {
        setIsZoomImage(val)
        emitUpdate({ isZoomImage: val })
    }

    const handleVisibleChange = (val: boolean) => {
        setIsVisible(val)
        emitUpdate({ isVisible: val })
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && brandId) {
            setIsUploading(true)
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('brandId', brandId)
                formData.append('moduleId', moduleId)

                const result = await uploadBrandbookMedia(formData)
                if (result.success && result.url) {
                    setBackgroundImage(result.url)
                    emitUpdate({ backgroundImage: result.url })
                } else {
                    console.error('Failed to upload background image:', result.error)
                    alert('Erro ao carregar imagem de fundo.')
                }
            } catch (err) {
                console.error('Error in handleImageChange:', err)
            } finally {
                setIsUploading(false)
            }
        }
    }

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value
        setBackgroundColor(color)
        emitUpdate({ backgroundColor: color })
    }

    const handleFullWidthChange = () => {
        const newVal = !isFullWidth
        setIsFullWidth(newVal)

        if (newVal) {
            // Enabling Full Width: Unlock section padding, save current L/R values, set L/R to 0
            setPrevSecPaddingLeft(secPaddingLeft || 40)
            setPrevSecPaddingRight(secPaddingRight || 40)
            setIsSectionPaddingLocked(false)
            setSecPaddingLeft(0)
            setSecPaddingRight(0)
            emitUpdate({
                isFullWidth: newVal,
                sectionPadding: {
                    isLocked: false,
                    top: secPaddingTop || 40,
                    bottom: secPaddingBottom || 40,
                    left: 0,
                    right: 0
                }
            })
        } else {
            // Disabling Full Width: Lock section padding, restore L/R values
            setIsSectionPaddingLocked(true)
            setSecPaddingLeft(prevSecPaddingLeft)
            setSecPaddingRight(prevSecPaddingRight)
            emitUpdate({
                isFullWidth: newVal,
                sectionPadding: {
                    isLocked: true,
                    top: secPaddingTop,
                    bottom: secPaddingBottom,
                    left: prevSecPaddingLeft,
                    right: prevSecPaddingRight
                }
            })
        }
    }

    const handleFullHeightChange = () => {
        const newVal = !isFullHeight
        setIsFullHeight(newVal)

        if (newVal) {
            // Enabling Full Height: Unlock section padding, save current T/B values, set T/B to 0
            setPrevSecPaddingTop(secPaddingTop || 40)
            setPrevSecPaddingBottom(secPaddingBottom || 40)
            setIsSectionPaddingLocked(false)
            setSecPaddingTop(0)
            setSecPaddingBottom(0)
            emitUpdate({
                isFullHeight: newVal,
                sectionPadding: {
                    isLocked: false,
                    top: 0,
                    bottom: 0,
                    left: secPaddingLeft || 40,
                    right: secPaddingRight || 40
                }
            })
        } else {
            // Disabling Full Height: Lock section padding, restore T/B values
            setIsSectionPaddingLocked(true)
            setSecPaddingTop(prevSecPaddingTop)
            setSecPaddingBottom(prevSecPaddingBottom)
            emitUpdate({
                isFullHeight: newVal,
                sectionPadding: {
                    isLocked: true,
                    top: prevSecPaddingTop,
                    bottom: prevSecPaddingBottom,
                    left: secPaddingLeft,
                    right: secPaddingRight
                }
            })
        }
    }

    const handleNoColumnGapChange = () => {
        const newVal = !noColumnGap
        setNoColumnGap(newVal)
        emitUpdate({ noColumnGap: newVal })
    }

    const handleColumnGapChange = (val: string) => {
        const num = parseInt(val) || 0
        setColumnGap(num)
        emitUpdate({ columnGap: num })
    }

    const handleGradientChange = (updates: Partial<SectionGradient>) => {
        const newGradient = { ...backgroundGradient, ...updates }
        setBackgroundGradient(newGradient)
        emitUpdate({ backgroundType: 'gradient', backgroundGradient: newGradient })
    }

    const handleAddGradientStop = () => {
        const lastStop = backgroundGradient.stops[backgroundGradient.stops.length - 1]
        const newOffset = Math.min(100, lastStop.offset + 10)
        const newStops = [...backgroundGradient.stops, { color: '#FFFFFF', offset: newOffset }]
        handleGradientChange({ stops: newStops })
    }

    const handleRemoveGradientStop = (index: number) => {
        if (backgroundGradient.stops.length <= 2) return // Keep at least 2 stops
        const newStops = backgroundGradient.stops.filter((_, i) => i !== index)
        handleGradientChange({ stops: newStops })
    }

    const handleUpdateGradientStop = (index: number, updates: Partial<GradientStop>) => {
        const newStops = backgroundGradient.stops.map((stop, i) =>
            i === index ? { ...stop, ...updates } : stop
        )
        handleGradientChange({ stops: newStops })
    }

    const handlePaddingLockChange = () => {
        const newVal = !isPaddingLocked
        setIsPaddingLocked(newVal)
        emitUpdate({
            padding: {
                isLocked: newVal,
                top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft
            }
        })
    }

    const handlePaddingChange = (side: 'all' | 'top' | 'right' | 'bottom' | 'left', value: string) => {
        const numVal = parseInt(value, 10) || 0
        if (side === 'all') {
            setPaddingTop(numVal)
            setPaddingRight(numVal)
            setPaddingBottom(numVal)
            setPaddingLeft(numVal)
        } else if (side === 'top') setPaddingTop(numVal)
        else if (side === 'right') setPaddingRight(numVal)
        else if (side === 'bottom') setPaddingBottom(numVal)
        else if (side === 'left') setPaddingLeft(numVal)

        const newPadding = {
            isLocked: isPaddingLocked,
            top: side === 'all' || side === 'top' ? numVal : paddingTop,
            right: side === 'all' || side === 'right' ? numVal : paddingRight,
            bottom: side === 'all' || side === 'bottom' ? numVal : paddingBottom,
            left: side === 'all' || side === 'left' ? numVal : paddingLeft,
        }
        emitUpdate({ padding: newPadding })
    }

    const handleSectionPaddingLockChange = () => {
        const newVal = !isSectionPaddingLocked
        setIsSectionPaddingLocked(newVal)
        emitUpdate({
            sectionPadding: {
                isLocked: newVal,
                top: secPaddingTop, right: secPaddingRight, bottom: secPaddingBottom, left: secPaddingLeft
            }
        })
    }

    const handleSectionPaddingChange = (side: 'all' | 'top' | 'right' | 'bottom' | 'left', value: string) => {
        const numVal = parseInt(value, 10) || 0
        if (side === 'all') {
            setSecPaddingTop(numVal)
            setSecPaddingRight(numVal)
            setSecPaddingBottom(numVal)
            setSecPaddingLeft(numVal)
        } else if (side === 'top') setSecPaddingTop(numVal)
        else if (side === 'right') setSecPaddingRight(numVal)
        else if (side === 'bottom') setSecPaddingBottom(numVal)
        else if (side === 'left') setSecPaddingLeft(numVal)

        const newPadding = {
            isLocked: isSectionPaddingLocked,
            top: side === 'all' || side === 'top' ? numVal : secPaddingTop,
            right: side === 'all' || side === 'right' ? numVal : secPaddingRight,
            bottom: side === 'all' || side === 'bottom' ? numVal : secPaddingBottom,
            left: side === 'all' || side === 'left' ? numVal : secPaddingLeft,
        }
        emitUpdate({ sectionPadding: newPadding })
    }


    return createPortal(
        <div
            className="fixed z-[900] bg-[#1F1F25] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: initialTop,
                left: initialLeft,
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: '270px',
                height: '760px'
            }}
        >
            {/* Header */}
            <div
                className="h-[60px] bg-[#FF0054] px-5 flex items-center justify-between shrink-0 cursor-all-scroll active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <span className="text-white font-semibold text-[16px]">Edit section</span>
                <button
                    onClick={onClose}
                    className="w-[20px] h-[20px] bg-black rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                    <X className="w-3 h-3 text-white" strokeWidth={3} />
                </button>
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">

                {/* 1. Coluna */}
                <div className="flex flex-col gap-2">
                    <span className="text-[#97A1B3] text-[0.75rem] font-medium">Coluna</span>
                    <div className="flex gap-2 w-full">
                        {/* Option 1: 1 Col (Active) */}
                        <button
                            onClick={() => handleColChange(1)}
                            className={cn(
                                "flex-1 h-[35px] border rounded-[2px] transition-all relative",
                                selectedCol === 1
                                    ? "border-[#FF0054] shadow-[0_0_0_1px_rgba(255,0,80,0.1)]"
                                    : "border-[#333] hover:border-[#666]"
                            )}
                        >
                            <div className="absolute inset-[3px] border border-[#444] rounded-[1px]" />
                        </button>

                        {/* Option 2: 2 Cols */}
                        <button
                            onClick={() => handleColChange(2)}
                            className={cn(
                                "flex-1 h-[35px] border rounded-[2px] transition-all relative flex gap-[1px] p-[3px]",
                                selectedCol === 2
                                    ? "border-[#FF0054] shadow-[0_0_0_1px_rgba(255,0,80,0.1)]"
                                    : "border-[#333] hover:border-[#666]"
                            )}
                        >
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                        </button>

                        {/* Option 3: 3 Cols */}
                        <button
                            onClick={() => handleColChange(3)}
                            className={cn(
                                "flex-1 h-[35px] border rounded-[2px] transition-all relative flex gap-[1px] p-[3px]",
                                selectedCol === 3
                                    ? "border-[#FF0054] shadow-[0_0_0_1px_rgba(255,0,80,0.1)]"
                                    : "border-[#333] hover:border-[#666]"
                            )}
                        >
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                        </button>

                        {/* Option 4: 4 Cols */}
                        <button
                            onClick={() => handleColChange(4)}
                            className={cn(
                                "flex-1 h-[35px] border rounded-[2px] transition-all relative flex gap-[1px] p-[3px]",
                                selectedCol === 4
                                    ? "border-[#FF0054] shadow-[0_0_0_1px_rgba(255,0,80,0.1)]"
                                    : "border-[#333] hover:border-[#666]"
                            )}
                        >
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                            <div className="flex-1 border border-[#444] rounded-[1px]" />
                        </button>
                    </div>
                </div>

                {/* Alignment Section */}
                <div className="flex flex-col gap-2 border-b border-[#333] pb-4">
                    <span className="text-[#97A1B3] text-[0.75rem] font-medium">Alinhamento</span>
                    <div className="flex gap-1 w-full bg-[#15161B] rounded-[4px] p-1">
                        {/* Horizontal Alignment */}
                        <button
                            onClick={() => { setAlignHorizontal('left'); emitUpdate({ alignHorizontal: 'left' }) }}
                            className={cn(
                                "flex-1 h-[30px] flex items-center justify-center rounded-[2px] transition-colors",
                                alignHorizontal === 'left' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                            )}
                            title="Alinhar à esquerda"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="2" width="1.5" height="10" fill="currentColor" />
                                <rect x="4" y="4" width="6" height="2" fill="currentColor" />
                                <rect x="4" y="8" width="8" height="2" fill="currentColor" />
                            </svg>
                        </button>
                        <button
                            onClick={() => { setAlignHorizontal('center'); emitUpdate({ alignHorizontal: 'center' }) }}
                            className={cn(
                                "flex-1 h-[30px] flex items-center justify-center rounded-[2px] transition-colors",
                                alignHorizontal === 'center' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                            )}
                            title="Centralizar horizontalmente"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="6.25" y="2" width="1.5" height="10" fill="currentColor" />
                                <rect x="3" y="4" width="8" height="2" fill="currentColor" />
                                <rect x="2" y="8" width="10" height="2" fill="currentColor" />
                            </svg>
                        </button>
                        <button
                            onClick={() => { setAlignHorizontal('right'); emitUpdate({ alignHorizontal: 'right' }) }}
                            className={cn(
                                "flex-1 h-[30px] flex items-center justify-center rounded-[2px] transition-colors",
                                alignHorizontal === 'right' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                            )}
                            title="Alinhar à direita"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="11.5" y="2" width="1.5" height="10" fill="currentColor" />
                                <rect x="4" y="4" width="6" height="2" fill="currentColor" />
                                <rect x="2" y="8" width="8" height="2" fill="currentColor" />
                            </svg>
                        </button>

                        <div className="w-[1px] h-[22px] bg-[#333] self-center mx-1" />

                        {/* Vertical Alignment */}
                        <button
                            onClick={() => { setAlignVertical('top'); emitUpdate({ alignVertical: 'top' }) }}
                            className={cn(
                                "flex-1 h-[30px] flex items-center justify-center rounded-[2px] transition-colors",
                                alignVertical === 'top' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                            )}
                            title="Alinhar ao topo"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="1" width="10" height="1.5" fill="currentColor" />
                                <rect x="4" y="4" width="2" height="6" fill="currentColor" />
                                <rect x="8" y="4" width="2" height="8" fill="currentColor" />
                            </svg>
                        </button>
                        <button
                            onClick={() => { setAlignVertical('middle'); emitUpdate({ alignVertical: 'middle' }) }}
                            className={cn(
                                "flex-1 h-[30px] flex items-center justify-center rounded-[2px] transition-colors",
                                alignVertical === 'middle' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                            )}
                            title="Centralizar verticalmente"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="6.25" width="10" height="1.5" fill="currentColor" />
                                <rect x="4" y="3" width="2" height="8" fill="currentColor" />
                                <rect x="8" y="2" width="2" height="10" fill="currentColor" />
                            </svg>
                        </button>
                        <button
                            onClick={() => { setAlignVertical('bottom'); emitUpdate({ alignVertical: 'bottom' }) }}
                            className={cn(
                                "flex-1 h-[30px] flex items-center justify-center rounded-[2px] transition-colors",
                                alignVertical === 'bottom' ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                            )}
                            title="Alinhar ao fundo"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="11.5" width="10" height="1.5" fill="currentColor" />
                                <rect x="4" y="4" width="2" height="6" fill="currentColor" />
                                <rect x="8" y="2" width="2" height="8" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>


                {/* 2.5 Largura Total */}
                <div className="flex items-center justify-between mt-4">
                    <Label className="mb-0 text-[#97A1B3]">Largura total da coluna</Label>
                    <div
                        className={cn(
                            "w-[36px] h-[20px] rounded-[999px] relative cursor-pointer transition-colors",
                            isFullWidth ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                        )}
                        onClick={handleFullWidthChange}
                    >
                        <div className={cn(
                            "w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                            isFullWidth ? "right-[2px]" : "left-[2px]"
                        )} />
                    </div>
                </div>

                {/* 2.6 Altura Total */}
                <div className="flex items-center justify-between mt-4">
                    <Label className="mb-0 text-[#97A1B3]">Altura total da coluna</Label>
                    <div
                        className={cn(
                            "w-[36px] h-[20px] rounded-[999px] relative cursor-pointer transition-colors",
                            isFullHeight ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                        )}
                        onClick={handleFullHeightChange}
                    >
                        <div className={cn(
                            "w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                            isFullHeight ? "right-[2px]" : "left-[2px]"
                        )} />
                    </div>
                </div>

                {/* 3. Padding Column */}
                <div className="flex flex-col gap-2 border-b border-[#333] pb-4">
                    <div className="flex items-center justify-between">
                        <Label className="mb-0 text-[#97A1B3]">Padding column</Label>
                        <button
                            onClick={handlePaddingLockChange}
                            className="text-[#97A1B3] hover:text-white transition-colors"
                            title={isPaddingLocked ? "Unlock individual padding" : "Lock uniform padding"}
                        >
                            {isPaddingLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                    </div>

                    {isPaddingLocked ? (
                        /* Locked - Single Value */
                        <div className="flex items-center justify-between w-full mt-2">
                            <span className="text-[#97A1B3] text-[10px] font-medium">ALL</span>
                            <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[26px] w-[60px]">
                                <input
                                    type="text"
                                    value={paddingTop}
                                    onChange={(e) => handlePaddingChange('all', e.target.value)}
                                    className="bg-transparent border-none text-white text-xs w-full text-right outline-none px-1"
                                />
                                <span className="text-[#97A1B3] text-[10px] select-none">px</span>
                            </div>
                        </div>
                    ) : (
                        /* Unlocked - 4 Inputs */
                        <div className="grid grid-cols-4 gap-1">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[#97A1B3] text-[9px]">T</span>
                                <input
                                    type="text"
                                    value={paddingTop}
                                    onChange={(e) => handlePaddingChange('top', e.target.value)}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                />
                            </div>
                            <div className={cn("flex flex-col items-center gap-1", isFullWidth && "opacity-30")}>
                                <span className="text-[#97A1B3] text-[9px]">R</span>
                                <input
                                    type="text"
                                    value={isFullWidth ? 0 : paddingRight}
                                    onChange={(e) => handlePaddingChange('right', e.target.value)}
                                    disabled={isFullWidth}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[#97A1B3] text-[9px]">B</span>
                                <input
                                    type="text"
                                    value={paddingBottom}
                                    onChange={(e) => handlePaddingChange('bottom', e.target.value)}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                />
                            </div>
                            <div className={cn("flex flex-col items-center gap-1", isFullWidth && "opacity-30")}>
                                <span className="text-[#97A1B3] text-[9px]">L</span>
                                <input
                                    type="text"
                                    value={isFullWidth ? 0 : paddingLeft}
                                    onChange={(e) => handlePaddingChange('left', e.target.value)}
                                    disabled={isFullWidth}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3.5. Padding section (Moved Here) */}
                <div className="flex flex-col gap-2 border-b border-[#333] pb-4">
                    <div className="flex items-center justify-between">
                        <Label className="mb-0 text-[#97A1B3]">Padding section</Label>
                        <button
                            onClick={handleSectionPaddingLockChange}
                            className="text-[#97A1B3] hover:text-white transition-colors"
                            title={isSectionPaddingLocked ? "Unlock individual padding" : "Lock uniform padding"}
                        >
                            {isSectionPaddingLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                    </div>

                    {isSectionPaddingLocked ? (
                        /* Locked - Single Value */
                        <div className="flex items-center justify-between w-full mt-2">
                            <span className="text-[#97A1B3] text-[10px] font-medium">ALL</span>
                            <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[26px] w-[60px]">
                                <input
                                    type="text"
                                    value={secPaddingTop}
                                    onChange={(e) => handleSectionPaddingChange('all', e.target.value)}
                                    className="bg-transparent border-none text-white text-xs w-full text-right outline-none px-1"
                                />
                                <span className="text-[#97A1B3] text-[10px] select-none">px</span>
                            </div>
                        </div>
                    ) : (
                        /* Unlocked - 4 Inputs */
                        <div className="grid grid-cols-4 gap-1">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[#97A1B3] text-[9px]">T</span>
                                <input
                                    type="text"
                                    value={secPaddingTop}
                                    onChange={(e) => handleSectionPaddingChange('top', e.target.value)}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                />
                            </div>
                            <div className={cn("flex flex-col items-center gap-1", isFullWidth && "opacity-30")}>
                                <span className="text-[#97A1B3] text-[9px]">R</span>
                                <input
                                    type="text"
                                    value={isFullWidth ? 0 : secPaddingRight}
                                    onChange={(e) => handleSectionPaddingChange('right', e.target.value)}
                                    disabled={isFullWidth}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[#97A1B3] text-[9px]">B</span>
                                <input
                                    type="text"
                                    value={secPaddingBottom}
                                    onChange={(e) => handleSectionPaddingChange('bottom', e.target.value)}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                />
                            </div>
                            <div className={cn("flex flex-col items-center gap-1", isFullWidth && "opacity-30")}>
                                <span className="text-[#97A1B3] text-[9px]">L</span>
                                <input
                                    type="text"
                                    value={isFullWidth ? 0 : secPaddingLeft}
                                    onChange={(e) => handleSectionPaddingChange('left', e.target.value)}
                                    disabled={isFullWidth}
                                    className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3.6 Espaçamento entre colunas */}
                <div className="flex flex-col gap-3 py-4 border-b border-[#333]">
                    <div className="flex items-center justify-between">
                        <Label className="mb-0 text-[#97A1B3]">Sem espaçamento entre colunas</Label>
                        <div
                            className={cn(
                                "w-[36px] h-[20px] rounded-[999px] relative cursor-pointer transition-colors",
                                noColumnGap ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                            )}
                            onClick={handleNoColumnGapChange}
                        >
                            <div className={cn(
                                "w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                noColumnGap ? "right-[2px]" : "left-[2px]"
                            )} />
                        </div>
                    </div>

                    {!noColumnGap && (
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Gap entre colunas</span>
                            <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[26px] w-[60px]">
                                <input
                                    type="text"
                                    value={columnGap}
                                    onChange={(e) => handleColumnGapChange(e.target.value)}
                                    className="bg-transparent border-none text-white text-xs w-full text-right outline-none px-1"
                                />
                                <span className="text-[#97A1B3] text-[10px] select-none">px</span>
                            </div>
                        </div>
                    )}
                </div>


                {/* 4. Altura (Keep enabled as it auto-defaults but can still be changed if user really wants to break auto? No, let's keep it enabled but note auto override) */}
                {/* Actually user request implied specifically PADDING */}

                {/* ... existing height code ... */}

                {/* 8. Row Padding (Should also be disabled?) */}
                {/* Skipping replace for now, need to target correctly. I will target up to line 568 first. */}

                {/* 4. Altura */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <Label className="mb-0 text-[#97A1B3]">Altura</Label>
                        <RotateCcw
                            className="w-[18px] h-[18px] text-[#97A1B3] cursor-pointer hover:text-white"
                            onClick={() => handleHeightChange('')} // Reset to auto
                        />
                    </div>
                    <div className="flex gap-[6px] w-full">
                        {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                            <button
                                key={size}
                                onClick={() => handleHeightChange(size)}
                                className={cn(
                                    "flex-1 h-[35px] flex items-center justify-center border rounded-[2px] cursor-pointer text-xs font-medium transition-colors",
                                    selectedHeight === size
                                        ? "border-[#FF0054] text-[#FF0054]"
                                        : "border-[#15161B] text-[#97A1B3] hover:border-[#FF0054] hover:text-[#FF0054]"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>

                    {/* Manual Height Input */}
                    <div className="flex items-center justify-between w-full mt-3 bg-[#15161B] border border-[#333] rounded-[2px] px-2 h-[28px]">
                        <span className="text-[#97A1B3] text-[10px] font-medium uppercase tracking-wider">Valor manual</span>
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={!['XS', 'S', 'M', 'L', 'XL', ''].includes(selectedHeight) ? selectedHeight.replace('px', '') : ''}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val === '') {
                                        handleHeightChange('')
                                    } else {
                                        // Ensure it's treated as pixels
                                        const numeric = val.replace(/[^0-9]/g, '')
                                        handleHeightChange(numeric ? `${numeric}px` : '')
                                    }
                                }}
                                placeholder="Auto"
                                className="bg-transparent border-none text-white text-[11px] w-[50px] text-right outline-none px-1"
                            />
                            <span className="text-[#97A1B3] text-[9px] select-none uppercase">px</span>
                        </div>
                    </div>
                </div>

                {/* 5. Proporção */}
                <div>
                    <div className="flex justify-between items-center mb-[14px]">
                        <Label className="mb-0 text-[#97A1B3]">Proporção</Label>
                        <RotateCcw
                            className="w-[18px] h-[18px] text-[#97A1B3] cursor-pointer hover:text-white"
                            onClick={() => handleRatioChange('auto')}
                        />
                    </div>
                    <div className="flex gap-[6px] w-full">
                        {['1:1', '3:2', '4:3', '5:4', '7:5', '16:9'].map(r => (
                            <button
                                key={r}
                                onClick={() => handleRatioChange(r)}
                                className={cn(
                                    "flex-1 h-[40px] flex items-center justify-center border rounded-[2px] cursor-pointer text-xs font-medium transition-colors",
                                    selectedRatio === r
                                        ? "border-[#FF0054] text-[#FF0054]"
                                        : "border-[#15161B] text-[#97A1B3] hover:border-[#FF0054] hover:text-[#FF0054]"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 6. Grid */}
                {/* 6. Grid */}
                {selectedCol !== 1 && (
                    <div>
                        <Label className="text-[#97A1B3]">Grid</Label>

                        {/* Visual Selectors for 2 and 3 Cols */}
                        {selectedCol === 2 && (
                            <div className="flex gap-[6px] w-full mb-3">
                                {/* 50/50 */}
                                <button onClick={() => handleGridOptionChange(0)} className={cn("flex-1 h-[35px] border rounded-[2px] flex", gridOption === 0 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                    <div className="w-1/2 h-full border-r border-inherit opacity-50" />
                                    <div className="w-1/2 h-full" />
                                </button>
                                {/* 30/70 - Right gets bg-[#27282D] */}
                                <button onClick={() => handleGridOptionChange(1)} className={cn("flex-1 h-[35px] border rounded-[2px] flex", gridOption === 1 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                    <div className="w-[30%] h-full border-r border-inherit opacity-50" />
                                    <div className="w-[70%] h-full bg-[#27282D]" />
                                </button>
                                {/* 70/30 - Left gets bg-[#27282D] */}
                                <button onClick={() => handleGridOptionChange(2)} className={cn("flex-1 h-[35px] border rounded-[2px] flex", gridOption === 2 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                    <div className="w-[70%] h-full border-r border-inherit opacity-50 bg-[#27282D]" />
                                    <div className="w-[30%] h-full" />
                                </button>
                            </div>
                        )}

                        {selectedCol === 3 && (
                            <div className="flex gap-[6px] w-full mb-3">
                                {/* Equal */}
                                <button onClick={() => handleGridOptionChange(0)} className={cn("flex-1 h-[35px] border rounded-[2px] flex", gridOption === 0 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                    <div className="flex-1 h-full border-r border-inherit opacity-50" />
                                    <div className="flex-1 h-full border-r border-inherit opacity-50" />
                                    <div className="flex-1 h-full" />
                                </button>
                                {/* Left Heavy 50/25/25 */}
                                <button onClick={() => handleGridOptionChange(1)} className={cn("flex-1 h-[35px] border rounded-[2px] flex", gridOption === 1 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                    <div className="w-1/2 h-full border-r border-inherit bg-[#27282D]" />
                                    <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                    <div className="w-1/4 h-full" />
                                </button>
                                {/* Center Heavy 25/50/25 */}
                                <button onClick={() => handleGridOptionChange(2)} className={cn("flex-1 h-[35px] border rounded-[2px] flex", gridOption === 2 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                    <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                    <div className="w-1/2 h-full border-r border-inherit bg-[#27282D]" />
                                    <div className="w-1/4 h-full" />
                                </button>
                                {/* Right Heavy 25/25/50 */}
                                <button onClick={() => handleGridOptionChange(3)} className={cn("flex-1 h-[35px] border rounded-[2px] flex", gridOption === 3 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                    <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                    <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                    <div className="w-1/2 h-full bg-[#27282D]" />
                                </button>
                            </div>
                        )}

                        {/* Unlock Free-flow Toggle (For 2, 3, 4 cols) */}
                        <div className="flex items-center justify-between">
                            <Label className="mb-0 text-[#97A1B3]">Unlock free-flow grid</Label>
                            <div
                                onClick={() => handleGridUnlockChange(!isGridUnlocked)}
                                className="w-[36px] h-[20px] bg-[#3F3F46] rounded-[999px] relative cursor-pointer"
                            >
                                <div className={cn(
                                    "w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                    isGridUnlocked ? "right-[2px]" : "left-[2px]"
                                )} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Distribuição */}
                <div>
                    <Label className="text-[#97A1B3]">Distribuição</Label>
                    <div className="grid grid-cols-4 gap-2 w-full">
                        {/* Button 1: Space Between, Full Height */}
                        <div
                            onClick={() => handleDistributionChange('between-full')}
                            className={cn(
                                "h-[35px] flex items-center justify-between border rounded-[2px] transition-colors cursor-pointer overflow-hidden",
                                distribution === 'between-full' ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]"
                            )}
                        >
                            <div className="w-3 h-full bg-[#27282D]" />
                            <div className="w-3 h-full bg-[#27282D]" />
                        </div>
                        {/* Button 2: 75% width, 70% height */}
                        <div
                            onClick={() => handleDistributionChange('center-narrow')}
                            className={cn(
                                "h-[35px] flex items-center justify-center border rounded-[2px] transition-colors cursor-pointer",
                                distribution === 'center-narrow' ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]"
                            )}
                        >
                            <div className="w-[75%] h-[70%] bg-[#27282D]" />
                        </div>
                        {/* Button 3: 100% width, 70% height */}
                        <div
                            onClick={() => handleDistributionChange('center-wide')}
                            className={cn(
                                "h-[35px] flex items-center justify-center border rounded-[2px] transition-colors cursor-pointer",
                                distribution === 'center-wide' ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]"
                            )}
                        >
                            <div className="w-full h-[70%] bg-[#27282D]" />
                        </div>
                        {/* Button 4: Space Between, 80% Height, Padding 5px */}
                        <div
                            onClick={() => handleDistributionChange('between-narrow')}
                            className={cn(
                                "h-[35px] flex items-center justify-between border rounded-[2px] transition-colors cursor-pointer overflow-hidden px-[5px]",
                                distribution === 'between-narrow' ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]"
                            )}
                        >
                            <div className="w-3 h-[80%] bg-[#27282D]" />
                            <div className="w-3 h-[80%] bg-[#27282D]" />
                        </div>
                    </div>
                </div>

                {/* 8. Row Padding */}
                <div>
                    <Label className="text-[#97A1B3]">Row padding</Label>
                    <div className="flex gap-2 w-full">
                        {/* Buttons Grid */}
                        <div className="grid grid-cols-4 gap-2 flex-grow">
                            {/* Button 1: Uniform (S) */}
                            <div
                                onClick={() => handleRowPaddingPreset('S')}
                                className="h-[35px] flex flex-col justify-between items-center py-[2px] transition-colors cursor-pointer"
                            >
                                <div className={cn("w-full h-[1px]", rowPadding === 'S' ? "bg-[#FF0054]" : "bg-[#333]")} />
                                <div className={cn("w-full h-[18px]", rowPadding === 'S' ? "bg-[#FF0054]" : "bg-[#27282D]")} />
                                <div className={cn("w-full h-[1px]", rowPadding === 'S' ? "bg-[#FF0054]" : "bg-[#333]")} />
                            </div>
                            {/* Button 2: Zero (M) */}
                            <div
                                onClick={() => handleRowPaddingPreset('M')}
                                className="h-[35px] flex flex-col justify-between items-center py-[2px] transition-colors cursor-pointer"
                            >
                                <div className={cn("w-full h-[1px]", rowPadding === 'M' ? "bg-[#FF0054]" : "bg-[#333]")} />
                                <div className={cn("w-full h-[24px]", rowPadding === 'M' ? "bg-[#FF0054]" : "bg-[#27282D]")} />
                                <div className={cn("w-full h-[1px]", rowPadding === 'M' ? "bg-[#FF0054]" : "bg-[#333]")} />
                            </div>
                            {/* Button 3: Bottom Zero (L) */}
                            <div
                                onClick={() => handleRowPaddingPreset('L')}
                                className="h-[35px] flex flex-col justify-between items-center py-[2px] transition-colors cursor-pointer"
                            >
                                <div className={cn("w-full h-[1px]", rowPadding === 'L' ? "bg-[#FF0054]" : "bg-[#333]")} />
                                <div className={cn("w-full h-[18px] mt-[8px]", rowPadding === 'L' ? "bg-[#FF0054]" : "bg-[#27282D]")} />
                                <div className={cn("w-full h-[1px]", rowPadding === 'L' ? "bg-[#FF0054]" : "bg-[#333]")} />
                            </div>
                            {/* Button 4: Top Zero (XL) */}
                            <div
                                onClick={() => handleRowPaddingPreset('XL')}
                                className="h-[35px] flex flex-col justify-between items-center py-[2px] transition-colors cursor-pointer"
                            >
                                <div className={cn("w-full h-[1px]", rowPadding === 'XL' ? "bg-[#FF0054]" : "bg-[#333]")} />
                                <div className={cn("w-full h-[18px] mb-[8px]", rowPadding === 'XL' ? "bg-[#FF0054]" : "bg-[#27282D]")} />
                                <div className={cn("w-full h-[1px]", rowPadding === 'XL' ? "bg-[#FF0054]" : "bg-[#333]")} />
                            </div>
                        </div>

                        {/* Custom Inputs */}
                        <div className="flex flex-col gap-1 w-[40px] shrink-0">
                            <input
                                type="text"
                                value={secPaddingTop}
                                onChange={(e) => handleSectionPaddingChange('top', e.target.value)}
                                className="h-[17px] bg-[#1A1A20] border border-[#333] text-white text-[10px] w-full text-center outline-none focus:border-[#666] transition-colors rounded-[2px]"
                            />
                            <input
                                type="text"
                                value={secPaddingBottom}
                                onChange={(e) => handleSectionPaddingChange('bottom', e.target.value)}
                                className="h-[17px] bg-[#1A1A20] border border-[#333] text-white text-[10px] w-full text-center outline-none focus:border-[#666] transition-colors rounded-[2px]"
                            />
                        </div>
                    </div>
                </div>

                {/* 8.5. Padding section (New) */}


                {/* 9. Segmented Control */}
                <div className="bg-[#1F1F25] p-1 rounded-[20px] flex">
                    <button
                        onClick={() => { setSelectedTab('image'); emitUpdate({ backgroundType: 'image' }) }}
                        className={cn("w-1/3 text-[10px] py-1.5 rounded-[16px] transition-colors", selectedTab === 'image' ? "bg-[#333] text-white" : "text-[#97A1B3]")}
                    >
                        Image
                    </button>
                    <button
                        onClick={() => { setSelectedTab('color'); emitUpdate({ backgroundType: 'color' }) }}
                        className={cn("w-1/3 text-[10px] py-1.5 rounded-[16px] transition-colors", selectedTab === 'color' ? "bg-[#333] text-white" : "text-[#97A1B3]")}
                    >
                        Cor
                    </button>
                    <button
                        onClick={() => { setSelectedTab('gradient'); emitUpdate({ backgroundType: 'gradient' }) }}
                        className={cn("w-1/3 text-[10px] py-1.5 rounded-[16px] transition-colors", selectedTab === 'gradient' ? "bg-[#333] text-white" : "text-[#97A1B3]")}
                    >
                        Degradê
                    </button>
                </div>

                {/* Conditional Inputs */}
                {selectedTab === 'image' && (
                    <div className="border border-dashed border-[#333] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FF0054] transition-colors relative min-h-[100px]">
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-5 h-5 text-[#FF0054] animate-spin" />
                                <span className="text-[10px] text-[#97A1B3]">Enviando...</span>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-5 h-5 text-[#97A1B3]" />
                                <span className="text-xs text-[#97A1B3]">Carregar imagem</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {backgroundImage && (
                                    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                        <img src={backgroundImage} alt="Background" className="w-full h-full object-cover opacity-30" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {selectedTab === 'color' && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-[#333] overflow-hidden relative">
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={handleColorChange}
                                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                            />
                        </div>
                        <input
                            type="text"
                            value={backgroundColor}
                            onChange={handleColorChange}
                            className="flex-1 bg-[#1F1F25] text-white text-xs px-2 py-1.5 rounded border border-[#333] focus:border-[#FF0054] outline-none"
                        />
                    </div>
                )}

                {selectedTab === 'gradient' && (
                    <div className="flex flex-col gap-4">
                        {/* Gradient Type & Angle */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex bg-[#15161B] rounded-md p-0.5">
                                <button
                                    onClick={() => handleGradientChange({ type: 'linear' })}
                                    className={cn("px-3 py-1 text-[10px] rounded", backgroundGradient.type === 'linear' ? "bg-[#333] text-white" : "text-[#97A1B3]")}
                                >
                                    Linear
                                </button>
                                <button
                                    onClick={() => handleGradientChange({ type: 'radial' })}
                                    className={cn("px-3 py-1 text-[10px] rounded", backgroundGradient.type === 'radial' ? "bg-[#333] text-white" : "text-[#97A1B3]")}
                                >
                                    Radial
                                </button>
                            </div>
                            {backgroundGradient.type === 'linear' && (
                                <div className="flex items-center bg-[#15161B] border border-[#333] rounded px-1.5 h-6">
                                    <input
                                        type="number"
                                        value={backgroundGradient.angle}
                                        onChange={(e) => handleGradientChange({ angle: parseInt(e.target.value) || 0 })}
                                        className="bg-transparent border-none text-white text-[10px] w-8 text-right outline-none"
                                    />
                                    <span className="text-[#97A1B3] text-[10px]">°</span>
                                </div>
                            )}
                        </div>

                        {/* Gradient Preview Area */}
                        <div
                            className="h-10 rounded-md border border-[#333]"
                            style={{
                                background: backgroundGradient.type === 'linear'
                                    ? `linear-gradient(${backgroundGradient.angle}deg, ${backgroundGradient.stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`
                                    : `radial-gradient(circle, ${backgroundGradient.stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`
                            }}
                        />

                        {/* Gradient Stops */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Cores</span>
                                <button onClick={handleAddGradientStop} className="text-[#FF0054] hover:opacity-80 transition-opacity">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto px-0.5 custom-scrollbar">
                                {backgroundGradient.stops.map((stop, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-[#15161B] p-1.5 rounded-md border border-[#333]">
                                        <div className="w-5 h-5 rounded-full border border-[#444] overflow-hidden relative shrink-0">
                                            <input
                                                type="color"
                                                value={stop.color}
                                                onChange={(e) => handleUpdateGradientStop(idx, { color: e.target.value })}
                                                className="absolute -top-1 -left-1 w-8 h-8 cursor-pointer p-0 border-0"
                                            />
                                        </div>
                                        <div className="flex items-center flex-1 min-w-0 bg-[#0A0A0B] rounded px-1.5 h-6">
                                            <input
                                                type="text"
                                                value={stop.color.toUpperCase()}
                                                onChange={(e) => handleUpdateGradientStop(idx, { color: e.target.value })}
                                                className="bg-transparent border-none text-white text-[10px] w-full outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center bg-[#0A0A0B] rounded px-1.5 h-6 w-12">
                                            <input
                                                type="number"
                                                value={stop.offset}
                                                min="0"
                                                max="100"
                                                onChange={(e) => handleUpdateGradientStop(idx, { offset: parseInt(e.target.value) || 0 })}
                                                className="bg-transparent border-none text-white text-[10px] w-full text-right outline-none"
                                            />
                                            <span className="text-[#97A1B3] text-[9px]">%</span>
                                        </div>
                                        {backgroundGradient.stops.length > 2 && (
                                            <button onClick={() => handleRemoveGradientStop(idx)} className="text-[#97A1B3] hover:text-[#FF0054] transition-colors">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 10. Zoom / Visivel */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <Label className="mb-0 text-[#97A1B3]">Zoom image</Label>
                        <div
                            onClick={() => handleZoomImageChange(!isZoomImage)}
                            className={cn(
                                "w-[36px] h-[20px] rounded-[999px] relative cursor-pointer transition-colors",
                                isZoomImage ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                            )}
                        >
                            <div className={cn(
                                "w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                isZoomImage ? "right-[2px]" : "left-[2px]"
                            )} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label className="mb-0 text-[#97A1B3]">Visível</Label>
                        <div
                            onClick={() => handleVisibleChange(!isVisible)}
                            className={cn(
                                "w-[36px] h-[20px] rounded-[999px] relative cursor-pointer transition-colors",
                                isVisible ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                            )}
                        >
                            <div className={cn(
                                "w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                isVisible ? "right-[2px]" : "left-[2px]"
                            )} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Toolbar */}
            < div className="h-[60px] border-t border-[#333] bg-[#15161B] flex items-center justify-around shrink-0" >
                <button onClick={onCut} className="text-[#97A1B3] hover:text-white" title="Cortar Seção"><Scissors className="w-5 h-5" /></button>
                <div className="w-[1px] h-[20px] bg-[#333]" />
                <button onClick={onSaveAsComponent} className="text-[#97A1B3] hover:text-white" title="Salvar como Componente"><LayoutGrid className="w-5 h-5" /></button>
                <div className="w-[1px] h-[20px] bg-[#333]" />
                <button onClick={onCopy} className="text-[#97A1B3] hover:text-white" title="Copiar Seção"><Copy className="w-5 h-5" /></button>
                <div className="w-[1px] h-[20px] bg-[#333]" />
                <button onClick={onDuplicate} className="text-[#97A1B3] hover:text-white" title="Duplicar Seção"><RotateCcw className="w-5 h-5" /></button>
                <div className="w-[1px] h-[20px] bg-[#333]" />
                <button onClick={onDelete} className="text-[#97A1B3] hover:text-[#FF0054]" title="Deletar Seção"><Trash2 className="w-5 h-5" /></button>
            </div >
        </div >,
        document.body
    )
}

