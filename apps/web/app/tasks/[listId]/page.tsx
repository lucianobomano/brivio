import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getTaskList, getTasksByList } from "@/app/actions/tasks"
import KanbanBoard from "./KanbanBoard"

interface PageProps {
    params: Promise<{ listId: string }>
}

export default async function ListDetailPage({ params }: PageProps) {
    const { listId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch list and tasks
    const list = await getTaskList(listId)

    if (!list) {
        redirect('/tasks')
    }

    const tasks = await getTasksByList(listId)

    return (
        <KanbanBoard
            list={list}
            initialTasks={tasks}
            userId={user.id}
        />
    )
}
