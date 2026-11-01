"use client"

import React, { useState, useEffect } from "react"
import { Globe, FileText, Hash, ExternalLink, Trash2, Check, X, ArrowUpRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useBrandDesign } from "./BrandDesignContext"
import { BlockLink, LinkType } from "./types"
import { EDITOR_COLLISION_PADDING } from "./editorLayout"

interface LinkSettingsPopoverProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    link?: BlockLink | null
    onSaveLink: (link: BlockLink | null) => void
    trigger?: React.ReactNode
}

export function LinkSettingsPopover({
    isOpen,
    onOpenChange,
    link,
    onSaveLink,
    trigger
}: LinkSettingsPopoverProps) {
    const { modules = [], sections = [], onSelectModule } = useBrandDesign()

    const [linkType, setLinkType] = useState<LinkType>(link?.type || 'url')
    const [url, setUrl] = useState(link?.url || '')
    const [target, setTarget] = useState<'_blank' | '_self'>(link?.target || '_blank')
    const [selectedModuleId, setSelectedModuleId] = useState(link?.moduleId || (modules[0]?.id || ''))
    const [selectedSectionId, setSelectedSectionId] = useState(link?.sectionId || (sections[0]?.id || ''))

    // Sync state when opened
    useEffect(() => {
        if (isOpen) {
            setLinkType(link?.type || 'url')
            setUrl(link?.url || '')
            setTarget(link?.target || '_blank')
            setSelectedModuleId(link?.moduleId || (modules[0]?.id || ''))
            setSelectedSectionId(link?.sectionId || (sections[0]?.id || ''))
        }
    }, [isOpen, link, modules, sections])

    const handleSave = () => {
        if (linkType === 'url') {
            if (!url.trim()) {
                onSaveLink(null)
            } else {
                let formatted = url.trim()
                if (!/^https?:\/\//i.test(formatted) && !formatted.startsWith('/') && !formatted.startsWith('#') && !formatted.startsWith('mailto:')) {
                    formatted = 'https://' + formatted
                }
                onSaveLink({
                    type: 'url',
                    url: formatted,
                    target
                })
            }
        } else if (linkType === 'internal') {
            const targetMod = modules.find(m => m.id === selectedModuleId)
            if (!selectedModuleId) {
                onSaveLink(null)
            } else {
                onSaveLink({
                    type: 'internal',
                    moduleId: selectedModuleId,
                    moduleTitle: targetMod?.title || 'Página'
                })
            }
        } else if (linkType === 'section') {
            const targetSec = sections.find(s => s.id === selectedSectionId)
            if (!selectedSectionId) {
                onSaveLink(null)
            } else {
                onSaveLink({
                    type: 'section',
                    sectionId: selectedSectionId,
                    sectionTitle: targetSec?.title || 'Seção'
                })
            }
        }
        onOpenChange(false)
    }

    const handleRemove = () => {
        onSaveLink(null)
        onOpenChange(false)
    }

    const handleTest = () => {
        if (linkType === 'url') {
            if (!url.trim()) return
            let formatted = url.trim()
            if (!/^https?:\/\//i.test(formatted) && !formatted.startsWith('/')) {
                formatted = 'https://' + formatted
            }
            window.open(formatted, target, 'noopener,noreferrer')
        } else if (linkType === 'internal') {
            if (selectedModuleId && onSelectModule) {
                onSelectModule(selectedModuleId)
            }
        } else if (linkType === 'section') {
            if (selectedSectionId) {
                const targetEl = document.getElementById(`section-${selectedSectionId}`) || document.getElementById(selectedSectionId)
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }
        }
    }

    const hasActiveLink = Boolean(link?.url || link?.moduleId || link?.sectionId)

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
            <PopoverContent
                align="center"
                collisionPadding={EDITOR_COLLISION_PADDING}
                side="top"
                sideOffset={14}
                className="w-[330px] bg-[#15161B] border border-[#2A2B35] rounded-xl p-0 text-white shadow-2xl z-[2100] outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2B35] bg-[#1A1B23]">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#FF0054]/15 flex items-center justify-center text-[#FF0054]">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                            Configurar Link
                        </span>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
                        title="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs for Link Types */}
                <div className="p-3 border-b border-[#2A2B35] bg-[#121318]">
                    <div className="grid grid-cols-3 gap-1 bg-[#1A1B23] p-1 rounded-lg border border-[#2A2B35]">
                        <button
                            type="button"
                            onClick={() => setLinkType('url')}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                                linkType === 'url'
                                    ? "bg-[#FF0054] text-white shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>URL</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setLinkType('internal')}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                                linkType === 'internal'
                                    ? "bg-[#FF0054] text-white shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Página</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setLinkType('section')}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                                linkType === 'section'
                                    ? "bg-[#FF0054] text-white shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Hash className="w-3.5 h-3.5" />
                            <span>Seção</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 space-y-4">
                    {/* 1. URL TAB */}
                    {linkType === 'url' && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Endereço Web (URL)
                                </label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        placeholder="https://exemplo.com"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleSave()
                                            }
                                        }}
                                        className="w-full bg-[#1A1B23] border border-[#2A2B35] focus:border-[#FF0054] rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-1 group">
                                <input
                                    type="checkbox"
                                    checked={target === '_blank'}
                                    onChange={(e) => setTarget(e.target.checked ? '_blank' : '_self')}
                                    className="w-4 h-4 rounded border-[#333] bg-[#1A1B23] text-[#FF0054] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#FF0054]"
                                />
                                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                                    Abrir em nova aba (_blank)
                                </span>
                            </label>
                        </div>
                    )}

                    {/* 2. INTERNAL PAGE TAB */}
                    {linkType === 'internal' && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Selecionar Página do Brandbook
                            </label>
                            {modules.length === 0 ? (
                                <p className="text-xs text-gray-500 italic py-2">
                                    Nenhuma página disponível no momento.
                                </p>
                            ) : (
                                <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                    {modules.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setSelectedModuleId(m.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors",
                                                selectedModuleId === m.id
                                                    ? "bg-[#FF0054] text-white font-medium shadow-sm"
                                                    : "bg-[#1A1B23] text-gray-300 hover:text-white hover:bg-[#252632]"
                                            )}
                                        >
                                            <span className="truncate">{m.title}</span>
                                            {selectedModuleId === m.id && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. SECTION TAB */}
                    {linkType === 'section' && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Rolar até a Seção da Página
                            </label>
                            {sections.length === 0 ? (
                                <p className="text-xs text-gray-500 italic py-2">
                                    Nenhuma seção encontrada nesta página.
                                </p>
                            ) : (
                                <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                    {sections.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setSelectedSectionId(s.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors",
                                                selectedSectionId === s.id
                                                    ? "bg-[#FF0054] text-white font-medium shadow-sm"
                                                    : "bg-[#1A1B23] text-gray-300 hover:text-white hover:bg-[#252632]"
                                            )}
                                        >
                                            <span className="truncate">{s.title}</span>
                                            {selectedSectionId === s.id && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#1A1B23] border-t border-[#2A2B35]">
                    <div className="flex items-center gap-1.5">
                        {hasActiveLink && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                                title="Remover link existente"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Remover</span>
                            </button>
                        )}
                        {(url || selectedModuleId || selectedSectionId) && (
                            <button
                                type="button"
                                onClick={handleTest}
                                className="text-gray-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                                title="Testar link agora"
                            >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Testar</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="bg-[#FF0054] hover:bg-[#D90046] text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
