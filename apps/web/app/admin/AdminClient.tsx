"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    ShieldAlert, 
    CheckCircle2, 
    XCircle, 
    FileText, 
    Users, 
    Loader2, 
    LogOut,
    Plus,
    Trash2,
    BookOpen,
    Briefcase,
    Search,
    MoreVertical,
    Eye
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPendingSubscriptions, approveSubscription, rejectSubscription } from "@/app/actions/billing"
import { 
    getAdminUsers, addAdminUser, removeAdminUser, 
    getDashboardStats, getGlobalUsers, getGlobalProjects, 
    getGlobalBrandbooks, getGlobalWorkspaces,
    deleteAdminProject, deleteAdminBrandbook, deleteAdminWorkspace
} from "@/app/actions/admin"

interface AdminClientProps {
    userEmail: string;
    role: string;
}

export function AdminClient({ userEmail, role }: AdminClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = React.useState("dashboard")

    const tabs = [
        { id: "dashboard", label: "Visão Geral", icon: FileText }, 
        { id: "billing", label: "Faturação", icon: FileText },
        { id: "users", label: "Utilizadores", icon: Users },
        { id: "projects", label: "Projetos", icon: FileText },
        { id: "brandbooks", label: "Brandbooks", icon: BookOpen },
        { id: "workspaces", label: "Workspaces", icon: Briefcase },
        ...(role === 'superadmin' ? [{ id: "access", label: "Acessos", icon: ShieldAlert }] : [])
    ]

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-bg-1 border-r border-bg-2 flex flex-col">
                <div className="p-6 border-b border-bg-2">
                    <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-[#ff0054]" />
                        BRIVIO ADMIN
                    </h1>
                    <div className="mt-2 text-xs text-text-tertiary">
                        {userEmail} <Badge variant="outline" className="ml-1 uppercase text-[9px] bg-bg-2">{role}</Badge>
                    </div>
                </div>
                
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab.id 
                                ? "bg-bg-3 text-white" 
                                : "text-text-secondary hover:text-white hover:bg-bg-2"
                            }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-accent-indigo" : ""}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-bg-2">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-text-secondary hover:text-white hover:bg-bg-2 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair do Admin
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-bg-0 p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "dashboard" && <DashboardAdminModule />}
                        {activeTab === "billing" && <BillingAdminModule />}
                        {activeTab === "users" && <UsersAdminModule />}
                        {activeTab === "projects" && <ProjectsAdminModule />}
                        {activeTab === "brandbooks" && <BrandbooksAdminModule />}
                        {activeTab === "workspaces" && <WorkspacesAdminModule />}
                        {activeTab === "access" && role === 'superadmin' && <AccessAdminModule />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

function DashboardAdminModule() {
    const [stats, setStats] = React.useState({ usersCount: 0, projectsCount: 0, pendingCount: 0, brandbooksCount: 0, workspacesCount: 0 })
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const load = async () => {
            const res = await getDashboardStats()
            if (res.success && res.data) setStats(res.data)
            setIsLoading(false)
        }
        load()
    }, [])

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Visão Geral</h2>
                <p className="text-text-secondary">Estatísticas principais da plataforma.</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-text-tertiary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-bg-1 border border-bg-2 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                        <h3 className="text-sm font-bold text-text-tertiary uppercase mb-2">Total de Utilizadores</h3>
                        <p className="text-5xl font-black text-white">{stats.usersCount || 0}</p>
                    </div>
                    <div className="bg-bg-1 border border-bg-2 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                        <h3 className="text-sm font-bold text-text-tertiary uppercase mb-2">Projetos Ativos</h3>
                        <p className="text-5xl font-black text-white">{stats.projectsCount || 0}</p>
                    </div>
                    <div className="bg-bg-1 border border-bg-2 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                        <h3 className="text-sm font-bold text-text-tertiary uppercase mb-2">Brandbooks</h3>
                        <p className="text-5xl font-black text-white">{stats.brandbooksCount || 0}</p>
                    </div>
                    <div className="bg-bg-1 border border-bg-2 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                        <h3 className="text-sm font-bold text-text-tertiary uppercase mb-2">Workspaces</h3>
                        <p className="text-5xl font-black text-white">{stats.workspacesCount || 0}</p>
                    </div>
                    <div className="bg-[#ff0054]/10 border border-[#ff0054]/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center md:col-span-2">
                        <h3 className="text-sm font-bold text-[#ff0054] uppercase mb-2">Faturas Pendentes</h3>
                        <p className="text-5xl font-black text-[#ff0054]">{stats.pendingCount === null ? 0 : (stats.pendingCount || 0)}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function UsersAdminModule() {
    const [users, setUsers] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")

    React.useEffect(() => {
        const load = async () => {
            const res = await getGlobalUsers()
            if (res.success && res.data) setUsers(res.data)
            setIsLoading(false)
        }
        load()
    }, [])

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Utilizadores</h2>
                    <p className="text-text-secondary">Gestão de contas da plataforma.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input 
                        placeholder="Pesquisar..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-text-tertiary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-bg-3 rounded-3xl bg-bg-1/50">
                    <Users className="w-12 h-12 text-text-tertiary mb-4" />
                    <h3 className="text-xl font-bold mb-2">Sem Utilizadores</h3>
                    <p className="text-text-secondary">Nenhum utilizador encontrado com esta pesquisa.</p>
                </div>
            ) : (
                <div className="bg-bg-1 border border-bg-2 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-bg-2 text-text-secondary text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-bold">Nome</th>
                                <th className="px-6 py-4 font-bold">Email</th>
                                <th className="px-6 py-4 font-bold">Tipo</th>
                                <th className="px-6 py-4 font-bold">Data de Registo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bg-2">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-bg-0/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-bg-3 overflow-hidden shrink-0">
                                            {u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        {u.name || 'Sem Nome'}
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="uppercase text-[10px]">{u.profile_type || 'N/A'}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">{new Date(u.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function ProjectsAdminModule() {
    const [projects, setProjects] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

    const load = async () => {
        const res = await getGlobalProjects()
        if (res.success && res.data) setProjects(res.data)
        setIsLoading(false)
    }

    React.useEffect(() => {
        load()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja apagar permanentemente este projeto? Esta ação é irreversível.")) return;
        setIsDeleting(id)
        const res = await deleteAdminProject(id)
        if (res.success) {
            await load()
        } else {
            alert("Erro ao apagar projeto: " + res.error)
        }
        setIsDeleting(null)
    }

    const filteredProjects = projects.filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Projetos</h2>
                    <p className="text-text-secondary">Todos os projetos criados na plataforma.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input 
                        placeholder="Pesquisar projetos..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-text-tertiary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-bg-3 rounded-3xl bg-bg-1/50">
                    <Briefcase className="w-12 h-12 text-text-tertiary mb-4" />
                    <h3 className="text-xl font-bold mb-2">Sem Projetos</h3>
                    <p className="text-text-secondary">Nenhum projeto encontrado com esta pesquisa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(p => (
                        <div key={p.id} className="bg-bg-1 border border-bg-2 rounded-2xl p-4 flex flex-col gap-4 relative group">
                            <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 backdrop-blur border-none hover:bg-black/70">
                                            <MoreVertical className="w-4 h-4 text-white" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-bg-1 border-bg-2">
                                        <DropdownMenuItem 
                                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                            onClick={() => handleDelete(p.id)}
                                            disabled={isDeleting === p.id}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {isDeleting === p.id ? 'A apagar...' : 'Apagar permanentemente'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="h-32 bg-bg-2 rounded-xl overflow-hidden relative">
                                {p.cover_url && <img src={`https://gksgqymvtdbdfysguzbn.supabase.co/storage/v1/object/public/assets/${p.cover_url}`} className="w-full h-full object-cover" />}
                                <div className="absolute top-2 left-2">
                                    <Badge variant="secondary" className="bg-black/50 backdrop-blur-md">{p.status}</Badge>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 truncate">{p.name}</h3>
                                <p className="text-xs text-text-tertiary truncate">Por ID: {p.created_by?.substring(0,8)}...</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function BrandbooksAdminModule() {
    const [brandbooks, setBrandbooks] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

    const load = async () => {
        const res = await getGlobalBrandbooks()
        if (res.success && res.data) setBrandbooks(res.data)
        setIsLoading(false)
    }

    React.useEffect(() => {
        load()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja apagar permanentemente este brandbook?")) return;
        setIsDeleting(id)
        const res = await deleteAdminBrandbook(id)
        if (res.success) {
            await load()
        } else {
            alert("Erro ao apagar brandbook: " + res.error)
        }
        setIsDeleting(null)
    }

    const filteredBrandbooks = brandbooks.filter(b => 
        (b.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Brandbooks</h2>
                    <p className="text-text-secondary">Todos os brandbooks criados na plataforma.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input 
                        placeholder="Pesquisar brandbooks..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-text-tertiary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filteredBrandbooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-bg-3 rounded-3xl bg-bg-1/50">
                    <BookOpen className="w-12 h-12 text-text-tertiary mb-4" />
                    <h3 className="text-xl font-bold mb-2">Sem Brandbooks</h3>
                    <p className="text-text-secondary">Nenhum brandbook encontrado com esta pesquisa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBrandbooks.map(b => (
                        <div key={b.id} className="bg-bg-1 border border-bg-2 rounded-2xl p-4 flex flex-col gap-4 relative group">
                            <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 backdrop-blur border-none hover:bg-black/70">
                                            <MoreVertical className="w-4 h-4 text-white" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-bg-1 border-bg-2">
                                        <DropdownMenuItem 
                                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                            onClick={() => handleDelete(b.id)}
                                            disabled={isDeleting === b.id}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {isDeleting === b.id ? 'A apagar...' : 'Apagar permanentemente'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="h-32 bg-bg-2 rounded-xl flex items-center justify-center overflow-hidden">
                                {b.logo_url ? (
                                    <img src={`https://gksgqymvtdbdfysguzbn.supabase.co/storage/v1/object/public/assets/${b.logo_url}`} className="max-w-full max-h-full object-contain p-4" />
                                ) : (
                                    <BookOpen className="w-8 h-8 text-text-tertiary" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 truncate">{b.name}</h3>
                                <p className="text-xs text-text-tertiary truncate">Por ID: {b.created_by?.substring(0,8) || 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function WorkspacesAdminModule() {
    const [workspaces, setWorkspaces] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

    const load = async () => {
        const res = await getGlobalWorkspaces()
        if (res.success && res.data) setWorkspaces(res.data)
        setIsLoading(false)
    }

    React.useEffect(() => {
        load()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja apagar permanentemente este workspace?")) return;
        setIsDeleting(id)
        const res = await deleteAdminWorkspace(id)
        if (res.success) {
            await load()
        } else {
            alert("Erro ao apagar workspace: " + res.error)
        }
        setIsDeleting(null)
    }

    const filteredWorkspaces = workspaces.filter(w => 
        (w.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Workspaces</h2>
                    <p className="text-text-secondary">Todos os espaços de trabalho na plataforma.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input 
                        placeholder="Pesquisar workspaces..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-text-tertiary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filteredWorkspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-bg-3 rounded-3xl bg-bg-1/50">
                    <Briefcase className="w-12 h-12 text-text-tertiary mb-4" />
                    <h3 className="text-xl font-bold mb-2">Sem Workspaces</h3>
                    <p className="text-text-secondary">Nenhum workspace encontrado com esta pesquisa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkspaces.map(w => (
                        <div key={w.id} className="bg-bg-1 border border-bg-2 rounded-2xl p-6 flex items-center gap-4 relative group">
                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <MoreVertical className="w-4 h-4 text-text-tertiary" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-bg-1 border-bg-2">
                                        <DropdownMenuItem 
                                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                            onClick={() => handleDelete(w.id)}
                                            disabled={isDeleting === w.id}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {isDeleting === w.id ? 'A apagar...' : 'Apagar permanentemente'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="w-16 h-16 rounded-xl bg-bg-2 flex items-center justify-center overflow-hidden shrink-0">
                                {w.avatar_url ? (
                                    <img src={`https://gksgqymvtdbdfysguzbn.supabase.co/storage/v1/object/public/assets/${w.avatar_url}`} className="w-full h-full object-cover" />
                                ) : (
                                    <Briefcase className="w-6 h-6 text-text-tertiary" />
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-lg mb-1 truncate pr-6">{w.name}</h3>
                                <p className="text-xs text-text-tertiary truncate">Criado a {new Date(w.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function BillingAdminModule() {
    const [subscriptions, setSubscriptions] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [actionId, setActionId] = React.useState<string | null>(null)
    const [feedback, setFeedback] = React.useState<{type: 'success'|'error', msg: string} | null>(null)

    React.useEffect(() => {
        loadSubscriptions()
    }, [])

    const loadSubscriptions = async () => {
        setIsLoading(true)
        const res = await getPendingSubscriptions()
        if (res.success) {
            setSubscriptions(res.data || [])
        } else {
            setFeedback({ type: 'error', msg: res.error || 'Erro ao carregar' })
        }
        setIsLoading(false)
    }

    const handleApprove = async (id: string) => {
        setActionId(id)
        const res = await approveSubscription(id)
        if (res.success) {
            setFeedback({ type: 'success', msg: 'Subscrição aprovada com sucesso!' })
            setSubscriptions(prev => prev.filter(s => s.id !== id))
        } else {
            setFeedback({ type: 'error', msg: res.error || 'Erro ao aprovar' })
        }
        setActionId(null)
    }

    const handleReject = async (id: string) => {
        if (!window.confirm("Tem a certeza que deseja rejeitar esta subscrição?")) return
        
        setActionId(id)
        const res = await rejectSubscription(id)
        if (res.success) {
            setFeedback({ type: 'success', msg: 'Subscrição rejeitada.' })
            setSubscriptions(prev => prev.filter(s => s.id !== id))
        } else {
            setFeedback({ type: 'error', msg: res.error || 'Erro ao rejeitar' })
        }
        setActionId(null)
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Aprovação de Faturação</h2>
                    <p className="text-text-secondary">Valide os pagamentos por transferência bancária.</p>
                </div>
                <Button onClick={loadSubscriptions} disabled={isLoading} variant="outline" className="border-bg-3">
                    Atualizar Lista
                </Button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border ${feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {feedback.msg}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-text-tertiary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : subscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-bg-3 rounded-3xl bg-bg-1/50">
                    <CheckCircle2 className="w-12 h-12 text-green-500/50 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Tudo em dia!</h3>
                    <p className="text-text-secondary">Não existem pagamentos pendentes de aprovação.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {subscriptions.map((sub) => (
                        <div key={sub.id} className="bg-bg-1 border border-bg-2 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-[#ff0054]/10 text-[#ff0054] border-[#ff0054]/20">
                                        {sub.plan.toUpperCase()} ({sub.tier})
                                    </Badge>
                                    <span className="text-xs text-text-tertiary">
                                        Submetido a {new Date(sub.created_at).toLocaleDateString('pt-PT')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                    <div>
                                        <p className="text-[10px] uppercase text-text-tertiary font-bold">Utilizador (ID)</p>
                                        <p className="font-medium text-sm truncate" title={sub.user_id}>{sub.user_id.substring(0,8)}...</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-text-tertiary font-bold">Banco</p>
                                        <p className="font-medium text-sm">{sub.bank}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-text-tertiary font-bold">Valor (AOA)</p>
                                        <p className="font-bold text-sm text-white">
                                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(sub.amount_aoa)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-text-tertiary font-bold">Comprovativo</p>
                                        <a 
                                            href={`https://gksgqymvtdbdfysguzbn.supabase.co/storage/v1/object/public/assets/${sub.proof_url}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-accent-indigo hover:underline text-sm font-medium flex items-center gap-1"
                                        >
                                            <FileText className="w-3 h-3" /> Ver Ficheiro
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto shrink-0 border-t border-bg-3 pt-4 md:border-0 md:pt-0">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 md:flex-none border-red-500/30 text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleReject(sub.id)}
                                    disabled={actionId === sub.id}
                                >
                                    {actionId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />} Rejeitar
                                </Button>
                                <Button 
                                    className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleApprove(sub.id)}
                                    disabled={actionId === sub.id}
                                >
                                    {actionId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} Aprovar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function AccessAdminModule() {
    const [admins, setAdmins] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [newEmail, setNewEmail] = React.useState("")
    const [isAdding, setIsAdding] = React.useState(false)
    const [feedback, setFeedback] = React.useState<{type: 'success'|'error', msg: string} | null>(null)

    React.useEffect(() => {
        loadAdmins()
    }, [])

    const loadAdmins = async () => {
        setIsLoading(true)
        const res = await getAdminUsers()
        if (res.success) {
            setAdmins(res.data || [])
        } else {
            setFeedback({ type: 'error', msg: res.error || 'Erro ao carregar' })
        }
        setIsLoading(false)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail.trim()) return

        setIsAdding(true)
        const res = await addAdminUser(newEmail.trim().toLowerCase())
        if (res.success) {
            setFeedback({ type: 'success', msg: 'Administrador adicionado.' })
            setNewEmail("")
            loadAdmins()
        } else {
            setFeedback({ type: 'error', msg: res.error || 'Erro ao adicionar' })
        }
        setIsAdding(false)
    }

    const handleRemove = async (id: string) => {
        if (!window.confirm("Remover o acesso deste administrador?")) return
        
        const res = await removeAdminUser(id)
        if (res.success) {
            setFeedback({ type: 'success', msg: 'Administrador removido.' })
            setAdmins(prev => prev.filter(a => a.id !== id))
        } else {
            setFeedback({ type: 'error', msg: res.error || 'Erro ao remover' })
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">Gestão de Acessos</h2>
                <p className="text-text-secondary">Controle quem tem acesso a este portal de administração.</p>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border ${feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {feedback.msg}
                </div>
            )}

            <div className="bg-bg-1 border border-bg-2 rounded-3xl p-8">
                <form onSubmit={handleAdd} className="flex gap-4 items-end mb-8">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-bold">Adicionar Administrador</label>
                        <Input 
                            type="email" 
                            placeholder="email@dominio.com" 
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="bg-bg-0 border-bg-3"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isAdding} className="bg-accent-indigo hover:bg-accent-indigo/90">
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Adicionar</>}
                    </Button>
                </form>

                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-text-tertiary uppercase tracking-wider mb-4">Administradores Ativos</h3>
                    {isLoading ? (
                        <div className="py-8 text-center text-text-tertiary">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </div>
                    ) : admins.length === 0 ? (
                        <p className="text-text-secondary text-sm">Nenhum administrador encontrado.</p>
                    ) : (
                        admins.map(admin => (
                            <div key={admin.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-0 border border-bg-3">
                                <div>
                                    <p className="font-bold">{admin.email}</p>
                                    <p className="text-xs text-text-tertiary mt-1 uppercase tracking-wider font-bold">Role: {admin.role}</p>
                                </div>
                                {admin.role !== 'superadmin' && (
                                    <button 
                                        onClick={() => handleRemove(admin.id)}
                                        className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Remover acesso"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
