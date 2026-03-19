"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { BottomNavigation } from "./BottomNavigation"
import { WorkspaceProvider } from "../providers/WorkspaceProvider"
import { cn } from "@/lib/utils"

interface AuthLayoutInnerProps {
    children: React.ReactNode
    user: {
        name: string
        email: string
        avatar?: string
        role?: string
    }
    showSidebar?: boolean
    workspaceId?: string
}

export function AuthLayoutInner({ children, user, showSidebar = true, workspaceId }: AuthLayoutInnerProps) {
    const pathname = usePathname()
    const isProjectsPage = pathname === "/projects" || pathname === "/standups" || pathname.startsWith("/sprints") || pathname === "/assets"
    const isDashboard = pathname === "/dashboard"

    const isCommunity = pathname === "/community" || pathname === "/creators-pool" || pathname === "/brandbooks" || pathname.startsWith("/creators/") || pathname === "/settings" || pathname === "/jobs"

    // Use traditional sidebar if NOT on projects page AND showSidebar is true
    const shouldShowSidebar = showSidebar && !isProjectsPage

    return (
        <WorkspaceProvider initialWorkspaceId={workspaceId}>
            <div className={cn(
                "flex min-h-screen bg-bg-0 selection:bg-accent-indigo selection:text-white",
                (isProjectsPage && pathname !== "/assets") ? "pb-32" : ""
            )}>
                {/* The Bottom Navigation is shown only on projects page */}
                {isProjectsPage && <BottomNavigation />}

                {/* The Sidebar is shown on other pages if requested (original behavior) */}
                {shouldShowSidebar && <Sidebar user={user} />}

                <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                    {/* Main Content Area */}
                    <main className={cn(
                        "flex-1 overflow-y-auto w-full",
                        shouldShowSidebar ? "p-8" : (isDashboard || isCommunity || pathname === "/assets" || pathname === "/standups") ? "p-0" : "p-8"
                    )}>
                        <div className={cn(
                            "w-full",
                            (shouldShowSidebar || (!isDashboard && !isCommunity && pathname !== "/assets")) ? "max-w-[1600px] mx-auto" : ""
                        )}>
                            {children}
                        </div>
                    </main>

                    {/* Ambient background effects */}
                    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-accent-indigo/5 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-indigo/5 rounded-full blur-[120px]" />
                    </div>
                </div>
            </div>
        </WorkspaceProvider>
    )
}
