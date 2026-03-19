import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { JobDetailClient } from "@/components/JobDetailClient"
import { getJobById } from "@/app/actions/jobs"

export default async function JobDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const jobData = await getJobById(params.id)

    if (!jobData) {
        return (
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold">Job not found</h1>
                <Link href="/jobs" className="mt-4 text-accent-indigo">Back to Jobs</Link>
            </div>
        )
    }

    const mappedJob = {
        id: jobData.id,
        title: jobData.title,
        company: jobData.brand?.name || "Unknown",
        companyLogo: jobData.brand?.logo_url || jobData.brand?.name?.substring(0, 2).toUpperCase() || "??",
        location: jobData.location || "Remote",
        type: jobData.type || "Full-time",
        salary: jobData.salary_range || "Negotiable",
        posted: jobData.created_at ? new Date(jobData.created_at).toLocaleDateString() : "Recently",
        category: jobData.category || "Design",
        country: "Global", // Can be extended in DB
        website: jobData.brand?.website || "#",
        description: jobData.description || "No description provided."
    }

    return (
        <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col min-h-screen relative">
                <JobDetailClient initialJob={mappedJob} />
            </main>
        </div>
    )
}
