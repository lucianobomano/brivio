"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    X,
    Calendar,
    Settings,
    Image as ImageIcon,
    AlignLeft,
    Plus,
    ChevronDown,
    Clock,
    CheckCircle2,
    Circle,
    User,
    Trash2,
    Timer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import { toast } from "sonner"
import { DateRangePicker } from "./DateRangePicker"
import {
    updateRoadmapTaskDetails,
    deleteRoadmapTask,
    toggleRoadmapTask,
    getProjectMembers
} from "@/app/actions/roadmap"
import type { Sprint } from "@/app/actions/sprints"
import type { RoadmapStage } from "@/app/actions/roadmap"

interface TaskDetailsModalProps {
    task: RoadmapStage['tasks'][0] | null
    projectId: string
    isOpen: boolean
    onClose: () => void
    stages: { id: string, name: string, color: string }[]
    onRefresh?: () => void
    sprints: Sprint[]
}

export function TaskDetailsModal({ task, projectId, isOpen, onClose, stages, onRefresh, sprints }: TaskDetailsModalProps) {
    const [isEditingDescription, setIsEditingDescription] = React.useState(false)
    const [tempDescription, setTempDescription] = React.useState("")
    const [members, setMembers] = React.useState<{ id: string, name: string, avatar_url: string }[]>([])
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
        if (task) {
            setTempDescription(task.description || "")
        }
    }, [task])

    React.useEffect(() => {
        if (isOpen && projectId) {
            const fetchMembers = async () => {
                const projectMembers = await getProjectMembers(projectId)
                setMembers(projectMembers)
            }
            fetchMembers()
        }
    }, [isOpen, projectId])

    if (!task) return null

    const currentStage = stages.find(s => s.id === task.status) || stages.find(s => s.id === task.stage_id)
    const currentSprint = sprints.find(s => s.id === task.sprint_id)

    const handleUpdate = async (updates: any) => {
        if (!task) return
        setIsLoading(true)
        try {
            const result = await updateRoadmapTaskDetails(task.id, projectId, updates)
            if (result.success) {
                toast.success("Tarefa atualizada")
                onRefresh?.()
            } else {
                toast.error("Erro ao atualizar tarefa")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro de conexão")
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleComplete = async () => {
        if (!task) return
        try {
            const res = await toggleRoadmapTask(task.id, projectId)
            if (res.success) {
                toast.success(res.completed ? "Tarefa concluída" : "Tarefa reaberta")
                onRefresh?.()
            }
        } catch (error) {
            toast.error("Erro ao atualizar status")
        }
    }

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return
        try {
            const res = await deleteRoadmapTask(task.id, projectId)
            if (res.success) {
                toast.success("Tarefa excluída")
                onClose()
                onRefresh?.()
            }
        } catch (error) {
            toast.error("Erro ao excluir tarefa")
        }
    }

    const handleDateRangeSave = (range: { start?: Date; end?: Date }) => {
        handleUpdate({
            start_date: range.start?.toISOString(),
            due_date: range.end?.toISOString()
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[900px] w-full h-[90vh] p-0 overflow-hidden border-none bg-white dark:bg-[#0B0F1A] rounded-[30px] font-inter !flex !flex-col">
                <style jsx global>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                    .font-inter { font-family: 'Inter', sans-serif; }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0, 0, 0, 0.3);
                        border-radius: 10px;
                    }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.3);
                    }
                `}</style>

                <div className="flex flex-col min-h-0 h-full relative font-[300]">
                    {/* Cover Section */}
                    <div className="h-[200px] relative shrink-0">
                        <Image
                            src={task.cover_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"}
                            alt={task.title}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                            <h2 className="text-3xl font-black tracking-tight">{task.title}</h2>
                            <p className="text-[16px] font-[300] opacity-80 mt-1 uppercase tracking-widest text-xs">Tarefa do Roteiro</p>
                        </div>
                        <DialogClose className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                            <X className="w-4 h-4" />
                        </DialogClose>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-[#F8F9FA] dark:bg-[#141824] px-6 py-2 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleToggleComplete}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "text-xs font-bold uppercase tracking-widest gap-2 rounded-full px-4",
                                    task.completed ? "text-emerald-500 bg-emerald-500/10" : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                                )}
                            >
                                {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                {task.completed ? "Concluída" : "Marcar Concluída"}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleDelete}
                                variant="ghost"
                                size="sm"
                                className="text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 gap-2 rounded-full px-4"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs font-bold text-gray-400 uppercase tracking-widest gap-2 rounded-full"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                Editar capa
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto pt-10 px-10 pb-[60px] custom-scrollbar">
                        <div className="flex gap-10">
                            {/* Left Side */}
                            <div className="flex-1 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[#1E1B4B] dark:text-white">{task.title}</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etapa do Fluxo</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all group">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStage?.color || '#ccc' }} />
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{currentStage?.name || "Sem etapa"}</span>
                                                        </div>
                                                        <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-[200px] bg-white dark:bg-[#141824] border-gray-100 dark:border-white/10 p-1 rounded-2xl shadow-2xl">
                                                    {stages.map((stage) => (
                                                        <DropdownMenuItem
                                                            key={stage.id}
                                                            onClick={() => handleUpdate({ stage_id: stage.id })}
                                                            className={cn(
                                                                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all",
                                                                (task.status === stage.id || task.stage_id === stage.id)
                                                                    ? "bg-accent-indigo/10 text-accent-indigo"
                                                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                                            )}
                                                        >
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                                                            {stage.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="flex items-center justify-between px-4 py-2 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all group">
                                                        <div className="flex items-center gap-3">
                                                            {task.assignee?.avatar_url ? (
                                                                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-100 relative">
                                                                    <Image src={task.assignee.avatar_url} alt="" fill className="object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                                    {task.assignee?.name?.substring(0, 2).toUpperCase() || <User className="w-3 h-3" />}
                                                                </div>
                                                            )}
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{task.assignee?.name || "Sem responsável"}</span>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[240px] bg-white dark:bg-[#141824] border-gray-100 dark:border-white/10 p-1 rounded-2xl shadow-2xl">
                                                    {members.map((member) => (
                                                        <DropdownMenuItem
                                                            key={member.id}
                                                            onClick={() => handleUpdate({ assignee_id: member.id })}
                                                            className={cn(
                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all",
                                                                task.assignee?.id === member.id
                                                                    ? "bg-accent-indigo/10 text-accent-indigo"
                                                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                                            )}
                                                        >
                                                            {member.avatar_url ? (
                                                                <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 relative">
                                                                    <Image src={member.avatar_url} alt="" fill className="object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-400">
                                                                    {member.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                            )}
                                                            {member.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sprint</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all group">
                                                        <div className="flex items-center gap-2">
                                                            <Timer className="w-3.5 h-3.5 text-accent-indigo" />
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{currentSprint?.name || "Sem Sprint"}</span>
                                                        </div>
                                                        <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-[200px] bg-white dark:bg-[#141824] border-gray-100 dark:border-white/10 p-1 rounded-2xl shadow-2xl">
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdate({ sprint_id: null })}
                                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer text-gray-400"
                                                    >
                                                        Limpar Sprint
                                                    </DropdownMenuItem>
                                                    {sprints.map((s) => (
                                                        <DropdownMenuItem
                                                            key={s.id}
                                                            onClick={() => handleUpdate({ sprint_id: s.id })}
                                                            className={cn(
                                                                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all",
                                                                task.sprint_id === s.id
                                                                    ? "bg-accent-indigo/10 text-accent-indigo"
                                                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                                            )}
                                                        >
                                                            <Timer className="w-3.5 h-3.5" />
                                                            {s.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cronograma</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10 bg-[#F8F9FA]/50 dark:bg-white/5 w-fit cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                                        <Calendar className="w-4 h-4 text-accent-indigo" />
                                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                                            {task.start_date ? format(parseISO(task.start_date), "dd MMMM yyyy", { locale: pt }) : "Início"}
                                                            {" - "}
                                                            {task.due_date ? format(parseISO(task.due_date), "dd MMMM yyyy", { locale: pt }) : "Prazo"}
                                                        </span>
                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-2" />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                                                    <DateRangePicker
                                                        startDate={task.start_date ? parseISO(task.start_date) : undefined}
                                                        due_date={task.due_date ? parseISO(task.due_date) : undefined}
                                                        onSave={handleDateRangeSave}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                                <AlignLeft className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-lg font-black text-[#1E1B4B] dark:text-white">Descrição</h4>
                                        </div>
                                        {!isEditingDescription && (
                                            <Button
                                                onClick={() => setIsEditingDescription(true)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs font-bold text-accent-indigo hover:bg-accent-indigo/10 px-4 rounded-full"
                                            >
                                                Editar
                                            </Button>
                                        )}
                                    </div>

                                    {isEditingDescription ? (
                                        <div className="space-y-3">
                                            <Textarea
                                                value={tempDescription}
                                                onChange={(e) => setTempDescription(e.target.value)}
                                                placeholder="Descreva os detalhes desta tarefa..."
                                                className="min-h-[150px] p-4 rounded-2xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-indigo/50 transition-all resize-none font-inter"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    onClick={() => setIsEditingDescription(false)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-xs uppercase"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        handleUpdate({ description: tempDescription })
                                                        setIsEditingDescription(false)
                                                    }}
                                                    size="sm"
                                                    disabled={isLoading}
                                                    className="bg-accent-indigo hover:bg-accent-indigo/90 text-white px-6 rounded-full font-bold text-xs uppercase disabled:opacity-50"
                                                >
                                                    {isLoading ? "A guardar..." : "Guardar"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setIsEditingDescription(true)}
                                            className="min-h-[100px] p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-all whitespace-pre-wrap"
                                        >
                                            {task.description || "Nenhuma descrição adicionada..."}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Quick Stats or Sidebar */}
                            <div className="w-[280px] shrink-0 space-y-8">
                                <div className="p-6 rounded-3xl bg-accent-indigo shadow-2xl shadow-accent-indigo/20 text-white">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">Informações Rápidas</h5>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Status</p>
                                            <div className="flex items-center gap-2">
                                                {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                <span className="font-bold text-sm">{task.completed ? 'Concluída' : 'Em curso'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Prioridade</p>
                                            <div className="flex items-center gap-2">
                                                <Settings className="w-4 h-4" />
                                                <span className="font-bold text-sm uppercase">{task.priority || 'Média'}</span>
                                            </div>
                                        </div>
                                        {task.estimated_time && (
                                            <div>
                                                <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Estimativa</p>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-bold text-sm">{task.estimated_time / 60}h</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
