"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Building2, Sparkles, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { completeOnboarding } from "@/app/actions/onboarding"
import { AuthAlert, AuthButton, AuthField, AuthShell, AuthTitle, AUTH_MUTED } from "@/components/auth/AuthShell"

type WorkspaceType = 'personal' | 'agency' | 'company'
const TYPES: { id: WorkspaceType, label: string, text: string, icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'personal', label: 'Só eu', text: 'Freelancer ou criativo', icon: User },
    { id: 'agency', label: 'Estúdio ou agência', text: 'Marcas de vários clientes', icon: Users },
    { id: 'company', label: 'Empresa', text: 'A marca da minha empresa', icon: Building2 },
]

export default function OnboardingFlow({ firstName, initialType, next }: { firstName: string, initialType: WorkspaceType, next: string }) {
    const [step, setStep] = React.useState<1 | 2>(1)
    const [type, setType] = React.useState<WorkspaceType>(initialType)
    const [workspaceName, setWorkspaceName] = React.useState(initialType === 'personal' && firstName ? `Estúdio ${firstName}` : '')
    const [brandName, setBrandName] = React.useState('')
    const [pending, startTransition] = React.useTransition()
    const [error, setError] = React.useState<string | null>(null)

    const finish = (withBrand: boolean) => {
        setError(null)
        const form = new FormData()
        form.append('workspaceName', workspaceName)
        form.append('workspaceType', type)
        form.append('brandName', withBrand ? brandName : '')
        form.append('next', next)
        startTransition(async () => {
            const result = await completeOnboarding(form)
            if (result?.error) setError(result.error)
        })
    }

    return (
        <AuthShell aside={false} wide>
            {/* Progress */}
            <div className="mb-10 flex items-center gap-3">
                {[1, 2].map(i => (
                    <div key={i} className="flex-1 h-1.5 rounded-full bg-[color:var(--lp-surface)] overflow-hidden">
                        <motion.div className="h-full bg-[color:var(--lp-accent)]" initial={false} animate={{ width: step >= i ? '100%' : '0%' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                ))}
                <span className={cn(AUTH_MUTED, 'text-[12.5px] tabular-nums')}>{step}/2</span>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                        <AuthTitle title={firstName ? `Olá, ${firstName}! Vamos preparar o teu espaço.` : 'Vamos preparar o teu espaço.'} text="É aqui que vão viver as tuas marcas, ficheiros e projetos." />
                        <form onSubmit={(e) => { e.preventDefault(); if (workspaceName.trim()) setStep(2) }} className="space-y-6">
                            <div>
                                <span className="block text-[13.5px] font-medium mb-2">Para quem é?</span>
                                <div className="grid sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Tipo de espaço">
                                    {TYPES.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={type === t.id}
                                            onClick={() => setType(t.id)}
                                            className={cn(
                                                'text-left rounded-2xl border p-4 transition-colors',
                                                type === t.id ? 'border-[color:var(--lp-accent)] bg-[color:var(--lp-accent-soft)]' : 'border-[color:var(--lp-line-strong)] hover:bg-[color:var(--lp-surface)]'
                                            )}
                                        >
                                            <t.icon className={cn('w-5 h-5', type === t.id ? 'text-[color:var(--lp-accent)]' : 'text-[color:var(--lp-muted)]')} />
                                            <span className="block mt-3 text-[14px] font-semibold">{t.label}</span>
                                            <span className={cn(AUTH_MUTED, 'block mt-0.5 text-[12.5px]')}>{t.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <AuthField
                                label="Nome do espaço de trabalho"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder={type === 'company' ? 'Nome da empresa' : type === 'agency' ? 'Nome do estúdio ou agência' : 'Estúdio Aurora'}
                                required
                                autoFocus
                                maxLength={80}
                                hint="Podes mudar o nome mais tarde nas definições."
                            />
                            <AuthButton type="submit" disabled={!workspaceName.trim()}>Continuar <ArrowRight className="w-4 h-4" /></AuthButton>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                        <AuthTitle title="Qual é a primeira marca?" text="Pode ser a tua ou a de um cliente. Depois crias o brandbook dela a partir de um template." />
                        <form onSubmit={(e) => { e.preventDefault(); if (brandName.trim()) finish(true) }} className="space-y-4">
                            <AuthField label="Nome da marca" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ex.: Aurora" autoFocus maxLength={80} />
                            {error && <AuthAlert>{error}</AuthAlert>}
                            <AuthButton type="submit" loading={pending} disabled={!brandName.trim()}>
                                {!pending && <Sparkles className="w-4 h-4" />} Criar e entrar
                            </AuthButton>
                            <div className="flex items-center justify-between pt-1">
                                <button type="button" onClick={() => setStep(1)} disabled={pending} className={cn(AUTH_MUTED, 'inline-flex items-center gap-1.5 text-[14px] font-medium hover:text-[color:var(--lp-text)]')}>
                                    <ArrowLeft className="w-4 h-4" /> Voltar
                                </button>
                                <button type="button" onClick={() => finish(false)} disabled={pending} className={cn(AUTH_MUTED, 'text-[14px] font-medium hover:text-[color:var(--lp-text)]')}>
                                    Fazer isto mais tarde
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthShell>
    )
}
