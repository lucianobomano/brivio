"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { Trash2, Link as LinkIcon, Image as ImageIcon, Search, ArrowLeft, ArrowRight, X, Plus, Video, Mic, Grid, Play, Pause, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageToolbar } from "./ImageToolbar"
import { EmptyBlockActions } from "./EmptyBlockActions"
import { UploadAssetDialog } from "../UploadAssetDialog"
import { MediaToolbar } from "../MediaToolbar"
import { MediaSettingsPanel } from "../MediaSettingsPanel"
import { VideoFocalGroup } from "./VideoFocalGroup"
import { VideoSettingsPanel } from "./VideoSettingsPanel"
import { AudioToolbar } from "./AudioToolbar"
import { AudioSettingsPanel } from "./AudioSettingsPanel"
import { AttachmentPopup } from "./AttachmentPopup"
import { useBrandDesign } from "../BrandDesignContext"

interface MediaBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    deleteButtonClassName?: string
}

export const MediaBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, deleteButtonClassName }: MediaBlockProps) => {
    const { url, caption, items, link, style } = block.content || {}
    const { settings, brandId } = useBrandDesign()
    const isActive = activeBlockId === block.id
    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

    // Audio specific state
    const [activeItemIndex, setActiveItemIndex] = React.useState<number | null>(null) // -1 for new, index for existing
    const [activeSettingsIndex, setActiveSettingsIndex] = React.useState<number | null>(null)

    const [uploadMode, setUploadMode] = React.useState<'audio' | 'image' | 'gallery-replace' | 'gallery-attach' | 'gallery-hover' | 'gallery-add'>('audio')
    const [activeGalleryIndex, setActiveGalleryIndex] = React.useState<number | null>(null)
    const [downloadPopupIndex, setDownloadPopupIndex] = React.useState<number | null>(null)
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    const [carouselIndex, setCarouselIndex] = React.useState(0) // Local state for carousel slide

    // Lightbox State
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

    // Cursor Follower State
    const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 })
    const [showDownloadCursor, setShowDownloadCursor] = React.useState(false)
    const [attachmentPopupItem, setAttachmentPopupItem] = React.useState<any | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)

    React.useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            if (showDownloadCursor) {
                setCursorPos({ x: e.clientX, y: e.clientY })
            }
        }
        window.addEventListener('mousemove', moveCursor)
        return () => window.removeEventListener('mousemove', moveCursor)
    }, [showDownloadCursor])

    const handleNext = React.useCallback(() => {
        if (lightboxIndex === null || !items) return
        setLightboxIndex((prev) => (prev === null || prev === items.length - 1 ? 0 : prev + 1))
    }, [lightboxIndex, items])

    const handlePrev = React.useCallback(() => {
        if (lightboxIndex === null || !items) return
        setLightboxIndex((prev) => (prev === null || prev === 0 ? items.length - 1 : prev - 1))
    }, [lightboxIndex, items])

    // Keyboard Navigation for Lightbox
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return

            if (e.key === 'Escape') setLightboxIndex(null)
            if (e.key === 'ArrowLeft') handlePrev()
            if (e.key === 'ArrowRight') handleNext()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [lightboxIndex, handleNext, handlePrev])

    const videoRef = React.useRef<HTMLVideoElement>(null)

    React.useEffect(() => {
        if (style?.isLoop && videoRef.current && url) {
            // Ensure video is muted (required for autoplay in browsers)
            videoRef.current.muted = true
            videoRef.current.play().catch(e => console.log("Autoplay prevented:", e))
        }
    }, [style?.isLoop, url])

    const handleUpload = async (files: File | File[]) => {
        const fileList = Array.isArray(files) ? files : [files]
        if (fileList.length === 0) return

        if (block.type === 'gallery' || block.type === 'carousel') {
            // Handle Single File Upload for Specific Actions
            if (activeGalleryIndex !== null && items?.[activeGalleryIndex]) {
                const file = fileList[0]
                const reader = new FileReader()
                reader.onloadend = () => {
                    const result = reader.result as string
                    const newItems = [...items]
                    const item = newItems[activeGalleryIndex]

                    if (uploadMode === 'gallery-replace') {
                        newItems[activeGalleryIndex] = { ...item, url: result }
                    } else if (uploadMode === 'gallery-hover') {
                        newItems[activeGalleryIndex] = { ...item, hoverImage: result }
                    } else if (uploadMode === 'gallery-attach') {
                        newItems[activeGalleryIndex] = {
                            ...item,
                            attachment: {
                                url: result,
                                name: file.name,
                                size: (file.size / 1024).toFixed(2) + ' KB',
                                type: file.type,
                                date: new Date().toLocaleDateString()
                            }
                        }
                    }

                    onUpdate(block.id, { ...block.content, items: newItems, url: undefined })
                    setActiveGalleryIndex(null)
                    setIsUploadOpen(false)
                }
                reader.readAsDataURL(file)
                return
            }

            // Default Bulk Upload logic
            const promises = fileList.map(file => new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            }))

            const results = await Promise.all(promises)
            const newItems = items ? [...items] : []
            results.forEach(url => newItems.push({ url }))

            onUpdate(block.id, { ...block.content, items: newItems, url: undefined })
            return
        }

        const file = fileList[0]

        // For video files, upload to storage to get permanent URL
        if (block.type === 'video' && file.type.startsWith('video/')) {
            setIsUploading(true)
            try {
                const { uploadBrandbookMedia } = await import('@/app/actions/brandbook')
                const formData = new FormData()
                formData.append('file', file)
                formData.append('brandId', brandId)

                const result = await uploadBrandbookMedia(formData)
                if (result.success && result.url) {
                    onUpdate(block.id, { ...block.content, url: result.url })
                } else {
                    console.error('Video upload failed:', result.error)
                    // Fallback to base64 if upload fails
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        onUpdate(block.id, { ...block.content, url: reader.result as string })
                    }
                    reader.readAsDataURL(file)
                }
            } catch (error) {
                console.error('Video upload error:', error)
                // Fallback to base64 if error
                const reader = new FileReader()
                reader.onloadend = () => {
                    onUpdate(block.id, { ...block.content, url: reader.result as string })
                }
                reader.readAsDataURL(file)
            } finally {
                setIsUploading(false)
            }
            return
        }

        // For other file types, use base64 (images are usually small enough)
        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string

            if (block.type === 'audio') {
                // Audio Block Logic
                let currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])

                if (activeItemIndex === -1 || activeItemIndex === null) {
                    // New Item
                    currentItems.push({
                        url: result,
                        caption: 'Novo Áudio',
                        style: { backgroundType: 'color', backgroundColor: settings.play_audio_bg || '#422600' }
                    })
                } else {
                    // Update Existing Item
                    if (!currentItems[activeItemIndex]) return

                    if (uploadMode === 'audio') {
                        currentItems[activeItemIndex] = { ...currentItems[activeItemIndex], url: result }
                    } else {
                        // Background Image update for specific item
                        currentItems[activeItemIndex] = {
                            ...currentItems[activeItemIndex],
                            style: {
                                ...currentItems[activeItemIndex].style,
                                backgroundImage: result,
                                backgroundType: 'image'
                            }
                        }
                    }
                }

                // Save to block.content.items, clear legacy url
                onUpdate(block.id, { ...block.content, items: currentItems, url: undefined })
                setIsUploadOpen(false)

            } else {
                // Legacy Logic for other types
                if (uploadMode === 'audio') {
                    onUpdate(block.id, { ...block.content, url: result })
                } else {
                    onUpdate(block.id, {
                        ...block.content,
                        style: {
                            ...style,
                            backgroundImage: result,
                            backgroundType: 'image'
                        }
                    })
                }
            }
        }
        reader.readAsDataURL(file)
    }

    const handleAudioItemUpdate = (index: number, newSettings: any) => {
        let currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])
        if (!currentItems[index]) return

        currentItems[index] = {
            ...currentItems[index],
            style: {
                ...currentItems[index].style,
                ...newSettings
            }
        }
        onUpdate(block.id, { ...block.content, items: currentItems, url: undefined })
    }

    const handleAudioCaptionUpdate = (index: number, newCaption: string) => {
        let currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])
        if (!currentItems[index]) return
        currentItems[index] = { ...currentItems[index], caption: newCaption }
        onUpdate(block.id, { ...block.content, items: currentItems, url: undefined })
    }

    const deleteAudioItem = (index: number) => {
        let currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])
        currentItems.splice(index, 1)
        onUpdate(block.id, { ...block.content, items: currentItems, url: undefined })
        setActiveSettingsIndex(null)
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (block.type !== 'video' && block.type !== 'audio') {
            onSelect?.(block.id)
        }

        if (!isReadOnly && block.type !== 'audio') {
            if (url) {
                // Do nothing specific
            } else {
                setUploadMode('audio')
                setIsUploadOpen(true)
            }
        }
    }

    const handleLink = () => {
        const newLink = window.prompt("Enter link URL:", link || "")
        if (newLink !== null) {
            onUpdate(block.id, { ...block.content, link: newLink })
        }
    }

    const handleMove = (dir: 'up' | 'down') => {
        const currentZ = style?.zIndex || 0
        const newZ = dir === 'up' ? currentZ + 1 : Math.max(0, currentZ - 1)
        onUpdate(block.id, { ...block.content, style: { ...style, zIndex: newZ } })
    }

    const handleSettingsUpdate = (newSettings: any) => {
        onUpdate(block.id, {
            ...block.content,
            style: {
                ...style,
                ...newSettings,
                aspectRatio: newSettings.aspectRatio ? newSettings.aspectRatio.replace(':', '/') : undefined,
            }
        })
    }

    // Audio Item Component Helper
    const AudioItemCard = ({ item, index }: { item: any, index: number }) => {
        const itemStyle = item.style || {}
        const [itemPlaying, setItemPlaying] = React.useState(false)
        const itemAudioRef = React.useRef<HTMLAudioElement>(null)
        const isThisSettingsOpen = activeSettingsIndex === index

        return (
            <div
                className="relative w-[256px] h-[296px] group/audio transition-all"
                style={{ border: '0.5px solid transparent' }}
            >
                {/* Toolbar */}
                {!isReadOnly && !isThisSettingsOpen && (
                    <div className="absolute -top-[46px] left-0 w-full flex justify-center z-[50] opacity-0 group-hover/audio:opacity-100 transition-opacity pointer-events-none group-hover/audio:pointer-events-auto">
                        <AudioToolbar
                            onUpload={() => { setActiveItemIndex(index); setUploadMode('audio'); setIsUploadOpen(true) }}
                            onLink={() => {/* Support link if needed */ }}
                            onSelect={() => onSelect?.(block.id)}
                            onSettings={() => setActiveSettingsIndex(index)}
                            onDelete={() => deleteAudioItem(index)}
                        />
                    </div>
                )}

                {/* Settings Panel */}
                {isThisSettingsOpen && (
                    <div className="absolute top-0 left-[105%] z-[200]">
                        <AudioSettingsPanel
                            onClose={() => setActiveSettingsIndex(null)}
                            settings={itemStyle}
                            onUpdate={(s) => handleAudioItemUpdate(index, s)}
                            onUploadAudio={() => { setActiveItemIndex(index); setUploadMode('audio'); setIsUploadOpen(true) }}
                            onUploadImage={() => { setActiveItemIndex(index); setUploadMode('image'); setIsUploadOpen(true) }}
                            onDelete={() => deleteAudioItem(index)}
                        />
                    </div>
                )}

                {/* Inner Content */}
                <div className="w-full h-full rounded-lg overflow-hidden relative bg-white shadow-sm flex flex-col">
                    <div className="absolute inset-0 border border-[#FF0054] opacity-0 group-hover/audio:opacity-100 pointer-events-none z-20 transition-opacity" />

                    <audio
                        ref={itemAudioRef}
                        src={item.url}
                        onPlay={() => setItemPlaying(true)}
                        onPause={() => setItemPlaying(false)}
                        onEnded={() => setItemPlaying(false)}
                        loop={itemStyle.isLoop}
                    />

                    <div
                        className="h-[256px] w-full flex items-center justify-center relative transition-all duration-500 bg-cover bg-center bg-no-repeat shrink-0"
                        style={{
                            ...(!itemPlaying && itemStyle.backgroundType === 'image' && itemStyle.backgroundImage ? {
                                backgroundImage: `url(${itemStyle.backgroundImage})`
                            } : {
                                background: itemPlaying
                                    ? 'linear-gradient(45deg, #FF0054, #88007F, #06D6A0, #311C99)'
                                    : (itemStyle.backgroundColor || settings.play_audio_bg || '#422600')
                            }),
                            backgroundSize: itemPlaying ? '400% 400%' : 'cover',
                            animation: itemPlaying ? 'liquidGradient 10s ease infinite' : 'none'
                        }}
                    >
                        <style>{`
                              @keyframes liquidGradient {
                                  0% { background-position: 0% 50%; }
                                  50% { background-position: 100% 50%; }
                                  100% { background-position: 0% 50%; }
                              }
                          `}</style>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (itemPlaying) itemAudioRef.current?.pause()
                                else itemAudioRef.current?.play()
                            }}
                            className="w-[100px] h-[100px] rounded-full bg-[#FF0054] border-[10px] border-white flex items-center justify-center z-10 hover:scale-105 transition-transform shadow-lg"
                        >
                            {itemPlaying ? (
                                <Pause className="w-8 h-8 text-white fill-white" />
                            ) : (
                                <Play className="w-8 h-8 text-white fill-white ml-2" />
                            )}
                        </button>
                    </div>

                    <div className="h-[40px] w-full px-4 flex items-center justify-center bg-white border-t border-gray-50 relative z-10 shrink-0">
                        <input
                            type="text"
                            value={item.caption || ""}
                            onChange={(e) => handleAudioCaptionUpdate(index, e.target.value)}
                            placeholder="Título do áudio"
                            className="w-full h-full text-sm text-center outline-none bg-transparent placeholder:text-gray-400 text-gray-900 border-none focus:ring-0 p-0 m-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            </div>
        )
    }

    // Placeholder if no content (Other types)
    if (!url && (!items || items.length === 0) && block.type !== 'audio') {
        return (
            <>
                <div
                    className={cn(
                        "w-full h-64 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-gray-50 text-gray-400 group/media relative",
                        !isReadOnly && "hover:border-pink-300 hover:bg-pink-50/10 cursor-pointer",
                        isActive && "border-pink-500 ring-2 ring-pink-500/20"
                    )}
                    onClick={handleClick}
                >
                    {/* Loading Overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-50">
                            <div className="w-10 h-10 border-4 border-[#FF0054] border-t-transparent rounded-full animate-spin mb-3" />
                            <span className="text-[#FF0054] font-medium text-sm">A carregar ficheiro...</span>
                        </div>
                    )}

                    {!isReadOnly && (
                        <EmptyBlockActions
                            onDelete={onDelete ? () => onDelete(block.id) : undefined}
                            className={deleteButtonClassName || "group-hover/media:opacity-100"}
                        />
                    )}

                    {block.type === 'image' && <ImageIcon className={cn("w-12 h-12 mb-2", !isReadOnly && "group-hover:text-pink-500")} />}
                    {block.type === 'video' && <Video className={cn("w-12 h-12 mb-2", !isReadOnly && "group-hover:text-pink-500")} />}
                    {(block.type === 'gallery' || block.type === 'carousel') && <Grid className={cn("w-12 h-12 mb-2", !isReadOnly && "group-hover:text-pink-500")} />}

                    <span className={cn("font-medium", !isReadOnly && "group-hover:text-pink-500")}>
                        Add {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                    </span>
                    {!isReadOnly && <p className="text-xs text-gray-400 mt-2">Click to upload or select from library</p>}
                </div>

                <UploadAssetDialog
                    isOpen={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    onUpload={handleUpload}
                    multiple={block.type === 'gallery' || block.type === 'carousel'}
                />
            </>
        )
    }

    // Helper to format dimension
    const formatDim = (val?: string | number) => {
        if (!val) return undefined;
        const s = String(val);
        return /^\d+$/.test(s) ? `${s}px` : s;
    }

    // Main Render

    // Audio Render Logic
    if (block.type === 'audio') {
        const audioItems = items || (url ? [{ url, caption, style, link }] : [])

        return (
            <div className="w-full max-w-[1296px] mx-auto flex flex-wrap gap-4 items-start justify-center">
                {/* Render Existing Items */}
                {audioItems.map((item: any, i: number) => (
                    <AudioItemCard key={i} item={item} index={i} />
                ))}

                {/* Render Add Item Card - Always Visible */}
                {!isReadOnly && (
                    <div
                        className={cn(
                            "w-[256px] h-[320px] border-[0.5px] border-dashed border-[#97A1B3] rounded-lg flex flex-col items-center justify-center bg-transparent group/media relative transition-all",
                            "hover:border-[#FF0054] cursor-pointer",
                            isActive && audioItems.length === 0 && "border-[#FF0054] ring-2 ring-pink-500/20"
                        )}
                        onClick={(e) => {
                            e.stopPropagation()
                            setActiveItemIndex(-1)
                            setUploadMode('audio')
                            setIsUploadOpen(true)
                        }}
                    >
                        {audioItems.length === 0 && (
                            <EmptyBlockActions
                                onDelete={onDelete ? () => onDelete(block.id) : undefined}
                                className={deleteButtonClassName || "group-hover/media:opacity-100"}
                            />
                        )}
                        <Mic className={cn("w-12 h-12 mb-4 text-[#FF0054]")} />
                        <span className="text-[#97A1B3] font-medium text-lg mb-2">Add Audio</span>
                        <p className="text-[#97A1B3] text-xs text-center px-4 leading-relaxed">Click to upload or select from library</p>
                    </div>
                )}

                <UploadAssetDialog
                    isOpen={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    onUpload={handleUpload}
                />
            </div>
        )
    }

    // Standard Render for Image/Video
    return (
        <div
            className={cn(
                "relative group/media-filled transition-all rounded-lg shrink-0",
                !style?.width && "w-full",
                isActive && !style?.borderWidth && !(block.type === 'gallery' || block.type === 'carousel') && "ring-2 ring-pink-500 shadow-md",
                style?.zIndex ? `z-[${style.zIndex}]` : ""
            )}
            onClick={(e) => {
                e.stopPropagation();
                if (block.type === 'video' && !isReadOnly) {
                    setIsUploadOpen(true)
                } else if (!activeGalleryIndex) { // Only select if not interacting with toolbar
                    onSelect?.(block.id)
                }
            }}
            style={{
                zIndex: style?.zIndex,
                display: 'flex',
                justifyContent: block.type === 'video' ? 'center' : (style?.align === 'center' ? 'center' : style?.align === 'right' ? 'flex-end' : 'flex-start'),
                alignItems: block.type === 'video' ? 'center' : undefined
            }}
        >
            {block.type === 'image' && (
                <div
                    className={cn(
                        "relative overflow-hidden group/image transition-all",
                        !style?.radius && "rounded-lg"
                    )}
                    style={{
                        aspectRatio: style?.aspectRatio,
                        borderColor: style?.borderColor || 'transparent',
                        borderWidth: style?.borderWidth ? `${style.borderWidth}px` : undefined,
                        borderStyle: style?.borderWidth ? 'solid' : undefined,
                        borderRadius: style?.radius ? `${style.radius}px` : undefined,
                        width: formatDim(style?.width) || (style?.align ? 'auto' : '100%'),
                        height: formatDim(style?.height) || 'auto'
                    }}
                >
                    <img
                        src={url}
                        alt={caption || "Block Image"}
                        className={cn(
                            "w-full h-auto object-cover",
                            style?.aspectRatio && "h-full w-full absolute inset-0"
                        )}
                        style={{ objectPosition: 'top' }}
                    />
                    {caption && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">{caption}</div>}
                </div>
            )}

            {block.type === 'video' && (
                <div
                    className="relative overflow-hidden bg-black flex items-center justify-center"
                    style={{
                        width: style?.width ? `${style.width}px` : '100%',
                        height: style?.height ? `${style.height}px` : 'auto',
                        aspectRatio: !style?.height ? (style?.aspectRatio?.replace(':', '/') || '16/9') : undefined,
                        borderRadius: style?.radius ? `${style.radius}px` : '12px',
                        borderWidth: style?.borderWidth ? `${style.borderWidth}px` : '0px',
                        borderColor: style?.borderColor || 'transparent',
                        borderStyle: style?.borderWidth ? 'solid' : undefined
                    }}
                >
                    <video
                        ref={videoRef}
                        src={url}
                        controls={style?.showControls !== false}
                        muted={style?.isLoop || style?.hasSound === false}
                        loop={style?.isLoop}
                        autoPlay={style?.isLoop}
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {block.type === 'gallery' && (() => {
                const has2xItem = items?.some((i: any) => i.is2x)
                return (
                    // ... Existing Gallery Code ...
                    <div
                        className={cn(
                            "gap-[10px] transition-all duration-500 ease-in-out",
                            has2xItem
                                ? "grid grid-cols-2 md:grid-cols-3 auto-rows-[minmax(200px,auto)] grid-flow-dense"
                                : "columns-2 md:columns-4 gap-[10px] space-y-[10px]"
                        )}
                        style={{
                            width: formatDim(style?.width) || (style?.align ? 'auto' : '100%'),
                            height: 'auto'
                        }}
                    >
                        {items?.map((item: any, i: number) => {
                            const showHoverImage = isReadOnly && hoverIndex === i && item.hoverImage
                            const is2x = item.is2x

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "relative bg-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 ease-in-out group/item",
                                        isReadOnly ? "cursor-default" : "cursor-default",
                                        is2x && !isReadOnly ? "ring-2 ring-blue-400" : "",
                                        has2xItem
                                            ? (is2x
                                                ? "col-span-2 row-span-2 w-full h-full"
                                                : "col-span-1 row-span-1 w-full h-full aspect-square md:aspect-auto object-cover"
                                            )
                                            : "break-inside-avoid",
                                        isReadOnly && item.attachment && "cursor-none"
                                    )}
                                    // ... Existing Gallery Logic ...
                                    // ... Existing Gallery Logic ...
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isReadOnly) return

                                        if (item.attachment) {
                                            setAttachmentPopupItem(item)
                                        } else {
                                            setLightboxIndex(i)
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        setHoverIndex(i)
                                        if (isReadOnly && item.attachment) setShowDownloadCursor(true)
                                    }}
                                    onMouseLeave={() => {
                                        setHoverIndex(null)
                                        setShowDownloadCursor(false)
                                    }}
                                >
                                    {!isReadOnly && (
                                        <div className="absolute z-50 top-2 left-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex justify-center pointer-events-none">
                                            <div className="pointer-events-auto shadow-sm">
                                                <ImageToolbar
                                                    onUpload={() => { setActiveGalleryIndex(i); setUploadMode('gallery-replace'); setIsUploadOpen(true) }}
                                                    onAttach={() => { setActiveGalleryIndex(i); setUploadMode('gallery-attach'); setIsUploadOpen(true) }}
                                                    onLink={(url) => {
                                                        const newItems = [...items]
                                                        newItems[i] = { ...newItems[i], link: url }
                                                        onUpdate(block.id, { ...block.content, items: newItems })
                                                    }}
                                                    onHoverImage={() => { setActiveGalleryIndex(i); setUploadMode('gallery-hover'); setIsUploadOpen(true) }}
                                                    onToggle2x={() => {
                                                        const newItems = [...items]
                                                        newItems[i] = { ...newItems[i], is2x: !newItems[i].is2x }
                                                        onUpdate(block.id, { ...block.content, items: newItems })
                                                    }}
                                                    onDelete={() => {
                                                        const newItems = [...items]
                                                        newItems.splice(i, 1)
                                                        onUpdate(block.id, { ...block.content, items: newItems })
                                                    }}
                                                    onSettings={() => { }}
                                                    activeSettings={{
                                                        is2x: item.is2x,
                                                        link: item.link,
                                                        hasAttachment: !!item.attachment
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Main Image (Always rendered to maintain layout) */}
                                    <img
                                        src={item.url}
                                        alt={item.caption || "Gallery image"}
                                        className="w-full h-full object-cover block"
                                    />

                                    {/* Hover Image Overlay */}
                                    {item.hoverImage && (
                                        <div
                                            className={cn(
                                                "absolute inset-0 z-10 transition-opacity duration-500 ease-in-out pointer-events-none",
                                                showHoverImage ? "opacity-100" : "opacity-0"
                                            )}
                                        >
                                            <img
                                                src={item.hoverImage}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    {item.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">{item.caption}</div>}

                                    {/* Mouse Handler Div removed: Logic moved to parent container */}
                                </div>
                            )
                        })}
                    </div>
                )
            })()}

            {/* Custom Download Cursor Portal/Overlay */}
            {showDownloadCursor && (
                <div
                    className="fixed w-[70px] h-[70px] bg-[#ff0054] rounded-full flex items-center justify-center pointer-events-none z-[9999] shadow-lg animate-in fade-in duration-150"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <Download className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
            )}

            {/* Download Attachment Popup */}
            {attachmentPopupItem && (
                <AttachmentPopup
                    isOpen={!!attachmentPopupItem}
                    onClose={() => setAttachmentPopupItem(null)}
                    imageSrc={attachmentPopupItem.url}
                    attachment={attachmentPopupItem.attachment}
                />
            )}

            {block.type === 'carousel' && (() => {
                const currentItem = items && items.length > 0 ? items[carouselIndex] : null
                const totalItems = items?.length || 0

                const handleNext = (e: React.MouseEvent) => {
                    e.stopPropagation()
                    if (carouselIndex < totalItems - 1) {
                        setCarouselIndex(prev => prev + 1)
                    }
                }

                const handlePrev = (e: React.MouseEvent) => {
                    e.stopPropagation()
                    if (carouselIndex > 0) {
                        setCarouselIndex(prev => prev - 1)
                    }
                }

                const handleUploadStart = (e: React.MouseEvent) => {
                    e.stopPropagation()
                    if (!isReadOnly) {
                        setUploadMode('gallery-add') // Or specific mode to prepend?
                        // For now we just open upload, but we need to know WHERE.
                        // Assuming 'gallery-add' appends. To prepend, we might need a new mode or logic.
                        // User request: "Upload asset". Let's use existing add flow for now or adapt.
                        // Ideally we prepend.
                        setIsUploadOpen(true)
                    }
                }

                // Helper to handle adding at specific index if supported, or just open generic upload
                // User requirement: "Plus" button -> "Upload asset" popup.

                return (
                    <div
                        className="group/carousel relative w-full bg-black/5"
                        style={{ aspectRatio: '16/9' }}
                    >
                        <div className="w-full h-full overflow-hidden relative">
                            <AnimatePresence>
                                {currentItem && (
                                    <motion.div
                                        key={carouselIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="absolute inset-0 w-full h-full"
                                    >
                                        <img
                                            src={currentItem.url}
                                            alt={currentItem.caption || "Carousel Slide"}
                                            className="w-full h-full object-cover"
                                        />
                                        {currentItem.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-sm z-10">
                                                {currentItem.caption}
                                            </div>
                                        )}
                                        {/* Edit Toolbar for current slide */}
                                        {!isReadOnly && (
                                            <div className="absolute z-50 top-4 right-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                                                <ImageToolbar
                                                    onUpload={() => { setActiveGalleryIndex(carouselIndex); setUploadMode('gallery-replace'); setIsUploadOpen(true) }}
                                                    onAttach={() => { setActiveGalleryIndex(carouselIndex); setUploadMode('gallery-attach'); setIsUploadOpen(true) }}
                                                    onLink={(url) => {
                                                        const newItems = [...items]
                                                        newItems[carouselIndex] = { ...newItems[carouselIndex], link: url }
                                                        onUpdate(block.id, { ...block.content, items: newItems })
                                                    }}
                                                    onHoverImage={() => { setActiveGalleryIndex(carouselIndex); setUploadMode('gallery-hover'); setIsUploadOpen(true) }}
                                                    onToggle2x={() => { }} // Not applicable for mono-slide carousel
                                                    onDelete={() => {
                                                        const newItems = [...items]
                                                        newItems.splice(carouselIndex, 1)
                                                        if (carouselIndex >= newItems.length) setCarouselIndex(Math.max(0, newItems.length - 1))
                                                        onUpdate(block.id, { ...block.content, items: newItems })
                                                    }}
                                                    onSettings={() => { }}
                                                    activeSettings={{
                                                        link: currentItem.link,
                                                        is2x: false,
                                                        hasAttachment: !!currentItem.attachment,
                                                        hasHoverImage: !!currentItem.hoverImage
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                        {/* Navigation Controls - Visible on Hover */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-between z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
                            {/* Left Control */}
                            <div className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                                {carouselIndex === 0 ? (
                                    <button
                                        onClick={() => { setIsUploadOpen(true); setUploadMode('gallery-add'); }}
                                        className="w-[80px] h-[80px] rounded-full bg-[#FF0054] flex items-center justify-center text-white shadow-lg hover:bg-[#D90048] transition-colors"
                                    >
                                        <Plus className="w-8 h-8" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePrev}
                                        className="w-[80px] h-[80px] rounded-full bg-[#FF0054] text-white flex items-center justify-center hover:bg-[#D90048] transition-colors shadow-lg"
                                    >
                                        <ArrowLeft className="w-8 h-8" />
                                    </button>
                                )}
                            </div>

                            {/* Right Control */}
                            <div className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                                {carouselIndex === totalItems - 1 ? (
                                    <button
                                        onClick={() => { setIsUploadOpen(true); setUploadMode('gallery-add'); }}
                                        className="w-[80px] h-[80px] rounded-full bg-[#FF0054] flex items-center justify-center text-white shadow-lg hover:bg-[#D90048] transition-colors"
                                    >
                                        <Plus className="w-8 h-8" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNext}
                                        className="w-[80px] h-[80px] rounded-full bg-[#FF0054] text-white flex items-center justify-center hover:bg-[#D90048] transition-colors shadow-lg"
                                    >
                                        <ArrowRight className="w-8 h-8" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Empty State */}
                        {
                            (!items || items.length === 0) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                                    <span>No images</span>
                                </div>
                            )
                        }
                    </div >
                )
            })()}

            {/* Download Popup for Preview Mode */}
            {
                downloadPopupIndex !== null && items?.[downloadPopupIndex] && (
                    <div className="fixed inset-0 z-[10000] bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setDownloadPopupIndex(null)}>
                        <div className="w-full max-w-4xl h-full flex flex-col relative" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="h-14 flex items-center justify-between border-b px-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4" /></span>
                                    {items[downloadPopupIndex].attachment?.name || 'File Preview'}
                                </div>
                                <button onClick={() => setDownloadPopupIndex(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                                <img
                                    src={items[downloadPopupIndex].url}
                                    className="max-w-full max-h-[70vh] shadow-xl rounded-lg object-contain"
                                />
                            </div>

                            {/* Footer / Download Action */}
                            <div className="p-6 bg-white border-t flex flex-col items-center justify-center gap-4">
                                <div className="text-center">
                                    <h3 className="text-lg font-medium">{items[downloadPopupIndex].attachment?.name || 'Asset'}</h3>
                                    <p className="text-sm text-gray-500">
                                        {items[downloadPopupIndex].attachment?.size} • {items[downloadPopupIndex].attachment?.dimensions || 'Original Size'}
                                    </p>
                                </div>
                                <button
                                    className="relative bg-[#111] text-white px-8 py-3 rounded-full font-medium hover:bg-black transition-all flex items-center gap-2 group/btn"
                                    onClick={() => {
                                        // Trigger download
                                        const a = document.createElement('a')
                                        a.href = items[downloadPopupIndex].attachment?.url
                                        a.download = items[downloadPopupIndex].attachment?.name
                                        a.click()
                                    }}
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin hidden" /> {/* Loader? */}
                                    Open in asset library

                                    {/* Hover Focal Group (Point 2 - Image 3) */}
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#111116] text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Click to download
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111116] rotate-45 transform -translate-y-1"></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Lightbox Overlay */}
            {
                lightboxIndex !== null && items && (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
                        onClick={() => setLightboxIndex(null)}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 z-[10000] text-white/70 hover:text-white transition-colors"
                            onClick={() => setLightboxIndex(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Nav Buttons */}
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-[10000] text-white/70 hover:text-white transition-colors p-2"
                            onClick={(e) => { e.stopPropagation(); handlePrev() }}
                        >
                            <ChevronLeft className="w-10 h-10" />
                        </button>

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-[10000] text-white/70 hover:text-white transition-colors p-2"
                            onClick={(e) => { e.stopPropagation(); handleNext() }}
                        >
                            <ChevronRight className="w-10 h-10" />
                        </button>

                        {/* Main Image */}
                        <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={items[lightboxIndex]?.url}
                                className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                            />
                            <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm font-medium">
                                {lightboxIndex + 1} / {items.length}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                !isReadOnly && (
                    <>
                        {!isSettingsOpen && (
                            <div className="opacity-0 group-hover/media-filled:opacity-100 transition-opacity duration-200 z-[100] absolute top-0 left-0 w-full flex justify-center h-0">
                                {block.type === 'video' ? (
                                    <div
                                        className="absolute -top-12 z-50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <VideoFocalGroup
                                            onChange={() => setIsUploadOpen(true)}
                                            onUpload={() => setIsUploadOpen(true)}
                                            onLink={handleLink}
                                            onSelect={() => onSelect?.(block.id)}
                                            onSettings={() => setIsSettingsOpen(true)}
                                            onDelete={onDelete ? () => onDelete(block.id) : () => { }}
                                        />
                                    </div>
                                ) : (
                                    <MediaToolbar
                                        onUpload={() => setIsUploadOpen(true)}
                                        onDelete={onDelete ? () => onDelete(block.id) : undefined}
                                        onLink={handleLink}
                                        onSelect={() => onSelect?.(block.id)}
                                        onMoveUp={() => handleMove('up')}
                                        onMoveDown={() => handleMove('down')}
                                        onSettings={() => setIsSettingsOpen(true)}
                                    />
                                )}
                            </div>
                        )}

                        {isSettingsOpen && (
                            <>
                                {block.type === 'video' ? (
                                    <VideoSettingsPanel
                                        onClose={() => setIsSettingsOpen(false)}
                                        settings={style || {}}
                                        onUpdate={handleSettingsUpdate}
                                    />
                                ) : (
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[200]">
                                        <MediaSettingsPanel
                                            onClose={() => setIsSettingsOpen(false)}
                                            settings={style || {}}
                                            onUpdate={handleSettingsUpdate}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )
            }

            <UploadAssetDialog
                isOpen={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                onUpload={handleUpload}
                multiple={block.type === 'gallery' || block.type === 'carousel'}
            />
        </div >
    )
}
