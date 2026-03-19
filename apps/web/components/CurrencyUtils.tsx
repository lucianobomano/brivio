"use client"

import * as React from "react"
import { useWorkspace } from "./providers/WorkspaceProvider"

export function useCurrency() {
    const { workspace } = useWorkspace()
    const currencyCode = workspace?.default_currency || "EUR"

    const formatPrice = React.useCallback((amount: number | string) => {
        const value = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount
        if (isNaN(value)) return amount

        try {
            return new Intl.NumberFormat(workspace?.language || 'pt-PT', {
                style: 'currency',
                currency: currencyCode,
            }).format(value)
        } catch {
            // Fallback if currency/locale is invalid
            const symbol = currencyCode === 'EUR' ? '€' : currencyCode === 'USD' ? '$' : currencyCode + ' '
            return `${symbol}${value.toFixed(2)}`
        }
    }, [currencyCode, workspace])

    return { formatPrice, currencyCode }
}

export function FormattedPrice({ amount, className }: { amount: number | string, className?: string }) {
    const { formatPrice } = useCurrency()
    return <span className={className}>{formatPrice(amount)}</span>
}
