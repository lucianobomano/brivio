"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { ImageIcon, ArrowLeft, ArrowRight, X, Plus, Video, Mic, Grid, Play, Pause, ChevronLeft, ChevronRight, Download } from 'lucide-react'
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

import * as PopoverPrimitive from "@radix-ui/react-popover"

interface MediaBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onAnimate?: () => void
    deleteButtonClassName?: string
    isFreeFlow?: boolean
}

export const MediaBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onAnimate, deleteButtonClassName }: MediaBlockProps) => {
    const { url, caption, items, link, style } = block.content || {}
    const { settings, brandId } = useBrandDesign()
    const isActive = activeBlockId === block.id
    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    // Audio specific state
    const [activeItemIndex, setActiveItemIndex] = React.useState<number | null>(null) // -1 for new, index for existing
    const [activeSettingsIndex, setActiveSettingsIndex] = React.useState<number | null>(null)

    const [activeGalleryIndex, setActiveGalleryIndex] = React.useState<number | null>(null)
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    const [carouselIndex, setCarouselIndex] = React.useState(0) // Local state for carousel slide

    // Lightbox State
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

    // Cursor Follower State
    const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 })
    const [showDownloadCursor, setShowDownloadCursor] = React.useState(false)
    const [attachmentPopupItem, setAttachmentPopupItem] = React.useState<any | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [uploadMode, setUploadMode] = React.useState<'upload' | 'url' | 'library' | 'image' | 'video' | 'audio' | 'gallery-add' | 'gallery-replace' | 'gallery-hover' | 'gallery-attach' | null>(null)

    // Media resize state (unified for image and video)
    const [isResizing, setIsResizing] = React.useState(false)
    const mediaContainerRef = React.useRef<HTMLDivElement>(null)
    const resizeStartPosRef = React.useRef({ x: 0, y: 0 })
    const resizeStartSizeRef = React.useRef({ width: 0, height: 0 })



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

    // Upload using signed URL for direct browser-to-Supabase upload (bypasses Next.js body limits)
    const uploadViaAPI = async (file: File, fileBrandId: string, fileModuleId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
        try {
            console.log('[MediaBlock] Getting signed URL for:', file.name, 'size:', file.size)

            // Step 1: Get a signed upload URL from our API
            const signedUrlResponse = await fetch('/api/upload/brandbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId: fileBrandId,
                    moduleId: fileModuleId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                }),
            })

            const signedData = await signedUrlResponse.json()

            if (!signedData.success) {
                console.error('[MediaBlock] Failed to get signed URL:', signedData.error)
                return { success: false, error: signedData.error }
            }

            console.log('[MediaBlock] Got signed URL, uploading directly to Supabase...')

            // Step 2: Upload directly to Supabase using the signed URL
            const uploadResponse = await fetch(signedData.signedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            })

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text()
                console.error('[MediaBlock] Direct upload failed:', errorText)
                return { success: false, error: `Upload falhou: ${uploadResponse.status}` }
            }

            console.log('[MediaBlock] Upload successful! Public URL:', signedData.publicUrl)
            return { success: true, url: signedData.publicUrl }

        } catch (error) {
            console.error('[MediaBlock] Upload error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Erro de rede' }
        }
    }

    const handleUpload = async (files: File | File[]) => {
        const fileList = Array.isArray(files) ? files : [files]
        if (fileList.length === 0) return

        console.log('[MediaBlock] handleUpload started. Block type:', block.type, 'Files count:', fileList.length, 'Mode:', uploadMode)

        if (block.type === 'gallery' || block.type === 'carousel') {
            // Handle Single File Upload for Specific Actions (Replace, Hover, Attach)
            if (activeGalleryIndex !== null && items?.[activeGalleryIndex]) {
                const file = fileList[0]
                setIsUploading(true)
                try {
                    const result = await uploadViaAPI(file, brandId, block.id)
                    if (result.success && result.url) {
                        const urlResult = result.url
                        const newItems = [...items]
                        const item = newItems[activeGalleryIndex]

                        if (uploadMode === 'gallery-replace') {
                            newItems[activeGalleryIndex] = { ...item, url: urlResult }
                        } else if (uploadMode === 'gallery-hover') {
                            newItems[activeGalleryIndex] = { ...item, hoverImage: urlResult }
                        } else if (uploadMode === 'gallery-attach') {
                            newItems[activeGalleryIndex] = {
                                ...item,
                                attachment: {
                                    url: urlResult,
                                    name: file.name,
                                    size: (file.size / 1024).toFixed(2) + ' KB',
                                    type: file.type,
                                    date: new Date().toLocaleDateString()
                                }
                            }
                        }

                        onUpdate(block.id, { ...block.content, items: newItems, url: undefined })
                    } else {
                        console.error('Failed to upload gallery item component:', result.error)
                        alert('Erro ao carregar componente da galeria.')
                    }
                } catch (err) {
                    console.error('Error in gallery item upload:', err)
                } finally {
                    setActiveGalleryIndex(null)
                    setIsUploadOpen(false)
                    setIsUploading(false)
                }
                return
            }

            // Default Bulk Upload logic
            // Default Bulk Upload logic
            setIsUploading(true)
            try {
                const results = []
                for (const file of fileList) {
                    const result = await uploadViaAPI(file, brandId, block.id)
                    if (result.success && result.url) {
                        results.push(result.url)
                    }
                }

                console.log('[MediaBlock] Bulk upload results:', results.length)
                const newItems = items ? [...items] : []
                results.forEach(url => newItems.push({ url }))

                console.log('[MediaBlock] Calling onUpdate for gallery with', newItems.length, 'items')
                onUpdate(block.id, { ...block.content, items: newItems, url: undefined })
            } catch (err) {
                console.error('[MediaBlock] Gallery upload error:', err)
                alert('Erro ao carregar galeria.')
            } finally {
                setIsUploading(false)
            }
            return
        }

        const file = fileList[0]
        setIsUploading(true)

        try {
            const result = await uploadViaAPI(file, brandId, block.id)

            if (result.success && result.url) {
                const urlResult = result.url

                if (block.type === 'audio') {
                    // Audio Block Logic
                    const currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])

                    if (activeItemIndex === -1 || activeItemIndex === null) {
                        // New Item
                        currentItems.push({
                            url: urlResult,
                            caption: 'Novo Áudio',
                            style: { backgroundType: 'color', backgroundColor: settings.play_audio_bg || '#422600' }
                        })
                    } else {
                        // Update Existing Item
                        if (!currentItems[activeItemIndex]) return

                        if (uploadMode === 'audio') {
                            currentItems[activeItemIndex] = { ...currentItems[activeItemIndex], url: urlResult }
                        } else {
                            // Background Image update for specific item
                            currentItems[activeItemIndex] = {
                                ...currentItems[activeItemIndex],
                                style: {
                                    ...currentItems[activeItemIndex].style,
                                    backgroundImage: urlResult,
                                    backgroundType: 'image'
                                }
                            }
                        }
                    }

                    // Save to block.content.items, clear legacy url
                    onUpdate(block.id, { ...block.content, items: currentItems, url: undefined })
                    setIsUploadOpen(false)

                } else {
                    // Standard image/video update - update the block URL while preserving style (dimensions)
                    console.log('[MediaBlock] Standard update (image/video). URL:', urlResult)
                    console.log('[MediaBlock] uploadMode:', uploadMode, 'block.type:', block.type)
                    console.log('[MediaBlock] Preserving style:', style)

                    // For image and video blocks, always update the url while preserving existing style
                    if (block.type === 'image' || block.type === 'video' || uploadMode === 'image' || uploadMode === 'video') {
                        console.log('[MediaBlock] Updating block with new URL, preserving dimensions')
                        onUpdate(block.id, {
                            ...block.content,
                            url: urlResult,
                            style: style // Explicitly preserve style including width/height
                        })
                        setIsUploadOpen(false)
                    }
                }
            } else {
                console.error('Upload failed:', result.error)
                alert('Falha no upload do ficheiro: ' + (result.error || 'Erro desconhecido'))
            }
        } catch (error) {
            console.error('Upload error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
            // Check if it's a file size related error
            if (errorMessage.includes('size') || errorMessage.includes('large') || errorMessage.includes('413')) {
                alert('O ficheiro é demasiado grande. O limite máximo é 50MB.')
            } else {
                alert(`Erro durante o upload: ${errorMessage}`)
            }
        } finally {
            setIsUploading(false)
        }
    }

    const handleAudioItemUpdate = (index: number, newSettings: any) => {
        const currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])
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
        const currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])
        if (!currentItems[index]) return
        currentItems[index] = { ...currentItems[index], caption: newCaption }
        onUpdate(block.id, { ...block.content, items: currentItems, url: undefined })
    }

    const deleteAudioItem = (index: number) => {
        const currentItems = items ? [...items] : (url ? [{ url, caption, style, link }] : [])
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
                // Do nothing specific when there's already content
            } else {
                // Set correct upload mode based on block type
                if (block.type === 'video') {
                    setUploadMode('video')
                } else if (block.type === 'image') {
                    setUploadMode('image')
                } else if (block.type === 'gallery' || block.type === 'carousel') {
                    setUploadMode('gallery-add')
                } else {
                    setUploadMode('image') // Default fallback
                }
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
                            onAnimate={onAnimate}
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
                        isActive && !isReadOnly && "border-pink-500 ring-2 ring-pink-500/20"
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
            <div className="w-full flex flex-wrap gap-4 items-start justify-center">
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

    // Gallery / Carousel Preparations
    const actualGalleryType = style?.galleryType || (block.type === 'carousel' ? 'carousel' : 'masonry')
    const isMasonry = actualGalleryType === 'masonry'
    const globalAspectRatio = isMasonry ? undefined : style?.aspectRatio
    const numCols = style?.columns || 4
    const has2xItem = items?.some((i: any) => i.is2x)

    // Column Class Mapping
    const gridColsClass = {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-2 lg:grid-cols-5",
        6: "grid-cols-3 lg:grid-cols-6"
    }[numCols as 1 | 2 | 3 | 4 | 5 | 6] || "grid-cols-2 lg:grid-cols-4"

    const masonryColsClass = {
        1: "columns-1",
        2: "columns-2",
        3: "columns-2 lg:columns-3",
        4: "columns-2 lg:columns-4",
        5: "columns-2 lg:columns-5",
        6: "columns-3 lg:columns-6"
    }[numCols as 1 | 2 | 3 | 4 | 5 | 6] || "columns-2 lg:columns-4"

    const handleNextCarousel = (e: React.MouseEvent) => {
        e.stopPropagation()
        const totalItems = items?.length || 0
        if (carouselIndex < totalItems - 1) {
            setCarouselIndex(prev => prev + 1)
        } else {
            setCarouselIndex(0) // Loop back
        }
    }

    const handlePrevCarousel = (e: React.MouseEvent) => {
        e.stopPropagation()
        const totalItems = items?.length || 0
        if (carouselIndex > 0) {
            setCarouselIndex(prev => prev - 1)
        } else {
            setCarouselIndex(totalItems - 1) // Loop to end
        }
    }

    // Standard Render for Image/Video/Gallery/Carousel
    return (
        <>
            <div
                className={cn(
                    "relative group/media-filled transition-all",
                    !isReadOnly && isActive && !style?.borderWidth && !(block.type === 'gallery' || block.type === 'carousel') && "ring-2 ring-pink-500 shadow-md",
                    isActive && "z-50"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!activeGalleryIndex) {
                        onSelect?.(block.id)
                    }
                }}
                style={{
                    display: 'flex',
                    justifyContent: (style?.align === 'center' ? 'center' : style?.align === 'right' ? 'flex-end' : 'flex-start'),
                    width: (block.type === 'image' || block.type === 'video') && style?.width ? `${style.width}px` : (style?.align ? 'auto' : '100%'),
                    maxWidth: '100%'
                }}
            >
                {/* Standard Image / Video Rendering */}
                {(block.type === 'image' || block.type === 'video') ? (() => {
                    const handleResizeStart = (e: React.MouseEvent, type: string) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsResizing(true)
                        resizeStartPosRef.current = { x: e.clientX, y: e.clientY }

                        const rect = mediaContainerRef.current?.getBoundingClientRect()
                        if (rect) {
                            resizeStartSizeRef.current = { width: rect.width, height: rect.height }
                        }

                        const handleMouseMove = (moveE: MouseEvent) => {
                            if (!mediaContainerRef.current) return

                            const deltaX = moveE.clientX - resizeStartPosRef.current.x
                            const deltaY = moveE.clientY - resizeStartPosRef.current.y
                            let newWidth = resizeStartSizeRef.current.width
                            let newHeight = resizeStartSizeRef.current.height
                            const aspectRatio = resizeStartSizeRef.current.width / resizeStartSizeRef.current.height

                            if (type === 'se') {
                                newWidth = Math.max(50, resizeStartSizeRef.current.width + deltaX)
                                newHeight = newWidth / aspectRatio
                            } else if (type === 'sw') {
                                newWidth = Math.max(50, resizeStartSizeRef.current.width - deltaX)
                                newHeight = newWidth / aspectRatio
                            } else if (type === 'ne') {
                                newWidth = Math.max(50, resizeStartSizeRef.current.width + deltaX)
                                newHeight = newWidth / aspectRatio
                            } else if (type === 'nw') {
                                newWidth = Math.max(50, resizeStartSizeRef.current.width - deltaX)
                                newHeight = newWidth / aspectRatio
                            } else if (type === 'e') {
                                newWidth = Math.max(50, resizeStartSizeRef.current.width + deltaX)
                            } else if (type === 'w') {
                                newWidth = Math.max(50, resizeStartSizeRef.current.width - deltaX)
                            } else if (type === 's') {
                                newHeight = Math.max(50, resizeStartSizeRef.current.height + deltaY)
                            } else if (type === 'n') {
                                newHeight = Math.max(50, resizeStartSizeRef.current.height - deltaY)
                            }

                            onUpdate(block.id, {
                                ...block.content,
                                style: {
                                    ...style,
                                    width: Math.round(newWidth),
                                    height: Math.round(newHeight)
                                }
                            })
                        }

                        const handleMouseUp = () => {
                            setIsResizing(false)
                            document.removeEventListener('mousemove', handleMouseMove)
                            document.removeEventListener('mouseup', handleMouseUp)
                        }

                        document.addEventListener('mousemove', handleMouseMove)
                        document.addEventListener('mouseup', handleMouseUp)
                    }

                    const handleBaseClass = cn(
                        "absolute bg-white border-2 border-[#FF0054] z-50 opacity-0 transition-opacity",
                        isActive && "group-hover/media-filled:opacity-100"
                    )
                    const cornerSize = "w-3 h-3 rounded-full"
                    const sideSize = "w-2 h-6 rounded-full"
                    const sideHSize = "w-6 h-2 rounded-full"

                    return (
                        <div
                            ref={mediaContainerRef}
                            className={cn(
                                "relative overflow-visible transition-all w-full",
                                isResizing && "select-none"
                            )}
                            style={{
                                aspectRatio: (!style?.width && !style?.height) ? (block.type === 'video' ? (style?.aspectRatio?.replace(':', '/') || '16/9') : style?.aspectRatio) : undefined,
                                borderColor: style?.borderColor || 'transparent',
                                borderWidth: style?.borderWidth ? `${style.borderWidth}px` : (block.type === 'video' ? '0px' : undefined),
                                borderStyle: style?.borderWidth ? 'solid' : undefined,
                                borderRadius: style?.radius ? `${style.radius}px` : (block.type === 'video' ? '12px' : undefined),
                                width: style?.width ? `${style.width}px` : (style?.align ? 'auto' : '100%'),
                                height: style?.height ? `${style.height}px` : 'auto',
                                backgroundColor: block.type === 'video' ? 'black' : undefined,
                                display: block.type === 'video' ? 'flex' : undefined,
                                alignItems: block.type === 'video' ? 'center' : undefined,
                                justifyContent: block.type === 'video' ? 'center' : undefined,
                            }}
                        >
                            {block.type === 'image' ? (
                                <img
                                    src={url || ""}
                                    alt={caption || "Block Image"}
                                    className={cn(
                                        "w-full h-full object-cover",
                                        style?.aspectRatio && !style?.width && !style?.height && "absolute inset-0"
                                    )}
                                    style={{
                                        objectPosition: 'top',
                                        borderRadius: style?.radius ? `${style.radius}px` : undefined
                                    }}
                                    draggable={false}
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    src={url}
                                    controls={style?.showControls !== false}
                                    muted={style?.isLoop || style?.hasSound === false}
                                    loop={style?.isLoop}
                                    autoPlay={style?.isLoop}
                                    playsInline
                                    className="w-full h-full object-cover"
                                    style={{
                                        borderRadius: style?.radius ? `${style.radius}px` : '12px'
                                    }}
                                />
                            )}
                            {caption && block.type === 'image' && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm break-words">{caption}</div>}

                            {!isReadOnly && (
                                <>
                                    <div className={cn(handleBaseClass, cornerSize, "cursor-nwse-resize -top-1.5 -left-1.5")} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                                    <div className={cn(handleBaseClass, cornerSize, "cursor-nesw-resize -top-1.5 -right-1.5")} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                                    <div className={cn(handleBaseClass, cornerSize, "cursor-nesw-resize -bottom-1.5 -left-1.5")} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                                    <div className={cn(handleBaseClass, cornerSize, "cursor-nwse-resize -bottom-1.5 -right-1.5")} onMouseDown={(e) => handleResizeStart(e, 'se')} />
                                    <div className={cn(handleBaseClass, sideHSize, "cursor-ns-resize -top-1 left-1/2 -translate-x-1/2")} onMouseDown={(e) => handleResizeStart(e, 'n')} />
                                    <div className={cn(handleBaseClass, sideHSize, "cursor-ns-resize -bottom-1 left-1/2 -translate-x-1/2")} onMouseDown={(e) => handleResizeStart(e, 's')} />
                                    <div className={cn(handleBaseClass, sideSize, "cursor-ew-resize -left-1 top-1/2 -translate-y-1/2")} onMouseDown={(e) => handleResizeStart(e, 'w')} />
                                    <div className={cn(handleBaseClass, sideSize, "cursor-ew-resize -right-1 top-1/2 -translate-y-1/2")} onMouseDown={(e) => handleResizeStart(e, 'e')} />
                                </>
                            )}
                        </div>
                    )
                })() : null}

                {/* Gallery / Carousel Rendering */}
                {(block.type === 'gallery' || block.type === 'carousel') ? (() => {
                    const totalItems = items?.length || 0

                    if (actualGalleryType === 'carousel') {
                        const currentItem = items && items.length > 0 ? items[carouselIndex] : null

                        return (
                            <div className="group/carousel relative w-full bg-black/5" style={{ aspectRatio: globalAspectRatio || '16/9' }}>
                                <div className="w-full h-full overflow-hidden relative">
                                    <AnimatePresence mode="wait">
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
                                                    style={{ aspectRatio: globalAspectRatio }}
                                                />
                                                {currentItem.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-sm z-10 break-words">{currentItem.caption}</div>
                                                )}
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
                                                            onToggle2x={() => { }}
                                                            onDelete={() => {
                                                                const newItems = [...items]
                                                                newItems.splice(carouselIndex, 1)
                                                                if (carouselIndex >= newItems.length) setCarouselIndex(Math.max(0, newItems.length - 1))
                                                                onUpdate(block.id, { ...block.content, items: newItems })
                                                            }}
                                                            onSettings={() => { }}
                                                            onAnimate={onAnimate}
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

                                <div className="absolute inset-0 pointer-events-none flex items-center justify-between z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
                                    <div className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                                        <button
                                            onClick={handlePrevCarousel}
                                            className="w-[80px] h-[80px] rounded-full bg-[#FF0054] text-white flex items-center justify-center hover:bg-[#D90048] transition-colors shadow-lg"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                                        <button
                                            onClick={handleNextCarousel}
                                            className="w-[80px] h-[80px] rounded-full bg-[#FF0054] text-white flex items-center justify-center hover:bg-[#D90048] transition-colors shadow-lg"
                                        >
                                            <ArrowRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div
                            className={cn(
                                "gap-[10px] transition-all duration-500 ease-in-out w-full",
                                actualGalleryType === 'grid' || globalAspectRatio
                                    ? `grid ${gridColsClass} auto-rows-fr`
                                    : (has2xItem
                                        ? `grid ${gridColsClass} auto-rows-[minmax(200px,auto)] grid-flow-dense`
                                        : `${masonryColsClass} gap-[10px] space-y-[10px]`)
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
                                            is2x && !isReadOnly && actualGalleryType === 'masonry' ? "ring-2 ring-blue-400" : "",
                                            (actualGalleryType === 'grid' || globalAspectRatio)
                                                ? "col-span-1 aspect-auto w-full h-full"
                                                : (has2xItem
                                                    ? (is2x ? "col-span-2 row-span-2 w-full h-full" : "col-span-1 row-span-1 w-full h-full aspect-square md:aspect-auto object-cover")
                                                    : "break-inside-avoid")
                                        )}
                                        style={globalAspectRatio ? { aspectRatio: globalAspectRatio } : {}}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isReadOnly) return
                                            if (item.attachment) setAttachmentPopupItem(item)
                                            else setLightboxIndex(i)
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
                                        <img
                                            src={showHoverImage ? item.hoverImage : item.url}
                                            alt={item.caption || `Gallery Item ${i + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-105"
                                            draggable={false}
                                        />
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
                                                        onAnimate={onAnimate}
                                                        activeSettings={{ is2x: item.is2x, link: item.link, hasAttachment: !!item.attachment }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {!isReadOnly && items && items.length < 24 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setUploadMode('gallery-add'); setIsUploadOpen(true); }}
                                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#FF0054] hover:bg-pink-50/30 transition-all group/add-item h-full min-h-[200px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover/add-item:bg-pink-100 transition-colors">
                                        <Plus className="w-6 h-6 text-gray-400 group-hover/add-item:text-[#FF0054]" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 group-hover/add-item:text-[#FF0054]">Adicionar Slide</span>
                                </button>
                            )}
                        </div>
                    )
                })() : null}

                {/* Block Toolbars and Settings using Portals */}
                {!isReadOnly && (
                    <PopoverPrimitive.Root open={isHovered || isActive || isSettingsOpen} modal={false}>
                        <PopoverPrimitive.Anchor asChild>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0" />
                        </PopoverPrimitive.Anchor>
                        <PopoverPrimitive.Portal>
                            <PopoverPrimitive.Content
                                side="top"
                                align="center"
                                sideOffset={12}
                                collisionPadding={10}
                                className="z-[2000] outline-none animate-in fade-in zoom-in-95 duration-200"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                {block.type === 'video' ? (
                                    <VideoFocalGroup
                                        onUpload={() => { setUploadMode('video'); setIsUploadOpen(true) }}
                                        onChange={() => { setUploadMode('video'); setIsUploadOpen(true) }}
                                        onLink={handleLink}
                                        onSelect={() => onSelect?.(block.id)}
                                        onSettings={() => setIsSettingsOpen(true)}
                                        onDelete={() => onDelete?.(block.id)}
                                        onAnimate={onAnimate}
                                        onDuplicate={() => onDuplicate?.(block.id)}
                                        onCopy={() => onCopy?.(block.id)}
                                    />
                                ) : (
                                    <MediaToolbar
                                        onUpload={() => {
                                            if (block.type === 'gallery' || block.type === 'carousel') setUploadMode('gallery-add')
                                            else setUploadMode('image')
                                            setIsUploadOpen(true)
                                        }}
                                        onDelete={() => onDelete?.(block.id)}
                                        onLink={handleLink}
                                        onSelect={() => onSelect?.(block.id)}
                                        onMoveUp={() => { }}
                                        onMoveDown={() => { }}
                                        onSettings={() => setIsSettingsOpen(true)}
                                        onAnimate={onAnimate}
                                        onDuplicate={() => onDuplicate?.(block.id)}
                                        onCopy={() => onCopy?.(block.id)}
                                    />
                                )}
                            </PopoverPrimitive.Content>
                        </PopoverPrimitive.Portal>
                    </PopoverPrimitive.Root>
                )}

                {isSettingsOpen && (
                    <PopoverPrimitive.Root open={isSettingsOpen} modal={false}>
                        <PopoverPrimitive.Anchor asChild>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0" />
                        </PopoverPrimitive.Anchor>
                        <PopoverPrimitive.Portal>
                            <PopoverPrimitive.Content
                                side="bottom"
                                align="center"
                                sideOffset={12}
                                collisionPadding={10}
                                className="z-[2000] outline-none animate-in fade-in zoom-in-95 duration-200"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                {block.type === 'video' ? (
                                    <VideoSettingsPanel onClose={() => setIsSettingsOpen(false)} settings={style || {}} onUpdate={handleSettingsUpdate} />
                                ) : (
                                    <MediaSettingsPanel onClose={() => setIsSettingsOpen(false)} settings={style || {}} onUpdate={handleSettingsUpdate} blockType={block.type} />
                                )}
                            </PopoverPrimitive.Content>
                        </PopoverPrimitive.Portal>
                    </PopoverPrimitive.Root>
                )}
            </div>

            {/* Overlays / Popups */}
            {isUploadOpen && (
                <UploadAssetDialog
                    isOpen={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    onUpload={handleUpload}
                    multiple={block.type === 'gallery' || block.type === 'carousel'}
                />
            )}

            {lightboxIndex !== null && items && (
                <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
                    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12" onClick={e => e.stopPropagation()}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={lightboxIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative max-w-full max-h-full flex flex-col items-center"
                            >
                                <img src={items[lightboxIndex].url} alt={items[lightboxIndex].caption || "Lightbox View"} className="max-w-full max-h-[80vh] object-contain shadow-2xl" />
                                {items[lightboxIndex].caption && <p className="text-white mt-8 text-lg font-medium bg-black/50 px-6 py-3 rounded-full break-words max-w-[90vw]">{items[lightboxIndex].caption}</p>}
                            </motion.div>
                        </AnimatePresence>
                        {items.length > 1 && (
                            <>
                                <button className="absolute left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4" onClick={(e) => { e.stopPropagation(); handlePrev(); }}><ChevronLeft className="w-12 h-12" /></button>
                                <button className="absolute right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4" onClick={(e) => { e.stopPropagation(); handleNext(); }}><ChevronRight className="w-12 h-12" /></button>
                            </>
                        )}
                    </div>
                    <button
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[100]"
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                    >
                        <X className="w-10 h-10" />
                    </button>
                </div>
            )}

            {attachmentPopupItem && (
                <AttachmentPopup
                    isOpen={!!attachmentPopupItem}
                    onClose={() => setAttachmentPopupItem(null)}
                    imageSrc={attachmentPopupItem.url}
                    attachment={attachmentPopupItem.attachment}
                />
            )}

            {showDownloadCursor && (
                <div className="fixed pointer-events-none z-[10000] flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2" style={{ top: cursorPos.y, left: cursorPos.x }}>
                    <div className="bg-[#FF0054] text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download
                    </div>
                </div>
            )}
        </>
    )
}
