import type React from "react"
import { borderCss, type BorderSettings } from "../BorderControl"

/**
 * Look of a text list (brandbook editor and proposal editor share it). Saved in `block.content.list`;
 * the items stay in `block.content.items` ({ text }) so older lists keep their content.
 */

export type ListMarker =
    | "disc" | "circle" | "square" | "dash" | "arrow" | "chevron" | "check" | "star" | "custom" | "image" | "none"
    | "decimal" | "decimal-zero" | "decimal-dot-paren" | "decimal-paren" | "decimal-both" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman"

export type MarkerBadge = "none" | "circle" | "rounded" | "square"

export interface ListSettings {
    marker: ListMarker
    /** Character used by the «custom» marker */
    customMarker: string
    /** Picture used by the «image» marker (an icon, a logo…) */
    markerImage: string
    /** The picture painted in the marker colour (one-colour icons) */
    markerImageRecolor: boolean
    /** Number the first item gets (numbered markers) */
    startAt: number
    markerSize: number
    markerColor: string
    markerWeight: number
    /** A shape behind the marker (numbers in circles, ticks in squares…) */
    badge: MarkerBadge
    badgeColor: string
    badgeSize: number
    /** Marker against the first line of the item */
    markerAlign: "top" | "center"
    /** Space between the marker and the text */
    markerGap: number

    fontFamily: string
    textSize: number
    textColor: string
    textWeight: number
    lineHeight: number
    italic: boolean
    textAlign: "left" | "center" | "right"

    /** Space between two items */
    itemSpacing: number
    /** Space before the list (indent) */
    indent: number
    columns: number
    columnGap: number

    /** A description under each item (title + text, like a feature list) */
    showDescriptions: boolean
    descFontFamily: string
    descSize: number
    descColor: string
    descWeight: number
    descLineHeight: number
    descItalic: boolean
    /** Space between the item and its description */
    descGap: number

    dividers: boolean
    dividerColor: string
    dividerWidth: number
    dividerStyle: "solid" | "dashed" | "dotted"
    /** The line starts where the text starts (not under the marker) */
    dividerInset: boolean
    /** A line above the first item and under the last one too */
    dividerEnds: boolean

    background: string
    padding: number
    radius: number
    border?: BorderSettings
}

export const LIST_DEFAULTS: ListSettings = {
    marker: "disc",
    customMarker: "★",
    markerImage: "",
    markerImageRecolor: false,
    startAt: 1,
    markerSize: 16,
    markerColor: "#FF0054",
    markerWeight: 600,
    badge: "none",
    badgeColor: "#FFE5EE",
    badgeSize: 28,
    markerAlign: "center",
    markerGap: 12,

    fontFamily: "",
    textSize: 16,
    textColor: "",
    textWeight: 400,
    lineHeight: 1.5,
    italic: false,
    textAlign: "left",

    itemSpacing: 10,
    indent: 0,
    columns: 1,
    columnGap: 32,

    showDescriptions: false,
    descFontFamily: "",
    descSize: 14,
    descColor: "",
    descWeight: 400,
    descLineHeight: 1.45,
    descItalic: false,
    descGap: 4,

    dividers: false,
    dividerColor: "#E5E7EB",
    dividerWidth: 1,
    dividerStyle: "solid",
    dividerInset: false,
    dividerEnds: false,

    background: "",
    padding: 0,
    radius: 0,
}

export const MARKER_GROUPS: { label: string, items: { id: ListMarker, label: string, sample: string }[] }[] = [
    {
        label: "Símbolos",
        items: [
            { id: "disc", label: "Ponto", sample: "●" },
            { id: "circle", label: "Círculo", sample: "○" },
            { id: "square", label: "Quadrado", sample: "■" },
            { id: "dash", label: "Traço", sample: "—" },
            { id: "arrow", label: "Seta", sample: "→" },
            { id: "chevron", label: "Divisa", sample: "›" },
            { id: "check", label: "Visto", sample: "✓" },
            { id: "star", label: "Estrela", sample: "★" },
            { id: "custom", label: "Personalizado", sample: "Aa" },
            { id: "image", label: "Imagem / ícone próprio", sample: "⬆" },
            { id: "none", label: "Sem marcador", sample: "∅" },
        ],
    },
    {
        label: "Numeração",
        items: [
            { id: "decimal", label: "1.", sample: "1." },
            { id: "decimal-zero", label: "01.", sample: "01" },
            { id: "decimal-paren", label: "1)", sample: "1)" },
            { id: "decimal-both", label: "(1)", sample: "(1)" },
            { id: "lower-alpha", label: "a.", sample: "a." },
            { id: "upper-alpha", label: "A.", sample: "A." },
            { id: "lower-roman", label: "i.", sample: "i." },
            { id: "upper-roman", label: "I.", sample: "I." },
        ],
    },
]

export const isNumbered = (m: ListMarker) =>
    ["decimal", "decimal-zero", "decimal-dot-paren", "decimal-paren", "decimal-both", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman"].includes(m)

const toRoman = (n: number) => {
    if (n <= 0) return String(n)
    const table: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]
    let out = ""
    for (const [v, s] of table) while (n >= v) { out += s; n -= v }
    return out
}

const toAlpha = (n: number) => {
    if (n <= 0) return String(n)
    let out = ""
    while (n > 0) { n--; out = String.fromCharCode(97 + (n % 26)) + out; n = Math.floor(n / 26) }
    return out
}

/** Text of the marker of the item at `index` (0-based) */
export const markerText = (s: ListSettings, index: number): string => {
    const n = (Number.isFinite(s.startAt) ? s.startAt : 1) + index
    switch (s.marker) {
        case "disc": return "●"
        case "circle": return "○"
        case "square": return "■"
        case "dash": return "—"
        case "arrow": return "→"
        case "chevron": return "›"
        case "check": return "✓"
        case "star": return "★"
        case "custom": return s.customMarker || "•"
        case "image": return ""
        case "none": return ""
        case "decimal": return `${n}.`
        case "decimal-zero": return n < 10 && n >= 0 ? `0${n}` : String(n)
        case "decimal-dot-paren":
        case "decimal-paren": return `${n})`
        case "decimal-both": return `(${n})`
        case "lower-alpha": return `${toAlpha(n)}.`
        case "upper-alpha": return `${toAlpha(n).toUpperCase()}.`
        case "lower-roman": return `${toRoman(n).toLowerCase()}.`
        case "upper-roman": return `${toRoman(n)}.`
    }
}

/** Settings of a list block, with the old `content.style` (font, size, colour from the text bar) as a fallback */
export const resolveListSettings = (content: any): ListSettings => {
    const legacy = content?.style || {}
    const px = (v: unknown) => (typeof v === "number" ? v : parseFloat(String(v ?? ""))) || undefined
    return {
        ...LIST_DEFAULTS,
        ...(legacy.fontFamily ? { fontFamily: legacy.fontFamily } : {}),
        ...(px(legacy.fontSize) ? { textSize: px(legacy.fontSize)! } : {}),
        ...(legacy.color ? { textColor: legacy.color } : {}),
        ...(px(legacy.fontWeight) ? { textWeight: px(legacy.fontWeight)! } : {}),
        ...(px(legacy.lineHeight) ? { lineHeight: px(legacy.lineHeight)! } : {}),
        ...(legacy.fontStyle === "italic" ? { italic: true } : {}),
        ...(legacy.textAlign ? { textAlign: legacy.textAlign } : {}),
        ...(content?.list || {}),
    }
}

/** Box around the list: background, padding, corners, border */
export const listBoxStyle = (s: ListSettings): React.CSSProperties => ({
    backgroundColor: s.background || undefined,
    padding: s.padding || undefined,
    borderRadius: s.radius || undefined,
    ...borderCss(s.border),
})

export const dividerCss = (s: ListSettings) => `${s.dividerWidth}px ${s.dividerStyle} ${s.dividerColor}`
