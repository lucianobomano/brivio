"use client"

import * as React from "react"
import { Project, Stage } from "./ProjectsClient"
import { RoadmapStage } from "@/app/actions/roadmap"
import { cn } from "@/lib/utils"
import { MoreHorizontal, ChevronDown, Clock } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { motion } from "framer-motion"
import { updateProjectStage_v2 } from "@/app/actions/projects"
import { toast } from "sonner"
import { useCurrency } from "@/components/CurrencyUtils"

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
    prospecting: { label: "Prospecção", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)" },
    discovery: { label: "Discovery", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    planning: { label: "Planeamento", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    in_progress: { label: "Em Execução", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    review: { label: "Review", color: "#ec4899", bg: "rgba(236, 72, 153, 0.1)" },
    delivery: { label: "Entrega", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    done: { label: "Concluído", color: "#059669", bg: "rgba(5, 150, 105, 0.2)" },
    archived: { label: "Arquivado", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" }
}

interface ProjectListViewProps {
    projects: Project[]
    stages: (Stage | RoadmapStage)[]
    onRefresh: () => void
    onViewProject?: (project: Project) => void
    isTaskMode?: boolean
    projectId?: string
    onOpenDetails?: (project: Project) => void
    onEdit?: (project: Project) => void
}

export function ProjectListView({ projects, stages, onRefresh, onViewProject, onOpenDetails, isTaskMode, onEdit }: ProjectListViewProps) {
    const { formatPrice } = useCurrency()
    const handleStatusChange = async (projectId: string, newStatus: string) => {
        const result = await updateProjectStage_v2(projectId, newStatus)
        if (result.success) {
            toast.success("Estado do projeto atualizado")
            onRefresh()
        } else {
            toast.error("Erro ao atualizar projeto")
        }
    }

    return (
        <div className="bg-bg-1 border border-bg-3 dark:border-bg-3 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-bg-2/50 text-[#97A1B3] text-[11px] uppercase tracking-wider font-bold border-b border-bg-3 dark:border-bg-3">
                        <th className="p-4 pl-8 w-1/4">{isTaskMode ? "Task Name" : "Project Identity"}</th>
                        <th className="p-4">{isTaskMode ? "Status" : "Brand"}</th>
                        <th className="p-4">{isTaskMode ? "Phase" : "Stage"}</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Progress</th>
                        <th className="p-4">Budget</th>
                        <th className="p-4 pr-8 text-right">Settings</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-bg-3/50 dark:divide-bg-3">
                    {isTaskMode ? (
                        (stages as RoadmapStage[]).flatMap(stage => (stage.tasks || []).map(task => (
                            <tr key={task.id} className="group hover:bg-bg-2/30 transition-all duration-300">
                                <td className="p-4 pl-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-bg-2 border border-bg-3 flex items-center justify-center shrink-0 group-hover:border-accent-indigo/30 transition-colors shadow-sm text-accent-indigo">
                                            <Badge className="bg-accent-indigo/10 text-accent-indigo border-none">{task.status?.charAt(0).toUpperCase()}</Badge>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-sm font-semibold text-text-primary",
                                                task.completed && "text-text-tertiary line-through"
                                            )}>
                                                {task.title}
                                            </span>
                                            <span className="text-[10px] text-text-tertiary uppercase tracking-tight">
                                                Task ID: {task.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold uppercase",
                                        task.completed ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-bg-2 text-text-tertiary"
                                    )}>
                                        {task.status || "Backlog"}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <Badge variant="outline" className="text-[10px] border-bg-3 font-semibold uppercase tracking-tighter bg-bg-2">
                                        {stage.name}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <Badge className={cn(
                                        "bg-bg-1 border border-bg-3 text-text-tertiary text-[10px]",
                                        task.completed && "bg-green-500/10 text-green-500 border-green-500/20"
                                    )}>
                                        {task.completed ? "Concluído" : "Pendente"}
                                    </Badge>
                                </td>
                                <td className="p-4 w-48">
                                    <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-500", task.completed ? "bg-green-500" : "bg-accent-indigo")}
                                            style={{ width: task.completed ? "100%" : "0%" }}
                                        />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-[10px] text-text-tertiary">---</span>
                                </td>
                                <td className="p-4 pr-8 text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary hover:text-text-primary hover:bg-bg-2 rounded-lg">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        )))
                    ) : (
                        projects.map((project) => {
                            const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning

                            return (
                                <tr key={project.id} className="group hover:bg-bg-2/30 transition-all duration-300">
                                    <td className="p-4 pl-8">
                                        <div
                                            className="flex items-center gap-4 cursor-pointer"
                                            onClick={() => onViewProject?.(project)}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-bg-2 border border-bg-3 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-accent-indigo/30 transition-colors shadow-sm">
                                                {project.cover_url ? (
                                                    <Image src={project.cover_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                                                ) : (
                                                    <span className="text-accent-indigo font-bold text-lg">{project.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span
                                                    className="text-sm font-semibold text-text-primary group-hover:text-accent-indigo transition-colors cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenDetails?.(project);
                                                    }}
                                                >
                                                    {project.name}
                                                </span>
                                                <span className="text-[10px] text-text-tertiary uppercase tracking-tight">
                                                    Created by {project.creator?.name || "System"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white dark:bg-bg-3 flex items-center justify-center border border-bg-3 overflow-hidden">
                                                {project.brand?.logo_url ? (
                                                    <Image src={project.brand.logo_url} alt="" width={24} height={24} className="object-contain" />
                                                ) : (
                                                    <span className="text-[8px] font-bold text-text-secondary">{project.brand?.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-text-secondary font-medium">{project.brand?.name || "No Brand"}</span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {project.stage_id ? (
                                                <Badge variant="outline" className="text-[10px] border-bg-3 font-semibold uppercase tracking-tighter bg-bg-2">
                                                    {stages.find(s => s.id === project.stage_id)?.name || "Default Stage"}
                                                </Badge>
                                            ) : (
                                                <span className="text-[10px] text-text-tertiary">No Stage</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                                    style={{ backgroundColor: status.bg, color: status.color }}
                                                >
                                                    {status.label}
                                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48 bg-bg-1 border-bg-3 shadow-xl p-1 rounded-xl">
                                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                    <DropdownMenuItem
                                                        key={key}
                                                        onClick={() => handleStatusChange(project.id, key)}
                                                        className="flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer hover:bg-bg-2 focus:bg-bg-2"
                                                    >
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                                                        {cfg.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>

                                    <td className="p-4 w-48 text-center">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-bg-3 rounded-full overflow-hidden shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${project.progress || 0}%` }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-text-secondary w-8 text-right">
                                                {project.progress || 0}%
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <Badge variant="outline" className="text-[10px] border-bg-3 font-semibold uppercase tracking-tighter">
                                            {project.priority || "Medium"}
                                        </Badge>
                                    </td>

                                    <td className="p-4">
                                        {project.budget_amount ? (
                                            <span className="text-xs font-bold text-accent-indigo">
                                                {formatPrice(project.budget_amount)}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-text-tertiary">---</span>
                                        )}
                                    </td>

                                    <td className="p-4 pr-8 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary hover:text-text-primary hover:bg-bg-2 rounded-lg transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-bg-1 border-bg-3 shadow-xl p-1 rounded-xl">
                                                <DropdownMenuItem
                                                    onClick={() => onOpenDetails?.(project)}
                                                    className="flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer hover:bg-bg-2"
                                                >
                                                    Ver Detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onEdit?.(project)}
                                                    className="flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer hover:bg-bg-2"
                                                >
                                                    Editar Projeto
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>

            {projects.length === 0 && (
                <div className="p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-bg-2 flex items-center justify-center mb-4 border border-bg-3 animate-pulse">
                        <Clock className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <h3 className="text-text-primary font-bold">No projects found in this pipeline</h3>
                    <p className="text-text-secondary text-sm max-w-xs mt-1">Start by adding a new creative task to your workspace.</p>
                </div>
            )}
        </div>
    )
}
