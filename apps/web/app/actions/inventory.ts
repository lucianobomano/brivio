'use server'

/**
 * Studio inventory: fonts, software, stock libraries, equipment and domains of the workspace.
 * Through the user's client (row-level security keeps it to their workspace); writes are pinned to it.
 */

import { revalidatePath } from "next/cache"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { getDefaultWorkspace } from "@/lib/workspace"

export type InventoryCategory = 'font' | 'software' | 'stock' | 'equipment' | 'domain' | 'other'
export type InventoryBilling = 'one_time' | 'monthly' | 'yearly'
export type InventoryItem = {
    id: string
    name: string
    category: InventoryCategory
    vendor: string | null
    license: string | null
    seats: number | null
    cost: number | null
    currency: string
    billing: InventoryBilling
    purchased_at: string | null
    renews_at: string | null
    assigned_to: string | null
    brand_id: string | null
    notes: string | null
    created_at: string
}

const CATEGORIES: InventoryCategory[] = ['font', 'software', 'stock', 'equipment', 'domain', 'other']
const BILLINGS: InventoryBilling[] = ['one_time', 'monthly', 'yearly']
const COLUMNS = 'id, name, category, vendor, license, seats, cost, currency, billing, purchased_at, renews_at, assigned_to, brand_id, notes, created_at'
type Result<T = undefined> = { success: true, data?: T } | { success: false, error: string }
const fail = (error: string): { success: false, error: string } => ({ success: false, error })
const clean = (v: unknown, max = 200) => { const s = String(v ?? '').trim().slice(0, max); return s || null }
const isMissingTable = (e: { code?: string } | null) => e?.code === '42P01' || e?.code === 'PGRST205'

async function context() {
    const user = await getCurrentUser()
    if (!user) return null
    const workspace = await getDefaultWorkspace()
    if (!workspace) return null
    return { user, workspaceId: workspace.id as string, currency: (workspace.default_currency as string) || 'EUR', supabase: await createClient() }
}

export async function getInventory() {
    const ctx = await context()
    if (!ctx) return null
    const [items, members, brands] = await Promise.all([
        ctx.supabase.from('inventory_items').select(COLUMNS).eq('workspace_id', ctx.workspaceId).order('name'),
        ctx.supabase.from('workspace_members').select('user_id, user:users(name, email)').eq('workspace_id', ctx.workspaceId),
        ctx.supabase.from('brands').select('id, name').eq('workspace_id', ctx.workspaceId).order('name'),
    ])
    type MemberRow = { user_id: string, user: { name: string, email: string } | { name: string, email: string }[] | null }
    return {
        ready: !isMissingTable(items.error),
        currency: ctx.currency,
        items: (items.data || []) as InventoryItem[],
        people: ((members.data || []) as MemberRow[]).map(m => { const u = Array.isArray(m.user) ? m.user[0] : m.user; return { id: m.user_id, name: u?.name || u?.email || 'Sem nome' } }),
        brands: (brands.data || []) as { id: string, name: string }[],
    }
}

export async function saveInventoryItem(input: Partial<InventoryItem> & { name: string }): Promise<Result<InventoryItem>> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const name = clean(input.name, 140)
    if (!name) return fail('Dá um nome ao item (ex.: Neue Haas Grotesk, Adobe Creative Cloud).')
    const category = CATEGORIES.includes(input.category as InventoryCategory) ? input.category as InventoryCategory : 'other'
    const billing = BILLINGS.includes(input.billing as InventoryBilling) ? input.billing as InventoryBilling : 'one_time'
    const cost = input.cost === null || input.cost === undefined || String(input.cost) === '' ? null : Number(String(input.cost).replace(',', '.'))
    if (cost !== null && (Number.isNaN(cost) || cost < 0)) return fail('O custo tem de ser um número positivo.')
    const seats = input.seats === null || input.seats === undefined || String(input.seats) === '' ? null : Math.max(0, Math.round(Number(input.seats)))
    if (seats !== null && Number.isNaN(seats)) return fail('O número de licenças não é válido.')

    const row = {
        name, category, billing, cost, seats,
        vendor: clean(input.vendor, 120),
        license: clean(input.license, 120),
        currency: clean(input.currency, 3)?.toUpperCase() || ctx.currency,
        purchased_at: input.purchased_at || null,
        renews_at: input.renews_at || null,
        assigned_to: input.assigned_to || null,
        brand_id: input.brand_id || null,
        notes: clean(input.notes, 1000),
        updated_at: new Date().toISOString(),
    }
    const query = input.id
        ? ctx.supabase.from('inventory_items').update(row).eq('id', input.id).eq('workspace_id', ctx.workspaceId)
        : ctx.supabase.from('inventory_items').insert({ ...row, workspace_id: ctx.workspaceId, created_by: ctx.user.id })
    const { data, error } = await query.select(COLUMNS).single()
    if (error || !data) return fail(isMissingTable(error) ? 'O inventário ainda não está ativo nesta conta.' : 'Não foi possível guardar o item.')
    revalidatePath('/inventory')
    revalidatePath('/finances')
    return { success: true, data: data as InventoryItem }
}

export async function deleteInventoryItem(id: string): Promise<Result> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const { error } = await ctx.supabase.from('inventory_items').delete().eq('id', id).eq('workspace_id', ctx.workspaceId)
    if (error) return fail('Não foi possível eliminar o item.')
    revalidatePath('/inventory')
    revalidatePath('/finances')
    return { success: true }
}
