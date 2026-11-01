/**
 * "Guidy": built-in brandbook template modelled on the Guidy guidelines layout
 * (dark, minimal, numbered chapters), filled with Brivio's own logo, colors, fonts and imagery.
 * Pages are plain editor data (sections → columns → blocks), so everything stays editable.
 * Artwork lives in public/brandbook/presets and public/brandbook/templates/brivio.
 */

import { placeholderAt, withPlaceholder } from "@/components/brandbook/editor/placeholders"

type Json = Record<string, unknown>
interface TemplateBlock { id: string, type: string, variant?: string, content: Json }
interface TemplateColumn { id: string, blocks: TemplateBlock[], settings: Json }

// Ids only need to be unique inside the template: they are regenerated when blocks are copied
let seq = 0
const uid = () => `bv${(++seq).toString(36)}`

const ASSETS = '/brandbook/templates/brivio'
const PRESETS = '/brandbook/presets'

const C = {
    bg: '#000000',
    text: '#FFFFFF',
    muted: '#8A8A8A',
    pink: '#FF0054',
    magenta: '#9E0059',
    indigo: '#390099',
    green: '#06D6A0',
}
const DISPLAY_FONT = "var(--font-inter-tight), 'Inter Tight', sans-serif"
const TEXT_FONT = "var(--font-inter), 'Inter', sans-serif"

// ---------- Blocks ----------

const text = (value: string, size = 18, style: Json = {}): TemplateBlock => ({
    id: uid(), type: 'text',
    content: { text: value, style: { fontSize: `${size}px`, color: C.muted, fontFamily: TEXT_FONT, lineHeight: 1.5, ...style } },
})

const heading = (value: string, size = 48, style: Json = {}): TemplateBlock => ({
    id: uid(), type: 'heading',
    content: {
        text: value,
        style: { fontSize: `${size}px`, color: C.text, fontFamily: DISPLAY_FONT, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, ...style },
    },
})

const image = (url: string, style: Json = {}): TemplateBlock => ({
    id: uid(), type: 'image', content: { url, caption: '', style: { radius: 16, ...style } },
})

const gallery = (urls: string[], columns: number, aspectRatio: string): TemplateBlock => ({
    id: uid(), type: 'gallery',
    content: { items: urls.map(url => ({ url, caption: '' })), style: { galleryType: 'grid', columns, aspectRatio, radius: 16 } },
})

const button = (label: string, filled = true): TemplateBlock => ({
    id: uid(), type: 'button',
    content: {
        text: label,
        style: {
            backgroundColor: filled ? C.text : 'transparent', color: filled ? C.bg : C.text,
            borderWidth: filled ? 0 : 1, borderColor: 'rgba(255,255,255,0.3)',
            width: '210px', height: '48px', fontSize: '15px', borderRadius: '9999px', textAlign: 'center', fontWeight: 500,
        },
    },
})

const palette = (colors: Json[], settings: Json): TemplateBlock => ({
    id: uid(), type: 'palette',
    content: { colors: colors.map(c => ({ id: uid(), ...c })), settings },
})

/** Chapter taglines, keyed by page title (the index matches pages by id or title) */
const CHAPTERS: Record<string, string> = {
    'Introdução': 'Toda a marca começa com uma história.',
    'Logótipo': 'O logótipo é o símbolo central da marca.',
    'Cores': 'A cor dá vida à marca.',
    'Tipografia': 'A tipografia dá voz à marca.',
    'Imagem': 'As imagens contam a história da marca.',
    'Recursos': 'Os recursos são a base da comunicação.',
}

/** Live index of the template's chapters (pages mode: follows renames and new pages) */
const chapterIndex = (titleSize: number): TemplateBlock => ({
    id: uid(), type: 'index',
    content: {
        items: [],
        settings: {
            source: 'pages', includeCurrentPage: true, excludedPages: ['Brand Book'], pageDescriptions: CHAPTERS,
            style: 'list', titleSize,
            accentColor: C.pink, textColor: C.text, mutedColor: 'rgba(255,255,255,0.45)',
            hoverBackground: '#141416', dividerColor: 'rgba(255,255,255,0.08)',
        },
    },
})

// ---------- Columns / sections ----------

const column = (blocks: TemplateBlock[], settings: Json = {}): TemplateColumn => ({
    id: uid(), blocks, settings: { alignHorizontal: 'left', alignVertical: 'top', blockGap: 20, padding: { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }, ...settings },
})

const section = (columns: TemplateColumn[], opts: { top?: number, bottom?: number, widths?: number[], gap?: number } = {}): TemplateBlock => ({
    id: uid(), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length,
            columnWidths: opts.widths || Array(columns.length).fill(1),
            padding: { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 },
            sectionPadding: { isLocked: false, top: opts.top ?? 48, right: 80, bottom: opts.bottom ?? 48, left: 80 },
            columnGap: opts.gap ?? 32,
            backgroundType: 'color',
            backgroundColor: C.bg,
            alignHorizontal: 'center',
            alignVertical: 'top',
        },
    },
})

// ---------- Page parts ----------

/** "V1.0 · Conteúdo · ← Voltar" bar at the top of every page */
const topBar = (withBack: boolean) => section([
    column([text('V1.0', 13, { color: C.text, fontWeight: 500 })]),
    column([text('Conteúdo', 13)]),
    column([text(withBack ? '← Voltar à visão geral' : 'Brivio°', 13, { textAlign: 'right' })]),
], { top: 32, bottom: 0 })

/** Page title with its introduction and download button */
const pageHero = (title: string, lead: string, body: string, download?: string) => section([
    column([heading(title, 128)]),
    column([
        text(lead, 24, { color: C.text }),
        text(body, 18),
        ...(download ? [button(download)] : []),
    ], { alignVertical: 'bottom' }),
], { top: 120, bottom: 96, widths: [1.2, 1] })

/** Chapter heading: name on the left, count on the right */
const chapterHeading = (name: string, count: string) => section([
    column([heading(name, 36)]),
    column([text(count, 15, { textAlign: 'right' })], { alignVertical: 'bottom' }),
], { top: 64, bottom: 24 })

/** Content row under a chapter heading */
const chapterBody = (columns: TemplateColumn[], widths?: number[]) => section(columns, { top: 0, bottom: 48, widths, gap: 16 })

/** "Navegação" list at the bottom of every chapter page, plus the credit line */
const navigation = () => [
    section([column([text('Navegação', 13, { textTransform: 'uppercase', letterSpacing: '0.12em' }), chapterIndex(56)])], { top: 120, bottom: 32 }),
    section([
        column([text('Brivio° — brand books com vida.', 13)]),
        column([text('© 2026 Brivio. Todos os direitos reservados.', 13, { textAlign: 'right' })]),
    ], { top: 32, bottom: 48 }),
]

const page = (...sections: (TemplateBlock | TemplateBlock[])[]) => ({ blocks: sections.flat() })

// ---------- Pages ----------

const HOME = page(
    topBar(false),
    section([
        column([
            heading('Brand Book', 200, { letterSpacing: '-0.06em' }),
            text('O guia de marca da Brivio — a plataforma para organizar, apresentar e partilhar identidades visuais. Tudo o que define a marca, num único lugar.', 22, { maxWidth: '720px' }),
        ]),
    ], { top: 160, bottom: 96 }),
    section([column([chapterIndex(72)])], { top: 0, bottom: 96 }),
    section([
        column([text('Sobre este guia', 13, { textTransform: 'uppercase', letterSpacing: '0.12em' })]),
        column([
            text('Este brand book mantém consistentes os elementos visuais e verbais da Brivio. Reúne o logótipo, a paleta de cores, a tipografia, a imagem e as aplicações reais da marca.', 24, { color: C.text }),
            button('Começar'),
        ]),
    ], { top: 48, bottom: 120, widths: [1, 2] }),
    section([
        column([text('Brivio° — brand books com vida.', 13)]),
        column([text('V1.0 · © 2026 Brivio', 13, { textAlign: 'right' })]),
    ], { top: 32, bottom: 48 }),
)

const INTRODUCTION = page(
    topBar(true),
    pageHero('Introdução', 'Toda a marca começa com uma história.', 'Esta secção apresenta o coração da Brivio — o seu propósito e aquilo em que acredita. Define o tom de tudo o que se segue.'),
    ...[
        ['Essência', 'A nossa marca assenta em clareza e criatividade. O design deve parecer simples, natural e honesto.'],
        ['Missão', 'Ajudamos designers, brand designers e agências a dar vida às suas ideias com sistemas de marca simples, bonitos e consistentes.'],
        ['Valores', 'Valorizamos a simplicidade, a honestidade e a curiosidade. O nosso tom é calmo, confiante e criativo — sempre com um toque humano.'],
    ].map(([name, value]) => section([
        column([heading(name, 36)]),
        column([text(value, 28, { color: C.text, lineHeight: 1.3 })]),
    ], { top: 48, bottom: 48, widths: [1, 2] })),
    ...navigation(),
)

const LOGO = page(
    topBar(true),
    pageHero('Logótipo', 'O logótipo é o símbolo central da marca.', 'Esta secção mostra como usá-lo corretamente — do espaçamento e dimensão às variações e à área de proteção. Simples, memorável e reconhecível de imediato.', 'Descarregar logótipos'),
    chapterHeading('Logótipo completo', '(2 variantes)'),
    chapterBody([column([image(`${PRESETS}/brivio-logo.png`)]), column([image(`${ASSETS}/logo-dark.png`)])]),
    chapterHeading('Ícone da app', '(2 variantes)'),
    chapterBody([column([image(`${PRESETS}/brivio-symbol.png`)]), column([image(`${ASSETS}/app-icon-gradient.jpg`, { aspectRatio: '16/10' })])]),
    chapterHeading('Uso incorreto', '(3 variantes)'),
    chapterBody([
        column([image(`${ASSETS}/misuse-distort.png`), text('Não distorcer as proporções.', 15)]),
        column([image(`${ASSETS}/misuse-colors.png`), text('Não alterar as cores.', 15)]),
        column([image(`${ASSETS}/misuse-rotate.png`), text('Não rodar o logótipo.', 15)]),
    ]),
    ...navigation(),
)

const COLORS = page(
    topBar(true),
    pageHero('Cores', 'A cor dá vida à marca.', 'Define o ambiente, a emoção e a energia que as pessoas sentem ao vê-la. Esta secção explica como usar as cores da Brivio com consistência e harmonia.', 'Descarregar cores'),
    chapterHeading('Cores da marca', '(5 cores)'),
    chapterBody([column([palette([
        { name: 'Gradiente', value: C.indigo, image: `${PRESETS}/brivio-gradient-portrait.jpg`, gradientStops: [C.pink, C.magenta, C.indigo, C.green] },
        { name: 'Rosa', value: C.pink },
        { name: 'Magenta', value: C.magenta },
        { name: 'Índigo', value: C.indigo },
        { name: 'Verde', value: C.green },
    ], { layout: 'accordion', gapHorizontal: 12, radius: 20, styles: { radius: 20 }, customHeight: 480 })])]),
    chapterHeading('Cores neutras', '(3 cores)'),
    chapterBody([column([palette([
        { name: 'Preto', value: '#000000' },
        { name: 'Preto suave', value: '#1C1C1C' },
        { name: 'Cinza', value: '#808080' },
    ], { layout: 'grid', columns: 3, gapHorizontal: 16, radius: 16, styles: { radius: 16, borderWidth: 0 }, borderWidth: 0 })])]),
    ...navigation(),
)

const typeface = (family: string, fontFamily: string, weight: number, styles: string, use: string) => chapterBody([
    column([heading('Aa', 260, { fontFamily, fontWeight: weight, letterSpacing: '-0.05em' })], { alignVertical: 'middle' }),
    column([
        heading(family, 56, { fontFamily, fontWeight: weight }),
        text(styles, 15),
        text('ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 !?&@', 24, { color: C.text, fontFamily, whiteSpace: 'pre-line', lineHeight: 1.35 }),
        text(use, 15),
    ], { alignVertical: 'middle' }),
], [1, 1.4])

const TYPOGRAPHY = page(
    topBar(true),
    pageHero('Tipografia', 'A tipografia dá voz à marca.', 'A escolha das fontes e da hierarquia exprime a personalidade da Brivio, do forte ao sereno. Esta secção mostra como usar o tipo com clareza e consistência.', 'Descarregar fontes'),
    chapterHeading('Tipo de letra principal', '(2 estilos)'),
    typeface('Inter Tight', DISPLAY_FONT, 600, 'SemiBold · Medium', 'Usada em títulos, números e destaques.'),
    chapterHeading('Tipo de letra secundário', '(2 estilos)'),
    typeface('Inter', TEXT_FONT, 400, 'Regular · Medium', 'Usada no texto corrido, legendas e interface.'),
    ...navigation(),
)

const IMAGERY = page(
    topBar(true),
    pageHero('Imagem', 'As imagens contam a história da marca.', 'Esta secção define o aspeto da fotografia e dos mockups da Brivio — composição, luz e emoção — para que cada imagem esteja alinhada com a identidade da marca.', 'Descarregar imagens'),
    chapterHeading('Estilo de imagem', '(6 imagens)'),
    chapterBody([column([gallery([1, 2, 3, 4, 5, 6].map(i => `${ASSETS}/imagery-${i}.jpg`), 3, '4/5')])]),
    ...navigation(),
)

const ASSETS_PAGE = page(
    topBar(true),
    pageHero('Recursos', 'Os recursos são a base da comunicação.', 'Dão vida à linguagem visual da Brivio. Esta secção mostra como usá-los para manter tudo coeso e fiel à marca.', 'Descarregar recursos'),
    chapterHeading('Aplicações', '(3 aplicações)'),
    chapterBody([column([gallery([1, 2, 3].map(i => `${ASSETS}/application-${i}.jpg`), 3, '4/5')])]),
    chapterHeading('Publicações sociais', '(6 publicações)'),
    chapterBody([column([gallery([1, 2, 3, 4, 5, 6].map(i => `${ASSETS}/post-${i}.jpg`), 3, '4/5')])]),
    chapterHeading('Gradientes', '(2 gradientes)'),
    chapterBody([column([gallery([`${PRESETS}/brivio-gradient.jpg`, `${PRESETS}/brivio-gradient-portrait.jpg`], 2, '4/3')])]),
    ...navigation(),
)

export const BRIVIO_BRANDBOOK_TEMPLATE = {
    id: 'tpl_brivio_brand_book',
    name: 'Guidy',
    description: 'Guia de marca escuro e minimalista, com capítulos numerados e navegação inteligente — preenchido com o logótipo, as cores, a tipografia e a imagem da Brivio.',
    category: 'minimalist' as const,
    categoryLabel: 'Editorial & Minimal',
    tags: ['Brivio', 'Minimal', 'Escuro', 'Guia de marca'],
    accentColor: C.pink,
    gradient: 'linear-gradient(135deg, #94007C 0%, #FF0054 35%, #390099 65%, #06D6A0 100%)',
    thumbnail_url: `${ASSETS}/application-2.jpg`,
    is_public: true,
    modules_json: [
        { title: 'Brand Book', type: 'mission', category: 'overview', content_json: HOME },
        { title: 'Introdução', type: 'mission', category: 'overview', content_json: INTRODUCTION },
        { title: 'Logótipo', type: 'logo', category: 'visual_identity', content_json: LOGO },
        { title: 'Cores', type: 'palette', category: 'visual_identity', content_json: COLORS },
        { title: 'Tipografia', type: 'typography', category: 'visual_identity', content_json: TYPOGRAPHY },
        { title: 'Imagem', type: 'photography', category: 'visual_identity', content_json: IMAGERY },
        { title: 'Recursos', type: 'custom', category: 'visual_identity', content_json: ASSETS_PAGE },
    ],
}

// Sample photos become the Brivio placeholders, one per page in turn (cover sections keep their artwork)
BRIVIO_BRANDBOOK_TEMPLATE.modules_json = BRIVIO_BRANDBOOK_TEMPLATE.modules_json.map((m, i) => ({ ...m, content_json: withPlaceholder(m.content_json, placeholderAt(i)) }))
