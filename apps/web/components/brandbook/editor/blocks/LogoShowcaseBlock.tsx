"use client"

import React from "react"
import { Upload } from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { LogoShowcasePanel, useLogoUpload } from "./LogoShowcasePanel"
import {
    LOGO_FONTS, clearSpaceLabel, readLogoShowcaseContent, resolveLogoShowcaseSettings,
    type LogoShowcaseContent, type LogoVersion,
} from "./logoShowcase"

interface LogoShowcaseBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onAnimate?: () => void
}

type Resolved = ReturnType<typeof resolveLogoShowcaseSettings>

/** Tabs + clear-space button under the stage */
const Controls = ({ s, versions, active, onActive, clearOn, onClear }: {
    s: Resolved, versions: LogoVersion[], active: number, onActive: (i: number) => void, clearOn: boolean, onClear: () => void
}) => {
    const text: React.CSSProperties = {
        fontFamily: LOGO_FONTS[s.tabFont],
        fontSize: s.tabSize,
        letterSpacing: '0.12em',
        textTransform: s.uppercase ? 'uppercase' : undefined,
    }
    const pad = { height: Math.round(s.tabSize * 2.9), paddingInline: Math.round(s.tabSize * 1.45) }
    const radius = s.tabRadius

    const tabs = s.showTabs && versions.length > 1 && (
        <div
            role="tablist"
            className="inline-flex items-center max-w-full overflow-x-auto scrollbar-hide"
            style={s.tabsStyle === 'pill'
                ? { backgroundColor: s.tabsBackground, borderRadius: radius, padding: 3, gap: 2 }
                : { gap: s.tabsStyle === 'outline' ? 6 : Math.round(s.tabSize * 1.6) }}
        >
            {versions.map((v, i) => {
                const on = i === active
                const look: React.CSSProperties =
                    s.tabsStyle === 'pill' ? { backgroundColor: on ? s.activeBackground : 'transparent', color: on ? s.activeColor : s.tabColor, borderRadius: radius }
                    : s.tabsStyle === 'outline' ? { border: `1px solid ${on ? s.activeBackground : 'transparent'}`, color: on ? s.activeBackground : s.tabColor, borderRadius: radius }
                    : s.tabsStyle === 'underline' ? { color: on ? s.activeBackground : s.tabColor, boxShadow: on ? `inset 0 -2px 0 ${s.activeBackground}` : undefined, paddingInline: 0 }
                    : { color: on ? s.activeBackground : s.tabColor, paddingInline: 0 }
                return (
                    <button
                        key={v.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={(e) => { e.stopPropagation(); onActive(i) }}
                        className={cn("shrink-0 whitespace-nowrap transition-colors duration-200 hover:opacity-100", on ? "font-bold" : "font-medium opacity-90 hover:![color:var(--logo-tab-hover)]")}
                        style={{ ...text, ...pad, ...look }}
                    >
                        {v.label}
                    </button>
                )
            })}
        </div>
    )

    const button = s.showClearSpaceButton && (
        <button
            type="button"
            aria-pressed={clearOn}
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="shrink-0 whitespace-nowrap font-bold transition-colors duration-200"
            style={{
                ...text, ...pad, borderRadius: radius,
                border: `1px solid ${clearOn ? s.clearSpaceColor : s.tabsBackground === 'transparent' ? s.tabColor : '#2A2A2E'}`,
                backgroundColor: clearOn ? s.clearSpaceColor : 'transparent',
                color: clearOn ? '#FFFFFF' : s.tabColor,
            }}
        >
            {s.clearSpaceButtonLabel}
        </button>
    )

    if (!tabs && !button) return null
    const justify = s.controlsLayout === 'split' ? 'space-between' : s.controlsLayout === 'center' ? 'center' : s.controlsLayout === 'right' ? 'flex-end' : 'flex-start'
    return (
        <div
            className="flex flex-wrap items-center gap-3"
            style={{ justifyContent: justify, marginTop: s.controlsGap, ['--logo-tab-hover' as string]: s.activeBackground }}
        >
            {tabs || <span />}
            {button}
        </div>
    )
}

export const LogoShowcaseBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: LogoShowcaseBlockProps) => {
    const content: LogoShowcaseContent = readLogoShowcaseContent(block.content)
    const s = resolveLogoShowcaseSettings(content.settings)
    const versions = content.versions
    const [active, setActive] = React.useState(0)
    const [clearOn, setClearOn] = React.useState(s.clearSpaceOn)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = React.useState(false)
    const upload = useLogoUpload(block.id)
    const fileRef = React.useRef<HTMLInputElement>(null)
    const index = Math.min(active, Math.max(0, versions.length - 1))
    const version = versions[index]

    // Logo size: its height (stage %), unless its width would pass the max width
    const stageRef = React.useRef<HTMLDivElement>(null)
    const [stageWidth, setStageWidth] = React.useState(0)
    React.useEffect(() => {
        const el = stageRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setStageWidth(el.clientWidth))
        ro.observe(el)
        setStageWidth(el.clientWidth)
        return () => ro.disconnect()
    }, [])
    const [ratios, setRatios] = React.useState<Record<string, number>>({})
    const ratio = version ? ratios[version.url] || 1 : 1
    const targetHeight = s.stageHeight * (s.logoSize / 100) * ((version?.scale ?? 100) / 100)
    const maxWidth = stageWidth ? stageWidth * (s.logoMaxWidth / 100) : Infinity
    const logoHeight = Math.max(8, Math.min(targetHeight, maxWidth / ratio))
    const logoWidth = logoHeight * ratio
    const clearance = s.clearSpace * (s.clearSpaceRef / 100) * logoHeight

    const save = (next: LogoShowcaseContent) => onUpdate(block.id, { ...block.content, versions: next.versions, settings: next.settings })
    const replaceLogo = async (file: File) => {
        if (!version) return
        const url = await upload(file)
        if (url) save({ ...content, versions: versions.map(v => v.id === version.id ? { ...v, url } : v) })
    }

    const labelStyle: React.CSSProperties = {
        fontFamily: LOGO_FONTS[s.tabFont],
        fontSize: Math.max(9, s.tabSize - 1),
        letterSpacing: '0.12em',
        textTransform: s.uppercase ? 'uppercase' : undefined,
    }

    return (
        <div
            className={cn("relative w-full", !isReadOnly && "cursor-pointer")}
            {...hoverBind}
            onClick={(e) => {
                if (isReadOnly) return
                e.stopPropagation()
                onSelect?.(block.id)
            }}
        >
            <div
                className={cn("w-full", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-2")}
                style={{ backgroundColor: s.blockBackground || undefined, padding: s.blockPadding, borderRadius: s.blockRadius }}
            >
                <div
                    ref={stageRef}
                    className="group/stage relative w-full overflow-hidden flex items-center justify-center transition-colors duration-300"
                    style={{
                        height: s.stageHeight,
                        backgroundColor: version?.background || '#1C1C1E',
                        borderRadius: s.radius,
                        border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor}` : undefined,
                    }}
                >
                    {version?.url ? (
                        <div className="relative" style={{ width: logoWidth, height: logoHeight }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                key={version.url}
                                src={version.url}
                                alt={version.label}
                                draggable={false}
                                className="block w-full h-full object-contain select-none animate-in fade-in duration-300"
                                onLoad={(e) => {
                                    const img = e.currentTarget
                                    if (img.naturalWidth && img.naturalHeight) {
                                        const r = img.naturalWidth / img.naturalHeight
                                        setRatios(prev => prev[version.url] === r ? prev : { ...prev, [version.url]: r })
                                    }
                                }}
                            />
                            {clearOn && (
                                <div
                                    className="absolute pointer-events-none animate-in fade-in zoom-in-95 duration-300"
                                    style={{
                                        inset: -clearance,
                                        border: `1px ${s.clearSpaceLine} ${s.clearSpaceColor}`,
                                    }}
                                >
                                    {s.showClearSpaceLabel && (
                                        <span
                                            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-1 font-bold text-white"
                                            style={{ ...labelStyle, backgroundColor: s.clearSpaceColor }}
                                        >
                                            {clearSpaceLabel(s)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-[12px] opacity-60" style={{ ...labelStyle, color: s.tabColor }}>
                            {isReadOnly ? '' : 'Carregue o logótipo desta versão'}
                        </span>
                    )}

                    {!isReadOnly && (
                        <>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*,.svg"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceLogo(f); e.target.value = '' }}
                            />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                                className={cn(
                                    "absolute right-3 bottom-3 h-8 px-3 rounded-full flex items-center gap-1.5 text-[11px] font-medium bg-black/70 text-white backdrop-blur transition-opacity hover:bg-black",
                                    version?.url ? "opacity-0 group-hover/stage:opacity-100" : "opacity-100"
                                )}
                            >
                                <Upload className="w-3.5 h-3.5" /> {version?.url ? 'Substituir logótipo' : 'Carregar logótipo'}
                            </button>
                        </>
                    )}
                </div>

                <Controls s={s} versions={versions} active={index} onActive={setActive} clearOn={clearOn} onClear={() => setClearOn(on => !on)} />
            </div>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Logótipo"
                        onSettings={() => { onSelect?.(block.id); setShowSettings(true) }}
                        onAnimate={onAnimate}
                        onMove={onMove ? (dir) => onMove(block.id, dir) : undefined}
                        onCopy={onCopy ? () => onCopy(block.id) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                        onDelete={onDelete ? () => onDelete(block.id) : undefined}
                    />
                </FloatingPanel>
            )}

            {!isReadOnly && showSettings && (
                <FloatingPanel placement="right-start" offset={16}>
                    <LogoShowcasePanel
                        blockId={block.id}
                        content={content}
                        resolved={s}
                        activeIndex={index}
                        onActiveIndex={setActive}
                        onChange={save}
                        onPreviewClearSpace={() => setClearOn(true)}
                        onClose={() => setShowSettings(false)}
                        onMove={onMove ? (dir) => onMove(block.id, dir) : undefined}
                        onCopy={onCopy ? () => onCopy(block.id) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                        onDelete={onDelete ? () => { setShowSettings(false); onDelete(block.id) } : undefined}
                    />
                </FloatingPanel>
            )}
        </div>
    )
}
