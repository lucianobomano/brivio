"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Role enum: 'superadmin' | 'admin'

export async function checkIsAdmin(email: string | undefined): Promise<{ isAdmin: boolean, role: string | null }> {
    if (!email) return { isAdmin: false, role: null }
    
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('email', email)
            .single()

        if (error || !data) {
            return { isAdmin: false, role: null }
        }

        return { isAdmin: true, role: data.role }
    } catch (error) {
        console.error('Error checking admin status:', error)
        return { isAdmin: false, role: null }
    }
}

export async function getAdminUsers() {
    try {
        const supabase = await createClient()
        
        // Verify current user is superadmin
        const { data: { user } } = await supabase.auth.getUser()
        const { isAdmin, role } = await checkIsAdmin(user?.email)
        
        if (!isAdmin || role !== 'superadmin') {
            return { success: false, error: 'Unauthorized access. Superadmin only.' }
        }

        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function addAdminUser(email: string) {
    try {
        const supabase = await createClient()
        
        // Verify current user is superadmin
        const { data: { user } } = await supabase.auth.getUser()
        const { isAdmin, role } = await checkIsAdmin(user?.email)
        
        if (!isAdmin || role !== 'superadmin') {
            return { success: false, error: 'Unauthorized access. Superadmin only.' }
        }

        const { error } = await supabase
            .from('admin_users')
            .insert({ email, role: 'admin' })

        if (error) throw error
        
        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        // Handle unique constraint violation (code 23505)
        if (error?.code === '23505') {
            return { success: false, error: 'Este e-mail já é um administrador.' }
        }
        return { success: false, error: error.message }
    }
}

export async function removeAdminUser(id: string) {
    try {
        const supabase = await createClient()
        
        // Verify current user is superadmin
        const { data: { user } } = await supabase.auth.getUser()
        const { isAdmin, role } = await checkIsAdmin(user?.email)
        
        if (!isAdmin || role !== 'superadmin') {
            return { success: false, error: 'Unauthorized access. Superadmin only.' }
        }

        // Prevent deleting oneself or other superadmins directly for safety
        // But for simplicity, we just delete by ID. Let's make sure they aren't deleting themselves.
        const { data: targetAdmin } = await supabase.from('admin_users').select('email, role').eq('id', id).single()
        if (targetAdmin?.email === user?.email) {
            return { success: false, error: 'Não pode remover a si mesmo.' }
        }

        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', id)

        if (error) throw error
        
        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getDashboardStats() {
    try {
        const supabase = await createClient()
        
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        // Get total users
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
        // Get total projects
        const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })
        // Get total pending subscriptions
        const { count: pendingCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        // Get total brandbooks (only valid ones linked to a brand)
        const { count: brandbooksCount } = await supabase.from('brandbooks').select('brands!inner(*)', { count: 'exact', head: true })
        // Get total workspaces
        const { count: workspacesCount } = await supabase.from('workspaces').select('*', { count: 'exact', head: true })
        
        return { success: true, data: { usersCount, projectsCount, pendingCount, brandbooksCount, workspacesCount } }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getGlobalUsers() {
    try {
        const supabase = await createClient()
        
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, avatar_url, profile_type, created_at')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getGlobalProjects() {
    try {
        const supabase = await createClient()
        
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        const { data, error } = await supabase
            .from('projects')
            .select('id, name, status, cover_url, created_at, created_by')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getGlobalBrandbooks() {
    try {
        const supabase = await createClient()
        
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        const { data, error } = await supabase
            .from('brandbooks')
            .select(`
                id, 
                title, 
                created_at, 
                brand:brands!inner(
                    id,
                    name,
                    logo_url
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        
        // Flatten the data for the UI
        const formattedData = data.map(b => ({
            id: b.id,
            name: b.brand?.name || b.title || 'Sem Nome',
            logo_url: b.brand?.logo_url || null,
            created_at: b.created_at,
            created_by: null // we don't have created_by on brands table currently
        }))

        return { success: true, data: formattedData }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getGlobalWorkspaces() {
    try {
        const supabase = await createClient()
        
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        const { data, error } = await supabase
            .from('workspaces')
            .select('id, name, avatar_url, created_at, created_by')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAdminProject(id: string) {
    try {
        const supabase = await createClient()
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) throw error

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAdminBrandbook(id: string) {
    try {
        const supabase = await createClient()
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        const { error } = await supabase.from('brandbooks').delete().eq('id', id)
        if (error) throw error

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAdminWorkspace(id: string) {
    try {
        const supabase = await createClient()
        const { isAdmin } = await checkIsAdmin((await supabase.auth.getUser()).data.user?.email)
        if (!isAdmin) return { success: false, error: 'Unauthorized' }

        const { error } = await supabase.from('workspaces').delete().eq('id', id)
        if (error) throw error

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
