"use client"

import React, { useEffect, useRef, useState } from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { TypeSpecimenPanel } from "./TypeSpecimenPanel"
import {
    VARIABLE_FONTS, loadSpecimenFont, readTypeSpecimenContent, resolveSpecimen, weightName,
    type TypeSpecimenContent,
} from "./typeSpecimen"

interface TypeSpecimenBlockProps {
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

type Resolved = ReturnType<typeof resolveSpecimen>
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
const monoLabel: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }

/** Text edited in place in the editor (saved when it loses focus); plain text elsewhere */
const Editable = ({ value, editable, onSave, className, style, multiline, as: Tag = 'span' }: {
    value: string, editable: boolean, onSave: (v: string) => void, className?: string, style?: React.CSSProperties
    multiline?: boolean, as?: 'span' | 'h2' | 'p' | 'div'
}) => editable ? (
    <Tag
        key={value}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={cn(className, "outline-none rounded-sm focus:ring-1 focus:ring-[color:var(--ts-accent)] cursor-text whitespace-pre-line")}
        style={style}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === 'Enter' && !multiline && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
            if (e.key === 'Escape') { e.currentTarget.innerText = value; e.currentTarget.blur() }
        }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => { const next = e.currentTarget.innerText.replace(/\n$/, ''); if (next !== value) onSave(next) }}
    >
        {value}
    </Tag>
) : <Tag className={cn(className, "whitespace-pre-line")} style={style}>{value}</Tag>

/** Vertical metrics of the font (ratios of the font size), measured once it is loaded */
const useFontMetrics = (family: string, weight: number, glyph: string) => {
    const [m, setM] = useState({ ascender: 0.74, cap: 0.7, x: 0.52, descender: 0.2, glyphTop: 0.7 })
    useEffect(() => {
        let alive = true
        const measure = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.font = `${weight} 1000px "${family}"`
            const up = (s: string) => ctx.measureText(s).actualBoundingBoxAscent / 1000
            const down = (s: string) => ctx.measureText(s).actualBoundingBoxDescent / 1000
            const next = { ascender: up('dhkl'), cap: up('HEI'), x: up('xvz'), descender: down('pqgy'), glyphTop: up(glyph || 'H') }
            if (alive && next.cap > 0.2) setM(next)
        }
        document.fonts?.load(`${weight} 100px "${family}"`).then(measure).catch(measure)
        return () => { alive = false }
    }, [family, weight, glyph])
    return m
}

/** The big glyph on its construction grid */
const GlyphStage = ({ s, height }: { s: Resolved, height: number }) => {
    const textRef = useRef<SVGTextElement>(null)
    const weightRef = useRef<HTMLSpanElement>(null)
    const nameRef = useRef<HTMLSpanElement>(null)
    const m = useFontMetrics(s.fontFamily, s.heroWeight, s.glyph)
    // Capitals and tall letters: the ascender line sits on the top of the letter itself (it touches it);
    // short lowercase letters (a, g, x…) keep the font's ascender, which they don't reach
    const ascender = m.glyphTop >= m.cap * 0.97 ? m.glyphTop : m.ascender
    const W = 1000, H = 760
    const size = H * (s.glyphSize / 100) / Math.max(0.6, ascender + m.descender * 0.6)
    const baseline = H / 2 + (m.cap * size) / 2
    const guides = [
        { key: 'ascender', y: baseline - ascender * size, value: Math.round(ascender * 1000), label: s.guideLabels.ascender },
        { key: 'cap', y: baseline - m.cap * size, value: Math.round(m.cap * 1000), label: s.guideLabels.cap },
        { key: 'x', y: baseline - m.x * size, value: Math.round(m.x * 1000), label: s.guideLabels.x },
        { key: 'baseline', y: baseline, value: 0, label: s.guideLabels.baseline },
        { key: 'descender', y: baseline + m.descender * size, value: -Math.round(m.descender * 1000), label: s.guideLabels.descender },
    ].filter(g => g.label)
    // Ascender and cap height (almost) the same: one line on the top of the letter, with both names
    const capGuide = guides.find(g => g.key === 'cap')
    const ascGuide = guides.find(g => g.key === 'ascender')
    const merged = !!(capGuide && ascGuide && Math.abs(ascender - m.cap) * 1000 < 25)
    const shown = merged
        ? guides.filter(g => g.key !== 'cap').map(g => g.key === 'ascender' ? { ...g, label: `${g.label}  ·  ${capGuide!.label}` } : g)
        : guides

    // Weight sweep: the glyph goes through the whole weight range, the label follows
    useEffect(() => {
        if (s.glyphAnimation !== 'weight') return
        const [min, max] = VARIABLE_FONTS[s.fontFamily] || [100, 900]
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
        let raf = 0
        const tick = (t: number) => {
            const w = Math.round(min + (max - min) * (0.5 - 0.5 * Math.cos(t / 1400)))
            textRef.current?.setAttribute('font-weight', String(w))
            if (weightRef.current) weightRef.current.textContent = String(w)
            if (nameRef.current) nameRef.current.textContent = weightName(w)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [s.glyphAnimation, s.fontFamily])

    const glyphStyle: React.SVGProps<SVGTextElement> =
        s.glyphMode === 'outline' ? { fill: 'none', stroke: s.accent, strokeWidth: 1.6 }
        : s.glyphMode === 'ghost' ? { fill: s.text, fillOpacity: 0.08, stroke: s.text, strokeWidth: 1.2 }
        : s.glyphMode === 'accent' ? { fill: s.accent }
        : { fill: s.text }

    return (
        <div className="relative w-full" style={{ height }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet" aria-hidden>
                {s.showGuides && shown.map(g => (
                    <g key={g.key}>
                        <line x1={0} x2={W} y1={g.y} y2={g.y} stroke={g.key === 'baseline' ? s.accent : s.muted} strokeOpacity={g.key === 'baseline' ? 0.7 : 0.35} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                        <circle cx={W} cy={g.y} r={3} fill={s.accent} />
                        <text x={0} y={g.y - 10} fill={s.muted} fontFamily={MONO} fontSize={15} letterSpacing={2.4}>
                            {g.label.toUpperCase()}{s.showGuideValues ? `  ·  ${g.value}` : ''}
                        </text>
                    </g>
                ))}
                <text
                    ref={textRef}
                    x={W / 2}
                    y={baseline}
                    textAnchor="middle"
                    fontFamily={`"${s.fontFamily}"`}
                    fontSize={size}
                    fontWeight={s.heroWeight}
                    vectorEffect="non-scaling-stroke"
                    className={s.glyphAnimation === 'draw' ? 'ts-draw' : undefined}
                    {...glyphStyle}
                    style={s.glyphAnimation === 'draw' ? { stroke: glyphStyle.stroke || s.accent, strokeWidth: 1.6 } : undefined}
                >
                    {s.glyph}
                </text>
            </svg>
            {s.showHeroWeight && (
                <div className="absolute left-0 bottom-0 flex items-baseline gap-3">
                    <span ref={weightRef} className="leading-none tabular-nums" style={{ fontFamily: `"${s.fontFamily}"`, fontWeight: 800, fontSize: 30, color: s.text, fontStyle: 'italic' }}>
                        {s.heroWeight}
                    </span>
                    <span ref={nameRef} style={{ ...monoLabel, color: s.muted }}>{weightName(s.heroWeight)}</span>
                </div>
            )}
        </div>
    )
}

export const TypeSpecimenBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: TypeSpecimenBlockProps) => {
    const content: TypeSpecimenContent = readTypeSpecimenContent(block.content)
    const s = resolveSpecimen(content.settings)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = useState(false)
    const [testerWeight, setTesterWeight] = useState(s.testerWeight)
    const editable = !isReadOnly
    const font = `"${s.fontFamily}", ui-sans-serif, system-ui, sans-serif`

    useEffect(() => { loadSpecimenFont(s.fontFamily) }, [s.fontFamily])
    // A new initial weight (panel) moves the tester's slider there
    const [initialWeight, setInitialWeight] = useState(s.testerWeight)
    if (initialWeight !== s.testerWeight) { setInitialWeight(s.testerWeight); setTesterWeight(s.testerWeight) }

    // Narrow: everything stacks
    const rootRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setWidth(el.clientWidth))
        ro.observe(el)
        setWidth(el.clientWidth)
        return () => ro.disconnect()
    }, [])
    const narrow = width > 0 && width < 880
    const padX = narrow ? Math.min(28, s.paddingX) : s.paddingX

    const save = (next: TypeSpecimenContent) => onUpdate(block.id, { ...block.content, weights: next.weights, levels: next.levels, settings: next.settings })
    const setSettings = (patch: Partial<TypeSpecimenContent['settings']>) => save({ ...content, settings: { ...content.settings, ...patch } })
    const setLevelSample = (id: string, sample: string) => save({ ...content, levels: content.levels.map(l => l.id === id ? { ...l, sample } : l) })

    const tagMatch = /^(\(\s*\d+\s*\))\s*(.*)$/.exec(s.tag)
    const centered = s.layout === 'centered'
    const [minW, maxW] = [Math.max(1, s.testerMin), Math.max(s.testerMin + 1, s.testerMax)]
    const card: React.CSSProperties = { backgroundColor: s.surface, border: `1px solid ${s.border}`, borderRadius: s.radius }
    const weightCard: React.CSSProperties = {
        backgroundColor: s.weightsFill ? s.surface : 'transparent',
        border: `1px solid ${s.weightsBorder ? s.border : 'transparent'}`,
        borderRadius: s.radius,
    }
    // The hierarchy is light by default: only separator lines, no box
    const hierarchyBoxed = s.hierarchyFill || s.hierarchyBorder
    const hierarchyBox: React.CSSProperties = {
        backgroundColor: s.hierarchyFill ? s.surface : 'transparent',
        border: `1px solid ${s.hierarchyBorder ? s.border : 'transparent'}`,
        borderRadius: s.hierarchyRadius,
        padding: hierarchyBoxed ? 24 : '4px 0 0',
    }
    const weightRows = Math.ceil(content.weights.length / 2) || 1

    const intro = (
        <div className={cn("flex flex-col gap-6 min-w-0", centered && "items-center text-center")}>
            {s.tag && (
                <div className="flex items-center gap-3">
                    {tagMatch && <span className="h-6 px-2.5 rounded-full inline-flex items-center" style={{ ...monoLabel, color: s.text, border: `1px solid ${s.text}` }}>{tagMatch[1]}</span>}
                    <Editable value={tagMatch ? tagMatch[2] : s.tag} editable={editable} onSave={(v) => setSettings({ tag: tagMatch ? `${tagMatch[1]} ${v}` : v })} style={{ ...monoLabel, color: s.text }} />
                </div>
            )}
            <div className={cn("flex flex-col gap-4", centered && "items-center")}>
                {s.eyebrow && <Editable value={s.eyebrow} editable={editable} onSave={(eyebrow) => setSettings({ eyebrow })} style={{ ...monoLabel, color: s.accent }} />}
                <Editable
                    as="h2"
                    value={s.title}
                    editable={editable}
                    multiline
                    onSave={(title) => setSettings({ title })}
                    className="leading-[1.02] tracking-[-0.03em]"
                    style={{ fontFamily: font, fontWeight: 800, fontSize: narrow ? 40 : 54, color: s.text }}
                />
                {s.description && (
                    <Editable as="p" value={s.description} editable={editable} multiline onSave={(description) => setSettings({ description })}
                        className="leading-relaxed max-w-[440px]" style={{ fontFamily: font, fontWeight: 400, fontSize: 17, color: s.muted }} />
                )}
            </div>
            <span className="block w-10 h-px" style={{ backgroundColor: s.muted }} />
        </div>
    )

    const stage = <GlyphStage s={s} height={narrow ? Math.round(s.heroHeight * 0.65) : s.heroHeight} />

    return (
        <div
            ref={rootRef}
            className={cn("relative w-full", !isReadOnly && "cursor-pointer")}
            {...hoverBind}
            onClick={(e) => {
                if (isReadOnly) return
                e.stopPropagation()
                onSelect?.(block.id)
            }}
        >
            <section
                className={cn("relative w-full overflow-hidden", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] -outline-offset-1")}
                style={{
                    ['--ts-accent' as string]: s.accent,
                    backgroundColor: s.background,
                    color: s.text,
                    padding: `${s.paddingY}px ${padX}px`,
                    backgroundImage: s.backdropGrid ? `linear-gradient(${s.border} 1px, transparent 1px), linear-gradient(90deg, ${s.border} 1px, transparent 1px)` : undefined,
                    backgroundSize: s.backdropGrid ? '48px 48px' : undefined,
                }}
            >
                <div className="relative mx-auto w-full flex flex-col" style={{ maxWidth: s.maxWidth || undefined, gap: narrow ? 56 : 88 }}>
                    {/* 1 · Construction grid + description (either can be left to the section's own columns) */}
                    {(s.showGlyph !== false || s.showIntro !== false) && <div
                        className="grid items-center"
                        style={{
                            gridTemplateColumns: narrow || centered || s.showGlyph === false || s.showIntro === false ? 'minmax(0, 1fr)' : s.layout === 'reverse' ? 'minmax(0, 1fr) minmax(0, 1.35fr)' : 'minmax(0, 1.35fr) minmax(0, 1fr)',
                            gap: narrow ? 40 : 72,
                        }}
                    >
                        {s.showGlyph === false ? intro : s.showIntro === false ? stage : s.layout === 'reverse' && !narrow ? <>{intro}{stage}</> : <>{stage}{intro}</>}
                    </div>}

                    {/* 2 · Weights + hierarchy */}
                    {(s.showWeights || s.showHierarchy) && (
                        <div className="grid items-stretch" style={{ gridTemplateColumns: narrow || !(s.showWeights && s.showHierarchy) ? 'minmax(0, 1fr)' : 'minmax(0, 0.85fr) minmax(0, 1.4fr)', gap: s.columnsGap }}>
                            {s.showWeights && (
                                <div
                                    className="grid h-full"
                                    style={{
                                        gap: s.weightsGap,
                                        gridTemplateColumns: `repeat(${narrow ? 2 : Math.min(2, content.weights.length) || 1}, minmax(0, 1fr))`,
                                        // Rows share the height of the hierarchy next to them
                                        gridTemplateRows: narrow ? undefined : `repeat(${weightRows}, minmax(0, 1fr))`,
                                    }}
                                >
                                    {content.weights.map(w => (
                                        <div key={w.id} className="group/w flex flex-col items-center justify-center gap-3 py-7 px-3 transition-colors hover:![border-color:var(--ts-accent)]" style={weightCard}>
                                            <span className="leading-none transition-colors group-hover/w:![color:var(--ts-accent)]" style={{ fontFamily: font, fontWeight: w.weight, fontSize: 40, color: s.text }}>Aa</span>
                                            <span style={{ ...monoLabel, color: s.muted }}>{w.weight} {w.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {s.showHierarchy && (
                                <div className="flex flex-col" style={hierarchyBox}>
                                    <div className="flex items-center justify-between gap-3 pb-4">
                                        <Editable value={s.hierarchyTitle} editable={editable} onSave={(hierarchyTitle) => setSettings({ hierarchyTitle })} style={{ ...monoLabel, color: s.muted }} />
                                        {s.hierarchyTag && <span className="h-6 px-2.5 rounded-full inline-flex items-center shrink-0" style={{ ...monoLabel, fontSize: 9, color: s.text, border: `1px solid ${s.border}` }}>+ {s.hierarchyTag}</span>}
                                    </div>
                                    {content.levels.map((l, i) => (
                                        <div
                                            key={l.id}
                                            className="flex flex-col gap-2"
                                            style={{
                                                paddingTop: s.hierarchyRowGap,
                                                borderTop: `1px solid ${s.border}`,
                                                // Without a box, a last line closes the list
                                                borderBottom: !hierarchyBoxed && i === content.levels.length - 1 ? `1px solid ${s.border}` : undefined,
                                                paddingBottom: hierarchyBoxed && i === content.levels.length - 1 ? 0 : s.hierarchyRowGap,
                                            }}
                                        >
                                            <span style={{ ...monoLabel, fontSize: 9, color: s.muted }}>
                                                {l.role} · {weightName(l.weight)} {l.weight} · {l.size}/{l.lineHeight}
                                            </span>
                                            <Editable
                                                value={l.sample}
                                                editable={editable}
                                                onSave={(sample) => setLevelSample(l.id, sample)}
                                                style={{ fontFamily: font, fontWeight: l.weight, fontSize: narrow ? Math.min(l.size, 30) : l.size, lineHeight: `${l.lineHeight}px`, color: s.text, letterSpacing: l.size > 30 ? '-0.02em' : undefined }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3 · Weight tester */}
                    {s.showTester && (
                        <div className="flex flex-col gap-3 -mt-6">
                            <span style={{ ...monoLabel, color: s.muted }}>{s.testerLabel}</span>
                            <div className="relative flex flex-col gap-4 p-6 sm:p-8" style={card}>
                                <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                    <span style={{ ...monoLabel, color: s.muted }}>Peso</span>
                                    <input
                                        type="range"
                                        min={minW}
                                        max={maxW}
                                        step={1}
                                        value={Math.min(maxW, Math.max(minW, testerWeight))}
                                        onChange={(e) => setTesterWeight(Number(e.target.value))}
                                        className="ts-range w-[160px] cursor-pointer"
                                        aria-label="Peso do texto de teste"
                                    />
                                    <span className="w-9 text-right tabular-nums" style={{ ...monoLabel, color: s.accent, letterSpacing: '0.04em' }}>{testerWeight}</span>
                                </div>
                                {/* Visitors can type to try the font; in the editor the text is saved */}
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    spellCheck={false}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(e) => { if (editable) { const v = e.currentTarget.innerText.trim(); if (v && v !== s.testerText) setSettings({ testerText: v }) } }}
                                    className="outline-none cursor-text break-words"
                                    style={{ fontFamily: font, fontWeight: testerWeight, fontSize: narrow ? Math.round(s.testerSize * 0.6) : s.testerSize, lineHeight: 1.1, letterSpacing: '-0.02em', color: s.text, transition: 'font-weight 120ms linear' }}
                                >
                                    {s.testerText}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Tipografia"
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
                    <TypeSpecimenPanel
                        content={content}
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
