"use client"

import React, { useEffect, useRef, useState } from "react"
import { Grid3x3 } from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { IconSpecimenPanel } from "./IconSpecimenPanel"
import { IconGlyph } from "./IconGlyph"
import {
    CORNER_LABELS, cornerWord, iconLabel, readIconSpecimenContent, resolveIconSpecimen,
    type IconCorners, type IconGrid, type IconSpecimenContent, type IconStyle,
} from "./iconSpecimen"

interface IconSpecimenBlockProps {
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

type Resolved = ReturnType<typeof resolveIconSpecimen>
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
const monoLabel: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }

/** Text edited in place in the editor (saved when it loses focus) */
const Editable = ({ value, editable, onSave, className, style, multiline, as: Tag = 'span' }: {
    value: string, editable: boolean, onSave: (v: string) => void, className?: string, style?: React.CSSProperties
    multiline?: boolean, as?: 'span' | 'h2' | 'p'
}) => editable ? (
    <Tag
        key={value}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={cn(className, "outline-none rounded-sm focus:ring-1 focus:ring-[color:var(--is-accent)] cursor-text whitespace-pre-line")}
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

/** The big icon on its 24 × 24 construction grid */
const ConstructionStage = ({ s, icon, style, weight, color, grid, size, corners }: {
    s: Resolved, icon: string, style: IconStyle, weight: number, color: string, grid: IconGrid, size: number, corners: IconCorners
}) => {
    const pixels = grid === 'pixels' || grid === 'both'
    const keylines = grid === 'keylines' || grid === 'both'
    const line = { vectorEffect: 'non-scaling-stroke' as const, fill: 'none' }
    return (
        <div className="relative mx-auto" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
                {pixels && Array.from({ length: 25 }, (_, i) => (
                    <g key={i}>
                        <line x1={i} x2={i} y1={0} y2={24} stroke={s.border} strokeWidth={1} {...line} />
                        <line y1={i} y2={i} x1={0} x2={24} stroke={s.border} strokeWidth={1} {...line} />
                    </g>
                ))}
                {keylines && (
                    <g stroke={s.accent} strokeOpacity={0.55} strokeWidth={1}>
                        <rect x={2} y={2} width={20} height={20} strokeDasharray="4 4" {...line} />
                        <circle cx={12} cy={12} r={10} {...line} />
                        <rect x={3} y={3} width={18} height={18} rx={2} {...line} />
                        <rect x={4} y={2} width={16} height={20} rx={2} {...line} />
                        <rect x={2} y={4} width={20} height={16} rx={2} {...line} />
                        <line x1={0} y1={0} x2={24} y2={24} {...line} strokeOpacity={0.25} />
                        <line x1={24} y1={0} x2={0} y2={24} {...line} strokeOpacity={0.25} />
                    </g>
                )}
                <rect x={0} y={0} width={24} height={24} stroke={s.muted} strokeOpacity={0.6} strokeWidth={1} {...line} />
            </svg>
            <div className="absolute inset-0">
                <IconGlyph name={icon} style={style} weight={weight} corners={corners} color={color} size="100%" />
            </div>
            {grid !== 'none' && (
                <>
                    <span className="absolute left-0 -top-6" style={{ ...monoLabel, color: s.muted }}>24 px</span>
                    <span className="absolute right-0 -bottom-6" style={{ ...monoLabel, color: s.muted }}>Margem 2 px</span>
                </>
            )}
        </div>
    )
}

export const IconSpecimenBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: IconSpecimenBlockProps) => {
    const content: IconSpecimenContent = readIconSpecimenContent(block.content)
    const s = resolveIconSpecimen(content.settings)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = useState(false)
    const editable = !isReadOnly

    // What visitors play with (starts from the settings; a change in the panel resets it)
    const [style, setStyle] = useState<IconStyle>(s.iconStyle)
    const [weight, setWeight] = useState(s.strokeWidth)
    const [color, setColor] = useState(s.iconColor)
    const [grid, setGrid] = useState<IconGrid>(s.grid)
    const [hero, setHero] = useState(s.heroIcon)
    const [corners, setCorners] = useState<IconCorners>(s.corners)
    const defaultsKey = `${s.iconStyle}|${s.strokeWidth}|${s.iconColor}|${s.grid}|${s.heroIcon}|${s.corners}`
    const [appliedKey, setAppliedKey] = useState(defaultsKey)
    if (appliedKey !== defaultsKey) {
        setAppliedKey(defaultsKey)
        setStyle(s.iconStyle); setWeight(s.strokeWidth); setColor(s.iconColor); setGrid(s.grid); setHero(s.heroIcon); setCorners(s.corners)
    }

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
    const centered = s.layout === 'centered'

    const save = (next: IconSpecimenContent) => onUpdate(block.id, { ...block.content, icons: next.icons, specs: next.specs, settings: next.settings })
    const setSettings = (patch: Partial<IconSpecimenContent['settings']>) => save({ ...content, settings: { ...content.settings, ...patch } })

    const tagMatch = /^(\(\s*\d+\s*\))\s*(.*)$/.exec(s.tag)
    const palette = s.palette.length ? s.palette : [s.iconColor]
    const card = (selected: boolean): React.CSSProperties => ({
        backgroundColor: s.cards === 'cards' ? s.surface : 'transparent',
        border: `1px solid ${selected ? s.accent : s.cards === 'plain' ? 'transparent' : s.border}`,
        borderRadius: s.radius,
    })

    const controls = s.showControls && (
        <div className={cn("flex flex-col gap-4", centered && "items-center")} onClick={(e) => e.stopPropagation()}>
            {/* Style */}
            <div className="inline-flex p-1 rounded-full gap-1" style={{ border: `1px solid ${s.border}` }}>
                {([['outline', 'Contorno'], ['solid', 'Sólido'], ['duotone', 'Duotone']] as [IconStyle, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setStyle(id)}
                        className="h-8 px-3.5 rounded-full transition-colors"
                        style={{ ...monoLabel, fontSize: 9, backgroundColor: style === id ? s.text : 'transparent', color: style === id ? s.background : s.muted }}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {/* Corners */}
            <div className="inline-flex p-1 rounded-full gap-1" style={{ border: `1px solid ${s.border}` }}>
                {(Object.keys(CORNER_LABELS) as IconCorners[]).map(id => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setCorners(id)}
                        className="h-8 px-3.5 rounded-full transition-colors"
                        style={{ ...monoLabel, fontSize: 9, backgroundColor: corners === id ? s.text : 'transparent', color: corners === id ? s.background : s.muted }}
                    >
                        {CORNER_LABELS[id]}
                    </button>
                ))}
            </div>
            <div className={cn("flex flex-wrap items-center gap-5", centered && "justify-center")}>
                {/* Colours */}
                {palette.length > 1 && (
                    <div className="flex items-center gap-2">
                        {palette.map((c, i) => (
                            <button
                                key={i}
                                type="button"
                                title={c}
                                onClick={() => setColor(c)}
                                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${s.background}, 0 0 0 3.5px ${s.accent}` : `inset 0 0 0 1px ${s.border}` }}
                            />
                        ))}
                    </div>
                )}
                {/* Weight */}
                <div className="flex items-center gap-3">
                    <span style={{ ...monoLabel, color: s.muted }}>Peso</span>
                    <input
                        type="range"
                        min={0.5}
                        max={3}
                        step={0.25}
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="ts-range w-[130px] cursor-pointer"
                        aria-label="Peso do traço"
                    />
                    <span className="w-12 tabular-nums" style={{ ...monoLabel, color: s.accent, letterSpacing: '0.04em' }}>{weight.toFixed(2).replace(/0$/, '')} px</span>
                </div>
                {/* Grid on / off */}
                <button
                    type="button"
                    title={grid === 'none' ? 'Mostrar a grelha' : 'Esconder a grelha'}
                    onClick={() => setGrid(g => g === 'none' ? (s.grid === 'none' ? 'both' : s.grid) : 'none')}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ border: `1px solid ${s.border}`, color: grid === 'none' ? s.muted : s.accent }}
                >
                    <Grid3x3 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )

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
                <Editable as="h2" value={s.title} editable={editable} multiline onSave={(title) => setSettings({ title })}
                    className="leading-[1.02] tracking-[-0.03em]" style={{ fontWeight: 800, fontSize: narrow ? 38 : 52, color: s.text }} />
                {s.description && (
                    <Editable as="p" value={s.description} editable={editable} multiline onSave={(description) => setSettings({ description })}
                        className="leading-relaxed max-w-[460px]" style={{ fontSize: 16, color: s.muted }} />
                )}
            </div>
            {controls}
        </div>
    )

    const stageSize = Math.min(narrow ? Math.max(200, width - padX * 2 - 40) : s.heroHeight, s.heroHeight)
    const stage = (
        <div className="flex items-center justify-center py-8">
            <ConstructionStage s={s} icon={hero} style={style} weight={weight} color={color} grid={grid} size={stageSize} corners={corners} />
        </div>
    )

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
                style={{ ['--is-accent' as string]: s.accent, ['--ts-accent' as string]: s.accent, backgroundColor: s.background, color: s.text, padding: `${s.paddingY}px ${padX}px` }}
            >
                <div className="relative mx-auto w-full flex flex-col" style={{ maxWidth: s.maxWidth || undefined, gap: narrow ? 48 : 72 }}>
                    {/* 1 · Construction grid + description and controls */}
                    <div
                        className="grid items-center"
                        style={{
                            gridTemplateColumns: narrow || centered ? 'minmax(0, 1fr)' : s.layout === 'reverse' ? 'minmax(0, 1fr) minmax(0, 1.1fr)' : 'minmax(0, 1.1fr) minmax(0, 1fr)',
                            gap: narrow ? 32 : 72,
                        }}
                    >
                        {s.layout === 'reverse' && !narrow ? <>{intro}{stage}</> : <>{stage}{intro}</>}
                    </div>

                    {/* 2 · Specs */}
                    {s.showSpecs && content.specs.length > 0 && (
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${narrow ? 2 : content.specs.length}, minmax(0, 1fr))`, borderTop: `1px solid ${s.border}` }}>
                            {content.specs.map((spec, i) => (
                                <div key={spec.id} className="flex flex-col gap-2 pt-5 pr-4" style={{ borderLeft: i % (narrow ? 2 : content.specs.length) ? `1px solid ${s.border}` : undefined, paddingLeft: i % (narrow ? 2 : content.specs.length) ? 20 : 0 }}>
                                    <span style={{ ...monoLabel, color: s.muted }}>{spec.label}</span>
                                    <span className="text-[18px] font-semibold tabular-nums" style={{ color: s.text }}>{spec.value.replace('{weight}', String(weight)).replace('{corners}', cornerWord(corners))}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 3 · The set */}
                    {s.showSet && content.icons.length > 0 && (
                        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${narrow ? Math.min(3, s.columns) : s.columns}, minmax(0, 1fr))` }}>
                            {content.icons.map((name, i) => {
                                const selected = name === hero
                                return (
                                    <button
                                        key={`${name}-${i}`}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setHero(name) }}
                                        title={`Ver ${iconLabel(name)} na grelha`}
                                        className="group/icon flex flex-col items-center justify-center gap-3 py-7 px-2 transition-colors hover:![border-color:var(--is-accent)]"
                                        style={card(selected)}
                                    >
                                        <span className="transition-transform duration-200 group-hover/icon:scale-110">
                                            <IconGlyph name={name} style={style} weight={weight} corners={corners} color={selected ? s.accent : color} size={34} />
                                        </span>
                                        {s.showLabels && <span className="truncate max-w-full" style={{ ...monoLabel, fontSize: 9, color: s.muted }}>{iconLabel(name)}</span>}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Iconografia"
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
                    <IconSpecimenPanel
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
