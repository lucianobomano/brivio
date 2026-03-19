"use client"

import * as React from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingMenuProps {
    children: React.ReactNode
    leftElement?: React.ReactNode
    rightElement?: React.ReactNode
    containerClassName?: string
    showScrollTop?: boolean
}

export function FloatingMenu({
    children,
    leftElement,
    rightElement,
    containerClassName,
    showScrollTop = true
}: FloatingMenuProps) {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <div className="fixed bottom-[30px] left-0 right-0 px-[28px] z-[100] flex justify-center pointer-events-none">
            <div className="relative pointer-events-none flex items-center justify-center">

                {/* Scroll to Top */}
                {showScrollTop && (
                    <div className="absolute right-[calc(100%+480px)] bottom-0 w-[60px] h-[60px] pointer-events-auto hidden xl:flex">
                        <button
                            onClick={scrollToTop}
                            className="w-[60px] h-[60px] bg-[#222222] rounded-full flex items-center justify-center text-[#E9E9E9] shadow-xl hover:bg-[#333333] transition-colors border border-white/5"
                        >
                            <ArrowUp className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Main Menu Wrapper */}
                <div className={cn(
                    "w-fit h-[72px] bg-black/40 backdrop-blur-[40px] p-[12px] flex items-center gap-2 shadow-2xl pointer-events-auto animate-border-glow-flow relative",
                    containerClassName,
                    "rounded-full"
                )}>
                    {/* Glass Border Effect - Forced Roundness */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/5 pointer-events-none" />

                    <div className="flex items-center gap-2 relative z-10 w-full h-full">
                        {/* Left Section (Avatar or Brand Icon) */}
                        {leftElement}

                        {/* Center Section (Navigation or Tabs) - Structured Track */}
                        <div className="w-fit h-[60px] bg-[#3E3E3E]/40 rounded-full flex items-center px-1.5 gap-1.5 backdrop-blur-2xl border border-white/10 text-[#E9E9E9]">
                            {children}
                        </div>

                        {/* Right Section (CTA Button) */}
                        {rightElement}
                    </div>
                </div>
            </div>
        </div>
    )
}
