"use client"

import * as React from "react"
import { Project } from "./ProjectsClient"
import { motion } from "framer-motion"
import { Plus, ChevronRight, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBrands } from "@/app/actions/brands"
import { createProposal } from "@/app/actions/proposals"
import { toast } from "sonner"

interface ProjectProposalCreateModalProps {
    isOpen: boolean
    onClose: () => void
    project?: Project | null
}

interface Brand {
    id: string
    name: string
    logo_url?: string
}

export function ProjectProposalCreateModal({ isOpen, onClose, project }: ProjectProposalCreateModalProps) {
    const [brands, setBrands] = React.useState<Brand[]>([])
    const [selectedBrand, setSelectedBrand] = React.useState("")
    const [selectedProject, setSelectedProject] = React.useState(project?.id || "")
    const [proposalId, setProposalId] = React.useState(`PR${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-0001`)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    React.useEffect(() => {
        if (isOpen) {
            const fetchBrands = async () => {
                const data = await getBrands()
                setBrands(data as Brand[])
                if (project?.brand_id) {
                    setSelectedBrand(project.brand_id)
                }
            }
            fetchBrands()
            if (project?.id) {
                setSelectedProject(project.id)
            }
        }
    }, [isOpen, project])

    if (!isOpen) return null

    const handleSubmit = async () => {
        if (!selectedBrand || !selectedProject || !proposalId) {
            toast.error("Por favor, preencha todos os campos obrigatórios")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await createProposal({
                project_id: selectedProject,
                brand_id: selectedBrand,
                identifier: proposalId,
                status: 'draft',
                items: [] // Creation modal doesn't have items initially
            })

            if (res.success) {
                toast.success("Proposta iniciada com sucesso!")
                onClose()
            } else {
                toast.error(res.error || "Erro ao criar proposta")
            }
        } catch (error) {
            console.error(error)
            toast.error("Ocorreu um erro inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

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
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[442px] bg-[#15161B] rounded-[8px] shadow-2xl overflow-hidden flex flex-col border border-[#373737]"
            >
                {/* Header */}
                <div className="bg-[#EF0050] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-[18px] font-bold text-white font-inter-tight">Criar proposta</h2>
                    <button
                        onClick={onClose}
                        className="w-[21px] h-[21px] bg-[#15161B] rounded-full transition-transform active:scale-90"
                    />
                </div>

                {/* Body */}
                <div className="p-8 space-y-10">
                    {/* Client Selection */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                className="w-full h-12 bg-transparent border-b border-[#373737] px-0 text-sm text-white appearance-none outline-none focus:border-[#EF0050] transition-all"
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                            >
                                <option value="" className="bg-[#1A1A1A]">Nome do cliente</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id} className="bg-[#1A1A1A]">
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#97A1B3] rotate-90 pointer-events-none" />
                        </div>
                        <Button
                            className="h-12 px-4 bg-[#EF0050] hover:bg-[#D60048] text-white rounded-[8px] flex items-center justify-center font-bold text-xs shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Project Selection */}
                    <div className="relative">
                        <select
                            className="w-full h-12 bg-transparent border-b border-[#373737] px-0 text-sm text-white appearance-none outline-none focus:border-[#EF0050] transition-all"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            <option value="" className="bg-[#1A1A1A]">Escolha um projeto</option>
                            {project && (
                                <option value={project.id} className="bg-[#1A1A1A]">{project.name}</option>
                            )}
                        </select>
                        <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#97A1B3] rotate-90 pointer-events-none" />
                    </div>

                    {/* Proposal Identification */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-[#97A1B3] uppercase tracking-widest">Identificação da proposta</label>
                            </div>
                            <input
                                type="text"
                                className="w-full h-12 bg-transparent border-b border-[#373737] px-0 text-sm text-white outline-none focus:border-[#EF0050] transition-all"
                                value={proposalId}
                                onChange={(e) => setProposalId(e.target.value)}
                                placeholder="PR2026-01-0001"
                            />
                        </div>
                        <p className="text-[12px] text-[#97A1B3] leading-relaxed italic">
                            A sugestão automática de identificação de proposta está ativa. Ainda sim, você pode utilizar o texto que preferir...
                        </p>
                    </div>

                    {/* Quick Action Box */}
                    <div className="bg-[#2A2A2A] rounded-[8px] p-4 flex items-center justify-center">
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#373737] text-[12px] font-bold text-[#97A1B3] hover:text-white hover:bg-white/5 transition-all"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Link interno copiado!");
                            }}
                        >
                            <LinkIcon className="w-3.5 h-3.5" />
                            Copy internal link
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 pb-8 flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-12 border border-[#373737] text-[#97A1B3] hover:text-white hover:bg-white/5 font-bold text-sm rounded-[8px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 h-12 bg-[#EF0050] hover:bg-[#D60048] text-white font-bold text-sm rounded-[8px]"
                    >
                        {isSubmitting ? "A criar..." : "Criar Proposta"}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
