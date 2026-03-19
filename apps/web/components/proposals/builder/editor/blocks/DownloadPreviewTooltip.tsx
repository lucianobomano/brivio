import React from "react"
import { cn } from "@/lib/utils"
// Assuming Lucide icons or similar for the footer button "Open in asset library" icon
import { ExternalLink } from "lucide-react"

interface DownloadPreviewTooltipProps {
    file: {
        name: string
        size: string
        type: string
        dimensions?: string
        uploadedDate?: string
        lastDownloaded?: string
        url?: string
    }
    headerColor?: string
}

export const DownloadPreviewTooltip = ({ file, headerColor }: DownloadPreviewTooltipProps) => {
    // Mock data if missing, to match image
    const {
        name = "Nome_do_arquivo.png",
        size = "530.58 KB",
        type = "PNG image",
        dimensions = "5400 × 5400",
        uploadedDate = "12 de Janeiro, 2026",
        lastDownloaded = "Not downloaded yet",
        url
    } = file

    return (
        <div className="w-[320px] bg-[#F9FAFB] rounded-lg shadow-xl flex flex-col font-sans border border-gray-100 z-[100] relative">
            {/* Header */}
            <div className="px-5 py-4 rounded-t-lg transition-colors duration-200" style={{ backgroundColor: headerColor || '#05AB80' }}>
                <h3 className="text-white font-bold text-base truncate" title={name}>
                    {name}
                </h3>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col gap-4 text-sm text-[#111827]">

                {/* Details Section 1 */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex">
                        <span className="w-24 text-gray-900 font-medium">Kind:</span>
                        <span className="text-gray-900">{type}</span>
                    </div>
                    <div className="flex">
                        <span className="w-24 text-gray-900 font-medium">Size:</span>
                        <span className="text-gray-900">{size}</span>
                    </div>
                    <div className="flex">
                        <span className="w-24 text-gray-900 font-medium">Dimensions:</span>
                        <span className="text-gray-900">{dimensions}</span>
                    </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-gray-200 w-full" />

                {/* Details Section 2 */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex">
                        <span className="w-28 text-gray-900 font-medium">Uploaded:</span>
                        <span className="text-gray-900 whitespace-nowrap">{uploadedDate}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 text-gray-900 font-medium whitespace-nowrap">Last downloaded:</span>
                        <span className="text-gray-900">{lastDownloaded}</span>
                    </div>
                    {/* The image shows Last downloaded: ... on the next line or wrapped? 
                       Image: "Last downloaded: Not downloaded yet"
                       Layout seems to be Grid or Flex Row.
                       "Last downloaded:" label is quite long. The value is "Not downloaded yet".
                    */}
                </div>

                {/* Separator */}
                <div className="h-px bg-gray-200 w-full" />

                {/* File Preview Box */}
                <div className="w-full h-[140px] bg-[#EEF2F6] rounded-lg flex items-center justify-center border border-gray-200/50">
                    {/* Preview Image or Placeholder */}
                    {url ? (
                        <img src={url} alt="Preview" className="h-full w-full object-contain p-2" />
                    ) : (
                        <span className="text-gray-500 font-normal">File preview</span>
                    )}
                </div>

                {/* Footer Button */}
                <button
                    className="w-full h-12 bg-[#1F2937] hover:bg-black text-white rounded-full flex items-center px-2 gap-3 transition-colors mt-2"
                    onClick={(e) => {
                        e.stopPropagation()
                        alert("Open in asset library (Mock)")
                    }}
                >
                    {/* Circle Icon - Gradient Ring implementation */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-[2px] flex items-center justify-center shrink-0">
                        <div className="w-full h-full bg-[#1F2937] rounded-full" /> {/* Inner hole if standard ring, but image looks like a solid dark circle related to brand? Or just a gradient ring icon. 
                            Actually, looking at the image: It's a dark button. The icon is a black circle with a multi-colored stroke (blue/purple/pink).
                         */}
                    </div>
                    <span className="font-medium text-[15px]">Open in asset library</span>
                </button>
            </div>

            {/* Triangle Pointer / Arrow at bottom center - Tooltip style */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#F9FAFB] rotate-45 border-r border-b border-gray-100 z-50"></div>
            {/* Wait, if it's ABOVE the block, the arrow should be at the BOTTOM. If it's BELOW, arrow at TOP.
             Usually "tooltip" implies logic.
             The request says: "aparece quando... o bloco Download sofre hover".
             Positioning: Usually tooltips are above or below. 
             If I put it *above*, the arrow links down.
             I'll style it to be placed ABOVE by default in EmbedBlock, so the arrow is at bottom.
             Wait, the triangle logic above puts it at bottom. `bg` should match body `bg-[#F9FAFB]`.
             Use `border` to match container border.
             */}
        </div>
    )
}
