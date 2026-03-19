"use client"

import * as React from "react"
import { Users, UserPlus, Mail, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast } from "sonner"
import { useWorkspace } from "@/components/providers/WorkspaceProvider"
import { getWorkspaceMembers, inviteMember, removeMember, WorkspaceMember } from "@/app/actions/settings"

export function MembersSettings() {
    const { workspace } = useWorkspace()
    const [members, setMembers] = React.useState<WorkspaceMember[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [inviteEmail, setInviteEmail] = React.useState("")
    const [inviteRole, setInviteRole] = React.useState("editor")
    const [isInviting, setIsInviting] = React.useState(false)

    const fetchMembers = React.useCallback(async () => {
        if (!workspace?.id) return
        setIsLoading(true)
        try {
            const data = await getWorkspaceMembers(workspace.id)
            setMembers(data)
        } catch {
            toast.error("Erro ao carregar membros")
        } finally {
            setIsLoading(false)
        }
    }, [workspace?.id])

    React.useEffect(() => {
        fetchMembers()
    }, [fetchMembers])

    const handleInvite = async () => {
        if (!workspace?.id || !inviteEmail) return

        setIsInviting(true)
        try {
            const res = await inviteMember(workspace.id, inviteEmail, inviteRole)
            if (res.success) {
                toast.success("Convite enviado com sucesso")
                setInviteEmail("")
                fetchMembers()
            } else {
                toast.error(res.error || "Erro ao convidar membro")
            }
        } catch {
            toast.error("Erro inesperado")
        } finally {
            setIsInviting(false)
        }
    }

    const handleRemoveMember = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este membro?")) return

        try {
            const res = await removeMember(id)
            if (res.success) {
                toast.success("Membro removido")
                fetchMembers()
            } else {
                toast.error(res.error || "Erro ao remover membro")
            }
        } catch {
            toast.error("Erro ao remover membro")
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "owner": return <Badge className="bg-purple-500/10 text-purple-500 border-transparent text-[9px] font-black uppercase">Owner</Badge>
            case "admin": return <Badge className="bg-emerald-500/10 text-emerald-500 border-transparent text-[9px] font-black uppercase">Admin</Badge>
            case "editor": return <Badge className="bg-blue-500/10 text-blue-500 border-transparent text-[9px] font-black uppercase">Editor</Badge>
            case "financeiro": return <Badge className="bg-amber-500/10 text-amber-500 border-transparent text-[9px] font-black uppercase">Financeiro</Badge>
            default: return <Badge variant="secondary" className="text-[9px] font-black uppercase">Visualizador</Badge>
        }
    }

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-white mb-2">Membros & Permissões</h3>
                    <p className="text-text-secondary">Gere a tua equipa e as permissões de acesso ao workspace.</p>
                </div>
                <Button className="h-11 px-6 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent-indigo/20 active:scale-95 transition-all">
                    <UserPlus className="w-4 h-4" />
                    Convidar Membro
                </Button>
            </div>

            {/* Invite Form (Mini) */}
            <div className="p-6 bg-bg-2 border border-bg-3 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Endereço de Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            placeholder="email@exemplo.com"
                            className="bg-bg-1 border-bg-3 h-11 pl-12 rounded-xl text-white font-medium"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-48 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Cargo / Função</label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="bg-bg-1 border-bg-3 h-11 rounded-xl text-white font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-bg-2 border-bg-3 text-white">
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="member">Membro</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={handleInvite}
                    disabled={isInviting || !inviteEmail}
                    className="h-11 px-8 bg-white text-black font-bold rounded-xl hover:bg-white/90 disabled:opacity-50"
                >
                    {isInviting ? "A enviar..." : "Enviar Convite"}
                </Button>
            </div>

            {/* Members List */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Equipa Atual ({members.length})</h4>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-text-secondary">Carregando membros...</div>
                ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-bg-3 rounded-2xl bg-white/[0.01]">
                        <div className="w-12 h-12 rounded-full bg-bg-2 flex items-center justify-center mb-4">
                            <Users className="w-5 h-5 text-text-secondary" />
                        </div>
                        <h3 className="font-bold text-white text-lg">Sem membros</h3>
                        <p className="text-text-secondary text-sm max-w-[250px] text-center mt-2">
                            Não há membros neste workspace. Convide alguém acima para começar.
                        </p>
                    </div>
                ) : (
                    <div className="border border-bg-3 rounded-2xl overflow-hidden bg-white/[0.01]">
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/[0.02] border-b border-bg-3 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50">
                            <div className="col-span-5">Utilizador</div>
                            <div className="col-span-3">Função</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="divide-y divide-bg-3">
                            {members.map((m) => (
                                <div key={m.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-colors">
                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent-indigo flex items-center justify-center text-xs text-white font-black border border-bg-1 shadow-sm overflow-hidden">
                                            {m.user?.avatar_url ? (
                                                <img src={m.user.avatar_url} alt={m.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                (m.user?.name || "U")[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{m.user?.name || "Usuário desconhecido"}</div>
                                            <div className="text-[10px] text-text-secondary">{m.user?.email || "Sem email"}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        {getRoleBadge(m.role)}
                                    </div>
                                    <div className="col-span-3">
                                        {m.status === "active" ? (
                                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Ativo
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                {m.status === 'pending' ? 'Pendente' : m.status}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-text-secondary opacity-40 hover:text-red-500 hover:opacity-100"
                                            onClick={() => handleRemoveMember(m.id)}
                                            disabled={m.role === 'owner'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
