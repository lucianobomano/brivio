import React from "react"
import { EDITOR_COLLISION_PADDING } from "./editorLayout"
import { Check, ArrowUp, ArrowDown, Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MarginSettingsControl, BlockMargin } from "./blocks/MarginSettingsControl"
import { InlineColorPicker } from "@/components/ui/inline-color-picker"
import { useSwatchColors } from "./colorSwatches"
import { BorderControl, type BorderSettings } from "./BorderControl"
import { PanelActions, type BlockActions } from "./blocks/BlockContextBar"

/** Background colour with its opacity: "#RRGGBB" + alpha as "#RRGGBBAA" (only the background fades, never the text) */
export const splitAlpha = (c?: string) => {
    const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c || '')
    if (!m) return { hex: c || '', alpha: 100 }
    return { hex: `#${m[1]}`, alpha: m[2] ? Math.round(parseInt(m[2], 16) / 2.55) : 100 }
}
export const withAlpha = (hex: string, alpha: number) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex
    return alpha >= 100 ? hex : hex + Math.round(Math.max(0, alpha) * 2.55).toString(16).padStart(2, '0')
}

const px = (v: unknown) => { const n = parseFloat(String(v ?? '')); return Number.isFinite(n) ? n : 0 }

/** The text box border, from the per-side fields (and the old «Contorno» sides: "2px solid currentColor") */
const readBorder = (s: Record<string, any>): BorderSettings => {
    const side = (k: string) => px(s[`border${k}Width`]) || (s[`border${k}`] ? px(String(s[`border${k}`]).split(' ')[0]) || 2 : 0)
    const top = side('Top'), right = side('Right'), bottom = side('Bottom'), left = side('Left')
    return {
        // The lock is saved with the style: four equal widths (all 0 at first) would always read as locked
        isLocked: typeof s.borderLocked === "boolean" ? s.borderLocked : (top === right && right === bottom && bottom === left),
        top, right, bottom, left,
        style: (s.borderStyle || 'solid') as BorderSettings['style'],
        color: s.borderColor && s.borderColor !== 'currentColor' ? s.borderColor : '#000000',
    }
}

/** Padding of the text box: one value for every side (locked) or each side on its own */
const PaddingControl = ({ value, onChange }: { value: { isLocked: boolean, top: number, right: number, bottom: number, left: number }, onChange: (v: { isLocked: boolean, top: number, right: number, bottom: number, left: number }) => void }) => {
    const n = (v: string) => Math.max(0, Math.min(400, parseInt(v) || 0))
    const box = "w-full h-[30px] bg-[#1F2029] border border-[#333] rounded px-2 text-right text-white text-xs outline-none focus:border-[#FF0054] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Padding</span>
                <button
                    type="button"
                    title={value.isLocked ? "Definir cada lado" : "Mesmo valor em todos os lados"}
                    onClick={() => onChange(value.isLocked ? { ...value, isLocked: false } : { isLocked: true, top: value.top, right: value.top, bottom: value.top, left: value.top })}
                    className={cn("w-7 h-7 rounded flex items-center justify-center transition-colors", value.isLocked ? "text-[#FF0054] bg-[#FF0054]/10" : "text-[#666] hover:text-white")}
                >
                    {value.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
            </div>
            {value.isLocked ? (
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#666]">Todos os lados</span>
                    <div className="w-[90px]"><input aria-label="Padding (todos os lados)" type="number" min={0} value={value.top} onChange={(e) => { const v = n(e.target.value); onChange({ isLocked: true, top: v, right: v, bottom: v, left: v }) }} className={box} /></div>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-1.5">
                    {([["top", "Topo"], ["right", "Dir."], ["bottom", "Base"], ["left", "Esq."]] as const).map(([k, label]) => (
                        <label key={k} className="flex flex-col gap-1">
                            <span className="text-[10px] text-[#666] text-center">{label}</span>
                            <input aria-label={`Padding ${label}`} type="number" min={0} value={value[k]} onChange={(e) => onChange({ ...value, [k]: n(e.target.value) })} className={box} />
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}

const SHADOWS: { id: string, label: string, css?: string }[] = [
    { id: 'none', label: 'Nenhuma' },
    { id: 'soft', label: 'Suave', css: '0 1px 2px rgba(0,0,0,0.25)' },
    { id: 'medium', label: 'Média', css: '0 2px 6px rgba(0,0,0,0.35)' },
    { id: 'strong', label: 'Forte', css: '0 4px 14px rgba(0,0,0,0.5)' },
]

const Stepper = ({ label, value, onChange, min = 0, max = 400, unit = 'px' }: { label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, unit?: string }) => (
    <div className="flex items-center justify-between gap-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className="flex items-center gap-1 bg-[#1F2029] border border-[#333] rounded px-2 h-[30px]">
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
                className="w-12 bg-transparent text-right text-white text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-[#666]">{unit}</span>
        </div>
    </div>
)

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
    margin?: BlockMargin
    onMarginChange?: (margin: BlockMargin) => void
    trigger?: React.ReactNode
    /** The block's style, for the box options (padding, corners, border, shadow, background opacity…) */
    style?: Record<string, any>
    /** Writes style fields (undefined removes one) */
    onStyleChange?: (patch: Record<string, unknown>) => void
    /** Footer: move, copy, duplicate, delete */
    actions?: BlockActions
}

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
    margin,
    onMarginChange,
    trigger,
    style: blockStyle,
    onStyleChange,
    actions,
}: TextSettingsPanelProps) {
    const st = blockStyle || {}
    const bg = splitAlpha(backgroundColor)
    // Local state for hex input to allow typing before commit
    const [hexInput, setHexInput] = React.useState(color)
    const [bgHexInput, setBgHexInput] = React.useState(splitAlpha(backgroundColor).hex || '#ffffff')
    const [widthInput, setWidthInput] = React.useState(width?.toString() || '')
    const [heightInput, setHeightInput] = React.useState(heightValue?.toString() || '')

    React.useEffect(() => {
        setHexInput(color)
    }, [color])

    React.useEffect(() => {
        if (backgroundColor) setBgHexInput(splitAlpha(backgroundColor).hex)
    }, [backgroundColor])

    React.useEffect(() => {
        setWidthInput(width?.toString() || '')
    }, [width])

    React.useEffect(() => {
        setHeightInput(heightValue?.toString() || '')
    }, [heightValue])

    // Brand palette first, then the recently used colours
    const { swatches, brandCount, noteColor } = useSwatchColors(16)
    const pickColor = (c: string) => { onColorChange(c); noteColor(c) }
    const pickBackground = (c: string) => { onBackgroundColorChange?.(c ? withAlpha(c, bg.alpha) : c); noteColor(c) }

    const handleHexSubmit = () => {
        if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
            pickColor(hexInput)
        }
    }

    const handleBgHexSubmit = () => {
        if (/^#[0-9A-F]{6}$/i.test(bgHexInput)) {
            pickBackground(bgHexInput)
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
                collisionPadding={EDITOR_COLLISION_PADDING}
                // Header and footer stay put; only the options in between scroll
                className="w-[280px] p-0 bg-[#15161B] border-none shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[min(680px,calc(100vh-96px))]"
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
                        "h-[48px] bg-[#FF0054] flex items-center justify-between px-4 shrink-0",
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleMouseDown}
                >
                    <span className="text-white font-medium select-none">Editar texto</span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onOpenChange(false) }}
                        className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <span className="sr-only">Fechar</span>
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pt-4 pb-6 flex flex-col gap-4">
                    {/* Color Picker Area (Text Color) */}
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">Cor do texto</span>
                        <InlineColorPicker
                            color={color}
                            onChange={(newHex) => {
                                pickColor(newHex)
                                setHexInput(newHex)
                            }}
                            height={90}
                            showHueSlider={true}
                        />

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
                            {swatches.map((c, i) => (
                                <button
                                    key={c}
                                    title={i < brandCount ? 'Cor da marca' : undefined}
                                    onClick={() => pickColor(c)}
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
                        <InlineColorPicker
                            color={bg.hex || '#ffffff'}
                            onChange={(newHex) => {
                                pickBackground(newHex)
                                setBgHexInput(newHex)
                            }}
                            height={75}
                            showHueSlider={true}
                        />

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
                            {swatches.slice(0, 15).map((c, i) => (
                                <button
                                    key={c}
                                    title={i < brandCount ? 'Cor da marca' : undefined}
                                    onClick={() => pickBackground(c)}
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

                    {/* Opacity of the background only: the text stays fully visible */}
                    {bg.hex && (
                        <div className="flex flex-col gap-2 -mt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Opacidade do fundo</span>
                                <span className="text-[11px] text-white tabular-nums">{bg.alpha}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={bg.alpha}
                                onChange={(e) => onBackgroundColorChange?.(withAlpha(bg.hex, Number(e.target.value)))}
                                className="w-full accent-[#FF0054] h-1 cursor-pointer"
                                style={{ background: `linear-gradient(90deg, transparent, ${bg.hex})` }}
                            />
                        </div>
                    )}

                    {onStyleChange && (
                        <>
                            <div className="h-[1px] bg-[#333] w-full" />

                            {/* Padding: inside the text box (all sides, or each one with the lock open) */}
                            <PaddingControl
                                value={{
                                    isLocked: st.paddingLocked ?? (px(st.paddingTop) === px(st.paddingRight) && px(st.paddingRight) === px(st.paddingBottom) && px(st.paddingBottom) === px(st.paddingLeft)),
                                    top: px(st.paddingTop), right: px(st.paddingRight), bottom: px(st.paddingBottom), left: px(st.paddingLeft),
                                }}
                                onChange={(p) => onStyleChange({
                                    paddingLocked: p.isLocked,
                                    paddingTop: `${p.top}px`, paddingRight: `${p.right}px`, paddingBottom: `${p.bottom}px`, paddingLeft: `${p.left}px`,
                                })}
                            />

                            <div className="h-[1px] bg-[#333] w-full" />

                            <div className="flex flex-col gap-3">
                                <span className="text-gray-400 text-sm">Caixa do texto</span>
                                <Stepper label="Cantos" value={px(st.borderRadius)} max={200} onChange={(r) => onStyleChange({ borderRadius: r ? `${r}px` : undefined })} />
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Opacidade do bloco</span>
                                        <span className="text-[11px] text-white tabular-nums">{Math.round((st.opacity ?? 1) * 100)}%</span>
                                    </div>
                                    <input type="range" min={0} max={100} value={Math.round((st.opacity ?? 1) * 100)} onChange={(e) => { const o = Number(e.target.value); onStyleChange({ opacity: o >= 100 ? undefined : o / 100 }) }} className="w-full accent-[#FF0054] h-1 cursor-pointer" />
                                </div>
                            </div>

                            <BorderControl
                                label="Borda"
                                value={readBorder(st)}
                                onChange={(b) => onStyleChange({
                                    borderLocked: b.isLocked,
                                    // The per-side widths replace the old «Contorno» sides
                                    borderTop: undefined, borderRight: undefined, borderBottom: undefined, borderLeft: undefined,
                                    // With a border, every side gets its width (0 included): the text box has a 1px transparent
                                    // edge of its own that would otherwise take the border colour
                                    ...(() => {
                                        const any = b.top || b.right || b.bottom || b.left
                                        const w = (n: number) => any ? `${n}px` : undefined
                                        return { borderTopWidth: w(b.top), borderRightWidth: w(b.right), borderBottomWidth: w(b.bottom), borderLeftWidth: w(b.left) }
                                    })(),
                                    borderStyle: b.top || b.right || b.bottom || b.left ? b.style : undefined,
                                    borderColor: b.top || b.right || b.bottom || b.left ? b.color : undefined,
                                })}
                            />

                            <div className="flex flex-col gap-3">
                                <span className="text-gray-400 text-sm">Tipografia avançada</span>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] text-[#666]">Sombra do texto</span>
                                    <div className="grid grid-cols-4 gap-1 bg-[#1F2029] rounded p-1">
                                        {SHADOWS.map(sh => {
                                            const active = (st.textShadow || undefined) === sh.css
                                            return (
                                                <button key={sh.id} type="button" onClick={() => onStyleChange({ textShadow: sh.css })} className={cn("h-7 rounded text-[10px] font-bold transition-colors", active ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                                                    {sh.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <Stepper label="Recuo da 1.ª linha" value={px(st.textIndent)} max={200} onChange={(v) => onStyleChange({ textIndent: v ? `${v}px` : undefined })} />
                                <Stepper label="Colunas de texto" value={Number(st.columnCount) || 1} min={1} max={4} unit="" onChange={(v) => onStyleChange({ columnCount: v > 1 ? v : undefined, columnGap: v > 1 ? (st.columnGap || '32px') : undefined })} />
                                {Number(st.columnCount) > 1 && (
                                    <Stepper label="Espaço entre colunas" value={px(st.columnGap) || 32} max={200} onChange={(v) => onStyleChange({ columnGap: `${v}px` })} />
                                )}
                            </div>
                        </>
                    )}

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

                    {/* Order (Ordem): in the footer when the panel has one */}
                    {!actions && <div className="flex flex-col gap-2">
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
                    </div>}

                    {!onStyleChange && <div className="h-[1px] bg-[#333] w-full" />}

                    {/* Outline (Contorno): the «Borda» control above does it per side when available */}
                    {!onStyleChange && <div className="flex flex-col gap-2">
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
                    </div>}

                    {/* Margins (Margens) */}
                    <MarginSettingsControl
                        margin={margin}
                        onChange={onMarginChange || (() => {})}
                    />
                </div>

                {actions && (
                    <div className="shrink-0 bg-[#15161B]">
                        <PanelActions {...actions} />
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
