"use client"

import React, { useRef, useState } from "react"
import { Plus, RotateCcw, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { useLogoUpload } from "./LogoShowcasePanel"
import {
    PHOTO_DEFAULTS, PHOTO_LIBRARY,
    type PhotoGrade, type PhotoGradeSettings, type PhotoMode, type PhotoOverlay, type resolvePhotoGrade,
} from "./photoGrade"

type Resolved = ReturnType<typeof resolvePhotoGrade>

interface Props extends BlockActions {
    blockId: string
    settings: PhotoGradeSettings
    resolved: Resolved
    onChange: (settings: PhotoGradeSettings) => void
    onClose: () => void
}

const Divider = () => <div className="h-px bg-[#333]" />

/** Sliders of one grade (the brand's, or the one to avoid) */
const GradeControls = ({ grade, onChange }: { grade: PhotoGrade, onChange: (patch: Partial<PhotoGrade>) => void }) => (
    <div className="flex flex-col gap-3">
        <Range label="Brilho" value={grade.brightness || 0} min={-60} max={60} unit="" onChange={(brightness) => onChange({ brightness })} />
        <Range label="Contraste" value={grade.contrast || 0} min={-60} max={80} unit="" onChange={(contrast) => onChange({ contrast })} />
        <Range label="Saturação" value={grade.saturation || 0} min={-100} max={100} unit="" onChange={(saturation) => onChange({ saturation })} />
        <Range label="Temperatura (frio ↔ quente)" value={grade.warmth || 0} min={-100} max={100} unit="" onChange={(warmth) => onChange({ warmth })} />
        <Range label="Matiz" value={grade.tint || 0} min={-180} max={180} unit="°" onChange={(tint) => onChange({ tint })} />
        <Range label="Pretos levantados (fade)" value={grade.fade || 0} min={0} max={100} unit="" onChange={(fade) => onChange({ fade })} />
        <Range label="Grão" value={grade.grain || 0} min={0} max={100} unit="" onChange={(grain) => onChange({ grain })} />
        <Range label="Vinheta" value={grade.vignette || 0} min={0} max={100} unit="" onChange={(vignette) => onChange({ vignette })} />
        <Divider />
        <Toggle label="Cor sobreposta (duotone, split tone)" checked={!!grade.wash} onChange={(on) => onChange(on ? { wash: '#FF0054', washStrength: 35, washBlend: 'color' } : { wash: undefined, washStrength: 0 })} />
        {grade.wash && (
            <>
                <ColorRow label="Cor" value={grade.wash} onChange={(wash) => onChange({ wash })} />
                <Range label="Intensidade" value={grade.washStrength || 0} min={0} max={100} unit="%" onChange={(washStrength) => onChange({ washStrength })} />
                <Segmented
                    value={grade.washBlend || 'color'}
                    options={([['color', 'Cor'], ['soft-light', 'Luz suave'], ['multiply', 'Multiplicar'], ['screen', 'Clarear']] as [NonNullable<PhotoGrade['washBlend']>, string][]).map(([id, label]) => ({ id, label }))}
                    onChange={(washBlend) => onChange({ washBlend })}
                />
            </>
        )}
    </div>
)

export const PhotoGradePanel = ({ blockId, settings, resolved: s, onChange, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'photo' | 'grade' | 'composition' | 'style'>('photo')
    const drag = usePanelDrag()
    const upload = useLogoUpload(blockId)
    const fileRef = useRef<HTMLInputElement>(null)
    const set = (patch: Partial<PhotoGradeSettings>) => onChange({ ...settings, ...patch })

    return (
        <div
            className="w-[360px] max-h-[min(740px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Tratamento fotográfico</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['photo', 'Foto'], ['grade', 'Ajuste'], ['composition', 'Composição'], ['style', 'Estilo']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'photo' && (
                    <>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (!file) return
                            const url = await upload(file)
                            if (url) set({ image: url })
                        }} />
                        <button type="button" onClick={() => fileRef.current?.click()}
                            className="h-9 rounded-md bg-[#FF0054]/15 text-[#FF5C8D] hover:bg-[#FF0054]/25 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors">
                            <Upload className="w-3.5 h-3.5" /> Carregar fotografia da marca
                        </button>
                        <div className="grid grid-cols-4 gap-1.5">
                            {PHOTO_LIBRARY.map(url => (
                                <button key={url} type="button" onClick={() => set({ image: url })}
                                    className={cn("aspect-square rounded-md bg-cover bg-center transition-all", s.image === url ? "ring-2 ring-[#FF0054]" : "opacity-70 hover:opacity-100")}
                                    style={{ backgroundImage: `url(${url})` }} />
                            ))}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-2">
                            <Title>Como mostrar</Title>
                            <Segmented
                                value={s.mode}
                                options={([['compare', 'Antes/depois'], ['side', 'Lado a lado'], ['single', 'Só a marca'], ['variants', 'Faça/Evite']] as [PhotoMode, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(mode) => set({ mode })}
                            />
                            <Hint>
                                {s.mode === 'compare' ? 'Quem vê arrasta a linha para comparar a foto original com o tratamento da marca.'
                                    : s.mode === 'side' ? 'Original e tratamento da marca lado a lado.'
                                        : s.mode === 'variants' ? 'Original, o tratamento certo e um exemplo do que evitar (ajuste-o em Ajuste → Evitar).'
                                            : 'Só a fotografia com o tratamento da marca.'}
                            </Hint>
                        </div>
                    </>
                )}

                {tab === 'grade' && (
                    <>
                        <Title action={<button type="button" onClick={() => set({ grade: undefined })} className="text-[10px] text-[#666] hover:text-white flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Repor</button>}>Tratamento da marca</Title>
                        <GradeControls grade={s.grade} onChange={(patch) => set({ grade: { ...s.grade, ...patch } })} />
                        {s.mode === 'variants' && (
                            <>
                                <Divider />
                                <Title>Exemplo a evitar</Title>
                                <GradeControls grade={s.avoidGrade} onChange={(patch) => set({ avoidGrade: { ...s.avoidGrade, ...patch } })} />
                            </>
                        )}
                        <Toggle label="Mostrar os valores por baixo" checked={s.showValues} onChange={(showValues) => set({ showValues })} />
                    </>
                )}

                {tab === 'composition' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Guias de composição</Title>
                            <Segmented
                                value={s.overlay}
                                options={([['none', 'Nenhuma'], ['thirds', 'Terços'], ['golden', 'Áurea'], ['center', 'Centro']] as [PhotoOverlay, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(overlay) => set({ overlay })}
                            />
                            <Segmented
                                value={s.overlay}
                                options={([['diagonals', 'Diagonais'], ['grid', 'Grelha 6×6']] as [PhotoOverlay, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(overlay) => set({ overlay })}
                            />
                            {s.overlay !== 'none' && <ColorRow label="Cor das guias" value={s.overlayColor} onChange={(overlayColor) => set({ overlayColor })} />}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-2">
                            <Title>Enquadramento (proporção)</Title>
                            <Segmented
                                value={s.aspect}
                                options={[['21/9', '21:9'], ['16/9', '16:9'], ['3/2', '3:2'], ['4/3', '4:3'], ['1/1', '1:1'], ['4/5', '4:5']].map(([id, label]) => ({ id, label }))}
                                onChange={(aspect) => set({ aspect })}
                            />
                        </div>
                    </>
                )}

                {tab === 'style' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Etiquetas</Title>
                            <Field value={s.labelOriginal} placeholder="Original" onChange={(labelOriginal) => set({ labelOriginal })} />
                            <Field value={s.labelBrand} placeholder="Com o tratamento da marca" onChange={(labelBrand) => set({ labelBrand })} />
                            {s.mode === 'variants' && <Field value={s.labelAvoid} placeholder="Evitar" onChange={(labelAvoid) => set({ labelAvoid })} />}
                        </div>
                        <Range label="Cantos" value={s.radius} min={0} max={48} unit="px" onChange={(radius) => set({ radius })} />
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Paleta da fotografia" checked={s.showPalette} onChange={(showPalette) => set({ showPalette })} />
                            {s.showPalette && (
                                <>
                                    {s.palette.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="flex-1"><ColorRow label={`Cor ${i + 1}`} value={c} onChange={(next) => set({ palette: s.palette.map((x, j) => j === i ? next : x) })} /></div>
                                            <button type="button" title="Remover" onClick={() => set({ palette: s.palette.filter((_, j) => j !== i) })} className="text-[#666] hover:text-[#FF0054]"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                    {s.palette.length < 8 && (
                                        <button type="button" onClick={() => set({ palette: [...s.palette, '#888888'] })}
                                            className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5">
                                            <Plus className="w-3.5 h-3.5" /> Adicionar cor
                                        </button>
                                    )}
                                    <Hint>As cores dominantes das fotografias da marca. Quem vê copia o hex ao clicar.</Hint>
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Cores do texto</Title>
                            <ColorRow label="Valores" value={s.text} onChange={(text) => set({ text })} />
                            <ColorRow label="Nomes" value={s.muted} onChange={(muted) => set({ muted })} />
                            <ColorRow label="Destaque (etiqueta da marca)" value={s.accent} onChange={(accent) => set({ accent })} />
                        </div>
                        <button type="button" onClick={() => onChange({ image: settings.image, grade: settings.grade, avoidGrade: settings.avoidGrade, mode: settings.mode ?? PHOTO_DEFAULTS.mode })}
                            className="flex items-center justify-center gap-1.5 h-8 text-[12px] text-[#666] hover:text-white">
                            <RotateCcw className="w-3 h-3" /> Repor estilo de origem
                        </button>
                    </>
                )}
            </div>

            <PanelActions {...actions} />
        </div>
    )
}
