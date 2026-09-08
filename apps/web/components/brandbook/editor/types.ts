export interface Block {
    id: string
    type: BlockType
    variant?: string // 'h1', 'p', 'list', '1-col', '2-col', 'figma', etc.
    content: any // Flexible content payload
    position?: { x: number; y: number } // For free-dragging mode
}

export type BlockType =
    | 'text'
    | 'headline'
    | 'image'
    | 'video'
    | 'audio'
    | 'gallery'
    | 'carousel'
    | 'button'
    | 'divider'
    | 'spacer'
    | 'layout'
    | 'embed'
    | 'code'
    | 'list'
    | 'composite'
    | 'card'
    | 'palette'
    | 'download'
    | 'separator'
    | 'interactive'
    | 'file'
    | 'story'

export interface EditorContent {
    blocks: Block[]
}

export type ClipboardItemType = 'section' | 'column' | 'block'

export interface BrivioClipboardItem {
    itemType: ClipboardItemType
    data: any
    label?: string
}

export type LinkType = 'url' | 'internal' | 'section'

export interface BlockLink {
    type: LinkType
    url?: string
    target?: '_blank' | '_self'
    moduleId?: string
    moduleTitle?: string
    sectionId?: string
    sectionTitle?: string
}

