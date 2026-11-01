"use client"

import React, { useEffect, useMemo, useState } from "react"
import { ChevronDown, Menu, X, AlignRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBrandDesign, type NavPage } from "../BrandDesignContext"
import { getNavPreset, getNavTokens, getPageIcon, NavPreset, NavTokens, NavigationSettings } from "./navigationPresets"
import { AssetLibraryNavButton } from "./AssetLibraryAccess"
import { useScrollTick } from "../scrollFx"

/** How far the page has been scrolled, 0 (top) → 1 (end): the page canvas, else the window */
const pageScrollProgress = () => {
    const el = document.querySelector<HTMLElement>('[data-page-scroller]')
    if (el) {
        const room = el.scrollHeight - el.clientHeight
        return room > 1 ? el.scrollTop / room : 0
    }
    const doc = document.scrollingElement || document.documentElement
    const room = doc.scrollHeight - window.innerHeight
    return room > 1 ? window.scrollY / room : 0
}

/** Ring that fills with the accent as the page is read: empty at the top, full at the end */
const ScrollProgressRing = ({ color, track, size = 16 }: { color: string, track: string, size?: number }) => {
    const arcRef = React.useRef<SVGCircleElement>(null)
    const r = 6.5
    const length = 2 * Math.PI * r
    useScrollTick(() => {
        const p = Math.min(1, Math.max(0, pageScrollProgress()))
        const arc = arcRef.current
        if (!arc) return
        arc.style.strokeDashoffset = String(length * (1 - p))
        // A round cap still draws a dot at 0: hide the arc until there is progress
        arc.style.opacity = p > 0.005 ? "1" : "0"
    })
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" className="shrink-0 -rotate-90" aria-hidden>
            <circle cx={8} cy={8} r={r} fill="none" stroke={track} strokeWidth={2} />
            <circle
                ref={arcRef} cx={8} cy={8} r={r} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"
                strokeDasharray={length} strokeDashoffset={length} opacity={0}
                style={{ transition: 'stroke-dashoffset .15s linear' }}
            />
        </svg>
    )
}

/**
 * Navigation of the shared brandbook (published link and editor Preview), in the style chosen in
 * Settings → Navegação. Pages and separators come from the brandbook itself (side-menu order and groups).
 *
 * The editor mounts it in several slots; each style draws itself in the slot it belongs to:
 * "column-start" (top bars that take room), "row-start" / "row-end" (side panels that take room) and
 * "overlay" (capsules, docks, menus and contents cards floating over the page).
 */

type Slot = 'row-start' | 'row-end' | 'column-start' | 'overlay'

interface NavData {
    settings: NavigationSettings
    preset: NavPreset
    t: NavTokens
    pages: NavPage[]
    groups: { label: string, pages: NavPage[] }[]
    useGroups: boolean
    activeId?: string | null
    select: (id: string) => void
    brandName: string
    logoUrl?: string
}

const slotOf = (preset: NavPreset): Slot | null => {
    switch (preset.layout) {
        case 'sidebar': return null
        case 'topbar': return 'column-start'
        case 'side':
        case 'side-floating': return preset.side === 'right' ? 'row-end' : 'row-start'
        case 'rail': return preset.variant === 'inset' ? 'overlay' : (preset.side === 'right' ? 'row-end' : 'row-start')
        default: return 'overlay'
    }
}

const useNavData = (): NavData => {
    const { footerSettings, modules = [], selectedModuleId, onSelectModule, brandInfo } = useBrandDesign()
    const settings = footerSettings?.navigation || {}
    const preset = getNavPreset(settings.style)
    const t = getNavTokens(preset.theme, settings.accentColor || '#FF0054')
    const pages = useMemo(() => modules.filter(m => !m.isHidden), [modules])
    const groups = useMemo(() => {
        const list: { label: string, pages: NavPage[] }[] = []
        pages.forEach(p => {
            const label = p.group || 'Páginas'
            const g = list.find(x => x.label === label)
            if (g) g.pages.push(p)
            else list.push({ label, pages: [p] })
        })
        return list
    }, [pages])
    return {
        settings, preset, t, pages, groups,
        useGroups: settings.grouping === 'separators' && groups.length > 0,
        activeId: selectedModuleId,
        select: (id) => onSelectModule?.(id),
        brandName: brandInfo?.name || 'Brand',
        logoUrl: brandInfo?.logo_url || undefined,
    }
}

/** Hides the classic side menu while another navigation style is shown (Preview / shared link) */
export function NavigationGate({ previewing, children }: { previewing: boolean, children: React.ReactNode }) {
    const { preset } = useNavData()
    if (previewing && preset.layout !== 'sidebar') return null
    return <>{children}</>
}

// ---------- Small parts ----------

const Logo = ({ d, size = 28 }: { d: NavData, size?: number }) => (
    <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        {d.logoUrl
            ? <img src={d.logoUrl} alt={d.brandName} className="object-contain shrink-0" style={{ height: size, maxWidth: size * 4 }} />
            : null}
        {!d.logoUrl && <span className="font-semibold tracking-tight truncate" style={{ fontSize: size * 0.62, color: d.t.text }}>{d.brandName}</span>}
    </div>
)

const PageIcon = ({ page, d, size = 16 }: { page: NavPage, d: NavData, size?: number }) => {
    const Icon = getPageIcon(page, d.settings)
    return <Icon style={{ width: size, height: size }} className="shrink-0" aria-hidden />
}

/** Colours of the Asset library button in a navigation */
const lib = (t: NavTokens) => ({ text: t.text, muted: t.muted, hover: t.hover, accent: t.accent, border: t.border })

const shell = (t: NavTokens): React.CSSProperties => ({
    backgroundColor: t.bg,
    color: t.text,
    borderColor: t.border,
    ...(t.blur ? { backdropFilter: 'blur(16px) saturate(140%)', WebkitBackdropFilter: 'blur(16px) saturate(140%)' } : {}),
})

/** One page link for horizontal bars; variant decides how the active page is marked */
const PageLink = ({ page, d, variant, showIcon, iconOnly }: {
    page: NavPage, d: NavData, variant?: NavPreset['variant'], showIcon?: boolean, iconOnly?: boolean
}) => {
    const active = page.id === d.activeId
    const filled = active && (variant === 'segmented' || variant === 'icons' || variant === 'icons-label')
    const accentPill = active && variant === 'active-pill'
    return (
        <button
            onClick={() => d.select(page.id)}
            title={page.title}
            className={cn(
                "h-9 rounded-full flex items-center gap-2 text-[14px] font-medium whitespace-nowrap transition-all shrink-0",
                iconOnly && !(variant === 'icons-label' && active) ? "w-9 justify-center" : "px-3.5"
            )}
            style={{
                backgroundColor: accentPill ? d.t.accent : filled ? d.t.activeBg : 'transparent',
                color: accentPill ? '#FFFFFF' : filled ? d.t.activeText : active ? d.t.text : d.t.muted,
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = d.t.hover }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
        >
            {(showIcon || iconOnly) && <PageIcon page={page} d={d} />}
            {(!iconOnly || (variant === 'icons-label' && active)) && <span>{page.title}</span>}
        </button>
    )
}

/** A separator in a horizontal bar: its pages in a popover on hover (or tap) */
const GroupLink = ({ group, d, variant, showIcon, dropUp }: {
    group: { label: string, pages: NavPage[] }, d: NavData, variant?: NavPreset['variant'], showIcon?: boolean, dropUp?: boolean
}) => {
    const [open, setOpen] = useState(false)
    const containsActive = group.pages.some(p => p.id === d.activeId)
    const highlighted = containsActive && (variant === 'segmented' || variant === 'active-pill')
    return (
        <div className="relative shrink-0" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button
                onClick={() => setOpen(o => !o)}
                className="h-9 px-3.5 rounded-full flex items-center gap-1.5 text-[14px] font-medium whitespace-nowrap transition-colors"
                style={{
                    backgroundColor: highlighted ? (variant === 'active-pill' ? d.t.accent : d.t.activeBg) : 'transparent',
                    color: highlighted ? (variant === 'active-pill' ? '#FFFFFF' : d.t.activeText) : containsActive ? d.t.text : d.t.muted,
                }}
            >
                {group.label}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className={cn("absolute left-1/2 -translate-x-1/2 z-50", dropUp ? "bottom-full pb-2" : "top-full pt-2")}>
                    <div className="min-w-[220px] rounded-2xl border p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={shell(d.t)}>
                        {group.pages.map(p => {
                            const active = p.id === d.activeId
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => { d.select(p.id); setOpen(false) }}
                                    className="w-full flex items-center gap-2.5 px-3 h-9 rounded-xl text-[14px] text-left transition-colors"
                                    style={{ backgroundColor: active ? d.t.accent : 'transparent', color: active ? '#FFFFFF' : d.t.text }}
                                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = d.t.hover }}
                                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                                >
                                    {showIcon && <PageIcon page={p} d={d} />}
                                    <span className="truncate">{p.title}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

/** Links of a horizontal bar: separators with popovers, or the pages */
const HorizontalLinks = ({ d, variant, iconOnly, dropUp, className }: {
    d: NavData, variant?: NavPreset['variant'], iconOnly?: boolean, dropUp?: boolean, className?: string
}) => {
    const showIcon = d.settings.showIcons ?? false
    return (
        <nav className={cn("flex items-center gap-0.5 min-w-0", !(d.useGroups && !iconOnly) && "overflow-x-auto scrollbar-hide", className)}>
            {d.useGroups && !iconOnly
                ? d.groups.map(g => <GroupLink key={g.label} group={g} d={d} variant={variant} showIcon={showIcon} dropUp={dropUp} />)
                : d.pages.map(p => <PageLink key={p.id} page={p} d={d} variant={variant} showIcon={showIcon} iconOnly={iconOnly} />)}
        </nav>
    )
}

/** Vertical list: separators as headings with their pages, or the pages */
const VerticalLinks = ({ d, large }: { d: NavData, large?: boolean }) => {
    const showIcon = d.settings.showIcons ?? true
    const item = (p: NavPage) => {
        const active = p.id === d.activeId
        return (
            <button
                key={p.id}
                onClick={() => d.select(p.id)}
                className={cn("w-full flex items-center gap-3 rounded-xl text-left transition-colors", large ? "px-3 h-12 text-[18px]" : "px-3 h-10 text-[14px]")}
                style={{ backgroundColor: active ? d.t.activeBg : 'transparent', color: active ? d.t.activeText : d.t.text }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = d.t.hover }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
                {showIcon && <PageIcon page={p} d={d} size={large ? 18 : 16} />}
                <span className="truncate">{p.title}</span>
            </button>
        )
    }
    return (
        <nav className="flex flex-col gap-0.5">
            {d.useGroups
                ? d.groups.map(g => (
                    <div key={g.label} className="flex flex-col gap-0.5 mb-3">
                        <span className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: d.t.muted }}>{g.label}</span>
                        {g.pages.map(item)}
                    </div>
                ))
                : d.pages.map(item)}
        </nav>
    )
}

const useEscape = (open: boolean, close: () => void) => {
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, close])
}

// ---------- Layouts ----------

const TopBar = ({ d }: { d: NavData }) => {
    const v = d.preset.variant
    const inset = v === 'inset'
    return (
        <div className={cn("shrink-0 z-[900] relative", inset ? "px-4 pt-4 pb-2" : "")}>
            <div
                className={cn(
                    "relative h-16 px-6 flex items-center gap-6",
                    inset && "rounded-2xl border shadow-lg",
                    v === 'ruled' && "border-b",
                    v === 'outlined' && "border m-4 rounded-none",
                    !inset && v !== 'ruled' && v !== 'outlined' && "border-b"
                )}
                style={{ ...shell(d.t), ...(v === 'outlined' ? { borderColor: d.t.accent } : {}) }}
            >
                {/* Technical frame: corner squares */}
                {v === 'outlined' && ['-left-1 -top-1', '-right-1 -top-1', '-left-1 -bottom-1', '-right-1 -bottom-1'].map(pos => (
                    <span key={pos} className={cn("absolute w-2 h-2", pos)} style={{ backgroundColor: d.t.accent }} />
                ))}
                <Logo d={d} />
                <HorizontalLinks d={d} variant={v} className={v === 'centered' ? "mx-auto" : "ml-auto"} />
                <AssetLibraryNavButton look="pill" colors={lib(d.t)} />
            </div>
        </div>
    )
}

const Capsule = ({ d, bottom }: { d: NavData, bottom?: boolean }) => {
    const v = d.preset.variant
    const iconOnly = v === 'icons' || v === 'icons-label'
    return (
        <div className={cn("absolute left-0 right-0 z-[900] flex justify-center px-4 pointer-events-none", bottom ? "bottom-6" : "top-4")}>
            <div
                className={cn(
                    "pointer-events-auto rounded-full border shadow-2xl flex items-center gap-1 max-w-full",
                    v === 'wide' ? "w-full max-w-[1100px] h-16 pl-6 pr-2" : "h-[52px] px-1.5"
                )}
                style={shell(d.t)}
            >
                {v === 'wide' && <Logo d={d} size={24} />}
                <HorizontalLinks d={d} variant={v === 'wide' ? 'active-pill' : v} iconOnly={iconOnly} dropUp={bottom} className={v === 'wide' ? "mx-auto" : ""} />
                <AssetLibraryNavButton look={iconOnly ? "icon" : v === 'wide' ? "pill" : "icon"} colors={lib(d.t)} divider={v !== 'wide'} />
            </div>
        </div>
    )
}

const Dock = ({ d }: { d: NavData }) => (
    <div className="absolute left-0 right-0 bottom-6 z-[900] flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto rounded-[22px] border shadow-2xl px-2 py-2 flex items-center gap-1 max-w-full" style={shell(d.t)}>
            <HorizontalLinks d={d} variant={d.preset.variant === 'icons-label' ? 'icons-label' : 'icons'} iconOnly dropUp />
            <AssetLibraryNavButton look="icon" colors={lib(d.t)} divider />
        </div>
    </div>
)

const SidePanel = ({ d, floating }: { d: NavData, floating?: boolean }) => {
    const right = d.preset.side === 'right'
    const panel = (
        <div
            className={cn("h-full w-[260px] flex flex-col overflow-hidden", floating ? "rounded-3xl border shadow-2xl" : right ? "border-l" : "border-r")}
            style={shell(d.t)}
        >
            <div className="px-5 pt-6 pb-5"><Logo d={d} /></div>
            <div className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide"><VerticalLinks d={d} /></div>
            <div className="px-3 pb-4 empty:hidden"><AssetLibraryNavButton look="row" colors={lib(d.t)} /></div>
        </div>
    )
    return <div className={cn("h-full shrink-0 z-[900] relative", floating && "p-4")}>{panel}</div>
}

const Rail = ({ d }: { d: NavData }) => {
    const right = d.preset.side === 'right'
    const inset = d.preset.variant === 'inset'
    const content = (
        <div
            className={cn("flex flex-col items-center gap-1 py-4 w-[64px] overflow-y-auto scrollbar-hide", inset ? "rounded-[24px] border shadow-2xl max-h-full" : cn("h-full", right ? "border-l" : "border-r"))}
            style={shell(d.t)}
        >
            {d.pages.map(p => {
                const active = p.id === d.activeId
                return (
                    <button
                        key={p.id}
                        onClick={() => d.select(p.id)}
                        className="group/rail relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0"
                        style={{ backgroundColor: active ? d.t.activeBg : 'transparent', color: active ? d.t.activeText : d.t.muted }}
                        title={p.title}
                    >
                        <PageIcon page={p} d={d} size={18} />
                        {/* Label on hover */}
                        <span
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 px-2.5 h-7 rounded-lg text-[12px] font-medium whitespace-nowrap flex items-center opacity-0 pointer-events-none group-hover/rail:opacity-100 transition-opacity shadow-lg border",
                                right ? "right-full mr-3" : "left-full ml-3"
                            )}
                            style={shell(d.t)}
                        >
                            {p.title}
                        </span>
                    </button>
                )
            })}
            <div className="mt-auto pt-2 empty:hidden"><AssetLibraryNavButton look="icon" colors={lib(d.t)} className="w-11 h-11 rounded-xl" /></div>
        </div>
    )
    if (inset) {
        return <div className={cn("absolute top-1/2 -translate-y-1/2 z-[900] max-h-[calc(100%-32px)] flex", right ? "right-4" : "left-4")}>{content}</div>
    }
    return <div className="h-full shrink-0 z-[900] relative">{content}</div>
}

const OverlayMenu = ({ d }: { d: NavData }) => {
    const [open, setOpen] = useState(false)
    const close = React.useCallback(() => setOpen(false), [])
    useEscape(open, close)
    const columns = d.useGroups ? d.groups : [{ label: 'Páginas', pages: d.pages }]
    return (
        <>
            <div className="absolute top-0 left-0 right-0 z-[900] h-16 px-8 flex items-center justify-between" style={{ ...shell(d.t), backgroundColor: open ? 'transparent' : d.t.bg }}>
                <Logo d={d} size={24} />
                <div className="ml-auto mr-6"><AssetLibraryNavButton look="pill" colors={lib(d.t)} /></div>
                <button onClick={() => setOpen(o => !o)} className="flex items-center gap-3 text-[13px] font-medium" style={{ color: d.t.text }}>
                    {open ? 'Fechar' : 'Menu'}
                    {open ? <X className="w-6 h-6" strokeWidth={1.5} /> : <AlignRight className="w-6 h-6" strokeWidth={1.5} />}
                </button>
            </div>
            {open && (
                <div className="absolute inset-0 z-[899] overflow-y-auto pt-24 px-8 pb-12 animate-in fade-in duration-200" style={shell(d.t)}>
                    <div className="grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                        {columns.map(col => (
                            <div key={col.label} className="flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: d.t.muted }}>{col.label}</span>
                                {col.pages.map(p => {
                                    const active = p.id === d.activeId
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => { d.select(p.id); close() }}
                                            className="text-left text-[32px] leading-[1.25] tracking-tight transition-opacity hover:opacity-100"
                                            style={{ color: active ? d.t.accent : d.t.text, opacity: active ? 1 : 0.7 }}
                                        >
                                            {p.title}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 empty:hidden"><AssetLibraryNavButton look="big" colors={lib(d.t)} /></div>
                </div>
            )}
        </>
    )
}

const Drawer = ({ d }: { d: NavData }) => {
    const [open, setOpen] = useState(false)
    const close = React.useCallback(() => setOpen(false), [])
    useEscape(open, close)
    const right = d.preset.side === 'right'
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={cn("absolute top-4 z-[900] h-11 px-4 rounded-full border shadow-xl flex items-center gap-2 text-[14px] font-medium", right ? "right-4" : "left-4")}
                style={shell(d.t)}
                aria-label="Abrir menu"
            >
                <Menu className="w-5 h-5" /> Menu
            </button>
            {open && (
                <div className="absolute inset-0 z-[950]">
                    <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={close} />
                    <div
                        className={cn("absolute top-0 bottom-0 w-[300px] max-w-[85%] flex flex-col shadow-2xl animate-in duration-200", right ? "right-0 slide-in-from-right" : "left-0 slide-in-from-left")}
                        style={shell(d.t)}
                    >
                        <div className="h-16 px-5 flex items-center justify-between shrink-0">
                            <Logo d={d} size={24} />
                            <button onClick={close} aria-label="Fechar menu" style={{ color: d.t.text }}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 pb-6">
                            <VerticalLinksSelect d={d} onPick={close} />
                        </div>
                        <div className="px-3 pb-5 empty:hidden"><AssetLibraryNavButton look="row" colors={lib(d.t)} /></div>
                    </div>
                </div>
            )}
        </>
    )
}

/** Vertical list that also closes the surface it lives in */
const VerticalLinksSelect = ({ d, onPick }: { d: NavData, onPick: () => void }) => (
    <VerticalLinks d={{ ...d, select: (id) => { d.select(id); onPick() } }} />
)

const ContentsCard = ({ d }: { d: NavData }) => {
    const [open, setOpen] = useState(false)
    const close = React.useCallback(() => setOpen(false), [])
    useEscape(open, close)
    return (
        <div className="absolute top-4 right-4 z-[900]">
            <div className={cn("rounded-2xl border shadow-2xl overflow-hidden transition-all", open ? "w-[260px]" : "w-auto")} style={shell(d.t)}>
                <button onClick={() => setOpen(o => !o)} className="h-12 px-5 w-full flex items-center justify-end gap-3 text-[15px] font-medium" style={{ color: d.t.text }}>
                    <span className="w-4 flex flex-col gap-[3px]">
                        <span className="h-[1.5px] w-full" style={{ backgroundColor: d.t.text }} />
                        {!open && <span className="h-[1.5px] w-2/3 ml-auto" style={{ backgroundColor: d.t.text }} />}
                    </span>
                    Contents
                </button>
                {open && (
                    <div className="px-3 pb-4 pt-2 flex flex-col gap-0.5 animate-in fade-in duration-150">
                        {d.pages.map(p => {
                            const active = p.id === d.activeId
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => { d.select(p.id); close() }}
                                    className="h-10 px-2 rounded-lg flex items-center justify-end gap-3 text-[15px] transition-colors"
                                    style={{ color: active ? d.t.accent : d.t.text }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = d.t.hover }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                >
                                    <span className="truncate">{p.title}</span>
                                    <PageIcon page={p} d={d} size={18} />
                                </button>
                            )
                        })}
                        <div className="mt-1 pt-1 border-t empty:hidden" style={{ borderColor: d.t.border }}><AssetLibraryNavButton look="row" colors={lib(d.t)} /></div>
                    </div>
                )}
            </div>
        </div>
    )
}

const ContentsModal = ({ d }: { d: NavData }) => {
    const [open, setOpen] = useState(false)
    const close = React.useCallback(() => setOpen(false), [])
    useEscape(open, close)
    const activeIndex = Math.max(0, d.pages.findIndex(p => p.id === d.activeId))
    const current = d.pages[activeIndex]
    const num = (i: number) => `(${String(i + 1).padStart(2, '0')})`
    return (
        <>
            {/* Bottom bar: current chapter + Contents */}
            <div className="absolute left-0 right-0 bottom-6 z-[900] flex justify-center px-4 pointer-events-none">
                <div className="pointer-events-auto h-[52px] rounded-full border shadow-2xl flex items-center gap-2 pl-5 pr-1.5" style={shell(d.t)}>
                    {d.preset.variant !== 'icons' && (
                        <>
                            <ScrollProgressRing key={d.activeId} color={d.t.accent} track={d.t.border} />
                            <span className="font-mono text-[11px] tracking-[0.14em] uppercase truncate max-w-[200px]" style={{ color: d.t.muted }}>
                                {current ? `${num(activeIndex)} ${current.title}` : ''}
                            </span>
                            <span className="w-px h-5 mx-2" style={{ backgroundColor: d.t.border }} />
                        </>
                    )}
                    <AssetLibraryNavButton look="mono" colors={lib(d.t)} />
                    <button
                        onClick={() => setOpen(true)}
                        className="h-10 px-4 rounded-full flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase"
                        style={{ backgroundColor: d.t.activeBg, color: d.t.activeText }}
                    >
                        <Menu className="w-3.5 h-3.5" /> Contents
                    </button>
                </div>
            </div>
            {open && (
                <div className="absolute inset-0 z-[950] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={close} />
                    <div className="relative w-full max-w-[720px] rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={shell(d.t)}>
                        <div className="px-6 h-14 flex items-center justify-between border-b font-mono text-[11px] tracking-[0.16em] uppercase" style={{ borderColor: d.t.border, color: d.t.muted }}>
                            <span>Contents</span>
                            <button onClick={close} style={{ color: d.t.muted }}>Esc para fechar</button>
                        </div>
                        <div className="py-3 max-h-[60vh] overflow-y-auto">
                            {d.pages.map((p, i) => {
                                const active = p.id === d.activeId
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => { d.select(p.id); close() }}
                                        className="w-full px-6 h-14 flex items-center gap-6 text-left transition-colors"
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = d.t.hover }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                    >
                                        <span className="font-mono text-[12px] w-8 shrink-0" style={{ color: active ? d.t.accent : d.t.muted }}>{num(i)}</span>
                                        <span className="text-[18px] font-medium tracking-tight truncate" style={{ color: d.t.text }}>{p.title}</span>
                                        <span className="ml-auto text-[13px] truncate hidden sm:block" style={{ color: d.t.muted }}>{p.group}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <div className="px-6 h-12 flex items-center justify-between border-t font-mono text-[10px] tracking-[0.16em] uppercase" style={{ borderColor: d.t.border, color: d.t.muted }}>
                            <span>{d.brandName}</span>
                            <span>{new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

/** Draws the chosen navigation if it belongs to this slot (only while previewing / on the shared link) */
export function SharedNavigation({ slot, previewing }: { slot: Slot, previewing: boolean }) {
    const d = useNavData()
    if (!previewing || slotOf(d.preset) !== slot || d.pages.length === 0) return null
    switch (d.preset.layout) {
        case 'topbar': return <TopBar d={d} />
        case 'top-capsule': return <Capsule d={d} />
        case 'bottom-capsule': return <Capsule d={d} bottom />
        case 'dock': return <Dock d={d} />
        case 'side': return <SidePanel d={d} />
        case 'side-floating': return <SidePanel d={d} floating />
        case 'rail': return <Rail d={d} />
        case 'overlay-menu': return <OverlayMenu d={d} />
        case 'drawer': return <Drawer d={d} />
        case 'contents-card': return <ContentsCard d={d} />
        case 'contents-modal': return <ContentsModal d={d} />
        default: return null
    }
}
