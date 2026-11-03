"use client"

import * as React from "react"
import type { Project, Stage } from "./ProjectsClient"
import {
    ChevronDown,
    MoreHorizontal,
    Pencil,
    Trash2,
    User,
    Check,
    Plus,
    CalendarClock,
    Archive,
    Copy
} from "lucide-react"
import { updateProjectStatusLabel, archiveProject, deleteProject, duplicateProject } from "@/app/actions/projects"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { format, parseISO, differenceInDays } from "date-fns"
import { pt } from "date-fns/locale"
import { toast } from "sonner"

import { RoadmapStage, archiveRoadmapTask, duplicateRoadmapTask, deleteRoadmapTask } from "@/app/actions/roadmap"
import { useCurrency } from "@/components/CurrencyUtils"
import { PANEL, TABLE_HEAD, TABLE_ROW, Pill, type Tone } from "@/components/workspace/ui"

interface Task {
    id: string
    title: string
    status: string
    completed: boolean
    planned_start?: string
    due_date?: string
    price?: string
    type?: string
}

interface ProjectStandardViewProps {
    projects: Project[]
    stages: (Stage | RoadmapStage)[]
    onRefresh: () => void
    onAddStage?: () => void
    onEditStage?: (stage: Stage) => void
    onDeleteStage?: (stageId: string) => void
    onAddProject?: (stageId?: string) => void
    onViewProject?: (project: Project) => void
    onAddTask?: (stageId: string) => void
    isTaskMode?: boolean
    groupingField?: 'stage_id' | 'category'
    onViewTask?: (task: any) => void
    onEdit?: (project: Project) => void
    projectId?: string
}

function RowActionsPopover({
    item,
    isTaskMode,
    projectId,
    onEdit,
    onRefresh
}: {
    item: any
    isTaskMode: boolean
    projectId?: string
    onEdit: () => void
    onRefresh: () => void
}) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)

    const handleArchive = async () => {
        setIsLoading(true)
        try {
            if (isTaskMode) {
                if (!projectId) {
                    toast.error("Erro: Projeto não encontrado")
                    return
                }
                const res = await archiveRoadmapTask(item.id, projectId)
                if (res.success) {
                    toast.success("Tarefa arquivada com sucesso")
                    onRefresh()
                } else {
                    toast.error(res.error || "Erro ao arquivar tarefa")
                }
            } else {
                const res = await archiveProject(item.id)
                if (res.success) {
                    toast.success("Projeto arquivado com sucesso")
                    onRefresh()
                } else {
                    toast.error(res.error || "Erro ao arquivar projeto")
                }
            }
        } catch (err) {
            toast.error("Ocorreu um erro")
        } finally {
            setIsLoading(false)
            setIsOpen(false)
        }
    }

    const handleDuplicate = async () => {
        setIsLoading(true)
        try {
            if (isTaskMode) {
                if (!projectId) {
                    toast.error("Erro: Projeto não encontrado")
                    return
                }
                const res = await duplicateRoadmapTask(item.id, projectId)
                if (res.success) {
                    toast.success("Tarefa duplicada com sucesso")
                    onRefresh()
                } else {
                    toast.error(res.error || "Erro ao duplicar tarefa")
                }
            } else {
                const res = await duplicateProject(item.id)
                if (res.success) {
                    toast.success("Projeto duplicado com sucesso")
                    onRefresh()
                } else {
                    toast.error(res.error || "Erro ao duplicar projeto")
                }
            }
        } catch (err) {
            toast.error("Ocorreu um erro")
        } finally {
            setIsLoading(false)
            setIsOpen(false)
        }
    }

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            if (isTaskMode) {
                if (!projectId) {
                    toast.error("Erro: Projeto não encontrado")
                    return
                }
                const res = await deleteRoadmapTask(item.id, projectId)
                if (res.success) {
                    toast.success("Tarefa eliminada com sucesso")
                    onRefresh()
                } else {
                    toast.error("Erro ao eliminar tarefa")
                }
            } else {
                const res = await deleteProject(item.id)
                if (res.success) {
                    toast.success("Projeto eliminado com sucesso")
                    onRefresh()
                } else {
                    toast.error(res.error || "Erro ao eliminar projeto")
                }
            }
        } catch (err) {
            toast.error("Ocorreu um erro")
        } finally {
            setIsLoading(false)
            setIsOpen(false)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="Ações"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                className="w-48 bg-bg-1 border border-bg-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-1.5 rounded-xl z-[100]"
            >
                <div className="flex flex-col gap-1 w-full">
                    <button
                        onClick={() => {
                            onEdit()
                            setIsOpen(false)
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold rounded-lg text-left hover:bg-bg-2 text-text-primary transition-all"
                    >
                        <Pencil className="w-4 h-4 text-accent-indigo" />
                        Editar
                    </button>
                    <button
                        onClick={handleArchive}
                        disabled={isLoading}
                        className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold rounded-lg text-left hover:bg-bg-2 text-text-primary transition-all"
                    >
                        <Archive className="w-4 h-4 text-amber-500" />
                        Arquivar
                    </button>
                    <button
                        onClick={handleDuplicate}
                        disabled={isLoading}
                        className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold rounded-lg text-left hover:bg-bg-2 text-text-primary transition-all"
                    >
                        <Copy className="w-4 h-4 text-blue-500" />
                        Duplicar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold rounded-lg text-left hover:bg-red-500/10 text-red-500 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const PROJECT_STATUSES = [
    { name: "Em negociação", color: "#3c1f6f" },
    { name: "Aprovado", color: "#a001d0" },
    { name: "Em andamento", color: "#e26200" },
    { name: "Pausado", color: "#422600" },
    { name: "Cancelado", color: "#d60e00" },
    { name: "Em revisão", color: "#0021ce" },
    { name: "Concluído", color: "#489f68" },
]

export function ProjectStandardView({
    projects,
    stages,
    onRefresh,
    onAddStage,
    onEditStage,
    onDeleteStage,
    onAddProject,
    onViewProject,
    onAddTask,
    isTaskMode = false,
    groupingField = 'stage_id',
    onViewTask,
    onEdit,
    projectId
}: ProjectStandardViewProps) {
    const { formatPrice } = useCurrency()
    const [collapsedStages, setCollapsedStages] = React.useState<Record<string, boolean>>({})

    const toggleStage = (stageId: string) => {
        setCollapsedStages(prev => ({
            ...prev,
            [stageId]: !prev[stageId]
        }))
    }

    // Same columns for the header and the rows, as in the roadmaps table
    const GRID = "grid grid-cols-[minmax(220px,2.2fr)_72px_minmax(120px,1fr)_minmax(110px,0.9fr)_minmax(120px,1fr)_70px_minmax(100px,0.9fr)_minmax(100px,0.9fr)_36px] gap-4 items-center"

    return (
        <div className="flex flex-col gap-5 w-full">
            {stages.map((stage: Stage | RoadmapStage) => {
                const stageProjects = isTaskMode
                    ? []
                    : projects.filter((p: Project) => {
                        const val = p[groupingField]
                        return val === stage.id || (groupingField === 'stage_id' && p.status === stage.id)
                    })

                const stageTasks = isTaskMode && 'tasks' in stage ? stage.tasks : []
                const items = isTaskMode ? stageTasks : stageProjects
                const isCollapsed = collapsedStages[stage.id]
                const doneCount = isTaskMode ? (stageTasks as { completed: boolean }[]).filter(t => t.completed).length : 0

                return (
                    <div key={stage.id} className={cn(PANEL, "overflow-hidden")}>
                        {/* Phase header */}
                        <div
                            onClick={() => toggleStage(stage.id)}
                            className="group/stage px-6 py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                                </motion.div>
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color || '#ff0054' }} />
                                <span className="text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100 truncate">{stage.name}</span>
                                <span className="text-[11px] text-zinc-500 tabular-nums">
                                    {isTaskMode ? `${doneCount}/${items.length} concluídas` : `${items.length} ${items.length === 1 ? 'projeto' : 'projetos'}`}
                                </span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button type="button" aria-label="Opções da fase" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#0c0c0e] border-zinc-200/80 dark:border-white/[0.08] shadow-xl p-1 rounded-xl">
                                    <DropdownMenuItem
                                        onClick={() => onEditStage?.(stage as Stage)}
                                        className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-lg cursor-pointer font-medium text-zinc-700 dark:text-zinc-200"
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                                        {groupingField === 'category' ? 'Editar grupo' : 'Editar fase'}
                                    </DropdownMenuItem>
                                    {groupingField === 'stage_id' && (
                                        <DropdownMenuItem
                                            onClick={() => onDeleteStage?.(stage.id)}
                                            className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-lg cursor-pointer font-medium text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Eliminar fase
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Table */}
                        <AnimatePresence initial={false}>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="overflow-hidden border-t border-zinc-200/80 dark:border-white/[0.06]"
                                >
                                    <div className="w-full overflow-x-auto no-scrollbar">
                                        <div className="min-w-[1080px]">
                                            <div className={cn(TABLE_HEAD, GRID)}>
                                                <span>{isTaskMode ? "Tarefa" : "Projeto"}</span>
                                                <span>Responsável</span>
                                                <span>Estado</span>
                                                <span>{isTaskMode ? "Concluída" : "Progresso"}</span>
                                                <span>Cronograma</span>
                                                <span>{isTaskMode ? "Subtarefas" : "Tarefas"}</span>
                                                <span>{isTaskMode ? "Preço" : "Orçamento"}</span>
                                                <span>{isTaskMode ? "Categoria" : "Cliente"}</span>
                                                <span />
                                            </div>

                                            {items.map((item: Project | Task) => {
                                                const task = item as Task
                                                const project = item as Project
                                                return (
                                                    <div key={item.id} className={cn(TABLE_ROW, GRID, "group")}>
                                                        {/* Name */}
                                                        <button
                                                            type="button"
                                                            onClick={() => (isTaskMode ? onViewTask?.(item) : onViewProject?.(project))}
                                                            className="flex items-center gap-3 min-w-0 text-left"
                                                        >
                                                            {!isTaskMode && (
                                                                project.cover_url ? (
                                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.08] shrink-0">
                                                                        <Image src={project.cover_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm">
                                                                        <span className="text-red-500 font-bold text-xs">{(project.name || "P")[0]?.toUpperCase()}</span>
                                                                    </div>
                                                                )
                                                            )}
                                                            <span className={cn(
                                                                "truncate transition-colors group-hover:text-[#ff0054]",
                                                                isTaskMode
                                                                    ? cn("text-[13px] font-medium", task.completed ? "text-zinc-400 line-through decoration-zinc-400/60" : "text-zinc-900 dark:text-zinc-100")
                                                                    : "text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100"
                                                            )}>
                                                                {isTaskMode ? task.title : project.name}
                                                            </span>
                                                        </button>

                                                        {/* Owner / Assignee */}
                                                        <div>
                                                            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 overflow-hidden">
                                                                {isTaskMode ? (
                                                                    <User className="w-3.5 h-3.5 text-zinc-400" />
                                                                ) : project.creator?.avatar_url ? (
                                                                    <Image src={project.creator.avatar_url} alt="" width={28} height={28} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span>{project.creator?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Status */}
                                                        <div className="min-w-0">
                                                            {isTaskMode ? (
                                                                <TaskStatusPill status={task.status} completed={task.completed} />
                                                            ) : (
                                                                <StatusCell
                                                                    projectId={project.id}
                                                                    currentStatusName={project.status_label || "Em negociação"}
                                                                    onRefresh={onRefresh}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Completion / Progress */}
                                                        <div>
                                                            {isTaskMode ? (
                                                                <span className={cn(
                                                                    "w-5 h-5 rounded-md border flex items-center justify-center",
                                                                    task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 dark:border-white/[0.15]"
                                                                )}>
                                                                    {task.completed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                                                                        <div className="h-full rounded-full bg-[#ff0054] transition-all duration-700" style={{ width: `${project.progress || 0}%` }} />
                                                                    </div>
                                                                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums w-9 text-right">{project.progress || 0}%</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Timeline */}
                                                        <TimelineCell
                                                            startDate={isTaskMode ? task.planned_start : project.start_date}
                                                            endDate={isTaskMode ? task.due_date : project.due_date}
                                                        />

                                                        {/* Subtasks / Tasks */}
                                                        <span className="text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">{isTaskMode ? "0" : `0/${project.tasks_count || 0}`}</span>

                                                        {/* Price / Budget */}
                                                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 tabular-nums truncate">
                                                            {formatPrice(isTaskMode ? (task.price || "0,00") : (project.budget_amount || 0))}
                                                        </span>

                                                        {/* Category / Client */}
                                                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{isTaskMode ? (task.type || "Geral") : (project.brand?.name || "—")}</span>

                                                        {/* Actions */}
                                                        <RowActionsPopover
                                                            item={item}
                                                            isTaskMode={isTaskMode}
                                                            projectId={projectId}
                                                            onEdit={() => (isTaskMode ? onViewTask?.(item) : onEdit?.(project))}
                                                            onRefresh={onRefresh}
                                                        />
                                                    </div>
                                                )
                                            })}

                                            {/* Add */}
                                            <button
                                                type="button"
                                                onClick={() => (isTaskMode ? onAddTask?.(stage.id) : onAddProject?.(stage.id))}
                                                className="w-full px-6 py-3 flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-[#ff0054] hover:bg-zinc-50 dark:hover:bg-white/[0.02] border-t border-zinc-200/60 dark:border-white/[0.04] transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                {isTaskMode ? "Adicionar tarefa" : "Adicionar projeto"}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}

            {!isTaskMode && groupingField === 'stage_id' && stages.length > 0 && (
                <button
                    type="button"
                    onClick={onAddStage}
                    className="w-full border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl px-6 py-4 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/[0.15] transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Criar outra etapa
                </button>
            )}
        </div>
    )
}

const TASK_STATUS: Record<string, { label: string, tone: Tone }> = {
    done: { label: "Concluída", tone: "green" },
    completed: { label: "Concluída", tone: "green" },
    in_progress: { label: "Em curso", tone: "indigo" },
    doing: { label: "Em curso", tone: "indigo" },
    review: { label: "Em revisão", tone: "amber" },
    in_review: { label: "Em revisão", tone: "amber" },
    blocked: { label: "Bloqueada", tone: "rose" },
    todo: { label: "Por fazer", tone: "zinc" },
    backlog: { label: "Por fazer", tone: "zinc" },
}

function TaskStatusPill({ status, completed }: { status?: string, completed?: boolean }) {
    const s = completed ? TASK_STATUS.done : TASK_STATUS[(status || "").toLowerCase()] || { label: status || "Por fazer", tone: "zinc" as Tone }
    return <Pill tone={s.tone}>{s.label}</Pill>
}

function StatusCell({ projectId, currentStatusName, onRefresh }: { projectId: string, currentStatusName: string, onRefresh: () => void }) {
    const activeStatus = PROJECT_STATUSES.find(s => s.name === currentStatusName) || PROJECT_STATUSES[0]
    const [selectedStatus, setSelectedStatus] = React.useState(activeStatus)
    const [open, setOpen] = React.useState(false)

    // Follow the prop when the list is refreshed
    const [prevName, setPrevName] = React.useState(currentStatusName)
    if (prevName !== currentStatusName) {
        setPrevName(currentStatusName)
        setSelectedStatus(activeStatus)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-[11px] font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition-colors max-w-full"
                >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: selectedStatus.color }} />
                    <span className="truncate">{selectedStatus.name}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="start"
                className="w-52 p-1 bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] shadow-xl rounded-xl z-[100]"
            >
                {PROJECT_STATUSES.map((status) => (
                    <button
                        key={status.name}
                        type="button"
                        onClick={async () => {
                            setSelectedStatus(status)
                            setOpen(false)
                            await updateProjectStatusLabel(projectId, status.name)
                            onRefresh()
                        }}
                        className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]",
                            selectedStatus.name === status.name ? "text-zinc-900 dark:text-white font-semibold" : "text-zinc-600 dark:text-zinc-300"
                        )}
                    >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: status.color }} />
                        <span className="flex-1">{status.name}</span>
                        {selectedStatus.name === status.name && <Check className="w-3.5 h-3.5 text-[#ff0054]" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}

function TimelineCell({ startDate, endDate }: { startDate?: string | null, endDate?: string | null }) {
    if (!startDate && !endDate) return <span className="text-xs text-zinc-400">—</span>

    const start = startDate ? parseISO(startDate) : null
    const end = endDate ? parseISO(endDate) : null
    const fmt = (d: Date) => format(d, "d MMM", { locale: pt })
    const label = start && end ? `${fmt(start)} – ${fmt(end)}` : end ? fmt(end) : `Desde ${fmt(start!)}`
    const title = start && end ? `${differenceInDays(end, start)} dias` : undefined

    return (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap" title={title}>
            <CalendarClock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            {label}
        </span>
    )
}
