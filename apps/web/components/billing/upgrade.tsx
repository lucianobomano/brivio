"use client"

import React from "react"
import { createPortal } from "react-dom"
import { ArrowRight, Briefcase, Check, Clock, HardDrive, Loader2, Sparkles, User, X, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLANS, findPlan, planStorageGB, type PlanTier } from "@/lib/pricing-plans"
import { useLocalCurrency } from "@/lib/hooks/use-local-currency"
import { getMyBilling, type MyBilling } from "@/app/actions/billing"

/**
 * The upgrade flow, the same from every «Upgrade» button (Asset libraries, brand settings, Billing):
 * openUpgrade() shows the plans with the current one and what is waiting for approval; picking a plan goes to
 * /checkout (payment + proof), where the request is created; an admin approves it and the plan applies.
 */

// ---- the user's plan, shared by every view (loaded once, refreshed when the dialog opens)
let billing: MyBilling | null = null
let loading: Promise<MyBilling> | null = null
const billingListeners = new Set<() => void>()
const refreshBilling = () => {
    loading = getMyBilling().then(b => { billing = b; billingListeners.forEach(l => l()); return b }).catch(() => billing as MyBilling)
    return loading
}
export function useMyBilling() {
    const [, force] = React.useReducer((x: number) => x + 1, 0)
    React.useEffect(() => {
        billingListeners.add(force)
        if (!billing && !loading) refreshBilling()
        return () => { billingListeners.delete(force) }
    }, [])
    return { billing, refresh: refreshBilling }
}

// ---- opening the dialog from anywhere
export type UpgradeReason = "storage" | "domain" | "plan"
type OpenState = { reason: UpgradeReason, usedBytes?: number, tier?: PlanTier } | null
let openState: OpenState = null
const openListeners = new Set<() => void>()
/** Shows the upgrade dialog; `usedBytes` lets it show the storage in use */
export function openUpgrade(opts: { reason?: UpgradeReason, usedBytes?: number, tier?: PlanTier } = {}) {
    openState = { reason: opts.reason || "plan", usedBytes: opts.usedBytes, tier: opts.tier }
    openListeners.forEach(l => l())
}
const closeUpgrade = () => { openState = null; openListeners.forEach(l => l()) }

const formatBytes = (b: number) => b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(2)} GB` : b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`
const formatGB = (gb: number) => gb === Infinity ? "Ilimitado" : gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`
const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }) : ""

const REASON_TEXT: Record<UpgradeReason, { title: string, text: string }> = {
    storage: { title: "Mais espaço para os seus ficheiros", text: "Escolha um plano com mais armazenamento para continuar a carregar ficheiros." },
    domain: { title: "Domínio próprio", text: "Use o seu próprio domínio nos brandbooks com um plano pago." },
    plan: { title: "Fazer upgrade", text: "Escolha o plano que serve o seu trabalho. Pode mudar quando quiser." },
}

/** Mounted once (root layout): the dialog opened by openUpgrade() */
export function UpgradeModalHost() {
    const [, force] = React.useReducer((x: number) => x + 1, 0)
    React.useEffect(() => { openListeners.add(force); return () => { openListeners.delete(force) } }, [])
    const { billing: b } = useMyBilling()
    const money = useLocalCurrency()
    const [tier, setTier] = React.useState<PlanTier>("individual")
    const [choice, setChoice] = React.useState<string | null>(null)
    const [busy, setBusy] = React.useState(false)
    const state = openState

    React.useEffect(() => {
        if (!state) return
        refreshBilling()
        setChoice(null)
        if (state.tier) setTier(state.tier)
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeUpgrade() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [state])
    React.useEffect(() => { if (b?.tier === "agency") setTier("agency") }, [b?.tier])

    if (!state || typeof document === "undefined") return null
    const reason = REASON_TEXT[state.reason]
    const current = b?.plan || "free"
    const currentGB = b?.storageLimitGB ?? planStorageGB("free")
    const plans = PLANS[tier].filter(p => p.price !== "$0")
    const picked = choice ? findPlan(choice) : null
    const usedPct = state.usedBytes !== undefined && currentGB !== Infinity ? Math.min(100, (state.usedBytes / (currentGB * 1024 ** 3)) * 100) : null

    const goToCheckout = () => {
        if (!picked) return
        if (picked.slug === "enterprise") { window.location.href = "mailto:hello@brivio.com?subject=Plano Enterprise"; return }
        setBusy(true)
        const price = picked.price.replace("$", "")
        // Its own tab: the editors behind keep their work
        window.open(`/checkout?plan=${picked.slug}&tier=${tier}&price=${price}&currency=${money.currency}&rate=${money.rate}`, "_blank")
        setTimeout(() => { setBusy(false); closeUpgrade() }, 400)
    }

    return createPortal(
        <div className="fixed inset-0 z-[13000] flex items-center justify-center p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeUpgrade} />
            <div role="dialog" aria-label="Fazer upgrade" className="relative w-full max-w-[1080px] max-h-[92vh] bg-[#0E0F14] border border-[#222] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
                {/* Header */}
                <div className="relative px-6 md:px-8 pt-7 pb-6 border-b border-[#1d1d24] shrink-0 overflow-hidden">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[220px] bg-[#ff0054]/15 blur-[90px] pointer-events-none" />
                    <button type="button" onClick={closeUpgrade} aria-label="Fechar" className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#999] hover:text-white"><X className="w-4 h-4" /></button>
                    <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
                        <div>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff0054]"><Sparkles className="w-3.5 h-3.5" /> Upgrade</span>
                            <h2 className="text-2xl md:text-3xl font-bold mt-2">{reason.title}</h2>
                            <p className="text-[13px] text-[#8b8b96] mt-1 max-w-[520px]">{reason.text}</p>
                        </div>
                        {/* Current plan + storage */}
                        <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 min-w-[260px]">
                            <div className="flex items-center justify-between gap-4 text-[12px]">
                                <span className="text-[#8b8b96]">Plano atual</span>
                                <span className="font-bold">{b ? b.planName : "…"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[12px] mt-1.5">
                                <span className="text-[#8b8b96] flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Armazenamento</span>
                                <span className="font-semibold">{state.usedBytes !== undefined ? `${formatBytes(state.usedBytes)} / ` : ""}{formatGB(currentGB)}</span>
                            </div>
                            {usedPct !== null && (
                                <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden"><div className={cn("h-full", usedPct > 90 ? "bg-red-500" : "bg-[#ff0054]")} style={{ width: `${usedPct}%` }} /></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 py-6 custom-scrollbar">
                    {/* A request already waiting, or the last one refused */}
                    {b?.pending && (
                        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3 text-[13px]">
                            <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <span><strong>O seu pedido do plano {b.pending.planName} está em análise</strong> desde {formatDate(b.pending.createdAt)}. Validamos o pagamento em 2 a 24 horas; o plano fica ativo assim que for aprovado.</span>
                        </div>
                    )}
                    {b?.rejected && (
                        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3 text-[13px]">
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            <span>O pedido do plano {b.rejected.planName} não foi aprovado{b.rejected.reason ? `: ${b.rejected.reason}` : "."} Pode escolher um plano e enviar um novo comprovativo.</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                        <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-full">
                            {([["individual", "Individual", User], ["agency", "Agência", Briefcase]] as const).map(([id, label, Icon]) => (
                                <button key={id} type="button" onClick={() => { setTier(id); setChoice(null) }} className={cn("h-9 px-4 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-colors", tier === id ? "bg-white text-black" : "text-[#9a9aa5] hover:text-white")}>
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                            ))}
                        </div>
                        <a href="/pricing" target="_blank" rel="noopener" className="text-[12px] text-[#8b8b96] hover:text-white underline underline-offset-4">Comparar todos os planos</a>
                    </div>

                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                        {plans.map(p => {
                            const isCurrent = p.slug === current
                            const isPending = b?.pending?.plan === p.slug
                            const selected = choice === p.slug
                            const gb = planStorageGB(p.slug)
                            return (
                                <button
                                    key={p.slug}
                                    type="button"
                                    disabled={isCurrent}
                                    onClick={() => setChoice(p.slug)}
                                    className={cn(
                                        "relative text-left rounded-2xl border p-5 flex flex-col gap-3 transition-all",
                                        selected ? "border-[#ff0054] bg-[#ff0054]/[0.07] shadow-[0_0_0_1px_#ff0054]" : "border-white/10 bg-white/[0.02] hover:border-white/25",
                                        isCurrent && "opacity-60 cursor-default"
                                    )}
                                >
                                    {p.popular && !isCurrent && <span className="absolute -top-2.5 left-5 px-2 py-0.5 rounded-full bg-[#ff0054] text-[10px] font-bold uppercase tracking-wider">Mais escolhido</span>}
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[15px] font-bold">{p.name}</span>
                                        {isCurrent ? <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b8b96]">Atual</span>
                                            : isPending ? <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Em análise</span>
                                                : selected ? <span className="w-5 h-5 rounded-full bg-[#ff0054] flex items-center justify-center"><Check className="w-3 h-3" /></span> : null}
                                    </div>
                                    <div>
                                        <span className="text-2xl font-bold">{p.slug === "enterprise" ? "Sob consulta" : money.format(p.price)}</span>
                                        {p.slug !== "enterprise" && <span className="text-[12px] text-[#8b8b96]"> {p.period}</span>}
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold rounded-full bg-white/[0.06] px-2.5 py-1"><HardDrive className="w-3 h-3" /> {formatGB(gb)}</span>
                                    <ul className="flex flex-col gap-1.5 text-[12px]">
                                        {p.features.filter(f => f.included && !/Armazenamento/i.test(f.name)).slice(0, 4).map(f => (
                                            <li key={f.name} className="flex items-center gap-2 text-[#c4c4cc]"><Check className="w-3.5 h-3.5 text-[#06D6A0] shrink-0" /> {f.name}</li>
                                        ))}
                                    </ul>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 md:px-8 py-4 border-t border-[#1d1d24] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <p className="text-[12px] text-[#8b8b96]">
                        {picked ? <>Plano <strong className="text-white">{picked.name}</strong>{picked.slug !== "enterprise" ? ` · ${money.format(picked.price)} ${picked.period}` : ""}. Pagamento por transferência ou referência, com comprovativo.</> : "Escolha um plano para continuar."}
                    </p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={closeUpgrade} className="h-10 px-4 rounded-xl text-[13px] text-[#9a9aa5] hover:text-white">Agora não</button>
                        <button type="button" disabled={!picked || busy} onClick={goToCheckout} className="h-10 px-5 rounded-xl bg-[#ff0054] hover:bg-[#e6004c] text-[13px] font-bold flex items-center gap-2 disabled:opacity-40">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {picked?.slug === "enterprise" ? "Contactar vendas" : "Continuar para pagamento"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
