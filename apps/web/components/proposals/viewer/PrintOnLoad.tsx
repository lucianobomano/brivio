"use client"

import * as React from "react"

/** Opens the browser's print dialog («Guardar como PDF») once the proposal has rendered, when the URL asks for it */
export function PrintOnLoad({ enabled }: { enabled: boolean }) {
    React.useEffect(() => {
        if (!enabled) return
        // Leave time for fonts and images
        const t = window.setTimeout(() => window.print(), 1200)
        return () => window.clearTimeout(t)
    }, [enabled])
    return null
}
