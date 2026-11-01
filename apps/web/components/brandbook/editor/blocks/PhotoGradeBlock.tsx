"use client"

import React, { useRef, useState } from "react"
import { Check, MoveHorizontal, X } from "lucide-react"
import { toast } from "sonner"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { PhotoGradePanel } from "./PhotoGradePanel"
import {
    gradeFilter, gradeValues, readPhotoGradeSettings, resolvePhotoGrade, warmthLayer,
    type PhotoGrade, type PhotoGradeSettings, type PhotoOverlay,
} from "./photoGrade"

interface PhotoGradeBlockProps {
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

type Resolved = ReturnType<typeof resolvePhotoGrade>
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
const mono: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

/** The photo with a grade: CSS filters, then the temperature, fade, colour wash, grain and vignette layers */
const GradedPhoto = ({ url, grade, original }: { url: string, grade: PhotoGrade, original?: boolean }) => {
    const warm = original ? undefined : warmthLayer(grade)
    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none" style={{ filter: original ? undefined : gradeFilter(grade) }} />
            {!original && (
                <>
                    {warm && <div className="absolute inset-0" style={{ backgroundColor: warm, mixBlendMode: 'soft-light' }} />}
                    {!!grade.fade && <div className="absolute inset-0" style={{ backgroundColor: `rgba(120,120,120,${grade.fade / 260})`, mixBlendMode: 'lighten' }} />}
                    {grade.wash && !!grade.washStrength && <div className="absolute inset-0" style={{ backgroundColor: grade.wash, opacity: grade.washStrength / 100, mixBlendMode: grade.washBlend || 'color' }} />}
                    {!!grade.grain && <div className="absolute inset-0" style={{ backgroundImage: NOISE, opacity: grade.grain / 100 * 0.7, mixBlendMode: 'overlay' }} />}
                    {!!grade.vignette && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${grade.vignette / 100 * 0.75}) 100%)` }} />}
                </>
            )}
        </div>
    )
}

/** Composition guides over the photo */
const Guides = ({ overlay, color }: { overlay: PhotoOverlay, color: string }) => {
    if (overlay === 'none') return null
    const line = { stroke: color, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const, strokeOpacity: 0.85 }
    const phi = 61.8, inv = 38.2
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            {overlay === 'thirds' && [33.33, 66.67].map(v => (
                <g key={v}><line x1={v} x2={v} y1={0} y2={100} {...line} /><line y1={v} y2={v} x1={0} x2={100} {...line} /></g>
            ))}
            {overlay === 'thirds' && [[33.33, 33.33], [66.67, 33.33], [33.33, 66.67], [66.67, 66.67]].map(([x, y]) => (
                <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={0.9} ry={1.4} fill={color} />
            ))}
            {overlay === 'golden' && [inv, phi].map(v => (
                <g key={v}><line x1={v} x2={v} y1={0} y2={100} {...line} /><line y1={v} y2={v} x1={0} x2={100} {...line} /></g>
            ))}
            {overlay === 'golden' && <path d={`M100 100 Q 100 ${inv} ${phi} ${inv} Q ${inv} ${inv} ${inv} ${phi} Q ${inv} 78 52 78`} fill="none" {...line} />}
            {overlay === 'center' && (
                <g>
                    <line x1={50} x2={50} y1={0} y2={100} {...line} strokeDasharray="3 3" />
                    <line y1={50} y2={50} x1={0} x2={100} {...line} strokeDasharray="3 3" />
                    <rect x={30} y={25} width={40} height={50} fill="none" {...line} />
                </g>
            )}
            {overlay === 'diagonals' && <g><line x1={0} y1={0} x2={100} y2={100} {...line} /><line x1={100} y1={0} x2={0} y2={100} {...line} /><line x1={0} y1={100} x2={50} y2={0} {...line} strokeOpacity={0.4} /><line x1={50} y1={100} x2={100} y2={0} {...line} strokeOpacity={0.4} /></g>}
            {overlay === 'grid' && Array.from({ length: 5 }, (_, i) => (i + 1) * (100 / 6)).map(v => (
                <g key={v}><line x1={v} x2={v} y1={0} y2={100} {...line} strokeOpacity={0.5} /><line y1={v} y2={v} x1={0} x2={100} {...line} strokeOpacity={0.5} /></g>
            ))}
        </svg>
    )
}

const Tag = ({ children, tone, s }: { children: React.ReactNode, tone?: 'ok' | 'no', s: Resolved }) => (
    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full backdrop-blur" style={{ ...mono, fontSize: 9, color: '#FFFFFF', backgroundColor: tone === 'no' ? 'rgba(229,56,59,0.85)' : tone === 'ok' ? `color-mix(in srgb, ${s.accent} 85%, transparent)` : 'rgba(0,0,0,0.45)' }}>
        {tone === 'ok' && <Check className="w-3 h-3" strokeWidth={3} />}
        {tone === 'no' && <X className="w-3 h-3" strokeWidth={3} />}
        {children}
    </span>
)

/** Before / after: drag the line (or click anywhere) to compare */
const Compare = ({ s }: { s: Resolved }) => {
    const [pos, setPos] = useState(50)
    const ref = useRef<HTMLDivElement>(null)
    const move = (clientX: number) => {
        const r = ref.current?.getBoundingClientRect()
        if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
    }
    return (
        <div
            ref={ref}
            className="relative w-full overflow-hidden cursor-ew-resize touch-none select-none"
            style={{ aspectRatio: s.aspect, borderRadius: s.radius }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX) }}
            onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX) }}
        >
            <GradedPhoto url={s.image} grade={s.grade} original />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
                <GradedPhoto url={s.image} grade={s.grade} />
            </div>
            <Guides overlay={s.overlay} color={s.overlayColor} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.4)]" style={{ left: `${pos}%` }}>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-[#141414]">
                    <MoveHorizontal className="w-4 h-4" />
                </span>
            </div>
            <div className="absolute top-3 left-3"><Tag s={s}>{s.labelOriginal}</Tag></div>
            <div className="absolute top-3 right-3"><Tag s={s} tone="ok">{s.labelBrand}</Tag></div>
        </div>
    )
}

const Framed = ({ s, grade, original, label, tone }: { s: Resolved, grade: PhotoGrade, original?: boolean, label?: string, tone?: 'ok' | 'no' }) => (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: s.aspect, borderRadius: s.radius }}>
        <GradedPhoto url={s.image} grade={grade} original={original} />
        <Guides overlay={s.overlay} color={s.overlayColor} />
        {label && <div className="absolute top-3 left-3"><Tag s={s} tone={tone}>{label}</Tag></div>}
    </div>
)

export const PhotoGradeBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: PhotoGradeBlockProps) => {
    const settings = readPhotoGradeSettings(block.content)
    const s = resolvePhotoGrade(settings)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = useState(false)
    const values = gradeValues(s.grade)
    const save = (next: PhotoGradeSettings) => onUpdate(block.id, { ...block.content, settings: next })

    return (
        <div
            className={cn("relative w-full", !isReadOnly && "cursor-pointer")}
            {...hoverBind}
            onClick={(e) => {
                if (isReadOnly) return
                e.stopPropagation()
                onSelect?.(block.id)
            }}
        >
            <div
                className={cn("w-full flex flex-col gap-4", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-4")}
                style={{ backgroundColor: s.surface === 'transparent' ? undefined : s.surface }}
            >
                {s.mode === 'compare' && <Compare s={s} />}
                {s.mode === 'single' && <Framed s={s} grade={s.grade} />}
                {s.mode === 'side' && (
                    <div className="grid grid-cols-2 gap-3">
                        <Framed s={s} grade={s.grade} original label={s.labelOriginal} />
                        <Framed s={s} grade={s.grade} label={s.labelBrand} tone="ok" />
                    </div>
                )}
                {s.mode === 'variants' && (
                    <div className="grid grid-cols-3 gap-3">
                        <Framed s={s} grade={s.grade} original label={s.labelOriginal} />
                        <Framed s={s} grade={s.grade} label={s.labelBrand} tone="ok" />
                        <Framed s={s} grade={s.avoidGrade} label={s.labelAvoid} tone="no" />
                    </div>
                )}

                {(s.showValues && values.length > 0) || (s.showPalette && s.palette.length > 0) ? (
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                        {s.showValues && values.length > 0 && (
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                                {values.map(([label, value]) => (
                                    <span key={label} style={{ ...mono, fontSize: 9, color: s.muted }}>
                                        {label} <b style={{ color: s.text, letterSpacing: '0.06em' }}>{value}</b>
                                    </span>
                                ))}
                            </div>
                        )}
                        {s.showPalette && s.palette.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                {s.palette.map((c, i) => (
                                    <button
                                        // By position: two equal colours (or one being edited) must stay two chips
                                        key={i}
                                        type="button"
                                        title={`Copiar ${c}`}
                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(c).then(() => toast.success(`${c} copiado`)).catch(() => { }) }}
                                        className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                                        style={{ backgroundColor: c, boxShadow: `inset 0 0 0 1px ${s.border}` }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Tratamento fotográfico"
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
                    <PhotoGradePanel
                        blockId={block.id}
                        settings={settings}
                        resolved={s}
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
