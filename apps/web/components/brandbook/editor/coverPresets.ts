import { Block } from "./types"
import type { ColumnData, ComponentPreset } from "./componentPresets"
import { brivioSymbol } from "./blocks/brivioSymbol"
import { createMarqueeContent, type MarqueeRow, type MarqueeSettings } from "./blocks/marquee"
import type { CoverSettings } from "./cover"

/**
 * Brandbook covers: full-screen (100vh) sections built only from native sections, columns and blocks
 * (texts, images, layouts, loops), so every word, colour, image and spacing stays editable after inserting.
 * Images: public/brandbook/presets/covers (and the official Brivio logo / gradient).
 */

let seq = 0
const uid = (prefix: string) => `cover-${prefix}-${++seq}`

const IMG = (name: string) => `/brandbook/presets/covers/${name}.webp`
const LOGO_WHITE = '/brandbook/presets/brivio-logo-white.png'
const LOGO_DARK = '/brandbook/presets/brivio-logo.png'
const GRADIENT = '/brandbook/presets/brivio-gradient.jpg'

const B = { pink: '#FF0054', magenta: '#9E0059', indigo: '#390099', green: '#06D6A0' }
const BRIVIO_TEXT_GRADIENT = `linear-gradient(100deg, ${B.pink} 0%, ${B.magenta} 35%, ${B.indigo} 65%, ${B.green} 100%)`

// Fonts (loaded on demand by the text blocks)
const F = {
    syne: 'Syne', grotesk: 'Space Grotesk', archivo: 'Archivo Black', bebas: 'Bebas Neue', anton: 'Anton', oswald: 'Oswald',
    unbounded: 'Unbounded', montserrat: 'Montserrat', outfit: 'Outfit', urbanist: 'Urbanist', manrope: 'Manrope', poppins: 'Poppins',
    playfair: 'Playfair Display', instrument: 'Instrument Serif', dmSerif: 'DM Serif Display', mono: 'Space Mono',
}

type Style = Record<string, unknown>
type Align = 'left' | 'center' | 'right'
const ZERO = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }
const pad = (top: number, right = top, bottom = top, left = right) => ({ isLocked: false, top, right, bottom, left })

// ---------- blocks ----------

const h = (value: string, size: number, style: Style = {}): Block => ({
    id: uid('b'), type: 'heading' as Block['type'],
    content: { text: value, style: { fontSize: `${size}px`, lineHeight: '0.92', fontWeight: 700, letterSpacing: '-0.03em', ...style } },
})

const t = (value: string, size = 16, style: Style = {}): Block => ({
    id: uid('b'), type: 'text', content: { text: value, style: { fontSize: `${size}px`, lineHeight: '1.5', ...style } },
})

/** Small uppercase label in mono */
const meta = (value: string, color: string, style: Style = {}) =>
    t(value, 11, { fontFamily: F.mono, textTransform: 'uppercase', letterSpacing: '0.14em', lineHeight: '1.6', color, ...style })

/** Thin rule (a text with a top border, editable like any text) */
const line = (color: string, style: Style = {}) => t('​', 1, { borderTop: `1px solid ${color}`, lineHeight: '1px', height: '1px', ...style })

const img = (url: string, style: Style = {}): Block => ({ id: uid('b'), type: 'image', content: { url, caption: '', style } })

const symbol = (width: number, color?: string) => img(brivioSymbol(color), { width })

const loop = (items: string[], settings: MarqueeSettings = {}, rows: Partial<MarqueeRow>[] = []): Block => ({
    id: uid('b'), type: 'marquee' as Block['type'],
    content: { ...createMarqueeContent(rows.length ? rows.map(r => ({ items, ...r })) : [{ items }], { borderTop: false, borderBottom: false, ...settings }) },
})

/** Gradient-filled text */
const gradientText = (gradient: string): Style => ({ backgroundImage: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' })

/** Outlined text */
const outline = (color: string, width = 2): Style => ({ WebkitTextStroke: `${width}px ${color}`, color: 'transparent' })

// ---------- layouts inside a column (rows of texts) ----------

/** A row of small columns inside a column (meta bars, logo + text…): a native layout block */
const row = (cols: Block[][], opts: { widths?: number[], gap?: number, align?: Align[], valign?: 'top' | 'middle' | 'bottom', itemGap?: number } = {}): Block => ({
    id: uid('row'), type: 'layout', variant: `${cols.length}-col`,
    content: {
        columns: cols.map((blocks, i) => ({
            id: uid('rc'), blocks,
            settings: { padding: ZERO, blockGap: opts.itemGap ?? 6, alignHorizontal: opts.align?.[i] || 'left', alignVertical: opts.valign || 'top' },
        })),
        settings: {
            columns: cols.length, columnWidths: opts.widths || Array(cols.length).fill(1), columnGap: opts.gap ?? 32,
            padding: ZERO, height: 'fit', alignVertical: 'top', alignHorizontal: 'left',
        },
    },
})

/** Blocks kept together (one column) */
const stack = (blocks: Block[], gap = 16, align: Align = 'left') => row([blocks], { itemGap: gap, align: [align] })

// ---------- columns / sections ----------

/** A cover column: full height, its groups spread from top to bottom */
const col = (blocks: Block[], s: Style = {}): ColumnData => ({
    id: uid('col'), blocks,
    settings: {
        heightMode: 'fill', contentDistribution: 'between', alignHorizontal: 'left', alignVertical: 'top',
        padding: pad(56, 64), blockGap: 24, ...s,
    },
})

/** Full-screen section (100vh), no outer padding: the columns hold the spacing (and an overlay when they have one) */
const cover = (columns: ColumnData[], s: Style = {}, widths?: number[]): Block => ({
    id: uid('sec'), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length, columnWidths: widths || Array(columns.length).fill(1),
            height: '100vh', sectionPadding: ZERO, padding: ZERO, columnGap: 0,
            alignVertical: 'top', alignHorizontal: 'left', isFullWidth: true, isCover: true,
            backgroundType: 'color', backgroundColor: '#000000',
            ...s,
        },
    },
})

const onImage = (name: string, fallback = '#000000') => ({ backgroundType: 'image', backgroundImage: IMG(name), backgroundColor: fallback })

/** Cover background effects (animated layer, image motion, finish): see cover.ts */
const fx = (cover: CoverSettings) => ({ cover })
const BRIVIO_FX = [B.pink, B.magenta, B.indigo, B.green]

let n = 0
const preset = (name: string, description: string, data: Block): ComponentPreset =>
    ({ id: `cover-${String(++n).padStart(2, '0')}`, kind: 'section', topic: 'cover', name, description, data })

// ---------- recurring parts ----------

const topBar = (color: string, items = ['Brand book', 'Edição 2026', 'v. 1.0']) =>
    row(items.map(i => [meta(i, color)]), { align: items.map((_, i) => i === 0 ? 'left' : i === items.length - 1 ? 'right' : 'center') })

const bottomBar = (color: string, left = 'Manual de identidade', right = '↓ Role para começar') =>
    row([[meta(left, color)], [meta(right, color)]], { align: ['left', 'right'] })

const W = '#FFFFFF', K = '#0A0A0A'
const W60 = 'rgba(255,255,255,0.6)', W30 = 'rgba(255,255,255,0.3)', K60 = 'rgba(10,10,10,0.6)', K20 = 'rgba(10,10,10,0.2)'

// =====================================================================================================

const RAW_COVERS: ComponentPreset[] = [
    // ----- 1-10: dark, image-led -----
    preset('Protegendo marcas', 'Logótipo com assinatura ao centro e o cristal da Brivio a nascer em baixo.', cover([
        col([
            topBar(W60, ['Brivio®', 'Brand book', '2026']),
            row([[img(LOGO_WHITE, { width: 260 })], [t('Protegendo\nmarcas', 20, { color: W, lineHeight: '1.15', borderLeft: `1px solid ${W30}`, paddingLeft: '20px' })]],
                { widths: [1.4, 1], gap: 20, valign: 'middle', align: ['right', 'left'] }),
            img(IMG('crystal-prism'), { width: 520 }),
        ], { alignHorizontal: 'center', padding: pad(48, 64, 0) }),
    ], { backgroundColor: '#000000', ...fx({ grain: 18, vignette: 45 }) })),

    preset('Cristal', 'Título gigante à esquerda e o cristal iridescente à direita, sobre preto.', cover([
        col([
            topBar(W60),
            stack([meta('Identidade visual · 2026', B.pink), h('Brivio°', 107, { fontFamily: F.syne, color: W, fontWeight: 800 }), t('A forma como a marca se mostra, fala e se move.', 18, { color: W60, maxWidth: '420px' })], 22),
        ]),
        col([img(IMG('crystal-hero'), { width: 560 })], { alignHorizontal: 'center', alignVertical: 'middle', contentDistribution: 'packed', padding: pad(40) }),
    ], { backgroundColor: '#000000' }, [1.2, 1])),

    preset('Âmbar', 'Marca centrada sobre seda âmbar, com assinatura e convite a descer.', cover([
        col([
            row([[meta('Identidade visual · 2026', W60, { textAlign: 'center' })]], { align: ['center'] }),
            stack([
                h('Brivio°', 180, { fontFamily: F.montserrat, color: W, fontWeight: 600, letterSpacing: '-0.02em', textAlign: 'center' }),
                t('EVERY DETAIL. DONE RIGHT', 20, { color: W, fontWeight: 700, letterSpacing: '0.2em', textAlign: 'center', fontFamily: F.montserrat }),
                t('A marca de quem entrega o projeto completo,\ndo primeiro esboço à última peça aplicada.', 16, { color: W60, textAlign: 'center' }),
            ], 18, 'center'),
            row([[meta('Brand book', W60)], [meta('↓ Role para a volta', W60, { textAlign: 'center' })], [meta('V. 1.0', W60, { textAlign: 'right' })]], { align: ['left', 'center', 'right'] }),
        ], { alignHorizontal: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }),
    ], { ...onImage('amber-silk', '#1A0B00'), ...fx({ imageMotion: 'parallax', spotlight: true, spotlightColor: '#FFB347', spotlightOpacity: 35, grain: 25 }) })),

    preset('Corredor de prismas', 'Volume em mono no topo, título condensado gigante sobre o corredor vermelho.', cover([
        col([
            topBar(W60, ['Volume 01', 'Sistema de marca', '2026']),
            stack([h('Brivio°', 210, { fontFamily: F.anton, color: W, fontWeight: 400, letterSpacing: '0', lineHeight: '0.86' }), line(W30), bottomBar(W60, 'Regras, ferramentas e exemplos', '01 / 08')], 24),
        ], { backgroundColor: 'rgba(0,0,0,0.35)' }),
    ], { ...onImage('prism-corridor', '#140008'), ...fx({ imageMotion: 'parallax', vignette: 40, grain: 20 }) })),

    preset('Galeria vermelha', 'Texto alinhado à direita, serifado, sobre o salão vermelho.', cover([
        col([
            topBar(W60, ['Capítulo I', 'Identidade', 'MMXXVI']),
            stack([h('Brivio°', 180, { fontFamily: F.playfair, color: W, fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'right', fontStyle: 'italic' }), t('Tudo o que torna a marca reconhecível à primeira vista.', 17, { color: W60, textAlign: 'right' })], 22, 'right'),
        ], { alignHorizontal: 'right', backgroundColor: 'rgba(0,0,0,0.2)' }),
    ], onImage('red-hall', '#12000A'))),

    preset('Linhas verdes', 'Título em grotesca com dados da edição em colunas, sobre ondas verdes.', cover([
        col([
            row([[symbol(36, W)], [meta('Brand guidelines', W60, { textAlign: 'right' })]], { align: ['left', 'right'], valign: 'middle' }),
            stack([
                h('Brivio°', 180, { fontFamily: F.grotesk, color: W, fontWeight: 500, letterSpacing: '-0.04em' }),
                line(W30),
                row([[meta('Edição', W60), t('02 / 2026', 15, { color: W })], [meta('Equipa', W60), t('Brand Studio', 15, { color: W })], [meta('Estado', W60), t('Em vigor', 15, { color: W })], [meta('Versão', W60), t('2.0', 15, { color: W })]], { gap: 24 }),
            ], 26),
        ]),
    ], onImage('green-lines', '#021A12'))),

    preset('Anéis índigo', 'Capa com índice: título e os capítulos do manual numerados em baixo.', cover([
        col([
            topBar(W60, ['Brand book', 'Índice', '2026']),
            stack([
                h('Brivio°', 180, { fontFamily: F.unbounded, color: W, fontWeight: 700, letterSpacing: '-0.05em' }),
                row([
                    [meta('01', B.pink), t('Estratégia', 18, { color: W })],
                    [meta('02', B.pink), t('Logótipo', 18, { color: W })],
                    [meta('03', B.pink), t('Cores', 18, { color: W })],
                    [meta('04', B.pink), t('Tipografia', 18, { color: W })],
                ], { gap: 24 }),
            ], 40),
        ]),
    ], onImage('indigo-rings', '#0B0045'))),

    preset('Pontos azuis', 'Estética tech: tudo em mono, título em blocos, sobre a malha de pontos.', cover([
        col([
            row([[meta('[ brand.book ]', W)], [meta('sys.v2026', W60, { textAlign: 'center' })], [meta('status: live ●', B.green, { textAlign: 'right' })]], { align: ['left', 'center', 'right'] }),
            stack([h('Brivio°', 180, { fontFamily: F.mono, color: W, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: '0.95' }), t('> regras, componentes e tokens da marca', 16, { color: W60, fontFamily: F.mono })], 22),
        ]),
    ], { ...onImage('blue-dots', '#000C3D'), ...fx({ imageMotion: 'parallax', spotlight: true, spotlightColor: '#4D8DFF', spotlightOpacity: 40 }) })),

    preset('Rocha magenta', 'Título bruto à esquerda e a rocha com luz magenta à direita.', cover([
        col([
            topBar(W60, ['Brand book', 'Força', '2026']),
            stack([h('Brivio°', 99, { fontFamily: F.archivo, color: W, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: '0.88' }), t('Uma marca construída para durar, sem arestas por limar.', 17, { color: W60, maxWidth: '380px' })], 24),
        ]),
        col([img(IMG('dark-rock'), { width: 560 })], { alignHorizontal: 'center', alignVertical: 'middle', contentDistribution: 'packed', padding: pad(40) }),
    ], { backgroundColor: '#000000' }, [1.15, 1])),

    preset('Gradiente Brivio', 'O logótipo oficial em grande sobre o gradiente da marca.', cover([
        col([
            topBar(W60, ['Brand book', 'Brivio', '2026']),
            img(LOGO_WHITE, { width: 640 }),
            bottomBar(W60, 'Protegendo marcas', 'brivio.com'),
        ], { alignHorizontal: 'center' }),
    ], { backgroundType: 'image', backgroundImage: GRADIENT, backgroundColor: B.indigo, ...fx({ imageMotion: 'liquid', intensity: 45 }) })),

    // ----- 11-20: light & soft imagery -----
    preset('Portal de dunas', 'Editorial serifado em itálico sobre o portal das dunas rosadas.', cover([
        col([
            topBar('rgba(58,22,22,0.7)', ['N.º 01', 'Tom de voz', '2026']),
            stack([h('Brivio°', 180, { fontFamily: F.instrument, color: '#3A1616', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }), t('Palavras calmas, frases curtas, promessas que se cumprem.', 17, { color: 'rgba(58,22,22,0.7)' })], 20),
        ]),
    ], onImage('dune-portal', '#F3D6CC'))),

    preset('Nuvem emoldurada', 'Uma palavra serifada enorme, centrada sobre o céu.', cover([
        col([
            topBar(W, ['Brand book', 'Clareza', '2026']),
            h('Brivio°', 210, { fontFamily: F.dmSerif, color: W, fontWeight: 400, letterSpacing: '-0.03em', textAlign: 'center', textShadow: '0 10px 40px rgba(0,0,0,0.25)' }),
            bottomBar(W, 'Princípios da marca', 'Capítulo 01'),
        ], { alignHorizontal: 'center', backgroundColor: 'rgba(0,0,0,0.08)' }),
    ], onImage('cloud-frame', '#9CC3D5'))),

    preset('Esferas rosa', 'Tipografia arredondada e lúdica sobre as esferas cor-de-rosa.', cover([
        col([
            topBar('rgba(43,15,58,0.7)', ['Brand book', 'Personalidade', '2026']),
            stack([h('Brivio°', 211, { fontFamily: F.syne, color: '#2B0F3A', fontWeight: 800, letterSpacing: '-0.06em', lineHeight: '0.82' }), t('Leve, curiosa e sempre um passo à frente.', 18, { color: 'rgba(43,15,58,0.75)' })], 22),
        ]),
    ], onImage('pink-spheres', '#F6D7E4'))),

    preset('Arco rosa', 'Frase serifada no fundo, sobre o arco aberto para o mar rosa.', cover([
        col([
            topBar(W, ['Visão', 'Brand book', '2026']),
            stack([h('Brivio°', 180, { fontFamily: F.playfair, color: W, fontWeight: 500, letterSpacing: '-0.03em', textAlign: 'center' }), meta('A visão que guia cada decisão', W, { textAlign: 'center' })], 22, 'center'),
        ], { alignHorizontal: 'center', backgroundColor: 'rgba(40,10,60,0.15)' }),
    ], onImage('pink-arch', '#C9A2D8'))),

    preset('Cristal de gelo', 'Título branco e nítido sobre o cristal azul, com dados em colunas.', cover([
        col([
            topBar(W),
            stack([h('Brivio°', 200, { fontFamily: F.outfit, color: W, fontWeight: 300, letterSpacing: '-0.06em' }), line(W30), row([[t('Claro no que diz.', 18, { color: W })], [t('Firme no que faz.', 18, { color: W })], [t('Fiel ao que é.', 18, { color: W })]])], 24),
        ], { backgroundColor: 'rgba(0,20,40,0.35)' }),
    ], { ...onImage('ice-crystal', '#0A3A5C'), ...fx({ imageMotion: 'liquid', intensity: 35 }) })),

    preset('Pôr do sol', 'Saudação enorme em grotesca escura sobre o gradiente suave.', cover([
        col([
            topBar(K60),
            stack([h('Brivio°', 230, { fontFamily: F.urbanist, color: K, fontWeight: 700, letterSpacing: '-0.06em', lineHeight: '0.85' }), t('Tudo começa com uma boa apresentação.', 18, { color: K60 })], 20),
        ]),
    ], onImage('sunset-haze', '#F4C7B5'))),

    preset('Coral e violeta', 'Título condensado em três linhas com o ano em contorno.', cover([
        col([
            topBar(W),
            stack([h('Brivio°', 220, { fontFamily: F.bebas, color: W, fontWeight: 400, letterSpacing: '0.01em', lineHeight: '0.84' }), h('2026', 220, { fontFamily: F.bebas, fontWeight: 400, letterSpacing: '0.01em', lineHeight: '0.84', ...outline(W, 2) })], 0),
        ]),
    ], onImage('coral-violet', '#E0577E'))),

    preset('Fluido violeta', 'Símbolo Brivio em grande no centro, nome e assinatura por baixo.', cover([
        col([
            topBar(W),
            stack([symbol(180, W), h('Brivio°', 180, { fontFamily: F.outfit, color: W, fontWeight: 500, letterSpacing: '-0.04em', textAlign: 'center' }), meta('Protegendo marcas', W, { textAlign: 'center' })], 22, 'center'),
            bottomBar(W),
        ], { alignHorizontal: 'center' }),
    ], { backgroundColor: '#1A0B4A', ...fx({ effect: 'liquid', colors: ['#5B3BE0', B.pink, B.green, '#1A0B4A'], intensity: 65, mouseStrength: 70 }) })),

    preset('Bolhas púrpura', 'Duas palavras em largura total com subtítulo à direita.', cover([
        col([
            topBar(W),
            stack([
                h('Brivio°', 185, { fontFamily: F.unbounded, color: W, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: '0.88' }),
                row([[line(W60)], [t('Uma identidade que respira, cresce e se adapta sem perder o essencial.', 17, { color: W })]], { widths: [1, 1.2], valign: 'middle' }),
            ], 28),
        ]),
    ], onImage('purple-bubbles', '#7A1FD8'))),

    preset('Névoa lilás', 'Minimalismo editorial: mono no topo, serifa ao centro, assinatura em baixo.', cover([
        col([
            topBar(K60, ['Edição especial', 'Brand book', '2026']),
            h('Brivio°', 180, { fontFamily: F.instrument, color: K, fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'center' }),
            bottomBar(K60, 'Princípios de design', 'p. 01'),
        ], { alignHorizontal: 'center' }),
    ], onImage('lilac-haze', '#E1D3F5'))),

    // ----- 21-30: solid colour & typographic -----
    preset('Estratégia vermelha', 'Barra de dados, título bold gigante e fotografia à direita.', cover([
        col([
            row([[meta('@2026', W)], [meta('Version 3.0.7', W)], [meta('Our brand //', W), t('Uma marca clara no que defende e consistente em tudo o que mostra.', 12, { color: W60, lineHeight: '1.45' })]], { widths: [0.6, 1, 1.4] }),
            stack([t('branding · identity\nand positioning', 20, { color: W, fontWeight: 600, lineHeight: '1.15', fontFamily: F.poppins }), h('Brivio°', 122, { fontFamily: F.poppins, color: W, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: '0.88' })], 18),
        ]),
        col([], { backgroundImage: IMG('dune-curve'), padding: ZERO }),
    ], { backgroundColor: '#E1262C' }, [1.3, 1])),

    preset('Guideline verde', 'Marca leve e título condensado sobre verde-musgo, fotografia à direita.', cover([
        col([
            row([[meta('Guideline / 01', W60)], [t('As regras que mantêm a marca igual a si mesma, em qualquer suporte.', 11, { color: W60 })], [meta('2026 Y', W60, { textAlign: 'right' })]], { widths: [0.8, 1.4, 0.6], align: ['left', 'left', 'right'] }),
            stack([
                h('BRAND GUIDELINE', 44, { fontFamily: F.montserrat, color: W, fontWeight: 300, letterSpacing: '0.12em' }),
                h('Brivio°', 176, { fontFamily: F.anton, color: W, fontWeight: 400, letterSpacing: '0.01em', lineHeight: '0.9' }),
            ], 4),
            stack([t('Isabella Linton', 20, { color: W, fontWeight: 600 }), t('Diretora de marca', 14, { color: W60 }), line(W30, { marginTop: '18px', maxWidth: '360px' })], 4),
        ], { backgroundColor: '#2F3B2C' }),
        col([], { backgroundImage: IMG('cloud-frame'), padding: ZERO }),
    ], { backgroundColor: '#2F3B2C' }, [1.6, 1])),

    preset('Contorno', 'Palavra enorme só em contorno sobre preto, com o símbolo em gradiente.', cover([
        col([
            row([[symbol(40)], [meta('Brand book · 2026', W60, { textAlign: 'right' })]], { align: ['left', 'right'], valign: 'middle' }),
            h('Brivio°', 230, { fontFamily: F.bebas, fontWeight: 400, letterSpacing: '0.01em', ...outline(W, 2) }),
            bottomBar(W60, 'Sistema visual completo', 'Começar ↓'),
        ]),
    ], { backgroundColor: '#050505', ...fx({ spotlight: true, spotlightOpacity: 18, spotlightSize: 55, grain: 22 }) })),

    preset('Texto em gradiente', 'Título preenchido com o gradiente oficial Brivio, sobre preto.', cover([
        col([
            topBar(W60),
            stack([h('Brivio°', 211, { fontFamily: F.syne, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: '0.84', ...gradientText(BRIVIO_TEXT_GRADIENT) }), t('Cores, formas e palavras que fazem uma marca inconfundível.', 18, { color: W60 })], 22),
        ]),
    ], { backgroundColor: '#000000', ...fx({ effect: 'aurora', colors: BRIVIO_FX, effectOpacity: 35, speed: 0.7, vignette: 70 }) })),

    preset('Suíço', 'Grelha suíça: símbolo vermelho, título preto pesado e quatro colunas de dados.', cover([
        col([
            row([[symbol(64, '#E1262C')], [meta('Manual de normas gráficas', K60, { textAlign: 'right' })]], { align: ['left', 'right'], valign: 'middle' }),
            stack([
                h('Brivio°', 180, { fontFamily: F.archivo, color: K, fontWeight: 400, letterSpacing: '-0.05em', lineHeight: '0.86' }),
                line(K20),
                row([[meta('Cliente', K60), t('Brivio', 15, { color: K })], [meta('Ano', K60), t('2026', 15, { color: K })], [meta('Versão', K60), t('1.0', 15, { color: K })], [meta('Páginas', K60), t('48', 15, { color: K })]], { gap: 24 }),
            ], 24),
        ]),
    ], { backgroundColor: '#F2F0EB' })),

    preset('Rosa total', 'Fundo rosa Brivio com uma palavra preta que ocupa a capa.', cover([
        col([
            topBar(K),
            h('Brivio°', 300, { fontFamily: F.anton, color: K, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: '0.82' }),
            row([[t('Manual de identidade\nvisual e verbal', 22, { color: K, fontWeight: 600, lineHeight: '1.15' })], [t('Edição 2026 · Uso interno e parceiros', 14, { color: K, textAlign: 'right' })]], { align: ['left', 'right'], valign: 'bottom' }),
        ]),
    ], { backgroundColor: B.pink })),

    preset('Três cores', 'Três colunas nas cores da marca, uma palavra em cada.', cover([
        col([meta('01', W), h('Brivio°', 65, { fontFamily: F.syne, color: W, fontWeight: 800, letterSpacing: '-0.05em' })], { backgroundColor: B.pink, padding: pad(48, 40) }),
        col([meta('02', W), h('Book', 120, { fontFamily: F.syne, color: W, fontWeight: 800, letterSpacing: '-0.05em' })], { backgroundColor: B.indigo, padding: pad(48, 40) }),
        col([meta('03', K), h('2026', 120, { fontFamily: F.syne, color: K, fontWeight: 800, letterSpacing: '-0.05em' })], { backgroundColor: B.green, padding: pad(48, 40) }),
    ], { backgroundColor: B.indigo })),

    preset('Tipografia', 'Capa de capítulo de tipografia: “Aa” gigante com a ficha da fonte.', cover([
        col([
            topBar(K60, ['Capítulo 04', 'Tipografia', '2026']),
            row([
                [h('Brivio°', 158, { fontFamily: F.dmSerif, color: K, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: '0.8' })],
                [meta('Fonte principal', K60), t('DM Serif Display', 34, { color: K, fontFamily: F.dmSerif }), line(K20, { margin: '14px 0' }), t('ABCDEFGHIJKLM\nNOPQRSTUVWXYZ\nabcdefghijklm\nnopqrstuvwxyz\n0123456789', 18, { color: K60, fontFamily: F.dmSerif, lineHeight: '1.35' })],
            ], { widths: [1.2, 1], valign: 'bottom', gap: 48 }),
        ]),
    ], { backgroundColor: '#F4F1EA' })),

    preset('Capítulo em contorno', 'Número do capítulo enorme em contorno e o título ao lado.', cover([
        col([
            topBar(W60, ['Brand book', 'Capítulo', '2026']),
            row([[h('02', 330, { fontFamily: F.anton, fontWeight: 400, lineHeight: '0.8', ...outline(B.pink, 2) })], [stack([meta('Capítulo dois', B.pink), h('Brivio°', 96, { fontFamily: F.grotesk, color: W, fontWeight: 600, letterSpacing: '-0.04em' }), t('Construção, versões, áreas de proteção e usos incorretos.', 17, { color: W60 })], 16)]], { widths: [1, 1.3], valign: 'bottom', gap: 40 }),
        ]),
    ], { backgroundColor: '#0B0B0D' })),

    preset('Citação', 'Uma frase manifesto em serifa grande, com autor em baixo.', cover([
        col([
            topBar(K60, ['Manifesto', 'Brand book', '2026']),
            stack([h('Brivio°', 180, { fontFamily: F.playfair, color: K, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: '1.02' }), t('“Marcas fortes nascem de decisões claras.”', 30, { fontFamily: F.playfair, color: K60, fontStyle: 'italic', lineHeight: '1.3' })], 18),
            row([[line(K20)], [meta('— Equipa de marca', K60, { textAlign: 'right' })]], { widths: [3, 1], valign: 'middle', align: ['left', 'right'] }),
        ]),
    ], { backgroundColor: '#EDE7DD' })),

    preset('Luxo', 'Preto e dourado, serifa espaçada e centrada.', cover([
        col([
            row([[meta('Paris', '#C8A96A')], [meta('Maison', '#C8A96A', { textAlign: 'center' })], [meta('MMXXVI', '#C8A96A', { textAlign: 'right' })]], { align: ['left', 'center', 'right'] }),
            stack([t('— Brand guidelines —', 14, { color: '#C8A96A', letterSpacing: '0.4em', textTransform: 'uppercase', textAlign: 'center' }), h('Brivio°', 180, { fontFamily: F.playfair, color: '#E9D8B4', fontWeight: 400, letterSpacing: '0.18em', textAlign: 'center' }), t('Savoir-faire depuis 1926', 16, { color: 'rgba(233,216,180,0.7)', fontStyle: 'italic', fontFamily: F.playfair, textAlign: 'center' })], 20, 'center'),
            meta('Confidencial · Uso interno', 'rgba(200,169,106,0.6)', { textAlign: 'center' }),
        ], { alignHorizontal: 'center' }),
    ], { backgroundColor: '#0C0B09' })),

    // ----- 31-40: bold systems -----
    preset('Brutalista', 'Amarelo-ácido, preto, linhas e etiquetas mono.', cover([
        col([
            stack([row([[meta('BRND—BK', K)], [meta('No. 0042', K, { textAlign: 'center' })], [meta('2026', K, { textAlign: 'right' })]], { align: ['left', 'center', 'right'] }), line(K)], 12),
            h('Brivio°', 180, { fontFamily: F.anton, color: K, fontWeight: 400, lineHeight: '0.84', letterSpacing: '-0.01em' }),
            stack([line(K), row([[meta('Regras da marca', K)], [meta('Ler antes de usar', K, { textAlign: 'right' })]], { align: ['left', 'right'] })], 12),
        ]),
    ], { backgroundColor: '#E8FF2E' })),

    preset('Corporativo', 'Azul-marinho, logótipo, título sóbrio e imagem tech à direita.', cover([
        col([
            img(LOGO_WHITE, { width: 180 }),
            stack([meta('Brand guidelines', '#7FB2FF'), h('Brivio°', 88, { fontFamily: F.manrope, color: W, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: '1' }), t('Versão 2.0 · Atualizado em março de 2026', 15, { color: 'rgba(255,255,255,0.55)' })], 22),
            meta('Documento interno', 'rgba(255,255,255,0.4)'),
        ], { backgroundColor: '#0B1B3A' }),
        col([], { backgroundImage: IMG('blue-dots'), padding: ZERO }),
    ], { backgroundColor: '#0B1B3A' }, [1.25, 1])),

    preset('Vidro', 'Cartão de vidro ao centro sobre raios de cor, com título e assinatura.', cover([
        col([]),
        col([
            meta('Brand book · 2026', W),
            stack([symbol(72, W), h('Brivio°', 84, { fontFamily: F.outfit, color: W, fontWeight: 500, letterSpacing: '-0.04em', textAlign: 'center' }), t('Guia de identidade', 18, { color: W, textAlign: 'center' })], 18, 'center'),
            meta('Protegendo marcas', W),
        ], { alignHorizontal: 'center', backgroundColor: 'rgba(255,255,255,0.16)', radius: 32, padding: pad(48, 40), borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderStyle: 'solid' }),
        col([]),
    ], { ...onImage('spectrum-rays', '#6A2CFF'), sectionPadding: pad(72, 0), alignVertical: 'top' }, [1, 1.1, 1])),

    preset('Faixa em loop', 'Palavras gigantes a passar em loop a meio da capa, dados em cima e em baixo.', cover([
        col([
            topBar(W60),
            loop(['Brivio°', 'Brand book', 'Identidade', 'Sistema'], { textColor: W, fontSize: 120, fontWeight: 800, uppercase: true, separator: 'asterisk', separatorColor: B.pink, speed: 30, fullBleed: true }),
            bottomBar(W60),
        ], { padding: pad(56, 0) }),
    ], { backgroundColor: '#000000', ...fx({ effect: 'waves', colors: BRIVIO_FX, effectOpacity: 55, intensity: 45, grain: 15 }) })),

    preset('Loop sobre néon', 'Faixa dupla em loop em sentidos opostos sobre o desfocado néon.', cover([
        col([
            row([[symbol(40, W)], [meta('Brand book · 2026', W, { textAlign: 'right' })]], { align: ['left', 'right'], valign: 'middle' }),
            loop(['Brivio°', 'Ousada', 'Viva', 'Inconfundível'], { textColor: W, fontSize: 96, fontWeight: 800, uppercase: true, separator: 'star', separatorColor: W, speed: 28, rowGap: 6, fullBleed: true }, [{ direction: 'left' }, { direction: 'right', outline: true }]),
            bottomBar(W),
        ], { padding: pad(56, 0) }),
    ], onImage('neon-blur', '#C0179A'))),

    preset('Três quadros', 'Imagem ao centro entre duas colunas de texto, estilo cartaz.', cover([
        col([meta('Brand', W60), h('Brivio°', 96, { fontFamily: F.instrument, color: W, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' })], { padding: pad(48, 40) }),
        col([], { backgroundImage: IMG('pink-arch'), padding: ZERO, radius: 0 }),
        col([meta('Book · 2026', W60, { textAlign: 'right' }), h('Forma', 96, { fontFamily: F.instrument, color: W, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em', textAlign: 'right' })], { padding: pad(48, 40), alignHorizontal: 'right' }),
    ], { backgroundColor: '#1A0F24' }, [1, 1.2, 1])),

    preset('Mínimo absoluto', 'Só o símbolo e uma linha em mono, no centro de muito espaço.', cover([
        col([
            meta('​', W30),
            stack([symbol(96), h('Brivio°', 64, { fontFamily: F.outfit, color: W, fontWeight: 500, letterSpacing: '-0.04em', textAlign: 'center' }), meta('Brand book — 2026', W60, { textAlign: 'center' })], 24, 'center'),
            meta('brivio.com', W30, { textAlign: 'center' }),
        ], { alignHorizontal: 'center' }),
    ], { backgroundColor: '#000000' })),

    preset('Branco e símbolo', 'Título pesado em preto com o símbolo em gradiente gigante à direita.', cover([
        col([
            topBar(K60),
            stack([h('Brivio°', 101, { fontFamily: F.archivo, color: K, fontWeight: 400, letterSpacing: '-0.05em', lineHeight: '0.84' }), t('Identidade visual · Tom de voz · Aplicações', 16, { color: K60 })], 22),
        ]),
        col([symbol(460)], { alignHorizontal: 'center', alignVertical: 'middle', contentDistribution: 'packed' }),
    ], { backgroundColor: '#FFFFFF' }, [1.2, 1])),

    preset('Revista', 'Cabeçalho de revista em serifa, título e sumário em colunas.', cover([
        col([
            stack([h('Brivio°', 190, { fontFamily: F.playfair, color: K, fontWeight: 900, letterSpacing: '-0.04em', textAlign: 'center', lineHeight: '0.85' }), row([[meta('Vol. 07', K60)], [meta('A revista da marca', K60, { textAlign: 'center' })], [meta('Primavera 2026', K60, { textAlign: 'right' })]], { align: ['left', 'center', 'right'] }), line(K)], 14),
            row([
                [h('Como se\nconstrói\numa marca.', 72, { fontFamily: F.playfair, color: K, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.03em', lineHeight: '1' })],
                [meta('Neste número', B.pink), t('01 — A estratégia\n02 — O símbolo\n03 — A paleta\n04 — A voz', 17, { color: K, lineHeight: '1.8' })],
            ], { widths: [1.6, 1], valign: 'bottom', gap: 48 }),
        ]),
    ], { backgroundColor: '#F6F3EE' })),

    preset('Onda da meia-noite', 'Imagem vertical à esquerda e texto em coluna à direita.', cover([
        col([], { backgroundImage: IMG('midnight-wave'), padding: ZERO }),
        col([
            topBar(W60, ['Brand book', '2026']),
            stack([meta('Identidade visual', B.pink), h('Brivio°', 104, { fontFamily: F.grotesk, color: W, fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95' }), t('Um sistema pensado para brilhar em fundos escuros.', 17, { color: W60 })], 20),
        ]),
    ], { backgroundColor: '#05061A' }, [1, 1.2])),

    // ----- 41-50: more image covers -----
    preset('Fita violeta', 'Texto à esquerda e a fita de luz violeta em coluna à direita.', cover([
        col([
            topBar(W60, ['Brand book', '2026']),
            stack([h('Brivio°', 109, { fontFamily: F.syne, color: W, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: '0.92' }), t('Uma marca que nunca está parada.', 18, { color: W60 })], 20),
        ]),
        col([], { backgroundImage: IMG('violet-ribbon'), padding: ZERO }),
    ], { backgroundColor: '#090013' }, [1.25, 1])),

    preset('Duna curva', 'Título claro ao fundo com dados em linha, sobre as dunas.', cover([
        col([
            topBar(W),
            stack([h('Brivio°', 190, { fontFamily: F.outfit, color: W, fontWeight: 600, letterSpacing: '-0.06em' }), row([[t('Para onde vamos.', 18, { color: W })], [t('Como lá chegamos.', 18, { color: W })], [t('O que nunca muda.', 18, { color: W })]])], 22),
        ], { backgroundColor: 'rgba(80,20,20,0.12)' }),
    ], { ...onImage('dune-curve', '#E9B7A6'), ...fx({ imageMotion: 'zoom' }) })),

    preset('Azul sereno', 'Número de capítulo e título grandes sobre o azul desfocado.', cover([
        col([
            topBar(W),
            row([[h('01', 260, { fontFamily: F.urbanist, color: W, fontWeight: 200, letterSpacing: '-0.06em', lineHeight: '0.8' })], [stack([meta('Capítulo um', W), h('Brivio°', 120, { fontFamily: F.urbanist, color: W, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: '0.88' })], 14)]], { widths: [1, 1.4], valign: 'bottom', gap: 40 }),
        ]),
    ], onImage('blue-blur', '#1C8BF2'))),

    preset('Onda azul', 'Título calmo e centrado, com etiqueta e assinatura.', cover([
        col([
            topBar(W),
            stack([meta('Tom de voz', W, { textAlign: 'center' }), h('Brivio°', 180, { fontFamily: F.manrope, color: W, fontWeight: 300, letterSpacing: '-0.05em', textAlign: 'center' })], 22, 'center'),
            bottomBar(W, 'Capítulo 05', 'Brand book · 2026'),
        ], { alignHorizontal: 'center' }),
    ], onImage('blue-wave', '#5C9CF5'))),

    preset('Azul gelo', 'Contraste: título escuro pesado sobre o azul gelo luminoso.', cover([
        col([
            topBar(K60),
            stack([h('Brivio°', 200, { fontFamily: F.archivo, color: '#06104A', fontWeight: 400, letterSpacing: '-0.05em', lineHeight: '0.84' }), t('A nova identidade, explicada página a página.', 18, { color: 'rgba(6,16,74,0.7)' })], 22),
        ]),
    ], onImage('ice-blue-blur', '#9CC7FF'))),

    preset('Fluxo pervinca', 'Guia de identidade em grotesca, legível e acolhedor.', cover([
        col([
            topBar('rgba(20,20,60,0.6)'),
            stack([h('Brivio°', 180, { fontFamily: F.outfit, color: '#14143C', fontWeight: 600, letterSpacing: '-0.055em', lineHeight: '0.9' }), row([[line('rgba(20,20,60,0.3)')], [t('Para equipas, parceiros e fornecedores.', 16, { color: 'rgba(20,20,60,0.75)' })]], { widths: [1, 1.3], valign: 'middle' })], 26),
        ]),
    ], onImage('periwinkle-flow', '#B9B4F5'))),

    preset('Néon cromático', 'Palavra de impacto centrada sobre o néon, sem mais nada.', cover([
        col([
            topBar(W),
            h('Brivio°', 185, { fontFamily: F.unbounded, color: W, fontWeight: 900, letterSpacing: '-0.06em', textAlign: 'center', mixBlendMode: 'overlay' }),
            bottomBar(W),
        ], { alignHorizontal: 'center' }),
    ], { ...onImage('neon-blur', '#B5179E'), ...fx({ effect: 'mesh', colors: ['#FF00E5', '#00F0FF', '#7B2CFF', '#FFE600'], blend: 'screen', effectOpacity: 70, speed: 1.2 }) })),

    preset('Raios espectrais', 'Logótipo escuro ao centro com subtítulo serifado sobre o espectro.', cover([
        col([
            topBar(K60),
            stack([img(LOGO_DARK, { width: 420 }), t('Brand guidelines', 30, { color: K, fontFamily: F.instrument, fontStyle: 'italic', textAlign: 'center' })], 24, 'center'),
            bottomBar(K60),
        ], { alignHorizontal: 'center', backgroundColor: 'rgba(255,255,255,0.18)' }),
    ], onImage('spectrum-rays', '#F06BC6'))),

    preset('Formas geométricas', 'Grelha de três colunas: título, imagem quadrada e dados.', cover([
        col([
            topBar(K60, ['Brand book', '2026']),
            stack([h('Brivio°', 120, { fontFamily: F.grotesk, color: K, fontWeight: 600, letterSpacing: '-0.05em', lineHeight: '0.92' }), t('Um sistema geométrico, simples de aplicar.', 17, { color: K60 })], 20),
        ]),
        col([img(IMG('pink-spheres'), { aspectRatio: '3/4', radius: 24 })], { contentDistribution: 'packed', alignVertical: 'middle', padding: pad(56, 24) }),
    ], { backgroundColor: '#EFEAE4' }, [1.2, 1])),

    preset('Líquido Brivio', 'Tinta líquida nas cores Brivio que ondula sob o rato, logótipo branco ao centro.', cover([
        col([
            topBar(W60),
            stack([img(LOGO_WHITE, { width: 520 }), meta('Brand book · Protegendo marcas', W, { textAlign: 'center' })], 28, 'center'),
            bottomBar(W60, 'Passe o rato pela capa', '2026'),
        ], { alignHorizontal: 'center' }),
    ], { backgroundColor: B.indigo, ...fx({ effect: 'liquid', colors: [B.indigo, B.pink, B.green, '#0A0020'], intensity: 70, mouseStrength: 80, grain: 12, vignette: 35 }) })),

    preset('Aurora', 'Faixas de luz a ondular sobre azul profundo, título serifado.', cover([
        col([
            topBar(W60, ['Brand book', 'Visão', '2026']),
            stack([h('Brivio°', 180, { fontFamily: F.instrument, color: W, fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'center' }), meta('Missão · visão · valores', W60, { textAlign: 'center' })], 22, 'center'),
            bottomBar(W60),
        ], { alignHorizontal: 'center' }),
    ], { backgroundColor: '#030714', ...fx({ effect: 'aurora', colors: ['#00F0B5', '#3B5BFF', '#B000FF', '#00C2FF'], effectOpacity: 85, speed: 0.8, grain: 20, vignette: 50 }) })),

    preset('Mesh pastel', 'Manchas pastel a flutuar e a fugir do rato, tipografia escura.', cover([
        col([
            topBar(K60),
            stack([h('Brivio°', 190, { fontFamily: F.syne, color: K, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: '0.86' }), t('Uma identidade calma que não passa despercebida.', 18, { color: K60 })], 22),
        ]),
    ], { backgroundColor: '#FBF6F0', ...fx({ effect: 'mesh', colors: ['#FFC6E0', '#C9B6FF', '#B5E8FF', '#FFE3B3'], blur: 80, speed: 0.8, mouseStrength: 70, grain: 15 }) })),

    preset('Ondas', 'Linhas finas que ondulam e se afastam do cursor, título em mono.', cover([
        col([
            row([[meta('[ brand.book ]', W)], [meta('waves.v1', W60, { textAlign: 'right' })]], { align: ['left', 'right'] }),
            stack([h('Brivio°', 180, { fontFamily: F.grotesk, color: W, fontWeight: 500, letterSpacing: '-0.05em' }), t('Clareza no meio do barulho.', 18, { color: W60, fontFamily: F.mono })], 20),
        ]),
    ], { backgroundColor: '#05050A', ...fx({ effect: 'waves', colors: [B.green, '#3B5BFF', B.pink], intensity: 60, scale: 60, mouseStrength: 70, vignette: 50 }) })),

    preset('Gradiente vivo', 'Título enorme em branco que transborda sobre o desfocado colorido.', cover([
        col([
            topBar(W),
            h('Brivio°', 200, { fontFamily: F.syne, color: W, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: '0.85' }),
        ]),
    ], { ...onImage('coral-violet', '#D94B8C'), ...fx({ effect: 'fluid', colors: ['#FF2A68', '#FFB347', '#7A1FD8', '#00C2FF'], blend: 'screen', effectOpacity: 80, mouseStrength: 70 }) })),
]

type Side = 'top' | 'right' | 'bottom' | 'left'
const SIDES: Side[] = ['top', 'right', 'bottom', 'left']

/**
 * Covers keep no fixed frame: the spacing the columns share moves to the section padding (Edit section),
 * so changing the section padding moves the whole content, and the content takes the full width inside it.
 * Columns with their own background (an overlay, a card) keep their padding, so the background still
 * reaches the edges of the column.
 */
const freeCover = (preset: ComponentPreset): ComponentPreset => {
    const section = preset.data as Block
    const settings = section.content.settings || {}
    const columns: ColumnData[] = section.content.columns || []
    const own = (c: ColumnData) => !!(c.settings?.backgroundColor || c.settings?.backgroundImage)
    const shared = Object.fromEntries(SIDES.map(side => [side, Math.min(...columns.map(c => own(c) ? 0 : Number((c.settings?.padding as Record<string, number> | undefined)?.[side]) || 0))])) as Record<Side, number>
    return {
        ...preset,
        data: {
            ...section,
            content: {
                ...section.content,
                columns: columns.map(c => own(c) ? c : {
                    ...c,
                    settings: {
                        ...c.settings,
                        padding: { isLocked: false, ...Object.fromEntries(SIDES.map(side => [side, Math.max(0, (Number((c.settings?.padding as Record<string, number> | undefined)?.[side]) || 0) - shared[side])])) },
                    },
                }),
                settings: {
                    ...settings,
                    isFullWidth: false,
                    contentWidth: 'fluid',
                    sectionPadding: { isLocked: false, ...shared },
                },
            },
        },
    }
}

export const COVER_PRESETS: ComponentPreset[] = RAW_COVERS.map(freeCover)
