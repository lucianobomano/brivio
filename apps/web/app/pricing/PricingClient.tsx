"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight, Sparkles, Briefcase, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type Tier = 'individual' | 'agency'

const individualPlans = [
    {
        slug: "free",
        name: "Gratuito",
        price: "$0",
        period: "/mês",
        description: "Perfeito para começar e organizar os seus primeiros projetos criativos.",
        features: [
            { name: "1 Utilizador", included: true },
            { name: "1GB de Armazenamento", included: true },
            { name: "2 Brandbooks", included: true },
            { name: "1 Roadmap", included: true },
            { name: "3 Projetos", included: true },
            { name: "Personalização White-label", included: false },
        ],
        cta: "Começar Agora",
        popular: false
    },
    {
        slug: "starter",
        name: "Starter",
        price: "$9",
        period: "/mês",
        description: "Ideal para freelancers que precisam de mais projetos em simultâneo.",
        features: [
            { name: "1 Utilizador", included: true },
            { name: "10GB de Armazenamento", included: true },
            { name: "10 Brandbooks", included: true },
            { name: "5 Roadmaps", included: true },
            { name: "15 Projetos", included: true },
            { name: "Personalização White-label", included: false },
        ],
        cta: "Escolher Starter",
        popular: false
    },
    {
        slug: "pro",
        name: "Pro",
        price: "$15",
        period: "/mês",
        description: "Para criativos que precisam de mais espaço e ferramentas pro.",
        features: [
            { name: "1 Utilizador", included: true },
            { name: "100GB de Armazenamento", included: true },
            { name: "Brandbooks Ilimitados", included: true },
            { name: "Roadmaps Ilimitados", included: true },
            { name: "Projetos Ilimitados", included: true },
            { name: "Personalização White-label", included: false },
        ],
        cta: "Experimentar Pro",
        popular: true
    },
    {
        slug: "ultra",
        name: "Ultra",
        price: "$29",
        period: "/mês",
        description: "Acesso total e ilimitado para profissionais estabelecidos.",
        features: [
            { name: "2 Utilizadores", included: true },
            { name: "500GB de Armazenamento", included: true },
            { name: "Brandbooks Ilimitados", included: true },
            { name: "Roadmaps Ilimitados", included: true },
            { name: "Projetos Ilimitados", included: true },
            { name: "Personalização White-label", included: true },
        ],
        cta: "Escolher Ultra",
        popular: false
    }
]

const agencyPlans = [
    {
        slug: "agency-starter",
        name: "Starter",
        price: "$49",
        period: "/mês",
        description: "A solução ideal para pequenas equipas e estúdios criativos.",
        features: [
            { name: "Até 3 Utilizadores", included: true },
            { name: "250GB de Armazenamento", included: true },
            { name: "Projetos Ilimitados", included: true },
            { name: "Suporte Standard", included: true },
            { name: "Múltiplos Workspaces", included: false },
            { name: "Personalização White-label", included: false },
        ],
        cta: "Escolher Starter",
        popular: false
    },
    {
        slug: "team",
        name: "Team",
        price: "$99",
        period: "/mês",
        description: "Colaboração avançada para estúdios criativos em crescimento.",
        features: [
            { name: "Até 10 Utilizadores", included: true },
            { name: "1TB de Armazenamento", included: true },
            { name: "Projetos Ilimitados", included: true },
            { name: "Suporte Prioritário", included: true },
            { name: "Múltiplos Workspaces", included: true },
            { name: "Personalização White-label", included: false },
        ],
        cta: "Escolher Team",
        popular: false
    },
    {
        slug: "growth",
        name: "Growth",
        price: "$199",
        period: "/mês",
        description: "Para agências em expansão que exigem total controlo da marca.",
        features: [
            { name: "Até 25 Utilizadores", included: true },
            { name: "2TB de Armazenamento", included: true },
            { name: "Ferramentas Avançadas", included: true },
            { name: "Gestor de Conta", included: true },
            { name: "Múltiplos Workspaces", included: true },
            { name: "Personalização White-label", included: true },
        ],
        cta: "Escolher Growth",
        popular: true
    },
    {
        slug: "enterprise",
        name: "Enterprise",
        price: "$399",
        period: "/mês",
        description: "Soluções personalizadas para grandes agências e corporações.",
        features: [
            { name: "Utilizadores Ilimitados", included: true },
            { name: "Armazenamento Ilimitado", included: true },
            { name: "APIs & Integrações", included: true },
            { name: "Suporte Dedicado (24/7)", included: true },
            { name: "Múltiplos Workspaces", included: true },
            { name: "Personalização Avançada", included: true },
        ],
        cta: "Contactar Vendas",
        popular: false
    }
]

export default function PricingClient() {
    const [activeTier, setActiveTier] = useState<Tier>('individual')
    const [localCurrency, setLocalCurrency] = useState('USD')
    const [exchangeRate, setExchangeRate] = useState(1)
    const [isLoadingCurrency, setIsLoadingCurrency] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchLocationAndRate = async () => {
            try {
                // 1. Fetch user's local currency based on IP
                const geoRes = await fetch('https://ipapi.co/json/')
                if (!geoRes.ok) throw new Error('Location fetch failed')
                const geoData = await geoRes.json()
                const currency = geoData.currency || 'USD'
                
                setLocalCurrency(currency)

                // 2. If it's not USD, fetch the exchange rate
                if (currency !== 'USD') {
                    const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
                    if (!rateRes.ok) throw new Error('Rate fetch failed')
                    const rateData = await rateRes.json()
                    
                    if (rateData.rates && rateData.rates[currency]) {
                        setExchangeRate(rateData.rates[currency])
                    }
                }
            } catch (error) {
                console.error("Failed to fetch location or exchange rate:", error)
                // Silently fallback to USD
                setLocalCurrency('USD')
                setExchangeRate(1)
            } finally {
                setIsLoadingCurrency(false)
            }
        }

        fetchLocationAndRate()
    }, [])

    const plans = activeTier === 'individual' ? individualPlans : agencyPlans

    const formatPrice = (basePriceString: string) => {
        const numericBase = parseFloat(basePriceString.replace('$', ''))
        if (isNaN(numericBase) || numericBase === 0) {
            return localCurrency === 'USD' ? '$0' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: localCurrency, maximumFractionDigits: 0 }).format(0)
        }

        const localPrice = numericBase * exchangeRate
        
        return new Intl.NumberFormat(localCurrency === 'AOA' ? 'pt-AO' : 'en-US', { 
            style: 'currency', 
            currency: localCurrency,
            maximumFractionDigits: localCurrency === 'AOA' ? 0 : 2
        }).format(localPrice)
    }

    const handleSelectPlan = (plan: any) => {
        // If it's the free plan or Enterprise contact, handle differently if needed.
        if (plan.price === '$0') {
            router.push('/dashboard') // Or auth page
            return
        }
        if (plan.name === 'Enterprise') {
            window.location.href = 'mailto:hello@brivio.com?subject=Enterprise Plan'
            return
        }
        
        // Pass essential info via query params
        const numericPrice = plan.price.replace('$', '')
        router.push(`/checkout?plan=${plan.slug}&tier=${activeTier}&price=${numericPrice}&currency=${localCurrency}&rate=${exchangeRate}`)
    }

    return (
        <div className="relative min-h-screen pt-32 pb-24 px-6 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#ff0054]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-[1400px] mx-auto w-full z-10">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Planos simples,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#ff0054]">
                            desenhados para escalar consigo.
                        </span>
                    </h1>
                    <p className="text-lg text-[#888] max-w-2xl mx-auto mb-10">
                        Seja um criador independente ou uma agência estabelecida, temos a solução certa para impulsionar a sua produtividade e gestão criativa.
                    </p>

                    {/* Toggle Switch */}
                    <div className="inline-flex items-center p-1 bg-[#111] border border-white/5 rounded-2xl relative">
                        <button
                            onClick={() => setActiveTier('individual')}
                            className={cn(
                                "relative px-8 py-3 rounded-xl text-[15px] font-medium transition-colors z-10 flex items-center gap-2",
                                activeTier === 'individual' ? "text-white" : "text-[#666] hover:text-white"
                            )}
                        >
                            <User size={16} />
                            Individual
                        </button>
                        <button
                            onClick={() => setActiveTier('agency')}
                            className={cn(
                                "relative px-8 py-3 rounded-xl text-[15px] font-medium transition-colors z-10 flex items-center gap-2",
                                activeTier === 'agency' ? "text-white" : "text-[#666] hover:text-white"
                            )}
                        >
                            <Briefcase size={16} />
                            Agência
                        </button>

                        {/* Animated Background Indicator */}
                        <motion.div
                            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#222] rounded-xl border border-white/10"
                            initial={false}
                            animate={{
                                left: activeTier === 'individual' ? "4px" : "calc(50%)"
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    </div>
                    
                    {isLoadingCurrency && (
                        <div className="mt-6 text-[13px] text-[#ff0054] animate-pulse">
                            A calcular preços na sua moeda local...
                        </div>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mx-auto">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={`${activeTier}-${plan.name}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                            className={cn(
                                "relative p-6 rounded-xl border backdrop-blur-md flex flex-col",
                                plan.popular 
                                    ? "bg-white/5 border-[#ff0054]/30 shadow-[0_0_40px_rgba(255,0,84,0.1)]" 
                                    : "bg-[#0a0a0a]/50 border-white/5"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#ff0054] to-[#ff4d85] rounded-full text-[12px] font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-lg shadow-[#ff0054]/20">
                                    <Sparkles size={14} />
                                    Mais Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-[#888] text-[15px] leading-relaxed min-h-[48px]">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-8 flex items-end gap-1">
                                <span className="text-5xl font-black">
                                    {isLoadingCurrency ? "..." : formatPrice(plan.price)}
                                </span>
                                {plan.price !== '$0' && (
                                    <span className="text-[#666] mb-1 font-medium">{plan.period}</span>
                                )}
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center w-5 h-5 rounded-full",
                                            feature.included ? "bg-[#ff0054]/20 text-[#ff0054]" : "bg-white/5 text-[#444]"
                                        )}>
                                            {feature.included ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                                        </div>
                                        <span className={cn(
                                            "text-[15px]",
                                            feature.included ? "text-[#ccc]" : "text-[#555] line-through"
                                        )}>
                                            {feature.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => handleSelectPlan(plan)}
                                className={cn(
                                "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300",
                                plan.popular
                                    ? "bg-[#ff0054] text-white hover:bg-[#ff0054]/90 hover:shadow-[0_0_20px_rgba(255,0,84,0.4)]"
                                    : "bg-[#111] text-white border border-white/10 hover:bg-[#222]"
                            )}>
                                {plan.cta}
                                <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
