'use server'

/**
 * Finances of the workspace: invoices, charges (project billings) and receipts of every project, plus the
 * recurring costs of the studio inventory. Read-only overview; documents are issued inside each project.
 * Projects are found with the service role after checking the user belongs to the workspace (the projects
 * table only shows a user their own projects through row-level security).
 */

import { createAdminClient, createClient, getCurrentUser } from "@/lib/supabase/server"
import { getDefaultWorkspace } from "@/lib/workspace"
import { canAccessWorkspace } from "@/lib/brand-access"
import type { InventoryBilling } from "@/app/actions/inventory"

export type FinanceDocKind = 'invoice' | 'billing' | 'receipt'
export type FinanceStatus = 'draft' | 'sent' | 'pending' | 'overdue' | 'paid' | 'cancelled' | 'issued'
export type FinanceDoc = {
    id: string
    kind: FinanceDocKind
    identifier: string
    project_id: string
    project_name: string
    client: string | null
    amount: number
    currency: string
    status: FinanceStatus
    issued_at: string | null
    due_date: string | null
    /** For invoices and charges: a receipt points to them */
    receipted: boolean
}

export async function getFinances() {
    const user = await getCurrentUser()
    if (!user) return null
    const workspace = await getDefaultWorkspace()
    if (!workspace || !(await canAccessWorkspace(workspace.id))) return null
    const currency = (workspace.default_currency as string) || 'EUR'

    const admin = await createAdminClient()
    const { data: projects } = await admin.from('projects').select('id, name').eq('workspace_id', workspace.id)
    const projectName = new Map((projects || []).map(p => [p.id as string, p.name as string]))
    const ids = [...projectName.keys()]

    const empty = { data: [] as Record<string, unknown>[] }
    const [invoices, billings, receipts, inventory] = await Promise.all([
        ids.length ? admin.from('invoices').select('id, project_id, identifier, status, amount, currency, issued_at, due_date, client_name').in('project_id', ids) : Promise.resolve(empty),
        ids.length ? admin.from('project_billings').select('id, project_id, identifier, status, amount, currency, issued_at, due_date').in('project_id', ids) : Promise.resolve(empty),
        ids.length ? admin.from('receipts').select('id, project_id, identifier, amount, currency, received_at, billing_id, invoice_id').in('project_id', ids) : Promise.resolve(empty),
        (await createClient()).from('inventory_items').select('id, name, category, cost, currency, billing').eq('workspace_id', workspace.id),
    ])

    const receiptRows = (receipts.data || []) as { id: string, project_id: string, identifier: string | null, amount: number | null, currency: string | null, received_at: string | null, billing_id: string | null, invoice_id: string | null }[]
    const receiptedInvoices = new Set(receiptRows.map(r => r.invoice_id).filter(Boolean))
    const receiptedBillings = new Set(receiptRows.map(r => r.billing_id).filter(Boolean))
    const today = new Date().toISOString().slice(0, 10)
    const overdue = (status: string, due: string | null) => !!due && due < today && (status === 'sent' || status === 'pending')

    const docs: FinanceDoc[] = [
        ...((invoices.data || []) as { id: string, project_id: string, identifier: string | null, status: string | null, amount: number | null, currency: string | null, issued_at: string | null, due_date: string | null, client_name: string | null }[]).map(i => ({
            id: i.id, kind: 'invoice' as const, identifier: i.identifier || 'Fatura', project_id: i.project_id, project_name: projectName.get(i.project_id) || 'Projeto',
            client: i.client_name, amount: Number(i.amount) || 0, currency: (i.currency || currency).toUpperCase(),
            status: (overdue(i.status || '', i.due_date) ? 'overdue' : (i.status || 'draft')) as FinanceStatus,
            issued_at: i.issued_at, due_date: i.due_date, receipted: receiptedInvoices.has(i.id),
        })),
        ...((billings.data || []) as { id: string, project_id: string, identifier: string | null, status: string | null, amount: number | null, currency: string | null, issued_at: string | null, due_date: string | null }[]).map(b => ({
            id: b.id, kind: 'billing' as const, identifier: b.identifier || 'Cobrança', project_id: b.project_id, project_name: projectName.get(b.project_id) || 'Projeto',
            client: null, amount: Number(b.amount) || 0, currency: (b.currency || currency).toUpperCase(),
            status: (overdue(b.status || '', b.due_date) ? 'overdue' : (b.status || 'pending')) as FinanceStatus,
            issued_at: b.issued_at, due_date: b.due_date, receipted: receiptedBillings.has(b.id),
        })),
        ...receiptRows.map(r => ({
            id: r.id, kind: 'receipt' as const, identifier: r.identifier || 'Recibo', project_id: r.project_id, project_name: projectName.get(r.project_id) || 'Projeto',
            client: null, amount: Number(r.amount) || 0, currency: (r.currency || currency).toUpperCase(),
            status: 'issued' as const, issued_at: r.received_at, due_date: null, receipted: false,
        })),
    ].sort((a, b) => String(b.issued_at || '').localeCompare(String(a.issued_at || '')))

    return {
        currency,
        projects: (projects || []).map(p => ({ id: p.id as string, name: p.name as string })),
        docs,
        inventoryReady: !inventory.error,
        recurring: ((inventory.data || []) as { id: string, name: string, category: string, cost: number | null, currency: string, billing: InventoryBilling }[]).filter(i => i.billing !== 'one_time' && i.cost),
    }
}
