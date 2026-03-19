import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { SprintsClient } from "./SprintsClient"
import { getSprints } from "@/app/actions/sprints"
import { getProjectPipeline_v2 } from "@/app/actions/projects"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export default async function SprintsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all sprints (you might want to filter by workspace in the future)
    const initialSprints = await getSprints({})

    // Fetch projects for selection in modal
    const projects = await getProjectPipeline_v2()

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Creative Director"
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false}>
            <SprintsClient
                initialSprints={initialSprints}
                projects={projects as any[]}
            />
        </AuthLayoutInner>
    )
}
