"use client"

import * as React from "react"
import { Mail, Server, Shield, Send, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorkspaceSettings, updateWorkspaceSettings } from "@/app/actions/settings"
import { toast } from "sonner"

interface SMTPSettingsProps {
    workspace: WorkspaceSettings | null
}

export function SMTPSettings({ workspace }: SMTPSettingsProps) {
    const [isSaving, setIsSaving] = React.useState(false)
    const [config, setConfig] = React.useState(workspace?.smtp_config || {
        host: "",
        port: "587",
        user: "",
        pass: "",
        from_email: "",
        from_name: ""
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!workspace?.id) return

        setIsSaving(true)
        try {
            const result = await updateWorkspaceSettings(workspace.id, { smtp_config: config })
            if (result.success) {
                toast.success("Configuração SMTP guardada")
            } else {
                toast.error(result.error || "Erro ao guardar configuração")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">Email (SMTP)</h3>
                    <p className="text-text-secondary">Configura o envio de emails a partir do teu próprio domínio.</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Ligação Não Testada
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Host SMTP</Label>
                    <div className="relative group">
                        <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={config.host}
                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                            placeholder="smtp.exemplo.com"
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Porta</Label>
                    <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={config.port}
                            onChange={(e) => setConfig({ ...config, port: e.target.value })}
                            placeholder="587"
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Utilizador / Login</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={config.user}
                            onChange={(e) => setConfig({ ...config, user: e.target.value })}
                            placeholder="geral@tuaempresa.com"
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Password</Label>
                    <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            type="password"
                            value={config.pass}
                            onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                            placeholder="••••••••"
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-bg-3 space-y-6">
                <div className="flex items-center gap-3">
                    <Send className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Remetente Padrão</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Email de Envio</Label>
                        <Input
                            value={config.from_email}
                            onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                            placeholder="noreply@tuaempresa.com"
                            className="bg-bg-1 border-bg-3 h-12 rounded-xl text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Nome do Remetente</Label>
                        <Input
                            value={config.from_name}
                            onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                            placeholder="Agência XYZ"
                            className="bg-bg-1 border-bg-3 h-12 rounded-xl text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-bg-3">
                <Button variant="ghost" className="text-accent-indigo text-[10px] font-black uppercase tracking-widest hover:bg-accent-indigo/10">
                    Enviar Email de Teste
                </Button>
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="h-12 px-8 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-full font-bold shadow-lg shadow-accent-indigo/20 active:scale-95 transition-all"
                >
                    {isSaving ? "A guardar..." : "Guardar Configurações"}
                </Button>
            </div>
        </form>
    )
}

function Hash(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="4" x2="20" y1="9" y2="9" />
            <line x1="4" x2="20" y1="15" y2="15" />
            <line x1="10" x2="8" y1="3" y2="21" />
            <line x1="16" x2="14" y1="3" y2="21" />
        </svg>
    )
}
