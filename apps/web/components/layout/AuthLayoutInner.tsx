"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { BottomNavigation } from "./BottomNavigation"
import { WorkspaceProvider } from "../providers/WorkspaceProvider"
import { cn } from "@/lib/utils"
import { getViewFromPath } from "../providers/SpaNavigationProvider"

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
    initialWorkspace?: any
}

export function AuthLayoutInner({ children, user, showSidebar = true, workspaceId, initialWorkspace }: AuthLayoutInnerProps) {
    const pathname = usePathname()
    // Layout follows the committed URL (not the pending nav view) so it always matches the rendered page
    const activeView = getViewFromPath(pathname)

    // Determine current logical route based on activeView
    const currentPathname = activeView === "dashboard" ? "/dashboard" :
                            activeView === "projects" ? "/projects" :
                            activeView === "tasks" ? "/tasks" :
                            activeView === "roadmap" ? "/roadmap" :
                            activeView === "focus" ? "/focus" :
                            activeView === "sprints" ? "/sprints" :
                            activeView === "standups" ? "/standups" :
                            activeView === "assets" ? "/assets" :
                            activeView === "brandops" ? "/brandops" : pathname

    // Studio pages built like Projects: their own full-height shell (side menu + breadcrumb bar), no padding around
    const isStudioShell = ["/crm", "/team", "/inventory", "/finances", "/roadmap"].some(p => currentPathname === p || currentPathname.startsWith(`${p}/`))
    const isProjectsPage = currentPathname === "/projects" || currentPathname === "/standups" || currentPathname.startsWith("/sprints") || currentPathname === "/assets" || currentPathname === "/tasks" || currentPathname === "/roadmap" || currentPathname === "/focus" || isStudioShell
    const isDashboard = currentPathname === "/dashboard"

    const isCommunity = currentPathname === "/community" || currentPathname === "/creators-pool" || currentPathname === "/brandbooks" || currentPathname.startsWith("/creators/") || currentPathname === "/settings" || currentPathname === "/jobs"
    const isBrandOpsSpace = pathname.startsWith('/brandops/')

    // Use traditional sidebar if NOT on projects page AND showSidebar is true
    const shouldShowSidebar = showSidebar && !isProjectsPage

    return (
        <WorkspaceProvider initialWorkspaceId={workspaceId} initialWorkspace={initialWorkspace}>
            <div className={cn(
                "flex min-h-screen h-screen overflow-hidden bg-bg-0 selection:bg-accent-indigo selection:text-white",
                (isProjectsPage && currentPathname !== "/assets" && currentPathname !== "/projects" && !isStudioShell) ? "pb-24" : ""
            )}>
                {/* Bottom Navigation is shown for all SPA-enabled pages */}
                {isProjectsPage && <BottomNavigation />}

                {/* The Sidebar is shown on other pages if requested (original behavior) */}
                {shouldShowSidebar && <Sidebar user={user} />}

                <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                    {/* Main Content Area */}
                    <main className={cn(
                        "flex-1 overflow-y-auto w-full",
                        isBrandOpsSpace || isStudioShell ? "p-0 overflow-hidden" : shouldShowSidebar ? "p-8" : (isDashboard || isCommunity || currentPathname === "/projects" || currentPathname === "/assets" || currentPathname === "/standups" || currentPathname === "/tasks" || currentPathname === "/roadmap" || currentPathname === "/focus") ? "p-0" : "p-8"
                    )}>
                        <div className={cn(
                            "w-full h-full",
                            (!isBrandOpsSpace && !isStudioShell && (shouldShowSidebar || (!isDashboard && !isCommunity && currentPathname !== "/projects" && currentPathname !== "/assets" && currentPathname !== "/tasks" && currentPathname !== "/roadmap" && currentPathname !== "/focus"))) ? "max-w-[1600px] mx-auto" : ""
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
