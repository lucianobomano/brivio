"use client"

import * as React from "react"
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    FolderOpen,
    Calendar,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

import type { Project } from "./ProjectsClient"

interface ProjectDashboardViewProps {
    projects: Project[]
    onViewChange?: (view: string) => void
}

// Mock data for Gantt projects fallback
const MOCK_GANTT_PROJECTS = [
    { id: "1", name: "Dashboard Design", task: "About 5 Hours", progress: 85, color: "#06D6A0", members: [] },
    { id: "2", name: "Mobile App", task: "Final", progress: 60, color: "#FACC15", members: [] },
    { id: "3", name: "Landing Page", task: "Submit Wireframe", progress: 50, color: "#FF0054", members: [] },
    { id: "4", name: "Prototyping", task: "Admin panel", progress: 55, color: "#F97316", members: [] },
    { id: "5", name: "Meeting", task: "Project Discussion", progress: 90, color: "#FF0054", members: [] },
]

// Mock daily focus fallback
const MOCK_DAILY_FOCUS = [
    { name: "Revisão de Protótipo", subtitle: "Equipa de Design" },
    { name: "Alinhamento Estratégico", subtitle: "Gestão de Projeto" },
    { name: "Auditoria Visual Final", subtitle: "Direção de Arte" },
]

export function ProjectDashboardView({ projects, onViewChange }: ProjectDashboardViewProps) {
    const [focusTime, setFocusTime] = React.useState({ minutes: 74, seconds: 0 })
    const [isTimerRunning, setIsTimerRunning] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Daily")

    const ganttColors = ["#06D6A0", "#FF0054", "#FACC15", "#88007F", "#311C99"]

    const ganttProjects = projects
        .filter(p => p.start_date && p.due_date)
        .slice(0, 5)
        .map((p, idx) => {
            const projectTasks = p.tasks || []
            const totalTasks = projectTasks.length
            const completedTasks = projectTasks.filter(t => t.completed).length

            const calculatedProgress = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : (p.progress || 0)

            return {
                id: p.id,
                name: p.name,
                task: p.category
                    ? p.category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
                    : (p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "Active"),
                progress: calculatedProgress,
                color: ganttColors[idx % ganttColors.length],
                members: [p.creator?.avatar_url].filter(Boolean) as string[],
                startDate: new Date(p.start_date!),
                endDate: new Date(p.due_date!)
            }
        })

    // Daily Focus Logic
    const dailyFocusTasks = React.useMemo(() => {
        const allPending = projects.flatMap(p =>
            (p.tasks || [])
                .filter(t => !t.completed)
                .map(t => ({
                    name: t.title,
                    subtitle: t.assignee?.name || p.creator?.name || "Responsável"
                }))
        )
        return allPending.length > 0 ? allPending.slice(0, 3) : MOCK_DAILY_FOCUS
    }, [projects])

    // Weekly Capacity Logic
    const weeklyCapacity = React.useMemo(() => {
        const allTasks = projects.flatMap(p => p.tasks || [])
        if (allTasks.length === 0) return 55
        const completed = allTasks.filter(t => t.completed).length
        return Math.round((completed / allTasks.length) * 100)
    }, [projects])

    // Timer logic
    React.useEffect(() => {
        if (!isTimerRunning) return
        const timer = setInterval(() => {
            setFocusTime(prev => {
                const totalSeconds = prev.minutes * 60 + prev.seconds - 1
                if (totalSeconds <= 0) {
                    setIsTimerRunning(false)
                    return { minutes: 0, seconds: 0 }
                }
                return {
                    minutes: Math.floor(totalSeconds / 60),
                    seconds: totalSeconds % 60
                }
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [isTimerRunning])

    // Effective Projects for Display
    const effectiveGanttProjects = React.useMemo(() => {
        return ganttProjects.length > 0 ? ganttProjects : MOCK_GANTT_PROJECTS
    }, [ganttProjects])

    // Dynamic Stats Calculations
    const stats = React.useMemo(() => {
        const completed = projects.filter(p =>
            ["completed", "done", "finished"].includes(p.status?.toLowerCase() || "") ||
            p.status_label?.toLowerCase() === "completed"
        ).length

        const incomplete = projects.filter(p =>
            !["completed", "done", "finished"].includes(p.status?.toLowerCase() || "") &&
            p.status_label?.toLowerCase() !== "completed"
        ).length

        const overdue = projects.filter(p => {
            if (!p.due_date) return false
            const isCompleted = ["completed", "done", "finished"].includes(p.status?.toLowerCase() || "") ||
                p.status_label?.toLowerCase() === "completed"
            return !isCompleted && new Date(p.due_date) < new Date()
        }).length

        return {
            completed,
            incomplete,
            overdue,
            total: projects.length
        }
    }, [projects])

    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: pt })

    return (
        <div className="w-full max-w-[1520px] mx-auto flex flex-col gap-6 pb-36 font-sans animate-in fade-in duration-500">
            {/* ===== PRIMEIRA LINHA - CARDS DE MÉTRICAS UNIFICADOS ("GRUDADOS" - ESTILO IMAGEM 2) ===== */}
            <div className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-white/[0.08] overflow-hidden shadow-sm dark:shadow-xl">
                {[
                    {
                        value: stats.completed,
                        label: "Projectos Concluídos",
                        icon: CheckCircle2,
                        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    },
                    {
                        value: stats.incomplete,
                        label: "Projectos Activos",
                        icon: Clock,
                        badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                    },
                    {
                        value: stats.overdue,
                        label: "Projectos em Atraso",
                        icon: AlertCircle,
                        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    },
                    {
                        value: stats.total,
                        label: "Total de Projectos",
                        icon: FolderOpen,
                        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => onViewChange?.("padrao")}
                        className="px-6 py-5 flex flex-col justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                                {stat.label}
                            </span>
                            <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center transition-transform group-hover:scale-105", stat.badgeBg)}>
                                <stat.icon className="w-3 h-3" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-2xl lg:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                                {stat.value}
                            </span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                                projectos
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== SEGUNDA SEÇÃO - PROGRESSO DOS PROJETOS + SIDEBAR (TIMER & FOCO) ===== */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                {/* Coluna da Esquerda: Gráfico / Progresso dos Projetos (8 colunas) */}
                <div className="xl:col-span-8 bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm dark:shadow-2xl flex flex-col justify-between min-h-[794px]">
                    {/* Cabeçalho do Card */}
                    <div className="flex items-center justify-between pb-5 border-b border-zinc-200/80 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            <span className="capitalize">{currentDate}</span>
                        </div>

                        {/* Switcher de Escala */}
                        <div className="bg-zinc-100 dark:bg-[#050507] border border-zinc-200/80 dark:border-white/[0.08] p-0.5 rounded-lg flex items-center gap-1">
                            {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setViewMode(period)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                        period === viewMode
                                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                    )}
                                >
                                    {period === "Daily" ? "Diário" : period === "Weekly" ? "Semanal" : period === "Monthly" ? "Mensal" : "Anual"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lista de Projetos com Barras de Progresso Refinadas (Cápsulas Full Roundness com h-60px) */}
                    <div className="flex flex-col gap-6 py-6 flex-1 justify-around relative">
                        {/* Linhas Verticais de Referência (Discretas) */}
                        <div className="absolute inset-y-0 left-40 right-16 flex justify-between pointer-events-none opacity-20">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-full w-px bg-zinc-300 dark:bg-white/[0.08]" />
                            ))}
                        </div>

                        {effectiveGanttProjects.map((project) => (
                            <div key={project.id} className="flex items-center gap-4 relative z-10">
                                {/* Nome do Projeto */}
                                <div className="w-36 shrink-0 truncate">
                                    <span
                                        onClick={() => onViewChange?.("padrao")}
                                        className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer truncate block"
                                        title={project.name}
                                    >
                                        {project.name}
                                    </span>
                                </div>

                                {/* Track de Progresso com Cápsula de Full Roundness com h-60px */}
                                <div className="flex-1 h-[60px] bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-white/[0.06] rounded-full relative overflow-hidden flex items-center p-1">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 ease-out flex items-center px-4 gap-3 relative overflow-hidden shadow-inner"
                                        style={{
                                            width: `${Math.max(20, project.progress)}%`,
                                            backgroundColor: project.color ? `${project.color}25` : "rgba(100,100,100,0.1)",
                                            border: `1px solid ${project.color ? `${project.color}50` : "rgba(100,100,100,0.2)"}`
                                        }}
                                    >
                                        {/* Avatar / Inicial */}
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/20 flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-zinc-800 dark:text-white shadow-sm">
                                            {project.members && project.members.length > 0 && !project.members[0].startsWith("/avatar") ? (
                                                <Image src={project.members[0]} alt="" width={32} height={32} className="object-cover" />
                                            ) : (
                                                project.name[0]?.toUpperCase() || "P"
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate whitespace-nowrap tracking-tight">
                                            {project.task}
                                        </span>
                                    </div>
                                </div>

                                {/* Pílula de Percentagem */}
                                <div className="w-14 shrink-0 flex justify-end">
                                    <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        {project.progress}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coluna da Direita: Temporizador de Foco + Foco Diário (4 colunas) */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    {/* Card 1: Temporizador de Foco (h-385px) */}
                    <div className="h-[385px] bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center relative overflow-hidden text-center group shrink-0">
                        {/* Glow Suave de Fundo */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-3 relative z-10">
                            <Clock className="w-4 h-4 text-rose-500" />
                            <span>Temporizador de Foco</span>
                        </div>

                        <div className="text-6xl font-extralight tracking-tight text-zinc-900 dark:text-white font-mono my-4 relative z-10">
                            {String(focusTime.minutes).padStart(2, "0")}:{String(focusTime.seconds).padStart(2, "0")}
                        </div>

                        <div className="flex flex-col items-center gap-3 mt-3 w-full max-w-[200px] relative z-10">
                            <button
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs py-2.5 rounded-full transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <span>{isTimerRunning ? "Pausar" : "Iniciar"}</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsTimerRunning(false)
                                    setFocusTime({ minutes: 74, seconds: 0 })
                                }}
                                className="text-xs text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors py-1 font-medium"
                            >
                                Reiniciar
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Foco Diário (h-385px) */}
                    <div className="h-[385px] bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm dark:shadow-2xl flex flex-col justify-between shrink-0">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-300 tracking-wide">
                                Foco Diário
                            </span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">
                                Prioridades
                            </span>
                        </div>

                        <div className="flex flex-col gap-2.5 my-auto">
                            {dailyFocusTasks.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                            {item.name}
                                        </span>
                                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                            {item.subtitle}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Capacidade Semanal */}
                        <div className="pt-3 border-t border-zinc-200/80 dark:border-white/[0.04]">
                            <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                                <span>Capacidade Semanal</span>
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">{weeklyCapacity}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.04]">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-400"
                                    style={{ width: `${weeklyCapacity}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
