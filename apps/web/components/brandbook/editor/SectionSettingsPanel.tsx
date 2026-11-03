import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
    X,
    RotateCcw,
    Scissors,
    LayoutGrid,
    Copy,
    Check,
    Trash2,
    Lock,
    Unlock,
    Upload,
    Loader2,
    Plus,
    Minus,
    Columns3,
    Rows3
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"
import { SmoothColorInput } from "./SmoothColorInput"
import { BorderControl, type BorderSettings } from "./BorderControl"
import { TOP_BAR_CLEARANCE } from "./editorLayout"

export interface GradientStop {
    color: string
    offset: number // 0 to 100
}

export interface SectionGradient {
    type: 'linear' | 'radial'
    angle: number
    stops: GradientStop[]
    /** Radial: center position in % of the section (default 50 / 50) */
    center?: { x: number, y: number }
    /** Radial: width in % of the section width; none = reaches the farthest corner */
    size?: number
    /** Radial: height of the shape relative to its width (1 = perfect circle, <1 flattened, >1 stretched) */
    ratio?: number
    /** Radial: edge softness in %; the color stops are squeezed towards the edge (100 = as set, default) */
    feather?: number
    /** Radial: extra color spots blended over the gradient (mesh-like) */
    spots?: GradientSpot[]
}

export interface GradientSpot {
    id: string
    /** Position in % of the section */
    x: number
    y: number
    color: string
    /** Width in % of the section width */
    size: number
    /** Height relative to the width (1 = perfect circle) */
    ratio?: number
    /** Edge softness in %: 0 = solid color with a sharp edge, 100 = fades from the center (default) */
    feather?: number
}

/** Same color with full transparency, so a spot fades out without darkening ('transparent' can) */
const fadeOf = (color: string) => /^#[0-9a-f]{6}$/i.test(color) ? `${color}00` : 'transparent'

/**
 * Ellipse of a given width (% of the box width) and height/width ratio. With the box size it is drawn
 * in pixels, so ratio 1 is a true circle on any section shape; without it (first paint) it falls back to %.
 */
const ellipseShape = (size: number, ratio: number | undefined, box?: { width: number, height: number }) => {
    const r = ratio ?? 1
    if (box && box.width > 0) {
        const rx = (size / 100) * box.width / 2
        return `ellipse ${Math.round(rx)}px ${Math.round(rx * r)}px`
    }
    return `ellipse ${size / 2}% ${(size / 2) * r}%`
}

/** CSS for a section gradient (the panel preview and the section use the same); pass the box size for exact shapes */
export const sectionGradientCss = (g: SectionGradient, box?: { width: number, height: number }) => {
    const stops = g.stops.map(s => `${s.color} ${s.offset}%`).join(', ')
    if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stops})`
    const at = `at ${g.center?.x ?? 50}% ${g.center?.y ?? 50}%`
    const shape = g.size ? ellipseShape(g.size, g.ratio, box) : 'circle'
    // Feather of the main circle: the first color stays solid longer and the transition happens near the edge
    const feather = Math.max(0.5, g.feather ?? 100)
    const radialStops = g.feather === undefined
        ? stops
        : g.stops.map(s => `${s.color} ${(100 - feather) + (s.offset * feather) / 100}%`).join(', ')
    // Spots are layers on top of the main gradient (first layer = topmost)
    // Feather: the color stays solid up to (100 - feather)% of the radius, then fades out to the edge
    // (a tiny fade is kept at 0 so the edge isn't jagged)
    const spots = (g.spots || []).map(s => {
        const solidUntil = Math.min(99.5, 100 - (s.feather ?? 100))
        return `radial-gradient(${ellipseShape(s.size, s.ratio, box)} at ${s.x}% ${s.y}%, ${s.color} 0%, ${s.color} ${solidUntil}%, ${fadeOf(s.color)} 100%)`
    })
    return [...spots, `radial-gradient(${shape} ${at}, ${radialStops})`].join(', ')
}

/** Edge softness shared by the main circle and the spots (100 = softest, default) */
const FeatherControl = ({ value, onChange }: { value?: number, onChange: (feather: number) => void }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
            <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Feather</span>
            <span className="text-[10px] text-white">{value ?? 100}%</span>
        </div>
        <input
            type="range"
            min={0}
            max={100}
            value={value ?? 100}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[#FF0054] cursor-pointer"
            aria-label="Suavidade da borda (feather)"
        />
    </div>
)

/** Shape control shared by the main circle and the spots: perfect circle, or flatten / stretch it */
const ShapeControl = ({ ratio, onChange }: { ratio?: number, onChange: (ratio: number) => void }) => {
    const r = ratio ?? 1
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Forma</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onChange(1)}
                        className={cn("px-2 h-5 rounded text-[10px]", r === 1 ? "bg-[#333] text-white" : "text-[#97A1B3] hover:text-white")}
                        title="Círculo perfeito"
                    >
                        Círculo
                    </button>
                    <span className="text-[10px] text-white w-14 text-right">{r === 1 ? 'perfeito' : r < 1 ? `achatado ${Math.round(r * 100)}%` : `esticado ${Math.round(r * 100)}%`}</span>
                </div>
            </div>
            <input
                type="range"
                min={20}
                max={300}
                step={5}
                value={Math.round(r * 100)}
                onChange={(e) => onChange(Number(e.target.value) / 100)}
                className="w-full accent-[#FF0054] cursor-pointer"
                aria-label="Altura em relação à largura (100% = círculo)"
            />
        </div>
    )
}

const SPOT_COLORS = ['#06D6A0', '#390099', '#9E0059', '#FF0054', '#FFFFFF']
const newSpotId = () => Math.random().toString(36).slice(2, 9)

/**
 * Radial gradient preview: drag the main handle to move the center, add color spots with "+",
 * click a handle to select it and edit its color / size. Dashed rings show sizes.
 */
const RadialGradientEditor = ({ gradient, onChange }: { gradient: SectionGradient, onChange: (updates: Partial<SectionGradient>) => void }) => {
    const boxRef = React.useRef<HTMLDivElement>(null)
    const [selected, setSelected] = React.useState<string>('main')
    const [dragging, setDragging] = React.useState<string | null>(null)
    const spots = gradient.spots || []
    const selectedSpot = spots.find(s => s.id === selected)
    const cx = gradient.center?.x ?? 50
    const cy = gradient.center?.y ?? 50

    // Preview size in px: shapes are drawn in pixels like on the section, so a circle stays a circle
    const [box, setBox] = React.useState<{ width: number, height: number }>()
    React.useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setBox({ width: el.clientWidth, height: el.clientHeight }))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    /** Dashed ring of a shape: width = size% of the box width, height = width × ratio */
    const ring = (x: number, y: number, size: number, ratio = 1) => {
        if (!box) return null
        const w = (size / 100) * box.width
        const h = w * ratio
        return (
            <div
                className="absolute border border-dashed border-white/70 rounded-[50%] pointer-events-none"
                style={{ left: `calc(${x}% - ${w / 2}px)`, top: `calc(${y}% - ${h / 2}px)`, width: w, height: h }}
            />
        )
    }

    const pointToPercent =(clientX: number, clientY: number) => {
        const rect = boxRef.current?.getBoundingClientRect()
        if (!rect) return null
        const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)))
        return { x: clamp(((clientX - rect.left) / rect.width) * 100), y: clamp(((clientY - rect.top) / rect.height) * 100) }
    }
    const updateSpot = (id: string, patch: Partial<GradientSpot>) =>
        onChange({ spots: spots.map(s => s.id === id ? { ...s, ...patch } : s) })
    const moveTarget = (target: string, clientX: number, clientY: number) => {
        const p = pointToPercent(clientX, clientY)
        if (!p) return
        if (target === 'main') onChange({ center: p })
        else updateSpot(target, p)
    }
    const addSpot = () => {
        const spot: GradientSpot = { id: newSpotId(), x: 30, y: 30, color: SPOT_COLORS[spots.length % SPOT_COLORS.length], size: 80 }
        onChange({ spots: [...spots, spot] })
        setSelected(spot.id)
    }
    const removeSpot = (id: string) => {
        onChange({ spots: spots.filter(s => s.id !== id) })
        setSelected('main')
    }

    const handle = (id: string, x: number, y: number, color: string | undefined) => (
        <div
            key={id}
            onPointerDown={(e) => {
                e.stopPropagation()
                boxRef.current?.setPointerCapture(e.pointerId)
                setSelected(id)
                setDragging(id)
            }}
            className={cn(
                "absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 cursor-grab active:cursor-grabbing transition-transform",
                "shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.4)]",
                selected === id ? "border-white scale-125 z-10" : "border-white/70",
                dragging === id && "scale-150"
            )}
            style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color }}
            title={id === 'main' ? 'Centro do gradiente' : 'Foco de cor'}
        />
    )

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between -mb-1">
                <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Focos de cor</span>
                <button onClick={addSpot} className="flex items-center gap-1 text-[10px] text-[#FF0054] hover:opacity-80" title="Adicionar um foco de cor arrastável">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
            </div>

            <div
                ref={boxRef}
                className="relative h-[120px] rounded-md border border-[#333] overflow-hidden cursor-crosshair touch-none select-none"
                style={{ background: sectionGradientCss(gradient, box) }}
                // Clicking the background moves the selected handle there
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(selected); moveTarget(selected, e.clientX, e.clientY) }}
                onPointerMove={(e) => { if (dragging) moveTarget(dragging, e.clientX, e.clientY) }}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                title="Arraste os círculos para mover o centro e os focos de cor"
            >
                {/* Size rings of the main gradient and of the selected spot */}
                {gradient.size && selected === 'main' ? ring(cx, cy, gradient.size, gradient.ratio) : null}
                {selectedSpot && ring(selectedSpot.x, selectedSpot.y, selectedSpot.size, selectedSpot.ratio)}
                {handle('main', cx, cy, gradient.stops[0]?.color)}
                {spots.map(s => handle(s.id, s.x, s.y, s.color))}
            </div>

            {selectedSpot ? (
                /* Selected spot: color, size, remove */
                <div className="flex flex-col gap-2 rounded-md border border-[#333] p-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Foco selecionado</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelected('main')} className="text-[10px] text-[#97A1B3] hover:text-white">Centro</button>
                            <button onClick={() => removeSpot(selectedSpot.id)} className="text-[#97A1B3] hover:text-[#FF0054]" title="Remover foco">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="relative w-6 h-6 rounded-full border border-white/20 overflow-hidden cursor-pointer shrink-0" style={{ backgroundColor: selectedSpot.color }}>
                            <SmoothColorInput
                                type="color"
                                value={selectedSpot.color || '#ffffff'}
                                onChange={(e) => updateSpot(selectedSpot.id, { color: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </label>
                        <input
                            type="text"
                            value={selectedSpot.color.toUpperCase()}
                            onChange={(e) => { const v = e.target.value.trim(); if (/^#[0-9a-f]{0,6}$/i.test(v)) updateSpot(selectedSpot.id, { color: v }) }}
                            className="flex-1 min-w-0 bg-[#15161B] border border-[#333] rounded px-2 h-6 text-[11px] text-white font-mono outline-none focus:border-[#666]"
                        />
                        <span className="text-[10px] text-[#97A1B3] whitespace-nowrap">X {selectedSpot.x}% · Y {selectedSpot.y}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Tamanho</span>
                        <span className="text-[10px] text-white">{selectedSpot.size}%</span>
                    </div>
                    <input
                        type="range"
                        min={10}
                        max={300}
                        value={selectedSpot.size}
                        onChange={(e) => updateSpot(selectedSpot.id, { size: Number(e.target.value) })}
                        className="w-full accent-[#FF0054] cursor-pointer"
                        aria-label="Diâmetro do foco de cor"
                    />
                    <ShapeControl ratio={selectedSpot.ratio} onChange={(ratio) => updateSpot(selectedSpot.id, { ratio })} />
                    <FeatherControl value={selectedSpot.feather} onChange={(feather) => updateSpot(selectedSpot.id, { feather })} />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Centro</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#97A1B3]">
                            X <span className="text-white w-7 text-right">{cx}%</span>
                            Y <span className="text-white w-7 text-right">{cy}%</span>
                            <button
                                onClick={() => onChange({ center: undefined })}
                                className="ml-1 text-[#97A1B3] hover:text-white"
                                title="Centrar"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[#97A1B3] text-[10px] uppercase font-bold tracking-wider">Tamanho</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onChange({ size: undefined })}
                                    className={cn("px-2 h-5 rounded text-[10px]", !gradient.size ? "bg-[#333] text-white" : "text-[#97A1B3] hover:text-white")}
                                    title="Até ao canto mais distante"
                                >
                                    Auto
                                </button>
                                <div className="flex items-center bg-[#15161B] border border-[#333] rounded px-1.5 h-5">
                                    <input
                                        type="number"
                                        min={10}
                                        max={300}
                                        value={gradient.size ?? ''}
                                        placeholder="—"
                                        onChange={(e) => onChange({ size: Math.max(10, Math.min(300, Number(e.target.value) || 0)) || undefined })}
                                        className="bg-transparent border-none text-white text-[10px] w-8 text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-[#97A1B3] text-[10px]">%</span>
                                </div>
                            </div>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={300}
                            value={gradient.size ?? 150}
                            onChange={(e) => onChange({ size: Number(e.target.value) })}
                            className="w-full accent-[#FF0054] cursor-pointer"
                            aria-label="Diâmetro do gradiente radial"
                        />
                    </div>
                    {/* Shape only applies once the circle has a size ("Auto" reaches the corners) */}
                    {gradient.size ? <ShapeControl ratio={gradient.ratio} onChange={(ratio) => onChange({ ratio })} /> : null}
                    <FeatherControl value={gradient.feather} onChange={(feather) => onChange({ feather })} />
                </>
            )}
        </div>
    )
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
    isFreeFlow?: boolean
    distribution?: string
    rowPadding?: string
    columnWidths?: number[]
    isFullWidth?: boolean
    /** 'fluid': the content takes the whole width minus the section padding (no device content box) */
    contentWidth?: 'boxed' | 'fluid'
    /** Scroll effect (Preview / shared link): 'rail' = columns slide sideways as cards in a pinned screen,
     *  'stages' = pinned screen that steps through the blocks of the first column */
    scrollEffect?: 'none' | 'rail' | 'stages'
    /** Card width in the rail, % of the screen width */
    railCardWidth?: number
    isFullHeight?: boolean
    alignHorizontal?: 'left' | 'center' | 'right'
    alignVertical?: 'top' | 'middle' | 'bottom'
    noColumnGap?: boolean
    columnGap?: number
    /** 'horizontal': columns side by side (default) · 'vertical': columns stacked as full-width rows */
    columnDirection?: 'horizontal' | 'vertical'
    /** How the columns use the room along the direction (default: 'fill' horizontal, 'packed' vertical) */
    columnDistribution?: 'fill' | 'packed' | 'between' | 'around' | 'evenly'
    /** Space around the section (px) */
    sectionMargin?: SectionSides
    /** Corner rounding (px): top = top-left, right = top-right, bottom = bottom-right, left = bottom-left */
    sectionRadius?: SectionSides
    /** Border of the section, per side */
    sectionBorder?: BorderSettings
    /** 'fit': the section is as wide as its content (placed by the horizontal alignment) · 'fill'/none: full width */
    widthMode?: 'fit' | 'fill'
}

export interface SectionSides {
    isLocked: boolean
    top: number
    right: number
    bottom: number
    left: number
}

/** Height modes of a section besides the sizes: as tall as its content, or all the height left on the page */
export const SECTION_HEIGHT_MODES = ['fit', 'fill'] as const

/** Section set to the full screen height ("100vh"; legacy 16:9 sections too) */
export const isFullScreenSection = (settings?: Partial<SectionSettings>) =>
    settings?.height === '100vh' || settings?.aspectRatio === '16:9'

/**
 * Height that makes a full-screen section exactly fill the screen: 100vh minus its vertical margin.
 * With `inner`, also minus the section padding: the room left for the columns inside.
 */
export const fullScreenHeight = (settings?: Partial<SectionSettings>, inner = false) => {
    const marginY = (settings?.sectionMargin?.top || 0) + (settings?.sectionMargin?.bottom || 0)
    const paddingY = settings?.isFullHeight ? 0 : (settings?.sectionPadding?.top ?? 40) + (settings?.sectionPadding?.bottom ?? 40)
    const minus = marginY + (inner ? paddingY : 0)
    return minus ? `calc(100vh - ${minus}px)` : '100vh'
}

/**
 * Distribution icons: two columns (bars) between the section edges (lines), drawn left to right.
 * x / width of each column inside a 16-wide box whose inner room runs from 2 to 14.
 */
const DISTRIBUTION_ICONS: Record<'fill' | 'packed' | 'between' | 'around' | 'evenly', [number, number][]> = {
    fill: [[2, 5.5], [8.5, 5.5]],
    packed: [[4.75, 3], [8.25, 3]],
    between: [[2, 3], [11, 3]],
    around: [[3.5, 3], [9.5, 3]],
    evenly: [[4, 3], [9, 3]],
}

export const DistributionIcon = ({ type, vertical }: { type: keyof typeof DISTRIBUTION_ICONS, vertical?: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={cn("transition-transform", vertical && "rotate-90")} aria-hidden>
        <rect x="0.5" y="2" width="1" height="12" fill="currentColor" opacity="0.5" />
        <rect x="14.5" y="2" width="1" height="12" fill="currentColor" opacity="0.5" />
        {DISTRIBUTION_ICONS[type].map(([x, w], i) => (
            <rect key={i} x={x} y="4" width={w} height="8" rx="0.75" fill="currentColor" />
        ))}
    </svg>
)

const NO_SIDES: SectionSides = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }

/**
 * Corner icon for the rounding inputs: a faint square with the one corner it edits drawn rounded and bright
 * (top-left by default, rotated for the others)
 */
const CornerIcon = ({ corner }: { corner: 'tl' | 'tr' | 'br' | 'bl' }) => {
    const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[corner]
    const label = { tl: 'Canto superior esquerdo', tr: 'Canto superior direito', br: 'Canto inferior direito', bl: 'Canto inferior esquerdo' }[corner]
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-label={label} role="img" style={{ transform: `rotate(${rotation}deg)` }}>
            <title>{label}</title>
            {/* The rest of the square, faint */}
            <path d="M7 1.5H10.5V10.5H1.5V7" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
            {/* The edited corner, rounded */}
            <path d="M1.5 7V5A3.5 3.5 0 0 1 5 1.5H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    )
}

/** Four values with a lock: locked edits all at once, unlocked edits each one */
const SidesControl = ({ label, labels, value, onChange }: {
    label: string
    labels: [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode]
    value?: SectionSides
    onChange: (value: SectionSides) => void
}) => {
    const v = { ...NO_SIDES, ...(value || {}) }
    const parse = (text: string) => Math.max(0, parseInt(text.replace(/\D/g, '')) || 0)
    const keys = ['top', 'right', 'bottom', 'left'] as const
    const set = (key: typeof keys[number] | 'all', text: string) => {
        const n = parse(text)
        onChange(key === 'all' ? { ...v, top: n, right: n, bottom: n, left: n } : { ...v, [key]: n })
    }
    const toggleLock = () => onChange(v.isLocked
        ? { ...v, isLocked: false }
        // Locking evens every side out to the first one
        : { isLocked: true, top: v.top, right: v.top, bottom: v.top, left: v.top })

    return (
        <div className="flex flex-col gap-2 border-b border-[#333] pb-4">
            <div className="flex items-center justify-between">
                <Label className="mb-0 text-[#97A1B3]">{label}</Label>
                <button
                    onClick={toggleLock}
                    className="text-[#97A1B3] hover:text-white transition-colors"
                    title={v.isLocked ? "Definir cada lado" : "Igual em todos os lados"}
                >
                    {v.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
            </div>

            {v.isLocked ? (
                <div className="flex items-center justify-between w-full mt-2">
                    <span className="text-[#97A1B3] text-[10px] font-medium">ALL</span>
                    <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[26px] w-[60px]">
                        <input
                            type="text"
                            value={v.top}
                            onChange={(e) => set('all', e.target.value)}
                            className="bg-transparent border-none text-white text-xs w-full text-right outline-none px-1"
                        />
                        <span className="text-[#97A1B3] text-[10px] select-none">px</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-1">
                    {keys.map((key, i) => (
                        <div key={key} className="flex flex-col items-center gap-1">
                            <span className="text-[#97A1B3] text-[9px] h-3 flex items-center">{labels[i]}</span>
                            <input
                                type="text"
                                value={v[key]}
                                onChange={(e) => set(key, e.target.value)}
                                className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

interface SectionSettingsPanelProps {
    settings?: Partial<SectionSettings>
    onUpdate: (newSettings: SectionSettings) => void
    onClose: () => void
    // Actions
    // Cut / save as component / copy only show when the host editor supports them
    onCut?: () => void
    onSaveAsComponent?: () => void
    onDuplicate: () => void
    onCopy?: () => void
    onDelete: () => void
    initialTop?: number
    initialLeft?: number
    brandId: string
    moduleId: string
    /** Another editor (proposals) stores section images its own way; default: the brandbook's media */
    uploadImage?: (file: File) => Promise<{ success: boolean, url?: string, error?: string }>
    /** Options the host editor can't render (proposals: no scroll effects nor free movement) */
    hiddenFeatures?: Array<'scrollEffect' | 'freeFlow'>
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
    moduleId,
    uploadImage,
    hiddenFeatures = []
}: SectionSettingsPanelProps) {
    const [selectedTab, setSelectedTab] = useState<'image' | 'color' | 'gradient'>(settings?.backgroundType || 'color')
    const [isSectionCopied, setIsSectionCopied] = useState(false)

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
    const [isFreeFlow, setIsFreeFlow] = useState(settings?.isFreeFlow || false)
    const [distribution, setDistribution] = useState(settings?.distribution || 'between-full')
    const [rowPadding, setRowPadding] = useState(settings?.rowPadding || 'S')
    const [isZoomImage, setIsZoomImage] = useState(settings?.isZoomImage || false)
    const [isVisible, setIsVisible] = useState(settings?.isVisible ?? true)
    const [backgroundImage, setBackgroundImage] = useState(settings?.backgroundImage)
    const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor || 'transparent')
    const [isFullWidth, setIsFullWidth] = useState(settings?.isFullWidth || false)
    const [isFullHeight, setIsFullHeight] = useState(settings?.isFullHeight || false)
    const [isFluid, setIsFluid] = useState(settings?.contentWidth === 'fluid')
    const [scrollEffect, setScrollEffect] = useState<'none' | 'rail' | 'stages'>(settings?.scrollEffect || 'none')
    const [railCardWidth, setRailCardWidth] = useState<number>(settings?.railCardWidth || 36)
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

    // Ensure panel stays within viewport
    const [safeTop, setSafeTop] = useState(initialTop)
    const [safeHeight, setSafeHeight] = useState(760)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const windowHeight = window.innerHeight
            const panelHeight = Math.min(760, windowHeight - 40) // 20px padding top/bottom
            const maxTop = windowHeight - panelHeight - 20
            setSafeHeight(panelHeight)
            // Never above the editor's top bar
            setSafeTop(Math.max(TOP_BAR_CLEARANCE, Math.min(initialTop, maxTop)))
        }
    }, [initialTop])

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
            isFreeFlow: isFreeFlow,
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

    const isVerticalColumns = settings?.columnDirection === 'vertical'

    const handleColChange = (col: number) => {
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
        // Reset custom widths when a standard preset is chosen and Lock grid resizing
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

    const handleFreeFlowChange = (freeFlow: boolean) => {
        setIsFreeFlow(freeFlow)
        emitUpdate({ isFreeFlow: freeFlow })
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
        if (file && (brandId || uploadImage)) {
            setIsUploading(true)
            try {
                let result: { success: boolean, url?: string, error?: string }
                if (uploadImage) {
                    result = await uploadImage(file)
                } else {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('brandId', brandId)
                    formData.append('moduleId', moduleId)
                    result = await uploadBrandbookMedia(formData)
                }
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
            className="fixed z-[9999] bg-[#1F1F25] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: safeTop,
                left: initialLeft,
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: '270px',
                height: `${safeHeight}px`
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
                    className="w-[18px] h-[18px] bg-black rounded-full hover:opacity-80 transition-opacity"
                />
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
                                isVerticalColumns && "flex-col",
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
                                isVerticalColumns && "flex-col",
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
                                isVerticalColumns && "flex-col",
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

                {/* 1.1 Direção das colunas */}
                <div className="flex flex-col gap-2 -mt-3">
                    <span className="text-[#97A1B3] text-[0.75rem] font-medium">Direção</span>
                    <div className="flex gap-1 w-full bg-[#15161B] rounded-[4px] p-1">
                        {([
                            { id: 'horizontal', label: 'Horizontal', icon: Columns3, title: 'Colunas lado a lado' },
                            { id: 'vertical', label: 'Vertical', icon: Rows3, title: 'Colunas empilhadas, uma por baixo da outra' },
                        ] as const).map(option => {
                            const active = (settings?.columnDirection || 'horizontal') === option.id
                            return (
                                <button
                                    key={option.id}
                                    title={option.title}
                                    onClick={() => emitUpdate({ columnDirection: option.id })}
                                    className={cn(
                                        "flex-1 h-[30px] flex items-center justify-center gap-1.5 rounded-[2px] text-[11px] font-medium transition-colors",
                                        active ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                                    )}
                                >
                                    <option.icon className="w-3.5 h-3.5" />
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 1.2 Distribuição das colunas */}
                <div className="flex flex-col gap-2 -mt-3">
                    <span className="text-[#97A1B3] text-[0.75rem] font-medium">Distribuição</span>
                    <div className="grid grid-cols-5 gap-1 w-full bg-[#15161B] rounded-[4px] p-1">
                        {([
                            { id: 'fill', title: 'Preencher — as colunas ocupam todo o espaço' },
                            { id: 'packed', title: 'Agrupar — as colunas ficam juntas, onde o alinhamento indicar' },
                            { id: 'between', title: 'Espaço entre — o espaço livre fica entre as colunas' },
                            { id: 'around', title: 'Espaço à volta — o espaço livre fica à volta de cada coluna' },
                            { id: 'evenly', title: 'Distribuído — espaços iguais entre as colunas e nas pontas' },
                        ] as const).map(option => {
                            const current = settings?.columnDistribution || (isVerticalColumns ? 'packed' : 'fill')
                            return (
                                <button
                                    key={option.id}
                                    title={option.title}
                                    aria-label={option.title}
                                    onClick={() => emitUpdate({ columnDistribution: option.id })}
                                    className={cn(
                                        "h-[30px] flex items-center justify-center rounded-[2px] transition-colors",
                                        current === option.id ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                                    )}
                                >
                                    <DistributionIcon type={option.id} vertical={isVerticalColumns} />
                                </button>
                            )
                        })}
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

                {/* 2.55 Content width: the padding sets the margins (no fixed content box) */}
                <div className="flex items-center justify-between mt-4 gap-3">
                    <div className="flex flex-col">
                        <Label className="mb-0 text-[#97A1B3]">Conteúdo segue o padding</Label>
                        <span className="text-[10px] text-[#666] leading-snug mt-0.5">Sem largura fixa: o conteúdo ocupa tudo menos o padding.</span>
                    </div>
                    <div
                        className={cn(
                            "w-[36px] h-[20px] rounded-[999px] relative cursor-pointer transition-colors shrink-0",
                            isFluid ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                        )}
                        onClick={() => { const next = !isFluid; setIsFluid(next); emitUpdate({ contentWidth: next ? 'fluid' : 'boxed' }) }}
                    >
                        <div className={cn(
                            "w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                            isFluid ? "right-[2px]" : "left-[2px]"
                        )} />
                    </div>
                </div>

                {/* 2.58 Scroll effect */}
                {!hiddenFeatures.includes('scrollEffect') && <div className="flex flex-col gap-2 mt-5">
                    <Label className="mb-0 text-[#97A1B3]">Efeito de scroll</Label>
                    <div className="grid grid-cols-3 gap-1 bg-[#15161B] p-1 rounded-md">
                        {([['none', 'Nenhum'], ['rail', 'Faixa horizontal'], ['stages', 'Etapas fixas']] as const).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => { setScrollEffect(id); emitUpdate({ scrollEffect: id }) }}
                                className={cn("h-8 rounded text-[11px] font-semibold transition-colors", scrollEffect === id ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white")}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {scrollEffect === 'rail' && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-[#97A1B3]">Largura de cada cartão</span>
                                <span className="text-[11px] text-white">{railCardWidth}% do ecrã</span>
                            </div>
                            <input type="range" min={20} max={80} value={railCardWidth} onChange={(e) => { const v = Number(e.target.value); setRailCardWidth(v); emitUpdate({ railCardWidth: v }) }} className="w-full accent-[#FF0054]" />
                        </div>
                    )}
                    <span className="text-[10px] text-[#666] leading-snug">
                        {scrollEffect === 'rail' ? 'A secção fica fixa no ecrã e as colunas passam na horizontal enquanto se desce, a dobrar com a velocidade. Veja em Preview.'
                            : scrollEffect === 'stages' ? 'A secção fica fixa e percorre os blocos da primeira coluna, um por ecrã. As outras colunas mostram o bloco da etapa atual (ex.: um texto por etapa à esquerda, uma imagem por etapa à direita). Veja em Preview.'
                                : 'A secção desce normalmente.'}
                    </span>
                </div>}

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

                {/* 3.55 Margem e arredondamento da secção */}
                <SidesControl
                    label="Margem section"
                    labels={['T', 'R', 'B', 'L']}
                    value={settings?.sectionMargin}
                    onChange={(sectionMargin) => emitUpdate({ sectionMargin })}
                />
                <SidesControl
                    label="Arredondamento"
                    labels={[<CornerIcon key="tl" corner="tl" />, <CornerIcon key="tr" corner="tr" />, <CornerIcon key="br" corner="br" />, <CornerIcon key="bl" corner="bl" />]}
                    value={settings?.sectionRadius}
                    onChange={(sectionRadius) => emitUpdate({ sectionRadius })}
                />
                <BorderControl
                    label="Borda section"
                    value={settings?.sectionBorder}
                    onChange={(sectionBorder) => emitUpdate({ sectionBorder })}
                />

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

                {/* 3.9 Largura: fit to content / fill the width */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <Label className="mb-0 text-[#97A1B3]">Largura</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-1 bg-[#15161B] rounded-[4px] p-1 mb-[6px]">
                        {([
                            { id: 'fit', label: 'Ajustar ao conteúdo', title: 'Fit to content — a secção tem só a largura do seu conteúdo' },
                            { id: 'fill', label: 'Preencher', title: 'Fill container — a secção ocupa toda a largura disponível' },
                        ] as const).map(option => {
                            const active = (settings?.widthMode || 'fill') === option.id
                            return (
                                <button
                                    key={option.id}
                                    title={option.title}
                                    onClick={() => emitUpdate({ widthMode: option.id })}
                                    className={cn(
                                        "h-[28px] rounded-[2px] text-[11px] font-medium transition-colors",
                                        active ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                                    )}
                                >
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 4. Altura */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <Label className="mb-0 text-[#97A1B3]">Altura</Label>
                        <RotateCcw
                            className="w-[18px] h-[18px] text-[#97A1B3] cursor-pointer hover:text-white"
                            onClick={() => handleHeightChange('')} // Reset to auto
                        />
                    </div>
                    {/* Fit to content / Fill container */}
                    <div className="grid grid-cols-2 gap-1 bg-[#15161B] rounded-[4px] p-1 mb-[6px]">
                        {([
                            { id: 'fit', label: 'Ajustar ao conteúdo', title: 'Fit to content — a secção tem só a altura do seu conteúdo' },
                            { id: 'fill', label: 'Preencher', title: 'Fill container — a secção ocupa toda a altura que sobra na página' },
                        ] as const).map(option => {
                            const active = selectedHeight === option.id
                            return (
                                <button
                                    key={option.id}
                                    title={option.title}
                                    // Clicking the active mode again goes back to the default (auto)
                                    onClick={() => handleHeightChange(active ? '' : option.id)}
                                    className={cn(
                                        "h-[28px] rounded-[2px] text-[11px] font-medium transition-colors",
                                        active ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                                    )}
                                >
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                    <div className="flex gap-[6px] w-full">
                        {['XS', 'S', 'M', 'L', 'XL', '100vh'].map((size) => (
                            <button
                                key={size}
                                title={size === '100vh' ? "Altura total do ecrã" : undefined}
                                onClick={() => handleHeightChange(size)}
                                className={cn(
                                    "flex-1 h-[35px] flex items-center justify-center border rounded-[2px] cursor-pointer text-[10px] font-medium transition-colors uppercase",
                                    selectedHeight === size
                                        ? "border-[#FF0054] text-[#FF0054]"
                                        : "border-[#15161B] text-[#97A1B3] hover:border-[#FF0054] hover:text-[#FF0054]"
                                )}
                            >
                                {size === '100vh' ? <span className="normal-case">100vh</span> : size}
                            </button>
                        ))}
                    </div>

                    {/* Manual Height Input */}
                    <div className="flex items-center justify-between w-full mt-3 bg-[#15161B] border border-[#333] rounded-[2px] px-2 h-[28px]">
                        <span className="text-[#97A1B3] text-[10px] font-medium uppercase tracking-wider">Valor manual</span>
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={!['XS', 'S', 'M', 'L', 'XL', '100vh', 'fit', 'fill', ''].includes(selectedHeight) ? selectedHeight.replace('px', '') : ''}
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

                {/* 6. Grid, Redimensionamento & Movimento livre */}
                <div className="flex flex-col gap-3">
                    {selectedCol !== 1 && (
                        <div>
                            <Label className="text-[#97A1B3]">Grid</Label>

                            {/* Visual Selectors for 2 and 3 Cols */}
                            {selectedCol === 2 && (
                                <div className="flex gap-[6px] w-full mb-3">
                                    {/* 50/50 */}
                                    <button onClick={() => handleGridOptionChange(0)} className={cn("flex-1 h-[35px] border rounded-[2px] flex cursor-pointer", gridOption === 0 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                        <div className="w-1/2 h-full border-r border-inherit opacity-50" />
                                        <div className="w-1/2 h-full" />
                                    </button>
                                    {/* 30/70 - Right gets bg-[#27282D] */}
                                    <button onClick={() => handleGridOptionChange(1)} className={cn("flex-1 h-[35px] border rounded-[2px] flex cursor-pointer", gridOption === 1 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                        <div className="w-[30%] h-full border-r border-inherit opacity-50" />
                                        <div className="w-[70%] h-full bg-[#27282D]" />
                                    </button>
                                    {/* 70/30 - Left gets bg-[#27282D] */}
                                    <button onClick={() => handleGridOptionChange(2)} className={cn("flex-1 h-[35px] border rounded-[2px] flex cursor-pointer", gridOption === 2 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                        <div className="w-[70%] h-full border-r border-inherit opacity-50 bg-[#27282D]" />
                                        <div className="w-[30%] h-full" />
                                    </button>
                                </div>
                            )}

                            {selectedCol === 3 && (
                                <div className="flex gap-[6px] w-full mb-3">
                                    {/* Equal */}
                                    <button onClick={() => handleGridOptionChange(0)} className={cn("flex-1 h-[35px] border rounded-[2px] flex cursor-pointer", gridOption === 0 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                        <div className="flex-1 h-full border-r border-inherit opacity-50" />
                                        <div className="flex-1 h-full border-r border-inherit opacity-50" />
                                        <div className="flex-1 h-full" />
                                    </button>
                                    {/* Left Heavy 50/25/25 */}
                                    <button onClick={() => handleGridOptionChange(1)} className={cn("flex-1 h-[35px] border rounded-[2px] flex cursor-pointer", gridOption === 1 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                        <div className="w-1/2 h-full border-r border-inherit bg-[#27282D]" />
                                        <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                        <div className="w-1/4 h-full" />
                                    </button>
                                    {/* Center Heavy 25/50/25 */}
                                    <button onClick={() => handleGridOptionChange(2)} className={cn("flex-1 h-[35px] border rounded-[2px] flex cursor-pointer", gridOption === 2 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                        <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                        <div className="w-1/2 h-full border-r border-inherit bg-[#27282D]" />
                                        <div className="w-1/4 h-full" />
                                    </button>
                                    {/* Right Heavy 25/25/50 */}
                                    <button onClick={() => handleGridOptionChange(3)} className={cn("flex-1 h-[35px] border rounded-[2px] flex cursor-pointer", gridOption === 3 ? "border-[#FF0054]" : "border-[#333] hover:border-[#FF0054]")}>
                                        <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                        <div className="w-1/4 h-full border-r border-inherit opacity-50" />
                                        <div className="w-1/2 h-full bg-[#27282D]" />
                                    </button>
                                </div>
                            )}

                            {/* Redimensionar largura das colunas Toggle */}
                            <div className="flex items-center justify-between py-1">
                                <Label className="mb-0 text-[#97A1B3]">Redimensionar colunas</Label>
                                <button
                                    type="button"
                                    onClick={() => handleGridUnlockChange(!isGridUnlocked)}
                                    className={cn(
                                        "w-[44px] h-[24px] rounded-full relative transition-colors duration-200 cursor-pointer",
                                        isGridUnlocked ? "bg-[#FF0054]" : "bg-[#2A2B35]"
                                    )}
                                    title="Habilita os controles para redimensionar a largura das colunas"
                                >
                                    <div className={cn(
                                        "w-[20px] h-[20px] rounded-full bg-white absolute top-[2px] transition-transform duration-200 shadow-md",
                                        isGridUnlocked ? "translate-x-[22px]" : "translate-x-[2px]"
                                    )} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Movimento livre Toggle */}
                    {!hiddenFeatures.includes('freeFlow') && <div className={cn("flex items-center justify-between py-1", selectedCol !== 1 && "border-t border-[#333]/30 pt-2")}>
                        <Label className="mb-0 text-[#97A1B3]">Movimento livre</Label>
                        <button
                            type="button"
                            onClick={() => handleFreeFlowChange(!isFreeFlow)}
                            className={cn(
                                "w-[44px] h-[24px] rounded-full relative transition-colors duration-200 cursor-pointer",
                                isFreeFlow ? "bg-[#FF0054]" : "bg-[#2A2B35]"
                            )}
                            title="Habilita o movimento livre das colunas dentro da seção"
                        >
                            <div className={cn(
                                "w-[20px] h-[20px] rounded-full bg-white absolute top-[2px] transition-transform duration-200 shadow-md",
                                isFreeFlow ? "translate-x-[22px]" : "translate-x-[2px]"
                            )} />
                        </button>
                    </div>}
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
                                        <img loading="lazy" decoding="async" src={backgroundImage} alt="Background" className="w-full h-full object-cover opacity-30" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {selectedTab === 'color' && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-[#333] overflow-hidden relative">
                            <SmoothColorInput
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

                        {/* Gradient Preview Area (radial: center handle + size) */}
                        {backgroundGradient.type === 'radial' ? (
                            <RadialGradientEditor gradient={backgroundGradient} onChange={handleGradientChange} />
                        ) : (
                            <div
                                className="h-10 rounded-md border border-[#333]"
                                style={{ background: sectionGradientCss(backgroundGradient) }}
                            />
                        )}

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
                                            <SmoothColorInput
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
                {onCut && <>
                    <button onClick={onCut} className="text-[#97A1B3] hover:text-white" title="Cortar Seção"><Scissors className="w-5 h-5" /></button>
                    <div className="w-[1px] h-[20px] bg-[#333]" />
                </>}
                {onSaveAsComponent && <>
                    <button onClick={onSaveAsComponent} className="text-[#97A1B3] hover:text-white" title="Salvar como Componente"><LayoutGrid className="w-5 h-5" /></button>
                    <div className="w-[1px] h-[20px] bg-[#333]" />
                </>}
                {onCopy && <>
                    <button
                        onClick={() => {
                            onCopy()
                            setIsSectionCopied(true)
                            setTimeout(() => setIsSectionCopied(false), 2000)
                        }}
                        className={cn("transition-colors", isSectionCopied ? "text-green-400" : "text-[#97A1B3] hover:text-white")}
                        title={isSectionCopied ? "Seção copiada!" : "Copiar Seção"}
                    >
                        {isSectionCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <div className="w-[1px] h-[20px] bg-[#333]" />
                </>}
                <button onClick={onDuplicate} className="text-[#97A1B3] hover:text-white" title="Duplicar Seção"><RotateCcw className="w-5 h-5" /></button>
                <div className="w-[1px] h-[20px] bg-[#333]" />
                <button onClick={onDelete} className="text-[#97A1B3] hover:text-[#FF0054]" title="Deletar Seção"><Trash2 className="w-5 h-5" /></button>
            </div >
        </div >,
        document.body
    )
}

