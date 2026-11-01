"use client"

import React, { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Plus, X, Copy, CopyPlus, Check, Trash2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { SmoothColorInput } from "../SmoothColorInput"
import { NAV_ICONS } from "../navigation/navigationPresets"
import { MarqueeSeparatorMark } from "./MarqueeBlock"
import { MARQUEE_DEFAULTS, MARQUEE_SEPARATORS, newMarqueeRowId, type MarqueeContent, type MarqueeRow, type MarqueeSettings } from "./marquee"

type Resolved = typeof MARQUEE_DEFAULTS
const MAX_ROWS = 3

interface Props {
    content: MarqueeContent
    resolved: Resolved
    onChange: (content: MarqueeContent) => void
    onClose: () => void
    onMove?: (direction: 'up' | 'down') => void
    onCopy?: () => void
    onDuplicate?: () => void
    onDelete?: () => void
}

// ---------- small controls (outside the panel so pickers / inputs keep their state while typing) ----------

const Title = ({ children, action }: { children: React.ReactNode, action?: React.ReactNode }) => (
    <div className="flex items-center justify-between">
        <span className="text-[#666] text-[10px] font-medium uppercase tracking-wider">{children}</span>
        {action}
    </div>
)

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
        <span>{label}</span>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn("w-[32px] h-[18px] rounded-full relative transition-colors shrink-0", checked ? "bg-[#FF0054]" : "bg-[#3F3F46]")}
        >
            <span className={cn("absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all", checked ? "right-[2px]" : "left-[2px]")} />
        </button>
    </div>
)

const ColorRow = ({ label, value, onChange, allowNone }: { label: string, value: string, onChange: (c: string) => void, allowNone?: boolean }) => {
    const none = value === 'transparent'
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="truncate">{label}</span>
            <div className="flex items-center gap-2 shrink-0">
                {allowNone && (
                    <button type="button" onClick={() => onChange(none ? '#0B0B0D' : 'transparent')} className={cn("text-[10px] font-bold px-1.5 h-6 rounded", none ? "bg-[#FF0054] text-white" : "text-[#666] hover:text-white")}>
                        Sem cor
                    </button>
                )}
                <span className="font-mono text-[11px] uppercase text-[#666] w-[58px] text-right">{none ? '—' : value}</span>
                <label
                    className="w-7 h-7 rounded-full border border-white/15 cursor-pointer relative overflow-hidden"
                    style={{ background: none ? 'repeating-conic-gradient(#333 0 25%, #222 0 50%) 0 0 / 8px 8px' : value }}
                >
                    <SmoothColorInput
                        type="color"
                        value={none ? '#000000' : value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                </label>
            </div>
        </div>
    )
}

const Range = ({ label, value, min, max, step = 1, unit, onChange }: { label: string, value: number, min: number, max: number, step?: number, unit: string, onChange: (v: number) => void }) => (
    <div className="flex flex-col gap-2">
        <Title action={<span className="text-[11px] text-white tabular-nums">{value}{unit}</span>}>{label}</Title>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#FF0054] h-1 cursor-pointer" />
    </div>
)

const Segmented = <T extends string | number>({ value, options, onChange, cols }: { value: T, options: { id: T, label: React.ReactNode, title?: string }[], onChange: (v: T) => void, cols?: number }) => (
    <div className="grid gap-1 bg-[#1A1C23] p-1 rounded-md" style={{ gridTemplateColumns: `repeat(${cols || options.length}, minmax(0, 1fr))` }}>
        {options.map(o => (
            <button
                key={String(o.id)}
                type="button"
                title={o.title}
                onClick={() => onChange(o.id)}
                className={cn("h-7 rounded text-[10px] font-bold transition-colors flex items-center justify-center", value === o.id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
            >
                {o.label}
            </button>
        ))}
    </div>
)

/** Texts of one band: edit, reorder, remove, add */
const RowEditor = ({ row, index, canRemove, onChange, onRemove }: {
    row: MarqueeRow, index: number, canRemove: boolean
    onChange: (row: MarqueeRow) => void
    onRemove: () => void
}) => {
    const setItem = (i: number, text: string) => onChange({ ...row, items: row.items.map((t, j) => j === i ? text : t) })
    const moveItem = (i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= row.items.length) return
        const items = [...row.items]
        ;[items[i], items[j]] = [items[j], items[i]]
        onChange({ ...row, items })
    }
    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#16171C] border border-white/5">
            <div className="flex items-center justify-between">
                <span className="text-white text-[13px] font-medium">Faixa {index + 1}</span>
                {canRemove && (
                    <button type="button" title="Remover faixa" onClick={onRemove} className="text-[#666] hover:text-[#FF0054]">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Segmented
                    value={row.direction}
                    options={[
                        { id: 'left', label: <ArrowLeft className="w-3.5 h-3.5" />, title: 'Para a esquerda' },
                        { id: 'right', label: <ArrowRight className="w-3.5 h-3.5" />, title: 'Para a direita' },
                    ]}
                    onChange={(direction) => onChange({ ...row, direction })}
                />
                <Segmented
                    value={row.outline ? 'outline' : 'solid'}
                    options={[
                        { id: 'solid', label: 'Cheio', title: 'Letras cheias' },
                        { id: 'outline', label: 'Contorno', title: 'Só o contorno das letras' },
                    ]}
                    onChange={(v) => onChange({ ...row, outline: v === 'outline' })}
                />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
                {row.items.map((text, i) => (
                    <div key={i} className="flex items-center gap-1 group/item">
                        <input
                            value={text}
                            placeholder="Texto"
                            onChange={(e) => setItem(i, e.target.value)}
                            className="flex-1 min-w-0 h-8 bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 text-[13px] text-white outline-none"
                        />
                        <button type="button" title="Subir" disabled={i === 0} onClick={() => moveItem(i, -1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20">
                            <ArrowUp className="w-3 h-3" />
                        </button>
                        <button type="button" title="Descer" disabled={i === row.items.length - 1} onClick={() => moveItem(i, 1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20">
                            <ArrowDown className="w-3 h-3" />
                        </button>
                        <button type="button" title="Remover" disabled={row.items.length <= 1} onClick={() => onChange({ ...row, items: row.items.filter((_, j) => j !== i) })} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-[#FF0054] disabled:opacity-20">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={() => onChange({ ...row, items: [...row.items, 'Novo texto'] })}
                className="h-8 rounded border border-dashed border-[#333] text-[12px] text-[#97A1B3] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5 transition-colors"
            >
                <Plus className="w-3.5 h-3.5" /> Adicionar texto
            </button>
        </div>
    )
}

export const MarqueeSettingsPanel = ({ content, resolved: s, onChange, onClose, onMove, onCopy, onDuplicate, onDelete }: Props) => {
    const [tab, setTab] = useState<'content' | 'style' | 'motion'>('content')
    const [copied, setCopied] = useState(false)

    // Drag by the header
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const drag = useRef<{ x: number, y: number, px: number, py: number } | null>(null)
    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!drag.current) return
            setPosition({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y })
        }
        const up = () => { drag.current = null }
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', up)
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    }, [])

    const set = (patch: Partial<MarqueeSettings>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const setRow = (i: number, row: MarqueeRow) => onChange({ ...content, rows: content.rows.map((r, j) => j === i ? row : r) })

    const actionButton = (title: string, icon: React.ReactNode, onClick?: () => void, danger?: boolean) => (
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
        <div
            className="w-[320px] max-h-[min(680px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div
                className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none"
                onMouseDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y } }}
            >
                <span className="text-white font-medium text-lg">Texto em loop</span>
                <button
                    type="button"
                    className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={onClose}
                >
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['content', 'Textos'], ['style', 'Estilo'], ['motion', 'Movimento']] as const).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'content' && (
                    <>
                        {content.rows.map((row, i) => (
                            <RowEditor
                                key={row.id}
                                row={row}
                                index={i}
                                canRemove={content.rows.length > 1}
                                onChange={(r) => setRow(i, r)}
                                onRemove={() => onChange({ ...content, rows: content.rows.filter((_, j) => j !== i) })}
                            />
                        ))}
                        {content.rows.length < MAX_ROWS && (
                            <button
                                type="button"
                                onClick={() => {
                                    const last = content.rows[content.rows.length - 1]
                                    onChange({
                                        ...content,
                                        rows: [...content.rows, {
                                            id: newMarqueeRowId(),
                                            items: [...(last?.items || ['Texto'])],
                                            // A new band goes the other way, for the two-direction look
                                            direction: last?.direction === 'left' ? 'right' : 'left',
                                            outline: !last?.outline,
                                        }],
                                    })
                                }}
                                className="h-9 rounded-lg bg-[#16171C] text-[12px] font-medium text-[#97A1B3] hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Adicionar faixa (sentido oposto)
                            </button>
                        )}
                    </>
                )}

                {tab === 'style' && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Title>Texto</Title>
                            <ColorRow label="Cor" value={s.textColor} onChange={(c) => set({ textColor: c })} />
                            <Range label="Tamanho" value={s.fontSize} min={12} max={200} unit="px" onChange={(v) => set({ fontSize: v })} />
                            <div className="flex flex-col gap-2">
                                <Title>Peso</Title>
                                <Segmented
                                    value={s.fontWeight}
                                    options={[300, 400, 500, 600, 700, 800].map(w => ({ id: w, label: String(w) }))}
                                    onChange={(v) => set({ fontWeight: v })}
                                />
                            </div>
                            <Range label="Espaço entre letras" value={s.letterSpacing} min={-10} max={30} step={0.5} unit="%" onChange={(v) => set({ letterSpacing: v })} />
                            <Toggle label="Maiúsculas" checked={s.uppercase} onChange={(v) => set({ uppercase: v })} />
                        </div>

                        <div className="h-px bg-[#333]" />

                        <div className="flex flex-col gap-3">
                            <Title>Separador</Title>
                            <div className="grid grid-cols-5 gap-1 bg-[#1A1C23] p-1 rounded-md">
                                {MARQUEE_SEPARATORS.map(sep => (
                                    <button
                                        key={sep.id}
                                        type="button"
                                        title={sep.label}
                                        onClick={() => set({ separator: sep.id })}
                                        className={cn("h-10 rounded flex items-center justify-center transition-colors", s.separator === sep.id ? "bg-[#FF0054]" : "hover:bg-white/5")}
                                    >
                                        {sep.id === 'none'
                                            ? <X className="w-3.5 h-3.5" />
                                            : <span className="scale-[0.85] flex items-center"><MarqueeSeparatorMark s={{ ...s, separator: sep.id, separatorSize: 6, separatorColor: s.separator === sep.id ? '#FFFFFF' : '#97A1B3' }} /></span>}
                                    </button>
                                ))}
                            </div>
                            {s.separator === 'icon' && (
                                <div className="grid grid-cols-8 gap-1 max-h-[132px] overflow-y-auto custom-scrollbar bg-[#1A1C23] p-1 rounded-md">
                                    {Object.entries(NAV_ICONS).map(([name, Icon]) => (
                                        <button
                                            key={name}
                                            type="button"
                                            title={name}
                                            onClick={() => set({ separatorIcon: name })}
                                            className={cn("h-8 rounded flex items-center justify-center transition-colors", s.separatorIcon === name ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white hover:bg-white/5")}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {s.separator !== 'none' && (
                                <>
                                    <ColorRow label="Cor do separador" value={s.separatorColor} onChange={(c) => set({ separatorColor: c })} />
                                    <Range label="Tamanho do separador" value={s.separatorSize} min={2} max={40} unit="px" onChange={(v) => set({ separatorSize: v })} />
                                </>
                            )}
                            <Range label="Espaço entre textos" value={s.gap} min={8} max={160} unit="px" onChange={(v) => set({ gap: v })} />
                        </div>

                        <div className="h-px bg-[#333]" />

                        <div className="flex flex-col gap-3">
                            <Title>Fundo e bordas</Title>
                            <ColorRow label="Fundo" value={s.backgroundColor} onChange={(c) => set({ backgroundColor: c })} allowNone />
                            <Toggle label="Borda superior" checked={s.borderTop} onChange={(v) => set({ borderTop: v })} />
                            <Toggle label="Borda inferior" checked={s.borderBottom} onChange={(v) => set({ borderBottom: v })} />
                            {content.rows.length > 1 && <Toggle label="Linha entre faixas" checked={s.borderBetween} onChange={(v) => set({ borderBetween: v })} />}
                            {(s.borderTop || s.borderBottom || (s.borderBetween && content.rows.length > 1)) && (
                                <>
                                    <ColorRow label="Cor da borda" value={s.borderColor} onChange={(c) => set({ borderColor: c })} />
                                    <Range label="Espessura da borda" value={s.borderWidth} min={1} max={8} unit="px" onChange={(v) => set({ borderWidth: v })} />
                                </>
                            )}
                            <Range label="Espaço vertical" value={s.paddingY} min={0} max={120} unit="px" onChange={(v) => set({ paddingY: v })} />
                            {content.rows.length > 1 && <Range label="Espaço entre faixas" value={s.rowGap} min={0} max={80} unit="px" onChange={(v) => set({ rowGap: v })} />}
                            <Toggle label="Ponta a ponta" checked={s.fullBleed} onChange={(v) => set({ fullBleed: v })} />
                        </div>

                        <button
                            type="button"
                            onClick={() => onChange({ ...content, settings: {} })}
                            className="flex items-center justify-center gap-1.5 h-8 text-[12px] text-[#666] hover:text-white"
                        >
                            <RotateCcw className="w-3 h-3" /> Repor estilo de origem
                        </button>
                    </>
                )}

                {tab === 'motion' && (
                    <>
                        <Range label="Velocidade" value={s.speed} min={10} max={300} step={5} unit=" px/s" onChange={(v) => set({ speed: v })} />
                        <Toggle label="Parar ao passar o rato" checked={s.pauseOnHover} onChange={(v) => set({ pauseOnHover: v })} />
                        <Toggle label="Esbater as pontas" checked={s.fadeEdges} onChange={(v) => set({ fadeEdges: v })} />
                        <div className="flex flex-col gap-2">
                            <Title>Sentido de todas as faixas</Title>
                            <Segmented
                                value={content.rows.every(r => r.direction === 'left') ? 'left' : content.rows.every(r => r.direction === 'right') ? 'right' : 'mixed'}
                                options={[
                                    { id: 'left', label: 'Esquerda' },
                                    { id: 'mixed', label: 'Alternado' },
                                    { id: 'right', label: 'Direita' },
                                ]}
                                onChange={(v) => onChange({
                                    ...content,
                                    rows: content.rows.map((r, i) => ({ ...r, direction: v === 'mixed' ? (i % 2 === 0 ? 'left' : 'right') : v })),
                                })}
                            />
                        </div>
                        <span className="text-[11px] text-[#666]">O movimento para quando o visitante tem "reduzir movimento" ativo no sistema.</span>
                    </>
                )}
            </div>

            {/* Actions */}
            <div className="border-t border-white/5 px-3 h-[52px] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1">
                    {actionButton('Mover para cima', <ArrowUp className="w-4 h-4" />, onMove ? () => onMove('up') : undefined)}
                    {actionButton('Mover para baixo', <ArrowDown className="w-4 h-4" />, onMove ? () => onMove('down') : undefined)}
                </div>
                <div className="flex items-center gap-1">
                    {actionButton(copied ? 'Copiado' : 'Copiar', copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />, onCopy ? () => {
                        onCopy()
                        setCopied(true)
                        window.setTimeout(() => setCopied(false), 1500)
                    } : undefined)}
                    {actionButton('Duplicar', <CopyPlus className="w-4 h-4" />, onDuplicate)}
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    {actionButton('Eliminar', <Trash2 className="w-4 h-4" />, onDelete, true)}
                </div>
            </div>
        </div>
    )
}
