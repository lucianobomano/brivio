import { Navbar } from "@/components/layout/Navbar"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { JobsClient } from "@/components/JobsClient"
import { getJobs } from "@/app/actions/jobs"

export default async function JobsPage() {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const jobsData = await getJobs()

    const initialJobs = jobsData.map(job => ({
        id: job.id,
        title: job.title,
        company: job.brand?.name || "Unknown",
        companyLogo: job.brand?.logo_url || job.brand?.name?.substring(0, 2).toUpperCase() || "??",
        location: job.location || "Remote",
        type: job.type || "Full-time",
        salary: job.salary_range || "Negotiable",
        posted: "Recently", // Simplification
        category: job.category || "Design",
        website: job.brand?.website || "#",
        description: job.description
    }))

    const currentUserData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <>
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col min-h-screen relative">
                    <JobsClient initialJobs={initialJobs} />
                </main>
            </div>
        </>
    )
}
