"use client"

import React, { useState } from "react"
import { motion, useDragControls } from "framer-motion"
import { cn } from "@/lib/utils"
import { X, Ban } from "lucide-react"

interface AnimationOptionProps {
    id: string
    label: string
    icon: React.ReactNode
    selected?: boolean
    onClick?: () => void
}

const AnimationOptionCard = ({ label, icon, selected, onClick }: AnimationOptionProps) => {
    return (
        <div
            onClick={onClick}
            className="flex flex-col items-center gap-1 cursor-pointer group"
        >
            <div className={cn(
                "w-[100px] h-[100px] bg-[#15161B] rounded-lg border border-[#222] flex items-center justify-center transition-all",
                selected ? "border-[#ff0054] shadow-[0_0_15px_rgba(255,0,84,0.3)] bg-[#1a1c22]" : "group-hover:border-[#333]"
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-[12px] font-medium transition-colors text-center",
                selected ? "text-white" : "text-[#555] group-hover:text-[#777]"
            )}>
                {label}
            </span>
        </div>
    )
}

interface AnimationPanelProps {
    isOpen: boolean
    onClose: () => void
    onSelectAnimation?: (animationId: string) => void
    initialAnimation?: string | null
}

export const AnimationPanel = ({ isOpen, onClose, onSelectAnimation, initialAnimation }: AnimationPanelProps) => {
    const dragControls = useDragControls()
    const [selectedId, setSelectedId] = useState<string | null>(initialAnimation || null)

    React.useEffect(() => {
        if (initialAnimation) {
            setSelectedId(initialAnimation)
        }
    }, [initialAnimation])

    if (!isOpen) return null

    const options = [
        {
            id: 'none',
            label: 'Nenhuma',
            icon: (
                <div className="flex items-center justify-center w-full h-full opacity-40">
                    <Ban className="w-10 h-10 text-[#ff0054]" />
                </div>
            )
        },
        {
            id: 'ascender',
            label: 'Ascender',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="relative w-10 h-16 flex flex-col-reverse items-center">
                        <div className="absolute bottom-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute bottom-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute bottom-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute bottom-6 w-8 h-8 bg-[#ff0054] rounded-sm opacity-100 shadow-[0_4px_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute right-3 flex flex-col items-center">
                        <div className="w-[1.5px] h-8 bg-[#ff0054]" />
                        <div className="w-1.5 h-1.5 border-t-[1.5px] border-r-[1.5px] border-[#ff0054] -rotate-45 -mt-[1px]" />
                    </div>
                </div>
            )
        },
        {
            id: 'panorama',
            label: 'Panorama',
            icon: (
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <div className="relative w-16 h-8 flex items-center">
                        <div className="absolute left-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute left-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute left-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute left-6 w-10 h-8 bg-[#ff0054] rounded-sm opacity-100 shadow-[4px_0_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute bottom-4 flex items-center">
                        <div className="w-8 h-[1.5px] bg-[#ff0054]" />
                        <div className="w-1.5 h-1.5 border-t-[1.5px] border-r-[1.5px] border-[#ff0054] rotate-45 -ml-[1px]" />
                    </div>
                </div>
            )
        },
        {
            id: 'surgir',
            label: 'Surgir',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="absolute translate-x-[-8px] translate-y-[-8px] w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                    <div className="absolute translate-x-[-4px] translate-y-[-4px] w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                    <div className="absolute w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                    <div className="absolute translate-x-[4px] translate-y-[4px] w-10 h-10 bg-[#ff0054] rounded-sm opacity-100 shadow-[4px_4px_10px_rgba(255,0,84,0.3)]" />
                </div>
            )
        },
        {
            id: 'ressalto',
            label: 'Ressalto',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 border-[1.5px] border-[#ff0054] rounded-md flex items-center justify-center">
                        <div className="w-8 h-8 border-[1.5px] border-[#ff0054] rounded-sm flex items-center justify-center">
                            <div className="w-5 h-5 bg-[#ff0054] rounded-[2px]" />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'limpar',
            label: 'Limpar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 flex rounded-md overflow-hidden relative">
                        <div className="flex-1 bg-[#ff0054]" />
                        <div className="flex-1 bg-[#ff0054] opacity-20" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-[#ff0054] -translate-x-1/2" />
                    </div>
                </div>
            )
        },
        {
            id: 'desfocagem',
            label: 'Desfocagem',
            icon: (
                <div className="w-12 h-12 bg-[#ff0054] rounded-md blur-[6px] opacity-80" />
            )
        },
        {
            id: 'sequencia',
            label: 'Sequência',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-12 h-12 bg-[#ff0054] rounded-md blur-[6px] opacity-80" />
                    {/* Corner marks */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                </div>
            )
        },
        {
            id: 'de_baixo',
            label: 'De baixo',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full pb-2">
                    <div className="relative w-8 h-12 flex flex-col-reverse items-center">
                        <div className="absolute bottom-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.15]" />
                        <div className="absolute bottom-2 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute bottom-4 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.65]" />
                        <div className="absolute bottom-6 w-8 h-10 bg-[#ff0054] rounded-sm opacity-100 shadow-[0_4px_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute bottom-2 w-12 h-[1.5px] bg-[#ff0054]" />
                </div>
            )
        },
        {
            id: 'deriva',
            label: 'Deriva',
            icon: (
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <div className="relative w-12 h-10 flex items-center">
                        <div className="absolute left-0 w-8 h-8 bg-[#ff0054] rounded-sm opacity-[.35]" />
                        <div className="absolute left-4 w-9 h-9 bg-[#ff0054] rounded-sm opacity-100 shadow-[4px_0_10px_rgba(255,0,84,0.3)]" />
                    </div>
                    <div className="absolute bottom-2 flex items-center">
                        <div className="w-8 h-[1.5px] bg-[#ff0054]" />
                        <div className="w-1.5 h-1.5 border-t-[1.5px] border-r-[1.5px] border-[#ff0054] rotate-45 -ml-[1px]" />
                    </div>
                </div>
            )
        },
        {
            id: 'rodar',
            label: 'Rodar',
            icon: (
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#ff0054] rounded-full shadow-[0_0_15px_rgba(255,0,84,0.4)]" />

                    {/* SVG for circular arrows to match the visual better */}
                    <svg width="48" height="48" viewBox="0 0 48 48" className="absolute">
                        <path
                            d="M 12 30 A 18 18 0 0 1 36 18"
                            fill="none"
                            stroke="#ff0054"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 36 18 l -4 0 l 4 -4 l 0 4"
                            fill="#ff0054"
                            stroke="#ff0054"
                            strokeWidth="1"
                        />

                        <path
                            d="M 36 18 A 18 18 0 0 1 12 30"
                            fill="none"
                            stroke="#ff0054"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            transform="rotate(180 24 24)"
                        />
                        <path
                            d="M 36 18 l -4 0 l 4 -4 l 0 4"
                            fill="#ff0054"
                            stroke="#ff0054"
                            strokeWidth="1"
                            transform="rotate(180 24 24)"
                        />
                    </svg>
                </div>
            )
        },
        {
            id: 'pulsar',
            label: 'Pulsar',
            icon: (
                <div className="relative flex items-center justify-center w-full h-full">
                    <div className="w-10 h-10 bg-[#ff0054] rounded-full shadow-[0_0_20px_rgba(255,0,84,0.5)]" />
                    {/* Corner marks */}
                    <div className="absolute top-4 left-4 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute top-4 right-4 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-4 left-4 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-[#ff0054]" />
                    <div className="absolute bottom-4 right-4 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-[#ff0054]" />
                </div>
            )
        }
    ]

    return (
        <motion.div
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="fixed top-20 right-10 z-[10000] w-[380px] h-[650px] bg-[#111116] rounded-xl border border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="h-[50px] bg-[#ff0054] flex items-center justify-between px-6 cursor-grab active:cursor-grabbing shrink-0"
            >
                <span className="text-white font-bold text-lg">Animar</span>
                <button
                    onClick={onClose}
                    className="w-[21px] h-[21px] bg-[#15161B] rounded-full flex items-center justify-center text-[#ff0054] hover:bg-black transition-colors"
                >
                    <X size={14} strokeWidth={4} />
                </button>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="grid grid-cols-3 gap-[10px]">
                    {options.map((opt) => (
                        <AnimationOptionCard
                            key={opt.id}
                            id={opt.id}
                            label={opt.label}
                            icon={opt.icon}
                            selected={selectedId === opt.id}
                            onClick={() => {
                                setSelectedId(opt.id)
                                onSelectAnimation?.(opt.id)
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
