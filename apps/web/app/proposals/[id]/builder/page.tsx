import { createClient } from "@/lib/supabase/server"
import ProposalBuilderWrapper from "@/components/proposals/builder/ProposalBuilderWrapper"
import { redirect } from "next/navigation"
import { getTemplateModules } from "../../builder/utils"

export const dynamic = 'force-dynamic'

export default async function ProposalBuilderPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id: proposalId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Fetch Proposal
    const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*, brands(name), proposal_templates(name)')
        .eq('id', proposalId)
        .single()

    if (proposalError || !proposal) {
        return <div className="p-20 text-center text-white">Proposal not found</div>
    }

    // 2. Fetch Modules
    let { data: modules } = await supabase
        .from('proposal_modules')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('order', { ascending: true })

    // 3. Seed Default Modules if Empty OR Effectively Empty (only placeholder modules without content)
    const isEffectivelyEmpty = !modules || modules.length === 0 ||
        (modules.length < 5 && modules.every(m => !m.content_json?.blocks || m.content_json.blocks.length === 0));

    if (isEffectivelyEmpty) {
        // Clear vestigial empty modules if any
        if (modules && modules.length > 0) {
            await supabase.from('proposal_modules').delete().eq('proposal_id', proposalId)
        }

        const DEFAULT_MODULES = getTemplateModules(
            proposalId,
            proposal.template_id,
            (proposal as any).proposal_templates?.name
        )

        const { data: newModules, error: insertError } = await supabase
            .from('proposal_modules')
            .insert(DEFAULT_MODULES)
            .select('*')
            .order('order', { ascending: true })

        if (!insertError && newModules) {
            modules = newModules
        }
    }

    return (
        <div className="h-screen bg-bg-0">
            <ProposalBuilderWrapper
                initialModules={modules || []}
                proposalId={proposalId}
                brandId={proposal.brand_id}
                proposalIdentifier={proposal.identifier}
            />
        </div>
    )
}
