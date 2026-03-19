"use client"

import React, { useState, useEffect } from "react"
import {
    X,
    Folder,
    ChevronRight,
    ChevronDown,
    Clock,
    Heart,
    Trash2,
    CloudUpload,
    Plus,
    UserPlus,
    Share,
    Upload,
    MoreVertical,
    Edit2,
    Move,
    Star,
    Users,
    Link,
    ExternalLink,
    CheckCircle,
    Download,
    Minus,
    MoreHorizontal,
} from "lucide-react"
import {
    getAssets,
    getFavorites,
    getAllFolders,
    createFolder,
    uploadAsset,
    deleteAsset,
    deleteFolder,
    renameFolder,
    moveFolder,
    updateFolderAccess,
    toggleFavorite,
    updateShareSettings,
    getShareSettings,
    AssetFolder,
    Asset
} from "@/app/actions/assets"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnimatePresence, motion } from "framer-motion"
import { Toaster, toast } from "sonner"
import { CustomDatePicker } from "../brandbook/editor/CustomDatePicker"
import JSZip from "jszip"
import { format } from "date-fns"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverArrow,
} from "@/components/ui/popover"


interface AssetLibraryProps {
    isOpen: boolean
    onClose: () => void
    brandId?: string
    workspaceId?: string
    brandName?: string
    initialFolderId?: string
}

export function AssetLibraryModal({ isOpen, onClose, brandId, workspaceId, brandName = "Assets", initialFolderId }: AssetLibraryProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
    const [folders, setFolders] = useState<AssetFolder[]>([]) // Current view folders (flat list for grid)
    const [assets, setAssets] = useState<Asset[]>([])
    const [breadcrumbs, setBreadcrumbs] = useState<AssetFolder[]>([])
    const [allFolders, setAllFolders] = useState<AssetFolder[]>([]) // For sidebar tree
    const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set(["root"]))

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
    const [newFolderName, setNewFolderName] = useState("")

    // Context Menu State
    const [folderToRename, setFolderToRename] = useState<AssetFolder | null>(null)
    const [folderToMove, setFolderToMove] = useState<AssetFolder | null>(null)
    const [folderToManageAccess, setFolderToManageAccess] = useState<AssetFolder | null>(null)
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())

    const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all')

    // Sync currentFolderId with initialFolderId when modal opens
    useEffect(() => {
        if (isOpen && initialFolderId) {
            setCurrentFolderId(initialFolderId)
        }
    }, [isOpen, initialFolderId])

    const [destinationFolderId, setDestinationFolderId] = useState<string>("root")

    const handleToggleSelection = (folderId: string) => {
        setSelectedFolderIds(prev => {
            const next = new Set(prev)
            if (next.has(folderId)) {
                next.delete(folderId)
            } else {
                next.add(folderId)
            }
            return next
        })
    }

    const handleToggleAssetSelection = (assetId: string) => {
        setSelectedAssetIds(prev => {
            const next = new Set(prev)
            if (next.has(assetId)) {
                next.delete(assetId)
            } else {
                next.add(assetId)
            }
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
    const [renameValue, setRenameValue] = useState("")



    const loadData = React.useCallback(async () => {
        const scope = workspaceId ? { workspaceId } : { brandId }

        if (viewMode === 'favorites') {
            const res = await getFavorites(scope)
            if (res.success) {
                setFolders(res.folders || [])
                setAssets(res.assets || [])
                setBreadcrumbs([]) // Breadcrumbs don't make sense in favorites view
            }
        } else {
            // 1. Fetch current view data (Main Area)
            const res = await getAssets(scope, currentFolderId)
            if (res.success) {
                setFolders(res.folders || [])
                setAssets(res.assets || [])
                setBreadcrumbs(res.breadcrumbs || [])
            }
        }

        // 2. Fetch all folders for Sidebar Tree
        const treeRes = await getAllFolders(scope)
        if (treeRes.success) {
            setAllFolders(treeRes.folders || [])
        }
    }, [brandId, workspaceId, currentFolderId, viewMode])

    useEffect(() => {
        if (isOpen && (brandId || workspaceId)) {
            loadData()
        }
    }, [isOpen, brandId, workspaceId, loadData])

    // Helper to build tree from flat list
    const buildTree = (items: AssetFolder[], parentId: string | null = null): AssetFolder[] => {
        return items
            .filter(item => item.parent_id === parentId)
            .map(item => ({
                ...item,
                children: buildTree(items, item.id)
            }))
    }

    const folderTree = buildTree(allFolders)

    const toggleFolderExpand = (folderId: string) => {
        setExpandedFolderIds(prev => {
            const next = new Set(prev)
            if (next.has(folderId)) next.delete(folderId)
            else next.add(folderId)
            return next
        })
    }

    const handleBulkDownload = async () => {
        if (selectedAssetIds.size === 0 && selectedFolderIds.size === 0) return

        const assetsToDownload = assets.filter(a => selectedAssetIds.has(a.id))
        const foldersToDownload = folders.filter(f => selectedFolderIds.has(f.id))

        if (assetsToDownload.length === 0 && foldersToDownload.length === 0) return

        let zipName = "Brivio.zip"
        if (selectedAssetIds.size === 0 && foldersToDownload.length === 1) {
            zipName = `${foldersToDownload[0].name}.zip`
        }

        const toastId = toast.loading(`Preparing download...`)

        try {
            const zip = new JSZip()
            const scope = workspaceId ? { workspaceId } : { brandId }

            // 1. Add selected assets (root level in zip)
            await Promise.all(assetsToDownload.map(async (asset) => {
                if (!asset.file_url) return
                try {
                    const response = await fetch(asset.file_url)
                    const blob = await response.blob()
                    zip.file(asset.name || `file_${asset.id}`, blob)
                } catch (e) {
                    console.error(`Failed to download asset ${asset.name}`, e)
                }
            }))

            // 2. Add selected folders and their contents
            await Promise.all(foldersToDownload.map(async (folder) => {
                const folderZip = zip.folder(folder.name)
                if (!folderZip) return

                // Fetch assets in this folder
                // Note: deeply recursive download requires more complex logic. 
                // For now, we download files immediately inside the folder.
                const res = await getAssets(scope, folder.id)

                if (res.success && res.assets) {
                    await Promise.all(res.assets.map(async (asset) => {
                        if (!asset.file_url) return
                        try {
                            const response = await fetch(asset.file_url)
                            const blob = await response.blob()
                            folderZip.file(asset.name || `file_${asset.id}`, blob)
                        } catch (e) {
                            console.error(`Failed to download asset ${asset.name} in folder ${folder.name}`, e)
                        }
                    }))
                }
            }))

            toast.loading("Compressing...", { id: toastId })

            const content = await zip.generateAsync({ type: "blob" })
            const url = window.URL.createObjectURL(content)
            const link = document.createElement('a')
            link.href = url
            link.download = zipName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success("Download started", { id: toastId })
        } catch (error) {
            console.error("Failed to load assets", error)
            toast.error("Failed to load assets")
        }
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return
        const scope = workspaceId ? { workspaceId } : { brandId }
        const res = await createFolder(scope, newFolderName, currentFolderId)
        if (res.success) {
            setNewFolderName("")
            setIsCreateFolderModalOpen(false)
            loadData()
        } else {
            alert("Failed to create folder")
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        setUploadProgress({ current: 0, total: files.length })

        // Calculate Size helper
        const formatSize = (bytes: number) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const uploadedAssets: Asset[] = []
        let errorCount = 0

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            setUploadProgress({ current: i + 1, total: files.length })

            const formData = new FormData()
            formData.append("file", file)
            if (workspaceId) formData.append("workspaceId", workspaceId)
            else if (brandId) formData.append("brandId", brandId)
            if (currentFolderId) {
                formData.append("folderId", currentFolderId)
            }
            formData.append("metadata_size", formatSize(file.size));

            // Calculate Dimensions (if image)
            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise((resolve) => {
                    img.onload = () => {
                        formData.append("metadata_dimensions", `${img.width}x${img.height}`);
                        URL.revokeObjectURL(img.src)
                        resolve(true);
                    };
                    img.onerror = () => resolve(true);
                });
            }

            try {
                const result = await uploadAsset(formData)
                if (result.success && result.asset) {
                    const newAsset = {
                        ...result.asset,
                        metadata: result.asset.metadata
                    }
                    uploadedAssets.push(newAsset)
                } else {
                    errorCount++
                    console.error("Upload failed for:", file.name, result.error)
                }
            } catch (error) {
                errorCount++
                console.error("Upload error for:", file.name, error)
            }
        }

        // Add all successfully uploaded assets to state
        if (uploadedAssets.length > 0) {
            setAssets(prev => [...uploadedAssets, ...prev])
        }

        // Show toast notification
        if (errorCount === 0) {
            toast.success(`${uploadedAssets.length} arquivo${uploadedAssets.length > 1 ? 's' : ''} carregado${uploadedAssets.length > 1 ? 's' : ''} com sucesso`)
        } else if (uploadedAssets.length > 0) {
            toast.warning(`${uploadedAssets.length} carregado${uploadedAssets.length > 1 ? 's' : ''}, ${errorCount} falhou`)
        } else {
            toast.error("Falha ao carregar os arquivos")
        }

        setIsUploading(false)
        setUploadProgress({ current: 0, total: 0 })
        setIsUploadModalOpen(false)
        e.target.value = ''
    }

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean
        type: 'asset' | 'folder' | null
        id: string | null
    }>({
        isOpen: false,
        type: null,
        id: null
    })

    // Expiration Modal State
    const [expirationModal, setExpirationModal] = useState<{
        isOpen: boolean
        assetId: string | null
    }>({
        isOpen: false,
        assetId: null
    })
    const [expirationSettings, setExpirationSettings] = useState<{
        isEnabled: boolean
        date: string
    }>({
        isEnabled: false,
        date: new Date().toISOString()
    })

    // Share Modal State
    const [shareModal, setShareModal] = useState<{
        isOpen: boolean
        assetId: string | null
        type: 'asset' | 'folder' | 'root'
    }>({
        isOpen: false,
        assetId: null,
        type: 'asset'
    })
    const [shareSettings, setShareSettings] = useState<{
        isLinkActive: boolean
        linkUrl: string
        passcodeEnabled: boolean
        passcode: string
        expirationEnabled: boolean
        expirationDuration: '1d' | '3d' | '7d' | '14d' | null
        expirationDate: string | undefined
        email: string
    }>({
        isLinkActive: false,
        linkUrl: "",
        passcodeEnabled: false,
        passcode: "",
        expirationEnabled: false,
        expirationDuration: null,
        expirationDate: undefined,
        email: ""
    })

    const handleDeleteAsset = (assetId: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'asset', id: assetId })
    }

    const handleDeleteFolder = (folderId: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'folder', id: folderId })
    }

    const handleConfirmDelete = async () => {
        const { type, id } = deleteConfirmation
        if (!type || !id) return

        // Handle bulk delete
        if (id === 'bulk') {
            let hasError = false

            // Delete all selected folders
            for (const folderId of Array.from(selectedFolderIds)) {
                const res = await deleteFolder(folderId)
                if (!res.success) hasError = true
                if (currentFolderId === folderId) setCurrentFolderId(undefined)
            }

            // Delete all selected assets
            for (const assetId of Array.from(selectedAssetIds)) {
                const res = await deleteAsset(assetId)
                if (!res.success) hasError = true
            }

            if (hasError) {
                toast.error("Alguns itens não puderam ser eliminados")
            } else {
                toast.success("Itens eliminados com sucesso")
            }

            // Clear selection and reload
            setSelectedFolderIds(new Set())
            setSelectedAssetIds(new Set())
            loadData()
            setDeleteConfirmation({ isOpen: false, type: null, id: null })
            return
        }

        // Single item delete (existing logic)
        if (type === 'asset') {
            const res = await deleteAsset(id)
            if (res.success) loadData()
            else alert("Failed to delete asset")
        } else if (type === 'folder') {
            const res = await deleteFolder(id)
            if (res.success) {
                if (currentFolderId === id) setCurrentFolderId(undefined)
                loadData()
            } else alert("Failed to delete folder")
        }

        setDeleteConfirmation({ isOpen: false, type: null, id: null })
    }

    const handleRenameFolder = async () => {
        if (!folderToRename || !renameValue.trim()) return
        const res = await renameFolder(folderToRename.id, renameValue)
        if (res.success) {
            setFolderToRename(null)
            loadData()
        } else {
            alert("Failed to rename")
        }
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

    const handleMoveFolder = async () => {
        if (!folderToMove) return
        const dest = destinationFolderId === "root" ? null : destinationFolderId
        if (dest === folderToMove.id) return

        const res = await moveFolder(folderToMove.id, dest)
        if (res.success) {
            setFolderToMove(null)
            setDestinationFolderId("root")
            loadData()
        } else {
            alert("Failed to move")
        }
    }

    const handleUpdateAccess = async (key: 'is_public' | 'allow_viewers', value: boolean) => {
        if (!folderToManageAccess) return

        // Optimistic update
        const updatedFolder = { ...folderToManageAccess, [key]: value } as AssetFolder
        setFolderToManageAccess(updatedFolder)

        const res = await updateFolderAccess(
            folderToManageAccess.id,
            key === 'is_public' ? value : folderToManageAccess.is_public || false,
            key === 'allow_viewers' ? value : folderToManageAccess.allow_viewers || false
        )

        if (res.success) {
            loadData()
        } else {
            // Revert on failure
            setFolderToManageAccess(folderToManageAccess)
            alert("Failed to update permissions")
        }
    }

    // Sync settings    // --- Share Logic ---
    useEffect(() => {
        if (shareModal.isOpen && shareModal.assetId) {
            getShareSettings(shareModal.assetId, shareModal.type as any).then(s => {
                if (s) {
                    setShareSettings({
                        isLinkActive: s.active,
                        linkUrl: s.active ? `https://brivio.app/share/${shareModal.assetId}` : '',
                        passcodeEnabled: s.passcodeEnabled,
                        passcode: s.passcode || '',
                        expirationEnabled: s.expirationEnabled,
                        expirationDuration: s.expirationDuration as any || null,
                        expirationDate: s.expirationDate,
                        email: s.email || ''
                    })
                } else {
                    setShareSettings({
                        isLinkActive: false,
                        linkUrl: '',
                        passcodeEnabled: false,
                        passcode: '',
                        expirationEnabled: false,
                        expirationDuration: null,
                        expirationDate: undefined,
                        email: ''
                    })
                }
            })
        }
    }, [shareModal.isOpen, shareModal.assetId, shareModal.type])

    const saveShareSettings = async (newSettings: typeof shareSettings) => {
        if (!shareModal.assetId) return

        await updateShareSettings(shareModal.assetId, shareModal.type as any, {
            active: newSettings.isLinkActive,
            passcodeEnabled: newSettings.passcodeEnabled,
            passcode: newSettings.passcode,
            expirationEnabled: newSettings.expirationEnabled,
            expirationDuration: newSettings.expirationDuration,
            expirationDate: newSettings.expirationDate,
            email: newSettings.email
        })
        // Optional: toast.success("Settings saved") - simpler to be silent
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden text-[14px]">
                    {/* Dark Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
                    />

                    {/* Main Sidebar/Modal Sliding from Right - 100% Width */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="bg-[#0A0A0B] w-full h-screen overflow-hidden flex flex-row relative z-10"
                    >
                        {/* Top Actions Area */}
                        {selectedFolderIds.size === 0 && selectedAssetIds.size === 0 && (
                            <div className="absolute top-10 right-10 flex items-center gap-3 z-50">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            className="h-9 px-5 bg-[#ff0054] rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(255,0,84,0.3)] group/add"
                                        >
                                            <Plus className="w-4 h-4 text-white" />
                                            <span className="text-[14px] font-bold text-white tracking-tight">Add novo</span>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="bottom"
                                        align="center"
                                        sideOffset={12}
                                        className="w-[200px] z-[200] bg-[#0D0D0E] border-[#1a1a1a] p-1.5 rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                                    >
                                        <PopoverArrow className="fill-[#0D0D0E] stroke-[#1a1a1a] stroke-[0.5px] scale-[2]" />
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => setIsUploadModalOpen(true)}
                                                className="flex items-center px-5 py-3.5 rounded-2xl hover:bg-white/[0.03] transition-colors group/item text-left"
                                            >
                                                <span className="text-[16px] font-medium text-[#888] group-hover/item:text-white transition-colors">Upload asset</span>
                                            </button>
                                            <button
                                                onClick={() => setIsCreateFolderModalOpen(true)}
                                                className="flex items-center px-5 py-3.5 rounded-2xl hover:bg-white/[0.03] transition-colors group/item text-left"
                                            >
                                                <span className="text-[16px] font-medium text-[#888] group-hover/item:text-white transition-colors">Create folder</span>
                                            </button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <div className="flex items-center gap-3 mr-4 border-r border-[#333] pr-6">
                                    <button className="text-[#666] hover:text-white transition-colors">
                                        <UserPlus className="w-[18px] h-[18px]" />
                                    </button>
                                    <button className="text-[#666] hover:text-white transition-colors"
                                        onClick={() => {
                                            if (selectedFolderIds.size === 1) {
                                                const folderId = Array.from(selectedFolderIds)[0]
                                                setShareModal({ isOpen: true, assetId: folderId, type: 'folder' })
                                            } else if (selectedAssetIds.size === 1) {
                                                const assetId = Array.from(selectedAssetIds)[0]
                                                setShareModal({ isOpen: true, assetId: assetId, type: 'asset' })
                                            } else if (selectedFolderIds.size === 0 && selectedAssetIds.size === 0) {
                                                // Share Root Folder
                                                setShareModal({ isOpen: true, assetId: brandId, type: 'root' })
                                            }
                                        }}
                                    >
                                        <Share className="w-[18px] h-[18px]" />
                                    </button>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#222] transition-colors group/close shadow-lg border border-[#222]"
                                >
                                    <X className="w-5 h-5 text-[#888] group-hover/close:text-white transition-colors" />
                                </button>
                            </div>
                        )}

                        {/* 1. Sidebar Navigation */}
                        <div className="w-[300px] bg-black border-r border-[#1a1a1a] flex flex-col h-full pt-16 pb-10 px-6">

                            {/* Brand Logo/Circle */}
                            <div className="flex justify-center mb-12">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF0054] via-[#0000FF] to-[#00FF94] p-[3px]">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        <div className="w-14 h-14 rounded-full border-4 border-white opacity-10" />
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 px-2">
                                {/* Section: Assets */}
                                <div className="mb-8">
                                    <h3 className="text-[11px] font-bold text-[#444] uppercase tracking-[0.1em] mb-6 px-2">Assets</h3>
                                    <div className="space-y-1">
                                        {/* Root "Brand Assets" Item */}
                                        <div
                                            className={cn(
                                                "group flex items-center py-2 px-3 rounded-xl cursor-pointer transition-all duration-300",
                                                currentFolderId === undefined ? "bg-white/[0.03] border border-white/10 shadow-inner" : "hover:bg-white/[0.02]"
                                            )}
                                        >
                                            {/* Root Toggle Arrow */}
                                            <div
                                                className="w-4 h-4 flex items-center justify-center mr-1"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setExpandedFolderIds(prev => {
                                                        const next = new Set(prev)
                                                        if (next.has("root")) next.delete("root")
                                                        else next.add("root")
                                                        return next
                                                    })
                                                }}
                                            >
                                                <div className="hover:bg-white/10 rounded p-0.5 transition-colors">
                                                    {expandedFolderIds.has("root") ? <ChevronDown className="w-3 h-3 text-[#666]" /> : <ChevronRight className="w-3 h-3 text-[#666]" />}
                                                </div>
                                            </div>

                                            <div
                                                className="flex items-center flex-1 overflow-hidden"
                                                onClick={() => {
                                                    setViewMode('all')
                                                    setCurrentFolderId(undefined)
                                                }}
                                            >
                                                <Folder className={cn("w-4 h-4 transition-colors mr-2.5 shrink-0", (currentFolderId === undefined && viewMode === 'all') ? "text-[#ff0054]" : "text-[#444] group-hover:text-white")} />
                                                <span className={cn(
                                                    "text-[14px] transition-colors tracking-tight truncate",
                                                    (currentFolderId === undefined && viewMode === 'all') ? "text-white font-bold" : "text-[#888] font-medium group-hover:text-white"
                                                )}>
                                                    {brandName}
                                                </span>
                                            </div>

                                            {currentFolderId === undefined && viewMode === 'all' && (
                                                <div className="ml-auto w-5 h-5 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                                                    <Plus className="w-3.5 h-3.5 text-[#555] group-hover:text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Children of Root */}
                                        {expandedFolderIds.has("root") && (
                                            <div className="mt-1">
                                                {folderTree.map(node => (
                                                    <FolderTreeItem
                                                        key={node.id}
                                                        node={node}
                                                        level={1}
                                                        currentFolderId={currentFolderId}
                                                        expandedIds={expandedFolderIds}
                                                        onToggleExpand={toggleFolderExpand}
                                                        onSelectFolder={setCurrentFolderId}
                                                    />
                                                ))}
                                                {folderTree.length === 0 && (
                                                    <div className="pl-12 py-1">
                                                        <span className="text-[12px] text-[#444]">No subfolders</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section: Personal */}
                                <div className="mb-8 pt-6 border-t border-[#1a1a1a]">
                                    <h3 className="text-[11px] font-bold text-[#444] uppercase tracking-[0.1em] mb-6 px-2">Personal</h3>
                                    <div className="space-y-4 px-2">
                                        <NavItem icon={<Clock className="w-4 h-4" />} label="Recent files" onClick={() => { }} />
                                        <NavItem
                                            icon={<Heart className="w-4 h-4" />}
                                            label="My Favorites"
                                            isActive={viewMode === 'favorites'}
                                            onClick={() => {
                                                setViewMode('favorites')
                                                setCurrentFolderId(undefined)
                                            }}
                                        />
                                        <NavItem icon={<Trash2 className="w-4 h-4" />} label="Trash Bin" onClick={() => { }} />
                                    </div>
                                </div>

                                {/* Section: Shared assets */}
                                <div className="mb-8 pt-6 border-t border-[#1a1a1a]">
                                    <h3 className="text-[11px] font-bold text-[#444] uppercase tracking-[0.1em] mb-6 px-2">Shared assets</h3>
                                    <div className="space-y-4 px-2">
                                        <NavItem icon={<Trash2 className="w-4 h-4" />} label="Trash Bin" />
                                        {/* Back button if deep? */}
                                        {currentFolderId && (
                                            <button
                                                onClick={() => setCurrentFolderId(undefined)} // Reset to root for now
                                                className="mt-4 text-xs text-[#666] hover:text-white flex items-center gap-2"
                                            >
                                                Back to Root
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Bottom: Storage Indicator */}
                            <div className="mt-auto pt-6">
                                <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center justify-between shadow-lg">
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[14px] font-bold text-white">8.25 MB</span>
                                            <span className="text-[11px] text-[#555]">/ 5GB</span>
                                        </div>
                                        <div className="w-full bg-[#222] h-1 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-[#ff0054] h-full w-[15%]" />
                                        </div>
                                    </div>
                                    <button className="text-[11px] font-bold text-white hover:bg-[#ff0054] transition-all px-3 py-1.5 bg-[#222] rounded-xl ml-4">
                                        Upgrade
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Main Content Area */}
                        <div className="flex-1 bg-[#0A0A0B] relative flex flex-col items-center justify-start p-20 pt-[60px]">

                            {/* Breadcrumb Navigation */}
                            {selectedFolderIds.size === 0 && selectedAssetIds.size === 0 && (
                                <div className="absolute top-10 left-16 flex items-center gap-2 h-8 text-[16px]">
                                    <button
                                        onClick={() => {
                                            setViewMode('all')
                                            setCurrentFolderId(undefined)
                                        }}
                                        className="font-semibold text-[#666] hover:text-white transition-colors"
                                    >
                                        {viewMode === 'favorites' ? 'Favorites' : brandName}
                                    </button>
                                    {breadcrumbs.map((crumb, index) => (
                                        <React.Fragment key={crumb.id}>
                                            <span className="text-[#444] mx-1">/</span>
                                            <button
                                                onClick={() => setCurrentFolderId(crumb.id)}
                                                disabled={index === breadcrumbs.length - 1}
                                                className={cn(
                                                    "transition-colors",
                                                    index === breadcrumbs.length - 1
                                                        ? "font-semibold text-white cursor-default"
                                                        : "font-medium text-[#666] hover:text-white"
                                                )}
                                            >
                                                {crumb.name}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}

                            {/* Bulk Actions Header */}
                            <AnimatePresence>
                                {(selectedFolderIds.size > 0 || selectedAssetIds.size > 0) && (
                                    <BulkActionsHeader
                                        selectedCount={selectedFolderIds.size + selectedAssetIds.size}
                                        onDeselectAll={handleDeselectAll}
                                        onSelectAll={handleSelectAll}
                                        onInvertSelection={handleInvertSelection}
                                        onDownload={handleBulkDownload}
                                        onDelete={() => {
                                            // Show confirmation dialog for bulk delete
                                            if (selectedFolderIds.size > 0 || selectedAssetIds.size > 0) {
                                                setDeleteConfirmation({
                                                    isOpen: true,
                                                    type: selectedFolderIds.size > 0 ? 'folder' : 'asset',
                                                    id: 'bulk' // Special marker for bulk delete
                                                })
                                            }
                                        }}
                                        onMove={() => {
                                            // Open move modal for first selected item as starting point
                                            if (selectedFolderIds.size > 0) {
                                                const firstFolderId = Array.from(selectedFolderIds)[0]
                                                const folder = folders.find(f => f.id === firstFolderId)
                                                if (folder) {
                                                    setFolderToMove(folder)
                                                    setDestinationFolderId("root")
                                                }
                                            } else if (selectedAssetIds.size > 0) {
                                                // For assets, we'd need similar logic but assets.ts needs a moveAsset function
                                                toast.info("Mover múltiplos assets ainda não está implementado")
                                            }
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Main Content Scroll Area */}
                            <div className="w-full flex-1 mt-8 overflow-y-auto px-6 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">

                                {/* Folders Grid */}
                                {folders.length > 0 && (
                                    <div className="w-full mb-8">
                                        <h4 className="text-[12px] font-bold text-[#444] uppercase tracking-wider mb-4 px-1">Folders</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {folders.map(folder => {
                                                const isSelected = selectedFolderIds.has(folder.id)
                                                const isSelectionMode = selectedFolderIds.size > 0 || selectedAssetIds.size > 0

                                                return (
                                                    <div
                                                        key={folder.id}
                                                        onClick={() => {
                                                            if (isSelectionMode) handleToggleSelection(folder.id)
                                                            else setCurrentFolderId(folder.id)
                                                        }}
                                                        className={cn(
                                                            "bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all group/folder border h-[88px]",
                                                            isSelected
                                                                ? "border-[#ff0054] border-[3px]"
                                                                : isSelectionMode
                                                                    ? "border-transparent hover:border-[#ff0054] hover:border-[3px]"
                                                                    : "border-transparent hover:bg-[#222] hover:border-[#333]"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div
                                                                className="shrink-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleToggleSelection(folder.id)
                                                                }}
                                                            >
                                                                {isSelected ? (
                                                                    <div className="w-5 h-5 rounded-full bg-[#ff0054] flex items-center justify-center">
                                                                        <CheckCircle className="w-5 h-5 text-white fill-[#ff0054]" />
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <Folder className="w-5 h-5 text-[#666] group-hover/folder:hidden transition-colors shrink-0" />
                                                                        <CheckCircle className="w-5 h-5 text-[#0E0F14] hidden group-hover/folder:block fill-[#0E0F14] stroke-[#444]" />
                                                                    </>
                                                                )}
                                                            </div>

                                                            <span className={cn(
                                                                "text-[14px] font-medium transition-colors truncate",
                                                                isSelected ? "text-white" : "text-[#ccc] group-hover/folder:text-white"
                                                            )}>
                                                                {folder.name}
                                                            </span>
                                                        </div>
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button
                                                                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-[#555] group-hover/folder:text-white transition-all opacity-0 group-hover/folder:opacity-100"
                                                                    >
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56 bg-[#0D0D0E] border-[#222] p-1.5 rounded-xl text-gray-200 z-[200]">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setFolderToRename(folder)
                                                                            setRenameValue(folder.name)
                                                                        }}
                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                    >
                                                                        <Edit2 className="mr-2 h-4 w-4 text-[#666]" />
                                                                        <span>Rename</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setFolderToMove(folder)
                                                                            setDestinationFolderId("root")
                                                                        }}
                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                    >
                                                                        <Move className="mr-2 h-4 w-4 text-[#666]" />
                                                                        <span>Move to</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                        onClick={() => handleToggleFavorite(folder.id, 'folder', folder.is_favorite || false)}
                                                                    >
                                                                        <Star className={cn("mr-2 h-4 w-4", folder.is_favorite ? "text-[#ff0054] fill-[#ff0054]" : "text-[#666]")} />
                                                                        <span>{folder.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                        onClick={() => setFolderToManageAccess(folder)}
                                                                    >
                                                                        <Users className="mr-2 h-4 w-4 text-[#666]" />
                                                                        <span>Manage access</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                        onClick={() => setShareModal({ isOpen: true, assetId: folder.id, type: 'folder' })}
                                                                    >
                                                                        <Share className="mr-2 h-4 w-4 text-[#666]" />
                                                                        <span>Share</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors">
                                                                        <Clock className="mr-2 h-4 w-4 text-[#666]" />
                                                                        <span>Expiration</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="bg-[#222]" />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteFolder(folder.id)}
                                                                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500 cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        <span>Delete</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Asset Grid or Empty State */}
                                {assets.length === 0 && folders.length === 0 ? (
                                    <div className="w-full h-[670px] mt-[60px] rounded-[48px] border-2 border-dashed border-[#1a1a1a] bg-[#0d0d0e]/30 flex flex-col items-center justify-center relative overflow-hidden group/dropzone">

                                        {/* Ambient Glow Background */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none group-hover/dropzone:opacity-20 transition-opacity duration-1000">
                                            <div className="w-[600px] h-[600px] bg-gradient-to-tr from-[#FF0054] via-[#0000FF] to-[#00FF94] rounded-full blur-[120px]" />
                                        </div>

                                        {/* Symbolic Logo Icon */}
                                        <div className="mb-12 relative">
                                            <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-tr from-[#FF0054] via-[#0000FF] to-[#00FF94] p-[4px] shadow-[0_0_50px_rgba(255,0,84,0.15)] transform group-hover/dropzone:scale-105 transition-transform duration-700">
                                                <div className="w-full h-full rounded-full bg-[#0A0A0B] flex items-center justify-center">
                                                    <div className="w-16 h-16 rounded-full border-[6px] border-white/[0.03]" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Text Guidance */}
                                        <div className="text-center z-10 max-w-sm mb-12">
                                            <h2 className="text-[22px] font-bold text-white mb-4 tracking-tight">Your assets will be here</h2>
                                            <p className="text-[14px] text-[#555] leading-relaxed">
                                                Drag and drop your media here, or use the professional upload tool below.
                                            </p>
                                        </div>

                                        {/* Primary Action: Upload Button */}
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="w-[180px] h-[45px] bg-[#ff0054] rounded-xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,0,84,0.2)] hover:shadow-[0_15px_40px_rgba(255,0,84,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all group/btn z-10">
                                            <span className="text-[14px] font-bold text-white tracking-tight">Upload</span>
                                            <CloudUpload className="w-5 h-5 text-white" />
                                        </button>

                                    </div>
                                ) : (
                                    assets.length > 0 && (
                                        <div className="w-full">
                                            <h4 className="text-[12px] font-bold text-[#444] uppercase tracking-wider mb-4 px-1">Assets</h4>
                                            <div className="grid grid-cols-4 gap-6">
                                                {assets.map(asset => {
                                                    const isSelected = selectedAssetIds.has(asset.id)
                                                    const isSelectionMode = selectedFolderIds.size > 0 || selectedAssetIds.size > 0

                                                    return (
                                                        <div
                                                            key={asset.id}
                                                            onClick={() => {
                                                                if (isSelectionMode) handleToggleAssetSelection(asset.id)
                                                                // else maybe open asset preview? For now just select logic or nothing.
                                                            }}
                                                            className={cn(
                                                                "bg-[#111] rounded-2xl relative group overflow-hidden border transition-all",
                                                                isSelected
                                                                    ? "border-[#ff0054] border-[3px]"
                                                                    : isSelectionMode
                                                                        ? "border-[#222] hover:border-[#ff0054] hover:border-[3px]"
                                                                        : "border-[#222] hover:border-[#ff0054]",
                                                                asset.type === 'image' ? "w-full h-fit" : "aspect-square"
                                                            )}
                                                        >
                                                            {/* Selection Check Circle */}
                                                            <div
                                                                className={cn(
                                                                    "absolute top-3 left-3 z-30 cursor-pointer transition-opacity duration-200",
                                                                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleToggleAssetSelection(asset.id)
                                                                }}
                                                            >
                                                                <CheckCircle
                                                                    className={cn(
                                                                        "w-6 h-6 fill-black transition-colors",
                                                                        isSelected ? "text-[#ff0054]" : "text-[#1a1a1a] hover:text-[#ff0054]"
                                                                    )}
                                                                />
                                                            </div>

                                                            {asset.type === 'image' && (
                                                                <img src={asset.file_url} alt={asset.name} className="w-full h-auto block" />
                                                            )}
                                                            {asset.type !== 'image' && (
                                                                <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                                                                    <span className="text-xs text-[#666] uppercase">{asset.type}</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4 pointer-events-none z-20 pb-4">
                                                                {/* Overlay Card - Full Width x 98px */}
                                                                <div className="w-full h-[98px] bg-[#0F1012] rounded-xl border border-[#222] shadow-2xl p-4 flex flex-col justify-between pointer-events-auto backdrop-blur-sm">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 shadow-[0_0_10px_rgba(255,0,84,0.3)]" />
                                                                        <span className="text-[10px] text-[#666] font-mono tracking-tight">
                                                                            {new Date(asset.created_at || '2024-01-01').toLocaleString('pt-BR')}
                                                                        </span>
                                                                    </div>
                                                                    {/* Bottom Row */}
                                                                    <div className="flex items-end justify-between">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-[12px] text-white font-medium tracking-wide">
                                                                                {/* Mock Metadata if missing */}
                                                                                {asset.metadata?.size || "101.62 KB"} • {asset.metadata?.dimensions || "736x1313"}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2.5 text-[#888]">
                                                                            <Download
                                                                                className="w-4 h-4 hover:text-white cursor-pointer transition-colors"
                                                                                onClick={async (e) => {
                                                                                    e.stopPropagation()
                                                                                    if (asset.file_url) {
                                                                                        try {
                                                                                            const response = await fetch(asset.file_url)
                                                                                            const blob = await response.blob()
                                                                                            const url = window.URL.createObjectURL(blob)
                                                                                            const link = document.createElement('a')
                                                                                            link.href = url
                                                                                            link.download = asset.name || 'download'
                                                                                            document.body.appendChild(link)
                                                                                            link.click()
                                                                                            document.body.removeChild(link)
                                                                                            window.URL.revokeObjectURL(url)
                                                                                        } catch (error) {
                                                                                            console.error('Download failed:', error)
                                                                                            toast.error("Failed to download file")
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Heart
                                                                                className={cn(
                                                                                    "w-4 h-4 cursor-pointer transition-colors",
                                                                                    asset.is_favorite ? "text-[#ff0054] fill-[#ff0054]" : "hover:text-white"
                                                                                )}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    handleToggleFavorite(asset.id, 'asset', asset.is_favorite || false)
                                                                                }}
                                                                            />
                                                                            <Link className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
                                                                            <Share
                                                                                className="w-4 h-4 hover:text-white cursor-pointer transition-colors"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setShareModal({ isOpen: true, assetId: asset.id, type: 'asset' })
                                                                                }}
                                                                            />
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <MoreHorizontal className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="w-56 bg-[#0D0D0E] border-[#222] p-1.5 rounded-xl text-gray-200 z-[200]">
                                                                                    {/* Reuse same options as folder for consistency, though some might be stubbed for assets */}
                                                                                    <DropdownMenuItem
                                                                                        // onClick={() => ... handle rename ...}
                                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                                    >
                                                                                        <Edit2 className="mr-2 h-4 w-4 text-[#666]" />
                                                                                        <span>Rename</span>
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        // onClick={() => ... handle move ...}
                                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                                    >
                                                                                        <Move className="mr-2 h-4 w-4 text-[#666]" />
                                                                                        <span>Move to</span>
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                                    >
                                                                                        <Star className="mr-2 h-4 w-4 text-[#666]" />
                                                                                        <span>Add to favorites</span>
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            setExpirationModal({ isOpen: true, assetId: asset.id })
                                                                                        }}
                                                                                        className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                                    >
                                                                                        <Clock className="mr-2 h-4 w-4 text-[#666]" />
                                                                                        <span>Expiration</span>
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator className="bg-[#222]" />
                                                                                    <DropdownMenuItem
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            handleDeleteAsset(asset.id)
                                                                                        }}
                                                                                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500 cursor-pointer rounded-lg py-2 px-2.5 text-[13px] font-medium transition-colors"
                                                                                    >
                                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                                        <span>Delete</span>
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <button
                                                    onClick={() => setIsUploadModalOpen(true)}
                                                    className="aspect-square rounded-2xl border border-dashed border-[#333] flex flex-col items-center justify-center gap-2 hover:border-[#ff0054] hover:bg-[#ff0054]/5 transition-all text-[#444] hover:text-[#ff0054]"
                                                >
                                                    <Plus className="w-6 h-6" />
                                                    <span className="text-[12px] font-medium">Add New</span>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                        </div>

                    </motion.div >

                    {/* Expiration Modal */}
                    <AnimatePresence>
                        {
                            expirationModal.isOpen && (
                                <div className="fixed inset-0 z-[450] flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setExpirationModal({ isOpen: false, assetId: null })}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative z-10 bg-[#15161b] rounded-xl overflow-hidden shadow-2xl border border-[#222]"
                                        style={{ width: '442px', height: '215px' }}
                                    >
                                        {/* Header */}
                                        <div className="h-[53px] bg-[#ff0054] flex items-center justify-between px-6">
                                            <h3 className="text-white text-[16px] font-bold tracking-wide">Set expiration</h3>
                                            <button
                                                onClick={() => setExpirationModal({ isOpen: false, assetId: null })}
                                                className="w-6 h-6 rounded-full bg-[#15161b] text-white flex items-center justify-center hover:bg-[#222] transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Body */}
                                        <div className="flex flex-col justify-start px-[24px] pt-[24px]">

                                            {/* Toggle Section */}
                                            <div className="flex items-center justify-between mb-8">
                                                <span className="text-[#999] text-[14px]">Link expire in</span>

                                                <div
                                                    className="cursor-pointer transition-colors w-[50px] h-[28px] rounded-full relative"
                                                    style={{ backgroundColor: expirationSettings.isEnabled ? '#ff0054' : '#515151' }}
                                                    onClick={() => setExpirationSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                                                >
                                                    <div
                                                        className="absolute top-[2px] w-[24px] h-[24px] rounded-full transition-all"
                                                        style={{
                                                            left: expirationSettings.isEnabled ? '24px' : '2px',
                                                            backgroundColor: expirationSettings.isEnabled ? '#ffffff' : '#97A1B3'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Date Input Section */}
                                            <div className="relative">
                                                <div className="flex items-center justify-between pb-2 border-b transition-colors"
                                                    style={{ borderColor: expirationSettings.isEnabled ? '#ff0054' : '#515151' }}
                                                >
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                disabled={!expirationSettings.isEnabled}
                                                                className={cn(
                                                                    "bg-transparent text-[15px] outline-none w-full text-left",
                                                                    !expirationSettings.date ? "text-[#515151]" : "text-[#999]",
                                                                    !expirationSettings.isEnabled && "cursor-not-allowed opacity-50"
                                                                )}
                                                            >
                                                                {expirationSettings.date
                                                                    ? format(new Date(expirationSettings.date), "dd/MM/yyyy")
                                                                    : "Select date..."
                                                                }
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0 border-none bg-transparent shadow-none z-[600]"
                                                            side="bottom"
                                                            align="start"
                                                            sideOffset={5}
                                                        >
                                                            <CustomDatePicker
                                                                value={expirationSettings.date ? new Date(expirationSettings.date) : null}
                                                                onChange={(date) => setExpirationSettings(prev => ({ ...prev, date: date.toISOString() }))}
                                                                onClose={() => { /* Popover handles install close usually, or we can force close if controlled */ }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>

                                                    <Clock className={cn("w-5 h-5", expirationSettings.isEnabled ? "text-[#999]" : "text-[#515151]")} />
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence >

                    {/* Delete Confirmation Modal */}
                    <AnimatePresence>
                        {
                            deleteConfirmation.isOpen && (
                                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative z-10 bg-[#000000] rounded-[5px] flex flex-col items-center text-center shadow-2xl border border-[#222]"
                                        style={{
                                            width: '446px',
                                            height: '260px',
                                            paddingTop: '75px',
                                            paddingBottom: '30px',
                                            paddingLeft: '71px',
                                            paddingRight: '71px'
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-2 flex-1 w-full">
                                            <h3 className="text-[18px] text-white font-medium tracking-wide">Are you sure?</h3>
                                            <p className="text-[#666] text-[13px] leading-[1.4]">
                                                {deleteConfirmation.type === 'folder'
                                                    ? "The files you about to delete may be attached to the guidelines. Once deleted, this files will no longer be available for download."
                                                    : "The files you about to delete may be attached to the guidelines. Once deleted, this files will no longer be available for download."
                                                }
                                            </p>
                                        </div>

                                        <div className="w-full flex items-center justify-center gap-[20px] mt-[33px]">
                                            <button
                                                onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                                                className="text-[#999] hover:text-white text-[14px] font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirmDelete}
                                                className="min-w-[100px] h-[40px] border border-[#333] rounded-xl text-white hover:bg-white/5 transition-colors text-[14px] font-medium"
                                            >
                                                Do it!
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence >

                    {/* Upload Modal Overlay */}
                    <AnimatePresence>
                        {
                            isUploadModalOpen && (
                                <div className="fixed inset-0 z-[300] flex items-center justify-center p-8">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        className="relative w-full max-w-4xl bg-[#0F1012] rounded-xl overflow-hidden shadow-2xl border border-[#1a1a1a] flex flex-col pointer-events-auto"
                                    >
                                        <div className="h-16 bg-[#ff0054] px-6 flex items-center justify-between shrink-0">
                                            <h2 className="text-white text-[18px] font-bold tracking-tight">Upload asset</h2>
                                            <button
                                                onClick={() => setIsUploadModalOpen(false)}
                                                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>

                                        <div className="p-12 flex items-center justify-center h-[500px]">
                                            <div className="w-full h-full border border-dashed border-[#ffffff]/20 rounded-lg flex flex-col items-center justify-center gap-4 transition-colors hover:border-[#ff0054]/50 hover:bg-[#ff0054]/5 group cursor-pointer relative">

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
                                                    <span className="text-white font-medium text-[16px]">
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
                                                        Selecionar da Biblioteca
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence >

                    {/* Create Folder Modal */}
                    <AnimatePresence>
                        {
                            isCreateFolderModalOpen && (
                                <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 text-[14px]">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsCreateFolderModalOpen(false)}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        className="relative w-[600px] h-[305px] bg-[#15161B] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center pt-[120px]"
                                    >

                                        {/* Input Field */}
                                        <div className="w-full max-w-sm mb-[77px] relative group">
                                            <input
                                                type="text"
                                                placeholder="Folder name"
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                                className="w-full bg-transparent border-b border-[#333] text-white text-center pb-2 placeholder:text-[#555] focus:outline-none focus:border-[#ff0054] transition-colors text-[16px]"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={handleCreateFolder}
                                                className="px-8 py-2.5 bg-[#0A0A0B] hover:bg-[#1a1a1a] text-white rounded-lg transition-colors font-medium">
                                                Salvar
                                            </button>
                                            <button
                                                onClick={() => setIsCreateFolderModalOpen(false)}
                                                className="px-6 py-2.5 text-[#888] hover:text-white transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>

                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence >

                    {/* Rename Folder Modal */}
                    <AnimatePresence>
                        {
                            folderToRename && (
                                <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 text-[14px]">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setFolderToRename(null)}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        className="relative w-[600px] h-[305px] bg-[#15161B] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center pt-[120px]"
                                    >
                                        {/* Input Field */}
                                        <div className="w-full max-w-sm mb-[77px] relative group">
                                            <input
                                                type="text"
                                                placeholder="Folder name"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
                                                className="w-full bg-transparent border-b border-[#333] text-white text-center pb-2 placeholder:text-[#555] focus:outline-none focus:border-[#ff0054] transition-colors text-[16px]"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={handleRenameFolder}
                                                className="px-8 py-2.5 bg-[#0A0A0B] hover:bg-[#1a1a1a] text-white rounded-lg transition-colors font-medium">
                                                Salvar
                                            </button>
                                            <button
                                                onClick={() => setFolderToRename(null)}
                                                className="px-6 py-2.5 text-[#888] hover:text-white transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>

                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence >

                    {/* Move Folder Modal */}
                    < Dialog open={!!folderToMove
                    } onOpenChange={(open) => !open && setFolderToMove(null)}>
                        <DialogContent className="bg-[#15161B] border-[#222] text-white">
                            <DialogHeader>
                                <DialogTitle>Move Folder</DialogTitle>
                                <DialogDescription className="text-[#666]">
                                    Select the destination folder for &quot;{folderToMove?.name}&quot;
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <select
                                    value={destinationFolderId}
                                    onChange={(e) => setDestinationFolderId(e.target.value)}
                                    className="w-full bg-[#0A0A0B] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff0054] appearance-none"
                                >
                                    <option value="root" className="bg-[#1A1A1A]">Brand Assets (Root)</option>
                                    {allFolders
                                        .filter(f => f.id !== folderToMove?.id)
                                        .map(f => (
                                            <option key={f.id} value={f.id} className="bg-[#1A1A1A]">{f.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <DialogFooter>
                                <button
                                    onClick={() => setFolderToMove(null)}
                                    className="px-4 py-2 text-sm text-[#888] hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMoveFolder}
                                    className="px-4 py-2 bg-[#ff0054] text-white rounded-lg text-sm font-medium hover:bg-[#ff0054]/90"
                                >
                                    Move
                                </button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog >

                    {/* Manage Access Modal */}
                    <AnimatePresence>
                        {
                            folderToManageAccess && (
                                <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 font-sans">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setFolderToManageAccess(null)}
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="relative w-[442px] h-[452px] bg-[#0E0F11] rounded-xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
                                    >
                                        {/* Header */}
                                        <div className="h-[53px] bg-[#ff0054] px-4 flex items-center justify-between shrink-0">
                                            <h2 className="text-white text-[15px] font-bold tracking-tight truncate pr-4">
                                                Viewers access to - {folderToManageAccess.name}
                                            </h2>
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#0E0F11]" />
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-1">
                                            {/* Toggles */}
                                            <div className="space-y-6 mb-12">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[#9CA3AF] text-[14px]">Allow public access</span>
                                                    <CustomToggle
                                                        checked={folderToManageAccess.is_public || false}
                                                        onCheckedChange={(checked) => handleUpdateAccess('is_public', checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[#9CA3AF] text-[14px]">Allow all viewers to access</span>
                                                    <CustomToggle
                                                        checked={folderToManageAccess.allow_viewers || false}
                                                        onCheckedChange={(checked) => handleUpdateAccess('allow_viewers', checked)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-[15px] font-bold text-[#9CA3AF] mb-auto">
                                                Project has no viewers
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="bg-[#24262B] rounded-xl p-4 mt-auto">
                                                <h4 className="text-[#9CA3AF] text-[13px] font-bold mb-3">Quick actions</h4>

                                                <div className="flex gap-3 text-[13px]">
                                                    <button className="flex-1 bg-[#15161A] text-[#9CA3AF] hover:text-white hover:bg-[#1a1b1f] py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-[#333]">
                                                        <span>Manage project viewers</span>
                                                    </button>
                                                </div>

                                                <div className="flex gap-3 text-[13px] mt-3">
                                                    <button className="flex-1 bg-[#15161A] text-[#9CA3AF] hover:text-white hover:bg-[#1a1b1f] py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-[#333]">
                                                        <ExternalLink className="w-4 h-4" />
                                                        <span>Share externally</span>
                                                    </button>
                                                    <button className="flex-1 bg-[#15161A] text-[#9CA3AF] hover:text-white hover:bg-[#1a1b1f] py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-[#333]">
                                                        <Link className="w-4 h-4" />
                                                        <span>Copy internal link</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence >

                    {/* Share Modal */}
                    <AnimatePresence>
                        {
                            shareModal.isOpen && (
                                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShareModal({ isOpen: false, assetId: null, type: 'asset' })}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative z-10 bg-[#15161b] rounded-xl overflow-hidden shadow-2xl border border-[#222] flex flex-col"
                                        style={{ width: '480px', maxHeight: '90vh' }}
                                    >
                                        {/* Header */}
                                        <div className="h-[53px] bg-[#ff0054] flex items-center justify-between px-6 shrink-0">
                                            <h3 className="text-white text-[16px] font-bold tracking-wide">Share</h3>
                                            <button
                                                onClick={() => setShareModal({ isOpen: false, assetId: null, type: 'asset' })}
                                                className="w-6 h-6 rounded-full bg-[#15161b] text-white flex items-center justify-center hover:bg-[#222] transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <ScrollArea className="flex-1 max-h-[calc(90vh-53px-60px)]">
                                            <div className="p-[23px] space-y-[25px]">

                                                {/* External Link Section */}
                                                <div className="flex flex-col gap-[23px]">
                                                    <h4 className="text-[#999] text-[14px] font-medium">External link to asset</h4>

                                                    {!shareSettings.isLinkActive ? (
                                                        // Inactive State
                                                        <div className="flex gap-3">
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    disabled
                                                                    placeholder="External URL must be activated"
                                                                    className="w-full bg-transparent border-b border-[#ff0054] text-[#666] text-[14px] pb-2 outline-none cursor-not-allowed placeholder:text-[#333]"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    // toggle active
                                                                    const nextActive = !shareSettings.isLinkActive
                                                                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://brivio.app'
                                                                    const next = {
                                                                        ...shareSettings,
                                                                        isLinkActive: nextActive,
                                                                        linkUrl: nextActive ? `${baseUrl}/share/${shareModal.assetId}` : ''
                                                                    }
                                                                    setShareSettings(next)
                                                                    saveShareSettings(next)
                                                                }}
                                                                className="h-[36px] px-6 bg-[#ff0054] rounded-lg text-white text-[13px] font-medium hover:bg-[#ff0054]/90 transition-colors"
                                                            >
                                                                Activate
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // Active State
                                                        <div className="flex gap-3">
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value={shareSettings.linkUrl}
                                                                    className="w-full bg-transparent border-b border-[#ff0054] text-[#ccc] text-[13px] pb-2 outline-none"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (shareSettings.linkUrl) {
                                                                        navigator.clipboard.writeText(shareSettings.linkUrl)
                                                                        toast.success("Link copied to clipboard")
                                                                    }
                                                                }}
                                                                className="h-[36px] px-4 bg-[#ff0054] rounded-lg text-white text-[13px] font-medium hover:bg-[#ff0054]/90 transition-colors"
                                                            >
                                                                Copy
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const next = { ...shareSettings, isLinkActive: false, linkUrl: '', passcodeEnabled: false, passcode: '', expirationEnabled: false, expirationDuration: null, expirationDate: undefined }
                                                                    setShareSettings(next)
                                                                    saveShareSettings(next)
                                                                }}
                                                                className="h-[36px] px-4 bg-black rounded-lg text-white text-[13px] font-medium border border-[#333] hover:bg-white/10 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {shareSettings.isLinkActive && (
                                                    <>
                                                        {/* Passcode Section */}
                                                        <div className="flex flex-col gap-[23px]">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[#999] text-[14px]">Passcode</span>
                                                                <div
                                                                    className="cursor-pointer transition-colors w-[44px] h-[24px] rounded-full relative"
                                                                    style={{ backgroundColor: shareSettings.passcodeEnabled ? '#ff0054' : '#515151' }}
                                                                    onClick={() => {
                                                                        const next = { ...shareSettings, passcodeEnabled: !shareSettings.passcodeEnabled }
                                                                        setShareSettings(next)
                                                                        saveShareSettings(next)
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="absolute top-[2px] w-[20px] h-[20px] rounded-full transition-all bg-white"
                                                                        style={{ left: shareSettings.passcodeEnabled ? '22px' : '2px' }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <AnimatePresence>
                                                                {shareSettings.passcodeEnabled && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="border border-[#333] rounded-lg p-3 bg-black/20">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Enter passcode"
                                                                                value={shareSettings.passcode}
                                                                                onChange={(e) => setShareSettings(prev => ({ ...prev, passcode: e.target.value }))}
                                                                                onBlur={() => saveShareSettings(shareSettings)}
                                                                                className="w-full bg-transparent text-white text-[14px] outline-none placeholder:text-[#555]"
                                                                            />
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Expiration Section */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[#999] text-[14px]">Link expires in</span>
                                                                <div
                                                                    className="cursor-pointer transition-colors w-[44px] h-[24px] rounded-full relative"
                                                                    style={{ backgroundColor: shareSettings.expirationEnabled ? '#ff0054' : '#515151' }}
                                                                    onClick={() => {
                                                                        const next = { ...shareSettings, expirationEnabled: !shareSettings.expirationEnabled }
                                                                        setShareSettings(next)
                                                                        saveShareSettings(next)
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="absolute top-[2px] w-[20px] h-[20px] rounded-full transition-all bg-white"
                                                                        style={{ left: shareSettings.expirationEnabled ? '22px' : '2px' }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <AnimatePresence>
                                                                {shareSettings.expirationEnabled && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden space-y-4"
                                                                    >
                                                                        <div className="flex gap-2">
                                                                            {['1 day', '3 days', '7 days', '14 days'].map((d) => (
                                                                                <button
                                                                                    key={d}
                                                                                    onClick={() => {
                                                                                        const next = { ...shareSettings, expirationDuration: d as any }
                                                                                        setShareSettings(next)
                                                                                        saveShareSettings(next)
                                                                                    }}
                                                                                    className={cn(
                                                                                        "flex-1 h-[40px] flex items-center justify-center rounded border text-[12px] transition-colors",
                                                                                        shareSettings.expirationDuration === d
                                                                                            ? "border-[#ff0054] text-[#ff0054] bg-[#ff0054]/10"
                                                                                            : "border-[#333] text-[#666] hover:border-[#ff0054] hover:text-[#ff0054]"
                                                                                    )}
                                                                                >
                                                                                    {d}
                                                                                </button>
                                                                            ))}
                                                                        </div>

                                                                        <div className="flex items-center justify-between pb-2 border-b border-[#ff0054]">
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <button className="bg-transparent text-[14px] outline-none w-full text-left text-[#ccc] flex items-center justify-between">
                                                                                        {shareSettings.expirationDate
                                                                                            ? format(new Date(shareSettings.expirationDate), "dd/MM/yyyy")
                                                                                            : format(new Date(), "dd/MM/yyyy")
                                                                                        }
                                                                                        <span className="text-white"><Clock className="w-4 h-4" /></span>
                                                                                    </button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent
                                                                                    className="w-auto p-0 border-none bg-transparent shadow-none z-[600]"
                                                                                    side="bottom"
                                                                                    align="start"
                                                                                    sideOffset={5}
                                                                                >
                                                                                    <CustomDatePicker
                                                                                        value={shareSettings.expirationDate ? new Date(shareSettings.expirationDate) : null}
                                                                                        onChange={(date) => {
                                                                                            const next = { ...shareSettings, expirationDate: date.toISOString() }
                                                                                            setShareSettings(next)
                                                                                            saveShareSettings(next)
                                                                                        }}
                                                                                        onClose={() => { }}
                                                                                    />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Email Section */}
                                                        <div className="flex flex-col gap-[23px] pt-2">
                                                            <h4 className="text-[#999] text-[14px] font-bold">Email this link to</h4>
                                                            <div className="flex gap-3">
                                                                <div className="flex-1 relative">
                                                                    <input
                                                                        type="email"
                                                                        placeholder="mariaeduarda@email.com"
                                                                        value={shareSettings.email}
                                                                        onChange={(e) => setShareSettings(prev => ({ ...prev, email: e.target.value }))}
                                                                        onBlur={() => saveShareSettings(shareSettings)}
                                                                        className="w-full bg-transparent border-b border-[#ff0054] text-[#ccc] text-[14px] pb-2 outline-none placeholder:text-[#333]"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => alert(`Email sent to ${shareSettings.email}`)}
                                                                    className="h-[36px] px-6 bg-[#ff0054] rounded-lg text-white text-[13px] font-medium hover:bg-[#ff0054]/90 transition-colors"
                                                                >
                                                                    Send
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                            </div>
                                        </ScrollArea>

                                        {/* Footer Quick Actions */}
                                        <div className="p-4 mx-[23px] mb-[23px] bg-[#212229] rounded-xl border border-[#333] shrink-0">
                                            <h4 className="text-[#666] text-[13px] font-bold mb-3">Quick actions</h4>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`https://brivio.app/asset/${shareModal.assetId}`)
                                                    toast.success("Internal link copied")
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] rounded-full text-[13px] text-[#ccc] hover:text-white transition-colors hover:border-[#555]"
                                            >
                                                <Link className="w-3.5 h-3.5" />
                                                Copy internal link
                                            </button>
                                        </div>

                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence>



                    <Toaster position="bottom-center" richColors theme="dark" />
                </div>
            )
            }
        </AnimatePresence >
    )
}

interface FolderTreeItemProps {
    node: AssetFolder
    level: number
    currentFolderId: string | undefined
    expandedIds: Set<string>
    onToggleExpand: (id: string) => void
    onSelectFolder: (id: string) => void
}

function FolderTreeItem({ node, level, currentFolderId, expandedIds, onToggleExpand, onSelectFolder }: FolderTreeItemProps) {
    const isExpanded = expandedIds.has(node.id)
    const isActive = currentFolderId === node.id
    const hasChildren = node.children && node.children.length > 0

    return (
        <div className="select-none">
            <div
                className={cn(
                    "group flex items-center py-2 px-3 rounded-xl cursor-pointer transition-all duration-300",
                    isActive ? "bg-white/[0.03] border border-white/10 shadow-inner" : "hover:bg-white/[0.02]"
                )}
                style={{ paddingLeft: `${(level * 12) + 12}px` }}
                onClick={() => onSelectFolder(node.id)}
            >
                {/* Arrow / Spacer */}
                <div
                    className="w-4 h-4 flex items-center justify-center mr-1"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (hasChildren) onToggleExpand(node.id)
                    }}
                >
                    {hasChildren && (
                        <div className="hover:bg-white/10 rounded p-0.5 transition-colors">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-[#666]" /> : <ChevronRight className="w-3 h-3 text-[#666]" />}
                        </div>
                    )}
                </div>

                <Folder className={cn("w-4 h-4 transition-colors mr-2.5 shrink-0", isActive ? "text-[#ff0054]" : "text-[#444] group-hover:text-white")} />

                <span className={cn(
                    "text-[14px] transition-colors tracking-tight truncate",
                    isActive ? "text-white font-bold" : "text-[#888] font-medium group-hover:text-white"
                )}>
                    {node.name}
                </span>

                {isActive && (
                    <div className="ml-auto w-5 h-5 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                        <Plus className="w-3.5 h-3.5 text-[#555] group-hover:text-white" />
                    </div>
                )}
            </div>

            {isExpanded && hasChildren && (
                <div className="mt-0.5">
                    {node.children!.map(child => (
                        <FolderTreeItem
                            key={child.id}
                            node={child}
                            level={level + 1}
                            currentFolderId={currentFolderId}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            onSelectFolder={onSelectFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive?: boolean, onClick?: () => void }) {
    return (
        <div
            className={cn(
                "group flex items-center gap-3 py-1 cursor-pointer transition-all",
                isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
            )}
            onClick={onClick}
        >
            <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                isActive ? "bg-[#ff0054] text-white" : "bg-white/[0.02] text-[#444] group-hover:text-white group-hover:bg-white/5"
            )}>
                <div className="scale-90">{icon}</div>
            </div>
            <span className={cn(
                "text-[14px] font-medium transition-colors tracking-tight",
                isActive ? "text-white font-bold" : "text-[#777] group-hover:text-white"
            )}>
                {label}
            </span>
        </div>
    )
}

function CustomToggle({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
    return (
        <div
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "w-[50px] h-[28px] rounded-full cursor-pointer p-[2px] transition-colors duration-300 border border-transparent",
                checked ? "bg-[#ff0054]" : "bg-[#2A2B30]"
            )}
        >
            <motion.div
                className="w-6 h-6 rounded-full shadow-md"
                initial={false}
                animate={{
                    x: checked ? 22 : 0,
                    backgroundColor: checked ? "#ffffff" : "#94A3B8"
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                }}
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
    onDownload?: () => void
}

function BulkActionsHeader({
    selectedCount,
    onDeselectAll,
    onSelectAll,
    onInvertSelection,
    onDelete,
    onMove,
    onDownload
}: BulkActionsHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[40px] left-10 right-10 h-[45px] bg-[#ff0054] z-[60] flex items-center justify-between px-4 shadow-xl rounded-full"
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

            <div className="flex items-center gap-4">
                <button
                    onClick={onDownload}
                    className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
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
