"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowUpRight, Plus, Trash2, Link2, ListOrdered, LayoutGrid, RefreshCw, PenLine, EyeOff, RotateCcw, Settings2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Block, BlockLink } from "../types"
import { useBrandDesign } from "../BrandDesignContext"
import { LinkSettingsPopover } from "../LinkSettingsPopover"
import { TOP_BAR_CLEARANCE } from "../editorLayout"
import { SmoothColorInput } from "../SmoothColorInput"

export interface IndexItem {
    id: string
    title: string
    description?: string
    link?: BlockLink | null
}

export interface IndexSettings {
    /**
     * 'pages': the items are the brandbook pages, read live from the side menu (renames, new pages and
     * reordering show up by themselves). 'manual': the items are edited by hand.
     */
    source?: 'pages' | 'manual'
    /** Pages mode: only pages under these side-menu groups (empty = all) */
    groups?: string[]
    /** Pages mode: pages taken out of this index (page id, or page title, as templates use before ids exist) */
    excludedPages?: string[]
    /** Pages mode: list the page that holds the index too */
    includeCurrentPage?: boolean
    /** Pages mode: per-page description keyed by page id or title; without one the page's menu group is shown */
    pageDescriptions?: Record<string, string>
    style?: 'list' | 'cards'
    accentColor?: string
    textColor?: string
    mutedColor?: string
    hoverBackground?: string
    dividerColor?: string
    /** Per-element colors; each falls back to the general text / muted color */
    numberColor?: string
    descriptionColor?: string
    arrowColor?: string
    hoverTextColor?: string
    /** Corner rounding of every item (px) */
    itemRadius?: number
    /** Item border thickness (px) and which sides draw it */
    borderWidth?: number
    borderSides?: BorderSide[]
    titleSize?: number
    showNumbers?: boolean
    showArrows?: boolean
}

export type BorderSide = 'top' | 'right' | 'bottom' | 'left'
const ALL_SIDES: BorderSide[] = ['top', 'right', 'bottom', 'left']

export const DEFAULT_INDEX_SETTINGS = {
    style: 'list',
    accentColor: '#FF0054',
    textColor: '#111111',
    mutedColor: '#8A8A8A',
    hoverBackground: '#F4F4F5',
    dividerColor: '#E5E7EB',
    titleSize: 48,
    showNumbers: true,
    showArrows: true,
} satisfies IndexSettings

/** Dark theme used by the ready-made index section */
export const DARK_INDEX_SETTINGS: IndexSettings = {
    textColor: '#FFFFFF',
    mutedColor: 'rgba(255,255,255,0.45)',
    hoverBackground: '#1C1C1F',
    dividerColor: 'rgba(255,255,255,0.08)',
}

const newId = () => Math.random().toString(36).slice(2, 11)

interface IndexBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: Block['content']) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
}

const ColorDot = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#A0A0A0]" title={label}>
        <span className="relative w-5 h-5 rounded-full ring-1 ring-white/20 overflow-hidden" style={{ backgroundColor: value }}>
            <SmoothColorInput
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />
        </span>
        {label}
    </label>
)

/** One row of the settings panel: label on the left, control on the right */
const PanelRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 min-h-[28px]">
        <span className="text-[#97A1B3] text-[12px]">{label}</span>
        {children}
    </div>
)

const PanelSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col gap-2.5 border-b border-[#333] pb-4">
        <span className="text-[#97A1B3] text-[0.75rem] font-medium">{title}</span>
        {children}
    </div>
)

const Segmented = <T extends string>({ value, options, onChange }: { value: T, options: { id: T, label: React.ReactNode, title?: string }[], onChange: (v: T) => void }) => (
    <div className="flex gap-1 bg-[#1A1A20] rounded-[4px] p-1 w-full">
        {options.map(o => (
            <button
                key={o.id}
                title={o.title}
                onClick={() => onChange(o.id)}
                className={cn(
                    "flex-1 h-[28px] rounded-[2px] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors",
                    value === o.id ? "bg-[#FF0054] text-white" : "text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]"
                )}
            >
                {o.label}
            </button>
        ))}
    </div>
)

const Switch = ({ on, onChange }: { on: boolean, onChange: (v: boolean) => void }) => (
    <button
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn("w-[36px] h-[20px] rounded-full relative transition-colors shrink-0", on ? "bg-[#FF0054]" : "bg-[#3F3F46]")}
    >
        <span className={cn("w-[16px] h-[16px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all", on ? "right-[2px]" : "left-[2px]")} />
    </button>
)

const NumberField = ({ value, min, max, onChange }: { value: number, min: number, max: number, onChange: (v: number) => void }) => (
    <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[26px] w-[64px]">
        <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
            className="bg-transparent border-none text-white text-xs w-full text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[#97A1B3] text-[10px] select-none ml-0.5">px</span>
    </div>
)

export const IndexBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId }: IndexBlockProps) => {
    const { modules = [], onSelectModule, selectedModuleId } = useBrandDesign()
    const manualItems = (block.content?.items || []) as IndexItem[]
    const rawSettings = (block.content?.settings || {}) as IndexSettings
    const settings = { ...DEFAULT_INDEX_SETTINGS, ...rawSettings }
    // Indexes created before the pages mode keep their hand-made items
    const source = rawSettings.source || (manualItems.length > 0 ? 'manual' : 'pages')
    const isPages = source === 'pages'
    const groups = rawSettings.groups || []
    const excluded = rawSettings.excludedPages || []
    const pageDescriptions = rawSettings.pageDescriptions || {}

    const [hovered, setHovered] = useState<string | null>(null)
    const [linkOpenFor, setLinkOpenFor] = useState<string | null>(null)
    const isActive = !isReadOnly && activeBlockId === block.id
    // The settings panel opens from the hover toolbar and closes on outside click, Esc or deselection
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    // Floating panel (like Edit section): placed next to the button that opened it, movable by its header
    const [panelPos, setPanelPos] = useState({ top: 80, left: 80 })
    const dragRef = useRef<{ x: number, y: number, top: number, left: number } | null>(null)
    const openSettings = (anchor: HTMLElement) => {
        const rect = anchor.getBoundingClientRect()
        const width = 300
        setPanelPos({
            top: Math.max(TOP_BAR_CLEARANCE, Math.min(rect.bottom + 8, window.innerHeight - 200)),
            left: Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16)),
        })
        setIsSettingsOpen(true)
    }

    useEffect(() => {
        if (!isActive) setIsSettingsOpen(false)
    }, [isActive])

    useEffect(() => {
        if (!isSettingsOpen) return
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Element | null
            // Popovers opened from the panel (e.g. links) render in portals
            if (panelRef.current?.contains(target as Node) || target?.closest?.('[data-radix-popper-content-wrapper], [data-floating-panel]')) return
            setIsSettingsOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsSettingsOpen(false) }
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [isSettingsOpen])

    // Groups present in the side menu, in menu order
    const availableGroups = useMemo(
        () => Array.from(new Set(modules.filter(m => !m.isHidden).map(m => m.group).filter(Boolean))) as string[],
        [modules]
    )

    const pageItems = useMemo<IndexItem[]>(() => modules
        .filter(m => !m.isHidden)
        .filter(m => rawSettings.includeCurrentPage || m.id !== selectedModuleId)
        .filter(m => groups.length === 0 || (m.group && groups.includes(m.group)))
        .filter(m => !excluded.includes(m.id) && !excluded.includes(m.title))
        .map(m => ({
            id: m.id,
            title: m.title,
            description: pageDescriptions[m.id] ?? pageDescriptions[m.title] ?? m.group ?? '',
            link: { type: 'internal' as const, moduleId: m.id, moduleTitle: m.title },
        })),
    [modules, selectedModuleId, rawSettings.includeCurrentPage, groups, excluded, pageDescriptions])

    const items = isPages ? pageItems : manualItems

    const update = (patch: Partial<{ items: IndexItem[], settings: IndexSettings }>) =>
        onUpdate(block.id, { ...block.content, ...patch })
    const updateSettings = (patch: Partial<IndexSettings>) =>
        update({ settings: { ...rawSettings, source, ...patch } })
    const updateItem = (id: string, patch: Partial<IndexItem>) => {
        if (isPages) {
            // Page titles come from the menu; only the description is the index's own
            if (patch.description !== undefined) updateSettings({ pageDescriptions: { ...pageDescriptions, [id]: patch.description } })
            return
        }
        update({ items: manualItems.map(i => i.id === id ? { ...i, ...patch } : i) })
    }
    const removeItem = (id: string) => {
        if (isPages) updateSettings({ excludedPages: [...excluded, id] })
        else update({ items: manualItems.filter(i => i.id !== id) })
    }

    const switchSource = (next: 'pages' | 'manual') => {
        if (next === source) return
        // Going manual starts from what the index shows now, so nothing is lost
        if (next === 'manual') {
            update({
                items: pageItems.map(i => ({ ...i, id: newId() })),
                settings: { ...rawSettings, source: 'manual' },
            })
        } else {
            updateSettings({ source: 'pages' })
        }
    }

    const toggleGroup = (group: string) =>
        updateSettings({ groups: groups.includes(group) ? groups.filter(g => g !== group) : [...groups, group] })

    const openLink = (link?: BlockLink | null) => {
        if (!link) return
        if (link.type === 'url' && link.url) {
            window.open(link.url, link.target || '_blank', 'noopener,noreferrer')
        } else if (link.type === 'internal' && link.moduleId) {
            onSelectModule?.(link.moduleId)
        } else if (link.type === 'section' && link.sectionId) {
            const el = document.getElementById(`section-${link.sectionId}`) || document.getElementById(link.sectionId)
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const isCards = settings.style === 'cards'
    // Per-element colors (older indexes have none: they follow the text / muted colors as before)
    const numberColor = rawSettings.numberColor || settings.mutedColor
    const descriptionColor = rawSettings.descriptionColor || settings.mutedColor
    const arrowColor = rawSettings.arrowColor || settings.mutedColor
    const hoverTextColor = rawSettings.hoverTextColor || settings.textColor
    // Item box: list items default to a bottom line, cards to a full border
    const itemRadius = rawSettings.itemRadius ?? (isCards ? 16 : 12)
    const borderWidth = rawSettings.borderWidth ?? 1
    const borderSides: BorderSide[] = rawSettings.borderSides ?? (isCards ? [...ALL_SIDES] : ['bottom'])
    const itemBorderStyle: React.CSSProperties = {
        borderStyle: 'solid',
        borderTopWidth: borderSides.includes('top') ? borderWidth : 0,
        borderRightWidth: borderSides.includes('right') ? borderWidth : 0,
        borderBottomWidth: borderSides.includes('bottom') ? borderWidth : 0,
        borderLeftWidth: borderSides.includes('left') ? borderWidth : 0,
        borderRadius: itemRadius,
    }

    const renderText = (item: IndexItem, field: 'title' | 'description', className: string, style: React.CSSProperties, placeholder: string) => {
        const editable = !isReadOnly && !(isPages && field === 'title')
        return editable ? (
            <input
                value={item[field] || ''}
                placeholder={placeholder}
                onChange={(e) => updateItem(item.id, { [field]: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className={cn(className, "bg-transparent outline-none border-none min-w-0 placeholder:opacity-30")}
                style={style}
            />
        ) : (
            <span
                className={className}
                style={style}
                title={!isReadOnly && isPages && field === 'title' ? "Nome da página: altere-o no menu lateral" : undefined}
            >
                {item[field]}
            </span>
        )
    }

    const chip = (activeChip: boolean) => cn(
        "text-[11px] px-2 h-6 rounded-full border transition-colors whitespace-nowrap",
        activeChip ? "bg-white text-[#15161B] border-white" : "text-[#A0A0A0] border-white/15 hover:text-white"
    )

    return (
        <div className="w-full relative group/indexblock" onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}>
            {/* Hover toolbar: opens the settings */}
            {!isReadOnly && !isSettingsOpen && (
                <div className="absolute -top-11 right-0 z-[60] opacity-0 group-hover/indexblock:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect?.(block.id); openSettings(e.currentTarget) }}
                        className="h-8 px-3 rounded-lg bg-[#15161B] text-white text-[12px] font-medium flex items-center gap-1.5 shadow-lg border border-white/10 hover:bg-[#23252c]"
                    >
                        <Settings2 className="w-3.5 h-3.5" /> Configurar índice
                    </button>
                </div>
            )}

            {/* Settings panel (floating, same pattern as Edit section) */}
            {!isReadOnly && isSettingsOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={panelRef}
                    className="fixed z-[9999] w-[300px] max-h-[min(720px,calc(100vh-32px))] flex flex-col bg-[#15161B] text-white rounded-[8px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: panelPos.top, left: panelPos.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: drag handle + standard black close circle */}
                    <div
                        className="h-[52px] bg-[#FF0054] px-5 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
                        onPointerDown={(e) => {
                            dragRef.current = { x: e.clientX, y: e.clientY, top: panelPos.top, left: panelPos.left }
                            e.currentTarget.setPointerCapture(e.pointerId)
                        }}
                        onPointerMove={(e) => {
                            const d = dragRef.current
                            if (!d) return
                            setPanelPos({ top: d.top + e.clientY - d.y, left: d.left + e.clientX - d.x })
                        }}
                        onPointerUp={() => { dragRef.current = null }}
                        onPointerCancel={() => { dragRef.current = null }}
                    >
                        <span className="font-semibold text-[16px]">Edit index</span>
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setIsSettingsOpen(false)}
                            className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0"
                            title="Fechar (Esc)"
                        >
                            <span className="sr-only">Fechar</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4">
                        <PanelSection title="Conteúdo">
                            <Segmented
                                value={source}
                                onChange={switchSource}
                                options={[
                                    { id: 'pages', label: <><RefreshCw className="w-3 h-3" /> Páginas</>, title: 'Mostra as páginas do menu lateral e acompanha as alterações' },
                                    { id: 'manual', label: <><PenLine className="w-3 h-3" /> Manual</>, title: 'Itens escritos à mão' },
                                ]}
                            />
                            {isPages && (
                                <>
                                    <span className="text-[#666] text-[10px] uppercase tracking-wider mt-1">Grupos do menu</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button onClick={() => updateSettings({ groups: [] })} className={chip(groups.length === 0)}>Todos</button>
                                        {availableGroups.map(group => (
                                            <button key={group} onClick={() => toggleGroup(group)} className={chip(groups.includes(group))}>{group}</button>
                                        ))}
                                    </div>
                                    <PanelRow label="Incluir esta página">
                                        <Switch on={!!rawSettings.includeCurrentPage} onChange={(v) => updateSettings({ includeCurrentPage: v })} />
                                    </PanelRow>
                                    {excluded.length > 0 && (
                                        <button
                                            onClick={() => updateSettings({ excludedPages: [] })}
                                            className="self-start text-[11px] text-[#A0A0A0] hover:text-white flex items-center gap-1"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Repor páginas ocultas ({excluded.length})
                                        </button>
                                    )}
                                </>
                            )}
                        </PanelSection>

                        <PanelSection title="Estilo">
                            <Segmented
                                value={settings.style}
                                onChange={(v) => updateSettings({ style: v })}
                                options={[
                                    { id: 'list', label: <><ListOrdered className="w-3.5 h-3.5" /> Lista</> },
                                    { id: 'cards', label: <><LayoutGrid className="w-3.5 h-3.5" /> Cartões</> },
                                ]}
                            />
                            <PanelRow label="Tamanho do título">
                                <NumberField value={settings.titleSize} min={16} max={160} onChange={(v) => updateSettings({ titleSize: v })} />
                            </PanelRow>
                            <PanelRow label="Números">
                                <Switch on={settings.showNumbers} onChange={(v) => updateSettings({ showNumbers: v })} />
                            </PanelRow>
                            <PanelRow label="Setas">
                                <Switch on={settings.showArrows} onChange={(v) => updateSettings({ showArrows: v })} />
                            </PanelRow>
                        </PanelSection>

                        <PanelSection title="Itens">
                            <PanelRow label="Arredondamento">
                                <NumberField value={itemRadius} min={0} max={64} onChange={(v) => updateSettings({ itemRadius: v })} />
                            </PanelRow>
                            <input
                                type="range"
                                min={0}
                                max={64}
                                value={itemRadius}
                                onChange={(e) => updateSettings({ itemRadius: Number(e.target.value) })}
                                className="w-full accent-[#FF0054] cursor-pointer -mt-1"
                                aria-label="Arredondamento dos itens"
                            />
                            <PanelRow label="Espessura da borda">
                                <NumberField value={borderWidth} min={0} max={8} onChange={(v) => updateSettings({ borderWidth: v })} />
                            </PanelRow>
                            <span className="text-[#666] text-[10px] uppercase tracking-wider">Lados da borda</span>
                            <div className="grid grid-cols-4 gap-1">
                                {([['top', 'Superior'], ['bottom', 'Inferior'], ['left', 'Esquerda'], ['right', 'Direita']] as const).map(([side, label]) => {
                                    const on = borderSides.includes(side)
                                    return (
                                        <button
                                            key={side}
                                            onClick={() => updateSettings({ borderSides: on ? borderSides.filter(x => x !== side) : [...borderSides, side] })}
                                            className={cn(
                                                "h-[44px] rounded-[2px] border flex flex-col items-center justify-center gap-1 text-[9px] transition-colors",
                                                on ? "border-[#FF0054] text-white bg-[#FF0054]/10" : "border-[#333] text-[#97A1B3] hover:border-[#666]"
                                            )}
                                            title={on ? `Retirar borda ${label.toLowerCase()}` : `Mostrar borda ${label.toLowerCase()}`}
                                        >
                                            {/* Square with the chosen side drawn thick */}
                                            <span
                                                className="w-4 h-3 rounded-[1px] border border-current"
                                                style={{ [`border${side[0].toUpperCase()}${side.slice(1)}Width`]: 2.5 } as React.CSSProperties}
                                            />
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => updateSettings({ borderSides: [...ALL_SIDES] })} className={chip(borderSides.length === 4)}>Todos os lados</button>
                                <button onClick={() => updateSettings({ borderSides: [] })} className={chip(borderSides.length === 0)}>Sem borda</button>
                            </div>
                        </PanelSection>

                        <PanelSection title="Cores">
                            <PanelRow label="Títulos"><ColorDot label="" value={settings.textColor} onChange={(v) => updateSettings({ textColor: v })} /></PanelRow>
                            <PanelRow label="Descrições"><ColorDot label="" value={descriptionColor} onChange={(v) => updateSettings({ descriptionColor: v })} /></PanelRow>
                            <PanelRow label="Números"><ColorDot label="" value={numberColor} onChange={(v) => updateSettings({ numberColor: v })} /></PanelRow>
                            <PanelRow label="Setas"><ColorDot label="" value={arrowColor} onChange={(v) => updateSettings({ arrowColor: v })} /></PanelRow>
                            <PanelRow label="Borda / linhas"><ColorDot label="" value={settings.dividerColor} onChange={(v) => updateSettings({ dividerColor: v })} /></PanelRow>
                            <PanelRow label="Destaque"><ColorDot label="" value={settings.accentColor} onChange={(v) => updateSettings({ accentColor: v })} /></PanelRow>
                            <PanelRow label="Fundo no hover"><ColorDot label="" value={settings.hoverBackground} onChange={(v) => updateSettings({ hoverBackground: v })} /></PanelRow>
                            <PanelRow label="Título no hover"><ColorDot label="" value={hoverTextColor} onChange={(v) => updateSettings({ hoverTextColor: v })} /></PanelRow>
                        </PanelSection>
                    </div>
                </div>,
                document.body
            )}

            {items.length === 0 && !isReadOnly && isPages && (
                <div className="w-full py-8 text-center text-[13px] rounded-xl border border-dashed" style={{ color: settings.mutedColor, borderColor: settings.dividerColor }}>
                    Ainda não há páginas para listar com estes filtros.
                </div>
            )}

            <div className={cn(isCards ? "grid gap-3" : "flex flex-col")} style={isCards ? { gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))' } : undefined}>
                {items.map((item, index) => {
                    const isHovered = hovered === item.id
                    const number = `(${String(index + 1).padStart(2, '0')})`
                    const clickable = isReadOnly && !!item.link

                    return (
                        <div
                            key={item.id}
                            onMouseEnter={() => setHovered(item.id)}
                            onMouseLeave={() => setHovered(h => h === item.id ? null : h)}
                            onClick={() => { if (clickable) openLink(item.link) }}
                            role={clickable ? 'link' : undefined}
                            tabIndex={clickable ? 0 : undefined}
                            onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLink(item.link) } }}
                            className={cn(
                                "relative group/idx transition-[background-color,padding,translate] duration-300 ease-out min-w-0",
                                isCards
                                    ? "flex flex-col gap-6 p-6 min-h-[220px]"
                                    : "flex items-center gap-4 sm:gap-8 py-5 sm:py-6",
                                !isCards && (isHovered ? "px-4 sm:px-8" : "px-0 sm:px-4"),
                                isCards && isHovered && "-translate-y-1",
                                clickable && "cursor-pointer"
                            )}
                            style={{
                                ...itemBorderStyle,
                                backgroundColor: isHovered ? settings.hoverBackground : 'transparent',
                                // A list line hides under the hover background; full borders stay
                                borderColor: (!isCards && isHovered && borderSides.length < 4) ? 'transparent' : settings.dividerColor,
                                color: settings.textColor,
                            }}
                        >
                            {settings.showNumbers && (
                                <span
                                    className={cn("font-mono text-[13px] shrink-0 transition-colors duration-300", !isCards && "w-12 sm:w-16")}
                                    style={{ color: isHovered ? settings.accentColor : numberColor }}
                                >
                                    {number}
                                </span>
                            )}

                            <div className={cn("min-w-0 flex", isCards ? "flex-col gap-2 mt-auto" : "flex-1 items-center gap-6")}>
                                {renderText(
                                    item, 'title',
                                    cn("font-medium tracking-[-0.04em] leading-none truncate", isCards ? "w-full" : "flex-1 min-w-0"),
                                    { fontSize: `clamp(24px, 5vw, ${settings.titleSize}px)`, color: isHovered ? hoverTextColor : settings.textColor, transition: 'color 0.3s' },
                                    'Título'
                                )}
                                {(item.description || !isReadOnly) && renderText(
                                    item, 'description',
                                    cn("text-[14px] leading-snug", !isCards && "hidden md:block ml-auto text-right max-w-[40%] w-full"),
                                    { color: descriptionColor },
                                    'Descrição'
                                )}
                            </div>

                            {settings.showArrows && (
                                <span
                                    className={cn(
                                        "shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300",
                                        isCards && "absolute top-6 right-6"
                                    )}
                                    style={{
                                        backgroundColor: isHovered ? settings.accentColor : 'transparent',
                                        borderColor: isHovered ? settings.accentColor : arrowColor,
                                        color: isHovered ? '#FFFFFF' : (rawSettings.arrowColor || settings.textColor),
                                    }}
                                >
                                    <ArrowUpRight className={cn("w-4 h-4 transition-transform duration-300", isHovered && "rotate-45")} />
                                </span>
                            )}

                            {/* Editor: link (manual only; pages link to themselves) + remove / hide */}
                            {!isReadOnly && (
                                <div className="absolute -top-3 right-2 flex gap-1 opacity-0 group-hover/idx:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                                    {!isPages && (
                                        <LinkSettingsPopover
                                            isOpen={linkOpenFor === item.id}
                                            onOpenChange={(open) => setLinkOpenFor(open ? item.id : null)}
                                            link={item.link}
                                            onSaveLink={(link) => updateItem(item.id, { link })}
                                            trigger={
                                                <button
                                                    className={cn("h-6 px-2 rounded-full text-[11px] font-medium flex items-center gap-1 shadow", item.link ? "bg-[#FF0054] text-white" : "bg-[#15161B] text-white")}
                                                    title={item.link ? "Editar link" : "Adicionar link"}
                                                >
                                                    <Link2 className="w-3 h-3" /> {item.link ? (item.link.moduleTitle || item.link.sectionTitle || 'Link') : 'Link'}
                                                </button>
                                            }
                                        />
                                    )}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="w-6 h-6 rounded-full bg-[#15161B] hover:bg-[#FF0054] text-white flex items-center justify-center shadow"
                                        title={isPages ? "Ocultar esta página do índice" : "Remover item"}
                                    >
                                        {isPages ? <EyeOff className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {!isReadOnly && !isPages && (
                <button
                    onClick={(e) => { e.stopPropagation(); update({ items: [...manualItems, { id: newId(), title: 'Novo capítulo', description: '' }] }) }}
                    className="mt-3 w-full h-10 border border-dashed rounded-xl text-[13px] flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
                    style={{ borderColor: settings.dividerColor, color: settings.textColor }}
                >
                    <Plus className="w-4 h-4" /> Adicionar item
                </button>
            )}
        </div>
    )
}

export const DEFAULT_INDEX_ITEMS: Omit<IndexItem, 'id'>[] = [
    { title: 'Introdução', description: 'Posicionamento, voz, propriedade' },
    { title: 'Logotipo', description: 'Símbolo, área de proteção, limites' },
    { title: 'Cores', description: 'Escala, neutros, contraste' },
    { title: 'Tipografia', description: 'Famílias, funções, escala' },
    { title: 'Imagem', description: 'Direção de arte, o que evitar' },
    { title: 'Recursos', description: 'Downloads e versões' },
]
