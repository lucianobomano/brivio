"use client"

import React, { useState } from "react"
import { X, Save, Loader2, Globe, Lock } from "lucide-react"
import { saveBrandbookAsTemplate } from "@/app/actions/brandbook-templates"
import { BrandbookModule } from "./AddPagesModal"

interface SaveAsTemplateModalProps {
    isOpen: boolean
    onClose: () => void
    modules: BrandbookModule[]
    brandId: string
    brandName?: string
}

const TEMPLATE_CATEGORIES = [
    { value: 'custom', label: 'Personalizado' },
    { value: 'agency', label: 'Agência' },
    { value: 'corporate', label: 'Corporativo' },
    { value: 'startup', label: 'Startup' },
    { value: 'creative', label: 'Criativo' },
    { value: 'minimal', label: 'Minimalista' },
]

export function SaveAsTemplateModal({ isOpen, onClose, modules, brandId, brandName }: SaveAsTemplateModalProps) {
    const [name, setName] = useState(brandName ? `${brandName} Template` : '')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('custom')
    const [isPublic, setIsPublic] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSave = async () => {
        if (!name.trim()) {
            setError('O nome do template é obrigatório')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const result = await saveBrandbookAsTemplate({
                name: name.trim(),
                description: description.trim() || undefined,
                category,
                modulesJson: modules,
                isPublic,
                brandId,
            })

            if (result.success) {
                // Success! Close modal
                onClose()
                // Reset form
                setName('')
                setDescription('')
                setCategory('custom')
                setIsPublic(false)
            } else {
                setError(result.error || 'Erro ao salvar template')
            }
        } catch (err) {
            setError('Erro inesperado. Tente novamente.')
            console.error('Save template error:', err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#111116] border border-[#222] rounded-2xl w-[500px] max-w-[95vw] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="h-[60px] bg-gradient-to-r from-[#FF0054] to-[#FF3377] px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Save className="w-5 h-5 text-white" />
                        <span className="text-white font-bold text-lg">Salvar como Template</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Template Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            Nome do Template <span className="text-[#FF0054]">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Brand Guidelines Template"
                            className="w-full h-11 bg-[#0A0A0D] border border-[#333] rounded-lg px-4 text-white placeholder:text-[#555] focus:border-[#FF0054] focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva brevemente o template..."
                            rows={3}
                            className="w-full bg-[#0A0A0D] border border-[#333] rounded-lg px-4 py-3 text-white placeholder:text-[#555] focus:border-[#FF0054] focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            Categoria
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full h-11 bg-[#0A0A0D] border border-[#333] rounded-lg px-4 text-white focus:border-[#FF0054] focus:outline-none transition-colors cursor-pointer"
                        >
                            {TEMPLATE_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center justify-between p-4 bg-[#0A0A0D] border border-[#333] rounded-lg">
                        <div className="flex items-center gap-3">
                            {isPublic ? (
                                <Globe className="w-5 h-5 text-[#00FF94]" />
                            ) : (
                                <Lock className="w-5 h-5 text-[#888]" />
                            )}
                            <div>
                                <p className="text-white font-medium text-sm">
                                    {isPublic ? 'Template Público' : 'Template Privado'}
                                </p>
                                <p className="text-[#666] text-xs">
                                    {isPublic
                                        ? 'Outros utilizadores poderão ver e usar este template'
                                        : 'Apenas você poderá ver e usar este template'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPublic(!isPublic)}
                            className={`w-12 h-7 rounded-full relative transition-colors ${isPublic ? 'bg-[#00FF94]' : 'bg-[#333]'
                                }`}
                        >
                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${isPublic ? 'left-6' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* Module Count Info */}
                    <div className="bg-[#0A0A0D] border border-[#333] rounded-lg p-4">
                        <p className="text-[#888] text-sm">
                            Este template incluirá <span className="text-white font-medium">{modules.length} módulo(s)</span>
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#0A0A0D] border-t border-[#222] flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="h-10 px-5 rounded-lg border border-[#333] text-white hover:bg-[#222] transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="h-10 px-6 rounded-lg bg-[#FF0054] hover:bg-[#D90048] text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar Template
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
