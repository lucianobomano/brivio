"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Page = { id: string, title: string, is_hidden?: boolean | null }

/**
 * The proposal's pages: rename, reorder, hide from the client, duplicate, delete, add.
 * Opens from the page navigator on the left of the builder.
 */
export function PagesPanel({
    isOpen, onClose, pages, selectedId, onSelect, onAdd, onRename, onMove, onToggleHidden, onDuplicate, onDelete,
}: {
    isOpen: boolean
    onClose: () => void
    pages: Page[]
    selectedId: string | null
    onSelect: (id: string) => void
    onAdd: () => void
    onRename: (id: string, title: string) => void
    onMove: (id: string, direction: "up" | "down") => void
    onToggleHidden: (id: string) => void
    onDuplicate: (id: string) => void
    onDelete: (id: string) => void
}) {
    // Deleting asks once more on the same row
    const [confirmId, setConfirmId] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 z-[110]" onClick={() => { setConfirmId(null); onClose() }} />
            <div
                role="dialog"
                aria-label="Páginas da proposta"
                className="fixed left-24 top-1/2 -translate-y-1/2 z-[111] w-[380px] max-h-[80vh] flex flex-col bg-[#111116] border border-[#222] rounded-2xl shadow-2xl text-white overflow-hidden"
            >
                <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold">Páginas</p>
                        <p className="text-[11px] text-[#777] mt-0.5">As páginas ocultas não aparecem ao cliente.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="w-7 h-7 rounded-lg flex items-center justify-center text-[#777] hover:text-white hover:bg-white/5">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {pages.map((page, i) => (
                        <div
                            key={page.id}
                            className={cn(
                                "group flex items-center gap-2 px-2 py-1.5 rounded-lg",
                                selectedId === page.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(page.id)}
                                className={cn(
                                    "w-7 h-7 shrink-0 rounded-md text-[10px] font-bold flex items-center justify-center",
                                    selectedId === page.id ? "bg-[#EF0050] text-white" : "bg-[#1b1b22] text-[#777]"
                                )}
                                title="Abrir página"
                            >
                                {String(i + 1).padStart(2, "0")}
                            </button>
                            <input
                                key={page.title}
                                defaultValue={page.title}
                                aria-label={`Nome da página ${i + 1}`}
                                onBlur={(e) => {
                                    const v = e.target.value.trim()
                                    if (!v) { e.target.value = page.title; return }
                                    if (v !== page.title) onRename(page.id, v)
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                                className={cn(
                                    "flex-1 min-w-0 bg-transparent text-[13px] outline-none border-b border-transparent focus:border-[#EF0050] py-1",
                                    page.is_hidden && "text-[#666] line-through decoration-[#666]/60"
                                )}
                            />
                            {confirmId === page.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" onClick={() => { onDelete(page.id); setConfirmId(null) }} className="h-7 px-2 rounded-md bg-red-500/15 text-red-400 text-[11px] font-semibold hover:bg-red-500/25">Eliminar</button>
                                    <button type="button" onClick={() => setConfirmId(null)} className="h-7 px-2 rounded-md text-[#777] text-[11px] hover:text-white">Cancelar</button>
                                </div>
                            ) : (
                                <div className="flex items-center shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <PageAction label="Subir" disabled={i === 0} onClick={() => onMove(page.id, "up")}><ArrowUp className="w-3.5 h-3.5" /></PageAction>
                                    <PageAction label="Descer" disabled={i === pages.length - 1} onClick={() => onMove(page.id, "down")}><ArrowDown className="w-3.5 h-3.5" /></PageAction>
                                    <PageAction label={page.is_hidden ? "Mostrar ao cliente" : "Ocultar do cliente"} onClick={() => onToggleHidden(page.id)}>
                                        {page.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </PageAction>
                                    <PageAction label="Duplicar" onClick={() => onDuplicate(page.id)}><Copy className="w-3.5 h-3.5" /></PageAction>
                                    <PageAction label="Eliminar" danger onClick={() => setConfirmId(page.id)}><Trash2 className="w-3.5 h-3.5" /></PageAction>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t border-[#222]">
                    <button
                        type="button"
                        onClick={onAdd}
                        className="w-full h-9 rounded-lg border border-dashed border-[#333] text-[12px] font-semibold text-[#999] hover:text-white hover:border-[#EF0050] flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Nova página
                    </button>
                </div>
            </div>
        </>
    )
}

function PageAction({ label, onClick, disabled, danger, children }: { label: string, onClick: () => void, disabled?: boolean, danger?: boolean, children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-25 disabled:pointer-events-none",
                danger ? "text-[#888] hover:text-red-400 hover:bg-red-500/10" : "text-[#888] hover:text-white hover:bg-white/[0.06]"
            )}
        >
            {children}
        </button>
    )
}
