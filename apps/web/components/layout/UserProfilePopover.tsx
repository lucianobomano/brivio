"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Settings, User, ChevronRight, HelpCircle, LogOut, Briefcase, Repeat2, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserProfilePopoverProps {
    user: {
        id: string
        email: string
        profile?: {
            name?: string
            avatar_url?: string
            cover_url?: string
        } | null
        creatorProfile?: {
            category?: string
        } | null
    } | null
    isOpen: boolean
    onClose: () => void
}

export function UserProfilePopover({ user, isOpen, onClose }: UserProfilePopoverProps) {
    const router = useRouter()
    const popoverRef = React.useRef<HTMLDivElement>(null)

    // Close on click outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen, onClose])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    const handleProfileClick = () => {
        if (user?.id) {
            router.push(`/creators/${user.id}`)
            onClose()
        }
    }

    if (!isOpen || !user) return null

    const displayName = user.profile?.name || user.email?.split("@")[0] || "User"
    const avatarUrl = user.profile?.avatar_url
    const avatarInitials = displayName.substring(0, 2).toUpperCase()
    const category = user.creatorProfile?.category || "Creativo"

    return (
        <div
            ref={popoverRef}
            className="absolute top-full right-0 mt-2 z-[100] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            style={{ width: "297px", height: "auto", maxHeight: "600px" }}
        >
            <div className="bg-bg-1 border border-bg-3 rounded-lg shadow-2xl overflow-hidden">
                {/* Cover Image */}
                <div
                    className="h-24 w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 relative"
                    style={{
                        backgroundImage: user.profile?.cover_url ? `url(${user.profile.cover_url})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    {/* Decorative text overlay like in reference */}
                    {!user.profile?.cover_url && (
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <span className="text-4xl font-black text-white/10 uppercase tracking-widest whitespace-nowrap">
                                {displayName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Avatar - overlapping cover/content */}
                <div className="relative px-5 -mt-10">
                    <div className="w-20 h-20 rounded-full border-4 border-bg-1 bg-accent-indigo flex items-center justify-center text-white text-lg font-bold overflow-hidden shadow-lg">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{avatarInitials}</span>
                        )}
                    </div>
                </div>

                {/* User Info */}
                <div className="px-5 pt-3 pb-4">
                    <h3 className="text-lg font-bold text-text-primary">{displayName}</h3>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                </div>

                {/* PRO Button */}
                <div className="px-5 pb-4">
                    <button
                        className="w-full py-2.5 px-4 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        style={{
                            background: "linear-gradient(90deg, #FF0054 0%, #88007F 33%, #06D6A0 66%, #311C99 100%)"
                        }}
                    >
                        Actualizar para <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">PRO</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-bg-3" />

                {/* Menu Section 1 */}
                <div className="py-2">
                    <div className="px-5 py-2 text-xs text-text-tertiary">
                        A visualizar como: {category}
                    </div>
                    <button className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-bg-2 transition-colors text-text-primary">
                        <div className="flex items-center gap-3">
                            <Repeat2 className="w-4 h-4 text-text-secondary" />
                            <span className="text-sm">Alternar para Hirer</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-bg-3" />

                {/* Availability Section */}
                <div className="py-2">
                    <button className="w-full flex items-start px-5 py-2.5 hover:bg-bg-2 transition-colors text-left">
                        <Clock className="w-4 h-4 text-text-secondary mt-0.5 mr-3" />
                        <div>
                            <span className="text-sm text-text-primary">Editar minha disponibilidade</span>
                            <p className="text-xs text-text-tertiary">Freelance (disponível agora)</p>
                        </div>
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-bg-3" />

                {/* Menu Section 2 - Navigation */}
                <div className="py-2">
                    <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-bg-2 transition-colors text-text-primary text-left"
                    >
                        <User className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm">Perfil do Brivio°</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-bg-2 transition-colors text-text-primary text-left">
                        <Briefcase className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm">Brivio Portfolio</span>
                    </button>
                    <Link
                        href="/settings"
                        onClick={onClose}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-bg-2 transition-colors text-text-primary"
                    >
                        <Settings className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm">Configurações</span>
                    </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-bg-3" />

                {/* Help */}
                <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-bg-2 transition-colors text-text-primary text-left">
                        <HelpCircle className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm">Ajuda</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-bg-3" />

                {/* Logout */}
                <div className="py-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-bg-2 transition-colors text-text-primary text-left"
                    >
                        <LogOut className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm">Sair</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
