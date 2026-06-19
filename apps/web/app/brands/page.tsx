import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StandupHeader } from "@/components/standups/StandupHeader"
import { BrandsClient } from "./BrandsClient"

export default async function BrandsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Use Admin Client to bypass RLS for fetching
    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // 1. Get user's authorized workspaces
    const { data: members } = await adminSupabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)

    const workspaceIds = members?.map(m => m.workspace_id) || []

    // 2. Fetch Brands in those workspaces with their brandbooks
    const { data: brands, error } = await adminSupabase
        .from('brands')
        .select(`
            *,
            brandbooks (
                *
            )
        `)
        .in('workspace_id', workspaceIds)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error("Error fetching brands:", error)
    }

    const brandsList = brands || []

    return (
        <div className="min-h-screen bg-[#EFF0F2] dark:bg-bg-0 selection:bg-[#FF0054] selection:text-white pb-20">
            <StandupHeader />
            <BrandsClient brandsList={brandsList} user={user} />
        </div>
    )
}
