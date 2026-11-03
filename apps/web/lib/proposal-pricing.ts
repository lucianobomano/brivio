export type ProposalPricing = {
    items: { description: string, quantity: number, price: number }[]
    discount_value: number
    discount_type: string | null
}

/** The proposal_items rows and the proposal's discount, in the shape above */
export function toProposalPricing(
    proposal: { discount_value?: number | null, discount_type?: string | null },
    rows: { name?: string | null, quantity?: number | null, price?: number | null }[] | null | undefined,
): ProposalPricing | null {
    if (!rows?.length) return null
    return {
        items: rows.map(r => ({ description: r.name || "", quantity: Number(r.quantity) || 1, price: Number(r.price) || 0 })),
        discount_value: Number(proposal.discount_value) || 0,
        discount_type: proposal.discount_type || null,
    }
}
