"use client"

import * as React from "react"
import {
    Zap,
    MoveUpRight,
    MoreVertical,
    LayoutGrid,
    CheckCircle2,
    ArrowLeft,
    ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { FocusBoardView } from "./FocusBoardView"
import { RoadmapStage } from "@/app/actions/roadmap"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProjectBase {
    id: string
    name: string
    workspace_id?: string
    brand?: {
        name: string
        logo_url?: string
    }
    progress?: number
    tasks_count?: number
    color?: string
    tasks?: any[]
}

interface FocusClientProps {
    projects: ProjectBase[]
    initialRoadmap: RoadmapStage[]
    selectedProject: ProjectBase | null
}

function formatDuration(minutes: number) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs === 0) return `${mins}m`
    return `${hrs}h ${mins}m`
}

export function FocusClient({
    projects,
    initialRoadmap,
    selectedProject
}: FocusClientProps) {
    const roadmap = React.useMemo(() => initialRoadmap, [initialRoadmap])
    const router = useRouter()

    // Custom cursor and auto-scroll state
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const [cursorPosition, setCursorPosition] = React.useState<{ x: number; y: number } | null>(null)
    const [scrollDirection, setScrollDirection] = React.useState<'left' | 'right' | null>(null)
    const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

    // Handle mouse move for custom cursor and auto-scroll
    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = scrollContainerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const x = e.clientX
        const edgeThreshold = 150 // pixels from edge to trigger scroll

        setCursorPosition({ x: e.clientX, y: e.clientY })

        if (x < rect.left + edgeThreshold) {
            setScrollDirection('left')
        } else if (x > rect.right - edgeThreshold) {
            setScrollDirection('right')
        } else {
            setScrollDirection(null)
        }
    }, [])

    // Auto-scroll effect
    React.useEffect(() => {
        if (scrollDirection && scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const scrollSpeed = 8

            scrollIntervalRef.current = setInterval(() => {
                if (scrollDirection === 'left') {
                    container.scrollLeft -= scrollSpeed
                } else {
                    container.scrollLeft += scrollSpeed
                }
            }, 16)
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current)
            }
        }
    }, [scrollDirection])

    // IF PROJECT IS SELECTED, SHOW FOCUS MODE (BOARD VIEW)
    if (selectedProject) {
        return (
            <FocusBoardView
                project={selectedProject}
                stages={roadmap}
                onBack={() => router.push('/focus')}
            />
        )
    }

    // GALLERY VIEW (DEFAULT IF NO PROJECT SELECTED)
    return (
        <div className="py-12">
            <div>
                <div className="flex items-center gap-4 mb-12 px-[180px]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-mint flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Modo Foco</h1>
                        <p className="text-text-tertiary text-sm">Selecione um projeto para iniciar o foco</p>
                    </div>
                </div>

                <div 
                    className="relative overflow-x-hidden min-h-[500px]"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setScrollDirection(null)}
                    style={{ cursor: cursorPosition ? 'none' : 'default' }}
                >
                    <div 
                        ref={scrollContainerRef}
                        className="flex items-center gap-[40px] px-[180px] min-w-max pb-20 pt-10"
                        style={{
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}
                    >
                        {projects.map((project) => {
                        const pendingTasks = project.tasks?.filter(t => !t.completed) || []
                        const totalTime = pendingTasks.reduce((acc, t) => acc + (t.estimated_time || 0), 0)
                        const displayTasks = pendingTasks.slice(0, 4)

                        return (
                            <Link key={project.id} href={`/focus?projectId=${project.id}`}>
                                <div className="w-[350px] h-[333px] rounded-xl border border-bg-3 bg-bg-1 hover:border-accent-indigo/30 transition-all relative group cursor-pointer flex flex-col shadow-sm">
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-4 pb-2">
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                                                style={{ backgroundColor: project.color || '#6366f1' }}
                                            >
                                                {project.brand?.logo_url ? (
                                                    <img src={project.brand.logo_url} className="w-4 h-4 rounded-sm object-contain" />
                                                ) : (
                                                    project.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-text-primary truncate max-w-[180px]">
                                                {project.name}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-text-tertiary">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Tasks Preview */}
                                    <div className="flex-1 p-3 overflow-hidden relative">
                                        {pendingTasks.length > 0 ? (
                                            <div className="space-y-2">
                                                {displayTasks.map((task, idx) => (
                                                    <div key={task.id} className="bg-bg-0 border border-bg-3/50 rounded-lg p-2.5 flex justify-between items-center group-hover:opacity-40 transition-opacity">
                                                        <div className="flex items-center space-x-3 overflow-hidden">
                                                            <span className="text-text-tertiary text-[10px] w-3 font-mono">{idx + 1}</span>
                                                            <span className="text-[12px] text-text-secondary truncate font-medium">{task.title}</span>
                                                        </div>
                                                        <span className="text-[10px] text-text-tertiary font-mono">
                                                            {task.estimated_time ? `${task.estimated_time}m` : '--'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full group-hover:opacity-20 transition-opacity opacity-40">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-bg-3 flex items-center justify-center mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-text-tertiary font-bold tracking-widest uppercase">Livre de Tarefas</span>
                                            </div>
                                        )}

                                        {/* Overlay Open Button */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-y-2 group-hover:translate-y-0">
                                            <div className="px-6 py-2.5 rounded-full bg-accent-indigo text-white text-sm font-bold flex items-center shadow-xl shadow-accent-indigo/20">
                                                <MoveUpRight className="w-4 h-4 mr-2" />
                                                Iniciar Foco
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 pt-2 flex items-center justify-between border-t border-bg-3/30">
                                        <span className="text-[11px] text-text-tertiary font-bold">
                                            {pendingTasks.length} {pendingTasks.length === 1 ? 'pendente' : 'pendentes'}
                                        </span>
                                        {totalTime > 0 && (
                                            <span className="text-[11px] text-text-tertiary font-bold">
                                                Est: {formatDuration(totalTime)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}

                    <Link href="/projects">
                        <div className="w-[350px] h-[333px] rounded-xl border-2 border-dashed border-bg-3 bg-transparent hover:border-accent-indigo/30 transition-all flex flex-col items-center justify-center cursor-pointer group">
                            <LayoutGrid className="w-8 h-8 text-text-tertiary group-hover:text-accent-indigo mb-3 opacity-30 group-hover:opacity-100 transition-all" />
                            <span className="text-[10px] text-text-tertiary group-hover:text-accent-indigo font-bold tracking-widest uppercase">Gerir Projectos</span>
                        </div>
                    </Link>
                </div>

                {/* Custom Cursor for Horizontal Scroll */}
                <AnimatePresence>
                    {cursorPosition && scrollDirection && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                left: cursorPosition.x,
                                top: cursorPosition.y,
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                                zIndex: 9999
                            }}
                            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl"
                        >
                            {scrollDirection === 'left' ? (
                                <ArrowLeft className="w-5 h-5 text-white" />
                            ) : (
                                <ArrowRight className="w-5 h-5 text-white" />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
    )
}
