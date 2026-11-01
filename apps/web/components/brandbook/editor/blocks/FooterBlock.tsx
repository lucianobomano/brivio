"use client"

import React from "react"
import { Block, BrivioClipboardItem } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { useBrandDesign } from "../BrandDesignContext"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { BlockRenderer } from "./BlockRenderer"
import { FooterBlockPanel } from "./FooterBlockPanel"
import { readFooterContent, resolveFooterSettings } from "./footer"
import {
    buildNativeFooter, footerRows, hasFooterBlock, isNativeFooter, renewFooterIds, withFooterRows,
    type FooterBuildContext, type NativeFooterContent,
} from "./footerNative"

interface FooterBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onAddBlock?: (parentId: string, columnId: string, type: string, variant?: string) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onAnimate?: () => void
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
    clipboard?: BrivioClipboardItem | null
    onPasteBlock?: (parentId?: string, columnId?: string, insertIndex?: number) => void
}

export const FooterBlock = ({
    block, isReadOnly, onUpdate, onAddBlock, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate,
    responsiveDevice, clipboard, onPasteBlock,
}: FooterBlockProps) => {
    const { modules = [], brandInfo, getStyleById } = useBrandDesign()
    const ctx: FooterBuildContext = {
        pages: modules,
        brandName: brandInfo?.name,
        logoUrl: brandInfo?.logo_url || undefined,
        brandFont: getStyleById('body')?.font || undefined,
    }

    // Footers from the library (and new ones) come as a template: they become real columns and texts once
    const native = isNativeFooter(block.content)
    const content: NativeFooterContent = native ? block.content : buildNativeFooter(readFooterContent(block.content), block.id, ctx)
    const converted = React.useRef(false)
    const ownRowsId = `${block.id}-rows`
    React.useEffect(() => {
        if (isReadOnly) return
        if (!native) {
            if (converted.current) return
            converted.current = true
            onUpdate(block.id, content)
        } else if (content.columns[0]?.id !== ownRowsId) {
            // A duplicated / pasted footer: its texts and columns get ids of their own (not the original's)
            onUpdate(block.id, { ...block.content, columns: [{ id: ownRowsId, blocks: footerRows(content).map(renewFooterIds) }] })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [native, isReadOnly, ownRowsId, content.columns[0]?.id])

    const s = resolveFooterSettings(content.settings)
    const rows = footerRows(content)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = React.useState(false)
    // Pointer on a text / column of the footer: their own bars show instead of the footer's
    const [overInner, setOverInner] = React.useState(false)
    const rootRef = React.useRef<HTMLDivElement>(null)

    // Narrow column / phone: the columns stack
    const [width, setWidth] = React.useState(0)
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setWidth(el.clientWidth))
        ro.observe(el)
        setWidth(el.clientWidth)
        return () => ro.disconnect()
    }, [])
    const stacked = (width > 0 && width < 640) || responsiveDevice === 'mobile'

    // ---- rows: native blocks, edited like in any column ----
    const save = (next: NativeFooterContent) => onUpdate(block.id, { ...block.content, ...next })
    const saveRows = (next: Block[]) => save(withFooterRows(content, next))
    const updateRow = (id: string, rowContent: any) => saveRows(rows.map(r => {
        if (r.id !== id) return r
        // The stacked direction is only how it shows on a narrow screen: keep the saved one
        const settings = stacked && rowContent?.settings ? { ...rowContent.settings, columnDirection: r.content?.settings?.columnDirection } : rowContent?.settings
        return { ...r, content: settings ? { ...rowContent, settings } : rowContent }
    }))
    const moveRow = (id: string, direction: 'up' | 'down') => {
        const i = rows.findIndex(r => r.id === id)
        const j = direction === 'up' ? i - 1 : i + 1
        if (i < 0 || j < 0 || j >= rows.length) return
        const next = [...rows]
        ;[next[i], next[j]] = [next[j], next[i]]
        saveRows(next)
    }
    const duplicateRow = (id: string) => {
        const i = rows.findIndex(r => r.id === id)
        if (i < 0) return
        saveRows([...rows.slice(0, i + 1), renewFooterIds(rows[i]), ...rows.slice(i + 1)])
    }

    const editingInside = !!activeBlockId && activeBlockId !== block.id && hasFooterBlock(rows, activeBlockId)
    const showContextBar = !isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && !overInner && !editingInside
    const rowGap = Math.max(32, s.columnGap)

    return (
        <div
            ref={rootRef}
            className={cn("relative w-full", !isReadOnly && "cursor-pointer")}
            {...hoverBind}
            onMouseOver={isReadOnly ? undefined : (e) => setOverInner(!!(e.target as HTMLElement).closest?.('.group\\/block, textarea, img, [data-footer-inner]'))}
            onMouseLeave={() => { hoverBind.onMouseLeave(); setOverInner(false) }}
            onClick={(e) => {
                if (isReadOnly) return
                e.stopPropagation()
                onSelect?.(block.id)
            }}
        >
            <footer
                className={cn("brivio-footer w-full", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] -outline-offset-1")}
                data-underline={s.underline ? 'true' : undefined}
                style={{
                    ['--footer-accent' as string]: s.accentColor,
                    backgroundColor: s.backgroundColor,
                    backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderTop: s.borderTop ? `1px solid ${s.borderColor}` : undefined,
                    paddingTop: s.paddingTop,
                    paddingBottom: s.paddingBottom,
                    paddingLeft: s.paddingX,
                    paddingRight: s.paddingX,
                }}
            >
                <div className="mx-auto w-full flex flex-col" style={{ maxWidth: s.maxWidth || undefined, gap: rowGap }}>
                    {rows.map(row => {
                        const isLayout = row.type === 'layout'
                        const shown = isLayout && stacked
                            ? { ...row, content: { ...row.content, settings: { ...row.content?.settings, columnDirection: 'vertical' } } }
                            : row
                        return (
                            <div
                                key={row.id}
                                className={cn("w-full min-w-0", row.content?.footerRow === 'bottom' && "pt-6")}
                                style={row.content?.footerRow === 'bottom' ? { borderTop: `1px solid ${s.borderColor}` } : undefined}
                            >
                                <BlockRenderer
                                    block={shown}
                                    isReadOnly={isReadOnly}
                                    onUpdate={updateRow}
                                    onAddBlock={onAddBlock}
                                    onSelect={onSelect}
                                    activeBlockId={activeBlockId}
                                    onDelete={(id) => saveRows(rows.filter(r => r.id !== id))}
                                    onMove={moveRow}
                                    onDuplicate={duplicateRow}
                                    onCopy={onCopy}
                                    onAnimate={onAnimate}
                                    responsiveDevice={responsiveDevice}
                                    clipboard={clipboard}
                                    onPasteBlock={onPasteBlock}
                                />
                            </div>
                        )
                    })}
                    {!isReadOnly && rows.length === 0 && (
                        <span className="text-[12px] text-center py-6" style={{ color: s.mutedColor }}>Rodapé vazio: adicione colunas na engrenagem.</span>
                    )}
                </div>
            </footer>

            {showContextBar && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Rodapé"
                        onSettings={() => { onSelect?.(block.id); setShowSettings(true) }}
                        onAnimate={onAnimate}
                        onMove={onMove ? (dir) => onMove(block.id, dir) : undefined}
                        onCopy={onCopy ? () => onCopy(block.id) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                        onDelete={onDelete ? () => onDelete(block.id) : undefined}
                    />
                </FloatingPanel>
            )}

            {!isReadOnly && showSettings && (
                <FloatingPanel placement="top-center" offset={12}>
                    <FooterBlockPanel
                        content={content}
                        resolved={s}
                        ctx={ctx}
                        onChange={save}
                        onClose={() => setShowSettings(false)}
                        onMove={onMove ? (dir) => onMove(block.id, dir) : undefined}
                        onCopy={onCopy ? () => onCopy(block.id) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                        onDelete={onDelete ? () => { setShowSettings(false); onDelete(block.id) } : undefined}
                    />
                </FloatingPanel>
            )}
        </div>
    )
}
