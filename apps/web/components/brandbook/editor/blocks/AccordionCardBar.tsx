"use client"

import { CollapsibleBar } from "../CollapsibleBar"
import React, { useState } from "react"
import { ArrowLeft, ArrowRight, Blend, CopyPlus, Settings2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SmoothColorInput } from "../SmoothColorInput"
import { normalizeHex, type AccordionColor } from "./colorAccordion"

/** Round colour button (the value shows as its fill) */
const Swatch = ({ title, value, onChange }: { title: string, value: string, onChange: (c: string) => void }) => (
    <label title={title} className="relative w-8 h-8 rounded flex items-center justify-center hover:bg-white/10 cursor-pointer shrink-0">
        <span className="w-[18px] h-[18px] rounded-full border border-white/25" style={{ background: value }} />
        <SmoothColorInput
            type="color"
            value={normalizeHex(value).toLowerCase()}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
    </label>
)

/** Hex typed in the bar: applied once it is a valid colour */
const HexField = ({ value, onChange }: { value: string, onChange: (hex: string) => void }) => {
    const [draft, setDraft] = useState<string | null>(null)
    return (
        <input
            value={draft ?? normalizeHex(value)}
            onChange={(e) => {
                setDraft(e.target.value)
                if (/^#?[0-9a-f]{6}$/i.test(e.target.value.trim())) onChange(normalizeHex(e.target.value))
            }}
            onBlur={() => setDraft(null)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            spellCheck={false}
            className="w-[78px] h-7 bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded px-2 text-[12px] font-mono uppercase text-white outline-none shrink-0"
            title="Código hexadecimal"
        />
    )
}

/** Context bar of one colour card: its colour(s), hex, gradient on/off, settings, order, duplicate, delete */
const AccordionCardBarBar = ({ color, index, count, onChange, onSettings, onMove, onDuplicate, onDelete }: {
    color: AccordionColor
    index: number
    count: number
    onChange: (patch: Partial<AccordionColor>) => void
    onSettings: () => void
    onMove: (dir: -1 | 1) => void
    onDuplicate: () => void
    onDelete: () => void
}) => {
    const gradient = color.gradient?.length ? color.gradient : null
    const button = (title: string, icon: React.ReactNode, onClick: () => void, opts: { danger?: boolean, disabled?: boolean, active?: boolean } = {}) => (
        <button
            type="button"
            title={title}
            disabled={opts.disabled}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className={cn(
                "w-8 h-8 rounded flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 disabled:pointer-events-none",
                opts.active ? "text-white bg-white/10" : "text-[#97A1B3]",
                opts.danger ? "hover:text-[#FF0054] hover:bg-[#FF0054]/10" : "hover:text-white hover:bg-white/10"
            )}
        >
            {icon}
        </button>
    )
    return (
        <div className="flex items-center gap-0.5 bg-[#15161B] border border-[#333] rounded-md px-1.5 h-[40px] shadow-lg whitespace-nowrap text-[#97A1B3]" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-medium px-2 max-w-[120px] truncate">{color.name || `Cor ${index + 1}`}</span>
            <div className="w-px h-4 bg-[#333] mx-1 shrink-0" />
            {gradient ? (
                <>
                    <Swatch title="Cor de cima" value={gradient[0]} onChange={(c) => onChange({ gradient: [c, gradient[gradient.length - 1]] })} />
                    <Swatch title="Cor de baixo" value={gradient[gradient.length - 1]} onChange={(c) => onChange({ gradient: [gradient[0], c], hex: c })} />
                </>
            ) : (
                <>
                    <Swatch title="Mudar a cor" value={color.hex} onChange={(hex) => onChange({ hex })} />
                    <HexField value={color.hex} onChange={(hex) => onChange({ hex })} />
                </>
            )}
            {button(gradient ? 'Passar a cor sólida' : 'Passar a gradiente', <Blend className="w-4 h-4" />,
                () => onChange(gradient ? { gradient: undefined, hex: gradient[gradient.length - 1] } : { gradient: ['#FFFFFF', normalizeHex(color.hex)] }),
                { active: !!gradient })}
            {button('Mais opções desta cor', <Settings2 className="w-4 h-4" />, onSettings)}
            <div className="w-px h-4 bg-[#333] mx-1 shrink-0" />
            {button('Mover para a esquerda', <ArrowLeft className="w-4 h-4" />, () => onMove(-1), { disabled: index === 0 })}
            {button('Mover para a direita', <ArrowRight className="w-4 h-4" />, () => onMove(1), { disabled: index === count - 1 })}
            {button('Duplicar cor', <CopyPlus className="w-4 h-4" />, onDuplicate)}
            {button('Eliminar cor', <Trash2 className="w-4 h-4" />, onDelete, { danger: true, disabled: count <= 1 })}
        </div>
    )
}

/** The bar folded into a «+» circle until it is opened (less clutter while editing) */
export const AccordionCardBar = (props: React.ComponentProps<typeof AccordionCardBarBar>) => (
    <CollapsibleBar><AccordionCardBarBar {...props} /></CollapsibleBar>
)
