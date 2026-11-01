import { Block } from "./types"
import type { ColumnData, ComponentPreset } from "./componentPresets"
import { createPhotoGradeContent, type PhotoGradeSettings } from "./blocks/photoGrade"

/**
 * Photographic identity sections: how the brand's photos look (light, colour, saturation, temperature,
 * grade, grain), how they are framed and composed, what to do and avoid. Built from native sections,
 * columns, texts, images, galleries and the photo-treatment block, so every part is edited on its own and
 * the section as a whole (padding, background, columns) from Edit section.
 */

let seq = 0
const uid = (prefix: string) => `photo-${prefix}-${++seq}`
const IMG = (name: string) => `/brandbook/presets/covers/${name}.webp`

type Style = Record<string, unknown>
type Align = 'left' | 'center' | 'right'
const ZERO = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }

// ---------- themes ----------

interface Theme { bg: string, ink: string, muted: string, line: string, accent: string }
const PAPER: Theme = { bg: '#F4F1EA', ink: '#141414', muted: '#7A7770', line: 'rgba(20,20,20,0.12)', accent: '#C2410C' }
const WHITE: Theme = { bg: '#FFFFFF', ink: '#111111', muted: '#8B8B93', line: 'rgba(0,0,0,0.1)', accent: '#FF0054' }
const NIGHT: Theme = { bg: '#0E0E0F', ink: '#F2F2F2', muted: '#8A8A90', line: 'rgba(255,255,255,0.12)', accent: '#FF7A1A' }
const SAND: Theme = { bg: '#EFE6DA', ink: '#2B1F18', muted: '#8C7666', line: 'rgba(43,31,24,0.14)', accent: '#B4532A' }
const STONE: Theme = { bg: '#E7E7E4', ink: '#1A1A1A', muted: '#77776F', line: 'rgba(0,0,0,0.12)', accent: '#1A1A1A' }
const INK: Theme = { bg: '#101418', ink: '#E9EEF2', muted: '#7D8A95', line: 'rgba(233,238,242,0.12)', accent: '#4FD1C5' }
const BLUSH: Theme = { bg: '#FBEFEF', ink: '#2A1416', muted: '#9A7A7C', line: 'rgba(42,20,22,0.12)', accent: '#E0457B' }
const FOREST: Theme = { bg: '#14201A', ink: '#EEF2EC', muted: '#8FA197', line: 'rgba(238,242,236,0.12)', accent: '#A3D9A5' }

// ---------- blocks ----------

const h = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'heading' as Block['type'],
    content: { text: value, style: { fontSize: `${size}px`, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: '1.02', color: th.ink, ...style } },
})
const t = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'text', content: { text: value, style: { fontSize: `${size}px`, lineHeight: '1.6', color: th.muted, ...style } },
})
/** Small label in mono */
const lbl = (value: string, th: Theme, style: Style = {}) =>
    t(value, 11, th, { fontFamily: 'Space Mono', textTransform: 'uppercase', letterSpacing: '0.14em', lineHeight: '1.6', color: th.accent, ...style })

const photo = (name: string, style: Style = {}): Block => ({ id: uid('b'), type: 'image', content: { url: IMG(name), caption: '', style: { radius: 12, ...style } } })

const gallery = (names: string[], style: Style = {}): Block => ({
    id: uid('b'), type: 'gallery',
    content: { items: names.map(n => ({ url: IMG(n) })), style: { galleryType: 'grid', columns: 3, aspectRatio: '4/5', imageRadius: 10, ...style } },
})

const grade = (settings: PhotoGradeSettings, th: Theme): Block => ({
    id: uid('b'), type: 'photo-grade' as Block['type'],
    content: { ...createPhotoGradeContent({ text: th.ink, muted: th.muted, accent: th.accent, border: th.line, ...settings }) },
})

const doDont = (dos: string[], donts: string[]): Block => ({
    id: uid('b'), type: 'list', variant: 'do-dont',
    content: { items: [...dos.map(x => ({ text: x, type: 'do' })), ...donts.map(x => ({ text: x, type: 'dont' }))] },
})

/** A row of small columns inside a column (texts side by side, spec tables…) */
const row = (cols: Block[][], opts: { widths?: number[], gap?: number, align?: Align[], valign?: 'top' | 'middle' | 'bottom', itemGap?: number } = {}): Block => ({
    id: uid('row'), type: 'layout', variant: `${cols.length}-col`,
    content: {
        columns: cols.map((blocks, i) => ({
            id: uid('rc'), blocks,
            settings: { padding: ZERO, blockGap: opts.itemGap ?? 8, alignHorizontal: opts.align?.[i] || 'left', alignVertical: opts.valign || 'top' },
        })),
        settings: { columns: cols.length, columnWidths: opts.widths || Array(cols.length).fill(1), columnGap: opts.gap ?? 32, padding: ZERO, height: 'fit', alignVertical: 'top', alignHorizontal: 'left' },
    },
})

/** A spec line: label over value */
const spec = (label: string, value: string, th: Theme) => [lbl(label, th, { color: th.muted }), t(value, 17, th, { color: th.ink, fontWeight: 600 })]

// ---------- columns / sections ----------

const col = (blocks: Block[], s: Style = {}): ColumnData => ({
    id: uid('col'), blocks,
    settings: { padding: ZERO, blockGap: 20, alignHorizontal: 'left', alignVertical: 'top', ...s },
})

/** Section whose padding (Edit section) sets the margins; the content fills the room left */
const sec = (columns: ColumnData[], th: Theme, opts: { widths?: number[], gap?: number, padY?: number, padX?: number, valign?: 'top' | 'middle' | 'bottom' } = {}): Block => ({
    id: uid('sec'), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length, columnWidths: opts.widths || Array(columns.length).fill(1),
            padding: ZERO, columnGap: opts.gap ?? 64,
            sectionPadding: { isLocked: false, top: opts.padY ?? 110, right: opts.padX ?? 72, bottom: opts.padY ?? 110, left: opts.padX ?? 72 },
            contentWidth: 'fluid', backgroundType: 'color', backgroundColor: th.bg,
            alignVertical: opts.valign === 'middle' ? 'middle' : 'top', alignHorizontal: 'left', height: 'fit',
        },
    },
})

/** Heading block of a section: label, title and text */
const intro = (label: string, title: string, body: string, th: Theme, size = 56, align: Align = 'left') => [
    lbl(label, th, { textAlign: align }),
    h(title, size, th, { textAlign: align }),
    t(body, 17, th, { textAlign: align, maxWidth: '560px' }),
]

let n = 0
const preset = (name: string, description: string, data: Block): ComponentPreset =>
    ({ id: `sec-photo-${String(++n).padStart(2, '0')}`, kind: 'section', topic: 'imagery', name, description, data })

// ---------- grades ----------

const WARM = { brightness: 4, contrast: 10, saturation: -15, warmth: 22, fade: 12, grain: 14, vignette: 16 }
const COOL = { brightness: 2, contrast: 14, saturation: -20, warmth: -28, fade: 6, grain: 8, vignette: 10 }
const MONO_G = { brightness: 2, contrast: 22, saturation: -100, grain: 22, vignette: 24 }
const FILM = { brightness: 2, contrast: -8, saturation: -10, warmth: 14, fade: 30, grain: 34, vignette: 22 }
const VIVID = { brightness: 2, contrast: 16, saturation: 25, warmth: 6, vignette: 6 }
const CINE = { contrast: 18, saturation: -12, warmth: 10, tint: -8, wash: '#0E5C6B', washStrength: 18, washBlend: 'soft-light' as const, vignette: 30, grain: 10 }
const SOFT = { brightness: 8, contrast: -12, saturation: -22, warmth: 8, fade: 22, grain: 6 }
const DUO = { contrast: 12, saturation: -100, wash: '#FF0054', washStrength: 55, washBlend: 'color' as const, grain: 10 }

// =====================================================================================================

export const PHOTO_PRESETS: ComponentPreset[] = [
    preset('Identidade fotográfica', 'Apresentação com antes/depois do tratamento da marca e os valores do ajuste.', sec([
        col(intro('Fotografia', 'Luz quente,\ncor contida.', 'As nossas fotografias são luminosas e calmas: tons quentes, saturação baixa e pretos ligeiramente levantados. Nada de filtros pesados.', PAPER)),
        col([grade({ image: IMG('dune-portal'), grade: WARM, mode: 'compare', aspect: '4/3' }, PAPER)]),
    ], PAPER, { widths: [1, 1.4], valign: 'middle' })),

    preset('Antes e depois', 'Título centrado e um comparador grande, a toda a largura.', sec([
        col([
            ...intro('Color grade', 'Do original à marca.', 'Arraste a linha: à esquerda a fotografia como foi tirada, à direita com o tratamento da marca.', NIGHT, 64, 'center'),
            grade({ image: IMG('amber-silk'), grade: FILM, mode: 'compare', aspect: '21/9', radius: 20, overlayColor: '#FFFFFF' }, NIGHT),
        ], { alignHorizontal: 'center', blockGap: 28 }),
    ], NIGHT)),

    preset('Faça e evite no tratamento', 'Original, o tratamento certo e o exemplo a evitar, lado a lado.', sec([
        col([
            row([[lbl('Tratamento', WHITE), h('O certo e o errado.', 52, WHITE)], [t('Saturação moderada e cor natural. Evite contrastes extremos, cores artificiais e filtros que escondem a fotografia.', 16, WHITE)]], { widths: [1.2, 1], valign: 'bottom', gap: 64 }),
            grade({ image: IMG('pink-arch'), grade: SOFT, mode: 'variants', aspect: '4/5', avoidGrade: { contrast: 55, saturation: 90, warmth: -40, vignette: 40 } }, WHITE),
        ], { blockGap: 40 }),
    ], WHITE)),

    preset('Paleta da fotografia', 'Imagem com as cores dominantes e texto sobre a cor.', sec([
        col([grade({ image: IMG('dune-curve'), grade: WARM, mode: 'single', aspect: '4/5', showValues: false, showPalette: true, palette: ['#F2D5C4', '#E2A68C', '#B86E5B', '#6E3B33', '#FBF1EA'] }, SAND)]),
        col([
            ...intro('Cor', 'Uma paleta que\nse repete.', 'Rosas de pó, terracota e creme. Escolhemos fotografias em que estas cores já existem, em vez de as forçar na edição.', SAND),
            row([spec('Dominante', 'Terracota', SAND), spec('Apoio', 'Creme', SAND), spec('Evitar', 'Verdes ácidos', SAND)], { gap: 24 }),
        ], { alignVertical: 'middle', blockGap: 24 }),
    ], SAND, { widths: [1, 1.1], valign: 'middle' })),

    preset('Regra dos terços', 'Fotografia com a grelha dos terços e os princípios de composição.', sec([
        col([
            ...intro('Composição', 'O assunto\nnunca ao centro.', 'Colocamos o assunto num dos pontos de força da regra dos terços e deixamos espaço na direção do olhar.', STONE),
            doDont(['Assunto nos pontos de força', 'Horizonte num dos terços'], ['Assunto colado à margem', 'Horizonte a meio']),
        ], { alignVertical: 'middle', blockGap: 24 }),
        col([grade({ image: IMG('cloud-frame'), grade: { contrast: 8, saturation: -10 }, mode: 'single', overlay: 'thirds', overlayColor: '#FFFFFF', aspect: '3/2', showValues: false }, STONE)]),
    ], STONE, { widths: [1, 1.4], valign: 'middle' })),

    preset('Proporção áurea', 'Composição pela proporção áurea, sobre escuro.', sec([
        col([grade({ image: IMG('red-hall'), grade: CINE, mode: 'single', overlay: 'golden', overlayColor: '#FFD27A', aspect: '3/2' }, NIGHT)]),
        col(intro('Composição', 'Equilíbrio\nnatural.', 'A espiral áurea guia o olhar até ao assunto. Linhas e luz conduzem para o ponto principal.', NIGHT), { alignVertical: 'middle' }),
    ], NIGHT, { widths: [1.5, 1], valign: 'middle' })),

    preset('Planos e enquadramentos', 'Plano geral, médio e de pormenor, cada um com o seu uso.', sec([
        col([photo('dune-curve', { aspectRatio: '4/5' }), lbl('01 · Plano geral', PAPER), h('Contexto', 28, PAPER), t('Mostra o lugar e a escala. Abre capítulos e campanhas.', 15, PAPER)]),
        col([photo('pink-arch', { aspectRatio: '4/5' }), lbl('02 · Plano médio', PAPER), h('Ação', 28, PAPER), t('Pessoas e produto em uso, com algum ambiente à volta.', 15, PAPER)]),
        col([photo('candle-snow', { aspectRatio: '4/5' }), lbl('03 · Pormenor', PAPER), h('Textura', 28, PAPER), t('Materiais, mãos e detalhes que contam a qualidade.', 15, PAPER)]),
    ], PAPER, { gap: 24 })),

    preset('Mosaico de referência', 'Título e galeria em mosaico com as fotografias de referência.', sec([
        col([
            row([[lbl('Referências', WHITE), h('Assim se vê\na marca.', 56, WHITE)], [t('Uma seleção de imagens que representa a luz, a cor e a atitude que procuramos em cada sessão.', 16, WHITE)]], { widths: [1.2, 1], valign: 'bottom', gap: 64 }),
            gallery(['dune-portal', 'pink-spheres', 'cloud-frame', 'amber-silk', 'pink-arch', 'candle-snow', 'dune-curve'], { galleryType: 'mosaic', columns: 4, imageRadius: 8 }),
        ], { blockGap: 40 }),
    ], WHITE)),

    preset('Retratos 4:5', 'Grelha de retratos verticais com legendas de uso.', sec([
        col([
            ...intro('Pessoas', 'Pessoas reais,\nluz real.', 'Retratos em 4:5, com luz natural lateral e expressões espontâneas. Nada de poses de banco de imagens.', BLUSH, 52),
            gallery(['pink-arch', 'dune-portal', 'pink-spheres', 'dune-curve'], { galleryType: 'grid', columns: 4, aspectRatio: '4/5', imageRadius: 14 }),
        ], { blockGap: 36 }),
    ], BLUSH)),

    preset('Sequência em slider', 'Galeria horizontal para mostrar uma série fotográfica.', sec([
        col([
            row([[lbl('Série', NIGHT), h('Ritmo e sequência.', 52, NIGHT)], [t('As imagens funcionam em série: o mesmo tratamento, variação de planos, um fio condutor de cor.', 16, NIGHT)]], { widths: [1.2, 1], valign: 'bottom', gap: 64 }),
            gallery(['amber-silk', 'red-hall', 'prism-corridor', 'violet-ribbon', 'midnight-wave', 'dark-rock'], { galleryType: 'slider', columns: 3, aspectRatio: '3/2', imageRadius: 12 }),
        ], { blockGap: 36 }),
    ], NIGHT)),

    preset('Faça e evite', 'Duas fotografias: o que fazer e o que evitar, com listas.', sec([
        col([photo('cloud-frame', { aspectRatio: '4/3' }), doDont(['Luz natural, céu limpo', 'Espaço negativo à volta do assunto', 'Cores suaves e coerentes'], [])]),
        col([photo('prism-corridor', { aspectRatio: '4/3' }), doDont([], ['Luz artificial dura e reflexos', 'Composições cheias e confusas', 'Cores saturadas e frias'])]),
    ], WHITE, { gap: 32 })),

    preset('Luz natural', 'Imagem grande a toda a altura e o texto ao lado.', sec([
        col([photo('candle-snow', { aspectRatio: '4/5', radius: 0 })]),
        col([
            ...intro('Luz', 'Sempre luz\nnatural.', 'Fotografamos com luz do dia ou de janela. Sombras suaves, altas-luzes que não queimam e nada de flash direto.', PAPER),
            row([spec('Hora', 'Manhã · fim de tarde', PAPER), spec('Direção', 'Lateral', PAPER)], { gap: 24 }),
        // The image goes edge to edge: the text keeps its own breathing room
        ], { alignVertical: 'middle', blockGap: 24, padding: { isLocked: false, top: 72, right: 72, bottom: 72, left: 0 } }),
    ], PAPER, { widths: [1, 1], valign: 'middle', padX: 0, padY: 0 })),

    preset('Editorial escuro', 'Título grande e duas imagens desencontradas, sobre preto.', sec([
        col([
            lbl('Editorial', NIGHT),
            h('Contraste\ncom alma.', 88, NIGHT, { letterSpacing: '-0.045em' }),
            t('Sombras profundas, pouca luz e um único ponto de interesse. Para campanhas e capas.', 17, NIGHT),
            photo('dark-rock', { aspectRatio: '1/1' }),
        ], { blockGap: 24 }),
        col([photo('red-hall', { aspectRatio: '3/4' }), t('Campanha de inverno · luz única, fundo escuro.', 13, NIGHT)], { padding: { ...ZERO, isLocked: false, top: 140 } }),
    ], NIGHT, { widths: [1, 1], gap: 48 })),

    preset('Moodboard', 'Galeria em masonry e uma nota sobre o ambiente.', sec([
        col([
            ...intro('Moodboard', 'O ambiente\ndas imagens.', 'Texturas, cor e luz que inspiram as sessões. Serve de briefing para fotógrafos e equipas.', SAND, 48),
            doDont(['Tons de terra e pó', 'Texturas naturais'], ['Cenários plásticos']),
        ], { blockGap: 24 }),
        col([gallery(['dune-curve', 'candle-snow', 'amber-silk', 'pink-arch', 'dune-portal', 'pink-spheres'], { galleryType: 'masonry', columns: 3, imageRadius: 8 })]),
    ], SAND, { widths: [1, 2] })),

    preset('Saturação', 'Três níveis de saturação: dessaturada, a da marca e saturada demais.', sec([
        col([
            ...intro('Saturação', 'Cor presente,\nnunca gritante.', 'Reduzimos a saturação cerca de 15%. As cores ficam naturais e combinam com a paleta da marca.', WHITE, 52, 'center'),
            grade({ image: IMG('pink-spheres'), mode: 'variants', aspect: '1/1', grade: { saturation: -15, contrast: 6 }, avoidGrade: { saturation: 95, contrast: 20 }, labelOriginal: 'Sem ajuste', labelBrand: 'Marca · −15', labelAvoid: 'Saturada demais' }, WHITE),
        ], { alignHorizontal: 'center', blockGap: 36 }),
    ], WHITE)),

    preset('Temperatura de cor', 'Lado a lado: original e com a temperatura quente da marca.', sec([
        col([
            row([[lbl('Temperatura', SAND), h('Sempre do lado\nquente.', 52, SAND)], [t('Corrigimos o branco para tons quentes (+20). Peles naturais, interiores acolhedores, nunca azulados.', 16, SAND)]], { widths: [1.2, 1], valign: 'bottom', gap: 64 }),
            grade({ image: IMG('cloud-frame'), mode: 'side', aspect: '3/2', grade: { warmth: 35, saturation: -8, contrast: 6 }, labelBrand: 'Quente +35' }, SAND),
        ], { blockGap: 36 }),
    ], SAND)),

    preset('Grão e textura', 'Fotografia com grão de filme e a explicação da textura.', sec([
        col([grade({ image: IMG('amber-silk'), mode: 'single', aspect: '16/9', grade: FILM, overlay: 'none' }, NIGHT)]),
        col([
            ...intro('Textura', 'Grão de\npelícula.', 'Um grão fino e pretos levantados dão às imagens um ar analógico, mais humano e menos digital.', NIGHT, 48),
            row([spec('Grão', '30 – 35', NIGHT), spec('Fade', '25 – 30', NIGHT)], { gap: 24 }),
        ], { alignVertical: 'middle', blockGap: 24 }),
    ], NIGHT, { widths: [1.6, 1], valign: 'middle' })),

    preset('Monocromático', 'Preto e branco com contraste e grão, para campanhas institucionais.', sec([
        col([
            ...intro('Preto e branco', 'Quando a cor\nsai de cena.', 'Para retratos institucionais e momentos solenes: preto e branco com contraste firme e grão.', STONE, 52),
            grade({ image: IMG('dune-portal'), mode: 'compare', aspect: '21/9', grade: MONO_G, labelBrand: 'Monocromático' }, STONE),
        ], { blockGap: 36 }),
    ], STONE)),

    preset('Duotone da marca', 'Fotografias em duotone com a cor da marca.', sec([
        col([
            ...intro('Duotone', 'A cor da marca\nnas imagens.', 'Em campanhas e redes sociais, as fotografias passam a preto e branco com uma camada de rosa Brivio.', NIGHT, 52),
            t('Use só em imagens com contraste claro e fundo simples.', 14, NIGHT, { color: NIGHT.ink }),
        ], { alignVertical: 'middle', blockGap: 20 }),
        col([grade({ image: IMG('pink-arch'), mode: 'side', aspect: '4/5', grade: DUO, labelBrand: 'Duotone' }, { ...NIGHT, accent: '#FF0054' })]),
    ], NIGHT, { widths: [1, 1.5], valign: 'middle' })),

    preset('Pessoas reais', 'Três retratos com legendas sobre atitude e expressão.', sec([
        col([lbl('Pessoas', BLUSH), h('Naturais, nunca\nposadas.', 56, BLUSH), t('Fotografamos pessoas a fazer coisas reais, de perto e com cumplicidade.', 17, BLUSH)], { blockGap: 18 }),
        col([photo('pink-arch', { aspectRatio: '3/4' }), h('Olhar direto', 22, BLUSH), t('Contacto visual em retratos de equipa.', 14, BLUSH)]),
        col([photo('dune-portal', { aspectRatio: '3/4' }), h('Em movimento', 22, BLUSH), t('Gestos e ação em vez de poses paradas.', 14, BLUSH)]),
    ], BLUSH, { widths: [1.2, 1, 1], gap: 32 })),

    preset('Detalhes', 'Galeria quadrada de pormenores e materiais.', sec([
        col([
            row([[lbl('Pormenor', PAPER), h('O detalhe\nconta a qualidade.', 52, PAPER)], [t('Fotografias de perto, com profundidade de campo curta: texturas, materiais e mãos.', 16, PAPER)]], { widths: [1.2, 1], valign: 'bottom', gap: 64 }),
            gallery(['candle-snow', 'amber-silk', 'dune-curve', 'ice-crystal', 'pink-spheres', 'green-lines'], { galleryType: 'grid', columns: 6, aspectRatio: '1/1', imageRadius: 6 }),
        ], { blockGap: 36 }),
    ], PAPER)),

    preset('Espaço negativo', 'Uma imagem com muito espaço livre e a regra de composição.', sec([
        col([grade({ image: IMG('cloud-frame'), mode: 'single', aspect: '16/9', grade: SOFT, overlay: 'center', overlayColor: '#FFFFFF', showValues: false }, WHITE)]),
        col([
            ...intro('Espaço', 'Deixe a imagem\nrespirar.', 'Pelo menos metade da imagem é espaço livre: céu, parede, chão. É aí que entram o texto e o logótipo.', WHITE, 48),
            lbl('≥ 50% de espaço livre', WHITE, { color: WHITE.ink }),
        ], { alignVertical: 'middle', blockGap: 22 }),
    ], WHITE, { widths: [1.6, 1], valign: 'middle' })),

    preset('Ficha técnica da fotografia', 'Imagem e uma tabela com câmara, lente, luz e edição.', sec([
        col([photo('dune-curve', { aspectRatio: '3/2' })]),
        col([
            lbl('Ficha técnica', INK),
            h('Como fotografamos.', 44, INK),
            row([spec('Lente', '35 mm · 50 mm', INK), spec('Abertura', 'f/2 – f/4', INK)], { gap: 24 }),
            row([spec('Luz', 'Natural, lateral', INK), spec('ISO', '100 – 400', INK)], { gap: 24 }),
            row([spec('Formato', 'RAW · 3:2 e 4:5', INK), spec('Edição', 'Preset da marca', INK)], { gap: 24 }),
        ], { alignVertical: 'middle', blockGap: 20 }),
    ], INK, { widths: [1.3, 1], valign: 'middle' })),

    preset('Cores dominantes', 'Galeria com a paleta das fotografias por baixo.', sec([
        col([
            ...intro('Cor', 'As cores que\nprocuramos.', 'Antes de fotografar, escolha cenários e roupas nestas cores. A edição só as afina.', FOREST, 52, 'center'),
            gallery(['green-lines', 'dune-curve', 'ice-crystal', 'candle-snow'], { galleryType: 'grid', columns: 4, aspectRatio: '3/4', imageRadius: 12 }),
            grade({ image: IMG('green-lines'), mode: 'single', aspect: '21/9', grade: COOL, showValues: false, showPalette: true, palette: ['#1F3B2D', '#5E8B6E', '#A3D9A5', '#E9E2D0', '#C9A66B'], radius: 12 }, FOREST),
        ], { alignHorizontal: 'center', blockGap: 32 }),
    ], FOREST)),

    preset('Produto', 'Fotografia de produto centrada, fundo neutro e regras.', sec([
        col([
            ...intro('Produto', 'O produto é\no herói.', 'Fundo neutro, luz suave de lado, sombra natural no chão. O produto ocupa 60% do enquadramento.', STONE, 52),
            doDont(['Fundo liso e neutro', 'Sombra natural e suave'], ['Fundos com padrões', 'Reflexos duros']),
        ], { alignVertical: 'middle', blockGap: 24 }),
        col([photo('crystal-hero', { aspectRatio: '4/5', radius: 16 })]),
    ], STONE, { widths: [1, 1], valign: 'middle' })),

    preset('Filtros proibidos', 'Lado a lado o tratamento da marca e um filtro a evitar.', sec([
        col([
            row([[lbl('Filtros', WHITE), h('Sem filtros\nprontos.', 52, WHITE)], [t('Nunca usamos filtros de aplicações (vintage, HDR, cores neon). Só o tratamento da marca, sempre o mesmo.', 16, WHITE)]], { widths: [1.2, 1], valign: 'bottom', gap: 64 }),
            grade({ image: IMG('dune-portal'), mode: 'variants', aspect: '3/2', grade: WARM, avoidGrade: { contrast: 40, saturation: 60, tint: 40, vignette: 60, warmth: -20 }, labelAvoid: 'Filtro de app' }, WHITE),
        ], { blockGap: 36 }),
    ], WHITE)),

    preset('Cinematográfico', 'Imagem panorâmica 21:9 com tratamento cinema e texto em barra.', sec([
        col([
            grade({ image: IMG('red-hall'), mode: 'compare', aspect: '21/9', grade: CINE, radius: 0, labelBrand: 'Look cinema' }, NIGHT),
            row([[lbl('Campanha', NIGHT), h('Formato cinema.', 44, NIGHT)], [t('Para vídeo e campanhas: 21:9, sombras azul-petróleo, altas-luzes quentes e vinheta suave.', 16, NIGHT)]], { widths: [1, 1.2], valign: 'bottom', gap: 64 }),
        ], { blockGap: 36 }),
    ], NIGHT)),

    preset('Retrato 4:5', 'Um retrato vertical grande e os valores do tratamento.', sec([
        col([
            ...intro('Retrato', 'De perto,\ncom calma.', 'Retratos verticais em 4:5 para redes sociais e equipa. Luz suave e pele natural.', BLUSH, 52),
            row([spec('Proporção', '4:5', BLUSH), spec('Luz', 'Janela', BLUSH), spec('Fundo', 'Desfocado', BLUSH)], { gap: 20 }),
        ], { alignVertical: 'middle', blockGap: 24 }),
        col([grade({ image: IMG('pink-arch'), mode: 'single', aspect: '4/5', grade: SOFT, overlay: 'thirds', overlayColor: '#FFFFFF' }, BLUSH)]),
    ], BLUSH, { widths: [1, 1], valign: 'middle' })),

    preset('Cor viva', 'Para marcas enérgicas: cor saturada e contraste, com antes/depois.', sec([
        col([grade({ image: IMG('pink-spheres'), mode: 'compare', aspect: '1/1', grade: VIVID, labelBrand: 'Vivo' }, WHITE)]),
        col([
            ...intro('Energia', 'Cor com\nconfiança.', 'Uma marca enérgica pede cor: saturação +25, contraste firme e brancos limpos.', WHITE, 52),
            doDont(['Cores primárias e limpas'], ['Tons lavados e cinzentos']),
        ], { alignVertical: 'middle', blockGap: 24 }),
    ], WHITE, { widths: [1, 1], valign: 'middle' })),

    preset('Os quatro pilares', 'Luz, cor, composição e textura em quatro colunas com imagem.', sec([
        col([lbl('Resumo', PAPER), h('A fotografia\nem quatro ideias.', 52, PAPER), t('Um resumo para levar para qualquer sessão fotográfica.', 16, PAPER)], { blockGap: 16 }),
        col([photo('candle-snow', { aspectRatio: '1/1' }), lbl('01', PAPER), h('Luz', 24, PAPER), t('Natural, lateral, suave.', 14, PAPER)], { blockGap: 12 }),
        col([photo('dune-curve', { aspectRatio: '1/1' }), lbl('02', PAPER), h('Cor', 24, PAPER), t('Quente, contida, −15% saturação.', 14, PAPER)], { blockGap: 12 }),
        col([photo('cloud-frame', { aspectRatio: '1/1' }), lbl('03', PAPER), h('Composição', 24, PAPER), t('Terços e espaço livre.', 14, PAPER)], { blockGap: 12 }),
        col([photo('amber-silk', { aspectRatio: '1/1' }), lbl('04', PAPER), h('Textura', 24, PAPER), t('Grão fino, pretos levantados.', 14, PAPER)], { blockGap: 12 }),
    ], PAPER, { widths: [1.4, 1, 1, 1, 1], gap: 24 })),
]
