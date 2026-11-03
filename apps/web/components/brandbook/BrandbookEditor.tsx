"use client"

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react"
import type { BackgroundFill } from "./editor/backgroundFill"
import { uploadBrandbookMedia } from "@/app/actions/brandbook"
import { toast } from "sonner"
import {
    DndContext,
    rectIntersection,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core"
import {
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Clock, SlidersHorizontal, Bell, Home, BookmarkPlus, Monitor, Smartphone } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"
import Image from "next/image"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

import { LeftSidebar } from "./editor/LeftSidebar"
import { SharedNavigation, NavigationGate } from "./editor/navigation/SharedNavigation"
import { AssetLibraryAccessProvider, AssetLibraryNavButton } from "./editor/navigation/AssetLibraryAccess"
import { CATEGORIES, getEffectiveCategory } from "@/lib/brandbook-utils"
import type { NavPage } from "./editor/BrandDesignContext"
import { MainCanvasWithHistory } from "./editor/MainCanvas"
import type { AnimationSettings } from "./editor/AnimatedBlock"
import type { ColumnData, ComponentKind } from "./editor/componentPresets"
import type { HoverEffect } from "./editor/hoverEffects"
import { DeleteConfirmationModal } from "./editor/DeleteConfirmationModal"
import { TemplateEditDock, TEMPLATE_MARK, type TemplateMark } from "./editor/TemplateEditDock"
import { TemplateBrandbookEditBar } from "./editor/TemplateBrandbookEditBar"
import { BrandbookFooter } from "./editor/BrandbookFooter"

const AssetLibrary = dynamic(() => import("./editor/AssetLibrary").then(m => m.AssetLibrary), { ssr: false })
const ComponentsLibrary = dynamic(() => import("./editor/ComponentsLibrary").then(m => m.ComponentsLibrary), { ssr: false })
const BrandSettingsPanel = dynamic(() => import("./editor/BrandSettingsPanel").then(m => m.BrandSettingsPanel), { ssr: false })
const SaveAsTemplateModal = dynamic(() => import("./editor/SaveAsTemplateModal").then(m => m.SaveAsTemplateModal), { ssr: false })
import { AnimationPanel } from "./editor/AnimationPanel"

import { createBrandbookModule, reorderModules, updateModuleContent, updateModule, updateModuleCategory, deleteModule, duplicateModule } from "@/app/actions/brandbook"
import { BrandDesignProvider } from "./editor/BrandDesignContext"
import { Block, EditorContent } from "./editor/types"



interface UserData {
    name: string
    avatar_url?: string
}

interface BrandbookModule {
    id: string
    brandbook_id: string
    title: string
    type: string
    order: number
    category: string
    content_json: Record<string, unknown>
    isHidden?: boolean
    isLocked?: boolean
    isFullscreen?: boolean
    created_at?: string
    updated_at?: string
}

interface BrandbookEditorProps {
    initialModules: BrandbookModule[]
    brandbookId: string
    brandId: string
    brandName?: string
    brandLogoUrl?: string | null
    isReadOnly?: boolean
    userData?: UserData | null
    isSuperAdmin?: boolean
}

export default function BrandbookEditor({
    initialModules,
    brandbookId,
    brandId,
    brandName = '',
    brandLogoUrl = null,
    isReadOnly = false,
    userData = null,
    isSuperAdmin = false
}: BrandbookEditorProps) {
    const router = useRouter()

    // Determine effective modules (either from props or defaults)
    const effectiveModules = initialModules


    const [items, setItems] = useState<BrandbookModule[]>(initialModules)
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(initialModules[0]?.id || null)

    // Block Selection State (Lifted up from MainCanvas)
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [isPreviewMode, setIsPreviewMode] = useState(isReadOnly)
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false)
    const [isComponentsLibraryOpen, setIsComponentsLibraryOpen] = useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
    const [responsiveDevice, setResponsiveDevice] = useState<'desktop' | 'widescreen' | 'mobile'>('widescreen')
    const [isResponsiveMenuOpen, setIsResponsiveMenuOpen] = useState(false)
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; moduleId: string | null }>({
        isOpen: false,
        moduleId: null
    })

    const [isAnimationPanelOpen, setIsAnimationPanelOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    // Element the Animar panel edits: the last selected one, kept when the selection is cleared
    // (clicks outside a block deselect it while the panel is still open)
    const [animationTargetId, setAnimationTargetId] = useState<string | null>(null)
    useEffect(() => {
        if (activeBlockId) setAnimationTargetId(activeBlockId)
    }, [activeBlockId])

    // Preview shows the page as visitors see it: drop the selection and close every editing panel
    useEffect(() => {
        if (!isPreviewMode) return
        setActiveBlockId(null)
        setIsSettingsPanelOpen(false)
        setIsAssetLibraryOpen(false)
        setIsComponentsLibraryOpen(false)
        setIsTemplateModalOpen(false)
        setIsAnimationPanelOpen(false)
        setIsResponsiveMenuOpen(false)
    }, [isPreviewMode])

    // DND State
    const [activeDragId, setActiveDragId] = useState<string | null>(null)

    // Persistence Refs
    const activeSaveTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
    const latestContentRef = useRef<Record<string, any>>({}) // Track latest content to avoid saving old versions
    // Modules with changes not sent yet, the per-module chain that sends them in order, and saves on the wire
    const pendingSavesRef = useRef<Set<string>>(new Set())
    const saveChainsRef = useRef<Record<string, Promise<void>>>({})
    const inFlightSavesRef = useRef(0)
    const saveFailuresRef = useRef<Record<string, number>>({})

    /**
     * Sends a module's latest content now. Saves of one module run one after another, so an older,
     * slower request can never land after (and overwrite) a newer one. A failed save is retried.
     */
    const saveModuleNow = useCallback((moduleId: string): Promise<void> => {
        if (activeSaveTimeouts.current[moduleId]) {
            clearTimeout(activeSaveTimeouts.current[moduleId])
            delete activeSaveTimeouts.current[moduleId]
        }
        if (!pendingSavesRef.current.has(moduleId)) return saveChainsRef.current[moduleId] || Promise.resolve()
        pendingSavesRef.current.delete(moduleId)

        const run = async () => {
            inFlightSavesRef.current++
            try {
                // Read at send time: always the most recent content of the module
                const result = await updateModuleContent(moduleId, latestContentRef.current[moduleId], brandId)
                if (!result.success) throw new Error(result.error)
                delete saveFailuresRef.current[moduleId]
            } catch (err) {
                console.error('[BrandbookEditor] Server save failed:', err)
                const failures = (saveFailuresRef.current[moduleId] || 0) + 1
                saveFailuresRef.current[moduleId] = failures
                if (failures === 1) toast.error('Não foi possível guardar as últimas alterações. A tentar de novo…')
                // Keep the change queued (unless a newer edit already queued it) and retry a few times
                if (failures <= 3 && !pendingSavesRef.current.has(moduleId)) {
                    pendingSavesRef.current.add(moduleId)
                    activeSaveTimeouts.current[moduleId] = setTimeout(() => { saveModuleNow(moduleId) }, 3000 * failures)
                } else if (failures > 3) {
                    toast.error('As alterações não foram guardadas. Verifique a ligação e edite de novo para tentar outra vez.')
                }
            } finally {
                inFlightSavesRef.current--
            }
        }

        const chain = (saveChainsRef.current[moduleId] || Promise.resolve()).then(run)
        saveChainsRef.current[moduleId] = chain
        return chain
    }, [brandId])

    /** Sends every queued change right away (leaving the page, hiding the tab, closing the editor) */
    const flushPendingSaves = useCallback(() => {
        return Promise.all(Array.from(pendingSavesRef.current).map(id => saveModuleNow(id)))
    }, [saveModuleNow])

    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (pendingSavesRef.current.size === 0 && inFlightSavesRef.current === 0) return
            flushPendingSaves()
            // Ask the browser to confirm leaving while the last changes are still being written
            e.preventDefault()
            e.returnValue = ''
        }
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushPendingSaves()
        }
        const onPageHide = () => { flushPendingSaves() }
        window.addEventListener('beforeunload', onBeforeUnload)
        window.addEventListener('pagehide', onPageHide)
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload)
            window.removeEventListener('pagehide', onPageHide)
            document.removeEventListener('visibilitychange', onVisibilityChange)
            // Leaving the editor inside the app: write whatever is still queued
            flushPendingSaves()
        }
    }, [flushPendingSaves])

    // Superadmins editing a brandbook template (opened from the templates modal with ?editTemplate=<id>)
    const [editTemplateId, setEditTemplateId] = useState<string | null>(null)
    useEffect(() => {
        setEditTemplateId(new URLSearchParams(window.location.search).get('editTemplate'))
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Derived state
    const activeModule = items.find(m => m.id === selectedModuleId) || null

    async function handleAddModule(type: string, categoryId?: string, customTitle?: string) {
        const order = items.length
        const result = await createBrandbookModule(brandbookId, type, order)

        if (result.success && result.module) {
            let finalModule = result.module

            if (customTitle || categoryId) {
                const updates: any = {}
                if (customTitle) updates.title = customTitle
                if (categoryId) updates.category = categoryId

                const { createClient } = require("@/lib/supabase/client")
                const supabase = createClient()
                const { data: updatedModule } = await supabase
                    .from('brandbook_modules')
                    .update(updates)
                    .eq('id', result.module.id)
                    .select()
                    .single()

                if (updatedModule) {
                    finalModule = updatedModule
                }
            }

            setItems([...items, finalModule])
            setSelectedModuleId(finalModule.id)
        }
    }

    const handleUpdateModule = (moduleId: string, newContent: any) => {
        console.log('[BrandbookEditor] Update requested for:', moduleId)

        // 1. Update local state immediately for UI responsiveness
        setItems(prev => prev.map(item =>
            item.id === moduleId
                ? { ...item, content_json: newContent }
                : item
        ))

        // 2. Track latest content in ref to ensure server save uses most recent data
        latestContentRef.current[moduleId] = newContent

        // 3. Debounced server save (flushed early when leaving the page or the editor)
        pendingSavesRef.current.add(moduleId)
        if (activeSaveTimeouts.current[moduleId]) {
            clearTimeout(activeSaveTimeouts.current[moduleId])
        }
        activeSaveTimeouts.current[moduleId] = setTimeout(() => { saveModuleNow(moduleId) }, 1500)
    }

    const handleRenameModule = async (moduleId: string, newTitle: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return

        // Preserve existing effective category so renaming does not kick module into 'others'
        const preservedCategory = item.category || getEffectiveCategory(item)

        setItems(prev => prev.map(m =>
            m.id === moduleId
                ? { ...m, title: newTitle, category: preservedCategory }
                : m
        ))

        await updateModule(moduleId, { title: newTitle, category: preservedCategory }, brandId)
    }

    const handleDuplicateModule = async (moduleId: string) => {
        const toastId = toast.loading("A duplicar a página…")
        const result = await duplicateModule(moduleId, brandId)
        if (result.success && result.module) {
            setItems(prev => [...prev, result.module])
            setSelectedModuleId(result.module.id)
            toast.success("Página duplicada", { id: toastId })
        } else {
            console.error("Failed to duplicate module:", result.error)
            toast.error("Erro ao duplicar a página.", { id: toastId })
        }
    }

    const handleDeleteModule = (moduleId: string) => {
        setDeleteModal({ isOpen: true, moduleId })
    }

    const confirmDelete = async () => {
        const moduleId = deleteModal.moduleId
        if (!moduleId) return

        setItems(prev => prev.filter(m => m.id !== moduleId))
        if (selectedModuleId === moduleId) {
            setSelectedModuleId(null)
        }

        // If it's a "new-" module not yet saved to DB, we just remove it from state
        if (moduleId.startsWith('new-')) return

        const result = await deleteModule(moduleId, brandId)
        if (!result.success) {
            console.error("Failed to delete module:", result.error)
            toast.error("Erro ao eliminar a página no servidor.")
        }
    }

    /** Moves a page to another separator / subseparator; the category is saved, so the new structure survives a reload */
    const handleMoveModuleToCategory = async (moduleId: string, categoryId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item || getEffectiveCategory(item) === categoryId) return
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, category: categoryId } : m))
        if (moduleId.startsWith('new-')) return
        const result = await updateModuleCategory(moduleId, categoryId, brandId)
        if (!result.success) toast.error('Não foi possível mover a página. Tente de novo.')
    }

    /** Deletes several pages at once (already confirmed by the caller, e.g. deleting the "Outras páginas" separator) */
    const handleDeleteModules = async (moduleIds: string[]) => {
        if (moduleIds.length === 0) return
        setItems(prev => prev.filter(m => !moduleIds.includes(m.id)))
        if (selectedModuleId && moduleIds.includes(selectedModuleId)) setSelectedModuleId(null)

        const results = await Promise.all(
            moduleIds.filter(id => !id.startsWith('new-')).map(id => deleteModule(id, brandId))
        )
        const failed = results.filter(r => !r.success).length
        if (failed) toast.error(`Não foi possível eliminar ${failed} ${failed === 1 ? 'página' : 'páginas'} no servidor.`)
    }

    const handleToggleVisibility = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newValue = !item.isHidden
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, isHidden: newValue } : m))
        await updateModule(moduleId, { isHidden: newValue }, brandId)
    }

    const handleToggleLock = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newValue = !item.isLocked
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, isLocked: newValue } : m))
        await updateModule(moduleId, { isLocked: newValue }, brandId)
    }

    const handleToggleFullscreen = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newValue = !item.isFullscreen
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, isFullscreen: newValue } : m))
        await updateModule(moduleId, { isFullscreen: newValue }, brandId)
    }

    const handleSelectComponent = (component: Block | ColumnData, kind: ComponentKind = 'section') => {
        if (!activeModule) return

        // Columns and blocks go to the editor clipboard: the canvas then shows its paste options
        // (inside sections for a column, inside columns for a block) so the user picks the spot
        if (kind !== 'section') {
            const clipboardItem = {
                itemType: kind,
                data: component,
                label: kind === 'column' ? 'Componente de coluna' : 'Componente de bloco',
            }
            try {
                localStorage.setItem('brivio_clipboard', JSON.stringify(clipboardItem))
            } catch { /* ignore */ }
            window.dispatchEvent(new CustomEvent('brivio_clipboard_update', { detail: clipboardItem }))
            toast.success(kind === 'column' ? "Coluna pronta a colar" : "Bloco pronto a colar", {
                description: kind === 'column'
                    ? "Use “Colar coluna copiada nesta seção” na secção onde a quer."
                    : "Use a opção de colar dentro da coluna onde o quer.",
            })
            return
        }

        const cloneWithNewId = (obj: any): any => {
            if (Array.isArray(obj)) return obj.map(item => cloneWithNewId(item))
            if (obj && typeof obj === 'object') {
                const newObj = { ...obj }
                if (newObj.id) newObj.id = Math.random().toString(36).substr(2, 9)
                for (const key in newObj) {
                    if (key !== 'id') newObj[key] = cloneWithNewId(newObj[key])
                }
                return newObj
            }
            return obj
        }

        const newBlock = cloneWithNewId(component)
        
        const editorContent = activeModule.content_json as any
        const newBlocks = [...(editorContent.blocks || []), newBlock]
        
        handleUpdateModule(activeModule.id, {
            ...editorContent,
            blocks: newBlocks
        })
    }

    /**
     * Superadmins: edit a ready-made template. It is placed like any component, marked as "being edited";
     * the dock at the bottom then saves it over the template.
     */
    const handleEditTemplate = (template: { id: string, name: string, description?: string, kind: ComponentKind, data: Block | ColumnData }) => {
        const mark: TemplateMark = { presetId: template.id, name: template.name, description: template.description, kind: template.kind }
        const data = JSON.parse(JSON.stringify(template.data))
        if (template.kind === 'section') data.content = { ...data.content, settings: { ...(data.content?.settings || {}), [TEMPLATE_MARK]: mark } }
        else if (template.kind === 'column') data.settings = { ...(data.settings || {}), [TEMPLATE_MARK]: mark }
        else data.content = { ...(data.content || {}), [TEMPLATE_MARK]: mark }
        handleSelectComponent(data, template.kind)
        toast.message('Template em edição', {
            description: template.kind === 'section'
                ? 'A secção foi adicionada ao fim da página. Edite-a e use «Guardar template» em baixo.'
                : 'Cole-o na página, edite-o e use «Guardar template» em baixo.',
        })
    }



    /**
     * Writes animation fields on the selected element: blocks/sections keep them in `content`,
     * columns in `settings` (a column id can be the selection when animating a column).
     */
    const updateActiveAnimation = (patch: { animation?: string, animationSettings?: AnimationSettings, hoverEffect?: HoverEffect }) => {
        if (!animationTargetId || !activeModule) return

        const updateBlocksRecursively = (blocks: Block[]): Block[] => {
            return blocks.map(block => {
                if (block.id === animationTargetId) {
                    return { ...block, content: { ...block.content, ...patch } }
                }
                if (block.type === 'layout' && block.content?.columns) {
                    return {
                        ...block,
                        content: {
                            ...block.content,
                            columns: block.content.columns.map((col: any) => ({
                                ...col,
                                settings: col.id === animationTargetId ? { ...col.settings, ...patch } : col.settings,
                                blocks: updateBlocksRecursively(col.blocks || [])
                            }))
                        }
                    }
                }
                return block
            })
        }

        const editorContent = activeModule.content_json as unknown as EditorContent
        const newBlocks = updateBlocksRecursively(editorContent.blocks || [])
        handleUpdateModule(activeModule.id, { ...editorContent, blocks: newBlocks })
    }

    const handleSelectAnimation = (animationId: string) => updateActiveAnimation({ animation: animationId })
    const handleAnimationSettingsChange = (animationSettings: AnimationSettings) => updateActiveAnimation({ animationSettings })
    const handleHoverEffectChange = (hoverEffect: HoverEffect) => updateActiveAnimation({ hoverEffect })

    const activeBlockAnimationState = useMemo(() => {
        if (!animationTargetId || !activeModule) return null

        type AnimationFields = { animation?: string, animationSettings?: AnimationSettings, hoverEffect?: HoverEffect }
        const findRecursively = (blocks: Block[]): AnimationFields | null => {
            for (const block of blocks) {
                if (block.id === animationTargetId) return block.content || {}
                if (block.type === 'layout' && block.content?.columns) {
                    for (const col of block.content.columns) {
                        if (col.id === animationTargetId) return col.settings || {}
                        const found = findRecursively(col.blocks || [])
                        if (found) return found
                    }
                }
            }
            return null
        }

        const editorContent = activeModule.content_json as unknown as EditorContent
        return findRecursively(editorContent.blocks || [])
    }, [animationTargetId, activeModule])
    const activeBlockAnimation = activeBlockAnimationState?.animation || null

    const activeSections = useMemo(() => {
        if (!activeModule?.content_json) return []
        const editorContent = activeModule.content_json as unknown as EditorContent
        const rawBlocks = editorContent.blocks || []
        return rawBlocks.map((block, idx) => {
            let label = ""
            if (block.content?.settings?.title) {
                label = block.content.settings.title
            } else if (block.type === 'heading' || block.type === 'headline') {
                label = block.content?.text || ""
            } else if (block.type === 'layout' && block.content?.columns) {
                for (const col of block.content.columns) {
                    const hBlock = (col.blocks || []).find((b: any) =>
                        b.type === 'heading' || b.type === 'headline' || (b.type === 'text' && ['h1', 'h2', 'h3'].includes(b.variant))
                    )
                    if (hBlock?.content?.text) {
                        label = hBlock.content.text
                        break
                    }
                }
            }
            if (!label && block.content?.text) {
                label = block.content.text
            }
            if (!label) {
                label = `Seção ${idx + 1}`
            } else if (label.length > 35) {
                label = label.substring(0, 35) + '...'
            }
            return {
                id: block.id,
                title: `Seção ${idx + 1}: ${label}`
            }
        })
    }, [activeModule])

    // Side-menu customizations live in localStorage (see LeftSidebar); read them so page groups carry the same labels
    const [menuCustomizations, setMenuCustomizations] = useState<{ names: Record<string, string>, deleted: string[] }>({ names: {}, deleted: [] })
    useEffect(() => {
        try {
            const names = JSON.parse(localStorage.getItem(`brandbook_${brandbookId}_custom_category_names`) || '{}')
            const deleted = JSON.parse(localStorage.getItem(`brandbook_${brandbookId}_deleted_subcategories`) || '[]')
            setMenuCustomizations({ names, deleted })
        } catch { /* keep defaults */ }
    }, [brandbookId])

    /** Pages in side-menu order (category, then its subcategories, then "Outras páginas"), each with its group label */
    const availableModules = useMemo<NavPage[]>(() => {
        const label = (id: string, fallback: string) => menuCustomizations.names[id] || fallback
        const groupOf = (m: BrandbookModule) => {
            const cat = getEffectiveCategory(m)
            return menuCustomizations.deleted.includes(cat) ? 'others' : cat
        }
        const order: { id: string, label: string }[] = []
        CATEGORIES.forEach(cat => {
            order.push({ id: cat.id, label: label(cat.id, cat.label) })
            cat.subCategories?.forEach(sub => order.push({ id: sub.id, label: label(sub.id, sub.label) }))
        })
        order.push({ id: 'others', label: label('others', 'Outras páginas') })
        const known = new Set(order.map(o => o.id))

        const pages: NavPage[] = []
        order.forEach(group => {
            items
                .filter(m => {
                    const g = groupOf(m)
                    return group.id === 'others' ? (g === 'others' || !known.has(g)) : g === group.id
                })
                .forEach(m => pages.push({ id: m.id, title: m.title || 'Sem título', group: group.label, isHidden: m.isHidden }))
        })
        return pages
    }, [items, menuCustomizations])

    return (
        <BrandDesignProvider
            brandId={brandId}
            modules={availableModules}
            selectedModuleId={selectedModuleId}
            onSelectModule={setSelectedModuleId}
            sections={activeSections}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={({ active }) => setActiveDragId(active.id as string)}
                onDragOver={({ active, over }) => {
                    if (!over) return // Ensure 'over' is not null
                    if (!over.id) return

                    const activeId = active.id as string
                    const overIdStr = over.id as string

                    // Get currently active item
                    const activeItem = items.find(i => i.id === activeId)
                    if (!activeItem) return

                    const currentCategory = getEffectiveCategory(activeItem)

                    // Possible category IDs from LeftSidebar
                    const categoryIds = [
                        ...CATEGORIES.flatMap(c => [c.id, ...(c.subCategories?.map(sub => sub.id) || [])]),
                        'others',
                    ]
                    const isOverContainer = categoryIds.includes(overIdStr)

                    let targetCategory = currentCategory

                    if (isOverContainer) {
                        targetCategory = overIdStr
                    } else {
                        const overItem = items.find(i => i.id === overIdStr)
                        if (overItem) {
                            targetCategory = getEffectiveCategory(overItem)
                        }
                    }

                    if (currentCategory !== targetCategory) {
                        setItems(prev => {
                            const newItems = prev.map(item =>
                                item.id === activeId
                                    ? { ...item, category: targetCategory }
                                    : item
                            )
                            return newItems
                        })
                        // Persist category change early (optimistic)
                        updateModuleCategory(activeId, targetCategory, brandId)
                    }
                }}
                onDragEnd={async (event) => {
                    const { active, over } = event
                    if (over) {
                        const activeId = active.id as string
                        const overIdStr = over.id as string

                        setItems((items) => {
                            const oldIndex = items.findIndex((item) => item.id === activeId)
                            const overIndex = items.findIndex((item) => item.id === overIdStr)

                            let newItems = [...items]

                            if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
                                const [moved] = newItems.splice(oldIndex, 1)
                                newItems.splice(overIndex, 0, moved)
                            }

                            // Persistence - preserve explicitly set categories
                            const updates = newItems.map((item, index) => ({
                                id: item.id,
                                order: index,
                                category: item.category != null ? item.category : getEffectiveCategory(item)
                            }))
                            console.log('[BrandbookEditor] Saving:', updates.map(u => `${u.id.slice(0, 6)}:${u.category}`).join(', '))
                            reorderModules(updates)
                            return newItems
                        })
                    }
                    setActiveDragId(null)
                }}
            >
                <AssetLibraryAccessProvider brandId={brandId} canEdit={!isReadOnly} openEditorLibrary={() => setIsAssetLibraryOpen(true)}>
                <div className="flex w-full h-screen overflow-hidden overflow-x-hidden bg-bg-2 flex-row relative text-white">

                    {/* Navigation chosen in Settings → Navegação (Preview / shared link); side panels take room here */}
                    <SharedNavigation slot="row-start" previewing={isPreviewMode} />

                    {/* 1. Sidebar - Full Height (First child in flex-row); hidden when another navigation style is shown */}
                    <NavigationGate previewing={isPreviewMode}>
                    <LeftSidebar
                        modules={items}
                        activeModuleId={selectedModuleId}
                        onSelectModule={setSelectedModuleId}
                        onAddModule={handleAddModule}
                        onRenameModule={handleRenameModule}
                        onDuplicateModule={handleDuplicateModule}
                        onDeleteModule={handleDeleteModule}
                        onDeleteModules={handleDeleteModules}
                        onMoveModuleToCategory={handleMoveModuleToCategory}
                        onToggleVisibility={handleToggleVisibility}
                        onToggleLock={handleToggleLock}
                        onToggleFullscreen={handleToggleFullscreen}
                        brandName={brandName}
                        brandbookId={brandbookId}
                        brandLogoUrl={brandLogoUrl}
                        userData={userData}
                        onPagesAdded={(newModules) => {
                            setItems(prev => [...prev, ...newModules])
                        }}
                        isReadOnly={isReadOnly}
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        footerSlot={isPreviewMode ? <AssetLibraryNavButton look="row" colors={{ text: 'inherit', muted: 'inherit', hover: 'rgba(127,127,127,0.12)', accent: '#FF0054' }} /> : undefined}
                    />
                    </NavigationGate>

                    {/* 2. Main Content Area - Column (Canvas + Footer) */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        {/* Shared navigation: top bars take room, capsules / docks / menus float over the page */}
                        <SharedNavigation slot="column-start" previewing={isPreviewMode} />
                        <SharedNavigation slot="overlay" previewing={isPreviewMode} />

                        {/* Top Bar Actions (Fixed top/right) — above every context bar, popover and panel of the editor
                            (they go up to z 9999); modals sit higher */}
                        {!isReadOnly && (
                            <div className="absolute top-4 right-6 z-[10000] flex items-center gap-4">
                                {/* Control Group */}
                                <div className="h-[52px] bg-[#111116] px-2 pl-6 rounded-full flex items-center shadow-2xl border border-[#222]">
                                    <div className="flex items-center gap-4">
                                        {/* Responsive device selector + Preview text */}
                                        <div className="flex items-center gap-0">
                                            {/* Responsive Device Selector */}
                                            <div
                                                className="relative"
                                                onMouseEnter={() => setIsResponsiveMenuOpen(true)}
                                                onMouseLeave={() => setIsResponsiveMenuOpen(false)}
                                            >
                                                <button className="text-[#888] hover:text-white transition-colors p-1 pr-3">
                                                    <Monitor className="w-4 h-4" />
                                                </button>

                                                {/* Popover Menu */}
                                                {isResponsiveMenuOpen && (
                                                    <>
                                                        {/* Invisible bridge to keep popover open when moving from button to popover */}
                                                        <div className="absolute top-full left-0 w-full h-4"></div>

                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[140px] bg-[#1A1A1F] border border-[#333] rounded-lg shadow-xl z-[100] py-2">
                                                            {/* Triangle tail - 12px height, centered */}
                                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-[#333]"></div>
                                                            <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[11px] border-b-[#1A1A1F]"></div>
                                                            <button
                                                                onClick={() => { setResponsiveDevice('desktop'); setIsResponsiveMenuOpen(false); }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-[#2A2A30] transition-colors text-left",
                                                                    responsiveDevice === 'desktop' ? "text-white" : "text-[#888]"
                                                                )}
                                                            >
                                                                <Monitor className="w-4 h-4" />
                                                                <span className="text-sm">Desktop</span>
                                                            </button>
                                                            <button
                                                                onClick={() => { setResponsiveDevice('widescreen'); setIsResponsiveMenuOpen(false); }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-[#2A2A30] transition-colors text-left",
                                                                    responsiveDevice === 'widescreen' ? "text-white" : "text-[#888]"
                                                                )}
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="2" y="5" width="20" height="12" rx="1" />
                                                                    <path d="M8 21h8" />
                                                                    <path d="M12 17v4" />
                                                                </svg>
                                                                <span className="text-sm">Wide screen</span>
                                                            </button>
                                                            <button
                                                                onClick={() => { setResponsiveDevice('mobile'); setIsResponsiveMenuOpen(false); }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-[#2A2A30] transition-colors text-left",
                                                                    responsiveDevice === 'mobile' ? "text-white" : "text-[#888]"
                                                                )}
                                                            >
                                                                <Smartphone className="w-4 h-4" />
                                                                <span className="text-sm">Mobile</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Vertical Separator */}
                                            <div className="h-[16px] w-[1px] bg-[#333] mr-3"></div>

                                            {/* Preview Text */}
                                            <span className={cn(
                                                "text-[15px] font-medium transition-colors cursor-pointer",
                                                isPreviewMode ? "text-white" : "text-[#555]"
                                            )} onClick={() => setIsPreviewMode(true)}>
                                                Preview
                                            </span>
                                        </div>

                                        {/* Custom Toggle Switch */}
                                        <div
                                            className="w-[52px] h-[28px] bg-[#222] rounded-full relative cursor-pointer"
                                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                                        >
                                            <div className={cn(
                                                "absolute top-[2px] w-[24px] h-[24px] bg-[#333] rounded-full shadow-sm transition-all duration-300",
                                                !isPreviewMode ? "left-[26px] bg-[#333]" : "left-[2px] bg-[#333]" // Thumb position
                                            )} />
                                        </div>

                                        <span className={cn(
                                            "text-[15px] font-medium transition-colors cursor-pointer",
                                            !isPreviewMode ? "text-white" : "text-[#555]"
                                        )} onClick={() => setIsPreviewMode(false)}>
                                            Edit
                                        </span>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-[20px] w-[1px] bg-[#333] mx-6"></div>

                                    {/* Library Link */}
                                    <button
                                        onClick={() => setIsComponentsLibraryOpen(true)}
                                        className="text-[15px] font-medium text-[#888] hover:text-white transition-colors mr-6"
                                    >
                                        Componentes
                                    </button>
                                    <button
                                        onClick={() => setIsAssetLibraryOpen(true)}
                                        className="text-[15px] font-medium text-[#888] hover:text-white transition-colors mr-4"
                                    >
                                        Asset library
                                    </button>
                                </div>

                                {/* Profile/Settings Group */}
                                <div className="h-[52px] bg-[#111116] px-4 rounded-full flex items-center gap-5 shadow-2xl border border-[#222]">
                                    <button className="text-[#888] hover:text-white transition-colors">
                                        <Clock className="w-5 h-5" />
                                    </button>
                                    <button
                                        className="text-[#888] hover:text-white transition-colors"
                                        onClick={() => setIsSettingsPanelOpen(true)}
                                    >
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                    <button className="text-[#888] hover:text-white transition-colors">
                                        <Bell className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="text-[#888] hover:text-white transition-colors"
                                        title="Ir para o Dashboard"
                                    >
                                        <Home className="w-5 h-5" />
                                    </button>
                                    {/* Save as Template Button */}
                                    <button
                                        onClick={() => setIsTemplateModalOpen(true)}
                                        className="text-[#888] hover:text-[#FF0054] transition-colors"
                                        title="Salvar como Template"
                                    >
                                        <BookmarkPlus className="w-5 h-5" />
                                    </button>
                                    {/* User Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0054] to-[#88007F] p-[2px] shadow-lg overflow-hidden">
                                        <div className="w-full h-full rounded-full bg-[#111116] overflow-hidden flex items-center justify-center relative">
                                            {userData?.avatar_url ? (
                                                <Image
                                                    src={userData.avatar_url}
                                                    alt={userData.name || "User"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] font-bold text-white uppercase">
                                                    {userData?.name?.charAt(0) || "U"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <MainCanvasWithHistory
                            brandId={brandId}
                            activeModule={activeModule}
                            activeBlockId={activeBlockId}
                            onSelectBlock={setActiveBlockId}
                            onUpdateModule={handleUpdateModule}
                            isReadOnly={isPreviewMode}
                            onAnimate={() => setIsAnimationPanelOpen(true)}
                            responsiveDevice={responsiveDevice}
                            footer={
                                <BrandbookFooter
                                    brandId={brandId}
                                    brandName={brandName}
                                    modules={items}
                                    selectedModuleId={selectedModuleId}
                                    onSelectModule={setSelectedModuleId}
                                    isReadOnly={isPreviewMode}
                                    responsiveDevice={responsiveDevice}
                                />
                            }
                        />

                        <DeleteConfirmationModal
                            isOpen={deleteModal.isOpen}
                            onClose={() => setDeleteModal({ isOpen: false, moduleId: null })}
                            onConfirm={confirmDelete}
                            title="Eliminar página"
                            message="Esta ação é irreversível. Todos os brandbooks, assets e projetos associados a esta marca serão eliminados permanentemente."
                        />

                        <DragOverlay>
                            {activeDragId ? (
                                <div className="p-2 bg-bg-3 text-white rounded shadow-lg flex items-center gap-2 w-64 opacity-90 border border-accent-indigo">
                                    <span className="truncate">{items.find(i => i.id === activeDragId)?.title}</span>
                                </div>
                            ) : null}
                        </DragOverlay>

                    </div>

                    <SharedNavigation slot="row-end" previewing={isPreviewMode} />

                </div>
                </AssetLibraryAccessProvider>

                <BrandSettingsPanel
                    isOpen={isSettingsPanelOpen}
                    onClose={() => setIsSettingsPanelOpen(false)}
                    brandId={brandId}
                    page={activeModule ? {
                        title: activeModule.title,
                        background: (activeModule.content_json as { pageBackground?: string })?.pageBackground,
                        onChange: (color) => {
                            const { pageBackground: _previous, ...rest } = (activeModule.content_json || {}) as Record<string, unknown>
                            handleUpdateModule(activeModule.id, color ? { ...rest, pageBackground: color } : rest)
                        },
                        fill: (activeModule.content_json as { pageFill?: BackgroundFill })?.pageFill,
                        onFillChange: (fill) => {
                            const { pageFill: _previous, ...rest } = (activeModule.content_json || {}) as Record<string, unknown>
                            handleUpdateModule(activeModule.id, fill && fill.type !== 'none' ? { ...rest, pageFill: fill } : rest)
                        },
                        upload: async (file) => {
                            const formData = new FormData()
                            formData.append('file', file)
                            formData.append('brandId', brandId)
                            formData.append('moduleId', activeModule.id)
                            return uploadBrandbookMedia(formData)
                        },
                        // "All pages": drop every page's own background so the general one shows everywhere
                        onClearAllPages: () => {
                            items.forEach(item => {
                                const content = (item.content_json || {}) as Record<string, unknown>
                                if (!content.pageBackground) return
                                const { pageBackground: _removed, ...rest } = content
                                handleUpdateModule(item.id, rest)
                            })
                        },
                    } : undefined}
                />

                <AssetLibrary
                    isOpen={isAssetLibraryOpen}
                    onClose={() => setIsAssetLibraryOpen(false)}
                    brandId={brandId}
                />

                <ComponentsLibrary
                    isOpen={isComponentsLibraryOpen}
                    onClose={() => setIsComponentsLibraryOpen(false)}
                    brandId={brandId}
                    onSelectComponent={handleSelectComponent}
                    onEditTemplate={isSuperAdmin ? handleEditTemplate : undefined}
                />

                {isSuperAdmin && !isPreviewMode && activeModule && (
                    <TemplateEditDock
                        blocks={((activeModule.content_json as any)?.blocks || []) as Block[]}
                        onChange={(blocks) => handleUpdateModule(activeModule.id, { ...(activeModule.content_json as any), blocks })}
                    />
                )}

                {isSuperAdmin && editTemplateId && !isPreviewMode && (
                    <TemplateBrandbookEditBar
                        templateId={editTemplateId}
                        brandId={brandId}
                        brandName={brandName}
                        modules={items}
                        flushPendingSaves={flushPendingSaves}
                    />
                )}

                <SaveAsTemplateModal
                    isOpen={isTemplateModalOpen}
                    onClose={() => setIsTemplateModalOpen(false)}
                    modules={items}
                    brandId={brandId}
                    brandName={brandName}
                    isSuperAdmin={isSuperAdmin}
                />

                <AnimationPanel
                    isOpen={isAnimationPanelOpen && !isPreviewMode}
                    onClose={() => setIsAnimationPanelOpen(false)}
                    onSelectAnimation={handleSelectAnimation}
                    initialAnimation={activeBlockAnimation}
                    animationSettings={activeBlockAnimationState?.animationSettings}
                    onAnimationSettingsChange={handleAnimationSettingsChange}
                    hoverEffect={activeBlockAnimationState?.hoverEffect}
                    onHoverEffectChange={handleHoverEffectChange}
                    hasTarget={!!activeBlockAnimationState}
                />
            </DndContext >
        </BrandDesignProvider >
    )
}
