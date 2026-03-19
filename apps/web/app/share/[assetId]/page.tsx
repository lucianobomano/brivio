import { getPublicSharedItem } from "@/app/actions/assets"
import { ShareViewer } from "./ShareViewer"


export default async function PublicSharePage({ params }: { params: Promise<{ assetId: string }> }) {
    const { assetId } = await params
    const result = await getPublicSharedItem(assetId)


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
                />
            </div>
        </main>
    )
}
