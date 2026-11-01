"use client"

import React, { useState } from "react"
import { Ban } from "lucide-react"
import { SmoothColorInput } from "../SmoothColorInput"
import { BUTTON_ICONS, ButtonIconSettings } from "./buttonIcons"
import { cn } from "@/lib/utils"
import {
    BUTTON_STYLE_PRESETS, BUTTON_STYLE_KEYS, BUTTON_ANIMATIONS, BUTTON_ANIMATION_SPEEDS,
    getButtonAnimationClass, ButtonAnimationKind,
} from "./buttonPresets"

interface TabProps {
    settings: any
    onUpdate: (updates: any) => void
}

/** Ready-made looks: applying one replaces the look keys, keeps the size unless the preset sets it */
export function ButtonStylesTab({ settings, onUpdate }: TabProps) {
    const apply = (presetId: string) => {
        const preset = BUTTON_STYLE_PRESETS.find(p => p.id === presetId)
        if (!preset) return
        const style: Record<string, unknown> = { ...(settings.style || {}) }
        for (const key of BUTTON_STYLE_KEYS) {
            const keepSize = (key === 'width' || key === 'height' || key === 'fontSize') && !(key in preset.style)
            if (!keepSize) delete style[key]
        }
        delete style.textDecoration
        delete style.textUnderlineOffset
        onUpdate({ style: { ...style, ...preset.style }, stylePreset: preset.id, ...(preset.icon ? { icon: preset.icon } : {}) })
    }

    return (
        <div className="p-4 grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1 min-h-0 content-start">
            {BUTTON_STYLE_PRESETS.map(preset => (
                <button
                    key={preset.id}
                    onClick={() => apply(preset.id)}
                    className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                        settings.stylePreset === preset.id ? "border-[#FF0054] bg-[#FF0054]/5" : "border-[#222] hover:border-[#444]",
                        // Light and glass presets need a dark backdrop to be seen
                        preset.id === 'glass' ? "bg-[#2a2a35]" : "bg-[#18181d]"
                    )}
                >
                    <span
                        className="flex items-center justify-center gap-1.5 max-w-full truncate px-3"
                        style={{
                            ...preset.style,
                            width: preset.icon?.position === 'only' ? 36 : 112,
                            height: preset.icon?.position === 'only' ? 36 : 32,
                            fontSize: Math.min(13, parseInt(String(preset.style.fontSize || 13))),
                            borderStyle: preset.style.borderWidth ? 'solid' : undefined,
                        } as React.CSSProperties}
                    >
                        {(() => {
                            const Icon = preset.icon ? BUTTON_ICONS[preset.icon.name] : undefined
                            const icon = Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: preset.icon?.color }} />
                            if (preset.icon?.position === 'only') return icon
                            return <>{preset.icon?.position === 'left' && icon}Botão{preset.icon?.position === 'right' && icon}</>
                        })()}
                    </span>
                    <span className="text-[11px] text-[#888]">{preset.name}</span>
                </button>
            ))}
        </div>
    )
}

/** Icon of the button: which one, where, size, color and a hover nudge */
export function ButtonIconTab({ settings, onUpdate }: TabProps) {
    const icon = settings.icon as ButtonIconSettings | undefined
    const update = (patch: Partial<ButtonIconSettings>) =>
        onUpdate({ icon: { name: icon?.name || 'arrow-right', position: 'right', size: 18, ...icon, ...patch } })

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {icon && (
                <div className="px-4 pt-4 pb-3 flex flex-col gap-3 border-b border-[#222] shrink-0">
                    <div className="flex gap-1 bg-[#18181d] rounded-md p-1">
                        {([['left', 'Esquerda'], ['right', 'Direita'], ['only', 'Só ícone']] as const).map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() => update({ position: id })}
                                className={cn("flex-1 h-7 rounded text-[11px] font-medium transition-colors", (icon.position || 'right') === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-[#888]">Tamanho</span>
                        <input
                            type="range"
                            min={12}
                            max={32}
                            value={icon.size || 18}
                            onChange={(e) => update({ size: Number(e.target.value) })}
                            className="flex-1 accent-[#FF0054] cursor-pointer"
                        />
                        <span className="text-[11px] text-white w-9 text-right">{icon.size || 18}px</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#888]">Cor</span>
                        <div className="flex items-center gap-2">
                            <label className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 cursor-pointer" style={{ backgroundColor: icon.color || settings.style?.color || '#ffffff' }}>
                                <SmoothColorInput
                                    value={icon.color || settings.style?.color || '#ffffff'}
                                    onChange={(e) => update({ color: e.target.value })}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </label>
                            <button
                                onClick={() => update({ color: undefined })}
                                className={cn("text-[11px]", icon.color ? "text-[#888] hover:text-white" : "text-[#444]")}
                                title="Usar a cor do texto do botão"
                            >
                                Cor do texto
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-[11px] text-[#888]">Mover ao passar o rato</span>
                        <input
                            type="checkbox"
                            checked={!!icon.hoverShift}
                            onChange={(e) => update({ hoverShift: e.target.checked || undefined })}
                            className="accent-[#FF0054] w-4 h-4"
                        />
                    </label>
                </div>
            )}

            <div className="p-4 grid grid-cols-6 gap-1.5 overflow-y-auto custom-scrollbar flex-1 min-h-0 content-start">
                <button
                    onClick={() => onUpdate({ icon: undefined })}
                    title="Sem ícone"
                    className={cn("aspect-square rounded-md border flex items-center justify-center transition-colors", !icon ? "border-[#FF0054] text-[#FF0054] bg-[#FF0054]/10" : "border-[#222] text-[#666] hover:text-white")}
                >
                    <Ban className="w-4 h-4" />
                </button>
                {Object.entries(BUTTON_ICONS).map(([name, Icon]) => (
                    <button
                        key={name}
                        onClick={() => update({ name })}
                        title={name}
                        className={cn(
                            "aspect-square rounded-md border flex items-center justify-center transition-colors",
                            icon?.name === name ? "border-[#FF0054] text-white bg-[#FF0054]/10" : "border-[#222] text-[#999] hover:text-white hover:border-[#444]"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                ))}
            </div>
        </div>
    )
}

/** ~50 animations to pick from, each previewed on a sample button (hover ones play on hover) */
export function ButtonAnimationsTab({ settings, onUpdate }: TabProps) {
    const [kind, setKind] = useState<'all' | ButtonAnimationKind>('all')
    const current: string | undefined = settings.buttonAnimation
    const speed = settings.buttonAnimationSpeed ?? 1
    const list = BUTTON_ANIMATIONS.filter(a => kind === 'all' || a.kind === kind)

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 pt-4 pb-3 flex flex-col gap-3 border-b border-[#222] shrink-0">
                <div className="flex gap-1 bg-[#18181d] rounded-md p-1">
                    {([['all', 'Todas'], ['hover', 'Ao passar o rato'], ['loop', 'Contínuas']] as const).map(([id, label]) => (
                        <button
                            key={id}
                            onClick={() => setKind(id)}
                            className={cn("flex-1 h-7 rounded text-[11px] font-medium transition-colors", kind === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#888]">Velocidade</span>
                    <div className="flex gap-1">
                        {BUTTON_ANIMATION_SPEEDS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => onUpdate({ buttonAnimationSpeed: s.value })}
                                className={cn("h-6 px-2 rounded text-[11px] transition-colors", speed === s.value ? "bg-white/15 text-white" : "text-[#777] hover:text-white")}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1 min-h-0 content-start">
                <button
                    onClick={() => onUpdate({ buttonAnimation: undefined })}
                    className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-3 bg-[#18181d] transition-colors",
                        !current ? "border-[#FF0054] bg-[#FF0054]/5" : "border-[#222] hover:border-[#444]"
                    )}
                >
                    <span className="h-8 flex items-center justify-center text-[#666]"><Ban className="w-5 h-5" /></span>
                    <span className="text-[11px] text-[#888]">Nenhuma</span>
                </button>
                {list.map(animation => (
                    <button
                        key={animation.id}
                        onClick={() => onUpdate({ buttonAnimation: animation.id })}
                        className={cn(
                            "flex flex-col items-center gap-2 rounded-lg border p-3 bg-[#18181d] transition-colors",
                            current === animation.id ? "border-[#FF0054] bg-[#FF0054]/5" : "border-[#222] hover:border-[#444]"
                        )}
                        title={animation.kind === 'hover' ? 'Passe o rato sobre o botão de exemplo' : undefined}
                    >
                        <span
                            className={cn("flex items-center justify-center w-[104px] h-8 rounded-full bg-[#FF0054] text-white text-[12px] font-medium", getButtonAnimationClass(animation.id))}
                            style={{ '--ba-s': speed } as React.CSSProperties}
                        >
                            Botão
                        </span>
                        <span className="text-[11px] text-[#888] text-center leading-tight">{animation.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
