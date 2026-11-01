import { getCurrentUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AssetsClient } from "@/components/assets/AssetsClient"
import { getAssets } from "@/app/actions/assets"
import { getDefaultWorkspace } from "@/lib/workspace"

export default async function AssetsPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // PERFORMANCE: load the root folder on the server (same workspace as the layout's
    // WorkspaceProvider; the lookup is memoized per request) so assets render with the page
    const workspace = await getDefaultWorkspace()
    const result = workspace?.id ? await getAssets({ workspaceId: workspace.id }) : null

    const initialData = workspace?.id && result?.success
        ? { workspaceId: workspace.id, folders: result.folders || [], assets: result.assets || [] }
        : null

    return <AssetsClient initialData={initialData} />
}
