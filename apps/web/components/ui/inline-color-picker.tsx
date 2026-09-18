"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
    let clean = (hex || "#000000").replace(/^#/, "")
    if (clean.length === 3) {
        clean = clean.split("").map(c => c + c).join("")
    }
    if (clean.length !== 6) return { h: 0, s: 1, v: 1 }

    const r = parseInt(clean.substring(0, 2), 16) / 255
    const g = parseInt(clean.substring(2, 4), 16) / 255
    const b = parseInt(clean.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min

    let h = 0
    const s = max === 0 ? 0 : d / max
    const v = max

    if (max !== min) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / d + 2
                break
            case b:
                h = (r - g) / d + 4
                break
        }
        h = h * 60
    }

    return { h: Math.round(h), s, v }
}

export function hsvToHex(h: number, s: number, v: number): string {
    let r = 0, g = 0, b = 0
    const normalizedH = ((h % 360) + 360) % 360
    const i = Math.floor(normalizedH / 60)
    const f = (normalizedH / 60) - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    switch (i) {
        case 0: r = v; g = t; b = p; break
        case 1: r = q; g = v; b = p; break
        case 2: r = p; g = v; b = t; break
        case 3: r = p; g = q; b = v; break
        case 4: r = t; g = p; b = v; break
        case 5: r = v; g = p; b = q; break
    }

    const toHex = (n: number) => {
        const val = Math.max(0, Math.min(255, Math.round(n * 255)))
        return val.toString(16).padStart(2, "0").toUpperCase()
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

interface InlineColorPickerProps {
    color: string
    onChange: (color: string) => void
    height?: number
    showHueSlider?: boolean
    className?: string
}

export function InlineColorPicker({
    color,
    onChange,
    height = 120,
    showHueSlider = true,
    className
}: InlineColorPickerProps) {
    const satValRef = useRef<HTMLDivElement>(null)
    const hueRef = useRef<HTMLDivElement>(null)

    // Local HSV state
    const [hue, setHue] = useState<number>(() => hexToHsv(color).h)
    const [sat, setSat] = useState<number>(() => hexToHsv(color).s)
    const [val, setVal] = useState<number>(() => hexToHsv(color).v)

    // Sync external color changes
    useEffect(() => {
        const hsv = hexToHsv(color)
        // Keep current hue if color is greyscale (sat or val is 0) to avoid jumping
        if (hsv.s > 0.01 && hsv.v > 0.01) {
            setHue(hsv.h)
        }
        setSat(hsv.s)
        setVal(hsv.v)
    }, [color])

    // --- Saturation & Value 2D dragging ---
    const updateSatValFromPointer = useCallback((clientX: number, clientY: number) => {
        if (!satValRef.current) return
        const rect = satValRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        const newSat = x
        const newVal = 1 - y

        setSat(newSat)
        setVal(newVal)
        const newHex = hsvToHex(hue, newSat, newVal)
        onChange(newHex)
    }, [hue, onChange])

    const handleSatValPointerDown = (e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        updateSatValFromPointer(e.clientX, e.clientY)

        const handlePointerMove = (moveEvent: PointerEvent) => {
            updateSatValFromPointer(moveEvent.clientX, moveEvent.clientY)
        }

        const handlePointerUp = () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)
    }

    // --- Hue slider dragging ---
    const updateHueFromPointer = useCallback((clientX: number) => {
        if (!hueRef.current) return
        const rect = hueRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        const newHue = Math.round(x * 360) % 360

        setHue(newHue)
        const newHex = hsvToHex(newHue, sat, val)
        onChange(newHex)
    }, [sat, val, onChange])

    const handleHuePointerDown = (e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        updateHueFromPointer(e.clientX)

        const handlePointerMove = (moveEvent: PointerEvent) => {
            updateHueFromPointer(moveEvent.clientX)
        }

        const handlePointerUp = () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)
    }

    return (
        <div className={cn("space-y-3 select-none", className)}>
            {/* 2D Saturation & Value Area */}
            <div
                ref={satValRef}
                className="w-full rounded-lg relative overflow-hidden cursor-crosshair touch-none shadow-sm border border-white/10"
                style={{
                    height: `${height}px`,
                    backgroundColor: `hsl(${hue}, 100%, 50%)`
                }}
                onPointerDown={handleSatValPointerDown}
            >
                {/* Horizontal white gradient */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to right, #FFFFFF, rgba(255, 255, 255, 0))" }}
                />
                {/* Vertical black gradient */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, #000000, rgba(0, 0, 0, 0))" }}
                />

                {/* Circular thumb indicator */}
                <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_3px_1px_rgba(0,0,0,0.75)] absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${Math.max(0, Math.min(100, sat * 100))}%`,
                        top: `${Math.max(0, Math.min(100, (1 - val) * 100))}%`
                    }}
                />
            </div>

            {/* Hue Slider Bar */}
            {showHueSlider && (
                <div
                    ref={hueRef}
                    className="w-full h-3 rounded-full relative cursor-pointer touch-none shadow-inner border border-black/20"
                    style={{
                        background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
                    }}
                    onPointerDown={handleHuePointerDown}
                >
                    {/* Hue Thumb handle */}
                    <div
                        className="w-3.5 h-3.5 bg-white rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-md border border-black/30 pointer-events-none"
                        style={{
                            left: `${Math.max(0, Math.min(100, (hue / 360) * 100))}%`
                        }}
                    />
                </div>
            )}
        </div>
    )
}
