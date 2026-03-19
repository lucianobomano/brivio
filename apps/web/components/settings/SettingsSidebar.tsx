"use client"

import * as React from "react"
import { User, Shield, Bell, Building, Palette, Users, CreditCard, Globe, Zap, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsSidebarProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
    const sections = [
        {
            title: "Pessoal",
            items: [
                { id: "profile", label: "O Meu Perfil", icon: User },
                { id: "security", label: "Segurança", icon: Shield },
                { id: "notifications", label: "Notificações", icon: Bell },
            ]
        },
        {
            title: "Workspace",
            items: [
                { id: "workspace_general", label: "Geral", icon: Building },
                { id: "branding", label: "Branding", icon: Palette },
                { id: "members", label: "Membros & Permissões", icon: Users },
                { id: "billing", label: "Faturação", icon: CreditCard },
            ]
        },
        {
            title: "Preferências do Sistema",
            items: [
                { id: "domain", label: "Domínio Personalizado", icon: Globe },
                { id: "integrations", label: "Integrações", icon: Zap },
                { id: "smtp", label: "Email (SMTP)", icon: Mail },
            ]
        }
    ]

    return (
        <nav className="p-6 space-y-8">
            {sections.map((section) => (
                <div key={section.title} className="space-y-3">
                    <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-50">
                        {section.title}
                    </h3>
                    <div className="space-y-1">
                        {section.items.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.id

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-bold",
                                        isActive
                                            ? "bg-accent-indigo text-white shadow-lg shadow-accent-indigo/20 scale-[1.02]"
                                            : "text-text-secondary hover:text-text-primary hover:bg-bg-3"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-4 h-4 transition-transform group-hover:scale-110",
                                        isActive ? "text-white" : "text-text-secondary"
                                    )} />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </nav>
    )
}
