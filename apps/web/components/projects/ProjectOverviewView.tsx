"use client"

import * as React from "react"
import {
    CheckCircle2,
    Circle,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Plus,
    ArrowRight,
    ArrowLeft,
    Eye,
    Maximize2,
    X,
    Filter,
    Pencil,
    Clock
} from "lucide-react"
import type { Project } from "./ProjectsClient"
import type { RoadmapStage } from "@/app/actions/roadmap"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

// Constantes e Tipos do Calendário Real do Gantt
type ZoomMode = "Days" | "Weeks" | "Months" | "Quarters" | "Year"
const ZOOM_LEVELS: ZoomMode[] = ["Year", "Quarters", "Months", "Weeks", "Days"]

// Marco Zero: 17 de Setembro de 2026 (Hoje)
const EPOCH_YEAR = 2026
const EPOCH_MONTH = 8 // Setembro (0-indexed: 8)
const EPOCH_DAY = 17

const EN_MONTHS_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]
const EN_WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface StepItem {
    id: string
    title: string
    status: "Done" | "Draft"
    completed: boolean
    startDay: number
    durationDays: number
}

interface PhaseItem {
    id: string
    number: number
    name: string
    startDay: number
    durationDays: number
    stepsCountText: string
    steps: StepItem[]
}

interface DragState {
    type: "move" | "resize"
    target: "stage" | "task"
    stageId: string
    taskId?: string
    startX: number
    initialStartDay: number
    initialDuration: number
}

interface EditItemModalState {
    target: "stage" | "task"
    stageId: string
    taskId?: string
    name: string
    startDay: number
    durationDays: number
}

interface ProjectOverviewViewProps {
    project: Project
    stages?: RoadmapStage[]
    onBack?: () => void
    onNavigateTab?: (tab: string) => void
}

export function ProjectOverviewView({
    project,
    stages = [],
    onBack,
    onNavigateTab
}: ProjectOverviewViewProps) {
    // Fases e tarefas iniciais ancoradas em Hoje = 0 (17 de Setembro de 2026)
    const initialPhases: PhaseItem[] = React.useMemo(() => {
        if (stages && stages.length > 0) {
            let runningDay = 0 // 17 de Setembro de 2026
            return stages.map((stage, idx) => {
                const stepDuration = 3
                const stageStart = runningDay
                const steps: StepItem[] = (stage.tasks && stage.tasks.length > 0)
                    ? stage.tasks.map((t, sIdx) => ({
                        id: t.id,
                        title: t.title,
                        status: t.completed ? "Done" : "Draft",
                        completed: !!t.completed,
                        startDay: stageStart + (sIdx * stepDuration),
                        durationDays: stepDuration
                    }))
                    : [
                        { id: `${stage.id}-s1`, title: "Alinhamento Inicial", status: "Done", completed: true, startDay: stageStart, durationDays: 3 },
                        { id: `${stage.id}-s2`, title: "Pesquisa & Auditoria", status: "Draft", completed: false, startDay: stageStart + 3, durationDays: 3 },
                        { id: `${stage.id}-s3`, title: "Conceito & Entrega", status: "Draft", completed: false, startDay: stageStart + 6, durationDays: 3 },
                    ]

                const stageDuration = steps.reduce((sum, s) => sum + s.durationDays, 0) || 9
                runningDay += stageDuration

                const completedCount = steps.filter(s => s.completed).length
                const stepsCountText = completedCount > 0
                    ? `${completedCount} de ${steps.length} concluídos`
                    : `${steps.length} passos`

                return {
                    id: stage.id,
                    number: idx + 1,
                    name: stage.name,
                    startDay: stageStart,
                    durationDays: stageDuration,
                    stepsCountText,
                    steps
                }
            })
        }

        return [
            {
                id: "phase-1",
                number: 1,
                name: "Discovery",
                startDay: 0, // 17 Set 2026
                durationDays: 9,
                stepsCountText: "3 de 3 concluídos",
                steps: [
                    { id: "p1-1", title: "Reunião de Alinhamento", status: "Done", completed: true, startDay: 0, durationDays: 3 },
                    { id: "p1-2", title: "Questionário de Marca", status: "Done", completed: true, startDay: 3, durationDays: 3 },
                    { id: "p1-3", title: "Auditoria Visual", status: "Done", completed: true, startDay: 6, durationDays: 3 },
                ]
            },
            {
                id: "phase-2",
                number: 2,
                name: "Inner World",
                startDay: 9, // 26 Set 2026
                durationDays: 8,
                stepsCountText: "3 passos",
                steps: [
                    { id: "p2-1", title: "Pesquisa de Mercado", status: "Draft", completed: false, startDay: 9, durationDays: 3 },
                    { id: "p2-2", title: "Mapeamento de Stakeholders", status: "Draft", completed: false, startDay: 12, durationDays: 2 },
                    { id: "p2-3", title: "Tom de Voz & Narrativa", status: "Draft", completed: false, startDay: 14, durationDays: 3 }
                ]
            },
            {
                id: "phase-3",
                number: 3,
                name: "Visual World",
                startDay: 17, // 4 Out 2026
                durationDays: 10,
                stepsCountText: "3 passos",
                steps: [
                    { id: "p3-1", title: "Moodboard & Direção de Arte", status: "Draft", completed: false, startDay: 17, durationDays: 3 },
                    { id: "p3-2", title: "Exploração Tipográfica", status: "Draft", completed: false, startDay: 20, durationDays: 3 },
                    { id: "p3-3", title: "Criação do Logótipo", status: "Draft", completed: false, startDay: 23, durationDays: 4 }
                ]
            },
            {
                id: "phase-4",
                number: 4,
                name: "Execution",
                startDay: 27, // 14 Out 2026
                durationDays: 12,
                stepsCountText: "3 passos",
                steps: [
                    { id: "p4-1", title: "Manual de Identidade", status: "Draft", completed: false, startDay: 27, durationDays: 4 },
                    { id: "p4-2", title: "Aplicações & Templates", status: "Draft", completed: false, startDay: 31, durationDays: 4 },
                    { id: "p4-3", title: "Ficheiros Finais de Entrega", status: "Draft", completed: false, startDay: 35, durationDays: 4 }
                ]
            }
        ]
    }, [stages])

    const [phases, setPhases] = React.useState<PhaseItem[]>(initialPhases)
    const [activePhaseIndex, setActivePhaseIndex] = React.useState(0)
    const [processView, setProcessView] = React.useState<"steps" | "plan">("steps")
    const [weekOffset, setWeekOffset] = React.useState(0)

    // Estados de Zoom e Dropdown do Gantt (Req 1)
    const [zoomMode, setZoomMode] = React.useState<ZoomMode>("Weeks")
    const [isZoomDropdownOpen, setIsZoomDropdownOpen] = React.useState(false)
    const zoomDropdownRef = React.useRef<HTMLDivElement>(null)

    // Janela dinâmica de dias para rolagem infinita (offset relativo a Hoje: 17 de Setembro de 2026 = 0)
    const [startOffsetDays, setStartOffsetDays] = React.useState(-365) // Inicia com ~1 ano no passado (Setembro de 2025)
    const [endOffsetDays, setEndOffsetDays] = React.useState(480) // Inicia com ~1.3 anos no futuro (Dezembro de 2027)

    const prevGridWidthRef = React.useRef(0)
    const isExtendingRef = React.useRef(false)

    // Estados para criação inline
    const [isAddingPhase, setIsAddingPhase] = React.useState(false)
    const [newPhaseName, setNewPhaseName] = React.useState("")
    const [isAddingStep, setIsAddingStep] = React.useState(false)
    const [newStepName, setNewStepName] = React.useState("")

    // Estado do Modal de Timeline
    const [isTimelineModalOpen, setIsTimelineModalOpen] = React.useState(false)
    const [timelineModalView, setTimelineModalView] = React.useState<"month" | "week">("month")

    // Estado de etapas expandidas no Gantt (fechadas por padrão como na imagem de referência)
    const [expandedStageIds, setExpandedStageIds] = React.useState<Record<string, boolean>>({})

    // Estado de arrastar / redimensionar
    const [dragState, setDragState] = React.useState<DragState | null>(null)

    // Estado do modal de edição de prazo/duração
    const [editModalItem, setEditModalItem] = React.useState<EditItemModalState | null>(null)

    // Referência de scroll para o Gantt
    const ganttScrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        setPhases(initialPhases)
    }, [initialPhases])

    const activePhase = phases[activePhaseIndex] || phases[0]

    // Funções de Zoom In (+) e Zoom Out (—)
    const handleZoomIn = () => {
        const currentIndex = ZOOM_LEVELS.indexOf(zoomMode)
        if (currentIndex < ZOOM_LEVELS.length - 1) {
            setZoomMode(ZOOM_LEVELS[currentIndex + 1])
        }
    }

    const handleZoomOut = () => {
        const currentIndex = ZOOM_LEVELS.indexOf(zoomMode)
        if (currentIndex > 0) {
            setZoomMode(ZOOM_LEVELS[currentIndex - 1])
        }
    }

    // Fechar dropdown de zoom ao clicar fora
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (zoomDropdownRef.current && !zoomDropdownRef.current.contains(e.target as Node)) {
                setIsZoomDropdownOpen(false)
            }
        }
        if (isZoomDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isZoomDropdownOpen])

    // Interface para cabeçalhos e colunas do Gantt
    interface GanttTopHeader {
        key: string
        label: string
        width: number
    }

    interface GanttSubColumn {
        key: string
        label: string
        width: number
        isWeekend?: boolean
        pillToday?: boolean
        circleToday?: boolean
        isCurrentMonth?: boolean
    }

    // Geração Dinâmica Multi-Zoom do Calendário (Days, Weeks, Months, Quarters, Year)
    const {
        topHeaders,
        subColumns,
        totalGridWidth,
        getPixelX,
        getPixelWidth,
        pixelsPerDay,
        todayPixelX
    } = React.useMemo(() => {
        if (zoomMode === "Days") {
            const DAY_WIDTH = 64
            const subCols: GanttSubColumn[] = []
            const monthsMap = new Map<string, { label: string; count: number }>()

            for (let offset = startOffsetDays; offset < endOffsetDays; offset++) {
                const d = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + offset)
                const dayOfWeek = d.getDay()
                const dayNum = d.getDate()
                const mIdx = d.getMonth()
                const year = d.getFullYear()
                const isToday = offset === 0
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                const weekday = EN_WEEKDAYS_SHORT[dayOfWeek]
                const label = `${weekday} ${dayNum}`
                const colKey = `day-${offset}`

                subCols.push({
                    key: colKey,
                    label,
                    width: DAY_WIDTH,
                    isWeekend,
                    pillToday: isToday
                })

                const monthKey = `${mIdx}-${year}`
                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, {
                        label: `${EN_MONTHS_SHORT[mIdx]} ${year}`,
                        count: 1
                    })
                } else {
                    monthsMap.get(monthKey)!.count++
                }
            }

            const headers: GanttTopHeader[] = Array.from(monthsMap.entries()).map(([k, m]) => ({
                key: `month-${k}`,
                label: m.label,
                width: m.count * DAY_WIDTH
            }))

            const totalWidth = subCols.length * DAY_WIDTH
            const getX = (offset: number) => (offset - startOffsetDays) * DAY_WIDTH
            const getW = (start: number, dur: number) => Math.max(28, dur * DAY_WIDTH)
            const todayX = (0 - startOffsetDays) * DAY_WIDTH + Math.round(DAY_WIDTH / 2)

            return {
                topHeaders: headers,
                subColumns: subCols,
                totalGridWidth: totalWidth,
                getPixelX: getX,
                getPixelWidth: getW,
                pixelsPerDay: DAY_WIDTH,
                todayPixelX: todayX
            }
        }

        if (zoomMode === "Weeks") {
            const DAY_WIDTH = 30
            const subCols: GanttSubColumn[] = []
            const monthsMap = new Map<string, { label: string; count: number }>()

            for (let offset = startOffsetDays; offset < endOffsetDays; offset++) {
                const d = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + offset)
                const dayOfWeek = d.getDay()
                const dayNum = d.getDate()
                const mIdx = d.getMonth()
                const year = d.getFullYear()
                const isToday = offset === 0
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                subCols.push({
                    key: `week-day-${offset}`,
                    label: String(dayNum),
                    width: DAY_WIDTH,
                    isWeekend,
                    circleToday: isToday
                })

                const monthKey = `${mIdx}-${year}`
                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, {
                        label: `${EN_MONTHS_SHORT[mIdx]} ${year}`,
                        count: 1
                    })
                } else {
                    monthsMap.get(monthKey)!.count++
                }
            }

            const headers: GanttTopHeader[] = Array.from(monthsMap.entries()).map(([k, m]) => ({
                key: `month-${k}`,
                label: m.label,
                width: m.count * DAY_WIDTH
            }))

            const totalWidth = subCols.length * DAY_WIDTH
            const getX = (offset: number) => (offset - startOffsetDays) * DAY_WIDTH
            const getW = (start: number, dur: number) => Math.max(24, dur * DAY_WIDTH)
            const todayX = (0 - startOffsetDays) * DAY_WIDTH + Math.round(DAY_WIDTH / 2)

            return {
                topHeaders: headers,
                subColumns: subCols,
                totalGridWidth: totalWidth,
                getPixelX: getX,
                getPixelWidth: getW,
                pixelsPerDay: DAY_WIDTH,
                todayPixelX: todayX
            }
        }

        if (zoomMode === "Months") {
            const WEEK_WIDTH = 76
            const subCols: GanttSubColumn[] = []
            const monthsMap = new Map<string, { label: string; count: number }>()

            // Encontra a segunda-feira na ou imediatamente antes de startOffsetDays
            const dStart = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + startOffsetDays)
            const dayOfWeek = dStart.getDay() // 0=Dom, 1=Seg, ..., 6=Sáb
            const daysSinceMonday = (dayOfWeek + 6) % 7
            const firstMondayOffset = startOffsetDays - daysSinceMonday

            let mondayOffset = firstMondayOffset
            while (mondayOffset < endOffsetDays) {
                const mDate = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + mondayOffset)
                const dayNum = mDate.getDate()
                const mIdx = mDate.getMonth()
                const year = mDate.getFullYear()
                const label = `${dayNum} ${EN_MONTHS_SHORT[mIdx]}`

                subCols.push({
                    key: `month-week-${mondayOffset}`,
                    label,
                    width: WEEK_WIDTH,
                    isWeekend: false
                })

                const monthKey = `${mIdx}-${year}`
                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, {
                        label: `${EN_MONTHS_SHORT[mIdx]} ${year}`,
                        count: 1
                    })
                } else {
                    monthsMap.get(monthKey)!.count++
                }

                mondayOffset += 7
            }

            const headers: GanttTopHeader[] = Array.from(monthsMap.entries()).map(([k, m]) => ({
                key: `month-hdr-${k}`,
                label: m.label,
                width: m.count * WEEK_WIDTH
            }))

            const totalWidth = subCols.length * WEEK_WIDTH
            const pixelsPerDay = WEEK_WIDTH / 7
            const getX = (offset: number) => (offset - firstMondayOffset) * pixelsPerDay
            const getW = (start: number, dur: number) => Math.max(28, dur * pixelsPerDay)
            const todayX = (0 - firstMondayOffset) * pixelsPerDay + (pixelsPerDay / 2)

            return {
                topHeaders: headers,
                subColumns: subCols,
                totalGridWidth: totalWidth,
                getPixelX: getX,
                getPixelWidth: getW,
                pixelsPerDay,
                todayPixelX: todayX
            }
        }

        if (zoomMode === "Quarters") {
            const MONTH_WIDTH = 76
            const dStart = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + startOffsetDays)
            const dEnd = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + endOffsetDays)
            const startY = dStart.getFullYear()
            const startM = dStart.getMonth()
            const endY = dEnd.getFullYear()
            const endM = dEnd.getMonth()

            const monthCols: {
                key: string
                label: string
                startDayOffset: number
                daysCount: number
                pixelLeft: number
                quarterKey: string
                quarterLabel: string
                isCurrentMonth?: boolean
            }[] = []

            let curY = startY
            let curM = startM
            let colIdx = 0
            const epochTime = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY).getTime()

            while (curY < endY || (curY === endY && curM <= endM)) {
                const firstDay = new Date(curY, curM, 1)
                const daysInMonth = new Date(curY, curM + 1, 0).getDate()
                const startDayOffset = Math.round((firstDay.getTime() - epochTime) / 86400000)
                const qNum = Math.floor(curM / 3) + 1
                const quarterLabel = `Q${qNum} ${curY}`
                const quarterKey = `Q${qNum}-${curY}`
                const isCurrentMonth = curY === 2026 && curM === 8 // Setembro de 2026

                monthCols.push({
                    key: `quarter-month-${curY}-${curM}`,
                    label: EN_MONTHS_SHORT[curM],
                    startDayOffset,
                    daysCount: daysInMonth,
                    pixelLeft: colIdx * MONTH_WIDTH,
                    quarterKey,
                    quarterLabel,
                    isCurrentMonth
                })

                colIdx++
                curM++
                if (curM > 11) {
                    curM = 0
                    curY++
                }
            }

            const quartersMap = new Map<string, { label: string; count: number }>()
            for (const m of monthCols) {
                if (!quartersMap.has(m.quarterKey)) {
                    quartersMap.set(m.quarterKey, { label: m.quarterLabel, count: 1 })
                } else {
                    quartersMap.get(m.quarterKey)!.count++
                }
            }

            const headers: GanttTopHeader[] = Array.from(quartersMap.entries()).map(([k, q]) => ({
                key: `quarter-hdr-${k}`,
                label: q.label,
                width: q.count * MONTH_WIDTH
            }))

            const subCols: GanttSubColumn[] = monthCols.map(m => ({
                key: m.key,
                label: m.label,
                width: MONTH_WIDTH,
                isCurrentMonth: m.isCurrentMonth
            }))

            const totalWidth = subCols.length * MONTH_WIDTH
            const pixelsPerDay = MONTH_WIDTH / 30.4

            const getX = (offset: number) => {
                if (monthCols.length === 0) return 0
                for (let i = 0; i < monthCols.length; i++) {
                    const mc = monthCols[i]
                    if (offset >= mc.startDayOffset && offset < mc.startDayOffset + mc.daysCount) {
                        const progress = (offset - mc.startDayOffset) / mc.daysCount
                        return mc.pixelLeft + progress * MONTH_WIDTH
                    }
                }
                const first = monthCols[0]
                if (offset < first.startDayOffset) {
                    return (offset - first.startDayOffset) * pixelsPerDay
                }
                const last = monthCols[monthCols.length - 1]
                return last.pixelLeft + MONTH_WIDTH + (offset - (last.startDayOffset + last.daysCount)) * pixelsPerDay
            }

            const getW = (start: number, dur: number) => Math.max(28, getX(start + dur) - getX(start))
            const todayX = getX(0) + Math.round((17 / 30) * MONTH_WIDTH)

            return {
                topHeaders: headers,
                subColumns: subCols,
                totalGridWidth: totalWidth,
                getPixelX: getX,
                getPixelWidth: getW,
                pixelsPerDay,
                todayPixelX: todayX
            }
        }

        // zoomMode === "Year"
        {
            const MONTH_WIDTH = 50
            const dStart = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + startOffsetDays)
            const dEnd = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + endOffsetDays)
            const startY = dStart.getFullYear()
            const startM = dStart.getMonth()
            const endY = dEnd.getFullYear()
            const endM = dEnd.getMonth()

            const monthCols: {
                key: string
                label: string
                startDayOffset: number
                daysCount: number
                pixelLeft: number
                yearKey: string
                yearLabel: string
                isCurrentMonth?: boolean
            }[] = []

            let curY = startY
            let curM = startM
            let colIdx = 0
            const epochTime = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY).getTime()

            while (curY < endY || (curY === endY && curM <= endM)) {
                const firstDay = new Date(curY, curM, 1)
                const daysInMonth = new Date(curY, curM + 1, 0).getDate()
                const startDayOffset = Math.round((firstDay.getTime() - epochTime) / 86400000)
                const yearLabel = `${curY}`
                const yearKey = `year-${curY}`
                const isCurrentMonth = curY === 2026 && curM === 8 // Setembro de 2026

                monthCols.push({
                    key: `year-month-${curY}-${curM}`,
                    label: EN_MONTHS_SHORT[curM],
                    startDayOffset,
                    daysCount: daysInMonth,
                    pixelLeft: colIdx * MONTH_WIDTH,
                    yearKey,
                    yearLabel,
                    isCurrentMonth
                })

                colIdx++
                curM++
                if (curM > 11) {
                    curM = 0
                    curY++
                }
            }

            const yearsMap = new Map<string, { label: string; count: number }>()
            for (const m of monthCols) {
                if (!yearsMap.has(m.yearKey)) {
                    yearsMap.set(m.yearKey, { label: m.yearLabel, count: 1 })
                } else {
                    yearsMap.get(m.yearKey)!.count++
                }
            }

            const headers: GanttTopHeader[] = Array.from(yearsMap.entries()).map(([k, y]) => ({
                key: `year-hdr-${k}`,
                label: y.label,
                width: y.count * MONTH_WIDTH
            }))

            const subCols: GanttSubColumn[] = monthCols.map(m => ({
                key: m.key,
                label: m.label,
                width: MONTH_WIDTH,
                isCurrentMonth: m.isCurrentMonth
            }))

            const totalWidth = subCols.length * MONTH_WIDTH
            const pixelsPerDay = MONTH_WIDTH / 30.4

            const getX = (offset: number) => {
                if (monthCols.length === 0) return 0
                for (let i = 0; i < monthCols.length; i++) {
                    const mc = monthCols[i]
                    if (offset >= mc.startDayOffset && offset < mc.startDayOffset + mc.daysCount) {
                        const progress = (offset - mc.startDayOffset) / mc.daysCount
                        return mc.pixelLeft + progress * MONTH_WIDTH
                    }
                }
                const first = monthCols[0]
                if (offset < first.startDayOffset) {
                    return (offset - first.startDayOffset) * pixelsPerDay
                }
                const last = monthCols[monthCols.length - 1]
                return last.pixelLeft + MONTH_WIDTH + (offset - (last.startDayOffset + last.daysCount)) * pixelsPerDay
            }

            const getW = (start: number, dur: number) => Math.max(24, getX(start + dur) - getX(start))
            const todayX = getX(0) + Math.round((17 / 30) * MONTH_WIDTH)

            return {
                topHeaders: headers,
                subColumns: subCols,
                totalGridWidth: totalWidth,
                getPixelX: getX,
                getPixelWidth: getW,
                pixelsPerDay,
                todayPixelX: todayX
            }
        }
    }, [zoomMode, startOffsetDays, endOffsetDays])

    // Rolagem infinita bidirecional: estende dinamicamente o calendário sem travar
    const handleGanttScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        const { scrollLeft, scrollWidth, clientWidth } = target

        const extendStep = (zoomMode === "Year" || zoomMode === "Quarters") ? 365 : (zoomMode === "Months" ? 140 : 60)

        // Se estiver a menos de 350px da borda esquerda, renderiza mais no passado
        if (scrollLeft < 350 && !isExtendingRef.current) {
            isExtendingRef.current = true
            prevGridWidthRef.current = totalGridWidth
            setStartOffsetDays(prev => prev - extendStep)
            setTimeout(() => {
                isExtendingRef.current = false
            }, 100)
        }
        // Se estiver a menos de 350px da borda direita, renderiza mais no futuro
        else if (scrollLeft + clientWidth > scrollWidth - 350 && !isExtendingRef.current) {
            isExtendingRef.current = true
            setEndOffsetDays(prev => prev + extendStep)
            setTimeout(() => {
                isExtendingRef.current = false
            }, 100)
        }
    }, [zoomMode, totalGridWidth])

    // Compensação instantânea de scroll no layout para eliminar saltos visuais ao adicionar dias no passado
    React.useLayoutEffect(() => {
        if (prevGridWidthRef.current > 0 && ganttScrollRef.current) {
            const diff = totalGridWidth - prevGridWidthRef.current
            if (diff > 0) {
                ganttScrollRef.current.scrollLeft += diff
            }
            prevGridWidthRef.current = 0
        }
    }, [totalGridWidth])

    // Centralizar em Hoje ao mudar para o modo Plano ou ao alterar o zoom
    React.useEffect(() => {
        if (processView === "plan" && ganttScrollRef.current) {
            const timer = setTimeout(() => {
                if (ganttScrollRef.current) {
                    const targetScroll = getPixelX(0) - 240
                    ganttScrollRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: "auto" })
                }
            }, 40)
            return () => clearTimeout(timer)
        }
    }, [processView, zoomMode, getPixelX])

    // Alternar colapso de etapa no Gantt
    const toggleStageExpand = (stageId: string) => {
        setExpandedStageIds(prev => ({
            ...prev,
            [stageId]: !prev[stageId]
        }))
    }

    // Função que recalcula e ajusta automaticamente tarefas e etapas posteriores em cascata
    const recalculateCascade = React.useCallback((currentPhases: PhaseItem[]): PhaseItem[] => {
        let lastEndDay = currentPhases[0]?.startDay ?? 0

        return currentPhases.map((phase, pIdx) => {
            let phaseStart = pIdx === 0 ? phase.startDay : Math.max(phase.startDay, lastEndDay)

            let taskRunningDay = phaseStart
            const updatedSteps = phase.steps.map((step, sIdx) => {
                const stepStart = sIdx === 0 ? Math.max(step.startDay, phaseStart) : Math.max(step.startDay, taskRunningDay)
                taskRunningDay = stepStart + Math.max(1, step.durationDays)
                return {
                    ...step,
                    startDay: stepStart,
                    durationDays: Math.max(1, step.durationDays)
                }
            })

            const phaseEnd = updatedSteps.length > 0
                ? Math.max(...updatedSteps.map(s => s.startDay + s.durationDays))
                : phaseStart + Math.max(1, phase.durationDays)

            const computedDuration = phaseEnd - phaseStart
            lastEndDay = phaseEnd

            return {
                ...phase,
                startDay: phaseStart,
                durationDays: computedDuration,
                steps: updatedSteps
            }
        })
    }, [])

    // Iniciar arrasto de mover ou redimensionar no badge
    const handleStartDrag = (
        e: React.PointerEvent,
        type: "move" | "resize",
        target: "stage" | "task",
        stageId: string,
        taskId?: string
    ) => {
        e.stopPropagation()
        e.preventDefault()

        const currentStage = phases.find(p => p.id === stageId)
        if (!currentStage) return

        let initialStartDay = currentStage.startDay
        let initialDuration = currentStage.durationDays

        if (target === "task" && taskId) {
            const currentTask = currentStage.steps.find(s => s.id === taskId)
            if (currentTask) {
                initialStartDay = currentTask.startDay
                initialDuration = currentTask.durationDays
            }
        }

        setDragState({
            type,
            target,
            stageId,
            taskId,
            startX: e.clientX,
            initialStartDay,
            initialDuration
        })
    }

    // Processar movimento do ponteiro durante arrasto
    React.useEffect(() => {
        if (!dragState) return

        const handlePointerMove = (e: PointerEvent) => {
            const deltaX = e.clientX - dragState.startX
            const deltaDays = Math.round(deltaX / pixelsPerDay)
            if (deltaDays === 0) return

            setPhases(prev => {
                const updated = prev.map(phase => {
                    if (phase.id !== dragState.stageId) return phase

                    if (dragState.target === "stage") {
                        if (dragState.type === "move") {
                            const newStart = dragState.initialStartDay + deltaDays
                            const shift = newStart - phase.startDay
                            return {
                                ...phase,
                                startDay: newStart,
                                steps: phase.steps.map(s => ({
                                    ...s,
                                    startDay: s.startDay + shift
                                }))
                            }
                        } else {
                            const newDuration = Math.max(1, dragState.initialDuration + deltaDays)
                            return {
                                ...phase,
                                durationDays: newDuration
                            }
                        }
                    } else if (dragState.target === "task" && dragState.taskId) {
                        const updatedSteps = phase.steps.map(step => {
                            if (step.id !== dragState.taskId) return step
                            if (dragState.type === "move") {
                                return {
                                    ...step,
                                    startDay: phase.startDay + Math.max(0, (dragState.initialStartDay - phase.startDay) + deltaDays)
                                }
                            } else {
                                return {
                                    ...step,
                                    durationDays: Math.max(1, dragState.initialDuration + deltaDays)
                                }
                            }
                        })
                        return {
                            ...phase,
                            steps: updatedSteps
                        }
                    }
                    return phase
                })

                return recalculateCascade(updated)
            })
        }

        const handlePointerUp = () => {
            setDragState(null)
            toast.success("Duração e cronograma ajustados com sucesso")
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
        }
    }, [dragState, pixelsPerDay, recalculateCascade])

    // Salvar edição manual do modal de prazo/duração
    const handleSaveEditModal = () => {
        if (!editModalItem) return

        setPhases(prev => {
            const updated = prev.map(phase => {
                if (phase.id !== editModalItem.stageId) return phase

                if (editModalItem.target === "stage") {
                    return {
                        ...phase,
                        name: editModalItem.name.trim() || phase.name,
                        startDay: Math.max(0, editModalItem.startDay),
                        durationDays: Math.max(1, editModalItem.durationDays)
                    }
                } else if (editModalItem.target === "task" && editModalItem.taskId) {
                    return {
                        ...phase,
                        steps: phase.steps.map(step => {
                            if (step.id !== editModalItem.taskId) return step
                            return {
                                ...step,
                                title: editModalItem.name.trim() || step.title,
                                startDay: Math.max(phase.startDay, editModalItem.startDay),
                                durationDays: Math.max(1, editModalItem.durationDays)
                            }
                        })
                    }
                }
                return phase
            })

            return recalculateCascade(updated)
        })

        toast.success("Prazo atualizado com sucesso")
        setEditModalItem(null)
    }

    // Alternar conclusão de tarefa
    const handleToggleStep = (stepId: string) => {
        setPhases(prev => prev.map((phase, pIdx) => {
            if (pIdx !== activePhaseIndex) return phase
            const newSteps = phase.steps.map(step => {
                if (step.id !== stepId) return step
                const nextCompleted = !step.completed
                return {
                    ...step,
                    completed: nextCompleted,
                    status: (nextCompleted ? "Done" : "Draft") as "Done" | "Draft"
                }
            })
            const completedCount = newSteps.filter(s => s.completed).length
            const stepsCountText = completedCount > 0
                ? `${completedCount} de ${newSteps.length} concluídos`
                : `${newSteps.length} passos`
            return {
                ...phase,
                steps: newSteps,
                stepsCountText
            }
        }))
    }

    // Criar nova etapa inline
    const handleCreatePhase = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newPhaseName.trim()) return

        const lastPhase = phases[phases.length - 1]
        const startDay = lastPhase ? lastPhase.startDay + lastPhase.durationDays : 15

        const newPhase: PhaseItem = {
            id: `custom-phase-${Date.now()}`,
            number: phases.length + 1,
            name: newPhaseName.trim(),
            startDay,
            durationDays: 7,
            stepsCountText: "0 passos",
            steps: []
        }
        setPhases(prev => [...prev, newPhase])
        setActivePhaseIndex(phases.length)
        setNewPhaseName("")
        setIsAddingPhase(false)
        toast.success(`Etapa "${newPhaseName.trim()}" criada`)
    }

    // Criar nova tarefa inline
    const handleCreateStep = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newStepName.trim()) return

        setPhases(prev => {
            const updated = prev.map((phase, pIdx) => {
                if (pIdx !== activePhaseIndex) return phase

                const lastStep = phase.steps[phase.steps.length - 1]
                const taskStart = lastStep ? lastStep.startDay + lastStep.durationDays : phase.startDay

                const newSteps: StepItem[] = [
                    ...phase.steps,
                    {
                        id: `custom-step-${Date.now()}`,
                        title: newStepName.trim(),
                        status: "Draft",
                        completed: false,
                        startDay: taskStart,
                        durationDays: 3
                    }
                ]
                const completedCount = newSteps.filter(s => s.completed).length
                const stepsCountText = completedCount > 0
                    ? `${completedCount} de ${newSteps.length} concluídos`
                    : `${newSteps.length} passos`
                return {
                    ...phase,
                    steps: newSteps,
                    stepsCountText
                }
            })
            return recalculateCascade(updated)
        })

        setNewStepName("")
        setIsAddingStep(false)
        toast.success("Tarefa adicionada com sucesso")
    }

    // Concluir etapa atual
    const handleFinishPhase = () => {
        setPhases(prev => prev.map((phase, pIdx) => {
            if (pIdx !== activePhaseIndex) return phase
            const newSteps = phase.steps.map(s => ({
                ...s,
                completed: true,
                status: "Done" as const
            }))
            return {
                ...phase,
                steps: newSteps,
                stepsCountText: `${newSteps.length} de ${newSteps.length} concluídos`
            }
        }))

        toast.success(`Etapa "${activePhase.name}" concluída!`)

        if (activePhaseIndex < phases.length - 1) {
            setActivePhaseIndex(activePhaseIndex + 1)
        }
    }

    // Helper de conversão de índice de dia para string formatada
    const getFormattedDateFromOffset = (dayOffset: number) => {
        const d = new Date(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY + dayOffset)
        const day = d.getDate()
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
    }

    // Dias da semana da timeline inferior
    const timelineDays = [
        { label: "Seg", day: 14 },
        { label: "Ter", day: 15 },
        { label: "Qua", day: 16, isToday: true },
        { label: "Qui", day: 17 },
        { label: "Sex", day: 18 },
        { label: "Sáb", day: 19 },
        { label: "Dom", day: 20 },
    ]

    const initialLetter = (project.name || "O")[0]?.toUpperCase() || "O"

    return (
        <div className="w-full max-w-[1520px] mx-auto flex flex-col gap-6 pb-36 font-sans animate-in fade-in duration-500">
            {/* CSS Scoped para a barra de rolagem horizontal com altura h-7px (Req 2) */}
            <style dangerouslySetInnerHTML={{ __html: `
                .gantt-scroll-container::-webkit-scrollbar {
                    height: 7px !important;
                    width: 7px !important;
                }
                .gantt-scroll-container::-webkit-scrollbar-track {
                    background: #060606 !important;
                    border-radius: 9999px !important;
                }
                .gantt-scroll-container::-webkit-scrollbar-thumb {
                    background: #3f3f46 !important;
                    border-radius: 9999px !important;
                    height: 7px !important;
                }
                .gantt-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #52525b !important;
                }
                .gantt-scroll-container {
                    scrollbar-width: thin !important;
                    scrollbar-color: #3f3f46 #060606 !important;
                }
            ` }} />


            {/* Layout Principal: Card "O processo" (Esquerda/Centro) + Sidebar (Direita, w-[286px]) */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Card "O processo" - Mesma estrutura e transição interna entre Passos e Plano (largura máx 1305px) */}
                <div className="flex-1 min-w-0 max-w-[1305px] w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm dark:shadow-2xl relative min-h-[460px] flex flex-col justify-between text-zinc-900 dark:text-zinc-100">
                    <div>
                        {/* Cabeçalho do Card */}
                        <div className="flex items-center justify-between pb-6 border-b border-zinc-200/80 dark:border-white/[0.06]">
                            <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
                                <span>O processo</span>
                                <span className="text-zinc-400 dark:text-zinc-600 tracking-widest ml-1">···</span>
                            </div>

                            {/* Alternador Segmentado: Passos | Plano */}
                            <div className="bg-zinc-100 dark:bg-[#050507] border border-zinc-200 dark:border-white/[0.08] p-0.5 rounded-lg flex items-center gap-1">
                                <button
                                    onClick={() => setProcessView("steps")}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                        processView === "steps"
                                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                    )}
                                >
                                    Passos
                                </button>
                                <button
                                    onClick={() => setProcessView("plan")}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                        processView === "plan"
                                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                    )}
                                >
                                    Plano
                                </button>
                            </div>
                        </div>

                        {/* Corpo do Card: Visualização "Passos" vs "Plano" (Gantt Interativo) */}
                        {processView === "steps" ? (
                            <div className="grid grid-cols-12 gap-6 mt-6 items-stretch">
                                {/* Sub-coluna da Esquerda: Stepper Vertical de Etapas */}
                                <div className="col-span-12 md:col-span-5 relative pr-4">
                                    {/* Linha vertical conectora */}
                                    <div className="absolute left-[23px] top-6 bottom-8 w-px bg-zinc-200 dark:bg-zinc-800/80 pointer-events-none" />

                                    <div className="flex flex-col gap-2 relative z-10">
                                        {phases.map((phase, idx) => {
                                            const isActive = idx === activePhaseIndex
                                            const isDone = phase.steps.length > 0 && phase.steps.every(s => s.completed)

                                            return (
                                                <button
                                                    key={phase.id}
                                                    onClick={() => setActivePhaseIndex(idx)}
                                                    className={cn(
                                                        "w-full text-left rounded-xl transition-all duration-200 flex items-center gap-3 px-3 py-2.5 group",
                                                        isActive
                                                            ? "bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.1] shadow-xs"
                                                            : "hover:bg-zinc-50 dark:hover:bg-white/[0.03] border border-transparent"
                                                    )}
                                                >
                                                    {/* Badge Numérico */}
                                                    <div
                                                        className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-transform",
                                                            isActive
                                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md font-bold scale-105"
                                                                : isDone
                                                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                                    : "bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300"
                                                        )}
                                                    >
                                                        {isDone ? "✓" : phase.number}
                                                    </div>

                                                    {/* Informações da Etapa */}
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className={cn(
                                                                    "text-sm leading-snug truncate",
                                                                    isActive
                                                                        ? "text-zinc-900 dark:text-white font-semibold"
                                                                        : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium"
                                                                )}
                                                            >
                                                                {phase.name}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium ml-2">
                                                                {phase.durationDays}d
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                                            {phase.stepsCountText}
                                                        </span>
                                                    </div>
                                                </button>
                                            )
                                        })}

                                        {/* Botão / Input Inline para "Add Etapa" */}
                                        {isAddingPhase ? (
                                            <form
                                                onSubmit={handleCreatePhase}
                                                className="flex items-center gap-1.5 p-1 mt-1 bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-white/[0.12] rounded-xl"
                                            >
                                                <input
                                                    type="text"
                                                    value={newPhaseName}
                                                    onChange={(e) => setNewPhaseName(e.target.value)}
                                                    placeholder="Nome da etapa..."
                                                    autoFocus
                                                    className="flex-1 bg-transparent px-2.5 py-1 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape") {
                                                            setIsAddingPhase(false)
                                                            setNewPhaseName("")
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="submit"
                                                    className="px-2.5 py-1 text-[11px] bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                                                >
                                                    Adicionar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingPhase(false)
                                                        setNewPhaseName("")
                                                    }}
                                                    className="px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingPhase(true)}
                                                className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 px-3 py-2 mt-1 transition-colors group text-left"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300" />
                                                <span>Add Etapa</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Sub-coluna da Direita: Lista de Tarefas da Etapa Ativa */}
                                <div className="col-span-12 md:col-span-7 border-l border-zinc-200/80 dark:border-white/[0.05] pl-6 flex flex-col justify-between">
                                    <div className="flex flex-col">
                                        {activePhase.steps.map((step) => {
                                            const isDone = step.completed || step.status === "Done"

                                            return (
                                                <div
                                                    key={step.id}
                                                    onClick={() => handleToggleStep(step.id)}
                                                    className="flex items-center justify-between py-3 border-b border-zinc-200/60 dark:border-white/[0.04] group cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 pr-3">
                                                        {isDone ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-white shrink-0 fill-emerald-600 dark:fill-white" />
                                                        ) : (
                                                            <Circle className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0 stroke-[1.5]" />
                                                        )}
                                                        <span
                                                            className={cn(
                                                                "text-sm font-normal truncate transition-colors",
                                                                isDone
                                                                    ? "text-zinc-400 dark:text-zinc-500 line-through"
                                                                    : "text-zinc-800 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white"
                                                            )}
                                                        >
                                                            {step.title}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        <span className="text-[10px] text-zinc-500 font-mono">
                                                            {step.durationDays}d
                                                        </span>
                                                        {isDone ? (
                                                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                                                                Concluído
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded">
                                                                Rascunho
                                                            </span>
                                                        )}
                                                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {/* Botão / Input Inline para "Add Tarefa" */}
                                        {isAddingStep ? (
                                            <form
                                                onSubmit={handleCreateStep}
                                                className="flex items-center gap-1.5 p-1 mt-2 bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-white/[0.12] rounded-xl"
                                            >
                                                <input
                                                    type="text"
                                                    value={newStepName}
                                                    onChange={(e) => setNewStepName(e.target.value)}
                                                    placeholder="Nome da tarefa..."
                                                    autoFocus
                                                    className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape") {
                                                            setIsAddingStep(false)
                                                            setNewStepName("")
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="submit"
                                                    className="px-2.5 py-1 text-[11px] bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                                                >
                                                    Adicionar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingStep(false)
                                                        setNewStepName("")
                                                    }}
                                                    className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingStep(true)}
                                                className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 py-3 px-2 mt-1 transition-colors text-left"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600" />
                                                <span>Add Tarefa</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Visualização "Plano" -> Gráfico Gantt Real com Fundo Sólido #060606, Linhas Cinza e Estilo Exato da Imagem de Referência */
                            <div className="flex flex-col mt-4 select-none">
                                {/* Container com Rolagem Horizontal Infinita e Handler com Altura h-7px (Req 2 & 3) */}
                                <div
                                    ref={ganttScrollRef}
                                    onScroll={handleGanttScroll}
                                    className="w-full overflow-x-auto gantt-scroll-container rounded-xl border border-[#1f1f1f] bg-[#060606] relative"
                                >
                                    <div
                                        className="flex flex-col min-w-max"
                                        style={{ width: `calc(210px + ${totalGridWidth}px)` }}
                                    >
                                        {/* Linha 1 do Cabeçalho: Meses / Trimestres / Anos */}
                                        <div className="flex h-[32px] border-b border-[#1c1c1c]">
                                            {/* Célula Sticky Esquerda: Toolbar com Dropdown Funcional e Fundo Sólido #060606 (Req 1) */}
                                            <div className="w-[210px] shrink-0 sticky left-0 z-40 bg-[#060606] border-r border-[#1f1f1f] flex items-center justify-between px-3">
                                                <div ref={zoomDropdownRef} className="relative flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={handleZoomOut}
                                                        title="Afastar escala de tempo"
                                                        className="hover:text-white transition-colors p-1 text-sm font-semibold select-none leading-none"
                                                    >
                                                        —
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setIsZoomDropdownOpen(prev => !prev)}
                                                        className="flex items-center gap-1 hover:text-white transition-colors px-1 py-0.5 rounded"
                                                    >
                                                        <span>{zoomMode}</span>
                                                        <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform", isZoomDropdownOpen && "rotate-180")} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={handleZoomIn}
                                                        title="Aproximar escala de tempo"
                                                        className="hover:text-white transition-colors p-1 text-sm font-semibold select-none leading-none"
                                                    >
                                                        +
                                                    </button>

                                                    {/* Dropdown Menu Flutuante - Idêntico à Imagem 4 de Referência */}
                                                    {isZoomDropdownOpen && (
                                                        <div className="absolute top-full left-0 mt-2 z-50 min-w-[155px] bg-[#141416] border border-white/[0.12] rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                                                            {(["Days", "Weeks", "Months", "Quarters", "Year"] as ZoomMode[]).map((mode) => {
                                                                const isSelected = zoomMode === mode
                                                                return (
                                                                    <button
                                                                        key={mode}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setZoomMode(mode)
                                                                            setIsZoomDropdownOpen(false)
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-between px-3.5 py-2 text-sm rounded-xl transition-colors text-left",
                                                                            isSelected
                                                                                ? "text-white font-medium bg-white/[0.08]"
                                                                                : "text-zinc-300 hover:text-white hover:bg-white/[0.04]"
                                                                        )}
                                                                    >
                                                                        <span>{mode}</span>
                                                                        {isSelected && (
                                                                            <span className="w-2 h-2 rounded-full bg-white ml-3 shadow-sm" />
                                                                        )}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (ganttScrollRef.current) {
                                                            const targetScroll = todayPixelX - 240
                                                            ganttScrollRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" })
                                                            toast.info("Posicionado em Hoje: 17 de Setembro de 2026")
                                                        }
                                                    }}
                                                    className="text-xs font-normal text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto"
                                                >
                                                    Today
                                                </button>
                                            </div>

                                            {/* Cabeçalhos Superiores (Meses, Trimestres ou Anos) */}
                                            <div className="flex shrink-0">
                                                {topHeaders.map((m) => (
                                                    <div
                                                        key={m.key}
                                                        style={{ width: `${m.width}px` }}
                                                        className="shrink-0 h-full border-r border-[#1c1c1c] flex items-center px-3 text-xs font-bold text-white bg-[#060606]"
                                                    >
                                                        <span className="sticky left-[222px] truncate select-none">
                                                            {m.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Linha 2 do Cabeçalho: Sub-colunas (Dias, Semanas ou Meses) */}
                                        <div className="flex h-[28px] border-b border-[#1c1c1c]">
                                            {/* Célula Sticky Esquerda: Spacer Sólido #060606 (Req 1) */}
                                            <div className="w-[210px] shrink-0 sticky left-0 z-40 bg-[#060606] border-r border-[#1f1f1f]" />

                                            {/* Sub-colunas da Grid */}
                                            <div className="flex shrink-0 relative">
                                                {subColumns.map((col) => (
                                                    <div
                                                        key={col.key}
                                                        style={{ width: `${col.width}px` }}
                                                        className="shrink-0 h-full border-r border-[#1c1c1c] flex items-center justify-center text-[11px] font-normal bg-[#060606]"
                                                    >
                                                        {col.pillToday ? (
                                                            <span className="px-2.5 py-0.5 rounded-full bg-white text-zinc-950 font-bold text-[11px] shadow-sm tracking-tight flex items-center justify-center">
                                                                {col.label}
                                                            </span>
                                                        ) : col.circleToday ? (
                                                            <span className="w-5 h-5 rounded-full bg-white text-zinc-950 font-bold text-[10px] flex items-center justify-center shadow-sm">
                                                                {col.label}
                                                            </span>
                                                        ) : col.isCurrentMonth ? (
                                                            <span className="text-white font-medium tracking-tight">
                                                                {col.label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[#82a4d4] font-normal tracking-tight">
                                                                {col.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Indicador / Notchtick vertical de Hoje na base do cabeçalho */}
                                                <div
                                                    className="absolute bottom-0 h-2 w-px bg-white z-30 pointer-events-none"
                                                    style={{ left: `${todayPixelX}px` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Linha Master da Categoria / Projeto */}
                                        <div className="flex h-[34px] relative border-b border-[#181818] group">
                                            {/* Barra lateral esquerda com fundo sólido #060606 (Req 1) */}
                                            <div className="w-[210px] shrink-0 sticky left-0 z-30 bg-[#060606] border-r border-[#1f1f1f] flex items-center justify-between px-3 text-xs">
                                                <span className="text-zinc-200 font-semibold truncate flex items-center gap-1.5">
                                                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span>{project.category || "Brand identity"}</span>
                                                </span>
                                                <span className="text-[11px] text-zinc-500 font-mono">
                                                    0/{phases.length}
                                                </span>
                                            </div>

                                            {/* Células da Grid Master */}
                                            <div className="flex relative shrink-0">
                                                {subColumns.map((col) => (
                                                    <div
                                                        key={col.key}
                                                        style={{ width: `${col.width}px` }}
                                                        className="shrink-0 h-full border-r border-[#1c1c1c] bg-[#060606]"
                                                    />
                                                ))}

                                                {/* Linha vertical indicadora de "Hoje" (17 de Setembro) */}
                                                <div
                                                    className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none z-20"
                                                    style={{ left: `${todayPixelX}px` }}
                                                />

                                                {/* Barra Master do Projeto - Altura h-[26px] */}
                                                <div
                                                    className="absolute top-1 h-[26px] rounded-md bg-[#301215] border border-[#521c21] text-[#fca5a5] px-2.5 flex items-center text-[11px] font-medium shadow-sm truncate pointer-events-none select-none z-10"
                                                    style={{
                                                        left: `${getPixelX(phases[0]?.startDay ?? 0)}px`,
                                                        width: `${getPixelWidth(phases[0]?.startDay ?? 0, phases.reduce((sum, p) => sum + p.durationDays, 0))}px`
                                                    }}
                                                >
                                                    <span className="truncate">{project.category || "Brand identity"} · {phases[0]?.name || "Discovery"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Linhas de Etapas e Tarefas */}
                                        {phases.map((phase, pIdx) => {
                                            const isExpanded = !!expandedStageIds[phase.id]
                                             const isActive = pIdx === activePhaseIndex

                                            return (
                                                <React.Fragment key={phase.id}>
                                                    {/* Linha da Etapa Principal */}
                                                    <div className="flex h-[34px] relative border-b border-[#181818] group">
                                                        {/* Barra lateral esquerda com fundo sólido #060606 (Req 1) */}
                                                        <div className="w-[210px] shrink-0 sticky left-0 z-30 bg-[#060606] border-r border-[#1f1f1f] flex items-center justify-between px-3 text-xs">
                                                            <div
                                                                onClick={() => setActivePhaseIndex(pIdx)}
                                                                className="flex items-center gap-2 truncate cursor-pointer flex-1"
                                                            >
                                                                {phase.steps.length > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            toggleStageExpand(phase.id)
                                                                        }}
                                                                        className="p-0.5 text-zinc-500 hover:text-white transition-colors"
                                                                        title={isExpanded ? "Colapsar tarefas" : "Expandir tarefas"}
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ChevronDown className="w-2.5 h-2.5" />
                                                                        ) : (
                                                                            <ChevronRight className="w-2.5 h-2.5" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                                {isActive ? (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                                                ) : (
                                                                    <span className="w-1.5 h-1.5 rounded-full border border-zinc-500 shrink-0" />
                                                                )}
                                                                <span className={cn(
                                                                    "truncate font-medium",
                                                                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                                                )}>
                                                                    {phase.name}
                                                                </span>
                                                            </div>

                                                            <button
                                                                onClick={() => setEditModalItem({
                                                                    target: "stage",
                                                                    stageId: phase.id,
                                                                    name: phase.name,
                                                                    startDay: phase.startDay,
                                                                    durationDays: phase.durationDays
                                                                })}
                                                                title="Editar prazo da etapa"
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity shrink-0"
                                                            >
                                                                <Pencil className="w-2.5 h-2.5" />
                                                            </button>
                                                        </div>

                                                        {/* Células da Grid para esta Linha */}
                                                        <div className="flex relative shrink-0">
                                                            {subColumns.map((col) => (
                                                                <div
                                                                    key={col.key}
                                                                    style={{ width: `${col.width}px` }}
                                                                    className="shrink-0 h-full border-r border-[#1c1c1c] bg-[#060606]"
                                                                />
                                                            ))}

                                                            {/* Linha vertical indicadora de "Hoje" (17 de Setembro) */}
                                                            <div
                                                                className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none z-20"
                                                                style={{ left: `${todayPixelX}px` }}
                                                            />

                                                            {/* Badge da Etapa - Altura h-[26px] (Req 2) */}
                                                            <div
                                                                onPointerDown={(e) => handleStartDrag(e, "move", "stage", phase.id)}
                                                                onDoubleClick={() => setEditModalItem({
                                                                    target: "stage",
                                                                    stageId: phase.id,
                                                                    name: phase.name,
                                                                    startDay: phase.startDay,
                                                                    durationDays: phase.durationDays
                                                                })}
                                                                className={cn(
                                                                    "absolute top-1 h-[26px] rounded-md px-2.5 flex items-center justify-between text-[11px] font-medium shadow-sm transition-shadow group/badge cursor-grab active:cursor-grabbing select-none z-10",
                                                                    isActive || pIdx === 0
                                                                        ? "bg-[#301215] border border-[#521c21] text-[#fca5a5] hover:border-[#6a242a]"
                                                                        : "bg-[#241215] border border-[#44181d] text-[#f87171] hover:border-[#521c21]"
                                                                )}
                                                                style={{
                                                                    left: `${getPixelX(phase.startDay)}px`,
                                                                    width: `${getPixelWidth(phase.startDay, phase.durationDays)}px`
                                                                }}
                                                            >
                                                                <span className="truncate mr-1.5 flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                                                                    <span>{phase.name}</span>
                                                                </span>
                                                                <span className="text-[10px] text-white/50 font-mono shrink-0">
                                                                    {phase.durationDays}d
                                                                </span>

                                                                <div
                                                                    onPointerDown={(e) => handleStartDrag(e, "resize", "stage", phase.id)}
                                                                    title="Arraste para alterar a duração"
                                                                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/20 rounded-r-md transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Linhas das Tarefas Internas (Quando Etapa está Expandida) */}
                                                    {isExpanded && phase.steps.map((task) => {
                                                        const isDone = task.completed || task.status === "Done"

                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className="flex h-[32px] relative border-b border-[#181818] group bg-white/[0.01]"
                                                            >
                                                                {/* Barra lateral esquerda com fundo sólido #060606 (Req 1) */}
                                                                <div className="w-[210px] shrink-0 sticky left-0 z-30 bg-[#060606] border-r border-[#1f1f1f] flex items-center justify-between pl-6 pr-3 text-xs text-zinc-400">
                                                                    <div className="flex items-center gap-2 truncate">
                                                                        {isDone ? (
                                                                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 fill-emerald-400/20" />
                                                                        ) : (
                                                                            <Circle className="w-3 h-3 text-zinc-600 shrink-0" />
                                                                        )}
                                                                        <span className="truncate text-zinc-300 text-[11px]">{task.title}</span>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => setEditModalItem({
                                                                            target: "task",
                                                                            stageId: phase.id,
                                                                            taskId: task.id,
                                                                            name: task.title,
                                                                            startDay: task.startDay,
                                                                            durationDays: task.durationDays
                                                                        })}
                                                                        title="Editar prazo da tarefa"
                                                                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity shrink-0"
                                                                    >
                                                                        <Pencil className="w-2.5 h-2.5" />
                                                                    </button>
                                                                </div>

                                                                {/* Grid para Tarefa */}
                                                                <div className="flex relative shrink-0">
                                                                    {subColumns.map((col) => (
                                                                        <div
                                                                            key={col.key}
                                                                            style={{ width: `${col.width}px` }}
                                                                            className="shrink-0 h-full border-r border-[#1c1c1c] bg-[#060606]"
                                                                        />
                                                                    ))}

                                                                    {/* Linha vertical indicadora de Hoje */}
                                                                    <div
                                                                        className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none z-20"
                                                                        style={{ left: `${todayPixelX}px` }}
                                                                    />

                                                                    {/* Badge da Tarefa - Altura h-[26px] */}
                                                                    <div
                                                                        onPointerDown={(e) => handleStartDrag(e, "move", "task", phase.id, task.id)}
                                                                        onDoubleClick={() => setEditModalItem({
                                                                            target: "task",
                                                                            stageId: phase.id,
                                                                            taskId: task.id,
                                                                            name: task.title,
                                                                            startDay: task.startDay,
                                                                            durationDays: task.durationDays
                                                                        })}
                                                                        className={cn(
                                                                            "absolute top-0.5 h-[26px] rounded-md px-2 flex items-center justify-between text-[11px] shadow-sm cursor-grab active:cursor-grabbing select-none border transition-all z-10",
                                                                            isDone
                                                                                ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-200"
                                                                                : "bg-[#18181c] border-white/[0.08] text-zinc-300 hover:border-white/20 hover:text-white"
                                                                        )}
                                                                        style={{
                                                                            left: `${getPixelX(task.startDay)}px`,
                                                                            width: `${getPixelWidth(task.startDay, task.durationDays)}px`
                                                                        }}
                                                                    >
                                                                        <span className="truncate mr-1">{task.title}</span>
                                                                        <span className="text-[10px] text-white/40 font-mono shrink-0">
                                                                            {task.durationDays}d
                                                                        </span>

                                                                        <div
                                                                            onPointerDown={(e) => handleStartDrag(e, "resize", "task", phase.id, task.id)}
                                                                            title="Arraste para alterar o comprimento"
                                                                            className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/20 rounded-r-md transition-colors"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            )
                                        })}

                                        {/* Linhas Vazias de Preenchimento da Grid (3 Linhas de Estilo) */}
                                        {[1, 2, 3].map((rowIdx) => (
                                            <div key={`empty-row-${rowIdx}`} className="flex h-[34px] relative border-b border-[#181818]">
                                                {/* Célula Sticky Esquerda Vazia com Fundo Sólido #060606 */}
                                                <div className="w-[210px] shrink-0 sticky left-0 z-30 bg-[#060606] border-r border-[#1f1f1f]" />

                                                {/* Células da Grid Vazias */}
                                                <div className="flex relative shrink-0">
                                                    {subColumns.map((col) => (
                                                        <div
                                                            key={col.key}
                                                            style={{ width: `${col.width}px` }}
                                                            className="shrink-0 h-full border-r border-[#1c1c1c] bg-[#060606]"
                                                        />
                                                    ))}

                                                    {/* Linha vertical indicadora de "Hoje" */}
                                                    <div
                                                        className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none z-20"
                                                        style={{ left: `${todayPixelX}px` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botão Inferior de Ação: Concluir [Etapa] */}
                    <div className="flex justify-end mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/[0.04]">
                        <button
                            onClick={handleFinishPhase}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                            <span>Concluir {activePhase.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Sidebar Lateral Direita: Informações do Projeto - Largura fixa 286px */}
                <div className="w-full lg:w-[286px] shrink-0 flex flex-col gap-6 pl-1">
                    {/* Seção: Projeto */}
                    <div className="flex flex-col">
                        <span className="text-xs text-text-secondary dark:text-zinc-500 font-medium tracking-wide">
                            Projeto
                        </span>
                        <h2 className="text-sm font-semibold text-text-primary dark:text-zinc-100 mt-1">
                            {project.category || project.name}
                        </h2>
                        <p className="text-xs text-text-secondary dark:text-zinc-400 mt-0.5 leading-relaxed">
                            {project.description || "Adicione uma descrição ao projeto"}
                        </p>
                    </div>

                    {/* Seção: Progresso */}
                    <div className="flex flex-col gap-3 pt-2">
                        <span className="text-xs text-text-secondary dark:text-zinc-500 font-medium tracking-wide">
                            Progresso
                        </span>

                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary dark:text-zinc-500">Status</span>
                                <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>{project.status_label || "Em andamento"}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary dark:text-zinc-500">Fase</span>
                                <span className="text-text-primary dark:text-zinc-300 font-medium">
                                    {activePhase.name} · {activePhaseIndex + 1} de {phases.length}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary dark:text-zinc-500">Processo</span>
                                <span className="text-text-primary dark:text-zinc-300 font-medium">
                                    {project.category || "branding"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Seção: Datas-chave */}
                    <div className="flex flex-col gap-3 pt-2">
                        <span className="text-xs text-text-secondary dark:text-zinc-500 font-medium tracking-wide">
                            Datas-chave
                        </span>

                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary dark:text-zinc-500">Início</span>
                                <span className="text-text-primary dark:text-zinc-300 font-medium">
                                    {getFormattedDateFromOffset(phases[0]?.startDay ?? 0)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary dark:text-zinc-500">Prazo</span>
                                <span className="text-text-primary dark:text-zinc-300 font-medium">
                                    {getFormattedDateFromOffset((phases[0]?.startDay ?? 0) + phases.reduce((sum, p) => sum + p.durationDays, 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Seção: Equipa */}
                    <div className="flex flex-col gap-3 pt-2">
                        <span className="text-xs text-text-secondary dark:text-zinc-500 font-medium tracking-wide">
                            Equipa
                        </span>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-text-secondary dark:text-zinc-500">2 pessoas</span>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2 overflow-hidden">
                                    <div className="inline-block h-5 w-5 rounded-full ring-2 ring-background bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                                        J
                                    </div>
                                    <div className="inline-block h-5 w-5 rounded-full ring-2 ring-background bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
                                        L
                                    </div>
                                </div>
                                <span className="text-text-primary dark:text-zinc-300 font-medium">
                                    {project.creator?.name ? `Jaime, ${project.creator.name.split(' ')[0]}` : "Jaime, Luciano"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container Inferior: Cronograma (Timeline) - Sempre visível */}
            <div className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-5 shadow-2xl text-zinc-100">
                    {/* Cabeçalho do Cronograma */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                        <span className="text-xs font-medium text-zinc-400 tracking-wide">
                            Cronograma
                        </span>

                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <button
                                onClick={() => setWeekOffset(prev => prev - 1)}
                                className="p-1 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-medium text-zinc-200">14 a 20 Set</span>
                            <button
                                onClick={() => setWeekOffset(prev => prev + 1)}
                                className="p-1 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Botão de Expandir -> Abre o Modal */}
                            <button
                                onClick={() => setIsTimelineModalOpen(true)}
                                title="Expandir Cronograma Completo"
                                className="p-1 hover:text-white transition-colors ml-1"
                            >
                                <Maximize2 className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-200" />
                            </button>
                        </div>
                    </div>

                    {/* Grade dos Dias da Semana */}
                    <div className="grid grid-cols-7 pt-4 border-b border-white/[0.03]">
                        {timelineDays.map((d, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 font-normal pb-3 px-3 border-r border-white/[0.04] last:border-r-0"
                            >
                                <span>{d.label}</span>
                                {d.isToday ? (
                                    <span className="bg-zinc-800 text-white font-medium text-[11px] px-1.5 py-0.5 rounded-full">
                                        {d.day}
                                    </span>
                                ) : (
                                    <span>{d.day}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Linha do Gantt */}
                    <div className="grid grid-cols-7 h-16 pt-3 relative">
                        {timelineDays.map((_, i) => (
                            <div key={i} className="border-r border-white/[0.03] last:border-r-0 h-full" />
                        ))}

                        {/* Barra em Pílula da Etapa Ativa */}
                        <div
                            onClick={() => setIsTimelineModalOpen(true)}
                            className="absolute top-3 left-[28.5%] w-[42.8%] h-8 bg-[#18181c] border border-white/[0.1] rounded-lg px-3 flex items-center text-xs font-medium text-zinc-200 shadow-md cursor-pointer hover:border-white/20 transition-all group"
                        >
                            <span className="truncate">{activePhase.name}</span>
                        </div>
                    </div>
                </div>

            {/* MODAL PARA EDITAR PRAZO / DURAÇÃO */}
            {editModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
                    <div
                        className="w-full max-w-md bg-[#111114] border border-white/[0.12] rounded-2xl p-6 shadow-2xl text-zinc-100 flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-500" />
                                <span>Editar Prazo da {editModalItem.target === "stage" ? "Etapa" : "Tarefa"}</span>
                            </h3>
                            <button
                                onClick={() => setEditModalItem(null)}
                                className="text-zinc-400 hover:text-white p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3.5 text-xs">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-zinc-400 font-medium">Nome</label>
                                <input
                                    type="text"
                                    value={editModalItem.name}
                                    onChange={(e) => setEditModalItem({ ...editModalItem, name: e.target.value })}
                                    className="bg-[#18181c] border border-white/[0.1] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-zinc-400 font-medium">Duração (dias)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={editModalItem.durationDays}
                                        onChange={(e) => setEditModalItem({
                                            ...editModalItem,
                                            durationDays: Math.max(1, parseInt(e.target.value) || 1)
                                        })}
                                        className="bg-[#18181c] border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white/30"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-zinc-400 font-medium">Deslocamento (dias)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="90"
                                        value={editModalItem.startDay}
                                        onChange={(e) => setEditModalItem({
                                            ...editModalItem,
                                            startDay: Math.max(0, parseInt(e.target.value) || 0)
                                        })}
                                        className="bg-[#18181c] border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white/30"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-zinc-900/60 border border-white/[0.05] rounded-xl flex flex-col gap-1 text-[11px] text-zinc-400">
                                <div>
                                    <span className="text-zinc-500">Início calculado:</span>{" "}
                                    <span className="text-zinc-200 font-medium">{getFormattedDateFromOffset(editModalItem.startDay)}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Término previsto:</span>{" "}
                                    <span className="text-zinc-200 font-medium">{getFormattedDateFromOffset(editModalItem.startDay + editModalItem.durationDays)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                            <button
                                onClick={() => setEditModalItem(null)}
                                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEditModal}
                                className="px-4 py-1.5 text-xs bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 transition-colors shadow-sm"
                            >
                                Salvar Prazo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DA TIMELINE / CRONOGRAMA COMPLETO */}
            {isTimelineModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsTimelineModalOpen(false)}
                >
                    <div
                        className="w-full max-w-5xl bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative text-zinc-100 flex flex-col max-h-[92vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                            <h2 className="text-sm font-semibold text-zinc-100 tracking-wide">
                                Cronograma
                            </h2>
                            <button
                                onClick={() => setIsTimelineModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Barra de Ferramentas / Controles */}
                        <div className="flex items-center justify-between py-4 border-b border-white/[0.04] text-xs">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toast.info("Hoje: 16 de Setembro de 2026")}
                                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
                                >
                                    Hoje
                                </button>
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <button className="p-1 hover:text-white transition-colors">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1 hover:text-white transition-colors">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <span className="font-semibold text-zinc-100 text-sm ml-1">
                                    Setembro 2026
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => toast.info("Filtro: Todas as tarefas")}
                                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
                                >
                                    <Filter className="w-3 h-3 text-zinc-400" />
                                    <span>Todos</span>
                                </button>

                                <div className="bg-[#050507] border border-white/[0.08] p-0.5 rounded-lg flex items-center gap-1">
                                    <button
                                        onClick={() => setTimelineModalView("month")}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                            timelineModalView === "month"
                                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        Mês
                                    </button>
                                    <button
                                        onClick={() => setTimelineModalView("week")}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                            timelineModalView === "week"
                                                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        Semana
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        const title = window.prompt("Título do novo evento no cronograma:")
                                        if (title?.trim()) {
                                            toast.success(`Evento "${title.trim()}" agendado`)
                                        }
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1 transition-colors shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Adicionar</span>
                                </button>
                            </div>
                        </div>

                        {/* Grade do Calendário Mensal */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                            <div className="grid grid-cols-7 border-b border-white/[0.04] text-center pb-2 text-xs text-zinc-400 font-medium">
                                <div>Seg</div>
                                <div>Ter</div>
                                <div>Qua</div>
                                <div>Qui</div>
                                <div>Sex</div>
                                <div>Sáb</div>
                                <div>Dom</div>
                            </div>

                            <div className="grid grid-cols-7 border-l border-t border-white/[0.04]">
                                {[
                                    { day: 31, isPrev: true }, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 },
                                    { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 }, { day: 12 }, { day: 13 },
                                    { day: 14 }, { day: 15 }, { day: 16, isToday: true, bar: "Briefing", barSpan: 5 }, { day: 17 }, { day: 18 }, { day: 19 }, { day: 20 },
                                    { day: 21, bar: "Pesquisa", barSpan: 7 }, { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 }, { day: 26 }, { day: 27 },
                                    { day: 28, bar: "Conceito", barSpan: 7 }, { day: 29 }, { day: 30 }, { day: 1, isNext: true }, { day: 2, isNext: true }, { day: 3, isNext: true }, { day: 4, isNext: true }
                                ].map((cell, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "min-h-[88px] p-2 border-r border-b border-white/[0.04] relative flex flex-col justify-between transition-colors hover:bg-white/[0.02]",
                                            cell.isPrev || cell.isNext ? "bg-black/20 text-zinc-600" : "text-zinc-400"
                                        )}
                                    >
                                        <div className="flex items-center justify-start">
                                            {cell.isToday ? (
                                                <span className="w-5 h-5 rounded-full bg-white text-zinc-950 font-bold text-[10px] flex items-center justify-center shadow-sm">
                                                    {cell.day}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-normal">
                                                    {cell.day}
                                                </span>
                                            )}
                                        </div>

                                        {cell.bar && (
                                            <div
                                                className="mt-1 h-6 rounded bg-[#18181c] border border-white/[0.08] text-[11px] text-zinc-200 px-2 flex items-center shadow-sm truncate z-10"
                                                style={{
                                                    width: cell.barSpan ? `calc(${cell.barSpan * 100}% + ${(cell.barSpan - 1) * 1}px)` : "100%"
                                                }}
                                            >
                                                <span className="truncate">{cell.bar}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
