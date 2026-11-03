import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import ResetPasswordForm from "./ResetPasswordForm"

export const metadata: Metadata = { title: "Palavra-passe · Brivio" }

/** Reached from the recovery or invitation email (through /auth/callback, which signs the user in) */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
    if (!(await getCurrentUser())) redirect('/login?error=link')
    const { invite } = await searchParams
    return <ResetPasswordForm invite={invite === '1'} />
}
