"use client"

import React from "react"
import { format } from "date-fns"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassFolder, hashString, type FolderFile, type GlassFolderProps } from "@/components/ui/glass-folder-cards"
import type { FolderStyle } from "@/lib/hooks/use-folder-style"
import type { AssetFolder, FolderPreview } from "@/app/actions/assets"

/** The three glass models: milk glass over aurora, a plain archive, smoked glass over ember */
const MODEL: Record<Exclude<FolderStyle, "classic">, Pick<GlassFolderProps, "tone" | "art" | "labelPlacement">> = {
    milk: { tone: "light", art: "aurora", labelPlacement: "bottom-left" },
    archive: { tone: "light", art: "none", labelPlacement: "top-left" },
    smoked: { tone: "dark", art: "ember", labelPlacement: "top-right" },
}

const IMAGE = /image|png|jpe?g|webp|gif|svg/i

/** A file of the folder as a sheet of the glass folder (pictures show themselves) */
const toSheet = (f: FolderPreview["files"][number]): FolderFile => ({
    name: f.name,
    meta: (f.type || "").split("/").pop()?.toUpperCase() || undefined,
    image: f.url && IMAGE.test(f.type || f.url) ? f.url : undefined,
})

/**
 * A folder of the Asset Hub drawn as a glass folder. Clicking it fans out its newest files; clicking a file
 * (or «Abrir na biblioteca» in its menu, or an empty folder) opens the folder in the library.
 */
export function GlassFolderCard({ folder, style, preview, index, isSelectionMode, isSelected, onOpen, onToggleSelect, onToggleFavorite }: {
    folder: AssetFolder
    style: Exclude<FolderStyle, "classic">
    preview?: FolderPreview
    index: number
    isSelectionMode: boolean
    isSelected: boolean
    onOpen: () => void
    onToggleSelect: () => void
    onToggleFavorite: () => void
}) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(300)
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.min(340, Math.floor(e.contentRect.width - 24)))))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const files = (preview?.files || []).map(toSheet)
    const count = preview?.count ?? 0
    const date = format(new Date(folder.created_at), "d MMM yyyy")
    const model = MODEL[style]

    return (
        <div
            ref={ref}
            className={cn(
                "w-full h-[320px] xl:h-[400px] rounded-[12px] relative flex items-center justify-center border transition-colors",
                isSelected ? "border-[#FF0054] bg-[#FF0054]/5" : "border-transparent"
            )}
        >
            {/* Remount when the files arrive: the folder keeps its sheets from the first render */}
            <GlassFolder
                key={`${folder.id}-${preview ? "ready" : "loading"}-${style}`}
                label={folder.name}
                meta={preview ? `${count} ${count === 1 ? "item" : "itens"} · ${date}` : date}
                tone={model.tone}
                art={model.art}
                labelPlacement={model.labelPlacement}
                seed={hashString(folder.id) % 97}
                files={files}
                action="more"
                width={width}
                appearDelay={Math.min(index, 8) * 70}
                menu={[
                    { label: "Abrir na biblioteca", onSelect: onOpen },
                    { label: folder.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos", onSelect: onToggleFavorite },
                    { label: isSelected ? "Desmarcar" : "Selecionar", onSelect: onToggleSelect },
                ]}
                // An empty folder has nothing to fan out: it opens straight away
                onOpenChange={(open) => { if (open && files.length === 0) onOpen() }}
                onFileSelect={() => onOpen()}
            />

            {/* Selection mode: the whole card selects / unselects */}
            {isSelectionMode && (
                <button type="button" onClick={onToggleSelect} className="absolute inset-0 z-30 rounded-[12px] flex items-start justify-end p-4" aria-label={isSelected ? `Desmarcar ${folder.name}` : `Selecionar ${folder.name}`}>
                    <span className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", isSelected ? "border-[#FF0054] bg-[#FF0054]" : "border-text-secondary bg-black/10")}>
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </span>
                </button>
            )}
        </div>
    )
}
