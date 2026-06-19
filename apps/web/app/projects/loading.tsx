export default function ProjectsLoading() {
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
                {/* Toolbar skeleton */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-28 bg-white/10 rounded-lg" />
                    <div className="h-9 w-28 bg-white/10 rounded-lg" />
                    <div className="flex-1" />
                    <div className="h-9 w-32 bg-white/10 rounded-lg" />
                </div>

                {/* Kanban columns skeleton */}
                <div className="flex gap-4 overflow-hidden flex-1">
                    {[1, 2, 3, 4].map((col) => (
                        <div key={col} className="flex-1 min-w-[240px] flex flex-col gap-3">
                            {/* Column header */}
                            <div className="h-8 bg-white/10 rounded-lg w-full" />
                            {/* Cards */}
                            {[1, 2, 3].map((card) => (
                                <div
                                    key={card}
                                    className="h-24 bg-white/5 rounded-xl border border-white/5"
                                    style={{ opacity: 1 - card * 0.2 }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom nav skeleton */}
            <div className="fixed bottom-6 inset-x-0 flex justify-center">
                <div className="h-12 w-80 bg-white/10 rounded-full" />
            </div>
        </div>
    )
}
