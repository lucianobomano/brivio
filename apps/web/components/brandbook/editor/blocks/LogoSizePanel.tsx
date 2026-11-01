"use client"

import React, { useRef, useState } from "react"
import { ArrowUp, ArrowDown, Plus, Trash2, Upload, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { useLogoUpload } from "./LogoShowcasePanel"
import {
    formatSize, logoSpecId,
    type LogoSizeContent, type LogoSizeSettings, type LogoSizeSpec, type resolveLogoSizeSettings,
} from "./logoSize"

type Resolved = ReturnType<typeof resolveLogoSizeSettings>

interface Props extends BlockActions {
    blockId: string
    content: LogoSizeContent
    resolved: Resolved
    onChange: (content: LogoSizeContent) => void
    /** Moves the stage's slider to a size while it's being set (minimum, recommended…) */
    onPreviewSize: (px: number) => void
    onClose: () => void
}

const Divider = () => <div className="h-px bg-[#333]" />

const SpecRow = ({ spec, index, count, s, onChange, onMove, onRemove }: {
    spec: LogoSizeSpec, index: number, count: number, s: Resolved
    onChange: (patch: Partial<LogoSizeSpec>) => void
    onMove: (dir: -1 | 1) => void
    onRemove: () => void
}) => (
    <div className="flex flex-col gap-1.5 p-2 rounded-md bg-[#16171C] border border-white/5">
        <div className="flex items-center gap-1">
            <Field value={spec.label} placeholder="Nome" onChange={(label) => onChange({ label })} />
            <button type="button" title="Subir" disabled={index === 0} onClick={() => onMove(-1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
            <button type="button" title="Descer" disabled={index === count - 1} onClick={() => onMove(1)} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
            <button type="button" title="Remover" onClick={onRemove} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex items-center gap-1.5">
            <select
                value={spec.auto || ''}
                onChange={(e) => onChange({ auto: (e.target.value || undefined) as LogoSizeSpec['auto'] })}
                className="h-8 shrink-0 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer"
                title="Valor escrito ou o tamanho definido no bloco"
            >
                <option value="">Texto</option>
                <option value="min">Mínimo</option>
                <option value="rec">Recomendado</option>
            </select>
            {spec.auto
                ? <span className="flex-1 min-w-0 truncate text-[12px] text-white font-mono">{spec.auto === 'min' ? formatSize(s.minSize, s) : s.recommendedSize ? formatSize(s.recommendedSize, s) : '—'}</span>
                : <Field value={spec.value} placeholder="Valor" onChange={(value) => onChange({ value })} />}
        </div>
    </div>
)

export const LogoSizePanel = ({ blockId, content, resolved: s, onChange, onPreviewSize, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'sizes' | 'style' | 'specs'>('sizes')
    const drag = usePanelDrag()
    const upload = useLogoUpload(blockId)
    const fileRef = useRef<HTMLInputElement>(null)
    const specs = content.specs

    const set = (patch: Partial<LogoSizeSettings>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const setSpecs = (next: LogoSizeSpec[]) => onChange({ ...content, specs: next })

    return (
        <div
            className="w-[340px] max-h-[min(720px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Tamanho mínimo</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['sizes', 'Tamanhos'], ['style', 'Estilo'], ['specs', 'Ficha']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'sizes' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title action={s.logoUrl ? <button type="button" onClick={() => set({ logoUrl: '' })} className="text-[10px] text-[#666] hover:text-white">Usar o símbolo Brivio</button> : undefined}>Logótipo</Title>
                            <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0]
                                e.target.value = ''
                                if (!file) return
                                const url = await upload(file)
                                if (url) set({ logoUrl: url })
                            }} />
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="h-8 rounded-md bg-[#FF0054]/15 text-[#FF5C8D] hover:bg-[#FF0054]/25 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" /> {s.logoUrl ? 'Substituir logótipo' : 'Carregar logótipo'}
                            </button>
                            <Segmented
                                value={s.measure}
                                options={[{ id: 'width' as const, label: 'Mede a largura' }, { id: 'height' as const, label: 'Mede a altura' }]}
                                onChange={(measure) => set({ measure })}
                            />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Regras</Title>
                            <Range label="Tamanho mínimo" value={s.minSize} min={4} max={400} unit="px" onChange={(minSize) => { set({ minSize }); onPreviewSize(minSize) }} />
                            <Toggle label="Tamanho recomendado" checked={!!s.recommendedSize} onChange={(on) => set({ recommendedSize: on ? Math.max(s.minSize * 2, s.minSize + 1) : 0 })} />
                            {!!s.recommendedSize && (
                                <Range label="Recomendado a partir de" value={s.recommendedSize} min={s.minSize + 1} max={800} unit="px" onChange={(recommendedSize) => { set({ recommendedSize }); onPreviewSize(recommendedSize) }} />
                            )}
                            <Hint>Com o slider, quem lê o brandbook vê o símbolo a cada tamanho e se está abaixo do mínimo, acima ou no recomendado.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Slider</Title>
                            <Range label="Do tamanho" value={s.sliderMin} min={1} max={s.sliderMax - 1} unit="px" onChange={(sliderMin) => set({ sliderMin })} />
                            <Range label="Até ao tamanho" value={s.sliderMax} min={s.sliderMin + 1} max={800} unit="px" onChange={(sliderMax) => set({ sliderMax })} />
                            <Range label="Tamanho ao abrir" value={s.initialSize} min={s.sliderMin} max={s.sliderMax} unit="px" onChange={(initialSize) => set({ initialSize })} />
                            <Toggle label="Marcas do mínimo e recomendado" checked={s.showMarks} onChange={(showMarks) => set({ showMarks })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Medidas</Title>
                            <Segmented
                                value={s.units}
                                options={[{ id: 'both' as const, label: 'px · mm' }, { id: 'px' as const, label: 'px' }, { id: 'mm' as const, label: 'mm' }]}
                                onChange={(units) => set({ units })}
                            />
                            <Range label="Resolução para mm" value={s.dpi} min={72} max={600} unit=" ppi" onChange={(dpi) => set({ dpi })} />
                            <Hint>96 ppi = ecrã (128 px ≈ 33.9 mm). Use 300 para impressão.</Hint>
                        </div>
                    </>
                )}

                {tab === 'style' && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Title>Palco</Title>
                            <Range label="Altura" value={s.stageHeight} min={200} max={800} step={10} unit="px" onChange={(stageHeight) => set({ stageHeight })} />
                            <Range label="Cantos" value={s.radius} min={0} max={48} unit="px" onChange={(radius) => set({ radius })} />
                            <ColorRow label="Fundo" value={s.stageBackground} onChange={(stageBackground) => set({ stageBackground })} />
                            <ColorRow label="Borda" value={s.stageBorder} onChange={(stageBorder) => set({ stageBorder })} />
                            <Toggle label="Borda vermelha abaixo do mínimo" checked={s.warnBorder} onChange={(warnBorder) => set({ warnBorder })} />
                            <ColorRow label="Linha do slider" value={s.trackColor} onChange={(trackColor) => set({ trackColor })} />
                            <ColorRow label="Botão do slider" value={s.thumbColor} onChange={(thumbColor) => set({ thumbColor })} />
                            <ColorRow label="Medida" value={s.readoutColor} onChange={(readoutColor) => set({ readoutColor })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Estados</Title>
                            <ColorRow label="Abaixo do mínimo" value={s.belowColor} onChange={(belowColor) => set({ belowColor })} />
                            <Field value={content.settings.belowLabel ?? s.belowLabel} placeholder="Below minimum" onChange={(belowLabel) => set({ belowLabel })} />
                            <ColorRow label="Acima do mínimo" value={s.aboveColor} onChange={(aboveColor) => set({ aboveColor })} />
                            <Field value={content.settings.aboveLabel ?? s.aboveLabel} placeholder="Above minimum" onChange={(aboveLabel) => set({ aboveLabel })} />
                            {!!s.recommendedSize && (
                                <>
                                    <ColorRow label="Recomendado" value={s.recommendedColor} onChange={(recommendedColor) => set({ recommendedColor })} />
                                    <Field value={content.settings.recommendedLabel ?? s.recommendedLabel} placeholder="Recommended" onChange={(recommendedLabel) => set({ recommendedLabel })} />
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title action={s.blockBackground ? <button type="button" onClick={() => set({ blockBackground: '' })} className="text-[10px] text-[#666] hover:text-white">Sem fundo</button> : undefined}>Bloco</Title>
                            <ColorRow label="Fundo do bloco" value={s.blockBackground} onChange={(blockBackground) => set({ blockBackground })} />
                            <Range label="Margem interna" value={s.blockPadding} min={0} max={80} unit="px" onChange={(blockPadding) => set({ blockPadding })} />
                        </div>
                        <button type="button" onClick={() => onChange({ ...content, settings: { logoUrl: content.settings.logoUrl } })} className="flex items-center justify-center gap-1.5 h-8 text-[12px] text-[#666] hover:text-white">
                            <RotateCcw className="w-3 h-3" /> Repor estilo de origem
                        </button>
                    </>
                )}

                {tab === 'specs' && (
                    <>
                        <Toggle label="Mostrar a ficha" checked={s.showSpecs} onChange={(showSpecs) => set({ showSpecs })} />
                        <div className="flex flex-col gap-2">
                            {specs.map((spec, i) => (
                                <SpecRow
                                    key={spec.id}
                                    spec={spec}
                                    index={i}
                                    count={specs.length}
                                    s={s}
                                    onChange={(patch) => setSpecs(specs.map(x => x.id === spec.id ? { ...x, ...patch } : x))}
                                    onMove={(dir) => {
                                        const j = i + dir
                                        if (j < 0 || j >= specs.length) return
                                        const next = [...specs]
                                        ;[next[i], next[j]] = [next[j], next[i]]
                                        setSpecs(next)
                                    }}
                                    onRemove={() => setSpecs(specs.filter(x => x.id !== spec.id))}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSpecs([...specs, { id: logoSpecId(), label: 'Nova linha', value: '' }])}
                            className="h-9 rounded-md border border-dashed border-[#333] text-[12px] text-[#97A1B3] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Adicionar linha
                        </button>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Cores</Title>
                            <ColorRow label="Nomes" value={s.specLabelColor} onChange={(specLabelColor) => set({ specLabelColor })} />
                            <ColorRow label="Valores" value={s.specValueColor} onChange={(specValueColor) => set({ specValueColor })} />
                            <ColorRow label="Linhas" value={s.specLineColor} onChange={(specLineColor) => set({ specLineColor })} />
                            <Range label="Distância ao palco" value={s.specsGap} min={0} max={64} unit="px" onChange={(specsGap) => set({ specsGap })} />
                        </div>
                    </>
                )}
            </div>

            <PanelActions {...actions} />
        </div>
    )
}
