import React, { useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
// Note: Intentionally avoiding shadcn Switch to match exact custom requirements

interface VideoSettings {
    aspectRatio?: string
    width?: number
    height?: number
    hasLink?: boolean
    videoId?: string
    showControls?: boolean
    hasSound?: boolean
    isLoop?: boolean
    borderWidth?: number
    borderColor?: string
    radius?: number
}

interface VideoSettingsPanelProps {
    settings: VideoSettings
    onUpdate: (settings: VideoSettings) => void
    onClose: () => void
}

const CustomToggle = ({
    checked,
    onCheckedChange
}: {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}) => {
    return (
        <div
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "w-[50px] h-[27px] rounded-full relative cursor-pointer transition-colors duration-200",
                checked ? "bg-[#FF0054]" : "bg-[#515151]"
            )}
        >
            <div
                className={cn(
                    "absolute top-[3px] w-[21px] h-[21px] rounded-full shadow-sm transition-all duration-200",
                    checked ? "left-[26px] bg-[#D9D9D9]" : "left-[3px] bg-[#97A1B3]"
                )}
            />
        </div>
    )
}

export function VideoSettingsPanel({
    settings,
    onUpdate,
    onClose
}: VideoSettingsPanelProps) {
    // Local state for immediate responsiveness, though ideally verified through props
    const [aspectRatio, setAspectRatio] = useState(settings.aspectRatio || '16:9')
    const [hasLink, setHasLink] = useState(settings.hasLink || false)
    const [videoId, setVideoId] = useState(settings.videoId || '')
    const [showControls, setShowControls] = useState(settings.showControls ?? true)
    const [hasSound, setHasSound] = useState(settings.hasSound ?? true)
    const [isLoop, setIsLoop] = useState(settings.isLoop || false)
    const [borderWidth, setBorderWidth] = useState(settings.borderWidth || 0)
    const [borderColor, setBorderColor] = useState(settings.borderColor || '#FFFFFF')
    const [radius, setRadius] = useState(settings.radius || 12)

    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    // Sync local state with settings prop when settings change (e.g., on panel open)
    React.useEffect(() => {
        setAspectRatio(settings.aspectRatio || '16:9')
        setHasLink(settings.hasLink || false)
        setVideoId(settings.videoId || '')
        setShowControls(settings.showControls ?? true)
        setHasSound(settings.hasSound ?? true)
        setIsLoop(settings.isLoop || false)
        setBorderWidth(settings.borderWidth || 0)
        setBorderColor(settings.borderColor || '#FFFFFF')
        setRadius(settings.radius || 12)
        setWidth(settings.width || 640)
        setHeight(settings.height || 360)
    }, [settings])

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragStart])

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
    }

    const update = (updates: Partial<VideoSettings>) => {
        onUpdate({
            ...settings,
            ...updates
        })
    }

    const [width, setWidth] = useState(settings.width || 640)
    const [height, setHeight] = useState(settings.height || 360)

    // Calculate ratio multiplier from aspect ratio string
    const getRatioMultiplier = (ratio: string) => {
        const [w, h] = ratio.split(':').map(Number)
        return { w, h }
    }

    // Update height based on width and aspect ratio
    const handleWidthChange = (newWidth: number) => {
        const { w, h } = getRatioMultiplier(aspectRatio)
        const newHeight = Math.round(newWidth * (h / w))
        setWidth(newWidth)
        setHeight(newHeight)
        update({ width: newWidth, height: newHeight })
    }

    // Update width based on height and aspect ratio
    const handleHeightChange = (newHeight: number) => {
        const { w, h } = getRatioMultiplier(aspectRatio)
        const newWidth = Math.round(newHeight * (w / h))
        setWidth(newWidth)
        setHeight(newHeight)
        update({ width: newWidth, height: newHeight })
    }

    // Update dimensions when aspect ratio changes
    const handleAspectRatioChange = (ratio: string) => {
        setAspectRatio(ratio)
        const { w, h } = getRatioMultiplier(ratio)
        const newHeight = Math.round(width * (h / w))
        setHeight(newHeight)
        update({ aspectRatio: ratio, width, height: newHeight })
    }

    const ratios = ['1:1', '3:2', '4:5', '16:9', '9:16']

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="w-[280px] bg-[#15161B] text-white rounded-lg overflow-hidden shadow-2xl border border-[#333] z-[9999] fixed"
            style={{
                top: 100, // Initial position
                left: '50%', // Centered initially or adjusted as requested
                transform: `translateX(-50%) translate(${position.x}px, ${position.y}px)`
            }}
        >
            {/* Header */}
            <div
                className="bg-[#FF0054] h-[50px] flex items-center justify-between px-4 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <span className="font-semibold text-[15px] select-none">Edit video</span>
                <button
                    onClick={onClose}
                    className="w-[20px] h-[20px] bg-black rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                    <div className="w-full h-full rounded-full bg-black" />
                </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
                {/* Proportions */}
                <div>
                    <div className="flex justify-between items-center mb-3 text-[#A1A1AA] text-sm font-medium">
                        <span>Proporção</span>
                        <div className="flex gap-2 text-xs items-center">
                            <span className="text-[#A1A1AA]">W</span>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                                className="w-[50px] bg-transparent text-white text-center outline-none border border-[#333] rounded px-1 py-0.5 text-xs"
                            />
                            <span className="text-[#A1A1AA]">H</span>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                                className="w-[50px] bg-transparent text-white text-center outline-none border border-[#333] rounded px-1 py-0.5 text-xs"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between w-full">
                        {ratios.map(r => (
                            <button
                                key={r}
                                onClick={() => handleAspectRatioChange(r)}
                                className={cn(
                                    "text-xs font-medium hover:text-white transition-colors",
                                    aspectRatio === r ? "text-white" : "text-[#A1A1AA]"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Link do vídeo */}
                <div className="flex flex-col gap-3 border-t border-[#333] pt-5">
                    <div className="flex items-center justify-between">
                        <span className="text-[#A1A1AA] font-medium text-sm">Link do vídeo</span>
                        <CustomToggle
                            checked={hasLink}
                            onCheckedChange={(c) => {
                                setHasLink(c)
                                update({ hasLink: c })
                            }}
                        />
                    </div>
                    {hasLink && (
                        <input
                            type="text"
                            value={videoId}
                            onChange={(e) => {
                                setVideoId(e.target.value)
                                update({ videoId: e.target.value })
                            }}
                            placeholder="id do vídeo"
                            className="w-full h-[40px] bg-transparent border border-[#333] rounded-[24px] px-4 text-sm text-white placeholder:text-[#A1A1AA] outline-none focus:border-[#666] text-center"
                        />
                    )}
                </div>

                {/* Activar controladores */}
                <div className="flex items-center justify-between border-t border-[#333] pt-5">
                    <span className="text-[#A1A1AA] font-medium text-sm">Activar controladores</span>
                    <CustomToggle
                        checked={showControls}
                        onCheckedChange={(c) => {
                            setShowControls(c)
                            update({ showControls: c })
                        }}
                    />
                </div>

                {/* Activar som */}
                <div className="flex items-center justify-between border-t border-[#333] pt-5">
                    <span className="text-[#A1A1AA] font-medium text-sm">Activar som</span>
                    <CustomToggle
                        checked={hasSound}
                        onCheckedChange={(c) => {
                            setHasSound(c)
                            update({ hasSound: c })
                        }}
                    />
                </div>

                {/* Reprodução em loop */}
                <div className="flex items-center justify-between border-t border-[#333] pt-5">
                    <span className="text-[#A1A1AA] font-medium text-sm">Reprodução em loop</span>
                    <CustomToggle
                        checked={isLoop}
                        onCheckedChange={(c) => {
                            setIsLoop(c)
                            update({ isLoop: c })
                        }}
                    />
                </div>

                {/* Border */}
                <div className="flex items-center justify-between border-t border-[#333] pt-5">
                    <span className="text-[#A1A1AA] font-medium text-sm">Border</span>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            value={borderWidth}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0
                                setBorderWidth(val)
                                update({ borderWidth: val })
                            }}
                            className="bg-transparent text-right w-[40px] text-[#A1A1AA] outline-none border-none text-sm"
                            placeholder="00"
                        />
                        <div className="w-[24px] h-[24px] rounded-full bg-white cursor-pointer relative group">
                            <input
                                type="color"
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                value={borderColor}
                                onChange={(e) => {
                                    setBorderColor(e.target.value)
                                    update({ borderColor: e.target.value })
                                }}
                            />
                            <div className="w-full h-full rounded-full border border-[#333]" style={{ backgroundColor: borderColor }} />
                        </div>
                    </div>
                </div>

                {/* Radius */}
                <div className="flex items-center justify-between pt-2">
                    <span className="text-[#A1A1AA] font-medium text-sm">Radius</span>
                    <input
                        type="number"
                        value={radius}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            setRadius(val)
                            update({ radius: val })
                        }}
                        className="bg-transparent text-right w-[40px] text-[#A1A1AA] outline-none border-none text-sm leading-none"
                        placeholder="00"
                    />
                </div>
            </div>
        </div>
    )
}
