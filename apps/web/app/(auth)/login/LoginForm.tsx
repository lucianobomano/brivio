"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import { createClient } from "@/lib/supabase/client"
import { authErrorMessage, GOOGLE_AUTH_ENABLED } from "@/lib/auth-helpers"
import { AuthAlert, AuthButton, AuthField, AuthShell, AuthTitle, Divider, GoogleIcon, PasswordField, AUTH_MUTED } from "@/components/auth/AuthShell"

export default function LoginForm({ next, linkError, passwordReset }: { next: string, linkError?: boolean, passwordReset?: boolean }) {
    const router = useRouter()
    const [loading, setLoading] = React.useState<null | 'password' | 'google'>(null)
    const [error, setError] = React.useState<string | null>(linkError ? 'O link que usaste é inválido ou expirou. Pede um novo.' : null)
    const [unconfirmedEmail, setUnconfirmedEmail] = React.useState<string | null>(null)
    const [resent, setResent] = React.useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return
        setLoading('password')
        setError(null)
        setUnconfirmedEmail(null)

        const form = new FormData(event.currentTarget)
        const email = String(form.get("email") || "").trim()
        const password = String(form.get("password") || "")

        const { error } = await createClient().auth.signInWithPassword({ email, password })
        if (error) {
            setError(authErrorMessage(error))
            if (error.code === 'email_not_confirmed') setUnconfirmedEmail(email)
            setLoading(null)
            return
        }
        router.refresh()
        router.push(next)
    }

    async function resendConfirmation() {
        if (!unconfirmedEmail) return
        const { error } = await createClient().auth.resend({
            type: 'signup',
            email: unconfirmedEmail,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
        })
        if (error) setError(authErrorMessage(error))
        else setResent(true)
    }

    async function signInWithGoogle() {
        setLoading('google')
        setError(null)
        const { error } = await createClient().auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        })
        if (error) { setError(authErrorMessage(error)); setLoading(null) }
    }

    return (
        <AuthShell>
            <AuthTitle title="Bem-vindo de volta" text="Entra para continuar a trabalhar nas tuas marcas." />

            {passwordReset && <div className="mb-5"><AuthAlert kind="success">Palavra-passe alterada. Já podes entrar com a nova.</AuthAlert></div>}

            {GOOGLE_AUTH_ENABLED && (
                <>
                    <AuthButton type="button" variant="ghost" loading={loading === 'google'} disabled={!!loading} onClick={signInWithGoogle}>
                        {loading !== 'google' && <GoogleIcon />} Continuar com Google
                    </AuthButton>
                    <Divider>ou com email</Divider>
                </>
            )}

            <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
                <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="nome@exemplo.com" required autoFocus />
                <PasswordField
                    label="Palavra-passe"
                    name="password"
                    autoComplete="current-password"
                    required
                    aside={<Link href="/forgot-password" className="text-[13px] font-medium text-[color:var(--lp-accent)] hover:underline">Esqueceste-te?</Link>}
                />
                {error && (
                    <AuthAlert>
                        {error}
                        {unconfirmedEmail && !resent && (
                            <button type="button" onClick={resendConfirmation} className="block mt-1.5 font-semibold underline underline-offset-2">Enviar o email de confirmação outra vez</button>
                        )}
                        {resent && <span className="block mt-1.5 font-semibold">Enviámos um novo email para {unconfirmedEmail}.</span>}
                    </AuthAlert>
                )}
                <AuthButton type="submit" loading={loading === 'password'} disabled={!!loading}>Entrar</AuthButton>
            </form>

            <p className={`${AUTH_MUTED} mt-8 text-center text-[14px]`}>
                Ainda não tens conta?{" "}
                <Link href={next !== '/dashboard' ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="font-semibold text-[color:var(--lp-accent)] hover:underline">Criar conta grátis</Link>
            </p>
        </AuthShell>
    )
}
