"use client"

import React, { useState, useEffect, useRef } from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import {
    ArrowLeft,
    ArrowRight,
    Plus,
    Trash2,
    Settings,
    Copy,
    CopyPlus,
    Zap,
    Check,
    AlignLeft,
    AlignCenter,
    AlignRight,
    SlidersHorizontal,
    Type,
    Palette,
    ChevronDown
} from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { toast } from "sonner"
import { FontPicker } from "../FontPicker"
import { SmoothColorInput } from "../SmoothColorInput"
import { EDITOR_COLLISION_PADDING } from "../editorLayout"

interface StorySlide {
    id: string
    title: string
    description: string
}

interface StorySettings {
    autoplay?: boolean
    duration?: number // duration in seconds per slide
    accentColor?: string
    barColor?: string
    buttonColor?: string
    
    // Title Typography
    titleColor?: string
    titleFontSize?: string
    titleFontFamily?: string
    
    // Body / Description Typography
    textColor?: string
    textFontSize?: string
    textFontFamily?: string
    
    align?: 'left' | 'center' | 'right'
    showArrows?: boolean
}

interface StoryBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onAnimate?: () => void
    align?: 'left' | 'center' | 'right'
}

export const StoryBlock = ({
    block,
    isReadOnly,
    onUpdate,
    onSelect,
    activeBlockId,
    onDelete,
    onDuplicate,
    onCopy,
    onAnimate,
    align: parentAlign
}: StoryBlockProps) => {
    const slides: StorySlide[] = block.content?.slides || [
        {
            id: '1',
            title: "Brief but concise",
            description: "By keeping the brand message, image, and tone of voice consistent, remember, identity guidelines are for everyday life at the company."
        }
    ]

    const settings: StorySettings = block.content?.settings || {}
    const autoplay = settings.autoplay ?? false
    const duration = settings.duration ?? 5
    const accentColor = settings.accentColor || '#2563EB' // Brand blue from screenshot
    const barColor = settings.barColor || '#E2E8F0' // Soft slate
    const buttonColor = settings.buttonColor || accentColor
    const align = settings.align || parentAlign || 'left'

    // Typography Settings
    const titleColor = settings.titleColor || '#111827' // Clean black/dark slate
    const titleFontSize = settings.titleFontSize || '36px'
    const titleFontFamily = settings.titleFontFamily || 'Inter'

    const textColor = settings.textColor || '#4B5563' // Clean readable gray
    const textFontSize = settings.textFontSize || '18px'
    const textFontFamily = settings.textFontFamily || 'Inter'

    const [currentIndex, setCurrentIndex] = useState(0)
    const [progress, setProgress] = useState(0) // 0 to 100
    const [isHovered, setIsHovered] = useState(false)
    const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    // Load custom fonts dynamically if selected
    useEffect(() => {
        const fontsToLoad = [titleFontFamily, textFontFamily].filter(Boolean)
        fontsToLoad.forEach((font) => {
            if (font && font !== "Inter" && font !== "inherit") {
                const linkId = `font-story-${font.replace(/\s+/g, '-')}`
                if (!document.getElementById(linkId)) {
                    const link = document.createElement('link')
                    link.id = linkId
                    link.rel = 'stylesheet'
                    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`
                    document.head.appendChild(link)
                }
            }
        })
    }, [titleFontFamily, textFontFamily])

    // Ensure currentIndex is in bounds if slides change
    useEffect(() => {
        if (currentIndex >= slides.length) {
            setCurrentIndex(Math.max(0, slides.length - 1))
        }
    }, [slides.length, currentIndex])

    // Autoplay timer with precise timestamp calculation
    useEffect(() => {
        if (!autoplay || isPaused || (isHovered && !isReadOnly) || slides.length <= 1) {
            setProgress(0)
            return
        }

        const durationMs = Math.max(1000, duration * 1000)
        const startTime = Date.now()
        setProgress(0)

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const pct = Math.min(100, (elapsed / durationMs) * 100)

            if (elapsed >= durationMs) {
                clearInterval(interval)
                setProgress(0)
                setCurrentIndex((prev) => (prev + 1) % slides.length)
            } else {
                setProgress(pct)
            }
        }, 25)

        return () => clearInterval(interval)
    }, [autoplay, isPaused, isHovered, isReadOnly, duration, currentIndex, slides.length])

    // Handlers
    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setProgress(0)
        setCurrentIndex((prev) => (prev + 1) % slides.length)
    }

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setProgress(0)
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    }

    const handleSelectSlide = (index: number) => {
        setProgress(0)
        setCurrentIndex(index)
    }

    const handleAddSlide = () => {
        const newSlide: StorySlide = {
            id: Math.random().toString(36).substr(2, 9),
            title: "Novo Título do Slide",
            description: "Adicione aqui a descrição ou diretriz para este slide do Brandbook."
        }
        const newSlides = [...slides, newSlide]
        onUpdate(block.id, {
            ...block.content,
            slides: newSlides
        })
        setCurrentIndex(newSlides.length - 1)
        toast.success("Novo slide adicionado!")
    }

    const handleDeleteSlide = (indexToDelete: number) => {
        if (slides.length <= 1) {
            toast.error("O bloco precisa ter pelo menos um slide.")
            return
        }
        const newSlides = slides.filter((_, i) => i !== indexToDelete)
        onUpdate(block.id, {
            ...block.content,
            slides: newSlides
        })
        setCurrentIndex((prev) => (prev >= newSlides.length ? newSlides.length - 1 : prev))
        toast.info("Slide removido.")
    }

    const handleUpdateSlide = (field: 'title' | 'description', value: string) => {
        const newSlides = slides.map((s, idx) => {
            if (idx === currentIndex) {
                return { ...s, [field]: value }
            }
            return s
        })
        onUpdate(block.id, {
            ...block.content,
            slides: newSlides
        })
    }

    const handleUpdateSettings = (updates: Partial<StorySettings>) => {
        onUpdate(block.id, {
            ...block.content,
            settings: {
                ...settings,
                ...updates
            }
        })
    }

    const currentSlide = slides[currentIndex] || slides[0] || {
        id: '1',
        title: "",
        description: ""
    }

    const isSelected = activeBlockId === block.id
    const showToolbar = !isReadOnly && (isHovered || isSelected || isSettingsOpen)

    const alignmentClasses = {
        left: "text-left items-start",
        center: "text-center items-center",
        right: "text-right items-end"
    }[align]

    return (
        <div
            className="w-full relative group/story select-none transition-all duration-200 py-6 px-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseMove={(e) => {
                if (!isReadOnly) {
                    if (hoverSide !== null) setHoverSide(null)
                    return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                const mouseX = e.clientX - rect.left
                const ratio = mouseX / rect.width
                if (ratio < 0.5) {
                    if (hoverSide !== 'left') setHoverSide('left')
                } else {
                    if (hoverSide !== 'right') setHoverSide('right')
                }
            }}
            onMouseLeave={() => {
                setIsHovered(false)
                setHoverSide(null)
            }}
            onClick={(e) => {
                e.stopPropagation()
                if (isReadOnly) {
                    if (hoverSide === 'left') {
                        handlePrev()
                    } else {
                        handleNext()
                    }
                } else {
                    onSelect?.(block.id)
                }
            }}
        >
            {/* Context Toolbar for Edit Mode */}
            {showToolbar && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 bg-[#15161B] border border-[#2A2B35] shadow-2xl rounded-full px-3.5 py-1.5 text-white animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap w-max min-w-max max-w-none shrink-0 select-none">
                    {/* Slide Navigation in Toolbar */}
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1 text-xs text-gray-300 shrink-0 whitespace-nowrap flex-nowrap select-none">
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="hover:text-white p-0.5 rounded transition-colors shrink-0"
                            title="Slide anterior"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-medium px-1 font-mono whitespace-nowrap select-none shrink-0">
                            {currentIndex + 1} / {slides.length}
                        </span>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="hover:text-white p-0.5 rounded transition-colors shrink-0"
                            title="Próximo slide"
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-white/10 shrink-0" />

                    {/* Add Slide */}
                    <button
                        type="button"
                        onClick={handleAddSlide}
                        className="flex items-center gap-1.5 text-xs hover:text-white text-gray-300 hover:bg-white/10 px-2.5 py-1 rounded-full transition-colors shrink-0 whitespace-nowrap select-none"
                        title="Adicionar novo slide"
                    >
                        <Plus className="w-3.5 h-3.5 text-[#FF0054] shrink-0" />
                        <span className="text-[11px] font-medium whitespace-nowrap">Novo Slide</span>
                    </button>

                    {/* Delete Current Slide */}
                    {slides.length > 1 && (
                        <button
                            type="button"
                            onClick={() => handleDeleteSlide(currentIndex)}
                            className="hover:text-red-400 text-gray-400 p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
                            title="Excluir este slide"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <div className="w-[1px] h-4 bg-white/10 shrink-0" />

                    {/* Settings Popover */}
                    <PopoverPrimitive.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <PopoverPrimitive.Trigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "p-1.5 rounded-full transition-colors shrink-0",
                                    isSettingsOpen ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-400 hover:text-white"
                                )}
                                title="Configurações do Story Slider"
                            >
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                        </PopoverPrimitive.Trigger>

                        <PopoverPrimitive.Portal>
                            <PopoverPrimitive.Content
                                side="top"
                                align="center"
                                sideOffset={12}
                                collisionPadding={EDITOR_COLLISION_PADDING}
                                className="z-[2000] w-[320px] bg-[#111116] rounded-lg overflow-hidden shadow-2xl border border-[#222] text-sm font-sans flex flex-col max-h-[520px] outline-none animate-in fade-in zoom-in-95 duration-150 p-0"
                            >
                                {/* Header (Identity from References 2 & 3) */}
                                <div className="bg-[#FF0054] h-[48px] px-4 flex items-center justify-between transition-colors shrink-0 select-none">
                                    <span className="font-medium text-white text-base">Story settings</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                                        title="Fechar"
                                    />
                                </div>

                                {/* Body Content */}
                                <div className="p-5 space-y-6 text-[#888] overflow-y-auto custom-scrollbar text-sm">
                                    {/* 1. TÍTULO */}
                                    <div className="space-y-4">
                                        <span className="block text-[#888]">Texto do título</span>

                                        {/* Fonte do Título */}
                                        <div className="space-y-1.5">
                                            <span className="text-xs text-[#666]">Fonte</span>
                                            <FontPicker
                                                currentFont={titleFontFamily}
                                                onFontChange={(font) => handleUpdateSettings({ titleFontFamily: font })}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center justify-between px-3 py-2 bg-[#18181F] hover:bg-[#202028] border border-[#333] rounded text-xs text-white transition-colors"
                                                >
                                                    <span className="truncate" style={{ fontFamily: titleFontFamily }}>{titleFontFamily}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-[#666] shrink-0" />
                                                </button>
                                            </FontPicker>
                                        </div>

                                        {/* Tamanho do Título */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[#666]">Tamanho</span>
                                                <span className="text-xs text-white font-mono">{titleFontSize}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {['24px', '28px', '32px', '36px', '42px', '48px'].map((sz) => (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => handleUpdateSettings({ titleFontSize: sz })}
                                                        className={cn(
                                                            "flex-1 py-1.5 rounded text-xs font-mono transition-colors text-center border",
                                                            titleFontSize === sz
                                                                ? "border-[#FF0054] text-[#FF0054] bg-[#FF0054]/10 font-medium"
                                                                : "bg-[#18181F] text-[#888] border-[#333] hover:text-white"
                                                        )}
                                                    >
                                                        {sz.replace('px', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cor do Título */}
                                        <div className="flex items-center justify-between pt-1">
                                            <span>Cor do título</span>
                                            <div className="relative flex items-center">
                                                <SmoothColorInput
                                                    type="color"
                                                    value={titleColor}
                                                    onChange={(e) => handleUpdateSettings({ titleColor: e.target.value })}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                                    title="Alterar cor do título"
                                                />
                                                <div
                                                    className="w-6 h-6 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110"
                                                    style={{ backgroundColor: titleColor }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-[1px] bg-[#222] w-full" />

                                    {/* 2. DESCRIÇÃO / CORPO */}
                                    <div className="space-y-4">
                                        <span className="block text-[#888]">Texto da descrição</span>

                                        {/* Fonte da Descrição */}
                                        <div className="space-y-1.5">
                                            <span className="text-xs text-[#666]">Fonte</span>
                                            <FontPicker
                                                currentFont={textFontFamily}
                                                onFontChange={(font) => handleUpdateSettings({ textFontFamily: font })}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center justify-between px-3 py-2 bg-[#18181F] hover:bg-[#202028] border border-[#333] rounded text-xs text-white transition-colors"
                                                >
                                                    <span className="truncate" style={{ fontFamily: textFontFamily }}>{textFontFamily}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-[#666] shrink-0" />
                                                </button>
                                            </FontPicker>
                                        </div>

                                        {/* Tamanho da Descrição */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[#666]">Tamanho</span>
                                                <span className="text-xs text-white font-mono">{textFontSize}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {['14px', '16px', '18px', '20px', '22px'].map((sz) => (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => handleUpdateSettings({ textFontSize: sz })}
                                                        className={cn(
                                                            "flex-1 py-1.5 rounded text-xs font-mono transition-colors text-center border",
                                                            textFontSize === sz
                                                                ? "border-[#FF0054] text-[#FF0054] bg-[#FF0054]/10 font-medium"
                                                                : "bg-[#18181F] text-[#888] border-[#333] hover:text-white"
                                                        )}
                                                    >
                                                        {sz.replace('px', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cor da Descrição */}
                                        <div className="flex items-center justify-between pt-1">
                                            <span>Cor da descrição</span>
                                            <div className="relative flex items-center">
                                                <SmoothColorInput
                                                    type="color"
                                                    value={textColor}
                                                    onChange={(e) => handleUpdateSettings({ textColor: e.target.value })}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                                    title="Alterar cor da descrição"
                                                />
                                                <div
                                                    className="w-6 h-6 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110"
                                                    style={{ backgroundColor: textColor }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-[1px] bg-[#222] w-full" />

                                    {/* 3. CORES DO SLIDER */}
                                    <div className="space-y-4">
                                        <span className="block text-[#888]">Cores do slider</span>

                                        <div className="flex items-center justify-between">
                                            <span>Cor de destaque / ativa</span>
                                            <div className="relative flex items-center">
                                                <SmoothColorInput
                                                    type="color"
                                                    value={accentColor}
                                                    onChange={(e) => handleUpdateSettings({ accentColor: e.target.value, buttonColor: e.target.value })}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                                    title="Alterar cor ativa"
                                                />
                                                <div
                                                    className="w-6 h-6 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110"
                                                    style={{ backgroundColor: accentColor }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span>Cor da barra inativa</span>
                                            <div className="relative flex items-center">
                                                <SmoothColorInput
                                                    type="color"
                                                    value={barColor}
                                                    onChange={(e) => handleUpdateSettings({ barColor: e.target.value })}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                                    title="Alterar cor da barra inativa"
                                                />
                                                <div
                                                    className="w-6 h-6 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110"
                                                    style={{ backgroundColor: barColor }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-[1px] bg-[#222] w-full" />

                                    {/* 4. REPRODUÇÃO AUTOMÁTICA */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span>Activar autoplay</span>
                                            <SwitchPrimitives.Root
                                                checked={autoplay}
                                                onCheckedChange={(checked) => handleUpdateSettings({ autoplay: checked })}
                                                className={cn(
                                                    "peer inline-flex h-[27px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                                                    "data-[state=checked]:bg-[#FF0054] data-[state=unchecked]:bg-[#515151]"
                                                )}
                                            >
                                                <SwitchPrimitives.Thumb
                                                    className={cn(
                                                        "pointer-events-none block h-[23px] w-[23px] rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[23px] data-[state=unchecked]:translate-x-0",
                                                        "data-[state=checked]:bg-[#ffffff] data-[state=unchecked]:bg-[#97A1B3]"
                                                    )}
                                                />
                                            </SwitchPrimitives.Root>
                                        </div>

                                        {autoplay && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span>Duração por slide</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {[3, 5, 8, 10].map((d) => (
                                                            <button
                                                                key={d}
                                                                type="button"
                                                                onClick={() => handleUpdateSettings({ duration: d })}
                                                                className={cn(
                                                                    "px-2.5 py-1 rounded text-xs font-mono transition-colors border",
                                                                    duration === d
                                                                        ? "border-[#FF0054] text-[#FF0054] bg-[#FF0054]/10 font-medium"
                                                                        : "bg-[#18181F] text-[#888] border-[#333] hover:text-white"
                                                                )}
                                                            >
                                                                {d}s
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-[1px] bg-[#222] w-full" />

                                    {/* 5. ALINHAMENTO */}
                                    <div className="flex items-center justify-between">
                                        <span>Alinhamento</span>
                                        <div className="flex items-center gap-1 bg-[#18181F] p-1 rounded border border-[#333]">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateSettings({ align: 'left' })}
                                                className={cn("p-1.5 rounded transition-colors", align === 'left' ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                                                title="Alinhar à esquerda"
                                            >
                                                <AlignLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateSettings({ align: 'center' })}
                                                className={cn("p-1.5 rounded transition-colors", align === 'center' ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                                                title="Centralizar"
                                            >
                                                <AlignCenter className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateSettings({ align: 'right' })}
                                                className={cn("p-1.5 rounded transition-colors", align === 'right' ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                                                title="Alinhar à direita"
                                            >
                                                <AlignRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 6. DELETE FOOTER ACTION */}
                                    {onDelete && (
                                        <>
                                            <div className="h-[1px] bg-[#222] w-full" />
                                            <div className="flex items-center justify-between pt-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsSettingsOpen(false)
                                                        onDelete(block.id)
                                                    }}
                                                    className="flex items-center gap-2 text-red-500 hover:text-red-400 text-xs transition-colors group cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-400" />
                                                    <span>Delete story</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </PopoverPrimitive.Content>
                        </PopoverPrimitive.Portal>
                    </PopoverPrimitive.Root>

                    <div className="w-[1px] h-4 bg-white/10 shrink-0" />

                    {/* Copy Block */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onCopy?.(block.id)
                            setIsCopied(true)
                            setTimeout(() => setIsCopied(false), 2000)
                        }}
                        className={cn(
                            "p-1.5 rounded-full transition-colors shrink-0",
                            isCopied ? "bg-green-500/20 text-green-400" : "hover:bg-white/10 text-gray-400 hover:text-white"
                        )}
                        title={isCopied ? "Bloco copiado!" : "Copiar bloco"}
                    >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Duplicate Block */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDuplicate?.(block.id)
                        }}
                        className="hover:bg-white/10 text-gray-400 hover:text-white p-1.5 rounded-full transition-colors shrink-0"
                        title="Duplicar bloco"
                    >
                        <CopyPlus className="w-3.5 h-3.5" />
                    </button>

                    {/* Animate Block */}
                    {onAnimate && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onAnimate()
                            }}
                            className="hover:bg-white/10 text-gray-400 hover:text-white p-1.5 rounded-full transition-colors shrink-0"
                            title="Animar bloco"
                        >
                            <Zap className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Delete Block */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete?.(block.id)
                        }}
                        className="hover:bg-red-500/20 text-gray-400 hover:text-red-400 p-1.5 rounded-full transition-colors shrink-0"
                        title="Excluir bloco"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* MAIN COMPONENT BODY */}
            <div className={cn("w-full relative flex flex-col max-w-4xl mx-auto", alignmentClasses)}>
                {/* 1. Segmented Progress Bar (Top Bar Indicators) */}
                <div className="w-full flex items-center gap-3 mb-8 pt-2">
                    {slides.map((_, idx) => {
                        const isPast = idx < currentIndex
                        const isCurrent = idx === currentIndex
                        const isFuture = idx > currentIndex

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleSelectSlide(idx)
                                }}
                                className="flex-1 h-1.5 sm:h-2 rounded-full relative overflow-hidden transition-all duration-300 group/seg cursor-pointer"
                                style={{ backgroundColor: barColor }}
                                title={`Slide ${idx + 1}: ${slides[idx]?.title || 'Sem título'}`}
                            >
                                {/* Filled bar for past slides */}
                                {isPast && (
                                    <div
                                        className="absolute inset-0 rounded-full transition-all"
                                        style={{ backgroundColor: accentColor }}
                                    />
                                )}

                                {/* Progress bar for current active slide */}
                                {isCurrent && (
                                    <>
                                        {autoplay ? (
                                            <div
                                                className="absolute top-0 bottom-0 left-0 rounded-full transition-all ease-linear"
                                                style={{
                                                    width: `${progress}%`,
                                                    backgroundColor: accentColor
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="absolute inset-0 rounded-full flex items-center transition-all"
                                                style={{ backgroundColor: `${accentColor}33` }}
                                            >
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: accentColor
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Hover effect on unvisited slides */}
                                {isFuture && (
                                    <div
                                        className="absolute inset-0 rounded-full opacity-0 group-hover/seg:opacity-40 transition-opacity"
                                        style={{ backgroundColor: accentColor }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* 2. Slide Content with Hover Navigation Arrows */}
                <div className="relative w-full py-2">
                    {/* Floating Navigation Button (LEFT) - Only visible on hover in preview mode on the left half */}
                    {isReadOnly && (
                        <button
                            type="button"
                            onClick={handlePrev}
                            className={cn(
                                "absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full text-white flex items-center justify-center shadow-2xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2",
                                hoverSide === 'left' ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"
                            )}
                            style={{
                                backgroundColor: buttonColor,
                                filter: 'drop-shadow(0 6px 16px rgba(37, 99, 235, 0.4))'
                            }}
                            title="Slide anterior"
                        >
                            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                        </button>
                    )}

                    {/* Floating Navigation Button (RIGHT) - Only visible on hover in preview mode on the right half */}
                    {isReadOnly && (
                        <button
                            type="button"
                            onClick={handleNext}
                            className={cn(
                                "absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full text-white flex items-center justify-center shadow-2xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2",
                                hoverSide === 'right' ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"
                            )}
                            style={{
                                backgroundColor: buttonColor,
                                filter: 'drop-shadow(0 6px 16px rgba(37, 99, 235, 0.4))'
                            }}
                            title="Próximo slide"
                        >
                            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                        </button>
                    )}

                    {/* Text Container (Title + Paragraph) - Flush left aligned with first progress bar */}
                    <div key={currentIndex} className="w-full animate-in fade-in duration-300">
                        {/* Slide Title */}
                        {isReadOnly ? (
                            <h2
                                className="font-bold tracking-tight leading-tight mb-3 transition-colors select-none text-left"
                                style={{
                                    color: titleColor,
                                    fontSize: titleFontSize,
                                    fontFamily: titleFontFamily
                                }}
                            >
                                {currentSlide.title || "Sem título"}
                            </h2>
                        ) : (
                            <input
                                type="text"
                                value={currentSlide.title}
                                onChange={(e) => handleUpdateSlide('title', e.target.value)}
                                placeholder="Título do Slide..."
                                className="w-full font-bold tracking-tight leading-tight mb-3 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500/40 rounded px-0 transition-all text-left"
                                style={{
                                    color: titleColor,
                                    fontSize: titleFontSize,
                                    fontFamily: titleFontFamily
                                }}
                            />
                        )}

                        {/* Slide Description */}
                        {isReadOnly ? (
                            <p
                                className="leading-relaxed max-w-2xl whitespace-pre-wrap transition-colors select-none text-left"
                                style={{
                                    color: textColor,
                                    fontSize: textFontSize,
                                    fontFamily: textFontFamily
                                }}
                            >
                                {currentSlide.description || "Sem descrição"}
                            </p>
                        ) : (
                            <textarea
                                value={currentSlide.description}
                                onChange={(e) => handleUpdateSlide('description', e.target.value)}
                                placeholder="Descrição do Slide..."
                                rows={3}
                                className="w-full leading-relaxed max-w-2xl bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500/40 rounded px-0 resize-none transition-all text-left"
                                style={{
                                    color: textColor,
                                    fontSize: textFontSize,
                                    fontFamily: textFontFamily
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
