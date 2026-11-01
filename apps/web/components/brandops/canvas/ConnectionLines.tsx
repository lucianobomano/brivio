"use client"

import React, { useState } from "react"
import { BrandNode, BrandRelationship, SemanticRelationship } from "../types"
import { RELATIONSHIP_CONFIG } from "../constants"
import { X, Trash2 } from "lucide-react"

interface ConnectionLinesProps {
    relationships: BrandRelationship[]
    nodes: BrandNode[]
    activeConnection: {
        sourceNodeId: string
        startX: number
        startY: number
        currentX: number
        currentY: number
        connectorKind: string
    } | null
    onDeleteRelationship: (relId: string) => void
    onChangeRelationshipType: (relId: string, newType: SemanticRelationship) => void
    zoom: number
}

export function ConnectionLines({
    relationships,
    nodes,
    activeConnection,
    onDeleteRelationship,
    onChangeRelationshipType,
    zoom
}: ConnectionLinesProps) {
    const [hoveredRelId, setHoveredRelId] = useState<string | null>(null)
    const [openMenuRelId, setOpenMenuRelId] = useState<string | null>(null)

    // Lookup table for fast node positions
    const nodeMap = new Map<string, BrandNode>()
    nodes.forEach(n => nodeMap.set(n.id, n))

    return (
        <svg className="pointer-events-none absolute left-0 top-0 z-10 overflow-visible" width="10000" height="10000">

            {/* Render all existing relationships */}
            {relationships.map((rel) => {
                const source = nodeMap.get(rel.source_node_id)
                const target = nodeMap.get(rel.target_node_id)

                if (!source || !target) return null

                // Compute port coordinates
                const x1 = source.x + (source.width || 340) + 21
                const sourcePortIndex = typeof rel.metadata?.source_port_index === 'number' ? rel.metadata.source_port_index : 0
                const y1 = source.y + 16 + sourcePortIndex * 48
                const x2 = target.x - 21
                const y2 = target.y + (target.height || 220) - 16

                const dx = Math.abs(x2 - x1)
                const dy = Math.abs(y2 - y1)
                const curveFactor = Math.max(dx * 0.45, 60)

                // Cubic Bezier curve
                const pathD = `M ${x1} ${y1} C ${x1 + curveFactor} ${y1}, ${x2 - curveFactor} ${y2}, ${x2} ${y2}`

                const midX = (x1 + x2) / 2
                const midY = (y1 + y2) / 2

                const relMeta = RELATIONSHIP_CONFIG[rel.relationship_type] || RELATIONSHIP_CONFIG.supports
                const isHovered = hoveredRelId === rel.id
                const isExecuting = source.is_executing || target.is_executing
                const connectorKind = rel.metadata?.connector_kind
                const lineColor = connectorKind === 'asset' ? '#4F6BFF' : connectorKind === 'audio' ? '#14B8A6' : '#8157DC'

                return (
                    <g key={rel.id} className="pointer-events-auto group">
                        {/* Invisible thick path for easy mouse hovering */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={24}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredRelId(rel.id)}
                            onMouseLeave={() => setHoveredRelId(null)}
                        />

                        {/* Visible Line */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke={isExecuting ? "#8157DC" : lineColor}
                            strokeWidth={isHovered || isExecuting ? 3.25 : 3}
                            strokeDasharray={isExecuting ? "6 5" : undefined}
                            strokeLinecap="round"
                            className={isExecuting ? "animate-[dash_1s_linear_infinite]" : ""}
                            onMouseEnter={() => setHoveredRelId(rel.id)}
                            onMouseLeave={() => setHoveredRelId(null)}
                        />

                        {/* Middle Semantic Relationship Badge Pill */}
                        {false && <foreignObject
                            x={midX - 55}
                            y={midY - 14}
                            width={110}
                            height={28}
                            className="overflow-visible pointer-events-auto"
                        >
                            <div className="relative flex items-center justify-center">
                                <button
                                    onClick={() => setOpenMenuRelId(openMenuRelId === rel.id ? null : rel.id)}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition-all shadow-lg flex items-center gap-1 cursor-pointer border"
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        color: '#52525B',
                                        borderColor: '#E4E4E7'
                                    }}
                                    title={`Relação: ${relMeta.label} — ${relMeta.description} (Clique para alterar ou excluir)`}
                                >
                                    <span>{relMeta.label}</span>
                                    {isHovered && (
                                        <span 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDeleteRelationship(rel.id)
                                            }}
                                            className="text-red-400 hover:text-red-300 ml-0.5"
                                            title="Remover conexão"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown menu to change relation type */}
                                {openMenuRelId === rel.id && (
                                    <div 
                                        className="absolute left-1/2 -translate-x-1/2 top-7 w-48 bg-[#18181B] border border-white/10 rounded-xl shadow-2xl p-1 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="text-[10px] text-zinc-400 px-2 py-1 font-mono uppercase tracking-wider border-b border-white/5">
                                            Tipo de Relação
                                        </div>
                                        <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
                                            {(Object.keys(RELATIONSHIP_CONFIG) as SemanticRelationship[]).map((type) => {
                                                const meta = RELATIONSHIP_CONFIG[type]
                                                const isCurrent = rel.relationship_type === type
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            onChangeRelationshipType(rel.id, type)
                                                            setOpenMenuRelId(null)
                                                        }}
                                                        className="w-full px-2 py-1 flex items-center justify-between rounded hover:bg-white/10 text-left text-zinc-200 cursor-pointer text-[11px]"
                                                    >
                                                        <span style={{ color: meta.color }} className="font-medium">
                                                            {meta.label}
                                                        </span>
                                                        {isCurrent && <span className="text-[9px] text-[#FF0054]">✓</span>}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="pt-1 border-t border-white/5">
                                            <button
                                                onClick={() => {
                                                    onDeleteRelationship(rel.id)
                                                    setOpenMenuRelId(null)
                                                }}
                                                className="w-full px-2 py-1 flex items-center gap-1.5 text-red-400 hover:bg-red-500/10 rounded text-left text-[11px] cursor-pointer"
                                            >
                                                <Trash2 className="w-3 h-3" /> Eliminar Conexão
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </foreignObject>}
                    </g>
                )
            })}

            {/* Live active connecting wire when user is dragging */}
            {activeConnection && (
                <path
                    d={`M ${activeConnection.startX} ${activeConnection.startY} C ${activeConnection.startX + 60} ${activeConnection.startY}, ${activeConnection.currentX - 60} ${activeConnection.currentY}, ${activeConnection.currentX} ${activeConnection.currentY}`}
                    fill="none"
                    stroke={activeConnection.connectorKind === 'asset' ? '#4F6BFF' : activeConnection.connectorKind === 'audio' ? '#14B8A6' : '#8157DC'}
                    strokeWidth={3}
                    strokeDasharray="5 6"
                    strokeLinecap="round"
                    className="pointer-events-none"
                />
            )}
        </svg>
    )
}
