"use client"

import React from "react"
import { createPortal } from "react-dom"
import { Globe, Loader2, Lock, Search, Sparkles, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    createProposalFromTemplate, deleteProposalTemplate, listBuiltinProposalTemplates, listSavedProposalTemplates, setProposalTemplatePublic,
    type BuiltinTemplate, type SavedTemplate,
} from "@/app/actions/proposal-templates"
import { BrandDesignProvider } from "./builder/editor/BrandDesignContext"
import { ComponentPreview } from "./builder/editor/ComponentsModal"
import type { ComponentCategory, ProposalComponent } from "./builder/componentLibrary"

type Tab = "all" | "team" | "public" | "builtin"

/**
 * Proposal templates ready to start from: the team's own, the public ones shared by any team, and the ones that
 * come with Brivio. «Usar template» creates a proposal in the project and opens it in the editor.
 */
export function TemplateGalleryModal({ isOpen, onClose, projectId, projectName, onCreated }: {
    isOpen: boolean
    onClose: () => void
    projectId: string
    projectName?: string | null
    onCreated?: (proposalId: string) => void
}) {
    const [saved, setSaved] = React.useState<SavedTemplate[] | null>(null)
    const [builtin, setBuiltin] = React.useState<BuiltinTemplate[]>([])
    const [tab, setTab] = React.useState<Tab>("all")
    const [query, setQuery] = React.useState("")
    const [busyId, setBusyId] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!isOpen) return
        setSaved(null)
        Promise.all([listSavedProposalTemplates(), listBuiltinProposalTemplates()])
            .then(([s, b]) => { setSaved(s); setBuiltin(b) })
            .catch(() => { setSaved([]); setBuiltin([]) })
    }, [isOpen])

    React.useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busyId) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpen, busyId, onClose])

    if (!isOpen || typeof document === "undefined") return null

    const q = query.trim().toLowerCase()
    const match = (name: string, extra?: string | null) => !q || name.toLowerCase().includes(q) || (extra || "").toLowerCase().includes(q)
    const team = (saved || []).filter(t => t.mine && match(t.name, t.description))
    // Public ones of other teams; the «Públicos» tab also shows the team's own public templates
    const community = (saved || []).filter(t => !t.mine && t.is_public && match(t.name, t.description))
    const allPublic = (saved || []).filter(t => t.is_public && match(t.name, t.description))
    const base = builtin.filter(t => match(t.name))
    const counts = { all: team.length + community.length + base.length, team: team.length, public: allPublic.length, builtin: base.length }

    const firstPage = (t: SavedTemplate): ProposalComponent | null => {
        const p = t.content_json?.pages?.[0]
        if (!p) return null
        return { id: `${t.id}-0`, category: "capa" as ComponentCategory, categoryLabel: p.title, styleId: t.id, styleLabel: t.name, type: p.type, pageName: p.title, content_json: p.content_json as ProposalComponent["content_json"] }
    }

    const use = async (templateId: string, name: string) => {
        setBusyId(templateId)
        try {
            const r = await createProposalFromTemplate(projectId, templateId)
            if (r.success) {
                toast.success(`Proposta ${r.identifier} criada a partir de «${name}».`)
                onCreated?.(r.proposalId)
                onClose()
                window.open(`/proposals/${r.proposalId}/builder`, "_blank", "noopener")
            } else toast.error(r.error)
        } finally { setBusyId(null) }
    }
    const togglePublic = async (t: SavedTemplate) => {
        const next = !t.is_public
        const r = await setProposalTemplatePublic(t.id, next)
        if (r.success) {
            setSaved(list => (list || []).map(x => x.id === t.id ? { ...x, is_public: next } : x))
            toast.success(next ? "O template está agora disponível para todos os utilizadores." : "O template voltou a ser só da sua equipa.")
        } else toast.error(r.error)
    }
    const remove = async (t: SavedTemplate) => {
        if (!window.confirm(`Apagar o template «${t.name}»? As propostas já criadas com ele não mudam.`)) return
        const r = await deleteProposalTemplate(t.id)
        if (r.success) { setSaved(list => (list || []).filter(x => x.id !== t.id)); toast.success("Template apagado.") }
        else toast.error(r.error)
    }

    const UseButton = ({ id, name }: { id: string, name: string }) => (
        <button
            type="button"
            disabled={!!busyId}
            onClick={() => use(id, name)}
            className="h-8 px-3 rounded-lg bg-[#EF0050] hover:bg-[#d60048] text-[12px] font-semibold text-white flex items-center gap-1.5 transition-colors disabled:opacity-60 shrink-0"
        >
            {busyId === id && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Usar template
        </button>
    )

    const SavedCard = ({ t }: { t: SavedTemplate }) => {
        const cover = firstPage(t)
        return (
            <div className="rounded-xl border border-[#222] bg-[#0c0c0f] overflow-hidden flex flex-col">
                <div className="relative">
                    {cover ? <ComponentPreview component={cover} context={{ projectName: projectName || undefined }} /> : <div className="h-[200px] bg-[#16161b]" />}
                    <span className={cn("absolute top-2 left-2 h-6 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", t.is_public ? "bg-[#06D6A0] text-[#0c0c0f]" : "bg-black/70 text-white")}>
                        {t.is_public ? <><Globe className="w-3 h-3" /> Público</> : <><Users className="w-3 h-3" /> Equipa</>}
                    </span>
                </div>
                <div className="p-3 border-t border-[#222] flex flex-col gap-2">
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate" title={t.name}>{t.name}</p>
                        <p className="text-[11px] text-[#777] truncate" title={t.description || undefined}>
                            {t.page_count ?? t.content_json?.pages?.length ?? 0} páginas{!t.mine && t.team_name ? ` · por ${t.team_name}` : ""}{t.description ? ` · ${t.description}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {t.mine && (
                            <>
                                <button type="button" onClick={() => togglePublic(t)} title={t.is_public ? "Deixar só para a equipa" : "Disponibilizar para todos os utilizadores"} className="h-8 px-2 rounded-lg text-[11px] text-[#97A1B3] hover:text-white hover:bg-white/5 flex items-center gap-1">
                                    {t.is_public ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />} {t.is_public ? "Tornar privado" : "Tornar público"}
                                </button>
                                <button type="button" onClick={() => remove(t)} title="Apagar este template" className="w-8 h-8 rounded-lg text-[#777] hover:text-[#EF0050] hover:bg-white/5 flex items-center justify-center">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                        <span className="flex-1" />
                        <UseButton id={t.id} name={t.name} />
                    </div>
                </div>
            </div>
        )
    }

    const BuiltinCard = ({ t }: { t: BuiltinTemplate }) => (
        <div className="rounded-xl border border-[#222] bg-[#0c0c0f] overflow-hidden flex flex-col">
            <div className="relative h-[200px] bg-[#16161b] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {t.preview_image ? <img src={t.preview_image} alt="" className="w-full h-full object-cover object-top" /> : null}
                <span className="absolute top-2 left-2 h-6 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-[#EF0050] text-white">
                    <Sparkles className="w-3 h-3" /> Brivio
                </span>
            </div>
            <div className="p-3 border-t border-[#222] flex items-center gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{t.name}</p>
                    <p className="text-[11px] text-[#777]">Template da plataforma</p>
                </div>
                <UseButton id={t.id} name={t.name} />
            </div>
        </div>
    )

    const Section = ({ title, children, empty }: { title: string, children: React.ReactNode, empty?: string }) => (
        <section className="flex flex-col gap-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#777]">{title}</h3>
            {React.Children.count(children) ? (
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>{children}</div>
            ) : empty ? <p className="text-[13px] text-[#666]">{empty}</p> : null}
        </section>
    )

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!busyId) onClose() }} />
            <div role="dialog" aria-label="Templates de propostas" className="relative w-full max-w-[1180px] h-[86vh] bg-[#111116] border border-[#222] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
                <div className="h-[60px] px-6 bg-[#EF0050] flex items-center justify-between shrink-0">
                    <h2 className="text-[18px] font-bold">Templates de propostas</h2>
                    <button type="button" disabled={!!busyId} onClick={onClose} className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors">
                        <span className="sr-only">Fechar</span>
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-[#222] flex flex-wrap items-center gap-3 shrink-0">
                    <div className="flex gap-1 p-1 bg-[#16171C] rounded-lg">
                        {([["all", "Todos"], ["team", "Da equipa"], ["public", "Públicos"], ["builtin", "Brivio"]] as [Tab, string][]).map(([id, label]) => (
                            <button key={id} type="button" onClick={() => setTab(id)} className={cn("h-8 px-3 rounded-md text-[12px] font-semibold transition-colors flex items-center gap-1.5", tab === id ? "bg-[#EF0050] text-white" : "text-[#888] hover:text-white")}>
                                {label} <span className={cn("text-[10px] tabular-nums", tab === id ? "text-white/70" : "text-[#555]")}>{saved ? counts[id] : "…"}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1" />
                    <label className="h-9 w-[260px] flex items-center gap-2 px-3 rounded-lg bg-[#16171C] border border-[#222] focus-within:border-[#EF0050]">
                        <Search className="w-3.5 h-3.5 text-[#666]" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar templates" className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[#555]" />
                    </label>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                    {saved === null ? (
                        <div className="h-40 flex items-center justify-center gap-2 text-[13px] text-[#777]"><Loader2 className="w-4 h-4 animate-spin" /> A carregar templates…</div>
                    ) : (
                        // The previews draw real blocks, which read the proposal theme
                        <BrandDesignProvider brandId="">
                            {(tab === "all" || tab === "team") && (
                                <Section title="Da sua equipa" empty="Ainda não guardou nenhum template. No editor de uma proposta, use «Guardar como template».">
                                    {team.map(t => <SavedCard key={t.id} t={t} />)}
                                </Section>
                            )}
                            {(tab === "all" || tab === "public") && (
                                <Section title={tab === "all" ? "Públicos de outras equipas" : "Públicos"} empty={tab === "all" ? "Ainda não há templates públicos de outras equipas." : "Ainda não há templates públicos."}>
                                    {(tab === "all" ? community : allPublic).map(t => <SavedCard key={t.id} t={t} />)}
                                </Section>
                            )}
                            {(tab === "all" || tab === "builtin") && (
                                <Section title="Da Brivio">
                                    {base.map(t => <BuiltinCard key={t.id} t={t} />)}
                                </Section>
                            )}
                        </BrandDesignProvider>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
