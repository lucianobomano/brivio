/**
 * "Antimatéria": built-in brandbook template, dark and cinematic. Full-screen cover with an animated
 * layer and grain, texts that light up as they are read, pinned sections (a sideways rail of applications,
 * steps that change as you scroll), images revealed by masks, magnetic buttons and fields of brand shapes.
 * Every part is plain editor data (sections → columns → blocks) built with the editor's own blocks, so
 * everything stays editable. The scroll effects play in Preview and on the shared link.
 */

import { createColorAccordionContent } from "@/components/brandbook/editor/blocks/colorAccordion"
import { createFooterContent, type FooterColumn } from "@/components/brandbook/editor/blocks/footer"
import { brivioLogoVersions, createLogoShowcaseContent } from "@/components/brandbook/editor/blocks/logoShowcase"
import { createLogoSizeContent } from "@/components/brandbook/editor/blocks/logoSize"
import { createLogoMisuseContent, misuseCard, type MisuseCard } from "@/components/brandbook/editor/blocks/logoMisuse"
import { createTypeSpecimenContent } from "@/components/brandbook/editor/blocks/typeSpecimen"
import { createPhotoGradeContent } from "@/components/brandbook/editor/blocks/photoGrade"
import { brivioSymbol } from "@/components/brandbook/editor/blocks/brivioSymbol"
import type { MotifFieldSettings } from "@/components/brandbook/editor/blocks/motifField"
import type { CoverSettings } from "@/components/brandbook/editor/cover"
import { placeholderAt, withPlaceholder } from "@/components/brandbook/editor/placeholders"

type Json = Record<string, unknown>
interface TemplateBlock { id: string, type: string, variant?: string, content: Json }
interface TemplateColumn { id: string, blocks: TemplateBlock[], settings: Json }
type Align = 'left' | 'center' | 'right'

// Ids only need to be unique inside the template: they are regenerated when blocks are copied
let seq = 0
const uid = () => `am${(++seq).toString(36)}`

const COVERS = '/brandbook/presets/covers'
const ASSETS = '/brandbook/templates/brivio'
const IMG = (name: string) => `${COVERS}/${name}.webp`

const C = {
    bg: '#050505',
    panel: '#0C0C0E',
    line: 'rgba(255,255,255,0.10)',
    text: '#F4F4F2',
    muted: '#8C8C90',
    dim: 'rgba(244,244,242,0.38)',
    pink: '#FF0054',
    magenta: '#9E0059',
    indigo: '#390099',
    green: '#06D6A0',
}
const BRIVIO = [C.pink, C.magenta, C.indigo, C.green]
const DISPLAY = "var(--font-inter-tight), 'Inter Tight', sans-serif"
const BODY = "var(--font-inter), 'Inter', sans-serif"
const MONO = 'Space Mono'
const ZERO = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }

// ---------- Blocks ----------

const heading = (value: string, size: number, style: Json = {}): TemplateBlock => ({
    id: uid(), type: 'heading',
    content: { text: value, style: { fontSize: `${size}px`, color: C.text, fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.045em', lineHeight: '0.95', ...style } },
})

const text = (value: string, size = 17, style: Json = {}): TemplateBlock => ({
    id: uid(), type: 'text',
    content: { text: value, style: { fontSize: `${size}px`, color: C.muted, fontFamily: BODY, lineHeight: '1.6', ...style } },
})

/** Small uppercase label in mono: "(01) Manifesto" */
const meta = (value: string, style: Json = {}) =>
    text(value, 11, { fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.16em', lineHeight: '1.6', color: C.dim, ...style })

const image = (url: string, style: Json = {}): TemplateBlock => ({
    id: uid(), type: 'image', content: { url, caption: '', style: { radius: 18, ...style } },
})

const gallery = (urls: string[], columns: number, aspectRatio: string): TemplateBlock => ({
    id: uid(), type: 'gallery',
    content: { items: urls.map(url => ({ url, caption: '' })), style: { galleryType: 'grid', columns, aspectRatio, radius: 18, imageRadius: 18 } },
})

const button = (label: string): TemplateBlock => ({
    id: uid(), type: 'button',
    content: {
        text: label,
        style: {
            backgroundColor: C.text, color: C.bg, borderWidth: 0,
            width: '220px', height: '52px', fontSize: '15px', borderRadius: '9999px', textAlign: 'center', fontWeight: 500,
        },
    },
})

const download = (title: string, type: string, filesize: string): TemplateBlock => ({
    id: uid(), type: 'download',
    content: {
        url: '', title, type, filesize,
        style: {
            backgroundColor: C.panel, textColor: C.text, metaColor: C.muted, borderColor: C.line,
            iconBgColor: C.pink, iconColor: '#FFFFFF', buttonBgColor: C.text, buttonTextColor: C.bg,
            buttonBorderColor: C.text, borderRadius: 18, hoverEffect: 'lift', hoverIconEffect: 'drop',
        },
    },
})

const doDont = (dos: string[], donts: string[]): TemplateBlock => ({
    id: uid(), type: 'list', variant: 'do-dont',
    content: { items: [...dos.map(x => ({ text: x, type: 'do' })), ...donts.map(x => ({ text: x, type: 'dont' }))] },
})

/** Field of brand shapes that grow in and part around the pointer (brand colours from Settings) */
const motif = (settings: MotifFieldSettings): TemplateBlock => ({ id: uid(), type: 'motif-field', content: { settings } })

/** The block plays one of the editor's animations: entrances, 'acender' (lights up while read), masks, magnetic */
const anim = (b: TemplateBlock, animation: string, delay = 0): TemplateBlock => ({
    ...b, content: { ...b.content, animation, animationSettings: { delay } },
})

/** Chapter taglines, keyed by page title (the index matches pages by id or title) */
const CHAPTERS: Record<string, string> = {
    'Introdução': 'Porque existimos e como falamos.',
    'Logótipo': 'O símbolo, a sua construção e os seus limites.',
    'Cores': 'Quatro cores, uma energia.',
    'Tipografia': 'A voz da marca, letra a letra.',
    'Iconografia': 'Pequenos sinais, a mesma precisão.',
    'Fotografia': 'Luz, matéria e movimento.',
    'Recursos': 'Tudo o que precisa para começar.',
}

/** Live index of the chapters (pages mode: follows renames and new pages) */
const chapterIndex = (titleSize: number): TemplateBlock => ({
    id: uid(), type: 'index',
    content: {
        items: [],
        settings: {
            source: 'pages', includeCurrentPage: false, excludedPages: ['Antimatéria'], pageDescriptions: CHAPTERS,
            style: 'list', titleSize,
            accentColor: C.pink, textColor: C.text, mutedColor: C.dim,
            hoverBackground: '#111113', dividerColor: C.line,
        },
    },
})

// ---------- Columns / sections ----------

const column = (blocks: TemplateBlock[], settings: Json = {}): TemplateColumn => ({
    id: uid(), blocks, settings: { alignHorizontal: 'left', alignVertical: 'top', blockGap: 20, padding: ZERO, ...settings },
})

/** A row of small columns inside a column (meta bars, steps, specs): a native layout block */
const row = (cols: TemplateBlock[][], opts: { widths?: number[], gap?: number, align?: Align[], valign?: 'top' | 'middle' | 'bottom', itemGap?: number } = {}): TemplateBlock => ({
    id: uid(), type: 'layout', variant: `${cols.length}-col`,
    content: {
        columns: cols.map((blocks, i) => ({
            id: uid(), blocks,
            settings: { padding: ZERO, blockGap: opts.itemGap ?? 8, alignHorizontal: opts.align?.[i] || 'left', alignVertical: opts.valign || 'top' },
        })),
        settings: {
            columns: cols.length, columnWidths: opts.widths || Array(cols.length).fill(1), columnGap: opts.gap ?? 32,
            padding: ZERO, height: 'fit', alignVertical: 'top', alignHorizontal: 'left',
        },
    },
})

/** Blocks kept together as one block (one step of a pinned section, one card of a rail) */
const stack = (blocks: TemplateBlock[], gap = 14, align: Align = 'left') => row([blocks], { itemGap: gap, align: [align] })

interface SectionOptions {
    widths?: number[]
    gap?: number
    top?: number
    bottom?: number
    x?: number
    background?: string
    valign?: 'top' | 'middle' | 'bottom'
    extra?: Json
}

/** Section whose padding (Edit section) sets the margins; the content fills the room left */
const section = (columns: TemplateColumn[], o: SectionOptions = {}): TemplateBlock => ({
    id: uid(), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length,
            columnWidths: o.widths || Array(columns.length).fill(1),
            padding: ZERO,
            sectionPadding: { isLocked: false, top: o.top ?? 120, right: o.x ?? 72, bottom: o.bottom ?? 120, left: o.x ?? 72 },
            columnGap: o.gap ?? 64,
            contentWidth: 'fluid',
            backgroundType: 'color',
            backgroundColor: o.background || C.bg,
            alignHorizontal: 'left',
            alignVertical: o.valign || 'top',
            height: 'fit',
            ...o.extra,
        },
    },
})

/** Full-screen cover (100vh) with an animated layer behind it */
const cover = (columns: TemplateColumn[], fx: CoverSettings, extra: Json = {}): TemplateBlock => ({
    id: uid(), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length, columnWidths: Array(columns.length).fill(1),
            // The section padding (Edit section) holds the spacing: changing it moves the whole content
            height: '100vh', sectionPadding: { isLocked: false, top: 40, right: 56, bottom: 40, left: 56 }, padding: ZERO, columnGap: 0,
            alignVertical: 'top', alignHorizontal: 'left', isFullWidth: false, contentWidth: 'fluid', isCover: true,
            backgroundType: 'color', backgroundColor: C.bg,
            cover: fx,
            ...extra,
        },
    },
})

/** Cover column: full height, its groups spread from top to bottom */
const coverColumn = (blocks: TemplateBlock[], align: Align = 'left'): TemplateColumn => column(blocks, {
    heightMode: 'fill', contentDistribution: 'between', alignHorizontal: align,
    padding: ZERO, blockGap: 24,
})

/** Edge-to-edge section holding one block that draws its own spacing */
const bare = (blocks: TemplateBlock[], background = C.bg, extra: Json = {}) => section([column(blocks, { blockGap: 0 })], {
    top: 0, bottom: 0, x: 0, gap: 0, background, extra: { isFullWidth: true, ...extra },
})

// ---------- Recurring parts ----------

const metaBar = (items: string[]) =>
    row(items.map(i => [meta(i)]), { align: items.map((_, i) => i === 0 ? 'left' : i === items.length - 1 ? 'right' : 'center') })

/** Page opening: full-screen title over a slow animated layer, the chapter number and a scroll cue */
const chapterCover = (number: string, title: string, lead: string, fx: CoverSettings) => cover([
    coverColumn([
        metaBar([`(${number}) ${title}`, 'Brivio° — Antimatéria', 'Edição 2026']),
        stack([
            anim(heading(title, 168, { letterSpacing: '-0.06em', lineHeight: '0.88' }), 'ascender'),
            anim(text(lead, 22, { color: C.text, maxWidth: '620px', lineHeight: '1.45' }), 'ascender', 0.2),
        ], 28),
        metaBar(['Manual de identidade', '↓ Role para continuar']),
    ]),
], { grain: 20, vignette: 50, ...fx })

/** Section heading: mono label + title on the left, a short text on the right */
const sectionHeading = (label: string, title: string, body: string) => row([
    [meta(label, { color: C.pink }), anim(heading(title, 64), 'ascender')],
    [anim(text(body, 17), 'ascender', 0.15)],
], { widths: [1.3, 1], gap: 64, valign: 'bottom', itemGap: 20 })

/** A long text that lights up word by word as it is read */
const manifesto = (label: string, value: string, size = 52) => section([
    column([meta(label, { color: C.pink }), anim(heading(value, size, { lineHeight: '1.08', letterSpacing: '-0.035em' }), 'acender')], { blockGap: 32 }),
], { top: 160, bottom: 160 })

/** Footer of every page: brand, the live list of pages and contacts, plus a giant wordmark */
const FOOTER_COLUMNS: Partial<FooterColumn>[] = [
    { kind: 'brand', showMark: true, name: 'Brivio°', tagline: 'Marcas com matéria própria.', width: 1.4 },
    { kind: 'pages', title: 'Capítulos', pageFrom: 1, pageTo: 4 },
    { kind: 'pages', title: '', pageFrom: 5 },
    { kind: 'links', title: 'Contacto', align: 'right', links: [
        { id: uid(), label: 'brand@brivio.com', target: { type: 'url', url: 'mailto:brand@brivio.com' } },
        { id: uid(), label: 'Voltar ao topo ↑', target: { type: 'top' } },
    ] },
]
const footer = () => bare([{
    id: uid(), type: 'footer',
    content: createFooterContent(FOOTER_COLUMNS.map(c => ({ ...c, id: uid() })), {
        backgroundColor: C.bg, textColor: C.text, mutedColor: C.muted, borderColor: C.line, accentColor: C.pink,
        font: 'sans', uppercase: false, letterSpacing: 0, linkSize: 15, titleSize: 11, bodySize: 15, brandSize: 18,
        showWordmark: true, wordmarkSize: 220, showBottomBar: true,
    }) as unknown as Json,
}], C.bg, { isFullHeight: true })

const nextChapter = () => section([
    column([meta('Índice', { color: C.pink }), chapterIndex(56)], { blockGap: 28 }),
], { top: 140, bottom: 80 })

const page = (...sections: (TemplateBlock | TemplateBlock[])[]) => ({ blocks: [...sections.flat(), nextChapter(), footer()] })

/** A pinned section that steps through `steps` (left) while the visual on the right changes with them */
const stages = (steps: { title: string, body: string }[], visuals: TemplateBlock[]) => section([
    column(steps.map((s, i) => stack([
        meta(String(i + 1).padStart(2, '0'), { color: C.pink }),
        heading(s.title, 44),
        text(s.body, 17, { maxWidth: '440px' }),
    ], 14)), { blockGap: 56, alignVertical: 'middle' }),
    column(visuals, { alignVertical: 'middle', alignHorizontal: 'center' }),
], { widths: [1, 1.15], gap: 80, top: 0, bottom: 0, valign: 'middle', extra: { scrollEffect: 'stages' } })

/** A pinned section whose columns slide sideways as cards while scrolling */
const rail = (intro: TemplateBlock[], cards: { url: string, label: string, title: string }[], cardWidth = 32) => section([
    column(intro, { alignVertical: 'bottom', blockGap: 20 }),
    ...cards.map(c => column([
        image(c.url, { aspectRatio: '4/5', objectFit: 'cover', radius: 22 }),
        meta(c.label),
        heading(c.title, 26, { letterSpacing: '-0.02em', lineHeight: '1.1' }),
    ], { blockGap: 14 })),
], { gap: 28, top: 0, bottom: 0, x: 72, valign: 'middle', extra: { scrollEffect: 'rail', railCardWidth: cardWidth } })

// =====================================================================================================
// Pages
// =====================================================================================================

const HOME = page(
    cover([
        coverColumn([
            metaBar(['Brand book', 'Antimatéria', 'v. 1.0 — 2026']),
            stack([
                anim({ ...image(brivioSymbol(), { width: 88, radius: 0 }) }, 'magnetico'),
                anim(heading('Brivio°', 260, { letterSpacing: '-0.07em', lineHeight: '0.82', textAlign: 'center' }), 'ascender'),
                anim(text('Um manual de marca feito de luz, matéria e movimento.', 20, { color: C.text, textAlign: 'center' }), 'ascender', 0.25),
            ], 32, 'center'),
            metaBar(['Manual de identidade', '(00) Capa', '↓ Role para começar']),
        ], 'center'),
    ], {
        effect: 'aurora', colors: BRIVIO, speed: 0.6, intensity: 55, scale: 55, interactive: true, mouseStrength: 45,
        effectOpacity: 45, blend: 'screen', blur: 70, spotlight: true, spotlightColor: C.pink, spotlightOpacity: 22,
        grain: 24, grainAnimated: true, vignette: 60,
    }),
    bare([motif({ shape: 'petal', arrangement: 'band', density: 64, size: 46, variation: 70, height: 380, grow: 'scroll', cursor: 'part', cursorStrength: 60, seed: 21 })]),
    manifesto('(01) Manifesto', 'Uma marca não é um logótipo. É a soma de tudo o que as pessoas sentem quando a encontram — a luz, o ritmo, a voz e o silêncio entre as coisas. Este manual guarda essa matéria.'),
    section([
        column([sectionHeading('(02) Princípios', 'Três forças\nque nos movem.', 'Antes das regras, os princípios. São eles que decidem quando a regra não chega.')]),
    ], { bottom: 48 }),
    section([
        ['Precisão', 'Cada pixel tem uma razão. Medimos, alinhamos e voltamos a medir — o rigor é a nossa forma de respeito.'],
        ['Energia', 'A cor e o movimento existem para dar vida. Nada é decorativo: tudo empurra a mensagem para a frente.'],
        ['Clareza', 'Dizemos menos, melhor. Se uma ideia precisa de explicação, ainda não está pronta.'],
    ].map(([title, body], i) => column([
        anim(meta(`0${i + 1}`, { color: C.pink }), 'ascender', i * 0.12),
        anim(heading(title, 40), 'ascender', i * 0.12),
        anim(text(body, 16), 'ascender', 0.1 + i * 0.12),
    ], { blockGap: 16, padding: { isLocked: false, top: 28, right: 0, bottom: 0, left: 0 } })), { top: 0, gap: 40 }),
    rail([
        meta('(03) Aplicações', { color: C.pink }),
        heading('A marca\nno mundo.', 72),
        text('Role para percorrer: cada cartão é uma aplicação real da identidade.', 16, { maxWidth: '320px' }),
    ], [
        { url: `${ASSETS}/application-1.jpg`, label: 'Digital', title: 'Plataforma e produto' },
        { url: `${ASSETS}/application-2.jpg`, label: 'Editorial', title: 'Apresentações' },
        { url: `${ASSETS}/application-3.jpg`, label: 'Espaço', title: 'Sinalética e eventos' },
        { url: `${ASSETS}/post-1.jpg`, label: 'Social', title: 'Publicações' },
        { url: `${ASSETS}/post-4.jpg`, label: 'Campanha', title: 'Comunicação' },
    ]),
    stages([
        { title: 'Descobrir', body: 'Ouvimos a marca antes de a desenhar: pessoas, mercado e a verdade que a torna única.' },
        { title: 'Definir', body: 'Transformamos a estratégia em princípios claros, num território visual e numa voz.' },
        { title: 'Desenhar', body: 'Símbolo, cor, tipo e imagem nascem juntos, pensados como um único sistema.' },
        { title: 'Viver', body: 'O sistema ganha vida em cada ponto de contacto — e este manual mantém-no coerente.' },
    ], [IMG('crystal-hero'), IMG('violet-fluid'), IMG('prism-corridor'), IMG('spectrum-rays')].map(url => image(url, { aspectRatio: '4/5', objectFit: 'cover', radius: 24 }))),
    manifesto('(04) Visão', '«Queremos que cada pessoa que toca na marca sinta a mesma energia — num ecrã, num cartaz ou numa conversa.»', 44),
)

const INTRODUCTION = page(
    chapterCover('01', 'Introdução', 'Porque existimos, para quem trabalhamos e como falamos.', { effect: 'mesh', colors: [C.indigo, C.magenta, '#000000'], speed: 0.5, effectOpacity: 60, interactive: true }),
    manifesto('Propósito', 'Existimos para dar às marcas um lugar onde a sua identidade vive inteira — organizada, partilhável e sempre atual.'),
    section([
        column([anim(image(IMG('dune-portal'), { aspectRatio: '4/5', objectFit: 'cover', radius: 24 }), 'mascara_arco')]),
        column([
            meta('Missão', { color: C.pink }),
            anim(heading('Tornar cada marca\nfácil de usar bem.', 56), 'ascender'),
            anim(text('Equipas mudam, agências entram e saem, canais multiplicam-se. A marca tem de chegar a todos da mesma forma: clara, bonita e sem margem para dúvidas.', 17), 'ascender', 0.15),
            anim(button('Conhecer a equipa'), 'magnetico'),
        ], { alignVertical: 'middle', blockGap: 24 }),
    ], { widths: [1, 1], gap: 80, valign: 'middle' }),
    section([
        column([sectionHeading('Tom de voz', 'Falamos como\npensamos.', 'Direto, caloroso e preciso. Nunca frio, nunca exagerado.')], { blockGap: 40 }),
    ], { bottom: 40 }),
    section([
        column([doDont(
            ['Frases curtas e ativas.', 'Explicar o porquê, não só o quê.', 'Tratar as pessoas por tu, com respeito.'],
            ['Jargão técnico sem necessidade.', 'Superlativos vazios («o melhor do mundo»).', 'Pontos de exclamação em série.'],
        )]),
    ], { top: 0 }),
    section([
        ['+120', 'marcas organizadas'],
        ['24 h', 'para pôr um manual online'],
        ['1', 'fonte de verdade'],
    ].map(([value, label], i) => column([
        anim(heading(value, 96, { letterSpacing: '-0.05em' }), 'ascender', i * 0.1),
        meta(label),
    ], { blockGap: 12 })), { top: 40, gap: 40 }),
)

const LOGO = page(
    chapterCover('02', 'Logótipo', 'O símbolo é a assinatura da marca. Desenhado uma vez, usado sempre igual.', { effect: 'liquid', colors: BRIVIO, speed: 0.5, intensity: 40, effectOpacity: 35, blend: 'screen' }),
    section([
        column([
            sectionHeading('Versões', 'Um símbolo,\nvárias peles.', 'Escolha a versão pelo fundo: o gradiente em preto, a versão a uma cor quando a cor não é possível.'),
            { id: uid(), type: 'logo-showcase', content: createLogoShowcaseContent(brivioLogoVersions(), {}) as unknown as Json },
        ], { blockGap: 56 }),
    ]),
    stages([
        { title: 'Grelha', body: 'O símbolo assenta numa grelha de 8 × 8 módulos: todas as curvas partem dela.' },
        { title: 'Proporção', body: 'Anel e núcleo mantêm a proporção 1 : 0,62. Nunca se ajusta à mão.' },
        { title: 'Zona de segurança', body: 'À volta do símbolo fica sempre livre a altura do núcleo. Nada entra nesse espaço.' },
        { title: 'Assinatura', body: 'Com o nome, o símbolo vem à esquerda, alinhado pela linha de base do texto.' },
    ], [
        image(brivioSymbol('#2A2A2E'), { width: 360, radius: 0 }),
        image(brivioSymbol(C.indigo), { width: 360, radius: 0 }),
        image(brivioSymbol(), { width: 300, radius: 0 }),
        image(`${ASSETS}/logo-dark.png`, { width: 420, radius: 0 }),
    ]),
    section([
        column([
            sectionHeading('Tamanho mínimo', 'Pequeno,\nnunca ilegível.', 'Arraste para ver onde o símbolo deixa de funcionar. Abaixo do mínimo, use apenas o símbolo sem o nome.'),
            { id: uid(), type: 'logo-size', content: createLogoSizeContent(undefined, {}) as unknown as Json },
        ], { blockGap: 56 }),
    ], { top: 40 }),
    section([
        column([
            sectionHeading('Usos incorretos', 'Nunca faça isto.', 'O símbolo só funciona exatamente como foi desenhado.'),
            {
                id: uid(), type: 'logo-misuse',
                content: createLogoMisuseContent(
                    (['stretch', 'rotate', 'recolor', 'shadow', 'outline', 'busy'] as MisuseCard['effect'][]).map(e => misuseCard(e)),
                    { columns: 3, mark: 'slash', markOn: 'hover', numbered: true, previewHeight: 180, logoSize: 64, title: '' },
                ) as unknown as Json,
            },
        ], { blockGap: 56 }),
    ], { top: 40 }),
)

const COLORS = page(
    chapterCover('03', 'Cores', 'Quatro cores, uma energia. O rosa lidera; o índigo dá profundidade.', { effect: 'fluid', colors: BRIVIO, speed: 0.7, intensity: 60, effectOpacity: 55, interactive: true, mouseStrength: 60 }),
    section([
        column([
            sectionHeading('Paleta', 'As cores\nda marca.', 'Abra cada cartão para ver os códigos, os tons e o contraste. Clique num código para o copiar.'),
            // No colours of its own: shows (and follows) the brand colours from Settings → Colors
            { id: uid(), type: 'color-accordion', content: createColorAccordionContent(undefined, { showHeader: false, paddingX: 0, paddingY: 0, maxWidth: 0, background: C.bg, text: C.text, muted: C.muted, reveal: 'blur', radius: 28 }) as unknown as Json },
        ], { blockGap: 64 }),
    ]),
    bare([motif({ shape: 'circle', arrangement: 'scatter', density: 80, size: 30, variation: 80, height: 420, grow: 'scroll', cursor: 'part', cursorStrength: 70, seed: 3 })]),
    manifesto('Proporção', 'Preto em quase tudo, rosa onde é preciso agir, índigo para dar fundo — e o verde só quando há uma boa notícia.', 44),
    section([
        column([anim(image(`${ASSETS}/app-icon-gradient.jpg`, { aspectRatio: '1/1', objectFit: 'cover', radius: 28 }), 'mascara_circulo')]),
        column([
            meta('Gradiente', { color: C.pink }),
            anim(heading('O gradiente\né um momento.', 56), 'ascender'),
            anim(text('Reservado a capas, aberturas e peças especiais. Nunca em texto corrido nem em fundos de interface.', 17), 'ascender', 0.15),
        ], { alignVertical: 'middle' }),
    ], { widths: [1, 1], gap: 80, valign: 'middle' }),
)

const TYPOGRAPHY = page(
    chapterCover('04', 'Tipografia', 'Inter Tight para dizer, Inter para explicar. Uma família, duas vozes.', { effect: 'waves', colors: [C.indigo, C.pink], speed: 0.4, effectOpacity: 30 }),
    section([
        column([{
            id: uid(), type: 'type-specimen',
            content: createTypeSpecimenContent({
                fontFamily: 'Inter Tight', glyph: 'A', heroWeight: 500, accent: C.pink,
                background: C.bg, surface: C.panel, border: '#1E1E22', text: C.text, muted: C.muted,
                tag: '(04) Tipografia', eyebrow: '01 · Família principal', title: 'Inter Tight,\nprecisa e humana.',
                description: 'Desenhada para ecrãs, apertada nos títulos e generosa no texto. A mesma voz no produto, no site e no papel.',
                testerText: 'Marcas com matéria própria.', paddingX: 0, paddingY: 0, maxWidth: 0,
            }) as unknown as Json,
        }], { blockGap: 0 }),
    ], { top: 96, bottom: 96 }),
    manifesto('Hierarquia', 'Títulos grandes e apertados, texto calmo e espaçado, legendas em mono. Três níveis chegam para quase tudo.', 44),
    section([
        [MONO, 'Mono', 'Legendas, números e etiquetas. Sempre em maiúsculas, com espaço entre letras.'],
        ['Inter Tight', 'Display', 'Títulos e frases curtas. Peso 500, entrelinha 0,95, espaço −4,5 %.'],
        ['Inter', 'Texto', 'Parágrafos e interface. Peso 400, 16–18 px, entrelinha 1,6.'],
    ].map(([font, label, body], i) => column([
        meta(String(label), { color: C.pink }),
        anim(heading('Aa', 120, { fontFamily: String(font), letterSpacing: font === MONO ? '0' : '-0.05em' }), 'mascara', i * 0.1),
        text(String(body), 15),
    ], { blockGap: 16, padding: { isLocked: false, top: 28, right: 0, bottom: 0, left: 0 } })), { top: 0, gap: 40 }),
)

/** Icon specimen + a closing row with the icon pack download */
const ICON_SET = ['sparkles', 'palette', 'pen-tool', 'layers', 'image', 'camera', 'star', 'heart', 'share', 'download', 'eye', 'zap']
const ICONS = page(
    chapterCover('05', 'Iconografia', 'Pequenos sinais, a mesma precisão do símbolo.', { effect: 'mesh', colors: [C.pink, C.indigo, '#000000'], speed: 0.4, effectOpacity: 40 }),
    section([
        column([
            {
                id: uid(), type: 'icon-specimen',
                content: {
                    icons: ICON_SET,
                    specs: [
                        { id: uid(), label: 'Grelha', value: '24 × 24 px' },
                        { id: uid(), label: 'Área útil', value: '20 × 20 px' },
                        { id: uid(), label: 'Traço', value: '{weight} px' },
                        { id: uid(), label: 'Cantos', value: '{corners}' },
                    ],
                    settings: {
                        background: C.bg, surface: C.panel, border: '#1E1E22', text: C.text, muted: C.muted, accent: C.pink,
                        iconColor: C.text, palette: [C.text, C.pink, C.indigo, C.green], heroIcon: 'sparkles', layout: 'centered',
                        tag: '(05) Iconografia', eyebrow: '01 · Sistema de ícones', title: 'Traço fino,\nideia clara.',
                        description: 'Ícones de traço em grelha de 24 px, cantos redondos e o mesmo peso em todo o conjunto.',
                        maxWidth: 0, paddingX: 0, paddingY: 0,
                    },
                },
            },
            row([
                [heading('Pack de ícones', 30, { letterSpacing: '-0.02em', lineHeight: '1.1' }), text('Todos os ícones em SVG e PNG, de 16 a 64 px. Use sempre os ficheiros originais: não redesenhe nem misture com outros conjuntos.', 15)],
                [download('Icon pack — Antimatéria', 'ZIP', '2.4 MB')],
            ], { gap: 64, valign: 'middle', itemGap: 12 }),
        ], { blockGap: 96 }),
    ], { top: 96 }),
)

const PHOTOGRAPHY = page(
    chapterCover('06', 'Fotografia', 'Luz que esculpe, matéria que se sente, movimento que respira.', { imageMotion: 'parallax', overlay: 'bottom', overlayColor: '#000000', overlayOpacity: 70 }),
    section([
        column([
            sectionHeading('Tratamento', 'Quente, suave,\nnunca saturada.', 'Arraste a linha para comparar a imagem original com o tratamento da marca.'),
            {
                id: uid(), type: 'photo-grade',
                content: createPhotoGradeContent({
                    image: IMG('amber-silk'), mode: 'compare', aspect: '16/9', radius: 24, showValues: true, showPalette: true,
                    palette: ['#FFB347', '#C2410C', '#5A1E0B', '#F4E6DA', '#120A06'],
                    text: C.text, muted: C.muted, accent: C.pink, border: C.line,
                }) as unknown as Json,
            },
        ], { blockGap: 56 }),
    ]),
    section([
        column([anim(image(IMG('crystal-prism'), { aspectRatio: '3/4', objectFit: 'cover', radius: 24 }), 'mascara')]),
        column([anim(image(IMG('violet-ribbon'), { aspectRatio: '3/4', objectFit: 'cover', radius: 24 }), 'mascara_arco', 0.1)], { padding: { isLocked: false, top: 120, right: 0, bottom: 0, left: 0 } }),
        column([anim(image(IMG('pink-spheres'), { aspectRatio: '3/4', objectFit: 'cover', radius: 24 }), 'mascara', 0.2)]),
    ], { top: 0, gap: 24 }),
    rail([
        meta('Série', { color: C.pink }),
        heading('Matéria\nem luz.', 72),
        text('Texturas, reflexos e cor em movimento: o universo visual por trás da marca.', 16, { maxWidth: '320px' }),
    ], [
        { url: IMG('spectrum-rays'), label: '01 — Luz', title: 'Raios de espectro' },
        { url: IMG('violet-fluid'), label: '02 — Fluido', title: 'Violeta em movimento' },
        { url: IMG('ice-crystal'), label: '03 — Cristal', title: 'Gelo e reflexo' },
        { url: IMG('dune-curve'), label: '04 — Forma', title: 'Curva de duna' },
        { url: IMG('red-hall'), label: '05 — Espaço', title: 'Sala vermelha' },
    ], 28),
    section([
        column([sectionHeading('Direção', 'O que procuramos.', 'Use como guia ao escolher, encomendar ou produzir imagens.')], { blockGap: 40 }),
    ], { bottom: 40 }),
    section([
        column([doDont(
            ['Luz natural ou rasante, com sombras suaves.', 'Texturas reais: tecido, vidro, pele, areia.', 'Espaço negativo para o texto respirar.'],
            ['Filtros saturados ou HDR exagerado.', 'Bancos de imagens genéricos e poses forçadas.', 'Fundos cheios atrás do logótipo.'],
        )]),
    ], { top: 0 }),
    section([column([gallery([1, 2, 3, 4, 5, 6].map(i => `${ASSETS}/imagery-${i}.jpg`), 3, '4/5')])], { top: 0 }),
)

const RESOURCES = page(
    chapterCover('07', 'Recursos', 'Tudo o que precisa para começar, num único lugar.', { effect: 'aurora', colors: BRIVIO, speed: 0.5, effectOpacity: 40, blend: 'screen' }),
    section([
        column([sectionHeading('Downloads', 'Leve a marca\nconsigo.', 'Ficheiros originais, sempre na versão mais recente. Em caso de dúvida, fale com a equipa de marca.')], { blockGap: 40 }),
    ], { bottom: 48 }),
    section([
        column([anim(download('Logótipo — todas as versões', 'ZIP', '8.6 MB'), 'ascender')]),
        column([anim(download('Paleta de cores', 'ASE', '12 KB'), 'ascender', 0.1)]),
        column([anim(download('Fontes da marca', 'ZIP', '3.1 MB'), 'ascender', 0.2)]),
    ], { top: 0, gap: 24 }),
    section([
        column([anim(download('Templates de apresentação', 'KEY', '24 MB'), 'ascender')]),
        column([anim(download('Kit para redes sociais', 'FIG', '16 MB'), 'ascender', 0.1)]),
        column([anim(download('Manual completo', 'PDF', '42 MB'), 'ascender', 0.2)]),
    ], { top: 0, gap: 24 }),
    bare([motif({ shape: 'symbol', arrangement: 'curtain', density: 28, size: 70, variation: 50, height: 460, grow: 'scroll', cursor: 'lean', cursorStrength: 60, seed: 11 })]),
    section([
        column([
            meta('Contacto', { color: C.pink }),
            anim(heading('Dúvidas sobre a marca?\nFale connosco.', 72, { textAlign: 'center' }), 'acender'),
            anim(button('Escrever à equipa'), 'magnetico'),
        ], { alignHorizontal: 'center', blockGap: 32 }),
    ], { top: 160, bottom: 160 }),
)

export const ANTIMATERIA_BRANDBOOK_TEMPLATE = {
    id: 'tpl_antimateria',
    name: 'Antimatéria',
    description: 'Guia de marca escuro e cinematográfico: capa animada com grão, textos que acendem ao ler, secções fixas que deslizam e mudam com o scroll, imagens reveladas por máscaras, botões magnéticos e campos de formas da marca.',
    category: 'agency' as const,
    categoryLabel: 'Agência & Imersivo',
    tags: ['Brivio', 'Escuro', 'Interativo', 'Scroll', 'Cinematográfico'],
    accentColor: C.pink,
    gradient: 'linear-gradient(135deg, #050505 0%, #390099 40%, #FF0054 75%, #06D6A0 100%)',
    thumbnail_url: IMG('crystal-hero'),
    is_public: true,
    modules_json: [
        { title: 'Antimatéria', type: 'mission', category: 'overview', content_json: HOME },
        { title: 'Introdução', type: 'mission', category: 'overview', content_json: INTRODUCTION },
        { title: 'Logótipo', type: 'logo', category: 'visual_identity', content_json: LOGO },
        { title: 'Cores', type: 'palette', category: 'visual_identity', content_json: COLORS },
        { title: 'Tipografia', type: 'typography', category: 'visual_identity', content_json: TYPOGRAPHY },
        { title: 'Iconografia', type: 'custom', category: 'visual_identity', content_json: ICONS },
        { title: 'Fotografia', type: 'photography', category: 'visual_identity', content_json: PHOTOGRAPHY },
        { title: 'Recursos', type: 'custom', category: 'visual_identity', content_json: RESOURCES },
    ],
}

// Sample photos become the Brivio placeholders, one per page in turn (cover sections keep their artwork)
ANTIMATERIA_BRANDBOOK_TEMPLATE.modules_json = ANTIMATERIA_BRANDBOOK_TEMPLATE.modules_json.map((m, i) => ({ ...m, content_json: withPlaceholder(m.content_json, placeholderAt(i)) }))
