"use client"

import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
    Heading,
    Type,
    CreditCard,
    MousePointerClick,
    Palette,
    Image as ImageIcon,
    PanelLeft,
    Video,
    Mic,
    Download,
    Images,
    GalleryHorizontal,
    Figma,
    Minus,
    ArrowUpDown,
    CheckSquare,
    SeparatorVertical,
    List,
    LayoutTemplate,
    Table,
    ClipboardList,
    Milestone
} from "lucide-react"

interface AddItemDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSelectBlock: (type: string, variant?: string) => void
}

// Full list of items derived from design system overlap
const ITEMS = [
    { id: 'headline', label: 'Headline', icon: Heading, type: 'heading', variant: 'h1' },
    { id: 'text', label: 'Text', icon: Type, type: 'text', variant: 'p' },
    { id: 'text-card', label: 'TextCard', icon: CreditCard, type: 'card', variant: 'text' },

    { id: 'button', label: 'Button', icon: MousePointerClick, type: 'button' },
    { id: 'color', label: 'Color', icon: Palette, type: 'palette' },
    { id: 'image', label: 'Image', icon: ImageIcon, type: 'image' },

    { id: 'image-text', label: 'Image with text', icon: LayoutTemplate, type: 'composite', variant: 'image-text' },
    { id: 'video', label: 'Video', icon: Video, type: 'video' },
    { id: 'video-text', label: 'Video-Text', icon: Video, type: 'composite', variant: 'video-text' },

    { id: 'audio', label: 'Audio', icon: Mic, type: 'audio' },
    { id: 'download', label: 'Download', icon: Download, type: 'download' },
    { id: 'gallery', label: 'Gallery', icon: Images, type: 'gallery' },

    { id: 'carousel', label: 'Carossel', icon: GalleryHorizontal, type: 'carousel' },
    { id: 'figma', label: 'Figma', icon: Figma, type: 'embed', variant: 'figma' },
    { id: 'separator-h', label: 'Separador Horizontal', icon: Minus, type: 'separator', variant: 'horizontal' },

    { id: 'snippet', label: 'Snippet', icon: ArrowUpDown, type: 'code' },
    { id: 'do-dont', label: 'Fazer e Não fazer', icon: CheckSquare, type: 'list', variant: 'do-dont' },
    { id: 'separator-v', label: 'Separador Vertical', icon: SeparatorVertical, type: 'separator', variant: 'vertical' },

    { id: 'list', label: 'Lista de texto', icon: List, type: 'list' },
    { id: 'pricing-table', label: 'Tabela de Preços', icon: Table, type: 'pricing-table' },
    { id: 'scope-list', label: 'Lista de Escopo', icon: ClipboardList, type: 'scope-list' },
    { id: 'timeline', label: 'Timeline', icon: Milestone, type: 'timeline' }
]

export function AddItemDialog({ isOpen, onOpenChange, onSelectBlock }: AddItemDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {/* Added [&>button]:hidden to remove default close icon */}
            <DialogContent className="max-w-[732px] p-0 bg-[#15161B] border-none text-white overflow-hidden shadow-2xl gap-0 [&>button]:hidden flex flex-col items-start translate-y-[-50%] top-[50%]">
                <DialogDescription className="sr-only">Choose an element to add to the section</DialogDescription>
                {/* 2. Header: 60px height, #FF0054 bg */}
                <div className="bg-[#FF0054] h-[60px] w-full px-[24px] flex items-center justify-between shrink-0">
                    <DialogTitle className="text-xl font-bold text-white">Add Element</DialogTitle>
                    <DialogClose className="text-white hover:text-white/80 transition-opacity outline-none ring-0">
                        {/* Perfect circle 20x20px, NO ICON inside */}
                        <div className="bg-white rounded-full w-[20px] h-[20px]" />
                    </DialogClose>
                </div>

                {/* 3. Grid Container: Padding 30px */}
                <div className="w-full p-[30px] grid grid-cols-3 gap-[16px] bg-[#15161B] max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onSelectBlock(item.type, item.variant)
                                onOpenChange(false)
                            }}
                            className="bg-transparent border border-[#333333] rounded-[5px] h-[55px] flex overflow-hidden hover:border-[#FF0054] transition-colors group"
                        >
                            {/* Icon Section (Left): ~60px width, #313340 bg */}
                            <div className="w-[60px] h-full bg-[#313340] border-r border-[#333333] flex items-center justify-center text-white/70 group-hover:text-[#FF0054] transition-colors shrink-0">
                                <item.icon className="w-[24px] h-[24px]" />
                            </div>

                            {/* Text Section (Right): Flex-grow, Centered Text */}
                            <div className="flex-1 h-full flex items-center justify-center px-2">
                                <span className="text-[14px] text-gray-300 group-hover:text-white transition-colors text-center font-medium truncate">
                                    {item.label}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Optional Footer with Cancel - User mentioned visual feedback but not explicit footer logic request, 
                    but since header has close, footer cancel is redundant unless requested. 
                    I'll add a simple cancel text button at bottom if needed, but the design didn't specify footer height. 
                    I'll stick to clean grid unless requested. */}
            </DialogContent>
        </Dialog>
    )
}
