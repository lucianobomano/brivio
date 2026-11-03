"use client"

import * as React from "react"

import type { ProposalPricing } from "@/lib/proposal-pricing"
export type { ProposalPricing }

/**
 * The services and discount set in «Editar detalhes» (proposal_items). A price table written in the editor with
 * its own lines shows those; one left empty shows these, so the client always sees what the proposal is worth.
 */
const Ctx = React.createContext<ProposalPricing | null>(null)

export function ProposalPricingProvider({ value, children }: { value: ProposalPricing | null, children: React.ReactNode }) {
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useProposalPricing = () => React.useContext(Ctx)
