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
    EyeOff,
    Trash,
    Monitor,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { CATEGORIES, getEffectiveCategory } from "@/lib/brandbook-utils"
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
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useBrandDesign } from "./BrandDesignContext"
import { AddPagesModal } from "./AddPagesModal"

interface LeftSidebarProps {
    modules: any[]
    activeModuleId: string | null
    onSelectModule: (id: string) => void
    onAddModule: (type: string, categoryId?: string, customTitle?: string) => void
    onRenameModule?: (id: string, newTitle: string) => void
    onDuplicateModule?: (id: string) => void
    onDeleteModule?: (id: string) => void
    onToggleVisibility?: (id: string) => void
    onToggleLock?: (id: string) => void
    onToggleFullscreen?: (id: string) => void
    // New props for Add Pages modal
    brandName?: string
    brandbookId?: string
    onPagesAdded?: (modules: any[]) => void
    isReadOnly?: boolean
    isCollapsed?: boolean
    onToggleCollapse?: () => void
    userData?: {
        name: string
        avatar_url?: string
    } | null
    brandLogoUrl?: string | null
}

// Logic moved to @/lib/brandbook-utils.ts


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
                    className="p-1 hover:bg-black/5 rounded-sm text-black/40 hover:text-black transition-colors"
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
                    : "text-black hover:text-black",
                isReadOnly && "cursor-default"
            )}
        >
            {/* Drag Handle - only visible on hover (left of text) and if not read-only */}
            {!isReadOnly && (
                <div {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 z-10">
                    <GripVertical className="w-3.5 h-3.5" />
                </div>
            )}

            <div className="flex items-center gap-2 overflow-hidden w-full relative">
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
    brandbookId = '',
    onPagesAdded,
    isReadOnly = false,
    isCollapsed = false,
    onToggleCollapse,
    userData = null,
    brandLogoUrl = null
}: LeftSidebarProps) {
    // Categories collapsed by default, but open 'others' if it has pages
    const [openCategories, setOpenCategories] = useState<string[]>(['others'])
    const [isAddPagesModalOpen, setIsAddPagesModalOpen] = useState(false)
    const [filterCategory, setFilterCategory] = useState<string | null>(null)
    const { getStyleById, settings } = useBrandDesign()
    const menuStyle = getStyleById('menu')

    const sidebarTextStyle = menuStyle ? {
        fontFamily: menuStyle.font,
        fontWeight: menuStyle.weight,
        letterSpacing: `${menuStyle.spacing}em`,
        lineHeight: menuStyle.height,
        fontSize: `${menuStyle.size}px`,
        color: '#000000',
        textTransform: menuStyle.casing === 'capitalize' ? 'capitalize' : (menuStyle.casing === 'uppercase' ? 'uppercase' : (menuStyle.casing === 'lowercase' ? 'lowercase' : 'none'))
    } as React.CSSProperties : { color: '#000000' }

    // Modules categorized
    const modulesByCategory = React.useMemo(() => {
        const grouped: Record<string, any[]> = {}
        modules.forEach(m => {
            const cat = getEffectiveCategory(m)
            if (!grouped[cat]) grouped[cat] = []
            grouped[cat].push(m)
        })
        return grouped
    }, [modules])

    const isCategoryHidden = (catId: string) => {
        const targetModules: any[] = []
        const collect = (id: string) => {
            if (modulesByCategory[id]) targetModules.push(...modulesByCategory[id])
            const cat = CATEGORIES.find(c => c.id === id)
            if (cat?.subCategories) {
                cat.subCategories.forEach(sub => {
                    if (modulesByCategory[sub.id]) targetModules.push(...modulesByCategory[sub.id])
                })
            }
        }
        collect(catId)
        return targetModules.length > 0 && targetModules.every(m => m.isHidden)
    }

    const handleToggleCategoryVisibility = (catId: string) => {
        const targetModules: any[] = []
        const collect = (id: string) => {
            if (modulesByCategory[id]) targetModules.push(...modulesByCategory[id])
            const cat = CATEGORIES.find(c => c.id === id)
            if (cat?.subCategories) {
                cat.subCategories.forEach(sub => {
                    if (modulesByCategory[sub.id]) targetModules.push(...modulesByCategory[sub.id])
                })
            }
        }
        collect(catId)

        if (targetModules.length === 0) return

        const hasVisible = targetModules.some(m => !m.isHidden)
        targetModules.forEach(m => {
            if (m.isHidden === hasVisible) {
                onToggleVisibility?.(m.id)
            }
        })
    }

    const handleAddCustomPage = (catId: string) => {
        const title = prompt("Digite o nome da nova página:")
        if (title && title.trim()) {
            onAddModule('custom', catId, title.trim())
        }
    }

    const renderCategoryHeader = (catId: string, label: string) => {
        const isHidden = isCategoryHidden(catId)

        return (
            <div className="flex items-center justify-between w-full py-0.5 select-none">
                <div className="flex items-center gap-1.5 min-w-0">
                    <svg
                        viewBox="0 0 10 10"
                        className="w-2.5 h-2.5 fill-current shrink-0 transition-transform duration-200 text-black/60 group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90"
                    >
                        <path d="M1,3 L9,3 L5,7 Z" />
                    </svg>
                    <span className="truncate">{label}</span>
                </div>

                {!isReadOnly && (
                    <div
                        className="hidden group-hover:flex items-center bg-[#EAEAEA] rounded-md shadow-sm border border-gray-300 overflow-hidden ml-2 h-6"
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                    >
                        <div
                            role="button"
                            tabIndex={0}
                            className="h-full px-2 hover:bg-black/5 text-[#0F172A] hover:text-[#FF0054] transition-colors flex items-center justify-center border-r border-gray-300/60 cursor-pointer"
                            title="Adicionar página"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                setFilterCategory(catId)
                                setIsAddPagesModalOpen(true)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation()
                                    setFilterCategory(catId)
                                    setIsAddPagesModalOpen(true)
                                }
                            }}
                        >
                            <Plus className="w-3 h-3" />
                        </div>
                        <div
                            role="button"
                            tabIndex={0}
                            className="h-full px-2 hover:bg-black/5 text-[#0F172A] hover:text-[#FF0054] transition-colors flex items-center justify-center border-r border-gray-300/60 cursor-pointer"
                            title={isHidden ? "Mostrar seção" : "Ocultar seção"}
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleToggleCategoryVisibility(catId)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation()
                                    handleToggleCategoryVisibility(catId)
                                }
                            }}
                        >
                            {isHidden ? <EyeOff className="w-3 h-3 text-gray-400" /> : <Eye className="w-3 h-3" />}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className="h-full px-2 hover:bg-black/5 text-[#0F172A] hover:text-[#FF0054] transition-colors flex items-center justify-center cursor-pointer"
                                    title="Mais opções"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                    }}
                                >
                                    <MoreVertical className="w-3 h-3" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-[#111116] border border-[#222] text-white rounded-lg shadow-xl p-1 z-[2500]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DropdownMenuItem
                                    className="hover:bg-[#FF0054] hover:text-white px-3 py-1.5 text-xs rounded-sm cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddCustomPage(catId)
                                    }}
                                >
                                    Adicionar página personalizada
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        )
    }

    const sharedActions = {
        onRenameModule,
        onDuplicateModule,
        onDeleteModule,
        onToggleVisibility,
        onToggleLock,
        onToggleFullscreen
    }

    // Render pages list for a specific category
    const renderPagesList = (categoryId: string) => {
        const pageModules = modulesByCategory[categoryId] || []

        return (
            <SortableContext
                id={categoryId}
                items={pageModules.map(m => m.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-[1px] min-h-[8px]">
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
                    {/* Empty category drop area if no modules */}
                    {pageModules.length === 0 && (
                        <div className="h-2 rounded-sm" />
                    )}
                </div>
            </SortableContext>
        )
    }

    return (
        <>
            <div
                className={cn(
                    "relative h-full flex flex-col flex-shrink-0 select-none transition-all duration-300 ease-in-out z-[1500]",
                    isCollapsed ? "w-0" : "w-64"
                )}
                style={{ backgroundColor: settings.menu_background }}
            >
                {/* Collapse Toggle - Positioned on the right edge/joint */}
                <button
                    onClick={onToggleCollapse}
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-black/40 hover:text-[#FF0054] shadow-md z-[2000] transition-all duration-300",
                        isCollapsed ? "left-2" : "-right-3"
                    )}
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                {!isCollapsed && (
                    <>
                        {/* Header / Logo Area */}
                        <div className="p-8 flex flex-col items-center pb-6">
                            {brandLogoUrl ? (
                                <div className="w-[80px] h-[80px] rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-lg shadow-purple-500/10">
                                    <img src={brandLogoUrl} alt={brandName} className="w-full h-full object-contain p-1" />
                                </div>
                            ) : (
                                <div className="w-[80px] h-[80px] rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
                                    {brandName ? brandName.charAt(0).toUpperCase() : ""}
                                </div>
                            )}
                        </div>

                        {/* Search + Add Button */}
                        <div className="px-4 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar"
                                        style={{ color: sidebarTextStyle.color }}
                                        className="w-full bg-[#EAEAEA] border-none rounded-md py-2 pl-9 pr-4 text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-[#FF0054]"
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
                                    const isParentWithSubcats = category.subCategories && category.subCategories.length > 0
                                    const hasDirectPages = (modulesByCategory[category.id]?.length || 0) > 0

                                    // Check if category or any of its subcategories has pages
                                    const hasSubPages = category.subCategories?.some(sub => (modulesByCategory[sub.id]?.length || 0) > 0)

                                    if (!hasDirectPages && !hasSubPages && !isParentWithSubcats) return null

                                    return (
                                        <AccordionItem key={category.id} value={category.id} className="border-none">
                                            <AccordionTrigger
                                                style={{ color: sidebarTextStyle.color }}
                                                className="group px-2 py-1 text-xs font-bold uppercase tracking-wider hover:no-underline rounded-sm transition-colors mb-1 opacity-90 hover:opacity-100 [&>svg]:hidden"
                                            >
                                                {renderCategoryHeader(category.id, category.label)}
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-0 pb-2">
                                                {/* Direct pages under this category */}
                                                {renderPagesList(category.id)}

                                                {/* Sub-categories */}
                                                {category.subCategories && (
                                                    <Accordion type="multiple" defaultValue={category.subCategories.map(s => s.id)} className="mt-1">
                                                        {category.subCategories.map(subCategory => {
                                                            return (
                                                                <AccordionItem key={subCategory.id} value={subCategory.id} className="border-none ml-2">
                                                                    <AccordionTrigger
                                                                        style={{ color: sidebarTextStyle.color }}
                                                                        className="group px-2 py-1 text-[11px] font-semibold hover:no-underline rounded-sm transition-colors opacity-90 hover:opacity-100 [&>svg]:hidden"
                                                                    >
                                                                        {renderCategoryHeader(subCategory.id, subCategory.label)}
                                                                    </AccordionTrigger>
                                                                    <AccordionContent className="pt-0 pb-1">
                                                                        {renderPagesList(subCategory.id)}
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

                                {/* 2. Others Section */}
                                <AccordionItem value="others" className="border-none">
                                    <AccordionTrigger
                                        style={{ color: sidebarTextStyle.color }}
                                        className="group px-2 py-1 text-xs font-bold uppercase tracking-wider hover:no-underline rounded-sm transition-colors mb-1 opacity-90 hover:opacity-100 [&>svg]:hidden"
                                    >
                                        {renderCategoryHeader('others', 'Outras páginas')}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-2">
                                        {renderPagesList('others')}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </ScrollArea>

                        {/* User Profile / Bottom */}
                        <div className="p-4 border-t border-[#EBEBEB] mt-auto">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                                    {userData?.avatar_url ? (
                                        <img src={userData.avatar_url} alt={userData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#1E1F24] to-[#2D3039] text-white text-xs font-bold uppercase">
                                            {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium truncate max-w-[150px]" style={{ color: sidebarTextStyle.color }}>
                                        {userData?.name || "User Name"}
                                    </span>
                                    <span className="text-[10px] opacity-60" style={{ color: sidebarTextStyle.color }}>Editor</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Pages Modal */}
            <AddPagesModal
                isOpen={isAddPagesModalOpen}
                onClose={() => {
                    setIsAddPagesModalOpen(false)
                    setFilterCategory(null)
                }}
                brandName={brandName}
                brandbookId={brandbookId}
                existingPageTitles={modules.map(m => m.title)}
                onPagesAdded={onPagesAdded}
                filterCategory={filterCategory}
            />
        </>
    )
}
