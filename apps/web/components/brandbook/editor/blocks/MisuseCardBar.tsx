"use client"

import React, { useRef } from "react"
import { ArrowLeft, ArrowRight, Check, CopyPlus, ImageOff, RotateCcw, SlidersHorizontal, Trash2, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SmoothColorInput } from "../SmoothColorInput"
import { ColorRow, Range, Title } from "./panelControls"
import {
    MISUSE_EFFECTS, misuseEffect,
    type MisuseCard, type MisuseCardStyle, type MisuseEffect, type resolveLogoMisuseSettings,
} from "./logoMisuse"

type Resolved = ReturnType<typeof resolveLogoMisuseSettings>

interface Props {
    card: MisuseCard
    index: number
    count: number
    s: Resolved
    /** The card's look panel (under the bar) */
    open: boolean
    onOpenChange: (open: boolean) => void
    onChange: (patch: Partial<MisuseCard>) => void
    onMove: (direction: -1 | 1) => void
    onDuplicate: () => void
    onDelete: () => void
    onUpload: (file: File) => void
}

const Sep = () => <div className="w-px h-4 bg-[#333] mx-1 shrink-0" />

/** Round colour button of the bar (the value shows as its fill) */
const Swatch = ({ title, value, onChange }: { title: string, value: string, onChange: (c: string) => void }) => (
    <label title={title} className="relative w-8 h-8 rounded flex items-center justify-center hover:bg-white/10 cursor-pointer shrink-0">
        <span className="w-[18px] h-[18px] rounded-full border border-white/25" style={{ background: value }} />
        <SmoothColorInput
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
    </label>
)

/** Context bar of one card: kind, what it shows, its colours, its own look, order, duplicate, delete */
export const MisuseCardBar = ({ card, index, count, s, open, onOpenChange, onChange, onMove, onDuplicate, onDelete, onUpload }: Props) => {
    const fileRef = useRef<HTMLInputElement>(null)
    const style = card.style || {}
    const setStyle = (patch: Partial<MisuseCardStyle>) => onChange({ style: { ...style, ...patch } })
    const hasStyle = Object.values(style).some(v => v !== undefined)
    const effect = misuseEffect(card.effect)
    const hasColor = ['recolor', 'glow', 'outline', 'lowContrast'].includes(card.effect)
    const hasAngle = card.effect === 'rotate' || card.effect === 'skew'
    const showsCaption = s.layout !== 'tiles'

    const button = (title: string, icon: React.ReactNode, onClick?: () => void, opts: { danger?: boolean, active?: boolean, disabled?: boolean } = {}) => (
        <button
            type="button"
            title={title}
            disabled={opts.disabled || !onClick}
            onClick={(e) => { e.stopPropagation(); onClick?.() }}
            className={cn(
                "w-8 h-8 rounded flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 disabled:pointer-events-none",
                opts.active ? "text-white bg-white/10" : "text-[#97A1B3]",
                opts.danger ? "hover:text-[#FF0054] hover:bg-[#FF0054]/10" : "hover:text-white hover:bg-white/10"
            )}
        >
            {icon}
        </button>
    )

    // The look panel opens above the bar, so the bar stays next to its card
    return (
        <div className="flex flex-col-reverse items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-0.5 bg-[#15161B] border border-[#333] rounded-md px-1.5 h-[40px] shadow-lg whitespace-nowrap text-[#97A1B3]">
                <span className="text-xs font-medium px-2">Cartão {index + 1}</span>
                <Sep />
                <button
                    type="button"
                    title={card.kind === 'do' ? 'Uso correto (clique para marcar como erro)' : 'Erro (clique para marcar como uso correto)'}
                    onClick={(e) => { e.stopPropagation(); onChange({ kind: card.kind === 'do' ? 'dont' : 'do' }) }}
                    className="h-7 px-2 rounded flex items-center gap-1 text-[11px] font-bold hover:bg-white/10 shrink-0"
                    style={{ color: card.kind === 'do' ? s.doColor : s.dontColor }}
                >
                    {card.kind === 'do' ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <X className="w-3.5 h-3.5" strokeWidth={3} />}
                    {card.kind === 'do' ? s.doLabel : s.dontLabel}
                </button>
                <select
                    value={card.effect}
                    title="O que o cartão mostra"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        const next = misuseEffect(e.target.value as MisuseEffect)
                        const caption = card.caption === effect.caption ? next.caption : card.caption
                        onChange({ effect: next.id, caption, color: next.color, angle: next.angle, kind: next.id === 'none' ? 'do' : card.effect === 'none' ? 'dont' : card.kind })
                    }}
                    className="h-7 max-w-[118px] bg-transparent hover:bg-white/10 rounded px-1.5 text-[12px] text-white outline-none cursor-pointer shrink-0"
                >
                    {MISUSE_EFFECTS.map(e => <option key={e.id} value={e.id} className="bg-[#15161B]">{e.label}</option>)}
                </select>
                {hasColor && <Swatch title="Cor do efeito" value={card.color || '#00D84A'} onChange={(color) => onChange({ color })} />}
                <Sep />
                <Swatch title="Fundo da imagem" value={style.previewBackground || s.previewBackground} onChange={(previewBackground) => setStyle({ previewBackground })} />
                {showsCaption && <Swatch title="Fundo do texto" value={style.captionBackground || s.captionBackground} onChange={(captionBackground) => setStyle({ captionBackground })} />}
                {button('Mais opções do cartão', <SlidersHorizontal className="w-4 h-4" />, () => onOpenChange(!open), { active: open })}
                <Sep />
                {button('Mover para a esquerda', <ArrowLeft className="w-4 h-4" />, () => onMove(-1), { disabled: index === 0 })}
                {button('Mover para a direita', <ArrowRight className="w-4 h-4" />, () => onMove(1), { disabled: index === count - 1 })}
                {button('Duplicar cartão', <CopyPlus className="w-4 h-4" />, onDuplicate)}
                {button('Eliminar cartão', <Trash2 className="w-4 h-4" />, onDelete, { danger: true })}
            </div>

            {open && (
                <div className="w-[300px] rounded-xl bg-[#1F1F25] border border-white/5 shadow-2xl p-4 flex flex-col gap-4 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex flex-col gap-3">
                        <Title action={hasStyle ? (
                            <button type="button" onClick={() => onChange({ style: undefined })} className="text-[10px] text-[#666] hover:text-white flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Como os outros
                            </button>
                        ) : undefined}>Este cartão</Title>
                        <ColorRow label="Fundo da imagem" value={style.previewBackground || s.previewBackground} onChange={(previewBackground) => setStyle({ previewBackground })} />
                        {showsCaption && <ColorRow label="Fundo do texto" value={style.captionBackground || s.captionBackground} onChange={(captionBackground) => setStyle({ captionBackground })} />}
                        <ColorRow label="Cor do texto" value={style.captionColor || s.captionColor} onChange={(captionColor) => setStyle({ captionColor })} />
                        <ColorRow label="Borda" value={style.borderColor || s.borderColor} onChange={(borderColor) => setStyle({ borderColor })} />
                        <Range label="Cantos" value={style.radius ?? s.radius} min={0} max={48} unit="px" onChange={(radius) => setStyle({ radius })} />
                        <Range label="Tamanho do logótipo" value={style.logoScale ?? 100} min={30} max={250} step={5} unit="%" onChange={(logoScale) => setStyle({ logoScale })} />
                        {hasAngle && <Range label="Ângulo" value={card.angle ?? 18} min={-45} max={45} unit="°" onChange={(angle) => onChange({ angle })} />}
                    </div>
                    <div className="h-px bg-[#333]" />
                    <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }} />
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="flex-1 h-8 rounded-md bg-[#1A1C23] text-[12px] text-[#97A1B3] hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                            title="Usar uma imagem própria do erro em vez do efeito"
                        >
                            <Upload className="w-3.5 h-3.5" /> {card.image ? 'Trocar imagem' : 'Imagem própria'}
                        </button>
                        {card.image && (
                            <button type="button" title="Voltar ao logótipo com efeito" onClick={() => onChange({ image: undefined })} className="w-9 h-8 rounded-md bg-[#1A1C23] text-[#97A1B3] hover:text-white flex items-center justify-center">
                                <ImageOff className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
