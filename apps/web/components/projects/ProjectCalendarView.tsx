"use client"

import * as React from "react"
import type { Project, Task } from "./ProjectsClient"
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Filter,
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProjectCard } from "./ProjectCard"
import { TaskCard } from "./TaskCard"
import { Plus as PlusIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
    format,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay
} from "date-fns"
import { pt } from "date-fns/locale"
import { parseISO } from "date-fns"

type CalendarFilter = "weekly" | "monthly" | "bimonthly" | "semiannual"

interface ProjectCalendarViewProps {
    projects: Project[]
    tasks?: Task[]
    isTaskMode?: boolean
    onViewProject?: (project: Project) => void
    onOpenDetails?: (project: Project) => void
    onToggleTaskComplete?: (taskId: string) => void
    onViewTask?: (taskId: string) => void
    onAddTask?: (date: Date) => void
}

export function ProjectCalendarView({
    projects,
    tasks = [],
    isTaskMode = false,
    onViewProject,
    onOpenDetails,
    onToggleTaskComplete,
    onViewTask,
    onAddTask
}: ProjectCalendarViewProps) {
    const [filter, setFilter] = React.useState<CalendarFilter>("monthly")
    const [viewDate, setViewDate] = React.useState(new Date())

    const filterNames: Record<CalendarFilter, string> = {
        weekly: "Semanal",
        monthly: "Mensal",
        bimonthly: "Bimestral",
        semiannual: "Semestral"
    }

    const handlePrevious = () => {
        if (filter === "weekly") setViewDate(subWeeks(viewDate, 1))
        else if (filter === "monthly") setViewDate(subMonths(viewDate, 1))
        else if (filter === "bimonthly") setViewDate(subMonths(viewDate, 2))
        else if (filter === "semiannual") setViewDate(subMonths(viewDate, 6))
    }

    const handleNext = () => {
        if (filter === "weekly") setViewDate(addWeeks(viewDate, 1))
        else if (filter === "monthly") setViewDate(addMonths(viewDate, 1))
        else if (filter === "bimonthly") setViewDate(addMonths(viewDate, 2))
        else if (filter === "semiannual") setViewDate(addMonths(viewDate, 6))
    }

    const handleToday = () => setViewDate(new Date())

    const getCalendarDays = () => {
        let start: Date
        let end: Date

        if (filter === "weekly") {
            start = startOfWeek(viewDate, { weekStartsOn: 1 })
            end = endOfWeek(viewDate, { weekStartsOn: 1 })
        } else if (filter === "monthly") {
            const monthStart = startOfMonth(viewDate)
            const monthEnd = endOfMonth(viewDate)
            start = startOfWeek(monthStart, { weekStartsOn: 1 })
            end = endOfWeek(monthEnd, { weekStartsOn: 1 })
        } else if (filter === "bimonthly") {
            const monthStart = startOfMonth(viewDate)
            const monthEnd = endOfMonth(addMonths(viewDate, 1))
            start = startOfWeek(monthStart, { weekStartsOn: 1 })
            end = endOfWeek(monthEnd, { weekStartsOn: 1 })
        } else { // semiannual
            const monthStart = startOfMonth(viewDate)
            const monthEnd = endOfMonth(addMonths(viewDate, 5))
            start = startOfWeek(monthStart, { weekStartsOn: 1 })
            end = endOfWeek(monthEnd, { weekStartsOn: 1 })
        }

        return eachDayOfInterval({ start, end })
    }

    const calendarDays = getCalendarDays()

    const getTitle = () => {
        if (filter === "weekly") {
            const start = startOfWeek(viewDate, { weekStartsOn: 1 })
            const end = endOfWeek(viewDate, { weekStartsOn: 1 })
            return `${format(start, 'dd MMM', { locale: pt })} - ${format(end, 'dd MMM yyyy', { locale: pt })}`
        }
        if (filter === "bimonthly") {
            return `${format(viewDate, 'MMM', { locale: pt })} - ${format(addMonths(viewDate, 1), 'MMM yyyy', { locale: pt })}`
        }
        if (filter === "semiannual") {
            return `${format(viewDate, 'MMM', { locale: pt })} - ${format(addMonths(viewDate, 5), 'MMM yyyy', { locale: pt })}`
        }
        return format(viewDate, 'MMMM yyyy', { locale: pt })
    }

    return (
        <div className="flex flex-col h-full bg-bg-1 border border-bg-3 rounded-[12px] overflow-hidden shadow-xl">
            {/* Calendar Header */}
            <div className="p-6 border-b border-bg-3 flex items-center justify-between bg-bg-2/30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrevious} variant="outline" size="icon" className="h-9 w-9 border-bg-3 rounded-xl hover:bg-bg-3">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h2 className="text-lg font-bold text-text-primary min-w-[200px] text-center uppercase tracking-tight">
                            {getTitle()}
                        </h2>
                        <Button onClick={handleNext} variant="outline" size="icon" className="h-9 w-9 border-bg-3 rounded-xl hover:bg-bg-3">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="h-6 w-[1px] bg-bg-3" />

                    <div className="flex bg-bg-3/50 p-1 rounded-xl">
                        {(Object.keys(filterNames) as CalendarFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                    filter === f
                                        ? "bg-bg-0 text-accent-indigo shadow-sm"
                                        : "text-text-tertiary hover:text-text-primary"
                                )}
                            >
                                {filterNames[f]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-9 border-bg-3 rounded-xl hover:bg-bg-3 font-bold text-xs uppercase tracking-tight">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                    <Button onClick={handleToday} className="h-9 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl font-bold text-xs uppercase tracking-tight shadow-lg shadow-accent-indigo/20">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Ver Hoje
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={filter}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full grid grid-cols-7 divide-x divide-bg-3 overflow-y-auto scrollbar-hide shrink-0 w-full"
                    >
                        {/* Days Header */}
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                            <div key={day} className="bg-bg-2/10 p-4 h-[50px] flex items-center justify-center text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-bg-3 w-full shrink-0">
                                {day}
                            </div>
                        ))}

                        {calendarDays.map((date, i) => {
                            const dayItems = isTaskMode
                                ? tasks.filter((t) => {
                                    if (!t.start_date) return false;
                                    try {
                                        return isSameDay(parseISO(t.start_date), date);
                                    } catch {
                                        return false;
                                    }
                                })
                                : projects.filter((p) => {
                                    if (!p.start_date) return false;
                                    try {
                                        return isSameDay(parseISO(p.start_date), date);
                                    } catch {
                                        return false;
                                    }
                                });

                            const isToday = isSameDay(date, new Date());
                            const isCurrentViewMonth = isSameMonth(date, viewDate);

                            return (
                                <div
                                    key={date.toString()}
                                    className={cn(
                                        "w-full h-[380px] p-3 hover:bg-bg-2/30 transition-colors flex flex-col gap-3 border-b border-bg-3 relative shrink-0",
                                        !isCurrentViewMonth ? "opacity-30 bg-bg-2/5" : "bg-transparent",
                                        (i % 7 >= 5 && isCurrentViewMonth) ? "bg-bg-2/10" : ""
                                    )}
                                >
                                    <div className="flex items-center justify-between z-10">
                                        <span className={cn(
                                            "text-sm font-bold w-10 flex items-center justify-center rounded-lg shadow-sm border border-bg-3/20 h-7",
                                            isToday ? "bg-accent-indigo text-white border-transparent" : "bg-bg-0 text-text-primary"
                                        )}>
                                            {format(date, 'd')}
                                        </span>
                                        {dayItems.length > 1 && (
                                            <div className="bg-accent-indigo/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-accent-indigo/20">
                                                <span className="text-[10px] font-extrabold text-accent-indigo">+{dayItems.length - 1}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col items-stretch gap-3 px-1">
                                        {dayItems.map((item) => (
                                            <div key={item.id} className="w-full px-1">
                                                {isTaskMode ? (
                                                    <TaskCard
                                                        task={item as Task}
                                                        onToggleComplete={onToggleTaskComplete}
                                                        onViewTask={onViewTask}
                                                        className="mx-auto" // Center if smaller than cell
                                                    />
                                                ) : (
                                                    <ProjectCard
                                                        project={item as Project}
                                                        variant="compact"
                                                        onViewProject={onViewProject}
                                                        onOpenDetails={onOpenDetails}
                                                        className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mx-auto"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        {dayItems.length === 0 && (
                                            <div
                                                onClick={() => onAddTask?.(date)}
                                                className="w-full h-full flex items-center justify-center cursor-pointer group/cell"
                                            >
                                                <div className="opacity-10 group-hover/cell:opacity-40 transition-all transform group-hover/cell:scale-110">
                                                    <CalendarIcon className="w-8 h-8 text-text-tertiary group-hover/cell:hidden" />
                                                    <PlusIcon className="w-8 h-8 text-accent-indigo hidden group-hover/cell:block" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>

                {/* Filter Info Overlay */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none z-20">
                    <div className="bg-bg-0/80 backdrop-blur-xl border border-bg-3 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-accent-indigo" />
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Produção</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Entrega</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Draft</span>
                        </div>
                    </div>

                    <div className="bg-bg-0/80 backdrop-blur-xl border border-bg-3 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto">
                        <Clock className="w-4 h-4 text-accent-indigo" />
                        <span className="text-xs font-bold text-text-primary">Próximo Milestone: <span className="text-accent-indigo">Lançamento Campanha Outono</span></span>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div >
    )
}
