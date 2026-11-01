/**
 * Cover settings: what a cover section draws behind its content. A background (colour / image / gradient
 * kept in the section's own settings) plus an animated layer (mesh, fluid, liquid, aurora…) that can follow
 * the mouse, the image's own motion, and a finish (overlay, cursor light, grain, vignette).
 */

export type CoverEffect = 'none' | 'mesh' | 'fluid' | 'liquid' | 'aurora' | 'waves'
export type CoverImageMotion = 'none' | 'parallax' | 'zoom' | 'liquid'
export type CoverOverlay = 'none' | 'solid' | 'bottom' | 'top' | 'left' | 'radial'
export type CoverBlend = 'normal' | 'screen' | 'overlay' | 'soft-light' | 'multiply'

export interface CoverSettings {
    effect?: CoverEffect
    /** Colours of the animated layer (2–5) */
    colors?: string[]
    /** 0.2 – 3 */
    speed?: number
    /** Strength of the shapes / distortion, 0 – 100 */
    intensity?: number
    /** Size / zoom of the shapes, 0 – 100 */
    scale?: number
    /** The layer reacts to the mouse */
    interactive?: boolean
    /** How much the mouse moves / distorts it, 0 – 100 */
    mouseStrength?: number
    /** Opacity of the animated layer over the background, 0 – 100 */
    effectOpacity?: number
    blend?: CoverBlend
    /** Softness of the mesh / fluid shapes, 0 – 100 */
    blur?: number
    // background image
    imageMotion?: CoverImageMotion
    imagePosition?: string
    imageScale?: number
    // finish
    overlay?: CoverOverlay
    overlayColor?: string
    overlayOpacity?: number
    spotlight?: boolean
    spotlightColor?: string
    spotlightSize?: number
    spotlightOpacity?: number
    grain?: number
    grainAnimated?: boolean
    vignette?: number
}

export const COVER_DEFAULTS: Required<CoverSettings> = {
    effect: 'none',
    colors: ['#FF0054', '#9E0059', '#390099', '#06D6A0'],
    speed: 1,
    intensity: 60,
    scale: 50,
    interactive: true,
    mouseStrength: 50,
    effectOpacity: 100,
    blend: 'normal',
    blur: 60,
    imageMotion: 'none',
    imagePosition: 'center',
    imageScale: 100,
    overlay: 'none',
    overlayColor: '#000000',
    overlayOpacity: 40,
    spotlight: false,
    spotlightColor: '#FFFFFF',
    spotlightSize: 40,
    spotlightOpacity: 25,
    grain: 0,
    grainAnimated: true,
    vignette: 0,
}

export const resolveCover = (cover?: CoverSettings) => ({
    ...COVER_DEFAULTS,
    ...Object.fromEntries(Object.entries(cover || {}).filter(([, v]) => v !== undefined)),
}) as Required<CoverSettings>

export const COVER_EFFECTS: { id: CoverEffect, label: string, hint: string }[] = [
    { id: 'none', label: 'Nenhum', hint: 'Só o fundo' },
    { id: 'mesh', label: 'Mesh', hint: 'Manchas de cor a flutuar' },
    { id: 'fluid', label: 'Fluido', hint: 'Bolhas que seguem o rato' },
    { id: 'liquid', label: 'Líquido', hint: 'Tinta em movimento, distorce com o rato' },
    { id: 'aurora', label: 'Aurora', hint: 'Faixas de luz a ondular' },
    { id: 'waves', label: 'Ondas', hint: 'Linhas que ondulam e reagem ao rato' },
]

export const COVER_PALETTES: { name: string, colors: string[] }[] = [
    { name: 'Brivio', colors: ['#FF0054', '#9E0059', '#390099', '#06D6A0'] },
    { name: 'Pôr do sol', colors: ['#FF5E3A', '#FF2A68', '#FFB347', '#7A1FD8'] },
    { name: 'Oceano', colors: ['#00C2FF', '#0047FF', '#00E0B0', '#0B1B3A'] },
    { name: 'Néon', colors: ['#FF00E5', '#00F0FF', '#7B2CFF', '#0A0A0A'] },
    { name: 'Floresta', colors: ['#06D6A0', '#0B6E4F', '#C8E6A0', '#04160F'] },
    { name: 'Âmbar', colors: ['#FF9A00', '#FF5400', '#2A0A00', '#FFD27A'] },
    { name: 'Mono', colors: ['#FFFFFF', '#8A8A90', '#2A2A2E', '#0A0A0A'] },
    { name: 'Pastel', colors: ['#FFC6E0', '#C9B6FF', '#B5E8FF', '#FFF1C1'] },
]

/** Section settings → is this section a cover (library covers, or any full-screen full-width section) */
export const isCoverSection = (settings?: Record<string, any>) =>
    !!settings && (settings.isCover ?? (settings.height === '100vh' && !!settings.isFullWidth))

/** Images of the library covers, offered in the cover's background picker */
export const COVER_IMAGES = [
    'amber-silk', 'crystal-prism', 'crystal-hero', 'dark-rock', 'ice-crystal', 'green-lines', 'prism-corridor', 'red-hall',
    'indigo-rings', 'blue-dots', 'midnight-wave', 'violet-ribbon', 'violet-fluid', 'purple-bubbles', 'neon-blur', 'spectrum-rays',
    'coral-violet', 'sunset-haze', 'lilac-haze', 'periwinkle-flow', 'ice-blue-blur', 'blue-blur', 'blue-wave', 'cloud-frame',
    'pink-spheres', 'pink-arch', 'dune-curve', 'dune-portal',
].map(name => `/brandbook/presets/covers/${name}.webp`)

/** "#RRGGBB" → [r, g, b] in 0–1 */
export const hexToRgb = (hex: string): [number, number, number] => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex || '')
    if (!m) return [0, 0, 0]
    return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
}

export const withAlpha = (hex: string, alpha: number) => {
    const [r, g, b] = hexToRgb(hex)
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.max(0, Math.min(1, alpha))})`
}
