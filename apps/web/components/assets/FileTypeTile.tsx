import React from "react"
import { cn } from "@/lib/utils"
import type { FileStyle } from "@/lib/hooks/use-file-style"

/**
 * The colour of each format: the same as the formats marquee on the landing page, plus the other files a
 * creative team works with. Unknown extensions get a stable colour from the palette.
 */
const FORMAT_COLORS: Record<string, string> = {
    // artwork & layout
    svg: "#06D6A0", ai: "#FF7A00", eps: "#6E2BB8", pdf: "#E5252A", psd: "#1E7BF2", psb: "#1E7BF2", fig: "#A259FF", indd: "#FF3366", idml: "#FF3366",
    sketch: "#F7B500", xd: "#FF61F6", afdesign: "#1B72BE", afphoto: "#7E4DD2", afpub: "#C9284D", cdr: "#2E9E3F", ait: "#FF7A00",
    // fonts
    otf: "#16161B", ttf: "#3A3B45", woff: "#111216", woff2: "#111216",
    // documents
    docx: "#2B579A", doc: "#2B579A", pptx: "#D24726", ppt: "#D24726", xlsx: "#217346", xls: "#217346", csv: "#16A34A", txt: "#6B7280", md: "#374151", rtf: "#6B7280",
    key: "#1A8CFF", pages: "#F59E0B", numbers: "#16A34A",
    // images
    png: "#1652F0", jpg: "#F59E0B", jpeg: "#F59E0B", webp: "#0E8A5F", gif: "#311C99", tif: "#88007F", tiff: "#88007F", heic: "#0F766E", avif: "#0E7490", bmp: "#475569",
    raw: "#8B5CF6", cr2: "#8B5CF6", nef: "#8B5CF6", arw: "#8B5CF6", dng: "#8B5CF6",
    // motion, video, audio
    mp4: "#FF0054", mov: "#2A2B33", avi: "#9F1239", mkv: "#7C3AED", webm: "#0F766E", aep: "#9999FF", prproj: "#EA77FF", lottie: "#00DDB3",
    mp3: "#FF0054", wav: "#0891B2", aac: "#0EA5E9", flac: "#155E75", ogg: "#0E7490",
    // 3D, code, packages
    blend: "#F5792A", obj: "#F5792A", fbx: "#F5792A", glb: "#F5792A", gltf: "#F5792A", stl: "#EA580C", usdz: "#0A84FF",
    html: "#E34F26", css: "#1572B6", js: "#F7DF1E", json: "#F7DF1E", ts: "#3178C6",
    zip: "#64748B", rar: "#8E44AD", "7z": "#475569",
}
const PALETTE = ["#FF0054", "#88007F", "#06D6A0", "#311C99", "#1E7BF2", "#FF7A00", "#0E8A5F", "#E5252A"]

/** The extension of a file, from its name, its address or its type */
export function fileExtension(name?: string | null, url?: string | null, type?: string | null) {
    const pick = (s?: string | null) => {
        if (!s) return ""
        const clean = s.split(/[?#]/)[0]
        const m = clean.match(/\.([a-z0-9]{1,8})$/i)
        return m ? m[1].toLowerCase() : ""
    }
    return pick(name) || pick(url) || (type && type !== "file" && type !== "document" ? type.toLowerCase().slice(0, 6) : "") || "file"
}

export function formatColor(ext: string) {
    if (FORMAT_COLORS[ext]) return FORMAT_COLORS[ext]
    let h = 0
    for (const c of ext) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return PALETTE[h % PALETTE.length]
}

/** Dark text on light formats (.js, .json), white elsewhere */
const isLight = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72
}
const shade = (hex: string, amt: number) => {
    const n = parseInt(hex.slice(1), 16)
    const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))))
    return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`
}

/**
 * A file without a preview: its extension (".ai", ".psd"…) on a tile in the format's colour, drawn in the
 * chosen style. Fills its box; the text scales with the tile's width.
 */
export function FileTypeTile({ name, url, type, style = "solid", className, rounded = "rounded-[inherit]" }: {
    name?: string | null
    url?: string | null
    type?: string | null
    style?: FileStyle
    className?: string
    rounded?: string
}) {
    const ext = fileExtension(name, url, type)
    const color = formatColor(ext)
    const ink = isLight(color) ? "#111216" : "#FFFFFF"
    const label = `.${ext}`
    // The extension fills a good part of the tile, shorter extensions bigger
    const size = `clamp(13px, ${ext.length <= 3 ? 20 : ext.length <= 4 ? 17 : 13}cqw, 72px)`
    const text = (color: string, extra?: React.CSSProperties) => (
        <span className="relative font-bold tracking-tight leading-none select-none" style={{ fontSize: size, color, ...extra }}>{label}</span>
    )
    const box = cn("relative w-full h-full overflow-hidden flex items-center justify-center", rounded, className)
    const cq: React.CSSProperties = { containerType: "size" }

    switch (style) {
        case "glass":
            return (
                <div className={box} style={{ ...cq, backgroundColor: shade(color, -0.6) }} aria-label={`Ficheiro ${label}`}>
                    {/* The format's colour, blurred behind the glass */}
                    <span className="absolute w-[75%] h-[75%] rounded-full -top-[12%] -left-[10%] opacity-95" style={{ backgroundColor: color, filter: "blur(14cqw)" }} />
                    <span className="absolute w-[60%] h-[60%] rounded-full -bottom-[14%] -right-[8%] opacity-90" style={{ backgroundColor: shade(color, 0.35), filter: "blur(14cqw)" }} />
                    <div className="relative w-[64%] h-[58%] rounded-[14%/18%] flex items-center justify-center border border-white/35 bg-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_30px_rgba(0,0,0,0.25)]">
                        {text("#FFFFFF", { textShadow: "0 1px 12px rgba(0,0,0,0.25)" })}
                    </div>
                </div>
            )
        case "gradient":
            return (
                <div
                    className={box}
                    aria-label={`Ficheiro ${label}`}
                    style={{
                        ...cq,
                        backgroundColor: color,
                        backgroundImage: `radial-gradient(80% 80% at 15% 10%, ${shade(color, 0.45)} 0%, transparent 60%), radial-gradient(70% 70% at 90% 90%, ${shade(color, -0.45)} 0%, transparent 60%), radial-gradient(60% 60% at 85% 15%, ${shade(color, 0.15)} 0%, transparent 55%)`,
                    }}
                >
                    {text(ink)}
                </div>
            )
        case "document":
            return (
                <div className={box} style={{ ...cq, backgroundColor: shade(color, 0.88) }} aria-label={`Ficheiro ${label}`}>
                    {/* A sheet with its corner folded, the extension on a band */}
                    <div className="relative h-[78%] aspect-[3/4] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]" style={{ clipPath: "polygon(0 0, 72% 0, 100% 21%, 100% 100%, 0 100%)", borderRadius: "6px" }}>
                        <span className="absolute top-0 right-0 w-[28%] h-[21%]" style={{ background: `linear-gradient(225deg, transparent 50%, ${shade(color, 0.6)} 50%)` }} />
                        <div className="absolute left-[12%] right-[12%] top-[16%] flex flex-col gap-[7%] h-[34%]">
                            {[62, 86, 74, 50].map((w, i) => <span key={i} className="h-[9%] min-h-[2px] rounded-full bg-black/10" style={{ width: `${w}%` }} />)}
                        </div>
                        <div className="absolute left-0 right-0 bottom-[12%] h-[26%] flex items-center px-[10%]" style={{ backgroundColor: color, containerType: "size" }}>
                            <span className="font-bold tracking-tight leading-none" style={{ fontSize: "clamp(10px, 34cqw, 40px)", color: ink }}>{label}</span>
                        </div>
                    </div>
                </div>
            )
        case "outline":
            return (
                <div className={box} style={{ ...cq, backgroundColor: `${color}14` }} aria-label={`Ficheiro ${label}`}>
                    <div className="absolute inset-[10%] rounded-[12%] border-2" style={{ borderColor: color }} />
                    {text(color)}
                </div>
            )
        default:
            return (
                <div className={box} style={{ ...cq, backgroundColor: color }} aria-label={`Ficheiro ${label}`}>
                    {text(ink)}
                </div>
            )
    }
}
