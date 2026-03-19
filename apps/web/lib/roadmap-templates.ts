/**
 * Predefined roadmap templates
 */
export interface RoadmapTemplate {
    id: string
    name: string
    description: string
    icon: string
    stages: {
        name: string;
        color: string;
        tasks?: {
            title: string
            duration_days: number
            description?: string
            priority?: 'low' | 'medium' | 'high' | 'urgent'
        }[]
    }[]
}

export const ROADMAP_TEMPLATES: RoadmapTemplate[] = [
    {
        id: 'branding',
        name: 'Branding & Identidade',
        description: 'Ideal para projetos de criação de marca',
        icon: '🎨',
        stages: [
            {
                name: 'Briefing',
                color: '#6366f1',
                tasks: [
                    { title: 'Reunião de Alinhamento', duration_days: 1, description: 'Reunião inicial com o cliente para entender a visão, valores e objectivos da marca.', priority: 'high' },
                    { title: 'Questionário de Marca', duration_days: 2, description: 'Enviar e analisar questionário detalhado sobre o posicionamento da marca.', priority: 'high' },
                    { title: 'Análise de Concorrência', duration_days: 3, description: 'Pesquisar e analisar as principais marcas concorrentes do mercado.', priority: 'medium' }
                ]
            },
            {
                name: 'Pesquisa',
                color: '#8b5cf6',
                tasks: [
                    { title: 'Moodboard Visual', duration_days: 2, description: 'Criar moodboard com referências visuais, cores e estilos inspiradores.', priority: 'medium' },
                    { title: 'Definição de Atributos', duration_days: 1, description: 'Definir os atributos principais da marca: personalidade, tom, valores.', priority: 'high' },
                    { title: 'Exploração de Tipografia', duration_days: 2, description: 'Pesquisar e selecionar opções tipográficas adequadas à marca.', priority: 'medium' }
                ]
            },
            {
                name: 'Conceito',
                color: '#a855f7',
                tasks: [
                    { title: 'Esboços Iniciais', duration_days: 3, description: 'Desenvolver esboços e rascunhos iniciais do conceito visual.', priority: 'high' },
                    { title: 'Desenvolvimento do Logotipo', duration_days: 4, description: 'Criar e refinar variações do logotipo principal.', priority: 'urgent' },
                    { title: 'Seleção de Paleta de Cores', duration_days: 2, description: 'Definir a paleta de cores principal e secundária da marca.', priority: 'high' }
                ]
            },
            {
                name: 'Design',
                color: '#d946ef',
                tasks: [
                    { title: 'Aplicação em Papelaria', duration_days: 3, description: 'Aplicar a identidade em cartões, papel timbrado, envelopes, etc.', priority: 'medium' },
                    { title: 'Design de Redes Sociais', duration_days: 2, description: 'Criar templates para perfil, capa e posts nas redes sociais.', priority: 'medium' },
                    { title: 'Manual Básico da Marca', duration_days: 3, description: 'Documentar regras de uso da marca, cores, tipografia e aplicações.', priority: 'high' }
                ]
            },
            {
                name: 'Refinamento',
                color: '#ec4899',
                tasks: [
                    { title: 'Ajustes Baseados em Feedback', duration_days: 3, description: 'Incorporar feedback do cliente e refinar os materiais.', priority: 'high' },
                    { title: 'Finalização de Arquivos', duration_days: 2, description: 'Preparar todos os arquivos finais em formatos adequados.', priority: 'medium' }
                ]
            },
            {
                name: 'Entrega',
                color: '#14b8a6',
                tasks: [
                    { title: 'Apresentação Final', duration_days: 1, description: 'Apresentar o projecto completo ao cliente com explicação detalhada.', priority: 'high' },
                    { title: 'Entrega do Brandbook', duration_days: 1, description: 'Entregar o brandbook digital e todos os arquivos finais.', priority: 'urgent' }
                ]
            },
        ]
    },
    {
        id: 'rebranding',
        name: 'Rebranding',
        description: 'Evolução e reposicionamento de marca existente',
        icon: '🔄',
        stages: [
            {
                name: 'Audit de Marca',
                color: '#6366f1',
                tasks: [
                    { title: 'Análise da Identidade Atual', duration_days: 2 },
                    { title: 'Entrevistas com Stakeholders', duration_days: 3 },
                    { title: 'Identificação de Pontos de Dor', duration_days: 2 }
                ]
            },
            {
                name: 'Estratégia',
                color: '#8b5cf6',
                tasks: [
                    { title: 'Novo Posicionamento', duration_days: 3 },
                    { title: 'Tom de Voz e Mensagens', duration_days: 2 }
                ]
            },
            {
                name: 'Identidade Visual',
                color: '#a855f7',
                tasks: [
                    { title: 'Evolução do Logotipo', duration_days: 5 },
                    { title: 'Sistema Visual Dinâmico', duration_days: 4 }
                ]
            },
            {
                name: 'Implementação',
                color: '#d946ef',
                tasks: [
                    { title: 'Actualização de Touchpoints', duration_days: 5 },
                    { title: 'Lançamento Interno', duration_days: 2 }
                ]
            }
        ]
    },
    {
        id: 'editorial',
        name: 'Design Editorial',
        description: 'Criação de revistas, catálogos e livros',
        icon: '📚',
        stages: [
            {
                name: 'Estruturação',
                color: '#f59e0b',
                tasks: [
                    { title: 'Definição de Grid e Layout', duration_days: 3 },
                    { title: 'Escolha Tipográfica Editorial', duration_days: 2 }
                ]
            },
            {
                name: 'Paginação',
                color: '#eab308',
                tasks: [
                    { title: 'Montagem de Conteúdo', duration_days: 7 },
                    { title: 'Tratamento de Imagens', duration_days: 4 }
                ]
            },
            {
                name: 'Revisão',
                color: '#84cc16',
                tasks: [
                    { title: 'Revisão Ortográfica', duration_days: 3 },
                    { title: 'Boneco Integral (Mockup)', duration_days: 2 }
                ]
            },
            {
                name: 'Produção',
                color: '#10b981',
                tasks: [
                    { title: 'Fechamento de Arquivos para Gráfica', duration_days: 2 },
                    { title: 'Acompanhamento de Impressão', duration_days: 3 }
                ]
            }
        ]
    },
    {
        id: 'product-design',
        name: 'Design de Produto',
        description: 'Design de experiência e interface de produto',
        icon: '💎',
        stages: [
            {
                name: 'Discovery',
                color: '#3b82f6',
                tasks: [
                    { title: 'User Research', duration_days: 5 },
                    { title: 'User Personas e Jornadas', duration_days: 3 }
                ]
            },
            {
                name: 'Arquitetura',
                color: '#6366f1',
                tasks: [
                    { title: 'Sitemap e Fluxogramas', duration_days: 2 },
                    { title: 'Wireframes de Baixa Fidelidade', duration_days: 4 }
                ]
            },
            {
                name: 'Interface (UI)',
                color: '#8b5cf6',
                tasks: [
                    { title: 'Criação de Componentes', duration_days: 5 },
                    { title: 'Layouts de Alta Fidelidade', duration_days: 7 }
                ]
            },
            {
                name: 'Prototipagem',
                color: '#a855f7',
                tasks: [
                    { title: 'Protótipo Interativo', duration_days: 3 },
                    { title: 'Testes de Usabilidade', duration_days: 4 }
                ]
            }
        ]
    },
    {
        id: 'design-system',
        name: 'Design System',
        description: 'Criação de linguagem visual escalável',
        icon: '⚙️',
        stages: [
            {
                name: 'Fundamentos',
                color: '#06b6d4',
                tasks: [
                    { title: 'Definição de Cores e Tipografia', duration_days: 3 },
                    { title: 'Iconografia e Espaçamento', duration_days: 3 }
                ]
            },
            {
                name: 'Componentes',
                color: '#0ea5e9',
                tasks: [
                    { title: 'Botões e Inputs', duration_days: 4 },
                    { title: 'Cards e Modais', duration_days: 5 },
                    { title: 'Navegação e Menus', duration_days: 4 }
                ]
            },
            {
                name: 'Documentação',
                color: '#3b82f6',
                tasks: [
                    { title: 'Regras de Uso e Boas Práticas', duration_days: 5 },
                    { title: 'Guia de Estilo Online', duration_days: 4 }
                ]
            }
        ]
    },
    {
        id: 'naming',
        name: 'Naming',
        description: 'Criação de nomes para marcas e produtos',
        icon: '🏷️',
        stages: [
            {
                name: 'Estratégia de Naming',
                color: '#ef4444',
                tasks: [
                    { title: 'Atributos e Territórios Semânticos', duration_days: 2 },
                    { title: 'Critérios de Avaliação', duration_days: 1 }
                ]
            },
            {
                name: 'Geração',
                color: '#f97316',
                tasks: [
                    { title: 'Brainstorming de Nomes', duration_days: 4 },
                    { title: 'Shortlist de Candidatos', duration_days: 2 }
                ]
            },
            {
                name: 'Verificação',
                color: '#f59e0b',
                tasks: [
                    { title: 'Busca de Domínios e Redes Sociais', duration_days: 2 },
                    { title: 'Verificação INPI (Preliminar)', duration_days: 3 }
                ]
            },
            {
                name: 'Apresentação',
                color: '#eab308',
                tasks: [
                    { title: 'Argumentação Criativa', duration_days: 2 },
                    { title: 'Seleção Final', duration_days: 1 }
                ]
            }
        ]
    },
    {
        id: 'video',
        name: 'Produção de Vídeo',
        description: 'Para projetos audiovisuais',
        icon: '🎬',
        stages: [
            { name: 'Pré-Produção', color: '#f59e0b', tasks: [{ title: 'Concept Art', duration_days: 3 }] },
            { name: 'Roteiro', color: '#eab308', tasks: [{ title: 'Escrita de Script', duration_days: 4 }] },
            { name: 'Filmagem', color: '#84cc16', tasks: [{ title: 'Captação de Imagens', duration_days: 5 }] },
            { name: 'Edição', color: '#22c55e', tasks: [{ title: 'Corte e Montagem', duration_days: 5 }] },
            { name: 'Cor & Som', color: '#10b981', tasks: [{ title: 'Tratamento de Áudio', duration_days: 3 }] },
            { name: 'Entrega Final', color: '#14b8a6', tasks: [{ title: 'Exportação e Upload', duration_days: 1 }] },
        ]
    },
    {
        id: 'web',
        name: 'Website / App',
        description: 'Para projetos de desenvolvimento',
        icon: '💻',
        stages: [
            { name: 'Discovery', color: '#3b82f6', tasks: [{ title: 'Briefing Técnico', duration_days: 2 }] },
            { name: 'UX/UI Design', color: '#6366f1', tasks: [{ title: 'Prototipagem', duration_days: 5 }] },
            { name: 'Desenvolvimento', color: '#8b5cf6', tasks: [{ title: 'Clean Code Implementation', duration_days: 10 }] },
            { name: 'Testes', color: '#a855f7', tasks: [{ title: 'QA e Bugs', duration_days: 3 }] },
            { name: 'Deploy', color: '#14b8a6', tasks: [{ title: 'Lançamento', duration_days: 1 }] },
        ]
    },
    {
        id: 'marketing',
        name: 'Campanha de Marketing',
        description: 'Para campanhas publicitárias',
        icon: '📣',
        stages: [
            { name: 'Estratégia', color: '#ef4444', tasks: [{ title: 'Planeamento de Media', duration_days: 3 }] },
            { name: 'Criação', color: '#f97316', tasks: [{ title: 'Peças Criativas', duration_days: 5 }] },
            { name: 'Produção', color: '#f59e0b', tasks: [{ title: 'Setup de Anúncios', duration_days: 2 }] },
            { name: 'Lançamento', color: '#eab308', tasks: [{ title: 'Go-Live', duration_days: 1 }] },
            { name: 'Análise', color: '#22c55e', tasks: [{ title: 'Relatórios de Performance', duration_days: 3 }] },
        ]
    },
    {
        id: 'social',
        name: 'Social Media',
        description: 'Gestão de redes sociais',
        icon: '📱',
        stages: [
            { name: 'Planeamento', color: '#06b6d4', tasks: [{ title: 'Calendário Editorial', duration_days: 2 }] },
            { name: 'Criação de Conteúdo', color: '#0ea5e9', tasks: [{ title: 'Design de Posts', duration_days: 4 }] },
            { name: 'Revisão', color: '#3b82f6', tasks: [{ title: 'Feedback Cliente', duration_days: 2 }] },
            { name: 'Agendamento', color: '#6366f1', tasks: [{ title: 'Setup Plataformas', duration_days: 1 }] },
            { name: 'Publicação', color: '#14b8a6', tasks: [{ title: 'Post Final', duration_days: 1 }] },
        ]
    },
    {
        id: 'custom',
        name: 'Personalizado',
        description: 'Comece do zero',
        icon: '✨',
        stages: []
    }
]
