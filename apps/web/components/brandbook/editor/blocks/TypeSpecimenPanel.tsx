"use client"

import React, { useState } from "react"
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import {
    SPECIMEN_FONTS, VARIABLE_FONTS, WEIGHT_NAMES, specimenId,
    type GlyphAnimation, type GlyphMode, type SpecimenLayout, type SpecimenLevel, type SpecimenWeight,
    type TypeSpecimenContent, type TypeSpecimenSettings, type resolveSpecimen,
} from "./typeSpecimen"

type Resolved = ReturnType<typeof resolveSpecimen>

interface Props extends BlockActions {
    content: TypeSpecimenContent
    resolved: Resolved
    onChange: (content: TypeSpecimenContent) => void
    onClose: () => void
}

const Divider = () => <div className="h-px bg-[#333]" />

const WEIGHTS = Object.keys(WEIGHT_NAMES).map(Number)

const WeightSelect = ({ value, onChange }: { value: number, onChange: (w: number) => void }) => (
    <select
        value={Math.round(value / 100) * 100}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer shrink-0"
    >
        {WEIGHTS.map(w => <option key={w} value={w}>{w} · {WEIGHT_NAMES[w]}</option>)}
    </select>
)

const Num = ({ value, onChange, min = 1, max = 400, title }: { value: number, onChange: (v: number) => void, min?: number, max?: number, title?: string }) => (
    <input
        type="number"
        title={title}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-14 h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none shrink-0"
    />
)

const move = <T,>(list: T[], i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return list
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
}

export const TypeSpecimenPanel = ({ content, resolved: s, onChange, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'font' | 'texts' | 'parts' | 'style'>('font')
    const drag = usePanelDrag()
    const set = (patch: Partial<TypeSpecimenSettings>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const setWeights = (weights: SpecimenWeight[]) => onChange({ ...content, weights })
    const setLevels = (levels: SpecimenLevel[]) => onChange({ ...content, levels })
    const range = VARIABLE_FONTS[s.fontFamily]

    return (
        <div
            className="w-[360px] max-h-[min(740px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Tipografia</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['font', 'Fonte'], ['texts', 'Textos'], ['parts', 'Partes'], ['style', 'Estilo']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'font' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Família</Title>
                            <select
                                value={SPECIMEN_FONTS.includes(s.fontFamily) ? s.fontFamily : '__custom'}
                                onChange={(e) => { if (e.target.value !== '__custom') set({ fontFamily: e.target.value }) }}
                                className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer"
                            >
                                {SPECIMEN_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                {!SPECIMEN_FONTS.includes(s.fontFamily) && <option value="__custom">{s.fontFamily}</option>}
                            </select>
                            <Field value={content.settings.fontFamily ?? ''} placeholder="Ou escreva outra fonte Google…" onChange={(fontFamily) => set({ fontFamily: fontFamily || undefined })} />
                            <Hint>{range ? `Fonte variável: pesos de ${range[0]} a ${range[1]}, contínuos no teste de peso e na animação.` : 'Fonte sem eixo de peso: o teste de peso salta entre os pesos que a fonte tiver.'}</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Letra em destaque</Title>
                            <Field value={s.glyph} placeholder="A" onChange={(glyph) => set({ glyph: glyph.slice(0, 3) })} />
                            <Segmented
                                value={s.glyphMode}
                                options={([['outline', 'Contorno'], ['solid', 'Sólida'], ['ghost', 'Fantasma'], ['accent', 'Destaque']] as [GlyphMode, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(glyphMode) => set({ glyphMode })}
                            />
                            <div className="flex flex-col gap-2">
                                <Title>Animação</Title>
                                <Segmented
                                    value={s.glyphAnimation}
                                    options={([['none', 'Nenhuma'], ['weight', 'Peso 100→900'], ['draw', 'Desenho']] as [GlyphAnimation, string][]).map(([id, label]) => ({ id, label }))}
                                    onChange={(glyphAnimation) => set({ glyphAnimation })}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Peso da letra</span>
                                <WeightSelect value={s.heroWeight} onChange={(heroWeight) => set({ heroWeight })} />
                            </div>
                            <Range label="Tamanho da letra" value={s.glyphSize} min={30} max={100} unit="%" onChange={(glyphSize) => set({ glyphSize })} />
                            <Range label="Altura da grelha" value={s.heroHeight} min={300} max={900} step={10} unit="px" onChange={(heroHeight) => set({ heroHeight })} />
                            <Toggle label="Peso por baixo (800 ExtraBold)" checked={s.showHeroWeight} onChange={(showHeroWeight) => set({ showHeroWeight })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Linhas de construção" checked={s.showGuides} onChange={(showGuides) => set({ showGuides })} />
                            {s.showGuides && (
                                <>
                                    <Toggle label="Valores (unidades por 1000)" checked={s.showGuideValues} onChange={(showGuideValues) => set({ showGuideValues })} />
                                    {(['ascender', 'cap', 'x', 'baseline', 'descender'] as const).map(key => (
                                        <div key={key} className="flex items-center gap-2">
                                            <span className="w-24 shrink-0 text-[12px]">{{ ascender: 'Ascendente', cap: 'Altura-H', x: 'Altura-X', baseline: 'Base', descender: 'Descendente' }[key]}</span>
                                            <Field value={content.settings.guideLabels?.[key] ?? s.guideLabels[key]} placeholder="Vazio = esconder linha" onChange={(v) => set({ guideLabels: { ...content.settings.guideLabels, [key]: v } })} />
                                        </div>
                                    ))}
                                    <Hint>As linhas são medidas na própria fonte. Apague um nome para esconder essa linha.</Hint>
                                </>
                            )}
                        </div>
                    </>
                )}

                {tab === 'texts' && (
                    <>
                        <Hint>No editor, estes textos (e as frases da hierarquia e do teste) também se editam clicando neles no bloco.</Hint>
                        <div className="flex flex-col gap-2"><Title>Etiqueta</Title><Field value={s.tag} placeholder="(04) Tipografia" onChange={(tag) => set({ tag })} /></div>
                        <div className="flex flex-col gap-2"><Title>Linha de cima</Title><Field value={s.eyebrow} placeholder="01 · A voz da marca" onChange={(eyebrow) => set({ eyebrow })} /></div>
                        <div className="flex flex-col gap-2">
                            <Title>Título</Title>
                            <textarea value={s.title} rows={2} onChange={(e) => set({ title: e.target.value })} className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Descrição</Title>
                            <textarea value={s.description} rows={3} onChange={(e) => set({ description: e.target.value })} className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none" />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-2"><Title>Título da hierarquia</Title><Field value={s.hierarchyTitle} onChange={(hierarchyTitle) => set({ hierarchyTitle })} /></div>
                        <div className="flex flex-col gap-2"><Title>Etiqueta da hierarquia</Title><Field value={s.hierarchyTag} placeholder="Vazio = sem etiqueta" onChange={(hierarchyTag) => set({ hierarchyTag })} /></div>
                        <div className="flex flex-col gap-2"><Title>Título do teste</Title><Field value={s.testerLabel} onChange={(testerLabel) => set({ testerLabel })} /></div>
                        <div className="flex flex-col gap-2"><Title>Frase do teste</Title><Field value={s.testerText} onChange={(testerText) => set({ testerText })} /></div>
                    </>
                )}

                {tab === 'parts' && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Toggle label="Pesos" checked={s.showWeights} onChange={(showWeights) => set({ showWeights })} />
                            {s.showWeights && (
                                <>
                                    {content.weights.map((w, i) => (
                                        <div key={w.id} className="flex items-center gap-1.5">
                                            <WeightSelect value={w.weight} onChange={(weight) => setWeights(content.weights.map(x => x.id === w.id ? { ...x, weight, label: WEIGHT_NAMES[weight] || x.label } : x))} />
                                            <Field value={w.label} onChange={(label) => setWeights(content.weights.map(x => x.id === w.id ? { ...x, label } : x))} />
                                            <button type="button" title="Subir" disabled={i === 0} onClick={() => setWeights(move(content.weights, i, -1))} className="w-5 text-[#666] hover:text-white disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                            <button type="button" title="Remover" onClick={() => setWeights(content.weights.filter(x => x.id !== w.id))} className="w-5 text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                    {content.weights.length < 8 && (
                                        <button type="button" onClick={() => setWeights([...content.weights, { id: specimenId('w'), weight: 400, label: 'Regular' }])}
                                            className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5">
                                            <Plus className="w-3.5 h-3.5" /> Adicionar peso
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Hierarquia" checked={s.showHierarchy} onChange={(showHierarchy) => set({ showHierarchy })} />
                            {s.showHierarchy && (
                                <>
                                    {content.levels.map((l, i) => (
                                        <div key={l.id} className="flex flex-col gap-1.5 p-2 rounded-md bg-[#16171C] border border-white/5">
                                            <div className="flex items-center gap-1.5">
                                                <Field value={l.role} placeholder="Nível" onChange={(role) => setLevels(content.levels.map(x => x.id === l.id ? { ...x, role } : x))} />
                                                <button type="button" title="Subir" disabled={i === 0} onClick={() => setLevels(move(content.levels, i, -1))} className="w-5 text-[#666] hover:text-white disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                                <button type="button" title="Descer" disabled={i === content.levels.length - 1} onClick={() => setLevels(move(content.levels, i, 1))} className="w-5 text-[#666] hover:text-white disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                                                <button type="button" title="Remover" onClick={() => setLevels(content.levels.filter(x => x.id !== l.id))} className="w-5 text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <WeightSelect value={l.weight} onChange={(weight) => setLevels(content.levels.map(x => x.id === l.id ? { ...x, weight } : x))} />
                                                <Num title="Tamanho (px)" value={l.size} min={8} max={160} onChange={(size) => setLevels(content.levels.map(x => x.id === l.id ? { ...x, size } : x))} />
                                                <span className="text-[#555]">/</span>
                                                <Num title="Entrelinha (px)" value={l.lineHeight} min={8} max={200} onChange={(lineHeight) => setLevels(content.levels.map(x => x.id === l.id ? { ...x, lineHeight } : x))} />
                                            </div>
                                            <Field value={l.sample} placeholder="Frase de exemplo" onChange={(sample) => setLevels(content.levels.map(x => x.id === l.id ? { ...x, sample } : x))} />
                                        </div>
                                    ))}
                                    {content.levels.length < 6 && (
                                        <button type="button" onClick={() => setLevels([...content.levels, { id: specimenId('l'), role: 'Legenda', weight: 400, size: 13, lineHeight: 18, sample: 'Pequenos detalhes, mesma voz.' }])}
                                            className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5">
                                            <Plus className="w-3.5 h-3.5" /> Adicionar nível
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Teste de peso" checked={s.showTester} onChange={(showTester) => set({ showTester })} />
                            {s.showTester && (
                                <>
                                    <Range label="Tamanho da frase" value={s.testerSize} min={24} max={160} unit="px" onChange={(testerSize) => set({ testerSize })} />
                                    <Range label="Peso inicial" value={s.testerWeight} min={s.testerMin} max={s.testerMax} unit="" onChange={(testerWeight) => set({ testerWeight })} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Range label="Mínimo" value={s.testerMin} min={100} max={s.testerMax - 100} step={100} unit="" onChange={(testerMin) => set({ testerMin })} />
                                        <Range label="Máximo" value={s.testerMax} min={s.testerMin + 100} max={1000} step={100} unit="" onChange={(testerMax) => set({ testerMax })} />
                                    </div>
                                    <Hint>Quem abre o brandbook pode escrever na frase e mover o peso para experimentar a fonte.</Hint>
                                </>
                            )}
                        </div>
                    </>
                )}

                {tab === 'style' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Disposição</Title>
                            <Segmented
                                value={s.layout}
                                options={([['split', 'Letra à esquerda'], ['reverse', 'À direita'], ['centered', 'Centrada']] as [SpecimenLayout, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(layout) => set({ layout })}
                            />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Cores</Title>
                            <ColorRow label="Fundo" value={s.background} onChange={(background) => set({ background })} />
                            <ColorRow label="Cartões" value={s.surface} onChange={(surface) => set({ surface })} />
                            <ColorRow label="Linhas e bordas" value={s.border} onChange={(border) => set({ border })} />
                            <ColorRow label="Texto" value={s.text} onChange={(text) => set({ text })} />
                            <ColorRow label="Texto secundário" value={s.muted} onChange={(muted) => set({ muted })} />
                            <ColorRow label="Destaque" value={s.accent} onChange={(accent) => set({ accent })} />
                            <Toggle label="Grelha de fundo (blueprint)" checked={s.backdropGrid} onChange={(backdropGrid) => set({ backdropGrid })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Espaços</Title>
                            <Range label="Margem vertical" value={s.paddingY} min={0} max={200} unit="px" onChange={(paddingY) => set({ paddingY })} />
                            <Range label="Margem lateral" value={s.paddingX} min={0} max={200} unit="px" onChange={(paddingX) => set({ paddingX })} />
                            <Range label="Largura máxima" value={s.maxWidth} min={800} max={1800} step={20} unit="px" onChange={(maxWidth) => set({ maxWidth })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Espaçamento</Title>
                            <Range label="Entre pesos e hierarquia" value={s.columnsGap} min={0} max={160} unit="px" onChange={(columnsGap) => set({ columnsGap })} />
                            <Range label="Entre os cartões dos pesos" value={s.weightsGap} min={0} max={64} unit="px" onChange={(weightsGap) => set({ weightsGap })} />
                            <Range label="Entre as linhas da hierarquia" value={s.hierarchyRowGap} min={0} max={64} unit="px" onChange={(hierarchyRowGap) => set({ hierarchyRowGap })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Cartões dos pesos</Title>
                            <Toggle label="Preenchimento" checked={s.weightsFill} onChange={(weightsFill) => set({ weightsFill })} />
                            <Toggle label="Contorno" checked={s.weightsBorder} onChange={(weightsBorder) => set({ weightsBorder })} />
                            <Range label="Cantos (pesos e teste)" value={s.radius} min={0} max={40} unit="px" onChange={(radius) => set({ radius })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Hierarquia</Title>
                            <Toggle label="Preenchimento" checked={s.hierarchyFill} onChange={(hierarchyFill) => set({ hierarchyFill })} />
                            <Toggle label="Contorno" checked={s.hierarchyBorder} onChange={(hierarchyBorder) => set({ hierarchyBorder })} />
                            {(s.hierarchyFill || s.hierarchyBorder) && (
                                <Range label="Cantos" value={s.hierarchyRadius} min={0} max={40} unit="px" onChange={(hierarchyRadius) => set({ hierarchyRadius })} />
                            )}
                            <Hint>Sem preenchimento nem contorno, a hierarquia fica só com as linhas de separação.</Hint>
                        </div>
                        <button
                            type="button"
                            onClick={() => { const { fontFamily, glyph, tag, eyebrow, title, description, testerText } = content.settings; onChange({ ...content, settings: { fontFamily, glyph, tag, eyebrow, title, description, testerText } }) }}
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
