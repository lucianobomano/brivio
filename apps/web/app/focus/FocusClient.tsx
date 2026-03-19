"use client"

import * as React from "react"
import {
    Zap,
    MoveUpRight,
    MoreVertical,
    LayoutGrid,
    CheckCircle2
} from "lucide-react"
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
        <div className="px-8 py-12">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-mint flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Modo Foco</h1>
                        <p className="text-text-tertiary text-sm">Selecione um projeto para iniciar o foco</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map((project) => {
                        const pendingTasks = project.tasks?.filter(t => !t.completed) || []
                        const totalTime = pendingTasks.reduce((acc, t) => acc + (t.estimated_time || 0), 0)
                        const displayTasks = pendingTasks.slice(0, 4)

                        return (
                            <Link key={project.id} href={`/focus?projectId=${project.id}`}>
                                <div className="w-full h-[333px] rounded-xl border border-bg-3 bg-bg-1 hover:border-accent-indigo/30 transition-all relative group cursor-pointer flex flex-col shadow-sm">
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
                        <div className="w-full h-[333px] rounded-xl border-2 border-dashed border-bg-3 bg-transparent hover:border-accent-indigo/30 transition-all flex flex-col items-center justify-center cursor-pointer group">
                            <LayoutGrid className="w-8 h-8 text-text-tertiary group-hover:text-accent-indigo mb-3 opacity-30 group-hover:opacity-100 transition-all" />
                            <span className="text-[10px] text-text-tertiary group-hover:text-accent-indigo font-bold tracking-widest uppercase">Gerir Projectos</span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
