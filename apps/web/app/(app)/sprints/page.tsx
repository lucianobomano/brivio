import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { SprintsClient } from "./SprintsClient"
import { getSprints } from "@/app/actions/sprints"
import { getProjectOptions } from "@/app/actions/projects"

export default async function SprintsPage() {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all sprints (you might want to filter by workspace in the future)
    // and, in parallel, projects for selection in modal
    const [initialSprints, projects] = await Promise.all([
        getSprints({}),
        getProjectOptions(),
    ])

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Creative Director"
    }

    return (
        <>
            <SprintsClient
                initialSprints={initialSprints}
                projects={projects as any[]}
            />
        </>
    )
}
