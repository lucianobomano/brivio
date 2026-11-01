"use client"

import React, { useEffect, useRef, useState } from "react"
import {
    BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Clapperboard, Grid3x3, Heart, Home, Menu, MessageCircle, MoreHorizontal,
    Music2, Plus, PlusSquare, Search, Send, UserSquare2,
} from "lucide-react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { FloatingPanel } from "../FloatingPanel"
import { BlockContextBar, useHoverIntent } from "./BlockContextBar"
import { SocialMockupPanel } from "./SocialMockupPanel"
import { defaultAvatar, readSocialMockupContent, resolveSocial, type SocialMedia, type SocialMockupContent, type SocialSettings } from "./socialMockup"

interface SocialMockupBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: Record<string, unknown>) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onMove?: (id: string, direction: 'up' | 'down') => void
    onAnimate?: () => void
}

/** Screens are drawn at 320 px wide and scaled to the block's width */
const BASE_W = 320
const BASE_H = 693

type S = Required<SocialSettings>

interface Palette { bg: string, text: string, muted: string, line: string, chip: string }
const paletteOf = (s: S): Palette => s.theme === 'dark'
    ? { bg: '#000000', text: '#F5F5F5', muted: '#A8A8A8', line: 'rgba(255,255,255,0.14)', chip: '#262626' }
    : { bg: '#FFFFFF', text: '#111111', muted: '#737373', line: 'rgba(0,0,0,0.1)', chip: '#EFEFEF' }

const Avatar = ({ s, size, ring = true }: { s: S, size: number, ring?: boolean }) => (
    <div className="rounded-full shrink-0 flex items-center justify-center" style={{ width: size, height: size, padding: ring ? 2 : 0, background: ring ? `conic-gradient(from 200deg, ${s.accent}, #FFB347, ${s.accent})` : undefined }}>
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#FFFFFF', border: ring ? '2px solid #FFFFFF' : undefined }}>
            <img src={s.avatarUrl || defaultAvatar()} alt="" className={cn("w-full h-full", s.avatarUrl ? "object-cover" : "object-contain p-[14%]")} draggable={false} />
        </div>
    </div>
)

const Handle = ({ s, size = 12, color }: { s: S, size?: number, color: string }) => (
    <span className="inline-flex items-center gap-1 font-semibold truncate" style={{ fontSize: size, color }}>
        {s.handle}
        {s.verified && <BadgeCheck className="shrink-0" style={{ width: size + 1, height: size + 1, color: '#FFFFFF', fill: '#3897F0' }} />}
    </span>
)

/** Status bar of the phone */
const StatusBar = ({ color }: { color: string }) => (
    <div className="h-[34px] px-6 flex items-center justify-between text-[12px] font-semibold shrink-0" style={{ color }}>
        <span>9:41</span>
        <span className="flex items-center gap-1">
            <span className="flex items-end gap-[1.5px] h-[10px]">{[4, 6, 8, 10].map(h => <span key={h} className="w-[2.5px] rounded-[1px]" style={{ height: h, background: color }} />)}</span>
            <span className="ml-1 w-[20px] h-[10px] rounded-[3px] border p-[1px]" style={{ borderColor: color }}><span className="block h-full w-[70%] rounded-[1px]" style={{ background: color }} /></span>
        </span>
    </div>
)

const TabBar = ({ p, s }: { p: Palette, s: S }) => (
    <div className="h-[46px] border-t flex items-center justify-around shrink-0" style={{ borderColor: p.line, color: p.text }}>
        <Home className="w-[22px] h-[22px]" />
        <Search className="w-[22px] h-[22px]" />
        <PlusSquare className="w-[22px] h-[22px]" />
        <Clapperboard className="w-[22px] h-[22px]" />
        <Avatar s={s} size={24} ring={false} />
    </div>
)

// ---------- screens ----------

const ProfileScreen = ({ s, p, media, highlights }: { s: S, p: Palette, media: SocialMedia[], highlights: SocialMockupContent['highlights'] }) => (
    <div className="flex flex-col h-full">
        <div className="h-[40px] px-4 flex items-center justify-between shrink-0" style={{ color: p.text }}>
            <Handle s={s} size={17} color={p.text} />
            <span className="flex items-center gap-4"><PlusSquare className="w-[22px] h-[22px]" /><Menu className="w-[22px] h-[22px]" /></span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
            <div className="px-4 pt-2 flex items-center gap-5">
                <Avatar s={s} size={78} />
                <div className="flex-1 grid grid-cols-3 text-center" style={{ color: p.text }}>
                    {[[s.posts, 'publicações'], [s.followers, 'seguidores'], [s.following, 'a seguir']].map(([v, l]) => (
                        <div key={l}><div className="text-[15px] font-bold leading-tight">{v}</div><div className="text-[11px]" style={{ color: p.text }}>{l}</div></div>
                    ))}
                </div>
            </div>
            <div className="px-4 pt-3 text-[12px] leading-[1.35]" style={{ color: p.text }}>
                <div className="font-semibold">{s.name}</div>
                {s.category && <div style={{ color: p.muted }}>{s.category}</div>}
                <div className="whitespace-pre-line">{s.bio}</div>
                {s.link && <div className="font-semibold" style={{ color: s.theme === 'dark' ? '#E0F1FF' : '#00376B' }}>{s.link}</div>}
            </div>
            <div className="px-4 pt-3 grid grid-cols-[1fr_1fr_auto] gap-1.5">
                <div className="h-[30px] rounded-lg flex items-center justify-center text-[12px] font-semibold text-white" style={{ background: s.accent }}>Seguir</div>
                <div className="h-[30px] rounded-lg flex items-center justify-center text-[12px] font-semibold" style={{ background: p.chip, color: p.text }}>Mensagem</div>
                <div className="h-[30px] w-[30px] rounded-lg flex items-center justify-center" style={{ background: p.chip, color: p.text }}><Plus className="w-4 h-4" /></div>
            </div>
            {s.showHighlights && highlights.length > 0 && (
                <div className="px-4 pt-4 flex gap-3.5 overflow-hidden">
                    {highlights.slice(0, 5).map(hl => (
                        <div key={hl.id} className="flex flex-col items-center gap-1 shrink-0">
                            <div className="w-[56px] h-[56px] rounded-full p-[2px] border" style={{ borderColor: p.line }}>
                                <img src={hl.url} alt="" className="w-full h-full rounded-full object-cover" draggable={false} />
                            </div>
                            <span className="text-[10px] max-w-[60px] truncate" style={{ color: p.text }}>{hl.label}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-3 grid grid-cols-3 border-t" style={{ borderColor: p.line, color: p.muted }}>
                <div className="h-[38px] flex items-center justify-center border-b-[1.5px]" style={{ borderColor: p.text, color: p.text }}><Grid3x3 className="w-[20px] h-[20px]" /></div>
                <div className="h-[38px] flex items-center justify-center"><Clapperboard className="w-[20px] h-[20px]" /></div>
                <div className="h-[38px] flex items-center justify-center"><UserSquare2 className="w-[20px] h-[20px]" /></div>
            </div>
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${s.gridColumns}, minmax(0, 1fr))` }}>
                {media.map(m => <img key={m.id} src={m.url} alt="" className="w-full aspect-[4/5] object-cover" draggable={false} />)}
            </div>
        </div>
        <TabBar p={p} s={s} />
    </div>
)

const PostScreen = ({ s, p, media }: { s: S, p: Palette, media: SocialMedia[] }) => (
    <div className="flex flex-col h-full">
        <div className="h-[44px] px-4 flex items-center justify-between shrink-0" style={{ color: p.text }}>
            <span className="text-[20px] font-bold tracking-tight" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>Feed</span>
            <span className="flex items-center gap-4"><Heart className="w-[22px] h-[22px]" /><Send className="w-[21px] h-[21px]" /></span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
            {media.slice(0, 2).map((m, i) => (
                <div key={m.id} className="pb-3">
                    <div className="h-[46px] px-3 flex items-center gap-2.5">
                        <Avatar s={s} size={32} />
                        <div className="flex-1 min-w-0 leading-tight">
                            <Handle s={s} size={12} color={p.text} />
                            <div className="text-[10px]" style={{ color: p.muted }}>{i === 0 ? 'Patrocinado' : s.category}</div>
                        </div>
                        <MoreHorizontal className="w-4 h-4" style={{ color: p.text }} />
                    </div>
                    <img src={m.url} alt="" className="w-full aspect-[4/5] object-cover" draggable={false} />
                    <div className="px-3 pt-2.5 flex items-center gap-3.5" style={{ color: p.text }}>
                        <Heart className="w-[22px] h-[22px]" style={i === 0 ? { color: '#FF3040', fill: '#FF3040' } : undefined} />
                        <MessageCircle className="w-[22px] h-[22px]" />
                        <Send className="w-[21px] h-[21px]" />
                        <Bookmark className="w-[21px] h-[21px] ml-auto" />
                    </div>
                    <div className="px-3 pt-1.5 text-[12px] leading-[1.35]" style={{ color: p.text }}>
                        <div className="font-semibold">{s.likes} gostos</div>
                        <div><span className="font-semibold">{s.handle}</span> {s.caption}</div>
                        <div className="pt-0.5" style={{ color: p.muted }}>Ver os {s.comments} comentários</div>
                    </div>
                </div>
            ))}
        </div>
        <TabBar p={p} s={s} />
    </div>
)

/** Stories / reel: one image at a time, with progress bars, arrows and autoplay */
const StoryScreen = ({ s, media, reel, paused }: { s: S, media: SocialMedia[], reel: boolean, paused: boolean }) => {
    const [index, setIndex] = useState(0)
    const count = Math.max(1, media.length)
    const current = Math.min(index, count - 1)
    const go = (dir: 1 | -1) => setIndex(i => {
        const next = i + dir
        if (next >= count) return s.loop ? 0 : count - 1
        if (next < 0) return s.loop ? count - 1 : 0
        return next
    })
    useEffect(() => {
        if (!s.autoplay || paused || count < 2) return
        const t = window.setTimeout(() => go(1), s.duration * 1000)
        return () => window.clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, s.autoplay, s.duration, paused, count, s.loop])
    const item = media[current]
    return (
        <div className="relative h-full bg-black overflow-hidden">
            {media.map((m, i) => (
                <img key={m.id} src={m.url} alt="" draggable={false}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                    style={{ opacity: i === current ? 1 : 0 }} />
            ))}
            <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[160px] bg-gradient-to-t from-black/60 to-transparent" />
            {!reel && (
                <div className="absolute top-[38px] inset-x-2.5 flex gap-[3px]">
                    {media.map((m, i) => (
                        <div key={m.id} className="flex-1 h-[2.5px] rounded-full bg-white/35 overflow-hidden">
                            <div
                                key={`${current}-${i}`}
                                className="h-full bg-white"
                                style={{
                                    width: i < current ? '100%' : i > current ? '0%' : undefined,
                                    animation: i === current && s.autoplay ? `social-story-progress ${s.duration}s linear forwards` : undefined,
                                    animationPlayState: paused ? 'paused' : 'running',
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className={cn("absolute inset-x-3 flex items-center gap-2 text-white", reel ? "bottom-[64px]" : "top-[50px]")}>
                <Avatar s={s} size={reel ? 30 : 30} ring={!reel} />
                <Handle s={s} size={12} color="#FFFFFF" />
                {!reel && <span className="text-[11px] text-white/70">2 h</span>}
                {reel && <span className="ml-1 h-[22px] px-2.5 rounded-md border border-white/70 text-[11px] font-semibold flex items-center">Seguir</span>}
                {!reel && <MoreHorizontal className="w-4 h-4 ml-auto" />}
            </div>
            {item?.caption && (
                <div className={cn("absolute inset-x-4 text-white text-[13px] leading-snug", reel ? "bottom-[38px]" : "bottom-[66px] text-center font-semibold text-[17px]")}>{item.caption}</div>
            )}
            {reel ? (
                <>
                    <div className="absolute right-2.5 bottom-[90px] flex flex-col items-center gap-4 text-white text-[10px] font-semibold">
                        <span className="flex flex-col items-center gap-1"><Heart className="w-6 h-6" />{s.likes}</span>
                        <span className="flex flex-col items-center gap-1"><MessageCircle className="w-6 h-6" />{s.comments}</span>
                        <Send className="w-6 h-6" />
                        <MoreHorizontal className="w-5 h-5" />
                    </div>
                    <div className="absolute left-3 bottom-[14px] flex items-center gap-1.5 text-white text-[11px]"><Music2 className="w-3.5 h-3.5" />{s.audio}</div>
                </>
            ) : (
                <div className="absolute inset-x-3 bottom-[16px] flex items-center gap-3 text-white">
                    <div className="flex-1 h-[38px] rounded-full border border-white/60 px-4 flex items-center text-[12px] text-white/85">Enviar mensagem</div>
                    <Heart className="w-[22px] h-[22px]" />
                    <Send className="w-[21px] h-[21px]" />
                </div>
            )}
            {/* Tap areas and arrows */}
            <button type="button" aria-label="Anterior" className="absolute left-0 top-[90px] bottom-[80px] w-1/3" onClick={(e) => { e.stopPropagation(); go(-1) }} />
            <button type="button" aria-label="Seguinte" className="absolute right-0 top-[90px] bottom-[80px] w-1/3" onClick={(e) => { e.stopPropagation(); go(1) }} />
            {s.showArrows && count > 1 && (
                <>
                    <button type="button" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); go(-1) }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 text-black flex items-center justify-center shadow hover:bg-white">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label="Seguinte" onClick={(e) => { e.stopPropagation(); go(1) }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 text-black flex items-center justify-center shadow hover:bg-white">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </>
            )}
        </div>
    )
}

const GridOnly = ({ s, media }: { s: S, media: SocialMedia[] }) => (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${s.gridColumns}, minmax(0, 1fr))` }}>
        {media.map(m => <img key={m.id} src={m.url} alt="" className="w-full aspect-[4/5] object-cover" draggable={false} />)}
    </div>
)

// ---------- block ----------

export const SocialMockupBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onMove, onAnimate }: SocialMockupBlockProps) => {
    const content = readSocialMockupContent(block.content)
    const s = resolveSocial(content.settings)
    const p = paletteOf(s)
    const [hovered, hoverBind] = useHoverIntent()
    const [showSettings, setShowSettings] = useState(false)
    const [pointerIn, setPointerIn] = useState(false)
    const save = (next: SocialMockupContent) => onUpdate(block.id, { ...block.content, ...next })

    const phone = s.frame === 'phone'
    // Never wider than its column: the screen shrinks with the room it has
    const boxRef = useRef<HTMLDivElement>(null)
    const [room, setRoom] = useState(10000)
    useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setRoom(el.clientWidth || 10000))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const w = Math.max(160, Math.min(s.width, room - (phone && s.mode !== 'grid' ? 20 : 0)))
    const scale = w / BASE_W
    const story = s.mode === 'story' || s.mode === 'reel'

    const screen = s.mode === 'grid'
        ? null
        : (
            <div style={{ width: BASE_W, height: BASE_H, background: story ? '#000' : p.bg, transform: `scale(${scale})`, transformOrigin: 'top left' }} className="relative flex flex-col overflow-hidden select-none">
                {!story && <StatusBar color={p.text} />}
                <div className={cn("flex-1 min-h-0", story && "absolute inset-0")}>
                    {s.mode === 'profile' && <ProfileScreen s={s} p={p} media={content.media} highlights={content.highlights} />}
                    {s.mode === 'post' && <PostScreen s={s} p={p} media={content.media} />}
                    {story && <StoryScreen s={s} media={content.media} reel={s.mode === 'reel'} paused={pointerIn && !isReadOnly} />}
                </div>
                {story && <div className="absolute top-0 inset-x-0"><StatusBar color="#FFFFFF" /></div>}
            </div>
        )

    const justify = s.alignment === 'left' ? 'flex-start' : s.alignment === 'right' ? 'flex-end' : 'center'

    return (
        <div
            ref={boxRef}
            className={cn("relative w-full flex", !isReadOnly && "cursor-pointer")}
            style={{ justifyContent: justify }}
            {...hoverBind}
            onMouseEnter={() => { hoverBind.onMouseEnter(); setPointerIn(true) }}
            onMouseLeave={() => { hoverBind.onMouseLeave(); setPointerIn(false) }}
            onClick={(e) => { if (isReadOnly) return; e.stopPropagation(); onSelect?.(block.id) }}
        >
            {/* The grid fills its column, so it lines up with the texts around it; the phone keeps its size */}
            <div className={cn("relative", s.mode === 'grid' && "w-full", !isReadOnly && (hovered || showSettings) && "outline outline-1 outline-dashed outline-[#FF0054] outline-offset-4 rounded-[2px]")}>
                {s.mode === 'grid' ? (
                    <GridOnly s={s} media={content.media} />
                ) : phone ? (
                    // Phone: body, side buttons and the island
                    <div className="relative" style={{ width: w + 20, padding: 10, borderRadius: 52 * scale + 10, background: s.frameColor, boxShadow: '0 30px 70px rgba(0,0,0,0.35), inset 0 0 0 1.5px rgba(255,255,255,0.12)' }}>
                        <span className="absolute -left-[3px] top-[22%] w-[3px] h-[9%] rounded-l" style={{ background: s.frameColor }} />
                        <span className="absolute -right-[3px] top-[26%] w-[3px] h-[13%] rounded-r" style={{ background: s.frameColor }} />
                        <div className="relative overflow-hidden" style={{ width: w, height: BASE_H * scale, borderRadius: 44 * scale }}>
                            {screen}
                            <span className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full z-10" style={{ top: 9 * scale, width: 92 * scale, height: 26 * scale }} />
                        </div>
                    </div>
                ) : (
                    <div className="relative overflow-hidden rounded-[18px] border" style={{ width: w, height: BASE_H * scale, borderColor: p.line }}>{screen}</div>
                )}
            </div>

            {!isReadOnly && (hovered || activeBlockId === block.id) && !showSettings && (
                <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                    <BlockContextBar
                        label="Rede social"
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
                    <SocialMockupPanel
                        blockId={block.id}
                        content={content}
                        resolved={s}
                        onChange={save}
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
