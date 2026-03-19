"use client"

import * as React from "react"
import { Zap, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function IntegrationSettings() {
    const integrations = [
        {
            id: "stripe",
            name: "Stripe",
            description: "Recebe pagamentos por cartão de crédito e debito nas tuas propostas.",
            icon: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
            status: "connected",
            color: "#635BFF"
        },
        {
            id: "slack",
            name: "Slack",
            description: "Notificações de propostas e tarefas diretamente nos teus canais.",
            icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
            status: "disconnected",
            color: "#4A154B"
        },
        {
            id: "google_calendar",
            name: "Google Calendar",
            description: "Sincroniza datas de entrega e reuniões com o teu calendário.",
            icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
            status: "disconnected",
            color: "#4285F4"
        },
        {
            id: "hubspot",
            name: "HubSpot",
            description: "Sincroniza contactos e negócios entre o teu CRM e a Brivio.",
            icon: "https://upload.wikimedia.org/wikipedia/commons/3/3f/HubSpot_Logo.svg",
            status: "disconnected",
            color: "#FF7A59"
        }
    ]

    return (
        <div className="space-y-10">
            <div>
                <h3 className="text-2xl font-black text-white mb-2">Integrações</h3>
                <p className="text-text-secondary">Conecta ferramentas externas para automatizar o teu fluxo de trabalho.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((app) => (
                    <div key={app.id} className="p-6 bg-bg-2 border border-bg-3 rounded-2xl flex flex-col justify-between gap-8 transition-all hover:bg-white/[0.02] hover:border-accent-indigo/20">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden border border-bg-3 shadow-sm">
                                    <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                                </div>
                                {app.status === "connected" ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Ligado
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-text-secondary/60 text-[10px] font-black uppercase tracking-widest">
                                        Desligado
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">{app.name}</h4>
                                <p className="text-xs text-text-secondary leading-relaxed mt-1">
                                    {app.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {app.status === "connected" ? (
                                <>
                                    <Button variant="outline" className="flex-1 bg-bg-1 border-bg-3 hover:bg-bg-3 text-white text-[10px] font-black uppercase tracking-widest h-10 px-0">
                                        Configurar
                                    </Button>
                                    <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest h-10 px-4">
                                        Desligar
                                    </Button>
                                </>
                            ) : (
                                <Button className="w-full bg-white text-black font-bold h-10 rounded-xl hover:bg-white/90 flex items-center justify-center gap-2">
                                    Conectar {app.name}
                                    <ExternalLink className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-accent-indigo/5 border border-dashed border-accent-indigo/20 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
                <Zap className="w-10 h-10 text-accent-indigo opacity-40" />
                <div>
                    <h4 className="font-bold text-white">Solicitar Integração</h4>
                    <p className="text-xs text-text-secondary mt-1">Não encontras a ferramenta que usas? Sugere-nos a próxima conexão.</p>
                </div>
                <Button variant="ghost" className="text-accent-indigo text-[10px] font-black uppercase tracking-widest hover:bg-accent-indigo/10">
                    Sugerir Ferramenta
                </Button>
            </div>
        </div>
    )
}
