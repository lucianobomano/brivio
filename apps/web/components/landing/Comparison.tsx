'use client'

/**
 * «Porquê o Brivio»: a short comparison of Brivio with what people use today (PDF and email, Drive, WeTransfer,
 * design tools, docs, WhatsApp), then «não mudar nada» against Brivio, in a few words.
 * Statements are general (typical use of each kind of tool), never about a named product.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight, Check, Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const HEADING = 'font-[family-name:var(--font-inter-tight)] tracking-[-0.035em]'
const MUTED = 'text-[color:var(--lp-muted)]'
const FAINT = 'text-[color:var(--lp-faint)]'
const CARD = 'bg-[color:var(--lp-bg-2)] border border-[color:var(--lp-line)] shadow-[var(--lp-shadow)]'

type V = 'yes' | 'partial' | 'no'
const COLUMNS = ['Brivio', 'PDF + email', 'Drive / Dropbox', 'WeTransfer', 'Figma / Canva', 'Notion / Docs', 'WhatsApp']
const ROWS: { label: string, values: V[] }[] = [
    { label: 'Brandbook interativo num link', values: ['yes', 'no', 'no', 'no', 'partial', 'partial', 'no'] },
    { label: 'Atualiza sem reenviar ficheiros', values: ['yes', 'no', 'partial', 'no', 'partial', 'yes', 'no'] },
    { label: 'Templates de brandbook prontos', values: ['yes', 'no', 'no', 'no', 'partial', 'partial', 'no'] },
    { label: 'Ficheiros da marca organizados', values: ['yes', 'no', 'yes', 'no', 'partial', 'partial', 'no'] },
    { label: 'Links com palavra-passe e expiração', values: ['yes', 'no', 'partial', 'partial', 'partial', 'no', 'no'] },
    { label: 'Projetos, tarefas e roadmap', values: ['yes', 'no', 'no', 'no', 'no', 'yes', 'no'] },
    { label: 'Propostas para clientes', values: ['yes', 'no', 'no', 'no', 'partial', 'partial', 'no'] },
    { label: 'Pensado para várias marcas', values: ['yes', 'no', 'partial', 'no', 'partial', 'partial', 'no'] },
    { label: 'Começa grátis', values: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'] },
]

const Mark = ({ v, highlight }: { v: V, highlight?: boolean }) => (
    v === 'yes'
        ? <span className={cn('w-6 h-6 rounded-full inline-flex items-center justify-center', highlight ? 'bg-[color:var(--lp-accent)] text-white' : 'bg-[color:var(--lp-surface)] text-[color:var(--lp-text)]')} aria-label="Sim"><Check className="w-3.5 h-3.5" /></span>
        : v === 'partial'
            ? <span className="w-6 h-6 rounded-full inline-flex items-center justify-center bg-[color:var(--lp-surface)] text-[color:var(--lp-faint)]" aria-label="Em parte"><Minus className="w-3.5 h-3.5" /></span>
            : <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[color:var(--lp-faint)] opacity-60" aria-label="Não"><X className="w-3.5 h-3.5" /></span>
)

/** «Não mudar nada» against Brivio: three words each side */
const TODAY = ['PDF desatualizado', 'Anexos perdidos', 'Versões duplicadas']
const WITH_BRIVIO = ['Um só link', 'Sempre atualizado', 'Tudo num só sítio']

export default function Comparison() {
    const [hoverCol, setHoverCol] = useState<number | null>(null)

    return (
        <section id="comparar" className="px-5 md:px-6 py-24 md:py-32 bg-[color:var(--lp-bg-2)] border-y border-[color:var(--lp-line)] scroll-mt-16">
            <div className="max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--lp-accent)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--lp-accent)]" /> Porquê o Brivio
                    </span>
                    <h2 className={cn(HEADING, 'mt-4 text-[34px] md:text-[48px] leading-[1.05] font-semibold')}>O Brivio, ao lado do que usas hoje.</h2>
                </motion.div>

                {/* Table */}
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }} className="mt-12">
                    <div className={cn(CARD, 'rounded-[22px] overflow-x-auto')}>
                        <table className="w-full min-w-[860px] text-left border-collapse" onMouseLeave={() => setHoverCol(null)}>
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-10 bg-[color:var(--lp-bg-2)] p-4 md:p-5 w-[240px]" />
                                    {COLUMNS.map((c, ci) => (
                                        <th
                                            key={c}
                                            onMouseEnter={() => setHoverCol(ci)}
                                            className={cn(
                                                'p-4 text-center text-[13px] font-semibold align-bottom transition-colors',
                                                ci === 0 ? 'text-[color:var(--lp-accent)] bg-[color:var(--lp-accent-soft)] rounded-t-xl' : MUTED,
                                                hoverCol === ci && ci !== 0 && 'bg-[color:var(--lp-surface)]'
                                            )}
                                        >
                                            {ci === 0 && <Image src="/brivio-circle-logo.png" alt="" aria-hidden width={18} height={18} className="mx-auto mb-1.5" />}
                                            {c}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ROWS.map((r, ri) => (
                                    <tr key={r.label} className="group border-t border-[color:var(--lp-line)]">
                                        <td className="sticky left-0 z-10 bg-[color:var(--lp-bg-2)] group-hover:bg-[color:var(--lp-surface)] p-4 md:px-5 text-[14px] font-medium transition-colors">{r.label}</td>
                                        {r.values.map((v, ci) => (
                                            <td
                                                key={ci}
                                                onMouseEnter={() => setHoverCol(ci)}
                                                className={cn(
                                                    'p-3 text-center transition-colors',
                                                    ci === 0 ? cn('bg-[color:var(--lp-accent-soft)]', ri === ROWS.length - 1 && 'rounded-b-xl') : 'group-hover:bg-[color:var(--lp-surface)]',
                                                    hoverCol === ci && ci !== 0 && 'bg-[color:var(--lp-surface)]'
                                                )}
                                            >
                                                <Mark v={v} highlight={ci === 0} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={cn(FAINT, 'mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]')}>
                        <span className="flex items-center gap-1.5"><Mark v="yes" /> Sim</span>
                        <span className="flex items-center gap-1.5"><Mark v="partial" /> Em parte</span>
                        <span className="flex items-center gap-1.5"><Mark v="no" /> Não</span>
                        <span>Comparação geral; varia consoante o produto e o plano.</span>
                    </div>
                </motion.div>

                {/* Not changing anything vs Brivio */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.7 }}
                    className="mt-16 grid md:grid-cols-[1fr_auto_1fr] items-stretch gap-4"
                >
                    <div className="rounded-[24px] bg-[color:var(--lp-bg)] border border-[color:var(--lp-line)] p-7 md:p-8">
                        <p className={cn(FAINT, 'text-[12px] font-semibold uppercase tracking-[0.14em]')}>Não mudar nada</p>
                        <div className="mt-6 flex flex-wrap gap-2.5">
                            {TODAY.map((t, i) => (
                                <motion.span
                                    key={t}
                                    initial={{ opacity: 0, y: 8 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.15 + i * 0.08 }}
                                    className={cn(MUTED, 'h-10 px-4 rounded-full border border-dashed border-[color:var(--lp-line-strong)] text-[15px] font-medium flex items-center gap-2 line-through decoration-[color:var(--lp-faint)]')}
                                >
                                    <X className="w-3.5 h-3.5 shrink-0" /> {t}
                                </motion.span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 18 }}
                            className="w-12 h-12 rounded-full bg-[color:var(--lp-invert-bg)] text-[color:var(--lp-invert-text)] flex items-center justify-center rotate-90 md:rotate-0"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </motion.span>
                    </div>

                    <div className="relative rounded-[24px] p-7 md:p-8 overflow-hidden bg-[color:var(--lp-accent)] text-white">
                        <div aria-hidden className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-white opacity-15 blur-[50px]" />
                        <p className="relative text-[12px] font-semibold uppercase tracking-[0.14em] opacity-80">Com o Brivio</p>
                        <div className="relative mt-6 flex flex-wrap gap-2.5">
                            {WITH_BRIVIO.map((t, i) => (
                                <motion.span
                                    key={t}
                                    initial={{ opacity: 0, y: 8 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 + i * 0.08 }}
                                    className="h-10 px-4 rounded-full bg-white text-[#111216] text-[15px] font-semibold flex items-center gap-2"
                                >
                                    <Check className="w-3.5 h-3.5 shrink-0 text-[#FF0054]" /> {t}
                                </motion.span>
                            ))}
                        </div>
                        <Link href="/register" className="group relative mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold">
                            Experimentar grátis <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
