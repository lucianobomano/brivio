import { createAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BrandOpsHomeClient } from "@/components/brandops/BrandOpsHomeClient"
import { createBrandSpace } from "@/app/actions/brandops"
import type { BrandSpace } from "@/components/brandops/types"

type BrandRow = { id: string, name: string, slug: string, brand_spaces: BrandSpace[] | null }
type WorkspaceRow = { id: string, brands: BrandRow[] | null }

export default async function BrandOpsPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // PERFORMANCE: brands and their spaces come embedded in the user's workspaces, in one parallel
    // round-trip (memberships + workspaces they created), instead of workspaces -> brands -> access
    // check -> spaces one after another.
    // SECURITY: the admin client bypasses RLS, so everything is reached through the user's own workspaces.
    const adminSupabase = await createAdminClient()
    const select = 'id, brands(id, name, slug, brand_spaces(*))'
    const [{ data: memberships }, { data: owned }] = await Promise.all([
        adminSupabase.from('workspace_members').select(`workspace:workspaces(${select})`).eq('user_id', user.id),
        adminSupabase.from('workspaces').select(select).eq('created_by', user.id),
    ])

    const workspaces: WorkspaceRow[] = [
        ...(memberships || []).flatMap((m: any) => (Array.isArray(m.workspace) ? m.workspace : [m.workspace])),
        ...((owned || []) as any[]),
    ].filter(Boolean)
    const brandRows = [...new Map(workspaces.flatMap(w => w.brands || []).map(b => [b.id, b])).values()]
        .sort((a, b) => a.name.localeCompare(b.name))

    const brands = brandRows.map(({ id, name, slug }) => ({ id, name, slug }))
    const defaultBrandId = brands[0]?.id

    // 2. Spaces of the active brand, most recently updated first
    let spaces: BrandSpace[] = [...(brandRows[0]?.brand_spaces || [])]
        .sort((a: any, b: any) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))

    // If no space exists, create an initial "Master Brand Space"
    if (spaces.length === 0 && defaultBrandId) {
        const newSpaceRes = await createBrandSpace(
            defaultBrandId,
            `Master Brand Space — ${brands[0]?.name}`,
            "Ambiente central de estratégia, identidade e operações da marca"
        )
        if (newSpaceRes.success && newSpaceRes.space) {
            spaces = [newSpaceRes.space]
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
            <BrandOpsHomeClient
                brands={brands}
                initialSpaces={spaces}
                user={userData}
            />
        </>
    )
}
