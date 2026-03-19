"use client"

import * as React from "react"
import type { Project } from "./ProjectsClient"
import {
    Users,
    TrendingUp,
    AlertCircle,
    UserCircle,
    BarChart3,
    Calendar,
    ChevronRight,
    Search as SearchIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ProjectWorkloadViewProps {
    projects: Project[]
}

export function ProjectWorkloadView({ projects }: ProjectWorkloadViewProps) {
    const [searchQuery, setSearchQuery] = React.useState("")

    // Mock team members
    const team = [
        { id: '1', name: 'Ana Silva', role: 'Art Director', projects: [projects[0], projects[1]], workload: 85 },
        { id: '2', name: 'Rui Costa', role: 'Motion Designer', projects: [projects[2]], workload: 40 },
        { id: '3', name: 'Zélia Santos', role: 'Copywriter', projects: [projects[0], projects[3]], workload: 95 },
        { id: '4', name: 'Paulo Bento', role: 'Strategist', projects: [projects[1]], workload: 30 },
    ]

    const filteredTeam = team.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="flex flex-col h-full bg-bg-1 border border-bg-3 rounded-[12px] overflow-hidden shadow-xl">
            {/* Workload Header */}
            <div className="p-6 border-b border-bg-3 flex items-center justify-between bg-bg-2/30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-accent-indigo/10 flex items-center justify-center border border-accent-indigo/20">
                            <Users className="w-5 h-5 text-accent-indigo" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary uppercase tracking-tight leading-tight">Carga de Trabalho</h2>
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Alocação de Recursos</p>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-bg-3" />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Capacidade Média: <span className="text-text-primary">62.5%</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Riscos de Burnout: <span className="text-amber-500">1</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Procurar membro..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-bg-2/50 border border-bg-3 rounded-xl pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo/50 w-48 transition-all"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 border-bg-3 rounded-xl hover:bg-bg-3 font-bold text-xs uppercase tracking-tight">
                        Filtros
                    </Button>
                </div>
            </div>

            {/* Workload Grid */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredTeam.map((member, idx) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-bg-0 border border-bg-3 rounded-[12px] p-6 shadow-lg hover:shadow-2xl hover:border-accent-indigo/20 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14 rounded-2xl bg-bg-2 border border-bg-3 overflow-hidden shadow-inner flex items-center justify-center">
                                        <UserCircle className="w-8 h-8 text-text-tertiary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary group-hover:text-accent-indigo transition-colors">{member.name}</h3>
                                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{member.role}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <Badge className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border-none",
                                        member.workload > 90 ? "bg-red-500/10 text-red-500" :
                                            member.workload > 70 ? "bg-amber-500/10 text-amber-500" :
                                                "bg-green-500/10 text-green-500"
                                    )}>
                                        {member.workload}% Carga
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Workload Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                                        <span>Allocated Capacity</span>
                                        <span className={member.workload > 90 ? "text-red-500" : "text-text-primary"}>{member.workload}/100</span>
                                    </div>
                                    <div className="h-3 bg-bg-2 rounded-full overflow-hidden border border-bg-3 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${member.workload}%` }}
                                            className={cn(
                                                "h-full rounded-full transition-colors",
                                                member.workload > 90 ? "bg-red-500" :
                                                    member.workload > 70 ? "bg-amber-500" :
                                                        "bg-accent-indigo"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Active Projects List */}
                                <div className="pt-6 border-t border-bg-3">
                                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-4">Projetos Activos</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        {member.projects.map((p, i) => p && (
                                            <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-bg-1/50 border border-bg-3 hover:border-accent-indigo/30 transition-all cursor-pointer">
                                                <div className="w-8 h-8 rounded-lg bg-bg-2 border border-bg-3 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-accent-indigo">{p.name.charAt(0)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-text-primary truncate">{p.name}</p>
                                                    <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-tighter">{p.progress}% Progress</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-bg-2">
                                        <BarChart3 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-bg-2">
                                        <Calendar className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button className="bg-bg-1 hover:bg-bg-2 text-text-primary border border-bg-3 rounded-2xl px-4 py-2 font-bold text-xs shadow-sm hover:shadow transition-all">
                                    Ver Detalhes
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
