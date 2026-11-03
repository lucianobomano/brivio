"use client"

import React from "react"
import { GlassFolder, hashString, type FolderFile, type GlassFolderProps } from "@/components/ui/glass-folder-cards"
import type { FolderStyle } from "@/lib/hooks/use-folder-style"
import { getFolderPreviews, type FolderPreview } from "@/app/actions/assets"

/** The three glass models: milk glass over aurora, a plain archive, smoked glass over ember */
export const GLASS_MODEL: Record<Exclude<FolderStyle, "classic">, Pick<GlassFolderProps, "tone" | "art" | "labelPlacement">> = {
    milk: { tone: "light", art: "aurora", labelPlacement: "bottom-left" },
    archive: { tone: "light", art: "none", labelPlacement: "top-left" },
    smoked: { tone: "dark", art: "ember", labelPlacement: "top-right" },
}

const IMAGE = /image|png|jpe?g|webp|gif|svg/i

/** A file of the folder as a sheet of the glass folder (pictures show themselves) */
export const previewSheet = (f: FolderPreview["files"][number]): FolderFile => ({
    name: f.name,
    meta: (f.type || "").split("/").pop()?.toUpperCase() || undefined,
    image: f.url && IMAGE.test(f.type || f.url) ? f.url : undefined,
})

/** What several folders hold (count + newest files), loaded when a glass style is on */
export function useFolderPreviews(folderIds: string[], enabled: boolean, initial?: Record<string, FolderPreview>) {
    const [previews, setPreviews] = React.useState<Record<string, FolderPreview>>(initial || {})
    const key = folderIds.join(",")
    React.useEffect(() => {
        if (!enabled || !key) return
        const missing = key.split(",").filter(id => !previews[id])
        if (!missing.length) return
        let alive = true
        getFolderPreviews(missing).then(p => { if (alive) setPreviews(prev => ({ ...prev, ...p })) }).catch(() => { })
        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, enabled])
    return previews
}

/**
 * A glass folder used as a picture (library grids, shared page): not interactive itself, the tile around it
 * opens / selects the folder and keeps its own menu. As wide as its box.
 */
export function GlassFolderThumb({ id, name, meta, style, preview, maxWidth = 260 }: {
    id: string
    name: string
    meta?: string
    style: Exclude<FolderStyle, "classic">
    preview?: FolderPreview
    maxWidth?: number
}) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(Math.min(200, maxWidth))
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setWidth(Math.max(140, Math.min(maxWidth, Math.floor(e.contentRect.width)))))
        ro.observe(el)
        return () => ro.disconnect()
    }, [maxWidth])
    const files = (preview?.files || []).map(previewSheet)
    const count = preview?.count
    return (
        <div ref={ref} className="w-full flex justify-center pointer-events-none select-none" aria-hidden>
            <div inert>
                <GlassFolder
                    key={`${id}-${preview ? "ready" : "loading"}-${style}`}
                    label={name}
                    meta={meta ?? (count !== undefined ? `${count} ${count === 1 ? "item" : "itens"}` : undefined)}
                    seed={hashString(id) % 97}
                    files={files}
                    action="none"
                    width={width}
                    appear={false}
                    {...GLASS_MODEL[style]}
                />
            </div>
        </div>
    )
}
