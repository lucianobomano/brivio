import React, { useState, useRef, useEffect } from "react"
import { Block } from "../types"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
// import { Input } from "@/components/ui/input" 
import { hexToRgb, rgbToCmyk, getSimulatedPantone, getContrastColor, mixWithWhite } from "./ColorUtils"
import { ColorSettingsPanel } from "./ColorSettingsPanel"
import { PaletteToolbar } from "./PaletteToolbar"
import { PaletteSettingsPanel, PaletteSettings, DEFAULT_PALETTE_SETTINGS } from "./PaletteSettingsPanel"

interface BlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: Block['content']) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onAnimate?: () => void
}

interface ColorSettings {
    showPantone?: boolean
    showCmyk?: boolean
    showRgb?: boolean
    hover?: { enabled: boolean }
    styles?: {
        radius?: number
        borderWidth?: number
        borderColor?: string
        overlayBg?: string
        textColor?: string
        cardHeight?: number
        fontColor?: string
        previewColor?: string
    }
}

interface ColorData {
    id: string
    name: string
    value: string
    settings?: ColorSettings
    variants?: { id: string; name?: string; value: string; settings?: ColorSettings }[]
}

const ColorCard = React.forwardRef(({
    color,
    isReadOnly,
    onUpdate,
    onDelete,
    settings: globalSettings,
    onClick,
    cardHeight,
    aspectRatio,
    customWidth,
    onResizeStart,
    layout,
    index,
    onAddAtIndex,
    onAddVariant,
    onDeleteVariant,
    onVariantClick,
    onCopyInfo
}: {
    color: ColorData,
    isReadOnly?: boolean,
    onUpdate: (updates: Partial<ColorData>) => void,
    onDelete: () => void,
    settings?: PaletteSettings,
    onClick?: () => void,
    cardHeight: number,
    aspectRatio?: number,
    customWidth?: number,
    onResizeStart?: (e: React.MouseEvent) => void,
    layout?: 'grid' | 'list' | 'circles' | 'row' | 'tall' | 'horizontal' | 'mosaic',
    index?: number,
    onAddAtIndex?: (index: number) => void,
    onAddVariant?: (colorId: string, afterIndex?: number) => void,
    onDeleteVariant?: (colorId: string, variantId: string) => void,
    onUpdateVariant?: (colorId: string, variantId: string, updates: Partial<{ name: string; value: string }>) => void,
    onVariantClick?: (colorId: string, variantId: string) => void,
    onCopyInfo?: (text: string) => void
}, ref: React.ForwardedRef<HTMLDivElement>) => {
    const rgb = hexToRgb(color.value) || { r: 0, g: 0, b: 0 }
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    const pantone = getSimulatedPantone(color.value)

    const effectiveSettings = {
        ...globalSettings,
        ...color.settings,
        hover: { ...globalSettings?.hover, ...color.settings?.hover }
    }

    const hoverEnabled = effectiveSettings?.hover?.enabled !== false
    const showPantone = effectiveSettings?.showPantone !== false
    const showCmyk = effectiveSettings?.showCmyk !== false
    const showRgb = effectiveSettings?.showRgb !== false

    // Custom styles from Block Settings
    const radius = globalSettings?.styles?.radius || 0
    const borderWidth = globalSettings?.styles?.borderWidth || 0
    const borderColor = globalSettings?.styles?.borderColor || '#E5E7EB'

    if (layout === 'horizontal') {
        const height = 308;
        const mainWidth = 305;

        return (
            <div
                ref={ref}
                className={cn(
                    "flex bg-white relative group/card transition-all duration-300 select-none overflow-visible w-full",
                    !isReadOnly && "hover:z-50"
                )}
                style={{
                    height: `${height}px`,
                    maxWidth: '1465px'
                }}
            >
                {/* Delete Button */}
                {!isReadOnly && (
                    <div
                        className="absolute -top-12 left-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-[60] cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                        <div className="relative bg-[#1A1A1A] text-white p-2 rounded-md shadow-lg flex items-center justify-center">
                            <Trash2 className="w-5 h-5" />
                        </div>
                    </div>
                )}

                {/* Main Color Section */}
                <div
                    className="relative shrink-0 flex flex-col p-8 overflow-visible group/main"
                    style={{
                        width: `${mainWidth}px`,
                        height: `${height}px`,
                        backgroundColor: color.value,
                        color: effectiveSettings?.styles?.fontColor || getContrastColor(color.value)
                    }}
                    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                >
                    {/* Name */}
                    <input
                        type="text"
                        value={color.name}
                        readOnly={isReadOnly}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        className="bg-transparent border-none outline-none font-semibold text-[16px] tracking-wider placeholder:text-inherit/30 uppercase mb-auto"
                        style={{ color: 'inherit' }}
                        placeholder="NOME DA COR"
                    />

                    {/* Info */}
                    <div className="space-y-1 font-mono text-[16px]">
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(`${rgb.r} ${rgb.g} ${rgb.b}`); } }} className={cn("flex gap-2", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 shrink-0">RGB:</span> <span>{rgb.r} {rgb.g} {rgb.b}</span>
                        </div>
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(color.value); } }} className={cn("flex gap-2", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 shrink-0">HEX:</span> <span className="uppercase">{color.value}</span>
                        </div>
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(`${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`); } }} className={cn("flex gap-2", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 shrink-0">CMYK:</span> <span>{cmyk.c} {cmyk.m} {cmyk.y} {cmyk.k}</span>
                        </div>
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(pantone); } }} className={cn("flex gap-2", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 shrink-0">Pantone:</span> <span>{pantone}</span>
                        </div>
                    </div>

                    {/* Plus Button - Right edge of main */}
                    {!isReadOnly && onAddVariant && (
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/main:opacity-100 transition-opacity z-50 pointer-events-none">
                            <div className="w-[30px] h-[30px] rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-auto border border-gray-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddVariant(color.id, -1); }}
                                    className="w-[23.5px] h-[23.5px] rounded-full bg-white hover:bg-[#EFF0F2] flex items-center justify-center transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Variants Section */}
                <div className="flex overflow-visible h-full flex-1" style={{ gap: `${globalSettings?.gapHorizontal || 0}px` }}>
                    {color.variants?.map((v, vIndex) => {
                        const totalVariants = color.variants?.length || 0;
                        const percentage = Math.round(100 - ((vIndex + 1) * (100 / (totalVariants + 1))));
                        const variantColor = mixWithWhite(color.value, percentage);

                        return (
                            <div
                                key={v.id}
                                className="relative group/variant h-full flex flex-col justify-end p-6 cursor-pointer min-w-0 transition-all duration-300 hover:z-10"
                                style={{
                                    flex: '1 1 230px',
                                    backgroundColor: variantColor,
                                    color: getContrastColor(variantColor),
                                    borderLeft: vIndex > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                                }}
                                onClick={(e) => { e.stopPropagation(); onVariantClick?.(color.id, v.id); }}
                            >
                                <span className="font-mono text-[16px] uppercase opacity-90 truncate" onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(variantColor); } }}>
                                    {percentage}%
                                </span>

                                {/* Plus Button - Between variants or at end */}
                                {!isReadOnly && onAddVariant && (
                                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/variant:opacity-100 transition-opacity z-50 pointer-events-none">
                                        <div className="w-[30px] h-[30px] rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-auto border border-gray-100">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAddVariant(color.id, vIndex); }}
                                                className="w-[23.5px] h-[23.5px] rounded-full bg-white hover:bg-[#EFF0F2] flex items-center justify-center transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Delete Variant Button */}
                                {!isReadOnly && onDeleteVariant && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteVariant(color.id, v.id); }}
                                        className="absolute right-2 top-4 w-6 h-6 bg-black/10 rounded-full flex items-center justify-center opacity-0 group-hover/variant:opacity-100 hover:bg-[#FF0054] transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-white" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* Junction Add Button for Horizontal Rows */}
                {!isReadOnly && index !== undefined && onAddAtIndex && (
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity z-50 pointer-events-none">
                        <div className="w-[30px] h-[30px] rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddAtIndex(index + 1); }}
                                className="w-[23.5px] h-[23.5px] rounded-full bg-white hover:bg-[#EFF0F2] flex items-center justify-center transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (layout === 'tall') {
        const paddedIndex = (index !== undefined ? index + 1 : 1).toString().padStart(2, '0')
        return (
            <div
                ref={ref}
                className={cn(
                    "w-full h-full bg-white relative group/card flex flex-col transition-all duration-300 select-none",
                    !isReadOnly && "hover:z-50"
                )}
                style={{
                    width: '300px',
                    height: '822px',
                    borderRadius: `${radius}px`,
                    borderWidth: `${borderWidth}px`,
                    borderColor: borderColor,
                    borderStyle: 'solid',
                    overflow: 'visible'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
            >
                {/* Delete Tooltip - Outside overflow area */}
                {!isReadOnly && (
                    <div
                        className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-[60] cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                        <div className="relative bg-[#1A1A1A] text-white p-2 rounded-md shadow-lg flex items-center justify-center">
                            <Trash2 className="w-5 h-5" />
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1A1A1A]"></div>
                        </div>
                    </div>
                )}
                {/* Plus Button - Left/ Junction (to add color) */}
                {!isReadOnly && index !== undefined && onAddAtIndex && (
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity z-50 pointer-events-none">
                        <div
                            className="w-[30px] h-[30px] rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-auto border border-gray-100"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddAtIndex(index); }}
                                className="w-[23.5px] h-[23.5px] rounded-full bg-white hover:bg-[#EFF0F2] flex items-center justify-center transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Color Section */}
                <div
                    className="relative flex-1 flex flex-col p-8 overflow-hidden"
                    style={{
                        backgroundColor: color.value,
                        color: effectiveSettings?.styles?.fontColor || getContrastColor(color.value)
                    }}
                >
                    {/* Vertical Color Name */}
                    <input
                        type="text"
                        value={color.name}
                        readOnly={isReadOnly}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        className="absolute top-8 left-8 origin-top-left -rotate-90 -translate-x-[115%] bg-transparent border-none outline-none font-semibold flex items-center whitespace-nowrap text-[16px] tracking-wider opacity-90 hover:opacity-100 placeholder:text-inherit/30 uppercase"
                        style={{ width: '250px', color: 'inherit' }}
                        placeholder="NOME DA COR"
                    />

                    {/* Info list (Middle) */}
                    <div className="flex-1 flex flex-col justify-center space-y-6 pt-24 font-mono text-[16px]">
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(`${rgb.r} ${rgb.g} ${rgb.b}`); } }} className={cn("flex flex-col", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 mb-1">RGB:</span>
                            <span>{rgb.r} {rgb.g} {rgb.b}</span>
                        </div>
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(color.value); } }} className={cn("flex flex-col", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 mb-1">HEX:</span>
                            <span className="uppercase">{color.value}</span>
                        </div>
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(`${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`); } }} className={cn("flex flex-col", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 mb-1">CMYK:</span>
                            <span>{cmyk.c} {cmyk.m} {cmyk.y} {cmyk.k}</span>
                        </div>
                        <div onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(pantone); } }} className={cn("flex flex-col", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}>
                            <span className="opacity-60 mb-1">Pantone:</span>
                            <span>{pantone}</span>
                        </div>
                    </div>

                    {/* Large padded index number */}
                    <div className="text-[120px] font-bold leading-none opacity-90 select-none">
                        {paddedIndex}
                    </div>

                    {/* Plus Button - Bottom (to add first variant / junction with variants) */}
                    {!isReadOnly && onAddVariant && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity z-50 pointer-events-none">
                            <div className="w-[30px] h-[30px] rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-auto border border-gray-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddVariant(color.id, -1); }} // Use -1 to indicate add at start
                                    className="w-[23.5px] h-[23.5px] rounded-full bg-white hover:bg-[#EFF0F2] flex items-center justify-center transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Variants Section */}
                <div className="flex flex-col shrink-0">
                    {color.variants?.map((v, vIndex) => (
                        <div
                            key={v.id}
                            className="relative group/variant w-full h-[60px] transition-all hover:h-[80px] cursor-pointer flex items-center px-8"
                            style={{
                                backgroundColor: v.value,
                                color: v.settings?.styles?.fontColor || getContrastColor(v.value)
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onVariantClick?.(color.id, v.id);
                            }}
                        >
                            <span className="font-mono text-[16px] uppercase opacity-90" onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(v.value); } }}>{v.name || "Variação"}</span>

                            {/* Plus Button - Junction between variants or bottom */}
                            {!isReadOnly && onAddVariant && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover/variant:opacity-100 transition-opacity z-[60] pointer-events-none">
                                    <div className="w-[30px] h-[30px] rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-auto border border-gray-100">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAddVariant(color.id, vIndex); }}
                                            className="w-[23.5px] h-[23.5px] rounded-full bg-white hover:bg-[#EFF0F2] flex items-center justify-center transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Delete Variant Button */}
                            {!isReadOnly && onDeleteVariant && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteVariant(color.id, v.id); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover/variant:opacity-100 hover:bg-[#FF0054] transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-white" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={ref}
            className={cn(
                "w-full bg-white relative group/card flex transition-all duration-300",
                layout === 'list' ? "flex-row h-auto min-h-[100px]" : "flex-col",
                layout === 'circles' && "bg-transparent",
                hoverEnabled && "hover:border-[#FF0054]"
            )}
            style={{
                height: layout === 'list' ? 'auto' : (aspectRatio ? 'auto' : `${cardHeight}px`),
                aspectRatio: (layout !== 'list' && aspectRatio) ? `${aspectRatio}` : undefined,
                maxWidth: customWidth ? `${customWidth}px` : undefined,
            }}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            {/* Delete Tooltip - Outside overflow area */}
            {!isReadOnly && (
                <div
                    className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-[60] cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                    <div className="relative bg-[#1A1A1A] text-white p-2 rounded-md shadow-lg flex items-center justify-center">
                        <Trash2 className="w-5 h-5" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1A1A1A]"></div>
                    </div>
                </div>
            )}

            {/* Inner Content Wrapper with Overflow Hidden for Corners/Border */}
            <div
                className={cn(
                    "w-full h-full flex transition-all duration-300 pointer-events-none",
                    layout === 'list' ? "flex-row" : "flex-col",
                    layout === 'circles' ? "rounded-full aspect-square" : "overflow-hidden"
                )}
                style={{
                    borderRadius: layout === 'circles' ? '50%' : `${radius}px`,
                    borderWidth: `${borderWidth}px`,
                    borderColor: borderColor,
                    borderStyle: 'solid'
                }}
            >
                {/* Header (Hidden for Circles here, shown below) */}
                {layout !== 'circles' && (
                    <div className={cn(
                        "bg-white px-4 flex items-center shrink-0 border-gray-100 z-10 relative pointer-events-auto",
                        layout === 'list' ? "w-[200px] border-r" : "h-[40px] border-b"
                    )}>
                        <input
                            type="text"
                            value={color.name}
                            readOnly={isReadOnly}
                            onChange={(e) => onUpdate({ name: e.target.value })}
                            className="w-full h-full bg-transparent border-none outline-none text-gray-800 font-medium placeholder:text-gray-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                            placeholder="Cor"
                        />
                    </div>
                )}

                {/* Color Group */}
                <div className="relative flex-1 min-h-0 pointer-events-auto">
                    <div
                        className="w-full h-full cursor-pointer shadow-none"
                        style={{ backgroundColor: color.value }}
                    />

                    {/* Info Overlay */}
                    {hoverEnabled && layout !== 'circles' && (
                        <div
                            className={cn(
                                "absolute inset-x-0 bottom-0 bg-white transition-transform duration-500 ease-out z-10 p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-100 flex flex-col justify-center",
                                layout === 'list' ? "right-0 inset-y-0 translate-x-[101%] group-hover/card:translate-x-0 translate-y-0 border-l border-t-0" : "inset-x-0 translate-y-[101%] group-hover/card:translate-y-0 h-auto"
                            )}
                            style={{
                                backgroundColor: globalSettings?.styles?.overlayBg || '#ffffff',
                                color: globalSettings?.styles?.textColor || '#000000'
                            }}
                        >
                            <div className="space-y-3 text-sm font-mono" style={{ color: globalSettings?.styles?.textColor || 'inherit' }}>
                                {showRgb && (
                                    <div
                                        onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(`${rgb.r} ${rgb.g} ${rgb.b}`); } }}
                                        className={cn("flex justify-between items-center gap-4", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}
                                    >
                                        <span className="font-semibold opacity-70">RGB:</span>
                                        <span>{rgb.r} {rgb.g} {rgb.b}</span>
                                    </div>
                                )}
                                <div
                                    onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(color.value); } }}
                                    className={cn("flex justify-between items-center gap-4", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}
                                >
                                    <span className="font-semibold opacity-70">HEX:</span>
                                    <span className="uppercase">{color.value}</span>
                                </div>
                                {showCmyk && (
                                    <div
                                        onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(`${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`); } }}
                                        className={cn("flex justify-between items-center gap-4", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}
                                    >
                                        <span className="font-semibold opacity-70">CMYK:</span>
                                        <span>{cmyk.c} {cmyk.m} {cmyk.y} {cmyk.k}</span>
                                    </div>
                                )}
                                {showPantone && (
                                    <div
                                        onClick={(e) => { if (isReadOnly) { e.stopPropagation(); onCopyInfo?.(pantone); } }}
                                        className={cn("flex justify-between items-center mt-1 pt-2 border-t border-gray-100/20 gap-4", isReadOnly && "cursor-pointer transition-opacity hover:opacity-70")}
                                    >
                                        <span className="font-semibold opacity-70">Pantone:</span>
                                        <span>{pantone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Labels for Circles */}
            {layout === 'circles' && (
                <div className="mt-3 flex flex-col items-center gap-1 w-full pointer-events-auto">
                    <input
                        type="text"
                        value={color.name}
                        readOnly={isReadOnly}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-gray-800 font-semibold text-center text-sm"
                        placeholder="Nome"
                    />
                    <div className="text-[10px] font-mono text-gray-400 uppercase">{color.value}</div>
                </div>
            )}

            {/* Bottom Handle - Outside overflow area */}
            {hoverEnabled && !isReadOnly && (
                <div
                    className="h-[2px] w-full bg-[#FF0054] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 absolute -bottom-1 left-0 z-50 cursor-ns-resize flex items-center justify-center overflow-visible"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onResizeStart?.(e);
                    }}
                >
                    <div className="w-[12px] h-[12px] rounded-full bg-[#FF0054] shadow-lg border-2 border-white translate-y-[1px]" />
                </div>
            )}
        </div>
    )
})

ColorCard.displayName = "ColorCard"

const MosaicCard = ({ color, spanClass, isReadOnly, onUpdate, onCopyInfo, onAddAtIndex, index, onClick, onDelete }: {
    color: ColorData;
    spanClass: string;
    isReadOnly?: boolean;
    onUpdate: (updates: Partial<ColorData>) => void;
    onCopyInfo?: (text: string) => void;
    onAddAtIndex?: (index: number) => void;
    index: number;
    onClick?: () => void;
    onDelete: () => void;
}) => {
    const rgb = hexToRgb(color.value) || { r: 0, g: 0, b: 0 }
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    const pantone = getSimulatedPantone(color.value)
    const contrastColor = getContrastColor(color.value)

    return (
        <div
            className={cn("relative group transition-all duration-300", spanClass)}
            style={{ backgroundColor: color.value, color: contrastColor }}
            onClick={onClick}
        >
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <input
                    type="text"
                    value={color.name}
                    readOnly={isReadOnly}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="bg-transparent border-none outline-none font-semibold text-[16px] tracking-wider uppercase mb-auto placeholder:text-inherit/50"
                    style={{ color: 'inherit' }}
                    placeholder="NOME DA COR"
                />

                <div className="space-y-1 font-mono text-[14px]">
                    <div className="flex gap-2 opacity-80 cursor-pointer hover:opacity-100" onClick={(e) => { e.stopPropagation(); onCopyInfo?.(`${rgb.r} ${rgb.g} ${rgb.b}`); }}>
                        <span className="opacity-60 shrink-0">RGB:</span> <span>{rgb.r} {rgb.g} {rgb.b}</span>
                    </div>
                    <div className="flex gap-2 opacity-80 cursor-pointer hover:opacity-100" onClick={(e) => { e.stopPropagation(); onCopyInfo?.(color.value); }}>
                        <span className="opacity-60 shrink-0">HEX:</span> <span className="uppercase">{color.value}</span>
                    </div>
                    <div className="flex gap-2 opacity-80 cursor-pointer hover:opacity-100" onClick={(e) => { e.stopPropagation(); onCopyInfo?.(`${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`); }}>
                        <span className="opacity-60 shrink-0">CMYK:</span> <span>{cmyk.c} {cmyk.m} {cmyk.y} {cmyk.k}</span>
                    </div>
                    <div className="flex gap-2 opacity-80 cursor-pointer hover:opacity-100" onClick={(e) => { e.stopPropagation(); onCopyInfo?.(pantone); }}>
                        <span className="opacity-60 shrink-0">Pantone:</span> <span>{pantone}</span>
                    </div>
                </div>
            </div>

            {/* Delete button */}
            {!isReadOnly && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#FF0054] transition-all"
                >
                    <Trash2 className="w-4 h-4 text-white" />
                </button>
            )}

            {/* Mosaic Plus Buttons */}
            {!isReadOnly && onAddAtIndex && (
                <>
                    {/* Add right junction */}
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddAtIndex(index + 1); }}
                            className="w-[30px] h-[30px] rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                        >
                            <Plus className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                    {/* Add bottom junction */}
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddAtIndex(index + 1); }}
                            className="w-[30px] h-[30px] rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                        >
                            <Plus className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

const CopyToast = ({ visible }: { visible: boolean }) => (
    <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    )}>
        <div className="flex items-center gap-3 px-6 py-3 bg-[#FF0054] text-white rounded-full shadow-2xl min-w-[210px] h-[50px]">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#FF0054] fill-white" strokeWidth={2.5} />
            </div>
            <span className="text-[20px] font-medium whitespace-nowrap">Cor copiada!</span>
        </div>
    </div>
)



export const PaletteBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onMove, onDuplicate, onCopy, onAnimate }: BlockProps) => {
    // Content structure: { colors: [ ... ], settings: { ... } }
    const colors = React.useMemo(() => (block.content.colors || []) as ColorData[], [block.content.colors])
    const globalSettings = React.useMemo(() => ({
        ...DEFAULT_PALETTE_SETTINGS,
        ...block.content.settings
    } as PaletteSettings), [block.content.settings])
    const currentHeight = globalSettings.customHeight || 400

    const [activeColorId, setActiveColorId] = useState<string | null>(null)
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null)
    const [showBlockSettings, setShowBlockSettings] = useState(false)
    const [settingsPosition, setSettingsPosition] = useState({ top: 100, left: 100 })
    const [copyToastVisible, setCopyToastVisible] = useState(false)

    const handleCopy = (text: string) => {
        if (!isReadOnly) return;
        navigator.clipboard.writeText(text);
        setCopyToastVisible(true);
        setTimeout(() => setCopyToastVisible(false), 2000);
    }

    // Measured dimensions for display in panel
    const [measuredDimensions, setMeasuredDimensions] = useState({ width: 0, height: 0 })
    const cardRef = useRef<HTMLDivElement>(null)

    // Resizing State
    const [isResizing, setIsResizing] = useState(false)
    const startYRef = useRef(0)
    const startHeightRef = useRef(0)

    // Update measured dimensions when layout changes or panel opens
    useEffect(() => {
        if (cardRef.current) {
            const { width, height } = cardRef.current.getBoundingClientRect()
            setMeasuredDimensions({
                width: Math.round(width),
                height: Math.round(height)
            })
        }
    }, [colors.length, globalSettings, currentHeight, showBlockSettings])

    const displayWidth = globalSettings.customWidth || measuredDimensions.width
    const displayHeight = globalSettings.customHeight || measuredDimensions.height

    // Parse aspect ratio
    const getAspectRatioValue = (ratio: string | undefined) => {
        if (!ratio || ratio === "Custom" || ratio === "Nenhum") return undefined
        const [w, h] = ratio.split(':').map(Number)
        return w / h
    }
    const aspectRatio = getAspectRatioValue(globalSettings.aspectRatio)

    // Clear active sub-panels if block is deselected
    React.useEffect(() => {
        if (activeBlockId !== block.id) {
            setActiveColorId(null)
            setActiveVariantId(null)
            setShowBlockSettings(false)
        }
    }, [activeBlockId, block.id])

    // Resize Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            const deltaY = e.clientY - startYRef.current
            const newHeight = Math.max(200, startHeightRef.current + deltaY)

            onUpdate(block.id, {
                ...block.content,
                settings: {
                    ...(block.content.settings as Record<string, unknown> || {}),
                    customHeight: newHeight
                }
            })
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'ns-resize'
        } else {
            document.body.style.cursor = 'default'
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'default'
        }
    }, [isResizing, block.id, block.content, onUpdate])

    const handleResizeStart = (e: React.MouseEvent) => {
        setIsResizing(true)
        startYRef.current = e.clientY
        startHeightRef.current = currentHeight
    }

    const handleAddColor = React.useCallback(() => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
        const newColor: ColorData = {
            id,
            name: "Cor",
            value: "#D9D9D9",
            settings: { ...globalSettings }
        }
        onUpdate(block.id, {
            ...block.content,
            colors: [...colors, newColor]
        })
    }, [block.id, block.content, colors, globalSettings, onUpdate])

    const handleAddColorAtIndex = React.useCallback((index: number) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
        const newColor: ColorData = {
            id,
            name: "Cor",
            value: "#D9D9D9",
            settings: { ...globalSettings }
        }
        const newColors = [...colors]
        newColors.splice(index, 0, newColor)
        onUpdate(block.id, {
            ...block.content,
            colors: newColors
        })
    }, [block.id, block.content, colors, globalSettings, onUpdate])

    const handleAddVariant = React.useCallback((colorId: string, afterIndex?: number) => {
        const newColors = colors.map(c => {
            if (c.id === colorId) {
                const variants = [...(c.variants || [])]
                const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
                const newVariant = { id, name: "Variação", value: "#F5F5F5" }
                if (afterIndex !== undefined) {
                    variants.splice(afterIndex + 1, 0, newVariant)
                } else {
                    variants.push(newVariant)
                }
                return { ...c, variants }
            }
            return c
        })
        onUpdate(block.id, { ...block.content, colors: newColors })
    }, [block.id, block.content, colors, onUpdate])

    const handleDeleteVariant = React.useCallback((colorId: string, variantId: string) => {
        const newColors = colors.map(c => {
            if (c.id === colorId) {
                return { ...c, variants: (c.variants || []).filter(v => v.id !== variantId) }
            }
            return c
        })
        if (activeVariantId === variantId) setActiveVariantId(null)
        onUpdate(block.id, { ...block.content, colors: newColors })
    }, [activeVariantId, block.id, block.content, colors, onUpdate])

    const handleUpdateVariant = React.useCallback((colorId: string, variantId: string, updates: Partial<{ name: string, value: string }>) => {
        const newColors = colors.map(c => {
            if (c.id === colorId) {
                return {
                    ...c,
                    variants: (c.variants || []).map(v => v.id === variantId ? { ...v, ...updates } : v)
                }
            }
            return c
        })
        onUpdate(block.id, { ...block.content, colors: newColors })
    }, [block.id, block.content, colors, onUpdate])

    const handleUpdateColor = (colorId: string, updates: Partial<ColorData>) => {
        const newColors = colors.map(c => c.id === colorId ? { ...c, ...updates } : c)
        onUpdate(block.id, {
            ...block.content,
            colors: newColors
        })
    }

    const handleDeleteColor = (colorId: string) => {
        const newColors = colors.filter(c => c.id !== colorId)
        if (activeColorId === colorId) {
            setActiveColorId(null)
            setActiveVariantId(null)
        }
        onUpdate(block.id, {
            ...block.content,
            colors: newColors
        })
    }

    const handleUpdateBlockSettings = (updates: Partial<{ settings: PaletteSettings, styles: Record<string, unknown> }>) => {
        onUpdate(block.id, {
            ...block.content,
            ...updates,
            settings: { ...globalSettings, ...updates.settings },
            styles: { ...block.content.styles, ...updates.styles },
        })
    }


    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    }[globalSettings.columns as 1 | 2 | 3 | 4 || 3]

    return (
        <div
            className="w-full relative group/palette"
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            {/* Toolbar on Hover */}
            {!isReadOnly && (
                <div className={cn(
                    "opacity-0 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 z-[100] pb-4 overflow-visible",
                    // Only show on hover if no other block is being edited or if it's this block
                    (!activeBlockId || activeBlockId === block.id) && "group-hover/palette:opacity-100 hover:opacity-100",
                    "has-[[data-state=open]]:opacity-100"
                )}>
                    <PaletteToolbar
                        onAddColor={handleAddColor}
                        onDelete={onDelete ? () => onDelete(block.id) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                        onCopy={onCopy ? () => onCopy(block.id) : undefined}
                        onMoveUp={onMove ? () => onMove(block.id, 'up') : undefined}
                        onMoveDown={onMove ? () => onMove(block.id, 'down') : undefined}
                        onSettings={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setSettingsPosition({
                                top: rect.top - 10,
                                left: rect.right + 15
                            })
                            onSelect?.(block.id)
                            setShowBlockSettings(!showBlockSettings)
                        }}
                        onAnimate={onAnimate}
                    />
                </div>
            )}

            <div
                className={cn(
                    "w-full transition-all duration-300",
                    globalSettings.layout === 'row' ? "flex flex-row overflow-x-auto pb-4 hide-scrollbar" : "grid justify-items-center",
                    globalSettings.layout === 'list' || globalSettings.layout === 'horizontal' ? "grid-cols-1" : (globalSettings.layout !== 'row' && gridCols),
                    !globalSettings.fullWidth && (globalSettings.layout === 'horizontal' ? "max-w-[1465px]" : "max-w-[1080px]") + " mx-auto"
                )}
                style={{
                    columnGap: `${globalSettings.gapHorizontal}px`,
                    rowGap: `${globalSettings.gapVertical}px`,
                    display: globalSettings.layout === 'row' ? 'flex' : 'grid'
                }}
            >
                {/* Color Cards */}
                {globalSettings.layout === 'mosaic' ? (
                    <div
                        className="w-full grid grid-cols-4 gap-0 overflow-hidden"
                        style={{
                            maxWidth: globalSettings.fullWidth ? '100%' : '1465px',
                            margin: '0 auto',
                            gridAutoRows: '175px'
                        }}
                    >
                        {colors.map((color, index) => {
                            const mosaicSpans = [
                                "col-span-2 row-span-2",
                                "col-span-2 row-span-4",
                                "col-span-2 row-span-2",
                            ];
                            const spanClass = mosaicSpans[index % mosaicSpans.length];

                            return (
                                <MosaicCard
                                    key={color.id}
                                    color={color}
                                    index={index}
                                    isReadOnly={isReadOnly}
                                    spanClass={spanClass}
                                    onUpdate={(updates: Partial<ColorData>) => handleUpdateColor(color.id, updates)}
                                    onDelete={() => handleDeleteColor(color.id)}
                                    onAddAtIndex={handleAddColorAtIndex}
                                    onCopyInfo={handleCopy}
                                    onClick={() => {
                                        if (!isReadOnly) {
                                            onSelect?.(block.id)
                                            setActiveColorId(color.id)
                                            setActiveVariantId(null)
                                        }
                                    }}
                                />
                            );
                        })}
                    </div>
                ) : (
                    colors.map((color, index) => (
                        <div
                            key={color.id}
                            className={cn(
                                "relative group/card",
                                globalSettings.layout === 'row' && "shrink-0",
                                globalSettings.layout === 'circles' && "aspect-square",
                                globalSettings.layout === 'list' && "w-full",
                                globalSettings.layout === 'tall' && "overflow-visible h-[822px]", // Tall needs visible for plus buttons
                                globalSettings.layout === 'horizontal' && "w-full"
                            )}
                            style={{
                                width: globalSettings.layout === 'tall' ? '300px' : (globalSettings.layout === 'horizontal' ? '100%' : (globalSettings.layout === 'row' ? `${globalSettings.customWidth}px` : (globalSettings.layout === 'list' ? '100%' : '100%'))),
                                height: globalSettings.layout === 'tall' ? '822px' : (globalSettings.layout === 'horizontal' ? '308px' : (globalSettings.layout !== 'list' && !aspectRatio ? `${currentHeight}px` : undefined)),
                                flexShrink: globalSettings.layout === 'tall' || globalSettings.layout === 'horizontal' ? 0 : undefined
                            }}
                        >
                            <ColorCard
                                ref={index === 0 ? cardRef : undefined}
                                color={color}
                                isReadOnly={isReadOnly}
                                settings={globalSettings}
                                cardHeight={globalSettings.layout === 'tall' ? 822 : (globalSettings.layout === 'horizontal' ? 308 : (aspectRatio ? 0 : currentHeight))}
                                aspectRatio={aspectRatio}
                                customWidth={globalSettings.customWidth}
                                layout={globalSettings.layout}
                                index={index}
                                onUpdate={(updates) => handleUpdateColor(color.id, updates)}
                                onDelete={() => handleDeleteColor(color.id)}
                                onResizeStart={handleResizeStart}
                                onAddVariant={handleAddVariant}
                                onDeleteVariant={handleDeleteVariant}
                                onUpdateVariant={handleUpdateVariant}
                                onAddAtIndex={handleAddColorAtIndex}
                                onCopyInfo={handleCopy}
                                onVariantClick={(cId, vId) => {
                                    if (!isReadOnly) {
                                        onSelect?.(block.id)
                                        setActiveColorId(cId)
                                        setActiveVariantId(vId)
                                    }
                                }}
                                onClick={() => {
                                    if (!isReadOnly) {
                                        onSelect?.(block.id)
                                        setActiveColorId(color.id)
                                        setActiveVariantId(null)
                                    }
                                }}
                            />
                        </div>
                    ))
                )}

                {/* Add Card - Positioned at end */}
                {!isReadOnly && (
                    <div
                        className={cn(
                            "w-full bg-white border-dashed border-2 border-gray-200 flex items-center justify-center cursor-pointer transition-all duration-300 group shrink-0",
                            "hover:border-[#FF0054]",
                            (globalSettings.layout === 'horizontal' || globalSettings.layout === 'mosaic') && "max-w-[1465px]"
                        )}
                        style={{
                            height: globalSettings.layout === 'tall' ? '822px' : ((globalSettings.layout === 'horizontal' || globalSettings.layout === 'mosaic') ? '120px' : (aspectRatio ? 'auto' : `${currentHeight}px`)),
                            aspectRatio: (globalSettings.layout !== 'horizontal' && globalSettings.layout !== 'mosaic' && aspectRatio) ? `${aspectRatio}` : undefined,
                            width: globalSettings.layout === 'tall' ? '300px' : ((globalSettings.layout === 'row') ? `${globalSettings.customWidth}px` : (globalSettings.layout === 'list' || globalSettings.layout === 'horizontal' || globalSettings.layout === 'mosaic' ? '100%' : '100%')),
                            borderRadius: `${globalSettings.radius || 0}px`
                        }}
                        onClick={handleAddColor}
                    >
                        <div className="w-[50px] h-[50px] bg-[#FF0054] rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <Plus className="w-8 h-8 text-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Color Settings Panel (Individual or Variant) */}
            {!isReadOnly && activeColorId && activeBlockId === block.id && (
                (() => {
                    const color = colors.find(c => c.id === activeColorId)
                    if (!color) return null

                    let activeItem = {
                        id: color.id,
                        name: color.name,
                        value: color.value,
                        settings: color.settings
                    }
                    let updateFunc = (id: string, updates: Partial<ColorData>) => handleUpdateColor(id, updates)

                    if (activeVariantId) {
                        const variant = color.variants?.find(v => v.id === activeVariantId)
                        if (variant) {
                            activeItem = {
                                id: variant.id,
                                name: variant.name || "Variação",
                                value: variant.value,
                                settings: undefined
                            }
                            updateFunc = (id: string, updates: Partial<{ name: string, value: string }>) => handleUpdateVariant(color.id, id, updates)
                        }
                    }

                    return (
                        <ColorSettingsPanel
                            color={activeItem}
                            settings={{ ...globalSettings, styles: block.content.styles }}
                            onUpdateBlock={handleUpdateBlockSettings}
                            onUpdateColor={updateFunc}
                            onClose={() => {
                                setActiveColorId(null)
                                setActiveVariantId(null)
                            }}
                        />
                    )
                })()
            )}

            {/* Palette Settings Panel (Block-wide) */}
            {!isReadOnly && showBlockSettings && activeBlockId === block.id && (
                <PaletteSettingsPanel
                    settings={{
                        ...block.content.settings,
                        customWidth: displayWidth,
                        customHeight: displayHeight
                    }}
                    initialTop={settingsPosition.top}
                    initialLeft={settingsPosition.left}
                    onUpdate={(newSettings) => {
                        onUpdate(block.id, {
                            ...block.content,
                            settings: { ...block.content.settings, ...newSettings }
                        })
                    }}
                    onClose={() => setShowBlockSettings(false)}
                />
            )}

            <CopyToast visible={copyToastVisible} />
        </div>
    )
}
