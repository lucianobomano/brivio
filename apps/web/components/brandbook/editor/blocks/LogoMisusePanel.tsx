"use client"

import React, { useRef, useState } from "react"
import { ArrowUp, ArrowDown, Plus, Trash2, Upload, RotateCcw, ImageOff, AlignLeft, AlignCenter } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { useLogoUpload } from "./LogoShowcasePanel"
import {
    MISUSE_EFFECTS, misuseCard, misuseEffect,
    type LogoMisuseContent, type LogoMisuseSettings, type MisuseCard, type MisuseEffect, type MisuseLayout, type MisuseMark, type MisuseShape,
    type resolveLogoMisuseSettings,
} from "./logoMisuse"

type Resolved = ReturnType<typeof resolveLogoMisuseSettings>

interface Props extends BlockActions {
    blockId: string
    content: LogoMisuseContent
    resolved: Resolved
    onChange: (content: LogoMisuseContent) => void
    onClose: () => void
}

const Divider = () => <div className="h-px bg-[#333]" />

const CardEditor = ({ card, index, count, open, onToggle, onChange, onMove, onRemove, onUpload }: {
    card: MisuseCard, index: number, count: number, open: boolean
    onToggle: () => void
    onChange: (patch: Partial<MisuseCard>) => void
    onMove: (dir: -1 | 1) => void
    onRemove: () => void
    onUpload: (file: File) => void
}) => {
    const fileRef = useRef<HTMLInputElement>(null)
    const effect = misuseEffect(card.effect)
    const hasColor = ['recolor', 'glow', 'outline', 'lowContrast'].includes(card.effect)
    const hasAngle = card.effect === 'rotate' || card.effect === 'skew'
    return (
        <div className={cn("rounded-lg border bg-[#16171C] transition-colors", open ? "border-[#FF0054]/40" : "border-white/5")}>
            <div className="flex items-center gap-1 pl-3 pr-1 h-10">
                <button type="button" onClick={onToggle} className="flex-1 min-w-0 flex items-center gap-2 text-left">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", card.kind === 'do' ? "bg-[#3DDC84]" : "bg-[#FF5544]")} />
                    <span className="text-white text-[13px] font-medium shrink-0">{index + 1}.</span>
                    <span className="text-[12px] truncate">{card.image ? 'Imagem própria' : effect.label}</span>
                </button>
                <button type="button" title="Subir" disabled={index === 0} onClick={() => onMove(-1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                <button type="button" title="Descer" disabled={index === count - 1} onClick={() => onMove(1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                <button type="button" title="Remover" onClick={onRemove} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            {open && (
                <div className="flex flex-col gap-3 px-3 pb-3">
                    <Segmented
                        value={card.kind}
                        options={[{ id: 'dont' as const, label: 'Não fazer' }, { id: 'do' as const, label: 'Fazer' }]}
                        onChange={(kind) => onChange({ kind })}
                    />
                    <div className="flex flex-col gap-1.5">
                        <Title>O que mostra</Title>
                        <select
                            value={card.effect}
                            onChange={(e) => {
                                const next = misuseEffect(e.target.value as MisuseEffect)
                                // A caption still equal to the old effect's text follows the new effect
                                const caption = card.caption === effect.caption ? next.caption : card.caption
                                onChange({ effect: next.id, caption, color: next.color, angle: next.angle, kind: next.id === 'none' ? 'do' : card.kind === 'do' && card.effect === 'none' ? 'dont' : card.kind })
                            }}
                            className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer"
                        >
                            {MISUSE_EFFECTS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                        </select>
                    </div>
                    {hasColor && <ColorRow label="Cor do efeito" value={card.color || '#00D84A'} onChange={(color) => onChange({ color })} />}
                    {hasAngle && <Range label="Ângulo" value={card.angle ?? 18} min={-45} max={45} unit="°" onChange={(angle) => onChange({ angle })} />}
                    <div className="flex flex-col gap-1.5">
                        <Title>Descrição</Title>
                        <Field value={card.caption} placeholder="Ex.: Never stretch the mark." onChange={(caption) => onChange({ caption })} />
                    </div>
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

export const LogoMisusePanel = ({ blockId, content, resolved: s, onChange, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'cards' | 'text' | 'style'>('cards')
    const [openCard, setOpenCard] = useState<string | null>(content.cards[0]?.id || null)
    const drag = usePanelDrag()
    const upload = useLogoUpload(blockId)
    const logoRef = useRef<HTMLInputElement>(null)
    const cards = content.cards

    const set = (patch: Partial<LogoMisuseSettings>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const setCards = (next: MisuseCard[]) => onChange({ ...content, cards: next })
    const setCard = (id: string, patch: Partial<MisuseCard>) => setCards(cards.map(c => c.id === id ? { ...c, ...patch } : c))

    return (
        <div
            className="w-[340px] max-h-[min(720px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Usos incorretos</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['cards', 'Cartões'], ['text', 'Textos'], ['style', 'Estilo']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'cards' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title action={s.logoUrl ? <button type="button" onClick={() => set({ logoUrl: '' })} className="text-[10px] text-[#666] hover:text-white">Usar o símbolo Brivio</button> : undefined}>Logótipo</Title>
                            <input ref={logoRef} type="file" accept="image/*,.svg" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0]
                                e.target.value = ''
                                if (!file) return
                                const url = await upload(file)
                                if (url) set({ logoUrl: url })
                            }} />
                            <button
                                type="button"
                                onClick={() => logoRef.current?.click()}
                                className="h-8 rounded-md bg-[#FF0054]/15 text-[#FF5C8D] hover:bg-[#FF0054]/25 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" /> {s.logoUrl ? 'Substituir logótipo' : 'Carregar logótipo'}
                            </button>
                            <Hint>Os efeitos (esticar, rodar, mudar a cor…) são aplicados a este logótipo em todos os cartões. Para recolorir, use um ficheiro com fundo transparente.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-2">
                            {cards.map((card, i) => (
                                <CardEditor
                                    key={card.id}
                                    card={card}
                                    index={i}
                                    count={cards.length}
                                    open={openCard === card.id}
                                    onToggle={() => setOpenCard(openCard === card.id ? null : card.id)}
                                    onChange={(patch) => setCard(card.id, patch)}
                                    onMove={(dir) => {
                                        const j = i + dir
                                        if (j < 0 || j >= cards.length) return
                                        const next = [...cards]
                                        ;[next[i], next[j]] = [next[j], next[i]]
                                        setCards(next)
                                    }}
                                    onRemove={() => setCards(cards.filter(c => c.id !== card.id))}
                                    onUpload={async (file) => {
                                        const url = await upload(file)
                                        if (url) setCard(card.id, { image: url })
                                    }}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                type="button"
                                disabled={cards.length >= 16}
                                onClick={() => {
                                    // Next misuse not shown yet
                                    const used = new Set(cards.map(c => c.effect))
                                    const effect = MISUSE_EFFECTS.find(e => e.id !== 'none' && !used.has(e.id))?.id || 'stretch'
                                    const card = misuseCard(effect)
                                    setCards([...cards, card])
                                    setOpenCard(card.id)
                                }}
                                className="h-9 rounded-md border border-dashed border-[#333] text-[12px] text-[#97A1B3] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
                            >
                                <Plus className="w-3.5 h-3.5" /> Não fazer
                            </button>
                            <button
                                type="button"
                                disabled={cards.length >= 16}
                                onClick={() => {
                                    const card = misuseCard('none')
                                    setCards([card, ...cards])
                                    setOpenCard(card.id)
                                }}
                                className="h-9 rounded-md border border-dashed border-[#333] text-[12px] text-[#97A1B3] hover:text-white hover:border-[#3DDC84] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
                            >
                                <Plus className="w-3.5 h-3.5" /> Fazer
                            </button>
                        </div>
                    </>
                )}

                {tab === 'text' && (
                    <>
                        <Hint>No editor, o título, a descrição e os textos dos cartões também se editam diretamente no bloco.</Hint>
                        <div className="flex flex-col gap-3">
                            <Toggle label="Título" checked={s.showTitle} onChange={(showTitle) => set({ showTitle })} />
                            {s.showTitle && (
                                <>
                                    <Field value={s.title} placeholder="Never do this" onChange={(title) => set({ title })} />
                                    <Range label="Tamanho do título" value={s.titleSize} min={14} max={72} unit="px" onChange={(titleSize) => set({ titleSize })} />
                                    <ColorRow label="Cor do título" value={s.titleColor} onChange={(titleColor) => set({ titleColor })} />
                                </>
                            )}
                            <Toggle label="Descrição" checked={s.showDescription} onChange={(showDescription) => set({ showDescription })} />
                            {s.showDescription && (
                                <>
                                    <Field value={s.description} placeholder="Texto de introdução" onChange={(description) => set({ description })} />
                                    <ColorRow label="Cor da descrição" value={s.descriptionColor} onChange={(descriptionColor) => set({ descriptionColor })} />
                                </>
                            )}
                            {(s.showTitle || s.showDescription) && (
                                <>
                                    <Segmented
                                        value={s.titleAlign}
                                        options={[{ id: 'left' as const, label: <AlignLeft className="w-3.5 h-3.5" /> }, { id: 'center' as const, label: <AlignCenter className="w-3.5 h-3.5" /> }]}
                                        onChange={(titleAlign) => set({ titleAlign })}
                                    />
                                    <Range label="Distância aos cartões" value={s.headerGap} min={0} max={120} unit="px" onChange={(headerGap) => set({ headerGap })} />
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Textos dos cartões" checked={s.showCaptions} onChange={(showCaptions) => set({ showCaptions })} />
                            <Toggle label="Numerar (01, 02…)" checked={s.numbered} onChange={(numbered) => set({ numbered })} />
                            {s.showCaptions && (
                                <>
                                    <Range label="Tamanho" value={s.captionSize} min={10} max={22} unit="px" onChange={(captionSize) => set({ captionSize })} />
                                    <ColorRow label="Cor" value={s.captionColor} onChange={(captionColor) => set({ captionColor })} />
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Etiquetas</Title>
                            <Field value={s.dontLabel} placeholder="Don't" onChange={(dontLabel) => set({ dontLabel })} />
                            <Field value={s.doLabel} placeholder="Do" onChange={(doLabel) => set({ doLabel })} />
                        </div>
                    </>
                )}

                {tab === 'style' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Estilo</Title>
                            <Segmented
                                value={s.layout}
                                options={([['cards', 'Cartões'], ['tiles', 'Mosaico'], ['list', 'Lista']] as [MisuseLayout, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(layout) => set({ layout, columns: layout === 'list' ? Math.min(s.columns, 2) : s.columns })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Marca de erro</Title>
                            <Segmented
                                value={s.mark}
                                options={([['cross', 'Cruz'], ['slash', 'Risco'], ['badge', 'Etiqueta'], ['none', 'Nenhuma']] as [MisuseMark, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(mark) => set({ mark })}
                            />
                            {s.mark !== 'none' && (
                                <Segmented
                                    value={s.markOn}
                                    options={[{ id: 'hover' as const, label: 'Ao passar o rato' }, { id: 'always' as const, label: 'Sempre' }]}
                                    onChange={(markOn) => set({ markOn })}
                                />
                            )}
                            <ColorRow label="Não fazer" value={s.dontColor} onChange={(dontColor) => set({ dontColor })} />
                            <ColorRow label="Fazer" value={s.doColor} onChange={(doColor) => set({ doColor })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Tamanho dos cartões</Title>
                            <Segmented
                                value={s.shape}
                                options={([['fixed', 'Altura'], ['1:1', '1:1'], ['4:3', '4:3'], ['3:4', '3:4'], ['16:9', '16:9'], ['custom', 'Livre']] as [MisuseShape, string][])
                                    .map(([id, label]) => ({ id, label, title: id === 'fixed' ? 'Altura fixa da imagem' : id === 'custom' ? 'Proporção personalizada' : `Proporção ${id}` }))}
                                onChange={(shape) => set({ shape })}
                            />
                            {s.shape === 'custom' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <Range label="Largura" value={s.shapeWidth} min={1} max={20} unit="" onChange={(shapeWidth) => set({ shapeWidth })} />
                                    <Range label="Altura" value={s.shapeHeight} min={1} max={20} unit="" onChange={(shapeHeight) => set({ shapeHeight })} />
                                </div>
                            )}
                            {(s.shape === 'fixed' || s.layout === 'list') && (
                                <Range label="Altura da imagem" value={s.previewHeight} min={80} max={480} step={2} unit="px" onChange={(previewHeight) => set({ previewHeight })} />
                            )}
                            <Hint>{s.layout === 'cards' ? 'Nos Cartões, a proporção é a do cartão inteiro (imagem + texto).' : 'A proporção é a da imagem de cada cartão.'}</Hint>
                            <Toggle label="Largura fixa" checked={s.cardWidth > 0} onChange={(on) => set({ cardWidth: on ? 260 : 0 })} />
                            {s.cardWidth > 0
                                ? <Range label="Largura do cartão" value={s.cardWidth} min={120} max={720} step={10} unit="px" onChange={(cardWidth) => set({ cardWidth })} />
                                : <Range label="Colunas" value={s.columns} min={1} max={6} unit="" onChange={(columns) => set({ columns })} />}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Grelha</Title>
                            <Range label="Espaço entre cartões" value={s.gap} min={0} max={48} unit="px" onChange={(gap) => set({ gap })} />
                            <Range label="Cantos" value={s.radius} min={0} max={48} unit="px" onChange={(radius) => set({ radius })} />
                            <Range label="Tamanho do logótipo" value={s.logoSize} min={20} max={160} unit="px" onChange={(logoSize) => set({ logoSize })} />
                            <Hint>Passe o rato sobre um cartão para mudar só esse cartão (cores, cantos, tamanho do logótipo…).</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Cores</Title>
                            <ColorRow label="Fundo da imagem" value={s.previewBackground} onChange={(previewBackground) => set({ previewBackground })} />
                            {s.layout !== 'tiles' && <ColorRow label="Fundo do texto" value={s.captionBackground} onChange={(captionBackground) => set({ captionBackground, cardBackground: captionBackground })} />}
                            <ColorRow label="Borda" value={s.borderColor} onChange={(borderColor) => set({ borderColor })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title action={s.blockBackground ? <button type="button" onClick={() => set({ blockBackground: '' })} className="text-[10px] text-[#666] hover:text-white">Sem fundo</button> : undefined}>Bloco</Title>
                            <ColorRow label="Fundo do bloco" value={s.blockBackground} onChange={(blockBackground) => set({ blockBackground })} />
                            <Range label="Margem interna" value={s.blockPadding} min={0} max={96} unit="px" onChange={(blockPadding) => set({ blockPadding })} />
                        </div>
                        <button
                            type="button"
                            onClick={() => { const { logoUrl, title, description, showTitle, showDescription, dontLabel, doLabel } = content.settings; onChange({ ...content, settings: { logoUrl, title, description, showTitle, showDescription, dontLabel, doLabel } }) }}
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
