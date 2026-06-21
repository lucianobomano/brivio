"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

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

const getViewFromPath = (path: string): ViewType => {
    if (path === "/dashboard") return "dashboard"
    if (path === "/projects") return "projects"
    if (path === "/tasks") return "tasks"
    if (path === "/roadmap") return "roadmap"
    if (path === "/focus") return "focus"
    if (path === "/sprints" || path.startsWith("/sprints/")) return "sprints"
    if (path === "/standups" || path.startsWith("/standups/")) return "standups"
    if (path === "/assets") return "assets"
    if (path === "/brandops") return "brandops"
    return "other"
}

export function SpaNavigationProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const [activeView, setActiveView] = React.useState<ViewType>(getViewFromPath(pathname))
    const [initialPathname] = React.useState(pathname)

    React.useEffect(() => {
        setActiveView(getViewFromPath(pathname))
    }, [pathname])

    const navigateTo = React.useCallback((href: string) => {
        const path = href.split("?")[0]
        const view = getViewFromPath(path)
        setActiveView(view)
        window.history.pushState(null, "", href)
        // Dispatch a custom event to notify listeners of url changes without full reload
        window.dispatchEvent(new Event("popstate"))
    }, [])

    React.useEffect(() => {
        const handlePopState = () => {
            const view = getViewFromPath(window.location.pathname)
            setActiveView(view)
        }
        window.addEventListener("popstate", handlePopState)
        return () => window.removeEventListener("popstate", handlePopState)
    }, [])

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
