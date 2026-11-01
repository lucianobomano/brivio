"use client"

import React from "react"
import { BrandCategory } from "../types"
import { CATEGORY_CONFIG } from "../constants"
import { Compass, Target, MessageSquare, Palette, Volume2, Layers, Zap, Award } from "lucide-react"

export interface CanvasFrameItem {
    id: string
    category: BrandCategory
    title: string
    x: number
    y: number
    width: number
    height: number
}

interface CanvasFramesProps {
    frames: CanvasFrameItem[]
    onFrameHeaderMouseDown?: (frameId: string, e: React.MouseEvent) => void
}

export function CanvasFrames({ frames, onFrameHeaderMouseDown }: CanvasFramesProps) {
    const getCategoryIcon = (cat: BrandCategory) => {
        switch (cat) {
            case 'discovery': return Compass
            case 'strategy': return Target
            case 'verbal_identity': return MessageSquare
            case 'visual_identity': return Palette
            case 'sensorial_identity': return Volume2
            case 'behavioural_identity': return Layers
            case 'activation': return Zap
            case 'governance': return Award
            default: return Target
        }
    }

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            {frames.map((frame) => {
                const config = CATEGORY_CONFIG[frame.category] || CATEGORY_CONFIG.strategy
                const Icon = getCategoryIcon(frame.category)

                return (
                    <div
                        key={frame.id}
                        className="absolute rounded-3xl border border-dashed transition-all duration-200 pointer-events-none"
                        style={{
                            left: frame.x,
                            top: frame.y,
                            width: frame.width,
                            height: frame.height,
                            borderColor: config.border,
                            backgroundColor: config.bg
                        }}
                    >
                        {/* Frame Header Pill */}
                        <div
                            onMouseDown={(e) => onFrameHeaderMouseDown?.(frame.id, e)}
                            className="absolute -top-4 left-6 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 pointer-events-auto cursor-grab active:cursor-grabbing border shadow-lg backdrop-blur-md"
                            style={{
                                backgroundColor: '#141416',
                                borderColor: config.color,
                                color: config.color
                            }}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{frame.title}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
