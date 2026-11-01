/**
 * Social mockup block: the brand on a social network, drawn as the app screen (optionally inside a phone):
 * a profile with its avatar, bio, highlights and grid of posts, a post in the feed, stories that play one
 * after the other (arrows, progress bars, endless loop) or a reel. A generic social app — no network's logo.
 */

import { brivioSymbol } from "./brivioSymbol"

export type SocialMode = 'profile' | 'post' | 'story' | 'reel' | 'grid'
export type SocialFrame = 'phone' | 'none'
export type SocialTheme = 'light' | 'dark'

export interface SocialMedia { id: string, url: string, caption?: string }
export interface SocialHighlight { id: string, label: string, url: string }

export interface SocialSettings {
    mode?: SocialMode
    frame?: SocialFrame
    theme?: SocialTheme
    /** Phone body colour */
    frameColor?: string
    /** Width of the phone / screen, px */
    width?: number
    accent?: string
    // profile
    handle?: string
    name?: string
    category?: string
    bio?: string
    link?: string
    avatarUrl?: string
    verified?: boolean
    posts?: string
    followers?: string
    following?: string
    gridColumns?: number
    showHighlights?: boolean
    // post / reel
    caption?: string
    likes?: string
    comments?: string
    audio?: string
    // stories
    autoplay?: boolean
    duration?: number
    showArrows?: boolean
    loop?: boolean
    alignment?: 'left' | 'center' | 'right'
}

export interface SocialMockupContent {
    settings: SocialSettings
    media: SocialMedia[]
    highlights: SocialHighlight[]
}

export const SOCIAL_DEFAULTS: Required<SocialSettings> = {
    mode: 'profile',
    frame: 'phone',
    theme: 'light',
    frameColor: '#111114',
    width: 320,
    accent: '#FF0054',
    handle: 'brivio',
    name: 'Brivio°',
    category: 'Design de marca',
    bio: 'Marcas que se usam bem.\nO manual da tua marca, num só link.',
    link: 'brivio.com',
    avatarUrl: '',
    verified: true,
    posts: '248',
    followers: '18,4 mil',
    following: '312',
    gridColumns: 3,
    showHighlights: true,
    caption: 'A tua marca, inteira, num só lugar. Descobre o novo manual da Brivio — link na bio.',
    likes: '2 481',
    comments: '96',
    audio: 'Brivio° · Som original',
    autoplay: true,
    duration: 5,
    showArrows: true,
    loop: true,
    alignment: 'center',
}

export const resolveSocial = (settings: SocialSettings = {}) => ({
    ...SOCIAL_DEFAULTS,
    ...Object.fromEntries(Object.entries(settings || {}).filter(([, v]) => v !== undefined)),
}) as Required<SocialSettings>

let seq = 0
export const socialId = () => `sm-${Date.now().toString(36)}-${++seq}`

const BV = (name: string) => `/brandbook/templates/brivio/${name}.jpg`

export const DEFAULT_SOCIAL_MEDIA = (): SocialMedia[] =>
    ['post-1', 'post-2', 'post-3', 'post-4', 'post-5', 'post-6', 'application-1', 'application-2', 'application-3'].map(n => ({ id: socialId(), url: BV(n) }))

export const DEFAULT_HIGHLIGHTS = (): SocialHighlight[] => [
    { id: socialId(), label: 'Novidades', url: BV('post-1') },
    { id: socialId(), label: 'Marca', url: BV('application-2') },
    { id: socialId(), label: 'Equipa', url: BV('imagery-2') },
    { id: socialId(), label: 'Eventos', url: BV('post-4') },
]

export const createSocialMockupContent = (settings: SocialSettings = {}, media?: SocialMedia[], highlights?: SocialHighlight[]): SocialMockupContent => ({
    settings,
    media: media || DEFAULT_SOCIAL_MEDIA(),
    highlights: highlights || DEFAULT_HIGHLIGHTS(),
})

export const readSocialMockupContent = (content: Partial<SocialMockupContent> | undefined): SocialMockupContent => ({
    settings: content?.settings || {},
    media: Array.isArray(content?.media) ? content!.media : DEFAULT_SOCIAL_MEDIA(),
    highlights: Array.isArray(content?.highlights) ? content!.highlights : DEFAULT_HIGHLIGHTS(),
})

/** The avatar shown when none is uploaded: the Brivio symbol */
export const defaultAvatar = () => brivioSymbol()

export const SOCIAL_MODES: { id: SocialMode, label: string }[] = [
    { id: 'profile', label: 'Perfil' }, { id: 'post', label: 'Publicação' }, { id: 'story', label: 'Stories' },
    { id: 'reel', label: 'Reel' }, { id: 'grid', label: 'Grelha' },
]
