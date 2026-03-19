"use client"

import * as React from "react"
import { Globe, ShieldCheck, ArrowRight, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorkspaceSettings, updateWorkspaceSettings } from "@/app/actions/settings"
import { toast } from "sonner"

interface CustomDomainSettingsProps {
    workspace: WorkspaceSettings | null
}

export function CustomDomainSettings({ workspace }: CustomDomainSettingsProps) {
    const [isSaving, setIsSaving] = React.useState(false)
    const [domain, setDomain] = React.useState(workspace?.custom_domain || "")

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!workspace?.id) return

        setIsSaving(true)
        try {
            const result = await updateWorkspaceSettings(workspace.id, { custom_domain: domain })
            if (result.success) {
                toast.success("Domínio configurado com sucesso")
            } else {
                toast.error(result.error || "Erro ao configurar domínio")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-10">
            <div>
                <h3 className="text-2xl font-black text-white mb-2">Domínio Personalizado</h3>
                <p className="text-text-secondary">Apresenta as tuas propostas sob o teu próprio subdomínio (ex: propostas.tuaagencia.com).</p>
            </div>

            {/* Domain Input */}
            <div className="p-8 bg-bg-2 rounded-2xl border border-bg-3 space-y-6">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Teu Subdomínio</Label>
                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                            <Input
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="propostas.minhaagencia.com"
                                className="bg-bg-1 border-bg-3 h-14 pl-12 rounded-xl text-white font-medium text-lg placeholder:text-white/10"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isSaving || !domain}
                            className="h-14 px-8 bg-white text-black font-bold rounded-xl hover:bg-white/90 shadow-xl shadow-white/5 active:scale-95 transition-all"
                        >
                            {isSaving ? "A configurar..." : "Ligar Domínio"}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-500/80 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SSL automático e gratuito incluído para todos os domínios ligados.
                </div>
            </div>

            {/* Instructions */}
            <div className="space-y-6 pt-6 border-t border-bg-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                    Configuração de DNS
                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 text-text-secondary px-2 py-1 rounded">Passo a Passo</span>
                </h4>

                <div className="space-y-4">
                    <div className="p-6 bg-white/[0.01] border border-bg-3 rounded-2xl flex items-start gap-6 group hover:border-white/10 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-black shrink-0">1</div>
                        <div className="space-y-2">
                            <div className="font-bold text-white text-sm">Cria um registo CNAME</div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Acede ao teu gestor de DNS (Cloudflare, GoDaddy, etc) e cria um novo registo do tipo <code className="bg-bg-3 px-1.5 py-0.5 rounded text-accent-indigo">CNAME</code>.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-white/[0.01] border border-bg-3 rounded-2xl flex items-start gap-6 group hover:border-white/10 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-black shrink-0">2</div>
                        <div className="space-y-3 flex-1">
                            <div className="font-bold text-white text-sm">Define o destino (Value)</div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Aponta o teu subdomínio para o endereço da infraestrutura Brivio:
                            </p>
                            <div className="flex items-center justify-between p-4 bg-bg-1 rounded-xl border border-bg-3 group/copy cursor-pointer hover:bg-bg-3 transition-all">
                                <code className="text-accent-indigo font-bold">domains.brivio.app</code>
                                <RefreshCw className="w-4 h-4 text-text-secondary opacity-40 group-hover/copy:rotate-180 transition-all duration-500" />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white/[0.01] border border-bg-3 rounded-2xl flex items-start gap-6 group hover:border-white/10 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-black shrink-0">3</div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-white text-sm">Verifica a propagação</div>
                                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-accent-indigo hover:bg-accent-indigo/10">
                                    Refresh Status
                                </Button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                A propagação de DNS pode demorar entre 1 a 24 horas. Verificaremos o status automaticamente.
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-500 font-bold bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                À espera da deteção do registo DNS...
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-bg-3">
                <a href="#" className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-xs font-medium">
                    Documentação de Ajuda
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Button variant="ghost" className="text-red-500 hover:bg-red-500/5 text-[10px] font-black uppercase tracking-widest px-6 h-11 border border-transparent hover:border-red-500/20 rounded-xl">
                    Remover Domínio
                </Button>
            </div>
        </form>
    )
}
