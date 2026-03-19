import { Block } from "@/components/proposals/builder/editor/types"

const sections = [
    { title: '01. Capa', type: 'intro' },
    { title: '02. Manifesto', type: 'text' },
    { title: '03. O Desafio', type: 'text' },
    { title: '04. A Solução', type: 'text' },
    { title: '05. Roadmap', type: 'timeline' },
    { title: '06. Investimento', type: 'pricing' },
    { title: '07. ADN/Equipa', type: 'text' },
    { title: '08. Termos', type: 'text' },
    { title: '09. Assinatura', type: 'signature' }
]

export const getTemplateModules = (proposalId: string, templateId?: string, templateName?: string) => {
    const normalizedId = templateId?.toLowerCase() || "";
    const name = templateName?.toLowerCase() || "";

    // Match by specialized IDs OR specific names (to be ultra safe)
    const isAbstract = normalizedId === '98a35567-c25e-4c75-961e-1286c4f86f34' || name.includes('abstract')
    const isSphere = normalizedId === '00194458-124b-4a58-8671-50e5088f1dc3' || name.includes('sphere')
    const isHorizon = normalizedId === '11294abd-724d-4a18-9671-50e5088f1dc3' || name.includes('horizon')
    const isAec = normalizedId === 'aec_standard_v1' || name.includes('aec') || name.includes('arquitetura')

    const settingsModule = (styles: any) => ({
        proposal_id: proposalId,
        order: -1,
        title: 'Settings',
        type: 'settings',
        content_json: { settings: styles }
    })

    if (isAec) {
        return [
            settingsModule({
                visibility: 'visible',
                menu_background: '#ffffff',
                attachment_bg: '#1a1a1a',
                highlights_bg: '#1a1a1a',
                highlights_text: '#ffffff',
                text_card_icon: '#1a1a1a',
                text_card_tabs: '#1a1a1a',
                attachment_icon: '#ffffff',
                color_palette: ['#1a1a1a', '#ffffff', '#f4f4f5', '#71717a'],
                main_project_bg: '#ffffff',
                play_audio_bg: '#1a1a1a'
            }),
            {
                proposal_id: proposalId, order: 0, title: '01. Capa', type: 'intro',
                content_json: {
                    blocks: [
                        {
                            id: 'aec-h-1', type: 'headline',
                            content: {
                                text: '{{Nome_Projeto}}',
                                style: { fontSize: '80px', fontWeight: '800', color: '#ffffff', textAlign: 'left', mb: '20px', lineHeight: '1.1' }
                            }
                        },
                        {
                            id: 'aec-h-2', type: 'headline',
                            content: {
                                text: 'Preparado para: {{Nome_Decisor}}',
                                style: { fontSize: '18px', fontWeight: '400', color: '#ffffff', opacity: 0.8, textAlign: 'left', mb: '10px' }
                            }
                        },
                        {
                            id: 'aec-h-3', type: 'headline',
                            content: {
                                text: '{{Data}}',
                                style: { fontSize: '14px', fontWeight: '700', color: '#ffffff', opacity: 0.6, letterSpacing: '0.2em', textAlign: 'left' }
                            }
                        }
                    ],
                    style: {
                        backgroundColor: '#1a1a1a',
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        padding: '160px 80px',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                    }
                }
            },
            {
                proposal_id: proposalId, order: 1, title: '02. Manifesto', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'aec-m-1', type: 'headline', content: { text: 'Resumo Executivo', style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.4em', color: '#1a1a1a', mb: '48px' } } },
                        {
                            id: 'aec-m-2', type: 'layout', content: {
                                columns: [
                                    {
                                        id: 'col-manifesto', blocks: [
                                            {
                                                id: 'aec-m-t', type: 'text', content: {
                                                    text: 'Prezado(a) {{Nome_Decisor}},\n\nObrigado pela oportunidade de discutirmos o futuro da {{Nome_Cliente}}. Com base na nossa última conversa, ficou claro que este não é apenas um projeto de design, mas um passo estratégico.\n\nEsta proposta foi desenhada meticulosamente para resolver os desafios de percepção de valor que identificamos.',
                                                    style: { fontSize: '20px', color: '#3f3f46', lineHeight: '1.8', maxWidth: '800px' }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    style: { backgroundColor: '#ffffff', padding: '120px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 2, title: '03. O Desafio', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'aec-d-h', type: 'headline', content: { text: 'DIAGNÓSTICO', style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.4em', color: '#71717a', mb: '60px' } } },
                        {
                            id: 'aec-d-grid', type: 'layout', content: {
                                columns: [
                                    {
                                        id: 'col-d-1', settings: { backgroundColor: '#ffffff', padding: { top: 40, right: 40, bottom: 40, left: 40 }, radius: 8, borderWidth: 1, borderColor: '#e4e4e7' },
                                        blocks: [
                                            { id: 'aec-d-c1-h', type: 'headline', content: { text: 'O Cenário Atual', style: { fontSize: '24px', fontWeight: '800', mb: '16px' } } },
                                            { id: 'aec-d-c1-t', type: 'text', content: { text: 'Identificamos que a marca enfrenta dificuldades em comunicar o seu valor premium. A identidade visual atual está desconexa dos preços praticados.', style: { fontSize: '16px', color: '#71717a' } } }
                                        ]
                                    },
                                    {
                                        id: 'col-d-2', settings: { backgroundColor: '#ffffff', padding: { top: 40, right: 40, bottom: 40, left: 40 }, radius: 8, borderWidth: 1, borderColor: '#e4e4e7' },
                                        blocks: [
                                            { id: 'aec-d-c2-h', type: 'headline', content: { text: 'Objetivos Desejados', style: { fontSize: '24px', fontWeight: '800', mb: '16px' } } },
                                            { id: 'aec-d-c2-t', type: 'text', content: { text: 'O objetivo principal é alinhar a percepção visual à qualidade da entrega técnica. Queremos criar uma residência digital que transmita sofisticação imediata.', style: { fontSize: '16px', color: '#71717a' } } }
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    style: { backgroundColor: '#f4f4f5', padding: '120px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 3, title: '04. A Solução', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'aec-s-h', type: 'headline', content: { text: 'O ESCOPO DO TRABALHO', style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.4em', color: '#1a1a1a', mb: '60px' } } },
                        {
                            id: 'aec-s-list', type: 'scope-list', content: {
                                items: [
                                    { text: 'Diagnóstico de Marca & Estratégia Visual', checked: true },
                                    { text: 'Design do Logotipo (Primário, Secundário, Ícone)', checked: true },
                                    { text: 'Definição de Tipografia e Paleta Cromática', checked: true },
                                    { text: 'Manual de Normas da Marca (Brandbook PDF)', checked: true },
                                    { text: 'Design de Papelaria (Cartão, Papel Timbrado)', checked: true }
                                ]
                            }
                        }
                    ],
                    style: { backgroundColor: '#ffffff', padding: '120px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 4, title: '05. Roadmap', type: 'timeline',
                content_json: {
                    blocks: [
                        { id: 'aec-r-h', type: 'headline', content: { text: 'METODOLOGIA', style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.4em', color: '#ffffff', mb: '60px' } } },
                        {
                            id: 'aec-r-t', type: 'timeline', content: {
                                items: [
                                    { title: 'Descoberta', date: 'Semanas 1-2', description: 'Briefing, pesquisa de mercado e definição do território visual.' },
                                    { title: 'Criação', date: 'Semanas 3-5', description: 'Exploração de conceitos e desenvolvimento de alternativas.' },
                                    { title: 'Entrega', date: 'Semana 6', description: 'Apresentação, ajustes e exportação de arquivos.' }
                                ]
                            }
                        }
                    ],
                    style: { backgroundColor: '#1a1a1a', padding: '120px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 5, title: '06. Investimento', type: 'pricing',
                content_json: {
                    blocks: [
                        { id: 'aec-p-h', type: 'headline', content: { text: 'INVESTIMENTO', style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.4em', color: '#1a1a1a', mb: '20px', textAlign: 'center' } } },
                        { id: 'aec-p-sh', type: 'headline', content: { text: 'Escolha o nível de profundidade adequado.', style: { fontSize: '24px', fontWeight: '300', color: '#71717a', mb: '80px', textAlign: 'center' } } },
                        {
                            id: 'aec-p-plans', type: 'layout', content: {
                                columns: [
                                    {
                                        id: 'p-1', settings: { backgroundColor: '#ffffff', padding: { top: 40, right: 30, bottom: 40, left: 30 }, radius: 12, borderWidth: 1, borderColor: '#e4e4e7' },
                                        blocks: [
                                            { id: 'p1-n', type: 'headline', content: { text: 'Essential', style: { fontSize: '20px', fontWeight: '800', textAlign: 'center', mb: '8px' } } },
                                            { id: 'p1-p', type: 'headline', content: { text: '2.500 €', style: { fontSize: '32px', fontWeight: '900', textAlign: 'center', mb: '24px' } } },
                                            { id: 'p1-t', type: 'text', content: { text: '• Logo Principal\n• Paleta de Cores\n• Tipografia\n• Guia Básico', style: { fontSize: '14px', lineHeight: '2.5', mb: '40px' } } },
                                            { id: 'p1-b', type: 'button', content: { text: 'Selecionar', style: { backgroundColor: '#1a1a1a', color: '#ffffff', borderRadius: '4px', height: '44px', width: '100%' } } }
                                        ]
                                    },
                                    {
                                        id: 'p-2', settings: { backgroundColor: '#ffffff', padding: { top: 50, right: 30, bottom: 50, left: 30 }, radius: 12, borderWidth: 2, borderColor: '#1a1a1a' },
                                        blocks: [
                                            { id: 'p2-v', type: 'headline', content: { text: 'POPULAR', style: { fontSize: '10px', fontWeight: '900', textAlign: 'center', color: '#ffffff', backgroundColor: '#1a1a1a', width: '80px', margin: '-60px auto 30px', padding: '4px', borderRadius: '4px' } } },
                                            { id: 'p2-n', type: 'headline', content: { text: 'Professional', style: { fontSize: '20px', fontWeight: '800', textAlign: 'center', mb: '8px' } } },
                                            { id: 'p2-p', type: 'headline', content: { text: '4.800 €', style: { fontSize: '32px', fontWeight: '900', textAlign: 'center', mb: '24px' } } },
                                            { id: 'p2-t', type: 'text', content: { text: '• Tudo do Essential\n• Estratégia de Marca\n• Papelaria Completa\n• Social Media\n• Brandbook', style: { fontSize: '14px', lineHeight: '2.5', mb: '40px' } } },
                                            { id: 'p2-b', type: 'button', content: { text: 'Selecionar Este', style: { backgroundColor: '#1a1a1a', color: '#ffffff', borderRadius: '4px', height: '44px', width: '100%' } } }
                                        ]
                                    },
                                    {
                                        id: 'p-3', settings: { backgroundColor: '#ffffff', padding: { top: 40, right: 30, bottom: 40, left: 30 }, radius: 12, borderWidth: 1, borderColor: '#e4e4e7' },
                                        blocks: [
                                            { id: 'p3-n', type: 'headline', content: { text: 'Enterprise', style: { fontSize: '20px', fontWeight: '800', textAlign: 'center', mb: '8px' } } },
                                            { id: 'p3-p', type: 'headline', content: { text: '8.500 €', style: { fontSize: '32px', fontWeight: '900', textAlign: 'center', mb: '24px' } } },
                                            { id: 'p3-t', type: 'text', content: { text: '• Tudo do Pro\n• Website\n• 3 Meses Suporte\n• Prioridade', style: { fontSize: '14px', lineHeight: '2.5', mb: '40px' } } },
                                            { id: 'p3-b', type: 'button', content: { text: 'Selecionar', style: { backgroundColor: '#1a1a1a', color: '#ffffff', borderRadius: '4px', height: '44px', width: '100%' } } }
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    style: { backgroundColor: '#ffffff', padding: '120px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 6, title: '07. ADN/Equipa', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'aec-e-h', type: 'headline', content: { text: 'POR QUE A BRIVIO STUDIO?', style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.4em', color: '#1a1a1a', mb: '40px' } } },
                        {
                            id: 'aec-e-c', type: 'layout', content: {
                                columns: [
                                    {
                                        id: 'col-e-1', blocks: [
                                            { id: 'aec-e-t', type: 'text', content: { text: 'Somos especialistas em transformar empresas técnicas em marcas desejáveis. Com mais de 10 anos de experiência no setor de Arquitetura e Engenharia.', style: { fontSize: '20px', color: '#3f3f46', mb: '40px' } } },
                                            { id: 'aec-e-q', type: 'text', content: { text: '"A equipa captou exatamente a essência minimalista que queríamos."\n— Maria Costa, Arquiteta Principal', style: { fontSize: '16px', fontStyle: 'italic', color: '#71717a', borderLeft: '4px solid #1a1a1a', paddingLeft: '24px' } } }
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    style: { backgroundColor: '#f4f4f5', padding: '120px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 7, title: '08. Termos', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'aec-t-h', type: 'headline', content: { text: 'TERMOS E CONDIÇÕES', style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.4em', color: '#1a1a1a', mb: '60px' } } },
                        {
                            id: 'aec-t-grid', type: 'layout', content: {
                                columns: [
                                    {
                                        id: 'col-t-1', blocks: [
                                            { id: 't1-h', type: 'headline', content: { text: '1. Pagamento', style: { fontSize: '18px', fontWeight: '800', mb: '10px' } } },
                                            { id: 't1-t', type: 'text', content: { text: '50% na adjudicação, 25% na entrega das primeiras opções e 25% na entrega dos arquivos finais.', style: { fontSize: '14px', color: '#71717a', mb: '30px' } } },
                                            { id: 't2-h', type: 'headline', content: { text: '2. Validade', style: { fontSize: '18px', fontWeight: '800', mb: '10px' } } },
                                            { id: 't2-t', type: 'text', content: { text: 'Esta proposta é válida por 15 dias a partir da data de envio ({{Data}}).', style: { fontSize: '14px', color: '#71717a' } } }
                                        ]
                                    },
                                    {
                                        id: 'col-t-2', blocks: [
                                            { id: 't3-h', type: 'headline', content: { text: '3. Direitos de Uso', style: { fontSize: '18px', fontWeight: '800', mb: '10px' } } },
                                            { id: 't3-t', type: 'text', content: { text: 'Após a quitação integral, todos os direitos patrimoniais são transferidos para o cliente.', style: { fontSize: '14px', color: '#71717a', mb: '30px' } } },
                                            { id: 't4-h', type: 'headline', content: { text: '4. Alterações', style: { fontSize: '18px', fontWeight: '800', mb: '10px' } } },
                                            { id: 't4-t', type: 'text', content: { text: 'Estão previstas até 3 rondas de revisão na etapa de criação.', style: { fontSize: '14px', color: '#71717a' } } }
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    style: { backgroundColor: '#ffffff', padding: '120px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 8, title: '09. Assinatura', type: 'signature',
                content_json: {
                    blocks: [
                        { id: 'aec-f-h', type: 'headline', content: { text: 'Vamos Construir Isto Juntos?', style: { fontSize: '56px', fontWeight: '800', color: '#ffffff', mb: '20px', textAlign: 'center' } } },
                        { id: 'aec-f-t', type: 'text', content: { text: 'Para iniciarmos o projeto, por favor assine digitalmente abaixo.', style: { fontSize: '18px', color: '#ffffff', opacity: 0.8, mb: '60px', textAlign: 'center' } } },
                        { id: 'aec-f-s', type: 'signature', content: { label: 'Assinatura Digital de {{Nome_Decisor}}' } }
                    ],
                    style: { backgroundColor: '#1a1a1a', padding: '160px 80px', textAlign: 'center' }
                }
            }
        ]
    }


    if (isAbstract) {
        return [
            settingsModule({
                visibility: 'visible',
                menu_background: '#1A1A1A',
                attachment_bg: '#FF0054',
                highlights_bg: '#FF0054',
                highlights_text: '#ffffff',
                text_card_icon: '#FF0054',
                text_card_tabs: '#000000',
                attachment_icon: '#000000',
                color_palette: ['#FF0054', '#000000', '#ffffff', '#333333'],
                main_project_bg: '#000000',
                play_audio_bg: '#FF0054'
            }),
            {
                proposal_id: proposalId, order: 0, title: '01. Capa', type: 'intro',
                content_json: {
                    blocks: [
                        {
                            id: 'header-1', type: 'headline', variant: 'h1',
                            content: {
                                text: 'MODERN\nBRUTALISM',
                                style: { fontSize: '180px', lineHeight: '0.8', fontWeight: '900', letterSpacing: '-0.05em', color: '#ffffff' }
                            }
                        },
                        {
                            id: 'header-2', type: 'headline', variant: 'h2',
                            content: {
                                text: 'PROPOSTA ESTRATÉGICA 2024',
                                style: { color: '#FF0054', fontSize: '14px', fontWeight: '900', mt: '40px', letterSpacing: '0.3em' }
                            }
                        }
                    ],
                    style: { backgroundColor: '#000000', padding: '120px 60px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }
                }
            },
            {
                proposal_id: proposalId, order: 1, title: '02. Manifesto', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'm-1', type: 'headline', content: { text: 'O NOSSO DNA', style: { color: '#FF0054', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5em', mb: '32px' } } },
                        { id: 'm-2', type: 'headline', content: { text: 'Nós não fazemos apenas design. Nós esculpimos autoridade.', style: { color: '#ffffff', fontSize: '48px', fontWeight: '700', lineHeight: '1.1', maxWidth: '800px' } } },
                        { id: 'm-3', type: 'text', content: { text: 'Brivio é uma extensão da sua ambição. Criamos sistemas visuais que comunicam poder e precisão.', style: { color: '#888888', fontSize: '18px', mt: '24px', maxWidth: '600px' } } }
                    ],
                    style: { backgroundColor: '#0a0a0a', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 2, title: '03. O Desafio', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'd-1', type: 'headline', content: { text: 'O PROBLEMA', style: { color: '#FF0054', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5em', mb: '32px' } } },
                        { id: 'd-2', type: 'headline', content: { text: 'A mesmice é o maior custo de oportunidade.', style: { color: '#ffffff', fontSize: '56px', fontWeight: '700', lineHeight: '1', mb: '40px' } } },
                        { id: 'd-3', type: 'text', content: { text: 'Sua marca está perdida em um ruído de conformidade. Nosso papel é extraí-la desse vácuo e posicioná-la no topo.', style: { color: '#888888', fontSize: '20px', maxWidth: '700px' } } }
                    ],
                    style: { backgroundColor: '#000000', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 3, title: '04. A Solução', type: 'text',
                content_json: {
                    blocks: [
                        { id: 's-1', type: 'headline', content: { text: 'ESTRATÉGIA', style: { color: '#FF0054', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5em', mb: '32px' } } },
                        { id: 's-2', type: 'headline', content: { text: 'Impacto Visual Radical.', style: { color: '#ffffff', fontSize: '64px', fontWeight: '800', mb: '40px' } } },
                        { id: 's-3', type: 'scope-list', content: { items: [{ text: 'Reposicionamento de Marca High-End', checked: true }, { text: 'Ecossistema Digital de Alta Conversão', checked: true }, { text: 'Direção Criativa de Autoridade', checked: true }], style: { color: '#ffffff' } } }
                    ],
                    style: { backgroundColor: '#0a0a0a', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 4, title: '05. Roadmap', type: 'timeline',
                content_json: {
                    blocks: [
                        { id: 'r-1', type: 'headline', content: { text: 'CRONOGRAMA', style: { color: '#FF0054', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5em', mb: '32px' } } },
                        { id: 'r-2', type: 'timeline', content: { items: [{ title: 'Imersão', date: 'Semana 1', description: 'Deep dive no DNA do negócio' }, { title: 'Conceito', date: 'Semana 3', description: 'Definição da direção criativa' }, { title: 'Execução', date: 'Semana 6', description: 'Desenvolvimento total' }, { title: 'Launch', date: 'Semana 8', description: 'Escalabilidade e Entrega' }], style: { color: '#ffffff' } } }
                    ],
                    style: { backgroundColor: '#000000', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 5, title: '06. Investimento', type: 'pricing',
                content_json: {
                    blocks: [
                        { id: 'i-1', type: 'headline', content: { text: 'VALORES', style: { color: '#FF0054', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5em', mb: '32px' } } },
                        { id: 'i-2', type: 'pricing-table', content: { items: [{ description: 'Branding Radical & Posicionamento', quantity: 1, price: 12000 }, { description: 'Direção de Arte & Digital', quantity: 1, price: 8500 }], style: { color: '#ffffff' } } }
                    ],
                    style: { backgroundColor: '#0a0a0a', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 6, title: '07. ADN/Equipa', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'e-1', type: 'headline', content: { text: 'A EQUIPA', style: { color: '#FF0054', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5em', mb: '32px' } } },
                        { id: 'e-2', type: 'headline', content: { text: 'Especialistas em Quebrar Padrões.', style: { color: '#ffffff', fontSize: '48px', mb: '40px' } } }
                    ],
                    style: { backgroundColor: '#000000', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 7, title: '08. Termos', type: 'text',
                content_json: {
                    blocks: [
                        { id: 't-1', type: 'headline', content: { text: 'ACORDO', style: { color: '#FF0054', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5em', mb: '32px' } } },
                        { id: 't-2', type: 'text', content: { text: 'Início imediato após confirmação. Pagamento 50/50. Todos os direitos de PI transferidos na liquidação final.', style: { color: '#888888', fontSize: '16px', lineHeight: '1.8' } } }
                    ],
                    style: { backgroundColor: '#0a0a0a', padding: '100px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 8, title: '09. Assinatura', type: 'signature',
                content_json: {
                    blocks: [
                        { id: 'f-1', type: 'headline', content: { text: 'VAMOS COMEÇAR?', style: { color: '#ffffff', fontSize: '64px', fontWeight: '900', textAlign: 'center' } } },
                        { id: 'f-2', type: 'button', content: { text: 'ASSINAR PROPOSTA', style: { backgroundColor: '#FF0054', color: '#ffffff', padding: '24px 48px', borderRadius: '0px', fontWeight: '900', letterSpacing: '0.2em', width: '300px', margin: '0 auto', display: 'flex' } } }
                    ],
                    style: { backgroundColor: '#000000', padding: '160px 80px', textAlign: 'center' }
                }
            }
        ]
    }

    if (isSphere) {
        return [
            settingsModule({
                visibility: 'visible',
                menu_background: '#041019',
                attachment_bg: '#00F0FF',
                highlights_bg: '#00F0FF',
                highlights_text: '#041019',
                text_card_icon: '#00F0FF',
                text_card_tabs: '#00F0FF',
                attachment_icon: '#041019',
                color_palette: ['#00F0FF', '#041019', '#ffffff', '#0A2540'],
                main_project_bg: '#041019',
                play_audio_bg: '#00F0FF'
            }),
            {
                proposal_id: proposalId, order: 0, title: '01. Capa', type: 'intro',
                content_json: {
                    blocks: [
                        {
                            id: 'header-sphere-1', type: 'headline',
                            content: {
                                text: 'TECH\nINFINITE',
                                style: { fontSize: '140px', lineHeight: '0.9', fontWeight: '100', color: '#ffffff', letterSpacing: '0.1em' }
                            }
                        },
                        {
                            id: 'header-sphere-2', type: 'headline',
                            content: {
                                text: 'THE NEXT GENERATION OF BUSINESS',
                                style: { color: '#00F0FF', fontSize: '12px', fontWeight: '500', mt: '40px', letterSpacing: '0.8em' }
                            }
                        }
                    ],
                    style: { backgroundColor: '#041019', backgroundImage: 'radial-gradient(circle at 70% 30%, #00F0FF11 0%, transparent 40%)', padding: '120px 80px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }
                }
            },
            {
                proposal_id: proposalId, order: 1, title: '02. Manifesto', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'm-1', type: 'headline', content: { text: '// MANIFESTO', style: { color: '#00F0FF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.4em', mb: '40px' } } },
                        { id: 'm-2', type: 'headline', content: { text: 'O futuro não é algo que acontece. É algo que se desenha.', style: { color: '#ffffff', fontSize: '42px', fontWeight: '300', lineHeight: '1.2', maxWidth: '800px' } } },
                        { id: 'm-3', type: 'text', content: { text: 'A convergência entre tecnologia e elegância humana define a nova era do mercado.', style: { color: '#a0aec0', fontSize: '18px', mt: '32px', maxWidth: '600px' } } }
                    ],
                    style: { backgroundColor: '#061623', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 2, title: '03. O Desafio', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'd-1', type: 'headline', content: { text: '// ANALYSIS', style: { color: '#00F0FF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.4em', mb: '40px' } } },
                        { id: 'd-2', type: 'headline', content: { text: 'Acelerando além da barreira digital.', style: { color: '#ffffff', fontSize: '48px', fontWeight: '300', lineHeight: '1.2' } } }
                    ],
                    style: { backgroundColor: '#041019', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 3, title: '04. A Solução', type: 'text',
                content_json: {
                    blocks: [
                        { id: 's-1', type: 'headline', content: { text: '// SOLUTION', style: { color: '#00F0FF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.4em', mb: '40px' } } },
                        { id: 's-2', type: 'scope-list', content: { items: [{ text: 'Infraestrutura Future-Proof', checked: true }, { text: 'Escalabilidade Global Automática', checked: true }], style: { color: '#ffffff' } } }
                    ],
                    style: { backgroundColor: '#061623', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 4, title: '05. Roadmap', type: 'timeline',
                content_json: {
                    blocks: [
                        { id: 'r-1', type: 'headline', content: { text: '// TIMELINE', style: { color: '#00F0FF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.4em' } } },
                        { id: 'r-2', type: 'timeline', content: { items: [{ title: 'Alpha', date: 'PHASE 1', description: 'Arquitetura' }, { title: 'Beta', date: 'PHASE 2', description: 'Implementação' }], style: { color: '#ffffff' } } }
                    ],
                    style: { backgroundColor: '#041019', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 5, title: '06. Investimento', type: 'pricing',
                content_json: {
                    blocks: [
                        { id: 'i-1', type: 'headline', content: { text: '// INVESTMENT', style: { color: '#00F0FF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.4em' } } },
                        { id: 'i-2', type: 'pricing-table', content: { items: [{ description: 'Tecnologia & Core', quantity: 1, price: 15000 }], style: { color: '#ffffff' } } }
                    ],
                    style: { backgroundColor: '#061623', padding: '160px 80px' }
                }
            },
            {
                proposal_id: proposalId, order: 8, title: '09. Assinatura', type: 'signature',
                content_json: {
                    blocks: [
                        { id: 'f-1', type: 'headline', content: { text: 'PRONTO PARA\nA EVOLUÇÃO?', style: { color: '#ffffff', fontSize: '56px', fontWeight: '100', textAlign: 'center', letterSpacing: '0.1em' } } },
                        { id: 'f-2', type: 'button', content: { text: 'INICIAR TRANSMISSÃO', style: { backgroundColor: '#00F0FF', color: '#041019', padding: '20px 40px', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.4em', width: '320px', margin: '40px auto 0', display: 'flex' } } }
                    ],
                    style: { backgroundColor: '#041019', padding: '160px 80px', textAlign: 'center' }
                }
            }
        ]
    }

    if (isHorizon) {
        return [
            settingsModule({
                visibility: 'visible',
                menu_background: '#ffffff',
                attachment_bg: '#111111',
                highlights_bg: '#111111',
                highlights_text: '#ffffff',
                text_card_icon: '#111111',
                text_card_tabs: '#111111',
                attachment_icon: '#ffffff',
                color_palette: ['#111111', '#f5f5f5', '#ffffff', '#888888'],
                main_project_bg: '#ffffff',
                play_audio_bg: '#111111'
            }),
            {
                proposal_id: proposalId, order: 0, title: '01. Capa', type: 'intro',
                content_json: {
                    blocks: [
                        {
                            id: 'h-hor-1', type: 'headline',
                            content: {
                                text: 'PURE\nELEGANCE',
                                style: { fontSize: '120px', lineHeight: '1', fontWeight: '300', color: '#111111', textAlign: 'center' }
                            }
                        },
                        {
                            id: 'h-hor-2', type: 'headline',
                            content: {
                                text: 'PREMIUM PARTNERSHIP PROPOSAL',
                                style: { color: '#888888', fontSize: '11px', fontWeight: '400', mt: '60px', letterSpacing: '0.6em', textAlign: 'center' }
                            }
                        }
                    ],
                    style: { backgroundColor: '#ffffff', padding: '120px 40px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }
                }
            },
            {
                proposal_id: proposalId, order: 1, title: '02. Manifesto', type: 'text',
                content_json: {
                    blocks: [
                        { id: 'm-1', type: 'headline', content: { text: 'MANIFESTO', style: { color: '#111111', fontSize: '10px', fontWeight: '700', letterSpacing: '0.8em', mb: '48px', textAlign: 'center' } } },
                        { id: 'm-2', type: 'headline', content: { text: 'A simplicidade é o último grau de sofisticação.', style: { color: '#222222', fontSize: '38px', fontWeight: '300', lineHeight: '1.4', maxWidth: '700px', textAlign: 'center', margin: '0 auto' } } }
                    ],
                    style: { backgroundColor: '#fcfcfc', padding: '160px 40px' }
                }
            },
            {
                proposal_id: proposalId, order: 5, title: '06. Investimento', type: 'pricing',
                content_json: {
                    blocks: [
                        { id: 'i-1', type: 'headline', content: { text: 'INVESTMENT', style: { color: '#111111', fontSize: '10px', fontWeight: '700', letterSpacing: '0.8em', textAlign: 'center', mb: '60px' } } },
                        { id: 'i-2', type: 'pricing-table', content: { items: [{ description: 'Consultoria de Elite', quantity: 1, price: 20000 }], style: { color: '#111111' } } }
                    ],
                    style: { backgroundColor: '#ffffff', padding: '160px 40px' }
                }
            },
            {
                proposal_id: proposalId, order: 8, title: '09. Assinatura', type: 'signature',
                content_json: {
                    blocks: [
                        { id: 'f-1', type: 'headline', content: { text: 'SHALL WE BEGIN?', style: { color: '#111111', fontSize: '48px', fontWeight: '300', textAlign: 'center', letterSpacing: '0.2em' } } },
                        { id: 'f-2', type: 'button', content: { text: 'APPROVE PROPOSAL', style: { backgroundColor: '#111111', color: '#ffffff', padding: '18px 60px', borderRadius: '0px', fontWeight: '400', letterSpacing: '0.4em', width: '300px', margin: '60px auto 0', display: 'flex' } } }
                    ],
                    style: { backgroundColor: '#ffffff', padding: '160px 40px', textAlign: 'center' }
                }
            }
        ]
    }

    // --- 4. FALLBACK: CLEAN STRATEGIC ---
    return [
        settingsModule({
            visibility: 'visible',
            menu_background: '#F4F4F4',
            attachment_bg: '#F6C944',
            highlights_bg: '#EF0050',
            highlights_text: '#ffffff',
            text_card_icon: '#ffffff',
            text_card_tabs: '#0C56FF',
            attachment_icon: '#0C56FF',
            color_palette: ['#4F46E5', '#9333EA', '#EF0050', '#1E1B4B'],
            main_project_bg: '#ffffff',
            play_audio_bg: '#0C56FF'
        }),
        {
            proposal_id: proposalId, order: 0, title: '01. Capa', type: 'intro',
            content_json: {
                blocks: [
                    { id: 'g-h-1', type: 'headline', content: { text: 'PROPOSTA\nCOMERCIAL', style: { fontSize: '72px', fontWeight: '800', color: '#111111' } } },
                    { id: 'g-h-2', type: 'text', content: { text: 'Apresentação de Projeto & Estratégia', style: { fontSize: '18px', color: '#666666', mt: '20px' } } }
                ],
                style: { backgroundColor: '#ffffff', padding: '100px 60px', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }
            }
        },
        ...sections.slice(1).map((s, i) => ({
            proposal_id: proposalId, order: i + 1, title: s.title, type: s.type,
            content_json: {
                blocks: [
                    { id: `g-b-h-${i}`, type: 'headline', content: { text: s.title.split('. ')[1].toUpperCase(), style: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.2em', color: '#EF0050', mb: '20px' } } },
                    {
                        id: `g-b-c-${i}`,
                        type: s.type === 'timeline' ? 'timeline' : s.type === 'pricing' ? 'pricing-table' : 'text',
                        content: s.type === 'text' ? { text: 'Adicione o seu conteúdo estratégico aqui.' } : {}
                    }
                ],
                style: { backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#ffffff', padding: '80px 60px' }
            }
        }))
    ]
}
