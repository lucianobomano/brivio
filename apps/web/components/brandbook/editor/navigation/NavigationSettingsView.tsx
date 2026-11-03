"use client"

import React, { useMemo, useState } from "react"
import { Check, Copy, ExternalLink, Loader2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { setPublicAssetLibrary } from "@/app/actions/assets"
import { Switch } from "@/components/ui/switch"
import { refreshAssetLibraryStatus, setAssetLibraryStatus, useAssetLibraryStatus } from "./AssetLibraryAccess"
import { useBrandDesign } from "../BrandDesignContext"
import { SmoothColorInput } from "../SmoothColorInput"
import {
    NAV_PRESETS, NAV_ICONS, NavPreset, NavigationSettings, getNavPreset, getNavTokens, getAutoIconName, getPageIcon,
} from "./navigationPresets"

type ThemeLike = { bg: string, text: string, textSec: string, border: string }

/** Schematic of a navigation style: a small page with the navigation drawn where it sits */
const StyleThumb = ({ preset, accent }: { preset: NavPreset, accent: string }) => {
    const box = React.useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    React.useEffect(() => {
        const el = box.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 160))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const t = getNavTokens(preset.theme, accent)
    const bar = { backgroundColor: t.bg, borderColor: t.border }
    const dot = (active?: boolean, key?: number) => (
        <span key={key} className="h-[5px] rounded-full shrink-0" style={{ width: active ? 16 : 12, backgroundColor: active ? (preset.theme === 'brand' ? '#fff' : t.accent) : t.muted, opacity: active ? 1 : 0.6 }} />
    )
    const square = (active?: boolean, key?: number) => (
        <span key={key} className="w-[9px] h-[9px] rounded-[3px] shrink-0" style={{ backgroundColor: active ? t.activeBg : t.muted, opacity: active ? 1 : 0.45 }} />
    )
    const links = (n = 4) => Array.from({ length: n }, (_, i) => dot(i === 0, i))
    const right = preset.side === 'right'
    let nav: React.ReactNode = null

    switch (preset.layout) {
        case 'sidebar':
            nav = <div className="absolute left-0 top-0 bottom-0 w-[30%] flex flex-col gap-1.5 p-2 bg-[#F4F4F4] border-r border-black/5">
                {Array.from({ length: 5 }, (_, i) => <span key={i} className="h-[4px] rounded-full bg-black/25" style={{ width: `${70 - i * 8}%` }} />)}
            </div>
            break
        case 'topbar': {
            const inset = preset.variant === 'inset'
            nav = <div className={cn("absolute flex items-center gap-1.5 px-2 h-[18px] border", inset ? "top-1.5 left-1.5 right-1.5 rounded-md" : "top-0 left-0 right-0 border-x-0 border-t-0", preset.variant === 'centered' && "justify-center")} style={{ ...bar, ...(preset.variant === 'outlined' ? { borderColor: t.accent, margin: 4, borderWidth: 1 } : {}) }}>
                {preset.variant !== 'centered' && <span className="w-[14px] h-[6px] rounded-sm mr-auto" style={{ backgroundColor: t.text }} />}
                {links()}
            </div>
            break
        }
        case 'top-capsule':
        case 'bottom-capsule': {
            const icons = preset.variant === 'icons' || preset.variant === 'icons-label'
            const wide = preset.variant === 'wide'
            nav = <div className={cn("absolute left-0 right-0 flex justify-center", preset.layout === 'top-capsule' ? "top-1.5" : "bottom-2")}>
                <div className={cn("h-[16px] rounded-full border flex items-center gap-1 px-1.5 shadow-sm", wide && "w-[86%]")} style={bar}>
                    {wide && <span className="w-[12px] h-[5px] rounded-sm mr-auto" style={{ backgroundColor: t.text }} />}
                    {icons ? Array.from({ length: 4 }, (_, i) => square(i === 0, i)) : links(3)}
                </div>
            </div>
            break
        }
        case 'dock':
            nav = <div className="absolute left-0 right-0 bottom-2 flex justify-center">
                <div className="h-[18px] rounded-[6px] border flex items-center gap-1 px-1.5 shadow-sm" style={bar}>
                    {Array.from({ length: 5 }, (_, i) => square(i === 1, i))}
                </div>
            </div>
            break
        case 'side':
        case 'side-floating': {
            const floating = preset.layout === 'side-floating'
            nav = <div className={cn("absolute flex flex-col gap-1.5 p-2 border w-[32%]", floating ? "top-1.5 bottom-1.5 rounded-md" : "top-0 bottom-0", right ? (floating ? "right-1.5" : "right-0 border-r-0 border-y-0") : (floating ? "left-1.5" : "left-0 border-l-0 border-y-0"))} style={bar}>
                <span className="w-[14px] h-[5px] rounded-sm mb-1" style={{ backgroundColor: t.text }} />
                {links(4).map((l, i) => <div key={i} className="flex">{l}</div>)}
            </div>
            break
        }
        case 'rail': {
            const inset = preset.variant === 'inset'
            nav = <div className={cn("absolute flex flex-col items-center gap-1.5 py-2 px-1 border", inset ? "top-1/2 -translate-y-1/2 rounded-md" : "top-0 bottom-0", right ? (inset ? "right-1.5" : "right-0") : (inset ? "left-1.5" : "left-0"))} style={bar}>
                {Array.from({ length: 4 }, (_, i) => square(i === 0, i))}
            </div>
            break
        }
        case 'overlay-menu':
            nav = <div className="absolute inset-0 p-2 flex flex-col" style={{ backgroundColor: t.bg }}>
                <div className="flex items-center justify-between mb-2">
                    <span className="w-[14px] h-[5px] rounded-sm" style={{ backgroundColor: t.text }} />
                    <span className="flex flex-col gap-[2px] w-[10px]"><span className="h-[1.5px]" style={{ backgroundColor: t.text }} /><span className="h-[1.5px]" style={{ backgroundColor: t.text }} /></span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 3 }, (_, c) => <div key={c} className="flex flex-col gap-1">{Array.from({ length: 3 }, (_, i) => <span key={i} className="h-[4px] rounded-full" style={{ backgroundColor: c === 0 && i === 0 ? t.accent : t.text, opacity: c === 0 && i === 0 ? 1 : 0.55 }} />)}</div>)}
                </div>
            </div>
            break
        case 'drawer':
            nav = <>
                <div className={cn("absolute top-0 bottom-0 w-[38%] p-2 flex flex-col gap-1.5 shadow-md", right ? "right-0" : "left-0")} style={{ backgroundColor: t.bg }}>
                    {links(4).map((l, i) => <div key={i} className="flex">{l}</div>)}
                </div>
                <div className={cn("absolute top-0 bottom-0 bg-black/25", right ? "left-0 right-[38%]" : "right-0 left-[38%]")} />
            </>
            break
        case 'contents-card':
            nav = <div className="absolute top-1.5 right-1.5 w-[42%] rounded-md border p-1.5 flex flex-col items-end gap-1 shadow-sm" style={bar}>
                <span className="h-[4px] w-[50%] rounded-full" style={{ backgroundColor: t.text }} />
                {Array.from({ length: 3 }, (_, i) => <span key={i} className="h-[3px] rounded-full" style={{ width: `${70 - i * 10}%`, backgroundColor: t.muted }} />)}
            </div>
            break
        case 'contents-modal':
            nav = <>
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-x-[14%] top-[16%] bottom-[26%] rounded-md border p-1.5 flex flex-col gap-1" style={bar}>
                    {Array.from({ length: 4 }, (_, i) => <span key={i} className="h-[3px] rounded-full" style={{ width: `${80 - i * 12}%`, backgroundColor: i === 0 ? t.accent : t.muted }} />)}
                </div>
                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
                    <span className="h-[10px] w-[44%] rounded-full border" style={bar} />
                </div>
            </>
            break
    }

    return (
        // Drawn on a fixed 160×100 page and scaled to the card, so the navigation keeps its proportions at any size
        <div ref={box} className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-[#ECECEE] ring-1 ring-black/10">
            <div className="absolute left-0 top-0 w-[160px] h-[100px] origin-top-left" style={{ transform: `scale(${scale})` }}>
                {/* Page content hint */}
                <div className="absolute inset-[22%] flex flex-col gap-1.5 opacity-50">
                    <span className="h-[5px] w-[60%] rounded-full bg-black/40" />
                    <span className="h-[3px] w-[85%] rounded-full bg-black/25" />
                    <span className="h-[3px] w-[70%] rounded-full bg-black/25" />
                    <span className="h-[3px] w-[55%] rounded-full bg-black/25" />
                </div>
                {nav}
            </div>
        </div>
    )
}

/** Settings → Navegação: navigation style of the shared brandbook link */
export const NavigationSettingsView = ({ t }: { t: ThemeLike }) => {
    const { footerSettings, updateFooterSettings, modules = [], brandId } = useBrandDesign()
    // Public sharing of the brand's asset library (visitors see the navigation button only while it's on)
    const libraryStatus = useAssetLibraryStatus(brandId)
    const libraryPublic = libraryStatus ? libraryStatus.active : null
    const [savingShare, setSavingShare] = useState(false)
    const toggleShare = async (active: boolean) => {
        if (!brandId || savingShare) return
        const previous = libraryStatus
        setSavingShare(true)
        setAssetLibraryStatus(brandId, { active, protected: previous?.protected ?? false })
        try {
            const result = await setPublicAssetLibrary(brandId, active)
            if (!result.success) throw new Error(result.error)
            setAssetLibraryStatus(brandId, result.status)
            // What the server reads back is the truth: never say "shared" if it isn't
            if (result.status.active !== active) throw new Error('not applied')
            toast.success(active ? 'Asset Library partilhada' : 'Asset Library privada', {
                description: active ? 'Os visitantes do brandbook já veem o botão na navegação.' : 'Só a equipa vê o botão.',
            })
        } catch {
            if (previous) setAssetLibraryStatus(brandId, previous)
            else refreshAssetLibraryStatus(brandId)
            toast.error('Não foi possível alterar a partilha da Asset Library.')
        } finally {
            setSavingShare(false)
        }
    }
    const libraryLink = typeof window !== 'undefined' && brandId ? `${window.location.origin}/share/${brandId}` : ''
    const nav: NavigationSettings = footerSettings?.navigation || {}
    const showLibrary = nav.showAssetLibrary ?? true
    const preset = getNavPreset(nav.style)
    const accent = nav.accentColor || '#FF0054'
    const [iconPickerFor, setIconPickerFor] = useState<string | null>(null)
    const [groupFilter, setGroupFilter] = useState<string>('Todos')

    const save = (patch: Partial<NavigationSettings>) => updateFooterSettings({ navigation: { ...nav, ...patch } })

    const groups = useMemo(() => ['Todos', ...Array.from(new Set(NAV_PRESETS.map(p => p.group)))], [])
    const visiblePresets = NAV_PRESETS.filter(p => groupFilter === 'Todos' || p.group === groupFilter)
    const pages = modules.filter(m => !m.isHidden)
    const isSidebar = preset.layout === 'sidebar'

    const segmented = <T extends string>(value: T, options: [T, string][], onChange: (v: T) => void, disabled?: boolean) => (
        // Equal cells filling the column: labels stay on one line, whatever the column width
        <div
            className={cn("grid w-full gap-1 p-1 rounded-lg border", t.border, disabled && "opacity-40 pointer-events-none")}
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
            {options.map(([id, label]) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    title={label}
                    className={cn("h-8 px-2 rounded-md text-[13px] font-medium whitespace-nowrap truncate transition-colors", value === id ? "bg-[#FF0054] text-white" : cn(t.textSec, "hover:opacity-80"))}
                >
                    {label}
                </button>
            ))}
        </div>
    )

    return (
        <div className="flex flex-col gap-10 max-w-5xl">
            <div className="flex flex-col gap-2">
                <span className={cn("text-[22px] font-semibold", t.text)}>Navegação do brandbook partilhado</span>
                <span className={cn("text-[14px]", t.textSec)}>
                    Como quem abre o link partilhado navega entre as páginas. No editor continua o menu lateral; veja o resultado em Preview.
                </span>
            </div>

            {/* Options */}
            <div className={cn("grid gap-x-8 gap-y-7 pb-10 border-b", t.border)} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
                <div className="flex flex-col gap-2">
                    <span className={cn("text-[13px]", t.textSec)}>Mostrar</span>
                    {segmented(nav.grouping || 'pages', [['separators', 'Separadores'], ['pages', 'Só páginas']], (v) => save({ grouping: v }), isSidebar)}
                    <span className={cn("text-[12px]", t.textSec)}>
                        {nav.grouping === 'separators' ? 'Ao passar o rato num separador aparecem as suas páginas.' : 'Todas as páginas lado a lado, sem separadores.'}
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <span className={cn("text-[13px]", t.textSec)}>Ícones nas páginas</span>
                    {segmented(nav.showIcons === false ? 'off' : nav.showIcons ? 'on' : 'auto', [['auto', 'Automático'], ['on', 'Mostrar'], ['off', 'Ocultar']], (v) => save({ showIcons: v === 'auto' ? undefined : v === 'on' }), isSidebar)}
                    <span className={cn("text-[12px]", t.textSec)}>Estilos só com ícones mostram-nos sempre.</span>
                </div>
                <div className={cn("flex flex-col gap-2", isSidebar && "opacity-40 pointer-events-none")}>
                    <span className={cn("text-[13px]", t.textSec)}>Cor de destaque</span>
                    <div className="flex items-center gap-3 h-10">
                        <label className="relative w-9 h-9 rounded-full border border-black/10 cursor-pointer overflow-hidden shrink-0" style={{ backgroundColor: accent }}>
                            <SmoothColorInput
                                type="color"
                                value={accent}
                                onChange={(e) => save({ accentColor: e.target.value })}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                        </label>
                        <span className={cn("font-mono text-[13px] uppercase", t.text)}>{accent}</span>
                    </div>
                </div>
            </div>

            {/* Asset library button */}
            <div className={cn("grid gap-x-8 gap-y-7 pb-10 border-b", t.border)} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
                <div className="flex flex-col gap-2">
                    <span className={cn("text-[13px]", t.textSec)}>Botão Asset Library</span>
                    {segmented(showLibrary ? 'on' : 'off', [['on', 'Mostrar'], ['off', 'Ocultar']], (v) => save({ showAssetLibrary: v === 'on' }))}
                    <span className={cn("text-[12px]", t.textSec)}>Aparece em todos os estilos de navegação e abre a biblioteca de ficheiros da marca por cima do brandbook.</span>
                </div>
                <div className={cn("flex flex-col gap-2", !showLibrary && "opacity-40 pointer-events-none")}>
                    <span className={cn("text-[13px]", t.textSec)}>Texto do botão</span>
                    <input
                        value={nav.assetLibraryLabel ?? ''}
                        placeholder="Asset library"
                        onChange={(e) => save({ assetLibraryLabel: e.target.value || undefined })}
                        className={cn("w-full h-10 px-3 rounded-lg border bg-transparent text-[14px] outline-none focus:border-[#FF0054] transition-colors", t.border, t.text)}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <span className={cn("text-[13px]", t.textSec)}>Partilha pública</span>
                    <div className={cn("flex items-center justify-between gap-3 h-10 pl-3 pr-2 rounded-lg border", t.border)}>
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", libraryPublic ? "bg-[#06D6A0]" : libraryPublic === null ? "bg-[#666]" : "bg-[#FF9F1C]")} />
                            <span className={cn("text-[14px] font-medium truncate", t.text)}>
                                {libraryPublic === null ? 'A verificar…' : libraryPublic ? 'Partilhada' : 'Privada'}
                            </span>
                            {savingShare && <Loader2 className={cn("w-3.5 h-3.5 animate-spin shrink-0", t.textSec)} />}
                        </div>
                        <Switch
                            checked={!!libraryPublic}
                            disabled={libraryPublic === null || savingShare || !brandId}
                            onCheckedChange={toggleShare}
                            aria-label="Partilhar a Asset Library publicamente"
                            className="shrink-0 data-[state=checked]:bg-[#FF0054] data-[state=unchecked]:bg-[#3F3F46]"
                        />
                    </div>
                    <span className={cn("text-[12px]", t.textSec)}>
                        {libraryPublic
                            ? `Todos os visitantes do brandbook veem o botão e podem ver e descarregar os ficheiros${libraryStatus?.protected ? ' (com o código de acesso definido na Asset Library)' : ''}.`
                            : 'Só a equipa vê o botão. Ative para o mostrar a quem abre o brandbook partilhado.'}
                    </span>
                    {libraryPublic && libraryLink && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => { navigator.clipboard?.writeText(libraryLink).then(() => toast.success('Link copiado')).catch(() => { }) }}
                                className="flex items-center gap-1.5 text-[12px] font-medium text-[#FF0054] hover:opacity-80"
                            >
                                <Copy className="w-3.5 h-3.5" /> Copiar link
                            </button>
                            <a href={libraryLink} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-1.5 text-[12px] font-medium hover:opacity-80", t.textSec)}>
                                <ExternalLink className="w-3.5 h-3.5" /> Abrir
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Style gallery */}
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className={cn("text-[15px]", t.textSec)}>Estilo <span className={t.text}>· {preset.name}</span></span>
                    <div className="flex flex-wrap gap-1.5">
                        {groups.map(g => (
                            <button
                                key={g}
                                onClick={() => setGroupFilter(g)}
                                className={cn("h-7 px-3 rounded-full text-[12px] font-medium border transition-colors", groupFilter === g ? "bg-[#FF0054] border-[#FF0054] text-white" : cn(t.border, t.textSec, "hover:opacity-80"))}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
                    {visiblePresets.map(p => {
                        const selected = p.id === preset.id
                        return (
                            <button
                                key={p.id}
                                onClick={() => save({ style: p.id })}
                                className={cn("relative flex flex-col gap-2.5 p-2.5 rounded-xl border text-left transition-all", selected ? "border-[#FF0054] ring-2 ring-[#FF0054]/30" : cn(t.border, "hover:border-[#FF0054]/50"))}
                            >
                                <StyleThumb preset={p} accent={accent} />
                                <span className="flex flex-col gap-0.5 px-1 pb-0.5 min-w-0">
                                    <span className={cn("text-[13px] font-semibold leading-snug", t.text)}>{p.name}</span>
                                    <span className={cn("text-[11px]", t.textSec)}>{p.group.replace(" (atual)", "")}</span>
                                </span>
                                {selected && (
                                    <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-[#FF0054] text-white flex items-center justify-center">
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Page icons */}
            <div className={cn("flex flex-col gap-4 pt-10 border-t", t.border)}>
                <div className="flex flex-col gap-1">
                    <span className={cn("text-[15px]", t.textSec)}>Ícones das páginas</span>
                    <span className={cn("text-[12px]", t.textSec)}>Cada página recebe um ícone pelo nome. Clique num ícone para o trocar.</span>
                </div>
                {pages.length === 0 && <span className={cn("text-[13px]", t.textSec)}>Ainda não há páginas.</span>}
                <div className="flex flex-col">
                    {pages.map(page => {
                        const Icon = getPageIcon(page, nav)
                        const custom = nav.pageIcons?.[page.id]
                        const open = iconPickerFor === page.id
                        const current = custom || getAutoIconName(page.title)
                        return (
                            <div key={page.id} className={cn("border-b py-2", t.border)}>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIconPickerFor(open ? null : page.id)}
                                        className={cn("w-10 h-10 rounded-xl border flex items-center justify-center transition-colors", open ? "border-[#FF0054] text-[#FF0054]" : cn(t.border, t.text, "hover:border-[#FF0054]/50"))}
                                        title="Trocar ícone"
                                    >
                                        <Icon className="w-[18px] h-[18px]" />
                                    </button>
                                    <div className="flex flex-col min-w-0">
                                        <span className={cn("text-[14px] truncate", t.text)}>{page.title}</span>
                                        <span className={cn("text-[11px]", t.textSec)}>{page.group || 'Sem separador'} · {custom ? 'escolhido' : 'automático'}</span>
                                    </div>
                                    {custom && (
                                        <button
                                            onClick={() => {
                                                const next = { ...(nav.pageIcons || {}) }
                                                delete next[page.id]
                                                save({ pageIcons: next })
                                            }}
                                            className={cn("ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80", t.textSec)}
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" /> Automático
                                        </button>
                                    )}
                                </div>
                                {open && (
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-1.5 pt-3 pb-2">
                                        {Object.entries(NAV_ICONS).map(([name, I]) => (
                                            <button
                                                key={name}
                                                title={name}
                                                onClick={() => {
                                                    save({ pageIcons: { ...(nav.pageIcons || {}), [page.id]: name } })
                                                    setIconPickerFor(null)
                                                }}
                                                className={cn("h-10 rounded-lg flex items-center justify-center transition-colors", current === name ? "bg-[#FF0054] text-white" : cn(t.textSec, "hover:bg-[#FF0054]/10 hover:text-[#FF0054]"))}
                                            >
                                                <I className="w-[18px] h-[18px]" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
