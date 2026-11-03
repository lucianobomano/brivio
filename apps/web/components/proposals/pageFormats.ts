/**
 * Page formats of a proposal page (Página → Secções → Colunas → Subcolunas).
 * Stored in the page's content_json.page = { format, orientation }. Sizes in CSS px at 96 dpi, so a printed
 * A4 page is exactly the A4 the user designed. A page without a format is «Web contínua» (fixed width, free height),
 * which is how every page behaved before formats existed.
 */

export type PageOrientation = "portrait" | "landscape"
export type PageSetting = { format: string, orientation?: PageOrientation }

export type PageFormat = {
    id: string
    label: string
    group: "documento" | "ecra"
    /** Size in the format's natural orientation (portrait for paper) */
    width: number
    height: number | null
    /** Paper can be turned; screen formats have a fixed shape */
    rotatable: boolean
    /** CSS @page size for printing / PDF */
    printSize?: string
    hint: string
}

export const PAGE_FORMATS: PageFormat[] = [
    // Paper (ISO 216 + US Letter)
    { id: "a5", label: "A5", group: "documento", width: 559, height: 794, rotatable: true, printSize: "A5", hint: "148 × 210 mm" },
    { id: "a4", label: "A4", group: "documento", width: 794, height: 1123, rotatable: true, printSize: "A4", hint: "210 × 297 mm" },
    { id: "a3", label: "A3", group: "documento", width: 1123, height: 1587, rotatable: true, printSize: "A3", hint: "297 × 420 mm" },
    { id: "a2", label: "A2", group: "documento", width: 1587, height: 2245, rotatable: true, printSize: "420mm 594mm", hint: "420 × 594 mm" },
    { id: "letter", label: "Carta", group: "documento", width: 816, height: 1056, rotatable: true, printSize: "letter", hint: "8,5 × 11 pol." },
    // Screen
    { id: "web", label: "Web contínua", group: "ecra", width: 1080, height: null, rotatable: false, hint: "Largura fixa, altura livre" },
    { id: "desktop", label: "Desktop 16:9", group: "ecra", width: 1920, height: 1080, rotatable: false, printSize: "1920px 1080px", hint: "1920 × 1080 px" },
    { id: "slide-4-3", label: "Apresentação 4:3", group: "ecra", width: 1440, height: 1080, rotatable: false, printSize: "1440px 1080px", hint: "1440 × 1080 px" },
    { id: "story", label: "Vertical 9:16", group: "ecra", width: 1080, height: 1920, rotatable: false, printSize: "1080px 1920px", hint: "1080 × 1920 px" },
    { id: "portrait-4-5", label: "Retrato 4:5", group: "ecra", width: 1080, height: 1350, rotatable: false, printSize: "1080px 1350px", hint: "1080 × 1350 px" },
    { id: "square", label: "Quadrado 1:1", group: "ecra", width: 1080, height: 1080, rotatable: false, printSize: "1080px 1080px", hint: "1080 × 1080 px" },
]

export const DEFAULT_PAGE: PageSetting = { format: "a4", orientation: "portrait" }

export type ResolvedPage = {
    format: PageFormat
    orientation: PageOrientation
    width: number
    /** null = free height (web) */
    height: number | null
    label: string
    /** Name for the CSS `page` property, one per size */
    printName: string | null
    printSize: string | null
}

export function resolvePage(page: PageSetting | null | undefined): ResolvedPage {
    const format = PAGE_FORMATS.find(f => f.id === page?.format) || PAGE_FORMATS.find(f => f.id === "web")!
    const orientation: PageOrientation = format.rotatable && page?.orientation === "landscape" ? "landscape" : "portrait"
    const turned = format.rotatable && orientation === "landscape" && format.height != null
    const width = turned ? format.height! : format.width
    const height = turned ? format.width : format.height
    const printSize = format.printSize ? (format.rotatable ? `${format.printSize} ${orientation}` : format.printSize) : null
    return {
        format,
        orientation,
        width,
        height,
        label: format.rotatable ? `${format.label} · ${orientation === "portrait" ? "Vertical" : "Horizontal"}` : format.label,
        printName: printSize ? `proposal-${format.id}-${orientation}` : null,
        printSize,
    }
}

/** @page rules for the formats used in a proposal, so «Guardar como PDF» gives each page its real size */
export function printPageRules(pages: (PageSetting | null | undefined)[]): string {
    const seen = new Map<string, string>()
    for (const p of pages) {
        const r = resolvePage(p)
        if (r.printName && r.printSize) seen.set(r.printName, r.printSize)
    }
    return [...seen].map(([name, size]) => `@page ${name} { size: ${size}; margin: 0; }`).join("\n")
}
