"use client"

import React, { useState, useRef } from "react"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import { uploadBrandAsset } from "@/app/actions/brand-settings"
import { cn } from "@/lib/utils"

interface UploadAssetPopupProps {
    isOpen: boolean
    onClose: () => void
    onUploadComplete: (url: string) => void
    type: 'logo' | 'favicon'
    brandId: string
}

export function UploadAssetPopup({ isOpen, onClose, onUploadComplete, type, brandId }: UploadAssetPopupProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleUpload(file)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
    }

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }

        setIsUploading(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('brandId', brandId)
        formData.append('type', type)

        try {
            const res = await uploadBrandAsset(formData)
            if (res.success && res.url) {
                onUploadComplete(res.url)
                onClose()
            } else {
                setError(res.error || 'Upload failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
            console.error(err)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#111116] border border-[#222] rounded-xl w-[400px] p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-medium">Upload {type === 'logo' ? 'Logo' : 'Favicon'}</h3>
                    <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div
                    className={cn(
                        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[200px]",
                        isDragging ? "border-[#ff0054] bg-[#ff0054]/5" : "border-[#333] hover:border-[#555] bg-[#0E0F14]"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[#ff0054] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-[#888]">Uploading...</span>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
                                <Upload className="w-6 h-6 text-[#666]" />
                            </div>
                            <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                            <span className="text-xs text-[#555]">SVG, PNG, JPG (max 2MB)</span>
                        </>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}
