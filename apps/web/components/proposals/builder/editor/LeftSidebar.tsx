"use client"

import React, { useState } from "react"
import {
    Plus,
    MoreVertical,
    FileText,
    Image as ImageIcon,
    Palette,
    Type,
    LayoutGrid,
    Download,
    GripVertical,
    Search,
    Eye,
    Trash,
    Monitor
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useBrandDesign } from "./BrandDesignContext"
import { AddPagesModal } from "./AddPagesModal"

interface LeftSidebarProps {
    modules: any[]
    activeModuleId: string | null
    onSelectModule: (id: string) => void
    onAddModule: (type: string) => void
    onRenameModule?: (id: string, newTitle: string) => void
    onDuplicateModule?: (id: string) => void
    onDeleteModule?: (id: string) => void
    onToggleVisibility?: (id: string) => void
    onToggleLock?: (id: string) => void
    onToggleFullscreen?: (id: string) => void
    // New props for Add Pages modal
    brandName?: string
    brandId?: string
    onPagesAdded?: (modules: any[]) => void
    isReadOnly?: boolean
}

const CATEGORIES = [
    {
        id: 'overview',
        label: 'Visão geral',
        pages: ['Introdução', 'Sobre a Brivio', 'Metodologia'],
        subCategories: null
    },
    {
        id: 'scope',
        label: 'Escopo & Prazos',
        pages: ['Escopo do Projeto', 'Cronograma Estimado'],
        subCategories: null
    },
    {
        id: 'pricing',
        label: 'Investimento',
        pages: ['Investimento', 'Condições de Pagamento'],
        subCategories: null
    },
    {
        id: 'social_proof',
        label: 'Provas Sociais',
        pages: ['Case de Sucesso', 'Depoimentos'],
        subCategories: null
    },
    {
        id: 'closing',
        label: 'Fechamento',
        pages: ['Próximos Passos', 'Termos e Condições'],
        subCategories: null
    }
]

// Determine Module Icon based on type (generic mapping for now)
const getModuleIcon = (type: string) => {
    if (['logo', 'photography', 'illustration', 'graphics', 'visual', 'visual_id', 'offline'].includes(type)) return ImageIcon
    if (['palette'].includes(type)) return Palette
    if (['typography', 'verbal', 'voice_tone', 'naming'].includes(type)) return Type
    if (['grid', 'layout'].includes(type)) return LayoutGrid
    if (['download_center'].includes(type)) return Download
    if (['digital', 'motion'].includes(type)) return Monitor
    return FileText
}

function PageSettingsPopover({
    module,
    onRename,
    onDuplicate,
    onDelete,
    onToggleVisibility,
    onToggleLock,
    onToggleFullscreen,
    isOpen,
    onOpenChange
}: {
    module: any
    onRename?: (val: string) => void
    onDuplicate?: () => void
    onDelete?: () => void
    onToggleVisibility?: () => void
    onToggleLock?: () => void
    onToggleFullscreen?: () => void
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [tempTitle, setTempTitle] = useState(module.title)

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    className="p-1 hover:bg-black/5 rounded-sm text-gray-400 hover:text-gray-900 transition-colors"
                    onClick={(e) => { e.stopPropagation(); }}
                >
                    <MoreVertical className="w-3.5 h-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="right"
                align="start"
                className="w-[280px] bg-[#111116] border border-[#222] p-0 text-white rounded-lg shadow-2xl overflow-hidden z-50 ml-2"
                sideOffset={10}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header matches image 2 pink header */}
                <div className="bg-[#FF0054] h-10 px-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Page settings</span>
                    <div className="w-2 h-2 rounded-full bg-[#111116]" />
                </div>

                <div className="p-4 space-y-4">
                    {/* Rename */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-medium block">Rename</label>
                        <Input
                            value={tempTitle}
                            onChange={(e) => {
                                setTempTitle(e.target.value)
                                onRename?.(e.target.value)
                            }}
                            className="bg-transparent border-t-0 border-x-0 border-b border-[#333] rounded-none px-0 h-8 text-sm focus-visible:ring-0 focus-visible:border-[#FF0054] text-gray-300 placeholder:text-gray-600 w-full"
                            placeholder="Page name"
                        />
                    </div>

                    {/* Duplicate */}
                    <button
                        onClick={onDuplicate}
                        className="w-full text-left text-sm text-gray-400 hover:text-white py-2 border-b border-[#222] transition-colors"
                    >
                        Duplicate
                    </button>

                    {/* Toggles */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Hide page</span>
                            <Switch
                                checked={module.isHidden}
                                onCheckedChange={onToggleVisibility}
                                className="data-[state=checked]:bg-[#FF0054]"
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-[#222] pb-4">
                            <span className="text-sm text-gray-400">Password protected</span>
                            <Switch
                                checked={module.isLocked}
                                onCheckedChange={onToggleLock}
                                className="data-[state=checked]:bg-[#FF0054]"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-gray-400">Full screen</span>
                            <Switch
                                checked={module.isFullscreen}
                                onCheckedChange={onToggleFullscreen}
                                className="data-[state=checked]:bg-[#FF0054]"
                            />
                        </div>
                    </div>

                    {/* Delete */}
                    <div className="pt-4 flex justify-between items-center">
                        <button
                            onClick={onDelete}
                            className="text-[#FF0054] hover:text-[#D90046] text-sm transition-colors"
                        >
                            Delete page
                        </button>
                        <Trash className="w-4 h-4 text-gray-600" />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function SidebarItem({ module, isActive, onSelect, isReadOnly, customStyle, ...actions }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: module.id,
        disabled: isReadOnly
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const [isHovered, setIsHovered] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Image 1 reference: Simple item but on hover shows floating controls
    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            /* Added min-h to prevent layout shift */
            className={cn(
                "group relative flex items-center justify-between py-1.5 px-3 pl-8 cursor-pointer transition-colors text-sm mb-[1px] min-h-[32px]",
                isActive
                    ? "text-[#ff0054] font-bold"
                    : "text-gray-600 hover:text-gray-900",
                isReadOnly && "cursor-default"
            )}
        >
            <div className="flex items-center gap-2 overflow-hidden w-full relative">
                {/* Drag Handle - only visible on hover (left of text) and if not read-only */}
                {!isReadOnly && (
                    <div {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 absolute -left-5">
                        <GripVertical className="w-3 h-3" />
                    </div>
                )}

                <span
                    className="truncate select-none"
                    style={isActive ? { ...customStyle, color: '#ff0054' } : customStyle}
                >
                    {module.title}
                </span>
            </div>

            {/* Hover Floating Menu (Image 1 style) - Hidden in read-only mode */}
            {(!isReadOnly && (isHovered || isMenuOpen)) && (
                <div
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center bg-[#EDEDED] rounded-md shadow-sm px-1.5 py-0.5 gap-2 animate-in fade-in duration-150 z-20 border border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center" title="Add sub-page">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        className="text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center"
                        title="View"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-3 bg-gray-300/50" />

                    <PageSettingsPopover
                        module={module}
                        isOpen={isMenuOpen}
                        onOpenChange={(open) => {
                            setIsMenuOpen(open)
                            if (!open) setIsHovered(false) // Reset hover on close
                        }}
                        onRename={(v) => actions.onRenameModule?.(module.id, v)}
                        onDuplicate={() => actions.onDuplicateModule?.(module.id)}
                        onDelete={() => actions.onDeleteModule?.(module.id)}
                        onToggleVisibility={() => actions.onToggleVisibility?.(module.id)}
                        onToggleLock={() => actions.onToggleLock?.(module.id)}
                        onToggleFullscreen={() => actions.onToggleFullscreen?.(module.id)}
                    />
                </div>
            )}
        </div>
    )
}

export function LeftSidebar({
    modules,
    activeModuleId,
    onSelectModule,
    onAddModule,
    onRenameModule,
    onDuplicateModule,
    onDeleteModule,
    onToggleVisibility,
    onToggleLock,
    onToggleFullscreen,
    brandName = '',
    brandId = '', // Renamed for clarity in builder context
    onPagesAdded,
    isReadOnly = false
}: LeftSidebarProps) {
    // Categories collapsed by default
    const [openCategories, setOpenCategories] = useState<string[]>([])
    const [isAddPagesModalOpen, setIsAddPagesModalOpen] = useState(false)
    const { getStyleById, settings } = useBrandDesign()
    const menuStyle = getStyleById('menu')

    const sidebarTextStyle = menuStyle ? {
        fontFamily: menuStyle.font,
        fontWeight: menuStyle.weight,
        letterSpacing: `${menuStyle.spacing}em`,
        lineHeight: menuStyle.height,
        fontSize: `${menuStyle.size}px`,
        color: menuStyle.color,
        textTransform: menuStyle.casing === 'capitalize' ? 'capitalize' : (menuStyle.casing === 'uppercase' ? 'uppercase' : (menuStyle.casing === 'lowercase' ? 'lowercase' : 'none'))
    } as React.CSSProperties : {}

    // Group modules by title matching
    const getModulesForPages = (pageNames: string[]) => {
        return modules.filter(m =>
            pageNames.some(pageName =>
                m.title?.toLowerCase() === pageName.toLowerCase()
            )
        )
    }

    // Check if a category or sub-category has any matching pages
    const categoryHasPages = (category: typeof CATEGORIES[0]) => {
        const directPages = getModulesForPages(category.pages)
        if (directPages.length > 0) return true

        if (category.subCategories) {
            return category.subCategories.some(sub =>
                getModulesForPages(sub.pages).length > 0
            )
        }
        return false
    }

    const sharedActions = {
        onRenameModule,
        onDuplicateModule,
        onDeleteModule,
        onToggleVisibility,
        onToggleLock,
        onToggleFullscreen
    }

    // Render pages list
    const renderPagesList = (pageModules: any[]) => (
        <div className="space-y-[1px]">
            <SortableContext items={pageModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                {pageModules.map(module => (
                    <SidebarItem
                        key={module.id}
                        module={module}
                        isActive={module.id === activeModuleId}
                        onSelect={() => onSelectModule(module.id)}
                        customStyle={sidebarTextStyle}
                        isReadOnly={isReadOnly}
                        {...sharedActions}
                    />
                ))}
            </SortableContext>
        </div>
    )

    return (
        <>
            <div
                className="w-64 h-full border-r border-[#EBEBEB] flex flex-col flex-shrink-0 select-none transition-colors duration-300"
                style={{ backgroundColor: settings.menu_background }}
            >
                {/* Header / Logo Area */}
                <div className="p-8 flex flex-col items-center pb-6">
                    <div className="w-[80px] h-[80px] rounded-full bg-gradient-brand shadow-lg shadow-purple-500/20" />
                </div>

                {/* Search + Add Button */}
                {/* Search + Add Button - Add Button hidden in read-only */}
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar"
                                className="w-full bg-[#EAEAEA] border-none rounded-md py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FF0054]"
                            />
                        </div>
                        {!isReadOnly && (
                            <button
                                onClick={() => setIsAddPagesModalOpen(true)}
                                className="w-9 h-9 flex items-center justify-center bg-[#FF0054] hover:bg-[#E60049] rounded-md transition-colors"
                                title="Adicionar páginas"
                            >
                                <Plus className="w-4 h-4 text-white" />
                            </button>
                        )}
                    </div>
                </div>

                <ScrollArea className="flex-1 px-3">
                    <Accordion type="multiple" value={openCategories} onValueChange={setOpenCategories} className="w-full space-y-2">
                        {CATEGORIES.map(category => {
                            // Skip categories without any pages
                            if (!categoryHasPages(category)) return null

                            const directModules = getModulesForPages(category.pages)

                            return (
                                <AccordionItem key={category.id} value={category.id} className="border-none">
                                    <AccordionTrigger className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 hover:no-underline rounded-sm transition-colors mb-1 [&[data-state=open]]:text-gray-900">
                                        {category.label}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-2">
                                        {/* Direct pages under this category */}
                                        {directModules.length > 0 && renderPagesList(directModules)}

                                        {/* Sub-categories */}
                                        {category.subCategories && (
                                            <Accordion type="multiple" defaultValue={category.subCategories.map(s => s.id)} className="mt-1">
                                                {category.subCategories.map(subCategory => {
                                                    const subModules = getModulesForPages(subCategory.pages)
                                                    if (subModules.length === 0) return null

                                                    return (
                                                        <AccordionItem key={subCategory.id} value={subCategory.id} className="border-none ml-2">
                                                            <AccordionTrigger className="px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 hover:no-underline rounded-sm transition-colors [&[data-state=open]]:text-gray-800">
                                                                {subCategory.label}
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pt-0 pb-1">
                                                                {renderPagesList(subModules)}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    )
                                                })}
                                            </Accordion>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </ScrollArea>

                {/* User Profile / Bottom */}
                <div className="p-4 border-t border-[#EBEBEB] mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                            {/* Placeholder Avatar */}
                            <div className="w-full h-full bg-gradient-to-tr from-gray-200 to-gray-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">User Name</span>
                            <span className="text-[10px] text-gray-500">Editor</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Pages Modal */}
            <AddPagesModal
                isOpen={isAddPagesModalOpen}
                onClose={() => setIsAddPagesModalOpen(false)}
                proposalIdentifier={brandName}
                proposalId={brandId}
                existingPageTitles={modules.map(m => m.title)}
                onPagesAdded={onPagesAdded}
            />
        </>
    )
}
