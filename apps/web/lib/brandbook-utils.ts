export const CATEGORIES = [
    {
        id: 'overview',
        label: 'Visão geral',
        pages: ['Visão geral', 'DNA da marca', 'História da marca'],
        subCategories: null
    },
    {
        id: 'visual_guide',
        label: 'Guia de estilo visual',
        pages: ['Guia de estilo visual'],
        subCategories: null
    },
    {
        id: 'brand_identity',
        label: 'Identidade da marca',
        pages: [],
        subCategories: [
            {
                id: 'verbal_identity',
                label: 'Identidade Verbal',
                pages: [
                    'Personalidade da marca',
                    'Tom de voz',
                    'Linguagem preferencial',
                    'Slogans e taglines',
                    'Naming system',
                    'Storytelling base',
                    'Copywriting guidelines'
                ]
            },
            {
                id: 'visual_identity',
                label: 'Identidade visual',
                pages: [
                    'Logo',
                    'Cores',
                    'Tipografia',
                    'Iconografia',
                    'Imagens & Fotografia',
                    'Ilustração',
                    'Grid & Layouts',
                    'Elementos gráficos',
                    'Aplicações digitais',
                    'Aplicações offline',
                    'Motion design'
                ]
            },
            {
                id: 'sensory_identity',
                label: 'Identidade sensorial',
                pages: [
                    'Identidade sonora',
                    'Identidade olfativa',
                    'Identidade tátil',
                    'Identidade gustativa',
                    'Experiência multimodal'
                ]
            }
        ]
    }
]

export function mapPageToCategory(title: string): string {
    for (const cat of CATEGORIES) {
        if (cat.pages.some(p => p.toLowerCase() === title.toLowerCase())) return cat.id
        if (cat.subCategories) {
            for (const sub of cat.subCategories) {
                if (sub.pages.some(p => p.toLowerCase() === title.toLowerCase())) return sub.id
            }
        }
    }
    return 'others'
}

export function getEffectiveCategory(m: { category?: string | null; title?: string }): string {
    // If category is explicitly set (including 'others'), respect it
    if (m.category !== null && m.category !== undefined) {
        return m.category;
    }
    // Fallback to title matching only when category is not set
    return mapPageToCategory(m.title || '');
}
