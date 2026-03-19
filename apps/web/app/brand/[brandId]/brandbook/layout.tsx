export default function BrandbookLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-bg-0 text-white flex flex-col">
            {/* Sidebar removed for full screen editor */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    )
}
