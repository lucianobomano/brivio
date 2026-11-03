import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { ProposalViewer } from "@/components/proposals/viewer/ProposalViewer"
import { PrintOnLoad } from "@/components/proposals/viewer/PrintOnLoad"
import { CurrencyProvider } from "@/components/CurrencyUtils"
import { ProposalPricingProvider } from "@/components/proposals/ProposalPricingContext"
import { toProposalPricing } from "@/lib/proposal-pricing"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Proposta", robots: { index: false, follow: false } }

/**
 * The proposal as the client sees it, without an account. The link carries the proposal's id; only proposals
 * that were sent (not drafts) open here.
 */
export default async function SharedProposalPage({
    params,
    searchParams,
}: {
    params: Promise<{ assetId: string }>
    searchParams: Promise<{ print?: string }>
}) {
    const [{ assetId: proposalId }, { print }] = await Promise.all([params, searchParams])
    if (!/^[0-9a-f-]{36}$/i.test(proposalId)) notFound()

    // Public page: the admin client reads only this proposal, and only once it was sent
    const supabase = await createAdminClient()
    const { data: proposal } = await supabase
        .from("proposals")
        .select("id, brand_id, status, discount_value, discount_type, proposal_items(name, quantity, price), project:projects(workspace:workspaces(default_currency))")
        .eq("id", proposalId)
        .maybeSingle()
    if (!proposal || proposal.status === "draft") notFound()

    const { data: modules } = await supabase
        .from("proposal_modules")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("order", { ascending: true })

    const project = (Array.isArray(proposal.project) ? proposal.project[0] : proposal.project) as { workspace?: { default_currency?: string } | { default_currency?: string }[] } | null
    const workspace = Array.isArray(project?.workspace) ? project?.workspace[0] : project?.workspace
    const currency = workspace?.default_currency || "EUR"

    return (
        <div className="bg-white min-h-screen print:min-h-0">
            <CurrencyProvider currency={currency}>
                <ProposalPricingProvider value={toProposalPricing(proposal, proposal.proposal_items)}>
                    <ProposalViewer modules={modules || []} proposalId={proposalId} brandId={proposal.brand_id} />
                </ProposalPricingProvider>
            </CurrencyProvider>
            <PrintOnLoad enabled={print === "1"} />
        </div>
    )
}
