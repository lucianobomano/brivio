"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Search, Loader2, LayoutGrid, Globe, Lock } from "lucide-react"
import { getComponents } from "@/app/actions/components"
import { Block } from "./types"

interface ComponentsLibraryProps {
    isOpen: boolean
    onClose: () => void
    brandId: string
    onSelectComponent: (component: Block) => void
}

export function ComponentsLibrary({ isOpen, onClose, brandId, onSelectComponent }: ComponentsLibraryProps) {
    const [components, setComponents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (isOpen && brandId) {
            loadComponents()
        }
    }, [isOpen, brandId])

    const loadComponents = async () => {
        setIsLoading(true)
        try {
            const result = await getComponents(brandId)
            if (result.success && result.components) {
                setComponents(result.components)
            }
        } catch (error) {
            console.error("Failed to load components:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    const filteredComponents = components.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1A1A20] w-full max-w-[800px] h-[80vh] max-h-[700px] flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1F1F25] shrink-0">
                    <div>
                        <h3 className="text-white font-medium text-[18px]">Biblioteca de Componentes</h3>
                        <p className="text-[#97A1B3] text-[13px] mt-1">Selecione um componente salvo para adicionar ao canvas.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#15161B] text-[#97A1B3] hover:text-white transition-colors border border-white/5"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-6 border-b border-white/5 bg-[#1A1A20] shrink-0">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#97A1B3] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar componentes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#15161B] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-[14px] outline-none focus:border-[#FF0054] transition-colors"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#15161B]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#97A1B3]">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FF0054]" />
                            <p className="text-[14px]">Carregando componentes...</p>
                        </div>
                    ) : filteredComponents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#97A1B3]">
                            <LayoutGrid className="w-12 h-12 opacity-20" />
                            <p className="text-[14px]">Nenhum componente encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredComponents.map((component) => (
                                <div
                                    key={component.id}
                                    onClick={() => {
                                        onSelectComponent(component.content_json)
                                        onClose()
                                    }}
                                    className="bg-[#1A1A20] border border-white/5 rounded-xl p-4 cursor-pointer hover:border-[#FF0054] hover:shadow-[0_0_20px_rgba(255,0,84,0.1)] transition-all group flex flex-col"
                                >
                                    <div className="aspect-[4/3] bg-[#15161B] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-[#111116] transition-colors">
                                        <LayoutGrid className="w-10 h-10 text-[#333] group-hover:text-[#FF0054] transition-colors" />
                                        
                                        {/* Badge Público/Privado */}
                                        <div className="absolute top-2 right-2 bg-[#1A1A20] rounded-full px-2 py-1 flex items-center gap-1.5 border border-white/5">
                                            {component.is_public ? (
                                                <>
                                                    <Globe className="w-3 h-3 text-[#00E5FF]" />
                                                    <span className="text-[9px] font-medium text-[#00E5FF] uppercase tracking-wider">Público</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-3 h-3 text-[#FFB800]" />
                                                    <span className="text-[9px] font-medium text-[#FFB800] uppercase tracking-wider">Privado</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <h4 className="text-white font-medium text-[14px] truncate">{component.name}</h4>
                                    <p className="text-[#97A1B3] text-[11px] mt-1">
                                        Adicionado em {new Date(component.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}
