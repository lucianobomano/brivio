"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import JSZip from "jszip"
import { getPublicSharedItem, verifySharedItemPasscode, getAllFolderContentsRecursive, type Asset, type AssetFolder } from "@/app/actions/assets"
import { LockKeyhole, File as FileIcon, Download, AlertCircle, Folder, MoreHorizontal, ArrowDownAZ, ChevronRight, Loader2, Check, Minus, X, Key, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Logo } from "@/components/layout/Logo"
import { cn } from "@/lib/utils"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"

// Simple formatBytes if not available
const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Force download for cross-origin files
const handleDownload = async (url: string, filename: string) => {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
    } catch {
        // Fallback: open in new tab if fetch fails
        window.open(url, '_blank')
    }
}

interface BulkActionsHeaderProps {
    selectedCount: number
    onDeselectAll: () => void
    onDownload: () => void
    className?: string
}

function BulkActionsHeader({ selectedCount, onDeselectAll, onDownload, className }: BulkActionsHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "bg-[#ff0054] z-[60] flex items-center justify-between px-4 shadow-xl rounded-full",
                className
            )}
        >
            <div className="flex items-center gap-3">
                <button
                    onClick={onDeselectAll}
                    className="w-5 h-5 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                >
                    <Minus className="w-3 h-3 text-white" />
                </button>
                <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white tracking-tight">
                        {selectedCount} item{selectedCount > 1 && 's'} selected
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onDownload}
                    className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                    <Download className="w-4 h-4" />
                    <span className="font-medium text-[13px]">Download</span>
                </button>

                <div className="h-4 w-[1px] bg-white/20 mx-1" />

                <button
                    onClick={onDeselectAll}
                    className="w-7 h-7 rounded-full bg-[#0E0F14] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    <X className="w-3.5 h-3.5 text-white" />
                </button>
            </div>
        </motion.div>
    )
}

interface ShareViewerProps {
    assetId: string
    initialAsset: Asset | null
    isProtected?: boolean
    initialError?: string
    initialType?: 'asset' | 'folder'
    initialChildren?: (Asset | (AssetFolder & { file_url: null }))[]
    initialBreadcrumbs?: { id: string; name: string }[]
    expirationDate?: string
}

export function ShareViewer({ assetId, initialAsset, isProtected, initialError, initialType = 'asset', initialChildren = [], initialBreadcrumbs = [], expirationDate: initialExpirationDate }: ShareViewerProps) {
    const [asset, setAsset] = useState(initialAsset)
    const [expirationDate] = useState(initialExpirationDate)
    const [passcode, setPasscode] = useState("")
    const [error, setError] = useState(initialError)
    const [loading, setLoading] = useState(false)
    const [needsPasscode, setNeedsPasscode] = useState(isProtected && !initialAsset)
    const [children, setChildren] = useState<any[]>(initialChildren)
    const [_viewType, _setViewType] = useState<'grid' | 'list'>(initialType === 'folder' ? 'grid' : 'grid')
    const [viewingChild, setViewingChild] = useState<any>(null)
    const [breadcrumbs] = useState(initialBreadcrumbs)
    const [isDownloadingAll, setIsDownloadingAll] = useState(false)
    const [openFolderMenu, setOpenFolderMenu] = useState<string | null>(null)
    const [downloadingFolderId, setDownloadingFolderId] = useState<string | null>(null)
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())
    const router = useRouter()

    const handleToggleSelection = (id: string, type: 'folder' | 'asset') => {
        if (type === 'folder') {
            const next = new Set(selectedFolderIds)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            setSelectedFolderIds(next)
        } else {
            const next = new Set(selectedAssetIds)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            setSelectedAssetIds(next)
        }
    }

    const handleDeselectAll = () => {
        setSelectedFolderIds(new Set())
        setSelectedAssetIds(new Set())
    }

    const handleBulkDownloadSelection = async () => {
        if (selectedAssetIds.size === 0 && selectedFolderIds.size === 0) return
        const folders = children.filter((c: any) => c.type === 'folder')
        const files = children.filter((c: any) => c.type !== 'folder')
        const assetsToDownload = files.filter((a: any) => selectedAssetIds.has(a.id))
        const foldersToDownload = folders.filter((f: any) => selectedFolderIds.has(f.id))

        if (assetsToDownload.length === 0 && foldersToDownload.length === 0) return
        let zipName = asset?.name ? `${asset.name}_selection.zip` : "Brivio_selection.zip"
        const toastId = toast.loading(`Preparing download...`)
        try {
            const zip = new JSZip()
            await Promise.all(assetsToDownload.map(async (asset: any) => {
                if (!asset.file_url) return
                const response = await fetch(asset.file_url)
                const blob = await response.blob()
                zip.file(asset.name || `file_${asset.id}`, blob)
            }))
            await Promise.all(foldersToDownload.map(async (folder: any) => {
                const folderZip = zip.folder(folder.name)
                if (!folderZip) return
                const result = await getAllFolderContentsRecursive(folder.id)
                if (result.success && result.files) {
                    for (const file of result.files) {
                        const response = await fetch(file.file_url)
                        const blob = await response.blob()
                        folderZip.file(file.path || file.name, blob)
                    }
                }
            }))
            const content = await zip.generateAsync({ type: "blob" })
            const url = window.URL.createObjectURL(content)
            const link = document.createElement('a')
            link.href = url
            link.download = zipName
            link.click()
            toast.success("Download started", { id: toastId })
            handleDeselectAll()
        } catch {
            toast.error("Failed to create zip file", { id: toastId })
        }
    }

    const handleDownloadAll = async () => {
        if (children.length === 0) return
        setIsDownloadingAll(true)
        const toastId = toast.loading(`Preparing ZIP...`)
        try {
            const result: any = await getAllFolderContentsRecursive(assetId)
            if (!result.success || !result.files) throw new Error("Failed")
            const zip = new JSZip()
            for (const file of result.files) {
                const response = await fetch(file.file_url)
                const blob = await response.blob()
                zip.file(file.path || file.name, blob)
            }
            const content = await zip.generateAsync({ type: "blob" })
            const url = window.URL.createObjectURL(content)
            const link = document.createElement("a")
            link.href = url
            link.download = `${result.rootName || 'assets'}.zip`
            link.click()
            toast.success("Download started", { id: toastId })
        } catch {
            toast.error("Failed to create ZIP", { id: toastId })
        } finally {
            setIsDownloadingAll(false)
        }
    }

    const handleDownloadFolder = async (folderId: string, folderName: string) => {
        if (downloadingFolderId) return
        setDownloadingFolderId(folderId)
        try {
            const result = await getAllFolderContentsRecursive(folderId)
            if (!result.success) return
            const zip = new JSZip()
            const rootFolderName = result.rootName || folderName
            if (result.files) {
                for (const file of result.files) {
                    const response = await fetch(file.file_url)
                    const blob = await response.blob()
                    zip.file(file.path ? `${rootFolderName}/${file.path}/${file.name}` : `${rootFolderName}/${file.name}`, blob)
                }
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' })
            const url = URL.createObjectURL(zipBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${rootFolderName}.zip`
            link.click()
        } finally {
            setDownloadingFolderId(null)
            setOpenFolderMenu(null)
        }
    }

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(undefined)
        try {
            const result = await verifySharedItemPasscode(assetId, passcode)
            if (result.success) {
                const assetResult = await getPublicSharedItem(assetId)
                if (assetResult.success && assetResult.item) {
                    setAsset(assetResult.item)
                    setChildren(assetResult.children || [])
                    setNeedsPasscode(false)
                } else {
                    setError("Failed to load content")
                }
            } else {
                setError(result.error || "Invalid passcode")
            }
        } catch {
            setError("Error unlocking")
        } finally {
            setLoading(false)
        }
    }

    if (error && !asset && !needsPasscode) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {error === "Link expired" ? "Link expirado" : "Erro no acesso"}
                </h1>
                <p className="text-gray-600 max-w-md">
                    {error === "Link expired"
                        ? "Este link de compartilhamento não está mais disponível pois expirou."
                        : "Não foi possível carregar o conteúdo compartilhado."}
                </p>
                <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-[#ff0054] text-white rounded-lg font-medium hover:bg-[#ff0054]/90 transition-colors">
                    Tentar novamente
                </button>
            </div>
        )
    }

    if (needsPasscode) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#F9F1F3]">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff0054]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5B6EF5]/5 rounded-full blur-[120px]" />

                <div className="relative flex flex-col items-center gap-6 w-full max-w-[437px] z-10">
                    {expirationDate && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#FFDEE4] rounded-full shadow-sm"
                        >
                            <Clock className="w-4 h-4 text-[#ff0054]" />
                            <span className="text-[13px] font-medium text-[#ff0054]">
                                O link expira em {format(new Date(expirationDate), "dd 'de' MMMM", { locale: ptBR })}
                                {differenceInDays(new Date(expirationDate), new Date()) < 7 && (
                                    <span className="ml-1.5 opacity-60 font-normal">
                                        • {differenceInDays(new Date(expirationDate), new Date())} dias restantes
                                    </span>
                                )}
                            </span>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full h-[573px] bg-white rounded-[8px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col"
                    >
                        <div className="h-[56px] w-full bg-[#ff0054] flex items-center justify-center">
                            <h1 className="text-[20px] font-medium text-white">Conteúdo protegido</h1>
                        </div>

                        <div className="flex-1 px-[30px] pt-[40px] pb-[30px] flex flex-col items-center">
                            <div className="w-[70px] h-[70px] bg-[#F7F8FA] rounded-[10px] flex items-center justify-center mb-[36px]">
                                <LockKeyhole className="w-[28px] h-[28px] text-black" strokeWidth={1.5} />
                            </div>

                            <p className="text-[15px] font-medium text-[#515151] text-center mb-[36px] px-2 leading-[1.4]">
                                Este link de compartilhamento está protegido por uma senha. Por favor insira a palavra passe para aceder
                            </p>

                            <form onSubmit={handleUnlock} className="w-full flex-1 flex flex-col">
                                <div className="w-full mb-[30px]">
                                    <label className="block text-[15px] font-medium text-[#515151] mb-[8px]">Palavra passe</label>
                                    <div className="relative group border-b border-[#97A1B3] h-[50px] flex items-center">
                                        <input
                                            type="password"
                                            value={passcode}
                                            onChange={(e) => setPasscode(e.target.value)}
                                            placeholder="●●●●●●●●●"
                                            className="w-full bg-transparent text-[#515151] text-lg outline-none placeholder:text-[#515151] placeholder:opacity-35"
                                            autoFocus
                                        />
                                        <div className="absolute right-0 text-[#515151] opacity-35">
                                            <Key className="w-[18px] h-[18px]" />
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="w-full bg-[#ff0054]/10 border-[0.5px] border-[#ff0054] rounded-[8px] p-[14px] flex items-center gap-3 mb-[30px]"
                                        >
                                            <div className="w-5 h-5 rounded-full border-[1.5px] border-[#ff0054] flex items-center justify-center shrink-0">
                                                <span className="text-[#ff0054] text-[12px] font-bold">!</span>
                                            </div>
                                            <span className="text-[#ff0054] text-[14px] font-medium">{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="mt-auto">
                                    <button
                                        type="submit"
                                        disabled={loading || !passcode}
                                        className="w-full h-[56px] bg-[#878788] text-white text-[16px] font-medium rounded-[8px] hover:bg-[#767677] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Desbloquear acesso</span>}
                                        {!loading && <ChevronRight className="w-[18px] h-[18px] text-white" />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-60">
                    <span className="text-sm font-medium text-gray-500">Powered by</span>
                    <Logo className="h-6 w-auto grayscale" />
                </div>
            </div>
        )
    }

    if (!asset && !viewingChild) return null

    // State for viewing

    // --- FOLDER VIEW (Redesigned to match BAM Dashboard) ---
    // Always render the folder view as base
    const renderFolderView = () => {
        const folders = children.filter((c: any) => c.type === 'folder')
        const files = children.filter((c: any) => c.type !== 'folder')

        return (
            <>
                <div className="w-full max-w-[1620px] mx-auto p-[25px] bg-white rounded-2xl border border-[#E5E5E5] shadow-sm relative min-h-[500px]">



                    {/* Breadcrumb Navigation */}
                    {breadcrumbs.length > 1 && (
                        <nav className="flex items-center gap-1 text-sm mb-4 flex-wrap">
                            {breadcrumbs.map((crumb, index) => {
                                const isLast = index === breadcrumbs.length - 1
                                return (
                                    <div key={crumb.id} className="flex items-center gap-1">
                                        {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                                        {isLast ? (
                                            <span className="font-medium text-gray-900">{crumb.name}</span>
                                        ) : (
                                            <button
                                                onClick={() => router.push(`/share/${crumb.id}`)}
                                                className="text-gray-500 hover:text-blue-600 hover:underline transition-colors"
                                            >
                                                {crumb.name}
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </nav>
                    )}

                    {/* Header Row */}
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 min-h-[45px]">
                        <AnimatePresence>
                            {(selectedFolderIds.size > 0 || selectedAssetIds.size > 0) && (
                                <BulkActionsHeader
                                    selectedCount={selectedFolderIds.size + selectedAssetIds.size}
                                    onDeselectAll={handleDeselectAll}
                                    onDownload={handleBulkDownloadSelection}
                                    className="absolute inset-0 z-10 w-full h-full"
                                />
                            )}
                        </AnimatePresence>
                        {selectedFolderIds.size === 0 && selectedAssetIds.size === 0 && (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-[#111]">{asset?.name || "Shared Folder"}</h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="text-sm font-medium text-gray-600 flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <ArrowDownAZ className="w-4 h-4" />
                                        <span>Sort by <span className="font-semibold">Name (A-Z)</span></span>
                                    </button>
                                    <button
                                        onClick={() => handleDownloadAll()}
                                        disabled={isDownloadingAll}
                                        className="bg-[#ff0054] hover:bg-[#e60049] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isDownloadingAll ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Creating ZIP...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                <span>Download all</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Folders Section */}
                    {folders.length > 0 && (
                        <div className="mb-10">
                            <h3 className="text-sm font-semibold text-gray-500 mb-4">Folders ({folders.length})</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {folders.map((f: any) => {
                                    const isSelected = selectedFolderIds.has(f.id)
                                    const isSelectionMode = selectedFolderIds.size > 0 || selectedAssetIds.size > 0

                                    return (
                                        <div
                                            key={f.id}
                                            onClick={(e) => {
                                                router.push(`/share/${f.id}`)
                                            }}
                                            className={cn(
                                                "relative flex items-center justify-between p-4 bg-[#F7F8FA] rounded-xl cursor-pointer transition-all group border h-[88px]",
                                                isSelected
                                                    ? "border-[#ff0054] border-[2px] bg-[#ff0054]/5"
                                                    : isSelectionMode
                                                        ? "border-transparent hover:border-[#ff0054] hover:border-[2px]"
                                                        : "border-transparent hover:border-gray-300 hover:bg-gray-200/70"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div
                                                    className="shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleSelection(f.id, 'folder')
                                                    }}
                                                >
                                                    {isSelected ? (
                                                        <div className="w-5 h-5 rounded-full bg-[#ff0054] flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="relative w-5 h-5 flex items-center justify-center">
                                                            <Folder className={cn("w-5 h-5 text-gray-500 transition-opacity absolute inset-0", isSelectionMode ? "group-hover:opacity-0" : "group-hover:opacity-0")} />
                                                            <div className={cn(
                                                                "w-5 h-5 rounded-full border-2 border-gray-300 bg-white items-center justify-center absolute inset-0 hidden",
                                                                "group-hover:flex hover:border-[#ff0054]",
                                                                isSelectionMode ? "flex border-gray-300" : ""
                                                            )}>
                                                                {isSelectionMode && <div className="w-full h-full rounded-full hover:bg-[#ff0054]/10" />}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={cn("font-medium truncate transition-colors", isSelected ? "text-[#ff0054]" : "text-gray-800")}>{f.name}</span>
                                            </div>

                                            {/* More menu button */}
                                            {!isSelectionMode && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenFolderMenu(openFolderMenu === f.id ? null : f.id)
                                                    }}
                                                    className="p-1 rounded-md hover:bg-gray-300/50 transition-colors"
                                                >
                                                    {downloadingFolderId === f.id ? (
                                                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                                                    ) : (
                                                        <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Dropdown menu */}
                                            {openFolderMenu === f.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenFolderMenu(null)
                                                        }}
                                                    />
                                                    <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDownloadFolder(f.id, f.name)
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Assets Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-4">Assets ({files.length})</h3>

                        {files.length === 0 && folders.length === 0 && (
                            <div className="h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                Empty folder
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {files.map((f: any) => {
                                const isImage = f.type === 'image' || f.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                const ext = f.name?.split('.').pop()?.toUpperCase().substring(0, 4) || 'FILE'
                                const isSelected = selectedAssetIds.has(f.id)
                                const isSelectionMode = selectedFolderIds.size > 0 || selectedAssetIds.size > 0

                                return (
                                    <div key={f.id} className="group cursor-pointer">
                                        <div
                                            onClick={() => {
                                                setViewingChild(f)
                                            }}
                                            className={cn(
                                                "relative overflow-hidden rounded-2xl bg-gray-100 mb-2 shadow-sm transition-all border",
                                                isImage ? 'w-full h-fit' : 'aspect-square',
                                                isSelected
                                                    ? "border-[#ff0054] border-[2px]"
                                                    : isSelectionMode
                                                        ? "border-transparent hover:border-[#ff0054] hover:border-[2px]"
                                                        : "border-gray-200 hover:shadow-lg"
                                            )}
                                        >
                                            {isImage ? (
                                                <img src={f.file_url} alt={f.name} className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-300" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gray-50">
                                                    <FileIcon className="h-12 w-12 text-gray-300" />
                                                </div>
                                            )}

                                            {/* Selection Checkbox */}
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleToggleSelection(f.id, 'asset') }}
                                                className={cn(
                                                    "absolute top-3 left-3 w-6 h-6 rounded-full border z-20 flex items-center justify-center transition-all shadow-sm cursor-pointer",
                                                    isSelected
                                                        ? "bg-[#ff0054] border-[#ff0054] opacity-100"
                                                        : "bg-white border-gray-200 opacity-0 group-hover:opacity-100 hover:border-[#ff0054]"
                                                )}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>

                                            {/* Hover Overlay - Black 10% opacity with Download Icon */}
                                            {/* Only show download if NOT in selection mode? Or keep it? AssetLibrary typically hides overlay actions when selecting */}
                                            {!isSelectionMode && (
                                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDownload(f.file_url, f.name)
                                                        }}
                                                        className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                                                    >
                                                        <Download className="w-4 h-4 text-gray-700" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Row */}
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={cn(
                                                "text-xs font-medium truncate flex-1 transition-colors",
                                                isSelected ? "text-[#ff0054]" : "text-gray-700"
                                            )} title={f.name}>{f.name}</span>
                                            <span className="shrink-0 inline-flex items-center rounded bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#5B6EF5] uppercase">
                                                {ext}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Powered by Brivio Button - Outside container, 20px spacing */}
                <div className="flex justify-center mt-5">
                    <a
                        href="https://brivio.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-[210px] h-[35px] bg-black rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <span className="text-white text-sm font-medium">Powered by</span>
                        <span className="text-gray-400 text-sm font-medium">Brivio°</span>
                    </a>
                </div>
            </>
        )
    }

    const renderAssetModal = () => {
        if (!viewingChild) return null

        const currentItem = viewingChild
        const isImage = currentItem.type === 'image' || currentItem.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        const isVideo = currentItem.type === 'video' || currentItem.name?.match(/\.(mp4|mov|webm)$/i)

        // Helper to format date
        const formatDate = (dateStr?: string) => {
            if (!dateStr) return 'Unknown'
            const date = new Date(dateStr)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffDays = Math.floor(diffHours / 24)

            if (diffHours < 1) return 'Just now'
            if (diffHours < 24) return `${diffHours} hours ago`
            if (diffDays === 1) return 'Yesterday'
            if (diffDays < 7) return `${diffDays} days ago`
            return date.toLocaleDateString()
        }

        // Get file extension for type
        const getFileType = (filename?: string) => {
            if (!filename) return 'FILE'
            const ext = filename.split('.').pop()?.toUpperCase()
            return ext || 'FILE'
        }

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setViewingChild(null)}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-[1200px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                        <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">{currentItem.name}</h2>
                        <button
                            onClick={() => setViewingChild(null)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="overflow-y-auto flex-1 p-6 bg-white custom-scrollbar">
                        {/* Preview Container */}
                        <div className="relative w-full bg-[#F7F8FA] rounded-xl flex items-center justify-center overflow-hidden mb-6 min-h-[400px]" style={{ minHeight: isImage || isVideo ? 'auto' : '400px' }}>
                            {isImage ? (
                                <img
                                    src={currentItem.file_url}
                                    alt={currentItem.name || currentItem.file_name}
                                    className="max-w-full max-h-[60vh] object-contain shadow-sm rounded-lg"
                                />
                            ) : isVideo ? (
                                <video controls className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm" src={currentItem.file_url} />
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-20">
                                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                        <FileIcon className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <p className="text-gray-600 font-medium">{currentItem.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            {/* Dimensions */}
                            {isImage && (currentItem.metadata?.width || currentItem.metadata?.dimensions) && (
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Dimensions</p>
                                    <p className="text-sm text-gray-900 font-semibold">
                                        {currentItem.metadata?.dimensions ||
                                            `${currentItem.metadata?.width || 0}x${currentItem.metadata?.height || 0}`}
                                    </p>
                                </div>
                            )}

                            {/* Size */}
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Size</p>
                                <p className="text-sm text-gray-900 font-semibold">
                                    {formatFileSize(currentItem.metadata?.size || currentItem.size || 0)}
                                </p>
                            </div>

                            {/* Type */}
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Type</p>
                                <p className="text-sm text-gray-900 font-semibold">{getFileType(currentItem.name)}</p>
                            </div>

                            {/* Date */}
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Date</p>
                                <p className="text-sm text-gray-900 font-semibold">
                                    {formatDate((currentItem as any).created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(currentItem.file_url, currentItem.name);
                            }}
                            className="bg-[#ff0054] hover:bg-[#e60049] text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Asset</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <>
            {renderFolderView()}
            <AnimatePresence>
                {viewingChild && renderAssetModal()}
            </AnimatePresence>
        </>
    )
}
