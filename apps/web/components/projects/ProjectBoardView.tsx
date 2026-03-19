"use client"

import * as React from "react"
import type { Project, Stage } from "./ProjectsClient"
import {
    Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectCard } from "./ProjectCard"
import { TaskCard } from "./TaskCard"
import { toggleRoadmapTask, updateBatchTaskPositions } from "@/app/actions/roadmap"
import { updateBatchProjectPositions, fixProjectSchema } from "@/app/actions/project-order"
import { toast } from "sonner"
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
} from "@dnd-kit/core"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { RoadmapStage } from "@/app/actions/roadmap"

interface ProjectBoardViewProps {
    projects: Project[]
    stages: Stage[] | RoadmapStage[]
    onRefresh: () => Promise<void>
    onAddProject: (stageId?: string) => void
    onViewProject?: (project: Project) => void
    isTaskMode?: boolean
    projectId?: string
    groupingField?: 'stage_id' | 'category'
    onGroupingFieldChange?: (field: 'stage_id' | 'category') => void
    onOpenDetails?: (project: Project) => void
    onViewTask?: (task: RoadmapStage['tasks'][0]) => void
    onEdit?: (project: Project) => void
}

export function ProjectBoardView({
    projects,
    stages,
    onRefresh,
    onAddProject,
    onViewProject,
    isTaskMode = false,
    projectId,
    groupingField = 'stage_id',
    onOpenDetails,
    onViewTask,
    onEdit
}: ProjectBoardViewProps) {
    const [localProjects, setLocalProjects] = React.useState<Project[]>(projects)
    const [localRoadmap, setLocalRoadmap] = React.useState<RoadmapStage[]>(isTaskMode ? stages as RoadmapStage[] : [])
    const [activeId, setActiveId] = React.useState<string | null>(null)
    const [activeProject, setActiveProject] = React.useState<Project | null>(null)
    const [activeTask, setActiveTask] = React.useState<RoadmapStage['tasks'][0] | null>(null)
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)

    // Sync local projects/stages with props
    React.useEffect(() => {
        setLocalProjects(projects)
    }, [projects])

    React.useEffect(() => {
        if (isTaskMode) setLocalRoadmap(stages as RoadmapStage[])
    }, [stages, isTaskMode])

    // Ensure schema exists
    React.useEffect(() => {
        fixProjectSchema()
    }, [])

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Tolerance to allow panning without immediate drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Horizontal Scrolling Logic
    React.useEffect(() => {
        const el = scrollContainerRef.current
        if (!el) return

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault()
                el.scrollLeft += e.deltaY + e.deltaX
            }
        }

        el.addEventListener('wheel', handleWheel, { passive: false })
        return () => el.removeEventListener('wheel', handleWheel)
    }, [])

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id as string)

        if (isTaskMode) {
            let foundTask: RoadmapStage['tasks'][0] | null = null
            localRoadmap.forEach((s) => {
                const task = s.tasks.find(t => t.id === active.id)
                if (task) foundTask = task
            })
            if (foundTask) setActiveTask(foundTask)
        } else {
            const project = localProjects.find(p => p.id === active.id)
            if (project) setActiveProject(project)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        if (activeId === overId) return

        if (isTaskMode) {
            const activeStage = localRoadmap.find(s => s.tasks.some(t => t.id === activeId))
            const overColumn = localRoadmap.find(s => s.id === overId)
            const overStage = overColumn || localRoadmap.find(s => s.tasks.some(t => t.id === overId))

            if (!activeStage || !overStage) return

            if (activeStage.id !== overStage.id) {
                setLocalRoadmap(prev => {
                    const activeTaskItem = activeStage.tasks.find(t => t.id === activeId)
                    if (!activeTaskItem) return prev

                    return prev.map(stage => {
                        if (stage.id === activeStage.id) {
                            return { ...stage, tasks: stage.tasks.filter(t => t.id !== activeId) }
                        }
                        if (stage.id === overStage.id) {
                            const overIndex = stage.tasks.findIndex(t => t.id === overId)
                            const newIndex = overIndex === -1 ? stage.tasks.length : overIndex
                            const newTask = { ...activeTaskItem, status: stage.id } as RoadmapStage['tasks'][0]
                            const newTasks = [...stage.tasks]
                            newTasks.splice(newIndex, 0, newTask)
                            return { ...stage, tasks: newTasks }
                        }
                        return stage
                    })
                })
            } else {
                // Intra-column reordering
                setLocalRoadmap(prev => {
                    const currentStage = prev.find(s => s.id === activeStage.id)
                    if (!currentStage) return prev

                    const oldIndex = currentStage.tasks.findIndex(t => t.id === activeId)
                    const newIndex = currentStage.tasks.findIndex(t => t.id === overId)

                    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                        return prev.map(stage => {
                            if (stage.id === activeStage.id) {
                                return { ...stage, tasks: arrayMove(stage.tasks, oldIndex, newIndex) }
                            }
                            return stage
                        })
                    }
                    return prev
                })
            }
            return
        }

        // Project logic
        const activeProjectItem = localProjects.find(p => p.id === activeId)
        if (!activeProjectItem) return

        const isOverAColumn = stages.some(s => s.id === overId)
        const overProject = localProjects.find(p => p.id === overId)
        const nextStageId = isOverAColumn ? overId : (overProject ? (overProject[groupingField] || overProject.status || "") : "")

        if (nextStageId && nextStageId !== (activeProjectItem[groupingField] || activeProjectItem.status)) {
            setLocalProjects(prev => {
                const activeIndex = prev.findIndex(p => p.id === activeId)
                const overIndex = prev.findIndex(p => p.id === overId)
                const newIndex = isOverAColumn ? prev.length : overIndex

                const newProjects = prev.map(p => p.id === activeId ? { ...p, [groupingField]: nextStageId } : p)
                return arrayMove(newProjects, activeIndex, newIndex)
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        setActiveProject(null)
        setActiveTask(null)

        if (!over) return

        if (isTaskMode && projectId) {
            // All reordering and container movement is already done in handleDragOver
            // We just need to persist the final state.
            const updates: { id: string, position: number, stageId: string }[] = []
            localRoadmap.forEach((stage) => {
                stage.tasks.forEach((task, idx) => {
                    updates.push({
                        id: task.id,
                        position: idx * 1000,
                        stageId: stage.id
                    })
                })
            })

            const res = await updateBatchTaskPositions(updates, projectId)
            if (res.success) {
                onRefresh()
            } else {
                toast.error(res.error || "Erro ao salvar alterações")
                onRefresh()
            }
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        const activeIndex = localProjects.findIndex((p) => p.id === activeId)
        const overIndex = localProjects.findIndex((p) => p.id === overId)

        if (activeIndex !== overIndex) {
            const newProjects = arrayMove(localProjects, activeIndex, overIndex)
            setLocalProjects(newProjects)

            const updates = newProjects.map((p, idx) => ({
                id: p.id,
                position: idx * 1000,
                stageId: p[groupingField] || p.status || ""
            }))

            const result = await updateBatchProjectPositions(updates)
            if (result.success) {
                onRefresh()
            } else {
                toast.error(result.error || "Erro ao reordenar projetos")
                onRefresh()
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
            <div
                ref={scrollContainerRef}
                className="flex gap-6 h-full overflow-x-auto pb-6 scrollbar-hide items-start"
            >
                <style jsx global>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>

                {isTaskMode ? localRoadmap.map((stage) => (
                    <BoardColumn
                        key={stage.id}
                        stage={stage}
                        items={stage.tasks}
                        onAddProject={onAddProject}
                        onViewProject={onViewProject}
                        onOpenDetails={onOpenDetails}
                        isDraggingOver={activeId !== null}
                        isTaskMode={true}
                        onToggleTask={async (taskId: string) => {
                            if (projectId) {
                                await toggleRoadmapTask(taskId, projectId)
                                onRefresh()
                            }
                        }}
                        onViewTask={onViewTask}
                    />
                )) : stages.map((stage) => {
                    const displayItems = projects.filter(p => (p[groupingField] === (stage as Stage).id) || (p.status === (stage as Stage).id))
                    return (
                        <BoardColumn
                            key={stage.id}
                            stage={stage as Stage}
                            items={displayItems}
                            onAddProject={onAddProject}
                            onViewProject={onViewProject}
                            onOpenDetails={onOpenDetails}
                            isDraggingOver={activeId !== null}
                            isTaskMode={false}
                            onEdit={onEdit}
                        />
                    )
                })}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: "0.5",
                        },
                    },
                }),
            }}>
                {activeId && activeProject && !isTaskMode ? (
                    <ProjectCard project={activeProject} isOverlay />
                ) : activeId && isTaskMode ? (
                    <div className="opacity-80 scale-105">
                        <TaskCard
                            task={activeTask!}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

interface BoardColumnProps {
    stage: Stage | RoadmapStage
    items: (Project | RoadmapStage['tasks'][0])[]
    onAddProject?: (stageId?: string) => void
    onViewProject?: (project: Project) => void
    isDraggingOver: boolean
    isTaskMode?: boolean
    onToggleTask?: (taskId: string) => void
    onOpenDetails?: (project: Project) => void
    onViewTask?: (task: RoadmapStage['tasks'][0]) => void
    onEdit?: (project: Project) => void
}

function BoardColumn({ stage, items, onAddProject, onViewProject, onOpenDetails, isDraggingOver, isTaskMode, onToggleTask, onViewTask, onEdit }: BoardColumnProps) {
    const { setNodeRef } = useSortable({
        id: stage.id,
        data: {
            type: "Column",
            stage,
        },
    })

    return (
        <div
            ref={setNodeRef}
            className="min-w-[330px] w-[330px] flex flex-col min-h-[680px] h-fit bg-bg-1/30 rounded-xl border border-bg-3/50 dark:border-bg-3 overflow-hidden shadow-inner"
        >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between border-b border-bg-3/30 dark:border-bg-3 bg-bg-1/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary">
                        {stage.name}
                    </h3>
                    <Badge variant="outline" className="ml-2 bg-bg-2 border-bg-3 text-[10px] py-0 h-5 px-1.5 min-w-[20px] justify-center">
                        {items.length}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-text-tertiary"
                    onClick={() => onAddProject?.(stage.id)}
                >
                    <Plus className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
                <SortableContext
                    id={stage.id}
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((item) => (
                        isTaskMode ? (
                            <SortableTaskCard
                                key={item.id}
                                task={item as RoadmapStage['tasks'][0]}
                                onToggleComplete={onToggleTask}
                                onViewTask={onViewTask}
                            />
                        ) : (
                            <SortableProjectCard
                                key={item.id}
                                project={item as Project}
                                onViewProject={onViewProject}
                                onOpenDetails={onOpenDetails}
                                onEdit={onEdit}
                            />
                        )
                    ))}

                    {items.length === 0 && !isDraggingOver && (
                        <div className="h-32 flex flex-col items-center justify-center border border-dashed border-bg-3/50 dark:border-bg-3 rounded-xl opacity-30">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#97A1B3]">
                                {isTaskMode ? "No Tasks" : "No Projects"}
                            </span>
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    )
}

interface SortableProjectCardProps {
    project: Project
    isOverlay?: boolean
    onViewProject?: (project: Project) => void
    onOpenDetails?: (project: Project) => void
    onEdit?: (project: Project) => void
}

function SortableProjectCard({ project, isOverlay, onViewProject, onOpenDetails, onEdit }: SortableProjectCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: project.id,
        data: {
            type: "Project",
            project,
        },
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-full rounded-xl border-2 border-dashed border-accent-indigo/20 bg-bg-1/50 min-h-[290px]"
            />
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
        >
            <ProjectCard
                project={project}
                isOverlay={isOverlay}
                onViewProject={onViewProject}
                onOpenDetails={onOpenDetails}
                onEdit={onEdit}
            />
        </div>
    )
}

interface SortableTaskCardProps {
    task: RoadmapStage['tasks'][0]
    onToggleComplete?: (taskId: string) => void
    onViewTask?: (task: RoadmapStage['tasks'][0]) => void
}

function SortableTaskCard({ task, onToggleComplete, onViewTask }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-full rounded-xl border-2 border-dashed border-accent-indigo/20 bg-bg-1/50 min-h-[290px]"
            />
        )
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <TaskCard
                task={task}
                onToggleComplete={onToggleComplete}
                onViewTask={() => onViewTask?.(task)}
            />
        </div>
    )
}
