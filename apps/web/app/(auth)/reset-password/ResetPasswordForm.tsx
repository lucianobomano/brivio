"use client"

import * as React from "react"
import { useRouter } from "nextjs-toploader/app"
import { createClient } from "@/lib/supabase/client"
import { authErrorMessage, MIN_PASSWORD } from "@/lib/auth-helpers"
import { AuthAlert, AuthButton, AuthShell, AuthTitle, PasswordField } from "@/components/auth/AuthShell"

export default function ResetPasswordForm({ invite = false }: { invite?: boolean }) {
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return
        const form = new FormData(event.currentTarget)
        const password = String(form.get("password") || "")
        const confirm = String(form.get("confirm") || "")
        if (password.length < MIN_PASSWORD) { setError(`A palavra-passe precisa de pelo menos ${MIN_PASSWORD} caracteres.`); return }
        if (password !== confirm) { setError('As palavras-passe não coincidem.'); return }

        setLoading(true)
        setError(null)
        const { error } = await createClient().auth.updateUser({ password })
        if (error) { setError(authErrorMessage(error)); setLoading(false); return }
        router.refresh()
        router.push('/dashboard')
    }

    return (
        <AuthShell>
            <AuthTitle title={invite ? "Bem-vindo ao Brivio" : "Cria uma nova palavra-passe"} text={invite ? "Foste convidado para um estúdio. Define a tua palavra-passe para entrar." : "Escolhe uma palavra-passe que não uses noutros sítios."} />
            <form onSubmit={onSubmit} className="space-y-4">
                <PasswordField label={invite ? "Palavra-passe" : "Nova palavra-passe"} name="password" autoComplete="new-password" required minLength={MIN_PASSWORD} autoFocus />
                <PasswordField label="Repetir a palavra-passe" name="confirm" autoComplete="new-password" required minLength={MIN_PASSWORD} />
                {error && <AuthAlert>{error}</AuthAlert>}
                <AuthButton type="submit" loading={loading}>Guardar e entrar</AuthButton>
            </form>
        </AuthShell>
    )
}
