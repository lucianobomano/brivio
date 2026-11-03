"use client"

import React from "react"
import { ImageLookControls, ImageTint, imageLookStyle, type ImageLook } from "@/components/brandbook/editor/backgroundFill"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { ImageIcon, ArrowLeft, ArrowRight, X, Plus, Video, Mic, Grid, Play, Pause, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageToolbar } from "./ImageToolbar"
import { EmptyBlockActions } from "./EmptyBlockActions"
import { UploadAssetDialog } from "../UploadAssetDialog"
import { FloatingPanel } from "../FloatingPanel"
import { EDITOR_COLLISION_PADDING } from "../editorLayout"
import { MediaToolbar } from "../MediaToolbar"
import { MediaSettingsPanel } from "../MediaSettingsPanel"
import { GallerySliderFrame } from "./GallerySliderFrame"
import { GalleryArrangedCarousel } from "./GalleryArrangedCarousel"
import { GalleryLoop } from "./GalleryLoop"
import { VideoFocalGroup } from "./VideoFocalGroup"
import { VideoSettingsPanel } from "./VideoSettingsPanel"
import { AudioToolbar } from "./AudioToolbar"
import { AudioSettingsPanel } from "./AudioSettingsPanel"
import { AttachmentPopup } from "./AttachmentPopup"
import { useBrandDesign, useAudioPlayer } from "../BrandDesignContext"

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
    align?: 'left' | 'center' | 'right'
}

export const MediaBlock = ({ block, isReadOnly, onUpdate, onSelect, activeBlockId, onDelete, onDuplicate, onCopy, onAnimate, deleteButtonClassName, align }: MediaBlockProps) => {
    const { url, caption, items, link, style } = block.content || {}
    const { settings, brandId } = useBrandDesign()
    const audioPlayer = useAudioPlayer()
    const isActive = activeBlockId === block.id
    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = React.useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        setIsHovered(true)
    }, [])

    const handleMouseLeave = React.useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false)
        }, 300)
    }, [])

    React.useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        }
    }, [])

    // Clicking outside a selected image / video / gallery deselects it, so its context bar only stays while
    // hovered or selected. The block's own popovers, panels and dialogs (settings, upload…) don't count as outside
    const blockRootRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        if (isReadOnly || !isActive) return
        const onPointerDown = (e: PointerEvent) => {
            const root = blockRootRef.current
            const target = e.target as Element | null
            if (!root || !target || root.contains(target)) return
            if (target.closest('[data-radix-popper-content-wrapper], [role="dialog"], [data-floating-panel]')) return
            setIsSettingsOpen(false)
            setIsHovered(false)
            onSelect?.(null)
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        return () => document.removeEventListener('pointerdown', onPointerDown, true)
    }, [isActive, isReadOnly, onSelect])

    // Audio specific state
    const [activeItemIndex, setActiveItemIndex] = React.useState<number | null>(null) // -1 for new, index for existing
    const [activeSettingsIndex, setActiveSettingsIndex] = React.useState<number | null>(null)

    const [activeGalleryIndex, setActiveGalleryIndex] = React.useState<number | null>(null)
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    // Gallery image whose tools are shown (editor). The tools float in the top layer, so the image's
    // rounded, clipped box never cuts them; a short delay lets the pointer move from the image onto them.
    const [toolsIndex, setToolsIndex] = React.useState<number | null>(null)
    const toolsHideRef = React.useRef<number | undefined>(undefined)
    const showTools = (i: number) => { window.clearTimeout(toolsHideRef.current); setToolsIndex(i) }
    const hideTools = () => { window.clearTimeout(toolsHideRef.current); toolsHideRef.current = window.setTimeout(() => setToolsIndex(null), 220) }
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
    // The settings panel is anchored to the block toolbar so it opens at the toolbar's level
    const toolbarRef = React.useRef<HTMLDivElement>(null)
    const sliderScrollerRef = React.useRef<HTMLDivElement>(null)
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
        if (currentItems[index].url && audioPlayer) {
            audioPlayer.updateTrackCaption(currentItems[index].url, newCaption)
        }
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
        const isThisSettingsOpen = activeSettingsIndex === index

        const isThisTrackActive = audioPlayer?.activeTrack?.url === item.url
        const isThisTrackPlaying = isThisTrackActive && !!audioPlayer?.isPlaying

        const currentTrackProgress = isThisTrackActive && audioPlayer && audioPlayer.duration > 0
            ? Math.min(100, (audioPlayer.currentTime / audioPlayer.duration) * 100)
            : 0

        const handlePlayToggle = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (!item.url) return

            const audioItems = items || (url ? [{ url, caption, style, link }] : [])
            const playlist = audioItems.map((ai: any, idx: number) => ({
                url: ai.url,
                title: ai.caption || `Faixa ${idx + 1}`,
                caption: ai.caption,
                style: ai.style || {},
                blockTitle: block.content?.title || block.content?.headline || 'Audio Logo',
                index: idx
            }))

            audioPlayer?.togglePlayPause({
                url: item.url,
                title: item.caption || `Faixa ${index + 1}`,
                caption: item.caption,
                style: itemStyle,
                blockTitle: block.content?.title || block.content?.headline || 'Audio Logo',
                index
            }, playlist)
        }

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
                {!isReadOnly && isThisSettingsOpen && (
                    <FloatingPanel placement="right-start">
                    <div>
                        <AudioSettingsPanel
                            onClose={() => setActiveSettingsIndex(null)}
                            settings={itemStyle}
                            onUpdate={(s) => handleAudioItemUpdate(index, s)}
                            onUploadAudio={() => { setActiveItemIndex(index); setUploadMode('audio'); setIsUploadOpen(true) }}
                            onUploadImage={() => { setActiveItemIndex(index); setUploadMode('image'); setIsUploadOpen(true) }}
                            onDelete={() => deleteAudioItem(index)}
                        />
                    </div>
                    </FloatingPanel>
                )}

                {/* Inner Content */}
                <div className="w-full h-full rounded-lg overflow-hidden relative bg-white shadow-sm flex flex-col">
                    <div className="absolute inset-0 border border-[#FF0054] opacity-0 group-hover/audio:opacity-100 pointer-events-none z-20 transition-opacity" />

                    <div
                        className="h-[256px] w-full flex items-center justify-center relative transition-all duration-500 bg-cover bg-center bg-no-repeat shrink-0"
                        style={{
                            ...(!isThisTrackPlaying && itemStyle.backgroundType === 'image' && itemStyle.backgroundImage ? {
                                backgroundImage: `url(${itemStyle.backgroundImage})`
                            } : {
                                background: isThisTrackPlaying
                                    ? 'linear-gradient(45deg, #FF0054, #88007F, #06D6A0, #311C99)'
                                    : (itemStyle.backgroundColor || settings.play_audio_bg || '#422600')
                            }),
                            backgroundSize: isThisTrackPlaying ? '400% 400%' : 'cover',
                            animation: isThisTrackPlaying ? 'liquidGradient 10s ease infinite' : 'none'
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
                            onClick={handlePlayToggle}
                            className="w-[100px] h-[100px] rounded-full bg-[#FF0054] border-[10px] border-white flex items-center justify-center z-10 hover:scale-105 transition-transform shadow-lg cursor-pointer"
                            style={{ backgroundColor: settings.play_audio_bg || '#FF0054' }}
                            title={isThisTrackPlaying ? "Pausar áudio" : "Reproduzir áudio"}
                        >
                            {isThisTrackPlaying ? (
                                <Pause className="w-8 h-8 text-white fill-white" />
                            ) : (
                                <Play className="w-8 h-8 text-white fill-white ml-2" />
                            )}
                        </button>

                        {/* Progress Bar Indicator along bottom of artwork container */}
                        {isThisTrackActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30 z-20 overflow-hidden">
                                <div
                                    className="h-full transition-all duration-100"
                                    style={{
                                        width: `${currentTrackProgress}%`,
                                        backgroundColor: settings.play_audio_bg || '#FF0054'
                                    }}
                                />
                            </div>
                        )}
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
    // Masonry, mosaic and justified layouts size images themselves, so the global ratio does not apply
    const isFreeformLayout = ['masonry', 'mosaic', 'justified'].includes(actualGalleryType)
    const globalAspectRatio = isFreeformLayout ? undefined : style?.aspectRatio
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
                ref={blockRootRef}
                className={cn(
                    "relative group/media-filled transition-all",
                    !isReadOnly && isActive && (
                        (block.type === 'gallery' || block.type === 'carousel')
                            ? "ring-2 ring-[#FF0054] ring-offset-2 rounded-lg"
                            : (!style?.borderWidth && "ring-2 ring-pink-500 shadow-md")
                    ),
                    isActive && "z-50"
                )}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(block.id)
                }}
                style={{
                    display: 'flex',
                    justifyContent: (style?.align === 'center' || (!style?.align && align === 'center'))
                        ? 'center'
                        : (style?.align === 'right' || (!style?.align && align === 'right'))
                            ? 'flex-end'
                            : 'flex-start',
                    width: (block.type === 'image' || block.type === 'video') && style?.width ? `${style.width}px` : ((style?.align || align) ? 'auto' : '100%'),
                    // A box with its own width is placed by margins (centering inside a box of the same width does nothing):
                    // the block's own alignment wins, otherwise the column alignment
                    marginLeft: (style?.align || align) === 'center' || (style?.align || align) === 'right' ? 'auto' : undefined,
                    marginRight: (style?.align || align) === 'center' ? 'auto' : undefined,
                    maxWidth: '100%',
                    // Lets the block shrink inside flex/grid columns instead of growing with its content
                    minWidth: 0
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

                        let latestWidth = resizeStartSizeRef.current.width
                        let latestHeight = resizeStartSizeRef.current.height
                        let rafId: number | null = null

                        if (mediaContainerRef.current) {
                            mediaContainerRef.current.style.transition = 'none'
                        }
                        const prevUserSelect = document.body.style.userSelect
                        document.body.style.userSelect = 'none'

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

                            latestWidth = Math.round(newWidth)
                            latestHeight = Math.round(newHeight)

                            if (rafId === null) {
                                rafId = requestAnimationFrame(() => {
                                    rafId = null
                                    if (mediaContainerRef.current) {
                                        mediaContainerRef.current.style.width = `${latestWidth}px`
                                        mediaContainerRef.current.style.height = `${latestHeight}px`
                                    }
                                })
                            }
                        }

                        const handleMouseUp = () => {
                            if (rafId !== null) {
                                cancelAnimationFrame(rafId)
                                rafId = null
                            }
                            setIsResizing(false)
                            document.body.style.userSelect = prevUserSelect
                            if (mediaContainerRef.current) {
                                mediaContainerRef.current.style.transition = ''
                            }
                            onUpdate(block.id, {
                                ...block.content,
                                style: {
                                    ...style,
                                    width: latestWidth,
                                    height: latestHeight
                                }
                            })
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
                                // A zoomed picture stays inside its box
                                overflow: block.type === 'image' && (style?.look?.scale ?? 100) > 100 ? 'hidden' : undefined,
                                backgroundColor: block.type === 'video' ? 'black' : undefined,
                                display: block.type === 'video' ? 'flex' : undefined,
                                alignItems: block.type === 'video' ? 'center' : undefined,
                                justifyContent: block.type === 'video' ? 'center' : undefined,
                            }}
                        >
                            {block.type === 'image' ? (
                                <img loading="lazy" decoding="async"
                                    src={url || ""}
                                    alt={caption || "Block Image"}
                                    className={cn(
                                        "w-full h-full object-cover",
                                        style?.aspectRatio && !style?.width && !style?.height && "absolute inset-0"
                                    )}
                                    style={{
                                        // Cut evenly around the centre when the ratio or the size changes
                                        objectPosition: style?.objectPosition || 'center',
                                        borderRadius: style?.radius ? `${style.radius}px` : undefined,
                                        ...imageLookStyle(style?.look),
                                    }}
                                    draggable={false}
                                />
                            ) : null}
                            {block.type === 'image' && <ImageTint look={style?.look} style={{ borderRadius: style?.radius ? `${style.radius}px` : undefined }} />}
                            {block.type === 'image' ? null : (
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
                            <div
                                onClick={(e) => {
                                    if (!isReadOnly) {
                                        e.stopPropagation()
                                        onSelect?.(block.id)
                                    }
                                }}
                                className="group/carousel relative w-full bg-black/5"
                                style={{ aspectRatio: globalAspectRatio || '16/9' }}
                            >
                                <div
                                    className="w-full h-full overflow-hidden relative"
                                    style={style?.imageRadius !== undefined ? { borderRadius: `${style.imageRadius}px` } : undefined}
                                >
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
                                                <img loading="lazy" decoding="async"
                                                    src={currentItem.url}
                                                    alt={currentItem.caption || "Carousel Slide"}
                                                    className="w-full h-full object-cover"
                                                    style={{ aspectRatio: globalAspectRatio }}
                                                />
                                                {currentItem.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-sm z-10 break-words">{currentItem.caption}</div>
                                                )}
                                                {!isReadOnly && (
                                                    <div className="absolute z-50 top-4 right-4 opacity-0 group-hover/carousel:opacity-100 group-focus-within/carousel:opacity-100 transition-opacity">
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

                    const isSlider = actualGalleryType === 'slider'
                    const isMosaic = actualGalleryType === 'mosaic'
                    const isJustified = actualGalleryType === 'justified'
                    // Slider: `numCols` images visible at once, the rest scroll horizontally
                    // The column count always sets the width; the image size (L × A) only sets the shape:
                    // both sides → their ratio, height alone → fixed height, neither → global ratio
                    const sliderItemWidth = `calc((100% - ${(numCols - 1) * 10}px) / ${numCols})`
                    const sliderItemStyle: React.CSSProperties = style?.sliderImageWidth && style?.sliderImageHeight
                        ? { width: sliderItemWidth, aspectRatio: `${style.sliderImageWidth}/${style.sliderImageHeight}` }
                        : style?.sliderImageHeight
                            ? { width: sliderItemWidth, height: `${style.sliderImageHeight}px` }
                            : { width: sliderItemWidth, aspectRatio: globalAspectRatio || '4/3' }
                    // Mosaic: every sixth image (starting with the first) is a 2×2 feature tile
                    const isMosaicFeature = (i: number) => isMosaic && numCols > 1 && i % 6 === 0

                    // Tools over one gallery image (editor only)
                    const renderItemToolbar = (i: number, item: any) => isReadOnly || toolsIndex !== i || !item ? null : (
                        // Inside the top of the image: never over the gallery bar, which sits above the block
                        <FloatingPanel
                            placement="inside-top"
                            offset={8}
                            panelProps={{ onMouseEnter: () => showTools(i), onMouseLeave: hideTools, onClick: (e) => e.stopPropagation() }}
                        >
                            <div className="shadow-sm">
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
                        </FloatingPanel>
                    )

                    const galleryContent = (
                        <div
                            ref={isSlider ? sliderScrollerRef : undefined}
                            className={cn(
                                "gap-[10px] transition-all duration-500 ease-in-out w-full",
                                isSlider
                                    ? cn(
                                        // contain: inline-size keeps the tiles from widening the block past the section
                                        "flex overflow-x-auto snap-x snap-mandatory min-w-0 [contain:inline-size]",
                                        style?.sliderScrollbar === false
                                            ? "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                            : "pb-2 custom-scrollbar"
                                    )
                                    : isMosaic
                                        ? `grid ${gridColsClass} auto-rows-[200px] grid-flow-dense`
                                        : isJustified
                                            // The trailing spacer keeps the last row from stretching
                                            ? "flex flex-wrap after:content-[''] after:grow-[999]"
                                            : actualGalleryType === 'grid' || globalAspectRatio
                                                ? `grid ${gridColsClass} auto-rows-fr`
                                                : (has2xItem
                                                    ? `grid ${gridColsClass} auto-rows-[minmax(200px,auto)] grid-flow-dense`
                                                    : `${masonryColsClass} gap-[10px] space-y-[10px]`)
                            )}
                            style={{
                                // The slider's tiles are sized as a share of the strip, so it always takes the frame's width
                                width: isSlider ? '100%' : (formatDim(style?.width) || (style?.align ? 'auto' : '100%')),
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
                                            isSlider
                                                ? "flex-none snap-start"
                                                : isMosaic
                                                    ? (isMosaicFeature(i) ? "col-span-2 row-span-2 w-full h-full" : "w-full h-full")
                                                    : isJustified
                                                        ? "h-[240px] grow"
                                                        : (actualGalleryType === 'grid' || globalAspectRatio)
                                                            ? "col-span-1 aspect-auto w-full h-full"
                                                            : (has2xItem
                                                                ? (is2x ? "col-span-2 row-span-2 w-full h-full" : "col-span-1 row-span-1 w-full h-full aspect-square md:aspect-auto object-cover")
                                                                : "break-inside-avoid")
                                        )}
                                        style={{
                                            ...(isSlider
                                                ? sliderItemStyle
                                                : (globalAspectRatio ? { aspectRatio: globalAspectRatio } : {})),
                                            // "Arredondar imagens" in the gallery settings
                                            ...(style?.imageRadius !== undefined ? { borderRadius: `${style.imageRadius}px` } : {}),
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isReadOnly) {
                                                onSelect?.(block.id)
                                                return
                                            }
                                            if (item.attachment) setAttachmentPopupItem(item)
                                            else setLightboxIndex(i)
                                        }}
                                        onMouseEnter={() => {
                                            setHoverIndex(i)
                                            if (!isReadOnly) showTools(i)
                                            if (isReadOnly && item.attachment) setShowDownloadCursor(true)
                                        }}
                                        onMouseLeave={() => {
                                            setHoverIndex(null)
                                            if (!isReadOnly) hideTools()
                                            setShowDownloadCursor(false)
                                        }}
                                    >
                                        <img loading="lazy" decoding="async"
                                            src={showHoverImage ? item.hoverImage : item.url}
                                            alt={item.caption || `Gallery Item ${i + 1}`}
                                            className={cn(
                                                "object-cover transition-transform duration-700 group-hover/item:scale-105",
                                                // Justified: the image's natural width at row height sets the tile's base width
                                                isJustified ? "h-full w-auto min-w-full" : "w-full h-full"
                                            )}
                                            draggable={false}
                                        />
                                        {renderItemToolbar(i, item)}
                                    </div>
                                )
                            })}

                            {!isReadOnly && items && items.length < 24 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelect?.(block.id); setUploadMode('gallery-add'); setIsUploadOpen(true); }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#FF0054] hover:bg-pink-50/30 transition-all group/add-item h-full min-h-[200px]",
                                        isSlider && "flex-none snap-start",
                                        isJustified && "h-[240px] min-w-[200px] grow"
                                    )}
                                    style={isSlider ? { ...sliderItemStyle, aspectRatio: undefined } : undefined}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover/add-item:bg-pink-100 transition-colors">
                                        <Plus className="w-6 h-6 text-gray-400 group-hover/add-item:text-[#FF0054]" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 group-hover/add-item:text-[#FF0054]">Adicionar Slide</span>
                                </button>
                            )}
                        </div>
                    )

                    // Loop: lanes of images scrolling forever (columns up / down, or rows left / right)
                    if (actualGalleryType === 'loop') {
                        return (
                            <GalleryLoop
                                items={items || []}
                                settings={style || {}}
                                aspectRatio={globalAspectRatio}
                                isReadOnly={isReadOnly}
                                renderOverlay={(i) => renderItemToolbar(i, items[i])}
                                onHoverItem={(i) => { if (isReadOnly) return; if (i === null) hideTools(); else showTools(i) }}
                                onOpenItem={(i) => {
                                    if (!isReadOnly) { onSelect?.(block.id); return }
                                    if (items[i]?.attachment) setAttachmentPopupItem(items[i])
                                    else setLightboxIndex(i)
                                }}
                                addButton={!isReadOnly && items && items.length < 24 ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onSelect?.(block.id); setUploadMode('gallery-add'); setIsUploadOpen(true) }}
                                        className="h-10 w-full rounded-lg border border-dashed border-gray-300 text-gray-400 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:border-[#FF0054] hover:text-[#FF0054] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Adicionar imagem
                                    </button>
                                ) : undefined}
                            />
                        )
                    }

                    if (!isSlider) return galleryContent
                    // Faixa arranged around a focused image (fan, arc, focus…)
                    if (style?.sliderArrangement && style.sliderArrangement !== 'strip') {
                        return (
                            <GalleryArrangedCarousel
                                items={items || []}
                                settings={style}
                                aspectRatio={globalAspectRatio}
                                isReadOnly={isReadOnly}
                                onOpenItem={(i) => {
                                    if (!isReadOnly) { onSelect?.(block.id); return }
                                    if (items[i]?.attachment) setAttachmentPopupItem(items[i])
                                    else setLightboxIndex(i)
                                }}
                                renderOverlay={(i) => renderItemToolbar(i, items[i])}
                                onHoverItem={(i) => { if (isReadOnly) return; if (i === null) hideTools(); else showTools(i) }}
                                onUpdateItem={(i, patch) => {
                                    const newItems = [...items]
                                    newItems[i] = { ...newItems[i], ...patch }
                                    onUpdate(block.id, { ...block.content, items: newItems })
                                }}
                                addButton={!isReadOnly && items && items.length < 24 ? (
                                    <button
                                        type="button"
                                        title="Adicionar imagem"
                                        onClick={(e) => { e.stopPropagation(); onSelect?.(block.id); setUploadMode('gallery-add'); setIsUploadOpen(true) }}
                                        className="w-9 h-9 shrink-0 rounded-full border-2 border-dashed border-gray-300 text-gray-400 flex items-center justify-center hover:border-[#FF0054] hover:text-[#FF0054] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                ) : undefined}
                            />
                        )
                    }
                    return (
                        <GallerySliderFrame settings={style || {}} scrollerRef={sliderScrollerRef} itemCount={items?.length || 0}>
                            {galleryContent}
                        </GallerySliderFrame>
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
                                ref={toolbarRef}
                                side="top"
                                align="center"
                                sideOffset={8}
                                collisionPadding={EDITOR_COLLISION_PADDING}
                                className="z-[2000] outline-none animate-in fade-in zoom-in-95 duration-200 before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSelect?.(block.id)
                                }}
                            >
                                {block.type === 'video' ? (
                                    <VideoFocalGroup
                                        onUpload={() => { onSelect?.(block.id); setUploadMode('video'); setIsUploadOpen(true) }}
                                        onChange={() => { onSelect?.(block.id); setUploadMode('video'); setIsUploadOpen(true) }}
                                        onLink={() => { onSelect?.(block.id); handleLink() }}
                                        onSelect={() => onSelect?.(block.id)}
                                        onSettings={() => { onSelect?.(block.id); setIsSettingsOpen(true) }}
                                        onDelete={() => onDelete?.(block.id)}
                                        onAnimate={onAnimate}
                                        onDuplicate={() => onDuplicate?.(block.id)}
                                        onCopy={() => onCopy?.(block.id)}
                                    />
                                ) : (
                                    <MediaToolbar
                                        onUpload={() => {
                                            onSelect?.(block.id)
                                            if (block.type === 'gallery' || block.type === 'carousel') setUploadMode('gallery-add')
                                            else setUploadMode('image')
                                            setIsUploadOpen(true)
                                        }}
                                        onDelete={() => onDelete?.(block.id)}
                                        onLink={() => {
                                            onSelect?.(block.id)
                                            handleLink()
                                        }}
                                        onSelect={() => onSelect?.(block.id)}
                                        onMoveUp={() => { }}
                                        onMoveDown={() => { }}
                                        onSettings={() => {
                                            onSelect?.(block.id)
                                            setIsSettingsOpen(true)
                                        }}
                                        onAnimate={onAnimate}
                                        onDuplicate={() => onDuplicate?.(block.id)}
                                        onCopy={() => onCopy?.(block.id)}
                                    />
                                )}
                            </PopoverPrimitive.Content>
                        </PopoverPrimitive.Portal>
                    </PopoverPrimitive.Root>
                )}

                {!isReadOnly && isSettingsOpen && (
                    <PopoverPrimitive.Root open={isSettingsOpen} modal={false}>
                        <PopoverPrimitive.Anchor virtualRef={toolbarRef as React.RefObject<HTMLDivElement>} />
                        <PopoverPrimitive.Portal>
                            <PopoverPrimitive.Content
                                side="right"
                                align="start"
                                sideOffset={8}
                                collisionPadding={EDITOR_COLLISION_PADDING}
                                className="z-[2000] outline-none animate-in fade-in zoom-in-95 duration-200"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSelect?.(block.id)
                                }}
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
                                <img loading="lazy" decoding="async" src={items[lightboxIndex].url} alt={items[lightboxIndex].caption || "Lightbox View"} className="max-w-full max-h-[80vh] object-contain shadow-2xl" />
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
