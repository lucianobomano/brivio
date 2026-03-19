import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getTaskLists } from "@/app/actions/tasks"
import TasksClientPage from "./TasksClient"

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's task lists
    const lists = await getTaskLists(user.id)

    return (
        <TasksClientPage
            user={{
                id: user.id,
                name: user.user_metadata?.full_name || 'Creator'
            }}
            initialLists={lists}
        />
    )
}
