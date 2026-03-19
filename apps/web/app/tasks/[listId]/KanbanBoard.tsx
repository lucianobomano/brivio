"use client"

import React, { useState, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import {
    ChevronLeft,
    Search,
    Settings,
    Grid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskList, Task, TaskStatus, updateTaskPosition } from "@/app/actions/tasks"
import Link from "next/link"
import { useRouter } from "next/navigation"
import KanbanColumn from "@/components/tasks/KanbanColumn"
import TaskCard from "@/components/tasks/TaskCard"

interface KanbanBoardProps {
    list: TaskList
    initialTasks: Task[]
    userId: string
}

const columns: { id: TaskStatus; title: string; highlight?: boolean; showProgress?: boolean; showBrivio?: boolean; showMonthlyCount?: boolean }[] = [
    { id: "backlog", title: "Backlog" },
    { id: "this_week", title: "This Week", showProgress: true },
    { id: "today", title: "Today", highlight: true, showProgress: true, showBrivio: true },
    { id: "done", title: "Done", showMonthlyCount: true },
]

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
}

export default function KanbanBoard({ list, initialTasks }: KanbanBoardProps) {
    const router = useRouter()
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeTask, setActiveTask] = useState<Task | null>(null)

    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires 5px movement to start drag, allowing clicks on inputs
            },
        })
    )

    const getTasksByStatus = (status: TaskStatus) => {
        return tasks.filter(task => task.status === status).sort((a, b) => a.position - b.position)
    }

    const findTask = (id: string) => tasks.find((t) => t.id === id)

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const task = findTask(active.id as string)
        if (task) setActiveTask(task)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const activeTask = findTask(activeId as string)
        const overTask = findTask(overId as string)

        if (!activeTask) return

        // Dropping over a column (empty or not)
        const isOverColumn = columns.some(col => col.id === overId)

        if (isOverColumn) {
            const overColumnStatus = overId as TaskStatus
            if (activeTask.status !== overColumnStatus) {
                setTasks((prev) => {
                    return prev.map((t) => {
                        if (t.id === activeId) {
                            return { ...t, status: overColumnStatus }
                        }
                        return t
                    })
                })
            }
            return
        }

        // Dropping over another task
        if (overTask && activeTask.status !== overTask.status) {
            setTasks((prev) => {
                return prev.map((t) => {
                    if (t.id === activeId) {
                        return { ...t, status: overTask.status }
                    }
                    return t
                })
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        const activeId = active.id

        // Reset active task
        setActiveTask(null)

        if (!over) return

        const overId = over.id
        const activeTask = findTask(activeId as string)
        if (!activeTask) return

        const isOverColumn = columns.some(col => col.id === overId)

        // Calculate new position and state
        let newTasks = [...tasks]

        // If dropped over a column (append to end or start?) - usually handled by DragOver changing status
        // But for sorting logic:

        if (isOverColumn) {
            // Already handled status in DragOver? Yes.
            // Just ensure it's in the list.
            // When dropping on column, maybe put it at the end? 
            // Current DragOver sets status. Position remains same (sort by pos).
            // We might want to re-sort.
        } else {
            // Dropped over a task
            const overTask = findTask(overId as string)
            if (overTask) {
                const activeIndex = tasks.findIndex(t => t.id === activeId)
                const overIndex = tasks.findIndex(t => t.id === overId)

                if (activeIndex !== overIndex) {
                    newTasks = arrayMove(tasks, activeIndex, overIndex)
                    setTasks(newTasks)
                }
            }
        }

        // Persist change
        // We need to calculate the NEW position based on neighbors
        // Filter tasks by the final status
        const finalStatus = activeTask.status // Might have been updated by DragOver?
        // Wait, activeTask is stale from closure? No, `tasks` state updated in DragOver. 
        // But `activeTask` var here comes from `findTask` which reads `tasks` from closure?
        // Actually `tasks` in `handleDragEnd` closure is the one from render.
        // `setTasks` in DragOver causes re-render. `handleDragEnd` will be called with NEW state? 
        // No, event handlers capture scope. Dnd-kit keeps stable references?

        // Let's rely on finding task in THIS scope's `tasks`.
        const currentTasks = tasks // Check if this is stale. 
        // Actually, dnd-kit `onDragEnd` might run after state update? 
        // Better to find updated task in `newTasks` (calculated above).

        const updatedActiveTask = newTasks.find(t => t.id === activeId)
        if (!updatedActiveTask) return

        // Get all tasks in target column, sorted by index in `newTasks`
        const targetColumnTasks = newTasks.filter(t => t.status === updatedActiveTask.status)

        // Find index of active task in this column subset
        const indexInColumn = targetColumnTasks.findIndex(t => t.id === activeId)

        // Calculate new 'position' float
        let newPos = 0
        const prevTask = targetColumnTasks[indexInColumn - 1]
        const nextTask = targetColumnTasks[indexInColumn + 1]

        if (!prevTask && !nextTask) {
            newPos = 1000
        } else if (!prevTask) {
            newPos = nextTask.position / 2
        } else if (!nextTask) {
            newPos = prevTask.position + 1000
        } else {
            newPos = (prevTask.position + nextTask.position) / 2
        }

        // Optimistic update of position
        const finalOptimisticTasks = newTasks.map(t =>
            t.id === activeId ? { ...t, position: newPos } : t
        )
        setTasks(finalOptimisticTasks)

        // Server update
        await updateTaskPosition(
            activeId as string,
            updatedActiveTask.status,
            newPos,
            list.id
        )

        router.refresh()
    }

    const handleTaskCreated = () => {
        router.refresh()
    }

    const handleTaskUpdated = () => {
        router.refresh()
    }

    const handleOptimisticUpdate = (updatedTask: Task) => {
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
    }

    const handleOptimisticCreate = (newTask: Task) => {
        setTasks((prev) => [...prev, newTask])
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="bg-[#0a0a0c] text-white min-h-screen font-sans flex flex-col">
                {/* Header */}
                <header className="h-14 flex items-center justify-between px-6 bg-[#0a0a0c] sticky top-0 z-10">
                    {/* Left side */}
                    <div className="flex items-center space-x-4">
                        <Link href="/tasks">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-[#1a1a1e] h-8 px-2">
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Voltar
                            </Button>
                        </Link>

                        <div className="flex items-center space-x-2">
                            <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                style={list.color.includes('gradient')
                                    ? { background: list.color }
                                    : { backgroundColor: list.color }
                                }
                            >
                                {list.title.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{list.title}</span>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-3">
                        {/* Report button with gradient border */}
                        <div className="p-[1px] rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                            <Button
                                variant="ghost"
                                className="h-8 bg-[#0a0a0c] text-white hover:bg-[#1a1a1e] rounded-full px-4 text-sm font-medium"
                            >
                                Report
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1e] h-8 w-8">
                            <Search className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1e] h-8 w-8">
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1e] h-8 w-8">
                            <Grid className="w-4 h-4" />
                        </Button>
                        <Avatar className="w-7 h-7 border border-[#2a2a2e]">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto p-6 flex justify-center">
                    <div className="flex space-x-4 h-full">
                        {columns.map((column) => {
                            const columnTasks = getTasksByStatus(column.id)

                            return (
                                <KanbanColumn
                                    key={column.id}
                                    id={column.id}
                                    title={column.title}
                                    tasks={columnTasks}
                                    list={list}
                                    listId={list.id}
                                    highlight={column.highlight}
                                    showProgress={column.showProgress}
                                    showBrivio={column.showBrivio}
                                    showMonthlyCount={column.showMonthlyCount}
                                    onTaskCreated={handleTaskCreated}
                                    onTaskUpdated={handleTaskUpdated}
                                    onOptimisticUpdate={handleOptimisticUpdate}
                                    onOptimisticCreate={handleOptimisticCreate}
                                />
                            )
                        })}
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <div className="rotate-2 cursor-grabbing w-[300px]">
                            <TaskCard
                                task={activeTask}
                                index={0} // Index doesn't matter for overlay
                                list={list}
                                listId={list.id}
                                onUpdate={() => { }}
                                isOverlay
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    )
}
