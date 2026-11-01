"use client"

import React from "react"
import { Settings, ArrowUp, ArrowDown, Copy, CopyPlus, Check, Trash2, Zap, Asterisk } from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { NAV_ICONS } from "../navigation/navigationPresets"
import { MarqueeSettingsPanel } from "./MarqueeSettingsPanel"
import { MARQUEE_DEFAULTS, readMarqueeContent, type MarqueeContent, type MarqueeRow, type MarqueeSettings } from "./marquee"

interface MarqueeBlockProps {
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

type Resolved = typeof MARQUEE_DEFAULTS

/** The shape or icon between two texts */
export const MarqueeSeparatorMark = ({ s }: { s: Resolved }) => {
    const size = s.separatorSize
    const color = s.separatorColor
    switch (s.separator) {
        case 'none': return null
        case 'dot': return <span className="rounded-full shrink-0" style={{ width: size, height: size, backgroundColor: color }} />
        case 'circle': return <span className="rounded-full shrink-0" style={{ width: size * 1.6, height: size * 1.6, border: `${Math.max(1.5, size / 5)}px solid ${color}` }} />
        case 'square': return <span className="shrink-0" style={{ width: size, height: size, backgroundColor: color }} />
        case 'diamond': return <span className="shrink-0 rotate-45" style={{ width: size, height: size, backgroundColor: color }} />
        case 'dash': return <span className="shrink-0 rounded-full" style={{ width: size * 3, height: Math.max(2, size / 3), backgroundColor: color }} />
        case 'slash': return <span className="shrink-0 font-light leading-none" style={{ color, fontSize: size * 4 }}>/</span>
        case 'asterisk': return <Asterisk className="shrink-0" style={{ width: size * 2.5, height: size * 2.5, color }} strokeWidth={2.5} />
        case 'star': return (
            <svg viewBox="0 0 24 24" className="shrink-0" style={{ width: size * 2.5, height: size * 2.5 }} aria-hidden>
                <path d="M12 0 C12.8 7.2 16.8 11.2 24 12 C16.8 12.8 12.8 16.8 12 24 C11.2 16.8 7.2 12.8 0 12 C7.2 11.2 11.2 7.2 12 0 Z" fill={color} />
            </svg>
        )
        case 'icon': {
            const Icon = NAV_ICONS[s.separatorIcon] || NAV_ICONS['sparkles']
            return Icon ? <Icon className="shrink-0" style={{ width: size * 2.5, height: size * 2.5, color }} /> : null
        }
        default: return null
    }
}

/** One band: the texts repeated enough times to cover the width, moving by exactly one set so the loop has no seam */
const MarqueeBand = ({ row, s, paused }: { row: MarqueeRow, s: Resolved, paused: boolean }) => {
    const viewportRef = React.useRef<HTMLDivElement>(null)
    const setRef = React.useRef<HTMLDivElement>(null)
    const [setWidth, setSetWidth] = React.useState(0)
    const [copies, setCopies] = React.useState(2)

    React.useLayoutEffect(() => {
        const viewport = viewportRef.current
        const set = setRef.current
        if (!viewport || !set) return
        const measure = () => {
            const w = set.offsetWidth
            setSetWidth(w)
            setCopies(w > 0 ? Math.max(2, Math.ceil(viewport.offsetWidth / w) + 1) : 2)
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(viewport)
        ro.observe(set)
        return () => ro.disconnect()
    }, [])

    const items = row.items.filter(t => t.trim() !== '')
    const textStyle: React.CSSProperties = {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        letterSpacing: `${s.letterSpacing / 100}em`,
        textTransform: s.uppercase ? 'uppercase' : undefined,
        color: row.outline ? 'transparent' : s.textColor,
        WebkitTextStroke: row.outline ? `${Math.max(1, s.fontSize / 60)}px ${s.textColor}` : undefined,
        lineHeight: 1.1,
    }
    const set = (key: number, ref?: React.Ref<HTMLDivElement>) => (
        <div key={key} ref={ref} className="flex items-center shrink-0" style={{ gap: s.gap, paddingRight: s.gap }} aria-hidden={key > 0}>
            {items.map((text, i) => (
                <React.Fragment key={i}>
                    <span className="whitespace-nowrap" style={textStyle}>{text}</span>
                    <MarqueeSeparatorMark s={s} />
                </React.Fragment>
            ))}
        </div>
    )

    const duration = setWidth > 0 ? setWidth / Math.max(5, s.speed) : 0
    return (
        <div ref={viewportRef} className="overflow-hidden w-full">
            {items.length === 0 ? (
                <div className="text-center text-sm opacity-50 py-2" style={{ color: s.textColor }}>Adicione textos nas definições</div>
            ) : (
                <div
                    className="marquee-track flex w-max"
                    style={{
                        ['--marquee-shift' as string]: `-${setWidth}px`,
                        animation: duration ? `marquee-x ${duration}s linear infinite` : undefined,
                        animationDirection: row.direction === 'right' ? 'reverse' : 'normal',
                        animationPlayState: paused ? 'paused' : 'running',
                    }}
                >
                    {Array.from({ length: copies }, (_, i) => set(i, i === 0 ? setRef : undefined))}
                </div>
            )}
        </div>
    )
}

/** Edge to edge: stretch over the page (nearest data-bleed-root) instead of the column */
const useBleed = (enabled: boolean, ref: React.RefObject<HTMLDivElement | null>) => {
    const [bleed, setBleed] = React.useState<{ marginLeft: number, width: number } | null>(null)
    React.useLayoutEffect(() => {
        const el = ref.current
        const parent = el?.parentElement
        if (!enabled || !el || !parent) { setBleed(null); return }
        // Only inside a page (the library previews have no page frame: the band keeps its own width there)
        const root = el.closest('[data-bleed-root]') as HTMLElement | null
        if (!root) { setBleed(null); return }
        const measure = () => {
            const r = root.getBoundingClientRect()
            const p = parent.getBoundingClientRect()
            setBleed({ marginLeft: r.left - p.left, width: r.width })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(root)
        ro.observe(parent)
        return () => ro.disconnect()
    }, [enabled, ref])
    return bleed
}

export const MarqueeBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: MarqueeBlockProps) => {
    const content: MarqueeContent = readMarqueeContent(block.content)
    const s: Resolved = { ...MARQUEE_DEFAULTS, ...Object.fromEntries(Object.entries(content.settings).filter(([, v]) => v !== undefined)) } as Resolved
    const [hovered, setHovered] = React.useState(false)
    const [showSettings, setShowSettings] = React.useState(false)
    const [copied, setCopied] = React.useState(false)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const bleed = useBleed(s.fullBleed, rootRef)

    // Hover with a short grace period, so the pointer can reach the toolbar (on the top layer)
    const hoverTimer = React.useRef<number | null>(null)
    React.useEffect(() => () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current) }, [])
    const hoverBind = {
        onMouseEnter: () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current); setHovered(true) },
        onMouseLeave: () => {
            if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
            hoverTimer.current = window.setTimeout(() => setHovered(false), 220)
        },
    }

    const update = (next: MarqueeContent) => onUpdate(block.id, { ...block.content, rows: next.rows, settings: next.settings })
    const border = `${s.borderWidth}px solid ${s.borderColor}`
    const paused = s.pauseOnHover && hovered
    const fade = s.fadeEdges ? 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' : undefined

    const toolButton = (title: string, icon: React.ReactNode, onClick?: () => void, className?: string) => (
        <button
            type="button"
            title={title}
            disabled={!onClick}
            onClick={(e) => { e.stopPropagation(); onClick?.() }}
            className={cn("w-8 h-8 rounded flex items-center justify-center text-[#97A1B3] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none", className)}
        >
            {icon}
        </button>
    )

    return (
        <div
            ref={rootRef}
            className={cn("relative w-full", !isReadOnly && "cursor-pointer")}
            style={bleed ? { width: bleed.width, marginLeft: bleed.marginLeft, maxWidth: 'none' } : undefined}
            {...hoverBind}
            onClick={(e) => {
                if (isReadOnly) return
                e.stopPropagation()
                onSelect?.(block.id)
            }}
        >
            <div
                className={cn("flex flex-col w-full transition-shadow", !isReadOnly && (hovered || showSettings) && "ring-1 ring-dashed ring-[#FF0054]")}
                style={{
                    backgroundColor: s.backgroundColor === 'transparent' ? undefined : s.backgroundColor,
                    borderTop: s.borderTop ? border : undefined,
                    borderBottom: s.borderBottom ? border : undefined,
                    WebkitMaskImage: fade,
                    maskImage: fade,
                }}
            >
                {content.rows.map((row, i) => (
                    <div
                        key={row.id}
                        style={{
                            paddingTop: i === 0 ? s.paddingY : s.rowGap,
                            paddingBottom: i === content.rows.length - 1 ? s.paddingY : s.rowGap,
                            borderTop: i > 0 && s.borderBetween ? border : undefined,
                        }}
                    >
                        <MarqueeBand row={row} s={s} paused={paused} />
                    </div>
                ))}
            </div>

            {/* Editor toolbar, on the top layer */}
            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <div className="flex items-center gap-0.5 bg-[#15161B] border border-[#333] rounded-md px-1.5 h-[40px] shadow-lg">
                        <span className="text-[#97A1B3] text-xs font-medium px-2">Texto em loop</span>
                        <div className="w-px h-4 bg-[#333] mx-1" />
                        {toolButton('Definições', <Settings className="w-4 h-4" />, () => { onSelect?.(block.id); setShowSettings(true) })}
                        {toolButton('Animar bloco', <Zap className="w-4 h-4" />, onAnimate, "hover:text-[#FF0054]")}
                        {toolButton('Mover para cima', <ArrowUp className="w-4 h-4" />, onMove ? () => onMove(block.id, 'up') : undefined)}
                        {toolButton('Mover para baixo', <ArrowDown className="w-4 h-4" />, onMove ? () => onMove(block.id, 'down') : undefined)}
                        {toolButton(copied ? 'Copiado' : 'Copiar', copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />, onCopy ? () => {
                            onCopy(block.id)
                            setCopied(true)
                            window.setTimeout(() => setCopied(false), 1500)
                        } : undefined)}
                        {toolButton('Duplicar', <CopyPlus className="w-4 h-4" />, onDuplicate ? () => onDuplicate(block.id) : undefined)}
                        {toolButton('Eliminar', <Trash2 className="w-4 h-4" />, onDelete ? () => onDelete(block.id) : undefined, "hover:text-[#FF0054]")}
                    </div>
                </FloatingPanel>
            )}

            {!isReadOnly && showSettings && (
                <FloatingPanel placement="bottom-center" offset={8}>
                    <MarqueeSettingsPanel
                        content={content}
                        resolved={s}
                        onChange={update}
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

export type { MarqueeSettings }
