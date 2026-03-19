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
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Settings,
    PlusCircle,
    Layout
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
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
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const router = useRouter()
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)

    const handleNext = () => {
        if (currentIndex < NAV_OPTIONS.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    React.useEffect(() => {
        if (scrollContainerRef.current) {
            const cardWidth = 532 // 500px + 32px gap
            scrollContainerRef.current.scrollTo({
                left: currentIndex * cardWidth,
                behavior: "smooth"
            })
        }
    }, [currentIndex])

    return (
        <div className="min-h-screen bg-bg-0 text-text-primary font-sans selection:bg-accent-indigo selection:text-white overflow-hidden relative transition-colors duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-indigo/40 to-transparent blur-[2px] opacity-30 dark:opacity-50" />
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-indigo/40 to-transparent blur-[2px] opacity-30 dark:opacity-50" />

            <div className="absolute left-[-10%] top-[-10%] w-[40%] h-[40%] bg-accent-indigo/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute right-[-10%] bottom-[-10%] w-[40%] h-[40%] bg-accent-indigo/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="px-8 h-[100px] flex items-center justify-between relative z-50">
                <div className="flex flex-col">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[42px] font-bold tracking-tight text-text-primary uppercase font-tight leading-none"
                    >
                        Welcome Back, <span className="text-accent-indigo">{userName}</span>
                    </motion.h1>
                </div>

                <div className="flex items-center gap-6">
                    {/* Navigation Dots */}
                    <div className="flex gap-2 mr-8">
                        {NAV_OPTIONS.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-1 h-1 rounded-full transition-all duration-300",
                                    currentIndex === idx ? "bg-accent-indigo w-4" : "bg-text-tertiary/20"
                                )}
                            />
                        ))}
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="w-10 h-10 rounded-full border border-bg-3 dark:border-white/10 flex items-center justify-center hover:bg-bg-2 dark:hover:bg-white/5 transition-colors disabled:opacity-20 text-text-primary"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === NAV_OPTIONS.length - 1}
                            className="w-10 h-10 rounded-full border border-bg-3 dark:border-white/10 flex items-center justify-center hover:bg-bg-2 dark:hover:bg-white/5 transition-colors disabled:opacity-20 text-text-primary"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="border-l border-bg-3 dark:border-white/10 h-6 mx-2" />

                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content - Slider Area */}
            <main className="relative h-[calc(100vh-100px)] flex flex-col justify-center">
                <div
                    ref={scrollContainerRef}
                    className="flex gap-8 px-[60px] overflow-x-auto scrollbar-hide snap-x snap-mandatory pt-10 pb-20 no-scrollbar"
                >
                    {NAV_OPTIONS.map((opt, idx) => {
                        const Icon = opt.icon
                        const isActive = currentIndex === idx

                        return (
                            <Link
                                key={opt.id}
                                href={opt.href}
                                className={cn(
                                    "group relative min-w-[500px] h-[670px] rounded-none overflow-hidden snap-center transition-all duration-700",
                                    isActive ? "scale-105 opacity-100" : "scale-95 opacity-40 blur-[1px]"
                                )}
                                onMouseEnter={() => setCurrentIndex(idx)}
                            >
                                {/* Card Background Layer */}
                                <div className="absolute inset-0 bg-bg-1 dark:bg-[#0A0A0A] border border-bg-3 dark:border-white/5 group-hover:border-accent-indigo/30 transition-colors shadow-xl dark:shadow-none" />
                                <div className="absolute inset-0 bg-gradient-to-b from-text-primary/[0.01] dark:from-white/[0.02] to-transparent pointer-events-none" />

                                {/* Grid Pattern Highlight */}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay dark:mix-blend-overlay" />

                                {/* Content Wrapper */}
                                <div className="relative h-full p-10 flex flex-col">
                                    {/* Top Section */}
                                    <div className="flex justify-between items-start mb-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-mono text-text-tertiary tracking-tighter mb-2">
                                                [{opt.id}/{NAV_OPTIONS.length.toString().padStart(2, '0')}] // SYS.ID
                                            </span>
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                                                style={{ backgroundColor: opt.bg, color: opt.color }}
                                            >
                                                <Icon className="w-7 h-7" />
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-bg-3 dark:border-white/5 flex items-center justify-center text-text-tertiary group-hover:text-text-primary group-hover:bg-accent-indigo/10 dark:group-hover:bg-accent-indigo/20 transition-all">
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>

                                    {/* Middle Section */}
                                    <div className="mt-auto space-y-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <span
                                                className="text-[12px] font-bold tracking-[0.2em] uppercase"
                                                style={{ color: opt.color }}
                                            >
                                                {opt.subtitle}
                                            </span>
                                            <h2 className="text-[64px] font-bold tracking-tight text-text-primary mt-4 leading-[0.9] uppercase font-tight group-hover:text-accent-indigo transition-colors selection:bg-accent-indigo selection:text-white">
                                                {opt.title}
                                            </h2>
                                        </motion.div>

                                        <p className="text-text-secondary leading-relaxed text-[15px] max-w-[90%]">
                                            {opt.description}
                                        </p>
                                    </div>

                                </div>

                                {/* Hover Border Beam Effect (Simulated) */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                    <div className="absolute inset-0 border border-accent-indigo/50 rounded-none overflow-hidden">
                                        <div className="absolute top-0 left-[-100%] w-full h-[2px] bg-gradient-to-r from-transparent via-accent-indigo to-transparent animate-beam" />
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </main>

            {/* Bottom Controls / Stats */}
            <div className="absolute bottom-10 inset-x-0 px-8 flex items-center justify-between z-50 pointer-events-none">
                <div className="flex items-center gap-8 pointer-events-auto">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">System Health</span>
                        <div className="flex items-center gap-2 text-text-primary">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[11px] font-mono font-bold">ALL SYSTEMS NOMINAL</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 pointer-events-auto">
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
                            Criar Workspace
                        </button>
                    )}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-bg-1 dark:bg-white/5 border border-bg-3 dark:border-white/10 text-xs font-bold text-text-primary hover:bg-bg-2 dark:hover:bg-white dark:hover:text-black transition-all"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        System Settings
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-indigo text-white text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-accent-indigo/20">
                        <Sparkles className="w-3.5 h-3.5" />
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
