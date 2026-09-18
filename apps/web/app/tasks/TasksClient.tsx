"use client"

import React, { useState, useEffect } from "react"
import {
    Plus,
    CheckCircle2,
    MoreVertical,
    MoveUpRight,
    FolderKanban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateProjectModal } from "@/components/tasks/CreateProjectModal"
import { ProjectCardItem, getUserProjectsWithTasks } from "@/app/actions/tasks"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StandupHeader } from "@/components/standups/StandupHeader"

interface TasksClientPageProps {
    user: { id: string; name: string }
    initialProjects?: ProjectCardItem[]
}

// Format minutes to HH:MM (e.g. 90 -> 01:30)
function formatTime(minutes: number) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Format total duration (e.g. 90 -> 1hr 30min)
function formatTotalDuration(minutes: number) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs === 0) return `${mins}min`
    if (mins === 0) return `${hrs}hr`
    return `${hrs}hr ${mins}min`
}

export default function TasksClientPage({ user, initialProjects }: TasksClientPageProps) {
    const router = useRouter()
    const [projects, setProjects] = useState<ProjectCardItem[]>(initialProjects || [])
    const [currentUser, setCurrentUser] = useState(user)

    useEffect(() => {
        if (!user || !user.id) {
            import("@/lib/supabase/client").then(({ createClient }) => {
                const supabase = createClient()
                supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
                    if (sbUser) {
                        setCurrentUser({
                            id: sbUser.id,
                            name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Creator'
                        })
                    }
                })
            })
        }
    }, [user])

    useEffect(() => {
        if (currentUser?.id && (!initialProjects || initialProjects.length === 0)) {
            getUserProjectsWithTasks(currentUser.id).then((data) => {
                setProjects(data)
            })
        } else if (initialProjects) {
            setProjects(initialProjects)
        }
    }, [initialProjects, currentUser])

    const handleProjectCreated = () => {
        router.refresh()
        if (currentUser?.id) {
            getUserProjectsWithTasks(currentUser.id).then((data) => {
                setProjects(data)
            })
        }
    }

    return (
        <div className="bg-bg-0 text-text-primary min-h-full flex-1 flex flex-col font-sans">
            {/* Header */}
            <StandupHeader />

            {/* Content */}
            <div className="px-8 py-10 flex-1">
                <div className="max-w-[1520px] mx-auto">
                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Project Cards */}
                        {projects.map((project) => {
                            // Filter pending tasks
                            const pendingTasks = project.tasks?.filter(t => !t.completed) || []
                            const totalTime = pendingTasks.reduce((acc, t) => acc + (t.estimated_time || 0), 0)
                            const displayTasks = pendingTasks.slice(0, 4) // Show top 4

                            return (
                                <Link key={project.id} href={`/tasks/${project.id}`}>
                                    <div className="w-full h-[333px] rounded-2xl border border-zinc-200/80 dark:border-[#2a2a2e] bg-white dark:bg-[#12121a] hover:border-zinc-300 dark:hover:border-[#3a3a3e] hover:shadow-md dark:hover:shadow-2xl transition-all shadow-sm relative group cursor-pointer flex flex-col overflow-hidden">
                                        {/* Header */}
                                        <div className="flex items-center justify-between p-5 pb-3">
                                            <div className="flex items-center space-x-2.5 min-w-0">
                                                {project.brand?.logo_url ? (
                                                    <img
                                                        src={project.brand.logo_url}
                                                        alt={project.name}
                                                        className="w-7 h-7 rounded-lg object-cover shadow-xs shrink-0 border border-zinc-200/60 dark:border-white/10"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                                                        style={project.color.includes('gradient')
                                                            ? { background: project.color }
                                                            : { backgroundColor: project.color }
                                                        }
                                                    >
                                                        {project.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                                        {project.name}
                                                    </div>
                                                    {project.brand?.name && (
                                                        <div className="text-[10px] text-zinc-400 dark:text-gray-500 truncate leading-tight">
                                                            {project.brand.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 dark:text-gray-400 dark:hover:text-white transition-opacity shrink-0"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    router.push(`/projects/${project.id}`)
                                                }}
                                                title="Ver detalhes do projeto"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Tasks List or Empty State */}
                                        <div className="flex-1 px-4 py-2 overflow-hidden relative flex flex-col justify-center">
                                            {pendingTasks.length > 0 ? (
                                                <div className="space-y-2.5 w-full">
                                                    {displayTasks.map((task, idx) => (
                                                        <div
                                                            key={task.id}
                                                            className="bg-zinc-50 dark:bg-[#1a1a22] border border-zinc-100/80 dark:border-[#2A2A35]/50 rounded-xl p-3 flex justify-between items-center group-hover:opacity-40 transition-opacity"
                                                        >
                                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                                <span className="text-zinc-400 dark:text-zinc-500 text-xs w-3 font-mono shrink-0">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                                                    {task.title}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono shrink-0 ml-2">
                                                                {formatTime(task.estimated_time || 0)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full group-hover:opacity-20 transition-opacity">
                                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-200 dark:border-[#2a2a2e] flex items-center justify-center mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#ff0054] flex items-center justify-center shadow-xs">
                                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-zinc-400 dark:text-zinc-400 font-medium tracking-wide">
                                                        ALL CLEAR
                                                    </span>
                                                </div>
                                            )}

                                            {/* Open Button Overlay (Center) */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-y-2 group-hover:translate-y-0">
                                                <div className="px-6 py-2.5 rounded-full bg-[#ff0054] text-white text-sm font-semibold flex items-center shadow-lg shadow-[#ff0054]/25">
                                                    <MoveUpRight className="w-4 h-4 mr-2" />
                                                    Open
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="p-5 pt-3 flex items-center justify-between border-t border-zinc-100 dark:border-white/[0.04]">
                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                                {pendingTasks.length} pending {pendingTasks.length === 1 ? 'task' : 'tasks'}
                                            </span>
                                            {pendingTasks.length > 0 && (
                                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium font-mono">
                                                    Est: {formatTotalDuration(totalTime)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}

                        {/* Create Project Card */}
                        <CreateProjectModal userId={currentUser?.id || user.id} onProjectCreated={handleProjectCreated}>
                            <div className="w-full h-[333px] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-[#2a2a2e] bg-zinc-50/50 dark:bg-transparent hover:border-zinc-400 dark:hover:border-[#3a3a3e] hover:bg-zinc-100/60 dark:hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center cursor-pointer group shadow-2xs">
                                <Plus className="w-8 h-8 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200 mb-3 transition-colors" />
                                <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200 tracking-wider transition-colors">
                                    CREATE PROJECT
                                </span>
                            </div>
                        </CreateProjectModal>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Get current hour for subtitle
const hour = new Date().getHours()
