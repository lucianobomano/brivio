"use client"

import React, { useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateModuleContent } from "@/app/actions/brandbook"

interface ColorItem {
    hex: string
    name: string
}

interface PaletteModuleProps {
    moduleId: string
    content: {
        colors?: ColorItem[]
    }
    isReadOnly?: boolean
}

export function PaletteModule({ moduleId, content, isReadOnly }: PaletteModuleProps) {
    const [colors, setColors] = useState<ColorItem[]>(content?.colors || [])

    const saveColors = async (newColors: ColorItem[]) => {
        // Optimistic update
        setColors(newColors)
        await updateModuleContent(moduleId, { colors: newColors })
    }

    const addColor = () => {
        const newColors = [...colors, { hex: "#000000", name: "New Color" }]
        saveColors(newColors)
    }

    const removeColor = (index: number) => {
        const newColors = [...colors]
        newColors.splice(index, 1)
        saveColors(newColors)
    }

    const updateColor = (index: number, field: keyof ColorItem, value: string) => {
        const newColors = [...colors]
        newColors[index] = { ...newColors[index], [field]: value }
        // We defer save on keystroke to blur, but for simplicity here we might want a local state buffer
        // For now, let's just update local state and have a blur handler or specific save logic
        setColors(newColors)
    }

    const handleBlur = () => {
        updateModuleContent(moduleId, { colors })
    }

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {colors.map((color, index) => (
                    <div key={index} className="group relative bg-bg-2 rounded-xl overflow-hidden border border-bg-3 hover:border-accent-indigo transition-colors">
                        <div
                            className="h-24 w-full"
                            style={{ backgroundColor: color.hex }}
                        />
                        <div className="p-3 space-y-2">
                            {isReadOnly ? (
                                <>
                                    <p className="font-bold text-white text-sm">{color.name}</p>
                                    <p className="text-xs text-text-secondary uppercase">{color.hex}</p>
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={color.name}
                                        onChange={(e) => updateColor(index, 'name', e.target.value)}
                                        onBlur={handleBlur}
                                        className="w-full bg-transparent border-none text-white text-sm font-bold p-0 focus:ring-0 placeholder:text-text-secondary/50"
                                        placeholder="Color Name"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color.hex }}></div>
                                        <input
                                            type="text"
                                            value={color.hex}
                                            onChange={(e) => updateColor(index, 'hex', e.target.value)}
                                            onBlur={handleBlur}
                                            className="w-full bg-transparent border-none text-xs text-text-secondary p-0 focus:ring-0 uppercase placeholder:text-text-secondary/50"
                                            placeholder="#000000"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeColor(index)}
                                        className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-error rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {!isReadOnly && (
                    <button
                        onClick={addColor}
                        className="h-full min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed border-bg-3 rounded-xl hover:bg-bg-2/50 hover:border-accent-indigo/50 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-bg-2 flex items-center justify-center mb-2 group-hover:bg-accent-indigo/20 group-hover:text-accent-indigo transition-colors">
                            <Plus className="w-5 h-5 text-text-secondary group-hover:text-accent-indigo" />
                        </div>
                        <span className="text-sm text-text-secondary group-hover:text-white">Add Color</span>
                    </button>
                )}
            </div>
        </div>
    )
}
