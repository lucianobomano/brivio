"use client"

import React from "react"
import { Block } from "../types"
import { cn } from "@/lib/utils"
import { Figma, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioToolbar } from "./AudioToolbar"
import { DownloadSettingsPanel } from "./DownloadSettingsPanel"
import { DownloadPreviewTooltip } from "./DownloadPreviewTooltip"
import { UploadAssetDialog } from "../UploadAssetDialog"

interface EmbedBlockProps {
    block: Block
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
}

export const EmbedBlock = ({ block, isReadOnly, onUpdate }: EmbedBlockProps) => {
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

    if (block.type === 'download' || block.type === 'file') {
        const style = block.content.style || {}

        const currentBg = style.hoverEnabled && isHovered ? (style.hoverBackgroundColor || '#FF0054') : (style.backgroundColor || '#ffffff')
        const currentText = style.hoverEnabled && isHovered ? (style.hoverTextColor || '#ffffff') : (style.textColor || '#111827') // gray-900 default
        const currentBorderColor = style.hoverEnabled && isHovered ? (style.hoverBorderColor || '#0042DA') : '#e5e7eb' // gray-200 default
        // const currentWidth = style.width || '100%' // Max 1296px constraint handled by container
        // const currentHeight = style.height || '112px'
        // Actually user wants customizable W/H.
        // Container has max-w-[1296px]. Inner card should take style W/H?
        // Default requirement was: 1296px width, 112px height.
        // I will use style values or defaults.

        return (
            <div
                className="relative group/download max-w-[1296px] mx-auto hover:z-50 flex justify-center" // Centered
                onClick={(e) => {
                    e.stopPropagation()
                    if (!url) setIsUploadOpen(true)
                }}
                style={{ width: style.width || '100%' }} // Allow width override on container? Or inner?
            >
                {!isReadOnly && (
                    <div className="absolute -top-[46px] left-0 w-full flex justify-center z-[50] opacity-0 group-hover/download:opacity-100 transition-opacity pointer-events-none group-hover/download:pointer-events-auto">
                        <AudioToolbar
                            onUpload={() => setIsUploadOpen(true)}
                            onLink={() => {
                                const newLink = window.prompt("Enter file URL:", url || "")
                                if (newLink !== null) onUpdate(block.id, { ...block.content, url: newLink })
                            }}
                            onSelect={() => {/* prop onSelect */ }}
                            onSettings={() => setIsSettingsOpen(true)}
                            onDelete={() => onUpdate(block.id, { ...block.content, url: undefined })}
                        />
                    </div>
                )}

                {/* Preview Tooltip - Only when ReadOnly (Preview Mode) and Hovered */}
                {isReadOnly && (
                    <div className="absolute bottom-[calc(100%-6px)] left-1/2 -translate-x-1/2 z-[100] opacity-0 group-hover/download:opacity-100 transition-opacity pointer-events-none group-hover/download:pointer-events-auto">
                        <DownloadPreviewTooltip
                            file={{
                                name: title || "Untitled_File",
                                size: filesize || "Unknown size",
                                type: type ? `${type} file` : "Unknown type",
                                dimensions: "—", // Not stored yet
                                uploadedDate: "Just now", // Mock
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
                        // Width is managed by parent or full?
                        // If style.width is set, it might conflict with responsive. 
                        // I'll leave width 100% of container (1296px max).
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
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
                <UploadAssetDialog
                    isOpen={isUploadOpen}
                    onOpenChange={setIsUploadOpen}
                    onUpload={(file) => {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                            onUpdate(block.id, {
                                ...block.content,
                                url: reader.result as string,
                                title: file.name,
                                filesize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                                type: file.name.split('.').pop()?.toUpperCase() || 'FILE'
                            })
                        }
                        reader.readAsDataURL(file)
                        setIsUploadOpen(false)
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
                        onChange={(e: any) => onUpdate(block.id, { ...block.content, url: e.target.value })}
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
}

// Helper Input component since we can't import from shadcn due to loop if blockrenderer has it?
// We will just use standard input or expect Input to be passed or globally available.
// Actually we can import Input safely.
import { Input } from "@/components/ui/input"
