/**
 * Small helpers shared by the sign-in, sign-up and password pages (client and server).
 */

/** Where to go after signing in: only paths inside the app (never another site) */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
    if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
    // The auth pages themselves are not a destination
    if (/^\/(login|register|forgot-password|auth\/)/.test(next)) return fallback
    return next
}

/** Supabase Auth messages, in the language of the app */
export function authErrorMessage(error: { message?: string, code?: string, status?: number } | null | undefined): string {
    if (!error) return ''
    const code = error.code || ''
    const msg = (error.message || '').toLowerCase()

    if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Email ou palavra-passe incorretos.'
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'Ainda não confirmaste o teu email. Procura a mensagem que te enviámos.'
    if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return 'Já existe uma conta com este email. Entra ou recupera a palavra-passe.'
    if (code === 'weak_password' || msg.includes('password should be')) return 'A palavra-passe é demasiado fraca. Usa pelo menos 8 caracteres, com letras e números.'
    if (code === 'same_password' || msg.includes('different from the old')) return 'A nova palavra-passe tem de ser diferente da anterior.'
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429 || msg.includes('rate limit')) return 'Demasiadas tentativas seguidas. Espera um pouco e tenta de novo.'
    if (code === 'email_address_invalid' || msg.includes('invalid email') || msg.includes('unable to validate email')) return 'Este endereço de email não é válido.'
    if (code === 'signup_disabled' || msg.includes('signups not allowed')) return 'De momento não é possível criar novas contas.'
    if (code === 'otp_expired' || msg.includes('expired')) return 'Este link expirou. Pede um novo.'
    if (code === 'provider_disabled' || msg.includes('provider is not enabled')) return 'Este método de entrada não está disponível.'
    if (msg.includes('failed to fetch') || msg.includes('network')) return 'Sem ligação ao servidor. Verifica a tua internet e tenta de novo.'
    return 'Algo correu mal. Tenta de novo dentro de momentos.'
}

/** Password strength 0–4 and its label */
export function passwordStrength(pw: string): { score: number, label: string } {
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
    else if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 0.5
    const s = Math.min(4, Math.floor(score))
    return { score: pw ? Math.max(1, s) : 0, label: ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][pw ? Math.max(1, s) : 0] }
}

export const MIN_PASSWORD = 8

/** Whether «Continuar com Google» is offered (the provider must be enabled in Supabase first) */
export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === 'true'
