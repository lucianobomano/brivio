import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserProjectsWithTasks } from "@/app/actions/tasks"
import TasksClientPage from "./TasksClient"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's projects with their internal tasks
    const projects = await getUserProjectsWithTasks(user.id)

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false}>
            <TasksClientPage
                user={{
                    id: user.id,
                    name: user.user_metadata?.full_name || 'Creator'
                }}
                initialProjects={projects}
            />
        </AuthLayoutInner>
    )
}
