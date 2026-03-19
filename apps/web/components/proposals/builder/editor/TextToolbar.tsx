import React from "react"
import {
    Pencil,
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
    ArrowDown
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
    onSettings?: () => void
    onTransform?: (type: 'uppercase' | 'lowercase' | 'sentence' | 'capitalize') => void
    activeTransform?: 'uppercase' | 'lowercase' | 'sentence' | 'capitalize' | null
    onFontChange?: (font: string) => void
    currentFont?: string
    onLineHeightChange?: (height: string) => void
    currentLineHeight?: string
    onFormat?: (type: 'bold' | 'italic' | 'underline' | 'strikethrough') => void
    activeFormats?: string[]
    onListFormat?: (type: 'disc' | 'decimal' | null) => void
    activeListFormat?: 'disc' | 'decimal' | null
    onAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void
    activeAlign?: 'left' | 'center' | 'right' | 'justify'

    currentFontSize?: string
    onFontSizeChange?: (size: string) => void

    // Settings Panel Props
    color?: string
    onColorChange?: (color: string) => void
    heightSettings?: number
    onHeightSettingsChange?: (step: number) => void
    onOrderChange?: (direction: 'up' | 'down') => void
    outline?: { top: boolean; right: boolean; bottom: boolean; left: boolean }
    onOutlineChange?: (side: 'top' | 'right' | 'bottom' | 'left') => void

    className?: string
}

export const TextToolbar = ({
    onDelete,
    onSettings,
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

    color,
    onColorChange,
    heightSettings,
    onHeightSettingsChange,
    onOrderChange,
    outline,
    onOutlineChange,
    className
}: TextToolbarProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

    // Common font sizes
    const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '64px', '72px', '96px']

    return (
        <div className={cn("absolute -top-[50px] left-1/2 -translate-x-1/2 z-50", className)}>
            <div className="flex items-center bg-[#15161B] rounded-[4px] px-2 py-1.5 gap-2 shadow-xl border border-[#333]">
                {/* 1. Font Size (Replaces Pencil) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 text-gray-400 hover:text-white p-1 min-w-[40px] justify-center text-xs font-medium">
                            {currentFontSize?.replace('px', '') || '20'}
                            <ChevronDown className="w-3 h-3 opacity-50" />
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

                <div className="w-[1px] h-4 bg-[#333]" />

                {/* 2. Casing/Format (Moved PaintRoller here as requested) */}
                <DropdownMenu>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white p-1">
                                <ArrowUpDown className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#15161B] border border-[#333] text-gray-300 min-w-0 p-1 shadow-xl rounded-md z-[60] flex flex-row gap-1">
                            {['1.0', '1.2', '1.5', '2.0'].map((height) => (
                                <DropdownMenuItem
                                    key={height}
                                    onClick={() => onLineHeightChange?.(height)}
                                    className={cn(
                                        "flex items-center justify-center cursor-pointer w-8 h-8 rounded-sm transition-colors text-xs font-bold",
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

                {/* 3. Formatting */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onFormat?.('bold')}
                        className={cn(
                            "p-1 rounded-sm transition-colors",
                            activeFormats.includes('bold')
                                ? "bg-[#FF0054] text-white hover:bg-[#FF0054]"
                                : "text-gray-400 hover:text-white hover:bg-[#2A2B35]"
                        )}
                        title="Negrito"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
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
                    <DropdownMenu>
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
                    <DropdownMenu>
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
                        onOrderChange={onOrderChange || (() => { })}
                        outline={outline || { top: false, right: false, bottom: false, left: false }}
                        onOutlineChange={onOutlineChange || (() => { })}
                        trigger={
                            <button className={cn("text-gray-400 hover:text-white p-1", isSettingsOpen && "text-white")}>
                                <Settings className="w-4 h-4" />
                            </button>
                        }
                    />

                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1"><Trash className="w-4 h-4" /></button>
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
