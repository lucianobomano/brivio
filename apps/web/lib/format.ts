/** Money, dates and names, formatted the way the app shows them (Portuguese) */

export function formatMoney(amount: number | string | null | undefined, currency = 'EUR', opts: { compact?: boolean } = {}): string {
    const n = Number(amount) || 0
    const cur = (currency || 'EUR').toUpperCase()
    try {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: cur,
            maximumFractionDigits: opts.compact || Number.isInteger(n) ? 0 : 2,
            notation: opts.compact && Math.abs(n) >= 10000 ? 'compact' : 'standard',
        }).format(n)
    } catch {
        return `${n.toFixed(2)} ${cur}`
    }
}

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }): string {
    if (!value) return '—'
    const d = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('pt-PT', opts)
}

/** Whole days from today to a date (negative when it is in the past) */
export function daysUntil(value: string | Date | null | undefined): number | null {
    if (!value) return null
    const d = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(d.getTime())) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const day = new Date(d); day.setHours(0, 0, 0, 0)
    return Math.round((day.getTime() - today.getTime()) / 86400000)
}

export const initials = (name: string | null | undefined) =>
    (name || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?'
