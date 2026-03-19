import React, { useState } from "react"
import { Plus, X, Loader2 } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Task, TaskStatus, TaskList, createTask } from "@/app/actions/tasks"
import { cn } from "@/lib/utils"
import TaskCard from "@/components/tasks/TaskCard"

interface KanbanColumnProps {
    id: TaskStatus
    title: string
    tasks: Task[]
    list: TaskList
    listId: string
    highlight?: boolean
    showProgress?: boolean
    showBrivio?: boolean
    showMonthlyCount?: boolean
    onTaskCreated: () => void
    onTaskUpdated: () => void
    onOptimisticUpdate?: (task: Task) => void
    onOptimisticCreate?: (task: Task) => void
}

export default function KanbanColumn({
    id,
    title,
    tasks,
    list,
    listId,
    highlight = false,
    showProgress = false,
    showBrivio = false,
    showMonthlyCount = false,
    onTaskCreated,
    onTaskUpdated,
    onOptimisticUpdate,
    onOptimisticCreate,
}: KanbanColumnProps) {
    const [isFocusMode, setIsFocusMode] = useState(false)
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [estimatedTime, setEstimatedTime] = useState("00:00")
    const [isLoading, setIsLoading] = useState(false)

    const activeTasks = tasks.filter(t => !t.completed)
    const completedTasksList = tasks.filter(t => t.completed)

    // Calculate done stats
    const doneTime = completedTasksList.reduce((acc, t) => acc + (t.elapsed_time || 0), 0)

    const { setNodeRef } = useDroppable({
        id: id,
    })

    // Calculate progress
    const completedCount = tasks.filter(t => t.completed).length
    const totalCount = tasks.length
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || isLoading) return

        setIsLoading(true)

        const [hours, mins] = estimatedTime.split(":").map(Number)
        const totalMinutes = (hours || 0) * 60 + (mins || 0)

        // Optimistic Create
        if (onOptimisticCreate) {
            const maxPos = tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) : 0
            const newPosition = maxPos + 1000
            const optimisticTask: Task = {
                id: crypto.randomUUID(),
                title: newTaskTitle.trim(),
                status: id,
                list_id: listId,
                estimated_time: totalMinutes,
                elapsed_time: 0,
                subtasks: [],
                completed: false,
                position: newPosition,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            onOptimisticCreate(optimisticTask)
            // Reset form immediately
            setNewTaskTitle("")
            setEstimatedTime("00:00")
            setIsAddingTask(false)
        }

        const result = await createTask({
            listId,
            title: newTaskTitle.trim(),
            status: id,
            estimatedTime: totalMinutes,
        })

        setIsLoading(false)

        if (result.success) {
            if (!onOptimisticCreate) {
                setNewTaskTitle("")
                setEstimatedTime("00:00")
                setIsAddingTask(false)
            }
            onTaskCreated()
        } else {
            console.error("Task creation error:", result.error)
        }
    }

    const handleCancel = () => {
        setIsAddingTask(false)
        setNewTaskTitle("")
        setEstimatedTime("00:00")
    }

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-[375px] flex-shrink-0 rounded-xl bg-[#12121a] flex flex-col h-[800px] mt-6 transition-all duration-300",
                highlight
                    ? ""
                    : "border-2 border-[#2a2a2e]"
            )}
            style={highlight ? {
                background: 'linear-gradient(#12121a, #12121a) padding-box, linear-gradient(to bottom, #DD005A, #FF002D, #06D6A0, #311C99) border-box',
                border: '2px solid transparent',
            } : undefined}
            onMouseEnter={(e) => {
                if (!highlight) {
                    e.currentTarget.style.background = 'linear-gradient(#12121a, #12121a) padding-box, linear-gradient(to bottom, #DD005A, #FF002D, #06D6A0, #311C99) border-box';
                    e.currentTarget.style.border = '2px solid transparent';
                }
            }}
            onMouseLeave={(e) => {
                if (!highlight) {
                    e.currentTarget.style.background = '#12121a';
                    e.currentTarget.style.border = '2px solid #2a2a2e';
                }
            }}
        >
            {/* Column Header */}
            <div className="p-4">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className={cn(
                        "font-semibold text-base",
                        highlight ? "text-white" : "text-white"
                    )}>
                        {title}
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-white"
                        onClick={() => setIsAddingTask(true)}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Progress Bar - Only if NOT Focus Mode */}
                {!isFocusMode && (showProgress || !showMonthlyCount) && (
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-1 h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500"
                                style={{
                                    width: `${progressPercentage}%`,
                                    background: 'linear-gradient(90deg, #DD005A, #FF002D, #06D6A0, #311C99)'
                                }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {completedCount}/{totalCount} Done
                        </span>
                    </div>
                )}

                {/* Monthly count for Done column */}
                {!isFocusMode && showMonthlyCount && (
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-1 h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500"
                                style={{
                                    width: `${progressPercentage}%`,
                                    background: 'linear-gradient(90deg, #DD005A, #FF002D, #06D6A0, #311C99)'
                                }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {completedCount}/{totalCount} Done
                        </span>
                    </div>
                )}
            </div>

            {/* Tasks List */}
            <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 px-3 py-2 space-y-2 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* For Done column, show all tasks (they're all completed). For others, show only active tasks */}
                    {id === 'done' ? (
                        tasks.length > 0 ? (
                            tasks.map((task, index) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={index + 1}
                                    list={list}
                                    listId={listId}
                                    onUpdate={onTaskUpdated}
                                    onOptimisticUpdate={onOptimisticUpdate}
                                    isFocusMode={isFocusMode}
                                    isFirst={index === 0 && isFocusMode}
                                />
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center min-h-full">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, rgba(221,0,90,0.2), rgba(255,0,45,0.2), rgba(6,214,160,0.2), rgba(49,28,153,0.2))' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#DD005A" />
                                                <stop offset="33%" stopColor="#FF002D" />
                                                <stop offset="66%" stopColor="#06D6A0" />
                                                <stop offset="100%" stopColor="#311C99" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="url(#iconGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="22,4 12,14.01 9,11.01" stroke="url(#iconGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-500">All clear</span>
                            </div>
                        )
                    ) : (
                        activeTasks.length > 0 ? (
                            activeTasks.map((task, index) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={index + 1}
                                    list={list}
                                    listId={listId}
                                    onUpdate={onTaskUpdated}
                                    onOptimisticUpdate={onOptimisticUpdate}
                                    isFocusMode={isFocusMode}
                                    isFirst={index === 0 && isFocusMode}
                                />
                            ))
                        ) : (
                            completedTasksList.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center min-h-full">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, rgba(221,0,90,0.2), rgba(255,0,45,0.2), rgba(6,214,160,0.2), rgba(49,28,153,0.2))' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <defs>
                                                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#DD005A" />
                                                    <stop offset="33%" stopColor="#FF002D" />
                                                    <stop offset="66%" stopColor="#06D6A0" />
                                                    <stop offset="100%" stopColor="#311C99" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="url(#iconGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <polyline points="22,4 12,14.01 9,11.01" stroke="url(#iconGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-500">All clear</span>
                                </div>
                            )
                        )
                    )}

                    {/* Done Section in Focus Mode */}
                    {isFocusMode && completedTasksList.length > 0 && (
                        <div className="mt-4">
                            <div className="h-[1px] bg-[#515151] w-full my-2" />
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-sm text-gray-400 font-medium">{completedTasksList.length} Done</span>
                                <span className="text-sm text-gray-500 font-mono">{Math.floor(doneTime / 60)}h {doneTime % 60}min</span>
                            </div>
                            <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                                {completedTasksList.map((task, index) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        index={index + 1}
                                        list={list}
                                        listId={listId}
                                        onUpdate={onTaskUpdated}
                                        onOptimisticUpdate={onOptimisticUpdate}
                                        isFocusMode={isFocusMode}
                                        isFirst={false} // Completed never first
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SortableContext>

            {/* Inline Add Task Form */}
            {isAddingTask && (
                <div className="px-4 pb-4 border-t border-[#2a2a2e] mt-2 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={handleCancel}
                            className="flex items-center text-xs text-gray-500 hover:text-white"
                        >
                            <X className="w-3 h-3 mr-1" />
                            CANCEL
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 mb-1 block">Title</label>
                                <Input
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Enter task title*"
                                    className="h-8 bg-[#0a0a0c] border-[#2a2a2e] text-white placeholder:text-gray-600 text-xs"
                                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                                    autoFocus
                                />
                            </div>
                            <div className="w-16">
                                <label className="text-[10px] text-gray-500 mb-1 block">Est time</label>
                                <Input
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    placeholder="00:00"
                                    className="h-8 bg-[#0a0a0c] border-[#2a2a2e] text-white text-center text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">Add a new task</span>
                            <Button
                                onClick={handleAddTask}
                                disabled={!newTaskTitle.trim() || isLoading}
                                size="sm"
                                className="h-7 bg-white text-black hover:bg-gray-200 font-medium text-xs px-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    "Confirm"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Button when not adding */}
            {!isAddingTask && (
                <div className="px-4 pb-2 pt-2">
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="flex items-center text-xs text-gray-500 hover:text-white transition-colors"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        ADD TASK
                    </button>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="p-3 mt-auto flex gap-3">
                {!isFocusMode && showBrivio ? (
                    <Button
                        onClick={() => setIsFocusMode(true)}
                        className="w-full h-10 bg-[#1a1a1e] hover:bg-[#2a2a2e] text-gray-400 hover:text-white rounded-lg border border-[#2a2a2e] text-sm font-medium"
                    >
                        Brivio* it
                    </Button>
                ) : isFocusMode ? (
                    <>
                        <Button
                            className="flex-1 h-10 text-white rounded-full font-medium text-sm border-none"
                            style={{
                                background: 'linear-gradient(90deg, #DD005A 0%, #311C99 100%)'
                            }}
                        >
                            Focus mode
                        </Button>
                        <Button
                            onClick={() => setIsFocusMode(false)}
                            className="flex-1 h-10 bg-[#1a1a1e] text-gray-400 hover:text-white rounded-full border border-[#2a2a2e] text-sm font-medium hover:bg-[#2a2a2e]"
                        >
                            Close session
                        </Button>
                    </>
                ) : null}
            </div>
        </div>
    )
}

