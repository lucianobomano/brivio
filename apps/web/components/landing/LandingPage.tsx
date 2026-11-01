'use client'

/**
 * Brivio landing page. Light by default (dark on request, remembered per visitor); clean and quiet.
 * It answers, in this order: what Brivio is and for whom (hero, with a live demo of a brandbook), the pains it
 * solves, how it works, what it does, who it is for, what it costs (same plans as /pricing) and the doubts left.
 * Everything shown is something the product does today.
 */

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
    ArrowRight, ArrowUpRight, BookOpen, Briefcase, Building2, Check, ChevronDown, Copy, FileText, FolderOpen,
    KanbanSquare, Layers, Link2, Lock, Menu, Plus, Shuffle, Sparkles, User, Users, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLANS, type Plan, type PlanTier } from '@/lib/pricing-plans'
import EditorDemo from './EditorDemo'
import { THEME_SCRIPT, ThemeToggle, useLandingTheme, type Theme } from './theme'
import Comparison from './Comparison'

// ---------------------------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------------------------

const HEADING = 'font-[family-name:var(--font-inter-tight)] tracking-[-0.035em]'
const MUTED = 'text-[color:var(--lp-muted)]'
const FAINT = 'text-[color:var(--lp-faint)]'
const CARD = 'bg-[color:var(--lp-bg-2)] border border-[color:var(--lp-line)] shadow-[var(--lp-shadow)]'

const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
    >
        {children}
    </motion.div>
)

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--lp-accent)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--lp-accent)]" />
        {children}
    </span>
)

const SectionTitle = ({ eyebrow, title, text, center = false }: { eyebrow: string, title: React.ReactNode, text?: string, center?: boolean }) => (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className={cn(HEADING, 'mt-4 text-[34px] md:text-[48px] leading-[1.05] font-semibold')}>{title}</h2>
        {text && <p className={cn(MUTED, 'mt-5 text-[17px] md:text-[18px] leading-relaxed')}>{text}</p>}
    </Reveal>
)

/** Official Brivio logos (public/brand): the black one on the light theme, the white one on the dark theme */
const LOGO = { onLight: '/brand/logo-light.png', onDark: '/brand/logo-dark.png', ratio: 1024 / 304 }
const SYMBOL = '/brivio-circle-logo.png'

const Wordmark = ({ height = 26, priority = false }: { height?: number, priority?: boolean }) => {
    const width = Math.round(height * LOGO.ratio)
    return (
        <span className="relative inline-block" style={{ width, height }}>
            <Image src={LOGO.onLight} alt="Brivio" width={width} height={height} priority={priority} className="lp-logo-on-light h-full w-auto" />
            <Image src={LOGO.onDark} alt="Brivio" width={width} height={height} priority={priority} className="lp-logo-on-dark h-full w-auto" />
        </span>
    )
}

/** The Brivio symbol (the ring) */
const BrandSymbol = ({ size = 24, className }: { size?: number, className?: string }) => (
    <Image src={SYMBOL} alt="" aria-hidden width={size} height={size} className={className} />
)

const PrimaryButton = ({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) => (
    <Link
        href={href}
        className={cn(
            'group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-[color:var(--lp-accent)] text-white text-[15px] font-semibold',
            'shadow-[0_8px_24px_rgba(255,0,84,0.25)] hover:shadow-[0_12px_32px_rgba(255,0,84,0.35)] hover:-translate-y-0.5 transition-all duration-300',
            className
        )}
    >
        {children}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
)

const GhostButton = ({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) => (
    <Link
        href={href}
        className={cn(
            'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-[color:var(--lp-line-strong)] text-[15px] font-semibold',
            'hover:bg-[color:var(--lp-surface)] transition-colors',
            className
        )}
    >
        {children}
    </Link>
)

// ---------------------------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------------------------

const NAV = [
    { href: '#como-funciona', label: 'Como funciona' },
    { href: '#produto', label: 'Produto' },
    { href: '#comparar', label: 'Comparar' },
    { href: '#para-quem', label: 'Para quem' },
    { href: '#precos', label: 'Preços' },
    { href: '#faq', label: 'FAQ' },
]

const Header = ({ theme, onToggle }: { theme: Theme, onToggle: () => void }) => {
    const [scrolled, setScrolled] = useState(false)
    const [open, setOpen] = useState(false)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header
            className={cn(
                'fixed top-0 inset-x-0 z-50 transition-all duration-300',
                scrolled || open ? 'bg-[color:color-mix(in_srgb,var(--lp-bg)_82%,transparent)] backdrop-blur-xl border-b border-[color:var(--lp-line)]' : 'border-b border-transparent'
            )}
        >
            <div className="max-w-6xl mx-auto px-5 md:px-6 h-16 flex items-center gap-6">
                <Link href="/" aria-label="Brivio — início" className="shrink-0"><Wordmark priority /></Link>
                <nav className="hidden md:flex items-center gap-1 mx-auto">
                    {NAV.map(n => (
                        <a key={n.href} href={n.href} className={cn(MUTED, 'px-3 py-2 rounded-full text-[14px] font-medium hover:text-[color:var(--lp-text)] hover:bg-[color:var(--lp-surface)] transition-colors')}>
                            {n.label}
                        </a>
                    ))}
                </nav>
                <div className="ml-auto md:ml-0 flex items-center gap-3">
                    <ThemeToggle theme={theme} onToggle={onToggle} />
                    <Link href="/login" className={cn(MUTED, 'hidden sm:inline text-[14px] font-medium hover:text-[color:var(--lp-text)] transition-colors')}>Entrar</Link>
                    <Link
                        href="/register"
                        className="hidden sm:inline-flex h-9 px-4 items-center rounded-full bg-[color:var(--lp-invert-bg)] text-[color:var(--lp-invert-text)] text-[14px] font-semibold hover:opacity-85 transition-opacity"
                    >
                        Começar grátis
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
                        aria-expanded={open}
                        className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-[color:var(--lp-surface)]"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.nav
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden overflow-hidden px-5"
                    >
                        <div className="py-3 flex flex-col">
                            {NAV.map(n => (
                                <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-3 text-[16px] font-medium border-b border-[color:var(--lp-line)]">{n.label}</a>
                            ))}
                            <div className="flex gap-3 pt-4 pb-2">
                                <GhostButton href="/login" className="flex-1 h-11">Entrar</GhostButton>
                                <Link href="/register" className="flex-1 h-11 inline-flex items-center justify-center rounded-full bg-[color:var(--lp-accent)] text-white font-semibold">Começar grátis</Link>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    )
}

// ---------------------------------------------------------------------------------------------
// Hero, with a live brandbook the visitor can play with
// ---------------------------------------------------------------------------------------------

/** Tilts back a little and straightens as it scrolls into view */
const EditorStage = ({ children }: { children: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null)
    const reduced = useReducedMotion()
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 35%'] })
    const rotateX = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 14, 0])
    const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 0.94, 1])
    return (
        <div ref={ref} style={{ perspective: 1600 }}>
            <motion.div style={{ rotateX, scale, transformOrigin: 'center top' }}>{children}</motion.div>
        </div>
    )
}

const Hero = () => (
    <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 px-5 md:px-6 overflow-hidden">
        {/* Soft background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[color:var(--lp-accent)] opacity-[0.06] blur-[120px]" />
            <div
                className="absolute inset-0 opacity-[0.5]"
                style={{ backgroundImage: 'radial-gradient(var(--lp-line-strong) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse at top, black 15%, transparent 60%)', WebkitMaskImage: 'radial-gradient(ellipse at top, black 15%, transparent 60%)' }}
            />
        </div>

        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3.5 rounded-full border border-[color:var(--lp-line-strong)] bg-[color:var(--lp-bg-2)] text-[13px] font-medium">
                    <span className="h-5 px-2 rounded-full bg-[color:var(--lp-accent-soft)] text-[color:var(--lp-accent)] text-[11px] font-semibold flex items-center">Novo</span>
                    Mais de 450 secções prontas para o teu brandbook
                </span>
            </motion.div>
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={cn(HEADING, 'mt-7 text-[44px] sm:text-[64px] lg:text-[80px] leading-[0.98] font-semibold')}
            >
                O brandbook da tua marca, <span className="text-[color:var(--lp-accent)]">vivo</span> e sempre atualizado.
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className={cn(MUTED, 'mt-6 text-[18px] md:text-[20px] leading-relaxed max-w-2xl')}
            >
                O Brivio junta num só sítio o guia de marca, os ficheiros e os projetos de cada cliente.
                Cria um brandbook interativo em minutos e partilha-o por link.
            </motion.p>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="mt-9 flex flex-col sm:flex-row gap-3"
            >
                <PrimaryButton href="/register">Começar grátis</PrimaryButton>
                <GhostButton href="#como-funciona">Ver como funciona</GhostButton>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={cn(FAINT, 'mt-5 text-[13px]')}>
                Plano gratuito com 2 brandbooks e 3 projetos · Muda de plano quando precisares
            </motion.p>
        </div>

        {/* The editor, playable, in a soft frame with the Brivio colours */}
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-6xl mx-auto mt-16 md:mt-20"
        >
            <EditorStage>
                <div className="relative rounded-[28px] md:rounded-[36px] p-3 sm:p-5 md:p-10 pt-14 md:pt-16 overflow-hidden">
                    <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{ background: 'radial-gradient(120% 90% at 0% 0%, rgba(255,0,84,0.28), transparent 55%), radial-gradient(100% 90% at 100% 0%, rgba(49,28,153,0.26), transparent 55%), radial-gradient(120% 100% at 50% 110%, rgba(6,214,160,0.26), transparent 60%), var(--lp-surface)' }}
                    />
                    <div className="absolute top-4 md:top-5 inset-x-0 flex justify-center">
                        <span className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-[color:var(--lp-bg-2)] text-[12.5px] font-semibold shadow-[var(--lp-shadow)]">
                            <BrandSymbol size={14} /> Experimenta o editor: escreve nos textos, usa «Editar secção» e «+ Add Section»
                        </span>
                    </div>
                    <div className="relative">
                        <EditorDemo />
                    </div>
                </div>
            </EditorStage>
        </motion.div>
    </section>
)

// ---------------------------------------------------------------------------------------------
// Pains: before / with Brivio
// ---------------------------------------------------------------------------------------------

const PAINS = [
    {
        icon: FileText,
        before: { title: 'O guia da marca é um PDF esquecido', text: 'Cada alteração obriga a exportar e reenviar. Ninguém sabe qual é a versão certa.' },
        after: { title: 'Um brandbook vivo, num link', text: 'Mudas uma cor ou uma regra e toda a gente vê a versão nova, no mesmo endereço.' },
    },
    {
        icon: FolderOpen,
        before: { title: 'Os ficheiros andam perdidos', text: 'Logótipos em emails, fotografias em pastas soltas, versões antigas a circular.' },
        after: { title: 'Os ficheiros da marca organizados', text: 'Pastas por marca e links de partilha com palavra-passe e data de expiração.' },
    },
    {
        icon: Shuffle,
        before: { title: 'Cada um usa a marca à sua maneira', text: 'Cores aproximadas, letras trocadas, logótipos esticados. A marca perde força.' },
        after: { title: 'Regras claras para todos', text: 'Usos corretos e incorretos, tom de voz e exemplos, explicados com imagens.' },
    },
]

const Pains = () => {
    const [after, setAfter] = useState(false)
    return (
        <section className="px-5 md:px-6 py-24 md:py-32 border-t border-[color:var(--lp-line)]">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <SectionTitle
                        eyebrow="O problema"
                        title={after ? <>Com o Brivio, a marca fica <span className="text-[color:var(--lp-accent)]">num só sítio</span>.</> : 'Soa familiar?'}
                        text="Gerir uma marca com PDFs, pastas e emails dá trabalho e cria erros. Vê a diferença."
                    />
                    <Reveal>
                        <div className="relative inline-flex p-1 rounded-full bg-[color:var(--lp-surface)] border border-[color:var(--lp-line)]" role="tablist">
                            {[{ v: false, l: 'Antes' }, { v: true, l: 'Com o Brivio' }].map(o => (
                                <button
                                    key={o.l}
                                    type="button"
                                    role="tab"
                                    aria-selected={after === o.v}
                                    onClick={() => setAfter(o.v)}
                                    className={cn('relative h-10 px-5 rounded-full text-[14px] font-semibold transition-colors', after === o.v ? (o.v ? 'text-white' : '') : MUTED)}
                                >
                                    {after === o.v && (
                                        <motion.span
                                            layoutId="pain-toggle"
                                            className={cn('absolute inset-0 rounded-full', o.v ? 'bg-[color:var(--lp-accent)]' : 'bg-[color:var(--lp-bg-2)] shadow-sm')}
                                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        />
                                    )}
                                    <span className="relative">{o.l}</span>
                                </button>
                            ))}
                        </div>
                    </Reveal>
                </div>

                <div className="mt-14 grid md:grid-cols-3 gap-5">
                    {PAINS.map((p, i) => {
                        const c = after ? p.after : p.before
                        return (
                            <Reveal key={i} delay={i * 0.08}>
                                <div className={cn(CARD, 'h-full rounded-[20px] p-7 transition-colors duration-500', after && 'border-[color:rgba(255,0,84,0.3)]')}>
                                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-500', after ? 'bg-[color:var(--lp-accent)] text-white' : 'bg-[color:var(--lp-surface)] text-[color:var(--lp-muted)]')}>
                                        {after ? <Check className="w-5 h-5" /> : <p.icon className="w-5 h-5" />}
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={String(after)}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.25, delay: i * 0.04 }}
                                        >
                                            <h3 className={cn(HEADING, 'mt-6 text-[21px] font-semibold leading-snug')}>{c.title}</h3>
                                            <p className={cn(MUTED, 'mt-3 text-[15px] leading-relaxed')}>{c.text}</p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </Reveal>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ---------------------------------------------------------------------------------------------
// How it works: three steps, each with its own little scene
// ---------------------------------------------------------------------------------------------

const STEP_MS = 6000

const StepTemplates = () => {
    const covers = [
        { name: 'Antimatéria', bg: '#0E0F12', fg: '#FFFFFF', dot: '#FF0054' },
        { name: 'Guidy', bg: '#0B0B0B', fg: '#FFFFFF', dot: '#FF0054' },
        { name: 'Editorial', bg: '#F3EFE7', fg: '#1C1A17', dot: '#C2410C' },
        { name: 'Tech & SaaS', bg: '#E8FBF4', fg: '#06281D', dot: '#06D6A0' },
    ]
    return (
        <div className="grid grid-cols-2 gap-3">
            {covers.map((c, i) => (
                <motion.div
                    key={c.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, scale: i === 1 ? [1, 1, 1.04, 1.02] : 1 }}
                    transition={{ delay: i * 0.08, duration: i === 1 ? 1.6 : 0.4 }}
                    className={cn('relative aspect-[4/3] rounded-xl p-3 flex flex-col justify-between overflow-hidden', i === 1 && 'ring-2 ring-[color:var(--lp-accent)] ring-offset-2 ring-offset-[color:var(--lp-bg-2)]')}
                    style={{ background: c.bg, color: c.fg }}
                >
                    {c.name === 'Guidy' ? <BrandSymbol size={14} /> : <span className="w-3 h-3 rounded-full" style={{ background: c.dot }} />}
                    <span className="text-[13px] font-semibold">{c.name}</span>
                    {i === 1 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-[#FF0054] flex items-center justify-center">
                            <Check className="w-3 h-3" />
                        </motion.span>
                    )}
                </motion.div>
            ))}
        </div>
    )
}

const StepBlocks = () => {
    const blocks = ['Logótipo', 'Paleta de cores', 'Tipografia', 'Tom de voz']
    return (
        <div className="space-y-2.5">
            {blocks.map((b, i) => (
                <motion.div
                    key={b}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.35, duration: 0.4 }}
                    className="h-12 px-4 rounded-xl bg-[color:var(--lp-surface)] flex items-center gap-3"
                >
                    <span className="w-6 h-6 rounded-md bg-[color:var(--lp-accent-soft)] text-[color:var(--lp-accent)] flex items-center justify-center"><Layers className="w-3.5 h-3.5" /></span>
                    <span className="text-[14px] font-medium">{b}</span>
                    <span className={cn(FAINT, 'ml-auto text-[11px]')}>Secção</span>
                </motion.div>
            ))}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="h-12 rounded-xl border border-dashed border-[color:var(--lp-accent)] text-[color:var(--lp-accent)] flex items-center justify-center gap-2 text-[13px] font-semibold"
            >
                <Plus className="w-4 h-4" /> Adicionar secção
            </motion.div>
        </div>
    )
}

const StepShare = () => (
    <div className="space-y-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-[color:var(--lp-surface)] p-4">
            <span className={cn(FAINT, 'text-[11px] font-semibold uppercase tracking-wider')}>Link do brandbook</span>
            <div className="mt-2 h-11 pl-3 pr-1.5 rounded-lg bg-[color:var(--lp-bg-2)] border border-[color:var(--lp-line)] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[color:var(--lp-accent)] shrink-0" />
                <span className="text-[13px] font-medium truncate">o-teu-brandbook · link partilhável</span>
                <motion.span
                    initial={{ backgroundColor: 'rgba(255,0,84,0)', color: 'var(--lp-text)' }}
                    animate={{ backgroundColor: 'rgba(255,0,84,1)', color: '#ffffff' }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                    className="ml-auto h-8 px-3 rounded-md text-[12px] font-semibold flex items-center gap-1.5"
                >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                </motion.span>
            </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl bg-[color:var(--lp-surface)] p-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[color:var(--lp-accent)] text-white flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
            <div className="min-w-0">
                <p className="text-[14px] font-semibold">Cor principal atualizada</p>
                <p className={cn(MUTED, 'text-[12px]')}>Quem abrir o link já vê a versão nova.</p>
            </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-xl bg-[color:var(--lp-surface)] p-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[color:var(--lp-bg-2)] border border-[color:var(--lp-line)] flex items-center justify-center"><Lock className="w-4 h-4" /></span>
            <div className="min-w-0">
                <p className="text-[14px] font-semibold">Ficheiros com palavra-passe</p>
                <p className={cn(MUTED, 'text-[12px]')}>E com data de expiração, se quiseres.</p>
            </div>
        </motion.div>
    </div>
)

const STEPS = [
    { title: 'Escolhe um template', text: 'Começa com um brandbook pronto, feito por designers, ou parte de uma página em branco.', scene: StepTemplates },
    { title: 'Personaliza com blocos', text: 'Junta as secções que precisas — logótipo, cores, tipografia, tom de voz, mockups — e ajusta tudo no editor visual.', scene: StepBlocks },
    { title: 'Partilha e mantém atualizado', text: 'Envia o link ao cliente e à equipa. Cada alteração aparece logo, sem exportar nem reenviar nada.', scene: StepShare },
]

const HowItWorks = () => {
    const [step, setStep] = useState(0)
    const [auto, setAuto] = useState(true)
    const reduced = useReducedMotion()
    useEffect(() => {
        if (!auto || reduced) return
        const id = window.setTimeout(() => setStep(s => (s + 1) % STEPS.length), STEP_MS)
        return () => window.clearTimeout(id)
    }, [step, auto, reduced])
    const Scene = STEPS[step].scene

    return (
        <section id="como-funciona" className="px-5 md:px-6 py-24 md:py-32 bg-[color:var(--lp-bg-2)] border-y border-[color:var(--lp-line)] scroll-mt-16">
            <div className="max-w-6xl mx-auto">
                <SectionTitle eyebrow="Como funciona" title="Do zero ao brandbook partilhado em três passos." />
                <div className="mt-14 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div className="space-y-3">
                        {STEPS.map((s, i) => (
                            <button
                                key={s.title}
                                type="button"
                                onClick={() => { setStep(i); setAuto(false) }}
                                className={cn(
                                    'w-full text-left rounded-2xl p-5 md:p-6 transition-all duration-300 border',
                                    step === i ? 'bg-[color:var(--lp-bg)] border-[color:var(--lp-line-strong)] shadow-[var(--lp-shadow)]' : 'border-transparent hover:bg-[color:var(--lp-surface)]'
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <span className={cn(
                                        'w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-semibold transition-colors',
                                        step === i ? 'bg-[color:var(--lp-accent)] text-white' : 'bg-[color:var(--lp-surface)] text-[color:var(--lp-muted)]'
                                    )}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={cn(HEADING, 'text-[20px] font-semibold', step !== i && 'text-[color:var(--lp-muted)]')}>{s.title}</h3>
                                        <AnimatePresence initial={false}>
                                            {step === i && (
                                                <motion.p
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className={cn(MUTED, 'overflow-hidden text-[15px] leading-relaxed')}
                                                >
                                                    <span className="block pt-2">{s.text}</span>
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                        {step === i && auto && !reduced && (
                                            <div className="mt-4 h-[3px] rounded-full bg-[color:var(--lp-surface)] overflow-hidden">
                                                <div key={step} className="h-full bg-[color:var(--lp-accent)] origin-left" style={{ animation: `lp-step ${STEP_MS}ms linear forwards` }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className={cn(CARD, 'rounded-[24px] p-6 md:p-8 min-h-[360px] flex flex-col justify-center')}>
                        <AnimatePresence mode="wait">
                            <motion.div key={step} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
                                <Scene />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ---------------------------------------------------------------------------------------------
// What it does: bento with a light that follows the pointer
// ---------------------------------------------------------------------------------------------

const Spotlight = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const ref = useRef<HTMLDivElement>(null)
    return (
        <div
            ref={ref}
            onPointerMove={(e) => {
                const r = ref.current?.getBoundingClientRect()
                if (!r || !ref.current) return
                ref.current.style.setProperty('--x', `${e.clientX - r.left}px`)
                ref.current.style.setProperty('--y', `${e.clientY - r.top}px`)
            }}
            className={cn(CARD, 'group relative rounded-[24px] overflow-hidden', className)}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), var(--lp-accent-soft), transparent 60%)' }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    )
}

/** Files a brand lives on: artwork, print, documents, fonts (top row) and images, video, audio, packages (bottom) */
const FILE_FORMAT_ROWS: { ext: string, bg: string }[][] = [
    [
        { ext: '.svg', bg: '#06D6A0' }, { ext: '.ai', bg: '#FF7A00' }, { ext: '.eps', bg: '#6E2BB8' }, { ext: '.pdf', bg: '#E5252A' },
        { ext: '.psd', bg: '#1E7BF2' }, { ext: '.fig', bg: '#A259FF' }, { ext: '.indd', bg: '#FF3366' }, { ext: '.otf', bg: '#16161B' },
        { ext: '.ttf', bg: '#3A3B45' }, { ext: '.docx', bg: '#2B579A' }, { ext: '.pptx', bg: '#D24726' },
    ],
    [
        { ext: '.png', bg: '#1652F0' }, { ext: '.jpg', bg: '#F59E0B' }, { ext: '.webp', bg: '#0E8A5F' }, { ext: '.gif', bg: '#311C99' },
        { ext: '.tiff', bg: '#88007F' }, { ext: '.mp4', bg: '#FF0054' }, { ext: '.mov', bg: '#2A2B33' }, { ext: '.mp3', bg: '#FF0054' },
        { ext: '.wav', bg: '#0891B2' }, { ext: '.zip', bg: '#64748B' }, { ext: '.woff', bg: '#111216' },
    ],
]

const FeatureHead = ({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>, title: string, text: string }) => (
    <div>
        <span className="w-10 h-10 rounded-xl bg-[color:var(--lp-accent-soft)] text-[color:var(--lp-accent)] flex items-center justify-center"><Icon className="w-5 h-5" /></span>
        <h3 className={cn(HEADING, 'mt-5 text-[22px] font-semibold')}>{title}</h3>
        <p className={cn(MUTED, 'mt-2 text-[15px] leading-relaxed')}>{text}</p>
    </div>
)

const Features = () => (
    <section id="produto" className="px-5 md:px-6 py-24 md:py-32 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
            <SectionTitle
                eyebrow="O que o Brivio faz"
                title="Tudo o que a marca precisa, ligado entre si."
                text="O brandbook é o centro. À volta dele, os ficheiros, os projetos e as propostas de cada cliente."
            />
            <div className="mt-14 grid md:grid-cols-6 gap-5">
                <Reveal className="md:col-span-4">
                    <Spotlight className="h-full p-7 md:p-8">
                        <FeatureHead icon={BookOpen} title="Brandbooks vivos" text="Editor visual por blocos, com mais de 450 secções prontas: logótipo, cores, tipografia, tom de voz, mockups, redes sociais e muito mais. Animações, galerias e modo de pré-visualização incluídos." />
                        <div className="mt-7 flex flex-wrap gap-2">
                            {['Logótipo', 'Cores', 'Tipografia', 'Iconografia', 'Fotografia', 'Tom de voz', 'Mockups', 'Redes sociais', 'Identidade sonora', 'Motion'].map((t, i) => (
                                <motion.span
                                    key={t}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.04 }}
                                    className="h-8 px-3 rounded-full border border-[color:var(--lp-line-strong)] text-[13px] font-medium flex items-center hover:border-[color:var(--lp-accent)] hover:text-[color:var(--lp-accent)] transition-colors"
                                >
                                    {t}
                                </motion.span>
                            ))}
                        </div>
                    </Spotlight>
                </Reveal>
                <Reveal className="md:col-span-2" delay={0.08}>
                    <Spotlight className="h-full p-7">
                        <FeatureHead icon={FolderOpen} title="Ficheiros da marca" text="Pastas por marca e links de partilha com palavra-passe e data de expiração." />
                        {/* File formats, as the asset library shows them: two endless rows going opposite ways */}
                        <div className="mt-6 -mx-7 space-y-2 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
                            {FILE_FORMAT_ROWS.map((row, r) => (
                                <div
                                    key={r}
                                    className="flex w-max gap-2 group-hover:[animation-play-state:paused]"
                                    style={{ animation: `lp-marquee ${r === 0 ? 26 : 30}s linear infinite`, animationDirection: r === 0 ? 'normal' : 'reverse' }}
                                >
                                    {[...row, ...row].map((f, i) => (
                                        <div
                                            key={i}
                                            aria-hidden={i >= row.length}
                                            className="w-[72px] h-[72px] shrink-0 rounded-xl flex items-center justify-center text-white text-[14px] font-semibold tracking-tight"
                                            style={{ background: f.bg }}
                                        >
                                            {f.ext}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </Spotlight>
                </Reveal>
                <Reveal className="md:col-span-3" delay={0.04}>
                    <Spotlight className="h-full p-7">
                        <FeatureHead icon={KanbanSquare} title="Projetos e roadmap" text="Projetos, tarefas e sprints de cada marca, e um roadmap que podes partilhar com o cliente." />
                        <div className="mt-6 space-y-2.5">
                            {[{ l: 'Identidade visual', w: '90%' }, { l: 'Brandbook', w: '64%' }, { l: 'Lançamento', w: '28%' }].map((r, i) => (
                                <div key={r.l} className="flex items-center gap-3">
                                    <span className={cn(MUTED, 'w-[120px] text-[12px] font-medium truncate')}>{r.l}</span>
                                    <div className="flex-1 h-2 rounded-full bg-[color:var(--lp-surface)] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: r.w }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                                            className="h-full rounded-full bg-[color:var(--lp-accent)]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Spotlight>
                </Reveal>
                <Reveal className="md:col-span-3" delay={0.12}>
                    <Spotlight className="h-full p-7">
                        <FeatureHead icon={Briefcase} title="Propostas" text="Monta propostas com aspeto profissional para os teus clientes, no mesmo sítio onde fazes o trabalho." />
                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex-1 rounded-xl bg-[color:var(--lp-surface)] p-4">
                                <p className="text-[13px] font-semibold">Proposta · Identidade de marca</p>
                                <p className={cn(MUTED, 'text-[12px] mt-1')}>Âmbito, prazos e valores</p>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-[color:var(--lp-accent)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                    </Spotlight>
                </Reveal>
            </div>
            <Reveal className="mt-8">
                <p className={cn(MUTED, 'text-[14px] text-center')}>
                    E ainda: comunidade de criativos, vagas, mensagens e gestão de clientes.
                </p>
            </Reveal>
        </div>
    </section>
)

// ---------------------------------------------------------------------------------------------
// Templates strip
// ---------------------------------------------------------------------------------------------

const TEMPLATES = [
    { name: 'Antimatéria', bg: '#0E0F12', fg: '#FFFFFF', accent: '#FF0054' },
    { name: 'Guidy', bg: '#0B0B0B', fg: '#FFFFFF', accent: '#FF0054' },
    { name: 'Editorial & Minimalista', bg: '#F3EFE7', fg: '#1C1A17', accent: '#C2410C' },
    { name: 'Tech & SaaS', bg: '#E8FBF4', fg: '#06281D', accent: '#06D6A0' },
    { name: 'Luxo & Lifestyle', bg: '#1A0F1A', fg: '#F5E9F5', accent: '#C084FC' },
    { name: 'Creative Studio', bg: '#FFF1E6', fg: '#2A1406', accent: '#FF6A00' },
    { name: 'Corporate', bg: '#EEF0FF', fg: '#120B3A', accent: '#311C99' },
]

const TemplatesStrip = () => (
    <section className="py-20 md:py-24 border-t border-[color:var(--lp-line)] overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 md:px-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <SectionTitle eyebrow="Templates" title="Começa com um brandbook já desenhado." />
            <Reveal><p className={cn(MUTED, 'max-w-sm text-[15px] leading-relaxed')}>Templates completos de brandbook, por estilo. Escolhe um e troca o conteúdo pelo da tua marca.</p></Reveal>
        </div>
        <div className="mt-12 relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max gap-5 hover:[animation-play-state:paused]" style={{ animation: 'lp-marquee 40s linear infinite' }}>
                {[...TEMPLATES, ...TEMPLATES].map((t, i) => (
                    <div
                        key={i}
                        aria-hidden={i >= TEMPLATES.length}
                        className="w-[300px] md:w-[340px] aspect-[4/3] rounded-[20px] p-6 md:p-7 flex flex-col justify-between shrink-0 shadow-[var(--lp-shadow)] transition-transform duration-300 hover:-translate-y-1"
                        style={{ background: t.bg, color: t.fg }}
                    >
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] opacity-70">
                            <span>Brand book</span><span>2026</span>
                        </div>
                        <div>
                            {t.name === 'Guidy'
                                ? <BrandSymbol size={40} className="mb-4" />
                                : <span className="block w-10 h-10 rounded-full mb-4" style={{ background: t.accent }} />}
                            <p className={cn(HEADING, 'text-[28px] md:text-[30px] font-semibold leading-tight')}>{t.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

// ---------------------------------------------------------------------------------------------
// Who it is for
// ---------------------------------------------------------------------------------------------

const findPlan = (tier: PlanTier, slug: string) => PLANS[tier].find(p => p.slug === slug)

const AUDIENCES = [
    {
        id: 'freelancers', icon: User, label: 'Freelancers',
        title: 'Entrega ao cliente um brandbook profissional, não um PDF.',
        points: ['Templates prontos para começares em minutos', 'Brandbook, ficheiros e projetos de cada cliente no mesmo sítio', 'Propostas e roadmap para mostrar o teu trabalho'],
        plan: { tier: 'individual' as PlanTier, slug: 'pro' },
    },
    {
        id: 'agencias', icon: Building2, label: 'Estúdios e agências',
        title: 'Todas as marcas dos clientes, com a equipa a trabalhar no mesmo.',
        points: ['Planos para equipas de 3 a 25 pessoas, ou mais', 'Vários workspaces para separar clientes', 'Personalização white-label nos planos maiores'],
        plan: { tier: 'agency' as PlanTier, slug: 'team' },
    },
    {
        id: 'equipas', icon: Users, label: 'Equipas de marca',
        title: 'A marca da empresa num só sítio, sempre na versão certa.',
        points: ['Um guia de marca que se atualiza sem reenviar ficheiros', 'Ficheiros partilhados com links seguros', 'Projetos e tarefas de marca organizados'],
        plan: { tier: 'agency' as PlanTier, slug: 'agency-starter' },
    },
]

const Audience = () => {
    const [active, setActive] = useState(0)
    const a = AUDIENCES[active]
    const plan = findPlan(a.plan.tier, a.plan.slug)
    return (
        <section id="para-quem" className="px-5 md:px-6 py-24 md:py-32 bg-[color:var(--lp-bg-2)] border-y border-[color:var(--lp-line)] scroll-mt-16">
            <div className="max-w-6xl mx-auto">
                <SectionTitle eyebrow="Para quem é" title="Feito para quem cria e cuida de marcas." center />
                <Reveal className="mt-10 flex justify-center">
                    <div className="inline-flex flex-wrap justify-center p-1 rounded-full bg-[color:var(--lp-surface)] border border-[color:var(--lp-line)]" role="tablist">
                        {AUDIENCES.map((x, i) => (
                            <button
                                key={x.id}
                                type="button"
                                role="tab"
                                aria-selected={active === i}
                                onClick={() => setActive(i)}
                                className={cn('relative h-10 px-4 md:px-5 rounded-full text-[14px] font-semibold flex items-center gap-2 transition-colors', active === i ? '' : MUTED)}
                            >
                                {active === i && <motion.span layoutId="audience-tab" className="absolute inset-0 rounded-full bg-[color:var(--lp-bg-2)] shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                                <x.icon className="relative w-4 h-4" />
                                <span className="relative">{x.label}</span>
                            </button>
                        ))}
                    </div>
                </Reveal>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.3 }}
                        className="mt-10 grid md:grid-cols-[1.4fr_1fr] gap-5"
                    >
                        <div className="rounded-[24px] bg-[color:var(--lp-bg)] border border-[color:var(--lp-line)] p-7 md:p-10">
                            <h3 className={cn(HEADING, 'text-[26px] md:text-[32px] font-semibold leading-tight')}>{a.title}</h3>
                            <ul className="mt-7 space-y-3.5">
                                {a.points.map(p => (
                                    <li key={p} className="flex items-start gap-3 text-[16px]">
                                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[color:var(--lp-accent-soft)] text-[color:var(--lp-accent)] flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {plan && (
                            <div className="rounded-[24px] bg-[color:var(--lp-invert-bg)] text-[color:var(--lp-invert-text)] p-7 md:p-8 flex flex-col">
                                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] opacity-60">Plano sugerido</span>
                                <p className={cn(HEADING, 'mt-3 text-[28px] font-semibold')}>{plan.name}{a.plan.tier === 'agency' && ' · Agências'}</p>
                                <p className="mt-1"><span className={cn(HEADING, 'text-[44px] font-semibold')}>{plan.price}</span><span className="opacity-60 text-[15px]">{plan.period}</span></p>
                                <p className="mt-3 text-[14px] opacity-70 leading-relaxed">{plan.description}</p>
                                <a href="#precos" className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold hover:gap-2.5 transition-all">
                                    Ver todos os planos <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    )
}

// ---------------------------------------------------------------------------------------------
// Pricing: the same plans as /pricing
// ---------------------------------------------------------------------------------------------

const planHref = (plan: Plan) =>
    plan.price === '$0' ? '/register' : plan.slug === 'enterprise' ? 'mailto:hello@brivio.com?subject=Plano%20Enterprise' : '/pricing'

const Pricing = () => {
    const [tier, setTier] = useState<PlanTier>('individual')
    return (
        <section id="precos" className="px-5 md:px-6 py-24 md:py-32 scroll-mt-16">
            <div className="max-w-6xl mx-auto">
                <SectionTitle eyebrow="Preços" title="Começa grátis. Cresce quando precisares." text="Planos para quem trabalha sozinho e para equipas. Sem surpresas." center />
                <Reveal className="mt-10 flex justify-center">
                    <div className="inline-flex p-1 rounded-full bg-[color:var(--lp-surface)] border border-[color:var(--lp-line)]" role="tablist">
                        {([{ id: 'individual', l: 'Individual', icon: User }, { id: 'agency', l: 'Agências e equipas', icon: Building2 }] as const).map(t => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={tier === t.id}
                                onClick={() => setTier(t.id)}
                                className={cn('relative h-10 px-5 rounded-full text-[14px] font-semibold flex items-center gap-2 transition-colors', tier === t.id ? '' : MUTED)}
                            >
                                {tier === t.id && <motion.span layoutId="pricing-tab" className="absolute inset-0 rounded-full bg-[color:var(--lp-bg-2)] shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                                <t.icon className="relative w-4 h-4" />
                                <span className="relative">{t.l}</span>
                            </button>
                        ))}
                    </div>
                </Reveal>

                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {PLANS[tier].map((plan, i) => (
                            <motion.div
                                key={`${tier}-${plan.slug}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35, delay: i * 0.05 }}
                                className={cn(
                                    'relative rounded-[22px] p-6 flex flex-col border transition-all duration-300 hover:-translate-y-1',
                                    plan.popular
                                        ? 'bg-[color:var(--lp-invert-bg)] text-[color:var(--lp-invert-text)] border-transparent shadow-[var(--lp-shadow-lg)]'
                                        : cn(CARD, 'hover:shadow-[var(--lp-shadow-lg)]')
                                )}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-6 h-6 px-2.5 rounded-full bg-[color:var(--lp-accent)] text-white text-[11px] font-semibold flex items-center">Mais escolhido</span>
                                )}
                                <p className="text-[15px] font-semibold">{plan.name}</p>
                                <p className="mt-4"><span className={cn(HEADING, 'text-[40px] font-semibold')}>{plan.price}</span><span className={cn('text-[14px]', plan.popular ? 'opacity-60' : MUTED)}>{plan.period}</span></p>
                                <p className={cn('mt-2 text-[13px] leading-relaxed min-h-[40px]', plan.popular ? 'opacity-70' : MUTED)}>{plan.description}</p>
                                <ul className="mt-6 space-y-2.5 flex-1">
                                    {plan.features.map(f => (
                                        <li key={f.name} className={cn('flex items-center gap-2.5 text-[13px]', !f.included && 'opacity-40 line-through')}>
                                            {f.included
                                                ? <Check className={cn('w-4 h-4 shrink-0', plan.popular ? 'text-[color:var(--lp-accent)]' : 'text-[color:var(--lp-accent)]')} />
                                                : <X className="w-4 h-4 shrink-0" />}
                                            {f.name}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={planHref(plan)}
                                    className={cn(
                                        'mt-7 h-11 rounded-full text-[14px] font-semibold flex items-center justify-center transition-all',
                                        plan.popular ? 'bg-[color:var(--lp-accent)] text-white hover:opacity-90' : 'border border-[color:var(--lp-line-strong)] hover:bg-[color:var(--lp-surface)]'
                                    )}
                                >
                                    {plan.cta}
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                <p className={cn(FAINT, 'mt-8 text-center text-[13px]')}>
                    Preços em dólares (USD), por mês. Na <Link href="/pricing" className="underline underline-offset-2 hover:text-[color:var(--lp-text)]">página de preços</Link> vês o valor na tua moeda.
                </p>
            </div>
        </section>
    )
}

// ---------------------------------------------------------------------------------------------
// What people say: shown only with real, authorised quotes
// ---------------------------------------------------------------------------------------------

type Testimonial = { quote: string, name: string, role: string }
/** Add real quotes here (with the person's permission); the section stays hidden while the list is empty */
const TESTIMONIALS: Testimonial[] = []

const Testimonials = () => {
    if (TESTIMONIALS.length === 0) return null
    return (
        <section className="px-5 md:px-6 py-24 md:py-32 border-t border-[color:var(--lp-line)]">
            <div className="max-w-6xl mx-auto">
                <SectionTitle eyebrow="O que dizem" title="Quem já usa o Brivio." />
                <div className="mt-12 grid md:grid-cols-3 gap-5">
                    {TESTIMONIALS.map((t, i) => (
                        <Reveal key={t.name} delay={i * 0.06}>
                            <figure className={cn(CARD, 'h-full rounded-[22px] p-7 flex flex-col')}>
                                <blockquote className="text-[16px] leading-relaxed flex-1">“{t.quote}”</blockquote>
                                <figcaption className="mt-6">
                                    <p className="text-[14px] font-semibold">{t.name}</p>
                                    <p className={cn(MUTED, 'text-[13px]')}>{t.role}</p>
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ---------------------------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------------------------

const FAQS = [
    { q: 'O que é um brandbook «vivo»?', a: 'É o guia da tua marca em forma de página web, em vez de um PDF. Quando mudas uma cor, uma regra ou um exemplo, quem abre o link vê logo a versão nova — não há ficheiros para exportar nem reenviar.' },
    { q: 'O Brivio substitui o Figma ou o Illustrator?', a: 'Não. Continuas a criar a marca nas tuas ferramentas de design. O Brivio é onde a apresentas, organizas os ficheiros e geres os projetos e clientes à volta dela.' },
    { q: 'Preciso de saber programar ou de muita experiência em design?', a: 'Não. Começas a partir de um template ou de secções prontas e editas tudo diretamente na página: textos, imagens, cores e disposição.' },
    { q: 'Posso começar sem pagar?', a: 'Sim. O plano Gratuito inclui 2 brandbooks, 1 roadmap, 3 projetos e 1 GB de armazenamento. Passas para outro plano quando precisares de mais.' },
    { q: 'Funciona para equipas e agências?', a: 'Sim. Os planos para agências e equipas vão de 3 a 25 utilizadores, e o Enterprise não tem limite. A partir do plano Team podes ter vários workspaces para separar clientes.' },
    { q: 'Como partilho o trabalho com os clientes?', a: 'Por link. Os ficheiros podem ter palavra-passe e data de expiração, e o roadmap do projeto também pode ser partilhado com o cliente.' },
]

const FAQ = () => {
    const [open, setOpen] = useState<number | null>(0)
    return (
        <section id="faq" className="px-5 md:px-6 py-24 md:py-32 bg-[color:var(--lp-bg-2)] border-y border-[color:var(--lp-line)] scroll-mt-16">
            <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_1.5fr] gap-12">
                <div>
                    <SectionTitle eyebrow="Perguntas frequentes" title="Ficou alguma dúvida?" text="Se não encontrares aqui a resposta, escreve-nos." />
                    <Reveal className="mt-6">
                        <a href="mailto:hello@brivio.com" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[color:var(--lp-accent)] hover:gap-2.5 transition-all">
                            hello@brivio.com <ArrowRight className="w-4 h-4" />
                        </a>
                    </Reveal>
                </div>
                <Reveal>
                    <div className="divide-y divide-[color:var(--lp-line)] border-y border-[color:var(--lp-line)]">
                        {FAQS.map((f, i) => (
                            <div key={f.q}>
                                <button
                                    type="button"
                                    onClick={() => setOpen(open === i ? null : i)}
                                    aria-expanded={open === i}
                                    className="w-full py-5 flex items-center justify-between gap-6 text-left"
                                >
                                    <span className="text-[17px] font-semibold">{f.q}</span>
                                    <span className={cn('w-8 h-8 rounded-full border border-[color:var(--lp-line-strong)] flex items-center justify-center shrink-0 transition-all duration-300', open === i && 'rotate-180 bg-[color:var(--lp-accent)] border-transparent text-white')}>
                                        <ChevronDown className="w-4 h-4" />
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {open === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <p className={cn(MUTED, 'pb-6 pr-12 text-[15px] leading-relaxed')}>{f.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    )
}

// ---------------------------------------------------------------------------------------------
// Closing call to action and footer
// ---------------------------------------------------------------------------------------------

const FinalCTA = () => (
    <section className="px-5 md:px-6 py-24 md:py-32">
        <Reveal>
            <div className="relative max-w-6xl mx-auto rounded-[32px] overflow-hidden bg-[color:var(--lp-invert-bg)] text-[color:var(--lp-invert-text)] px-7 py-16 md:px-16 md:py-24 text-center">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#FF0054] opacity-25 blur-[120px] pointer-events-none" aria-hidden />
                <div className="relative">
                    <motion.div
                        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                        whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="flex justify-center mb-8"
                    >
                        <BrandSymbol size={56} />
                    </motion.div>
                    <h2 className={cn(HEADING, 'text-[36px] md:text-[60px] leading-[1.02] font-semibold max-w-3xl mx-auto')}>
                        Dá à tua marca o guia que ela merece.
                    </h2>
                    <p className="mt-5 text-[17px] opacity-70 max-w-xl mx-auto">Cria o teu primeiro brandbook hoje, no plano gratuito.</p>
                    <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
                        <PrimaryButton href="/register">Começar grátis</PrimaryButton>
                        <Link href="#precos" className="inline-flex items-center justify-center h-12 px-6 rounded-full border text-[15px] font-semibold opacity-80 hover:opacity-100 transition-opacity" style={{ borderColor: 'color-mix(in srgb, currentColor 25%, transparent)' }}>
                            Ver preços
                        </Link>
                    </div>
                </div>
            </div>
        </Reveal>
    </section>
)

const Footer = () => (
    <footer className="px-5 md:px-6 pt-16 pb-10 border-t border-[color:var(--lp-line)]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-10">
            <div className="col-span-2 md:col-span-1">
                <Wordmark height={30} />
                <p className={cn(MUTED, 'mt-4 text-[14px] leading-relaxed max-w-xs')}>Brandbooks vivos, ficheiros e projetos de marca — num só sítio.</p>
            </div>
            <div>
                <p className="text-[13px] font-semibold">Produto</p>
                <ul className={cn(MUTED, 'mt-4 space-y-2.5 text-[14px]')}>
                    <li><a href="#como-funciona" className="hover:text-[color:var(--lp-text)]">Como funciona</a></li>
                    <li><a href="#produto" className="hover:text-[color:var(--lp-text)]">Funcionalidades</a></li>
                    <li><Link href="/pricing" className="hover:text-[color:var(--lp-text)]">Preços</Link></li>
                    <li><a href="#faq" className="hover:text-[color:var(--lp-text)]">Perguntas frequentes</a></li>
                </ul>
            </div>
            <div>
                <p className="text-[13px] font-semibold">Conta</p>
                <ul className={cn(MUTED, 'mt-4 space-y-2.5 text-[14px]')}>
                    <li><Link href="/register" className="hover:text-[color:var(--lp-text)]">Criar conta</Link></li>
                    <li><Link href="/login" className="hover:text-[color:var(--lp-text)]">Entrar</Link></li>
                    <li><a href="mailto:hello@brivio.com" className="hover:text-[color:var(--lp-text)]">Contacto</a></li>
                </ul>
            </div>
        </div>
        <div className={cn(FAINT, 'max-w-6xl mx-auto mt-14 pt-6 border-t border-[color:var(--lp-line)] text-[13px] flex flex-col sm:flex-row justify-between gap-3')}>
            <p>© {new Date().getFullYear()} Brivio. Todos os direitos reservados.</p>
            <p>Feito para quem cria marcas.</p>
        </div>
    </footer>
)

// ---------------------------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------------------------

export default function LandingPage() {
    const { theme, toggle } = useLandingTheme()
    return (
        <div className="lp min-h-screen overflow-x-hidden font-sans antialiased" data-theme={theme} suppressHydrationWarning>
            <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
            <Header theme={theme} onToggle={toggle} />
            <main>
                <Hero />
                <Pains />
                <HowItWorks />
                <Features />
                <Comparison />
                <TemplatesStrip />
                <Audience />
                <Pricing />
                <Testimonials />
                <FAQ />
                <FinalCTA />
            </main>
            <Footer />
        </div>
    )
}
