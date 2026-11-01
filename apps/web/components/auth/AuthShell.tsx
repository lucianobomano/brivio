'use client'

/**
 * Frame of the sign-in, sign-up, password and onboarding pages: the form on the left, a Brivio panel on the
 * right (large screens), in the same light / dark theme as the landing page.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEME_SCRIPT, ThemeToggle, useLandingTheme } from '@/components/landing/theme'

export const AUTH_HEADING = 'font-[family-name:var(--font-inter-tight)] tracking-[-0.03em]'
export const AUTH_MUTED = 'text-[color:var(--lp-muted)]'

const Logo = () => (
    <span className="relative inline-block" style={{ width: 88, height: 26 }}>
        <Image src="/brand/logo-light.png" alt="Brivio" width={88} height={26} priority className="lp-logo-on-light h-full w-auto" />
        <Image src="/brand/logo-dark.png" alt="Brivio" width={88} height={26} priority className="lp-logo-on-dark h-full w-auto" />
    </span>
)

export function AuthShell({ children, aside = true, wide = false }: { children: React.ReactNode, aside?: boolean, wide?: boolean }) {
    const { theme, toggle } = useLandingTheme()
    return (
        <div className="lp min-h-screen font-sans antialiased" data-theme={theme} suppressHydrationWarning>
            <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
            <div className={cn('min-h-screen grid', aside && 'lg:grid-cols-[1fr_1.05fr]')}>
                {/* Form side */}
                <div className="flex flex-col px-5 sm:px-10 py-6">
                    <header className="flex items-center justify-between">
                        <Link href="/" aria-label="Brivio — início"><Logo /></Link>
                        <ThemeToggle theme={theme} onToggle={toggle} />
                    </header>
                    <main className="flex-1 flex items-center justify-center py-10">
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className={cn('w-full', wide ? 'max-w-[560px]' : 'max-w-[400px]')}
                        >
                            {children}
                        </motion.div>
                    </main>
                    <footer className="text-[12px] text-[color:var(--lp-faint)] flex justify-between gap-4">
                        <span>© {new Date().getFullYear()} Brivio</span>
                        <a href="mailto:hello@brivio.com" className="hover:text-[color:var(--lp-text)]">Precisas de ajuda?</a>
                    </footer>
                </div>

                {/* Brivio panel */}
                {aside && (
                    <div className="hidden lg:block p-4">
                        <div className="relative h-full min-h-[600px] rounded-[28px] overflow-hidden bg-[#0E0F12] text-white flex flex-col justify-between p-12">
                            <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 0% 0%, rgba(255,0,84,0.35), transparent 60%), radial-gradient(60% 60% at 100% 10%, rgba(49,28,153,0.45), transparent 60%), radial-gradient(70% 60% at 60% 110%, rgba(6,214,160,0.28), transparent 60%)' }} />
                            <div aria-hidden className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />
                            <motion.div initial={{ rotate: -90, scale: 0.7, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} className="relative">
                                <Image src="/brivio-circle-logo.png" alt="" aria-hidden width={56} height={56} />
                            </motion.div>
                            <div className="relative">
                                <p className={cn(AUTH_HEADING, 'text-[44px] xl:text-[52px] leading-[1.02] font-semibold max-w-[520px]')}>
                                    O brandbook da tua marca, vivo e sempre atualizado.
                                </p>
                                <ul className="mt-8 space-y-3 text-[15px] text-white/80">
                                    {['Mais de 450 secções prontas para o teu brandbook', 'Ficheiros, projetos e propostas no mesmo sítio', 'Partilha por link, sempre na versão mais recente'].map((t, i) => (
                                        <motion.li key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-[#FF0054] flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>
                                            {t}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// Form pieces
// ---------------------------------------------------------------------------------------------

export const AuthTitle = ({ title, text }: { title: string, text?: React.ReactNode }) => (
    <div className="mb-8">
        <h1 className={cn(AUTH_HEADING, 'text-[32px] leading-[1.08] font-semibold')}>{title}</h1>
        {text && <p className={cn(AUTH_MUTED, 'mt-2.5 text-[15px] leading-relaxed')}>{text}</p>}
    </div>
)

const INPUT = 'w-full h-12 px-4 rounded-xl bg-[color:var(--lp-bg-2)] border border-[color:var(--lp-line-strong)] text-[15px] text-[color:var(--lp-text)] placeholder:text-[color:var(--lp-faint)] outline-none transition-shadow focus:border-[color:var(--lp-accent)] focus:shadow-[0_0_0_4px_var(--lp-accent-soft)]'

export const AuthField = ({ label, hint, aside, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, hint?: React.ReactNode, aside?: React.ReactNode }) => (
    <label className="block">
        <span className="flex items-center justify-between mb-2">
            <span className="text-[13.5px] font-medium">{label}</span>
            {aside}
        </span>
        <input {...props} className={cn(INPUT, props.className)} />
        {hint && <span className={cn(AUTH_MUTED, 'block mt-1.5 text-[12.5px]')}>{hint}</span>}
    </label>
)

export const PasswordField = ({ label, aside, children, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, aside?: React.ReactNode, children?: React.ReactNode }) => {
    const [show, setShow] = useState(false)
    return (
        <label className="block">
            <span className="flex items-center justify-between mb-2">
                <span className="text-[13.5px] font-medium">{label}</span>
                {aside}
            </span>
            <span className="relative block">
                <input {...props} type={show ? 'text' : 'password'} className={cn(INPUT, 'pr-12')} />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    aria-label={show ? 'Esconder a palavra-passe' : 'Mostrar a palavra-passe'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-[color:var(--lp-faint)] hover:text-[color:var(--lp-text)]"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </span>
            {children}
        </label>
    )
}

export const AuthButton = ({ loading, children, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean, variant?: 'primary' | 'ghost' }) => (
    <button
        {...props}
        disabled={loading || props.disabled}
        aria-busy={loading || undefined}
        className={cn(
            'w-full h-12 rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed',
            variant === 'primary'
                ? 'bg-[color:var(--lp-accent)] text-white shadow-[0_8px_24px_rgba(255,0,84,0.25)] hover:shadow-[0_12px_32px_rgba(255,0,84,0.35)] hover:-translate-y-0.5 disabled:hover:translate-y-0'
                : 'border border-[color:var(--lp-line-strong)] hover:bg-[color:var(--lp-surface)]',
            props.className
        )}
    >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
    </button>
)

export const AuthAlert = ({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info', children: React.ReactNode }) => (
    <div
        role={kind === 'error' ? 'alert' : 'status'}
        className={cn(
            'rounded-xl px-4 py-3 text-[14px] leading-relaxed border',
            kind === 'error' && 'bg-[rgba(229,37,42,0.08)] border-[rgba(229,37,42,0.25)] text-[#D92D20]',
            kind === 'success' && 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.25)] text-[#059669]',
            kind === 'info' && 'bg-[color:var(--lp-surface)] border-[color:var(--lp-line)] text-[color:var(--lp-text)]'
        )}
    >
        {children}
    </div>
)

export const Divider = ({ children }: { children: React.ReactNode }) => (
    <div className="relative my-6 flex items-center">
        <span className="flex-1 border-t border-[color:var(--lp-line)]" />
        <span className={cn(AUTH_MUTED, 'px-3 text-[12px]')}>{children}</span>
        <span className="flex-1 border-t border-[color:var(--lp-line)]" />
    </div>
)

export const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
)
