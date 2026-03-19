export interface Block {
    id: string
    type: BlockType
    variant?: string // 'h1', 'p', 'list', '1-col', '2-col', 'figma', etc.
    content: any // Flexible content payload
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

export interface EditorContent {
    blocks: Block[]
}
