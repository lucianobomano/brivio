import { Block } from "./types"
import type { ColumnData, ComponentPreset } from "./componentPresets"
import { createMarqueeContent, type MarqueeSettings } from "./blocks/marquee"

/**
 * Brand philosophy sections: purpose, mission and vision, values, beliefs, principles, manifesto, promise,
 * creative tensions, behaviours, origin and future. Up to four columns, built from native sections, columns,
 * texts, images, galleries, lists, stories, loops and brand shapes, so every part is edited on its own and
 * the section as a whole (padding, background, columns) from Edit section.
 */

let seq = 0
const uid = (prefix: string) => `philo-${prefix}-${++seq}`

const IMG = (name: string) => `/brandbook/presets/covers/${name}.webp`
const BRIVIO_IMG = (name: string) => `/brandbook/templates/brivio/${name}.jpg`
const GRADIENT = '/brandbook/presets/brivio-gradient.jpg'

type Style = Record<string, unknown>
type Align = 'left' | 'center' | 'right'
const ZERO = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }
const pad = (y: number, x = y) => ({ isLocked: false, top: y, right: x, bottom: y, left: x })

// ---------- themes ----------

interface Theme { bg: string, ink: string, muted: string, line: string, accent: string, card: string }
const PAPER: Theme = { bg: '#F4F1EA', ink: '#141414', muted: '#7A7770', line: 'rgba(20,20,20,0.14)', accent: '#C2410C', card: '#FFFFFF' }
const WHITE: Theme = { bg: '#FFFFFF', ink: '#111111', muted: '#8B8B93', line: 'rgba(0,0,0,0.1)', accent: '#FF0054', card: '#F5F5F7' }
const NIGHT: Theme = { bg: '#0B0B0D', ink: '#F2F2F2', muted: '#8A8A90', line: 'rgba(255,255,255,0.12)', accent: '#FF0054', card: '#151518' }
const SAND: Theme = { bg: '#EFE6DA', ink: '#2B1F18', muted: '#8C7666', line: 'rgba(43,31,24,0.16)', accent: '#B4532A', card: '#F7F0E6' }
const STONE: Theme = { bg: '#E7E7E4', ink: '#1A1A1A', muted: '#77776F', line: 'rgba(0,0,0,0.14)', accent: '#1A1A1A', card: '#F3F3F1' }
const INK: Theme = { bg: '#0F1A2B', ink: '#E9EEF5', muted: '#7E8CA3', line: 'rgba(233,238,245,0.14)', accent: '#7DD3FC', card: '#16233A' }
const BLUSH: Theme = { bg: '#FBEFEF', ink: '#2A1416', muted: '#9A7A7C', line: 'rgba(42,20,22,0.14)', accent: '#E0457B', card: '#FFFFFF' }
const FOREST: Theme = { bg: '#14201A', ink: '#EEF2EC', muted: '#8FA197', line: 'rgba(238,242,236,0.14)', accent: '#A3D9A5', card: '#1C2B23' }
const BRIVIO: Theme = { bg: '#000000', ink: '#FFFFFF', muted: '#9A9AA2', line: 'rgba(255,255,255,0.14)', accent: '#FF0054', card: '#121214' }
const B = { pink: '#FF0054', magenta: '#9E0059', indigo: '#390099', green: '#06D6A0' }

// ---------- blocks ----------

const h = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'heading' as Block['type'],
    content: { text: value, style: { fontSize: `${size}px`, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: '1.04', color: th.ink, ...style } },
})
const t = (value: string, size: number, th: Theme, style: Style = {}): Block => ({
    id: uid('b'), type: 'text', content: { text: value, style: { fontSize: `${size}px`, lineHeight: '1.6', color: th.muted, ...style } },
})
/** Small label in mono */
const lbl = (value: string, th: Theme, style: Style = {}) =>
    t(value, 11, th, { fontFamily: 'Space Mono', textTransform: 'uppercase', letterSpacing: '0.14em', lineHeight: '1.6', color: th.accent, ...style })
/** Big number / index */
const num = (value: string, size: number, th: Theme, style: Style = {}) => h(value, size, th, { fontWeight: 300, letterSpacing: '-0.05em', lineHeight: '1', ...style })
/** Thin rule (a text with a top border, editable like any text) */
const rule = (th: Theme, style: Style = {}) => t('​', 1, th, { borderTop: `1px solid ${th.line}`, lineHeight: '1px', height: '1px', ...style })
/** Serif quote */
const quote = (value: string, size: number, th: Theme, style: Style = {}) =>
    h(value, size, th, { fontFamily: 'Instrument Serif', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.01em', lineHeight: '1.12', ...style })

const photo = (url: string, style: Style = {}): Block => ({ id: uid('b'), type: 'image', content: { url, caption: '', style: { radius: 14, ...style } } })

const gallery = (urls: string[], style: Style = {}): Block => ({
    id: uid('b'), type: 'gallery',
    content: { items: urls.map(url => ({ url })), style: { galleryType: 'grid', columns: 3, aspectRatio: '4/5', imageRadius: 10, ...style } },
})

const bullets = (items: string[]): Block => ({ id: uid('b'), type: 'list', content: { items: items.map(x => ({ text: x, type: 'default' })) } })

const story = (slides: { title: string, description: string }[], accent: string): Block => ({
    id: uid('b'), type: 'story',
    content: {
        slides: slides.map(s => ({ id: uid('s'), ...s })),
        settings: { autoplay: true, duration: 6, accentColor: accent, barColor: 'rgba(127,127,127,0.25)', buttonColor: accent, align: 'left' },
    },
})

const loop = (items: string[], settings: MarqueeSettings = {}): Block => ({
    id: uid('b'), type: 'marquee' as Block['type'],
    content: { ...createMarqueeContent([{ items }], { borderTop: false, borderBottom: false, ...settings }) },
})

const motif = (settings: Record<string, unknown>): Block => ({ id: uid('b'), type: 'motif-field' as Block['type'], content: { settings } })

/** A row of small columns inside a column (numbered rows, spec tables, pairs…) */
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

/** A column drawn as a card (its own background, radius and inner padding) */
const card = (blocks: Block[], bg: string, s: Style = {}): ColumnData =>
    col(blocks, { backgroundColor: bg, radius: 20, padding: pad(32, 28), blockGap: 14, ...s })

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
            alignVertical: opts.valign === 'middle' ? 'middle' : opts.valign === 'bottom' ? 'bottom' : 'top', alignHorizontal: 'left', height: 'fit',
            ...opts.extra,
        },
    },
})

/** Heading block of a section: label, title and text */
const intro = (label: string, title: string, body: string, th: Theme, size = 56, align: Align = 'left') => [
    lbl(label, th, { textAlign: align }),
    h(title, size, th, { textAlign: align }),
    t(body, 17, th, { textAlign: align, maxWidth: '560px' }),
]

/** Title row: label + title on the left, a short text on the right */
const header = (label: string, title: string, body: string, th: Theme, size = 56) =>
    row([[lbl(label, th), h(title, size, th)], [t(body, 16, th)]], { widths: [1.25, 1], valign: 'bottom', gap: 64 })

let n = 0
const preset = (name: string, description: string, data: Block): ComponentPreset =>
    ({ id: `sec-philosophy-${String(++n).padStart(2, '0')}`, kind: 'section', topic: 'philosophy', name, description, data })

// =====================================================================================================

export const PHILOSOPHY_PRESETS: ComponentPreset[] = [
    // 1
    preset('Manifesto centrado', 'Uma frase-manifesto grande ao centro, com o texto que a explica e a assinatura.', sec([
        col([
            lbl('Filosofia da marca', NIGHT, { textAlign: 'center' }),
            h('Acreditamos que as marcas\nsão feitas de pessoas,\nnão de logótipos.', 64, NIGHT, { textAlign: 'center', lineHeight: '1.02' }),
            t('Tudo o que fazemos parte desta ideia: uma marca só é forte quando quem a vive a entende, a sente e a consegue explicar com as suas próprias palavras.', 18, NIGHT, { textAlign: 'center', maxWidth: '640px' }),
            lbl('— A equipa fundadora', NIGHT, { textAlign: 'center', color: NIGHT.muted }),
        ], { alignHorizontal: 'center', blockGap: 28 }),
    ], NIGHT, { padY: 160 })),

    // 2
    preset('Propósito, missão e visão', 'Os três fundamentos em cartões numerados, lado a lado.', sec([
        col([header('Fundamentos', 'Porque existimos,\no que fazemos e\npara onde vamos.', 'Três frases que orientam todas as decisões da marca — do produto à forma como respondemos a um email.', PAPER)], { blockGap: 0 }),
    ], PAPER, { padY: 110 })),

    // 3
    preset('Círculo dourado', 'Porquê, como e o quê: do centro para fora, em três linhas com a sua resposta.', sec([
        col(intro('Do centro para fora', 'Começamos\nsempre pelo porquê.', 'As pessoas não compram o que fazemos, compram a razão pela qual o fazemos. Por isso a nossa filosofia lê-se de dentro para fora.', WHITE, 52), { alignVertical: 'middle' }),
        col([
            row([[num('01', 44, WHITE, { color: B.pink })], [h('Porquê', 26, WHITE), t('Para que nenhuma marca perca a sua essência ao crescer.', 16, WHITE)]], { widths: [0.35, 1], gap: 20 }),
            rule(WHITE),
            row([[num('02', 44, WHITE, { color: B.magenta })], [h('Como', 26, WHITE), t('Tornando a identidade clara, partilhável e sempre atual.', 16, WHITE)]], { widths: [0.35, 1], gap: 20 }),
            rule(WHITE),
            row([[num('03', 44, WHITE, { color: B.indigo })], [h('O quê', 26, WHITE), t('Um lugar único onde a marca vive inteira — regras, recursos e histórias.', 16, WHITE)]], { widths: [0.35, 1], gap: 20 }),
        ], { blockGap: 24, alignVertical: 'middle' }),
    ], WHITE, { widths: [1, 1.2], valign: 'middle' })),

    // 4
    preset('Quatro valores em cartões', 'Os valores da marca em quatro cartões escuros, cada um com o seu número e frase.', sec([
        card([num('01', 56, INK, { color: INK.accent }), h('Clareza', 26, INK), t('Dizemos o essencial. Se precisa de explicação, ainda não está pronto.', 15, INK)], INK.card),
        card([num('02', 56, INK, { color: INK.accent }), h('Coragem', 26, INK), t('Escolhemos o caminho certo, mesmo quando não é o mais fácil.', 15, INK)], INK.card),
        card([num('03', 56, INK, { color: INK.accent }), h('Cuidado', 26, INK), t('Cada detalhe é uma forma de respeito por quem nos usa.', 15, INK)], INK.card),
        card([num('04', 56, INK, { color: INK.accent }), h('Continuidade', 26, INK), t('Construímos para durar: hoje, para o ano e daqui a dez.', 15, INK)], INK.card),
    ], INK, { gap: 16 })),

    // 5
    preset('Imagem e manifesto', 'Fotografia a toda a altura de um lado, o manifesto em texto corrido do outro.', sec([
        col([photo(IMG('dune-portal'), { aspectRatio: '4/5', radius: 0 })]),
        col([
            lbl('Manifesto', SAND),
            h('Fazemos menos,\nmas fazemos melhor.', 52, SAND),
            t('Recusamos o ruído. Preferimos uma ideia bem cuidada a dez ideias apressadas. Acreditamos no tempo certo das coisas, no detalhe que ninguém pede e na honestidade de dizer não.', 17, SAND),
            t('É assim que criamos marcas que as pessoas reconhecem sem precisarem de ver o nome.', 17, SAND, { color: SAND.ink, fontWeight: 600 }),
        ], { alignVertical: 'middle', blockGap: 22 }),
    ], SAND, { widths: [1, 1], gap: 80, valign: 'middle' })),

    // 6
    preset('Princípios numerados', 'Título fixo à esquerda e os princípios em linhas numeradas, separadas por filetes.', sec([
        col(intro('Princípios', 'Cinco regras\nque não\nnegociamos.', 'Valem para todos, em todos os projetos. Quando há dúvida, voltamos aqui.', STONE, 52)),
        col([
            ...[
                ['Primeiro a pessoa, depois o produto.', 'Desenhamos a partir de quem usa, não do que é mais fácil fazer.'],
                ['Simples não é pobre.', 'Tirar até ficar só o que importa é o trabalho mais difícil.'],
                ['Consistência gera confiança.', 'A mesma voz, as mesmas regras, em todos os pontos de contacto.'],
                ['Ninguém é dono de uma ideia.', 'As melhores soluções nascem da conversa, não do ego.'],
                ['Acabado é melhor do que perfeito.', 'Lançamos, ouvimos e melhoramos — sempre.'],
            ].flatMap(([title, body], i) => [
                row([[lbl(String(i + 1).padStart(2, '0'), STONE, { color: STONE.muted })], [h(title, 24, STONE, { letterSpacing: '-0.02em' }), t(body, 15, STONE)]], { widths: [0.15, 1], gap: 16 }),
                rule(STONE),
            ]),
        ], { blockGap: 18 }),
    ], STONE, { widths: [0.8, 1.2], gap: 80 })),

    // 7
    preset('Somos / não somos', 'Dois cartões em contraste: o que a marca é e o que nunca será.', sec([
        col([header('Personalidade', 'O que somos —\ne o que nunca seremos.', 'Uma marca define-se tanto pelo que escolhe como pelo que recusa.', WHITE, 52)], { blockGap: 0 }),
    ], WHITE, { padY: 110 })),

    // 8
    preset('Crença sobre imagem', 'Uma crença em letra grande sobre uma fotografia escura, a toda a largura.', sec([
        col([
            lbl('Aquilo em que acreditamos', BRIVIO, { color: '#FFFFFF' }),
            quote('«A identidade de uma marca não se impõe.\nConquista-se, um gesto de cada vez.»', 64, BRIVIO, { maxWidth: '980px' }),
            t('— Filosofia Brivio', 15, BRIVIO, { color: 'rgba(255,255,255,0.7)' }),
        ], { blockGap: 28, alignVertical: 'middle' }),
    ], BRIVIO, { padY: 200, extra: { backgroundType: 'image', backgroundImage: IMG('midnight-wave'), backgroundColor: '#000000' } })),

    // 9
    preset('Essência numa palavra', 'A essência da marca numa só palavra gigante e três atributos por baixo.', sec([
        col([
            lbl('Essência da marca', BLUSH, { textAlign: 'center' }),
            h('Proximidade.', 168, BLUSH, { textAlign: 'center', letterSpacing: '-0.06em', lineHeight: '0.9' }),
            row([
                [h('Humana', 22, BLUSH, { textAlign: 'center' }), t('Falamos com pessoas, não com segmentos.', 15, BLUSH, { textAlign: 'center' })],
                [h('Presente', 22, BLUSH, { textAlign: 'center' }), t('Estamos lá antes de ser preciso.', 15, BLUSH, { textAlign: 'center' })],
                [h('Sincera', 22, BLUSH, { textAlign: 'center' }), t('Dizemos o que pensamos, com cuidado.', 15, BLUSH, { textAlign: 'center' })],
            ], { gap: 40, align: ['center', 'center', 'center'] }),
        ], { alignHorizontal: 'center', blockGap: 40 }),
    ], BLUSH, { padY: 140 })),

    // 10
    preset('Pilares com imagens', 'Três pilares da marca, cada um com a sua imagem, título e descrição.', sec([
        col([photo(IMG('green-lines'), { aspectRatio: '3/4' }), lbl('Pilar 01', FOREST), h('Natureza', 28, FOREST), t('Materiais honestos, processos responsáveis e respeito pelo tempo.', 15, FOREST)]),
        col([photo(IMG('dune-curve'), { aspectRatio: '3/4' }), lbl('Pilar 02', FOREST), h('Equilíbrio', 28, FOREST), t('Entre o que a marca quer dizer e o que as pessoas precisam de ouvir.', 15, FOREST)]),
        col([photo(IMG('ice-crystal'), { aspectRatio: '3/4' }), lbl('Pilar 03', FOREST), h('Clareza', 28, FOREST), t('Formas limpas, ideias diretas, nenhuma decoração sem razão.', 15, FOREST)]),
    ], FOREST, { gap: 28 })),

    // 11
    preset('A promessa', 'A promessa da marca à esquerda e o que significa para cada público à direita.', sec([
        col([lbl('A nossa promessa', PAPER), h('Vais sempre\nsaber como\nusar a marca.', 60, PAPER)], { alignVertical: 'middle' }),
        col([
            ...[
                ['Para os clientes', 'Uma experiência coerente em todos os sítios onde nos encontram.'],
                ['Para a equipa', 'Regras claras que libertam tempo para criar, em vez de perguntar.'],
                ['Para os parceiros', 'Tudo o que precisam, atualizado, num único link.'],
            ].flatMap(([who, what]) => [rule(PAPER), row([[lbl(who, PAPER, { color: PAPER.ink })], [t(what, 16, PAPER)]], { widths: [0.8, 1.2], gap: 24 })]),
            rule(PAPER),
        ], { blockGap: 18, alignVertical: 'middle' }),
    ], PAPER, { widths: [1, 1.1], gap: 80, valign: 'middle' })),

    // 12
    preset('Linha do tempo da origem', 'Quatro momentos que formaram a filosofia da marca, ano a ano.', sec([
        col([rule(NIGHT), lbl('2016', NIGHT), num('Início', 40, NIGHT), t('Duas pessoas, um portátil e a vontade de organizar marcas de outra forma.', 15, NIGHT)]),
        col([rule(NIGHT), lbl('2019', NIGHT), num('Método', 40, NIGHT), t('Nasce o método: primeiro entender, depois desenhar, sempre documentar.', 15, NIGHT)]),
        col([rule(NIGHT), lbl('2022', NIGHT), num('Plataforma', 40, NIGHT), t('O método vira ferramenta para que qualquer equipa o use.', 15, NIGHT)]),
        col([rule(NIGHT), lbl('Hoje', NIGHT), num('Comunidade', 40, NIGHT), t('Milhares de marcas a viver a sua identidade num só lugar.', 15, NIGHT)]),
    ], NIGHT, { gap: 32 })),

    // 13
    preset('Credo «Acreditamos que…»', 'Uma lista de crenças em frases grandes, centradas, umas por baixo das outras.', sec([
        col([
            lbl('Acreditamos que…', WHITE, { textAlign: 'center' }),
            h('…o design é uma forma de cuidar.', 40, WHITE, { textAlign: 'center' }),
            h('…a consistência vale mais do que o brilho.', 40, WHITE, { textAlign: 'center', color: WHITE.muted }),
            h('…boas regras dão liberdade.', 40, WHITE, { textAlign: 'center' }),
            h('…uma marca é uma promessa cumprida.', 40, WHITE, { textAlign: 'center', color: WHITE.muted }),
            h('…o detalhe é onde a confiança nasce.', 40, WHITE, { textAlign: 'center' }),
        ], { alignHorizontal: 'center', blockGap: 18 }),
    ], WHITE, { padY: 140 })),

    // 14
    preset('Tensões criativas', 'Pares de qualidades em equilíbrio: «isto, mas não aquilo».', sec([
        col([
            header('Tensões criativas', 'O equilíbrio\nque nos define.', 'Cada qualidade tem um limite. É nesse equilíbrio que a marca encontra a sua voz.', SAND, 52),
            ...[
                ['Ousados', 'mas nunca arrogantes'],
                ['Simples', 'mas nunca simplistas'],
                ['Próximos', 'mas nunca informais demais'],
                ['Rigorosos', 'mas nunca rígidos'],
            ].flatMap(([a, b]) => [rule(SAND), row([[h(a, 40, SAND)], [h(b, 40, SAND, { fontWeight: 400, color: SAND.muted, fontFamily: 'Instrument Serif', fontStyle: 'italic' })]], { gap: 32, valign: 'middle' })]),
            rule(SAND),
        ], { blockGap: 20 }),
    ], SAND)),

    // 15
    preset('Filosofia em mosaico', 'Título, mosaico de imagens e três palavras-chave em colunas.', sec([
        col([
            header('Filosofia visual', 'A forma como vemos\no mundo.', 'Luz que esculpe, matéria que se sente, espaço para respirar. A filosofia da marca também se vê.', INK, 52),
            gallery([IMG('crystal-prism'), IMG('violet-fluid'), IMG('ice-blue-blur'), IMG('blue-wave'), IMG('indigo-rings'), IMG('periwinkle-flow'), IMG('midnight-wave')], { galleryType: 'mosaic', columns: 4, imageRadius: 10 }),
            row([
                [lbl('Luz', INK), t('Natural, lateral, com sombras suaves.', 15, INK)],
                [lbl('Matéria', INK), t('Texturas reais que se querem tocar.', 15, INK)],
                [lbl('Espaço', INK), t('Silêncio à volta do que importa.', 15, INK)],
            ], { gap: 40 }),
        ], { blockGap: 40 }),
    ], INK)),

    // 16
    preset('História em capítulos', 'A filosofia contada em capítulos que avançam sozinhos, ao lado de uma imagem.', sec([
        col([
            lbl('A nossa história', STONE),
            story([
                { title: 'O problema', description: 'As marcas perdiam-se em pastas, emails e apresentações desatualizadas.' },
                { title: 'A ideia', description: 'E se a marca vivesse num só lugar, sempre certa, aberta a quem precisa dela?' },
                { title: 'O compromisso', description: 'Cuidar da identidade como se fosse nossa — porque, de certa forma, também é.' },
                { title: 'O futuro', description: 'Marcas vivas, que crescem sem perder quem são.' },
            ], STONE.ink),
        ], { alignVertical: 'middle' }),
        col([photo(IMG('cloud-frame'), { aspectRatio: '4/5' })]),
    ], STONE, { widths: [1, 1], gap: 80, valign: 'middle' })),

    // 17
    preset('Valores em loop', 'Os valores a passar em loop e, por baixo, o texto que os explica em duas colunas.', sec([
        col([
            loop(['Clareza', 'Coragem', 'Cuidado', 'Continuidade'], { textColor: '#F2F2F2', fontSize: 88, fontWeight: 700, separator: 'dot', separatorColor: B.pink, speed: 60, fullBleed: true }),
            row([
                [lbl('Valores', NIGHT), h('Palavras que\nse praticam.', 48, NIGHT)],
                [t('Os nossos valores não estão numa parede. Estão nas decisões pequenas: na resposta rápida, no ficheiro bem organizado, no «não» dito a tempo.', 17, NIGHT), t('Se um valor não muda o que fazemos amanhã, não é um valor — é decoração.', 17, NIGHT, { color: NIGHT.ink })],
            ], { widths: [1, 1.2], gap: 64 }),
        ], { blockGap: 72 }),
    ], NIGHT, { padY: 100 })),

    // 18
    preset('Cartão sobre imagem', 'Uma coluna de imagem e, ao lado, a missão num cartão claro.', sec([
        col([], { backgroundImage: IMG('sunset-haze'), radius: 24, minHeight: 520 }),
        card([
            lbl('Missão', WHITE),
            h('Dar a cada marca\num lugar onde\nvive inteira.', 44, WHITE),
            t('Organizamos, apresentamos e partilhamos identidades para que ninguém tenha de adivinhar como usar uma marca.', 16, WHITE),
            row([spec('Para quem', 'Equipas de marca', WHITE), spec('Como', 'Simples e partilhável', WHITE)], { gap: 24 }),
        ], WHITE.card, { alignVertical: 'middle', padding: pad(48, 44), radius: 24 }),
    ], WHITE, { gap: 16, valign: 'middle' })),

    // 19
    preset('Impacto em números', 'A filosofia traduzida em quatro números, com uma frase de contexto.', sec([
        col([
            header('Filosofia em prática', 'O que acreditamos,\nmedido.', 'Uma filosofia só é verdadeira quando se vê nos resultados.', WHITE, 52),
            row([
                [num('98%', 72, WHITE, { color: B.pink }), t('das equipas encontram o que precisam à primeira.', 15, WHITE)],
                [num('3×', 72, WHITE), t('mais rápido a lançar uma campanha coerente.', 15, WHITE)],
                [num('1', 72, WHITE), t('fonte de verdade para toda a marca.', 15, WHITE)],
                [num('0', 72, WHITE), t('versões desatualizadas do logótipo em circulação.', 15, WHITE)],
            ], { gap: 32 }),
        ], { blockGap: 56 }),
    ], WHITE)),

    // 20
    preset('Valores na prática', 'Cada valor com o comportamento que espera e um exemplo concreto, em quatro colunas.', sec([
        col([
            header('Comportamentos', 'Do valor\nao gesto.', 'Como reconhecer cada valor no dia a dia.', PAPER, 52),
            row([[lbl('Valor', PAPER, { color: PAPER.muted })], [lbl('Comportamento', PAPER, { color: PAPER.muted })], [lbl('Exemplo', PAPER, { color: PAPER.muted })], [lbl('Evitar', PAPER, { color: PAPER.muted })]], { gap: 24 }),
            ...[
                ['Clareza', 'Escrevemos para ser entendidos.', 'Um email com a decisão na primeira linha.', 'Jargão e siglas sem explicação.'],
                ['Cuidado', 'Revemos antes de entregar.', 'Ficheiros nomeados e organizados.', '«Depois corrige-se.»'],
                ['Coragem', 'Dizemos o que pensamos.', 'Discordar numa reunião, com argumentos.', 'Concordar para evitar conflito.'],
            ].flatMap(cells => [rule(PAPER), row(cells.map((c, i) => [i === 0 ? h(c, 22, PAPER) : t(c, 15, PAPER, i === 3 ? { color: PAPER.accent } : {})]), { gap: 24 })]),
        ], { blockGap: 18 }),
    ], PAPER)),

    // 21
    preset('Manifesto editorial', 'O manifesto em duas colunas de texto corrido, como numa revista, com título grande.', sec([
        col([
            lbl('Manifesto', SAND),
            h('Uma marca é\numa conversa longa.', 72, SAND, { fontFamily: 'Instrument Serif', fontWeight: 400, letterSpacing: '-0.02em' }),
            row([
                [t('Não começa com um logótipo nem acaba numa campanha. Começa na primeira vez que alguém ouve o nosso nome e continua em cada encontro que se segue. Cada um desses momentos ou confirma o que somos, ou desmente-o.', 17, SAND)],
                [t('Por isso cuidamos de todos. Do ecrã ao balcão, do relatório à embalagem. Não por obsessão, mas porque sabemos que a confiança se ganha devagar e se perde depressa. É essa a nossa filosofia: coerência com alma.', 17, SAND)],
            ], { gap: 48 }),
        ], { blockGap: 32 }),
    ], SAND)),

    // 22
    preset('Visão de futuro', 'Imagem panorâmica, a visão em destaque e três ambições para os próximos anos.', sec([
        col([
            photo(IMG('spectrum-rays'), { aspectRatio: '21/9', radius: 20 }),
            row([[lbl('Visão 2030', FOREST), h('Um mundo onde cada\nmarca é fácil de usar bem.', 48, FOREST)], [t('Queremos que manter uma marca coerente deixe de ser um esforço e passe a ser o natural.', 17, FOREST)]], { widths: [1.3, 1], gap: 64, valign: 'bottom' }),
            row([
                [lbl('Ambição 01', FOREST), h('Acessível', 24, FOREST), t('Qualquer equipa, de qualquer tamanho.', 15, FOREST)],
                [lbl('Ambição 02', FOREST), h('Viva', 24, FOREST), t('Marcas que evoluem sem se perder.', 15, FOREST)],
                [lbl('Ambição 03', FOREST), h('Responsável', 24, FOREST), t('Menos desperdício, mais reutilização.', 15, FOREST)],
            ], { gap: 40 }),
        ], { blockGap: 48 }),
    ], FOREST)),

    // 23
    preset('Princípios em grelha 2×2', 'Quatro princípios em cartões numa grelha de dois por dois, ao lado do título.', sec([
        col(intro('Princípios de design', 'Quatro ideias,\numa forma\nde trabalhar.', 'Os princípios que guiam cada decisão visual e verbal da marca.', BLUSH, 52), { alignVertical: 'middle' }),
        col([
            row([
                [h('Essencial', 24, BLUSH), t('Tudo o que não ajuda, atrapalha.', 15, BLUSH)],
                [h('Humano', 24, BLUSH), t('Escrito e desenhado para pessoas reais.', 15, BLUSH)],
            ], { gap: 16, itemGap: 10 }),
            row([
                [h('Coerente', 24, BLUSH), t('O mesmo sistema em todo o lado.', 15, BLUSH)],
                [h('Generoso', 24, BLUSH), t('Espaço, contraste e tempo para ler.', 15, BLUSH)],
            ], { gap: 16, itemGap: 10 }),
        ], { blockGap: 16, backgroundColor: BLUSH.card, radius: 24, padding: pad(36, 32) }),
    ], BLUSH, { widths: [0.9, 1.1], gap: 64, valign: 'middle' })),

    // 24
    preset('Palavra do fundador', 'Retrato, uma citação longa em itálico e a assinatura do fundador.', sec([
        col([photo(BRIVIO_IMG('imagery-3'), { aspectRatio: '3/4', radius: 18 })]),
        col([
            lbl('Palavra do fundador', NIGHT),
            quote('«Criámos esta marca para resolver um problema que vivíamos todos os dias. Continuamos a fazê-la com a mesma inquietação: há sempre uma forma mais clara de fazer as coisas.»', 38, NIGHT),
            row([[h('Nome Apelido', 18, NIGHT)], [t('Fundador & diretor criativo', 15, NIGHT)]], { gap: 16, valign: 'middle' }),
        ], { alignVertical: 'middle', blockGap: 28 }),
    ], NIGHT, { widths: [0.8, 1.2], gap: 80, valign: 'middle' })),

    // 25
    preset('Compromissos', 'Os compromissos da marca com pessoas, planeta e clientes, em três listas.', sec([
        col([header('Compromissos', 'O que prometemos\ncumprir.', 'A nossa filosofia traduz-se em compromissos concretos, revistos todos os anos.', WHITE, 52)], { blockGap: 0 }),
    ], WHITE, { padY: 110 })),

    // 26
    preset('Camadas da marca', 'Da essência à expressão: quatro camadas em cartões com as cores Brivio, da mais íntima à mais visível.', sec([
        card([lbl('Camada 1', BRIVIO, { color: 'rgba(255,255,255,0.75)' }), h('Essência', 28, BRIVIO), t('A razão de existir, numa ideia.', 15, BRIVIO, { color: 'rgba(255,255,255,0.8)' })], B.indigo, { minHeight: 300, contentDistribution: 'between', heightMode: 'fill' }),
        card([lbl('Camada 2', BRIVIO, { color: 'rgba(255,255,255,0.75)' }), h('Valores', 28, BRIVIO), t('Aquilo que guia as decisões.', 15, BRIVIO, { color: 'rgba(255,255,255,0.8)' })], B.magenta, { minHeight: 300, contentDistribution: 'between', heightMode: 'fill' }),
        card([lbl('Camada 3', BRIVIO, { color: 'rgba(255,255,255,0.75)' }), h('Personalidade', 28, BRIVIO), t('A forma como soamos e agimos.', 15, BRIVIO, { color: 'rgba(255,255,255,0.8)' })], B.pink, { minHeight: 300, contentDistribution: 'between', heightMode: 'fill' }),
        card([lbl('Camada 4', WHITE, { color: 'rgba(0,0,0,0.6)' }), h('Expressão', 28, WHITE), t('O que se vê: logótipo, cor, tipo, imagem.', 15, WHITE, { color: 'rgba(0,0,0,0.7)' })], B.green, { minHeight: 300, contentDistribution: 'between', heightMode: 'fill' }),
    ], BRIVIO, { gap: 12 })),

    // 27
    preset('Imagem e três verdades', 'Imagem vertical alta e três verdades da marca em cartões empilhados.', sec([
        col([photo(IMG('crystal-hero'), { aspectRatio: '3/4', radius: 22 })]),
        col([
            lbl('Três verdades', INK),
            h('O que nunca\nmuda em nós.', 48, INK),
            row([[num('I', 36, INK, { color: INK.accent })], [h('Fazemos perguntas antes de respostas.', 20, INK), t('Entender vem sempre antes de desenhar.', 15, INK)]], { widths: [0.15, 1], gap: 12 }),
            row([[num('II', 36, INK, { color: INK.accent })], [h('Escrevemos tudo.', 20, INK), t('O que não está documentado perde-se.', 15, INK)]], { widths: [0.15, 1], gap: 12 }),
            row([[num('III', 36, INK, { color: INK.accent })], [h('Partilhamos por defeito.', 20, INK), t('Uma marca escondida não serve ninguém.', 15, INK)]], { widths: [0.15, 1], gap: 12 }),
        ], { alignVertical: 'middle', blockGap: 24 }),
    ], INK, { widths: [0.9, 1.1], gap: 72, valign: 'middle' })),

    // 28
    preset('Palavras que nos definem', 'Palavras em contorno sobre o gradiente Brivio, com o texto que as liga.', sec([
        col([
            lbl('Palavras que nos definem', BRIVIO, { color: '#FFFFFF' }),
            h('Clara.', 120, BRIVIO, { lineHeight: '0.95', letterSpacing: '-0.05em' }),
            h('Viva.', 120, BRIVIO, { lineHeight: '0.95', letterSpacing: '-0.05em', WebkitTextStroke: '2px #FFFFFF', color: 'transparent' }),
            h('Partilhada.', 120, BRIVIO, { lineHeight: '0.95', letterSpacing: '-0.05em' }),
        ], { blockGap: 4 }),
        col([t('Três palavras chegam para explicar a filosofia: uma marca clara é fácil de usar, uma marca viva evolui com as pessoas, uma marca partilhada pertence a quem a constrói.', 18, BRIVIO, { color: 'rgba(255,255,255,0.85)' })], { alignVertical: 'bottom' }),
    ], BRIVIO, { widths: [1.4, 1], valign: 'bottom', padY: 140, extra: { backgroundType: 'image', backgroundImage: GRADIENT, backgroundColor: B.indigo } })),

    // 29
    preset('O mundo diz / nós dizemos', 'Pares de crenças comuns e da resposta da marca, lado a lado.', sec([
        col([
            row([[lbl('O mundo diz', STONE, { color: STONE.muted })], [lbl('Nós dizemos', STONE)]], { gap: 48 }),
            ...[
                ['«Uma marca é o logótipo.»', 'Uma marca é tudo o que as pessoas sentem.'],
                ['«Regras matam a criatividade.»', 'Boas regras libertam tempo para criar.'],
                ['«Isso é coisa do designer.»', 'A marca é responsabilidade de todos.'],
                ['«Depois atualizamos o manual.»', 'O manual atualiza-se sozinho, todos os dias.'],
            ].flatMap(([a, b]) => [rule(STONE), row([[h(a, 28, STONE, { color: STONE.muted, fontWeight: 400, textDecoration: 'line-through' })], [h(b, 28, STONE)]], { gap: 48 })]),
            rule(STONE),
        ], { blockGap: 20 }),
    ], STONE)),

    // 30
    preset('Fecho com formas da marca', 'Formas da marca a crescer ao chegar, e a promessa final centrada por baixo.', sec([
        col([
            motif({ shape: 'petal', arrangement: 'arch', density: 48, size: 40, variation: 60, height: 300, grow: 'scroll', cursor: 'part', cursorStrength: 50, seed: 17 }),
            lbl('Em resumo', PAPER, { textAlign: 'center' }),
            h('Cuidamos da marca\npara que ela cuide de ti.', 60, PAPER, { textAlign: 'center' }),
            t('Esta é a nossa filosofia. Tudo o resto neste manual é a forma de a pôr em prática.', 17, PAPER, { textAlign: 'center' }),
        ], { alignHorizontal: 'center', blockGap: 24 }),
    ], PAPER, { padY: 80 })),
]

// ---------- sections that need a second row of columns under their header ----------

/** Adds a row of columns under the header column of a section (header + cards / lists layouts) */
const withRow = (sectionIndex: number, cols: Block[][], opts: Parameters<typeof row>[1]) => {
    const s = PHILOSOPHY_PRESETS[sectionIndex].data as Block
    const column = s.content.columns[0]
    column.blocks.push(row(cols, opts))
    column.settings = { ...column.settings, blockGap: 56 }
}

// 2 · Purpose, mission, vision as three numbered cards
withRow(1, [
    [num('01', 64, PAPER, { color: PAPER.accent }), lbl('Propósito', PAPER, { color: PAPER.ink }), h('Dar às marcas a coragem de serem elas próprias.', 24, PAPER), t('A razão pela qual acordamos de manhã.', 15, PAPER)],
    [num('02', 64, PAPER, { color: PAPER.accent }), lbl('Missão', PAPER, { color: PAPER.ink }), h('Tornar cada identidade clara, partilhável e viva.', 24, PAPER), t('O que fazemos todos os dias para lá chegar.', 15, PAPER)],
    [num('03', 64, PAPER, { color: PAPER.accent }), lbl('Visão', PAPER, { color: PAPER.ink }), h('Um mundo onde nenhuma marca se perde ao crescer.', 24, PAPER), t('O futuro que queremos ajudar a construir.', 15, PAPER)],
], { gap: 40, itemGap: 14 })

// 7 · We are / we are not
withRow(6, [
    [lbl('Somos', WHITE, { color: '#0F9D58' }), h('Diretos', 30, WHITE), h('Calorosos', 30, WHITE), h('Curiosos', 30, WHITE), h('Exigentes', 30, WHITE), t('Dizemos as coisas como são, com cuidado e vontade de aprender.', 15, WHITE)],
    [lbl('Não somos', WHITE, { color: '#E5383B' }), h('Bruscos', 30, WHITE, { color: WHITE.muted }), h('Melosos', 30, WHITE, { color: WHITE.muted }), h('Dispersos', 30, WHITE, { color: WHITE.muted }), h('Perfeccionistas', 30, WHITE, { color: WHITE.muted }), t('Cada qualidade levada ao extremo vira defeito — e evitamos isso.', 15, WHITE)],
], { gap: 16, itemGap: 6 })

// 25 · Commitments in three lists
withRow(24, [
    [lbl('Pessoas', WHITE), h('Com quem trabalha connosco', 22, WHITE), bullets(['Horários que respeitam a vida', 'Formação contínua', 'Crédito a quem fez o trabalho'])],
    [lbl('Planeta', WHITE), h('Com o lugar onde vivemos', 22, WHITE), bullets(['Ficheiros leves, menos energia', 'Fornecedores responsáveis', 'Reutilizar antes de produzir'])],
    [lbl('Clientes', WHITE), h('Com quem confia em nós', 22, WHITE), bullets(['Respostas em 24 horas', 'Preços claros, sem surpresas', 'Os vossos dados são vossos'])],
], { gap: 40, itemGap: 12 })
