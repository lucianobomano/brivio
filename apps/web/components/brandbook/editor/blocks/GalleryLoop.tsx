"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * "Loop" gallery: the images split into lanes that scroll forever — columns going up and down in turn
 * (vertical), or rows going left and right (horizontal). Every lane holds its images twice, so the loop
 * has no seam. In the editor the loop stops while the pointer is over it, so each image can be edited.
 */

export interface LoopSettings {
    loopDirection?: 'vertical' | 'horizontal'
    /** Lanes: columns (vertical) or rows (horizontal) */
    columns?: number
    /** px per second */
    loopSpeed?: number
    /** Height of the vertical loop, px */
    loopHeight?: number
    /** Height of each row of the horizontal loop, px */
    loopRowHeight?: number
    loopGap?: number
    /** Lanes go in opposite directions */
    loopAlternate?: boolean
    /** The first lane goes down (vertical) or right (horizontal) */
    loopReverse?: boolean
    loopPauseOnHover?: boolean
    /** Soft fade at the ends */
    loopFade?: boolean
    imageRadius?: number
}

interface Item { url: string, caption?: string }

interface Props {
    items: Item[]
    settings: LoopSettings
    aspectRatio?: string
    isReadOnly?: boolean
    /** Editor tools of one image (only on the copy under the pointer) */
    renderOverlay?: (index: number) => React.ReactNode
    onHoverItem?: (index: number | null) => void
    onOpenItem?: (index: number) => void
    addButton?: React.ReactNode
}

/** One lane: its images (repeated until it is long enough), drawn twice for a seamless loop */
const Lane = ({ items, vertical, reverse, speed, gap, paused, children }: {
    items: { item: Item, index: number }[], vertical: boolean, reverse: boolean, speed: number, gap: number, paused: boolean,
    children: (entry: { item: Item, index: number }, copy: number, n: number) => React.ReactNode
}) => {
    const trackRef = useRef<HTMLDivElement>(null)
    const [duration, setDuration] = useState(30)
    // The loop length is measured, so the speed is the same whatever the size of the images
    useEffect(() => {
        const el = trackRef.current
        if (!el) return
        const measure = () => {
            const half = (vertical ? el.scrollHeight : el.scrollWidth) / 2
            if (half > 0) setDuration(Math.max(4, half / Math.max(4, speed)))
        }
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        measure()
        return () => ro.disconnect()
    }, [vertical, speed, items.length])

    // Short lanes repeat their images so the loop never shows a gap
    const filled = items.length ? Array.from({ length: Math.max(1, Math.ceil(4 / items.length)) }).flatMap(() => items) : []
    return (
        <div className={cn("min-w-0 min-h-0 overflow-hidden", vertical ? "flex-1 h-full" : "w-full")}>
            <div
                ref={trackRef}
                className={cn("flex will-change-transform", vertical ? "flex-col" : "flex-row w-max")}
                style={{
                    gap,
                    animation: `${vertical ? 'gallery-loop-y' : 'gallery-loop-x'} ${duration}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
                    animationPlayState: paused ? 'paused' : 'running',
                    // Half of the gap closes the seam between the two copies
                    ['--loop-gap' as string]: `${gap / 2}px`,
                }}
            >
                {[0, 1].flatMap(copy => filled.map((entry, n) => children(entry, copy, n)))}
            </div>
        </div>
    )
}

export const GalleryLoop = ({ items, settings, aspectRatio, isReadOnly, renderOverlay, onHoverItem, onOpenItem, addButton }: Props) => {
    const vertical = (settings.loopDirection || 'vertical') === 'vertical'
    const lanes = Math.max(1, Math.min(5, settings.columns || 2))
    const speed = settings.loopSpeed ?? 40
    const gap = settings.loopGap ?? 16
    const radius = settings.imageRadius ?? 14
    const alternate = settings.loopAlternate !== false
    const fade = settings.loopFade !== false
    const [hovered, setHovered] = useState(false)
    const [hoverKey, setHoverKey] = useState<string | null>(null)
    const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Editor: stops under the pointer (to edit an image); page: stops only when asked to
    const paused = reduced || (hovered && (!isReadOnly || settings.loopPauseOnHover !== false))

    const byLane: { item: Item, index: number }[][] = Array.from({ length: lanes }, () => [])
    items.forEach((item, index) => byLane[index % lanes].push({ item, index }))

    const mask = fade
        ? (vertical ? 'linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)' : 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)')
        : undefined

    return (
        <div className="w-full flex flex-col gap-3">
            <div
                className={cn("w-full overflow-hidden", vertical ? "flex flex-row" : "flex flex-col")}
                style={{
                    gap,
                    height: vertical ? settings.loopHeight ?? 640 : undefined,
                    WebkitMaskImage: mask,
                    maskImage: mask,
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setHoverKey(null); onHoverItem?.(null) }}
            >
                {items.length === 0 ? null : byLane.map((laneItems, lane) => (
                    <Lane key={lane} items={laneItems} vertical={vertical} reverse={(alternate && lane % 2 === 1) !== !!settings.loopReverse} speed={speed} gap={gap} paused={paused}>
                        {({ item, index }, copy, n) => {
                            const key = `${lane}-${copy}-${n}`
                            return (
                                <div
                                    key={key}
                                    className={cn("relative overflow-hidden shrink-0 bg-black/5 group/item", vertical ? "w-full" : "h-full", !isReadOnly ? "cursor-pointer" : "cursor-zoom-in")}
                                    style={{
                                        borderRadius: radius,
                                        aspectRatio: aspectRatio || (vertical ? '4/5' : '4/3'),
                                        height: vertical ? undefined : settings.loopRowHeight ?? 260,
                                    }}
                                    onMouseEnter={() => { setHoverKey(key); onHoverItem?.(index) }}
                                    onClick={(e) => { e.stopPropagation(); onOpenItem?.(index) }}
                                >
                                    <img src={item.url} alt={item.caption || `Imagem ${index + 1}`} className="w-full h-full object-cover pointer-events-none" draggable={false} loading="lazy" decoding="async" />
                                    {hoverKey === key && renderOverlay?.(index)}
                                </div>
                            )
                        }}
                    </Lane>
                ))}
            </div>
            {addButton}
        </div>
    )
}
