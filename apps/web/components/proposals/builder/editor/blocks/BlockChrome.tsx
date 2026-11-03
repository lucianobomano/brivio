"use client"

import React from "react"
import { cn } from "@/lib/utils"
// The context bar is the brandbook editor's: same bar (name, move, delete) in both editors
import { BlockContextBar, useHoverIntent } from "@/components/brandbook/editor/blocks/BlockContextBar"
import { FloatingPanel } from "@/components/brandbook/editor/FloatingPanel"

/**
 * Blocks without a bar of their own (price table, scope list, timeline, lists, palettes): on hover, the brandbook's
 * context bar above the block and the same dashed brand outline around it.
 */
export function BlockChrome({ label, blockId, isReadOnly, activeBlockId, onSelect, onMove, onDelete, children }: {
    label: string
    blockId: string
    isReadOnly?: boolean
    activeBlockId?: string | null
    onSelect?: (id: string | null) => void
    onMove?: (id: string, direction: "up" | "down") => void
    onDelete?: (id: string) => void
    children: React.ReactNode
}) {
    const [hovered, hoverBind] = useHoverIntent()
    if (isReadOnly) return <>{children}</>
    const active = hovered || activeBlockId === blockId
    return (
        <div
            {...hoverBind}
            onClick={(e) => { e.stopPropagation(); onSelect?.(blockId) }}
            className={cn("relative w-full", active && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-2")}
        >
            {children}
            {active && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e: React.MouseEvent) => e.stopPropagation() }}>
                    <BlockContextBar
                        label={label}
                        onMove={onMove ? (dir) => onMove(blockId, dir) : undefined}
                        onDelete={onDelete ? () => onDelete(blockId) : undefined}
                    />
                </FloatingPanel>
            )}
        </div>
    )
}
