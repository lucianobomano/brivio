"use client"

import * as React from "react"
import type { Project } from "./ProjectsClient"
import { MoreHorizontal, ExternalLink, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { motion } from "framer-motion"

interface Task {
    id: string
    title: string
    status: string
    completed: boolean
    cover_url?: string
    priority?: string
    description?: string
}

interface ProjectGalleryViewProps {
    projects: Project[]
    tasks?: Task[]
    isTaskMode?: boolean
    onViewProject?: (project: Project) => void
    onViewTask?: (task: Task) => void
    onOpenDetails?: (project: Project) => void
}

export function ProjectGalleryView({ projects, tasks = [], isTaskMode = false, onViewProject, onViewTask, onOpenDetails }: ProjectGalleryViewProps) {
    const items = isTaskMode ? tasks : projects

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {items.map((item, index) => {
                const isTask = isTaskMode
                const project = !isTask ? (item as Project) : null
                const task = isTask ? (item as Task) : null

                const id = isTask ? task!.id : project!.id
                const title = isTask ? task!.title : project!.name
                const fallbackImage = isTask ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" : null
                const cover = isTask ? (task!.cover_url || fallbackImage) : project!.cover_url
                const priority = isTask ? task!.priority : project!.priority
                const brand = !isTask ? project!.brand : null

                return (
                    <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative aspect-[4/5] rounded-[12px] overflow-hidden bg-bg-2 border border-bg-3 hover:border-accent-indigo/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-accent-indigo/20"
                    >
                        {/* Cover Image */}
                        <div
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => isTask ? onViewTask?.(task!) : onViewProject?.(project!)}
                        >
                            {cover ? (
                                <Image
                                    src={cover}
                                    alt={title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-bg-2 to-bg-3 flex items-center justify-center">
                                    <span className="text-4xl font-black text-accent-indigo/20">{title.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                        {/* Top Content */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                            <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-full px-3 py-1">
                                {priority || "Medium"}
                            </Badge>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-black transition-colors">
                                    <Heart className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Bottom Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            {!isTask && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full border-2 border-white/30 overflow-hidden shadow-lg shrink-0 bg-bg-1">
                                        {brand?.logo_url ? (
                                            <Image src={brand.logo_url} alt="" width={32} height={32} className="object-contain" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-text-primary">
                                                {brand?.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest truncate">
                                        {brand?.name || "Independent"}
                                    </span>
                                </div>
                            )}

                            {isTask && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] border-white/20 text-white uppercase tracking-tighter">
                                            {task?.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    {task?.description && (
                                        <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            <h3
                                className="text-xl font-bold text-white leading-tight mb-2 truncate cursor-pointer hover:text-accent-indigo transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isTask) onOpenDetails?.(project!);
                                }}
                            >
                                {title}
                            </h3>

                            <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                <Button size="sm" className="bg-white text-black hover:bg-accent-indigo hover:text-white rounded-full flex-1 mr-2 px-4 shadow-xl font-bold h-9">
                                    {isTask ? 'Ver Tarefa' : 'Ver Projeto'}
                                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-black">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
