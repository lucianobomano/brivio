/**
 * Logo misuse block ("Never do this"): cards showing the logo with what must not be done to it (stretched,
 * rotated, recoloured…), optionally next to correct uses. Shared by the block, its panel and the library presets.
 */

import { brivioSymbol } from "./brivioSymbol"

/** What is done to the logo in a card */
export type MisuseEffect =
    | 'none' | 'stretch' | 'squash' | 'rotate' | 'skew' | 'recolor' | 'gradient' | 'shadow' | 'glow'
    | 'outline' | 'crop' | 'busy' | 'lowContrast' | 'blur' | 'transparent'

export interface MisuseCard {
    id: string
    /** 'do' = a correct use (shown with a check), 'dont' = a misuse */
    kind: 'do' | 'dont'
    effect: MisuseEffect
    caption: string
    /** Colour of the recolour / glow / outline / low-contrast effects */
    color?: string
    /** Degrees, for rotate / skew */
    angle?: number
    /** Own picture of the misuse (replaces the logo + effect) */
    image?: string
    /** This card's own look, over the block's (set from the card's context bar) */
    style?: MisuseCardStyle
}

export interface MisuseCardStyle {
    previewBackground?: string
    captionBackground?: string
    borderColor?: string
    captionColor?: string
    radius?: number
    /** Logo size in this card, % of the block's */
    logoScale?: number
}

/** Card shape: a fixed image height, or a ratio (the whole card in the Cartões layout, the image otherwise) */
export type MisuseShape = 'fixed' | '1:1' | '4:3' | '3:4' | '16:9' | 'custom'

export type MisuseLayout = 'cards' | 'tiles' | 'list'
export type MisuseMark = 'cross' | 'slash' | 'badge' | 'none'

export interface LogoMisuseSettings {
    logoUrl?: string
    logoSize?: number
    // header
    showTitle?: boolean
    title?: string
    titleSize?: number
    titleColor?: string
    titleAlign?: 'left' | 'center'
    showDescription?: boolean
    description?: string
    descriptionColor?: string
    headerGap?: number
    // cards
    layout?: MisuseLayout
    columns?: number
    gap?: number
    radius?: number
    previewHeight?: number
    shape?: MisuseShape
    /** Ratio of the custom shape (width : height) */
    shapeWidth?: number
    shapeHeight?: number
    /** Fixed card width, px (0 = the columns share the width) */
    cardWidth?: number
    cardBackground?: string
    previewBackground?: string
    captionBackground?: string
    borderColor?: string
    // captions
    showCaptions?: boolean
    numbered?: boolean
    captionSize?: number
    captionColor?: string
    // marks
    mark?: MisuseMark
    /** When the mark shows: always, or on hover (the card turns red) */
    markOn?: 'hover' | 'always'
    dontColor?: string
    doColor?: string
    dontLabel?: string
    doLabel?: string
    // block
    blockBackground?: string
    blockPadding?: number
}

export interface LogoMisuseContent {
    cards: MisuseCard[]
    settings: LogoMisuseSettings
}

export const LOGO_MISUSE_DEFAULTS: Required<LogoMisuseSettings> = {
    logoUrl: '',
    logoSize: 52,
    showTitle: true,
    title: 'Never do this',
    titleSize: 26,
    titleColor: '#F5F5F3',
    titleAlign: 'left',
    showDescription: false,
    description: 'The mark only works when it is used exactly as drawn.',
    descriptionColor: '#8A8A90',
    headerGap: 54,
    layout: 'cards',
    columns: 4,
    gap: 12,
    radius: 12,
    previewHeight: 118,
    shape: 'fixed',
    shapeWidth: 4,
    shapeHeight: 5,
    cardWidth: 0,
    cardBackground: '#141416',
    previewBackground: '#1B1B1E',
    captionBackground: '#141416',
    borderColor: '#26262A',
    showCaptions: true,
    numbered: false,
    captionSize: 13,
    captionColor: '#9A9AA0',
    mark: 'cross',
    markOn: 'hover',
    dontColor: '#FF5544',
    doColor: '#3DDC84',
    dontLabel: "Don't",
    doLabel: 'Do',
    blockBackground: '',
    blockPadding: 0,
}

export const MISUSE_EFFECTS: { id: MisuseEffect, label: string, caption: string, color?: string, angle?: number }[] = [
    { id: 'stretch', label: 'Esticar', caption: 'Never stretch or distort the mark.' },
    { id: 'squash', label: 'Comprimir', caption: 'Never squash the proportions.' },
    { id: 'rotate', label: 'Rodar', caption: 'Never rotate it off its baseline.', angle: 18 },
    { id: 'skew', label: 'Inclinar', caption: 'Never skew or slant the mark.', angle: -18 },
    { id: 'recolor', label: 'Mudar a cor', caption: 'Never recolour outside the palette.', color: '#00D84A' },
    { id: 'gradient', label: 'Gradiente novo', caption: 'Never fill it with other gradients.' },
    { id: 'shadow', label: 'Sombra', caption: 'Never add shadows, glows or bevels.' },
    { id: 'glow', label: 'Brilho', caption: 'Never add a glow around the mark.', color: '#FF0054' },
    { id: 'outline', label: 'Contorno', caption: 'Never outline the mark.', color: '#F5F5F3' },
    { id: 'crop', label: 'Cortar', caption: 'Never crop the mark.' },
    { id: 'busy', label: 'Fundo confuso', caption: 'Never place it on busy backgrounds.' },
    { id: 'lowContrast', label: 'Pouco contraste', caption: 'Never use it with poor contrast.', color: '#2C2C31' },
    { id: 'blur', label: 'Desfocar', caption: 'Never blur or pixelate the mark.' },
    { id: 'transparent', label: 'Transparência', caption: 'Never lower its opacity.' },
    { id: 'none', label: 'Sem efeito', caption: 'Use the mark exactly as drawn.' },
]

export const misuseEffect = (id: MisuseEffect) => MISUSE_EFFECTS.find(e => e.id === id) || MISUSE_EFFECTS[0]

let seq = 0
export const misuseCardId = () => `mc-${Date.now().toString(36)}-${++seq}`

/** A card with the effect's own caption / colour / angle */
export const misuseCard = (effect: MisuseEffect, patch: Partial<MisuseCard> = {}): MisuseCard => {
    const e = misuseEffect(effect)
    return { id: misuseCardId(), kind: effect === 'none' ? 'do' : 'dont', effect, caption: e.caption, color: e.color, angle: e.angle, ...patch }
}

export const DEFAULT_MISUSE_CARDS = (): MisuseCard[] => [
    misuseCard('stretch'),
    misuseCard('rotate'),
    misuseCard('recolor'),
    misuseCard('shadow'),
]

export const createLogoMisuseContent = (cards?: MisuseCard[], settings: LogoMisuseSettings = {}): LogoMisuseContent => ({
    cards: cards || DEFAULT_MISUSE_CARDS(),
    settings,
})

export const readLogoMisuseContent = (content: any): LogoMisuseContent => ({
    cards: Array.isArray(content?.cards) ? content.cards : DEFAULT_MISUSE_CARDS(),
    settings: content?.settings || {},
})

export const resolveLogoMisuseSettings = (settings: LogoMisuseSettings) => ({
    ...LOGO_MISUSE_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
}) as Required<LogoMisuseSettings>

/** The Brivio symbol until a logo is uploaded */
export const misuseLogo = (s: Required<LogoMisuseSettings>) => s.logoUrl || brivioSymbol()

/** CSS aspect ratio of the shape, or undefined for a fixed height */
export const misuseAspect = (s: Required<LogoMisuseSettings>) =>
    s.shape === 'fixed' ? undefined
        : s.shape === 'custom' ? `${Math.max(1, s.shapeWidth)} / ${Math.max(1, s.shapeHeight)}`
            : s.shape.replace(':', ' / ')
