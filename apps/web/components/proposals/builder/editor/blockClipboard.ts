"use client"

import { useSyncExternalStore } from "react"
import type { Block } from "./types"

/**
 * The proposal editor's clipboard: «Copiar» in a block's bar keeps the block here, and «Colar» in the
 * «Adicionar item» dialog puts a copy (with new ids) into the column. Kept for the browser session, so a
 * block can be copied from one proposal page (or proposal) to another.
 */

const KEY = "brivio-proposal-block-clipboard"
let current: Block | null = null
let loaded = false
const listeners = new Set<() => void>()

const load = () => {
    if (loaded || typeof window === "undefined") return
    loaded = true
    try { const raw = window.sessionStorage.getItem(KEY); current = raw ? JSON.parse(raw) : null } catch { current = null }
}

const emit = () => listeners.forEach(l => l())

export const copyBlock = (block: Block) => {
    current = JSON.parse(JSON.stringify(block))
    loaded = true
    try { window.sessionStorage.setItem(KEY, JSON.stringify(current)) } catch { /* private mode: memory only */ }
    emit()
}

export const clearClipboard = () => {
    current = null
    try { window.sessionStorage.removeItem(KEY) } catch { /* ignore */ }
    emit()
}

/** A copy of the copied block with fresh ids everywhere (blocks, columns), ready to insert */
export const pasteBlock = (): Block | null => {
    load()
    if (!current) return null
    const fresh = () => Math.random().toString(36).slice(2, 11)
    const walk = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(walk)
        if (value && typeof value === "object") {
            const o: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(value)) o[k] = k === "id" && typeof v === "string" ? fresh() : walk(v)
            return o
        }
        return value
    }
    return walk(current) as Block
}

/** Finds a block anywhere in a page (inside columns too) */
export const findBlock = (blocks: Block[], id: string): Block | null => {
    for (const b of blocks) {
        if (b.id === id) return b
        for (const col of (b as any).content?.columns || []) {
            const found = findBlock(col.blocks || [], id)
            if (found) return found
        }
    }
    return null
}

export const useHasClipboard = () => useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l) } },
    () => { load(); return !!current },
    () => false,
)
