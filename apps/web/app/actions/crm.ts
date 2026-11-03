'use server'

/**
 * CRM of the workspace: clients (companies), their contacts, and the deals of the sales pipeline.
 * Everything goes through the signed-in user's client, so row-level security keeps it to their workspace;
 * every write is also pinned to the current workspace.
 */

import { revalidatePath } from "next/cache"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { getDefaultWorkspace } from "@/lib/workspace"

export type CrmCompany = { id: string, name: string, industry: string | null, website: string | null, location: string | null, created_at: string }
export type CrmContact = { id: string, first_name: string, last_name: string | null, email: string | null, phone: string | null, position: string | null, company_id: string | null, created_at: string }
export type CrmStage = { id: string, name: string, order_index: number, color: string | null }
export type CrmDeal = { id: string, title: string, value: number | null, currency: string | null, stage_id: string | null, company_id: string | null, contact_id: string | null, expected_close_date: string | null, created_at: string, updated_at: string | null }

/** Stages of a creative studio's sales process (created on the first visit) */
const DEFAULT_STAGES = [
    { name: 'Novo contacto', color: '#94A3B8' },
    { name: 'Briefing', color: '#3B82F6' },
    { name: 'Proposta enviada', color: '#A855F7' },
    { name: 'Negociação', color: '#F59E0B' },
    { name: 'Ganho', color: '#10B981' },
    { name: 'Perdido', color: '#EF4444' },
]

type Result<T = undefined> = { success: true, data?: T } | { success: false, error: string }
const fail = (error: string): { success: false, error: string } => ({ success: false, error })
const clean = (v: unknown, max = 200) => { const s = String(v ?? '').trim().slice(0, max); return s || null }

async function context() {
    const user = await getCurrentUser()
    if (!user) return null
    const workspace = await getDefaultWorkspace()
    if (!workspace) return null
    return { user, workspaceId: workspace.id as string, currency: (workspace.default_currency as string) || 'EUR', supabase: await createClient() }
}

export async function getCrmData() {
    const ctx = await context()
    if (!ctx) return null
    const { supabase, workspaceId } = ctx

    // Pipeline (one per workspace for now), created with the default stages the first time
    let { data: pipeline } = await supabase.from('crm_pipelines').select('id, name').eq('workspace_id', workspaceId).order('created_at').limit(1).maybeSingle()
    if (!pipeline) {
        const { data: created } = await supabase.from('crm_pipelines').insert({ name: 'Vendas', workspace_id: workspaceId }).select('id, name').single()
        pipeline = created
        if (pipeline) await supabase.from('crm_deal_stages').insert(DEFAULT_STAGES.map((s, i) => ({ ...s, order_index: i, pipeline_id: pipeline!.id })))
    }

    const [stages, companies, contacts, deals] = await Promise.all([
        pipeline ? supabase.from('crm_deal_stages').select('id, name, order_index, color').eq('pipeline_id', pipeline.id).order('order_index') : Promise.resolve({ data: [] }),
        supabase.from('crm_companies').select('id, name, industry, website, location, created_at').eq('workspace_id', workspaceId).order('name'),
        supabase.from('crm_contacts').select('id, first_name, last_name, email, phone, position, company_id, created_at').eq('workspace_id', workspaceId).order('first_name'),
        supabase.from('crm_deals').select('id, title, value, currency, stage_id, company_id, contact_id, expected_close_date, created_at, updated_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    ])

    return {
        currency: ctx.currency,
        stages: (stages.data || []) as CrmStage[],
        companies: (companies.data || []) as CrmCompany[],
        contacts: (contacts.data || []) as CrmContact[],
        deals: (deals.data || []) as CrmDeal[],
    }
}

// ---------- Clients ----------

export async function saveCompany(input: { id?: string, name: string, industry?: string, website?: string, location?: string }): Promise<Result<CrmCompany>> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const name = clean(input.name, 120)
    if (!name) return fail('O cliente precisa de um nome.')
    let website = clean(input.website, 200)
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`
    const row = { name, industry: clean(input.industry, 80), website, location: clean(input.location, 120), updated_at: new Date().toISOString() }

    const query = input.id
        ? ctx.supabase.from('crm_companies').update(row).eq('id', input.id).eq('workspace_id', ctx.workspaceId)
        : ctx.supabase.from('crm_companies').insert({ ...row, workspace_id: ctx.workspaceId })
    const { data, error } = await query.select('id, name, industry, website, location, created_at').single()
    if (error || !data) return fail('Não foi possível guardar o cliente.')
    revalidatePath('/crm')
    return { success: true, data: data as CrmCompany }
}

export async function deleteCompany(id: string): Promise<Result> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    // Contacts and deals stay, without a client
    await Promise.all([
        ctx.supabase.from('crm_contacts').update({ company_id: null }).eq('company_id', id).eq('workspace_id', ctx.workspaceId),
        ctx.supabase.from('crm_deals').update({ company_id: null }).eq('company_id', id).eq('workspace_id', ctx.workspaceId),
    ])
    const { error } = await ctx.supabase.from('crm_companies').delete().eq('id', id).eq('workspace_id', ctx.workspaceId)
    if (error) return fail('Não foi possível eliminar o cliente.')
    revalidatePath('/crm')
    return { success: true }
}

// ---------- Contacts ----------

export async function saveContact(input: { id?: string, first_name: string, last_name?: string, email?: string, phone?: string, position?: string, company_id?: string | null }): Promise<Result<CrmContact>> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const first = clean(input.first_name, 80)
    if (!first) return fail('O contacto precisa de um nome.')
    const email = clean(input.email, 160)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Este email não é válido.')
    const row = { first_name: first, last_name: clean(input.last_name, 80), email, phone: clean(input.phone, 40), position: clean(input.position, 80), company_id: input.company_id || null, updated_at: new Date().toISOString() }

    const query = input.id
        ? ctx.supabase.from('crm_contacts').update(row).eq('id', input.id).eq('workspace_id', ctx.workspaceId)
        : ctx.supabase.from('crm_contacts').insert({ ...row, workspace_id: ctx.workspaceId })
    const { data, error } = await query.select('id, first_name, last_name, email, phone, position, company_id, created_at').single()
    if (error || !data) return fail('Não foi possível guardar o contacto.')
    revalidatePath('/crm')
    return { success: true, data: data as CrmContact }
}

export async function deleteContact(id: string): Promise<Result> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    await ctx.supabase.from('crm_deals').update({ contact_id: null }).eq('contact_id', id).eq('workspace_id', ctx.workspaceId)
    const { error } = await ctx.supabase.from('crm_contacts').delete().eq('id', id).eq('workspace_id', ctx.workspaceId)
    if (error) return fail('Não foi possível eliminar o contacto.')
    revalidatePath('/crm')
    return { success: true }
}

// ---------- Deals ----------

export async function saveDeal(input: { id?: string, title: string, value?: number | string | null, currency?: string, stage_id: string, company_id?: string | null, contact_id?: string | null, expected_close_date?: string | null }): Promise<Result<CrmDeal>> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const title = clean(input.title, 140)
    if (!title) return fail('Dá um nome ao negócio (ex.: Identidade visual — Café Lume).')
    const value = input.value === '' || input.value == null ? null : Number(String(input.value).replace(',', '.'))
    if (value !== null && (Number.isNaN(value) || value < 0)) return fail('O valor tem de ser um número positivo.')
    const row = {
        title,
        value,
        currency: clean(input.currency, 3)?.toUpperCase() || ctx.currency,
        stage_id: input.stage_id,
        company_id: input.company_id || null,
        contact_id: input.contact_id || null,
        expected_close_date: input.expected_close_date || null,
        updated_at: new Date().toISOString(),
    }
    const query = input.id
        ? ctx.supabase.from('crm_deals').update(row).eq('id', input.id).eq('workspace_id', ctx.workspaceId)
        : ctx.supabase.from('crm_deals').insert({ ...row, workspace_id: ctx.workspaceId })
    const { data, error } = await query.select('id, title, value, currency, stage_id, company_id, contact_id, expected_close_date, created_at, updated_at').single()
    if (error || !data) return fail('Não foi possível guardar o negócio.')
    revalidatePath('/crm')
    return { success: true, data: data as CrmDeal }
}

export async function moveDeal(id: string, stageId: string): Promise<Result> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const { error } = await ctx.supabase.from('crm_deals').update({ stage_id: stageId, updated_at: new Date().toISOString() }).eq('id', id).eq('workspace_id', ctx.workspaceId)
    if (error) return fail('Não foi possível mover o negócio.')
    return { success: true }
}

export async function deleteDeal(id: string): Promise<Result> {
    const ctx = await context()
    if (!ctx) return fail('Sessão expirada. Entra de novo.')
    const { error } = await ctx.supabase.from('crm_deals').delete().eq('id', id).eq('workspace_id', ctx.workspaceId)
    if (error) return fail('Não foi possível eliminar o negócio.')
    revalidatePath('/crm')
    return { success: true }
}
