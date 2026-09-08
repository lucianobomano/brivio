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
            <DialogContent className="max-w-5xl w-[95vw] h-[88vh] max-h-[860px] p-0 overflow-hidden bg-[#101217] border border-white/10 rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col focus:outline-none text-white selection:bg-[#FF0054] selection:text-white">
                {/* Header with Steps */}
                <div className="relative px-8 pt-7 pb-5 border-b border-white/10 shrink-0 bg-[#15171F]/80 backdrop-blur-md flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-[#FF0054] to-[#88007F] text-[11px] font-black text-white shadow-sm">
                                <Sparkles className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-bold tracking-[0.2em] text-[#FF0054] uppercase">
                                Brivio Brand Books
                            </span>
                        </div>
                        <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            Iniciar a partir de um Template
                        </DialogTitle>
                        <DialogDescription className="text-xs md:text-sm text-gray-400 mt-1">
                            {step === 1
                                ? "Escolha um guia estruturado para iniciar a identidade da sua marca com rapidez e elegância."
                                : "Defina como quer associar o template à sua nova marca ou a uma marca já criada."}
                        </DialogDescription>
                    </div>

                    {/* Step pills */}
                    <div className="hidden sm:flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5">
                        <button
                            onClick={() => setStep(1)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                                step === 1
                                    ? "bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white shadow-md"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <span>1. Template</span>
                            {selectedTemplateId && step === 2 && (
                                <Check className="w-3.5 h-3.5 text-white" />
                            )}
                        </button>
                        <button
                            onClick={() => selectedTemplateId && setStep(2)}
                            disabled={!selectedTemplateId}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none",
                                step === 2
                                    ? "bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white shadow-md"
                                    : "text-gray-400 hover:text-white"
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
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex flex-col"
                            >
                                {/* Category Filters */}
                                <div className="px-8 py-3.5 border-b border-white/5 bg-[#12141C]/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
                                    {CATEGORY_TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setSelectedCategory(tab.id)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                                                selectedCategory === tab.id
                                                    ? "bg-white text-black border-white shadow-sm font-semibold"
                                                    : "bg-transparent text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Templates Grid & Detail Split */}
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                                    {/* Left: Cards List */}
                                    <div className="lg:col-span-8 overflow-y-auto p-6 md:p-8 space-y-4 border-r border-white/5 custom-scrollbar">
                                        {loadingTemplates ? (
                                            <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#FF0054]" />
                                                <span className="text-xs uppercase tracking-widest font-semibold">
                                                    A carregar catálogo de templates...
                                                </span>
                                            </div>
                                        ) : filteredTemplates.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-400 border border-dashed border-white/10 rounded-2xl p-6 text-center">
                                                <BookOpen className="w-10 h-10 opacity-30 text-[#FF0054]" />
                                                <p className="text-sm font-medium text-white">Nenhum template encontrado nesta categoria.</p>
                                                <p className="text-xs text-gray-500">Tente selecionar outra categoria ou escolha "Todos".</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {filteredTemplates.map((template) => {
                                                    const isSelected = selectedTemplateId === template.id
                                                    const moduleCount = template.modules_json?.length || 0

                                                    return (
                                                        <div
                                                            key={template.id}
                                                            onClick={() => setSelectedTemplateId(template.id)}
                                                            className={cn(
                                                                "group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border flex flex-col justify-between overflow-hidden",
                                                                isSelected
                                                                    ? "bg-[#181A24] border-[#FF0054] ring-2 ring-[#FF0054]/30 shadow-lg shadow-[#FF0054]/10 scale-[1.01]"
                                                                    : "bg-[#14161F] border-white/10 hover:border-white/20 hover:bg-[#181A24]/60"
                                                            )}
                                                        >
                                                            {/* Gradient Banner Top */}
                                                            <div
                                                                className="w-full h-24 rounded-xl mb-4 p-3 relative overflow-hidden flex flex-col justify-between"
                                                                style={{ background: template.gradient }}
                                                            >
                                                                {/* Optional Thumbnail Image */}
                                                                {template.thumbnail_url && (
                                                                    <img
                                                                        src={template.thumbnail_url}
                                                                        alt={template.name}
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                    />
                                                                )}

                                                                <div className="flex items-center justify-between z-10">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/10">
                                                                            {template.categoryLabel || "Template"}
                                                                        </span>
                                                                        {!template.is_builtin && (
                                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[#FF0054]/40 text-white border border-[#FF0054]/50 backdrop-blur-md">
                                                                                Template Salvo
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white backdrop-blur-md">
                                                                            {moduleCount} seções
                                                                        </span>
                                                                        {!template.is_builtin && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => handleDeleteTemplate(e, template.id)}
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-black/60 hover:bg-red-500/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10"
                                                                                title="Eliminar template"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Selection Badge */}
                                                                {isSelected && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-[#FF0054] text-white flex items-center justify-center shadow-lg border-2 border-[#101217] z-20"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </motion.div>
                                                                )}

                                                                {/* Subtle glow effect */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                                                            </div>

                                                            {/* Details */}
                                                            <div>
                                                                <h4 className="text-base font-bold text-white mb-1.5 group-hover:text-[#FF0054] transition-colors">
                                                                    {template.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                                                                    {template.description}
                                                                </p>
                                                            </div>

                                                            {/* Tags Footer */}
                                                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                                                                {template.tags?.slice(0, 3).map((tag, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-md"
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
                                    <div className="hidden lg:flex lg:col-span-4 flex-col bg-[#0D0F14]/70 p-6 overflow-y-auto custom-scrollbar justify-between">
                                        {selectedTemplate ? (
                                            <div className="space-y-5">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF0054]">
                                                        Estrutura Pré-Configurada
                                                    </span>
                                                    <h3 className="text-lg font-bold text-white mt-1">
                                                        {selectedTemplate.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                                        {selectedTemplate.description}
                                                    </p>
                                                </div>

                                                {/* Modules preview pills */}
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                                                        <Layers className="w-3.5 h-3.5 text-[#06D6A0]" />
                                                        Páginas & Módulos Incluídos ({selectedTemplate.modules_json?.length || 0})
                                                    </label>
                                                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                                        {selectedTemplate.modules_json?.map((mod, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-2 rounded-lg bg-[#15171F] border border-white/5 text-xs"
                                                            >
                                                                <div className="flex items-center gap-2 text-gray-200">
                                                                    <span className="text-[10px] font-mono text-gray-500 w-4">
                                                                        {String(idx + 1).padStart(2, "0")}
                                                                    </span>
                                                                    <span className="font-medium">{mod.title}</span>
                                                                </div>
                                                                <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 px-1.5 py-0.5 rounded bg-white/5">
                                                                    {mod.category || "Geral"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#FF0054]/10 to-[#88007F]/10 border border-[#FF0054]/20 flex items-start gap-2.5">
                                                    <Sparkles className="w-4 h-4 text-[#FF0054] shrink-0 mt-0.5" />
                                                    <p className="text-xs text-gray-300 leading-relaxed">
                                                        Poderá editar, adicionar e reorganizar todas as seções e blocos livremente dentro do editor.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-center text-gray-500 text-xs">
                                                Selecione um template na lista para inspecionar seus módulos.
                                            </div>
                                        )}

                                        <button
                                            onClick={handleProceedToConfig}
                                            disabled={!selectedTemplateId}
                                            className="w-full mt-6 py-3 px-5 rounded-xl bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white font-bold text-sm shadow-lg shadow-[#FF0054]/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            <span>Configurar Marca</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex flex-col p-6 md:p-10 overflow-y-auto max-w-3xl mx-auto custom-scrollbar"
                            >
                                <div className="mb-8">
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#FF0054] mb-1 block">
                                        Passo 2 de 2
                                    </span>
                                    <h3 className="text-2xl font-bold text-white">
                                        Como deseja associar este Brand Book?
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Template selecionado:{" "}
                                        <strong className="text-white">{selectedTemplate?.name}</strong>{" "}
                                        ({selectedTemplate?.modules_json?.length || 0} seções).
                                    </p>
                                </div>

                                {/* Mode Switcher */}
                                <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-[#14161F] border border-white/10 mb-8">
                                    <button
                                        type="button"
                                        onClick={() => setBrandMode("new")}
                                        className={cn(
                                            "flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all",
                                            brandMode === "new"
                                                ? "bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white shadow-md"
                                                : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        <span>Criar Nova Marca</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setBrandMode("existing")}
                                        className={cn(
                                            "flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all",
                                            brandMode === "existing"
                                                ? "bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white shadow-md"
                                                : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <Building2 className="w-4 h-4" />
                                        <span>Marca Existente ({brands.length})</span>
                                    </button>
                                </div>

                                {/* Form Content based on mode */}
                                {brandMode === "new" ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                                                Nome da Marca / Projeto <span className="text-[#FF0054]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Aurora Studio, Kaizen Digital, Nexa..."
                                                value={newBrandName}
                                                onChange={(e) => setNewBrandName(e.target.value)}
                                                className="w-full bg-[#151720] border border-white/10 focus:border-[#FF0054] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF0054]/20 text-sm font-medium transition-all"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
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
                                                                "w-8 h-8 rounded-full transition-transform flex items-center justify-center shadow-md",
                                                                selectedColor === color
                                                                    ? "scale-125 ring-2 ring-white"
                                                                    : "hover:scale-110 opacity-80 hover:opacity-100"
                                                            )}
                                                            style={{ backgroundColor: color }}
                                                        >
                                                            {selectedColor === color && (
                                                                <Check className="w-4 h-4 text-white" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="color"
                                                    value={selectedColor}
                                                    onChange={(e) => setSelectedColor(e.target.value)}
                                                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                                                    title="Cor personalizada"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                                                Descrição Breve (Opcional)
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder="Breve resumo sobre o propósito da marca ou indústria..."
                                                value={newBrandDescription}
                                                onChange={(e) => setNewBrandDescription(e.target.value)}
                                                className="w-full bg-[#151720] border border-white/10 focus:border-[#FF0054] rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF0054]/20 text-sm font-medium transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                                                Selecione uma das suas marcas
                                            </label>
                                            {brands.length > 4 && (
                                                <input
                                                    type="text"
                                                    placeholder="Pesquisar marca..."
                                                    value={searchBrand}
                                                    onChange={(e) => setSearchBrand(e.target.value)}
                                                    className="w-48 bg-[#151720] border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF0054]"
                                                />
                                            )}
                                        </div>

                                        {loadingBrands ? (
                                            <div className="h-40 flex items-center justify-center gap-2 text-gray-400 text-xs">
                                                <Loader2 className="w-5 h-5 animate-spin text-[#FF0054]" />
                                                <span>A carregar as suas marcas...</span>
                                            </div>
                                        ) : filteredBrands.length === 0 ? (
                                            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                                                <Building2 className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                                <p className="text-sm font-semibold text-white">Nenhuma marca disponível</p>
                                                <p className="text-xs text-gray-400 mt-1 mb-4">
                                                    Não encontramos marcas existentes no seu espaço. Crie uma nova marca acima!
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setBrandMode("new")}
                                                    className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs"
                                                >
                                                    Mudar para Nova Marca
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                                {filteredBrands.map((b) => {
                                                    const isSelected = selectedExistingBrandId === b.id

                                                    return (
                                                        <div
                                                            key={b.id}
                                                            onClick={() => setSelectedExistingBrandId(b.id)}
                                                            className={cn(
                                                                "p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                                                                isSelected
                                                                    ? "bg-[#181A24] border-[#FF0054] ring-2 ring-[#FF0054]/30 shadow-md"
                                                                    : "bg-[#14161F] border-white/10 hover:border-white/20 hover:bg-[#181A24]/50"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0"
                                                                    style={{
                                                                        backgroundColor: b.primary_color || "#311C99"
                                                                    }}
                                                                >
                                                                    {b.name[0]?.toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-white">{b.name}</p>
                                                                    <p className="text-[11px] text-gray-400">/{b.slug}</p>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-5 h-5 rounded-full bg-[#FF0054] flex items-center justify-center text-white">
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-amber-300 text-xs leading-relaxed">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>
                                                Ao aplicar este template, o Brand Book da marca selecionada será populado com as{" "}
                                                <strong>{selectedTemplate?.modules_json?.length || 0} seções</strong> do modelo{" "}
                                                <strong>{selectedTemplate?.name}</strong>.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-4 border-t border-white/10 bg-[#15171F] flex items-center justify-between shrink-0">
                    {step === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleProceedToConfig}
                                disabled={!selectedTemplateId}
                                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#FF0054]/20 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 group disabled:opacity-50"
                            >
                                <span>Continuar</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
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
                                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FF0054]/30 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>A processar...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
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
