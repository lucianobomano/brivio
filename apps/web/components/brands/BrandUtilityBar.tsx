"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Sun, Moon, Home, Settings, Grid, ToggleLeft } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface BrandUtilityBarProps {
    avatarUrl?: string
    userEmail?: string
}

export function BrandUtilityBar({ avatarUrl, userEmail }: BrandUtilityBarProps) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Prevent hydration mismatch by rendering a skeleton or same structure with static default
        // For simplicity, render the dark version structure statically or return null
        return <div className="w-[445px] h-[60px] bg-[#15171F] rounded-[12px]" />
    }

    const isDark = resolvedTheme === 'dark'

    return (
        <div className="w-[445px] h-[60px] bg-bg-1 border border-bg-3 rounded-[12px] flex items-center justify-center transition-colors duration-300">
            <div className="flex items-center gap-[20px]">
                {/* Report Button */}
                <div className="relative group rounded-full p-[3px] bg-gradient-to-r from-[#FF0054] via-[#88007F] to-[#06D6A0]">
                    <button className="px-6 py-1.5 bg-bg-1 text-text-primary rounded-full text-sm font-medium transition-all duration-300 group-hover:bg-transparent group-hover:text-white">
                        Report
                    </button>
                </div>

                {/* Theme Switcher Group */}
                <div className="flex items-center gap-[6px]">
                    <button
                        onClick={() => setTheme('light')}
                        className={`transition-colors ${theme === 'light' ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'}`}
                    >
                        <Sun className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
                    >
                        <svg width="42" height="24" viewBox="0 0 42 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                            <rect width="42" height="24" rx="12" fill="currentColor" className="opacity-20" />
                            <circle
                                cx={isDark ? "30" : "12"}
                                cy="12"
                                r="8"
                                fill="currentColor"
                                className="transition-all duration-300 ease-in-out"
                            />
                        </svg>
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className={`transition-colors ${theme === 'dark' ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'}`}
                    >
                        <Moon className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Feature Group */}
                <div className="flex items-center gap-[16px]">
                    <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                        <Home className="w-[30px] h-[30px]" />
                    </Link>
                    <button className="text-text-secondary hover:text-text-primary transition-colors">
                        <Settings className="w-[30px] h-[30px]" />
                    </button>
                    <button className="text-text-secondary hover:text-text-primary transition-colors">
                        <Grid className="w-[30px] h-[30px]" />
                    </button>
                    <Avatar className="w-[30px] h-[30px] border border-bg-3">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-bg-3 text-xs text-text-secondary">
                            {userEmail?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}
