import type { CSSProperties } from "react"

/**
 * The background a proposal page sets in content_json.style (the dark «Brutalista»/«Tech» pages, the photo cover
 * of «Arquitetura»). Only the background: spacing stays with each section, so pages keep their layout.
 */
export function pageBackground(style: Record<string, unknown> | null | undefined): CSSProperties | undefined {
    if (!style) return undefined
    const pick = (k: string) => (typeof style[k] === "string" ? (style[k] as string) : undefined)
    const css: CSSProperties = {
        backgroundColor: pick("backgroundColor"),
        backgroundImage: pick("backgroundImage"),
        backgroundSize: pick("backgroundSize") || (pick("backgroundImage") ? "cover" : undefined),
        backgroundPosition: pick("backgroundPosition") || (pick("backgroundImage") ? "center" : undefined),
    }
    return css.backgroundColor || css.backgroundImage ? css : undefined
}

/** Text colour for blocks that inherit it (price table, timeline, lists): light on a dark page, else none */
export function pageTextColor(style: Record<string, unknown> | null | undefined): string | undefined {
    if (!style) return undefined
    if (typeof style.color === "string") return style.color
    const bg = typeof style.backgroundColor === "string" ? style.backgroundColor.trim() : ""
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(bg)?.[1]
    if (!hex) return undefined
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex
    const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance < 0.4 ? "#e4e4e7" : undefined
}
