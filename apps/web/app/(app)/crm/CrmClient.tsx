"use client"

import * as React from "react"
import { toast } from "sonner"
import {
    Briefcase, Building2, CalendarClock, Globe, KanbanSquare, Mail, MapPin, Pencil, Phone, Plus, Target, Trash2, TrendingUp, Trophy, UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { daysUntil, formatDate, formatMoney, initials } from "@/lib/format"
import {
    deleteCompany, deleteContact, deleteDeal, moveDeal, saveCompany, saveContact, saveDeal,
    type CrmCompany, type CrmContact, type CrmDeal, type CrmStage,
} from "@/app/actions/crm"
import {
    EmptyState, Field, IconButton, Modal, ModalPrimary, ModalSecondary, OutlineButton, DarkButton, PANEL, SelectInput, StatStrip, TABLE_HEAD, TABLE_ROW, TextInput, WorkspaceShell,
} from "@/components/workspace/ui"

type Data = { currency: string, stages: CrmStage[], companies: CrmCompany[], contacts: CrmContact[], deals: CrmDeal[] }
type View = 'pipeline' | 'clients' | 'contacts'

const CURRENCIES = ['EUR', 'USD', 'AOA', 'BRL', 'GBP']
const INDUSTRIES = ['Moda', 'Restauração', 'Hotelaria e turismo', 'Tecnologia', 'Startup', 'Saúde e bem-estar', 'Imobiliário', 'Educação', 'Cultura e eventos', 'Retalho', 'Serviços profissionais', 'Associação / ONG']
const isWon = (s?: CrmStage) => !!s && /ganh|won/i.test(s.name)
const isLost = (s?: CrmStage) => !!s && /perdid|lost/i.test(s.name)
const fullName = (c: CrmContact) => [c.first_name, c.last_name].filter(Boolean).join(' ')

export function CrmClient({ initial }: { initial: Data }) {
    const [data, setData] = React.useState(initial)
    const [view, setView] = React.useState<View>('pipeline')
    const [query, setQuery] = React.useState('')
    const [dealModal, setDealModal] = React.useState<{ deal?: CrmDeal, stageId?: string, companyId?: string } | null>(null)
    const [companyModal, setCompanyModal] = React.useState<{ company?: CrmCompany } | null>(null)
    const [contactModal, setContactModal] = React.useState<{ contact?: CrmContact, companyId?: string } | null>(null)

    const { stages, companies, contacts, deals, currency } = data
    const stageById = React.useMemo(() => new Map(stages.map(s => [s.id, s])), [stages])
    const companyById = React.useMemo(() => new Map(companies.map(c => [c.id, c])), [companies])

    const inCurrency = (d: CrmDeal) => (d.currency || currency) === currency ? Number(d.value) || 0 : 0
    const isOpen = (d: CrmDeal) => { const s = stageById.get(d.stage_id || ''); return !isWon(s) && !isLost(s) }
    const open = deals.filter(isOpen)
    const won = deals.filter(d => isWon(stageById.get(d.stage_id || '')))
    const lost = deals.filter(d => isLost(stageById.get(d.stage_id || '')))
    const conversion = won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) : null

    const q = query.trim().toLowerCase()
    const match = (...parts: (string | null | undefined)[]) => !q || parts.some(p => p?.toLowerCase().includes(q))

    const upsert = <K extends 'deals' | 'companies' | 'contacts'>(key: K, row: Data[K][number]) =>
        setData(d => ({ ...d, [key]: (d[key] as { id: string }[]).some(r => r.id === row.id) ? (d[key] as { id: string }[]).map(r => r.id === row.id ? row : r) : [row, ...(d[key] as { id: string }[])] }))

    const onMove = async (dealId: string, stageId: string) => {
        const before = deals.find(d => d.id === dealId)
        if (!before || before.stage_id === stageId) return
        upsert('deals', { ...before, stage_id: stageId })
        const res = await moveDeal(dealId, stageId)
        if (!res.success) { upsert('deals', before); toast.error(res.error) }
        else if (isWon(stageById.get(stageId))) toast.success(`«${before.title}» ganho`)
    }
    const onDeleteDeal = async (deal: CrmDeal) => {
        if (!confirm(`Eliminar o negócio «${deal.title}»?`)) return
        const res = await deleteDeal(deal.id)
        if (res.success) { setData(d => ({ ...d, deals: d.deals.filter(x => x.id !== deal.id) })); toast.success('Negócio eliminado') } else toast.error(res.error)
    }
    const onDeleteCompany = async (c: CrmCompany) => {
        if (!confirm(`Eliminar o cliente «${c.name}»? Os contactos e os negócios ficam, sem cliente associado.`)) return
        const res = await deleteCompany(c.id)
        if (res.success) {
            setData(d => ({ ...d, companies: d.companies.filter(x => x.id !== c.id), contacts: d.contacts.map(x => x.company_id === c.id ? { ...x, company_id: null } : x), deals: d.deals.map(x => x.company_id === c.id ? { ...x, company_id: null } : x) }))
            toast.success('Cliente eliminado')
        } else toast.error(res.error)
    }
    const onDeleteContact = async (c: CrmContact) => {
        if (!confirm(`Eliminar o contacto «${fullName(c)}»?`)) return
        const res = await deleteContact(c.id)
        if (res.success) { setData(d => ({ ...d, contacts: d.contacts.filter(x => x.id !== c.id), deals: d.deals.map(x => x.contact_id === c.id ? { ...x, contact_id: null } : x) })); toast.success('Contacto eliminado') } else toast.error(res.error)
    }

    const action = view === 'clients' ? { label: 'Novo cliente', onClick: () => setCompanyModal({}) }
        : view === 'contacts' ? { label: 'Novo contacto', onClick: () => setContactModal({}) }
        : { label: 'Novo negócio', onClick: () => setDealModal({}) }

    return (
        <WorkspaceShell
            section="CRM"
            view={view}
            onView={setView}
            views={[
                { id: 'pipeline', label: 'Funil de vendas', icon: KanbanSquare, count: deals.length },
                { id: 'clients', label: 'Clientes', icon: Building2, count: companies.length },
                { id: 'contacts', label: 'Contactos', icon: UserRound, count: contacts.length },
            ]}
            list={companies.map(c => ({ id: c.id, label: c.name, onClick: () => { setView('clients'); setQuery(c.name) } }))}
            listAddLabel="Add client"
            onListAdd={() => setCompanyModal({})}
            search={query}
            onSearch={setQuery}
            action={action}
        >
            <StatStrip stats={[
                { label: 'Em negociação', value: formatMoney(open.reduce((s, d) => s + inCurrency(d), 0), currency, { compact: true }), unit: `${open.length} negócios`, icon: TrendingUp, tone: 'indigo', onClick: () => setView('pipeline') },
                { label: 'Ganhos', value: formatMoney(won.reduce((s, d) => s + inCurrency(d), 0), currency, { compact: true }), unit: `${won.length} projetos`, icon: Trophy, tone: 'green', onClick: () => setView('pipeline') },
                { label: 'Taxa de conversão', value: conversion === null ? '—' : `${conversion}%`, unit: `${won.length + lost.length} decididos`, icon: Target, tone: 'amber' },
                { label: 'Clientes', value: companies.length, unit: `${contacts.length} contactos`, icon: Building2, tone: 'rose', onClick: () => setView('clients') },
            ]} />

            {view === 'pipeline' && (
                deals.length === 0 && !q ? (
                    <EmptyState
                        icon={Briefcase}
                        title="Ainda não há negócios no funil"
                        text="Regista cada pedido de orçamento — uma identidade visual, um rebranding, um brandbook — e acompanha-o até ser aprovado."
                        action={<DarkButton onClick={() => setDealModal({})}><Plus className="w-3.5 h-3.5" /> Novo negócio</DarkButton>}
                    />
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {stages.map(stage => <StageColumn key={stage.id} stage={stage} deals={deals.filter(d => d.stage_id === stage.id && match(d.title, companyById.get(d.company_id || '')?.name))} companyById={companyById} currency={currency} onMove={onMove} onOpen={(deal) => setDealModal({ deal })} onAdd={() => setDealModal({ stageId: stage.id })} onDelete={onDeleteDeal} />)}
                    </div>
                )
            )}

            {view === 'clients' && (
                companies.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="Ainda não tens clientes"
                        text="Junta aqui as marcas com quem trabalhas. Cada cliente agrupa os seus contactos e os negócios em curso."
                        action={<DarkButton onClick={() => setCompanyModal({})}><Plus className="w-3.5 h-3.5" /> Novo cliente</DarkButton>}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {companies.filter(c => match(c.name, c.industry, c.location)).map(c => {
                            const cOpen = deals.filter(d => d.company_id === c.id && isOpen(d))
                            const cContacts = contacts.filter(x => x.company_id === c.id)
                            return (
                                <div key={c.id} className={cn(PANEL, "group p-6 flex flex-col")}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-[#ff0054]/20 flex items-center justify-center text-[#ff0054] text-xs font-bold shrink-0">{initials(c.name)}</div>
                                            <div className="min-w-0">
                                                <h3 className="text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100 truncate">{c.name}</h3>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{c.industry || 'Sem setor'}</p>
                                            </div>
                                        </div>
                                        <div className="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                            <IconButton title="Editar" onClick={() => setCompanyModal({ company: c })}><Pencil className="w-3.5 h-3.5" /></IconButton>
                                            <IconButton title="Eliminar" danger onClick={() => onDeleteCompany(c)}><Trash2 className="w-3.5 h-3.5" /></IconButton>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                        {c.location && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> {c.location}</p>}
                                        {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-white truncate"><Globe className="w-3.5 h-3.5 text-zinc-400" /> {c.website.replace(/^https?:\/\//, '')}</a>}
                                    </div>
                                    <div className="mt-5 pt-5 border-t border-zinc-200/80 dark:border-white/[0.06] grid grid-cols-3 gap-2">
                                        <div><p className="text-lg font-semibold text-zinc-900 dark:text-white">{cContacts.length}</p><p className="text-[11px] text-zinc-500">contactos</p></div>
                                        <div><p className="text-lg font-semibold text-zinc-900 dark:text-white">{cOpen.length}</p><p className="text-[11px] text-zinc-500">em curso</p></div>
                                        <div className="min-w-0"><p className="text-lg font-semibold text-zinc-900 dark:text-white truncate">{formatMoney(cOpen.reduce((s, d) => s + inCurrency(d), 0), currency, { compact: true })}</p><p className="text-[11px] text-zinc-500">em aberto</p></div>
                                    </div>
                                    <div className="mt-5 flex gap-2">
                                        <OutlineButton className="flex-1 justify-center" onClick={() => setDealModal({ companyId: c.id })}><Plus className="w-3.5 h-3.5" /> Negócio</OutlineButton>
                                        <OutlineButton className="flex-1 justify-center" onClick={() => setContactModal({ companyId: c.id })}><Plus className="w-3.5 h-3.5" /> Contacto</OutlineButton>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}

            {view === 'contacts' && (
                contacts.length === 0 ? (
                    <EmptyState
                        icon={UserRound}
                        title="Ainda não tens contactos"
                        text="Guarda as pessoas com quem falas em cada cliente: diretores de marketing, fundadores, gestores de produto."
                        action={<DarkButton onClick={() => setContactModal({})}><Plus className="w-3.5 h-3.5" /> Novo contacto</DarkButton>}
                    />
                ) : (
                    <div className={cn(PANEL, "overflow-hidden")}>
                        <div className={cn(TABLE_HEAD, "hidden md:grid grid-cols-[1.4fr_1fr_1.3fr_1fr_64px] gap-4")}>
                            <span>Nome</span><span>Cliente</span><span>Email</span><span>Telefone</span><span />
                        </div>
                        {contacts.filter(c => match(fullName(c), c.email, c.position, companyById.get(c.company_id || '')?.name)).map(c => (
                            <div key={c.id} className={cn(TABLE_ROW, "group grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1.3fr_1fr_64px] gap-2 md:gap-4 items-center")}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[11px] font-bold text-zinc-800 dark:text-white shrink-0">{initials(fullName(c))}</div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{fullName(c)}</p>
                                        <p className="text-[11px] text-zinc-500 truncate">{c.position || '—'}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{companyById.get(c.company_id || '')?.name || '—'}</span>
                                {c.email ? <a href={`mailto:${c.email}`} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white truncate flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> {c.email}</a> : <span className="text-xs text-zinc-400">—</span>}
                                {c.phone ? <a href={`tel:${c.phone}`} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white truncate flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> {c.phone}</a> : <span className="text-xs text-zinc-400">—</span>}
                                <div className="flex md:justify-end md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <IconButton title="Editar" onClick={() => setContactModal({ contact: c })}><Pencil className="w-3.5 h-3.5" /></IconButton>
                                    <IconButton title="Eliminar" danger onClick={() => onDeleteContact(c)}><Trash2 className="w-3.5 h-3.5" /></IconButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {dealModal && (
                <DealModal {...dealModal} stages={stages} companies={companies} contacts={contacts} currency={currency}
                    onClose={() => setDealModal(null)}
                    onSaved={(deal, company) => { if (company) upsert('companies', company); upsert('deals', deal); setDealModal(null) }} />
            )}
            {companyModal && <CompanyModal company={companyModal.company} onClose={() => setCompanyModal(null)} onSaved={(c) => { upsert('companies', c); setCompanyModal(null) }} />}
            {contactModal && <ContactModal {...contactModal} companies={companies} onClose={() => setContactModal(null)} onSaved={(c) => { upsert('contacts', c); setContactModal(null) }} />}
        </WorkspaceShell>
    )
}

// ---------------------------------------------------------------------------------------------
// Pipeline column (drag a card to another stage)
// ---------------------------------------------------------------------------------------------

function StageColumn({ stage, deals, companyById, currency, onMove, onOpen, onAdd, onDelete }: {
    stage: CrmStage, deals: CrmDeal[], companyById: Map<string, CrmCompany>, currency: string
    onMove: (dealId: string, stageId: string) => void, onOpen: (d: CrmDeal) => void, onAdd: () => void, onDelete: (d: CrmDeal) => void
}) {
    const [over, setOver] = React.useState(false)
    const total = deals.reduce((s, d) => s + ((d.currency || currency) === currency ? Number(d.value) || 0 : 0), 0)
    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setOver(true) }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData('text/deal'); if (id) onMove(id, stage.id) }}
            className={cn("w-[290px] shrink-0 rounded-2xl p-3 border transition-colors flex flex-col", over ? "border-[#ff0054]/40 bg-[#ff0054]/[0.03]" : "border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0c0e]")}
        >
            <div className="flex items-center justify-between px-1.5 pt-1 pb-3 border-b border-zinc-200/80 dark:border-white/[0.06] mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color || '#94A3B8' }} />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{stage.name}</span>
                    <span className="text-[11px] text-zinc-400 tabular-nums">{deals.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[11px] text-zinc-500 tabular-nums">{formatMoney(total, currency, { compact: true })}</span>
                    <IconButton title={`Novo negócio em «${stage.name}»`} onClick={onAdd}><Plus className="w-3.5 h-3.5" /></IconButton>
                </div>
            </div>
            <div className="space-y-2 min-h-[120px] flex-1">
                {deals.map(deal => {
                    const due = daysUntil(deal.expected_close_date)
                    const late = due !== null && due < 0 && !isWon(stage) && !isLost(stage)
                    return (
                        <div
                            key={deal.id}
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData('text/deal', deal.id); e.dataTransfer.effectAllowed = 'move' }}
                            onClick={() => onOpen(deal)}
                            className="group bg-zinc-50 dark:bg-[#141416] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-zinc-300 dark:hover:border-white/20 transition-all"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{deal.title}</p>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity -mr-1.5 -mt-1.5"><IconButton title="Eliminar" danger onClick={() => onDelete(deal)}><Trash2 className="w-3 h-3" /></IconButton></span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 truncate">{companyById.get(deal.company_id || '')?.name || 'Sem cliente'}</p>
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white tabular-nums">{deal.value != null ? formatMoney(deal.value, deal.currency || currency) : '—'}</span>
                                {deal.expected_close_date && (
                                    <span className={cn("flex items-center gap-1 text-[11px]", late ? "text-rose-500 font-medium" : "text-zinc-500")}>
                                        <CalendarClock className="w-3 h-3" /> {formatDate(deal.expected_close_date, { day: '2-digit', month: 'short' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
                {deals.length === 0 && <div className="h-[110px] rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-[11px] text-zinc-400 text-center px-4">Arrasta um negócio para aqui</div>}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------------------------

function DealModal({ deal, stageId, companyId, stages, companies, contacts, currency, onClose, onSaved }: {
    deal?: CrmDeal, stageId?: string, companyId?: string
    stages: CrmStage[], companies: CrmCompany[], contacts: CrmContact[], currency: string
    onClose: () => void, onSaved: (deal: CrmDeal, newCompany?: CrmCompany) => void
}) {
    const [title, setTitle] = React.useState(deal?.title || '')
    const [value, setValue] = React.useState(deal?.value != null ? String(deal.value) : '')
    const [cur, setCur] = React.useState(deal?.currency || currency)
    const [stage, setStage] = React.useState(deal?.stage_id || stageId || stages[0]?.id || '')
    const [company, setCompany] = React.useState(deal?.company_id || companyId || '')
    const [newCompany, setNewCompany] = React.useState('')
    const [contact, setContact] = React.useState(deal?.contact_id || '')
    const [closeDate, setCloseDate] = React.useState(deal?.expected_close_date || '')
    const [saving, setSaving] = React.useState(false)
    const companyContacts = contacts.filter(c => !company || company === '__new' || c.company_id === company)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        let created: CrmCompany | undefined
        let companyIdToUse: string | null = company && company !== '__new' ? company : null
        if (company === '__new' && newCompany.trim()) {
            const res = await saveCompany({ name: newCompany })
            if (!res.success) { toast.error(res.error); setSaving(false); return }
            created = res.data
            companyIdToUse = res.data!.id
        }
        const res = await saveDeal({ id: deal?.id, title, value, currency: cur, stage_id: stage, company_id: companyIdToUse, contact_id: contact || null, expected_close_date: closeDate || null })
        setSaving(false)
        if (!res.success) { toast.error(res.error); return }
        toast.success(deal ? 'Negócio atualizado' : 'Negócio criado')
        onSaved(res.data!, created)
    }

    return (
        <Modal open onClose={onClose} title={deal ? 'Editar negócio' : 'Novo negócio'} footer={<>
            <ModalSecondary type="button" onClick={onClose}>Cancelar</ModalSecondary>
            <ModalPrimary type="submit" form="deal-form" loading={saving}>{deal ? 'Guardar' : 'Criar negócio'}</ModalPrimary>
        </>}>
            <form id="deal-form" onSubmit={submit} className="space-y-5">
                <Field label="Projeto"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Identidade visual — Café Lume" required autoFocus maxLength={140} /></Field>
                <div className="grid grid-cols-[1fr_120px] gap-3">
                    <Field label="Valor"><TextInput value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder="2 500" /></Field>
                    <Field label="Moeda"><SelectInput value={cur} onChange={(e) => setCur(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</SelectInput></Field>
                </div>
                <Field label="Cliente">
                    <SelectInput value={company} onChange={(e) => { setCompany(e.target.value); setContact('') }}>
                        <option value="">Sem cliente</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="__new">+ Novo cliente…</option>
                    </SelectInput>
                </Field>
                {company === '__new' && <Field label="Nome do novo cliente"><TextInput value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Ex.: Café Lume" autoFocus /></Field>}
                <Field label="Contacto">
                    <SelectInput value={contact} onChange={(e) => setContact(e.target.value)} disabled={companyContacts.length === 0}>
                        <option value="">{companyContacts.length ? 'Sem contacto' : 'Este cliente ainda não tem contactos'}</option>
                        {companyContacts.map(c => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
                    </SelectInput>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Etapa"><SelectInput value={stage} onChange={(e) => setStage(e.target.value)}>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</SelectInput></Field>
                    <Field label="Decisão prevista"><TextInput type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} /></Field>
                </div>
            </form>
        </Modal>
    )
}

function CompanyModal({ company, onClose, onSaved }: { company?: CrmCompany, onClose: () => void, onSaved: (c: CrmCompany) => void }) {
    const [name, setName] = React.useState(company?.name || '')
    const [industry, setIndustry] = React.useState(company?.industry || '')
    const [website, setWebsite] = React.useState(company?.website || '')
    const [location, setLocation] = React.useState(company?.location || '')
    const [saving, setSaving] = React.useState(false)
    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await saveCompany({ id: company?.id, name, industry, website, location })
        setSaving(false)
        if (!res.success) { toast.error(res.error); return }
        toast.success(company ? 'Cliente atualizado' : 'Cliente adicionado')
        onSaved(res.data!)
    }
    return (
        <Modal open onClose={onClose} title={company ? 'Editar cliente' : 'Novo cliente'} footer={<>
            <ModalSecondary type="button" onClick={onClose}>Cancelar</ModalSecondary>
            <ModalPrimary type="submit" form="company-form" loading={saving}>{company ? 'Guardar' : 'Adicionar cliente'}</ModalPrimary>
        </>}>
            <form id="company-form" onSubmit={submit} className="space-y-5">
                <Field label="Nome da marca ou empresa"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Café Lume" required autoFocus maxLength={120} /></Field>
                <Field label="Setor">
                    <TextInput value={industry} onChange={(e) => setIndustry(e.target.value)} list="crm-industries" placeholder="Ex.: Restauração" maxLength={80} />
                    <datalist id="crm-industries">{INDUSTRIES.map(i => <option key={i} value={i} />)}</datalist>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Website"><TextInput value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="cafelume.pt" /></Field>
                    <Field label="Localização"><TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lisboa" /></Field>
                </div>
            </form>
        </Modal>
    )
}

function ContactModal({ contact, companyId, companies, onClose, onSaved }: { contact?: CrmContact, companyId?: string, companies: CrmCompany[], onClose: () => void, onSaved: (c: CrmContact) => void }) {
    const [first, setFirst] = React.useState(contact?.first_name || '')
    const [last, setLast] = React.useState(contact?.last_name || '')
    const [email, setEmail] = React.useState(contact?.email || '')
    const [phone, setPhone] = React.useState(contact?.phone || '')
    const [position, setPosition] = React.useState(contact?.position || '')
    const [company, setCompany] = React.useState(contact?.company_id || companyId || '')
    const [saving, setSaving] = React.useState(false)
    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await saveContact({ id: contact?.id, first_name: first, last_name: last, email, phone, position, company_id: company || null })
        setSaving(false)
        if (!res.success) { toast.error(res.error); return }
        toast.success(contact ? 'Contacto atualizado' : 'Contacto adicionado')
        onSaved(res.data!)
    }
    return (
        <Modal open onClose={onClose} title={contact ? 'Editar contacto' : 'Novo contacto'} footer={<>
            <ModalSecondary type="button" onClick={onClose}>Cancelar</ModalSecondary>
            <ModalPrimary type="submit" form="contact-form" loading={saving}>{contact ? 'Guardar' : 'Adicionar contacto'}</ModalPrimary>
        </>}>
            <form id="contact-form" onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Nome"><TextInput value={first} onChange={(e) => setFirst(e.target.value)} required autoFocus maxLength={80} /></Field>
                    <Field label="Apelido"><TextInput value={last} onChange={(e) => setLast(e.target.value)} maxLength={80} /></Field>
                </div>
                <Field label="Cargo"><TextInput value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex.: Diretora de marketing" maxLength={80} /></Field>
                <Field label="Cliente">
                    <SelectInput value={company} onChange={(e) => setCompany(e.target.value)}>
                        <option value="">Sem cliente</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </SelectInput>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@cliente.pt" /></Field>
                    <Field label="Telefone"><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 912 345 678" /></Field>
                </div>
            </form>
        </Modal>
    )
}
