"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles,
    Check,
    Loader2,
    BookOpen,
    Layers,
    ArrowRight,
    ArrowLeft,
    Building2,
    PlusCircle,
    Palette,
    X,
    FolderKanban,
    AlertCircle,
    Trash2
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
    getBrandbookTemplates,
    applyTemplateToExistingBrand,
    getUserBrandsForTemplateModal,
    deleteTemplate,
    UnifiedTemplate
} from "@/app/actions/brandbook-templates"
import { createBrand } from "@/app/actions/brands"
import { toast } from "sonner"

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

const CATEGORY_TABS = [
    { id: "all", label: "Todos" },
    { id: "agency", label: "Agência & Criativo" },
    { id: "minimalist", label: "Editorial & Minimal" },
    { id: "tech", label: "Tech & SaaS" },
    { id: "luxury", label: "Luxo & Lifestyle" },
    { id: "corporate", label: "Corporativo" },
    { id: "custom", label: "Personalizados" },
    { id: "mine", label: "Meus Templates" }
]

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

    // Filter templates based on tab
    const filteredTemplates = React.useMemo(() => {
        if (selectedCategory === "all") return templates
        if (selectedCategory === "mine") return templates.filter((t) => t.is_mine || !t.is_builtin)
        if (selectedCategory === "custom") return templates.filter((t) => !t.is_builtin || t.category === "custom")
        return templates.filter((t) => {
            if (selectedCategory === "agency") return t.category === "agency" || t.category === "creative"
            if (selectedCategory === "minimalist") return t.category === "minimalist" || t.category === "minimal"
            if (selectedCategory === "tech") return t.category === "tech" || t.category === "startup"
            return t.category === selectedCategory
        })
    }, [templates, selectedCategory])

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
            <DialogContent className="max-w-5xl w-[95vw] h-[86vh] max-h-[820px] p-0 overflow-hidden bg-[#0D0E12] border border-white/[0.08] rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col focus:outline-none text-white selection:bg-[#FF0054] selection:text-white">
                {/* Header with Steps */}
                <div className="relative px-7 py-5 border-b border-white/[0.08] shrink-0 bg-[#121318] flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF0054]" />
                            <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                                Brivio Brand Books
                            </span>
                        </div>
                        <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                            Iniciar a partir de um Template
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-400 mt-0.5">
                            {step === 1
                                ? "Escolha um guia estruturado para iniciar a identidade da sua marca com rapidez e elegância."
                                : "Defina como quer associar o template à sua nova marca ou a uma marca já criada."}
                        </DialogDescription>
                    </div>

                    {/* Step pills */}
                    <div className="hidden sm:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                        <button
                            onClick={() => setStep(1)}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                                step === 1
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <span>1. Template</span>
                            {selectedTemplateId && step === 2 && (
                                <Check className="w-3.5 h-3.5 text-[#FF0054]" />
                            )}
                        </button>
                        <button
                            onClick={() => selectedTemplateId && setStep(2)}
                            disabled={!selectedTemplateId}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:pointer-events-none",
                                step === 2
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <span>2. Marca</span>
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
                                {/* Category Filters */}
                                <div className="px-7 py-3 border-b border-white/[0.06] bg-[#0D0E12] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                                    {CATEGORY_TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setSelectedCategory(tab.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border",
                                                selectedCategory === tab.id
                                                    ? "bg-white/10 text-white border-white/20 font-medium"
                                                    : "bg-transparent text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.04]"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Templates Grid & Detail Split */}
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                                    {/* Left: Cards List */}
                                    <div className="lg:col-span-8 overflow-y-auto p-5 md:p-7 space-y-4 border-r border-white/[0.06] custom-scrollbar">
                                        {loadingTemplates ? (
                                            <div className="h-64 flex flex-col items-center justify-center gap-2.5 text-neutral-400">
                                                <Loader2 className="w-6 h-6 animate-spin text-[#FF0054]" />
                                                <span className="text-xs font-medium">
                                                    A carregar catálogo de templates...
                                                </span>
                                            </div>
                                        ) : filteredTemplates.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center gap-2 text-neutral-400 border border-dashed border-white/[0.08] rounded-xl p-6 text-center">
                                                <BookOpen className="w-8 h-8 opacity-30 text-neutral-400" />
                                                <p className="text-xs font-medium text-white">Nenhum template encontrado nesta categoria.</p>
                                                <p className="text-xs text-neutral-500">Tente selecionar outra categoria ou escolha "Todos".</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                {filteredTemplates.map((template) => {
                                                    const isSelected = selectedTemplateId === template.id
                                                    const moduleCount = template.modules_json?.length || 0

                                                    return (
                                                        <div
                                                            key={template.id}
                                                            onClick={() => setSelectedTemplateId(template.id)}
                                                            className={cn(
                                                                "group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border flex flex-col justify-between overflow-hidden",
                                                                isSelected
                                                                    ? "bg-[#15161D] border-[#FF0054]/70 shadow-[0_0_24px_rgba(255,0,84,0.08)]"
                                                                    : "bg-[#111217] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#14151C]"
                                                            )}
                                                        >
                                                            {/* Preview Box Top */}
                                                            <div
                                                                className="w-full h-24 rounded-lg mb-3.5 p-3 relative overflow-hidden flex flex-col justify-between border border-white/[0.06] bg-[#171821]"
                                                                style={{
                                                                    background: `radial-gradient(ellipse at 85% 15%, ${(template.accentColor || '#FF0054')}22 0%, rgba(20,21,28,0.95) 75%)`
                                                                }}
                                                            >
                                                                {/* Optional Thumbnail Image */}
                                                                {template.thumbnail_url && (
                                                                    <img
                                                                        src={template.thumbnail_url}
                                                                        alt={template.name}
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                    />
                                                                )}

                                                                {/* Subtle editorial skeleton lines in background for design feel */}
                                                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none p-3 flex flex-col gap-1.5 justify-center">
                                                                    <div className="w-1/3 h-2 rounded bg-white" />
                                                                    <div className="w-2/3 h-1.5 rounded bg-white" />
                                                                    <div className="w-1/2 h-1.5 rounded bg-white" />
                                                                </div>

                                                                <div className="flex items-center justify-between z-10">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/40 text-neutral-300 backdrop-blur-md border border-white/[0.08]">
                                                                            {template.categoryLabel || "Template"}
                                                                        </span>
                                                                        {!template.is_builtin && (
                                                                            <span className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[#FF0054]/15 text-[#FF0054] border border-[#FF0054]/30 backdrop-blur-md">
                                                                                Salvo
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium text-neutral-400 bg-white/[0.06] backdrop-blur-md">
                                                                            {moduleCount} seções
                                                                        </span>
                                                                        {!template.is_builtin && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => handleDeleteTemplate(e, template.id)}
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-black/60 hover:bg-red-500/80 text-neutral-400 hover:text-white backdrop-blur-md border border-white/10"
                                                                                title="Eliminar template"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Selection Badge */}
                                                                {isSelected && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-[#FF0054] text-white flex items-center justify-center shadow-md z-20"
                                                                    >
                                                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                    </motion.div>
                                                                )}
                                                            </div>

                                                            {/* Details */}
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-white mb-1 transition-colors">
                                                                    {template.name}
                                                                </h4>
                                                                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                                                                    {template.description}
                                                                </p>
                                                            </div>

                                                            {/* Tags Footer */}
                                                            <div className="flex flex-wrap gap-1 pt-2.5 border-t border-white/[0.04]">
                                                                {template.tags?.slice(0, 3).map((tag, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="text-[10px] text-neutral-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]"
                                                                    >
                                                                        #{tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Selected Template Inspector */}
                                    <div className="hidden lg:flex lg:col-span-4 flex-col bg-[#101116] p-6 overflow-y-auto custom-scrollbar justify-between">
                                        {selectedTemplate ? (
                                            <div className="space-y-5">
                                                <div>
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF0054]">
                                                        Estrutura Pré-configurada
                                                    </span>
                                                    <h3 className="text-base font-semibold text-white mt-1">
                                                        {selectedTemplate.name}
                                                    </h3>
                                                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                                        {selectedTemplate.description}
                                                    </p>
                                                </div>

                                                {/* Modules preview */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                                                        <Layers className="w-3.5 h-3.5 text-neutral-400" />
                                                        Páginas & Módulos ({selectedTemplate.modules_json?.length || 0})
                                                    </label>
                                                    <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                                        {selectedTemplate.modules_json?.map((mod, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs hover:bg-white/[0.04] transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2 text-neutral-200 min-w-0">
                                                                    <span className="text-[10px] font-mono text-neutral-500 w-4 shrink-0">
                                                                        {String(idx + 1).padStart(2, "0")}
                                                                    </span>
                                                                    <span className="font-medium truncate">{mod.title}</span>
                                                                </div>
                                                                <span className="text-[9px] font-medium text-neutral-400 px-1.5 py-0.5 rounded bg-white/[0.04] shrink-0">
                                                                    {mod.category || "Geral"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5">
                                                    <Sparkles className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                                                    <p className="text-xs text-neutral-400 leading-relaxed">
                                                        Poderá editar, adicionar e reorganizar todas as seções e blocos livremente dentro do editor.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-center text-neutral-500 text-xs">
                                                Selecione um template na lista para inspecionar seus módulos.
                                            </div>
                                        )}

                                        <button
                                            onClick={handleProceedToConfig}
                                            disabled={!selectedTemplateId}
                                            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-[#FF0054] hover:bg-[#E0004A] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 group disabled:opacity-40 shadow-sm"
                                        >
                                            <span>Configurar Marca</span>
                                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.18 }}
                                className="h-full flex flex-col p-6 md:p-9 overflow-y-auto max-w-2xl mx-auto custom-scrollbar"
                            >
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
                                                className="w-full bg-[#121319] border border-white/[0.08] focus:border-[#FF0054] focus:ring-1 focus:ring-[#FF0054]/30 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none text-xs transition-colors"
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
                                                <input
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
                                                className="w-full bg-[#121319] border border-white/[0.08] focus:border-[#FF0054] focus:ring-1 focus:ring-[#FF0054]/30 rounded-xl px-3.5 py-2 text-white placeholder:text-neutral-500 focus:outline-none text-xs transition-colors resize-none"
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
                                                    className="w-44 bg-[#121319] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF0054]"
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
                                                                    : "bg-[#111217] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#14151C]"
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="px-7 py-4 border-t border-white/[0.08] bg-[#121318] flex items-center justify-between shrink-0">
                    {step === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
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
