"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PAGE_FORMATS, resolvePage, type PageOrientation, type PageSetting } from "../../pageFormats"

/**
 * Choosing a page's format: paper (A5 … A2, Carta) in portrait or landscape, or a screen format (web, 16:9, 9:16…).
 * Used to create a page («Nova página») and to change the format of an existing one.
 */
export function PageFormatModal({
    isOpen, mode, initial, onClose, onConfirm, pageCount = 0,
}: {
    isOpen: boolean
    mode: "create" | "change"
    initial?: PageSetting | null
    onClose: () => void
    onConfirm: (page: PageSetting, options: { applyToAll: boolean }) => Promise<void> | void
    pageCount?: number
}) {
    const [format, setFormat] = React.useState(initial?.format || "a4")
    const [orientation, setOrientation] = React.useState<PageOrientation>(initial?.orientation || "portrait")
    const [applyToAll, setApplyToAll] = React.useState(false)
    const [busy, setBusy] = React.useState(false)

    // Start from the page's current format every time the window opens
    const [openedWith, setOpenedWith] = React.useState<string | null>(null)
    const key = isOpen ? `${mode}:${initial?.format}:${initial?.orientation}` : null
    if (key !== openedWith) {
        setOpenedWith(key)
        if (isOpen) {
            setFormat(initial?.format || "a4")
            setOrientation(initial?.orientation || "portrait")
            setApplyToAll(false)
        }
    }

    React.useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpen, onClose, busy])

    if (!isOpen) return null
    const selected = PAGE_FORMATS.find(f => f.id === format)!
    const resolved = resolvePage({ format, orientation })

    const confirm = async () => {
        setBusy(true)
        try { await onConfirm({ format, orientation: selected.rotatable ? orientation : "portrait" }, { applyToAll }) } finally { setBusy(false) }
    }

    const group = (id: "documento" | "ecra", title: string, subtitle: string) => (
        <section>
            <div className="flex items-end justify-between mb-3">
                <div>
                    <h3 className="text-[13px] font-semibold text-white">{title}</h3>
                    <p className="text-[11px] text-[#777] mt-0.5">{subtitle}</p>
                </div>
                {id === "documento" && (
                    <div className="flex p-0.5 rounded-lg bg-[#1b1b22] border border-[#2a2a33]" role="radiogroup" aria-label="Orientação">
                        {(["portrait", "landscape"] as const).map(o => (
                            <button
                                key={o}
                                type="button"
                                role="radio"
                                aria-checked={orientation === o}
                                onClick={() => setOrientation(o)}
                                className={cn("h-7 px-3 rounded-md text-[12px] font-medium transition-colors", orientation === o ? "bg-[#EF0050] text-white" : "text-[#999] hover:text-white")}
                            >
                                {o === "portrait" ? "Vertical" : "Horizontal"}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {PAGE_FORMATS.filter(f => f.group === id).map(f => {
                    const r = resolvePage({ format: f.id, orientation })
                    const active = format === f.id
                    // Thumbnail with the format's proportions inside a 56px box
                    const ratio = r.height ? r.width / r.height : 1080 / 1500
                    const tw = ratio >= 1 ? 56 : 56 * ratio
                    const th = ratio >= 1 ? 56 / ratio : 56
                    return (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFormat(f.id)}
                            aria-pressed={active}
                            className={cn(
                                "rounded-xl border p-3 flex flex-col items-center gap-3 text-center transition-colors",
                                active ? "border-[#EF0050] bg-[#EF0050]/[0.06]" : "border-[#2a2a33] hover:border-[#444] bg-[#15151b]"
                            )}
                        >
                            <div className="h-[60px] flex items-center justify-center">
                                <div
                                    className={cn("rounded-[3px] border", active ? "border-[#EF0050] bg-[#EF0050]/20" : "border-[#555] bg-white/[0.04]", !r.height && "border-dashed border-b-0 rounded-b-none")}
                                    style={{ width: tw, height: th }}
                                />
                            </div>
                            <div>
                                <p className="text-[12px] font-semibold text-white leading-tight">{f.label}</p>
                                <p className="text-[10px] text-[#777] mt-1 leading-tight">{f.hint}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </section>
    )

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!busy) onClose() }} />
            <div role="dialog" aria-label={mode === "create" ? "Nova página" : "Formato da página"} className="relative w-full max-w-[860px] bg-[#111116] border border-[#222] rounded-2xl shadow-2xl overflow-hidden text-white">
                <div className="h-[60px] px-6 bg-[#EF0050] flex items-center justify-between">
                    <h2 className="text-[18px] font-bold">{mode === "create" ? "Nova página" : "Formato da página"}</h2>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="w-[22px] h-[22px] bg-[#15161B] rounded-full transition-transform hover:scale-105 active:scale-90" />
                </div>

                <div className="p-6 space-y-7 max-h-[70vh] overflow-y-auto">
                    {group("documento", "Documento", "Para imprimir ou enviar em PDF.")}
                    {group("ecra", "Ecrã", "Para ver no browser, apresentar ou partilhar.")}
                </div>

                <div className="px-6 py-4 border-t border-[#222] flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold">{resolved.label}</p>
                        <p className="text-[11px] text-[#777]">{resolved.height ? `${resolved.width} × ${resolved.height} px` : `${resolved.width} px de largura, altura livre`}</p>
                    </div>
                    {mode === "change" && pageCount > 1 && (
                        <label className="flex items-center gap-2 text-[12px] text-[#bbb] cursor-pointer select-none">
                            <input type="checkbox" checked={applyToAll} onChange={e => setApplyToAll(e.target.checked)} className="accent-[#EF0050] w-4 h-4" />
                            Aplicar a todas as páginas
                        </label>
                    )}
                    <button type="button" onClick={onClose} disabled={busy} className="h-10 px-5 rounded-lg text-[13px] text-[#999] hover:text-white">Cancelar</button>
                    <button type="button" onClick={confirm} disabled={busy} className="h-10 px-6 rounded-lg bg-[#EF0050] hover:bg-[#d60048] text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-60">
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        {mode === "create" ? "Criar página" : "Aplicar"}
                    </button>
                </div>
            </div>
        </div>
    )
}
