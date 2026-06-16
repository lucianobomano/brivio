import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getTaskLists } from "@/app/actions/tasks"
import TasksClientPage from "./TasksClient"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's task lists
    const lists = await getTaskLists(user.id)

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
                initialLists={lists}
            />
        </AuthLayoutInner>
    )
}
