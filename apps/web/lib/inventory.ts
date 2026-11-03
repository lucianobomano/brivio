/** Labels and cost maths of the studio inventory (shared by /inventory and /finances) */

import type { InventoryBilling, InventoryCategory } from "@/app/actions/inventory"

export const CATEGORY_LABEL: Record<InventoryCategory, string> = {
    font: 'Fontes',
    software: 'Software',
    stock: 'Bancos de imagens',
    equipment: 'Equipamento',
    domain: 'Domínios e alojamento',
    other: 'Outros',
}

export const CATEGORY_SINGULAR: Record<InventoryCategory, string> = {
    font: 'Fonte',
    software: 'Software',
    stock: 'Banco de imagens',
    equipment: 'Equipamento',
    domain: 'Domínio',
    other: 'Outro',
}

export const BILLING_LABEL: Record<InventoryBilling, string> = { one_time: 'Pagamento único', monthly: 'Mensal', yearly: 'Anual' }
export const BILLING_SUFFIX: Record<InventoryBilling, string> = { one_time: '', monthly: '/mês', yearly: '/ano' }

/** Licence types people usually pick, per category */
export const LICENSE_SUGGESTIONS: Record<InventoryCategory, string[]> = {
    font: ['Desktop', 'Web', 'App', 'Desktop + Web', 'Comercial ilimitada', 'Open source (OFL)'],
    software: ['Individual', 'Equipa', 'Empresa', 'Educação'],
    stock: ['Standard', 'Extended', 'Editorial', 'Subscrição'],
    equipment: ['Garantia 2 anos', 'Garantia 3 anos', 'Leasing'],
    domain: ['Domínio', 'Alojamento', 'Email', 'SSL'],
    other: [],
}

/** What an item costs per month (yearly spread over 12; one-off purchases don't recur) */
export function monthlyCost(item: { cost: number | null, billing: InventoryBilling }): number {
    const c = Number(item.cost) || 0
    return item.billing === 'monthly' ? c : item.billing === 'yearly' ? c / 12 : 0
}
