type SkeletonVariant = "board" | "grid" | "list" | "editor" | "detail"

/**
 * Instant route-level placeholder rendered by loading.tsx files while the
 * server component streams in. Uses theme tokens so it works in light and dark.
 */
export function PageSkeleton({ variant = "list", withBottomNav = false }: { variant?: SkeletonVariant, withBottomNav?: boolean }) {
    return (
        <div className="min-h-screen bg-bg-0 flex flex-col animate-pulse" aria-busy="true" aria-label="Carregando">
            {variant !== "editor" && (
                <div className="h-16 border-b border-bg-2 flex items-center px-6 gap-4">
                    <div className="h-8 w-32 bg-bg-2 rounded-lg" />
                    <div className="flex-1" />
                    <div className="h-8 w-24 bg-bg-2 rounded-full" />
                    <div className="h-8 w-8 bg-bg-2 rounded-full" />
                </div>
            )}

            {variant === "board" && (
                <div className="flex-1 p-6 flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((col) => (
                        <div key={col} className="flex-1 min-w-[240px] flex flex-col gap-3">
                            <div className="h-8 bg-bg-2 rounded-lg" />
                            {[1, 2, 3].map((card) => (
                                <div key={card} className="h-24 bg-bg-1 rounded-xl border border-bg-2" style={{ opacity: 1 - card * 0.2 }} />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {variant === "grid" && (
                <div className="flex-1 p-6 flex flex-col gap-6">
                    <div className="h-10 w-full max-w-md bg-bg-2 rounded-xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-[4/3] bg-bg-1 rounded-xl border border-bg-2" style={{ opacity: Math.max(0.3, 1 - i * 0.08) }} />
                        ))}
                    </div>
                </div>
            )}

            {variant === "list" && (
                <div className="flex-1 p-6 flex flex-col gap-3 max-w-[1600px] w-full mx-auto">
                    <div className="h-8 w-48 bg-bg-2 rounded-lg mb-3" />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-16 bg-bg-1 rounded-xl border border-bg-2" style={{ opacity: Math.max(0.3, 1 - i * 0.12) }} />
                    ))}
                </div>
            )}

            {variant === "detail" && (
                <div className="flex-1 p-6 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
                    <div className="h-48 bg-bg-1 rounded-2xl border border-bg-2" />
                    <div className="h-8 w-64 bg-bg-2 rounded-lg" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-bg-1 rounded-xl border border-bg-2" />
                        ))}
                    </div>
                </div>
            )}

            {variant === "editor" && (
                <div className="flex-1 flex">
                    <div className="hidden md:flex w-64 border-r border-bg-2 p-4 flex-col gap-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-6 bg-bg-2 rounded-md" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
                        ))}
                    </div>
                    <div className="flex-1 p-10 flex flex-col gap-6">
                        <div className="h-10 w-72 bg-bg-2 rounded-lg" />
                        <div className="h-64 bg-bg-1 rounded-2xl border border-bg-2" />
                        <div className="h-4 w-full max-w-2xl bg-bg-2 rounded" />
                        <div className="h-4 w-full max-w-xl bg-bg-2 rounded" />
                    </div>
                </div>
            )}

            {withBottomNav && (
                <div className="fixed bottom-6 inset-x-0 flex justify-center">
                    <div className="h-12 w-80 bg-bg-2 rounded-full" />
                </div>
            )}
        </div>
    )
}
