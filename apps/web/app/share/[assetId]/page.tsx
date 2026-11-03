import { getPublicSharedItem } from "@/app/actions/assets"
import { ShareViewer } from "./ShareViewer"
import { createAdminClient } from "@/lib/supabase/server"
import type { FolderPreview } from "@/app/actions/assets"

/**
 * How the shared folders look: the folder style the workspace owner picked in their Asset Hub, and the newest
 * files of each subfolder shown (only the folders this link already shows, read on the server).
 */
async function sharedFolderLook(result: any): Promise<{ style: string | null, previews: Record<string, FolderPreview> }> {
    const none = { style: null, previews: {} }
    try {
        if (result?.type !== "folder" || !result?.item) return none
        const admin = await createAdminClient()
        const workspaceId: string | undefined = result.item.workspace_id
        let style: string | null = null
        if (workspaceId) {
            const { data: ws } = await admin.from("workspaces").select("created_by").eq("id", workspaceId).maybeSingle()
            if (ws?.created_by) {
                const { data } = await admin.auth.admin.getUserById(ws.created_by)
                style = (data?.user?.user_metadata as { asset_folder_style?: string } | undefined)?.asset_folder_style ?? null
            }
        }
        if (!style || style === "classic") return { style, previews: {} }
        const childIds = (result.children || []).filter((c: any) => c.type === "folder").map((c: any) => c.id).slice(0, 60)
        if (!childIds.length) return { style, previews: {} }
        const [{ data: files }, { data: subs }] = await Promise.all([
            admin.from("assets").select("folder_id, name, type, file_url, thumbnail_url").in("folder_id", childIds).is("deleted_at", null).order("created_at", { ascending: false }).limit(600),
            admin.from("asset_folders").select("parent_id").in("parent_id", childIds).is("deleted_at", null).limit(600),
        ])
        const previews: Record<string, FolderPreview> = Object.fromEntries(childIds.map((id: string) => [id, { count: 0, files: [] }]))
        for (const f of files || []) { const p = previews[f.folder_id as string]; if (!p) continue; p.count++; if (p.files.length < 4) p.files.push({ name: f.name, type: f.type, url: (f.thumbnail_url || f.file_url) ?? null }) }
        for (const sf of subs || []) { const p = previews[sf.parent_id as string]; if (p) p.count++ }
        return { style, previews }
    } catch {
        return none
    }
}


export default async function PublicSharePage({ params }: { params: Promise<{ assetId: string }> }) {
    const { assetId } = await params
    const result = await getPublicSharedItem(assetId)
    const look = await sharedFolderLook(result)


    return (
        <main className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
            {/* Header */}
            <header className="h-[80px] flex items-center justify-center border-b border-[#E5E5E5] bg-white sticky top-0 z-50">
                {/* Logo Placeholder - replicating the gradient circle from sidebar if no image, or just text */}
                <div className="flex items-center justify-center">
                    <img src="/brivio-logo-share.png" alt="Brivio" className="h-[34px] w-auto object-contain" />
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 w-full max-w-[1620px] mx-auto p-6 md:p-12 flex flex-col items-center">
                <ShareViewer
                    assetId={assetId}
                    initialAsset={result.item || null}
                    isProtected={result.protected}
                    initialError={result.error}
                    initialType={result.type as 'asset' | 'folder'}
                    initialChildren={result.children}
                    initialBreadcrumbs={result.breadcrumbs}
                    expirationDate={result.expirationDate as string}
                    folderStyle={look.style}
                    folderPreviews={look.previews}
                />
            </div>
        </main>
    )
}
