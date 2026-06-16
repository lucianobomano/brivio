"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { BottomNavigation } from "./BottomNavigation"
import { WorkspaceProvider } from "../providers/WorkspaceProvider"
import { cn } from "@/lib/utils"
import { useSpaNavigation } from "../providers/SpaNavigationProvider"
import dynamic from "next/dynamic"

const DynamicDashboardClient = dynamic(() => import("@/app/dashboard/DashboardClient").then(mod => mod.DashboardClient), { ssr: false })
const DynamicProjectsClient = dynamic(() => import("../projects/ProjectsClient").then(mod => mod.ProjectsClient), { ssr: false })
const DynamicTasksClientPage = dynamic(() => import("@/app/tasks/TasksClient"), { ssr: false })
const DynamicRoadmapClient = dynamic(() => import("@/app/roadmap/RoadmapClient").then(mod => mod.RoadmapClient), { ssr: false })
const DynamicFocusClient = dynamic(() => import("@/app/focus/FocusClient").then(mod => mod.FocusClient), { ssr: false })
const DynamicSprintsClient = dynamic(() => import("@/app/sprints/SprintsClient").then(mod => mod.SprintsClient), { ssr: false })
const DynamicStandupListClient = dynamic(() => import("../standups/StandupListClient").then(mod => mod.StandupListClient), { ssr: false })

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
    const { activeView } = useSpaNavigation()

    console.log("AuthLayoutInner render: activeView =", activeView, "pathname =", pathname)

    // Determine current logical route based on activeView
    const currentPathname = activeView === "dashboard" ? "/dashboard" :
                            activeView === "projects" ? "/projects" :
                            activeView === "tasks" ? "/tasks" :
                            activeView === "roadmap" ? "/roadmap" :
                            activeView === "focus" ? "/focus" :
                            activeView === "sprints" ? "/sprints" :
                            activeView === "standups" ? "/standups" : pathname

    const isProjectsPage = currentPathname === "/projects" || currentPathname === "/standups" || currentPathname.startsWith("/sprints") || currentPathname === "/assets" || currentPathname === "/tasks" || currentPathname === "/roadmap" || currentPathname === "/focus"
    const isDashboard = currentPathname === "/dashboard"

    const isCommunity = currentPathname === "/community" || currentPathname === "/creators-pool" || currentPathname === "/brandbooks" || currentPathname.startsWith("/creators/") || currentPathname === "/settings" || currentPathname === "/jobs"

    // Use traditional sidebar if NOT on projects page AND showSidebar is true
    const shouldShowSidebar = showSidebar && !isProjectsPage

    const renderSpaContent = () => {
        const cleanPath = pathname.split("?")[0]
        console.log("renderSpaContent: activeView =", activeView, "cleanPath =", cleanPath)
        if (activeView === "dashboard" && cleanPath !== "/dashboard") {
            return <DynamicDashboardClient userName={user.name} hasWorkspace={true} workspaceId={workspaceId} />
        }
        if (activeView === "projects" && cleanPath !== "/projects") {
            return <DynamicProjectsClient 
                initialProjects={[]} 
                initialStages={[]} 
                workspaceId={workspaceId} 
                user={{ id: "", email: user.email, profile: { name: user.name, avatar_url: user.avatar } }} 
            />
        }
        if (activeView === "tasks" && cleanPath !== "/tasks") {
            return <DynamicTasksClientPage user={{ id: "", name: user.name }} initialLists={[]} />
        }
        if (activeView === "roadmap" && cleanPath !== "/roadmap") {
            return <DynamicRoadmapClient initialProjects={[]} initialRoadmap={[]} selectedProjectId={null} selectedProject={null} />
        }
        if (activeView === "focus" && cleanPath !== "/focus") {
            return <DynamicFocusClient projects={[]} initialRoadmap={[]} selectedProject={null} />
        }
        if (activeView === "sprints" && !cleanPath.startsWith("/sprints")) {
            return <DynamicSprintsClient initialSprints={[]} projects={[]} />
        }
        if (activeView === "standups" && !cleanPath.startsWith("/standups")) {
            return <DynamicStandupListClient workspaceId={workspaceId} initialStandups={[]} />
        }
        return children
    }

    return (
        <WorkspaceProvider initialWorkspaceId={workspaceId}>
            <div className={cn(
                "flex min-h-screen bg-bg-0 selection:bg-accent-indigo selection:text-white",
                (isProjectsPage && currentPathname !== "/assets") ? "pb-32" : ""
            )}>
                {/* Bottom Navigation is shown for all SPA-enabled pages */}
                {isProjectsPage && <BottomNavigation />}

                {/* The Sidebar is shown on other pages if requested (original behavior) */}
                {shouldShowSidebar && <Sidebar user={user} />}

                <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                    {/* Main Content Area */}
                    <main className={cn(
                        "flex-1 overflow-y-auto w-full",
                        shouldShowSidebar ? "p-8" : (isDashboard || isCommunity || currentPathname === "/assets" || currentPathname === "/standups" || currentPathname === "/tasks" || currentPathname === "/roadmap" || currentPathname === "/focus") ? "p-0" : "p-8"
                    )}>
                        <div className={cn(
                            "w-full",
                            (shouldShowSidebar || (!isDashboard && !isCommunity && currentPathname !== "/assets" && currentPathname !== "/tasks" && currentPathname !== "/roadmap" && currentPathname !== "/focus")) ? "max-w-[1600px] mx-auto" : ""
                        )}>
                            {renderSpaContent()}
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
