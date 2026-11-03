"use client"

import React from "react"
import { Block } from "../types"
import { Figma, Download, FileText, Trash2 } from "lucide-react"
import { DraggableBlockWrapper } from "./DraggableBlockWrapper"
import { Button } from "@/components/ui/button"
import { AudioToolbar } from "./AudioToolbar"
import { DownloadSettingsPanel } from "./DownloadSettingsPanel"
import { DownloadPreviewTooltip } from "./DownloadPreviewTooltip"
import { UploadAssetDialog } from "../UploadAssetDialog"
import { FloatingPanel } from "../FloatingPanel"
import { useBrandDesign } from "../BrandDesignContext"
import { useSection } from "../SectionContext"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"
import { cn } from "@/lib/utils"
import { DOWNLOAD_DEFAULTS, cssPx, hoverEffectStyle, type DownloadStyle } from "./downloadStyle"

interface EmbedBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onAnimate?: () => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    onCopy?: (id: string) => void
    onDuplicate?: (id: string) => void
    isFreeFlow?: boolean
}

export const EmbedBlock = ({ block, isReadOnly, onUpdate, onAnimate, onSelect, activeBlockId, onDelete, onCopy, onDuplicate, isFreeFlow }: EmbedBlockProps) => {
    const { brandId } = useBrandDesign()
    const { backgroundColor: sectionBg } = useSection()
    const { url, title, filesize, type } = block.content || {}
    const isFigma = block.variant === 'figma' || block.id.includes('figma')

    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    // Hover with a short grace period, so the pointer can travel from the card to its toolbar / popover
    // (both live on the top layer) without them closing on the way
    const hoverTimer = React.useRef<number | null>(null)
    React.useEffect(() => () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current) }, [])
    const hoverBind = {
        onMouseEnter: () => {
            if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
            setIsHovered(true)
        },
        onMouseLeave: () => {
            if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
            hoverTimer.current = window.setTimeout(() => setIsHovered(false), 220)
        },
    }

    // We can reuse AudioToolbar since it has the exact requested layout
    // Or we can rename/export it as GenericResourceToolbar if we prefer transparency, 
    // but importing AudioToolbar is fine for now as per instructions.

    // Need explicit import since we are replacing content inside component
    // Assuming imports are available or adding them.

    const content = (() => {
        if (block.type === 'download' || block.type === 'file') {
            const style: DownloadStyle = block.content.style || {}
            const d = DOWNLOAD_DEFAULTS
            const hover = isHovered
            const colorHover = hover && style.hoverEnabled
            const duration = style.hoverDuration ?? d.hoverDuration
            const bg = colorHover ? (style.hoverBackgroundColor || d.hoverBackgroundColor) : (style.backgroundColor || d.backgroundColor)
            const text = colorHover ? (style.hoverTextColor || d.hoverTextColor) : (style.textColor || d.textColor)
            const meta = colorHover ? text : (style.metaColor || text)
            const border = colorHover ? (style.hoverBorderColor || d.hoverBorderColor) : (style.borderColor || d.borderColor)
            const iconBg = colorHover ? (style.hoverIconBgColor || d.hoverIconBgColor) : (style.iconBgColor || d.iconBgColor)
            const iconColor = colorHover ? (style.hoverIconColor || d.hoverIconColor) : (style.iconColor || d.iconColor)
            const buttonBg = colorHover ? (style.hoverButtonBgColor || d.hoverButtonBgColor) : (style.buttonBgColor || d.buttonBgColor)
            const buttonText = colorHover ? (style.hoverButtonTextColor || d.hoverButtonTextColor) : (style.buttonTextColor || d.buttonTextColor)
            const buttonBorder = colorHover ? 'transparent' : (style.buttonBorderColor || d.buttonBorderColor)
            const iconEffect = hover ? style.hoverIconEffect : undefined

            return (
                <div
                    className="relative flex justify-center w-full"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (!url && !isReadOnly) setIsUploadOpen(true)
                    }}
                    {...hoverBind}
                    style={{ width: style.width || '100%' }}
                >
                    {/* Edit toolbar on the top layer: never under other content, and it stays while the pointer moves onto it */}
                    {!isReadOnly && (isHovered || activeBlockId === block.id) && (
                        <FloatingPanel placement="top-center" offset={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                            <AudioToolbar
                                onUpload={() => setIsUploadOpen(true)}
                                onLink={() => {
                                    const newLink = window.prompt("Enter file URL:", url || "")
                                    if (newLink !== null) onUpdate(block.id, { ...block.content, url: newLink })
                                }}
                                onSelect={() => onSelect?.(block.id)}
                                onSettings={() => { onSelect?.(block.id); setIsSettingsOpen(true) }}
                                onDelete={() => onUpdate(block.id, { ...block.content, url: undefined })}
                                onAnimate={onAnimate}
                                onCopy={onCopy ? () => onCopy(block.id) : undefined}
                                onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                            />
                        </FloatingPanel>
                    )}

                    {/* File details on the shared link, also on the top layer (flips under the card when there is no room above) */}
                    {isReadOnly && isHovered && style.showPreview !== false && (
                        <FloatingPanel placement="top-center" offset={10} zIndex={9600} clearance={8} panelProps={{ ...hoverBind, onClick: (e) => e.stopPropagation() }}>
                            <div className="animate-in fade-in zoom-in-95 duration-150">
                                <DownloadPreviewTooltip
                                    file={{
                                        name: title || "Untitled_File",
                                        size: filesize || "Unknown size",
                                        type: type ? `${type} file` : "Unknown type",
                                        dimensions: "—",
                                        uploadedDate: "Just now",
                                        lastDownloaded: "Not downloaded yet",
                                        url: url
                                    }}
                                    headerColor={style.previewHeaderColor || sectionBg}
                                />
                            </div>
                        </FloatingPanel>
                    )}

                    <div
                        className="w-full flex items-center justify-between gap-4 p-6 ease-out"
                        style={{
                            height: cssPx(style.height, '112px'),
                            backgroundColor: bg,
                            borderWidth: cssPx(style.borderWidth, '1px'),
                            borderColor: border,
                            borderRadius: cssPx(style.borderRadius, '8px'),
                            borderStyle: 'solid',
                            transitionProperty: 'background-color, border-color, color, transform, box-shadow',
                            transitionDuration: `${duration}ms`,
                            ...(hover ? hoverEffectStyle(style.hoverEffect, style.hoverEffectColor || border, style.hoverEffectColor) : {}),
                        }}
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div
                                className="p-3 rounded-lg w-12 h-12 flex items-center justify-center shrink-0"
                                style={{ backgroundColor: iconBg, color: iconColor, transition: `all ${duration}ms ease-out` }}
                            >
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-medium text-lg truncate" style={{ color: text, transition: `color ${duration}ms` }}>{title || "Untitled File"}</h3>
                                <p className="text-sm mt-1 opacity-70 truncate" style={{ color: meta, transition: `color ${duration}ms` }}>{filesize || "Unknown size"} • {type || "FILE"}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 gap-2 h-10 px-6 rounded-md border text-sm font-medium flex items-center"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (url) window.open(url, '_blank')
                                else if (!isReadOnly) setIsUploadOpen(true)
                            }}
                            style={{ backgroundColor: buttonBg, color: buttonText, borderColor: buttonBorder, transition: `all ${duration}ms ease-out` }}
                        >
                            <Download
                                className={cn("w-4 h-4", iconEffect === 'bounce' && "dl-icon-bounce", iconEffect === 'wiggle' && "dl-icon-wiggle")}
                                style={{
                                    transition: `transform ${duration}ms ease-out`,
                                    transform: iconEffect === 'drop' ? 'translateY(3px)' : iconEffect === 'scale' ? 'scale(1.2)' : undefined,
                                }}
                            />
                            Download
                        </button>
                    </div>
                </div>
            )
        }

        if (isFigma) {
            if (!url) {
                return (
                    <div className="w-full h-64 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <Figma className="w-12 h-12 mb-2" />
                        <span className="font-medium">Embed Figma Design</span>
                        <Input
                            placeholder="Paste Figma URL here"
                            className="max-w-md mt-4"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(block.id, { ...block.content, url: e.target.value })}
                            disabled={isReadOnly}
                        />
                    </div>
                )
            }
            return (
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-black">
                    <iframe
                        src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`}
                        className="w-full h-full"
                        allowFullScreen
                    />
                </div>
            )
        }

        return <div>Unknown Embed Type</div>
    })()

    return (
        <DraggableBlockWrapper
            block={block}
            isReadOnly={isReadOnly}
            // BlockRenderer already wraps every block for the free movement; a second wrapper would move it twice
            isFreeFlow={false && isFreeFlow}
            onUpdate={(id, updates) => onUpdate(id, { ...block.content, ...updates })}
            onSelect={() => onSelect?.(block.id)}
        >
            <div
                className={cn(
                    "group/block relative w-full",
                    activeBlockId === block.id && "z-50"
                )}
                onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
            >
                {content}

                <UploadAssetDialog
                    isOpen={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    onUpload={async (files: File | File[]) => {
                        const file = Array.isArray(files) ? files[0] : files
                        if (!file) return

                        try {
                            const formData = new FormData()
                            formData.append('file', file)
                            formData.append('brandId', brandId)
                            formData.append('moduleId', block.id)

                            const result = await uploadBrandbookMedia(formData)
                            if (result.success && result.url) {
                                onUpdate(block.id, {
                                    ...block.content,
                                    url: result.url,
                                    title: file.name,
                                    filesize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                                    type: file.name.split('.').pop()?.toUpperCase() || 'FILE'
                                })
                            } else {
                                console.error('Failed to upload file:', result.error)
                                alert('Erro ao carregar ficheiro.')
                            }
                        } catch (err) {
                            console.error('Error in file upload:', err)
                        }
                    }}
                />

                {!isReadOnly && isSettingsOpen && (
                    <FloatingPanel placement="bottom-center" offset={8}>
                    <div>
                        <DownloadSettingsPanel
                            onClose={() => setIsSettingsOpen(false)}
                            settings={block.content.style || {}}
                            onUpdate={(newSettings) => onUpdate(block.id, {
                                ...block.content,
                                style: { ...block.content.style, ...newSettings }
                            })}
                            onUpload={() => {
                                setIsSettingsOpen(false)
                                setIsUploadOpen(true)
                            }}
                            onDelete={() => onUpdate(block.id, { ...block.content, url: undefined })}
                        />
                    </div>
                    </FloatingPanel>
                )}
                {!isReadOnly && onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(block.id) }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover/block:opacity-100 transition-opacity z-50 flex items-center justify-center"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>
        </DraggableBlockWrapper>
    )
}

// Helper Input component since we can't import from shadcn due to loop if blockrenderer has it?
// We will just use standard input or expect Input to be passed or globally available.
// Actually we can import Input safely.
import { Input } from "@/components/ui/input"
