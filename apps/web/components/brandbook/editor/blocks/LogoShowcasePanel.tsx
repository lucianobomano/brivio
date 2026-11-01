"use client"

import React, { useRef, useState } from "react"
import { ArrowUp, ArrowDown, Plus, Trash2, Upload, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { toast } from "sonner"
import { useBrandDesign } from "../BrandDesignContext"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"
import {
    clearSpaceLabel, logoVersionId,
    type LogoControlsLayout, type LogoFont, type LogoShowcaseContent, type LogoShowcaseSettings, type LogoTabsStyle, type LogoVersion,
    type resolveLogoShowcaseSettings,
} from "./logoShowcase"

type Resolved = ReturnType<typeof resolveLogoShowcaseSettings>

interface Props extends BlockActions {
    blockId: string
    content: LogoShowcaseContent
    resolved: Resolved
    activeIndex: number
    onActiveIndex: (i: number) => void
    onChange: (content: LogoShowcaseContent) => void
    /** Shows the clear-space guide while it's being adjusted */
    onPreviewClearSpace: () => void
    onClose: () => void
}

/** Uploads a logo file of the brand; null when it fails (with a toast) */
export const useLogoUpload = (blockId: string) => {
    const { brandId } = useBrandDesign()
    return async (file: File): Promise<string | null> => {
        if (!brandId) { toast.error('Não foi possível carregar: marca desconhecida.'); return null }
        const toastId = toast.loading('A carregar o logótipo…')
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('brandId', brandId)
            formData.append('moduleId', blockId)
            const result = await uploadBrandbookMedia(formData)
            if (result.success && result.url) {
                toast.success('Logótipo carregado', { id: toastId })
                return result.url
            }
            toast.error('Erro ao carregar o logótipo.', { id: toastId })
        } catch {
            toast.error('Erro ao carregar o logótipo.', { id: toastId })
        }
        return null
    }
}

const Divider = () => <div className="h-px bg-[#333]" />

/** One version: preview on its background, label, background, logo file, size */
const VersionCard = ({ version, index, count, active, onSelect, onChange, onMove, onRemove, onUpload }: {
    version: LogoVersion, index: number, count: number, active: boolean
    onSelect: () => void
    onChange: (patch: Partial<LogoVersion>) => void
    onMove: (dir: -1 | 1) => void
    onRemove: () => void
    onUpload: (file: File) => void
}) => {
    const fileRef = useRef<HTMLInputElement>(null)
    return (
        <div
            onClick={onSelect}
            className={cn("rounded-lg border p-2 flex flex-col gap-2 cursor-pointer transition-colors", active ? "border-[#FF0054]/50 bg-[#16171C]" : "border-white/5 bg-[#16171C] hover:border-white/15")}
        >
            <div className="flex items-center gap-2">
                <div className="w-14 h-10 rounded-md shrink-0 flex items-center justify-center overflow-hidden border border-white/10" style={{ backgroundColor: version.background }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {version.url ? <img src={version.url} alt="" className="max-w-[70%] max-h-[60%] object-contain" /> : <span className="text-[9px] text-[#888]">Vazio</span>}
                </div>
                <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <Field value={version.label} placeholder="Nome da versão" onChange={(label) => onChange({ label })} />
                </div>
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <button type="button" title="Subir" disabled={index === 0} onClick={() => onMove(-1)} className="w-6 h-4 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                    <button type="button" title="Descer" disabled={index === count - 1} onClick={() => onMove(1)} className="w-6 h-4 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                </div>
                <button type="button" title="Remover versão" disabled={count <= 1} onClick={(e) => { e.stopPropagation(); onRemove() }} className="w-6 h-8 flex items-center justify-center text-[#666] hover:text-[#FF0054] disabled:opacity-20"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            {active && (
                <div className="flex flex-col gap-3 px-1 pb-1" onClick={(e) => e.stopPropagation()}>
                    <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }} />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="h-8 rounded-md bg-[#FF0054]/15 text-[#FF5C8D] hover:bg-[#FF0054]/25 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Upload className="w-3.5 h-3.5" /> {version.url ? 'Substituir logótipo' : 'Carregar logótipo'}
                    </button>
                    <ColorRow label="Fundo" value={version.background} onChange={(background) => onChange({ background })} />
                    <Range label="Tamanho nesta versão" value={version.scale ?? 100} min={30} max={200} step={5} unit="%" onChange={(scale) => onChange({ scale })} />
                </div>
            )}
        </div>
    )
}

export const LogoShowcasePanel = ({ blockId, content, resolved: s, activeIndex, onActiveIndex, onChange, onPreviewClearSpace, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'versions' | 'stage' | 'tabs' | 'clear'>('versions')
    const drag = usePanelDrag()
    const upload = useLogoUpload(blockId)
    const versions = content.versions

    const set = (patch: Partial<LogoShowcaseSettings>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const setClear = (patch: Partial<LogoShowcaseSettings>) => { set(patch); onPreviewClearSpace() }
    const setVersions = (next: LogoVersion[]) => onChange({ ...content, versions: next })
    const setVersion = (id: string, patch: Partial<LogoVersion>) => setVersions(versions.map(v => v.id === id ? { ...v, ...patch } : v))

    return (
        <div
            className="w-[340px] max-h-[min(720px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Logótipo</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['versions', 'Versões'], ['stage', 'Fundo'], ['tabs', 'Separadores'], ['clear', 'Clear space']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'versions' && (
                    <>
                        <Hint>Cada versão é um separador: carregue o símbolo ou o logótipo completo (SVG ou PNG) e escolha o fundo.</Hint>
                        <div className="flex flex-col gap-2">
                            {versions.map((v, i) => (
                                <VersionCard
                                    key={v.id}
                                    version={v}
                                    index={i}
                                    count={versions.length}
                                    active={i === activeIndex}
                                    onSelect={() => onActiveIndex(i)}
                                    onChange={(patch) => setVersion(v.id, patch)}
                                    onMove={(dir) => {
                                        const j = i + dir
                                        if (j < 0 || j >= versions.length) return
                                        const next = [...versions]
                                        ;[next[i], next[j]] = [next[j], next[i]]
                                        setVersions(next)
                                        if (i === activeIndex) onActiveIndex(j)
                                    }}
                                    onRemove={() => {
                                        setVersions(versions.filter(x => x.id !== v.id))
                                        onActiveIndex(Math.max(0, Math.min(activeIndex, versions.length - 2)))
                                    }}
                                    onUpload={async (file) => {
                                        const url = await upload(file)
                                        if (url) setVersion(v.id, { url })
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            disabled={versions.length >= 8}
                            onClick={() => {
                                const current = versions[activeIndex]
                                setVersions([...versions, { id: logoVersionId(), label: `Versão ${versions.length + 1}`, url: current?.url || '', background: '#FFFFFF' }])
                                onActiveIndex(versions.length)
                            }}
                            className="h-9 rounded-md border border-dashed border-[#333] text-[12px] text-[#97A1B3] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
                        >
                            <Plus className="w-3.5 h-3.5" /> Adicionar versão
                        </button>
                    </>
                )}

                {tab === 'stage' && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Title>Palco</Title>
                            <Range label="Altura" value={s.stageHeight} min={160} max={900} step={10} unit="px" onChange={(stageHeight) => set({ stageHeight })} />
                            <Range label="Cantos" value={s.radius} min={0} max={48} unit="px" onChange={(radius) => set({ radius })} />
                            <Range label="Borda" value={s.borderWidth} min={0} max={8} unit="px" onChange={(borderWidth) => set({ borderWidth })} />
                            {s.borderWidth > 0 && <ColorRow label="Cor da borda" value={s.borderColor} onChange={(borderColor) => set({ borderColor })} />}
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Logótipo</Title>
                            <Range label="Altura do logótipo" value={s.logoSize} min={10} max={90} unit="%" onChange={(logoSize) => set({ logoSize })} />
                            <Range label="Largura máxima" value={s.logoMaxWidth} min={20} max={100} unit="%" onChange={(logoMaxWidth) => set({ logoMaxWidth })} />
                            <Hint>Logótipos compostos (símbolo + lettering) ficam limitados pela largura máxima.</Hint>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title action={s.blockBackground ? <button type="button" onClick={() => set({ blockBackground: '' })} className="text-[10px] text-[#666] hover:text-white">Sem fundo</button> : undefined}>Bloco</Title>
                            <ColorRow label="Fundo do bloco" value={s.blockBackground} onChange={(blockBackground) => set({ blockBackground })} />
                            <Range label="Margem interna" value={s.blockPadding} min={0} max={80} unit="px" onChange={(blockPadding) => set({ blockPadding })} />
                            <Range label="Cantos do bloco" value={s.blockRadius} min={0} max={48} unit="px" onChange={(blockRadius) => set({ blockRadius })} />
                        </div>
                    </>
                )}

                {tab === 'tabs' && (
                    <>
                        <Toggle label="Mostrar separadores" checked={s.showTabs} onChange={(showTabs) => set({ showTabs })} />
                        <div className="flex flex-col gap-2">
                            <Title>Estilo</Title>
                            <Segmented
                                value={s.tabsStyle}
                                options={([['pill', 'Pílula'], ['outline', 'Contorno'], ['underline', 'Linha'], ['text', 'Texto']] as [LogoTabsStyle, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(tabsStyle) => set({ tabsStyle })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Posição</Title>
                            <Segmented
                                value={s.controlsLayout}
                                options={([['split', 'Afastados'], ['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']] as [LogoControlsLayout, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(controlsLayout) => set({ controlsLayout })}
                            />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Cores</Title>
                            {s.tabsStyle === 'pill' && <ColorRow label="Fundo da barra" value={s.tabsBackground} onChange={(tabsBackground) => set({ tabsBackground })} />}
                            <ColorRow label={s.tabsStyle === 'pill' ? 'Separador ativo' : 'Ativo'} value={s.activeBackground} onChange={(activeBackground) => set({ activeBackground })} />
                            {s.tabsStyle === 'pill' && <ColorRow label="Texto do ativo" value={s.activeColor} onChange={(activeColor) => set({ activeColor })} />}
                            <ColorRow label="Inativos" value={s.tabColor} onChange={(tabColor) => set({ tabColor })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Texto</Title>
                            <Segmented
                                value={s.tabFont}
                                options={([['mono', 'Mono'], ['sans', 'Sans'], ['brand', 'Marca']] as [LogoFont, string][]).map(([id, label]) => ({ id, label }))}
                                onChange={(tabFont) => set({ tabFont })}
                            />
                            <Toggle label="Maiúsculas" checked={s.uppercase} onChange={(uppercase) => set({ uppercase })} />
                            <Range label="Tamanho" value={s.tabSize} min={9} max={18} unit="px" onChange={(tabSize) => set({ tabSize })} />
                            <Toggle label="Cantos totalmente redondos" checked={s.tabRadius >= 999} onChange={(round) => set({ tabRadius: round ? 999 : 8 })} />
                            {s.tabRadius < 999 && <Range label="Cantos" value={s.tabRadius} min={0} max={24} unit="px" onChange={(tabRadius) => set({ tabRadius })} />}
                            <Range label="Distância ao palco" value={s.controlsGap} min={0} max={64} unit="px" onChange={(controlsGap) => set({ controlsGap })} />
                        </div>
                    </>
                )}

                {tab === 'clear' && (
                    <>
                        <Hint>A zona de segurança é medida a partir do logótipo: valor × referência. Para um logótipo completo, use como referência a altura do símbolo ou de uma letra (% da altura do logótipo).</Hint>
                        <div className="flex flex-col gap-3">
                            <Range label="Zona de segurança" value={s.clearSpace} min={0.1} max={2} step={0.05} unit="×" onChange={(clearSpace) => setClear({ clearSpace })} />
                            <Range label="Referência" value={s.clearSpaceRef} min={5} max={100} unit="%" onChange={(clearSpaceRef) => setClear({ clearSpaceRef })} />
                            <div className="flex flex-col gap-1.5">
                                <Title>Nome da referência</Title>
                                <Field value={content.settings.clearSpaceRefLabel ?? s.clearSpaceRefLabel} placeholder="Mark height" onChange={(clearSpaceRefLabel) => setClear({ clearSpaceRefLabel })} />
                            </div>
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Title>Guia</Title>
                            <ColorRow label="Cor" value={s.clearSpaceColor} onChange={(clearSpaceColor) => setClear({ clearSpaceColor })} />
                            <Segmented
                                value={s.clearSpaceLine}
                                options={[{ id: 'solid' as const, label: 'Contínua' }, { id: 'dashed' as const, label: 'Tracejada' }]}
                                onChange={(clearSpaceLine) => setClear({ clearSpaceLine })}
                            />
                            <Toggle label="Etiqueta" checked={s.showClearSpaceLabel} onChange={(showClearSpaceLabel) => setClear({ showClearSpaceLabel })} />
                            {s.showClearSpaceLabel && (
                                <div className="flex flex-col gap-1.5">
                                    <Title>Texto da etiqueta</Title>
                                    <Field value={content.settings.clearSpaceLabel || ''} placeholder={clearSpaceLabel({ ...s, clearSpaceLabel: '' })} onChange={(label) => setClear({ clearSpaceLabel: label })} />
                                </div>
                            )}
                            <Toggle label="Visível ao abrir a página" checked={s.clearSpaceOn} onChange={(clearSpaceOn) => setClear({ clearSpaceOn })} />
                        </div>
                        <Divider />
                        <div className="flex flex-col gap-3">
                            <Toggle label="Botão Clear space" checked={s.showClearSpaceButton} onChange={(showClearSpaceButton) => set({ showClearSpaceButton })} />
                            {s.showClearSpaceButton && (
                                <Field value={content.settings.clearSpaceButtonLabel ?? s.clearSpaceButtonLabel} placeholder="Clear space" onChange={(clearSpaceButtonLabel) => set({ clearSpaceButtonLabel })} />
                            )}
                        </div>
                    </>
                )}

                {tab !== 'versions' && (
                    <button type="button" onClick={() => onChange({ ...content, settings: {} })} className="flex items-center justify-center gap-1.5 h-8 text-[12px] text-[#666] hover:text-white">
                        <RotateCcw className="w-3 h-3" /> Repor estilo de origem
                    </button>
                )}
            </div>

            <PanelActions {...actions} />
        </div>
    )
}
