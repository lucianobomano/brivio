/**
 * Type specimen: a brand typeface presented like a type foundry page. On top, the construction grid of a
 * glyph (cap height, x-height, baseline, descender measured from the font itself) next to the description;
 * below, the weights, the hierarchy and a weight tester. Shared by the block, its panel and the presets.
 */

export type GlyphMode = 'outline' | 'solid' | 'ghost' | 'accent'
export type GlyphAnimation = 'none' | 'weight' | 'draw'
export type SpecimenLayout = 'split' | 'reverse' | 'centered'

export interface SpecimenWeight { id: string, weight: number, label: string }
export interface SpecimenLevel { id: string, role: string, weight: number, size: number, lineHeight: number, sample: string }

export interface TypeSpecimenSettings {
    fontFamily?: string
    glyph?: string
    glyphMode?: GlyphMode
    glyphAnimation?: GlyphAnimation
    /** Weight of the big glyph (and the "800 ExtraBold" label) */
    heroWeight?: number
    /** Glyph size, % of the stage height */
    glyphSize?: number
    showGuides?: boolean
    showGuideValues?: boolean
    guideLabels?: { ascender?: string, cap?: string, x?: string, baseline?: string, descender?: string }
    showHeroWeight?: boolean
    /**
     * Parts drawn by the block. Templates draw the title and texts with text blocks in their own columns,
     * and use the block for the glyph (showIntro off) or the weights / hierarchy (showGlyph off).
     */
    showIntro?: boolean
    showGlyph?: boolean
    // texts
    tag?: string
    eyebrow?: string
    title?: string
    description?: string
    // parts
    showWeights?: boolean
    showHierarchy?: boolean
    hierarchyTitle?: string
    hierarchyTag?: string
    showTester?: boolean
    testerLabel?: string
    testerText?: string
    testerSize?: number
    testerMin?: number
    testerMax?: number
    testerWeight?: number
    // style
    layout?: SpecimenLayout
    background?: string
    surface?: string
    border?: string
    text?: string
    muted?: string
    accent?: string
    /** Blueprint lines behind everything */
    backdropGrid?: boolean
    radius?: number
    /** Weight cards: fill / outline (their corners: radius) */
    weightsFill?: boolean
    weightsBorder?: boolean
    /** Hierarchy: plain (only separator lines) unless filled / outlined */
    hierarchyFill?: boolean
    hierarchyBorder?: boolean
    hierarchyRadius?: number
    /** Space between the weights and the hierarchy, px */
    columnsGap?: number
    /** Space between the weight cards (across and down), px */
    weightsGap?: number
    /** Space above and below each line of the hierarchy, px */
    hierarchyRowGap?: number
    paddingX?: number
    paddingY?: number
    maxWidth?: number
    heroHeight?: number
}

export interface TypeSpecimenContent {
    weights: SpecimenWeight[]
    levels: SpecimenLevel[]
    settings: TypeSpecimenSettings
}

export const SPECIMEN_DEFAULTS: Required<Omit<TypeSpecimenSettings, 'guideLabels'>> & { guideLabels: Required<NonNullable<TypeSpecimenSettings['guideLabels']>> } = {
    fontFamily: 'Montserrat',
    glyph: 'A',
    glyphMode: 'outline',
    glyphAnimation: 'none',
    heroWeight: 800,
    glyphSize: 78,
    showGuides: true,
    showGuideValues: true,
    guideLabels: { ascender: 'Ascendente', cap: 'Altura-H', x: 'Altura-X', baseline: 'Linha de base', descender: 'Descendente' },
    showHeroWeight: true,
    tag: '(04) Tipografia',
    eyebrow: '01 · A voz da marca',
    title: 'Montserrat,\nem peso forte.',
    description: 'Geométrica, sólida e de leitura imediata — na fachada, no uniforme e no feed.',
    showIntro: true,
    showGlyph: true,
    showWeights: true,
    showHierarchy: true,
    hierarchyTitle: 'Hierarquia',
    hierarchyTag: 'Proposta · a validar',
    showTester: true,
    testerLabel: 'Teste de peso',
    testerText: 'Todo piso, feito do jeito certo.',
    testerSize: 64,
    testerMin: 100,
    testerMax: 900,
    testerWeight: 700,
    layout: 'split',
    background: '#0E0E0F',
    surface: '#141416',
    border: '#26262A',
    text: '#F2F2F2',
    muted: '#7A7A80',
    accent: '#FF7A1A',
    backdropGrid: false,
    radius: 14,
    weightsFill: true,
    weightsBorder: true,
    hierarchyFill: false,
    hierarchyBorder: false,
    hierarchyRadius: 14,
    columnsGap: 20,
    weightsGap: 12,
    hierarchyRowGap: 16,
    paddingX: 72,
    paddingY: 96,
    maxWidth: 1240,
    heroHeight: 560,
}

let seq = 0
export const specimenId = (prefix = 'ts') => `${prefix}-${Date.now().toString(36)}-${++seq}`

export const DEFAULT_WEIGHTS = (): SpecimenWeight[] => [
    { id: specimenId('w'), weight: 300, label: 'Light' },
    { id: specimenId('w'), weight: 500, label: 'Medium' },
    { id: specimenId('w'), weight: 700, label: 'Bold' },
    { id: specimenId('w'), weight: 800, label: 'ExtraBold' },
]

export const DEFAULT_LEVELS = (): SpecimenLevel[] => [
    { id: specimenId('l'), role: 'Título', weight: 700, size: 40, lineHeight: 48, sample: 'Do orçamento à garantia.' },
    { id: specimenId('l'), role: 'Subtítulo', weight: 600, size: 24, lineHeight: 30, sample: 'Todo tipo de piso, todas as etapas.' },
    { id: specimenId('l'), role: 'Texto', weight: 500, size: 17, lineHeight: 26, sample: 'Feito do jeito certo, do primeiro orçamento à última peça instalada.' },
]

export const createTypeSpecimenContent = (settings: TypeSpecimenSettings = {}, weights?: SpecimenWeight[], levels?: SpecimenLevel[]): TypeSpecimenContent => ({
    weights: weights || DEFAULT_WEIGHTS(),
    levels: levels || DEFAULT_LEVELS(),
    settings,
})

export const readTypeSpecimenContent = (content: any): TypeSpecimenContent => ({
    weights: Array.isArray(content?.weights) ? content.weights : DEFAULT_WEIGHTS(),
    levels: Array.isArray(content?.levels) ? content.levels : DEFAULT_LEVELS(),
    settings: content?.settings || {},
})

export const resolveSpecimen = (settings: TypeSpecimenSettings) => {
    const clean = Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined))
    return {
        ...SPECIMEN_DEFAULTS,
        ...clean,
        guideLabels: { ...SPECIMEN_DEFAULTS.guideLabels, ...(settings?.guideLabels || {}) },
    } as typeof SPECIMEN_DEFAULTS
}

export const WEIGHT_NAMES: Record<number, string> = {
    100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
}
export const weightName = (weight: number) => WEIGHT_NAMES[Math.round(weight / 100) * 100] || ''

/** Google fonts with a weight axis (min–max), so the slider and the weight animation move smoothly */
export const VARIABLE_FONTS: Record<string, [number, number]> = {
    'Montserrat': [100, 900], 'Inter': [100, 900], 'Outfit': [100, 900], 'Manrope': [200, 800], 'Urbanist': [100, 900],
    'Syne': [400, 800], 'Space Grotesk': [300, 700], 'Playfair Display': [400, 900], 'Archivo': [100, 900],
    'Plus Jakarta Sans': [200, 800], 'Figtree': [300, 900], 'Work Sans': [100, 900], 'Raleway': [100, 900],
    'Unbounded': [200, 900], 'Fraunces': [100, 900], 'Bricolage Grotesque': [200, 800], 'JetBrains Mono': [100, 800],
    'DM Sans': [100, 1000], 'Sora': [100, 800], 'Lexend': [100, 900], 'Onest': [100, 900], 'Instrument Sans': [400, 700],
}

export const SPECIMEN_FONTS = Object.keys(VARIABLE_FONTS)

/** Loads a Google font with its whole weight range (or the usual weights for other fonts) */
export const loadSpecimenFont = (family: string) => {
    if (typeof document === 'undefined' || !family) return
    const id = `specimen-font-${family}`
    if (document.getElementById(id)) return
    const name = family.replace(/ /g, '+')
    const range = VARIABLE_FONTS[family]
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = range
        ? `https://fonts.googleapis.com/css2?family=${name}:wght@${range[0]}..${range[1]}&display=swap`
        : `https://fonts.googleapis.com/css2?family=${name}:wght@300;400;500;600;700;800;900&display=swap`
    link.onerror = () => { link.href = `https://fonts.googleapis.com/css2?family=${name}&display=swap` }
    document.head.appendChild(link)
}
