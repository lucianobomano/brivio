"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ProjectCard } from "./ProjectCard"
import type { Project } from "./ProjectsClient"
import { FolderKanban, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProjectGridViewProps {
    projects: Project[]
    onSelectProject: (project: Project) => void
    onCreateProject: () => void
    onOpenDetails?: (project: Project) => void
}

export function ProjectGridView({ projects, onSelectProject, onCreateProject, onOpenDetails }: ProjectGridViewProps) {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <FolderKanban className="w-6 h-6 text-accent-indigo" />
                        Seus Projetos
                    </h3>
                    <p className="text-sm text-text-tertiary mt-1">
                        Gerencie todos os seus projetos ativos e rascunhos em um só lugar.
                    </p>
                </div>
                <Button
                    onClick={onCreateProject}
                    className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl px-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Projeto
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {projects.map((project, idx) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <ProjectCard
                            project={project}
                            onViewProject={onSelectProject}
                            onOpenDetails={onOpenDetails}
                            className="w-full h-full min-h-[320px]"
                        />
                    </motion.div>
                ))}

                {/* Empty State / Add New Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: projects.length * 0.05 }}
                    onClick={onCreateProject}
                    className="border-2 border-dashed border-bg-3 rounded-[12px] flex flex-col items-center justify-center p-8 gap-4 cursor-pointer hover:border-accent-indigo/50 hover:bg-bg-1/50 transition-all group min-h-[320px]"
                >
                    <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-text-tertiary group-hover:text-accent-indigo" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-text-primary">Criar Novo Projeto</p>
                        <p className="text-xs text-text-tertiary mt-1">Comece um novo desafio</p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
