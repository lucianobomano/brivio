"use client"

import React, { useState, useRef, useEffect } from "react"
import {
    Square,
    CheckSquare,
    List,
    StickyNote,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    X,
    Plus,
    Circle,
    CheckCircle2,
    Gamepad2,
    Pause,
    Play,
    SkipForward,
    ChevronDown
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Input } from "@/components/ui/input"
import { Task, TaskList, toggleTaskComplete, updateTaskTime, moveTaskToColumn, addSubtask, toggleSubtask, deleteTask } from "@/app/actions/tasks"
import { cn } from "@/lib/utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TaskCardProps {
    task: Task
    index: number
    list: TaskList
    listId: string
    onUpdate: () => void
    onOptimisticUpdate?: (task: Task) => void
    isOverlay?: boolean
    isFocusMode?: boolean
    isFirst?: boolean
}

// Format minutes to display string
function formatTime(minutes: number): string {
    if (minutes === 0) return "0min"
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    return `${hours}hr`
}

// Parse HH:MM to minutes
function parseTimeInput(value: string): number {
    const parts = value.split(':')
    if (parts.length !== 2) return 0
    const hours = parseInt(parts[0]) || 0
    const mins = parseInt(parts[1]) || 0
    return hours * 60 + mins
}

// Format minutes to HH:MM
function formatTimeInput(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const HoverIconBtn = ({ icon: Icon, text, color = "bg-[#363636]", borderColor, onClick }: { icon: React.ElementType, text: string, color?: string, borderColor?: string, onClick?: () => void }) => (
    <div
        className={cn(
            "group/icon flex items-center h-8 rounded-full transition-all duration-300 overflow-hidden cursor-pointer px-2 py-0.5",
            borderColor ? `border border-[${borderColor}]` : color,
            "hover:px-3 gap-0 hover:gap-2 w-8 hover:w-auto"
        )}
        style={borderColor ? { borderColor } : {}}
        onClick={onClick}
    >
        <Icon className="w-4 h-4 text-gray-400 group-hover/icon:text-white shrink-0" />
        <span className="text-xs text-white font-medium opacity-0 group-hover/icon:opacity-100 whitespace-nowrap duration-300 delay-75">
            {text}
        </span>
    </div>
)

export default function TaskCard({ task, index, list, listId, onUpdate, onOptimisticUpdate, isOverlay, isFocusMode = false, isFirst = false }: TaskCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [showSubtasks, setShowSubtasks] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [editingEst, setEditingEst] = useState(false)
    const [editingElapsed, setEditingElapsed] = useState(false)
    const [estValue, setEstValue] = useState(formatTimeInput(task.estimated_time))
    const [elapsedValue, setElapsedValue] = useState(formatTimeInput(task.elapsed_time || 0))
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
    const [isAddingSubtask, setIsAddingSubtask] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(() => (task.estimated_time || 0) * 60)
    const [isPaused, setIsPaused] = useState(false)
    const [timerMode, setTimerMode] = useState<'countdown' | 'countup'>('countdown')

    // Initialize Timer Mode and Starting Time
    useEffect(() => {
        if (!isFocusMode || !isFirst) return

        const elapsed = (task.elapsed_time || 0) * 60
        const estimate = (task.estimated_time || 0) * 60

        if (task.elapsed_time === 0 && task.estimated_time > 0) {
            // Countdown from estimate
            setTimerMode('countdown')
            setTimeLeft(estimate)
        } else if (task.estimated_time === 0) {
            // Countup from elapsed
            setTimerMode('countup')
            setTimeLeft(elapsed)
        } else {
            // Countdown from remaining time (estimate - elapsed)
            setTimerMode('countdown')
            setTimeLeft(Math.max(0, estimate - elapsed))
        }
    }, [task.estimated_time, task.elapsed_time, isFocusMode, isFirst])

    // Timer Logic for First Task in Focus Mode
    useEffect(() => {
        if (!isFocusMode || !isFirst || isPaused) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (timerMode === 'countdown') {
                    return Math.max(0, prev - 1)
                } else {
                    return prev + 1
                }
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isFocusMode, isFirst, isPaused, timerMode])

    // Format Timer HH:MM:SS
    const formatTimer = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
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

    const focusFirstStyle = isFocusMode && isFirst ? {
        background: 'linear-gradient(#1a1a1e, #1a1a1e) padding-box, linear-gradient(to right, #FF0054, #06D6A0) border-box',
        border: '2px solid transparent',
        boxShadow: '0 0 20px rgba(6, 214, 160, 0.15)'
    } : {}

    const estInputRef = useRef<HTMLInputElement>(null)
    const elapsedInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleToggleComplete = async () => {
        if (onOptimisticUpdate) {
            const newCompleted = !task.completed
            const newStatus = newCompleted ? 'done' as const : task.status
            onOptimisticUpdate({ ...task, completed: newCompleted, status: newStatus })
        }

        setIsLoading(true)
        await toggleTaskComplete(task.id, listId)
        onUpdate()
        setIsLoading(false)
    }

    const handleEstBlur = async () => {
        setEditingEst(false)
        const minutes = parseTimeInput(estValue)
        if (minutes !== task.estimated_time) {
            await updateTaskTime(task.id, 'estimated_time', minutes, listId)
            onUpdate()
        }
    }

    const handleElapsedBlur = async () => {
        setEditingElapsed(false)
        const minutes = parseTimeInput(elapsedValue)
        if (minutes !== (task.elapsed_time || 0)) {
            await updateTaskTime(task.id, 'elapsed_time', minutes, listId)
            onUpdate()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, field: 'est' | 'elapsed') => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            if (field === 'est') handleEstBlur()
            else handleElapsedBlur()
        }
    }

    const handleMoveTask = async (direction: 'left' | 'right') => {
        setIsLoading(true)
        await moveTaskToColumn(task.id, direction, listId)
        onUpdate()
        setIsLoading(false)
    }

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return
        setIsLoading(true)
        await addSubtask(task.id, newSubtaskTitle.trim(), listId)
        setNewSubtaskTitle("")
        onUpdate()
        setIsLoading(false)
    }

    const handleToggleSubtask = async (subtaskId: string) => {
        if (onOptimisticUpdate) {
            const updatedSubtasks = (task.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
            onOptimisticUpdate({ ...task, subtasks: updatedSubtasks })
        }
        await toggleSubtask(task.id, subtaskId, listId)
        onUpdate()
    }

    const handleDelete = async () => {
        setIsLoading(true)
        await deleteTask(task.id, listId)
        onUpdate()
    }

    const subtasks = task.subtasks || []
    const completedSubtasks = subtasks.filter(st => st.completed).length

    const handleNoDrag = (e: React.PointerEvent) => {
        e.stopPropagation();
    }

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...focusFirstStyle }}
            {...attributes}
            {...listeners}
            className={cn(
                "rounded-lg border bg-[#1a1a1e] cursor-pointer relative",
                "transition-all duration-300 ease-in-out",
                (showSubtasks || isHovered || task.subtasks.length > 0) ? "h-auto" : (isFocusMode && isFirst ? "h-[72px]" : (isFocusMode ? "h-[54px]" : "h-[85px]")),
                task.completed ? "border-green-500/30 opacity-60" : "border-[#2a2a2e]",
                (isHovered || isOverlay) && !task.completed && !isFirst && "border-[#3a3a3e]",
                isOverlay && "shadow-xl border-[#dd005a]/50 scale-105"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setShowDropdown(false); }}
        >
            <div className={cn("px-3 flex flex-col relative gap-[10px]", (showSubtasks || isHovered || task.subtasks.length > 0) ? "py-3" : "justify-center h-full py-3")}>

                {isFocusMode && isFirst ? (
                    <div className="flex items-center justify-between w-full h-full">
                        {isHovered ? (
                            <div className="flex items-center justify-center w-full space-x-2 animate-in fade-in duration-200">
                                <HoverIconBtn icon={Gamepad2} text="Break" />
                                <HoverIconBtn icon={StickyNote} text="Note" />
                                <HoverIconBtn
                                    icon={isPaused ? Play : Pause}
                                    text={isPaused ? "Resume" : "Pause"}
                                    onClick={() => setIsPaused(!isPaused)}
                                />
                                <HoverIconBtn icon={SkipForward} text="Skip" />
                                <div className="group/icon flex items-center h-8 rounded-full transition-all duration-300 overflow-hidden cursor-pointer px-2 py-0.5 border border-green-500 hover:px-3 gap-0 hover:gap-2 w-8 hover:w-auto">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <span className="text-xs text-green-500 font-medium opacity-0 group-hover/icon:opacity-100 whitespace-nowrap">Done</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <span className="text-[16px] font-semibold text-white truncate">{task.title}</span>
                                {isPaused ? (
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[20px] font-mono font-bold text-yellow-500">PAUSED</span>
                                        <div className="flex items-center space-x-2 text-[12px]">
                                            <span className="text-gray-500">{formatTime(task.estimated_time)}</span>
                                            <span className="text-gray-500">{formatTime(task.elapsed_time || 0)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[20px] font-mono font-medium text-white">{formatTimer(timeLeft)}</span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {!isFocusMode && (
                                    <div className="flex items-center space-x-1" onPointerDown={handleNoDrag}>
                                        <span className="text-xs text-gray-500 w-4">{index}</span>
                                        {isHovered && !task.completed && (
                                            <motion.button
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                onClick={handleToggleComplete}
                                                className="text-gray-500 hover:text-white transition-colors"
                                                disabled={isLoading}
                                            >
                                                <Square className="w-4 h-4" />
                                            </motion.button>
                                        )}
                                        {task.completed && (
                                            <button
                                                onClick={handleToggleComplete}
                                                className="text-green-500 hover:text-green-400 transition-colors"
                                                disabled={isLoading}
                                            >
                                                <CheckSquare className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {isFocusMode && (
                                    <div className="flex items-center space-x-2">
                                        {isHovered ? (
                                            <button onClick={handleToggleComplete} className="text-gray-500 hover:text-white" onPointerDown={handleNoDrag}>
                                                <Square className="w-4 h-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                )}

                                <span className={cn(
                                    "font-medium truncate",
                                    task.completed ? "text-gray-500 line-through" : "text-white",
                                    isFocusMode ? "text-[14px]" : "text-sm",
                                )}>
                                    {task.title}
                                </span>
                            </div>

                            {isFocusMode ? (
                                isHovered ? (
                                    <div className="flex items-center space-x-2 animate-in fade-in zoom-in duration-200">
                                        <div className="flex items-center space-x-2" onPointerDown={handleNoDrag}>
                                            <span className="text-xs text-gray-500 font-mono">{formatTime(task.estimated_time)}</span>
                                        </div>

                                        <div
                                            className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                            style={list.color.includes('gradient') ? { background: list.color } : { backgroundColor: list.color }}
                                        >
                                            {list.title.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0 opacity-80"
                                        style={list.color.includes('gradient') ? { background: list.color } : { backgroundColor: list.color }}
                                    >
                                        {list.title.charAt(0).toUpperCase()}
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center">
                                    {isHovered && !task.completed ? (
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="flex items-center space-x-[6px]"
                                            onPointerDown={handleNoDrag}
                                        >
                                            <button
                                                onClick={() => setShowSubtasks(!showSubtasks)}
                                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                                title="Show subtasks"
                                            >
                                                <List className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                                title="Show notes"
                                            >
                                                <StickyNote className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveTask('left')}
                                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                                title="Move to previous board"
                                                disabled={isLoading}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveTask('right')}
                                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                                title="Move to next board"
                                                disabled={isLoading}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                            <div className="relative" ref={dropdownRef}>
                                                <button
                                                    onClick={() => setShowDropdown(!showDropdown)}
                                                    className="p-1 text-gray-500 hover:text-white transition-colors"
                                                    title="More options"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {showDropdown && (
                                                    <div className="absolute right-0 top-full mt-1 w-[135px] bg-[#171717] rounded-lg shadow-xl z-50 p-2">
                                                        <button className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2e] rounded transition-colors">
                                                            Schedule
                                                        </button>
                                                        <button className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2e] rounded transition-colors">
                                                            Change list
                                                        </button>
                                                        <button className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2e] rounded transition-colors">
                                                            Duplicate
                                                        </button>
                                                        <button
                                                            onClick={handleDelete}
                                                            className="w-full text-left px-2 py-1.5 text-sm text-red-500 hover:bg-[#2a2a2e] rounded transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div
                                            className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                            style={list.color.includes('gradient')
                                                ? { background: list.color }
                                                : { backgroundColor: list.color }
                                            }
                                        >
                                            {list.title.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {(!isFocusMode || isHovered) && (
                            <div className="flex items-center justify-between w-full" onPointerDown={handleNoDrag}>
                                {editingEst ? (
                                    <div className="inline-flex items-center border border-pink-500 rounded px-1">
                                        <Input
                                            ref={estInputRef}
                                            value={estValue}
                                            onChange={(e) => setEstValue(e.target.value)}
                                            onBlur={handleEstBlur}
                                            onKeyDown={(e) => handleKeyDown(e, 'est')}
                                            className="w-14 h-5 p-0 text-[12px] text-center bg-transparent border-none focus:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setEditingEst(true); setEstValue(formatTimeInput(task.estimated_time)); }}
                                        className="text-[12px] text-gray-500 hover:text-white transition-colors"
                                    >
                                        {task.estimated_time > 0 ? formatTime(task.estimated_time) : "+ EST"}
                                    </button>
                                )}

                                {editingElapsed ? (
                                    <div className="inline-flex items-center border border-pink-500 rounded px-1">
                                        <Input
                                            ref={elapsedInputRef}
                                            value={elapsedValue}
                                            onChange={(e) => setElapsedValue(e.target.value)}
                                            onBlur={handleElapsedBlur}
                                            onKeyDown={(e) => handleKeyDown(e, 'elapsed')}
                                            className="w-14 h-5 p-0 text-[12px] text-center bg-transparent border-none focus:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setEditingElapsed(true); setElapsedValue(formatTimeInput(task.elapsed_time || 0)); }}
                                        className="text-[12px] text-gray-500 hover:text-white transition-colors"
                                    >
                                        {formatTime(task.elapsed_time || 0)}
                                    </button>
                                )}
                            </div>
                        )}

                        {isFocusMode && task.subtasks.length > 0 && (
                            <div className="w-full">
                                <div className="h-[1px] bg-[#515151] w-full mb-2"></div>
                                <div
                                    className="flex items-center justify-between cursor-pointer group/sub"
                                    onClick={() => setShowSubtasks(!showSubtasks)}
                                    onPointerDown={handleNoDrag}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="relative w-3 h-3">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                <path className="text-purple-500" strokeDasharray={`${(completedSubtasks / subtasks.length) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                            </svg>
                                        </div>
                                        <span className="text-[11px] text-gray-500 group-hover/sub:text-white transition-colors">
                                            {completedSubtasks}/{subtasks.length} Subtasks
                                        </span>
                                    </div>
                                    <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform", showSubtasks && "rotate-180")} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Subtasks Header - Always visible when subtasks exist (Normal Mode) */}
            {!isFocusMode && task.subtasks.length > 0 && (
                <div className="px-3 pb-3 pt-1">
                    <div
                        className="flex items-center justify-between cursor-pointer group/subtask-header"
                        onClick={() => setShowSubtasks(!showSubtasks)}
                        onPointerDown={handleNoDrag}
                    >
                        <div className="flex items-center space-x-2">
                            <Circle className="w-[12px] h-[12px] text-gray-500" />
                            <span className="text-[12px] text-gray-500 group-hover/subtask-header:text-white transition-colors">
                                {completedSubtasks}/{subtasks.length} Subtasks
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsAddingSubtask(true); }}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <Plus className="w-[12px] h-[12px]" />
                            </button>
                        </div>
                        <ChevronDown
                            className={cn(
                                "w-[12px] h-[12px] text-gray-500 group-hover/subtask-header:text-white transition-all",
                                showSubtasks && "rotate-180"
                            )}
                        />
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showSubtasks && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-[#2a2a2e] px-3 pb-3" onPointerDown={handleNoDrag}>
                            <div className="space-y-[8px] mt-2">
                                {subtasks.map((subtask) => (
                                    <div key={subtask.id} className="flex items-center space-x-2">
                                        <button onClick={() => handleToggleSubtask(subtask.id)}>
                                            {subtask.completed ? (
                                                <CheckCircle2 className="w-[12px] h-[12px] text-green-500" />
                                            ) : (
                                                <Circle className="w-[12px] h-[12px] text-gray-500" />
                                            )}
                                        </button>
                                        <span className={cn(
                                            "text-[12px] transition-colors cursor-default",
                                            subtask.completed ? "text-gray-500 line-through" : "text-[#636363] hover:text-white"
                                        )}>
                                            {subtask.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {isAddingSubtask && (
                                <div className="mt-2.5 flex items-center bg-[#0a0a0c] border border-[#2a2a2e] rounded-md px-2 focus-within:border-gray-500 transition-colors">
                                    <Input
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        placeholder="Enter subtask title*"
                                        className="h-[34px] flex-1 bg-transparent border-none text-xs text-white p-0 placeholder:text-gray-500 focus-visible:ring-0 shadow-none focus-visible:ring-offset-0"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setIsAddingSubtask(false)}
                                        className="text-gray-500 hover:text-white ml-2 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
