"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "nextjs-toploader/app"

export type ViewType = 
    | "dashboard" 
    | "projects" 
    | "tasks" 
    | "roadmap" 
    | "focus" 
    | "sprints" 
    | "standups" 
    | "crm" 
    | "team" 
    | "inventory" 
    | "finances"
    | "assets"
    | "brandops"
    | "other"

interface SpaNavigationContextProps {
    activeView: ViewType
    setActiveView: (view: ViewType) => void
    navigateTo: (href: string) => void
    initialPathname: string
}

const SpaNavigationContext = React.createContext<SpaNavigationContextProps | undefined>(undefined)

export const getViewFromPath = (path: string): ViewType => {
    if (path === "/dashboard") return "dashboard"
    if (path === "/projects") return "projects"
    if (path === "/tasks") return "tasks"
    if (path === "/roadmap") return "roadmap"
    if (path === "/focus") return "focus"
    if (path === "/sprints" || path.startsWith("/sprints/")) return "sprints"
    if (path === "/standups" || path.startsWith("/standups/")) return "standups"
    if (path === "/assets") return "assets"
    if (path === "/brandops" || path.startsWith("/brandops/")) return "brandops"
    return "other"
}

export function SpaNavigationProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    // PERFORMANCE: navigation goes through the Next.js router (prefetch, loading.tsx, no full reload).
    // The view is derived from the pathname so it can never lag behind the URL during a transition;
    // pendingView only gives instant active-state feedback until the new route commits.
    const [pendingView, setPendingView] = React.useState<ViewType | null>(null)
    const [initialPathname] = React.useState(pathname)

    React.useEffect(() => {
        setPendingView(null)
    }, [pathname])

    const activeView = pendingView ?? getViewFromPath(pathname)

    const setActiveView = React.useCallback((view: ViewType) => setPendingView(view), [])

    const navigateTo = React.useCallback((href: string) => {
        setPendingView(getViewFromPath(href.split("?")[0]))
        router.push(href)
    }, [router])

    return (
        <SpaNavigationContext.Provider value={{ activeView, setActiveView, navigateTo, initialPathname }}>
            {children}
        </SpaNavigationContext.Provider>
    )
}

export function useSpaNavigation() {
    const context = React.useContext(SpaNavigationContext)
    if (!context) {
        throw new Error("useSpaNavigation must be used within SpaNavigationProvider")
    }
    return context
}
