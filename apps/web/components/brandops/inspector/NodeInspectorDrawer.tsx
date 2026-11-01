"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    X, Sparkles, Check, Trash2, BookOpen, Layers, 
    Clock, Shield, Link2, FileText, Palette, Sliders, ArrowRight
} from "lucide-react"
import { BrandNode, BrandRelationship, SemanticRelationship } from "../types"
import { CATEGORY_CONFIG, RELATIONSHIP_CONFIG } from "../constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ColorInput } from "@/components/ui/color-input"

interface NodeInspectorDrawerProps {
    node: BrandNode | null
    onClose: () => void
    onUpdateNode: (nodeId: string, updatedObject: any) => void
    onApproveNode: (nodeId: string, rationale?: string) => void
    onRejectNode: (nodeId: string, rationale?: string) => void
    onDeleteNode: (nodeId: string) => void
    onRunNodeAI: (nodeId: string, customPrompt?: string) => void
    relationships: BrandRelationship[]
    allNodes: BrandNode[]
    onExportToBrandbook: (objectId: string) => void
}

export function NodeInspectorDrawer({
    node,
    onClose,
    onUpdateNode,
    onApproveNode,
    onRejectNode,
    onDeleteNode,
    onRunNodeAI,
    relationships,
    allNodes,
    onExportToBrandbook
}: NodeInspectorDrawerProps) {
    if (!node) return null

    const [activeTab, setActiveTab] = useState<'content' | 'history' | 'relations' | 'decision'>('content')
    const [title, setTitle] = useState(node.title)
    const [rationale, setRationale] = useState(node.object?.rationale || '')
    const [content, setContent] = useState<any>(node.object?.content || {})
    const [aiPrompt, setAiPrompt] = useState('')

    useEffect(() => {
        setTitle(node.title)
        setRationale(node.object?.rationale || '')
        setContent(node.object?.content || {})
    }, [node])

    const catConfig = CATEGORY_CONFIG[node.category] || CATEGORY_CONFIG.strategy
    const status = node.object?.status || 'draft'
    const isApproved = status === 'approved'

    // Related inputs (sources) and outputs (targets)
    const inputRelationships = relationships.filter(r => r.target_node_id === node.id)
    const outputRelationships = relationships.filter(r => r.source_node_id === node.id)

    const handleSave = () => {
        onUpdateNode(node.id, {
            title,
            rationale,
            content
        })
        toast.success("Alterações guardadas com sucesso!")
    }

    const handleRunAI = () => {
        onRunNodeAI(node.id, aiPrompt)
        setAiPrompt('')
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
                {/* Backdrop click to close */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                />

                {/* Inspector Drawer */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="relative w-full max-w-xl h-full bg-[#141416] border-l border-white/10 shadow-2xl flex flex-col pointer-events-auto z-10 text-white"
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-white/10 relative overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 right-0 h-1.5"
                            style={{ backgroundColor: catConfig.color }}
                        />

                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border", catConfig.badge)}>
                                    {catConfig.label}
                                </span>
                                {isApproved ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Oficial
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-[#FF0054]" /> Proposta IA
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xl font-black bg-transparent border-b border-transparent hover:border-white/20 focus:border-[#FF0054] outline-none text-white w-full transition-colors pb-1"
                        />
                        <div className="text-xs text-zinc-400 mt-1 font-mono">
                            Tipo: <span className="text-zinc-200">{node.type}</span> • Versão: <span className="text-[#FF0054]">v{node.object?.version || 1}</span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center border-b border-white/10 px-6 gap-6 bg-[#0E0E10]">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={cn(
                                "py-3 text-xs font-bold transition-all relative cursor-pointer",
                                activeTab === 'content' ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            Conteúdo & Dados
                            {activeTab === 'content' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0054]" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "py-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5",
                                activeTab === 'history' ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            Histórico de Versões
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
                                {node.outputs_history?.length || 1}
                            </span>
                            {activeTab === 'history' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0054]" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('relations')}
                            className={cn(
                                "py-3 text-xs font-bold transition-all relative cursor-pointer",
                                activeTab === 'relations' ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            Relações ({inputRelationships.length + outputRelationships.length})
                            {activeTab === 'relations' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0054]" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('decision')}
                            className={cn(
                                "py-3 text-xs font-bold transition-all relative cursor-pointer",
                                activeTab === 'decision' ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            Racional & Decisão
                            {activeTab === 'decision' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0054]" />}
                        </button>
                    </div>

                    {/* Tab Content Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* 1. CONTENT TAB */}
                        {activeTab === 'content' && (
                            <div className="space-y-5">
                                {/* Color System Editor */}
                                {node.type === 'color_system' && content.palette && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                                            Amostras da Paleta Cromática
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {content.palette.map((c: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
                                                    <ColorInput
                                                        value={c.hex}
                                                        onChange={(e) => {
                                                            const newPal = [...content.palette]
                                                            newPal[i].hex = e.target.value
                                                            setContent({ ...content, palette: newPal })
                                                        }}
                                                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <input
                                                            type="text"
                                                            value={c.name}
                                                            onChange={(e) => {
                                                                const newPal = [...content.palette]
                                                                newPal[i].name = e.target.value
                                                                setContent({ ...content, palette: newPal })
                                                            }}
                                                            className="text-xs font-bold text-white bg-transparent w-full outline-none"
                                                        />
                                                        <span className="text-[10px] text-zinc-400 font-mono block">{c.hex}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Main Text Area */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                                        Conteúdo Estruturado
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value)
                                                setContent(parsed)
                                            } catch {
                                                setContent(e.target.value)
                                            }
                                        }}
                                        className="w-full bg-[#0E0E10] border border-white/10 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-[#FF0054] outline-none transition-colors"
                                    />
                                </div>

                                {/* AI Refinement input */}
                                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                                        <Sparkles className="w-4 h-4 text-[#FF0054]" />
                                        <span>Refinar com IA</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Ex: Torne o posicionamento mais exclusivo e focado em tecnologia..."
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF0054]"
                                    />
                                    <button
                                        onClick={handleRunAI}
                                        disabled={node.is_executing}
                                        className="w-full h-9 rounded-xl bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>{node.is_executing ? "Gerando proposta..." : "Gerar Nova Versão com IA"}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 2. HISTORY TAB */}
                        {activeTab === 'history' && (
                            <div className="space-y-4">
                                <p className="text-xs text-zinc-400">
                                    Todas as propostas geradas pela IA e edições humanas ficam preservadas no histórico imutável da marca.
                                </p>

                                <div className="space-y-3">
                                    {(node.outputs_history || []).map((out: any, i: number) => (
                                        <div 
                                            key={out.id || i}
                                            className="p-4 rounded-xl bg-[#0E0E10] border border-white/10 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-[#FF0054]">
                                                        v{out.version}
                                                    </span>
                                                    <span className="text-xs font-bold text-white">
                                                        {out.title}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-zinc-400 font-mono">
                                                    {new Date(out.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {out.rationale && (
                                                <p className="text-xs text-zinc-300 italic bg-white/5 p-2 rounded-lg">
                                                    "{out.rationale}"
                                                </p>
                                            )}

                                            <div className="pt-2 flex items-center justify-between text-[11px]">
                                                <span className="text-zinc-400">{out.author || 'BrandOps AI'}</span>
                                                <button
                                                    onClick={() => {
                                                        setContent(out.content)
                                                        if (out.rationale) setRationale(out.rationale)
                                                        toast.success(`Conteúdo restaurado da versão v${out.version}`)
                                                    }}
                                                    className="text-xs text-[#FF0054] hover:underline font-bold cursor-pointer"
                                                >
                                                    Restaurar esta versão
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. RELATIONS TAB */}
                        {activeTab === 'relations' && (
                            <div className="space-y-5">
                                {/* Upstream Inputs */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                                        Inputs Conectados (Origens)
                                    </h4>
                                    {inputRelationships.length === 0 ? (
                                        <p className="text-xs text-zinc-500 italic">Nenhum nó de entrada conectado.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {inputRelationships.map(rel => {
                                                const sourceNode = allNodes.find(n => n.id === rel.source_node_id)
                                                const relMeta = RELATIONSHIP_CONFIG[rel.relationship_type]
                                                return (
                                                    <div key={rel.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-white">{sourceNode?.title || 'Nó Desconhecido'}</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold" style={{ backgroundColor: `${relMeta?.color}20`, color: relMeta?.color }}>
                                                            {relMeta?.label || rel.relationship_type}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Downstream Outputs */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                                        Dependentes (Destinos)
                                    </h4>
                                    {outputRelationships.length === 0 ? (
                                        <p className="text-xs text-zinc-500 italic">Nenhum nó dependente conectado.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {outputRelationships.map(rel => {
                                                const targetNode = allNodes.find(n => n.id === rel.target_node_id)
                                                const relMeta = RELATIONSHIP_CONFIG[rel.relationship_type]
                                                return (
                                                    <div key={rel.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-white">{targetNode?.title || 'Nó Desconhecido'}</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold" style={{ backgroundColor: `${relMeta?.color}20`, color: relMeta?.color }}>
                                                            {relMeta?.label || rel.relationship_type}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. DECISION & RATIONALE TAB */}
                        {activeTab === 'decision' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                                        Racional Estratégico & Justificativa
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={rationale}
                                        onChange={(e) => setRationale(e.target.value)}
                                        placeholder="Descreva por que esta directriz foi adotada e o impacto esperado..."
                                        className="w-full bg-[#0E0E10] border border-white/10 rounded-xl p-3 text-xs text-zinc-200 focus:border-[#FF0054] outline-none"
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <Shield className="w-4 h-4" />
                                        <span>Integração com Brand Memory</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        Ao aprovar este nó, ele passará a alimentar automaticamente as consultas do "Pergunte à Marca" e as auditorias do "Brand Guardian".
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-6 border-t border-white/10 bg-[#0E0E10] flex items-center justify-between gap-3">
                        <button
                            onClick={() => onDeleteNode(node.id)}
                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Eliminar Nó"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2">
                            {/* Export to Brand Book */}
                            <button
                                onClick={() => onExportToBrandbook(node.object_id)}
                                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Publicar no Brand Book"
                            >
                                <BookOpen className="w-3.5 h-3.5 text-[#FF0054]" />
                                <span>No Brand Book</span>
                            </button>

                            {/* Approve / Reject */}
                            {!isApproved ? (
                                <button
                                    onClick={() => onApproveNode(node.id, rationale)}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Aprovar como Oficial</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => onRejectNode(node.id, rationale)}
                                    className="px-3 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/30 text-xs font-bold border border-red-500/30 transition-all cursor-pointer"
                                >
                                    Revogar Aprovação
                                </button>
                            )}

                            {/* Save changes */}
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
