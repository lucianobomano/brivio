"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "nextjs-toploader/app"
import { Clock, Crown, Eye, LogOut, Mail, PenTool, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate, initials } from "@/lib/format"
import { inviteMember, removeMember, updateMemberRole, type TeamMember, type TeamRole } from "@/app/actions/team"
import {
    ChoiceCard, DarkButton, EmptyState, Field, IconButton, Modal, ModalPrimary, ModalSecondary, PANEL, Panel, Pill, SelectInput, StatStrip, TABLE_HEAD, TABLE_ROW, TextInput, WorkspaceShell, type Tone,
} from "@/components/workspace/ui"

type Team = { workspaceName: string, me: string, myRole: TeamRole, canManage: boolean, members: TeamMember[] }
type View = 'people' | 'pending' | 'roles'

const ROLES: Record<TeamRole, { label: string, text: string, icon: React.ComponentType<{ className?: string }>, tone: Tone }> = {
    owner: { label: 'Proprietário', text: 'Controlo total do estúdio, incluindo o plano e a faturação.', icon: Crown, tone: 'pink' },
    admin: { label: 'Administrador', text: 'Gere a equipa, os clientes, as marcas e os projetos.', icon: ShieldCheck, tone: 'indigo' },
    member: { label: 'Designer', text: 'Trabalha nos brandbooks, ficheiros e projetos do estúdio.', icon: PenTool, tone: 'green' },
    client_viewer: { label: 'Cliente', text: 'Acompanha o trabalho que for partilhado, sem editar.', icon: Eye, tone: 'zinc' },
}

export function TeamClient({ initial }: { initial: Team }) {
    const router = useRouter()
    const [members, setMembers] = React.useState(initial.members)
    const [view, setView] = React.useState<View>('people')
    const [inviteOpen, setInviteOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const { canManage, myRole, me } = initial

    const active = members.filter(m => m.accepted_at)
    const pending = members.filter(m => !m.accepted_at)
    const q = query.trim().toLowerCase()
    const visible = (view === 'pending' ? pending : members).filter(m => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    const canEdit = (m: TeamMember) => canManage && m.role !== 'owner' && m.user_id !== me && (m.role !== 'admin' || myRole === 'owner')
    const openInvite = () => canManage ? setInviteOpen(true) : toast.error('Só os proprietários e administradores podem convidar pessoas.')

    const onRole = async (m: TeamMember, role: TeamRole) => {
        const before = m.role
        setMembers(list => list.map(x => x.id === m.id ? { ...x, role } : x))
        const res = await updateMemberRole(m.id, role)
        if (!res.success) { setMembers(list => list.map(x => x.id === m.id ? { ...x, role: before } : x)); toast.error(res.error) }
        else toast.success(`${m.name} é agora ${ROLES[role].label.toLowerCase()}`)
    }
    const onRemove = async (m: TeamMember) => {
        const leaving = m.user_id === me
        const msg = leaving ? `Sair do estúdio «${initial.workspaceName}»? Deixas de ter acesso às marcas e projetos.` : m.accepted_at ? `Remover ${m.name} da equipa?` : `Cancelar o convite de ${m.email}?`
        if (!confirm(msg)) return
        const res = await removeMember(m.id)
        if (!res.success) { toast.error(res.error); return }
        if (leaving) { router.push('/onboarding'); return }
        setMembers(list => list.filter(x => x.id !== m.id))
        toast.success(m.accepted_at ? 'Pessoa removida da equipa' : 'Convite cancelado')
    }

    return (
        <WorkspaceShell
            section="Equipa"
            view={view}
            onView={setView}
            views={[
                { id: 'people', label: 'Pessoas', icon: Users, count: members.length },
                { id: 'pending', label: 'Convites pendentes', icon: Clock, count: pending.length },
                { id: 'roles', label: 'Papéis', icon: ShieldCheck },
            ]}
            list={active.map(m => ({ id: m.id, label: m.name, onClick: () => { setView('people'); setQuery(m.name) } }))}
            listAddLabel="Convidar pessoa"
            onListAdd={canManage ? openInvite : undefined}
            search={query}
            onSearch={setQuery}
            action={canManage ? { label: 'Convidar', onClick: openInvite } : undefined}
        >
            <StatStrip stats={[
                { label: 'Na equipa', value: active.length, unit: 'pessoas', icon: Users, tone: 'rose', onClick: () => setView('people') },
                { label: 'Convites pendentes', value: pending.length, unit: 'por aceitar', icon: Clock, tone: 'amber', onClick: () => setView('pending') },
                { label: 'Designers', value: members.filter(m => m.role === 'member').length, unit: 'pessoas', icon: PenTool, tone: 'green' },
                { label: 'Clientes', value: members.filter(m => m.role === 'client_viewer').length, unit: 'com acesso', icon: Eye, tone: 'indigo' },
            ]} />

            {view === 'roles' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(Object.keys(ROLES) as TeamRole[]).map(r => {
                        const R = ROLES[r]
                        const count = members.filter(m => m.role === r).length
                        return (
                            <Panel key={r}>
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-[#ff0054]/20 flex items-center justify-center text-[#ff0054] shrink-0"><R.icon className="w-4 h-4" /></div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100">{R.label}</p>
                                            <span className="text-[11px] text-zinc-500">{count} {count === 1 ? 'pessoa' : 'pessoas'}</span>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">{R.text}</p>
                                    </div>
                                </div>
                            </Panel>
                        )
                    })}
                </div>
            ) : view === 'pending' && pending.length === 0 ? (
                <EmptyState icon={Mail} title="Não há convites por aceitar" text="Quando convidares alguém que ainda não tem conta no Brivio, o convite aparece aqui até a pessoa entrar pela primeira vez." action={canManage ? <DarkButton onClick={openInvite}><UserPlus className="w-3.5 h-3.5" /> Convidar pessoa</DarkButton> : undefined} />
            ) : (
                <>
                    <div className={cn(PANEL, "overflow-hidden")}>
                        <div className={cn(TABLE_HEAD, "hidden md:grid grid-cols-[1.6fr_0.9fr_1fr_160px_40px] gap-4")}>
                            <span>Pessoa</span><span>Estado</span><span>Entrada</span><span>Papel</span><span />
                        </div>
                        {visible.map(m => {
                            const R = ROLES[m.role]
                            const editable = canEdit(m)
                            return (
                                <div key={m.id} className={cn(TABLE_ROW, "grid grid-cols-1 md:grid-cols-[1.6fr_0.9fr_1fr_160px_40px] gap-2 md:gap-4 items-center")}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        {m.avatar_url
                                            // eslint-disable-next-line @next/next/no-img-element
                                            ? <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0" loading="lazy" />
                                            : <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[11px] font-bold text-zinc-800 dark:text-white shrink-0">{initials(m.name)}</div>}
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{m.name}{m.user_id === me && <span className="ml-1.5 text-[11px] font-normal text-zinc-500">(tu)</span>}</p>
                                            <p className="text-[11px] text-zinc-500 truncate">{m.email}</p>
                                        </div>
                                    </div>
                                    <span>{m.accepted_at ? <Pill tone="green">Ativo</Pill> : <Pill tone="amber">Convite enviado</Pill>}</span>
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{formatDate(m.accepted_at || m.invited_at)}</span>
                                    {editable ? (
                                        <SelectInput value={m.role} onChange={(e) => onRole(m, e.target.value as TeamRole)} className="h-8 text-xs rounded-lg" aria-label={`Papel de ${m.name}`}>
                                            {(['admin', 'member', 'client_viewer'] as TeamRole[]).filter(r => r !== 'admin' || myRole === 'owner' || m.role === 'admin').map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
                                        </SelectInput>
                                    ) : <span><Pill tone={R.tone}>{R.label}</Pill></span>}
                                    <div className="flex md:justify-end">
                                        {m.role !== 'owner' && (editable || m.user_id === me) && (
                                            <IconButton title={m.user_id === me ? 'Sair do estúdio' : m.accepted_at ? 'Remover da equipa' : 'Cancelar convite'} danger onClick={() => onRemove(m)}>
                                                {m.user_id === me ? <LogOut className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </IconButton>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {visible.length === 0 && <p className="text-xs text-zinc-500 text-center py-10">Ninguém encontrado.</p>}
                    </div>
                    {members.length <= 1 && !q && view === 'people' && (
                        <EmptyState
                            icon={UserPlus}
                            title="Trabalha a marca em equipa"
                            text="Convida os designers do estúdio para editarem os brandbooks e projetos contigo, ou dá ao cliente acesso para acompanhar o trabalho."
                            action={canManage ? <DarkButton onClick={openInvite}><UserPlus className="w-3.5 h-3.5" /> Convidar pessoa</DarkButton> : undefined}
                        />
                    )}
                </>
            )}

            {inviteOpen && <InviteModal myRole={myRole} onClose={() => setInviteOpen(false)} onInvited={(m) => { setMembers(list => [...list, m]); setInviteOpen(false) }} />}
        </WorkspaceShell>
    )
}

function InviteModal({ myRole, onClose, onInvited }: { myRole: TeamRole, onClose: () => void, onInvited: (m: TeamMember) => void }) {
    const [email, setEmail] = React.useState('')
    const [role, setRole] = React.useState<TeamRole>('member')
    const [sending, setSending] = React.useState(false)
    const options = (['admin', 'member', 'client_viewer'] as TeamRole[]).filter(r => r !== 'admin' || myRole === 'owner')

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSending(true)
        const res = await inviteMember({ email, role })
        setSending(false)
        if (!res.success) { toast.error(res.error); return }
        toast.success(res.data!.accepted_at ? `${res.data!.name} entrou na equipa` : `Convite enviado para ${email}`)
        onInvited(res.data!)
    }

    return (
        <Modal open onClose={onClose} title="Convidar para a equipa" footer={<>
            <ModalSecondary type="button" onClick={onClose}>Cancelar</ModalSecondary>
            <ModalPrimary type="submit" form="invite-form" loading={sending}>Enviar convite</ModalPrimary>
        </>}>
            <form id="invite-form" onSubmit={submit} className="space-y-5">
                <Field label="Email" hint="Se a pessoa ainda não tiver conta no Brivio, recebe um email para a criar.">
                    <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@estudio.pt" required autoFocus />
                </Field>
                <div className="space-y-2">
                    <span className="block text-[12px] font-medium text-[#97A1B3] uppercase tracking-tight">Papel</span>
                    <div className="space-y-2" role="radiogroup" aria-label="Papel">
                        {options.map(r => <ChoiceCard key={r} selected={role === r} onClick={() => setRole(r)} icon={ROLES[r].icon} title={ROLES[r].label} text={ROLES[r].text} />)}
                    </div>
                </div>
            </form>
        </Modal>
    )
}
