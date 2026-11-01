"use server"

import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { assertBrandAccess, assertSpaceAccess, assertObjectAccess, assertNodeAccess, BRAND_ACCESS_ERROR } from "@/lib/brand-access"
import { revalidatePath } from "next/cache"
import { BrandSpace, BrandNode, BrandRelationship, BrandObject, BrandDecision } from "@/components/brandops/types"
import { NODE_CATALOG } from "@/components/brandops/constants"

// Helper to ensure authenticated user
async function getAuthUser() {
    const supabase = await createClient()
    const user = await getCurrentUser()
    return user
}

// 1. Get all spaces for a brand
export async function getBrandSpaces(brandId: string) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertBrandAccess(brandId)
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('brand_spaces')
            .select('*')
            .eq('brand_id', brandId)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error("Error fetching brand_spaces:", error)
            return []
        }
        return data as BrandSpace[]
    } catch (e) {
        console.error("Failed to getBrandSpaces:", e)
        return []
    }
}

// 2. Get full details of a single Brand Space (including nodes, objects, edges, decisions)
export async function getBrandSpaceDetails(spaceId: string) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertSpaceAccess(spaceId)
        const adminSupabase = await createAdminClient()

        // Fetch space
        const { data: space, error: spaceErr } = await adminSupabase
            .from('brand_spaces')
            .select('*')
            .eq('id', spaceId)
            .single()

        if (spaceErr || !space) {
            return { success: false, error: "Espaço não encontrado" }
        }

        // Fetch nodes
        const { data: nodes, error: nodesErr } = await adminSupabase
            .from('brand_nodes')
            .select(`
                *,
                object:brand_objects(*)
            `)
            .eq('space_id', spaceId)

        // Fetch relationships
        const { data: relationships, error: relErr } = await adminSupabase
            .from('brand_relationships')
            .select('*')
            .eq('space_id', spaceId)

        // Fetch decisions
        const { data: decisions, error: decErr } = await adminSupabase
            .from('brand_decisions')
            .select('*')
            .eq('brand_id', space.brand_id)
            .order('decision_number', { ascending: false })

        return {
            success: true,
            space: space as BrandSpace,
            nodes: (nodes || []) as BrandNode[],
            relationships: (relationships || []) as BrandRelationship[],
            decisions: (decisions || []) as BrandDecision[]
        }
    } catch (e: any) {
        console.error("Error in getBrandSpaceDetails:", e)
        return { success: false, error: e.message || "Erro ao carregar espaço" }
    }
}

// 3. Create a new Brand Space
export async function createBrandSpace(brandId: string, name: string, description?: string) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertBrandAccess(brandId)
        const adminSupabase = await createAdminClient()

        const { data: space, error } = await adminSupabase
            .from('brand_spaces')
            .insert({
                brand_id: brandId,
                name: name || "Novo Brand Space",
                description: description || "Ambiente de construção e operações da marca",
                use_official_context: true,
                viewport: { x: 0, y: 0, zoom: 1 }
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, space }
    } catch (e: any) {
        console.error("Error creating space:", e)
        return { success: false, error: e.message }
    }
}

// 4. Save entire Brand Space Canvas (nodes, edges, viewport)
export async function saveBrandSpaceCanvas(
    spaceId: string,
    nodes: BrandNode[],
    relationships: BrandRelationship[],
    viewport: { x: number; y: number; zoom: number }
) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        const space = await assertSpaceAccess(spaceId)
        const adminSupabase = await createAdminClient()

        // SECURITY: node/object/relationship ids come from the client and are upserted by id.
        // Refuse ids that already belong to another space or brand, otherwise a crafted
        // payload could overwrite (and move into this space) someone else's records.
        const nodeIds = nodes.map(node => node.id).filter(Boolean)
        const objectIds = nodes.map(node => node.object?.id || node.object_id).filter(Boolean)
        const relationshipIds = relationships.map(rel => rel.id).filter(Boolean)
        const [{ data: foreignNodes }, { data: foreignObjects }, { data: foreignRelationships }] = await Promise.all([
            nodeIds.length
                ? adminSupabase.from('brand_nodes').select('id').in('id', nodeIds).neq('space_id', spaceId)
                : Promise.resolve({ data: [] as { id: string }[] }),
            objectIds.length
                ? adminSupabase.from('brand_objects').select('id').in('id', objectIds).neq('brand_id', space.brand_id)
                : Promise.resolve({ data: [] as { id: string }[] }),
            relationshipIds.length
                ? adminSupabase.from('brand_relationships').select('id').in('id', relationshipIds).neq('space_id', spaceId)
                : Promise.resolve({ data: [] as { id: string }[] }),
        ])
        if (foreignNodes?.length || foreignObjects?.length || foreignRelationships?.length) {
            throw new Error(BRAND_ACCESS_ERROR)
        }

        // 1. Update space viewport
        await adminSupabase
            .from('brand_spaces')
            .update({
                viewport,
                updated_at: new Date().toISOString()
            })
            .eq('id', spaceId)

        // 2. Upsert Brand Objects & Brand Nodes. Objects stay in Brand Memory even
        // when their visual node is removed from this particular Space.
        for (const node of nodes) {
            if (node.object) {
                await adminSupabase
                    .from('brand_objects')
                    .upsert({
                        id: node.object.id || node.object_id,
                        // SECURITY: always the authorized space's brand, never the client-supplied one
                        brand_id: space.brand_id,
                        space_id: spaceId,
                        type: node.type,
                        category: node.category,
                        title: node.title,
                        content: node.object.content || {},
                        metadata: node.object.metadata || {},
                        rationale: node.object.rationale || null,
                        status: node.object.status || 'draft',
                        confidence: node.object.confidence || 100,
                        source: node.object.source || 'human',
                        version: node.object.version || 1,
                        is_official: node.object.status === 'approved',
                        updated_at: new Date().toISOString()
                    })
            }

            await adminSupabase
                .from('brand_nodes')
                .upsert({
                    id: node.id,
                    space_id: spaceId,
                    object_id: node.object?.id || node.object_id,
                    type: node.type,
                    category: node.category,
                    x: node.x,
                    y: node.y,
                    width: node.width || 320,
                    height: node.height || 220,
                    is_collapsed: !!node.is_collapsed,
                    group_id: node.group_id || null,
                    outputs_history: node.outputs_history || [],
                    updated_at: new Date().toISOString()
                })
        }

        // Remove only canvas nodes removed by the user. This makes deletion durable
        // without destroying the corresponding Brand Object or its audit trail.
        const { data: persistedNodes } = await adminSupabase
            .from('brand_nodes')
            .select('id')
            .eq('space_id', spaceId)
        const activeNodeIds = new Set(nodes.map(node => node.id))
        const removedNodeIds = (persistedNodes || []).map(node => node.id).filter(id => !activeNodeIds.has(id))
        if (removedNodeIds.length > 0) {
            await adminSupabase.from('brand_nodes').delete().in('id', removedNodeIds)
        }

        // 3. Preserve relationship IDs and metadata when syncing instead of
        // deleting every edge on each autosave.
        if (relationships.length > 0) {
            const relInserts = relationships.map(rel => ({
                id: rel.id,
                space_id: spaceId,
                source_node_id: rel.source_node_id,
                target_node_id: rel.target_node_id,
                relationship_type: rel.relationship_type || 'supports',
                status: 'active',
                metadata: rel.metadata || {}
            }))
            const { error: relationshipError } = await adminSupabase
                .from('brand_relationships')
                .upsert(relInserts)
            if (relationshipError) throw relationshipError
        }

        const { data: persistedRelationships } = await adminSupabase
            .from('brand_relationships')
            .select('id')
            .eq('space_id', spaceId)
        const activeRelationshipIds = new Set(relationships.map(relationship => relationship.id))
        const removedRelationshipIds = (persistedRelationships || [])
            .map(relationship => relationship.id)
            .filter(id => !activeRelationshipIds.has(id))
        if (removedRelationshipIds.length > 0) {
            await adminSupabase.from('brand_relationships').delete().in('id', removedRelationshipIds)
        }

        return { success: true }
    } catch (e: any) {
        console.error("Error saving canvas:", e)
        return { success: false, error: e.message }
    }
}

// Keep the Space-level context policy durable. Approved objects remain official;
// this toggle only controls whether this Space consumes that official context.
export async function updateBrandSpaceContext(spaceId: string, useOfficialContext: boolean) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertSpaceAccess(spaceId)
        const adminSupabase = await createAdminClient()
        const { error } = await adminSupabase
            .from('brand_spaces')
            .update({ use_official_context: useOfficialContext, updated_at: new Date().toISOString() })
            .eq('id', spaceId)
        if (error) throw error
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || 'Não foi possível actualizar o contexto do Space.' }
    }
}

// 5. Approve Brand Object (Official Brand Context)
export async function approveBrandObject(objectId: string, rationale?: string) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertObjectAccess(objectId)
        const adminSupabase = await createAdminClient()

        const { data: object, error: fetchErr } = await adminSupabase
            .from('brand_objects')
            .select('*')
            .eq('id', objectId)
            .single()

        if (fetchErr || !object) throw new Error("Objeto não encontrado")

        // Update object to approved & official
        const { data: updated, error: updateErr } = await adminSupabase
            .from('brand_objects')
            .update({
                status: 'approved',
                is_official: true,
                rationale: rationale || object.rationale || 'Aprovado pelo utilizador como directriz oficial da marca.',
                updated_at: new Date().toISOString()
            })
            .eq('id', objectId)
            .select()
            .single()

        if (updateErr) throw updateErr

        // Automatically create a Brand Decision record in Brand Memory!
        const { count } = await adminSupabase
            .from('brand_decisions')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', object.brand_id)

        const nextNum = (count || 0) + 1

        await adminSupabase
            .from('brand_decisions')
            .insert({
                brand_id: object.brand_id,
                space_id: object.space_id,
                decision_number: nextNum,
                title: `Aprovação de ${object.title}`,
                decision: `Aprovação oficial do nó ${object.title} (${object.type}) para integrar o Brand Context.`,
                rationale: rationale || `Integrado como decisão oficial #${String(nextNum).padStart(3, '0')}.`,
                status: 'approved',
                related_objects: [objectId],
                author: 'Creative Director / Admin'
            })

        return { success: true, object: updated }
    } catch (e: any) {
        console.error("Error approving object:", e)
        return { success: false, error: e.message }
    }
}

// 6. Reject Brand Object
export async function rejectBrandObject(objectId: string, rationale?: string) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertObjectAccess(objectId)
        const adminSupabase = await createAdminClient()

        const { data: updated, error } = await adminSupabase
            .from('brand_objects')
            .update({
                status: 'rejected',
                is_official: false,
                rationale: rationale || 'Rejeitado na revisão humana.',
                updated_at: new Date().toISOString()
            })
            .eq('id', objectId)
            .select()
            .single()

        if (error) throw error

        return { success: true, object: updated }
    } catch (e: any) {
        console.error("Error rejecting object:", e)
        return { success: false, error: e.message }
    }
}

// 7. Execute Node with AI (Simulates / Executes Intelligent Agent Pipeline)
export async function executeNodeAI(
    nodeId: string,
    promptModification?: string,
    connectedContext?: any
) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertNodeAccess(nodeId)
        const adminSupabase = await createAdminClient()

        const { data: node, error: nodeErr } = await adminSupabase
            .from('brand_nodes')
            .select(`
                *,
                object:brand_objects(*)
            `)
            .eq('id', nodeId)
            .single()

        if (nodeErr || !node) throw new Error("Nó não encontrado")

        const currentVersion = node.object?.version || 1
        const newVersion = currentVersion + 1

        // Generate intelligent tailored output based on type & inputs
        let generatedContent: any = {}
        let rationale = ""

        switch (node.type) {
            case 'positioning':
                generatedContent = {
                    statement: promptModification ? `Evolução: ${promptModification}` : 'Para profissionais contemporâneos que buscam transcendência no cotidiano, somos a referência em excelência e impacto cultural autêntico.',
                    valueProposition: 'Fusão pioneira de herança cultural e sofisticação cosmopolita sem compromissos.',
                    reasonsToBelieve: ['Origem controlada com rastreabilidade total', 'Curadoria e acabamento de padrão internacional']
                }
                rationale = 'Reforço na diferenciação competitiva e elevação do apelo emocional do público-alvo.'
                break

            case 'naming':
                generatedContent = {
                    name: 'VÉRTEX ORIGIN',
                    descriptor: 'Signature Reserve',
                    meaning: 'Alusão ao ponto mais alto da qualidade e à convergência entre raiz e futuro.',
                    phonetic: 'vér-tex o-rí-gin'
                }
                rationale = 'Nome com sonoridade internacional marcante e alta memorabilidade fonética.'
                break

            case 'color_system':
                generatedContent = {
                    palette: [
                        { name: 'Heritage Amber', hex: '#E09F3E', pantone: 'Pantone 1375 C', role: 'Destaque Primário' },
                        { name: 'Imperial Maroon', hex: '#540B0E', pantone: 'Pantone 7428 C', role: 'Secundária Nobre' },
                        { name: 'Deep Espresso', hex: '#1C120C', pantone: 'Pantone 412 C', role: 'Base Escura' },
                        { name: 'Ivory Sand', hex: '#FAF5ED', pantone: 'Pantone 7527 C', role: 'Superfície Clara' }
                    ]
                }
                rationale = 'Harmonia equilibrada entre calor terroso e contraste contemporâneo de alto impacto.'
                break

            case 'tone_of_voice':
                generatedContent = {
                    tone: 'Visionário, magnético, eloquente e rigoroso.',
                    wordsWeUse: ['Excelência', 'Tradição Viva', 'Transcendência', 'Mestria', 'Precisão'],
                    wordsWeAvoid: ['Banal', 'Comum', 'Fast-paced', 'Descartável', 'Genérico']
                }
                rationale = 'Alinhado ao arquétipo do Criador com foco em autoridade e empatia cultural.'
                break

            default:
                generatedContent = {
                    ...node.object?.content,
                    generated_at: new Date().toISOString(),
                    note: promptModification || 'Otimização inteligente processada com base no Brand Context oficial.'
                }
                rationale = 'Iteração gerada pelo BrandOps Engine preservando consistência com as directrizes vigentes.'
        }

        const newOutput = {
            id: `out_${Date.now()}`,
            version: newVersion,
            title: `${node.title} (v${newVersion})`,
            content: generatedContent,
            status: 'ai_proposed',
            rationale,
            created_at: new Date().toISOString(),
            author: 'BrandOps AI Engine'
        }

        const updatedHistory = [...(node.outputs_history || []), newOutput]

        // Update node history and object content (flagged as ai_proposed)
        await adminSupabase
            .from('brand_nodes')
            .update({
                outputs_history: updatedHistory,
                updated_at: new Date().toISOString()
            })
            .eq('id', nodeId)

        await adminSupabase
            .from('brand_objects')
            .update({
                content: generatedContent,
                status: 'ai_proposed',
                is_official: false,
                version: newVersion,
                rationale,
                updated_at: new Date().toISOString()
            })
            .eq('id', node.object_id)

        return {
            success: true,
            version: newOutput
        }
    } catch (e: any) {
        console.error("Error executing node AI:", e)
        return { success: false, error: e.message }
    }
}

// 8. "CRIAR MARCA COM IA" (Generates a full connected Brand Workflow from natural language prompt)
export async function generateBrandWorkflowAI(
    brandId: string,
    spaceId: string,
    prompt: string
) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        const space = await assertSpaceAccess(spaceId)
        if (space.brand_id !== brandId) throw new Error(BRAND_ACCESS_ERROR)
        const adminSupabase = await createAdminClient()

        console.log(`[generateBrandWorkflowAI] Generating workflow for: "${prompt}"`)

        // Intelligent keyword matching to tailor the nodes
        const isCoffee = prompt.toLowerCase().includes('café') || prompt.toLowerCase().includes('coffee')
        const isTech = prompt.toLowerCase().includes('tech') || prompt.toLowerCase().includes('software') || prompt.toLowerCase().includes('saas') || prompt.toLowerCase().includes('fintech')
        const isFashion = prompt.toLowerCase().includes('moda') || prompt.toLowerCase().includes('fashion') || prompt.toLowerCase().includes('roupa')

        const brandName = isCoffee ? 'KAFÉA ORIGIN' : isTech ? 'NEXUS CLOUD' : isFashion ? 'AURORA STUDIO' : 'NOVA MARCA'

        // Define nodes to be created across columns with generous spacing for the infinite canvas
        const workflowNodesDef = [
            // Column 1: Discovery (x: 100)
            {
                type: 'research',
                category: 'discovery',
                title: 'Pesquisa de Mercado & Terroir',
                x: 80,
                y: 100,
                content: {
                    summary: `Estudo de mercado para: "${prompt}". Tendência acentuada de busca por autenticidade e conexão com a origem.`,
                    sources: ['Relatório Setorial 2026', 'Entrevistas Qualitativas com 120 Consumidores'],
                    keyFindings: ['84% valorizam rastreabilidade ética', 'Disposição a pagar premium por design de excelência']
                },
                rationale: 'Base empírica que valida a oportunidade de posicionamento elevado.'
            },
            {
                type: 'competitor',
                category: 'discovery',
                title: 'Benchmark Competitivo',
                x: 80,
                y: 380,
                content: {
                    competitors: ['Marca Global A (Mass Market)', 'Marca Local B (Tradicional Sem Identidade)'],
                    whiteSpace: 'Ausência de uma marca que combine herança cultural autêntica com linguagem visual contemporânea de luxo acessível.'
                },
                rationale: 'Identificação do espaço em branco para diferenciação incontestável.'
            },
            {
                type: 'insight',
                category: 'discovery',
                title: 'Insight Cultural Central',
                x: 80,
                y: 660,
                content: {
                    tension: 'Os consumidores urbanos sentem falta de produtos com alma e orgulho cultural.',
                    insight: 'O consumo cotidiano é ressignificado como um ritual de identidade e discernimento.'
                },
                rationale: 'Conecta o valor funcional do produto à esfera simbólica do consumidor.'
            },

            // Column 2: Strategy (x: 480)
            {
                type: 'purpose',
                category: 'strategy',
                title: 'Propósito da Marca',
                x: 480,
                y: 100,
                content: {
                    statement: `Elevar o cotidiano celebrando a pureza da nossa origem e o poder do design consciente.`,
                    rationale: 'Dá sentido transcendental ao negócio e atrai talentos e clientes fiéis.'
                },
                rationale: 'Declaração fundamental de impacto da marca no mundo.'
            },
            {
                type: 'audience',
                category: 'strategy',
                title: 'Público & Personas Urbanas',
                x: 480,
                y: 380,
                content: {
                    segment: 'Profissionais, Criadores & Empreendedores Urbanos (24-45 anos)',
                    jobsToBeDone: 'Encontrar um momento de foco sublime e afirmação estética durante o dia de trabalho.',
                    mindset: 'Valorizam estética apurada, sustentabilidade comprovada e histórias com profundidade.'
                },
                rationale: 'Definição precisa do interlocutor primário para toda a comunicação.'
            },
            {
                type: 'positioning',
                category: 'strategy',
                title: 'Posicionamento Estratégico',
                x: 480,
                y: 660,
                content: {
                    statement: `Para mentes urbanas que exigem distinção, ${brandName} é o produto de excelência que transforma o hábito diário numa celebração de mestria e cultura.`,
                    valueProposition: 'O encontro definitivo entre raiz autêntica e vanguarda cosmopolita.',
                    reasonsToBelieve: ['Origem controlada de altitude', 'Curadoria em microlotes numerados']
                },
                rationale: 'Eixo estruturante de todas as decisões verbais, visuais e de produto.'
            },
            {
                type: 'personality',
                category: 'strategy',
                title: 'Personalidade & Arquétipo',
                x: 480,
                y: 960,
                content: {
                    archetype: 'O Criador / Explorador Nobre',
                    traits: ['Confiante', 'Sensorial', 'Cosmopolita', 'Profundo'],
                    tone: 'Inteligente, caloroso e esteticamente impecável.'
                },
                rationale: 'Orienta a voz e os comportamentos da marca em todos os touchpoints.'
            },

            // Column 3: Verbal Identity (x: 880)
            {
                type: 'naming',
                category: 'verbal_identity',
                title: 'Naming & Descriptor',
                x: 880,
                y: 100,
                content: {
                    name: brandName,
                    descriptor: isCoffee ? 'Artisanal African Roast' : 'Specialty Platform',
                    meaning: 'Síntese de autenticidade territorial e ressonância fonética global.',
                    alternatives: ['ORIGINIA', 'TERRA NOBRE', 'LUMEN']
                },
                rationale: 'Nome curto, sofisticado, memorável e com domínio registrável.'
            },
            {
                type: 'tagline',
                category: 'verbal_identity',
                title: 'Tagline Oficial',
                x: 880,
                y: 380,
                content: {
                    tagline: 'Origem em Cada Gesto',
                    alternatives: ['O Ritual da Excelência', 'Pura Raiz. Puro Design.']
                },
                rationale: 'Síntese poética de alto impacto para encabeçar campanhas e embalagens.'
            },
            {
                type: 'tone_of_voice',
                category: 'verbal_identity',
                title: 'Tom de Voz & Vocabulário',
                x: 880,
                y: 660,
                content: {
                    tone: 'Sereno, culto, apaixonado e preciso.',
                    wordsWeUse: ['Ritual', 'Mestria', 'Origem', 'Extração', 'Distinção'],
                    wordsWeAvoid: ['Banal', 'Comum', 'Commodity', 'Rápido', 'Genérico']
                },
                rationale: 'Garante uniformidade no atendimento, redes sociais e embalagens.'
            },
            {
                type: 'brand_manifesto',
                category: 'verbal_identity',
                title: 'Manifesto da Marca',
                x: 880,
                y: 960,
                content: {
                    manifesto: 'Não aceitamos o ordinário. O nosso trabalho é resgatar o valor do tempo, da terra e do detalhe. Cada gota, cada traço, cada silêncio carrega uma história que merece ser contada com reverência.'
                },
                rationale: 'Texto manifesto para inspirar a comunidade e investidores.'
            },

            // Column 4: Visual Identity (x: 1280)
            {
                type: 'color_system',
                category: 'visual_identity',
                title: 'Sistema Cromático',
                x: 1280,
                y: 100,
                content: {
                    palette: [
                        { name: 'Terracota Solar', hex: '#D95D39', pantone: 'Pantone 7592 C', role: 'Primária' },
                        { name: 'Brivio Crimson', hex: '#FF0054', pantone: 'Pantone 1925 C', role: 'Destaque Vibrante' },
                        { name: 'Ouro Velho', hex: '#D4AF37', pantone: 'Pantone 4515 C', role: 'Secundária Elegante' },
                        { name: 'Areia Suave', hex: '#F4EFEB', pantone: 'Pantone Warm Gray 1 C', role: 'Neutro Fundo' },
                        { name: 'Carvão Mineral', hex: '#16161A', pantone: 'Pantone Black 6 C', role: 'Texto Escuro' }
                    ]
                },
                rationale: 'Cores que evocam nobreza terrosa, sofisticação e legibilidade impecável.'
            },
            {
                type: 'typography_system',
                category: 'visual_identity',
                title: 'Sistema Tipográfico',
                x: 1280,
                y: 400,
                content: {
                    primary: { font: 'Inter Tight', weights: ['Regular 400', 'SemiBold 600', 'Bold 700'], role: 'Interface & Rótulos' },
                    display: { font: 'Playfair Display', weights: ['Medium 500', 'Bold 700'], role: 'Títulos & Editorial' },
                    mono: { font: 'JetBrains Mono', weights: ['Regular 400'], role: 'Dados Técnicos de Lote' }
                },
                rationale: 'Combinação editorial contemporânea com alto contraste estético.'
            },
            {
                type: 'logo_system',
                category: 'visual_identity',
                title: 'Sistema de Logotipo',
                x: 1280,
                y: 720,
                content: {
                    variants: ['Wordmark com Ligaduras Exclusivas', 'Monograma Isomórfico', 'Selo Circular para Lacre'],
                    clearSpace: 'Margem equivalente à altura do monograma.',
                    minSizeDigital: '28px altura'
                },
                rationale: 'Construção vetorial limpa para aplicações em tela, tecido, vidro e papel kraft.'
            },

            // Column 5: Activation & Governance (x: 1680)
            {
                type: 'campaign_launch',
                category: 'activation',
                title: 'Campanha de Lançamento',
                x: 1680,
                y: 100,
                content: {
                    campaignName: 'Desperta a Tua Origem',
                    bigIdea: 'Transforma a pausa no momento mais valioso do teu dia.',
                    channels: ['Social Reels & Stories', 'Experiência Pop-Up Sensorial', 'Kit Exclusivo para Formadores de Opinião'],
                    expectedReach: '150.000 impressões qualificadas no primeiro mês'
                },
                rationale: 'Estratégia de entrada no mercado focada em reputação e desejo imediato.'
            },
            {
                type: 'brand_decision',
                category: 'governance',
                title: 'Decisão #001: Origem Controlada',
                x: 1680,
                y: 420,
                content: {
                    decisionNumber: 1,
                    title: 'Compromisso Inegociável com Comércio Direto e Justo',
                    decision: '100% da matéria-prima será adquirida com sobretaxa direta de 30% acima da cotação de mercado para as cooperativas parceiras.',
                    status: 'approved'
                },
                rationale: 'Garante o storytelling autêntico e protege a marca contra greenwashing.'
            },
            {
                type: 'brand_guardian_audit',
                category: 'governance',
                title: 'Brand Guardian: Verificação Inicial',
                x: 1680,
                y: 720,
                content: {
                    status: 'conforme',
                    score: 96,
                    checks: [
                        { item: 'Coerência Estratégia-Identidade', status: 'pass', note: 'Propósito plenamente refletido nas cores e no tom de voz' },
                        { item: 'Contraste Tipográfico', status: 'pass', note: 'Conformidade com padrão WCAG AAA' },
                        { item: 'Proteção de Marca', status: 'pass', note: 'Naming sem conflitos fonéticos diretos' }
                    ]
                },
                rationale: 'Garante conformidade do BrandOps antes da publicação oficial no Brand Book.'
            }
        ]

        // Create objects and nodes
        const createdNodes: BrandNode[] = []

        for (const item of workflowNodesDef) {
            // 1. Create Brand Object
            const { data: obj, error: objErr } = await adminSupabase
                .from('brand_objects')
                .insert({
                    brand_id: brandId,
                    space_id: spaceId,
                    type: item.type,
                    category: item.category,
                    title: item.title,
                    content: item.content,
                    rationale: item.rationale,
                    status: 'ai_proposed', // All AI generated nodes start as AI Proposed!
                    confidence: 94,
                    source: 'ai',
                    version: 1,
                    is_official: false
                })
                .select()
                .single()

            if (objErr) throw objErr

            // 2. Create Brand Node
            const { data: node, error: nodeErr } = await adminSupabase
                .from('brand_nodes')
                .insert({
                    space_id: spaceId,
                    object_id: obj.id,
                    type: item.type,
                    category: item.category,
                    x: item.x,
                    y: item.y,
                    width: 340,
                    height: 240,
                    outputs_history: [
                        {
                            id: `init_${Date.now()}`,
                            version: 1,
                            title: `${item.title} (Proposta IA)`,
                            content: item.content,
                            status: 'ai_proposed',
                            rationale: item.rationale,
                            created_at: new Date().toISOString(),
                            author: 'BrandOps AI Engine'
                        }
                    ]
                })
                .select()
                .single()

            if (nodeErr) throw nodeErr

            createdNodes.push({
                ...node,
                title: item.title,
                object: obj
            })
        }

        // Establish intelligent semantic connections between nodes!
        // Research -> Insight (derived_from)
        // Competitor -> Positioning (supports)
        // Insight -> Positioning (supports)
        // Purpose -> Positioning (influences)
        // Audience -> Positioning (influences)
        // Positioning -> Naming (derived_from)
        // Positioning -> Tagline (influences)
        // Positioning -> Color System (influences)
        // Naming -> Manifesto (uses)
        // Tagline -> Campaign (uses)
        // Color System -> Campaign (uses)
        // Positioning -> Brand Decision (supports)
        // Campaign -> Brand Guardian (validated_by)

        const findNode = (type: string) => createdNodes.find(n => n.type === type)

        const connectionsToCreate = [
            { from: 'research', to: 'insight', rel: 'derived_from' as const },
            { from: 'competitor', to: 'positioning', rel: 'supports' as const },
            { from: 'insight', to: 'positioning', rel: 'supports' as const },
            { from: 'purpose', to: 'positioning', rel: 'influences' as const },
            { from: 'audience', to: 'positioning', rel: 'influences' as const },
            { from: 'positioning', to: 'naming', rel: 'derived_from' as const },
            { from: 'positioning', to: 'personality', rel: 'influences' as const },
            { from: 'personality', to: 'tone_of_voice', rel: 'influences' as const },
            { from: 'naming', to: 'tagline', rel: 'supports' as const },
            { from: 'positioning', to: 'color_system', rel: 'influences' as const },
            { from: 'positioning', to: 'typography_system', rel: 'influences' as const },
            { from: 'naming', to: 'logo_system', rel: 'uses' as const },
            { from: 'tagline', to: 'campaign_launch', rel: 'uses' as const },
            { from: 'color_system', to: 'campaign_launch', rel: 'uses' as const },
            { from: 'positioning', to: 'brand_decision', rel: 'supports' as const },
            { from: 'campaign_launch', to: 'brand_guardian_audit', rel: 'validated_by' as const }
        ]

        const createdRelationships: BrandRelationship[] = []

        for (const conn of connectionsToCreate) {
            const src = findNode(conn.from)
            const tgt = findNode(conn.to)
            if (src && tgt) {
                const { data: rel, error: relErr } = await adminSupabase
                    .from('brand_relationships')
                    .insert({
                        space_id: spaceId,
                        source_node_id: src.id,
                        target_node_id: tgt.id,
                        relationship_type: conn.rel,
                        status: 'active'
                    })
                    .select()
                    .single()

                if (!relErr && rel) {
                    createdRelationships.push(rel as BrandRelationship)
                }
            }
        }

        return {
            success: true,
            nodes: createdNodes,
            relationships: createdRelationships
        }
    } catch (e: any) {
        console.error("Error in generateBrandWorkflowAI:", e)
        return { success: false, error: e.message }
    }
}

// 9. "ASK YOUR BRAND" (Pergunte à Marca)
export async function askYourBrandAction(brandId: string, query: string) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertBrandAccess(brandId)
        const adminSupabase = await createAdminClient()

        // 1. Fetch approved brand objects
        const { data: approvedObjects } = await adminSupabase
            .from('brand_objects')
            .select('*')
            .eq('brand_id', brandId)
            .eq('status', 'approved')

        // 2. Fetch decisions
        const { data: decisions } = await adminSupabase
            .from('brand_decisions')
            .select('*')
            .eq('brand_id', brandId)
            .eq('status', 'approved')

        const objectsList = approvedObjects || []
        const decisionsList = decisions || []

        const q = query.toLowerCase()
        let answer = ""
        let citations: string[] = []

        if (q.includes('proposta de valor') || q.includes('posicionamento')) {
            const pos = objectsList.find(o => o.type === 'positioning')
            if (pos && pos.content?.valueProposition) {
                answer = `A nossa proposta de valor oficial é: "${pos.content.valueProposition}". O posicionamento aprovado estabelece: "${pos.content.statement}".`
                citations.push(`Nó de Posicionamento Estratégico (v${pos.version})`)
            } else {
                answer = `A marca foca-se na celebração da herança cultural com estética contemporânea e rigor artesanal, transformando o consumo num ritual de distinção.`
                citations.push('Brand Context Oficial (Diretrizes Globais)')
            }
        } else if (q.includes('cor') || q.includes('amarelo') || q.includes('paleta') || q.includes('visual')) {
            const colors = objectsList.find(o => o.type === 'color_system')
            if (colors && colors.content?.palette) {
                const hexes = colors.content.palette.map((c: any) => `${c.name} (${c.hex})`).join(', ')
                answer = `A paleta de cores oficial aprovada da marca é composta por: ${hexes}. Qualquer cor externa requer validação pelo Brand Guardian para manter o contraste e harmonia.`
                citations.push('Sistema Cromático Oficial')
            } else {
                answer = `As cores primárias oficiais são tons terrosos nobres com acento em Crimson (#FF0054) e dourado mate. Cores berrantes ou fluorescentes não são permitidas.`
                citations.push('Brand Guidelines v1.0')
            }
        } else if (q.includes('tom de voz') || q.includes('comunicar') || q.includes('responder')) {
            const tone = objectsList.find(o => o.type === 'tone_of_voice')
            if (tone && tone.content?.tone) {
                answer = `O tom de voz oficial da marca é ${tone.content.tone}. Palavras recomendadas: ${tone.content.wordsWeUse?.join(', ')}. Evitar terminologias como: ${tone.content.wordsWeAvoid?.join(', ')}.`
                citations.push('Diretriz de Tom de Voz & Vocabulário')
            } else {
                answer = `Comunique com serenidade, elegância e clareza. Seja acolhedor e poético sem ser prolixo. Nunca utilize termos vulgares ou apele para promoções agressivas de preço.`
                citations.push('Brand Voice Principles')
            }
        } else {
            answer = `Com base no Brand Context oficial da marca (${objectsList.length} objectos aprovados e ${decisionsList.length} decisões registadas): Todas as acções devem respeitar os pilares de autenticidade na origem, sofisticação estética e impacto ético positivo.`
            if (objectsList.length > 0) citations.push(objectsList[0].title)
            if (decisionsList.length > 0) citations.push(`Decisão #${decisionsList[0].decision_number}: ${decisionsList[0].title}`)
        }

        return {
            success: true,
            answer,
            citations: citations.length > 0 ? citations : ['BrandOps Digital Twin Core']
        }
    } catch (e: any) {
        console.error("Error in askYourBrandAction:", e)
        return { success: false, error: e.message }
    }
}

// 10. EXPORT APPROVED BRAND OBJECTS DIRECTLY TO BRIVIO'S BRAND BOOK
export async function exportToBrandbook(
    brandId: string,
    objectIds: string[]
) {
    try {
        // SECURITY: admin client bypasses RLS, so verify the user's workspace owns this data
        await assertBrandAccess(brandId)
        const adminSupabase = await createAdminClient()

        // 1. Find or create brandbook for this brand
        let { data: brandbook } = await adminSupabase
            .from('brandbooks')
            .select('*')
            .eq('brand_id', brandId)
            .limit(1)
            .single()

        if (!brandbook) {
            const { data: brand } = await adminSupabase
                .from('brands')
                .select('name')
                .eq('id', brandId)
                .single()

            const { data: newBook, error: bookErr } = await adminSupabase
                .from('brandbooks')
                .insert({
                    brand_id: brandId,
                    title: `Brand Book Oficial — ${brand?.name || 'Marca'}`,
                    version: '1.0',
                    is_public: false
                })
                .select()
                .single()

            if (bookErr) throw bookErr
            brandbook = newBook
        }

        // 2. Fetch the selected Brand Objects
        const { data: objects, error: objErr } = await adminSupabase
            .from('brand_objects')
            .select('*')
            .in('id', objectIds)
            // SECURITY: only objects of the (already authorized) brand can be exported
            .eq('brand_id', brandId)

        if (objErr || !objects) throw new Error("Objetos não encontrados")

        // 3. Map Brand Objects into brandbook_modules
        let orderIndex = 1
        for (const obj of objects) {
            let moduleType = 'custom'
            let category = 'others'

            if (obj.type === 'purpose' || obj.type === 'mission_vision') {
                moduleType = 'mission'
                category = 'strategy'
            } else if (obj.type === 'personality') {
                moduleType = 'archetype'
                category = 'strategy'
            } else if (obj.type === 'tone_of_voice' || obj.type === 'tagline') {
                moduleType = 'voice_tone'
                category = 'verbal'
            } else if (obj.type === 'color_system') {
                moduleType = 'palette'
                category = 'visual'
            } else if (obj.type === 'typography_system') {
                moduleType = 'typography'
                category = 'visual'
            } else if (obj.type === 'logo_system') {
                moduleType = 'logo'
                category = 'visual'
            } else if (obj.type === 'photography_direction') {
                moduleType = 'photography'
                category = 'visual'
            }

            await adminSupabase
                .from('brandbook_modules')
                .insert({
                    brandbook_id: brandbook.id,
                    type: moduleType as any,
                    title: obj.title,
                    order: orderIndex++,
                    category: category,
                    content_json: {
                        source: 'BrandOps Engine',
                        object_id: obj.id,
                        version: obj.version,
                        content: obj.content,
                        rationale: obj.rationale,
                        synced_at: new Date().toISOString()
                    }
                })
        }

        return {
            success: true,
            brandbookId: brandbook.id,
            exportedCount: objects.length
        }
    } catch (e: any) {
        console.error("Error exporting to brandbook:", e)
        return { success: false, error: e.message }
    }
}
