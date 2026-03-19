"use client"

import * as React from "react"
import { CheckCircle2, Circle, Clock, Calendar, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface TaskCardProps {
    task: {
        id: string
        title: string
        status: string
        completed: boolean
        priority?: string
        cover_url?: string
        description?: string
        estimated_time?: number
        start_date?: string
        due_date?: string
        assignee?: {
            id: string
            name: string
            avatar_url?: string
        }
    }
    onToggleComplete?: (taskId: string) => void
    onViewTask?: (taskId: string) => void
    className?: string
}

export function TaskCard({ task, onToggleComplete, onViewTask, className }: TaskCardProps) {
    const fallbackImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"

    const formatDuration = (mins?: number) => {
        if (!mins) return "0h"
        const hours = Math.floor(mins / 60)
        const days = Math.floor(hours / 8)
        if (days >= 1) return `${days}d`
        return `${hours}h`
    }

    return (
        <div
            className={cn(
                "group bg-bg-1 border border-bg-3 dark:border-bg-3 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-accent-indigo/30 transition-all duration-500 cursor-pointer flex flex-col",
                className
            )}
            style={{ width: "100%", maxWidth: "294px", minHeight: "290px" }}
            onClick={() => onViewTask?.(task.id)}
        >
            {/* Cover Image Container */}
            <div className="relative w-full h-[140px] bg-bg-2 overflow-hidden shrink-0">
                <Image
                    src={task.cover_url || fallbackImage}
                    alt={task.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-1/80 to-transparent opacity-60" />

                {/* Priority Badge on top of image */}
                <div className="absolute top-4 right-4">
                    <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border-none",
                        task.priority === 'high' ? "bg-red-500 text-white" :
                            task.priority === 'urgent' ? "bg-black text-white" :
                                "bg-accent-indigo text-white"
                    )}>
                        {task.priority || "Med"}
                    </Badge>
                </div>
            </div>

            {/* Content Container */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleComplete?.(task.id)
                        }}
                        className="mt-0.5 shrink-0"
                    >
                        {task.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-500/10" />
                        ) : (
                            <Circle className="w-6 h-6 text-text-tertiary group-hover:text-accent-indigo transition-colors" />
                        )}
                    </button>

                    <div className="flex-1 min-w-0">
                        <h4 className={cn(
                            "text-sm font-bold text-text-primary leading-tight line-clamp-1 tracking-tight",
                            task.completed && "text-text-tertiary line-through"
                        )}>
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2">
                                {task.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between flex-wrap gap-2 min-h-0">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDuration(task.estimated_time)}</span>
                        </div>

                        {(task.start_date || task.due_date) && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest shrink-0">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="whitespace-nowrap">
                                    {task.start_date && new Date(task.start_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                                    {task.start_date && task.due_date && ' - '}
                                    {task.due_date && new Date(task.due_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex -space-x-2 shrink-0">
                        {task.assignee ? (
                            <div className="w-8 h-8 rounded-full border-2 border-bg-1 dark:border-bg-3 bg-bg-2 overflow-hidden relative shadow-sm group/assignee">
                                {task.assignee.avatar_url ? (
                                    <Image src={task.assignee.avatar_url} alt={task.assignee.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-accent-indigo/20 flex items-center justify-center text-[10px] font-bold text-accent-indigo">
                                        {task.assignee.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover/assignee:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                    {task.assignee.name}
                                </div>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-bg-1 bg-bg-3 flex items-center justify-center text-[10px] font-black text-text-tertiary relative z-10 hover:bg-bg-4 transition-colors" title="Sem responsável">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
