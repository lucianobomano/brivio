"use client"

import * as React from "react"
import { toast } from "sonner"
import {
    AlertTriangle, CalendarClock, Camera, Globe, Image as ImageIcon, LayoutGrid, Monitor, Package, Pencil, Plus, Shapes, Trash2, Type, Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { daysUntil, formatDate, formatMoney, initials } from "@/lib/format"
import { BILLING_LABEL, BILLING_SUFFIX, CATEGORY_LABEL, CATEGORY_SINGULAR, LICENSE_SUGGESTIONS, monthlyCost } from "@/lib/inventory"
import { deleteInventoryItem, saveInventoryItem, type InventoryBilling, type InventoryCategory, type InventoryItem } from "@/app/actions/inventory"
import {
    DarkButton, EmptyState, Field, IconButton, Modal, ModalPrimary, ModalSecondary, OutlineButton, PANEL, Panel, Pill, SelectInput, StatStrip, TABLE_HEAD, TABLE_ROW, TextArea, TextInput, WorkspaceShell, type Tone,
} from "@/components/workspace/ui"

type Data = { ready: boolean, currency: string, items: InventoryItem[], people: { id: string, name: string }[], brands: { id: string, name: string }[] }
type View = 'all' | InventoryCategory

const CATEGORY_ICON: Record<InventoryCategory, React.ComponentType<{ className?: string }>> = {
    font: Type, software: Monitor, stock: ImageIcon, equipment: Camera, domain: Globe, other: Shapes,
}
const CATEGORIES = Object.keys(CATEGORY_LABEL) as InventoryCategory[]
const CURRENCIES = ['EUR', 'USD', 'AOA', 'BRL', 'GBP']

function renewal(item: InventoryItem): { tone: Tone, label: string, days: number } | null {
    const d = daysUntil(item.renews_at)
    if (d === null) return null
    if (d < 0) return { tone: 'rose', label: item.billing === 'one_time' ? 'Terminou' : 'Expirou', days: d }
    if (d === 0) return { tone: 'amber', label: 'Hoje', days: d }
    if (d <= 30) return { tone: 'amber', label: `Em ${d} ${d === 1 ? 'dia' : 'dias'}`, days: d }
    return { tone: 'zinc', label: formatDate(item.renews_at), days: d }
}

export function InventoryClient({ initial }: { initial: Data }) {
    const [items, setItems] = React.useState(initial.items)
    const [view, setView] = React.useState<View>('all')
    const [query, setQuery] = React.useState('')
    const [modal, setModal] = React.useState<{ item?: InventoryItem, category?: InventoryCategory } | null>(null)
    const { currency, people, brands } = initial
    const personName = (id: string | null) => people.find(p => p.id === id)?.name
    const brandName = (id: string | null) => brands.find(b => b.id === id)?.name

    const monthly = items.filter(i => i.currency === currency).reduce((s, i) => s + monthlyCost(i), 0)
    const soon = items.filter(i => { const r = renewal(i); return r && r.days <= 30 }).sort((a, b) => (daysUntil(a.renews_at) ?? 0) - (daysUntil(b.renews_at) ?? 0))
    const fonts = items.filter(i => i.category === 'font')

    const q = query.trim().toLowerCase()
    const visible = items.filter(i => (view === 'all' || i.category === view) && (!q || [i.name, i.vendor, i.license, personName(i.assigned_to), brandName(i.brand_id)].some(v => v?.toLowerCase().includes(q))))

    const add = (category?: InventoryCategory) => initial.ready ? setModal({ category: category ?? (view === 'all' ? undefined : view) }) : toast.error('O inventário ainda não está ativo nesta conta.')
    const onDelete = async (item: InventoryItem) => {
        if (!confirm(`Eliminar «${item.name}» do inventário?`)) return
        const res = await deleteInventoryItem(item.id)
        if (res.success) { setItems(list => list.filter(i => i.id !== item.id)); toast.success('Item eliminado') } else toast.error(res.error)
    }

    return (
        <WorkspaceShell
            section="Inventário"
            view={view}
            onView={setView}
            views={[
                { id: 'all', label: 'Tudo', icon: LayoutGrid, count: items.length },
                ...CATEGORIES.map(c => ({ id: c, label: CATEGORY_LABEL[c], icon: CATEGORY_ICON[c], count: items.filter(i => i.category === c).length })),
            ]}
            list={soon.map(i => ({ id: i.id, label: i.name, onClick: () => setModal({ item: i }) }))}
            listAddLabel="Novo item"
            onListAdd={() => add()}
            search={query}
            onSearch={setQuery}
            action={{ label: 'Novo item', onClick: () => add() }}
        >
            {!initial.ready ? (
                <EmptyState icon={Package} title="O inventário ainda não está ativo" text="Esta área precisa de ser ativada na base de dados da plataforma. Assim que estiver, podes registar aqui as licenças e o equipamento do estúdio." />
            ) : (
                <>
                    <StatStrip stats={[
                        { label: 'Itens', value: items.length, unit: `${new Set(items.map(i => i.category)).size} categorias`, icon: LayoutGrid, tone: 'rose', onClick: () => setView('all') },
                        { label: 'Custo mensal', value: formatMoney(monthly, currency), unit: `${formatMoney(monthly * 12, currency, { compact: true })}/ano`, icon: Wallet, tone: 'indigo' },
                        { label: 'A renovar', value: soon.length, unit: 'próximos 30 dias', icon: CalendarClock, tone: soon.length ? 'amber' : 'green' },
                        { label: 'Licenças de fontes', value: fonts.length, unit: `${fonts.filter(f => f.brand_id).length} de marcas`, icon: Type, tone: 'green', onClick: () => setView('font') },
                    ]} />

                    {soon.length > 0 && (
                        <Panel title="Precisam de atenção" icon={AlertTriangle}>
                            <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.04] -my-2">
                                {soon.slice(0, 5).map(i => {
                                    const r = renewal(i)!
                                    const Icon = CATEGORY_ICON[i.category]
                                    return (
                                        <button key={i.id} type="button" onClick={() => setModal({ item: i })} className="w-full flex items-center gap-3 py-3 text-left group">
                                            <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1 group-hover:text-zinc-950 dark:group-hover:text-white">{i.name}</span>
                                            {i.cost != null && <span className="text-xs text-zinc-500 tabular-nums">{formatMoney(i.cost, i.currency)}{BILLING_SUFFIX[i.billing]}</span>}
                                            <Pill tone={r.tone}>{r.label}</Pill>
                                        </button>
                                    )
                                })}
                            </div>
                        </Panel>
                    )}

                    {items.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="O inventário está vazio"
                            text="Começa pelas licenças de fontes e pelas subscrições de software (Adobe, Figma, bancos de imagens). Vês logo quanto custam por mês e quando renovam."
                            action={<div className="flex flex-wrap justify-center gap-2">
                                <OutlineButton onClick={() => add('font')}><Type className="w-3.5 h-3.5" /> Adicionar fonte</OutlineButton>
                                <DarkButton onClick={() => add('software')}><Plus className="w-3.5 h-3.5" /> Adicionar software</DarkButton>
                            </div>}
                        />
                    ) : visible.length === 0 ? (
                        <EmptyState icon={CATEGORY_ICON[view === 'all' ? 'other' : view]} title={q ? 'Nada encontrado' : `Ainda não há ${view === 'all' ? 'itens' : CATEGORY_LABEL[view].toLowerCase()}`} text={q ? 'Experimenta pesquisar outro nome, fornecedor ou licença.' : 'Adiciona o primeiro item desta categoria.'} action={!q ? <DarkButton onClick={() => add()}><Plus className="w-3.5 h-3.5" /> Novo item</DarkButton> : undefined} />
                    ) : (
                        <div className={cn(PANEL, "overflow-hidden")}>
                            <div className={cn(TABLE_HEAD, "hidden lg:grid grid-cols-[1.6fr_1fr_1fr_1fr_0.9fr_64px] gap-4")}>
                                <span>Item</span><span>Licença</span><span>Atribuído a</span><span>Custo</span><span>Renovação</span><span />
                            </div>
                            {visible.map(i => {
                                const Icon = CATEGORY_ICON[i.category]
                                const r = renewal(i)
                                const who = personName(i.assigned_to)
                                const brand = brandName(i.brand_id)
                                return (
                                    <div key={i.id} onClick={() => setModal({ item: i })} className={cn(TABLE_ROW, "group grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_1fr_0.9fr_64px] gap-2 lg:gap-4 items-center cursor-pointer")}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-[#ff0054]/20 flex items-center justify-center text-[#ff0054] shrink-0"><Icon className="w-3.5 h-3.5" /></span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{i.name}</p>
                                                <p className="text-[11px] text-zinc-500 truncate">{[CATEGORY_SINGULAR[i.category], i.vendor].filter(Boolean).join(' · ')}</p>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{i.license || '—'}</p>
                                            {i.seats != null && <p className="text-[11px] text-zinc-500">{i.seats} {i.seats === 1 ? 'lugar' : 'lugares'}</p>}
                                        </div>
                                        <div className="min-w-0">
                                            {who ? (
                                                <span className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 truncate">
                                                    <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-[9px] font-bold text-zinc-800 dark:text-white flex items-center justify-center shrink-0">{initials(who)}</span>
                                                    <span className="truncate">{who}</span>
                                                </span>
                                            ) : <span className="text-xs text-zinc-500">Estúdio</span>}
                                            {brand && <p className="text-[11px] text-zinc-500 truncate mt-0.5">Marca: {brand}</p>}
                                        </div>
                                        <div className="text-xs">
                                            {i.cost != null ? <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">{formatMoney(i.cost, i.currency)}<span className="text-zinc-500 font-normal">{BILLING_SUFFIX[i.billing]}</span></span> : <span className="text-zinc-400">—</span>}
                                            <p className="text-[11px] text-zinc-500">{BILLING_LABEL[i.billing]}</p>
                                        </div>
                                        <div>{r ? <Pill tone={r.tone}>{r.label}</Pill> : <span className="text-xs text-zinc-400">—</span>}</div>
                                        <div className="flex lg:justify-end lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <IconButton title="Editar" onClick={() => setModal({ item: i })}><Pencil className="w-3.5 h-3.5" /></IconButton>
                                            <IconButton title="Eliminar" danger onClick={() => onDelete(i)}><Trash2 className="w-3.5 h-3.5" /></IconButton>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {modal && (
                <ItemModal {...modal} currency={currency} people={people} brands={brands}
                    onClose={() => setModal(null)}
                    onSaved={(item) => { setItems(list => list.some(x => x.id === item.id) ? list.map(x => x.id === item.id ? item : x) : [...list, item].sort((a, b) => a.name.localeCompare(b.name))); setModal(null) }} />
            )}
        </WorkspaceShell>
    )
}

function ItemModal({ item, category: initialCategory, currency, people, brands, onClose, onSaved }: {
    item?: InventoryItem, category?: InventoryCategory, currency: string
    people: { id: string, name: string }[], brands: { id: string, name: string }[]
    onClose: () => void, onSaved: (i: InventoryItem) => void
}) {
    const [category, setCategory] = React.useState<InventoryCategory>(item?.category || initialCategory || 'software')
    const [name, setName] = React.useState(item?.name || '')
    const [vendor, setVendor] = React.useState(item?.vendor || '')
    const [license, setLicense] = React.useState(item?.license || '')
    const [seats, setSeats] = React.useState(item?.seats != null ? String(item.seats) : '')
    const [cost, setCost] = React.useState(item?.cost != null ? String(item.cost) : '')
    const [cur, setCur] = React.useState(item?.currency || currency)
    const [billing, setBilling] = React.useState<InventoryBilling>(item?.billing || (initialCategory === 'font' || initialCategory === 'equipment' ? 'one_time' : 'monthly'))
    const [purchasedAt, setPurchasedAt] = React.useState(item?.purchased_at || '')
    const [renewsAt, setRenewsAt] = React.useState(item?.renews_at || '')
    const [assignedTo, setAssignedTo] = React.useState(item?.assigned_to || '')
    const [brandId, setBrandId] = React.useState(item?.brand_id || '')
    const [notes, setNotes] = React.useState(item?.notes || '')
    const [saving, setSaving] = React.useState(false)

    const vendorLabel = category === 'font' ? 'Fundição' : category === 'equipment' ? 'Marca / modelo' : category === 'domain' ? 'Registador' : 'Fornecedor'
    const namePlaceholder = { font: 'Ex.: Neue Haas Grotesk', software: 'Ex.: Adobe Creative Cloud', stock: 'Ex.: Envato Elements', equipment: 'Ex.: Wacom Intuos Pro', domain: 'Ex.: estudio.pt', other: 'Ex.: Impressora de provas' }[category]
    const renewLabel = billing === 'one_time' ? (category === 'equipment' ? 'Fim da garantia' : 'Válida até') : 'Próxima renovação'

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await saveInventoryItem({
            id: item?.id, name, category, vendor, license,
            seats: seats === '' ? null : Number(seats),
            cost: cost === '' ? null : Number(cost.replace(',', '.')),
            currency: cur, billing, purchased_at: purchasedAt || null, renews_at: renewsAt || null,
            assigned_to: assignedTo || null, brand_id: brandId || null, notes,
        })
        setSaving(false)
        if (!res.success) { toast.error(res.error); return }
        toast.success(item ? 'Item atualizado' : 'Item adicionado ao inventário')
        onSaved(res.data!)
    }

    return (
        <Modal open onClose={onClose} width={640} title={item ? 'Editar item' : 'Novo item'} footer={<>
            <ModalSecondary type="button" onClick={onClose}>Cancelar</ModalSecondary>
            <ModalPrimary type="submit" form="inventory-form" loading={saving}>{item ? 'Guardar' : 'Adicionar'}</ModalPrimary>
        </>}>
            <form id="inventory-form" onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <span className="block text-[12px] font-medium text-[#97A1B3] uppercase tracking-tight">Tipo</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {CATEGORIES.map(c => {
                            const Icon = CATEGORY_ICON[c]
                            const on = category === c
                            return (
                                <button key={c} type="button" onClick={() => setCategory(c)} className="flex flex-col items-center gap-2 py-2">
                                    <span className={cn("w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors", on ? "bg-[#ff0054] text-white" : "bg-[#EFF0F2] dark:bg-[#27282D] text-[#97A1B3]")}><Icon className="w-5 h-5" /></span>
                                    <span className={cn("text-[11px] font-medium uppercase tracking-tight text-center leading-tight", on ? "text-zinc-900 dark:text-white" : "text-[#97A1B3]")}>{CATEGORY_SINGULAR[c]}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Nome"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={namePlaceholder} required autoFocus maxLength={140} /></Field>
                    <Field label={vendorLabel}><TextInput value={vendor} onChange={(e) => setVendor(e.target.value)} maxLength={120} /></Field>
                </div>
                <div className="grid grid-cols-[1fr_120px] gap-3">
                    <Field label="Licença">
                        <TextInput value={license} onChange={(e) => setLicense(e.target.value)} list="inventory-licenses" placeholder={LICENSE_SUGGESTIONS[category][0] ? `Ex.: ${LICENSE_SUGGESTIONS[category][0]}` : ''} maxLength={120} />
                        <datalist id="inventory-licenses">{LICENSE_SUGGESTIONS[category].map(l => <option key={l} value={l} />)}</datalist>
                    </Field>
                    <Field label="Lugares"><TextInput type="number" min={0} value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="1" /></Field>
                </div>
                <div className="grid grid-cols-[1fr_100px_160px] gap-3">
                    <Field label="Custo"><TextInput value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" placeholder="0,00" /></Field>
                    <Field label="Moeda"><SelectInput value={cur} onChange={(e) => setCur(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</SelectInput></Field>
                    <Field label="Pagamento"><SelectInput value={billing} onChange={(e) => setBilling(e.target.value as InventoryBilling)}>{(Object.keys(BILLING_LABEL) as InventoryBilling[]).map(b => <option key={b} value={b}>{BILLING_LABEL[b]}</option>)}</SelectInput></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Data de compra"><TextInput type="date" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} /></Field>
                    <Field label={renewLabel}><TextInput type="date" value={renewsAt} onChange={(e) => setRenewsAt(e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Atribuído a">
                        <SelectInput value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                            <option value="">Estúdio (partilhado)</option>
                            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </SelectInput>
                    </Field>
                    <Field label="Marca" hint={category === 'font' ? 'Fonte licenciada para a marca de um cliente.' : undefined}>
                        <SelectInput value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                            <option value="">Nenhuma</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </SelectInput>
                    </Field>
                </div>
                <Field label="Notas"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Número de série, conta associada, onde está o ficheiro da licença…" maxLength={1000} /></Field>
            </form>
        </Modal>
    )
}
