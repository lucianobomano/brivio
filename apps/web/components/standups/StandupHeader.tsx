"use client"

import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutGrid,
    ChevronDown,
    Sun,
    Moon,
    Home,
    Settings,
} from 'lucide-react';
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { UserProfilePopover } from "@/components/layout/UserProfilePopover"
import { toast } from "sonner"
import { GlobalSettingsView } from "@/components/settings/GlobalSettingsView"
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider"

interface AppUser {
    id: string
    email: string
    profile?: {
        name: string
        avatar_url?: string
        cover_url?: string
        profile_type?: string
    }
}

export function StandupHeader() {
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const [user, setUser] = useState<AppUser | null>(null)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        setMounted(true)
        const supabase = createClient()
        async function fetchUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                setUser({
                    id: authUser.id,
                    email: authUser.email!,
                    profile: profile || { name: authUser.email?.split('@')[0] || 'User' }
                })
            }
        }
        fetchUser()
    }, [])

    const handleMouseEnter = () => {
        if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current)
        setIsPopoverOpen(true)
    }
    const handleMouseLeave = () => {
        popoverTimeoutRef.current = setTimeout(() => setIsPopoverOpen(false), 300)
    }

    return (
        <>
            <header className="w-full shrink-0 bg-bg-0 z-30 flex justify-center sticky top-0" style={{ height: "61px", marginTop: "30px" }}>
                <div className="flex items-center justify-between h-full w-full" style={{ maxWidth: "1520px" }}>
                    {/* Logo */}
                    <div className="flex items-center relative" style={{ width: "143px", height: "40px" }}>
                        <Image
                            src={mounted && theme === "light" ? "/brand/logo-light.png" : "/brand/logo-dark.png"}
                            alt="Brivio"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>

                    {/* Right side group */}
                    <div className="flex items-center gap-6">
                        {/* Add Project Button Group - PRESERVED FOR CONSISTENCY, BUT DISABLED/MOCKED */}
                        <div
                            className="flex items-center"
                            style={{
                                width: "500px",
                                height: "61px",
                                backgroundColor: "#15171F",
                                padding: "10px 14px",
                                borderRadius: "12px"
                            }}
                        >
                            <div className="flex items-center" style={{ gap: "3px" }}>
                                {/* Add Project Button */}
                                <button
                                    onClick={() => toast.info("Creating projects is only available in the Projects Dashboard")}
                                    className="flex items-center justify-center text-white text-sm font-bold"
                                    style={{
                                        width: "143px",
                                        height: "41px",
                                        borderRadius: "100px 0 0 100px",
                                        background: "linear-gradient(135deg, #FF0054, #88007F, #06D6A0, #311C99)",
                                        padding: "3px",
                                    }}
                                >
                                    <span
                                        className="flex items-center justify-center w-full h-full bg-[#15171F] text-white text-sm font-bold"
                                        style={{ borderRadius: "97px 0 0 97px", padding: "0 27px" }}
                                    >
                                        Add project
                                    </span>
                                </button>
                                {/* Dropdown Button */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="flex items-center justify-center"
                                            style={{
                                                width: "44px",
                                                height: "41px",
                                                borderRadius: "0 100px 100px 0",
                                                background: "linear-gradient(135deg, #FF0054, #88007F, #06D6A0, #311C99)",
                                                padding: "3px",
                                            }}
                                        >
                                            <span
                                                className="flex items-center justify-center w-full h-full bg-[#15171F]"
                                                style={{ borderRadius: "0 97px 97px 0", padding: "0 15px" }}
                                            >
                                                <ChevronDown className="w-6 h-6 text-white" />
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[220px] bg-bg-1 border-bg-3 p-2 rounded-2xl shadow-2xl z-[100]">
                                        <DropdownMenuLabel className="text-[10px] font-black text-text-tertiary uppercase tracking-widest px-3 py-2">Quick Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => toast.info("Go to Projects Dashboard to create new projects")}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-indigo/5 cursor-pointer group/item"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover/item:bg-accent-indigo group-hover/item:text-white transition-colors">
                                                <LayoutGrid className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text-primary">Novo Projecto</span>
                                                <span className="text-[10px] text-text-tertiary">Lançar nova iniciativa</span>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Theme Toggle (Inline) */}
                            <div
                                className="flex items-center ml-4"
                                style={{
                                    width: "71px",
                                    height: "41px",
                                    backgroundColor: "#2E313C",
                                    borderRadius: "100px",
                                    padding: "6px 8px",
                                }}
                            >
                                <button
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "flex items-center justify-center transition-all",
                                        mounted && theme === "light" ? "bg-[#15161B] rounded-full" : ""
                                    )}
                                    style={{ width: "28px", height: "28px" }}
                                >
                                    <Sun className={cn("w-[22px] h-[22px]", mounted && theme === "light" ? "text-[#ff0054]" : "text-[#515151]")} />
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "flex items-center justify-center transition-all",
                                        mounted && theme === "dark" ? "bg-[#15161B] rounded-full" : ""
                                    )}
                                    style={{ width: "28px", height: "28px" }}
                                >
                                    <Moon className={cn("w-[22px] h-[22px]", mounted && theme === "dark" ? "text-[#ff0054]" : "text-[#515151]")} />
                                </button>
                            </div>

                            {/* Icons Group */}
                            <div className="flex items-center ml-auto" style={{ gap: "16px" }}>
                                <Home
                                    onClick={() => router.push("/dashboard")}
                                    className="w-[30px] h-[30px] text-[#515151] cursor-pointer hover:text-white transition-colors"
                                />
                                <Settings
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="w-[30px] h-[30px] text-[#515151] cursor-pointer hover:text-white transition-colors"
                                />
                                <LayoutGrid className="w-[30px] h-[30px] text-[#515151] cursor-pointer hover:text-white transition-colors" />
                                {/* Global User Profile Popover */}
                                <div className="relative">
                                    <div
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => { }}
                                        className="cursor-pointer"
                                    >
                                        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#FF0054] to-[#88007F] p-0.5 shadow-lg shadow-accent-indigo/20 hover:scale-105 transition-transform active:scale-95 overflow-hidden">
                                            <div className="w-full h-full rounded-full bg-bg-0 overflow-hidden flex items-center justify-center relative">
                                                {user?.profile?.avatar_url ? (
                                                    <Image
                                                        src={user.profile.avatar_url}
                                                        alt={user.profile?.name || "User"}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-white">
                                                        {user?.profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <UserProfilePopover
                                        isOpen={isPopoverOpen}
                                        user={user}
                                        onClose={() => setIsPopoverOpen(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Header border with gap - MATCHING PROJECTS STYLE */}
            <div className="w-full flex justify-center shrink-0 z-20" style={{ marginBottom: "50px", marginTop: "25px" }}>
                <div style={{ height: "1px", backgroundColor: "#303030", width: "1520px" }} />
            </div>

            <WorkspaceProvider>
                <GlobalSettingsView
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            </WorkspaceProvider>
        </>
    )
}
