"use client"

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { ExternalLink, FolderOpen, Lock, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getPublicAssetLibraryStatus } from "@/app/actions/assets"
import { useBrandDesign } from "../BrandDesignContext"

/**
 * "Asset library" button of the brandbook navigation. On the published brandbook there is no editor top
 * bar, so the navigation offers the brand's asset library to visitors, when the owner shares it publicly
 * (Asset Library → Share at the root, link active). It opens the public library over the brandbook.
 * In the editor Preview it always shows, so the owner sees where it sits; without a public link it opens
 * the editor's library instead.
 */

interface AccessValue {
    brandId?: string
    /** Members of the brand (editor); visitors of the published brandbook can't edit */
    canEdit: boolean
    /** Opens the editor's own library (members) */
    openEditorLibrary?: () => void
}

const AccessContext = createContext<AccessValue>({ canEdit: false })

export type AssetLibraryStatus = { active: boolean, protected: boolean }

// Public-sharing status per brand, shared by every navigation button and the settings: one fetch, and a
// change (settings switch, Asset Library → Share) shows everywhere at once
const statuses = new Map<string, AssetLibraryStatus>()
const pending = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

/** Publishes a status known to be current (e.g. returned by the save) */
export const setAssetLibraryStatus = (brandId: string, status: AssetLibraryStatus) => {
    statuses.set(brandId, status)
    listeners.forEach(listener => listener())
}

const loadStatus = (brandId: string, force = false) => {
    if (!force && (statuses.has(brandId) || pending.has(brandId))) return
    const request = getPublicAssetLibraryStatus(brandId)
        .catch(() => ({ active: false, protected: false }))
        .then(status => { pending.delete(brandId); setAssetLibraryStatus(brandId, status) })
    pending.set(brandId, request)
}

/** Fetch the status again (after the share settings change somewhere else) */
export const refreshAssetLibraryStatus = (brandId: string) => loadStatus(brandId, true)

/** Current public-sharing status of the brand's library (null while loading) */
export const useAssetLibraryStatus = (brandId?: string): AssetLibraryStatus | null => {
    const status = useSyncExternalStore(subscribe, () => (brandId && statuses.get(brandId)) || null, () => null)
    useEffect(() => { if (brandId) loadStatus(brandId) }, [brandId])
    return status
}

const ViewerContext = createContext<(open: boolean) => void>(() => { })

export function AssetLibraryAccessProvider({ brandId, canEdit, openEditorLibrary, children }: AccessValue & { children: React.ReactNode }) {
    const [viewerOpen, setViewerOpen] = useState(false)
    return (
        <AccessContext.Provider value={{ brandId, canEdit, openEditorLibrary }}>
            <ViewerContext.Provider value={setViewerOpen}>
                {children}
                {viewerOpen && brandId && <PublicLibraryViewer brandId={brandId} onClose={() => setViewerOpen(false)} />}
            </ViewerContext.Provider>
        </AccessContext.Provider>
    )
}

/** Whether the navigation shows the button, its label, and what a click does */
export const useAssetLibraryButton = () => {
    const { brandId, canEdit, openEditorLibrary } = useContext(AccessContext)
    const setViewerOpen = useContext(ViewerContext)
    const { footerSettings } = useBrandDesign()
    const nav = footerSettings?.navigation
    const enabled = nav?.showAssetLibrary ?? true
    const status = useAssetLibraryStatus(enabled ? brandId : undefined)

    const isPublic = !!status?.active
    return {
        visible: enabled && !!brandId && (canEdit || isPublic),
        label: nav?.assetLibraryLabel || 'Asset library',
        /** Shown to members while the library isn't public: visitors won't see the button */
        isPrivate: canEdit && status !== null && !isPublic,
        open: () => {
            if (isPublic) { setViewerOpen(true); return }
            if (canEdit) {
                openEditorLibrary?.()
                toast.info('A Asset Library ainda não é pública', {
                    description: 'Os visitantes só veem este botão depois de a partilhar: Settings → Navegação → Partilhar a Asset Library.',
                })
            }
        },
    }
}

/** The public library (share page) over the brandbook */
const PublicLibraryViewer = ({ brandId, onClose }: { brandId: string, onClose: () => void }) => {
    const { brandInfo } = useBrandDesign()
    const url = `/share/${brandId}`
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])
    if (typeof document === 'undefined') return null
    return createPortal(
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
            <div className="relative w-full h-full max-w-[1400px] rounded-2xl overflow-hidden border border-white/10 bg-[#0B0B0D] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="h-14 px-5 flex items-center gap-3 border-b border-white/10 shrink-0 text-white">
                    <FolderOpen className="w-4 h-4 text-[#FF0054]" />
                    <span className="text-[14px] font-medium truncate">{brandInfo?.name ? `${brandInfo.name} · ` : ''}Asset library</span>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto h-8 px-3 rounded-full flex items-center gap-1.5 text-[12px] text-[#97A1B3] hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir num separador
                    </a>
                    <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#97A1B3] hover:text-white hover:bg-white/10" aria-label="Fechar">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <iframe src={url} title="Asset library" className="flex-1 w-full bg-white" />
            </div>
        </div>,
        document.body
    )
}

/** The button, drawn to match each navigation style */
export const AssetLibraryNavButton = (props: Parameters<typeof NavButton>[0] & { divider?: boolean }) => {
    const lib = useAssetLibraryButton()
    if (!lib.visible) return null
    const { divider, ...rest } = props
    return (
        <>
            {divider && <span className="w-px h-5 mx-1 shrink-0" style={{ backgroundColor: props.colors.border || props.colors.hover }} aria-hidden />}
            <NavButton {...rest} />
        </>
    )
}

const NavButton = ({ look, colors, className }: {
    /** pill: horizontal bars · icon: docks / rails / icon capsules · row: vertical lists · big: full-screen menus · mono: technical bars */
    look: 'pill' | 'icon' | 'row' | 'big' | 'mono'
    colors: { text: string, muted: string, hover: string, accent: string, border?: string }
    className?: string
}) => {
    const lib = useAssetLibraryButton()
    const title = lib.isPrivate ? `${lib.label} (só visível para a equipa: ainda não é pública)` : lib.label
    const lock = lib.isPrivate && <Lock className="w-3 h-3 opacity-60 shrink-0" aria-hidden />
    const hover = {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = colors.hover },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = 'transparent' },
    }
    const click = (e: React.MouseEvent) => { e.stopPropagation(); lib.open() }

    if (look === 'icon') {
        return (
            <button type="button" onClick={click} title={title} aria-label={lib.label} {...hover}
                className={cn("relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors", className)} style={{ color: colors.muted }}>
                <FolderOpen className="w-4 h-4" />
                {lib.isPrivate && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />}
            </button>
        )
    }
    if (look === 'row') {
        return (
            <button type="button" onClick={click} title={title} {...hover}
                className={cn("w-full flex items-center gap-3 rounded-xl px-3 h-10 text-[14px] text-left transition-colors", className)} style={{ color: colors.text }}>
                <FolderOpen className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                <span className="truncate">{lib.label}</span>
                {lock}
            </button>
        )
    }
    if (look === 'big') {
        return (
            <button type="button" onClick={click} title={title}
                className={cn("text-left text-[32px] leading-[1.25] tracking-tight flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity", className)} style={{ color: colors.text }}>
                <FolderOpen className="w-7 h-7" style={{ color: colors.accent }} strokeWidth={1.5} /> {lib.label}
            </button>
        )
    }
    if (look === 'mono') {
        return (
            <button type="button" onClick={click} title={title} {...hover}
                className={cn("h-10 px-3.5 rounded-full flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase shrink-0 transition-colors", className)} style={{ color: colors.muted }}>
                <FolderOpen className="w-3.5 h-3.5" /> {lib.label} {lock}
            </button>
        )
    }
    return (
        <button type="button" onClick={click} title={title} {...hover}
            className={cn("h-9 px-3.5 rounded-full flex items-center gap-2 text-[14px] font-medium whitespace-nowrap shrink-0 border transition-colors", className)}
            style={{ color: colors.text, borderColor: colors.border || 'currentColor' }}>
            <FolderOpen className="w-4 h-4" style={{ color: colors.accent }} /> {lib.label} {lock}
        </button>
    )
}
