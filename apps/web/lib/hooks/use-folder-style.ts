"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * How folders are drawn (Asset Hub, its library, the brandbook / proposal Asset Library): the classic icon,
 * or one of the three glass folders. Kept in the user's account (auth metadata), so it follows them on every
 * device; a copy in the browser lets pages draw the right style at once. One shared value: changing it in the
 * Asset Hub updates every view already on screen (the library modal is mounted with the page).
 */
export type FolderStyle = "classic" | "milk" | "archive" | "smoked"

export const FOLDER_STYLES: { id: FolderStyle, label: string, hint: string }[] = [
    { id: "classic", label: "Clássico", hint: "O ícone de pasta de sempre" },
    { id: "milk", label: "Vidro leitoso", hint: "Vidro fosco claro sobre arte aurora" },
    { id: "archive", label: "Arquivo", hint: "Vidro simples, nome no topo" },
    { id: "smoked", label: "Vidro fumado", hint: "Vidro escuro sobre arte ember" },
]

const KEY = "brivio.assetFolderStyle"
const isStyle = (v: unknown): v is FolderStyle => FOLDER_STYLES.some(s => s.id === v)

// ---- shared store
let current: FolderStyle | null = null
let fetched = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const set = (next: FolderStyle) => {
    if (current === next) return
    current = next
    try { localStorage.setItem(KEY, next) } catch { /* private mode */ }
    emit()
}
const read = (): FolderStyle => {
    if (current) return current
    try { const local = localStorage.getItem(KEY); if (isStyle(local)) current = local } catch { /* ignore */ }
    return current || "classic"
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

/** `initial`: the style read on the server (the page is drawn with it, no flash of the classic icon) */
export function useFolderStyle(initial?: string | null) {
    if (isStyle(initial) && !current) current = initial
    const style = useSyncExternalStore(subscribe, read, () => (isStyle(initial) ? initial : "classic"))

    useEffect(() => {
        if (isStyle(initial)) set(initial)
        // The account is the source of truth: read it once per page
        if (fetched) return
        fetched = true
        createClient().auth.getUser().then(({ data }) => {
            const saved = data.user?.user_metadata?.asset_folder_style
            if (isStyle(saved)) set(saved)
        }).catch(() => { fetched = false })
    }, [initial])

    const setStyle = useCallback(async (next: FolderStyle) => {
        set(next)
        const { error } = await createClient().auth.updateUser({ data: { asset_folder_style: next } })
        return !error
    }, [])

    return { style, setStyle }
}
