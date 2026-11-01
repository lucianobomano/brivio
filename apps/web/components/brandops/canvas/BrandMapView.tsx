"use client"

import React, { useState } from "react"
import { BrandNode, BrandCategory } from "../types"
import { CATEGORY_CONFIG } from "../constants"
import { Check, Sparkles, Eye, ArrowRight, ShieldCheck, Layers, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandMapViewProps {
    nodes: BrandNode[]
    onOpenInspector: (node: BrandNode) => void
    onSwitchToCanvas: () => void
}

export function BrandMapView({ nodes, onOpenInspector, onSwitchToCanvas }: BrandMapViewProps) {
    const [filterCategory, setFilterCategory] = useState<string>('all')

    const columns: { category: BrandCategory; title: string; subtitle: string }[] = [
        { category: 'discovery', title: '1. Discovery', subtitle: 'Pesquisa, inteligência e mercado' },
        { category: 'strategy', title: '2. Strategy', subtitle: 'Fundação, propósito e posicionamento' },
        { category: 'verbal_identity', title: '3. Verbal Identity', subtitle: 'Naming, mensagens e tom de voz' },
        { category: 'visual_identity', title: '4. Visual Identity', subtitle: 'Logo, cores, tipografia e diretrizes' },
        { category: 'activation', title: '5. Activation', subtitle: 'Campanhas, conteúdo e canais' },
        { category: 'governance', title: '6. Governance', subtitle: 'Decisões oficiais e auditorias' }
    ]

    const approvedCount = nodes.filter(n => n.object?.status === 'approved').length
    const proposedCount = nodes.filter(n => n.object?.status === 'ai_proposed').length

    return (
        <div className="w-full h-full min-h-screen bg-[#0B0B0D] text-white p-8 pt-24 overflow-y-auto">
            {/* Header info */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF0054]/10 border border-[#FF0054]/20 text-[#FF0054] text-xs font-mono font-bold mb-3 uppercase tracking-wider">
                        <GitBranch className="w-3.5 h-3.5" /> Brand Map Semântico
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white font-tight">
                        Arquitetura Semântica da Marca
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                        Organização estruturada e sequencial dos Brand Objects aprovados e propostos. A mesma fonte de verdade do Infinite Canvas em vista editorial.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#141416] px-4 py-2 rounded-2xl border border-white/10">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <Check className="w-3.5 h-3.5" /> {approvedCount} Aprovados
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1.5 text-xs text-purple-400 font-bold">
                            <Sparkles className="w-3.5 h-3.5" /> {proposedCount} Propostas IA
                        </span>
                    </div>

                    <button
                        onClick={onSwitchToCanvas}
                        className="h-10 px-5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-xl"
                    >
                        <Layers className="w-4 h-4" />
                        <span>Voltar ao Canvas</span>
                    </button>
                </div>
            </div>

            {/* Hierarchical Columns */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                {columns.map((col) => {
                    const colNodes = nodes.filter(n => n.category === col.category)
                    const catMeta = CATEGORY_CONFIG[col.category]

                    return (
                        <div key={col.category} className="flex flex-col space-y-3">
                            {/* Column Header */}
                            <div className="bg-[#141416] border border-white/10 p-3.5 rounded-2xl relative overflow-hidden">
                                <div 
                                    className="absolute top-0 left-0 right-0 h-1"
                                    style={{ backgroundColor: catMeta.color }}
                                />
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-black text-white tracking-tight">{col.title}</h3>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                                        {colNodes.length}
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 line-clamp-1">{col.subtitle}</p>
                            </div>

                            {/* Node Cards in this Column */}
                            <div className="space-y-3 flex-1">
                                {colNodes.length === 0 ? (
                                    <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center">
                                        <p className="text-xs text-zinc-600 italic">Nenhum nó criado</p>
                                    </div>
                                ) : (
                                    colNodes.map((n) => {
                                        const status = n.object?.status || 'draft'
                                        const isApproved = status === 'approved'

                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() => onOpenInspector(n)}
                                                className={cn(
                                                    "p-3.5 rounded-2xl bg-[#141416] border text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-lg",
                                                    isApproved 
                                                        ? "border-emerald-500/30 hover:border-emerald-500/60" 
                                                        : "border-white/10 hover:border-[#FF0054]/50"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-1 mb-2">
                                                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                                                        {n.type}
                                                    </span>
                                                    {isApproved ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                                                            <Check className="w-2.5 h-2.5" /> Oficial
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 flex items-center gap-1">
                                                            <Sparkles className="w-2.5 h-2.5 text-[#FF0054]" /> IA
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-xs font-bold text-white group-hover:text-[#FF0054] transition-colors line-clamp-1">
                                                    {n.title}
                                                </h4>

                                                {n.object?.rationale && (
                                                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 italic">
                                                        "{n.object.rationale}"
                                                    </p>
                                                )}

                                                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                                                    <span>v{n.object?.version || 1}</span>
                                                    <span className="text-zinc-400 group-hover:text-white flex items-center gap-1">
                                                        Ver <ArrowRight className="w-2.5 h-2.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
