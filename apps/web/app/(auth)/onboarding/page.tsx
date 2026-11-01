import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import { getDefaultWorkspace } from "@/lib/workspace"
import { safeNext } from "@/lib/auth-helpers"
import OnboardingFlow from "./OnboardingFlow"

export const metadata: Metadata = { title: "Bem-vindo · Brivio" }

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const { next } = await searchParams
    const user = await getCurrentUser()
    if (!user) redirect('/login?next=/onboarding')
    // Already set up: nothing to do here
    if (await getDefaultWorkspace()) redirect(safeNext(next))

    const meta = user.user_metadata || {}
    const name: string = meta.name || meta.full_name || user.email?.split('@')[0] || ''
    const role: string = meta.role_global || 'designer'
    return (
        <OnboardingFlow
            firstName={name.split(' ')[0]}
            initialType={role === 'agency_owner' ? 'agency' : role === 'client' ? 'company' : 'personal'}
            next={safeNext(next)}
        />
    )
}
