import type React from "react"

/**
 * Hover state of a section, column or block. Each field is optional: only what is set changes on hover.
 * Stored as `content.hoverEffect` on blocks/sections and `settings.hoverEffect` on columns.
 * The rules live in globals.css (`.bh-*`); this only picks the classes and CSS variables.
 */
export interface HoverEffect {
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    /** px the element rises */
    lift?: number
    /** % size on hover (100 = unchanged) */
    scale?: number
    shadow?: 'soft' | 'strong'
    /** % opacity on hover */
    opacity?: number
    /** % zoom of the images inside (100 = unchanged) */
    imageZoom?: number
    /** Images are black & white and get their color on hover */
    imageColorOnHover?: boolean
    /** Corner rounding on hover (px) */
    radius?: number
    /** Border thickness on hover (px) */
    borderWidth?: number
    /** Text inside: titles / body text on hover (textColor colors all text) */
    headingColor?: string
    bodyColor?: string
    /** Seconds */
    duration?: number
}

export const hasHoverEffect = (effect?: HoverEffect | null) =>
    !!effect && Object.entries(effect).some(([key, value]) => key !== 'duration' && value !== undefined && value !== null && value !== '')

/** Classes + CSS variables that make an element react to hover; empty when there is nothing to do */
export const getHoverProps = (effect?: HoverEffect | null): { className: string, style: React.CSSProperties } => {
    if (!effect || !hasHoverEffect(effect)) return { className: '', style: {} }

    const classes = ['bh']
    const style: Record<string, string> = {
        '--bh-d': `${effect.duration ?? 0.35}s`,
    }
    if (effect.backgroundColor) { classes.push('bh-bg'); style['--bh-bg'] = effect.backgroundColor }
    if (effect.textColor) { classes.push('bh-text'); style['--bh-text'] = effect.textColor }
    if (effect.borderColor) { classes.push('bh-border'); style['--bh-border'] = effect.borderColor }
    if (effect.lift || (effect.scale && effect.scale !== 100)) {
        classes.push('bh-move')
        style['--bh-lift'] = `${-(effect.lift || 0)}px`
        style['--bh-scale'] = String((effect.scale || 100) / 100)
    }
    if (effect.shadow) classes.push(effect.shadow === 'strong' ? 'bh-shadow-strong' : 'bh-shadow-soft')
    if (effect.opacity !== undefined && effect.opacity !== 100) { classes.push('bh-opacity'); style['--bh-opacity'] = String(effect.opacity / 100) }
    if (effect.imageZoom && effect.imageZoom !== 100) { classes.push('bh-zoom'); style['--bh-zoom'] = String(effect.imageZoom / 100) }
    if (effect.imageColorOnHover) classes.push('bh-gray')
    if (effect.radius !== undefined && effect.radius !== null) { classes.push('bh-radius'); style['--bh-radius'] = `${effect.radius}px` }
    if (effect.borderWidth) { classes.push('bh-border-width'); style['--bh-bw'] = `${effect.borderWidth}px` }
    if (effect.headingColor) { classes.push('bh-heading'); style['--bh-heading'] = effect.headingColor }
    if (effect.bodyColor) { classes.push('bh-body'); style['--bh-body'] = effect.bodyColor }

    return { className: classes.join(' '), style: style as React.CSSProperties }
}
