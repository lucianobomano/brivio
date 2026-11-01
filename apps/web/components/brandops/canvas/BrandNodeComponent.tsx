"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
    Sparkles, Check, X, MoreHorizontal, Play, Eye, 
    Copy, Volume2, ShieldCheck, AlertTriangle, ArrowRight,
    Layers, Compass, Target, MessageSquare, Palette, Type,
    Zap, Award, FileText, ChevronDown, ChevronUp, Upload, Minus, Plus, Image, Video, StickyNote
} from "lucide-react"
import { BrandNode, NodeStatus, SemanticRelationship } from "../types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BrandNodeProps {
    node: BrandNode
    isSelected: boolean
    onSelect: (nodeId: string, multi: boolean) => void
    onOpenInspector: (node: BrandNode) => void
    onStartConnection: (nodeId: string, handleType: 'source' | 'target', e: React.MouseEvent, connectorKind?: string) => void
    onCompleteConnection: (nodeId: string, connectorKind: string) => void
    onRunNodeAI: (nodeId: string) => void
    onApproveNode: (nodeId: string) => void
    onRejectNode: (nodeId: string) => void
    onDeleteNode: (nodeId: string) => void
    onResizeNode: (nodeId: string, width: number, height: number) => void
    zoom: number
}

export function BrandNodeComponent({
    node,
    isSelected,
    onSelect,
    onOpenInspector,
    onStartConnection,
    onCompleteConnection,
    onRunNodeAI,
    onApproveNode,
    onRejectNode,
    onDeleteNode,
    onResizeNode,
    zoom
}: BrandNodeProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [mediaDescription, setMediaDescription] = useState('')
    const [mediaModel, setMediaModel] = useState('Auto')
    const [mediaQuantity, setMediaQuantity] = useState(1)

    const status = node.object?.status || 'draft'
    const isApproved = status === 'approved'
    const isAiProposed = status === 'ai_proposed'

    const getCategoryIcon = () => {
        switch (node.category) {
            case 'discovery': return Compass
            case 'strategy': return Target
            case 'verbal_identity': return MessageSquare
            case 'visual_identity': return Palette
            case 'sensorial_identity': return Volume2
            case 'behavioural_identity': return Layers
            case 'activation': return Zap
            case 'governance': return Award
            case 'agent': return Sparkles
            default: return FileText
        }
    }

    const CategoryIcon = getCategoryIcon()
    const ConnectorIcon = node.category === 'visual_identity' || ['image', 'video', 'file'].includes(node.type) ? Palette
        : node.category === 'sensorial_identity' || node.type === 'audio' ? Volume2
        : node.category === 'governance' || ['decision', 'approval'].includes(node.type) ? Award
        : node.category === 'verbal_identity' || ['text', 'note', 'comment', 'url', 'ai_prompt'].includes(node.type) ? Type
        : FileText
    const usesTextInput = ['discovery', 'strategy', 'verbal_identity', 'behavioural_identity', 'governance'].includes(node.category)
    const InputConnectors = usesTextInput ? [{ Icon: Type, kind: 'text' }]
        : node.type === 'video' ? [{ Icon: Type, kind: 'text' }, { Icon: Image, kind: 'asset' }, { Icon: Video, kind: 'asset' }, { Icon: Volume2, kind: 'audio' }]
        : node.type === 'image' ? [{ Icon: Type, kind: 'text' }, { Icon: Image, kind: 'asset' }]
        : node.type === 'audio' ? [{ Icon: Type, kind: 'text' }, { Icon: Volume2, kind: 'audio' }]
        : ['text', 'note', 'comment', 'ai_prompt'].includes(node.type) ? [{ Icon: Type, kind: 'text' }, { Icon: Video, kind: 'asset' }, { Icon: Image, kind: 'asset' }]
        : [{ Icon: ConnectorIcon, kind: 'default' }]
    const OutputConnectors = usesTextInput
        ? [
            { Icon: Image, kind: 'image', label: 'Imagem' },
            { Icon: Video, kind: 'video', label: 'Video' },
            { Icon: Volume2, kind: 'audio', label: 'Audio' },
            { Icon: FileText, kind: 'file', label: 'Ficheiro' },
            { Icon: StickyNote, kind: 'note', label: 'Nota' },
            { Icon: MessageSquare, kind: 'comment', label: 'Comentario' }
        ]
        : [{ Icon: ConnectorIcon, kind: 'default', label: 'Criar conexao' }]

    const handleResizeMouseDown = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        const startX = event.clientX
        const startY = event.clientY
        const startWidth = node.width || 340
        const startHeight = node.height || 220

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const width = Math.max(240, Math.round(startWidth + (moveEvent.clientX - startX) / zoom))
            const height = Math.max(160, Math.round(startHeight + (moveEvent.clientY - startY) / zoom))
            onResizeNode(node.id, width, height)
        }
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    const handleCopyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado!`)
    }

    // Render customized preview content inside the node
    const renderInlineContent = () => {
        const content = node.object?.content || {}

        // Media nodes expose their own operational surface instead of the
        // generic Brand Object preview. Upload handling is intentionally local
        // until the asset-storage endpoint is connected.
        if (['audio', 'image', 'video', 'file'].includes(node.type)) {
            const isAudio = node.type === 'audio'
            const accept = isAudio ? 'audio/*' : node.type === 'video' ? 'video/*' : node.type === 'image' ? 'image/*' : '*/*'
            const label = isAudio ? 'Carrega um áudio ou arrasta-o para aqui' : node.type === 'video' ? 'Carrega um vídeo ou arrasta-o para aqui' : node.type === 'image' ? 'Carrega uma imagem ou arrasta-a para aqui' : 'Carrega um ficheiro ou arrasta-o para aqui'
            return (
                <div className="mt-2 space-y-2.5 [&_textarea]:!border-0 [&_textarea]:!bg-transparent [&_textarea]:!p-0 [&_textarea]:!rounded-none">
                    <label className="flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 text-center transition hover:border-zinc-500 hover:bg-zinc-100">
                        <Upload className="mb-1 h-4 w-4 text-zinc-500" />
                        <span className="text-[11px] text-zinc-500">{mediaFile ? mediaFile.name : label}</span>
                        <input type="file" accept={accept} className="hidden" onChange={(event) => setMediaFile(event.target.files?.[0] || null)} />
                    </label>
                    <textarea value={mediaDescription} onChange={(event) => setMediaDescription(event.target.value)} placeholder={isAudio ? 'Descreve o áudio que queres criar ou usar…' : 'Descreve o conteúdo ou contexto…'} rows={2} className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[11px] text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400" />
                    {node.type !== 'file' && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            <select value={mediaModel} onChange={(event) => setMediaModel(event.target.value)} className="rounded-md border border-zinc-200 bg-white px-2 py-1 outline-none"><option>Auto</option><option>Brivio AI</option><option>External model</option></select>
                            <button onClick={() => setMediaQuantity(Math.max(1, mediaQuantity - 1))} className="rounded p-1 hover:bg-zinc-100"><Minus className="h-3 w-3" /></button>
                            <span className="w-4 text-center">{mediaQuantity}</span>
                            <button onClick={() => setMediaQuantity(mediaQuantity + 1)} className="rounded p-1 hover:bg-zinc-100"><Plus className="h-3 w-3" /></button>
                            <button onClick={() => onRunNodeAI(node.id)} className="ml-auto rounded-md bg-zinc-900 px-2 py-1 font-medium text-white">Gerar</button>
                        </div>
                    )}
                </div>
            )
        }

        // 1. Color System
        if (node.type === 'color_system' && content.palette && Array.isArray(content.palette)) {
            return (
                <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {content.palette.slice(0, 5).map((color: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); handleCopyText(color.hex, color.name); }}
                                className="group relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
                                title={`${color.name}: ${color.hex}`}
                            >
                                <div 
                                    className="w-7 h-7 rounded-full border border-white/20 shadow-md transition-shadow group-hover:shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-[9px] font-mono text-zinc-400 mt-0.5 group-hover:text-white">
                                    {color.hex}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )
        }

        // 2. Typography System
        if (node.type === 'typography_system' && content.primary) {
            return (
                <div className="space-y-2 mt-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-white tracking-tight">{content.primary.font}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Primária</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans tracking-wide italic">
                        Aa Bb Gg 123 — O ritual de excelência.
                    </p>
                    {content.display && (
                        <div className="pt-1.5 border-t border-white/5 flex items-baseline justify-between">
                            <span className="text-xs font-serif font-bold text-white/90">{content.display.font}</span>
                            <span className="text-[9px] text-zinc-400 font-mono">Display</span>
                        </div>
                    )}
                </div>
            )
        }

        // 3. Naming
        if (node.type === 'naming' && content.name) {
            return (
                <div className="space-y-1.5 mt-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 rounded-xl border border-purple-500/20 text-center">
                    <span className="text-xl font-black text-white tracking-wider font-tight">
                        {content.name}
                    </span>
                    {content.descriptor && (
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF0054]">
                            {content.descriptor}
                        </p>
                    )}
                    {content.meaning && (
                        <p className="text-[11px] text-zinc-300 italic pt-1 line-clamp-2">
                            "{content.meaning}"
                        </p>
                    )}
                </div>
            )
        }

        // 4. Positioning / Purpose / Manifesto
        if (node.type === 'positioning' || node.type === 'purpose' || node.type === 'brand_manifesto') {
            const text = content.statement || content.manifesto || content.valueProposition
            return (
                <div className="mt-2 relative pl-3 border-l-2 border-[#FF0054] py-0.5">
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans line-clamp-3">
                        "{text}"
                    </p>
                </div>
            )
        }

        // 5. Sonic Identity
        if (node.type === 'sonic_identity' || node.category === 'sensorial_identity') {
            return (
                <div className="mt-2 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white">{content.audioLogo ? 'Audio Logo' : 'Sound Signature'}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsPlayingAudio(!isPlayingAudio)
                                toast.info(isPlayingAudio ? "Áudio pausado" : "Reproduzindo Sonic Logo (Preview de Áudio)")
                            }}
                            className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                isPlayingAudio ? "bg-[#FF0054] text-white animate-pulse" : "bg-white/10 hover:bg-white/20 text-white"
                            )}
                        >
                            <Volume2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {/* Simulated Waveform */}
                    <div className="flex items-center gap-0.5 h-4 justify-center py-0.5">
                        {[40, 70, 20, 90, 60, 100, 45, 80, 30, 95, 60, 40, 85, 50, 30].map((h, i) => (
                            <span 
                                key={i} 
                                className={cn(
                                    "w-1 rounded-full transition-all",
                                    isPlayingAudio ? "bg-[#3A86FF] animate-pulse" : "bg-white/30"
                                )}
                                style={{ height: `${isPlayingAudio ? Math.max(15, Math.round(h * Math.random())) : h}%` }}
                            />
                        ))}
                    </div>
                </div>
            )
        }

        // 6. Brand Decision
        if (node.type === 'brand_decision' || content.decisionNumber) {
            return (
                <div className="mt-2 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                            Decisão #{String(content.decisionNumber || 1).padStart(3, '0')}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                            Oficial
                        </span>
                    </div>
                    <p className="text-xs text-zinc-200 line-clamp-2 font-medium">
                        {content.decision || node.object?.rationale}
                    </p>
                </div>
            )
        }

        // 7. Brand Guardian Audit
        if (node.type === 'brand_guardian_audit' || content.score) {
            return (
                <div className="mt-2 bg-zinc-900/60 p-2.5 rounded-xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white">Conformidade Geral</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {content.score || 96}%
                        </span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${content.score || 96}%` }} />
                    </div>
                </div>
            )
        }

        // Default: general summary or text preview
        const summaryText = content.summary || content.tagline || content.statement || content.campaignName || node.object?.rationale
        return (
            <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed mt-1">
                {summaryText || 'Nenhum conteúdo definido ainda.'}
            </p>
        )
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => {
                e.stopPropagation()
                onSelect(node.id, e.shiftKey || e.metaKey || e.ctrlKey)
            }}
            onDoubleClick={(e) => {
                e.stopPropagation()
                onOpenInspector(node)
            }}
            className={cn(
                "absolute cursor-grab active:cursor-grabbing select-none rounded-2xl transition-all duration-150 backdrop-blur-xl group",
                "bg-white border-2 border-zinc-200 text-left flex flex-col justify-between shadow-none",
                isSelected 
                    ? "ring-2 ring-[#3B82F6] border-[#3B82F6] shadow-none" 
                    : "border-zinc-200 hover:border-zinc-400",
                isApproved && "border-zinc-300 hover:border-zinc-500",
                isAiProposed && "border-zinc-300 hover:border-zinc-500"
            )}
            style={{
                left: node.x,
                top: node.y,
                width: node.width || 340,
                minHeight: node.height || 220,
                zIndex: isSelected ? 30 : 10
            }}
        >
            <div className="absolute -top-7 left-1 flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-zinc-900">
                <CategoryIcon className="h-3.5 w-3.5 text-zinc-700" />
                <span>{node.title}</span>
            </div>
            {/* Contextual inputs stack vertically on the left side. */}
            <div className="absolute -left-[37px] bottom-0 z-20 flex flex-col gap-4">
                {InputConnectors.map(({ Icon, kind }, index) => (
                    <button
                        key={`${kind}-${index}`}
                        type="button"
                        onMouseUp={(event) => {
                            event.stopPropagation()
                            onCompleteConnection(node.id, kind)
                        }}
                        className="rounded-full transition hover:scale-110 hover:ring-2 hover:ring-violet-300"
                    >
                    <div key={index} className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm" title="Entrada compatível">
                        <Icon className="h-4 w-4" />
                    </div>
                    </button>
                ))}
            </div>

            {/* Output Handle (Right Port) */}
            {!usesTextInput && (
            <div
                onMouseDown={(e) => {
                    e.stopPropagation()
                    onStartConnection(node.id, 'source', e)
                }}
                className={cn(
                    "absolute -right-[37px] top-0 w-8 h-8 rounded-full flex items-center justify-center",
                    "cursor-crosshair z-20 border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:scale-110 hover:border-zinc-500"
                )}
                title="Criar conexão (Output)"
            >
                <ConnectorIcon className="h-4 w-4" />
            </div>
            )}
            {usesTextInput && (
                <div className="absolute -right-[37px] top-0 z-20 flex flex-col gap-4">
                    {OutputConnectors.map(({ Icon, kind, label }) => (
                        <div
                            key={kind}
                            onMouseDown={(event) => {
                                event.stopPropagation()
                                onStartConnection(node.id, 'source', event, kind)
                            }}
                            className="flex h-8 w-8 cursor-crosshair items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:scale-110 hover:border-zinc-500"
                            title={label}
                        >
                            <Icon className="h-4 w-4" />
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                onMouseDown={handleResizeMouseDown}
        className="pointer-events-none absolute -bottom-1 -right-1 z-30 h-4 w-4 cursor-se-resize rounded-sm border border-zinc-300 bg-white opacity-0 transition-opacity before:absolute before:bottom-[3px] before:right-[3px] before:h-1.5 before:w-1.5 before:border-b-2 before:border-r-2 before:border-zinc-500 group-hover:pointer-events-auto group-hover:opacity-100"
                aria-label="Redimensionar no"
                title="Arrasta para redimensionar"
            />

            {/* Card Header */}
            <div className="p-3.5 pb-2">
                <div className="flex items-center justify-end gap-2 mb-2">
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                        {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <Check className="w-2.5 h-2.5" /> Oficial
                            </span>
                        )}
                        {isAiProposed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">
                                <Sparkles className="w-2.5 h-2.5 text-[#FF0054]" /> Proposta IA
                            </span>
                        )}
                        {status === 'draft' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                                Rascunho
                            </span>
                        )}

                        {/* Options Menu Button */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuOpen(!menuOpen)
                                }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpen && (
                                <div 
                                    className="absolute right-0 top-7 w-44 bg-[#1B1B1F] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => { setMenuOpen(false); onOpenInspector(node); }}
                                        className="w-full px-3 py-1.5 flex items-center gap-2 text-zinc-200 hover:bg-white/10 text-left cursor-pointer"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-zinc-400" /> Inspecionar Nó
                                    </button>
                                    <button
                                        onClick={() => { setMenuOpen(false); onRunNodeAI(node.id); }}
                                        className="w-full px-3 py-1.5 flex items-center gap-2 text-[#FF0054] hover:bg-white/10 text-left cursor-pointer font-medium"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> Regenerar com IA
                                    </button>
                                    <div className="h-[1px] bg-white/10 my-1" />
                                    {!isApproved && (
                                        <button
                                            onClick={() => { setMenuOpen(false); onApproveNode(node.id); }}
                                            className="w-full px-3 py-1.5 flex items-center gap-2 text-emerald-400 hover:bg-white/10 text-left cursor-pointer"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Aprovar como Oficial
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setMenuOpen(false); onDeleteNode(node.id); }}
                                        className="w-full px-3 py-1.5 flex items-center gap-2 text-red-400 hover:bg-red-500/10 text-left cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" /> Eliminar Nó
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Custom Inline Body */}
                <div className="mt-1">
                    {renderInlineContent()}
                </div>
            </div>

            {/* Node Footer Actions */}
            <div className="p-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] bg-zinc-50 rounded-b-2xl">
                {/* Version & History Indicator */}
                <div className="flex items-center gap-1.5 text-zinc-500 font-mono">
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                        v{node.object?.version || 1}
                    </span>
                    {node.outputs_history?.length > 1 && (
                        <span className="text-[9px] text-zinc-400" title={`${node.outputs_history.length} versões geradas`}>
                            ({node.outputs_history.length} iterações)
                        </span>
                    )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1">
                    {isAiProposed && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onApproveNode(node.id)
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 font-medium text-[10px] flex items-center gap-1 border border-emerald-500/30 transition-all cursor-pointer"
                                title="Aprovar e integrar ao Brand Context oficial"
                            >
                                <Check className="w-3 h-3" /> Aprovar
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRejectNode(node.id)
                                }}
                                className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                                title="Rejeitar proposta"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    )}

                    {/* Run AI button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRunNodeAI(node.id)
                        }}
                        disabled={node.is_executing}
                        className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                            node.is_executing 
                                ? "bg-[#FF0054]/20 text-[#FF0054] animate-pulse border border-[#FF0054]/40" 
                                : "bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 hover:border-zinc-300"
                        )}
                        title="Executar inteligência artificial para este nó"
                    >
                        <Sparkles className={cn("w-3 h-3 text-[#FF0054]", node.is_executing && "animate-spin")} />
                        <span>{node.is_executing ? "Executando..." : "Executar"}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
