import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProjectDetailClient } from "@/components/ProjectDetailClient"
import { getProjectById } from "@/app/actions/projects"

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const { id } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const projectData = await getProjectById(id)

    if (!projectData) {
        return (
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold">Project not found</h1>
                <Link href="/community" className="mt-4 text-accent-indigo">Back to Community</Link>
            </div>
        )
    }

    const mappedProject = {
        id: projectData.id,
        title: projectData.name,
        category: projectData.category || "Project",
        description: projectData.description || "",
        stats: { views: "0", appreciates: "0", comments: "0" },
        images: projectData.cover_url
            ? [projectData.cover_url, ...(projectData.media?.map((m: { url: string }) => m.url) || [])]
            : projectData.media?.length > 0
                ? projectData.media.map((m: { url: string }) => m.url)
                : ["bg-gradient-to-br from-indigo-500/20 to-purple-500/20"],
        tools: [],
        credits: projectData.credits?.map((c: { role: string; name: string }) => ({ role: c.role, name: c.name })) || [],
        tags: projectData.tags || []
    }

    const mappedCreator = {
        id: projectData.creator?.id || "",
        name: projectData.creator?.name || "Unknown",
        avatar: projectData.creator?.name?.substring(0, 2).toUpperCase() || "??",
        location: "Global",
        isPro: projectData.creator?.role_global === 'designer'
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-0">
            <Navbar />
            <ProjectDetailClient
                initialProject={mappedProject}
                initialCreator={mappedCreator}
            />
        </div>
    )
}
