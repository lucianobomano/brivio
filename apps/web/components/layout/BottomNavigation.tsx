"use client"

import * as React from "react"
import {
    Home as HomeIcon,
    FolderKanban,
    CheckSquare,
    MapPin,
    Zap,
    Timer,
    Mic,
    Users2,
    Users,
    Package,
    Wallet
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useSpaNavigation } from "@/components/providers/SpaNavigationProvider"

const MENU_ITEMS = [
    { label: "Grupo", icon: HomeIcon, href: "/dashboard" },
    { label: "Projectos", icon: FolderKanban, href: "/projects?view=padrao" },
    { label: "Tarefas", icon: CheckSquare, href: "/tasks" },
    { label: "Roadmap", icon: MapPin, href: "/roadmap" },
    { label: "Foco", icon: Zap, href: "/focus" },
    { label: "Sprints", icon: Timer, href: "/sprints" },
    { label: "Stand-ups", icon: Mic, href: "/standups" },
    { label: "CRM", icon: Users2, href: "/crm" },
    { label: "Equipa", icon: Users, href: "/team" },
    { label: "Inventário", icon: Package, href: "/inventory" },
    { label: "Finanças", icon: Wallet, href: "/finances" },
]

// Routes managed by the SPA provider — kept for future use
// const SPA_ROUTES = new Set(["/dashboard", "/projects", "/tasks", "/roadmap", "/focus", "/sprints", "/standups"])

export function BottomNavigation() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [hoveredLabel, setHoveredLabel] = React.useState<string | null>(null)
    const { activeView, navigateTo } = useSpaNavigation()

    // Hide on Focus Board View
    if (activeView === "focus" && searchParams.get("projectId")) {
        return null
    }

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 transition-all duration-500">
            <motion.div
                layout
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                className="inline-flex h-[72px] bg-white dark:bg-[#16171C] border border-[#97A1B3]/65 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-full items-center px-[6px] gap-[6px] backdrop-blur-2xl relative min-w-max mx-auto"
                transition={{
                    layout: { type: "spring", stiffness: 400, damping: 35 },
                    y: { duration: 0.5 },
                    opacity: { duration: 0.5 }
                }}
            >
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                {/* Logo Circle */}
                <div className="w-[60px] h-[60px] rounded-full bg-[#232323] flex items-center justify-center shrink-0 shadow-lg shadow-black/20 relative z-10">
                    <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-tr from-[#FF0054] via-[#88007F] via-[#06D6A0] to-[#311C99] p-[6px]">
                        <div className="w-full h-full rounded-full bg-[#232323]" />
                    </div>
                </div>

                {MENU_ITEMS.map((item) => {
                    const itemPath = item.href.split("?")[0]

                    let isActive = false
                    if (item.label === "Projectos") {
                        isActive = activeView === "projects"
                    } else if (item.label === "Grupo") {
                        isActive = activeView === "dashboard"
                    } else if (item.label === "Tarefas") {
                        isActive = activeView === "tasks"
                    } else if (item.label === "Roadmap") {
                        isActive = activeView === "roadmap"
                    } else if (item.label === "Foco") {
                        isActive = activeView === "focus"
                    } else if (item.label === "Sprints") {
                        isActive = activeView === "sprints"
                    } else if (item.label === "Stand-ups") {
                        isActive = activeView === "standups"
                    } else {
                        isActive = pathname === itemPath
                    }

                    const Icon = item.icon
                    const isHovered = hoveredLabel === item.label
                    const showBg = isHovered || isActive

                    const handleClick = (e: React.MouseEvent) => {
                        e.preventDefault()
                        window.location.href = item.href
                    }

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={handleClick}
                            onMouseEnter={() => setHoveredLabel(item.label)}
                            onMouseLeave={() => setHoveredLabel(null)}
                            className="relative flex items-center justify-center z-10 w-[60px] h-[60px]"
                        >
                            {/* Tooltip Balloon */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, x: "-50%", scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                                        exit={{ opacity: 0, y: 8, x: "-50%", scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute bottom-[76px] left-1/2 z-50 pointer-events-none"
                                    >
                                        <div className="relative bg-[#16171C] text-white text-[13px] font-medium py-1.5 px-3.5 rounded-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] whitespace-nowrap">
                                            {item.label}
                                            {/* Pin pointing down */}
                                            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#16171C] border-r border-b border-white/10" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                className={cn(
                                    "flex items-center justify-center w-[60px] h-[60px] rounded-full transition-all duration-300 group",
                                    showBg
                                        ? "bg-[#ff0054] text-white shadow-[0_8px_20px_rgba(255,0,84,0.3)]"
                                        : "bg-[#EFF0F2] dark:bg-[#3E3E3E] text-[#515151]/60 dark:text-[#97A1B3]/60 hover:text-text-primary"
                                )}
                            >
                                <Icon
                                    strokeWidth={2.5}
                                    className="w-[26px] h-[26px] shrink-0"
                                />
                            </motion.div>
                        </Link>
                    )
                })}
            </motion.div>
        </div>
    )
}
