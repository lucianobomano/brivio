"use server"

import { createAdminClient, createClient, getCurrentUser } from '@/lib/supabase/server'
import { findPlan, planStorageGB } from '@/lib/pricing-plans'
import { revalidatePath } from 'next/cache'

export async function processSubscription(formData: FormData) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'User not authenticated' }
        }

        const proofFile = formData.get('proof') as File
        const plan = formData.get('plan') as string
        const tier = formData.get('tier') as string
        const amountLocal = formData.get('amount_local') as string
        const currency = formData.get('currency') as string
        const bank = formData.get('bank') as string

        if (!proofFile || !plan || !amountLocal || !bank) {
            return { success: false, error: 'Missing required fields' }
        }

        // 1. Upload proof file to storage
        // Assuming we have a 'proofs' bucket or use 'assets' bucket
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `proofs/${user.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assets')
            .upload(fileName, proofFile, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError)
            return { success: false, error: 'Failed to upload proof' }
        }

        const proofUrl = uploadData.path

        // 2. Save subscription intent to database
        const { error: dbError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: user.id,
                plan: plan,
                tier: tier,
                amount_aoa: parseFloat(amountLocal), // We keep the column name as amount_aoa but store the local amount
                currency: currency || 'AOA',
                bank: bank,
                proof_url: proofUrl,
                status: 'pending'
            })

        if (dbError) {
            console.error('Database insert error:', dbError)
            return { success: false, error: 'Failed to record subscription' }
        }

        return { success: true }

    } catch (error: any) {
        console.error('processSubscription error:', error)
        return { success: false, error: error.message || 'Internal server error' }
    }
}
import { checkIsAdmin } from './admin'

export async function getPendingSubscriptions() {
    try {
        const supabase = await createClient()
        const user = await getCurrentUser()

        const { isAdmin } = await checkIsAdmin(user?.email)
        if (!user || !isAdmin) {
            return { success: false, error: 'Unauthorized access' }
        }

        // SECURITY: admins only (checked above); RLS would show them their own requests only
        const admin = await createAdminClient()
        const { data, error } = await admin
            .from('subscriptions')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function approveSubscription(id: string) {
    try {
        const supabase = await createClient()
        const user = await getCurrentUser()

        const { isAdmin } = await checkIsAdmin(user?.email)
        if (!user || !isAdmin) {
            return { success: false, error: 'Unauthorized access' }
        }

        const admin = await createAdminClient()
        const { data: sub } = await admin.from('subscriptions').select('id, user_id').eq('id', id).maybeSingle()
        if (!sub) return { success: false, error: 'Pedido não encontrado' }
        const now = new Date()
        const expires = new Date(now); expires.setMonth(expires.getMonth() + 1)
        // The plan the user had before ends now
        await admin.from('subscriptions').update({ status: 'cancelled', updated_at: now.toISOString() }).eq('user_id', sub.user_id).eq('status', 'active')
        const { error } = await admin
            .from('subscriptions')
            .update({ status: 'active', approved_at: now.toISOString(), expires_at: expires.toISOString(), updated_at: now.toISOString() })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function rejectSubscription(id: string, reason?: string) {
    try {
        const supabase = await createClient()
        const user = await getCurrentUser()

        const { isAdmin } = await checkIsAdmin(user?.email)
        if (!user || !isAdmin) {
            return { success: false, error: 'Unauthorized access' }
        }

        const admin = await createAdminClient()
        const { error } = await admin
            .from('subscriptions')
            .update({ status: 'rejected', reject_reason: reason || null, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export interface MyBilling {
    /** Plan in use (free when there is no active subscription, or it ended) */
    plan: string
    planName: string
    tier: string
    storageLimitGB: number
    since: string | null
    renewsAt: string | null
    /** A request waiting for the payment check */
    pending: { plan: string, planName: string, createdAt: string } | null
    /** The last rejected request, newer than the active plan */
    rejected: { planName: string, reason: string | null, at: string } | null
    history: { id: string, plan: string, planName: string, status: string, amount: number, currency: string, createdAt: string }[]
}

/** The signed-in user's plan, the request waiting for approval, and their requests */
export async function getMyBilling(): Promise<MyBilling> {
    const free = findPlan("free")
    const base: MyBilling = { plan: "free", planName: free.name, tier: "individual", storageLimitGB: planStorageGB("free"), since: null, renewsAt: null, pending: null, rejected: null, history: [] }
    const user = await getCurrentUser()
    if (!user) return base
    const supabase = await createClient()
    const { data } = await supabase.from('subscriptions').select('id, plan, tier, status, amount_aoa, currency, created_at, approved_at, expires_at, reject_reason, updated_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    const rows = data || []
    const now = Date.now()
    const active = rows.find(r => r.status === 'active' && (!r.expires_at || new Date(r.expires_at).getTime() > now))
    const pending = rows.find(r => r.status === 'pending')
    const rejected = rows.find(r => r.status === 'rejected')
    const out: MyBilling = { ...base }
    if (active) {
        const p = findPlan(active.plan)
        Object.assign(out, { plan: p.slug, planName: p.name, tier: active.tier, storageLimitGB: planStorageGB(p.slug), since: active.approved_at, renewsAt: active.expires_at })
    }
    if (pending) out.pending = { plan: pending.plan, planName: findPlan(pending.plan).name, createdAt: pending.created_at }
    if (rejected && (!active || new Date(rejected.updated_at).getTime() > new Date(active.approved_at || 0).getTime()) && !pending) {
        out.rejected = { planName: findPlan(rejected.plan).name, reason: rejected.reject_reason, at: rejected.updated_at }
    }
    out.history = rows.map(r => ({ id: r.id, plan: r.plan, planName: findPlan(r.plan).name, status: r.status, amount: Number(r.amount_aoa) || 0, currency: r.currency || 'AOA', createdAt: r.created_at }))
    return out
}
