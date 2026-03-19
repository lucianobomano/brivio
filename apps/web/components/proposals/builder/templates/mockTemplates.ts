import { Block } from "../editor/types"

export interface Template {
    id: string
    name: string
    description: string
    blocks: Block[]
}

// Helper for real IDs
const gid = () => Math.random().toString(36).substr(2, 9)

export const MOCK_TEMPLATES: Template[] = [
    {
        id: "proposta-estrategia-digital",
        name: "Estratégia Digital Premium",
        description: "Focada em transformação digital, consultoria e resultados de alto impacto.",
        blocks: [
            {
                id: gid(),
                type: "headline" as any,
                variant: "h1",
                content: {
                    text: "Sua Jornada de Transformação Digital",
                    style: { fontSize: "72px", textAlign: "left", marginBottom: "20px", fontWeight: "900" }
                }
            },
            {
                id: gid(),
                type: "text" as any,
                content: {
                    text: "Apresentamos uma solução end-to-end desenhada para elevar sua marca ao próximo nível de maturidade tecnológica e presença de mercado.",
                    style: { fontSize: "22px", color: "#666", maxWidth: "900px", marginBottom: "60px" }
                }
            },
            {
                id: gid(),
                type: "timeline" as any,
                content: {
                    items: [
                        { title: "Imersão & Discovery", date: "Semana 1-2", description: "Análise profunda de dados e comportamento do usuário." },
                        { title: "Estratégia & Design", date: "Semana 3-6", description: "Definição do roadmap e prototipagem de soluções." },
                        { title: "Desenvolvimento", date: "Semana 7-12", description: "Construção robusta e testes de qualidade." },
                        { title: "Go-to-Market", date: "Semana 13", description: "Lançamento e monitoramento de KPIs." }
                    ]
                }
            },
            {
                id: gid(),
                type: "layout" as any,
                content: {
                    columns: [
                        {
                            id: gid(),
                            blocks: [
                                {
                                    id: gid(),
                                    type: "headline" as any,
                                    variant: "h2",
                                    content: { text: "Por que escolher a Brivio?", style: { fontSize: "32px", marginBottom: "16px" } }
                                },
                                {
                                    id: gid(),
                                    type: "text" as any,
                                    content: { text: "Nossa metodologia combina design thinking com engenharia de precisão para garantir que cada pixel tenha um propósito comercial claro." }
                                }
                            ]
                        },
                        {
                            id: gid(),
                            blocks: [
                                {
                                    id: gid(),
                                    type: "scope-list" as any,
                                    content: {
                                        items: [
                                            { text: "Consultoria Estratégica", checked: true },
                                            { text: "Design de Experiência (UX/UI)", checked: true },
                                            { text: "Arquitetura de Conversão", checked: true },
                                            { text: "Suporte 24/7 Pós-Lançamento", checked: true }
                                        ]
                                    }
                                }
                            ]
                        }
                    ],
                    settings: { columns: 2 }
                }
            },
            {
                id: gid(),
                type: "pricing-table" as any,
                content: {
                    items: [
                        { description: "Fase de Planejamento", quantity: 1, price: 5000 },
                        { description: "Execução Técnica", quantity: 1, price: 15000 },
                        { description: "Hospedagem & Manutenção (Anual)", quantity: 1, price: 2400 }
                    ]
                }
            },
            {
                id: gid(),
                type: "button" as any,
                content: {
                    text: "Aceitar Proposta & Iniciar Projeto",
                    style: {
                        backgroundColor: "#FF0054",
                        width: "300px",
                        height: "56px",
                        fontSize: "16px",
                        color: "#ffffff",
                        borderRadius: "9999px",
                        textAlign: "center",
                        fontWeight: "bold",
                        marginTop: "40px",
                        float: "right"
                    }
                }
            }
        ]
    },
    {
        id: "branding-identity",
        name: "Identidade de Marca Criativa",
        description: "Template visual focado em storytelling, design e percepção de marca.",
        blocks: [
            {
                id: gid(),
                type: "headline" as any,
                variant: "h1",
                content: {
                    text: "Marcas Que Contam Histórias",
                    style: { fontSize: "82px", fontWeight: "900", letterSpacing: "-0.04em", textAlign: "center", marginBottom: "32px" }
                }
            },
            {
                id: gid(),
                type: "image" as any,
                content: {
                    url: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
                    caption: "Direção de Arte: O Sentimento da Marca"
                }
            },
            {
                id: gid(),
                type: "layout" as any,
                content: {
                    columns: [
                        {
                            id: gid(),
                            blocks: [
                                {
                                    id: gid(),
                                    type: "palette" as any,
                                    content: {
                                        colors: [
                                            { id: gid(), name: "Signature Red", value: "#FF0054" },
                                            { id: gid(), name: "Midnight", value: "#1A1A1A" },
                                            { id: gid(), name: "Soft Cloud", value: "#F4F4F4" }
                                        ]
                                    }
                                }
                            ]
                        }
                    ],
                    settings: { columns: 1 }
                }
            },
            {
                id: gid(),
                type: "headline" as any,
                variant: "h2",
                content: { text: "Entregáveis do Projeto", style: { fontSize: "28px", marginTop: "60px", marginBottom: "24px" } }
            },
            {
                id: gid(),
                type: "scope-list" as any,
                content: {
                    items: [
                        { text: "Logo Primária e Variações", checked: true },
                        { text: "Manual de Uso da Marca (PDF)", checked: true },
                        { text: "Assets para Redes Sociais", checked: true },
                        { text: "Tipografia Customizada", checked: true }
                    ]
                }
            },
            {
                id: gid(),
                type: "pricing-table" as any,
                content: {
                    items: [
                        { description: "Pack de Identidade Visual", quantity: 1, price: 8500 }
                    ]
                }
            }
        ]
    },
    {
        id: "performance-growth",
        name: "Growth & Performance Mensal",
        description: "Ideal para serviços recorrentes de marketing, social media e growth hacking.",
        blocks: [
            {
                id: gid(),
                type: "headline" as any,
                variant: "h1",
                content: {
                    text: "Aceleração de Resultados",
                    style: { fontSize: "60px", color: "#FF0054", marginBottom: "16px" }
                }
            },
            {
                id: gid(),
                type: "text" as any,
                content: {
                    text: "Foco total em ROI. Não vendemos curtidas, vendemos conversão e escala sustentável para o seu negócio.",
                    style: { fontSize: "18px", marginBottom: "40px" }
                }
            },
            {
                id: gid(),
                type: "layout" as any,
                content: {
                    columns: [
                        {
                            id: gid(),
                            blocks: [
                                {
                                    id: gid(),
                                    type: "headline" as any,
                                    variant: "h2",
                                    content: { text: "Objetivos Mensais", style: { fontSize: "24px" } }
                                },
                                {
                                    id: gid(),
                                    type: "scope-list" as any,
                                    content: {
                                        items: [
                                            { text: "+25% Alcance Orgânico", checked: true },
                                            { text: "CAC abaixo de R$ 15,00", checked: true },
                                            { text: "Otimização Diária de Ads", checked: true }
                                        ]
                                    }
                                }
                            ]
                        },
                        {
                            id: gid(),
                            blocks: [
                                {
                                    id: gid(),
                                    type: "headline" as any,
                                    variant: "h2",
                                    content: { text: "Investimento Mensal", style: { fontSize: "24px" } }
                                },
                                {
                                    id: gid(),
                                    type: "pricing-table" as any,
                                    content: {
                                        items: [
                                            { description: "Setup do Funil", quantity: 1, price: 3000 },
                                            { description: "Gestão (Fee Mensal)", quantity: 1, price: 4500 }
                                        ]
                                    }
                                }
                            ]
                        }
                    ],
                    settings: { columns: 2 }
                }
            }
        ]
    }
]

