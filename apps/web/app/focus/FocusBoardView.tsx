"use client"

import React, { useState, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    CheckCircle2,
    MoreVertical,
    X,
    Loader2,
    Square,
    CheckSquare,
    Search,
    Grid,
    ArrowLeft,
    List as ListIcon,
    StickyNote,
    ChevronLeft,
    ChevronRight,
    Gamepad2,
    Pause,
    Play,
    SkipForward
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
    RoadmapStage,
    toggleRoadmapTask,
    createRoadmapTask,
    updateTaskPosition as updateTaskPositionRoadmap,
    deleteRoadmapTask,
    updateRoadmapTaskDetails
} from "@/app/actions/roadmap"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FocusBoardViewProps {
    project: any
    stages: RoadmapStage[]
    onBack: () => void
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
}

// Format minutes to display string (hours format)
function formatTime(minutes: number): string {
    if (!minutes || minutes === 0) return "0h"
    const hours = minutes / 60
    if (Number.isInteger(hours)) return `${hours}h`
    return `${hours.toFixed(1)}h`
}

// Parse HH:MM to minutes
function parseTimeInput(value: string): number {
    if (value.includes(':')) {
        const parts = value.split(':')
        const hours = parseInt(parts[0]) || 0
        const mins = parseInt(parts[1]) || 0
        return hours * 60 + mins
    }
    return parseInt(value) || 0
}

// Format minutes to HH:MM or minutes string
function formatTimeInput(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const HoverIconBtn = ({ icon: Icon, text, color = "bg-[#2a2a2e]", onClick }: { icon: React.ElementType, text: string, color?: string, onClick?: () => void }) => (
    <div
        className={cn(
            "group/icon flex items-center h-7 rounded-full transition-all duration-300 overflow-hidden cursor-pointer px-1.5 py-0.5",
            color,
            "hover:px-2.5 gap-0 hover:gap-1.5 w-7 hover:w-auto"
        )}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover/icon:text-white shrink-0" />
        <span className="text-[10px] text-white font-bold uppercase tracking-wider opacity-0 group-hover/icon:opacity-100 whitespace-nowrap duration-300 delay-75">
            {text}
        </span>
    </div>
)

// --- Task Card Component ---
interface TaskCardProps {
    task: any
    index: number
    stageColor: string
    projectId: string
    onUpdate: () => void
    onMove: (direction: 'left' | 'right') => void
    isOverlay?: boolean
    isFocusMode?: boolean
    isFirst?: boolean
    onSkip?: () => void
}

function FocusedTaskCard({ task, index, stageColor, projectId, onUpdate, onMove, isOverlay, isFocusMode, isFirst, onSkip }: TaskCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [editingTitle, setEditingTitle] = useState(false)
    const [editingEst, setEditingEst] = useState(false)
    const [titleValue, setTitleValue] = useState(task.title || "")
    const [estValue, setEstValue] = useState(task.estimated_time ? formatTimeInput(task.estimated_time) : "00:00")
    const [showDropdown, setShowDropdown] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [seconds, setSeconds] = useState(() => (task.estimated_time || 0) > 0 ? task.estimated_time * 60 : 0)
    const [lastSavedSeconds, setLastSavedSeconds] = useState(() => (task.estimated_time || 0) > 0 ? task.estimated_time * 60 : 0)

    const isCountdown = (task.estimated_time || 0) > 0

    const saveWorkTime = async (currentSeconds: number) => {
        if (!isFocused) return

        // Calculate how much time passed in seconds since last save
        let secondsDiff = 0
        if (isCountdown) {
            secondsDiff = lastSavedSeconds - currentSeconds
        } else {
            secondsDiff = currentSeconds - lastSavedSeconds
        }

        if (secondsDiff <= 0) return

        const minutesToAdd = secondsDiff / 60
        const newTotalElapsed = (task.elapsed_time || 0) + minutesToAdd

        await updateRoadmapTaskDetails(task.id, projectId, { elapsed_time: newTotalElapsed })
        setLastSavedSeconds(currentSeconds)
        onUpdate()
    }

    // Timer logic for focus mode
    useEffect(() => {
        if (!isFocusMode || !isFirst || isPaused) return

        const timer = setInterval(() => {
            setSeconds(prev => {
                if (isCountdown) {
                    return Math.max(0, prev - 1)
                }
                return prev + 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isFocusMode, isFirst, isPaused, isCountdown])

    const handlePauseToggle = async () => {
        if (!isPaused) {
            // About to pause, save work time
            await saveWorkTime(seconds)
        }
        setIsPaused(!isPaused)
    }

    // Format seconds to HH:MM:SS
    const formatSessionTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
        disabled: isOverlay,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    const handleToggleComplete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsLoading(true)
        const res = await toggleRoadmapTask(task.id, projectId)
        if (res.success) {
            onUpdate()
        }
        setIsLoading(false)
    }

    const handleTitleBlur = async () => {
        setEditingTitle(false)
        if (titleValue !== task.title) {
            await updateRoadmapTaskDetails(task.id, projectId, { title: titleValue })
            onUpdate()
        }
    }

    const handleEstBlur = async () => {
        setEditingEst(false)
        const minutes = parseTimeInput(estValue)
        if (minutes !== task.estimated_time) {
            await updateRoadmapTaskDetails(task.id, projectId, { estimated_time: minutes })
            onUpdate()
        }
    }

    const handleDelete = async () => {
        if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
            await deleteRoadmapTask(task.id, projectId)
            onUpdate()
        }
    }

    const handleNoDrag = (e: React.PointerEvent) => {
        e.stopPropagation()
    }

    const isFocused = isFocusMode && isFirst

    return (
        <motion.div
            ref={setNodeRef}
            style={{
                ...style, ...(isFocused ? {
                    background: 'linear-gradient(#1a1a1e, #1a1a1e) padding-box, linear-gradient(to right, #FF0054, #06D6A0) border-box',
                    border: '2px solid transparent',
                } : {})
            }}
            {...attributes}
            {...listeners}
            className={cn(
                "group relative bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl cursor-pointer transition-all duration-500",
                task.completed ? "opacity-60 border-emerald-500/20" : "hover:border-[#3a3a3e]",
                isOverlay && "shadow-2xl border-accent-indigo/50 scale-105 rotate-2",
                isFocusMode && !isFocused ? "h-[54px] p-2 overflow-hidden" : (isFocused ? "h-[100px] px-6" : (isHovered ? "h-auto py-4 px-3" : "h-[80px] p-4"))
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setShowDropdown(false); }}
        >
            <div className="flex flex-col h-full justify-center">
                <AnimatePresence mode="wait">
                    {isFocused && isHovered ? (
                        <motion.div
                            key="controls"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-center gap-2"
                            onPointerDown={handleNoDrag}
                        >
                            <HoverIconBtn icon={Gamepad2} text="Break" />
                            <HoverIconBtn icon={StickyNote} text="Note" />
                            <HoverIconBtn
                                icon={isPaused ? Play : Pause}
                                text={isPaused ? "Resume" : "Pause"}
                                onClick={handlePauseToggle}
                            />
                            <HoverIconBtn
                                icon={SkipForward}
                                text="Skip"
                                onClick={async () => {
                                    await saveWorkTime(seconds)
                                    if (onSkip) onSkip()
                                }}
                            />
                            <div
                                className="group/icon flex items-center h-8 rounded-full transition-all duration-300 overflow-hidden cursor-pointer px-2 py-1 border border-emerald-500/50 hover:bg-emerald-500/10 hover:px-3 gap-0 hover:gap-2 w-8 hover:w-auto"
                                onClick={handleToggleComplete}
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider opacity-0 group-hover/icon:opacity-100 whitespace-nowrap">Done</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {!isFocusMode && (
                                            <div className="flex items-center space-x-1 mt-0.5 shrink-0" onPointerDown={handleNoDrag}>
                                                <span className="text-[10px] font-mono text-slate-400 w-3 font-bold">{index}</span>
                                                {task.completed ? (
                                                    <button onClick={handleToggleComplete} className="text-emerald-500">
                                                        <CheckSquare className="w-3.5 h-3.5" />
                                                    </button>
                                                ) : (
                                                    <button onClick={handleToggleComplete} className="text-slate-400 hover:text-white transition-colors">
                                                        <Square className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            {editingTitle ? (
                                                <Input
                                                    value={titleValue}
                                                    onChange={(e) => setTitleValue(e.target.value)}
                                                    onBlur={handleTitleBlur}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                                                    className="h-6 p-0 bg-transparent border-none text-[16px] font-bold text-white focus-visible:ring-0"
                                                    autoFocus
                                                    onPointerDown={handleNoDrag}
                                                />
                                            ) : (
                                                <h4
                                                    className={cn(
                                                        "text-[16px] font-bold text-white truncate",
                                                        task.completed && "line-through text-slate-500"
                                                    )}
                                                    onClick={() => !isFocusMode && setEditingTitle(true)}
                                                >
                                                    {task.title}
                                                </h4>
                                            )}
                                        </div>
                                    </div>

                                    {isFocused && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-[0.1em] flex items-center gap-1.5",
                                                isPaused ? "text-amber-400" : "text-emerald-400"
                                            )}>
                                                <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                                                )} />
                                                {isPaused ? "SESSÃO PAUSADA" : "RUNNING"}
                                            </span>
                                        </div>
                                    )}

                                    {!isFocusMode && !isHovered && (
                                        <div className="flex items-center gap-3 mt-1" onPointerDown={handleNoDrag}>
                                            <span
                                                className="text-[10px] text-slate-400 font-bold uppercase tracking-wider"
                                            >
                                                + EST {task.estimated_time ? formatTime(task.estimated_time) : '--'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center shrink-0" onPointerDown={handleNoDrag}>
                                    {isFocused && (
                                        <div className="text-[24px] font-mono font-black text-white tabular-nums tracking-tighter">
                                            {formatSessionTime(seconds)}
                                        </div>
                                    )}
                                    {!isFocusMode && (
                                        <div
                                            className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow-sm"
                                            style={{ backgroundColor: stageColor || '#6366f1' }}
                                        >
                                            {task.assignee?.name?.charAt(0).toUpperCase() || "T"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isHovered && !isFocusMode && !task.completed && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center justify-between mt-1 pt-2 border-t border-white/5"
                                        onPointerDown={handleNoDrag}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <HoverIconBtn icon={ListIcon} text="Subtasks" />
                                            <HoverIconBtn icon={StickyNote} text="Notes" />
                                            <HoverIconBtn icon={ChevronLeft} text="Left" onClick={() => onMove('left')} />
                                            <HoverIconBtn icon={ChevronRight} text="Right" onClick={() => onMove('right')} />
                                            <div className="relative">
                                                <HoverIconBtn icon={MoreVertical} text="More" onClick={() => setShowDropdown(!showDropdown)} />
                                                {showDropdown && (
                                                    <div className="absolute left-0 bottom-full mb-1 w-32 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg shadow-xl z-50 p-1">
                                                        <button
                                                            onClick={handleDelete}
                                                            className="w-full text-left px-2 py-1.5 text-[11px] text-red-500 hover:bg-white/5 rounded transition-colors"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {editingEst ? (
                                                <Input
                                                    value={estValue}
                                                    onChange={(e) => setEstValue(e.target.value)}
                                                    onBlur={handleEstBlur}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleEstBlur()}
                                                    className="h-4 p-0 w-16 bg-transparent border border-[#3a3a3e] rounded text-[10px] font-bold text-center text-text-tertiary focus-visible:ring-0"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="text-[10px] text-slate-400 font-bold uppercase tracking-wider cursor-text hover:text-white transition-colors"
                                                    onClick={() => setEditingEst(true)}
                                                >
                                                    {task.estimated_time ? formatTime(task.estimated_time) : "+ EST"}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {task.elapsed_time || 0}m
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

// --- Column Component ---
interface ColumnProps {
    stage: RoadmapStage
    tasks: any[]
    projectId: string
    onUpdate: () => void
    roadmapStages: RoadmapStage[]
    isFocusMode: boolean
    onFocusToggle: (isClose?: boolean) => void
    onDeepFocus?: () => void
}

function FocusedColumn({ stage, tasks, projectId, onUpdate, roadmapStages, isFocusMode, onFocusToggle, onDeepFocus }: ColumnProps) {
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || isSubmitting) return
        setIsSubmitting(true)
        const res = await createRoadmapTask(projectId, stage.id, newTaskTitle.trim())
        if (res.success) {
            setNewTaskTitle("")
            setIsAddingTask(false)
            onUpdate()
        }
        setIsLoading(false)
    }

    return (
        <div
            className={cn(
                "w-[380px] flex-shrink-0 rounded-[20px] flex flex-col h-full transition-all duration-300 border-2",
                isFocusMode ? "border-transparent" : "border-[#2a2a2e]"
            )}
            style={{
                backgroundColor: '#1E1E22',
                ...(isFocusMode ? {
                    background: 'linear-gradient(#1E1E22, #1E1E22) padding-box, linear-gradient(to bottom, #DD005A, #FF002D, #06D6A0, #311C99) border-box',
                } : {})
            }}
        >
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-white capitalize">
                        {stage.name}
                    </h3>
                    {!isFocusMode && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-white"
                            onClick={() => setIsAddingTask(true)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {!isFocusMode && (
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500"
                                style={{
                                    width: `${stage.progress}%`,
                                    background: 'linear-gradient(90deg, #DD005A, #FF002D, #06D6A0, #311C99)'
                                }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-widest">
                            {tasks.filter(t => t.completed).length}/{tasks.length} Done
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.length > 0 ? (
                        tasks.map((task, idx) => (
                            <FocusedTaskCard
                                key={task.id}
                                task={task}
                                index={idx + 1}
                                stageColor={stage.color}
                                projectId={projectId}
                                onUpdate={onUpdate}
                                isFocusMode={isFocusMode}
                                isFirst={idx === 0}
                                onSkip={() => onFocusToggle()}
                                onMove={async (direction) => {
                                    const currentIndex = roadmapStages.findIndex(s => s.id === stage.id)
                                    const nextIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
                                    if (nextIndex >= 0 && nextIndex < roadmapStages.length) {
                                        await updateTaskPositionRoadmap(task.id, 0, roadmapStages[nextIndex].id, projectId)
                                        onUpdate()
                                    }
                                }}
                            />
                        ))
                    ) : !isAddingTask && (
                        <div className="flex flex-col items-center justify-center py-12 opacity-30">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#2a2a2e] flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">All clear</span>
                        </div>
                    )}
                </SortableContext>

                {isAddingTask && (
                    <div className="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-3 animate-in fade-in duration-200">
                        <Input
                            placeholder="Nova tarefa..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="h-8 bg-transparent border-none text-[14px] text-white placeholder:text-slate-500 focus-visible:ring-0 p-0 mb-3"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        />
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setIsAddingTask(false)}
                                className="flex items-center text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest"
                            >
                                <X className="w-3 h-3 mr-1" /> Cancelar
                            </button>
                            <Button
                                size="sm"
                                className="h-7 bg-white text-black hover:bg-gray-200 font-bold text-[10px] uppercase tracking-widest px-3"
                                onClick={handleAddTask}
                                disabled={!newTaskTitle.trim() || isLoading}
                            >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar"}
                            </Button>
                        </div>
                    </div>
                )}
                <div className="h-4" />
            </div>

            {isFocusMode && (
                <div className="p-4 mt-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDeepFocus) onDeepFocus();
                            }}
                            className="flex-1 h-10 rounded-full bg-gradient-to-r from-[#DD005A] via-[#8000FF] to-[#311C99] flex items-center justify-center shadow-lg shadow-[#DD005A]/10 hover:opacity-90 transition-opacity active:scale-[0.98]"
                        >
                            <span className="text-[13px] font-bold text-white tracking-tight">Focus mode</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFocusToggle(true); // Signaling close session
                            }}
                            className="flex-1 h-10 rounded-full border border-white/10 bg-[#1a1a1e] hover:bg-[#25252a] flex items-center justify-center transition-all active:scale-[0.98]"
                        >
                            <span className="text-[13px] font-bold text-sky-400 tracking-tight whitespace-nowrap">Close session</span>
                        </button>
                    </div>
                </div>
            )}

            {!isFocusMode && (
                <div className="p-4 pt-0 mt-auto space-y-3">
                    {!isAddingTask && (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="flex items-center text-[10px] font-bold text-slate-400 hover:text-white tracking-widest uppercase transition-colors ml-1"
                        >
                            <Plus className="w-3 h-3 mr-1.5" />
                            ADD TASK
                        </button>
                    )}

                    <Button
                        className="w-full h-11 bg-bg-2 hover:bg-bg-3 text-text-secondary border border-[#2a2a2e] rounded-xl text-xs font-bold transition-all shadow-lg active:scale-[0.98]"
                        onClick={() => onFocusToggle()}
                    >
                        Brivio* it
                    </Button>
                </div>
            )}
        </div>
    )
}

// --- Liquid Background Component ---
const LiquidBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#1A1A1E]">
        <motion.div
            animate={{
                x: [0, 150, -100, 0],
                y: [0, -100, 150, 0],
                scale: [1, 1.5, 0.8, 1],
                rotate: [0, 45, -45, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#FF0054]/15 rounded-full blur-[140px]"
        />
        <motion.div
            animate={{
                x: [0, -150, 100, 0],
                y: [0, 150, -100, 0],
                scale: [1, 0.8, 1.5, 1],
                rotate: [0, -45, 45, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[900px] h-[900px] bg-[#06D6A0]/15 rounded-full blur-[140px]"
        />
        <motion.div
            animate={{
                x: [0, 100, 200, 0],
                y: [0, 200, 100, 0],
                scale: [1, 1.2, 0.9, 1],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-[#88007F]/15 rounded-full blur-[120px]"
        />
        <motion.div
            animate={{
                x: [0, -200, -100, 0],
                y: [0, -100, -200, 0],
                scale: [1, 0.9, 1.3, 1],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[20%] left-[10%] w-[700px] h-[700px] bg-[#311C99]/15 rounded-full blur-[130px]"
        />
    </div>
)

// --- Deep Focus Timer Component ---
function DeepFocusTimer({ task, projectId, onUpdate, onExit, onSkip }: { task: RoadmapStage['tasks'][0], projectId: string, onUpdate: () => void, onExit: () => void, onSkip: () => void }) {
    const [isPaused, setIsPaused] = useState(false)
    const [seconds, setSeconds] = useState(() => (task.estimated_time || 0) > 0 ? task.estimated_time * 60 : 0)
    const [lastSavedSeconds, setLastSavedSeconds] = useState(() => (task.estimated_time || 0) > 0 ? task.estimated_time * 60 : 0)

    const isCountdown = (task.estimated_time || 0) > 0

    const saveWorkTime = async (currentSeconds: number) => {
        const secondsDiff = isCountdown ? lastSavedSeconds - currentSeconds : currentSeconds - lastSavedSeconds
        if (secondsDiff <= 0) return

        const minutesToAdd = secondsDiff / 60
        const newTotalElapsed = (task.elapsed_time || 0) + minutesToAdd

        await updateRoadmapTaskDetails(task.id, projectId, { elapsed_time: newTotalElapsed })
        setLastSavedSeconds(currentSeconds)
        onUpdate()
    }

    useEffect(() => {
        if (isPaused) return
        const timer = setInterval(() => {
            setSeconds(prev => isCountdown ? Math.max(0, prev - 1) : prev + 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [isPaused, isCountdown])

    const formatSessionTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col items-center gap-12 w-[900px]">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[180px] font-mono font-black text-white tabular-nums tracking-tighter leading-none"
            >
                {formatSessionTime(seconds)}
            </motion.div>

            <div className="flex flex-col items-center gap-8">
                <div className="flex items-center gap-4">
                    <HoverIconBtn icon={Gamepad2} text="Break" color="bg-white/5" />
                    <HoverIconBtn icon={StickyNote} text="Note" color="bg-white/5" />
                    <button
                        onClick={async () => {
                            if (!isPaused) await saveWorkTime(seconds)
                            setIsPaused(!isPaused)
                        }}
                        className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/5 active:scale-90"
                    >
                        {isPaused ? <Play className="w-6 h-6 text-white" /> : <Pause className="w-6 h-6 text-white" />}
                    </button>
                    <HoverIconBtn
                        icon={SkipForward}
                        text="Skip"
                        color="bg-white/5"
                        onClick={async () => {
                            await saveWorkTime(seconds)
                            onSkip()
                        }}
                    />
                    <button
                        onClick={onExit}
                        className="w-14 h-14 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all border border-white/5 group"
                    >
                        <X className="w-6 h-6 text-slate-400 group-hover:text-red-500" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{task.title}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                            {isPaused ? "Focused - Paused" : "Focused - Work Session"}
                        </span>
                        <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse")} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function FocusBoardView({ project, stages, onBack }: FocusBoardViewProps) {
    const router = useRouter()
    const [localStages, setLocalStages] = useState(stages)
    const [focusedStageId, setFocusedStageId] = useState<string | null>(null)
    const [isDeepFocus, setIsDeepFocus] = useState(false)
    const [activeTask, setActiveTask] = useState<any>(null)

    useEffect(() => {
        setLocalStages(stages)
    }, [stages])

    const handleRefresh = () => {
        router.refresh()
    }

    const handleFocusAction = async (stageId: string, isClose?: any) => {
        if (isClose === true) {
            setFocusedStageId(null)
            return
        }

        if (focusedStageId !== stageId) {
            setFocusedStageId(stageId)
            return
        }

        // Logic to skip/advance task within the focused stage
        handleRefresh()
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    const findTask = (id: string) => {
        for (const stage of localStages) {
            const task = stage.tasks.find(t => t.id === id)
            if (task) return { task, stageId: stage.id }
        }
        return null
    }

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const found = findTask(active.id as string)
        if (found) setActiveTask(found.task)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id
        if (activeId === overId) return

        const activeFound = findTask(activeId as string)
        const overStage = localStages.find(s => s.id === overId) || localStages.find(s => s.tasks.some(t => t.id === overId))

        if (activeFound && overStage && activeFound.stageId !== overStage.id) {
            setLocalStages(prev => {
                const newStages = [...prev]
                const activeStageIdx = newStages.findIndex(s => s.id === activeFound.stageId)
                const overStageIdx = newStages.findIndex(s => s.id === overStage.id)

                const task = newStages[activeStageIdx].tasks.find(t => t.id === activeId)
                if (task) {
                    newStages[activeStageIdx].tasks = newStages[activeStageIdx].tasks.filter(t => t.id !== activeId)
                    newStages[overStageIdx].tasks.push(task)
                }
                return newStages
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTask(null)
        if (!over) return

        const activeId = active.id
        const overId = over.id

        const activeFound = findTask(activeId as string)
        const overStage = localStages.find(s => s.id === overId) || localStages.find(s => s.tasks.some(t => t.id === overId))

        if (activeFound && overStage) {
            // Persist position/stage change
            const res = await updateTaskPositionRoadmap(activeId as string, 0, overStage.id, project.id)
            if (res.success) {
                handleRefresh()
            } else {
                toast.error("Erro ao mover tarefa")
                setLocalStages(stages) // Revert on failure
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-screen bg-[#1A1A1E] text-white">
                <header className="h-[72px] flex items-center justify-between px-8 border-b border-[#2a2a2e] bg-[#1A1A1E] sticky top-0 z-50">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            className="h-9 px-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg"
                                style={{ backgroundColor: project.color || '#6366f1' }}
                            >
                                {project.brand?.logo_url ? (
                                    <img src={project.brand.logo_url} className="w-5 h-5 rounded-sm object-contain" alt={project.name} />
                                ) : (
                                    project.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-white tracking-tight">{project.name}</h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Project Roadmap</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-[1px] rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/10 active:scale-[0.98] transition-transform">
                            <Button
                                variant="ghost"
                                className="h-8 bg-[#0a0a0c] text-white hover:bg-[#1a1a1e] rounded-full px-5 text-[11px] font-bold uppercase tracking-widest"
                            >
                                Report
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
                            <Search className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
                            <Grid className="w-4 h-4" />
                        </Button>
                        <Avatar className="w-8 h-8 border border-white/10 ml-2">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>BT</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <div className="flex-1 overflow-x-auto p-10 bg-[#1A1A1E] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {!isDeepFocus ? (
                            <motion.div
                                key="board"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="flex h-full gap-[14px] mx-auto w-fit min-w-full justify-center"
                            >
                                {localStages.map((stage) => (
                                    <FocusedColumn
                                        key={stage.id}
                                        stage={stage}
                                        tasks={stage.tasks}
                                        projectId={project.id}
                                        onUpdate={handleRefresh}
                                        roadmapStages={localStages}
                                        isFocusMode={focusedStageId === stage.id}
                                        onFocusToggle={(isClose) => handleFocusAction(stage.id, isClose)}
                                        onDeepFocus={() => setIsDeepFocus(true)}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="deep-focus"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 flex flex-col items-center justify-center z-[100]"
                            >
                                <LiquidBackground />
                                {(() => {
                                    const focusedStage = localStages.find(s => s.id === focusedStageId)
                                    const task = focusedStage?.tasks[0]
                                    if (!task) return (
                                        <div className="text-center">
                                            <h2 className="text-3xl font-bold text-white mb-4">No tasks in progress</h2>
                                            <Button onClick={() => setIsDeepFocus(false)} variant="ghost" className="text-slate-400">Return to board</Button>
                                        </div>
                                    )

                                    return (
                                        <div className="w-full flex flex-col items-center max-w-[1200px]">
                                            <div className="relative w-[100%] flex flex-col items-center">
                                                <div className="w-full flex items-center justify-center">
                                                    <DeepFocusTimer
                                                        task={task} // task type is now Task
                                                        projectId={project.id}
                                                        onUpdate={handleRefresh}
                                                        onExit={() => setIsDeepFocus(false)}
                                                        onSkip={() => handleFocusAction(focusedStageId!)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <FocusedTaskCard
                            task={activeTask}
                            index={0}
                            stageColor={localStages.find(s => s.tasks.some(t => t.id === activeTask.id))?.color || '#6366f1'}
                            projectId={project.id}
                            onUpdate={handleRefresh}
                            onMove={() => { }}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    )
}
