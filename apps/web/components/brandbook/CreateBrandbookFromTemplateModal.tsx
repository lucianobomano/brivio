"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useAsyncAction } from "@/lib/hooks/use-async-action"
import { useRouter } from "nextjs-toploader/app"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles,
    Check,
    Loader2,
    BookOpen,
    ArrowRight,
    ArrowLeft,
    Building2,
    PlusCircle,
    X,
    AlertCircle,
    Trash2,
    Search,
    ChevronDown,
    Bookmark,
    PencilLine,
    RotateCcw,
} from "lucide-react"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
    getBrandbookTemplates,
    applyTemplateToExistingBrand,
    getUserBrandsForTemplateModal,
    deleteTemplate,
    canEditBrandbookTemplates,
    startTemplateEdit,
    resetBuiltinTemplate,
    UnifiedTemplate
} from "@/app/actions/brandbook-templates"
import { createBrand } from "@/app/actions/brands"
import { toast } from "sonner"
import { SmoothColorInput } from "./editor/SmoothColorInput"

// The live cover pulls in the block renderer: loaded only when the modal shows the cards
const TemplateCover = dynamic(() => import("./TemplateCover"), {
    ssr: false,
    loading: () => <div className="w-full aspect-[4/3] rounded-lg bg-white/[0.03] animate-pulse" />,
})

export interface CreateBrandbookFromTemplateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialBrands?: Array<{
        id: string
        name: string
        slug: string
        updated_at: string
        primary_color?: string | null
        logo_url?: string | null
    }>
}

const CATEGORY_OPTIONS = [
    { id: "all", label: "Todas as categorias" },
    { id: "agency", label: "Agência & Criativo" },
    { id: "minimalist", label: "Editorial & Minimal" },
    { id: "tech", label: "Tech & SaaS" },
    { id: "luxury", label: "Luxo & Lifestyle" },
    { id: "corporate", label: "Corporativo" },
    { id: "custom", label: "Personalizados" },
]

const SOURCE_TABS = [
    { id: "all", label: "Todos", icon: null },
    { id: "builtin", label: "Prontos", icon: Sparkles },
    { id: "mine", label: "Meus", icon: Bookmark },
] as const

const matchesCategory = (t: UnifiedTemplate, category: string) => {
    if (category === "all") return true
    if (category === "custom") return !t.is_builtin || t.category === "custom"
    if (category === "agency") return t.category === "agency" || t.category === "creative"
    if (category === "minimalist") return t.category === "minimalist" || t.category === "minimal"
    if (category === "tech") return t.category === "tech" || t.category === "startup"
    return t.category === category
}

/** Category dropdown, as the topic dropdown of the components library */
const CategorySelect = ({ value, onChange, countFor }: { value: string, onChange: (v: string) => void, countFor: (v: string) => number }) => {
    const [open, setOpen] = useState(false)
    const ref = React.useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!open) return
        const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false) } }
        document.addEventListener("pointerdown", onDown, true)
        document.addEventListener("keydown", onKey, true)
        return () => { document.removeEventListener("pointerdown", onDown, true); document.removeEventListener("keydown", onKey, true) }
    }, [open])
    const current = CATEGORY_OPTIONS.find(o => o.id === value)?.label || "Categoria"
    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={cn("h-10 w-[230px] px-3 rounded-lg bg-[#15161B] border text-[13px] text-white flex items-center gap-2 transition-colors", open ? "border-[#FF0054]" : "border-white/10 hover:border-white/25")}
            >
                <span className="flex-1 truncate text-left">{current}</span>
                <span className="text-[10px] tabular-nums text-[#666]">{countFor(value)}</span>
                <ChevronDown className={cn("w-4 h-4 text-[#97A1B3] transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className="absolute top-full inset-x-0 mt-2 max-h-[420px] overflow-y-auto custom-scrollbar rounded-xl bg-[#1F1F25] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top" role="listbox">
                    {CATEGORY_OPTIONS.map(o => (
                        <button
                            key={o.id}
                            type="button"
                            role="option"
                            aria-selected={value === o.id}
                            onClick={() => { onChange(o.id); setOpen(false) }}
                            className={cn("w-full h-8 px-3 rounded-md flex items-center gap-2 text-[13px] text-left transition-colors", value === o.id ? "bg-[#FF0054]/15 text-white" : "text-[#C4CAD4] hover:bg-white/5 hover:text-white")}
                        >
                            <Check className={cn("w-3.5 h-3.5 shrink-0 text-[#FF0054]", value === o.id ? "opacity-100" : "opacity-0")} />
                            <span className="flex-1 truncate">{o.label}</span>
                            <span className="text-[10px] tabular-nums text-[#666]">{countFor(o.id)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

const ACCENT_PRESETS = [
    "#FF0054",
    "#88007F",
    "#06D6A0",
    "#311C99",
    "#3B82F6",
    "#F59E0B",
    "#10B981",
    "#6366F1"
]

export function CreateBrandbookFromTemplateModal({
    open,
    onOpenChange,
    initialBrands = []
}: CreateBrandbookFromTemplateModalProps) {
    const router = useRouter()

    // Step state: 1 = Choose Template, 2 = Configure Brand
    const [step, setStep] = useState<1 | 2>(1)

    // Data states
    const [templates, setTemplates] = useState<UnifiedTemplate[]>([])
    const [loadingTemplates, setLoadingTemplates] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [source, setSource] = useState<"all" | "builtin" | "mine">("all")
    // Search: an icon that opens a capsule over the filters (as in the components library)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const searchRef = React.useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!searchOpen) return
        const id = window.setTimeout(() => searchRef.current?.focus(), 120)
        return () => window.clearTimeout(id)
    }, [searchOpen])
    const closeSearch = () => { setSearchOpen(false); setSearchTerm("") }
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

    // Brands state for existing brand selection
    const [brands, setBrands] = useState(initialBrands)
    const [loadingBrands, setLoadingBrands] = useState(false)

    // Brand configuration state
    const [brandMode, setBrandMode] = useState<"new" | "existing">("new")
    const [newBrandName, setNewBrandName] = useState("")
    const [newBrandDescription, setNewBrandDescription] = useState("")
    const [selectedColor, setSelectedColor] = useState("#FF0054")
    const [selectedExistingBrandId, setSelectedExistingBrandId] = useState<string | null>(null)

    // Submission & UI feedback
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchBrand, setSearchBrand] = useState("")

    // Superadmins can edit the templates in place
    const [canEdit, setCanEdit] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    useEffect(() => {
        if (open) canEditBrandbookTemplates().then(setCanEdit).catch(() => setCanEdit(false))
    }, [open])

    const reloadTemplates = () => getBrandbookTemplates().then((res) => { if (res.success && res.templates) setTemplates(res.templates) })

    /** Opens the template in the editor; saving there writes into this same template */
    const handleEditTemplate = async (template: UnifiedTemplate) => {
        if (editingId) return
        setEditingId(template.id)
        const toastId = toast.loading(`A abrir «${template.name}» para edição…`)
        try {
            const res = await startTemplateEdit(template.id)
            if (!res.success || !res.brandId) {
                toast.error(res.error || "Não foi possível abrir o template.", { id: toastId })
                return
            }
            toast.success("Template aberto. As alterações guardam-se no mesmo template.", { id: toastId })
            onOpenChange(false)
            router.push(`/brand/${res.brandId}/brandbook?editTemplate=${encodeURIComponent(template.id)}`)
        } catch {
            toast.error("Não foi possível abrir o template.", { id: toastId })
        } finally {
            setEditingId(null)
        }
    }

    const handleResetTemplate = async (template: UnifiedTemplate) => {
        if (!confirm(`Repor «${template.name}» na versão original? As edições feitas a este template perdem-se.`)) return
        const res = await resetBuiltinTemplate(template.id)
        if (res.success) { toast.success("Template reposto na versão original."); reloadTemplates() }
        else toast.error(res.error || "Não foi possível repor o template.")
    }

    // Load templates when modal opens
    React.useEffect(() => {
        if (open) {
            setLoadingTemplates(true)
            getBrandbookTemplates()
                .then((res) => {
                    if (res.success && res.templates) {
                        setTemplates(res.templates)
                        if (!selectedTemplateId && res.templates.length > 0) {
                            setSelectedTemplateId(res.templates[0].id)
                        }
                    }
                })
                .catch((err) => {
                    console.error("Error loading templates:", err)
                    toast.error("Erro ao carregar templates.")
                })
                .finally(() => setLoadingTemplates(false))

            // If initialBrands is empty, fetch user brands asynchronously
            if (!initialBrands || initialBrands.length === 0) {
                setLoadingBrands(true)
                getUserBrandsForTemplateModal()
                    .then((userBrands) => {
                        setBrands(userBrands)
                        if (userBrands.length > 0 && !selectedExistingBrandId) {
                            setSelectedExistingBrandId(userBrands[0].id)
                        }
                    })
                    .finally(() => setLoadingBrands(false))
            } else if (initialBrands.length > 0 && !selectedExistingBrandId) {
                setSelectedExistingBrandId(initialBrands[0].id)
            }
        } else {
            // Reset to step 1 on modal close
            setTimeout(() => {
                setStep(1)
                setIsSubmitting(false)
            }, 250)
        }
    }, [open])

    const selectedTemplate = React.useMemo(() => {
        return templates.find((t) => t.id === selectedTemplateId) || templates[0] || null
    }, [templates, selectedTemplateId])

    const matchesSource = (t: UnifiedTemplate, src: string) =>
        src === "all" || (src === "builtin" ? t.is_builtin : (t.is_mine || !t.is_builtin))

    // Filter templates: source, category and search
    const filteredTemplates = React.useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        return templates.filter((t) =>
            matchesSource(t, source) && matchesCategory(t, selectedCategory) &&
            (!q || t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q)))
        )
    }, [templates, selectedCategory, source, searchTerm])
    const countSource = (src: string) => templates.filter(t => matchesSource(t, src)).length
    const countCategory = (c: string) => templates.filter(t => matchesSource(t, source) && matchesCategory(t, c)).length

    // Busy state + double-submit guard for confirm/save actions
    const [runAction, isActionPending] = useAsyncAction(async (fn: () => unknown) => { await fn() })

    const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string) => {
        e.stopPropagation()
        if (!confirm("Tem a certeza que pretende eliminar este template de Brand Book?")) return
        try {
            const res = await deleteTemplate(templateId)
            if (res.success) {
                toast.success("Template removido com sucesso!")
                setTemplates((prev) => prev.filter((t) => t.id !== templateId))
                if (selectedTemplateId === templateId) {
                    setSelectedTemplateId(null)
                }
            } else {
                toast.error(res.error || "Erro ao remover template.")
            }
        } catch {
            toast.error("Erro ao remover template.")
        }
    }

    // Filter existing brands based on search
    const filteredBrands = React.useMemo(() => {
        if (!searchBrand.trim()) return brands
        return brands.filter((b) =>
            b.name.toLowerCase().includes(searchBrand.toLowerCase())
        )
    }, [brands, searchBrand])

    const handleProceedToConfig = () => {
        if (!selectedTemplateId) {
            toast.error("Por favor, selecione um template para continuar.")
            return
        }
        setStep(2)
    }

    const handleSubmit = async () => {
        if (!selectedTemplateId) {
            toast.error("Selecione um template.")
            return
        }

        setIsSubmitting(true)

        try {
            if (brandMode === "new") {
                if (!newBrandName.trim()) {
                    toast.error("Por favor, introduza o nome da marca.")
                    setIsSubmitting(false)
                    return
                }

                const formData = new FormData()
                formData.append("name", newBrandName.trim())
                formData.append("templateId", selectedTemplateId)
                formData.append("primaryColor", selectedColor)
                if (newBrandDescription.trim()) {
                    formData.append("description", newBrandDescription.trim())
                }

                const result = await createBrand(formData)

                if (result.success && result.brandId) {
                    toast.success("Brand Book criado com sucesso a partir do template!")
                    onOpenChange(false)
                    router.push(`/brand/${result.brandId}/brandbook`)
                } else {
                    toast.error(result.error || "Erro ao criar marca a partir do template.")
                    setIsSubmitting(false)
                }
            } else {
                // Apply to existing brand
                if (!selectedExistingBrandId) {
                    toast.error("Selecione a marca à qual pretende aplicar o template.")
                    setIsSubmitting(false)
                    return
                }

                const result = await applyTemplateToExistingBrand({
                    brandId: selectedExistingBrandId,
                    templateId: selectedTemplateId,
                    replaceExisting: true
                })

                if (result.success && result.brandId) {
                    toast.success("Template aplicado ao Brand Book com sucesso!")
                    onOpenChange(false)
                    router.push(`/brand/${result.brandId}/brandbook`)
                } else {
                    toast.error(result.error || "Erro ao aplicar template à marca existente.")
                    setIsSubmitting(false)
                }
            }
        } catch (err: any) {
            console.error("Submission error:", err)
            toast.error(err.message || "Erro inesperado ao processar template.")
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1040px] w-[95vw] h-[85vh] max-h-[820px] p-0 gap-0 overflow-hidden bg-[#1A1A20] border border-white/10 rounded-xl shadow-2xl flex flex-col focus:outline-none text-white selection:bg-[#FF0054] selection:text-white [&>button:last-child]:hidden">
                {/* Header (as in the components library) */}
                <div className="h-16 flex items-center justify-between gap-4 px-6 bg-[#FF0054] shrink-0">
                    <div className="min-w-0">
                        <DialogTitle className="text-white font-medium text-[18px] select-none truncate">
                            {step === 1 ? "Templates de Brand Book" : "Associar a uma marca"}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {step === 1
                                ? "Escolha um template para iniciar o brand book da sua marca."
                                : "Defina como quer associar o template a uma nova marca ou a uma marca já criada."}
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Steps */}
                        <div className="hidden sm:flex items-center gap-1 bg-black/15 p-1 rounded-full">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className={cn("h-7 px-3 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-colors", step === 1 ? "bg-white text-[#FF0054]" : "text-white/80 hover:text-white")}
                            >
                                1. Template
                                {selectedTemplateId && step === 2 && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => selectedTemplateId && setStep(2)}
                                disabled={!selectedTemplateId}
                                className={cn("h-7 px-3 rounded-full text-[12px] font-semibold transition-colors disabled:opacity-40", step === 2 ? "bg-white text-[#FF0054]" : "text-white/80 hover:text-white")}
                            >
                                2. Marca
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            title="Fechar"
                            className="w-5 h-5 rounded-full bg-white hover:opacity-80 transition-opacity"
                        >
                            <span className="sr-only">Fechar</span>
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.18 }}
                                className="h-full flex flex-col"
                            >
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
                                            {SOURCE_TABS.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setSource(tab.id)}
                                                    className={cn(
                                                        "h-8 px-2.5 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap",
                                                        source === tab.id ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white"
                                                    )}
                                                >
                                                    {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                                                    {tab.label}
                                                    <span className={cn("text-[10px] tabular-nums", source === tab.id ? "text-white/70" : "text-[#555]")}>{countSource(tab.id)}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <CategorySelect value={selectedCategory} onChange={setSelectedCategory} countFor={countCategory} />

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
                                    <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
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
                                                placeholder="Pesquisar templates…"
                                                value={searchTerm}
                                                tabIndex={searchOpen ? 0 : -1}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); closeSearch() } }}
                                                className="flex-1 min-w-0 bg-transparent text-white text-[15px] placeholder:text-[#666] outline-none"
                                            />
                                            {searchTerm && searchOpen && (
                                                <span className="text-[11px] tabular-nums text-[#97A1B3] shrink-0">{filteredTemplates.length} resultados</span>
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

                                {/* Cards: the cover (the template's first page) and the name */}
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#15161B]">
                                    {loadingTemplates ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#97A1B3]">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#FF0054]" />
                                            <p className="text-[14px]">A carregar templates…</p>
                                        </div>
                                    ) : filteredTemplates.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#97A1B3]">
                                            <BookOpen className="w-12 h-12 opacity-20" />
                                            <p className="text-[14px]">Nenhum template encontrado.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {filteredTemplates.map((template) => {
                                                const isSelected = selectedTemplateId === template.id
                                                return (
                                                    <div
                                                        key={template.id}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-pressed={isSelected}
                                                        onClick={() => setSelectedTemplateId(template.id)}
                                                        // Double click: choose it and go on
                                                        onDoubleClick={() => { setSelectedTemplateId(template.id); setStep(2) }}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { setSelectedTemplateId(template.id); setStep(2) } }}
                                                        className={cn(
                                                            "text-left bg-[#1A1A20] border rounded-xl p-3 cursor-pointer transition-all group flex flex-col outline-none focus-visible:border-[#FF0054]",
                                                            isSelected
                                                                ? "border-[#FF0054] shadow-[0_0_20px_rgba(255,0,84,0.15)]"
                                                                : "border-white/5 hover:border-[#FF0054] hover:shadow-[0_0_20px_rgba(255,0,84,0.1)]"
                                                        )}
                                                    >
                                                        <div className="relative mb-3 ring-1 ring-white/5 rounded-lg overflow-hidden">
                                                            <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                                                                <TemplateCover modules={template.modules_json} accentColor={template.accentColor} name={template.name} />
                                                            </div>
                                                            {isSelected && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FF0054] text-white flex items-center justify-center shadow-md z-10"
                                                                >
                                                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                </motion.div>
                                                            )}
                                                            {template.is_edited && (
                                                                <div className="absolute top-2 left-2 bg-[#FF0054] rounded-full px-2 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider z-10">Editado</div>
                                                            )}
                                                            {/* Superadmins: edit the template in place, or bring a Brivio template back to its original */}
                                                            {canEdit && (
                                                                <div
                                                                    className="absolute bottom-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10"
                                                                    onDoubleClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        title="Editar este template (as alterações guardam-se nele)"
                                                                        disabled={!!editingId}
                                                                        onClick={(e) => { e.stopPropagation(); handleEditTemplate(template) }}
                                                                        className="h-7 px-2.5 rounded-full bg-[#FF0054] text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-[#D90048] disabled:opacity-60"
                                                                    >
                                                                        {editingId === template.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PencilLine className="w-3 h-3" />} Editar
                                                                    </button>
                                                                    {template.is_builtin && template.is_edited && (
                                                                        <button
                                                                            type="button"
                                                                            title="Repor a versão original"
                                                                            onClick={(e) => { e.stopPropagation(); handleResetTemplate(template) }}
                                                                            className="h-7 px-2.5 rounded-full bg-[#15161B]/95 text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-[#2A2A30]"
                                                                        >
                                                                            <RotateCcw className="w-3 h-3" /> Original
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {!template.is_builtin && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); runAction(() => handleDeleteTemplate(e, template.id)) }}
                                                                    onDoubleClick={(e) => e.stopPropagation()}
                                                                    className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[#15161B]/95 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all z-10"
                                                                    title="Eliminar template"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <h4 className="text-white font-medium text-[14px] truncate px-1">{template.name}</h4>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.18 }}
                                className="h-full overflow-y-auto custom-scrollbar bg-[#15161B]"
                            >
                                <div className="max-w-2xl mx-auto p-6 md:p-9">
                                <div className="mb-7">
                                    <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase mb-1 block">
                                        Passo 2 de 2
                                    </span>
                                    <h3 className="text-xl font-semibold text-white">
                                        Como deseja associar este Brand Book?
                                    </h3>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        Template selecionado:{" "}
                                        <strong className="text-white font-medium">{selectedTemplate?.name}</strong>{" "}
                                        ({selectedTemplate?.modules_json?.length || 0} seções).
                                    </p>
                                </div>

                                {/* Mode Switcher */}
                                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-7">
                                    <button
                                        type="button"
                                        onClick={() => setBrandMode("new")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors",
                                            brandMode === "new"
                                                ? "bg-white/10 text-white shadow-sm"
                                                : "text-neutral-400 hover:text-white"
                                        )}
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        <span>Criar Nova Marca</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setBrandMode("existing")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors",
                                            brandMode === "existing"
                                                ? "bg-white/10 text-white shadow-sm"
                                                : "text-neutral-400 hover:text-white"
                                        )}
                                    >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>Marca Existente ({brands.length})</span>
                                    </button>
                                </div>

                                {/* Form Content based on mode */}
                                {brandMode === "new" ? (
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                                Nome da Marca / Projeto <span className="text-[#FF0054]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Aurora Studio, Kaizen Digital, Nexa..."
                                                value={newBrandName}
                                                onChange={(e) => setNewBrandName(e.target.value)}
                                                className="w-full bg-[#1A1A20] border border-white/[0.08] focus:border-[#FF0054] focus:ring-1 focus:ring-[#FF0054]/30 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none text-xs transition-colors"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-neutral-300 mb-2">
                                                Cor Primária de Destaque
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    {ACCENT_PRESETS.map((color) => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setSelectedColor(color)}
                                                            className={cn(
                                                                "w-7 h-7 rounded-full transition-transform flex items-center justify-center",
                                                                selectedColor === color
                                                                    ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0D0E12]"
                                                                    : "hover:scale-105 opacity-80 hover:opacity-100"
                                                            )}
                                                            style={{ backgroundColor: color }}
                                                        >
                                                            {selectedColor === color && (
                                                                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                                <SmoothColorInput
                                                    type="color"
                                                    value={selectedColor}
                                                    onChange={(e) => setSelectedColor(e.target.value)}
                                                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                                                    title="Cor personalizada"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                                Descrição Breve (Opcional)
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder="Breve resumo sobre o propósito da marca ou indústria..."
                                                value={newBrandDescription}
                                                onChange={(e) => setNewBrandDescription(e.target.value)}
                                                className="w-full bg-[#1A1A20] border border-white/[0.08] focus:border-[#FF0054] focus:ring-1 focus:ring-[#FF0054]/30 rounded-xl px-3.5 py-2 text-white placeholder:text-neutral-500 focus:outline-none text-xs transition-colors resize-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="block text-xs font-medium text-neutral-300">
                                                Selecione uma das suas marcas
                                            </label>
                                            {brands.length > 4 && (
                                                <input
                                                    type="text"
                                                    placeholder="Pesquisar marca..."
                                                    value={searchBrand}
                                                    onChange={(e) => setSearchBrand(e.target.value)}
                                                    className="w-44 bg-[#1A1A20] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0054]"
                                                />
                                            )}
                                        </div>

                                        {loadingBrands ? (
                                            <div className="h-40 flex items-center justify-center gap-2 text-neutral-400 text-xs">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#FF0054]" />
                                                <span>A carregar as suas marcas...</span>
                                            </div>
                                        ) : filteredBrands.length === 0 ? (
                                            <div className="p-8 text-center border border-dashed border-white/[0.08] rounded-xl">
                                                <Building2 className="w-7 h-7 mx-auto text-neutral-500 mb-2" />
                                                <p className="text-xs font-medium text-white">Nenhuma marca disponível</p>
                                                <p className="text-xs text-neutral-400 mt-1 mb-4">
                                                    Não encontramos marcas existentes no seu espaço. Crie uma nova marca acima!
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setBrandMode("new")}
                                                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
                                                >
                                                    Mudar para Nova Marca
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                                {filteredBrands.map((b) => {
                                                    const isSelected = selectedExistingBrandId === b.id

                                                    return (
                                                        <div
                                                            key={b.id}
                                                            onClick={() => setSelectedExistingBrandId(b.id)}
                                                            className={cn(
                                                                "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                                                                isSelected
                                                                    ? "bg-[#15161D] border-[#FF0054]/70 shadow-[0_0_16px_rgba(255,0,84,0.06)]"
                                                                    : "bg-[#1A1A20] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#14151C]"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                                                                    style={{
                                                                        backgroundColor: b.primary_color || "#311C99"
                                                                    }}
                                                                >
                                                                    {b.name[0]?.toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-xs text-white truncate">{b.name}</p>
                                                                    <p className="text-[10px] text-neutral-400 truncate">/{b.slug}</p>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-5 h-5 rounded-full bg-[#FF0054] flex items-center justify-center text-white shrink-0">
                                                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5 text-neutral-400 text-xs leading-relaxed">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
                                            <span>
                                                Ao aplicar este template, o Brand Book da marca selecionada será populado com as{" "}
                                                <strong className="text-neutral-200">{selectedTemplate?.modules_json?.length || 0} seções</strong> do modelo{" "}
                                                <strong className="text-neutral-200">{selectedTemplate?.name}</strong>.
                                            </span>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-3 border-t border-white/5 bg-[#1A1A20] flex items-center justify-between gap-4 shrink-0">
                    {step === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            {selectedTemplate && (
                                <span className="flex-1 min-w-0 text-center text-[12px] text-[#97A1B3] truncate">
                                    <strong className="text-white font-medium">{selectedTemplate.name}</strong>
                                    {" · "}{selectedTemplate.modules_json?.length || 0} páginas
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleProceedToConfig}
                                disabled={!selectedTemplateId}
                                className="px-5 py-2.5 rounded-xl bg-[#FF0054] hover:bg-[#E0004A] text-white font-medium text-xs transition-colors flex items-center gap-1.5 group disabled:opacity-40 shadow-sm"
                            >
                                <span>Continuar</span>
                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Voltar aos Templates</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={
                                    isSubmitting ||
                                    (brandMode === "new" && !newBrandName.trim()) ||
                                    (brandMode === "existing" && !selectedExistingBrandId)
                                }
                                className="px-6 py-2.5 rounded-xl bg-[#FF0054] hover:bg-[#E0004A] text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>A processar...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>
                                            {brandMode === "new"
                                                ? "Criar Brand Book"
                                                : "Aplicar ao Brand Book"}
                                        </span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
