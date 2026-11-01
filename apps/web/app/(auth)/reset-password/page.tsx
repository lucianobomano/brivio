import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import ResetPasswordForm from "./ResetPasswordForm"

export const metadata: Metadata = { title: "Nova palavra-passe · Brivio" }

/** Reached from the recovery email (through /auth/callback, which signs the user in) */
export default async function ResetPasswordPage() {
    if (!(await getCurrentUser())) redirect('/login?error=link')
    return <ResetPasswordForm />
}
