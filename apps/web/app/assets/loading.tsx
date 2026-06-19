export default function AssetsLoading() {
    return (
        <div className="min-h-screen bg-bg-0 flex flex-col animate-pulse">
            {/* Header skeleton */}
            <div className="h-16 border-b border-white/5 flex items-center px-6 gap-4">
                <div className="h-8 w-32 bg-white/10 rounded-lg" />
                <div className="flex-1" />
                <div className="h-8 w-24 bg-white/10 rounded-full" />
                <div className="h-8 w-8 bg-white/10 rounded-full" />
            </div>

            {/* Content area */}
            <div className="flex-1 p-6 flex flex-col gap-6">
                {/* Search + filter bar */}
                <div className="flex items-center gap-3">
                    <div className="h-10 flex-1 bg-white/10 rounded-xl" />
                    <div className="h-10 w-32 bg-white/10 rounded-xl" />
                    <div className="h-10 w-10 bg-white/10 rounded-xl" />
                </div>

                {/* Grid skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square bg-white/5 rounded-xl border border-white/5"
                            style={{ opacity: Math.max(0.2, 1 - i * 0.05) }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
