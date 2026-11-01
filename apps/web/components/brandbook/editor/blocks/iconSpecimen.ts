/**
 * Icon specimen: the brand's iconography presented like the type specimen. On top, an icon on its
 * construction grid (24 × 24 pixel grid, keyline shapes, live area) next to the description; then the
 * controls visitors can play with (style, colour, stroke weight), the specs and the icon set.
 * Shared by the block, its panel and the library presets.
 */

import {
    Activity, Apple, ArrowRight, Award, Baby, Banknote, BarChart3, Battery, Bed, Bell, Bike, Bluetooth, BookOpen, Bookmark, Box,
    Briefcase, Building2, Bus, Cake, Calendar, Camera, Car, Cat, Check, ChevronRight, Circle, Clock, Cloud, Code, Coffee, Coins,
    Compass, Cpu, CreditCard, Crown, Database, Dog, Download, Droplet, Dumbbell, Eye, Feather, Film, Filter, Fingerprint, Flag,
    Flame, Flower2, Folder, Fuel, Gamepad2, Gem, Gift, Glasses, Globe, Hammer, HardHat, Headphones, Heart, Home, IceCream, Image,
    Key, Keyboard, Landmark, Laptop, Layers, Leaf, Lightbulb, Lock, Mail, Map, MapPin, Megaphone, Menu, MessageCircle, MessageSquare,
    Mic, Monitor, Moon, Mountain, Mouse, Music, Navigation, Package, Palette, Paintbrush, PenTool, Percent, Phone, PieChart, PiggyBank,
    Pill, Pizza, Plane, Play, Plus, Printer, Puzzle, Radio, Receipt, Recycle, Rocket, Ruler, Salad, Scissors, Search, Send, Server,
    Settings, Share2, Shield, ShieldCheck, Ship, Shirt, ShoppingBag, ShoppingCart, SlidersHorizontal, Smartphone, Smile, Snowflake,
    Sofa, Sparkles, Sprout, Square, Star, Stethoscope, Store, Sun, Tag, Target, Terminal, Thermometer, ThumbsUp, Train, Trash2,
    TreePine, TrendingUp, Triangle, Trophy, Truck, Tv, Umbrella, Unlock, Upload, User, UserPlus, Users, Utensils, Video, Wallet,
    Watch, Waves, Wifi, Wine, Wrench, X, Zap,
    type LucideIcon,
} from "lucide-react"

/** The icons a specimen can show, by name */
export const ICON_LIBRARY: Record<string, LucideIcon> = {
    activity: Activity, apple: Apple, 'arrow-right': ArrowRight, award: Award, baby: Baby, banknote: Banknote, 'bar-chart': BarChart3,
    battery: Battery, bed: Bed, bell: Bell, bike: Bike, bluetooth: Bluetooth, 'book-open': BookOpen, bookmark: Bookmark, box: Box,
    briefcase: Briefcase, building: Building2, bus: Bus, cake: Cake, calendar: Calendar, camera: Camera, car: Car, cat: Cat, check: Check,
    'chevron-right': ChevronRight, circle: Circle, clock: Clock, cloud: Cloud, code: Code, coffee: Coffee, coins: Coins, compass: Compass,
    cpu: Cpu, 'credit-card': CreditCard, crown: Crown, database: Database, dog: Dog, download: Download, droplet: Droplet, dumbbell: Dumbbell,
    eye: Eye, feather: Feather, film: Film, filter: Filter, fingerprint: Fingerprint, flag: Flag, flame: Flame, flower: Flower2, folder: Folder,
    fuel: Fuel, gamepad: Gamepad2, gem: Gem, gift: Gift, glasses: Glasses, globe: Globe, hammer: Hammer, 'hard-hat': HardHat,
    headphones: Headphones, heart: Heart, home: Home, 'ice-cream': IceCream, image: Image, key: Key, keyboard: Keyboard, landmark: Landmark,
    laptop: Laptop, layers: Layers, leaf: Leaf, lightbulb: Lightbulb, lock: Lock, mail: Mail, map: Map, 'map-pin': MapPin, megaphone: Megaphone,
    menu: Menu, 'message-circle': MessageCircle, 'message-square': MessageSquare, mic: Mic, monitor: Monitor, moon: Moon, mountain: Mountain,
    mouse: Mouse, music: Music, navigation: Navigation, package: Package, palette: Palette, paintbrush: Paintbrush, 'pen-tool': PenTool,
    percent: Percent, phone: Phone, 'pie-chart': PieChart, 'piggy-bank': PiggyBank, pill: Pill, pizza: Pizza, plane: Plane, play: Play,
    plus: Plus, printer: Printer, puzzle: Puzzle, radio: Radio, receipt: Receipt, recycle: Recycle, rocket: Rocket, ruler: Ruler, salad: Salad,
    scissors: Scissors, search: Search, send: Send, server: Server, settings: Settings, share: Share2, shield: Shield, 'shield-check': ShieldCheck,
    ship: Ship, shirt: Shirt, 'shopping-bag': ShoppingBag, cart: ShoppingCart, sliders: SlidersHorizontal, smartphone: Smartphone, smile: Smile,
    snowflake: Snowflake, sofa: Sofa, sparkles: Sparkles, sprout: Sprout, square: Square, star: Star, stethoscope: Stethoscope, store: Store,
    sun: Sun, tag: Tag, target: Target, terminal: Terminal, thermometer: Thermometer, 'thumbs-up': ThumbsUp, train: Train, trash: Trash2,
    tree: TreePine, 'trending-up': TrendingUp, triangle: Triangle, trophy: Trophy, truck: Truck, tv: Tv, umbrella: Umbrella, unlock: Unlock,
    upload: Upload, user: User, 'user-plus': UserPlus, users: Users, utensils: Utensils, video: Video, wallet: Wallet, watch: Watch,
    waves: Waves, wifi: Wifi, wine: Wine, wrench: Wrench, x: X, zap: Zap,
}

export const ICON_NAMES = Object.keys(ICON_LIBRARY)
export const iconOf = (name: string): LucideIcon => ICON_LIBRARY[name] || Compass

/** Ready sets of icons by theme (presets and the panel's "load a set") */
export const ICON_SETS: Record<string, { label: string, icons: string[] }> = {
    interface: { label: 'Interface', icons: ['home', 'search', 'bell', 'settings', 'user', 'heart', 'bookmark', 'share', 'download', 'upload', 'trash', 'lock'] },
    communication: { label: 'Comunicação', icons: ['mail', 'message-circle', 'phone', 'send', 'megaphone', 'mic', 'video', 'users', 'bell', 'share', 'radio', 'message-square'] },
    commerce: { label: 'Comércio', icons: ['cart', 'shopping-bag', 'store', 'tag', 'percent', 'receipt', 'credit-card', 'gift', 'package', 'truck', 'wallet', 'star'] },
    finance: { label: 'Finanças', icons: ['banknote', 'coins', 'piggy-bank', 'wallet', 'credit-card', 'landmark', 'trending-up', 'pie-chart', 'bar-chart', 'receipt', 'percent', 'shield-check'] },
    tech: { label: 'Tecnologia', icons: ['cpu', 'code', 'terminal', 'server', 'database', 'cloud', 'wifi', 'bluetooth', 'laptop', 'smartphone', 'monitor', 'keyboard'] },
    travel: { label: 'Viagem', icons: ['plane', 'map', 'map-pin', 'compass', 'globe', 'navigation', 'train', 'ship', 'car', 'umbrella', 'camera', 'sun'] },
    health: { label: 'Saúde', icons: ['heart', 'activity', 'stethoscope', 'pill', 'thermometer', 'dumbbell', 'apple', 'salad', 'droplet', 'shield', 'smile', 'baby'] },
    food: { label: 'Comida', icons: ['utensils', 'coffee', 'pizza', 'wine', 'cake', 'ice-cream', 'apple', 'salad', 'flame', 'store', 'truck', 'star'] },
    nature: { label: 'Natureza', icons: ['leaf', 'tree', 'flower', 'sprout', 'mountain', 'waves', 'sun', 'moon', 'cloud', 'snowflake', 'droplet', 'recycle'] },
    building: { label: 'Construção', icons: ['home', 'building', 'hammer', 'wrench', 'hard-hat', 'ruler', 'sofa', 'bed', 'key', 'lightbulb', 'zap', 'truck'] },
    fashion: { label: 'Moda', icons: ['shirt', 'glasses', 'watch', 'gem', 'crown', 'scissors', 'shopping-bag', 'tag', 'heart', 'star', 'sparkles', 'gift'] },
    media: { label: 'Media', icons: ['play', 'music', 'film', 'camera', 'image', 'headphones', 'mic', 'tv', 'radio', 'video', 'gamepad', 'palette'] },
    education: { label: 'Educação', icons: ['book-open', 'bookmark', 'pen-tool', 'lightbulb', 'award', 'trophy', 'users', 'calendar', 'clock', 'folder', 'globe', 'puzzle'] },
    sport: { label: 'Desporto', icons: ['dumbbell', 'bike', 'trophy', 'award', 'target', 'activity', 'flag', 'clock', 'heart', 'flame', 'mountain', 'waves'] },
    security: { label: 'Segurança', icons: ['shield', 'shield-check', 'lock', 'unlock', 'key', 'fingerprint', 'eye', 'bell', 'server', 'cloud', 'user', 'check'] },
    energy: { label: 'Energia', icons: ['zap', 'battery', 'sun', 'flame', 'fuel', 'lightbulb', 'recycle', 'leaf', 'cloud', 'thermometer', 'droplet', 'trending-up'] },
    mobility: { label: 'Mobilidade', icons: ['car', 'bike', 'bus', 'train', 'plane', 'ship', 'truck', 'fuel', 'map-pin', 'navigation', 'clock', 'battery'] },
    social: { label: 'Social', icons: ['heart', 'thumbs-up', 'message-circle', 'share', 'user-plus', 'users', 'camera', 'smile', 'star', 'bell', 'send', 'bookmark'] },
    data: { label: 'Dados', icons: ['bar-chart', 'pie-chart', 'trending-up', 'database', 'filter', 'sliders', 'layers', 'target', 'search', 'download', 'folder', 'settings'] },
    creative: { label: 'Criativo', icons: ['palette', 'paintbrush', 'pen-tool', 'feather', 'sparkles', 'layers', 'image', 'camera', 'scissors', 'ruler', 'lightbulb', 'rocket'] },
}

export type IconStyle = 'outline' | 'solid' | 'duotone'
/** How strokes end and turn: round, sharp (pointed mitres) or chamfered (cut corners) */
export type IconCorners = 'round' | 'sharp' | 'chamfer'

export const CORNER_LABELS: Record<IconCorners, string> = { round: 'Arredondado', sharp: 'Pontiagudo', chamfer: 'Chanfrado' }
/** "{corners}" in a spec value */
const CORNER_WORDS: Record<IconCorners, string> = { round: 'arredondados', sharp: 'pontiagudos', chamfer: 'chanfrados' }
export const cornerWord = (c: IconCorners) => CORNER_WORDS[c]
export type IconGrid = 'keylines' | 'pixels' | 'both' | 'none'
export type IconCards = 'cards' | 'outline' | 'plain'
export type IconLayout = 'split' | 'reverse' | 'centered'

export interface IconSpec { id: string, label: string, value: string }

export interface IconSpecimenSettings {
    heroIcon?: string
    iconStyle?: IconStyle
    /** Stroke weight on the 24 px grid (0.5 – 3) */
    strokeWidth?: number
    /** Old setting (round / square ends), read as corners */
    caps?: 'round' | 'square'
    corners?: IconCorners
    iconColor?: string
    /** Colours offered as buttons (empty = only the icon colour) */
    palette?: string[]
    grid?: IconGrid
    /** Visitors can switch style, colour and weight */
    showControls?: boolean
    showSpecs?: boolean
    showSet?: boolean
    showLabels?: boolean
    columns?: number
    cards?: IconCards
    // texts
    tag?: string
    eyebrow?: string
    title?: string
    description?: string
    // style
    layout?: IconLayout
    background?: string
    surface?: string
    border?: string
    text?: string
    muted?: string
    accent?: string
    radius?: number
    heroHeight?: number
    paddingX?: number
    paddingY?: number
    maxWidth?: number
}

export interface IconSpecimenContent {
    icons: string[]
    specs: IconSpec[]
    settings: IconSpecimenSettings
}

export const ICON_SPECIMEN_DEFAULTS: Required<IconSpecimenSettings> = {
    heroIcon: 'compass',
    iconStyle: 'outline',
    strokeWidth: 1.5,
    caps: 'round',
    corners: 'round',
    iconColor: '#F2F2F2',
    palette: ['#F2F2F2', '#FF7A1A', '#06D6A0', '#4D8DFF'],
    grid: 'both',
    showControls: true,
    showSpecs: true,
    showSet: true,
    showLabels: true,
    columns: 6,
    cards: 'cards',
    tag: '(05) Iconografia',
    eyebrow: '01 · Desenhados na mesma grelha',
    title: 'Ícones simples,\ntraço constante.',
    description: 'Todos os ícones nascem numa grelha de 24 × 24 px, com 2 px de margem e o mesmo traço. Assim falam a mesma língua, em qualquer tamanho.',
    layout: 'split',
    background: '#0E0E0F',
    surface: '#141416',
    border: '#26262A',
    text: '#F2F2F2',
    muted: '#7A7A80',
    accent: '#FF7A1A',
    radius: 14,
    heroHeight: 460,
    paddingX: 72,
    paddingY: 96,
    maxWidth: 1240,
}

let seq = 0
export const iconSpecId = () => `is-${Date.now().toString(36)}-${++seq}`

/** Specs shown under the grid; "{weight}" shows the current stroke weight */
export const DEFAULT_ICON_SPECS = (): IconSpec[] => [
    { id: iconSpecId(), label: 'Grelha', value: '24 × 24 px' },
    { id: iconSpecId(), label: 'Área útil', value: '20 × 20 px' },
    { id: iconSpecId(), label: 'Traço', value: '{weight} px' },
    { id: iconSpecId(), label: 'Cantos', value: '{corners}' },
]

export const createIconSpecimenContent = (settings: IconSpecimenSettings = {}, icons?: string[], specs?: IconSpec[]): IconSpecimenContent => ({
    icons: icons || ICON_SETS.interface.icons,
    specs: specs || DEFAULT_ICON_SPECS(),
    settings,
})

export const readIconSpecimenContent = (content: any): IconSpecimenContent => ({
    icons: Array.isArray(content?.icons) ? content.icons : ICON_SETS.interface.icons,
    specs: Array.isArray(content?.specs) ? content.specs : DEFAULT_ICON_SPECS(),
    settings: content?.settings || {},
})

export const resolveIconSpecimen = (settings: IconSpecimenSettings) => ({
    ...ICON_SPECIMEN_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
    corners: settings?.corners || (settings?.caps === 'square' ? 'sharp' : 'round'),
}) as Required<IconSpecimenSettings>

/** Icon name → label ("map-pin" → "Map pin") */
export const iconLabel = (name: string) => (name.charAt(0).toUpperCase() + name.slice(1)).replace(/-/g, ' ')
