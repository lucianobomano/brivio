import { Block } from "./types"
import type { ColumnData, ComponentPreset, ComponentTopic } from "./componentPresets"
import { createMarqueeContent, type MarqueeSettings } from "./blocks/marquee"
import { brivioSymbol } from "./blocks/brivioSymbol"

/**
 * Identity sections for the verbal, visual and sensory chapters of a brandbook (sound, scent, touch, taste,
 * multisensory, motion, offline applications, illustration, grids, graphic elements, personality, tone of
 * voice, language, slogans, naming, storytelling, copywriting, visual style guide).
 *
 * Every chapter has its own content and its own blocks (audio players and media downloads for sound and
 * voice, personality sliders, before / after rewrites, story chapters, a 12-column grid…), laid out in twelve
 * different section structures. Everything is native sections, columns and blocks: each part is edited on
 * its own, the section as a whole from Edit section.
 */

let seq = 0
const uid = (prefix: string) => `id-${prefix}-${++seq}`

const IMG = (name: string) => `/brandbook/presets/covers/${name}.webp`
const BV = (name: string) => `/brandbook/templates/brivio/${name}.jpg`

type Style = Record<string, unknown>
type Align = 'left' | 'center' | 'right'
const ZERO = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }
const pad = (y: number, x = y) => ({ isLocked: false, top: y, right: x, bottom: y, left: x })

// ---------- themes ----------

interface Theme { bg: string, ink: string, muted: string, line: string, accent: string, card: string, dark: boolean }
const PAPER: Theme = { bg: '#F4F1EA', ink: '#141414', muted: '#7A7770', line: 'rgba(20,20,20,0.14)', accent: '#C2410C', card: '#FFFFFF', dark: false }
const WHITE: Theme = { bg: '#FFFFFF', ink: '#111111', muted: '#8B8B93', line: 'rgba(0,0,0,0.1)', accent: '#FF0054', card: '#F5F5F7', dark: false }
const NIGHT: Theme = { bg: '#0B0B0D', ink: '#F2F2F2', muted: '#8A8A90', line: 'rgba(255,255,255,0.12)', accent: '#FF0054', card: '#151518', dark: true }
const SAND: Theme = { bg: '#EFE6DA', ink: '#2B1F18', muted: '#8C7666', line: 'rgba(43,31,24,0.16)', accent: '#B4532A', card: '#F7F0E6', dark: false }
const STONE: Theme = { bg: '#E7E7E4', ink: '#1A1A1A', muted: '#77776F', line: 'rgba(0,0,0,0.14)', accent: '#1A1A1A', card: '#F3F3F1', dark: false }
const INK: Theme = { bg: '#0F1A2B', ink: '#E9EEF5', muted: '#7E8CA3', line: 'rgba(233,238,245,0.14)', accent: '#7DD3FC', card: '#16233A', dark: true }
const BLUSH: Theme = { bg: '#FBEFEF', ink: '#2A1416', muted: '#9A7A7C', line: 'rgba(42,20,22,0.14)', accent: '#E0457B', card: '#FFFFFF', dark: false }
const FOREST: Theme = { bg: '#14201A', ink: '#EEF2EC', muted: '#8FA197', line: 'rgba(238,242,236,0.14)', accent: '#A3D9A5', card: '#1C2B23', dark: true }
const BRIVIO: Theme = { bg: '#000000', ink: '#FFFFFF', muted: '#9A9AA2', line: 'rgba(255,255,255,0.14)', accent: '#FF0054', card: '#121214', dark: true }
const THEMES = [PAPER, NIGHT, WHITE, INK, SAND, FOREST, STONE, BLUSH]
const B = { pink: '#FF0054', magenta: '#9E0059', indigo: '#390099', green: '#06D6A0' }

// ---------- blocks ----------

const h = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'heading' as Block['type'],
    content: { text: value, style: { fontSize: `${size}px`, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: '1.04', color: th.ink, ...style } },
})
const t = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'text', content: { text: value, style: { fontSize: `${size}px`, lineHeight: '1.6', color: th.muted, ...style } },
})
const lbl = (value: string, th: Theme, style: Style = {}) =>
    t(value, 11, th, { fontFamily: 'Space Mono', textTransform: 'uppercase', letterSpacing: '0.14em', lineHeight: '1.6', color: th.accent, ...style })
const num = (value: string, size: number, th: Theme, style: Style = {}) => h(value, size, th, { fontWeight: 300, letterSpacing: '-0.05em', lineHeight: '1', ...style })
const rule = (th: Theme, style: Style = {}) => t('​', 1, th, { borderTop: `1px solid ${th.line}`, lineHeight: '1px', height: '1px', ...style })
const serif = (value: string, size: number, th: Theme, style: Style = {}) =>
    h(value, size, th, { fontFamily: 'Instrument Serif', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.01em', lineHeight: '1.1', ...style })
/** A bar drawn by a text block (sliders, rhythm lines, column guides) */
const bar = (background: string, height = 6, style: Style = {}) =>
    t('​', 1, WHITE, { background, height: `${height}px`, lineHeight: `${height}px`, borderRadius: '999px', ...style })

const photo = (url: string, style: Style = {}): Block => ({ id: uid('b'), type: 'image', content: { url, caption: '', style: { radius: 14, ...style } } })
const gallery = (urls: string[], style: Style = {}): Block => ({
    id: uid('b'), type: 'gallery',
    content: { items: urls.map(url => ({ url })), style: { galleryType: 'grid', columns: 3, aspectRatio: '4/5', imageRadius: 10, ...style } },
})
const video = (caption = ''): Block => ({ id: uid('b'), type: 'video', content: { url: '', caption, style: { aspectRatio: '16:9', radius: 16 } } })
const bullets = (items: string[]): Block => ({ id: uid('b'), type: 'list', content: { items: items.map(x => ({ text: x, type: 'default' })) } })
const doDont = (dos: string[], donts: string[]): Block => ({
    id: uid('b'), type: 'list', variant: 'do-dont',
    content: { items: [...dos.map(x => ({ text: x, type: 'do' })), ...donts.map(x => ({ text: x, type: 'dont' }))] },
})
const story = (slides: [string, string][], accent: string): Block => ({
    id: uid('b'), type: 'story',
    content: {
        slides: slides.map(([title, description]) => ({ id: uid('s'), title, description })),
        settings: { autoplay: true, duration: 6, accentColor: accent, barColor: 'rgba(127,127,127,0.25)', buttonColor: accent, align: 'left' },
    },
})
const loop = (items: string[], settings: MarqueeSettings = {}): Block => ({
    id: uid('b'), type: 'marquee' as Block['type'],
    content: { ...createMarqueeContent([{ items }], { borderTop: false, borderBottom: false, ...settings }) },
})
const motif = (settings: Record<string, unknown>): Block => ({ id: uid('b'), type: 'motif-field' as Block['type'], content: { settings } })
/** Audio players (the editor's audio block): each track is a card with its own cover; upload the sound on it */
const audio = (tracks: [string, string][]): Block => ({
    id: uid('b'), type: 'audio',
    content: { items: tracks.map(([caption, image]) => ({ url: '', caption, style: { backgroundType: 'image', backgroundImage: image, backgroundColor: '#111111' } })) },
})
const download = (title: string, type: string, size: string, th: Theme): Block => ({
    id: uid('b'), type: 'download',
    content: {
        url: '', title, type, filesize: size,
        style: {
            backgroundColor: th.card, textColor: th.ink, metaColor: th.muted, borderColor: th.line,
            iconBgColor: th.accent, iconColor: th.dark ? '#000000' : '#FFFFFF', buttonBgColor: th.ink, buttonTextColor: th.bg,
            buttonBorderColor: th.ink, borderRadius: 16, hoverEffect: 'lift', hoverIconEffect: 'drop',
        },
    },
})
const index = (th: Theme): Block => ({
    id: uid('b'), type: 'index',
    content: { items: [], settings: { source: 'pages', includeCurrentPage: false, style: 'list', titleSize: 40, accentColor: th.accent, textColor: th.ink, mutedColor: th.muted, hoverBackground: th.card, dividerColor: th.line } },
})

interface RowOptions { widths?: number[], gap?: number, align?: Align[], valign?: 'top' | 'middle' | 'bottom', itemGap?: number, colStyle?: Style[] }
/** A row of small columns inside a column: a native layout block */
const row = (cols: Block[][], opts: RowOptions = {}): Block => ({
    id: uid('row'), type: 'layout', variant: `${cols.length}-col`,
    content: {
        columns: cols.map((blocks, i) => ({
            id: uid('rc'), blocks,
            settings: { padding: ZERO, blockGap: opts.itemGap ?? 8, alignHorizontal: opts.align?.[i] || 'left', alignVertical: opts.valign || 'top', ...(opts.colStyle?.[i] || {}) },
        })),
        settings: { columns: cols.length, columnWidths: opts.widths || Array(cols.length).fill(1), columnGap: opts.gap ?? 32, padding: ZERO, height: 'fit', alignVertical: 'top', alignHorizontal: 'left' },
    },
})
const cardStyle = (bg: string, extra: Style = {}): Style => ({ backgroundColor: bg, radius: 18, padding: pad(26, 24), ...extra })

// ---------- columns / sections ----------

const col = (blocks: Block[], s: Style = {}): ColumnData => ({
    id: uid('col'), blocks,
    settings: { padding: ZERO, blockGap: 20, alignHorizontal: 'left', alignVertical: 'top', ...s },
})
const card = (blocks: Block[], bg: string, s: Style = {}): ColumnData => col(blocks, { backgroundColor: bg, radius: 20, padding: pad(32, 28), blockGap: 14, ...s })

/** Section whose padding (Edit section) sets the margins; the content fills the room left */
const sec = (columns: ColumnData[], th: Theme, opts: { widths?: number[], gap?: number, padY?: number, valign?: 'top' | 'middle' | 'bottom', extra?: Style } = {}): Block => ({
    id: uid('sec'), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length, columnWidths: opts.widths || Array(columns.length).fill(1),
            padding: ZERO, columnGap: opts.gap ?? 64,
            sectionPadding: { isLocked: false, top: opts.padY ?? 110, right: 72, bottom: opts.padY ?? 110, left: 72 },
            contentWidth: 'fluid', backgroundType: 'color', backgroundColor: th.bg,
            alignVertical: opts.valign || 'top', alignHorizontal: 'left', height: 'fit',
            ...opts.extra,
        },
    },
})

const intro = (label: string, title: string, body: string, th: Theme, size = 52, align: Align = 'left') => [
    lbl(label, th, { textAlign: align }),
    h(title, size, th, { textAlign: align }),
    t(body, 17, th, { textAlign: align, maxWidth: '560px' }),
]
const header = (label: string, title: string, body: string, th: Theme, size = 52) =>
    row([[lbl(label, th), h(title, size, th)], [t(body, 16, th)]], { widths: [1.25, 1], valign: 'bottom', gap: 64 })

// =====================================================================================================
// Chapter features: blocks that only make sense in one chapter
// =====================================================================================================

type Build = (th: Theme) => Block[]
interface Feature { name: string, description: string, build: Build }
const feature = (name: string, description: string, build: Build): Feature => ({ name, description, build })

const players = (tracks: [string, string][]): Build => () => [audio(tracks)]
const downloads = (files: [string, string, string][]): Build => (th) => [row(files.map(([title, type, size]) => [download(title, type, size, th)]), { gap: 16 })]
/** Personality / tone sliders: a word on each side and how far the brand leans */
const sliders = (pairs: [string, string, number][]): Build => (th) => pairs.flatMap(([a, b, p]) => [
    row([[t(a, 15, th, { color: th.ink, fontWeight: 600 })], [bar(`linear-gradient(90deg, ${th.line} 0%, ${th.line} ${p - 3}%, ${th.accent} ${p - 3}%, ${th.accent} ${p + 3}%, ${th.line} ${p + 3}%)`, 8, { marginTop: '9px' })], [t(b, 15, th, { color: th.ink, fontWeight: 600, textAlign: 'right' })]], { widths: [0.6, 1.6, 0.6], gap: 20, valign: 'middle' }),
])
/** Before / after: the generic sentence struck through, the brand's rewrite next to it */
const rewrites = (pairs: [string, string][]): Build => (th) => [
    row([[lbl('Antes', th, { color: th.muted })], [lbl('Com a nossa voz', th)]], { gap: 48 }),
    ...pairs.flatMap(([a, b]) => [rule(th), row([[t(a, 18, th, { textDecoration: 'line-through' })], [h(b, 22, th, { letterSpacing: '-0.01em', lineHeight: '1.3' })]], { gap: 48 })]),
]
const loopOf = (words: string[], size = 72): Build => (th) => [loop(words, { textColor: th.ink, fontSize: size, fontWeight: 700, separator: 'dot', separatorColor: th.accent, speed: 55, fullBleed: true })]
const chapters = (slides: [string, string][]): Build => (th) => [story(slides, th.accent)]
const pictures = (urls: string[], style: Style = {}): Build => () => [gallery(urls, style)]
const shapes = (settings: Record<string, unknown>): Build => () => [motif({ height: 340, grow: 'scroll', cursor: 'part', ...settings })]
const film = (caption: string, notes: [string, string][]): Build => (th) => [video(caption), row(notes.map(([k, v]) => [lbl(k, th, { color: th.muted }), t(v, 15, th, { color: th.ink })]), { gap: 24 })]
const table = (rows: [string, string, string][]): Build => (th) => rows.flatMap(([a, b, c]) => [rule(th), row([[h(a, 20, th)], [t(b, 16, th, { color: th.ink, fontWeight: 600 })], [t(c, 15, th)]], { widths: [0.8, 0.8, 1.4], gap: 24 })])
const wall = (words: string[]): Build => (th) => {
    const rows: Block[] = []
    for (let i = 0; i < words.length; i += 3) rows.push(row(words.slice(i, i + 3).map((w, j) => [h(w, 44, th, j % 2 ? { color: 'transparent', WebkitTextStroke: `1.5px ${th.ink}` } : {})]), { gap: 24 }))
    return rows
}
const glossary = (terms: [string, string][]): Build => (th) => terms.flatMap(([a, b]) => [rule(th), row([[h(a, 22, th)], [t(b, 16, th)]], { widths: [0.8, 1.4], gap: 32 })])
const checklists = (groups: [string, string[]][]): Build => (th) => [row(groups.map(([title, items]) => [lbl(title, th), bullets(items)]), { gap: 32, colStyle: groups.map(() => cardStyle(th.card)) })]
const steps = (list: [string, string][]): Build => (th) => [row(list.map(([title, body], i) => [rule(th), lbl(String(i + 1).padStart(2, '0'), th), h(title, 22, th), t(body, 15, th)]), { gap: 24, itemGap: 10 })]
const swatches = (colors: [string, string][]): Build => (th) => [row(colors.map(([name, hex]) => [t(name, 14, th, { color: isDark(hex) ? '#FFFFFF' : '#111111', fontWeight: 600 }), t(hex, 12, th, { fontFamily: 'Space Mono', color: isDark(hex) ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' })]), { gap: 10, colStyle: colors.map(([, hex]) => cardStyle(hex, { minHeight: 150, contentDistribution: 'between', heightMode: 'fill' })) })]
const isDark = (hex: string) => {
    const v = parseInt(hex.slice(1), 16)
    return ((v >> 16) & 255) * 0.299 + ((v >> 8) & 255) * 0.587 + (v & 255) * 0.114 < 150
}
const typeSamples = (samples: [string, string, string][]): Build => (th) => samples.flatMap(([font, role, sample]) => [rule(th), row([[lbl(role, th, { color: th.muted }), t(font, 14, th, { color: th.ink })], [h(sample, 40, th, { fontFamily: font, letterSpacing: '-0.02em' })]], { widths: [0.6, 2], gap: 32, valign: 'middle' })])
/** 12-column grid guide: twelve tinted columns with the gutter between them */
const grid12: Build = (th) => [
    row(Array.from({ length: 12 }, (_, i) => [t(String(i + 1), 11, th, { fontFamily: 'Space Mono', textAlign: 'center', color: th.accent })]), { gap: 12, colStyle: Array.from({ length: 12 }, () => ({ backgroundColor: th.dark ? 'rgba(255,0,84,0.14)' : 'rgba(255,0,84,0.10)', padding: pad(70, 0), radius: 4 })) }),
    row([[lbl('Colunas', th, { color: th.muted }), t('12', 17, th, { color: th.ink, fontWeight: 600 })], [lbl('Medianiz', th, { color: th.muted }), t('24 px', 17, th, { color: th.ink, fontWeight: 600 })], [lbl('Margens', th, { color: th.muted }), t('72 px', 17, th, { color: th.ink, fontWeight: 600 })], [lbl('Base', th, { color: th.muted }), t('8 px', 17, th, { color: th.ink, fontWeight: 600 })]], { gap: 24 }),
]
const symbols = (colors: string[]): Build => () => [row(colors.map(c => [photo(brivioSymbol(c), { width: 96, radius: 0 })]), { gap: 24, align: colors.map(() => 'center' as Align), colStyle: colors.map(() => cardStyle('rgba(127,127,127,0.08)', { alignHorizontal: 'center', padding: pad(40, 20) })) })]
const indexOf: Build = (th) => [index(th)]

// =====================================================================================================
// Chapters
// =====================================================================================================

interface Pack {
    topic: ComponentTopic
    label: string
    title: string
    lead: string
    body: string
    items: [string, string][]
    quote: string
    words: string[]
    images: string[]
    specs: [string, string][]
    dos: string[]
    donts: string[]
    features: [Feature, Feature, Feature]
}

const PACKS: Pack[] = [
    {
        topic: 'sound', label: 'Identidade sonora', title: 'A marca\ntambém se ouve.',
        lead: 'Um logo sonoro, uma paleta de sons e regras de uso: a marca reconhece-se de olhos fechados.',
        body: 'A identidade sonora começa no logo sonoro — três segundos que assinam tudo — e estende-se à música de fundo, aos sons da interface e à voz. Todos partilham o mesmo tom: caloroso, limpo, sem excessos.',
        items: [['Logo sonoro', 'Três notas ascendentes, 2,8 s, em fecho de vídeos e chamadas.'], ['Música de marca', 'Instrumental, 96 BPM, piano e sintetizador suave.'], ['Sons de interface', 'Cliques curtos, sem agudos estridentes.'], ['Voz', 'Feminina, calma, ritmo pausado.'], ['Silêncio', 'Também é som: deixamos respirar.'], ['Volume', 'Nunca acima de −14 LUFS.']],
        quote: '«Antes de nos verem, já nos ouviram.»',
        words: ['Calor', 'Clareza', 'Ritmo', 'Respiração', 'Eco', 'Assinatura'],
        images: [IMG('violet-fluid'), IMG('blue-wave'), IMG('midnight-wave'), IMG('indigo-rings'), IMG('neon-blur'), IMG('periwinkle-flow')],
        specs: [['Duração', '2,8 s'], ['Tonalidade', 'Ré maior'], ['Tempo', '96 BPM'], ['Formato', 'WAV 48 kHz']],
        dos: ['Usar o logo sonoro no fecho dos vídeos', 'Baixar a música por baixo da voz', 'Usar sempre os ficheiros originais'],
        donts: ['Cortar ou acelerar o logo sonoro', 'Música com letra em anúncios', 'Sons de interface longos'],
        features: [
            feature('Player do logo sonoro', 'Players com as faixas da marca: logo sonoro, música e voz.', players([['Logo sonoro · 2,8 s', IMG('violet-fluid')], ['Música de marca · 96 BPM', IMG('midnight-wave')], ['Voz da marca', IMG('blue-wave')]])),
            feature('Kit de som para descarregar', 'Os ficheiros de som da marca, prontos a descarregar.', downloads([['Logo sonoro (WAV)', 'WAV', '1.2 MB'], ['Música de marca', 'MP3', '8.4 MB'], ['Sons de interface', 'ZIP', '3.1 MB']])),
            feature('Ondas da marca', 'Formas da marca dispostas como uma onda sonora, que reagem ao rato.', shapes({ shape: 'pill', arrangement: 'band', density: 70, size: 34, variation: 90 })),
        ],
    },
    {
        topic: 'scent', label: 'Identidade olfativa', title: 'O cheiro\nda marca.',
        lead: 'Uma assinatura olfativa que se reconhece nas lojas, nas embalagens e nos eventos.',
        body: 'A nossa fragrância abre com notas cítricas e frescas, assenta num coração floral leve e termina em madeiras quentes. É discreta: deve ser notada, nunca imposta.',
        items: [['Notas de topo', 'Bergamota e folha de figueira.'], ['Notas de coração', 'Flor de laranjeira e chá branco.'], ['Notas de fundo', 'Cedro, âmbar e almíscar limpo.'], ['Intensidade', 'Suave, perto da pele.'], ['Onde', 'Lojas, embalagens, eventos.'], ['Quando', 'Na entrada e no momento de abrir.']],
        quote: '«A memória mais forte é a que entra pelo nariz.»',
        words: ['Cítrico', 'Floral', 'Madeira', 'Âmbar', 'Fresco', 'Quente'],
        images: [IMG('candle-snow'), IMG('amber-silk'), IMG('sunset-haze'), IMG('dune-curve'), IMG('lilac-haze'), IMG('pink-arch')],
        specs: [['Família', 'Floral amadeirada'], ['Difusão', '30 m² por unidade'], ['Duração', '6 horas'], ['Concentração', '8 %']],
        dos: ['Difundir à entrada, nunca junto aos provadores', 'Perfumar o papel de seda das embalagens', 'Manter a intensidade baixa'],
        donts: ['Misturar com outras fragrâncias', 'Usar em espaços de alimentação', 'Aumentar a intensidade em eventos'],
        features: [
            feature('Pirâmide olfativa', 'As notas de topo, coração e fundo, em cartões que descem como uma pirâmide.', checklists([['Topo', ['Bergamota', 'Folha de figueira']], ['Coração', ['Flor de laranjeira', 'Chá branco']], ['Fundo', ['Cedro', 'Âmbar', 'Almíscar']]])),
            feature('Rituais de aplicação', 'Os quatro momentos em que a fragrância entra em cena.', steps([['Entrada', 'Difusor discreto a 2 m da porta.'], ['Embalagem', 'Uma borrifadela no papel de seda.'], ['Cartão', 'Cartões de agradecimento perfumados.'], ['Evento', 'Velas da marca nas mesas.']])),
            feature('Atmosfera', 'Imagens que traduzem a fragrância em luz e textura.', pictures([IMG('candle-snow'), IMG('amber-silk'), IMG('sunset-haze'), IMG('lilac-haze')], { columns: 4, aspectRatio: '3/4' })),
        ],
    },
    {
        topic: 'touch', label: 'Identidade tátil', title: 'A marca\nsente-se nas mãos.',
        lead: 'Papéis, acabamentos e materiais escolhidos para que tocar na marca seja tão claro como vê-la.',
        body: 'Preferimos superfícies naturais e mate: papel com fibra visível, cartão rígido, relevo seco no símbolo. O peso conta — um cartão leve diz o contrário do que queremos dizer.',
        items: [['Papel', 'Algodão 350 g, sem revestimento.'], ['Relevo', 'Símbolo em relevo seco, sem tinta.'], ['Embalagem', 'Cartão rígido com abertura magnética.'], ['Tecido', 'Algodão orgânico, toque macio.'], ['Acabamento', 'Mate, nunca brilhante.'], ['Peso', 'Sólido, nunca frágil.']],
        quote: '«O que se toca, fica.»',
        words: ['Mate', 'Fibra', 'Relevo', 'Peso', 'Natural', 'Macio'],
        images: [IMG('dune-curve'), IMG('dark-rock'), IMG('green-lines'), IMG('cloud-frame'), IMG('ice-crystal'), IMG('dune-portal')],
        specs: [['Gramagem', '350 g/m²'], ['Acabamento', 'Mate natural'], ['Relevo', '0,4 mm'], ['Certificação', 'FSC']],
        dos: ['Papéis naturais com fibra', 'Relevo seco no símbolo', 'Embalagens que pesam o certo'],
        donts: ['Plastificação brilhante', 'Papéis finos que dobram', 'Texturas sintéticas'],
        features: [
            feature('Amostras de materiais', 'Cartões de materiais com o seu nome e especificação.', checklists([['Papel', ['Algodão 350 g', 'Sem revestimento', 'FSC']], ['Embalagem', ['Cartão rígido 2 mm', 'Íman oculto', 'Forro em papel kraft']], ['Têxtil', ['Algodão orgânico', 'Bordado tom-sobre-tom', 'Etiqueta em linho']]])),
            feature('Ficha de acabamentos', 'Tabela de acabamentos: onde, como e porquê.', table([['Relevo seco', 'Cartões, capas', 'O símbolo sente-se sem tinta.'], ['Corte especial', 'Embalagens', 'Cantos redondos de 4 mm.'], ['Hot stamping', 'Só em edições especiais', 'Nunca dourado: sempre tom-sobre-tom.']])),
            feature('Texturas', 'Galeria de texturas de referência.', pictures([IMG('dune-curve'), IMG('dark-rock'), IMG('green-lines'), IMG('ice-crystal'), IMG('cloud-frame'), IMG('dune-portal')], { columns: 3, aspectRatio: '1/1' })),
        ],
    },
    {
        topic: 'taste', label: 'Identidade gustativa', title: 'O sabor\nda marca.',
        lead: 'Sabores, receitas e momentos de degustação que prolongam a experiência da marca.',
        body: 'Quando a marca se serve, escolhemos sabores com equilíbrio: frescos, pouco doces, com um final que fica. Cada degustação é pensada como um capítulo da nossa história.',
        items: [['Assinatura', 'Chá branco com citrinos e mel.'], ['Doce', 'Pouco açúcar, muita fruta.'], ['Salgado', 'Ervas frescas e azeite.'], ['Textura', 'Crocante por fora, macio por dentro.'], ['Temperatura', 'Fresco no verão, morno no inverno.'], ['Apresentação', 'Porções pequenas e cuidadas.']],
        quote: '«Um sabor bem escolhido conta a história melhor do que um folheto.»',
        words: ['Fresco', 'Equilíbrio', 'Citrino', 'Ervas', 'Mel', 'Final'],
        images: [IMG('amber-silk'), IMG('sunset-haze'), IMG('coral-violet'), IMG('pink-spheres'), IMG('candle-snow'), IMG('lilac-haze')],
        specs: [['Perfil', 'Fresco e equilibrado'], ['Doçura', 'Baixa'], ['Acidez', 'Média'], ['Final', 'Longo, cítrico']],
        dos: ['Servir em porções pequenas', 'Apresentar com a história do produto', 'Ingredientes locais e da época'],
        donts: ['Sabores artificiais ou muito doces', 'Servir sem contexto', 'Embalagens descartáveis de plástico'],
        features: [
            feature('Roda de sabores', 'Os sabores da marca em réguas: do doce ao amargo, do leve ao intenso.', sliders([['Doce', 'Amargo', 35], ['Leve', 'Intenso', 40], ['Ácido', 'Suave', 45], ['Frio', 'Quente', 50]])),
            feature('Menu de degustação', 'Os momentos da degustação, passo a passo.', steps([['Boas-vindas', 'Chá da marca, fresco.'], ['Entrada', 'Ervas, citrinos e pão.'], ['Principal', 'Sabor de assinatura.'], ['Final', 'Doce leve com mel.']])),
            feature('Paleta gustativa', 'As cores dos sabores da marca.', swatches([['Citrino', '#F2C14E'], ['Ervas', '#7FA36B'], ['Mel', '#D9902F'], ['Chá', '#E8DCC2']])),
        ],
    },
    {
        topic: 'multisensory', label: 'Experiência multissensorial', title: 'Cinco sentidos,\numa só marca.',
        lead: 'Visão, som, cheiro, toque e sabor a contar a mesma história, ao mesmo tempo.',
        body: 'A experiência da marca é coerente quando todos os sentidos dizem o mesmo. Desenhamos cada ponto de contacto para que imagem, som, aroma, material e sabor se reforcem, nunca se contradigam.',
        items: [['Visão', 'Cor, luz e forma da marca.'], ['Audição', 'Logo sonoro e música ambiente.'], ['Olfato', 'Fragrância de assinatura.'], ['Tato', 'Materiais mate e naturais.'], ['Paladar', 'Sabores frescos e equilibrados.'], ['Emoção', 'A soma de todos: confiança.']],
        quote: '«Uma marca coerente sente-se antes de se explicar.»',
        words: ['Ver', 'Ouvir', 'Cheirar', 'Tocar', 'Provar', 'Sentir'],
        images: [IMG('spectrum-rays'), IMG('prism-corridor'), IMG('violet-ribbon'), IMG('crystal-prism'), IMG('purple-bubbles'), IMG('red-hall')],
        specs: [['Sentidos', '5'], ['Pontos de contacto', '12'], ['Momento-chave', 'Chegada'], ['Duração média', '25 min']],
        dos: ['Desenhar a experiência como um percurso', 'Testar com pessoas reais', 'Repetir os mesmos sinais'],
        donts: ['Estímulos em excesso ao mesmo tempo', 'Sentidos que contam histórias diferentes', 'Esquecer a acessibilidade'],
        features: [
            feature('Jornada sensorial', 'O percurso da experiência em capítulos, sentido a sentido.', chapters([['Chegada', 'A luz e o aroma recebem antes de qualquer palavra.'], ['Descoberta', 'Materiais para tocar e som ambiente a acompanhar.'], ['Momento', 'O sabor da marca sela a experiência.'], ['Memória', 'Leva-se para casa uma embalagem que se reconhece.']])),
            feature('Mapa dos sentidos', 'Cada sentido com o seu sinal da marca, em cartões.', checklists([['Visão e audição', ['Luz quente', 'Logo sonoro', 'Música a 96 BPM']], ['Olfato e tato', ['Fragrância floral amadeirada', 'Papel de algodão', 'Relevo seco']], ['Paladar', ['Chá branco e citrinos', 'Porções pequenas']]])),
            feature('Sentidos em vídeo', 'Um vídeo da experiência com as notas de produção.', film('A experiência da marca em 60 segundos', [['Duração', '60 s'], ['Formato', '16:9 e 9:16'], ['Som', 'Logo sonoro no fecho']])),
        ],
    },
    {
        topic: 'motion', label: 'Motion design', title: 'A marca\nem movimento.',
        lead: 'Curvas, durações e transições que dão à marca um ritmo próprio.',
        body: 'O movimento da marca é decidido, nunca nervoso: começa rápido e pousa suave. Usamos poucas durações, sempre as mesmas, para que tudo pareça feito pela mesma mão.',
        items: [['Entrada', 'Sobe 24 px e aparece, 400 ms.'], ['Saída', 'Desaparece em 200 ms.'], ['Curva', 'cubic-bezier(.2,.8,.2,1).'], ['Escalonamento', '60 ms entre elementos.'], ['Logótipo', 'Anel que se desenha em 1,2 s.'], ['Transições', 'Máscaras, nunca cortes secos.']],
        quote: '«Movimento com intenção: cada gesto leva a algum lado.»',
        words: ['Decidido', 'Suave', 'Ritmo', 'Fluxo', 'Pausa', 'Pouso'],
        images: [IMG('violet-ribbon'), IMG('neon-blur'), IMG('blue-blur'), IMG('purple-bubbles'), IMG('spectrum-rays'), IMG('periwinkle-flow')],
        specs: [['Curto', '200 ms'], ['Médio', '400 ms'], ['Longo', '800 ms'], ['Curva', 'ease-out']],
        dos: ['Animar só o que ajuda a entender', 'Usar as três durações da marca', 'Respeitar «reduzir movimento»'],
        donts: ['Ressaltos e elásticos exagerados', 'Animações em loop sem fim', 'Durações diferentes em cada peça'],
        features: [
            feature('Reel da marca', 'Um vídeo com o motion da marca e as suas regras.', film('Reel de motion da marca', [['Fps', '60'], ['Curva', 'ease-out'], ['Logótipo', '1,2 s']])),
            feature('Curvas e durações', 'As durações da marca como réguas: curto, médio e longo.', (th) => [
                ...[['Curto · 200 ms', 25], ['Médio · 400 ms', 50], ['Longo · 800 ms', 100]].flatMap(([label, w]) => [row([[t(String(label), 15, th, { color: th.ink, fontWeight: 600 })], [bar(`linear-gradient(90deg, ${th.accent} ${w}%, ${th.line} ${w}%)`, 10, { marginTop: '7px' })]], { widths: [0.6, 2], gap: 24, valign: 'middle' })]),
                t('Curva padrão: cubic-bezier(.2, .8, .2, 1) — rápida a sair, suave a pousar.', 15, th),
            ]),
            feature('Movimento das formas', 'As formas da marca a reagir ao rato, como exemplo vivo de movimento.', shapes({ shape: 'symbol', arrangement: 'scatter', density: 30, size: 60, variation: 70, cursor: 'lean' })),
        ],
    },
    {
        topic: 'offline', label: 'Aplicações offline', title: 'A marca\nfora do ecrã.',
        lead: 'Papelaria, sinalética, embalagens e merchandising com as mesmas regras do digital.',
        body: 'Fora do ecrã a marca tem peso, escala e materiais. Cada peça segue a grelha, a paleta e a tipografia da marca, adaptadas ao papel, à parede e ao objeto.',
        items: [['Papelaria', 'Cartão de visita, papel de carta, envelope.'], ['Sinalética', 'Exterior, interior e direcional.'], ['Embalagem', 'Caixa, saco e papel de seda.'], ['Merchandising', 'T-shirt, caderno, garrafa.'], ['Eventos', 'Roll-up, crachá e fundo de palco.'], ['Frota', 'Viaturas com o símbolo em grande.']],
        quote: '«Se cabe na mão, tem de parecer da marca.»',
        words: ['Papel', 'Parede', 'Caixa', 'Tecido', 'Escala', 'Peso'],
        images: [BV('application-1'), BV('application-2'), BV('application-3'), BV('post-2'), BV('post-5'), BV('imagery-2')],
        specs: [['Cartão de visita', '85 × 55 mm'], ['Papel de carta', 'A4, 120 g'], ['Roll-up', '85 × 200 cm'], ['Cores', 'Pantone + CMYK']],
        dos: ['Usar os ficheiros de produção da marca', 'Pedir prova de cor antes de imprimir', 'Respeitar margens de segurança'],
        donts: ['Converter cores à vista', 'Esticar o logótipo para preencher', 'Materiais baratos em peças de contacto'],
        features: [
            feature('Peças em galeria', 'As aplicações offline em galeria, prontas a mostrar.', pictures([BV('application-1'), BV('application-2'), BV('application-3'), BV('post-2'), BV('post-5'), BV('imagery-2')], { galleryType: 'mosaic', columns: 4 })),
            feature('Ficheiros de produção', 'Os ficheiros de impressão para descarregar.', downloads([['Papelaria (PDF)', 'PDF', '12 MB'], ['Sinalética', 'AI', '34 MB'], ['Embalagens', 'ZIP', '58 MB']])),
            feature('Especificações de impressão', 'Tabela com formatos, papéis e acabamentos.', table([['Cartão de visita', '85 × 55 mm', 'Algodão 350 g, relevo seco no símbolo.'], ['Envelope', 'DL', 'Papel 120 g, fecho autoadesivo.'], ['Saco', '32 × 40 cm', 'Kraft, alças de algodão.']])),
        ],
    },
    {
        topic: 'illustration', label: 'Ilustração', title: 'Ilustrar\ncom intenção.',
        lead: 'Um estilo de ilustração reconhecível: traço, cor, personagens e regras de composição.',
        body: 'A ilustração da marca é simples e geométrica, com traço uniforme e as cores da paleta. Explica o que a fotografia não consegue — ideias, processos, emoções — sempre com humor leve.',
        items: [['Traço', 'Uniforme, 2 px, cantos redondos.'], ['Cor', 'Só a paleta da marca, sem gradientes.'], ['Personagens', 'Proporções simples, sem traços de rosto.'], ['Composição', 'Muito espaço em branco.'], ['Detalhe', 'O mínimo para entender.'], ['Humor', 'Leve, nunca sarcástico.']],
        quote: '«Uma boa ilustração explica numa olhadela.»',
        words: ['Geométrica', 'Leve', 'Clara', 'Humana', 'Lúdica', 'Simples'],
        images: [IMG('pink-spheres'), IMG('coral-violet'), IMG('purple-bubbles'), IMG('lilac-haze'), IMG('blue-dots'), IMG('indigo-rings')],
        specs: [['Traço', '2 px'], ['Cantos', 'Redondos'], ['Cores', 'Paleta da marca'], ['Formato', 'SVG']],
        dos: ['Formas geométricas simples', 'Cores planas da paleta', 'Espaço à volta da ilustração'],
        donts: ['Sombras e texturas realistas', 'Misturar estilos de ilustradores', 'Personagens caricaturais'],
        features: [
            feature('Biblioteca de ilustrações', 'As ilustrações da marca em grelha, para escolher e usar.', pictures([IMG('pink-spheres'), IMG('coral-violet'), IMG('purple-bubbles'), IMG('lilac-haze'), IMG('blue-dots'), IMG('indigo-rings'), IMG('periwinkle-flow'), IMG('pink-arch')], { columns: 4, aspectRatio: '1/1' })),
            feature('Paleta da ilustração', 'As cores permitidas na ilustração.', swatches([['Rosa', B.pink], ['Magenta', B.magenta], ['Índigo', B.indigo], ['Verde', B.green], ['Papel', '#F4F1EA']])),
            feature('Pack de ilustrações', 'As ilustrações em SVG e PNG para descarregar.', downloads([['Ilustrações (SVG)', 'SVG', '6.2 MB'], ['Ilustrações (PNG)', 'PNG', '24 MB'], ['Personagens', 'ZIP', '9.8 MB']])),
        ],
    },
    {
        topic: 'grid', label: 'Grelhas e layouts', title: 'A estrutura\npor trás de tudo.',
        lead: 'Grelhas, margens e ritmos que organizam cada página, ecrã e cartaz.',
        body: 'Usamos uma grelha de 12 colunas com medianiz de 24 px e uma base de 8 px para todos os espaçamentos. A grelha não aprisiona: é o que deixa a liberdade parecer intencional.',
        items: [['Colunas', '12 no desktop, 6 no tablet, 4 no telemóvel.'], ['Medianiz', '24 px em todos os formatos.'], ['Margens', '72 px desktop, 24 px telemóvel.'], ['Base', 'Tudo múltiplo de 8 px.'], ['Ritmo vertical', 'Secções de 120 px de espaço.'], ['Quebras', 'Imagens podem sangrar a margem.']],
        quote: '«A grelha é invisível quando funciona.»',
        words: ['Coluna', 'Medianiz', 'Margem', 'Base', 'Ritmo', 'Respiro'],
        images: [BV('application-2'), BV('post-1'), BV('post-3'), BV('post-6'), BV('application-1'), BV('imagery-5')],
        specs: [['Colunas', '12'], ['Medianiz', '24 px'], ['Margem', '72 px'], ['Base', '8 px']],
        dos: ['Alinhar tudo às colunas', 'Usar múltiplos de 8 px', 'Deixar espaço vazio de propósito'],
        donts: ['Espaçamentos «a olho»', 'Elementos a meio de duas colunas', 'Páginas sem margens'],
        features: [
            feature('Grelha de 12 colunas', 'A grelha da marca desenhada, com colunas, medianiz e margens.', grid12),
            feature('Layouts de referência', 'Exemplos de layouts reais construídos sobre a grelha.', pictures([BV('application-2'), BV('post-1'), BV('post-3'), BV('post-6')], { columns: 4, aspectRatio: '4/5' })),
            feature('Escala de espaçamento', 'Os espaçamentos da marca, de 8 a 120 px.', (th) => [8, 16, 24, 48, 72, 120].map(v => row([[t(`${v} px`, 15, th, { color: th.ink, fontFamily: 'Space Mono' })], [bar(th.accent, 10, { width: `${Math.round(v / 120 * 100)}%`, marginTop: '7px' })]], { widths: [0.4, 2], gap: 24, valign: 'middle' }))),
        ],
    },
    {
        topic: 'graphics', label: 'Elementos gráficos', title: 'Formas que\nsão nossas.',
        lead: 'Padrões, formas e grafismos derivados do símbolo, que dão à marca um vocabulário visual.',
        body: 'Todos os elementos gráficos nascem do símbolo: o anel, o arco e o ponto. Combinam-se em padrões, molduras e destaques, sempre com as cores da marca e muito espaço à volta.',
        items: [['Anel', 'O símbolo como moldura e destaque.'], ['Arco', 'Metade do anel, para cantos e cortes.'], ['Ponto', 'Marcador e separador.'], ['Padrão', 'Anéis repetidos em grelha de 8.'], ['Gradiente', 'Só em capas e momentos especiais.'], ['Escala', 'Grande e cortado, nunca pequeno e solto.']],
        quote: '«Um bom grafismo reconhece-se sem logótipo.»',
        words: ['Anel', 'Arco', 'Ponto', 'Padrão', 'Corte', 'Escala'],
        images: [IMG('indigo-rings'), IMG('blue-dots'), IMG('pink-spheres'), IMG('green-lines'), IMG('crystal-hero'), IMG('violet-fluid')],
        specs: [['Base', 'O símbolo'], ['Espessura', '1/8 do diâmetro'], ['Cores', 'Paleta da marca'], ['Formato', 'SVG']],
        dos: ['Derivar sempre do símbolo', 'Usar em grande e cortado', 'Deixar o conteúdo respirar'],
        donts: ['Inventar formas novas', 'Encher o fundo de padrões', 'Grafismos por cima de texto'],
        features: [
            feature('Campo de formas', 'As formas da marca num campo vivo que cresce e reage ao rato.', shapes({ shape: 'ring', arrangement: 'hero', density: 40, size: 70, variation: 60 })),
            feature('Símbolo em cores', 'O símbolo da marca nas cores permitidas, como elemento gráfico.', symbols(['#FF0054', '#390099', '#06D6A0', '#111111'])),
            feature('Kit gráfico', 'Padrões e formas em SVG para descarregar.', downloads([['Padrões (SVG)', 'SVG', '2.1 MB'], ['Formas e molduras', 'ZIP', '4.6 MB'], ['Gradientes', 'ZIP', '18 MB']])),
        ],
    },
    {
        topic: 'personality', label: 'Personalidade', title: 'Se a marca\nfosse uma pessoa.',
        lead: 'Traços, comportamentos e limites que tornam a marca reconhecível em qualquer conversa.',
        body: 'A nossa marca é a amiga que percebe do assunto: segura sem ser arrogante, divertida sem ser palhaça, próxima sem ser invasiva. Sabe quando falar e quando ouvir.',
        items: [['Confiante', 'Sabe o que diz, não precisa de gritar.'], ['Calorosa', 'Trata as pessoas pelo nome.'], ['Curiosa', 'Faz perguntas antes de responder.'], ['Divertida', 'Humor leve, no momento certo.'], ['Honesta', 'Diz «não sei» quando não sabe.'], ['Generosa', 'Partilha o que sabe.']],
        quote: '«Seríamos a pessoa que todos querem sentar ao lado no jantar.»',
        words: ['Confiante', 'Calorosa', 'Curiosa', 'Divertida', 'Honesta', 'Generosa'],
        images: [BV('imagery-1'), BV('imagery-4'), BV('imagery-6'), IMG('pink-arch'), BV('imagery-2'), IMG('coral-violet')],
        specs: [['Arquétipo', 'O Sábio-Amigo'], ['Energia', 'Média-alta'], ['Formalidade', 'Baixa'], ['Humor', 'Leve']],
        dos: ['Mostrar opinião com respeito', 'Rir com as pessoas', 'Admitir erros depressa'],
        donts: ['Arrogância técnica', 'Piadas à custa de alguém', 'Promessas que não cumprimos'],
        features: [
            feature('Réguas de personalidade', 'Onde a marca se posiciona entre opostos, em réguas.', sliders([['Formal', 'Casual', 70], ['Sério', 'Divertido', 60], ['Clássico', 'Moderno', 78], ['Reservado', 'Expressivo', 55], ['Técnico', 'Simples', 72]])),
            feature('Somos / não somos', 'Os traços da marca e o seu exagero a evitar.', table([['Confiante', 'não arrogante', 'Falamos com segurança, mas ouvimos primeiro.'], ['Divertida', 'não palhaça', 'O humor nunca tapa a mensagem.'], ['Próxima', 'não invasiva', 'Tratamos por tu, mas respeitamos o espaço.']])),
            feature('Mural de traços', 'Os traços da marca em palavras grandes, alternando cheio e contorno.', wall(['Confiante', 'Calorosa', 'Curiosa', 'Divertida', 'Honesta', 'Generosa'])),
        ],
    },
    {
        topic: 'voice', label: 'Tom de voz', title: 'Como\nsoamos.',
        lead: 'A mesma voz em todo o lado, com o tom certo para cada momento.',
        body: 'A voz é quem somos — não muda. O tom adapta-se ao momento: mais leve numa publicação, mais cuidadoso num pedido de desculpa, mais direto numa instrução. Ouça os exemplos e sinta a diferença.',
        items: [['Claro', 'Uma ideia por frase.'], ['Caloroso', 'Escrevemos como falamos.'], ['Confiante', 'Sem «talvez» desnecessários.'], ['Útil', 'Cada frase ajuda a fazer algo.'], ['Positivo', 'Dizemos o que é possível.'], ['Humano', 'Nada de linguagem de robô.']],
        quote: '«Falamos com as pessoas, não para elas.»',
        words: ['Claro', 'Caloroso', 'Confiante', 'Útil', 'Positivo', 'Humano'],
        images: [IMG('midnight-wave'), IMG('violet-fluid'), IMG('blue-wave'), IMG('neon-blur'), IMG('indigo-rings'), IMG('periwinkle-flow')],
        specs: [['Pessoa', 'Tu'], ['Frases', 'Até 20 palavras'], ['Emojis', 'Só nas redes'], ['Exclamações', 'Uma, no máximo']],
        dos: ['Tratar por tu', 'Frases curtas e ativas', 'Explicar o porquê'],
        donts: ['Jargão e siglas', 'Maiúsculas para gritar', 'Frases passivas e longas'],
        features: [
            feature('Ouça a nossa voz', 'Players com exemplos da voz da marca em situações diferentes.', players([['Boas-vindas · tom caloroso', IMG('violet-fluid')], ['Instrução · tom direto', IMG('blue-wave')], ['Pedido de desculpa · tom cuidadoso', IMG('midnight-wave')]])),
            feature('Tom por situação', 'Réguas que mostram como o tom muda conforme o momento.', sliders([['Sério', 'Leve', 65], ['Formal', 'Informal', 72], ['Contido', 'Entusiasta', 58], ['Técnico', 'Simples', 80]])),
            feature('Antes e depois', 'Frases genéricas reescritas com a voz da marca.', rewrites([['Informamos que o seu pedido foi processado com sucesso.', 'Está feito! O teu pedido já vai a caminho.'], ['Ocorreu um erro. Tente novamente mais tarde.', 'Algo correu mal do nosso lado. Tenta outra vez daqui a um minuto.'], ['Contacte o apoio ao cliente para mais informações.', 'Dúvidas? Fala connosco — respondemos em minutos.']])),
        ],
    },
    {
        topic: 'language', label: 'Linguagem preferencial', title: 'As palavras\nque escolhemos.',
        lead: 'Palavras a usar, palavras a evitar e a forma de escrever termos, números e datas.',
        body: 'A linguagem preferencial mantém a marca consistente em todos os textos. Escolhemos palavras simples, inclusivas e positivas, e escrevemos sempre da mesma forma os termos que se repetem.',
        items: [['Pessoa', 'Tratamos por tu.'], ['Inclusão', 'Linguagem neutra sempre que possível.'], ['Números', 'Por extenso até dez.'], ['Datas', '12 de março de 2026.'], ['Moeda', '1 250 €, com espaço.'], ['Estrangeirismos', 'Só quando não há palavra portuguesa.']],
        quote: '«Escolher bem uma palavra poupa um parágrafo.»',
        words: ['Simples', 'Inclusiva', 'Precisa', 'Positiva', 'Nossa', 'Clara'],
        images: [BV('imagery-3'), BV('post-4'), IMG('cloud-frame'), IMG('lilac-haze'), BV('imagery-5'), IMG('dune-curve')],
        specs: [['Idioma', 'Português europeu'], ['Acordo', 'AO90'], ['Tratamento', 'Tu'], ['Género', 'Neutro']],
        dos: ['Começar pelo verbo nas instruções', 'Usar «pessoas» em vez de «utilizadores»', 'Explicar siglas na primeira vez'],
        donts: ['«Clique aqui»', '«Caro cliente»', 'Palavras em inglês sem necessidade'],
        features: [
            feature('Glossário da marca', 'Os termos da marca e como se escrevem.', glossary([['Brand book', 'Sempre em duas palavras, minúsculas no meio da frase.'], ['Equipa', 'Nunca «team».'], ['Pessoas', 'Em vez de «utilizadores» ou «clientes».'], ['Partilhar', 'Em vez de «enviar» quando é um link.']])),
            feature('Dizemos / não dizemos', 'Pares de palavras: a preferida e a evitada.', rewrites([['Caro cliente', 'Olá, Ana'], ['Clique aqui', 'Ver o manual'], ['Utilizadores', 'Pessoas'], ['Efetuar o pagamento', 'Pagar']])),
            feature('Listas de referência', 'Palavras a usar, a evitar e a escrever de forma especial.', checklists([['Usar', ['Simples', 'Juntos', 'Partilhar', 'Criar']], ['Evitar', ['Disruptivo', 'Sinergia', 'Solução 360', 'Top']], ['Escrever assim', ['e-mail → email', 'web site → site', '%: 20 %']]])),
        ],
    },
    {
        topic: 'slogans', label: 'Slogans e taglines', title: 'Poucas palavras,\nmuita marca.',
        lead: 'A tagline principal, as suas variações e as regras para criar novas assinaturas.',
        body: 'A tagline resume a promessa da marca numa frase que se diz em voz alta sem tropeçar. As variações adaptam-na a campanhas, mas nunca a contradizem.',
        items: [['Principal', '«Marcas que se usam bem.»'], ['Campanha', '«A tua marca, num só lugar.»'], ['Produto', '«Organiza. Partilha. Cresce.»'], ['Social', '«Feito para equipas de marca.»'], ['Interna', '«Cuidamos de cada detalhe.»'], ['Evento', '«Vem ver a tua marca viva.»']],
        quote: '«Marcas que se usam bem.»',
        words: ['Marcas', 'que se', 'usam', 'bem.', 'Brivio°', 'Sempre'],
        images: [IMG('crystal-hero'), IMG('red-hall'), IMG('prism-corridor'), IMG('spectrum-rays'), IMG('violet-ribbon'), IMG('neon-blur')],
        specs: [['Palavras', '4'], ['Sílabas', '7'], ['Uso', 'Assinatura'], ['Idiomas', 'PT · EN']],
        dos: ['Usar a tagline com o logótipo, à direita ou por baixo', 'Manter a pontuação final', 'Traduzir com aprovação'],
        donts: ['Mudar a ordem das palavras', 'Usar mais de uma tagline por peça', 'Hashtags no lugar da tagline'],
        features: [
            feature('Tagline em loop', 'A tagline a passar em letras grandes, de ponta a ponta.', loopOf(['Marcas que se usam bem', 'Brivio°'], 96)),
            feature('Família de taglines', 'A tagline principal e as variações por contexto.', table([['Principal', 'Marcas que se usam bem.', 'Assinatura de tudo o que fazemos.'], ['Campanha', 'A tua marca, num só lugar.', 'Lançamentos e publicidade.'], ['Produto', 'Organiza. Partilha. Cresce.', 'Site, app e materiais de venda.']])),
            feature('Tagline em destaque', 'A tagline em letra gigante, cheia e em contorno.', wall(['Marcas', 'que se', 'usam', 'bem.'])),
        ],
    },
    {
        topic: 'naming', label: 'Sistema de naming', title: 'Nomes que\nfazem sentido.',
        lead: 'Como nomeamos produtos, funcionalidades, planos e campanhas — e porquê.',
        body: 'O sistema de naming mantém a família de nomes coerente. A marca-mãe dá o apelido; os produtos têm nomes descritivos, curtos e fáceis de dizer em qualquer língua.',
        items: [['Marca-mãe', 'Brivio — sempre primeiro.'], ['Produtos', 'Brivio + palavra descritiva.'], ['Funcionalidades', 'Nomes comuns, sem marca.'], ['Planos', 'Começar, Crescer, Escalar.'], ['Campanhas', 'Nome temporário, com data.'], ['Internos', 'Nomes de código, nunca públicos.']],
        quote: '«Um bom nome explica-se sozinho.»',
        words: ['Curto', 'Claro', 'Dizível', 'Único', 'Família', 'Global'],
        images: [BV('post-1'), BV('post-3'), IMG('crystal-prism'), IMG('ice-crystal'), BV('application-3'), IMG('blue-dots')],
        specs: [['Comprimento', 'Até 2 palavras'], ['Idioma', 'Neutro'], ['Registo', 'Marca e domínio'], ['Aprovação', 'Equipa de marca']],
        dos: ['Testar a pronúncia em 3 línguas', 'Verificar registo e domínio', 'Seguir a arquitetura de nomes'],
        donts: ['Siglas incompreensíveis', 'Trocadilhos que não se traduzem', 'Números de versão no nome'],
        features: [
            feature('Arquitetura de nomes', 'Da marca-mãe às funcionalidades, nível a nível.', steps([['Marca-mãe', 'Brivio'], ['Produto', 'Brivio Brandbook'], ['Funcionalidade', 'Biblioteca de recursos'], ['Plano', 'Crescer']])),
            feature('Regras de naming', 'Tabela de regras com exemplos certos e errados.', table([['Produto', 'Brivio Brandbook', 'Marca + o que faz.'], ['Funcionalidade', 'Biblioteca', 'Palavra comum, sem marca.'], ['Campanha', 'Primavera 26', 'Tema + ano, temporário.']])),
            feature('Glossário de nomes', 'Os nomes em uso e como se escrevem.', glossary([['Brivio', 'Marca-mãe. Sempre com B maiúsculo.'], ['Brivio Brandbook', 'Produto. Nunca abreviar para «BB».'], ['Asset Library', 'Funcionalidade. Em português: Biblioteca de recursos.']])),
        ],
    },
    {
        topic: 'storytelling', label: 'Storytelling', title: 'A história\nque contamos.',
        lead: 'A narrativa da marca — de onde vem, o que enfrenta e para onde vai — contada como um manifesto.',
        body: 'Toda a história da marca segue o mesmo arco: um problema que nos incomodou, a decisão de o resolver, o caminho que fizemos e o futuro que queremos construir com quem nos acompanha.',
        items: [['O mundo antes', 'Marcas espalhadas por pastas e emails.'], ['O incómodo', 'Ninguém sabia qual era a versão certa.'], ['A decisão', 'Criar um lugar onde a marca vive inteira.'], ['O caminho', 'Ouvir equipas, desenhar, simplificar.'], ['A mudança', 'Marcas claras, partilháveis, vivas.'], ['O futuro', 'Cada marca fácil de usar bem.']],
        quote: '«Começou com uma pergunta simples: onde está o logótipo certo?»',
        words: ['Origem', 'Conflito', 'Decisão', 'Caminho', 'Mudança', 'Futuro'],
        images: [BV('imagery-1'), IMG('dune-portal'), IMG('cloud-frame'), BV('imagery-6'), IMG('sunset-haze'), IMG('spectrum-rays')],
        specs: [['Herói', 'A equipa de marca'], ['Vilão', 'O caos de versões'], ['Mentor', 'Brivio'], ['Final', 'Marca viva']],
        dos: ['Pôr as pessoas no centro da história', 'Contar com detalhes reais', 'Terminar com o que vem a seguir'],
        donts: ['Fazer da marca o herói', 'Histórias inventadas', 'Finais sem convite à ação'],
        features: [
            feature('História em capítulos', 'A história da marca em capítulos que avançam sozinhos.', chapters([['O mundo antes', 'Logótipos em pastas perdidas, cores copiadas à vista, apresentações desatualizadas.'], ['A decisão', 'E se a marca vivesse num só lugar, sempre certa?'], ['O caminho', 'Ouvimos centenas de equipas e simplificámos até ao essencial.'], ['Hoje', 'Marcas claras, partilháveis e vivas — e a história continua.']])),
            feature('Manifesto em loop', 'As palavras do manifesto a passar, sobre a história contada.', loopOf(['Clareza', 'Coragem', 'Cuidado', 'Continuidade'], 80)),
            feature('Arco narrativo', 'Os quatro atos da história da marca, lado a lado.', steps([['Origem', 'O problema que nos incomodou.'], ['Conflito', 'O que estava em jogo.'], ['Viragem', 'A decisão de fazer diferente.'], ['Futuro', 'O que construímos juntos.']])),
        ],
    },
    {
        topic: 'copywriting', label: 'Copywriting', title: 'Escrever\npara ser lido.',
        lead: 'Regras práticas para títulos, botões, emails e publicações, com exemplos reais.',
        body: 'Escrevemos para pessoas com pressa. Títulos que dizem o benefício, frases curtas, um pedido de ação claro. Cortamos tudo o que não ajuda — e depois cortamos mais um pouco.',
        items: [['Títulos', 'O benefício em até 8 palavras.'], ['Subtítulos', 'Como se chega lá.'], ['Botões', 'Verbo + objeto: «Ver o manual».'], ['Emails', 'Assunto com menos de 45 caracteres.'], ['Redes', 'A ideia nas primeiras 2 linhas.'], ['Erros', 'O que aconteceu e o que fazer.']],
        quote: '«Se podes dizer em cinco palavras, não uses dez.»',
        words: ['Curto', 'Ativo', 'Concreto', 'Útil', 'Humano', 'Claro'],
        images: [BV('post-2'), BV('post-4'), BV('post-6'), BV('application-2'), IMG('lilac-haze'), IMG('cloud-frame')],
        specs: [['Título', '≤ 8 palavras'], ['Frase', '≤ 20 palavras'], ['Parágrafo', '≤ 3 frases'], ['Botão', '≤ 3 palavras']],
        dos: ['Benefício antes da funcionalidade', 'Verbos no início dos botões', 'Ler em voz alta antes de publicar'],
        donts: ['Títulos que são trocadilhos sem sentido', '«Saiba mais» em todo o lado', 'Parágrafos de seis linhas'],
        features: [
            feature('Reescritas', 'Textos genéricos e a versão com o copy da marca.', rewrites([['Solução inovadora para gestão de ativos de marca.', 'A tua marca inteira, num só link.'], ['Saiba mais', 'Ver como funciona'], ['Registe-se agora para obter acesso.', 'Cria a tua conta grátis.']])),
            feature('Fórmulas de copy', 'Estruturas prontas para títulos, emails e publicações.', table([['Título', 'Benefício + para quem', '«Manuais de marca que as equipas usam.»'], ['Email', 'Assunto curto + 1 pedido', '«O teu manual está pronto. Partilha-o.»'], ['Publicação', 'Gancho + prova + ação', '«3 minutos, 1 link, 0 versões perdidas.»']])),
            feature('Checklist de revisão', 'O que verificar antes de publicar qualquer texto.', checklists([['Clareza', ['Uma ideia por frase', 'Sem jargão', 'Benefício no título']], ['Tom', ['Tratamento por tu', 'Positivo', 'Sem gritar']], ['Ação', ['Botão com verbo', 'Um só pedido', 'Link certo']]])),
        ],
    },
    {
        topic: 'styleguide', label: 'Guia de estilo visual', title: 'Todo o\nsistema visual.',
        lead: 'Logótipo, cor, tipografia, imagem e grafismos num só resumo, para consultar depressa.',
        body: 'Este guia resume o sistema visual da marca numa página: as peças principais e as regras que as ligam. Para os detalhes, cada capítulo do manual aprofunda o seu tema.',
        items: [['Logótipo', 'O símbolo e as suas versões.'], ['Cor', 'Rosa, magenta, índigo e verde.'], ['Tipografia', 'Inter Tight e Inter.'], ['Imagem', 'Luz natural, cor contida.'], ['Grafismos', 'Anel, arco e ponto.'], ['Grelha', '12 colunas, base de 8 px.']],
        quote: '«Um sistema simples aplica-se sem medo.»',
        words: ['Símbolo', 'Cor', 'Tipo', 'Imagem', 'Forma', 'Grelha'],
        images: [BV('application-1'), BV('application-3'), BV('post-1'), BV('post-5'), BV('imagery-4'), BV('app-icon-gradient')],
        specs: [['Cores', '4 + neutros'], ['Fontes', '2'], ['Grelha', '12 colunas'], ['Base', '8 px']],
        dos: ['Começar sempre por este resumo', 'Usar os recursos da biblioteca', 'Perguntar à equipa de marca em caso de dúvida'],
        donts: ['Criar variações do logótipo', 'Cores fora da paleta', 'Fontes do sistema em peças da marca'],
        features: [
            feature('Paleta resumida', 'As cores da marca em cartões, com o seu código.', swatches([['Rosa', B.pink], ['Magenta', B.magenta], ['Índigo', B.indigo], ['Verde', B.green], ['Preto', '#000000']])),
            feature('Tipografia resumida', 'As fontes da marca e o seu papel, com uma amostra.', typeSamples([['Inter Tight', 'Títulos', 'Marcas que se usam bem.'], ['Inter', 'Texto', 'Clara, legível, em qualquer ecrã.'], ['Space Mono', 'Legendas', 'V1.0 — 2026']])),
            feature('Índice do manual', 'O índice das páginas do manual, para saltar para cada tema.', indexOf),
        ],
    },
]

// =====================================================================================================
// Section structures (each chapter gets all twelve, with its own content, features and colours)
// =====================================================================================================

type Layout = (p: Pack, th: Theme) => { name: string, description: string, data: Block }

const LAYOUTS: Layout[] = [
    // 1 · Feature beside the introduction
    (p, th) => ({
        name: p.features[0].name, description: p.features[0].description,
        data: sec([col([...intro(p.label, p.title, p.lead, th), t(p.body, 15, th)], { alignVertical: 'middle' }), col(p.features[0].build(th), { alignVertical: 'middle', blockGap: 18 })], th, { widths: [0.9, 1.2], valign: 'middle' }),
    }),
    // 2 · Header row and the feature across the page
    (p, th) => ({
        name: p.features[1].name, description: p.features[1].description,
        data: sec([col([header(p.label, p.title, p.lead, th), ...p.features[1].build(th)], { blockGap: 28 })], th),
    }),
    // 3 · Centred title and the feature under it
    (p, th) => ({
        name: p.features[2].name, description: p.features[2].description,
        data: sec([col([...intro(p.label, p.title.replace(/\n/g, ' '), p.lead, th, 56, 'center'), ...p.features[2].build(th)], { alignHorizontal: 'center', blockGap: 28 })], th, { padY: 130 }),
    }),
    // 4 · Three cards
    (p, th) => ({
        name: `${p.label} em três cartões`, description: `Título e os três pontos principais de ${p.label.toLowerCase()} em cartões.`,
        data: sec([col([header(p.label, p.title, p.lead, th, 48), row(p.items.slice(0, 3).map(([a, b], i) => [num(String(i + 1).padStart(2, '0'), 40, th, { color: th.accent }), h(a, 24, th), t(b, 15, th)]), { gap: 16, itemGap: 12, colStyle: [0, 1, 2].map(() => cardStyle(th.card, { padding: pad(32, 28) })) })], { blockGap: 48 })], th),
    }),
    // 5 · Four numbered columns
    (p, th) => ({
        name: `Quatro pilares · ${p.label}`, description: 'Quatro colunas numeradas, cada uma com um filete por cima.',
        data: sec(p.items.slice(0, 4).map(([a, b], i) => col([rule(th), num(String(i + 1).padStart(2, '0'), 56, th), h(a, 24, th), t(b, 15, th)], { blockGap: 14 })), th, { gap: 32 }),
    }),
    // 6 · Image and numbered list
    (p, th) => ({
        name: `Imagem e regras · ${p.label}`, description: 'Imagem vertical e, ao lado, as regras em linhas numeradas.',
        data: sec([
            col([photo(p.images[0], { aspectRatio: '4/5', radius: 18 })]),
            col([lbl(p.label, th), h(p.title, 44, th), ...p.items.slice(0, 4).flatMap(([a, b], i) => [rule(th), row([[lbl(String(i + 1).padStart(2, '0'), th, { color: th.muted })], [h(a, 20, th), t(b, 15, th)]], { widths: [0.15, 1], gap: 16 })])], { blockGap: 16, alignVertical: 'middle' }),
        ], th, { widths: [0.9, 1.1], gap: 72, valign: 'middle' }),
    }),
    // 7 · Statement over an image
    (p) => ({
        name: `Frase-chave · ${p.label}`, description: 'Uma frase-chave em letra grande sobre uma imagem escura, a toda a largura.',
        data: sec([col([lbl(p.label, BRIVIO, { color: '#FFFFFF' }), serif(p.quote, 64, BRIVIO, { maxWidth: '980px' }), t(p.lead, 17, BRIVIO, { color: 'rgba(255,255,255,0.75)', maxWidth: '620px' })], { blockGap: 28 })], BRIVIO, { padY: 190, extra: { backgroundType: 'image', backgroundImage: p.images[2], backgroundColor: '#000000' } }),
    }),
    // 8 · Do / don't with images
    (p, th) => ({
        name: `Fazer e evitar · ${p.label}`, description: 'Duas colunas: o que fazer e o que evitar, cada uma com a sua imagem.',
        data: sec([
            col([header(p.label, 'Fazer e evitar.', p.lead, th, 48), row([[photo(p.images[1], { aspectRatio: '4/3' }), doDont(p.dos, [])], [photo(p.images[3], { aspectRatio: '4/3', filter: 'grayscale(1)' }), doDont([], p.donts)]], { gap: 32, itemGap: 16 })], { blockGap: 40 }),
        ], th),
    }),
    // 9 · Specs beside an image
    (p, th) => ({
        name: `Ficha técnica · ${p.label}`, description: 'Introdução com a ficha técnica em grelha de 2 × 2 e uma imagem ao lado.',
        data: sec([
            col([...intro(p.label, p.title, p.lead, th, 48), row([p.specs.slice(0, 2).flatMap(([k, v]) => [lbl(k, th, { color: th.muted }), t(v, 18, th, { color: th.ink, fontWeight: 600 })]), p.specs.slice(2, 4).flatMap(([k, v]) => [lbl(k, th, { color: th.muted }), t(v, 18, th, { color: th.ink, fontWeight: 600 })])], { gap: 24, itemGap: 6 })], { alignVertical: 'middle', blockGap: 24 }),
            col([photo(p.images[4], { aspectRatio: '1/1', radius: 24 })]),
        ], th, { widths: [1.1, 1], gap: 72, valign: 'middle' }),
    }),
    // 10 · Mosaic and keywords
    (p, th) => ({
        name: `Mosaico · ${p.label}`, description: 'Título, mosaico de imagens e três palavras-chave em colunas.',
        data: sec([col([
            header(p.label, p.title, p.lead, th, 48),
            gallery(p.images, { galleryType: 'mosaic', columns: 4, imageRadius: 10 }),
            row(p.words.slice(0, 3).map((w, i) => [lbl(w, th), t(p.items[i + 3]?.[1] || p.items[i][1], 15, th)]), { gap: 40 }),
        ], { blockGap: 40 })], th),
    }),
    // 11 · Brivio colour cards
    (p) => ({
        name: `Cartões de cor · ${p.label}`, description: 'Quatro cartões nas cores Brivio, cada um com um ponto-chave.',
        data: sec([B.indigo, B.magenta, B.pink, B.green].map((bg, i) => card([
            lbl(String(i + 1).padStart(2, '0'), BRIVIO, { color: i === 3 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.75)' }),
            h(p.items[i][0], 28, i === 3 ? WHITE : BRIVIO),
            t(p.items[i][1], 15, BRIVIO, { color: i === 3 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.82)' }),
        ], bg, { minHeight: 280, contentDistribution: 'between', heightMode: 'fill' })), BRIVIO, { gap: 12 }),
    }),
    // 12 · Editorial
    (p, th) => ({
        name: `Editorial · ${p.label}`, description: 'Título serif grande, o texto em duas colunas e as palavras da marca em fila.',
        data: sec([col([
            lbl(p.label, th),
            serif(p.title.replace(/\n/g, ' '), 76, th, { fontStyle: 'normal' }),
            row([[t(p.body, 17, th)], [t(p.items.map(([a, b]) => `${a}: ${b}`).slice(0, 3).join(' '), 17, th)]], { gap: 48 }),
            row(p.words.map(w => [t(w, 13, th, { fontFamily: 'Space Mono', textTransform: 'uppercase', letterSpacing: '0.12em', color: th.ink })]), { gap: 16 }),
        ], { blockGap: 32 })], th),
    }),
]

/** All the sections of one chapter, with colours that change from chapter to chapter */
const chapterPresets = (p: Pack, k: number): ComponentPreset[] => LAYOUTS.map((layout, j) => {
    const th = THEMES[(j + k * 3) % THEMES.length]
    const { name, description, data } = layout(p, th)
    return { id: `sec-${p.topic}-${String(j + 1).padStart(2, '0')}`, kind: 'section', topic: p.topic, name, description, data }
})

export const IDENTITY_PRESETS: ComponentPreset[] = PACKS.flatMap(chapterPresets)

/** Library topics of these chapters (label shown in the component library) */
export const IDENTITY_TOPICS: { id: ComponentTopic, label: string }[] = PACKS.filter(p => p.topic !== 'voice').map(p => ({ id: p.topic, label: p.label }))
