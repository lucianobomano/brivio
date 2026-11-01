/**
 * Brand motif field: many small brand shapes (petals, circles, rings, the brand symbol or an uploaded
 * shape) arranged on a band of the page, that grow in (on load, as the section arrives or on hover) and
 * part or lean towards the pointer. The brand's own version of a decorative "leaf field".
 */

export type MotifShape = 'petal' | 'circle' | 'ring' | 'pill' | 'diamond' | 'symbol' | 'image'
export type MotifArrangement = 'hero' | 'corner' | 'band' | 'arch' | 'ring' | 'curtain' | 'scatter'
export type MotifGrow = 'load' | 'scroll' | 'hover' | 'none'
export type MotifCursor = 'part' | 'lean' | 'none'

export interface MotifFieldSettings {
    shape?: MotifShape
    /** Uploaded shape (image mode) */
    imageUrl?: string
    arrangement?: MotifArrangement
    /** Empty = the brand colours from Settings */
    colors?: string[]
    density?: number
    /** Shape size, px */
    size?: number
    /** Variation of size and rotation, 0 – 100 */
    variation?: number
    mirror?: boolean
    seed?: number
    grow?: MotifGrow
    cursor?: MotifCursor
    cursorStrength?: number
    height?: number
    background?: string
    opacity?: number
}

export const MOTIF_DEFAULTS: Required<MotifFieldSettings> = {
    shape: 'petal',
    imageUrl: '',
    arrangement: 'hero',
    colors: [],
    density: 36,
    size: 64,
    variation: 60,
    mirror: false,
    seed: 7,
    grow: 'scroll',
    cursor: 'part',
    cursorStrength: 50,
    height: 420,
    background: '',
    opacity: 100,
}

export const resolveMotif = (settings: MotifFieldSettings) => ({
    ...MOTIF_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
}) as Required<MotifFieldSettings>

export const MOTIF_SHAPES: { id: MotifShape, label: string }[] = [
    { id: 'petal', label: 'Pétala' }, { id: 'circle', label: 'Círculo' }, { id: 'ring', label: 'Anel' }, { id: 'pill', label: 'Cápsula' },
    { id: 'diamond', label: 'Losango' }, { id: 'symbol', label: 'Símbolo' }, { id: 'image', label: 'Imagem' },
]

export const MOTIF_ARRANGEMENTS: { id: MotifArrangement, label: string }[] = [
    { id: 'hero', label: 'Laterais' }, { id: 'corner', label: 'Canto' }, { id: 'band', label: 'Faixa' }, { id: 'arch', label: 'Arco' },
    { id: 'ring', label: 'Anel' }, { id: 'curtain', label: 'Cortina' }, { id: 'scatter', label: 'Espalhadas' },
]

/** Path of a shape drawn in a 100 × 100 box (circle / ring / symbol / image are drawn apart) */
export const SHAPE_PATHS: Partial<Record<MotifShape, string>> = {
    petal: 'M50 3C79 22 93 58 50 97C7 58 21 22 50 3Z',
    pill: 'M50 4a20 20 0 0 1 20 20v52a20 20 0 0 1-40 0V24a20 20 0 0 1 20-20Z',
    diamond: 'M50 2L98 50L50 98L2 50Z',
}

export interface MotifItem { x: number, y: number, size: number, rotate: number, color: string, delay: number }

/** Deterministic random numbers (the same field on every visit) */
const random = (seed: number) => {
    let a = seed >>> 0
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** The shapes of a field: position (0 – 1 of the field), size, rotation, colour and growth delay */
export const layoutMotif = (s: Required<MotifFieldSettings>, colors: string[]): MotifItem[] => {
    const rnd = random(s.seed)
    const count = Math.max(1, Math.round(s.density))
    const v = s.variation / 100
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5
    const items: MotifItem[] = []
    for (let i = 0; i < count; i++) {
        let x = rnd(), y = rnd()
        switch (s.arrangement) {
            case 'hero': {
                const left = rnd() < 0.5
                const d = Math.pow(rnd(), 1.6) * 0.32
                x = left ? d : 1 - d
                y = rnd()
                break
            }
            case 'corner': {
                const a = Math.PI + rnd() * Math.PI / 2
                const r = Math.pow(rnd(), 0.7) * 0.75
                x = 1 + Math.cos(a) * r
                y = 1 + Math.sin(a) * r
                break
            }
            case 'band':
                y = 0.5 + gauss() * 0.16
                break
            case 'arch': {
                const a = Math.PI + rnd() * Math.PI
                const r = 0.42 + gauss() * 0.06
                x = 0.5 + Math.cos(a) * r
                y = 0.95 + Math.sin(a) * r * 1.8
                break
            }
            case 'ring': {
                const a = rnd() * Math.PI * 2
                const r = 0.34 + gauss() * 0.05
                x = 0.5 + Math.cos(a) * r * 0.75
                y = 0.5 + Math.sin(a) * r * 1.25
                break
            }
            case 'curtain': {
                x = (i + 0.5) / count + gauss() * 0.02
                y = Math.pow(rnd(), 1.4) * 0.8
                break
            }
        }
        items.push({
            x, y,
            size: s.size * (1 - v * 0.5 + rnd() * v),
            rotate: (rnd() * 2 - 1) * 180 * v + (s.arrangement === 'curtain' ? 180 : 0),
            color: colors[Math.floor(rnd() * colors.length) % colors.length],
            delay: i * (1200 / count),
        })
    }
    if (s.mirror) items.push(...items.map(it => ({ ...it, x: 1 - it.x, rotate: -it.rotate, delay: it.delay + 40 })))
    return items
}
