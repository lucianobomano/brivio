"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { Search, Loader2, ChevronDown, Check, X, PencilLine, RotateCcw, LayoutGrid, Globe, Lock, Rows3, Columns3, Square, Image as ImageIcon, Sparkles, Bookmark } from "lucide-react"
import { getComponents, getPresetOverrides, resetPresetOverride, type PresetOverride } from "@/app/actions/components"
import { toast } from "sonner"
import { Block } from "./types"
import { cn } from "@/lib/utils"
import { getContrastColor } from "./blocks/ColorUtils"
import { ComponentPreview } from "./ComponentPreview"
import { COMPONENT_PRESETS, COMPONENT_TOPICS, ComponentKind, ComponentTopic, ColumnData, inferComponentKind } from "./componentPresets"

interface ComponentsLibraryProps {
    isOpen: boolean
    onClose: () => void
    brandId: string
    onSelectComponent: (component: Block | ColumnData, kind: ComponentKind) => void
    /** Superadmins: edit a ready-made template (placed on the page to be edited, then saved over it) */
    onEditTemplate?: (template: { id: string, name: string, description?: string, kind: ComponentKind, data: Block | ColumnData }) => void
}

interface LibraryItem {
    id: string
    name: string
    description?: string
    kind: ComponentKind
    topic?: ComponentTopic
    source: 'preset' | 'saved'
    isPublic?: boolean
    data: Block | ColumnData
    /** A ready-made template rewritten by a superadmin */
    edited?: boolean
    /** Ids its rewritten versions are stored under */
    overrideIds?: string[]
}

const KIND_TABS: { id: ComponentKind | 'all', label: string, icon: typeof Rows3 }[] = [
    { id: 'all', label: 'Todos', icon: LayoutGrid },
    { id: 'section', label: 'Secções', icon: Rows3 },
    { id: 'column', label: 'Colunas', icon: Columns3 },
    { id: 'block', label: 'Blocos', icon: Square },
]

const KIND_LABEL: Record<ComponentKind, string> = { section: 'Secção', column: 'Coluna', block: 'Bloco' }

// ---------- Schematic thumbnails drawn from the component's own blocks ----------

const BlockGlyph = ({ block, ink }: { block: Block, ink: string }) => {
    const c = block.content || {}
    switch (block.type as string) {
        case 'heading':
        case 'headline': {
            const size = parseInt(c.style?.fontSize) || 40
            const h = Math.max(3, Math.min(14, size / 7))
            const len = Math.min(100, 25 + String(c.text || '').length * 4)
            return <div className="rounded-[2px]" style={{ height: h, width: `${len}%`, backgroundColor: c.style?.color || ink, opacity: 0.85 }} />
        }
        case 'text':
            return (
                <div className="flex flex-col gap-[3px] w-full">
                    {[100, 92, 70].map(w => <div key={w} className="h-[2px] rounded-full" style={{ width: `${w}%`, backgroundColor: c.style?.color || ink, opacity: 0.35 }} />)}
                </div>
            )
        case 'palette': {
            const colors = (c.colors || []) as { id: string, value: string }[]
            const accordion = c.settings?.layout === 'accordion'
            return (
                <div className="flex gap-[3px] w-full h-[34px]">
                    {colors.map((col, i) => (
                        <div key={col.id} className="rounded-[3px] ring-1 ring-black/5" style={{ backgroundColor: col.value, flex: accordion && i === 0 ? 4 : 1 }} />
                    ))}
                </div>
            )
        }
        case 'image':
        case 'video':
        case 'gallery':
        case 'carousel':
            return (
                <div className="w-full aspect-[4/3] max-h-[60px] rounded-[3px] flex items-center justify-center" style={{ backgroundColor: ink, opacity: 0.12 }}>
                    <ImageIcon className="w-3.5 h-3.5" style={{ color: ink }} />
                </div>
            )
        case 'list':
            if (block.variant === 'do-dont') {
                return (
                    <div className="flex gap-[3px] w-full h-[26px]">
                        <div className="flex-1 rounded-[3px] bg-green-500/30" />
                        <div className="flex-1 rounded-[3px] bg-red-500/30" />
                    </div>
                )
            }
            return (
                <div className="flex flex-col gap-[3px] w-full">
                    {[60, 50, 55].map((w, i) => (
                        <div key={i} className="flex items-center gap-[3px]">
                            <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: ink, opacity: 0.5 }} />
                            <div className="h-[2px] rounded-full" style={{ width: `${w}%`, backgroundColor: ink, opacity: 0.35 }} />
                        </div>
                    ))}
                </div>
            )
        case 'index': {
            const s = c.settings || {}
            const textInk = s.textColor || ink
            const accent = s.accentColor || '#FF4D3D'
            const rows = ((c.items || []) as unknown[]).slice(0, 5)
            if (s.style === 'cards') {
                return (
                    <div className="grid grid-cols-3 gap-[3px] w-full">
                        {rows.map((_, i) => (
                            <div key={i} className="h-[22px] rounded-[3px] border p-[3px] flex flex-col justify-end" style={{ borderColor: textInk + '33', backgroundColor: i === 0 ? textInk + '14' : undefined }}>
                                <div className="h-[3px] w-[60%] rounded-full" style={{ backgroundColor: textInk, opacity: 0.8 }} />
                            </div>
                        ))}
                    </div>
                )
            }
            return (
                <div className="flex flex-col w-full">
                    {rows.map((_, i) => (
                        <div key={i} className="flex items-center gap-[4px] h-[11px] px-[3px] rounded-[2px]" style={{ backgroundColor: i === 0 ? textInk + '14' : undefined, borderBottom: i === 0 ? undefined : `1px solid ${textInk}1a` }}>
                            <div className="w-[5px] h-[2px] rounded-full" style={{ backgroundColor: i === 0 ? accent : textInk, opacity: i === 0 ? 1 : 0.4 }} />
                            <div className="h-[4px] rounded-[1px]" style={{ width: `${30 + (i * 13) % 25}%`, backgroundColor: textInk, opacity: 0.85 }} />
                            <div className="ml-auto w-[6px] h-[6px] rounded-full" style={i === 0 ? { backgroundColor: accent } : { border: `1px solid ${textInk}`, opacity: 0.4 }} />
                        </div>
                    ))}
                </div>
            )
        }
        case 'button':
            return <div className="h-[8px] w-[40%] rounded-full" style={{ backgroundColor: c.style?.backgroundColor || '#FF0054' }} />
        case 'story':
            return (
                <div className="flex flex-col gap-[4px] w-full">
                    <div className="flex gap-[3px]">
                        <div className="flex-1 h-[2px] rounded-full bg-[#FF0054]" />
                        <div className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: ink, opacity: 0.2 }} />
                        <div className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: ink, opacity: 0.2 }} />
                    </div>
                    <div className="h-[6px] w-[45%] rounded-[2px]" style={{ backgroundColor: ink, opacity: 0.8 }} />
                    <div className="h-[2px] w-[80%] rounded-full" style={{ backgroundColor: ink, opacity: 0.35 }} />
                </div>
            )
        default:
            return <div className="w-full h-[14px] rounded-[3px]" style={{ backgroundColor: ink, opacity: 0.1 }} />
    }
}

const ColumnGlyph = ({ column, ink, flex = 1 }: { column: ColumnData, ink: string, flex?: number }) => {
    const v = column.settings?.alignVertical
    return (
        <div
            className="flex flex-col gap-[5px] min-w-0"
            style={{ flex, justifyContent: v === 'bottom' ? 'flex-end' : v === 'middle' ? 'center' : 'flex-start' }}
        >
            {(column.blocks || []).map(b => <BlockGlyph key={b.id} block={b} ink={ink} />)}
        </div>
    )
}

const ComponentThumbnail = ({ item }: { item: LibraryItem }) => {
    const section = item.kind === 'section' ? item.data as Block : null
    const bg = (section?.content?.settings?.backgroundColor as string | undefined) || '#FFFFFF'
    const ink = getContrastColor(bg) === '#ffffff' ? '#FFFFFF' : '#15161B'

    return (
        <div className="aspect-[4/3] rounded-lg overflow-hidden p-4 flex" style={{ backgroundColor: bg }}>
            {section ? (
                <div className="flex gap-3 w-full">
                    {((section.content?.columns || []) as ColumnData[]).map((col, i) => (
                        <ColumnGlyph key={col.id} column={col} ink={ink} flex={section.content?.settings?.columnWidths?.[i] || 1} />
                    ))}
                </div>
            ) : item.kind === 'column' ? (
                <div className="flex w-full justify-center">
                    <div className="w-[60%] flex border border-dashed border-black/10 rounded p-2">
                        <ColumnGlyph column={item.data as ColumnData} ink={ink} />
                    </div>
                </div>
            ) : (
                <div className="flex w-full items-center">
                    <div className="w-full"><BlockGlyph block={item.data as Block} ink={ink} /></div>
                </div>
            )}
        </div>
    )
}

// ---------- Topic dropdown ----------

/** Topics grouped like the brandbook's chapters, for the dropdown */
const TOPIC_GROUPS: { label: string, ids: string[] }[] = [
    { label: 'Geral', ids: ['cover', 'index', 'intro', 'philosophy', 'strategy', 'marquee', 'footer'] },
    { label: 'Identidade visual', ids: ['logo', 'color', 'typography', 'iconography', 'imagery', 'mockups', 'social', 'styleguide', 'illustration', 'grid', 'graphics', 'motion', 'offline'] },
    { label: 'Identidade verbal', ids: ['personality', 'voice', 'language', 'slogans', 'naming', 'storytelling', 'copywriting'] },
    { label: 'Identidade sensorial', ids: ['sound', 'scent', 'touch', 'taste', 'multisensory'] },
]

const TopicSelect = ({ value, onChange, countFor }: { value: ComponentTopic | 'all', onChange: (t: ComponentTopic | 'all') => void, countFor: (t: ComponentTopic | 'all') => number }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!open) return
        const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('keydown', onKey, true)
        return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true) }
    }, [open])

    const known = new Set(TOPIC_GROUPS.flatMap(g => g.ids))
    const groups = [
        ...TOPIC_GROUPS.map(g => ({ label: g.label, topics: g.ids.map(id => COMPONENT_TOPICS.find(t => t.id === id)).filter(Boolean) as typeof COMPONENT_TOPICS })),
        { label: 'Outros', topics: COMPONENT_TOPICS.filter(t => !known.has(t.id)) },
    ].filter(g => g.topics.length)
    const current = value === 'all' ? 'Todos os temas' : COMPONENT_TOPICS.find(t => t.id === value)?.label || 'Tema'

    const option = (id: ComponentTopic | 'all', label: string) => (
        <button
            key={id}
            type="button"
            role="option"
            aria-selected={value === id}
            onClick={() => { onChange(id); setOpen(false) }}
            className={cn("w-full h-8 px-3 rounded-md flex items-center gap-2 text-[13px] text-left transition-colors", value === id ? "bg-[#FF0054]/15 text-white" : "text-[#C4CAD4] hover:bg-white/5 hover:text-white")}
        >
            <Check className={cn("w-3.5 h-3.5 shrink-0 text-[#FF0054]", value === id ? "opacity-100" : "opacity-0")} />
            <span className="flex-1 truncate">{label}</span>
            <span className="text-[10px] tabular-nums text-[#666]">{countFor(id)}</span>
        </button>
    )

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={cn("h-10 w-[210px] px-3 rounded-lg bg-[#15161B] border text-[13px] text-white flex items-center gap-2 transition-colors", open ? "border-[#FF0054]" : "border-white/10 hover:border-white/25")}
            >
                <span className="flex-1 truncate text-left">{current}</span>
                <span className="text-[10px] tabular-nums text-[#666]">{countFor(value)}</span>
                <ChevronDown className={cn("w-4 h-4 text-[#97A1B3] transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className="absolute top-full inset-x-0 mt-2 max-h-[420px] overflow-y-auto custom-scrollbar rounded-xl bg-[#1F1F25] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top" role="listbox">
                    {option('all', 'Todos os temas')}
                    {groups.map(g => (
                        <div key={g.label} className="mt-2">
                            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#666]">{g.label}</div>
                            {g.topics.map(t => option(t.id, t.label))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ---------- Library ----------

export function ComponentsLibrary({ isOpen, onClose, brandId, onSelectComponent, onEditTemplate }: ComponentsLibraryProps) {
    const [components, setComponents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [kind, setKind] = useState<ComponentKind | 'all'>('all')
    const [topic, setTopic] = useState<ComponentTopic | 'all'>('all')
    const [source, setSource] = useState<'all' | 'preset' | 'saved'>('all')
    // Search: an icon that opens a capsule over the filters
    const [searchOpen, setSearchOpen] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!searchOpen) return
        const id = window.setTimeout(() => searchRef.current?.focus(), 120)
        return () => window.clearTimeout(id)
    }, [searchOpen])
    const closeSearch = () => { setSearchOpen(false); setSearchTerm('') }

    useEffect(() => {
        if (isOpen && brandId) {
            loadComponents()
        }
    }, [isOpen, brandId])

    // Ready-made templates rewritten by superadmins replace the built-in version for everyone
    const [overrides, setOverrides] = useState<Record<string, PresetOverride>>({})
    const loadOverrides = () => getPresetOverrides().then(r => {
        if (r.success) setOverrides(Object.fromEntries(r.overrides.map(o => [o.presetId, o])))
    })
    useEffect(() => { if (isOpen) loadOverrides() }, [isOpen])

    const resetTemplate = async (ids: string[]) => {
        const r = await resetPresetOverride(ids)
        if (r.success) { toast.success('Template reposto na versão original'); loadOverrides() }
        else toast.error(r.error || 'Não foi possível repor o template')
    }

    const loadComponents = async () => {
        setIsLoading(true)
        try {
            const result = await getComponents(brandId)
            if (result.success && result.components) {
                setComponents(result.components)
            }
        } catch (error) {
            console.error("Failed to load components:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Templates saved before the marker kept its template id were stored under a random id: they are matched
    // to their template by kind and name (the latest one wins), when that name is not shared by other templates
    const renamedOverrides = useMemo(() => {
        const known = new Set(COMPONENT_PRESETS.map(p => p.id))
        const names = new Map<string, number>()
        COMPONENT_PRESETS.forEach(p => names.set(`${p.kind}:${p.name}`, (names.get(`${p.kind}:${p.name}`) || 0) + 1))
        const out: Record<string, PresetOverride> = {}
        Object.values(overrides)
            .filter(o => !known.has(o.presetId) && names.get(`${o.kind}:${o.name}`) === 1)
            .sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)))
            .forEach(o => { out[`${o.kind}:${o.name}`] = o })
        return out
    }, [overrides])

    const items = useMemo<LibraryItem[]>(() => [
        ...COMPONENT_PRESETS.map(p => {
            const o = overrides[p.id] || renamedOverrides[`${p.kind}:${p.name}`]
            // Every stored version of this template (also the ones saved under a random id), so «Original» removes them all
            const overrideIds = Object.values(overrides).filter(x => x.presetId === p.id || (x.kind === p.kind && x.name === p.name)).map(x => x.presetId)
            return o
                ? { ...p, name: o.name || p.name, description: o.description || p.description, data: o.data as Block | ColumnData, source: 'preset' as const, edited: true, overrideIds }
                : { ...p, source: 'preset' as const }
        }),
        ...components.map(c => ({
            id: c.id,
            name: c.name,
            description: `Guardado em ${new Date(c.created_at).toLocaleDateString()}`,
            kind: inferComponentKind(c.content_json),
            source: 'saved' as const,
            isPublic: c.is_public,
            data: c.content_json,
        })),
    ], [components, overrides, renamedOverrides])

    const filtered = items.filter(item => {
        if (kind !== 'all' && item.kind !== kind) return false
        if (source !== 'all' && item.source !== source) return false
        // Saved components have no topic, so a topic filter shows presets only
        if (topic !== 'all' && item.topic !== topic) return false
        const q = searchTerm.trim().toLowerCase()
        return !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)
    })

    const countFor = (k: ComponentKind | 'all') => items.filter(i => k === 'all' || i.kind === k).length
    const countTopic = (t: ComponentTopic | 'all') => items.filter(i => (kind === 'all' || i.kind === kind) && (t === 'all' || i.topic === t)).length

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-[#1A1A20] w-full max-w-[1040px] h-[85vh] max-h-[820px] flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 bg-[#FF0054] shrink-0">
                    <h3 className="text-white font-medium text-[18px] select-none">Biblioteca de Componentes</h3>
                    <button
                        onClick={onClose}
                        title="Fechar"
                        className="w-5 h-5 rounded-full bg-white hover:opacity-80 transition-opacity"
                    >
                        <span className="sr-only">Fechar</span>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="relative z-20 px-6 py-4 border-b border-white/5 bg-[#1A1A20] shrink-0">
                    {/* Filters: they step back while the search capsule is open */}
                    <div
                        className={cn(
                            "flex items-center gap-3 transition-all duration-300 ease-out",
                            searchOpen ? "opacity-0 scale-[0.97] blur-[2px] pointer-events-none" : "opacity-100 scale-100 blur-0"
                        )}
                        aria-hidden={searchOpen}
                    >
                        <div className="flex gap-1 bg-[#15161B] p-1 rounded-lg border border-white/5 shrink-0">
                            {KIND_TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setKind(tab.id)}
                                    className={cn(
                                        "h-8 px-2.5 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap",
                                        kind === tab.id ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    <span className={cn("text-[10px] tabular-nums", kind === tab.id ? "text-white/70" : "text-[#555]")}>{countFor(tab.id)}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-1 bg-[#15161B] p-1 rounded-lg border border-white/5 shrink-0">
                            {([
                                { id: 'all', label: 'Todos', icon: null },
                                { id: 'preset', label: 'Prontos', icon: Sparkles },
                                { id: 'saved', label: 'Guardados', icon: Bookmark },
                            ] as const).map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSource(opt.id)}
                                    className={cn(
                                        "h-8 px-2.5 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap",
                                        source === opt.id ? "bg-white/10 text-white" : "text-[#97A1B3] hover:text-white"
                                    )}
                                >
                                    {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <TopicSelect value={topic} onChange={setTopic} countFor={countTopic} />

                        <button
                            type="button"
                            title="Pesquisar"
                            onClick={() => setSearchOpen(true)}
                            className="ml-auto relative w-10 h-10 shrink-0 rounded-full bg-[#15161B] border border-white/10 text-[#97A1B3] hover:text-white hover:border-[#FF0054] flex items-center justify-center transition-colors"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search capsule, centred over the filters */}
                    <div className={cn("absolute inset-0 flex items-center justify-center px-6 pointer-events-none")}>
                        <div
                            className={cn(
                                "h-12 rounded-full bg-[#15161B] border flex items-center gap-3 pl-5 pr-2 shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out",
                                searchOpen
                                    ? "w-full max-w-[640px] opacity-100 scale-100 border-[#FF0054] pointer-events-auto"
                                    : "w-full max-w-[220px] opacity-0 scale-90 border-white/10"
                            )}
                            aria-hidden={!searchOpen}
                        >
                            <Search className="w-4 h-4 text-[#FF0054] shrink-0" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Pesquisar componentes, temas, estilos…"
                                value={searchTerm}
                                tabIndex={searchOpen ? 0 : -1}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); closeSearch() } }}
                                className="flex-1 min-w-0 bg-transparent text-white text-[15px] placeholder:text-[#666] outline-none"
                            />
                            {searchTerm && searchOpen && (
                                <span className="text-[11px] tabular-nums text-[#97A1B3] shrink-0">{filtered.length} resultados</span>
                            )}
                            <button
                                type="button"
                                title="Fechar pesquisa"
                                tabIndex={searchOpen ? 0 : -1}
                                onClick={closeSearch}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#FF0054] text-[#97A1B3] hover:text-white flex items-center justify-center shrink-0 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#15161B]">
                    {isLoading && source === 'saved' ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#97A1B3]">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FF0054]" />
                            <p className="text-[14px]">Carregando componentes...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#97A1B3]">
                            <LayoutGrid className="w-12 h-12 opacity-20" />
                            <p className="text-[14px]">Nenhum componente encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {filtered.map((item) => (
                                <div
                                    key={`${item.source}-${item.id}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        onSelectComponent(item.data, item.kind)
                                        onClose()
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { onSelectComponent(item.data, item.kind); onClose() } }}
                                    className="text-left bg-[#1A1A20] border border-white/5 rounded-xl p-3 cursor-pointer hover:border-[#FF0054] hover:shadow-[0_0_20px_rgba(255,0,84,0.1)] transition-all group flex flex-col"
                                >
                                    <div className="relative mb-3 ring-1 ring-white/5 rounded-lg overflow-hidden">
                                        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                                            <ComponentPreview data={item.data} kind={item.kind} topic={item.topic} fallback={<ComponentThumbnail item={item} />} />
                                        </div>
                                        <div className="absolute top-2 left-2 bg-[#15161B]/90 rounded-full px-2 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider">
                                            {KIND_LABEL[item.kind]}
                                        </div>
                                        {item.edited && (
                                            <div className="absolute top-2 right-2 bg-[#FF0054] rounded-full px-2 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider">Editado</div>
                                        )}
                                        {/* Superadmins: rewrite the template, or bring back the original */}
                                        {item.source === 'preset' && onEditTemplate && (
                                            <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                {item.edited && (
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        title="Repor a versão original"
                                                        onClick={(e) => { e.stopPropagation(); resetTemplate([item.id, ...(item.overrideIds || [])]) }}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); resetTemplate([item.id, ...(item.overrideIds || [])]) } }}
                                                        className="h-7 px-2.5 rounded-full bg-[#15161B]/95 text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-[#2A2A30]"
                                                    >
                                                        <RotateCcw className="w-3 h-3" /> Original
                                                    </span>
                                                )}
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    title="Editar este template"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onEditTemplate({ id: item.id, name: item.name, description: item.description, kind: item.kind, data: item.data })
                                                        onClose()
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key !== 'Enter') return
                                                        e.stopPropagation()
                                                        onEditTemplate({ id: item.id, name: item.name, description: item.description, kind: item.kind, data: item.data })
                                                        onClose()
                                                    }}
                                                    className="h-7 px-2.5 rounded-full bg-[#FF0054] text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-[#D90048]"
                                                >
                                                    <PencilLine className="w-3 h-3" /> Editar
                                                </span>
                                            </div>
                                        )}
                                        {item.source === 'saved' && (
                                            <div className="absolute top-2 right-2 bg-[#15161B]/90 rounded-full px-2 py-0.5 flex items-center gap-1">
                                                {item.isPublic
                                                    ? <><Globe className="w-3 h-3 text-[#00E5FF]" /><span className="text-[9px] font-medium text-[#00E5FF] uppercase tracking-wider">Público</span></>
                                                    : <><Lock className="w-3 h-3 text-[#FFB800]" /><span className="text-[9px] font-medium text-[#FFB800] uppercase tracking-wider">Privado</span></>}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-white font-medium text-[14px] truncate px-1">{item.name}</h4>
                                    {item.description && <p className="text-[#97A1B3] text-[11px] mt-1 px-1 line-clamp-2">{item.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-white/5 bg-[#1A1A20] text-[11px] text-[#666] shrink-0">
                    Secções são adicionadas ao fim da página. Colunas e blocos ficam prontos a colar: escolha onde inseri-los nas opções de colar do canvas.
                </div>
            </div>
        </div>,
        document.body
    )
}
