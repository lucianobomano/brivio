"use client"

import * as React from "react"
import { Bell, Mail, Smartphone, Zap, Eye, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { UserProfile, updateProfile } from "@/app/actions/settings"
import { toast } from "sonner"

interface NotificationSettingsProps {
    user: UserProfile | null
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
    const [isSaving, setIsSaving] = React.useState(false)
    const [prefs, setPrefs] = React.useState(user?.notification_preferences || {
        channels: { email: true, push: true, slack: false },
        events: { proposal_viewed: true, payment_received: true }
    })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateProfile({ notification_preferences: prefs })
            if (result.success) {
                toast.success("Preferências de notificação salvas")
            } else {
                toast.error(result.error || "Erro ao salvar preferências")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsSaving(false)
        }
    }

    const toggleChannel = (channel: keyof typeof prefs.channels) => {
        setPrefs({
            ...prefs,
            channels: { ...prefs.channels, [channel]: !prefs.channels[channel] }
        })
    }

    const toggleEvent = (event: keyof typeof prefs.events) => {
        setPrefs({
            ...prefs,
            events: { ...prefs.events, [event]: !prefs.events[event] }
        })
    }

    return (
        <div className="space-y-10">
            <div>
                <h3 className="text-2xl font-black text-white mb-2">Notificações</h3>
                <p className="text-text-secondary">Escolhe como e quando queres ser avisado sobre atividades importantes.</p>
            </div>

            {/* Channels */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Canais de Comunicação</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-bg-2 border border-bg-3 rounded-2xl flex flex-col justify-between gap-6 transition-all hover:border-accent-indigo/20">
                        <div className="space-y-2">
                            <Mail className="w-5 h-5 text-text-secondary" />
                            <div className="font-bold text-white">Email</div>
                            <p className="text-[10px] text-text-secondary leading-normal">
                                Receber alertas na tua caixa de entrada principal.
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-accent-indigo">Ativado</span>
                            <Switch checked={prefs.channels.email} onCheckedChange={() => toggleChannel('email')} />
                        </div>
                    </div>

                    <div className="p-6 bg-bg-2 border border-bg-3 rounded-2xl flex flex-col justify-between gap-6 transition-all hover:border-accent-indigo/20">
                        <div className="space-y-2">
                            <Smartphone className="w-5 h-5 text-text-secondary" />
                            <div className="font-bold text-white">App Push</div>
                            <p className="text-[10px] text-text-secondary leading-normal">
                                Notificações diretas no teu browser ou telemóvel.
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-accent-indigo">Ativado</span>
                            <Switch checked={prefs.channels.push} onCheckedChange={() => toggleChannel('push')} />
                        </div>
                    </div>

                    <div className="p-6 bg-bg-2 border border-bg-3 rounded-2xl flex flex-col justify-between gap-6 transition-all hover:border-accent-indigo/20">
                        <div className="space-y-2">
                            <Zap className="w-5 h-5 text-text-secondary" />
                            <div className="font-bold text-white">Slack</div>
                            <p className="text-[10px] text-text-secondary leading-normal">
                                Alertas integrados no teu workspace do Slack.
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-text-secondary opacity-40">Desativado</span>
                            <Switch checked={prefs.channels.slack} onCheckedChange={() => toggleChannel('slack')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Events */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-t border-bg-3 pt-10">
                    <Zap className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Eventos Monitorizados</h4>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-bg-2/50 border border-bg-3 rounded-2xl hover:bg-bg-2 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Eye className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-white">Proposta Visualizada</div>
                                <p className="text-xs text-text-secondary">Avisa-me assim que um cliente abrir uma proposta enviada.</p>
                            </div>
                        </div>
                        <Switch checked={prefs.events.proposal_viewed} onCheckedChange={() => toggleEvent('proposal_viewed')} />
                    </div>

                    <div className="flex items-center justify-between p-6 bg-bg-2/50 border border-bg-3 rounded-2xl hover:bg-bg-2 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-white">Pagamento Recebido</div>
                                <p className="text-xs text-text-secondary">Notifica sobre novos pagamentos liquidados nas faturas.</p>
                            </div>
                        </div>
                        <Switch checked={prefs.events.payment_received} onCheckedChange={() => toggleEvent('payment_received')} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-bg-3">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-12 px-8 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-full font-bold shadow-lg shadow-accent-indigo/20 active:scale-95 transition-all"
                >
                    {isSaving ? "A guardar..." : "Salvar Preferências"}
                </Button>
            </div>
        </div>
    )
}
