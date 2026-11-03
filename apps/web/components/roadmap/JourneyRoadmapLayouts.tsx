"use client"

/**
 * Four roadmap views in the platform's style (zinc palette, #0c0c0e / white panels, pink only as the accent,
 * small type), for the studio's roadmap page and the client view. Every view lays phases out in a grid or a
 * normal flow, so nothing overlaps whatever the number of phases.
 *  - winding-road → Percurso: horizontal steps, one card per phase
 *  - angular-path → Marcos: vertical timeline, phases alternating left / right
 *  - ribbon-path  → Faixas: one lane per phase with its progress and tasks (a project plan)
 *  - stair-path   → Cascata: staggered bars, each phase starting where the previous ends
 * (The ids are kept so saved roadmaps and shared links keep working.)
 */

import * as React from "react"
import { motion } from "framer-motion"
import { Check, Edit3, Plus } from "lucide-react"
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

type Handlers = Pick<JourneyRoadmapLayoutsProps, "onToggleTask" | "onAddTask" | "onEditStage"> & { readOnly: boolean }
type Status = "done" | "current" | "todo"

const PANEL = "bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl"
const PINK = "#ff0054"

const statusOf = (stages: JourneyStage[], index: number): Status => {
    if (stages[index].progress === 100) return "done"
    const firstOpen = stages.findIndex(s => s.progress < 100)
    return index === firstOpen ? "current" : "todo"
}
const STATUS_LABEL: Record<Status, string> = { done: "Concluída", current: "Em curso", todo: "Por iniciar" }
const pad = (n: number) => String(n).padStart(2, "0")

// ---------------------------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------------------------

function Node({ status, index, size = 28 }: { status: Status, index: number, size?: number }) {
    return (
        <span
            className={cn(
                "relative z-10 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold tabular-nums transition-colors",
                status === "done" && "bg-[#ff0054] text-white",
                status === "current" && "bg-white dark:bg-[#0c0c0e] text-[#ff0054] ring-2 ring-[#ff0054]",
                status === "todo" && "bg-zinc-100 dark:bg-[#141416] text-zinc-500 ring-1 ring-zinc-200 dark:ring-white/[0.08]"
            )}
            style={{ width: size, height: size }}
        >
            {status === "done" ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : pad(index + 1)}
            {status === "current" && <span className="absolute -inset-1 rounded-full ring-2 ring-[#ff0054]/25 animate-pulse" />}
        </span>
    )
}

function StatusPill({ status }: { status: Status }) {
    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium whitespace-nowrap",
            status === "done" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            status === "current" && "bg-[#ff0054]/10 text-[#ff0054] border-[#ff0054]/20",
            status === "todo" && "bg-zinc-100 text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]"
        )}>
            {STATUS_LABEL[status]}
        </span>
    )
}

function ProgressBar({ value, delay = 0 }: { value: number, delay?: number }) {
    return (
        <div className="h-1 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ background: PINK }} />
        </div>
    )
}

function TaskList({ stage, max = 4, readOnly, onToggleTask }: { stage: JourneyStage, max?: number } & Pick<Handlers, "readOnly" | "onToggleTask">) {
    return (
        <div className="space-y-0.5">
            {stage.tasks.slice(0, max).map(task => (
                <button
                    key={task.id}
                    type="button"
                    disabled={readOnly || !onToggleTask}
                    onClick={() => onToggleTask?.(task.id, stage.id)}
                    className={cn("w-full flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors", !readOnly && onToggleTask && "hover:bg-zinc-50 dark:hover:bg-white/[0.03]")}
                >
                    <span className={cn(
                        "w-3.5 h-3.5 rounded-[4px] shrink-0 flex items-center justify-center border",
                        task.completed ? "bg-[#ff0054] border-[#ff0054] text-white" : "border-zinc-300 dark:border-white/20"
                    )}>
                        {task.completed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span className={cn("truncate", task.completed ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300")}>{task.title}</span>
                </button>
            ))}
            {stage.tasks.length > max && <p className="pl-7 pt-0.5 text-[11px] text-zinc-400">+{stage.tasks.length - max} tarefas</p>}
            {stage.tasks.length === 0 && <p className="px-1.5 py-1 text-[11px] text-zinc-400">Sem tarefas</p>}
        </div>
    )
}

function StageActions({ stage, readOnly, onAddTask, onEditStage }: { stage: JourneyStage } & Pick<Handlers, "readOnly" | "onAddTask" | "onEditStage">) {
    if (readOnly) return null
    return (
        <div className="flex items-center gap-0.5">
            {onEditStage && (
                <button type="button" onClick={() => onEditStage(stage.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors" aria-label={`Editar ${stage.name}`} title="Editar fase">
                    <Edit3 className="w-3.5 h-3.5" />
                </button>
            )}
            {onAddTask && (
                <button type="button" onClick={() => onAddTask(stage.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-[#ff0054] hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors" aria-label={`Adicionar tarefa a ${stage.name}`} title="Adicionar tarefa">
                    <Plus className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}

/** The phase card shared by Percurso and Marcos */
function StageCard({ stage, index, status, h, className }: { stage: JourneyStage, index: number, status: Status, h: Handlers, className?: string }) {
    const done = stage.tasks.filter(t => t.completed).length
    return (
        <div className={cn(PANEL, "p-4 flex flex-col", status === "current" && "border-[#ff0054]/40 dark:border-[#ff0054]/40", className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Fase {pad(index + 1)}</p>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug mt-0.5">{stage.name}</h3>
                </div>
                <StatusPill status={status} />
            </div>
            <div className="mt-3 flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={stage.progress} delay={index * 0.05} /></div>
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums w-8 text-right">{stage.progress}%</span>
            </div>
            <div className="mt-3 -mx-1.5"><TaskList stage={stage} readOnly={h.readOnly} onToggleTask={h.onToggleTask} /></div>
            <div className="mt-auto pt-3 border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 tabular-nums">{done}/{stage.tasks.length} tarefas</span>
                <StageActions stage={stage} readOnly={h.readOnly} onAddTask={h.onAddTask} onEditStage={h.onEditStage} />
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------------------------

/** Percurso: a horizontal track of steps, a card under each one */
function Percurso({ stages, h }: { stages: JourneyStage[], h: Handlers }) {
    return (
        <div className="overflow-x-auto roadmap-scroll">
            <div className="grid gap-4 min-w-max md:min-w-0" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(240px, 1fr))` }}>
                {stages.map((s, i) => {
                    const status = statusOf(stages, i)
                    const last = i === stages.length - 1
                    return (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col gap-4">
                            {/* Step on the track, with the segment to the next phase */}
                            <div className="relative h-7 flex items-center">
                                {!last && (
                                    <>
                                        <span className="absolute left-7 -right-4 h-px bg-zinc-200 dark:bg-white/[0.08]" />
                                        {status === "done" && (
                                            <motion.span className="absolute left-7 -right-4 h-px origin-left" style={{ background: PINK }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: i * 0.08 }} />
                                        )}
                                    </>
                                )}
                                <Node status={status} index={i} />
                            </div>
                            <StageCard stage={s} index={i} status={status} h={h} className="flex-1" />
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

/** Marcos: a vertical line in the middle, phases alternating sides (one column on small screens) */
function Marcos({ stages, h }: { stages: JourneyStage[], h: Handlers }) {
    return (
        <div className="relative">
            <div className="absolute top-0 bottom-0 left-[13px] md:left-1/2 w-px bg-zinc-200 dark:bg-white/[0.08]" />
            <div className="space-y-6">
                {stages.map((s, i) => {
                    const status = statusOf(stages, i)
                    const right = i % 2 === 1
                    return (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative grid grid-cols-[28px_1fr] md:grid-cols-[1fr_28px_1fr] gap-4 items-start">
                            <div className={cn("hidden md:block", right && "md:invisible")}>
                                {!right && <StageCard stage={s} index={i} status={status} h={h} />}
                            </div>
                            <div className="pt-4 flex justify-center"><Node status={status} index={i} /></div>
                            <div className={cn(!right && "md:invisible")}>
                                <div className="md:hidden"><StageCard stage={s} index={i} status={status} h={h} /></div>
                                {right && <div className="hidden md:block"><StageCard stage={s} index={i} status={status} h={h} /></div>}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

/** Faixas: one lane per phase, like a project plan */
function Faixas({ stages, h }: { stages: JourneyStage[], h: Handlers }) {
    return (
        <div className={cn(PANEL, "overflow-hidden")}>
            <div className="hidden md:grid grid-cols-[minmax(200px,1.1fr)_minmax(160px,0.9fr)_2fr_auto] gap-4 px-5 py-3 border-b border-zinc-200/80 dark:border-white/[0.06] text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <span>Fase</span><span>Progresso</span><span>Tarefas</span><span className="w-[60px]" />
            </div>
            {stages.map((s, i) => {
                const status = statusOf(stages, i)
                const done = s.tasks.filter(t => t.completed).length
                return (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className={cn("grid grid-cols-1 md:grid-cols-[minmax(200px,1.1fr)_minmax(160px,0.9fr)_2fr_auto] gap-3 md:gap-4 px-5 py-4 border-b border-zinc-200/60 dark:border-white/[0.04] last:border-0 items-start", status === "current" && "bg-[#ff0054]/[0.03]")}>
                        <div className="flex items-center gap-3 min-w-0">
                            <Node status={status} index={i} size={26} />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{s.name}</p>
                                <div className="mt-1"><StatusPill status={status} /></div>
                            </div>
                        </div>
                        <div className="md:pt-1.5">
                            <div className="flex items-center gap-2">
                                <div className="flex-1"><ProgressBar value={s.progress} delay={i * 0.04} /></div>
                                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums w-8 text-right">{s.progress}%</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">{done}/{s.tasks.length} tarefas</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {s.tasks.slice(0, 6).map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    disabled={h.readOnly || !h.onToggleTask}
                                    onClick={() => h.onToggleTask?.(t.id, s.id)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 max-w-[220px] h-7 px-2.5 rounded-md border text-[11px] transition-colors",
                                        t.completed ? "border-zinc-200 dark:border-white/[0.06] text-zinc-400 line-through" : "border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300",
                                        !h.readOnly && h.onToggleTask && "hover:border-zinc-300 dark:hover:border-white/20"
                                    )}
                                >
                                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.completed ? "bg-[#ff0054]" : "bg-zinc-300 dark:bg-white/25")} />
                                    <span className="truncate">{t.title}</span>
                                </button>
                            ))}
                            {s.tasks.length > 6 && <span className="h-7 px-2 inline-flex items-center text-[11px] text-zinc-400">+{s.tasks.length - 6}</span>}
                            {s.tasks.length === 0 && <span className="text-[11px] text-zinc-400 pt-1.5">Sem tarefas</span>}
                        </div>
                        <div className="md:w-[60px] flex md:justify-end"><StageActions stage={s} readOnly={h.readOnly} onAddTask={h.onAddTask} onEditStage={h.onEditStage} /></div>
                    </motion.div>
                )
            })}
        </div>
    )
}

/** Cascata: staggered bars, each phase starting where the previous one ends (length ~ number of tasks) */
function Cascata({ stages, h }: { stages: JourneyStage[], h: Handlers }) {
    const weights = stages.map(s => Math.max(1, s.tasks.length))
    const total = weights.reduce((a, b) => a + b, 0)
    const spans = weights.map((w, i) => ({ start: weights.slice(0, i).reduce((a, b) => a + b, 0) / total, width: w / total }))
    return (
        <div className={cn(PANEL, "p-5")}>
            <div className="space-y-3">
                {stages.map((s, i) => {
                    const status = statusOf(stages, i)
                    const span = spans[i]
                    const done = s.tasks.filter(t => t.completed).length
                    return (
                        <motion.div key={s.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-4 items-center">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Node status={status} index={i} size={24} />
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{s.name}</span>
                                <span className="ml-auto md:hidden"><StageActions stage={s} readOnly={h.readOnly} onAddTask={h.onAddTask} onEditStage={h.onEditStage} /></span>
                            </div>
                            <div className="relative h-10 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04]">
                                <motion.div
                                    className={cn(
                                        "group absolute top-1 bottom-1 rounded-md overflow-hidden flex items-center justify-between gap-2 px-2.5 min-w-[96px]",
                                        status === "todo" ? "bg-zinc-200/70 dark:bg-white/[0.06]" : "bg-[#ff0054]/10 dark:bg-[#ff0054]/15 ring-1 ring-[#ff0054]/25"
                                    )}
                                    style={{ left: `${span.start * 100}%`, width: `${span.width * 100}%` }}
                                    initial={{ opacity: 0, scaleX: 0.6 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <span className="absolute inset-y-0 left-0" style={{ width: `${s.progress}%`, background: status === "todo" ? "transparent" : "rgba(255,0,84,0.85)" }} />
                                    <span className={cn("relative text-[11px] font-semibold tabular-nums", s.progress > 45 && status !== "todo" ? "text-white" : "text-zinc-700 dark:text-zinc-300")}>{s.progress}%</span>
                                    <span className="relative text-[10px] text-zinc-600 dark:text-zinc-400 tabular-nums hidden sm:inline">{done}/{s.tasks.length}</span>
                                </motion.div>
                            </div>
                            <div className="hidden md:block col-start-2 -mt-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ marginLeft: `${span.start * 100}%` }}>
                                        {s.tasks.slice(0, 3).map(t => (
                                            <button key={t.id} type="button" disabled={h.readOnly || !h.onToggleTask} onClick={() => h.onToggleTask?.(t.id, s.id)} className={cn("text-[11px] truncate max-w-[200px]", t.completed ? "text-zinc-400 line-through" : "text-zinc-500 dark:text-zinc-400", !h.readOnly && h.onToggleTask && "hover:text-zinc-900 dark:hover:text-white")}>
                                                {t.title}
                                            </button>
                                        ))}
                                        {s.tasks.length > 3 && <span className="text-[11px] text-zinc-400">+{s.tasks.length - 3}</span>}
                                    </div>
                                    <StageActions stage={s} readOnly={h.readOnly} onAddTask={h.onAddTask} onEditStage={h.onEditStage} />
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-200/80 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 text-[11px] text-zinc-500">
                <span className="hidden md:block" />
                <div className="flex justify-between"><span>Início</span><span>Entrega</span></div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------

export function JourneyRoadmapLayouts({ variant, stages, readOnly = false, onToggleTask, onAddTask, onEditStage }: JourneyRoadmapLayoutsProps) {
    const h: Handlers = { readOnly, onToggleTask, onAddTask, onEditStage }
    const done = stages.filter(s => s.progress === 100).length

    return (
        <section className="mb-16 space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{stages.length} {stages.length === 1 ? "fase" : "fases"} <span className="text-zinc-400">· {done} concluídas</span></p>
                <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ff0054]" /> Concluída</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full ring-2 ring-[#ff0054] bg-transparent" /> Em curso</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-white/20" /> Por iniciar</span>
                </div>
            </div>

            {stages.length === 0 ? (
                <div className="border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl px-6 py-14 text-center">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ainda não há fases com tarefas</p>
                    <p className="text-xs text-zinc-500 mt-1.5">O roadmap aparece aqui assim que as fases tiverem tarefas.</p>
                </div>
            ) : variant === "winding-road" ? <Percurso stages={stages} h={h} />
                : variant === "angular-path" ? <Marcos stages={stages} h={h} />
                : variant === "ribbon-path" ? <Faixas stages={stages} h={h} />
                : <Cascata stages={stages} h={h} />}
        </section>
    )
}
