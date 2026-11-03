"use client"

import { useMemo, useSyncExternalStore } from "react"
import { useBrandDesignOptional } from "./BrandDesignContext"

/**
 * Small colour squares of the editor panels: the brand palette (Settings → Colors → Brand color palette) first,
 * then the colours used most recently, then neutral defaults to fill the grid.
 * Recent colours are kept per brand in this browser (localStorage) and shared live by every panel.
 */

const MAX_RECENT = 24
const FALLBACK = [
    '#FFFFFF', '#000000', '#111827', '#6B7280', '#D1D5DB', '#FF0054', '#0042DA', '#22C55E',
    '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#14B8A6',
]

const storageKey = (brandId: string) => `brivio:recent-colors:${brandId || 'default'}`
const listeners = new Set<() => void>()
const cache = new Map<string, string[]>()
const EMPTY: string[] = []

const read = (brandId: string): string[] => {
    const key = storageKey(brandId)
    if (cache.has(key)) return cache.get(key)!
    let list: string[] = []
    try {
        const raw = window.localStorage.getItem(key)
        const parsed = raw ? JSON.parse(raw) : []
        if (Array.isArray(parsed)) list = parsed.filter((c): c is string => typeof c === 'string')
    } catch { /* storage unavailable: start empty */ }
    cache.set(key, list)
    return list
}

const normalize = (color: string) => {
    const c = color.trim()
    if (/^#[0-9a-f]{3}$/i.test(c)) return ('#' + c.slice(1).split('').map(x => x + x).join('')).toUpperCase()
    return /^#[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : null
}

const commit = (brandId: string, color: string) => {
    const hex = normalize(color)
    if (!hex) return
    const key = storageKey(brandId)
    const next = [hex, ...read(brandId).filter(c => c !== hex)].slice(0, MAX_RECENT)
    cache.set(key, next)
    try { window.localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore */ }
    listeners.forEach(l => l())
}

// A picker being dragged fires on every move: only the colour it settles on counts as "used"
let pending: { brandId: string, color: string } | null = null
let timer: number | null = null
export const noteRecentColor = (brandId: string, color: string | undefined | null) => {
    if (!color || typeof window === 'undefined') return
    pending = { brandId, color }
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
        if (pending) commit(pending.brandId, pending.color)
        pending = null
        timer = null
    }, 700)
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

/** Swatches for a panel grid (`count` squares) and a function to record a colour that was just used */
export const useSwatchColors = (count = 16) => {
    // Outside a brandbook (the proposal editor reuses these panels) there is no brand palette: recent + defaults
    const design = useBrandDesignOptional()
    const brandId = design?.brandId || ""
    const settings = design?.settings
    const recent = useSyncExternalStore(subscribe, () => read(brandId), () => EMPTY)
    const palette = settings?.color_palette

    const swatches = useMemo(() => {
        const seen = new Set<string>()
        const out: string[] = []
        const push = (c: string) => {
            const hex = normalize(c)
            if (!hex || seen.has(hex) || out.length >= count) return
            seen.add(hex)
            out.push(hex)
        }
        ;(palette || []).forEach(push)
        recent.forEach(push)
        FALLBACK.forEach(push)
        return out
    }, [palette, recent, count])

    const brandCount = useMemo(() => new Set((palette || []).map(c => normalize(c)).filter(Boolean)).size, [palette])

    return {
        swatches,
        /** How many of the swatches are brand colours (they come first) */
        brandCount: Math.min(brandCount, count),
        noteColor: (color: string | undefined | null) => noteRecentColor(brandId, color),
    }
}
