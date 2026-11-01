"use client"

import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutGrid,
    ChevronDown,
    Sun,
    Moon,
    Home,
    Settings,
    BookOpen,
} from 'lucide-react';
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useRouter } from "nextjs-toploader/app"
import dynamic from "next/dynamic"
import { CreateBrandModal } from "@/components/brands/CreateBrandModal"
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

// PERFORMANCE: the settings screen and the template modal only appear after a click, so they are
// loaded (and their workspace data fetched) on first open instead of with every page using this header
const GlobalSettingsView = dynamic(() => import("@/components/settings/GlobalSettingsView").then(m => m.GlobalSettingsView), { ssr: false })
const CreateBrandbookFromTemplateModal = dynamic(() => import("@/components/brandbook/CreateBrandbookFromTemplateModal").then(m => m.CreateBrandbookFromTemplateModal), { ssr: false })
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
    const pathname = usePathname()
    const [user, setUser] = useState<AppUser | null>(null)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
    const [mounted, setMounted] = useState(false)


    useEffect(() => {
        setMounted(true)
        const supabase = createClient()
        async function fetchUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                const metadata = authUser.user_metadata || {}
                setUser({
                    id: authUser.id,
                    email: authUser.email!,
                    profile: {
                        ...(profile || {}),
                        name: profile?.name || metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User',
                        avatar_url: profile?.avatar_url || metadata.avatar_url || metadata.picture
                    }
                })
            }
        }
        fetchUser()
    }, [])



    return (
        <>
            <header 
                className="w-full shrink-0 bg-bg-0 z-30 flex flex-col items-center relative px-[40px]" 
                style={{ marginTop: "30px" }}
            >
                {/* Navigation Bar */}
                <div className="flex items-center justify-between w-full" style={{ height: "61px", maxWidth: "1520px" }}>
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
                        {/* Add Button Group */}
                        <div
                            className="flex items-center transition-colors"
                            style={{
                                width: "500px",
                                height: "61px",
                                backgroundColor: mounted && theme === "light" ? "#F3F4F6" : "#15171F",
                                padding: "10px 14px",
                                borderRadius: "12px"
                            }}
                        >
                            <div className="flex items-center" style={{ gap: "3px" }}>
                                {/* Main Action Button */}
                                {pathname === "/brands" ? (
                                    <CreateBrandModal
                                        userName={user?.profile?.name || user?.email?.split('@')[0] || "User"}
                                        brandsCount={0}
                                    >
                                        <button
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
                                                className={cn(
                                                    "flex items-center justify-center w-full h-full text-sm font-bold transition-colors",
                                                    mounted && theme === "light" ? "bg-white text-black" : "bg-[#15171F] text-white"
                                                )}
                                                style={{ borderRadius: "97px 0 0 97px", padding: "0 27px" }}
                                            >
                                                Add brand
                                            </span>
                                        </button>
                                    </CreateBrandModal>
                                ) : (
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
                                            className={cn(
                                                "flex items-center justify-center w-full h-full text-sm font-bold transition-colors",
                                                mounted && theme === "light" ? "bg-white text-black" : "bg-[#15171F] text-white"
                                            )}
                                            style={{ borderRadius: "97px 0 0 97px", padding: "0 27px" }}
                                        >
                                            Add project
                                        </span>
                                    </button>
                                )}
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
                                                className={cn(
                                                    "flex items-center justify-center w-full h-full transition-colors",
                                                    mounted && theme === "light" ? "bg-white" : "bg-[#15171F]"
                                                )}
                                                style={{ borderRadius: "0 97px 97px 0", padding: "0 15px" }}
                                            >
                                                <ChevronDown className={cn("w-6 h-6 transition-colors", mounted && theme === "light" ? "text-black" : "text-white")} />
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[240px] bg-bg-1 border-bg-3 p-2 rounded-2xl shadow-2xl z-[100]">
                                        <DropdownMenuLabel className="text-[10px] font-black text-text-tertiary uppercase tracking-widest px-3 py-2">Quick Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => setIsTemplateModalOpen(true)}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FF0054]/10 cursor-pointer group/item transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF0054] to-[#88007F] flex items-center justify-center text-white shadow-sm shrink-0">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text-primary group-hover/item:text-[#FF0054] transition-colors">Novo Brand Book</span>
                                                <span className="text-[10px] text-text-tertiary">A partir de um template</span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => toast.info("Go to Projects Dashboard to create new projects")}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-indigo/5 cursor-pointer group/item"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover/item:bg-accent-indigo group-hover/item:text-white transition-colors shrink-0">
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
                                className="flex items-center ml-4 transition-colors"
                                style={{
                                    width: "71px",
                                    height: "41px",
                                    backgroundColor: mounted && theme === "light" ? "#E5E7EB" : "#2E313C",
                                    borderRadius: "100px",
                                    padding: "6px 8px",
                                }}
                            >
                                <button
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "flex items-center justify-center transition-all",
                                        mounted && theme === "light" ? "bg-white shadow-sm rounded-full" : ""
                                    )}
                                    style={{ width: "28px", height: "28px" }}
                                >
                                    <Sun className={cn("w-[22px] h-[22px]", mounted && theme === "light" ? "text-[#ff0054]" : "text-[#515151]")} />
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "flex items-center justify-center transition-all",
                                        mounted && theme === "dark" ? "bg-[#15161B] shadow-sm rounded-full" : ""
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
                                    className={cn("w-[30px] h-[30px] text-[#515151] cursor-pointer transition-colors", mounted && theme === "light" ? "hover:text-black" : "hover:text-white")}
                                />
                                <Settings
                                    onClick={() => setIsSettingsOpen(true)}
                                    className={cn("w-[30px] h-[30px] text-[#515151] cursor-pointer transition-colors", mounted && theme === "light" ? "hover:text-black" : "hover:text-white")}
                                />
                                <LayoutGrid className={cn("w-[30px] h-[30px] text-[#515151] cursor-pointer transition-colors", mounted && theme === "light" ? "hover:text-black" : "hover:text-white")} />
                                {/* Global User Profile Popover */}
                                <div className="relative">
                                    <div
                                        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                                        className="cursor-pointer flex items-center gap-1 group"
                                    >
                                        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#FF0054] to-[#88007F] p-0.5 shadow-lg shadow-accent-indigo/20 group-hover:scale-105 transition-transform group-active:scale-95 overflow-hidden">
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
                                        <ChevronDown className={cn("w-4 h-4 text-[#515151] transition-transform duration-200", isPopoverOpen && "rotate-180")} />
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

                {/* Header border INSIDE the white container */}
                <div className="w-full flex justify-center shrink-0 z-20" style={{ marginTop: "25px", marginBottom: "30px" }}>
                    <div style={{ height: "1px", backgroundColor: theme === "light" ? "#E5E7EB" : "#303030", width: "100%", maxWidth: "1520px" }} />
                </div>
            </header>

            {isSettingsOpen && (
                <WorkspaceProvider>
                    <GlobalSettingsView
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                    />
                </WorkspaceProvider>
            )}

            {isTemplateModalOpen && (
                <CreateBrandbookFromTemplateModal
                    open={isTemplateModalOpen}
                    onOpenChange={setIsTemplateModalOpen}
                />
            )}
        </>
    )
}
