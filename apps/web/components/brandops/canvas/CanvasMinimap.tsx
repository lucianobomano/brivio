"use client"

import React, { useRef } from "react"
import { BrandNode } from "../types"
import { CATEGORY_CONFIG } from "../constants"
import { MapPin } from "lucide-react"

interface CanvasMinimapProps {
    nodes: BrandNode[]
    viewport: { x: number; y: number; zoom: number }
    containerSize: { width: number; height: number }
    onPanTo: (x: number, y: number) => void
}

export function CanvasMinimap({
    nodes,
    viewport,
    containerSize,
    onPanTo
}: CanvasMinimapProps) {
    const minimapRef = useRef<HTMLDivElement>(null)

    const mapWidth = 180
    const mapHeight = 120

    // Compute bounds of all nodes
    let minX = 0
    let minY = 0
    let maxX = 2200
    let maxY = 1400

    if (nodes.length > 0) {
        minX = Math.min(...nodes.map(n => n.x)) - 200
        minY = Math.min(...nodes.map(n => n.y)) - 200
        maxX = Math.max(...nodes.map(n => n.x + (n.width || 340))) + 200
        maxY = Math.max(...nodes.map(n => n.y + (n.height || 220))) + 200
    }

    const worldWidth = Math.max(maxX - minX, 1000)
    const worldHeight = Math.max(maxY - minY, 800)

    const scaleX = mapWidth / worldWidth
    const scaleY = mapHeight / worldHeight

    // Viewport box in minimap coordinates
    const viewWidthOnMap = ((containerSize.width / viewport.zoom) * scaleX)
    const viewHeightOnMap = ((containerSize.height / viewport.zoom) * scaleY)
    const viewLeftOnMap = ((-viewport.x / viewport.zoom - minX) * scaleX)
    const viewTopOnMap = ((-viewport.y / viewport.zoom - minY) * scaleY)

    const handleMinimapClick = (e: React.MouseEvent) => {
        if (!minimapRef.current) return
        const rect = minimapRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top

        // Convert click to world coordinates
        const targetWorldX = minX + (clickX / mapWidth) * worldWidth
        const targetWorldY = minY + (clickY / mapHeight) * worldHeight

        // Center target on screen
        const newViewportX = -targetWorldX * viewport.zoom + containerSize.width / 2
        const newViewportY = -targetWorldY * viewport.zoom + containerSize.height / 2

        onPanTo(newViewportX, newViewportY)
    }

    return (
        <div className="absolute right-6 bottom-6 z-30 select-none">
            <div 
                ref={minimapRef}
                onClick={handleMinimapClick}
                className="relative bg-[#141416]/90 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl cursor-crosshair overflow-hidden group hover:border-[#FF0054]/50 transition-colors"
                style={{ width: mapWidth, height: mapHeight }}
                title="Minimapa do Brand Canvas (Clique para navegar)"
            >
                {/* Dots for nodes */}
                {nodes.map(node => {
                    const nx = (node.x - minX) * scaleX
                    const ny = (node.y - minY) * scaleY
                    const nw = Math.max((node.width || 340) * scaleX, 4)
                    const nh = Math.max((node.height || 220) * scaleY, 3)
                    const color = CATEGORY_CONFIG[node.category]?.color || '#FFFFFF'

                    return (
                        <div
                            key={node.id}
                            className="absolute rounded-sm opacity-80"
                            style={{
                                left: nx,
                                top: ny,
                                width: nw,
                                height: nh,
                                backgroundColor: color
                            }}
                        />
                    )
                })}

                {/* Viewport rect indicator */}
                <div
                    className="absolute border border-[#FF0054] bg-[#FF0054]/10 rounded pointer-events-none transition-all duration-75"
                    style={{
                        left: Math.max(0, Math.min(mapWidth - 20, viewLeftOnMap)),
                        top: Math.max(0, Math.min(mapHeight - 15, viewTopOnMap)),
                        width: Math.min(mapWidth, Math.max(20, viewWidthOnMap)),
                        height: Math.min(mapHeight, Math.max(15, viewHeightOnMap))
                    }}
                />

                {/* Badge */}
                <div className="absolute top-1 left-2 text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-[#FF0054]" /> Minimap
                </div>
            </div>
        </div>
    )
}
