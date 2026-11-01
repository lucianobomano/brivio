"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import { motion } from "framer-motion"
import { Building2, MailCheck, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { authErrorMessage, GOOGLE_AUTH_ENABLED, MIN_PASSWORD, passwordStrength } from "@/lib/auth-helpers"
import { AuthAlert, AuthButton, AuthField, AuthShell, AuthTitle, Divider, GoogleIcon, PasswordField, AUTH_MUTED } from "@/components/auth/AuthShell"

/** Who is signing up (stored as the profile's role) */
const ACCOUNT_TYPES = [
    { id: 'designer', label: 'Freelancer', icon: User },
    { id: 'agency_owner', label: 'Estúdio ou agência', icon: Users },
    { id: 'client', label: 'Empresa', icon: Building2 },
] as const
type AccountType = typeof ACCOUNT_TYPES[number]['id']

export default function RegisterForm({ next }: { next: string }) {
    const router = useRouter()
    const [loading, setLoading] = React.useState<null | 'email' | 'google'>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [accountType, setAccountType] = React.useState<AccountType>('designer')
    const [password, setPassword] = React.useState('')
    const [sentTo, setSentTo] = React.useState<string | null>(null)
    const [resent, setResent] = React.useState(false)
    const strength = passwordStrength(password)
    // After the account is ready: the onboarding (it sends them on to `next` when there is one)
    const afterSignup = next ? `/onboarding?next=${encodeURIComponent(next)}` : '/onboarding'

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return
        const form = new FormData(event.currentTarget)
        const name = String(form.get("name") || "").trim()
        const email = String(form.get("email") || "").trim()

        if (password.length < MIN_PASSWORD) { setError(`A palavra-passe precisa de pelo menos ${MIN_PASSWORD} caracteres.`); return }
        setLoading('email')
        setError(null)

        const { data, error } = await createClient().auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(afterSignup)}`,
                data: { name, full_name: name, role_global: accountType },
            },
        })
        if (error) { setError(authErrorMessage(error)); setLoading(null); return }

        // Email confirmation on: no session yet, they have to open the email first
        if (!data.session) {
            // Supabase answers an existing, confirmed email with a user without identities
            if (data.user && data.user.identities?.length === 0) {
                setError('Já existe uma conta com este email. Entra ou recupera a palavra-passe.')
                setLoading(null)
                return
            }
            setSentTo(email)
            setLoading(null)
            return
        }
        router.refresh()
        router.push(afterSignup)
    }

    async function resend() {
        if (!sentTo) return
        const { error } = await createClient().auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(afterSignup)}` } })
        if (error) setError(authErrorMessage(error))
        else setResent(true)
    }

    async function signUpWithGoogle() {
        setLoading('google')
        setError(null)
        const { error } = await createClient().auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(afterSignup)}` },
        })
        if (error) { setError(authErrorMessage(error)); setLoading(null) }
    }

    // Waiting for the confirmation email
    if (sentTo) {
        return (
            <AuthShell>
                <div className="w-14 h-14 rounded-2xl bg-[color:var(--lp-accent-soft)] text-[color:var(--lp-accent)] flex items-center justify-center mb-6">
                    <MailCheck className="w-7 h-7" />
                </div>
                <AuthTitle title="Confirma o teu email" text={<>Enviámos um link para <strong className="text-[color:var(--lp-text)]">{sentTo}</strong>. Abre-o para ativar a conta e continuar.</>} />
                <div className="space-y-3">
                    {error && <AuthAlert>{error}</AuthAlert>}
                    {resent && <AuthAlert kind="success">Enviámos o email outra vez.</AuthAlert>}
                    <AuthButton type="button" variant="ghost" onClick={resend} disabled={resent}>Não recebeste? Enviar outra vez</AuthButton>
                </div>
                <p className={cn(AUTH_MUTED, 'mt-6 text-[13.5px] leading-relaxed')}>
                    Procura também na pasta de spam ou promoções. Se o email estiver errado, <button type="button" onClick={() => { setSentTo(null); setResent(false) }} className="font-semibold text-[color:var(--lp-accent)] hover:underline">volta atrás</button>.
                </p>
            </AuthShell>
        )
    }

    return (
        <AuthShell>
            <AuthTitle title="Cria a tua conta" text="Começa grátis. O teu primeiro brandbook fica pronto em minutos." />

            {GOOGLE_AUTH_ENABLED && (
                <>
                    <AuthButton type="button" variant="ghost" loading={loading === 'google'} disabled={!!loading} onClick={signUpWithGoogle}>
                        {loading !== 'google' && <GoogleIcon />} Continuar com Google
                    </AuthButton>
                    <Divider>ou com email</Divider>
                </>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <span className="block text-[13.5px] font-medium mb-2">Como vais usar o Brivio?</span>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de conta">
                        {ACCOUNT_TYPES.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                role="radio"
                                aria-checked={accountType === t.id}
                                onClick={() => setAccountType(t.id)}
                                className={cn(
                                    'relative h-[78px] rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-semibold transition-colors',
                                    accountType === t.id ? 'border-[color:var(--lp-accent)] text-[color:var(--lp-accent)] bg-[color:var(--lp-accent-soft)]' : 'border-[color:var(--lp-line-strong)] text-[color:var(--lp-muted)] hover:bg-[color:var(--lp-surface)]'
                                )}
                            >
                                <t.icon className="w-5 h-5" />
                                <span className="text-center leading-tight px-1">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <AuthField label="Nome" name="name" autoComplete="name" placeholder="O teu nome" required autoFocus maxLength={80} />
                <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="nome@exemplo.com" required />
                <PasswordField label="Palavra-passe" name="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPassword(e.target.value)}>
                    <span className="mt-2 flex items-center gap-2">
                        <span className="flex-1 grid grid-cols-4 gap-1">
                            {[1, 2, 3, 4].map(i => (
                                <motion.span
                                    key={i}
                                    animate={{ backgroundColor: strength.score >= i ? (['', '#E5252A', '#F59E0B', '#22C55E', '#059669'][strength.score]) : 'var(--lp-line-strong)' }}
                                    className="h-1 rounded-full"
                                />
                            ))}
                        </span>
                        <span className={cn(AUTH_MUTED, 'text-[12px] w-[64px] text-right')}>{password ? strength.label : `Mín. ${MIN_PASSWORD}`}</span>
                    </span>
                </PasswordField>
                {error && <AuthAlert>{error}</AuthAlert>}
                <AuthButton type="submit" loading={loading === 'email'} disabled={!!loading}>Criar conta</AuthButton>
                <p className={cn(AUTH_MUTED, 'text-[12.5px] text-center leading-relaxed')}>Plano gratuito, sem compromisso. Podes mudar de plano quando quiseres.</p>
            </form>

            <p className={cn(AUTH_MUTED, 'mt-8 text-center text-[14px]')}>
                Já tens conta?{" "}
                <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-semibold text-[color:var(--lp-accent)] hover:underline">Entrar</Link>
            </p>
        </AuthShell>
    )
}
