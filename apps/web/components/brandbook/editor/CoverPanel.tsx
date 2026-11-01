"use client"

import React, { useRef, useState } from "react"
import {
    ArrowDown, ArrowUp, Check, Copy, CopyPlus, Image as ImageIcon, Plus, RotateCcw, Settings2, Sparkles, Trash2, Upload, X, Zap,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"
import { ColorRow, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./blocks/panelControls"
import {
    COVER_EFFECTS, COVER_IMAGES, COVER_PALETTES, resolveCover,
    type CoverBlend, type CoverEffect, type CoverImageMotion, type CoverOverlay, type CoverSettings,
} from "./cover"
import type { SectionSettings } from "./SectionSettingsPanel"

type Settings = Partial<SectionSettings> & { cover?: CoverSettings, isCover?: boolean }

const Divider = () => <div className="h-px bg-[#333]" />

/** Little picture of an effect: its colours as the shape it draws */
const EffectSwatch = ({ effect, colors }: { effect: CoverEffect, colors: string[] }) => {
    const [a, b, c = a, d = b] = colors
    const bg =
        effect === 'none' ? '#1A1C23'
        : effect === 'mesh' ? `radial-gradient(circle at 25% 30%, ${a} 0, transparent 55%), radial-gradient(circle at 75% 35%, ${b} 0, transparent 55%), radial-gradient(circle at 55% 80%, ${c} 0, transparent 55%), ${d}`
        : effect === 'fluid' ? `radial-gradient(circle at 35% 55%, ${a} 0, transparent 40%), radial-gradient(circle at 65% 45%, ${b} 0, transparent 42%), #0A0A0A`
        : effect === 'liquid' ? `conic-gradient(from 40deg at 45% 55%, ${a}, ${b}, ${c}, ${d}, ${a})`
        : effect === 'aurora' ? `linear-gradient(115deg, transparent 10%, ${a} 30%, ${b} 50%, transparent 70%), linear-gradient(160deg, ${c}, #050510)`
        : `repeating-linear-gradient(170deg, transparent 0 6px, ${a} 6px 7px), #0A0A0A`
    return <span className="block w-full h-12 rounded-md border border-white/10" style={{ background: bg, filter: effect === 'liquid' ? 'blur(3px) saturate(1.2)' : effect === 'mesh' || effect === 'fluid' ? 'blur(1px)' : undefined }} />
}

export const CoverPanel = ({ settings, onChange, onClose, brandId, moduleId, onReset }: {
    settings: Settings
    onChange: (patch: Partial<Settings>) => void
    onClose: () => void
    brandId?: string
    moduleId?: string
    onReset?: () => void
}) => {
    const [tab, setTab] = useState<'background' | 'motion' | 'finish'>('background')
    const drag = usePanelDrag()
    const fileRef = useRef<HTMLInputElement>(null)
    const c = resolveCover(settings.cover)
    const setCover = (patch: Partial<CoverSettings>) => onChange({ cover: { ...settings.cover, ...patch } })
    const type = settings.backgroundType || 'color'
    const gradient = settings.backgroundGradient?.type === 'linear' ? settings.backgroundGradient : undefined
    const gradientStops = gradient?.stops?.length ? gradient.stops : [{ color: '#390099', offset: 0 }, { color: '#FF0054', offset: 100 }]

    const upload = async (file: File) => {
        if (!brandId) { toast.error('Não foi possível carregar a imagem.'); return }
        const id = toast.loading('A carregar a imagem…')
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('brandId', brandId)
            formData.append('moduleId', moduleId || 'cover')
            const result = await uploadBrandbookMedia(formData)
            if (result.success && result.url) {
                onChange({ backgroundType: 'image', backgroundImage: result.url })
                toast.success('Imagem carregada', { id })
            } else toast.error('Erro ao carregar a imagem.', { id })
        } catch {
            toast.error('Erro ao carregar a imagem.', { id })
        }
    }

    return (
        <div
            className="w-[360px] max-h-[min(740px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg flex items-center gap-2"><Sparkles className="w-4 h-4" /> Capa</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['background', 'Fundo'], ['motion', 'Movimento'], ['finish', 'Acabamento']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'background' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Fundo da capa</Title>
                            <Segmented
                                value={type}
                                options={[{ id: 'color' as const, label: 'Cor' }, { id: 'image' as const, label: 'Imagem' }, { id: 'gradient' as const, label: 'Gradiente' }]}
                                onChange={(backgroundType) => onChange(backgroundType === 'gradient' && !gradient
                                    ? { backgroundType, backgroundGradient: { type: 'linear', angle: 135, stops: gradientStops } }
                                    : { backgroundType })}
                            />
                            <ColorRow label={type === 'color' ? 'Cor' : 'Cor por baixo'} value={settings.backgroundColor || '#000000'} onChange={(backgroundColor) => onChange({ backgroundColor })} />
                        </div>

                        {type === 'image' && (
                            <div className="flex flex-col gap-3">
                                <Title action={
                                    <button type="button" onClick={() => fileRef.current?.click()} className="text-[10px] text-[#FF5C8D] hover:text-white flex items-center gap-1">
                                        <Upload className="w-3 h-3" /> Carregar
                                    </button>
                                }>Imagem</Title>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
                                <div className="grid grid-cols-4 gap-1.5 max-h-[188px] overflow-y-auto pr-1 custom-scrollbar">
                                    {settings.backgroundImage && !COVER_IMAGES.includes(settings.backgroundImage) && (
                                        <button type="button" className="aspect-square rounded-md bg-cover bg-center ring-2 ring-[#FF0054]" style={{ backgroundImage: `url(${settings.backgroundImage})` }} title="Imagem carregada" />
                                    )}
                                    {COVER_IMAGES.map(url => (
                                        <button
                                            key={url}
                                            type="button"
                                            onClick={() => onChange({ backgroundType: 'image', backgroundImage: url })}
                                            className={cn("aspect-square rounded-md bg-cover bg-center transition-all hover:opacity-100", settings.backgroundImage === url ? "ring-2 ring-[#FF0054]" : "opacity-75")}
                                            style={{ backgroundImage: `url(${url})` }}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Title>Movimento da imagem</Title>
                                    <Segmented
                                        value={c.imageMotion}
                                        options={([['none', 'Fixa'], ['parallax', 'Parallax'], ['zoom', 'Zoom lento'], ['liquid', 'Líquida']] as [CoverImageMotion, string][]).map(([id, label]) => ({ id, label }))}
                                        onChange={(imageMotion) => setCover({ imageMotion })}
                                    />
                                    <Hint>
                                        {c.imageMotion === 'parallax' ? 'A imagem desliza com o rato, dando profundidade.'
                                            : c.imageMotion === 'zoom' ? 'Aproximação lenta e contínua (efeito Ken Burns).'
                                                : c.imageMotion === 'liquid' ? 'A imagem ondula como água e agita-se quando o rato passa.'
                                                    : 'A imagem fica parada.'}
                                    </Hint>
                                </div>
                                <Segmented
                                    value={c.imagePosition}
                                    options={[{ id: 'top', label: 'Topo' }, { id: 'center', label: 'Centro' }, { id: 'bottom', label: 'Base' }]}
                                    onChange={(imagePosition) => setCover({ imagePosition })}
                                />
                                <Range label="Zoom" value={c.imageScale} min={100} max={180} unit="%" onChange={(imageScale) => setCover({ imageScale })} />
                            </div>
                        )}

                        {type === 'gradient' && (
                            <div className="flex flex-col gap-3">
                                <Title action={gradientStops.length < 4 ? (
                                    <button type="button" className="text-[10px] text-[#FF5C8D] hover:text-white flex items-center gap-1"
                                        onClick={() => onChange({ backgroundGradient: { type: 'linear', angle: gradient?.angle ?? 135, stops: [...gradientStops, { color: '#06D6A0', offset: 100 }].map((s, i, all) => ({ ...s, offset: Math.round(i / (all.length - 1) * 100) })) } })}>
                                        <Plus className="w-3 h-3" /> Cor
                                    </button>
                                ) : undefined}>Gradiente</Title>
                                {gradientStops.map((stop, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex-1"><ColorRow label={`Cor ${i + 1}`} value={stop.color} onChange={(color) => onChange({ backgroundGradient: { type: 'linear', angle: gradient?.angle ?? 135, stops: gradientStops.map((s, j) => j === i ? { ...s, color } : s) } })} /></div>
                                        {gradientStops.length > 2 && (
                                            <button type="button" title="Remover" className="text-[#666] hover:text-[#FF0054]"
                                                onClick={() => onChange({ backgroundGradient: { type: 'linear', angle: gradient?.angle ?? 135, stops: gradientStops.filter((_, j) => j !== i).map((s, j, all) => ({ ...s, offset: Math.round(j / (all.length - 1) * 100) })) } })}>
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <Range label="Ângulo" value={gradient?.angle ?? 135} min={0} max={360} unit="°" onChange={(angle) => onChange({ backgroundGradient: { type: 'linear', angle, stops: gradientStops } })} />
                            </div>
                        )}

                        <Divider />
                        <Toggle label="Ecrã inteiro (100vh)" checked={settings.height === '100vh'} onChange={(on) => onChange({ height: on ? '100vh' : 'fit' })} />
                    </>
                )}

                {tab === 'motion' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Fundo animado</Title>
                            <div className="grid grid-cols-3 gap-2">
                                {COVER_EFFECTS.map(e => (
                                    <button
                                        key={e.id}
                                        type="button"
                                        title={e.hint}
                                        onClick={() => setCover({ effect: e.id })}
                                        className={cn("flex flex-col gap-1.5 p-1.5 rounded-lg border text-left transition-colors", c.effect === e.id ? "border-[#FF0054] bg-[#FF0054]/10" : "border-white/5 hover:border-white/20")}
                                    >
                                        <EffectSwatch effect={e.id} colors={c.colors} />
                                        <span className={cn("text-[11px] font-semibold px-0.5", c.effect === e.id ? "text-white" : "")}>{e.label}</span>
                                    </button>
                                ))}
                            </div>
                            <Hint>{COVER_EFFECTS.find(e => e.id === c.effect)?.hint}{c.effect !== 'none' && type === 'image' ? ' · Desenhado por cima da imagem: use a opacidade e a mistura para as combinar.' : ''}</Hint>
                        </div>

                        {c.effect !== 'none' && (
                            <>
                                <Divider />
                                <div className="flex flex-col gap-3">
                                    <Title action={c.colors.length < 5 ? (
                                        <button type="button" onClick={() => setCover({ colors: [...c.colors, c.colors[c.colors.length - 1] || '#FFFFFF'] })} className="text-[10px] text-[#FF5C8D] hover:text-white flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Cor
                                        </button>
                                    ) : undefined}>Cores</Title>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COVER_PALETTES.map(p => (
                                            <button key={p.name} type="button" title={p.name} onClick={() => setCover({ colors: p.colors })}
                                                className="h-6 pl-1 pr-2 rounded-full bg-[#16171C] border border-white/5 hover:border-white/25 flex items-center gap-1.5 text-[10px]">
                                                <span className="flex">{p.colors.slice(0, 4).map((col, i) => <span key={i} className="w-3 h-3 rounded-full -ml-1 first:ml-0 border border-black/40" style={{ background: col }} />)}</span>
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                    {c.colors.map((color, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="flex-1"><ColorRow label={`Cor ${i + 1}`} value={color} onChange={(next) => setCover({ colors: c.colors.map((x, j) => j === i ? next : x) })} /></div>
                                            {c.colors.length > 2 && (
                                                <button type="button" title="Remover" onClick={() => setCover({ colors: c.colors.filter((_, j) => j !== i) })} className="text-[#666] hover:text-[#FF0054]"><X className="w-3.5 h-3.5" /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Divider />
                                <div className="flex flex-col gap-3">
                                    <Title>Comportamento</Title>
                                    <Range label="Velocidade" value={c.speed} min={0.2} max={3} step={0.1} unit="×" onChange={(speed) => setCover({ speed })} />
                                    <Range label="Intensidade" value={c.intensity} min={0} max={100} unit="%" onChange={(intensity) => setCover({ intensity })} />
                                    <Range label="Tamanho das formas" value={c.scale} min={0} max={100} unit="%" onChange={(scale) => setCover({ scale })} />
                                    {(c.effect === 'mesh' || c.effect === 'fluid' || c.effect === 'aurora') && (
                                        <Range label="Suavidade" value={c.blur} min={0} max={100} unit="%" onChange={(blur) => setCover({ blur })} />
                                    )}
                                    <Range label="Opacidade" value={c.effectOpacity} min={0} max={100} unit="%" onChange={(effectOpacity) => setCover({ effectOpacity })} />
                                    <div className="flex flex-col gap-1.5">
                                        <Title>Mistura com o fundo</Title>
                                        <select
                                            value={c.blend}
                                            onChange={(e) => setCover({ blend: e.target.value as CoverBlend })}
                                            className="w-full h-8 bg-[#1A1C23] rounded px-2 text-[12px] text-white outline-none cursor-pointer"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="screen">Clarear (screen)</option>
                                            <option value="overlay">Sobrepor (overlay)</option>
                                            <option value="soft-light">Luz suave</option>
                                            <option value="multiply">Multiplicar</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Interação com o rato</Title>
                            <Toggle label="Reage ao rato" checked={c.interactive} onChange={(interactive) => setCover({ interactive })} />
                            {c.interactive && <Range label="Força" value={c.mouseStrength} min={0} max={100} unit="%" onChange={(mouseStrength) => setCover({ mouseStrength })} />}
                            <Hint>O fundo animado e a imagem (parallax / líquida) seguem o rato. Nos ecrãs táteis, segue o dedo.</Hint>
                        </div>
                    </>
                )}

                {tab === 'finish' && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Title>Camada de cor</Title>
                            <Segmented
                                value={c.overlay}
                                options={([['none', 'Nada'], ['solid', 'Sólida'], ['bottom', 'Baixo'], ['top', 'Topo'], ['left', 'Lado'], ['radial', 'Bordas']] as [CoverOverlay, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(overlay) => setCover({ overlay })}
                            />
                            {c.overlay !== 'none' && (
                                <>
                                    <ColorRow label="Cor" value={c.overlayColor} onChange={(overlayColor) => setCover({ overlayColor })} />
                                    <Range label="Opacidade" value={c.overlayOpacity} min={0} max={100} unit="%" onChange={(overlayOpacity) => setCover({ overlayOpacity })} />
                                </>
                            )}
                            <Hint>Dá legibilidade ao texto sobre imagens e fundos animados.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Luz que segue o cursor" checked={c.spotlight} onChange={(spotlight) => setCover({ spotlight })} />
                            {c.spotlight && (
                                <>
                                    <ColorRow label="Cor da luz" value={c.spotlightColor} onChange={(spotlightColor) => setCover({ spotlightColor })} />
                                    <Range label="Tamanho" value={c.spotlightSize} min={0} max={100} unit="%" onChange={(spotlightSize) => setCover({ spotlightSize })} />
                                    <Range label="Intensidade" value={c.spotlightOpacity} min={5} max={100} unit="%" onChange={(spotlightOpacity) => setCover({ spotlightOpacity })} />
                                </>
                            )}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Range label="Vinheta" value={c.vignette} min={0} max={100} unit="%" onChange={(vignette) => setCover({ vignette })} />
                            <Range label="Grão de filme" value={c.grain} min={0} max={100} unit="%" onChange={(grain) => setCover({ grain })} />
                            {c.grain > 0 && <Toggle label="Grão animado" checked={c.grainAnimated} onChange={(grainAnimated) => setCover({ grainAnimated })} />}
                        </div>
                    </>
                )}

                <button type="button" onClick={() => onReset ? onReset() : onChange({ cover: {} })} className="flex items-center justify-center gap-1.5 h-8 text-[12px] text-[#666] hover:text-white">
                    <RotateCcw className="w-3 h-3" /> Limpar efeitos da capa
                </button>
            </div>
        </div>
    )
}

/** Context bar of a cover: settings, quick animated background, section settings, order, copy, duplicate, delete */
export const CoverBar = ({ settings, onSettings, onEffect, onEditSection, onAnimate, onMoveUp, onMoveDown, onCopy, onDuplicate, onDelete, isFirst, isLast, settingsOpen }: {
    settings: Settings
    onSettings: () => void
    onEffect: (effect: CoverEffect) => void
    onEditSection: (e: React.MouseEvent) => void
    onAnimate: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onCopy?: () => void
    onDuplicate?: () => void
    onDelete?: () => void
    isFirst?: boolean
    isLast?: boolean
    settingsOpen?: boolean
}) => {
    const [copied, setCopied] = useState(false)
    const c = resolveCover(settings.cover)
    const button = (title: string, icon: React.ReactNode, onClick?: (e: React.MouseEvent) => void, opts: { danger?: boolean, disabled?: boolean, active?: boolean } = {}) => (
        <button
            type="button"
            title={title}
            disabled={opts.disabled || !onClick}
            onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
            className={cn(
                "w-8 h-8 rounded flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 disabled:pointer-events-none",
                opts.active ? "text-white bg-white/10" : "text-[#97A1B3]",
                opts.danger ? "hover:text-[#FF0054] hover:bg-[#FF0054]/10" : "hover:text-white hover:bg-white/10"
            )}
        >
            {icon}
        </button>
    )
    return (
        <div className="flex items-center gap-0.5 bg-[#15161B]/95 backdrop-blur border border-[#333] rounded-md px-1.5 h-[40px] shadow-xl whitespace-nowrap text-[#97A1B3]" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-medium px-2 flex items-center gap-1.5 text-white"><Sparkles className="w-3.5 h-3.5 text-[#FF0054]" /> Capa</span>
            <div className="w-px h-4 bg-[#333] mx-1" />
            {button('Configurar a capa (fundo, movimento, acabamento)', <Settings2 className="w-4 h-4" />, onSettings, { active: settingsOpen })}
            <select
                value={c.effect}
                title="Fundo animado"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onEffect(e.target.value as CoverEffect)}
                className="h-7 bg-transparent hover:bg-white/10 rounded px-1.5 text-[12px] text-white outline-none cursor-pointer"
            >
                {COVER_EFFECTS.map(e => <option key={e.id} value={e.id} className="bg-[#15161B]">{e.id === 'none' ? 'Sem animação' : e.label}</option>)}
            </select>
            {button('Definições da secção (colunas, margens…)', <ImageIcon className="w-4 h-4" />, onEditSection)}
            {button('Animar a entrada', <Zap className="w-4 h-4" />, onAnimate)}
            <div className="w-px h-4 bg-[#333] mx-1" />
            {button('Mover para cima', <ArrowUp className="w-4 h-4" />, onMoveUp, { disabled: isFirst })}
            {button('Mover para baixo', <ArrowDown className="w-4 h-4" />, onMoveDown, { disabled: isLast })}
            {button(copied ? 'Copiado' : 'Copiar', copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />, onCopy ? () => { onCopy(); setCopied(true); window.setTimeout(() => setCopied(false), 1500) } : undefined)}
            {button('Duplicar', <CopyPlus className="w-4 h-4" />, onDuplicate)}
            {button('Eliminar', <Trash2 className="w-4 h-4" />, onDelete, { danger: true })}
        </div>
    )
}
