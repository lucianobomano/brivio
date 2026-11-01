"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

// Only surface the indicator for actions slower than this, so quick saves don't flicker
const SHOW_DELAY_MS = 400

const isServerActionRequest = (init?: RequestInit) => {
    const headers = init?.headers
    if (!headers) return false
    if (headers instanceof Headers) return headers.has("next-action")
    if (Array.isArray(headers)) return headers.some(([key]) => key.toLowerCase() === "next-action")
    return Object.keys(headers).some((key) => key.toLowerCase() === "next-action")
}

/**
 * Global "A processar…" feedback for every Next.js server action.
 * Server actions are POSTs carrying a `Next-Action` header, so counting those
 * in-flight requests covers optimistic handlers (toggles, drags, blur-saves)
 * that have no local loading state of their own.
 */
export function ActionFeedbackProvider({ children }: { children: React.ReactNode }) {
    const [pendingCount, setPendingCount] = React.useState(0)
    const [visible, setVisible] = React.useState(false)
    const isBusy = pendingCount > 0

    React.useEffect(() => {
        const originalFetch = window.fetch
        window.fetch = async (input, init) => {
            if (!isServerActionRequest(init)) return originalFetch(input, init)
            setPendingCount((count) => count + 1)
            try {
                return await originalFetch(input, init)
            } finally {
                setPendingCount((count) => Math.max(0, count - 1))
            }
        }
        return () => {
            window.fetch = originalFetch
        }
    }, [])

    React.useEffect(() => {
        if (!isBusy) {
            setVisible(false)
            return
        }
        const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
        return () => window.clearTimeout(timer)
    }, [isBusy])

    return (
        <>
            {children}
            <div
                role="status"
                aria-live="polite"
                className={`fixed left-4 bottom-4 z-[60] pointer-events-none transition-all duration-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            >
                {visible && (
                    <div className="flex items-center gap-2 rounded-full border border-bg-3 bg-bg-1 px-3.5 py-2 text-[13px] font-medium text-text-primary shadow-lg">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff0054]" aria-hidden="true" />
                        A processar…
                    </div>
                )}
            </div>
        </>
    )
}
