import { cn } from "@/lib/utils"

/**
 * The frame of every page opened from a share link (shared files and folders, proposals, roadmaps):
 * the Brivio header on top and the «Powered by Brivio°» button at the end, the same everywhere.
 * Both are left out when the page is printed.
 */
export function SharePageHeader({ className }: { className?: string }) {
    return (
        <header className={cn("h-[80px] shrink-0 flex items-center justify-center border-b border-[#E5E5E5] bg-white sticky top-0 z-50 print:hidden", className)}>
            <a href="https://brivio.io" target="_blank" rel="noopener noreferrer" aria-label="Brivio" className="flex items-center justify-center">
                <img src="/brivio-logo-share.png" alt="Brivio" className="h-[34px] w-auto object-contain" />
            </a>
        </header>
    )
}

export function SharePoweredBy({ className }: { className?: string }) {
    return (
        <div className={cn("flex justify-center print:hidden", className)}>
            <a
                href="https://brivio.io"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[210px] h-[35px] bg-black rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
                <span className="text-white text-sm font-medium">Powered by</span>
                <span className="text-gray-400 text-sm font-medium">Brivio°</span>
            </a>
        </div>
    )
}
