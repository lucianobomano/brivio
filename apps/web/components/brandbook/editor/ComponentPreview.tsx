"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Block } from "./types"
import { BlockRenderer } from "./blocks/BlockRenderer"
import { useBrandDesign } from "./BrandDesignContext"
import { CoverBackdrop } from "./CoverBackdrop"
import type { CoverSettings } from "./cover"
import type { ColumnData, ComponentKind, ComponentTopic } from "./componentPresets"

/**
 * Live, scaled-down render of a library component: the real blocks in read-only mode, with the
 * brand's own fonts and colors. Rendered only once the card scrolls into view.
 */

/** Width the component is laid out at before scaling it into the card */
const LAYOUT_WIDTH: Record<ComponentKind, number> = { section: 1280, column: 560, block: 760 }

/** Stand-ins for images the user has not uploaded yet, so the preview reads as a finished page (Brivio artwork) */
const PLACEHOLDERS = {
    logo: '/brandbook/presets/brivio-logo.png',
    photo: ['/brandbook/presets/brivio-gradient.jpg', '/brandbook/presets/brivio-gradient-portrait.jpg'],
}

const BLANK_IMAGE_TYPES = new Set(['image'])

/** Copy of the data with empty images filled in (the inserted component keeps them empty) */
const withPlaceholders = (block: Block, topic?: ComponentTopic): Block => {
    let photo = 0
    const visit = (b: Block): Block => {
        if (BLANK_IMAGE_TYPES.has(b.type) && !b.content?.url) {
            const url = topic === 'logo' ? PLACEHOLDERS.logo : PLACEHOLDERS.photo[photo++ % PLACEHOLDERS.photo.length]
            return { ...b, content: { ...b.content, url } }
        }
        if (b.type === 'layout' && Array.isArray(b.content?.columns)) {
            return {
                ...b,
                content: {
                    ...b.content,
                    columns: b.content.columns.map((col: ColumnData) => ({ ...col, blocks: (col.blocks || []).map(visit) })),
                },
            }
        }
        return b
    }
    return visit(block)
}

/** Every kind is previewed as a section, the way it will sit on the page */
const toSection = (data: Block | ColumnData, kind: ComponentKind): Block => {
    if (kind === 'section') return data as Block
    const column: ColumnData = kind === 'column'
        ? data as ColumnData
        : { id: 'preview-col', blocks: [data as Block], settings: { alignHorizontal: 'left', alignVertical: 'top' } }
    return {
        id: 'preview-section', type: 'layout', variant: '1-col',
        content: { columns: [column], settings: { columns: 1, columnWidths: [1], padding: { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 } } },
    }
}

class PreviewBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { failed: boolean }> {
    state = { failed: false }
    static getDerivedStateFromError() { return { failed: true } }
    render() { return this.state.failed ? this.props.fallback : this.props.children }
}

const noop = () => { }

export function ComponentPreview({ data, kind, topic, fallback }: {
    data: Block | ColumnData
    kind: ComponentKind
    topic?: ComponentTopic
    /** Shown if the component fails to render */
    fallback: React.ReactNode
}) {
    const { modules = [] } = useBrandDesign()
    const frameRef = useRef<HTMLDivElement>(null)
    // State (not a ref) so the size observer attaches once the content actually mounts
    const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)
    const [visible, setVisible] = useState(false)
    const [frame, setFrame] = useState({ width: 0, height: 0 })
    const [contentHeight, setContentHeight] = useState(0)

    useEffect(() => {
        const el = frameRef.current
        if (!el) return
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); io.disconnect() }
        }, { rootMargin: '200px' })
        io.observe(el)
        const ro = new ResizeObserver(() => setFrame({ width: el.clientWidth, height: el.clientHeight }))
        ro.observe(el)
        return () => { io.disconnect(); ro.disconnect() }
    }, [])

    useEffect(() => {
        if (!contentEl) return
        const ro = new ResizeObserver(() => setContentHeight(contentEl.offsetHeight))
        ro.observe(contentEl)
        return () => ro.disconnect()
    }, [contentEl])

    const section = useMemo(() => {
        let block = withPlaceholders(toSection(data, kind), topic)
        // Full-screen sections (covers) are drawn at the card's 4:3 shape instead of the screen height
        if (block.content?.settings?.height === '100vh') {
            block = { ...block, content: { ...block.content, settings: { ...block.content.settings, height: `${Math.round(LAYOUT_WIDTH.section * 0.75)}px` } } }
        }
        // A pages-mode index lists this brandbook's pages; with too few of them, show the sample chapters instead
        if (modules.length < 3) {
            const json = JSON.stringify(block).replace(/"source":"pages"/g, '"source":"manual"')
            block = JSON.parse(json)
        }
        return block
    }, [data, kind, topic, modules.length])

    const settings = section.content?.settings || {}
    const padding = settings.sectionPadding || {}
    const background = settings.backgroundColor && settings.backgroundColor !== 'transparent' ? settings.backgroundColor : '#FFFFFF'
    const backgroundImage = settings.backgroundType === 'image' && settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined
    const layoutWidth = LAYOUT_WIDTH[kind]
    // Covers with an animated background: a light version of it (no WebGL in the library, no mouse)
    const coverFx = settings.isCover && settings.cover?.effect && settings.cover.effect !== 'none'
        ? { ...(settings.cover as CoverSettings), effect: settings.cover.effect === 'liquid' ? 'mesh' : settings.cover.effect, interactive: false } as CoverSettings
        : undefined
    const coverHost = useRef<HTMLDivElement>(null)
    const scale = frame.width ? frame.width / layoutWidth : 0
    // Components sit centered in the card; taller ones start at the top. Hidden until measured, so they don't jump
    const isMeasured = contentHeight > 0 && scale > 0
    const top = isMeasured ? Math.max(0, (frame.height - contentHeight * scale) / 2) : 0

    return (
        <div ref={frameRef} className="relative w-full aspect-[4/3] overflow-hidden rounded-lg" style={{ backgroundColor: background }}>
            {visible && scale > 0 ? (
                <PreviewBoundary fallback={fallback}>
                    <div
                        aria-hidden
                        className="absolute left-0 pointer-events-none select-none"
                        style={{ top, width: layoutWidth, transform: `scale(${scale})`, transformOrigin: 'top left', opacity: isMeasured ? 1 : 0, transition: 'opacity 200ms' }}
                    >
                        <div
                            ref={(el) => { setContentEl(el); coverHost.current = el }}
                            style={{
                                position: 'relative',
                                backgroundColor: background,
                                backgroundImage,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                paddingTop: kind === 'section' ? (padding.top ?? 40) : 32,
                                paddingBottom: kind === 'section' ? (padding.bottom ?? 40) : 32,
                                paddingLeft: kind === 'section' ? (padding.left ?? 40) : 32,
                                paddingRight: kind === 'section' ? (padding.right ?? 40) : 32,
                            }}
                        >
                            {coverFx && <CoverBackdrop cover={coverFx} hostRef={coverHost} />}
                            <div className="relative z-[1]">
                                <BlockRenderer block={section} isReadOnly onUpdate={noop} disableAnimation responsiveDevice="desktop" />
                            </div>
                        </div>
                    </div>
                </PreviewBoundary>
            ) : (
                <div className="absolute inset-0 animate-pulse bg-black/[0.03]" />
            )}
        </div>
    )
}
