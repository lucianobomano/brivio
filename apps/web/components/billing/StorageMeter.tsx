"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { getStorageUsage } from "@/app/actions/assets"
import { openUpgrade, useMyBilling } from "./upgrade"

const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
    return parseFloat((bytes / 1024 ** i).toFixed(2)) + " " + sizes[i]
}
const formatGB = (gb: number) => gb === Infinity ? "Ilimitado" : gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`

/**
 * The storage card at the bottom of the asset libraries: space used against the plan's limit, and «Upgrade».
 * Pass `usedBytes` when the library already knows it; otherwise it reads it for the scope (again when `refreshKey` changes).
 */
export function StorageMeter({ scope, usedBytes, refreshKey }: { scope?: { brandId?: string, workspaceId?: string }, usedBytes?: number, refreshKey?: unknown }) {
    const { billing } = useMyBilling()
    const [fetched, setFetched] = React.useState(0)
    const brandId = scope?.brandId, workspaceId = scope?.workspaceId
    React.useEffect(() => {
        if (usedBytes !== undefined || (!brandId && !workspaceId)) return
        let alive = true
        getStorageUsage({ brandId, workspaceId }).then(r => { if (alive && r.success && r.totalBytes !== undefined) setFetched(r.totalBytes) }).catch(() => { })
        return () => { alive = false }
    }, [brandId, workspaceId, usedBytes, refreshKey])

    const used = usedBytes ?? fetched
    const limitGB = billing?.storageLimitGB ?? 1
    const pct = limitGB === Infinity ? 0 : Math.min(100, Math.max(0, (used / (limitGB * 1024 ** 3)) * 100))
    const isTop = limitGB === Infinity

    return (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-[14px] font-bold text-white">{formatBytes(used)}</span>
                    <span className="text-[11px] text-[#555]">/ {billing ? formatGB(limitGB) : "…"}</span>
                </div>
                <div className="w-full bg-[#222] h-1 rounded-full mt-2 overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", pct > 90 ? "bg-red-500" : "bg-[#ff0054]")} style={{ width: `${pct}%` }} />
                </div>
                {billing?.pending && <span className="text-[10px] text-amber-400 mt-1.5">Plano {billing.pending.planName} em análise</span>}
            </div>
            {!isTop && (
                <button
                    type="button"
                    onClick={() => openUpgrade({ reason: "storage", usedBytes: used })}
                    className="text-[11px] font-bold text-white hover:bg-[#ff0054] transition-all px-3 py-1.5 bg-[#222] rounded-xl ml-4 shrink-0"
                >
                    Upgrade
                </button>
            )}
        </div>
    )
}
