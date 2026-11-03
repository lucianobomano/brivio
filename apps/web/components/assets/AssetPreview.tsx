"use client"

import React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Download, FileIcon, Minus, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/** What the viewer needs from an asset (the libraries' Asset type fits) */
export interface PreviewAsset {
    id: string
    name?: string | null
    file_url?: string | null
    type?: string | null
    created_at?: string | null
    metadata?: Record<string, any> | null
}

const isImage = (a: PreviewAsset) => a.type === "image" || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(a.name || a.file_url || "")
const isVideo = (a: PreviewAsset) => a.type === "video" || /\.(mp4|webm|mov)$/i.test(a.name || a.file_url || "")

export async function downloadAsset(a: PreviewAsset) {
    if (!a.file_url) return
    try {
        const blob = await fetch(a.file_url).then(r => r.blob())
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = a.name || "download"
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    } catch {
        toast.error("Não foi possível descarregar o ficheiro")
    }
}

/**
 * Full-screen viewer for the files of a library: the clicked one, with the arrows (or ← →) going through the others.
 * Images can be zoomed (buttons, wheel, double click) and dragged when zoomed; videos play; other files offer the download.
 */
export function AssetPreview({ assets, index, onIndexChange, onClose }: {
    assets: PreviewAsset[]
    /** The open file, or null when closed */
    index: number | null
    onIndexChange: (i: number) => void
    onClose: () => void
}) {
    const open = index !== null && !!assets[index]
    const asset = open ? assets[index!] : null
    const [zoom, setZoom] = React.useState(1)
    const [pan, setPan] = React.useState({ x: 0, y: 0 })
    const drag = React.useRef<{ x: number, y: number, px: number, py: number } | null>(null)
    const count = assets.length

    const go = React.useCallback((d: number) => {
        if (index === null || count < 2) return
        onIndexChange((index + d + count) % count)
    }, [index, count, onIndexChange])

    // A new file starts unzoomed
    React.useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [asset?.id])

    React.useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") { e.stopPropagation(); onClose() }
            else if (e.key === "ArrowRight") go(1)
            else if (e.key === "ArrowLeft") go(-1)
            else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(5, z + 0.5))
            else if (e.key === "-") setZoom(z => { const n = Math.max(1, z - 0.5); if (n === 1) setPan({ x: 0, y: 0 }); return n })
        }
        // Capture: the library behind also closes on Escape
        window.addEventListener("keydown", onKey, true)
        return () => window.removeEventListener("keydown", onKey, true)
    }, [open, go, onClose])

    // Preload the neighbours so the arrows feel instant
    React.useEffect(() => {
        if (index === null || count < 2) return
        for (const d of [1, -1]) {
            const n = assets[(index + d + count) % count]
            if (n && isImage(n) && n.file_url) { const img = new Image(); img.src = n.file_url }
        }
    }, [index, assets, count])

    if (typeof document === "undefined") return null

    const setZoomTo = (z: number) => { const n = Math.min(5, Math.max(1, z)); setZoom(n); if (n === 1) setPan({ x: 0, y: 0 }) }
    const meta = asset ? [asset.metadata?.size, asset.metadata?.dimensions].filter(Boolean).join(" • ") : ""

    return createPortal(
        <AnimatePresence>
            {open && asset && (
                <motion.div
                    key="asset-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[12500] bg-black/95 backdrop-blur-sm flex flex-col text-white select-none"
                    role="dialog"
                    aria-label={asset.name || "Pré-visualização"}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top bar */}
                    <div className="h-16 shrink-0 flex items-center justify-between gap-4 px-4 md:px-8">
                        <div className="min-w-0">
                            <p className="text-[14px] font-semibold truncate">{asset.name || "Ficheiro"}</p>
                            <p className="text-[11px] text-white/50 truncate">
                                {count > 1 ? `${index! + 1} de ${count}` : ""}{meta ? `${count > 1 ? " · " : ""}${meta}` : ""}
                                {asset.created_at ? ` · ${new Date(asset.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {isImage(asset) && (
                                <div className="hidden sm:flex items-center gap-1 mr-2 bg-white/5 rounded-full p-1">
                                    <button type="button" aria-label="Diminuir" onClick={() => setZoomTo(zoom - 0.5)} disabled={zoom <= 1} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-30"><Minus className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setZoomTo(1)} className="min-w-[48px] h-8 rounded-full hover:bg-white/10 text-[12px] font-semibold tabular-nums">{Math.round(zoom * 100)}%</button>
                                    <button type="button" aria-label="Aumentar" onClick={() => setZoomTo(zoom + 0.5)} disabled={zoom >= 5} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-30"><Plus className="w-4 h-4" /></button>
                                </div>
                            )}
                            <button type="button" aria-label="Descarregar" onClick={() => downloadAsset(asset)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center"><Download className="w-4 h-4" /></button>
                            <button type="button" aria-label="Fechar" onClick={onClose} className="w-10 h-10 rounded-full bg-white text-black hover:bg-white/85 flex items-center justify-center"><X className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Stage */}
                    <div
                        className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden px-4 md:px-20 pb-6"
                        onClick={(e) => { if (e.target === e.currentTarget && zoom === 1) onClose() }}
                        onWheel={(e) => { if (isImage(asset)) setZoomTo(zoom + (e.deltaY < 0 ? 0.25 : -0.25)) }}
                    >
                        {isImage(asset) ? (
                            <img
                                key={asset.id}
                                src={asset.file_url || ""}
                                alt={asset.name || ""}
                                draggable={false}
                                onDoubleClick={() => setZoomTo(zoom > 1 ? 1 : 2.5)}
                                onPointerDown={(e) => { if (zoom === 1) return; (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y } }}
                                onPointerMove={(e) => { const d = drag.current; if (d) setPan({ x: d.px + (e.clientX - d.x) / zoom, y: d.py + (e.clientY - d.y) / zoom }) }}
                                onPointerUp={() => { drag.current = null }}
                                className={cn("max-w-full max-h-full object-contain rounded-lg shadow-2xl", zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
                                style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transition: drag.current ? "none" : "transform 0.15s ease-out" }}
                            />
                        ) : isVideo(asset) ? (
                            <video key={asset.id} src={asset.file_url || ""} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl bg-black" />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center"><FileIcon className="w-10 h-10 text-white/50" /></div>
                                <p className="text-[13px] text-white/60">Pré-visualização indisponível para este tipo de ficheiro.</p>
                                <button type="button" onClick={() => downloadAsset(asset)} className="h-10 px-5 rounded-full bg-[#ff0054] hover:bg-[#e6004c] text-[13px] font-bold flex items-center gap-2"><Download className="w-4 h-4" /> Descarregar</button>
                            </div>
                        )}

                        {count > 1 && (
                            <>
                                <button type="button" aria-label="Anterior" onClick={() => go(-1)} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
                                <button type="button" aria-label="Seguinte" onClick={() => go(1)} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {count > 1 && count <= 60 && (
                        <div className="shrink-0 h-[76px] flex items-center justify-center gap-2 px-4 pb-4 overflow-x-auto [scrollbar-width:none]">
                            {assets.map((a, i) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    aria-label={a.name || `Ficheiro ${i + 1}`}
                                    onClick={() => onIndexChange(i)}
                                    className={cn("w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-white/5", i === index ? "border-[#ff0054] opacity-100" : "border-transparent opacity-50 hover:opacity-90")}
                                >
                                    {isImage(a) && a.file_url ? <img src={a.file_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <span className="text-[9px] uppercase text-white/60">{(a.name?.split(".").pop() || a.type || "").slice(0, 4)}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
