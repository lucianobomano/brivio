"use client"

import React, { useState } from "react"
import { X, Plus, Type, Image as ImageIcon, Music, Gem } from "lucide-react"
import { addBrandbookPages } from "@/app/actions/brandbook"
import { CATEGORIES } from "@/lib/brandbook-utils"
import { createClient } from "@/lib/supabase/client"
import { GUIDE_INTRO_TEMPLATE, DNA_TEMPLATE, HISTORY_TEMPLATE } from "@/lib/brandbook-templates"

export interface BrandbookModule {
    id: string
    brandbook_id: string
    type: string
    title: string
    order: number
    category: string
    content_json: Record<string, unknown>
    created_at?: string
    updated_at?: string
}

interface AddPagesModalProps {
    isOpen: boolean
    onClose: () => void
    brandName: string
    brandbookId: string
    existingPageTitles: string[]
    onPagesAdded?: (modules: BrandbookModule[]) => void
    filterCategory?: string | null
}

const TEMPLATES = [
    {
        id: 'blank',
        label: 'Blank',
        defaultTitle: 'Sem título',
        type: 'custom',
        defaultCategory: 'all',
        icon: <Plus className="w-8 h-8 text-[#97a1b3] group-hover:text-white transition-colors" strokeWidth={1.5} />
    },
    {
        id: 'guide_intro',
        label: 'Guide intro',
        defaultTitle: 'Visão geral',
        type: 'mission',
        defaultCategory: 'overview',
        icon: (
            <div className="w-12 h-16 border border-[#2d3139] group-hover:border-white/40 rounded flex flex-col items-center justify-center gap-1 bg-[#1a1b21] transition-colors">
                <div className="w-7 h-[2px] bg-[#97a1b3] group-hover:bg-white/60 transition-colors" />
                <div className="w-7 h-[2px] bg-[#97a1b3] group-hover:bg-white/60 transition-colors" />
                <div className="w-7 h-[2px] bg-[#97a1b3] group-hover:bg-white/60 transition-colors" />
                <div className="w-5 h-[2px] bg-[#97a1b3] group-hover:bg-white/60 transition-colors self-start ml-2.5" />
            </div>
        )
    },
    {
        id: 'philosophy',
        label: 'Philosophy',
        defaultTitle: 'DNA da marca',
        type: 'archetype',
        defaultCategory: 'overview',
        icon: (
            <div className="w-12 h-16 border border-[#2d3139] group-hover:border-white/40 rounded flex items-center justify-center bg-[#1a1b21] transition-colors">
                <svg className="w-6 h-6 text-[#97a1b3] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="9" cy="12" r="4" />
                    <circle cx="15" cy="12" r="4" />
                </svg>
            </div>
        )
    },
    {
        id: 'logo',
        label: 'Logo',
        defaultTitle: 'Logo',
        type: 'logo',
        defaultCategory: 'visual_identity',
        icon: (
            <div className="w-12 h-16 border border-[#2d3139] group-hover:border-white/40 rounded flex items-center justify-center bg-[#1a1b21] transition-colors">
                <Gem className="w-6 h-6 text-[#97a1b3] group-hover:text-white transition-colors" strokeWidth={1.5} />
            </div>
        )
    },
    {
        id: 'colors',
        label: 'Colors',
        defaultTitle: 'Cores',
        type: 'palette',
        defaultCategory: 'visual_identity',
        icon: (
            <div className="w-12 h-16 border border-[#2d3139] group-hover:border-white/40 rounded flex items-center justify-center bg-[#1a1b21] transition-colors">
                <div className="w-6 h-6 border border-[#97a1b3] group-hover:border-white/60 relative overflow-hidden rotate-45 transition-colors">
                    <div className="absolute inset-0 bg-[#97a1b3] group-hover:bg-white/60 translate-x-1/2 -translate-y-1/2 transition-colors" />
                </div>
            </div>
        )
    },
    {
        id: 'typography',
        label: 'Typography',
        defaultTitle: 'Tipografia',
        type: 'typography',
        defaultCategory: 'visual_identity',
        icon: (
            <div className="w-12 h-16 border border-[#2d3139] group-hover:border-white/40 rounded flex items-center justify-center bg-[#1a1b21] transition-colors">
                <Type className="w-6 h-6 text-[#97a1b3] group-hover:text-white transition-colors" strokeWidth={1.5} />
            </div>
        )
    },
    {
        id: 'photography',
        label: 'Photography',
        defaultTitle: 'Imagens & Fotografia',
        type: 'photography',
        defaultCategory: 'visual_identity',
        icon: (
            <div className="w-12 h-16 border border-[#2d3139] group-hover:border-white/40 rounded flex items-center justify-center bg-[#1a1b21] transition-colors">
                <ImageIcon className="w-6 h-6 text-[#97a1b3] group-hover:text-white transition-colors" strokeWidth={1.5} />
            </div>
        )
    },
    {
        id: 'sound',
        label: 'Sound',
        defaultTitle: 'Som da marca',
        type: 'custom',
        defaultCategory: 'sensory_identity',
        icon: (
            <div className="w-12 h-16 border border-[#2d3139] group-hover:border-white/40 rounded flex items-center justify-center bg-[#1a1b21] transition-colors">
                <Music className="w-6 h-6 text-[#97a1b3] group-hover:text-white transition-colors" strokeWidth={1.5} />
            </div>
        )
    }
]

export function AddPagesModal({
    isOpen,
    onClose,
    brandName,
    brandbookId,
    existingPageTitles,
    onPagesAdded,
    filterCategory = null
}: AddPagesModalProps) {
    const [customName, setCustomName] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen) return null

    const handleSave = async (template: typeof TEMPLATES[0]) => {
        const finalTitle = customName.trim() || template.defaultTitle

        // Avoid adding duplicate title
        const isDuplicate = existingPageTitles.some(t => t.toLowerCase() === finalTitle.toLowerCase())
        if (isDuplicate) {
            alert("Uma página com este título já existe.")
            return
        }

        setIsSaving(true)
        try {
            const result = await addBrandbookPages(brandbookId, [finalTitle])
            if (result.success && result.modules && result.modules.length > 0) {
                const createdModule = result.modules[0]
                const updates: any = {}

                if (filterCategory) {
                    updates.category = filterCategory
                } else if (template.defaultCategory && template.defaultCategory !== 'all') {
                    updates.category = template.defaultCategory
                }

                if (template.type && template.type !== 'custom') {
                    updates.type = template.type
                    if (template.type === 'mission') {
                        updates.content_json = GUIDE_INTRO_TEMPLATE
                    } else if (template.type === 'archetype') {
                        updates.content_json = DNA_TEMPLATE
                    } else if (template.type === 'history') {
                        updates.content_json = HISTORY_TEMPLATE
                    }
                }

                if (Object.keys(updates).length > 0) {
                    const supabase = createClient()
                    await supabase
                        .from('brandbook_modules')
                        .update(updates)
                        .eq('id', createdModule.id)
                }

                const updatedModule = {
                    ...createdModule,
                    ...updates
                }

                onPagesAdded?.([updatedModule])
                onClose()
            }
        } catch (error) {
            console.error("Error adding page:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 z-[4000]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[4000] flex items-center justify-center pointer-events-none">
                <div
                    className="pointer-events-auto relative flex flex-col overflow-hidden shadow-2xl"
                    style={{
                        width: '722px',
                        height: '492px',
                        backgroundColor: '#15161b',
                        borderRadius: '12px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="h-16 px-6 flex items-center justify-between shrink-0"
                        style={{ backgroundColor: '#ff0054' }}
                    >
                        <h2 className="text-white text-lg font-medium select-none">Add page</h2>
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-white hover:opacity-80 transition-opacity outline-none"
                            title="Close"
                        />
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col p-6 gap-6 min-h-0">
                        {/* Input Name */}
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Enter name"
                                className="w-full bg-transparent text-white placeholder-gray-500 border-b-2 border-blue-500 pb-2 text-base outline-none focus:border-blue-400 transition-colors"
                            />
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-4 gap-4 flex-1 overflow-y-auto min-h-0 pb-2">
                            {TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSave(template)}
                                    disabled={isSaving}
                                    className="h-[130px] border border-[#2d3139] hover:border-[#ff0054] rounded-lg bg-[#1a1b21] flex flex-col items-center justify-center gap-3 p-3 hover:shadow-lg transition-all group outline-none"
                                >
                                    <div className="flex-1 flex items-center justify-center">
                                        {template.icon}
                                    </div>
                                    <span className="text-gray-400 group-hover:text-white text-xs font-semibold tracking-wide select-none">
                                        {template.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
