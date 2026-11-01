"use client"

import React, { createContext, useContext, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Pipette } from "lucide-react"
import { cn } from "@/lib/utils"
import { hexToHsv, hsvToHex } from "./inline-color-picker"

/**
 * Brivio colour picker. `ColorInput` is a drop-in replacement for <input type="color">: same props
 * (value / onChange with `e.target.value`, className, style, ref.click() to open), but it opens our own
 * picker: saturation area, hue bar, eyedropper, HEX / RGB / HSL fields, the brand colours first and then
 * the colours used recently.
 */

// ---------- Shared presets: brand colours (set by the brand pages) + recent colours ----------

type Listener = () => void
const listeners = new Set<Listener>()
const emit = () => listeners.forEach(l => l())
const subscribe = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l) } }

const RECENT_KEY = 'brivio.recentColors'
const RECENT_MAX = 16
let recentColors: string[] | null = null

const readRecent = () => {
    if (recentColors) return recentColors
    try { recentColors = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter((c: unknown) => typeof c === 'string') } catch { recentColors = [] }
    return recentColors as string[]
}

/**
 * The brand's colours (Settings → Colors), shown first in every picker opened inside the brand's pages.
 * A context (not a module variable) so it is always the live palette, also in pickers rendered in portals.
 */
export const PickerBrandColorsContext = createContext<string[]>([])

export const addRecentColor = (color: string) => {
    const hex = normalizeColor(color)
    if (!hex) return
    recentColors = [hex, ...readRecent().filter(c => c !== hex)].slice(0, RECENT_MAX)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentColors)) } catch { /* private mode */ }
    emit()
}

const EMPTY: string[] = []
const useBrandColors = () => {
    const colors = useContext(PickerBrandColorsContext)
    const key = colors.join(',')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => Array.from(new Set(colors.map(normalizeHex).filter(Boolean) as string[])), [key])
}
const useRecentColors = () => useSyncExternalStore(subscribe, readRecent, () => EMPTY)

// ---------- Colour maths ----------

/** A colour as its opaque hex and its opacity (0 – 1): #RGB, #RRGGBB, #RRGGBBAA, rgb() and rgba() */
export const parseColor = (value: string | undefined | null): { hex: string, alpha: number } | null => {
    const raw = (value || '').trim()
    const rgba = raw.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/i)
    if (rgba) {
        const a = rgba[4] === undefined ? 1 : Number(rgba[4]) / (rgba[5] ? 100 : 1)
        const hex = '#' + [rgba[1], rgba[2], rgba[3]].map(n => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0')).join('').toUpperCase()
        return { hex, alpha: Math.max(0, Math.min(1, a)) }
    }
    let v = raw.replace(/^#/, '')
    if (/^[0-9a-f]{3,4}$/i.test(v)) v = v.split('').map(c => c + c).join('')
    if (/^[0-9a-f]{8}$/i.test(v)) return { hex: `#${v.slice(0, 6).toUpperCase()}`, alpha: parseInt(v.slice(6, 8), 16) / 255 }
    return /^[0-9a-f]{6}$/i.test(v) ? { hex: `#${v.toUpperCase()}`, alpha: 1 } : null
}

/** The opaque hex of a colour (its opacity dropped) */
export const normalizeHex = (value: string | undefined | null): string | null => parseColor(value)?.hex ?? null

/** Hex with the opacity when it is not full: #RRGGBB or #RRGGBBAA */
export const formatColor = (hex: string, alpha = 1) =>
    alpha >= 0.995 ? hex : hex + Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0').toUpperCase()

/** A colour as the picker hands it out (#RRGGBB, or #RRGGBBAA when it is see-through) */
export const normalizeColor = (value: string | undefined | null): string | null => {
    const c = parseColor(value)
    return c ? formatColor(c.hex, c.alpha) : null
}

/** Checkerboard drawn under see-through colours */
export const CHECKER = 'repeating-conic-gradient(#C8C8C8 0% 25%, #FFFFFF 0% 50%) 0 0 / 8px 8px'

const hexToRgb = (hex: string) => {
    const v = (normalizeHex(hex) || '#000000').slice(1)
    return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) }
}
const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n || 0))).toString(16).padStart(2, '0')).join('').toUpperCase()

const rgbToHsl = ({ r, g, b }: { r: number, g: number, b: number }) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const l = (max + min) / 2
    let h = 0, s = 0
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
        h *= 60
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}
const hslToHex = (h: number, s: number, l: number) => {
    s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255)
}

// ---------- Picker panel ----------

type Format = 'hex' | 'rgb' | 'hsl'
const FORMAT_KEY = 'brivio.colorFormat'
const readFormat = (): Format => {
    try { const f = localStorage.getItem(FORMAT_KEY); return f === 'rgb' || f === 'hsl' ? f : 'hex' } catch { return 'hex' }
}

const HUE_GRADIENT = 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'

/** Drags on an element: calls `move` with the pointer position (0 – 1) and `end` when released */
const useDrag = (move: (x: number, y: number) => void, end: () => void) => {
    const moveRef = useRef(move)
    const endRef = useRef(end)
    useLayoutEffect(() => { moveRef.current = move; endRef.current = end })
    return useCallback((e: React.PointerEvent<HTMLElement>) => {
        e.preventDefault()
        const el = e.currentTarget
        const at = (cx: number, cy: number) => {
            const r = el.getBoundingClientRect()
            moveRef.current(Math.max(0, Math.min(1, (cx - r.left) / r.width)), Math.max(0, Math.min(1, (cy - r.top) / r.height)))
        }
        at(e.clientX, e.clientY)
        const onMove = (ev: PointerEvent) => at(ev.clientX, ev.clientY)
        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            endRef.current()
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }, [])
}

/** A number field that edits on Enter / blur and with the arrow keys */
const NumberField = ({ value, max, label, onCommit }: { value: number, max: number, label: string, onCommit: (n: number) => void }) => {
    const [draft, setDraft] = useState<string | null>(null)
    const commit = (raw: string) => {
        const n = Math.max(0, Math.min(max, Math.round(Number(raw))))
        if (!Number.isNaN(n)) onCommit(n)
        setDraft(null)
    }
    return (
        <label className="flex-1 min-w-0 flex flex-col items-center gap-1">
            <input
                inputMode="numeric"
                value={draft ?? String(value)}
                onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        commit(String(value + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)))
                    }
                }}
                className="w-full h-8 rounded-md bg-[#16171C] border border-white/10 focus:border-[#FF0054] text-center text-[12px] font-mono text-white outline-none"
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">{label}</span>
        </label>
    )
}

/** Opacity in %, edited like the other number fields */
const AlphaField = ({ value, onCommit }: { value: number, onCommit: (n: number) => void }) => {
    const [draft, setDraft] = useState<string | null>(null)
    const commit = (raw: string) => {
        const n = Math.max(0, Math.min(100, Math.round(Number(raw))))
        if (!Number.isNaN(n)) onCommit(n)
        setDraft(null)
    }
    return (
        <div className="h-7 flex items-center rounded-md bg-[#16171C] border border-white/10 focus-within:border-[#FF0054] px-2">
            <input
                inputMode="numeric"
                value={draft ?? String(value)}
                onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        commit(String(value + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)))
                    }
                }}
                className="w-full min-w-0 bg-transparent text-right text-[12px] font-mono text-white outline-none"
            />
            <span className="text-[11px] text-[#6B7280] ml-0.5">%</span>
        </div>
    )
}

const Swatch = ({ color, active, title, onPick }: { color: string, active: boolean, title?: string, onPick: (c: string) => void }) => (
    <button
        type="button"
        title={title || color}
        onClick={() => onPick(color)}
        className={cn(
            "w-[22px] h-[22px] rounded-md transition-transform hover:scale-110 ring-1 ring-inset ring-white/15",
            active && "outline outline-2 outline-offset-2 outline-[#FF0054]"
        )}
        style={{ background: `linear-gradient(${color}, ${color}), ${CHECKER}` }}
    />
)

interface ColorPickerPanelProps {
    color: string
    /** Live change (while dragging it is sent when the pointer rests or is released) */
    onChange: (hex: string) => void
}

export const ColorPickerPanel = ({ color, onChange }: ColorPickerPanelProps) => {
    const parsed = parseColor(color) || { hex: '#000000', alpha: 1 }
    const hex = parsed.hex
    const [hsv, setHsv] = useState(() => hexToHsv(hex))
    const [alpha, setAlpha] = useState(parsed.alpha)
    const [format, setFormat] = useState<Format>(readFormat)
    const [hexDraft, setHexDraft] = useState<string | null>(null)
    const brand = useBrandColors()
    const recent = useRecentColors().filter(c => !brand.includes(c))

    // Follow colours set from outside (swatches, undo…), keeping the hue of greys
    const incoming = formatColor(hex, parsed.alpha)
    const [seen, setSeen] = useState(incoming)
    if (seen !== incoming) {
        setSeen(incoming)
        if (hsvToHex(hsv.h, hsv.s, hsv.v) !== hex) {
            const next = hexToHsv(hex)
            setHsv(next.s > 0.01 && next.v > 0.01 ? next : { ...next, h: hsv.h })
        }
        if (Math.abs(alpha - parsed.alpha) > 0.004) setAlpha(parsed.alpha)
    }

    // While dragging, the page gets the colour when the pointer rests (or is released): updating it on
    // every pixel re-renders the canvas and records undo steps, which makes the picker stutter
    const timer = useRef<number | null>(null)
    const pending = useRef<string | null>(null)
    const flush = () => {
        if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null }
        if (pending.current) { const c = pending.current; pending.current = null; onChange(c) }
    }
    useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])
    const send = (next: string, now = false) => {
        pending.current = next
        if (now) return flush()
        if (timer.current !== null) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(flush, 160)
    }
    const setFromHsv = (h: number, s: number, v: number, now = false) => {
        setHsv({ h, s, v })
        const next = formatColor(hsvToHex(h, s, v), alpha)
        setSeen(next)
        send(next, now)
    }
    /** A colour typed, pasted or picked; it keeps the current opacity unless it brings its own */
    const setFromHex = (next: string) => {
        const c = parseColor(next)
        if (!c) return
        const a = /^#?[0-9a-f]{8}$/i.test(next.trim()) || /^rgba/i.test(next.trim()) ? c.alpha : alpha
        const v = hexToHsv(c.hex)
        setHsv(v.s > 0.01 && v.v > 0.01 ? v : { ...v, h: hsv.h })
        setAlpha(a)
        const out = formatColor(c.hex, a)
        setSeen(out)
        send(out, true)
    }
    const setFromAlpha = (a: number, now = false) => {
        const next = Math.max(0, Math.min(1, a))
        setAlpha(next)
        const out = formatColor(hsvToHex(hsv.h, hsv.s, hsv.v), next)
        setSeen(out)
        send(out, now)
    }

    const dragArea = useDrag((x, y) => setFromHsv(hsv.h, x, 1 - y), flush)
    const dragHue = useDrag((x) => setFromHsv(Math.round(x * 359), hsv.s, hsv.v), flush)
    const dragAlpha = useDrag((x) => setFromAlpha(Math.round(x * 100) / 100), flush)

    const current = hsvToHex(hsv.h, hsv.s, hsv.v)
    const currentWithAlpha = formatColor(current, alpha)
    const rgb = hexToRgb(current)
    const hsl = rgbToHsl(rgb)
    const pickFormat = (f: Format) => { setFormat(f); try { localStorage.setItem(FORMAT_KEY, f) } catch { /* ignore */ } }

    const canEyedrop = typeof window !== 'undefined' && 'EyeDropper' in window
    const eyedrop = async () => {
        try {
            const Ctor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper
            const result = await new Ctor().open()
            setFromHex(result.sRGBHex)
        } catch { /* cancelled */ }
    }

    return (
        <div className="w-[264px] p-3 flex flex-col gap-3 select-none">
            {/* Saturation × brightness */}
            <div
                className="relative w-full h-[150px] rounded-lg overflow-hidden cursor-crosshair touch-none"
                style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                onPointerDown={dragArea}
            >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #FFFFFF, rgba(255,255,255,0))' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))' }} />
                <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.4)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: current }}
                />
            </div>

            {/* Eyedropper · current colour · hue */}
            <div className="flex items-center gap-3">
                {canEyedrop && (
                    <button type="button" title="Conta-gotas" onClick={eyedrop}
                        className="w-8 h-8 rounded-md bg-[#16171C] border border-white/10 hover:border-[#FF0054] text-[#97A1B3] hover:text-white flex items-center justify-center shrink-0 transition-colors">
                        <Pipette className="w-4 h-4" />
                    </button>
                )}
                <div className="w-8 h-8 rounded-full shrink-0 ring-1 ring-inset ring-white/15" style={{ background: `linear-gradient(${currentWithAlpha}, ${currentWithAlpha}), ${CHECKER}` }} />
                <div className="relative flex-1 h-3 rounded-full cursor-pointer touch-none" style={{ background: HUE_GRADIENT }} onPointerDown={dragHue}>
                    <div
                        className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.4)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${(hsv.h / 359) * 100}%`, backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                    />
                </div>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Opac.</span>
                <div className="relative flex-1 h-3 rounded-full cursor-pointer touch-none" style={{ background: `linear-gradient(to right, ${current}00, ${current}), ${CHECKER}` }} onPointerDown={dragAlpha}>
                    <div
                        className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.4)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${alpha * 100}%`, background: `linear-gradient(${currentWithAlpha}, ${currentWithAlpha}), ${CHECKER}` }}
                    />
                </div>
                <div className="w-[58px] shrink-0">
                    <AlphaField value={Math.round(alpha * 100)} onCommit={(v) => setFromAlpha(v / 100, true)} />
                </div>
            </div>

            {/* Format + fields */}
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 p-0.5 rounded-lg bg-[#16171C] border border-white/5">
                    {(['hex', 'rgb', 'hsl'] as Format[]).map(f => (
                        <button key={f} type="button" onClick={() => pickFormat(f)}
                            className={cn("h-6 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors", format === f ? "bg-[#FF0054] text-white" : "text-[#6B7280] hover:text-white")}>
                            {f}
                        </button>
                    ))}
                </div>
                {format === 'hex' && (
                    <div className="flex items-center h-8 rounded-md bg-[#16171C] border border-white/10 focus-within:border-[#FF0054] px-2.5">
                        <span className="text-[#6B7280] font-mono text-[12px] mr-1">#</span>
                        <input
                            value={hexDraft ?? current.slice(1)}
                            onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6)
                                setHexDraft(v)
                                if (v.length === 6) setFromHex(v)
                            }}
                            onBlur={() => { if (hexDraft && hexDraft.length === 3) setFromHex(hexDraft); setHexDraft(null) }}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            onPaste={(e) => {
                                const n = normalizeHex(e.clipboardData.getData('text'))
                                if (n) { e.preventDefault(); setHexDraft(null); setFromHex(n) }
                            }}
                            className="flex-1 min-w-0 bg-transparent text-white font-mono text-[12px] uppercase outline-none"
                            spellCheck={false}
                        />
                    </div>
                )}
                {format === 'rgb' && (
                    <div className="flex gap-2">
                        <NumberField label="R" value={rgb.r} max={255} onCommit={(r) => setFromHex(rgbToHex(r, rgb.g, rgb.b))} />
                        <NumberField label="G" value={rgb.g} max={255} onCommit={(g) => setFromHex(rgbToHex(rgb.r, g, rgb.b))} />
                        <NumberField label="B" value={rgb.b} max={255} onCommit={(b) => setFromHex(rgbToHex(rgb.r, rgb.g, b))} />
                    </div>
                )}
                {format === 'hsl' && (
                    <div className="flex gap-2">
                        <NumberField label="H" value={hsl.h} max={359} onCommit={(h) => setFromHex(hslToHex(h, hsl.s, hsl.l))} />
                        <NumberField label="S" value={hsl.s} max={100} onCommit={(s) => setFromHex(hslToHex(hsl.h, s, hsl.l))} />
                        <NumberField label="L" value={hsl.l} max={100} onCommit={(l) => setFromHex(hslToHex(hsl.h, hsl.s, l))} />
                    </div>
                )}
            </div>

            {/* Presets: the brand first, then the recent colours */}
            {brand.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Cores da marca</span>
                    <div className="flex flex-wrap gap-1.5">
                        {brand.map(c => <Swatch key={c} color={c} active={c === currentWithAlpha || c === current} title={`${c} · cor da marca`} onPick={setFromHex} />)}
                    </div>
                </div>
            )}
            {recent.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Recentes</span>
                    <div className="flex flex-wrap gap-1.5">
                        {recent.slice(0, 16).map(c => <Swatch key={c} color={c} active={c === currentWithAlpha || c === current} onPick={setFromHex} />)}
                    </div>
                </div>
            )}
        </div>
    )
}

// ---------- Popover ----------

const POPOVER_W = 264
const GAP = 10

/**
 * The settings panel the trigger sits in (a floating / fixed panel), if any: the picker opens beside it,
 * never over it nor inside it (panels clip what overflows them).
 */
const findPanel = (el: HTMLElement): HTMLElement | null => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (a.hasAttribute('data-floating-panel')) return a
        const cs = getComputedStyle(a)
        if (cs.position === 'fixed' || cs.position === 'sticky') return a.getBoundingClientRect().width < 640 ? a : null
    }
    return null
}

interface Placement { top: number, left: number, origin: string }

/**
 * Places the picker. In a side panel: beside the panel (right when there is room, else left), level with
 * the trigger. Elsewhere: under the trigger (above when there is no room). It grows from the trigger's side.
 * Only a modal (Radix dialog, which traps the focus) hosts it; everywhere else it renders on <body>, so
 * no panel can clip it.
 */
const PickerPopover = ({ anchor, onClose, children }: { anchor: HTMLElement, onClose: () => void, children: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null)
    // A Radix popover (e.g. Column settings) also says role="dialog", but it does not trap the focus and it
    // clips what overflows it: only a real modal hosts the picker
    const modal = anchor.closest<HTMLElement>('[role="dialog"][id^="radix-"]')
    const host = modal && !modal.closest('[data-radix-popper-content-wrapper]') ? modal : document.body
    const [pos, setPos] = useState<Placement | null>(null)

    useLayoutEffect(() => {
        let frame = 0
        const panel = findPanel(anchor)
        const place = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                const a = anchor.getBoundingClientRect()
                const h = ref.current?.offsetHeight || 420
                const vw = window.innerWidth, vh = window.innerHeight
                const clampTop = (t: number) => Math.max(GAP, Math.min(t, vh - h - GAP))
                const clampLeft = (l: number) => Math.max(GAP, Math.min(l, vw - POPOVER_W - GAP))
                let top: number, left: number, origin: string
                const p = panel?.getBoundingClientRect()
                if (p && (p.right + GAP + POPOVER_W <= vw - GAP || p.left - GAP - POPOVER_W >= GAP)) {
                    // Beside the panel, level with the trigger
                    const right = p.right + GAP + POPOVER_W <= vw - GAP
                    left = right ? p.right + GAP : p.left - GAP - POPOVER_W
                    top = clampTop(a.top + a.height / 2 - 40)
                    const y = Math.max(0, Math.min(h, a.top + a.height / 2 - top))
                    origin = `${right ? 'left' : 'right'} ${y}px`
                } else {
                    // Under the trigger (above without room)
                    const below = a.bottom + GAP + h <= vh - GAP || a.top - GAP - h < GAP
                    top = clampTop(below ? a.bottom + GAP : a.top - GAP - h)
                    left = clampLeft(a.left + a.width / 2 - POPOVER_W / 2)
                    const x = Math.max(0, Math.min(POPOVER_W, a.left + a.width / 2 - left))
                    origin = `${x}px ${below ? 'top' : 'bottom'}`
                }
                left = clampLeft(left)
                // A transformed host (a centred modal) is the reference box of position: fixed
                if (host !== document.body && getComputedStyle(host).transform !== 'none') {
                    const hr = host.getBoundingClientRect()
                    top -= hr.top; left -= hr.left
                }
                setPos(prev => prev && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.left - left) < 0.5 && prev.origin === origin ? prev : { top, left, origin })
            })
        }
        place()
        const ro = new ResizeObserver(place)
        if (ref.current) ro.observe(ref.current)
        if (panel) ro.observe(panel)
        window.addEventListener('scroll', place, true)
        window.addEventListener('resize', place)
        return () => { cancelAnimationFrame(frame); ro.disconnect(); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
    }, [anchor, host])

    useEffect(() => {
        const onDown = (e: PointerEvent) => {
            const t = e.target as Node
            if (ref.current?.contains(t) || anchor.contains(t)) return
            onClose()
        }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('keydown', onKey, true)
        return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true) }
    }, [anchor, onClose])

    return createPortal(
        <div
            ref={ref}
            // Panels that close on "click outside" treat it as one of their own floating parts
            data-floating-panel=""
            data-color-picker=""
            role="dialog"
            aria-label="Seletor de cor"
            // Placed first (hidden), then it appears in place: it never travels across the screen
            style={{ position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0, zIndex: 100000, visibility: pos ? 'visible' : 'hidden', transition: 'none' }}
            // Clicks inside never reach the panels / blocks around the trigger
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                key={pos ? 'shown' : 'measuring'}
                className="rounded-xl bg-[#1F1F25] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)] text-left"
                // Grows out of the side of the trigger
                style={pos ? { transformOrigin: pos.origin, animation: 'color-picker-in 180ms cubic-bezier(.2,.9,.3,1.2) both' } : undefined}
            >
                {children}
            </div>
        </div>,
        host
    )
}

// ---------- Drop-in input ----------

type ColorInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { type?: string }

export const ColorInput = React.forwardRef<HTMLInputElement, ColorInputProps>(function ColorInput(
    { value, defaultValue, onChange, onBlur, className, style, title, disabled, id, name, onClick, ...rest },
    forwardedRef
) {
    const buttonRef = useRef<HTMLButtonElement>(null)
    // Callers open the picker with ref.current.click() and read ref.current.value
    React.useImperativeHandle(forwardedRef, () => buttonRef.current as unknown as HTMLInputElement)
    const [uncontrolled, setUncontrolled] = useState(() => normalizeColor(String(defaultValue ?? '')) || '#000000')
    const [open, setOpen] = useState(false)
    const startColor = useRef<string | null>(null)

    const shown = normalizeColor(value === undefined ? uncontrolled : String(value)) ?? '#000000'
    // Like an input, the element carries its value
    useEffect(() => { if (buttonRef.current) (buttonRef.current as unknown as { value: string }).value = shown }, [shown])

    const onChangeRef = useRef(onChange)
    const onBlurRef = useRef(onBlur)
    useLayoutEffect(() => { onChangeRef.current = onChange; onBlurRef.current = onBlur })
    // The trigger the picker opens from (kept in state: the popover is placed against it)
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)

    const change = (hex: string) => {
        if (value === undefined) setUncontrolled(hex)
        onChangeRef.current?.({ target: { value: hex }, currentTarget: { value: hex } } as unknown as React.ChangeEvent<HTMLInputElement>)
    }

    const close = useCallback(() => {
        setOpen(false)
        const final = buttonRef.current ? (buttonRef.current as unknown as { value: string }).value : null
        if (final && startColor.current && final !== startColor.current) addRecentColor(final)
        startColor.current = null
        onBlurRef.current?.({ target: buttonRef.current, currentTarget: buttonRef.current } as unknown as React.FocusEvent<HTMLInputElement>)
    }, [])

    // Opening is idempotent: wrappers often call ref.click() on top of the click itself
    const openPicker = () => {
        if (disabled || open) return
        startColor.current = shown
        setAnchor(buttonRef.current)
        setOpen(true)
    }

    return (
        <>
            <button
                {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
                ref={buttonRef}
                id={id}
                type="button"
                title={title}
                disabled={disabled}
                aria-label={rest['aria-label'] || 'Escolher cor'}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={cn("appearance-none p-0 border-0 cursor-pointer", className)}
                // A see-through colour shows the checkerboard under it
                style={{ background: `linear-gradient(${shown}, ${shown}), ${CHECKER}`, ...style }}
                onClick={(e) => {
                    onClick?.(e as unknown as React.MouseEvent<HTMLInputElement>)
                    openPicker()
                }}
            />
            {/* In a form, the colour is submitted like the input it replaces */}
            {name && <input type="hidden" name={name} value={shown} />}
            {open && anchor && (
                <PickerPopover anchor={anchor} onClose={close}>
                    <ColorPickerPanel color={shown} onChange={(hex) => { (buttonRef.current as unknown as { value: string }).value = hex; change(hex) }} />
                </PickerPopover>
            )}
        </>
    )
})
