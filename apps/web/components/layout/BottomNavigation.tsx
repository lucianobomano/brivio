"use client"

import * as React from "react"
import {
    Home as HomeIcon,
    LayoutDashboard,
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

const MENU_ITEMS = [
    { label: "Home", icon: HomeIcon, href: "/dashboard" },
    { label: "Dashboard", icon: LayoutDashboard, href: "/projects" }, // Assuming dashboard is /projects without view or view=dashboard
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

export function BottomNavigation() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [hoveredLabel, setHoveredLabel] = React.useState<string | null>(null)

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
                    const isHovered = hoveredLabel === item.label
                    const showBg = isHovered || isActive

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onMouseEnter={() => setHoveredLabel(item.label)}
                            onMouseLeave={() => setHoveredLabel(null)}
                            className="relative flex items-center z-10"
                        >
                            <motion.div
                                layout
                                className={cn(
                                    "flex items-center gap-3 h-[60px] rounded-full transition-all duration-300 overflow-hidden group",
                                    showBg
                                        ? "bg-[#ff0054] text-white shadow-[0_8px_20px_rgba(255,0,84,0.3)]"
                                        : "bg-[#EFF0F2] dark:bg-[#3E3E3E] text-[#515151]/60 dark:text-[#97A1B3]/60 hover:text-text-primary",
                                    (!isHovered) ? "w-[60px] justify-center px-0" : "px-5"
                                )}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 35
                                }}
                            >
                                <Icon
                                    strokeWidth={2.5}
                                    className={cn(
                                        "w-[26px] h-[26px] shrink-0 transition-all duration-300",
                                        showBg ? "opacity-100" : "opacity-100" // Opacity is handled by the text color class above
                                    )}
                                />

                                <AnimatePresence mode="popLayout" initial={false}>
                                    {isHovered && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10, width: 0 }}
                                            animate={{ opacity: 1, x: 0, width: "auto" }}
                                            exit={{ opacity: 0, x: -10, width: 0 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="text-[26px] font-normal leading-none whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </Link>
                    )
                })}
            </motion.div>
        </div>
    )
}
