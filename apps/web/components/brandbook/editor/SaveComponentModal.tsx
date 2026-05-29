"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { X, Loader2 } from "lucide-react"
import { saveComponent } from "@/app/actions/components"
import { Block } from "./types"
import { cn } from "@/lib/utils"

interface SaveComponentModalProps {
    isOpen: boolean
    onClose: () => void
    block: Block | null
    brandId: string
}

export function SaveComponentModal({ isOpen, onClose, block, brandId }: SaveComponentModalProps) {
    const [name, setName] = useState("")
    const [isPublic, setIsPublic] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    if (!isOpen || !block) return null

    const handleSave = async () => {
        if (!name.trim()) {
            alert("Por favor, insira um nome para o componente.")
            return
        }

        setIsLoading(true)
        try {
            const result = await saveComponent({
                name,
                content_json: block,
                is_public: isPublic,
                brand_id: brandId
            })

            if (result.success) {
                alert("Componente salvo com sucesso!")
                setName("")
                setIsPublic(false)
                onClose()
            } else {
                alert("Erro ao salvar o componente.")
            }
        } catch (error) {
            console.error(error)
            alert("Erro inesperado ao salvar componente.")
        } finally {
            setIsLoading(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1A1A20] w-full max-w-[400px] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1F1F25]">
                    <h3 className="text-white font-medium text-[16px]">Salvar como Componente</h3>
                    <button
                        onClick={onClose}
                        className="text-[#97A1B3] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[13px] font-medium text-[#97A1B3]">Nome do Componente</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Hero Section, Feature Grid..."
                            className="w-full bg-[#15161B] border border-white/10 rounded-lg px-4 py-3 text-white text-[14px] outline-none focus:border-[#FF0054] transition-colors"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <label className="text-[13px] font-medium text-white block">Tornar Público</label>
                            <span className="text-[11px] text-[#97A1B3]">Permitir que outros workspaces utilizem este componente.</span>
                        </div>
                        <div
                            className={cn(
                                "w-[44px] h-[24px] rounded-[999px] relative cursor-pointer transition-colors shrink-0",
                                isPublic ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                            )}
                            onClick={() => setIsPublic(!isPublic)}
                        >
                            <div className={cn(
                                "w-[20px] h-[20px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                isPublic ? "right-[2px]" : "left-[2px]"
                            )} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5 bg-[#1F1F25]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-[14px] font-medium text-[#97A1B3] hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-[#FF0054] hover:bg-[#D90046] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar Componente
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
