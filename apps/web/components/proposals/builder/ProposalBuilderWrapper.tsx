"use client"

import dynamic from "next/dynamic"

const ProposalBuilder = dynamic(() => import("./ProposalBuilder"), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-full bg-[#0A0A0B] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-[#ff0054] animate-spin" />
                <span className="text-[14px] text-[#555] font-medium animate-pulse">Loading Proposal Builder...</span>
            </div>
        </div>
    )
})

export default function ProposalBuilderWrapper(props: any) {
    return <ProposalBuilder {...props} />
}
