import { createClient } from "@/lib/supabase/server"
import { ProposalViewer } from "@/components/proposals/viewer/ProposalViewer"
import { notFound } from "next/navigation"
import { PrintOnLoad } from "@/components/proposals/viewer/PrintOnLoad"
import { ProposalPricingProvider } from "@/components/proposals/ProposalPricingContext"
import { toProposalPricing } from "@/lib/proposal-pricing"

export const dynamic = 'force-dynamic'

export default async function ProposalViewPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ print?: string }>
}) {
    const supabase = await createClient()
    const [{ id: proposalId }, { print }] = await Promise.all([params, searchParams])

    // Fetch Proposal and Brand details
    const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*, proposal_items(name, quantity, price)')
        .eq('id', proposalId)
        .single()

    if (proposalError || !proposal) {
        notFound()
    }

    // Fetch All Modules
    const { data: modules, error: modulesError } = await supabase
        .from('proposal_modules')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('order', { ascending: true })

    if (modulesError) {
        return <div className="p-20 text-center text-zinc-500">Não foi possível carregar a proposta.</div>
    }

    return (
        <div className="bg-white min-h-screen print:min-h-0">
            <ProposalPricingProvider value={toProposalPricing(proposal, proposal.proposal_items)}>
                <ProposalViewer
                    modules={modules || []}
                    proposalId={proposalId}
                    brandId={proposal.brand_id}
                />
            </ProposalPricingProvider>
            {/* ?print=1 opens «Guardar como PDF» (the «Baixar PDF» button) */}
            <PrintOnLoad enabled={print === "1"} />
        </div>
    )
}
