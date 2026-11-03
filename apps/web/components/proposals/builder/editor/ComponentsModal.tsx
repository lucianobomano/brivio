"use client"

import * as React from "react"
import { deleteProposalTemplate, listSavedProposalTemplates, type SavedTemplate } from "@/app/actions/proposal-templates"
import { toast } from "sonner"
import { FilePlus2, Loader2, PlusSquare , Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BlockRenderer } from "./blocks/BlockRenderer"
import { pageBackground, pageTextColor } from "../../pageBackground"
import { resolvePage } from "../../pageFormats"
import { sectionStyles } from "../../sectionStyle"
import { COMPONENT_CATEGORIES, COMPONENT_STYLES, getProposalComponents, instantiateComponent, type ComponentCategory, type ComponentContext, type ProposalComponent } from "../componentLibrary"

const PREVIEW_WIDTH = 1080
const CARD_WIDTH = 300
// Preview only: a price table without lines shows example ones (inserted, it follows the proposal's services)
const EXAMPLE_LINES = [{ description: "Serviço de Branding", quantity: 1, price: 5000 }, { description: "Gestão Social Media", quantity: 1, price: 1200 }]

/**
 * «Componentes»: ready-made proposal pages by kind (Capa … Assinatura) and style. A component goes in as a new
 * page after the current one, or its sections are added to the end of the current page.
 */
export function ComponentsModal({
    isOpen, onClose, onInsertPage, onInsertIntoCurrent, onInsertTemplate, hasCurrentPage, context,
}: {
    /** Inserts every page of a style (a whole template) */
    onInsertTemplate?: (components: ProposalComponent[]) => Promise<void>
    context: ComponentContext
    isOpen: boolean
    onClose: () => void
    onInsertPage: (component: ProposalComponent) => Promise<void>
    onInsertIntoCurrent: (component: ProposalComponent) => void
    hasCurrentPage: boolean
}) {
    const components = React.useMemo(() => getProposalComponents(), [])
    const [category, setCategory] = React.useState<ComponentCategory | "templates" | "team">("templates")
    // Templates saved by the team (Guardar como template), loaded each time the dialog opens
    const [team, setTeam] = React.useState<SavedTemplate[] | null>(null)
    React.useEffect(() => {
        if (!isOpen) return
        let alive = true
        listSavedProposalTemplates().then(list => { if (alive) setTeam(list) }).catch(() => { if (alive) setTeam([]) })
        return () => { alive = false }
    }, [isOpen])
    // A saved template's pages, as components the builder inserts like the ready-made ones
    const teamPages = (t: SavedTemplate): ProposalComponent[] => (t.content_json?.pages || []).map((p, i) => {
        const label = String(p.title || "").replace(/^\d{1,2}\.\s+/, "") || `Página ${i + 1}`
        return { id: `${t.id}-${i}`, category: "capa" as ComponentCategory, categoryLabel: label, styleId: t.id, styleLabel: t.name, type: p.type || "custom", pageName: label, content_json: p.content_json as ProposalComponent["content_json"] }
    })
    const removeTeamTemplate = async (t: SavedTemplate) => {
        if (!window.confirm(`Apagar o template «${t.name}»? As propostas já criadas com ele não mudam.`)) return
        const r = await deleteProposalTemplate(t.id)
        if (r.success) { setTeam(list => (list || []).filter(x => x.id !== t.id)); toast.success("Template apagado.") }
        else toast.error(r.error || "Não foi possível apagar o template.")
    }
    const [busyId, setBusyId] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busyId) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpen, onClose, busyId])

    if (!isOpen) return null
    const visible = components.filter(c => c.category === category)

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!busyId) onClose() }} />
            <div role="dialog" aria-label="Componentes" className="relative w-full max-w-[1180px] h-[86vh] bg-[#111116] border border-[#222] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
                {/* Header */}
                <div className="h-[60px] px-6 bg-[#EF0050] flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-[18px] font-bold leading-tight">Componentes</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="w-[22px] h-[22px] bg-[#15161B] rounded-full transition-transform hover:scale-105 active:scale-90" />
                </div>

                <div className="flex-1 min-h-0 flex">
                    {/* Categories */}
                    <nav className="w-[220px] shrink-0 border-r border-[#222] p-3 overflow-y-auto">
                        <p className="px-3 pt-2 pb-3 text-[11px] text-[#777] leading-relaxed">Páginas prontas, em vários estilos. Depois de inseridas, edita-se tudo.</p>
                        {onInsertTemplate && (
                            <button
                                type="button"
                                onClick={() => setCategory("templates")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-left text-[13px] transition-colors border border-[#2a2a33]",
                                    category === "templates" ? "bg-white/[0.07] text-white font-semibold" : "text-[#bbb] hover:text-white hover:bg-white/[0.03]"
                                )}
                            >
                                <span className="flex-1">Templates completos</span>
                                <span className="text-[11px] text-[#555] tabular-nums">{COMPONENT_STYLES.length}</span>
                            </button>
                        )}
                        {onInsertTemplate && (
                            <button
                                type="button"
                                onClick={() => setCategory("team")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-left text-[13px] transition-colors border border-[#2a2a33]",
                                    category === "team" ? "bg-white/[0.07] text-white font-semibold" : "text-[#bbb] hover:text-white hover:bg-white/[0.03]"
                                )}
                            >
                                <span className="flex-1">Templates guardados</span>
                                <span className="text-[11px] text-[#555] tabular-nums">{team ? team.length : "…"}</span>
                            </button>
                        )}
                        {COMPONENT_CATEGORIES.map((c, i) => {
                            const count = components.filter(x => x.category === c.id).length
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCategory(c.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors",
                                        category === c.id ? "bg-white/[0.07] text-white font-semibold" : "text-[#999] hover:text-white hover:bg-white/[0.03]"
                                    )}
                                >
                                    <span className={cn("text-[10px] font-bold tabular-nums", category === c.id ? "text-[#EF0050]" : "text-[#555]")}>{String(i + 1).padStart(2, "0")}</span>
                                    <span className="flex-1">{c.label}</span>
                                    <span className="text-[11px] text-[#555] tabular-nums">{count}</span>
                                </button>
                            )
                        })}
                    </nav>

                    {/* Components of the category (or whole templates) */}
                    <div className="flex-1 min-w-0 overflow-y-auto p-6">
                        {category === "team" && onInsertTemplate && (
                            team === null ? (
                                <div className="h-40 flex items-center justify-center text-[#777] text-[13px] gap-2"><Loader2 className="w-4 h-4 animate-spin" /> A carregar…</div>
                            ) : team.length === 0 ? (
                                <div className="max-w-[420px] mx-auto mt-16 text-center text-[13px] text-[#777] leading-relaxed">
                                    <p className="text-white font-semibold mb-2">Ainda não há templates guardados</p>
                                    Abra uma proposta, carregue em <span className="text-white">«Guardar como template»</span> na barra de cima, e ela fica aqui para usar noutras propostas.
                                </div>
                            ) : (
                                <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))` }}>
                                    {team.map(t => {
                                        const pages = teamPages(t)
                                        if (!pages.length) return null
                                        return (
                                            <div key={t.id} className="rounded-xl border border-[#222] bg-[#0c0c0f] overflow-hidden flex flex-col">
                                                <ComponentPreview component={pages[0]} context={context} />
                                                <div className="p-3 border-t border-[#222] flex items-center gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-semibold truncate" title={t.description || t.name}>{t.name}</p>
                                                        <p className="text-[11px] text-[#777] truncate">{t.is_public ? (t.mine ? "Público · " : `Público${t.team_name ? ` · por ${t.team_name}` : ""} · `) : "Equipa · "}{pages.length} páginas{t.description ? ` · ${t.description}` : ""}</p>
                                                    </div>
                                                    {t.mine && (
                                                        <button type="button" title="Apagar este template" onClick={() => removeTeamTemplate(t)} className="w-8 h-8 rounded-lg text-[#777] hover:text-[#EF0050] hover:bg-white/5 flex items-center justify-center">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        disabled={!!busyId}
                                                        aria-label={`Inserir o template ${t.name}`}
                                                        onClick={async () => {
                                                            setBusyId(t.id)
                                                            try { await onInsertTemplate(pages) } finally { setBusyId(null) }
                                                        }}
                                                        className="h-8 px-3 rounded-lg bg-[#EF0050] hover:bg-[#d60048] text-[12px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                                                    >
                                                        {busyId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FilePlus2 className="w-3.5 h-3.5" />}
                                                        Inserir {pages.length} páginas
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}
                        {category === "templates" && onInsertTemplate && (
                            <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))` }}>
                                {COMPONENT_STYLES.map(style => {
                                    const pages = components.filter(c => c.styleId === style.id)
                                    const cover = pages.find(c => c.category === "capa") || pages[0]
                                    if (!cover) return null
                                    return (
                                        <div key={style.id} className="rounded-xl border border-[#222] bg-[#0c0c0f] overflow-hidden flex flex-col">
                                            <ComponentPreview component={cover} context={context} />
                                            <div className="p-3 border-t border-[#222] flex items-center gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold truncate">{style.label}</p>
                                                    <p className="text-[11px] text-[#777]">{pages.length} páginas{cover.content_json.page ? " · A4" : ""}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={!!busyId}
                                                    aria-label={`Inserir o template ${style.label}`}
                                                    onClick={async () => {
                                                        setBusyId(style.id)
                                                        try { await onInsertTemplate(pages) } finally { setBusyId(null) }
                                                    }}
                                                    className="h-8 px-3 rounded-lg bg-[#EF0050] hover:bg-[#d60048] text-[12px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                                                >
                                                    {busyId === style.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FilePlus2 className="w-3.5 h-3.5" />}
                                                    Inserir {pages.length} páginas
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))` }}>
                            {visible.map(c => (
                                <div key={c.id} className="group rounded-xl border border-[#222] bg-[#0c0c0f] overflow-hidden flex flex-col">
                                    <ComponentPreview component={c} context={context} />
                                    <div className="p-3 border-t border-[#222] flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold truncate">{c.categoryLabel}</p>
                                            <p className="text-[11px] text-[#777]">{c.styleLabel}</p>
                                        </div>
                                        {hasCurrentPage && (
                                            <button
                                                type="button"
                                                title="Adicionar as secções ao fim da página atual"
                                                aria-label={`Adicionar ${c.categoryLabel} ${c.styleLabel} à página atual`}
                                                disabled={!!busyId}
                                                onClick={() => onInsertIntoCurrent(c)}
                                                className="h-8 w-8 rounded-lg border border-[#333] text-[#999] hover:text-white hover:border-[#555] flex items-center justify-center transition-colors disabled:opacity-40"
                                            >
                                                <PlusSquare className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            aria-label={`Inserir ${c.categoryLabel} ${c.styleLabel} como nova página`}
                                            disabled={!!busyId}
                                            onClick={async () => {
                                                setBusyId(c.id)
                                                try { await onInsertPage(c) } finally { setBusyId(null) }
                                            }}
                                            className="h-8 px-3 rounded-lg bg-[#EF0050] hover:bg-[#d60048] text-[12px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                                        >
                                            {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FilePlus2 className="w-3.5 h-3.5" />}
                                            Nova página
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

type PreviewBlock = ProposalComponent["content_json"]["blocks"][number]
const withExampleLines = (blocks: PreviewBlock[]): PreviewBlock[] => blocks.map(b => {
    if (b.type === "pricing-table" && !Array.isArray(b.content?.items)) return { ...b, content: { ...(b.content || {}), items: EXAMPLE_LINES } }
    if (b.content?.columns) return { ...b, content: { ...b.content, columns: b.content.columns.map(c => ({ ...c, blocks: withExampleLines(c.blocks || []) })) } }
    return b
})

/** The component drawn by the real block renderer at full width, scaled down to the card's width */
export function ComponentPreview({ component, context }: { component: ProposalComponent, context: ComponentContext }) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(CARD_WIDTH)
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const content = React.useMemo(() => instantiateComponent(component, context), [component, context])
    const blocks = React.useMemo(() => withExampleLines(content.blocks), [content])
    // A page designed for a format is drawn at that width (A4: 794px), the others at the web width
    const format = (content as { page?: { format: string, orientation?: "portrait" | "landscape" } }).page
    const designWidth = format ? resolvePage(format).width : PREVIEW_WIDTH
    const scale = width / designWidth

    return (
        <div ref={ref} className="relative h-[200px] overflow-hidden bg-white" aria-hidden>
            <div
                className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
                style={{ width: designWidth, transform: `scale(${scale})`, ...pageBackground(content.style), minHeight: 200 / scale }}
            >
                <div className={cn("prose max-w-none text-gray-600", !format && "px-10 py-12")} style={pageTextColor(content.style) ? { color: pageTextColor(content.style) } : undefined}>
                    {blocks.map(block => {
                        // Each section with its own background, padding and margins, as on the page
                        const look = sectionStyles((block as { content?: { settings?: never } }).content?.settings, { isReadOnly: true, defaultPadding: 40 })
                        return (
                            <div key={block.id} className={format ? "" : "mb-6"} style={format ? look.outer : undefined}>
                                <div className="flex flex-col w-full" style={format ? look.inner : undefined}>
                                    <BlockRenderer block={block as never} isReadOnly onUpdate={() => { }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
