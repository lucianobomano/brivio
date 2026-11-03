"use client"

import { useEffect, useState } from "react"

/**
 * The visitor's currency (from their IP) and the USD → currency rate, used to show plan prices locally.
 * Read once per page and shared; falls back to USD.
 */
type Local = { currency: string, rate: number, ready: boolean }
let cached: Local | null = null
let pending: Promise<Local> | null = null

const load = (): Promise<Local> => {
    if (cached) return Promise.resolve(cached)
    if (pending) return pending
    pending = (async () => {
        try {
            const geo = await fetch("https://ipapi.co/json/").then(r => { if (!r.ok) throw new Error(); return r.json() })
            const currency: string = geo.currency || "USD"
            let rate = 1
            if (currency !== "USD") {
                const data = await fetch("https://api.exchangerate-api.com/v4/latest/USD").then(r => { if (!r.ok) throw new Error(); return r.json() })
                rate = data?.rates?.[currency] || 1
                if (!data?.rates?.[currency]) return (cached = { currency: "USD", rate: 1, ready: true })
            }
            return (cached = { currency, rate, ready: true })
        } catch {
            return (cached = { currency: "USD", rate: 1, ready: true })
        }
    })()
    return pending
}

export function useLocalCurrency() {
    const [local, setLocal] = useState<Local>(cached || { currency: "USD", rate: 1, ready: false })
    useEffect(() => { let alive = true; load().then(l => { if (alive) setLocal(l) }); return () => { alive = false } }, [])

    /** "$15" → the price in the local currency */
    const format = (usd: string | number) => {
        const n = typeof usd === "number" ? usd : parseFloat(String(usd).replace("$", ""))
        if (isNaN(n)) return String(usd)
        return new Intl.NumberFormat(local.currency === "AOA" ? "pt-AO" : "pt-PT", {
            style: "currency", currency: local.currency, maximumFractionDigits: local.currency === "AOA" ? 0 : 2,
        }).format(n * local.rate)
    }
    return { ...local, format }
}
