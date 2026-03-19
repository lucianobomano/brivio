"use client"

import * as React from "react"
import {
    format,
    addDays,
    differenceInDays,
    startOfDay,
    eachDayOfInterval,
    isToday,
    parseISO,
    startOfWeek,
    addWeeks,
    subWeeks
} from "date-fns"
import { pt } from "date-fns/locale"
import { motion } from "framer-motion"
import {
    ChevronLeft,
    ChevronRight,
    Users,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Project } from "./ProjectsClient"
import type { RoadmapStage } from "@/app/actions/roadmap"
import { updateRoadmapTaskDetails } from "@/app/actions/roadmap"
import { toast } from "sonner"

interface ProjectPipelineGanttViewProps {
    project: Project
    stages: RoadmapStage[]
    onRefresh?: () => void
}

type ZoomLevel = 'day' | 'week'

export function ProjectPipelineGanttView({ project, stages, onRefresh }: ProjectPipelineGanttViewProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [viewDate, setViewDate] = React.useState(new Date())
    const [zoom, setZoom] = React.useState<ZoomLevel>('day')
    const [dragging, setDragging] = React.useState<{
        id: string,
        type: 'move' | 'resize-start' | 'resize-end',
        startX: number,
        originalStart: Date,
        originalEnd: Date
    } | null>(null)

    const CELL_WIDTH = zoom === 'day' ? 100 : 200
    const VIEW_DAYS = zoom === 'day' ? 30 : 90

    const startDate = startOfWeek(viewDate, { locale: pt })
    const timelineDays = eachDayOfInterval({
        start: startDate,
        end: addDays(startDate, VIEW_DAYS)
    })

    const getXFromDate = React.useCallback((date: Date) => {
        const diff = differenceInDays(startOfDay(date), startDate)
        return diff * CELL_WIDTH
    }, [startDate, CELL_WIDTH])

    const draggingRef = React.useRef(dragging)
    React.useEffect(() => { draggingRef.current = dragging }, [dragging])

    const handleTaskMouseDown = (e: React.MouseEvent, task: RoadmapStage['tasks'][0], type: 'move' | 'resize-start' | 'resize-end') => {
        e.preventDefault()
        e.stopPropagation()

        const tStart = task.start_date ? parseISO(task.start_date) : new Date()
        const tEnd = task.due_date ? parseISO(task.due_date) : addDays(tStart, 3)

        setDragging({
            id: task.id,
            type,
            startX: e.clientX,
            originalStart: tStart,
            originalEnd: tEnd
        })

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const current = draggingRef.current
            if (!current) return

            const deltaX = moveEvent.clientX - current.startX
            const deltaDays = Math.round(deltaX / CELL_WIDTH)

            const el = document.getElementById(`gantt-bar-${current.id}`)
            if (el) {
                if (current.type === 'move') {
                    el.style.transform = `translateX(${deltaX}px)`
                } else if (current.type === 'resize-start') {
                    const pixels = deltaDays * CELL_WIDTH
                    const originalWidth = getXFromDate(current.originalEnd) - getXFromDate(current.originalStart)
                    const newWidth = originalWidth - pixels
                    if (newWidth >= CELL_WIDTH) {
                        el.style.left = `${getXFromDate(current.originalStart) + pixels}px`
                        el.style.width = `${newWidth}px`
                    }
                } else if (current.type === 'resize-end') {
                    const originalWidth = getXFromDate(current.originalEnd) - getXFromDate(current.originalStart)
                    const newWidth = originalWidth + (deltaDays * CELL_WIDTH)
                    if (newWidth >= CELL_WIDTH) {
                        el.style.width = `${newWidth}px`
                    }
                }
            }
        }

        const handleMouseUp = async (upEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)

            const current = draggingRef.current
            if (!current) return

            const deltaX = upEvent.clientX - current.startX
            const deltaDays = Math.round(deltaX / CELL_WIDTH)

            if (deltaDays !== 0) {
                let newStart = current.originalStart
                let newEnd = current.originalEnd

                if (current.type === 'move') {
                    newStart = addDays(current.originalStart, deltaDays)
                    newEnd = addDays(current.originalEnd, deltaDays)
                } else if (current.type === 'resize-start') {
                    const potential = addDays(current.originalStart, deltaDays)
                    if (differenceInDays(current.originalEnd, potential) >= 1) newStart = potential
                } else if (current.type === 'resize-end') {
                    const potential = addDays(current.originalEnd, deltaDays)
                    if (differenceInDays(potential, current.originalStart) >= 1) newEnd = potential
                }

                const loading = toast.loading("Atualizando cronograma...")
                const res = await updateRoadmapTaskDetails(current.id, project.id, {
                    start_date: newStart.toISOString(),
                    due_date: newEnd.toISOString()
                })

                if (res.success) {
                    toast.success("Tarefa atualizada", { id: loading })
                    onRefresh?.()
                } else {
                    toast.error("Erro ao atualizar", { id: loading })
                }
            }

            setDragging(null)
            draggingRef.current = null
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    // Header interaction to scroll view
    const moveView = (direction: 'next' | 'prev') => {
        if (direction === 'next') setViewDate(addWeeks(viewDate, 1))
        else setViewDate(subWeeks(viewDate, 1))
    }

    const allTasks = React.useMemo(() => stages.flatMap(s => s.tasks.map(t => ({ ...t, stageName: s.name }))), [stages])

    // Curated color palette for task bars
    const taskColors = [
        '#FF0054', // Pink
        '#88007F', // Purple
        '#06D6A0', // Emerald
        '#311C99', // Indigo
        '#FFBD00', // Gold
        '#FF5400', // Orange
        '#00B4D8', // Sky
    ]

    return (
        <div className="flex flex-col h-full bg-transparent border border-[#373737] rounded-[8px] overflow-hidden group/gantt relative">
            {/* Header / Controls */}
            <div className="flex items-center justify-between p-6 border-b border-[#373737]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#15171F] border border-[#373737] rounded-full p-1">
                        <button onClick={() => moveView('prev')} className="p-2 hover:bg-[#2E313C] rounded-full text-[#97A1B3] transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 text-[#97A1B3] text-sm font-bold font-inter-tight whitespace-nowrap">
                            {format(startDate, "d 'de' MMMM", { locale: pt })} - {format(addDays(startDate, VIEW_DAYS), "d 'de' MMMM", { locale: pt })}
                        </span>
                        <button onClick={() => moveView('next')} className="p-2 hover:bg-[#2E313C] rounded-full text-[#97A1B3] transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-[#15171F] border border-[#373737] rounded-full p-1">
                    <button
                        onClick={() => setZoom('day')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold font-inter-tight transition-all",
                            zoom === 'day' ? "bg-[#2E313C] text-[#97A1B3]" : "text-[#515151] hover:text-[#97A1B3]"
                        )}
                    >
                        Dia
                    </button>
                    <button
                        onClick={() => setZoom('week')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold font-inter-tight transition-all",
                            zoom === 'week' ? "bg-[#2E313C] text-[#97A1B3]" : "text-[#515151] hover:text-[#97A1B3]"
                        )}
                    >
                        Semana
                    </button>
                </div>
            </div>

            {/* Gantt Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Fixed Task List Side */}
                <div className="w-64 border-r border-[#373737] flex flex-col shrink-0 bg-[#0A0A0B]/50">
                    <div className="h-10 border-b border-[#373737] flex items-center px-4">
                        <span className="text-[10px] font-black text-[#97A1B3] tracking-widest">Tarefas</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {allTasks.map((task) => (
                            <div key={task.id} className="h-20 border-b border-[#373737]/30 flex flex-col justify-center px-4 hover:bg-[#15171F]/50 transition-colors group cursor-pointer">
                                <span className="text-sm font-bold text-[#97A1B3] truncate leading-tight group-hover:text-white transition-colors">
                                    {task.title}
                                </span>
                                <span className="text-[10px] text-[#515151] font-bold mt-1">{task.stageName}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Timeline Side */}
                <div className="flex-1 overflow-hidden flex flex-col relative bg-transparent">
                    {/* Days Header */}
                    <div className="h-10 border-b border-[#373737] flex overflow-hidden bg-[#0A0A0B]/30" ref={scrollRef}>
                        <div className="flex min-w-max h-full">
                            {timelineDays.map((date, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "border-r border-[#373737]/30 flex flex-col items-center justify-center shrink-0",
                                        isToday(date) ? "bg-accent-indigo/5" : ""
                                    )}
                                    style={{ width: `${CELL_WIDTH}px` }}
                                >
                                    <span className="text-[9px] font-bold text-[#515151] uppercase">{format(date, 'eee', { locale: pt })}</span>
                                    <span className={cn("text-[10px] font-black mt-0.5", isToday(date) ? "text-accent-indigo" : "text-[#97A1B3]")}>{format(date, 'd')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid and Bars */}
                    <div className="flex-1 overflow-auto no-scrollbar relative custom-scrollbar bg-transparent">
                        <div className="relative min-w-max h-full" style={{ width: `${timelineDays.length * CELL_WIDTH}px` }}>
                            {/* Vertical helper lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {timelineDays.map((date, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "border-r border-[#373737]/10 h-full",
                                            isToday(date) ? "bg-accent-indigo/[0.02] border-r-accent-indigo/10" : ""
                                        )}
                                        style={{ width: `${CELL_WIDTH}px` }}
                                    />
                                ))}
                            </div>

                            {/* Task Bars Overlay */}
                            <div className="relative z-10 pt-0">
                                {allTasks.map((task, i) => {
                                    const tStart = task.start_date ? parseISO(task.start_date) : addDays(new Date(), i)
                                    const tEnd = task.due_date ? parseISO(task.due_date) : addDays(tStart, 3)

                                    const left = getXFromDate(tStart)
                                    const width = getXFromDate(tEnd) - left
                                    const isOutsideHeader = left < -width || left > timelineDays.length * CELL_WIDTH

                                    if (isOutsideHeader) return <div key={task.id} className="h-20 border-b border-[#373737]/30" />

                                    const taskColor = taskColors[i % taskColors.length]

                                    return (
                                        <div key={task.id} className="h-20 border-b border-[#373737]/20 flex items-center relative group/bar">
                                            <motion.div
                                                id={`gantt-bar-${task.id}`}
                                                className={cn(
                                                    "absolute h-[60px] rounded-[100px] border border-[#373737] flex items-center transition-shadow cursor-move group-hover/bar:shadow-[0_0_25px_rgba(49,28,153,0.2)] overflow-hidden",
                                                )}
                                                style={{
                                                    left: `${left}px`,
                                                    width: `${Math.max(width, 180)}px`,
                                                    backgroundColor: `${taskColor}15`,
                                                    borderColor: `${taskColor}40`
                                                }}
                                                onMouseDown={(e) => handleTaskMouseDown(e, task, 'move')}
                                            >
                                                {/* Progress fill */}
                                                <div
                                                    className="absolute inset-y-0 left-0 transition-all duration-500 opacity-30"
                                                    style={{
                                                        width: task.completed ? '100%' : '20%',
                                                        backgroundColor: taskColor
                                                    }}
                                                />

                                                {/* Left Resize Handle */}
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/5 rounded-l-[100px] z-20"
                                                    onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize-start')}
                                                />

                                                {/* Content Above/In Bar */}
                                                <div className="flex items-center px-6 w-full gap-4 relative z-10 pointer-events-none">
                                                    {/* Assignee Avatar Above */}
                                                    <div className="absolute -top-10 left-6 flex items-center gap-2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 translate-y-2 group-hover/bar:translate-y-0">
                                                        {task.assignee?.avatar_url ? (
                                                            <div className="w-6 h-6 rounded-full border border-[#373737] overflow-hidden shadow-lg">
                                                                <Image src={task.assignee.avatar_url} alt="" width={24} height={24} className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-[#15171F] border border-[#373737] flex items-center justify-center shadow-lg">
                                                                <Users className="w-3 h-3 text-[#515151]" />
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] font-black text-[#97A1B3] bg-[#0A0A0B] px-2 py-1 rounded-full border border-[#373737] shadow-lg">
                                                            {task.assignee?.name || "Ninguém"}
                                                        </span>
                                                    </div>

                                                    {/* Progress Percent In Bar */}
                                                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                                                        <span
                                                            className="text-[18px] font-black text-[#97A1B3] truncate uppercase tracking-tighter mix-blend-plus-lighter"
                                                            style={{ color: task.completed ? '#06D6A0' : '#97A1B3' }}
                                                        >
                                                            {task.title}
                                                        </span>
                                                        <div className="flex items-end flex-col ml-4">
                                                            <span className="text-[14px] font-black tracking-tighter" style={{ color: taskColor }}>
                                                                {task.completed ? "100%" : "PROGRESSO"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Resize Handle */}
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/5 rounded-r-[100px] z-20"
                                                    onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize-end')}
                                                />
                                            </motion.div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #373737; border-radius: 10px; }
                :global(.cursor-ew-resize) { cursor: ew-resize !important; }
            `}</style>
        </div>
    )
}
