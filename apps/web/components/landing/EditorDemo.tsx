'use client'

/**
 * A playable copy of the Brivio brandbook editor for the landing page, drawn like the real one (BrandbookEditor):
 * the light page menu on the left (LeftSidebar), the floating top bar (Preview / Edit, Componentes, Asset library,
 * settings), the white page with dashed sections, their pink tabs (↑ ↓ ⚡ · Editar secção) and the «Edit section»
 * panel, the «+ Add Section» dividers, the dark text toolbar and the components library.
 * Nothing is saved; it only shows how the editor works.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bell, Bold, BookmarkPlus, Clock, Copy, Home, Italic,
    Monitor, Paintbrush, Plus, Search, SlidersHorizontal, Smartphone, Strikethrough, Trash2, Underline, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------------------------

type Kind = 'cover' | 'text' | 'logo' | 'palette' | 'type' | 'quote' | 'values' | 'imageText'
type Bg = 'white' | 'soft' | 'dark' | 'primary'
type TextStyle = { size?: number, bold?: boolean, italic?: boolean, underline?: boolean, strike?: boolean, align?: 'left' | 'center' | 'right', color?: string, hidden?: boolean }
type Section = {
    id: string
    kind: Kind
    bg: Bg
    padding: number
    align: 'left' | 'center' | 'right'
    texts: Record<string, string>
    styles: Record<string, TextStyle>
}
type Page = { id: string, title: string, category: string }
type Brand = { name: string, primary: string, secondary: string, font: number }
type Doc = { brand: Brand, pages: Page[], content: Record<string, Section[]> }

const KIND_LABEL: Record<Kind, string> = {
    cover: 'Capa', text: 'Título e texto', logo: 'Logótipo', palette: 'Paleta de cores', type: 'Tipografia',
    quote: 'Citação', values: 'Valores', imageText: 'Imagem e texto',
}

const FONTS = [
    { name: 'Inter Tight', css: 'var(--font-inter-tight), Inter, system-ui, sans-serif' },
    { name: 'Georgia', css: 'Georgia, "Times New Roman", serif' },
    { name: 'Mono', css: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
]
const PRIMARIES = ['#FF0054', '#2457FF', '#0E8A5F', '#F59E0B', '#7C3AED', '#111216']
const SECONDARIES = ['#311C99', '#06D6A0', '#FFB4C8', '#0B1B3F', '#F4E9D8', '#88007F']
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64]

const CATEGORIES = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'visual', label: 'Identidade visual' },
    { id: 'verbal', label: 'Identidade verbal' },
    { id: 'others', label: 'Outras páginas' },
]

let seq = 0
const uid = () => `s${++seq}-${Math.random().toString(36).slice(2, 6)}`

const DEFAULT_TEXTS: Record<Kind, Record<string, string>> = {
    cover: { eyebrow: 'Guia de marca · 2026', subtitle: 'Tudo o que precisas para usar a marca da forma certa.' },
    text: { title: 'Introdução', body: 'Este guia reúne os elementos que dão forma à marca e as regras para os usar com consistência.' },
    logo: { title: 'Logótipo', body: 'Respeita sempre a área de proteção à volta do logótipo.' },
    palette: { title: 'Paleta de cores' },
    type: { title: 'Tipografia', body: 'Uma família para títulos e texto corrido.' },
    quote: { quote: 'Falamos de forma simples, próxima e com confiança.' },
    values: { title: 'Tom de voz', v1: 'Claro', v2: 'Próximo', v3: 'Confiante' },
    imageText: { title: 'Fotografia', body: 'Luz natural, cores da marca e pessoas reais.' },
}

const make = (kind: Kind, over: Partial<Section> = {}): Section => ({
    id: uid(), kind, bg: 'white', padding: 40, align: 'left', texts: { ...DEFAULT_TEXTS[kind] }, styles: {}, ...over,
})

const initialDoc = (): Doc => ({
    brand: { name: 'Aurora', primary: '#FF0054', secondary: '#311C99', font: 0 },
    pages: [
        { id: 'capa', title: 'Capa', category: 'overview' },
        { id: 'logo', title: 'Logótipo', category: 'visual' },
        { id: 'cores', title: 'Cores', category: 'visual' },
        { id: 'tipografia', title: 'Tipografia', category: 'visual' },
        { id: 'voz', title: 'Tom de voz', category: 'verbal' },
    ],
    content: {
        capa: [make('cover', { bg: 'soft', padding: 56 }), make('text')],
        logo: [make('logo', { padding: 48 }), make('text', { texts: { title: 'Usos incorretos', body: 'Não estiques, não rodes e não mudes as cores do logótipo.' } })],
        cores: [make('palette', { padding: 44 }), make('quote', { bg: 'dark', texts: { quote: 'A cor principal aparece em todos os pontos de contacto.' } })],
        tipografia: [make('type', { padding: 48 }), make('imageText')],
        voz: [make('values', { padding: 44 }), make('quote', { bg: 'primary' })],
    },
})

const LIBRARY: Kind[] = ['cover', 'text', 'imageText', 'palette', 'type', 'logo', 'quote', 'values']

// ---------------------------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------------------------

const bgColor = (bg: Bg, brand: Brand) =>
    bg === 'white' ? '#FFFFFF' : bg === 'dark' ? '#111216' : bg === 'primary' ? brand.primary : `color-mix(in srgb, ${brand.primary} 9%, #FFFFFF)`
const isDarkBg = (bg: Bg, brand: Brand) => bg === 'dark' || (bg === 'primary' && !['#F59E0B', '#F4E9D8'].includes(brand.primary))

// ---------------------------------------------------------------------------------------------
// Text block: selectable, edited in place, with the editor's dark text toolbar
// ---------------------------------------------------------------------------------------------

const ToolBtn = ({ active, title, onClick, children }: { active?: boolean, title: string, onClick: () => void, children: React.ReactNode }) => (
    <button
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className={cn('w-6 h-6 rounded flex items-center justify-center transition-colors', active ? 'text-[#FF0054]' : 'text-gray-300 hover:text-white')}
    >
        {children}
    </button>
)

const TextToolbar = ({ style, baseSize, brand, onStyle, onDelete }: {
    style: TextStyle, baseSize: number, brand: Brand, onStyle: (s: TextStyle) => void, onDelete: () => void,
}) => {
    const [menu, setMenu] = useState<null | 'size' | 'color'>(null)
    const size = style.size ?? baseSize
    return (
        <div
            className="absolute bottom-full left-0 mb-2.5 z-40"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault() }}
        >
            <div className="relative flex items-center bg-[#15161B] rounded-[4px] px-2 py-1.5 gap-2 shadow-xl border border-[#333] whitespace-nowrap select-none">
                <div className="relative">
                    <button type="button" onClick={() => setMenu(m => m === 'size' ? null : 'size')} className="h-6 pl-1.5 pr-1 rounded flex items-center gap-1 text-[12px] font-semibold text-white hover:bg-white/5" title="Tamanho">
                        {Math.round(size)} <span className="text-[8px] text-gray-400">▼</span>
                    </button>
                    {menu === 'size' && (
                        <div className="absolute top-full left-0 mt-1.5 w-[64px] max-h-[180px] overflow-y-auto bg-[#15161B] border border-[#333] rounded-md shadow-xl p-1 z-50">
                            {SIZES.map(n => (
                                <button key={n} type="button" onClick={() => { onStyle({ ...style, size: n }); setMenu(null) }} className={cn('w-full h-6 rounded text-[12px] text-left px-2', n === Math.round(size) ? 'bg-[#FF0054] text-white' : 'text-gray-300 hover:bg-white/5')}>{n}</button>
                            ))}
                        </div>
                    )}
                </div>
                <span className="w-px h-4 bg-[#333]" />
                <div className="relative">
                    <ToolBtn title="Cor" active={!!style.color} onClick={() => setMenu(m => m === 'color' ? null : 'color')}><Paintbrush className="w-3.5 h-3.5" /></ToolBtn>
                    {menu === 'color' && (
                        <div className="absolute top-full left-0 mt-1.5 p-2 bg-[#15161B] border border-[#333] rounded-md shadow-xl z-50 flex gap-1.5">
                            {[brand.primary, brand.secondary, '#111216', '#FFFFFF'].map(c => (
                                <button key={c} type="button" title={c} onClick={() => { onStyle({ ...style, color: c }); setMenu(null) }} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />
                            ))}
                            <button type="button" title="Cor original" onClick={() => { onStyle({ ...style, color: undefined }); setMenu(null) }} className="w-5 h-5 rounded-full border border-white/30 text-[9px] text-gray-300">×</button>
                        </div>
                    )}
                </div>
                <span className="w-px h-4 bg-[#333]" />
                <ToolBtn title="Negrito" active={style.bold} onClick={() => onStyle({ ...style, bold: !style.bold })}><Bold className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn title="Itálico" active={style.italic} onClick={() => onStyle({ ...style, italic: !style.italic })}><Italic className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn title="Sublinhado" active={style.underline} onClick={() => onStyle({ ...style, underline: !style.underline })}><Underline className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn title="Rasurado" active={style.strike} onClick={() => onStyle({ ...style, strike: !style.strike })}><Strikethrough className="w-3.5 h-3.5" /></ToolBtn>
                <span className="w-px h-4 bg-[#333]" />
                <ToolBtn title="Alinhar à esquerda" active={style.align === 'left'} onClick={() => onStyle({ ...style, align: 'left' })}><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn title="Centrar" active={style.align === 'center'} onClick={() => onStyle({ ...style, align: 'center' })}><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn title="Alinhar à direita" active={style.align === 'right'} onClick={() => onStyle({ ...style, align: 'right' })}><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
                <span className="w-px h-4 bg-[#333]" />
                <ToolBtn title="Eliminar" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></ToolBtn>
                {/* Tail */}
                <span className="absolute -bottom-[6px] left-6 w-3 h-3 rotate-45 bg-[#15161B] border-r border-b border-[#333]" />
            </div>
        </div>
    )
}

type TextProps = {
    value: string
    style: TextStyle
    base: { size: number, weight?: number, color?: string, className?: string, letterSpacing?: string, lineHeight?: number | string }
    selected: boolean
    preview: boolean
    brand: Brand
    onSelect: () => void
    onChange: (v: string) => void
    onStyle: (s: TextStyle) => void
    onDelete: () => void
}

const TextBlock = ({ value, style, base, selected, preview, brand, onSelect, onChange, onStyle, onDelete }: TextProps) => {
    if (style.hidden) return null
    return (
        <div
            className={cn('relative', !preview && 'cursor-text', !preview && (selected ? 'outline outline-1 outline-[#FF0054] outline-offset-2' : 'hover:outline hover:outline-1 hover:outline-[#FF0054]/40 hover:outline-offset-2'))}
            onClick={(e) => { e.stopPropagation(); if (!preview) onSelect() }}
        >
            {selected && !preview && <TextToolbar style={style} baseSize={base.size} brand={brand} onStyle={onStyle} onDelete={onDelete} />}
            <div
                contentEditable={!preview}
                suppressContentEditableWarning
                spellCheck={false}
                onFocus={() => { if (!preview) onSelect() }}
                onBlur={(e) => { const v = e.currentTarget.innerText.trim(); if (v && v !== value) onChange(v) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur() } }}
                className={cn('outline-none', base.className)}
                style={{
                    fontSize: style.size ?? base.size,
                    fontWeight: style.bold ? 700 : base.weight,
                    fontStyle: style.italic ? 'italic' : undefined,
                    textDecoration: [style.underline && 'underline', style.strike && 'line-through'].filter(Boolean).join(' ') || undefined,
                    textAlign: style.align,
                    color: style.color ?? base.color,
                    letterSpacing: base.letterSpacing,
                    lineHeight: base.lineHeight,
                }}
            >
                {value}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Section content
// ---------------------------------------------------------------------------------------------

type T = (key: string, base: TextProps['base']) => React.ReactNode

const SectionContent = ({ s, brand, t }: { s: Section, brand: Brand, t: T }) => {
    const dark = isDarkBg(s.bg, brand)
    const muted = dark ? 'rgba(255,255,255,0.7)' : 'rgba(17,18,22,0.62)'
    const accent = s.bg === 'primary' ? '#FFFFFF' : brand.primary
    const center = s.align === 'center'
    const items = cn('flex flex-col', center ? 'items-center' : s.align === 'right' ? 'items-end' : 'items-start')

    switch (s.kind) {
        case 'cover': return (
            <div className={cn(items, 'gap-4')}>
                {t('eyebrow', { size: 10, color: muted, className: 'uppercase tracking-[0.22em]' })}
                <span className="block w-12 h-12 rounded-full" style={{ border: `9px solid ${accent}`, transition: 'border-color .4s ease' }} />
                <span className="block font-semibold leading-[0.95]" style={{ fontSize: 54, letterSpacing: '-0.035em' }}>{brand.name || 'A tua marca'}</span>
                {t('subtitle', { size: 14, color: muted, className: 'max-w-[360px]' })}
            </div>
        )
        case 'text': return (
            <div className={cn(items, 'gap-3')}>
                {t('title', { size: 24, weight: 600, letterSpacing: '-0.02em' })}
                {t('body', { size: 14, color: muted, className: 'max-w-[460px]', lineHeight: 1.6 })}
            </div>
        )
        case 'logo': return (
            <div className={cn(items, 'gap-5')}>
                {t('title', { size: 22, weight: 600, letterSpacing: '-0.02em' })}
                <div className="self-stretch rounded-xl border border-dashed flex items-center justify-center py-10" style={{ borderColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(17,18,22,0.18)' }}>
                    <span className="flex items-center gap-1.5 font-semibold" style={{ fontSize: 40, letterSpacing: '-0.04em' }}>
                        {brand.name || 'Marca'}
                        <span className="inline-block rounded-full -translate-y-3" style={{ width: 14, height: 14, border: `3.5px solid ${accent}` }} />
                    </span>
                </div>
                {t('body', { size: 12.5, color: muted })}
            </div>
        )
        case 'palette': return (
            <div className="flex flex-col gap-4">
                {t('title', { size: 22, weight: 600, letterSpacing: '-0.02em' })}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[{ c: brand.primary, n: 'Principal' }, { c: brand.secondary, n: 'Secundária' }, { c: '#111216', n: 'Texto' }, { c: '#F4F4F1', n: 'Fundo' }].map(x => (
                        <div key={x.n} className="rounded-lg overflow-hidden border border-black/5 text-left">
                            <div className="h-16" style={{ background: x.c, transition: 'background-color .4s ease' }} />
                            <div className="px-2.5 py-2 bg-white text-[#111216]" style={{ fontFamily: 'ui-monospace, monospace' }}>
                                <p className="text-[10px] font-semibold">{x.n}</p>
                                <p className="text-[10px] opacity-60">{x.c}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
        case 'type': return (
            <div className={cn(items, 'gap-4')}>
                {t('title', { size: 22, weight: 600, letterSpacing: '-0.02em' })}
                <div className="flex items-end gap-6">
                    <span className="font-semibold leading-[0.8]" style={{ fontSize: 92, color: accent }}>Aa</span>
                    <div className="text-left text-[11px] leading-relaxed pb-1" style={{ color: muted }}>
                        <p>ABCDEFGHIJKLM</p><p>abcdefghijklm</p><p>0123456789 &amp;?!</p>
                    </div>
                </div>
                {t('body', { size: 12.5, color: muted })}
            </div>
        )
        case 'quote': return (
            <div className={cn(items, 'gap-3')}>
                <span className="block font-semibold leading-none" style={{ fontSize: 44, color: accent }}>“</span>
                {t('quote', { size: 22, weight: 500, letterSpacing: '-0.015em', className: 'max-w-[520px]', lineHeight: 1.3 })}
            </div>
        )
        case 'values': return (
            <div className="flex flex-col gap-4">
                {t('title', { size: 22, weight: 600, letterSpacing: '-0.02em' })}
                <div className="grid grid-cols-3 gap-2.5">
                    {['v1', 'v2', 'v3'].map((key, i) => (
                        <div key={key} className="rounded-lg p-3.5 text-left" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,18,22,0.04)' }}>
                            <span className="block text-[10px] font-semibold mb-6" style={{ color: accent }}>0{i + 1}</span>
                            {t(key, { size: 15, weight: 600 })}
                        </div>
                    ))}
                </div>
            </div>
        )
        case 'imageText': return (
            <div className="grid grid-cols-[1.1fr_1fr] gap-5 items-center text-left">
                <div className="aspect-[4/3] rounded-xl" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`, transition: 'background .4s ease' }} />
                <div className="flex flex-col gap-2.5">
                    {t('title', { size: 20, weight: 600, letterSpacing: '-0.02em' })}
                    {t('body', { size: 12.5, color: muted, lineHeight: 1.6 })}
                </div>
            </div>
        )
    }
}

/** Small schematic of a section kind, for the library cards */
const KindThumb = ({ kind, brand }: { kind: Kind, brand: Brand }) => {
    const p = brand.primary
    return (
        <div className="aspect-[4/3] rounded-lg overflow-hidden p-3 flex flex-col gap-1.5" style={{ background: kind === 'cover' ? `color-mix(in srgb, ${p} 10%, #fff)` : kind === 'quote' ? '#111216' : '#FFFFFF' }}>
            {kind === 'cover' && <><span className="w-5 h-5 rounded-full mt-auto" style={{ border: `4px solid ${p}` }} /><span className="h-3 w-2/3 rounded-sm bg-[#111216]" /><span className="h-1.5 w-1/2 rounded-sm bg-black/20" /></>}
            {kind === 'text' && <><span className="h-2.5 w-1/2 rounded-sm bg-[#111216]" /><span className="h-1.5 w-5/6 rounded-sm bg-black/15" /><span className="h-1.5 w-2/3 rounded-sm bg-black/15" /></>}
            {kind === 'imageText' && <div className="flex gap-2 h-full"><span className="flex-1 rounded" style={{ background: `linear-gradient(135deg, ${p}, ${brand.secondary})` }} /><span className="flex-1 flex flex-col gap-1.5 justify-center"><span className="h-2 w-full rounded-sm bg-[#111216]" /><span className="h-1.5 w-4/5 rounded-sm bg-black/15" /></span></div>}
            {kind === 'palette' && <><span className="h-2 w-1/3 rounded-sm bg-[#111216]" /><div className="grid grid-cols-4 gap-1 flex-1">{[p, brand.secondary, '#111216', '#EEE'].map((c, i) => <span key={i} className="rounded" style={{ background: c }} />)}</div></>}
            {kind === 'type' && <><span className="h-2 w-1/3 rounded-sm bg-[#111216]" /><span className="text-[28px] font-semibold leading-none mt-auto" style={{ color: p }}>Aa</span></>}
            {kind === 'logo' && <div className="flex-1 border border-dashed border-black/20 rounded flex items-center justify-center"><span className="text-[12px] font-semibold text-[#111216]">{brand.name || 'Marca'}</span></div>}
            {kind === 'quote' && <><span className="text-[20px] leading-none font-semibold" style={{ color: p }}>“</span><span className="h-2 w-5/6 rounded-sm bg-white/80" /><span className="h-2 w-2/3 rounded-sm bg-white/80" /></>}
            {kind === 'values' && <><span className="h-2 w-1/3 rounded-sm bg-[#111216]" /><div className="grid grid-cols-3 gap-1 flex-1">{[0, 1, 2].map(i => <span key={i} className="rounded bg-black/[0.05]" />)}</div></>}
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// The editor's dark panel pieces («Edit section»)
// ---------------------------------------------------------------------------------------------

const PanelLabel = ({ children }: { children: React.ReactNode }) => <span className="text-[#97A1B3] text-[0.75rem] font-medium">{children}</span>

const Segment = <V extends string | number>({ options, value, onChange }: { options: { v: V, label: React.ReactNode, title?: string }[], value: V, onChange: (v: V) => void }) => (
    <div className="flex gap-1 w-full bg-[#15161B] rounded-[4px] p-1">
        {options.map(o => (
            <button
                key={String(o.v)}
                type="button"
                title={o.title}
                onClick={() => onChange(o.v)}
                className={cn('flex-1 h-[30px] flex items-center justify-center gap-1.5 rounded-[2px] text-[11px] font-medium transition-colors', value === o.v ? 'bg-[#FF0054] text-white' : 'text-[#97A1B3] hover:text-white hover:bg-[#2A2B35]')}
            >
                {o.label}
            </button>
        ))}
    </div>
)

const DarkPanel = ({ title, onClose, children, className }: { title: string, onClose: () => void, children: React.ReactNode, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className={cn('w-[260px] bg-[#1F1F25] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/10 cursor-default text-left', className)}
    >
        <div className="h-[52px] bg-[#FF0054] px-5 flex items-center justify-between shrink-0">
            <span className="text-white font-semibold text-[15px]">{title}</span>
            <button type="button" onClick={onClose} aria-label="Fechar" className="w-[18px] h-[18px] bg-black rounded-full hover:opacity-80 transition-opacity" />
        </div>
        <div className="p-5 flex flex-col gap-5 max-h-[330px] overflow-y-auto custom-scrollbar">{children}</div>
    </motion.div>
)

// ---------------------------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------------------------

const HISTORY = 40
type Selection = { section: string, key: string } | null

export default function EditorDemo() {
    // The document with its undo / redo stacks
    const [hist, setHist] = useState<{ past: Doc[], doc: Doc, future: Doc[] }>(() => ({ past: [], doc: initialDoc(), future: [] }))
    const doc = hist.doc
    const [pageId, setPageId] = useState('capa')
    const [textSel, setTextSel] = useState<Selection>(null)
    const [editSection, setEditSection] = useState<string | null>(null)
    const [preview, setPreview] = useState(false)
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
    const [deviceMenu, setDeviceMenu] = useState(false)
    const [library, setLibrary] = useState<{ at: number } | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [notice, setNotice] = useState<string | null>(null)
    const canvasRef = useRef<HTMLDivElement>(null)

    const commit = useCallback((change: (d: Doc) => Doc) => {
        setHist(h => {
            const next = change(h.doc)
            return next === h.doc ? h : { past: [...h.past.slice(-(HISTORY - 1)), h.doc], doc: next, future: [] }
        })
    }, [])
    const undo = useCallback(() => setHist(h => h.past.length ? { past: h.past.slice(0, -1), doc: h.past[h.past.length - 1], future: [...h.future, h.doc] } : h), [])
    const redo = useCallback(() => setHist(h => h.future.length ? { past: [...h.past, h.doc], doc: h.future[h.future.length - 1], future: h.future.slice(0, -1) } : h), [])

    const sections = doc.content[pageId] || []
    const updateSections = (fn: (list: Section[]) => Section[]) => commit(d => ({ ...d, content: { ...d.content, [pageId]: fn(d.content[pageId] || []) } }))
    const updateSection = (id: string, patch: Partial<Section>) => updateSections(list => list.map(s => s.id === id ? { ...s, ...patch } : s))
    const setBrand = (patch: Partial<Brand>) => commit(d => ({ ...d, brand: { ...d.brand, ...patch } }))

    const clearSelection = () => { setTextSel(null); setEditSection(null) }
    const move = (id: string, dir: -1 | 1) => updateSections(list => {
        const i = list.findIndex(s => s.id === id), j = i + dir
        if (i < 0 || j < 0 || j >= list.length) return list
        const next = [...list];[next[i], next[j]] = [next[j], next[i]]
        return next
    })
    const duplicate = (id: string) => updateSections(list => {
        const i = list.findIndex(s => s.id === id)
        if (i < 0) return list
        const next = [...list]; next.splice(i + 1, 0, { ...list[i], id: uid(), texts: { ...list[i].texts }, styles: { ...list[i].styles } }); return next
    })
    const remove = (id: string) => { updateSections(list => list.filter(s => s.id !== id)); clearSelection() }
    const insert = (kind: Kind, at: number) => {
        const s = make(kind)
        updateSections(list => { const next = [...list]; next.splice(Math.min(at, next.length), 0, s); return next })
        setLibrary(null)
        window.setTimeout(() => canvasRef.current?.querySelector(`[data-demo-section="${s.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
    }
    const addPage = () => {
        const id = uid()
        commit(d => ({ ...d, pages: [...d.pages, { id, title: 'Nova página', category: 'others' }], content: { ...d.content, [id]: [] } }))
        setPageId(id); clearSelection()
    }
    const flash = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(n => n === text ? null : n), 2400) }

    const togglePreview = (next: boolean) => { setPreview(next); if (next) { clearSelection(); setLibrary(null); setSettingsOpen(false) } }

    const onKeyDown = (e: React.KeyboardEvent) => {
        const el = e.target as HTMLElement
        const typing = el.isContentEditable || el.tagName === 'INPUT'
        const mod = e.ctrlKey || e.metaKey
        if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
        else if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo() }
        else if (e.key === 'Escape') { clearSelection(); setLibrary(null); setSettingsOpen(false) }
    }

    const pagesByCategory = useMemo(() => {
        const q = search.trim().toLowerCase()
        return CATEGORIES.map(c => ({ ...c, pages: doc.pages.filter(p => p.category === c.id && (!q || p.title.toLowerCase().includes(q))) }))
            .filter(c => c.pages.length > 0)
    }, [doc.pages, search])

    const font = FONTS[doc.brand.font].css
    const current = sections.find(s => s.id === editSection) || null

    return (
        <div
            onKeyDown={onKeyDown}
            className="relative rounded-[14px] overflow-hidden bg-white border border-black/10 shadow-[0_40px_120px_rgba(15,16,20,0.30)] text-left select-none flex h-[560px] md:h-[640px]"
            style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
        >
            {/* ---------- Pages menu (LeftSidebar) ---------- */}
            <aside className={cn('hidden md:flex w-[232px] shrink-0 flex-col bg-[#F4F4F4] text-black transition-opacity', preview && 'opacity-90')}>
                <div className="pt-7 pb-5 flex justify-center">
                    <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/20 bg-gradient-to-br from-[#FF0054] via-[#88007F] to-[#311C99]">
                        {(doc.brand.name || 'A').charAt(0).toUpperCase()}
                    </div>
                </div>
                <div className="px-3.5 pb-3.5 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Pesquisar"
                            className="w-full bg-[#EAEAEA] rounded-md py-1.5 pl-8 pr-2 text-[13px] placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-[#FF0054] select-text"
                        />
                    </div>
                    {!preview && (
                        <button type="button" onClick={addPage} title="Adicionar páginas" className="w-8 h-8 flex items-center justify-center bg-[#FF0054] hover:bg-[#E60049] rounded-md transition-colors">
                            <Plus className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto px-2.5 space-y-2 custom-scrollbar">
                    {pagesByCategory.map(c => (
                        <div key={c.id}>
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[12px] font-semibold opacity-90">
                                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-current text-black/60"><path d="M1,3 L9,3 L5,7 Z" /></svg>
                                {c.label}
                            </div>
                            {c.pages.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => { setPageId(p.id); clearSelection(); canvasRef.current?.scrollTo({ top: 0 }) }}
                                    className={cn('w-full text-left py-1.5 pr-3 pl-7 text-[13.5px] min-h-[30px] transition-colors', p.id === pageId ? 'text-[#ff0054] font-bold' : 'text-black hover:text-black/70')}
                                >
                                    {p.title}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="p-3.5 border-t border-[#EBEBEB] flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1E1F24] to-[#2D3039] text-white text-[11px] font-bold flex items-center justify-center">T</div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-medium">Tu</span>
                        <span className="text-[10px] opacity-60">Editor</span>
                    </div>
                </div>
            </aside>

            {/* ---------- Main area ---------- */}
            <div className="relative flex-1 min-w-0 flex flex-col bg-white">
                {/* Top bar (floating capsules) */}
                <div className="absolute top-3 right-3 md:right-4 z-30 flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="h-11 bg-[#111116] pl-4 pr-4 rounded-full flex items-center shadow-2xl border border-[#222] text-[13px] font-medium">
                        <div className="relative" onMouseEnter={() => setDeviceMenu(true)} onMouseLeave={() => setDeviceMenu(false)}>
                            <button type="button" className="text-[#888] hover:text-white transition-colors p-1 pr-2.5" aria-label="Dispositivo">
                                {device === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                            </button>
                            {deviceMenu && (
                                <>
                                    <div className="absolute top-full left-0 w-full h-3" />
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[130px] bg-[#1A1A1F] border border-[#333] rounded-lg shadow-xl z-50 py-1.5">
                                        {([{ v: 'desktop', l: 'Desktop', I: Monitor }, { v: 'mobile', l: 'Mobile', I: Smartphone }] as const).map(o => (
                                            <button key={o.v} type="button" onClick={() => { setDevice(o.v); setDeviceMenu(false) }} className={cn('w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-[#2A2A30] text-left text-[13px]', device === o.v ? 'text-white' : 'text-[#888]')}>
                                                <o.I className="w-4 h-4" />{o.l}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <span className="h-4 w-px bg-[#333] mr-2.5" />
                        <button type="button" onClick={() => togglePreview(true)} className={cn('transition-colors', preview ? 'text-white' : 'text-[#555]')}>Preview</button>
                        <button type="button" onClick={() => togglePreview(!preview)} aria-label="Alternar pré-visualização" className="mx-2.5 w-[44px] h-[24px] bg-[#222] rounded-full relative">
                            <span className={cn('absolute top-[2px] w-[20px] h-[20px] bg-[#333] rounded-full shadow-sm transition-all duration-300', preview ? 'left-[2px]' : 'left-[22px]')} />
                        </button>
                        <button type="button" onClick={() => togglePreview(false)} className={cn('transition-colors', !preview ? 'text-white' : 'text-[#555]')}>Edit</button>
                        <span className="hidden sm:block h-4 w-px bg-[#333] mx-4" />
                        <button type="button" onClick={() => !preview && setLibrary({ at: sections.length })} className="hidden sm:block text-[#888] hover:text-white transition-colors mr-4">Componentes</button>
                        <button type="button" onClick={() => flash('A Asset library guarda os ficheiros da marca: logótipos, imagens e documentos.')} className="hidden sm:block text-[#888] hover:text-white transition-colors">Asset library</button>
                    </div>
                    <div className="hidden lg:flex h-11 bg-[#111116] px-3.5 rounded-full items-center gap-4 shadow-2xl border border-[#222]">
                        <button type="button" title="Histórico" onClick={() => flash('Ctrl+Z desfaz e Ctrl+Shift+Z refaz qualquer alteração.')} className="text-[#888] hover:text-white"><Clock className="w-[18px] h-[18px]" /></button>
                        <button type="button" title="Definições da marca" onClick={() => setSettingsOpen(o => !o)} className={cn('hover:text-white', settingsOpen ? 'text-white' : 'text-[#888]')}><SlidersHorizontal className="w-[18px] h-[18px]" /></button>
                        <button type="button" title="Notificações" onClick={() => flash('Recebes aqui os comentários e as alterações da equipa.')} className="text-[#888] hover:text-white"><Bell className="w-[18px] h-[18px]" /></button>
                        <button type="button" title="Dashboard" onClick={() => flash('O Dashboard reúne todas as tuas marcas e projetos.')} className="text-[#888] hover:text-white"><Home className="w-[18px] h-[18px]" /></button>
                        <button type="button" title="Salvar como Template" onClick={() => flash('Guarda este brandbook como template para o reutilizar.')} className="text-[#888] hover:text-[#FF0054]"><BookmarkPlus className="w-[18px] h-[18px]" /></button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF0054] to-[#88007F] p-[2px]">
                            <div className="w-full h-full rounded-full bg-[#111116] flex items-center justify-center text-[10px] font-bold text-white">T</div>
                        </div>
                    </div>
                    {/* Brand settings */}
                    <AnimatePresence>
                        {settingsOpen && (
                            <div className="absolute top-full right-0 mt-2.5">
                                <DarkPanel title="Definições da marca" onClose={() => setSettingsOpen(false)}>
                                    <label className="flex flex-col gap-2">
                                        <PanelLabel>Nome da marca</PanelLabel>
                                        <input
                                            value={doc.brand.name}
                                            maxLength={16}
                                            onChange={(e) => setBrand({ name: e.target.value })}
                                            className="h-9 px-3 rounded-[4px] bg-[#15161B] border border-[#333] focus:border-[#FF0054] outline-none text-[13px] text-white select-text"
                                        />
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <PanelLabel>Cor principal</PanelLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {PRIMARIES.map(c => <button key={c} type="button" aria-label={c} onClick={() => setBrand({ primary: c })} className={cn('w-7 h-7 rounded-full border border-white/15', doc.brand.primary === c && 'ring-2 ring-white ring-offset-2 ring-offset-[#1F1F25]')} style={{ background: c }} />)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <PanelLabel>Cor secundária</PanelLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {SECONDARIES.map(c => <button key={c} type="button" aria-label={c} onClick={() => setBrand({ secondary: c })} className={cn('w-7 h-7 rounded-full border border-white/15', doc.brand.secondary === c && 'ring-2 ring-white ring-offset-2 ring-offset-[#1F1F25]')} style={{ background: c }} />)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <PanelLabel>Tipografia</PanelLabel>
                                        <Segment value={doc.brand.font} onChange={(v) => setBrand({ font: v })} options={FONTS.map((f, i) => ({ v: i, label: <span style={{ fontFamily: f.css }}>Aa</span>, title: f.name }))} />
                                    </div>
                                </DarkPanel>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Hint / notices */}
                <AnimatePresence>
                    {notice && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[90%] px-4 py-2.5 rounded-lg bg-[#111116] text-white text-[12.5px] shadow-xl">
                            {notice}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Canvas (MainCanvas) */}
                <div ref={canvasRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white" onClick={() => { clearSelection(); setLibrary(null) }}>
                    <div className={cn('mx-auto transition-all duration-500 px-5 md:px-8 pb-10', device === 'mobile' ? 'max-w-[400px]' : 'max-w-[860px]', !preview ? 'pt-[64px]' : 'pt-0')} style={{ fontFamily: font }}>
                        {sections.length === 0 && !preview && (
                            <div className="pt-10 flex flex-col items-center gap-4">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setLibrary({ at: 0 }) }} className="bg-[#FF85A1] hover:bg-[#FF7091] text-white font-semibold px-6 rounded-full h-11 text-sm" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>+ Add Section</button>
                                <p className="text-gray-400 italic text-[14px]" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>Start adding sections to build your page.</p>
                            </div>
                        )}
                        {sections.map((s, i) => {
                            const dark = isDarkBg(s.bg, doc.brand)
                            const open = editSection === s.id && !preview
                            const t: T = (key, base) => (
                                <TextBlock
                                    value={s.texts[key] ?? ''}
                                    style={s.styles[key] || {}}
                                    base={base}
                                    brand={doc.brand}
                                    preview={preview}
                                    selected={textSel?.section === s.id && textSel.key === key}
                                    onSelect={() => { setTextSel({ section: s.id, key }); setEditSection(null) }}
                                    onChange={(v) => updateSection(s.id, { texts: { ...s.texts, [key]: v } })}
                                    onStyle={(st) => updateSection(s.id, { styles: { ...s.styles, [key]: st } })}
                                    onDelete={() => { updateSection(s.id, { styles: { ...s.styles, [key]: { ...(s.styles[key] || {}), hidden: true } } }); setTextSel(null) }}
                                />
                            )
                            return (
                                <React.Fragment key={s.id}>
                                    {!preview && i === 0 && <Divider onClick={() => setLibrary({ at: 0 })} />}
                                    <motion.div
                                        layout
                                        data-demo-section={s.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className={cn('relative w-full', preview ? '' : cn('group border border-dashed mt-[30px] mb-3', open ? 'border-[#FF0054]' : 'border-gray-200 hover:border-[#FF0054]'))}
                                        style={{
                                            background: bgColor(s.bg, doc.brand),
                                            color: dark ? '#FFFFFF' : '#111216',
                                            padding: `${s.padding}px ${Math.max(24, s.padding)}px`,
                                            textAlign: s.align,
                                            transition: 'background-color .4s ease, padding .2s ease',
                                        }}
                                    >
                                        {/* Section tabs */}
                                        {!preview && (
                                            <div className={cn('absolute top-0 left-0 right-0 flex justify-between items-start z-20 px-[1px] -translate-y-full transition-opacity', open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
                                                <div className="flex gap-[1px]">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); move(s.id, -1) }} disabled={i === 0} title="Subir" className="bg-[#FF0054] text-white w-[32px] h-[26px] flex items-center justify-center disabled:opacity-50 hover:bg-[#D90046] rounded-t-[4px]"><ArrowUp className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); move(s.id, 1) }} disabled={i === sections.length - 1} title="Descer" className="bg-[#FF0054] text-white w-[32px] h-[26px] flex items-center justify-center disabled:opacity-50 hover:bg-[#D90046] rounded-t-[4px]"><ArrowDown className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); flash('Com ⚡ escolhes como a secção aparece: fade, deslizar, zoom…') }} title="Animar secção" className="bg-[#FF0054] text-white w-[32px] h-[26px] flex items-center justify-center hover:bg-[#D90046] rounded-t-[4px]"><Zap className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <div className="relative">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setTextSel(null); setEditSection(open ? null : s.id) }} className="bg-[#FF0054] text-white px-5 h-[26px] text-[10.5px] font-semibold uppercase tracking-wider hover:bg-[#D90046] rounded-t-[4px] flex items-center">
                                                        Editar secção
                                                    </button>
                                                    <AnimatePresence>
                                                        {open && current && (
                                                            <div className="absolute top-0 right-[calc(100%+4px)] z-50">
                                                                <DarkPanel title="Edit section" onClose={() => setEditSection(null)}>
                                                                    <div className="flex flex-col gap-2">
                                                                        <PanelLabel>Fundo</PanelLabel>
                                                                        <div className="flex gap-2">
                                                                            {(['white', 'soft', 'dark', 'primary'] as Bg[]).map(b => (
                                                                                <button key={b} type="button" title={{ white: 'Branco', soft: 'Suave', dark: 'Escuro', primary: 'Cor principal' }[b]} onClick={() => updateSection(current.id, { bg: b })} className={cn('flex-1 h-[35px] rounded-[2px] border transition-all', current.bg === b ? 'border-[#FF0054] shadow-[0_0_0_1px_rgba(255,0,80,0.3)]' : 'border-[#333] hover:border-[#666]')} style={{ background: bgColor(b, doc.brand) }} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <label className="flex flex-col gap-2">
                                                                        <span className="flex justify-between"><PanelLabel>Espaçamento</PanelLabel><span className="text-[11px] text-white tabular-nums">{current.padding}px</span></span>
                                                                        <input type="range" min={16} max={96} value={current.padding} onChange={(e) => updateSection(current.id, { padding: Number(e.target.value) })} className="w-full accent-[#FF0054] cursor-pointer" />
                                                                    </label>
                                                                    <div className="flex flex-col gap-2">
                                                                        <PanelLabel>Alinhamento</PanelLabel>
                                                                        <Segment
                                                                            value={current.align}
                                                                            onChange={(v) => updateSection(current.id, { align: v })}
                                                                            options={[{ v: 'left', label: <AlignLeft className="w-3.5 h-3.5" />, title: 'À esquerda' }, { v: 'center', label: <AlignCenter className="w-3.5 h-3.5" />, title: 'Ao centro' }, { v: 'right', label: <AlignRight className="w-3.5 h-3.5" />, title: 'À direita' }]}
                                                                        />
                                                                    </div>
                                                                    <div className="flex gap-2 pt-1">
                                                                        <button type="button" onClick={() => duplicate(current.id)} className="flex-1 h-8 rounded-[4px] bg-[#15161B] hover:bg-[#2A2B35] text-[11px] font-medium text-[#97A1B3] hover:text-white flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Duplicar</button>
                                                                        <button type="button" onClick={() => remove(current.id)} className="flex-1 h-8 rounded-[4px] bg-[#15161B] hover:bg-[#FF0054] text-[11px] font-medium text-[#97A1B3] hover:text-white flex items-center justify-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
                                                                    </div>
                                                                </DarkPanel>
                                                            </div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        )}
                                        <SectionContent s={s} brand={doc.brand} t={t} />
                                    </motion.div>
                                    {!preview && <Divider onClick={() => setLibrary({ at: i + 1 })} />}
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>

                {/* Components library (Componentes / + Add Section) */}
                <AnimatePresence>
                    {library && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setLibrary(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-[620px] max-h-full flex flex-col bg-[#1A1A20] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                            >
                                <div className="h-12 flex items-center justify-between px-5 bg-[#FF0054] shrink-0">
                                    <span className="text-white font-medium text-[15px]">Biblioteca de Componentes</span>
                                    <button type="button" onClick={() => setLibrary(null)} title="Fechar" className="w-4 h-4 rounded-full bg-white hover:opacity-80" />
                                </div>
                                <div className="p-4 overflow-y-auto custom-scrollbar bg-[#15161B]">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {LIBRARY.map(k => (
                                            <button key={k} type="button" onClick={() => insert(k, library.at)} className="text-left bg-[#1A1A20] border border-white/5 rounded-xl p-2 hover:border-[#FF0054] hover:shadow-[0_0_20px_rgba(255,0,84,0.1)] transition-all group">
                                                <div className="ring-1 ring-white/5 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]"><KindThumb kind={k} brand={doc.brand} /></div>
                                                <p className="text-white font-medium text-[12px] mt-2 px-0.5 truncate">{KIND_LABEL[k]}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="px-5 py-2.5 border-t border-white/5 text-[11px] text-[#666] shrink-0">No Brivio há mais de 450 secções prontas, por temas.</div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

/** «+ Add Section» between sections */
const Divider = ({ onClick }: { onClick: () => void }) => (
    <div className="relative h-4 flex items-center justify-center my-1" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-200" />
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="relative z-10 bg-[#FF0054] text-white px-3.5 py-1 rounded-full text-[11px] font-medium opacity-50 hover:opacity-100 transition-opacity"
        >
            + Add Section
        </button>
    </div>
)
