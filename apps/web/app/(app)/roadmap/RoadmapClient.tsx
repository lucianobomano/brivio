"use client"

import * as React from "react"
import { ColorInput } from "@/components/ui/color-input"
import { useAsyncAction } from "@/lib/hooks/use-async-action"
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
    ChevronDown,
    ArrowLeft,
    MessageSquare,
    ImageIcon,
    Map as MapIcon,
    Flag,
    ListChecks,
    Layers,
    ChevronRight,
    CalendarClock,
    GitCommitHorizontal,
    Milestone,
    GanttChart,
} from "lucide-react"
import { formatDate as formatShortDate } from "@/lib/format"
import { useRouter } from "nextjs-toploader/app"
import { WorkspaceShell, StatStrip, OutlineButton, Pill, PANEL, TABLE_HEAD, TABLE_ROW, type Tone } from "@/components/workspace/ui"
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
    completeStageTasks,
    getProjectRoadmap,
    getUnstagedTasks,
    assignTaskToStage,
    RoadmapStage,
    type RoadmapSummary,
    type UnstagedTask
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
import { ProjectNotesPanel } from "@/components/roadmap/ProjectNotesPanel"
import { JourneyRoadmapLayouts, type JourneyLayoutStyle } from "@/components/roadmap/JourneyRoadmapLayouts"
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

const BG_CLASSES_ADMIN: Record<string, string> = {
    'default': '',
}

type GalleryItem = { type: 'gradient' | 'image', value: string, label?: string };

type RoadmapLayoutStyle = 'default' | 'numbered' | 'minimal' | 'cards' | 'timeline' | JourneyLayoutStyle

const JOURNEY_LAYOUT_OPTIONS: { id: JourneyLayoutStyle; icon: React.ComponentType<{ className?: string }>; name: string; description: string }[] = [
    { id: 'winding-road', icon: GitCommitHorizontal, name: 'Percurso', description: 'Passos na horizontal, com um cartão por fase' },
    { id: 'angular-path', icon: Milestone, name: 'Marcos', description: 'Linha do tempo vertical, fases em lados alternados' },
    { id: 'ribbon-path', icon: Rows3, name: 'Faixas', description: 'Uma faixa por fase, com progresso e tarefas' },
    { id: 'stair-path', icon: GanttChart, name: 'Cascata', description: 'Fases em escada, do início à entrega' },
]

const galleryItems: GalleryItem[] = [
    { type: 'gradient', value: "linear-gradient(135deg, #FF0054 0%, #88007F 100%)", label: "Pink Purple" },
    { type: 'gradient', value: "linear-gradient(135deg, #06D6A0 0%, #311C99 100%)", label: "Green Blue" },
    { type: 'gradient', value: "linear-gradient(135deg, #FFD166 0%, #EF476F 100%)", label: "Yellow Red" },
    { type: 'gradient', value: "linear-gradient(135deg, #118AB2 0%, #073B4C 100%)", label: "Blue Dark" },
    { type: 'image', value: "/images/gallery/Frame 604.png", label: "Frame 604" },
    { type: 'image', value: "/images/gallery/Frame 605.png", label: "Frame 605" },
    { type: 'image', value: "/images/gallery/Frame 606.png", label: "Frame 606" },
    { type: 'image', value: "/images/gallery/Frame 607.png", label: "Frame 607" },
    { type: 'image', value: "/images/gallery/Frame 608.png", label: "Frame 608" },
    { type: 'image', value: "/images/gallery/Frame 609.png", label: "Frame 609" },
    { type: 'image', value: "/images/gallery/Frame 610.png", label: "Frame 610" },
    { type: 'image', value: "/images/gallery/Frame 611.png", label: "Frame 611" },
    { type: 'image', value: "/images/gallery/Frame 612.png", label: "Frame 612" },
    { type: 'image', value: "/images/gallery/Frame 613.png", label: "Frame 613" },
    { type: 'image', value: "/images/gallery/Frame 614.png", label: "Frame 614" },
    { type: 'image', value: "/images/gallery/Frame 615.png", label: "Frame 615" },
    { type: 'image', value: "/images/gallery/Frame 616.png", label: "Frame 616" },
    { type: 'image', value: "/images/gallery/Frame 617.png", label: "Frame 617" },
    { type: 'image', value: "/images/gallery/Frame 618.png", label: "Frame 618" },
];

interface ProjectBase {
    id: string
    name: string
    workspace_id?: string | null
}

interface RoadmapClientProps {
    initialProjects: ProjectBase[]
    initialRoadmap: RoadmapStage[]
    selectedProjectId: string | null
    selectedProject: ProjectBase | null
    initialNotes?: any[]
    initialMeetings?: unknown[]
    /** Every roadmap (one per project), for the table */
    summaries?: RoadmapSummary[]
    /** Open the roadmap of selectedProjectId straight away (?projectId= in the URL) */
    openOnLoad?: boolean
}

export function RoadmapClient({
    initialProjects,
    initialRoadmap,
    selectedProjectId,
    selectedProject,
    initialNotes = [],
    summaries = [],
    openOnLoad = false,
}: RoadmapClientProps) {
    // The table is the first view; a roadmap opens in a full-screen modal
    const [detailOpen, setDetailOpen] = React.useState(openOnLoad)
    const [tableView, setTableView] = React.useState<'all' | 'active' | 'done' | 'empty'>('all')
    // Project tasks not in any phase yet (shown in the open roadmap so they can be placed)
    const [unstaged, setUnstaged] = React.useState<UnstagedTask[]>([])
    const [roadmap, setRoadmap] = React.useState<RoadmapStage[]>(initialRoadmap || [])
    const [isLoading, setIsLoading] = React.useState(false)
    const [isRoadmapLoading, setIsRoadmapLoading] = React.useState(false)
    const [currentSelectedProject, setCurrentSelectedProject] = React.useState(selectedProject)
    const [isNotesOpen, setIsNotesOpen] = React.useState(false)
    const [projectQuery, setProjectQuery] = React.useState("")
    const router = useRouter()
    const [localProjects, setLocalProjects] = React.useState<ProjectBase[]>(initialProjects || [])
    const [localSelectedProjectId, setLocalSelectedProjectId] = React.useState<string | null>(selectedProjectId)

    React.useEffect(() => {
        if (!initialProjects || initialProjects.length === 0) {
            import("@/app/actions/projects").then(({ getProjectOptions }) => {
                getProjectOptions().then((data) => {
                    const mapped = data as ProjectBase[]
                    setLocalProjects(mapped)
                    if (mapped.length > 0 && !localSelectedProjectId) {
                        setLocalSelectedProjectId(mapped[0].id)
                        setCurrentSelectedProject(mapped[0])
                    }
                })
            })
        } else {
            setLocalProjects(initialProjects)
        }
    }, [initialProjects])

    React.useEffect(() => {
        if (localSelectedProjectId && (!initialRoadmap || initialRoadmap.length === 0)) {
            setIsRoadmapLoading(true)
            import("@/app/actions/roadmap").then(({ getProjectRoadmap }) => {
                getProjectRoadmap(localSelectedProjectId).then((data) => {
                    setRoadmap(data)
                    setIsRoadmapLoading(false)
                })
            })
        }
    }, [localSelectedProjectId, initialRoadmap])

    // Handles project selection without full page navigation
    React.useEffect(() => {
        if (!detailOpen || !localSelectedProjectId) return
        let alive = true
        getUnstagedTasks(localSelectedProjectId).then(t => { if (alive) setUnstaged(t) })
        return () => { alive = false }
    }, [detailOpen, localSelectedProjectId])

    React.useEffect(() => {
        if (!detailOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || document.querySelector('[role="dialog"][data-state="open"]')) return
            setDetailOpen(false)
            window.history.pushState(null, "", "/roadmap")
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [detailOpen])

    const handleSelectProject = React.useCallback((p: ProjectBase) => {
        if (p.id === localSelectedProjectId) return
        // 1. Update UI immediately (instant feedback)
        setCurrentSelectedProject(p)
        setLocalSelectedProjectId(p.id)
        setRoadmap([])
        // 2. Update URL without triggering a server navigation
        window.history.pushState(null, "", `/roadmap?projectId=${p.id}`)
        // 3. Fetch roadmap data client-side
        setIsRoadmapLoading(true)
        import("@/app/actions/roadmap").then(({ getProjectRoadmap }) => {
            getProjectRoadmap(p.id).then((data) => {
                setRoadmap(data)
                setIsRoadmapLoading(false)
            }).catch(() => {
                setIsRoadmapLoading(false)
            })
        })
    }, [localSelectedProjectId])

    React.useEffect(() => {
        setLocalSelectedProjectId(selectedProjectId)
        setCurrentSelectedProject(selectedProject)
        if (initialRoadmap) {
            setRoadmap(initialRoadmap)
        }
    }, [selectedProjectId, selectedProject, initialRoadmap])

    const [isStageModalOpen, setIsStageModalOpen] = React.useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false)
    const [isLayoutModalOpen, setIsLayoutModalOpen] = React.useState(false)
    const [isBgModalOpen, setIsBgModalOpen] = React.useState(false)
    const [editingStage, setEditingStage] = React.useState<RoadmapStage | null>(null)
    const [newStageName, setNewStageName] = React.useState("")
    const [newStageColor, setNewStageColor] = React.useState("#ff0054")
    const [newStageStartDate, setNewStageStartDate] = React.useState("")
    const [newStageDueDate, setNewStageDueDate] = React.useState("")
    const [viewMode, setViewMode] = React.useState<'vertical' | 'horizontal'>('vertical')
    const [layoutStyle, setLayoutStyle] = React.useState<RoadmapLayoutStyle>('numbered')
    const [bgStyle, setBgStyle] = React.useState<string>('default')
    const [editingTask, setEditingTask] = React.useState<{ id: string, title: string, stageId: string } | null>(null)
    const [newTaskTitle, setNewTaskTitle] = React.useState("")
    const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false)
    const [taskStageId, setTaskStageId] = React.useState<string | null>(null)

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return '';
        }
    };

    React.useEffect(() => {
        if (editingStage) {
            setNewStageName(editingStage.name)
            setNewStageColor(editingStage.color)
            setNewStageStartDate(editingStage.start_date ? new Date(editingStage.start_date).toISOString().split('T')[0] : "")
            setNewStageDueDate(editingStage.due_date ? new Date(editingStage.due_date).toISOString().split('T')[0] : "")
        } else {
            setNewStageName("")
            setNewStageColor("#ff0054")
            setNewStageStartDate("")
            setNewStageDueDate("")
        }
    }, [editingStage])

    // Sync layout and bg with localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined' && localSelectedProjectId) {
            const savedLayout = localStorage.getItem(`brivio_roadmap_layout_${localSelectedProjectId}`)
            if (savedLayout) setLayoutStyle(savedLayout as any)
            const savedBg = localStorage.getItem(`brivio_roadmap_bg_${localSelectedProjectId}`)
            if (savedBg) setBgStyle(savedBg)
        }
    }, [localSelectedProjectId])

    React.useEffect(() => {
        if (typeof window !== 'undefined' && localSelectedProjectId) {
            localStorage.setItem(`brivio_roadmap_layout_${localSelectedProjectId}`, layoutStyle)
            localStorage.setItem(`brivio_roadmap_bg_${localSelectedProjectId}`, bgStyle)
        }
    }, [layoutStyle, bgStyle, localSelectedProjectId])

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

    const currentStage = roadmap.find(s => s.progress < 100)

    const handleGenerateLink = () => {
        if (!localSelectedProjectId) return
        const link = `${window.location.origin}/share/${localSelectedProjectId}/roadmap?layout=${layoutStyle}&bg=${encodeURIComponent(bgStyle)}`
        navigator.clipboard.writeText(link)
        toast.success("Link do cliente copiado!", {
            description: "Você já pode enviar este link para o seu cliente."
        })
    }

    const handleSaveStage = async () => {
        if (!currentSelectedProject?.workspace_id || !newStageName.trim()) return

        setIsLoading(true)
        try {
            if (editingStage) {
                const result = await updateRoadmapStage(
                    editingStage.id,
                    newStageName,
                    newStageColor,
                    newStageStartDate ? new Date(newStageStartDate).toISOString() : null,
                    newStageDueDate ? new Date(newStageDueDate).toISOString() : null
                )
                if (result.success) {
                    toast.success("Fase atualizada!")
                    setRoadmap(prev => prev.map(s => s.id === editingStage.id ? {
                        ...s,
                        name: newStageName,
                        color: newStageColor,
                        start_date: newStageStartDate ? new Date(newStageStartDate).toISOString() : null,
                        due_date: newStageDueDate ? new Date(newStageDueDate).toISOString() : null
                    } : s))
                } else {
                    toast.error("Erro ao atualizar fase")
                }
            } else {
                const result = await createRoadmapStage(
                    currentSelectedProject.workspace_id,
                    newStageName,
                    newStageColor,
                    newStageStartDate ? new Date(newStageStartDate).toISOString() : null,
                    newStageDueDate ? new Date(newStageDueDate).toISOString() : null
                )
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
            setNewStageStartDate("")
            setNewStageDueDate("")
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

    const handleCompleteStage = async (stageId: string) => {
        if (!localSelectedProjectId) return

        setIsLoading(true)
        try {
            const result = await completeStageTasks(localSelectedProjectId, stageId)
            if (result.success) {
                toast.success("Fase concluída com sucesso!")
                window.location.reload()
            } else {
                toast.error(result.error || "Erro ao concluir fase")
            }
        } catch {
            toast.error("Erro inesperado ao concluir fase")
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleTask = async (taskId: string, stageId: string) => {
        if (!localSelectedProjectId) return

        try {
            const result = await toggleRoadmapTask(taskId, localSelectedProjectId)
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
                    const advanceResult = await advanceProjectStage(localSelectedProjectId)
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
        if (!localSelectedProjectId || !newTaskTitle.trim()) return

        setIsLoading(true)
        try {
            const result = await createRoadmapTask(localSelectedProjectId, stageId, newTaskTitle)
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

    // Busy state + double-submit guard for confirm/save actions
    const [runAction, isActionPending] = useAsyncAction(async (fn: () => unknown) => { await fn() })

    const handleDeleteTask = async (taskId: string, stageId: string) => {
        if (!localSelectedProjectId || !confirm("Eliminar esta tarefa?")) return

        try {
            const result = await deleteRoadmapTask(taskId, localSelectedProjectId)
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
        if (!localSelectedProjectId || !editingTask || !newTaskTitle.trim()) return

        setIsLoading(true)
        try {
            const result = await updateRoadmapTask(editingTask.id, newTaskTitle, localSelectedProjectId)
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

    /** Reloads the open roadmap and the tasks without a phase */
    const reloadRoadmap = async () => {
        if (!localSelectedProjectId) return
        const [data, loose] = await Promise.all([getProjectRoadmap(localSelectedProjectId), getUnstagedTasks(localSelectedProjectId)])
        setRoadmap(data)
        setUnstaged(loose)
    }

    const handleApplyTemplate = async (templateId: string) => {
        if (!currentSelectedProject?.workspace_id || !localSelectedProjectId) return
        if (roadmap.length > 0 && !confirm("Este projeto já tem um roadmap. Aplicar o template acrescenta as fases e as tarefas dele ao projeto. Continuar?")) return

        setIsLoading(true)
        try {
            // With the project: its phases AND the tasks of each phase are created in the project
            const result = await applyRoadmapTemplate(currentSelectedProject.workspace_id, templateId, localSelectedProjectId)
            if (result.success) {
                toast.success('tasks' in result ? `Roadmap criado: ${result.stages} fases e ${result.tasks} tarefas` : "Template aplicado")
                setIsTemplateModalOpen(false)
                await reloadRoadmap()
            } else {
                toast.error(result.error || "Erro ao aplicar template")
            }
        } catch {
            toast.error("Erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const getBackgroundStyle = (bg: string) => {
        if (!bg || bg === 'default') return {};
        if (bg.startsWith('/') || bg.startsWith('http')) {
            return {
                backgroundImage: `url('${bg}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            };
        }
        if (bg.startsWith('linear-gradient')) {
            return { backgroundImage: bg, backgroundAttachment: 'fixed' };
        }
        return {};
    }

    const customBg = !!bgStyle && bgStyle !== 'default'
    const doneStages = roadmap.filter(s => s.progress === 100).length
    const roadmapId = (id: string) => `RM-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`

    // Rows of the table; the roadmap open in the modal uses its live data (edits show straight away)
    type Row = RoadmapSummary & { status: { label: string, tone: Tone, key: 'active' | 'done' | 'empty' } }
    const statusOf = (r: RoadmapSummary): Row['status'] =>
        r.stages_total === 0 ? { label: 'Sem roadmap', tone: 'zinc', key: 'empty' }
            : r.progress === 100 ? { label: 'Concluído', tone: 'green', key: 'done' }
            : r.tasks_done === 0 ? { label: 'Por iniciar', tone: 'amber', key: 'active' }
            : { label: 'Em curso', tone: 'indigo', key: 'active' }
    const rows: Row[] = summaries.map(r => {
        const live = r.project_id === localSelectedProjectId && !isRoadmapLoading && roadmap.length > 0
            ? { stages_total: roadmap.length, stages_done: doneStages, tasks_total: totalTasks, tasks_done: completedTasks, progress: overallProgress, current_stage: currentStage && currentStage.progress < 100 ? { name: currentStage.name, color: currentStage.color } : null }
            : {}
        const merged = { ...r, ...live }
        return { ...merged, status: statusOf(merged) }
    })
    const q = projectQuery.trim().toLowerCase()
    const visibleRows = rows.filter(r => (tableView === 'all' || r.status.key === tableView) && (!q || r.name.toLowerCase().includes(q) || roadmapId(r.project_id).toLowerCase().includes(q) || (r.brand || '').toLowerCase().includes(q)))
    const withTasks = rows.filter(r => r.tasks_total > 0)
    const avgProgress = withTasks.length ? Math.round(withTasks.reduce((a, r) => a + r.progress, 0) / withTasks.length) : 0

    const openRoadmap = (projectId: string) => {
        const p = localProjects.find(x => x.id === projectId)
        if (!p) return
        handleSelectProject(p)
        window.history.pushState(null, "", `/roadmap?projectId=${p.id}`)
        setDetailOpen(true)
    }
    const closeRoadmap = () => {
        setDetailOpen(false)
        window.history.pushState(null, "", "/roadmap")
        router.refresh()
    }

    return (
        <WorkspaceShell
            section="Roadmap"
            view={tableView}
            onView={setTableView}
            views={[
                { id: 'all', label: 'Todos os roadmaps', icon: MapIcon, count: rows.length },
                { id: 'active', label: 'Em curso', icon: Clock, count: rows.filter(r => r.status.key === 'active').length },
                { id: 'done', label: 'Concluídos', icon: CheckCircle2, count: rows.filter(r => r.status.key === 'done').length },
                { id: 'empty', label: 'Sem roadmap', icon: Circle, count: rows.filter(r => r.status.key === 'empty').length },
            ]}
            list={localProjects.map(p => ({ id: p.id, label: p.name, active: detailOpen && p.id === localSelectedProjectId, onClick: () => openRoadmap(p.id) }))}
            listAddLabel="Novo projeto"
            onListAdd={() => router.push('/projects')}
            search={projectQuery}
            onSearch={setProjectQuery}
            searchPlaceholder="Procurar roadmap"
            action={{ label: 'Novo projeto', onClick: () => router.push('/projects') }}
        >
            <StatStrip stats={[
                { label: 'Roadmaps', value: rows.length, unit: 'projetos', icon: MapIcon, tone: 'rose', onClick: () => setTableView('all') },
                { label: 'Em curso', value: rows.filter(r => r.status.key === 'active').length, unit: 'roadmaps', icon: Clock, tone: 'indigo', onClick: () => setTableView('active') },
                { label: 'Concluídos', value: rows.filter(r => r.status.key === 'done').length, unit: 'roadmaps', icon: CheckCircle2, tone: 'green', onClick: () => setTableView('done') },
                { label: 'Progresso médio', value: `${avgProgress}%`, unit: 'das tarefas', icon: Layers, tone: 'amber' },
            ]} />

            {rows.length === 0 ? (
                <div className="border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl px-6 py-16 flex flex-col items-center text-center">
                    <MapIcon className="w-5 h-5 text-zinc-400 mb-3" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ainda não tens roadmaps</h3>
                    <p className="text-xs text-zinc-500 mt-1.5 max-w-md">Cada projeto tem o seu roadmap, com as fases e as tarefas. Cria um projeto para começares.</p>
                    <Link href="/projects" className="mt-5 h-8 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Novo projeto</Link>
                </div>
            ) : (
                <div className={cn(PANEL, "overflow-hidden")}>
                    <div className={cn(TABLE_HEAD, "hidden lg:grid grid-cols-[1.7fr_1.1fr_1.2fr_0.7fr_0.8fr_0.8fr_24px] gap-4")}>
                        <span>Roadmap</span><span>Fase atual</span><span>Progresso</span><span>Tarefas</span><span>Próximo prazo</span><span>Estado</span><span />
                    </div>
                    {visibleRows.map(r => (
                        <button
                            key={r.project_id}
                            type="button"
                            onClick={() => openRoadmap(r.project_id)}
                            className={cn(TABLE_ROW, "group w-full text-left grid grid-cols-2 lg:grid-cols-[1.7fr_1.1fr_1.2fr_0.7fr_0.8fr_0.8fr_24px] gap-x-4 gap-y-2 items-center")}
                        >
                            <div className="flex items-center gap-3 min-w-0 col-span-2 lg:col-span-1">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm">
                                    <span className="text-red-500 font-bold text-xs">{(r.name || "R")[0]?.toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#ff0054] transition-colors">{r.name}</p>
                                    <p className="text-[11px] text-zinc-500 truncate mt-0.5"><span className="font-mono">{roadmapId(r.project_id)}</span>{r.brand && <> · {r.brand}</>}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                {r.current_stage ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.current_stage.color || '#ff0054' }} />
                                        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{r.current_stage.name}</span>
                                    </>
                                ) : r.stages_total ? <span className="text-xs text-zinc-400">Todas concluídas</span>
                                    : <span className="text-xs font-semibold text-[#ff0054] inline-flex items-center gap-1">Criar roadmap <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></span>}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                                    <div className="h-full rounded-full bg-[#ff0054] transition-all duration-700" style={{ width: `${r.progress}%` }} />
                                </div>
                                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums w-9 text-right">{r.progress}%</span>
                            </div>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">{r.tasks_done}/{r.tasks_total} <span className="text-zinc-400">· {r.stages_done}/{r.stages_total} fases</span></span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">{(r.next_due || r.due_date) ? <><CalendarClock className="w-3.5 h-3.5 text-zinc-400" />{formatShortDate(r.next_due || r.due_date, { day: '2-digit', month: 'short' })}</> : '—'}</span>
                            <span><Pill tone={r.status.tone}>{r.status.label}</Pill></span>
                            <ChevronRight className="hidden lg:block w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                        </button>
                    ))}
                    {visibleRows.length === 0 && <p className="text-xs text-zinc-500 text-center py-10">Nenhum roadmap {q ? 'encontrado' : 'nesta vista'}.</p>}
                </div>
            )}

            {/* ===== Roadmap in a full-screen modal ===== */}
            {detailOpen && currentSelectedProject && (
                <div className="fixed inset-0 z-[45] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeRoadmap} />
                <div className="relative w-[90vw] h-[98vh] flex flex-col bg-bg-0 rounded-[16px] overflow-hidden border border-zinc-200/80 dark:border-white/[0.08] shadow-2xl animate-in fade-in zoom-in-[0.98] duration-200" role="dialog" aria-modal="true" aria-label={`Roadmap ${currentSelectedProject.name}`}>
                    {/* Background chosen for this roadmap */}
                    <div className={cn("absolute inset-0 -z-0 transition-all duration-700 pointer-events-none", customBg ? "scale-110" : "bg-bg-0")} style={getBackgroundStyle(bgStyle)} />
                    {customBg && <div className="absolute inset-0 bg-black/60 backdrop-blur-[30px] pointer-events-none" />}

                    {/* Header, as the app's modals */}
                    <div className="relative h-[60px] bg-[#ff0054] px-6 md:px-8 flex items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2 py-1 rounded-md bg-black/20 text-white text-[11px] font-mono font-semibold tracking-wide shrink-0" title="Identificador do roadmap">{roadmapId(currentSelectedProject.id)}</span>
                            <h2 className="text-[18px] md:text-[20px] font-bold text-white truncate">{currentSelectedProject.name}</h2>
                            {currentStage && <span className="hidden md:inline text-[13px] text-white/75 truncate">· Fase atual: {currentStage.name}</span>}
                        </div>
                        <button type="button" onClick={closeRoadmap} title="Fechar (Esc)" aria-label="Fechar" className="w-[22px] h-[22px] bg-[#15161B] rounded-full transition-transform active:scale-90 hover:scale-105 shrink-0" />
                    </div>

                    {/* Actions */}
                    <div className="relative px-6 md:px-8 py-3 border-b border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur flex flex-wrap items-center gap-2 shrink-0">
                        <button type="button" onClick={() => { setEditingStage(null); setNewStageName(""); setIsStageModalOpen(true) }} className="h-8 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95">
                            <Plus className="w-3.5 h-3.5" /> Nova fase
                        </button>
                        <span className="w-px h-5 bg-zinc-200 dark:bg-white/[0.08] mx-1" />
                        <OutlineButton onClick={() => setIsTemplateModalOpen(true)}><Sparkles className="w-3.5 h-3.5" /> Templates</OutlineButton>
                        <OutlineButton onClick={() => setIsLayoutModalOpen(true)}><Palette className="w-3.5 h-3.5" /> Layout</OutlineButton>
                        <OutlineButton onClick={() => setIsBgModalOpen(true)}><ImageIcon className="w-3.5 h-3.5" /> Fundo</OutlineButton>
                        <OutlineButton onClick={() => setIsNotesOpen(true)}>
                            <MessageSquare className="w-3.5 h-3.5" /> Notas
                            {initialNotes.length > 0 && <span className="ml-0.5 min-w-4 h-4 px-1 rounded-full bg-[#FF0055] text-white text-[9px] font-bold flex items-center justify-center">{initialNotes.length}</span>}
                        </OutlineButton>
                        <div className="ml-auto flex items-center gap-2">
                            <OutlineButton onClick={handleGenerateLink}><Share2 className="w-3.5 h-3.5" /> Copiar link</OutlineButton>
                            <Link href={`/share/${currentSelectedProject.id}/roadmap?layout=${layoutStyle}&bg=${encodeURIComponent(bgStyle)}`} target="_blank" className="h-8 px-3.5 rounded-lg bg-[#ff0054] hover:bg-[#e0004a] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" /> Ver como cliente
                            </Link>
                        </div>
                    </div>

                    <div className="relative flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                        <div className="w-full max-w-[1520px] mx-auto px-6 md:px-10 py-8 flex flex-col gap-6 min-w-0">
                            <StatStrip stats={[
                                { label: 'Progresso', value: `${overallProgress}%`, unit: 'concluído', icon: CheckCircle2, tone: 'green' },
                                { label: 'Fase atual', value: <span className="text-lg lg:text-xl">{currentStage ? currentStage.name : 'Concluído'}</span>, icon: Flag, tone: 'indigo' },
                                { label: 'Tarefas', value: `${completedTasks}/${totalTasks}`, unit: 'feitas', icon: ListChecks, tone: 'amber' },
                                { label: 'Fases', value: `${doneStages}/${roadmap.length}`, unit: 'concluídas', icon: Layers, tone: 'rose' },
                            ]} />

                            {/* No roadmap yet: create it from a template */}
                            {!isRoadmapLoading && roadmap.length === 0 && (
                                <div className={cn(PANEL, "p-6 md:p-8")}>
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-white/[0.06]">
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff0054]">Próximo passo</span>
                                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mt-1">Cria o roadmap deste projeto</h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xl leading-relaxed">
                                                Escolhe o template mais próximo do trabalho. As fases e as tarefas são criadas no projeto, com datas seguidas a partir do início do projeto; depois ajustas o que for preciso.
                                                {unstaged.length > 0 && <> As <b className="text-zinc-700 dark:text-zinc-300">{unstaged.length} tarefas</b> que já existem mantêm-se e podes encaixá-las nas fases a seguir.</>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {ROADMAP_TEMPLATES.filter(t => t.stages.length > 0).map(t => {
                                            const taskCount = t.stages.reduce((a, st) => a + (st.tasks?.length || 0), 0)
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    disabled={isLoading}
                                                    onClick={() => handleApplyTemplate(t.id)}
                                                    className="group text-left rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141416] p-5 hover:border-[#ff0054] transition-colors disabled:opacity-60"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-[#ff0054] transition-colors">{t.name}</p>
                                                            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{t.description}</p>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#ff0054] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                                                    </div>
                                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                                        {t.stages.map((st, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/[0.08] text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />{st.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="mt-4 text-[11px] text-zinc-500"><b className="text-zinc-700 dark:text-zinc-300">{t.stages.length}</b> fases · <b className="text-zinc-700 dark:text-zinc-300">{taskCount}</b> tarefas</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {isLoading && <p className="mt-5 text-xs text-zinc-500 flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-[#ff0054] border-t-transparent animate-spin" /> A criar as fases e as tarefas…</p>}
                                </div>
                            )}

                            {/* Project tasks that are not in any phase yet */}
                            {!isRoadmapLoading && roadmap.length > 0 && unstaged.length > 0 && (
                                <div className={cn(PANEL, "p-6")}>
                                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-white/[0.06]">
                                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                            <ListChecks className="w-4 h-4 text-zinc-500" />
                                            Tarefas do projeto sem fase <span className="text-zinc-400">· {unstaged.length}</span>
                                        </div>
                                        <span className="text-[11px] text-zinc-500 hidden sm:block">Escolhe a fase de cada uma para aparecer no roadmap.</span>
                                    </div>
                                    <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.04]">
                                        {unstaged.slice(0, 8).map(t => (
                                            <div key={t.id} className="flex items-center gap-3 py-3">
                                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.completed ? "bg-emerald-500" : "bg-zinc-400")} />
                                                <span className="text-xs text-zinc-800 dark:text-zinc-200 truncate flex-1">{t.title}</span>
                                                {t.due_date && <span className="text-[11px] text-zinc-500 hidden md:inline">{formatShortDate(t.due_date, { day: '2-digit', month: 'short' })}</span>}
                                                <select
                                                    defaultValue=""
                                                    aria-label={`Fase de «${t.title}»`}
                                                    onChange={async (e) => {
                                                        const stageId = e.target.value
                                                        if (!stageId || !localSelectedProjectId) return
                                                        const res = await assignTaskToStage(localSelectedProjectId, t.id, stageId)
                                                        if (res.success) { toast.success('Tarefa colocada na fase'); await reloadRoadmap() } else toast.error(res.error || 'Erro')
                                                    }}
                                                    className="h-8 px-2 rounded-lg bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-[#ff0054] cursor-pointer"
                                                >
                                                    <option value="" disabled>Colocar na fase…</option>
                                                    {roadmap.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    {unstaged.length > 8 && <p className="pt-3 text-[11px] text-zinc-500">E mais {unstaged.length - 8}. Coloca estas primeiro e as restantes aparecem a seguir.</p>}
                                </div>
                            )}

            {/* Roadmap loading skeleton */}
            {isRoadmapLoading && (
                <div className="space-y-6 pb-24 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-6 items-start">
                            <div className="w-16 h-16 rounded-full bg-bg-2 border border-bg-3 shrink-0" />
                            <div className="flex-1 space-y-3 pt-4">
                                <div className="h-4 bg-bg-2 rounded-lg w-1/3" />
                                <div className="h-3 bg-bg-2 rounded-lg w-2/3" />
                                <div className="h-3 bg-bg-2 rounded-lg w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Roadmap Views */}
            <div className={isRoadmapLoading ? "hidden" : ""}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Default Layout (Vertical/Horizontal based on viewMode) */}
                {layoutStyle === 'default' && viewMode === 'vertical' && (
                    <div className="pb-12">
                        <SortableContext items={roadmap.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {roadmap.map((stage, idx) => (
                                <SortableStageItem
                                    key={stage.id}
                                    stage={stage}
                                    idx={idx}
                                    isLast={idx === roadmap.length - 1}
                                    isCurrent={roadmap.findIndex(s => s.progress < 100) === idx}
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
                                    onDeleteTask={(...args: any[]) => runAction(() => (handleDeleteTask as any)(...args))}
                                />
                            ))}
                        </SortableContext>
                    </div>
                )}

                {layoutStyle === 'default' && viewMode === 'horizontal' && (
                    <div className="pb-24">
                        <div className="flex gap-6 overflow-x-auto pb-4 roadmap-scroll">
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
                                        <div className="flex flex-col gap-1 mt-2">
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                                {stage.progress}% • {stage.tasks.filter(t => t.completed).length}/{stage.tasks.length} tarefas
                                            </p>
                                            {(stage.start_date || stage.due_date) && (
                                                <p className="text-[10px] font-semibold text-accent-indigo flex items-center gap-1">
                                                    📅 {stage.start_date ? formatDate(stage.start_date) : '...'} - {stage.due_date ? formatDate(stage.due_date) : '...'}
                                                </p>
                                            )}
                                        </div>
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
                    <div className="relative w-full min-w-0 pb-6">
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
                            className="overflow-x-auto overflow-y-visible roadmap-scroll"
                            style={{ cursor: scrollDirection ? 'none' : 'default' }}
                        >


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
                                                        {stage.progress === 100 ? <Check className="w-20 h-20 text-white" strokeWidth={3} /> : idx + 1}
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
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={stage.progress === 100 || isLoading}
                                                            onClick={() => handleCompleteStage(stage.id)}
                                                            className={cn(stage.progress === 100 ? "text-accent-mint" : "text-text-tertiary hover:text-accent-indigo")}
                                                            title={stage.progress === 100 ? "Fase concluída" : "Concluir Fase"}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                            setEditingStage(stage)
                                                            setNewStageName(stage.name)
                                                            setNewStageColor(stage.color)
                                                            setIsStageModalOpen(true)
                                                        }}>
                                                            <Edit3 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
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
                                                            onClick={() => runAction(() => handleDeleteTask(task.id, stage.id))}
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
                                                    {stage.progress === 100 ? <Check className="w-8 h-8" strokeWidth={3} /> : idx + 1}
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
                    <div className="pb-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {roadmap.map((stage, idx) => {
                            const done = stage.progress === 100
                            const current = roadmap.findIndex(s => s.progress < 100) === idx
                            return (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={cn("bg-white dark:bg-[#0c0c0e] border rounded-2xl p-5 flex flex-col", current ? "border-[#ff0054]/40" : "border-zinc-200/80 dark:border-white/[0.08]")}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold tabular-nums shrink-0",
                                                done ? "bg-[#ff0054] text-white" : current ? "text-[#ff0054] ring-2 ring-[#ff0054]" : "bg-zinc-100 dark:bg-[#141416] text-zinc-500 ring-1 ring-zinc-200 dark:ring-white/[0.08]"
                                            )}>
                                                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Fase {String(idx + 1).padStart(2, '0')}</p>
                                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{stage.name}</h3>
                                            </div>
                                        </div>
                                        <button type="button" title="Editar fase" aria-label="Editar fase" onClick={() => { setEditingStage(stage); setNewStageName(stage.name); setNewStageColor(stage.color); setIsStageModalOpen(true) }} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]">
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${stage.progress}%` }} transition={{ duration: 0.7, delay: idx * 0.05 }} className="h-full rounded-full bg-[#ff0054]" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums w-8 text-right">{stage.progress}%</span>
                                    </div>

                                    <div className="mt-3 -mx-1.5 space-y-0.5 flex-1">
                                        {stage.tasks.map(task => (
                                            <div key={task.id} className="group/task flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id, stage.id) }}
                                                        className={cn("w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors", task.completed ? "bg-[#ff0054] border-[#ff0054] text-white" : "border-zinc-300 dark:border-white/20 hover:border-[#ff0054]")}
                                                    >
                                                        {task.completed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                                                    </button>
                                                    <span
                                                        className={cn("text-xs truncate cursor-pointer", task.completed ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300")}
                                                        onClick={(e) => { e.stopPropagation(); setEditingTask({ id: task.id, title: task.title, stageId: stage.id }); setNewTaskTitle(task.title); setIsTaskModalOpen(true) }}
                                                    >
                                                        {task.title}
                                                    </span>
                                                </div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id, stage.id) }} className="opacity-0 group-hover/task:opacity-100 text-zinc-400 hover:text-rose-500 transition-all" aria-label="Eliminar tarefa">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {stage.tasks.length === 0 && <p className="px-1.5 py-1 text-xs text-zinc-400">Ainda sem tarefas.</p>}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between">
                                        <span className="text-[11px] text-zinc-500 tabular-nums">{stage.tasks.filter(t => t.completed).length}/{stage.tasks.length} tarefas</span>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setTaskStageId(stage.id); setEditingTask(null); setNewTaskTitle(""); setIsTaskModalOpen(true) }}
                                            className="text-[11px] font-medium text-zinc-500 hover:text-[#ff0054] inline-flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Tarefa
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {layoutStyle === 'timeline' && (
                    <div className="pb-6 overflow-x-auto roadmap-scroll">
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
                                                    <span className="text-3xl font-black">{stage.progress === 100 ? <Check className="w-10 h-10 text-white" strokeWidth={4} /> : idx + 1}</span>
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

                {JOURNEY_LAYOUT_OPTIONS.some(option => option.id === layoutStyle) && (
                    <JourneyRoadmapLayouts
                        variant={layoutStyle as JourneyLayoutStyle}
                        stages={roadmap}
                        onToggleTask={handleToggleTask}
                        onAddTask={(stageId) => {
                            setTaskStageId(stageId)
                            setEditingTask(null)
                            setNewTaskTitle("")
                            setIsTaskModalOpen(true)
                        }}
                        onEditStage={(stageId) => {
                            const stage = roadmap.find(item => item.id === stageId)
                            if (!stage) return
                            setEditingStage(stage)
                            setNewStageName(stage.name)
                            setNewStageColor(stage.color)
                            setIsStageModalOpen(true)
                        }}
                    />
                )}
            </DndContext>
            </div>
                        </div>
                    </div>
                </div>
                </div>
            )}

            {/* Stage Create/Edit Modal */}
            <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
                <DialogContent className="bg-[#15161B] border-bg-3 rounded-[24px] overflow-hidden p-0 flex flex-col gap-0 [&>button.absolute]:hidden">
                    <DialogHeader className="h-[60px] bg-[#FF0054] flex flex-row items-center justify-between px-6 m-0 shrink-0">
                        <DialogTitle className="text-[16px] font-bold text-white m-0 mt-1">
                            {editingStage ? "Editar Fase" : "Nova Fase do Roadmap"}
                        </DialogTitle>
                        <button
                            onClick={() => setIsStageModalOpen(false)}
                            className="w-[22px] h-[22px] rounded-full bg-[#15161B] shrink-0 mt-1 cursor-pointer hover:scale-105 transition-transform"
                            aria-label="Close modal"
                        />
                    </DialogHeader>
                    <div className="p-6">
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Fase</Label>
                                <Input
                                    id="name"
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    placeholder="ex: Discovery, Design, Desenvolvimento..."
                                    className="bg-bg-2 border-bg-3 rounded-[5px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color">Cor Identificadora</Label>
                                <div className="flex gap-3">
                                    <ColorInput
                                        id="color"
                                        value={newStageColor}
                                        onChange={(e) => setNewStageColor(e.target.value)}
                                        className="w-12 h-12 p-1 rounded-[5px] bg-bg-2 border-bg-3"
                                    />
                                    <Input
                                        value={newStageColor}
                                        onChange={(e) => setNewStageColor(e.target.value)}
                                        className="flex-1 bg-bg-2 border-bg-3 rounded-[5px]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Data de Início</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={newStageStartDate}
                                        onChange={(e) => setNewStageStartDate(e.target.value)}
                                        className="bg-bg-2 border-bg-3 rounded-[5px] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Data de Entrega (Due Date)</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={newStageDueDate}
                                        onChange={(e) => setNewStageDueDate(e.target.value)}
                                        className="bg-bg-2 border-bg-3 rounded-[5px] text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                variant="ghost"
                                onClick={() => setIsStageModalOpen(false)}
                                className="rounded-[5px]"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveStage}
                                disabled={isLoading || !newStageName.trim()}
                                className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-[5px] px-8"
                            >
                                {isLoading ? "Salvando..." : editingStage ? "Salvar Alterações" : "Criar Fase"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Template Selection Modal */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="bg-[#15161B] border-bg-3 rounded-[24px] max-w-[700px] max-h-[780px] overflow-hidden p-0 flex flex-col gap-0 [&>button.absolute]:hidden">
                    <DialogHeader className="h-[60px] bg-[#FF0054] flex flex-row items-center justify-between px-6 m-0 shrink-0">
                        <DialogTitle className="text-[16px] font-bold text-white m-0 mt-1">
                            Escolha um template
                        </DialogTitle>
                        <button
                            onClick={() => setIsTemplateModalOpen(false)}
                            className="w-[22px] h-[22px] rounded-full bg-[#15161B] shrink-0 mt-1 cursor-pointer hover:scale-105 transition-transform"
                            aria-label="Close template modal"
                        />
                    </DialogHeader>

                    <div className="overflow-y-auto custom-scrollbar p-6 flex-1 flex flex-col">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {ROADMAP_TEMPLATES.map(template => (
                                <motion.button
                                    key={template.id}
                                    onClick={() => handleApplyTemplate(template.id)}
                                    disabled={isLoading}
                                    className="p-6 bg-[#2E313C] border border-bg-3 rounded-xl text-left hover:border-accent-mint/50 hover:bg-[#2E313C]/80 transition-all group"
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
                                                    className="px-2 py-0.5 bg-[#FF0054]/10 rounded text-[9px] font-bold uppercase tracking-wider text-[#FF0054] border border-[#FF0054]"
                                                >
                                                    {stage.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <p className="text-[11px] text-text-tertiary text-center pb-2 mt-auto">
                            ⚠️ Aplicar um template irá substituir todas as fases existentes
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Layout Selection Modal */}
            <Dialog open={isLayoutModalOpen} onOpenChange={setIsLayoutModalOpen}>
                <DialogContent className="bg-[#15161B] border-bg-3 rounded-[24px] max-w-[800px] overflow-hidden p-0 flex flex-col gap-0 [&>button.absolute]:hidden">
                    <DialogHeader className="h-[60px] bg-[#FF0054] flex flex-row items-center justify-between px-6 m-0 shrink-0">
                        <DialogTitle className="text-[16px] font-bold text-white m-0 mt-1">
                            Escolher Layout do Roadmap
                        </DialogTitle>
                        <button
                            onClick={() => setIsLayoutModalOpen(false)}
                            className="w-[22px] h-[22px] rounded-full bg-[#15161B] shrink-0 mt-1 cursor-pointer hover:scale-105 transition-transform"
                            aria-label="Close modal"
                        />
                    </DialogHeader>

                    <div className="grid max-h-[620px] grid-cols-2 gap-4 overflow-y-auto p-6 md:grid-cols-3">
                        {/* Default Layout */}
                        <motion.button
                            onClick={() => {
                                setLayoutStyle('default')
                                setIsLayoutModalOpen(false)
                            }}
                            className={cn(
                                "p-5 bg-[#2E313C] border rounded-[5px] text-left transition-all group",
                                layoutStyle === 'default' ? "border-[#FF0054] ring-2 ring-[#FF0054]/20" : "border-bg-3 hover:border-[#FF0054]/50"
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
                                "p-5 bg-[#2E313C] border rounded-[5px] text-left transition-all group",
                                layoutStyle === 'numbered' ? "border-[#FF0054] ring-2 ring-[#FF0054]/20" : "border-bg-3 hover:border-[#FF0054]/50"
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
                                "p-5 bg-[#2E313C] border rounded-[5px] text-left transition-all group",
                                layoutStyle === 'minimal' ? "border-[#FF0054] ring-2 ring-[#FF0054]/20" : "border-bg-3 hover:border-[#FF0054]/50"
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
                                "p-5 bg-[#2E313C] border rounded-[5px] text-left transition-all group",
                                layoutStyle === 'cards' ? "border-[#FF0054] ring-2 ring-[#FF0054]/20" : "border-bg-3 hover:border-[#FF0054]/50"
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
                                "p-5 bg-[#2E313C] border rounded-[5px] text-left transition-all group",
                                layoutStyle === 'timeline' ? "border-[#FF0054] ring-2 ring-[#FF0054]/20" : "border-bg-3 hover:border-[#FF0054]/50"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-2xl mb-2">⏳</div>
                            <h3 className="text-[14px] font-bold text-text-primary mb-1">Timeline Horizontal</h3>
                            <p className="text-[11px] text-text-tertiary">Linha do tempo com setas conectoras</p>
                        </motion.button>

                        {JOURNEY_LAYOUT_OPTIONS.map(option => (
                            <motion.button
                                key={option.id}
                                onClick={() => {
                                    setLayoutStyle(option.id)
                                    setIsLayoutModalOpen(false)
                                }}
                                className={cn(
                                    "p-5 bg-[#2E313C] border rounded-[5px] text-left transition-all group",
                                    layoutStyle === option.id ? "border-[#FF0054] ring-2 ring-[#FF0054]/20" : "border-bg-3 hover:border-[#FF0054]/50"
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <option.icon className="w-5 h-5 mb-3 text-[#FF0054]" />
                                <h3 className="text-[14px] font-bold text-text-primary mb-1">{option.name}</h3>
                                <p className="text-[11px] text-text-tertiary">{option.description}</p>
                            </motion.button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Background Selection Modal */}
            <Dialog open={isBgModalOpen} onOpenChange={setIsBgModalOpen}>
                <DialogContent className="bg-[#15161B] border-bg-3 rounded-[24px] max-w-[800px] overflow-hidden p-0 flex flex-col gap-0 [&>button.absolute]:hidden">
                    <DialogHeader className="h-[60px] bg-accent-indigo flex flex-row items-center justify-between px-6 m-0 shrink-0">
                        <DialogTitle className="text-[16px] font-bold text-white m-0 mt-1">
                            Personalização do Fundo
                        </DialogTitle>
                        <button
                            onClick={() => setIsBgModalOpen(false)}
                            className="w-[22px] h-[22px] rounded-full bg-[#15161B] shrink-0 mt-1 cursor-pointer hover:scale-105 transition-transform"
                            aria-label="Close modal"
                        />
                    </DialogHeader>

                    <div className="p-6 max-h-[600px] overflow-y-auto">
                        <div className="grid grid-cols-4 gap-4">
                            <button
                                onClick={() => {
                                    setBgStyle('default')
                                    setIsBgModalOpen(false)
                                }}
                                className={cn(
                                    "h-24 rounded-[8px] w-full transition-all relative overflow-hidden group border border-[#313131] bg-[#FAFAFA]",
                                    bgStyle === 'default' ? "ring-2 ring-accent-indigo ring-offset-2 ring-offset-[#15161B]" : "hover:opacity-80"
                                )}
                            >
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <div className="text-xl">⬜</div>
                                    <span className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider">Claro Padrão</span>
                                </div>
                                {bgStyle === 'default' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <Check className="text-white" size={20} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                            {galleryItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setBgStyle(item.value)
                                        setIsBgModalOpen(false)
                                    }}
                                    className={cn(
                                        "h-24 rounded-[8px] w-full transition-all relative overflow-hidden group border border-[#313131]",
                                        bgStyle === item.value ? "ring-2 ring-accent-indigo ring-offset-2 ring-offset-[#15161B]" : "hover:opacity-80"
                                    )}
                                >
                                    {item.type === 'gradient' ? (
                                        <div className="w-full h-full" style={{ background: item.value }} />
                                    ) : (
                                        <img loading="lazy" decoding="async" src={item.value} alt={item.label} className="w-full h-full object-cover" />
                                    )}

                                    {bgStyle === item.value && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <Check className="text-white" size={20} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
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

            {/* Notas do Projeto */}
            {localSelectedProjectId && (
                <ProjectNotesPanel
                    projectId={localSelectedProjectId}
                    initialNotes={initialNotes}
                    isClientView={false}
                    isOpen={isNotesOpen}
                    onClose={() => setIsNotesOpen(false)}
                />
            )}
        </WorkspaceShell>
    )
}

function SortableStageItem({
    stage,
    idx,
    isLast,
    isCurrent,
    onEdit,
    onDelete,
    onToggleTask,
    onAddTask,
    onEditTask,
    onDeleteTask
}: {
    stage: RoadmapStage
    idx: number
    isLast: boolean
    isCurrent: boolean
    onEdit: () => void
    onDelete: () => void
    onToggleTask: (taskId: string, stageId: string) => void
    onAddTask: (stageId: string) => void
    onEditTask: (task: { id: string, title: string, stageId: string }) => void
    onDeleteTask: (taskId: string, stageId: string) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id })
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, position: 'relative' as const }
    const done = stage.progress === 100
    const doneTasks = stage.tasks.filter(t => t.completed).length
    const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : '…'

    return (
        <div ref={setNodeRef} style={style} className={cn("grid grid-cols-[28px_1fr] gap-4", isDragging && "opacity-50")}>
            {/* Node on the line (the line continues to the next phase) */}
            <div className="relative flex justify-center pt-5">
                {!isLast && <span className="absolute top-5 -bottom-5 w-px bg-zinc-200 dark:bg-white/[0.08]" />}
                {!isLast && done && <span className="absolute top-5 -bottom-5 w-px bg-[#ff0054]" />}
                <span className={cn(
                    "relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold tabular-nums",
                    done && "bg-[#ff0054] text-white",
                    !done && isCurrent && "bg-white dark:bg-[#0c0c0e] text-[#ff0054] ring-2 ring-[#ff0054]",
                    !done && !isCurrent && "bg-zinc-100 dark:bg-[#141416] text-zinc-500 ring-1 ring-zinc-200 dark:ring-white/[0.08]"
                )}>
                    {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : String(idx + 1).padStart(2, '0')}
                </span>
            </div>

            {/* Phase */}
            <div className={cn(
                "mb-5 bg-white dark:bg-[#0c0c0e] border rounded-2xl p-5 transition-colors group/stage",
                isCurrent ? "border-[#ff0054]/40" : "border-zinc-200/80 dark:border-white/[0.08]"
            )}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 min-w-0">
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 mt-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover/stage:opacity-100 transition-opacity" title="Arrastar para reordenar">
                            <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Fase {String(idx + 1).padStart(2, '0')}</span>
                                <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium",
                                    done ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        : isCurrent ? "bg-[#ff0054]/10 text-[#ff0054] border-[#ff0054]/20"
                                            : "bg-zinc-100 text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]"
                                )}>
                                    {done ? 'Concluída' : isCurrent ? 'Em curso' : 'Por iniciar'}
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">{stage.name}</h3>
                            <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                                {doneTasks}/{stage.tasks.length} tarefas · {stage.progress}%
                                {(stage.start_date || stage.due_date) && <> · {fmt(stage.start_date)} – {fmt(stage.due_date)}</>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => onAddTask(stage.id)} className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-xs font-medium text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Tarefa
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]" aria-label="Mais ações">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-[#141416] border-zinc-200 dark:border-white/[0.08] rounded-xl">
                                <DropdownMenuItem onClick={onEdit} className="text-xs font-medium cursor-pointer"><Edit3 className="w-3.5 h-3.5 mr-2" /> Editar fase</DropdownMenuItem>
                                <DropdownMenuItem className="text-rose-500 text-xs font-medium cursor-pointer" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar fase</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="mt-4 h-1 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-[#ff0054] transition-all duration-700" style={{ width: `${stage.progress}%` }} />
                </div>

                <div className="mt-3 divide-y divide-zinc-200/60 dark:divide-white/[0.04]">
                    {stage.tasks.map(task => (
                        <div key={task.id} className="group/task flex items-center justify-between gap-3 py-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => onToggleTask(task.id, stage.id)}
                                    aria-label={task.completed ? 'Marcar como por fazer' : 'Marcar como feita'}
                                    className={cn(
                                        "w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors",
                                        task.completed ? "bg-[#ff0054] border-[#ff0054] text-white" : "border-zinc-300 dark:border-white/20 hover:border-[#ff0054]"
                                    )}
                                >
                                    {task.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                                </button>
                                <span
                                    onClick={() => onEditTask({ id: task.id, title: task.title, stageId: stage.id })}
                                    className={cn("text-xs cursor-pointer truncate", task.completed ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white")}
                                >
                                    {task.title}
                                </span>
                            </div>
                            <button type="button" onClick={() => onDeleteTask(task.id, stage.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover/task:opacity-100 transition-opacity" aria-label="Eliminar tarefa">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {stage.tasks.length === 0 && <p className="py-3 text-xs text-zinc-400">Ainda sem tarefas nesta fase.</p>}
                </div>
            </div>
        </div>
    )
}
