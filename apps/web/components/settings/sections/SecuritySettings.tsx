"use client"

import * as React from "react"
import { Key, Smartphone, Monitor, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function SecuritySettings() {
    const [isChangingPassword, setIsChangingPassword] = React.useState(false)

    return (
        <div className="space-y-10">
            <div>
                <h3 className="text-2xl font-black text-white mb-2">Segurança</h3>
                <p className="text-text-secondary">Garantir a proteção da tua conta e monitorizar o acesso.</p>
            </div>

            {/* Change Password */}
            <div className="p-8 bg-bg-2 rounded-2xl border border-bg-3 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-white">Alterar Palavra-passe</div>
                            <p className="text-xs text-text-secondary">Recomendamos uma password forte com pelo menos 12 caracteres.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="bg-bg-1 border-bg-3 hover:bg-bg-3 text-white text-[10px] font-black uppercase tracking-widest px-6"
                    >
                        {isChangingPassword ? "Cancelar" : "Alterar"}
                    </Button>
                </div>

                {isChangingPassword && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-bg-3 animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Password Atual</Label>
                            <Input type="password" placeholder="••••••••" className="bg-bg-1 border-bg-3 rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Nova Password</Label>
                            <Input type="password" placeholder="••••••••" className="bg-bg-1 border-bg-3 rounded-xl h-11" />
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full h-11 bg-white text-black font-bold rounded-xl hover:bg-white/90">
                                Confirmar Alteração
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 2FA */}
            <div className="p-8 bg-bg-2 rounded-2xl border border-bg-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-white">Autenticação de Dois Fatores (2FA)</div>
                            <p className="text-xs text-text-secondary">Adiciona uma camada extra de segurança usando uma app de autenticação.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-text-secondary opacity-40">Desativado</span>
                        <Switch />
                    </div>
                </div>
            </div>

            {/* Sessions */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Sessões Ativas</h4>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-bg-3 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-bg-3 flex items-center justify-center">
                                <Monitor className="w-5 h-5 text-text-secondary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">Chrome em macOS</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Esta Sessão</span>
                                </div>
                                <p className="text-[10px] text-text-secondary mt-1">Lisboa, Portugal • Última atividade: agora</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-text-secondary opacity-40 hover:text-red-500 hover:opacity-100">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-transparent rounded-2xl opacity-60 hover:bg-white/[0.02] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-bg-3 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-text-secondary" />
                            </div>
                            <div>
                                <span className="font-bold text-white text-sm">iPhone 15 Pro</span>
                                <p className="text-[10px] text-text-secondary mt-1">Lisboa, Portugal • Última atividade: há 2 horas</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-text-secondary opacity-40 hover:text-red-500 hover:opacity-100">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <Button variant="ghost" className="w-full h-14 border border-dashed border-bg-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-red-500/5 hover:text-red-500 hover:border-red-500/20">
                    Encerrar todas as outras sessões
                </Button>
            </div>
        </div>
    )
}
