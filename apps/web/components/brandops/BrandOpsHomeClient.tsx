"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
    Layers, Plus, Sparkles, Compass, Target, ArrowRight, 
    BookOpen, ShieldCheck, Clock, Check, FolderPlus, GitBranch,
    Building2, Activity, Play, ChevronRight, Zap
} from "lucide-react"
import { BrandSpace, BrandFlowTemplate } from "./types"
import { BRAND_FLOW_TEMPLATES } from "./constants"
import { createBrandSpace } from "@/app/actions/brandops"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { StandupHeader } from "@/components/standups/StandupHeader"

interface BrandOpsHomeClientProps {
    brands: Array<{ id: string; name: string; slug: string }>
    initialSpaces: BrandSpace[]
    user: any
}

export function BrandOpsHomeClient({
    brands,
    initialSpaces,
    user
}: BrandOpsHomeClientProps) {
    const router = useRouter()
    const [selectedBrandId, setSelectedBrandId] = useState<string>(
        brands[0]?.id || ""
    )
    const [spaces, setSpaces] = useState<BrandSpace[]>(initialSpaces)
    const [isCreatingSpace, setIsCreatingSpace] = useState(false)
    const [newSpaceName, setNewSpaceName] = useState("")

    const currentBrand = brands.find(b => b.id === selectedBrandId) || brands[0]

    // Create Brand Space
    const handleCreateSpace = async (template?: BrandFlowTemplate) => {
        if (!selectedBrandId) {
            toast.error("Selecione uma marca primeiro.")
            return
        }

        const name = template ? `${template.name} — ${currentBrand?.name || 'Space'}` : newSpaceName || `Brand Space #${spaces.length + 1}`
        const desc = template ? template.description : "Ambiente de operações e construção da marca"

        try {
            const res = await createBrandSpace(selectedBrandId, name, desc)
            if (res.success && res.space) {
                setSpaces([res.space, ...spaces])
                setIsCreatingSpace(false)
                setNewSpaceName("")
                toast.success(`Brand Space "${name}" criado com sucesso!`)
                router.push(`/brandops/${res.space.id}`)
            } else {
                toast.error(res.error || "Erro ao criar Brand Space")
            }
        } catch (e: any) {
            toast.error(e.message || "Falha ao criar espaço")
        }
    }

    return (
        <div className="w-full min-h-screen bg-[#0B0B0D] text-white overflow-y-auto font-sans">
            <StandupHeader />
            <div className="max-w-6xl mx-auto space-y-8 px-5 pb-8 pt-5 md:px-8 md:pb-10 md:pt-6">
                {/* Top Header & Brand Switcher */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="hidden inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF0054]/10 border border-[#FF0054]/20 text-[#FF0054] text-xs font-mono font-bold uppercase tracking-wider mb-2">
                            <Layers className="w-3.5 h-3.5" /> Brivio Brand Operating System
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-tight">
                            BrandOps
                        </h1>
                        <p className="hidden text-zinc-400 text-sm max-w-xl">
                            O ambiente de trabalho operacional onde pessoas e agentes de IA constroem, relacionam, aprovam e fazem evoluir marcas como sistemas vivos.
                        </p>
                    </div>

                    {/* Brand Selector Dropdown & New Space CTA */}
                    <div className="flex items-center gap-3">
                        <div className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#FF0054]" />
                            <div className="flex flex-col">
                                <select
                                    value={selectedBrandId}
                                    onChange={(e) => setSelectedBrandId(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-4"
                                >
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id} className="bg-[#141416] text-white">
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsCreatingSpace(true)}
                            className="h-10 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Novo Space</span>
                        </button>
                    </div>
                </div>

                {/* Empty state: BrandOps only lists brands from the user's own workspaces */}
                {brands.length === 0 && (
                    <div className="rounded-2xl p-6 bg-[#141416] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-white">Ainda não tem marcas neste workspace</h2>
                            <p className="text-sm text-zinc-400">Crie uma marca para começar a construir Brand Spaces.</p>
                        </div>
                        <Link
                            href="/brands"
                            className="h-10 px-4 rounded-xl bg-white text-black font-semibold text-xs inline-flex items-center gap-2 hover:bg-zinc-200 transition-all shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Criar marca</span>
                        </Link>
                    </div>
                )}

                {/* Hero AI Quick Prompt Box */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-2xl p-6 bg-[#141416] border border-white/10 overflow-hidden"
                >
                    <div className="hidden absolute top-0 right-0 w-96 h-96 bg-[#FF0054]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="hidden flex items-center gap-2 text-xs font-mono font-bold text-[#FF0054] uppercase tracking-wider">
                            <Sparkles className="w-4 h-4" /> Criação Inteligente com IA
                        </div>
                        <h2 className="text-xl font-semibold text-white font-tight">
                            Criar Brand Space
                        </h2>
                        <p className="hidden text-sm text-zinc-300 leading-relaxed">
                            Crie um espaço instantâneo e deixe a IA propor a estratégia completa, do Discovery à Identidade Visual, diretamente no Infinite Canvas.
                        </p>

                        <div className="pt-2 flex flex-wrap gap-2.5">
                            <button
                                onClick={() => handleCreateSpace()}
                            className="px-4 h-10 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#FF0054]" />
                                <span>Criar space</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    const template = BRAND_FLOW_TEMPLATES[0]
                                    handleCreateSpace(template)
                                }}
                            className="px-4 h-10 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>Usar template</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Section 1: Recent Brand Spaces */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-white tracking-tight">
                                Spaces
                            </h3>
                            <p className="hidden text-xs text-zinc-400 font-mono">
                                Ambientes de exploração, rebranding e campanhas conectados ao Brand Context oficial
                            </p>
                        </div>

                        <span className="text-xs text-zinc-400 font-mono">
                            {spaces.length} Espaços ativos
                        </span>
                    </div>

                    {spaces.length === 0 ? (
                        <div className="p-12 rounded-3xl bg-[#141416] border border-dashed border-white/10 text-center space-y-4">
                            <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
                            <h4 className="text-base font-bold text-white">Nenhum Brand Space criado ainda</h4>
                            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                Comece criando o seu primeiro Brand Space para explorar o Infinite Canvas operacional baseado em nós.
                            </p>
                            <button
                                onClick={() => handleCreateSpace()}
                                className="px-6 h-11 rounded-2xl bg-[#FF0054] text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-[#d90045] transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Criar Meu Primeiro Space
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {spaces.map((sp) => (
                                <div
                                    key={sp.id}
                                    onClick={() => router.push(`/brandops/${sp.id}`)}
                                    className="min-h-28 p-5 rounded-2xl bg-[#141416] border border-white/10 hover:border-zinc-500 transition-colors cursor-pointer group flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="hidden flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF0054] font-bold">
                                                Brand Space
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                Contexto Oficial ON
                                            </span>
                                        </div>

                                        <h4 className="text-base font-semibold text-white group-hover:text-zinc-300 transition-colors line-clamp-1">
                                            {sp.name}
                                        </h4>
                                        <p className="hidden text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                            {sp.description || "Ambiente com nós operacionais conectados de Discovery, Estratégia e Identidade."}
                                        </p>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-white/5 flex justify-end text-xs">
                                        <span className="hidden text-zinc-500 font-mono text-[11px]">
                                            Atualizado recentemente
                                        </span>
                                        <span className="text-zinc-400 group-hover:text-white flex items-center gap-1">
                                            Abrir <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 2: Brand Flows & Methodology Templates */}
                <div className="hidden space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">
                                Brand Flows & Biblioteca de Metodologias
                            </h3>
                            <p className="text-xs text-zinc-400 font-mono">
                                Processos estruturados reutilizáveis: execute uma metodologia comprovada no canvas
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {BRAND_FLOW_TEMPLATES.map((tmpl) => (
                            <div
                                key={tmpl.id}
                                onClick={() => handleCreateSpace(tmpl)}
                                className="p-6 rounded-3xl bg-[#141416]/80 hover:bg-[#18181C] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group cursor-pointer shadow-lg"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                                            {tmpl.category}
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-500">
                                            {tmpl.nodes_count} nós • {tmpl.estimated_time}
                                        </span>
                                    </div>

                                    <h4 className="text-base font-bold text-white group-hover:text-[#FF0054] transition-colors">
                                        {tmpl.name}
                                    </h4>
                                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                                        {tmpl.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {tmpl.tags.map((t, ti) => (
                                            <span key={ti} className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 font-mono">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs">
                                    <span className="text-zinc-500 text-[11px]">Metodologia Brivio</span>
                                    <button className="px-3.5 py-1.5 rounded-xl bg-white/10 group-hover:bg-[#FF0054] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                                        <Play className="w-3 h-3" /> Executar Flow
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 3: Brand Digital Twin & Memory Overview */}
                <div className="hidden grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                    <div className="p-6 rounded-3xl bg-[#141416] border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                            <Activity className="w-4 h-4" /> Brand Digital Twin
                        </div>
                        <h4 className="text-2xl font-black text-white font-mono">82% Ativo</h4>
                        <p className="text-xs text-zinc-400">
                            Grafo de conhecimento contínuo que alimenta os agentes de IA e garante consistência em todas as ativações.
                        </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-[#141416] border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF0054] uppercase">
                            <BookOpen className="w-4 h-4" /> Integração Brand Book
                        </div>
                        <h4 className="text-2xl font-black text-white font-mono">Sincronizado</h4>
                        <p className="text-xs text-zinc-400">
                            Qualquer Brand Object aprovado no canvas pode ser publicado imediatamente na estrutura editorial pública ou privada.
                        </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-[#141416] border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#3A86FF] uppercase">
                            <ShieldCheck className="w-4 h-4" /> Brand Guardian
                        </div>
                        <h4 className="text-2xl font-black text-white font-mono">Conforme</h4>
                        <p className="text-xs text-zinc-400">
                            Auditoria em tempo real de contraste cromático, integridade do logo, tom de voz e regras de aplicação.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
