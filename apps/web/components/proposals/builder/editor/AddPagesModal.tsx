"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"
import { addProposalPages } from "@/app/actions/proposal-builder"

// All available pages for the proposal
const ALL_PAGES = [
    "Introdução",
    "Sobre a Brivio",
    "Metodologia",
    "Escopo do Projeto",
    "Cronograma Estimado",
    "Investimento",
    "Condições de Pagamento",
    "Case de Sucesso",
    "Depoimentos",
    "Próximos Passos",
    "Termos e Condições"
]

interface AddPagesModalProps {
    isOpen: boolean
    onClose: () => void
    proposalIdentifier: string
    proposalId: string
    existingPageTitles: string[]
    onPagesAdded?: (modules: any[]) => void
}

export function AddPagesModal({
    isOpen,
    onClose,
    proposalIdentifier,
    proposalId,
    existingPageTitles,
    onPagesAdded
}: AddPagesModalProps) {
    const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
    const [isSaving, setIsSaving] = useState(false)

    // Initialize selected pages with existing ones
    useEffect(() => {
        if (isOpen) {
            const existing = new Set(existingPageTitles.map(t => t.toLowerCase()))
            const preSelected = new Set<string>()
            ALL_PAGES.forEach(page => {
                if (existing.has(page.toLowerCase())) {
                    preSelected.add(page)
                }
            })
            setSelectedPages(preSelected)
        }
    }, [isOpen, existingPageTitles])

    if (!isOpen) return null

    const isPageExisting = (page: string) => {
        return existingPageTitles.some(t => t.toLowerCase() === page.toLowerCase())
    }

    const togglePage = (page: string) => {
        // Don't allow deselecting existing pages
        if (isPageExisting(page)) return

        setSelectedPages(prev => {
            const newSet = new Set(prev)
            if (newSet.has(page)) {
                newSet.delete(page)
            } else {
                newSet.add(page)
            }
            return newSet
        })
    }

    const handleSave = async () => {
        // Get newly selected pages (not existing ones)
        const newPages = Array.from(selectedPages).filter(page => !isPageExisting(page))

        if (newPages.length === 0) {
            onClose()
            return
        }

        setIsSaving(true)
        try {
            const result = await addProposalPages(proposalId, newPages)
            if (result.success && result.modules) {
                onPagesAdded?.(result.modules)
                onClose()
            } else {
                console.error("Failed to add pages:", result.error)
            }
        } catch (error) {
            console.error("Error adding pages:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 z-[200]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                <div
                    className="pointer-events-auto relative flex flex-col"
                    style={{
                        maxWidth: '1260px',
                        width: '95%',
                        height: '1000px',
                        maxHeight: '95vh',
                        backgroundColor: '#0E0F14',
                        borderRadius: '16px',
                        padding: '113px 240px',
                        gap: '120px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Header */}
                    <div>
                        <h2
                            className="text-2xl font-light"
                            style={{ color: '#97A1B3' }}
                        >
                            Add new pages to <span className="text-white">[{proposalIdentifier}]</span>
                        </h2>
                    </div>

                    {/* Pages Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-wrap gap-3 justify-center">
                            {ALL_PAGES.map(page => {
                                const isSelected = selectedPages.has(page)
                                const isExisting = isPageExisting(page)
                                const isActive = isSelected || isExisting

                                return (
                                    <button
                                        key={page}
                                        onClick={() => togglePage(page)}
                                        className="transition-all duration-200"
                                        style={{
                                            height: '50px',
                                            padding: '0 20px',
                                            borderRadius: '25px',
                                            border: '2px solid #ff0054',
                                            backgroundColor: isActive ? '#ff0054' : 'transparent',
                                            color: isActive ? '#ffffff' : '#97A1B3',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            cursor: isExisting ? 'default' : 'pointer',
                                            opacity: isExisting ? 0.8 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive && !isExisting) {
                                                e.currentTarget.style.backgroundColor = '#ff0054'
                                                e.currentTarget.style.color = '#ffffff'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive && !isExisting) {
                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                e.currentTarget.style.color = '#97A1B3'
                                            }
                                        }}
                                    >
                                        {page}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 text-sm font-medium transition-colors"
                            style={{ color: '#97A1B3' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 text-sm font-medium rounded-lg transition-all"
                            style={{
                                backgroundColor: '#ff0054',
                                color: '#ffffff',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
