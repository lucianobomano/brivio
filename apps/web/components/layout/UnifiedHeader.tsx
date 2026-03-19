"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
    LayoutGrid,
    Plus,
    ChevronDown,
    Sun,
    Moon,
    Home,
    Settings,
    Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { UserProfilePopover } from "./UserProfilePopover"

interface AppUser {
    id: string
    email: string
    profile?: {
        name: string
        avatar_url?: string
        cover_url?: string
        profile_type?: string
    }
    creatorProfile?: {
        category: string
    }
}

interface UnifiedHeaderProps {
    user: AppUser | null
    onAddClick: () => void
    addLabel: string
    onSecondaryAddClick?: () => void
    secondaryAddLabel?: string
    onSettingsClick?: () => void
    children?: React.ReactNode // For inserting custom elements if needed
}

export function UnifiedHeader({
    user,
    onAddClick,
    addLabel,
    onSecondaryAddClick,
    secondaryAddLabel,
    onSettingsClick,
}: UnifiedHeaderProps) {
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
    const popoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current)
        setIsPopoverOpen(true)
    }

    const handleMouseLeave = () => {
        popoverTimeoutRef.current = setTimeout(() => {
            setIsPopoverOpen(false)
        }, 150)
    }

    const handleAvatarClick = () => {
        if (user?.id) router.push(`/creators/${user.id}`)
    }

    return (
        <>
            <header className="w-full shrink-0 bg-bg-0 z-30 flex justify-center" style={{ height: "61px" }}>
                <div className="flex items-center justify-between h-full w-full" style={{ maxWidth: "1520px" }}>
                    {/* Logo */}
                    <div className="flex items-center relative cursor-pointer" style={{ width: "143px", height: "40px" }} onClick={() => router.push('/dashboard')}>
                        <Image
                            src={theme === "light" ? "/brand/logo-light.png" : "/brand/logo-dark.png"}
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
                                {/* Main Add Button */}
                                <button
                                    onClick={onAddClick}
                                    className="flex items-center justify-center text-white text-sm font-bold group"
                                    style={{
                                        width: "143px",
                                        height: "41px",
                                        borderRadius: "100px 0 0 100px",
                                        background: "linear-gradient(135deg, #FF0054, #88007F, #06D6A0, #311C99)",
                                        padding: "3px",
                                    }}
                                >
                                    <span
                                        className="flex items-center justify-center w-full h-full bg-[#15171F] group-hover:bg-[#15171F]/80 transition-colors"
                                        style={{ borderRadius: "97px 0 0 97px", padding: "0 27px" }}
                                    >
                                        {addLabel}
                                    </span>
                                </button>
                                {/* Dropdown Trigger */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="flex items-center justify-center group"
                                            style={{
                                                width: "44px",
                                                height: "41px",
                                                borderRadius: "0 100px 100px 0",
                                                background: "linear-gradient(135deg, #FF0054, #88007F, #06D6A0, #311C99)",
                                                padding: "3px",
                                            }}
                                        >
                                            <span
                                                className="flex items-center justify-center w-full h-full bg-[#15171F] group-hover:bg-[#15171F]/80 transition-colors"
                                                style={{ borderRadius: "0 97px 97px 0", padding: "0 15px" }}
                                            >
                                                <ChevronDown className="w-6 h-6 text-white" />
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[220px] bg-bg-1 border-bg-3 p-2 rounded-2xl shadow-2xl z-[100]">
                                        <DropdownMenuLabel className="text-[10px] font-black text-text-tertiary uppercase tracking-widest px-3 py-2">Quick Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={onAddClick}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-indigo/5 cursor-pointer group/item"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover/item:bg-accent-indigo group-hover/item:text-white transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text-primary">{addLabel}</span>
                                                <span className="text-[10px] text-text-tertiary">Create new item</span>
                                            </div>
                                        </DropdownMenuItem>

                                        {onSecondaryAddClick && (
                                            <DropdownMenuItem
                                                onClick={onSecondaryAddClick}
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-indigo/5 cursor-pointer group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple group-hover/item:bg-accent-purple group-hover/item:text-white transition-colors">
                                                    <LayoutGrid className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-text-primary">{secondaryAddLabel || "Other Action"}</span>
                                                    <span className="text-[10px] text-text-tertiary">Secondary action</span>
                                                </div>
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator className="bg-bg-3 my-2" />
                                        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-indigo/5 cursor-pointer group/item opacity-50">
                                            <div className="w-8 h-8 rounded-lg bg-bg-2 flex items-center justify-center text-text-tertiary">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text-primary">AI Template</span>
                                                <span className="text-[10px] text-text-tertiary">Generate via intelligence</span>
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
                                        theme === "light" ? "bg-[#15161B] rounded-full" : ""
                                    )}
                                    style={{ width: "28px", height: "28px" }}
                                >
                                    <Sun className={cn("w-[22px] h-[22px]", theme === "light" ? "text-[#ff0054]" : "text-[#515151]")} />
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "flex items-center justify-center transition-all",
                                        theme === "dark" ? "bg-[#15161B] rounded-full" : ""
                                    )}
                                    style={{ width: "28px", height: "28px" }}
                                >
                                    <Moon className={cn("w-[22px] h-[22px]", theme === "dark" ? "text-[#ff0054]" : "text-[#515151]")} />
                                </button>
                            </div>

                            {/* Icons Group */}
                            <div className="flex items-center ml-auto" style={{ gap: "16px" }}>
                                <Home
                                    onClick={() => router.push("/dashboard")}
                                    className="w-[30px] h-[30px] text-[#515151] cursor-pointer hover:text-white transition-colors"
                                />
                                <Settings
                                    onClick={onSettingsClick}
                                    className="w-[30px] h-[30px] text-[#515151] cursor-pointer hover:text-white transition-colors"
                                />
                                <LayoutGrid className="w-[30px] h-[30px] text-[#515151] cursor-pointer hover:text-white transition-colors" />
                                {/* Global User Profile Popover */}
                                <div className="relative">
                                    <div
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={handleAvatarClick}
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

            {/* Header border with gap */}
            <div className="w-full flex justify-center shrink-0 z-20" style={{ marginTop: "25px" }}>
                <div style={{ height: "1px", backgroundColor: "#303030", width: "1520px" }} />
            </div>
        </>
    )
}
