import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import { safeNext } from "@/lib/auth-helpers"
import LoginForm from "./LoginForm"

export const metadata: Metadata = { title: "Entrar · Brivio" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string, error?: string, reset?: string }> }) {
    const params = await searchParams
    // Already signed in: straight to where they were going
    if (await getCurrentUser()) redirect(safeNext(params.next))
    return <LoginForm next={safeNext(params.next)} linkError={params.error === 'link'} passwordReset={params.reset === '1'} />
}
