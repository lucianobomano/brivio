"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "./Logo"
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Briefcase,
    Search,
    Bell,
    BookOpen,
    Globe,
    Settings
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProjectEditorModal } from "@/components/ProjectEditorModal"
import { createProjectDraft } from "@/app/actions/project-editor"
import { createClient } from "@/lib/supabase/client"
import { UserProfilePopover } from "./UserProfilePopover"
import { GlobalSettingsView } from "@/components/settings/GlobalSettingsView"
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider"

export function Navbar() {
    const pathname = usePathname()
    const router = useRouter()

    const [isEditorOpen, setIsEditorOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [currentProject, setCurrentProject] = React.useState<any>(undefined)
    const [isCreating, setIsCreating] = React.useState(false)
    const [user, setUser] = React.useState<any>(null)
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
    const popoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    React.useEffect(() => {
        const supabase = createClient()
        async function fetchUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url, cover_url, profile_type')
                    .eq('id', authUser.id)
                    .single()

                // Fetch creator profile for category
                const { data: creatorProfile } = await supabase
                    .from('creator_profiles')
                    .select('category')
                    .eq('user_id', authUser.id)
                    .single()

                setUser({
                    ...authUser,
                    profile: profile,
                    creatorProfile: creatorProfile
                })
            }
        }
        fetchUser()
    }, [])

    // Hover handlers with delay for smooth UX
    const handleMouseEnter = () => {
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current)
        }
        setIsPopoverOpen(true)
    }

    const handleMouseLeave = () => {
        popoverTimeoutRef.current = setTimeout(() => {
            setIsPopoverOpen(false)
        }, 150)
    }

    const handleAvatarClick = () => {
        if (user?.id) {
            router.push(`/creators/${user.id}`)
            setIsPopoverOpen(false)
        }
    }

    const handleShareWork = async () => {
        setIsCreating(true)
        const result = await createProjectDraft()
        if (result.success) {
            setCurrentProject(result.project)
            setIsEditorOpen(true)
        } else {
            alert("Failed to create project draft: " + result.error)
        }
        setIsCreating(false)
    }
    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Users, label: "Creators", href: "/creators-pool" },
        { icon: Globe, label: "Community", href: "/community" },
        { icon: Briefcase, label: "Jobs", href: "/jobs" },
        { icon: BookOpen, label: "Brand books", href: "/brandbooks" },
        { icon: MessageSquare, label: "Messages", href: "/messages" },
    ]

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-bg-3 bg-bg-1/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-[55px] gap-8">
                    {/* Left: Brand Logo */}
                    <div className="flex items-center min-w-[150px]">
                        <Link href="/dashboard" className="flex items-center group transition-all">
                            <Logo />
                        </Link>
                    </div>

                    {/* Center: Main Nav */}
                    <nav className="flex-1 flex items-center justify-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link key={item.href} href={item.href}>
                                    <div className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5",
                                        isActive
                                            ? "bg-bg-3 text-text-primary shadow-sm"
                                            : "text-text-secondary hover:text-text-primary hover:bg-bg-2"
                                    )}>
                                        <Icon className={cn("w-4 h-4", isActive ? "text-accent-indigo" : "text-text-secondary")} />
                                        <span className="hidden xl:block">{item.label}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-4 min-w-[200px] justify-end">
                        <div className="flex items-center gap-2 pr-4 border-r border-bg-3">
                            <button className="p-2 rounded-full hover:bg-bg-2 text-text-secondary hover:text-text-primary transition-colors">
                                <Search className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 rounded-full hover:bg-bg-2 text-text-secondary hover:text-text-primary transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button className="relative p-2 rounded-full hover:bg-bg-2 text-text-secondary hover:text-text-primary transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-accent-indigo rounded-full border-2 border-bg-1" />
                            </button>
                        </div>

                        <button
                            onClick={handleShareWork}
                            disabled={isCreating}
                            className="hidden md:flex bg-text-primary text-bg-1 px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {isCreating ? "Initializing..." : "Share works"}
                        </button>

                        <div className="flex items-center gap-4">
                            <ThemeToggle />

                            {/* Avatar with popover */}
                            <div
                                className="relative"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button
                                    onClick={handleAvatarClick}
                                    className="flex items-center pl-2 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-accent-indigo border-2 border-bg-1 shadow-lg flex items-center justify-center text-xs text-white font-black group-hover:scale-110 transition-all overflow-hidden cursor-pointer">
                                        {user?.profile?.avatar_url ? (
                                            <img src={user.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{user?.profile?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "..."}</span>
                                        )}
                                    </div>
                                </button>

                                <UserProfilePopover
                                    user={user}
                                    isOpen={isPopoverOpen}
                                    onClose={() => setIsPopoverOpen(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <ProjectEditorModal
                key={currentProject?.id}
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                initialProject={currentProject}
            />

            <WorkspaceProvider>
                <GlobalSettingsView
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            </WorkspaceProvider>
        </>
    )
}
