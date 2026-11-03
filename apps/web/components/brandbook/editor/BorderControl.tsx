"use client"

import React from "react"
import { Lock, Unlock } from "lucide-react"
import { SmoothColorInput } from "./SmoothColorInput"

/**
 * Borders of a section or a column: one width for every side (locked) or each side on its own (top, right,
 * bottom, left), with a style and a colour. Shared by the brandbook editor and the proposal editor.
 */
export interface BorderSettings {
    isLocked: boolean
    top: number
    right: number
    bottom: number
    left: number
    style: "solid" | "dashed" | "dotted"
    color: string
}

export const EMPTY_BORDER: BorderSettings = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0, style: "solid", color: "#000000" }

type LegacyBorder = { border?: Partial<BorderSettings> | null, borderWidth?: number | string | null, borderColor?: string | null, borderStyle?: string | null }

/** The border of a column: the per-side one, or the single width it was saved with before */
export const resolveBorder = (s?: LegacyBorder | null): BorderSettings => {
    if (s?.border) return { ...EMPTY_BORDER, ...s.border } as BorderSettings
    const w = Number(s?.borderWidth) || 0
    return {
        isLocked: true, top: w, right: w, bottom: w, left: w,
        style: (s?.borderStyle as BorderSettings["style"]) || "dashed",
        color: s?.borderColor || "#000000",
    }
}

export const hasBorder = (b?: Partial<BorderSettings> | null) => !!b && ((b.top || 0) + (b.right || 0) + (b.bottom || 0) + (b.left || 0)) > 0

/** CSS of a border (nothing when every side is 0) */
export const borderCss = (b?: Partial<BorderSettings> | null): React.CSSProperties => {
    if (!hasBorder(b)) return {}
    return {
        borderTopWidth: `${b!.top || 0}px`,
        borderRightWidth: `${b!.right || 0}px`,
        borderBottomWidth: `${b!.bottom || 0}px`,
        borderLeftWidth: `${b!.left || 0}px`,
        borderStyle: b!.style || "solid",
        borderColor: b!.color || "#000000",
    }
}

const SIDES = [["top", "T"], ["right", "R"], ["bottom", "B"], ["left", "L"]] as const

export function BorderControl({ value, onChange, label = "Border" }: { value?: Partial<BorderSettings> | null, onChange: (b: BorderSettings) => void, label?: string }) {
    const b: BorderSettings = { ...EMPTY_BORDER, ...(value || {}) } as BorderSettings
    const num = (v: string) => Math.max(0, parseInt(v) || 0)
    const setAll = (v: string) => { const n = num(v); onChange({ ...b, top: n, right: n, bottom: n, left: n }) }

    return (
        <div className="flex flex-col gap-2 border-b border-[#333] pb-4 pt-3">
            <div className="flex items-center justify-between gap-3">
                <span className="font-light text-gray-400">{label}</span>
                <div className="flex items-center gap-2">
                    <select
                        value={b.style}
                        onChange={(e) => onChange({ ...b, style: e.target.value as BorderSettings["style"] })}
                        className="bg-[#15161B] text-white/70 text-xs outline-none border border-white/10 rounded h-6 w-[70px]"
                        aria-label="Estilo da borda"
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>
                    <div className="relative w-6 h-6 rounded-full overflow-hidden cursor-pointer ring-1 ring-white/10" style={{ backgroundColor: b.color }}>
                        <SmoothColorInput
                            type="color"
                            value={b.color}
                            onChange={(e) => onChange({ ...b, color: e.target.value })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange(b.isLocked ? { ...b, isLocked: false } : { ...b, isLocked: true, right: b.top, bottom: b.top, left: b.top })}
                        className="text-[#666] hover:text-white transition-colors"
                        title={b.isLocked ? "Bordas individuais (cima, direita, baixo, esquerda)" : "A mesma borda em todos os lados"}
                    >
                        {b.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {b.isLocked ? (
                <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-[#666] text-[10px] font-medium">ALL</span>
                    <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded-[2px] px-2 h-[26px] w-[60px]">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={b.top}
                            onChange={(e) => setAll(e.target.value)}
                            className="bg-transparent border-none text-white text-xs w-full text-right outline-none px-1"
                            aria-label="Espessura da borda"
                        />
                        <span className="text-[#666] text-[10px] select-none">px</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-1">
                    {SIDES.map(([side, letter]) => (
                        <div key={side} className="flex flex-col items-center gap-1">
                            <span className="text-[#666] text-[9px]">{letter}</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={b[side]}
                                onChange={(e) => onChange({ ...b, [side]: num(e.target.value) })}
                                className="bg-[#1A1A20] border border-[#333] text-white w-full text-center text-[12px] rounded-[2px] py-1 outline-none focus:border-[#666] transition-colors"
                                aria-label={`Borda ${side === "top" ? "superior" : side === "right" ? "direita" : side === "bottom" ? "inferior" : "esquerda"}`}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
