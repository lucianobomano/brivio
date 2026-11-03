"use client"

import React, { useLayoutEffect, useRef, useState } from "react"
import { ImagePlus, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ColorRow, Range, Segmented, Title, Toggle } from "./blocks/panelControls"

/**
 * Background of a page (proposal pages, brandbook pages): a picture with filters and a colour tint, or a
 * gradient (linear, radial, diamond, angular, fluid with colour points). Drawn on its own layer behind the
 * content, so blur, opacity and filters never touch the text.
 */

export type FillType = "none" | "image" | "gradient"
export type GradientKind = "linear" | "radial" | "diamond" | "conic" | "fluid"
export type ImageFit = "cover" | "contain" | "stretch" | "tile"
/** Every blend mode the browser draws (the Photoshop / Illustrator ones that have a CSS equivalent) */
export type BlendMode = "normal" | "darken" | "multiply" | "color-burn" | "lighten" | "screen" | "color-dodge" | "plus-lighter"
    | "overlay" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"

export interface FillStop { id: string, color: string, opacity: number, offset: number }
export interface FluidPoint { id: string, x: number, y: number, color: string, opacity: number, size: number, feather: number, ratio?: number }

export interface FillGradient {
    kind: GradientKind
    angle: number
    stops: FillStop[]
    center: { x: number, y: number }
    /** Radial: width of the shape in % of the box (0 = up to the farthest corner) */
    size: number
    /** Radial: height of the shape relative to its width */
    ratio: number
    /** Radial / diamond: how soft the transition is (100 = as the stops say, less = harder edge) */
    feather: number
    repeat: boolean
    /** Fluid: colour under the points and the points themselves */
    base: string
    points: FluidPoint[]
    /** Radial: more circles over the main one, each with its own place, colour, size, shape and feather */
    circles: FluidPoint[]
    /** Fluid: blur over the whole mix, in px */
    blur: number
    opacity: number
}

export interface FillImage {
    url: string
    fit: ImageFit
    /** Focal point, in % */
    x: number
    y: number
    /** Zoom in % (100 = as fitted) */
    scale: number
    /** «Padrão»: size of one tile in px */
    tile: number
    opacity: number
    blur: number
    brightness: number
    contrast: number
    saturation: number
    grayscale: number
    sepia: number
    hue: number
    tint: { enabled: boolean, color: string, opacity: number, blend: BlendMode }
}

export interface BackgroundFill {
    type: FillType
    image?: FillImage
    gradient?: FillGradient
}

const uid = () => Math.random().toString(36).slice(2, 9)

export const defaultGradient = (): FillGradient => ({
    kind: "linear", angle: 135,
    stops: [{ id: uid(), color: "#0E2B47", opacity: 100, offset: 0 }, { id: uid(), color: "#8BC34A", opacity: 100, offset: 100 }],
    center: { x: 50, y: 50 }, size: 0, ratio: 1, feather: 100, repeat: false,
    base: "#0E2B47",
    points: [
        { id: uid(), x: 20, y: 25, color: "#FF0054", opacity: 100, size: 70, feather: 100 },
        { id: uid(), x: 80, y: 30, color: "#06D6A0", opacity: 100, size: 65, feather: 100 },
        { id: uid(), x: 55, y: 85, color: "#390099", opacity: 100, size: 80, feather: 100 },
    ],
    circles: [],
    blur: 40, opacity: 100,
})

export const defaultImage = (url = ""): FillImage => ({
    url, fit: "cover", x: 50, y: 50, scale: 100, tile: 240,
    opacity: 100, blur: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, hue: 0,
    tint: { enabled: false, color: "#0E2B47", opacity: 40, blend: "multiply" },
})

const GRADIENT_PRESETS: { label: string, g: Partial<FillGradient> }[] = [
    { label: "Oceano", g: { kind: "linear", angle: 135, stops: [{ id: "a", color: "#0E2B47", opacity: 100, offset: 0 }, { id: "b", color: "#06B6D4", opacity: 100, offset: 100 }] } },
    { label: "Pôr do sol", g: { kind: "linear", angle: 160, stops: [{ id: "a", color: "#FF0054", opacity: 100, offset: 0 }, { id: "b", color: "#FFB000", opacity: 100, offset: 100 }] } },
    { label: "Brilho", g: { kind: "radial", center: { x: 50, y: 35 }, size: 0, stops: [{ id: "a", color: "#FFFFFF", opacity: 100, offset: 0 }, { id: "b", color: "#DDE6F3", opacity: 100, offset: 100 }] } },
    { label: "Lima", g: { kind: "diamond", stops: [{ id: "a", color: "#8BC34A", opacity: 100, offset: 0 }, { id: "b", color: "#0E2B47", opacity: 100, offset: 100 }] } },
    { label: "Espectro", g: { kind: "conic", angle: 0, stops: [{ id: "a", color: "#FF0054", opacity: 100, offset: 0 }, { id: "b", color: "#390099", opacity: 100, offset: 50 }, { id: "c", color: "#FF0054", opacity: 100, offset: 100 }] } },
    { label: "Aurora", g: { kind: "fluid" } },
]

// ---------------------------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------------------------

/** "#RRGGBB" with an opacity in % as "#RRGGBBAA" */
export const hexAlpha = (color: string, opacity = 100) => {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return color
    return opacity >= 100 ? color : color + Math.round(Math.max(0, opacity) * 2.55).toString(16).padStart(2, "0")
}

const sortedStops = (g: FillGradient) => [...g.stops].sort((a, b) => a.offset - b.offset)

const stopList = (g: FillGradient, squeeze = false) => {
    const f = Math.max(0.5, g.feather ?? 100)
    return sortedStops(g).map(s => `${hexAlpha(s.color, s.opacity)} ${squeeze ? (100 - f) + (s.offset * f) / 100 : s.offset}%`).join(", ")
}

/** Background layers of a gradient; pass the box size so circles stay round on any page shape */
export const gradientStyle = (g: FillGradient, box?: { width: number, height: number }): React.CSSProperties => {
    const rep = g.repeat ? "repeating-" : ""
    const cx = g.center?.x ?? 50, cy = g.center?.y ?? 50
    const ellipse = (sizePct: number, ratio: number) => {
        if (box && box.width > 0) { const rx = (sizePct / 100) * box.width / 2; return `ellipse ${Math.round(rx)}px ${Math.round(rx * ratio)}px` }
        return `ellipse ${sizePct / 2}% ${(sizePct / 2) * ratio}%`
    }
    switch (g.kind) {
        case "linear":
            return { backgroundImage: `${rep}linear-gradient(${g.angle}deg, ${stopList(g)})` }
        case "radial": {
            const shape = g.size ? ellipse(g.size, g.ratio || 1) : (g.ratio && g.ratio !== 1 ? "ellipse farthest-corner" : "circle farthest-corner")
            // Extra circles are layers over the main one (first layer = on top)
            const circles = (g.circles || []).map(c => {
                const solid = Math.min(99, 100 - (c.feather ?? 100))
                const col = hexAlpha(c.color, c.opacity)
                return `radial-gradient(${ellipse(c.size, c.ratio ?? 1)} at ${c.x}% ${c.y}%, ${col} 0%, ${col} ${solid}%, ${hexAlpha(c.color, 0)} 100%)`
            })
            return { backgroundImage: [...circles, `${rep}radial-gradient(${shape} at ${cx}% ${cy}%, ${stopList(g, true)})`].join(", ") }
        }
        case "conic":
            return { backgroundImage: `${rep}conic-gradient(from ${g.angle}deg at ${cx}% ${cy}%, ${stopList(g)})` }
        case "diamond": {
            // Four quadrants meeting at the centre, each a gradient from the centre to its corner
            const s = stopList(g, true)
            return {
                backgroundImage: [`linear-gradient(to top left, ${s})`, `linear-gradient(to top right, ${s})`, `linear-gradient(to bottom left, ${s})`, `linear-gradient(to bottom right, ${s})`].join(", "),
                backgroundSize: `${cx}% ${cy}%, ${100 - cx}% ${cy}%, ${cx}% ${100 - cy}%, ${100 - cx}% ${100 - cy}%`,
                backgroundPosition: "0% 0%, 100% 0%, 0% 100%, 100% 100%",
                backgroundRepeat: "no-repeat",
            }
        }
        case "fluid": {
            const layers = (g.points || []).map(p => {
                const solid = Math.min(99, 100 - (p.feather ?? 100))
                const c = hexAlpha(p.color, p.opacity)
                return `radial-gradient(${ellipse(p.size, 1)} at ${p.x}% ${p.y}%, ${c} 0%, ${c} ${solid}%, ${hexAlpha(p.color, 0)} 100%)`
            })
            return { backgroundColor: g.base, backgroundImage: layers.join(", ") || undefined }
        }
    }
}

export const hasFill = (fill?: BackgroundFill | null) =>
    !!fill && ((fill.type === "image" && !!fill.image?.url) || (fill.type === "gradient" && !!fill.gradient))

/** How a picture looks (fit, zoom, focal point, filters, tint): the page background and the image blocks */
export type ImageLook = Partial<Omit<FillImage, "url" | "tile">>

const LOOK_DEFAULTS = { fit: "cover" as ImageFit, x: 50, y: 50, scale: 100, opacity: 100, blur: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, hue: 0, tint: { enabled: false, color: "#0E2B47", opacity: 40, blend: "multiply" as BlendMode } }
const resolveLook = (l?: ImageLook | null) => ({ ...LOOK_DEFAULTS, ...(l || {}), tint: { ...LOOK_DEFAULTS.tint, ...(l?.tint || {}) } })

export const hasLook = (l?: ImageLook | null) => {
    if (!l) return false
    const r = resolveLook(l)
    return r.fit !== "cover" || r.x !== 50 || r.y !== 50 || r.scale !== 100 || r.opacity !== 100 || !!imageFilter(r as FillImage) || r.tint.enabled
}

/** Style of an <img> with object-fit: fit, focal point, zoom, opacity and filters */
export const imageLookStyle = (l?: ImageLook | null): React.CSSProperties => {
    if (!l) return {}
    const r = resolveLook(l)
    return {
        objectFit: r.fit === "stretch" ? "fill" : r.fit === "contain" ? "contain" : "cover",
        objectPosition: `${r.x}% ${r.y}%`,
        transform: r.scale !== 100 ? `scale(${r.scale / 100})` : undefined,
        transformOrigin: `${r.x}% ${r.y}%`,
        opacity: r.opacity !== 100 ? r.opacity / 100 : undefined,
        filter: imageFilter(r as FillImage),
    }
}

/** Colour laid over a picture (put it inside the picture's positioned box, after the <img>) */
export function ImageTint({ look, style }: { look?: ImageLook | null, style?: React.CSSProperties }) {
    const t = resolveLook(look).tint
    if (!look || !t.enabled) return null
    return <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundColor: t.color, opacity: t.opacity / 100, mixBlendMode: t.blend as React.CSSProperties["mixBlendMode"], ...style }} />
}

const imageFilter = (i: FillImage) => [
    i.blur ? `blur(${i.blur}px)` : "",
    i.brightness !== 100 ? `brightness(${i.brightness}%)` : "",
    i.contrast !== 100 ? `contrast(${i.contrast}%)` : "",
    i.saturation !== 100 ? `saturate(${i.saturation}%)` : "",
    i.grayscale ? `grayscale(${i.grayscale}%)` : "",
    i.sepia ? `sepia(${i.sepia}%)` : "",
    i.hue ? `hue-rotate(${i.hue}deg)` : "",
].filter(Boolean).join(" ") || undefined

/** Size of an element, kept up to date */
const useBox = () => {
    const ref = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState<{ width: number, height: number } | undefined>()
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(() => setBox({ width: el.clientWidth, height: el.clientHeight }))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return [ref, box] as const
}

/** The background layer: put it first inside a positioned element; the content after it must be positioned too */
export function FillLayer({ fill, className }: { fill?: BackgroundFill | null, className?: string }) {
    const [ref, box] = useBox()
    if (!hasFill(fill)) return null
    const f = fill!
    return (
        <div ref={ref} aria-hidden className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)} style={{ borderRadius: "inherit", zIndex: 0 }}>
            {f.type === "image" && f.image && (() => {
                const i = { ...defaultImage(), ...f.image }
                // A blurred picture is drawn a bit larger, so its edges don't fade to white
                const bleed = i.blur ? i.blur * 2 : 0
                return (
                    <>
                        <div
                            className="absolute"
                            style={{
                                inset: -bleed,
                                backgroundImage: `url("${i.url}")`,
                                backgroundSize: i.fit === "tile" ? `${i.tile}px auto` : i.fit === "stretch" ? "100% 100%" : i.fit,
                                backgroundRepeat: i.fit === "tile" ? "repeat" : "no-repeat",
                                backgroundPosition: `${i.x}% ${i.y}%`,
                                transform: i.fit !== "tile" && i.scale !== 100 ? `scale(${i.scale / 100})` : undefined,
                                transformOrigin: `${i.x}% ${i.y}%`,
                                opacity: i.opacity / 100,
                                filter: imageFilter(i),
                            }}
                        />
                        {i.tint?.enabled && (
                            <div className="absolute inset-0" style={{ backgroundColor: i.tint.color, opacity: i.tint.opacity / 100, mixBlendMode: i.tint.blend as React.CSSProperties["mixBlendMode"] }} />
                        )}
                    </>
                )
            })()}
            {f.type === "gradient" && f.gradient && (() => {
                const g = { ...defaultGradient(), ...f.gradient }
                const blur = g.kind === "fluid" ? g.blur : 0
                return (
                    <div
                        className="absolute"
                        style={{ inset: -blur * 2, ...gradientStyle(g, box && { width: box.width + blur * 4, height: box.height + blur * 4 }), opacity: g.opacity / 100, filter: blur ? `blur(${blur}px)` : undefined }}
                    />
                )
            })()}
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------------------------

const Hr = () => <div className="h-px bg-[#333]" />

/** A box where handles are dragged (gradient centre, fluid points, image focal point) */
const DragArea = ({ background, handles, selected, onSelect, onMove, onAdd, height = 140, children }: {
    background: React.CSSProperties
    handles: { id: string, x: number, y: number, color?: string }[]
    selected?: string | null
    onSelect?: (id: string) => void
    onMove: (id: string, x: number, y: number) => void
    onAdd?: (x: number, y: number) => void
    height?: number
    children?: React.ReactNode
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const drag = useRef<string | null>(null)
    const at = (e: { clientX: number, clientY: number }) => {
        const r = ref.current!.getBoundingClientRect()
        return { x: Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))), y: Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))) }
    }
    React.useEffect(() => {
        const move = (e: PointerEvent) => { if (drag.current) { const p = at(e); onMove(drag.current, p.x, p.y) } }
        const up = () => { drag.current = null }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up) }
    })
    return (
        <div
            ref={ref}
            className="relative w-full rounded-lg overflow-hidden border border-white/10 cursor-crosshair select-none"
            style={{ height, backgroundColor: "#ffffff", backgroundImage: "linear-gradient(45deg,#e5e5e5 25%,transparent 25%,transparent 75%,#e5e5e5 75%),linear-gradient(45deg,#e5e5e5 25%,transparent 25%,transparent 75%,#e5e5e5 75%)", backgroundSize: "12px 12px", backgroundPosition: "0 0,6px 6px" }}
            onDoubleClick={(e) => { if (onAdd) { const p = at(e); onAdd(p.x, p.y) } }}
        >
            <div className="absolute inset-0" style={background} />
            {children}
            {handles.map(h => (
                <button
                    key={h.id}
                    type="button"
                    title="Arraste para mover"
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); drag.current = h.id; onSelect?.(h.id) }}
                    className={cn("absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 shadow-md transition-transform", selected === h.id ? "border-white scale-125 ring-2 ring-[#FF0054]" : "border-white")}
                    style={{ left: `${h.x}%`, top: `${h.y}%`, backgroundColor: h.color || "#FF0054" }}
                />
            ))}
        </div>
    )
}

/** Colour stops on a bar: drag a stop, click the bar to add one, select one to edit it */
const StopsBar = ({ g, selected, onSelect, onChange }: { g: FillGradient, selected: string | null, onSelect: (id: string) => void, onChange: (stops: FillStop[]) => void }) => {
    const ref = useRef<HTMLDivElement>(null)
    const drag = useRef<string | null>(null)
    const pos = (clientX: number) => { const r = ref.current!.getBoundingClientRect(); return Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))) }
    React.useEffect(() => {
        const move = (e: PointerEvent) => { if (drag.current) { const o = pos(e.clientX); onChange(g.stops.map(s => s.id === drag.current ? { ...s, offset: o } : s)) } }
        const up = () => { drag.current = null }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up) }
    })
    return (
        <div className="pt-1 pb-3">
            <div
                ref={ref}
                className="relative h-5 rounded-md border border-white/10 cursor-copy"
                style={{ backgroundImage: `linear-gradient(90deg, ${stopList({ ...g, feather: 100 })}), linear-gradient(45deg,#444 25%,transparent 25%,transparent 75%,#444 75%),linear-gradient(45deg,#444 25%,transparent 25%,transparent 75%,#444 75%)`, backgroundSize: "100% 100%, 8px 8px, 8px 8px", backgroundPosition: "0 0, 0 0, 4px 4px" }}
                title="Clique para adicionar uma cor"
                onPointerDown={(e) => {
                    if (e.target !== e.currentTarget) return
                    const offset = pos(e.clientX)
                    const near = sortedStops(g).reduce((a, b) => Math.abs(b.offset - offset) < Math.abs(a.offset - offset) ? b : a)
                    const stop = { id: uid(), color: near.color, opacity: near.opacity, offset }
                    onChange([...g.stops, stop]); onSelect(stop.id)
                }}
            >
                {g.stops.map(s => (
                    <button
                        key={s.id}
                        type="button"
                        title={`${s.color} · ${s.offset}%`}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); drag.current = s.id; onSelect(s.id) }}
                        className={cn("absolute top-1/2 w-3.5 h-6 -ml-[7px] -translate-y-1/2 rounded-[4px] border-2 shadow", selected === s.id ? "border-white ring-2 ring-[#FF0054]" : "border-white/80")}
                        style={{ left: `${s.offset}%`, backgroundColor: s.color }}
                    />
                ))}
            </div>
        </div>
    )
}

const GradientEditor = ({ value, onChange }: { value: FillGradient, onChange: (g: FillGradient) => void }) => {
    const g = value
    const set = (patch: Partial<FillGradient>) => onChange({ ...g, ...patch })
    const [stopId, setStopId] = useState<string | null>(g.stops[0]?.id || null)
    const [pointId, setPointId] = useState<string | null>(g.points[0]?.id || null)
    // Radial: "center" (the main circle) or the id of one of the extra circles
    const [circleId, setCircleId] = useState<string>("center")
    const circles = g.circles || []
    const circle = circles.find(c => c.id === circleId)
    const setCircle = (patch: Partial<FluidPoint>) => circle && set({ circles: circles.map(c => c.id === circle.id ? { ...c, ...patch } : c) })
    const addCircle = (x = 50, y = 50) => {
        const c = { id: uid(), x, y, color: "#FFFFFF", opacity: 80, size: 40, feather: 100, ratio: 1 }
        set({ circles: [...circles, c] }); setCircleId(c.id)
    }
    const stop = g.stops.find(s => s.id === stopId) || g.stops[0]
    const point = g.points.find(p => p.id === pointId)
    const setStop = (patch: Partial<FillStop>) => set({ stops: g.stops.map(s => s.id === stop.id ? { ...s, ...patch } : s) })
    const setPoint = (patch: Partial<FluidPoint>) => point && set({ points: g.points.map(p => p.id === point.id ? { ...p, ...patch } : p) })
    const hasCenter = g.kind === "radial" || g.kind === "diamond" || g.kind === "conic"
    const previewBlur = g.kind === "fluid" ? Math.round(g.blur / 3) : 0
    // The preview is drawn at its own size, so circles there are round like on the page
    const [previewRef, previewBox] = useBox()

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-1.5">
                {GRADIENT_PRESETS.map(p => {
                    const pg = { ...defaultGradient(), ...p.g }
                    return (
                        <button key={p.label} type="button" title={p.label} onClick={() => onChange({ ...pg, stops: pg.stops.map(s => ({ ...s, id: uid() })), opacity: g.opacity })} className="h-9 rounded-md border border-white/10 hover:border-white/40 overflow-hidden relative">
                            <span className="absolute inset-0" style={{ ...gradientStyle(pg), filter: pg.kind === "fluid" ? "blur(6px)" : undefined }} />
                            <span className="relative text-[9px] font-bold text-white drop-shadow">{p.label}</span>
                        </button>
                    )
                })}
            </div>

            <div className="flex flex-col gap-2">
                <Title>Estilo</Title>
                <Segmented<GradientKind>
                    value={g.kind}
                    options={[{ id: "linear", label: "Linear" }, { id: "radial", label: "Radial" }, { id: "diamond", label: "Diamante" }, { id: "conic", label: "Angular" }, { id: "fluid", label: "Fluido" }]}
                    onChange={(kind) => set({ kind })}
                />
            </div>

            <div ref={previewRef}>
            <DragArea
                background={{ ...gradientStyle(g, previewBox && { width: previewBox.width, height: 140 }), opacity: g.opacity / 100, filter: previewBlur ? `blur(${previewBlur}px)` : undefined, transform: previewBlur ? "scale(1.1)" : undefined }}
                handles={g.kind === "fluid" ? g.points.map(p => ({ id: p.id, x: p.x, y: p.y, color: p.color }))
                    : hasCenter ? [{ id: "center", x: g.center.x, y: g.center.y, color: "#ffffff" }, ...(g.kind === "radial" ? circles.map(c => ({ id: c.id, x: c.x, y: c.y, color: c.color })) : [])] : []}
                selected={g.kind === "fluid" ? pointId : g.kind === "radial" ? circleId : "center"}
                onSelect={(id) => g.kind === "fluid" ? setPointId(id) : g.kind === "radial" && setCircleId(id)}
                onMove={(id, x, y) => g.kind === "fluid" ? set({ points: g.points.map(p => p.id === id ? { ...p, x, y } : p) })
                    : id === "center" ? set({ center: { x, y } }) : set({ circles: circles.map(c => c.id === id ? { ...c, x, y } : c) })}
                onAdd={g.kind === "fluid" ? (x, y) => { const p = { id: uid(), x, y, color: "#FF0054", opacity: 100, size: 60, feather: 100 }; set({ points: [...g.points, p] }); setPointId(p.id) }
                    : g.kind === "radial" ? (x, y) => addCircle(x, y) : undefined}
            />
            </div>

            {g.kind === "radial" && (
                <div className="flex flex-col gap-2">
                    <Title action={<button type="button" onClick={() => addCircle()} className="text-[10px] text-[#FF0054] hover:text-white flex items-center gap-1"><Plus className="w-3 h-3" /> Círculo</button>}>
                        Círculos (duplo clique na área para adicionar)
                    </Title>
                    <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => setCircleId("center")} className={cn("h-7 px-2 rounded-md border text-[11px]", circleId === "center" ? "border-[#FF0054] text-white" : "border-white/10 text-[#888]")}>Principal</button>
                        {circles.map((c, i) => (
                            <button key={c.id} type="button" onClick={() => setCircleId(c.id)} className={cn("h-7 pl-1.5 pr-2 rounded-md border flex items-center gap-1.5 text-[11px]", circleId === c.id ? "border-[#FF0054] text-white" : "border-white/10 text-[#888]")}>
                                <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: c.color }} /> {i + 1}
                            </button>
                        ))}
                    </div>
                    {circle && (
                        <div className="rounded-lg bg-[#16171C] border border-white/5 p-3 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-white font-medium">Círculo {circles.indexOf(circle) + 1}</span>
                                <button type="button" title="Remover este círculo" onClick={() => { set({ circles: circles.filter(c => c.id !== circle.id) }); setCircleId("center") }} className="text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                            <ColorRow label="Cor" value={circle.color} onChange={(color) => setCircle({ color })} />
                            <Range label="Opacidade" value={circle.opacity} min={0} max={100} unit="%" onChange={(opacity) => setCircle({ opacity })} />
                            <Range label="Tamanho" value={circle.size} min={5} max={250} unit="%" onChange={(size) => setCircle({ size })} />
                            <Range label="Forma (100 = círculo)" value={Math.round((circle.ratio ?? 1) * 100)} min={20} max={300} step={5} unit="%" onChange={(r) => setCircle({ ratio: r / 100 })} />
                            <Range label="Feather" value={circle.feather} min={0} max={100} unit="%" onChange={(feather) => setCircle({ feather })} />
                            <div className="grid grid-cols-2 gap-3">
                                <Range label="X" value={circle.x} min={0} max={100} unit="%" onChange={(x) => setCircle({ x })} />
                                <Range label="Y" value={circle.y} min={0} max={100} unit="%" onChange={(y) => setCircle({ y })} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {g.kind !== "fluid" && !(g.kind === "radial" && circle) ? (
                <>
                    <div className="flex flex-col gap-1">
                        <Title>Cores (clique na barra para adicionar)</Title>
                        <StopsBar g={g} selected={stop?.id || null} onSelect={setStopId} onChange={(stops) => set({ stops })} />
                    </div>
                    {stop && (
                        <div className="rounded-lg bg-[#16171C] border border-white/5 p-3 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-white font-medium">Cor selecionada</span>
                                <button type="button" disabled={g.stops.length <= 2} title="Remover esta cor" onClick={() => { set({ stops: g.stops.filter(s => s.id !== stop.id) }); setStopId(null) }} className="text-[#666] hover:text-[#FF0054] disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                            <ColorRow label="Cor" value={stop.color} onChange={(color) => setStop({ color })} />
                            <Range label="Opacidade" value={stop.opacity} min={0} max={100} unit="%" onChange={(opacity) => setStop({ opacity })} />
                            <Range label="Posição" value={stop.offset} min={0} max={100} unit="%" onChange={(offset) => setStop({ offset })} />
                        </div>
                    )}
                    {(g.kind === "linear" || g.kind === "conic") && (
                        <div className="flex flex-col gap-2">
                            <Range label={g.kind === "conic" ? "Rotação" : "Ângulo"} value={g.angle} min={0} max={360} unit="°" onChange={(angle) => set({ angle })} />
                            <div className="grid grid-cols-8 gap-1">
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                                    <button key={a} type="button" onClick={() => set({ angle: a })} className={cn("h-6 rounded text-[10px]", g.angle === a ? "bg-[#FF0054] text-white" : "bg-[#1A1C23] text-[#888] hover:text-white")}>{a}°</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {hasCenter && (
                        <div className="grid grid-cols-2 gap-3">
                            <Range label="Centro X" value={g.center.x} min={0} max={100} unit="%" onChange={(x) => set({ center: { ...g.center, x } })} />
                            <Range label="Centro Y" value={g.center.y} min={0} max={100} unit="%" onChange={(y) => set({ center: { ...g.center, y } })} />
                        </div>
                    )}
                    {g.kind === "radial" && (
                        <>
                            <Range label="Tamanho (0 = até ao canto)" value={g.size} min={0} max={250} unit="%" onChange={(size) => set({ size })} />
                            <Range label="Forma (100 = círculo)" value={Math.round(g.ratio * 100)} min={20} max={300} step={5} unit="%" onChange={(r) => set({ ratio: r / 100 })} />
                        </>
                    )}
                    {(g.kind === "radial" || g.kind === "diamond") && (
                        <Range label="Feather (suavidade)" value={g.feather} min={0} max={100} unit="%" onChange={(feather) => set({ feather })} />
                    )}
                    {g.kind !== "diamond" && <Toggle label="Repetir o padrão" checked={g.repeat} onChange={(repeat) => set({ repeat })} />}
                </>
            ) : g.kind === "fluid" ? (
                <>
                    <ColorRow label="Cor de base" value={g.base} onChange={(base) => set({ base })} />
                    <div className="flex flex-col gap-2">
                        <Title action={
                            <button type="button" onClick={() => { const p = { id: uid(), x: 50, y: 50, color: "#FFB000", opacity: 100, size: 60, feather: 100 }; set({ points: [...g.points, p] }); setPointId(p.id) }} className="text-[10px] text-[#FF0054] hover:text-white flex items-center gap-1"><Plus className="w-3 h-3" /> Ponto</button>
                        }>Pontos de cor (duplo clique na área para adicionar)</Title>
                        <div className="flex flex-wrap gap-1.5">
                            {g.points.map((p, i) => (
                                <button key={p.id} type="button" onClick={() => setPointId(p.id)} className={cn("h-7 pl-1.5 pr-2 rounded-md border flex items-center gap-1.5 text-[11px]", pointId === p.id ? "border-[#FF0054] text-white" : "border-white/10 text-[#888]")}>
                                    <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: p.color }} /> {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    {point && (
                        <div className="rounded-lg bg-[#16171C] border border-white/5 p-3 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-white font-medium">Ponto {g.points.indexOf(point) + 1}</span>
                                <button type="button" title="Remover este ponto" onClick={() => { set({ points: g.points.filter(p => p.id !== point.id) }); setPointId(null) }} className="text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                            <ColorRow label="Cor" value={point.color} onChange={(color) => setPoint({ color })} />
                            <Range label="Opacidade" value={point.opacity} min={0} max={100} unit="%" onChange={(opacity) => setPoint({ opacity })} />
                            <Range label="Abertura" value={point.size} min={5} max={200} unit="%" onChange={(size) => setPoint({ size })} />
                            <Range label="Feather" value={point.feather} min={0} max={100} unit="%" onChange={(feather) => setPoint({ feather })} />
                        </div>
                    )}
                    <Range label="Fluidez (desfoque da mistura)" value={g.blur} min={0} max={160} unit="px" onChange={(blur) => set({ blur })} />
                </>
            ) : null}
            <Hr />
            <Range label="Opacidade do gradiente" value={g.opacity} min={0} max={100} unit="%" onChange={(opacity) => set({ opacity })} />
        </div>
    )
}

// Grouped as in Photoshop: normal, darken, lighten, contrast, comparison, component
const BLEND_GROUPS: { label: string, modes: { id: BlendMode, label: string }[] }[] = [
    { label: "Normal", modes: [{ id: "normal", label: "Normal" }] },
    { label: "Escurecer", modes: [{ id: "darken", label: "Escurecer" }, { id: "multiply", label: "Multiplicar" }, { id: "color-burn", label: "Superexposição de cor" }] },
    { label: "Clarear", modes: [{ id: "lighten", label: "Clarear" }, { id: "screen", label: "Ecrã (Screen)" }, { id: "color-dodge", label: "Subexposição de cor" }, { id: "plus-lighter", label: "Subexposição linear (Adicionar)" }] },
    { label: "Contraste", modes: [{ id: "overlay", label: "Sobrepor" }, { id: "soft-light", label: "Luz suave" }, { id: "hard-light", label: "Luz forte" }] },
    { label: "Comparação", modes: [{ id: "difference", label: "Diferença" }, { id: "exclusion", label: "Exclusão" }] },
    { label: "Componente", modes: [{ id: "hue", label: "Matiz" }, { id: "saturation", label: "Saturação" }, { id: "color", label: "Cor" }, { id: "luminosity", label: "Luminosidade" }] },
]

/** Fit, zoom, focal point, filters and tint of a picture (page background and image blocks) */
export function ImageLookControls({ value, onChange, fits = ["cover", "contain", "stretch", "tile"], tile, onTileChange }: {
    value?: ImageLook | null
    onChange: (look: ImageLook) => void
    fits?: ImageFit[]
    tile?: number
    onTileChange?: (px: number) => void
}) {
    const i = resolveLook(value)
    const set = (patch: Partial<ImageLook>) => onChange({ ...i, ...patch })
    const setTint = (patch: Partial<FillImage["tint"]>) => set({ tint: { ...i.tint, ...patch } })
    const FIT_LABEL: Record<ImageFit, string> = { cover: "Cobrir", contain: "Conter", stretch: "Esticar", tile: "Padrão" }
    return (
        <div className="flex flex-col gap-4 text-[#97A1B3] text-sm">
            <div className="flex flex-col gap-2">
                <Title>Ajuste</Title>
                <Segmented<ImageFit> value={i.fit} options={fits.map(id => ({ id, label: FIT_LABEL[id] }))} onChange={(fit) => set({ fit })} />
            </div>
            {i.fit === "tile" && onTileChange
                ? <Range label="Tamanho do padrão" value={tile ?? 240} min={24} max={1200} unit="px" onChange={onTileChange} />
                : <Range label="Zoom" value={i.scale} min={100} max={300} unit="%" onChange={(scale) => set({ scale })} />}
            <div className="grid grid-cols-2 gap-3">
                <Range label="Posição X" value={i.x} min={0} max={100} unit="%" onChange={(x) => set({ x })} />
                <Range label="Posição Y" value={i.y} min={0} max={100} unit="%" onChange={(y) => set({ y })} />
            </div>

            <Hr />
            <Title action={
                <button type="button" title="Repor os filtros" onClick={() => set({ opacity: 100, blur: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, hue: 0 })} className="text-[#666] hover:text-white"><RotateCcw className="w-3 h-3" /></button>
            }>Filtros</Title>
            <Range label="Opacidade" value={i.opacity} min={0} max={100} unit="%" onChange={(opacity) => set({ opacity })} />
            <Range label="Desfoque" value={i.blur} min={0} max={40} unit="px" onChange={(blur) => set({ blur })} />
            <Range label="Brilho" value={i.brightness} min={0} max={200} unit="%" onChange={(brightness) => set({ brightness })} />
            <Range label="Contraste" value={i.contrast} min={0} max={200} unit="%" onChange={(contrast) => set({ contrast })} />
            <Range label="Saturação" value={i.saturation} min={0} max={300} unit="%" onChange={(saturation) => set({ saturation })} />
            <Range label="Preto e branco" value={i.grayscale} min={0} max={100} unit="%" onChange={(grayscale) => set({ grayscale })} />
            <Range label="Sépia" value={i.sepia} min={0} max={100} unit="%" onChange={(sepia) => set({ sepia })} />
            <Range label="Matiz" value={i.hue} min={0} max={360} unit="°" onChange={(hue) => set({ hue })} />

            <Hr />
            <Toggle label="Cor do filtro (coloração)" checked={i.tint.enabled} onChange={(enabled) => setTint({ enabled })} />
            {i.tint.enabled && (
                <>
                    <ColorRow label="Cor" value={i.tint.color} onChange={(color) => setTint({ color })} />
                    <Range label="Intensidade" value={i.tint.opacity} min={0} max={100} unit="%" onChange={(opacity) => setTint({ opacity })} />
                    <div className="flex flex-col gap-1.5">
                        <Title>Modo de mistura</Title>
                        <select value={i.tint.blend} onChange={(e) => setTint({ blend: e.target.value as BlendMode })} className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer">
                            {BLEND_GROUPS.map(g => (
                                <optgroup key={g.label} label={g.label}>
                                    {g.modes.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </>
            )}
        </div>
    )
}

const ImageEditor = ({ value, onChange, upload }: { value: FillImage, onChange: (i: FillImage) => void, upload?: (file: File) => Promise<{ success: boolean, url?: string, error?: string }> }) => {
    const i = { ...defaultImage(), ...value }
    const set = (patch: Partial<FillImage>) => onChange({ ...i, ...patch })
    const fileRef = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [urlInput, setUrlInput] = useState("")

    const pick = async (file: File) => {
        if (!upload) return
        setBusy(true); setError(null)
        try {
            const r = await upload(file)
            if (r.success && r.url) set({ url: r.url })
            else setError(r.error || "Não foi possível carregar a imagem.")
        } catch { setError("Não foi possível carregar a imagem.") }
        finally { setBusy(false) }
    }

    return (
        <div className="flex flex-col gap-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = "" }} />
            {i.url ? (
                <>
                    <DragArea
                        height={150}
                        background={{}}
                        handles={[{ id: "focus", x: i.x, y: i.y, color: "#FF0054" }]}
                        onMove={(_, x, y) => set({ x, y })}
                    >
                        <div className="absolute inset-0 overflow-hidden">
                            <FillLayer fill={{ type: "image", image: { ...i, blur: Math.min(i.blur, 8) } }} />
                        </div>
                    </DragArea>
                    <p className="text-[10px] text-[#666] -mt-2">Arraste o ponto para escolher o centro da imagem.</p>
                    <div className="flex gap-1.5">
                        <button type="button" disabled={!upload || busy} onClick={() => fileRef.current?.click()} className="flex-1 h-8 rounded-md bg-[#1A1C23] text-[12px] text-[#97A1B3] hover:text-white flex items-center justify-center gap-1.5 disabled:opacity-50">
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />} Trocar imagem
                        </button>
                        <button type="button" title="Remover a imagem" onClick={() => set({ url: "" })} className="w-9 h-8 rounded-md bg-[#1A1C23] text-[#97A1B3] hover:text-[#FF0054] flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-2">
                    <button type="button" disabled={!upload || busy} onClick={() => fileRef.current?.click()} className="h-24 rounded-lg border border-dashed border-white/15 hover:border-[#FF0054] text-[#97A1B3] hover:text-white flex flex-col items-center justify-center gap-1.5 text-[12px] disabled:opacity-50 transition-colors">
                        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                        {busy ? "A carregar…" : "Carregar imagem"}
                    </button>
                    <div className="flex gap-1.5">
                        <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="ou cole o endereço de uma imagem" className="flex-1 min-w-0 h-8 bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 text-[12px] text-white outline-none" />
                        <button type="button" disabled={!/^https?:\/\//.test(urlInput.trim())} onClick={() => { set({ url: urlInput.trim() }); setUrlInput("") }} className="h-8 px-3 rounded bg-[#FF0054] text-white text-[11px] font-bold disabled:opacity-40">Usar</button>
                    </div>
                </div>
            )}
            {error && <p className="text-[11px] text-[#FF5544]">{error}</p>}

            {i.url && (
                <ImageLookControls value={i} onChange={(look) => set(look)} tile={i.tile} onTileChange={(tile) => set({ tile })} />
            )}
        </div>
    )
}

/**
 * Editor of a background: the colour (optional, given by the caller), a picture or a gradient.
 * Dark panel style; place it inside a panel or popover.
 */
export function BackgroundFillEditor({ value, onChange, upload, color }: {
    value?: BackgroundFill | null
    onChange: (fill: BackgroundFill | null) => void
    upload?: (file: File) => Promise<{ success: boolean, url?: string, error?: string }>
    /** The colour tab (the page colour, under the picture / gradient); left out = no colour tab */
    color?: React.ReactNode
}) {
    const fill: BackgroundFill = value || { type: "none" }
    const [tab, setTab] = useState<"color" | "image" | "gradient">(fill.type === "image" ? "image" : fill.type === "gradient" ? "gradient" : color ? "color" : "image")
    const choose = (t: typeof tab) => {
        setTab(t)
        if (t === "color") onChange(null)
        else if (t === "image") onChange({ ...fill, type: "image", image: fill.image || defaultImage() })
        else onChange({ ...fill, type: "gradient", gradient: fill.gradient || defaultGradient() })
    }
    return (
        <div className="flex flex-col gap-4 text-[#97A1B3] text-sm">
            <div className="flex gap-1 p-1 bg-[#16171C] rounded-md">
                {([...(color ? [["color", "Cor"]] : []), ["image", "Imagem"], ["gradient", "Gradiente"]] as [typeof tab, string][]).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => choose(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>
            {tab === "color" && color}
            {tab === "image" && <ImageEditor value={fill.image || defaultImage()} upload={upload} onChange={(image) => onChange({ ...fill, type: "image", image })} />}
            {tab === "gradient" && <GradientEditor value={{ ...defaultGradient(), ...(fill.gradient || {}) }} onChange={(gradient) => onChange({ ...fill, type: "gradient", gradient })} />}
            {!color && hasFill(fill) && (
                <button type="button" onClick={() => onChange(null)} className="self-start text-[11px] text-[#666] hover:text-white underline underline-offset-4">Remover a imagem / gradiente</button>
            )}
        </div>
    )
}
