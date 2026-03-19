"use server"


import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// --- TYPES ---
export interface AssetFolder {
    id: string
    brand_id?: string | null
    workspace_id?: string | null
    name: string
    parent_id: string | null
    created_at: string
    is_public?: boolean
    allow_viewers?: boolean
    is_favorite?: boolean
    deleted_at?: string | null
    children?: AssetFolder[]
    assets?: Asset[]
}

export interface Asset {
    id: string
    brand_id?: string | null
    workspace_id?: string | null
    folder_id: string | null
    name: string
    type: string
    file_url: string
    thumbnail_url: string | null
    created_at: string
    is_favorite?: boolean
    deleted_at?: string | null
    metadata?: {
        size?: string
        dimensions?: string
        share?: ShareSettings
        [key: string]: unknown
    }
}

export interface ShareSettings {
    active: boolean
    passcodeEnabled: boolean
    passcode?: string
    expirationEnabled: boolean
    expirationDuration?: string
    expirationDate?: string
    email?: string
}

// --- ACTIONS ---

export async function getAssets(scope: { brandId?: string, workspaceId?: string }, folderId?: string) {
    const supabase = await createClient()
    const { brandId, workspaceId } = scope

    if (!brandId && !workspaceId) {
        return { success: false, error: "No scope provided" }
    }

    // 1. Fetch Folders in this scope
    let folderQuery = supabase
        .from('asset_folders')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })

    if (brandId) folderQuery = folderQuery.eq('brand_id', brandId)
    if (workspaceId) folderQuery = folderQuery.eq('workspace_id', workspaceId)

    if (folderId) {
        folderQuery = folderQuery.eq('parent_id', folderId)
    } else {
        folderQuery = folderQuery.is('parent_id', null)
    }

    const { data: folders, error: folderError } = await folderQuery

    if (folderError) {
        console.error("Error fetching folders:", folderError)
        return { success: false, error: folderError.message }
    }

    // 2. Fetch Assets in this scope
    let assetQuery = supabase
        .from('assets')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (brandId) assetQuery = assetQuery.eq('brand_id', brandId)
    if (workspaceId) assetQuery = assetQuery.eq('workspace_id', workspaceId)

    if (folderId) {
        assetQuery = assetQuery.eq('folder_id', folderId)
    } else {
        assetQuery = assetQuery.is('folder_id', null)
    }

    const { data: assets, error: assetError } = await assetQuery

    if (assetError) {
        console.error("Error fetching assets:", assetError)
        return { success: false, error: assetError.message }
    }

    // 3. Fetch Breadcrumbs
    const breadcrumbs: AssetFolder[] = []
    if (folderId) {
        let currentId: string | null = folderId
        while (currentId) {
            const { data } = await supabase
                .from('asset_folders')
                .select('*')
                .eq('id', currentId)
                .single()

            const folder = data as AssetFolder | null
            if (!folder) break
            breadcrumbs.unshift(folder)
            currentId = folder.parent_id
        }
    }

    return { success: true, folders, assets, breadcrumbs }
}

export async function getFavorites(scope: { brandId?: string, workspaceId?: string }) {
    const supabase = await createClient()
    const { brandId, workspaceId } = scope

    if (!brandId && !workspaceId) {
        return { success: false, error: "No scope provided" }
    }

    // 1. Fetch Favorite Folders
    let folderQuery = supabase
        .from('asset_folders')
        .select('*')
        .eq('is_favorite', true)
        .is('deleted_at', null)
        .order('name', { ascending: true })

    if (brandId) folderQuery = folderQuery.eq('brand_id', brandId)
    if (workspaceId) folderQuery = folderQuery.eq('workspace_id', workspaceId)

    const { data: folders, error: folderError } = await folderQuery

    // 2. Fetch Favorite Assets
    let assetQuery = supabase
        .from('assets')
        .select('*')
        .eq('is_favorite', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (brandId) assetQuery = assetQuery.eq('brand_id', brandId)
    if (workspaceId) assetQuery = assetQuery.eq('workspace_id', workspaceId)

    const { data: assets, error: assetError } = await assetQuery

    if (folderError || assetError) {
        return { success: false, error: folderError?.message || assetError?.message }
    }

    return { success: true, folders: folders || [], assets: assets || [] }
}

export async function getAllFolders(scope: { brandId?: string, workspaceId?: string }) {
    const supabase = await createClient()
    const { brandId, workspaceId } = scope

    if (!brandId && !workspaceId) {
        return { success: false, error: "No scope provided" }
    }

    let query = supabase
        .from('asset_folders')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })

    if (brandId) query = query.eq('brand_id', brandId)
    if (workspaceId) query = query.eq('workspace_id', workspaceId)

    const { data: allFolders, error } = await query

    if (error) {
        console.error("Error fetching all folders:", error)
        return { success: false, error: error.message }
    }
    return { success: true, folders: allFolders }
}

export async function createFolder(scope: { brandId?: string, workspaceId?: string }, name: string, parentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const { brandId, workspaceId } = scope
    if (!brandId && !workspaceId) return { success: false, error: "No scope provided" }

    try {
        const { data, error } = await supabase
            .from('asset_folders')
            .insert({
                brand_id: brandId || null,
                workspace_id: workspaceId || null,
                name: name,
                parent_id: parentId || null
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/brand/[slug]') // Invalidate generically for now
        return { success: true, folder: data }
    } catch (error) {
        console.error("Create folder error:", error)
        return { success: false, error: (error as Error).message || "Failed to create folder" }
    }
}

export async function uploadAsset(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const file = formData.get("file") as File
    const brandId = formData.get("brandId") as string
    const workspaceId = formData.get("workspaceId") as string
    const rawFolderId = formData.get("folderId") as string
    const folderId = (rawFolderId && rawFolderId !== "undefined" && rawFolderId !== "null") ? rawFolderId : null

    const metadataSize = formData.get("metadata_size") as string
    const metadataDimensions = formData.get("metadata_dimensions") as string

    if (!file || (!brandId && !workspaceId)) {
        return { success: false, error: "Missing file or scope (brandId/workspaceId)" }
    }

    try {
        const prefix = brandId ? `brand_${brandId}` : `ws_${workspaceId}`
        const fileName = `${prefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

        // 1. Upload to Storage
        const { error: uploadError } = await supabase
            .storage
            .from('assets') // Assuming 'assets' bucket exists
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) throw uploadError

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName)

        // 3. Create DB Record
        const { data: asset, error: dbError } = await supabase
            .from('assets')
            .insert({
                brand_id: brandId || null,
                workspace_id: workspaceId || null,
                folder_id: folderId || null,
                uploader_id: user.id,
                name: file.name,
                type: mapMimeTypeToAssetType(file.type),
                file_url: publicUrl,
                thumbnail_url: null, // Could generate this later
                is_downloadable: true,
                metadata: {
                    size: metadataSize,
                    dimensions: metadataDimensions
                }
            })
            .select()
            .single()

        if (dbError) throw dbError

        revalidatePath('/brand/[slug]')
        return { success: true, asset }

    } catch (error) {
        console.error("Upload asset error:", error)
        return { success: false, error: (error as Error).message || "Failed to upload asset" }
    }
}

function mapMimeTypeToAssetType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('font/')) return 'font'
    if (mimeType.includes('pdf')) return 'doc'
    return 'other'
}

export async function deleteFolder(folderId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('asset_folders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', folderId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function deleteAsset(assetId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('assets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', assetId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function getRecentAssets(scope: { brandId?: string, workspaceId?: string }) {
    const supabase = await createClient()
    const { brandId, workspaceId } = scope

    if (!brandId && !workspaceId) {
        return { success: false, error: "No scope provided" }
    }

    let query = supabase
        .from('assets')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50)

    if (brandId) query = query.eq('brand_id', brandId)
    if (workspaceId) query = query.eq('workspace_id', workspaceId)

    const { data: assets, error } = await query

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, assets: assets || [] }
}

export async function getTrash(scope: { brandId?: string, workspaceId?: string }) {
    const supabase = await createClient()
    const { brandId, workspaceId } = scope

    if (!brandId && !workspaceId) {
        return { success: false, error: "No scope provided" }
    }

    // 1. Fetch Trashed Folders
    let folderQuery = supabase
        .from('asset_folders')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

    if (brandId) folderQuery = folderQuery.eq('brand_id', brandId)
    if (workspaceId) folderQuery = folderQuery.eq('workspace_id', workspaceId)

    const { data: folders, error: folderError } = await folderQuery

    // 2. Fetch Trashed Assets
    let assetQuery = supabase
        .from('assets')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

    if (brandId) assetQuery = assetQuery.eq('brand_id', brandId)
    if (workspaceId) assetQuery = assetQuery.eq('workspace_id', workspaceId)

    const { data: assets, error: assetError } = await assetQuery

    if (folderError || assetError) {
        return { success: false, error: folderError?.message || assetError?.message }
    }

    return { success: true, folders: folders || [], assets: assets || [] }
}

export async function restoreItem(id: string, type: 'asset' | 'folder') {
    const supabase = await createClient()
    const table = type === 'asset' ? 'assets' : 'asset_folders'

    const { error } = await supabase
        .from(table)
        .update({ deleted_at: null })
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function permanentlyDeleteItem(id: string, type: 'asset' | 'folder') {
    const supabase = await createClient()
    const table = type === 'asset' ? 'assets' : 'asset_folders'

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function renameFolder(folderId: string, newName: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('asset_folders')
        .update({ name: newName })
        .eq('id', folderId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function renameAsset(assetId: string, newName: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('assets')
        .update({ name: newName })
        .eq('id', assetId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function moveFolder(folderId: string, destFolderId: string | null) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('asset_folders')
        .update({ parent_id: destFolderId })
        .eq('id', folderId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function moveAsset(assetId: string, destFolderId: string | null) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('assets')
        .update({ folder_id: destFolderId })
        .eq('id', assetId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function updateFolderAccess(folderId: string, isPublic: boolean, allowViewers: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('asset_folders')
        .update({ is_public: isPublic, allow_viewers: allowViewers })
        .eq('id', folderId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/brand/[slug]')
    return { success: true }
}

export async function toggleFavorite(id: string, type: 'asset' | 'folder', currentStatus: boolean) {
    const supabase = await createClient()
    const table = type === 'asset' ? 'assets' : 'asset_folders'

    const { error } = await supabase
        .from(table)
        .update({ is_favorite: !currentStatus })
        .eq('id', id)

    if (error) {
        console.error(`Error toggling favorite for ${type}:`, error)
        return { success: false, error: error.message }
    }

    revalidatePath('/brand/[slug]')
    return { success: true, is_favorite: !currentStatus }
}

export async function getShareSettings(id: string, type: 'asset' | 'folder' | 'root') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    if (type === 'asset') {
        const { data } = await supabase.from('assets').select('metadata').eq('id', id).single()
        const metadata = data?.metadata as Record<string, unknown> | null
        return metadata?.share as ShareSettings | undefined
    } else if (type === 'root') {
        const { data } = await supabase.from('assets')
            .select('metadata')
            .eq('brand_id', id)
            .is('folder_id', null)
            .eq('name', '.share_settings')
            .single()
        const metadata = data?.metadata as Record<string, unknown> | null
        return metadata?.share as ShareSettings | undefined
    } else {
        const { data } = await supabase.from('assets')
            .select('metadata')
            .eq('folder_id', id)
            .eq('name', '.share_settings')
            .single()
        const metadata = data?.metadata as Record<string, unknown> | null
        return metadata?.share as ShareSettings | undefined
    }
}

export async function updateShareSettings(id: string, type: 'asset' | 'folder' | 'root', settings: ShareSettings) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    try {
        if (type === 'asset') {
            const { data: asset, error: fetchError } = await supabase
                .from('assets')
                .select('metadata')
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            const currentMetadata = (asset.metadata as Record<string, unknown> | null) || {}
            const updatedMetadata = { ...currentMetadata, share: settings }

            const { error: updateError } = await supabase
                .from('assets')
                .update({ metadata: updatedMetadata })
                .eq('id', id)
            if (updateError) throw updateError
        } else if (type === 'root') {
            // Root Sharing (Brand Level)
            // ID passed is brandId
            const { data: existingConfig } = await supabase
                .from('assets')
                .select('id, metadata')
                .eq('brand_id', id)
                .is('folder_id', null)
                .eq('name', '.share_settings')
                .single()

            if (existingConfig) {
                const currentMetadata = (existingConfig.metadata as Record<string, unknown> | null) || {}
                const updatedMetadata = { ...currentMetadata, share: settings }
                await supabase.from('assets').update({ metadata: updatedMetadata }).eq('id', existingConfig.id)
            } else {
                await supabase.from('assets').insert({
                    name: '.share_settings',
                    folder_id: null,
                    brand_id: id,
                    uploader_id: user.id,
                    type: 'other',
                    file_url: 'internal://root-share-settings',
                    metadata: { share: settings },
                    is_downloadable: false
                })
            }
        } else {
            // Folder Sharing
            // Check if config asset exists
            const { data: existingConfig } = await supabase
                .from('assets')
                .select('id, metadata')
                .eq('folder_id', id)
                .eq('name', '.share_settings')
                .single()

            if (existingConfig) {
                const currentMetadata = (existingConfig.metadata as Record<string, unknown> | null) || {}
                const updatedMetadata = { ...currentMetadata, share: settings }
                await supabase.from('assets').update({ metadata: updatedMetadata }).eq('id', existingConfig.id)
            } else {
                // Create config asset
                // Need brand_id from folder
                const { data: folder } = await supabase.from('asset_folders').select('brand_id').eq('id', id).single()
                if (!folder) throw new Error("Folder not found")

                await supabase.from('assets').insert({
                    name: '.share_settings',
                    folder_id: id,
                    brand_id: folder.brand_id, // Important
                    uploader_id: user.id,
                    type: 'other',
                    file_url: 'internal://share-settings', // Dummy non-empty
                    metadata: { share: settings },
                    is_downloadable: false
                })
            }
        }

        revalidatePath('/brand/[slug]')
        return { success: true }
    } catch (error) {
        console.error("Update share error:", error)
        return { success: false, error: (error as Error).message }
    }
}

// Helper to check recursively for inherited share permissions
async function checkInheritedShare(startFolderId: string | null, brandId: string, supabase: any): Promise<{ share: ShareSettings; sourceId: string } | undefined> {
    let currentFolderId = startFolderId
    let depth = 0
    const MAX_DEPTH = 10

    while (depth < MAX_DEPTH) {
        if (!currentFolderId) {
            // Reached Root - Check Brand Share
            const { data: rootConfig } = await supabase.from('assets')
                .select('metadata')
                .eq('brand_id', brandId)
                .is('folder_id', null)
                .eq('name', '.share_settings')
                .single()

            if (rootConfig) {
                const metadata = rootConfig.metadata as Record<string, unknown> | null
                const share = metadata?.share as ShareSettings | undefined
                if (share?.active) return { share, sourceId: brandId }
            }
            return undefined // Stop at root
        }

        // Check current folder share
        const { data: folderConfig } = await supabase.from('assets')
            .select('metadata')
            .eq('folder_id', currentFolderId)
            .eq('name', '.share_settings')
            .single()

        if (folderConfig) {
            const metadata = folderConfig.metadata as Record<string, unknown> | null
            const share = metadata?.share as ShareSettings | undefined
            if (share?.active) return { share, sourceId: currentFolderId }
        }

        // Move up
        const { data: folder } = await supabase.from('asset_folders')
            .select('parent_id')
            .eq('id', currentFolderId)
            .single()

        if (!folder) return undefined // Broken chain
        currentFolderId = folder.parent_id
        depth++
    }
    return undefined
}

export async function getPublicSharedItem(id: string) {
    console.log("getPublicSharedItem called for:", id)
    if (!id) return { success: false, error: "Invalid ID" }

    // Check if ID is UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
        console.log("Invalid UUID:", id)
        return { success: false, error: "Invalid Item ID" }
    }

    const supabase = await createAdminClient()
    const { share, item: asset, type, sourceId } = await getEffectiveShareSettings(id, supabase)

    if (!asset) {
        return { success: false, error: "Item not found" }
    }

    if (!share?.active) {
        return { success: false, error: "Link is inactive" }
    }

    // Check Expiration
    if (share.expirationEnabled && share.expirationDate) {
        if (new Date(share.expirationDate) < new Date()) {
            return { success: false, error: "Link expired" }
        }
    }

    // Check Passcode
    if (share.passcodeEnabled && share.passcode) {
        const cookieStore = await cookies()
        const effectiveId = sourceId || id
        const token = cookieStore.get(`share_token_${effectiveId}`)?.value

        if (token !== share.passcode) {
            return { success: false, error: "Passcode required", protected: true, expirationDate: share.expirationDate }
        }
    }

    // If Folder, fetch contents
    let children: (Asset | (AssetFolder & { file_url: null }))[] = []
    const isRoot = (asset as Record<string, unknown>)?.type === 'root'

    // Fetch Assets
    let assetsQuery = supabase.from('assets').select('*').neq('name', '.share_settings')

    if (isRoot) {
        assetsQuery = assetsQuery.eq('brand_id', id).is('folder_id', null)
    } else {
        assetsQuery = assetsQuery.eq('folder_id', id)
    }

    const { data: files } = await assetsQuery

    // Fetch Subfolders
    let foldersQuery = supabase.from('asset_folders').select('*')

    if (isRoot) {
        foldersQuery = foldersQuery.eq('brand_id', id).is('parent_id', null)
    } else {
        foldersQuery = foldersQuery.eq('parent_id', id)
    }

    const { data: subfolders } = await foldersQuery

    // Combine and map types
    const mapFolderToChild = (f: AssetFolder): (AssetFolder & { type: string; file_url: null; metadata: any }) => ({
        ...f,
        type: 'folder', // Ensure type is 'folder' for UI
        file_url: null, // Folders don't have file_url
        metadata: { size: '0' } // Mock metadata
    })

    children = [
        ...(subfolders || []).map(mapFolderToChild),
        ...(files || []) as Asset[]
    ]

    // Build breadcrumb path
    const breadcrumbs: { id: string; name: string }[] = []
    if (type === 'folder' && (asset as Record<string, unknown>)?.type !== 'root') {
        // Add current folder
        breadcrumbs.push({ id: id, name: (asset as Record<string, unknown>)?.name as string || 'Folder' })

        // Traverse up to root
        let currentParentId = (asset as Record<string, unknown>)?.parent_id as string | null
        let depth = 0
        const MAX_DEPTH = 10

        while (currentParentId && depth < MAX_DEPTH) {
            const { data: parentFolder } = await supabase.from('asset_folders')
                .select('id, name, parent_id')
                .eq('id', currentParentId)
                .single()

            if (parentFolder) {
                breadcrumbs.unshift({ id: parentFolder.id, name: parentFolder.name })
                currentParentId = parentFolder.parent_id
            } else {
                break
            }
            depth++
        }

        // Add root (Brand Assets) at the beginning
        const brandId = (asset as Record<string, unknown>)?.brand_id as string
        if (brandId) {
            const { data: brand } = await supabase.from('brands').select('name').eq('id', brandId).single()
            breadcrumbs.unshift({ id: brandId, name: brand?.name || 'Brand Assets' })
        }
    } else if ((asset as Record<string, unknown>)?.type === 'root') {
        // Root level
        const brandId = (asset as Record<string, unknown>)?.brand_id as string
        const { data: brand } = await supabase.from('brands').select('name').eq('id', brandId).single()
        breadcrumbs.push({ id: brandId, name: brand?.name || 'Brand Assets' })
    }

    return { success: true, item: asset as unknown as Asset, type, children, breadcrumbs, expirationDate: share?.expirationDate }
}

// Helper to get effective share settings for any item (asset, folder, or root), including inheritance
async function getEffectiveShareSettings(id: string, supabase: any): Promise<{ share?: ShareSettings; item?: any; type: 'asset' | 'folder'; sourceId?: string }> {
    // 1. Try Asset
    const { data: assetData } = await supabase.from('assets').select('*').eq('id', id).single()
    let asset: any = assetData
    let type: 'asset' | 'folder' = 'asset'
    let share: ShareSettings | undefined
    let sourceId: string | undefined

    if (asset) {
        share = (asset.metadata as Record<string, unknown> | null)?.share as ShareSettings | undefined
        if (share?.active) sourceId = id
    } else {
        // 2. Try Folder
        const { data: folder } = await supabase.from('asset_folders').select('*').eq('id', id).single()
        if (folder) {
            type = 'folder'
            // Get config
            const { data: config } = await supabase.from('assets')
                .select('metadata')
                .eq('folder_id', id)
                .eq('name', '.share_settings')
                .single()
            const metadata = config?.metadata as Record<string, unknown> | null
            share = metadata?.share as ShareSettings | undefined
            asset = folder // Use folder as primary item
            if (share?.active) sourceId = id
        } else {
            // 3. Try Root Share (Brand ID)
            const { data: rootConfig } = await supabase.from('assets')
                .select('metadata')
                .eq('brand_id', id)
                .is('folder_id', null)
                .eq('name', '.share_settings')
                .single()

            if (rootConfig) {
                type = 'folder'
                const metadata = rootConfig.metadata as Record<string, unknown> | null
                share = metadata?.share as ShareSettings | undefined
                asset = { id, name: 'Brand Assets', type: 'root', brand_id: id, parent_id: null }
                if (share?.active) sourceId = id
            } else {
                return { type: 'asset' } // Not found
            }
        }
    }

    // Check inheritance if no direct active share
    if (!share?.active && asset) {
        const brandId = (asset as any).brand_id
        let startFolderId: string | null = null

        if (type === 'asset') {
            startFolderId = (asset as Asset).folder_id
        } else if (type === 'folder' && (asset as any).type !== 'root') {
            startFolderId = (asset as AssetFolder).parent_id
        }

        if (brandId) {
            const inherited = await checkInheritedShare(startFolderId, brandId, supabase)
            if (inherited) {
                share = inherited.share
                sourceId = inherited.sourceId
            }
        }
    }

    return { share, item: asset, type, sourceId }
}

export async function verifySharedItemPasscode(id: string, passcode: string) {
    const supabase = await createAdminClient()
    const { share, sourceId } = await getEffectiveShareSettings(id, supabase)

    if (!share?.passcodeEnabled || share.passcode !== passcode) {
        return { success: false, error: "Invalid passcode" }
    }

    const cookieStore = await cookies()
    const effectiveId = sourceId || id
    cookieStore.set(`share_token_${effectiveId}`, passcode, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
    })
    return { success: true }
}

// Get all folder contents recursively for ZIP download
export async function getAllFolderContentsRecursive(folderId: string, brandId?: string) {
    const supabase = await createAdminClient()

    interface FileItem {
        path: string
        name: string
        file_url: string
        type: string
    }

    const allFiles: FileItem[] = []
    const allFolders: string[] = [] // Track all folder paths for empty folder support

    async function fetchContents(currentFolderId: string | null, currentPath: string, bId: string) {
        // Fetch files in current folder
        let fileQuery = supabase.from('assets').select('*').neq('name', '.share_settings')
        if (currentFolderId) {
            fileQuery = fileQuery.eq('folder_id', currentFolderId)
        } else {
            fileQuery = fileQuery.eq('brand_id', bId).is('folder_id', null)
        }

        const { data: files } = await fileQuery

        if (files) {
            for (const file of files) {
                if (file.file_url) {
                    allFiles.push({
                        path: currentPath,
                        name: file.name || file.file_name || 'unnamed_file',
                        file_url: file.file_url,
                        type: file.type || 'file'
                    })
                }
            }
        }

        // Fetch subfolders
        let folderQuery = supabase.from('asset_folders').select('*')
        if (currentFolderId) {
            folderQuery = folderQuery.eq('parent_id', currentFolderId)
        } else {
            folderQuery = folderQuery.eq('brand_id', bId).is('parent_id', null)
        }

        const { data: folders } = await folderQuery

        if (folders) {
            for (const folder of folders) {
                const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.name
                // Track this folder path for empty folder support
                allFolders.push(folderPath)
                await fetchContents(folder.id, folderPath, bId)
            }
        }
    }

    // Get root name and start fetching
    let rootName = 'Brand Assets'

    if (folderId) {
        // Try as folder first
        const { data: folder } = await supabase.from('asset_folders').select('name, brand_id').eq('id', folderId).single()
        if (folder) {
            rootName = folder.name
            await fetchContents(folderId, '', folder.brand_id)
        } else {
            // Try as brand ID (root share)
            const { data: brand } = await supabase.from('brands').select('name').eq('id', folderId).single()
            if (brand) {
                rootName = brand.name
                await fetchContents(null, '', folderId)
            }
        }
    } else if (brandId) {
        const { data: brand } = await supabase.from('brands').select('name').eq('id', brandId).single()
        if (brand) {
            rootName = brand.name
        }
        await fetchContents(null, '', brandId)
    }

    return { success: true, files: allFiles, folders: allFolders, rootName }
}
