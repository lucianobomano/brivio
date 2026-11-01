"use client"

import React from "react"
import { Check, X } from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { LogoMisusePanel } from "./LogoMisusePanel"
import { MisuseCardBar } from "./MisuseCardBar"
import { useLogoUpload } from "./LogoShowcasePanel"
import { LOGO_FONTS } from "./logoShowcase"
import {
    misuseAspect, misuseCardId, misuseLogo, readLogoMisuseContent, resolveLogoMisuseSettings,
    type LogoMisuseContent, type MisuseCard,
} from "./logoMisuse"

interface LogoMisuseBlockProps {
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

type Resolved = ReturnType<typeof resolveLogoMisuseSettings>

const BUSY_BACKGROUND = 'repeating-linear-gradient(135deg, #FF0054 0 9px, #FFD600 9px 18px, #00C2FF 18px 27px, #06D6A0 27px 36px)'
const ODD_GRADIENT = 'linear-gradient(135deg, #FFD600, #00C2FF 50%, #7CFF6B)'

/** The logo with the card's effect applied (or the card's own picture) */
const MisuseLogo = ({ card, logo, size }: { card: MisuseCard, logo: string, size: number }) => {
    if (card.image) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={card.image} alt="" draggable={false} className="max-w-[86%] max-h-[86%] object-contain select-none" />
    }
    const box: React.CSSProperties = { width: size, height: size }
    const color = card.color || '#00D84A'
    // Recolouring any logo: its shape as a mask over a colour
    const masked = (background: string, style: React.CSSProperties = {}) => (
        <div
            style={{
                ...box,
                background,
                WebkitMaskImage: `url("${logo}")`, maskImage: `url("${logo}")`,
                WebkitMaskSize: 'contain', maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center', maskPosition: 'center',
                ...style,
            }}
        />
    )
    const img = (style: React.CSSProperties = {}) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" draggable={false} className="object-contain select-none" style={{ ...box, ...style }} />
    )
    const o = 1.5
    switch (card.effect) {
        case 'stretch': return img({ transform: 'scale(1.65, 0.62)' })
        case 'squash': return img({ transform: 'scale(0.6, 1.45)' })
        case 'rotate': return img({ transform: `rotate(${card.angle ?? 18}deg)` })
        case 'skew': return img({ transform: `skewX(${card.angle ?? -18}deg)` })
        case 'recolor': return masked(color)
        case 'lowContrast': return masked(card.color || '#2C2C31')
        case 'gradient': return masked(ODD_GRADIENT)
        case 'shadow': return img({ filter: 'drop-shadow(5px 7px 5px rgba(0,0,0,0.75))' })
        case 'glow': return img({ filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 12px ${color})` })
        case 'outline': return img({ filter: `drop-shadow(${o}px 0 0 ${color}) drop-shadow(-${o}px 0 0 ${color}) drop-shadow(0 ${o}px 0 ${color}) drop-shadow(0 -${o}px 0 ${color})` })
        case 'crop': return img({ transform: 'translate(38%, 34%) scale(2.3)' })
        case 'blur': return img({ filter: 'blur(2.5px)' })
        case 'transparent': return img({ opacity: 0.25 })
        default: return img()
    }
}

/** Text edited in place in the editor (saved when it loses focus) */
const Editable = ({ value, editable, onSave, className, style, as: Tag = 'span', placeholder }: {
    value: string, editable: boolean, onSave: (v: string) => void, className?: string, style?: React.CSSProperties
    as?: 'span' | 'h3' | 'p', placeholder?: string
}) => editable ? (
    <Tag
        key={value}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-placeholder={placeholder}
        className={cn(className, "outline-none rounded-sm focus:ring-1 focus:ring-[#FF0054]/60 cursor-text empty:before:content-[attr(data-placeholder)] empty:before:opacity-40")}
        style={style}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
            if (e.key === 'Escape') { e.currentTarget.textContent = value; e.currentTarget.blur() }
        }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => { const next = e.currentTarget.textContent || ''; if (next !== value) onSave(next) }}
    >
        {value}
    </Tag>
) : <Tag className={className} style={style}>{value}</Tag>

const Badge = ({ kind, s }: { kind: MisuseCard['kind'], s: Resolved }) => {
    const color = kind === 'do' ? s.doColor : s.dontColor
    return (
        <span
            className="absolute left-3 top-3 z-10 h-6 pl-1 pr-2.5 rounded-full inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ fontFamily: LOGO_FONTS.mono, color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
        >
            <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                {kind === 'do' ? <Check className="w-2.5 h-2.5 text-black" strokeWidth={3.5} /> : <X className="w-2.5 h-2.5 text-black" strokeWidth={3.5} />}
            </span>
            {kind === 'do' ? s.doLabel : s.dontLabel}
        </span>
    )
}

export const LogoMisuseBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: LogoMisuseBlockProps) => {
    const content: LogoMisuseContent = readLogoMisuseContent(block.content)
    const s = resolveLogoMisuseSettings(content.settings)
    const logo = misuseLogo(s)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = React.useState(false)
    const editable = !isReadOnly
    const upload = useLogoUpload(block.id)

    // The card under the pointer (or whose look panel is open) shows its own context bar instead of the block's
    const [cardHover, setCardHover] = React.useState<string | null>(null)
    const [cardPanel, setCardPanel] = React.useState<string | null>(null)
    const cardTimer = React.useRef<number | null>(null)
    React.useEffect(() => () => { if (cardTimer.current) window.clearTimeout(cardTimer.current) }, [])
    React.useEffect(() => { if (activeBlockId !== block.id) setCardPanel(null) }, [activeBlockId, block.id])
    const cardBind = (id: string) => ({
        onMouseEnter: () => {
            if (cardTimer.current) window.clearTimeout(cardTimer.current)
            setCardHover(id)
            setCardPanel(open => open && open !== id ? null : open)
        },
        onMouseLeave: () => {
            if (cardTimer.current) window.clearTimeout(cardTimer.current)
            cardTimer.current = window.setTimeout(() => setCardHover(h => h === id ? null : h), 220)
        },
    })
    const activeCard = isReadOnly ? null : (cardPanel || cardHover)

    // Fewer columns when the block is narrow
    const gridRef = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(0)
    React.useEffect(() => {
        const el = gridRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setWidth(el.clientWidth))
        ro.observe(el)
        setWidth(el.clientWidth)
        return () => ro.disconnect()
    }, [])
    const minCard = s.layout === 'list' ? 300 : 190
    const columns = width ? Math.max(1, Math.min(s.columns, Math.floor((width + s.gap) / (minCard + s.gap)))) : s.columns

    const save = (next: LogoMisuseContent) => onUpdate(block.id, { ...block.content, cards: next.cards, settings: next.settings })
    const setSettings = (patch: Partial<LogoMisuseContent['settings']>) => save({ ...content, settings: { ...content.settings, ...patch } })
    const setCaption = (id: string, caption: string) => save({ ...content, cards: content.cards.map(c => c.id === id ? { ...c, caption } : c) })
    const setCards = (cards: MisuseCard[]) => save({ ...content, cards })
    const setCard = (id: string, patch: Partial<MisuseCard>) => setCards(content.cards.map(c => c.id === id ? { ...c, ...patch } : c))
    const moveCard = (index: number, direction: -1 | 1) => {
        const j = index + direction
        if (j < 0 || j >= content.cards.length) return
        const next = [...content.cards]
        ;[next[index], next[j]] = [next[j], next[index]]
        setCards(next)
    }

    const always = s.markOn === 'always'
    const markVisibility = always ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
    // Card shape: a ratio (whole card in "Cartões", the image otherwise) or a fixed image height
    const aspect = misuseAspect(s)
    const aspectNumber = aspect ? (() => { const [w, h] = aspect.split('/').map(Number); return w / h })() : 1.35

    const preview = (card: MisuseCard) => {
        const dont = card.kind === 'dont'
        const cs = card.style || {}
        const size = s.logoSize * ((cs.logoScale ?? 100) / 100)
        const sized: React.CSSProperties =
            s.layout === 'list' ? { height: s.previewHeight, width: Math.round(s.previewHeight * aspectNumber) }
            : s.layout === 'tiles' && aspect ? { aspectRatio: aspect }
            : s.layout === 'cards' && aspect ? { flex: '1 1 0%', minHeight: 0 }
            : { height: s.previewHeight }
        return (
            <div
                className={cn("relative w-full overflow-hidden flex items-center justify-center shrink-0 transition-colors duration-200", s.layout === 'tiles' && s.mark !== 'none' && "group-hover/card:![border-color:var(--mark)]")}
                style={{
                    ...sized,
                    background: !card.image && card.effect === 'busy' ? BUSY_BACKGROUND : (cs.previewBackground || s.previewBackground),
                    borderRadius: s.layout === 'cards' ? 0 : (cs.radius ?? s.radius),
                    border: s.layout === 'tiles' ? `1px solid ${cs.borderColor || s.borderColor}` : undefined,
                }}
            >
                <MisuseLogo card={card} logo={logo} size={size} />

                {dont && s.mark === 'cross' && (
                    <svg
                        className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-200", markVisibility)}
                        width={size * 2.9} height={size * 1.25} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden
                    >
                        <path d="M0 0 L100 100 M100 0 L0 100" stroke={s.dontColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                )}
                {dont && s.mark === 'slash' && (
                    <svg className={cn("absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200", markVisibility)} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                        <path d="M0 100 L100 0" stroke={s.dontColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                )}
                {(s.mark === 'badge' || (!dont && s.mark !== 'none')) && (
                    <div className={cn("transition-opacity duration-200", s.mark === 'badge' && !always ? markVisibility : 'opacity-100')}>
                        <Badge kind={card.kind} s={s} />
                    </div>
                )}
            </div>
        )
    }

    const caption = (card: MisuseCard, index: number) => (
        <div className="flex flex-col gap-1.5 min-w-0">
            {s.numbered && (
                <span className="text-[11px] font-bold tracking-[0.12em]" style={{ fontFamily: LOGO_FONTS.mono, color: card.kind === 'do' ? s.doColor : s.dontColor }}>
                    {String(index + 1).padStart(2, '0')}
                </span>
            )}
            {s.showCaptions && (
                <Editable
                    value={card.caption}
                    editable={editable}
                    onSave={(v) => setCaption(card.id, v)}
                    placeholder="Descrição"
                    className="leading-snug"
                    style={{ fontSize: s.captionSize, color: card.style?.captionColor || s.captionColor }}
                />
            )}
        </div>
    )

    const cardBar = (card: MisuseCard, index: number) => !isReadOnly && activeCard === card.id && !showSettings && (
        <FloatingPanel placement="top-center" offset={8} panelProps={{ ...cardBind(card.id), onClick: (e) => e.stopPropagation() }}>
            <MisuseCardBar
                card={card}
                index={index}
                count={content.cards.length}
                s={s}
                open={cardPanel === card.id}
                onOpenChange={(open) => setCardPanel(open ? card.id : null)}
                onChange={(patch) => setCard(card.id, patch)}
                onMove={(direction) => moveCard(index, direction)}
                onDuplicate={() => setCards([...content.cards.slice(0, index + 1), { ...card, id: misuseCardId() }, ...content.cards.slice(index + 1)])}
                onDelete={() => { setCardPanel(null); setCardHover(null); setCards(content.cards.filter(c => c.id !== card.id)) }}
                onUpload={async (file) => { const url = await upload(file); if (url) setCard(card.id, { image: url }) }}
            />
        </FloatingPanel>
    )

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
                className={cn("w-full", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-4")}
                style={{ backgroundColor: s.blockBackground || undefined, padding: s.blockPadding }}
            >
                {(s.showTitle || s.showDescription) && (
                    <div className="flex flex-col gap-3" style={{ marginBottom: s.headerGap, textAlign: s.titleAlign, alignItems: s.titleAlign === 'center' ? 'center' : 'flex-start' }}>
                        {s.showTitle && (
                            <Editable
                                as="h3"
                                value={s.title}
                                editable={editable}
                                onSave={(title) => setSettings({ title })}
                                placeholder="Título"
                                className="font-semibold tracking-[-0.02em] leading-tight"
                                style={{ fontSize: s.titleSize, color: s.titleColor }}
                            />
                        )}
                        {s.showDescription && (
                            <Editable
                                as="p"
                                value={s.description}
                                editable={editable}
                                onSave={(description) => setSettings({ description })}
                                placeholder="Descrição"
                                className="max-w-[640px] leading-relaxed text-[15px]"
                                style={{ color: s.descriptionColor }}
                            />
                        )}
                    </div>
                )}

                <div
                    ref={gridRef}
                    className="grid w-full"
                    style={{
                        // Fixed card width: as many cards per row as fit; otherwise the columns share the width
                        gridTemplateColumns: s.cardWidth
                            ? `repeat(auto-fill, ${width ? Math.min(s.cardWidth, width) : s.cardWidth}px)`
                            : `repeat(${columns}, minmax(0, 1fr))`,
                        gap: s.gap,
                    }}
                >
                    {content.cards.map((card, i) => {
                        const tone = card.kind === 'do' ? s.doColor : s.dontColor
                        const cs = card.style || {}
                        const markBorder = always && s.mark !== 'none' ? tone : (cs.borderColor || s.borderColor)
                        const editing = activeCard === card.id
                        if (s.layout === 'tiles') {
                            return (
                                <div
                                    key={card.id}
                                    className={cn("group/card relative flex flex-col gap-3 min-w-0 rounded-sm", editing && "outline outline-1 outline-[#FF0054]/70 outline-offset-4")}
                                    style={{ ['--mark' as string]: tone }}
                                    {...(isReadOnly ? {} : cardBind(card.id))}
                                >
                                    {preview(card)}
                                    {caption(card, i)}
                                    {cardBar(card, i)}
                                </div>
                            )
                        }
                        return (
                            <div
                                key={card.id}
                                className={cn(
                                    "group/card relative overflow-hidden min-w-0 transition-colors duration-200",
                                    s.mark !== 'none' && "hover:![border-color:var(--mark)]",
                                    s.layout === 'list' ? "flex items-stretch" : "flex flex-col",
                                    editing && "outline outline-1 outline-[#FF0054]/70 outline-offset-2"
                                )}
                                style={{
                                    ['--mark' as string]: tone,
                                    backgroundColor: cs.captionBackground || s.cardBackground,
                                    border: `1px solid ${markBorder}`,
                                    borderRadius: cs.radius ?? s.radius,
                                    aspectRatio: s.layout === 'cards' ? aspect : undefined,
                                }}
                                {...(isReadOnly ? {} : cardBind(card.id))}
                            >
                                {preview(card)}
                                {(s.showCaptions || s.numbered) && (
                                    <div
                                        className={cn(s.layout === 'list' ? "flex-1 flex items-center px-5 py-4" : aspect ? "shrink-0 px-4 py-4" : "flex-1 px-4 py-4")}
                                        style={{ backgroundColor: cs.captionBackground || s.captionBackground }}
                                    >
                                        {caption(card, i)}
                                    </div>
                                )}
                                {cardBar(card, i)}
                            </div>
                        )
                    })}
                </div>
            </div>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && !activeCard && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Usos incorretos"
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
                    <LogoMisusePanel
                        blockId={block.id}
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
