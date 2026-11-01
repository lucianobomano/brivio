import { Block } from "./types"
import type { ColumnData, ComponentPreset } from "./componentPresets"
import { createSocialMockupContent, socialId, type SocialSettings } from "./blocks/socialMockup"

/**
 * Social media sections: the brand on social networks — a profile with its grid, posts in the feed, stories
 * that play inside a phone (arrows, progress, endless loop) and reels — always with a title and a text.
 * Built from native sections, columns, texts and galleries plus the "Rede social" block, so the section is
 * set up from Edit section, every text from its toolbar and every phone from its own settings.
 */

let seq = 0
const uid = (prefix: string) => `social-${prefix}-${++seq}`

const BV = (name: string) => `/brandbook/templates/brivio/${name}.jpg`
const IMG = (name: string) => `/brandbook/presets/covers/${name}.webp`

const POSTS = ['post-1', 'post-2', 'post-3', 'post-4', 'post-5', 'post-6', 'application-1', 'application-2', 'application-3', 'imagery-1', 'imagery-4', 'app-icon-gradient'].map(BV)
const STORIES: [string, string][] = [
    [BV('imagery-2'), 'Novo manual. Mesma marca.'],
    [BV('post-4'), 'Tudo num só link'],
    [IMG('crystal-hero'), 'Brivio° — 2026'],
    [BV('application-2'), 'Desliza para ver mais'],
    [BV('imagery-5'), ''],
]

type Style = Record<string, unknown>
type Align = 'left' | 'center' | 'right'
const ZERO = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }

// ---------- themes ----------

interface Theme { bg: string, ink: string, muted: string, line: string, accent: string, card: string }
const NIGHT: Theme = { bg: '#0B0B0D', ink: '#F2F2F2', muted: '#8A8A90', line: 'rgba(255,255,255,0.12)', accent: '#FF0054', card: '#151518' }
const PAPER: Theme = { bg: '#F4F1EA', ink: '#141414', muted: '#7A7770', line: 'rgba(20,20,20,0.14)', accent: '#C2410C', card: '#FFFFFF' }
const WHITE: Theme = { bg: '#FFFFFF', ink: '#111111', muted: '#8B8B93', line: 'rgba(0,0,0,0.1)', accent: '#FF0054', card: '#F5F5F7' }
const PINK: Theme = { bg: '#FF0054', ink: '#FFFFFF', muted: 'rgba(255,255,255,0.8)', line: 'rgba(255,255,255,0.25)', accent: '#FFFFFF', card: '#E6004C' }
const INDIGO: Theme = { bg: '#390099', ink: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', line: 'rgba(255,255,255,0.2)', accent: '#06D6A0', card: '#4A12B0' }
const BLUSH: Theme = { bg: '#FBEFEF', ink: '#2A1416', muted: '#9A7A7C', line: 'rgba(42,20,22,0.14)', accent: '#E0457B', card: '#FFFFFF' }
const STONE: Theme = { bg: '#E7E7E4', ink: '#1A1A1A', muted: '#77776F', line: 'rgba(0,0,0,0.14)', accent: '#1A1A1A', card: '#F3F3F1' }
const INK: Theme = { bg: '#0F1A2B', ink: '#E9EEF5', muted: '#7E8CA3', line: 'rgba(233,238,245,0.14)', accent: '#7DD3FC', card: '#16233A' }
const MINT: Theme = { bg: '#E3F7EF', ink: '#0E2A20', muted: '#5C7A6E', line: 'rgba(14,42,32,0.14)', accent: '#0A8F63', card: '#FFFFFF' }
const SUN: Theme = { bg: '#F27A1A', ink: '#141010', muted: 'rgba(20,16,16,0.65)', line: 'rgba(20,16,16,0.18)', accent: '#141010', card: '#F58C35' }

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

/** The "Rede social" block */
const social = (settings: SocialSettings, media: string[] = POSTS, captions: string[] = []): Block => ({
    id: uid('b'), type: 'social-mockup' as Block['type'],
    content: { ...createSocialMockupContent(settings, media.map((url, i) => ({ id: socialId(), url, caption: captions[i] || '' }))) },
})
const profile = (s: SocialSettings = {}) => social({ mode: 'profile', ...s })
const post = (s: SocialSettings = {}, media = POSTS.slice(2)) => social({ mode: 'post', ...s }, media)
const stories = (s: SocialSettings = {}, list = STORIES) => social({ mode: 'story', ...s }, list.map(([u]) => u), list.map(([, c]) => c))
const reel = (s: SocialSettings = {}, media = [BV('imagery-6'), BV('post-5'), IMG('violet-fluid')]) => social({ mode: 'reel', ...s }, media)
const feedGrid = (s: SocialSettings = {}, media = POSTS) => social({ mode: 'grid', frame: 'none', ...s }, media)

const gallery = (urls: string[], style: Style): Block => ({
    id: uid('b'), type: 'gallery', content: { items: urls.map(url => ({ url, caption: '' })), style: { imageRadius: 12, ...style } },
})

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
const center = (blocks: Block[], s: Style = {}) => col(blocks, { alignHorizontal: 'center', alignVertical: 'middle', ...s })

const sec = (columns: ColumnData[], th: Theme, opts: { widths?: number[], gap?: number, padY?: number, valign?: 'top' | 'middle' | 'bottom', extra?: Style } = {}): Block => ({
    id: uid('sec'), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length, columnWidths: opts.widths || Array(columns.length).fill(1),
            padding: ZERO, columnGap: opts.gap ?? 64,
            sectionPadding: { isLocked: false, top: opts.padY ?? 110, right: 72, bottom: opts.padY ?? 110, left: 72 },
            contentWidth: 'fluid', backgroundType: 'color', backgroundColor: th.bg,
            alignVertical: opts.valign || 'middle', alignHorizontal: 'left', height: 'fit',
            ...opts.extra,
        },
    },
})

const intro = (label: string, title: string, body: string, th: Theme, size = 60, align: Align = 'left') => [
    lbl(label, th, { textAlign: align }),
    h(title, size, th, { textAlign: align }),
    t(body, 16, th, { textAlign: align, maxWidth: '460px' }),
]
const header = (label: string, title: string, body: string, th: Theme, size = 56) =>
    row([[lbl(label, th), h(title, size, th)], [t(body, 16, th)]], { widths: [1.3, 1], valign: 'bottom', gap: 64 })
/** Short rules, one per line */
const rules = (list: [string, string][], th: Theme) => list.flatMap(([a, b]) => [rule(th), row([[t(a, 14, th, { color: th.ink, fontWeight: 600 })], [t(b, 14, th)]], { widths: [0.7, 1.3], gap: 16 })])

let n = 0
const preset = (name: string, description: string, data: Block): ComponentPreset =>
    ({ id: `sec-social-${String(++n).padStart(2, '0')}`, kind: 'section', topic: 'social', name, description, data })

const DARK: SocialSettings = { theme: 'dark' }

// =====================================================================================================

export const SOCIAL_PRESETS: ComponentPreset[] = [
    // ----- Profile -----
    preset('Perfil da marca', 'Texto à esquerda e o perfil da marca num telemóvel: avatar, bio, destaques e grelha.', sec([
        col([...intro('Redes sociais', 'O perfil\nda marca.', 'Avatar, biografia e destaques seguem a identidade: o símbolo no avatar, a cor nos destaques, a grelha em ritmo.', WHITE), ...rules([['Avatar', 'Símbolo sobre branco'], ['Bio', 'Até 3 linhas, tom da marca'], ['Destaques', 'Capas na paleta da marca']], WHITE)]),
        center([profile()]),
    ], WHITE, { widths: [1, 1] })),

    preset('Perfil escuro', 'O perfil em modo escuro, à esquerda, com o texto à direita.', sec([
        center([profile({ ...DARK, frameColor: '#2A2A2E' })]),
        col(intro('Modo escuro', 'A marca de\nluzes apagadas.', 'O perfil tem de funcionar nos dois temas da app: verificamos o avatar e as capas sobre preto.', NIGHT)),
    ], NIGHT, { widths: [1, 1] })),

    preset('Perfil em rosa', 'Título centrado e o perfil ao meio, sobre o rosa Brivio.', sec([
        center([...intro('Instagram da marca', 'Onde a comunidade nos encontra.', 'Um perfil coerente vende antes de qualquer publicação.', PINK, 52, 'center'), profile({ frameColor: '#FFFFFF', width: 300 })], { blockGap: 28 }),
    ], PINK, { padY: 100 })),

    preset('Perfil e regras da bio', 'Perfil sem moldura e um guia de como escrever a biografia.', sec([
        center([profile({ frame: 'none', width: 340 })]),
        col([lbl('Biografia', PAPER), h('Três linhas,\numa promessa.', 48, PAPER), ...rules([['Linha 1', 'O que fazemos'], ['Linha 2', 'Para quem'], ['Linha 3', 'O próximo passo (link)']], PAPER), t('Sem hashtags na bio. Emojis só se forem da paleta da marca.', 14, PAPER)]),
    ], PAPER, { widths: [1, 1.1] })),

    preset('Dois perfis, dois temas', 'O mesmo perfil em claro e escuro, lado a lado, com o título por cima.', sec([
        col([header('Temas', 'Claro e escuro.', 'A identidade lê-se igual nos dois temas da app.', STONE), row([[profile({ alignment: 'right' })], [profile({ ...DARK, alignment: 'left' })]], { gap: 32 })], { blockGap: 48 }),
    ], STONE)),

    // ----- Feed / posts -----
    preset('Publicação no feed', 'Uma publicação da marca no feed, com legenda e números, ao lado do texto.', sec([
        col([...intro('Feed', 'Cada publicação\nconta.', 'Imagem em 4:5, legenda curta e um pedido de ação claro. A marca reconhece-se antes de ler o nome.', BLUSH), ...rules([['Formato', '4:5 · 1080 × 1350'], ['Legenda', 'Até 125 caracteres visíveis'], ['Hashtags', 'No máximo 3']], BLUSH)]),
        center([post()]),
    ], BLUSH, { widths: [1, 1] })),

    preset('Feed escuro', 'Publicação no feed em modo escuro, com o texto à direita.', sec([
        center([post({ ...DARK, frameColor: '#1E1E22' }, POSTS.slice(4))]),
        col(intro('Conteúdo', 'Pare o scroll.', 'Contraste alto, uma ideia por imagem e o símbolo sempre no mesmo canto.', INK)),
    ], INK, { widths: [1, 1] })),

    preset('Grelha do feed', 'A grelha de publicações sem telemóvel, grande, com título e texto ao lado.', sec([
        col(intro('Grelha', 'O feed como\num todo.', 'Planeamos a grelha em blocos de três: uma imagem, um texto, um produto — e repete.', WHITE)),
        col([feedGrid({ width: 520 })]),
    ], WHITE, { widths: [0.8, 1.2] })),

    preset('Planeamento da grelha', 'Título em cima e a grelha de 4 colunas a toda a largura.', sec([
        col([header('Planeamento', 'Um mês de publicações.', 'A sequência de cores e formatos que dá ritmo ao perfil.', PAPER), feedGrid({ width: 1100, gridColumns: 4 })], { blockGap: 40 }),
    ], PAPER)),

    preset('Publicação e grelha', 'Uma publicação no telemóvel e a grelha do perfil ao lado, com título por cima.', sec([
        col([header('Feed', 'Do detalhe ao todo.', 'Cada publicação funciona sozinha e na grelha.', MINT), row([[post({ alignment: 'right' })], [feedGrid({ width: 420, alignment: 'left' })]], { gap: 40, valign: 'middle' })], { blockGap: 48 }),
    ], MINT)),

    // ----- Stories -----
    preset('Stories no telemóvel', 'Stories a passar sozinhos num telemóvel, com setas para avançar e recuar.', sec([
        col([...intro('Stories', 'Vinte e quatro\nhoras de marca.', 'Texto grande, uma ideia por story e o logótipo no último ecrã. Toque nas setas para navegar.', NIGHT), ...rules([['Formato', '9:16 · 1080 × 1920'], ['Margem segura', '250 px em cima e em baixo'], ['Duração', '5 s por imagem']], NIGHT)]),
        center([stories()]),
    ], NIGHT, { widths: [1, 1] })),

    preset('Stories em loop', 'Stories em loop contínuo sem setas, centrados sobre o índigo.', sec([
        center([...intro('Stories', 'Sempre a acontecer.', 'Os stories repetem-se em loop: a marca em movimento, sem parar.', INDIGO, 52, 'center'), stories({ showArrows: false, duration: 3, frameColor: '#FFFFFF' })], { blockGap: 28 }),
    ], INDIGO, { padY: 100 })),

    preset('Três stories', 'Três telemóveis com sequências de stories diferentes, lado a lado.', sec([
        col([header('Sequências', 'Uma história em três tempos.', 'Lançamento, bastidores e convite — cada um com a sua sequência.', WHITE), row([
            [stories({ width: 260 }, STORIES.slice(0, 3))],
            [stories({ width: 260, duration: 6 }, STORIES.slice(1, 4))],
            [stories({ width: 260, duration: 4 }, STORIES.slice(2, 5))],
        ], { gap: 24, align: ['center', 'center', 'center'] })], { blockGap: 48 }),
    ], WHITE)),

    preset('Story e guia', 'Um story à esquerda e o guia de construção dos stories à direita.', sec([
        center([stories({ frameColor: '#E8E8E8' })]),
        col([lbl('Construção', STONE), h('Como montar\num story.', 48, STONE), ...rules([['1 · Gancho', 'Os primeiros 2 segundos'], ['2 · Mensagem', 'Uma frase, letra grande'], ['3 · Prova', 'Imagem real do produto'], ['4 · Ação', 'Link ou resposta']], STONE)]),
    ], STONE, { widths: [1, 1.1] })),

    preset('Stories sem moldura', 'Stories em ecrã, sem telemóvel, com o texto ao lado.', sec([
        col(intro('Stories', 'Feitos para\no polegar.', 'Sem molduras: o ecrã, os stories e a navegação, tal como aparecem a quem segue a marca.', BLUSH)),
        center([stories({ frame: 'none', width: 300 })]),
    ], BLUSH, { widths: [1, 1] })),

    preset('Story escuro com destaques', 'Story à direita e as capas dos destaques em grelha à esquerda.', sec([
        col([lbl('Destaques', NIGHT), h('As capas\ndos destaques.', 48, NIGHT), gallery([BV('post-1'), BV('application-2'), BV('imagery-2'), BV('post-4')], { galleryType: 'grid', columns: 4, aspectRatio: '1/1', imageRadius: 999 }), t('Capas na paleta da marca, com o mesmo ícone em linha fina.', 14, NIGHT)]),
        center([stories({ frameColor: '#2A2A2E' })]),
    ], NIGHT, { widths: [1.1, 0.9] })),

    // ----- Reels -----
    preset('Reel da marca', 'Um reel no telemóvel, com ações à direita e áudio da marca, e o texto ao lado.', sec([
        col([...intro('Reels', 'A marca em\nmovimento.', 'Vídeos curtos, legendados e com o som da marca. Os primeiros segundos decidem tudo.', INK), ...rules([['Duração', '15 a 30 s'], ['Legendas', 'Sempre, a meio do ecrã'], ['Áudio', 'Som original da marca']], INK)]),
        center([reel()]),
    ], INK, { widths: [1, 1] })),

    preset('Reel e story', 'Um reel e um story lado a lado, com título centrado por cima.', sec([
        center([...intro('Formatos verticais', 'Reels e stories.', 'O mesmo conteúdo, dois formatos: o reel fica, o story passa.', SUN, 52, 'center'), row([[reel({ alignment: 'right', width: 280 })], [stories({ alignment: 'left', width: 280 })]], { gap: 32 })], { blockGap: 32 }),
    ], SUN, { padY: 100 })),

    preset('Três reels', 'Três reels em telemóveis escuros, com o título em cima.', sec([
        col([header('Reels', 'Série de lançamento.', 'Três vídeos, uma campanha — o mesmo arranque, a mesma legenda, o mesmo fecho.', NIGHT), row([
            [reel({ width: 250, frameColor: '#2A2A2E' }, [BV('imagery-6'), BV('post-5')])],
            [reel({ width: 250, frameColor: '#2A2A2E' }, [BV('post-2'), IMG('violet-ribbon')])],
            [reel({ width: 250, frameColor: '#2A2A2E' }, [BV('imagery-3'), BV('post-3')])],
        ], { gap: 24, align: ['center', 'center', 'center'] })], { blockGap: 48 }),
    ], NIGHT)),

    // ----- Combinations -----
    preset('Ecossistema social', 'Perfil, publicação e story lado a lado: a marca inteira nas redes.', sec([
        col([header('Ecossistema', 'A marca nas redes.', 'Perfil, feed e stories a contar a mesma história.', WHITE), row([[profile({ width: 260 })], [post({ width: 260 })], [stories({ width: 260 })]], { gap: 24, align: ['center', 'center', 'center'] })], { blockGap: 48 }),
    ], WHITE)),

    preset('Telemóvel e loop de publicações', 'Perfil num telemóvel e as publicações a passar em loop ao lado.', sec([
        center([profile()]),
        col([lbl('Conteúdo', PAPER), h('Um feed que\nnunca para.', 48, PAPER), gallery(POSTS, { galleryType: 'loop', loopDirection: 'vertical', columns: 2, loopHeight: 520, loopSpeed: 32, aspectRatio: '4/5' })]),
    ], PAPER, { widths: [0.9, 1.1] })),

    preset('Stories e faixa de publicações', 'Stories no telemóvel e as publicações a deslizar numa faixa por baixo do texto.', sec([
        col([...intro('Campanha', 'Lançamento\nem todas as frentes.', 'Stories para o momento, publicações para ficar.', MINT), gallery(POSTS, { galleryType: 'loop', loopDirection: 'horizontal', columns: 1, loopRowHeight: 180, loopSpeed: 40, aspectRatio: '4/5' })]),
        center([stories()]),
    ], MINT, { widths: [1.2, 0.8] })),

    preset('Antes e depois do perfil', 'Dois perfis lado a lado: antes da identidade e com a identidade.', sec([
        col([header('Transformação', 'Antes e depois.', 'O mesmo perfil, antes e depois de aplicar a identidade.', STONE), row([
            [lbl('Antes', STONE, { color: STONE.muted }), profile({ accent: '#8B8B93', verified: false, showHighlights: false, alignment: 'left' }, )],
            [lbl('Depois', STONE), profile({ alignment: 'left' })],
        ], { gap: 40 })], { blockGap: 48 }),
    ], STONE)),

    preset('Kit para redes', 'Guia de formatos à esquerda e o feed no telemóvel à direita, sobre escuro.', sec([
        col([lbl('Kit', NIGHT), h('Formatos de\nredes sociais.', 52, NIGHT), ...rules([['Publicação', '1080 × 1350 · 4:5'], ['Quadrada', '1080 × 1080 · 1:1'], ['Story / Reel', '1080 × 1920 · 9:16'], ['Capa de destaque', '1080 × 1080'], ['Avatar', '320 × 320 · círculo']], NIGHT)]),
        center([post({ ...DARK, frameColor: '#2A2A2E' })]),
    ], NIGHT, { widths: [1.1, 0.9] })),

    preset('Tom das legendas', 'Publicação no feed e exemplos de legendas, certas e erradas.', sec([
        center([post({}, [BV('post-6'), BV('post-1')])]),
        col([lbl('Legendas', WHITE), h('Escrever\npara o feed.', 48, WHITE), ...rules([['Sim', '«A tua marca, num só lugar. Link na bio.»'], ['Não', '«Confira a nossa solução inovadora!!! 🔥🔥»'], ['Sim', '«3 minutos. 1 link. 0 versões perdidas.»']], WHITE)]),
    ], WHITE, { widths: [1, 1.1] })),

    preset('Telemóvel em destaque', 'Um telemóvel grande ao centro com stories, e o título à volta.', sec([
        center([lbl('Stories', BLUSH, { textAlign: 'center' }), h('Feito para\nver de perto.', 64, BLUSH, { textAlign: 'center' }), stories({ width: 380 }), t('Toque nas setas para ver todos os stories.', 14, BLUSH, { textAlign: 'center' })], { blockGap: 24 }),
    ], BLUSH, { padY: 100 })),

    preset('Lançamento em rosa', 'Story e publicação num fundo rosa, com uma lista de datas da campanha.', sec([
        col([lbl('Calendário', PINK), h('Semana de\nlançamento.', 52, PINK), ...rules([['Seg', 'Teaser em story'], ['Qua', 'Reel de apresentação'], ['Sex', 'Publicação de lançamento'], ['Dom', 'Story de agradecimento']], PINK)]),
        center([stories({ frameColor: '#FFFFFF', width: 270 })]),
        center([post({ frameColor: '#FFFFFF', width: 270 })]),
    ], PINK, { widths: [1, 0.8, 0.8], gap: 32 })),

    preset('Perfil com números', 'Perfil no telemóvel e três números de crescimento ao lado.', sec([
        center([profile({ ...DARK, frameColor: '#2A2A2E' })]),
        col([lbl('Resultados', INK), h('A marca a crescer.', 52, INK), row([[h('+38%', 48, INK, { color: INK.accent }), t('seguidores em 6 meses', 14, INK)], [h('4,2%', 48, INK, { color: INK.accent }), t('taxa de interação', 14, INK)]], { gap: 24 }), row([[h('12 mil', 48, INK, { color: INK.accent }), t('visualizações por reel', 14, INK)], [h('96', 48, INK, { color: INK.accent }), t('publicações por ano', 14, INK)]], { gap: 24 })], { blockGap: 24 }),
    ], INK, { widths: [0.9, 1.1] })),

    preset('Feed e reel', 'Grelha do feed à esquerda e um reel no telemóvel à direita.', sec([
        col([lbl('Feed', SUN), h('Grelha e\nvídeo.', 48, SUN), feedGrid({ width: 460, alignment: 'left' })]),
        center([reel({ frameColor: '#141010' })]),
    ], SUN, { widths: [1.2, 0.8] })),

    preset('Montra de stories', 'Quatro telemóveis pequenos com stories, numa montra a toda a largura.', sec([
        col([header('Montra', 'Os nossos stories.', 'Uma seleção dos formatos de story da marca.', INDIGO), row([
            [stories({ width: 210, frameColor: '#FFFFFF' }, STORIES.slice(0, 2))],
            [stories({ width: 210, frameColor: '#FFFFFF' }, STORIES.slice(1, 3))],
            [stories({ width: 210, frameColor: '#FFFFFF' }, STORIES.slice(2, 4))],
            [stories({ width: 210, frameColor: '#FFFFFF' }, STORIES.slice(3, 5))],
        ], { gap: 20, align: ['center', 'center', 'center', 'center'] })], { blockGap: 48 }),
    ], INDIGO)),
]
