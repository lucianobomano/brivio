"use client"

import * as React from "react"
import { Project } from "./ProjectsClient"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronRight, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProposalTemplates, updateProposal, saveProposalTemplate } from "@/app/actions/proposals"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/CurrencyUtils"

interface ProjectProposalEditModalProps {
    isOpen: boolean
    onClose: () => void
    project?: Project | null
    proposal?: any // Using any for mock, should be Proposal type
}

type TabType = "info" | "servicos" | "condicoes" | "template"

export function ProjectProposalEditModal({ isOpen, onClose, project, proposal }: ProjectProposalEditModalProps) {
    const { formatPrice, currencyCode } = useCurrency()
    const [activeTab, setActiveTab] = React.useState<TabType>("info")
    const [isLoading, setIsLoading] = React.useState(false)
    const [templates, setTemplates] = React.useState<any[]>([])

    // Form State
    const [formData, setFormData] = React.useState({
        id: "",
        client_name: "",
        client_email: "",
        project_name: "",
        proposal_id: "",
        cover_image: "",
        objective: "",
        presentation: "",
        validity: "",
        services: [] as any[],
        discount: "",
        discount_type: "fixed",
        immediate_availability: true,
        project_duration: "",
        duration_unit: "dias_uteis",
        billing_type: "valor_fixo",
        payment_methods: [] as string[],
        observations: "",
        selected_template: ""
    })

    React.useEffect(() => {
        if (isOpen && proposal) {
            setFormData({
                id: proposal.id,
                client_name: (project as any)?.brand_name || "Cliente",
                client_email: (project as any)?.brand_email || "cliente@email.com",
                project_name: proposal.project_name || project?.name || "",
                proposal_id: proposal.identifier,
                cover_image: proposal.cover_image || "",
                objective: proposal.objective || "",
                presentation: proposal.presentation || "",
                validity: String(proposal.validity_days || ""),
                services: proposal.proposal_items || [],
                discount: String(proposal.discount_value || ""),
                discount_type: proposal.discount_type || "fixed",
                immediate_availability: proposal.immediate_availability ?? true,
                project_duration: proposal.duration_value || "",
                duration_unit: proposal.duration_unit || "dias_uteis",
                billing_type: proposal.billing_type || "valor_fixo",
                payment_methods: proposal.payment_methods || [],
                observations: proposal.observations || "",
                selected_template: proposal.template_id || ""
            })

            const fetchTemplates = async () => {
                const data = await getProposalTemplates()
                setTemplates(data)
            }
            fetchTemplates()
        }
    }, [isOpen, proposal, project])

    // Scrolling & Custom Cursor Logic for Templates
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 })
    const [cursorDirection, setCursorDirection] = React.useState<"left" | "right" | null>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (activeTab !== "template") return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setMousePos({ x, y })

        const edgeWidth = 200 // Zone at the edges to trigger arrow/scroll
        if (x < edgeWidth) {
            setCursorDirection("left")
        } else if (x > rect.width - edgeWidth) {
            setCursorDirection("right")
        } else {
            setCursorDirection(null)
        }
    }

    React.useEffect(() => {
        let interval: NodeJS.Timeout
        if (cursorDirection && scrollRef.current) {
            interval = setInterval(() => {
                if (scrollRef.current) {
                    const scrollAmount = cursorDirection === "left" ? -10 : 10
                    scrollRef.current.scrollLeft += scrollAmount
                }
            }, 10)
        }
        return () => clearInterval(interval)
    }, [cursorDirection])

    if (!isOpen) return null

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const res = await updateProposal({
                id: formData.id,
                project_id: project?.id || proposal.project_id,
                identifier: formData.proposal_id,
                cover_image: formData.cover_image,
                objective: formData.objective,
                presentation: formData.presentation,
                validity_days: parseInt(formData.validity) || 0,
                immediate_availability: formData.immediate_availability,
                duration_value: formData.project_duration,
                duration_unit: formData.duration_unit,
                billing_type: formData.billing_type,
                discount_value: parseFloat(formData.discount) || 0,
                discount_type: formData.discount_type,
                observations: formData.observations,
                template_id: formData.selected_template,
                payment_methods: formData.payment_methods,
                items: formData.services
            })

            if (res.success) {
                toast.success("Alterações salvas com sucesso!")
                onClose()
            } else {
                toast.error(res.error || "Erro ao salvar")
            }
        } catch (error) {
            console.error(error)
            toast.error("Ocorreu um erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const addServiceItem = () => {
        const newItem = {
            id: crypto.randomUUID(),
            name: "Novo serviço",
            quantity: 1,
            price: 0
        }
        setFormData(prev => ({
            ...prev,
            services: [...prev.services, newItem]
        }))
    }

    const removeServiceItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.filter(s => s.id !== id)
        }))
    }

    const updateServiceItem = (id: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s)
        }))
    }

    const subtotal = formData.services.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const discountVal = parseFloat(formData.discount) || 0
    const total = formData.discount_type === "percent"
        ? subtotal * (1 - discountVal / 100)
        : Math.max(0, subtotal - discountVal)

    const tabs: { id: TabType; label: string }[] = [
        { id: "info", label: "Info" },
        { id: "servicos", label: "Serviços" },
        { id: "condicoes", label: "Condições" },
        { id: "template", label: "Template" },
    ]

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    maxWidth: activeTab === "template" ? "1800px" : "894px",
                    height: activeTab === "template" ? "943px" : "894px"
                }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    maxWidth: { duration: 0.3 },
                    height: { duration: 0.3 }
                }}
                className="relative w-full bg-[#15161B] rounded-[8px] shadow-2xl overflow-hidden flex flex-col border border-[#373737]"
            >
                {/* Header */}
                <div className="bg-[#EF0050] px-8 h-[74px] flex items-center justify-between shrink-0">
                    <h2 className="text-[28px] font-bold text-white font-inter-tight uppercase tracking-tight">
                        {formData.proposal_id}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-[21px] h-[21px] bg-[#15161B] rounded-full transition-transform active:scale-90"
                    />
                </div>

                {/* Tabs Navigation */}
                <div className="h-[64px] border-b border-[#373737]/30 flex items-center justify-center gap-12 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "h-full px-2 text-[16px] font-medium transition-all relative flex items-center",
                                activeTab === tab.id ? "text-white" : "text-[#97A1B3] hover:text-white"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EF0050]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className={cn(
                    "flex-1 overflow-y-auto custom-scrollbar",
                    activeTab === "template" ? "p-0 overflow-hidden" : "p-12"
                )}>
                    <AnimatePresence mode="wait">
                        {activeTab === "info" && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-12"
                            >
                                <div className="space-y-2">
                                    <h3 className="text-[24px] font-bold text-white">Dados gerais</h3>
                                    <p className="text-[#97A1B3] text-[16px]">Informações gerais da proposta. Capriche na apresentação! 😎</p>
                                </div>

                                {/* Cliente */}
                                <div className="flex items-center gap-10">
                                    <div className="w-[30%]">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Cliente</label>
                                    </div>
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-[#D9D9D9] shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-[16px] font-bold text-white">{formData.client_name}</p>
                                            <p className="text-[14px] text-[#97A1B3]">{formData.client_email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nome do projeto */}
                                <div className="flex items-center gap-10">
                                    <div className="w-[30%]">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Nome do projeto</label>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Nome do projeto"
                                            className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-white placeholder:text-[#373737] outline-none"
                                            value={formData.project_name}
                                            onChange={e => setFormData({ ...formData, project_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Identificação */}
                                <div className="flex items-start gap-10">
                                    <div className="w-[30%] space-y-2">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Identificação da proposta</label>
                                        <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                            Exemplo: 2023-02, Desconto de 10%, Plano Gold, Versão 1, etc...
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-white outline-none"
                                            value={formData.proposal_id}
                                            onChange={e => setFormData({ ...formData, proposal_id: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Imagem de capa */}
                                <div className="flex items-start gap-10">
                                    <div className="w-[30%] space-y-2">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Imagem de capa</label>
                                        <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                            Escolha uma imagem que tenha relação com o projeto para aumentar o apelo visual da sua proposta. Tamanho ideal: 936 x 312 px (proporção de 3:1).
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <div className="w-full h-[200px] rounded-[8px] border border-[#373737] bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all">
                                            <span className="text-[#97A1B3] text-[16px]">Imagem de capa</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Objetivo */}
                                <div className="flex items-start gap-10">
                                    <div className="w-[30%] space-y-2">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Objetivo</label>
                                        <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                            Qual o objetivo do cliente com este projeto? Ex.: "Aumentar as vendas da Petshop Aumigo com um E-commerce de alta qualidade".
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-[#97A1B3] outline-none min-h-[80px] resize-none"
                                            value={formData.objective}
                                            onChange={e => setFormData({ ...formData, objective: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Apresentação */}
                                <div className="flex items-start gap-10">
                                    <div className="w-[30%] space-y-2">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Apresentação</label>
                                        <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                            Apresente o seu negócio ou você como profissional. Sua apresentação padrão será usada, mas você pode customizar para se adequar melhor ao projeto do cliente.
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-[#97A1B3] outline-none min-h-[80px] resize-none"
                                            value={formData.presentation}
                                            onChange={e => setFormData({ ...formData, presentation: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Prazo de validade */}
                                <div className="flex items-center gap-10">
                                    <div className="w-[30%] space-y-2">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Prazo de validade (opcional)</label>
                                        <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                            Quantidade de dias úteis para a proposta perder a validade. Após o período, a proposta será arquivada automaticamente.
                                        </p>
                                    </div>
                                    <div className="flex-1 flex items-end gap-10">
                                        <input
                                            type="text"
                                            className="w-[100px] bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-white outline-none"
                                            value={formData.validity}
                                            onChange={e => setFormData({ ...formData, validity: e.target.value })}
                                        />
                                        <span className="text-[16px] text-white mb-2">Dias úteis</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "servicos" && (
                            <motion.div
                                key="servicos"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-12"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-[24px] font-bold text-white">Serviços</h3>
                                        <p className="text-[#97A1B3] text-[16px]">Liste os serviços que serão executados e adicione um desconto. 😎</p>
                                    </div>
                                    <Button
                                        onClick={addServiceItem}
                                        className="bg-[#EF0050] hover:bg-[#EF0050]/90 text-white rounded-[4px] font-bold text-[12px] h-[32px] px-4 uppercase tracking-tight"
                                    >
                                        Add item no orçamento
                                    </Button>
                                </div>

                                <div className="rounded-[8px] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#2A2B32] text-[#97A1B3] text-[14px]">
                                            <tr>
                                                <th className="py-4 px-6 font-bold uppercase tracking-tight">Serviço</th>
                                                <th className="py-4 px-6 font-bold uppercase tracking-tight">Quantidade</th>
                                                <th className="py-4 px-6 font-bold uppercase tracking-tight text-right">Preço</th>
                                                <th className="py-4 px-6 text-right w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#373737]/20 border-b border-[#373737]/20">
                                            {formData.services.map((service) => (
                                                <tr key={service.id} className="text-white text-[16px]">
                                                    <td className="py-6 px-6 font-bold">
                                                        <input
                                                            type="text"
                                                            className="bg-transparent outline-none w-full"
                                                            value={service.name}
                                                            onChange={e => updateServiceItem(service.id, "name", e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="py-6 px-6 font-bold">
                                                        <input
                                                            type="number"
                                                            className="bg-transparent outline-none w-20"
                                                            value={service.quantity}
                                                            onChange={e => updateServiceItem(service.id, "quantity", parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="py-6 px-6 font-bold text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span>{currencyCode}</span>
                                                            <input
                                                                type="number"
                                                                className="bg-transparent outline-none text-right w-32"
                                                                value={service.price}
                                                                onChange={e => updateServiceItem(service.id, "price", parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6 text-right">
                                                        <button
                                                            onClick={() => removeServiceItem(service.id)}
                                                            className="text-[#EF0050] hover:scale-110 transition-transform"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-10">
                                    {/* Subtotal */}
                                    <div className="flex items-center gap-10">
                                        <div className="w-[30%] space-y-2">
                                            <p className="text-[14px] font-bold text-white uppercase tracking-tight">Subtotal</p>
                                            <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                                Soma dos serviços listados, ainda sem desconto.
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[20px] font-bold text-[#97A1B3]">{formatPrice(subtotal)}</p>
                                        </div>
                                    </div>

                                    {/* Desconto */}
                                    <div className="flex items-center gap-10">
                                        <div className="w-[30%]">
                                            <p className="text-[14px] font-bold text-white uppercase tracking-tight">Desconto</p>
                                        </div>
                                        <div className="flex-1 flex gap-10">
                                            <input
                                                type="text"
                                                className="w-[100px] bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-white outline-none"
                                                value={formData.discount}
                                                onChange={e => setFormData({ ...formData, discount: e.target.value })}
                                            />
                                            <div className="relative flex-1 group">
                                                <select
                                                    className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-[#97A1B3] outline-none appearance-none"
                                                    value={formData.discount_type}
                                                    onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                                >
                                                    <option value="fixed" className="bg-[#15161B]">Valor fixo ({currencyCode})</option>
                                                    <option value="percent" className="bg-[#15161B]">Porcentagem (%)</option>
                                                </select>
                                                <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#373737] rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="flex items-center gap-10 pt-4 border-t border-[#373737]/20">
                                        <div className="w-[30%] space-y-2">
                                            <p className="text-[14px] font-bold text-white uppercase tracking-tight">Total</p>
                                            <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                                Valor final a ser cobrado do cliente.
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[64px] font-bold text-[#97A1B3] leading-none uppercase tracking-tighter">{formatPrice(total)}</p>
                                        </div>
                                    </div>

                                    {/* Case de estudos */}
                                    <div className="flex items-center justify-between pt-10 border-t border-[#373737]/20">
                                        <div className="space-y-2">
                                            <h4 className="text-[14px] font-bold text-white uppercase tracking-tight">Case de estudos</h4>
                                            <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                                Projetos concluídos relacionados ao projeto da proposta
                                            </p>
                                        </div>
                                        <Button className="bg-[#EF0050] hover:bg-[#EF0050]/90 text-white rounded-[4px] font-bold text-[12px] h-[32px] px-4 uppercase tracking-tight">
                                            Add item no orçamento
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "condicoes" && (
                            <motion.div
                                key="condicoes"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-12"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-[24px] font-bold text-white">Condições</h3>
                                        <p className="text-[#97A1B3] text-[16px]">Descreva as condições de prazo e pagamento do serviço.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div
                                            onClick={() => setFormData({ ...formData, immediate_availability: !formData.immediate_availability })}
                                            className={cn(
                                                "w-[60px] h-[28px] rounded-full p-1 cursor-pointer transition-all flex items-center shadow-lg",
                                                formData.immediate_availability ? "bg-[#EF0050]" : "bg-[#373737]"
                                            )}
                                        >
                                            <motion.div
                                                className="w-[20px] h-[20px] bg-white rounded-full shadow-sm"
                                                animate={{ x: formData.immediate_availability ? 32 : 0 }}
                                            />
                                        </div>
                                        <span className="text-[14px] text-[#97A1B3]">Tenho disponibilidade imediata</span>
                                    </div>
                                </div>

                                {/* Duração do projeto */}
                                <div className="flex items-center gap-10">
                                    <div className="w-[30%]">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Duração do projeto</label>
                                    </div>
                                    <div className="flex-1 flex gap-10">
                                        <input
                                            type="text"
                                            className="w-[100px] bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-[#97A1B3] outline-none"
                                            value={formData.project_duration}
                                            onChange={e => setFormData({ ...formData, project_duration: e.target.value })}
                                        />
                                        <div className="relative flex-1 group">
                                            <select
                                                className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-[#97A1B3] outline-none appearance-none"
                                                value={formData.duration_unit}
                                                onChange={e => setFormData({ ...formData, duration_unit: e.target.value })}
                                            >
                                                <option value="dias_uteis" className="bg-[#15161B]">Dias úteis</option>
                                                <option value="dias_corridos" className="bg-[#15161B]">Dias corridos</option>
                                                <option value="semanas" className="bg-[#15161B]">Semanas</option>
                                            </select>
                                            <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#373737] rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tipo de cobrança */}
                                <div className="flex items-center gap-10">
                                    <div className="w-[30%]">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Tipo de cobrança</label>
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <select
                                                className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-[#97A1B3] outline-none appearance-none"
                                                value={formData.billing_type}
                                                onChange={e => setFormData({ ...formData, billing_type: e.target.value })}
                                            >
                                                <option value="valor_fixo">Valor fixo</option>
                                            </select>
                                            <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#373737] rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Formas de pagamento */}
                                <div className="flex items-center gap-10">
                                    <div className="w-[30%]">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Formas de pagamento</label>
                                    </div>
                                    <div className="flex-1 relative">
                                        <div className="flex flex-wrap gap-2 border-b border-[#373737] py-2">
                                            {["Transferência bancária", "Cartão de crédito", "Pix", "Espécie"].map(method => {
                                                const isSelected = formData.payment_methods.includes(method)
                                                return (
                                                    <div
                                                        key={method}
                                                        onClick={() => {
                                                            const newMethods = isSelected
                                                                ? formData.payment_methods.filter(m => m !== method)
                                                                : [...formData.payment_methods, method]
                                                            setFormData({ ...formData, payment_methods: newMethods })
                                                        }}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-[4px] flex items-center gap-2 cursor-pointer transition-all",
                                                            isSelected ? "bg-[#EF0050]/20 border border-[#EF0050]/30" : "bg-[#373737]/40 border border-transparent hover:bg-[#373737]/60"
                                                        )}
                                                    >
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-[#EF0050]" : "bg-[#97A1B3]")} />
                                                        <span className={cn("text-[12px] font-medium", isSelected ? "text-white" : "text-[#97A1B3]")}>{method}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Observações */}
                                <div className="flex items-start gap-10">
                                    <div className="w-[30%] space-y-2">
                                        <label className="text-[14px] font-bold text-white uppercase tracking-tight">Observações (opcional)</label>
                                        <p className="text-[11px] text-[#97A1B3] leading-relaxed">
                                            Descreva quaisquer observações e informações que achar relevante ou condições acertadas em negociação com o cliente, como dados bancários, políticas e taxas de cancelamento.
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            className="w-full bg-transparent border-b border-[#373737] px-0 py-2 text-[16px] text-[#97A1B3] outline-none min-h-[120px] resize-none"
                                            value={formData.observations}
                                            onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "template" && (
                            <motion.div
                                key="template"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="relative h-full select-none cursor-none"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setCursorDirection(null)}
                            >
                                {/* Custom Cursor */}
                                <AnimatePresence>
                                    {cursorDirection && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="fixed z-[200] pointer-events-none flex items-center justify-center w-20 h-20 rounded-full bg-[#ff0054] text-white shadow-xl"
                                            style={{
                                                left: mousePos.x,
                                                top: mousePos.y,
                                                transform: 'translate(-50%, -50%)',
                                                position: 'absolute'
                                            }}
                                        >
                                            {cursorDirection === "left" ? (
                                                <ArrowLeft className="w-10 h-10" strokeWidth={3} />
                                            ) : (
                                                <ArrowRight className="w-10 h-10" strokeWidth={3} />
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div
                                    ref={scrollRef}
                                    className="h-full overflow-x-auto flex gap-[30px] items-center px-[60px]"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none'
                                    }}
                                >
                                    <style>{`
                                        .no-scrollbar::-webkit-scrollbar {
                                            display: none;
                                        }
                                        .no-scrollbar {
                                            -ms-overflow-style: none;
                                            scrollbar-width: none;
                                        }
                                    `}</style>
                                    {templates.length > 0 ? templates.map((template, idx) => (
                                        <motion.div
                                            key={template.id}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setFormData({ ...formData, selected_template: template.id })}
                                            className="relative group cursor-pointer overflow-hidden rounded-[30px] w-[396px] h-[630px] flex-shrink-0 shadow-2xl transition-shadow hover:shadow-[#EF0050]/10"
                                        >
                                            {/* Background Image */}
                                            <div className="absolute inset-0">
                                                <img
                                                    src={template.preview_image}
                                                    alt={template.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/90" />
                                            </div>

                                            <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                                        <ChevronRight className="w-6 h-6 text-white -rotate-180" />
                                                    </div>
                                                    {formData.selected_template === template.id && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="flex items-center gap-2 bg-[#EF0050] px-4 py-1.5 rounded-full shadow-lg"
                                                        >
                                                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Selecionado</span>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                                        <span className="text-[54px] font-bold text-white/50 leading-none">00{idx + 1}</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setIsLoading(true);
                                                                    try {
                                                                        const result = await saveProposalTemplate(formData.id, template.id);
                                                                        if (result.success) {
                                                                            window.open(`/proposals/${formData.id}/view`, '_blank');
                                                                        } else {
                                                                            toast.error("Erro ao carregar pré-visualização");
                                                                        }
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        toast.error("Ocorreu um erro ao carregar a pré-visualização");
                                                                    } finally {
                                                                        setIsLoading(false);
                                                                    }
                                                                }}
                                                                className="px-5 py-2 rounded-full border border-white/20 text-[12px] font-bold text-white backdrop-blur-md hover:bg-white/10 transition-all uppercase tracking-tight disabled:opacity-50"
                                                                disabled={isLoading}
                                                            >
                                                                Visualizar
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setIsLoading(true);
                                                                    try {
                                                                        const result = await saveProposalTemplate(formData.id, template.id);
                                                                        if (result.success) {
                                                                            window.open(`/proposals/${formData.id}/builder`, '_blank');
                                                                        } else {
                                                                            toast.error("Erro ao aplicar template");
                                                                        }
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        toast.error("Ocorreu um erro ao aplicar o template");
                                                                    } finally {
                                                                        setIsLoading(false);
                                                                    }
                                                                }}
                                                                className="px-5 py-2 rounded-full bg-[#EF0050] text-[12px] font-bold text-white hover:bg-[#D60048] transition-all uppercase tracking-tight disabled:opacity-50"
                                                                disabled={isLoading}
                                                            >
                                                                Editar
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[24px] font-bold text-white uppercase tracking-tight">{template.name}</p>
                                                        <p className="text-[14px] text-white/60">Template de proposta comercial</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {formData.selected_template === template.id && (
                                                <div className="absolute inset-0 border-[4px] border-[#EF0050] rounded-[30px] pointer-events-none z-20 shadow-[0_0_40px_rgba(239,0,80,0.3)]" />
                                            )}
                                        </motion.div>
                                    )) : (
                                        <div className="col-span-4 text-center text-[#97A1B3] py-20 w-full">Carregando templates...</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-12 h-[90px] shrink-0 flex justify-end items-center border-t border-[#373737]/10">
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-[#EF0050] hover:bg-[#D60048] text-white font-bold text-[14px] h-[48px] px-8 rounded-[4px] transition-all active:scale-95 flex items-center gap-3"
                    >
                        {isLoading ? "Salvando..." : "Salvar alterações"}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
