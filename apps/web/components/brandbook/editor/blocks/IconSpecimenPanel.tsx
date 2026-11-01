"use client"

import React, { useMemo, useState } from "react"
import { Plus, RotateCcw, Star, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { IconGlyph } from "./IconGlyph"
import {
    CORNER_LABELS, ICON_NAMES, ICON_SETS, iconLabel, iconSpecId,
    type IconCards, type IconCorners, type IconGrid, type IconLayout, type IconSpec, type IconSpecimenContent, type IconSpecimenSettings, type IconStyle,
    type resolveIconSpecimen,
} from "./iconSpecimen"

type Resolved = ReturnType<typeof resolveIconSpecimen>

interface Props extends BlockActions {
    content: IconSpecimenContent
    resolved: Resolved
    onChange: (content: IconSpecimenContent) => void
    onClose: () => void
}

const Divider = () => <div className="h-px bg-[#333]" />
const MAX_ICONS = 36

export const IconSpecimenPanel = ({ content, resolved: s, onChange, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'icons' | 'look' | 'texts' | 'layout'>('icons')
    const [query, setQuery] = useState('')
    const drag = usePanelDrag()
    const set = (patch: Partial<IconSpecimenSettings>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const setIcons = (icons: string[]) => onChange({ ...content, icons })
    const setSpecs = (specs: IconSpec[]) => onChange({ ...content, specs })
    const found = useMemo(() => ICON_NAMES.filter(n => !query || n.includes(query.toLowerCase().trim()) || iconLabel(n).toLowerCase().includes(query.toLowerCase().trim())), [query])
    const glyph = (name: string, size = 18, color = '#E5E7EB') => <IconGlyph name={name} style="outline" weight={1.75} corners="round" color={color} size={size} />

    return (
        <div
            className="w-[360px] max-h-[min(740px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Iconografia</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['icons', 'Ícones'], ['look', 'Desenho'], ['texts', 'Textos'], ['layout', 'Layout']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'icons' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Conjunto pronto</Title>
                            <select
                                value=""
                                onChange={(e) => { const set = ICON_SETS[e.target.value]; if (set) setIcons(set.icons) }}
                                className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer"
                            >
                                <option value="" disabled>Carregar um conjunto…</option>
                                {Object.entries(ICON_SETS).map(([id, set]) => <option key={id} value={id}>{set.label} ({set.icons.length})</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title action={<span className="text-[10px] text-[#666]">{content.icons.length}/{MAX_ICONS}</span>}>Ícones da marca</Title>
                            <div className="flex flex-wrap gap-1.5">
                                {content.icons.map((name, i) => (
                                    <div key={`${name}-${i}`} className={cn("group relative w-10 h-10 rounded-md flex items-center justify-center border", name === s.heroIcon ? "border-[#FF0054] bg-[#FF0054]/10" : "border-white/5 bg-[#16171C]")} title={iconLabel(name)}>
                                        {glyph(name)}
                                        <button type="button" title="Mostrar na grelha" onClick={() => set({ heroIcon: name })}
                                            className="absolute -left-1 -top-1 w-4 h-4 rounded-full bg-[#1F1F25] border border-white/10 hidden group-hover:flex items-center justify-center text-[#FFC94D]">
                                            <Star className="w-2.5 h-2.5" />
                                        </button>
                                        <button type="button" title="Remover" onClick={() => setIcons(content.icons.filter((_, j) => j !== i))}
                                            className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-[#1F1F25] border border-white/10 hidden group-hover:flex items-center justify-center text-[#FF5C8D]">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Hint>★ escolhe o ícone em destaque na grelha. Quem vê o brandbook também o pode trocar, clicando num ícone.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-2">
                            <Title>Adicionar ícones</Title>
                            <Field value={query} placeholder="Procurar (heart, map, cart…)" onChange={setQuery} />
                            <div className="grid grid-cols-7 gap-1 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                {found.map(name => {
                                    const used = content.icons.includes(name)
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            title={iconLabel(name)}
                                            disabled={!used && content.icons.length >= MAX_ICONS}
                                            onClick={() => setIcons(used ? content.icons.filter(n => n !== name) : [...content.icons, name])}
                                            className={cn("aspect-square rounded-md flex items-center justify-center transition-colors disabled:opacity-30", used ? "bg-[#FF0054]/20 ring-1 ring-[#FF0054]" : "bg-[#16171C] hover:bg-white/10")}
                                        >
                                            {glyph(name, 16, used ? '#FFFFFF' : '#97A1B3')}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {tab === 'look' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Estilo inicial</Title>
                            <Segmented
                                value={s.iconStyle}
                                options={([['outline', 'Contorno'], ['solid', 'Sólido'], ['duotone', 'Duotone']] as [IconStyle, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(iconStyle) => set({ iconStyle })}
                            />
                        </div>
                        <Range label="Peso do traço" value={s.strokeWidth} min={0.5} max={3} step={0.25} unit=" px" onChange={(strokeWidth) => set({ strokeWidth })} />
                        <div className="flex flex-col gap-2">
                            <Title>Pontas e cantos</Title>
                            <Segmented
                                value={s.corners}
                                options={(Object.keys(CORNER_LABELS) as IconCorners[]).map(id => ({ id, label: CORNER_LABELS[id] }))}
                                onChange={(corners) => set({ corners })}
                            />
                            <Hint>Arredondado: pontas e cantos redondos. Pontiagudo: cantos em bico e pontas cortadas. Chanfrado: cantos cortados em diagonal.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <ColorRow label="Cor inicial do ícone" value={s.iconColor} onChange={(iconColor) => set({ iconColor })} />
                            <Title action={s.palette.length < 6 ? (
                                <button type="button" onClick={() => set({ palette: [...s.palette, s.accent] })} className="text-[10px] text-[#FF5C8D] hover:text-white flex items-center gap-1"><Plus className="w-3 h-3" /> Cor</button>
                            ) : undefined}>Botões de cor</Title>
                            {s.palette.map((c, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="flex-1"><ColorRow label={`Cor ${i + 1}`} value={c} onChange={(next) => set({ palette: s.palette.map((x, j) => j === i ? next : x) })} /></div>
                                    <button type="button" title="Remover" onClick={() => set({ palette: s.palette.filter((_, j) => j !== i) })} className="text-[#666] hover:text-[#FF0054]"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                            <Hint>Quem vê o brandbook muda a cor dos ícones com estes botões. Sem botões, os ícones ficam na cor inicial.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-2">
                            <Title>Grelha de construção</Title>
                            <Segmented
                                value={s.grid}
                                options={([['both', 'Completa'], ['keylines', 'Formas'], ['pixels', 'Píxeis'], ['none', 'Nenhuma']] as [IconGrid, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(grid) => set({ grid })}
                            />
                            <Hint>Formas: área útil, círculo, quadrado, retrato e paisagem. Píxeis: a grelha 24 × 24.</Hint>
                        </div>
                        <Toggle label="Controlos para quem vê (estilo, cor, peso)" checked={s.showControls} onChange={(showControls) => set({ showControls })} />
                    </>
                )}

                {tab === 'texts' && (
                    <>
                        <Hint>No editor, estes textos também se editam clicando neles no bloco.</Hint>
                        <div className="flex flex-col gap-2"><Title>Etiqueta</Title><Field value={s.tag} placeholder="(05) Iconografia" onChange={(tag) => set({ tag })} /></div>
                        <div className="flex flex-col gap-2"><Title>Linha de cima</Title><Field value={s.eyebrow} onChange={(eyebrow) => set({ eyebrow })} /></div>
                        <div className="flex flex-col gap-2">
                            <Title>Título</Title>
                            <textarea value={s.title} rows={2} onChange={(e) => set({ title: e.target.value })} className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Descrição</Title>
                            <textarea value={s.description} rows={3} onChange={(e) => set({ description: e.target.value })} className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none" />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-2">
                            <Title>Ficha técnica</Title>
                            {content.specs.map(spec => (
                                <div key={spec.id} className="flex items-center gap-1.5">
                                    <Field value={spec.label} placeholder="Nome" onChange={(label) => setSpecs(content.specs.map(x => x.id === spec.id ? { ...x, label } : x))} />
                                    <Field value={spec.value} placeholder="Valor" onChange={(value) => setSpecs(content.specs.map(x => x.id === spec.id ? { ...x, value } : x))} />
                                    <button type="button" title="Remover" onClick={() => setSpecs(content.specs.filter(x => x.id !== spec.id))} className="w-6 shrink-0 text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                            {content.specs.length < 6 && (
                                <button type="button" onClick={() => setSpecs([...content.specs, { id: iconSpecId(), label: 'Novo', value: '' }])}
                                    className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Adicionar linha
                                </button>
                            )}
                            <Hint>Escreva {'{weight}'} ou {'{corners}'} num valor para mostrar o peso ou os cantos escolhidos.</Hint>
                        </div>
                    </>
                )}

                {tab === 'layout' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Disposição</Title>
                            <Segmented
                                value={s.layout}
                                options={([['split', 'Grelha à esquerda'], ['reverse', 'À direita'], ['centered', 'Centrada']] as [IconLayout, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(layout) => set({ layout })}
                            />
                        </div>
                        <Range label="Tamanho da grelha" value={s.heroHeight} min={240} max={640} step={10} unit="px" onChange={(heroHeight) => set({ heroHeight })} />
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Ficha técnica" checked={s.showSpecs} onChange={(showSpecs) => set({ showSpecs })} />
                            <Toggle label="Conjunto de ícones" checked={s.showSet} onChange={(showSet) => set({ showSet })} />
                            {s.showSet && (
                                <>
                                    <Toggle label="Nomes por baixo" checked={s.showLabels} onChange={(showLabels) => set({ showLabels })} />
                                    <Range label="Colunas" value={s.columns} min={3} max={12} unit="" onChange={(columns) => set({ columns })} />
                                    <Segmented
                                        value={s.cards}
                                        options={([['cards', 'Cartões'], ['outline', 'Contorno'], ['plain', 'Simples']] as [IconCards, string][]).map(([id, label]) => ({ id, label }))}
                                        onChange={(cards) => set({ cards })}
                                    />
                                    <Range label="Cantos" value={s.radius} min={0} max={32} unit="px" onChange={(radius) => set({ radius })} />
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Cores</Title>
                            <ColorRow label="Fundo" value={s.background} onChange={(background) => set({ background })} />
                            <ColorRow label="Cartões" value={s.surface} onChange={(surface) => set({ surface })} />
                            <ColorRow label="Linhas e grelha" value={s.border} onChange={(border) => set({ border })} />
                            <ColorRow label="Texto" value={s.text} onChange={(text) => set({ text })} />
                            <ColorRow label="Texto secundário" value={s.muted} onChange={(muted) => set({ muted })} />
                            <ColorRow label="Destaque" value={s.accent} onChange={(accent) => set({ accent })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Espaços</Title>
                            <Range label="Margem vertical" value={s.paddingY} min={0} max={200} unit="px" onChange={(paddingY) => set({ paddingY })} />
                            <Range label="Margem lateral" value={s.paddingX} min={0} max={200} unit="px" onChange={(paddingX) => set({ paddingX })} />
                            <Range label="Largura máxima" value={s.maxWidth} min={0} max={1800} step={20} unit={s.maxWidth ? 'px' : ' (total)'} onChange={(maxWidth) => set({ maxWidth: maxWidth < 600 ? 0 : maxWidth })} />
                        </div>
                        <button
                            type="button"
                            onClick={() => { const { heroIcon, tag, eyebrow, title, description } = content.settings; onChange({ ...content, settings: { heroIcon, tag, eyebrow, title, description } }) }}
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
