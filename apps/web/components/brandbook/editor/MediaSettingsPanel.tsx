import React from "react"
import { AlignLeft, AlignCenter, AlignRight, RotateCcw, Grid, Layout, LayoutDashboard, GalleryHorizontal, Rows3, Lock, LockOpen, Infinity as InfinityIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { MarginSettingsControl, BlockMargin } from "./blocks/MarginSettingsControl"
import type { SliderSettings } from "./blocks/GallerySliderFrame"
import type { LoopSettings } from "./blocks/GalleryLoop"
import { ARRANGEMENTS, getArrangement, type ArrangedSettings, type SliderArrangement } from "./blocks/GalleryArrangedCarousel"
import { SmoothColorInput } from "./SmoothColorInput"

export type GalleryType = 'grid' | 'masonry' | 'carousel' | 'mosaic' | 'slider' | 'justified' | 'loop'

const GALLERY_TYPES: { id: GalleryType, label: string, icon: React.ElementType }[] = [
    { id: 'grid', label: 'Grid', icon: Grid },
    { id: 'masonry', label: 'Masonry', icon: Layout },
    { id: 'carousel', label: 'Carousel', icon: RotateCcw },
    { id: 'mosaic', label: 'Mosaico', icon: LayoutDashboard },
    { id: 'slider', label: 'Faixa', icon: GalleryHorizontal },
    { id: 'justified', label: 'Justificada', icon: Rows3 },
    { id: 'loop', label: 'Loop', icon: InfinityIcon },
]

// Layouts where the column count applies (slider: images visible at once)
const TYPES_WITH_COLUMNS: GalleryType[] = ['grid', 'masonry', 'mosaic', 'slider', 'loop']

interface MediaSettingsPanelProps {
    onClose: () => void
    settings: SliderSettings & ArrangedSettings & LoopSettings & {
        align?: 'left' | 'center' | 'right'
        aspectRatio?: string
        borderColor?: string
        borderWidth?: number
        radius?: number
        /** Gallery: corner rounding of every image (px); none = square corners */
        imageRadius?: number
        width?: string
        height?: string
        galleryType?: GalleryType
        columns?: number
        margin?: BlockMargin
    }
    onUpdate: (settings: Partial<MediaSettingsPanelProps['settings']>) => void
    className?: string
    blockType?: string
}

const sectionLabel = "text-[#888] text-xs font-medium uppercase tracking-wider"

const PanelToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
    <div className="flex justify-between items-center">
        <span className={sectionLabel}>{label}</span>
        <div
            role="switch"
            aria-checked={checked}
            className={cn(
                "w-[32px] h-[18px] rounded-[999px] relative cursor-pointer transition-colors",
                checked ? "bg-[#FF0054]" : "bg-[#3F3F46]"
            )}
            onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
        >
            <div className={cn(
                "w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                checked ? "right-[2px]" : "left-[2px]"
            )} />
        </div>
    </div>
)

function PanelSegmented<T extends string>({ label, value, options, onChange }: {
    label: string
    value: T
    options: { id: T, label?: string, icon?: React.ElementType }[]
    onChange: (value: T) => void
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[#666] text-[10px] font-medium uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-1 bg-[#2A2B32]/50 p-1 rounded-md">
                {options.map(option => (
                    <button
                        key={option.id}
                        title={option.label}
                        onClick={(e) => { e.stopPropagation(); onChange(option.id) }}
                        className={cn(
                            "flex-1 h-7 flex items-center justify-center gap-1.5 rounded text-[10px] font-bold transition-all",
                            value === option.id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white"
                        )}
                    >
                        {option.icon ? <option.icon className="w-3.5 h-3.5" /> : option.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

const PanelRange = ({ label, value, min, max, step = 1, unit, onChange, onReset }: {
    label: string, value: number, min: number, max: number, step?: number, unit: string
    onChange: (value: number) => void
    onReset?: () => void
}) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <span className="text-[#666] text-[10px] font-medium uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-white tabular-nums">{value}{unit}</span>
                {onReset && <RotateCcw className="w-3 h-3 text-[#888] cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); onReset() }} />}
            </div>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[#FF0054] h-1 cursor-pointer"
        />
    </div>
)

/** Small drawing of each Faixa arrangement: five cards placed as the arrangement places them */
const ArrangementIcon = ({ id }: { id: SliderArrangement }) => {
    const cards = [-2, -1, 0, 1, 2]
    const place = (o: number): React.CSSProperties => {
        const a = Math.abs(o)
        switch (id) {
            case 'fan': return { transform: `translateX(${o * 7}px) translateY(${a * a}px) rotate(${o * 9}deg) scale(${1 - a * 0.14})` }
            case 'arc': return { transform: `translateX(${o * 9}px) translateY(${a * a * 2}px) rotate(${o * 12}deg) scale(0.85)` }
            case 'focus': return { transform: `translateX(${o * 9}px) scale(${a ? 0.72 : 1})`, opacity: a ? 0.4 : 1 }
            case 'cards': return { transform: `translateX(${o * 8}px) scale(${1 - a * 0.16})`, opacity: a ? 0.55 : 1 }
            case 'coverflow': return { transform: `translateX(${o * 6 + Math.sign(o) * 3}px) perspective(40px) rotateY(${-Math.sign(o) * 40}deg) scale(${1 - a * 0.08})` }
            case 'stack': return o < 0 ? { opacity: 0 } : { transform: `translateX(${o * 3}px) translateY(${-o * 1.5}px) scale(${1 - o * 0.08})` }
            default: return { transform: `translateX(${o * 10}px) scale(0.8)` }
        }
    }
    return (
        <span className="relative w-[52px] h-[26px] block">
            {cards.map(o => (
                <span
                    key={o}
                    className={cn("absolute left-1/2 top-[3px] w-[11px] h-[16px] -ml-[5.5px] rounded-[2px] border", o === 0 ? "bg-current border-current" : "bg-[#15161B] border-current")}
                    style={{ ...place(o), zIndex: 10 - Math.abs(o) }}
                />
            ))}
        </span>
    )
}

// Slider image size presets (px)
const SLIDER_SIZE_PRESETS = [
    { label: 'P', title: 'Pequeno', width: 240, height: 180 },
    { label: 'M', title: 'Médio', width: 320, height: 240 },
    { label: 'G', title: 'Grande', width: 480, height: 360 },
    { label: '1:1', title: 'Quadrado', width: 320, height: 320 },
    { label: '3:4', title: 'Retrato', width: 300, height: 400 },
    { label: '16:9', title: 'Panorâmico', width: 560, height: 315 },
]

const SliderImageSize = ({ settings, onUpdate, arranged }: {
    settings: SliderSettings
    onUpdate: (patch: SliderSettings) => void
    /** Arranged Faixa: the size is the focused card's own size */
    arranged?: boolean
}) => {
    const width = settings.sliderImageWidth
    const height = settings.sliderImageHeight
    const locked = settings.sliderLockRatio !== false
    const isAuto = !width && !height

    const parse = (value: string) => {
        const n = parseInt(value.replace(/\D/g, ''), 10)
        return Number.isFinite(n) && n > 0 ? Math.min(n, 4000) : undefined
    }

    // Locked: the other side follows the current width/height ratio
    const setWidth = (value: string) => {
        const next = parse(value)
        const nextHeight = locked && next && width && height ? Math.round(next * height / width) : height
        onUpdate({ sliderImageWidth: next, sliderImageHeight: nextHeight })
    }
    const setHeight = (value: string) => {
        const next = parse(value)
        const nextWidth = locked && next && width && height ? Math.round(next * width / height) : width
        onUpdate({ sliderImageWidth: nextWidth, sliderImageHeight: next })
    }

    const inputClass = "w-full bg-[#2A2B32] text-white border-none rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#FF0054] outline-none tabular-nums"

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[#666] text-[10px] font-medium uppercase tracking-wider">{arranged ? 'Tamanho do cartão' : 'Tamanho das imagens'}</span>
            <span className="text-[#666] text-[10px] leading-snug -mt-1">
                {arranged ? 'Tamanho da imagem em destaque (Auto = 300px na proporção escolhida).' : 'A largura segue o número de colunas; L × A define o formato.'}
            </span>

            <div className="grid grid-cols-4 gap-1 bg-[#2A2B32]/50 p-1 rounded-md">
                <button
                    title="Automático (pelas colunas)"
                    onClick={(e) => { e.stopPropagation(); onUpdate({ sliderImageWidth: undefined, sliderImageHeight: undefined }) }}
                    className={cn(
                        "h-7 rounded text-[10px] font-bold transition-all",
                        isAuto ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white"
                    )}
                >
                    Auto
                </button>
                {SLIDER_SIZE_PRESETS.map(preset => (
                    <button
                        key={preset.title}
                        title={`${preset.title} · ${preset.width}×${preset.height}`}
                        onClick={(e) => { e.stopPropagation(); onUpdate({ sliderImageWidth: preset.width, sliderImageHeight: preset.height }) }}
                        className={cn(
                            "h-7 rounded text-[10px] font-bold transition-all",
                            width === preset.width && height === preset.height ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white"
                        )}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#666]">
                <span>L</span>
                <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={width ?? ''}
                    placeholder="auto"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setWidth(e.target.value)}
                />
                <button
                    title={locked ? "Desbloquear proporção" : "Bloquear proporção"}
                    aria-pressed={locked}
                    onClick={(e) => { e.stopPropagation(); onUpdate({ sliderLockRatio: !locked }) }}
                    className={cn(
                        "w-7 h-7 shrink-0 rounded flex items-center justify-center transition-colors",
                        locked ? "text-[#FF0054] bg-[#FF0054]/10" : "text-[#888] hover:text-white"
                    )}
                >
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                </button>
                <span>A</span>
                <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={height ?? ''}
                    placeholder="auto"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setHeight(e.target.value)}
                />
                <span>px</span>
            </div>
        </div>
    )
}

// Edge-to-edge slider: how far the controls sit from the screen edges (empty = aligned with the section)
const ControlsInset = ({ settings, onUpdate }: {
    settings: SliderSettings
    onUpdate: (patch: SliderSettings) => void
}) => {
    const parse = (value: string) => {
        const n = parseInt(value.replace(/\D/g, ''), 10)
        return Number.isFinite(n) ? Math.min(n, 1000) : undefined
    }
    const inputClass = "w-full bg-[#2A2B32] text-white border-none rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#FF0054] outline-none tabular-nums"

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-[#666] text-[10px] font-medium uppercase tracking-wider">Margem dos controlos</span>
                <RotateCcw
                    className="w-3.5 h-3.5 text-[#888] cursor-pointer hover:text-white"
                    onClick={(e) => { e.stopPropagation(); onUpdate({ sliderControlsInsetLeft: undefined, sliderControlsInsetRight: undefined }) }}
                />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#666]">
                <span title="Esquerda">E</span>
                <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={settings.sliderControlsInsetLeft ?? ''}
                    placeholder="auto"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdate({ sliderControlsInsetLeft: parse(e.target.value) })}
                />
                <span title="Direita">D</span>
                <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass}
                    value={settings.sliderControlsInsetRight ?? ''}
                    placeholder="auto"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdate({ sliderControlsInsetRight: parse(e.target.value) })}
                />
                <span>px</span>
            </div>
        </div>
    )
}

export const MediaSettingsPanel = ({ onClose, settings, onUpdate, className, blockType }: MediaSettingsPanelProps) => {

    // Ratios: 1:1, 3:2, 4:3, 5:4, 7:5, 16:9, 9:16, 4:5
    const ratios = ['1:1', '3:2', '4:3', '5:4', '7:5', '16:9', '9:16', '4:5']
    // Border widths: 1, 3, 5, 8, 10
    const borderWeights = [1, 3, 5, 8, 10]
    // Radius: 1, 3, 5, 10, 20
    const radii = [1, 3, 5, 10, 20]
    // Columns: 1 to 6
    const columnsOptions = [1, 2, 3, 4, 5, 6]

    const isGallery = blockType === 'gallery' || blockType === 'carousel'
    const currentGalleryType: GalleryType = settings.galleryType || (blockType === 'carousel' ? 'carousel' : 'masonry')
    // Slider: the controls bar shows buttons (unless they sit on the sides) and/or the counter
    const barHasNav = settings.sliderNav === true && settings.sliderNavLayout !== 'sides'
    const hasSliderBar = barHasNav || settings.sliderCounter === true
    // Faixa arranged around a focused image (fan, arc…): its own controls replace the strip's
    const isArranged = currentGalleryType === 'slider' && !!settings.sliderArrangement && settings.sliderArrangement !== 'strip'
    const arrangement = getArrangement(settings.sliderArrangement)

    // Drag by the header: offset from the anchored position, reset whenever the panel reopens
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const dragStartRef = React.useRef<{ pointerX: number, pointerY: number, x: number, y: number } | null>(null)

    const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragStartRef.current = { pointerX: e.clientX, pointerY: e.clientY, ...offset }
    }

    const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragStartRef.current
        if (!start) return
        setOffset({ x: start.x + e.clientX - start.pointerX, y: start.y + e.clientY - start.pointerY })
    }

    const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return
        dragStartRef.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    return (
        <div
            className={cn("w-[280px] bg-[#15161B] rounded-[8px] overflow-hidden shadow-2xl flex flex-col text-white font-sans text-sm z-[200]", className)}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        >
            {/* Header */}
            <div
                className="h-[48px] bg-[#FF0054] px-4 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
            >
                <span className="font-medium text-[15px]">Edit {isGallery ? 'gallery' : 'image'}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose() }}
                    onPointerDown={(e) => e.stopPropagation()} // Clicking close must not start a drag
                    className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0"
                >
                    <span className="sr-only">Close</span>
                </button>
            </div>

            <div className="p-5 flex flex-col gap-5 max-h-[600px] overflow-y-auto custom-scrollbar">

                {/* 0. Tipo de Galeria (Only for Galleries) */}
                {isGallery && (
                    <>
                        {/* Gallery Type */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Tipo de galeria</span>
                            <div className="grid grid-cols-3 gap-1 bg-[#2A2B32]/50 p-1 rounded-md">
                                {GALLERY_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, galleryType: type.id }) }}
                                        className={cn(
                                            "flex flex-col items-center gap-1 py-2 rounded transition-all",
                                            currentGalleryType === type.id
                                                ? "bg-[#FF0054] text-white"
                                                : "text-[#888] hover:text-white"
                                        )}
                                    >
                                        <type.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Columns Selection (Only for Grid and Masonry) */}
                        {TYPES_WITH_COLUMNS.includes(currentGalleryType) && !isArranged && (
                            <div className="flex flex-col gap-2 mt-2">
                                <span className="text-[#888] text-xs font-medium uppercase tracking-wider">{currentGalleryType === 'loop' ? ((settings.loopDirection || 'vertical') === 'vertical' ? 'Colunas em loop' : 'Filas em loop') : 'Colunas'}</span>
                                <div className="flex justify-between px-1 bg-[#2A2B32]/30 p-1 rounded-md">
                                    {columnsOptions.map(c => (
                                        <button
                                            key={c}
                                            onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, columns: c }) }}
                                            className={cn(
                                                "w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold transition-all",
                                                (settings.columns === c || (!settings.columns && c === 4))
                                                    ? "bg-[#FF0054] text-white"
                                                    : "text-[#888] hover:text-white hover:bg-[#2A2B32]"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Loop: direction, speed, size */}
                        {currentGalleryType === 'loop' && (
                            <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-[#2A2B32]">
                                <div className="flex flex-col gap-2">
                                    <span className={sectionLabel}>Direção</span>
                                    <div className="grid grid-cols-2 gap-1 bg-[#2A2B32]/30 p-1 rounded-md">
                                        {([['vertical', 'Colunas ↑↓'], ['horizontal', 'Filas ←→']] as const).map(([id, label]) => (
                                            <button
                                                key={id}
                                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, loopDirection: id }) }}
                                                className={cn("h-8 rounded text-[11px] font-bold transition-all", (settings.loopDirection || 'vertical') === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <PanelRange label="Velocidade" value={settings.loopSpeed ?? 40} min={8} max={160} unit=" px/s" onChange={(v) => onUpdate({ ...settings, loopSpeed: v })} onReset={() => onUpdate({ ...settings, loopSpeed: undefined })} />
                                {(settings.loopDirection || 'vertical') === 'vertical'
                                    ? <PanelRange label="Altura" value={settings.loopHeight ?? 640} min={240} max={1200} step={10} unit="px" onChange={(v) => onUpdate({ ...settings, loopHeight: v })} onReset={() => onUpdate({ ...settings, loopHeight: undefined })} />
                                    : <PanelRange label="Altura das filas" value={settings.loopRowHeight ?? 260} min={120} max={600} step={10} unit="px" onChange={(v) => onUpdate({ ...settings, loopRowHeight: v })} onReset={() => onUpdate({ ...settings, loopRowHeight: undefined })} />}
                                <PanelRange label="Espaço entre imagens" value={settings.loopGap ?? 16} min={0} max={64} unit="px" onChange={(v) => onUpdate({ ...settings, loopGap: v })} onReset={() => onUpdate({ ...settings, loopGap: undefined })} />
                                <PanelToggle label="Sentidos alternados" checked={settings.loopAlternate !== false} onChange={(v) => onUpdate({ ...settings, loopAlternate: v })} />
                                <PanelToggle label="Inverter o sentido" checked={!!settings.loopReverse} onChange={(v) => onUpdate({ ...settings, loopReverse: v })} />
                                <PanelToggle label="Esbater as pontas" checked={settings.loopFade !== false} onChange={(v) => onUpdate({ ...settings, loopFade: v })} />
                                <PanelToggle label="Parar ao passar o rato" checked={settings.loopPauseOnHover !== false} onChange={(v) => onUpdate({ ...settings, loopPauseOnHover: v })} />
                            </div>
                        )}

                        {/* Faixa only: how the images are arranged */}
                        {currentGalleryType === 'slider' && (
                            <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-[#2A2B32]">
                                <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Disposição</span>
                                <div className="grid grid-cols-3 gap-1 bg-[#2A2B32]/30 p-1 rounded-lg">
                                    {ARRANGEMENTS.map(a => {
                                        const selected = (settings.sliderArrangement || 'strip') === a.id
                                        return (
                                            <button
                                                key={a.id}
                                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, sliderArrangement: a.id, sliderRotation: undefined, sliderSideScale: undefined }) }}
                                                className={cn(
                                                    "flex flex-col items-center gap-1.5 pt-2.5 pb-2 rounded-md transition-all",
                                                    selected ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white hover:bg-[#2A2B32]"
                                                )}
                                            >
                                                <ArrangementIcon id={a.id} />
                                                <span className="text-[10px] font-bold">{a.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {isArranged && (
                            <div className="flex flex-col gap-4 mt-2">
                                <PanelRange
                                    label="Espaçamento"
                                    value={settings.sliderSpread ?? 100}
                                    min={50} max={160} unit="%"
                                    onChange={(v) => onUpdate({ ...settings, sliderSpread: v })}
                                    onReset={() => onUpdate({ ...settings, sliderSpread: undefined })}
                                />
                                {arrangement.id !== 'focus' && arrangement.id !== 'cards' && (
                                    <PanelRange
                                        label={arrangement.id === 'coverflow' ? 'Rotação 3D' : 'Inclinação'}
                                        value={settings.sliderRotation ?? arrangement.rotation}
                                        min={0} max={arrangement.id === 'coverflow' ? 75 : 25} unit="°"
                                        onChange={(v) => onUpdate({ ...settings, sliderRotation: v })}
                                        onReset={() => onUpdate({ ...settings, sliderRotation: undefined })}
                                    />
                                )}
                                <PanelRange
                                    label="Tamanho lateral"
                                    value={settings.sliderSideScale ?? arrangement.sideScale}
                                    min={40} max={100} unit="%"
                                    onChange={(v) => onUpdate({ ...settings, sliderSideScale: v })}
                                    onReset={() => onUpdate({ ...settings, sliderSideScale: undefined })}
                                />
                                <PanelSegmented
                                    label="Imagens por lado"
                                    value={String(settings.sliderVisibleSides ?? 2)}
                                    options={['1', '2', '3', '4'].map(n => ({ id: n, label: n }))}
                                    onChange={(v) => onUpdate({ ...settings, sliderVisibleSides: Number(v) })}
                                />
                                <PanelSegmented
                                    label="Reprodução automática"
                                    value={String(settings.sliderAutoplay || 0)}
                                    options={[{ id: '0', label: 'Não' }, { id: '3', label: '3s' }, { id: '5', label: '5s' }, { id: '8', label: '8s' }]}
                                    onChange={(v) => onUpdate({ ...settings, sliderAutoplay: Number(v) || undefined })}
                                />
                                <PanelToggle
                                    label="Título e subtítulo"
                                    checked={settings.sliderCaption !== false}
                                    onChange={(checked) => onUpdate({ ...settings, sliderCaption: checked })}
                                />
                                <PanelToggle
                                    label="Botões de navegação"
                                    checked={settings.sliderNav !== false}
                                    onChange={(checked) => onUpdate({ ...settings, sliderNav: checked })}
                                />
                                <PanelToggle
                                    label="Repetir em ciclo"
                                    checked={settings.sliderLoop !== false}
                                    onChange={(checked) => onUpdate({ ...settings, sliderLoop: checked })}
                                />
                            </div>
                        )}

                        {/* Faixa (slider) controls */}
                        {currentGalleryType === 'slider' && !isArranged && (
                            <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-[#2A2B32]">
                                <PanelSegmented
                                    label="Largura"
                                    value={settings.sliderFullBleed ? 'bleed' : 'contained'}
                                    options={[
                                        { id: 'contained', label: 'Margens' },
                                        { id: 'bleed', label: 'Ponta a ponta' },
                                    ]}
                                    onChange={(v) => onUpdate({ ...settings, sliderFullBleed: v === 'bleed' })}
                                />

                                {settings.sliderFullBleed && (
                                    <ControlsInset settings={settings} onUpdate={(patch) => onUpdate({ ...settings, ...patch })} />
                                )}

                                <PanelToggle
                                    label="Barra de rolagem"
                                    checked={settings.sliderScrollbar !== false}
                                    onChange={(checked) => onUpdate({ ...settings, sliderScrollbar: checked })}
                                />

                                <PanelToggle
                                    label="Contador de imagens"
                                    checked={settings.sliderCounter === true}
                                    onChange={(checked) => onUpdate({ ...settings, sliderCounter: checked })}
                                />

                                <PanelToggle
                                    label="Botões de navegação"
                                    checked={settings.sliderNav === true}
                                    onChange={(checked) => onUpdate({ ...settings, sliderNav: checked })}
                                />

                                {settings.sliderNav === true && (
                                    <PanelSegmented
                                        label="Layout dos botões"
                                        value={settings.sliderNavLayout || 'together'}
                                        options={[
                                            { id: 'together', label: 'Juntos' },
                                            { id: 'split', label: 'Separados' },
                                            { id: 'sides', label: 'Laterais' },
                                        ]}
                                        onChange={(v) => onUpdate({ ...settings, sliderNavLayout: v })}
                                    />
                                )}

                                {/* Position applies to the bar over or under the strip (buttons not on the sides, or the counter) */}
                                {hasSliderBar && (
                                    <PanelSegmented
                                        label="Posição dos controlos"
                                        value={settings.sliderNavPosition || 'bottom'}
                                        options={[
                                            { id: 'top', label: 'Em cima' },
                                            { id: 'bottom', label: 'Em baixo' },
                                        ]}
                                        onChange={(v) => onUpdate({ ...settings, sliderNavPosition: v })}
                                    />
                                )}

                                {/* Split buttons always sit at both ends, so alignment has no effect there */}
                                {hasSliderBar && !(barHasNav && settings.sliderNavLayout === 'split') && (
                                    <PanelSegmented
                                        label="Alinhamento dos controlos"
                                        value={settings.sliderNavAlign || 'right'}
                                        options={[
                                            { id: 'left', label: 'Esquerda', icon: AlignLeft },
                                            { id: 'center', label: 'Centro', icon: AlignCenter },
                                            { id: 'right', label: 'Direita', icon: AlignRight },
                                        ]}
                                        onChange={(v) => onUpdate({ ...settings, sliderNavAlign: v })}
                                    />
                                )}
                            </div>
                        )}

                        <div className="h-px bg-[#333] w-full mt-1" />
                    </>
                )}

                {/* 1. Alinhamento */}
                <div className="flex flex-col gap-2">
                    <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Alinhamento</span>
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'left' as const, icon: AlignLeft },
                            { id: 'center' as const, icon: AlignCenter },
                            { id: 'right' as const, icon: AlignRight }
                        ].map((align) => (
                            <button
                                key={align.id}
                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, align: align.id }) }}
                                className={cn(
                                    "p-1.5 rounded hover:bg-[#2A2B32] transition-colors text-[#888] hover:text-white",
                                    settings.align === align.id && "bg-[#2A2B32] text-white"
                                )}
                            >
                                <align.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 2. Proporção */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Proporção</span>
                        <RotateCcw
                            className="w-3.5 h-3.5 text-[#888] cursor-pointer hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUpdate({ ...settings, aspectRatio: undefined, width: undefined, height: undefined, sliderImageWidth: undefined, sliderImageHeight: undefined })
                            }}
                        />
                    </div>

                    {/* Slider: per-image size (the block width does not apply, the strip always fills its frame) */}
                    {currentGalleryType === 'slider' && isGallery ? (
                        <SliderImageSize settings={settings} arranged={isArranged} onUpdate={(patch) => onUpdate({ ...settings, ...patch })} />
                    ) : (
                    /* Width/Height Inputs - Only for non-gallery or specific needs? User said "all images assume same ratio". */
                    <div className="flex gap-4 text-xs text-[#666]">
                        <div className="flex items-center gap-2">
                            <span>w</span>
                            <input
                                type="text"
                                className="w-12 bg-[#2A2B32] text-white border-none rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-[#FF0054] outline-none"
                                value={settings.width || ''}
                                placeholder="00"
                                onChange={(e) => onUpdate({ ...settings, width: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span>h</span>
                            <input
                                type="text"
                                className="w-12 bg-[#2A2B32] text-white border-none rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-[#FF0054] outline-none"
                                value={settings.height || ''}
                                placeholder="00"
                                onChange={(e) => onUpdate({ ...settings, height: e.target.value })}
                            />
                        </div>
                    </div>
                    )}

                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                        {ratios.map(r => (
                            <button
                                key={r}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextRatio = settings.aspectRatio === r ? undefined : r
                                    // Slider: a fixed image height would override the ratio, so it is dropped (the width stays)
                                    onUpdate({ ...settings, aspectRatio: nextRatio, width: undefined, height: undefined, sliderImageHeight: undefined })
                                }}
                                className={cn(
                                    "text-xs text-[#888] hover:text-white transition-colors",
                                    settings.aspectRatio === r && "text-[#FF0054] font-medium"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 3. Cor da borda */}
                <div className="flex items-center justify-between">
                    <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Cor da borda</span>
                    <div className="relative">
                        <SmoothColorInput
                            type="color"
                            value={settings.borderColor || '#0000ff'}
                            onChange={(e) => onUpdate({ ...settings, borderColor: e.target.value })}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                            className="w-6 h-6 rounded-full border border-white/10"
                            style={{ backgroundColor: settings.borderColor || '#0044FF' }}
                        />
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 4. Peso do contorno */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Peso do contorno</span>
                            <div
                                className={cn(
                                    "w-[32px] h-[18px] rounded-[999px] relative cursor-pointer transition-colors",
                                    (settings.borderWidth !== undefined && settings.borderWidth > 0) ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onUpdate({
                                        ...settings,
                                        borderWidth: (settings.borderWidth !== undefined && settings.borderWidth > 0) ? 0 : (settings.borderWidth || 2)
                                    })
                                }}
                            >
                                <div className={cn(
                                    "w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                    (settings.borderWidth !== undefined && settings.borderWidth > 0) ? "right-[2px]" : "left-[2px]"
                                )} />
                            </div>
                        </div>
                        <RotateCcw
                            className="w-3.5 h-3.5 text-[#888] cursor-pointer hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUpdate({ ...settings, borderWidth: 0 })
                            }}
                        />
                    </div>
                    <div className={cn(
                        "flex justify-between px-1 transition-all",
                        (!settings.borderWidth || settings.borderWidth <= 0) && "opacity-30 pointer-events-none"
                    )}>
                        {borderWeights.map(w => (
                            <button
                                key={w}
                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, borderWidth: w }) }}
                                className={cn(
                                    "text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-[#2A2B32] transition-colors text-[#888] hover:text-white",
                                    settings.borderWidth === w && "bg-[#2A2B32] text-white"
                                )}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 5. Raio */}
                <div className="flex flex-col gap-3">
                    <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Raio</span>
                    <div className="flex justify-between px-1">
                        {radii.map(r => (
                            <button
                                key={r}
                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, radius: r }) }}
                                className={cn(
                                    "text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-[#2A2B32] transition-colors text-[#888] hover:text-white",
                                    settings.radius === r && "bg-[#2A2B32] text-white"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5.1 Arredondamento das imagens da galeria */}
                {isGallery && (
                    <>
                        <div className="h-px bg-[#333] w-full" />
                        <div className="flex flex-col gap-3">
                            <PanelToggle
                                label="Arredondar imagens"
                                checked={settings.imageRadius !== undefined}
                                onChange={(on) => onUpdate({ ...settings, imageRadius: on ? 12 : undefined })}
                            />
                            {settings.imageRadius !== undefined && (
                                <>
                                    <div className="grid grid-cols-6 gap-1">
                                        {[4, 8, 12, 16, 24, 32].map(r => (
                                            <button
                                                key={r}
                                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, imageRadius: r }) }}
                                                className={cn(
                                                    "h-8 rounded text-[12px] transition-colors flex flex-col items-center justify-center gap-0.5",
                                                    settings.imageRadius === r ? "bg-[#FF0054] text-white" : "bg-[#1A1B21] text-[#888] hover:text-white"
                                                )}
                                                title={`${r}px`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-[#888]">Personalizado</span>
                                        <div className="flex items-center bg-[#1A1B21] border border-[#2A2B32] rounded px-2 h-7 w-[84px]">
                                            <input
                                                type="number"
                                                min={0}
                                                max={200}
                                                value={settings.imageRadius}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => onUpdate({ ...settings, imageRadius: Math.max(0, Math.min(200, Number(e.target.value) || 0)) })}
                                                className="bg-transparent w-full text-right text-white text-xs outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <span className="text-[#666] text-[10px] ml-1">px</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}

                <div className="h-px bg-[#333] w-full" />

                {/* 6. Margem */}
                <MarginSettingsControl
                    margin={settings.margin}
                    onChange={(m) => onUpdate({ ...settings, margin: m })}
                />

            </div>
        </div>
    )
}
