export const DOCUMENT_TEMPLATES = {
    branding: {
        id: 'branding',
        title: 'Proposta de Branding',
        description: 'Design estratégico e identidade visual.',
        content: {
            type: 'doc',
            content: [
                {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'Proposta de Identidade Visual' }]
                },
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Olá ' },
                        { type: 'variable', attrs: { label: 'Cliente' } },
                        { type: 'text', text: ', aqui está nossa visão para o futuro da sua marca.' }
                    ]
                },
                {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: 'O Que Entregamos' }]
                },
                {
                    type: 'bulletList',
                    content: [
                        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Logo Principal e Secundária' }] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Manual da Marca' }] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Paleta de Cores Estratégica' }] }] }
                    ]
                }
            ]
        }
    },
    marketing: {
        id: 'marketing',
        title: 'Proposta de Marketing',
        description: 'Campanhas e gestão de tráfego.',
        content: {
            type: 'doc',
            content: [
                {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'Estratégia de Marketing Digital' }]
                },
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Prezado(a) ' },
                        { type: 'variable', attrs: { label: 'Cliente' } },
                        { type: 'text', text: ', este planejamento visa aumentar seu ROI em 30%.' }
                    ]
                }
            ]
        }
    },
    contract: {
        id: 'contract',
        title: 'Contrato Simples',
        description: 'Termos de serviço e compromisso.',
        content: {
            type: 'doc',
            content: [
                {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: 'Contrato de Prestação de Serviços' }]
                },
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Empresa: Brivio Core' }
                    ]
                },
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Contratante: ' },
                        { type: 'variable', attrs: { label: 'Cliente' } }
                    ]
                }
            ]
        }
    }
};
