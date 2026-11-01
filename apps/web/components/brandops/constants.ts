import { BrandCategory, SemanticRelationship, BrandFlowTemplate } from './types';

export const CATEGORY_CONFIG: Record<BrandCategory, {
    label: string;
    description: string;
    color: string;
    border: string;
    bg: string;
    gradient: string;
    badge: string;
}> = {
    discovery: {
        label: 'Discovery',
        description: 'Pesquisa, inteligência de mercado, concorrentes e referências',
        color: '#06D6A0',
        border: 'rgba(6, 214, 160, 0.4)',
        bg: 'rgba(6, 214, 160, 0.08)',
        gradient: 'from-[#06D6A0] to-[#0496ff]',
        badge: 'bg-[#06D6A0]/15 text-[#06D6A0] border-[#06D6A0]/30'
    },
    strategy: {
        label: 'Strategy',
        description: 'Fundação, propósito, posicionamento, público e pilares da marca',
        color: '#FF6600',
        border: 'rgba(255, 102, 0, 0.4)',
        bg: 'rgba(255, 102, 0, 0.08)',
        gradient: 'from-[#FF6600] to-[#FFB703]',
        badge: 'bg-[#FF6600]/15 text-[#FF6600] border-[#FF6600]/30'
    },
    verbal_identity: {
        label: 'Verbal Identity',
        description: 'Como a marca fala: naming, mensagens, narrativa e tom de voz',
        color: '#9D4EDD',
        border: 'rgba(157, 78, 221, 0.4)',
        bg: 'rgba(157, 78, 221, 0.08)',
        gradient: 'from-[#9D4EDD] to-[#7B2CBF]',
        badge: 'bg-[#9D4EDD]/15 text-[#9D4EDD] border-[#9D4EDD]/30'
    },
    visual_identity: {
        label: 'Visual Identity',
        description: 'Como a marca aparece: logo, cores, tipografia e diretrizes',
        color: '#FF0054',
        border: 'rgba(255, 0, 84, 0.4)',
        bg: 'rgba(255, 0, 84, 0.08)',
        gradient: 'from-[#FF0054] to-[#88007F]',
        badge: 'bg-[#FF0054]/15 text-[#FF0054] border-[#FF0054]/30'
    },
    sensorial_identity: {
        label: 'Sensorial Identity',
        description: 'Como a marca é sentida: áudio, sons de interface, toque e aroma',
        color: '#3A86FF',
        border: 'rgba(58, 134, 255, 0.4)',
        bg: 'rgba(58, 134, 255, 0.08)',
        gradient: 'from-[#3A86FF] to-[#00F5D4]',
        badge: 'bg-[#3A86FF]/15 text-[#3A86FF] border-[#3A86FF]/30'
    },
    behavioural_identity: {
        label: 'Behavioural Identity',
        description: 'Como a marca age: experiência, princípios de atendimento e cultura',
        color: '#4361EE',
        border: 'rgba(67, 97, 238, 0.4)',
        bg: 'rgba(67, 97, 238, 0.08)',
        gradient: 'from-[#4361EE] to-[#3A0CA3]',
        badge: 'bg-[#4361EE]/15 text-[#4361EE] border-[#4361EE]/30'
    },
    activation: {
        label: 'Activation',
        description: 'Campanhas, conteúdo, redes sociais, landing pages e outputs',
        color: '#F72585',
        border: 'rgba(247, 37, 133, 0.4)',
        bg: 'rgba(247, 37, 133, 0.08)',
        gradient: 'from-[#F72585] to-[#B5179E]',
        badge: 'bg-[#F72585]/15 text-[#F72585] border-[#F72585]/30'
    },
    governance: {
        label: 'Governance & Decisions',
        description: 'Regras oficiais, decisões estratégicas aprovadas e auditorias',
        color: '#10B981',
        border: 'rgba(16, 185, 129, 0.4)',
        bg: 'rgba(16, 185, 129, 0.08)',
        gradient: 'from-[#10B981] to-[#047857]',
        badge: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
    },
    intelligence: {
        label: 'Intelligence',
        description: 'Brand Health, consistência, métricas e recomendações de evolução',
        color: '#00F5D4',
        border: 'rgba(0, 245, 212, 0.4)',
        bg: 'rgba(0, 245, 212, 0.08)',
        gradient: 'from-[#00F5D4] to-[#06D6A0]',
        badge: 'bg-[#00F5D4]/15 text-[#00F5D4] border-[#00F5D4]/30'
    },
    agent: {
        label: 'AI Agents',
        description: 'Agentes especializados autónomos que processam contexto e geram outputs',
        color: '#88007F',
        border: 'rgba(136, 0, 127, 0.4)',
        bg: 'rgba(136, 0, 127, 0.08)',
        gradient: 'from-[#FF0054] via-[#88007F] to-[#311C99]',
        badge: 'bg-[#88007F]/15 text-[#FF0054] border-[#88007F]/30'
    },
    utility: {
        label: 'Utility Nodes',
        description: 'Inputs, ficheiros, notas, prompts, aprovações e outputs operacionais',
        color: '#52525B',
        border: 'rgba(82, 82, 91, 0.35)',
        bg: 'rgba(82, 82, 91, 0.06)',
        gradient: 'from-[#71717A] to-[#3F3F46]',
        badge: 'bg-zinc-100 text-zinc-600 border-zinc-200'
    }
};

export const RELATIONSHIP_CONFIG: Record<SemanticRelationship, {
    label: string;
    description: string;
    color: string;
}> = {
    supports: { label: 'Suporta', description: 'Fornece evidência e validação', color: '#10B981' },
    depends_on: { label: 'Depende de', description: 'Requer output prévio para existir', color: '#F59E0B' },
    derived_from: { label: 'Deriva de', description: 'Criado a partir da análise de', color: '#3B82F6' },
    influences: { label: 'Influencia', description: 'Modela o comportamento ou formato', color: '#8B5CF6' },
    uses: { label: 'Utiliza', description: 'Consome os assets ou diretrizes', color: '#06D6A0' },
    applies_to: { label: 'Aplica-se a', description: 'Regra ou elemento aplicado ao alvo', color: '#EC4899' },
    belongs_to: { label: 'Pertence a', description: 'Parte de um agrupamento', color: '#6B7280' },
    contradicts: { label: 'Contradiz', description: 'Conflita com diretriz existente', color: '#EF4444' },
    replaces: { label: 'Substitui', description: 'Atualização que revoga a versão anterior', color: '#F97316' },
    generated_from: { label: 'Gerado de', description: 'Output gerado por IA através de', color: '#FF0054' },
    validated_by: { label: 'Validado por', description: 'Aprovado ou checado por', color: '#10B981' }
};

export interface NodeCatalogItem {
    type: string;
    title: string;
    category: BrandCategory;
    description: string;
    defaultContent: any;
    recommendedInputs?: string[];
    recommendedOutputs?: string[];
    isAiSupported?: boolean;
}

export const NODE_CATALOG: NodeCatalogItem[] = [
    // UTILITY NODES — building blocks that can be composed with any BrandOps workflow.
    { type: 'text', title: 'Text', category: 'utility', description: 'Escreve um briefing, prompt ou conteúdo livre.', defaultContent: { text: '' } },
    { type: 'image', title: 'Image', category: 'utility', description: 'Adiciona uma imagem de referência ou asset visual.', defaultContent: { url: '', alt: '' } },
    { type: 'video', title: 'Video', category: 'utility', description: 'Adiciona um vídeo de referência ou output.', defaultContent: { url: '', caption: '' } },
    { type: 'audio', title: 'Audio', category: 'utility', description: 'Adiciona uma referência sonora ou gravação.', defaultContent: { url: '', caption: '' } },
    { type: 'file', title: 'File', category: 'utility', description: 'Liga um documento, PDF, SVG ou outro ficheiro.', defaultContent: { name: '', url: '', mimeType: '' } },
    { type: 'url', title: 'URL', category: 'utility', description: 'Guarda uma fonte, site ou referência externa.', defaultContent: { url: '', title: '' } },
    { type: 'note', title: 'Note', category: 'utility', description: 'Regista uma nota de trabalho no Space.', defaultContent: { text: '' } },
    { type: 'comment', title: 'Comment', category: 'utility', description: 'Deixa feedback contextual para a equipa.', defaultContent: { text: '', mentions: [] } },
    { type: 'ai_prompt', title: 'AI Prompt', category: 'utility', description: 'Define uma instrução reutilizável para um agente.', defaultContent: { prompt: '' }, isAiSupported: true },
    { type: 'ai_agent', title: 'AI Agent', category: 'utility', description: 'Executa um agente com os inputs conectados.', defaultContent: { instructions: '', mode: 'proposal' }, isAiSupported: true },
    { type: 'output', title: 'Output', category: 'utility', description: 'Agrupa ou publica o resultado de uma operação.', defaultContent: { summary: '' } },
    { type: 'approval', title: 'Approval', category: 'utility', description: 'Cria um checkpoint obrigatório de revisão humana.', defaultContent: { status: 'pending', rationale: '' } },
    { type: 'decision', title: 'Decision', category: 'utility', description: 'Regista uma decisão com racional e autoridade.', defaultContent: { decision: '', rationale: '', status: 'draft' } },

    // DISCOVERY
    {
        type: 'research',
        title: 'Pesquisa de Mercado',
        category: 'discovery',
        description: 'Mapeamento do setor, dinâmicas de consumo e dados primários',
        defaultContent: { summary: 'Análise de mercado com foco em hábitos e crescimento.', sources: ['Relatório Setorial 2026', 'Entrevistas'], metrics: { marketSize: '$4.2B', growth: '+14% YoY' } },
        isAiSupported: true
    },
    {
        type: 'competitor',
        title: 'Análise de Concorrentes',
        category: 'discovery',
        description: 'Benchmark competitivo, pontos fortes, fraquezas e white spaces',
        defaultContent: { competitors: ['Concorrente A (Tradicional)', 'Concorrente B (Digital)'], whiteSpaces: ['Foco em sustentabilidade premium', 'Experiência urbana ágil'] },
        isAiSupported: true
    },
    {
        type: 'insight',
        title: 'Insight Estratégico',
        category: 'discovery',
        description: 'Compreensão profunda e reveladora sobre o consumidor ou mercado',
        defaultContent: { insight: 'O público urbano valoriza o ritual do café como uma pausa de foco e status, não apenas cafeína.', tension: 'Falta de opções que combinem origem nobre com embalagem contemporânea.' },
        isAiSupported: true
    },
    {
        type: 'trend',
        title: 'Tendência Cultural',
        category: 'discovery',
        description: 'Macrotendências e comportamentos emergentes que impactam a marca',
        defaultContent: { trend: 'Neo-Ancestralidade & Origem Orgulhosa', impact: 'Consumidores preferem marcas que celebram raízes culturais com sofisticação global.' },
        isAiSupported: true
    },

    // STRATEGY
    {
        type: 'purpose',
        title: 'Propósito da Marca',
        category: 'strategy',
        description: 'A razão fundamental de existir da marca além do lucro',
        defaultContent: { statement: 'Elevar o ritual diário conectando pessoas à autenticidade da nossa origem.', rationale: 'Posiciona a marca com relevância emocional duradoura.' },
        isAiSupported: true
    },
    {
        type: 'mission_vision',
        title: 'Missão & Visão',
        category: 'strategy',
        description: 'O compromisso presente e a ambição de futuro da organização',
        defaultContent: { mission: 'Produzir e entregar café de padrão mundial com impacto social positivo.', vision: 'Ser a marca de referência da África contemporânea nos principais centros urbanos do mundo até 2030.' },
        isAiSupported: true
    },
    {
        type: 'values',
        title: 'Valores da Marca',
        category: 'strategy',
        description: 'Princípios inegociáveis que orientam todas as decisões',
        defaultContent: { values: ['Autenticidade Sem Filtros', 'Rigor Artesanal', 'Sofisticação Urbana', 'Impacto Regenerativo'] },
        isAiSupported: true
    },
    {
        type: 'audience',
        title: 'Público & Personas (ICP)',
        category: 'strategy',
        description: 'Perfil detalhado do cliente ideal, dores, desejos e jobs to be done',
        defaultContent: { segment: 'Jovens Profissionais & Criativos Urbanos (25-42 anos)', pains: ['Cafés tradicionais antiquados', 'Falta de conexão com a identidade local'], desires: ['Experiência sensorial elevada', 'Design sofisticado no ambiente de trabalho'], jtb: 'Ter um ritual sofisticado que reflita a minha identidade e bom gosto.' },
        isAiSupported: true
    },
    {
        type: 'positioning',
        title: 'Posicionamento Estratégico',
        category: 'strategy',
        description: 'Declaração de posicionamento, proposta de valor e diferenciação única',
        defaultContent: { 
            statement: 'Para criadores e profissionais urbanos que buscam excelência, nossa marca é o café de especialidade que transforma o ritual diário numa experiência de distinção cultural.',
            valueProposition: 'O encontro do café de terroir africano com a estética do design contemporâneo.',
            reasonsToBelieve: ['Grãos 100% de origem controlada de altitude', 'Torra em microlotes com perfil sensorial exclusivo']
        },
        isAiSupported: true
    },
    {
        type: 'personality',
        title: 'Personalidade & Arquétipo',
        category: 'strategy',
        description: 'Traços humanos, arquétipo de Jung e tom essencial da marca',
        defaultContent: { archetype: 'O Criador / O Explorador Sofisticado', traits: ['Confiante', 'Sensorial', 'Cosmopolita', 'Orgulhoso das Raízes'], tone: 'Elevado, direto, caloroso e inteligente.' },
        isAiSupported: true
    },

    // VERBAL IDENTITY
    {
        type: 'naming',
        title: 'Naming & Descriptor',
        category: 'verbal_identity',
        description: 'Nome da marca, alternativas fonéticas, significado e descritor',
        defaultContent: { name: 'KAFÉA', descriptor: 'Specialty African Roast', meaning: 'Fusão de Kafe (raiz africana) com modernidade e ritmo.', phonetic: 'ka-fé-a' },
        isAiSupported: true
    },
    {
        type: 'tagline',
        title: 'Tagline & Slogan',
        category: 'verbal_identity',
        description: 'Assinatura verbal que sintetiza a essência da marca',
        defaultContent: { tagline: 'Origin in Every Ritual', alternatives: ['A Origem do Foco', 'Puro Cultivo. Puro Design.'] },
        isAiSupported: true
    },
    {
        type: 'messaging_pillars',
        title: 'Pilares de Mensagem',
        category: 'verbal_identity',
        description: 'Mensagens-chave estruturadas por público, produto e valor',
        defaultContent: { pillars: [
            { pillar: 'Herança & Terroir', message: 'Das montanhas de Angola diretamente para a tua xícara.' },
            { pillar: 'Design & Ritual', message: 'Mais do que cafeína: um objeto de design no teu dia.' },
            { pillar: 'Sustentabilidade Real', message: 'Comércio justo que valoriza cada cooperativa local.' }
        ]},
        isAiSupported: true
    },
    {
        type: 'tone_of_voice',
        title: 'Tom de Voz & Vocabulário',
        category: 'verbal_identity',
        description: 'Diretrizes de comunicação verbal: palavras que usamos e evitamos',
        defaultContent: {
            tone: 'Distinto, seguro, acolhedor e poético sem ser prolixo.',
            wordsWeUse: ['Ritual', 'Origem', 'Extração', 'Distinção', 'Microlote', 'Harmonia'],
            wordsWeAvoid: ['Barato', 'Comum', 'Padronizado', 'Genérico', 'Commodity']
        },
        isAiSupported: true
    },
    {
        type: 'brand_manifesto',
        title: 'Manifesto da Marca',
        category: 'verbal_identity',
        description: 'O texto inspirador que sintetiza a alma e o grito de guerra da marca',
        defaultContent: {
            manifesto: 'Não fazemos apenas café. Moldamos momentos de clareza em meio ao caos urbano. Das terras vermelhas ao vidro translúcido, cada gota carrega a força de uma terra viva. O nosso ritual não é pressa; é presença.'
        },
        isAiSupported: true
    },

    // VISUAL IDENTITY
    {
        type: 'color_system',
        title: 'Sistema Cromático',
        category: 'visual_identity',
        description: 'Paleta primária, secundária, neutros e regras de contraste com códigos HEX/RGB',
        defaultContent: {
            palette: [
                { name: 'Terreiro Brown', hex: '#2A1810', pantone: 'Pantone 4625 C', role: 'Primária' },
                { name: 'Brivio Crimson', hex: '#FF0054', pantone: 'Pantone 1925 C', role: 'Acento / Destaque' },
                { name: 'Savannah Gold', hex: '#E0A96D', pantone: 'Pantone 728 C', role: 'Secundária' },
                { name: 'Warm Cream', hex: '#F8F5F0', pantone: 'Pantone Warm Gray 1 C', role: 'Fundo Neutro' },
                { name: 'Obsidian Black', hex: '#111114', pantone: 'Pantone Black 6 C', role: 'Texto Primário' }
            ]
        },
        isAiSupported: true
    },
    {
        type: 'typography_system',
        title: 'Sistema Tipográfico',
        category: 'visual_identity',
        description: 'Famílias tipográficas primária, display, editorial e hierarquia de texto',
        defaultContent: {
            primary: { font: 'Inter', weights: ['Regular 400', 'SemiBold 600', 'Bold 700'], role: 'Interface & Texto Corrido' },
            display: { font: 'Playfair Display', weights: ['Medium 500', 'Bold 700 Italic'], role: 'Títulos & Manifesto' },
            mono: { font: 'JetBrains Mono', weights: ['Regular 400'], role: 'Microlotes & Dados Técnicos' }
        },
        isAiSupported: true
    },
    {
        type: 'logo_system',
        title: 'Sistema de Logotipo',
        category: 'visual_identity',
        description: 'Logotipo principal, símbolo, monograma, margem de segurança e tamanhos mínimos',
        defaultContent: {
            variants: ['Horizontal Principal', 'Monograma Isomórfico', 'Badge Circular para Embalagem'],
            clearSpace: 'Altura do glifo K em toda a volta.',
            minSizeDigital: '24px de altura',
            minSizePrint: '12mm de largura'
        },
        isAiSupported: true
    },
    {
        type: 'photography_direction',
        title: 'Direção Fotográfica',
        category: 'visual_identity',
        description: 'Tratamento de luz, textura, ambiente, humanos e regras para IA',
        defaultContent: {
            lighting: 'Luz natural lateral quente, sombras suaves e texturas palpáveis.',
            subjects: 'Mãos no processo de preparação, grãos torrados e retratos de profissionais em ambientes contemporâneos.',
            colorGrading: 'Tons terrosos cinematográficos com destaque para dourados e vermelhos profundos.'
        },
        isAiSupported: true
    },

    // SENSORIAL IDENTITY
    {
        type: 'sonic_identity',
        title: 'Identidade Sonora & Audio Logo',
        category: 'sensorial_identity',
        description: 'Sonic logo, assinatura musical, soundscape para espaços físicos e apps',
        defaultContent: {
            audioLogo: 'Acorde cálido de kalimba seguido de nota de violoncelo profunda (2.5s)',
            brandSoundtrack: 'Neo-soul acústico com batidas downtempo orgânicas.',
            uiSounds: 'Clique suave e amadeirado nas interações do app.'
        },
        isAiSupported: true
    },

    // BEHAVIOURAL IDENTITY
    {
        type: 'behaviour_culture',
        title: 'Comportamentos & Rituais',
        category: 'behavioural_identity',
        description: 'Princípios de atendimento, rituais internos de equipa e hospitalidade',
        defaultContent: {
            principles: [
                'Calma Confiante: Nunca demonstrar pressa desnecessária perante o cliente.',
                'Educação Generosa: Explicar a nota sensorial do café sem condescendência.',
                'Atenção ao Detalhe: Xícaras sempre aquecidas antes da extração.'
            ]
        },
        isAiSupported: true
    },

    // ACTIVATION
    {
        type: 'campaign_launch',
        title: 'Campanha de Ativação / Lançamento',
        category: 'activation',
        description: 'Conceito da campanha, narrativa de lançamento, canais e peças chave',
        defaultContent: {
            campaignName: 'O Primeiro Gole da Origem',
            bigIdea: 'Troque o automático pelo extraordinário.',
            channels: ['Instagram Reels / TikTok', 'Pop-up Sensory Experience', 'Edição Limitada Founders Pack'],
            deliverables: ['3x Vídeos Hero', '10x Posts Carrossel', 'Página de Pré-Lançamento']
        },
        isAiSupported: true
    },
    {
        type: 'packaging_concept',
        title: 'Diretriz de Packaging',
        category: 'activation',
        description: 'Design de embalagem, materiais ecológicos e acabamentos especiais',
        defaultContent: {
            materials: 'Papel kraft cru de alta gramatura com válvula biodegradável.',
            finishes: 'Hot stamping em foil dourado mate e etiqueta numerada à mão.'
        },
        isAiSupported: true
    },

    // GOVERNANCE & DECISION
    {
        type: 'brand_decision',
        title: 'Decisão Estratégica Oficial',
        category: 'governance',
        description: 'Registro imutável de decisão estratégica aprovada com racional e autor',
        defaultContent: {
            decisionNumber: 28,
            title: 'Aprovação da Paleta Terreiro & Crimson como Identidade Oficial',
            rationale: 'Testes com público demonstraram 88% de associação com qualidade premium e diferenciação em gôndola.',
            decision: 'Aprovado por aclamação da liderança criativa.',
            status: 'approved'
        },
        isAiSupported: false
    },
    {
        type: 'brand_guardian_audit',
        title: 'Brand Guardian Audit',
        category: 'governance',
        description: 'Avaliação de conformidade com directrizes de marca: logo, cores e tom de voz',
        defaultContent: {
            status: 'conforme',
            score: 94,
            checks: [
                { item: 'Utilização do Logotipo', status: 'pass', note: 'Margens e contraste adequados' },
                { item: 'Paleta Cromática', status: 'pass', note: 'Uso exato de Terreiro Brown e Crimson' },
                { item: 'Tom de Voz', status: 'warning', note: 'Verificar adjetivos na headline da campanha' }
            ]
        },
        isAiSupported: true
    },

    // AI AGENTS
    {
        type: 'agent_brand_strategist',
        title: 'Agente: Brand Strategist',
        category: 'agent',
        description: 'Agente que processa pesquisa e gera posicionamento, pilares e proposta de valor',
        defaultContent: { mode: 'Autonomous', capabilities: ['Synthesis', 'Positioning Formulation', 'Differentiation Matrix'] },
        isAiSupported: true
    },
    {
        type: 'agent_creative_director',
        title: 'Agente: Creative Director',
        category: 'agent',
        description: 'Agente que traduz estratégia em conceitos visuais, moodboards e direção de arte',
        defaultContent: { mode: 'Generative', capabilities: ['Palette generation', 'Visual style coherence', 'Design critique'] },
        isAiSupported: true
    },
    {
        type: 'agent_brand_guardian',
        title: 'Agente: Brand Guardian',
        category: 'agent',
        description: 'Guardião autónomo que audita peças e outputs em tempo real contra as diretrizes oficiais',
        defaultContent: { mode: 'Audit & Enforcement', capabilities: ['Contrast checking', 'Voice consistency', 'Asset validation'] },
        isAiSupported: true
    }
];

export const BRAND_FLOW_TEMPLATES: BrandFlowTemplate[] = [
    {
        id: 'complete-brand-scratch',
        name: 'Build Brand From Scratch',
        description: 'O processo completo de ponta a ponta: Discovery → Estratégia → Identidade Verbal & Visual → Ativação → Brand Book.',
        category: 'Complete Branding',
        difficulty: 'Avançado',
        nodes_count: 14,
        estimated_time: '25 min com IA',
        tags: ['End-to-End', 'Master Brand', 'Complete'],
        initial_nodes: [],
        initial_edges: []
    },
    {
        id: 'brand-strategy-core',
        name: 'Brand Strategy Core',
        description: 'Definição essencial de fundação: Propósito, Missão, Visão, Valores, Público-Alvo e Posicionamento.',
        category: 'Strategy',
        difficulty: 'Intermédio',
        nodes_count: 6,
        estimated_time: '10 min',
        tags: ['Strategy', 'Positioning', 'Audience'],
        initial_nodes: [],
        initial_edges: []
    },
    {
        id: 'visual-identity-system',
        name: 'Visual Identity System',
        description: 'Direção criativa: Logotipo, Cores HEX/Pantone, Tipografia, Linguagem Gráfica e Packaging.',
        category: 'Visual Identity',
        difficulty: 'Criativo',
        nodes_count: 7,
        estimated_time: '15 min',
        tags: ['Colors', 'Typography', 'Logo'],
        initial_nodes: [],
        initial_edges: []
    },
    {
        id: 'naming-messaging-sprint',
        name: 'Naming & Verbal Sprint',
        description: 'Geração e validação de nomes, taglines, pilares de mensagem e tom de voz com IA.',
        category: 'Verbal Identity',
        difficulty: 'Rápido',
        nodes_count: 5,
        estimated_time: '8 min',
        tags: ['Naming', 'Tagline', 'Voice'],
        initial_nodes: [],
        initial_edges: []
    },
    {
        id: 'rebranding-audit-pivot',
        name: 'Rebranding & Audit Flow',
        description: 'Audite a marca existente, identifique problemas e construa a rota de reposicionamento.',
        category: 'Rebranding',
        difficulty: 'Avançado',
        nodes_count: 8,
        estimated_time: '18 min',
        tags: ['Rebrand', 'Audit', 'Evolution'],
        initial_nodes: [],
        initial_edges: []
    },
    {
        id: 'campaign-launch-engine',
        name: 'Campaign Launch Engine',
        description: 'Desenvolvimento de campanha a partir de posicionamento e tom de voz aprovados.',
        category: 'Activation',
        difficulty: 'Prático',
        nodes_count: 6,
        estimated_time: '12 min',
        tags: ['Campaign', 'Marketing', 'Social'],
        initial_nodes: [],
        initial_edges: []
    }
];
