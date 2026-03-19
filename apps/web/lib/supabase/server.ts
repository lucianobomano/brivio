import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // The `delete` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

export async function createAdminClient() {
    // Only works if SUPABASE_SERVICE_ROLE_KEY is set in .env.local
    // Use this sparingly for operations that need to bypass RLS (like fixing workspace data)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If no service key, fallback to normal client (will fail RLS but better than crashing if key missing?)
    if (!serviceKey) {
        console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail or fallback to anon.")
    }

    // We use basic createClient from supabase-js
    const { createClient } = await import('@supabase/supabase-js')

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Fallback to anon if missing
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
