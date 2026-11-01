"use client"

/**
 * Cover of a brandbook template card: the template's first page drawn live and scaled down, the same way the
 * components library previews its sections. A page that opens with a cover section shows that cover;
 * otherwise its first section.
 */

import React from "react"
import { BrandDesignProvider } from "./editor/BrandDesignContext"
import { ComponentPreview } from "./editor/ComponentPreview"
import type { Block } from "./editor/types"

type TemplateModule = { content_json?: unknown }

/** The blocks of a template page (stored as { blocks } or as a plain list) */
const pageBlocks = (content: unknown): Block[] => {
    if (Array.isArray(content)) return content as Block[]
    const blocks = (content as { blocks?: unknown } | null)?.blocks
    return Array.isArray(blocks) ? blocks as Block[] : []
}

/** The section shown on the card: the first page's cover, or its first section */
export const templateCoverSection = (modules: TemplateModule[] | undefined): Block | null => {
    const blocks = pageBlocks(modules?.[0]?.content_json)
    const sections = blocks.filter(b => b?.type === 'layout')
    return sections.find(b => b.content?.settings?.isCover) ?? sections[0] ?? blocks[0] ?? null
}

export function TemplateCover({ modules, accentColor, name }: { modules: TemplateModule[] | undefined, accentColor?: string, name: string }) {
    const section = templateCoverSection(modules)
    const fallback = (
        <div
            className="w-full aspect-[4/3] rounded-lg flex items-end p-4"
            style={{ background: `radial-gradient(ellipse at 80% 10%, ${accentColor || '#FF0054'}55 0%, #15161B 70%)` }}
        >
            <span className="text-white/80 text-[20px] font-semibold tracking-tight truncate">{name}</span>
        </div>
    )
    if (!section) return fallback
    return (
        // No brand yet: the template is shown with its own fonts and colours
        <BrandDesignProvider brandId="">
            <ComponentPreview data={section} kind="section" fallback={fallback} />
        </BrandDesignProvider>
    )
}

export default TemplateCover
