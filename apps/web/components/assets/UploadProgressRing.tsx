"use client"

import React from "react"

/**
 * Upload progress, in the spirit of the Brivio° mark: a ring that fills with the brand gradient while the
 * percentage counts up inside, and «A carregar 1 de 3» under it.
 */
export function UploadProgressRing({ percent, current, total, fileName, size = 132 }: {
    percent: number
    current: number
    total: number
    fileName?: string
    size?: number
}) {
    const id = React.useId().replace(/:/g, "")
    const target = Math.max(0, Math.min(100, percent))
    // The number climbs smoothly towards the real progress instead of jumping chunk by chunk
    const [shown, setShown] = React.useState(0)
    React.useEffect(() => {
        let raf = 0
        const step = () => {
            setShown(v => {
                const next = v + (target - v) * 0.18
                return Math.abs(target - next) < 0.2 ? target : next
            })
            raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [target])

    const stroke = Math.round(size * 0.075)
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    return (
        <div className="flex flex-col items-center gap-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(target)} aria-label="Progresso do upload">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <defs>
                        {/* Spread over the whole ring (not the drawn arc), so the brand colours appear as it fills */}
                        <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1={size} y1={0} x2={0} y2={size}>
                            <stop offset="0%" stopColor="#FF0054" />
                            <stop offset="50%" stopColor="#88007F" />
                            <stop offset="100%" stopColor="#06D6A0" />
                        </linearGradient>
                    </defs>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={`url(#g${id})`}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={c}
                        strokeDashoffset={c * (1 - shown / 100)}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-bold tabular-nums tracking-tight" style={{ fontSize: size * 0.24 }}>
                    {Math.round(shown)}<span className="opacity-60" style={{ fontSize: size * 0.13 }}>%</span>
                </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[14px] font-semibold">A carregar {current} de {total}</span>
                {fileName && <span className="text-[12px] opacity-60 max-w-[280px] truncate">{fileName}</span>}
            </div>
        </div>
    )
}
