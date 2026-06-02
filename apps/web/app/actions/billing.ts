"use server"

import { createClient } from '@/lib/supabase/server'
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
        const { data: { user } } = await supabase.auth.getUser()

        const { isAdmin } = await checkIsAdmin(user?.email)
        if (!user || !isAdmin) {
            return { success: false, error: 'Unauthorized access' }
        }

        const { data, error } = await supabase
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
        const { data: { user } } = await supabase.auth.getUser()

        const { isAdmin } = await checkIsAdmin(user?.email)
        if (!user || !isAdmin) {
            return { success: false, error: 'Unauthorized access' }
        }

        const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
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
        const { data: { user } } = await supabase.auth.getUser()

        const { isAdmin } = await checkIsAdmin(user?.email)
        if (!user || !isAdmin) {
            return { success: false, error: 'Unauthorized access' }
        }

        const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
