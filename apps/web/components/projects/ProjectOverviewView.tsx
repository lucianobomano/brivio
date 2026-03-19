"use client"

import * as React from "react"
import {
    CheckCircle2,
    Clock,
    Users,
    Calendar,
    ArrowLeft,
    DollarSign,
    TrendingUp,
    MessageSquare,
    ArrowUpRight,
    Trophy,
    Target
} from "lucide-react"
import type { Project } from "./ProjectsClient"
import type { RoadmapStage } from "@/app/actions/roadmap"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useCurrency } from "@/components/CurrencyUtils"

interface ProjectOverviewViewProps {
    project: Project
    stages?: RoadmapStage[]
    onBack?: () => void
}

export function ProjectOverviewView({ project, stages = [], onBack }: ProjectOverviewViewProps) {
    const { formatPrice } = useCurrency()
    return (
        <div className="flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Project Header */}
            <div className="flex items-center gap-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl border border-[#373737] flex items-center justify-center text-[#97A1B3] hover:text-white hover:border-[#97A1B3] transition-all duration-300 group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                )}
                <div className="flex flex-col gap-1">
                    <span className="text-[#97A1B3] text-[10px] font-black tracking-[0.2em] uppercase">Projecto</span>
                    <h1 className="text-[#97A1B3] text-4xl font-black tracking-tight">{project.name}</h1>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-4 gap-5">
                {[
                    {
                        label: "Status do Projecto",
                        value: project.status_label || "Active",
                        icon: Target,
                        color: project.status_label === 'completed' ? "#06D6A0" : "#FF0054",
                        bg: "rgba(6, 214, 160, 0.1)"
                    },
                    {
                        label: "Progresso Geral",
                        value: `${project.progress}%`,
                        icon: TrendingUp,
                        color: "#311C99",
                        bg: "rgba(49, 28, 153, 0.1)"
                    },
                    {
                        label: "Budget Alocado",
                        value: project.budget_amount ? formatPrice(project.budget_amount) : "N/A",
                        icon: DollarSign,
                        color: "#FACC15",
                        bg: "rgba(250, 204, 21, 0.1)"
                    },
                    {
                        label: "Tempo Restante",
                        value: project.due_date ? "12 Dias" : "N/A",
                        icon: Clock,
                        color: "#FF0054",
                        bg: "rgba(255, 0, 84, 0.1)"
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="p-6 border border-[#373737] rounded-[8px] flex items-center justify-between group hover:border-[#97A1B3]/30 transition-all duration-500"
                    >
                        <div className="flex flex-col gap-2">
                            <span className="text-[#97A1B3] text-[10px] font-black tracking-[0.2em]">{stat.label}</span>
                            <span className="text-[#97A1B3] text-2xl font-bold font-inter">{stat.value}</span>
                        </div>
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                            style={{ backgroundColor: stat.bg }}
                        >
                            <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="col-span-8 flex flex-col gap-5">
                    {/* Description & Mission */}
                    <div className="p-8 border border-[#373737] rounded-[8px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Trophy className="w-32 h-32 text-[#97A1B3]" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-accent-indigo/10 rounded-lg">
                                    <Target className="w-5 h-5 text-accent-indigo" />
                                </div>
                                <h3 className="text-[#97A1B3] text-lg font-black tracking-tight">Objectivo do Projecto</h3>
                            </div>
                            <p className="text-[#97A1B3] text-base leading-relaxed max-w-2xl font-medium">
                                {project.description || "Este projecto visa implementar soluções inovadoras para otimizar os processos internos e garantir a excelência na entrega dos resultados aos stakeholders."}
                            </p>

                            <div className="grid grid-cols-3 gap-8 mt-10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[#97A1B3] text-[11px] font-bold tracking-wider">Prioridade</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#FF0054]" />
                                        <span className="text-[#97A1B3] font-bold">{project.priority || "Alta"}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[#97A1B3] text-[11px] font-bold tracking-wider">Categoria</span>
                                    <span className="text-[#97A1B3] font-bold">{project.category || "Design & Tech"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[#97A1B3] text-[11px] font-bold tracking-wider">Criador</span>
                                    <span className="text-[#97A1B3] font-bold">{project.creator?.name || "Brivio Admin"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Preview */}
                    <div className="p-8 border border-[#373737] rounded-[8px]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-purple/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-accent-purple" />
                                </div>
                                <h3 className="text-[#97A1B3] text-lg font-black tracking-tight">Cronograma Resumido</h3>
                            </div>
                            <button className="text-[12px] font-black text-accent-indigo uppercase tracking-widest hover:underline">Ver Gantt completo</button>
                        </div>

                        <div className="relative pt-10">
                            {/* Horizontal Line */}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-[#373737]" />

                            <div className="flex justify-between items-center relative h-12">
                                {(stages.length > 0 ? stages : [
                                    { name: "Kickoff", progress: 100 },
                                    { name: "Design", progress: 100 },
                                    { name: "Dev", progress: 0 },
                                    { name: "Launch", progress: 0 },
                                ]).map((stage, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-4 relative z-10 bg-[#15171F]/0">
                                        <span className="text-[#97A1B3] text-[10px] font-bold absolute -top-8 whitespace-nowrap">
                                            {stage.progress === 100 ? "Concluído" : stage.progress > 0 ? `${stage.progress}%` : "Pendente"}
                                        </span>
                                        <div
                                            className={cn(
                                                "w-4 h-4 rounded-full border-4 border-[#15171F] z-10",
                                                stage.progress === 100 ? "bg-[#06D6A0]" : stage.progress > 0 ? "bg-accent-indigo" : "bg-[#373737]"
                                            )}
                                        />
                                        <span className={cn(
                                            "text-[10px] font-black tracking-tight absolute -bottom-8 whitespace-nowrap",
                                            stage.progress > 0 ? "text-[#97A1B3]" : "text-[#515151]"
                                        )}>{stage.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar area */}
                <div className="col-span-4 flex flex-col gap-5">
                    {/* Client Info */}
                    <div className="p-8 border border-[#373737] rounded-[8px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[#97A1B3] text-sm font-black tracking-widest">Dados do Cliente</h3>
                            <div className="p-2 bg-white/5 rounded-full">
                                <Target className="w-4 h-4 text-[#97A1B3]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-colors">
                            {project.brand?.logo_url ? (
                                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-[#373737]">
                                    <Image
                                        src={project.brand.logo_url}
                                        alt={project.brand.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-[#2E313C] flex items-center justify-center border border-[#373737]">
                                    <span className="text-[#97A1B3] text-lg font-bold">{(project.brand?.name || "C")[0]}</span>
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-[#97A1B3] text-sm font-bold group-hover:text-accent-indigo transition-colors">{project.brand?.name || "Cliente não definido"}</span>
                                <span className="text-[#97A1B3] text-[10px] font-bold tracking-wider">Identidade Corporativa</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 h-12 border border-dashed border-[#373737] rounded-2xl text-[11px] font-black text-[#97A1B3] tracking-widest hover:bg-white/5 transition-all">
                            Ver Perfil do Cliente
                        </button>
                    </div>

                    {/* Team Members */}
                    <div className="p-8 border border-[#373737] rounded-[8px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[#97A1B3] text-sm font-black tracking-widest">Equipa Activa</h3>
                            <div className="p-2 bg-white/5 rounded-full">
                                <Users className="w-4 h-4 text-[#97A1B3]" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            {[
                                { name: "Maria Augusta", role: "Design Lead", color: "from-pink-500 to-rose-500" },
                                { name: "João Pedro", role: "Sr. Developer", color: "from-blue-500 to-indigo-500" },
                                { name: "Ana Sofia", role: "Manager", color: "from-emerald-500 to-teal-500" },
                            ].map((member, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-colors">
                                    <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br shadow-lg", member.color)} />
                                    <div className="flex flex-col">
                                        <span className="text-[#97A1B3] text-sm font-bold group-hover:text-accent-indigo transition-colors">{member.name}</span>
                                        <span className="text-[#97A1B3] text-[10px] font-bold tracking-wider">{member.role}</span>
                                    </div>
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight className="w-4 h-4 text-[#97A1B3]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 h-12 border border-dashed border-[#373737] rounded-2xl text-[11px] font-black text-[#97A1B3] tracking-widest hover:bg-white/5 transition-all">
                            Gerir Equipa
                        </button>
                    </div>

                    {/* Quick Activity */}
                    <div className="p-8 border border-[#373737] rounded-[8px]">
                        <h3 className="text-[#97A1B3] text-sm font-black tracking-widest mb-6">Actividade Recente</h3>
                        <div className="flex flex-col gap-6 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[7px] top-2 w-[2px] h-[calc(100%-20px)] bg-[#373737]" />

                            {[
                                { user: "Maria", action: "comentou em", target: "Design System", time: "2h", icon: MessageSquare, color: "text-[#311C99]" },
                                { user: "João", action: "concluiu a tarefa", target: "API Integration", time: "5h", icon: CheckCircle2, color: "text-[#06D6A0]" },
                                { user: "Sistem", action: "actualizou o status para", target: "Fase 2", time: "1d", icon: ArrowUpRight, color: "text-[#FF0054]" },
                            ].map((activity, i) => (
                                <div key={i} className="flex gap-4 relative z-10">
                                    <div className="w-4 h-4 rounded-full bg-[#15171F] border-2 border-[#373737] mt-1 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#97A1B3]" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[#97A1B3] text-xs font-medium">
                                            <span className="text-[#97A1B3] font-bold">{activity.user}</span> {activity.action} <span className="text-[#97A1B3] font-bold">{activity.target}</span>
                                        </p>
                                        <span className="text-[10px] text-[#515151] font-bold">{activity.time} atrás</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
