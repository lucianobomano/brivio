/**
 * Native footer: what the footer block really holds. Its rows are real blocks (layouts with native columns,
 * text blocks), so every column and every text is edited like anywhere else in the brandbook. The template
 * shape in ./footer (FooterColumn) stays as what the library presets and new footers start from.
 */

import type { Block } from "../types"
import type { NavPage } from "../BrandDesignContext"
import {
    FOOTER_FONTS, footerId, newFooterColumn, resolveFooterSettings,
    type FooterColumn, type FooterColumnKind, type FooterContent, type FooterLinkTarget, type FooterSettings,
} from "./footer"

/** What a footer text is, so the footer's Estilo panel can restyle all the texts of a kind at once */
export type FooterRole = 'title' | 'link' | 'body' | 'brand' | 'muted' | 'button' | 'wordmark'
export type FooterRowKind = 'main' | 'wordmark' | 'bottom'

export interface FooterBuildContext {
    pages: NavPage[]
    brandName?: string
    logoUrl?: string
    /** The brand's body font (Settings → Fonts), for the "Marca" font option */
    brandFont?: string
}

export interface NativeFooterContent {
    version: 2
    settings: FooterSettings
    /** One column holding the rows: main columns (layout), wordmark (text), bottom bar (layout) */
    columns: { id: string, blocks: Block[] }[]
}

type Resolved = ReturnType<typeof resolveFooterSettings>
type Style = Record<string, string | undefined>
type Column = { id: string, blocks?: Block[], settings?: Record<string, any> }

const ZERO_PADDING = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }

export const isNativeFooter = (content: any): content is NativeFooterContent =>
    content?.version === 2 && Array.isArray(content?.columns) && Array.isArray(content.columns[0]?.blocks)

export const footerRows = (content: NativeFooterContent): Block[] => content.columns[0]?.blocks || []

export const withFooterRows = (content: NativeFooterContent, rows: Block[]): NativeFooterContent => ({
    ...content,
    columns: [{ ...(content.columns[0] || { id: footerId('rows') }), blocks: rows }],
})

/** Columns of the main row */
export const footerMainColumns = (content: NativeFooterContent): Column[] =>
    footerRows(content).find(r => r.content?.footerRow === 'main')?.content?.columns || []

/** Pages of a "pages" column: the visible brandbook pages (side-menu order), optionally by group, sliced */
export const columnPages = (column: FooterColumn, pages: NavPage[]) => {
    const pool = pages.filter(p => !p.isHidden && (!column.groups?.length || (p.group && column.groups.includes(p.group))))
    const from = Math.max(1, column.pageFrom || 1)
    const to = column.pageTo && column.pageTo >= from ? column.pageTo : pool.length
    return { pool, list: pool.slice(from - 1, to), start: from }
}

const px = (n: number) => `${n}px`
const clean = (style: Style): Style => Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined))

/** The look the footer gives a text of this kind (each text can then change it in its own toolbar) */
export const footerRoleStyle = (role: FooterRole, s: Resolved, brandFont?: string): Style => {
    const fontFamily = s.font === 'brand' ? brandFont : FOOTER_FONTS[s.font]
    const base: Style = {
        fontFamily,
        textTransform: s.uppercase ? 'uppercase' : 'none',
        letterSpacing: `${s.letterSpacing / 100}em`,
        fontWeight: '400',
    }
    switch (role) {
        case 'title': return clean({ ...base, color: s.mutedColor, fontSize: px(s.titleSize), lineHeight: '1.4' })
        case 'link': return clean({ ...base, color: s.textColor, fontSize: px(s.linkSize), lineHeight: '1.4' })
        case 'body': return clean({ ...base, color: s.textColor, fontSize: px(s.bodySize), lineHeight: '1.6' })
        case 'muted': return clean({ ...base, color: s.mutedColor, fontSize: px(Math.max(9, s.titleSize)), lineHeight: '1.5' })
        case 'brand': return clean({ ...base, color: s.textColor, fontSize: px(s.brandSize), lineHeight: '1.2', fontWeight: '700', letterSpacing: `${Math.min(s.letterSpacing, 10) / 100}em` })
        case 'button': return clean({
            ...base, color: s.buttonTextColor, backgroundColor: s.buttonColor, borderRadius: '9999px', textAlign: 'center',
            fontSize: px(Math.max(12, s.linkSize + 2)), lineHeight: '1.2', fontWeight: '500', letterSpacing: `${Math.min(s.letterSpacing, 6) / 100}em`,
        })
        case 'wordmark': return clean({
            fontFamily: s.font === 'mono' ? brandFont : fontFamily, textTransform: 'none',
            color: s.textColor, fontSize: px(s.wordmarkSize), lineHeight: '0.9', fontWeight: '700', letterSpacing: '-0.05em',
        })
    }
}

/** Footer link target → the link of a text block (what the text toolbar's link button edits) */
export const footerTargetToLink = (target: FooterLinkTarget, pages: NavPage[]) => {
    switch (target.type) {
        case 'page': return { type: 'internal' as const, moduleId: target.pageId, moduleTitle: pages.find(p => p.id === target.pageId)?.title }
        case 'url': return { type: 'url' as const, url: target.url, target: target.newTab ? '_blank' as const : '_self' as const }
        case 'top': return { type: 'url' as const, url: '#top', target: '_self' as const }
        default: return undefined
    }
}

const PAGE_NUMBER = /^\(\d+\)\s+/

const footerText = (id: string, role: FooterRole, text: string, s: Resolved, ctx: FooterBuildContext, extra: {
    align?: 'left' | 'center' | 'right', link?: ReturnType<typeof footerTargetToLink>, page?: boolean, style?: Style
} = {}): Block => ({
    id,
    type: 'text',
    content: {
        text,
        style: { ...footerRoleStyle(role, s, ctx.brandFont), ...(extra.align && role !== 'button' ? { textAlign: extra.align } : {}), ...extra.style },
        footerRole: role,
        ...(extra.link ? { link: extra.link } : {}),
        ...(extra.page ? { footerPage: true } : {}),
    },
})

const columnSettings = (s: Resolved, align: 'left' | 'center' | 'right' = 'left') => ({
    blockGap: s.itemGap,
    padding: ZERO_PADDING,
    alignHorizontal: align,
    alignVertical: 'top',
})

/** The blocks of one template column: its title, then its texts / links / logo */
export const footerColumnBlocks = (c: FooterColumn, s: Resolved, ctx: FooterBuildContext, numberFrom = 1): Block[] => {
    const align = c.align || 'left'
    const id = (suffix: string) => `${c.id}-${suffix}`
    const out: Block[] = []
    if (c.title) out.push(footerText(id('title'), 'title', c.title, s, ctx, { align }))
    switch (c.kind) {
        case 'brand': {
            const logo = c.logoUrl || (c.showLogo ? ctx.logoUrl : '')
            if (logo) out.push({ id: id('logo'), type: 'image', content: { url: logo, caption: '', style: { width: Math.round(s.brandSize * 9) } } })
            else out.push(footerText(id('name'), 'brand', `${c.showMark ? '◎ ' : ''}${c.name || ctx.brandName || 'Brand'}`, s, ctx, { align }))
            if (c.tagline) out.push(footerText(id('tagline'), 'muted', c.tagline, s, ctx, { align }))
            break
        }
        case 'pages': {
            const { list } = columnPages(c, ctx.pages)
            list.forEach((page, i) => out.push(footerText(
                id(`p-${page.id}`), 'link',
                `${s.numbered ? `(${String(numberFrom + i).padStart(2, '0')})  ` : ''}${page.title}`,
                s, ctx, { align, page: true, link: footerTargetToLink({ type: 'page', pageId: page.id }, ctx.pages) },
            )))
            break
        }
        case 'links':
            (c.links || []).forEach(l => out.push(footerText(id(l.id), 'link', l.label, s, ctx, { align, link: footerTargetToLink(l.target, ctx.pages) })))
            break
        case 'text':
            out.push(footerText(id('body'), 'body', c.body || '', s, ctx, { align }))
            break
        case 'button':
            if (c.button) out.push(footerText(id('button'), 'button', c.button.label, s, ctx, {
                link: footerTargetToLink(c.button.target, ctx.pages),
                style: { width: px(Math.max(140, c.button.label.length * 9 + 56)) },
            }))
            break
    }
    return out
}

const footerColumn = (c: FooterColumn, s: Resolved, ctx: FooterBuildContext, numberFrom?: number): Column => ({
    id: c.id,
    blocks: footerColumnBlocks(c, s, ctx, numberFrom),
    settings: columnSettings(s, c.align),
})

const layoutRow = (id: string, kind: FooterRowKind, columns: Column[], widths: number[], gap: number): Block => ({
    id,
    type: 'layout',
    content: {
        footerRow: kind,
        columns,
        settings: { columns: columns.length, columnWidths: widths, columnGap: gap, padding: ZERO_PADDING, height: 'fit', alignVertical: 'top', alignHorizontal: 'left' },
    },
})

const wordmarkRow = (baseId: string, s: Resolved, ctx: FooterBuildContext): Block => {
    const row = footerText(`${baseId}-wordmark`, 'wordmark', s.wordmark || ctx.brandName || 'Brand', s, ctx)
    return { ...row, content: { ...row.content, footerRow: 'wordmark' } }
}

const isBackToTop = (b: Block) => b.content?.link?.type === 'url' && b.content.link.url === '#top'

const backToTopText = (baseId: string, s: Resolved, ctx: FooterBuildContext) =>
    footerText(`${baseId}-top-${footerId('t')}`, 'link', 'Voltar ao topo ↑', s, ctx, {
        align: 'right', link: footerTargetToLink({ type: 'top' }, ctx.pages), style: { fontSize: px(Math.max(9, s.titleSize)) },
    })

const bottomRow = (baseId: string, s: Resolved, ctx: FooterBuildContext): Block => layoutRow(`${baseId}-bottom`, 'bottom', [
    { id: `${baseId}-bottom-l`, blocks: [footerText(`${baseId}-legal`, 'muted', s.bottomText, s, ctx)], settings: columnSettings(s) },
    { id: `${baseId}-bottom-r`, blocks: s.showBackToTop ? [{ ...backToTopText(baseId, s, ctx), id: `${baseId}-top` }] : [], settings: columnSettings(s, 'right') },
], [1, 1], 24)

/** Template footer → native footer: real columns and text blocks */
export const buildNativeFooter = (template: FooterContent, baseId: string, ctx: FooterBuildContext): NativeFooterContent => {
    const s = resolveFooterSettings(template.settings)
    // Page numbers follow the page range, so two columns read "(01)…(03)", "(04)…"
    const columns = template.columns.map(c => footerColumn(c, s, ctx, c.kind === 'pages' ? Math.max(1, c.pageFrom || 1) : 1))
    const rows: Block[] = []
    if (columns.length) rows.push(layoutRow(`${baseId}-main`, 'main', columns, template.columns.map(c => c.width || 1), s.columnGap))
    if (s.showWordmark) rows.push(wordmarkRow(baseId, s, ctx))
    if (s.showBottomBar) rows.push(bottomRow(baseId, s, ctx))
    return { version: 2, settings: template.settings, columns: [{ id: `${baseId}-rows`, blocks: rows }] }
}

/** Every block of the footer, inside layouts too, through `fn` */
export const mapFooterBlocks = (rows: Block[], fn: (b: Block) => Block): Block[] => rows.map(b => {
    const next = fn(b)
    if (next.type !== 'layout' || !Array.isArray(next.content?.columns)) return next
    return {
        ...next,
        content: {
            ...next.content,
            columns: next.content.columns.map((col: Column) => ({ ...col, blocks: mapFooterBlocks(col.blocks || [], fn) })),
        },
    }
})

export const hasFooterBlock = (rows: Block[], id: string): boolean => {
    let found = false
    mapFooterBlocks(rows, b => { if (b.id === id) found = true; return b })
    return found
}

/** Same block with new ids everywhere (duplicating a row) */
export const renewFooterIds = (b: Block): Block => mapFooterBlocks([b], x => ({ ...x, id: footerId('b') }))[0]

/**
 * New footer settings. What changed is applied to the texts of each kind (only the properties that changed, so
 * what was set on a single text stays), the spacing to the columns, and the toggles add / remove rows.
 */
export const applyFooterSettings = (content: NativeFooterContent, nextSettings: FooterSettings, ctx: FooterBuildContext): NativeFooterContent => {
    const prev = resolveFooterSettings(content.settings)
    const next = resolveFooterSettings(nextSettings)
    const baseId = (content.columns[0]?.id || footerId('footer')).replace(/-rows$/, '')
    let pageIndex = 0

    let rows = mapFooterBlocks(footerRows(content), b => {
        if (b.type === 'layout') {
            const settings = { ...b.content.settings }
            if (prev.columnGap !== next.columnGap && b.content.footerRow === 'main') settings.columnGap = next.columnGap
            const columns = prev.itemGap !== next.itemGap
                ? b.content.columns.map((col: Column) => ({ ...col, settings: { ...col.settings, blockGap: next.itemGap } }))
                : b.content.columns
            return { ...b, content: { ...b.content, settings, columns } }
        }
        const role = b.content?.footerRole as FooterRole | undefined
        if (b.type !== 'text' || !role) return b
        const before = footerRoleStyle(role, prev, ctx.brandFont)
        const after = footerRoleStyle(role, next, ctx.brandFont)
        const style: Style = { ...b.content.style }
        for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
            if (before[key] === after[key]) continue
            if (after[key] === undefined) delete style[key]
            else style[key] = after[key]
        }
        let text: string = b.content.text || ''
        if (b.content.footerPage && prev.numbered !== next.numbered) {
            pageIndex++
            text = next.numbered ? `(${String(pageIndex).padStart(2, '0')})  ${text.replace(PAGE_NUMBER, '')}` : text.replace(PAGE_NUMBER, '')
        }
        return { ...b, content: { ...b.content, style, text } }
    })

    if (prev.showWordmark !== next.showWordmark) {
        if (next.showWordmark) {
            const at = rows.findIndex(r => r.content?.footerRow === 'bottom')
            const row = wordmarkRow(baseId, next, ctx)
            rows = at < 0 ? [...rows, row] : [...rows.slice(0, at), row, ...rows.slice(at)]
        } else rows = rows.filter(r => r.content?.footerRow !== 'wordmark')
    }
    if (prev.showBottomBar !== next.showBottomBar) {
        rows = next.showBottomBar ? [...rows, bottomRow(baseId, next, ctx)] : rows.filter(r => r.content?.footerRow !== 'bottom')
    } else if (next.showBottomBar && prev.showBackToTop !== next.showBackToTop) {
        rows = rows.map(r => {
            if (r.content?.footerRow !== 'bottom') return r
            const columns: Column[] = [...r.content.columns]
            const last = columns[columns.length - 1]
            const blocks = last.blocks || []
            columns[columns.length - 1] = {
                ...last,
                blocks: next.showBackToTop ? [...blocks, backToTopText(baseId, next, ctx)] : blocks.filter(x => !isBackToTop(x)),
            }
            return { ...r, content: { ...r.content, columns } }
        })
    }

    return withFooterRows({ ...content, settings: nextSettings }, rows)
}

const mapMainRow = (content: NativeFooterContent, fn: (row: Block) => Block) =>
    withFooterRows(content, footerRows(content).map(r => r.content?.footerRow === 'main' ? fn(r) : r))

/** A new column in the main row, built from a column template (brand, pages, links, text, button) */
export const addFooterColumn = (content: NativeFooterContent, kind: FooterColumnKind, ctx: FooterBuildContext): NativeFooterContent => {
    const s = resolveFooterSettings(content.settings)
    const col = footerColumn({ ...newFooterColumn(kind), id: footerId('col') }, s, ctx)
    const withMain = footerRows(content).some(r => r.content?.footerRow === 'main')
        ? content
        : withFooterRows(content, [layoutRow(footerId('main'), 'main', [], [], s.columnGap), ...footerRows(content)])
    return mapMainRow(withMain, r => {
        const columns = [...(r.content.columns || []), col]
        const widths: number[] = [...(r.content.settings?.columnWidths || [])].slice(0, columns.length - 1)
        while (widths.length < columns.length) widths.push(1)
        return { ...r, content: { ...r.content, columns, settings: { ...r.content.settings, columns: columns.length, columnWidths: widths } } }
    })
}

export const removeFooterColumn = (content: NativeFooterContent, columnId: string): NativeFooterContent => mapMainRow(content, r => {
    const index = r.content.columns.findIndex((c: Column) => c.id === columnId)
    if (index < 0) return r
    const columns = r.content.columns.filter((_: Column, i: number) => i !== index)
    const widths = (r.content.settings?.columnWidths || []).filter((_: number, i: number) => i !== index)
    return { ...r, content: { ...r.content, columns, settings: { ...r.content.settings, columns: columns.length, columnWidths: widths } } }
})

export const moveFooterColumn = (content: NativeFooterContent, columnId: string, direction: -1 | 1): NativeFooterContent => mapMainRow(content, r => {
    const i = r.content.columns.findIndex((c: Column) => c.id === columnId)
    const j = i + direction
    if (i < 0 || j < 0 || j >= r.content.columns.length) return r
    const columns = [...r.content.columns]
    ;[columns[i], columns[j]] = [columns[j], columns[i]]
    const widths = [...(r.content.settings?.columnWidths || [])]
    if (widths.length === columns.length) [widths[i], widths[j]] = [widths[j], widths[i]]
    return { ...r, content: { ...r.content, columns, settings: { ...r.content.settings, columnWidths: widths } } }
})
