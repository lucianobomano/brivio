"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Loader2, Check, Upload, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface UserProject {
    id: string;
    name: string;
    cover_url: string | null;
}

interface ServiceData {
    id?: string;
    title: string;
    description: string;
    price: string;
    delivery: string;
    image: string;
    cover_url?: string;
    projects?: { project: UserProject }[];
}

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (service: any) => Promise<void>;
    editingService?: ServiceData | null;
    userProjects?: UserProject[];
}

const GRADIENTS = [
    "from-accent-indigo/40 to-accent-blue/40",
    "from-accent-purple/40 to-accent-pink/40",
    "from-accent-blue/40 to-accent-teal/40",
    "from-accent-teal/40 to-accent-green/40",
    "from-accent-orange/40 to-accent-red/40",
    "from-bg-2 to-bg-3",
]

export function ServiceModal({ isOpen, onClose, onSave, editingService, userProjects = [] }: ServiceModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        delivery: "",
        image: GRADIENTS[0],
        cover_url: "",
        project_ids: [] as string[]
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (editingService) {
            setFormData({
                title: editingService.title || "",
                description: editingService.description || "",
                price: editingService.price || "",
                delivery: editingService.delivery || "",
                image: editingService.image || GRADIENTS[0],
                cover_url: editingService.cover_url || "",
                project_ids: editingService.projects?.map((p: any) => p.project?.id) || []
            })
        } else {
            setFormData({
                title: "",
                description: "",
                price: "",
                delivery: "",
                image: GRADIENTS[0],
                cover_url: "",
                project_ids: []
            })
        }
    }, [editingService, isOpen])

    const toggleProject = (projectId: string) => {
        setFormData(prev => {
            const exists = prev.project_ids.includes(projectId)
            if (exists) {
                return { ...prev, project_ids: prev.project_ids.filter(id => id !== projectId) }
            } else {
                if (prev.project_ids.length >= 3) return prev
                return { ...prev, project_ids: [...prev.project_ids, projectId] }
            }
        })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // In a real app, we'd upload this to Supabase Storage here
        // For now, let's pretend and create a local URL
        const localUrl = URL.createObjectURL(file)
        setFormData(prev => ({ ...prev, cover_url: localUrl }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error("Error saving service:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-bg-1 border border-bg-3 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        <div className="p-8 border-b border-bg-2 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-text-primary">
                                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                                </h3>
                                <p className="text-text-secondary text-sm mt-1">
                                    Defina o que você oferece e como entrega valor.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-bg-2 rounded-full transition-colors text-text-tertiary hover:text-text-primary"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Título do Serviço</Label>
                                        <Input
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="bg-bg-0 border-bg-3 focus:border-accent-indigo h-12 text-lg font-bold"
                                            placeholder="Ex: Branding Completo"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Textarea
                                            required
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="bg-bg-0 border-bg-3 focus:border-accent-indigo min-h-[140px] leading-relaxed"
                                            placeholder="Explique detalhadamente o que o cliente recebe..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Preço (a partir de)</Label>
                                            <Input
                                                required
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="bg-bg-0 border-bg-3 focus:border-accent-indigo h-11"
                                                placeholder="Ex: €1.500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tempo de Entrega</Label>
                                            <Input
                                                required
                                                value={formData.delivery}
                                                onChange={e => setFormData({ ...formData, delivery: e.target.value })}
                                                className="bg-bg-0 border-bg-3 focus:border-accent-indigo h-11"
                                                placeholder="Ex: 2-3 semanas"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Relacionar Projetos (Máx 3)</Label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {userProjects.length > 0 ? (
                                                userProjects.map((project) => (
                                                    <button
                                                        key={project.id}
                                                        type="button"
                                                        onClick={() => toggleProject(project.id)}
                                                        className={cn(
                                                            "w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left",
                                                            formData.project_ids.includes(project.id)
                                                                ? "bg-accent-indigo/10 border-accent-indigo"
                                                                : "bg-bg-0 border-bg-3 hover:border-bg-4"
                                                        )}
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-bg-2 overflow-hidden shrink-0 relative">
                                                            {project.cover_url ? (
                                                                <Image src={project.cover_url} alt={project.name} fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-bg-2 to-bg-3" />
                                                            )}
                                                        </div>
                                                        <span className="flex-1 font-bold text-sm truncate">{project.name}</span>
                                                        {formData.project_ids.includes(project.id) && (
                                                            <div className="w-5 h-5 rounded-full bg-accent-indigo flex items-center justify-center">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 rounded-2xl border border-dashed border-bg-3 text-center text-sm text-text-tertiary">
                                                    Nenhum projeto publicado ainda.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label>Capa do Serviço</Label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative aspect-video rounded-3xl border-2 border-dashed border-bg-3 hover:border-accent-indigo transition-all cursor-pointer overflow-hidden group flex flex-col items-center justify-center p-6 bg-bg-2/30"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />

                                            {formData.cover_url ? (
                                                <>
                                                    <Image src={formData.cover_url} fill className="object-cover transition-transform group-hover:scale-110" alt="Cover preview" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Upload className="w-8 h-8 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-2xl bg-bg-3 flex items-center justify-center mb-4 group-hover:bg-accent-indigo/20 group-hover:text-accent-indigo transition-colors">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-bold text-text-primary">Carregar imagem de capa</p>
                                                    <p className="text-xs text-text-tertiary mt-1">Recomendado: 1200x600px</p>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest mt-2 px-1">
                                            Nota: Se não carregar uma capa, usaremos as capas dos projetos relacionados.
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <Label>Estilo Alternativo (Fallback)</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {GRADIENTS.map((grad) => (
                                                <button
                                                    key={grad}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, image: grad })}
                                                    className={cn(
                                                        "h-20 rounded-2xl bg-gradient-to-br transition-all relative group overflow-hidden border-2",
                                                        grad,
                                                        formData.image === grad ? "border-accent-indigo" : "border-transparent"
                                                    )}
                                                >
                                                    {formData.image === grad && (
                                                        <div className="absolute inset-0 bg-accent-indigo/20 flex items-center justify-center">
                                                            <Check className="w-6 h-6 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-8 bg-bg-2/30 border-t border-bg-2 flex justify-end gap-3 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="px-8 h-12 font-bold"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-10 h-12 bg-accent-indigo hover:bg-accent-indigo/90 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-indigo/20"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    editingService ? "Atualizar Serviço" : "Publicar Serviço"
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
