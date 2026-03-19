"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
    className?: string
}

export function Logo({ className }: LogoProps) {
    return (
        <div className={cn("relative flex items-center group transition-all", className)}>
            {/* Dark Mode Logo (White text) */}
            <Image
                src="/brand/logo-dark.png"
                alt="Brivio Logo"
                width={160}
                height={32}
                className="h-8 w-auto hidden dark:block object-contain"
                priority
                unoptimized
            />
            {/* Light Mode Logo (Black text) */}
            <Image
                src="/brand/logo-light.png"
                alt="Brivio Logo"
                width={160}
                height={32}
                className="h-8 w-auto block dark:hidden object-contain"
                priority
                unoptimized
            />
        </div>
    )
}
