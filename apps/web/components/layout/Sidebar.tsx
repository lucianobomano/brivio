"use client"

import * as React from "react"
import {
    FolderKanban,
    CheckSquare,
    MapPin,
    Zap,
    Timer,
    Mic,
    Calendar,
    MessageSquare,
    Users2,
    Users,
    Package,
    Wallet,
    LogOut,
    Settings,
    MoreVertical,
    LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GlobalSettingsView } from "@/components/settings/GlobalSettingsView"

const MENU_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/projects" },
    { label: "Projectos", icon: FolderKanban, href: "/projects?view=padrao" },
    { label: "Tarefas", icon: CheckSquare, href: "/tasks" },
    { label: "Roadmap", icon: MapPin, href: "/roadmap" },
    { label: "Foco", icon: Zap, href: "/focus" },
    { label: "Sprints", icon: Timer, href: "/sprints" },
    { label: "Stand-ups", icon: Mic, href: "/standups" },
    { label: "Agenda", icon: Calendar, href: "/calendar" },
    { label: "Mensagens", icon: MessageSquare, href: "/messages" },
    { label: "CRM", icon: Users2, href: "/crm" },
    { label: "Equipa", icon: Users, href: "/team" },
    { label: "Inventário", icon: Package, href: "/inventory" },
    { label: "Finanças", icon: Wallet, href: "/finances" },
]

interface SidebarProps {
    user: {
        name: string
        email: string
        avatar?: string
        role?: string
    }
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

    return (
        <aside className="w-[250px] h-screen bg-bg-1 border-r border-bg-3 flex flex-col shrink-0 sticky top-0 overflow-hidden">
            {/* User Info Card (210x223px) */}
            <div className="p-5 border-b border-bg-3">
                <div className="w-[210px] h-[223px] bg-bg-2 rounded-[24px] border border-bg-3 shadow-xl flex flex-col items-center justify-center p-6 relative group overflow-hidden">
                    {/* Background Detail */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-indigo/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute top-0 right-0 p-4">
                        < MoreVertical className="w-4 h-4 text-text-tertiary" />
                    </div>

                    <div className="relative mb-4">
                        <div className="absolute -inset-1 bg-gradient-to-r from-accent-indigo to-accent-cyan rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                        <Avatar className="w-20 h-20 border-2 border-bg-0 shadow-2xl relative">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-bg-1 text-accent-indigo text-xl font-bold uppercase">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-bg-0 rounded-full" />
                    </div>

                    <div className="text-center relative">
                        <h2 className="text-lg font-bold text-text-primary leading-tight font-tight line-clamp-1">
                            {user.name}
                        </h2>
                        <p className="text-[10px] font-bold text-accent-indigo uppercase tracking-widest mt-1">
                            {user.role || "Creator Pro"}
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col w-full gap-2 relative">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[11px] h-8 border-bg-3 rounded-xl bg-bg-0/50 hover:bg-bg-0 text-text-primary"
                            onClick={() => setIsSettingsOpen(true)}
                        >
                            <Settings className="w-3.5 h-3.5 mr-2" />
                            Definições
                        </Button>
                    </div>
                </div>
            </div>

            {/* Menu List */}
            <nav className="flex-1 overflow-y-auto p-4 py-6 no-scrollbar space-y-1">
                {MENU_ITEMS.map((item) => {
                    // Check if current page matches item href (including query params for projects)
                    const viewParam = searchParams.get("view")
                    const isProjectsPath = pathname === "/projects"

                    let isActive = false
                    if (item.label === "Dashboard") {
                        isActive = isProjectsPath && (viewParam === "dashboard" || !viewParam)
                    } else if (item.label === "Projectos") {
                        isActive = isProjectsPath && viewParam !== "dashboard" && !!viewParam
                    } else {
                        isActive = pathname === item.href
                    }

                    const Icon = item.icon

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group",
                                isActive
                                    ? "bg-accent-indigo text-white shadow-lg shadow-accent-indigo/20"
                                    : "text-text-secondary hover:bg-bg-2 hover:text-text-primary"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 transition-transform group-hover:scale-110",
                                isActive ? "text-white" : "text-text-tertiary group-hover:text-accent-indigo"
                            )} />
                            <span className="text-[13px] font-semibold tracking-tight">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-bg-3">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 group">
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[13px] font-semibold">Sair da Sessão</span>
                </button>
            </div>

            <GlobalSettingsView
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </aside>
    )
}
