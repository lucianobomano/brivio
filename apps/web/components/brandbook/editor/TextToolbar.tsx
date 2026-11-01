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
    CopyPlus,
    Zap,
    Check,
    RotateCcw
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EDITOR_COLLISION_PADDING } from "./editorLayout"
import { FloatingPanel } from "./FloatingPanel"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TextSettingsPanel } from "./TextSettingsPanel"
import { FontPicker } from "./FontPicker"
import { BlockMargin } from "./blocks/MarginSettingsControl"
import { LinkSettingsPopover } from "./LinkSettingsPopover"
import { BlockLink } from "./types"

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
    /** Letter spacing in % of the font size (0 = the font's own spacing), like design tools */
    currentLetterSpacing?: number
    /** Saves a spacing (on release of the slider, so one drag is one undo step) */
    onLetterSpacingChange?: (percent: number) => void
    /** Shows a spacing while dragging without saving it; null ends the preview */
    onLetterSpacingPreview?: (percent: number | null) => void
    /** Live line height while the slider moves (null = back to the saved value) */
    onLineHeightPreview?: (height: number | null) => void
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
    margin?: BlockMargin
    onMarginChange?: (margin: BlockMargin) => void
    onAnimate?: () => void
    onSettingsOpenChange?: (isOpen: boolean) => void

    // Link Props
    link?: BlockLink | null
    onLinkChange?: (link: BlockLink | null) => void
    onLinkOpenChange?: (isOpen: boolean) => void

    className?: string
}

const LINE_HEIGHT_MIN = 0.7
const LINE_HEIGHT_MAX = 3
const LINE_HEIGHT_PRESETS = [1, 1.2, 1.5, 2]

/** Line height control: four quick presets plus a slider / exact value for any spacing, with live preview */
const LineHeightControl = ({ value, onChange, onPreview, onOpenChange }: {
    value?: string
    onOpenChange?: (open: boolean) => void
    onChange?: (height: string) => void
    onPreview?: (height: number | null) => void
}) => {
    const current = parseFloat(value || '') || 1.5
    const [draft, setDraft] = React.useState<number | null>(null)
    const shown = draft ?? current
    const clamp = (n: number) => Math.max(LINE_HEIGHT_MIN, Math.min(LINE_HEIGHT_MAX, Math.round(n * 100) / 100))
    const format = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))
    // Without a preview the text follows the slider by saving as it moves
    const preview = (n: number) => {
        setDraft(n)
        if (onPreview) onPreview(n)
        else onChange?.(format(n))
    }
    const commit = (n: number | null = draft) => {
        if (n !== null && n !== current) onChange?.(format(n))
        setDraft(null)
        onPreview?.(null)
    }

    return (
        <Popover onOpenChange={(open) => { if (!open) commit(); onOpenChange?.(open) }}>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-gray-400 hover:text-white p-1" title="Espaçamento entre linhas">
                    <ArrowUpDown className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                sideOffset={8}
                collisionPadding={EDITOR_COLLISION_PADDING}
                className="w-[240px] bg-[#15161B] border border-[#333] text-gray-300 p-3 shadow-xl rounded-md z-[60]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Espaçamento entre linhas</span>
                    <button
                        onClick={() => commit(1.5)}
                        className={cn("p-0.5", shown !== 1.5 ? "text-gray-400 hover:text-white" : "text-gray-600 pointer-events-none")}
                        title="Repor (1.5)"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="flex gap-1 mb-3">
                    {LINE_HEIGHT_PRESETS.map(n => (
                        <button
                            key={n}
                            onClick={() => commit(n)}
                            className={cn(
                                "flex-1 h-7 rounded text-[11px] font-semibold transition-colors",
                                shown === n ? "bg-[#FF0054] text-white" : "bg-white/5 text-gray-400 hover:text-white"
                            )}
                        >
                            {format(n)}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={LINE_HEIGHT_MIN}
                        max={LINE_HEIGHT_MAX}
                        step={0.05}
                        value={shown}
                        onChange={(e) => preview(clamp(Number(e.target.value)))}
                        onPointerUp={() => commit()}
                        onKeyUp={() => commit()}
                        onBlur={() => commit()}
                        className="flex-1 accent-[#FF0054] cursor-pointer"
                        aria-label="Espaçamento entre linhas"
                    />
                    <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded px-1.5 h-[26px] w-[56px]">
                        <input
                            type="number"
                            step={0.05}
                            min={LINE_HEIGHT_MIN}
                            max={LINE_HEIGHT_MAX}
                            value={shown}
                            onChange={(e) => preview(clamp(Number(e.target.value) || 1))}
                            onBlur={() => commit()}
                            onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
                            className="bg-transparent w-full text-right text-white text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const LETTER_SPACING_MIN = -10
const LETTER_SPACING_MAX = 50

/** Letter spacing control: slider with live preview, exact value input, quick presets and reset */
const LetterSpacingControl = ({ value, onChange, onPreview, onOpenChange }: {
    value: number
    onOpenChange?: (open: boolean) => void
    onChange?: (percent: number) => void
    onPreview?: (percent: number | null) => void
}) => {
    const [draft, setDraft] = React.useState<number | null>(null)
    const shown = draft ?? value
    const clamp = (n: number) => Math.max(LETTER_SPACING_MIN, Math.min(LETTER_SPACING_MAX, Math.round(n * 2) / 2))
    const preview = (n: number) => { setDraft(n); onPreview?.(n) }
    const commit = (n: number | null = draft) => {
        if (n !== null && n !== value) onChange?.(n)
        setDraft(null)
        onPreview?.(null)
    }

    return (
        <Popover onOpenChange={(open) => { if (!open) commit(); onOpenChange?.(open) }}>
            <PopoverTrigger asChild>
                <button
                    className={cn("flex items-center gap-1 p-1", value !== 0 ? "text-white" : "text-gray-400 hover:text-white")}
                    title="Espaçamento entre letras"
                >
                    {/* "A|V" glyph: two letters with spacing arrows */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M1.5 10 L3.75 3 L6 10 M2.3 7.6 H5.2" />
                        <path d="M10 3 L12.25 10 L14.5 3" />
                        <path d="M3 13.5 H13 M4.5 12 L3 13.5 L4.5 15 M11.5 12 L13 13.5 L11.5 15" />
                    </svg>
                    <ChevronDown className="w-3 h-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                sideOffset={8}
                collisionPadding={EDITOR_COLLISION_PADDING}
                className="w-[240px] bg-[#15161B] border border-[#333] text-gray-300 p-3 shadow-xl rounded-md z-[60]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Espaçamento entre letras</span>
                    <button
                        onClick={() => commit(0)}
                        className={cn("p-0.5", shown !== 0 ? "text-gray-400 hover:text-white" : "text-gray-600 pointer-events-none")}
                        title="Repor (0%)"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={LETTER_SPACING_MIN}
                        max={LETTER_SPACING_MAX}
                        step={0.5}
                        value={shown}
                        onChange={(e) => preview(Number(e.target.value))}
                        onPointerUp={() => commit()}
                        onKeyUp={() => commit()}
                        onBlur={() => commit()}
                        className="flex-1 accent-[#FF0054] cursor-pointer"
                        aria-label="Espaçamento entre letras"
                    />
                    <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded px-1.5 h-[26px] w-[64px]">
                        <input
                            type="number"
                            step={0.5}
                            min={LETTER_SPACING_MIN}
                            max={LETTER_SPACING_MAX}
                            value={shown}
                            onChange={(e) => preview(clamp(Number(e.target.value) || 0))}
                            onBlur={() => commit()}
                            onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
                            className="bg-transparent w-full text-right text-white text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-gray-500 text-[10px] ml-0.5">%</span>
                    </div>
                </div>

                <div className="flex gap-1 mt-3">
                    {[-5, -2, 0, 5, 10, 20].map(n => (
                        <button
                            key={n}
                            onClick={() => commit(n)}
                            className={cn(
                                "flex-1 h-6 rounded text-[10px] font-semibold transition-colors",
                                shown === n ? "bg-[#FF0054] text-white" : "bg-white/5 text-gray-400 hover:text-white"
                            )}
                        >
                            {n > 0 ? `+${n}` : n}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
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
    currentLetterSpacing = 0,
    onLetterSpacingChange,
    onLetterSpacingPreview,
    onLineHeightPreview,
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
    margin,
    onMarginChange,
    onAnimate,
    onSettingsOpenChange,
    link,
    onLinkChange,
    onLinkOpenChange,
    className
}: TextToolbarProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [isLinkOpen, setIsLinkOpen] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)
    const [localFontSize, setLocalFontSize] = React.useState(currentFontSize?.replace('px', '') || '20')
    // Font size list: our own dropdown, right under the size field
    const [isSizeOpen, setIsSizeOpen] = React.useState(false)
    const sizeGroupRef = React.useRef<HTMLDivElement>(null)
    const sizeListRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        if (!isSizeOpen) return
        const onDown = (e: PointerEvent) => {
            const t = e.target as Node
            if (sizeGroupRef.current?.contains(t) || sizeListRef.current?.contains(t)) return
            setIsSizeOpen(false)
        }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setIsSizeOpen(false) } }
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('keydown', onKey, true)
        // Show the current size in the middle of the list
        const id = window.requestAnimationFrame(() => sizeListRef.current?.querySelector('[data-current="true"]')?.scrollIntoView({ block: 'center' }))
        return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); window.cancelAnimationFrame(id) }
    }, [isSizeOpen])

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        onCopy?.()
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    React.useEffect(() => {
        if (currentFontSize) {
            setLocalFontSize(currentFontSize.replace('px', ''))
        }
    }, [currentFontSize])

    // Notify parent when settings panel state changes (the letter spacing popover counts too, so the toolbar stays)
    const [isLetterSpacingOpen, setIsLetterSpacingOpen] = React.useState(false)
    const [isLineHeightOpen, setIsLineHeightOpen] = React.useState(false)
    React.useEffect(() => {
        onSettingsOpenChange?.(isSettingsOpen || isLetterSpacingOpen || isLineHeightOpen)
    }, [isSettingsOpen, isLetterSpacingOpen, isLineHeightOpen, onSettingsOpenChange])

    // Notify parent when link popover state changes
    React.useEffect(() => {
        onLinkOpenChange?.(isLinkOpen)
    }, [isLinkOpen, onLinkOpenChange])


    // Common font sizes
    const fontSizes = ['10px', '11px', '12px', '13px', '14px', '15px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '30px', '32px', '36px', '40px', '44px', '48px', '56px', '64px', '72px', '80px', '96px', '120px']

    return (
        <div className={cn("w-max min-w-max shrink-0", className)}>
            <div className="flex items-center bg-[#15161B] rounded-[4px] px-2 py-1.5 gap-2 shadow-xl border border-[#333] whitespace-nowrap w-max min-w-max shrink-0 select-none">
                {/* 1. Font Size Input + Dropdown */}
                <div ref={sizeGroupRef} className="relative flex items-center gap-0 pl-1 border-r border-[#333]/30 mr-1">
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
                    <button
                        type="button"
                        title="Tamanho da letra"
                        aria-haspopup="listbox"
                        aria-expanded={isSizeOpen}
                        // Keeps the text selection while the list is used
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsSizeOpen(o => !o)}
                        className={cn("p-0.5 pr-1.5 transition-colors", isSizeOpen ? "text-white" : "text-gray-400 hover:text-white")}
                    >
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isSizeOpen ? "opacity-100 rotate-180" : "opacity-50")} />
                    </button>
                    {isSizeOpen && (
                        <FloatingPanel placement="bottom-start" offset={8} zIndex={10050}>
                            <div
                                ref={sizeListRef}
                                role="listbox"
                                onMouseDown={(e) => e.preventDefault()}
                                className="w-[76px] max-h-[240px] overflow-y-auto custom-scrollbar bg-[#15161B] border border-[#333] rounded-md shadow-xl p-1 animate-in fade-in slide-in-from-top-1 duration-150"
                            >
                                {fontSizes.map((size) => {
                                    const current = currentFontSize === size
                                    return (
                                        <button
                                            key={size}
                                            type="button"
                                            role="option"
                                            aria-selected={current}
                                            data-current={current}
                                            onClick={() => {
                                                onFontSizeChange?.(size)
                                                setLocalFontSize(size.replace('px', ''))
                                                setIsSizeOpen(false)
                                            }}
                                            className={cn(
                                                "w-full h-7 rounded-sm text-xs tabular-nums transition-colors",
                                                current ? "bg-[#FF0054] text-white font-bold" : "text-gray-300 hover:bg-[#2A2B35] hover:text-white"
                                            )}
                                        >
                                            {size.replace('px', '')}
                                        </button>
                                    )
                                })}
                            </div>
                        </FloatingPanel>
                    )}
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
                    <LineHeightControl
                        value={currentLineHeight}
                        onChange={onLineHeightChange}
                        onPreview={onLineHeightPreview}
                        onOpenChange={setIsLineHeightOpen}
                    />
                    <LetterSpacingControl
                        value={currentLetterSpacing}
                        onChange={onLetterSpacingChange}
                        onPreview={onLetterSpacingPreview}
                        onOpenChange={setIsLetterSpacingOpen}
                    />
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
                    {/* Link Button & Popover */}
                    {(() => {
                        const hasActiveLink = Boolean(link?.url || link?.moduleId || link?.sectionId)
                        const linkTooltip = hasActiveLink
                            ? `Link ativo: ${link?.type === 'url' ? link.url : link?.type === 'internal' ? (link.moduleTitle || 'Página') : (link?.sectionTitle || 'Seção')}`
                            : "Adicionar link"

                        return (
                            <LinkSettingsPopover
                                isOpen={isLinkOpen}
                                onOpenChange={setIsLinkOpen}
                                link={link}
                                onSaveLink={onLinkChange || (() => { })}
                                trigger={
                                    <button
                                        type="button"
                                        className={cn(
                                            "p-1 rounded transition-colors relative cursor-pointer",
                                            hasActiveLink
                                                ? "text-[#FF0054] bg-[#FF0054]/15 hover:bg-[#FF0054]/25"
                                                : "text-gray-400 hover:text-white hover:bg-white/5",
                                            isLinkOpen && "text-white bg-[#FF0054]/20 ring-1 ring-[#FF0054]/50"
                                        )}
                                        title={linkTooltip}
                                    >
                                        <Link className="w-4 h-4" />
                                        {hasActiveLink && (
                                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF0054] ring-1 ring-[#15161B]" />
                                        )}
                                    </button>
                                }
                            />
                        )
                    })()}

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
                        margin={margin}
                        onMarginChange={onMarginChange}
                        trigger={
                            <button className={cn("text-gray-400 hover:text-white p-1", isSettingsOpen && "text-white")}>
                                <Settings className="w-4 h-4" />
                            </button>
                        }
                    />

                    <button onClick={onDuplicate} className="text-gray-400 hover:text-blue-400 p-1" title="Duplicar bloco"><CopyPlus className="w-4 h-4" /></button>
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "p-1 rounded transition-colors",
                            isCopied ? "text-green-400 bg-green-500/10" : "text-gray-400 hover:text-blue-400"
                        )}
                        title={isCopied ? "Bloco copiado!" : "Copiar bloco"}
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
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
