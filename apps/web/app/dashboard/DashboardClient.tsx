"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
    Briefcase,
    Layers,
    Users,
    CheckSquare,
    FolderKanban,
    ArrowRight,
    Sparkles,
    Settings,
    PlusCircle,
    Layout
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { WorkspaceCreateModal } from "@/components/dashboard/WorkspaceCreateModal"
import { GlobalSettingsView } from "@/components/settings/GlobalSettingsView"

interface NavOption {
    title: string
    subtitle: string
    description: string
    icon: React.ElementType
    href: string
    color: string
    bg: string
    id: string
    imageUrl?: string
}

const NAV_OPTIONS: NavOption[] = [
    {
        id: "01",
        title: "Gestão de Marca",
        subtitle: "BRAND MANAGEMENT",
        description: "Centralize your brand identity. Manage logos, colors, typography, and core visual assets with professional consistency.",
        icon: Briefcase,
        href: "/brands",
        color: "#0066FF",
        bg: "rgba(0, 102, 255, 0.1)",
        imageUrl: "/images/templates/Frame 615.png",
    },
    {
        id: "02",
        title: "Gestão de Projectos",
        subtitle: "CREATIVE LIFECYCLE",
        description: "Manage your projects from prospecting to delivery. Track every phase of your creative process with full visibility.",
        icon: FolderKanban,
        href: "/projects",
        color: "#00D6A0",
        bg: "rgba(0, 214, 160, 0.1)",
        imageUrl: "/images/templates/Frame 610.png",
    },
    {
        id: "03",
        title: "Gestão de Tarefas",
        subtitle: "TASK MANAGEMENT",
        description: "Optimized workflow for creative teams. Track progress, manage deadlines, and boost productivity with smart task tracking.",
        icon: CheckSquare,
        href: "/tasks",
        color: "#8800FF",
        bg: "rgba(136, 0, 255, 0.1)",
    },
    {
        id: "04",
        title: "Asset Hub",
        subtitle: "SMART LIBRARY",
        description: "A centralized, intelligent repository for all your creative media. Secure storage with lightning-fast retrieval.",
        icon: FolderKanban,
        href: "/assets",
        color: "#00D6A0",
        bg: "rgba(0, 214, 160, 0.1)",
        imageUrl: "/images/templates/Frame 617.png",
    },
    {
        id: "05",
        title: "BrandOps Engine",
        subtitle: "WORKFLOW AUTOMATION",
        description: "Streamline your creative operations. Automate repetitive tasks and focus on impactful design decisions.",
        icon: Layers,
        href: "/brandops",
        color: "#FF6600",
        bg: "rgba(255, 102, 0, 0.1)",
        imageUrl: "/images/templates/Frame 605.png",
    },
    {
        id: "06",
        title: "Community",
        subtitle: "CREATIVE NETWORK",
        description: "Connect with the world's most innovative designers. Scale your talent reach and discover new inspiration.",
        icon: Users,
        href: "/community",
        color: "#FF0054",
        bg: "rgba(255, 0, 84, 0.1)",
    },
]

import { StandupHeader } from "@/components/standups/StandupHeader"

export function DashboardClient({
    userName,
    hasWorkspace,
    workspaceName,
    workspaceId
}: {
    userName: string,
    hasWorkspace: boolean,
    workspaceName?: string | null,
    workspaceId?: string | null
}) {
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const router = useRouter()

    return (
        <div className="min-h-screen bg-bg-0 text-text-primary font-sans selection:bg-accent-indigo selection:text-white overflow-hidden relative transition-colors duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-indigo/40 to-transparent blur-[2px] opacity-30 dark:opacity-50" />
            <div className="absolute left-[-10%] top-[-10%] w-[40%] h-[40%] bg-accent-indigo/5 rounded-full blur-[120px] pointer-events-none" />

            <StandupHeader />

            {/* Main Content - Match Standups Layout */}
            <main className="flex-1 flex justify-center p-4 md:p-10 mt-10 w-full">
                <div className="max-w-[1600px] w-full flex justify-center gap-2 md:gap-[20px]">
                    {NAV_OPTIONS.filter(opt => opt.id !== "03" && opt.id !== "06").map((opt, idx) => {
                        const Icon = opt.icon

                        return (
                            <Link
                                key={opt.id}
                                href={opt.href}
                                className="w-full max-w-[372px] flex-1 min-w-0 aspect-[372/585] rounded-[12px] relative overflow-hidden flex flex-col justify-between p-4 md:p-8 text-white transition-all hover:translate-y-[-10px] shadow-2xl group"
                                style={{ backgroundColor: '#1A1B20' }}
                            >
                                {opt.imageUrl && (
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={opt.imageUrl}
                                            alt={opt.title}
                                            fill
                                            className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                                    </div>
                                )}

                                {/* Static Module Gradient Background (Backup if no image) */}
                                {!opt.imageUrl && (
                                    <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                                        style={{
                                            background: `linear-gradient(135deg, ${opt.color}44 0%, #000000 100%)`
                                        }}
                                    />
                                )}

                                {/* Arrow (Top Left) */}
                                <div className="relative z-10">
                                    <ArrowRight className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                                </div>

                                {/* Bottom content */}
                                <div className="space-y-6 relative z-10 w-full mt-auto">
                                    <div className="space-y-3">
                                        {/* Index and Button Row */}
                                        <div className="flex items-end justify-between">
                                            <span className="text-[64px] font-thin opacity-80 tracking-tighter drop-shadow-lg leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                                                {opt.id}
                                            </span>
                                            <button className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all shrink-0">
                                                Abrir
                                            </button>
                                        </div>

                                        <div className="h-[1px] w-full bg-gradient-to-r from-white/70 to-transparent" />

                                        <div>
                                            <h3 className="text-2xl font-bold tracking-tight leading-none drop-shadow-md uppercase font-tight">{opt.title}</h3>
                                            <p className="text-sm opacity-60 font-medium drop-shadow-sm mt-2 line-clamp-2 uppercase tracking-tight">{opt.subtitle}</p>
                                        </div>
                                    </div>

                                    {/* Icon / Avatar Area Placeholder */}
                                    <div className="flex items-center">
                                        <div
                                            className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center shadow-lg"
                                            style={{ backgroundColor: opt.bg, color: opt.color }}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Liquid Gradient Effect on Hover (Optional, for premium feel) */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none bg-gradient-to-br from-white to-transparent" />
                            </Link>
                        )
                    })}
                </div>
            </main>

            {/* Adjusted Footer Controls */}
            <div className="fixed bottom-10 inset-x-0 px-8 flex items-center justify-center z-50">
                <div className="flex items-center gap-4">
                    {/* Management & Network Shortcut Buttons */}
                    <button
                        onClick={() => router.push('/tasks')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-bg-1 dark:bg-white/5 border border-bg-3 dark:border-white/10 text-xs font-bold text-text-primary hover:bg-bg-2 dark:hover:bg-white/10 transition-all hover:scale-105"
                    >
                        <CheckSquare className="w-3.5 h-3.5 text-[#8800FF]" />
                        Tasks
                    </button>
                    <button
                        onClick={() => router.push('/community')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-bg-1 dark:bg-white/5 border border-bg-3 dark:border-white/10 text-xs font-bold text-text-primary hover:bg-bg-2 dark:hover:bg-white/10 transition-all hover:scale-105"
                    >
                        <Users className="w-3.5 h-3.5 text-[#FF0054]" />
                        Community
                    </button>

                    <div className="w-px h-6 bg-bg-3 dark:bg-white/10 mx-2" />

                    {hasWorkspace ? (
                        <button
                            onClick={() => router.push(`/projects?workspaceId=${workspaceId}`)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-white/10 ring-1 ring-white/20"
                        >
                            <Layout className="w-3.5 h-3.5" />
                            {workspaceName || "Workspace"}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsWorkspaceModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-white/10 ring-1 ring-white/20"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Nova Workspace
                        </button>
                    )}

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-bg-1 dark:bg-white/5 border border-bg-3 dark:border-white/10 text-xs font-bold text-text-primary hover:bg-bg-2 dark:hover:bg-white dark:hover:text-black transition-all"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        System Settings
                    </button>

                    <button className="flex items-center gap-2 px-7 py-3 rounded-full bg-accent-indigo text-white text-[13px] font-bold hover:scale-105 transition-all shadow-xl shadow-accent-indigo/25 active:scale-95">
                        <Sparkles className="w-4 h-4" />
                        Quick Create
                    </button>
                </div>
            </div>

            <WorkspaceCreateModal
                isOpen={isWorkspaceModalOpen}
                onClose={() => setIsWorkspaceModalOpen(false)}
                onSuccess={() => {
                    setIsWorkspaceModalOpen(false)
                    router.refresh()
                }}
            />

            <GlobalSettingsView
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes beam {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                .animate-beam {
                    animation: beam 3s infinite linear;
                }
            `}</style>
        </div>
    )
}
