"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, BookOpen, Check, ArrowRight, ExternalLink } from "lucide-react"
import { BrandNode } from "../types"
import { exportToBrandbook } from "@/app/actions/brandops"
import { toast } from "sonner"
import Link from "next/link"

interface BrandBookExportModalProps {
    isOpen: boolean
    onClose: () => void
    nodes: BrandNode[]
    brandId: string
    brandName: string
}

export function BrandBookExportModal({
    isOpen,
    onClose,
    nodes,
    brandId,
    brandName
}: BrandBookExportModalProps) {
    const approvedNodes = nodes.filter(n => n.object?.status === 'approved')
    const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>(
        approvedNodes.map(n => n.object_id)
    )
    const [isExporting, setIsExporting] = useState(false)
    const [exportedBrandbookId, setExportedBrandbookId] = useState<string | null>(null)

    if (!isOpen) return null

    const toggleSelect = (id: string) => {
        setSelectedObjectIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        setSelectedObjectIds(approvedNodes.map(n => n.object_id))
    }

    const handleExport = async () => {
        if (selectedObjectIds.length === 0) {
            toast.error("Selecione pelo menos um Brand Object aprovado.")
            return
        }

        setIsExporting(true)
        try {
            const res = await exportToBrandbook(brandId, selectedObjectIds)
            if (res.success) {
                setExportedBrandbookId(res.brandbookId)
                toast.success(`${res.exportedCount} módulos sincronizados com o Brand Book com sucesso!`)
            } else {
                toast.error(res.error || "Erro ao exportar para o Brand Book")
            }
        } catch (e: any) {
            toast.error(e.message || "Falha na sincronização")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-xl bg-[#141416] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 text-white overflow-hidden max-h-[85vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#FF0054]/15 border border-[#FF0054]/30 flex items-center justify-center text-[#FF0054] shadow-lg">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white font-tight">
                                    Publicar no Brand Book
                                </h3>
                                <p className="text-xs text-zinc-400 font-mono">
                                    Conecte os Brand Objects aprovados à publicação oficial
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Success state */}
                    {exportedBrandbookId ? (
                        <div className="py-10 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl">
                                <Check className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-white">Brand Book Atualizado!</h4>
                            <p className="text-xs text-zinc-400 max-w-md mx-auto">
                                Os Brand Objects aprovados foram integrados na estrutura editorial de {brandName}. O Brand Book funciona agora como uma view publicada sincronizada com o BrandOps.
                            </p>
                            <div className="pt-4 flex items-center justify-center gap-3">
                                <Link
                                    href="/brandbooks"
                                    className="px-6 h-11 rounded-2xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl"
                                >
                                    <span>Ver Meus Brand Books</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                    onClick={onClose}
                                    className="px-5 h-11 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Continuar no Canvas
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Selection list */}
                            <div className="py-4 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-400">
                                        Objetos Aprovados Disponíveis ({approvedNodes.length})
                                    </span>
                                    <button
                                        onClick={selectAll}
                                        className="text-[#FF0054] font-bold hover:underline cursor-pointer text-xs"
                                    >
                                        Selecionar Todos
                                    </button>
                                </div>

                                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                    {approvedNodes.length === 0 ? (
                                        <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                                            <p className="text-xs text-zinc-400">
                                                Nenhum nó aprovado ainda no canvas. Para publicar no Brand Book, aprove primeiro os nós com a marcação "Aprovar como Oficial".
                                            </p>
                                        </div>
                                    ) : (
                                        approvedNodes.map(node => {
                                            const isSelected = selectedObjectIds.includes(node.object_id)
                                            return (
                                                <div
                                                    key={node.id}
                                                    onClick={() => toggleSelect(node.object_id)}
                                                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "bg-white/10 border-[#FF0054]"
                                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                                            isSelected ? "bg-[#FF0054] border-[#FF0054] text-white" : "border-white/20"
                                                        }`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                        <div>
                                                            <h5 className="text-xs font-bold text-white">{node.title}</h5>
                                                            <span className="text-[10px] text-zinc-400 font-mono">{node.type}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                                                        Aprovado
                                                    </span>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs text-zinc-500 font-mono">
                                    {selectedObjectIds.length} selecionados para publicação
                                </span>

                                <button
                                    onClick={handleExport}
                                    disabled={approvedNodes.length === 0 || isExporting}
                                    className="px-6 h-11 rounded-2xl bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl cursor-pointer"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    <span>{isExporting ? "Publicando..." : "Gerar / Sincronizar Brand Book"}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
