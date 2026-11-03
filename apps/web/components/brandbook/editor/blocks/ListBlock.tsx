"use client"

import React from "react"
import { createPortal } from "react-dom"
import { Check, X, Plus } from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { useBrandDesignOptional } from "../BrandDesignContext"
import { FloatingPanel } from "../FloatingPanel"
import { AnimationPanel } from "../AnimationPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { ListSettingsPanel } from "./ListSettingsPanel"
import { useGoogleFont } from "./BlockUtils"
import { toast } from "sonner"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"
import { dividerCss, isNumbered, listBoxStyle, markerText, resolveListSettings, type ListSettings } from "./listStyle"

interface ListBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    /** Opens the editor's animation panel (brandbook) */
    onAnimate?: () => void
    /** The block opens its own animation panel (editors without a shared one, like the proposal editor) */
    ownAnimationPanel?: boolean
    align?: 'left' | 'center' | 'right'
    isFreeFlow?: boolean
    /** Body text style of the editor without a brandbook design (the proposal's «Body»): font and colour by default */
    bodyStyle?: { font?: string, color?: string } | null
    /** Uploads the picture of an «image» marker (the proposal editor); the brandbook uses the brand's storage */
    uploadImage?: (file: File) => Promise<string | null>
}

type Item = { text: string, description?: string, type?: 'do' | 'dont' | 'default' }

/** Text field that grows with its text (items wrap over several lines) */
const AutoText = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function AutoText({ value, style, className, ...rest }, ref) {
    const inner = React.useRef<HTMLTextAreaElement | null>(null)
    React.useLayoutEffect(() => {
        const el = inner.current
        if (!el) return
        el.style.height = '0px'
        el.style.height = `${el.scrollHeight}px`
    })
    return (
        <textarea
            ref={(el) => { inner.current = el; if (typeof ref === 'function') ref(el); else if (ref) ref.current = el }}
            rows={1}
            value={value}
            spellCheck={false}
            className={cn("block w-full resize-none overflow-hidden bg-transparent border-0 outline-none p-0 m-0 shadow-none placeholder:opacity-40", className)}
            style={{ font: 'inherit', color: 'inherit', textAlign: 'inherit', letterSpacing: 'inherit', ...style }}
            {...rest}
        />
    )
})

/** The marker of one item: a drawn dot/square, a glyph or a number, with an optional shape behind it */
const Marker = ({ s, index, labelWidth }: { s: ListSettings, index: number, labelWidth: string }) => {
    if (s.marker === 'none') return null
    const numbered = isNumbered(s.marker)
    let mark: React.ReactNode
    const dot = Math.max(4, Math.round(s.markerSize * 0.45))
    if (s.marker === 'image') {
        const size = s.markerSize
        mark = !s.markerImage
            ? <span className="block rounded-sm border border-dashed" style={{ width: size, height: size, borderColor: s.markerColor }} />
            : s.markerImageRecolor
                // One-colour icon in the marker colour: the picture is the mask
                ? <span className="block" style={{ width: size, height: size, backgroundColor: s.markerColor, WebkitMaskImage: `url("${s.markerImage}")`, maskImage: `url("${s.markerImage}")`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={s.markerImage} alt="" draggable={false} className="block object-contain select-none" style={{ width: size, height: size }} />
    }
    else if (s.marker === 'disc') mark = <span className="block rounded-full" style={{ width: dot, height: dot, backgroundColor: s.markerColor }} />
    else if (s.marker === 'circle') mark = <span className="block rounded-full" style={{ width: dot, height: dot, border: `${Math.max(1.5, dot / 5)}px solid ${s.markerColor}` }} />
    else if (s.marker === 'square') mark = <span className="block" style={{ width: dot, height: dot, backgroundColor: s.markerColor }} />
    else mark = (
        <span style={{ fontSize: s.markerSize, lineHeight: 1, color: s.markerColor, fontWeight: numbered ? s.markerWeight : undefined, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {markerText(s, index)}
        </span>
    )

    if (s.badge !== 'none') {
        return (
            <span
                className="flex items-center justify-center shrink-0"
                style={{
                    width: s.badgeSize, height: s.badgeSize, backgroundColor: s.badgeColor,
                    borderRadius: s.badge === 'circle' ? '9999px' : s.badge === 'rounded' ? Math.round(s.badgeSize * 0.25) : 0,
                }}
            >
                {mark}
            </span>
        )
    }
    return (
        <span className={cn("flex items-center shrink-0", numbered ? "justify-end" : "justify-center")} style={{ width: labelWidth }}>
            {mark}
        </span>
    )
}

export const ListBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate, ownAnimationPanel, align, bodyStyle, uploadImage }: ListBlockProps) => {
    const design = useBrandDesignOptional()
    const body = design?.getStyleById('body') || bodyStyle || undefined
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = React.useState(false)
    const [showAnimation, setShowAnimation] = React.useState(false)
    const fieldRefs = React.useRef<(HTMLTextAreaElement | null)[]>([])
    const descRefs = React.useRef<(HTMLTextAreaElement | null)[]>([])
    const focusNext = React.useRef<number | null>(null)

    const isActive = activeBlockId === block.id
    // Marker picture: the editor's upload, else the brand's storage (brandbook)
    const brandId = (design as { brandId?: string } | undefined)?.brandId
    const uploadMarker = uploadImage || (brandId ? async (file: File) => {
        const toastId = toast.loading('A carregar a imagem…')
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('brandId', brandId)
            formData.append('moduleId', block.id)
            const r = await uploadBrandbookMedia(formData)
            if (r.success && r.url) { toast.success('Imagem carregada', { id: toastId }); return r.url }
        } catch { /* reported below */ }
        toast.error('Não foi possível carregar a imagem.', { id: toastId })
        return null
    } : undefined)
    React.useEffect(() => { if (!isActive) { setShowSettings(false); setShowAnimation(false) } }, [isActive])

    const variant = block.variant // 'do-dont' or a plain list
    const savedItems: Item[] = block.content?.items || []
    // An empty list being edited shows one empty line to type in
    const items: Item[] = !isReadOnly && variant !== 'do-dont' && savedItems.length === 0 ? [{ text: '', type: 'default' }] : savedItems
    const s = resolveListSettings(block.content)
    // Fonts picked for the items / descriptions load wherever the list shows (a new tab, the shared link)
    useGoogleFont(s.fontFamily)
    useGoogleFont(s.descFontFamily)

    React.useEffect(() => {
        if (focusNext.current === null) return
        const el = fieldRefs.current[focusNext.current]
        focusNext.current = null
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    })

    const save = (patch: Record<string, unknown>) => onUpdate(block.id, { ...block.content, ...patch })
    const setItems = (next: Item[]) => save({ items: next })
    const setSettings = (patch: Partial<ListSettings>) => save({ list: { ...(block.content?.list || {}), ...patch } })

    const updateDescription = (index: number, description: string) => setItems(items.map((it, i) => i === index ? { ...it, description } : it))
    const updateItem = (index: number, text: string) => setItems(items.map((it, i) => i === index ? { ...it, text } : it))
    const insertAfter = (index: number, type: Item['type'] = 'default') => {
        const next = [...items]
        next.splice(index + 1, 0, { text: '', type })
        focusNext.current = index + 1
        setItems(next)
    }
    const removeItem = (index: number) => {
        focusNext.current = Math.max(0, index - 1)
        setItems(items.filter((_, i) => i !== index))
    }

    // ---- Look
    const fontFamily = s.fontFamily || body?.font
    const textStyle: React.CSSProperties = {
        fontFamily: fontFamily ? `'${fontFamily}', sans-serif` : undefined,
        fontSize: s.textSize,
        fontWeight: s.textWeight,
        lineHeight: s.lineHeight,
        fontStyle: s.italic ? 'italic' : undefined,
        color: s.textColor || body?.color || undefined,
        textAlign: s.textAlign || align || 'left',
    }
    // The description under each item: its own type, falling back to the item's font
    const descFont = s.descFontFamily || s.fontFamily || body?.font
    const descStyle: React.CSSProperties = {
        fontFamily: descFont ? `'${descFont}', sans-serif` : undefined,
        fontSize: s.descSize,
        fontWeight: s.descWeight,
        lineHeight: s.descLineHeight,
        fontStyle: s.descItalic ? 'italic' : 'normal',
        // No colour of its own: the item colour, a little lighter
        color: s.descColor || undefined,
        opacity: s.descColor ? undefined : 0.75,
    }
    const lineBox = s.textSize * s.lineHeight
    const markerBox = s.marker === 'none' ? 0 : s.badge !== 'none' ? s.badgeSize : lineBox
    // Marker centred on the first line: whichever is taller (marker shape or line) sets the row, the other is centred in it
    const centred = s.markerAlign === 'center'
    const markerTop = centred ? Math.max(0, (lineBox - markerBox) / 2) : 0
    const textTop = centred ? Math.max(0, (markerBox - lineBox) / 2) : 0
    // Numbers line up on their right edge: the marker column is as wide as the longest number
    const longest = items.reduce((m, _, i) => Math.max(m, markerText(s, i).length), 1)
    const labelWidth = isNumbered(s.marker) ? `${Math.max(1, longest) * 0.62 * s.markerSize}px` : `${Math.max(s.markerSize, 8)}px`
    const cols = Math.max(1, Math.min(4, s.columns || 1))
    const rows = Math.ceil(items.length / cols)
    const half = s.itemSpacing / 2

    const editable = !isReadOnly
    const showChrome = editable && (hovered || isActive) && !showSettings

    const renderList = () => (
        <ol
            className="list-none m-0 w-full"
            style={{
                ...listBoxStyle(s),
                paddingLeft: (s.padding || 0) + (s.indent || 0) || undefined,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                columnGap: s.columnGap,
                rowGap: s.dividers ? 0 : s.itemSpacing,
                ...textStyle,
            }}
        >
            {items.map((item, i) => {
                const row = Math.floor(i / cols)
                const line = dividerCss(s)
                // Lines between rows (and above the first / under the last row when asked)
                const lineTop = s.dividers && s.dividerEnds && row === 0 ? line : undefined
                const lineBottom = s.dividers && (row < rows - 1 || s.dividerEnds) ? line : undefined
                const pad: React.CSSProperties = s.dividers ? { paddingTop: half, paddingBottom: half } : {}
                const lineStyle: React.CSSProperties = { borderTop: lineTop, borderBottom: lineBottom }
                return (
                    <li key={i} className="group/item relative flex items-start min-w-0" style={{ gap: s.marker === 'none' ? 0 : s.markerGap, ...(s.dividerInset ? {} : lineStyle) }}>
                        {s.marker !== 'none' && (
                            <span className="shrink-0 flex" style={{ ...pad, paddingTop: (s.dividers ? half : 0) + markerTop }}>
                                <span className="flex items-center" style={{ height: centred ? Math.max(markerBox, 0) || undefined : undefined }}>
                                    <Marker s={s} index={i} labelWidth={labelWidth} />
                                </span>
                            </span>
                        )}
                        <div className="flex-1 min-w-0" style={{ ...pad, paddingTop: (s.dividers ? half : 0) + textTop, ...(s.dividerInset ? lineStyle : {}) }}>
                            {editable ? (
                                <AutoText
                                    ref={(el) => { fieldRefs.current[i] = el }}
                                    value={item.text}
                                    placeholder="Item da lista"
                                    onFocus={() => onSelect?.(block.id)}
                                    onChange={(e) => {
                                        if (savedItems.length === 0) setItems([{ text: e.target.value, type: 'default' }])
                                        else updateItem(i, e.target.value)
                                    }}
                                    onKeyDown={(e) => {
                                        // Enter: to the description (when shown) or a new item · Backspace on an empty item: remove it
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            if (s.showDescriptions && descRefs.current[i]) descRefs.current[i]!.focus()
                                            else insertAfter(i)
                                        }
                                        else if (e.key === 'Backspace' && !item.text && !item.description && items.length > 1) { e.preventDefault(); removeItem(i) }
                                    }}
                                />
                            ) : (
                                <span className="block whitespace-pre-wrap break-words">{item.text}</span>
                            )}
                            {s.showDescriptions && (editable || item.description) && (
                                <div style={{ ...descStyle, marginTop: s.descGap }}>
                                    {editable ? (
                                        <AutoText
                                            ref={(el) => { descRefs.current[i] = el }}
                                            value={item.description || ''}
                                            placeholder="Descrição do item"
                                            onFocus={() => onSelect?.(block.id)}
                                            onChange={(e) => {
                                                if (savedItems.length === 0) setItems([{ text: '', description: e.target.value, type: 'default' }])
                                                else updateDescription(i, e.target.value)
                                            }}
                                            onKeyDown={(e) => {
                                                // Enter: a new item · Backspace on an empty description: back to the item
                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); insertAfter(i) }
                                                else if (e.key === 'Backspace' && !item.description) { e.preventDefault(); const t = fieldRefs.current[i]; if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length) } }
                                            }}
                                        />
                                    ) : (
                                        <span className="block whitespace-pre-wrap break-words">{item.description}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        {editable && items.length > 1 && (
                            <button
                                type="button"
                                title="Remover item"
                                onClick={(e) => { e.stopPropagation(); setItems(items.filter((_, idx) => idx !== i)) }}
                                className="absolute -right-7 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-[#FF0054] opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </li>
                )
            })}
        </ol>
    )

    // ---- «Fazer e Não fazer»: two columns of ticks and crosses
    const renderDoDont = () => {
        const column = (kind: 'do' | 'dont') => {
            const good = kind === 'do'
            const Icon = good ? Check : X
            return (
                <div className={cn("p-6 rounded-lg border", good ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100")}>
                    <h3 className={cn("font-bold mb-4 flex items-center gap-2", good ? "text-green-700" : "text-red-700")}>
                        <span className={cn("p-1 rounded", good ? "bg-green-100" : "bg-red-100")}><Icon className="w-4 h-4" /></span> {good ? 'FAZER' : 'NÃO FAZER'}
                    </h3>
                    <div className="flex flex-col" style={{ gap: s.itemSpacing }}>
                        {items.map((item, idx) => item.type !== kind ? null : (
                            <div key={idx} className="group/item flex gap-2 items-start">
                                <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", good ? "text-green-500" : "text-red-500")} />
                                {editable ? (
                                    <AutoText
                                        value={item.text}
                                        placeholder={good ? 'O que fazer…' : 'O que evitar…'}
                                        onFocus={() => onSelect?.(block.id)}
                                        onChange={(e) => updateItem(idx, e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); insertAfter(idx, kind) } }}
                                    />
                                ) : <span className="whitespace-pre-wrap break-words">{item.text}</span>}
                                {editable && (
                                    <button type="button" title="Remover" onClick={(e) => { e.stopPropagation(); setItems(items.filter((_, i) => i !== idx)) }} className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-[#FF0054]">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {editable && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setItems([...items, { text: '', type: kind }]); focusNext.current = null }} className={cn("self-start text-xs flex items-center gap-1 mt-1", good ? "text-green-600" : "text-red-600")}>
                                <Plus className="w-3 h-3" /> Adicionar
                            </button>
                        )}
                    </div>
                </div>
            )
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={textStyle}>
                {column('do')}
                {column('dont')}
            </div>
        )
    }

    const actions = {
        onMove: onMove ? (dir: 'up' | 'down') => onMove(block.id, dir) : undefined,
        onCopy: onCopy ? () => onCopy(block.id) : undefined,
        onDuplicate: onDuplicate ? () => onDuplicate(block.id) : undefined,
        onDelete: onDelete ? () => { setShowSettings(false); onDelete(block.id) } : undefined,
    }
    const animate = ownAnimationPanel
        ? () => { onSelect?.(block.id); setShowSettings(false); setShowAnimation(true) }
        : onAnimate ? () => { onSelect?.(block.id); onAnimate() } : undefined

    return (
        <div
            {...(editable ? hoverBind : {})}
            className={cn("relative w-full", editable && "cursor-text")}
            onClick={(e) => { if (!editable) return; e.stopPropagation(); onSelect?.(block.id) }}
        >
            <div className={cn("w-full", editable && (hovered || isActive || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-4")}>
                {variant === 'do-dont' ? renderDoDont() : renderList()}
            </div>

            {/* Add an item: beside the last item, outside the list (never over the content after it) */}
            {editable && variant !== 'do-dont' && (hovered || isActive) && (
                <button
                    type="button"
                    title="Adicionar item (ou Enter no fim de um item)"
                    onClick={(e) => { e.stopPropagation(); insertAfter(items.length - 1) }}
                    className="absolute right-full bottom-0 mr-3 z-10 h-6 px-2 rounded-md bg-white border border-dashed border-gray-300 text-[11px] text-gray-500 hover:text-[#FF0054] hover:border-[#FF0054] flex items-center gap-1 shadow-sm whitespace-nowrap"
                >
                    <Plus className="w-3 h-3" /> Item
                </button>
            )}

            {showChrome && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label={variant === 'do-dont' ? 'Fazer e Não fazer' : 'Lista'}
                        onSettings={() => { onSelect?.(block.id); setShowAnimation(false); setShowSettings(true) }}
                        onAnimate={animate}
                        {...actions}
                    />
                </FloatingPanel>
            )}

            {editable && showSettings && (
                <FloatingPanel placement="right-start" offset={16}>
                    <ListSettingsPanel
                        settings={s}
                        onChange={setSettings}
                        onReset={() => save({ list: undefined, style: undefined })}
                        onUploadMarker={uploadMarker}
                        onClose={() => setShowSettings(false)}
                        {...actions}
                    />
                </FloatingPanel>
            )}

            {editable && ownAnimationPanel && showAnimation && typeof document !== 'undefined' && createPortal(
                <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <AnimationPanel
                        isOpen
                        onClose={() => setShowAnimation(false)}
                        initialAnimation={block.content?.animation || null}
                        onSelectAnimation={(animation) => save({ animation })}
                        animationSettings={block.content?.animationSettings}
                        onAnimationSettingsChange={(animationSettings) => save({ animationSettings })}
                        hoverEffect={block.content?.hoverEffect}
                        onHoverEffectChange={(hoverEffect) => save({ hoverEffect })}
                    />
                </div>,
                document.body
            )}
        </div>
    )
}
