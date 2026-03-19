import React from "react"
import { Download, X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

interface AttachmentPopupProps {
    isOpen: boolean
    onClose: () => void
    imageSrc: string
    attachment: {
        name: string
        size: string
        type: string
        date: string
        url: string
        dimensions?: string // New field logic
    }
}

export const AttachmentPopup = ({ isOpen, onClose, imageSrc, attachment }: AttachmentPopupProps) => {
    if (!isOpen) return null

    // Mock data for missing fields if not present
    const dimensions = attachment.dimensions || "5400 × 5400"
    const lastDownloaded = "Not downloaded yet" // Placeholder
    const kind = attachment.type.toUpperCase().replace('IMAGE/', '') + " image"

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Close Button Top Right (Outside container but fixed) - Image 1 shows it top right */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
                <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Main Container 1000x564 */}
            <div
                className="relative w-[1000px] h-[564px] flex flex-col items-center justify-between"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Area */}
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden mb-8">
                    <img
                        src={imageSrc}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain shadow-2xl"
                        style={{ maxHeight: '480px' }} // Approximate to leave room for button
                    />
                </div>

                {/* Download Button with Hover Card */}
                <HoverCard openDelay={0} closeDelay={200}>
                    <HoverCardTrigger asChild>
                        <button className="flex items-center justify-between w-[180px] h-[48px] px-4 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-sm">
                            <span className="font-semibold text-gray-700 text-sm">PNG</span>
                            <Download className="w-4 h-4 text-gray-500" />
                        </button>
                    </HoverCardTrigger>

                    <HoverCardContent
                        side="top"
                        sideOffset={10}
                        className="w-[320px] p-0 border-none shadow-2xl bg-[#F9FAFB] rounded-lg overflow-hidden"
                    >
                        {/* Header - Green */}
                        <div className="bg-[#00A87E] px-4 py-3">
                            <h3 className="text-white font-bold text-base truncate">{attachment.name}</h3>
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-4">
                            <div className="space-y-1 text-sm text-[#111827]">
                                <div className="flex gap-2"><span className="font-medium text-[#111827]">Kind:</span> <span>{kind}</span></div>
                                <div className="flex gap-2"><span className="font-medium text-[#111827]">Size:</span> <span>{attachment.size}</span></div>
                                <div className="flex gap-2"><span className="font-medium text-[#111827]">Dimensions:</span> <span>{dimensions}</span></div>
                            </div>

                            <div className="h-[1px] bg-gray-200 w-full" />

                            <div className="space-y-1 text-sm text-[#111827]">
                                <div className="flex gap-2"><span className="font-medium">Uploaded:</span> <span>{attachment.date}</span></div>
                                <div className="flex gap-2"><span className="font-medium">Last downloaded:</span> <span>{lastDownloaded}</span></div>
                            </div>

                            <div className="h-[1px] bg-gray-200 w-full" />

                            {/* Preview Box */}
                            <div className="w-full aspect-[16/10] bg-[#EDEDED] rounded border border-gray-200 flex items-center justify-center text-gray-500 text-sm">
                                File preview
                            </div>

                            {/* Open Library Button */}
                            <button className="w-full bg-[#222] text-white rounded-full py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-black transition-colors font-medium text-sm">
                                <div className="w-5 h-5 rounded-full border-2 border-[#0099FF]/50 border-t-[#00FF94] animate-spin-slow" /> {/* Trying to mimic the colorful circle icon */}
                                <span>Open in asset library</span>
                            </button>
                        </div>
                    </HoverCardContent>
                </HoverCard>
            </div>
        </div>
    )
}
