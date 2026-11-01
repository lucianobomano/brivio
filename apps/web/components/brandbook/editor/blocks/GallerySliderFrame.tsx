"use client"

import React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type SliderNavLayout = 'together' | 'split' | 'sides'
export type SliderNavPosition = 'top' | 'bottom'
export type SliderNavAlign = 'left' | 'center' | 'right'

export interface SliderSettings {
    sliderScrollbar?: boolean
    sliderNav?: boolean
    sliderNavLayout?: SliderNavLayout
    sliderNavPosition?: SliderNavPosition
    sliderNavAlign?: SliderNavAlign
    sliderCounter?: boolean
    sliderFullBleed?: boolean
    /** Fixed image size in px; without a width the images split the strip by the column count */
    sliderImageWidth?: number
    sliderImageHeight?: number
    sliderLockRatio?: boolean
    /** Edge-to-edge only: distance (px) of the controls from the left/right screen edge; empty = aligned with the section */
    sliderControlsInsetLeft?: number
    sliderControlsInsetRight?: number
}

interface GallerySliderFrameProps {
    settings: SliderSettings
    scrollerRef: React.RefObject<HTMLDivElement | null>
    /** Number of images (the "add" tile is not counted) */
    itemCount: number
    children: React.ReactNode
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Minimum gap (px) between the controls and the screen edge in edge-to-edge mode */
const MIN_EDGE_INSET = 24

/**
 * Wraps the "Faixa" (slider) gallery: prev/next buttons, image counter and the optional
 * edge-to-edge width, which stretches the strip over the whole page (the nearest
 * `data-bleed-root` ancestor) instead of the block's own margins.
 */
export const GallerySliderFrame = ({ settings, scrollerRef, itemCount, children }: GallerySliderFrameProps) => {
    const frameRef = React.useRef<HTMLDivElement>(null)
    const [current, setCurrent] = React.useState(0)
    const [edges, setEdges] = React.useState({ atStart: true, atEnd: false })
    const [bleed, setBleed] = React.useState<{ marginLeft: number, width: number, insetLeft: number, insetRight: number } | null>(null)

    const showNav = settings.sliderNav === true
    const layout = settings.sliderNavLayout || 'together'
    const position = settings.sliderNavPosition || 'bottom'
    const align = settings.sliderNavAlign || 'right'
    const showCounter = settings.sliderCounter === true
    const fullBleed = settings.sliderFullBleed === true

    // Track the first visible image and whether the strip can scroll further
    React.useEffect(() => {
        const scroller = scrollerRef.current
        if (!scroller) return

        const update = () => {
            const first = scroller.firstElementChild as HTMLElement | null
            const step = first ? first.offsetWidth + 10 : scroller.clientWidth
            setCurrent(Math.min(itemCount - 1, Math.max(0, Math.round(scroller.scrollLeft / step))))
            setEdges({
                atStart: scroller.scrollLeft <= 2,
                atEnd: scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2,
            })
        }

        update()
        scroller.addEventListener('scroll', update, { passive: true })
        const observer = new ResizeObserver(update)
        observer.observe(scroller)
        return () => {
            scroller.removeEventListener('scroll', update)
            observer.disconnect()
        }
    }, [scrollerRef, itemCount])

    // Edge to edge: offset the frame so it spans the page instead of the block
    React.useLayoutEffect(() => {
        const frame = frameRef.current
        const parent = frame?.parentElement
        if (!fullBleed || !frame || !parent) {
            setBleed(null)
            return
        }
        const root = (frame.closest('[data-bleed-root]') as HTMLElement | null) || document.documentElement

        const measure = () => {
            const rootRect = root.getBoundingClientRect()
            const parentRect = parent.getBoundingClientRect()
            setBleed({
                marginLeft: rootRect.left - parentRect.left,
                width: rootRect.width,
                // Controls stay on the block's own margins, and never closer than MIN_EDGE_INSET to the edge
                insetLeft: Math.max(MIN_EDGE_INSET, parentRect.left - rootRect.left),
                insetRight: Math.max(MIN_EDGE_INSET, rootRect.right - parentRect.right),
            })
        }

        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(root)
        observer.observe(parent)
        return () => observer.disconnect()
    }, [fullBleed])

    const scrollByItem = (direction: 1 | -1) => (e: React.MouseEvent) => {
        e.stopPropagation()
        const scroller = scrollerRef.current
        if (!scroller) return
        const first = scroller.firstElementChild as HTMLElement | null
        const step = first ? first.offsetWidth + 10 : scroller.clientWidth
        scroller.scrollBy({ left: direction * step, behavior: 'smooth' })
    }

    const navButton = (direction: 1 | -1, className?: string, style?: React.CSSProperties) => {
        const disabled = direction === -1 ? edges.atStart : edges.atEnd
        const Icon = direction === -1 ? ArrowLeft : ArrowRight
        return (
            <button
                type="button"
                onClick={scrollByItem(direction)}
                disabled={disabled}
                aria-label={direction === -1 ? "Imagem anterior" : "Imagem seguinte"}
                style={style}
                className={cn(
                    "w-10 h-10 shrink-0 rounded-full border border-gray-300 bg-white text-gray-900 flex items-center justify-center transition-colors",
                    "hover:bg-gray-900 hover:text-white hover:border-gray-900 disabled:opacity-30 disabled:pointer-events-none",
                    className
                )}
            >
                <Icon className="w-4 h-4" />
            </button>
        )
    }

    const counter = showCounter && itemCount > 0 && (
        <span className="text-sm font-medium tabular-nums text-gray-500 select-none">
            <span className="text-gray-900">{pad(current + 1)}</span> / {pad(itemCount)}
        </span>
    )

    const barNav = showNav && layout !== 'sides'
    const hasBar = barNav || !!counter

    const bar = hasBar && (
        <div
            className={cn(
                "flex items-center gap-4 w-full",
                barNav && layout === 'split'
                    ? "justify-between"
                    : align === 'center' ? "justify-center" : align === 'right' ? "justify-end" : "justify-start"
            )}
            style={bleed ? { paddingLeft: settings.sliderControlsInsetLeft ?? bleed.insetLeft, paddingRight: settings.sliderControlsInsetRight ?? bleed.insetRight } : undefined}
        >
            {barNav && layout === 'split' ? (
                <>
                    {navButton(-1)}
                    {counter}
                    {navButton(1)}
                </>
            ) : (
                <>
                    {/* Counter sits on the outer side of the buttons */}
                    {align === 'right' && counter}
                    {barNav && (
                        <div className="flex items-center gap-2">
                            {navButton(-1)}
                            {navButton(1)}
                        </div>
                    )}
                    {align !== 'right' && counter}
                </>
            )}
        </div>
    )

    return (
        <div
            ref={frameRef}
            className="flex flex-col gap-4 min-w-0"
            style={bleed ? { width: bleed.width, marginLeft: bleed.marginLeft, maxWidth: 'none' } : { width: '100%' }}
        >
            {position === 'top' && bar}
            <div className="relative w-full">
                {children}
                {showNav && layout === 'sides' && (
                    <>
                        {navButton(-1, "absolute left-3 top-1/2 -translate-y-1/2 z-20 shadow-md border-transparent", bleed ? { left: settings.sliderControlsInsetLeft ?? MIN_EDGE_INSET } : undefined)}
                        {navButton(1, "absolute right-3 top-1/2 -translate-y-1/2 z-20 shadow-md border-transparent", bleed ? { right: settings.sliderControlsInsetRight ?? MIN_EDGE_INSET } : undefined)}
                    </>
                )}
            </div>
            {position === 'bottom' && bar}
        </div>
    )
}
