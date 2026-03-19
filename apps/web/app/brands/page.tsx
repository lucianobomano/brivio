import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Filter, List } from "lucide-react"
import { BrandCard } from "@/components/brands/BrandCard"
import { CreateBrandCard } from "@/components/brands/CreateBrandCard"
import { BrandUtilityBar } from "@/components/brands/BrandUtilityBar"
import { Logo } from "@/components/layout/Logo"

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
            {/* Header */}
            <header className="bg-white dark:bg-bg-0 pt-[50px] pb-[80px] flex flex-col items-center">
                <div className="flex items-center justify-between max-w-[1140px] w-full">
                    <Logo className="h-8" />

                    {/* Utility Bar */}
                    <BrandUtilityBar
                        avatarUrl={user?.user_metadata?.avatar_url}
                        userEmail={user?.email}
                    />
                </div>

                {/* Custom Separator Line */}
                <div className="w-full max-w-[1140px] h-[1px] bg-bg-3 mt-[25px] mx-auto" />
            </header>

            {/* Search & Filters */}
            <div className="py-8 flex justify-center">
                <div className="w-full max-w-[1140px]">
                    <div className="flex items-center justify-end gap-6">
                        <div className="relative w-full max-w-md">
                            <input
                                type="search"
                                placeholder="Pesquisar"
                                className="w-full bg-transparent border-b border-gray-700 px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                            />
                        </div>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                            <Filter className="w-4 h-4" />
                            <span>Filtrar por</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                            <List className="w-4 h-4" />
                            <span>Lista</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="pb-16 flex justify-center">
                <div className="w-full max-w-[1140px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Create New Card */}
                        <CreateBrandCard
                            userName={user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}
                            brandsCount={brandsList.length}
                        />

                        {/* Brand Cards */}
                        {brandsList.map((brand) => (
                            <BrandCard key={brand.id} brand={brand} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
