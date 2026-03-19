"use client"

import * as React from "react"
import {
    X,
    Plus,
    Loader2,
    Sparkles,
    Target,
    Zap,
    Flame,
    Clock,
    AlignLeft,
    Calendar,
    ChevronDown
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createRoadmapTask, getProjectMembers } from "@/app/actions/roadmap"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRangePicker } from "./DateRangePicker"
import { format, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import Image from "next/image"
import { User, Users, Timer } from "lucide-react"
import type { Sprint } from "@/app/actions/sprints"

interface ProjectTaskCreateModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    projectId: string
    stages: { id: string, name: string, color: string }[]
    sprints: Sprint[]
    initialStageId?: string
    initialStartDate?: string
}

export function ProjectTaskCreateModal({
    isOpen,
    onClose,
    onSuccess,
    projectId,
    stages,
    sprints,
    initialStageId,
    initialStartDate
}: ProjectTaskCreateModalProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [members, setMembers] = React.useState<{ id: string, name: string, avatar_url: string }[]>([])
    const [formData, setFormData] = React.useState({
        title: "",
        description: "",
        stage_id: initialStageId || stages[0]?.id || "",
        priority: "medium",
        estimated_time: "1",
        start_date: initialStartDate || "",
        due_date: "",
        status: "backlog",
        assignee_id: "",
        sprint_id: ""
    })

    React.useEffect(() => {
        if (isOpen && projectId) {
            const fetchMembers = async () => {
                const projectMembers = await getProjectMembers(projectId)
                setMembers(projectMembers)
            }
            fetchMembers()
        }
    }, [isOpen, projectId])

    React.useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                stage_id: initialStageId || prev.stage_id,
                start_date: initialStartDate || prev.start_date
            }))
        }
    }, [isOpen, initialStageId, initialStartDate])

    const handleCreate = async () => {
        if (!formData.title || !formData.stage_id) {
            toast.error("Por favor, preencha o título e selecione uma etapa.")
            return
        }

        setIsLoading(true)
        try {
            const res = await createRoadmapTask(
                projectId,
                formData.stage_id,
                formData.title,
                formData.priority,
                formData.description,
                Math.round(parseFloat(formData.estimated_time) * 60), // Convert hours to minutes
                formData.start_date || undefined,
                formData.due_date || undefined,
                formData.assignee_id || undefined,
                formData.sprint_id || undefined
            )

            if (res.success) {
                toast.success("Tarefa criada com sucesso!")
                onSuccess()
                handleClose()
            } else {
                toast.error(res.error || "Erro ao criar tarefa")
            }
        } catch (err) {
            console.error("Task Creation Error:", err)
            toast.error("Ocorreu um erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setFormData({
            title: "",
            description: "",
            stage_id: initialStageId || stages[0]?.id || "",
            priority: "medium",
            estimated_time: "1",
            start_date: "",
            due_date: "",
            status: "backlog",
            assignee_id: "",
            sprint_id: ""
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[540px] h-[800px] bg-bg-1 border border-bg-3 rounded-[12px] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-bg-3 flex items-center justify-between bg-bg-2/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[8px] bg-accent-indigo/10 flex items-center justify-center border border-accent-indigo/20">
                            <Sparkles className="w-6 h-6 text-accent-indigo" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Nova Tarefa</h2>
                            <p className="text-xs font-medium text-text-secondary">Adicione uma etapa ao seu pipeline</p>
                        </div>
                    </div>
                    <button onClick={handleClose} type="button" className="w-8 h-8 rounded-full bg-bg-3 hover:bg-bg-4 flex items-center justify-center transition-all">
                        <X className="w-4 h-4 text-text-primary" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    {/* Task Title */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Título da Tarefa</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Ex: Definir paleta de cores primária"
                            className="w-full h-14 bg-bg-2 border border-bg-3 rounded-[8px] px-6 text-base font-bold text-text-primary placeholder:text-text-secondary/30 focus:ring-2 focus:ring-accent-indigo/20 outline-none transition-all"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Phase Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Etapa / Fase</label>
                        <div className="grid grid-cols-2 gap-3">
                            {stages.map(stage => (
                                <button
                                    key={stage.id}
                                    onClick={() => setFormData({ ...formData, stage_id: stage.id })}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-[8px] border transition-all text-left",
                                        formData.stage_id === stage.id ?
                                            "bg-bg-2 border-accent-indigo shadow-lg shadow-accent-indigo/5" :
                                            "bg-bg-1 border-bg-3 hover:border-bg-4"
                                    )}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <span className={cn(
                                        "text-xs font-bold truncate",
                                        formData.stage_id === stage.id ? "text-text-primary" : "text-text-secondary"
                                    )}>
                                        {stage.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* NEW: Assignee Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                            <Users className="w-3" />
                            Responsável
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {members.length > 0 ? members.map(member => (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, assignee_id: formData.assignee_id === member.id ? "" : member.id })}
                                    className={cn(
                                        "group relative flex items-center gap-2 pr-4 pl-1 h-9 rounded-full border transition-all truncate max-w-[160px]",
                                        formData.assignee_id === member.id ?
                                            "bg-accent-indigo border-accent-indigo text-white shadow-lg shadow-accent-indigo/20" :
                                            "bg-bg-2 border-bg-3 text-text-secondary hover:border-bg-4"
                                    )}
                                    title={member.name}
                                >
                                    <div className="w-7 h-7 rounded-full overflow-hidden relative border border-white/20 shrink-0">
                                        {member.avatar_url ? (
                                            <Image src={member.avatar_url} alt={member.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-accent-indigo/20 flex items-center justify-center">
                                                <User className="w-3 h-3 text-accent-indigo" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold truncate">
                                        {member.name.split(' ')[0]}
                                    </span>
                                </button>
                            )) : (
                                <div className="text-[10px] font-medium text-text-tertiary p-2">
                                    Nenhum membro encontrado.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sprint Selector */}
                    {sprints && sprints.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                <Timer className="w-3" />
                                Sprint
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {sprints.map(sprint => (
                                    <button
                                        key={sprint.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sprint_id: formData.sprint_id === sprint.id ? "" : sprint.id })}
                                        className={cn(
                                            "flex items-center gap-2 px-4 h-9 rounded-full border transition-all truncate max-w-[200px]",
                                            formData.sprint_id === sprint.id ?
                                                "bg-accent-indigo border-accent-indigo text-white shadow-lg shadow-accent-indigo/20" :
                                                "bg-bg-2 border-bg-3 text-text-secondary hover:border-bg-4"
                                        )}
                                        title={sprint.name}
                                    >
                                        <Timer className={cn("w-3.5 h-3.5", formData.sprint_id === sprint.id ? "text-white" : "text-accent-indigo")} />
                                        <span className="text-[10px] font-bold truncate">
                                            {sprint.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description and Duration */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                <AlignLeft className="w-3 h-3 text-accent-indigo" />
                                Descrição
                            </label>
                            <textarea
                                placeholder="Pequeno resumo..."
                                className="w-full h-24 bg-bg-2 border border-bg-3 rounded-[8px] p-4 text-xs font-medium text-text-primary placeholder:text-text-secondary/30 focus:ring-2 focus:ring-accent-indigo/20 outline-none transition-all resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                <Clock className="w-3" />
                                Duração (Horas)
                            </label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                className="w-full h-14 bg-bg-2 border border-bg-3 rounded-[8px] px-6 text-sm font-bold text-text-primary focus:ring-2 focus:ring-accent-indigo/20 outline-none transition-all"
                                value={formData.estimated_time}
                                onChange={e => setFormData({ ...formData, estimated_time: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Dates / Timeline */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-accent-indigo" />
                            Cronograma (Início - Conclusão)
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="flex items-center gap-3 h-14 bg-bg-2 border border-bg-3 rounded-[8px] px-6 cursor-pointer hover:border-bg-4 transition-all group">
                                    <Calendar className="w-5 h-5 text-text-tertiary group-hover:text-accent-indigo" />
                                    <span className="text-sm font-bold text-text-primary">
                                        {formData.start_date ? format(parseISO(formData.start_date), "dd MMM yyyy", { locale: pt }) : "Data início"}
                                        {" — "}
                                        {formData.due_date ? format(parseISO(formData.due_date), "dd MMM yyyy", { locale: pt }) : "Data final"}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-text-tertiary ml-auto" />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none z-[200]" align="start">
                                <DateRangePicker
                                    startDate={formData.start_date ? parseISO(formData.start_date) : undefined}
                                    due_date={formData.due_date ? parseISO(formData.due_date) : undefined}
                                    onSave={(range) => {
                                        setFormData({
                                            ...formData,
                                            start_date: range.start?.toISOString() || "",
                                            due_date: range.end?.toISOString() || ""
                                        })
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Priority Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Prioridade</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'low', label: 'BAIXA', icon: <Target className="w-3 h-3" /> },
                                { id: 'medium', label: 'MÉDIA', icon: <Zap className="w-3 h-3" /> },
                                { id: 'high', label: 'ALTA', icon: <Flame className="w-3 h-3" /> }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setFormData({ ...formData, priority: p.id })}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 h-10 rounded-[8px] border text-[10px] font-black transition-all",
                                        formData.priority === p.id ?
                                            "bg-accent-indigo border-accent-indigo text-white shadow-lg shadow-accent-indigo/20" :
                                            "bg-bg-2 border-bg-3 text-text-secondary hover:border-bg-4"
                                    )}
                                >
                                    {p.icon}
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-bg-3 bg-bg-2/30 flex gap-4 shrink-0">
                    <Button
                        variant="ghost"
                        className="flex-1 h-12 rounded-[8px] font-bold text-text-secondary hover:bg-bg-3"
                        onClick={handleClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="flex-1 h-12 rounded-[8px] bg-accent-indigo hover:bg-accent-indigo/90 text-white font-black shadow-xl shadow-accent-indigo/20 disabled:opacity-50"
                        onClick={handleCreate}
                        disabled={isLoading || !formData.title}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                CRIAR TAREFA
                                <Plus className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
