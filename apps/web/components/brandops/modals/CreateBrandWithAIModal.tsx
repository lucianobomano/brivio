"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, ArrowRight, Compass, Wand2, Coffee, Laptop, Building2, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateBrandWithAIModalProps {
    isOpen: boolean
    onClose: () => void
    onGenerate: (prompt: string) => Promise<void>
    isGenerating: boolean
}

const PRESET_PROMPTS = [
    {
        icon: Coffee,
        title: "Café Especial & Origem Africana",
        prompt: "Quero criar uma marca premium de café angolano para jovens profissionais urbanos que valorizam o ritual diário e design cosmopolita."
    },
    {
        icon: Laptop,
        title: "Fintech & Infraestrutura B2B",
        prompt: "Rebranding de uma fintech de infraestrutura de pagamentos transfronteiriços para o mercado europeu, com foco em segurança e simplicidade radical."
    },
    {
        icon: Building2,
        title: "Hotelaria & Hospitalidade Regenerativa",
        prompt: "Nova marca de hotel boutique e retiro ecológico no Alentejo, combinando arquitetura minimalista, sensorialidade e gastronomia da horta à mesa."
    },
    {
        icon: Palette,
        title: "Estúdio de Design & Inteligência Criativa",
        prompt: "Criação de um estúdio de branding e inovação focado em acelerar marcas que moldam o futuro cultural da próxima geração."
    }
]

export function CreateBrandWithAIModal({
    isOpen,
    onClose,
    onGenerate,
    isGenerating
}: CreateBrandWithAIModalProps) {
    const [prompt, setPrompt] = useState("")

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt.trim() || isGenerating) return
        await onGenerate(prompt)
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#141416] border border-white/10 rounded-3xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] z-10 text-white overflow-hidden"
                >
                    {/* Glowing ambient background */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FF0054]/20 via-[#88007F]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Header */}
                    <div className="space-y-2 mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF0054]/20 to-[#88007F]/20 border border-[#FF0054]/30 text-[#FF0054] text-xs font-bold font-mono">
                            <Sparkles className="w-3.5 h-3.5" /> BrandOps AI Workflow Engine
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight font-tight">
                            O que vamos construir?
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Descreva a marca que deseja criar. O BrandOps irá sintetizar a pesquisa, estratégia, identidade verbal e visual num grafo completo de nós operacionais conectados no canvas.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <textarea
                                rows={4}
                                autoFocus
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Quero criar uma marca premium de café angolano para jovens profissionais urbanos que valorizam o ritual diário e design cosmopolita..."
                                className="w-full bg-[#0E0E10] border border-white/15 rounded-2xl p-4 text-sm text-white placeholder-zinc-500 focus:border-[#FF0054] outline-none shadow-inner transition-colors resize-none"
                            />
                        </div>

                        {/* Presets */}
                        <div className="space-y-2.5">
                            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                                Ou escolha uma direção para começar rápido:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {PRESET_PROMPTS.map((preset, idx) => {
                                    const Icon = preset.icon
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPrompt(preset.prompt)}
                                            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF0054]/50 transition-all text-left flex items-start gap-2.5 group cursor-pointer"
                                        >
                                            <Icon className="w-4 h-4 text-[#FF0054] mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-white group-hover:text-[#FF0054] transition-colors">
                                                    {preset.title}
                                                </h4>
                                                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                                    {preset.prompt}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* CTA Footer */}
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs text-zinc-400 font-mono">
                                Cria Discovery → Strategy → Verbal → Visual → Activation
                            </span>

                            <button
                                type="submit"
                                disabled={!prompt.trim() || isGenerating}
                                className={cn(
                                    "px-6 h-12 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition-all shadow-xl cursor-pointer",
                                    isGenerating || !prompt.trim()
                                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-[#FF0054] via-[#88007F] to-[#311C99] text-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,0,84,0.4)]"
                                )}
                            >
                                <Wand2 className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                                <span>{isGenerating ? "Construindo Brand Workflow..." : "Construir Marca com IA"}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
