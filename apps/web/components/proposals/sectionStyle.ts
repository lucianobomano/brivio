import type { CSSProperties } from "react"
import { fullScreenHeight, isFullScreenSection, sectionGradientCss, type SectionSettings } from "@/components/brandbook/editor/SectionSettingsPanel"
import { borderCss } from "@/components/brandbook/editor/BorderControl"

/**
 * How a proposal section looks from its settings (the section panel is the brandbook's): background colour,
 * image or gradient, margin, corner rounding, padding, height modes and the alignment of its content.
 * Used by the builder and by the pages the client sees, so both draw the same section.
 */

type Settings = Partial<SectionSettings> | undefined

export const sectionHeight = (h?: string): string | undefined => {
    // fit: as tall as the content · fill: grows with the page (flex)
    if (!h || h === "auto" || h === "fit" || h === "fill") return undefined
    return ({ XS: "150px", S: "250px", M: "385px", L: "500px", XL: "650px" } as Record<string, string>)[h] || h
}

/** «Ajustar ao conteúdo» in width: the section hugs its content and sits where its alignment says */
export function fitWidth(settings: Settings): CSSProperties {
    if (settings?.widthMode !== "fit") return {}
    const align = settings?.alignHorizontal || "center"
    const hasMargin = !!(settings?.sectionMargin?.left || settings?.sectionMargin?.right)
    return {
        width: "fit-content",
        maxWidth: "100%",
        ...(hasMargin ? {} : { marginLeft: align === "left" ? 0 : "auto", marginRight: align === "right" ? 0 : "auto" }),
    }
}

export function sectionStyles(settings: Settings, opts: {
    isReadOnly: boolean
    /** Padding of a section that never set one */
    defaultPadding?: number
    /** Size of the section, for radial gradients drawn in pixels */
    box?: { width: number, height: number }
    /** Height of the page on a page with a format: «full screen» means the whole page there */
    pageHeight?: number | null
}) {
    const { isReadOnly, defaultPadding = 40, box, pageHeight } = opts
    const full = isFullScreenSection(settings)
    const fullHeight = (inner: boolean) => {
        const v = fullScreenHeight(settings, inner)
        return pageHeight ? v.replace("100vh", `${pageHeight}px`) : v
    }

    const margin = settings?.sectionMargin
    const radius = settings?.sectionRadius
    const marginX = (margin?.left || 0) + (margin?.right || 0)
    const hasRadius = !!radius && Math.max(radius.top || 0, radius.right || 0, radius.bottom || 0, radius.left || 0) > 0
    const type = settings?.backgroundType || "color"

    const outer: CSSProperties = {
        ...(margin ? {
            marginTop: margin.top || undefined,
            marginBottom: margin.bottom || undefined,
            marginLeft: margin.left || undefined,
            marginRight: margin.right || undefined,
            width: marginX ? `calc(100% - ${marginX}px)` : undefined,
        } : {}),
        ...(hasRadius ? {
            borderRadius: `${radius!.top || 0}px ${radius!.right || 0}px ${radius!.bottom || 0}px ${radius!.left || 0}px`,
            // On the page the content is clipped to the corners; the editor keeps the toolbar (outside) visible
            overflow: isReadOnly ? "hidden" : undefined,
        } : {}),
        minHeight: full ? fullHeight(false) : sectionHeight(settings?.height),
        backgroundColor: type === "color" && settings?.backgroundColor && settings.backgroundColor !== "transparent" ? settings.backgroundColor : undefined,
        backgroundImage: type === "image" && settings?.backgroundImage
            ? `url(${settings.backgroundImage})`
            : type === "gradient" && settings?.backgroundGradient
                ? sectionGradientCss(settings.backgroundGradient, box)
                : undefined,
        backgroundSize: type === "image" ? "cover" : undefined,
        backgroundPosition: type === "image" ? "center" : undefined,
        paddingTop: settings?.isFullHeight ? 0 : (settings?.sectionPadding?.top ?? defaultPadding),
        paddingRight: settings?.isFullWidth ? 0 : (settings?.sectionPadding?.right ?? defaultPadding),
        paddingBottom: settings?.isFullHeight ? 0 : (settings?.sectionPadding?.bottom ?? defaultPadding),
        paddingLeft: settings?.isFullWidth ? 0 : (settings?.sectionPadding?.left ?? defaultPadding),
        // Border of the section, per side
        ...borderCss(settings?.sectionBorder),
        ...fitWidth(settings),
    }

    const inner: CSSProperties = {
        // Vertical alignment of the content, and horizontal (stretch by default so blocks take the width)
        justifyContent: settings?.alignVertical === "middle" ? "center" : settings?.alignVertical === "bottom" ? "flex-end" : "flex-start",
        alignItems: settings?.alignHorizontal === "left" ? "flex-start" : settings?.alignHorizontal === "center" ? "center" : settings?.alignHorizontal === "right" ? "flex-end" : "stretch",
        minHeight: full ? fullHeight(true) : sectionHeight(settings?.height),
    }

    return {
        outer,
        inner,
        /** «Fill»: the section takes the height left on the page */
        fills: settings?.height === "fill",
        /** The content grows to the section's height (full screen or a fixed height) */
        innerGrows: full || (!!settings?.height && settings.height !== "auto" && settings.height !== "fit"),
        measuresGradient: type === "gradient" && settings?.backgroundGradient?.type === "radial",
    }
}
