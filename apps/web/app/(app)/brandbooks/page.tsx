import { Navbar } from "@/components/layout/Navbar"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BrandBooksClient } from "@/components/BrandBooksClient"
import { getPublicBrandbooks } from "@/app/actions/brandbook"

export default async function BrandBooksPage() {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const brandbooks = await getPublicBrandbooks()

    // Transform data to ensure type compatibility
    const initialBrandbooks = brandbooks.map((book: any) => ({
        id: book.id,
        title: book.title,
        brand_id: book.brand_id,
        brand: {
            id: book.brand?.id,
            name: book.brand?.name || "Unknown Brand",
            logo_url: book.brand?.logo_url,
            slug: book.brand?.slug,
            primary_color: book.brand?.primary_color
        },
        created_at: book.created_at
    }))

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <>
            <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col font-inter-tight">
                <Navbar />
                <main className="flex-1 flex flex-col min-h-screen relative">
                    <BrandBooksClient initialBrandbooks={initialBrandbooks} />
                </main>
            </div>
        </>
    )
}
