"use client"

import * as React from "react"
import type { Project, Stage } from "./ProjectsClient"
import {
    ChevronDown,
    MoreHorizontal,
    Pencil,
    Trash2,
    User,
    FileCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateProjectStatusLabel } from "@/app/actions/projects"
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
import { PopoverArrow } from "@radix-ui/react-popover"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { format, parseISO, differenceInDays } from "date-fns"
import { pt } from "date-fns/locale"

import { RoadmapStage } from "@/app/actions/roadmap"
import { useCurrency } from "@/components/CurrencyUtils"

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
    groupingField = 'stage_id'
}: ProjectStandardViewProps) {
    const { formatPrice } = useCurrency()
    const [collapsedStages, setCollapsedStages] = React.useState<Record<string, boolean>>({})

    const toggleStage = (stageId: string) => {
        setCollapsedStages(prev => ({
            ...prev,
            [stageId]: !prev[stageId]
        }))
    }

    return (
        <div className="flex flex-col gap-8 w-full font-inter">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Inter+Tight:wght@400;500;600;700&display=swap');
                .font-inter { font-family: 'Inter', sans-serif; font-feature-settings: 'tnum' on, 'lnum' on; letter-spacing: -0.01em; }
                .font-inter-tight { font-family: 'Inter Tight', sans-serif; }
            `}</style>

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

                return (
                    <div key={stage.id} className="flex flex-col w-full">
                        {/* Stage Header */}
                        <div
                            onClick={() => toggleStage(stage.id)}
                            className="h-[50px] w-full rounded-[12px] flex items-center justify-between px-4 cursor-pointer transition-all hover:brightness-110"
                            style={{ backgroundColor: `${stage.color}4D` }}
                        >
                            <div className="flex items-center gap-3">
                                <motion.div
                                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="w-5 h-5" style={{ color: stage.color }} />
                                </motion.div>
                                <span className="text-sm font-bold uppercase tracking-tight" style={{ color: stage.color }}>
                                    {stage.name}
                                </span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/10">
                                        <MoreHorizontal className="w-5 h-5" style={{ color: stage.color }} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-bg-1 border-bg-3 shadow-2xl p-1.5 rounded-2xl">
                                    <DropdownMenuItem
                                        onClick={() => onEditStage?.(stage as Stage)}
                                        className="flex items-center gap-3 text-xs p-2.5 rounded-xl cursor-pointer hover:bg-bg-2 font-bold text-text-primary"
                                    >
                                        <Pencil className="w-4 h-4 text-accent-indigo" />
                                        {groupingField === 'category' ? 'Editar Grupo' : 'Editar Etapa'}
                                    </DropdownMenuItem>
                                    {groupingField === 'stage_id' && (
                                        <DropdownMenuItem
                                            onClick={() => onDeleteStage?.(stage.id)}
                                            className="flex items-center gap-3 text-xs p-2.5 rounded-xl cursor-pointer hover:bg-red-500/10 font-bold text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Etapa
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Table Section */}
                        <AnimatePresence initial={false}>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-[20px] w-full overflow-x-auto no-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="h-[45px]">
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1" style={{ borderLeft: `10px solid ${stage.color}`, width: "325px", minWidth: "325px" }}>{isTaskMode ? "Tarefa" : "Projecto"}</th>
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1" style={{ width: "160px", minWidth: "160px" }}>Responsável</th>
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1" style={{ width: "160px", minWidth: "160px" }}>Status</th>
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1" style={{ width: "166px", minWidth: "166px" }}>{isTaskMode ? "Concluída" : "Progresso"}</th>
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1" style={{ width: "166px", minWidth: "166px" }}>Cronograma</th>
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1">{isTaskMode ? "Subtarefas" : "Tarefas"}</th>
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1">{isTaskMode ? "Preço" : "Orçamento"}</th>
                                                    <th className="border border-bg-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-tertiary bg-bg-1">{isTaskMode ? "Categoria" : "Cliente"}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item: Project | Task) => (
                                                    <tr key={item.id} className="h-[52px]">
                                                        {/* Name */}
                                                        <td className="border border-bg-3 px-4 bg-bg-0" style={{ borderLeft: `10px solid ${stage.color}` }}>
                                                            <div
                                                                className="flex items-center gap-3 cursor-pointer group/name"
                                                                onClick={() => {
                                                                    if (!isTaskMode) {
                                                                        onViewProject?.(item as Project)
                                                                    }
                                                                }}
                                                            >
                                                                {(!isTaskMode && (item as Project).cover_url) && (
                                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-bg-3 shrink-0 group-hover/name:brightness-110 transition-all">
                                                                        <Image src={(item as Project).cover_url!} alt="" width={32} height={32} className="object-cover" />
                                                                    </div>
                                                                )}
                                                                <span className="text-[16px] font-normal text-text-primary truncate max-w-[260px] group-hover/name:text-accent-indigo transition-colors">
                                                                    {isTaskMode ? (item as Task).title : (item as Project).name}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Owner / Assignee */}
                                                        <td className="border border-bg-3 px-4 bg-bg-0 text-center">
                                                            <div className="flex justify-center -space-x-2">
                                                                <div className="w-[40px] h-[40px] rounded-full border-2 border-bg-0 bg-bg-2 flex items-center justify-center text-[14px] font-bold overflow-hidden shadow-sm">
                                                                    {isTaskMode ? (
                                                                        <User className="w-4 h-4 text-text-tertiary" />
                                                                    ) : (item as Project).creator?.avatar_url ? (
                                                                        <Image src={(item as Project).creator!.avatar_url!} alt="" width={40} height={40} />
                                                                    ) : (
                                                                        <span>{(item as Project).creator?.name?.charAt(0) || "U"}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="border border-bg-3 bg-bg-0 p-0 h-[52px]">
                                                            <div className="w-full h-full">
                                                                {isTaskMode ? (
                                                                    <div className="w-full h-full flex items-center justify-center bg-bg-2/50">
                                                                        <span className="text-[14px] font-medium text-text-secondary uppercase tracking-tight">{(item as Task).status || "Pendente"}</span>
                                                                    </div>
                                                                ) : (
                                                                    <StatusCell
                                                                        projectId={(item as Project).id}
                                                                        currentStatusName={(item as Project).status_label || "Em negociação"}
                                                                        onRefresh={onRefresh}
                                                                    />
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Progress / Completion */}
                                                        <td className="border border-bg-3 bg-bg-0 p-[6px] text-center">
                                                            {isTaskMode ? (
                                                                <div className="flex items-center justify-center">
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                                                                        (item as Task).completed ? "bg-green-500 border-green-500 text-white" : "border-bg-3"
                                                                    )}>
                                                                        {(item as Task).completed && <FileCheck className="w-4 h-4" />}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full relative bg-transparent overflow-hidden rounded-sm">
                                                                    <div
                                                                        className="h-full bg-[#05b137] transition-all duration-1000"
                                                                        style={{ width: `${(item as Project).progress || 0}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Timeline */}
                                                        <td className="border border-bg-3 bg-bg-0 px-4">
                                                            <TimelineCell
                                                                startDate={isTaskMode ? (item as Task).planned_start : (item as Project).start_date}
                                                                endDate={isTaskMode ? (item as Task).due_date : (item as Project).due_date}
                                                            />
                                                        </td>

                                                        <td className="border border-bg-3 bg-bg-0 px-4 text-center">
                                                            <span className="text-[16px] font-normal text-text-tertiary">{isTaskMode ? "0" : `0/${(item as Project).tasks_count || 0}`}</span>
                                                        </td>

                                                        {/* Budget / Price */}
                                                        <td className="border border-bg-3 bg-bg-0 px-4 text-center">
                                                            <span className="text-[16px] font-normal text-[#05b137]">
                                                                {formatPrice(isTaskMode ? ((item as Task).price || "0,00") : "0,00")}
                                                            </span>
                                                        </td>

                                                        {/* Client / Category */}
                                                        <td className="border border-bg-3 bg-bg-0 px-4 text-center">
                                                            <span className="text-[16px] font-normal text-text-secondary">{isTaskMode ? ((item as Task).type || "Geral") : ((item as Project).brand?.name || "N/A")}</span>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {isTaskMode ? (
                                                    <tr className="h-[60px]">
                                                        <td colSpan={2} className="bg-bg-0 px-4 border-b border-r border-bg-3" style={{ borderLeft: `10px solid ${stage.color}` }}>
                                                            <button
                                                                onClick={() => onAddTask?.(stage.id)}
                                                                className="flex items-center justify-center gap-2 rounded-lg text-[18px] font-bold text-text-tertiary transition-all w-[450px] h-[50px]"
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = `${stage.color}66`
                                                                    e.currentTarget.style.color = "white"
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                                    e.currentTarget.style.color = ""
                                                                }}
                                                            >
                                                                Add tarefa
                                                            </button>
                                                        </td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                    </tr>
                                                ) : (
                                                    <tr className="h-[60px]">
                                                        <td colSpan={2} className="bg-bg-0 px-4 border-b border-r border-bg-3" style={{ borderLeft: `10px solid ${stage.color}` }}>
                                                            <button
                                                                onClick={() => onAddProject?.(stage.id)}
                                                                className="flex items-center justify-center gap-2 rounded-lg text-[18px] font-bold text-text-tertiary transition-all w-[450px] h-[50px]"
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = `${stage.color}66`
                                                                    e.currentTarget.style.color = "white"
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                                    e.currentTarget.style.color = ""
                                                                }}
                                                            >
                                                                Add projecto
                                                            </button>
                                                        </td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                        <td className="bg-bg-0"></td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}

            {/* Stages Management UI */}
            {
                !isTaskMode && groupingField === 'stage_id' && stages.length > 0 && (
                    <div className="flex justify-center mt-4">
                        <Button
                            onClick={onAddStage}
                            variant="outline"
                            className="rounded-[100px] border-bg-3 bg-transparent text-text-tertiary hover:bg-bg-2 font-bold uppercase text-[11px] tracking-widest h-[50px] px-10"
                        >
                            Criar outra etapa
                        </Button>
                    </div>
                )
            }
        </div >
    )
}

function StatusCell({ projectId, currentStatusName, onRefresh }: { projectId: string, currentStatusName: string, onRefresh: () => void }) {
    const activeStatus = PROJECT_STATUSES.find(s => s.name === currentStatusName) || PROJECT_STATUSES[0]
    const [selectedStatus, setSelectedStatus] = React.useState(activeStatus)

    // Update local state when prop changes
    React.useEffect(() => {
        const status = PROJECT_STATUSES.find(s => s.name === currentStatusName) || PROJECT_STATUSES[0]
        setSelectedStatus(status)
    }, [currentStatusName])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className="w-full h-full cursor-pointer flex items-center justify-center transition-all hover:brightness-110"
                    style={{ backgroundColor: selectedStatus.color }}
                >
                    <span className="text-[16px] font-normal text-white font-inter-tight capitalize px-4">
                        {selectedStatus.name.toLowerCase()}
                    </span>
                </div>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="center"
                className="w-[280px] p-[20px] bg-bg-1 border border-bg-3 shadow-[0_30px_60px_rgba(0,0,0,0.6)] rounded-none z-[100]"
            >
                <PopoverArrow className="fill-bg-1" width={16} height={8} />
                <div className="flex flex-col w-full gap-[8px]">
                    {PROJECT_STATUSES.map((status) => (
                        <button
                            key={status.name}
                            onClick={async () => {
                                setSelectedStatus(status)
                                await updateProjectStatusLabel(projectId, status.name)
                                onRefresh()
                            }}
                            className={cn(
                                "h-[50px] w-full flex items-center justify-center transition-all hover:brightness-125 rounded-none border-b border-white/5 last:border-0 group",
                                selectedStatus.name === status.name ? "bg-white/5" : "bg-transparent"
                            )}
                            style={{ backgroundColor: status.color }}
                        >
                            <span className="text-[16px] font-normal text-white font-inter-tight capitalize text-center">
                                {status.name.toLowerCase()}
                            </span>
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

function TimelineCell({ startDate, endDate }: { startDate?: string, endDate?: string }) {
    const [isHovered, setIsHovered] = React.useState(false)

    if (!startDate && !endDate) {
        return (
            <div className="h-[30px] rounded-full bg-bg-2 flex items-center justify-center px-4 w-fit min-w-[110px] mx-auto border border-bg-3">
                <span className="text-[10px] font-bold text-text-tertiary tracking-tight uppercase font-inter">
                    Sem data
                </span>
            </div>
        )
    }

    const start = startDate ? parseISO(startDate) : null
    const end = endDate ? parseISO(endDate) : null

    const formattedStart = start ? format(start, "d MMM", { locale: pt }) : "---"
    const formattedEnd = end ? format(end, "d MMM", { locale: pt }) : "---"

    const duration = (start && end)
        ? `${differenceInDays(end, start)} dias`
        : "---"

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-[30px] rounded-full bg-accent-indigo/10 dark:bg-accent-indigo/20 flex items-center justify-center px-4 transition-all w-fit min-w-[110px] mx-auto cursor-default shadow-sm border border-accent-indigo/20"
        >
            <span className="text-[10px] font-bold text-white tracking-tight uppercase font-inter whitespace-nowrap">
                {isHovered ? duration : `${formattedStart} - ${formattedEnd}`}
            </span>
        </div>
    )
}
