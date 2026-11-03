"use client"

/**
 * Shell and building blocks of the workspace pages (CRM, Equipa, Inventário, Finanças), copied from the
 * Projects page so the app reads as one: the 260px side menu (workspace, search, views, a short list,
 * Track time, user card), the breadcrumb bar with its compact action, the joined stat strip, #0c0c0e panels
 * on the zinc palette, the pill view switcher, and the «Criar projeto» modal (60px pink header, dark close circle).
 */

import * as React from "react"
import Image from "next/image"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useTheme } from "next-themes"
import { useRouter } from "nextjs-toploader/app"
import { ChevronsUpDown, Loader2, Moon, PanelLeft, Plus, Search, Sun, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlobalSettingsView } from "@/components/settings/GlobalSettingsView"
import { useWorkspace } from "@/components/providers/WorkspaceProvider"
import { useHeaderUser } from "@/lib/hooks/use-header-user"

type IconType = React.ComponentType<{ className?: string }>

export const PANEL = "bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm dark:shadow-xl"
export const TEXT = "text-zinc-900 dark:text-zinc-100"
export const MUTED = "text-zinc-500 dark:text-zinc-400"
const LIST_COLORS = [
    "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
]

// ---------------------------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------------------------

export type ShellNavItem = { id: string, label: string, icon: IconType, count?: number }
export type ShellListItem = { id: string, label: string, onClick?: () => void, active?: boolean }

export function WorkspaceShell<V extends string>({
    section, crumb, view, views, onView, list, listAddLabel, onListAdd, search, onSearch, searchPlaceholder = "Search", action, transparent = false, children,
}: {
    section: string
    /** Overrides the second part of the breadcrumb (the current view by default) */
    crumb?: string
    view: V
    views: (ShellNavItem & { id: V })[]
    onView: (v: V) => void
    list?: ShellListItem[]
    listAddLabel?: string
    onListAdd?: () => void
    search: string
    onSearch: (v: string) => void
    searchPlaceholder?: string
    action?: { label: string, onClick: () => void }
    /** Lets a page background (e.g. the roadmap's) show through the main area */
    transparent?: boolean
    children: React.ReactNode
}) {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { workspace } = useWorkspace()
    const user = useHeaderUser()
    const [collapsed, setCollapsed] = React.useState(false)
    const [settingsOpen, setSettingsOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => { setMounted(true) }, [])
    const searchRef = React.useRef<HTMLInputElement>(null)

    // ⌘K / Ctrl+K focuses the search, as on Projects
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCollapsed(false); setTimeout(() => searchRef.current?.focus(), 0) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const ws = workspace as { name?: string, logo_url?: string, favicon_url?: string } | null
    const studioName = ws?.name || user?.profile?.name || "Studio"
    const studioLogo = ws?.logo_url || ws?.favicon_url
    const userName = user?.profile?.name || user?.email?.split('@')[0] || ''
    const current = views.find(v => v.id === view)

    return (
        <div className={cn("flex h-screen w-full overflow-hidden text-text-primary font-sans", !transparent && "bg-bg-0")}>
            <GlobalSettingsView isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

            {/* ===== LEFT SIDEBAR ===== */}
            <aside className={cn(
                "h-screen hidden md:flex flex-col shrink-0 border-r border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090b] transition-all duration-300 z-30 select-none shadow-xs",
                collapsed ? "w-[68px]" : "w-[260px]"
            )}>
                <div className={cn("h-14 px-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] shrink-0", collapsed && "justify-center px-0")}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-xs font-bold text-zinc-900 dark:text-white shrink-0 shadow-sm overflow-hidden">
                            {studioLogo ? <Image src={studioLogo} alt={studioName} width={24} height={24} className="w-full h-full object-cover" /> : (studioName.trim()[0] || 'S').toUpperCase()}
                        </div>
                        {!collapsed && <span className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 truncate tracking-tight" title={studioName}>{studioName}</span>}
                    </div>
                    {!collapsed ? (
                        <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors" title="Alternar tema">
                                {mounted && theme === "light" ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setCollapsed(true)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors" title="Recolher barra lateral">
                                <PanelLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setCollapsed(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors mt-1" title="Expandir barra lateral">
                            <PanelLeft className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {!collapsed ? (
                    <div className="px-3 pt-3 pb-1.5 shrink-0">
                        <div className="relative flex items-center">
                            <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-white/[0.06] rounded-lg pl-8 pr-9 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/20 transition-colors"
                            />
                            <div className="absolute right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-[9px] font-mono text-zinc-500 dark:text-zinc-400 shadow-xs"><span>⌘</span><span>K</span></div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <button onClick={() => { setCollapsed(false); setTimeout(() => searchRef.current?.focus(), 0) }} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors" title="Pesquisar (⌘K)">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-1">
                    {views.map(item => {
                        const Icon = item.icon
                        const active = view === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => onView(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors text-left",
                                    collapsed && "justify-center px-0 py-2.5",
                                    active ? "bg-zinc-100 dark:bg-[#1c1c20] text-zinc-900 dark:text-white font-medium shadow-xs" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                                )}
                                title={item.label}
                            >
                                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400")} />
                                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                                {!collapsed && item.count !== undefined && <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">{item.count}</span>}
                            </button>
                        )
                    })}

                    {(list?.length || onListAdd) && <div className="my-3 border-t border-zinc-200 dark:border-white/[0.06] mx-1" />}

                    <div className="space-y-0.5">
                        {list?.slice(0, 6).map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className={cn(
                                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                                    collapsed && "justify-center px-0",
                                    item.active ? "bg-zinc-100 dark:bg-[#1c1c20] text-zinc-900 dark:text-white font-medium shadow-xs" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                                )}
                                title={item.label}
                            >
                                <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border shrink-0", LIST_COLORS[idx % LIST_COLORS.length])}>
                                    {(item.label.trim()[0] || '?').toUpperCase()}
                                </div>
                                {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                            </button>
                        ))}
                        {onListAdd && (
                            <button onClick={onListAdd} className={cn("w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors", collapsed && "justify-center px-0")} title={listAddLabel}>
                                <Plus className="w-3.5 h-3.5 shrink-0" />
                                {!collapsed && <span>{listAddLabel}</span>}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-auto border-t border-zinc-200 dark:border-white/[0.06] p-3 space-y-3 shrink-0">
                    <button onClick={() => router.push("/focus")} className={cn("w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors", collapsed && "justify-center px-0")} title="Track time">
                        <Timer className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                        {!collapsed && <span>Track time</span>}
                    </button>
                    <div onClick={() => setSettingsOpen(true)} className={cn("flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-zinc-200/80 dark:border-white/[0.04] cursor-pointer transition-colors shadow-xs", collapsed && "justify-center p-1.5")} title={userName}>
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                            {user?.profile?.avatar_url ? <Image src={user.profile.avatar_url} alt="" fill className="object-cover" /> : <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{(userName[0] || '·').toUpperCase()}</span>}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate leading-tight">{userName}</span>
                                    <span className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">{user?.email}</span>
                                </div>
                                <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <div className={cn("flex-1 flex flex-col h-screen overflow-hidden min-w-0", !transparent && "bg-bg-0")}>
                <div className="h-14 px-5 md:px-8 flex items-center justify-between border-b border-zinc-200/80 dark:border-white/[0.04] shrink-0 bg-transparent gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-zinc-500 font-medium">{section}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">/</span>
                        <span className="text-xs text-zinc-900 dark:text-zinc-200 font-semibold truncate">{crumb ?? current?.label}</span>
                    </div>
                    {/* Views on small screens (the side menu is hidden there) */}
                    <div className="md:hidden flex-1 overflow-x-auto no-scrollbar flex justify-end">
                        <ViewSwitcher views={views} value={view} onChange={onView} />
                    </div>
                    {action && (
                        <button onClick={action.onClick} className="h-8 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{action.label}</span>
                        </button>
                    )}
                </div>
                <div className={cn("flex-1 overflow-y-auto px-5 md:px-10 pt-6 no-scrollbar relative min-h-0 pb-36", !transparent && "bg-bg-0")}>
                    <div className="w-full max-w-[1520px] mx-auto flex flex-col gap-6 font-sans animate-in fade-in duration-500">{children}</div>
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Content pieces
// ---------------------------------------------------------------------------------------------

const BADGES = {
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    pink: "bg-[#ff0054]/10 text-[#ff0054] border-[#ff0054]/20",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-white/[0.04] dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]",
} as const
export type Tone = keyof typeof BADGES

/** The four joined stat cells of the Projects dashboard */
export function StatStrip({ stats }: { stats: { label: string, value: React.ReactNode, unit?: string, icon: IconType, tone: Tone, onClick?: () => void }[] }) {
    return (
        <div className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-white/[0.08] overflow-hidden shadow-sm dark:shadow-xl">
            {stats.map((s, i) => (
                <div key={i} onClick={s.onClick} className={cn("px-6 py-5 flex flex-col justify-between transition-colors group min-w-0", s.onClick && "hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer")}>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal truncate">{s.label}</span>
                        <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center transition-transform group-hover:scale-105 shrink-0", BADGES[s.tone])}>
                            <s.icon className="w-3 h-3" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3 min-w-0">
                        <span className="text-2xl lg:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight truncate">{s.value}</span>
                        {s.unit && <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium truncate">{s.unit}</span>}
                    </div>
                </div>
            ))}
        </div>
    )
}

/** Panel with the dashboard's header row (icon + title on the left, extra on the right) */
export function Panel({ title, icon: Icon, right, children, className, bodyClassName }: { title?: string, icon?: IconType, right?: React.ReactNode, children: React.ReactNode, className?: string, bodyClassName?: string }) {
    return (
        <div className={cn(PANEL, "p-6 flex flex-col", className)}>
            {(title || right) && (
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-0">
                        {Icon && <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />}
                        <span className="truncate">{title}</span>
                    </div>
                    {right}
                </div>
            )}
            <div className={cn(title || right ? "pt-5" : "", bodyClassName)}>{children}</div>
        </div>
    )
}

/** The pill switcher of the dashboard (Diário / Semanal / …) */
export function ViewSwitcher<V extends string>({ views, value, onChange }: { views: { id: V, label: string, count?: number }[], value: V, onChange: (v: V) => void }) {
    return (
        <div className="bg-zinc-100 dark:bg-[#050507] border border-zinc-200/80 dark:border-white/[0.08] p-0.5 rounded-lg flex items-center gap-1 w-max">
            {views.map(v => (
                <button
                    key={v.id}
                    type="button"
                    onClick={() => onChange(v.id)}
                    className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                        v.id === value ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    )}
                >
                    {v.label}
                    {v.count !== undefined && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{v.count}</span>}
                </button>
            ))}
        </div>
    )
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: IconType, title: string, text: string, action?: React.ReactNode }) {
    return (
        <div className="border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl px-6 py-16 flex flex-col items-center text-center">
            <div className={cn("w-10 h-10 rounded-lg border flex items-center justify-center mb-4", BADGES.zinc)}><Icon className="w-4 h-4" /></div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1.5 leading-relaxed">{text}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}

export function Pill({ children, tone = 'zinc' }: { children: React.ReactNode, tone?: Tone }) {
    return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap", BADGES[tone])}>{children}</span>
}

export function DarkButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props} className={cn("h-8 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60", className)}>
            {children}
        </button>
    )
}

export function OutlineButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props} className={cn("h-8 px-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white inline-flex items-center gap-1.5 transition-all disabled:opacity-60", className)}>
            {children}
        </button>
    )
}

export function IconButton({ title, onClick, children, danger }: { title: string, onClick: () => void, children: React.ReactNode, danger?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className={cn("w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 transition-colors", danger ? "hover:text-rose-500 hover:bg-rose-500/10" : "hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06]")}
        >
            {children}
        </button>
    )
}

/** Header row of a table, in the dashboard's small grey caps */
export const TABLE_HEAD = "px-6 py-3 border-b border-zinc-200/80 dark:border-white/[0.06] text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
export const TABLE_ROW = "px-6 py-3.5 border-b border-zinc-200/60 dark:border-white/[0.04] last:border-0 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"

// ---------------------------------------------------------------------------------------------
// Modal (as «Criar projeto»: 60px pink header, dark close circle, 8px corners)
// ---------------------------------------------------------------------------------------------

export function Modal({ open, onClose, title, children, footer, width = 560 }: {
    open: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    width?: number
}) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
                <DialogPrimitive.Content
                    className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-h-[calc(100vh-48px)] flex flex-col bg-white dark:bg-[#15161B] rounded-[8px] shadow-2xl overflow-hidden border border-gray-100 dark:border-[#373737] data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in focus:outline-none"
                    style={{ maxWidth: width }}
                >
                    <div className="h-[60px] bg-[#ff0054] px-8 flex items-center justify-between shrink-0">
                        <DialogPrimitive.Title className="text-[20px] font-bold text-white truncate">{title}</DialogPrimitive.Title>
                        <DialogPrimitive.Close className="w-[22px] h-[22px] bg-[#15161B] rounded-full transition-transform active:scale-90 shrink-0" title="Fechar">
                            <span className="sr-only">Fechar</span>
                        </DialogPrimitive.Close>
                    </div>
                    <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
                    <div className="flex-1 overflow-y-auto px-8 py-7 space-y-5 custom-scrollbar">{children}</div>
                    {footer && <div className="px-8 py-5 border-t border-gray-100 dark:border-[#373737] flex items-center justify-end gap-3 shrink-0">{footer}</div>}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

export function ModalPrimary({ children, loading, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
    return (
        <button {...props} disabled={loading || props.disabled} className={cn("h-10 px-6 rounded-[6px] bg-[#ff0054] hover:bg-[#e0004a] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60", className)}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    )
}

export function ModalSecondary({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props} className={cn("h-10 px-5 rounded-[6px] text-[13px] font-medium text-[#97A1B3] hover:text-zinc-900 dark:hover:text-white transition-colors", className)}>
            {children}
        </button>
    )
}

// ---------------------------------------------------------------------------------------------
// Form fields (as in the project modals)
// ---------------------------------------------------------------------------------------------

const FIELD = "w-full h-11 px-3.5 rounded-[6px] bg-[#F7F7F8] dark:bg-[#1C1D23] border border-[#E5E7EB] dark:border-[#2C2D35] text-[14px] text-zinc-900 dark:text-white placeholder:text-[#97A1B3] outline-none focus:border-[#ff0054] transition-colors"

export function Field({ label, children, hint }: { label: string, children: React.ReactNode, hint?: string }) {
    return (
        <label className="block space-y-2">
            <span className="block text-[12px] font-medium text-[#97A1B3] uppercase tracking-tight">{label}</span>
            {children}
            {hint && <span className="block text-[12px] text-[#97A1B3]">{hint}</span>}
        </label>
    )
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    function TextInput(props, ref) { return <input ref={ref} {...props} className={cn(FIELD, props.className)} /> }
)

export function SelectInput({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={cn(FIELD, "pr-8 cursor-pointer", props.className)}>{children}</select>
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cn(FIELD, "h-auto min-h-[96px] py-3 resize-none", props.className)} />
}

/** Choice cards inside modals (selected: pink border) */
export function ChoiceCard({ selected, onClick, icon: Icon, title, text }: { selected: boolean, onClick: () => void, icon: IconType, title: string, text?: string }) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onClick}
            className={cn("w-full text-left flex items-center gap-3 p-3.5 rounded-[6px] border transition-colors", selected ? "border-[#ff0054] bg-[#ff0054]/[0.05]" : "border-[#E5E7EB] dark:border-[#2C2D35] hover:bg-[#F7F7F8] dark:hover:bg-[#1C1D23]")}
        >
            <span className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", selected ? "bg-[#ff0054] text-white" : "bg-[#EFF0F2] dark:bg-[#27282D] text-[#97A1B3]")}><Icon className="w-4 h-4" /></span>
            <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-zinc-900 dark:text-white">{title}</span>
                {text && <span className="block text-[12px] text-[#97A1B3]">{text}</span>}
            </span>
        </button>
    )
}
