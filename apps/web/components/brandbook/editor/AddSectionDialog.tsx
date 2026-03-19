"use client"

import { Clipboard } from "lucide-react"

import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Type,
    Image as ImageIcon,
    Video,
    Mic,
    List,
    AlignJustify,
    MousePointerClick,
    CreditCard,
    Grid,
    Palette,
    Heading,
    Box,
    Download,
    Check,
    Figma,
    Minus,
    ArrowUpDown,
    CheckSquare,
    SeparatorVertical,
    Images,
    GalleryHorizontal,
    PanelLeft
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AddSectionDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSelectBlock: (type: string, variant?: string) => void
    title?: string
    onPaste?: () => void
    hasClipboard?: boolean
    onClearClipboard?: () => void
}

const SECTION_CATEGORIES = [
    { id: 'layout', label: 'Layout' },
    { id: 'basic', label: 'Basic' },
    { id: 'image', label: 'Image' },
    { id: 'media', label: 'Media' },
    { id: 'others', label: 'Outros' },
]

const BLOCK_OPTIONS: Record<string, { id: string, label: string, icon: any, type: string, variant?: string }[]> = {
    layout: [
        { id: 'col-1', label: '1 Coluna', icon: Box, type: 'layout', variant: '1-col' },
        { id: 'col-2', label: '2 Colunas', icon: Box, type: 'layout', variant: '2-col' },
        { id: 'col-3', label: '3 Colunas', icon: Box, type: 'layout', variant: '3-col' },
        { id: 'col-4', label: '4 Colunas', icon: Box, type: 'layout', variant: '4-col' }
    ],
    basic: [
        { id: 'headline', label: 'Headline', icon: Heading, type: 'text', variant: 'h1' },
        { id: 'text', label: 'Text', icon: Type, type: 'text', variant: 'p' },
        { id: 'text-card', label: 'TextCard', icon: CreditCard, type: 'card', variant: 'text' },
        { id: 'button', label: 'Button', icon: MousePointerClick, type: 'interactive', variant: 'button' },
        { id: 'color', label: 'Color', icon: Palette, type: 'palette' },
        { id: 'image-text', label: 'Image-Text', icon: PanelLeft, type: 'composite', variant: 'image-text' },
        { id: 'list-text', label: 'Lista de texto', icon: List, type: 'list' }
    ],
    image: [
        { id: 'image', label: 'Image', icon: ImageIcon, type: 'image' },
        { id: 'gallery', label: 'Gallery', icon: Images, type: 'gallery' },
        { id: 'carousel', label: 'Carossel', icon: GalleryHorizontal, type: 'carousel' }
    ],
    media: [
        { id: 'video', label: 'Video', icon: Video, type: 'video' },
        { id: 'video-text', label: 'Video-Text', icon: Video, type: 'composite', variant: 'video-text' },
        { id: 'audio', label: 'Audio', icon: Mic, type: 'audio' },
        { id: 'list-text-media', label: 'Lista de texto', icon: List, type: 'list' }
    ],
    others: [
        { id: 'download', label: 'Download', icon: Download, type: 'download' },
        { id: 'figma', label: 'Figma', icon: Figma, type: 'embed', variant: 'figma' },
        { id: 'separator-h', label: 'Separador Horizontal', icon: Minus, type: 'separator', variant: 'horizontal' },
        { id: 'snippet', label: 'Snippet', icon: ArrowUpDown, type: 'code' },
        { id: 'do-dont', label: 'Fazer e Não fazer', icon: CheckSquare, type: 'list', variant: 'do-dont' },
        { id: 'separator-v', label: 'Separador Vertical', icon: SeparatorVertical, type: 'separator', variant: 'vertical' },
        { id: 'list-text-others', label: 'Lista de texto', icon: List, type: 'list' }
    ]
}

export function AddSectionDialog({ isOpen, onOpenChange, onSelectBlock, title, onPaste, hasClipboard, onClearClipboard }: AddSectionDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {/* Added [&>button]:hidden to remove default close icon */}
            <DialogContent className="max-w-[732px] h-[335px] p-0 bg-[#15161B] border-none text-white overflow-hidden shadow-2xl gap-0 [&>button]:hidden flex flex-col">
                <DialogDescription className="sr-only">Add a new section to your brandbook</DialogDescription>
                {/* 1. Custom Header: 60px height, #FF0054 bg, 30px padding */}
                <div className="bg-[#FF0054] h-[60px] px-[30px] flex items-center justify-between shrink-0">
                    <DialogTitle className="text-xl font-bold text-white">{title || "Add Section"}</DialogTitle>
                    <DialogClose className="text-white hover:text-white/80 transition-opacity">
                        {/* Perfect circle 20x20px, NO ICON inside */}
                        <div className="bg-white rounded-full w-[20px] h-[20px]" />
                    </DialogClose>
                </div>

                {/* Paste Section if clipboard has data */}
                {hasClipboard && onPaste && (
                    <div className="bg-[#1A1A20] px-[30px] py-[10px] border-b border-[#333] flex gap-2">
                        <button
                            onClick={() => {
                                onPaste()
                                onOpenChange(false)
                            }}
                            className="flex-1 bg-[#15161B] border border-dashed border-[#FF0054]/50 rounded-[5px] h-[40px] flex items-center justify-center gap-3 hover:bg-[#2A2A35] transition-all text-[#FF0054] font-semibold text-sm"
                        >
                            <Clipboard className="w-4 h-4" />
                            <span>Paste Section from Clipboard</span>
                        </button>
                        <button
                            onClick={() => onClearClipboard?.()}
                            className="w-[40px] h-[40px] bg-[#15161B] border border-[#333] rounded-[5px] flex items-center justify-center text-gray-500 hover:text-[#00FF94] hover:bg-[#00FF94]/10 hover:border-[#00FF94]/50 transition-all"
                            title="Clear Clipboard"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Tabs Content - Fill remaining height */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Tabs defaultValue="layout" className="w-full h-full flex flex-col">
                        {/* 2. Selector Modal (TabsList): 50px height, #141414 bg, Left aligned, 30px padding */}
                        <div className="bg-[#141414] h-[50px] flex items-center px-[30px] shrink-0">
                            <TabsList className="bg-transparent justify-start border-none p-0 w-full h-full gap-8">
                                {SECTION_CATEGORIES.map(category => (
                                    <TabsTrigger
                                        key={category.id}
                                        value={category.id}
                                        className="data-[state=active]:text-[#FF0054] data-[state=active]:shadow-none data-[state=active]:bg-transparent text-text-secondary text-[12px] font-medium px-0 h-full border-b-2 border-transparent data-[state=active]:border-[#FF0054] rounded-none transition-all uppercase tracking-wide"
                                    >
                                        {category.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* 3. Visualizer (Content): #15161B bg, 30px padding */}
                        <div className="flex-1 overflow-y-auto bg-[#15161B] p-[30px]">
                            {SECTION_CATEGORIES.map(category => (
                                <TabsContent key={category.id} value={category.id} className="mt-0 h-full">
                                    <div
                                        className={cn(
                                            "gap-4 pb-8",
                                            category.id === 'layout'
                                                ? "grid grid-cols-2 md:grid-cols-4"
                                                : "flex flex-wrap content-start"
                                        )}
                                    >
                                        {BLOCK_OPTIONS[category.id]?.map((option) => {
                                            if (category.id === 'layout') {
                                                const cols = parseInt(option.variant?.split('-')[0] || '1')
                                                // Create array of N-1 dividers
                                                const dividers = Array.from({ length: cols - 1 })

                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            onSelectBlock(option.type, option.variant)
                                                            onOpenChange(false)
                                                        }}
                                                        className="w-[160px] h-[100px] rounded-[6px] border-[0.5px] border-[#36383C] relative group hover:border-[#FF0054] transition-colors bg-transparent p-0 overflow-hidden"
                                                    >
                                                        {dividers.map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="absolute top-0 bottom-0 w-[0.5px] bg-[#36383C] group-hover:bg-[#FF0054] transition-colors"
                                                                style={{ left: `${(i + 1) * (100 / cols)}%` }}
                                                            />
                                                        ))}
                                                    </button>
                                                )
                                            }

                                            // New Horizontal Card for others
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        onSelectBlock(option.type, option.variant)
                                                        onOpenChange(false)
                                                    }}
                                                    className="w-[212px] h-[40px] rounded-[5px] border border-[#1B1C21] p-0 flex items-center overflow-hidden hover:border-[#FF0054] transition-colors group text-left"
                                                >
                                                    {/* Icon Container: 65px width, #313340 bg */}
                                                    <div className="w-[65px] h-full bg-[#313340] flex items-center justify-center text-white/70 group-hover:text-[#FF0054] transition-colors shrink-0">
                                                        <option.icon className="w-5 h-5" />
                                                    </div>

                                                    {/* Text Container: 146px width */}
                                                    <div className="w-[146px] h-full flex items-center pl-3">
                                                        <span className="text-[14px] font-light text-text-secondary group-hover:text-white transition-colors truncate">
                                                            {option.label}
                                                        </span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                        {/* Empty State */}
                                        {(!BLOCK_OPTIONS[category.id] || BLOCK_OPTIONS[category.id].length === 0) && (
                                            <div className="col-span-full w-full flex flex-col items-center justify-center h-48 text-text-tertiary">
                                                <Box className="w-12 h-12 mb-4 opacity-20" />
                                                <p>No items available in this category yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
