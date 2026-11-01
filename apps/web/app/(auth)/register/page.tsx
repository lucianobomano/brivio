import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import { safeNext } from "@/lib/auth-helpers"
import RegisterForm from "./RegisterForm"

export const metadata: Metadata = { title: "Criar conta · Brivio" }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string, plan?: string }> }) {
    const params = await searchParams
    if (await getCurrentUser()) redirect(safeNext(params.next))
    return <RegisterForm next={safeNext(params.next, '')} />
}
