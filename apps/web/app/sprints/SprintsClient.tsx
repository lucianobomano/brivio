"use client"

import * as React from "react"
import {
    Timer,
    Plus,
    Calendar,
    MoreVertical,
    Target,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    LayoutGrid,
    List as ListIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { SprintModal } from "@/components/sprints/SprintModal"
import type { Sprint } from "@/app/actions/sprints"
import { toast } from "sonner"
import { deleteSprint } from "@/app/actions/sprints"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { UnifiedHeader } from "@/components/layout/UnifiedHeader"
import { GlobalSettingsView } from "@/components/settings/GlobalSettingsView"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pencil, Trash2 } from "lucide-react"

interface SprintsClientProps {
    initialSprints: Sprint[]
    projects: { id: string, name: string }[]
}

export function SprintsClient({ initialSprints, projects }: SprintsClientProps) {
    const [sprints, setSprints] = React.useState(initialSprints)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [selectedSprint, setSelectedSprint] = React.useState<Sprint | null>(null)
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = React.useState("")

    const [user, setUser] = React.useState<any>(null)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const supabase = createClient()
        async function fetchUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url, cover_url, profile_type')
                    .eq('id', authUser.id)
                    .single()

                const { data: creatorProfile } = await supabase
                    .from('creator_profiles')
                    .select('category')
                    .eq('user_id', authUser.id)
                    .single()

                setUser({
                    id: authUser.id,
                    email: authUser.email || "",
                    profile: profile ? {
                        name: profile.name,
                        avatar_url: profile.avatar_url,
                        cover_url: profile.cover_url,
                        profile_type: profile.profile_type
                    } : undefined,
                    creatorProfile: creatorProfile ? {
                        category: creatorProfile.category
                    } : undefined
                })
            }
        }
        fetchUser()
    }, [])

    const activeSprintsCount = sprints.filter(s => s.status === 'active').length
    const plannedSprintsCount = sprints.filter(s => s.status === 'planned').length
    const completedSprintsCount = sprints.filter(s => s.status === 'completed').length

    const filteredSprints = sprints.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.goal?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreateSprint = () => {
        setSelectedSprint(null)
        setIsModalOpen(true)
    }

    const handleEditSprint = (sprint: Sprint) => {
        setSelectedSprint(sprint)
        setIsModalOpen(true)
    }

    const handleDeleteSprint = async (sprintId: string) => {
        if (confirm("Tem certeza que deseja excluir esta sprint?")) {
            const res = await deleteSprint(sprintId)
            if (res.success) {
                toast.success("Sprint excluída")
                setSprints(prev => prev.filter(s => s.id !== sprintId))
            } else {
                toast.error("Erro ao excluir")
            }
        }
    }

    const handleSprintSuccess = (updatedSprint: Sprint) => {
        setSprints(prev => {
            const exists = prev.find(s => s.id === updatedSprint.id)
            if (exists) {
                return prev.map(s => s.id === updatedSprint.id ? updatedSprint : s)
            }
            return [...prev, updatedSprint]
        })
        setIsModalOpen(false)
    }

    const SprintCard = ({ sprint }: { sprint: Sprint }) => {
        const project = projects.find(p => p.id === sprint.project_id)
        return (
            <div
                className="group bg-bg-1 border border-bg-3 rounded-[24px] p-6 hover:shadow-xl hover:border-accent-indigo/20 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col h-full"
                onClick={() => router.push(`/sprints/${sprint.id}`)}
            >
                <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-10",
                    sprint.status === 'active' ? "bg-blue-500" :
                        sprint.status === 'completed' ? "bg-green-500" : "bg-slate-500"
                )} />

                <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-bg-2 border border-bg-3 flex items-center justify-center text-accent-indigo">
                            <Timer className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-primary text-[15px] leading-tight">{sprint.name}</h3>
                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                {project?.name || "Sem projeto"}
                            </span>
                        </div>
                    </div>
                    <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border-none",
                        sprint.status === 'active' ? "bg-blue-500/10 text-blue-500" :
                            sprint.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-bg-3 text-text-tertiary"
                    )}>
                        {sprint.status === 'active' ? "Em curso" :
                            sprint.status === 'completed' ? "Finalizada" : "Planeada"}
                    </Badge>
                </div>

                {sprint.goal && (
                    <p className="text-xs text-text-secondary line-clamp-2 mb-6 leading-relaxed">
                        {sprint.goal}
                    </p>
                )}

                <div className="mt-auto space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                            <span>Progresso</span>
                            <span>{sprint.status === 'completed' ? '100%' : '0%'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-bg-2 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    sprint.status === 'active' ? "bg-blue-500" :
                                        sprint.status === 'completed' ? "bg-green-500" : "bg-bg-3"
                                )}
                                style={{ width: sprint.status === 'completed' ? '100%' : '0%' }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-text-tertiary border-t border-bg-3/50 pt-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                                {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '--'}
                                {' - '}
                                {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '--'}
                            </span>
                        </div>
                        <div className="flex -space-x-2">
                            {[1].map((i) => (
                                <Avatar key={i} className="w-6 h-6 border-2 border-bg-1 shadow-sm">
                                    <AvatarFallback className="text-[8px] bg-bg-2">U</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-text-tertiary hover:text-white rounded-full bg-bg-1/50 backdrop-blur-sm"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1E] border-bg-3">
                            <DropdownMenuItem
                                onClick={() => handleEditSprint(sprint)}
                                className="cursor-pointer text-text-secondary focus:text-white focus:bg-bg-2"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar Sprint
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeleteSprint(sprint.id)}
                                className="cursor-pointer text-red-500 focus:text-red-400 focus:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar Sprint
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        )
    }

    const SprintRow = ({ sprint }: { sprint: Sprint }) => {
        const project = projects.find(p => p.id === sprint.project_id)
        return (
            <div
                onClick={() => router.push(`/sprints/${sprint.id}`)}
                className="group flex items-center justify-between p-4 bg-bg-1 border border-bg-3 rounded-2xl hover:bg-bg-0 hover:border-accent-indigo/20 transition-all cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-bg-2 flex items-center justify-center text-accent-indigo">
                        <Timer className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-text-primary">{sprint.name}</h4>
                        <p className="text-[10px] text-text-tertiary uppercase font-bold">{project?.name || "Sem projeto"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-[11px] font-medium text-text-tertiary">
                        {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : '--'} - {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : '--'}
                    </div>
                    <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border-none min-w-[80px] text-center",
                        sprint.status === 'active' ? "bg-blue-500/10 text-blue-500" :
                            sprint.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-bg-3 text-text-tertiary"
                    )}>
                        {sprint.status === 'active' ? "Em curso" :
                            sprint.status === 'completed' ? "Finalizada" : "Planeada"}
                    </Badge>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 bg-bg-0 min-h-full flex flex-col">
            <UnifiedHeader
                user={user}
                onAddClick={handleCreateSprint}
                addLabel="Nova Sprint"
                onSettingsClick={() => setIsSettingsOpen(true)}
            />

            <GlobalSettingsView
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <div className="max-w-[1400px] mx-auto p-10 space-y-10 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo shadow-lg shadow-accent-indigo/5 border border-accent-indigo/10">
                                <Timer className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-accent-indigo uppercase tracking-widest">
                                <span>Gestão de Ciclos</span>
                                <span className="w-1 h-1 rounded-full bg-accent-indigo/30" />
                                <span>Sprint Planning</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-text-primary tracking-tight">Sprints</h1>
                        <p className="text-text-secondary max-w-xl leading-relaxed">
                            Organize o trabalho da sua equipa em ciclos focados. Defina objetivos claros,
                            datas de entrega e acompanhe o progresso em tempo real.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-bg-1 border-bg-3 rounded-xl hover:bg-bg-2 h-11 px-6 font-bold text-[13px]"
                        >
                            <Target className="w-4 h-4 mr-2 text-accent-indigo" />
                            Definir OKRs
                        </Button>
                        <Button
                            onClick={handleCreateSprint}
                            className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl h-11 px-8 font-bold text-[13px] shadow-lg shadow-accent-indigo/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Sprint
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Sprints Ativos", value: activeSprintsCount, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Planeados", value: plannedSprintsCount, icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/10" },
                        { label: "Concluídos", value: completedSprintsCount, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "Velocidade Média", value: "84%", icon: Timer, color: "text-purple-500", bg: "bg-purple-500/10" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-bg-1 border border-bg-3 rounded-[24px] p-6 flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-text-primary">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bg-3 pb-6">
                    <div className="flex items-center gap-8">
                        {['Todas', 'Ativas', 'Planeadas', 'Histórico'].map((tab) => (
                            <button
                                key={tab}
                                className={cn(
                                    "text-sm font-bold tracking-tight pb-6 -mb-6 transition-all relative",
                                    tab === 'Todas' ? "text-accent-indigo" : "text-text-tertiary hover:text-text-primary"
                                )}
                            >
                                {tab}
                                {tab === 'Todas' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-indigo rounded-full" />}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-hover:text-accent-indigo transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Procurar sprints..."
                                className="bg-bg-1 border border-bg-3 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-indigo/50 w-[240px] transition-all"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 bg-bg-1 border border-bg-3 rounded-xl hover:bg-bg-2">
                            <Filter className="w-4 h-4 text-text-tertiary" />
                        </Button>
                        <div className="w-px h-6 bg-bg-3 mx-2" />
                        <div className="flex items-center gap-1 bg-bg-2 p-1 rounded-xl">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-lg", viewMode === 'grid' ? "bg-bg-0 shadow-sm" : "text-text-tertiary hover:text-text-primary")}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-lg", viewMode === 'list' ? "bg-bg-0 shadow-sm" : "text-text-tertiary hover:text-text-primary")}
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSprints.map((sprint) => (
                            <SprintCard key={sprint.id} sprint={sprint} />
                        ))}

                        <button
                            onClick={handleCreateSprint}
                            className="group border-2 border-dashed border-bg-3 rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 hover:border-accent-indigo/50 hover:bg-accent-indigo/5 transition-all duration-500 min-h-[280px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-bg-2 flex items-center justify-center text-text-tertiary group-hover:bg-accent-indigo group-hover:text-white transition-all duration-500">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-text-primary group-hover:text-accent-indigo transition-colors">Agendar Nova Sprint</p>
                                <p className="text-xs text-text-tertiary">Planeie o próximo ciclo de trabalho</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSprints.map((sprint) => (
                            <SprintRow key={sprint.id} sprint={sprint} />
                        ))}
                        {filteredSprints.length === 0 && (
                            <div className="text-center py-20 bg-bg-1 border border-bg-3 rounded-[24px]">
                                <p className="text-text-tertiary font-medium">Nenhuma sprint encontrada com &quot;{searchQuery}&quot;</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SprintModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSprintSuccess}
                sprint={selectedSprint}
                projects={projects}
            />
        </div>
    )
}
