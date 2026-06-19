export default function BrandOpsLoading() {
    return (
        <div className="min-h-screen bg-bg-0 flex flex-col items-center justify-center animate-pulse gap-6">
            <div className="h-12 w-48 bg-white/10 rounded-2xl" />
            <div className="h-4 w-64 bg-white/5 rounded-full" />
            <div className="h-4 w-48 bg-white/5 rounded-full" />
            <div className="flex gap-3 mt-4">
                <div className="h-10 w-32 bg-white/10 rounded-full" />
                <div className="h-10 w-32 bg-white/5 rounded-full" />
            </div>
        </div>
    )
}
