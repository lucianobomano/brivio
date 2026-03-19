import React from "react"
import { X, AlignLeft, AlignCenter, AlignRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaSettingsPanelProps {
    onClose: () => void
    settings: {
        align?: 'left' | 'center' | 'right'
        aspectRatio?: string
        borderColor?: string
        borderWidth?: number
        radius?: number
        width?: string
        height?: string
    }
    onUpdate: (settings: any) => void
    className?: string
}

export const MediaSettingsPanel = ({ onClose, settings, onUpdate, className }: MediaSettingsPanelProps) => {

    // Ratios: 1:1, 3:2, 4:3, 5:4, 7:5, 16:9, 9:16, 4:5
    const ratios = ['1:1', '3:2', '4:3', '5:4', '7:5', '16:9', '9:16', '4:5']
    // Border widths: 1, 3, 5, 8, 10
    const borderWeights = [1, 3, 5, 8, 10]
    // Radius: 1, 3, 5, 10, 20
    const radii = [1, 3, 5, 10, 20]

    return (
        <div className={cn("w-[280px] bg-[#15161B] rounded-[8px] overflow-hidden shadow-2xl flex flex-col text-white font-sans text-sm z-[200]", className)}>
            {/* Header */}
            <div className="h-[48px] bg-[#FF0054] px-4 flex items-center justify-between shrink-0">
                <span className="font-medium text-[15px]">Edit image</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose() }}
                    className="w-6 h-6 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors"
                >
                    <X className="w-3.5 h-3.5 text-white" />
                </button>
            </div>

            <div className="p-5 flex flex-col gap-5">

                {/* 1. Alinhamento */}
                <div className="flex flex-col gap-2">
                    <span className="text-[#888] text-xs font-medium">Alinhamento</span>
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'left', icon: AlignLeft },
                            { id: 'center', icon: AlignCenter },
                            { id: 'right', icon: AlignRight }
                        ].map((align) => (
                            <button
                                key={align.id}
                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, align: align.id }) }}
                                className={cn(
                                    "p-1.5 rounded hover:bg-[#2A2B32] transition-colors text-[#888] hover:text-white",
                                    settings.align === align.id && "bg-[#2A2B32] text-white"
                                )}
                            >
                                <align.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 2. Proporção */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[#888] text-xs font-medium">Proporção</span>
                        <RotateCcw
                            className="w-3.5 h-3.5 text-[#888] cursor-pointer hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUpdate({ ...settings, aspectRatio: undefined, width: undefined, height: undefined })
                            }}
                        />
                    </div>

                    {/* Width/Height Inputs */}
                    <div className="flex gap-4 text-xs text-[#666]">
                        <div className="flex items-center gap-2">
                            <span>w</span>
                            <input
                                type="text"
                                className="w-12 bg-[#2A2B32] text-white border-none rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-[#FF0054] outline-none"
                                value={settings.width || ''}
                                placeholder="00"
                                onChange={(e) => onUpdate({ ...settings, width: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span>h</span>
                            <input
                                type="text"
                                className="w-12 bg-[#2A2B32] text-white border-none rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-[#FF0054] outline-none"
                                value={settings.height || ''}
                                placeholder="00"
                                onChange={(e) => onUpdate({ ...settings, height: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                        {ratios.map(r => (
                            <button
                                key={r}
                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, aspectRatio: r, width: undefined, height: undefined }) }} // Ratio override dimensions usually
                                className={cn(
                                    "text-xs text-[#888] hover:text-white transition-colors",
                                    settings.aspectRatio === r && "text-[#FF0054] font-medium"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 3. Cor da borda */}
                <div className="flex items-center justify-between">
                    <span className="text-[#888] text-xs font-medium">Cor da borda</span>
                    <div className="relative">
                        <input
                            type="color"
                            value={settings.borderColor || '#0000ff'}
                            onChange={(e) => onUpdate({ ...settings, borderColor: e.target.value })}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                            className="w-6 h-6 rounded-full border border-white/10"
                            style={{ backgroundColor: settings.borderColor || '#0044FF' }}
                        />
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 4. Peso do contorno */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[#888] text-xs font-medium">Peso do contorno</span>
                        <RotateCcw
                            className="w-3.5 h-3.5 text-[#888] cursor-pointer hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUpdate({ ...settings, borderWidth: undefined })
                            }}
                        />
                    </div>
                    <div className="flex justify-between px-1">
                        {borderWeights.map(w => (
                            <button
                                key={w}
                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, borderWidth: w }) }}
                                className={cn(
                                    "text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-[#2A2B32] transition-colors text-[#888] hover:text-white",
                                    settings.borderWidth === w && "bg-[#2A2B32] text-white"
                                )}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[#333] w-full" />

                {/* 5. Raio */}
                <div className="flex flex-col gap-3">
                    <span className="text-[#888] text-xs font-medium">Raio</span>
                    <div className="flex justify-between px-1">
                        {radii.map(r => (
                            <button
                                key={r}
                                onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, radius: r }) }}
                                className={cn(
                                    "text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-[#2A2B32] transition-colors text-[#888] hover:text-white",
                                    settings.radius === r && "bg-[#2A2B32] text-white"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
