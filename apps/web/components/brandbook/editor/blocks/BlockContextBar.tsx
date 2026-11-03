"use client"

import { CollapsibleBar } from "../CollapsibleBar"
import React from "react"
import { Settings, ArrowUp, ArrowDown, Copy, CopyPlus, Check, Trash2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BlockActions {
    onMove?: (direction: 'up' | 'down') => void
    onCopy?: () => void
    onDuplicate?: () => void
    onDelete?: () => void
}

/** Copy button feedback (check mark for a moment) */
const useCopied = () => {
    const [copied, setCopied] = React.useState(false)
    const flash = () => { setCopied(true); window.setTimeout(() => setCopied(false), 1500) }
    return [copied, flash] as const
}

/** Hover state with a short grace period, so the pointer can travel to a toolbar on the top layer */
export const useHoverIntent = (delay = 220) => {
    const [hovered, setHovered] = React.useState(false)
    const timer = React.useRef<number | null>(null)
    React.useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])
    const bind = React.useMemo(() => ({
        onMouseEnter: () => { if (timer.current) window.clearTimeout(timer.current); setHovered(true) },
        onMouseLeave: () => {
            if (timer.current) window.clearTimeout(timer.current)
            timer.current = window.setTimeout(() => setHovered(false), delay)
        },
    }), [delay])
    return [hovered, bind] as const
}

/** Context bar of a block: name, settings (gear), animate, move, copy, duplicate, delete */
const BlockContextBarBar = ({ label, onSettings, onAnimate, onMove, onCopy, onDuplicate, onDelete }: BlockActions & {
    label: string
    onSettings?: () => void
    onAnimate?: () => void
}) => {
    const [copied, flash] = useCopied()
    const button = (title: string, icon: React.ReactNode, onClick?: () => void, danger?: boolean) => (
        <button
            type="button"
            title={title}
            disabled={!onClick}
            onClick={(e) => { e.stopPropagation(); onClick?.() }}
            className={cn(
                "w-8 h-8 rounded flex items-center justify-center text-[#97A1B3] transition-colors disabled:opacity-30 disabled:pointer-events-none",
                danger ? "hover:text-[#FF0054] hover:bg-[#FF0054]/10" : "hover:text-white hover:bg-white/10"
            )}
        >
            {icon}
        </button>
    )
    return (
        <div className="flex items-center gap-0.5 bg-[#15161B] border border-[#333] rounded-md px-1.5 h-[40px] shadow-lg whitespace-nowrap">
            <span className="text-[#97A1B3] text-xs font-medium px-2">{label}</span>
            <div className="w-px h-4 bg-[#333] mx-1" />
            {button('Definições', <Settings className="w-4 h-4" />, onSettings)}
            {button('Animar bloco', <Zap className="w-4 h-4" />, onAnimate)}
            <div className="w-px h-4 bg-[#333] mx-1" />
            {button('Mover para cima', <ArrowUp className="w-4 h-4" />, onMove ? () => onMove('up') : undefined)}
            {button('Mover para baixo', <ArrowDown className="w-4 h-4" />, onMove ? () => onMove('down') : undefined)}
            {button(copied ? 'Copiado' : 'Copiar', copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />, onCopy ? () => { onCopy(); flash() } : undefined)}
            {button('Duplicar', <CopyPlus className="w-4 h-4" />, onDuplicate)}
            {button('Eliminar', <Trash2 className="w-4 h-4" />, onDelete, true)}
        </div>
    )
}

/** Action row at the bottom of a block's settings panel */
export const PanelActions = ({ onMove, onCopy, onDuplicate, onDelete }: BlockActions) => {
    const [copied, flash] = useCopied()
    const button = (title: string, icon: React.ReactNode, onClick?: () => void, danger?: boolean) => (
        <button
            type="button"
            title={title}
            disabled={!onClick}
            onClick={onClick}
            className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-[#97A1B3] transition-colors disabled:opacity-30 disabled:pointer-events-none",
                danger ? "hover:text-[#FF0054] hover:bg-[#FF0054]/10" : "hover:text-white hover:bg-white/5"
            )}
        >
            {icon}
        </button>
    )
    return (
        <div className="border-t border-white/5 px-3 h-[52px] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
                {button('Mover para cima', <ArrowUp className="w-4 h-4" />, onMove ? () => onMove('up') : undefined)}
                {button('Mover para baixo', <ArrowDown className="w-4 h-4" />, onMove ? () => onMove('down') : undefined)}
            </div>
            <div className="flex items-center gap-1">
                {button(copied ? 'Copiado' : 'Copiar', copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />, onCopy ? () => { onCopy(); flash() } : undefined)}
                {button('Duplicar', <CopyPlus className="w-4 h-4" />, onDuplicate)}
                <div className="w-px h-5 bg-white/10 mx-1" />
                {button('Eliminar', <Trash2 className="w-4 h-4" />, onDelete, true)}
            </div>
        </div>
    )
}

/** The bar folded into a «+» circle until it is opened (less clutter while editing) */
export const BlockContextBar = (props: React.ComponentProps<typeof BlockContextBarBar>) => (
    <CollapsibleBar><BlockContextBarBar {...props} /></CollapsibleBar>
)
