/**
 * Ready-made button styles and animations for the Button settings panel.
 * Styles are plain CSS merged into the button's `content.style`; animations are CSS classes
 * (`ba-<id>` in app/globals.css) stored as `content.buttonAnimation`.
 */

import type { ButtonIconSettings } from "./buttonIcons"

export interface ButtonStylePreset {
    id: string
    name: string
    style: Record<string, string | number | undefined>
    /** Presets with an icon also set it (it stays editable in the Ícone tab) */
    icon?: ButtonIconSettings
}

const BRIVIO = { pink: '#FF0054', magenta: '#9E0059', indigo: '#390099', green: '#06D6A0', black: '#000000' }

/** Style keys a preset owns: applying a preset resets them, so presets never mix with each other */
export const BUTTON_STYLE_KEYS = [
    'backgroundColor', 'backgroundImage', 'color', 'borderRadius', 'borderWidth', 'borderColor',
    'fontWeight', 'letterSpacing', 'textTransform', 'boxShadow', 'fontSize', 'width', 'height',
] as const

export const BUTTON_STYLE_PRESETS: ButtonStylePreset[] = [
    { id: 'pill', name: 'Pílula', style: { backgroundColor: BRIVIO.pink, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 500 } },
    { id: 'pill-black', name: 'Pílula preta', style: { backgroundColor: BRIVIO.black, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 500 } },
    { id: 'pill-white', name: 'Pílula clara', style: { backgroundColor: '#FFFFFF', color: BRIVIO.black, borderRadius: '9999px', fontWeight: 500, borderWidth: '1px', borderColor: '#E5E5E5' } },
    { id: 'outline', name: 'Contorno', style: { backgroundColor: 'transparent', color: BRIVIO.pink, borderRadius: '9999px', borderWidth: '1.5px', borderColor: BRIVIO.pink, fontWeight: 500 } },
    { id: 'outline-black', name: 'Contorno preto', style: { backgroundColor: 'transparent', color: BRIVIO.black, borderRadius: '9999px', borderWidth: '1.5px', borderColor: BRIVIO.black, fontWeight: 500 } },
    { id: 'square', name: 'Retângulo', style: { backgroundColor: BRIVIO.black, color: '#FFFFFF', borderRadius: '0px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '13px' } },
    { id: 'rounded', name: 'Arredondado', style: { backgroundColor: BRIVIO.indigo, color: '#FFFFFF', borderRadius: '10px', fontWeight: 500 } },
    { id: 'soft', name: 'Suave', style: { backgroundColor: '#FFE5EE', color: BRIVIO.pink, borderRadius: '12px', fontWeight: 600 } },
    { id: 'green', name: 'Verde', style: { backgroundColor: BRIVIO.green, color: BRIVIO.black, borderRadius: '9999px', fontWeight: 600 } },
    { id: 'magenta', name: 'Magenta', style: { backgroundColor: BRIVIO.magenta, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 500 } },
    { id: 'gradient', name: 'Gradiente', style: { backgroundColor: BRIVIO.indigo, backgroundImage: `linear-gradient(120deg, #94007C 0%, ${BRIVIO.pink} 40%, ${BRIVIO.indigo} 75%, ${BRIVIO.green} 100%)`, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 600 } },
    { id: 'shadow', name: 'Com sombra', style: { backgroundColor: BRIVIO.pink, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 600, boxShadow: '0 10px 24px -8px rgba(255,0,84,0.6)' } },
    { id: 'glass', name: 'Vidro', style: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', borderRadius: '9999px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 500, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' } },
    { id: 'link', name: 'Link', style: { backgroundColor: 'transparent', color: BRIVIO.pink, borderRadius: '0px', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '4px' } },
    { id: 'caps', name: 'Maiúsculas', style: { backgroundColor: BRIVIO.pink, color: '#FFFFFF', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '12px' } },
    { id: 'brutal', name: 'Brutalista', style: { backgroundColor: BRIVIO.green, color: BRIVIO.black, borderRadius: '0px', borderWidth: '2px', borderColor: BRIVIO.black, fontWeight: 700, boxShadow: '4px 4px 0 #000000' } },
    { id: 'large', name: 'Grande', style: { backgroundColor: BRIVIO.black, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 600, fontSize: '18px', width: '220px', height: '56px' } },
    { id: 'small', name: 'Pequeno', style: { backgroundColor: BRIVIO.pink, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 500, fontSize: '13px', width: '120px', height: '32px' } },
    // With icons
    { id: 'icon-arrow', name: 'Seta', style: { backgroundColor: BRIVIO.pink, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 600 }, icon: { name: 'arrow-right', position: 'right', size: 18, hoverShift: true } },
    { id: 'icon-arrow-up', name: 'Seta diagonal', style: { backgroundColor: 'transparent', color: BRIVIO.black, borderRadius: '9999px', borderWidth: '1.5px', borderColor: BRIVIO.black, fontWeight: 500 }, icon: { name: 'arrow-up-right', position: 'right', size: 18, hoverShift: true } },
    { id: 'icon-download', name: 'Download', style: { backgroundColor: BRIVIO.black, color: '#FFFFFF', borderRadius: '9999px', fontWeight: 500 }, icon: { name: 'download', position: 'left', size: 18 } },
    { id: 'icon-play', name: 'Play', style: { backgroundColor: '#FFFFFF', color: BRIVIO.black, borderRadius: '9999px', borderWidth: '1px', borderColor: '#E5E5E5', fontWeight: 600 }, icon: { name: 'play', position: 'left', size: 16, color: BRIVIO.pink } },
    { id: 'icon-external', name: 'Link externo', style: { backgroundColor: 'transparent', color: BRIVIO.pink, borderRadius: '0px', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '4px' }, icon: { name: 'external-link', position: 'right', size: 16 } },
    { id: 'icon-mail', name: 'Contacto', style: { backgroundColor: BRIVIO.indigo, color: '#FFFFFF', borderRadius: '10px', fontWeight: 500 }, icon: { name: 'mail', position: 'left', size: 18 } },
    { id: 'icon-send', name: 'Enviar', style: { backgroundColor: BRIVIO.green, color: BRIVIO.black, borderRadius: '9999px', fontWeight: 600 }, icon: { name: 'send', position: 'right', size: 16, hoverShift: true } },
    { id: 'icon-circle', name: 'Só ícone', style: { backgroundColor: BRIVIO.pink, color: '#FFFFFF', borderRadius: '9999px', width: '48px', height: '48px' }, icon: { name: 'arrow-right', position: 'only', size: 20, hoverShift: true } },
    { id: 'icon-square', name: 'Ícone quadrado', style: { backgroundColor: BRIVIO.black, color: '#FFFFFF', borderRadius: '12px', width: '48px', height: '48px' }, icon: { name: 'plus', position: 'only', size: 20 } },
]

export type ButtonAnimationKind = 'hover' | 'loop'

export interface ButtonAnimation {
    id: string
    name: string
    kind: ButtonAnimationKind
}

/** Every id has a matching `.ba-<id>` rule in app/globals.css */
export const BUTTON_ANIMATIONS: ButtonAnimation[] = [
    // Hover: movement
    { id: 'grow', name: 'Crescer', kind: 'hover' },
    { id: 'shrink', name: 'Encolher', kind: 'hover' },
    { id: 'pulse', name: 'Pulso', kind: 'hover' },
    { id: 'push', name: 'Empurrar', kind: 'hover' },
    { id: 'pop', name: 'Pop', kind: 'hover' },
    { id: 'float', name: 'Flutuar', kind: 'hover' },
    { id: 'sink', name: 'Afundar', kind: 'hover' },
    { id: 'bob', name: 'Balançar', kind: 'hover' },
    { id: 'hang', name: 'Pendurar', kind: 'hover' },
    { id: 'skew', name: 'Inclinar', kind: 'hover' },
    { id: 'skew-forward', name: 'Inclinar à frente', kind: 'hover' },
    { id: 'wobble-h', name: 'Oscilar horizontal', kind: 'hover' },
    { id: 'wobble-v', name: 'Oscilar vertical', kind: 'hover' },
    { id: 'wobble-skew', name: 'Oscilar inclinado', kind: 'hover' },
    { id: 'buzz', name: 'Vibrar', kind: 'hover' },
    { id: 'buzz-out', name: 'Vibrar e parar', kind: 'hover' },
    { id: 'shake', name: 'Abanar', kind: 'hover' },
    { id: 'jello', name: 'Gelatina', kind: 'hover' },
    { id: 'rubber', name: 'Elástico', kind: 'hover' },
    { id: 'tada', name: 'Tada', kind: 'hover' },
    { id: 'swing', name: 'Baloiço', kind: 'hover' },
    { id: 'rotate', name: 'Rodar', kind: 'hover' },
    { id: 'grow-rotate', name: 'Crescer e rodar', kind: 'hover' },
    { id: 'forward', name: 'Avançar', kind: 'hover' },
    { id: 'backward', name: 'Recuar', kind: 'hover' },
    // Hover: light, shadow, color
    { id: 'glow', name: 'Brilho', kind: 'hover' },
    { id: 'shadow', name: 'Sombra', kind: 'hover' },
    { id: 'lift', name: 'Elevar', kind: 'hover' },
    { id: 'ring', name: 'Anel', kind: 'hover' },
    { id: 'lighten', name: 'Clarear', kind: 'hover' },
    { id: 'darken', name: 'Escurecer', kind: 'hover' },
    { id: 'spacing', name: 'Espaçar letras', kind: 'hover' },
    // Hover: fills and lines
    { id: 'sweep-right', name: 'Varrer à direita', kind: 'hover' },
    { id: 'sweep-left', name: 'Varrer à esquerda', kind: 'hover' },
    { id: 'sweep-up', name: 'Varrer para cima', kind: 'hover' },
    { id: 'sweep-down', name: 'Varrer para baixo', kind: 'hover' },
    { id: 'bounce-right', name: 'Ressalto à direita', kind: 'hover' },
    { id: 'radial', name: 'Radial', kind: 'hover' },
    { id: 'shutter-h', name: 'Persiana horizontal', kind: 'hover' },
    { id: 'shutter-v', name: 'Persiana vertical', kind: 'hover' },
    { id: 'shine', name: 'Reflexo', kind: 'hover' },
    { id: 'underline', name: 'Sublinhar', kind: 'hover' },
    { id: 'underline-left', name: 'Sublinhar da esquerda', kind: 'hover' },
    { id: 'border-draw', name: 'Desenhar contorno', kind: 'hover' },
    // Continuous
    { id: 'loop-pulse', name: 'Pulsar', kind: 'loop' },
    { id: 'loop-breathe', name: 'Respirar', kind: 'loop' },
    { id: 'loop-bounce', name: 'Saltar', kind: 'loop' },
    { id: 'loop-wiggle', name: 'Abanar a cada 2 s', kind: 'loop' },
    { id: 'loop-glow', name: 'Brilho contínuo', kind: 'loop' },
    { id: 'loop-shine', name: 'Reflexo contínuo', kind: 'loop' },
    { id: 'loop-heartbeat', name: 'Batimento', kind: 'loop' },
    { id: 'loop-float', name: 'Flutuar sempre', kind: 'loop' },
    { id: 'loop-ring', name: 'Ondas', kind: 'loop' },
    { id: 'loop-shake', name: 'Chamar atenção', kind: 'loop' },
    { id: 'loop-gradient', name: 'Gradiente animado', kind: 'loop' },
]

/** Speed multiplier for the animation durations */
export const BUTTON_ANIMATION_SPEEDS = [
    { id: 'fast', label: 'Rápida', value: 0.6 },
    { id: 'normal', label: 'Normal', value: 1 },
    { id: 'slow', label: 'Lenta', value: 1.6 },
] as const

/** Animations drawn with a ::before layer need the button to clip it */
const FILL_ANIMATIONS = new Set(['sweep-right', 'sweep-left', 'sweep-up', 'sweep-down', 'bounce-right', 'radial', 'shutter-h', 'shutter-v', 'shine', 'loop-shine'])

/** Classes that play an animation on a button (empty for none / unknown) */
export const getButtonAnimationClass = (id?: string | null) => {
    if (!id || !BUTTON_ANIMATIONS.some(a => a.id === id)) return ''
    return `ba ba-${id}${FILL_ANIMATIONS.has(id) ? ' ba-fill' : ''}`
}
