"use client"

import React, { useState } from "react"
import { motion, useDragControls } from "framer-motion"
import { cn } from "@/lib/utils"
import { X, Ban, RotateCcw, Play } from "lucide-react"
import { getConfiguredAnimationProps, getPresetDuration, type AnimationSettings, type AnimationEasing } from "./AnimatedBlock"
import { getHoverProps, hasHoverEffect, type HoverEffect } from "./hoverEffects"
import { SmoothColorInput } from "./SmoothColorInput"

interface AnimationOptionProps {
    id: string
    label: string
    icon: React.ReactNode
    selected?: boolean
    onClick?: () => void
}

const AnimationOptionCard = ({ label, icon, selected, onClick }: AnimationOptionProps) => {
    return (
        <div
            onClick={onClick}
            className="flex flex-col items-center gap-1 cursor-pointer group"
        >
            <div className={cn(
                "w-[100px] h-[100px] bg-[#15161B] rounded-lg border border-[#222] flex items-center justify-center transition-all",
                selected ? "border-[#ff0054] shadow-[0_0_15px_rgba(255,0,84,0.3)] bg-[#1a1c22]" : "group-hover:border-[#333]"
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-[12px] font-medium transition-colors text-center",
                selected ? "text-white" : "text-[#555] group-hover:text-[#777]"
            )}>
                {label}
            </span>
        </div>
    )
}

interface AnimationPanelProps {
    isOpen: boolean
    onClose: () => void
    onSelectAnimation?: (animationId: string) => void
    initialAnimation?: string | null
    animationSettings?: AnimationSettings | null
    onAnimationSettingsChange?: (settings: AnimationSettings) => void
    /** False when no element is selected, so choices would have nothing to apply to */
    hasTarget?: boolean
    hoverEffect?: HoverEffect | null
    onHoverEffectChange?: (effect: HoverEffect) => void
}

const RangeControl = ({ label, value, min, max, step, unit, isDefault, onChange, onReset }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    unit: string
    isDefault: boolean
    onChange: (value: number) => void
    onReset: () => void
}) => {
    // Dragging only moves a local value; the element (and the whole page with it) is updated on release
    const [draft, setDraft] = useState<number | null>(null)
    const shown = draft ?? value
    const commit = () => {
        if (draft !== null && draft !== value) onChange(draft)
        setDraft(null)
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[#888] text-xs font-medium uppercase tracking-wider">{label}</span>
                <div className="flex items-center gap-2">
                    <span className={cn("text-xs tabular-nums", isDefault && draft === null ? "text-[#666]" : "text-white")}>
                        {unit === 's' ? shown.toFixed(1) : Math.round(shown)}{unit}
                    </span>
                    <RotateCcw
                        className={cn("w-3.5 h-3.5 cursor-pointer", isDefault ? "text-[#444]" : "text-[#888] hover:text-white")}
                        onClick={onReset}
                    />
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={shown}
                onChange={(e) => setDraft(Number(e.target.value))}
                onPointerUp={commit}
                onKeyUp={commit}
                onBlur={commit}
                className="w-full accent-[#ff0054] cursor-pointer"
            />
        </div>
    )
}

function Segmented<T extends string>({ label, value, options, onChange }: {
    label: string
    value: T
    options: { id: T, label: string }[]
    onChange: (value: T) => void
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[#888] text-xs font-medium uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-1 bg-[#1a1c22] p-1 rounded-md">
                {options.map(option => (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            "flex-1 h-7 rounded text-[11px] font-semibold transition-all",
                            value === option.id ? "bg-[#ff0054] text-white" : "text-[#777] hover:text-white"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

/** Live sample of the selected animation with the current settings; replays on every change */
const AnimationPreview = ({ animation, settings }: { animation: string, settings: AnimationSettings }) => {
    const [replayKey, setReplayKey] = useState(0)
    const props = getConfiguredAnimationProps(animation, { ...settings, trigger: 'load' })
    const settingsKey = JSON.stringify(settings)

    return (
        <div className="relative h-[130px] rounded-lg bg-[#1a1c22] border border-[#222] overflow-hidden flex items-center justify-center">
            <motion.div
                key={`${animation}-${settingsKey}-${replayKey}`}
                {...(props || {})}
                className="w-14 h-14 bg-[#ff0054] rounded-md shadow-[0_0_20px_rgba(255,0,84,0.4)]"
            />
            <button
                onClick={() => setReplayKey(k => k + 1)}
                className="absolute bottom-2 right-2 h-7 px-2.5 rounded-md bg-[#111116] text-[#aaa] hover:text-white text-[11px] font-semibold flex items-center gap-1.5 border border-[#2a2a30]"
            >
                <Play className="w-3 h-3" /> Repetir
            </button>
        </div>
    )
}

const ColorField = ({ label, value, onChange }: { label: string, value?: string, onChange: (value: string | undefined) => void }) => (
    <div className="flex items-center justify-between">
        <span className="text-[#888] text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
            <label
                className={cn("relative w-7 h-7 rounded-md cursor-pointer overflow-hidden ring-1", value ? "ring-white/20" : "ring-white/10 bg-[repeating-conic-gradient(#2a2a30_0_25%,#1a1c22_0_50%)] bg-[length:8px_8px]")}
                style={value ? { backgroundColor: value } : undefined}
                title={value ? "Alterar cor" : "Escolher cor"}
            >
                <SmoothColorInput
                    type="color"
                    value={value || '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </label>
            <span className={cn("w-[62px] text-[11px] font-mono uppercase", value ? "text-white" : "text-[#555]")}>{value || 'Nenhuma'}</span>
            <RotateCcw
                className={cn("w-3.5 h-3.5 cursor-pointer", value ? "text-[#888] hover:text-white" : "text-[#444] pointer-events-none")}
                onClick={() => onChange(undefined)}
            />
        </div>
    </div>
)

const SAMPLE_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff0054"/><stop offset="1" stop-color="#f28c0f"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/><circle cx="118" cy="30" r="14" fill="#fff" fill-opacity=".6"/><path d="M0 90 L55 40 L95 75 L120 55 L160 90Z" fill="#15161b" fill-opacity=".55"/></svg>`
)

const HOVER_PRESETS: { id: string, label: string, effect: HoverEffect }[] = [
    { id: 'lift', label: 'Elevar', effect: { lift: 6, shadow: 'soft' } },
    { id: 'highlight', label: 'Destacar', effect: { backgroundColor: '#F4F4F5', borderColor: '#E4E4E7' } },
    { id: 'invert', label: 'Inverter', effect: { backgroundColor: '#15161B', textColor: '#FFFFFF' } },
    { id: 'zoom', label: 'Zoom imagem', effect: { imageZoom: 108 } },
    { id: 'color', label: 'Cor ao passar', effect: { imageColorOnHover: true } },
    { id: 'grow', label: 'Crescer', effect: { scale: 103, shadow: 'strong' } },
]

/** Hover state editor for the selected section / column / block, with a live sample to hover */
export const HoverTab = ({ effect, onChange }: { effect: HoverEffect, onChange: (effect: HoverEffect) => void }) => {
    const update = (patch: Partial<HoverEffect>) => onChange({ ...effect, ...patch })
    const sample = getHoverProps(effect)
    const active = hasHoverEffect(effect)

    return (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
            {/* Live sample */}
            <div className="relative h-[170px] rounded-lg bg-[#1a1c22] border border-[#222] flex items-center justify-center overflow-hidden">
                <div
                    className={cn("w-[190px] rounded-lg bg-white text-[#15161B] p-3 flex flex-col gap-2 border border-transparent overflow-hidden cursor-pointer", sample.className)}
                    style={sample.style}
                >
                    <div className="w-full h-[70px] rounded-md overflow-hidden">
                        <img src={SAMPLE_IMAGE} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[13px] font-semibold leading-none">Elemento</span>
                    <span className="text-[11px] opacity-60 leading-none">Passe o rato para testar</span>
                </div>
                {!active && <span className="absolute bottom-2 left-3 text-[10px] text-[#555]">Sem efeito de hover</span>}
            </div>

            {/* Quick presets */}
            <div className="flex flex-col gap-2">
                <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Predefinições</span>
                <div className="grid grid-cols-3 gap-1.5">
                    {HOVER_PRESETS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onChange({ ...p.effect, duration: effect.duration })}
                            className="h-8 rounded-md bg-[#1a1c22] text-[#aaa] hover:text-white hover:bg-[#23252c] text-[11px] font-semibold transition-colors"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-white/5" />

            <ColorField label="Fundo" value={effect.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
            <ColorField label="Texto" value={effect.textColor} onChange={(v) => update({ textColor: v })} />
            <ColorField label="Borda" value={effect.borderColor} onChange={(v) => update({ borderColor: v })} />
            <RangeControl
                label="Espessura da borda"
                value={effect.borderWidth ?? 0}
                min={0} max={8} step={1} unit="px"
                isDefault={!effect.borderWidth}
                onChange={(v) => update({ borderWidth: v || undefined })}
                onReset={() => update({ borderWidth: undefined })}
            />
            <RangeControl
                label="Arredondamento"
                value={effect.radius ?? 0}
                min={0} max={64} step={1} unit="px"
                isDefault={effect.radius === undefined}
                onChange={(v) => update({ radius: v })}
                onReset={() => update({ radius: undefined })}
            />

            <div className="h-px bg-white/5" />

            <span className="text-[#888] text-xs font-medium uppercase tracking-wider -mb-2">Textos dentro</span>
            <ColorField label="Títulos" value={effect.headingColor} onChange={(v) => update({ headingColor: v })} />
            <ColorField label="Texto corrido" value={effect.bodyColor} onChange={(v) => update({ bodyColor: v })} />

            <div className="h-px bg-white/5" />

            <RangeControl
                label="Elevar"
                value={effect.lift ?? 0}
                min={0} max={24} step={1} unit="px"
                isDefault={!effect.lift}
                onChange={(v) => update({ lift: v || undefined })}
                onReset={() => update({ lift: undefined })}
            />
            <RangeControl
                label="Escala"
                value={effect.scale ?? 100}
                min={90} max={115} step={1} unit="%"
                isDefault={!effect.scale || effect.scale === 100}
                onChange={(v) => update({ scale: v === 100 ? undefined : v })}
                onReset={() => update({ scale: undefined })}
            />
            <RangeControl
                label="Opacidade"
                value={effect.opacity ?? 100}
                min={20} max={100} step={5} unit="%"
                isDefault={effect.opacity === undefined || effect.opacity === 100}
                onChange={(v) => update({ opacity: v === 100 ? undefined : v })}
                onReset={() => update({ opacity: undefined })}
            />
            <Segmented<'none' | 'soft' | 'strong'>
                label="Sombra"
                value={effect.shadow || 'none'}
                options={[
                    { id: 'none', label: 'Nenhuma' },
                    { id: 'soft', label: 'Suave' },
                    { id: 'strong', label: 'Forte' },
                ]}
                onChange={(v) => update({ shadow: v === 'none' ? undefined : v })}
            />

            <div className="h-px bg-white/5" />

            <RangeControl
                label="Zoom das imagens"
                value={effect.imageZoom ?? 100}
                min={100} max={130} step={1} unit="%"
                isDefault={!effect.imageZoom || effect.imageZoom === 100}
                onChange={(v) => update({ imageZoom: v === 100 ? undefined : v })}
                onReset={() => update({ imageZoom: undefined })}
            />
            <div className="flex justify-between items-center">
                <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Imagens a P&B, cor ao passar</span>
                <div
                    role="switch"
                    aria-checked={!!effect.imageColorOnHover}
                    className={cn(
                        "w-[32px] h-[18px] rounded-[999px] relative cursor-pointer transition-colors shrink-0",
                        effect.imageColorOnHover ? "bg-[#ff0054]" : "bg-[#3F3F46]"
                    )}
                    onClick={() => update({ imageColorOnHover: !effect.imageColorOnHover || undefined })}
                >
                    <div className={cn(
                        "w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                        effect.imageColorOnHover ? "right-[2px]" : "left-[2px]"
                    )} />
                </div>
            </div>

            <RangeControl
                label="Duração"
                value={effect.duration ?? 0.35}
                min={0.1} max={1.5} step={0.05} unit="s"
                isDefault={effect.duration === undefined}
                onChange={(v) => update({ duration: v })}
                onReset={() => update({ duration: undefined })}
            />

            <button
                onClick={() => onChange({})}
                className="h-9 rounded-md border border-[#2a2a30] text-[#aaa] hover:text-white hover:border-[#444] text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors"
            >
                <RotateCcw className="w-3.5 h-3.5" /> Remover hover
            </button>
            <p className="text-[11px] text-[#555] leading-relaxed -mt-2">O hover é visível no modo Preview e na página publicada.</p>
        </div>
    )
}

export const AnimationPanel = ({ isOpen, onClose, onSelectAnimation, initialAnimation, animationSettings, onAnimationSettingsChange, hasTarget = true, hoverEffect, onHoverEffectChange }: AnimationPanelProps) => {
    const dragControls = useDragControls()
    const [selectedId, setSelectedId] = useState<string | null>(initialAnimation || null)
    const [tab, setTab] = useState<'effects' | 'settings' | 'hover'>('effects')
    const settings = animationSettings || {}
    const updateSettings = (patch: Partial<AnimationSettings>) => onAnimationSettingsChange?.({ ...settings, ...patch })
    const canConfigure = hasTarget && !!selectedId && selectedId !== 'none'

    // Follow the edited element, including elements without an animation
    React.useEffect(() => {
        setSelectedId(initialAnimation || 'none')
    }, [initialAnimation])

    if (!isOpen) return null

    const options = [
        {
            id: 'none',
            label: 'Nenhuma',
            icon: (
                <div className="flex items-center justify-center w-full h-full opacity-40">
                    <Ban className="w-10 h-10 text-[#ff0054]" />
                </div>
            )
        },
        {
            id: 'ascender',
            label: 'Ascender',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="relative w-10 h-16 flex flex-col-reverse items-center">
                        <div className="absolute bottom-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute bottom-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute bottom-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute bottom-6 w-8 h-8 bg-[#ff0054] rounded-sm opacity-100 shadow-[0_4px_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute right-3 flex flex-col items-center">
                        <div className="w-[1.5px] h-8 bg-[#ff0054]" />
                        <div className="w-1.5 h-1.5 border-t-[1.5px] border-r-[1.5px] border-[#ff0054] -rotate-45 -mt-[1px]" />
                    </div>
                </div>
            )
        },
        {
            id: 'de_cima',
            label: 'De cima',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="relative w-10 h-16">
                        <div className="absolute top-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute top-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute top-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute top-6 w-8 h-8 bg-[#ff0054] rounded-sm opacity-100 shadow-[0_4px_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute right-3 flex flex-col items-center">
                        <div className="w-1.5 h-1.5 border-b-[1.5px] border-r-[1.5px] border-[#ff0054] rotate-45 order-2 -mt-[5px]" />
                        <div className="w-[1.5px] h-8 bg-[#ff0054] order-1" />
                    </div>
                </div>
            )
        },
        {
            id: 'panorama',
            label: 'Panorama',
            icon: (
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <div className="relative w-16 h-8 flex items-center">
                        <div className="absolute left-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute left-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute left-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute left-6 w-10 h-8 bg-[#ff0054] rounded-sm opacity-100 shadow-[4px_0_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute bottom-4 flex items-center">
                        <div className="w-8 h-[1.5px] bg-[#ff0054]" />
                        <div className="w-1.5 h-1.5 border-t-[1.5px] border-r-[1.5px] border-[#ff0054] rotate-45 -ml-[1px]" />
                    </div>
                </div>
            )
        },
        {
            id: 'da_direita',
            label: 'Da direita',
            icon: (
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <div className="relative w-16 h-8 flex items-center">
                        <div className="absolute right-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute right-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute right-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute right-6 w-10 h-8 bg-[#ff0054] rounded-sm opacity-100 shadow-[-4px_0_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute bottom-4 flex items-center">
                        <div className="w-1.5 h-1.5 border-b-[1.5px] border-l-[1.5px] border-[#ff0054] rotate-45 -mr-[1px]" />
                        <div className="w-8 h-[1.5px] bg-[#ff0054]" />
                    </div>
                </div>
            )
        },
        {
            id: 'surgir',
            label: 'Surgir',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="absolute translate-x-[-8px] translate-y-[-8px] w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                    <div className="absolute translate-x-[-4px] translate-y-[-4px] w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                    <div className="absolute w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                    <div className="absolute translate-x-[4px] translate-y-[4px] w-10 h-10 bg-[#ff0054] rounded-sm opacity-100 shadow-[4px_4px_10px_rgba(255,0,84,0.3)]" />
                </div>
            )
        },
        {
            id: 'aproximar',
            label: 'Aproximar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="absolute w-16 h-16 border-[1.5px] border-dashed border-[#ff0054] rounded-md opacity-40" />
                    <div className="w-10 h-10 bg-[#ff0054] rounded-sm shadow-[0_0_15px_rgba(255,0,84,0.4)]" />
                    <div className="absolute top-3 left-3 w-2 h-2 border-b-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-3 right-3 w-2 h-2 border-t-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                </div>
            )
        },
        {
            id: 'ressalto',
            label: 'Ressalto',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 border-[1.5px] border-[#ff0054] rounded-md flex items-center justify-center">
                        <div className="w-8 h-8 border-[1.5px] border-[#ff0054] rounded-sm flex items-center justify-center">
                            <div className="w-5 h-5 bg-[#ff0054] rounded-[2px]" />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'elastico',
            label: 'Elástico',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="absolute w-14 h-14 border-[1.5px] border-[#ff0054] rounded-full opacity-25" />
                    <div className="absolute w-11 h-11 border-[1.5px] border-[#ff0054] rounded-full opacity-50" />
                    <div className="w-7 h-7 bg-[#ff0054] rounded-full shadow-[0_0_15px_rgba(255,0,84,0.5)]" />
                </div>
            )
        },
        {
            id: 'limpar',
            label: 'Limpar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 flex rounded-md overflow-hidden relative">
                        <div className="flex-1 bg-[#ff0054]" />
                        <div className="flex-1 bg-[#ff0054] opacity-20" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-[#ff0054] -translate-x-1/2" />
                    </div>
                </div>
            )
        },
        {
            id: 'revelar',
            label: 'Revelar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 flex flex-col rounded-md overflow-hidden relative">
                        <div className="flex-1 bg-[#ff0054] opacity-20" />
                        <div className="flex-1 bg-[#ff0054]" />
                        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#ff0054] -translate-y-1/2" />
                    </div>
                </div>
            )
        },
        {
            id: 'iris',
            label: 'Íris',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 bg-[#ff0054] opacity-20 rounded-md" />
                    <div className="absolute w-8 h-8 bg-[#ff0054] rounded-full shadow-[0_0_15px_rgba(255,0,84,0.5)]" />
                    <div className="absolute w-12 h-12 border-[1.5px] border-dashed border-[#ff0054] rounded-full" />
                </div>
            )
        },
        {
            id: 'desfocagem',
            label: 'Desfocagem',
            icon: (
                <div className="w-12 h-12 bg-[#ff0054] rounded-md blur-[6px] opacity-80" />
            )
        },
        {
            id: 'sequencia',
            label: 'Sequência',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 bg-[#ff0054] rounded-md blur-[6px] opacity-80" />
                    {/* Corner marks */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                </div>
            )
        },
        {
            id: 'de_baixo',
            label: 'De baixo',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full pb-2">
                    <div className="relative w-8 h-12 flex flex-col-reverse items-center">
                        <div className="absolute bottom-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute bottom-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute bottom-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute bottom-6 w-8 h-10 bg-[#ff0054] rounded-sm opacity-100 shadow-[0_4px_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute bottom-2 w-12 h-[1.5px] bg-[#ff0054]" />
                </div>
            )
        },
        {
            id: 'deriva',
            label: 'Deriva',
            icon: (
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <div className="relative w-12 h-10 flex items-center">
                        <div className="absolute left-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute left-4 w-9 h-9 bg-[#ff0054] rounded-sm opacity-100 shadow-[4px_0_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute bottom-2 flex items-center">
                        <div className="w-8 h-[1.5px] bg-[#ff0054]" />
                        <div className="w-1.5 h-1.5 border-t-[1.5px] border-r-[1.5px] border-[#ff0054] rotate-45 -ml-[1px]" />
                    </div>
                </div>
            )
        },
        {
            id: 'rodar',
            label: 'Rodar',
            icon: (
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#ff0054] rounded-full shadow-[0_0_15px_rgba(255,0,84,0.4)]" />

                    {/* SVG for circular arrows to match the visual better */}
                    <svg width="48" height="48" viewBox="0 0 48 48" className="absolute">
                        <path
                            d="M 12 30 A 18 18 0 0 1 36 18"
                            fill="none"
                            stroke="#ff0054"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 36 18 l -4 0 l 4 -4 l 0 4"
                            fill="#ff0054"
                            stroke="#ff0054"
                            strokeWidth="1"
                        />

                        <path
                            d="M 36 18 A 18 18 0 0 1 12 30"
                            fill="none"
                            stroke="#ff0054"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            transform="rotate(180 24 24)"
                        />
                        <path
                            d="M 36 18 l -4 0 l 4 -4 l 0 4"
                            fill="#ff0054"
                            stroke="#ff0054"
                            strokeWidth="1"
                            transform="rotate(180 24 24)"
                        />
                    </svg>
                </div>
            )
        },
        {
            id: 'virar',
            label: 'Virar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full [perspective:200px]">
                    <div className="absolute w-12 h-4 bg-[#ff0054] opacity-20 rounded-sm -translate-y-5" />
                    <div className="w-12 h-10 bg-[#ff0054] rounded-sm [transform:rotateX(35deg)] shadow-[0_6px_14px_rgba(255,0,84,0.35)]" />
                </div>
            )
        },
        {
            id: 'inclinar',
            label: 'Inclinar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="absolute w-10 h-10 bg-[#ff0054] opacity-25 rounded-sm skew-y-12 translate-y-2" />
                    <div className="w-10 h-10 bg-[#ff0054] rounded-sm shadow-[0_4px_10px_rgba(255,0,84,0.3)]" />
                </div>
            )
        },
        {
            id: 'pulsar',
            label: 'Pulsar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-10 h-10 bg-[#ff0054] rounded-full shadow-[0_0_20px_rgba(255,0,84,0.5)]" />
                    {/* Corner marks */}
                    <div className="absolute top-4 left-4 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute top-4 right-4 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-4 left-4 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-4 right-4 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                </div>
            )
        },
        // ---- Scroll / pointer interactions (Preview and shared link; see scrollFx) ----
        {
            id: 'acender',
            label: 'Acender (scroll)',
            icon: (
                <div className="flex flex-col gap-1.5 w-12">
                    <div className="h-1.5 rounded-full bg-[#ff0054]" />
                    <div className="h-1.5 rounded-full bg-[#ff0054]" />
                    <div className="h-1.5 rounded-full bg-[#ff0054] opacity-50" />
                    <div className="h-1.5 rounded-full bg-[#ff0054] opacity-20" />
                </div>
            )
        },
        {
            id: 'mascara',
            label: 'Máscara pétala',
            icon: (
                <svg width="40" height="40" viewBox="0 0 100 100"><path d="M50 3C79 22 93 58 50 97C7 58 21 22 50 3Z" transform="rotate(38 50 50)" fill="#ff0054" /></svg>
            )
        },
        {
            id: 'mascara_circulo',
            label: 'Máscara círculo',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 bg-[#ff0054] opacity-20 rounded-md" />
                    <div className="absolute w-7 h-7 bg-[#ff0054] rounded-full" />
                </div>
            )
        },
        {
            id: 'mascara_arco',
            label: 'Máscara arco',
            icon: (
                <svg width="40" height="40" viewBox="0 0 100 100"><path d="M8 100V50a42 42 0 0 1 84 0v50Z" fill="#ff0054" /></svg>
            )
        },
        {
            id: 'magnetico',
            label: 'Magnético',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-9 h-9 bg-[#ff0054] rounded-full translate-x-1.5 -translate-y-1 shadow-[0_0_15px_rgba(255,0,84,0.4)]" />
                    <div className="absolute w-12 h-12 border-[1.5px] border-dashed border-[#ff0054] rounded-full opacity-50" />
                </div>
            )
        },
        {
            id: 'flutuar',
            label: 'Flutuar',
            icon: (
                <div className="relative flex flex-col items-center justify-center w-full h-full gap-3">
                    <div className="w-10 h-10 bg-[#ff0054] rounded-full shadow-[0_0_15px_rgba(255,0,84,0.4)] -translate-y-1" />
                    <div className="w-8 h-1.5 bg-[#ff0054] rounded-full opacity-25 blur-[1px]" />
                </div>
            )
        }
    ]

    return (
        <motion.div
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="fixed top-20 right-10 z-[10000] w-[380px] h-[650px] bg-[#111116] rounded-xl border border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="h-[50px] bg-[#ff0054] flex items-center justify-between px-6 cursor-grab active:cursor-grabbing shrink-0"
            >
                <span className="text-white font-bold text-lg">Animar</span>
                <button
                    onClick={onClose}
                    className="w-[21px] h-[21px] bg-[#15161B] rounded-full flex items-center justify-center text-[#ff0054] hover:bg-black transition-colors"
                >
                    <X size={14} strokeWidth={4} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
                {([
                    { id: 'effects', label: 'Efeitos' },
                    { id: 'settings', label: 'Configurar' },
                    { id: 'hover', label: 'Hover' },
                ] as const).map(t => (
                    <button
                        key={t.id}
                        disabled={t.id === 'settings' && !canConfigure}
                        title={t.id === 'settings' && !canConfigure ? "Escolha primeiro uma animação" : undefined}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            "flex-1 h-8 rounded-md text-[12px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                            (tab === t.id && (t.id !== 'settings' || canConfigure)) ? "bg-[#1a1c22] text-white" : "text-[#666] hover:text-white"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {!hasTarget ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-10 text-center">
                    <span className="text-white text-sm font-semibold">Nenhum elemento selecionado</span>
                    <span className="text-[#777] text-xs leading-relaxed">
                        Clique num bloco, ou no ⚡ de uma secção ou coluna, para escolher a sua animação e o seu hover.
                    </span>
                </div>
            ) : tab === 'hover' ? (
                <HoverTab effect={hoverEffect || {}} onChange={(effect) => onHoverEffectChange?.(effect)} />
            ) : tab === 'settings' && canConfigure ? (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
                    <AnimationPreview animation={selectedId!} settings={settings} />

                    <RangeControl
                        label="Duração"
                        value={settings.duration ?? getPresetDuration(selectedId)}
                        min={0.1} max={4} step={0.1} unit="s"
                        isDefault={settings.duration === undefined}
                        onChange={(v) => updateSettings({ duration: v })}
                        onReset={() => updateSettings({ duration: undefined })}
                    />
                    <RangeControl
                        label="Atraso"
                        value={settings.delay ?? 0}
                        min={0} max={4} step={0.1} unit="s"
                        isDefault={!settings.delay}
                        onChange={(v) => updateSettings({ delay: v || undefined })}
                        onReset={() => updateSettings({ delay: undefined })}
                    />
                    <RangeControl
                        label="Intensidade"
                        value={settings.intensity ?? 100}
                        min={0} max={250} step={10} unit="%"
                        isDefault={settings.intensity === undefined || settings.intensity === 100}
                        onChange={(v) => updateSettings({ intensity: v === 100 ? undefined : v })}
                        onReset={() => updateSettings({ intensity: undefined })}
                    />

                    <Segmented<AnimationEasing | 'preset'>
                        label="Curva"
                        value={settings.easing || 'preset'}
                        options={[
                            { id: 'preset', label: 'Padrão' },
                            { id: 'smooth', label: 'Suave' },
                            { id: 'in-out', label: 'Gradual' },
                            { id: 'linear', label: 'Linear' },
                            { id: 'spring', label: 'Mola' },
                        ]}
                        onChange={(v) => updateSettings({ easing: v === 'preset' ? undefined : v })}
                    />

                    <Segmented<'scroll' | 'load'>
                        label="Iniciar"
                        value={settings.trigger || 'scroll'}
                        options={[
                            { id: 'scroll', label: 'Ao aparecer no ecrã' },
                            { id: 'load', label: 'Ao abrir a página' },
                        ]}
                        onChange={(v) => updateSettings({ trigger: v === 'scroll' ? undefined : v })}
                    />

                    {(settings.trigger || 'scroll') === 'scroll' && (
                        <div className="flex justify-between items-center">
                            <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Repetir ao voltar ao ecrã</span>
                            <div
                                role="switch"
                                aria-checked={!!settings.replay}
                                className={cn(
                                    "w-[32px] h-[18px] rounded-[999px] relative cursor-pointer transition-colors",
                                    settings.replay ? "bg-[#ff0054]" : "bg-[#3F3F46]"
                                )}
                                onClick={() => updateSettings({ replay: !settings.replay || undefined })}
                            >
                                <div className={cn(
                                    "w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                    settings.replay ? "right-[2px]" : "left-[2px]"
                                )} />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => onAnimationSettingsChange?.({})}
                        className="h-9 rounded-md border border-[#2a2a30] text-[#aaa] hover:text-white hover:border-[#444] text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Repor predefinições
                    </button>
                </div>
            ) : (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid grid-cols-3 gap-[10px]">
                    {options.map((opt) => (
                        <AnimationOptionCard
                            key={opt.id}
                            id={opt.id}
                            label={opt.label}
                            icon={opt.icon}
                            selected={selectedId === opt.id}
                            onClick={() => {
                                setSelectedId(opt.id)
                                onSelectAnimation?.(opt.id)
                            }}
                        />
                    ))}
                </div>
            </div>
            )}
        </motion.div>
    )
}
