
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getSprint, getSprintTasks } from "@/app/actions/sprints"
import { SprintDetailClient } from "@/components/sprints/SprintDetailClient"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export default async function SprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Creative Director"
    }

    const sprint = await getSprint(id)

    if (!sprint) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Sprint não encontrada</h1>
                    <a href="/sprints" className="text-blue-500 hover:underline">Voltar para Sprints</a>
                </div>
            </div>
        )
    }

    const tasks = await getSprintTasks(id)

    let project = null
    if (sprint.project_id) {
        const { data } = await supabase.from('projects').select('id, name').eq('id', sprint.project_id).single()
        project = data
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false} >
            <SprintDetailClient
                sprint={sprint}
                initialTasks={tasks}
                project={project}
            />
        </AuthLayoutInner>
    )
}
