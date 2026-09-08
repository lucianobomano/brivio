"use client"

import React, { useState, useEffect } from "react"
import { Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BlockMargin {
    isLocked?: boolean
    top?: number | string
    bottom?: number | string
    left?: number | string
    right?: number | string
}

interface MarginSettingsControlProps {
    margin?: BlockMargin
    onChange: (margin: BlockMargin) => void
    className?: string
    title?: string
}

export function MarginSettingsControl({
    margin = { isLocked: true, top: 0, bottom: 0, left: 0, right: 0 },
    onChange,
    className,
    title = "Margem"
}: MarginSettingsControlProps) {
    const isLocked = margin?.isLocked !== false

    // Raw string states to allow typing negative values (e.g. '-' or '-10')
    const [verticalInput, setVerticalInput] = useState<string>(() => {
        const top = margin?.top ?? 0
        return String(top)
    })
    const [lateralInput, setLateralInput] = useState<string>(() => {
        const left = margin?.left ?? 0
        return String(left)
    })

    const [topInput, setTopInput] = useState<string>(() => String(margin?.top ?? 0))
    const [bottomInput, setBottomInput] = useState<string>(() => String(margin?.bottom ?? 0))
    const [leftInput, setLeftInput] = useState<string>(() => String(margin?.left ?? 0))
    const [rightInput, setRightInput] = useState<string>(() => String(margin?.right ?? 0))

    // Sync from prop changes when not actively typing
    useEffect(() => {
        const top = margin?.top ?? 0
        const bottom = margin?.bottom ?? 0
        const left = margin?.left ?? 0
        const right = margin?.right ?? 0

        setTopInput(String(top))
        setBottomInput(String(bottom))
        setLeftInput(String(left))
        setRightInput(String(right))

        setVerticalInput(String(top))
        setLateralInput(String(left))
    }, [margin?.top, margin?.bottom, margin?.left, margin?.right, margin?.isLocked])

    const handleLockToggle = () => {
        const nextLocked = !isLocked
        if (nextLocked) {
            // Locking: unify vertical using top, and lateral using left
            const vVal = margin?.top ?? 0
            const lVal = margin?.left ?? 0
            onChange({
                isLocked: true,
                top: vVal,
                bottom: vVal,
                left: lVal,
                right: lVal
            })
        } else {
            onChange({
                ...margin,
                isLocked: false
            })
        }
    }

    const parseValue = (val: string): number | string => {
        if (val === '' || val === '-') return val
        const num = parseInt(val, 10)
        return isNaN(num) ? 0 : num
    }

    const handleVerticalChange = (val: string) => {
        setVerticalInput(val)
        if (val !== '' && val !== '-') {
            const num = parseInt(val, 10)
            if (!isNaN(num)) {
                setTopInput(String(num))
                setBottomInput(String(num))
                onChange({
                    ...margin,
                    isLocked: true,
                    top: num,
                    bottom: num
                })
            }
        }
    }

    const handleLateralChange = (val: string) => {
        setLateralInput(val)
        if (val !== '' && val !== '-') {
            const num = parseInt(val, 10)
            if (!isNaN(num)) {
                setLeftInput(String(num))
                setRightInput(String(num))
                onChange({
                    ...margin,
                    isLocked: true,
                    left: num,
                    right: num
                })
            }
        }
    }

    const handleIndividualChange = (side: 'top' | 'bottom' | 'left' | 'right', val: string) => {
        if (side === 'top') setTopInput(val)
        if (side === 'bottom') setBottomInput(val)
        if (side === 'left') setLeftInput(val)
        if (side === 'right') setRightInput(val)

        if (val !== '' && val !== '-') {
            const num = parseInt(val, 10)
            if (!isNaN(num)) {
                onChange({
                    ...margin,
                    isLocked: false,
                    [side]: num
                })
            }
        }
    }

    const handleBlur = (side: 'vertical' | 'lateral' | 'top' | 'bottom' | 'left' | 'right') => {
        if (side === 'vertical') {
            const num = parseInt(verticalInput, 10) || 0
            setVerticalInput(String(num))
            setTopInput(String(num))
            setBottomInput(String(num))
            onChange({ ...margin, isLocked: true, top: num, bottom: num })
        } else if (side === 'lateral') {
            const num = parseInt(lateralInput, 10) || 0
            setLateralInput(String(num))
            setLeftInput(String(num))
            setRightInput(String(num))
            onChange({ ...margin, isLocked: true, left: num, right: num })
        } else {
            let currentStr = ''
            if (side === 'top') currentStr = topInput
            if (side === 'bottom') currentStr = bottomInput
            if (side === 'left') currentStr = leftInput
            if (side === 'right') currentStr = rightInput

            const num = parseInt(currentStr, 10) || 0
            if (side === 'top') setTopInput(String(num))
            if (side === 'bottom') setBottomInput(String(num))
            if (side === 'left') setLeftInput(String(num))
            if (side === 'right') setRightInput(String(num))

            onChange({ ...margin, isLocked: false, [side]: num })
        }
    }

    return (
        <div className={cn("flex flex-col gap-2 py-3 border-t border-[#333]/70", className)}>
            <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</span>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleLockToggle()
                    }}
                    className={cn(
                        "p-1 rounded transition-colors",
                        isLocked ? "text-[#FF0054] hover:bg-[#FF0054]/10" : "text-[#888] hover:text-white hover:bg-white/5"
                    )}
                    title={isLocked ? "Margens unificadas (bloqueadas). Clique para editar individualmente." : "Margens individuais. Clique para unificar."}
                >
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
            </div>

            {isLocked ? (
                /* Unified Mode: Vertical & Lateral */
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-[#888]">
                            <span>Vertical</span>
                            <span className="text-[9px] text-[#555]">Topo/Base</span>
                        </div>
                        <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded px-2 h-[30px] focus-within:border-[#FF0054] transition-colors">
                            <input
                                type="text"
                                value={verticalInput}
                                onChange={(e) => handleVerticalChange(e.target.value)}
                                onBlur={() => handleBlur('vertical')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleBlur('vertical')
                                        e.currentTarget.blur()
                                    }
                                }}
                                className="bg-transparent border-none text-white text-xs w-full text-right outline-none pr-1"
                                placeholder="0"
                            />
                            <span className="text-[#666] text-[10px] select-none">px</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-[#888]">
                            <span>Lateral</span>
                            <span className="text-[9px] text-[#555]">Esq/Dir</span>
                        </div>
                        <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded px-2 h-[30px] focus-within:border-[#FF0054] transition-colors">
                            <input
                                type="text"
                                value={lateralInput}
                                onChange={(e) => handleLateralChange(e.target.value)}
                                onBlur={() => handleBlur('lateral')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleBlur('lateral')
                                        e.currentTarget.blur()
                                    }
                                }}
                                className="bg-transparent border-none text-white text-xs w-full text-right outline-none pr-1"
                                placeholder="0"
                            />
                            <span className="text-[#666] text-[10px] select-none">px</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Individual Mode: 4 Inputs (T, B, L, R) */
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {[
                        { key: 'top' as const, label: 'T', hint: 'Topo', value: topInput },
                        { key: 'bottom' as const, label: 'B', hint: 'Base', value: bottomInput },
                        { key: 'left' as const, label: 'L', hint: 'Esq', value: leftInput },
                        { key: 'right' as const, label: 'R', hint: 'Dir', value: rightInput },
                    ].map(({ key, label, hint, value }) => (
                        <div key={key} className="flex flex-col items-center gap-1">
                            <span className="text-[#888] text-[10px] font-medium" title={hint}>{label}</span>
                            <div className="flex items-center bg-[#1A1A20] border border-[#333] rounded w-full h-[28px] px-1 focus-within:border-[#FF0054] transition-colors">
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => handleIndividualChange(key, e.target.value)}
                                    onBlur={() => handleBlur(key)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleBlur(key)
                                            e.currentTarget.blur()
                                        }
                                    }}
                                    className="bg-transparent border-none text-white text-[11px] w-full text-center outline-none"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
