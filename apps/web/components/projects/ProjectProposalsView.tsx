"use client"

import * as React from "react"
import { Project } from "./ProjectsClient"
import {
    MoreHorizontal,
    Plus,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowUpRight,
    Download,
    Edit3
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectProposalCreateModal } from "./ProjectProposalCreateModal"
import { ProjectProposalEditModal } from "./ProjectProposalEditModal"
import { getProposalsByProject, deleteProposal } from "@/app/actions/proposals"
import { toast } from "sonner"
import { useCurrency, FormattedPrice } from "@/components/CurrencyUtils"

interface Proposal {
    id: string
    title: string
    identifier: string
    project_name?: string
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
    value: number
    currency: string
    sent_at?: string
    expires_at?: string
    created_at: string
    proposal_items?: { price: number; quantity: number }[]
}

const PROPOSAL_STATUS: Record<Proposal['status'], { label: string, color: string, bg: string, icon: React.ElementType }> = {
    draft: { label: "Rascunho", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)", icon: FileText },
    sent: { label: "Enviada", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: ArrowUpRight },
    accepted: { label: "Aceite", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: CheckCircle2 },
    rejected: { label: "Recusada", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: XCircle },
    expired: { label: "Expirada", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", icon: AlertCircle }
}

interface ProjectProposalsViewProps {
    project: Project
}

export function ProjectProposalsView({ project }: ProjectProposalsViewProps) {
    const { formatPrice } = useCurrency()
    const [proposals, setProposals] = React.useState<Proposal[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchProposals = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getProposalsByProject(project.id)
            setProposals(data)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar propostas")
        } finally {
            setIsLoading(false)
        }
    }, [project.id])

    React.useEffect(() => {
        fetchProposals()
    }, [fetchProposals])

    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
    const [selectedProposal, setSelectedProposal] = React.useState<Proposal | null>(null)

    const handleCreateProposal = () => {
        setIsCreateModalOpen(true)
    }

    return (
        <div className="flex flex-col gap-6 h-full font-inter-tight">
            {/* Header with Search and Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[#97A1B3] mb-1">Propostas Comerciais</h2>
                    <p className="text-xs text-[#97A1B3]/60">Gerencie e envie propostas comerciais para este projeto.</p>
                </div>
                <Button
                    onClick={handleCreateProposal}
                    className="h-11 px-6 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-[8px] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-accent-indigo/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Nova Proposta
                </Button>
            </div>

            {/* Table Area */}
            <div className="bg-transparent border border-[#373737] rounded-[8px] overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#15171F]/50 text-[#97A1B3] text-[11px] uppercase tracking-wider font-bold border-b border-[#373737]">
                                <th className="p-4 pl-8">Título da Proposta</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Data de Envio</th>
                                <th className="p-4">Expira em</th>
                                <th className="p-4 pr-8 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#373737]">
                            {proposals.map((proposal) => {
                                const status = PROPOSAL_STATUS[proposal.status] || PROPOSAL_STATUS.draft
                                const Icon = status.icon
                                const totalValue = proposal.proposal_items?.reduce((acc: number, item: { price: number; quantity: number }) => acc + (item.price * item.quantity), 0) || 0

                                return (
                                    <tr key={proposal.id} className="group hover:bg-[#15171F]/50 transition-all duration-300">
                                        <td className="p-4 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-[8px] bg-transparent border border-[#373737] flex items-center justify-center shrink-0 group-hover:border-accent-indigo/30 transition-colors shadow-sm text-[#97A1B3]">
                                                    <FileText className="w-5 h-5 opacity-60" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#97A1B3] group-hover:text-white transition-colors cursor-pointer">
                                                        {proposal.identifier}
                                                    </span>
                                                    <span className="text-[10px] text-[#97A1B3]/40 uppercase tracking-tight font-bold">
                                                        {proposal.project_name || 'Sem nome de projeto'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className="text-sm font-bold text-[#97A1B3]">
                                                <FormattedPrice amount={totalValue} />
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <Badge
                                                variant="outline"
                                                className="h-7 px-3 flex items-center gap-1.5 border border-[#373737] rounded-[100px] text-[10px] font-black uppercase tracking-tight bg-transparent"
                                                style={{ color: status.color, borderColor: `${status.color}30` }}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {status.label}
                                            </Badge>
                                        </td>

                                        <td className="p-4">
                                            <span className="text-xs font-bold text-[#97A1B3]/70">
                                                {proposal.sent_at ? new Date(proposal.sent_at).toLocaleDateString('pt-PT') : '---'}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            {proposal.expires_at ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-[#97A1B3]/40" />
                                                    <span className="text-xs font-bold text-[#97A1B3]/70">
                                                        {new Date(proposal.expires_at).toLocaleDateString('pt-PT')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[#97A1B3]/40 font-mono">---</span>
                                            )}
                                        </td>

                                        <td className="p-4 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Personalizar Proposta"
                                                    className="h-8 w-8 text-[#97A1B3] hover:text-[#EF0050] hover:bg-[#EF0050]/5 border border-[#373737] rounded-[8px] transition-all"
                                                    onClick={() => window.open(`/proposals/${proposal.id}/builder`, '_blank')}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Baixar PDF"
                                                    className="h-8 w-8 text-[#97A1B3] hover:text-white hover:bg-[#15171F] border border-[#373737] rounded-[8px] transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#97A1B3] hover:text-white hover:bg-[#15171F] border border-[#373737] rounded-[8px] transition-all">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 bg-[#0A0A0B] border border-[#373737] shadow-xl p-1 rounded-[8px]">
                                                        <DropdownMenuItem className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight p-2 rounded-[6px] cursor-pointer hover:bg-[#15171F] text-[#97A1B3] hover:text-white">
                                                            Visualizar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight p-2 rounded-[6px] cursor-pointer hover:bg-[#15171F] text-[#97A1B3] hover:text-white"
                                                            onClick={() => {
                                                                setSelectedProposal(proposal)
                                                                setIsEditModalOpen(true)
                                                            }}
                                                        >
                                                            Editar Proposta
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight p-2 rounded-[6px] cursor-pointer hover:bg-[#15171F] text-[#97A1B3] hover:text-white">
                                                            Enviar para Cliente
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight p-2 rounded-[6px] cursor-pointer hover:bg-[#15171F] text-red-500 hover:text-red-400"
                                                            onClick={async () => {
                                                                if (confirm("Tem certeza que deseja apagar esta proposta?")) {
                                                                    const res = await deleteProposal(proposal.id)
                                                                    if (res.success) {
                                                                        toast.success("Proposta apagada")
                                                                        fetchProposals()
                                                                    } else {
                                                                        toast.error("Erro ao apagar")
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Apagar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {proposals.length === 0 && !isLoading && (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-[8px] bg-transparent border border-[#373737] flex items-center justify-center mb-6 shadow-inner">
                                <FileText className="w-10 h-10 text-[#97A1B3] opacity-40" />
                            </div>
                            <h3 className="text-[#97A1B3] font-bold text-lg">Sem propostas para este projeto</h3>
                            <p className="text-[#97A1B3]/60 text-sm max-w-xs mt-2 font-medium">
                                Comece criando sua primeira proposta comercial para apresentar ao cliente.
                            </p>
                            <Button
                                onClick={handleCreateProposal}
                                className="mt-8 h-12 px-8 bg-transparent border border-[#373737] hover:bg-[#15171F] text-[#97A1B3] rounded-[8px] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Criar Proposta
                            </Button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-8 h-8 border-2 border-[#EF0050] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm text-[#97A1B3]">A carregar propostas...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-transparent border border-[#373737] p-6 rounded-[8px] shadow-sm hover:border-accent-indigo/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-[8px] bg-accent-indigo/5 border border-[#373737] flex items-center justify-center text-accent-indigo">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-transparent border-[#373737] text-[#97A1B3] font-bold">Total de Propostas</Badge>
                    </div>
                    <span className="text-2xl font-black text-[#97A1B3]">{proposals.length}</span>
                    <p className="text-[10px] text-[#97A1B3]/40 uppercase tracking-widest mt-1 font-bold">Documentos Emitidos</p>
                </div>

                <div className="bg-transparent border border-[#373737] p-6 rounded-[8px] shadow-sm hover:border-accent-emerald/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-[8px] bg-accent-emerald/5 border border-[#373737] flex items-center justify-center text-accent-emerald">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-transparent border-[#373737] text-[#97A1B3] font-bold">Taxa de Aprovação</Badge>
                    </div>
                    <span className="text-2xl font-black text-[#97A1B3]">
                        {Math.round((proposals.filter(p => p.status === 'accepted').length / proposals.length) * 100 || 0)}%
                    </span>
                    <p className="text-[10px] text-[#97A1B3]/40 uppercase tracking-widest mt-1 font-bold">Conversão Comercial</p>
                </div>

                <div className="bg-transparent border border-[#373737] p-6 rounded-[8px] shadow-sm hover:border-accent-purple/20 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-[8px] bg-accent-purple/5 border border-[#373737] flex items-center justify-center text-accent-purple">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-transparent border-[#373737] text-[#97A1B3] font-bold">Valor em Aberto</Badge>
                    </div>
                    <span className="text-2xl font-black text-[#97A1B3]">
                        {formatPrice(0)}
                    </span>
                    <p className="text-[10px] text-[#97A1B3]/40 uppercase tracking-widest mt-1 font-bold">Pendente Aprovação</p>
                </div>
            </div>

            <ProjectProposalCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    fetchProposals()
                }}
                project={project}
            />

            <ProjectProposalEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setSelectedProposal(null)
                    fetchProposals()
                }}
                project={project}
                proposal={selectedProposal}
            />
        </div>
    )
}
