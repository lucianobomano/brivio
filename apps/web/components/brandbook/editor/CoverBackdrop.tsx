"use client"

import React, { useEffect, useId, useRef } from "react"
import { hexToRgb, resolveCover, withAlpha, type CoverSettings } from "./cover"

/**
 * What a cover draws behind its content: the background image (with its own motion), the animated layer
 * (mesh, fluid, liquid, aurora, waves) and the finish (overlay, cursor light, vignette, grain).
 * Everything follows the pointer through CSS variables / refs (no React re-render per frame), animates only
 * while on screen, and stays still with "reduce motion".
 */

type Pointer = { x: number, y: number, tx: number, ty: number, inside: number, tinside: number, speed: number }

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Runs `frame(time)` every animation frame while the element is on screen and the tab visible */
const useFrameLoop = (ref: React.RefObject<Element | null>, frame: (t: number) => void, active = true) => {
    // Latest settings for the running loop, without restarting it
    const frameRef = useRef(frame)
    useEffect(() => { frameRef.current = frame })
    useEffect(() => {
        const el = ref.current
        if (!el || !active) return
        let raf = 0, visible = false
        const still = prefersReducedMotion()
        const tick = (t: number) => { frameRef.current(t / 1000); if (visible && !still) raf = requestAnimationFrame(tick) }
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting
            cancelAnimationFrame(raf)
            if (visible) raf = requestAnimationFrame(tick)
        })
        io.observe(el)
        // Reduced motion: one still frame
        if (still) requestAnimationFrame(tick)
        return () => { io.disconnect(); cancelAnimationFrame(raf) }
    }, [ref, active])
}

// ---------- animated layers ----------

/** Soft colour blobs drifting (CSS), each at its own depth when the mouse moves */
const MeshLayer = ({ c }: { c: Required<CoverSettings> }) => {
    const size = 38 + c.scale * 0.5
    return (
        <div className="absolute inset-0">
            {c.colors.map((color, i) => {
                const depth = (i + 1) * 0.35 * c.mouseStrength
                const pos = [[18, 22], [78, 28], [62, 78], [24, 74], [50, 50]][i % 5]
                return (
                    <div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${pos[0]}%`, top: `${pos[1]}%`, width: `${size}vmax`, height: `${size}vmax`,
                            transform: c.interactive ? `translate3d(calc(-50% + var(--nx, 0) * ${depth}px), calc(-50% + var(--ny, 0) * ${depth}px), 0)` : 'translate(-50%, -50%)',
                            transition: 'transform 0.2s linear',
                        }}
                    >
                        <div
                            className="w-full h-full rounded-full cover-drift"
                            style={{
                                background: `radial-gradient(circle at center, ${color} 0%, ${withAlpha(color, 0.55)} 35%, ${withAlpha(color, 0)} 70%)`,
                                filter: `blur(${c.blur * 0.6}px)`,
                                animationName: `cover-drift-${i % 4}`,
                                animationDuration: `${(16 + i * 5) / c.speed}s`,
                                opacity: 0.55 + c.intensity / 220,
                            }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

/** Bands of light waving (CSS) */
const AuroraLayer = ({ c }: { c: Required<CoverSettings> }) => {
    const [a, b, d = a, e = b] = c.colors
    const depth = c.mouseStrength * 0.6
    return (
        <div
            className="absolute -inset-[20%]"
            style={{
                transform: c.interactive ? `translate3d(calc(var(--nx, 0) * ${depth}px), calc(var(--ny, 0) * ${depth}px), 0)` : undefined,
                transition: 'transform 0.25s linear',
                filter: `blur(${20 + c.blur * 0.5}px) saturate(${1 + c.intensity / 100})`,
            }}
        >
            {[[a, b, d], [b, d, e], [d, e, a]].map((set, i) => (
                <div
                    key={i}
                    className="absolute inset-0 cover-aurora"
                    style={{
                        backgroundImage: `repeating-linear-gradient(${100 + i * 25}deg, ${withAlpha(set[0], 0)} 0%, ${set[0]} ${8 + c.scale / 10}%, ${set[1]} ${16 + c.scale / 8}%, ${withAlpha(set[2], 0)} ${28 + c.scale / 5}%)`,
                        backgroundSize: '300% 300%',
                        mixBlendMode: i ? 'screen' : 'normal',
                        opacity: i ? 0.7 : 1,
                        animationDuration: `${(22 + i * 7) / c.speed}s`,
                        animationDirection: i % 2 ? 'reverse' : 'normal',
                    }}
                />
            ))}
        </div>
    )
}

/** Blobs that drift and get pushed by the pointer, one of them trailing it (2D canvas, blurred) */
const FluidLayer = ({ c, pointer }: { c: Required<CoverSettings>, pointer: React.MutableRefObject<Pointer> }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const blobs = useRef<{ x: number, y: number, vx: number, vy: number, seed: number }[]>([])
    useEffect(() => {
        blobs.current = Array.from({ length: 7 }, (_, i) => ({ x: 0.5, y: 0.5, vx: 0, vy: 0, seed: i * 1.7 + 0.3 }))
    }, [])
    useFrameLoop(canvasRef, (t) => {
        const canvas = canvasRef.current
        if (!canvas) return
        // Low resolution: the blur hides it, and it's cheap
        const w = Math.max(2, Math.round(canvas.clientWidth / 4)), h = Math.max(2, Math.round(canvas.clientHeight / 4))
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, w, h)
        const p = pointer.current
        const radius = Math.min(w, h) * (0.22 + c.scale / 220)
        const time = t * 0.25 * c.speed
        const push = c.interactive ? c.mouseStrength / 50 : 0
        blobs.current.forEach((b, i) => {
            // Wandering home position
            const hx = 0.5 + Math.sin(time * (0.6 + i * 0.13) + b.seed) * 0.32 * (0.6 + c.intensity / 120)
            const hy = 0.5 + Math.cos(time * (0.5 + i * 0.11) + b.seed * 1.3) * 0.3 * (0.6 + c.intensity / 120)
            let ax = (hx - b.x) * 0.02, ay = (hy - b.y) * 0.02
            // Pushed away from the pointer
            if (push && p.inside > 0.05) {
                const dx = b.x - p.x, dy = b.y - p.y, d2 = dx * dx + dy * dy + 0.002
                ax += (dx / d2) * 0.0009 * push * p.inside
                ay += (dy / d2) * 0.0009 * push * p.inside
            }
            b.vx = (b.vx + ax) * 0.9; b.vy = (b.vy + ay) * 0.9
            b.x += b.vx; b.y += b.vy
            const color = c.colors[i % c.colors.length]
            const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, radius)
            g.addColorStop(0, color); g.addColorStop(1, withAlpha(color, 0))
            ctx.fillStyle = g
            ctx.beginPath(); ctx.arc(b.x * w, b.y * h, radius, 0, Math.PI * 2); ctx.fill()
        })
        // The blob that trails the pointer
        if (push && p.inside > 0.05) {
            const color = c.colors[0]
            const r = radius * (0.7 + p.speed * 2)
            const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, r)
            g.addColorStop(0, withAlpha(color, p.inside)); g.addColorStop(1, withAlpha(color, 0))
            ctx.fillStyle = g
            ctx.beginPath(); ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2); ctx.fill()
        }
    })
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ filter: `blur(${10 + c.blur * 0.5}px) saturate(1.25)` }} />
}

/** Lines that wave, bending around the pointer (2D canvas) */
const WavesLayer = ({ c, pointer }: { c: Required<CoverSettings>, pointer: React.MutableRefObject<Pointer> }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useFrameLoop(canvasRef, (t) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr)
        if (!w || !h) return
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, w, h)
        const p = pointer.current
        const lines = Math.round(14 + c.scale / 2.5)
        const amp = h * (0.03 + c.intensity / 1200)
        const time = t * c.speed
        ctx.lineWidth = 1.2 * dpr
        for (let i = 0; i < lines; i++) {
            const f = i / (lines - 1)
            const baseY = h * (0.15 + f * 0.7)
            const color = c.colors[Math.floor(f * (c.colors.length - 1) + 0.5)]
            ctx.strokeStyle = withAlpha(color, 0.35 + 0.5 * Math.sin(f * Math.PI))
            ctx.beginPath()
            for (let x = 0; x <= w; x += 8 * dpr) {
                const u = x / w
                let y = baseY + Math.sin(u * 6 + time * 0.8 + i * 0.35) * amp + Math.sin(u * 13 - time * 1.1 + i) * amp * 0.35
                if (c.interactive && p.inside > 0.05) {
                    const dx = (u - p.x) * (w / h), dy = (y / h - p.y)
                    const d = Math.sqrt(dx * dx + dy * dy)
                    y += Math.sign(dy || 1) * Math.exp(-d * 9) * h * 0.08 * (c.mouseStrength / 50) * p.inside
                }
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
            }
            ctx.stroke()
        }
    })
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

const LIQUID_FRAGMENT = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseOn; uniform float uStrength;
uniform float uIntensity; uniform float uScale; uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; } return v; }
void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float ar = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * ar, uv.y);
    vec2 m = vec2(uMouse.x * ar, uMouse.y);
    vec2 d = p - m; float dist = length(d);
    // Ripple + swirl around the pointer
    float wave = exp(-dist * 5.0) * uMouseOn * uStrength;
    p += normalize(d + 1e-4) * wave * 0.12 * sin(dist * 18.0 - uTime * 4.0);
    p += vec2(-d.y, d.x) * wave * 0.35;
    p *= uScale;
    float t = uTime * 0.12;
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + uIntensity * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + uIntensity * q + vec2(8.3, 2.8) - t * 1.2));
    float f = fbm(p + uIntensity * r);
    vec3 col = mix(uC0, uC1, clamp(f * f * 2.6, 0.0, 1.0));
    col = mix(col, uC2, clamp(length(q) * 0.9, 0.0, 1.0));
    col = mix(col, uC3, clamp(r.x * r.x * 1.4, 0.0, 1.0) * 0.85);
    col += 0.06 * smoothstep(0.55, 0.9, f);
    gl_FragColor = vec4(col, 1.0);
}`

/** Ink in motion (WebGL domain-warped noise) that ripples and swirls under the pointer; falls back to the mesh */
const LiquidLayer = ({ c, pointer }: { c: Required<CoverSettings>, pointer: React.MutableRefObject<Pointer> }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gl = useRef<{ ctx: WebGLRenderingContext, u: Record<string, WebGLUniformLocation | null> } | null>(null)
    const [failed, setFailed] = React.useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('webgl', { antialias: false, premultipliedAlpha: false }) as WebGLRenderingContext | null
        if (!canvas || !ctx) { setFailed(true); return }
        const shader = (type: number, src: string) => {
            const s = ctx.createShader(type)!
            ctx.shaderSource(s, src); ctx.compileShader(s)
            return ctx.getShaderParameter(s, ctx.COMPILE_STATUS) ? s : null
        }
        const vs = shader(ctx.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }')
        const fs = shader(ctx.FRAGMENT_SHADER, LIQUID_FRAGMENT)
        if (!vs || !fs) { setFailed(true); return }
        const prog = ctx.createProgram()!
        ctx.attachShader(prog, vs); ctx.attachShader(prog, fs); ctx.linkProgram(prog)
        if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) { setFailed(true); return }
        ctx.useProgram(prog)
        const buf = ctx.createBuffer()
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buf)
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), ctx.STATIC_DRAW)
        const loc = ctx.getAttribLocation(prog, 'a')
        ctx.enableVertexAttribArray(loc)
        ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0)
        const names = ['uRes', 'uTime', 'uMouse', 'uMouseOn', 'uStrength', 'uIntensity', 'uScale', 'uC0', 'uC1', 'uC2', 'uC3']
        gl.current = { ctx, u: Object.fromEntries(names.map(n => [n, ctx.getUniformLocation(prog, n)])) }
        return () => { ctx.getExtension('WEBGL_lose_context')?.loseContext(); gl.current = null }
    }, [])

    useFrameLoop(canvasRef, (t) => {
        const canvas = canvasRef.current, g = gl.current
        if (!canvas || !g) return
        // Half resolution: smooth enough for a soft, moving texture
        const w = Math.max(2, Math.round(canvas.clientWidth * 0.5)), h = Math.max(2, Math.round(canvas.clientHeight * 0.5))
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; g.ctx.viewport(0, 0, w, h) }
        const p = pointer.current
        const colors = [0, 1, 2, 3].map(i => hexToRgb(c.colors[i % c.colors.length]))
        const { ctx, u } = g
        ctx.uniform2f(u.uRes, w, h)
        ctx.uniform1f(u.uTime, t * c.speed)
        ctx.uniform2f(u.uMouse, p.x, 1 - p.y)
        ctx.uniform1f(u.uMouseOn, c.interactive ? p.inside : 0)
        ctx.uniform1f(u.uStrength, c.mouseStrength / 50)
        ctx.uniform1f(u.uIntensity, 1 + c.intensity / 25)
        ctx.uniform1f(u.uScale, 0.8 + (100 - c.scale) / 40)
        ;['uC0', 'uC1', 'uC2', 'uC3'].forEach((n, i) => ctx.uniform3f(u[n], colors[i][0], colors[i][1], colors[i][2]))
        ctx.drawArrays(ctx.TRIANGLES, 0, 6)
    }, !failed)

    if (failed) return <MeshLayer c={c} />
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

// ---------- background image with its own motion ----------

const ImageLayer = ({ url, c, pointer, filterId }: { url: string, c: Required<CoverSettings>, pointer: React.MutableRefObject<Pointer>, filterId: string }) => {
    const turbulence = useRef<SVGFETurbulenceElement>(null)
    const displace = useRef<SVGFEDisplacementMapElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)
    const liquid = c.imageMotion === 'liquid'
    useFrameLoop(layerRef, (t) => {
        const p = pointer.current
        const base = 0.006 + (c.intensity / 100) * 0.01
        turbulence.current?.setAttribute('baseFrequency', `${(base + Math.sin(t * 0.3 * c.speed) * 0.002).toFixed(5)} ${(base * 1.6 + Math.cos(t * 0.25 * c.speed) * 0.002).toFixed(5)}`)
        const scale = 6 + c.intensity * 0.25 + (c.interactive ? p.speed * 900 * (c.mouseStrength / 50) * p.inside : 0)
        displace.current?.setAttribute('scale', Math.min(140, scale).toFixed(1))
    }, liquid)
    const zoom = c.imageScale / 100
    const parallax = c.imageMotion === 'parallax' ? c.mouseStrength * 0.5 : 0
    return (
        <>
            {liquid && (
                <svg className="absolute w-0 h-0" aria-hidden>
                    <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
                        <feTurbulence ref={turbulence} type="fractalNoise" baseFrequency="0.01 0.016" numOctaves="2" seed="3" />
                        <feDisplacementMap ref={displace} in="SourceGraphic" scale="20" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </svg>
            )}
            <div
                ref={layerRef}
                className={c.imageMotion === 'zoom' ? "absolute -inset-[4%] cover-kenburns" : "absolute -inset-[4%]"}
                style={{
                    backgroundImage: `url(${url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: c.imagePosition,
                    transform: parallax
                        ? `translate3d(calc(var(--nx, 0) * ${-parallax}px), calc(var(--ny, 0) * ${-parallax}px), 0) scale(${zoom * 1.06})`
                        : `scale(${zoom})`,
                    transition: parallax ? 'transform 0.3s linear' : undefined,
                    filter: liquid ? `url(#${filterId})` : undefined,
                    animationDuration: `${24 / c.speed}s`,
                }}
            />
        </>
    )
}

// ---------- the backdrop ----------

export const CoverBackdrop = ({ cover, image, hostRef, radius }: {
    cover?: CoverSettings
    /** Background image of the section (drawn here, so it can move) */
    image?: string
    /** The section: the pointer is tracked over it */
    hostRef: React.RefObject<HTMLElement | null>
    radius?: string
}) => {
    const c = resolveCover(cover)
    const rootRef = useRef<HTMLDivElement>(null)
    const pointer = useRef<Pointer>({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, inside: 0, tinside: 0, speed: 0 })
    const filterId = `cover-liquid-${useId().replace(/:/g, '')}`

    // Pointer over the section (smoothed in the frame loop)
    useEffect(() => {
        const host = hostRef.current
        if (!host) return
        const move = (e: PointerEvent) => {
            const r = host.getBoundingClientRect()
            pointer.current.tx = (e.clientX - r.left) / r.width
            pointer.current.ty = (e.clientY - r.top) / r.height
            pointer.current.tinside = 1
        }
        const leave = () => { pointer.current.tinside = 0 }
        host.addEventListener('pointermove', move)
        host.addEventListener('pointerleave', leave)
        return () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave) }
    }, [hostRef])

    const needsPointer = c.interactive || c.spotlight || c.imageMotion === 'parallax' || c.imageMotion === 'liquid'
    useFrameLoop(rootRef, () => {
        const p = pointer.current
        const px = p.x, py = p.y
        p.x += (p.tx - p.x) * 0.08
        p.y += (p.ty - p.y) * 0.08
        p.inside += (p.tinside - p.inside) * 0.06
        p.speed = p.speed * 0.9 + Math.hypot(p.x - px, p.y - py) * 0.1
        const el = rootRef.current
        if (!el) return
        el.style.setProperty('--mx', `${(p.x * 100).toFixed(2)}%`)
        el.style.setProperty('--my', `${(p.y * 100).toFixed(2)}%`)
        el.style.setProperty('--nx', ((p.x - 0.5) * 2 * p.inside).toFixed(3))
        el.style.setProperty('--ny', ((p.y - 0.5) * 2 * p.inside).toFixed(3))
        el.style.setProperty('--inside', p.inside.toFixed(3))
    }, needsPointer)

    const overlayAlpha = c.overlayOpacity / 100
    const overlay =
        c.overlay === 'solid' ? withAlpha(c.overlayColor, overlayAlpha)
        : c.overlay === 'bottom' ? `linear-gradient(to top, ${withAlpha(c.overlayColor, overlayAlpha)} 0%, ${withAlpha(c.overlayColor, 0)} 75%)`
        : c.overlay === 'top' ? `linear-gradient(to bottom, ${withAlpha(c.overlayColor, overlayAlpha)} 0%, ${withAlpha(c.overlayColor, 0)} 75%)`
        : c.overlay === 'left' ? `linear-gradient(to right, ${withAlpha(c.overlayColor, overlayAlpha)} 0%, ${withAlpha(c.overlayColor, 0)} 80%)`
        : c.overlay === 'radial' ? `radial-gradient(ellipse at center, ${withAlpha(c.overlayColor, 0)} 25%, ${withAlpha(c.overlayColor, overlayAlpha)} 100%)`
        : undefined

    return (
        <div ref={rootRef} aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ borderRadius: radius }}>
            {image && <ImageLayer url={image} c={c} pointer={pointer} filterId={filterId} />}

            {c.effect !== 'none' && (
                <div className="absolute inset-0" style={{ opacity: c.effectOpacity / 100, mixBlendMode: c.blend }}>
                    {c.effect === 'mesh' && <MeshLayer c={c} />}
                    {c.effect === 'aurora' && <AuroraLayer c={c} />}
                    {c.effect === 'fluid' && <FluidLayer c={c} pointer={pointer} />}
                    {c.effect === 'waves' && <WavesLayer c={c} pointer={pointer} />}
                    {c.effect === 'liquid' && <LiquidLayer c={c} pointer={pointer} />}
                </div>
            )}

            {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}

            {c.spotlight && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(circle ${10 + c.spotlightSize * 0.6}vmax at var(--mx, 50%) var(--my, 50%), ${withAlpha(c.spotlightColor, c.spotlightOpacity / 100)} 0%, ${withAlpha(c.spotlightColor, 0)} 70%)`,
                        mixBlendMode: 'screen',
                        opacity: 'var(--inside, 0)' as unknown as number,
                    }}
                />
            )}

            {c.vignette > 0 && (
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${c.vignette / 100}) 100%)` }} />
            )}

            {c.grain > 0 && (
                <div
                    className={c.grainAnimated ? "absolute -inset-[50%] cover-grain" : "absolute -inset-[50%]"}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        opacity: c.grain / 100 * 0.6,
                        mixBlendMode: 'overlay',
                    }}
                />
            )}
        </div>
    )
}
