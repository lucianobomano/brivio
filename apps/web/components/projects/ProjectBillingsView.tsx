"use client"

import * as React from "react"
import { Project } from "./ProjectsClient"
import {
    Plus,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Filter,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    FileText,
    Receipt,
    CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentBuilder } from "./document-builder/DocumentBuilder"
import { getDocumentsByProject, createDocument } from "@/app/actions/financial-documents"
import { Badge } from "@/components/ui/badge"
import { getProjectBillings, createProjectBilling, Billing } from "@/app/actions/project-billings"
import { getProposalsByProject } from "@/app/actions/proposals"
import { toast } from "sonner"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrency, FormattedPrice } from "@/components/CurrencyUtils"
import { cn } from "@/lib/utils"

interface ProjectBillingsViewProps {
    project: Project
}

type Proposal = {
    id: string
    identifier: string
    status?: string
    proposal_items?: {
        quantity: number
        price: number
    }[]
}

// Types for Invoice and Receipt (to be added to server actions later)
interface Invoice {
    id: string
    project_id: string
    identifier: string
    amount: number
    currency: string
    status: 'draft' | 'sent' | 'paid' | 'cancelled'
    due_date: string
    issued_at: string
    client_name?: string
    client_email?: string
    items?: InvoiceItem[]
    proposal_id?: string
    proposal?: {
        identifier: string
    }
}

interface InvoiceItem {
    description: string
    quantity: number
    unit_price: number
}

interface ReceiptType {
    id: string
    project_id: string
    identifier: string
    amount: number
    currency: string
    payment_method: 'transfer' | 'card' | 'cash' | 'pix' | 'other'
    received_at: string
    billing_id?: string
    invoice_id?: string
    notes?: string
}

type ActiveView = 'billings' | 'invoices' | 'receipts'

const BILLING_STATUS: Record<Billing['status'], { label: string, color: string, bg: string, icon: React.ElementType }> = {
    pending: { label: "Pendente", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: Clock },
    paid: { label: "Pago", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: CheckCircle2 },
    overdue: { label: "Atrasado", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: AlertCircle },
    cancelled: { label: "Cancelado", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)", icon: XCircle }
}

const INVOICE_STATUS: Record<Invoice['status'], { label: string, color: string, bg: string, icon: React.ElementType }> = {
    draft: { label: "Rascunho", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)", icon: FileText },
    sent: { label: "Enviada", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: Clock },
    paid: { label: "Paga", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: CheckCircle2 },
    cancelled: { label: "Cancelada", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: XCircle }
}

const PAYMENT_METHODS: Record<ReceiptType['payment_method'], string> = {
    transfer: "Transferência",
    card: "Cartão",
    cash: "Dinheiro",
    pix: "PIX",
    other: "Outro"
}

export function ProjectBillingsView({ project }: ProjectBillingsViewProps) {
    const { formatPrice, currencyCode } = useCurrency()
    const [billings, setBillings] = React.useState<Billing[]>([])
    const [invoices, setInvoices] = React.useState<Invoice[]>([])
    const [receipts, setReceipts] = React.useState<ReceiptType[]>([])
    const [proposals, setProposals] = React.useState<Proposal[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [activeView, setActiveView] = React.useState<ActiveView>('billings')

    // Modal states
    const [isCreateBillingModalOpen, setIsCreateBillingModalOpen] = React.useState(false)
    const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = React.useState(false)
    const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = React.useState(false)
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Document Builder state
    const [isDocumentBuilderOpen, setIsDocumentBuilderOpen] = React.useState(false)
    const [documentBuilderConfig, setDocumentBuilderConfig] = React.useState<{
        type: 'invoice' | 'receipt' | 'billing',
        initialData?: any
    }>({ type: 'invoice' })

    // Form states
    const [billingFormData, setBillingFormData] = React.useState({
        identifier: `COB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: "",
        due_date: format(new Date(), "yyyy-MM-dd"),
        proposal_id: "none" as string
    })

    const [invoiceFormData, setInvoiceFormData] = React.useState({
        identifier: `FAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: "",
        due_date: format(new Date(), "yyyy-MM-dd"),
        client_name: "",
        client_email: "",
        proposal_id: "none" as string,
        items: [{ description: "", quantity: 1, unit_price: 0 }] as InvoiceItem[]
    })

    const [receiptFormData, setReceiptFormData] = React.useState({
        identifier: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: "",
        payment_method: "transfer" as ReceiptType['payment_method'],
        received_at: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        billing_id: "none" as string
    })

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [billingsData, invoicesData, receiptsData, proposalsData] = await Promise.all([
                getProjectBillings(project.id),
                getDocumentsByProject(project.id, 'invoice'),
                getDocumentsByProject(project.id, 'receipt'),
                getProposalsByProject(project.id)
            ])
            setBillings(billingsData)
            setInvoices(invoicesData as Invoice[])
            setReceipts(receiptsData as ReceiptType[])
            setProposals(proposalsData as Proposal[])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar dados")
        } finally {
            setIsLoading(false)
        }
    }, [project.id])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateBilling = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const result = await createProjectBilling(project.id, {
                identifier: billingFormData.identifier,
                amount: parseFloat(billingFormData.amount),
                due_date: billingFormData.due_date,
                proposal_id: billingFormData.proposal_id === "none" ? undefined : billingFormData.proposal_id,
                currency: currencyCode || project.currency || 'EUR',
                status: 'pending'
            })

            if (result.success) {
                toast.success("Cobrança emitida com sucesso")
                setIsCreateBillingModalOpen(false)
                setBillingFormData({
                    identifier: `COB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    amount: "",
                    due_date: format(new Date(), "yyyy-MM-dd"),
                    proposal_id: "none"
                })
                fetchData()
            } else {
                toast.error(result.error || "Erro ao emitir cobrança")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const amount = invoiceFormData.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
            const result = await createDocument('invoice', {
                identifier: invoiceFormData.identifier,
                amount: amount || parseFloat(invoiceFormData.amount) || 0,
                due_date: invoiceFormData.due_date,
                client_name: invoiceFormData.client_name,
                client_email: invoiceFormData.client_email,
                proposal_id: invoiceFormData.proposal_id === "none" ? undefined : invoiceFormData.proposal_id,
                currency: currencyCode || project.currency || 'EUR',
                status: 'draft',
                project_id: project.id,
                items: invoiceFormData.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: item.unit_price
                }))
            })

            if (result.success) {
                toast.success("Fatura emitida com sucesso")
                setIsCreateInvoiceModalOpen(false)
                setInvoiceFormData({
                    identifier: `FAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    amount: "",
                    due_date: format(new Date(), "yyyy-MM-dd"),
                    client_name: "",
                    client_email: "",
                    proposal_id: "none",
                    items: [{ description: "", quantity: 1, unit_price: 0 }]
                })
                fetchData()
            } else {
                toast.error(result.error || "Erro ao emitir fatura")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateReceipt = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const result = await createDocument('receipt', {
                identifier: receiptFormData.identifier,
                amount: parseFloat(receiptFormData.amount),
                payment_method: receiptFormData.payment_method,
                received_at: receiptFormData.received_at,
                notes: receiptFormData.notes,
                billing_id: receiptFormData.billing_id === "none" ? undefined : receiptFormData.billing_id,
                currency: currencyCode || project.currency || 'EUR',
                project_id: project.id
            })

            if (result.success) {
                toast.success("Recibo emitido com sucesso")
                setIsCreateReceiptModalOpen(false)
                setReceiptFormData({
                    identifier: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    amount: "",
                    payment_method: "transfer",
                    received_at: format(new Date(), "yyyy-MM-dd"),
                    notes: "",
                    billing_id: "none"
                })
                fetchData()
            } else {
                toast.error(result.error || "Erro ao emitir recibo")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalPaid = billings.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.amount, 0)
    const totalPending = billings.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((acc, b) => acc + b.amount, 0)

    const handlePopoverSelect = (type: 'billing' | 'invoice' | 'receipt') => {
        setIsPopoverOpen(false)
        if (type === 'billing') {
            setIsCreateBillingModalOpen(true)
        } else if (type === 'invoice') {
            setIsDocumentBuilderOpen(true);
            setDocumentBuilderConfig({ type: 'invoice' });
        } else {
            setIsCreateReceiptModalOpen(true)
        }
    }

    return (
        <div className="flex flex-col gap-6 h-full font-inter">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1A1A1A]/40 backdrop-blur-md border border-[#373737]/30 rounded-[16px] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Total Recebido</span>
                    </div>
                    <div className="text-2xl font-black text-white">{formatPrice(totalPaid)}</div>
                    <div className="text-[10px] text-[#97A1B3]/60 mt-1">Valores liquidados com sucesso</div>
                </div>

                <div className="bg-[#1A1A1A]/40 backdrop-blur-md border border-[#373737]/30 rounded-[16px] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Pendente</span>
                    </div>
                    <div className="text-2xl font-black text-white">{formatPrice(totalPending)}</div>
                    <div className="text-[10px] text-[#97A1B3]/60 mt-1">Aguardando confirmação de pagamento</div>
                </div>

                <div className="bg-[#EF0050]/5 backdrop-blur-md border border-[#EF0050]/20 rounded-[16px] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#EF0050]/10 flex items-center justify-center text-[#EF0050]">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Orçamento Total</span>
                    </div>
                    <div className="text-2xl font-black text-[#EF0050]">{formatPrice(project.budget_amount || 0)}</div>
                    <div className="text-[10px] text-[#97A1B3]/60 mt-1">Valor total do contrato original</div>
                </div>
            </div>

            {/* Invoices Header */}
            <div className="flex items-center justify-between mt-4">
                <div>
                    <h2 className="text-xl font-bold text-[#97A1B3] mb-1">Faturas e Cobranças</h2>
                    <p className="text-xs text-[#97A1B3]/60">Controle financeiro e histórico de pagamentos.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="h-11 px-6 border border-[#373737]/30 text-[#97A1B3] rounded-[8px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filtrar
                    </Button>

                    {/* Popover for Emitir button */}
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                className="h-11 px-6 bg-[#ff0054] hover:bg-[#ff0054]/90 text-white rounded-[8px] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#ff0054]/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Emitir
                                <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-56 p-2 bg-[#1A1A1A] border border-[#373737]/50 rounded-[12px] shadow-xl"
                            align="end"
                            sideOffset={8}
                        >
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handlePopoverSelect('billing')}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#ff0054]/10 flex items-center justify-center text-[#ff0054] group-hover:bg-[#ff0054]/20 transition-colors">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-white block">Emitir cobrança</span>
                                        <span className="text-[10px] text-[#97A1B3]/60">Solicitar pagamento</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handlePopoverSelect('invoice')}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6]/20 transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-white block">Emitir fatura</span>
                                        <span className="text-[10px] text-[#97A1B3]/60">Documento fiscal</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handlePopoverSelect('receipt')}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] group-hover:bg-[#10b981]/20 transition-colors">
                                        <Receipt className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-white block">Emitir recibo</span>
                                        <span className="text-[10px] text-[#97A1B3]/60">Comprovante de pagamento</span>
                                    </div>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveView('billings')}
                    className={cn(
                        "h-10 px-5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                        activeView === 'billings'
                            ? "bg-[#ff0054] text-white shadow-lg shadow-[#ff0054]/20"
                            : "bg-[#1A1A1A]/40 text-[#97A1B3] border border-[#373737]/30 hover:bg-[#1A1A1A]/60"
                    )}
                >
                    <CreditCard className="w-4 h-4" />
                    Cobranças
                    {billings.length > 0 && (
                        <span className={cn(
                            "ml-1 px-2 py-0.5 rounded-full text-[9px] font-black",
                            activeView === 'billings' ? "bg-white/20" : "bg-[#373737]/50"
                        )}>
                            {billings.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveView('invoices')}
                    className={cn(
                        "h-10 px-5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                        activeView === 'invoices'
                            ? "bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/20"
                            : "bg-[#1A1A1A]/40 text-[#97A1B3] border border-[#373737]/30 hover:bg-[#1A1A1A]/60"
                    )}
                >
                    <FileText className="w-4 h-4" />
                    Faturas
                    {invoices.length > 0 && (
                        <span className={cn(
                            "ml-1 px-2 py-0.5 rounded-full text-[9px] font-black",
                            activeView === 'invoices' ? "bg-white/20" : "bg-[#373737]/50"
                        )}>
                            {invoices.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveView('receipts')}
                    className={cn(
                        "h-10 px-5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                        activeView === 'receipts'
                            ? "bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20"
                            : "bg-[#1A1A1A]/40 text-[#97A1B3] border border-[#373737]/30 hover:bg-[#1A1A1A]/60"
                    )}
                >
                    <Receipt className="w-4 h-4" />
                    Recibos
                    {receipts.length > 0 && (
                        <span className={cn(
                            "ml-1 px-2 py-0.5 rounded-full text-[9px] font-black",
                            activeView === 'receipts' ? "bg-white/20" : "bg-[#373737]/50"
                        )}>
                            {receipts.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-transparent border border-[#373737]/30 rounded-[12px] overflow-hidden flex-1 flex flex-col min-h-0 bg-[#1A1A1A]/20 backdrop-blur-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    {/* Billings Table */}
                    {activeView === 'billings' && (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#373737]/30 bg-black/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Referência</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Vencimento</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#373737]/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                            Carregando histórico financeiro...
                                        </td>
                                    </tr>
                                ) : billings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                            Nenhuma cobrança registrada neste projeto.
                                        </td>
                                    </tr>
                                ) : (
                                    billings.map((billing) => {
                                        const status = BILLING_STATUS[billing.status]
                                        return (
                                            <tr key={billing.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-white uppercase tracking-tight">{billing.identifier}</div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-[#97A1B3]/60">Emitido em {format(new Date(billing.issued_at), "dd/MM/yyyy")}</span>
                                                        {billing.proposal?.identifier && (
                                                            <span className="text-[9px] text-[#3b82f6] font-bold mt-0.5">Ref: {billing.proposal.identifier}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-white">
                                                    <FormattedPrice amount={billing.amount} />
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[#97A1B3]">
                                                    {format(new Date(billing.due_date), "dd MMM yyyy", { locale: pt })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full px-3 py-1 border-none flex items-center gap-1.5 w-fit"
                                                        style={{ backgroundColor: status.bg, color: status.color }}
                                                    >
                                                        <status.icon className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-[#97A1B3]"
                                                        onClick={() => {
                                                            setIsDocumentBuilderOpen(true);
                                                            setDocumentBuilderConfig({ type: 'billing', initialData: billing });
                                                        }}
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Invoices Table */}
                    {activeView === 'invoices' && (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#373737]/30 bg-black/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Referência</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Vencimento</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#373737]/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                            Carregando faturas...
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                            Nenhuma fatura registrada neste projeto.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => {
                                        const status = INVOICE_STATUS[invoice.status]
                                        return (
                                            <tr key={invoice.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-white uppercase tracking-tight">{invoice.identifier}</div>
                                                    <span className="text-[10px] text-[#97A1B3]/60">Emitida em {format(new Date(invoice.issued_at), "dd/MM/yyyy")}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-white">{invoice.client_name || '-'}</div>
                                                    <span className="text-[10px] text-[#97A1B3]/60">{invoice.client_email || ''}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-white">
                                                    <FormattedPrice amount={invoice.amount} />
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[#97A1B3]">
                                                    {format(new Date(invoice.due_date), "dd MMM yyyy", { locale: pt })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full px-3 py-1 border-none flex items-center gap-1.5 w-fit"
                                                        style={{ backgroundColor: status.bg, color: status.color }}
                                                    >
                                                        <status.icon className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-[#97A1B3]"
                                                        onClick={() => {
                                                            setIsDocumentBuilderOpen(true);
                                                            setDocumentBuilderConfig({ type: 'invoice', initialData: invoice });
                                                        }}
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Receipts Table */}
                    {activeView === 'receipts' && (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#373737]/30 bg-black/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Referência</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Método</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#373737]/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                            Carregando recibos...
                                        </td>
                                    </tr>
                                ) : receipts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                            Nenhum recibo registrado neste projeto.
                                        </td>
                                    </tr>
                                ) : (
                                    receipts.map((receipt) => (
                                        <tr key={receipt.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-white uppercase tracking-tight">{receipt.identifier}</div>
                                                {receipt.notes && (
                                                    <span className="text-[10px] text-[#97A1B3]/60">{receipt.notes}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#10b981]">
                                                <FormattedPrice amount={receipt.amount} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-full px-3 py-1 border-none bg-[#10b981]/10 text-[#10b981]"
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {PAYMENT_METHODS[receipt.payment_method]}
                                                    </span>
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-[#97A1B3]">
                                                {format(new Date(receipt.received_at), "dd MMM yyyy", { locale: pt })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-[#97A1B3]"
                                                    onClick={() => {
                                                        setIsDocumentBuilderOpen(true);
                                                        setDocumentBuilderConfig({ type: 'receipt', initialData: receipt });
                                                    }}
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create Billing Modal */}
            <Dialog open={isCreateBillingModalOpen} onOpenChange={setIsCreateBillingModalOpen}>
                <DialogContent className="bg-[#15161B] border-none p-0 gap-0 rounded-[8px] max-w-[500px] overflow-hidden [&>button]:hidden">
                    <div className="h-[53px] bg-[#ff0054] px-6 flex items-center justify-between">
                        <span className="text-white font-bold text-lg">Emitir nova cobrança</span>
                        <div
                            onClick={() => setIsCreateBillingModalOpen(false)}
                            className="w-[21px] h-[21px] rounded-full bg-[#15161B] cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    </div>

                    <form onSubmit={handleCreateBilling} className="p-[30px] flex flex-col gap-[40px]">
                        <div className="space-y-4">
                            <Label htmlFor="billing-identifier" className="text-[#97a1b3] font-normal">Referência</Label>
                            <Input
                                id="billing-identifier"
                                value={billingFormData.identifier}
                                onChange={(e) => setBillingFormData({ ...billingFormData, identifier: e.target.value })}
                                className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#ff0054] placeholder:text-[#97a1b3]/26"
                                placeholder="COB-2026-0001"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-[40px]">
                            <div className="space-y-4">
                                <Label htmlFor="billing-amount" className="text-[#97a1b3] font-normal">Valor({currencyCode})</Label>
                                <Input
                                    id="billing-amount"
                                    type="number"
                                    step="0.01"
                                    value={billingFormData.amount}
                                    onChange={(e) => setBillingFormData({ ...billingFormData, amount: e.target.value })}
                                    className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#ff0054] placeholder:text-[#97a1b3]/26"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="billing-due_date" className="text-[#97a1b3] font-normal">Vencimento</Label>
                                <div className="relative">
                                    <Input
                                        id="billing-due_date"
                                        type="date"
                                        value={billingFormData.due_date}
                                        onChange={(e) => setBillingFormData({ ...billingFormData, due_date: e.target.value })}
                                        onClick={(e) => {
                                            try {
                                                (e.target as HTMLInputElement).showPicker()
                                            } catch { }
                                        }}
                                        className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#ff0054] appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 z-10 relative cursor-pointer"
                                        required
                                    />
                                    <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#373737] pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[#97a1b3] font-normal">Relacionar à Proposta (Opcional)</Label>
                            <Select
                                value={billingFormData.proposal_id}
                                onValueChange={(value) => {
                                    const selected = proposals.find(p => p.id === value)
                                    let amount = billingFormData.amount
                                    if (selected?.proposal_items) {
                                        const total = selected.proposal_items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)
                                        amount = total.toString()
                                    }
                                    setBillingFormData({ ...billingFormData, proposal_id: value, amount })
                                }}
                            >
                                <SelectTrigger className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus:ring-0 focus:border-[#ff0054] [&>svg]:hidden">
                                    <SelectValue placeholder="Escolha um projeto" className="placeholder:text-[#97a1b3]/26" />
                                    <ChevronDown className="absolute right-0 w-5 h-5 text-[#373737]" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-[#373737] text-white">
                                    <SelectItem value="none">Nenhuma proposta</SelectItem>
                                    {proposals.map((proposal) => (
                                        <SelectItem key={proposal.id} value={proposal.id}>
                                            {proposal.identifier}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-[53px] bg-[#ff0054] hover:bg-[#ff0054]/90 text-white font-bold rounded-full text-base mt-2"
                        >
                            {isSubmitting ? "Emitindo..." : "Emitir Cobrança"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Invoice Modal */}
            <Dialog open={isCreateInvoiceModalOpen} onOpenChange={setIsCreateInvoiceModalOpen}>
                <DialogContent className="bg-[#15161B] border-none p-0 gap-0 rounded-[8px] max-w-[600px] overflow-hidden [&>button]:hidden max-h-[90vh] overflow-y-auto">
                    <div className="h-[53px] bg-[#3b82f6] px-6 flex items-center justify-between sticky top-0 z-10">
                        <span className="text-white font-bold text-lg">Emitir nova fatura</span>
                        <div
                            onClick={() => setIsCreateInvoiceModalOpen(false)}
                            className="w-[21px] h-[21px] rounded-full bg-[#15161B] cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    </div>

                    <form onSubmit={handleCreateInvoice} className="p-[30px] flex flex-col gap-[30px]">
                        <div className="space-y-4">
                            <Label htmlFor="invoice-identifier" className="text-[#97a1b3] font-normal">Referência</Label>
                            <Input
                                id="invoice-identifier"
                                value={invoiceFormData.identifier}
                                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, identifier: e.target.value })}
                                className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#3b82f6] placeholder:text-[#97a1b3]/26"
                                placeholder="FAT-2026-0001"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-[30px]">
                            <div className="space-y-4">
                                <Label htmlFor="invoice-client_name" className="text-[#97a1b3] font-normal">Nome do Cliente</Label>
                                <Input
                                    id="invoice-client_name"
                                    value={invoiceFormData.client_name}
                                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, client_name: e.target.value })}
                                    className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#3b82f6] placeholder:text-[#97a1b3]/26"
                                    placeholder="Nome completo"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="invoice-client_email" className="text-[#97a1b3] font-normal">Email do Cliente</Label>
                                <Input
                                    id="invoice-client_email"
                                    type="email"
                                    value={invoiceFormData.client_email}
                                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, client_email: e.target.value })}
                                    className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#3b82f6] placeholder:text-[#97a1b3]/26"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-[30px]">
                            <div className="space-y-4">
                                <Label htmlFor="invoice-amount" className="text-[#97a1b3] font-normal">Valor Total ({currencyCode})</Label>
                                <Input
                                    id="invoice-amount"
                                    type="number"
                                    step="0.01"
                                    value={invoiceFormData.amount}
                                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: e.target.value })}
                                    className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#3b82f6] placeholder:text-[#97a1b3]/26"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="invoice-due_date" className="text-[#97a1b3] font-normal">Vencimento</Label>
                                <div className="relative">
                                    <Input
                                        id="invoice-due_date"
                                        type="date"
                                        value={invoiceFormData.due_date}
                                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, due_date: e.target.value })}
                                        onClick={(e) => {
                                            try {
                                                (e.target as HTMLInputElement).showPicker()
                                            } catch { }
                                        }}
                                        className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#3b82f6] appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 z-10 relative cursor-pointer"
                                        required
                                    />
                                    <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#373737] pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[#97a1b3] font-normal">Relacionar à Proposta (Opcional)</Label>
                            <Select
                                value={invoiceFormData.proposal_id}
                                onValueChange={(value) => {
                                    const selected = proposals.find(p => p.id === value)
                                    let amount = invoiceFormData.amount
                                    if (selected?.proposal_items) {
                                        const total = selected.proposal_items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)
                                        amount = total.toString()
                                    }
                                    setInvoiceFormData({ ...invoiceFormData, proposal_id: value, amount })
                                }}
                            >
                                <SelectTrigger className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus:ring-0 focus:border-[#3b82f6] [&>svg]:hidden">
                                    <SelectValue placeholder="Escolha uma proposta" className="placeholder:text-[#97a1b3]/26" />
                                    <ChevronDown className="absolute right-0 w-5 h-5 text-[#373737]" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-[#373737] text-white">
                                    <SelectItem value="none">Nenhuma proposta</SelectItem>
                                    {proposals.map((proposal) => (
                                        <SelectItem key={proposal.id} value={proposal.id}>
                                            {proposal.identifier}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-[53px] bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-bold rounded-full text-base mt-2"
                        >
                            {isSubmitting ? "Emitindo..." : "Emitir Fatura"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Receipt Modal */}
            <Dialog open={isCreateReceiptModalOpen} onOpenChange={setIsCreateReceiptModalOpen}>
                <DialogContent className="bg-[#15161B] border-none p-0 gap-0 rounded-[8px] max-w-[500px] overflow-hidden [&>button]:hidden">
                    <div className="h-[53px] bg-[#10b981] px-6 flex items-center justify-between">
                        <span className="text-white font-bold text-lg">Emitir novo recibo</span>
                        <div
                            onClick={() => setIsCreateReceiptModalOpen(false)}
                            className="w-[21px] h-[21px] rounded-full bg-[#15161B] cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    </div>

                    <form onSubmit={handleCreateReceipt} className="p-[30px] flex flex-col gap-[30px]">
                        <div className="space-y-4">
                            <Label htmlFor="receipt-identifier" className="text-[#97a1b3] font-normal">Referência</Label>
                            <Input
                                id="receipt-identifier"
                                value={receiptFormData.identifier}
                                onChange={(e) => setReceiptFormData({ ...receiptFormData, identifier: e.target.value })}
                                className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#10b981] placeholder:text-[#97a1b3]/26"
                                placeholder="REC-2026-0001"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-[30px]">
                            <div className="space-y-4">
                                <Label htmlFor="receipt-amount" className="text-[#97a1b3] font-normal">Valor Recebido ({currencyCode})</Label>
                                <Input
                                    id="receipt-amount"
                                    type="number"
                                    step="0.01"
                                    value={receiptFormData.amount}
                                    onChange={(e) => setReceiptFormData({ ...receiptFormData, amount: e.target.value })}
                                    className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#10b981] placeholder:text-[#97a1b3]/26"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="receipt-received_at" className="text-[#97a1b3] font-normal">Data do Recebimento</Label>
                                <div className="relative">
                                    <Input
                                        id="receipt-received_at"
                                        type="date"
                                        value={receiptFormData.received_at}
                                        onChange={(e) => setReceiptFormData({ ...receiptFormData, received_at: e.target.value })}
                                        onClick={(e) => {
                                            try {
                                                (e.target as HTMLInputElement).showPicker()
                                            } catch { }
                                        }}
                                        className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#10b981] appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 z-10 relative cursor-pointer"
                                        required
                                    />
                                    <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#373737] pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[#97a1b3] font-normal">Método de Pagamento</Label>
                            <Select
                                value={receiptFormData.payment_method}
                                onValueChange={(value: ReceiptType['payment_method']) => setReceiptFormData({ ...receiptFormData, payment_method: value })}
                            >
                                <SelectTrigger className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus:ring-0 focus:border-[#10b981] [&>svg]:hidden">
                                    <SelectValue placeholder="Selecione o método" />
                                    <ChevronDown className="absolute right-0 w-5 h-5 text-[#373737]" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-[#373737] text-white">
                                    <SelectItem value="transfer">Transferência Bancária</SelectItem>
                                    <SelectItem value="card">Cartão de Crédito/Débito</SelectItem>
                                    <SelectItem value="cash">Dinheiro</SelectItem>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[#97a1b3] font-normal">Relacionar à Cobrança (Opcional)</Label>
                            <Select
                                value={receiptFormData.billing_id}
                                onValueChange={(value) => {
                                    const selected = billings.find(b => b.id === value)
                                    let amount = receiptFormData.amount
                                    if (selected) {
                                        amount = selected.amount.toString()
                                    }
                                    setReceiptFormData({ ...receiptFormData, billing_id: value, amount })
                                }}
                            >
                                <SelectTrigger className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus:ring-0 focus:border-[#10b981] [&>svg]:hidden">
                                    <SelectValue placeholder="Escolha uma cobrança" className="placeholder:text-[#97a1b3]/26" />
                                    <ChevronDown className="absolute right-0 w-5 h-5 text-[#373737]" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-[#373737] text-white">
                                    <SelectItem value="none">Nenhuma cobrança</SelectItem>
                                    {billings.filter(b => b.status === 'pending' || b.status === 'overdue').map((billing) => (
                                        <SelectItem key={billing.id} value={billing.id}>
                                            {billing.identifier} - {formatPrice(billing.amount)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="receipt-notes" className="text-[#97a1b3] font-normal">Observações (Opcional)</Label>
                            <Input
                                id="receipt-notes"
                                value={receiptFormData.notes}
                                onChange={(e) => setReceiptFormData({ ...receiptFormData, notes: e.target.value })}
                                className="bg-transparent border-0 border-b border-[#373737] text-white rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#10b981] placeholder:text-[#97a1b3]/26"
                                placeholder="Notas adicionais..."
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-[53px] bg-[#10b981] hover:bg-[#10b981]/90 text-white font-bold rounded-full text-base mt-2"
                        >
                            {isSubmitting ? "Emitindo..." : "Emitir Recibo"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Document Builder Overlay */}
            {isDocumentBuilderOpen && (
                <DocumentBuilder
                    projectId={project.id}
                    type={documentBuilderConfig.type}
                    initialData={documentBuilderConfig.initialData}
                    onClose={() => setIsDocumentBuilderOpen(false)}
                    onSave={() => fetchData()}
                />
            )}
        </div>
    )
}
