"use client"

import React, { useState } from "react"
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, ImagePlus, Italic, Loader2, RotateCcw, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { BorderControl } from "../BorderControl"
import { FontPicker } from "../FontPicker"
import { MARKER_GROUPS, isNumbered, type ListSettings, type MarkerBadge } from "./listStyle"

interface Props extends BlockActions {
    settings: ListSettings
    onChange: (patch: Partial<ListSettings>) => void
    onReset: () => void
    onClose: () => void
    /** Uploads the picture of an «image» marker; returns its address */
    onUploadMarker?: (file: File) => Promise<string | null>
}

const Divider = () => <div className="h-px bg-[#333]" />

const WEIGHTS = [[300, "Light"], [400, "Regular"], [500, "Medium"], [600, "Semibold"], [700, "Bold"], [800, "Extra bold"]] as const

const WeightSelect = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => (
    <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer"
    >
        {WEIGHTS.map(([w, label]) => <option key={w} value={w}>{label}</option>)}
    </select>
)

const MarkerImagePicker = ({ s, onChange, upload }: { s: ListSettings, onChange: (patch: Partial<ListSettings>) => void, upload?: (file: File) => Promise<string | null> }) => {
    const fileRef = React.useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)
    const pick = async (file: File) => {
        if (!upload) return
        setBusy(true)
        try { const url = await upload(file); if (url) onChange({ markerImage: url }) } finally { setBusy(false) }
    }
    return (
        <div className="flex flex-col gap-2">
            <Title>Imagem do marcador</Title>
            <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = '' }} />
            <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-md bg-[#16171C] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.markerImage ? <img src={s.markerImage} alt="" className="max-w-[80%] max-h-[80%] object-contain" /> : <ImagePlus className="w-4 h-4 text-[#666]" />}
                </div>
                <button
                    type="button"
                    disabled={!upload || busy}
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 h-9 rounded-md bg-[#1A1C23] text-[12px] text-[#97A1B3] hover:text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                    title="Ícone, imagem ou logótipo (PNG, SVG, JPG…)"
                >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {s.markerImage ? 'Trocar imagem' : 'Carregar imagem'}
                </button>
                {s.markerImage && (
                    <button type="button" title="Remover a imagem" onClick={() => onChange({ markerImage: '' })} className="w-9 h-9 rounded-md bg-[#1A1C23] text-[#97A1B3] hover:text-[#FF0054] flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {!upload && <Hint>O carregamento de imagens não está disponível aqui.</Hint>}
            <Toggle label="Pintar com a cor do marcador" checked={s.markerImageRecolor} onChange={(markerImageRecolor) => onChange({ markerImageRecolor })} />
            <Hint>Para ícones de uma só cor (PNG transparente ou SVG): passam a usar a «Cor do marcador».</Hint>
        </div>
    )
}

export const ListSettingsPanel = ({ settings: s, onChange, onReset, onClose, onUploadMarker, ...actions }: Props) => {
    const [tab, setTab] = useState<"marker" | "text" | "desc" | "style">("marker")
    const drag = usePanelDrag()

    return (
        <div
            className="w-[340px] max-h-[min(720px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Lista</span>
                <div className="flex items-center gap-2">
                    <button type="button" title="Repor o aspeto original" onMouseDown={(e) => e.stopPropagation()} onClick={onReset} className="w-6 h-6 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-black/15">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                        <span className="sr-only">Fechar</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([["marker", "Marcador"], ["text", "Texto"], ["desc", "Descrição"], ["style", "Estilo"]] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === "marker" && (
                    <>
                        {MARKER_GROUPS.map(group => (
                            <div key={group.label} className="flex flex-col gap-2">
                                <Title>{group.label}</Title>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {group.items.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            title={m.label}
                                            onClick={() => onChange({ marker: m.id })}
                                            className={cn(
                                                "h-10 rounded-md border text-[15px] font-semibold flex items-center justify-center transition-colors",
                                                s.marker === m.id ? "border-[#FF0054] bg-[#FF0054]/10 text-white" : "border-white/5 bg-[#16171C] text-[#97A1B3] hover:text-white hover:border-white/20"
                                            )}
                                        >
                                            {m.id === "custom" && s.customMarker ? s.customMarker
                                                // eslint-disable-next-line @next/next/no-img-element
                                                : m.id === "image" ? (s.markerImage ? <img src={s.markerImage} alt="" className="w-5 h-5 object-contain" /> : <ImagePlus className="w-4 h-4" />)
                                                : m.sample}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {s.marker === "custom" && (
                            <div className="flex flex-col gap-1.5">
                                <Title>Carácter do marcador</Title>
                                <Field value={s.customMarker} placeholder="Ex.: ◆, ➤, ✦, ✱, 🔹" onChange={(v) => onChange({ customMarker: v.slice(0, 4) })} />
                            </div>
                        )}

                        {s.marker === "image" && <MarkerImagePicker s={s} onChange={onChange} upload={onUploadMarker} />}

                        {isNumbered(s.marker) && (
                            <div className="flex items-center justify-between gap-3">
                                <span>Começar em</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={s.startAt}
                                    onChange={(e) => onChange({ startAt: Math.max(0, parseInt(e.target.value) || 0) })}
                                    className="w-20 h-8 bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 text-[13px] text-white outline-none text-right"
                                />
                            </div>
                        )}

                        {s.marker !== "none" && (
                            <>
                                <Divider />
                                <Range label="Tamanho do marcador" value={s.markerSize} min={6} max={64} unit="px" onChange={(markerSize) => onChange({ markerSize })} />
                                <ColorRow label="Cor do marcador" value={s.markerColor} onChange={(markerColor) => onChange({ markerColor })} />
                                {isNumbered(s.marker) && (
                                    <div className="flex flex-col gap-1.5">
                                        <Title>Peso da numeração</Title>
                                        <WeightSelect value={s.markerWeight} onChange={(markerWeight) => onChange({ markerWeight })} />
                                    </div>
                                )}
                                <Range label="Espaço até ao texto" value={s.markerGap} min={0} max={64} unit="px" onChange={(markerGap) => onChange({ markerGap })} />
                                <div className="flex flex-col gap-2">
                                    <Title>Alinhamento com o texto</Title>
                                    <Segmented
                                        value={s.markerAlign}
                                        options={[{ id: "top" as const, label: "Topo" }, { id: "center" as const, label: "1.ª linha ao centro" }]}
                                        onChange={(markerAlign) => onChange({ markerAlign })}
                                    />
                                </div>

                                <Divider />
                                <div className="flex flex-col gap-2">
                                    <Title>Fundo do marcador</Title>
                                    <Segmented<MarkerBadge>
                                        value={s.badge}
                                        options={[
                                            { id: "none", label: "Nenhum" },
                                            { id: "circle", label: "Círculo" },
                                            { id: "rounded", label: "Arredond." },
                                            { id: "square", label: "Quadrado" },
                                        ]}
                                        onChange={(badge) => onChange({ badge })}
                                    />
                                </div>
                                {s.badge !== "none" && (
                                    <>
                                        <Range label="Tamanho do fundo" value={s.badgeSize} min={12} max={96} unit="px" onChange={(badgeSize) => onChange({ badgeSize })} />
                                        <ColorRow label="Cor do fundo" value={s.badgeColor} onChange={(badgeColor) => onChange({ badgeColor })} />
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}

                {tab === "desc" && (
                    <>
                        <Toggle label="Descrição por baixo de cada item" checked={s.showDescriptions} onChange={(showDescriptions) => onChange({ showDescriptions })} />
                        <Hint>Um texto de apoio por baixo do título de cada item. No item, Enter passa para a descrição; na descrição, Enter cria o item seguinte.</Hint>
                        {s.showDescriptions && (
                            <>
                                <Divider />
                                <div className="flex flex-col gap-1.5">
                                    <Title action={s.descFontFamily ? <button type="button" onClick={() => onChange({ descFontFamily: "" })} className="text-[10px] text-[#666] hover:text-white">Usar a do item</button> : undefined}>Fonte</Title>
                                    <FontPicker currentFont={s.descFontFamily || s.fontFamily || "Inter"} onFontChange={(descFontFamily) => onChange({ descFontFamily })}>
                                        <button type="button" className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[13px] text-white flex items-center justify-between" style={{ fontFamily: s.descFontFamily || undefined }}>
                                            <span className="truncate">{s.descFontFamily || "Fonte do item"}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-[#666]" />
                                        </button>
                                    </FontPicker>
                                </div>
                                <Range label="Tamanho" value={s.descSize} min={8} max={48} unit="px" onChange={(descSize) => onChange({ descSize })} />
                                <div className="flex flex-col gap-1.5">
                                    <Title>Peso</Title>
                                    <WeightSelect value={s.descWeight} onChange={(descWeight) => onChange({ descWeight })} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <ColorRow label="Cor" value={s.descColor} onChange={(descColor) => onChange({ descColor })} />
                                    {s.descColor
                                        ? <button type="button" onClick={() => onChange({ descColor: "" })} className="self-end text-[10px] text-[#666] hover:text-white">Usar a cor do item (mais clara)</button>
                                        : <Hint>Sem cor própria: a cor do item, um pouco mais clara.</Hint>}
                                </div>
                                <Range label="Altura da linha" value={s.descLineHeight} min={0.8} max={3} step={0.05} unit="" onChange={(descLineHeight) => onChange({ descLineHeight })} />
                                <Toggle label="Itálico" checked={s.descItalic} onChange={(descItalic) => onChange({ descItalic })} />
                                <Divider />
                                <Range label="Espaço entre o item e a descrição" value={s.descGap} min={0} max={48} unit="px" onChange={(descGap) => onChange({ descGap })} />
                            </>
                        )}
                    </>
                )}

                {tab === "text" && (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <Title action={s.fontFamily ? <button type="button" onClick={() => onChange({ fontFamily: "" })} className="text-[10px] text-[#666] hover:text-white">Usar a do texto</button> : undefined}>Fonte</Title>
                            <FontPicker currentFont={s.fontFamily || "Inter"} onFontChange={(fontFamily) => onChange({ fontFamily })}>
                                <button type="button" className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[13px] text-white flex items-center justify-between" style={{ fontFamily: s.fontFamily || undefined }}>
                                    <span className="truncate">{s.fontFamily || "Fonte do texto"}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-[#666]" />
                                </button>
                            </FontPicker>
                        </div>
                        <Range label="Tamanho do texto" value={s.textSize} min={8} max={72} unit="px" onChange={(textSize) => onChange({ textSize })} />
                        <div className="flex flex-col gap-1.5">
                            <Title>Peso</Title>
                            <WeightSelect value={s.textWeight} onChange={(textWeight) => onChange({ textWeight })} />
                        </div>
                        <ColorRow label="Cor do texto" value={s.textColor} onChange={(textColor) => onChange({ textColor })} />
                        <Range label="Altura da linha" value={s.lineHeight} min={0.8} max={3} step={0.05} unit="" onChange={(lineHeight) => onChange({ lineHeight })} />
                        <div className="flex flex-col gap-2">
                            <Title>Alinhamento</Title>
                            <div className="flex gap-1.5">
                                <div className="flex-1">
                                    <Segmented
                                        value={s.textAlign}
                                        options={[
                                            { id: "left" as const, label: <AlignLeft className="w-3.5 h-3.5" />, title: "Esquerda" },
                                            { id: "center" as const, label: <AlignCenter className="w-3.5 h-3.5" />, title: "Centro" },
                                            { id: "right" as const, label: <AlignRight className="w-3.5 h-3.5" />, title: "Direita" },
                                        ]}
                                        onChange={(textAlign) => onChange({ textAlign })}
                                    />
                                </div>
                                <button
                                    type="button"
                                    title="Itálico"
                                    onClick={() => onChange({ italic: !s.italic })}
                                    className={cn("w-9 rounded-md flex items-center justify-center transition-colors", s.italic ? "bg-[#FF0054] text-white" : "bg-[#1A1C23] text-[#888] hover:text-white")}
                                >
                                    <Italic className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <Divider />
                        <Range label="Espaço entre itens" value={s.itemSpacing} min={0} max={80} unit="px" onChange={(itemSpacing) => onChange({ itemSpacing })} />
                        <Range label="Recuo da lista" value={s.indent} min={0} max={120} unit="px" onChange={(indent) => onChange({ indent })} />
                        <Range label="Colunas" value={s.columns} min={1} max={4} unit="" onChange={(columns) => onChange({ columns })} />
                        {s.columns > 1 && <Range label="Espaço entre colunas" value={s.columnGap} min={0} max={120} unit="px" onChange={(columnGap) => onChange({ columnGap })} />}
                    </>
                )}

                {tab === "style" && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Title>Separadores</Title>
                            <Toggle label="Linha entre os itens" checked={s.dividers} onChange={(dividers) => onChange({ dividers })} />
                            {s.dividers && (
                                <>
                                    <Range label="Espessura" value={s.dividerWidth} min={1} max={8} unit="px" onChange={(dividerWidth) => onChange({ dividerWidth })} />
                                    <ColorRow label="Cor da linha" value={s.dividerColor} onChange={(dividerColor) => onChange({ dividerColor })} />
                                    <Segmented
                                        value={s.dividerStyle}
                                        options={[{ id: "solid" as const, label: "Contínua" }, { id: "dashed" as const, label: "Tracejada" }, { id: "dotted" as const, label: "Pontilhada" }]}
                                        onChange={(dividerStyle) => onChange({ dividerStyle })}
                                    />
                                    <Hint>O espaço entre a linha e os itens é o «Espaço entre itens» (separador Texto), dividido acima e abaixo da linha.</Hint>
                                    <Toggle label="Começar no texto (não no marcador)" checked={s.dividerInset} onChange={(dividerInset) => onChange({ dividerInset })} />
                                    <Toggle label="Linha no início e no fim" checked={s.dividerEnds} onChange={(dividerEnds) => onChange({ dividerEnds })} />
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title action={s.background ? <button type="button" onClick={() => onChange({ background: "" })} className="text-[10px] text-[#666] hover:text-white">Sem fundo</button> : undefined}>Caixa da lista</Title>
                            <ColorRow label="Fundo" value={s.background} onChange={(background) => onChange({ background })} />
                            <Range label="Espaço interior" value={s.padding} min={0} max={80} unit="px" onChange={(padding) => onChange({ padding })} />
                            <Range label="Cantos" value={s.radius} min={0} max={48} unit="px" onChange={(radius) => onChange({ radius })} />
                        </div>
                        <BorderControl label="Borda da lista" value={s.border} onChange={(border) => onChange({ border })} />

                    </>
                )}
            </div>

            <PanelActions {...actions} />
        </div>
    )
}

