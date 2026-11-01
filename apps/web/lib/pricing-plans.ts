/**
 * Brivio plans: the single source for the pricing page (/pricing) and the landing page.
 * Prices are in USD per month; /pricing converts them to the visitor's currency.
 */

export type PlanFeature = { name: string, included: boolean }
export type Plan = {
    slug: string
    name: string
    price: string
    period: string
    description: string
    features: PlanFeature[]
    cta: string
    popular: boolean
}
export type PlanTier = 'individual' | 'agency'

export const individualPlans: Plan[] = [
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

export const agencyPlans: Plan[] = [
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

export const PLANS: Record<PlanTier, Plan[]> = { individual: individualPlans, agency: agencyPlans }
