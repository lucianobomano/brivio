"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { SmoothColorInput } from "../SmoothColorInput"

// Controls of the dark block panels (footer, logo showcase…). Module level, so inputs keep focus while typing.

export const Title = ({ children, action }: { children: React.ReactNode, action?: React.ReactNode }) => (
    <div className="flex items-center justify-between">
        <span className="text-[#666] text-[10px] font-medium uppercase tracking-wider">{children}</span>
        {action}
    </div>
)

export const Hint = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] leading-relaxed text-[#666]">{children}</p>
)

export const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn("w-[32px] h-[18px] rounded-full relative transition-colors shrink-0", checked ? "bg-[#FF0054]" : "bg-[#3F3F46]")}
        >
            <span className={cn("absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all", checked ? "right-[2px]" : "left-[2px]")} />
        </button>
    </div>
)

export const ColorRow = ({ label, value, onChange }: { label: string, value: string, onChange: (c: string) => void }) => (
    <div className="flex items-center justify-between gap-3">
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[11px] uppercase text-[#666] w-[58px] text-right">{value || '—'}</span>
            <label className="w-7 h-7 rounded-full border border-white/15 cursor-pointer relative overflow-hidden" style={{ backgroundColor: value || 'transparent' }}>
                <SmoothColorInput
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
            </label>
        </div>
    </div>
)

export const Range = ({ label, value, min, max, step = 1, unit, onChange }: { label: string, value: number, min: number, max: number, step?: number, unit: string, onChange: (v: number) => void }) => (
    <div className="flex flex-col gap-2">
        <Title action={<span className="text-[11px] text-white tabular-nums">{value}{unit}</span>}>{label}</Title>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#FF0054] h-1 cursor-pointer" />
    </div>
)

export const Segmented = <T extends string>({ value, options, onChange }: { value: T, options: { id: T, label: React.ReactNode, title?: string }[], onChange: (v: T) => void }) => (
    <div className="grid gap-1 bg-[#1A1C23] p-1 rounded-md" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(o => (
            <button
                key={o.id}
                type="button"
                title={o.title}
                onClick={() => onChange(o.id)}
                className={cn("h-7 rounded text-[10px] font-bold transition-colors flex items-center justify-center", value === o.id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}
            >
                {o.label}
            </button>
        ))}
    </div>
)

export const Field = ({ value, placeholder, onChange }: { value: string, placeholder?: string, onChange: (v: string) => void }) => (
    <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 h-8 bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 text-[13px] text-white outline-none"
    />
)

/** Panel dragged by its header: spread `header` on the header, `style` on the panel */
export const usePanelDrag = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const drag = useRef<{ x: number, y: number, px: number, py: number } | null>(null)
    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!drag.current) return
            setPosition({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y })
        }
        const up = () => { drag.current = null }
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', up)
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    }, [])
    return {
        style: { transform: `translate(${position.x}px, ${position.y}px)` } as React.CSSProperties,
        header: { onMouseDown: (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y } } },
    }
}
