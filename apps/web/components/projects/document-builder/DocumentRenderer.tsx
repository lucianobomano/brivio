"use client"

import React from "react"
import { DocumentHeaderBlock, DocumentItemsBlock, DocumentTotalsBlock, DocumentPaymentBlock, type BlockData, type DocumentSettings, SidebarLayout, ModernDarkLayout, MinimalPremiumLayout, ElegantDarkLayout, MonoChromeLayout, SimpleRedLayout, SplitBlueLayout, ModernOrangeLayout, GreenHighlightLayout, VerticalGreenLayout, ModernPinkLayout, SplitGreenLayout } from "./DocumentBlocks"

interface DocumentRendererProps {
    blocks: Array<{ id: string; type: string; data: BlockData }>
    onUpdateBlock: (id: string, data: BlockData) => void
    isReadOnly?: boolean
    settings?: DocumentSettings
}

export function DocumentRenderer({ blocks, onUpdateBlock, isReadOnly, settings }: DocumentRendererProps) {
    if (settings?.theme === 'sidebar') {
        return (
            <SidebarLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'modern-dark') {
        return (
            <ModernDarkLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'minimal-premium') {
        return (
            <MinimalPremiumLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'elegant-dark') {
        return (
            <ElegantDarkLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'mono-chrome') {
        return (
            <MonoChromeLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
            />
        )
    }

    if (settings?.theme === 'simple-red') {
        return (
            <SimpleRedLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'split-blue') {
        return (
            <SplitBlueLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'modern-orange') {
        return (
            <ModernOrangeLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'green-highlight') {
        return (
            <GreenHighlightLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'vertical-green') {
        return (
            <VerticalGreenLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'modern-pink') {
        return (
            <ModernPinkLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    if (settings?.theme === 'split-green') {
        return (
            <SplitGreenLayout
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                isReadOnly={isReadOnly}
                settings={settings}
            />
        )
    }

    return (
        <div className="flex-1 flex flex-col gap-0">
            {blocks.map((block) => {
                const commonProps = {
                    data: block.data,
                    onUpdate: (data: BlockData) => onUpdateBlock(block.id, data),
                    isReadOnly,
                    settings
                }

                switch (block.type) {
                    case 'header':
                        return <DocumentHeaderBlock key={block.id} {...commonProps} />
                    case 'items':
                        return <DocumentItemsBlock key={block.id} {...commonProps} />
                    case 'totals':
                        return <DocumentTotalsBlock key={block.id} />
                    case 'payment':
                        return <DocumentPaymentBlock key={block.id} {...commonProps} />
                    case 'text':
                        return (
                            <div key={block.id} className="mb-4">
                                <textarea
                                    value={block.data.text || ""}
                                    onChange={(e) => onUpdateBlock(block.id, { ...block.data, text: e.target.value })}
                                    placeholder="Adicione texto, termos ou observações..."
                                    className="text-sm text-gray-400 bg-transparent border-none outline-none w-full resize-none min-h-[40px]"
                                    readOnly={isReadOnly}
                                />
                            </div>
                        )
                    case 'spacer':
                        return <div key={block.id} className="h-8" />
                    default:
                        return null
                }
            })}
        </div>
    )
}
