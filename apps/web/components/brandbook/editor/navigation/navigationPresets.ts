import {
    BookOpen, Shapes, Palette, Type, Image, Download, MessageCircle, Smile, Quote, Tag, BookText, PenLine, PenTool,
    LayoutGrid, Sparkles, Monitor, Play, Music, Flower2, Hand, Coffee, Layers, Dna, History, Target, Compass, Home,
    FileText, Star, Heart, Globe, Camera, Film, Mic, Box, Package, Briefcase, Users, User, Mail, Phone, MapPin,
    Calendar, Clock, Lightbulb, Zap, Rocket, Award, Flag, Bookmark, Folder, Grid3x3, Square, Circle, Triangle,
    Hexagon, Feather, Brush, Droplet, Sun, Moon, Eye, Lock, Shield, Settings, Info, HelpCircle, Megaphone, Newspaper,
    Gift, ShoppingBag, Store, Truck, Leaf, Building2,
    type LucideIcon,
} from "lucide-react"

/**
 * Navigation of the shared brandbook (the published link and the editor Preview). Settings live in the brand's
 * footer_settings JSON (key "navigation"), next to the footer: both are the public page chrome.
 */

export type NavLayout =
    | 'sidebar'          // the current side menu (default)
    | 'topbar'           // full-width bar on top (can float inset)
    | 'top-capsule'      // floating pill at the top
    | 'bottom-capsule'   // floating pill at the bottom
    | 'dock'             // floating icon dock at the bottom / top
    | 'side'             // full-height side panel, left or right
    | 'side-floating'    // full-height side card with margins and rounded corners
    | 'rail'             // narrow icon rail, left or right
    | 'overlay-menu'     // "Menu" button that opens a full-screen menu
    | 'drawer'           // hamburger that slides a panel in from the side
    | 'contents-card'    // floating "Contents" button that opens a card with the pages
    | 'contents-modal'   // bottom bar with a "Contents" button that opens a centered modal

export type NavTheme = 'light' | 'dark' | 'glass' | 'brand'

export interface NavPreset {
    id: string
    name: string
    group: 'Lateral (atual)' | 'Superior' | 'Cápsula superior' | 'Inferior' | 'Lateral' | 'Menu'
    layout: NavLayout
    theme: NavTheme
    side?: 'left' | 'right'
    position?: 'top' | 'bottom'
    /** centered links · ruled bottom line · outlined frame · inset floating · segmented active pill ·
     *  active filled pill · icons only · icons + active label · wide pill with logo */
    variant?: 'centered' | 'ruled' | 'outlined' | 'inset' | 'segmented' | 'active-pill' | 'icons' | 'icons-label' | 'wide'
}

export const NAV_PRESETS: NavPreset[] = [
    { id: 'sidebar', name: 'Menu lateral (atual)', group: 'Lateral (atual)', layout: 'sidebar', theme: 'light' },

    // Superior
    { id: 'top-classic-light', name: 'Clássica clara', group: 'Superior', layout: 'topbar', theme: 'light' },
    { id: 'top-classic-dark', name: 'Clássica escura', group: 'Superior', layout: 'topbar', theme: 'dark' },
    { id: 'top-centered-light', name: 'Centrada clara', group: 'Superior', layout: 'topbar', theme: 'light', variant: 'centered' },
    { id: 'top-centered-dark', name: 'Centrada escura', group: 'Superior', layout: 'topbar', theme: 'dark', variant: 'centered' },
    { id: 'top-ruled-dark', name: 'Editorial com linha', group: 'Superior', layout: 'topbar', theme: 'dark', variant: 'ruled' },
    { id: 'top-outlined-dark', name: 'Moldura técnica', group: 'Superior', layout: 'topbar', theme: 'dark', variant: 'outlined' },
    { id: 'top-inset-light', name: 'Flutuante clara', group: 'Superior', layout: 'topbar', theme: 'light', variant: 'inset' },
    { id: 'top-inset-dark', name: 'Flutuante escura', group: 'Superior', layout: 'topbar', theme: 'dark', variant: 'inset' },
    { id: 'top-glass', name: 'Vidro', group: 'Superior', layout: 'topbar', theme: 'glass', variant: 'inset' },
    { id: 'top-brand', name: 'Cor da marca', group: 'Superior', layout: 'topbar', theme: 'brand' },
    { id: 'top-pill-dark', name: 'Destaque ativo escura', group: 'Superior', layout: 'topbar', theme: 'dark', variant: 'active-pill' },
    { id: 'top-pill-light', name: 'Destaque ativo clara', group: 'Superior', layout: 'topbar', theme: 'light', variant: 'active-pill' },

    // Cápsula superior
    { id: 'capsule-top-dark', name: 'Cápsula escura', group: 'Cápsula superior', layout: 'top-capsule', theme: 'dark' },
    { id: 'capsule-top-light', name: 'Cápsula clara', group: 'Cápsula superior', layout: 'top-capsule', theme: 'light' },
    { id: 'capsule-top-glass', name: 'Cápsula de vidro', group: 'Cápsula superior', layout: 'top-capsule', theme: 'glass' },
    { id: 'capsule-top-seg-light', name: 'Segmentada clara', group: 'Cápsula superior', layout: 'top-capsule', theme: 'light', variant: 'segmented' },
    { id: 'capsule-top-seg-dark', name: 'Segmentada escura', group: 'Cápsula superior', layout: 'top-capsule', theme: 'dark', variant: 'segmented' },
    { id: 'capsule-top-icons', name: 'Dock de ícones', group: 'Cápsula superior', layout: 'top-capsule', theme: 'dark', variant: 'icons' },
    { id: 'capsule-top-icons-label', name: 'Ícones com etiqueta', group: 'Cápsula superior', layout: 'top-capsule', theme: 'dark', variant: 'icons-label' },
    { id: 'capsule-top-wide', name: 'Cápsula larga com logo', group: 'Cápsula superior', layout: 'top-capsule', theme: 'dark', variant: 'wide' },

    // Inferior
    { id: 'capsule-bottom-dark', name: 'Cápsula inferior escura', group: 'Inferior', layout: 'bottom-capsule', theme: 'dark' },
    { id: 'capsule-bottom-light', name: 'Cápsula inferior clara', group: 'Inferior', layout: 'bottom-capsule', theme: 'light' },
    { id: 'capsule-bottom-glass', name: 'Cápsula inferior de vidro', group: 'Inferior', layout: 'bottom-capsule', theme: 'glass' },
    { id: 'capsule-bottom-seg-dark', name: 'Segmentada inferior escura', group: 'Inferior', layout: 'bottom-capsule', theme: 'dark', variant: 'segmented' },
    { id: 'capsule-bottom-seg-light', name: 'Segmentada inferior clara', group: 'Inferior', layout: 'bottom-capsule', theme: 'light', variant: 'segmented' },
    { id: 'dock-bottom-dark', name: 'Dock inferior escuro', group: 'Inferior', layout: 'dock', theme: 'dark', position: 'bottom' },
    { id: 'dock-bottom-light', name: 'Dock inferior claro', group: 'Inferior', layout: 'dock', theme: 'light', position: 'bottom' },
    { id: 'dock-bottom-label', name: 'Dock com etiqueta', group: 'Inferior', layout: 'dock', theme: 'dark', position: 'bottom', variant: 'icons-label' },
    { id: 'contents-bar-dark', name: 'Barra "Contents"', group: 'Inferior', layout: 'contents-modal', theme: 'dark' },

    // Lateral
    { id: 'side-left-light', name: 'Painel esquerdo claro', group: 'Lateral', layout: 'side', theme: 'light', side: 'left' },
    { id: 'side-left-dark', name: 'Painel esquerdo escuro', group: 'Lateral', layout: 'side', theme: 'dark', side: 'left' },
    { id: 'side-right-light', name: 'Painel direito claro', group: 'Lateral', layout: 'side', theme: 'light', side: 'right' },
    { id: 'side-right-dark', name: 'Painel direito escuro', group: 'Lateral', layout: 'side', theme: 'dark', side: 'right' },
    { id: 'float-left-light', name: 'Flutuante esquerdo claro', group: 'Lateral', layout: 'side-floating', theme: 'light', side: 'left' },
    { id: 'float-left-dark', name: 'Flutuante esquerdo escuro', group: 'Lateral', layout: 'side-floating', theme: 'dark', side: 'left' },
    { id: 'float-right-light', name: 'Flutuante direito claro', group: 'Lateral', layout: 'side-floating', theme: 'light', side: 'right' },
    { id: 'float-right-dark', name: 'Flutuante direito escuro', group: 'Lateral', layout: 'side-floating', theme: 'dark', side: 'right' },
    { id: 'rail-left-dark', name: 'Barra de ícones esquerda', group: 'Lateral', layout: 'rail', theme: 'dark', side: 'left' },
    { id: 'rail-left-light', name: 'Barra de ícones esquerda clara', group: 'Lateral', layout: 'rail', theme: 'light', side: 'left' },
    { id: 'rail-right-dark', name: 'Barra de ícones direita', group: 'Lateral', layout: 'rail', theme: 'dark', side: 'right' },
    { id: 'rail-float-left', name: 'Ícones flutuantes', group: 'Lateral', layout: 'rail', theme: 'glass', side: 'left', variant: 'inset' },

    // Menu
    { id: 'menu-overlay-dark', name: 'Menu de ecrã inteiro', group: 'Menu', layout: 'overlay-menu', theme: 'dark' },
    { id: 'menu-overlay-light', name: 'Menu de ecrã inteiro claro', group: 'Menu', layout: 'overlay-menu', theme: 'light' },
    { id: 'menu-overlay-brand', name: 'Menu na cor da marca', group: 'Menu', layout: 'overlay-menu', theme: 'brand' },
    { id: 'drawer-left-dark', name: 'Hambúrguer · gaveta esquerda', group: 'Menu', layout: 'drawer', theme: 'dark', side: 'left' },
    { id: 'drawer-right-light', name: 'Hambúrguer · gaveta direita', group: 'Menu', layout: 'drawer', theme: 'light', side: 'right' },
    { id: 'contents-card-light', name: 'Cartão "Contents" claro', group: 'Menu', layout: 'contents-card', theme: 'light' },
    { id: 'contents-card-dark', name: 'Cartão "Contents" escuro', group: 'Menu', layout: 'contents-card', theme: 'dark' },
    { id: 'contents-modal-dark', name: 'Índice em janela', group: 'Menu', layout: 'contents-modal', theme: 'dark', variant: 'icons' },
    { id: 'contents-modal-light', name: 'Índice em janela claro', group: 'Menu', layout: 'contents-modal', theme: 'light', variant: 'icons' },
]

export const getNavPreset = (id?: string) => NAV_PRESETS.find(p => p.id === id) || NAV_PRESETS[0]

export interface NavigationSettings {
    /** Preset id; 'sidebar' (default) keeps the current side menu */
    style?: string
    /** Show the side-menu separators (pages in a popover / under each one) or just the pages */
    grouping?: 'separators' | 'pages'
    showIcons?: boolean
    /** Icon per page id, chosen in the settings (overrides the automatic one) */
    pageIcons?: Record<string, string>
    /** Highlight color (active page, brand theme) */
    accentColor?: string
    /** "Asset library" button in the navigation (default on): visitors see it once the library is shared publicly */
    showAssetLibrary?: boolean
    assetLibraryLabel?: string
}

/** Icons a page can use, by name */
export const NAV_ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen, 'home': Home, 'compass': Compass, 'shapes': Shapes, 'hexagon': Hexagon, 'palette': Palette,
    'droplet': Droplet, 'type': Type, 'feather': Feather, 'image': Image, 'camera': Camera, 'film': Film, 'download': Download,
    'folder': Folder, 'package': Package, 'box': Box, 'message': MessageCircle, 'megaphone': Megaphone, 'quote': Quote,
    'smile': Smile, 'tag': Tag, 'book-text': BookText, 'pen-line': PenLine, 'pen-tool': PenTool, 'brush': Brush,
    'layout-grid': LayoutGrid, 'grid': Grid3x3, 'sparkles': Sparkles, 'monitor': Monitor, 'play': Play, 'music': Music,
    'mic': Mic, 'flower': Flower2, 'hand': Hand, 'coffee': Coffee, 'layers': Layers, 'dna': Dna, 'history': History,
    'target': Target, 'flag': Flag, 'award': Award, 'star': Star, 'heart': Heart, 'globe': Globe, 'lightbulb': Lightbulb,
    'zap': Zap, 'rocket': Rocket, 'bookmark': Bookmark, 'square': Square, 'circle': Circle, 'triangle': Triangle,
    'sun': Sun, 'moon': Moon, 'eye': Eye, 'lock': Lock, 'shield': Shield, 'settings': Settings, 'info': Info,
    'help': HelpCircle, 'newspaper': Newspaper, 'gift': Gift, 'shopping-bag': ShoppingBag, 'store': Store, 'truck': Truck,
    'leaf': Leaf, 'building': Building2, 'briefcase': Briefcase, 'users': Users, 'user': User, 'mail': Mail,
    'phone': Phone, 'map-pin': MapPin, 'calendar': Calendar, 'clock': Clock, 'file': FileText,
}

/** Automatic icon from the page title (Portuguese and English names of the usual brandbook pages) */
const AUTO_ICONS: [RegExp, string][] = [
    [/brand ?book|capa|cover|início|home/i, 'home'],
    [/introdu|visão geral|overview|intro|sobre|about/i, 'book-open'],
    [/logo|símbolo|simbolo|marca registada|mark/i, 'hexagon'],
    [/cor|color|colour|paleta|palette/i, 'palette'],
    [/tipogra|typograph|font|letra/i, 'type'],
    [/fotogra|photo|imag|imagery/i, 'image'],
    [/recurso|asset|download|ficheiro|file/i, 'download'],
    [/tom de voz|voz|voice|tone/i, 'message'],
    [/personalidade|personality/i, 'smile'],
    [/slogan|tagline/i, 'quote'],
    [/naming|nome/i, 'tag'],
    [/story|história|historia|manifesto/i, 'book-text'],
    [/copy|escrita|writing|linguagem/i, 'pen-line'],
    [/iconogra|ícone|icone|icon/i, 'shapes'],
    [/ilustra|illustration/i, 'pen-tool'],
    [/grid|layout|grelha/i, 'layout-grid'],
    [/elemento|element|gráfico|grafico|pattern|padr/i, 'sparkles'],
    [/aplica|application|digital|offline|merch/i, 'monitor'],
    [/motion|movimento|animação|animacao/i, 'play'],
    [/sonor|sound|som|audio|áudio/i, 'music'],
    [/olfat|scent/i, 'flower'],
    [/tátil|tatil|táctil|touch/i, 'hand'],
    [/gustat|taste/i, 'coffee'],
    [/multimodal|sensorial/i, 'layers'],
    [/dna/i, 'dna'],
    [/missão|missao|visão|visao|valor|propósito|proposito|mission|vision|purpose|estratég/i, 'target'],
    [/guia|guide|estilo|style/i, 'compass'],
]

export const getAutoIconName = (title: string) => AUTO_ICONS.find(([re]) => re.test(title))?.[1] || 'file'
export const getPageIcon = (page: { id: string, title: string }, settings?: NavigationSettings): LucideIcon =>
    NAV_ICONS[settings?.pageIcons?.[page.id] || ''] || NAV_ICONS[getAutoIconName(page.title)] || FileText

export interface NavTokens {
    bg: string
    text: string
    muted: string
    border: string
    hover: string
    activeBg: string
    activeText: string
    accent: string
    blur: boolean
}

export const getNavTokens = (theme: NavTheme, accent = '#FF0054'): NavTokens => {
    switch (theme) {
        case 'dark': return { bg: '#111114', text: '#FFFFFF', muted: '#8B8B93', border: 'rgba(255,255,255,0.08)', hover: 'rgba(255,255,255,0.06)', activeBg: '#FFFFFF', activeText: '#111114', accent, blur: false }
        case 'glass': return { bg: 'rgba(20,20,24,0.55)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.14)', hover: 'rgba(255,255,255,0.08)', activeBg: 'rgba(255,255,255,0.92)', activeText: '#111114', accent, blur: true }
        case 'brand': return { bg: accent, text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'rgba(255,255,255,0.2)', hover: 'rgba(255,255,255,0.12)', activeBg: '#FFFFFF', activeText: accent, accent: '#FFFFFF', blur: false }
        default: return { bg: '#FFFFFF', text: '#111114', muted: '#6B6B73', border: 'rgba(0,0,0,0.08)', hover: 'rgba(0,0,0,0.05)', activeBg: '#111114', activeText: '#FFFFFF', accent, blur: false }
    }
}
