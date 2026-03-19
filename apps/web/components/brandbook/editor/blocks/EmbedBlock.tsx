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
import { useBrandDesign } from "../BrandDesignContext"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"
import { cn } from "@/lib/utils"

interface EmbedBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onAnimate?: () => void
    onSelect?: (id: string | null) => void
    activeBlockId?: string | null
    onDelete?: (id: string) => void
    isFreeFlow?: boolean
}

export const EmbedBlock = ({ block, isReadOnly, onUpdate, onAnimate, onSelect, activeBlockId, onDelete, isFreeFlow }: EmbedBlockProps) => {
    const { brandId } = useBrandDesign()
    const { url, title, filesize, type } = block.content || {}
    const isFigma = block.variant === 'figma' || block.id.includes('figma')

    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    // We can reuse AudioToolbar since it has the exact requested layout
    // Or we can rename/export it as GenericResourceToolbar if we prefer transparency, 
    // but importing AudioToolbar is fine for now as per instructions.

    // Need explicit import since we are replacing content inside component
    // Assuming imports are available or adding them.

    const content = (() => {
        if (block.type === 'download' || block.type === 'file') {
            const style = block.content.style || {}
            const currentBg = style.hoverEnabled && isHovered ? (style.hoverBackgroundColor || '#FF0054') : (style.backgroundColor || '#ffffff')
            const currentText = style.hoverEnabled && isHovered ? (style.hoverTextColor || '#ffffff') : (style.textColor || '#111827')
            const currentBorderColor = style.hoverEnabled && isHovered ? (style.hoverBorderColor || '#0042DA') : '#e5e7eb'

            return (
                <div
                    className="relative group/download hover:z-50 flex justify-center w-full"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (!url) setIsUploadOpen(true)
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{ width: style.width || '100%' }}
                >
                    {!isReadOnly && (
                        <div className="absolute -top-[46px] left-0 w-full flex justify-center z-[50] opacity-0 group-hover/download:opacity-100 transition-opacity pointer-events-none group-hover/download:pointer-events-auto">
                            <AudioToolbar
                                onUpload={() => setIsUploadOpen(true)}
                                onLink={() => {
                                    const newLink = window.prompt("Enter file URL:", url || "")
                                    if (newLink !== null) onUpdate(block.id, { ...block.content, url: newLink })
                                }}
                                onSelect={() => onSelect?.(block.id)}
                                onSettings={() => setIsSettingsOpen(true)}
                                onDelete={() => onUpdate(block.id, { ...block.content, url: undefined })}
                                onAnimate={onAnimate}
                            />
                        </div>
                    )}

                    {isReadOnly && (
                        <div className="absolute bottom-[calc(100%-6px)] left-1/2 -translate-x-1/2 z-[100] opacity-0 group-hover/download:opacity-100 transition-opacity pointer-events-none group-hover/download:pointer-events-auto">
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
                                headerColor={style?.hoverEnabled ? (style.hoverBackgroundColor || '#FF0054') : undefined}
                            />
                        </div>
                    )}

                    <div
                        className="w-full flex items-center justify-between p-6 transition-all duration-300 ease-in-out"
                        style={{
                            height: style.height || '112px',
                            backgroundColor: currentBg,
                            borderWidth: style.borderWidth || '1px',
                            borderColor: currentBorderColor,
                            borderRadius: style.borderRadius || '8px',
                            borderStyle: 'solid',
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-blue-500 w-12 h-12 flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg transition-colors" style={{ color: currentText }}>{title || "Untitled File"}</h3>
                                <p className="text-sm mt-1 opacity-80" style={{ color: currentText }}>{filesize || "Unknown size"} • {type || "FILE"}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="gap-2 h-10 px-6 transition-colors"
                            onClick={() => window.open(url, '_blank')}
                            style={{
                                borderColor: currentText === '#ffffff' ? 'rgba(255,255,255,0.3)' : undefined,
                                color: currentText === '#ffffff' ? 'white' : undefined,
                                backgroundColor: currentText === '#ffffff' ? 'rgba(255,255,255,0.1)' : undefined
                            }}
                        >
                            <Download className="w-4 h-4" /> Download
                        </Button>
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
            isFreeFlow={isFreeFlow}
            onUpdate={(id, updates) => onUpdate(id, { ...block.content, ...updates })}
            onSelect={() => onSelect?.(block.id)}
        >
            <div
                className={cn(
                    "mb-4 group/block relative w-full",
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

                        setIsUploadOpen(false)
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

                {isSettingsOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100]">
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
