
export const hexToRgb = (hex: string) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 0;
    let m = 0;
    let y = 0;
    let k = 0;

    r = r / 255;
    g = g / 255;
    b = b / 255;

    k = Math.min(1 - r, 1 - g, 1 - b);
    c = (1 - r - k) / (1 - k);
    m = (1 - g - k) / (1 - k);
    y = (1 - b - k) / (1 - k);

    c = Math.round(c * 100) || 0;
    m = Math.round(m * 100) || 0;
    y = Math.round(y * 100) || 0;
    k = Math.round(k * 100) || 0;

    return { c, m, y, k };
}

// Approximate Pantone (Simulation only, real matching requires licensed tables)
export const getSimulatedPantone = (hex: string) => {
    // This is a placeholder as real Pantone matching is complex/proprietary
    // We'll generate a "PMS" string based on the hex hash for consistency
    const hash = hex.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `PMS ${Math.abs(hash) % 1000} C`;
}
