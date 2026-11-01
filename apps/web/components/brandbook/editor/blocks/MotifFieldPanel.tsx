"use client"

import React, { useRef } from "react"
import { Plus, RotateCcw, Shuffle, Upload, X } from "lucide-react"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { useLogoUpload } from "./LogoShowcasePanel"
import {
    MOTIF_ARRANGEMENTS, MOTIF_SHAPES,
    type MotifCursor, type MotifFieldSettings, type MotifGrow, type resolveMotif,
} from "./motifField"

type Resolved = ReturnType<typeof resolveMotif>

interface Props extends BlockActions {
    blockId: string
    settings: MotifFieldSettings
    resolved: Resolved
    brandColors: string[]
    onChange: (settings: MotifFieldSettings) => void
    onClose: () => void
}

const Divider = () => <div className="h-px bg-[#333]" />

export const MotifFieldPanel = ({ blockId, settings, resolved: s, brandColors, onChange, onClose, ...actions }: Props) => {
    const drag = usePanelDrag()
    const upload = useLogoUpload(blockId)
    const fileRef = useRef<HTMLInputElement>(null)
    const set = (patch: Partial<MotifFieldSettings>) => onChange({ ...settings, ...patch })
    const ownColors = s.colors.length > 0

    return (
        <div
            className="w-[360px] max-h-[min(740px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Formas da marca</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                <div className="flex flex-col gap-2">
                    <Title>Forma</Title>
                    <div className="grid grid-cols-4 gap-1">
                        {MOTIF_SHAPES.map(sh => (
                            <button key={sh.id} type="button" onClick={() => set({ shape: sh.id })}
                                className={`h-8 rounded text-[11px] font-semibold transition-colors ${s.shape === sh.id ? 'bg-[#FF0054] text-white' : 'bg-[#16171C] hover:text-white'}`}>
                                {sh.label}
                            </button>
                        ))}
                    </div>
                    {s.shape === 'image' && (
                        <>
                            <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0]
                                e.target.value = ''
                                if (!file) return
                                const url = await upload(file)
                                if (url) set({ imageUrl: url })
                            }} />
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="h-8 rounded-md bg-[#FF0054]/15 text-[#FF5C8D] hover:bg-[#FF0054]/25 text-[12px] font-medium flex items-center justify-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" /> {s.imageUrl ? 'Trocar a forma' : 'Carregar a forma (SVG ou PNG)'}
                            </button>
                            <Hint>Use uma forma da marca com fundo transparente (um elemento do logótipo, um padrão…).</Hint>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Title action={<button type="button" onClick={() => set({ seed: Math.floor(Math.random() * 9999) })} className="text-[10px] text-[#FF5C8D] hover:text-white flex items-center gap-1"><Shuffle className="w-3 h-3" /> Baralhar</button>}>Disposição</Title>
                    <div className="grid grid-cols-4 gap-1">
                        {MOTIF_ARRANGEMENTS.map(a => (
                            <button key={a.id} type="button" onClick={() => set({ arrangement: a.id })}
                                className={`h-8 rounded text-[11px] font-semibold transition-colors ${s.arrangement === a.id ? 'bg-[#FF0054] text-white' : 'bg-[#16171C] hover:text-white'}`}>
                                {a.label}
                            </button>
                        ))}
                    </div>
                    <Toggle label="Espelhar" checked={s.mirror} onChange={(mirror) => set({ mirror })} />
                </div>

                <Divider />
                <div className="flex flex-col gap-3">
                    <Range label="Quantidade" value={s.density} min={4} max={120} unit="" onChange={(density) => set({ density })} />
                    <Range label="Tamanho" value={s.size} min={12} max={240} unit="px" onChange={(size) => set({ size })} />
                    <Range label="Variação" value={s.variation} min={0} max={100} unit="%" onChange={(variation) => set({ variation })} />
                    <Range label="Altura do campo" value={s.height} min={120} max={1000} step={10} unit="px" onChange={(height) => set({ height })} />
                    <Range label="Opacidade" value={s.opacity} min={10} max={100} unit="%" onChange={(opacity) => set({ opacity })} />
                </div>

                <Divider />
                <div className="flex flex-col gap-3">
                    <Title action={ownColors ? <button type="button" onClick={() => set({ colors: [] })} className="text-[10px] text-[#666] hover:text-white flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Cores da marca</button> : undefined}>Cores</Title>
                    {ownColors ? (
                        <>
                            {s.colors.map((c, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="flex-1"><ColorRow label={`Cor ${i + 1}`} value={c} onChange={(next) => set({ colors: s.colors.map((x, j) => j === i ? next : x) })} /></div>
                                    <button type="button" title="Remover" disabled={s.colors.length <= 1} onClick={() => set({ colors: s.colors.filter((_, j) => j !== i) })} className="text-[#666] hover:text-[#FF0054] disabled:opacity-20"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                            {s.colors.length < 6 && (
                                <button type="button" onClick={() => set({ colors: [...s.colors, '#888888'] })}
                                    className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Adicionar cor
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Hint>{brandColors.length ? `Usa as ${brandColors.length} cores de Settings → Colors.` : 'Usa as cores Brivio até definir as cores da marca em Settings.'}</Hint>
                            <button type="button" onClick={() => set({ colors: brandColors.length ? brandColors.slice(0, 6) : ['#FF0054', '#390099'] })}
                                className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054]">
                                Escolher cores próprias
                            </button>
                        </>
                    )}
                    <ColorRow label="Fundo do campo" value={s.background || '#000000'} onChange={(background) => set({ background })} />
                    {s.background && <button type="button" onClick={() => set({ background: '' })} className="text-[11px] text-[#666] hover:text-white self-start">Sem fundo</button>}
                </div>

                <Divider />
                <div className="flex flex-col gap-3">
                    <Title>Movimento</Title>
                    <Segmented
                        value={s.grow}
                        options={([['load', 'Ao abrir'], ['scroll', 'Ao chegar'], ['hover', 'No hover'], ['none', 'Sem']] as [MotifGrow, string][]).map(([id, label]) => ({ id, label }))}
                        onChange={(grow) => set({ grow })}
                    />
                    <Segmented
                        value={s.cursor}
                        options={([['part', 'Afastam-se do rato'], ['lean', 'Inclinam-se'], ['none', 'Paradas']] as [MotifCursor, string][]).map(([id, label]) => ({ id, label }))}
                        onChange={(cursor) => set({ cursor })}
                    />
                    {s.cursor !== 'none' && <Range label="Força do rato" value={s.cursorStrength} min={10} max={100} unit="%" onChange={(cursorStrength) => set({ cursorStrength })} />}
                    <Hint>O crescimento vê-se em Preview e no link partilhado. Com «reduzir movimento», as formas aparecem já crescidas.</Hint>
                </div>
            </div>

            <PanelActions {...actions} />
        </div>
    )
}
