import type React from "react"

/** Style of the Download block (block.content.style); everything optional, defaults below */
export interface DownloadStyle {
    backgroundColor?: string
    textColor?: string
    metaColor?: string
    borderColor?: string
    iconBgColor?: string
    iconColor?: string
    buttonBgColor?: string
    buttonTextColor?: string
    buttonBorderColor?: string
    /** Colours change on hover */
    hoverEnabled?: boolean
    hoverBackgroundColor?: string
    hoverTextColor?: string
    hoverBorderColor?: string
    hoverIconBgColor?: string
    hoverIconColor?: string
    hoverButtonBgColor?: string
    hoverButtonTextColor?: string
    /** Movement of the card on hover */
    hoverEffect?: DownloadHoverEffect
    /** Colour of the glow / shadow of the hover effect */
    hoverEffectColor?: string
    /** Movement of the download icon on hover */
    hoverIconEffect?: DownloadIconEffect
    /** Transition length, ms */
    hoverDuration?: number
    /** File details popover on the shared link */
    showPreview?: boolean
    previewHeaderColor?: string
    width?: string
    height?: string
    borderRadius?: string | number
    borderWidth?: string | number
    margin?: any
}

export type DownloadHoverEffect = 'none' | 'lift' | 'grow' | 'shadow' | 'glow' | 'press' | 'slide' | 'tilt'
export type DownloadIconEffect = 'none' | 'drop' | 'bounce' | 'scale' | 'wiggle'

export const DOWNLOAD_DEFAULTS = {
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    borderColor: '#E5E7EB',
    iconBgColor: '#EFF6FF',
    iconColor: '#3B82F6',
    buttonBgColor: '#FFFFFF',
    buttonTextColor: '#111827',
    buttonBorderColor: '#E5E7EB',
    hoverBackgroundColor: '#FF0054',
    hoverTextColor: '#FFFFFF',
    hoverBorderColor: '#FF0054',
    hoverIconBgColor: 'rgba(255,255,255,0.18)',
    hoverIconColor: '#FFFFFF',
    hoverButtonBgColor: '#FFFFFF',
    hoverButtonTextColor: '#FF0054',
    hoverDuration: 300,
}

export const HOVER_EFFECTS: { id: DownloadHoverEffect, label: string }[] = [
    { id: 'none', label: 'Nenhum' },
    { id: 'lift', label: 'Elevar' },
    { id: 'grow', label: 'Crescer' },
    { id: 'shadow', label: 'Sombra' },
    { id: 'glow', label: 'Brilho' },
    { id: 'press', label: 'Pressionar' },
    { id: 'slide', label: 'Deslizar' },
    { id: 'tilt', label: 'Inclinar' },
]

export const ICON_EFFECTS: { id: DownloadIconEffect, label: string }[] = [
    { id: 'none', label: 'Nenhum' },
    { id: 'drop', label: 'Descer' },
    { id: 'bounce', label: 'Saltar' },
    { id: 'scale', label: 'Aumentar' },
    { id: 'wiggle', label: 'Abanar' },
]

/** Card transform / shadow for a hover effect */
export const hoverEffectStyle = (effect: DownloadHoverEffect | undefined, accent: string, shadowColor = '#000000'): React.CSSProperties => {
    switch (effect) {
        case 'lift': return { transform: 'translateY(-4px)', boxShadow: `0 14px 30px -12px ${withAlpha(shadowColor, 0.3)}` }
        case 'grow': return { transform: 'scale(1.02)' }
        case 'shadow': return { boxShadow: `0 20px 45px -15px ${withAlpha(shadowColor, 0.4)}` }
        case 'glow': return { boxShadow: `0 0 0 4px ${withAlpha(accent, 0.25)}, 0 12px 32px -8px ${withAlpha(accent, 0.45)}` }
        case 'press': return { transform: 'scale(0.98)' }
        case 'slide': return { transform: 'translateX(6px)' }
        case 'tilt': return { transform: 'perspective(800px) rotateX(4deg) translateY(-2px)', boxShadow: `0 16px 30px -14px ${withAlpha(shadowColor, 0.35)}` }
        default: return {}
    }
}

/** Hex colour with alpha; other formats are returned as they are */
export const withAlpha = (color: string, alpha: number) => {
    const hex = color.replace('#', '')
    const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex
    if (!/^[0-9a-f]{6}$/i.test(full)) return color
    const n = parseInt(full, 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** "12" / 12 / "12px" → "12px" */
export const cssPx = (value: string | number | undefined, fallback: string) => {
    if (value === undefined || value === null || value === '') return fallback
    const text = String(value).trim()
    return /^\d+(\.\d+)?$/.test(text) ? `${text}px` : text
}
