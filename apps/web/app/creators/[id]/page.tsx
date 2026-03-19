import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreatorDetailClient } from "@/components/CreatorDetailClient"
import { getCreatorById } from "@/app/actions/creators"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export default async function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const creatorData = await getCreatorById(id) as any

    if (!creatorData) {
        return (
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold">Creator not found</h1>
                <Link href="/creators-pool" className="mt-4 text-accent-indigo">Back to Pool</Link>
            </div>
        )
    }

    interface Service {
        id: string;
        title: string;
        description: string;
        price: string;
        delivery: string;
        image: string;
        cover_url?: string;
        projects?: any[];
    }

    interface Project {
        id: string;
        name: string;
        category?: string;
        cover_url?: string;
        content_json?: any;
    }

    const userData = creatorData.user;

    const mappedCreator = {
        id: userData.id,
        name: userData.name || "Unknown",
        isPro: userData.role_global === 'designer',
        location: creatorData.location || (userData.state ? `${userData.state}, ${userData.country}` : userData.country || "Earth"),
        website: creatorData.website || userData.website || "#",
        category: creatorData.category || userData.category || "General",
        type: creatorData.type || userData.profile_type || "Individual",
        country: creatorData.country || userData.country || "Global",
        awards: {
            p: creatorData.works_count?.toString() || "0",
            w: creatorData.soty_count?.toString() || "0",
            l: creatorData.sotm_count?.toString() || "0",
            s: creatorData.sotd_count?.toString() || "0"
        },
        avatar: userData.avatar_url || null,
        initials: userData.name?.substring(0, 2).toUpperCase() || "??",
        featuredImage: "bg-gradient-to-br from-accent-indigo/10 to-transparent",
        bio: creatorData.about || userData.bio || "No bio provided.",
        about: creatorData.about || userData.about || "No about information provided.",
        skills: creatorData.expertise || [],
        tools: creatorData.tools || [],
        experience: creatorData.experience || [],
        languages: creatorData.languages || [],
        education: creatorData.education || []
    }

    const mappedProjects = creatorData.projects?.map((p: Project) => ({
        id: p.id,
        title: p.name,
        category: p.category || "Project",
        image: p.cover_url || "bg-gradient-to-br from-bg-2 to-bg-3",
        awards: [],
        content_json: p.content_json
    }))

    const mappedServices = creatorData.services?.map((s: Service) => ({
        id: s.id,
        title: s.title,
        description: s.description || "",
        price: s.price || "Contact for pricing",
        delivery: s.delivery || "TBD",
        image: s.image,
        cover_url: s.cover_url,
        projects: s.projects || []
    }))

    // Get default workspace
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)

    const targetWorkspaceId = members?.[0]?.workspace_id

    const currentUserData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <AuthLayoutInner user={currentUserData} showSidebar={false} workspaceId={targetWorkspaceId}>
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col min-h-screen relative">
                    <CreatorDetailClient
                        initialCreator={mappedCreator}
                        initialProjects={mappedProjects}
                        initialServices={mappedServices}
                    />
                </main>
            </div>
        </AuthLayoutInner>
    )
}
