import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StandupHeader } from "@/components/standups/StandupHeader"
import { BrandsClient } from "./BrandsClient"

export default async function BrandsPage() {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // Use Admin Client to bypass RLS for fetching
    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // PERFORMANCE: one query instead of two sequential ones — start from the user's
    // workspace memberships and embed each workspace's brands with their brandbooks
    const { data: memberships, error } = await adminSupabase
        .from('workspace_members')
        .select(`
            workspace:workspaces (
                brands (
                    *,
                    brandbooks (
                        *
                    )
                )
            )
        `)
        .eq('user_id', user.id)

    if (error) {
        console.error("Error fetching brands:", error)
    }

    const seenBrandIds = new Set<string>()
    const brandsList = (memberships || [])
        .flatMap((m: any) => (Array.isArray(m.workspace) ? m.workspace[0] : m.workspace)?.brands || [])
        .filter((b: any) => !seenBrandIds.has(b.id) && seenBrandIds.add(b.id))
        .sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())

    return (
        <div className="min-h-screen bg-[#EFF0F2] dark:bg-bg-0 selection:bg-[#FF0054] selection:text-white pb-20">
            <StandupHeader />
            <BrandsClient brandsList={brandsList} user={user} />
        </div>
    )
}
