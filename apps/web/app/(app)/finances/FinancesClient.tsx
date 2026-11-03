"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import { AlertCircle, ArrowUpRight, BarChart3, CircleDollarSign, FileText, Hourglass, LayoutDashboard, Plus, Receipt, Repeat, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { daysUntil, formatDate, formatMoney } from "@/lib/format"
import { BILLING_SUFFIX, monthlyCost } from "@/lib/inventory"
import type { FinanceDoc, FinanceDocKind, FinanceStatus } from "@/app/actions/finances"
import type { InventoryBilling } from "@/app/actions/inventory"
import {
    DarkButton, EmptyState, Field, Modal, ModalPrimary, ModalSecondary, PANEL, Panel, Pill, SelectInput, StatStrip, TABLE_HEAD, TABLE_ROW, WorkspaceShell, type Tone,
} from "@/components/workspace/ui"

type Data = {
    currency: string
    projects: { id: string, name: string }[]
    docs: FinanceDoc[]
    inventoryReady: boolean
    recurring: { id: string, name: string, category: string, cost: number | null, currency: string, billing: InventoryBilling }[]
}
type View = 'overview' | FinanceDocKind

const KIND: Record<FinanceDocKind, { label: string, plural: string, icon: React.ComponentType<{ className?: string }> }> = {
    invoice: { label: 'Fatura', plural: 'Faturas', icon: FileText },
    billing: { label: 'Cobrança', plural: 'Cobranças', icon: CircleDollarSign },
    receipt: { label: 'Recibo', plural: 'Recibos', icon: Receipt },
}
const STATUS: Record<FinanceStatus, { label: string, tone: Tone }> = {
    draft: { label: 'Rascunho', tone: 'zinc' },
    sent: { label: 'Enviada', tone: 'indigo' },
    pending: { label: 'Pendente', tone: 'indigo' },
    overdue: { label: 'Em atraso', tone: 'rose' },
    paid: { label: 'Paga', tone: 'green' },
    cancelled: { label: 'Cancelada', tone: 'zinc' },
    issued: { label: 'Emitido', tone: 'green' },
}
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const projectHref = (id: string) => `/projects?project=${id}&tab=cobrancas`

export function FinancesClient({ data }: { data: Data }) {
    const router = useRouter()
    const { currency, docs } = data
    const [view, setView] = React.useState<View>('overview')
    const [query, setQuery] = React.useState('')
    const [issueOpen, setIssueOpen] = React.useState(false)

    const main = docs.filter(d => d.currency === currency)
    const otherCurrencies = docs.length - main.length
    const year = String(new Date().getFullYear())
    const isOutstanding = (d: FinanceDoc) => d.kind !== 'receipt' && ['sent', 'pending', 'overdue'].includes(d.status)
    // Money in: receipts, plus documents marked paid that have no receipt (so nothing is counted twice)
    const isMoneyIn = (d: FinanceDoc) => d.kind === 'receipt' || (d.status === 'paid' && !d.receipted)
    const receivedYear = main.filter(d => isMoneyIn(d) && d.issued_at?.startsWith(year)).reduce((s, d) => s + d.amount, 0)
    const outstanding = main.filter(isOutstanding)
    const overdue = outstanding.filter(d => d.status === 'overdue')
    const fixed = data.recurring.filter(r => r.currency === currency).reduce((s, r) => s + monthlyCost(r), 0)

    const months = React.useMemo(() => {
        const now = new Date()
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const inMain = docs.filter(x => x.currency === currency)
            const invoiced = inMain.filter(x => x.kind !== 'receipt' && !['draft', 'cancelled'].includes(x.status) && x.issued_at?.startsWith(key)).reduce((s, x) => s + x.amount, 0)
            const received = inMain.filter(x => (x.kind === 'receipt' || (x.status === 'paid' && !x.receipted)) && x.issued_at?.startsWith(key)).reduce((s, x) => s + x.amount, 0)
            return { key, label: MONTHS[d.getMonth()], invoiced, received }
        })
    }, [docs, currency])
    const peak = Math.max(1, ...months.flatMap(m => [m.invoiced, m.received]))

    const q = query.trim().toLowerCase()
    const listed = docs.filter(d => (view === 'overview' || d.kind === view) && (!q || [d.identifier, d.project_name, d.client].some(v => v?.toLowerCase().includes(q))))

    const table = (rows: FinanceDoc[]) => (
        <div className={cn(PANEL, "overflow-hidden")}>
            <div className={cn(TABLE_HEAD, "hidden lg:grid grid-cols-[1.4fr_1.2fr_0.9fr_0.9fr_1fr_0.9fr] gap-4")}>
                <span>Documento</span><span>Projeto · Cliente</span><span>Emissão</span><span>Vencimento</span><span className="text-right">Valor</span><span className="text-right">Estado</span>
            </div>
            {rows.map(d => {
                const K = KIND[d.kind]
                const S = STATUS[d.status] || STATUS.draft
                return (
                    <Link key={`${d.kind}-${d.id}`} href={projectHref(d.project_id)} className={cn(TABLE_ROW, "group grid grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_0.9fr_0.9fr_1fr_0.9fr] gap-2 lg:gap-4 items-center")}>
                        <div className="flex items-center gap-3 min-w-0 col-span-2 lg:col-span-1">
                            <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-[#ff0054]/20 flex items-center justify-center text-[#ff0054] shrink-0"><K.icon className="w-3.5 h-3.5" /></span>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#ff0054]">{d.identifier}</p>
                                <p className="text-[11px] text-zinc-500">{K.label}</p>
                            </div>
                        </div>
                        <div className="min-w-0 col-span-2 lg:col-span-1">
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{d.project_name}</p>
                            {d.client && <p className="text-[11px] text-zinc-500 truncate">{d.client}</p>}
                        </div>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">{formatDate(d.issued_at)}</span>
                        <span className={cn("text-xs", d.status === 'overdue' ? "text-rose-500 font-medium" : "text-zinc-600 dark:text-zinc-400")}>{d.kind === 'receipt' ? '—' : formatDate(d.due_date)}</span>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white tabular-nums lg:text-right">{formatMoney(d.amount, d.currency)}</span>
                        <span className="lg:text-right"><Pill tone={S.tone}>{S.label}</Pill></span>
                    </Link>
                )
            })}
        </div>
    )

    return (
        <WorkspaceShell
            section="Finanças"
            view={view}
            onView={setView}
            views={[
                { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
                { id: 'invoice', label: 'Faturas', icon: FileText, count: docs.filter(d => d.kind === 'invoice').length },
                { id: 'billing', label: 'Cobranças', icon: CircleDollarSign, count: docs.filter(d => d.kind === 'billing').length },
                { id: 'receipt', label: 'Recibos', icon: Receipt, count: docs.filter(d => d.kind === 'receipt').length },
            ]}
            list={data.projects.map(p => ({ id: p.id, label: p.name, onClick: () => router.push(projectHref(p.id)) }))}
            listAddLabel="Emitir documento"
            onListAdd={() => setIssueOpen(true)}
            search={query}
            onSearch={setQuery}
            searchPlaceholder="Pesquisar documentos"
            action={{ label: 'Emitir documento', onClick: () => setIssueOpen(true) }}
        >
            <StatStrip stats={[
                { label: `Recebido em ${year}`, value: formatMoney(receivedYear, currency, { compact: true }), unit: currency, icon: Wallet, tone: 'green', onClick: () => setView('receipt') },
                { label: 'Por receber', value: formatMoney(outstanding.reduce((s, d) => s + d.amount, 0), currency, { compact: true }), unit: `${outstanding.length} documentos`, icon: Hourglass, tone: 'indigo' },
                { label: 'Em atraso', value: formatMoney(overdue.reduce((s, d) => s + d.amount, 0), currency, { compact: true }), unit: `${overdue.length} fora do prazo`, icon: AlertCircle, tone: 'rose' },
                { label: 'Custos fixos', value: formatMoney(fixed, currency, { compact: true }), unit: 'por mês', icon: Repeat, tone: 'amber' },
            ]} />

            {view === 'overview' ? (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                        <Panel
                            className="xl:col-span-8"
                            title="Últimos 6 meses"
                            icon={BarChart3}
                            right={<div className="flex items-center gap-4 text-[11px] text-zinc-500">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-700" /> Faturado</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#ff0054]" /> Recebido</span>
                            </div>}
                        >
                            <div className="relative h-[260px] grid grid-cols-6 gap-3 items-end pt-6">
                                <div className="absolute inset-x-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none opacity-60">
                                    {[0, 1, 2, 3].map(i => <div key={i} className="h-px w-full bg-zinc-200/80 dark:bg-white/[0.05]" />)}
                                </div>
                                {months.map(m => (
                                    <div key={m.key} className="group relative h-full flex flex-col justify-end items-center gap-2">
                                        <div className="relative w-full flex-1 flex items-end justify-center gap-1.5">
                                            <span className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#141416] border border-zinc-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] whitespace-nowrap z-10 shadow-lg">
                                                <span className="block text-zinc-500">Faturado <b className="text-zinc-900 dark:text-white font-semibold">{formatMoney(m.invoiced, currency)}</b></span>
                                                <span className="block text-zinc-500">Recebido <b className="text-zinc-900 dark:text-white font-semibold">{formatMoney(m.received, currency)}</b></span>
                                            </span>
                                            <span className="w-[34%] max-w-[22px] rounded-t-md bg-zinc-300 dark:bg-zinc-700 transition-all duration-700" style={{ height: `${Math.max(2, m.invoiced / peak * 100)}%` }} />
                                            <span className="w-[34%] max-w-[22px] rounded-t-md bg-[#ff0054] transition-all duration-700" style={{ height: `${Math.max(2, m.received / peak * 100)}%` }} />
                                        </div>
                                        <span className="text-[11px] font-medium text-zinc-500 capitalize">{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </Panel>

                        <div className="xl:col-span-4 flex flex-col gap-6">
                            <Panel title="A cobrar" icon={Hourglass} className="flex-1">
                                {outstanding.length === 0 ? (
                                    <p className="text-xs text-zinc-500">Não há documentos por receber.</p>
                                ) : (
                                    <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.04] -my-2">
                                        {[...outstanding].sort((a, b) => String(a.due_date || '9').localeCompare(String(b.due_date || '9'))).slice(0, 5).map(d => {
                                            const days = daysUntil(d.due_date)
                                            return (
                                                <Link key={`${d.kind}-${d.id}`} href={projectHref(d.project_id)} className="flex items-center justify-between gap-3 py-3 group">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-white">{d.client || d.project_name}</p>
                                                        <p className={cn("text-[11px] mt-0.5", days !== null && days < 0 ? "text-rose-500" : "text-zinc-500")}>
                                                            {days === null ? 'Sem prazo' : days < 0 ? `${-days} ${-days === 1 ? 'dia' : 'dias'} em atraso` : days === 0 ? 'Vence hoje' : `Vence em ${days} ${days === 1 ? 'dia' : 'dias'}`}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-zinc-900 dark:text-white tabular-nums shrink-0">{formatMoney(d.amount, d.currency)}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </Panel>
                            {data.inventoryReady && (
                                <Panel title="Custos fixos" icon={Repeat} right={<Link href="/inventory" className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">Inventário <ArrowUpRight className="w-3 h-3" /></Link>}>
                                    {data.recurring.length === 0 ? (
                                        <p className="text-xs text-zinc-500 leading-relaxed">Regista no inventário as subscrições do estúdio (Adobe, Figma, bancos de imagens) para veres aqui quanto custam por mês.</p>
                                    ) : (
                                        <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.04] -my-2">
                                            {[...data.recurring].sort((a, b) => monthlyCost(b) - monthlyCost(a)).slice(0, 5).map(r => (
                                                <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                                                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{r.name}</span>
                                                    <span className="text-xs text-zinc-500 tabular-nums shrink-0">{formatMoney(r.cost, r.currency)}{BILLING_SUFFIX[r.billing]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Panel>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Documentos recentes</h2>
                    </div>
                    {docs.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="Ainda não há documentos"
                            text="As faturas, as cobranças e os recibos são emitidos dentro de cada projeto. Assim que emitires o primeiro, aparece aqui com o estado do pagamento."
                            action={<DarkButton onClick={() => setIssueOpen(true)}><Plus className="w-3.5 h-3.5" /> Emitir documento</DarkButton>}
                        />
                    ) : table(listed.slice(0, 8))}
                </>
            ) : listed.length === 0 ? (
                <EmptyState icon={KIND[view].icon} title={q ? 'Nada encontrado' : `Ainda não há ${KIND[view].plural.toLowerCase()}`} text="Os documentos são emitidos no separador Cobranças de cada projeto." action={<DarkButton onClick={() => setIssueOpen(true)}><Plus className="w-3.5 h-3.5" /> Emitir documento</DarkButton>} />
            ) : table(listed)}

            {otherCurrencies > 0 && <p className="text-[11px] text-zinc-500">Os totais somam só os valores em {currency}. {otherCurrencies} {otherCurrencies === 1 ? 'documento está' : 'documentos estão'} noutra moeda e {otherCurrencies === 1 ? 'aparece' : 'aparecem'} só na lista.</p>}

            {issueOpen && <IssueModal projects={data.projects} onClose={() => setIssueOpen(false)} onGo={(id) => { setIssueOpen(false); router.push(projectHref(id)) }} />}
        </WorkspaceShell>
    )
}

/** Documents live in projects: pick the project and go to its «Cobranças» tab */
function IssueModal({ projects, onClose, onGo }: { projects: { id: string, name: string }[], onClose: () => void, onGo: (id: string) => void }) {
    const [project, setProject] = React.useState(projects[0]?.id || '')
    return (
        <Modal open onClose={onClose} title="Emitir documento" footer={projects.length ? <>
            <ModalSecondary type="button" onClick={onClose}>Cancelar</ModalSecondary>
            <ModalPrimary type="button" onClick={() => project && onGo(project)} disabled={!project}>Abrir cobranças do projeto</ModalPrimary>
        </> : undefined}>
            {projects.length ? (
                <>
                    <p className="text-[14px] text-zinc-600 dark:text-[#97A1B3] leading-relaxed">As faturas, as cobranças e os recibos ficam ligados ao projeto a que dizem respeito. Escolhe o projeto para os emitires lá.</p>
                    <Field label="Projeto">
                        <SelectInput value={project} onChange={(e) => setProject(e.target.value)}>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </SelectInput>
                    </Field>
                </>
            ) : (
                <div className="text-center py-4">
                    <p className="text-[14px] text-zinc-600 dark:text-[#97A1B3] leading-relaxed">Para emitir faturas precisas de um projeto. Cria o primeiro projeto e volta aqui.</p>
                    <Link href="/projects" className="mt-5 inline-flex items-center justify-center gap-2 h-10 px-6 rounded-[6px] bg-[#ff0054] text-white text-[13px] font-semibold">Ir para Projetos</Link>
                </div>
            )}
        </Modal>
    )
}
