/**
 * Photo treatment: how the brand grades its photos. A picture shown with the brand's grade (brightness,
 * contrast, saturation, temperature, tint, faded blacks, colour wash, grain, vignette), compared with the
 * original or with what to avoid, with composition guides on top and the grade values / photo colours below.
 * Shared by the block, its panel and the library presets.
 */

export interface PhotoGrade {
    /** −100 … 100 */
    brightness?: number
    contrast?: number
    saturation?: number
    /** Warm (+) / cool (−) */
    warmth?: number
    /** Hue shift, degrees */
    tint?: number
    /** Lifted blacks, 0 … 100 */
    fade?: number
    /** Colour washed over the photo (duotone looks, split tones) */
    wash?: string
    washStrength?: number
    washBlend?: 'color' | 'soft-light' | 'multiply' | 'screen' | 'overlay'
    grain?: number
    vignette?: number
}

export type PhotoMode = 'compare' | 'side' | 'single' | 'variants'
export type PhotoOverlay = 'none' | 'thirds' | 'golden' | 'center' | 'diagonals' | 'grid'

export interface PhotoGradeSettings {
    image?: string
    mode?: PhotoMode
    grade?: PhotoGrade
    /** The "avoid" example (variants mode) */
    avoidGrade?: PhotoGrade
    overlay?: PhotoOverlay
    overlayColor?: string
    aspect?: string
    radius?: number
    showValues?: boolean
    showPalette?: boolean
    /** Colours of the brand's photography */
    palette?: string[]
    labelOriginal?: string
    labelBrand?: string
    labelAvoid?: string
    text?: string
    muted?: string
    accent?: string
    surface?: string
    border?: string
}

export const PHOTO_DEFAULTS: Required<Omit<PhotoGradeSettings, 'grade' | 'avoidGrade'>> & { grade: PhotoGrade, avoidGrade: PhotoGrade } = {
    image: '/brandbook/presets/covers/dune-portal.webp',
    mode: 'compare',
    grade: { brightness: 4, contrast: 10, saturation: -15, warmth: 18, tint: 0, fade: 12, grain: 14, vignette: 18 },
    avoidGrade: { brightness: 0, contrast: 45, saturation: 70, warmth: -30, tint: 0, fade: 0, grain: 0, vignette: 0 },
    overlay: 'none',
    overlayColor: '#FFFFFF',
    aspect: '16/9',
    radius: 16,
    showValues: true,
    showPalette: false,
    palette: ['#E9C7B4', '#C98F78', '#8C5A4A', '#F4E6DA', '#3A2A26'],
    labelOriginal: 'Original',
    labelBrand: 'Com o tratamento da marca',
    labelAvoid: 'Evitar',
    text: '#141414',
    muted: '#7A7770',
    accent: '#FF0054',
    surface: 'transparent',
    border: 'rgba(0,0,0,0.12)',
}

export const createPhotoGradeContent = (settings: PhotoGradeSettings = {}) => ({ settings })

export const readPhotoGradeSettings = (content: any): PhotoGradeSettings => content?.settings || {}

export const resolvePhotoGrade = (settings: PhotoGradeSettings) => ({
    ...PHOTO_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
    grade: { ...PHOTO_DEFAULTS.grade, ...(settings?.grade || {}) },
    avoidGrade: { ...PHOTO_DEFAULTS.avoidGrade, ...(settings?.avoidGrade || {}) },
}) as typeof PHOTO_DEFAULTS

/** The CSS filter of a grade (the colour wash, fade, grain and vignette are layers on top) */
export const gradeFilter = (g: PhotoGrade) => {
    const b = 1 + (g.brightness || 0) / 100
    const c = 1 + (g.contrast || 0) / 100
    const s = Math.max(0, 1 + (g.saturation || 0) / 100)
    const warm = Math.max(0, g.warmth || 0) / 100
    const cool = Math.max(0, -(g.warmth || 0)) / 100
    const hue = (g.tint || 0) - cool * 14
    return `brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)}) saturate(${s.toFixed(3)}) sepia(${(warm * 0.45).toFixed(3)}) hue-rotate(${hue.toFixed(1)}deg)`
}

/** Temperature layer: warm orange / cool blue light over the photo */
export const warmthLayer = (g: PhotoGrade) => {
    const w = g.warmth || 0
    if (!w) return undefined
    return w > 0 ? `rgba(255, 150, 60, ${(w / 100) * 0.22})` : `rgba(60, 140, 255, ${(-w / 100) * 0.25})`
}

const sign = (v: number) => (v > 0 ? `+${v}` : `${v}`)

/** The values worth showing (non-zero), as "Saturação −15" */
export const gradeValues = (g: PhotoGrade): [string, string][] => {
    const out: [string, string][] = []
    const add = (label: string, v?: number, suffix = '') => { if (v) out.push([label, `${sign(v)}${suffix}`]) }
    add('Brilho', g.brightness)
    add('Contraste', g.contrast)
    add('Saturação', g.saturation)
    add('Temperatura', g.warmth)
    add('Matiz', g.tint, '°')
    if (g.fade) out.push(['Pretos levantados', `${g.fade}`])
    if (g.wash && g.washStrength) out.push(['Cor sobreposta', `${g.wash.toUpperCase()} · ${g.washStrength}%`])
    if (g.grain) out.push(['Grão', `${g.grain}`])
    if (g.vignette) out.push(['Vinheta', `${g.vignette}`])
    return out
}

/** Images of the library offered in the panel */
export const PHOTO_LIBRARY = [
    'dune-portal', 'dune-curve', 'pink-arch', 'pink-spheres', 'cloud-frame', 'red-hall', 'prism-corridor', 'amber-silk',
    'ice-crystal', 'green-lines', 'crystal-hero', 'dark-rock', 'violet-ribbon', 'midnight-wave', 'candle-snow',
].map(n => `/brandbook/presets/covers/${n}.webp`)
