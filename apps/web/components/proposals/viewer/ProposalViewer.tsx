"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { BlockRenderer } from "../builder/editor/blocks/BlockRenderer"
import { BrandDesignProvider, useBrandDesign } from "../builder/editor/BrandDesignContext"
import { pageBackground, pageTextColor } from "../pageBackground"
import { FillLayer } from "@/components/brandbook/editor/backgroundFill"
import { printPageRules, resolvePage } from "../pageFormats"
import { sectionStyles } from "../sectionStyle"
import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion"

// Page effects chosen in the editor (page toolbar): how the page enters, and how its sections enter
const TRANSITION_FROM: Record<string, TargetAndTransition> = {
    fade: { opacity: 0 },
    "slide-up": { opacity: 0, y: 80 },
    "slide-left": { opacity: 0, x: 140 },
    zoom: { opacity: 0, scale: 0.92 },
}
const ANIMATION_FROM: Record<string, TargetAndTransition> = {
    fade: { opacity: 0 },
    rise: { opacity: 0, y: 32 },
    zoom: { opacity: 0, scale: 0.94 },
}
const SHOWN: TargetAndTransition = { opacity: 1, x: 0, y: 0, scale: 1 }

/** The page as it enters the screen (once), unless the visitor asked for reduced motion */
function PageEnter({ effect, className, style, children }: { effect?: string, className?: string, style?: React.CSSProperties, children: React.ReactNode }) {
    const reduce = useReducedMotion()
    const from = effect && !reduce ? TRANSITION_FROM[effect] : undefined
    if (!from) return <div className={className} style={style}>{children}</div>
    return (
        <motion.div className={cn("proposal-anim", className)} style={style} initial={from} whileInView={SHOWN} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    )
}

/** A section entering after the previous one */
function SectionEnter({ effect, index, children }: { effect?: string, index: number, children: React.ReactNode }) {
    const reduce = useReducedMotion()
    const from = effect && !reduce ? ANIMATION_FROM[effect] : undefined
    if (!from) return <>{children}</>
    return (
        <motion.div className="proposal-anim" initial={from} whileInView={SHOWN} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: Math.min(index, 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}>
            {children}
        </motion.div>
    )
}

/** Width of the window, to zoom sheets wider than the screen (a phone opening an A4) */
function useViewportWidth() {
    const [w, setW] = React.useState(1440)
    React.useEffect(() => {
        const on = () => setW(window.innerWidth)
        on()
        window.addEventListener("resize", on)
        return () => window.removeEventListener("resize", on)
    }, [])
    return w
}

// Printing: every sheet on its own sheet of paper at its real size, no zoom, gaps or shadows
const PRINT_CSS = `
@media print {
  .proposal-sheet-row { padding: 0 !important; background: none !important; display: block !important; }
  .proposal-sheet { zoom: 1 !important; box-shadow: none !important; break-after: page; }
  .proposal-sheet-row:last-child .proposal-sheet { break-after: auto; }
  .proposal-pages { padding-bottom: 0 !important; }
  .proposal-footer { display: none !important; }
  .proposal-anim { opacity: 1 !important; transform: none !important; }
  /* Toasts, dev badges and other floating layers would print on a blank page of their own */
  body > *:not(:has(.proposal-pages)) { display: none !important; }
}`

interface ProposalViewerProps {
    modules: any[]
    proposalId: string
    brandId: string
}

export function ProposalViewer({ modules, proposalId, brandId }: ProposalViewerProps) {
    // Filter out hidden modules and the settings module
    const visibleModules = modules
        .filter(m => !m.is_hidden && m.type !== 'settings')
        .sort((a, b) => (a.order || 0) - (b.order || 0))

    return (
        <BrandDesignProvider brandId={brandId} proposalId={proposalId} initialModules={modules}>
            <ViewerContent modules={visibleModules} />
        </BrandDesignProvider>
    )
}

function ViewerContent({ modules }: { modules: any[] }) {
    const { settings } = useBrandDesign()
    const viewport = useViewportWidth()
    const printRules = React.useMemo(() => printPageRules(modules.map(m => m.content_json?.page)), [modules])

    return (
        <div
            className="min-h-screen print:min-h-0 w-full transition-colors duration-500"
            style={{ backgroundColor: settings?.main_project_bg }}
        >
            <style>{printRules + PRINT_CSS}</style>
            <div className="proposal-pages pb-32">
                {modules.map((module, i) => (
                    <ModuleSection key={module.id} module={module} viewport={viewport} index={i} />
                ))}
            </div>

            {/* Minimalist Footer */}
            <div className="proposal-footer py-12 border-t border-black/5 flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF94] via-[#0000FF] to-[#FF0054]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium">
                    Powered by Brivio°
                </span>
            </div>
        </div>
    )
}

function ModuleSection({ module, viewport, index }: { module: any, viewport: number, index: number }) {
    const blocks = module.content_json?.blocks || []
    const page = resolvePage(module.content_json?.page)

    // A page with a format (A4, 16:9…) is a sheet of that size, like in the editor
    if (page.height != null) {
        const zoom = Math.max(0.1, Math.min(1, (viewport - 32) / page.width))
        return (
            <div className="proposal-sheet-row w-full flex justify-center py-1.5 bg-[#ececef]" style={{ page: page.printName || undefined } as React.CSSProperties}>
                <PageEnter
                    effect={module.content_json?.page?.transition}
                    className="proposal-sheet shrink-0 relative overflow-hidden flex flex-col"
                    style={{ width: page.width, height: page.height, zoom, page: page.printName || undefined, ...(pageBackground(module.content_json?.style) || { backgroundColor: "#ffffff" }) } as React.CSSProperties}
                >
                    <FillLayer fill={module.content_json?.style?.fill} />
                    <div className="relative flex-1 flex flex-col min-h-0">
                    {blocks.map((block: any, i: number) => (
                        <SectionEnter key={block.id} effect={module.content_json?.page?.animation} index={i}>
                            <SectionWrapper settings={block.content?.settings} color={pageTextColor(module.content_json?.style)} defaultPadding={40} pageHeight={page.height}>
                                <BlockRenderer block={block} isReadOnly={true} onUpdate={() => { }} />
                            </SectionWrapper>
                        </SectionEnter>
                    ))}
                    </div>
                </PageEnter>
            </div>
        )
    }

    // Web page: full width with its own background; the content keeps the 1200px column
    return (
        <PageEnter effect={module.content_json?.page?.transition} className={cn("w-full relative", index > 0 && "border-t border-black/[0.12] print:border-0")} style={pageBackground(module.content_json?.style)}>
            <FillLayer fill={module.content_json?.style?.fill} />
            <div className="relative max-w-[1200px] mx-auto">
            {blocks.map((block: any, i: number) => (
                <SectionEnter key={block.id} effect={module.content_json?.page?.animation} index={i}>
                    <SectionWrapper settings={block.content?.settings} color={pageTextColor(module.content_json?.style)}>
                        <BlockRenderer
                            block={block}
                            isReadOnly={true}
                            onUpdate={() => { }}
                        />
                    </SectionWrapper>
                </SectionEnter>
            ))}
            </div>
        </PageEnter>
    )
}

/** A section as the editor draws it (settings from the section panel) */
function SectionWrapper({ children, settings, color, defaultPadding = 60, pageHeight }: { children: React.ReactNode, settings?: any, color?: string, defaultPadding?: number, pageHeight?: number | null }) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [box, setBox] = React.useState<{ width: number, height: number }>()
    const look = sectionStyles(settings, { isReadOnly: true, defaultPadding, box, pageHeight })
    React.useEffect(() => {
        const el = ref.current
        if (!el || !look.measuresGradient) return
        const ro = new ResizeObserver(() => setBox({ width: el.clientWidth, height: el.clientHeight }))
        ro.observe(el)
        return () => ro.disconnect()
    }, [look.measuresGradient])
    return (
        <div ref={ref} className={cn("w-full relative", look.fills && "flex-1 flex flex-col")} style={look.outer}>
            <div className={cn("prose max-w-none text-gray-600 flex flex-col w-full min-h-0", look.innerGrows && "flex-1")} style={{ ...look.inner, ...(color ? { color } : {}) }}>
                {children}
            </div>
        </div>
    )
}
