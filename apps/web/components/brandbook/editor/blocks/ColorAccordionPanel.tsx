"use client"

import React, { useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import {
    accordionColorId, cardBackground, normalizeHex,
    type AccordionColor, type AccordionReveal, type ColorAccordionContent, type ColorAccordionSettings, type resolveAccordion,
} from "./colorAccordion"

type Resolved = ReturnType<typeof resolveAccordion>

interface Props extends BlockActions {
    content: ColorAccordionContent
    /** Colours defined in Settings → Colors */
    brandColorCount: number
    resolved: Resolved
    activeIndex: number
    onActiveIndex: (i: number) => void
    onChange: (content: ColorAccordionContent) => void
    onClose: () => void
}

const Divider = () => <div className="h-px bg-[#333]" />

const ColorEditor = ({ color, index, count, open, onToggle, onChange, onMove, onRemove }: {
    color: AccordionColor, index: number, count: number, open: boolean
    onToggle: () => void
    onChange: (patch: Partial<AccordionColor>) => void
    onMove: (dir: -1 | 1) => void
    onRemove: () => void
}) => {
    const isGradient = !!color.gradient?.length
    return (
        <div className={cn("rounded-lg border bg-[#16171C] transition-colors", open ? "border-[#FF0054]/40" : "border-white/5")}>
            <div className="flex items-center gap-1 pl-2 pr-1 h-11">
                <button type="button" onClick={onToggle} className="flex-1 min-w-0 flex items-center gap-2.5 text-left">
                    <span className="w-7 h-7 rounded-md shrink-0 border border-white/10" style={{ background: cardBackground(color) }} />
                    <span className="text-white text-[13px] font-medium truncate">{color.name || 'Cor'}</span>
                    <span className="text-[11px] font-mono text-[#666] shrink-0">{isGradient ? 'Gradiente' : normalizeHex(color.hex)}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 ml-auto transition-transform", !open && "-rotate-90")} />
                </button>
                <button type="button" title="Subir" disabled={index === 0} onClick={() => onMove(-1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                <button type="button" title="Descer" disabled={index === count - 1} onClick={() => onMove(1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                <button type="button" title="Remover" disabled={count <= 1} onClick={onRemove} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-[#FF0054] disabled:opacity-20"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            {open && (
                <div className="flex flex-col gap-3 px-3 pb-3">
                    <Field value={color.name} placeholder="Nome" onChange={(name) => onChange({ name })} />
                    <Segmented
                        value={isGradient ? 'gradient' : 'solid'}
                        options={[{ id: 'solid' as const, label: 'Cor sólida' }, { id: 'gradient' as const, label: 'Gradiente' }]}
                        onChange={(kind) => onChange(kind === 'gradient' ? { gradient: [normalizeHex('#FFFFFF'), normalizeHex(color.hex)] } : { gradient: undefined })}
                    />
                    {isGradient ? (
                        <>
                            <ColorRow label="Cor de cima" value={color.gradient![0]} onChange={(c) => onChange({ gradient: [c, color.gradient![color.gradient!.length - 1]] })} />
                            <ColorRow label="Cor de baixo" value={color.gradient![color.gradient!.length - 1]} onChange={(c) => onChange({ gradient: [color.gradient![0], c], hex: c })} />
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex-1"><ColorRow label="Cor" value={normalizeHex(color.hex)} onChange={(hex) => onChange({ hex })} /></div>
                            <input
                                value={color.hex}
                                onChange={(e) => onChange({ hex: e.target.value })}
                                onBlur={(e) => onChange({ hex: normalizeHex(e.target.value) })}
                                className="w-[86px] h-8 bg-[#1A1C23] rounded px-2 text-[12px] font-mono uppercase text-white outline-none"
                                title="Código hexadecimal"
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <Title>Descrição</Title>
                        <textarea
                            value={color.description || ''}
                            rows={2}
                            onChange={(e) => onChange({ description: e.target.value })}
                            className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none"
                        />
                    </div>
                    <Range label="Proporção de uso" value={color.usage || 0} min={0} max={100} unit="%" onChange={(usage) => onChange({ usage })} />
                </div>
            )}
        </div>
    )
}

export const ColorAccordionPanel = ({ content, brandColorCount, resolved: s, activeIndex, onActiveIndex, onChange, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'colors' | 'texts' | 'style'>('colors')
    const [openId, setOpenId] = useState<string | null>(content.colors[activeIndex]?.id || null)
    const drag = usePanelDrag()
    const colors = content.colors
    const set = (patch: Partial<ColorAccordionSettings>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const setColors = (next: AccordionColor[]) => onChange({ ...content, colors: next })
    const usageTotal = colors.reduce((sum, c) => sum + (c.usage || 0), 0)

    return (
        <div
            className="w-[360px] max-h-[min(740px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Paleta em acordeão</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['colors', 'Cores'], ['texts', 'Textos'], ['style', 'Estilo']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'colors' && (
                    <>
                        <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#16171C] border border-white/5">
                            <Toggle label="Cores da marca (Settings)" checked={!!content.brandColors} onChange={(brandColors) => onChange({ ...content, brandColors })} />
                            <Hint>
                                {!brandColorCount
                                    ? 'Ainda não há cores em Settings → Colors: são mostradas as cores de exemplo. Quando as definir, aparecem aqui sozinhas.'
                                    : content.brandColors
                                        ? `Mostra as ${brandColorCount} cores de Settings → Colors e acompanha as mudanças. Ao editar uma cor aqui, o componente passa a ter cores próprias.`
                                        : 'Ligue para voltar a usar as cores definidas em Settings → Colors.'}
                            </Hint>
                        </div>
                        <div className="flex flex-col gap-2">
                            {colors.map((c, i) => (
                                <ColorEditor
                                    key={c.id}
                                    color={c}
                                    index={i}
                                    count={colors.length}
                                    open={openId === c.id}
                                    onToggle={() => { setOpenId(openId === c.id ? null : c.id); onActiveIndex(i) }}
                                    onChange={(patch) => setColors(colors.map(x => x.id === c.id ? { ...x, ...patch } : x))}
                                    onMove={(dir) => {
                                        const j = i + dir
                                        if (j < 0 || j >= colors.length) return
                                        const next = [...colors]
                                        ;[next[i], next[j]] = [next[j], next[i]]
                                        setColors(next)
                                        onActiveIndex(j)
                                    }}
                                    onRemove={() => { setColors(colors.filter(x => x.id !== c.id)); onActiveIndex(0) }}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            disabled={colors.length >= 8}
                            onClick={() => {
                                const color: AccordionColor = { id: accordionColorId(), name: 'Nova cor', hex: '#390099', description: '', usage: 0 }
                                setColors([...colors, color])
                                setOpenId(color.id)
                                onActiveIndex(colors.length)
                            }}
                            className="h-9 rounded-md border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
                        >
                            <Plus className="w-3.5 h-3.5" /> Adicionar cor
                        </button>
                        <Hint>
                            Os códigos RGB, HSL e CMYK, os tons e o contraste entre as cores são calculados a partir do hexadecimal.
                            {usageTotal !== 100 && usageTotal > 0 ? ` A proporção de uso soma ${usageTotal}% (a barra divide pelo total).` : ''}
                        </Hint>
                    </>
                )}

                {tab === 'texts' && (
                    <>
                        <Toggle label="Título e descrição" checked={s.showHeader} onChange={(showHeader) => set({ showHeader })} />
                        {s.showHeader && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Title>Título</Title>
                                    <textarea value={s.title} rows={2} onChange={(e) => set({ title: e.target.value })} className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Title>Descrição</Title>
                                    <textarea value={s.description} rows={3} onChange={(e) => set({ description: e.target.value })} className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none" />
                                </div>
                            </>
                        )}
                        <Divider />
                        <div className="flex flex-col gap-1.5"><Title>Título da proporção</Title><Field value={s.usageTitle} onChange={(usageTitle) => set({ usageTitle })} /></div>
                        <Hint>No editor, o título e a descrição também se editam clicando neles no bloco.</Hint>
                    </>
                )}

                {tab === 'style' && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Title>Cartões</Title>
                            <Range label="Altura" value={s.height} min={320} max={800} step={10} unit="px" onChange={(height) => set({ height })} />
                            <Range label="Largura fechados" value={s.collapsedWidth} min={56} max={200} unit="px" onChange={(collapsedWidth) => set({ collapsedWidth })} />
                            <Range label="Espaço entre cartões" value={s.gap} min={0} max={32} unit="px" onChange={(gap) => set({ gap })} />
                            <Range label="Cantos" value={s.radius} min={0} max={48} unit="px" onChange={(radius) => set({ radius })} />
                            <Toggle label="Abrir ao passar o rato" checked={s.openOnHover} onChange={(openOnHover) => set({ openOnHover })} />
                            <div className="flex items-center justify-between gap-3">
                                <span>Aberto ao carregar</span>
                                <select value={Math.min(s.initialIndex, colors.length - 1)} onChange={(e) => { set({ initialIndex: Number(e.target.value) }); onActiveIndex(Number(e.target.value)) }}
                                    className="h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer">
                                    {colors.map((c, i) => <option key={c.id} value={i}>{String(i + 1).padStart(2, '0')} · {c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>No cartão aberto</Title>
                            <Toggle label="Códigos (RGB, HSL, CMYK)" checked={s.showCodes} onChange={(showCodes) => set({ showCodes })} />
                            <Toggle label="Tons" checked={s.showTints} onChange={(showTints) => set({ showTints })} />
                            <Toggle label="Contraste com as outras cores" checked={s.showContrast} onChange={(showContrast) => set({ showContrast })} />
                            <Toggle label="Barra de proporção de uso" checked={s.showUsage} onChange={(showUsage) => set({ showUsage })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Entrada ao rolar</Title>
                            <Segmented
                                value={s.reveal}
                                options={([['rise', 'Subir'], ['fade', 'Aparecer'], ['blur', 'Desfoque'], ['none', 'Nenhuma']] as [AccordionReveal, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(reveal) => set({ reveal })}
                            />
                            {s.reveal !== 'none' && <Range label="Intervalo entre elementos" value={s.stagger} min={40} max={300} step={10} unit="ms" onChange={(stagger) => set({ stagger })} />}
                            <Hint>Primeiro os textos, depois cada cartão, os detalhes da cor e por fim a proporção de uso.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Secção</Title>
                            <ColorRow label="Fundo" value={s.background} onChange={(background) => set({ background })} />
                            <ColorRow label="Texto" value={s.text} onChange={(text) => set({ text })} />
                            <ColorRow label="Texto secundário" value={s.muted} onChange={(muted) => set({ muted })} />
                            <Range label="Margem vertical" value={s.paddingY} min={0} max={200} unit="px" onChange={(paddingY) => set({ paddingY })} />
                            <Range label="Margem lateral" value={s.paddingX} min={0} max={200} unit="px" onChange={(paddingX) => set({ paddingX })} />
                            <Range label="Largura máxima" value={s.maxWidth} min={0} max={1800} step={20} unit={s.maxWidth ? "px" : " (a da coluna)"} onChange={(maxWidth) => set({ maxWidth: maxWidth < 600 ? 0 : maxWidth })} />
                        </div>
                        <button
                            type="button"
                            onClick={() => { const { title, description, usageTitle } = content.settings; onChange({ ...content, settings: { title, description, usageTitle } }) }}
                            className="flex items-center justify-center gap-1.5 h-8 text-[12px] text-[#666] hover:text-white"
                        >
                            <RotateCcw className="w-3 h-3" /> Repor estilo de origem
                        </button>
                    </>
                )}
            </div>

            <PanelActions {...actions} />
        </div>
    )
}
