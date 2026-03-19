"use client"

import * as React from "react"
import {
    ChevronRight,
    ChevronLeft,
    Plus,
    Calendar,
    CheckCircle2,
    Loader2,
    Building2,
    Sparkles,
    Upload,
    Clock,
    Box,
    Settings,
    Image as Picture,
    Layers,
    Palette,
    History,
    BookOpen,
    Tag,
    Video,
    Monitor,
    Megaphone,
    Share2
} from "lucide-react"
import type { Project } from "./ProjectsClient"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getBrands, createBrand } from "@/app/actions/brands"
import { createNewProject, getWorkspaces, uploadProjectMedia } from "@/app/actions/projects"
import { toast } from "sonner"
import Image from "next/image"
import { ROADMAP_TEMPLATES } from "@/lib/roadmap-templates"
import { useCurrency } from "@/components/CurrencyUtils"

interface Brand {
    id: string
    name: string
}

interface Workspace {
    id: string
    name: string
}

interface ProjectCreateModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    stages: { id: string, name: string }[]
    workspaceId?: string
    initialStartDate?: string
    projectToEdit?: Project | null
}

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
    { title: "Tipo", icon: <Box className="w-[30px] h-[30px]" /> },
    { title: "Identidade", icon: <Settings className="w-[30px] h-[30px]" /> },
    { title: "Cronograma", icon: <Calendar className="w-[30px] h-[30px]" /> },
    { title: "Visual", icon: <Picture className="w-[30px] h-[30px]" /> },
    { title: "Revisão", icon: <CheckCircle2 className="w-[30px] h-[30px]" /> },
]

export function ProjectCreateModal({ isOpen, onClose, onSuccess, stages, workspaceId, initialStartDate, projectToEdit }: ProjectCreateModalProps) {
    const { currencyCode } = useCurrency()
    const [step, setStep] = React.useState<Step>(1)
    const [isLoading, setIsLoading] = React.useState(false)
    const [brands, setBrands] = React.useState<Brand[]>([])
    const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
    const [isCreateBrandOpen, setIsCreateBrandOpen] = React.useState(false)
    const [newBrandName, setNewBrandName] = React.useState("")
    const [isCreatingBrand, setIsCreatingBrand] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Form State
    const [formData, setFormData] = React.useState({
        name: "",
        description: "",
        brand_id: "",
        workspace_id: "",
        status: "planning",
        stage_id: stages[0]?.id || "",
        category: "branding",
        type: "project",
        priority: "medium",
        start_date: new Date().toISOString().split("T")[0],
        due_date: "",
        tags: "",
        cover_url: "",
        template_id: "",
        budget_type: "",
        budget_amount: 0,
        currency: currencyCode || "EUR"
    })

    const loadInitialData = React.useCallback(async () => {
        const [brandsData, workspacesData] = await Promise.all([
            getBrands(),
            getWorkspaces()
        ])
        setBrands((brandsData as unknown) as Brand[])
        setWorkspaces((workspacesData as unknown) as Workspace[])

        const initialWorkspaceId = workspaceId || (workspacesData && workspacesData.length > 0 ? ((workspacesData[0] as unknown) as Workspace).id : "")
        const initialStageId = stages[0]?.id || ""

        setFormData(prev => ({
            ...prev,
            workspace_id: initialWorkspaceId,
            stage_id: prev.stage_id || initialStageId,
            start_date: initialStartDate || prev.start_date
        }))
    }, [workspaceId, stages, initialStartDate])

    React.useEffect(() => {
        if (isOpen) {
            loadInitialData()
            if (projectToEdit) {
                setFormData({
                    name: projectToEdit.name || "",
                    description: projectToEdit.description || "",
                    brand_id: projectToEdit.brand_id || projectToEdit.brand?.id || "",
                    workspace_id: projectToEdit.workspace_id || "",
                    status: projectToEdit.status || "planning",
                    stage_id: projectToEdit.stage_id || "",
                    category: projectToEdit.category || "branding",
                    type: projectToEdit.type || "project",
                    priority: projectToEdit.priority || "medium",
                    start_date: projectToEdit.start_date ? new Date(projectToEdit.start_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                    due_date: projectToEdit.due_date ? new Date(projectToEdit.due_date).toISOString().split("T")[0] : "",
                    tags: projectToEdit.tags ? projectToEdit.tags.join(", ") : "",
                    cover_url: projectToEdit.cover_url || "",
                    template_id: "", // Don't pre-fill template during edit
                    budget_type: projectToEdit.budget_type || "",
                    budget_amount: projectToEdit.budget_amount || projectToEdit.budget || 0,
                    currency: projectToEdit.currency || "USD"
                })
            }
        }
    }, [isOpen, loadInitialData, projectToEdit])

    const handleCreateBrand = async () => {
        if (!newBrandName) return
        setIsCreatingBrand(true)
        try {
            const fd = new FormData()
            fd.append("name", newBrandName)
            fd.append("primaryColor", "#FF0055")
            if (formData.workspace_id) {
                fd.append("workspace_id", formData.workspace_id)
            }

            const res = await createBrand(fd)
            if (res.success) {
                toast.success("Cliente criado!")
                const updatedBrands = await getBrands()
                setBrands(updatedBrands)
                setFormData(prev => ({ ...prev, brand_id: res.brandId || "" }))
                setIsCreateBrandOpen(false)
                setNewBrandName("")
            } else {
                toast.error(res.error || "Erro ao criar cliente")
            }
        } catch (err) {
            console.error("Create brand error:", err)
            toast.error("Erro inesperado")
        } finally {
            setIsCreatingBrand(false)
        }
    }
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Imagem muito grande (máximo 2MB)")
            return
        }

        setIsUploading(true)
        try {
            const res = await uploadProjectMedia(file)
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, cover_url: res.url as string }))
                toast.success("Imagem enviada!")
            } else {
                toast.error(res.error || "Erro no envio")
            }
        } catch (err) {
            console.error("Upload error:", err)
            toast.error("Erro inesperado no upload")
        } finally {
            setIsUploading(false)
        }
    }

    const nextStep = () => setStep(s => (s < 5 ? (s + 1) as Step : s))
    const prevStep = () => setStep(s => (s > 1 ? (s - 1) as Step : s))

    const handleCreate = async () => {
        setIsLoading(true)
        try {
            const { tags, ...rest } = formData
            const formattedTags = tags.split(',').map(t => t.trim()).filter(Boolean)

            if (projectToEdit) {
                const { updateProject } = await import("@/app/actions/projects")
                const res = await updateProject(projectToEdit.id, {
                    ...rest,
                    tags: formattedTags
                })
                if (res.success) {
                    toast.success("Projeto atualizado com sucesso!")
                    onSuccess()
                    handleClose()
                } else {
                    toast.error(res.error || "Erro ao atualizar projeto")
                }
            } else {
                const res = await createNewProject({
                    ...rest,
                    tags: formattedTags
                })

                if (res.success) {
                    toast.success("Projeto criado com sucesso!")
                    onSuccess()
                    handleClose()
                } else {
                    toast.error(res.error || "Erro ao criar projeto")
                }
            }
        } catch (err) {
            console.error("Project Creation Error:", err)
            toast.error("Ocorreu um erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setStep(1)
        setFormData({
            name: "",
            description: "",
            brand_id: "",
            workspace_id: workspaces[0]?.id || "",
            status: "planning",
            stage_id: stages[0]?.id || "",
            category: "branding",
            type: "project",
            priority: "medium",
            start_date: new Date().toISOString().split("T")[0],
            due_date: "",
            tags: "",
            cover_url: "",
            template_id: "",
            budget_type: "",
            budget_amount: 0,
            currency: currencyCode || "EUR"
        })
        onClose()
    }

    if (!isOpen) return null


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-[840px] h-[890px] bg-white dark:bg-[#15161B] rounded-[8px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-[#373737]"
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 1px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #ff0054;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                `}} />
                {/* Header: bg color #ff0054, altura de 60px, roundness superior esquerda e direita de 8px */}
                <div className="h-[60px] bg-[#ff0054] px-8 flex items-center justify-between shrink-0">
                    <h2 className="text-[20px] font-bold text-white">Add project</h2>
                    {/* Círculo de 22x22px na cor #15161B com a função de fechar o modal */}
                    <button
                        onClick={handleClose}
                        className="w-[22px] h-[22px] bg-[#15161B] rounded-full transition-transform active:scale-90"
                    />
                </div>

                {/* Contentor dos Passos/Etapas */}
                <div className="h-[140px] bg-white dark:bg-[#141414] flex items-center justify-center shrink-0">
                    <div className="w-[530px] flex items-center justify-between relative">
                        {/* Fixed grey connecting line */}
                        <div className="absolute left-[25px] right-[25px] top-[25px] h-[1px] bg-[#27282D]" />

                        {/* Dynamic pink progress line */}
                        <div
                            className="absolute left-[25px] top-[25px] h-[1px] bg-[#ff0054] transition-all duration-500 origin-left"
                            style={{
                                width: `${Math.max(0, (step - 1) * (530 - 50) / 4)}px`
                            }}
                        />

                        {STEPS.map((s, i) => {
                            const isReached = step >= i + 1

                            return (
                                <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-300",
                                        isReached ? "bg-[#ff0054] text-white" : "bg-[#EFF0F2] dark:bg-[#27282D] text-[#97A1B3]"
                                    )}>
                                        {React.cloneElement(s.icon as React.ReactElement<{ className?: string }>, {
                                            className: cn("w-[30px] h-[30px]", isReached ? "text-white" : "text-[#97A1B3]")
                                        })}
                                    </div>
                                    <span className="text-[12px] font-medium text-[#97A1B3] uppercase tracking-tight whitespace-nowrap">
                                        {s.title}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Body Content: h=690px, padding lateral 40px, padding superior e inferior de 36px, bg color=#EFF0F2 */}
                <div className="flex-1 overflow-y-auto px-[40px] py-[36px] bg-[#EFF0F2] dark:bg-[#15161B] custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-12"
                            >
                                <div className="text-center space-y-3 mb-12">
                                    <h3 className="text-[32px] font-medium text-[#97A1B3] dark:text-white">Selecione o tipo de Projeto</h3>
                                    <p className="text-[18px] text-[#97A1B3]">Escolha um template para pré-configurar fases e tarefas</p>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {ROADMAP_TEMPLATES.map(template => {
                                        const isSelected = formData.template_id === template.id;
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        template_id: template.id,
                                                        category: template.id === 'custom' ? 'branding' : template.id
                                                    })
                                                    nextStep()
                                                }}
                                                className={cn(
                                                    "p-[24px] rounded-[8px] bg-transparent border transition-all text-left flex flex-col gap-4 relative group shrink-0",
                                                    isSelected ? "bg-[#F8F8F8] dark:bg-[#191A1F] border-[#ff0054]" : "border-[#97A1B3] dark:border-[#373737] hover:bg-[#F8F8F8] dark:hover:bg-[#191A1F] hover:border-[#ff0054]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-[32px] h-[35px] rounded-[8px] flex items-center justify-center bg-white dark:bg-[#313340] shrink-0 transition-colors shadow-sm"
                                                )}>
                                                    {(() => {
                                                        const className = cn("w-[20px] h-[20px] transition-colors", isSelected ? "text-[#ff0054]" : "text-[#97A1B3] group-hover:text-[#ff0054]");
                                                        switch (template.id) {
                                                            case 'branding': return <Palette className={className} />;
                                                            case 'rebranding': return <History className={className} />;
                                                            case 'editorial': return <BookOpen className={className} />;
                                                            case 'product-design': return <Settings className={className} />;
                                                            case 'design-system': return <Layers className={className} />;
                                                            case 'naming': return <Tag className={className} />;
                                                            case 'video': return <Video className={className} />;
                                                            case 'web': return <Monitor className={className} />;
                                                            case 'marketing': return <Megaphone className={className} />;
                                                            case 'social': return <Share2 className={className} />;
                                                            default: return <Sparkles className={className} />;
                                                        }
                                                    })()}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-[18px] font-bold text-[#97A1B3] group-hover:text-white transition-colors">{template.name}</h4>
                                                    <p className="text-[14px] text-[#97A1B3] leading-snug line-clamp-2">
                                                        {template.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div className="space-y-3">
                                    <label className="text-[14px] font-medium text-[#97A1B3]">Nome do projecto</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Redesign Brivio 2026"
                                        className="w-full bg-transparent border-b border-[#373737] px-[12px] py-4 text-[18px] text-white placeholder:text-[#373737] outline-none transition-all focus:border-[#ff0054]"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-x-[70px] gap-y-12">
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-medium text-[#97A1B3]">Cliente</label>
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <select
                                                    className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-[#97A1B3] appearance-none outline-none focus:border-[#ff0054]"
                                                    value={formData.brand_id}
                                                    onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
                                                >
                                                    <option value="" className="bg-white dark:bg-[#15161B]">Ex: Maria Eduarda</option>
                                                    {brands.map(b => (
                                                        <option key={b.id} value={b.id} className="bg-white dark:bg-[#15161B] text-[#4F5B6E] dark:text-white">{b.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#97A1B3] rotate-90 pointer-events-none" />
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsCreateBrandOpen(!isCreateBrandOpen)}
                                                    className="w-[50px] h-[50px] bg-[#97A1B3]/20 dark:bg-[#27282D] rounded-[4px] flex items-center justify-center text-[#97A1B3] transition-all hover:bg-[#ff0054] hover:text-white"
                                                >
                                                    <Plus className="w-8 h-8" />
                                                </button>
                                                <AnimatePresence>
                                                    {isCreateBrandOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute bottom-full right-0 mb-4 w-72 bg-[#1A1B23] border border-[#373737] rounded-[8px] p-6 z-50 shadow-2xl"
                                                        >
                                                            <div className="space-y-4">
                                                                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Novo Cliente</h4>
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    placeholder="Nome do cliente..."
                                                                    className="w-full bg-transparent border-b border-[#373737] px-4 py-2 text-sm text-white focus:border-[#ff0054] outline-none transition-all"
                                                                    value={newBrandName}
                                                                    onChange={e => setNewBrandName(e.target.value)}
                                                                />
                                                                <div className="flex gap-2 pt-2">
                                                                    <button
                                                                        className="flex-1 h-9 rounded border border-[#373737] text-white text-xs hover:bg-white/5 transition-all"
                                                                        onClick={() => setIsCreateBrandOpen(false)}
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                    <button
                                                                        className="flex-1 h-9 rounded bg-[#ff0054] text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                                                                        onClick={handleCreateBrand}
                                                                        disabled={isCreatingBrand}
                                                                    >
                                                                        {isCreatingBrand ? "..." : "Criar"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[14px] font-medium text-[#97A1B3]">Prioridade</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-[#97A1B3] appearance-none outline-none focus:border-[#ff0054]"
                                                value={formData.priority}
                                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                            >
                                                <option value="low" className="bg-white dark:bg-[#15161B]">Baixa</option>
                                                <option value="medium" className="bg-white dark:bg-[#15161B]">Média</option>
                                                <option value="high" className="bg-white dark:bg-[#15161B]">Alta</option>
                                                <option value="urgent" className="bg-white dark:bg-[#15161B]">Urgente</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#97A1B3] rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-x-8">
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-medium text-[#97A1B3]">Tipo de orçamento</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-[#97A1B3] appearance-none outline-none focus:border-[#ff0054]"
                                                value={formData.budget_type}
                                                onChange={e => setFormData({ ...formData, budget_type: e.target.value })}
                                            >
                                                <option value="" className="bg-white dark:bg-[#15161B]">Tipo...</option>
                                                <option value="fixed" className="bg-white dark:bg-[#15161B]">Fixo</option>
                                                <option value="hourly" className="bg-white dark:bg-[#15161B]">Por Hora</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#97A1B3] rotate-90 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[14px] font-medium text-[#97A1B3]">Valor</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-white placeholder:text-[#97A1B3] outline-none transition-all focus:border-[#ff0054]"
                                            value={formData.budget_amount}
                                            onChange={e => setFormData({ ...formData, budget_amount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[14px] font-medium text-[#97A1B3]">Moeda</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-[#97A1B3] appearance-none outline-none focus:border-[#ff0054]"
                                                value={formData.currency}
                                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                            >
                                                <option value="USD" className="bg-white dark:bg-[#15161B]">USD ($)</option>
                                                <option value="BRL" className="bg-white dark:bg-[#15161B]">BRL (R$)</option>
                                                <option value="EUR" className="bg-white dark:bg-[#15161B]">EUR (€)</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#97A1B3] rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div className="grid grid-cols-2 gap-x-[70px]">
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-medium text-[#97A1B3]">Data de início</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-[#97A1B3] appearance-none outline-none focus:border-[#ff0054]"
                                                value={formData.start_date}
                                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            />
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#97A1B3] pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-medium text-[#97A1B3]">Data de entrega</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-[#97A1B3] appearance-none outline-none focus:border-[#ff0054]"
                                                value={formData.due_date}
                                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                            />
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#97A1B3] pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#DDE0E6] dark:bg-[#1A1B23] p-8 rounded-[8px] flex items-center gap-6 border border-gray-200 dark:border-[#373737]">
                                    <div className="w-[60px] h-[60px] rounded-full bg-transparent border-2 border-[#97A1B3]/30 dark:bg-[#27282D] flex items-center justify-center text-[#4F5B6E] dark:text-[#97A1B3]">
                                        <Clock className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[20px] font-bold text-[#4F5B6E] dark:text-white uppercase">
                                            {formData.name || 'Nome do Projecto'}
                                        </p>
                                        <p className="text-[14px] text-[#97A1B3]">
                                            {formData.start_date && formData.due_date ?
                                                `Planejado para ${Math.ceil((new Date(formData.due_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 3600 * 24))} dias` :
                                                'Defina as datas para calcular a duração'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div className="space-y-4">
                                    <label className="text-[14px] font-medium text-[#97A1B3]">Background/cover image</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative h-[275px] w-full bg-transparent border border-dashed border-[#97A1B3] dark:border-[#373737] rounded-[8px] flex flex-col items-center justify-center gap-4 group cursor-pointer overflow-hidden transition-all hover:border-[#ff0054]"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />

                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-10 h-10 text-[#ff0054] animate-spin" />
                                                <p className="text-sm font-bold text-[#ff0054]">A enviar imagem...</p>
                                            </div>
                                        ) : formData.cover_url ? (
                                            <>
                                                <Image src={formData.cover_url} alt="Cover" fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <p className="text-white font-bold text-lg">Clique para alterar</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-[60px] h-[60px] rounded-full bg-[#EFF0F2] dark:bg-[#27282D] flex items-center justify-center text-[#97A1B3] transition-transform group-hover:scale-110">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[20px] font-bold text-[#4F5B6E] dark:text-white">Arraste uma imagem ou clique para upload</p>
                                                    <p className="text-[12px] text-[#97A1B3] mt-2 tracking-widest uppercase">PNG, JPG, WEBP (MAX 2MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[14px] font-medium text-[#97A1B3]">Tags</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Minimal, Case study, Web design, Branding"
                                        className="w-full bg-transparent border-b border-[#97A1B3] dark:border-[#373737] px-[12px] py-4 text-[18px] text-[#4F5B6E] dark:text-white placeholder:text-[#97A1B3] outline-none transition-all focus:border-[#ff0054]"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="bg-[#ff0054] px-4 py-1.5 rounded-full">
                                            <span className="text-[12px] font-bold text-white">Review final</span>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[14px] text-[#97A1B3]">Prioridade</p>
                                            <div className="bg-[#15161B] dark:bg-[#27282D] px-8 py-2 rounded-[12px] border border-transparent shadow-sm">
                                                <span className="text-[14px] font-bold text-white capitalize">{formData.priority}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-[64px] font-bold text-[#97A1B3] dark:text-white leading-tight uppercase tracking-tighter">
                                            {formData.name || 'NOME DO PROJECTO'}
                                        </h3>
                                        <p className="text-[20px] text-[#97A1B3]">
                                            {formData.description || 'Descrição detalhada do projeto'}
                                        </p>
                                    </div>

                                    <div className="h-[1px] bg-[#97A1B3]/30 dark:bg-[#373737]" />

                                    <div className="grid grid-cols-2 gap-x-[70px] gap-y-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-[60px] h-[60px] bg-[#97A1B3] dark:bg-[#27282D] rounded-full flex items-center justify-center text-white dark:text-[#97A1B3]">
                                                <Building2 className="w-[30px] h-[30px]" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[12px] text-[#97A1B3]">Tipo de projecto</p>
                                                <p className="text-[20px] font-bold text-[#97A1B3] dark:text-white uppercase">{formData.category || 'Nenhuma'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="w-[60px] h-[60px] bg-[#97A1B3] dark:bg-[#27282D] rounded-full flex items-center justify-center text-white dark:text-[#97A1B3]">
                                                <Calendar className="w-[30px] h-[30px]" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[12px] text-[#97A1B3]">Timeline</p>
                                                <p className="text-[20px] font-bold text-[#97A1B3] dark:text-white uppercase tracking-tighter">
                                                    {formData.start_date ? new Date(formData.start_date).toLocaleDateString('pt-BR') : '...'} - {formData.due_date ? new Date(formData.due_date).toLocaleDateString('pt-BR') : '...'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="w-[60px] h-[60px] bg-[#97A1B3] dark:bg-[#27282D] rounded-full flex items-center justify-center text-white dark:text-[#97A1B3]">
                                                <Layers className="w-[30px] h-[30px]" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[12px] text-[#97A1B3]">Categoria</p>
                                                <p className="text-[20px] font-bold text-[#97A1B3] dark:text-white uppercase uppercase">{formData.category || 'Nome da categoria'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="w-[60px] h-[60px] bg-[#97A1B3] dark:bg-[#27282D] rounded-full flex items-center justify-center text-white dark:text-[#97A1B3]">
                                                <CheckCircle2 className="w-[30px] h-[30px]" />
                                            </div>
                                            <div className="flex items-center">
                                                <div className="bg-[#15161B] dark:bg-[#1A1B23] px-6 py-2 rounded-[12px] shadow-sm">
                                                    <span className="text-[14px] font-bold text-white uppercase tracking-tight">Branding</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-[40px] h-[90px] bg-[#EFF0F2] dark:bg-[#15161B] border-t border-gray-100 dark:border-[#373737] flex items-center justify-between shrink-0">
                    <button
                        onClick={prevStep}
                        disabled={step === 1 || isLoading}
                        className="flex items-center gap-2 text-[#97A1B3] hover:text-white font-medium transition-colors disabled:opacity-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Voltar
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleClose}
                            className="w-[150px] h-[45px] rounded-[8px] border border-[#373737] text-[#97A1B3] dark:text-white text-[16px] transition-all hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={step < 5 ? nextStep : handleCreate}
                            disabled={isLoading || (step === 1 && !formData.template_id && !projectToEdit) || (step === 2 && !formData.name)}
                            className="w-[170px] h-[45px] rounded-[4px] bg-[#ff0054] text-white text-[16px] font-bold transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : step < 5 ? "Continuar" : projectToEdit ? "Salvar" : "Lançar"}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Scrollbar styles are handled by the style block at the start of the modal content */}
        </div>
    )
}
