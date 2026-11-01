/**
 * Logo showcase block: versions of the logo (symbol or full lockup) on their backgrounds, switched by tabs,
 * with an adjustable clear-space guide. Shared by the block, its panel and the library presets.
 */

import { brivioSymbol } from "./brivioSymbol"

export interface LogoVersion {
    id: string
    /** Tab label ("Neutral", "Paper"…) */
    label: string
    /** Uploaded logo file (SVG / PNG) */
    url: string
    /** Background of the stage for this version */
    background: string
    /** Size of this version, % of the block's logo size (wide lockups usually want less) */
    scale?: number
}

export type LogoTabsStyle = 'pill' | 'outline' | 'underline' | 'text'
export type LogoControlsLayout = 'split' | 'left' | 'center' | 'right'
export type LogoFont = 'mono' | 'sans' | 'brand'

export interface LogoShowcaseSettings {
    // stage
    stageHeight?: number
    radius?: number
    borderWidth?: number
    borderColor?: string
    /** Logo height, % of the stage height */
    logoSize?: number
    /** Logo max width, % of the stage width */
    logoMaxWidth?: number
    // block
    blockBackground?: string
    blockPadding?: number
    blockRadius?: number
    /** Space between the stage and the tabs, px */
    controlsGap?: number
    // tabs
    showTabs?: boolean
    controlsLayout?: LogoControlsLayout
    tabsStyle?: LogoTabsStyle
    tabsBackground?: string
    activeBackground?: string
    activeColor?: string
    tabColor?: string
    tabFont?: LogoFont
    tabSize?: number
    uppercase?: boolean
    tabRadius?: number
    // clear space
    showClearSpaceButton?: boolean
    clearSpaceButtonLabel?: string
    /** Clear space = this × the reference */
    clearSpace?: number
    /** Reference, % of the logo height (100 = the whole mark; less for a lockup's symbol or x-height) */
    clearSpaceRef?: number
    /** Name of the reference in the label ("Mark height", "Altura do símbolo"…) */
    clearSpaceRefLabel?: string
    /** Own label text (empty = "Clear space = ½ × Mark height") */
    clearSpaceLabel?: string
    showClearSpaceLabel?: boolean
    clearSpaceColor?: string
    clearSpaceLine?: 'solid' | 'dashed'
    /** Guide shown when the page opens */
    clearSpaceOn?: boolean
}

export interface LogoShowcaseContent {
    versions: LogoVersion[]
    settings: LogoShowcaseSettings
}

export const LOGO_SHOWCASE_DEFAULTS: Required<LogoShowcaseSettings> = {
    stageHeight: 440,
    radius: 16,
    borderWidth: 0,
    borderColor: '#2A2A2E',
    logoSize: 43,
    logoMaxWidth: 70,
    blockBackground: '',
    blockPadding: 0,
    blockRadius: 0,
    controlsGap: 22,
    showTabs: true,
    controlsLayout: 'split',
    tabsStyle: 'pill',
    tabsBackground: '#1C1C1E',
    activeBackground: '#F5F5F3',
    activeColor: '#0B0B0B',
    tabColor: '#6B6B70',
    tabFont: 'mono',
    tabSize: 11,
    uppercase: true,
    tabRadius: 999,
    showClearSpaceButton: true,
    clearSpaceButtonLabel: 'Clear space',
    clearSpace: 0.5,
    clearSpaceRef: 100,
    clearSpaceRefLabel: 'Mark height',
    clearSpaceLabel: '',
    showClearSpaceLabel: true,
    clearSpaceColor: '#FF5544',
    clearSpaceLine: 'solid',
    clearSpaceOn: false,
}

export const LOGO_FONTS: Record<LogoFont, string | undefined> = {
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    brand: undefined,
}

let seq = 0
export const logoVersionId = () => `lv-${Date.now().toString(36)}-${++seq}`

/** The official Brivio symbol in four versions: what a new block (and the library covers) start with */
export const brivioLogoVersions = (): LogoVersion[] => [
    { id: logoVersionId(), label: 'Gradiente', url: brivioSymbol(), background: '#0B0B0B' },
    { id: logoVersionId(), label: 'Branco', url: brivioSymbol('#F5F5F3'), background: '#1C1C1E' },
    { id: logoVersionId(), label: 'Preto', url: brivioSymbol('#0B0B0B'), background: '#F5F5F3' },
    { id: logoVersionId(), label: 'Rosa', url: brivioSymbol('#FFFFFF'), background: '#FF0054' },
]

export const createLogoShowcaseContent = (versions?: LogoVersion[], settings: LogoShowcaseSettings = {}): LogoShowcaseContent => ({
    versions: versions?.length ? versions : brivioLogoVersions(),
    settings,
})

export const readLogoShowcaseContent = (content: any): LogoShowcaseContent => ({
    versions: Array.isArray(content?.versions) ? content.versions : brivioLogoVersions(),
    settings: content?.settings || {},
})

export const resolveLogoShowcaseSettings = (settings: LogoShowcaseSettings) => ({
    ...LOGO_SHOWCASE_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
}) as Required<LogoShowcaseSettings>

const FRACTIONS: [number, string][] = [[0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾']]

/** 0.5 → "½", 1.5 → "1½", 2 → "2", 0.4 → "0.4" */
export const formatMultiplier = (value: number) => {
    const whole = Math.floor(value + 1e-6)
    const rest = value - whole
    if (rest < 0.01) return String(whole)
    const fraction = FRACTIONS.find(([f]) => Math.abs(f - rest) < 0.01)?.[1]
    if (fraction) return whole ? `${whole}${fraction}` : fraction
    return String(Math.round(value * 100) / 100)
}

export const clearSpaceLabel = (s: Required<LogoShowcaseSettings>) =>
    s.clearSpaceLabel || `Clear space = ${formatMultiplier(s.clearSpace)} × ${s.clearSpaceRefLabel}`
