import { createClient } from "@/lib/supabase/server"
import { ProposalViewer } from "@/components/proposals/viewer/ProposalViewer"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function ProposalViewPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id: proposalId } = await params

    // Fetch Proposal and Brand details
    const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
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
        return <div className="p-20 text-center text-white">Error loading proposal modules</div>
    }

    return (
        <div className="bg-white min-h-screen">
            <ProposalViewer
                modules={modules || []}
                proposalId={proposalId}
                brandId={proposal.brand_id}
            />
        </div>
    )
}
