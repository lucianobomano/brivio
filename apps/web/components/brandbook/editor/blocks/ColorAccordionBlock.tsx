"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { useBrandDesign } from "../BrandDesignContext"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { ColorAccordionPanel } from "./ColorAccordionPanel"
import { AccordionCardBar } from "./AccordionCardBar"
import {
    accordionColorId, cardBackground, colorsFromPalette, contrastLevel, contrastRatio, hexToRgb, normalizeHex, readColorAccordionContent, resolveAccordion,
    rgbToCmyk, rgbToHsl, textOn, tintsOf,
    type AccordionColor, type ColorAccordionContent,
} from "./colorAccordion"

interface ColorAccordionBlockProps {
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

type Resolved = ReturnType<typeof resolveAccordion>
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
const mono: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** Copies a colour code and says so */
const copyCode = (value: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    navigator.clipboard?.writeText(value)
        .then(() => toast.success(`${value} copiado`))
        .catch(() => toast.error('Não foi possível copiar'))
}

/** Text edited in place in the editor (saved when it loses focus) */
const Editable = ({ value, editable, onSave, className, style, as: Tag = 'span', placeholder }: {
    value: string, editable: boolean, onSave: (v: string) => void, className?: string, style?: React.CSSProperties, as?: 'span' | 'h2' | 'p'
    placeholder?: string
}) => editable ? (
    <Tag
        key={value}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-placeholder={placeholder}
        className={cn(className, "outline-none rounded-sm focus:ring-1 focus:ring-current/40 cursor-text whitespace-pre-line empty:before:content-[attr(data-placeholder)] empty:before:opacity-50")}
        style={style}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { if (e.key === 'Escape') { e.currentTarget.innerText = value; e.currentTarget.blur() } }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => { const next = e.currentTarget.innerText.replace(/\n$/, ''); if (next !== value) onSave(next) }}
    >
        {value}
    </Tag>
) : <Tag className={cn(className, "whitespace-pre-line")} style={style}>{value}</Tag>

/** Shown once the section scrolls into view (right away with "reduce motion" or no animation) */
const useReveal = (ref: React.RefObject<HTMLElement | null>, enabled: boolean) => {
    // Already shown without animation, or when the system asks for less motion
    const [shown, setShown] = useState(() => !enabled || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
    useEffect(() => {
        const el = ref.current
        if (!el || shown) return
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.18 })
        io.observe(el)
        return () => io.disconnect()
    }, [ref, shown])
    return shown
}

/** Everything about the open colour (name and description editable in place, codes copied on click) */
const ColorDetails = ({ color, colors, s, ink, visible, editable, onChange }: {
    color: AccordionColor, colors: AccordionColor[], s: Resolved, ink: string, visible: boolean, editable: boolean
    onChange: (patch: Partial<AccordionColor>) => void
}) => {
    const hex = normalizeHex(color.hex)
    const rgb = hexToRgb(hex)
    const hsl = rgbToHsl(rgb)
    const cmyk = rgbToCmyk(rgb)
    const others = colors.filter(c => c.id !== color.id && !c.gradient?.length)
    const soft = ink === '#FFFFFF' ? 'rgba(255,255,255,0.72)' : 'rgba(20,20,20,0.66)'
    const step = (i: number): React.CSSProperties => ({
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(10px)',
        transition: `opacity 500ms ${EASE} ${180 + i * 70}ms, transform 600ms ${EASE} ${180 + i * 70}ms`,
    })
    const codes: [string, string, string][] = [
        ['RGB', rgb.join(' · '), `rgb(${rgb.join(', ')})`],
        ['HSL', `${hsl[0]}° · ${hsl[1]}% · ${hsl[2]}%`, `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`],
        ['CMYK', cmyk.join(' · '), `cmyk(${cmyk.join(', ')})`],
    ]
    return (
        <div className="flex flex-col gap-5 min-w-0">
            <div style={step(0)}>
                <Editable value={color.name} editable={editable} placeholder="Nome" onSave={(name) => onChange({ name })}
                    style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, color: ink }} />
            </div>
            {(color.description || editable) && (
                <div style={step(1)}>
                    <Editable as="p" value={color.description || ''} editable={editable} placeholder="Descrição da cor" onSave={(description) => onChange({ description })}
                        className="max-w-[380px] text-[15px] leading-relaxed" style={{ color: soft }} />
                </div>
            )}
            {s.showCodes && (
                <div className="flex flex-wrap gap-x-8 gap-y-2" style={step(2)}>
                    {codes.map(([label, value, css]) => (
                        <button key={label} type="button" onClick={(e) => copyCode(css, e)} title={`Copiar ${css}`} className="flex flex-col gap-1 text-left rounded-sm hover:opacity-70 transition-opacity">
                            <span style={{ ...mono, fontSize: 9, color: soft }}>{label}</span>
                            <span style={{ ...mono, letterSpacing: '0.06em', color: ink }}>{value}</span>
                        </button>
                    ))}
                </div>
            )}
            {s.showTints && (
                <div className="flex h-10 w-full max-w-[420px] rounded-lg overflow-hidden" style={step(3)}>
                    {tintsOf(hex).map(t => (
                        <button key={t} type="button" className="flex-1 transition-transform hover:scale-y-110 origin-bottom" style={{ backgroundColor: t }} title={`Copiar ${t}`} onClick={(e) => copyCode(t, e)} />
                    ))}
                </div>
            )}
            {s.showContrast && others.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-1.5" style={step(4)}>
                    {others.map(o => {
                        const ratio = contrastRatio(hex, o.hex)
                        return (
                            <span key={o.id} className="flex items-center gap-2" style={{ ...mono, fontSize: 9, color: soft }}>
                                <span className="text-[13px] font-bold normal-case tracking-normal" style={{ color: normalizeHex(o.hex) }}>Aa</span>
                                com {o.name} {ratio.toFixed(1).replace('.', ',')}:1 <b style={{ color: ink }}>{contrastLevel(ratio)}</b>
                            </span>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export const ColorAccordionBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: ColorAccordionBlockProps) => {
    const content: ColorAccordionContent = readColorAccordionContent(block.content)
    const s = resolveAccordion(content.settings)
    // Brand colours (Settings → Colors): shown, and followed, while the block is linked to them
    const { settings: brandSettings, isLoading } = useBrandDesign()
    const palette = isLoading ? [] : (brandSettings?.color_palette || []).filter(c => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c || ''))
    const paletteKey = palette.join(',')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const brandList = useMemo(() => palette.length ? colorsFromPalette(palette) : null, [paletteKey])
    const colors = content.brandColors && brandList ? brandList : content.colors
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = useState(false)
    const [active, setActive] = useState(Math.min(s.initialIndex, Math.max(0, colors.length - 1)))
    const editable = !isReadOnly
    const rootRef = useRef<HTMLDivElement>(null)
    const shown = useReveal(rootRef, s.reveal !== 'none')
    const current = Math.min(active, Math.max(0, colors.length - 1))

    // The card under the pointer shows its own context bar (instead of the block's)
    const [cardHover, setCardHover] = useState<string | null>(null)
    const cardTimer = useRef<number | null>(null)
    useEffect(() => () => { if (cardTimer.current) window.clearTimeout(cardTimer.current) }, [])
    const cardBind = (id: string) => ({
        onMouseEnter: () => { if (cardTimer.current) window.clearTimeout(cardTimer.current); setCardHover(id) },
        onMouseLeave: () => {
            if (cardTimer.current) window.clearTimeout(cardTimer.current)
            cardTimer.current = window.setTimeout(() => setCardHover(h => h === id ? null : h), 220)
        },
    })

    // Narrow: the cards stack as rows
    const [width, setWidth] = useState(0)
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setWidth(el.clientWidth))
        ro.observe(el)
        setWidth(el.clientWidth)
        return () => ro.disconnect()
    }, [])
    const vertical = width > 0 && width < 760

    const save = (next: ColorAccordionContent) => {
        const toggled = next.brandColors !== undefined && next.brandColors !== content.brandColors
        // Editing a colour here gives the block its own colours (they stop following Settings)
        const brandColors = toggled ? !!next.brandColors : next.colors !== colors ? false : !!content.brandColors
        // While it follows the brand its own list stays as it was; when it stops, what is on screen becomes its own
        onUpdate(block.id, { ...block.content, colors: brandColors ? content.colors : next.colors, settings: next.settings, brandColors })
    }
    const setSettings = (patch: Partial<ColorAccordionContent['settings']>) => save({ ...content, settings: { ...content.settings, ...patch } })
    const setColors = (next: AccordionColor[]) => save({ ...content, colors: next })
    const setColor = (id: string, patch: Partial<AccordionColor>) => setColors(colors.map(c => c.id === id ? { ...c, ...patch } : c))

    /** Entrance of an item, in order (header texts, then each card, then the usage bar) */
    const reveal = (order: number): React.CSSProperties => {
        if (s.reveal === 'none') return {}
        const hidden = {
            opacity: 0,
            transform: s.reveal === 'rise' ? 'translateY(36px)' : s.reveal === 'blur' ? 'scale(0.98)' : undefined,
            filter: s.reveal === 'blur' ? 'blur(12px)' : undefined,
        }
        return {
            ...(shown ? { opacity: 1, transform: 'none', filter: 'none' } : hidden),
            transition: `opacity 700ms ${EASE} ${order * s.stagger}ms, transform 900ms ${EASE} ${order * s.stagger}ms, filter 700ms ${EASE} ${order * s.stagger}ms`,
        }
    }
    const usageTotal = colors.reduce((sum, c) => sum + (c.usage || 0), 0)
    const showBlockBar = !isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && !cardHover

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
                className={cn("w-full overflow-hidden", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] -outline-offset-1")}
                style={{ backgroundColor: s.background, color: s.text, padding: `${s.paddingY}px ${vertical ? Math.min(24, s.paddingX) : s.paddingX}px` }}
            >
                <div className="mx-auto w-full flex flex-col" style={{ maxWidth: s.maxWidth || undefined, gap: vertical ? 40 : 64 }}>
                    {s.showHeader && (
                        <div className="grid items-start" style={{ gridTemplateColumns: vertical ? 'minmax(0, 1fr)' : 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: vertical ? 20 : 64 }}>
                            <div style={reveal(0)}>
                                <Editable as="h2" value={s.title} editable={editable} onSave={(title) => setSettings({ title })}
                                    className="leading-[0.98] tracking-[-0.045em]" style={{ fontSize: vertical ? 44 : 72, fontWeight: 800, fontStyle: 'italic', color: s.text }} />
                            </div>
                            <div style={reveal(1)} className={vertical ? '' : 'pt-3'}>
                                <Editable as="p" value={s.description} editable={editable} onSave={(description) => setSettings({ description })}
                                    className="text-[16px] leading-relaxed max-w-[420px]" style={{ color: s.muted }} />
                            </div>
                        </div>
                    )}

                    {/* The cards */}
                    <div className={cn("flex w-full", vertical ? "flex-col" : "flex-row")} style={{ gap: s.gap, height: vertical ? undefined : s.height }}>
                        {colors.map((c, i) => {
                            const open = i === current
                            const hex = normalizeHex(c.hex)
                            const isGradient = !!c.gradient?.length
                            // A gradient card can go from light to dark: the top and the bottom each get a readable ink
                            const ink = textOn(isGradient ? c.gradient![c.gradient!.length - 1] : hex)
                            const topInk = textOn(isGradient ? c.gradient![0] : hex)
                            const number = String(i + 1).padStart(2, '0')
                            const code = isGradient ? c.gradient!.map(normalizeHex).join(' → ') : hex
                            return (
                                <div
                                    key={c.id}
                                    style={{
                                        ...reveal(2 + i),
                                        flex: vertical ? undefined : open ? '1 1 0%' : `0 0 ${s.collapsedWidth}px`,
                                        height: vertical ? (open ? Math.round(s.height * 0.85) : 76) : '100%',
                                        // Opening / closing, plus the entrance of the card
                                        transition: [`flex 650ms ${EASE}`, `height 650ms ${EASE}`, reveal(2 + i).transition].filter(Boolean).join(', '),
                                    }}
                                    className="relative min-w-0"
                                    {...(isReadOnly ? {} : cardBind(c.id))}
                                    onMouseEnter={(e) => {
                                        if (!isReadOnly) cardBind(c.id).onMouseEnter()
                                        if (s.openOnHover && !vertical) setActive(i)
                                        e.stopPropagation()
                                    }}
                                    onClick={() => setActive(i)}
                                >
                                    <div
                                        className={cn("relative w-full h-full overflow-hidden flex flex-col justify-between", !isReadOnly && cardHover === c.id && "outline outline-2 outline-[#FF0054]/70 outline-offset-2")}
                                        style={{
                                            background: cardBackground(c),
                                            borderRadius: s.radius,
                                            padding: open ? (vertical ? 22 : 30) : vertical ? '0 22px' : '22px 18px',
                                            color: ink,
                                            boxShadow: open ? '0 30px 60px -30px rgba(0,0,0,0.35)' : undefined,
                                            transition: `padding 500ms ${EASE}, box-shadow 500ms ${EASE}`,
                                            cursor: open ? 'default' : 'pointer',
                                            border: hex === normalizeHex(s.background) ? '1px solid rgba(0,0,0,0.08)' : undefined,
                                        }}
                                    >
                                        {open ? (
                                            <>
                                                <div className="flex items-start justify-between gap-4">
                                                    <span style={{ ...mono, color: topInk, opacity: 0.7 }}>{number}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => copyCode(code, e)}
                                                        title={`Copiar ${code}`}
                                                        className="rounded-sm hover:opacity-70 transition-opacity text-right"
                                                        style={{ fontFamily: MONO, fontSize: vertical ? 16 : 22, letterSpacing: '0.04em', color: topInk }}
                                                    >
                                                        {code}
                                                    </button>
                                                </div>
                                                {!vertical && (
                                                    <span className="absolute right-7 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center" style={{ border: `1.5px solid ${ink}`, opacity: 0.8 }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ink }} />
                                                    </span>
                                                )}
                                                <ColorDetails color={c} colors={colors} s={s} ink={ink} visible={shown} editable={editable} onChange={(patch) => setColor(c.id, patch)} />
                                            </>
                                        ) : vertical ? (
                                            <div className="h-full flex items-center justify-between">
                                                <span className="text-[18px] font-bold">{c.name}</span>
                                                <span style={{ ...mono, color: ink, opacity: 0.7 }}>{number}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{ ...mono, color: topInk, opacity: 0.6 }}>{number}</span>
                                                {/* Name read bottom-up, like a book spine */}
                                                <span className="font-bold text-[18px] whitespace-nowrap self-start" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{c.name}</span>
                                            </>
                                        )}
                                    </div>

                                    {!isReadOnly && cardHover === c.id && !showSettings && (
                                        <FloatingPanel placement="top-center" offset={8} panelProps={{ ...cardBind(c.id), onClick: (e) => e.stopPropagation() }}>
                                            <AccordionCardBar
                                                color={c}
                                                index={i}
                                                count={colors.length}
                                                onChange={(patch) => setColor(c.id, patch)}
                                                onSettings={() => { onSelect?.(block.id); setActive(i); setCardHover(null); setShowSettings(true) }}
                                                onMove={(dir) => {
                                                    const j = i + dir
                                                    if (j < 0 || j >= colors.length) return
                                                    const next = [...colors]
                                                    ;[next[i], next[j]] = [next[j], next[i]]
                                                    setColors(next)
                                                    setActive(j)
                                                }}
                                                onDuplicate={() => setColors([...colors.slice(0, i + 1), { ...c, id: accordionColorId(), name: `${c.name} 2` }, ...colors.slice(i + 1)])}
                                                onDelete={() => { setCardHover(null); setColors(colors.filter(x => x.id !== c.id)); setActive(0) }}
                                            />
                                        </FloatingPanel>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Usage */}
                    {s.showUsage && usageTotal > 0 && (
                        <div className="flex flex-col gap-3" style={reveal(2 + colors.length)}>
                            <span style={{ ...mono, color: s.muted }}>{s.usageTitle}</span>
                            <div className="flex w-full h-11 gap-1.5">
                                {colors.filter(c => (c.usage || 0) > 0).map(c => {
                                    const ink = textOn(c.gradient?.length ? c.gradient[c.gradient.length - 1] : c.hex)
                                    return (
                                        <div
                                            key={c.id}
                                            className="h-full rounded-full flex items-center px-4 min-w-0 overflow-hidden"
                                            style={{
                                                background: cardBackground(c),
                                                flex: `${c.usage} 1 0%`,
                                                color: ink,
                                                border: normalizeHex(c.hex) === normalizeHex(s.background) ? '1px solid rgba(0,0,0,0.08)' : undefined,
                                                transform: shown || s.reveal === 'none' ? 'scaleX(1)' : 'scaleX(0)',
                                                transformOrigin: 'left',
                                                transition: `transform 1100ms ${EASE} ${(3 + colors.length) * s.stagger}ms`,
                                            }}
                                        >
                                            <span className="truncate" style={{ ...mono, fontSize: 9, fontWeight: 700 }}>{c.usage}% {c.name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {showBlockBar && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Paleta em acordeão"
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
                    <ColorAccordionPanel
                        content={{ ...content, colors }}
                        brandColorCount={palette.length}
                        resolved={s}
                        activeIndex={current}
                        onActiveIndex={setActive}
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
