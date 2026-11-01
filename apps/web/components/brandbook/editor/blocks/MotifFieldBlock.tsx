"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { useBrandDesign } from "../BrandDesignContext"
import { pointer, useScrollTick } from "../scrollFx"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { MotifFieldPanel } from "./MotifFieldPanel"
import { brivioSymbol } from "./brivioSymbol"
import { SHAPE_PATHS, layoutMotif, resolveMotif, type MotifFieldSettings, type MotifShape } from "./motifField"

interface MotifFieldBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onAnimate?: () => void
}

const BRIVIO_COLORS = ['#FF0054', '#9E0059', '#390099', '#06D6A0']

/** One shape in a 100 × 100 box */
const Shape = ({ shape, color, image }: { shape: MotifShape, color: string, image?: string }) => {
    if (shape === 'circle') return <circle cx={50} cy={50} r={46} fill={color} />
    if (shape === 'ring') return <circle cx={50} cy={50} r={38} fill="none" stroke={color} strokeWidth={14} />
    if (shape === 'symbol') return <image href={brivioSymbol(color)} x={0} y={0} width={100} height={100} />
    if (shape === 'image') return image ? <image href={image} x={0} y={0} width={100} height={100} preserveAspectRatio="xMidYMid meet" /> : <circle cx={50} cy={50} r={46} fill={color} />
    return <path d={SHAPE_PATHS[shape] || SHAPE_PATHS.petal} fill={color} />
}

export const MotifFieldBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: MotifFieldBlockProps) => {
    const settings: MotifFieldSettings = block.content?.settings || {}
    const s = resolveMotif(settings)
    const { settings: brand } = useBrandDesign()
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = useState(false)
    const boxRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(SVGGElement | null)[]>([])

    // Colours: the field's own, else the brand's (Settings → Colors), else Brivio's
    const brandPalette = (brand?.color_palette || []).filter(Boolean)
    const colors = s.colors.length ? s.colors : brandPalette.length ? brandPalette : BRIVIO_COLORS
    const colorKey = colors.join(',')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const items = useMemo(() => layoutMotif(s, colors), [s.arrangement, s.density, s.size, s.variation, s.mirror, s.seed, colorKey])

    // Measured width, so the shapes keep their pixel size in a responsive box
    const [width, setWidth] = useState(1000)
    useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setWidth(el.clientWidth || 1000))
        ro.observe(el)
        setWidth(el.clientWidth || 1000)
        return () => ro.disconnect()
    }, [])

    // Growing in
    const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const [grown, setGrown] = useState(reduced || s.grow === 'none' || !isReadOnly)
    useEffect(() => {
        if (grown || s.grow === 'none') return
        if (s.grow === 'load') { const t = window.setTimeout(() => setGrown(true), 60); return () => window.clearTimeout(t) }
        if (s.grow === 'scroll') {
            const el = boxRef.current
            if (!el) return
            const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGrown(true); io.disconnect() } }, { threshold: 0.25 })
            io.observe(el)
            return () => io.disconnect()
        }
    }, [grown, s.grow])
    const shown = s.grow === 'hover' ? (grown && hovered) || !isReadOnly : grown

    // Pointer: the shapes part around it, or lean towards it
    useScrollTick(() => {
        const box = boxRef.current
        if (!box || reduced) return
        const r = box.getBoundingClientRect()
        const reach = 160 + s.cursorStrength * 2
        items.forEach((it, i) => {
            const g = itemRefs.current[i]
            if (!g) return
            const cx = r.left + it.x * r.width, cy = r.top + it.y * r.height
            const dx = cx - pointer.x, dy = cy - pointer.y
            const d = Math.hypot(dx, dy)
            const k = d < reach ? (1 - d / reach) : 0
            if (s.cursor === 'part') {
                const push = k * k * (s.cursorStrength * 0.9)
                g.style.transform = `translate(${(dx / (d || 1)) * push}px, ${(dy / (d || 1)) * push}px)`
            } else if (s.cursor === 'lean') {
                g.style.transform = `rotate(${(dx > 0 ? -1 : 1) * k * (s.cursorStrength * 0.6)}deg)`
            } else {
                g.style.transform = ''
            }
        })
    }, s.cursor !== 'none')

    const save = (next: MotifFieldSettings) => onUpdate(block.id, { ...block.content, settings: next })

    return (
        <div
            className={cn("relative w-full", !isReadOnly && "cursor-pointer")}
            {...hoverBind}
            onClick={(e) => {
                if (isReadOnly) return
                e.stopPropagation()
                onSelect?.(block.id)
            }}
            onMouseEnter={() => { hoverBind.onMouseEnter(); if (s.grow === 'hover') setGrown(true) }}
        >
            <div
                ref={boxRef}
                className={cn("relative w-full overflow-hidden", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] -outline-offset-1")}
                style={{ height: s.height, backgroundColor: s.background || undefined, opacity: s.opacity / 100 }}
                aria-hidden
            >
                <svg className="absolute inset-0 w-full h-full overflow-visible" width="100%" height="100%">
                    {items.map((it, i) => {
                        const px = it.x * width, py = it.y * s.height
                        return (
                            <g key={i} transform={`translate(${px} ${py})`}>
                                <g ref={(el) => { itemRefs.current[i] = el }} style={{ transition: 'transform .6s cubic-bezier(.2,.8,.2,1)', transformBox: 'fill-box', transformOrigin: 'center' }}>
                                    <g
                                        style={{
                                            transform: `rotate(${it.rotate}deg) scale(${shown ? 1 : 0})`,
                                            transformBox: 'fill-box',
                                            transformOrigin: 'center',
                                            transition: `transform 1.1s cubic-bezier(.2,.8,.2,1) ${shown ? it.delay : 0}ms`,
                                        }}
                                    >
                                        <g transform={`translate(${-it.size / 2} ${-it.size / 2}) scale(${it.size / 100})`}>
                                            <Shape shape={s.shape} color={it.color} image={s.imageUrl} />
                                        </g>
                                    </g>
                                </g>
                            </g>
                        )
                    })}
                </svg>
            </div>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Formas da marca"
                        onSettings={() => { onSelect?.(block.id); setShowSettings(true) }}
                        onAnimate={onAnimate}
                        onMove={onMove ? (dir) => onMove(block.id, dir) : undefined}
                        onCopy={onCopy ? () => onCopy(block.id) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                        onDelete={onDelete ? () => onDelete(block.id) : undefined}
                    />
                </FloatingPanel>
            )}

            {!isReadOnly && showSettings && (
                <FloatingPanel placement="right-start" offset={16}>
                    <MotifFieldPanel
                        blockId={block.id}
                        settings={settings}
                        resolved={s}
                        brandColors={brandPalette}
                        onChange={save}
                        onClose={() => setShowSettings(false)}
                        onMove={onMove ? (dir) => onMove(block.id, dir) : undefined}
                        onCopy={onCopy ? () => onCopy(block.id) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                        onDelete={onDelete ? () => { setShowSettings(false); onDelete(block.id) } : undefined}
                    />
                </FloatingPanel>
            )}
        </div>
    )
}
