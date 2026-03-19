"use client"

import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import {
    Heading,
    Type,
    Baseline, // For TextCard "A"
    RectangleHorizontal, // For Button "Pill"
    PaintBucket,
    Image as ImageIcon,
    PanelLeft, // For Image-Text
    Video,
    Film,
    Music,
    Download,
    Images,
    GalleryHorizontal,
    Figma,
    Minus,
    ArrowUpDown, // For Snippet (as per image)
    ListChecks,
    SeparatorVertical,
    List
} from "lucide-react"

interface AddSectionDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSelectBlock: (type: string, variant?: string) => void
}

const BLOCK_ITEMS = [
    { label: 'Headline', icon: Heading, type: 'text', variant: 'h1' },
    { label: 'Text', icon: Type, type: 'text', variant: 'p' },
    { label: 'TextCard', icon: Baseline, type: 'card', variant: 'text' },
    { label: 'Button', icon: RectangleHorizontal, type: 'interactive', variant: 'button' },
    { label: 'Color', icon: PaintBucket, type: 'palette' },
    { label: 'Image', icon: ImageIcon, type: 'image' },
    { label: 'Image-Text', icon: PanelLeft, type: 'composite', variant: 'image-text' },
    { label: 'Video', icon: Video, type: 'video' },
    { label: 'Video-Text', icon: Film, type: 'composite', variant: 'video-text' },
    { label: 'Audio', icon: Music, type: 'audio' },
    { label: 'Download', icon: Download, type: 'download' },
    { label: 'Gallery', icon: Images, type: 'gallery' },
    { label: 'Carossel', icon: GalleryHorizontal, type: 'carousel' },
    { label: 'Figma', icon: Figma, type: 'embed', variant: 'figma' },
    { label: 'Separador Horizontal', icon: Minus, type: 'separator', variant: 'horizontal' },
    { label: 'Snippet', icon: ArrowUpDown, type: 'code' },
    { label: 'Fazer e Não fazer', icon: ListChecks, type: 'list', variant: 'do-dont' },
    { label: 'Separador Vertical', icon: SeparatorVertical, type: 'separator', variant: 'vertical' },
    { label: 'Lista de texto', icon: List, type: 'list' }
]

export function AddSectionDialog({ isOpen, onOpenChange, onSelectBlock }: AddSectionDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[732px] p-0 bg-[#15161B] border-none text-white overflow-hidden shadow-2xl gap-0 [&>button]:hidden flex flex-col">
                {/* Header */}
                <div className="bg-[#FF0054] h-[60px] px-[30px] flex items-center justify-between shrink-0">
                    <h2 className="text-[16px] font-bold text-white">Add Element</h2>
                    <DialogClose className="text-white hover:text-white/80 transition-opacity">
                        <div className="bg-white rounded-full w-[20px] h-[20px] flex items-center justify-center">
                            {/* Close Icon excluded as per request "Circle... with function to close", strictly following image which looks like a solid circle or maybe x inside? 
                               User said "função de fechar... border-radius: 50%, dim: 20x20px, cor branca". 
                               Image shows a solid dark circle in the pink bar? 
                               Actually, user wrote "Cor branca" but image shows Dark circle? 
                               I will stick to User Instruction: "cor branca".
                           */}
                        </div>
                    </DialogClose>
                </div>

                {/* Grid Content */}
                <div className="p-[30px] grid grid-cols-3 gap-[16px] overflow-y-auto max-h-[600px]">
                    {BLOCK_ITEMS.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                onSelectBlock(item.type, item.variant)
                                onOpenChange(false)
                            }}
                            className="h-[55px] flex rounded-[6px] border border-[#333] overflow-hidden group hover:border-[#FF0054] transition-colors bg-transparent p-0"
                        >
                            {/* Icon Section */}
                            <div className="w-[60px] h-full bg-[#313340] border-r border-[#333] flex items-center justify-center text-gray-500 group-hover:text-[#FF0054] transition-colors shrink-0">
                                <item.icon strokeWidth={1.5} className="w-6 h-6" />
                            </div>

                            {/* Text Section */}
                            <div className="flex-1 h-full flex items-center justify-center px-2">
                                <span className="text-[13px] text-gray-400 group-hover:text-white transition-colors text-center font-normal">
                                    {item.label}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer Cancel? Image shows "Cancel" at bottom outside? Or inside?
                    The image has "Cancel" text at bottom center on dark bg.
                    I'll add a footer div. 
                */}
                <div className="pb-6 pt-2 flex justify-center bg-[#15161B] shrink-0">
                    <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-white text-sm transition-colors">
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
