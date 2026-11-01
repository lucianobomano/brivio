import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { BrandCanvas } from "@/components/brandops/canvas/BrandCanvas"
import { getBrandSpaceDetails, generateBrandWorkflowAI } from "@/app/actions/brandops"

export default async function BrandSpacePage({
    params
}: {
    params: Promise<{ spaceId: string }>
}) {
    const { spaceId } = await params
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    const adminSupabase = await createAdminClient()

    // 1. Fetch space details
    const res = await getBrandSpaceDetails(spaceId)

    if (!res.success || !res.space) {
        notFound()
    }

    const space = res.space
    let nodes = res.nodes || []
    let relationships = res.relationships || []

    // 2. Fetch Brand details
    const { data: brand } = await adminSupabase
        .from('brands')
        .select('id, name, slug')
        .eq('id', space.brand_id)
        .single()

    const brandName = brand?.name || "Marca"

    // 3. If space is brand new and has 0 nodes, automatically seed an initial workflow
    // A new Space must open as a blank canvas; workflows are deliberately
    // user-initiated from the contextual node popover.
    if (false && nodes.length === 0) {
        const seedPrompt = `Estratégia e identidade completa para a marca ${brandName}`
        const seeded = await generateBrandWorkflowAI(space.brand_id, space.id, seedPrompt)
        if (seeded.success && seeded.nodes) {
            nodes = seeded.nodes || []
            relationships = seeded.relationships || []
        }
    }

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Creative Director"
    }

    return (
        <>
            <div className="w-full h-full min-h-screen overflow-hidden">
                <BrandCanvas
                    space={space}
                    initialNodes={nodes}
                    initialRelationships={relationships}
                    brandId={space.brand_id}
                    brandName={brandName}
                />
            </div>
        </>
    )
}
