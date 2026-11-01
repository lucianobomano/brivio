"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Sparkles, RefreshCw, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BrandGuardianModalProps {
    isOpen: boolean
    onClose: () => void
    brandName: string
}

interface AuditCheck {
    category: string
    title: string
    status: 'pass' | 'warning' | 'fail'
    detail: string
    recommendation?: string
}

export function BrandGuardianModal({
    isOpen,
    onClose,
    brandName
}: BrandGuardianModalProps) {
    const [isFixing, setIsFixing] = useState(false)
    const [checks, setChecks] = useState<AuditCheck[]>([
        {
            category: "Identidade Visual",
            title: "Contraste & Acessibilidade das Cores",
            status: "pass",
            detail: "Todas as combinações da paleta atendem à directriz WCAG AAA de contraste (mínimo 7.1:1 para texto normal)."
        },
        {
            category: "Identidade Visual",
            title: "Área de Proteção & Escala do Logotipo",
            status: "pass",
            detail: "Margem mínima de segurança respeitada em 100% dos nós de ativação e embalagem."
        },
        {
            category: "Identidade Verbal",
            title: "Conformidade do Tom de Voz",
            status: "warning",
            detail: "Detectado uso de adjetivos comerciais comuns ('barato', 'promoção') em 1 rascunho de campanha.",
            recommendation: "Substituir por 'distinção acessível' ou 'edição de abertura'."
        },
        {
            category: "Estratégia",
            title: "Alinhamento com o Propósito da Marca",
            status: "pass",
            detail: "Todas as mensagens-chave convergem para a celebração da origem e impacto regenerativo."
        },
        {
            category: "Fotografia & Imagens",
            title: "Diretriz de Tratamento Cromático",
            status: "warning",
            detail: "Luz fria detectada em mockups de redes sociais. A regra oficial exige tons terrosos quentes e iluminação natural lateral.",
            recommendation: "Aplicar o LUT 'Warm Terreiro' do BrandOps nas imagens."
        }
    ])

    if (!isOpen) return null

    const passCount = checks.filter(c => c.status === 'pass').length
    const warnCount = checks.filter(c => c.status === 'warning').length
    const failCount = checks.filter(c => c.status === 'fail').length

    const overallScore = Math.round((passCount / checks.length) * 100)

    const handleAutoFix = () => {
        setIsFixing(true)
        setTimeout(() => {
            setChecks(prev => prev.map(c => ({
                ...c,
                status: 'pass',
                detail: c.status === 'warning' ? `Corrigido automaticamente com as diretrizes oficiais do BrandOps.` : c.detail
            })))
            setIsFixing(false)
            toast.success("Inconsistências corrigidas com sucesso pelo BrandOps Guardian!")
        }, 1200)
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
                    className="relative w-full max-w-2xl bg-[#141416] border border-white/10 rounded-3xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] z-10 text-white overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white font-tight">
                                    Brand Guardian — Auditoria de Marca
                                </h3>
                                <p className="text-xs text-zinc-400 font-mono">
                                    Conformidade em tempo real contra as regras oficiais de {brandName}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Score Bar */}
                    <div className="py-6 border-b border-white/10 flex items-center justify-between bg-[#0E0E10] px-6 -mx-8">
                        <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                                Pontuação Geral de Conformidade
                            </span>
                            <div className="text-4xl font-black text-white font-mono flex items-baseline gap-2 mt-1">
                                <span className={cn(overallScore >= 90 ? "text-emerald-400" : "text-amber-400")}>
                                    {overallScore}%
                                </span>
                                <span className="text-xs text-zinc-400 font-normal">
                                    ({passCount} conformes, {warnCount} atenções)
                                </span>
                            </div>
                        </div>

                        {warnCount > 0 && (
                            <button
                                onClick={handleAutoFix}
                                disabled={isFixing}
                                className="px-5 h-11 rounded-2xl bg-gradient-to-r from-[#FF0054] to-[#88007F] text-white text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                            >
                                <Wand2 className={cn("w-4 h-4", isFixing && "animate-spin")} />
                                <span>{isFixing ? "Corrigindo..." : "Corrigir com BrandOps"}</span>
                            </button>
                        )}
                    </div>

                    {/* Checks List */}
                    <div className="flex-1 overflow-y-auto py-6 space-y-3">
                        {checks.map((c, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all text-left space-y-1.5",
                                    c.status === 'pass' && "bg-emerald-500/5 border-emerald-500/20",
                                    c.status === 'warning' && "bg-amber-500/5 border-amber-500/25",
                                    c.status === 'fail' && "bg-red-500/5 border-red-500/25"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {c.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                        {c.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                                        {c.status === 'fail' && <XCircle className="w-4 h-4 text-red-400" />}
                                        <h4 className="text-xs font-bold text-white">{c.title}</h4>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                        {c.category}
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-300 leading-relaxed pl-6">
                                    {c.detail}
                                </p>

                                {c.recommendation && (
                                    <div className="pl-6 pt-1 text-[11px] text-amber-300 font-medium">
                                        💡 Recomendação: {c.recommendation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span>Auditoria contínua baseada em Brand Objects oficiais</span>
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
