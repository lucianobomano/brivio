import { createClient, getCurrentUser } from "@/lib/supabase/server"
import ProposalBuilderWrapper from "@/components/proposals/builder/ProposalBuilderWrapper"
import { redirect } from "next/navigation"
import { getTemplateModules } from "../../builder/utils"
import { ProposalPricingProvider } from "@/components/proposals/ProposalPricingContext"
import { toProposalPricing } from "@/lib/proposal-pricing"

export const dynamic = 'force-dynamic'

export default async function ProposalBuilderPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id: proposalId } = await params

    const user = await getCurrentUser()
    if (!user) redirect('/login')

    // 1. Fetch Proposal
    const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*, brands(name), projects(name), proposal_templates(name, content_json), proposal_items(name, quantity, price)')
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
    // The settings module is written when the proposal is set up: once it exists, an empty proposal was emptied by
    // the user (all pages deleted) and starts from «Adicionar página» instead of getting the template again.
    const initialised = (modules || []).some(m => m.type === 'settings')
    const isEffectivelyEmpty = !initialised && (!modules || modules.length === 0 ||
        (modules.length < 5 && modules.every(m => !m.content_json?.blocks || m.content_json.blocks.length === 0)));

    if (isEffectivelyEmpty) {
        // Clear vestigial empty modules if any
        if (modules && modules.length > 0) {
            await supabase.from('proposal_modules').delete().eq('proposal_id', proposalId)
        }

        const DEFAULT_MODULES = getTemplateModules(
            proposalId,
            proposal.template_id,
            (proposal as any).proposal_templates?.name,
            {
                content: (proposal as any).proposal_templates?.content_json,
                projectName: (proposal as any).projects?.name ?? null,
                clientName: (proposal as any).brands?.name ?? null,
            }
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
            <ProposalPricingProvider value={toProposalPricing(proposal, proposal.proposal_items)}>
            <ProposalBuilderWrapper
                initialModules={modules || []}
                proposalId={proposalId}
                brandId={proposal.brand_id}
                proposalIdentifier={proposal.identifier}
                projectName={(proposal as any).projects?.name ?? null}
                projectId={proposal.project_id ?? null}
                clientName={(proposal as any).brands?.name ?? null}
            />
            </ProposalPricingProvider>
        </div>
    )
}
