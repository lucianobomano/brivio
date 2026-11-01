/** The official Brivio symbol (the ring), drawn as SVG so it sits on any background */

/** Colours around the ring, clockwise from the top (every 30°) */
const BRIVIO_RING = ['#E4006A', '#B5007E', '#7A0096', '#2A10A6', '#0E5AB0', '#06D6A0', '#10C49A', '#5A5A7A', '#900A5A', '#D40050', '#FF0054', '#F8005E']

/** Data URL of the symbol: in its gradient, or in one `color` */
export const brivioSymbol = (color?: string) => {
    const c = 50, r = 42.5
    const at = (deg: number) => {
        const a = (deg - 90) * Math.PI / 180
        return [+(c + r * Math.cos(a)).toFixed(2), +(c + r * Math.sin(a)).toFixed(2)]
    }
    const ring = color
        ? `<circle cx="50" cy="50" r="${r}" stroke="${color}" stroke-width="14.2"/>`
        : BRIVIO_RING.map((from, i) => {
            const to = BRIVIO_RING[(i + 1) % BRIVIO_RING.length]
            const [x1, y1] = at(i * 30), [x2, y2] = at((i + 1) * 30)
            // Each 30° arc fades into the next colour; a hair longer so the joins don't show
            const [ex, ey] = at((i + 1) * 30 + 0.6)
            return `<linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`
                + `<path d="M${x1} ${y1}A${r} ${r} 0 0 1 ${ex} ${ey}" stroke="url(#g${i})" stroke-width="14.2"/>`
        }).join('')
    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">${ring}</svg>`)}`
}
