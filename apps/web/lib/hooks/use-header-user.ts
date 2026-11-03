"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

export type HeaderUser = {
    id: string
    email: string
    profile?: { name: string, avatar_url?: string, cover_url?: string, profile_type?: string }
    creatorProfile?: { category: string }
}

/** The signed-in user as UnifiedHeader shows it (profile + creator category) */
export function useHeaderUser() {
    const [user, setUser] = React.useState<HeaderUser | null>(null)
    React.useEffect(() => {
        let alive = true
        const supabase = createClient()
        ;(async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser || !alive) return
            const [{ data: profile }, { data: creator }] = await Promise.all([
                supabase.from('users').select('name, avatar_url, cover_url, profile_type').eq('id', authUser.id).maybeSingle(),
                supabase.from('creator_profiles').select('category').eq('user_id', authUser.id).maybeSingle(),
            ])
            if (!alive) return
            setUser({
                id: authUser.id,
                email: authUser.email || '',
                profile: profile ? { name: profile.name, avatar_url: profile.avatar_url ?? undefined, cover_url: profile.cover_url ?? undefined, profile_type: profile.profile_type ?? undefined } : undefined,
                creatorProfile: creator ? { category: creator.category } : undefined,
            })
        })()
        return () => { alive = false }
    }, [])
    return user
}
