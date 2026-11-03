"use client"

import * as React from "react"
import { Project } from "./ProjectsClient"
import {
    MoreHorizontal,
    Plus,
    FileText,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Download,
    PenLine,
    Eye,
    Send,
    Link2,
    Undo2,
    Trash2,
    Settings2,
    CalendarClock,
    Hourglass,
    Wallet,
    LayoutTemplate,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectProposalCreateModal } from "./ProjectProposalCreateModal"
import { TemplateGalleryModal } from "@/components/proposals/TemplateGalleryModal"
import { ProjectProposalEditModal } from "./ProjectProposalEditModal"
import { getProposalsByProject, deleteProposal, setProposalStatus, type ProposalRow } from "@/app/actions/proposals"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/CurrencyUtils"
import { PANEL, TABLE_HEAD, TABLE_ROW, Pill, StatStrip, DarkButton, Modal, ModalPrimary, ModalSecondary, type Tone } from "@/components/workspace/ui"

type Status = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

const STATUS: Record<Status, { label: string, tone: Tone }> = {
    draft: { label: "Rascunho", tone: "zinc" },
    sent: { label: "Enviada", tone: "indigo" },
    accepted: { label: "Aceite", tone: "green" },
    rejected: { label: "Recusada", tone: "rose" },
    expired: { label: "Expirada", tone: "amber" },
}

/** A sent proposal past its validity shows as expired */
function statusOf(p: ProposalRow): Status {
    const s = (p.status in STATUS ? p.status : 'draft') as Status
    if (s === 'sent' && p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return 'expired'
    return s
}

const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const GRID = "grid grid-cols-[minmax(200px,2fr)_minmax(110px,1fr)_minmax(100px,0.9fr)_minmax(100px,0.9fr)_minmax(110px,1fr)_112px] gap-4 items-center"

export function ProjectProposalsView({ project }: { project: Project }) {
    const { formatPrice } = useCurrency()
    const [proposals, setProposals] = React.useState<ProposalRow[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isGalleryOpen, setIsGalleryOpen] = React.useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
    const [selectedProposal, setSelectedProposal] = React.useState<ProposalRow | null>(null)
    const [toDelete, setToDelete] = React.useState<ProposalRow | null>(null)
    const [busy, setBusy] = React.useState(false)

    const fetchProposals = React.useCallback(async () => {
        try {
            setProposals(await getProposalsByProject(project.id))
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar propostas")
        } finally {
            setIsLoading(false)
        }
    }, [project.id])

    React.useEffect(() => {
        // Async fetch: state is set after the request resolves
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProposals()
    }, [fetchProposals])

    const clientLink = (p: ProposalRow) => `${window.location.origin}/share/${p.id}/proposal`
    const openBuilder = (id: string) => window.open(`/proposals/${id}/builder`, '_blank', 'noopener')
    const openPreview = (p: ProposalRow) => window.open(`/proposals/${p.id}/view`, '_blank', 'noopener')
    const downloadPdf = (p: ProposalRow) => window.open(`/proposals/${p.id}/view?print=1`, '_blank', 'noopener')

    const changeStatus = async (p: ProposalRow, status: 'draft' | 'sent' | 'accepted' | 'rejected', message: string) => {
        const previous = proposals
        setProposals(list => list.map(x => x.id === p.id ? { ...x, status } : x))
        const res = await setProposalStatus(p.id, status)
        if (res.success) toast.success(message)
        else {
            setProposals(previous)
            toast.error(('error' in res && res.error) || "Não foi possível alterar o estado")
        }
        return !!res.success
    }

    // Sending = the proposal leaves draft and the client gets a link that opens without an account
    const sendToClient = async (p: ProposalRow) => {
        if (p.status === 'draft' && !(await changeStatus(p, 'sent', "Proposta marcada como enviada"))) return
        try {
            await navigator.clipboard.writeText(clientLink(p))
            toast.success("Link do cliente copiado", { description: "Cole-o num email ou mensagem para o cliente." })
        } catch {
            toast.message("Link do cliente", { description: clientLink(p) })
        }
    }

    const confirmDelete = async () => {
        if (!toDelete) return
        setBusy(true)
        const res = await deleteProposal(toDelete.id)
        setBusy(false)
        if (res.success) {
            toast.success("Proposta apagada")
            setProposals(list => list.filter(x => x.id !== toDelete.id))
            setToDelete(null)
        } else {
            toast.error(('error' in res && res.error) || "Erro ao apagar")
        }
    }

    // Metrics
    const withStatus = proposals.map(p => ({ p, s: statusOf(p) }))
    const decided = withStatus.filter(x => x.s === 'accepted' || x.s === 'rejected').length
    const accepted = withStatus.filter(x => x.s === 'accepted')
    const open = withStatus.filter(x => x.s === 'sent')
    const approvalRate = decided ? Math.round(accepted.length / decided * 100) : 0
    const openValue = open.reduce((acc, x) => acc + x.p.total, 0)
    const acceptedValue = accepted.reduce((acc, x) => acc + x.p.total, 0)

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Propostas</h2>
                    <p className="text-xs text-zinc-500 mt-1">Crie, envie e acompanhe as propostas comerciais deste projeto.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsGalleryOpen(true)}
                        className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-white/10 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] inline-flex items-center gap-1.5 transition-colors"
                        title="Começar uma proposta a partir de um template pronto"
                    >
                        <LayoutTemplate className="w-3.5 h-3.5" /> Templates
                    </button>
                    <DarkButton onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-3.5 h-3.5" /> Nova proposta
                    </DarkButton>
                </div>
            </div>

            <StatStrip stats={[
                { label: "Propostas", value: proposals.length, icon: FileText, tone: 'zinc' },
                { label: "Taxa de aprovação", value: `${approvalRate}%`, icon: CheckCircle2, tone: 'green' },
                { label: "Valor em aberto", value: formatPrice(openValue), icon: Hourglass, tone: 'indigo' },
                { label: "Valor aceite", value: formatPrice(acceptedValue), icon: Wallet, tone: 'pink' },
            ]} />

            {/* Table */}
            {isLoading ? (
                <div className={cn(PANEL, "py-16 flex items-center justify-center")}>
                    <div className="w-5 h-5 border-2 border-[#ff0054] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : proposals.length === 0 ? (
                <div className="border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl px-6 py-16 flex flex-col items-center text-center">
                    <FileText className="w-5 h-5 text-zinc-400 mb-3" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ainda não há propostas</h3>
                    <p className="text-xs text-zinc-500 mt-1.5 max-w-md">Crie a primeira proposta deste projeto, escreva-a no editor e envie o link ao cliente.</p>
                    <DarkButton className="mt-5" onClick={() => setIsCreateModalOpen(true)}><Plus className="w-3.5 h-3.5" /> Nova proposta</DarkButton>
                </div>
            ) : (
                <div className={cn(PANEL, "overflow-hidden")}>
                    <div className="w-full overflow-x-auto no-scrollbar">
                        <div className="min-w-[820px]">
                            <div className={cn(TABLE_HEAD, GRID)}>
                                <span>Proposta</span><span>Valor</span><span>Estado</span><span>Criada</span><span>Válida até</span><span />
                            </div>
                            {withStatus.map(({ p, s }) => (
                                <div key={p.id} className={cn(TABLE_ROW, GRID, "group")}>
                                    <button type="button" onClick={() => openBuilder(p.id)} className="flex items-center gap-3 min-w-0 text-left" title="Abrir no editor">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm">
                                            <FileText className="w-3.5 h-3.5 text-red-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#ff0054] transition-colors font-mono">{p.identifier}</p>
                                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{p.brand_name || project.name}</p>
                                        </div>
                                    </button>
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums truncate">{formatPrice(p.total)}</span>
                                    <span><Pill tone={STATUS[s].tone}>{STATUS[s].label}</Pill></span>
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{fmtDate(p.created_at)}</span>
                                    <span className={cn("text-xs flex items-center gap-1.5", s === 'expired' ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400")}>
                                        {p.expires_at ? <><CalendarClock className="w-3.5 h-3.5 opacity-70" />{fmtDate(p.expires_at)}</> : <span className="text-zinc-400">Sem prazo</span>}
                                    </span>

                                    <div className="flex items-center justify-end gap-1">
                                        <IconAction title="Abrir no editor" onClick={() => openBuilder(p.id)}><PenLine className="w-3.5 h-3.5" /></IconAction>
                                        <IconAction title="Baixar PDF" onClick={() => downloadPdf(p)}><Download className="w-3.5 h-3.5" /></IconAction>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button type="button" aria-label="Mais ações" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#0c0c0e] border-zinc-200/80 dark:border-white/[0.08] shadow-xl p-1 rounded-xl">
                                                <MenuItem icon={Eye} onClick={() => openPreview(p)}>Pré-visualizar</MenuItem>
                                                <MenuItem icon={Settings2} onClick={() => { setSelectedProposal(p); setIsEditModalOpen(true) }}>Editar detalhes</MenuItem>
                                                <DropdownMenuSeparator className="bg-zinc-200/80 dark:bg-white/[0.06]" />
                                                {p.status === 'draft'
                                                    ? <MenuItem icon={Send} onClick={() => sendToClient(p)}>Enviar ao cliente</MenuItem>
                                                    : <MenuItem icon={Link2} onClick={() => sendToClient(p)}>Copiar link do cliente</MenuItem>}
                                                {p.status !== 'draft' && (
                                                    <MenuItem icon={ArrowUpRight} onClick={() => window.open(clientLink(p), '_blank', 'noopener')}>Ver como cliente</MenuItem>
                                                )}
                                                {p.status !== 'accepted' && p.status !== 'draft' && (
                                                    <MenuItem icon={CheckCircle2} onClick={() => changeStatus(p, 'accepted', "Proposta marcada como aceite")}>Marcar como aceite</MenuItem>
                                                )}
                                                {p.status !== 'rejected' && p.status !== 'draft' && (
                                                    <MenuItem icon={XCircle} onClick={() => changeStatus(p, 'rejected', "Proposta marcada como recusada")}>Marcar como recusada</MenuItem>
                                                )}
                                                {p.status !== 'draft' && (
                                                    <MenuItem icon={Undo2} onClick={() => changeStatus(p, 'draft', "A proposta voltou a rascunho. O link do cliente deixa de abrir.")}>Voltar a rascunho</MenuItem>
                                                )}
                                                <DropdownMenuSeparator className="bg-zinc-200/80 dark:bg-white/[0.06]" />
                                                <MenuItem icon={Trash2} danger onClick={() => setToDelete(p)}>Apagar</MenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <TemplateGalleryModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                projectId={project.id}
                projectName={(project as any).name ?? (project as any).title ?? null}
                onCreated={() => fetchProposals()}
            />

            <ProjectProposalCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    fetchProposals()
                }}
                onCreated={(id) => toast("Abrir a proposta no editor?", { action: { label: "Abrir editor", onClick: () => openBuilder(id) } })}
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

            <Modal
                open={!!toDelete}
                onClose={() => { if (!busy) setToDelete(null) }}
                title="Apagar proposta"
                footer={<>
                    <ModalSecondary onClick={() => setToDelete(null)} disabled={busy}>Cancelar</ModalSecondary>
                    <ModalPrimary onClick={confirmDelete} loading={busy}>Apagar</ModalPrimary>
                </>}
            >
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    A proposta <span className="font-mono font-semibold">{toDelete?.identifier}</span> e o seu conteúdo serão apagados. Se já foi enviada, o link do cliente deixa de abrir. Esta ação não pode ser anulada.
                </p>
            </Modal>
        </div>
    )
}

function IconAction({ title, onClick, children }: { title: string, onClick: () => void, children: React.ReactNode }) {
    return (
        <button type="button" title={title} aria-label={title} onClick={onClick} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors">
            {children}
        </button>
    )
}

function MenuItem({ icon: Icon, onClick, danger, children }: { icon: React.ComponentType<{ className?: string }>, onClick: () => void, danger?: boolean, children: React.ReactNode }) {
    return (
        <DropdownMenuItem
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-lg cursor-pointer font-medium",
                danger ? "text-red-500 focus:text-red-500 focus:bg-red-500/10" : "text-zinc-700 dark:text-zinc-200"
            )}
        >
            <Icon className={cn("w-3.5 h-3.5", danger ? "" : "text-zinc-400")} />
            {children}
        </DropdownMenuItem>
    )
}
