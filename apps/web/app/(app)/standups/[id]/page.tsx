import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StandupDetailClient } from "@/components/standups/StandupDetailClient"

import { getStandupDetails } from "@/app/actions/standups"

export default async function StandupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Team Member"
    }

    const standup = await getStandupDetails(id)

    if (!standup) {
        return <div>Standup not found</div>
    }

    return (
        <>
            <StandupDetailClient initialStandup={standup} currentUser={user} />
        </>
    )
}
