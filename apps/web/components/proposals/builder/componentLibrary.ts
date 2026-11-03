import { getTemplateModules } from "@/app/proposals/builder/utils"

/**
 * Ready-made proposal pages (Capa, Manifesto, …, Assinatura) in each of the template styles, taken from the
 * template definitions so a page looks the same whether it came with the template or from this library.
 */

export const COMPONENT_CATEGORIES = [
    { id: "capa", label: "Capa" },
    { id: "indice", label: "Índice" },
    { id: "sumario", label: "Sumário executivo" },
    { id: "manifesto", label: "Manifesto" },
    { id: "sobre", label: "Sobre nós" },
    { id: "desafio", label: "O Desafio" },
    { id: "solucao", label: "A Solução" },
    { id: "servicos", label: "Serviços" },
    { id: "descricao", label: "Descrição do projeto" },
    { id: "roadmap", label: "Roadmap" },
    { id: "investimento", label: "Investimento" },
    { id: "orcamento", label: "Orçamento" },
    { id: "equipa", label: "ADN / Equipa" },
    { id: "historia", label: "História" },
    { id: "portfolio", label: "Portfólio" },
    { id: "termos", label: "Termos" },
    { id: "assinatura", label: "Assinatura / Fecho" },
] as const

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number]["id"]

const STYLES = [
    { id: "classico", label: "Clássico", templateName: "" },
    { id: "arquitetura", label: "Arquitetura", templateName: "aec" },
    { id: "brutalista", label: "Brutalista", templateName: "abstract" },
    { id: "tech", label: "Tech", templateName: "sphere" },
    { id: "elegante", label: "Elegante", templateName: "horizon" },
    { id: "corporativo", label: "Corporativo", templateName: "corporativo" },
] as const

/** Whole templates (every page of a style), for «Template completo» */
export const COMPONENT_STYLES = STYLES

// Template page titles («02. Manifesto») → category
const CATEGORY_BY_TITLE: Record<string, ComponentCategory> = {
    "capa": "capa",
    "manifesto": "manifesto",
    "o desafio": "desafio",
    "a solução": "solucao",
    "roadmap": "roadmap",
    "investimento": "investimento",
    "adn/equipa": "equipa",
    "termos": "termos",
    "assinatura": "assinatura",
    // «Corporativo»
    "índice": "indice",
    "sumário executivo": "sumario",
    "sobre nós": "sobre",
    "quem somos": "sobre",
    "a equipa": "equipa",
    "história": "historia",
    "serviços": "servicos",
    "preços": "investimento",
    "orçamento": "orcamento",
    "descrição do projeto": "descricao",
    "cronograma": "roadmap",
    "portfólio": "portfolio",
    "termos e condições": "termos",
    "obrigado": "assinatura",
}

export type ProposalComponent = {
    id: string
    category: ComponentCategory
    categoryLabel: string
    styleId: string
    styleLabel: string
    type: string
    /** Page name in the template («Sumário executivo»), used as the page title */
    pageName: string
    content_json: { blocks: Block[], style?: Record<string, unknown>, page?: Record<string, unknown> }
}

type Block = { id: string, type: string, content?: Record<string, unknown> & { columns?: { id: string, blocks: Block[] }[], items?: unknown }, [k: string]: unknown }

/** Price tables follow the proposal's services instead of the template's example prices */
function stripExamplePrices(blocks: Block[]): Block[] {
    return blocks.map(b => {
        if (b.type === "pricing-table") {
            const content = { ...(b.content || {}) }
            delete content.items
            return { ...b, content }
        }
        if (b.content?.columns) {
            return { ...b, content: { ...b.content, columns: b.content.columns.map(c => ({ ...c, blocks: stripExamplePrices(c.blocks || []) })) } }
        }
        return b
    })
}

let cache: ProposalComponent[] | null = null

export function getProposalComponents(): ProposalComponent[] {
    if (cache) return cache
    const out: ProposalComponent[] = []
    for (const style of STYLES) {
        const modules = getTemplateModules("library", undefined, style.templateName) as { title: string, type: string, content_json: { blocks?: Block[], style?: Record<string, unknown>, page?: Record<string, unknown> } }[]
        for (const m of modules) {
            if (m.type === "settings") continue
            const key = (m.title.split(". ")[1] || m.title).trim().toLowerCase()
            const category = CATEGORY_BY_TITLE[key]
            if (!category) continue
            out.push({
                id: `${style.id}-${category}-${out.filter(o => o.styleId === style.id && o.category === category).length}`,
                pageName: (m.title.split(". ")[1] || m.title).trim(),
                category,
                categoryLabel: COMPONENT_CATEGORIES.find(c => c.id === category)!.label,
                styleId: style.id,
                styleLabel: style.label,
                type: m.type,
                content_json: { blocks: stripExamplePrices(m.content_json.blocks || []), style: m.content_json.style, page: m.content_json.page },
            })
        }
    }
    cache = out
    return out
}

export type ComponentContext = { projectName?: string | null, clientName?: string | null }

const newId = () => Math.random().toString(36).slice(2, 11)

/**
 * A copy of the component ready to go into the proposal: new block ids (two copies never clash) and the
 * template fields ({{Nome_Projeto}}, {{Nome_Cliente}}, {{Nome_Decisor}}, {{Data}}) filled with the proposal's data.
 */
export function instantiateComponent(component: ProposalComponent, ctx: ComponentContext) {
    const date = new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
    const fill = (s: string) => s
        .replace(/\{\{Nome_Projeto\}\}/g, ctx.projectName || "Nome do projeto")
        .replace(/\{\{Nome_Cliente\}\}/g, ctx.clientName || "o cliente")
        .replace(/\{\{Nome_Decisor\}\}/g, ctx.clientName || "Cliente")
        .replace(/\{\{Data\}\}/g, date)
    const walk = (value: unknown): unknown => {
        if (typeof value === "string") return fill(value)
        if (Array.isArray(value)) return value.map(walk)
        if (value && typeof value === "object") {
            const o: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(value)) o[k] = k === "id" ? newId() : walk(v)
            return o
        }
        return value
    }
    return walk(JSON.parse(JSON.stringify(component.content_json))) as ProposalComponent["content_json"]
}
