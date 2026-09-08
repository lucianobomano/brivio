"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Check, Circle, Edit3, Flag, Plus, Route } from "lucide-react"
import { cn } from "@/lib/utils"

export type JourneyLayoutStyle = "winding-road" | "angular-path" | "ribbon-path" | "stair-path"

export interface JourneyTask {
    id: string
    title: string
    completed: boolean
}

export interface JourneyStage {
    id: string
    name: string
    color?: string | null
    progress: number
    tasks: JourneyTask[]
}

interface JourneyRoadmapLayoutsProps {
    variant: JourneyLayoutStyle
    stages: JourneyStage[]
    readOnly?: boolean
    onToggleTask?: (taskId: string, stageId: string) => void
    onAddTask?: (stageId: string) => void
    onEditStage?: (stageId: string) => void
}

interface Point {
    x: number
    y: number
}

const VARIANT_META: Record<JourneyLayoutStyle, {
    eyebrow: string
    title: string
    description: string
    background: string
}> = {
    "winding-road": {
        eyebrow: "O caminho do projeto",
        title: "Da partida à conquista",
        description: "Cada curva representa uma nova fase da jornada.",
        background: "linear-gradient(180deg, #F5F5F2 0%, #FFFFFF 100%)",
    },
    "angular-path": {
        eyebrow: "Todos os caminhos levam ao resultado",
        title: "Percurso em movimento",
        description: "Um trajeto marcante para projetos que avançam por grandes viragens.",
        background: "linear-gradient(145deg, #FFD400 0%, #FF8A00 100%)",
    },
    "ribbon-path": {
        eyebrow: "Uma história contínua",
        title: "Fita de progresso",
        description: "As fases ligam-se num percurso fluido, do início à entrega.",
        background: "linear-gradient(180deg, #FBF8F6 0%, #F1ECEA 100%)",
    },
    "stair-path": {
        eyebrow: "Um passo de cada vez",
        title: "Escadaria de evolução",
        description: "Cada etapa concluída eleva o projeto ao próximo nível.",
        background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)",
    },
}

const STAIR_COLORS = ["#F97316", "#EAB308", "#65A30D", "#06B6D4", "#3730A3", "#BE123C"]

function getPoints(variant: JourneyLayoutStyle, count: number): Point[] {
    const gap = variant === "stair-path" ? 176 : 190
    const patterns: Record<JourneyLayoutStyle, number[]> = {
        "winding-road": [28, 70, 32, 68],
        "angular-path": [18, 76, 34, 82, 24, 68],
        "ribbon-path": [62, 38, 62, 38],
        "stair-path": [18, 42, 68, 82, 58, 32],
    }

    return Array.from({ length: count }, (_, index) => ({
        x: patterns[variant][index % patterns[variant].length],
        y: 100 + index * gap,
    }))
}

function getPath(variant: JourneyLayoutStyle, points: Point[]): string {
    if (points.length === 0) return ""

    let path = `M ${points[0].x} ${points[0].y}`

    points.slice(1).forEach((point, index) => {
        const previous = points[index]
        if (variant === "angular-path") {
            path += ` L ${point.x} ${point.y}`
            return
        }

        if (variant === "stair-path") {
            const landingY = previous.y + (point.y - previous.y) * 0.52
            path += ` L ${previous.x} ${landingY} L ${point.x} ${landingY} L ${point.x} ${point.y}`
            return
        }

        const middleY = previous.y + (point.y - previous.y) / 2
        path += ` C ${previous.x} ${middleY}, ${point.x} ${middleY}, ${point.x} ${point.y}`
    })

    return path
}

function StageSummary({
    stage,
    index,
    readOnly,
    onToggleTask,
    onAddTask,
    onEditStage,
}: {
    stage: JourneyStage
    index: number
    readOnly: boolean
    onToggleTask?: JourneyRoadmapLayoutsProps["onToggleTask"]
    onAddTask?: JourneyRoadmapLayoutsProps["onAddTask"]
    onEditStage?: JourneyRoadmapLayoutsProps["onEditStage"]
}) {
    const completedTasks = stage.tasks.filter(task => task.completed).length

    return (
        <div className="w-full rounded-2xl border border-black/10 bg-white/95 p-4 text-[#171719] shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-sm md:w-[232px]">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#FF0054]">Etapa {String(index + 1).padStart(2, "0")}</p>
                    <h3 className="text-[16px] font-black leading-tight">{stage.name}</h3>
                </div>
                <span className="shrink-0 text-[15px] font-black text-[#FF0054]">{stage.progress}%</span>
            </div>

            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/10">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.08 }}
                    className="h-full rounded-full bg-[#FF0054]"
                />
            </div>

            <div className="space-y-1.5">
                {stage.tasks.slice(0, 3).map(task => (
                    <button
                        key={task.id}
                        type="button"
                        disabled={readOnly || !onToggleTask}
                        onClick={() => onToggleTask?.(task.id, stage.id)}
                        className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-[11px] transition-colors",
                            !readOnly && "hover:bg-black/5",
                            task.completed && "text-black/45 line-through"
                        )}
                    >
                        {task.completed ? (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF0054] text-white"><Check className="h-2.5 w-2.5" strokeWidth={4} /></span>
                        ) : (
                            <Circle className="h-4 w-4 shrink-0 text-black/25" />
                        )}
                        <span className="truncate">{task.title}</span>
                    </button>
                ))}
                {stage.tasks.length === 0 && <p className="py-1 text-[11px] italic text-black/40">Sem tarefas nesta fase</p>}
                {stage.tasks.length > 3 && <p className="pl-6 text-[10px] font-bold text-black/40">+{stage.tasks.length - 3} tarefas</p>}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                <span className="text-[10px] font-bold text-black/45">{completedTasks}/{stage.tasks.length} concluídas</span>
                {!readOnly && (
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={() => onEditStage?.(stage.id)} className="rounded-md p-1.5 text-black/45 hover:bg-black/5 hover:text-black" aria-label={`Editar ${stage.name}`}>
                            <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => onAddTask?.(stage.id)} className="rounded-md p-1.5 text-black/45 hover:bg-black/5 hover:text-[#FF0054]" aria-label={`Adicionar tarefa a ${stage.name}`}>
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function JourneyNode({ variant, stage, index }: { variant: JourneyLayoutStyle; stage: JourneyStage; index: number }) {
    const isComplete = stage.progress === 100
    const content = isComplete ? <Check className="h-7 w-7" strokeWidth={4} /> : <span>{String(index + 1).padStart(2, "0")}</span>

    if (variant === "angular-path") {
        return (
            <div className="relative flex h-[76px] w-[76px] rotate-45 items-center justify-center rounded-[18px] border-[6px] border-[#212124] bg-[#FF0054] text-white shadow-[10px_12px_0_rgba(0,0,0,0.22)]">
                <span className="-rotate-45 text-[21px] font-black">{content}</span>
            </div>
        )
    }

    if (variant === "stair-path") {
        return (
            <div className="flex h-[62px] w-[92px] items-center justify-center rounded-[14px] border-b-[10px] border-black/25 text-[22px] font-black text-white shadow-xl" style={{ backgroundColor: STAIR_COLORS[index % STAIR_COLORS.length] }}>
                {content}
            </div>
        )
    }

    if (variant === "ribbon-path") {
        return (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[7px] border-white bg-[#342B35] text-[20px] font-black text-white shadow-[0_14px_28px_rgba(43,31,43,0.3)]">
                {content}
            </div>
        )
    }

    return (
        <div className="flex h-[78px] w-[78px] items-center justify-center rounded-full border-[7px] border-[#151515] bg-[#FFD21A] text-[22px] font-black text-[#151515] shadow-[0_12px_0_rgba(0,0,0,0.16)]">
            {content}
        </div>
    )
}

export function JourneyRoadmapLayouts({
    variant,
    stages,
    readOnly = false,
    onToggleTask,
    onAddTask,
    onEditStage,
}: JourneyRoadmapLayoutsProps) {
    const meta = VARIANT_META[variant]
    const points = React.useMemo(() => getPoints(variant, stages.length), [variant, stages.length])
    const height = Math.max(430, (points.at(-1)?.y || 100) + 150)
    const path = React.useMemo(() => getPath(variant, points), [variant, points])
    const isRoad = variant === "winding-road"
    const isRibbon = variant === "ribbon-path"
    const isAngular = variant === "angular-path"

    return (
        <section className="mb-24 overflow-hidden rounded-[32px] border border-black/10 shadow-[0_24px_80px_rgba(15,23,42,0.12)]" style={{ background: meta.background }}>
            <div className={cn("relative z-10 px-6 pb-5 pt-8 text-center md:px-10", isAngular ? "text-[#151515]" : "text-[#242426]")}>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-current/15 bg-white/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-sm">
                    <Route className="h-3.5 w-3.5" /> {meta.eyebrow}
                </div>
                <h2 className="text-[28px] font-black tracking-tight md:text-[38px]">{meta.title}</h2>
                <p className="mx-auto mt-2 max-w-xl text-[13px] font-medium opacity-65">{meta.description}</p>
            </div>

            {stages.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 pb-16 text-center text-black/45">
                    <Flag className="mb-4 h-10 w-10" />
                    <p className="text-sm font-bold">O percurso aparecerá assim que existirem fases com tarefas.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4 px-4 pb-10 md:hidden">
                        {stages.map((stage, index) => (
                            <motion.div key={stage.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className="flex gap-3">
                                <div className="pt-2"><JourneyNode variant={variant} stage={stage} index={index} /></div>
                                <div className="min-w-0 flex-1"><StageSummary stage={stage} index={index} readOnly={readOnly} onToggleTask={onToggleTask} onAddTask={onAddTask} onEditStage={onEditStage} /></div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="relative mx-auto hidden w-full max-w-[1050px] md:block" style={{ height }}>
                        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
                            <defs>
                                <linearGradient id={`journey-gradient-${variant}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isRibbon ? "#E7A28F" : "#FF0054"} />
                                    <stop offset="52%" stopColor={isRibbon ? "#443746" : "#8B2EFF"} />
                                    <stop offset="100%" stopColor={isRibbon ? "#E84A32" : "#06D6A0"} />
                                </linearGradient>
                            </defs>

                            {isRoad && <path d={path} fill="none" stroke="#111111" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
                            {isRoad && <path d={path} fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="10 9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                            {!isRoad && (
                                <path
                                    d={path}
                                    fill="none"
                                    stroke={isAngular ? "#171719" : `url(#journey-gradient-${variant})`}
                                    strokeWidth={variant === "stair-path" ? "20" : isRibbon ? "42" : "28"}
                                    strokeLinecap={variant === "stair-path" ? "square" : "round"}
                                    strokeLinejoin="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            )}
                            {isRibbon && <path d={path} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                        </svg>

                        <div className="absolute left-[16%] top-5 rounded-full bg-[#151515] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white">Início</div>
                        <div className="absolute bottom-6 right-[8%] flex items-center gap-2 rounded-full bg-[#FF0054] px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-lg"><Flag className="h-3 w-3" /> Objetivo</div>

                        {stages.map((stage, index) => {
                            const point = points[index]
                            const summaryOnLeft = point.x >= 50
                            return (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1, type: "spring", stiffness: 150 }}
                                    className="absolute z-10"
                                    style={{ left: `${point.x}%`, top: point.y }}
                                >
                                    <div className={cn("absolute", variant === "stair-path" ? "-left-[46px] -top-[31px]" : "-left-[39px] -top-[39px]")}>
                                        <JourneyNode variant={variant} stage={stage} index={index} />
                                    </div>
                                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: summaryOnLeft ? "-310px" : "82px" }}>
                                        <StageSummary stage={stage} index={index} readOnly={readOnly} onToggleTask={onToggleTask} onAddTask={onAddTask} onEditStage={onEditStage} />
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </>
            )}
        </section>
    )
}
