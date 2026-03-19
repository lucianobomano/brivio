import React from "react"
import {
    Type,
    CaseUpper,
    ArrowUpDown,
    PaintRoller,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link,
    Settings,
    Trash,
    ChevronDown,
    CaseLower,
    CaseSensitive,
    List,
    ListOrdered,
    ALargeSmall,

    AlignJustify,
    ArrowUp,
    ArrowDown,
    Copy,
    Zap,
    RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TextSettingsPanel } from "./TextSettingsPanel"
import { FontPicker } from "./FontPicker"

interface TextToolbarProps {
    onDelete?: () => void
    onDuplicate?: () => void
    onCopy?: () => void
    onTransform?: (type: 'uppercase' | 'lowercase' | 'sentence' | 'capitalize') => void
    activeTransform?: 'uppercase' | 'lowercase' | 'sentence' | 'capitalize' | null
    onFontChange?: (font: string) => void
    currentFont?: string
    onLineHeightChange?: (height: string) => void
    currentLineHeight?: string
    onFormat?: (type: 'bold' | 'light' | 'italic' | 'underline' | 'strikethrough') => void
    activeFormats?: string[]
    onListFormat?: (type: 'disc' | 'decimal' | null) => void
    activeListFormat?: 'disc' | 'decimal' | null
    onAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void
    activeAlign?: 'left' | 'center' | 'right' | 'justify'

    currentFontSize?: string
    onFontSizeChange?: (size: string) => void

    currentWeight?: string | number
    onWeightChange?: (weight: string | number) => void

    // Settings Panel Props
    color?: string
    onColorChange?: (color: string) => void
    heightSettings?: number
    onHeightSettingsChange?: (step: number) => void
    backgroundColor?: string
    onBackgroundColorChange?: (color: string) => void
    width?: string | number
    onWidthChange?: (width: string) => void
    heightValue?: string | number
    onHeightChangePx?: (height: string) => void
    onOrderChange?: (direction: 'up' | 'down') => void
    outline?: { top: boolean; right: boolean; bottom: boolean; left: boolean }
    onOutlineChange?: (side: 'top' | 'right' | 'bottom' | 'left') => void
    onAnimate?: () => void
    onSettingsOpenChange?: (isOpen: boolean) => void

    className?: string
}

export const TextToolbar = ({
    onDelete,
    onDuplicate,
    onCopy,
    onTransform,
    activeTransform,
    onFontChange,
    currentFont,
    onLineHeightChange,
    currentLineHeight,
    onFormat,
    activeFormats = [],
    onListFormat,
    activeListFormat,
    onAlign,
    activeAlign = 'left',

    currentFontSize,
    onFontSizeChange,

    currentWeight,
    onWeightChange,

    color,
    onColorChange,
    backgroundColor,
    onBackgroundColorChange,
    heightSettings,
    onHeightSettingsChange,
    width,
    onWidthChange,
    heightValue,
    onHeightChangePx,
    onOrderChange,
    outline,
    onOutlineChange,
    onAnimate,
    onSettingsOpenChange,
    className
}: TextToolbarProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [localFontSize, setLocalFontSize] = React.useState(currentFontSize?.replace('px', '') || '20')

    React.useEffect(() => {
        if (currentFontSize) {
            setLocalFontSize(currentFontSize.replace('px', ''))
        }
    }, [currentFontSize])

    // Notify parent when settings panel state changes
    React.useEffect(() => {
        onSettingsOpenChange?.(isSettingsOpen)
    }, [isSettingsOpen, onSettingsOpenChange])


    // Common font sizes
    const fontSizes = ['10px', '11px', '12px', '13px', '14px', '15px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '30px', '32px', '36px', '40px', '44px', '48px', '56px', '64px', '72px', '80px', '96px', '120px']

    return (
        <div className={cn(className)}>
            <div className="flex items-center bg-[#15161B] rounded-[4px] px-2 py-1.5 gap-2 shadow-xl border border-[#333]">
                {/* 1. Font Size Input + Dropdown */}
                <div className="flex items-center gap-0 pl-1 border-r border-[#333]/30 mr-1">
                    <input
                        type="text"
                        value={localFontSize}
                        onChange={(e) => {
                            const val = e.target.value
                            if (val === '' || /^\d+$/.test(val)) {
                                setLocalFontSize(val)
                            }
                        }}
                        onBlur={() => {
                            if (localFontSize && localFontSize !== (currentFontSize?.replace('px', '') || '20')) {
                                onFontSizeChange?.(localFontSize + 'px')
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (localFontSize && localFontSize !== (currentFontSize?.replace('px', '') || '20')) {
                                    onFontSizeChange?.(localFontSize + 'px')
                                }
                                e.currentTarget.blur()
                            }
                        }}
                        className="w-[34px] h-7 bg-transparent border-none text-gray-300 focus:text-white text-[11px] font-bold text-center focus:outline-none p-0 selection:bg-[#FF0054]/30"
                    />
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="text-gray-400 hover:text-white p-0.5 pr-1.5 transition-colors">
                                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#15161B] border border-[#333] text-gray-300 min-w-[80px] p-1 shadow-xl rounded-md z-[60] h-[200px] overflow-y-auto custom-scrollbar">
                            {fontSizes.map((size) => (
                                <DropdownMenuItem
                                    key={size}
                                    onClick={() => onFontSizeChange?.(size)}
                                    className={cn(
                                        "flex items-center justify-center cursor-pointer py-1.5 rounded-sm transition-colors text-xs hover:bg-[#2A2B35] hover:text-white focus:bg-[#2A2B35] focus:text-white",
                                        currentFontSize === size && "text-[#FF0054] font-bold"
                                    )}
                                >
                                    {size.replace('px', '')}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Removed separate separator since it's now integrated in the block above */}


                {/* 2. Casing/Format (Moved PaintRoller here as requested) */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-white p-1">
                            <PaintRoller className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-[#15161B] border border-[#333] text-gray-300 min-w-0 p-1 shadow-xl rounded-md z-[60] flex flex-row gap-1">
                        <DropdownMenuItem
                            onClick={() => onTransform?.('uppercase')}
                            className={cn(
                                "flex items-center justify-center cursor-pointer w-8 h-8 rounded-sm transition-colors",
                                activeTransform === 'uppercase'
                                    ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                    : "hover:bg-[#2A2B35] hover:text-white focus:bg-[#2A2B35] focus:text-white"
                            )}
                            title="MAIÚSCULAS"
                        >
                            <CaseUpper className="w-4 h-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onTransform?.('lowercase')}
                            className={cn(
                                "flex items-center justify-center cursor-pointer w-8 h-8 rounded-sm transition-colors",
                                activeTransform === 'lowercase'
                                    ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                    : "hover:bg-[#2A2B35] hover:text-white focus:bg-[#2A2B35] focus:text-white"
                            )}
                            title="minúsculas"
                        >
                            <CaseLower className="w-4 h-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onTransform?.('sentence')}
                            className={cn(
                                "flex items-center justify-center cursor-pointer w-8 h-8 rounded-sm transition-colors",
                                activeTransform === 'sentence'
                                    ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                    : "hover:bg-[#2A2B35] hover:text-white focus:bg-[#2A2B35] focus:text-white"
                            )}
                            title="Primeira maiúscula"
                        >
                            <CaseSensitive className="w-4 h-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onTransform?.('capitalize')}
                            className={cn(
                                "flex items-center justify-center cursor-pointer w-8 h-8 rounded-sm transition-colors",
                                activeTransform === 'capitalize'
                                    ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                    : "hover:bg-[#2A2B35] hover:text-white focus:bg-[#2A2B35] focus:text-white"
                            )}
                            title="Palavras Maiúsculas"
                        >
                            <ALargeSmall className="w-4 h-4" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-[1px] h-4 bg-[#333]" />

                {/* 3. Typography Dropdowns */}
                <div className="flex items-center gap-1">
                    <FontPicker onFontChange={onFontChange || (() => { })} currentFont={currentFont}>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-white p-1">
                            <Type className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </FontPicker>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white p-1">
                                <ArrowUpDown className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#15161B] border border-[#333] text-gray-300 min-w-0 p-1 shadow-xl rounded-md z-[60] flex flex-row gap-1">
                            {['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0', '2.5', '3.0'].map((height) => (
                                <DropdownMenuItem
                                    key={height}
                                    onClick={() => onLineHeightChange?.(height)}
                                    className={cn(
                                        "flex items-center justify-center cursor-pointer w-8 h-8 rounded-sm transition-colors text-[10px] font-bold",
                                        currentLineHeight === height
                                            ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                            : "hover:bg-[#2A2B35] hover:text-white focus:bg-[#2A2B35] focus:text-white"
                                    )}
                                    title={`Espaçamento ${height}`}
                                >
                                    {height}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="w-[1px] h-4 bg-[#333]" />

                {/* 3. Formatting & Weight */}
                <div className="flex items-center gap-1">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white p-1">
                                <Bold className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#15161B] border border-[#333] text-gray-300 min-w-[120px] p-1 shadow-xl rounded-md z-[60]">
                            {[
                                { label: 'Thin', value: '100' },
                                { label: 'Extra Light', value: '200' },
                                { label: 'Light', value: '300' },
                                { label: 'Regular', value: '400' },
                                { label: 'Bold', value: '700' },
                                { label: 'Extra Bold', value: '800' },
                                { label: 'Black', value: '900' },
                            ].map((w) => (
                                <DropdownMenuItem
                                    key={w.value}
                                    onClick={() => onWeightChange?.(w.value)}
                                    className={cn(
                                        "truncate cursor-pointer py-1.5 px-2 rounded-sm transition-colors text-xs hover:bg-[#2A2B35] hover:text-white focus:bg-[#2A2B35] focus:text-white",
                                        String(currentWeight) === w.value && "text-[#FF0054] font-bold"
                                    )}
                                >
                                    {w.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        onClick={() => onFormat?.('italic')}
                        className={cn(
                            "p-1 rounded-sm transition-colors",
                            activeFormats.includes('italic')
                                ? "bg-[#FF0054] text-white hover:bg-[#FF0054]"
                                : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                        )}
                        title="Itálico"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onFormat?.('underline')}
                        className={cn(
                            "p-1 rounded-sm transition-colors",
                            activeFormats.includes('underline')
                                ? "bg-[#FF0054] text-white hover:bg-[#FF0054]"
                                : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                        )}
                        title="Sublinhado"
                    >
                        <Underline className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onFormat?.('strikethrough')}
                        className={cn(
                            "p-1 rounded-sm transition-colors",
                            activeFormats.includes('strikethrough')
                                ? "bg-[#FF0054] text-white hover:bg-[#FF0054]"
                                : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                        )}
                        title="Tachado"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-[1px] h-4 bg-[#333]" />

                {/* 4. Alignment & Lists */}
                <div className="flex items-center gap-1">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="text-gray-400 hover:text-white p-1">
                                <List className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#15161B] border border-[#333] min-w-0 p-1 shadow-xl rounded-md z-[60] flex flex-col gap-1 w-[38px]">
                            <DropdownMenuItem
                                onClick={() => onListFormat?.('disc')}
                                className={cn(
                                    "flex items-center justify-center cursor-pointer h-8 rounded-sm transition-colors",
                                    activeListFormat === 'disc'
                                        ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Lista com marcadores"
                            >
                                <List className="w-4 h-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onListFormat?.('decimal')}
                                className={cn(
                                    "flex items-center justify-center cursor-pointer h-8 rounded-sm transition-colors",
                                    activeListFormat === 'decimal'
                                        ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Lista numerada"
                            >
                                <ListOrdered className="w-4 h-4" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="text-gray-400 hover:text-white p-1" title="Alinhamento">
                                {activeAlign === 'center' && <AlignCenter className="w-4 h-4" />}
                                {activeAlign === 'right' && <AlignRight className="w-4 h-4" />}
                                {activeAlign === 'justify' && <AlignJustify className="w-4 h-4" />}
                                {(activeAlign === 'left' || !activeAlign) && <AlignLeft className="w-4 h-4" />}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#15161B] border border-[#333] min-w-0 p-1 shadow-xl rounded-md z-[60] flex flex-col gap-1 w-[38px]">
                            <DropdownMenuItem
                                onClick={() => onAlign?.('left')}
                                className={cn(
                                    "flex items-center justify-center cursor-pointer h-8 rounded-sm transition-colors",
                                    (activeAlign === 'left' || !activeAlign)
                                        ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Alinhar à esquerda"
                            >
                                <AlignLeft className="w-4 h-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onAlign?.('center')}
                                className={cn(
                                    "flex items-center justify-center cursor-pointer h-8 rounded-sm transition-colors",
                                    activeAlign === 'center'
                                        ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Centralizar"
                            >
                                <AlignCenter className="w-4 h-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onAlign?.('right')}
                                className={cn(
                                    "flex items-center justify-center cursor-pointer h-8 rounded-sm transition-colors",
                                    activeAlign === 'right'
                                        ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Alinhar à direita"
                            >
                                <AlignRight className="w-4 h-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onAlign?.('justify')}
                                className={cn(
                                    "flex items-center justify-center cursor-pointer h-8 rounded-sm transition-colors",
                                    activeAlign === 'justify'
                                        ? "bg-[#FF0054] text-white hover:bg-[#FF0054] hover:text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                                )}
                                title="Justificar"
                            >
                                <AlignJustify className="w-4 h-4" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="w-[1px] h-4 bg-[#333]" />

                {/* 5. Actions */}
                <div className="flex items-center gap-1">
                    <button className="text-gray-400 hover:text-white p-1"><Link className="w-4 h-4" /></button>

                    <TextSettingsPanel
                        isOpen={isSettingsOpen}
                        onOpenChange={setIsSettingsOpen}
                        color={color || '#ffffff'}
                        onColorChange={onColorChange || (() => { })}
                        height={heightSettings || 1}
                        onHeightChange={onHeightSettingsChange || (() => { })}
                        backgroundColor={backgroundColor || ''}
                        onBackgroundColorChange={onBackgroundColorChange || (() => { })}
                        width={width}
                        heightValue={heightValue}
                        onWidthChange={onWidthChange || (() => { })}
                        onHeightChangePx={onHeightChangePx || (() => { })}
                        onOrderChange={onOrderChange || (() => { })}
                        outline={outline || { top: false, right: false, bottom: false, left: false }}
                        onOutlineChange={onOutlineChange || (() => { })}
                        trigger={
                            <button className={cn("text-gray-400 hover:text-white p-1", isSettingsOpen && "text-white")}>
                                <Settings className="w-4 h-4" />
                            </button>
                        }
                    />

                    <button onClick={onDuplicate} className="text-gray-400 hover:text-blue-400 p-1" title="Duplicar bloco"><RotateCcw className="w-4 h-4" /></button>
                    <button onClick={onCopy} className="text-gray-400 hover:text-blue-400 p-1" title="Copiar bloco"><Copy className="w-4 h-4" /></button>
                    <button onClick={onAnimate} className="text-gray-400 hover:text-[#FF0054] p-1" title="Animar bloco"><Zap className="w-4 h-4 fill-transparent hover:fill-[#FF0054]" /></button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1" title="Eliminar"><Trash className="w-4 h-4" /></button>
                </div>

                <div className="w-[1px] h-4 bg-[#333]" />

                {/* 6. Reorder (New) */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onOrderChange?.('up')}
                        className="text-gray-400 hover:text-white p-1"
                        title="Mover para cima"
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onOrderChange?.('down')}
                        className="text-gray-400 hover:text-white p-1"
                        title="Mover para baixo"
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {/* Tail */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#15161B] border-r border-b border-[#333] rotate-45" />
        </div>
    )
}
