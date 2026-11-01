/**
 * Colour accordion: the brand colours as tall cards side by side; the open one shows everything about the
 * colour (codes, tints, contrast), the others show their name sideways. A usage bar below gives the
 * proportions. Shared by the block, its panel and the library presets.
 */

export interface AccordionColor {
    id: string
    name: string
    hex: string
    description?: string
    /** Gradient card: these stops (the hex is its main colour) */
    gradient?: string[]
    /** Share of use in the brand, % (usage bar) */
    usage?: number
}

export type AccordionReveal = 'rise' | 'fade' | 'blur' | 'none'

export interface ColorAccordionSettings {
    title?: string
    description?: string
    showHeader?: boolean
    background?: string
    text?: string
    muted?: string
    /** Card height, px */
    height?: number
    gap?: number
    radius?: number
    /** Width of a closed card, px */
    collapsedWidth?: number
    /** Card open when the page loads (index) */
    initialIndex?: number
    /** Opens on hover (or on click only) */
    openOnHover?: boolean
    showCodes?: boolean
    showTints?: boolean
    showContrast?: boolean
    showUsage?: boolean
    usageTitle?: string
    // entrance animation (on scroll)
    reveal?: AccordionReveal
    /** Delay between the items, ms */
    stagger?: number
    paddingY?: number
    paddingX?: number
    maxWidth?: number
}

export interface ColorAccordionContent {
    colors: AccordionColor[]
    settings: ColorAccordionSettings
    /** Shows the brand colours from Settings (and follows them) until a colour is edited here */
    brandColors?: boolean
}

export const ACCORDION_DEFAULTS: Required<ColorAccordionSettings> = {
    title: 'Três cores,\numa casa.',
    description: 'O laranja chama da rua, o off-white recebe dentro de casa e o preto amarra tudo — exatamente no ponto em que os números se encontram.',
    showHeader: true,
    background: '#F2F1EE',
    text: '#141414',
    muted: '#7A7770',
    height: 520,
    gap: 10,
    radius: 22,
    collapsedWidth: 96,
    initialIndex: 1,
    openOnHover: true,
    showCodes: true,
    showTints: true,
    showContrast: true,
    showUsage: true,
    usageTitle: 'Proporção de uso',
    reveal: 'rise',
    stagger: 110,
    paddingY: 110,
    paddingX: 72,
    // 0 = the width of its column, like everything next to it (the section sets the margins)
    maxWidth: 0,
}

let seq = 0
export const accordionColorId = () => `ac-${Date.now().toString(36)}-${++seq}`

export const DEFAULT_ACCORDION_COLORS = (): AccordionColor[] => [
    { id: accordionColorId(), name: 'Off-white', hex: '#ECEAE6', description: 'O respiro da marca. Fundo de páginas, papelaria e espaços amplos.', usage: 60 },
    { id: accordionColorId(), name: 'Laranja', hex: '#F5891D', description: 'Energia e ação. Chama a atenção na fachada, nos uniformes e nos botões.', usage: 25 },
    { id: accordionColorId(), name: 'Preto', hex: '#1A1612', description: 'Firmeza e precisão. Marca o ponto de conexão do 360.', usage: 10 },
    { id: accordionColorId(), name: 'Gradiente', hex: '#F5891D', gradient: ['#FBF3E6', '#F5891D'], description: 'Do off-white ao laranja: para capas e momentos especiais.', usage: 5 },
]

/** Without own colours it follows the brand colours (the defaults show while the brand has none) */
export const createColorAccordionContent = (colors?: AccordionColor[], settings: ColorAccordionSettings = {}, brandColors = !colors): ColorAccordionContent => ({
    colors: colors || DEFAULT_ACCORDION_COLORS(),
    settings,
    brandColors,
})

export const readColorAccordionContent = (content: any): ColorAccordionContent => ({
    colors: Array.isArray(content?.colors) ? content.colors : DEFAULT_ACCORDION_COLORS(),
    settings: content?.settings || {},
    brandColors: !!content?.brandColors,
})

export const resolveAccordion = (settings: ColorAccordionSettings) => ({
    ...ACCORDION_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
}) as Required<ColorAccordionSettings>

// ---------- colour maths ----------

export const normalizeHex = (hex: string) => {
    const h = (hex || '').trim().replace('#', '')
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.length === 8 ? h.slice(0, 6) : h
    return /^[0-9a-f]{6}$/i.test(full) ? `#${full.toUpperCase()}` : '#000000'
}

export const hexToRgb = (hex: string): [number, number, number] => {
    const h = normalizeHex(hex).slice(1)
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const toHex = (rgb: number[]) => `#${rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`

export const rgbToHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
    const [rn, gn, bn] = [r / 255, g / 255, b / 255]
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
    const l = (max + min) / 2
    if (max === min) return [0, 0, Math.round(l * 100)]
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
    return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]
}

export const rgbToCmyk = ([r, g, b]: [number, number, number]): [number, number, number, number] => {
    const k = 1 - Math.max(r, g, b) / 255
    if (k >= 1) return [0, 0, 0, 100]
    const c = (1 - r / 255 - k) / (1 - k), m = (1 - g / 255 - k) / (1 - k), y = (1 - b / 255 - k) / (1 - k)
    return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)]
}

const luminance = (hex: string) => {
    const [r, g, b] = hexToRgb(hex).map(v => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio of two colours (1 – 21) */
export const contrastRatio = (a: string, b: string) => {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (l1 + 0.05) / (l2 + 0.05)
}

/** WCAG level of a ratio for normal text */
export const contrastLevel = (ratio: number) => ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA+' : '—'

/** Readable text colour on a colour */
export const textOn = (hex: string) => luminance(hex) > 0.45 ? '#141414' : '#FFFFFF'

/** Lighter → darker versions of a colour (mixed with white, then with black) */
export const tintsOf = (hex: string, steps = 6) => {
    const rgb = hexToRgb(hex)
    const mix = (to: number, t: number) => rgb.map(v => v + (to - v) * t)
    const half = Math.floor(steps / 2)
    return [
        ...Array.from({ length: half }, (_, i) => toHex(mix(255, 0.75 - i * (0.6 / Math.max(1, half - 1))))),
        ...Array.from({ length: steps - half }, (_, i) => toHex(mix(0, 0.12 + i * (0.5 / Math.max(1, steps - half - 1))))),
    ]
}

export const cardBackground = (c: AccordionColor) =>
    c.gradient?.length ? `linear-gradient(180deg, ${c.gradient.join(', ')})` : normalizeHex(c.hex)

// ---------- brand palette (Settings → Colors) ----------

/** A Portuguese name for a colour, from its hue and lightness */
export const colorNameOf = (hex: string) => {
    const [h, s, l] = rgbToHsl(hexToRgb(hex))
    if (l <= 12) return 'Preto'
    if (l >= 94 && s < 30) return 'Branco'
    if (l >= 86 && s < 40) return 'Off-white'
    if (s < 12) return l > 60 ? 'Cinza claro' : 'Cinza'
    if (h < 15 || h >= 345) return l < 35 ? 'Bordô' : 'Vermelho'
    if (h < 40) return l < 35 ? 'Castanho' : 'Laranja'
    if (h < 65) return l < 40 ? 'Oliva' : 'Amarelo'
    if (h < 160) return 'Verde'
    if (h < 195) return 'Turquesa'
    if (h < 250) return l < 30 ? 'Azul-marinho' : 'Azul'
    if (h < 290) return l < 30 ? 'Índigo' : 'Roxo'
    if (h < 330) return 'Magenta'
    return 'Rosa'
}

const ROLES = [
    'A cor principal da marca: a que mais se vê e a que a identifica à primeira vista.',
    'A cor secundária: acompanha a principal e dá profundidade.',
    'Cor de apoio, para fundos, detalhes e equilíbrio.',
    'Cor de destaque: pequenos acentos que chamam a atenção.',
]

/** Usage shares that add up to 100 (60 / 30 / 10 for three colours) */
const usageFor = (count: number) =>
    count === 1 ? [100] : count === 2 ? [70, 30] : count === 3 ? [60, 30, 10] : count === 4 ? [50, 25, 15, 10]
        : Array.from({ length: count }, (_, i) => (i === 0 ? 100 - Math.floor(100 / count) * (count - 1) : Math.floor(100 / count)))

/** The brand colours as accordion cards (names, roles and proportions filled in) */
export const colorsFromPalette = (palette: string[]): AccordionColor[] => {
    const seen = new Map<string, number>()
    const usage = usageFor(palette.length)
    return palette.map((hex, i) => {
        const base = colorNameOf(hex)
        const n = (seen.get(base) || 0) + 1
        seen.set(base, n)
        return {
            id: `brand-${i}`,
            name: n > 1 ? `${base} ${n}` : base,
            hex: normalizeHex(hex),
            description: ROLES[Math.min(i, ROLES.length - 1)],
            usage: usage[i],
        }
    })
}
