"use client"

import React from "react"

interface GuideLine {
    type: 'h' | 'v'
    pos: number
}

interface SmartGuidesProps {
    guides: GuideLine[]
}

export const SmartGuides = ({ guides }: SmartGuidesProps) => {
    if (!guides.length) return null

    return (
        <div className="absolute inset-0 pointer-events-none z-[1000]">
            <svg className="w-full h-full overflow-visible">
                {guides.map((guide, i) => (
                    <line
                        key={i}
                        x1={guide.type === 'v' ? guide.pos : -10000}
                        y1={guide.type === 'h' ? guide.pos : -10000}
                        x2={guide.type === 'v' ? guide.pos : 10000}
                        y2={guide.type === 'h' ? guide.pos : 10000}
                        stroke="#FF0054"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                    />
                ))}
            </svg>
        </div>
    )
}
