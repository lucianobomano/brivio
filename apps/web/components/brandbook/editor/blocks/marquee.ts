/**
 * "Texto em loop" (marquee) block: one or more bands of texts scrolling forever, each text followed by a
 * separator (shape or icon). Content shape, defaults and helpers shared by the block, its panel and presets.
 */

export type MarqueeSeparator = 'dot' | 'circle' | 'square' | 'diamond' | 'star' | 'asterisk' | 'slash' | 'dash' | 'icon' | 'none'

export interface MarqueeRow {
    id: string
    items: string[]
    /** Where the texts travel to */
    direction: 'left' | 'right'
    /** Outlined letters (stroke only) for this band */
    outline?: boolean
}

export interface MarqueeSettings {
    textColor?: string
    fontSize?: number
    fontWeight?: number
    uppercase?: boolean
    letterSpacing?: number
    separator?: MarqueeSeparator
    /** Lucide icon name (navigation icon library) when separator = 'icon' */
    separatorIcon?: string
    separatorColor?: string
    /** Separator size, px */
    separatorSize?: number
    /** Space between a text and its separator, px */
    gap?: number
    backgroundColor?: string
    paddingY?: number
    rowGap?: number
    borderTop?: boolean
    borderBottom?: boolean
    /** Line between bands (two or more) */
    borderBetween?: boolean
    borderColor?: string
    borderWidth?: number
    /** Speed in px per second */
    speed?: number
    pauseOnHover?: boolean
    /** Soft fade at both ends */
    fadeEdges?: boolean
    /** Spans the whole page width instead of the column */
    fullBleed?: boolean
}

export interface MarqueeContent {
    rows: MarqueeRow[]
    settings: MarqueeSettings
}

export const MARQUEE_DEFAULTS: Required<Omit<MarqueeSettings, 'separatorIcon'>> & { separatorIcon: string } = {
    textColor: '#5B5B66',
    fontSize: 56,
    fontWeight: 500,
    uppercase: false,
    letterSpacing: -2,
    separator: 'dot',
    separatorIcon: 'sparkles',
    separatorColor: '#FF4D3D',
    separatorSize: 8,
    gap: 48,
    backgroundColor: '#0B0B0D',
    paddingY: 28,
    rowGap: 16,
    borderTop: true,
    borderBottom: true,
    borderBetween: true,
    borderColor: '#26262B',
    borderWidth: 1,
    speed: 60,
    pauseOnHover: true,
    fadeEdges: false,
    fullBleed: false,
}

export const MARQUEE_SEPARATORS: { id: MarqueeSeparator, label: string }[] = [
    { id: 'dot', label: 'Ponto' },
    { id: 'circle', label: 'Círculo' },
    { id: 'square', label: 'Quadrado' },
    { id: 'diamond', label: 'Losango' },
    { id: 'star', label: 'Estrela' },
    { id: 'asterisk', label: 'Asterisco' },
    { id: 'slash', label: 'Barra' },
    { id: 'dash', label: 'Traço' },
    { id: 'icon', label: 'Ícone' },
    { id: 'none', label: 'Nenhum' },
]

let rowSeq = 0
export const newMarqueeRowId = () => `mq-${Date.now().toString(36)}-${++rowSeq}`

export const createMarqueeContent = (rows?: Partial<MarqueeRow>[], settings: MarqueeSettings = {}): MarqueeContent => ({
    rows: (rows && rows.length ? rows : [{ items: ['Public', 'Unfinished', 'Precise'] }]).map((r, i) => ({
        id: r.id || newMarqueeRowId(),
        items: r.items && r.items.length ? r.items : ['Texto'],
        direction: r.direction || (i % 2 === 0 ? 'left' : 'right'),
        outline: r.outline,
    })),
    settings,
})

/** Content of a saved block with every row valid (old / partial data included) */
export const readMarqueeContent = (content: any): MarqueeContent => {
    const rows: MarqueeRow[] = Array.isArray(content?.rows) && content.rows.length
        ? content.rows.map((r: any, i: number) => ({
            id: r?.id || `row-${i}`,
            items: Array.isArray(r?.items) ? r.items.filter((t: unknown) => typeof t === 'string') : [],
            direction: r?.direction === 'right' ? 'right' : 'left',
            outline: !!r?.outline,
        }))
        : createMarqueeContent().rows
    return { rows, settings: content?.settings || {} }
}
