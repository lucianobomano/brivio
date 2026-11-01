/**
 * Logo size block: the symbol on a stage with a size slider, judged against the minimum and recommended
 * sizes (px and mm), and a spec sheet under it. Shared by the block, its panel and the library presets.
 */

import { brivioSymbol } from "./brivioSymbol"

/** A row of the spec sheet. `auto` rows show the minimum / recommended size from the settings */
export interface LogoSizeSpec {
    id: string
    label: string
    value: string
    auto?: 'min' | 'rec'
}

export interface LogoSizeSettings {
    logoUrl?: string
    /** What the size measures on the logo */
    measure?: 'width' | 'height'
    minSize?: number
    /** 0 = no recommended size */
    recommendedSize?: number
    sliderMin?: number
    sliderMax?: number
    /** Size when the page opens */
    initialSize?: number
    /** Pixels per inch for the mm reading (96 = screen) */
    dpi?: number
    units?: 'both' | 'px' | 'mm'
    // stage
    stageHeight?: number
    radius?: number
    stageBackground?: string
    stageBorder?: string
    /** Red border while below the minimum */
    warnBorder?: boolean
    trackColor?: string
    thumbColor?: string
    readoutColor?: string
    showMarks?: boolean
    // states
    belowColor?: string
    aboveColor?: string
    recommendedColor?: string
    belowLabel?: string
    aboveLabel?: string
    recommendedLabel?: string
    // spec sheet
    showSpecs?: boolean
    specLabelColor?: string
    specValueColor?: string
    specLineColor?: string
    /** Space between the stage and the sheet, px */
    specsGap?: number
    // block
    blockBackground?: string
    blockPadding?: number
}

export interface LogoSizeContent {
    specs: LogoSizeSpec[]
    settings: LogoSizeSettings
}

export const LOGO_SIZE_DEFAULTS: Required<LogoSizeSettings> = {
    logoUrl: '',
    measure: 'width',
    minSize: 24,
    recommendedSize: 48,
    sliderMin: 12,
    sliderMax: 128,
    initialSize: 128,
    dpi: 96,
    units: 'both',
    stageHeight: 334,
    radius: 20,
    stageBackground: '#141416',
    stageBorder: '#26262A',
    warnBorder: true,
    trackColor: '#2E2E33',
    thumbColor: '#F5F5F3',
    readoutColor: '#8A8A90',
    showMarks: true,
    belowColor: '#FF5544',
    aboveColor: '#3DDC84',
    recommendedColor: '#5AB2FF',
    belowLabel: 'Below minimum',
    aboveLabel: 'Above minimum',
    recommendedLabel: 'Recommended',
    showSpecs: true,
    specLabelColor: '#9A9AA0',
    specValueColor: '#F5F5F3',
    specLineColor: '#232327',
    specsGap: 18,
    blockBackground: '',
    blockPadding: 0,
}

/** The Brivio symbol used until a logo is uploaded */
export const LOGO_SIZE_SAMPLE = () => brivioSymbol()

let seq = 0
export const logoSpecId = () => `ls-${Date.now().toString(36)}-${++seq}`

export const DEFAULT_LOGO_SPECS = (): LogoSizeSpec[] => [
    { id: logoSpecId(), label: 'Construction', value: '1 : 1 square' },
    { id: logoSpecId(), label: 'Stroke', value: '14 / 100 units' },
    { id: logoSpecId(), label: 'Minimum', value: '', auto: 'min' },
    { id: logoSpecId(), label: 'Recommended', value: '', auto: 'rec' },
    { id: logoSpecId(), label: 'Formats', value: 'SVG · EPS · PDF · PNG' },
]

export const createLogoSizeContent = (specs?: LogoSizeSpec[], settings: LogoSizeSettings = {}): LogoSizeContent => ({
    specs: specs || DEFAULT_LOGO_SPECS(),
    settings,
})

export const readLogoSizeContent = (content: any): LogoSizeContent => ({
    specs: Array.isArray(content?.specs) ? content.specs : DEFAULT_LOGO_SPECS(),
    settings: content?.settings || {},
})

export const resolveLogoSizeSettings = (settings: LogoSizeSettings) => ({
    ...LOGO_SIZE_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
}) as Required<LogoSizeSettings>

/** px → mm at the given dpi */
export const toMm = (px: number, dpi: number) => (px * 25.4) / (dpi || 96)

/** "24 px · 6.4 mm" (or one unit) */
export const formatSize = (px: number, s: Required<LogoSizeSettings>) => {
    const mm = `${toMm(px, s.dpi).toFixed(1)} mm`
    if (s.units === 'px') return `${Math.round(px)} px`
    if (s.units === 'mm') return mm
    return `${Math.round(px)} px · ${mm}`
}

export type LogoSizeState = 'below' | 'above' | 'recommended'

export const sizeState = (px: number, s: Required<LogoSizeSettings>): LogoSizeState =>
    px < s.minSize ? 'below' : s.recommendedSize && px >= s.recommendedSize ? 'recommended' : 'above'

export const specValue = (spec: LogoSizeSpec, s: Required<LogoSizeSettings>) =>
    spec.auto === 'min' ? formatSize(s.minSize, s)
        : spec.auto === 'rec' ? (s.recommendedSize ? formatSize(s.recommendedSize, s) : '—')
            : spec.value
