"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { authErrorMessage } from "@/lib/auth-helpers"
import { AuthAlert, AuthButton, AuthField, AuthShell, AuthTitle, AUTH_MUTED } from "@/components/auth/AuthShell"

export default function ForgotPasswordPage() {
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [sentTo, setSentTo] = React.useState<string | null>(null)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return
        const email = String(new FormData(event.currentTarget).get("email") || "").trim()
        setLoading(true)
        setError(null)
        const { error } = await createClient().auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })
        setLoading(false)
        // The answer is the same whether the email has an account or not (nothing to learn from it)
        if (error && (error.status === 429 || /rate limit|network|fetch/i.test(error.message))) { setError(authErrorMessage(error)); return }
        setSentTo(email)
    }

    return (
        <AuthShell>
            {sentTo ? (
                <>
                    <div className="w-14 h-14 rounded-2xl bg-[color:var(--lp-accent-soft)] text-[color:var(--lp-accent)] flex items-center justify-center mb-6">
                        <MailCheck className="w-7 h-7" />
                    </div>
                    <AuthTitle title="Verifica o teu email" text={<>Se existir uma conta com <strong className="text-[color:var(--lp-text)]">{sentTo}</strong>, vais receber um link para criares uma nova palavra-passe.</>} />
                    <p className={`${AUTH_MUTED} text-[13.5px] leading-relaxed`}>O link é válido durante pouco tempo. Procura também na pasta de spam.</p>
                </>
            ) : (
                <>
                    <AuthTitle title="Recuperar a palavra-passe" text="Escreve o email da tua conta e enviamos-te um link para criares uma nova." />
                    <form onSubmit={onSubmit} className="space-y-4">
                        <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="nome@exemplo.com" required autoFocus />
                        {error && <AuthAlert>{error}</AuthAlert>}
                        <AuthButton type="submit" loading={loading}>Enviar link</AuthButton>
                    </form>
                </>
            )}
            <Link href="/login" className={`${AUTH_MUTED} mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium hover:text-[color:var(--lp-text)]`}>
                <ArrowLeft className="w-4 h-4" /> Voltar a entrar
            </Link>
        </AuthShell>
    )
}
