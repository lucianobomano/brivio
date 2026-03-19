"use client"

import * as React from "react"
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    FolderOpen,
    LayoutGrid,
    Calendar,
    MoreHorizontal,
    MessageSquare,
    Paperclip,
    Link2,
    File,
    Plus,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { useCurrency } from "@/components/CurrencyUtils"

import type { Project } from "./ProjectsClient"

interface ProjectDashboardViewProps {
    projects: Project[]
    onViewChange?: (view: string) => void
}

// Mock data for teams
const MOCK_TEAMS = [
    { id: "1", name: "Backend team", subtitle: "Python", progress: 65, timeLeft: "1 Week left", messages: 3, files: 2, members: ["/avatar1.png", "/avatar2.png", "/avatar3.png"] },
    { id: "2", name: "UX/UI Team", subtitle: "Figma", progress: 55, timeLeft: "2 Weeks left", messages: 9, files: 7, members: ["/avatar1.png", "/avatar2.png", "/avatar3.png"] },
    { id: "3", name: "Front End Team", subtitle: "Sencha Ext JS", progress: 53, timeLeft: "1 Week left", messages: 1, files: 17, members: ["/avatar1.png", "/avatar2.png", "/avatar3.png"] },
    { id: "4", name: "Marketing Team", subtitle: "Facebook", progress: 43, timeLeft: "1 Week left", messages: 4, files: 8, members: ["/avatar1.png", "/avatar2.png", "/avatar3.png"] },
]

// Mock data for Gantt projects
const MOCK_GANTT_PROJECTS = [
    { id: "1", name: "Dashboard Design", task: "About 5 Hours", progress: 85, color: "#06D6A0", members: ["/avatar1.png", "/avatar2.png"] },
    { id: "2", name: "Mobile App", task: "Final", progress: 60, color: "#FACC15", members: ["/avatar1.png"] },
    { id: "3", name: "Landing Page", task: "Submit Wireframe", progress: 50, color: "#FF0054", members: ["/avatar1.png", "/avatar2.png", "/avatar3.png"] },
    { id: "4", name: "Prototyping", task: "Admin panel", progress: 55, color: "#F97316", members: ["/avatar1.png"] },
    { id: "5", name: "Meeting", task: "Project Discussion", progress: 90, color: "#FF0054", members: ["/avatar1.png", "/avatar2.png", "/avatar3.png"] },
]

// Mock daily focus
const MOCK_DAILY_FOCUS = [
    { name: "Project Name", subtitle: "Nome do responsável" },
    { name: "Project Name", subtitle: "Nome do responsável" },
    { name: "Project Name", subtitle: "Nome do responsável" },
]

// Mock files
const MOCK_FILES = [
    { name: "Brandguidelines_v1.ai", type: "AI", time: "File" },
    { name: "Website_Mockup.fig", type: "FIG", time: "File" },
    { name: "Website_Mockup.fig", type: "FIG", time: "File" },
]

export function ProjectDashboardView({ projects, onViewChange }: ProjectDashboardViewProps) {
    const { formatPrice } = useCurrency()
    const [focusTime, setFocusTime] = React.useState({ minutes: 74, seconds: 0 })
    const [isTimerRunning, setIsTimerRunning] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Daily")

    // Realistic mapping for Gantt from projects prop
    // We'll take top 5 projects with dates or just top 5
    const ganttColors = ["#06D6A0", "#FF0054", "#FACC15", "#88007F", "#311C99"];

    const ganttProjects = projects
        .filter(p => p.start_date && p.due_date)
        .slice(0, 5)
        .map((p, idx) => {
            // Calculate total and completed tasks from the tasks array
            const projectTasks = p.tasks || [];
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter(t => t.completed).length;

            // Calculate progress based on completed tasks if available
            const calculatedProgress = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : (p.progress || 0);

            return {
                id: p.id,
                name: p.name,
                task: p.category
                    ? p.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    : (p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "Active"),
                progress: calculatedProgress,
                color: ganttColors[idx % ganttColors.length],
                members: [p.creator?.avatar_url].filter(Boolean) as string[],
                startDate: new Date(p.start_date!),
                endDate: new Date(p.due_date!)
            };
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
        );
        return allPending.length > 0 ? allPending.slice(0, 3) : MOCK_DAILY_FOCUS;
    }, [projects]);

    // Weekly Capacity Logic (global task progress)
    const weeklyCapacity = React.useMemo(() => {
        const allTasks = projects.flatMap(p => p.tasks || []);
        if (allTasks.length === 0) return 55;
        const completed = allTasks.filter(t => t.completed).length;
        return Math.round((completed / allTasks.length) * 100);
    }, [projects]);

    // Address focusTime logic
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

    // Fallback if no projects have dates
    const effectiveGanttProjects = React.useMemo(() => {
        const sourceProjects = ganttProjects.length > 0 ? ganttProjects : MOCK_GANTT_PROJECTS.map(p => ({
            ...p,
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7)
        }))

        // Calculate positioning relative to a 30-day window (for example)
        const now = new Date()
        const startOfWindow = new Date(now)
        startOfWindow.setDate(startOfWindow.getDate() - 7) // Start 7 days ago
        const endOfWindow = new Date(startOfWindow)
        endOfWindow.setDate(endOfWindow.getDate() + 30) // 30 day window

        const totalWidth = endOfWindow.getTime() - startOfWindow.getTime()

        return sourceProjects.map(p => {
            const pStart = p.startDate.getTime()
            const pEnd = p.endDate.getTime()

            // Calculate % offset from start of window
            const leftOffset = Math.max(0, Math.min(100, ((pStart - startOfWindow.getTime()) / totalWidth) * 100))
            const durationWidth = Math.max(10, Math.min(100 - leftOffset, ((pEnd - pStart) / totalWidth) * 100))

            return {
                ...p,
                leftOffset,
                durationWidth
            }
        })
    }, [ganttProjects])

    // Dynamic Stats Calculations
    const stats = React.useMemo(() => {
        const completed = projects.filter(p =>
            ["completed", "done", "finished"].includes(p.status?.toLowerCase() || "") ||
            p.status_label?.toLowerCase() === 'completed'
        ).length

        const incomplete = projects.filter(p =>
            !["completed", "done", "finished"].includes(p.status?.toLowerCase() || "") &&
            p.status_label?.toLowerCase() !== 'completed'
        ).length

        const overdue = projects.filter(p => {
            if (!p.due_date) return false
            const isCompleted = ["completed", "done", "finished"].includes(p.status?.toLowerCase() || "") ||
                p.status_label?.toLowerCase() === 'completed'
            return !isCompleted && new Date(p.due_date) < new Date()
        }).length

        return {
            completed,
            incomplete,
            overdue,
            total: projects.length
        }
    }, [projects])

    const currentDate = format(new Date(), "dd MMM. yyyy", { locale: pt })

    return (
        <div className="w-full min-h-screen bg-bg-0 font-inter">
            {/* Dashboard Content */}
            <div className="px-0">
                {/* ===== FIRST ROW - 4 STATS CARDS ===== */}
                <div className="grid grid-cols-4" style={{ gap: "20px", marginBottom: "30px" }}>
                    {[
                        { value: stats.completed, label: "Projectos Concluídos", icon: CheckCircle2, color: "#06D6A0" },
                        { value: stats.incomplete, label: "Projectos Activos", icon: Clock, color: "#311C99" },
                        { value: stats.overdue, label: "Projectos em Atraso", icon: AlertCircle, color: "#FF0054" },
                        { value: stats.total, label: "Total de Projectos", icon: FolderOpen, color: "#FACC15" },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            onClick={() => onViewChange?.("padrao")}
                            className="flex items-center justify-between bg-bg-0 cursor-pointer group transition-all duration-300 hover:border-accent-indigo active:scale-[0.98]"
                            style={{
                                height: "180px",
                                border: "1px solid #373737",
                                borderRadius: "12px",
                                padding: "24px",
                            }}
                        >
                            <div className="flex flex-col">
                                <span
                                    className="font-black tracking-tighter transition-all duration-500 group-hover:translate-x-1"
                                    style={{ fontSize: "64px", color: "#97A1B3", lineHeight: "1" }}
                                >
                                    {stat.value}
                                </span>
                                <span className="text-sm font-bold text-text-tertiary uppercase tracking-widest mt-4">
                                    {stat.label}
                                </span>
                            </div>
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110"
                                style={{ backgroundColor: `${stat.color}10` }}
                            >
                                <stat.icon style={{ width: "32px", height: "32px", color: stat.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ===== SECOND SECTION - GANTT + SIDE CARDS ===== */}
                <div className="flex" style={{ gap: "20px", marginBottom: "30px" }}>
                    {/* Gantt Chart */}
                    <div
                        className="bg-bg-0"
                        style={{
                            width: "1085px",
                            height: "790px",
                            border: "1px solid #373737",
                            borderRadius: "8px",
                            padding: "24px",
                        }}
                    >
                        {/* Gantt Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-[#97A1B3]" />
                                <span className="text-[#97A1B3] text-lg font-medium">{currentDate}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {["Daily", "Weekly", "Monthly", "Yearly"].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setViewMode(period as "Daily" | "Weekly" | "Monthly" | "Yearly")}
                                        className={cn(
                                            "text-sm font-medium transition-colors",
                                            period === viewMode ? "text-[#97A1B3]" : "text-[#515151] hover:text-[#97A1B3]"
                                        )}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Gantt Content Area (with Grid Lines) */}
                        <div className="relative" style={{ marginTop: "140px" }}>
                            {/* Vertical Grid Lines */}
                            <div className="absolute inset-0 flex justify-between pointer-events-none" style={{ left: "160px" }}>
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-[540px] w-px bg-[#373737]/50"
                                        style={{ height: "calc(100% + 40px)" }}
                                    />
                                ))}
                            </div>

                            {/* Gantt Rows */}
                            <div className="flex flex-col relative z-10" style={{ gap: "60px" }}>
                                {effectiveGanttProjects.map((project) => (
                                    <div key={project.id} className="flex items-center">
                                        {/* Project Name */}
                                        <div style={{ width: "160px" }} className="shrink-0">
                                            <span className="text-[#97A1B3] text-sm truncate pr-4 block">{project.name}</span>
                                        </div>

                                        {/* Project Bar Container (The Track) */}
                                        <div
                                            className="flex-1 relative h-[60px] bg-[#E8EBFF] dark:bg-[#2A2D3A] rounded-full overflow-hidden flex items-center shadow-inner"
                                            style={{
                                                width: `${project.durationWidth}%`,
                                                marginLeft: `${project.leftOffset}%`,
                                            }}
                                        >
                                            {/* Solid Progress Filling */}
                                            <div
                                                className="absolute top-0 left-0 h-full flex items-center transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${project.progress}%`,
                                                    backgroundColor: project.color,
                                                    borderRadius: "100px",
                                                    padding: "0 18px",
                                                    zIndex: 1
                                                }}
                                            >
                                                {/* Group containing avatars and task label */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {/* Avatars Group */}
                                                    <div className="flex -space-x-2 shrink-0">
                                                        {project.members.length > 0 ? project.members.map((avatar, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="w-10 h-10 rounded-full bg-bg-2 border-2 border-white overflow-hidden shrink-0 shadow-sm"
                                                            >
                                                                <Image src={avatar} alt="" width={40} height={40} className="object-cover" />
                                                            </div>
                                                        )) : (
                                                            <div className="w-10 h-10 rounded-full bg-bg-2 border-2 border-white flex items-center justify-center shadow-sm">
                                                                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Task Label */}
                                                    <span className="text-[#97A1B3] text-base font-medium font-inter whitespace-nowrap">
                                                        {project.task}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Percentage Pill (Always on the right of the track) */}
                                            <div
                                                className="absolute right-1 bg-white flex items-center justify-center shadow-sm"
                                                style={{
                                                    width: "83px",
                                                    height: "52px",
                                                    borderRadius: "100px",
                                                    zIndex: 10
                                                }}
                                            >
                                                <span className="text-black font-bold" style={{ fontSize: "20px" }}>{project.progress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Side Cards Column */}
                    <div className="flex flex-col" style={{ gap: "20px" }}>
                        {/* Focus Timer Card */}
                        <div
                            className="flex flex-col items-center justify-center"
                            style={{
                                width: "440px",
                                height: "384px",
                                backgroundColor: "#FF0054",
                                borderRadius: "8px",
                                padding: "24px",
                            }}
                        >
                            <span className="text-white text-lg font-medium mb-4">focus timer</span>
                            <span className="text-white font-bold" style={{ fontSize: "72px", lineHeight: "1" }}>
                                {String(focusTime.minutes).padStart(2, "0")}:{String(focusTime.seconds).padStart(2, "0")}
                            </span>
                            <button
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                                className="mt-6 bg-white text-[#FF0054] font-bold rounded-lg"
                                style={{ width: "200px", height: "48px" }}
                            >
                                {isTimerRunning ? "Pause" : "Start"}
                            </button>
                            <button className="mt-2 text-white font-medium hover:underline">
                                Reset
                            </button>
                        </div>

                        {/* Top Daily Focus Card */}
                        <div
                            className="flex flex-col"
                            style={{
                                width: "440px",
                                height: "384px",
                                border: "1px solid #373737",
                                borderRadius: "8px",
                                padding: "24px",
                                gap: "37px"
                            }}
                        >
                            <h3 style={{ fontSize: "32px", color: "#97A1B3" }}>Top Daily focus</h3>

                            <div className="flex flex-col gap-4">
                                {dailyFocusTasks.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full border-2 border-[#FF0054]" />
                                        <div className="flex flex-col">
                                            <span className="text-[#97A1B3] text-sm font-medium truncate max-w-[340px]">{item.name}</span>
                                            <span className="text-[#97A1B3] text-xs">{item.subtitle}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-auto">
                                <div style={{ height: "1px", backgroundColor: "#373737", width: "100%", marginBottom: "16px" }} />
                                <div className="flex justify-between text-xs text-[#97A1B3] mb-2">
                                    <span>Capacidade Semanal</span>
                                    <span>{weeklyCapacity}%</span>
                                </div>
                                <div
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: "rgba(151, 161, 179, 0.25)" }}
                                >
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${weeklyCapacity}%`,
                                            background: "linear-gradient(90deg, #FF0054, #88007F, #06D6A0, #311C99)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== THIRD SECTION - TEAM CARDS ===== */}
                <div className="grid grid-cols-4" style={{ gap: "30px", marginBottom: "30px" }}>
                    {MOCK_TEAMS.map((team) => (
                        <div
                            key={team.id}
                            className="bg-bg-0 flex flex-col"
                            style={{
                                height: "270px",
                                border: "1px solid #373737",
                                borderRadius: "12px",
                                padding: "24px",
                                gap: "30px"
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-bg-2 flex items-center justify-center">
                                        <LayoutGrid className="w-5 h-5 text-[#97A1B3]" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm" style={{ color: "#97A1B3" }}>{team.name}</h4>
                                        <span className="text-[#97A1B3] text-xs">{team.subtitle}</span>
                                    </div>
                                </div>
                                <MoreHorizontal className="w-5 h-5 text-[#515151] cursor-pointer" />
                            </div>

                            {/* Members */}
                            <div className="flex items-center">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-bg-0"
                                        />
                                    ))}
                                    <div className="w-10 h-10 rounded-full bg-[#06D6A0] border-2 border-bg-0 flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-[#97A1B3]" />
                                    </div>
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between text-xs text-[#97A1B3] mb-2">
                                    <span>Progress</span>
                                    <span>{team.progress}%</span>
                                </div>
                                <div
                                    className="h-1.5 rounded-full overflow-hidden"
                                    style={{ backgroundColor: "rgba(151, 161, 179, 0.25)" }}
                                >
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${team.progress}%`,
                                            background: "linear-gradient(90deg, #FF0054, #88007F, #06D6A0, #311C99)",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2E313C] rounded-full">
                                    <Clock className="w-3 h-3 text-[#97A1B3]" />
                                    <span className="text-[#97A1B3] text-xs">{team.timeLeft}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-4 h-4 text-[#515151]" />
                                        <span className="text-[#97A1B3] text-xs">{team.messages}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Paperclip className="w-4 h-4 text-[#515151]" />
                                        <span className="text-[#97A1B3] text-xs">{team.files}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ===== FOURTH SECTION - 3 BOTTOM CARDS ===== */}
                <div className="flex" style={{ gap: "20px" }}>
                    {/* Feedback Central */}
                    <div
                        style={{
                            width: "501px",
                            height: "402px",
                            border: "1px solid #373737",
                            borderRadius: "8px",
                            padding: "16px 20px",
                        }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare style={{ width: "30px", height: "30px", color: "#97A1B3" }} />
                            <span style={{ fontSize: "18px", color: "#97A1B3" }}>Feedback central</span>
                            <div className="ml-auto w-6 h-6 rounded-full bg-[#FF0054] flex items-center justify-center">
                                <span className="text-[#97A1B3] text-xs font-bold">13</span>
                            </div>
                        </div>

                        {/* Feedback Items */}
                        <div className="flex flex-col gap-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[#97A1B3] text-sm font-medium">Maria Eduarda</span>
                                            <span className="text-[#515151] text-xs">30m ago</span>
                                        </div>
                                        <p className="text-[#97A1B3] text-xs leading-relaxed">
                                            &quot;Podes ajustar a transparência azul no logo secundário?&quot;
                                        </p>
                                        <button className="text-[#FF0054] text-xs font-medium mt-2 hover:underline">
                                            Responder
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Magic Share Button */}
                        <button
                            className="w-full mt-6 h-12 border border-[#373737] rounded-lg flex items-center justify-center gap-2 text-[#97A1B3] hover:bg-bg-2 transition-colors"
                        >
                            <Link2 className="w-4 h-4" />
                            Magic Share Link
                        </button>
                    </div>

                    {/* Visão Financeira */}
                    <div
                        style={{
                            width: "501px",
                            height: "402px",
                            border: "1px solid #373737",
                            borderRadius: "8px",
                            padding: "16px 20px",
                        }}
                    >
                        <span className="text-[#97A1B3] text-sm">Faturado este mês</span>
                        <div className="flex items-baseline gap-2 mt-[30px] mb-[30px]">
                            <span className="font-bold" style={{ fontSize: "33px", color: "#97A1B3" }}>{formatPrice(2745540)}</span>
                            <span className="text-[#06D6A0] text-sm">+11%</span>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 p-4 rounded-lg flex flex-col justify-center" style={{ backgroundColor: "rgba(6, 214, 160, 0.1)", height: "90px" }}>
                                <span className="text-[#97A1B3] text-xs block mb-1">Pago</span>
                                <span className="text-[#06D6A0] font-bold">{formatPrice(750850)}</span>
                            </div>
                            <div className="flex-1 p-4 rounded-lg flex flex-col justify-center" style={{ backgroundColor: "rgba(255, 0, 84, 0.1)", height: "90px" }}>
                                <span className="text-[#97A1B3] text-xs block mb-1">Pendente</span>
                                <span className="text-[#FF0054] font-bold">{formatPrice(750850)}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginTop: "80px" }}>
                            <div className="flex justify-between text-xs text-[#97A1B3] mb-2">
                                <span>Progress</span>
                                <span>21%</span>
                            </div>
                            <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: "rgba(151, 161, 179, 0.25)" }}
                            >
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: "21%",
                                        background: "linear-gradient(90deg, #FF0054, #88007F, #06D6A0, #311C99)",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Arquivos Recentes */}
                    <div
                        style={{
                            width: "501px",
                            height: "402px",
                            border: "1px solid #373737",
                            borderRadius: "8px",
                            padding: "16px 20px",
                        }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <span style={{ fontSize: "18px", color: "#97A1B3" }}>Arquivos recentes</span>
                            <Plus className="w-5 h-5 text-[#515151] cursor-pointer" />
                        </div>

                        <div className="flex flex-col gap-3">
                            {MOCK_FILES.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 border border-[#373737] rounded-lg hover:bg-bg-2 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-bg-2 flex items-center justify-center">
                                            <File className="w-5 h-5 text-[#97A1B3]" />
                                        </div>
                                        <div>
                                            <span className="text-[#97A1B3] text-sm block">{file.name}</span>
                                            <span className="text-[#515151] text-xs">{file.type}</span>
                                        </div>
                                    </div>
                                    <button className="text-[#515151] hover:text-white transition-colors">
                                        <Link2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Tags */}
                        <div className="flex gap-3 mt-6">
                            <button className="flex-1 h-10 border border-[#373737] rounded-lg text-[#97A1B3] text-sm hover:bg-bg-2 transition-colors">
                                Brand guides
                            </button>
                            <button className="flex-1 h-10 border border-[#373737] rounded-lg text-[#97A1B3] text-sm hover:bg-bg-2 transition-colors">
                                Moodboards
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
