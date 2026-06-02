import { ReactNode } from "react"

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-bg-0 text-white selection:bg-[#ff0054]/30">
            {children}
        </div>
    )
}
