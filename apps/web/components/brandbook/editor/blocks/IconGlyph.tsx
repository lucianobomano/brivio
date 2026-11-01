"use client"

import React from "react"
import { iconOf, type IconCorners, type IconStyle } from "./iconSpecimen"

const STROKE: Record<IconCorners, { strokeLinecap: 'round' | 'butt' | 'square', strokeLinejoin: 'round' | 'miter' | 'bevel' }> = {
    round: { strokeLinecap: 'round', strokeLinejoin: 'round' },
    sharp: { strokeLinecap: 'butt', strokeLinejoin: 'miter' },
    chamfer: { strokeLinecap: 'square', strokeLinejoin: 'bevel' },
}

/**
 * One icon of the library drawn in a style (outline / solid / duotone), stroke weight, corners and colour.
 * The drawing always stays inside the 20 × 20 live area of the 24 grid: the icons are drawn up to its edge,
 * so a heavier stroke would spill over the margin; the shape shrinks by the weight instead, and the stroke
 * is compensated to keep exactly the chosen weight.
 */
export const IconGlyph = ({ name, style, weight, corners, color, size }: {
    name: string, style: IconStyle, weight: number, corners: IconCorners, color: string, size: number | string
}) => {
    const fit = Math.max(0.5, (20 - weight) / 20)
    return React.createElement(iconOf(name), {
        width: size,
        height: size,
        strokeWidth: weight / fit,
        color,
        ...STROKE[corners],
        // Sharp mitres stay close to the shape (no long spikes past the live area)
        strokeMiterlimit: 4,
        fill: style === 'outline' ? 'none' : color,
        fillOpacity: style === 'duotone' ? 0.22 : 1,
        'aria-hidden': true,
        style: {
            display: 'block',
            transform: `scale(${fit})`,
            transformOrigin: '50% 50%',
            transition: 'stroke-width 120ms linear, transform 120ms linear, color 200ms, fill 200ms',
        },
    })
}
