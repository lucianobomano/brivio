"use client"

import React, { useState, useEffect } from 'react'
import { StandupHeader } from '@/components/standups/StandupHeader'
import { useTheme } from 'next-themes'
import {
    Plus, Filter, List, MoreVertical,
    Minus, Download, Star, Move, Trash2, X, CheckCircle, Upload, Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from "@/components/ui/input"
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import {
    getAssets,
    createFolder,
    uploadAsset,
    deleteAsset,
    deleteFolder,
    toggleFavorite,
    AssetFolder,
    Asset
} from '@/app/actions/assets'
import { AssetLibraryModal } from './AssetLibraryModal'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'

export function AssetsClient() {
    const { theme } = useTheme()
    const { workspace } = useWorkspace()
    const workspaceId = workspace?.id

    // State
    const [folders, setFolders] = useState<AssetFolder[]>([])
    const [assets, setAssets] = useState<Asset[]>([])
    const [breadcrumbs, setBreadcrumbs] = useState<AssetFolder[]>([])
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)

    // Selection State
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())

    // Actions State
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")

    // Asset Library Modal
    const [isLibraryOpen, setIsLibraryOpen] = useState(false)
    const [libraryInitialFolder, setLibraryInitialFolder] = useState<string | undefined>(undefined)

    // Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

    const loadData = React.useCallback(async () => {
        if (!workspaceId) return
        try {
            const res = await getAssets({ workspaceId }, currentFolderId)
            if (res.success) {
                setFolders(res.folders || [])
                setAssets(res.assets || [])
                setBreadcrumbs(res.breadcrumbs || [])
            }
        } catch (error) {
            console.error("Failed to load assets", error)
            toast.error("Failed to load assets")
        }
    }, [workspaceId, currentFolderId])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Clear selection when navigating folders
    useEffect(() => {
        setSelectedFolderIds(new Set())
        setSelectedAssetIds(new Set())
    }, [currentFolderId])

    // Handlers
    const handleToggleFolderSelection = (id: string) => {
        setSelectedFolderIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleToggleAssetSelection = (id: string) => {
        setSelectedAssetIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleDeselectAll = () => {
        setSelectedFolderIds(new Set())
        setSelectedAssetIds(new Set())
    }

    const handleSelectAll = () => {
        setSelectedFolderIds(new Set(folders.map(f => f.id)))
        setSelectedAssetIds(new Set(assets.map(a => a.id)))
    }

    const handleInvertSelection = () => {
        setSelectedFolderIds(prev => {
            const next = new Set<string>()
            folders.forEach(f => {
                if (!prev.has(f.id)) next.add(f.id)
            })
            return next
        })
        setSelectedAssetIds(prev => {
            const next = new Set<string>()
            assets.forEach(a => {
                if (!prev.has(a.id)) next.add(a.id)
            })
            return next
        })
    }


    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !workspaceId) return

        try {
            const res = await createFolder({ workspaceId }, newFolderName, currentFolderId)
            if (res.success) {
                toast.success("Folder created")
                setIsCreateFolderOpen(false)
                setNewFolderName("")
                loadData()
            } else {
                toast.error(res.error || "Failed to create folder")
            }
        } catch {
            toast.error("An error occurred")
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length || !workspaceId) return

        const files = Array.from(e.target.files)
        setIsUploading(true)
        setUploadProgress({ current: 0, total: files.length })

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            setUploadProgress(prev => ({ ...prev, current: i + 1 }))

            const formData = new FormData()
            formData.append('file', file)
            formData.append('workspaceId', workspaceId)
            if (currentFolderId) formData.append('folderId', currentFolderId)

            // Optional: Get dimensions for images if possible (skipping for simplicity now)

            try {
                const res = await uploadAsset(formData)
                if (res.success) successCount++
                else errorCount++
            } catch (err) {
                console.error(err)
                errorCount++
            }
        }

        setIsUploading(false)
        setIsUploadModalOpen(false)
        loadData()

        if (errorCount === 0) toast.success(`Uploaded ${successCount} files`)
        else toast.warning(`Uploaded ${successCount} files, ${errorCount} failed`)
    }


    const handleDeleteSelected = async () => {
        if (!confirm("Are you sure you want to delete selected items?")) return

        let successCount = 0
        let errorCount = 0

        // Delete Folders
        for (const id of Array.from(selectedFolderIds)) {
            const res = await deleteFolder(id)
            if (res.success) successCount++
            else errorCount++
        }

        // Delete Assets
        for (const id of Array.from(selectedAssetIds)) {
            const res = await deleteAsset(id)
            if (res.success) successCount++
            else errorCount++
        }

        if (errorCount === 0) toast.success(`Deleted ${successCount} items`)
        else toast.warning(`Deleted ${successCount} items, ${errorCount} failed`)

        handleDeselectAll()
        loadData()
    }

    const handleToggleFavorite = async (id: string, type: 'asset' | 'folder', currentStatus: boolean) => {
        const res = await toggleFavorite(id, type, currentStatus)
        if (res.success) {
            toast.success(currentStatus ? "Removed from favorites" : "Added to favorites")
            loadData()
        } else {
            toast.error("Failed to update favorite status")
        }
    }

    // Determine if we are in selection mode
    const isSelectionMode = selectedFolderIds.size > 0 || selectedAssetIds.size > 0

    return (
        <div className={cn(
            "flex flex-col min-h-screen font-sans transition-colors",
            theme === 'light' ? "bg-[#EFF0F2]" : "bg-bg-0"
        )}>
            {/* Header Section */}
            <div className={cn(
                "w-full flex flex-col items-center relative z-40 transition-colors",
                theme === 'light' ? "bg-[#ffffff]" : "bg-bg-0"
            )}>
                <StandupHeader />
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full h-full flex justify-center pt-[50px] relative">

                {/* Upload Modal Overlay */}
                <AnimatePresence>
                    {isUploadModalOpen && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className={cn(
                                    "relative w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border flex flex-col pointer-events-auto",
                                    theme === 'light' ? "bg-white border-[#E5E7EB]" : "bg-[#0F1012] border-[#1a1a1a]"
                                )}
                            >
                                <div className="h-16 bg-[#ff0054] px-6 flex items-center justify-between shrink-0">
                                    <h2 className="text-white text-[18px] font-bold tracking-tight">Upload asset</h2>
                                    <button
                                        onClick={() => !isUploading && setIsUploadModalOpen(false)}
                                        className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>

                                <div className="p-12 flex items-center justify-center h-[500px]">
                                    <div className={cn(
                                        "w-full h-full border border-dashed rounded-lg flex flex-col items-center justify-center gap-4 transition-colors group cursor-pointer relative",
                                        theme === 'light'
                                            ? "border-gray-300 hover:border-[#ff0054]/50 hover:bg-[#ff0054]/5"
                                            : "border-[#ffffff]/20 hover:border-[#ff0054]/50 hover:bg-[#ff0054]/5"
                                    )}>

                                        <input
                                            type="file"
                                            multiple
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={handleUpload}
                                            disabled={isUploading}
                                        />

                                        <div className="mb-2">
                                            {isUploading ? (
                                                <div className="w-12 h-12 border-3 border-[#ff0054] border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-[#666] group-hover:text-[#ff0054] transition-colors" />
                                            )}
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <span className={cn(
                                                "font-medium text-[16px]",
                                                theme === 'light' ? "text-text-primary" : "text-white"
                                            )}>
                                                {isUploading
                                                    ? `A carregar ${uploadProgress.current} de ${uploadProgress.total} arquivo${uploadProgress.total > 1 ? 's' : ''}...`
                                                    : "Arraste e solte os seus arquivos aqui"
                                                }
                                            </span>
                                            {!isUploading && (
                                                <span className="text-[#666] text-[14px]">ou clique para carregar do computador (múltiplos arquivos)</span>
                                            )}
                                            {isUploading && uploadProgress.total > 1 && (
                                                <div className="w-48 h-1.5 bg-[#222] rounded-full mt-3 overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#ff0054] transition-all duration-300"
                                                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {!isUploading && (
                                            <button className="mt-4 px-6 py-2.5 bg-[#ff0054] hover:bg-[#ff0054]/90 text-white text-[14px] font-bold rounded-lg transition-colors shadow-lg shadow-[#ff0054]/20 pointer-events-none">
                                                Selecionar do Computador
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Create Folder Modal */}
                <AnimatePresence>
                    {isCreateFolderOpen && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 text-[14px]">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsCreateFolderOpen(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className={cn(
                                    "relative w-[600px] h-[305px] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center pt-[120px]",
                                    theme === 'light' ? "bg-white" : "bg-[#15161B]"
                                )}
                            >

                                {/* Input Field */}
                                <div className="w-full max-w-sm mb-[77px] relative group">
                                    <input
                                        type="text"
                                        placeholder="Folder name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                        className={cn(
                                            "w-full bg-transparent border-b text-center pb-2 placeholder:text-[#555] focus:outline-none focus:border-[#ff0054] transition-colors text-[16px]",
                                            theme === 'light'
                                                ? "border-gray-200 text-text-primary"
                                                : "border-[#333] text-white"
                                        )}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={handleCreateFolder}
                                        className={cn(
                                            "px-8 py-2.5 text-white rounded-lg transition-colors font-medium",
                                            theme === 'light' ? "bg-black hover:bg-black/90" : "bg-[#0A0A0B] hover:bg-[#1a1a1a]"
                                        )}
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => setIsCreateFolderOpen(false)}
                                        className="px-6 py-2.5 text-[#888] hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>

                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Bulk Actions Header (Floating) */}
                <AnimatePresence>
                    {isSelectionMode && (
                        <div className="fixed top-[130px] z-50 flex justify-center w-full pointer-events-none">
                            <div className="pointer-events-auto">
                                <BulkActionsHeader
                                    selectedCount={selectedFolderIds.size + selectedAssetIds.size}
                                    onDeselectAll={handleDeselectAll}
                                    onSelectAll={handleSelectAll}
                                    onInvertSelection={handleInvertSelection}
                                    onDelete={handleDeleteSelected}
                                    onMove={() => toast.info("Move not implemented yet")} // Placeholder
                                />
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="w-full flex flex-col items-center gap-8 pb-32">

                    {/* Controls Row */}
                    <div className="w-[1545px] flex justify-between items-end px-4">
                        {/* Search Bar */}
                        <div className="relative w-[300px]">
                            <span className="text-sm font-medium text-text-secondary mb-2 block">Pesquisar</span>
                            <div className="relative">
                                <Input
                                    className={cn(
                                        "bg-transparent border-t-0 border-x-0 border-b rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-accent-indigo placeholder:text-text-tertiary shadow-none",
                                        theme === 'light'
                                            ? "border-[#E5E7EB] text-text-primary"
                                            : "border-[#373737] text-white"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-6 text-text-secondary">
                            <button className="flex items-center gap-2 hover:text-text-primary transition-colors">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-bold">Filtrar por</span>
                            </button>
                            <button className="flex items-center gap-2 hover:text-text-primary transition-colors">
                                <List className="w-4 h-4" />
                                <span className="text-sm font-bold">Lista</span>
                            </button>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 hover:text-[#FF0054] transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-bold">Upload</span>
                            </button>
                        </div>
                    </div>

                    {/* Breadcrumbs (Optional but good for navigation) */}
                    {currentFolderId && (
                        <div className="w-[1545px] px-4 flex items-center gap-2 text-sm text-text-secondary">
                            <button onClick={() => setCurrentFolderId(undefined)} className="hover:text-text-primary">All Assets</button>
                            {breadcrumbs.map((crumb, i) => (
                                <React.Fragment key={crumb.id}>
                                    <span>/</span>
                                    <button
                                        onClick={() => setCurrentFolderId(crumb.id)}
                                        disabled={i === breadcrumbs.length - 1}
                                        className={cn(
                                            "hover:text-text-primary",
                                            i === breadcrumbs.length - 1 && "font-bold text-text-primary pointer-events-none"
                                        )}
                                    >
                                        {crumb.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Grid */}
                    <div className="w-[1545px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* New Folder Button */}
                        <button
                            onClick={() => setIsCreateFolderOpen(true)}
                            className="w-[375px] h-[400px] rounded-[12px] group relative overflow-hidden flex flex-col items-center justify-center transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl"
                        >
                            <div
                                className="absolute inset-0 animate-liquid-gradient"
                                style={{
                                    background: "linear-gradient(135deg, #FF0054, #88007F, #06D6A0, #311C99)"
                                }}
                            />
                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-[#FF0054]" strokeWidth={3} />
                                </div>
                                <span className="text-white font-bold text-lg tracking-wide">Nova Pasta</span>
                            </div>
                        </button>

                        {/* Folder Cards */}
                        {folders.map(folder => {
                            const isSelected = selectedFolderIds.has(folder.id)
                            return (
                                <div
                                    key={folder.id}
                                    onClick={() => {
                                        setLibraryInitialFolder(folder.id)
                                        setIsLibraryOpen(true)
                                    }}
                                    className={cn(
                                        "w-[375px] h-[400px] rounded-[12px] relative flex flex-col items-center justify-between p-8 transition-colors group cursor-pointer border",
                                        isSelected
                                            ? "border-[#FF0054] bg-[#FF0054]/5"
                                            : "border-transparent hover:border-white/5",
                                        theme === 'light'
                                            ? (isSelected ? "bg-[#FF0054]/5" : "bg-transparent hover:bg-[#DDE0E6]")
                                            : (isSelected ? "bg-[#FF0054]/5" : "bg-transparent hover:bg-[#292C34]")
                                    )}
                                >
                                    {/* Action/Selection Menu */}
                                    <div className="absolute top-4 right-4 z-20">
                                        {isSelectionMode ? (
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                isSelected ? "border-[#FF0054] bg-[#FF0054]" : "border-text-secondary"
                                            )}>
                                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                            </div>
                                        ) : (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleFavorite(folder.id, 'folder', folder.is_favorite || false)
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-full transition-colors",
                                                        folder.is_favorite ? "text-[#FF0054]" : "text-text-secondary hover:text-white"
                                                    )}
                                                >
                                                    <Heart className={cn("w-5 h-5", folder.is_favorite && "fill-[#FF0054]")} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleFolderSelection(folder.id)
                                                    }}
                                                    className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-text-secondary"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Folder Icon */}
                                    <div className="mt-4 filter drop-shadow-2xl transition-transform group-hover:-translate-y-2 relative w-[315px] h-[251px]">
                                        <img
                                            src="/images/custom-folder-icon.png"
                                            alt="Folder"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="w-full text-center mt-6">
                                        <h3 className={cn(
                                            "font-bold text-xl mb-1",
                                            theme === 'light' ? "text-text-primary" : "text-white"
                                        )}>{folder.name}</h3>
                                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
                                            {format(new Date(folder.created_at), "d MMM yyyy")}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Asset Cards - Simple representation for now */}
                        {assets.map(asset => {
                            const isSelected = selectedAssetIds.has(asset.id)
                            return (
                                <div
                                    key={asset.id}
                                    onClick={() => handleToggleAssetSelection(asset.id)}
                                    className={cn(
                                        "w-[375px] h-[400px] rounded-[12px] relative flex flex-col items-center justify-between p-8 transition-colors group cursor-pointer border",
                                        isSelected
                                            ? "border-[#FF0054] bg-[#FF0054]/5"
                                            : "border-transparent hover:border-white/5",
                                        theme === 'light'
                                            ? (isSelected ? "bg-[#FF0054]/5" : "bg-transparent hover:bg-[#DDE0E6]")
                                            : (isSelected ? "bg-[#FF0054]/5" : "bg-transparent hover:bg-[#292C34]")
                                    )}
                                >
                                    {/* Selection UI */}
                                    <div className="absolute top-4 right-4 z-20">
                                        {isSelectionMode ? (
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                isSelected ? "border-[#FF0054] bg-[#FF0054]" : "border-text-secondary"
                                            )}>
                                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                            </div>
                                        ) : (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleFavorite(asset.id, 'asset', asset.is_favorite || false)
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-full transition-colors",
                                                        asset.is_favorite ? "text-[#FF0054]" : "text-text-secondary hover:text-white"
                                                    )}
                                                >
                                                    <Heart className={cn("w-5 h-5", asset.is_favorite && "fill-[#FF0054]")} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleAssetSelection(asset.id)
                                                    }}
                                                    className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-text-secondary"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Asset Preview */}
                                    <div className="mt-4 filter drop-shadow-2xl transition-transform group-hover:-translate-y-2 relative w-[315px] h-[251px] flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
                                        {asset.type === 'image' && asset.file_url ? (
                                            <img
                                                src={asset.file_url}
                                                alt={asset.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-4xl text-text-secondary">FILE</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="w-full text-center mt-6">
                                        <h3 className={cn(
                                            "font-bold text-xl mb-1 truncate px-2",
                                            theme === 'light' ? "text-text-primary" : "text-white"
                                        )}>{asset.name}</h3>
                                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
                                            {format(new Date(asset.created_at), "d MMM yyyy")}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}

                    </div>
                </div>
            </main>

            <AssetLibraryModal
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                workspaceId={workspaceId}
                brandName="Workspace Assets"
                initialFolderId={libraryInitialFolder}
            />
        </div>
    )
}


interface BulkActionsHeaderProps {
    selectedCount: number
    onDeselectAll: () => void
    onSelectAll: () => void
    onInvertSelection: () => void
    onDelete?: () => void
    onMove?: () => void
}

function BulkActionsHeader({
    selectedCount,
    onDeselectAll,
    onSelectAll,
    onInvertSelection,
    onDelete,
    onMove
}: BulkActionsHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="h-[45px] bg-[#ff0054] z-[60] flex items-center justify-between px-4 shadow-xl rounded-full min-w-[400px]"
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
                        {selectedCount} item{selectedCount > 1 && 's'} selecionado{selectedCount > 1 && 's'}
                    </span>
                </div>

                <div className="h-4 w-[1px] bg-white/20 mx-2" />

                <div className="flex items-center gap-2">
                    <button
                        onClick={onSelectAll}
                        className="text-[12px] font-bold text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all"
                    >
                        Selecionar tudo
                    </button>
                    <button
                        onClick={onInvertSelection}
                        className="text-[12px] font-bold text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all"
                    >
                        Inverter
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
                <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                    <Download className="w-4 h-4" />
                    <span className="font-medium text-[13px]">Download</span>
                </button>
                <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                    <Star className="w-4 h-4" />
                    <span className="font-medium text-[13px]">Favorite</span>
                </button>
                <button onClick={onMove} className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                    <Move className="w-4 h-4" />
                    <span className="font-medium text-[13px]">Move</span>
                </button>
                <button onClick={onDelete} className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                    <Trash2 className="w-4 h-4" />
                    <span className="font-medium text-[13px]">Delete</span>
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
