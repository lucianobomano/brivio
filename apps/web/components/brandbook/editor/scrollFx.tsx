"use client"

import React, { useEffect, useRef, useState } from "react"

/**
 * Scroll-driven effects of the brandbook (Preview / shared link): one shared frame loop reads the scroll and
 * the pointer and runs every effect on the page (texts that light up, horizontal rails, pinned stages, mask
 * reveals, magnetic elements). Effects write CSS variables / transforms directly (no React render per frame)
 * and show their finished state with "reduce motion".
 */

type Tick = () => void
const ticks = new Set<Tick>()
export const pointer = { x: -9999, y: -9999 }
let running = false

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const start = () => {
    if (running || typeof window === 'undefined') return
    running = true
    let raf = 0
    const run = () => { raf = 0; ticks.forEach(t => t()) }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(run) }
    // Capture: the editor scrolls inside its canvas, not the window
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; schedule() }, { passive: true })
    // Keep running smoothly while things move (velocity easing, magnets settling)
    const idle = () => { schedule(); setTimeout(idle, 120) }
    idle()
}

/** Runs `tick` on every scroll / pointer frame while mounted */
export const useScrollTick = (tick: Tick, active = true) => {
    const ref = useRef(tick)
    useEffect(() => { ref.current = tick })
    useEffect(() => {
        if (!active) return
        start()
        const t: Tick = () => ref.current()
        ticks.add(t)
        t()
        return () => { ticks.delete(t) }
    }, [active])
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))

/** 0 → 1 while a tall element (pinned section) scrolls through the screen */
export const pinProgress = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    return clamp(-r.top / Math.max(1, r.height - window.innerHeight))
}

/** 0 → 1 while an element enters the screen (from 80% of the height up to its end) */
export const enterProgress = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    return clamp((vh * 0.8 - r.top) / (r.height + vh * 0.1))
}

// ---------- Texts that light up ----------

/** Sets --sp (0 → 1) on the element as it scrolls in */
export const useLightProgress = (active: boolean) => {
    const ref = useRef<HTMLElement | null>(null)
    useScrollTick(() => {
        const el = ref.current
        if (!el) return
        el.style.setProperty('--sp', (reducedMotion() ? 1 : enterProgress(el)).toFixed(4))
    }, active)
    return ref
}

/** Style of a text lit from top to bottom with the scroll (the rest stays dim) */
export const lightTextStyle = (color: string): React.CSSProperties => ({
    backgroundImage: `linear-gradient(180deg, ${color} 0%, ${color} calc(var(--sp, 1) * 100% - 7%), color-mix(in srgb, ${color} 20%, transparent) calc(var(--sp, 1) * 100% + 7%), color-mix(in srgb, ${color} 20%, transparent) 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
})

// ---------- Mask reveal ----------

export type MaskShape = 'petal' | 'circle' | 'arch'

const MASKS: Record<MaskShape, string> = {
    petal: `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 3C79 22 93 58 50 97C7 58 21 22 50 3Z' transform='rotate(38 50 50)'/%3E%3C/svg%3E")`,
    circle: `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48'/%3E%3C/svg%3E")`,
    arch: `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M8 100V50a42 42 0 0 1 84 0v50Z'/%3E%3C/svg%3E")`,
}

/** The content shows through a shape that opens when it scrolls into view (and opens fully on hover) */
export const MaskReveal = ({ shape, children }: { shape: MaskShape, children: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(reducedMotion)
    const [hover, setHover] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el || open) return
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOpen(true); io.disconnect() } }, { threshold: 0.35 })
        io.observe(el)
        return () => io.disconnect()
    }, [open])
    const size = hover ? '340%' : open ? (shape === 'arch' ? '100%' : '130%') : '0%'
    return (
        <div
            ref={ref}
            className="w-full"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                WebkitMaskImage: MASKS[shape], maskImage: MASKS[shape],
                WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                WebkitMaskPosition: shape === 'arch' ? '50% 100%' : '50% 50%', maskPosition: shape === 'arch' ? '50% 100%' : '50% 50%',
                WebkitMaskSize: size, maskSize: size,
                transition: 'mask-size 1.2s cubic-bezier(.2,.8,.2,1), -webkit-mask-size 1.2s cubic-bezier(.2,.8,.2,1)',
            }}
        >
            {children}
        </div>
    )
}

// ---------- Magnetic ----------

/** The content leans towards the pointer when it comes close */
export const Magnetic = ({ children, strength = 0.35 }: { children: React.ReactNode, strength?: number }) => {
    const ref = useRef<HTMLDivElement>(null)
    useScrollTick(() => {
        const el = ref.current
        if (!el || reducedMotion()) return
        const r = el.getBoundingClientRect()
        const dx = pointer.x - (r.left + r.width / 2), dy = pointer.y - (r.top + r.height / 2)
        const reach = Math.max(120, Math.max(r.width, r.height) * 1.2)
        const k = Math.hypot(dx, dy) < reach ? (1 - Math.hypot(dx, dy) / reach) * strength : 0
        el.style.translate = `${(dx * k).toFixed(1)}px ${(dy * k).toFixed(1)}px`
    })
    return <div ref={ref} className="w-full" style={{ transition: 'translate .5s cubic-bezier(.2,.8,.2,1)' }}>{children}</div>
}

// ---------- Pinned sections ----------

/**
 * Horizontal rail: the section is as tall as its track is wide; while it scrolls through, the track moves
 * sideways inside a pinned (sticky) screen. Cards bend with the scroll speed (--rail-bend).
 */
export const useRail = (active: boolean) => {
    const wrapRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | null>(null)
    const motion = useRef({ last: 0, v: 0 })
    useScrollTick(() => {
        const wrap = wrapRef.current, track = trackRef.current
        if (!wrap || !track) return
        const viewport = track.parentElement?.clientWidth || window.innerWidth
        const distance = Math.max(0, track.scrollWidth - viewport)
        const wanted = Math.round(window.innerHeight + distance)
        if (height !== wanted) setHeight(wanted)
        const x = -pinProgress(wrap) * distance
        track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`
        const m = motion.current
        m.v += ((x - m.last) - m.v) * 0.2
        m.last = x
        const bend = reducedMotion() ? 0 : Math.max(-9, Math.min(9, m.v * 0.35))
        track.style.setProperty('--rail-bend', `${bend.toFixed(2)}deg`)
    }, active)
    return { wrapRef, trackRef, height }
}

/** Pinned stages: the section is `count` screens tall; returns the stage (0-based) shown now */
export const useStages = (count: number, active: boolean) => {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [stage, setStage] = useState(0)
    useScrollTick(() => {
        const wrap = wrapRef.current
        if (!wrap) return
        const p = pinProgress(wrap)
        wrap.style.setProperty('--stage-progress', p.toFixed(4))
        const next = Math.min(count - 1, Math.floor(p * count * 0.999))
        setStage(s => (s === next ? s : next))
    }, active)
    return { wrapRef, stage }
}
