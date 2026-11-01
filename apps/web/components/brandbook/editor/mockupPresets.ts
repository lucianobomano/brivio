import { Block } from "./types"
import type { ColumnData, ComponentPreset } from "./componentPresets"

/**
 * Brand application sections: the brand shown on mockups (stationery, apparel, packaging, screens, social
 * posts…). Built from native sections, columns, texts and the gallery block — in every layout the gallery
 * offers (the new endless "Loop", grids, mosaic, strip, fan, coverflow…) — so the section is set up from Edit
 * section, every text from its toolbar and the gallery (images, style, speed, ratio) from its own settings.
 */

let seq = 0
const uid = (prefix: string) => `mock-${prefix}-${++seq}`

const BV = (name: string) => `/brandbook/templates/brivio/${name}.jpg`

/** The brand's mockups and applications */
const MOCKUPS = [BV('application-1'), BV('post-1'), BV('application-2'), BV('post-2'), BV('application-3'), BV('post-3'), BV('post-4'), BV('post-5'), BV('post-6'), BV('app-icon-gradient')]
const PHOTOS = [BV('imagery-1'), BV('imagery-2'), BV('imagery-3'), BV('imagery-4'), BV('imagery-5'), BV('imagery-6')]
const pick = (start: number, count: number, list = MOCKUPS) => Array.from({ length: count }, (_, i) => list[(start + i) % list.length])

type Style = Record<string, unknown>
type Align = 'left' | 'center' | 'right'
const ZERO = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }
const pad = (y: number, x = y) => ({ isLocked: false, top: y, right: x, bottom: y, left: x })

// ---------- themes ----------

interface Theme { bg: string, ink: string, muted: string, line: string, accent: string, card: string }
const ORANGE: Theme = { bg: '#F27A1A', ink: '#141010', muted: 'rgba(20,16,16,0.62)', line: 'rgba(20,16,16,0.18)', accent: '#141010', card: '#F58C35' }
const NIGHT: Theme = { bg: '#0B0B0D', ink: '#F2F2F2', muted: '#8A8A90', line: 'rgba(255,255,255,0.12)', accent: '#FF0054', card: '#151518' }
const PAPER: Theme = { bg: '#F4F1EA', ink: '#141414', muted: '#7A7770', line: 'rgba(20,20,20,0.14)', accent: '#C2410C', card: '#FFFFFF' }
const WHITE: Theme = { bg: '#FFFFFF', ink: '#111111', muted: '#8B8B93', line: 'rgba(0,0,0,0.1)', accent: '#FF0054', card: '#F5F5F7' }
const INK: Theme = { bg: '#0F1A2B', ink: '#E9EEF5', muted: '#7E8CA3', line: 'rgba(233,238,245,0.14)', accent: '#7DD3FC', card: '#16233A' }
const STONE: Theme = { bg: '#E7E7E4', ink: '#1A1A1A', muted: '#77776F', line: 'rgba(0,0,0,0.14)', accent: '#1A1A1A', card: '#F3F3F1' }
const PINK: Theme = { bg: '#FF0054', ink: '#FFFFFF', muted: 'rgba(255,255,255,0.78)', line: 'rgba(255,255,255,0.25)', accent: '#FFFFFF', card: '#E6004C' }
const FOREST: Theme = { bg: '#14201A', ink: '#EEF2EC', muted: '#8FA197', line: 'rgba(238,242,236,0.14)', accent: '#A3D9A5', card: '#1C2B23' }
const SAND: Theme = { bg: '#EFE6DA', ink: '#2B1F18', muted: '#8C7666', line: 'rgba(43,31,24,0.16)', accent: '#B4532A', card: '#F7F0E6' }
const INDIGO: Theme = { bg: '#390099', ink: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', line: 'rgba(255,255,255,0.2)', accent: '#06D6A0', card: '#4A12B0' }

// ---------- blocks ----------

const h = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'heading' as Block['type'],
    content: { text: value, style: { fontSize: `${size}px`, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: '0.98', color: th.ink, ...style } },
})
const t = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'text', content: { text: value, style: { fontSize: `${size}px`, lineHeight: '1.6', color: th.muted, ...style } },
})
const lbl = (value: string, th: Theme, style: Style = {}) =>
    t(value, 11, th, { fontFamily: 'Space Mono', textTransform: 'uppercase', letterSpacing: '0.14em', lineHeight: '1.6', color: th.accent, ...style })
const rule = (th: Theme) => t('​', 1, th, { borderTop: `1px solid ${th.line}`, lineHeight: '1px', height: '1px' })

/** The gallery block, in any of its styles */
const gallery = (urls: string[], style: Style): Block => ({
    id: uid('b'), type: 'gallery',
    content: { items: urls.map(url => ({ url, caption: '' })), style: { imageRadius: 14, ...style } },
})
const loopV = (urls: string[], columns = 2, style: Style = {}) => gallery(urls, { galleryType: 'loop', loopDirection: 'vertical', columns, loopSpeed: 36, loopHeight: 680, loopGap: 16, aspectRatio: '4/5', ...style })
const loopH = (urls: string[], rows = 2, style: Style = {}) => gallery(urls, { galleryType: 'loop', loopDirection: 'horizontal', columns: rows, loopSpeed: 44, loopRowHeight: 240, loopGap: 16, aspectRatio: '4/3', ...style })

/** A list of applications with a code on the right (like a product sheet) */
const sheet = (rows: [string, string][], th: Theme) => rows.flatMap(([name, code]) => [
    rule(th),
    row([[t(name, 14, th, { color: th.ink, fontWeight: 500 })], [t(code, 11, th, { fontFamily: 'Space Mono', textAlign: 'right', letterSpacing: '0.1em' })]], { gap: 16, valign: 'middle' }),
])

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

// ---------- columns / sections ----------

const col = (blocks: Block[], s: Style = {}): ColumnData => ({
    id: uid('col'), blocks,
    settings: { padding: ZERO, blockGap: 20, alignHorizontal: 'left', alignVertical: 'top', ...s },
})

/** Section whose padding (Edit section) sets the margins; the content fills the room left */
const sec = (columns: ColumnData[], th: Theme, opts: { widths?: number[], gap?: number, padY?: number, padX?: number, valign?: 'top' | 'middle' | 'bottom', extra?: Style } = {}): Block => ({
    id: uid('sec'), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length, columnWidths: opts.widths || Array(columns.length).fill(1),
            padding: ZERO, columnGap: opts.gap ?? 64,
            sectionPadding: { isLocked: false, top: opts.padY ?? 110, right: opts.padX ?? 72, bottom: opts.padY ?? 110, left: opts.padX ?? 72 },
            contentWidth: 'fluid', backgroundType: 'color', backgroundColor: th.bg,
            alignVertical: opts.valign || 'top', alignHorizontal: 'left', height: 'fit',
            ...opts.extra,
        },
    },
})

const intro = (label: string, title: string, body: string, th: Theme, size = 64, align: Align = 'left') => [
    lbl(label, th, { textAlign: align }),
    h(title, size, th, { textAlign: align }),
    t(body, 16, th, { textAlign: align, maxWidth: '460px' }),
]
const header = (label: string, title: string, body: string, th: Theme, size = 56) =>
    row([[lbl(label, th), h(title, size, th)], [t(body, 16, th)]], { widths: [1.3, 1], valign: 'bottom', gap: 64 })

let n = 0
const preset = (name: string, description: string, data: Block): ComponentPreset =>
    ({ id: `sec-mockup-${String(++n).padStart(2, '0')}`, kind: 'section', topic: 'mockups', name, description, data })

const APPS: [string, string][] = [['Capacete', 'EPI · 001'], ['Uniforme', 'TXT · 002'], ['Cartão de visita', 'PPL · 003'], ['Assinatura de e-mail', 'DIG · 004']]

// =====================================================================================================

export const MOCKUP_PRESETS: ComponentPreset[] = [
    // 1 · The reference: text on the left, two columns looping up and down on the right
    preset('No mundo real', 'Texto e lista de aplicações à esquerda; à direita duas colunas de mockups em loop, uma a subir e outra a descer.', sec([
        col([...intro('Aplicações', 'No mundo\nreal.', 'Do capacete à assinatura de e-mail: a mesma marca, firme em qualquer superfície — na obra, na rua e na tela.', ORANGE, 72), ...sheet(APPS, ORANGE)], { alignVertical: 'middle', blockGap: 18 }),
        col([loopV(MOCKUPS, 2)]),
    ], ORANGE, { widths: [0.8, 1.2], gap: 72, valign: 'middle', padY: 80 })),

    // 2
    preset('Faixas em movimento', 'Título e texto em cima; por baixo duas filas de mockups a deslizar em sentidos opostos.', sec([
        col([header('Aplicações', 'A marca\nem toda a parte.', 'Uma seleção das peças que levam a marca ao dia a dia — impressas, vestidas e digitais.', NIGHT), loopH(MOCKUPS, 2)], { blockGap: 56 }),
    ], NIGHT)),

    // 3
    preset('Três colunas em loop', 'Três colunas de mockups em loop à esquerda e o texto à direita, sobre escuro.', sec([
        col([loopV(pick(2, 9), 3, { loopHeight: 720, loopSpeed: 30 })]),
        col([...intro('Mockups', 'Pensada para\nser vista.', 'Cada aplicação foi testada à escala real, nos materiais finais.', INK, 60), t('Ficheiros de produção disponíveis na biblioteca de recursos.', 14, INK, { color: INK.accent })], { alignVertical: 'middle' }),
    ], INK, { widths: [1.3, 0.7], gap: 72, valign: 'middle', padY: 80 })),

    // 4
    preset('Fita panorâmica', 'Título centrado e uma única fila larga de mockups em loop contínuo.', sec([
        col([...intro('Aplicações', 'Uma marca, mil formas.', 'Do papel ao ecrã, a identidade mantém-se clara e reconhecível.', PAPER, 64, 'center'), loopH(pick(0, 10), 1, { loopRowHeight: 380, loopSpeed: 36, loopFade: false })], { alignHorizontal: 'center', blockGap: 48 }),
    ], PAPER, { padY: 120 })),

    // 5
    preset('Mosaico de aplicações', 'Título e mosaico de mockups, com uma imagem em destaque.', sec([
        col([header('Mockups', 'O sistema\naplicado.', 'Peças reais que mostram como o logótipo, a cor e a tipografia trabalham juntos.', WHITE), gallery(pick(0, 7), { galleryType: 'mosaic', columns: 4, imageRadius: 12 })], { blockGap: 48 }),
    ], WHITE)),

    // 6
    preset('Grelha com legendas', 'Três mockups verticais em grelha, cada um com a sua legenda por baixo.', sec([
        col([
            header('Papelaria', 'Feita para\nser tocada.', 'Cartões, envelopes e papel de carta com o mesmo rigor do digital.', SAND),
            gallery(pick(0, 3), { galleryType: 'grid', columns: 3, aspectRatio: '4/5', imageRadius: 16 }),
            row([[lbl('01', SAND), t('Cartão de visita · algodão 350 g', 14, SAND, { color: SAND.ink })], [lbl('02', SAND), t('Papel de carta · A4, 120 g', 14, SAND, { color: SAND.ink })], [lbl('03', SAND), t('Envelope · DL, fecho autoadesivo', 14, SAND, { color: SAND.ink })]], { gap: 24 }),
        ], { blockGap: 32 }),
    ], SAND)),

    // 7
    preset('Faixa deslizante', 'Faixa horizontal de mockups que se percorre com setas, com título por cima.', sec([
        col([header('Digital', 'A marca\nno ecrã.', 'Site, aplicação, apresentações e redes sociais, lado a lado.', STONE), gallery(pick(3, 7), { galleryType: 'slider', columns: 3, aspectRatio: '4/3', imageRadius: 16, sliderNav: true, sliderCounter: true })], { blockGap: 48 }),
    ], STONE)),

    // 8
    preset('Leque de mockups', 'Mockups dispostos em leque à volta da imagem em foco, sobre rosa Brivio.', sec([
        col([...intro('Campanha', 'Peças que\nse destacam.', 'A campanha de lançamento em todos os formatos.', PINK, 64, 'center'), gallery(pick(1, 7), { galleryType: 'slider', sliderArrangement: 'fan', aspectRatio: '4/5', imageRadius: 18 })], { alignHorizontal: 'center', blockGap: 40 }),
    ], PINK, { padY: 120 })),

    // 9
    preset('Coverflow', 'Mockups em coverflow 3D, com o texto à esquerda.', sec([
        col([...intro('Embalagem', 'Abrir a caixa\né abrir a marca.', 'Caixas, sacos e papel de seda pensados como o primeiro capítulo da experiência.', NIGHT, 56)], { alignVertical: 'middle' }),
        col([gallery(pick(4, 6), { galleryType: 'slider', sliderArrangement: 'coverflow', aspectRatio: '1/1', imageRadius: 16 })], { alignVertical: 'middle' }),
    ], NIGHT, { widths: [0.75, 1.25], gap: 48, valign: 'middle' })),

    // 10
    preset('Dois destaques e ficha', 'Dois mockups grandes e uma coluna com a ficha técnica das aplicações.', sec([
        col([gallery(pick(0, 2), { galleryType: 'grid', columns: 2, aspectRatio: '3/4', imageRadius: 18 })]),
        col([lbl('Ficha', WHITE), h('Uniforme e\nidentificação.', 40, WHITE), ...sheet([['Polo', 'Algodão 220 g'], ['Casaco', 'Softshell'], ['Crachá', 'PVC 0,76 mm'], ['Cordão', 'Poliéster 20 mm']], WHITE)], { alignVertical: 'middle', blockGap: 14, backgroundColor: WHITE.card, radius: 20, padding: pad(32, 28) }),
    ], WHITE, { widths: [1.5, 0.7], gap: 24, valign: 'middle' })),

    // 11
    preset('Parede em loop', 'Título por cima e quatro colunas de mockups em loop a toda a largura.', sec([
        col([...intro('Galeria', 'Tudo o que a marca veste.', 'Uma parede viva de aplicações — passe o rato para parar e ver de perto.', FOREST, 56, 'center'), loopV(pick(0, 10), 4, { loopHeight: 560, loopSpeed: 28, aspectRatio: '3/4' })], { alignHorizontal: 'center', blockGap: 40 }),
    ], FOREST, { padY: 100 })),

    // 12
    preset('Galeria justificada', 'Mockups numa galeria justificada, em filas de altura igual.', sec([
        col([header('Aplicações', 'Lado a lado.', 'Cada peça mantém as proporções reais.', PAPER), gallery(pick(0, 8), { galleryType: 'justified', imageRadius: 10 })], { blockGap: 40 }),
    ], PAPER)),

    // 13
    preset('Texto fixo e masonry', 'Texto à esquerda e mockups em masonry à direita, em colunas de alturas diferentes.', sec([
        col([...intro('Mockups', 'Detalhe a\ndetalhe.', 'Do bordado do uniforme ao relevo do cartão: os pormenores também são marca.', STONE, 52)]),
        col([gallery(pick(1, 8), { galleryType: 'masonry', columns: 3, imageRadius: 12 })]),
    ], STONE, { widths: [0.6, 1.4], gap: 56 })),

    // 14
    preset('Destaque e coluna em loop', 'Um mockup grande à esquerda, uma coluna em loop no meio e o texto à direita.', sec([
        col([gallery([MOCKUPS[0]], { galleryType: 'grid', columns: 1, aspectRatio: '4/5', imageRadius: 20 })]),
        col([loopV(pick(1, 8), 1, { loopHeight: 620, loopSpeed: 30 })]),
        col([...intro('Sinalética', 'Encontrar\no caminho.', 'Sinalética exterior, interior e direcional com a mesma grelha e o mesmo tipo.', INK, 44)], { alignVertical: 'middle' }),
    ], INK, { widths: [1.2, 0.6, 0.9], gap: 24, valign: 'middle', padY: 80 })),

    // 15
    preset('Catálogo numerado', 'Lista numerada de aplicações à esquerda e duas colunas em loop à direita, sobre papel.', sec([
        col([
            lbl('Catálogo', PAPER), h('Todas as\naplicações.', 60, PAPER),
            ...[['01', 'Papelaria'], ['02', 'Uniformes'], ['03', 'Embalagem'], ['04', 'Sinalética'], ['05', 'Digital'], ['06', 'Frota']].flatMap(([k, v]) => [rule(PAPER), row([[lbl(k, PAPER, { color: PAPER.muted })], [h(v, 24, PAPER, { fontWeight: 600, letterSpacing: '-0.02em' })]], { widths: [0.2, 1], gap: 12, valign: 'middle' })]),
        ], { alignVertical: 'middle', blockGap: 14 }),
        col([loopV(pick(2, 10), 2, { loopSpeed: 42 })]),
    ], PAPER, { widths: [0.9, 1.1], gap: 72, valign: 'middle', padY: 80 })),

    // 16
    preset('Três faixas rápidas', 'Três filas de mockups em loop, alternando sentidos, com o título por cima.', sec([
        col([h('Marca em movimento.', 88, NIGHT, { letterSpacing: '-0.05em' }), loopH(pick(0, 10), 3, { loopRowHeight: 180, loopSpeed: 60, loopGap: 12, imageRadius: 10 })], { blockGap: 40 }),
    ], NIGHT, { padY: 100 })),

    // 17
    preset('Pilha de cartões', 'Mockups em cartões sobrepostos, à direita do texto, sobre índigo.', sec([
        col([...intro('Redes sociais', 'Feita para\npartilhar.', 'Modelos de publicações e stories prontos a usar, em todas as redes.', INDIGO, 56)], { alignVertical: 'middle' }),
        col([gallery(pick(5, 6), { galleryType: 'slider', sliderArrangement: 'cards', aspectRatio: '4/5', imageRadius: 20 })], { alignVertical: 'middle' }),
    ], INDIGO, { widths: [0.8, 1.2], gap: 48, valign: 'middle' })),

    // 18
    preset('Grelha de publicações', 'Publicações sociais numa grelha quadrada de quatro colunas.', sec([
        col([header('Social', 'O feed da marca.', 'Uma grelha coerente: cor, tipo e fotografia a trabalhar em conjunto.', WHITE), gallery(pick(1, 8), { galleryType: 'grid', columns: 4, aspectRatio: '1/1', imageRadius: 8 })], { blockGap: 40 }),
    ], WHITE)),

    // 19
    preset('Montra escura', 'Painel escuro com três colunas em loop e uma barra de especificações por baixo.', sec([
        col([
            row([[lbl('Montra', NIGHT), h('A marca, peça a peça.', 48, NIGHT)], [t('Passe o rato sobre a montra para parar o movimento.', 14, NIGHT, { textAlign: 'right' })]], { widths: [1.4, 1], valign: 'bottom', align: ['left', 'right'] }),
            loopV(pick(0, 10), 3, { loopHeight: 520, loopSpeed: 32, aspectRatio: '1/1', imageRadius: 12 }),
            row([[lbl('Peças', NIGHT, { color: NIGHT.muted }), t('24', 22, NIGHT, { color: NIGHT.ink, fontWeight: 700 })], [lbl('Formatos', NIGHT, { color: NIGHT.muted }), t('Impresso · digital', 16, NIGHT, { color: NIGHT.ink })], [lbl('Ficheiros', NIGHT, { color: NIGHT.muted }), t('AI · PDF · PNG', 16, NIGHT, { color: NIGHT.ink })], [lbl('Atualizado', NIGHT, { color: NIGHT.muted }), t('2026', 16, NIGHT, { color: NIGHT.ink })]], { gap: 24 }),
        ], { blockGap: 32, backgroundColor: NIGHT.card, radius: 28, padding: pad(40, 40) }),
    ], NIGHT, { padY: 80 })),

    // 20
    preset('Fotografia e mockups', 'Duas colunas em loop — uma de fotografia, outra de mockups — com o texto ao centro, sobre o gradiente Brivio.', sec([
        col([loopV(PHOTOS, 1, { loopHeight: 640, loopSpeed: 26, aspectRatio: '3/4' })]),
        col([lbl('Marca viva', PINK), h('Onde a imagem\nencontra a marca.', 56, PINK, { textAlign: 'center' }), t('A fotografia dá o contexto; os mockups mostram a marca aplicada. Juntas contam a história completa.', 16, PINK, { textAlign: 'center' })], { alignVertical: 'middle', alignHorizontal: 'center' }),
        col([loopV(pick(0, 8), 1, { loopHeight: 640, loopSpeed: 26, aspectRatio: '3/4', loopReverse: true })]),
    ], PINK, { widths: [0.8, 1.2, 0.8], gap: 40, valign: 'middle', padY: 80, extra: { backgroundType: 'image', backgroundImage: '/brandbook/presets/brivio-gradient.jpg', backgroundColor: '#390099' } })),
]
