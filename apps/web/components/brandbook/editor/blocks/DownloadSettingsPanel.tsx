import React, { useState, useEffect, useRef } from "react"
import { Upload, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { MarginSettingsControl } from "./MarginSettingsControl"
import { SmoothColorInput } from "../SmoothColorInput"
import { DOWNLOAD_DEFAULTS, HOVER_EFFECTS, ICON_EFFECTS, type DownloadStyle } from "./downloadStyle"

interface DownloadSettingsPanelProps {
    onClose: () => void
    settings: DownloadStyle
    onUpdate: (settings: Partial<DownloadStyle>) => void
    onUpload: () => void
    onDelete: () => void
}

// Outside the panel, so a colour picker being dragged is not remounted on every change
const ColorRow = ({ label, value, onChange, onReset }: { label: string, value: string, onChange: (val: string) => void, onReset?: () => void }) => (
    <div className="flex items-center justify-between gap-3">
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
            {onReset && (
                <button type="button" title="Repor" onClick={onReset} className="text-[#555] hover:text-white transition-colors">
                    <RotateCcw className="w-3 h-3" />
                </button>
            )}
            <span className="font-mono text-[11px] uppercase text-[#666] w-[58px] text-right">{value.startsWith('#') ? value : ''}</span>
            <label className="w-7 h-7 rounded-full border border-white/15 cursor-pointer relative overflow-hidden" style={{ backgroundColor: value }}>
                <SmoothColorInput
                    type="color"
                    value={value.startsWith('#') ? value : '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
            </label>
        </div>
    </div>
)

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("w-[32px] h-[18px] rounded-full relative transition-colors shrink-0", checked ? "bg-[#FF0054]" : "bg-[#3F3F46]")}
    >
        <span className={cn("absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all", checked ? "right-[2px]" : "left-[2px]")} />
    </button>
)

const GroupTitle = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#666] text-[10px] font-medium uppercase tracking-wider">{children}</span>
)

const Chips = <T extends string>({ value, options, onChange }: { value: T, options: { id: T, label: string }[], onChange: (v: T) => void }) => (
    <div className="grid grid-cols-3 gap-1 bg-[#1A1C23] p-1 rounded-md">
        {options.map(o => (
            <button
                key={o.id}
                type="button"
                onClick={() => onChange(o.id)}
                className={cn("h-7 rounded text-[10px] font-bold transition-colors", value === o.id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
            >
                {o.label}
            </button>
        ))}
    </div>
)

const pxValue = (value: string | number | undefined) => String(value ?? '').replace('px', '')

const NumberBox = ({ label, value, onChange }: { label?: string, value: string | number | undefined, onChange: (v: string) => void }) => (
    <div className="flex items-center gap-2 bg-[#1A1C23] border border-transparent hover:border-[#333] rounded px-2 py-1">
        {label && <span className="text-[#555] text-xs">{label}</span>}
        <input
            type="text"
            inputMode="numeric"
            value={pxValue(value)}
            onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
            className="w-9 bg-transparent text-right outline-none text-[#97A1B3]"
            placeholder="00"
        />
    </div>
)

export const DownloadSettingsPanel = ({ onClose, settings, onUpdate, onUpload }: DownloadSettingsPanelProps) => {
    const [tab, setTab] = useState<'style' | 'hover'>('style')

    // Drag by the header
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartPos = useRef({ x: 0, y: 0 })
    const panelStartPos = useRef({ x: 0, y: 0 })

    useEffect(() => {
        if (!isDragging) return
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: panelStartPos.current.x + e.clientX - dragStartPos.current.x,
                y: panelStartPos.current.y + e.clientY - dragStartPos.current.y
            })
        }
        const handleMouseUp = () => setIsDragging(false)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    const startDrag = (e: React.MouseEvent) => {
        setIsDragging(true)
        dragStartPos.current = { x: e.clientX, y: e.clientY }
        panelStartPos.current = { ...position }
    }

    const s = settings || {}
    const d = DOWNLOAD_DEFAULTS
    // Colour row bound to one style key, with reset to the default
    const color = (key: keyof typeof DOWNLOAD_DEFAULTS & keyof DownloadStyle, label: string, fallback?: string) => (
        <ColorRow
            label={label}
            value={(s[key] as string) || fallback || (d[key] as string)}
            // Picking a hover colour turns hover colours on
            onChange={(c) => onUpdate(key.startsWith('hover') ? { [key]: c, hoverEnabled: true } : { [key]: c })}
            onReset={s[key] ? () => onUpdate({ [key]: undefined }) : undefined}
        />
    )

    return (
        <div
            className="w-[300px] max-h-[min(640px,calc(100vh-120px))] flex flex-col bg-[#111216] rounded-lg shadow-2xl border border-[#333] overflow-hidden"
            style={{ transform: `translate(${position.x}px, ${position.y}px)`, position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div
                className="h-[48px] bg-[#FF0054] flex items-center justify-between px-4 cursor-move shrink-0 touch-none select-none relative"
                onMouseDown={startDrag}
            >
                <span className="text-white font-medium">Download settings</span>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClose() }}
                    className="w-5 h-5 bg-black rounded-full flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    onMouseDown={e => e.stopPropagation()}
                >
                    <span className="sr-only">Close</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 mx-5 mt-4 bg-[#1A1C23] rounded-md shrink-0">
                {([['style', 'Estilo'], ['hover', 'Hover']] as const).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 pt-4 flex flex-col gap-5 text-[#97A1B3] text-sm custom-scrollbar">
                {tab === 'style' ? (
                    <>
                        <div className="flex items-center justify-between cursor-pointer hover:text-white transition-colors" onClick={onUpload}>
                            <span>Add download</span>
                            <Upload className="w-5 h-5" />
                        </div>

                        <div className="h-px bg-[#333] w-full" />

                        <div className="flex flex-col gap-3">
                            <GroupTitle>Cartão</GroupTitle>
                            {color('backgroundColor', 'Fundo')}
                            {color('borderColor', 'Borda')}
                            {color('textColor', 'Título')}
                            <ColorRow
                                label="Detalhes (tamanho · tipo)"
                                value={s.metaColor || s.textColor || d.textColor}
                                onChange={(c) => onUpdate({ metaColor: c })}
                                onReset={s.metaColor ? () => onUpdate({ metaColor: undefined }) : undefined}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <GroupTitle>Ícone do ficheiro</GroupTitle>
                            {color('iconBgColor', 'Fundo do ícone')}
                            {color('iconColor', 'Ícone')}
                        </div>

                        <div className="flex flex-col gap-3">
                            <GroupTitle>Botão Download</GroupTitle>
                            {color('buttonBgColor', 'Fundo')}
                            {color('buttonTextColor', 'Texto e ícone')}
                            {color('buttonBorderColor', 'Borda')}
                        </div>

                        <div className="h-px bg-[#333] w-full" />

                        <div className="flex items-center justify-between">
                            <span>Dimensão</span>
                            <div className="flex items-center gap-2">
                                <NumberBox label="w" value={s.width} onChange={(v) => onUpdate({ width: v ? `${v}px` : undefined })} />
                                <NumberBox label="h" value={s.height} onChange={(v) => onUpdate({ height: v ? `${v}px` : undefined })} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Radius</span>
                            <NumberBox value={s.borderRadius ?? 8} onChange={(v) => onUpdate({ borderRadius: v ? `${v}px` : '0px' })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Border</span>
                            <NumberBox value={s.borderWidth ?? 1} onChange={(v) => onUpdate({ borderWidth: v ? `${v}px` : '0px' })} />
                        </div>

                        <div className="h-px bg-[#333] w-full" />

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span>Detalhes ao passar o rato</span>
                                <Toggle checked={s.showPreview !== false} onChange={(v) => onUpdate({ showPreview: v })} />
                            </div>
                            <span className="text-[11px] text-[#666] -mt-1">Janela com os dados do ficheiro, no link partilhado.</span>
                            {s.showPreview !== false && (
                                <ColorRow
                                    label="Cor do cabeçalho"
                                    value={s.previewHeaderColor || '#05AB80'}
                                    onChange={(c) => onUpdate({ previewHeaderColor: c })}
                                    onReset={s.previewHeaderColor ? () => onUpdate({ previewHeaderColor: undefined }) : undefined}
                                />
                            )}
                        </div>

                        <div className="h-px bg-[#333] w-full" />

                        <MarginSettingsControl margin={s.margin} onChange={(m) => onUpdate({ margin: m })} />
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-white">Cores no hover</span>
                            <Toggle checked={!!s.hoverEnabled} onChange={(v) => onUpdate({ hoverEnabled: v })} />
                        </div>
                        <span className="text-[11px] text-[#666] -mt-3">Cores do bloco ao passar o rato. Escolher uma cor ativa o hover.</span>

                        <div className={cn("flex flex-col gap-3 pl-4 border-l border-[#333] ml-1 transition-opacity", !s.hoverEnabled && "opacity-50")}>
                            <GroupTitle>Cartão</GroupTitle>
                            {color('hoverBackgroundColor', 'Fundo')}
                            {color('hoverBorderColor', 'Borda')}
                            {color('hoverTextColor', 'Texto')}
                            <GroupTitle>Ícone do ficheiro</GroupTitle>
                            {color('hoverIconBgColor', 'Fundo do ícone')}
                            {color('hoverIconColor', 'Ícone')}
                            <GroupTitle>Botão Download</GroupTitle>
                            {color('hoverButtonBgColor', 'Fundo')}
                            {color('hoverButtonTextColor', 'Texto e ícone')}
                        </div>

                        <div className="h-px bg-[#333] w-full" />

                        <div className="flex flex-col gap-2">
                            <GroupTitle>Movimento do cartão</GroupTitle>
                            <Chips value={s.hoverEffect || 'none'} options={HOVER_EFFECTS} onChange={(v) => onUpdate({ hoverEffect: v })} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <GroupTitle>Ícone de download</GroupTitle>
                            <Chips value={s.hoverIconEffect || 'none'} options={ICON_EFFECTS} onChange={(v) => onUpdate({ hoverIconEffect: v })} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <GroupTitle>Duração</GroupTitle>
                                <span className="text-[11px] text-white tabular-nums">{s.hoverDuration ?? d.hoverDuration}ms</span>
                            </div>
                            <input
                                type="range"
                                min={100}
                                max={1000}
                                step={50}
                                value={s.hoverDuration ?? d.hoverDuration}
                                onChange={(e) => onUpdate({ hoverDuration: Number(e.target.value) })}
                                className="w-full accent-[#FF0054] h-1 cursor-pointer"
                            />
                        </div>

                        {['glow', 'shadow', 'lift', 'tilt'].includes(s.hoverEffect || '') && (
                            <ColorRow
                                label={s.hoverEffect === 'glow' ? 'Cor do brilho' : 'Cor da sombra'}
                                value={s.hoverEffectColor || (s.hoverEffect === 'glow' ? (s.hoverBorderColor || d.hoverBorderColor) : '#000000')}
                                onChange={(c) => onUpdate({ hoverEffectColor: c })}
                                onReset={s.hoverEffectColor ? () => onUpdate({ hoverEffectColor: undefined }) : undefined}
                            />
                        )}

                    </>
                )}
            </div>
        </div>
    )
}
