"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MOCK_TEMPLATES, Template } from "./mockTemplates"
import { TemplateRenderer } from "./TemplateRenderer"
import { ChevronRight, Layout, CheckCircle2, Wand2, Monitor, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandDesignProvider } from "../editor/BrandDesignContext"
import { Block } from "../editor/types"

export function TemplateSelectorPOC() {
    // We store the blocks of the selected template in a local state to allow editing
    const [currentTemplateConfig, setCurrentTemplateConfig] = useState<{
        templateId: string,
        blocks: Block[]
    } | null>(null)

    const [selectedTemplateSource, setSelectedTemplateSource] = useState<Template>(MOCK_TEMPLATES[0])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isPreviewMode, setIsPreviewMode] = useState(false)

    // Sync state when template is changed from dropdown
    useEffect(() => {
        setCurrentTemplateConfig({
            templateId: selectedTemplateSource.id,
            blocks: [...selectedTemplateSource.blocks]
        })
    }, [selectedTemplateSource])

    if (!currentTemplateConfig) return null

    return (
        <BrandDesignProvider brandId="dummy-brand-id">
            <div className="flex flex-col min-h-screen bg-bg-2 text-white overflow-hidden">
                {/* Control Bar */}
                <header className="h-[80px] bg-[#111] border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-[100] backdrop-blur-xl bg-black/60">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col mr-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF0054]">Template Engine</span>
                            <h2 className="text-xl font-bold tracking-tight italic uppercase">{selectedTemplateSource.name}</h2>
                        </div>

                        <div className="h-8 w-px bg-white/10 mx-2" />

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                        >
                            <Layout size={14} className="text-[#FF0054]" />
                            <span className="text-xs font-bold uppercase tracking-widest">Selecionar Modelo</span>
                            <ChevronRight size={14} className={cn("transition-transform text-white/40", isMenuOpen && "rotate-90")} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Mode Toggle */}
                        <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
                            <button
                                onClick={() => setIsPreviewMode(false)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    !isPreviewMode ? "bg-[#FF0054] text-white" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Edit3 size={12} />
                                Editar
                            </button>
                            <button
                                onClick={() => setIsPreviewMode(true)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    isPreviewMode ? "bg-[#FF0054] text-white" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Monitor size={12} />
                                Preview
                            </button>
                        </div>

                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                            <Wand2 size={14} />
                            Gerar Proposta
                        </button>
                    </div>
                </header>

                {/* Template Dropdown */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-[90px] left-8 w-[400px] bg-[#0A0A0A] border border-white/10 rounded-3xl p-4 z-[110] shadow-2xl"
                        >
                            <div className="mb-4 px-2">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Modelos Disponíveis</h3>
                            </div>
                            <div className="space-y-2">
                                {MOCK_TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setSelectedTemplateSource(t)
                                            setIsMenuOpen(false)
                                        }}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                                            selectedTemplateSource.id === t.id
                                                ? "bg-[#FF0054]/10 border-[#FF0054]/30"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <div>
                                            <h4 className="font-bold text-sm uppercase tracking-tight">{t.name}</h4>
                                            <p className="text-[10px] text-white/40 mt-1">{t.description}</p>
                                        </div>
                                        {selectedTemplateSource.id === t.id && (
                                            <CheckCircle2 size={16} className="text-[#FF0054]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#F4F4F4]">
                    <div className="max-w-6xl mx-auto py-20 px-6">
                        <motion.div
                            key={selectedTemplateSource.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden min-h-[800px] border border-black/5"
                        >
                            <TemplateRenderer
                                blocks={currentTemplateConfig.blocks}
                                onUpdateBlocks={(newBlocks) => setCurrentTemplateConfig({
                                    ...currentTemplateConfig,
                                    blocks: newBlocks
                                })}
                                isReadOnly={isPreviewMode}
                            />
                        </motion.div>
                    </div>
                </main>
            </div>
        </BrandDesignProvider>
    )
}
