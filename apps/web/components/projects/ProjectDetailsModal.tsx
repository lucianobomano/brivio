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
    UserPlus,
    Tag,
    CheckSquare,
    Calendar,
    Paperclip,
    MapPin,
    Settings,
    ArrowRight,
    Image as ImageIcon,
    Folder,
    AlignLeft,
    Plus,
    ChevronDown,
    MessageSquare,
    Upload,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Project, Stage } from "./ProjectsClient"
import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import { updateProjectStage_v2, updateProjectTimeline, uploadProjectMedia, updateProjectTags, updateProjectDescription } from "@/app/actions/projects"
import { getProjectTasks, createProjectTask, toggleProjectTask } from "@/app/actions/project-tasks"
import { toast } from "sonner"
import { DateRangePicker } from "./DateRangePicker"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/components/CurrencyUtils"

interface ProjectDetailsModalProps {
    project: Project | null
    isOpen: boolean
    onClose: () => void
    stages: Stage[]
    onRefresh?: () => void
    onEdit?: (project: Project) => void
}

export function ProjectDetailsModal({ project, isOpen, onClose, stages, onRefresh, onEdit }: ProjectDetailsModalProps) {
    const { formatPrice } = useCurrency()
    const [checklist, setChecklist] = React.useState<{ id: string; title: string; completed: boolean }[]>([])

    const [activities, setActivities] = React.useState<{
        type: 'upload' | 'comment'
        userName: string
        userAvatar?: string
        fileName?: string
        description?: string
        text?: string
        date: Date
    }[]>([])
    const [currentUser, setCurrentUser] = React.useState<any>(null)
    const [selectedTags, setSelectedTags] = React.useState<string[]>([])
    const [isEditingDescription, setIsEditingDescription] = React.useState(false)
    const [tempDescription, setTempDescription] = React.useState("")

    React.useEffect(() => {
        if (project) {
            setSelectedTags(project.tags || [])
            setTempDescription(project.description || "")

            // Fetch tasks
            const fetchTasks = async () => {
                const tasks = await getProjectTasks(project.id)
                setChecklist(tasks)
            }
            fetchTasks()
        }
    }, [project])

    const handleTagToggle = async (tag: string) => {
        if (!project) return

        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag]

        setSelectedTags(newTags)
        const result = await updateProjectTags(project.id, newTags)
        if (result.success) {
            onRefresh?.()
        } else {
            toast.error("Erro ao atualizar etiquetas")
        }
    }

    React.useEffect(() => {
        const supabase = createClient()
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url')
                    .eq('id', user.id)
                    .single()
                setCurrentUser({ ...user, profile })
            }
        }
        fetchUser()
    }, [])

    if (!project) return null

    const currentStage = stages.find(s => s.id === project.stage_id)

    const toggleTask = async (id: string) => {
        const task = checklist.find(t => t.id === id)
        if (!task) return

        // Optimistic update
        setChecklist(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))

        const result = await toggleProjectTask(id, !task.completed)
        if (!result.success) {
            // Revert on failure
            setChecklist(prev => prev.map(t => t.id === id ? { ...t, completed: task.completed } : t))
            toast.error("Erro ao atualizar tarefa")
        }
    }

    const handleAddTask = async (task: { title: string; description?: string }) => {
        if (!project) return

        const result = await createProjectTask(project.id, task.title, task.description)
        if (result.success && result.task) {
            setChecklist(prev => [...prev, result.task as { id: string; title: string; completed: boolean }])
            toast.success("Tarefa adicionada")
        } else {
            toast.error(result.error || "Erro ao adicionar tarefa")
        }
    }

    const completedCount = checklist.filter(t => t.completed).length
    const progressPercent = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0

    const handleStageChange = async (stageId: string) => {
        if (!project) return

        try {
            const result = await updateProjectStage_v2(project.id, stageId, true)
            if (result.success) {
                toast.success("Etapa atualizada com sucesso")
                onRefresh?.()
            } else {
                toast.error("Erro ao atualizar etapa")
            }
        } catch (error) {
            console.error("Error updating stage:", error)
            toast.error("Erro de conexão ao atualizar etapa")
        }
    }

    const handleDateRangeSave = async (range: { start?: Date; end?: Date }) => {
        if (!project) return

        try {
            const result = await updateProjectTimeline(project.id, {
                start_date: range.start?.toISOString(),
                due_date: range.end?.toISOString()
            })

            if (result.success) {
                toast.success("Datas atualizadas com sucesso")
                onRefresh?.()
            } else {
                toast.error("Erro ao atualizar datas")
            }
        } catch (error) {
            console.error("Error updating dates:", error)
            toast.error("Erro de conexão ao atualizar datas")
        }
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
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(0, 0, 0, 0.5);
                    }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.5);
                    }
                `}</style>
                <div className="flex flex-col min-h-0 h-full relative font-[300]">

                    {/* Cover Section - 200px height */}
                    <div className="h-[200px] relative shrink-0">
                        <Image
                            src={project.cover_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"}
                            alt={project.name}
                            fill
                            className="object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-black/40" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                            {selectedTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                                    {selectedTags.map(tag => (
                                        <div
                                            key={tag}
                                            className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider"
                                        >
                                            {tag}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <h2 className="text-3xl font-black tracking-tight">{project.name}</h2>
                            <p className="text-[16px] font-[300] opacity-80 mt-1">{project.creator?.name || "Administrador"}</p>
                        </div>

                        {/* Close Button - Handled by Dialog but custom styled in image */}
                        <DialogClose className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                            <X className="w-4 h-4" />
                        </DialogClose>
                    </div>

                    <div className="bg-[#F8F9FA] dark:bg-[#141824] px-6 py-2 border-b border-gray-100 dark:border-white/5 flex justify-end shrink-0 gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[16px] font-[300] text-gray-500 dark:text-gray-400 gap-2 uppercase tracking-tight rounded-[8px]"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Editar capa
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[16px] font-[300] text-gray-500 dark:text-gray-400 gap-2 uppercase tracking-tight rounded-[8px]"
                            onClick={() => {
                                if (project) {
                                    onEdit?.(project)
                                    onClose()
                                }
                            }}
                        >
                            <Settings className="w-3.5 h-3.5" />
                            Editar projeto
                        </Button>
                    </div>

                    {/* Main Content Scrollable */}
                    <div className="flex-1 overflow-y-auto pt-10 px-10 pb-[60px] custom-scrollbar">
                        <div className="flex gap-10">

                            {/* Left Side: Details */}
                            <div className="flex-1 space-y-10">

                                {/* Header Info */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1]">
                                            <Folder className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[#1E1B4B] dark:text-white">{project.name}</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[16px] text-gray-400 dark:text-gray-500 font-[300]">Na etapa</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group">
                                                        <span className="text-[16px] font-[300] text-gray-700 dark:text-gray-300">{currentStage?.name || "Sem etapa"}</span>
                                                        <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-[180px] bg-white dark:bg-[#141824] border-gray-100 dark:border-white/10 p-1 rounded-[12px] shadow-xl">
                                                    {stages.map((stage) => (
                                                        <DropdownMenuItem
                                                            key={stage.id}
                                                            onClick={() => handleStageChange(stage.id)}
                                                            className={cn(
                                                                "flex items-center gap-2 px-3 py-2 rounded-[8px] text-[14px] font-[300] cursor-pointer transition-colors",
                                                                stage.id === project.stage_id
                                                                    ? "bg-[#6366F1]/10 text-[#6366F1] font-bold"
                                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                                            )}
                                                        >
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: stage.color }}
                                                            />
                                                            {stage.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Responsáveis</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gray-100 shadow-sm relative">
                                                        {project.creator?.avatar_url ? (
                                                            <Image src={project.creator.avatar_url} alt="" fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                                                                {project.creator?.name?.substring(0, 2) || "AD"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gray-200 shadow-sm flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-gray-500">+1</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 rounded-[8px] border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-300 dark:text-gray-600 hover:border-gray-400 dark:hover:border-white/20 hover:text-gray-500 transition-all font-[300]"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Datas</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-gray-100 dark:border-white/10 bg-[#F8F9FA]/50 dark:bg-white/5 w-fit cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                        <span className="text-[16px] font-[300] text-gray-600 dark:text-gray-400">
                                                            {project.start_date ? format(parseISO(project.start_date), "dd MMMM yyyy", { locale: pt }) : "Data início"}
                                                            {" - "}
                                                            {project.due_date ? format(parseISO(project.due_date), "dd MMMM yyyy", { locale: pt }) : "Data final"}
                                                        </span>
                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-2" />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                                                    <DateRangePicker
                                                        startDate={project.start_date ? parseISO(project.start_date) : undefined}
                                                        due_date={project.due_date ? parseISO(project.due_date) : undefined}
                                                        onSave={handleDateRangeSave}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>

                                {/* Description Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1]">
                                                <AlignLeft className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-lg font-black text-[#1E1B4B] dark:text-white">Descrição</h4>
                                        </div>
                                        {!isEditingDescription && (
                                            <Button
                                                onClick={() => {
                                                    setTempDescription(project.description || "")
                                                    setIsEditingDescription(true)
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-[16px] font-[300] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 rounded-[8px]"
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
                                                placeholder="Descreva os objetivos e detalhes deste projeto..."
                                                className="min-h-[150px] p-4 rounded-[8px] border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[16px] font-[300] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff0054]/50 transition-all resize-none font-inter"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    onClick={() => setIsEditingDescription(false)}
                                                    variant="ghost"
                                                    className="h-9 px-4 rounded-[8px] text-[14px] font-[300] text-gray-500"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={async () => {
                                                        const result = await updateProjectDescription(project.id, tempDescription)
                                                        if (result.success) {
                                                            setIsEditingDescription(false)
                                                            onRefresh?.()
                                                            toast.success("Descrição atualizada")
                                                        } else {
                                                            toast.error("Erro ao salvar")
                                                        }
                                                    }}
                                                    className="h-9 px-6 bg-[#ff0054] hover:bg-[#e6004c] text-white rounded-[8px] font-bold text-[14px]"
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[16px] text-gray-500 dark:text-gray-400 leading-relaxed font-[300]">
                                            {project.description || "Nenhuma descrição adicionada ao projeto. Clique em editar para adicionar os detalhes e objetivos deste trabalho."}
                                        </p>
                                    )}
                                </div>

                                {/* Budget Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-lg font-black text-[#1E1B4B] dark:text-white">Orçamento</h4>
                                    </div>
                                    {project.budget_amount ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Tipo</span>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200 capitalize">{project.budget_type?.replace('_', ' ') || 'Não definido'}</span>
                                            </div>
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Valor</span>
                                                <span className="text-sm font-bold text-[#6366F1]">{formatPrice(project.budget_amount)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[16px] text-gray-500 dark:text-gray-400 leading-relaxed font-[300]">
                                            Nenhum detalhe de orçamento foi adicionado a este projeto.
                                        </p>
                                    )}
                                </div>

                                {/* Tasks / Checklist Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-lg font-black text-[#1E1B4B] dark:text-white">Checklist</h4>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[16px] font-[300] text-gray-400 dark:text-gray-600">{completedCount}/{checklist.length}</span>
                                            <TaskCreationPopover onAddTask={handleAddTask}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-[8px] bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </TaskCreationPopover>
                                        </div>
                                    </div>

                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#10B981] transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        {checklist.map((task) => (
                                            <div
                                                key={task.id}
                                                className="flex items-center gap-4 group p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-[8px] transition-colors cursor-pointer"
                                                onClick={() => toggleTask(task.id)}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                                    task.completed ? "bg-[#10B981] border-[#10B981]" : "border-gray-200 dark:border-white/10 bg-white dark:bg-transparent"
                                                )}>
                                                    {task.completed && <Plus className="w-3 h-3 text-white rotate-45" />}
                                                </div>
                                                <span className={cn(
                                                    "text-[16px] font-[300] flex-1",
                                                    task.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-200"
                                                )}>
                                                    {task.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actividade Section */}
                                <div className="space-y-6 pt-12 border-t border-gray-100 dark:border-white/10 mt-12 pb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#6366F1]/15 flex items-center justify-center text-[#6366F1]">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xl font-black text-[#1E1B4B] dark:text-white uppercase tracking-tight">Actividade</h4>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-400 overflow-hidden relative">
                                            {currentUser?.profile?.avatar_url ? (
                                                <Image src={currentUser.profile.avatar_url} alt="" fill className="object-cover" />
                                            ) : (
                                                <span>{currentUser?.profile?.name?.substring(0, 2).toUpperCase() || "AD"}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="relative">
                                                <textarea
                                                    placeholder="Escreva um comentário..."
                                                    className="w-full min-h-[100px] p-4 rounded-[8px] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[16px] font-[300] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 transition-all resize-none font-inter"
                                                />
                                            </div>
                                            <Button className="h-10 bg-[#ff0054] hover:bg-[#e6004c] text-white rounded-[8px] font-bold text-sm px-6">
                                                Comentar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-6">
                                        {activities.map((activity, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-400 overflow-hidden relative">
                                                    {activity.userAvatar ? (
                                                        <Image src={activity.userAvatar} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <span>{activity.userName?.substring(0, 2).toUpperCase() || "AD"}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{activity.userName}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{format(activity.date, "HH:mm")}</span>
                                                    </div>
                                                    <div className="bg-gray-50/50 dark:bg-white/5 rounded-[12px] p-4 border border-gray-100 dark:border-white/10">
                                                        <p className="text-[16px] font-[300] text-gray-600 dark:text-gray-400">
                                                            {activity.type === 'upload' ? (
                                                                <span>
                                                                    carregou o arquivo <span className="font-bold text-[#6366F1]">{activity.fileName}</span>
                                                                    {activity.description && <span className="block mt-2 text-sm italic">&quot;{activity.description}&quot;</span>}
                                                                </span>
                                                            ) : (
                                                                activity.text
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Sidebar Actions */}
                            <div className="w-[200px] flex flex-col gap-2 shrink-0">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-3">Ações</span>

                                {[
                                    { icon: UserPlus, label: "Atribuir" },
                                    { icon: Tag, label: "Etiquetas", special: "labels" },
                                    { icon: CheckSquare, label: "Tarefa", special: "task" },
                                    { icon: Calendar, label: "Datas" },
                                    { icon: Paperclip, label: "Anexo", special: "upload" },
                                    { icon: MapPin, label: "Local" },
                                    { icon: Settings, label: "Campos p." }
                                ].map((action, i) => (
                                    action.special === "upload" ? (
                                        <FileAttachmentPopover key={i} onUpload={(data) => {
                                            setActivities(prev => [{
                                                type: 'upload',
                                                userName: currentUser?.profile?.name || "Você",
                                                userAvatar: currentUser?.profile?.avatar_url,
                                                fileName: data.name,
                                                description: data.description,
                                                date: new Date()
                                            }, ...prev])
                                        }}>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start gap-4 px-4 h-11 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 rounded-[8px] font-[300] text-[16px]"
                                            >
                                                <action.icon className="w-4 h-4 shrink-0" />
                                                {action.label}
                                            </Button>
                                        </FileAttachmentPopover>
                                    ) : action.special === "task" ? (
                                        <TaskCreationPopover key={i} onAddTask={handleAddTask}>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start gap-4 px-4 h-11 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 rounded-[8px] font-[300] text-[16px]"
                                            >
                                                <action.icon className="w-4 h-4 shrink-0" />
                                                {action.label}
                                            </Button>
                                        </TaskCreationPopover>
                                    ) : action.special === "labels" ? (
                                        <LabelsPopover
                                            key={i}
                                            selectedTags={selectedTags}
                                            onToggleTag={handleTagToggle}
                                        >
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start gap-4 px-4 h-11 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 rounded-[8px] font-[300] text-[16px]"
                                            >
                                                <action.icon className="w-4 h-4 shrink-0" />
                                                {action.label}
                                            </Button>
                                        </LabelsPopover>
                                    ) : (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            className="w-full justify-start gap-4 px-4 h-11 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:border-white/10 text-gray-600 dark:text-gray-400 rounded-[8px] font-[300] text-[16px]"
                                        >
                                            <action.icon className="w-4 h-4 shrink-0" />
                                            {action.label}
                                        </Button>
                                    )
                                ))}

                                <div className="mt-auto pt-6">
                                    <Button className="w-full h-12 bg-[#ff0054] hover:bg-[#e6004c] text-white rounded-[8px] font-black text-[16px] uppercase tracking-tight gap-2 shadow-lg shadow-[#ff0054]/20">
                                        Mais detalhes
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function FileAttachmentPopover({ children, onUpload }: { children: React.ReactNode, onUpload: (data: { name: string, description: string, url: string }) => void }) {
    const [file, setFile] = React.useState<File | null>(null)
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [isUploading, setIsUploading] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)

    const handleUpload = async () => {
        if (!file || !name) {
            toast.error("Selecione um arquivo e dê um nome")
            return
        }

        setIsUploading(true)
        try {
            const result = await uploadProjectMedia(file)
            if (result.success && result.url) {
                onUpload({ name, description, url: result.url })
                toast.success("Arquivo anexado com sucesso")
                setFile(null)
                setName("")
                setDescription("")
                setIsOpen(false)
            } else {
                toast.error("Erro ao carregar arquivo")
            }
        } catch {
            toast.error("Erro na conexão")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] p-6 bg-white dark:bg-[#141824] border-gray-100 dark:border-white/10 rounded-[16px] shadow-2xl space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[12px] p-8 hover:border-[#6366F1]/50 transition-colors relative cursor-pointer group">
                    <input
                        type="file"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) {
                                setFile(f)
                                if (!name) setName(f.name)
                            }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-gray-300 group-hover:text-[#6366F1] transition-colors mb-2" />
                    <span className="text-[12px] font-bold text-gray-400 text-center uppercase tracking-widest">
                        {file ? file.name : "Clique para carregar"}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do arquivo</span>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Contrato assinado..."
                            className="h-10 rounded-[8px] bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 font-[300]"
                        />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</span>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Adicione uma breve descrição..."
                            className="min-h-[80px] rounded-[8px] bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 font-[300] resize-none"
                        />
                    </div>
                </div>

                <Button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="w-full h-11 bg-[#ff0054] hover:bg-[#e6004c] text-white rounded-[8px] font-bold uppercase text-xs tracking-widest shadow-lg shadow-[#ff0054]/10"
                >
                    {isUploading ? "Carregando..." : "Anexar Arquivo"}
                </Button>
            </PopoverContent>
        </Popover>
    )
}

function TaskCreationPopover({ children, onAddTask }: { children: React.ReactNode, onAddTask: (task: { title: string, description?: string }) => void }) {
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)

    const handleCreate = () => {
        if (!title.trim()) {
            toast.error("A tarefa precisa de um título")
            return
        }
        onAddTask({ title, description })
        setTitle("")
        setDescription("")
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[300px] p-6 bg-white dark:bg-[#141824] border-gray-100 dark:border-white/10 rounded-[16px] shadow-2xl space-y-4">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nova tarefa</span>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="O que precisa ser feito?"
                            className="h-11 rounded-[8px] bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 font-[300]"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição (opcional)</span>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Adicione detalhes..."
                            className="min-h-[80px] rounded-[8px] bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 font-[300] resize-none"
                        />
                    </div>
                </div>

                <Button
                    onClick={handleCreate}
                    className="w-full h-11 bg-[#ff0054] hover:bg-[#e6004c] text-white rounded-[8px] font-bold uppercase text-xs tracking-widest shadow-lg shadow-[#ff0054]/10"
                >
                    Criar Tarefa
                </Button>
            </PopoverContent>
        </Popover>
    )
}

const AVAILABLE_LABELS = [
    { name: "Prioridade Alta", color: "#EF4444" },
    { name: "Urgente", color: "#F59E0B" },
    { name: "Aguardando Cliente", color: "#3B82F6" },
    { name: "Criativo", color: "#8B5CF6" },
    { name: "Financeiro", color: "#10B981" },
    { name: "Produção", color: "#6366F1" }
]

function LabelsPopover({ children, selectedTags, onToggleTag }: { children: React.ReactNode, selectedTags: string[], onToggleTag: (tag: string) => void }) {
    const [search, setSearch] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)

    const filteredLabels = search.trim() === ""
        ? AVAILABLE_LABELS
        : AVAILABLE_LABELS.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[280px] p-4 bg-white dark:bg-[#141824] border-gray-100 dark:border-white/10 rounded-[16px] shadow-2xl space-y-4">
                <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Etiquetas</span>
                    <Input
                        placeholder="Procurar etiquetas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 rounded-[8px] bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 font-[300]"
                    />
                </div>

                <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredLabels.map((label) => {
                        const isSelected = selectedTags.includes(label.name)
                        return (
                            <div
                                key={label.name}
                                onClick={() => onToggleTag(label.name)}
                                className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-[8px] cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5 group",
                                    isSelected && "bg-[#6366F1]/5"
                                )}
                            >
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: label.color }}
                                />
                                <span className={cn(
                                    "text-[14px] font-[300] flex-1",
                                    isSelected ? "text-[#6366F1] font-bold" : "text-gray-600 dark:text-gray-400"
                                )}>
                                    {label.name}
                                </span>
                                {isSelected && <Plus className="w-3.5 h-3.5 text-[#6366F1] rotate-45" />}
                            </div>
                        )
                    })}

                    {search.trim() !== "" && !filteredLabels.find(l => l.name.toLowerCase() === search.toLowerCase()) && (
                        <div
                            onClick={() => {
                                onToggleTag(search)
                                setSearch("")
                            }}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 text-[#6366F1]"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-[14px] font-bold">Criar &quot;{search}&quot;</span>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
