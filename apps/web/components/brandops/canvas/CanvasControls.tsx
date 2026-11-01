"use client"

import React from "react"
import { 
    Plus, Sparkles, ZoomIn, ZoomOut, Maximize2, RotateCcw, RotateCw,
    HelpCircle, ShieldCheck, BookOpen, Layers, GitBranch,
    MousePointer, Hand, ToggleLeft, ToggleRight, ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CanvasControlsProps {
    spaceName: string
    brandName: string
    brandId: string
    zoom: number
    onZoomIn: () => void
    onZoomOut: () => void
    onZoomReset: () => void
    onFitToScreen: () => void
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    mode: 'select' | 'pan'
    setMode: (m: 'select' | 'pan') => void
    viewMode: 'canvas' | 'brand_map'
    setViewMode: (v: 'canvas' | 'brand_map') => void
    useOfficialContext: boolean
    setUseOfficialContext: (val: boolean) => void
    onOpenAddNode: () => void
    onOpenCreateBrandAI: () => void
    onOpenAskBrand: () => void
    onOpenBrandGuardian: () => void
    onOpenBrandBookExport: () => void
    completenessScore: number
}

export function CanvasControls({
    spaceName,
    brandName,
    brandId,
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onFitToScreen,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    mode,
    setMode,
    viewMode,
    setViewMode,
    useOfficialContext,
    setUseOfficialContext,
    onOpenAddNode,
    onOpenCreateBrandAI,
    onOpenAskBrand,
    onOpenBrandGuardian,
    onOpenBrandBookExport,
    completenessScore
}: CanvasControlsProps) {
    return (
        <>
            {/* Compact workspace rail: tools remain available without consuming the canvas. */}
            <aside className="fixed left-5 top-1/2 z-40 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.10)]">
                <button onClick={onOpenAddNode} className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 transition hover:bg-zinc-100" title="Adicionar nó">
                    <Plus className="h-5 w-5" />
                </button>
                <button onClick={() => setMode('select')} className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition", mode === 'select' ? "bg-[#171719] text-white" : "text-zinc-500 hover:bg-zinc-100")} title="Selecionar (V)">
                    <MousePointer className="h-4 w-4" />
                </button>
                <button onClick={() => setMode('pan')} className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition", mode === 'pan' ? "bg-[#171719] text-white" : "text-zinc-500 hover:bg-zinc-100")} title="Mover canvas (H)">
                    <Hand className="h-4 w-4" />
                </button>
                <div className="my-1 border-t border-zinc-100" />
                <button onClick={onUndo} disabled={!canUndo} className="flex h-9 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-30" title="Desfazer">
                    <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={onRedo} disabled={!canRedo} className="flex h-9 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-30" title="Refazer">
                    <RotateCw className="h-4 w-4" />
                </button>
            </aside>
            {/* Top Bar Header */}
            <header className="fixed top-3 left-4 right-4 z-40 pointer-events-none flex items-center justify-between">
                {/* Left: Brand & Space Name + Back to Spaces */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <Link
                        href="/brandops"
                        className="w-10 h-10 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-950 transition-all shadow-sm cursor-pointer"
                        title="Voltar para a BrandOps Home"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#EC4899] font-bold">
                                {brandName || 'BrandOps Engine'}
                            </span>
                            <span className="text-sm font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
                                {spaceName}
                            </span>
                        </div>

                        <div className="h-6 w-[1px] bg-white/10" />

                        {/* Official Brand Context Switch */}
                        <button
                            onClick={() => setUseOfficialContext(!useOfficialContext)}
                            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors text-zinc-500 hover:text-zinc-900"
                            title="Alternar se o espaço alimenta e consome o Brand Context oficial"
                        >
                            <span className="text-[11px] text-zinc-400">Contexto Oficial:</span>
                            {useOfficialContext ? (
                                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono">
                                    <ToggleRight className="w-5 h-5 text-emerald-400" /> ON
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-zinc-500 text-xs font-bold font-mono">
                                    <ToggleLeft className="w-5 h-5 text-zinc-500" /> OFF
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Center: View Switcher (Canvas / Brand Map) */}
                    <div className="pointer-events-auto bg-white border border-zinc-200 rounded-xl p-1 shadow-sm flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('canvas')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                            viewMode === 'canvas' 
                                ? "bg-zinc-900 text-white shadow-sm" 
                                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        )}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Canvas</span>
                    </button>
                    <button
                        onClick={() => setViewMode('brand_map')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                            viewMode === 'brand_map' 
                                ? "bg-zinc-900 text-white shadow-sm" 
                                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        )}
                    >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Brand Map</span>
                    </button>
                </div>

                {/* Right: Quick Action CTAs */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Completeness Badge */}
                    <div 
                        className="bg-[#141416]/90 border border-white/10 rounded-2xl px-3.5 py-2 shadow-2xl backdrop-blur-xl flex items-center gap-2"
                        title="Completude da marca no Brand Digital Twin"
                    >
                        <span className="text-[10px] text-zinc-400 font-mono">Twin:</span>
                        <div className="w-16 bg-white/10 h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-[#06D6A0] via-[#FF0054] to-[#88007F] h-full rounded-full transition-all duration-500" 
                                style={{ width: `${completenessScore}%` }} 
                            />
                        </div>
                        <span className="text-xs font-bold font-mono text-white">{completenessScore}%</span>
                    </div>

                    {/* Ask Brand Button */}
                    <button
                        onClick={onOpenAskBrand}
                        className="h-10 px-3.5 rounded-2xl bg-[#141416]/90 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-xl backdrop-blur-xl cursor-pointer"
                        title="Fazer perguntas ao Brand Context da marca"
                    >
                        <HelpCircle className="w-4 h-4 text-[#3A86FF]" />
                        <span className="hidden sm:inline">Pergunte à Marca</span>
                    </button>

                    {/* Brand Guardian Button */}
                    <button
                        onClick={onOpenBrandGuardian}
                        className="h-10 px-3.5 rounded-2xl bg-[#141416]/90 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-xl backdrop-blur-xl cursor-pointer"
                        title="Auditar conformidade e consistência da marca"
                    >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">Guardian</span>
                    </button>

                    {/* Export to Brand Book Button */}
                    <button
                        onClick={onOpenBrandBookExport}
                        className="h-10 px-3.5 rounded-2xl bg-[#141416]/90 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-xl backdrop-blur-xl cursor-pointer"
                        title="Exportar objetos aprovados diretamente para o Brand Book oficial"
                    >
                        <BookOpen className="w-4 h-4 text-[#FF0054]" />
                        <span className="hidden sm:inline">Brand Book</span>
                    </button>

                    {/* "Criar Marca com IA" Glowing Primary CTA */}
                    <button
                        onClick={onOpenCreateBrandAI}
                        className="h-10 px-4 rounded-2xl bg-gradient-to-r from-[#FF0054] via-[#88007F] to-[#311C99] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_25px_rgba(255,0,84,0.4)] hover:shadow-[0_0_35px_rgba(255,0,84,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Criar com IA</span>
                    </button>
                </div>
            </header>

            {/* Bottom Floating Canvas Toolbar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                <div className="bg-[#141416]/95 border border-white/10 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl flex items-center gap-2">
                    {/* Select / Hand Tools */}
                    <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                        <button
                            onClick={() => setMode('select')}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                                mode === 'select' ? "bg-white text-black font-bold shadow-md" : "text-zinc-400 hover:text-white hover:bg-white/10"
                            )}
                            title="Ferramenta Seleção (V)"
                        >
                            <MousePointer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setMode('pan')}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                                mode === 'pan' ? "bg-white text-black font-bold shadow-md" : "text-zinc-400 hover:text-white hover:bg-white/10"
                            )}
                            title="Mão / Panorâmica (H ou Espaço)"
                        >
                            <Hand className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Undo / Redo */}
                    <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                                canUndo ? "text-zinc-200 hover:bg-white/10 hover:text-white" : "text-zinc-600 cursor-not-allowed"
                            )}
                            title="Desfazer (Ctrl+Z)"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onRedo}
                            disabled={!canRedo}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                                canRedo ? "text-zinc-200 hover:bg-white/10 hover:text-white" : "text-zinc-600 cursor-not-allowed"
                            )}
                            title="Refazer (Ctrl+Y)"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add Node Button */}
                    <button
                        onClick={onOpenAddNode}
                        className="px-3.5 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/10 hover:border-white/20"
                        title="Adicionar Nó ao Canvas (/ ou Espaço)"
                    >
                        <Plus className="w-4 h-4 text-[#FF0054]" />
                        <span>Adicionar Nó</span>
                    </button>

                    <div className="h-6 w-[1px] bg-white/10" />

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onZoomOut}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Zoom Out (-)"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onZoomReset}
                            className="px-2 py-1 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Redefinir Zoom para 100%"
                        >
                            {Math.round(zoom * 100)}%
                        </button>
                        <button
                            onClick={onZoomIn}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Zoom In (+)"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onFitToScreen}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Ajustar ao Ecrã (Zoom to Fit)"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
