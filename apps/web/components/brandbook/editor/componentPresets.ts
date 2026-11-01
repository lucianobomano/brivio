import { Block } from "./types"
import { DARK_INDEX_SETTINGS, DEFAULT_INDEX_ITEMS, IndexSettings } from "./blocks/IndexBlock"
import { createMarqueeContent, type MarqueeRow, type MarqueeSettings } from "./blocks/marquee"
import { brivioSymbol } from "./blocks/brivioSymbol"
import { ICON_SETS, ICON_SPECIMEN_DEFAULTS, createIconSpecimenContent, type IconSpecimenSettings } from "./blocks/iconSpecimen"
import { ACCORDION_DEFAULTS, accordionColorId, createColorAccordionContent, type AccordionColor, type ColorAccordionSettings } from "./blocks/colorAccordion"
import { SPECIMEN_DEFAULTS, createTypeSpecimenContent, type SpecimenLevel, type SpecimenWeight, type TypeSpecimenSettings } from "./blocks/typeSpecimen"
import { createLogoMisuseContent, misuseCard, type LogoMisuseSettings, type MisuseCard } from "./blocks/logoMisuse"
import { createLogoSizeContent, type LogoSizeSettings, type LogoSizeSpec } from "./blocks/logoSize"
import { createLogoShowcaseContent, brivioLogoVersions, logoVersionId, type LogoShowcaseSettings, type LogoVersion } from "./blocks/logoShowcase"
import { COVER_PRESETS } from "./coverPresets"
import { PHOTO_PRESETS } from "./photoPresets"
import { PHILOSOPHY_PRESETS } from "./philosophyPresets"
import { IDENTITY_PRESETS, IDENTITY_TOPICS } from "./identityPresets"
import { MOCKUP_PRESETS } from "./mockupPresets"
import { SOCIAL_PRESETS } from "./socialPresets"
import { hasSampleImage, placeholderAt, withPlaceholder } from "./placeholders"
import { createFooterContent, type FooterColumn, type FooterLinkTarget, type FooterSettings } from "./blocks/footer"

/**
 * Ready-made brandbook components. They are plain editor data (the same blocks, columns and
 * sections the editor creates), so once inserted every part stays editable like any other block.
 */

export type ComponentKind = 'section' | 'column' | 'block'

export type ComponentTopic =
    | 'cover'
    | 'index'
    | 'intro'
    | 'philosophy'
    | 'strategy'
    | 'logo'
    | 'color'
    | 'typography'
    | 'iconography'
    | 'voice'
    | 'mockups'
    | 'social'
    // verbal, visual and sensory chapters (identityPresets)
    | 'personality' | 'language' | 'slogans' | 'naming' | 'storytelling' | 'copywriting'
    | 'styleguide' | 'illustration' | 'grid' | 'graphics' | 'motion' | 'offline'
    | 'sound' | 'scent' | 'touch' | 'taste' | 'multisensory'
    | 'imagery'
    | 'marquee'
    | 'footer'

export const COMPONENT_TOPICS: { id: ComponentTopic, label: string }[] = [
    { id: 'cover', label: 'Capas' },
    { id: 'index', label: 'Índice' },
    { id: 'intro', label: 'Introdução' },
    { id: 'philosophy', label: 'Filosofia' },
    { id: 'strategy', label: 'Estratégia' },
    { id: 'logo', label: 'Logotipo' },
    { id: 'color', label: 'Cores' },
    { id: 'typography', label: 'Tipografia' },
    { id: 'iconography', label: 'Iconografia' },
    { id: 'voice', label: 'Tom de voz' },
    { id: 'mockups', label: 'Mockups e aplicações' },
    { id: 'social', label: 'Redes sociais' },
    ...IDENTITY_TOPICS,
    { id: 'imagery', label: 'Fotografia' },
    { id: 'marquee', label: 'Texto em loop' },
    { id: 'footer', label: 'Rodapé' },
]

export interface ColumnData {
    id: string
    blocks: Block[]
    settings?: Record<string, unknown>
}

export interface ComponentPreset {
    id: string
    name: string
    description: string
    kind: ComponentKind
    topic: ComponentTopic
    /** A section is a `layout` block, a column is ColumnData, a block is any other block */
    data: Block | ColumnData
}

// Ids are placeholders: every id is regenerated when a component is inserted
let seq = 0
const uid = (prefix: string) => `preset-${prefix}-${++seq}`

// ---------- Block factories ----------

const heading = (text: string, fontSize = 56, style: Record<string, unknown> = {}): Block => ({
    id: uid('b'), type: 'heading' as Block['type'], content: { text, style: { fontSize: `${fontSize}px`, ...style } },
})

const text = (value: string, fontSize = 18, style: Record<string, unknown> = {}): Block => ({
    id: uid('b'), type: 'text', content: { text: value, style: { fontSize: `${fontSize}px`, ...style } },
})

const label = (value: string, style: Record<string, unknown> = {}) =>
    text(value, 13, { textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, opacity: 0.6, ...style })

const image = (caption = ''): Block => ({ id: uid('b'), type: 'image', content: { url: '', caption } })

/** Brivio logo artwork (public/brandbook/presets) used by the logo and cover components */
export const BRIVIO_LOGOS = {
    main: '/brandbook/presets/brivio-logo.png',
    wordmark: '/brandbook/presets/brivio-wordmark.png',
    symbol: '/brandbook/presets/brivio-symbol.png',
    clearSpace: '/brandbook/presets/brivio-clearspace.png',
    white: '/brandbook/presets/brivio-logo-white.png',
}

const logo = (url: string, style: Record<string, unknown> = {}): Block => ({
    id: uid('b'), type: 'image', content: { url, caption: '', style },
})

const list = (items: string[]): Block => ({
    id: uid('b'), type: 'list', content: { items: items.map(t => ({ text: t, type: 'default' })) },
})

const doDont = (dos: string[], donts: string[]): Block => ({
    id: uid('b'), type: 'list', variant: 'do-dont',
    content: { items: [...dos.map(t => ({ text: t, type: 'do' })), ...donts.map(t => ({ text: t, type: 'dont' }))] },
})

type PresetColor = { name: string, value: string, image?: string, gradientStops?: string[] }

const palette = (colors: PresetColor[], settings: Record<string, unknown> = {}): Block => ({
    id: uid('b'), type: 'palette',
    content: {
        colors: colors.map(c => ({ id: uid('c'), ...c })),
        settings: { layout: 'grid', columns: Math.min(3, Math.max(1, colors.length)), ...settings },
    },
})

const story = (slides: { title: string, description: string }[]): Block => ({
    id: uid('b'), type: 'story',
    content: {
        slides: slides.map(s => ({ id: uid('s'), ...s })),
        settings: { autoplay: false, duration: 5, accentColor: '#FF0054', barColor: '#E2E8F0', buttonColor: '#FF0054', align: 'left' },
    },
})

const button = (value: string): Block => ({
    id: uid('b'), type: 'button',
    content: {
        text: value,
        style: { backgroundColor: '#000000', width: '180px', height: '44px', fontSize: '15px', color: '#ffffff', borderRadius: '9999px', textAlign: 'center', fontWeight: 500 },
    },
})

const index = (settings: IndexSettings = {}): Block => ({
    id: uid('b'), type: 'index',
    // Pages mode lists the brandbook's own pages; the sample items only draw the library thumbnail
    content: { items: DEFAULT_INDEX_ITEMS.map(item => ({ id: uid('i'), ...item })), settings: { source: 'pages', ...settings } },
})

const marquee = (rows: Partial<MarqueeRow>[], settings: MarqueeSettings = {}): Block => ({
    id: uid('b'), type: 'marquee' as Block['type'], content: { ...createMarqueeContent(rows, settings) },
})

const WORDS = ['Public', 'Unfinished', 'Precise']

// ---------- Column / section factories ----------

const column = (blocks: Block[], settings: Record<string, unknown> = {}): ColumnData => ({
    id: uid('col'), blocks, settings: { alignHorizontal: 'left', alignVertical: 'top', blockGap: 16, ...settings },
})

const section = (columns: ColumnData[], settings: Record<string, unknown> = {}, widths?: number[]): Block => ({
    id: uid('sec'), type: 'layout', variant: `${columns.length}-col`,
    content: {
        columns,
        settings: {
            columns: columns.length,
            columnWidths: widths || Array(columns.length).fill(1),
            padding: { isLocked: true, top: 24, right: 24, bottom: 24, left: 24 },
            sectionPadding: { isLocked: false, top: 80, right: 40, bottom: 80, left: 40 },
            backgroundType: 'color',
            columnGap: 32,
            ...settings,
        },
    },
})

/** Official Brivio gradient (public/brandbook/presets), shared by color components and covers */
export const BRIVIO_GRADIENT = {
    landscape: '/brandbook/presets/brivio-gradient.jpg',
    portrait: '/brandbook/presets/brivio-gradient-portrait.jpg',
}

/** Official Brivio colors */
const BRIVIO = { green: '#06D6A0', pink: '#FF0054', magenta: '#9E0059', indigo: '#390099', black: '#000000' }

const SOLID_COLORS: PresetColor[] = [
    { name: 'Verde', value: BRIVIO.green },
    { name: 'Rosa', value: BRIVIO.pink },
    { name: 'Magenta', value: BRIVIO.magenta },
    { name: 'Índigo', value: BRIVIO.indigo },
    { name: 'Preto', value: BRIVIO.black },
]

const BRAND_COLORS: PresetColor[] = [
    {
        name: 'Gradiente', value: BRIVIO.indigo, image: BRIVIO_GRADIENT.portrait,
        gradientStops: [BRIVIO.pink, BRIVIO.magenta, BRIVIO.indigo, BRIVIO.green],
    },
    ...SOLID_COLORS,
]

const LOREM = 'Substitua este texto pela descrição da sua marca. Mantenha frases curtas, claras e alinhadas com o tom de voz.'

// ---------- Logo showcase factories ----------

/** Logo showcase block (versions in tabs + clear space) */
const logoShowcase = (versions?: LogoVersion[], settings: LogoShowcaseSettings = {}): Block => ({
    id: uid('b'), type: 'logo-showcase' as Block['type'], content: { ...createLogoShowcaseContent(versions, settings) },
})

/** A version with the Brivio symbol (gradient when no `color`) on `background` */
const lv = (label: string, background: string, color?: string): LogoVersion => ({ id: logoVersionId(), label, url: brivioSymbol(color), background })

/** Logo size block (slider against the minimum / recommended size + spec sheet), with the Brivio symbol */
const logoSize = (settings: LogoSizeSettings = {}, specs?: LogoSizeSpec[]): Block => ({
    id: uid('b'), type: 'logo-size' as Block['type'], content: { ...createLogoSizeContent(specs, settings) },
})

/** Logo misuse block ("Never do this" cards), with the Brivio symbol */
const logoMisuse = (cards?: MisuseCard[], settings: LogoMisuseSettings = {}): Block => ({
    id: uid('b'), type: 'logo-misuse' as Block['type'], content: { ...createLogoMisuseContent(cards, settings) },
})

/** Light paper look of the misuse cards */
const MISUSE_LIGHT: LogoMisuseSettings = {
    titleColor: '#111114', descriptionColor: '#6B6B70', captionColor: '#55555B',
    cardBackground: '#FFFFFF', captionBackground: '#FFFFFF', previewBackground: '#F1EFEA', borderColor: '#E4E2DD',
    dontColor: '#E5383B', doColor: '#0F9D58',
}

// ---------- Type specimen factories ----------

/**
 * Type specimen section, built from native parts so everything is edited on its own:
 * - a row of two columns: the glyph with its guides (the specimen block, glyph only) and the texts —
 *   tag, eyebrow, title and description as text blocks, each with its toolbar;
 * - the weights and the hierarchy (the specimen block, without glyph);
 * - the weight tester (the specimen block, tester only).
 * Nothing has a fixed width: the section padding (Edit section) sets the margins and the parts fill the rest.
 */
const specimen = (settings: TypeSpecimenSettings = {}, weights?: SpecimenWeight[], levels?: SpecimenLevel[]): Block => {
    const look = { ...SPECIMEN_DEFAULTS, ...settings }
    const zero = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }
    const centered = look.layout === 'centered'
    const align = centered ? 'center' : 'left'
    const font = look.fontFamily
    const mono = { fontFamily: 'Space Mono', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.16em', lineHeight: '1.6', textAlign: align }

    /** The specimen block showing some of its parts, on the section's own background */
    const part = (parts: Partial<TypeSpecimenSettings>): Block => ({
        id: uid('b'), type: 'type-specimen' as Block['type'],
        content: { ...createTypeSpecimenContent({ ...settings, paddingX: 0, paddingY: 0, maxWidth: 0, background: 'transparent', ...parts }, weights, levels) },
    })

    const texts: Block[] = [
        ...(look.tag ? [text(look.tag, 11, { ...mono, color: look.text })] : []),
        ...(look.eyebrow ? [text(look.eyebrow, 11, { ...mono, color: look.accent })] : []),
        heading(look.title, 54, { fontFamily: font, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: '1.02', color: look.text, textAlign: align }),
        ...(look.description ? [text(look.description, 17, { fontFamily: font, lineHeight: '1.6', color: look.muted, textAlign: align, maxWidth: '440px' })] : []),
        text('\u200b', 1, { borderTop: `1px solid ${look.muted}`, width: '40px', lineHeight: '1px', height: '1px' }),
    ]
    const glyph = part({ showIntro: false, showWeights: false, showHierarchy: false, showTester: false })
    const textColumn = { id: uid('rc'), blocks: texts, settings: { padding: zero, blockGap: 18, alignHorizontal: align, alignVertical: 'middle' } }
    const glyphColumn = { id: uid('rc'), blocks: [glyph], settings: { padding: zero, blockGap: 0, alignHorizontal: 'left', alignVertical: 'middle' } }
    const columns = centered ? [glyphColumn, textColumn] : look.layout === 'reverse' ? [textColumn, glyphColumn] : [glyphColumn, textColumn]
    const intro: Block = {
        id: uid('row'), type: 'layout', variant: centered ? '1-col' : '2-col',
        content: centered
            // Centred: the glyph above the texts, in one column
            ? { columns: [{ id: uid('rc'), blocks: [glyph, ...texts], settings: { padding: zero, blockGap: 18, alignHorizontal: 'center', alignVertical: 'top' } }], settings: { columns: 1, columnWidths: [1], columnGap: 0, padding: zero, height: 'fit', alignVertical: 'top', alignHorizontal: 'center' } }
            : { columns, settings: { columns: 2, columnWidths: look.layout === 'reverse' ? [1, 1.35] : [1.35, 1], columnGap: 72, padding: zero, height: 'fit', alignVertical: 'middle', alignHorizontal: 'left' } },
    }

    const blocks: Block[] = [intro]
    if (look.showWeights || look.showHierarchy) blocks.push(part({ showGlyph: false, showIntro: false, showTester: false }))
    if (look.showTester) blocks.push(part({ showGlyph: false, showIntro: false, showWeights: false, showHierarchy: false }))

    return section([column(blocks, { blockGap: 88, padding: zero, alignHorizontal: align })], {
        backgroundColor: look.background,
        contentWidth: 'fluid',
        sectionPadding: { isLocked: false, top: look.paddingY, right: look.paddingX, bottom: look.paddingY, left: look.paddingX },
        padding: zero,
        columnGap: 0,
    })
}

const LIGHT_SPECIMEN: TypeSpecimenSettings = { background: '#F4F1EA', surface: '#FFFFFF', border: '#E4E0D6', text: '#141414', muted: '#8A8378' }

// ---------- Colour accordion factories ----------

/** A block that plays an entrance animation when it scrolls into view (the editor's own animations) */
const entering = (b: Block, delay = 0, animation = 'ascender'): Block => ({ ...b, content: { ...b.content, animation, animationSettings: { delay } } })

/**
 * Colour accordion section: the header is a row of native columns (title + text, each a text block with its
 * text toolbar and its own entrance), the accordion below only draws the cards and the usage bar.
 */
const colorAccordion = (settings: ColorAccordionSettings = {}, colors?: Omit<AccordionColor, 'id'>[]): Block => {
    const title = settings.title ?? ACCORDION_DEFAULTS.title
    const description = settings.description ?? ACCORDION_DEFAULTS.description
    const background = settings.background ?? ACCORDION_DEFAULTS.background
    const ink = settings.text ?? ACCORDION_DEFAULTS.text
    const muted = settings.muted ?? ACCORDION_DEFAULTS.muted
    const zero = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }
    const header: Block = {
        id: uid('row'), type: 'layout', variant: '2-col',
        content: {
            columns: [
                { id: uid('rc'), blocks: [entering(heading(title, 72, { fontWeight: 800, fontStyle: 'italic', letterSpacing: '-0.045em', lineHeight: '0.98', color: ink }), 0)], settings: { padding: zero, blockGap: 0, alignHorizontal: 'left', alignVertical: 'top' } },
                { id: uid('rc'), blocks: [entering(text(description, 16, { lineHeight: '1.65', color: muted }), 0.15)], settings: { padding: { ...zero, isLocked: false, top: 12 }, blockGap: 0, alignHorizontal: 'left', alignVertical: 'top' } },
            ],
            settings: { columns: 2, columnWidths: [1.2, 1], columnGap: 64, padding: zero, height: 'fit', alignVertical: 'top', alignHorizontal: 'left' },
        },
    }
    const accordion: Block = {
        id: uid('b'), type: 'color-accordion' as Block['type'],
        content: { ...createColorAccordionContent(colors?.map(c => ({ ...c, id: accordionColorId() })), { ...settings, showHeader: false, paddingX: 0, paddingY: 0 }) },
    }
    return section([column([header, accordion], { blockGap: 64, padding: zero })], {
        backgroundColor: background,
        // No fixed content width: the section padding sets the margins of the header and the cards
        contentWidth: 'fluid',
        sectionPadding: { isLocked: false, top: 110, right: 72, bottom: 110, left: 72 },
        padding: zero,
        columnGap: 0,
    })
}

// ---------- Icon specimen factories ----------

/**
 * Icon specimen section, closed by a row of native columns: a short text about the icon pack on one side and
 * the download block on the other (`downloadSide` swaps them). The section padding (Edit section) sets the
 * margins of everything inside: the specimen and the row draw none of their own and fill the room left.
 */
const iconSection = (set: keyof typeof ICON_SETS, settings: IconSpecimenSettings = {}, downloadSide: 'left' | 'right' = 'right'): Block => {
    const look = { ...ICON_SPECIMEN_DEFAULTS, ...settings }
    const zero = { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 }
    const textCol = [
        heading('Pack de ícones', 30, { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.1', color: look.text }),
        text('Todos os ícones da marca em SVG e PNG, nos tamanhos de 16 a 64 px. Use sempre os ficheiros originais: não redesenhe nem misture com outros conjuntos.', 15, { lineHeight: '1.6', color: look.muted }),
    ]
    const download: Block = {
        id: uid('b'), type: 'download' as Block['type'],
        content: {
            url: '',
            title: 'Icon pack — ' + (ICON_SETS[set]?.label || 'Marca'),
            filesize: '2.4 MB',
            type: 'ZIP',
            style: {
                backgroundColor: look.surface, textColor: look.text, metaColor: look.muted, borderColor: look.border,
                iconBgColor: look.accent, iconColor: look.background, buttonBgColor: look.accent, buttonTextColor: look.background,
                buttonBorderColor: look.accent, borderRadius: look.radius, hoverEffect: 'lift', hoverIconEffect: 'drop',
            },
        },
    }
    const cols = downloadSide === 'right' ? [textCol, [download]] : [[download], textCol]
    const row: Block = {
        id: uid('row'), type: 'layout', variant: '2-col',
        content: {
            columns: cols.map((blocks, i) => ({
                id: uid('rc'), blocks,
                settings: {
                    blockGap: 12, alignHorizontal: 'left', alignVertical: 'middle',
                    padding: zero,
                },
            })),
            settings: { columns: 2, columnWidths: [1, 1], columnGap: 64, padding: zero, height: 'fit', alignVertical: 'middle', alignHorizontal: 'left' },
        },
    }
    return section([column([
        { id: uid('b'), type: 'icon-specimen' as Block['type'], content: { ...createIconSpecimenContent({ ...settings, maxWidth: 0, paddingX: 0, paddingY: 0 }, ICON_SETS[set].icons) } },
        row,
    ], { blockGap: look.paddingY, padding: zero })], {
        backgroundColor: look.background,
        // No fixed width: the content takes everything inside the section padding
        contentWidth: 'fluid',
        sectionPadding: { isLocked: false, top: look.paddingY, right: look.paddingX, bottom: look.paddingY, left: look.paddingX },
        padding: zero,
        columnGap: 0,
    })
}

/** Light / dark looks of the icon specimen, from a background and an accent */
const lightIcons = (background: string, accent: string, ink = '#141414'): IconSpecimenSettings => ({
    background, surface: '#FFFFFF', border: '#E4E0D6', text: ink, muted: '#8A8378', accent, iconColor: ink, palette: [ink, accent, '#8A8378'],
})
const darkIcons = (background: string, accent: string, surface = '#141416', border = '#26262A'): IconSpecimenSettings => ({
    background, surface, border, text: '#F2F2F2', muted: '#7A7A80', accent, iconColor: '#F2F2F2', palette: ['#F2F2F2', accent, '#7A7A80'],
})

// ---------- Footer factories ----------

/** Footer block (columns of brand / pages / links / text / button, all links navigate) */
const footerBlock = (columns?: Partial<FooterColumn>[], settings: FooterSettings = {}): Block => ({
    id: uid('b'), type: 'footer' as Block['type'], content: { ...createFooterContent(columns, settings) },
})

/** Edge-to-edge section holding footer blocks: the footer draws its own background and spacing */
const footer = (blocks: Block[], backgroundColor: string) =>
    section([column(blocks, { blockGap: 0, padding: { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 } })], {
        backgroundColor,
        isFullWidth: true,
        isFullHeight: true,
        sectionPadding: { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 },
        padding: { isLocked: true, top: 0, right: 0, bottom: 0, left: 0 },
        columnGap: 0,
    })

const flink = (label: string, target: FooterLinkTarget) => ({ id: uid('l'), label, target })
const mail = (address: string): FooterLinkTarget => ({ type: 'url', url: `mailto:${address}` })
const web = (url: string): FooterLinkTarget => ({ type: 'url', url, newTab: true })

const PAPER: FooterSettings = { backgroundColor: '#F6F5F2', textColor: '#111114', mutedColor: '#8A8A8A', borderColor: '#E4E2DD', accentColor: '#FF0054' }
const SANS: FooterSettings = { font: 'sans', uppercase: false, letterSpacing: 0, linkSize: 15, titleSize: 12, bodySize: 15, brandSize: 18 }

// ---------- Presets ----------

const RAW_PRESETS: ComponentPreset[] = [
    // Full-screen covers (coverPresets.ts)
    ...COVER_PRESETS,

    // ===== Sections =====
    {
        id: 'sec-index-dark', kind: 'section', topic: 'index',
        name: 'Índice escuro', description: 'Capítulos numerados com destaque e seta ao passar o rato.',
        data: section([
            column([index(DARK_INDEX_SETTINGS)]),
        ], { backgroundColor: '#000000' }),
    },
    {
        id: 'sec-index-light', kind: 'section', topic: 'index',
        name: 'Índice claro', description: 'Título com lista de capítulos ligada às páginas.',
        data: section([
            column([label('Conteúdo'), heading('Índice', 56)]),
            column([index({ titleSize: 40 })]),
        ], {}, [1, 2.4]),
    },
    {
        id: 'sec-index-cards', kind: 'section', topic: 'index',
        name: 'Índice em cartões', description: 'Capítulos em cartões com número e descrição.',
        data: section([
            column([label('Conteúdo'), heading('O que vai encontrar', 48), index({ style: 'cards', titleSize: 32 })]),
        ]),
    },
    {
        id: 'sec-cover', kind: 'section', topic: 'intro',
        name: 'Capa do manual', description: 'Abertura com o logótipo sobre o gradiente oficial.',
        data: section([
            column([
                logo(BRIVIO_LOGOS.white, { width: 240 }),
                label('Manual de marca', { color: '#FFFFFF' }),
                heading('brand books com vida.', 88, { color: '#FFFFFF', fontWeight: 400 }),
            ], { alignVertical: 'bottom' }),
        ], {
            backgroundType: 'image', backgroundImage: BRIVIO_GRADIENT.landscape, backgroundColor: BRIVIO.indigo,
            height: 'L', sectionPadding: { isLocked: false, top: 80, right: 80, bottom: 80, left: 80 },
        }),
    },
    {
        id: 'sec-about', kind: 'section', topic: 'intro',
        name: 'Sobre a marca', description: 'Título à esquerda e texto de apresentação à direita.',
        data: section([
            column([label('01 — Introdução'), heading('Sobre a marca', 56)]),
            column([text(LOREM, 22), text(LOREM, 18)]),
        ], {}, [1, 1.4]),
    },
    {
        id: 'sec-mission', kind: 'section', topic: 'strategy',
        name: 'Missão, visão e valores', description: 'Três colunas com os pilares da marca.',
        data: section([
            column([label('Missão'), heading('Porque existimos', 32), text(LOREM, 16)]),
            column([label('Visão'), heading('Onde queremos chegar', 32), text(LOREM, 16)]),
            column([label('Valores'), heading('Como agimos', 32), list(['Clareza', 'Proximidade', 'Coragem'])]),
        ]),
    },
    {
        id: 'sec-strategy', kind: 'section', topic: 'strategy',
        name: 'Elementos estratégicos', description: 'Propósito, posicionamento, personalidade e promessa.',
        data: section([
            column([heading('01', 64, { color: '#FF0054' }), heading('Propósito', 24), text(LOREM, 15)]),
            column([heading('02', 64, { color: '#FF0054' }), heading('Posicionamento', 24), text(LOREM, 15)]),
            column([heading('03', 64, { color: '#FF0054' }), heading('Personalidade', 24), text(LOREM, 15)]),
            column([heading('04', 64, { color: '#FF0054' }), heading('Promessa', 24), text(LOREM, 15)]),
        ]),
    },
    {
        id: 'sec-principles', kind: 'section', topic: 'strategy',
        name: 'Princípios da marca', description: 'Título com slider de princípios.',
        data: section([
            column([label('Princípios'), heading('O que nos guia', 48)]),
            column([story([
                { title: 'Simples', description: 'Dizemos o essencial, sem ruído.' },
                { title: 'Consistente', description: 'Cada ponto de contacto reforça a mesma marca.' },
                { title: 'Humana', description: 'Falamos com pessoas, não para pessoas.' },
            ])]),
        ], {}, [1, 1.6]),
    },
    {
        id: 'sec-logo', kind: 'section', topic: 'logo',
        name: 'Logotipo principal', description: 'Apresentação do logotipo com descrição.',
        data: section([
            column([label('Logotipo'), heading('A nossa assinatura', 48), text('O logotipo é o elemento mais reconhecível da marca. Use sempre os ficheiros originais e nunca o redesenhe.', 18), button('Descarregar logos')]),
            column([logo(BRIVIO_LOGOS.main)], { alignVertical: 'middle' }),
        ], {}, [1, 1.4]),
    },
    {
        id: 'sec-logo-versions', kind: 'section', topic: 'logo',
        name: 'Versões do logotipo', description: 'Principal, horizontal e símbolo lado a lado.',
        data: section([
            column([logo(BRIVIO_LOGOS.main), label('Versão principal')]),
            column([logo(BRIVIO_LOGOS.wordmark), label('Logótipo')]),
            column([logo(BRIVIO_LOGOS.symbol), label('Símbolo')]),
        ]),
    },
    {
        id: 'sec-logo-space', kind: 'section', topic: 'logo',
        name: 'Área de proteção', description: 'Área de proteção e tamanho mínimo do logotipo.',
        data: section([
            column([logo(BRIVIO_LOGOS.clearSpace)]),
            column([heading('Área de proteção', 32), text('Mantenha à volta do logotipo um espaço livre igual à altura da letra de referência.', 16), heading('Tamanho mínimo', 32), text('Digital: 24 px de altura · Impresso: 10 mm de altura.', 16)]),
        ]),
    },
    {
        id: 'sec-logo-misuse', kind: 'section', topic: 'logo',
        name: 'Usos incorretos', description: 'O que fazer e o que evitar com o logotipo.',
        data: section([
            column([label('Logotipo'), heading('Usos corretos e incorretos', 40), doDont(
                ['Use os ficheiros originais', 'Respeite a área de proteção', 'Garanta contraste com o fundo'],
                ['Distorcer ou rodar', 'Alterar as cores', 'Aplicar sombras ou efeitos'],
            )]),
        ]),
    },
    {
        id: 'sec-palette', kind: 'section', topic: 'color',
        name: 'Paleta principal', description: 'Título, texto e paleta em acordeão.',
        data: section([
            column([label('Cores'), heading('Três cores, uma casa.', 56), text('A paleta equilibra energia e neutralidade. Use a cor primária para destacar, nunca para preencher.', 18)]),
            column([palette(BRAND_COLORS, { layout: 'accordion', gapHorizontal: 12, radius: 20, styles: { radius: 20 } })]),
        ], {}, [1, 1.8]),
    },
    {
        id: 'sec-palette-grid', kind: 'section', topic: 'color',
        name: 'Paleta em grelha', description: 'Cores principais em cartões com códigos.',
        data: section([
            column([label('Cores'), heading('Paleta cromática', 48), palette(BRAND_COLORS, { layout: 'grid', columns: 3 })]),
        ]),
    },
    {
        id: 'sec-palette-shades', kind: 'section', topic: 'color',
        name: 'Cores e tons', description: 'Cada cor com a sua escala de tons.',
        data: section([
            column([label('Cores'), heading('Tons de apoio', 48), palette([SOLID_COLORS[1], SOLID_COLORS[3]], { layout: 'horizontal' })]),
        ]),
    },
    {
        id: 'sec-type', kind: 'section', topic: 'typography',
        name: 'Tipografia principal', description: 'Amostra da fonte com família e pesos.',
        data: section([
            column([heading('Aa', 220, { lineHeight: 1 })], { alignVertical: 'middle' }),
            column([label('Tipografia principal'), heading('Nome da Fonte', 48), text('ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 !?&@', 18, { whiteSpace: 'pre-line' }), list(['Regular — texto corrido', 'Medium — destaques', 'Bold — títulos'])]),
        ]),
    },
    {
        id: 'sec-type-scale', kind: 'section', topic: 'typography',
        name: 'Hierarquia tipográfica', description: 'Escala de títulos e texto, do H1 ao corpo.',
        data: section([
            column([label('Hierarquia')]),
            column([
                heading('Título H1 — 64 px', 64),
                heading('Título H2 — 40 px', 40),
                heading('Título H3 — 28 px', 28),
                text('Corpo de texto — 18 px. ' + LOREM, 18),
                label('Legenda — 13 px'),
            ]),
        ], {}, [1, 3]),
    },
    {
        id: 'sec-voice', kind: 'section', topic: 'voice',
        name: 'Tom de voz', description: 'Atributos do tom de voz com exemplos.',
        data: section([
            column([label('Tom de voz'), heading('Como falamos', 48), text(LOREM, 18)]),
            column([doDont(
                ['Frases curtas e diretas', 'Linguagem próxima', 'Verbos ativos'],
                ['Jargão técnico', 'Tom distante ou frio', 'Excesso de pontos de exclamação'],
            )]),
        ]),
    },
    {
        id: 'sec-imagery', kind: 'section', topic: 'imagery',
        name: 'Estilo fotográfico', description: 'Título com três imagens de referência.',
        data: section([
            column([label('Imagem'), heading('Estilo fotográfico', 48), text('Luz natural, pessoas reais e enquadramentos com espaço para respirar.', 18)]),
            column([image()]),
            column([image()]),
        ], {}, [1.2, 1, 1]),
    },

    // ===== Photographic identity (photoPresets.ts) =====
    ...PHOTO_PRESETS,
    ...PHILOSOPHY_PRESETS,
    ...IDENTITY_PRESETS,
    ...MOCKUP_PRESETS,
    ...SOCIAL_PRESETS,

    // ===== Icon specimens (full-width sections) =====
    {
        id: 'sec-icons-construction', kind: 'section', topic: 'iconography',
        name: 'Construção do ícone', description: 'Ícone na grelha 24 × 24 com formas-base, controlos de estilo, cor e peso, e o conjunto.',
        data: iconSection('interface', { heroIcon: 'compass' }, 'right'),
    },
    {
        id: 'sec-icons-interface-light', kind: 'section', topic: 'iconography',
        name: 'Interface clara', description: 'Ícones de interface em papel claro, com rosa de destaque.',
        data: iconSection('interface', { ...lightIcons('#F4F1EA', BRIVIO.pink), heroIcon: 'search', title: 'Clareza\nem cada gesto.' }, 'left'),
    },
    {
        id: 'sec-icons-communication', kind: 'section', topic: 'iconography',
        name: 'Comunicação', description: 'Duotone em azul profundo para mensagens, chamadas e partilha.',
        data: iconSection('communication', { ...darkIcons('#0A1020', '#4D8DFF', '#0F1830', '#1C2846'), heroIcon: 'message-circle', iconStyle: 'duotone', title: 'Falar a mesma\nlíngua visual.', eyebrow: '01 · Comunicação' }, 'right'),
    },
    {
        id: 'sec-icons-commerce', kind: 'section', topic: 'iconography',
        name: 'Comércio', description: 'Ícones sólidos em tons quentes para loja, preços e entregas.',
        data: iconSection('commerce', { ...lightIcons('#FFF7EC', '#F5891D'), heroIcon: 'cart', iconStyle: 'solid', title: 'Comprar\nsem pensar.', eyebrow: '01 · Loja e checkout' }, 'left'),
    },
    {
        id: 'sec-icons-finance', kind: 'section', topic: 'iconography',
        name: 'Finanças', description: 'Verde sobre escuro, pontas retas, para produtos financeiros.',
        data: iconSection('finance', { ...darkIcons('#08130F', BRIVIO.green, '#0D1C16', '#1A3229'), heroIcon: 'piggy-bank', corners: 'sharp', strokeWidth: 1.75, title: 'Números\ncom confiança.', eyebrow: '01 · Banca e pagamentos' }, 'right'),
    },
    {
        id: 'sec-icons-tech', kind: 'section', topic: 'iconography',
        name: 'Tecnologia', description: 'Blueprint azul com grelha de píxeis e traço fino.',
        data: iconSection('tech', { ...darkIcons('#06142B', '#00E0FF', '#0A1D3A', '#16335C'), heroIcon: 'cpu', grid: 'pixels', corners: 'chamfer', strokeWidth: 1.25, tag: '(05) Ícones técnicos', title: 'Precisão\nao píxel.', eyebrow: '01 · Produto digital' }, 'left'),
    },
    {
        id: 'sec-icons-travel', kind: 'section', topic: 'iconography',
        name: 'Viagem', description: 'Céu claro e ícones duotone para destinos e transportes.',
        data: iconSection('travel', { ...lightIcons('#EAF4FB', '#0077B6', '#0B2540'), surface: '#FFFFFF', border: '#CFE3F1', heroIcon: 'plane', iconStyle: 'duotone', title: 'Partir\né fácil.', eyebrow: '01 · Viagens' }, 'right'),
    },
    {
        id: 'sec-icons-health', kind: 'section', topic: 'iconography',
        name: 'Saúde', description: 'Branco e vermelho, traço mais forte, para saúde e bem-estar.',
        data: iconSection('health', { ...lightIcons('#FFFFFF', '#E63946'), surface: '#F7F7F8', border: '#ECECEE', heroIcon: 'heart', strokeWidth: 2, title: 'Cuidar\ncom clareza.', eyebrow: '01 · Saúde' }, 'left'),
    },
    {
        id: 'sec-icons-food', kind: 'section', topic: 'iconography',
        name: 'Comida', description: 'Creme e laranja queimado, ícones sólidos para restauração.',
        data: iconSection('food', { ...lightIcons('#FFF7EC', '#D9480F', '#2B1A10'), heroIcon: 'utensils', iconStyle: 'solid', title: 'Sabor\nà vista.', eyebrow: '01 · Restauração' }, 'right'),
    },
    {
        id: 'sec-icons-nature', kind: 'section', topic: 'iconography',
        name: 'Natureza', description: 'Verdes suaves e traço leve em duotone.',
        data: iconSection('nature', { ...lightIcons('#F1F5EE', '#2D6A4F', '#1B3A2C'), border: '#D8E3D3', heroIcon: 'leaf', iconStyle: 'duotone', strokeWidth: 1.25, title: 'Leve\npor natureza.', eyebrow: '01 · Sustentabilidade' }, 'left'),
    },
    {
        id: 'sec-icons-building', kind: 'section', topic: 'iconography',
        name: 'Construção', description: 'Amarelo de obra sobre preto, pontas retas e traço forte.',
        data: iconSection('building', { ...darkIcons('#111111', '#FFC300'), heroIcon: 'hammer', corners: 'chamfer', strokeWidth: 2, title: 'Feito\npara durar.', eyebrow: '01 · Obra e casa' }, 'right'),
    },
    {
        id: 'sec-icons-fashion', kind: 'section', topic: 'iconography',
        name: 'Moda', description: 'Preto e dourado, traço fino e grelha centrada.',
        data: iconSection('fashion', { ...darkIcons('#0A0A0A', '#C8A96A', '#111111', '#2A2620'), text: '#F5F0E8', iconColor: '#F5F0E8', heroIcon: 'gem', strokeWidth: 1, layout: 'centered', title: 'Detalhe\né tudo.', eyebrow: '01 · Moda e luxo' }, 'left'),
    },
    {
        id: 'sec-icons-media', kind: 'section', topic: 'iconography',
        name: 'Media', description: 'Violeta sobre escuro, ícones sólidos e grelha à direita.',
        data: iconSection('media', { ...darkIcons('#0B0814', '#8B5CFF', '#120D1F', '#251C3A'), heroIcon: 'play', iconStyle: 'solid', layout: 'reverse', title: 'Som, imagem\ne movimento.', eyebrow: '01 · Media' }, 'right'),
    },
    {
        id: 'sec-icons-education', kind: 'section', topic: 'iconography',
        name: 'Educação', description: 'Índigo em fundo claro, cartões com contorno.',
        data: iconSection('education', { ...lightIcons('#F7F7FB', '#4F46E5', '#1E1B4B'), border: '#E0E0EE', heroIcon: 'book-open', cards: 'outline', title: 'Aprender\nde relance.', eyebrow: '01 · Educação' }, 'left'),
    },
    {
        id: 'sec-icons-sport', kind: 'section', topic: 'iconography',
        name: 'Desporto', description: 'Verde-lima sobre preto, traço grosso e pontas retas.',
        data: iconSection('sport', { ...darkIcons('#0D0D0D', '#C6FF00'), heroIcon: 'trophy', strokeWidth: 2.5, corners: 'sharp', title: 'Mais força\nem cada traço.', eyebrow: '01 · Desporto' }, 'right'),
    },
    {
        id: 'sec-icons-security', kind: 'section', topic: 'iconography',
        name: 'Segurança', description: 'Verde de confiança em azul-noite, duotone.',
        data: iconSection('security', { ...darkIcons('#0B1220', '#22C55E', '#101A2C', '#1D2A40'), heroIcon: 'shield-check', iconStyle: 'duotone', title: 'Seguro\nà primeira vista.', eyebrow: '01 · Segurança' }, 'left'),
    },
    {
        id: 'sec-icons-energy', kind: 'section', topic: 'iconography',
        name: 'Energia', description: 'Âmbar luminoso, ícones sólidos para energia e clima.',
        data: iconSection('energy', { ...lightIcons('#FFF9E6', '#F59E0B', '#2A1F05'), heroIcon: 'zap', iconStyle: 'solid', title: 'Energia\nque se vê.', eyebrow: '01 · Energia' }, 'right'),
    },
    {
        id: 'sec-icons-mobility', kind: 'section', topic: 'iconography',
        name: 'Mobilidade', description: 'Minimal em cinza, só formas-base e sem cartões.',
        data: iconSection('mobility', { ...lightIcons('#F2F2F2', '#111111'), heroIcon: 'car', grid: 'keylines', cards: 'plain', title: 'Ir e vir\nsem ruído.', eyebrow: '01 · Mobilidade' }, 'left'),
    },
    {
        id: 'sec-icons-social', kind: 'section', topic: 'iconography',
        name: 'Social', description: 'Rosa suave e duotone, grelha à direita.',
        data: iconSection('social', { ...lightIcons('#FFF0F5', BRIVIO.pink, '#2B0F1C'), border: '#F5D5E2', heroIcon: 'thumbs-up', iconStyle: 'duotone', layout: 'reverse', title: 'Gostar,\npartilhar, voltar.', eyebrow: '01 · Social' }, 'right'),
    },
    {
        id: 'sec-icons-brivio', kind: 'section', topic: 'iconography',
        name: 'Ícones Brivio', description: 'Preto e rosa Brivio, com as cores oficiais nos botões.',
        data: iconSection('creative', { ...darkIcons('#000000', BRIVIO.pink, '#0B0B0D', '#1E1E22'), palette: ['#F2F2F2', BRIVIO.pink, BRIVIO.indigo, BRIVIO.green], heroIcon: 'sparkles', layout: 'centered', tag: '(05) Iconografia', title: 'Ícones Brivio,\ncriativos por natureza.', eyebrow: '01 · Protegendo marcas' }, 'left'),
    },

    // ===== Colour accordions (full-width sections) =====
    {
        id: 'sec-color-accordion', kind: 'section', topic: 'color',
        name: 'Três cores, uma casa', description: 'Cartões de cor que se abrem com códigos, tons e contraste, e a proporção de uso. Entram ao rolar.',
        data: colorAccordion(),
    },
    {
        id: 'sec-color-accordion-brivio', kind: 'section', topic: 'color',
        name: 'Paleta Brivio em acordeão', description: 'As cores oficiais Brivio sobre preto, com o gradiente da marca.',
        data: colorAccordion({
            title: 'Quatro cores,\numa energia.', description: 'O rosa lidera, o índigo dá profundidade, o magenta liga os dois e o verde aparece nos momentos certos.',
            background: '#0B0B0D', text: '#F5F5F5', muted: '#8A8A90', initialIndex: 0, reveal: 'blur',
        }, [
            { name: 'Rosa', hex: BRIVIO.pink, description: 'A cor da marca: botões, destaques e tudo o que pede ação.', usage: 40 },
            { name: 'Índigo', hex: BRIVIO.indigo, description: 'Profundidade e confiança. Fundos, títulos e ilustrações.', usage: 25 },
            { name: 'Magenta', hex: BRIVIO.magenta, description: 'A ponte entre o rosa e o índigo, em gradientes e detalhes.', usage: 15 },
            { name: 'Verde', hex: BRIVIO.green, description: 'Sucesso e frescura. Usar com moderação.', usage: 10 },
            { name: 'Gradiente', hex: BRIVIO.indigo, gradient: [BRIVIO.pink, BRIVIO.magenta, BRIVIO.indigo], description: 'O gradiente oficial, para capas e momentos especiais.', usage: 10 },
        ]),
    },
    {
        id: 'sec-color-accordion-dark', kind: 'section', topic: 'color',
        name: 'Acordeão escuro', description: 'A mesma paleta em fundo escuro, com entrada em desfoque.',
        data: colorAccordion({ background: '#121212', text: '#F2F2F2', muted: '#8C8C8C', reveal: 'blur', radius: 28 }),
    },
    {
        id: 'sec-color-accordion-pastel', kind: 'section', topic: 'color',
        name: 'Pastel suave', description: 'Cinco tons pastel em fundo branco, cartões mais estreitos.',
        data: colorAccordion({
            title: 'Cores que\nacolhem.', description: 'Uma paleta suave para uma marca próxima: cada tom tem o seu lugar, nenhum grita.',
            background: '#FFFFFF', muted: '#8B8B93', reveal: 'fade', radius: 32, collapsedWidth: 80, initialIndex: 0,
        }, [
            { name: 'Rosa chá', hex: '#F6C9D6', description: 'O tom principal: fundos, embalagens e redes sociais.', usage: 35 },
            { name: 'Lavanda', hex: '#C9B6FF', description: 'Calma e criatividade, em ilustrações e destaques.', usage: 25 },
            { name: 'Céu', hex: '#B5E3FF', description: 'Leveza e clareza para áreas de informação.', usage: 20 },
            { name: 'Manteiga', hex: '#FFF1B8', description: 'Pequenos acentos de luz.', usage: 10 },
            { name: 'Ameixa', hex: '#3B1F3A', description: 'O contraste: texto e logótipo.', usage: 10 },
        ]),
    },

    // ===== Type specimens (full-width sections) =====
    {
        id: 'sec-specimen-construction', kind: 'section', topic: 'typography',
        name: 'Construção da letra', description: 'Letra em contorno na grelha de construção, pesos, hierarquia e teste de peso.',
        data: specimen(),
    },
    {
        id: 'sec-specimen-weight', kind: 'section', topic: 'typography',
        name: 'Peso em movimento', description: 'A letra percorre todos os pesos, de 100 a 900, em loop.',
        data: specimen({ glyphMode: 'solid', glyphAnimation: 'weight', eyebrow: '02 · Família variável', title: 'De 100 ao 900.', description: 'Uma família variável: o peso muda, o desenho continua. Forte na marca, médio nos textos.' }),
    },
    {
        id: 'sec-specimen-draw', kind: 'section', topic: 'typography',
        name: 'Desenho do glifo', description: 'O contorno da letra desenha-se traço a traço, em rosa Brivio.',
        data: specimen({ fontFamily: 'Inter', glyph: 'g', glyphAnimation: 'draw', accent: BRIVIO.pink, background: '#0A0A0B', tag: '(04) Tipografia', title: 'Inter,\nclara em qualquer ecrã.', description: 'Desenhada para interfaces: legível em tamanhos pequenos, firme nos títulos.' }),
    },
    {
        id: 'sec-specimen-editorial', kind: 'section', topic: 'typography',
        name: 'Editorial claro', description: 'Serifa em papel claro, letra fantasma e cor terracota.',
        data: specimen({ ...LIGHT_SPECIMEN, fontFamily: 'Playfair Display', glyph: 'Ag', glyphMode: 'ghost', heroWeight: 700, accent: '#C2410C', title: 'Playfair,\nclássica e viva.', description: 'Contraste alto entre traços finos e grossos: elegância para títulos e citações.', testerText: 'Cada detalhe conta uma história.' },
            [{ id: uid('w'), weight: 400, label: 'Regular' }, { id: uid('w'), weight: 600, label: 'SemiBold' }, { id: uid('w'), weight: 700, label: 'Bold' }, { id: uid('w'), weight: 900, label: 'Black' }]),
    },
    {
        id: 'sec-specimen-reverse', kind: 'section', topic: 'typography',
        name: 'Grotesca à direita', description: 'Texto à esquerda e a letra em verde à direita.',
        data: specimen({ fontFamily: 'Space Grotesk', glyph: 'R', glyphMode: 'accent', layout: 'reverse', heroWeight: 700, accent: BRIVIO.green, background: '#090D0B', surface: '#0F1512', border: '#1F2A24', title: 'Space Grotesk,\ntécnica e humana.', description: 'Detalhes peculiares que dão personalidade sem perder a clareza.' },
            [{ id: uid('w'), weight: 300, label: 'Light' }, { id: uid('w'), weight: 400, label: 'Regular' }, { id: uid('w'), weight: 500, label: 'Medium' }, { id: uid('w'), weight: 700, label: 'Bold' }]),
    },
    {
        id: 'sec-specimen-centered', kind: 'section', topic: 'typography',
        name: 'Letra centrada', description: 'A letra grande ao centro, com a apresentação por baixo.',
        data: specimen({ fontFamily: 'Syne', glyph: 'S', layout: 'centered', heroWeight: 800, accent: '#8B5CFF', background: '#0B0814', surface: '#120D1F', border: '#251C3A', title: 'Syne,\nousada por natureza.', description: 'Larga e expressiva: feita para títulos que se querem ver de longe.' },
            [{ id: uid('w'), weight: 400, label: 'Regular' }, { id: uid('w'), weight: 600, label: 'SemiBold' }, { id: uid('w'), weight: 700, label: 'Bold' }, { id: uid('w'), weight: 800, label: 'ExtraBold' }]),
    },
    {
        id: 'sec-specimen-brivio', kind: 'section', topic: 'typography',
        name: 'Tipografia Brivio', description: 'Outfit em rosa Brivio sobre preto, letra preenchida.',
        data: specimen({ fontFamily: 'Outfit', glyph: 'B', glyphMode: 'accent', heroWeight: 600, accent: BRIVIO.pink, background: '#000000', surface: '#0B0B0D', border: '#1E1E22', tag: '(03) Tipografia', eyebrow: '01 · A voz da Brivio', title: 'Outfit,\nsimples e segura.', description: 'Geométrica e amigável: a mesma voz no produto, no site e nas apresentações.', testerText: 'Protegendo marcas, todos os dias.' }),
    },
    {
        id: 'sec-specimen-blueprint', kind: 'section', topic: 'typography',
        name: 'Blueprint técnico', description: 'Fonte mono sobre grelha azul, como uma planta técnica.',
        data: specimen({ fontFamily: 'JetBrains Mono', glyph: 'M', heroWeight: 700, background: '#06142B', surface: '#0A1D3A', border: '#16335C', text: '#E6F0FF', muted: '#6E8BB5', accent: '#00E0FF', backdropGrid: true, tag: '(05) Tipo técnico', eyebrow: '01 · Código e dados', title: 'JetBrains Mono,\nprecisão em cada letra.', description: 'Largura fixa para números, tabelas e tudo o que tem de alinhar.', testerText: 'v2.0 — 128 px · 33.9 mm', testerMax: 800 }),
    },
    {
        id: 'sec-specimen-contrast', kind: 'section', topic: 'typography',
        name: 'Contraste', description: 'Preto sobre cinza claro, letra sólida que muda de peso.',
        data: specimen({ ...LIGHT_SPECIMEN, background: '#F2F2F2', surface: '#FFFFFF', border: '#DDDDDD', text: '#0A0A0A', muted: '#777777', accent: '#0A0A0A', fontFamily: 'Archivo', glyph: 'Q', glyphMode: 'solid', glyphAnimation: 'weight', title: 'Archivo,\nforte sem gritar.', description: 'Uma grotesca robusta para sinalética, embalagens e campanhas.' }),
    },
    {
        id: 'sec-specimen-minimal', kind: 'section', topic: 'typography',
        name: 'Minimal', description: 'Branco, azul e muito espaço; sem números nas linhas.',
        data: specimen({ ...LIGHT_SPECIMEN, background: '#FFFFFF', surface: '#F7F7F8', border: '#ECECEE', text: '#111111', muted: '#8B8B93', accent: '#2563EB', fontFamily: 'Manrope', glyph: 'a', glyphMode: 'ghost', heroWeight: 700, showGuideValues: false, hierarchyTag: '', title: 'Manrope,\nleve e precisa.', description: 'Neutra e moderna, para textos longos e interfaces calmas.' }),
    },
    {
        id: 'sec-specimen-fraunces', kind: 'section', topic: 'typography',
        name: 'Serifa quente', description: 'Fraunces em dourado sobre castanho, letra preenchida.',
        data: specimen({ fontFamily: 'Fraunces', glyph: 'f', glyphMode: 'accent', heroWeight: 700, background: '#1A1410', surface: '#221A14', border: '#3A2C21', text: '#F5E9DA', muted: '#A08A74', accent: '#E8B04B', title: 'Fraunces,\ncalor e caráter.', description: 'Uma serifa com alma: curvas suaves para marcas próximas e artesanais.', testerText: 'Feito à mão, pensado ao detalhe.' }),
    },

    // ===== Footers (footer block: every page / link navigates, gear panel for everything) =====
    {
        id: 'foot-meridian-dark', kind: 'section', topic: 'footer',
        name: 'Rodapé editorial escuro', description: 'Marca, páginas numeradas em duas colunas e contacto.',
        data: footer([footerBlock()], '#0B0B0D'),
    },
    {
        id: 'foot-meridian-light', kind: 'section', topic: 'footer',
        name: 'Rodapé editorial claro', description: 'A mesma estrutura editorial em papel claro.',
        data: footer([footerBlock(undefined, PAPER)], '#F6F5F2'),
    },
    {
        id: 'foot-index-live', kind: 'section', topic: 'footer',
        name: 'Todas as páginas', description: 'Marca e a lista completa das páginas, sempre atualizada.',
        data: footer([footerBlock([
            { kind: 'brand', showMark: true, tagline: 'Tudo o que precisa para usar a marca com consistência.', width: 1.4 },
            { kind: 'pages', title: 'Páginas', pageFrom: 1 },
            { kind: 'links', title: 'Atalhos', links: [flink('Voltar ao topo', { type: 'top' }), flink('Contactar a equipa', mail('brand@empresa.com'))] },
        ], { ...SANS, numbered: false })], '#0B0B0D'),
    },
    {
        id: 'foot-wordmark', kind: 'section', topic: 'footer',
        name: 'Nome gigante', description: 'Páginas em colunas e o nome da marca em grande.',
        data: footer([footerBlock([
            { kind: 'pages', pageFrom: 1, pageTo: 3 },
            { kind: 'pages', pageFrom: 4 },
            { kind: 'links', title: 'Contacto', links: [flink('brand@empresa.com', mail('brand@empresa.com'))], align: 'right' },
        ], { showWordmark: true, wordmarkSize: 220, showBottomBar: true, borderTop: false })], '#0B0B0D'),
    },
    {
        id: 'foot-cta', kind: 'section', topic: 'footer',
        name: 'Chamada para contacto', description: 'Pergunta em destaque, botão de contacto e barra legal.',
        data: footer([footerBlock([
            { kind: 'text', body: 'Dúvidas sobre a marca?\nA equipa responde em 24 horas.', width: 2 },
            { kind: 'button', align: 'right', button: flink('Falar com a equipa', mail('brand@empresa.com')) },
        ], { ...SANS, bodySize: 36, showBottomBar: true })], '#0B0B0D'),
    },
    {
        id: 'foot-marquee', kind: 'section', topic: 'footer',
        name: 'Faixa em loop e páginas', description: 'Texto a passar em loop por cima das páginas.',
        data: footer([
            marquee([{ items: ['Brand book', 'Edition 02', 'Meridian'] }], { fontSize: 40, borderTop: false }),
            footerBlock([
                { kind: 'brand', showMark: true, tagline: 'Brand book, edition 02 ®' },
                { kind: 'pages', pageFrom: 1, pageTo: 3 },
                { kind: 'pages', pageFrom: 4 },
            ], { borderTop: false, paddingTop: 48 }),
        ], '#0B0B0D'),
    },
    {
        id: 'foot-minimal', kind: 'section', topic: 'footer',
        name: 'Linha mínima', description: 'Uma linha com direitos, versão e voltar ao topo.',
        data: footer([footerBlock([
            { kind: 'text', body: '© 2026 Meridian' },
            { kind: 'text', body: 'Brand book v2.0', align: 'center' },
            { kind: 'links', align: 'right', links: [flink('Voltar ao topo ↑', { type: 'top' })] },
        ], { ...PAPER, backgroundColor: '#FFFFFF', paddingTop: 28, paddingBottom: 28, bodySize: 11, linkSize: 11 })], '#FFFFFF'),
    },
    {
        id: 'foot-brand', kind: 'section', topic: 'footer',
        name: 'Na cor da marca', description: 'Fundo rosa, logótipo e páginas.',
        data: footer([footerBlock([
            { kind: 'brand', showLogo: true, tagline: 'Manual de marca, edição 2026', width: 1.4 },
            { kind: 'pages', pageFrom: 1, pageTo: 3 },
            { kind: 'pages', pageFrom: 4 },
        ], { backgroundColor: BRIVIO.pink, textColor: '#FFFFFF', mutedColor: 'rgba(255,255,255,0.7)', accentColor: '#111114', borderTop: false })], BRIVIO.pink),
    },
    {
        id: 'foot-gradient', kind: 'section', topic: 'footer',
        name: 'Gradiente com frase', description: 'Frase final sobre o gradiente oficial e contactos.',
        data: footer([footerBlock([
            { kind: 'text', body: 'Uma marca vive de cada detalhe.', width: 2 },
            { kind: 'links', title: 'Contacto', links: [flink('brand@empresa.com', mail('brand@empresa.com')), flink('+351 210 000 000', { type: 'url', url: 'tel:+351210000000' })] },
        ], { ...SANS, backgroundImage: BRIVIO_GRADIENT.landscape, textColor: '#FFFFFF', mutedColor: 'rgba(255,255,255,0.65)', accentColor: '#06D6A0', bodySize: 56, paddingTop: 140, borderTop: false })], BRIVIO.indigo),
    },
    {
        id: 'foot-contacts', kind: 'section', topic: 'footer',
        name: 'Contactos por equipa', description: 'Quatro colunas com quem contactar.',
        data: footer([footerBlock([
            { kind: 'links', title: 'Marca', links: [flink('Ana Silva', { type: 'none' }), flink('brand@empresa.com', mail('brand@empresa.com'))] },
            { kind: 'links', title: 'Design', links: [flink('João Costa', { type: 'none' }), flink('design@empresa.com', mail('design@empresa.com'))] },
            { kind: 'links', title: 'Legal', links: [flink('Marta Reis', { type: 'none' }), flink('legal@empresa.com', mail('legal@empresa.com'))] },
            { kind: 'links', title: 'Imprensa', links: [flink('Rui Lopes', { type: 'none' }), flink('press@empresa.com', mail('press@empresa.com'))] },
        ], SANS)], '#0B0B0D'),
    },
    {
        id: 'foot-downloads', kind: 'section', topic: 'footer',
        name: 'Recursos para descarregar', description: 'Botões para os ficheiros da marca.',
        data: footer([footerBlock([
            { kind: 'text', title: 'Recursos', body: 'Leve a marca consigo', width: 1.6 },
            { kind: 'button', button: flink('Logótipos', web('https://')) },
            { kind: 'button', button: flink('Tipografia', web('https://')) },
            { kind: 'button', button: flink('Templates', web('https://')) },
        ], { ...PAPER, ...SANS, bodySize: 32, buttonColor: '#111114' })], '#F6F5F2'),
    },
    {
        id: 'foot-changelog', kind: 'section', topic: 'footer',
        name: 'Histórico de versões', description: 'Versões do manual com datas e alterações.',
        data: footer([footerBlock([
            { kind: 'brand', showMark: true, tagline: 'Versão atual 2.0' },
            { kind: 'text', title: 'Versões', body: 'v2.0  ·  Out 2026\nv1.2  ·  Mar 2025\nv1.0  ·  Jan 2024' },
            { kind: 'text', title: 'Alterações', body: 'Nova paleta, regras de imagem e templates atualizados.', width: 1.4 },
        ])], '#0B0B0D'),
    },
    {
        id: 'foot-centered', kind: 'section', topic: 'footer',
        name: 'Centrado', description: 'Logótipo ao centro, páginas e atalhos aos lados.',
        data: footer([footerBlock([
            { kind: 'pages', pageFrom: 1, pageTo: 3 },
            { kind: 'brand', showLogo: true, tagline: 'Feito com cuidado pela equipa de marca', align: 'center', width: 1.4 },
            { kind: 'links', align: 'right', links: [flink('Voltar ao topo', { type: 'top' }), flink('Contacto', mail('brand@empresa.com'))] },
        ], { ...PAPER, backgroundColor: '#FFFFFF', showBottomBar: true, showBackToTop: false })], '#FFFFFF'),
    },
    {
        id: 'foot-statement', kind: 'section', topic: 'footer',
        name: 'Frase e detalhes', description: 'Frase grande e detalhes da edição.',
        data: footer([footerBlock([
            { kind: 'text', body: 'Simples, consistente, humana.', width: 2.2 },
            { kind: 'text', title: 'Edição', body: '02  ·  2026' },
            { kind: 'pages', title: 'Páginas', pageFrom: 1, pageTo: 4 },
        ], { ...PAPER, bodySize: 12 })], '#F6F5F2'),
    },
    {
        id: 'foot-social', kind: 'section', topic: 'footer',
        name: 'Logótipo e redes', description: 'Logótipo, redes sociais, páginas e notas legais.',
        data: footer([footerBlock([
            { kind: 'brand', showLogo: true, width: 1.4 },
            { kind: 'links', title: 'Redes', links: [flink('Instagram', web('https://instagram.com')), flink('LinkedIn', web('https://linkedin.com')), flink('Behance', web('https://behance.net'))] },
            { kind: 'pages', title: 'Páginas', pageFrom: 1, pageTo: 4 },
        ], { backgroundColor: '#000000', showBottomBar: true, bottomText: 'Privacidade  ·  Termos  ·  © 2026' })], '#000000'),
    },

    // ===== Columns =====
    {
        id: 'col-value', kind: 'column', topic: 'strategy',
        name: 'Cartão de valor', description: 'Etiqueta, título e descrição.',
        data: column([label('Valor'), heading('Clareza', 32), text(LOREM, 16)]),
    },
    {
        id: 'col-number', kind: 'column', topic: 'strategy',
        name: 'Número em destaque', description: 'Número grande, título e texto.',
        data: column([heading('01', 72, { color: '#FF0054' }), heading('Propósito', 24), text(LOREM, 15)]),
    },
    {
        id: 'col-logo', kind: 'column', topic: 'logo',
        name: 'Variação de logotipo', description: 'Imagem do logo com legenda.',
        data: column([logo(BRIVIO_LOGOS.main), label('Versão principal')]),
    },
    {
        id: 'col-color', kind: 'column', topic: 'color',
        name: 'Cor com descrição', description: 'Cor com nome e uso recomendado.',
        data: column([palette([SOLID_COLORS[1]], { layout: 'grid', columns: 1 }), text('Use para chamadas de ação e destaques.', 15)]),
    },
    {
        id: 'col-type', kind: 'column', topic: 'typography',
        name: 'Amostra tipográfica', description: '"Aa" com nome da fonte e uso.',
        data: column([heading('Aa', 120, { lineHeight: 1 }), heading('Nome da Fonte', 24), text('Títulos e destaques', 15)]),
    },
    {
        id: 'col-image', kind: 'column', topic: 'imagery',
        name: 'Imagem com legenda', description: 'Imagem com título e descrição curta.',
        data: column([image(), heading('Legenda', 20), text('Descrição curta da imagem.', 14)]),
    },
    {
        id: 'col-voice', kind: 'column', topic: 'voice',
        name: 'Atributo de voz', description: 'Atributo com o que fazer e evitar.',
        data: column([heading('Próxima', 32), doDont(['Falamos na segunda pessoa'], ['Usamos linguagem formal'])]),
    },

    // ===== Blocks =====
    {
        id: 'blk-logo-showcase', kind: 'block', topic: 'logo',
        name: 'Logótipo com versões', description: 'Versões do logótipo em separadores e zona de segurança.',
        data: logoShowcase(brivioLogoVersions()),
    },
    {
        id: 'blk-logo-showcase-light', kind: 'block', topic: 'logo',
        name: 'Logótipo em fundo claro', description: 'Versões em cartões claros, separadores com linha.',
        data: logoShowcase([
            lv('Gradiente', '#FFFFFF'),
            lv('Preto', '#F1EFEA', '#0B0B0B'),
            lv('Rosa', BRIVIO.pink, '#FFFFFF'),
        ], { tabsStyle: 'underline', controlsLayout: 'split', activeBackground: '#111114', tabColor: '#9A9AA0', borderWidth: 1, borderColor: '#E4E2DD', radius: 24, clearSpaceColor: BRIVIO.pink }),
    },
    {
        id: 'blk-logo-size', kind: 'block', topic: 'logo',
        name: 'Tamanho mínimo', description: 'Slider de tamanho com mínimo, recomendado e ficha técnica.',
        data: logoSize(),
    },
    {
        id: 'blk-logo-size-light', kind: 'block', topic: 'logo',
        name: 'Tamanho mínimo claro', description: 'A mesma régua de tamanhos em papel claro.',
        data: logoSize({
            logoUrl: brivioSymbol('#0B0B0B'), stageBackground: '#F6F5F2', stageBorder: '#E4E2DD', trackColor: '#DAD7D0', thumbColor: '#111114',
            readoutColor: '#8A8A8A', aboveColor: '#0F9D58', recommendedColor: '#2563EB', belowColor: '#E5383B',
            specLabelColor: '#6B6B70', specValueColor: '#111114', specLineColor: '#E4E2DD',
        }),
    },
    {
        id: 'blk-logo-size-print', kind: 'block', topic: 'logo',
        name: 'Tamanho mínimo para impressão', description: 'Medidas em milímetros a 300 ppi, sem ficha.',
        data: logoSize({ dpi: 300, units: 'mm', minSize: 118, recommendedSize: 236, sliderMin: 40, sliderMax: 400, initialSize: 300, showSpecs: false, stageHeight: 420 }),
    },
    {
        id: 'blk-misuse', kind: 'block', topic: 'logo',
        name: 'Nunca faça isto', description: 'Cartões de usos incorretos; a cruz aparece ao passar o rato.',
        data: logoMisuse(),
    },
    {
        id: 'blk-misuse-marked', kind: 'block', topic: 'logo',
        name: 'Erros assinalados', description: 'Seis erros numerados, sempre riscados.',
        data: logoMisuse(
            ['stretch', 'rotate', 'recolor', 'shadow', 'outline', 'busy'].map(e => misuseCard(e as MisuseCard['effect'])),
            { columns: 3, mark: 'slash', markOn: 'always', numbered: true, previewHeight: 160, logoSize: 60, title: 'Usos incorretos' },
        ),
    },
    {
        id: 'blk-misuse-dodont', kind: 'block', topic: 'logo',
        name: 'Fazer e não fazer', description: 'O uso certo ao lado dos erros, com etiquetas, em papel claro.',
        data: logoMisuse(
            [misuseCard('none', { caption: 'Use the mark as drawn, on clean backgrounds.' }), misuseCard('squash'), misuseCard('gradient'), misuseCard('lowContrast', { color: '#D9D6CF' })],
            { ...MISUSE_LIGHT, layout: 'tiles', mark: 'badge', markOn: 'always', title: 'Fazer e não fazer', showDescription: true, description: 'Um exemplo do uso certo e dos erros mais comuns.', previewHeight: 180, logoSize: 64 },
        ),
    },
    {
        id: 'blk-misuse-list', kind: 'block', topic: 'logo',
        name: 'Lista de erros', description: 'Erros em lista, imagem ao lado do texto.',
        data: logoMisuse(
            ['stretch', 'skew', 'glow', 'crop'].map(e => misuseCard(e as MisuseCard['effect'])),
            { layout: 'list', columns: 2, mark: 'badge', markOn: 'always', numbered: true, previewHeight: 104, logoSize: 44, captionSize: 15, title: 'Evite sempre' },
        ),
    },
    {
        id: 'blk-misuse-impact', kind: 'block', topic: 'logo',
        name: 'Erros em destaque', description: 'Dois erros grandes com cruz, título centrado.',
        data: logoMisuse(
            [misuseCard('stretch'), misuseCard('recolor', { color: '#FFD600' })],
            { columns: 2, previewHeight: 280, logoSize: 110, markOn: 'always', titleAlign: 'center', titleSize: 44, showDescription: true, description: 'O símbolo só funciona exatamente como foi desenhado.', captionSize: 15, radius: 20 },
        ),
    },
    {
        id: 'blk-logo-showcase-centered', kind: 'block', topic: 'logo',
        name: 'Logótipo centrado', description: 'Separadores centrados em contorno e guia tracejada.',
        data: logoShowcase(brivioLogoVersions(), { tabsStyle: 'outline', controlsLayout: 'center', clearSpaceLine: 'dashed', clearSpaceOn: true, stageHeight: 380 }),
    },
    {
        id: 'blk-index', kind: 'block', topic: 'index',
        name: 'Índice', description: 'Lista as páginas do menu lateral, sempre atualizada.',
        data: index(),
    },
    {
        id: 'blk-index-cards', kind: 'block', topic: 'index',
        name: 'Índice em cartões', description: 'Capítulos em grelha de cartões.',
        data: index({ style: 'cards', titleSize: 32 }),
    },
    {
        id: 'blk-title', kind: 'block', topic: 'intro',
        name: 'Título de capítulo', description: 'Título grande para abrir um capítulo.',
        data: heading('Título do capítulo', 72),
    },
    {
        id: 'blk-intro', kind: 'block', topic: 'intro',
        name: 'Texto de introdução', description: 'Parágrafo de abertura em destaque.',
        data: text(LOREM, 24),
    },
    {
        id: 'blk-values', kind: 'block', topic: 'strategy',
        name: 'Lista de valores', description: 'Lista simples de valores da marca.',
        data: list(['Clareza', 'Proximidade', 'Coragem', 'Consistência']),
    },
    {
        id: 'blk-principles', kind: 'block', topic: 'strategy',
        name: 'Slider de princípios', description: 'Princípios em slides com progresso.',
        data: story([
            { title: 'Simples', description: 'Dizemos o essencial, sem ruído.' },
            { title: 'Consistente', description: 'Cada ponto de contacto reforça a mesma marca.' },
            { title: 'Humana', description: 'Falamos com pessoas, não para pessoas.' },
        ]),
    },
    {
        id: 'blk-dodont', kind: 'block', topic: 'logo',
        name: 'Fazer e evitar', description: 'Lista dupla do que fazer e evitar.',
        data: doDont(['Use os ficheiros originais'], ['Distorcer o logotipo']),
    },
    {
        id: 'blk-palette-accordion', kind: 'block', topic: 'color',
        name: 'Paleta em acordeão', description: 'Cores que expandem ao passar o rato.',
        data: palette(BRAND_COLORS, { layout: 'accordion', gapHorizontal: 12, radius: 20, styles: { radius: 20 } }),
    },
    {
        id: 'blk-palette-grid', kind: 'block', topic: 'color',
        name: 'Paleta em grelha', description: 'Cartões de cor com códigos.',
        data: palette(BRAND_COLORS, { layout: 'grid', columns: 3 }),
    },
    {
        id: 'blk-palette-card', kind: 'block', topic: 'color',
        name: 'Paleta em cartões', description: 'Cartões com a cor, nome e HEX para copiar.',
        data: palette(SOLID_COLORS.slice(0, 4), { layout: 'card', columns: 4, gapHorizontal: 24, radius: 12, styles: { radius: 12 } }),
    },
    {
        id: 'blk-type-specimen', kind: 'block', topic: 'typography',
        name: 'Alfabeto', description: 'Caracteres da fonte em texto corrido.',
        data: text('ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 !?&@', 28, { whiteSpace: 'pre-line' }),
    },
    {
        id: 'blk-voice', kind: 'block', topic: 'voice',
        name: 'Fazer e evitar (voz)', description: 'Exemplos de escrita certa e errada.',
        data: doDont(['Frases curtas e diretas'], ['Jargão técnico']),
    },
    {
        id: 'blk-marquee-dark', kind: 'block', topic: 'marquee',
        name: 'Faixa escura com pontos', description: 'Palavras em loop separadas por pontos, com bordas.',
        data: marquee([{ items: WORDS }], { fullBleed: true }),
    },
    {
        id: 'blk-marquee-dual', kind: 'block', topic: 'marquee',
        name: 'Duas direções', description: 'Duas faixas em sentidos opostos, uma em contorno.',
        data: marquee([
            { items: WORDS, direction: 'left' },
            { items: ['Clear', 'Bold', 'Human'], direction: 'right', outline: true },
        ], { fullBleed: true, separator: 'diamond', separatorSize: 9 }),
    },
    {
        id: 'blk-marquee-brand', kind: 'block', topic: 'marquee',
        name: 'Cor da marca com estrelas', description: 'Faixa rosa, maiúsculas e estrelas.',
        data: marquee([{ items: ['Brand', 'Identity', 'System', 'Guidelines'] }], {
            fullBleed: true, backgroundColor: '#FF0054', textColor: '#FFFFFF', separatorColor: '#FFFFFF', separator: 'star',
            separatorSize: 10, uppercase: true, fontWeight: 700, fontSize: 48, letterSpacing: 0, borderTop: false, borderBottom: false, speed: 80,
        }),
    },
    {
        id: 'blk-marquee-light', kind: 'block', topic: 'marquee',
        name: 'Clara com quadrados', description: 'Fundo claro, texto escuro e quadrados.',
        data: marquee([{ items: WORDS }], {
            backgroundColor: '#FFFFFF', textColor: '#111114', separatorColor: '#111114', separator: 'square',
            separatorSize: 10, borderColor: '#E5E7EB', fontWeight: 600,
        }),
    },
    {
        id: 'blk-marquee-icons', kind: 'block', topic: 'marquee',
        name: 'Separada por ícones', description: 'Ícones em vez de formas entre os textos.',
        data: marquee([{ items: ['Design', 'Strategy', 'Content', 'Motion'] }], {
            fullBleed: true, separator: 'icon', separatorIcon: 'sparkles', separatorColor: '#06D6A0', separatorSize: 12,
            textColor: '#FFFFFF', fontSize: 44, speed: 50,
        }),
    },
    {
        id: 'blk-marquee-outline', kind: 'block', topic: 'marquee',
        name: 'Contorno gigante', description: 'Texto grande só em contorno, com barras.',
        data: marquee([{ items: ['Brivio', 'Brandbook', 'Guidy'], outline: true }], {
            fullBleed: true, fontSize: 120, fontWeight: 800, textColor: '#FFFFFF', separator: 'slash', separatorColor: '#FF0054',
            separatorSize: 22, uppercase: true, borderTop: false, borderBottom: false, speed: 40, fadeEdges: true,
        }),
    },
    {
        id: 'blk-marquee-minimal', kind: 'block', topic: 'marquee',
        name: 'Minimal sem fundo', description: 'Texto pequeno em maiúsculas, traços e sem fundo.',
        data: marquee([{ items: ['Available worldwide', 'Since 1996', 'Made with care'] }], {
            backgroundColor: 'transparent', textColor: '#111114', separator: 'dash', separatorColor: '#111114', separatorSize: 6,
            fontSize: 18, fontWeight: 500, uppercase: true, letterSpacing: 8, paddingY: 16, borderColor: '#111114', speed: 40,
        }),
    },
    {
        id: 'blk-download', kind: 'block', topic: 'logo',
        name: 'Botão de download', description: 'Botão para descarregar ficheiros.',
        data: button('Descarregar ficheiros'),
    },
]

/** Templates show the Brivio placeholders instead of sample photos, one per template in turn (covers keep their artwork) */
let placeholderTurn = 0
export const COMPONENT_PRESETS: ComponentPreset[] = RAW_PRESETS.map(p => p.topic === 'cover' || !hasSampleImage(p.data) ? p : { ...p, data: withPlaceholder(p.data, placeholderAt(placeholderTurn++)) })

/** Kind of a saved component, inferred from its data (saved components carry no kind field) */
export const inferComponentKind = (data: unknown): ComponentKind => {
    const d = data as { type?: string, blocks?: unknown } | null
    if (d?.type === 'layout') return 'section'
    if (d && !d.type && Array.isArray(d.blocks)) return 'column'
    return 'block'
}
