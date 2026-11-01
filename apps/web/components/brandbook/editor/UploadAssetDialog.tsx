import React from "react"
import { Upload, Check } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface UploadAssetDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    /** May return a promise: the dialog shows the upload until it settles, then closes */
    onUpload: (files: File | File[]) => void | Promise<void>
    onSelectFromLibrary?: () => void
    multiple?: boolean
}

export const UploadAssetDialog = ({ isOpen, onOpenChange, onUpload, onSelectFromLibrary, multiple }: UploadAssetDialogProps) => {

    const [isDragOver, setIsDragOver] = React.useState(false)
    // dragenter/dragleave also fire for child elements; count them so the highlight doesn't flicker
    const dragDepth = React.useRef(0)

    // Upload feedback: the files being sent, then a short "done" before the dialog closes
    const [upload, setUpload] = React.useState<{ names: string[], done: boolean } | null>(null)
    const busy = !!upload

    const handleFiles = async (fileList: FileList | null | undefined) => {
        if (busy) return
        // Same types the file picker accepts
        const files = Array.from(fileList || []).filter(f => /^(image|video|audio)\//.test(f.type))
        if (files.length === 0) return
        const picked = multiple ? files : [files[0]]
        setUpload({ names: picked.map(f => f.name), done: false })
        try {
            await onUpload(multiple ? picked : picked[0])
            setUpload(u => u && { ...u, done: true })
            await new Promise(r => setTimeout(r, 700))
        } finally {
            setUpload(null)
            onOpenChange(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files)
        e.target.value = '' // Allow picking the same file again
    }

    const handleDragEnter = (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes('Files')) return
        e.preventDefault()
        dragDepth.current++
        setIsDragOver(true)
    }

    const handleDragOver = (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes('Files')) return
        // Required for the drop event to fire (otherwise the browser opens the file)
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = () => {
        dragDepth.current = Math.max(0, dragDepth.current - 1)
        if (dragDepth.current === 0) setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragDepth.current = 0
        setIsDragOver(false)
        handleFiles(e.dataTransfer.files)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!busy || open) onOpenChange(open) }}>
            <DialogContent className="max-w-[718px] p-0 bg-[#15161B] border border-[#333] text-white gap-0 rounded-lg overflow-hidden outline-none [&>button:last-child]:hidden">
                {/* Header */}
                <div className="h-[60px] bg-[#FF0054] px-6 flex items-center justify-between shrink-0">
                    <DialogTitle className="text-white font-bold text-lg">Upload asset</DialogTitle>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!busy) onOpenChange(false)
                        }}
                        disabled={busy}
                        className="w-5 h-5 bg-black rounded-full flex items-center justify-center transition-colors hover:bg-black/80 disabled:opacity-40"
                    >
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="h-[300px] flex items-center">

                    {/* Left: Drag & Drop */}
                    <div className="flex-1 h-full p-8 flex items-center justify-center">
                        {upload ? (
                            <div
                                role="status"
                                aria-live="polite"
                                className={cn(
                                    "w-full h-[200px] border rounded-lg flex flex-col items-center justify-center px-6 transition-colors",
                                    upload.done ? "border-[#06D6A0]/60 bg-[#06D6A0]/5" : "border-[#FF0054]/60 bg-[#FF0054]/5"
                                )}
                            >
                                {upload.done ? (
                                    <div className="w-10 h-10 mb-4 rounded-full bg-[#06D6A0] flex items-center justify-center animate-in zoom-in-50 duration-300">
                                        <Check className="w-5 h-5 text-black" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 mb-4 rounded-full border-[3px] border-[#FF0054]/20 border-t-[#FF0054] animate-spin" />
                                )}
                                <span className="text-white font-medium mb-1">
                                    {upload.done ? 'Concluído' : upload.names.length > 1 ? `A carregar ${upload.names.length} ficheiros…` : 'A carregar…'}
                                </span>
                                <span className="text-[#888] text-sm max-w-full truncate">
                                    {upload.names.length > 1 ? `${upload.names[0]} e mais ${upload.names.length - 1}` : upload.names[0]}
                                </span>
                                <div className="mt-5 w-full max-w-[220px] h-1 rounded-full bg-white/10 overflow-hidden">
                                    <div className={cn("h-full rounded-full", upload.done ? "w-full bg-[#06D6A0]" : "w-1/3 bg-[#FF0054] animate-[upload-progress_1.2s_ease-in-out_infinite]")} />
                                </div>
                            </div>
                        ) : (
                        <label
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "w-full h-[200px] border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#FF0054] hover:bg-[#FF0054]/5 transition-all group",
                                isDragOver ? "border-[#FF0054] bg-[#FF0054]/10" : "border-[#444]"
                            )}
                        >
                            <Upload className={cn("w-8 h-8 mb-4 group-hover:text-[#FF0054] transition-colors", isDragOver ? "text-[#FF0054]" : "text-[#666]")} />
                            <span className="text-white font-medium mb-2">{isDragOver ? "Drop to upload" : "Drag and drop your files here"}</span>
                            <span className="text-[#666] text-sm">or click to upload from your computer</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,audio/*" multiple={multiple} />
                        </label>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-[180px] w-px bg-[#333] relative flex items-center justify-center">
                        <span className="absolute bg-[#15161B] text-white text-sm font-medium px-2">or</span>
                    </div>

                    {/* Right: Library */}
                    <div className="flex-1 h-full p-8 flex items-center justify-center">
                        <button
                            onClick={onSelectFromLibrary}
                            disabled={busy}
                            className="bg-[#FF0054] hover:bg-[#D90048] text-white font-semibold py-3 px-6 rounded-[4px] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        >
                            Select from Library
                        </button>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}
