import { X, AlignLeft, AlignCenter, AlignRight, RotateCcw, Grid, Layout } from "lucide-react"
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
        galleryType?: 'grid' | 'masonry' | 'carousel'
        columns?: number
    }
    onUpdate: (settings: Partial<MediaSettingsPanelProps['settings']>) => void
    className?: string
    blockType?: string
}

export const MediaSettingsPanel = ({ onClose, settings, onUpdate, className, blockType }: MediaSettingsPanelProps) => {

    // Ratios: 1:1, 3:2, 4:3, 5:4, 7:5, 16:9, 9:16, 4:5
    const ratios = ['1:1', '3:2', '4:3', '5:4', '7:5', '16:9', '9:16', '4:5']
    // Border widths: 1, 3, 5, 8, 10
    const borderWeights = [1, 3, 5, 8, 10]
    // Radius: 1, 3, 5, 10, 20
    const radii = [1, 3, 5, 10, 20]
    // Columns: 1 to 6
    const columnsOptions = [1, 2, 3, 4, 5, 6]

    const isGallery = blockType === 'gallery' || blockType === 'carousel'

    return (
        <div className={cn("w-[280px] bg-[#15161B] rounded-[8px] overflow-hidden shadow-2xl flex flex-col text-white font-sans text-sm z-[200]", className)}>
            {/* Header */}
            <div className="h-[48px] bg-[#FF0054] px-4 flex items-center justify-between shrink-0">
                <span className="font-medium text-[15px]">Edit {isGallery ? 'gallery' : 'image'}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose() }}
                    className="w-6 h-6 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors"
                >
                    <X className="w-3.5 h-3.5 text-white" />
                </button>
            </div>

            <div className="p-5 flex flex-col gap-5 max-h-[600px] overflow-y-auto custom-scrollbar">

                {/* 0. Tipo de Galeria (Only for Galleries) */}
                {isGallery && (
                    <>
                        {/* Gallery Type */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Tipo de galeria</span>
                            <div className="flex items-center gap-1 bg-[#2A2B32]/50 p-1 rounded-md">
                                {[
                                    { id: 'grid', label: 'Grid', icon: Grid },
                                    { id: 'masonry', label: 'Masonry', icon: Layout },
                                    { id: 'carousel', label: 'Carousel', icon: RotateCcw }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, galleryType: type.id }) }}
                                        className={cn(
                                            "flex-1 flex flex-col items-center gap-1 py-2 rounded transition-all",
                                            (settings.galleryType === type.id || (!settings.galleryType && type.id === 'masonry' && blockType === 'gallery') || (!settings.galleryType && type.id === 'carousel' && blockType === 'carousel'))
                                                ? "bg-[#FF0054] text-white"
                                                : "text-[#888] hover:text-white"
                                        )}
                                    >
                                        <type.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Columns Selection (Only for Grid and Masonry) */}
                        {(settings.galleryType !== 'carousel' && (settings.galleryType || blockType === 'gallery')) && (
                            <div className="flex flex-col gap-2 mt-2">
                                <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Colunas</span>
                                <div className="flex justify-between px-1 bg-[#2A2B32]/30 p-1 rounded-md">
                                    {columnsOptions.map(c => (
                                        <button
                                            key={c}
                                            onClick={(e) => { e.stopPropagation(); onUpdate({ ...settings, columns: c }) }}
                                            className={cn(
                                                "w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold transition-all",
                                                (settings.columns === c || (!settings.columns && c === 4))
                                                    ? "bg-[#FF0054] text-white"
                                                    : "text-[#888] hover:text-white hover:bg-[#2A2B32]"
                                            )}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-[#333] w-full mt-1" />
                    </>
                )}

                {/* 1. Alinhamento */}
                <div className="flex flex-col gap-2">
                    <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Alinhamento</span>
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
                        <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Proporção</span>
                        <RotateCcw
                            className="w-3.5 h-3.5 text-[#888] cursor-pointer hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUpdate({ ...settings, aspectRatio: undefined, width: undefined, height: undefined })
                            }}
                        />
                    </div>

                    {/* Width/Height Inputs - Only for non-gallery or specific needs? User said "all images assume same ratio". */}
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextRatio = settings.aspectRatio === r ? undefined : r
                                    onUpdate({ ...settings, aspectRatio: nextRatio, width: undefined, height: undefined })
                                }}
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
                    <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Cor da borda</span>
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
                        <div className="flex items-center gap-3">
                            <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Peso do contorno</span>
                            <div
                                className={cn(
                                    "w-[32px] h-[18px] rounded-[999px] relative cursor-pointer transition-colors",
                                    (settings.borderWidth !== undefined && settings.borderWidth > 0) ? "bg-[#FF0054]" : "bg-[#3F3F46]"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onUpdate({
                                        ...settings,
                                        borderWidth: (settings.borderWidth !== undefined && settings.borderWidth > 0) ? 0 : (settings.borderWidth || 2)
                                    })
                                }}
                            >
                                <div className={cn(
                                    "w-[14px] h-[14px] bg-white rounded-full absolute top-[2px] shadow-sm transition-all",
                                    (settings.borderWidth !== undefined && settings.borderWidth > 0) ? "right-[2px]" : "left-[2px]"
                                )} />
                            </div>
                        </div>
                        <RotateCcw
                            className="w-3.5 h-3.5 text-[#888] cursor-pointer hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                onUpdate({ ...settings, borderWidth: 0 })
                            }}
                        />
                    </div>
                    <div className={cn(
                        "flex justify-between px-1 transition-all",
                        (!settings.borderWidth || settings.borderWidth <= 0) && "opacity-30 pointer-events-none"
                    )}>
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
                    <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Raio</span>
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
