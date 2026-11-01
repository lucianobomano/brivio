"use client"

/**
 * Free movement tools of a column (Column settings → "Movimento livre"):
 * - selection of blocks: click a block's handle, Shift/Ctrl/⌘ + click adds or removes it;
 * - group drag of the selection, smart guides that snap to the other blocks and to the column
 *   (edges and centres), Shift locks the movement to one axis, Alt moves without snapping;
 * - an alignment bar under the selection: align left / centre / right / top / middle / bottom,
 *   distribute the spacing, reset the position. One block aligns to the column, several to each other.
 * Blocks keep their place in the column's flow; moving them changes their offset (block.position).
 */

import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
    AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, RotateCcw, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type Offset = { x: number, y: number }
type Rect = { left: number, top: number, right: number, bottom: number }
type Guide = { x1: number, y1: number, x2: number, y2: number }

const SNAP = 6 // px on screen

interface FreeFlowValue {
    selection: string[]
    isSelected: (id: string) => boolean
    select: (id: string, additive: boolean) => void
    clear: () => void
    /** Offsets being dragged right now (screen px, scaled back when committed) */
    dragging: { ids: string[], dx: number, dy: number } | null
    startDrag: (id: string, e: React.PointerEvent) => void
    nudge: (id: string, dx: number, dy: number) => void
}

const FreeFlowContext = createContext<FreeFlowValue | null>(null)
export const useFreeFlow = () => useContext(FreeFlowContext)

// ---------------------------------------------------------------------------------------------
// Measuring what is actually visible in a block (its wrapper always spans the whole column)
// ---------------------------------------------------------------------------------------------

const MEDIA = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'IFRAME', 'PICTURE', 'INPUT', 'TEXTAREA', 'SELECT'])

const union = (rects: Rect[]): Rect | null => rects.length === 0 ? null : rects.reduce((a, r) => ({
    left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom),
}))

const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })

/** The box around a block's visible content: its text, media and anything with a background or border */
export const visibleRect = (wrapper: HTMLElement): Rect => {
    const out: Rect[] = []
    let budget = 600
    const visit = (node: Node) => {
        if (budget-- <= 0) return
        if (node.nodeType === Node.TEXT_NODE) {
            if (!node.textContent?.trim()) return
            const range = document.createRange()
            range.selectNodeContents(node)
            for (const r of Array.from(range.getClientRects())) if (r.width > 0 && r.height > 0) out.push(toRect(r))
            return
        }
        if (!(node instanceof Element)) return
        if (node.hasAttribute('data-free-handle') || node.hasAttribute('data-free-chrome')) return
        const r = node.getBoundingClientRect()
        if (r.width === 0 && r.height === 0 && node.children.length === 0) return
        const cs = getComputedStyle(node)
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return
        if (MEDIA.has(node.tagName.toUpperCase())) { out.push(toRect(r)); return }
        const paints = (cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor))
            || cs.backgroundImage !== 'none'
            || parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) + parseFloat(cs.borderBottomWidth) > 0
        if (paints && r.width > 0 && r.height > 0) { out.push(toRect(r)); return }
        node.childNodes.forEach(visit)
    }
    wrapper.childNodes.forEach(visit)
    return union(out) ?? toRect(wrapper.getBoundingClientRect())
}

/** Layout px per screen px (the canvas can be zoomed) */
const scaleOf = (el: HTMLElement) => {
    const w = el.getBoundingClientRect().width
    return el.offsetWidth > 0 && w > 0 ? w / el.offsetWidth : 1
}

// ---------------------------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------------------------

interface FreeFlowScopeProps {
    enabled: boolean
    /** Current offsets of the column's blocks */
    positions: Record<string, Offset>
    /** Saves several offsets at once (one undo step) */
    onMove: (positions: Record<string, Offset>) => void
    children: (areaProps: { 'data-free-flow-area': string, ref: React.Ref<HTMLDivElement> }) => React.ReactNode
    id: string
}

export const FreeFlowScope = ({ enabled, positions, onMove, children, id }: FreeFlowScopeProps) => {
    const areaRef = useRef<HTMLDivElement>(null)
    const [selection, setSelection] = useState<string[]>([])
    const [dragging, setDragging] = useState<FreeFlowValue['dragging']>(null)
    const [guides, setGuides] = useState<Guide[]>([])
    const positionsRef = useRef(positions)
    const onMoveRef = useRef(onMove)
    useLayoutEffect(() => { positionsRef.current = positions; onMoveRef.current = onMove })

    // Blocks removed from the column leave the selection
    const ids = Object.keys(positions).join('|')
    const [seenIds, setSeenIds] = useState(ids)
    if (seenIds !== ids) {
        setSeenIds(ids)
        setSelection(sel => sel.filter(s => s in positions))
    }

    const blockEl = useCallback((blockId: string) =>
        areaRef.current?.querySelector<HTMLElement>(`[data-free-block="${CSS.escape(blockId)}"]`) ?? null, [])

    /** Blocks of this column only (not of columns nested in it) */
    const columnBlocks = useCallback(() => {
        const area = areaRef.current
        if (!area) return [] as HTMLElement[]
        return Array.from(area.querySelectorAll<HTMLElement>('[data-free-block]'))
            .filter(el => el.closest('[data-free-flow-area]') === area)
    }, [])

    const select = useCallback((blockId: string, additive: boolean) => {
        setSelection(sel => additive ? (sel.includes(blockId) ? sel.filter(s => s !== blockId) : [...sel, blockId]) : [blockId])
    }, [])
    const clear = useCallback(() => setSelection([]), [])

    // Clicking elsewhere or Esc clears the selection
    useEffect(() => {
        if (!enabled || selection.length === 0) return
        const onDown = (e: PointerEvent) => {
            const t = e.target as Element | null
            if (t?.closest('[data-free-handle], [data-free-toolbar]')) return
            setSelection([])
        }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelection([]) }
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey) }
    }, [enabled, selection.length])

    /** New offsets for blocks moved by (dx, dy) screen px */
    const commit = useCallback((moved: Record<string, { dx: number, dy: number }>) => {
        const area = areaRef.current
        const scale = area ? scaleOf(area) : 1
        const next: Record<string, Offset> = {}
        for (const [blockId, d] of Object.entries(moved)) {
            if (Math.abs(d.dx) < 0.01 && Math.abs(d.dy) < 0.01) continue
            const p = positionsRef.current[blockId] ?? { x: 0, y: 0 }
            next[blockId] = { x: Math.round((p.x + d.dx / scale) * 10) / 10, y: Math.round((p.y + d.dy / scale) * 10) / 10 }
        }
        if (Object.keys(next).length) onMoveRef.current(next)
    }, [])

    const startDrag = useCallback((blockId: string, e: React.PointerEvent) => {
        const area = areaRef.current
        if (!area) return
        const additive = e.shiftKey || e.ctrlKey || e.metaKey
        const moving = selection.includes(blockId) && selection.length > 1 ? selection : [blockId]
        const startX = e.clientX, startY = e.clientY
        let started = false
        let last = { dx: 0, dy: 0 }

        // Measured once: what moves and what it can snap to
        let box: Rect | null = null
        let targets: { rect: Rect, isArea: boolean }[] = []
        const measure = () => {
            box = union(moving.map(blockEl).filter((el): el is HTMLElement => !!el).map(visibleRect))
            const all = columnBlocks().filter(el => !moving.includes(el.dataset.freeBlock || ''))
            targets = [{ rect: toRect(area.getBoundingClientRect()), isArea: true }, ...all.map(el => ({ rect: visibleRect(el), isArea: false }))]
        }

        const onMoveEv = (ev: PointerEvent) => {
            let dx = ev.clientX - startX, dy = ev.clientY - startY
            if (!started) {
                if (Math.hypot(dx, dy) < 3) return
                started = true
                measure()
            }
            // Shift: keep to the axis with the larger movement
            const lock = ev.shiftKey ? (Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y') : null
            if (lock === 'x') dy = 0
            if (lock === 'y') dx = 0

            const found: Guide[] = []
            if (box && !ev.altKey) {
                const b = box as Rect
                const snapAxis = (axis: 'x' | 'y', d: number) => {
                    const lo = axis === 'x' ? b.left + d : b.top + d
                    const hi = axis === 'x' ? b.right + d : b.bottom + d
                    const mine = [lo, (lo + hi) / 2, hi]
                    let best: { delta: number, at: number } | null = null
                    for (const t of targets) {
                        const tl = axis === 'x' ? t.rect.left : t.rect.top
                        const th = axis === 'x' ? t.rect.right : t.rect.bottom
                        for (const line of [tl, (tl + th) / 2, th]) for (const m of mine) {
                            const delta = line - m
                            if (Math.abs(delta) <= SNAP && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, at: line }
                        }
                    }
                    return best
                }
                const sx = lock === 'y' ? null : snapAxis('x', dx)
                const sy = lock === 'x' ? null : snapAxis('y', dy)
                if (sx) dx += sx.delta
                if (sy) dy += sy.delta
                const moved: Rect = { left: b.left + dx, right: b.right + dx, top: b.top + dy, bottom: b.bottom + dy }
                // A line for every edge or centre that now matches, from the moved block to what it matches
                const lines = (axis: 'x' | 'y') => {
                    const mine = axis === 'x' ? [moved.left, (moved.left + moved.right) / 2, moved.right] : [moved.top, (moved.top + moved.bottom) / 2, moved.bottom]
                    for (const m of mine) {
                        const hits = targets.filter(t => {
                            const tl = axis === 'x' ? t.rect.left : t.rect.top
                            const th = axis === 'x' ? t.rect.right : t.rect.bottom
                            return [tl, (tl + th) / 2, th].some(v => Math.abs(v - m) < 0.5)
                        })
                        if (!hits.length) continue
                        const span = union([moved, ...hits.map(h => h.rect)])!
                        found.push(axis === 'x' ? { x1: m, x2: m, y1: span.top, y2: span.bottom } : { y1: m, y2: m, x1: span.left, x2: span.right })
                    }
                }
                if (sx) lines('x')
                if (sy) lines('y')
            }
            last = { dx, dy }
            setDragging({ ids: moving, dx, dy })
            setGuides(found)
        }
        const onUp = () => {
            window.removeEventListener('pointermove', onMoveEv)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)
            setGuides([])
            setDragging(null)
            if (started) {
                commit(Object.fromEntries(moving.map(m => [m, last])))
            } else {
                // A click: select (Shift / Ctrl / ⌘ adds or removes)
                select(blockId, additive)
            }
        }
        window.addEventListener('pointermove', onMoveEv)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
    }, [selection, blockEl, columnBlocks, commit, select])

    const nudge = useCallback((blockId: string, dx: number, dy: number) => {
        const area = areaRef.current
        const scale = area ? scaleOf(area) : 1
        const moving = selection.includes(blockId) ? selection : [blockId]
        commit(Object.fromEntries(moving.map(m => [m, { dx: dx * scale, dy: dy * scale }])))
    }, [selection, commit])

    // ---------- align / distribute ----------
    type Mode = 'left' | 'hcenter' | 'right' | 'top' | 'vmiddle' | 'bottom' | 'hspace' | 'vspace'
    const align = (mode: Mode) => {
        const area = areaRef.current
        if (!area) return
        const items = selection.map(s => ({ id: s, el: blockEl(s) })).filter((i): i is { id: string, el: HTMLElement } => !!i.el)
            .map(i => ({ id: i.id, r: visibleRect(i.el) }))
        if (!items.length) return
        // One block aligns to the column, several to each other
        const bounds = items.length === 1 ? toRect(area.getBoundingClientRect()) : union(items.map(i => i.r))!
        const moved: Record<string, { dx: number, dy: number }> = {}
        if (mode === 'hspace' || mode === 'vspace') {
            const h = mode === 'hspace'
            const sorted = [...items].sort((a, b) => h ? a.r.left - b.r.left : a.r.top - b.r.top)
            const size = (r: Rect) => h ? r.right - r.left : r.bottom - r.top
            const span = h ? bounds.right - bounds.left : bounds.bottom - bounds.top
            const gap = (span - sorted.reduce((s, i) => s + size(i.r), 0)) / (sorted.length - 1)
            let cursor = h ? bounds.left : bounds.top
            for (const i of sorted) {
                const d = cursor - (h ? i.r.left : i.r.top)
                moved[i.id] = h ? { dx: d, dy: 0 } : { dx: 0, dy: d }
                cursor += size(i.r) + gap
            }
        } else {
            for (const i of items) {
                const r = i.r
                const dx = mode === 'left' ? bounds.left - r.left
                    : mode === 'right' ? bounds.right - r.right
                    : mode === 'hcenter' ? (bounds.left + bounds.right) / 2 - (r.left + r.right) / 2 : 0
                const dy = mode === 'top' ? bounds.top - r.top
                    : mode === 'bottom' ? bounds.bottom - r.bottom
                    : mode === 'vmiddle' ? (bounds.top + bounds.bottom) / 2 - (r.top + r.bottom) / 2 : 0
                moved[i.id] = { dx, dy }
            }
        }
        commit(moved)
    }
    const resetPosition = () => {
        const next = Object.fromEntries(selection.map(s => [s, { x: 0, y: 0 }]))
        onMoveRef.current(next)
    }

    const value = useMemo<FreeFlowValue>(() => ({
        selection, isSelected: (s) => selection.includes(s), select, clear, dragging, startDrag, nudge,
    }), [selection, select, clear, dragging, startDrag, nudge])

    if (!enabled) return <>{children({ 'data-free-flow-area': id, ref: areaRef })}</>

    return (
        <FreeFlowContext.Provider value={value}>
            {children({ 'data-free-flow-area': id, ref: areaRef })}
            {guides.length > 0 && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 pointer-events-none z-[9998]">
                    {guides.map((g, i) => (
                        <div
                            key={i}
                            className="absolute bg-[#FF0054]"
                            style={g.x1 === g.x2
                                ? { left: g.x1 - 0.5, top: g.y1, width: 1, height: Math.max(1, g.y2 - g.y1) }
                                : { left: g.x1, top: g.y1 - 0.5, width: Math.max(1, g.x2 - g.x1), height: 1 }}
                        />
                    ))}
                </div>,
                document.body
            )}
            {selection.length > 0 && !dragging && (
                <AlignBar
                    getRect={() => union(selection.map(blockEl).filter((el): el is HTMLElement => !!el).map(visibleRect))}
                    count={selection.length}
                    onAlign={align}
                    onReset={resetPosition}
                    onClose={clear}
                    watch={positions}
                />
            )}
        </FreeFlowContext.Provider>
    )
}

// ---------------------------------------------------------------------------------------------
// Alignment bar (under the selection, so it never covers the block's own toolbar above it)
// ---------------------------------------------------------------------------------------------

type AlignBarProps = {
    getRect: () => Rect | null
    count: number
    onAlign: (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vmiddle' | 'bottom' | 'hspace' | 'vspace') => void
    onReset: () => void
    onClose: () => void
    watch: unknown
}

const Btn = ({ title, onClick, disabled, children }: { title: string, onClick: () => void, disabled?: boolean, children: React.ReactNode }) => (
    <button
        type="button"
        title={title}
        aria-label={title}
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className="w-8 h-8 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
        {children}
    </button>
)

const AlignBar = ({ getRect, count, onAlign, onReset, onClose, watch }: AlignBarProps) => {
    const [pos, setPos] = useState<{ left: number, top: number } | null>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const getRectRef = useRef(getRect)
    useLayoutEffect(() => { getRectRef.current = getRect })

    useLayoutEffect(() => {
        let raf = 0
        const place = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                const r = getRectRef.current()
                const w = barRef.current?.offsetWidth ?? 320
                const h = barRef.current?.offsetHeight ?? 36
                if (!r) return setPos(null)
                const below = r.bottom + 10
                const top = below + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 10) : below
                const left = Math.min(Math.max(8, (r.left + r.right) / 2 - w / 2), window.innerWidth - w - 8)
                setPos(p => p && Math.abs(p.left - left) < 0.5 && Math.abs(p.top - top) < 0.5 ? p : { left, top })
            })
        }
        place()
        window.addEventListener('scroll', place, true)
        window.addEventListener('resize', place)
        return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
    }, [count, watch])

    const single = count === 1

    return createPortal(
        <div
            ref={barRef}
            data-free-toolbar
            data-floating-panel
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
                "fixed z-[9999] flex items-center gap-0.5 p-1 rounded-lg bg-[#16171C] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
                pos ? "opacity-100" : "opacity-0"
            )}
            style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
        >
            <span className="px-2 text-[11px] font-medium text-white/60 whitespace-nowrap">
                {single ? 'Na coluna' : `${count} blocos`}
            </span>
            <span className="w-px h-5 bg-white/10 mx-0.5" />
            <Btn title={single ? 'Alinhar à esquerda da coluna' : 'Alinhar à esquerda'} onClick={() => onAlign('left')}><AlignStartVertical className="w-4 h-4" /></Btn>
            <Btn title={single ? 'Centrar na coluna (horizontal)' : 'Centrar na horizontal'} onClick={() => onAlign('hcenter')}><AlignCenterVertical className="w-4 h-4" /></Btn>
            <Btn title={single ? 'Alinhar à direita da coluna' : 'Alinhar à direita'} onClick={() => onAlign('right')}><AlignEndVertical className="w-4 h-4" /></Btn>
            <span className="w-px h-5 bg-white/10 mx-0.5" />
            <Btn title={single ? 'Alinhar ao topo da coluna' : 'Alinhar ao topo'} onClick={() => onAlign('top')}><AlignStartHorizontal className="w-4 h-4" /></Btn>
            <Btn title={single ? 'Centrar na coluna (vertical)' : 'Centrar na vertical'} onClick={() => onAlign('vmiddle')}><AlignCenterHorizontal className="w-4 h-4" /></Btn>
            <Btn title={single ? 'Alinhar ao fundo da coluna' : 'Alinhar ao fundo'} onClick={() => onAlign('bottom')}><AlignEndHorizontal className="w-4 h-4" /></Btn>
            <span className="w-px h-5 bg-white/10 mx-0.5" />
            <Btn title="Distribuir na horizontal (espaços iguais, 3 ou mais blocos)" disabled={count < 3} onClick={() => onAlign('hspace')}><AlignHorizontalSpaceBetween className="w-4 h-4" /></Btn>
            <Btn title="Distribuir na vertical (espaços iguais, 3 ou mais blocos)" disabled={count < 3} onClick={() => onAlign('vspace')}><AlignVerticalSpaceBetween className="w-4 h-4" /></Btn>
            <span className="w-px h-5 bg-white/10 mx-0.5" />
            <Btn title="Repor a posição original" onClick={onReset}><RotateCcw className="w-4 h-4" /></Btn>
            <Btn title="Fechar (Esc)" onClick={onClose}><X className="w-4 h-4" /></Btn>
        </div>,
        document.body
    )
}
