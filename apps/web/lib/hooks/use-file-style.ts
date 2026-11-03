"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * How files without a preview (.ai, .psd, .pdf, fonts…) are drawn in the Asset Hub, its libraries and the shared
 * links: a tile with the extension, in one of these styles. Kept in the user's account like the folder style
 * (auth metadata `asset_file_style`), with a copy in the browser so pages draw it at once; one shared value.
 */
export type FileStyle = "solid" | "glass" | "gradient" | "document" | "outline"

export const FILE_STYLES: { id: FileStyle, label: string, hint: string }[] = [
    { id: "solid", label: "Cor", hint: "A cor do formato, como na landing" },
    { id: "glass", label: "Vidro", hint: "Vidro fosco sobre a cor do formato" },
    { id: "gradient", label: "Gradiente", hint: "Malha suave na cor do formato" },
    { id: "document", label: "Documento", hint: "Folha com canto dobrado e etiqueta" },
    { id: "outline", label: "Contorno", hint: "Minimal: só o contorno e a extensão" },
]

const KEY = "brivio.assetFileStyle"
export const isFileStyle = (v: unknown): v is FileStyle => FILE_STYLES.some(s => s.id === v)

let current: FileStyle | null = null
let fetched = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const set = (next: FileStyle) => {
    if (current === next) return
    current = next
    try { localStorage.setItem(KEY, next) } catch { /* private mode */ }
    emit()
}
const read = (): FileStyle => {
    if (current) return current
    try { const local = localStorage.getItem(KEY); if (isFileStyle(local)) current = local } catch { /* ignore */ }
    return current || "solid"
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

/** `initial`: the style read on the server, so the first paint already uses it */
export function useFileStyle(initial?: string | null) {
    if (isFileStyle(initial) && !current) current = initial
    const style = useSyncExternalStore(subscribe, read, () => (isFileStyle(initial) ? initial : "solid"))

    useEffect(() => {
        if (isFileStyle(initial)) set(initial)
        if (fetched) return
        fetched = true
        createClient().auth.getUser().then(({ data }) => {
            const saved = data.user?.user_metadata?.asset_file_style
            if (isFileStyle(saved)) set(saved)
        }).catch(() => { fetched = false })
    }, [initial])

    const setStyle = useCallback(async (next: FileStyle) => {
        set(next)
        const { error } = await createClient().auth.updateUser({ data: { asset_file_style: next } })
        return !error
    }, [])

    return { style, setStyle }
}
