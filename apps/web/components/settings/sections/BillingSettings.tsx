"use client"

import * as React from "react"
import { ArrowUpCircle, Calendar, Clock, HardDrive, Landmark, ShieldCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { findPlan } from "@/lib/pricing-plans"
import { openUpgrade, useMyBilling } from "@/components/billing/upgrade"

const STATUS: Record<string, { label: string, cls: string }> = {
    active: { label: "Ativo", cls: "text-emerald-400" },
    pending: { label: "Em análise", cls: "text-amber-400" },
    rejected: { label: "Recusado", cls: "text-red-400" },
    cancelled: { label: "Terminado", cls: "text-text-secondary" },
}
const date = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }) : "—"
const money = (n: number, cur: string) => { try { return new Intl.NumberFormat("pt-PT", { style: "currency", currency: cur || "AOA", maximumFractionDigits: cur === "AOA" ? 0 : 2 }).format(n) } catch { return `${n} ${cur}` } }

export function BillingSettings() {
    const { billing: b } = useMyBilling()
    const plan = findPlan(b?.plan || "free")
    const isFree = !b || b.plan === "free"

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-white mb-2">Faturação</h3>
                    <p className="text-text-secondary">O seu plano, os pedidos de subscrição e o histórico de pagamentos.</p>
                </div>
            </div>

            {b?.pending && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 flex items-start gap-3 text-sm text-white">
                    <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <span><strong>O pedido do plano {b.pending.planName} está em análise</strong> desde {date(b.pending.createdAt)}. O plano fica ativo assim que o pagamento for validado (2 a 24 horas).</span>
                </div>
            )}
            {b?.rejected && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 flex items-start gap-3 text-sm text-white">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span>O pedido do plano {b.rejected.planName} não foi aprovado{b.rejected.reason ? `: ${b.rejected.reason}` : "."} Pode enviar um novo pedido.</span>
                </div>
            )}

            {/* Current Plan */}
            <div className="p-8 bg-gradient-to-br from-accent-indigo/10 to-transparent border border-accent-indigo/20 rounded-2xl flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-4">
                    <Badge className="bg-accent-indigo text-white text-[9px] font-black uppercase tracking-widest border-transparent">Plano Atual</Badge>
                    <div>
                        <h4 className="text-3xl font-black text-white">{b ? b.planName : "…"}</h4>
                        <p className="text-text-secondary mt-1">
                            {isFree ? "Gratuito" : `${plan.price} ${plan.period}`}
                            {b?.since ? ` • Ativo desde ${date(b.since)}` : ""}
                            {b?.renewsAt ? ` • Renova a ${date(b.renewsAt)}` : ""}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                            <HardDrive className="w-4 h-4 text-emerald-500" />
                            {b ? (b.storageLimitGB === Infinity ? "Armazenamento ilimitado" : `${b.storageLimitGB} GB de armazenamento`) : "…"}
                        </div>
                        {plan.features.filter(f => f.included && !/Armazenamento/i.test(f.name)).slice(0, 3).map(f => (
                            <div key={f.name} className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                {f.name}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                    <Button onClick={() => openUpgrade({ reason: "plan" })} className="w-full bg-white text-black font-bold h-12 rounded-xl hover:bg-white/90 shadow-lg shadow-white/5 gap-2">
                        <ArrowUpCircle className="w-4 h-4" /> {isFree ? "Fazer Upgrade" : "Mudar de plano"}
                    </Button>
                </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-t border-bg-3 pt-10">
                    <Landmark className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Método de Pagamento</h4>
                </div>
                <div className="p-6 bg-bg-2 border border-bg-3 rounded-2xl text-sm text-text-secondary">
                    Os planos são pagos por transferência bancária ou referência. Depois de pagar, envie o comprovativo no checkout; validamos o pagamento e ativamos o plano.
                </div>
            </div>

            {/* History */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-t border-bg-3 pt-10">
                    <Calendar className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Histórico de Pagamentos</h4>
                </div>

                {!b ? (
                    <p className="text-sm text-text-secondary">A carregar…</p>
                ) : b.history.length === 0 ? (
                    <p className="text-sm text-text-secondary">Ainda não há pagamentos.</p>
                ) : (
                    <div className="border border-bg-3 rounded-2xl overflow-hidden bg-white/[0.01]">
                        <div className="divide-y divide-bg-3">
                            {b.history.map((h) => (
                                <div key={h.id} className="flex items-center justify-between gap-6 px-6 py-5 hover:bg-white/[0.02] transition-colors flex-wrap">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">Plano</span>
                                        <span className="font-bold text-white">{h.planName}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">Data</span>
                                        <span className="text-sm text-text-secondary">{date(h.createdAt)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">Valor</span>
                                        <span className="text-sm text-white font-medium">{money(h.amount, h.currency)}</span>
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${STATUS[h.status]?.cls || "text-text-secondary"}`}>{STATUS[h.status]?.label || h.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
