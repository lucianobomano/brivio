"use client"

import * as React from "react"
import type { Project, Stage } from "./ProjectsClient"
import type { RoadmapStage } from "@/app/actions/roadmap"
import {
    GanttChartSquare,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Settings2,
    CheckCircle2,
    Plus,
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Image from "next/image"
import {
    format,
    addDays,
    differenceInDays,
    startOfDay,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isToday,
    parseISO
} from "date-fns"
import { pt } from "date-fns/locale"
import { updateProjectTimeline } from "@/app/actions/projects"
import { updateRoadmapTaskDetails } from "@/app/actions/roadmap"
import { toast } from "sonner"

interface ProjectGanttViewProps {
    projects: Project[]
    tasks?: RoadmapStage['tasks'][0][]
    isTaskMode?: boolean
    stages?: (Stage | RoadmapStage)[]
    groupingField?: 'category' | 'none'
    projectId?: string
    onRefresh?: () => void
    onViewProject?: (project: Project) => void
    onOpenDetails?: (project: Project) => void
    onViewTask?: (task: RoadmapStage['tasks'][0]) => void
}

type ZoomLevel = 'day' | 'week' | 'month'

export function ProjectGanttView({
    projects,
    tasks = [],
    isTaskMode = false,
    stages = [],
    groupingField = 'none',
    projectId = '',
    onRefresh,
    onViewProject,
    onOpenDetails,
    onViewTask
}: ProjectGanttViewProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [viewDate, setViewDate] = React.useState(new Date())
    const [zoom, setZoom] = React.useState<ZoomLevel>('day')
    const [dragging, setDragging] = React.useState<{ id: string, type: 'move' | 'resize-start' | 'resize-end' | 'dependency', startX: number, originalStart: Date, originalEnd: Date } | null>(null)
    const [dependencyDraft, setDependencyDraft] = React.useState<{
        fromId: string,
        toX: number,
        toY: number,
        containerLeft: number,
        containerTop: number,
        scrollLeft: number,
        scrollTop: number
    } | null>(null)

    // Constants for grid
    const CELL_WIDTH = zoom === 'day' ? 60 : zoom === 'week' ? 30 : 15
    const ROW_HEIGHT = 56
    const VIEW_DAYS = zoom === 'day' ? 45 : zoom === 'week' ? 90 : 180

    // Rows logic for grouping
    const rows = React.useMemo(() => {
        if (isTaskMode) {
            if (stages.length > 0) {
                // Return stages as rows, holding their tasks
                return stages.map(s => {
                    const stage = s as RoadmapStage
                    return {
                        type: 'stage' as const,
                        data: stage,
                        tasks: stage.tasks || tasks.filter(t => t.status === stage.id)
                    }
                })
            }
            return tasks.map(t => ({ type: 'task' as const, data: t }))
        }

        if (groupingField !== 'category' || stages.length === 0) {
            return projects.map(p => ({ type: 'project' as const, data: p }))
        }

        const result: ({ type: 'header', data: Stage } | { type: 'project', data: Project } | { type: 'task', data: RoadmapStage['tasks'][0] })[] = []
        stages.forEach(stage => {
            const stageProjects = projects.filter(p => {
                const pCat = p.category || 'uncategorized'
                return pCat === stage.id
            })

            if (stageProjects.length > 0) {
                result.push({ type: 'header', data: stage })
                stageProjects.forEach(p => {
                    result.push({ type: 'project', data: p })
                })
            }
        })
        return result
    }, [projects, tasks, isTaskMode, stages, groupingField])

    // Range calculation
    const startDate = startOfDay(addDays(viewDate, -(VIEW_DAYS / 3)))
    const timelineDays = eachDayOfInterval({
        start: startDate,
        end: addDays(startDate, VIEW_DAYS)
    })

    const getXFromDate = React.useCallback((date: Date) => {
        const diff = differenceInDays(startOfDay(date), startDate)
        return diff * CELL_WIDTH
    }, [startDate, CELL_WIDTH])

    /* const getDateFromX = (x: number) => {
        const offsetDays = Math.round(x / CELL_WIDTH)
        return addDays(startDate, offsetDays)
    } */

    // Interaction Handlers
    const handleMouseDown = (e: React.MouseEvent, project: Project, type: 'move' | 'resize-start' | 'resize-end' | 'dependency') => {
        e.preventDefault()
        e.stopPropagation() // Prevent parent 'move' handler from firing when clicking handles

        const pStart = project.start_date ? parseISO(project.start_date) : new Date()
        const pEnd = project.due_date ? parseISO(project.due_date) : addDays(pStart, 3)

        if (type === 'dependency') {
            const containerRect = scrollRef.current?.getBoundingClientRect()
            setDependencyDraft({
                fromId: project.id,
                toX: e.clientX,
                toY: e.clientY,
                containerLeft: containerRect?.left || 0,
                containerTop: containerRect?.top || 0,
                scrollLeft: scrollRef.current?.scrollLeft || 0,
                scrollTop: scrollRef.current?.scrollTop || 0
            })
        } else {
            setDragging({
                id: project.id,
                type,
                startX: e.clientX,
                originalStart: pStart,
                originalEnd: pEnd
            })
        }

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (type === 'dependency') {
                setDependencyDraft(prev => prev ? { ...prev, toX: moveEvent.clientX, toY: moveEvent.clientY } : null)
                return
            }

            if (!dragging && !draggingRef.current) return
            const currentDragging = draggingRef.current
            if (!currentDragging) return

            const deltaX = moveEvent.clientX - currentDragging.startX
            const deltaDays = Math.round(deltaX / CELL_WIDTH)

            const projectEl = document.getElementById(`bar-${currentDragging.id}`)
            if (projectEl) {
                if (currentDragging.type === 'move') {
                    projectEl.style.transform = `translateX(${deltaX}px)`
                } else if (currentDragging.type === 'resize-start') {
                    const pixels = deltaDays * CELL_WIDTH
                    const originalWidth = getXFromDate(currentDragging.originalEnd) - getXFromDate(currentDragging.originalStart)
                    const newWidth = originalWidth - pixels

                    if (newWidth >= CELL_WIDTH) {
                        projectEl.style.left = `${getXFromDate(currentDragging.originalStart) + pixels}px`
                        projectEl.style.width = `${newWidth}px`
                    }
                } else if (currentDragging.type === 'resize-end') {
                    const pixels = deltaDays * CELL_WIDTH
                    const originalWidth = getXFromDate(currentDragging.originalEnd) - getXFromDate(currentDragging.originalStart)
                    const newWidth = originalWidth + pixels

                    if (newWidth >= CELL_WIDTH) {
                        projectEl.style.width = `${newWidth}px`
                    }
                }
            }
        }

        const handleMouseUp = async (upEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)

            if (type === 'dependency') {
                // Find if we dropped over another project
                const target = upEvent.target as HTMLElement
                const targetProjectRow = target.closest('[data-project-id]')
                const targetId = targetProjectRow?.getAttribute('data-project-id')

                if (targetId && targetId !== project.id) {
                    const res = await updateProjectTimeline(targetId, { dependency_id: project.id })
                    if (res.success) {
                        toast.success("Dependência criada")
                        onRefresh?.()
                    }
                }
                setDependencyDraft(null)
                return
            }

            const currentDragging = draggingRef.current
            if (!currentDragging) return

            const deltaX = upEvent.clientX - currentDragging.startX
            const deltaDays = Math.round(deltaX / CELL_WIDTH)

            if (deltaDays !== 0) {
                let newStart = currentDragging.originalStart
                let newEnd = currentDragging.originalEnd

                if (currentDragging.type === 'move') {
                    newStart = addDays(currentDragging.originalStart, deltaDays)
                    newEnd = addDays(currentDragging.originalEnd, deltaDays)
                } else if (currentDragging.type === 'resize-start') {
                    const potentialStart = addDays(currentDragging.originalStart, deltaDays)
                    if (differenceInDays(currentDragging.originalEnd, potentialStart) >= 1) {
                        newStart = potentialStart
                    } else {
                        newStart = addDays(currentDragging.originalEnd, -1)
                    }
                } else if (currentDragging.type === 'resize-end') {
                    const potentialEnd = addDays(currentDragging.originalEnd, deltaDays)
                    if (differenceInDays(potentialEnd, currentDragging.originalStart) >= 1) {
                        newEnd = potentialEnd
                    } else {
                        newEnd = addDays(currentDragging.originalStart, 1)
                    }
                }

                const res = await updateProjectTimeline(currentDragging.id, {
                    start_date: newStart.toISOString(),
                    due_date: newEnd.toISOString()
                })

                if (res.success) {
                    toast.success("Timeline atualizada")
                    onRefresh?.()
                } else {
                    toast.error("Erro ao atualizar timeline")
                }
            }

            setDragging(null)
            draggingRef.current = null
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    // Task drag handler for resize functionality
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

        const handleTaskMouseMove = (moveEvent: MouseEvent) => {
            const currentDragging = draggingRef.current
            if (!currentDragging) return

            const deltaX = moveEvent.clientX - currentDragging.startX
            const deltaDays = Math.round(deltaX / CELL_WIDTH)

            const taskEl = document.getElementById(`bar-${currentDragging.id}`)
            if (taskEl) {
                if (currentDragging.type === 'move') {
                    taskEl.style.transform = `translateX(${deltaX}px)`
                } else if (currentDragging.type === 'resize-start') {
                    const pixels = deltaDays * CELL_WIDTH
                    const originalWidth = getXFromDate(currentDragging.originalEnd) - getXFromDate(currentDragging.originalStart)
                    const newWidth = originalWidth - pixels

                    if (newWidth >= CELL_WIDTH) {
                        taskEl.style.left = `${getXFromDate(currentDragging.originalStart) + pixels}px`
                        taskEl.style.width = `${newWidth}px`
                    }
                } else if (currentDragging.type === 'resize-end') {
                    const pixels = deltaDays * CELL_WIDTH
                    const originalWidth = getXFromDate(currentDragging.originalEnd) - getXFromDate(currentDragging.originalStart)
                    const newWidth = originalWidth + pixels

                    if (newWidth >= CELL_WIDTH) {
                        taskEl.style.width = `${newWidth}px`
                    }
                }
            }
        }

        const handleTaskMouseUp = async (upEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleTaskMouseMove)
            document.removeEventListener('mouseup', handleTaskMouseUp)

            const currentDragging = draggingRef.current
            if (!currentDragging) return

            const deltaX = upEvent.clientX - currentDragging.startX
            const deltaDays = Math.round(deltaX / CELL_WIDTH)

            if (deltaDays !== 0) {
                let newStart = currentDragging.originalStart
                let newEnd = currentDragging.originalEnd

                if (currentDragging.type === 'move') {
                    newStart = addDays(currentDragging.originalStart, deltaDays)
                    newEnd = addDays(currentDragging.originalEnd, deltaDays)
                } else if (currentDragging.type === 'resize-start') {
                    const potentialStart = addDays(currentDragging.originalStart, deltaDays)
                    if (differenceInDays(currentDragging.originalEnd, potentialStart) >= 1) {
                        newStart = potentialStart
                    } else {
                        newStart = addDays(currentDragging.originalEnd, -1)
                    }
                } else if (currentDragging.type === 'resize-end') {
                    const potentialEnd = addDays(currentDragging.originalEnd, deltaDays)
                    if (differenceInDays(potentialEnd, currentDragging.originalStart) >= 1) {
                        newEnd = potentialEnd
                    } else {
                        newEnd = addDays(currentDragging.originalStart, 1)
                    }
                }

                const res = await updateRoadmapTaskDetails(currentDragging.id, projectId, {
                    start_date: newStart.toISOString(),
                    due_date: newEnd.toISOString()
                })

                if (res.success) {
                    toast.success("Duração da tarefa atualizada")
                    onRefresh?.()
                } else {
                    toast.error("Erro ao atualizar duração")
                }
            }

            setDragging(null)
            draggingRef.current = null
        }

        document.addEventListener('mousemove', handleTaskMouseMove)
        document.addEventListener('mouseup', handleTaskMouseUp)
    }

    const draggingRef = React.useRef(dragging)
    React.useEffect(() => { draggingRef.current = dragging }, [dragging])

    // Scroll to "today" on mount
    React.useEffect(() => {
        if (scrollRef.current) {
            const todayX = getXFromDate(new Date()) - 400
            scrollRef.current.scrollLeft = todayX
        }
    }, [zoom, getXFromDate]) // Include getXFromDate in dependencies

    return (
        <div className="flex flex-col h-full bg-bg-1 border border-bg-3 dark:border-bg-3 rounded-[12px] overflow-hidden shadow-xl min-h-[680px]">
            {/* Gantt Header */}
            <div className="p-6 border-b border-bg-3 dark:border-bg-3 flex items-center justify-between bg-bg-2/30 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-indigo/10 flex items-center justify-center border border-accent-indigo/20 shadow-inner">
                            <GanttChartSquare className="w-6 h-6 text-accent-indigo" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight leading-none">Power Timeline</h2>
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] mt-1">Integração & Dependências</p>
                        </div>
                    </div>

                    <div className="h-10 w-[1px] bg-bg-3 dark:bg-[#373737]" />

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-bg-3/50 p-1 rounded-xl">
                            <Button
                                onClick={() => setViewDate(subMonths(viewDate, 1))}
                                variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-bg-1">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => setViewDate(new Date())}
                                variant="ghost" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-bg-1">
                                Hoje
                            </Button>
                            <Button
                                onClick={() => setViewDate(addMonths(viewDate, 1))}
                                variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-bg-1">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center bg-bg-3/50 p-1 rounded-xl">
                            {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
                                <button
                                    key={z}
                                    onClick={() => setZoom(z)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        zoom === z ? "bg-bg-1 text-accent-indigo shadow-sm" : "text-text-tertiary hover:text-text-primary"
                                    )}
                                >
                                    {z === 'day' ? 'Dia' : z === 'week' ? 'Semana' : 'Mês'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-bg-2 rounded-xl border border-bg-3 dark:border-bg-3 shadow-sm">
                        <Calendar className="w-4 h-4 text-accent-indigo" />
                        <span className="text-xs font-bold text-text-primary uppercase tracking-tight">
                            {format(startDate, 'MMM yyyy', { locale: pt })}
                        </span>
                    </div>
                    <Button variant="outline" className="h-10 border-bg-3 dark:border-bg-3 rounded-xl hover:bg-bg-2 font-bold text-xs uppercase tracking-tight">
                        <Settings2 className="w-4 h-4 mr-2" />
                        Configurações
                    </Button>
                </div>
            </div>

            {/* Gantt Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Fixed Side - Project Names */}
                <div className="w-72 border-r border-bg-3 dark:border-bg-3 flex flex-col shrink-0 bg-bg-1 relative z-20 shadow-2xl">
                    <div className="h-14 border-b border-bg-3 dark:border-bg-3 flex items-center px-8 bg-bg-2/50">
                        <span className="text-[10px] font-black text-[#97A1B3] uppercase tracking-[0.2em]">Fluxo de Projectos</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {rows.map((row) => (
                            row.type === 'header' ? (
                                <div
                                    key={`header-${row.data.id}`}
                                    className="h-14 border-b border-bg-3 dark:border-bg-3 flex items-center px-6 bg-bg-1/30 backdrop-blur-sm sticky top-0 z-10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 rounded-full" style={{ backgroundColor: row.data.color }} />
                                        <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">{row.data.name}</span>
                                        <span className="text-[10px] font-bold text-text-tertiary bg-bg-2 px-2 py-0.5 rounded-full">
                                            {projects.filter(p => (p.category || 'uncategorized') === row.data.id).length}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                (row.type === 'project' || row.type === 'task') ? (
                                    <div
                                        key={row.data.id}
                                        className="h-14 border-b border-bg-3 dark:border-bg-3 flex items-center px-8 hover:bg-bg-2/30 transition-colors group cursor-pointer"
                                        onClick={() => {
                                            if (row.type === 'project') onOpenDetails?.(row.data as Project)
                                            if (row.type === 'task') onViewTask?.(row.data as RoadmapStage['tasks'][0])
                                        }}
                                    >
                                        <div className="flex items-center gap-4 truncate">
                                            <div className="w-8 h-8 rounded-xl bg-bg-2 border border-bg-3 flex items-center justify-center shrink-0 group-hover:border-accent-indigo/50 shadow-sm overflow-hidden relative transition-all duration-300 group-hover:scale-110">
                                                {row.type === 'task' ? (
                                                    <div className="w-full h-full bg-accent-indigo/10 flex items-center justify-center">
                                                        <Clock className="w-4 h-4 text-accent-indigo" />
                                                    </div>
                                                ) : (row.data as Project).brand?.logo_url ? (
                                                    <Image src={(row.data as Project).brand!.logo_url!} alt="" fill className="object-contain p-1" />
                                                ) : (
                                                    <span className="text-[11px] font-black text-accent-indigo uppercase">{(row.data as Project).name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-[13px] font-black text-text-primary truncate group-hover:text-accent-indigo transition-colors">
                                                    {row.type === 'task' ? (row.data as RoadmapStage['tasks'][0]).title : (row.data as Project).name}
                                                </span>
                                                <span className="text-[9px] font-bold text-[#97A1B3] uppercase tracking-tight">
                                                    {row.type === 'task' ? ((row.data as RoadmapStage['tasks'][0]).completed ? 'Concluída' : 'Em curso') : ((row.data as Project).brand?.name || "Sem Marca")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : row.type === 'stage' ? (
                                    <div
                                        key={row.data.id}
                                        className="h-14 border-b border-bg-3 dark:border-bg-3 flex items-center px-8 hover:bg-bg-2/30 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4 truncate">
                                            <div className="w-8 h-8 rounded-xl bg-bg-2 border border-bg-3 flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative transition-all duration-300">
                                                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${(row.data as RoadmapStage).color}15` }}>
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (row.data as RoadmapStage).color }} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-[13px] font-black text-text-primary truncate capitalize">
                                                    {(row.data as RoadmapStage).name}
                                                </span>
                                                <span className="text-[9px] font-bold text-[#97A1B3] uppercase tracking-tight">
                                                    {row.tasks?.length || 0} {(row.tasks?.length || 0) === 1 ? 'Tarefa' : 'Tarefas'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : null
                            )
                        ))}
                    </div>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 flex flex-col overflow-hidden bg-bg-0/30">
                    {/* Timeline Header */}
                    <div
                        className="h-14 border-b border-bg-3 dark:border-bg-3 flex overflow-x-auto no-scrollbar bg-bg-1/80 backdrop-blur-sm sticky top-0 z-10"
                        ref={scrollRef}
                    >
                        {timelineDays.map((date, i) => {
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "min-w-[60px] flex flex-col items-center justify-center border-r border-bg-3/50 shrink-0 transition-colors",
                                        isWeekend ? "bg-bg-2/20" : "",
                                        isToday(date) ? "bg-accent-indigo/5" : ""
                                    )}
                                    style={{ minWidth: `${CELL_WIDTH}px` }}
                                >
                                    <span className="text-[9px] font-black text-[#97A1B3] uppercase tracking-tighter">
                                        {format(date, 'eee', { locale: pt })}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-black mt-0.5",
                                        isToday(date) ? "text-accent-indigo scale-125" : "text-text-primary"
                                    )}>
                                        {format(date, 'd')}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Timeline Grid */}
                    <div className="flex-1 overflow-auto no-scrollbar relative custom-scrollbar">
                        <div
                            className="relative min-w-max h-full"
                            style={{ width: `${timelineDays.length * CELL_WIDTH}px` }}
                        >
                            {/* Vertical Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {timelineDays.map((date, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "border-r border-bg-3/30 dark:border-bg-3 h-full",
                                            isToday(date) ? "bg-accent-indigo/5 border-r-accent-indigo/20" : ""
                                        )}
                                        style={{ minWidth: `${CELL_WIDTH}px` }}
                                    />
                                ))}
                            </div>

                            {/* Gantt Bars */}
                            <div className="relative pt-0">
                                {rows.map((row, i) => {
                                    if (row.type === 'header') return <div key={`spacer-${row.data.id}`} className="h-14 border-b border-bg-3/10 bg-bg-2/5" />

                                    const renderBar = (item: any, isTask: boolean, rowIndex: number, taskIdx: number = 0) => {
                                        const startDate = item.start_date ? parseISO(item.start_date) : addDays(new Date(), taskIdx * 2)
                                        const endDate = item.due_date ? parseISO(item.due_date) : addDays(startDate, 4)

                                        const left = getXFromDate(startDate)
                                        const width = getXFromDate(endDate) - left

                                        return (
                                            <motion.div
                                                key={item.id}
                                                id={`bar-${item.id}`}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: rowIndex * 0.05 + taskIdx * 0.02 }}
                                                className={cn(
                                                    "absolute h-10 rounded-full shadow-xl flex items-center transition-all cursor-move z-10 group-hover:ring-4 ring-[#ff0054]/10",
                                                    dragging?.id === item.id ? "z-30 brightness-110 shadow-2xl scale-[1.02]" : "",
                                                    (isTask ? (item as RoadmapStage['tasks'][0]).completed : (item as Project).progress === 100) ? "bg-emerald-500/90" : "bg-accent-indigo"
                                                )}
                                                style={{
                                                    left: `${left}px`,
                                                    width: `${Math.max(width, CELL_WIDTH)}px`
                                                }}
                                                onMouseDown={(e) => {
                                                    if (!isTask) handleMouseDown(e, item as Project, 'move')
                                                    else handleTaskMouseDown(e, item as RoadmapStage['tasks'][0], 'move')
                                                }}
                                                onDoubleClick={() => {
                                                    if (!isTask) onViewProject?.(item as Project)
                                                    else onViewTask?.(item as RoadmapStage['tasks'][0])
                                                }}
                                            >
                                                {/* Left Resize Handle */}
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/10 rounded-l-full z-20"
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        if (!isTask) handleMouseDown(e, item as Project, 'resize-start')
                                                        else handleTaskMouseDown(e, item as RoadmapStage['tasks'][0], 'resize-start')
                                                    }}
                                                />

                                                <div className="flex items-center gap-2 text-white px-1.5 truncate w-full pointer-events-none select-none">
                                                    {(isTask ? item.assignee?.avatar_url : (item as Project).creator?.avatar_url) ? (
                                                        <div className="w-7 h-7 rounded-full border-2 border-white/20 overflow-hidden shrink-0 shadow-sm bg-bg-2">
                                                            <Image src={isTask ? item.assignee.avatar_url : (item as Project).creator?.avatar_url} alt="" width={28} height={28} className="object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
                                                            <Clock className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col truncate">
                                                        <span className="text-[10px] font-black uppercase tracking-tight truncate pr-4">
                                                            {isTask ? (item as RoadmapStage['tasks'][0]).title : (item as Project).name}
                                                        </span>
                                                        <span className="text-[8px] font-bold opacity-70 uppercase truncate">
                                                            {isTask ? ((item as RoadmapStage['tasks'][0]).completed ? 'Completa' : 'Em aberto') : `${(item as Project).progress}% Completo`}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right Resize Handle */}
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/10 rounded-r-full z-20"
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        if (!isTask) handleMouseDown(e, item as Project, 'resize-end')
                                                        else handleTaskMouseDown(e, item as RoadmapStage['tasks'][0], 'resize-end')
                                                    }}
                                                />

                                                {!isTask && (
                                                    <div
                                                        className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent-indigo border-2 border-white shadow-lg cursor-crosshair opacity-0 group-hover:opacity-100 transition-all hover:scale-125 z-20 flex items-center justify-center"
                                                        onMouseDown={(e) => handleMouseDown(e, item as Project, 'dependency')}
                                                    >
                                                        <Plus className="w-2 h-2 text-white" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        )
                                    }

                                    if (row.type === 'stage') {
                                        return (
                                            <div key={row.data.id} className="h-14 flex items-center relative group">
                                                {row.tasks?.map((task, tidx) => renderBar(task, true, i, tidx))}
                                            </div>
                                        )
                                    }

                                    const item = row.data as any
                                    const isTaskType = row.type === 'task'

                                    return (
                                        <div
                                            key={item.id}
                                            className="h-14 flex items-center relative group"
                                        >
                                            {renderBar(item, isTaskType, i)}

                                            {!isTaskType && (item as Project).dependency_id && (
                                                <DependencyLine
                                                    fromId={(item as Project).dependency_id!}
                                                    toId={item.id}
                                                    projects={projects}
                                                    getX={getXFromDate}
                                                    getY={(id) => rows.findIndex(r => {
                                                        const rData = r.data as any
                                                        return (r.type === 'project' || r.type === 'task' || r.type === 'stage') && rData.id === id
                                                    }) * ROW_HEIGHT + ROW_HEIGHT / 2}
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Dependency Draft Line */}
                            {dependencyDraft && (
                                <svg className="absolute inset-0 pointer-events-none z-50 overflow-visible w-full h-full">
                                    <line
                                        x1={getXFromDate(parseISO(projects.find(p => p.id === dependencyDraft.fromId)?.due_date || new Date().toISOString())) + 16}
                                        y1={rows.findIndex(r => r.type === 'project' && r.data.id === dependencyDraft.fromId) * ROW_HEIGHT + ROW_HEIGHT / 2}
                                        x2={dependencyDraft.toX - dependencyDraft.containerLeft + dependencyDraft.scrollLeft}
                                        y2={dependencyDraft.toY - dependencyDraft.containerTop + dependencyDraft.scrollTop}
                                        stroke="#FF0055"
                                        strokeWidth="2"
                                        strokeDasharray="4 2"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gantt Footer */}
            <div className="px-10 h-[80px] border-t border-bg-3 dark:border-bg-3 flex items-center justify-between bg-bg-2/30">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-4 group">
                        <div className="w-4 h-4 rounded-full bg-accent-indigo shadow-lg shadow-accent-indigo/20 ring-4 ring-accent-indigo/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Ativo</span>
                            <span className="text-[9px] font-bold text-[#97A1B3] uppercase">Projectos em curso</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Concluído</span>
                            <span className="text-[9px] font-bold text-[#97A1B3] uppercase">Projectos finalizados</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 px-8 py-3 bg-bg-1 rounded-2xl border border-bg-3 dark:border-bg-3 shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent-indigo/10">
                            <CheckCircle2 className="w-4 h-4 text-accent-indigo" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">Carga de Trabalho</p>
                            <p className="text-[12px] font-black text-accent-indigo tracking-tighter">84% Ocupado</p>
                        </div>
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
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--accent-indigo-rgb), 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--accent-indigo-rgb), 0.2);
                }
            `}</style>
        </div >
    )
}

function DependencyLine({ fromId, toId, projects, getX, getY }: { fromId: string, toId: string, projects: Project[], getX: (date: Date) => number, getY: (id: string) => number }) {
    const fromProject = projects.find((p) => p.id === fromId)
    const toProject = projects.find((p) => p.id === toId)

    if (!fromProject || !toProject) return null

    const fromX = getX(parseISO(fromProject.due_date || new Date().toISOString()))
    const toX = getX(parseISO(toProject.start_date || new Date().toISOString()))
    const fromY = getY(fromId)
    const toY = getY(toId)

    const midX = fromX + (toX - fromX) / 2

    return (
        <svg className="absolute inset-0 pointer-events-none overflow-visible w-full h-full z-0">
            <path
                d={`M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-bg-3"
                strokeDasharray="4 2"
            />
            <circle cx={toX} cy={toY} r="3" fill="currentColor" className="text-bg-3" />
        </svg>
    )
}

