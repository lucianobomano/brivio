"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle2,
    Circle,
    Plus,
    MoreHorizontal,
    Share2,
    ExternalLink,
    Clock,
    Target,
    Layout,
    GripVertical,
    Sparkles,
    Rows3,
    Columns3,
    Palette,
    Edit3,
    ArrowRight,
    Check,
    Trash2,
    ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import Link from "next/link"
import {
    createRoadmapStage,
    deleteRoadmapStage,
    updateRoadmapStage,
    reorderRoadmapStages,
    applyRoadmapTemplate,
    advanceProjectStage,
    createRoadmapTask,
    toggleRoadmapTask,
    deleteRoadmapTask,
    updateRoadmapTask,
    RoadmapStage
} from "@/app/actions/roadmap"
import { ROADMAP_TEMPLATES } from "@/lib/roadmap-templates"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ProjectBase {
    id: string
    name: string
    workspace_id?: string
}

interface RoadmapClientProps {
    initialProjects: ProjectBase[]
    initialRoadmap: RoadmapStage[]
    selectedProjectId: string | null
    selectedProject: ProjectBase | null
}

export function RoadmapClient({
    initialProjects,
    initialRoadmap,
    selectedProjectId,
    selectedProject
}: RoadmapClientProps) {
    const [roadmap, setRoadmap] = React.useState<RoadmapStage[]>(initialRoadmap)
    const [isLoading, setIsLoading] = React.useState(false)
    const [currentSelectedProject, setCurrentSelectedProject] = React.useState(selectedProject)

    // Sync state with props when project changes
    React.useEffect(() => {
        setRoadmap(initialRoadmap)
        setCurrentSelectedProject(selectedProject)
    }, [initialRoadmap, selectedProject, selectedProjectId])

    const [isStageModalOpen, setIsStageModalOpen] = React.useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false)
    const [isLayoutModalOpen, setIsLayoutModalOpen] = React.useState(false)
    const [editingStage, setEditingStage] = React.useState<RoadmapStage | null>(null)
    const [newStageName, setNewStageName] = React.useState("")
    const [newStageColor, setNewStageColor] = React.useState("#ff0054")
    const [viewMode, setViewMode] = React.useState<'vertical' | 'horizontal'>('vertical')
    const [layoutStyle, setLayoutStyle] = React.useState<'default' | 'numbered' | 'minimal' | 'cards' | 'timeline'>('numbered')
    const [editingTask, setEditingTask] = React.useState<{ id: string, title: string, stageId: string } | null>(null)
    const [newTaskTitle, setNewTaskTitle] = React.useState("")
    const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false)
    const [taskStageId, setTaskStageId] = React.useState<string | null>(null)

    // Custom cursor and auto-scroll state for numbered circles
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const [cursorPosition, setCursorPosition] = React.useState<{ x: number; y: number } | null>(null)
    const [scrollDirection, setScrollDirection] = React.useState<'left' | 'right' | null>(null)
    const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

    // Handle mouse move for custom cursor and auto-scroll
    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = scrollContainerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const x = e.clientX
        const edgeThreshold = 150

        setCursorPosition({ x: e.clientX, y: e.clientY })

        if (x < rect.left + edgeThreshold) {
            setScrollDirection('left')
        } else if (x > rect.right - edgeThreshold) {
            setScrollDirection('right')
        } else {
            setScrollDirection(null)
        }
    }, [])

    // Auto-scroll effect
    React.useEffect(() => {
        if (scrollDirection && scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const scrollSpeed = 8

            scrollIntervalRef.current = setInterval(() => {
                if (scrollDirection === 'left') {
                    container.scrollLeft -= scrollSpeed
                } else {
                    container.scrollLeft += scrollSpeed
                }
            }, 16)
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current)
            }
        }
    }, [scrollDirection])

    const handleMouseLeave = () => {
        setCursorPosition(null)
        setScrollDirection(null)
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Calculate overall project progress
    const totalTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.length, 0)
    const completedTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.filter(t => t.completed).length, 0)
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const currentStage = roadmap.find(s => s.progress < 100) || roadmap[roadmap.length - 1]

    const handleGenerateLink = () => {
        if (!selectedProjectId) return
        const link = `${window.location.origin}/share/${selectedProjectId}/roadmap`
        navigator.clipboard.writeText(link)
        toast.success("Link do cliente copiado!", {
            description: "Você já pode enviar este link para o seu cliente."
        })
    }

    const handleSaveStage = async () => {
        if (!selectedProject?.workspace_id || !newStageName.trim()) return

        setIsLoading(true)
        try {
            if (editingStage) {
                const result = await updateRoadmapStage(editingStage.id, newStageName, newStageColor)
                if (result.success) {
                    toast.success("Fase atualizada!")
                    setRoadmap(prev => prev.map(s => s.id === editingStage.id ? { ...s, name: newStageName, color: newStageColor } : s))
                } else {
                    toast.error("Erro ao atualizar fase")
                }
            } else {
                const result = await createRoadmapStage(selectedProject.workspace_id, newStageName, newStageColor)
                if (result.success) {
                    toast.success("Fase criada com sucesso!")
                    window.location.reload()
                } else {
                    toast.error("Erro ao criar fase")
                }
            }
        } catch {
            toast.error("Erro inesperado")
        } finally {
            setIsLoading(false)
            setIsStageModalOpen(false)
            setEditingStage(null)
            setNewStageName("")
        }
    }

    const handleDeleteStage = async (stageId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta fase? As tarefas serão desvinculadas.")) return

        setIsLoading(true)
        try {
            const result = await deleteRoadmapStage(stageId)
            if (result.success) {
                toast.success("Fase excluída!")
                setRoadmap(prev => prev.filter(s => s.id !== stageId))
            } else {
                toast.error("Erro ao excluir fase")
            }
        } catch {
            toast.error("Erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleTask = async (taskId: string, stageId: string) => {
        if (!selectedProjectId) return

        try {
            const result = await toggleRoadmapTask(taskId, selectedProjectId)
            if (result.success) {
                // Update local state
                setRoadmap(prev => prev.map(stage => {
                    if (stage.id === stageId) {
                        const updatedTasks = stage.tasks.map(t =>
                            t.id === taskId ? { ...t, completed: result.completed ?? false } : t
                        )
                        const completedCount = updatedTasks.filter(t => t.completed).length
                        const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0
                        return { ...stage, tasks: updatedTasks, progress }
                    }
                    return stage
                }))

                // Check for stage progression
                if (result.completed) {
                    const advanceResult = await advanceProjectStage(selectedProjectId)
                    if (advanceResult.success) {
                        toast.success(`Parabéns! Projecto avançou para: ${advanceResult.nextStageName}`, {
                            icon: "🚀"
                        })
                        // Optional: reload or fetch fresh data
                    }
                }
            }
        } catch (err) {
            toast.error("Erro ao atualizar tarefa")
        }
    }

    const handleAddTask = async (stageId: string) => {
        if (!selectedProjectId || !newTaskTitle.trim()) return

        setIsLoading(true)
        try {
            const result = await createRoadmapTask(selectedProjectId, stageId, newTaskTitle)
            if (result.success && result.task) {
                toast.success("Tarefa adicionada!")
                setRoadmap(prev => prev.map(stage => {
                    if (stage.id === stageId) {
                        const updatedTasks = [...stage.tasks, {
                            id: result.task.id,
                            title: result.task.title,
                            status: result.task.status,
                            completed: result.task.completed
                        }]
                        const completedCount = updatedTasks.filter(t => t.completed).length
                        const progress = Math.round((completedCount / updatedTasks.length) * 100)
                        return { ...stage, tasks: updatedTasks, progress }
                    }
                    return stage
                }))
                setIsTaskModalOpen(false)
                setNewTaskTitle("")
                setTaskStageId(null)
            }
        } catch {
            toast.error("Erro ao criar tarefa")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteTask = async (taskId: string, stageId: string) => {
        if (!selectedProjectId || !confirm("Eliminar esta tarefa?")) return

        try {
            const result = await deleteRoadmapTask(taskId, selectedProjectId)
            if (result.success) {
                toast.success("Tarefa eliminada")
                setRoadmap(prev => prev.map(stage => {
                    if (stage.id === stageId) {
                        const updatedTasks = stage.tasks.filter(t => t.id !== taskId)
                        const completedCount = updatedTasks.filter(t => t.completed).length
                        const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0
                        return { ...stage, tasks: updatedTasks, progress }
                    }
                    return stage
                }))
            }
        } catch {
            toast.error("Erro ao eliminar")
        }
    }

    const handleEditTask = async () => {
        if (!selectedProjectId || !editingTask || !newTaskTitle.trim()) return

        setIsLoading(true)
        try {
            const result = await updateRoadmapTask(editingTask.id, newTaskTitle, selectedProjectId)
            if (result.success) {
                toast.success("Tarefa atualizada")
                setRoadmap(prev => prev.map(stage => {
                    if (stage.id === editingTask.stageId) {
                        return {
                            ...stage,
                            tasks: stage.tasks.map(t => t.id === editingTask.id ? { ...t, title: newTaskTitle } : t)
                        }
                    }
                    return stage
                }))
                setEditingTask(null)
                setIsTaskModalOpen(false)
                setNewTaskTitle("")
            }
        } catch {
            toast.error("Erro ao atualizar")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setRoadmap((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)

                const newRoadmap = arrayMove(items, oldIndex, newIndex)

                // Persist new ordering
                const updates = newRoadmap.map((stage, index) => ({
                    id: stage.id,
                    position: index * 1000
                }))

                reorderRoadmapStages(updates).then(res => {
                    if (!res.success) toast.error("Erro ao salvar nova ordem")
                })

                return newRoadmap
            })
        }
    }

    const handleApplyTemplate = async (templateId: string) => {
        if (!selectedProject?.workspace_id) return

        setIsLoading(true)
        try {
            const result = await applyRoadmapTemplate(selectedProject.workspace_id, templateId)
            if (result.success) {
                toast.success("Template aplicado com sucesso!")
                setIsTemplateModalOpen(false)
                window.location.reload()
            } else {
                toast.error(result.error || "Erro ao aplicar template")
            }
        } catch {
            toast.error("Erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center">
                            <Target className="w-5 h-5 text-accent-indigo" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                            Roadmap do Projeto
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="bg-bg-1 border-bg-3 rounded-xl hover:bg-bg-2 flex items-center gap-2 px-4 shadow-sm border-2 h-11">
                                    <div className="w-2 h-2 rounded-full bg-[#FF0055]" />
                                    <span className="truncate font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">
                                        {currentSelectedProject?.name || "Selecionar Projeto"}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white dark:bg-[#1A1B23] border border-gray-100 dark:border-white/10 rounded-xl min-w-[260px] p-2 shadow-2xl z-[110]">
                                <div className="px-3 py-2 border-b border-gray-50 dark:border-white/5 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Meus Projectos</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar pt-1">
                                    {initialProjects.map(p => (
                                        <DropdownMenuItem
                                            key={p.id}
                                            asChild
                                            className={cn(
                                                "rounded-lg px-3 py-2.5 cursor-pointer transition-all mb-1 outline-none",
                                                selectedProjectId === p.id
                                                    ? "bg-[#FF0055] text-white font-black shadow-lg shadow-[#FF0055]/20"
                                                    : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                                            )}
                                        >
                                            <Link
                                                href={`/roadmap?projectId=${p.id}`}
                                                onClick={() => {
                                                    setCurrentSelectedProject(p as ProjectBase)
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="truncate text-xs font-bold uppercase tracking-tight">{p.name}</span>
                                                    {selectedProjectId === p.id && <Check className="w-4 h-4 ml-2" />}
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {selectedProject && (
                            <>
                                <div className="px-3 py-1 bg-bg-2 rounded-full border border-bg-3">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                                        {overallProgress}% Concluído
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditingStage(null)
                                        setNewStageName("")
                                        setIsStageModalOpen(true)
                                    }}
                                    className="text-accent-indigo hover:text-accent-indigo/80 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    <Plus className="w-3 h-3 mr-1.5" />
                                    Nova Fase
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    className="text-accent-mint hover:text-accent-mint/80 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                    Templates
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsLayoutModalOpen(true)}
                                    className="text-amber-500 hover:text-amber-400 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    <Palette className="w-3 h-3 mr-1.5" />
                                    Layout
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-bg-2 rounded-xl border border-bg-3 p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('vertical')}
                            className={cn(
                                "h-9 px-3 rounded-lg",
                                viewMode === 'vertical'
                                    ? "bg-bg-1 shadow-sm text-text-primary"
                                    : "text-text-tertiary hover:text-text-primary"
                            )}
                        >
                            <Rows3 className="w-4 h-4 mr-1.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Vertical</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('horizontal')}
                            className={cn(
                                "h-9 px-3 rounded-lg",
                                viewMode === 'horizontal'
                                    ? "bg-bg-1 shadow-sm text-text-primary"
                                    : "text-text-tertiary hover:text-text-primary"
                            )}
                        >
                            <Columns3 className="w-4 h-4 mr-1.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Horizontal</span>
                        </Button>
                    </div>

                    <Button
                        onClick={handleGenerateLink}
                        className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl shadow-lg shadow-accent-indigo/20 font-bold uppercase text-[11px] tracking-widest h-11 px-6"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Gerar Link de Cliente
                    </Button>
                    <Button
                        variant="outline"
                        asChild
                        className="bg-bg-1 border-bg-3 rounded-xl hover:bg-bg-2 h-11 px-6 font-bold uppercase text-[11px] tracking-widest"
                    >
                        <Link href={`/share/${selectedProjectId}/roadmap`} target="_blank">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visualizar
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Overall Progress Banner */}
            {selectedProject && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 p-8 bg-bg-1 border border-bg-3 rounded-[24px] overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-indigo/5 blur-[100px] -mr-32 -mt-32 rounded-full" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Status Global</h3>
                                    <p className="text-xl font-bold text-text-primary">
                                        {currentStage ? `Fase Atual: ${currentStage.name}` : "Projeto Concluído"}
                                    </p>
                                </div>
                                <span className="text-2xl font-black text-accent-indigo">{overallProgress}%</span>
                            </div>
                            <div className="h-3 bg-bg-2 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallProgress}%` }}
                                    className="h-full bg-accent-indigo"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-bg-2 border border-bg-3 rounded-2xl">
                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Tarefas</p>
                                <p className="text-lg font-bold text-text-primary">{completedTasks} / {totalTasks}</p>
                            </div>
                            <div className="p-4 bg-bg-2 border border-bg-3 rounded-2xl">
                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Fases</p>
                                <p className="text-lg font-bold text-text-primary">{roadmap.filter(s => s.progress === 100).length} / {roadmap.length}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Roadmap Views */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Default Layout (Vertical/Horizontal based on viewMode) */}
                {layoutStyle === 'default' && viewMode === 'vertical' && (
                    <div className="relative pl-8 md:pl-24 space-y-12 pb-24">
                        <div className="absolute left-[39px] md:left-[103px] top-4 bottom-0 w-[2px] bg-bg-3" />
                        <SortableContext items={roadmap.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {roadmap.map((stage, idx) => (
                                <SortableStageItem
                                    key={stage.id}
                                    stage={stage}
                                    idx={idx}
                                    onEdit={() => {
                                        setEditingStage(stage)
                                        setNewStageName(stage.name)
                                        setNewStageColor(stage.color)
                                        setIsStageModalOpen(true)
                                    }}
                                    onDelete={() => handleDeleteStage(stage.id)}
                                    onToggleTask={handleToggleTask}
                                    onAddTask={(stageId) => {
                                        setTaskStageId(stageId)
                                        setEditingTask(null)
                                        setNewTaskTitle("")
                                        setIsTaskModalOpen(true)
                                    }}
                                    onEditTask={(task) => {
                                        setEditingTask(task)
                                        setNewTaskTitle(task.title)
                                        setIsTaskModalOpen(true)
                                    }}
                                    onDeleteTask={handleDeleteTask}
                                />
                            ))}
                        </SortableContext>
                    </div>
                )}

                {layoutStyle === 'default' && viewMode === 'horizontal' && (
                    <div className="pb-24">
                        <div className="flex gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
                            {roadmap.map((stage, idx) => (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex-shrink-0 w-[320px]"
                                >
                                    <div className="p-4 bg-bg-1 border border-bg-3 rounded-t-2xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                                                <h3 className="text-[15px] font-bold text-text-primary">{stage.name}</h3>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-bg-1 border-bg-3 rounded-xl">
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditingStage(stage)
                                                        setNewStageName(stage.name)
                                                        setNewStageColor(stage.color)
                                                        setIsStageModalOpen(true)
                                                    }}>Editar Fase</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-error" onClick={() => handleDeleteStage(stage.id)}>Excluir Fase</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent-indigo transition-all duration-500" style={{ width: `${stage.progress}%` }} />
                                        </div>
                                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-2">
                                            {stage.progress}% • {stage.tasks.filter(t => t.completed).length}/{stage.tasks.length} tarefas
                                        </p>
                                    </div>
                                    <div className="bg-bg-2/50 border border-t-0 border-bg-3 rounded-b-2xl p-3 min-h-[200px] max-h-[400px] overflow-y-auto space-y-2">
                                        {stage.tasks.length > 0 ? stage.tasks.map(task => (
                                            <div key={task.id} className="p-3 bg-bg-1 border border-bg-3 rounded-xl hover:border-accent-indigo/30 transition-all">
                                                <div className="flex items-center gap-2">
                                                    {task.completed ? <CheckCircle2 className="w-4 h-4 text-accent-indigo flex-shrink-0" /> : <Circle className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
                                                    <span className={cn("text-[13px] font-medium", task.completed ? "text-text-tertiary line-through" : "text-text-primary")}>{task.title}</span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center h-[160px] text-center">
                                                <p className="text-[12px] text-text-tertiary italic mb-2">Sem tarefas</p>
                                                <Button variant="outline" size="sm" className="bg-bg-1 border-bg-3 rounded-lg h-8 text-[10px] font-bold uppercase tracking-widest">
                                                    <Plus className="w-3 h-3 mr-1" />Adicionar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Numbered Circles Layout - Horizontal Single Line */}
                {layoutStyle === 'numbered' && (
                    <div className="relative pb-[300px] -mx-6" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
                        {/* Custom Cursor */}
                        <AnimatePresence>
                            {scrollDirection && cursorPosition && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="fixed z-[100] pointer-events-none flex items-center justify-center"
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        left: cursorPosition.x - 40,
                                        top: cursorPosition.y - 40,
                                        borderRadius: '50%',
                                        background: 'rgba(79, 70, 229, 0.9)',
                                        backdropFilter: 'blur(8px)',
                                        boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)',
                                    }}
                                >
                                    {scrollDirection === 'left' ? (
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 18l-6-6 6-6" />
                                        </svg>
                                    ) : (
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scrollable Container - Hidden Scrollbar */}
                        <div
                            ref={scrollContainerRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="overflow-x-auto overflow-y-visible px-6"
                            style={{
                                cursor: scrollDirection ? 'none' : 'default',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                        >
                            <style jsx>{`
                                div::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>

                            <div className="relative min-w-max flex items-center justify-start py-8 px-[100px]" style={{ gap: '250px' }}>
                                {/* Connecting Line */}
                                <div
                                    className="absolute h-[4px] bg-gradient-to-r from-accent-indigo via-bg-3 to-bg-3 z-0"
                                    style={{
                                        left: '100px',
                                        right: '100px',
                                        top: 'calc(50% - 35px)',
                                    }}
                                />

                                {/* Animated progress line */}
                                <motion.div
                                    className="absolute h-[4px] bg-gradient-to-r from-accent-indigo to-accent-mint z-0"
                                    style={{
                                        left: '100px',
                                        top: 'calc(50% - 35px)',
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(roadmap.filter(s => s.progress === 100).length / roadmap.length) * 100}%`
                                    }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />

                                {roadmap.map((stage, idx) => (
                                    <Popover key={stage.id}>
                                        <PopoverTrigger asChild>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.15 }}
                                                className="flex flex-col items-center cursor-pointer group relative z-10"
                                            >
                                                {/* Large Number Circle with Progress Bar */}
                                                <motion.div
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={cn(
                                                        "w-[200px] h-[200px] rounded-full flex items-center justify-center relative transition-all duration-500 z-10",
                                                        stage.progress === 100
                                                            ? "bg-accent-indigo shadow-2xl shadow-accent-indigo/40 border-none"
                                                            : "bg-bg-0 shadow-xl border-none"
                                                    )}
                                                >
                                                    {/* Progress Ring for stages in progress */}
                                                    {stage.progress < 100 && (
                                                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible">
                                                            {/* Track Circle (Replaces static border) */}
                                                            <circle
                                                                cx="100" cy="100" r="97"
                                                                fill="none"
                                                                stroke="var(--color-bg-3)"
                                                                strokeWidth="6"
                                                            />
                                                            {/* Progress Circle */}
                                                            <circle
                                                                cx="100" cy="100" r="97"
                                                                fill="none"
                                                                stroke="var(--color-accent-indigo)"
                                                                strokeWidth="6"
                                                                strokeDasharray={`${(stage.progress / 100) * 610} 610`}
                                                                strokeLinecap="round"
                                                                className="transition-all duration-1000"
                                                            />
                                                        </svg>
                                                    )}

                                                    <span className={cn(
                                                        "text-[80px] font-black leading-none transition-colors duration-500",
                                                        stage.progress === 100 ? "text-white" : "text-text-primary"
                                                    )}>
                                                        {idx + 1}
                                                    </span>

                                                </motion.div>

                                                {/* Phase Name */}
                                                <h3 className="mt-6 text-[18px] font-bold text-text-primary text-center max-w-[200px] group-hover:text-accent-indigo transition-colors">
                                                    {stage.name}
                                                </h3>

                                                {/* Stats */}
                                                <div className="mt-2 flex items-center gap-3 text-[13px] text-text-tertiary">
                                                    <span>{stage.tasks.length} tarefas</span>
                                                    <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                                                    <span className={cn(
                                                        "font-bold",
                                                        stage.progress === 100 ? "text-accent-mint" : stage.progress > 0 ? "text-accent-indigo" : ""
                                                    )}>{stage.progress}%</span>
                                                </div>
                                            </motion.div>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-[350px] p-0 bg-bg-1 border-bg-3 rounded-2xl shadow-2xl overflow-visible" sideOffset={50}>
                                            {/* Triangular Pin - White */}
                                            <div
                                                className="absolute -bottom-[16px] left-1/2 -translate-x-1/2 w-0 h-0"
                                                style={{
                                                    borderLeft: '12px solid transparent',
                                                    borderRight: '12px solid transparent',
                                                    borderTop: '16px solid var(--bg-1, #ffffff)',
                                                }}
                                            />

                                            <div className="p-5 border-b border-bg-3">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }} />
                                                        <h4 className="text-[16px] font-bold text-text-primary">{stage.name}</h4>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        setEditingStage(stage)
                                                        setNewStageName(stage.name)
                                                        setNewStageColor(stage.color)
                                                        setIsStageModalOpen(true)
                                                    }}>
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 text-center">
                                                    <div className="p-2 bg-bg-2 rounded-xl">
                                                        <p className="text-[18px] font-bold text-text-primary">{stage.tasks.length}</p>
                                                        <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Tarefas</p>
                                                    </div>
                                                    <div className="p-2 bg-bg-2 rounded-xl">
                                                        <p className="text-[18px] font-bold text-accent-indigo">{stage.progress}%</p>
                                                        <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Progresso</p>
                                                    </div>
                                                    <div className="p-2 bg-bg-2 rounded-xl">
                                                        <p className="text-[18px] font-bold text-text-primary">2d</p>
                                                        <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Duração</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 max-h-[250px] overflow-y-auto space-y-2">
                                                {stage.tasks.map(task => (
                                                    <div key={task.id} className="flex items-center justify-between group/task p-1 hover:bg-bg-2 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <button
                                                                onClick={() => handleToggleTask(task.id, stage.id)}
                                                                className={cn(
                                                                    "w-4 h-4 rounded border transition-colors flex items-center justify-center shrink-0",
                                                                    task.completed ? "bg-accent-indigo border-accent-indigo text-white" : "border-bg-3 dark:border-white/10 hover:border-accent-indigo"
                                                                )}
                                                            >
                                                                {task.completed && <Check className="w-3 h-3" />}
                                                            </button>
                                                            <span className={cn(
                                                                "text-[13px] transition-colors cursor-pointer",
                                                                task.completed ? "text-text-tertiary line-through" : "text-text-primary"
                                                            )}
                                                                onClick={() => {
                                                                    setEditingTask({ id: task.id, title: task.title, stageId: stage.id })
                                                                    setNewTaskTitle(task.title)
                                                                    setIsTaskModalOpen(true)
                                                                }}
                                                            >
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id, stage.id)}
                                                            className="opacity-0 group-hover/task:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 className="w-3.2 h-3.2 text-[10px]" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {stage.tasks.length === 0 && (
                                                    <p className="text-center text-[12px] text-text-tertiary italic py-4">Nenhuma tarefa</p>
                                                )}
                                            </div>
                                            <div className="p-4 border-t border-bg-3">
                                                <Button
                                                    onClick={() => {
                                                        setTaskStageId(stage.id)
                                                        setEditingTask(null)
                                                        setNewTaskTitle("")
                                                        setIsTaskModalOpen(true)
                                                    }}
                                                    className="w-full bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl h-10"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />Adicionar Tarefa
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Minimal Layout */}
                {layoutStyle === 'minimal' && (
                    <div className="pb-24 max-w-[900px] mx-auto">
                        <div className="space-y-4">
                            {roadmap.map((stage, idx) => (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group"
                                >
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex items-center gap-6 p-6 bg-bg-1 border border-bg-3 rounded-2xl hover:border-accent-indigo/30 transition-all cursor-pointer">
                                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ backgroundColor: stage.color + '20', color: stage.color }}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-[18px] font-bold text-text-primary mb-2">{stage.name}</h3>
                                                    <div className="h-2 bg-bg-3 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${stage.progress}%` }}
                                                            transition={{ duration: 1, delay: idx * 0.2 }}
                                                            className="h-full bg-accent-indigo"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[24px] font-black text-accent-indigo">{stage.progress}%</p>
                                                    <p className="text-[11px] text-text-tertiary">{stage.tasks.filter(t => t.completed).length}/{stage.tasks.length} tarefas</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-accent-indigo transition-colors" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-4 bg-bg-1 border-bg-3 rounded-2xl">
                                            <div className="space-y-3">
                                                {stage.tasks.map(task => (
                                                    <div key={task.id} className="flex items-center justify-between group/task">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleTask(task.id, stage.id);
                                                                }}
                                                                className={cn(
                                                                    "w-4 h-4 rounded border transition-colors flex items-center justify-center shrink-0",
                                                                    task.completed ? "bg-accent-indigo border-accent-indigo text-white" : "border-bg-3 hover:border-accent-indigo"
                                                                )}
                                                            >
                                                                {task.completed && <Check className="w-3 h-3" />}
                                                            </button>
                                                            <span
                                                                className={cn("text-[13px] cursor-pointer", task.completed && "line-through text-text-tertiary")}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingTask({ id: task.id, title: task.title, stageId: stage.id });
                                                                    setNewTaskTitle(task.title);
                                                                    setIsTaskModalOpen(true);
                                                                }}
                                                            >
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(task.id, stage.id);
                                                            }}
                                                            className="opacity-0 group-hover/task:opacity-100 text-text-tertiary hover:text-error transition-all"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-[11px] h-8 mt-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTaskStageId(stage.id);
                                                        setEditingTask(null);
                                                        setNewTaskTitle("");
                                                        setIsTaskModalOpen(true);
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Add Tarefa
                                                </Button>
                                                {stage.tasks.length === 0 && <p className="text-[12px] text-text-tertiary italic text-center">Sem tarefas</p>}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cards Layout (Glassmorphism) */}
                {layoutStyle === 'cards' && (
                    <div className="pb-24">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roadmap.map((stage, idx) => (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-accent-indigo/10 to-accent-mint/10 rounded-3xl" />
                                    <div className="relative p-6 backdrop-blur-xl bg-bg-1/80 border border-white/10 rounded-3xl shadow-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: stage.color }}>
                                                    {idx + 1}
                                                </div>
                                                <h3 className="text-[16px] font-bold text-text-primary">{stage.name}</h3>
                                            </div>
                                            {stage.progress === 100 && <CheckCircle2 className="w-6 h-6 text-accent-indigo" />}
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-[12px] mb-2">
                                                <span className="text-text-tertiary">Progresso</span>
                                                <span className="font-bold text-accent-indigo">{stage.progress}%</span>
                                            </div>
                                            <div className="h-3 bg-bg-3/50 rounded-full overflow-hidden backdrop-blur-sm">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${stage.progress}%` }}
                                                    transition={{ duration: 1.5, delay: idx * 0.2 }}
                                                    className="h-full bg-gradient-to-r from-accent-indigo to-accent-mint rounded-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                            {stage.tasks.map(task => (
                                                <div key={task.id} className="flex items-center justify-between group/task">
                                                    <div className="flex items-center gap-2 text-[12px]">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleTask(task.id, stage.id);
                                                            }}
                                                            className={cn(
                                                                "w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center shrink-0",
                                                                task.completed ? "bg-accent-indigo border-accent-indigo text-white" : "border-bg-3 hover:border-accent-indigo"
                                                            )}
                                                        >
                                                            {task.completed && <Check className="w-2.5 h-2.5" />}
                                                        </button>
                                                        <span
                                                            className={cn("cursor-pointer", task.completed && "line-through text-text-tertiary")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingTask({ id: task.id, title: task.title, stageId: stage.id });
                                                                setNewTaskTitle(task.title);
                                                                setIsTaskModalOpen(true);
                                                            }}
                                                        >
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTask(task.id, stage.id);
                                                        }}
                                                        className="opacity-0 group-hover/task:opacity-100 text-text-tertiary hover:text-error transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-[10px] h-7 mt-2 bg-transparent border-bg-3"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTaskStageId(stage.id);
                                                    setEditingTask(null);
                                                    setNewTaskTitle("");
                                                    setIsTaskModalOpen(true);
                                                }}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Tarefa
                                            </Button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-bg-3/30 flex items-center justify-between">
                                            <span className="text-[11px] text-text-tertiary">{stage.tasks.filter(t => t.completed).length}/{stage.tasks.length} tarefas</span>
                                            <Button variant="ghost" size="sm" className="h-8 text-[10px]" onClick={() => {
                                                setEditingStage(stage)
                                                setNewStageName(stage.name)
                                                setNewStageColor(stage.color)
                                                setIsStageModalOpen(true)
                                            }}>
                                                <Edit3 className="w-3 h-3 mr-1" />Editar
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline Horizontal Layout */}
                {layoutStyle === 'timeline' && (
                    <div className="pb-24 overflow-x-auto">
                        <div className="flex items-start gap-0 min-w-max py-8">
                            {roadmap.map((stage, idx) => (
                                <React.Fragment key={stage.id}>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.15 }}
                                                className="flex flex-col items-center cursor-pointer group"
                                            >
                                                <div className={cn(
                                                    "w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all",
                                                    stage.progress === 100
                                                        ? "bg-accent-indigo border-accent-indigo text-white"
                                                        : stage.progress > 0
                                                            ? "bg-accent-indigo/20 border-accent-indigo text-accent-indigo animate-pulse"
                                                            : "bg-bg-2 border-bg-3 text-text-tertiary"
                                                )}>
                                                    <span className="text-3xl font-black">{idx + 1}</span>
                                                </div>
                                                <div className="mt-4 text-center max-w-[120px]">
                                                    <h4 className="text-[13px] font-bold text-text-primary group-hover:text-accent-indigo transition-colors">{stage.name}</h4>
                                                    <p className="text-[11px] text-text-tertiary mt-1">{stage.progress}%</p>
                                                </div>
                                            </motion.div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[280px] p-4 bg-bg-1 border-bg-3 rounded-xl">
                                            <h4 className="font-bold mb-3">{stage.name}</h4>
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                                {stage.tasks.map(task => (
                                                    <div key={task.id} className="flex items-center justify-between group/task">
                                                        <div className="flex items-center gap-2 text-[12px]">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleTask(task.id, stage.id);
                                                                }}
                                                                className={cn(
                                                                    "w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center shrink-0",
                                                                    task.completed ? "bg-accent-indigo border-accent-indigo text-white" : "border-bg-3 hover:border-accent-indigo"
                                                                )}
                                                            >
                                                                {task.completed && <Check className="w-2.5 h-2.5" />}
                                                            </button>
                                                            <span
                                                                className={cn("cursor-pointer", task.completed && "line-through text-text-tertiary")}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingTask({ id: task.id, title: task.title, stageId: stage.id });
                                                                    setNewTaskTitle(task.title);
                                                                    setIsTaskModalOpen(true);
                                                                }}
                                                            >
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(task.id, stage.id);
                                                            }}
                                                            className="opacity-0 group-hover/task:opacity-100 text-text-tertiary hover:text-error transition-all"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-[10px] h-8 mt-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTaskStageId(stage.id);
                                                        setEditingTask(null);
                                                        setNewTaskTitle("");
                                                        setIsTaskModalOpen(true);
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Add Tarefa
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {idx < roadmap.length - 1 && (
                                        <div className="flex items-center h-24">
                                            <motion.div
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ delay: idx * 0.15 + 0.1 }}
                                                className={cn(
                                                    "w-16 h-1 origin-left",
                                                    stage.progress === 100 ? "bg-accent-indigo" : "bg-bg-3"
                                                )}
                                            />
                                            <ArrowRight className={cn(
                                                "w-5 h-5 -ml-1",
                                                stage.progress === 100 ? "text-accent-indigo" : "text-bg-3"
                                            )} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </DndContext>

            {/* Stage Create/Edit Modal */}
            <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
                <DialogContent className="bg-bg-1 border-bg-3 rounded-[24px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingStage ? "Editar Fase" : "Nova Fase do Roadmap"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Fase</Label>
                            <Input
                                id="name"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                placeholder="ex: Discovery, Design, Desenvolvimento..."
                                className="bg-bg-2 border-bg-3 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Cor Identificadora</Label>
                            <div className="flex gap-3">
                                <Input
                                    id="color"
                                    type="color"
                                    value={newStageColor}
                                    onChange={(e) => setNewStageColor(e.target.value)}
                                    className="w-12 h-12 p-1 rounded-lg bg-bg-2 border-bg-3"
                                />
                                <Input
                                    value={newStageColor}
                                    onChange={(e) => setNewStageColor(e.target.value)}
                                    className="flex-1 bg-bg-2 border-bg-3 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsStageModalOpen(false)}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveStage}
                            disabled={isLoading || !newStageName.trim()}
                            className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl px-8"
                        >
                            {isLoading ? "Salvando..." : editingStage ? "Salvar Alterações" : "Criar Fase"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Template Selection Modal */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="bg-bg-1 border-bg-3 rounded-[24px] max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-accent-mint" />
                            Escolher Template de Roadmap
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-6">
                        {ROADMAP_TEMPLATES.map(template => (
                            <motion.button
                                key={template.id}
                                onClick={() => handleApplyTemplate(template.id)}
                                disabled={isLoading}
                                className="p-6 bg-bg-2 border border-bg-3 rounded-xl text-left hover:border-accent-mint/50 hover:bg-bg-2/80 transition-all group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="text-3xl mb-3">{template.icon}</div>
                                <h3 className="text-[15px] font-bold text-text-primary mb-1 group-hover:text-accent-mint transition-colors">
                                    {template.name}
                                </h3>
                                <p className="text-[12px] text-text-tertiary mb-4">
                                    {template.description}
                                </p>
                                {template.stages.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {template.stages.map((stage, i) => (
                                            <div
                                                key={i}
                                                className="px-2 py-0.5 bg-bg-0 rounded text-[9px] font-bold uppercase tracking-wider text-text-tertiary border border-bg-3"
                                            >
                                                {stage.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <p className="text-[11px] text-text-tertiary text-center pb-2">
                        ⚠️ Aplicar um template irá substituir todas as fases existentes
                    </p>
                </DialogContent>
            </Dialog>

            {/* Layout Selection Modal */}
            <Dialog open={isLayoutModalOpen} onOpenChange={setIsLayoutModalOpen}>
                <DialogContent className="bg-bg-1 border-bg-3 rounded-[24px] max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
                            <Palette className="w-5 h-5 text-amber-500" />
                            Escolher Layout do Roadmap
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-4 py-6">
                        {/* Default Layout */}
                        <motion.button
                            onClick={() => {
                                setLayoutStyle('default')
                                setIsLayoutModalOpen(false)
                            }}
                            className={cn(
                                "p-5 bg-bg-2 border rounded-xl text-left transition-all group",
                                layoutStyle === 'default' ? "border-amber-500 ring-2 ring-amber-500/20" : "border-bg-3 hover:border-amber-500/50"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-2xl mb-2">📋</div>
                            <h3 className="text-[14px] font-bold text-text-primary mb-1">Padrão</h3>
                            <p className="text-[11px] text-text-tertiary">Timeline vertical clássica com cards detalhados</p>
                        </motion.button>

                        {/* Numbered Circles Layout */}
                        <motion.button
                            onClick={() => {
                                setLayoutStyle('numbered')
                                setIsLayoutModalOpen(false)
                            }}
                            className={cn(
                                "p-5 bg-bg-2 border rounded-xl text-left transition-all group",
                                layoutStyle === 'numbered' ? "border-amber-500 ring-2 ring-amber-500/20" : "border-bg-3 hover:border-amber-500/50"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-2xl mb-2">🔢</div>
                            <h3 className="text-[14px] font-bold text-text-primary mb-1">Círculos Numerados</h3>
                            <p className="text-[11px] text-text-tertiary">Fases em círculos grandes com números destacados</p>
                        </motion.button>

                        {/* Minimal Layout */}
                        <motion.button
                            onClick={() => {
                                setLayoutStyle('minimal')
                                setIsLayoutModalOpen(false)
                            }}
                            className={cn(
                                "p-5 bg-bg-2 border rounded-xl text-left transition-all group",
                                layoutStyle === 'minimal' ? "border-amber-500 ring-2 ring-amber-500/20" : "border-bg-3 hover:border-amber-500/50"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-2xl mb-2">✨</div>
                            <h3 className="text-[14px] font-bold text-text-primary mb-1">Minimalista</h3>
                            <p className="text-[11px] text-text-tertiary">Design clean com foco no progresso</p>
                        </motion.button>

                        {/* Cards Layout */}
                        <motion.button
                            onClick={() => {
                                setLayoutStyle('cards')
                                setIsLayoutModalOpen(false)
                            }}
                            className={cn(
                                "p-5 bg-bg-2 border rounded-xl text-left transition-all group",
                                layoutStyle === 'cards' ? "border-amber-500 ring-2 ring-amber-500/20" : "border-bg-3 hover:border-amber-500/50"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-2xl mb-2">🃏</div>
                            <h3 className="text-[14px] font-bold text-text-primary mb-1">Cards Flutuantes</h3>
                            <p className="text-[11px] text-text-tertiary">Cards com efeito glassmorphism</p>
                        </motion.button>

                        {/* Timeline Layout */}
                        <motion.button
                            onClick={() => {
                                setLayoutStyle('timeline')
                                setIsLayoutModalOpen(false)
                            }}
                            className={cn(
                                "p-5 bg-bg-2 border rounded-xl text-left transition-all group",
                                layoutStyle === 'timeline' ? "border-amber-500 ring-2 ring-amber-500/20" : "border-bg-3 hover:border-amber-500/50"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-2xl mb-2">⏳</div>
                            <h3 className="text-[14px] font-bold text-text-primary mb-1">Timeline Horizontal</h3>
                            <p className="text-[11px] text-text-tertiary">Linha do tempo com setas conectoras</p>
                        </motion.button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Task Management Modal */}
            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                <DialogContent className="bg-bg-1 border-bg-3 rounded-2xl sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-text-primary">
                            {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Título da Tarefa</label>
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Ex: Definir paleta de cores..."
                                className="w-full bg-bg-2 border border-bg-3 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-indigo/50 transition-all font-medium"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        editingTask ? handleEditTask() : (taskStageId && handleAddTask(taskStageId))
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)} className="rounded-xl">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => editingTask ? handleEditTask() : (taskStageId && handleAddTask(taskStageId))}
                            disabled={isLoading || !newTaskTitle.trim()}
                            className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl px-8"
                        >
                            {isLoading ? "Salvando..." : (editingTask ? "Salvar Alterações" : "Adicionar Tarefa")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SortableStageItem({
    stage,
    idx,
    onEdit,
    onDelete,
    onToggleTask,
    onAddTask,
    onEditTask,
    onDeleteTask
}: {
    stage: RoadmapStage
    idx: number
    onEdit: () => void
    onDelete: () => void
    onToggleTask: (taskId: string, stageId: string) => void
    onAddTask: (stageId: string) => void
    onEditTask: (task: { id: string, title: string, stageId: string }) => void
    onDeleteTask: (taskId: string, stageId: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: stage.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const
    }

    return (
        <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
            {/* Marker */}
            <div className={cn(
                "absolute -left-[48px] md:-left-[112px] w-10 h-10 rounded-full border-4 border-bg-0 z-10 flex items-center justify-center transition-all duration-500 shadow-xl",
                stage.progress === 100
                    ? "bg-accent-indigo ring-4 ring-accent-indigo/10"
                    : stage.progress > 0
                        ? "bg-white ring-4 ring-accent-indigo/10 animate-pulse"
                        : "bg-bg-3"
            )}>
                {stage.progress === 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        stage.progress > 0 ? "bg-accent-indigo" : "bg-text-tertiary"
                    )} />
                )}
            </div>

            {/* Phase Content */}
            <div className={cn(
                "p-6 md:p-8 border rounded-[24px] transition-all group/stage",
                stage.progress === 100
                    ? "bg-bg-1/40 border-bg-3 opacity-80"
                    : stage.progress > 0
                        ? "bg-bg-1 border-accent-indigo/20 shadow-xl shadow-accent-indigo/5"
                        : "bg-bg-1/40 border-bg-3 opacity-60"
            )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -ml-2 text-text-tertiary hover:text-text-primary opacity-0 group-hover/stage:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-text-primary">{stage.name}</h3>
                                <div className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter" style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                                    Fase {idx + 1}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-text-tertiary">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{stage.tasks.length} Tarefas</span>
                                </div>
                                <div className="h-1 w-1 rounded-full bg-bg-3" />
                                <span>{stage.progress}% Concluído</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddTask(stage.id)}
                            className="bg-bg-2 border-bg-3 rounded-xl h-9 font-bold text-[10px] uppercase tracking-wider"
                        >
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            Tarefa
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-bg-2">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-bg-1 border-bg-3 rounded-xl">
                                <DropdownMenuItem onClick={onEdit} className="text-[13px] font-medium cursor-pointer">
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Editar Fase
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-error text-[13px] font-medium cursor-pointer" onClick={onDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir Fase
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-2">
                    {stage.tasks.map(task => (
                        <div
                            key={task.id}
                            className="group/task flex items-center justify-between p-3.5 bg-bg-2/50 border border-bg-3 rounded-xl hover:border-accent-indigo/30 hover:bg-bg-2 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onToggleTask(task.id, stage.id)}
                                    className={cn(
                                        "w-5 h-5 rounded-md border transition-all flex items-center justify-center shrink-0",
                                        task.completed
                                            ? "bg-accent-indigo border-accent-indigo text-white"
                                            : "border-bg-3 dark:border-white/10 hover:border-accent-indigo"
                                    )}
                                >
                                    {task.completed && <Check className="w-3.5 h-3.5" />}
                                </button>
                                <span
                                    onClick={() => onEditTask({ id: task.id, title: task.title, stageId: stage.id })}
                                    className={cn(
                                        "text-[14px] font-medium transition-colors cursor-pointer",
                                        task.completed ? "text-text-tertiary line-through" : "text-text-primary"
                                    )}
                                >
                                    {task.title}
                                </span>
                            </div>
                            <div className="flex items-center opacity-0 group-hover/task:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDeleteTask(task.id, stage.id)}
                                    className="h-8 w-8 text-text-tertiary hover:text-error rounded-lg"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {stage.tasks.length === 0 && (
                        <div className="py-8 px-4 border border-dashed border-bg-3 rounded-xl flex flex-col items-center justify-center text-center">
                            <p className="text-[13px] font-medium text-text-tertiary italic">Nenhuma tarefa associada a esta fase</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
