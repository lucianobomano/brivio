"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * "Faixa" gallery arrangements other than the plain strip: the images sit around a focused one in the middle
 * (fan, arc, focus, cards, coverflow, stack). Drag, arrows, keyboard and a click on a side image move between them.
 */

export type SliderArrangement = 'strip' | 'fan' | 'arc' | 'focus' | 'cards' | 'coverflow' | 'stack'

export interface ArrangedSettings {
    sliderArrangement?: SliderArrangement
    /** Distance between the images, % of the default (50–160) */
    sliderSpread?: number
    /** Tilt in degrees; none = the arrangement's default */
    sliderRotation?: number
    /** Size of the side images, % of the focused one (40–100) */
    sliderSideScale?: number
    /** How many images show on each side of the focused one */
    sliderVisibleSides?: number
    /** Title and subtitle of the focused image under the carousel */
    sliderCaption?: boolean
    /** Seconds between automatic moves (shared link / Preview only); 0 / none = off */
    sliderAutoplay?: number
    /** After the last image comes the first one again */
    sliderLoop?: boolean
    sliderNav?: boolean
    sliderImageWidth?: number
    sliderImageHeight?: number
    imageRadius?: number
}

export const ARRANGEMENTS: { id: SliderArrangement, label: string, rotation: number, sideScale: number }[] = [
    { id: 'strip', label: 'Linha', rotation: 0, sideScale: 100 },
    { id: 'fan', label: 'Leque', rotation: 7, sideScale: 82 },
    { id: 'arc', label: 'Arco', rotation: 9, sideScale: 100 },
    { id: 'focus', label: 'Foco', rotation: 0, sideScale: 78 },
    { id: 'cards', label: 'Cartões', rotation: 0, sideScale: 84 },
    { id: 'coverflow', label: 'Coverflow', rotation: 45, sideScale: 86 },
    { id: 'stack', label: 'Pilha', rotation: 3, sideScale: 92 },
]

export const getArrangement = (id?: SliderArrangement) => ARRANGEMENTS.find(a => a.id === id) || ARRANGEMENTS[0]

export interface ArrangedItem {
    url: string
    caption?: string
    subtitle?: string
}

interface Props {
    items: ArrangedItem[]
    settings: ArrangedSettings
    /** Default card shape when no size is set, e.g. "3/4" */
    aspectRatio?: string
    isReadOnly?: boolean
    /** Click on the focused image (lightbox on the shared link, select the block in the editor) */
    onOpenItem?: (index: number) => void
    /** Editor tools drawn over the focused image */
    renderOverlay?: (index: number) => React.ReactNode
    /** Editor: the pointer enters / leaves an image (null) */
    onHoverItem?: (index: number | null) => void
    /** Editor: change the title / subtitle of an image */
    onUpdateItem?: (index: number, patch: Partial<ArrangedItem>) => void
    /** Editor: "add image" control, shown next to the controls */
    addButton?: React.ReactNode
}

/** Where an image sits for its distance `o` from the focused one (fractional while dragging) */
const placeCard = (arrangement: SliderArrangement, o: number, w: number, spread: number, rotation: number, sideScale: number) => {
    const a = Math.abs(o)
    const s = Math.sign(o)
    const shrink = 1 - sideScale
    switch (arrangement) {
        case 'fan': return {
            transform: `translateX(${o * w * 0.5 * spread}px) translateY(${a * a * 6}px) rotate(${o * rotation}deg) scale(${Math.max(0.3, 1 - Math.min(a, 3) * shrink * 0.9)})`,
            filter: 'none', opacity: 1,
        }
        case 'arc': return {
            transform: `translateX(${o * w * 0.86 * spread}px) translateY(${a * a * w * 0.09}px) rotate(${o * rotation}deg) scale(${1 - Math.min(a, 3) * shrink * 0.5})`,
            filter: 'none', opacity: 1,
        }
        case 'focus': return {
            transform: `translateX(${o * w * 0.82 * spread}px) scale(${Math.max(0.3, 1 - Math.min(a, 1) * shrink - Math.max(0, a - 1) * shrink * 0.4)})`,
            filter: `blur(${Math.min(a, 3) * 3}px)`, opacity: 1 - Math.min(a, 3) * 0.22,
        }
        case 'cards': return {
            transform: `translateX(${o * w * 0.68 * spread}px) scale(${Math.max(0.3, 1 - Math.min(a, 3) * shrink)})`,
            filter: `grayscale(${Math.min(a, 1) * 100}%)`, opacity: 1 - Math.min(a, 3) * 0.15,
        }
        case 'coverflow': return {
            transform: `translateX(${o * w * 0.42 * spread + s * Math.min(a, 1) * w * 0.25}px) translateZ(${-Math.min(a, 3) * 120}px) rotateY(${-s * Math.min(a, 1) * rotation}deg) scale(${1 - Math.min(a, 3) * shrink * 0.5})`,
            filter: 'none', opacity: 1,
        }
        case 'stack': return o < 0
            // Images already seen slide out to the left
            ? { transform: `translateX(${o * w * 1.15 * spread}px) rotate(${o * rotation * 2}deg)`, filter: 'none', opacity: Math.max(0, 1 + o * 0.9) }
            : { transform: `translateX(${o * 26 * spread}px) translateY(${o * -8}px) rotate(${o * rotation}deg) scale(${Math.max(0.3, 1 - o * shrink)})`, filter: 'none', opacity: 1 - Math.min(o, 4) * 0.12 }
        default: return { transform: `translateX(${o * w * 1.05 * spread}px)`, filter: 'none', opacity: 1 }
    }
}

export const GalleryArrangedCarousel = ({ items, settings, aspectRatio, isReadOnly, onOpenItem, renderOverlay, onHoverItem, onUpdateItem, addButton }: Props) => {
    const arrangement = settings.sliderArrangement || 'fan'
    const preset = getArrangement(arrangement)
    const count = items.length
    const loop = settings.sliderLoop !== false
    const spread = (settings.sliderSpread ?? 100) / 100
    const rotation = settings.sliderRotation ?? preset.rotation
    const sideScale = (settings.sliderSideScale ?? preset.sideScale) / 100
    const visibleSides = settings.sliderVisibleSides ?? 2
    const showCaption = settings.sliderCaption !== false
    const showNav = settings.sliderNav !== false

    // Card size: L × A from the settings, else a 300px card in the gallery's ratio (portrait by default)
    const [rw, rh] = (aspectRatio || '3/4').split(/[/:]/).map(Number)
    const baseW = settings.sliderImageWidth || 300
    const baseH = settings.sliderImageHeight || Math.round(baseW * ((rh && rw) ? rh / rw : 4 / 3))

    const stageRef = React.useRef<HTMLDivElement>(null)
    const [stageWidth, setStageWidth] = React.useState(0)
    React.useEffect(() => {
        const el = stageRef.current
        if (!el) return
        const observer = new ResizeObserver(() => setStageWidth(el.clientWidth))
        observer.observe(el)
        setStageWidth(el.clientWidth)
        return () => observer.disconnect()
    }, [])
    // Narrow columns / phones: the focused card never takes more than ~62% of the stage
    const fit = stageWidth ? Math.min(1, (stageWidth * 0.62) / baseW) : 1
    const w = baseW * fit
    const h = baseH * fit

    const [active, setActive] = React.useState(0)
    const [drag, setDrag] = React.useState<{ startX: number, dx: number, moved: boolean } | null>(null)
    const [hovering, setHovering] = React.useState(false)
    React.useEffect(() => { if (active > count - 1) setActive(Math.max(0, count - 1)) }, [count, active])

    const go = React.useCallback((next: number) => {
        if (count === 0) return
        setActive(loop ? ((next % count) + count) % count : Math.max(0, Math.min(count - 1, next)))
    }, [count, loop])

    // Autoplay: only for viewers, paused while the pointer is over the carousel
    React.useEffect(() => {
        const seconds = settings.sliderAutoplay || 0
        if (!isReadOnly || seconds <= 0 || hovering || drag || count < 2) return
        const id = window.setInterval(() => setActive(a => (loop || a < count - 1) ? (a + 1) % count : a), seconds * 1000)
        return () => window.clearInterval(id)
    }, [settings.sliderAutoplay, isReadOnly, hovering, drag, count, loop])

    // Distance (in images) dragged so far
    const step = Math.max(40, w * (arrangement === 'stack' ? 0.6 : arrangement === 'fan' || arrangement === 'coverflow' ? 0.5 : 0.8) * spread)
    const dragShift = drag ? drag.dx / step : 0

    const offsetOf = (i: number) => {
        let o = i - active
        if (loop && count > 2) {
            if (o > count / 2) o -= count
            if (o < -count / 2) o += count
        }
        return o + dragShift
    }

    const onPointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('button, input, [data-no-drag]')) return
        setDrag({ startX: e.clientX, dx: 0, moved: false })
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (!drag) return
        const dx = e.clientX - drag.startX
        if (!drag.moved && Math.abs(dx) > 6) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        setDrag({ ...drag, dx, moved: drag.moved || Math.abs(dx) > 6 })
    }
    const endDrag = () => {
        if (!drag) return
        if (drag.moved) go(active - Math.round(drag.dx / step))
        // Let the click that follows a drag know it was a drag
        window.setTimeout(() => setDrag(null), 0)
    }

    // Arc / fan push the side cards down; leave room for them
    const extraHeight = arrangement === 'arc' ? Math.min(visibleSides, 3) ** 2 * w * 0.09 : arrangement === 'fan' ? 40 : 24
    const radius = settings.imageRadius ?? 16
    const current = items[active]

    const navButton = (direction: -1 | 1) => (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(active + direction) }}
            disabled={!loop && (direction === -1 ? active === 0 : active === count - 1)}
            aria-label={direction === -1 ? "Imagem anterior" : "Imagem seguinte"}
            className="w-9 h-9 shrink-0 rounded-full bg-[#111] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none"
        >
            {direction === -1 ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
    )

    return (
        <div className="w-full flex flex-col items-center gap-5 min-w-0">
            <div
                ref={stageRef}
                role="region"
                aria-roledescription="carrossel"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1) }
                    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1) }
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                className={cn("relative w-full overflow-hidden outline-none select-none touch-pan-y", drag?.moved ? "cursor-grabbing" : "cursor-grab")}
                style={{ height: h + extraHeight + 32, perspective: arrangement === 'coverflow' ? 1200 : undefined }}
            >
                {items.map((item, i) => {
                    const o = offsetOf(i)
                    const a = Math.abs(o)
                    const hidden = a > visibleSides + 0.5
                    const place = placeCard(arrangement, o, w, spread, rotation, sideScale)
                    const isActive = i === active
                    return (
                        <div
                            key={i}
                            className={cn("absolute left-1/2 top-4 overflow-hidden bg-gray-100 group/item", isActive && "shadow-2xl", !isActive && "shadow-lg")}
                            style={{
                                width: w,
                                height: h,
                                marginLeft: -w / 2,
                                borderRadius: radius,
                                transform: place.transform,
                                filter: place.filter,
                                opacity: hidden ? 0 : place.opacity,
                                zIndex: 100 - Math.round(a * 10),
                                pointerEvents: hidden ? 'none' : 'auto',
                                transition: drag?.moved ? 'none' : 'transform 600ms cubic-bezier(0.22, 0.8, 0.2, 1), filter 600ms, opacity 600ms',
                                transformStyle: arrangement === 'coverflow' ? 'preserve-3d' : undefined,
                            }}
                            onMouseEnter={() => onHoverItem?.(i)}
                            onMouseLeave={() => onHoverItem?.(null)}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (drag?.moved) return
                                if (!isActive) go(i)
                                else onOpenItem?.(i)
                            }}
                        >
                            <img src={item.url} alt={item.caption || `Imagem ${i + 1}`} className="w-full h-full object-cover pointer-events-none" draggable={false} loading="lazy" decoding="async" />
                            {/* Editor tools of the focused image */}
                            {isActive && renderOverlay?.(i)}
                        </div>
                    )
                })}
                {count === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Adicione imagens à galeria</div>
                )}
            </div>

            {(showNav || showCaption || addButton) && count > 0 && (
                <div className="flex items-center justify-center gap-6 w-full" style={{ maxWidth: Math.max(w * 1.6, 320) }}>
                    {showNav && count > 1 && navButton(-1)}
                    {showCaption && (
                        <div className="flex-1 min-w-0 flex flex-col items-center text-center gap-0.5" data-no-drag>
                            {isReadOnly || !onUpdateItem ? (
                                <>
                                    {current?.caption && <span className="text-[17px] text-gray-900 truncate max-w-full">{current.caption}</span>}
                                    {current?.subtitle && <span className="text-[13px] font-mono text-gray-500 truncate max-w-full">{current.subtitle}</span>}
                                </>
                            ) : (
                                <>
                                    <input
                                        value={current?.caption || ''}
                                        placeholder="Título"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => onUpdateItem(active, { caption: e.target.value })}
                                        className="w-full bg-transparent text-center text-[17px] text-gray-900 outline-none placeholder:text-gray-300 rounded hover:bg-black/[0.03] focus:bg-black/[0.04]"
                                    />
                                    <input
                                        value={current?.subtitle || ''}
                                        placeholder="Subtítulo"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => onUpdateItem(active, { subtitle: e.target.value })}
                                        className="w-full bg-transparent text-center text-[13px] font-mono text-gray-500 outline-none placeholder:text-gray-300 rounded hover:bg-black/[0.03] focus:bg-black/[0.04]"
                                    />
                                </>
                            )}
                        </div>
                    )}
                    {!showCaption && <span className="flex-1" />}
                    {showNav && count > 1 && navButton(1)}
                    {addButton}
                </div>
            )}
        </div>
    )
}
