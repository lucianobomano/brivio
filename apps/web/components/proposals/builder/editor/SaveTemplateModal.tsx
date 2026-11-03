"use client"

import React from "react"
import { createPortal } from "react-dom"
import { Globe, Loader2, LayoutTemplate, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { listSavedProposalTemplates, saveProposalAsTemplate, type SavedTemplate } from "@/app/actions/proposal-templates"

/**
 * «Guardar como template»: every page of the proposal and its theme become a template of the team, offered
 * when a proposal is created and in «Componentes → Templates da equipa». It can also replace one saved before.
 */
export function SaveTemplateModal({ isOpen, onClose, proposalId, projectName, pageCount, beforeSave }: {
    isOpen: boolean
    onClose: () => void
    proposalId: string
    projectName?: string | null
    pageCount: number
    /** Sends the changes still waiting, so the template has the proposal as it is on screen */
    beforeSave: () => Promise<boolean>
}) {
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [useFields, setUseFields] = React.useState(true)
    const [isPublic, setIsPublic] = React.useState(false)
    const [mode, setMode] = React.useState<"new" | "replace">("new")
    const [overwriteId, setOverwriteId] = React.useState<string>("")
    const [existing, setExisting] = React.useState<SavedTemplate[]>([])
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!isOpen) return
        setName(projectName ? `Template — ${projectName}` : "Novo template")
        setDescription("")
        setMode("new")
        setIsPublic(false)
        // Only the team's own templates can be replaced
        listSavedProposalTemplates().then(all => { const list = all.filter(t => t.mine); setExisting(list); setOverwriteId(list[0]?.id || "") }).catch(() => setExisting([]))
    }, [isOpen, projectName])

    React.useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpen, busy, onClose])

    if (!isOpen || typeof document === "undefined") return null

    const save = async () => {
        if (!name.trim()) { toast.error("Dê um nome ao template."); return }
        if (mode === "replace" && !overwriteId) { toast.error("Escolha o template a substituir."); return }
        setBusy(true)
        try {
            const saved = await beforeSave()
            if (!saved && !window.confirm("Algumas alterações ainda não foram guardadas. Guardar o template mesmo assim?")) return
            const r = await saveProposalAsTemplate(proposalId, { name, description, useFields, isPublic, overwriteId: mode === "replace" ? overwriteId : null })
            if (r && "success" in r && r.success && "template" in r) {
                toast.success(`Template «${r.template.name}» guardado com ${r.template.page_count} páginas${isPublic ? ", disponível para todos os utilizadores" : " para a sua equipa"}.`)
                onClose()
            } else {
                toast.error((r as { error?: string })?.error || "Não foi possível guardar o template.")
            }
        } finally {
            setBusy(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!busy) onClose() }} />
            <div role="dialog" aria-label="Guardar como template" className="relative w-full max-w-[460px] bg-[#1F1F25] border border-white/5 rounded-2xl shadow-2xl overflow-hidden text-[#97A1B3] text-sm">
                <div className="bg-[#FF0054] h-[56px] px-5 flex items-center justify-between">
                    <span className="text-white font-medium text-lg flex items-center gap-2"><LayoutTemplate className="w-5 h-5" /> Guardar como template</span>
                    <button type="button" disabled={busy} onClick={onClose} className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors">
                        <span className="sr-only">Fechar</span>
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    <p className="text-[12px] leading-relaxed">
                        As {pageCount} páginas desta proposta, com o conteúdo, a ordem, os formatos, as cores e as fontes, ficam guardadas como um template da sua equipa.
                        Pode usá-lo ao criar uma proposta ou inseri-lo noutra em «Componentes».
                    </p>

                    {existing.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 p-1 bg-[#16171C] rounded-md">
                            {([["new", "Novo template"], ["replace", "Substituir um existente"]] as const).map(([id, label]) => (
                                <button key={id} type="button" onClick={() => setMode(id)} className={cn("h-8 rounded text-[12px] font-semibold transition-colors", mode === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>{label}</button>
                            ))}
                        </div>
                    )}

                    {mode === "replace" && (
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] uppercase tracking-wider text-[#666]">Template a substituir</span>
                            <select value={overwriteId} onChange={(e) => { setOverwriteId(e.target.value); const t = existing.find(x => x.id === e.target.value); if (t) { setName(t.name); setDescription(t.description || ""); setIsPublic(t.is_public) } }} className="h-9 bg-[#1A1C23] rounded px-2 text-[13px] text-white outline-none cursor-pointer">
                                {existing.map(t => <option key={t.id} value={t.id}>{t.name} · {t.page_count ?? "?"} páginas</option>)}
                            </select>
                        </label>
                    )}

                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-[#666]">Nome</span>
                        <input autoFocus value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="h-9 bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-3 text-[13px] text-white outline-none" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-[#666]">Descrição (opcional)</span>
                        <textarea value={description} maxLength={280} rows={2} onChange={(e) => setDescription(e.target.value)} placeholder="Para que tipo de proposta serve, estilo…" className="bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-3 py-2 text-[13px] text-white outline-none resize-none" />
                    </label>

                    {/* Who gets it: the team only, or every user of the platform */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-[#666]">Quem pode usar</span>
                        <div className="grid grid-cols-2 gap-1 p-1 bg-[#16171C] rounded-md">
                            <button type="button" onClick={() => setIsPublic(false)} className={cn("h-9 rounded text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5", !isPublic ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                                <Users className="w-3.5 h-3.5" /> Só a minha equipa
                            </button>
                            <button type="button" onClick={() => setIsPublic(true)} className={cn("h-9 rounded text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5", isPublic ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                                <Globe className="w-3.5 h-3.5" /> Público
                            </button>
                        </div>
                        {isPublic && <span className="text-[11px] text-[#666]">Qualquer utilizador da plataforma pode começar uma proposta com este template. Só a sua equipa o pode alterar ou apagar.</span>}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={useFields} onChange={(e) => setUseFields(e.target.checked)} className="mt-0.5 accent-[#FF0054] w-4 h-4" />
                        <span>
                            <span className="text-white">Trocar o nome do projeto e do cliente por campos automáticos</span>
                            <span className="block text-[11px] text-[#666] mt-0.5">Numa proposta nova, esses textos passam a mostrar o projeto e o cliente dela.</span>
                        </span>
                    </label>
                </div>

                <div className="px-5 py-4 border-t border-white/5 flex justify-end gap-2">
                    <button type="button" disabled={busy} onClick={onClose} className="h-9 px-4 rounded-lg text-[13px] text-[#97A1B3] hover:text-white">Cancelar</button>
                    <button type="button" disabled={busy || !name.trim()} onClick={save} className="h-9 px-4 rounded-lg bg-[#FF0054] hover:bg-[#d60048] text-white text-[13px] font-semibold flex items-center gap-2 disabled:opacity-50">
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        {mode === "replace" ? "Substituir template" : "Guardar template"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
