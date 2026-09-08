"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, ShieldCheck, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBrandDesign } from "./BrandDesignContext"
import { FooterSettingsPanel } from "./FooterSettingsPanel"

interface BrandbookModule {
    id: string
    title: string
    order: number
    type: string
    category?: string
    content_json?: any
}

interface BrandbookFooterProps {
    brandId: string
    brandName?: string
    modules: BrandbookModule[]
    selectedModuleId: string | null
    onSelectModule: (moduleId: string) => void
    isReadOnly?: boolean
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
}

export function BrandbookFooter({
    brandId,
    brandName = "Brand",
    modules = [],
    selectedModuleId,
    onSelectModule,
    isReadOnly = false,
    responsiveDevice = 'widescreen'
}: BrandbookFooterProps) {
    const { footerSettings } = useBrandDesign()
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const footerContainerRef = useRef<HTMLDivElement>(null)

    // Calculate Previous and Next modules
    const sortedModules = [...modules].sort((a, b) => a.order - b.order)
    const currentIndex = sortedModules.findIndex((m) => m.id === selectedModuleId)
    const prevModule = currentIndex > 0 ? sortedModules[currentIndex - 1] : null
    const nextModule = currentIndex >= 0 && currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (footerContainerRef.current && !footerContainerRef.current.contains(e.target as Node)) {
                setIsPanelOpen(false)
            }
        }
        if (isPanelOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isPanelOpen])

    const isVisible = footerSettings.isVisible !== false

    // If invisible in read-only / preview mode, don't render anything
    if (!isVisible && isReadOnly) {
        return null
    }

    // If invisible in edit mode, render a placeholder so user can hover and re-enable
    if (!isVisible && !isReadOnly) {
        return (
            <div
                ref={footerContainerRef}
                className="relative group w-full h-14 bg-black/40 border-t border-dashed border-[#FF0054]/40 flex items-center justify-center text-xs text-[#888] select-none shrink-0 mt-16"
            >
                <span>Footer oculto (visível apenas no modo de edição)</span>

                {/* Edit footer button positioned at top right with 200px right margin */}
                <div className="absolute top-0 right-[200px] -translate-y-full z-30">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsPanelOpen(!isPanelOpen)
                        }}
                        className={cn(
                            "bg-[#FF0054] text-white px-5 h-[28px] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#D90046] rounded-t-[4px] flex items-center shadow-md transition-all cursor-pointer select-none",
                            isPanelOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                    >
                        Edit footer
                    </button>

                    {/* Settings Panel */}
                    {isPanelOpen && (
                        <div className="absolute bottom-[calc(100%+6px)] right-0 z-[200]">
                            <FooterSettingsPanel onClose={() => setIsPanelOpen(false)} />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const showNav = (footerSettings.showPrevious && prevModule) || (footerSettings.showNext && nextModule)
    const showLegal = footerSettings.legalContactFooter === true
    const showBranding = footerSettings.brandingTag !== false

    return (
        <footer
            ref={footerContainerRef}
            className={cn(
                "relative group w-full select-none shrink-0 transition-colors",
                isReadOnly ? "mt-0 border-t-0" : "mt-16 border-t border-black/5 dark:border-white/5"
            )}
            style={{
                paddingTop: `${footerSettings.paddingTop ?? 50}px`,
                paddingBottom: `${footerSettings.paddingBottom ?? 50}px`,
                backgroundColor: footerSettings.backgroundColor || "#ffffff",
                color: footerSettings.textColor || "#000000",
                backgroundImage: footerSettings.backgroundImage ? `url(${footerSettings.backgroundImage})` : undefined,
                backgroundSize: footerSettings.backgroundImage ? "cover" : undefined,
                backgroundPosition: footerSettings.backgroundImage ? "center" : undefined
            }}
        >
            {/* Edit footer button - only in edit mode (not read-only) */}
            {!isReadOnly && (
                <div className="absolute top-0 right-[200px] -translate-y-full z-30">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsPanelOpen(!isPanelOpen)
                        }}
                        className={cn(
                            "bg-[#FF0054] text-white px-5 h-[28px] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#D90046] rounded-t-[4px] flex items-center shadow-lg transition-all cursor-pointer select-none",
                            isPanelOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                    >
                        Edit footer
                    </button>

                    {/* Settings Panel anchored right above the button */}
                    {isPanelOpen && (
                        <div className="absolute bottom-[calc(100%+6px)] right-0 z-[200]">
                            <FooterSettingsPanel onClose={() => setIsPanelOpen(false)} />
                        </div>
                    )}
                </div>
            )}

            {/* Inner Content */}
            <div className={cn(
                "mx-auto px-6 sm:px-12 flex flex-col gap-8 w-full transition-all duration-300",
                responsiveDevice === 'desktop' ? "max-w-[1070px]" : responsiveDevice === 'mobile' ? "max-w-[400px]" : "max-w-[1452px]"
            )}>

                {/* 1. Navigation (Show Previous / Show Next) */}
                {(footerSettings.showPrevious || footerSettings.showNext) && (
                    <div className="flex items-center justify-between gap-4 w-full py-2">
                        {/* Previous Button */}
                        {footerSettings.showPrevious ? (
                            prevModule ? (
                                <button
                                    type="button"
                                    onClick={() => onSelectModule(prevModule.id)}
                                    className="flex items-center gap-2 text-sm font-medium transition-transform hover:-translate-x-1 opacity-80 hover:opacity-100 cursor-pointer"
                                    style={{ color: footerSettings.textColor || "inherit" }}
                                >
                                    <ArrowLeft className="w-4 h-4 shrink-0" />
                                    <span className="truncate max-w-[200px] sm:max-w-[300px]">
                                        {prevModule.title}
                                    </span>
                                </button>
                            ) : (
                                <div className="text-xs opacity-40 flex items-center gap-1.5 cursor-default">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Início</span>
                                </div>
                            )
                        ) : (
                            <div />
                        )}

                        {/* Next Button */}
                        {footerSettings.showNext ? (
                            nextModule ? (
                                <button
                                    type="button"
                                    onClick={() => onSelectModule(nextModule.id)}
                                    className="flex items-center gap-2 text-sm font-medium transition-transform hover:translate-x-1 opacity-80 hover:opacity-100 cursor-pointer ml-auto"
                                    style={{ color: footerSettings.textColor || "inherit" }}
                                >
                                    <span className="truncate max-w-[200px] sm:max-w-[300px]">
                                        {nextModule.title}
                                    </span>
                                    <ArrowRight className="w-4 h-4 shrink-0" />
                                </button>
                            ) : (
                                <div className="text-xs opacity-40 flex items-center gap-1.5 cursor-default ml-auto">
                                    <span>Fim do Brandbook</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            )
                        ) : (
                            <div />
                        )}
                    </div>
                )}

                {/* Divider between navigation and footer metadata if both exist */}
                {(footerSettings.showPrevious || footerSettings.showNext) && (showLegal || showBranding) && (
                    <div
                        className="w-full h-[1px] opacity-15"
                        style={{ backgroundColor: footerSettings.textColor || "#000000" }}
                    />
                )}

                {/* 2. Legal & Contact Footer + Branding Tag */}
                {(showLegal || showBranding) && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                        {/* Legal & Contact info */}
                        {showLegal ? (
                            <div className="flex flex-wrap items-center gap-4 opacity-75">
                                <span>
                                    © {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="opacity-40">•</span>
                                    <span className="hover:underline cursor-pointer">Termos & Privacidade</span>
                                    <span className="opacity-40">•</span>
                                    <span className="hover:underline cursor-pointer">Contato</span>
                                </div>
                            </div>
                        ) : (
                            <div />
                        )}

                        {/* Corebook® / Brivio branding tag */}
                        {showBranding && (
                            <div
                                className="text-[11px] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1.5 ml-auto cursor-default"
                                style={{ color: footerSettings.textColor || "inherit" }}
                            >
                                <span>Powered by Brivio coverage and Bhoo Agency</span>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </footer>
    )
}
