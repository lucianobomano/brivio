"use client"

import * as React from "react"
import { CreditCard, ArrowUpCircle, Download, Calendar, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function BillingSettings() {
    const invoices = [
        { id: "INV-001", date: "01 Jan 2024", amount: "29.90€", status: "paid" },
        { id: "INV-002", date: "01 Dez 2023", amount: "29.90€", status: "paid" },
        { id: "INV-003", date: "01 Nov 2023", amount: "29.90€", status: "paid" },
    ]

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-white mb-2">Faturação</h3>
                    <p className="text-text-secondary">Gere a tua subscrição, métodos de pagamento e faturas.</p>
                </div>
            </div>

            {/* Current Plan */}
            <div className="p-8 bg-gradient-to-br from-accent-indigo/10 to-transparent border border-accent-indigo/20 rounded-2xl flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-4">
                    <Badge className="bg-accent-indigo text-white text-[9px] font-black uppercase tracking-widest border-transparent">Plano Atual</Badge>
                    <div>
                        <h4 className="text-3xl font-black text-white">Brivio Pro</h4>
                        <p className="text-text-secondary mt-1">29,90€ / mês • Próxima renovação a 1 de Fevereiro</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Propostas Ilimitadas
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Equipa (Até 5 Membros)
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Suporte Prioritário
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                    <Button className="w-full bg-white text-black font-bold h-12 rounded-xl hover:bg-white/90 shadow-lg shadow-white/5">
                        Fazer Upgrade
                    </Button>
                    <Button variant="ghost" className="w-full text-text-secondary hover:text-white text-[10px] font-black uppercase tracking-widest">
                        Cancelar Subscrição
                    </Button>
                </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-t border-bg-3 pt-10">
                    <CreditCard className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Método de Pagamento</h4>
                </div>

                <div className="p-6 bg-bg-2 border border-bg-3 rounded-2xl flex items-center justify-between hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-10 bg-white/5 border border-bg-3 rounded-lg flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="w-8" />
                        </div>
                        <div>
                            <div className="font-bold text-white">Mastercard •••• 4242</div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">Expira em 12/26</p>
                        </div>
                    </div>
                    <Button variant="outline" className="h-10 px-6 border-bg-3 bg-bg-1 hover:bg-bg-3 text-white text-[10px] font-black uppercase tracking-widest">
                        Substituir
                    </Button>
                </div>
            </div>

            {/* Invoices */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-t border-bg-3 pt-10">
                    <Calendar className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Histórico de Faturas</h4>
                </div>

                <div className="border border-bg-3 rounded-2xl overflow-hidden bg-white/[0.01]">
                    <div className="divide-y divide-bg-3">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">Identificador</span>
                                        <span className="font-bold text-white">{inv.id}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">Data de Emissão</span>
                                        <span className="text-sm text-text-secondary">{inv.date}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">Valor Total</span>
                                        <span className="text-sm text-white font-medium">{inv.amount}</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-bg-3 hover:bg-accent-indigo hover:text-white transition-all">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
