import { createAdminClient, createClient } from "@/lib/supabase/server"
import BrandbookEditorWrapper from "@/components/brandbook/BrandbookEditorWrapper"


export const dynamic = 'force-dynamic'

export default async function BrandbookPage({
    params,
    searchParams
}: {
    params: Promise<{ brandId: string }>,
    searchParams: Promise<{ preview?: string }>
}) {
    const supabaseAdmin = await createAdminClient()
    const supabase = await createClient()

    // Fetch Auth User
    const { data: { user: authUser } } = await supabase.auth.getUser()

    // Fetch DB User Profile
    let userData = null
    if (authUser) {
        const { data: dbUser } = await supabaseAdmin
            .from('users')
            .select('name, avatar_url')
            .eq('id', authUser.id)
            .single()

        userData = {
            name: dbUser?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            avatar_url: dbUser?.avatar_url || authUser.user_metadata?.avatar_url
        }
    }

    const { brandId } = await params
    const { preview } = await searchParams
    const isReadOnly = preview === 'true'

    // Fetch brand to get the name
    const { data: brand } = await supabaseAdmin
        .from('brands')
        .select('name')
        .eq('id', brandId)
        .single()

    const brandName = brand?.name || ''

    // 1. Fetch Brandbook - Handle potential duplicates by taking the latest one
    // Correct table name: 'brandbooks'
    let { data: brandbook } = await supabaseAdmin
        .from('brandbooks')
        .select('*')
        .eq('brand_id', brandId)
        .order('is_public', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // 2. Create if doesn't exist
    if (!brandbook) {
        const { data: newBook, error } = await supabaseAdmin
            .from('brandbooks')
            .insert({
                brand_id: brandId,
                title: 'Brand Guidelines',
                version: '1.0'
            })
            .select()
            .single()

        if (error) {
            console.error("Failed to create brandbook:", error)
            // If duplicate key error (race condition), try fetching again
            if (error.code === '23505') {
                const { data: existing } = await supabaseAdmin
                    .from('brandbooks')
                    .select('*')
                    .eq('brand_id', brandId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                brandbook = existing
            }
        } else {
            brandbook = newBook
        }
    }

    // 3. Fetch Modules
    let { data: modules } = await supabaseAdmin
        .from('brandbook_modules')
        .select('*')
        .eq('brandbook_id', brandbook?.id)
        .order('order', { ascending: true })

    // 4. Seed Default Modules if Empty
    if (modules && modules.length === 0 && brandbook) {
        console.log('[BrandbookPage] Seeding default modules for:', brandbook.id)
        const DEFAULT_MODULES = [
            // 1. Visão geral
            { brandbook_id: brandbook.id, order: 0, title: 'Visão geral', type: 'intro', category: 'overview', content_json: {} },
            { brandbook_id: brandbook.id, order: 1, title: 'DNA da marca', type: 'dna', category: 'overview', content_json: {} },
            { brandbook_id: brandbook.id, order: 2, title: 'História da marca', type: 'history', category: 'overview', content_json: {} },
            // 2. Guia de estilo visual
            { brandbook_id: brandbook.id, order: 3, title: 'Guia de estilo visual', type: 'visual_guide', category: 'visual_guide', content_json: {} },
            // 3. Identidade Verbal
            { brandbook_id: brandbook.id, order: 4, title: 'Personalidade da marca', type: 'verbal', category: 'verbal_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 5, title: 'Tom de voz', type: 'voice_tone', category: 'verbal_identity', content_json: {} },
            // 4. Identidade Visual
            { brandbook_id: brandbook.id, order: 6, title: 'Logo', type: 'logo', category: 'visual_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 7, title: 'Cores', type: 'palette', category: 'visual_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 8, title: 'Tipografia', type: 'typography', category: 'visual_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 9, title: 'Imagens & Fotografia', type: 'photography', category: 'visual_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 10, title: 'Ilustração', type: 'illustration', category: 'visual_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 11, title: 'Grid & Layouts', type: 'layout', category: 'visual_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 12, title: 'Motion design', type: 'motion', category: 'visual_identity', content_json: {} },
            // 5. Identidade Sensorial
            { brandbook_id: brandbook.id, order: 13, title: 'Identidade sonora', type: 'sound', category: 'sensory_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 14, title: 'Identidade olfativa', type: 'scent', category: 'sensory_identity', content_json: {} },
            { brandbook_id: brandbook.id, order: 15, title: 'Experiência multimodal', type: 'multimodal', category: 'sensory_identity', content_json: {} },
        ]

        const { data: newModules, error: insertError } = await supabaseAdmin
            .from('brandbook_modules')
            .insert(DEFAULT_MODULES)
            .select('*')
            .order('order', { ascending: true })

        if (!insertError && newModules) {
            modules = newModules
        } else {
            console.error("[BrandbookPage] Failed to seed default modules:", insertError)
        }
    }

    if (!brandbook) {
        return (
            <div className="text-center py-20">
                <p className="text-error">Error loading brandbook.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header removed as per user request, using Editor's internal top bar */}

            <div className="flex-1 overflow-y-auto bg-bg-0">
                <BrandbookEditorWrapper
                    initialModules={modules || []}
                    brandbookId={brandbook.id}
                    brandId={brandId}
                    brandName={brandName}
                    isReadOnly={isReadOnly}
                    userData={userData}
                />
            </div>
        </div>
    )
}
