/**
 * Footer block: columns of brand info, the brandbook pages (live, numbered), hand-made links, text and a
 * button, plus an optional big wordmark and bottom bar. Every link navigates: to a page of the brandbook,
 * to a URL, or back to the top. Shared by the block, its settings panel and the library presets.
 */

export type FooterLinkTarget =
    | { type: 'page', pageId: string }
    | { type: 'url', url: string, newTab?: boolean }
    | { type: 'top' }
    | { type: 'none' }

export interface FooterLink {
    id: string
    label: string
    target: FooterLinkTarget
}

export type FooterColumnKind = 'brand' | 'pages' | 'links' | 'text' | 'button'

export interface FooterColumn {
    id: string
    kind: FooterColumnKind
    /** Small heading over the column ("Questions", "Contacto"…) */
    title?: string
    /** Share of the width (fr) */
    width?: number
    align?: 'left' | 'center' | 'right'
    // brand
    name?: string
    tagline?: string
    showLogo?: boolean
    /** Logo image; empty = the brand logo from Settings */
    logoUrl?: string
    /** ◎ mark before the name (when there is no logo) */
    showMark?: boolean
    // pages: a slice of the brandbook pages (1-based), so two columns can split the list
    pageFrom?: number
    pageTo?: number
    /** Only pages under these side-menu groups (empty = all) */
    groups?: string[]
    // links
    links?: FooterLink[]
    // text
    body?: string
    // button
    button?: FooterLink
}

export type FooterFont = 'mono' | 'sans' | 'serif' | 'brand'

export interface FooterSettings {
    backgroundColor?: string
    backgroundImage?: string
    textColor?: string
    mutedColor?: string
    /** Hover / current page */
    accentColor?: string
    buttonColor?: string
    buttonTextColor?: string
    borderTop?: boolean
    borderColor?: string
    font?: FooterFont
    uppercase?: boolean
    /** % of the font size */
    letterSpacing?: number
    linkSize?: number
    titleSize?: number
    brandSize?: number
    bodySize?: number
    /** Space between the items of a column, px */
    itemGap?: number
    columnGap?: number
    paddingTop?: number
    paddingBottom?: number
    paddingX?: number
    /** "(01)" before each page */
    numbered?: boolean
    /** Underline on hover */
    underline?: boolean
    showWordmark?: boolean
    wordmark?: string
    wordmarkSize?: number
    showBottomBar?: boolean
    bottomText?: string
    showBackToTop?: boolean
    /** Content max width, px (0 = full) */
    maxWidth?: number
}

export interface FooterContent {
    columns: FooterColumn[]
    settings: FooterSettings
}

export const FOOTER_DEFAULTS: Required<Omit<FooterSettings, 'backgroundImage'>> & { backgroundImage: string } = {
    backgroundColor: '#0B0B0D',
    backgroundImage: '',
    textColor: '#EDEDED',
    mutedColor: '#6B6B73',
    accentColor: '#FF4D3D',
    buttonColor: '#FF0054',
    buttonTextColor: '#FFFFFF',
    borderTop: true,
    borderColor: '#222226',
    font: 'mono',
    uppercase: true,
    letterSpacing: 14,
    linkSize: 12,
    titleSize: 10,
    brandSize: 14,
    bodySize: 12,
    itemGap: 12,
    columnGap: 48,
    paddingTop: 72,
    paddingBottom: 56,
    paddingX: 64,
    numbered: true,
    underline: false,
    showWordmark: false,
    wordmark: '',
    wordmarkSize: 200,
    showBottomBar: false,
    bottomText: '© 2026  ·  Todos os direitos reservados',
    showBackToTop: true,
    maxWidth: 1280,
}

export const FOOTER_FONTS: Record<FooterFont, string | undefined> = {
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    // The brand's own body font (Settings → Fonts), resolved by the block
    brand: undefined,
}

export const COLUMN_KINDS: { id: FooterColumnKind, label: string }[] = [
    { id: 'brand', label: 'Marca' },
    { id: 'pages', label: 'Páginas' },
    { id: 'links', label: 'Links' },
    { id: 'text', label: 'Texto' },
    { id: 'button', label: 'Botão' },
]

let seq = 0
export const footerId = (prefix = 'f') => `${prefix}-${Date.now().toString(36)}-${++seq}`

export const newFooterColumn = (kind: FooterColumnKind): FooterColumn => {
    const base = { id: footerId('col'), kind, width: 1 }
    switch (kind) {
        case 'brand': return { ...base, showMark: true, tagline: 'Brand book' }
        case 'pages': return { ...base, pageFrom: 1 }
        case 'links': return { ...base, title: 'Links', links: [{ id: footerId('l'), label: 'Voltar ao topo', target: { type: 'top' } }] }
        case 'text': return { ...base, title: 'Questions', body: 'Ask the brand team before you ship' }
        case 'button': return { ...base, button: { id: footerId('l'), label: 'Falar com a equipa', target: { type: 'url', url: 'mailto:brand@empresa.com' } } }
    }
}

export const createFooterContent = (columns?: Partial<FooterColumn>[], settings: FooterSettings = {}): FooterContent => ({
    columns: ((columns && columns.length ? columns : [
        { kind: 'brand', showMark: true, tagline: 'Brand book, edition 02 ®', width: 1.3 },
        { kind: 'pages', pageFrom: 1, pageTo: 3 },
        { kind: 'pages', pageFrom: 4 },
        { kind: 'text', title: 'Questions', body: 'Ask the brand team before you ship', width: 1.4 },
    ]) as Partial<FooterColumn>[]).map(c => ({ ...newFooterColumn(c.kind || 'text'), ...c, id: c.id || footerId('col') }) as FooterColumn),
    settings,
})

export const readFooterContent = (content: any): FooterContent => ({
    columns: Array.isArray(content?.columns) ? content.columns.filter((c: any) => c && c.kind) : createFooterContent().columns,
    settings: content?.settings || {},
})

export const resolveFooterSettings = (settings: FooterSettings) => ({
    ...FOOTER_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
}) as typeof FOOTER_DEFAULTS

