"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { BlockRenderer } from "../builder/editor/blocks/BlockRenderer"
import { BrandDesignProvider, useBrandDesign } from "../builder/editor/BrandDesignContext"

interface ProposalViewerProps {
    modules: any[]
    proposalId: string
    brandId: string
}

export function ProposalViewer({ modules, proposalId, brandId }: ProposalViewerProps) {
    // Filter out hidden modules and the settings module
    const visibleModules = modules
        .filter(m => !m.is_hidden && m.type !== 'settings')
        .sort((a, b) => (a.order || 0) - (b.order || 0))

    return (
        <BrandDesignProvider brandId={brandId} proposalId={proposalId} initialModules={modules}>
            <ViewerContent modules={visibleModules} />
        </BrandDesignProvider>
    )
}

function ViewerContent({ modules }: { modules: any[] }) {
    const { settings } = useBrandDesign()

    return (
        <div
            className="min-h-screen w-full transition-colors duration-500"
            style={{ backgroundColor: settings?.main_project_bg }}
        >
            <div className="max-w-[1200px] mx-auto pb-32">
                {modules.map((module) => (
                    <ModuleSection key={module.id} module={module} />
                ))}
            </div>

            {/* Minimalist Footer */}
            <div className="py-12 border-t border-black/5 flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF94] via-[#0000FF] to-[#FF0054]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium">
                    Powered by Brivio°
                </span>
            </div>
        </div>
    )
}

function ModuleSection({ module }: { module: any }) {
    const blocks = module.content_json?.blocks || []

    return (
        <div className="w-full">
            {blocks.map((block: any, index: number) => (
                <SectionWrapper key={block.id} settings={block.content?.settings}>
                    <BlockRenderer
                        block={block}
                        isReadOnly={true}
                        onUpdate={() => { }}
                    />
                </SectionWrapper>
            ))}
        </div>
    )
}

function SectionWrapper({ children, settings }: { children: React.ReactNode, settings?: any }) {
    return (
        <div
            className="w-full relative transition-all duration-300"
            style={{
                backgroundColor: settings?.backgroundColor,
                backgroundImage: settings?.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                paddingTop: settings?.sectionPadding?.top || 60,
                paddingRight: settings?.sectionPadding?.right || 40,
                paddingBottom: settings?.sectionPadding?.bottom || 60,
                paddingLeft: settings?.sectionPadding?.left || 40,
            }}
        >
            <div className="prose max-w-none">
                {children}
            </div>
        </div>
    )
}
