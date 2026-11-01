"use client"

import React from "react"
import { Upload } from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { useLogoUpload } from "./LogoShowcasePanel"
import { LogoSizePanel } from "./LogoSizePanel"
import { LOGO_FONTS } from "./logoShowcase"
import {
    LOGO_SIZE_SAMPLE, formatSize, readLogoSizeContent, resolveLogoSizeSettings, sizeState, specValue,
    type LogoSizeContent,
} from "./logoSize"

interface LogoSizeBlockProps {
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

type Resolved = ReturnType<typeof resolveLogoSizeSettings>

const MONO = LOGO_FONTS.mono

/** Size slider: drag, click on the track, or arrows (Shift = 10 px); marks at the minimum / recommended size */
const SizeSlider = ({ value, s, onChange }: { value: number, s: Resolved, onChange: (v: number) => void }) => {
    const trackRef = React.useRef<HTMLDivElement>(null)
    const min = s.sliderMin, max = Math.max(s.sliderMin + 1, s.sliderMax)
    const pct = (v: number) => ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100
    const fromPointer = (clientX: number) => {
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect) return
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
        onChange(Math.round(min + ratio * (max - min)))
    }
    const marks = s.showMarks ? [
        { at: s.minSize, color: s.belowColor, title: `Mínimo: ${formatSize(s.minSize, s)}` },
        ...(s.recommendedSize ? [{ at: s.recommendedSize, color: s.recommendedColor, title: `Recomendado: ${formatSize(s.recommendedSize, s)}` }] : []),
    ].filter(m => m.at >= min && m.at <= max) : []

    return (
        <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Tamanho do logótipo"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={formatSize(value, s)}
            className="relative h-6 w-full cursor-pointer touch-none outline-none group/slider"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
                e.stopPropagation()
                e.currentTarget.setPointerCapture(e.pointerId)
                fromPointer(e.clientX)
            }}
            onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientX) }}
            onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 1
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + step))
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, value - step))
                else if (e.key === 'Home') onChange(min)
                else if (e.key === 'End') onChange(max)
                else return
                e.preventDefault()
            }}
        >
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full" style={{ backgroundColor: s.trackColor }} />
            {marks.map(m => (
                <span
                    key={m.title}
                    title={m.title}
                    className="absolute top-1/2 w-[2px] h-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
                    style={{ left: `${pct(m.at)}%`, backgroundColor: m.color }}
                />
            ))}
            <span
                className="absolute top-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition-transform group-active/slider:scale-110 group-focus-visible/slider:ring-2 group-focus-visible/slider:ring-white/40"
                style={{ left: `${pct(value)}%`, backgroundColor: s.thumbColor }}
            />
        </div>
    )
}

export const LogoSizeBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: LogoSizeBlockProps) => {
    const content: LogoSizeContent = readLogoSizeContent(block.content)
    const s = resolveLogoSizeSettings(content.settings)
    const [size, setSize] = React.useState(s.initialSize)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = React.useState(false)
    const upload = useLogoUpload(block.id)
    const fileRef = React.useRef<HTMLInputElement>(null)
    const [ratio, setRatio] = React.useState(1)

    // A new initial size (panel) shows right away; the slider range keeps the size inside it
    React.useEffect(() => { setSize(s.initialSize) }, [s.initialSize])
    const value = Math.min(Math.max(size, s.sliderMin), Math.max(s.sliderMin + 1, s.sliderMax))
    const state = sizeState(value, s)
    const stateColor = state === 'below' ? s.belowColor : state === 'recommended' ? s.recommendedColor : s.aboveColor
    const stateLabel = state === 'below' ? s.belowLabel : state === 'recommended' ? s.recommendedLabel : s.aboveLabel
    const logo = s.logoUrl || LOGO_SIZE_SAMPLE()
    const logoBox = s.measure === 'width' ? { width: value, height: value / ratio } : { width: value * ratio, height: value }

    const save = (next: LogoSizeContent) => onUpdate(block.id, { ...block.content, specs: next.specs, settings: next.settings })
    const visibleSpecs = s.showSpecs ? content.specs : []

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
                className={cn("w-full", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-2")}
                style={{ backgroundColor: s.blockBackground || undefined, padding: s.blockPadding }}
            >
                <div
                    className="group/stage relative w-full flex flex-col overflow-hidden transition-colors duration-300"
                    style={{
                        height: s.stageHeight,
                        backgroundColor: s.stageBackground,
                        borderRadius: s.radius,
                        border: `1px solid ${state === 'below' && s.warnBorder ? s.belowColor : s.stageBorder}`,
                        padding: '28px 34px 34px',
                    }}
                >
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logo}
                            alt="Logótipo"
                            draggable={false}
                            className="block object-contain select-none max-w-full max-h-full"
                            style={{ width: logoBox.width, height: logoBox.height }}
                            onLoad={(e) => {
                                const img = e.currentTarget
                                if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight)
                            }}
                        />
                    </div>

                    <SizeSlider value={value} s={s} onChange={setSize} />

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[12px] tabular-nums" style={{ fontFamily: MONO, color: s.readoutColor }}>{formatSize(value, s)}</span>
                        <span
                            className="shrink-0 h-7 px-3 rounded-full inline-flex items-center text-[11px] font-medium uppercase tracking-[0.1em] transition-colors duration-300"
                            style={{ fontFamily: MONO, color: stateColor, backgroundColor: `color-mix(in srgb, ${stateColor} 16%, transparent)` }}
                        >
                            {stateLabel}
                        </span>
                    </div>

                    {!isReadOnly && (
                        <>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*,.svg"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    e.target.value = ''
                                    if (!file) return
                                    const url = await upload(file)
                                    if (url) save({ ...content, settings: { ...content.settings, logoUrl: url } })
                                }}
                            />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                                className="absolute right-3 top-3 h-8 px-3 rounded-full flex items-center gap-1.5 text-[11px] font-medium bg-black/70 text-white backdrop-blur opacity-0 group-hover/stage:opacity-100 transition-opacity hover:bg-black"
                            >
                                <Upload className="w-3.5 h-3.5" /> {s.logoUrl ? 'Substituir logótipo' : 'Carregar logótipo'}
                            </button>
                        </>
                    )}
                </div>

                {visibleSpecs.length > 0 && (
                    <dl className="flex flex-col" style={{ marginTop: s.specsGap }}>
                        {visibleSpecs.map((spec, i) => (
                            <div
                                key={spec.id}
                                className="flex items-center justify-between gap-4 py-4"
                                style={{ borderBottom: i < visibleSpecs.length - 1 ? `1px solid ${s.specLineColor}` : undefined }}
                            >
                                <dt className="text-[15px]" style={{ color: s.specLabelColor }}>{spec.label}</dt>
                                <dd className="text-[13px] font-bold text-right" style={{ fontFamily: MONO, color: s.specValueColor }}>{specValue(spec, s)}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Tamanho mínimo"
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
                    <LogoSizePanel
                        blockId={block.id}
                        content={content}
                        resolved={s}
                        onChange={save}
                        onPreviewSize={setSize}
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
