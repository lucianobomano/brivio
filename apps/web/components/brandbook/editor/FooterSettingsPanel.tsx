"use client"

import React, { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Upload, Trash2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBrandDesign, FooterSettings } from "./BrandDesignContext"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"

interface FooterSettingsPanelProps {
    onClose: () => void
    className?: string
}

// Custom Toggle Switch matching the exact visual style in the user's image
function PinkToggleSwitch({
    checked,
    onChange,
    disabled = false
}: {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation()
                if (!disabled) onChange(!checked)
            }}
            className={cn(
                "relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none",
                checked ? "bg-[#FF0054]" : "bg-[#2A2B33]",
                disabled && "opacity-40 cursor-not-allowed"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full shadow-md transition duration-200 ease-in-out",
                    checked
                        ? "translate-x-[21px] bg-[#E2E8F0]"
                        : "translate-x-[2px] bg-[#94A3B8]"
                )}
            />
        </button>
    )
}

export function FooterSettingsPanel({ onClose, className }: FooterSettingsPanelProps) {
    const { brandId, footerSettings, updateFooterSettings, settings } = useBrandDesign()

    // Popover states
    const [isBgColorOpen, setIsBgColorOpen] = useState(false)
    const [isTextColorOpen, setIsTextColorOpen] = useState(false)
    const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Local inputs for padding
    const [topPaddingInput, setTopPaddingInput] = useState(String(footerSettings.paddingTop ?? 50))
    const [bottomPaddingInput, setBottomPaddingInput] = useState(String(footerSettings.paddingBottom ?? 50))

    const fileInputRef = useRef<HTMLInputElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Sync input values when context changes
    useEffect(() => {
        setTopPaddingInput(String(footerSettings.paddingTop ?? 50))
        setBottomPaddingInput(String(footerSettings.paddingBottom ?? 50))
    }, [footerSettings.paddingTop, footerSettings.paddingBottom])

    // Presets definitions
    const presets = [
        { id: 'uniform-50', top: 50, bottom: 50 },
        { id: 'compact-20', top: 20, bottom: 20 },
        { id: 'top-only', top: 50, bottom: 0 },
        { id: 'bottom-only', top: 0, bottom: 50 }
    ]

    const handleApplyPreset = (top: number, bottom: number) => {
        setTopPaddingInput(String(top))
        setBottomPaddingInput(String(bottom))
        updateFooterSettings({
            paddingTop: top,
            paddingBottom: bottom
        })
    }

    const handlePaddingChange = (type: 'top' | 'bottom', val: string) => {
        if (type === 'top') {
            setTopPaddingInput(val)
            const num = parseInt(val, 10)
            if (!isNaN(num) && num >= 0) {
                updateFooterSettings({ paddingTop: num })
            }
        } else {
            setBottomPaddingInput(val)
            const num = parseInt(val, 10)
            if (!isNaN(num) && num >= 0) {
                updateFooterSettings({ paddingBottom: num })
            }
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (brandId) formData.append('brandId', brandId)

            const res = await uploadBrandbookMedia(formData)
            if (res.success && res.url) {
                updateFooterSettings({ backgroundImage: res.url })
                setIsUploadMenuOpen(false)
            } else {
                console.error("Failed to upload background image:", res.error)
            }
        } catch (err) {
            console.error("Error uploading footer background:", err)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleRemoveBackground = () => {
        updateFooterSettings({ backgroundImage: null })
        setIsUploadMenuOpen(false)
    }

    // Curated color swatches
    const colorSwatches = [
        '#FFFFFF',
        '#000000',
        '#111827',
        '#1F2937',
        '#374151',
        '#4B5563',
        '#9CA3AF',
        '#F3F4F6',
        '#FF0054',
        ...(settings.color_palette || [])
    ].filter((v, i, a) => a.indexOf(v) === i)

    return (
        <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "w-[290px] bg-[#15161B] rounded-[10px] overflow-hidden shadow-2xl flex flex-col text-[#D1D5DB] font-sans text-[13px] border border-[#2A2B33] select-none z-[200]",
                className
            )}
        >
            {/* Header: Neon Pink Bar with Title and Close Dot */}
            <div className="h-[46px] bg-[#FF0054] px-4 flex items-center justify-between shrink-0">
                <span className="font-bold text-[15px] text-white tracking-wide">Footer</span>
                <button
                    onClick={onClose}
                    className="w-3.5 h-3.5 bg-[#111111] hover:bg-black/70 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    title="Fechar"
                />
            </div>

            {/* Panel Body */}
            <div className="p-4 flex flex-col gap-4 max-h-[580px] overflow-y-auto custom-scrollbar">

                {/* 1. Row padding */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[#A1A1AA] font-normal">Row padding</span>
                        {/* Top / Divider / Bottom inputs */}
                        <div className="flex flex-col items-center justify-center w-[36px]">
                            <input
                                type="text"
                                value={topPaddingInput}
                                onChange={(e) => handlePaddingChange('top', e.target.value)}
                                className="w-full text-center bg-transparent text-[12px] font-medium text-white focus:text-[#FF0054] focus:outline-none transition-colors"
                            />
                            <div className="w-full h-[1px] bg-[#FF0054] my-0.5 opacity-80" />
                            <input
                                type="text"
                                value={bottomPaddingInput}
                                onChange={(e) => handlePaddingChange('bottom', e.target.value)}
                                className="w-full text-center bg-transparent text-[12px] font-medium text-white focus:text-[#FF0054] focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                        {/* Preset 1: 50 / 50 (Selected visual with top and bottom pink lines) */}
                        <button
                            type="button"
                            onClick={() => handleApplyPreset(50, 50)}
                            className={cn(
                                "h-[34px] bg-[#1E2026] hover:bg-[#252830] rounded flex flex-col items-center justify-between p-1 transition-all border",
                                footerSettings.paddingTop === 50 && footerSettings.paddingBottom === 50
                                    ? "border-[#FF0054]"
                                    : "border-transparent"
                            )}
                            title="Padding 50px / 50px"
                        >
                            <div className={cn("w-full h-[2px] rounded-full", footerSettings.paddingTop === 50 && footerSettings.paddingBottom === 50 ? "bg-[#FF0054]" : "bg-[#3E404D]")} />
                            <div className="w-full h-[12px] bg-[#2A2B33] rounded-[2px]" />
                            <div className={cn("w-full h-[2px] rounded-full", footerSettings.paddingTop === 50 && footerSettings.paddingBottom === 50 ? "bg-[#FF0054]" : "bg-[#3E404D]")} />
                        </button>

                        {/* Preset 2: 20 / 20 (Solid / compact) */}
                        <button
                            type="button"
                            onClick={() => handleApplyPreset(20, 20)}
                            className={cn(
                                "h-[34px] bg-[#1E2026] hover:bg-[#252830] rounded flex items-center justify-center p-1.5 transition-all border",
                                footerSettings.paddingTop === 20 && footerSettings.paddingBottom === 20
                                    ? "border-[#FF0054]"
                                    : "border-transparent"
                            )}
                            title="Padding Compacto (20px)"
                        >
                            <div className="w-full h-[20px] bg-[#2A2B33] rounded-[2px]" />
                        </button>

                        {/* Preset 3: Top 50 / Bottom 0 */}
                        <button
                            type="button"
                            onClick={() => handleApplyPreset(50, 0)}
                            className={cn(
                                "h-[34px] bg-[#1E2026] hover:bg-[#252830] rounded flex flex-col justify-end p-1.5 transition-all border",
                                footerSettings.paddingTop === 50 && footerSettings.paddingBottom === 0
                                    ? "border-[#FF0054]"
                                    : "border-transparent"
                            )}
                            title="Padding Superior (50px / 0px)"
                        >
                            <div className="w-full h-[14px] bg-[#2A2B33] rounded-[2px]" />
                        </button>

                        {/* Preset 4: Top 0 / Bottom 50 */}
                        <button
                            type="button"
                            onClick={() => handleApplyPreset(0, 50)}
                            className={cn(
                                "h-[34px] bg-[#1E2026] hover:bg-[#252830] rounded flex flex-col justify-start p-1.5 transition-all border",
                                footerSettings.paddingTop === 0 && footerSettings.paddingBottom === 50
                                    ? "border-[#FF0054]"
                                    : "border-transparent"
                            )}
                            title="Padding Inferior (0px / 50px)"
                        >
                            <div className="w-full h-[14px] bg-[#2A2B33] rounded-[2px]" />
                        </button>
                    </div>
                </div>

                {/* 2. Background color */}
                <div className="flex items-center justify-between relative">
                    <span className="text-[#A1A1AA]">Background color</span>
                    <button
                        type="button"
                        onClick={() => {
                            setIsBgColorOpen(!isBgColorOpen)
                            setIsTextColorOpen(false)
                            setIsUploadMenuOpen(false)
                        }}
                        className="w-7 h-7 rounded-full border-2 border-white/20 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                        style={{ backgroundColor: footerSettings.backgroundColor || '#ffffff' }}
                        title="Escolher cor de fundo"
                    />

                    {/* Background Color Popover */}
                    {isBgColorOpen && (
                        <div className="absolute right-0 top-9 bg-[#1E2026] border border-[#2E313D] rounded-lg p-3 shadow-2xl z-50 w-[220px] flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-[#888] uppercase">Cor de fundo</span>
                                <button
                                    onClick={() => setIsBgColorOpen(false)}
                                    className="text-[#888] hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={footerSettings.backgroundColor || '#ffffff'}
                                    onChange={(e) => updateFooterSettings({ backgroundColor: e.target.value })}
                                    className="w-7 h-7 rounded border border-white/10 cursor-pointer p-0 bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={footerSettings.backgroundColor || '#ffffff'}
                                    onChange={(e) => updateFooterSettings({ backgroundColor: e.target.value })}
                                    className="flex-1 bg-[#15161B] border border-[#333] text-white text-[11px] px-2 py-1 rounded uppercase focus:border-[#FF0054] outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-5 gap-1.5 pt-1">
                                {colorSwatches.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => updateFooterSettings({ backgroundColor: color })}
                                        className={cn(
                                            "w-6 h-6 rounded-full border border-white/15 flex items-center justify-center transition-transform hover:scale-110",
                                            footerSettings.backgroundColor?.toLowerCase() === color.toLowerCase() && "ring-2 ring-[#FF0054]"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {footerSettings.backgroundColor?.toLowerCase() === color.toLowerCase() && (
                                            <Check className={cn("w-3 h-3", color.toLowerCase() === '#ffffff' ? "text-black" : "text-white")} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Text color */}
                <div className="flex items-center justify-between relative">
                    <span className="text-[#A1A1AA]">Text color</span>
                    <button
                        type="button"
                        onClick={() => {
                            setIsTextColorOpen(!isTextColorOpen)
                            setIsBgColorOpen(false)
                            setIsUploadMenuOpen(false)
                        }}
                        className="w-7 h-7 rounded-full border-2 border-white/20 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                        style={{ backgroundColor: footerSettings.textColor || '#000000' }}
                        title="Escolher cor do texto"
                    />

                    {/* Text Color Popover */}
                    {isTextColorOpen && (
                        <div className="absolute right-0 top-9 bg-[#1E2026] border border-[#2E313D] rounded-lg p-3 shadow-2xl z-50 w-[220px] flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-[#888] uppercase">Cor do texto</span>
                                <button
                                    onClick={() => setIsTextColorOpen(false)}
                                    className="text-[#888] hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={footerSettings.textColor || '#000000'}
                                    onChange={(e) => updateFooterSettings({ textColor: e.target.value })}
                                    className="w-7 h-7 rounded border border-white/10 cursor-pointer p-0 bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={footerSettings.textColor || '#000000'}
                                    onChange={(e) => updateFooterSettings({ textColor: e.target.value })}
                                    className="flex-1 bg-[#15161B] border border-[#333] text-white text-[11px] px-2 py-1 rounded uppercase focus:border-[#FF0054] outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-5 gap-1.5 pt-1">
                                {colorSwatches.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => updateFooterSettings({ textColor: color })}
                                        className={cn(
                                            "w-6 h-6 rounded-full border border-white/15 flex items-center justify-center transition-transform hover:scale-110",
                                            footerSettings.textColor?.toLowerCase() === color.toLowerCase() && "ring-2 ring-[#FF0054]"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {footerSettings.textColor?.toLowerCase() === color.toLowerCase() && (
                                            <Check className={cn("w-3 h-3", color.toLowerCase() === '#ffffff' ? "text-black" : "text-white")} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Upload background */}
                <div className="flex items-center justify-between relative">
                    <span className="text-[#A1A1AA]">Upload background</span>
                    <button
                        type="button"
                        onClick={() => {
                            setIsUploadMenuOpen(!isUploadMenuOpen)
                            setIsBgColorOpen(false)
                            setIsTextColorOpen(false)
                        }}
                        className="w-7 h-7 flex items-center justify-center text-[#A1A1AA] hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
                        title="Upload background"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {/* Upload Menu Popover */}
                    {isUploadMenuOpen && (
                        <div className="absolute right-0 top-9 bg-[#1E2026] border border-[#2E313D] rounded-lg p-3 shadow-2xl z-50 w-[230px] flex flex-col gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-[#FF0054] hover:bg-[#D90046] text-white text-xs font-medium rounded transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploading ? "A carregar..." : "Carregar imagem"}</span>
                            </button>

                            {footerSettings.backgroundImage && (
                                <>
                                    <div className="w-full h-20 rounded border border-white/10 overflow-hidden relative group">
                                        <img
                                            src={footerSettings.backgroundImage}
                                            alt="Background preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveBackground}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs rounded transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Remover imagem</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* 5. Visible and Sub-toggles */}
                <div className="flex flex-col gap-3 pt-1 border-t border-[#2A2B33]">
                    {/* Visible Main Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-[#A1A1AA]">Visible</span>
                        <PinkToggleSwitch
                            checked={footerSettings.isVisible !== false}
                            onChange={(val) => updateFooterSettings({ isVisible: val })}
                        />
                    </div>

                    {/* Show Next (Indented) */}
                    <div className="flex items-center justify-between pl-5">
                        <span className="text-[#A1A1AA]">Show Next</span>
                        <PinkToggleSwitch
                            checked={footerSettings.showNext !== false}
                            onChange={(val) => updateFooterSettings({ showNext: val })}
                            disabled={footerSettings.isVisible === false}
                        />
                    </div>

                    {/* Show Previous (Indented) */}
                    <div className="flex items-center justify-between pl-5">
                        <span className="text-[#A1A1AA]">Show Previous</span>
                        <PinkToggleSwitch
                            checked={footerSettings.showPrevious === true}
                            onChange={(val) => updateFooterSettings({ showPrevious: val })}
                            disabled={footerSettings.isVisible === false}
                        />
                    </div>
                </div>

                {/* 6. Legal & Contact Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2A2B33]">
                    <span className="text-[#A1A1AA]">Legal & Contact Footer</span>
                    <PinkToggleSwitch
                        checked={footerSettings.legalContactFooter === true}
                        onChange={(val) => updateFooterSettings({ legalContactFooter: val })}
                    />
                </div>

                {/* 7. Brivio° branding tag */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2A2B33]">
                    <span className="text-[#A1A1AA]">Brivio° branding tag</span>
                    <PinkToggleSwitch
                        checked={footerSettings.brandingTag !== false}
                        onChange={(val) => updateFooterSettings({ brandingTag: val })}
                    />
                </div>

            </div>
        </div>
    )
}
