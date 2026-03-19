"use client"

import * as React from "react"
import Image from "next/image"
import { User, MoreVertical, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Pencil, Trash2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Project } from "./ProjectsClient"
import { useCurrency } from "@/components/CurrencyUtils"

interface ProjectCardProps {
    project: Project
    isOverlay?: boolean
    className?: string
    variant?: "default" | "compact"
    onViewProject?: (project: Project) => void
    onOpenDetails?: (project: Project) => void
    onEdit?: (project: Project) => void
}

export function ProjectCard({ project, isOverlay, className, variant = "default", onViewProject, onOpenDetails, onEdit }: ProjectCardProps) {
    const { formatPrice } = useCurrency()
    const isCompact = variant === "compact";

    return (
        <div
            className={cn(
                "group bg-bg-1 border border-bg-3 dark:border-bg-3 rounded-xl shadow-sm hover:shadow-md hover:border-accent-indigo/20 transition-all flex flex-col overflow-hidden",
                isCompact ? "w-full max-w-[210px] h-fit" : "h-fit",
                isOverlay && "shadow-2xl border-accent-indigo/40 dark:border-accent-indigo/40 cursor-grabbing",
                className
            )}
        >
            {/* Project Cover Image */}
            <div
                className={cn(
                    "relative w-full shrink-0 overflow-hidden bg-bg-2 cursor-pointer",
                    isCompact ? "h-24" : "h-32"
                )}
                onClick={() => onViewProject?.(project)}
            >
                <Image
                    src={project.cover_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"}
                    alt={project.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                    {project.brand ? (
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center p-1">
                            {project.brand.logo_url ? (
                                <Image src={project.brand.logo_url} alt="" width={24} height={24} className="object-contain" />
                            ) : (
                                <span className="text-[10px] font-bold text-white">{project.brand.name.charAt(0)}</span>
                            )}
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {!isOverlay && (
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] bg-bg-1 border-bg-3 p-1 rounded-[12px] shadow-xl z-[100]">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onViewProject?.(project)
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-[8px] cursor-pointer hover:bg-bg-2"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Abrir Pipeline</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEdit?.(project)
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-[8px] cursor-pointer hover:bg-bg-2"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Editar Projeto</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-bg-3 my-1" />
                                <DropdownMenuItem
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2 p-2 rounded-[8px] cursor-pointer hover:bg-red-500/10 text-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Excluir</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            <div className={cn("flex flex-col flex-1", isCompact ? "p-3" : "p-4", "pb-[18px]")}>
                <div className="mb-2">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-tight">
                        {project.brand?.name || "Unbranded"}
                    </span>
                    <h4
                        className={cn(
                            "font-bold text-text-primary leading-tight hover:text-accent-indigo transition-colors line-clamp-1 cursor-pointer",
                            isCompact ? "text-[13px]" : "text-sm"
                        )}
                        onClick={() => onOpenDetails?.(project)}
                    >
                        {project.name}
                    </h4>
                </div>

                {project.description && (
                    <p className={cn(
                        "text-[11px] text-text-secondary line-clamp-2 leading-relaxed group-hover:text-text-primary transition-colors",
                        isCompact ? "mb-2" : "mb-4"
                    )}>
                        {project.description}
                    </p>
                )}

                {/* Project Footer Items */}
                <div className={cn(
                    "mt-auto border-t border-bg-3/30 dark:border-bg-3 flex items-center justify-between flex-wrap gap-2",
                    isCompact ? "pt-2" : "pt-3"
                )}>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-6 h-6 rounded-full border border-bg-3 bg-bg-2 flex items-center justify-center overflow-hidden">
                            {project.creator?.avatar_url ? (
                                <Image src={project.creator.avatar_url} alt="" width={24} height={24} className="object-cover" />
                            ) : (
                                <User className="w-3 h-3 text-text-tertiary" />
                            )}
                        </div>
                        <span className="text-[9px] font-medium text-text-tertiary uppercase tracking-wider">
                            {project.priority || "Med"}
                        </span>
                        {project.budget_amount && (
                            <Badge variant="outline" className="text-[8px] font-bold text-accent-indigo border-accent-indigo/20 bg-accent-indigo/5 ml-2">
                                {formatPrice(project.budget_amount)}
                            </Badge>
                        )}
                    </div>

                    {!isOverlay && (
                        <div className="w-8 h-8 rounded-lg bg-bg-2 border border-bg-3 flex items-center justify-center text-text-tertiary">
                            <GripVertical className="w-4 h-4 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Progress Bar (Small) */}
                <div className="mt-3 w-full h-1 bg-bg-2 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-accent-indigo/40 group-hover:bg-accent-indigo transition-colors"
                        style={{ width: `${project.progress || 0}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
