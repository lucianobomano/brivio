import React from "react"
import { X, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface UploadAssetDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onUpload: (files: File | File[]) => void
    onSelectFromLibrary?: () => void
    multiple?: boolean
}

export const UploadAssetDialog = ({ isOpen, onOpenChange, onUpload, onSelectFromLibrary, multiple }: UploadAssetDialogProps) => {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (multiple) {
            const files = Array.from(e.target.files || [])
            if (files.length > 0) {
                onUpload(files)
                onOpenChange(false)
            }
        } else {
            const file = e.target.files?.[0]
            if (file) {
                onUpload(file)
                onOpenChange(false)
            }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[718px] p-0 bg-[#15161B] border border-[#333] text-white gap-0 rounded-lg overflow-hidden outline-none [&>button:last-child]:hidden">
                {/* Header */}
                <div className="h-[60px] bg-[#FF0054] px-6 flex items-center justify-between shrink-0">
                    <span className="text-white font-bold text-lg">Upload asset</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onOpenChange(false)
                        }}
                        className="w-5 h-5 bg-black rounded-full flex items-center justify-center transition-colors hover:bg-black/80"
                    >
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="h-[300px] flex items-center">

                    {/* Left: Drag & Drop */}
                    <div className="flex-1 h-full p-8 flex items-center justify-center">
                        <label className="w-full h-[200px] border border-dashed border-[#444] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#FF0054] hover:bg-[#FF0054]/5 transition-all group">
                            <Upload className="w-8 h-8 text-[#666] mb-4 group-hover:text-[#FF0054] transition-colors" />
                            <span className="text-white font-medium mb-2">Drag and drop your files here</span>
                            <span className="text-[#666] text-sm">or click to upload from your computer</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,audio/*" multiple={multiple} />
                        </label>
                    </div>

                    {/* Divider */}
                    <div className="h-[180px] w-px bg-[#333] relative flex items-center justify-center">
                        <span className="absolute bg-[#15161B] text-white text-sm font-medium px-2">or</span>
                    </div>

                    {/* Right: Library */}
                    <div className="flex-1 h-full p-8 flex items-center justify-center">
                        <button
                            onClick={onSelectFromLibrary}
                            className="bg-[#FF0054] hover:bg-[#D90048] text-white font-semibold py-3 px-6 rounded-[4px] transition-colors"
                        >
                            Select from Library
                        </button>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}
