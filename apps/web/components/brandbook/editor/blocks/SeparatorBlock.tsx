"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import { AlignLeft, AlignCenter, AlignRight, Minus, GripVertical } from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { AnimationPanel } from "../AnimationPanel"
import { BlockContextBar, PanelActions, useHoverIntent } from "./BlockContextBar"
import { ColorRow, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { MarginSettingsControl } from "./MarginSettingsControl"

/**
 * A line (separator). Shared by the brandbook editor and the proposal editor. Its look is kept in
 * `block.content.style`: height (thickness), backgroundColor (colour), width ("100%" or px / %), margin — the
 * fields older lines already have — plus lineStyle, dash, gap, radius, opacity, fade, orientation, length, align.
 */

type LineStyle = "solid" | "dashed" | "dotted" | "double"

interface SeparatorBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onCopy?: (id: string) => void
    onDuplicate?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    /** Opens the editor's animation panel (brandbook) */
    onAnimate?: () => void
    /** The block opens its own animation panel (the proposal editor) */
    ownAnimationPanel?: boolean
    /** Alignment of the column, for a line that is not full width */
    align?: 'left' | 'center' | 'right'
}

const num = (v: unknown, fallback: number) => {
    const n = parseFloat(String(v ?? ""))
    return Number.isFinite(n) ? n : fallback
}

export const resolveLine = (style: any = {}) => {
    const width: string = style.width || "100%"
    const isFullWidth = width === "100%"
    return {
        isFullWidth,
        width,
        widthUnit: (typeof width === "string" && width.trim().endsWith("%") ? "%" : "px") as "px" | "%",
        widthValue: num(width, width.endsWith("%") ? 50 : 240),
        thickness: Math.max(1, num(style.height, 3)),
        color: style.backgroundColor || "#000000",
        lineStyle: (style.lineStyle || "solid") as LineStyle,
        dash: Math.max(1, num(style.dash, 12)),
        gap: Math.max(1, num(style.gap, 8)),
        // Older lines were drawn fully rounded
        radius: Math.max(0, num(style.radius, 999)),
        opacity: Math.min(100, Math.max(0, num(style.opacity, 100))),
        fade: !!style.fade,
        orientation: (style.orientation === "vertical" ? "vertical" : "horizontal") as "horizontal" | "vertical",
        length: Math.max(8, num(style.length, 120)),
        align: style.align as 'left' | 'center' | 'right' | undefined,
    }
}

/** The line itself */
export const LineShape = ({ style, align }: { style: any, align?: 'left' | 'center' | 'right' }) => {
    const l = resolveLine(style)
    const vertical = l.orientation === "vertical"
    const t = l.thickness
    const along = vertical ? "180deg" : "90deg"
    let paint: React.CSSProperties
    switch (l.lineStyle) {
        case "dashed":
            paint = { backgroundImage: `repeating-linear-gradient(${along}, ${l.color} 0 ${l.dash}px, transparent ${l.dash}px ${l.dash + l.gap}px)` }
            break
        case "dotted":
            // Round dots as wide as the line is thick
            paint = {
                backgroundImage: `radial-gradient(circle, ${l.color} ${t / 2 - 0.5}px, transparent ${t / 2}px)`,
                backgroundSize: vertical ? `${t}px ${t + l.gap}px` : `${t + l.gap}px ${t}px`,
                backgroundRepeat: vertical ? "repeat-y" : "repeat-x",
            }
            break
        case "double":
            paint = vertical
                ? { borderLeft: `${t}px solid ${l.color}`, borderRight: `${t}px solid ${l.color}` }
                : { borderTop: `${t}px solid ${l.color}`, borderBottom: `${t}px solid ${l.color}` }
            break
        default:
            paint = { backgroundColor: l.color }
    }
    const cross = l.lineStyle === "double" ? t * 2 + Math.max(2, l.gap / 2) : t
    const lineAlign = l.align || align || "left"
    const fadeMask = l.fade ? `linear-gradient(${along}, transparent, #000 18%, #000 82%, transparent)` : undefined
    return (
        <div
            style={{
                ...paint,
                ...(vertical
                    ? { width: cross, height: l.length }
                    : { height: cross, width: l.isFullWidth ? "100%" : l.width, maxWidth: "100%" }),
                borderRadius: l.lineStyle === "dotted" ? undefined : Math.min(l.radius, cross / 2),
                opacity: l.opacity / 100,
                WebkitMaskImage: fadeMask, maskImage: fadeMask,
                // A shorter line (or a vertical one) sits where its alignment says
                marginLeft: (vertical || !l.isFullWidth) && (lineAlign === "center" || lineAlign === "right") ? "auto" : undefined,
                marginRight: (vertical || !l.isFullWidth) && lineAlign === "center" ? "auto" : undefined,
                flexShrink: 0,
            }}
        />
    )
}

export const SeparatorBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onAnimate, ownAnimationPanel, onCopy, onDuplicate, onMove, align }: SeparatorBlockProps) => {
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = useState(false)
    const [showAnimation, setShowAnimation] = useState(false)
    const drag = usePanelDrag()
    const style = block.content?.style || {}
    const l = resolveLine(style)
    const isActive = activeBlockId === block.id
    React.useEffect(() => { if (activeBlockId !== undefined && !isActive) { setShowSettings(false); setShowAnimation(false) } }, [isActive, activeBlockId])

    const set = (patch: Record<string, unknown>) => onUpdate(block.id, { ...block.content, style: { ...style, ...patch } })
    const setWidth = (value: number, unit: 'px' | '%') => set({ width: `${Math.max(1, unit === '%' ? Math.min(100, value) : value)}${unit}`, maxWidth: 'none' })

    const actions = {
        onMove: onMove ? (dir: 'up' | 'down') => onMove(block.id, dir) : undefined,
        onCopy: onCopy ? () => onCopy(block.id) : undefined,
        onDuplicate: onDuplicate ? () => onDuplicate(block.id) : undefined,
        onDelete: onDelete ? () => { setShowSettings(false); onDelete(block.id) } : undefined,
    }
    const animate = ownAnimationPanel
        ? () => { onSelect?.(block.id); setShowSettings(false); setShowAnimation(true) }
        : onAnimate ? () => { onSelect?.(block.id); onAnimate() } : undefined

    if (isReadOnly) {
        return (
            <div className="w-full flex items-center">
                <LineShape style={style} align={align} />
            </div>
        )
    }

    return (
        <div
            {...hoverBind}
            className="relative w-full flex items-center cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        >
            {/* A thin line is still easy to point at */}
            <div className="absolute -inset-y-3 inset-x-0 z-0" />
            <div className={cn("relative w-full flex items-center", (hovered || isActive || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-4")}>
                <LineShape style={style} align={align} />
            </div>

            {(hovered || isActive) && !showSettings && (
                <FloatingPanel placement="top-center" offset={10} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Linha"
                        onSettings={() => { onSelect?.(block.id); setShowAnimation(false); setShowSettings(true) }}
                        onAnimate={animate}
                        {...actions}
                    />
                </FloatingPanel>
            )}

            {showSettings && (
                <FloatingPanel placement="right-start" offset={16}>
                    <div
                        className="w-[320px] max-h-[min(720px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
                        style={drag.style}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                            <span className="text-white font-medium text-lg">Linha</span>
                            <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={() => setShowSettings(false)}>
                                <span className="sr-only">Fechar</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                            <div className="flex flex-col gap-2">
                                <Title>Orientação</Title>
                                <Segmented
                                    value={l.orientation}
                                    options={[
                                        { id: "horizontal" as const, label: <span className="flex items-center gap-1.5"><Minus className="w-3.5 h-3.5" /> Horizontal</span> },
                                        { id: "vertical" as const, label: <span className="flex items-center gap-1.5"><GripVertical className="w-3.5 h-3.5" /> Vertical</span> },
                                    ]}
                                    onChange={(orientation) => set({ orientation })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Title>Estilo</Title>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {([["solid", "Contínua"], ["dashed", "Tracejada"], ["dotted", "Pontilhada"], ["double", "Dupla"]] as [LineStyle, string][]).map(([id, label]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            title={label}
                                            onClick={() => set({ lineStyle: id })}
                                            className={cn(
                                                "h-12 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-colors",
                                                l.lineStyle === id ? "border-[#FF0054] bg-[#FF0054]/10 text-white" : "border-white/5 bg-[#16171C] hover:border-white/20 hover:text-white"
                                            )}
                                        >
                                            <span className="w-8 flex items-center"><LineShape style={{ lineStyle: id, height: 2, backgroundColor: "currentColor", dash: 5, gap: 3, radius: 0 }} /></span>
                                            <span className="text-[9px] font-bold">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Range label="Espessura" value={l.thickness} min={1} max={40} unit="px" onChange={(v) => set({ height: `${v}px` })} />
                            {l.lineStyle === "dashed" && <Range label="Tamanho do traço" value={l.dash} min={1} max={80} unit="px" onChange={(dash) => set({ dash })} />}
                            {(l.lineStyle === "dashed" || l.lineStyle === "dotted" || l.lineStyle === "double") && (
                                <Range label={l.lineStyle === "double" ? "Espaço entre as linhas" : "Espaço entre traços"} value={l.gap} min={1} max={60} unit="px" onChange={(gap) => set({ gap })} />
                            )}
                            {l.lineStyle !== "dotted" && (
                                <div className="flex flex-col gap-2">
                                    <Title>Pontas</Title>
                                    <Segmented
                                        value={l.radius === 0 ? "square" : l.radius >= 999 ? "round" : "custom"}
                                        options={[{ id: "square", label: "Retas" }, { id: "custom", label: "Suaves" }, { id: "round", label: "Redondas" }]}
                                        onChange={(v) => set({ radius: v === "square" ? 0 : v === "round" ? 999 : 2 })}
                                    />
                                    {l.radius > 0 && l.radius < 999 && <Range label="Arredondamento" value={l.radius} min={1} max={20} unit="px" onChange={(radius) => set({ radius })} />}
                                </div>
                            )}

                            <div className="h-px bg-[#333]" />
                            <ColorRow label="Cor" value={l.color} onChange={(backgroundColor) => set({ backgroundColor })} />
                            <Range label="Opacidade" value={l.opacity} min={0} max={100} unit="%" onChange={(opacity) => set({ opacity })} />
                            <Toggle label="Pontas desvanecidas" checked={l.fade} onChange={(fade) => set({ fade })} />

                            <div className="h-px bg-[#333]" />
                            {l.orientation === "horizontal" ? (
                                <>
                                    <Toggle label="Largura total" checked={l.isFullWidth} onChange={(on) => set({ width: on ? "100%" : "240px", maxWidth: "none" })} />
                                    {!l.isFullWidth && (
                                        <div className="flex flex-col gap-2">
                                            <Title action={
                                                <div className="flex gap-0.5 bg-white/5 rounded p-0.5">
                                                    {(["px", "%"] as const).map(unit => (
                                                        <button key={unit} type="button" onClick={() => setWidth(unit === "%" ? 50 : 240, unit)} className={cn("w-7 h-5 rounded text-[11px] transition-colors", l.widthUnit === unit ? "bg-[#FF0054] text-white" : "text-gray-400 hover:text-white")}>{unit}</button>
                                                    ))}
                                                </div>
                                            }>Largura</Title>
                                            <input type="range" min={l.widthUnit === "%" ? 5 : 16} max={l.widthUnit === "%" ? 100 : 1600} value={l.widthValue} onChange={(e) => setWidth(Number(e.target.value), l.widthUnit)} className="w-full accent-[#FF0054] h-1 cursor-pointer" />
                                            <span className="text-[11px] text-white tabular-nums self-end">{l.widthValue}{l.widthUnit}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Range label="Comprimento" value={l.length} min={8} max={800} unit="px" onChange={(length) => set({ length })} />
                            )}
                            {(l.orientation === "vertical" || !l.isFullWidth) && (
                                <div className="flex flex-col gap-2">
                                    <Title action={l.align ? <button type="button" onClick={() => set({ align: undefined })} className="text-[10px] text-[#666] hover:text-white">Seguir a coluna</button> : undefined}>Alinhamento</Title>
                                    <Segmented
                                        value={l.align || align || "left"}
                                        options={[
                                            { id: "left" as const, label: <AlignLeft className="w-3.5 h-3.5" />, title: "Esquerda" },
                                            { id: "center" as const, label: <AlignCenter className="w-3.5 h-3.5" />, title: "Centro" },
                                            { id: "right" as const, label: <AlignRight className="w-3.5 h-3.5" />, title: "Direita" },
                                        ]}
                                        onChange={(a) => set({ align: a })}
                                    />
                                </div>
                            )}

                            <MarginSettingsControl title="Espaço à volta (margem)" margin={style.margin} onChange={(margin) => set({ margin })} />
                        </div>

                        <PanelActions {...actions} />
                    </div>
                </FloatingPanel>
            )}

            {ownAnimationPanel && showAnimation && typeof document !== 'undefined' && createPortal(
                <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <AnimationPanel
                        isOpen
                        onClose={() => setShowAnimation(false)}
                        initialAnimation={block.content?.animation || null}
                        onSelectAnimation={(animation) => onUpdate(block.id, { ...block.content, animation })}
                        animationSettings={block.content?.animationSettings}
                        onAnimationSettingsChange={(animationSettings) => onUpdate(block.id, { ...block.content, animationSettings })}
                        hoverEffect={block.content?.hoverEffect}
                        onHoverEffectChange={(hoverEffect) => onUpdate(block.id, { ...block.content, hoverEffect })}
                    />
                </div>,
                document.body
            )}
        </div>
    )
}
