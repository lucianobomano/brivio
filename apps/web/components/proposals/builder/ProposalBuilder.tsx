"use client"

import React, { useState, useRef } from "react"
import { toast } from "sonner"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core"
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { SlidersHorizontal, Home, Plus, Layers, LayoutTemplate, ArrowLeft, Check, Loader2, AlertTriangle, CloudUpload, Undo2, Redo2, BookmarkPlus } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

import { MainCanvas } from "./editor/MainCanvas"
import { PagesPanel } from "./editor/PagesPanel"
import { ComponentsModal } from "./editor/ComponentsModal"
import { SaveTemplateModal } from "./editor/SaveTemplateModal"
import { PageFormatModal } from "./editor/PageFormatModal"
import type { PageSetting } from "../pageFormats"
import { instantiateComponent, type ProposalComponent } from "./componentLibrary"
import { BrandDesignProvider } from "./editor/BrandDesignContext"

const AssetLibrary = dynamic(() => import("./editor/AssetLibrary").then(m => m.AssetLibrary), { ssr: false })
const BrandSettingsPanel = dynamic(() => import("./editor/BrandSettingsPanel").then(m => m.BrandSettingsPanel), { ssr: false })

import { deleteProposalModules, renameProposalModules, createProposalModuleWithContent, createProposalModule, reorderProposalModules, updateProposalModuleContent, updateProposalModule, duplicateProposalModule } from "@/app/actions/proposal-builder"



interface ProposalBuilderProps {
    initialModules: any[]
    proposalId: string
    brandId: string
    proposalIdentifier?: string
    isReadOnly?: boolean
    /** Fills the template fields of the components ({{Nome_Projeto}}, {{Nome_Cliente}}) */
    projectName?: string | null
    clientName?: string | null
    /** Project of the proposal: «Concluir» and «Voltar» go back to its proposals */
    projectId?: string | null
}





export default function ProposalBuilder({ initialModules, proposalId, brandId, proposalIdentifier = '', isReadOnly = false, projectName = null, clientName = null, projectId = null }: ProposalBuilderProps) {
    const router = useRouter()

    // Determine effective modules (filter out internal settings module)
    const [items, setItems] = useState<any[]>(initialModules.filter(m => m.type !== 'settings'))
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(initialModules.find(m => m.type !== 'settings')?.id || null)

    // Block Selection State (Lifted up from MainCanvas)
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [isPreviewMode, setIsPreviewMode] = useState(isReadOnly)
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false)
    const [isPagesOpen, setIsPagesOpen] = useState(false)
    const [isComponentsOpen, setIsComponentsOpen] = useState(false)
    const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false)
    // Página → Secções → Colunas → Subcolunas: a page is created with a format, chosen here
    const [formatModal, setFormatModal] = useState<"create" | "change" | null>(null)
    const componentContext = React.useMemo(() => ({ projectName, clientName }), [projectName, clientName])

    // DND State
    const [activeDragId, setActiveDragId] = useState<string | null>(null)

    // Persistence Refs
    const activeSaveTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
    // Requests still on their way to the server: leaving the page now would lose them
    const inFlight = useRef(0)
    const pendingTitles = useRef<Record<string, string>>({})
    const titleTimer = useRef<NodeJS.Timeout | null>(null)
    // Pages deleted in a row go to the server together (one request instead of one per page)
    const pendingDeletes = useRef<string[]>([])
    const deleteTimer = useRef<NodeJS.Timeout | null>(null)
    // Content of each page waiting for its save (the save runs 1s after the last change, or at once on «Concluir»)
    const pendingContent = useRef<Record<string, any>>({})
    const runDeletes = useRef<(() => void) | null>(null)
    // Saves that failed, with what re-sends them («Tentar de novo»)
    const failedSaves = useRef<Map<string, () => Promise<unknown>>>(new Map())

    // What the bar shows: saving (something queued or on its way), saved (with the time), or an error
    const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved")
    const [savedAt, setSavedAt] = useState<Date | null>(null)
    const [isLeaving, setIsLeaving] = useState(false)
    const hasPendingWork = () => inFlight.current > 0 || !!titleTimer.current || !!deleteTimer.current || Object.keys(activeSaveTimeouts.current).length > 0
    const refreshSaveState = () => {
        if (failedSaves.current.size) setSaveState("error")
        else if (hasPendingWork()) setSaveState("saving")
        else { setSaveState("saved"); setSavedAt(new Date()) }
    }

    /** Runs a save and follows it: a result with success: false (or a network error) counts as a failed save */
    const track = <T,>(p: Promise<T>, retry?: { key: string, run: () => Promise<unknown> }): Promise<T> => {
        inFlight.current++
        setSaveState("saving")
        return p.then(result => {
            const failed = !!result && typeof result === "object" && (result as any).success === false
            if (failed) failedSaves.current.set(retry?.key || `op-${Date.now()}-${Math.random()}`, retry?.run || (() => Promise.resolve()))
            else if (retry) failedSaves.current.delete(retry.key)
            return result
        }, error => {
            failedSaves.current.set(retry?.key || `op-${Date.now()}-${Math.random()}`, retry?.run || (() => Promise.resolve()))
            throw error
        }).finally(() => { inFlight.current--; refreshSaveState() })
    }

    const saveContent = (moduleId: string, content: any): Promise<unknown> =>
        track(updateProposalModuleContent(moduleId, content, proposalId), { key: `content:${moduleId}`, run: (): Promise<unknown> => saveContent(moduleId, content) })

    /** Sends everything still queued now and waits for every request to answer; true when all of it is saved */
    const flushSaves = async (): Promise<boolean> => {
        for (const [id, timer] of Object.entries(activeSaveTimeouts.current)) {
            clearTimeout(timer)
            delete activeSaveTimeouts.current[id]
            const content = pendingContent.current[id]
            delete pendingContent.current[id]
            if (content !== undefined) saveContent(id, content)
        }
        if (titleTimer.current) {
            clearTimeout(titleTimer.current)
            titleTimer.current = null
            const batch = Object.entries(pendingTitles.current).map(([id, title]) => ({ id, title }))
            pendingTitles.current = {}
            if (batch.length) track(renameProposalModules(proposalId, batch))
        }
        if (deleteTimer.current && runDeletes.current) { clearTimeout(deleteTimer.current); runDeletes.current() }
        // Failed saves get one more try
        const retries = [...failedSaves.current.values()]
        failedSaves.current.clear()
        retries.forEach(run => { run().catch(() => { }) })
        const started = Date.now()
        while (inFlight.current > 0 && Date.now() - started < 20000) await new Promise(r => setTimeout(r, 120))
        refreshSaveState()
        return inFlight.current === 0 && failedSaves.current.size === 0
    }

    const retryFailedSaves = async () => {
        const ok = await flushSaves()
        if (ok) toast.success("Tudo guardado.")
        else toast.error("Ainda não foi possível guardar. Verifique a ligação à internet e tente de novo.")
    }

    /** «Concluir» / «Voltar»: saves everything first, then back to the project's proposals */
    const leaveBuilder = async () => {
        if (isLeaving) return
        setIsLeaving(true)
        const ok = await flushSaves()
        if (!ok && !window.confirm("Algumas alterações não foram guardadas. Se sair agora, perde-as. Sair mesmo assim?")) {
            setIsLeaving(false)
            return
        }
        if (ok) toast.success("Proposta guardada.")
        const back = projectId ? `/projects?project=${projectId}&tab=propostas` : "/projects"
        // The builder opens in its own tab from the project: closing it shows the project again
        window.close()
        window.setTimeout(() => router.push(back), 250)
    }

    // Ctrl/Cmd + S: save now
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault()
                flushSaves().then(ok => ok ? toast.success("Tudo guardado.") : toast.error("Não foi possível guardar tudo."))
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    })

    React.useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (hasPendingWork() || failedSaves.current.size > 0) {
                e.preventDefault()
                e.returnValue = ""
            }
        }
        window.addEventListener("beforeunload", warn)
        return () => window.removeEventListener("beforeunload", warn)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Derived state
    const activeModule = items.find(m => m.id === selectedModuleId) || null



    // The navigator «+» and «Nova página»: a page like the selected one (same format, colour and effects)
    const openNewPage = () => {
        const ref = activeModule || items[items.length - 1]
        handleCreatePage(ref?.content_json?.page || { format: "a4", orientation: "portrait" }, ref?.id ?? null, ref?.content_json?.style)
    }
    const [scrollTo, setScrollTo] = useState<{ id: string, n: number } | null>(null)
    // The wheel over the page navigator scrolls the navigator only, never the canvas (also between the numbers,
    // which let clicks through, and when the list is at its end)
    React.useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            const list = document.querySelector("[data-page-nav]") as HTMLElement | null
            const column = document.querySelector("[data-page-nav-column]") as HTMLElement | null
            if (!list || !column) return
            const r = column.getBoundingClientRect()
            // The column of numbers (64px wide), not the wide transparent area kept for the page names
            if (e.clientX < r.left - 8 || e.clientX > r.left + 64 || e.clientY < r.top || e.clientY > r.bottom) return
            e.preventDefault()
            e.stopPropagation()
            if (!e.ctrlKey) list.scrollTop += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
        }
        window.addEventListener("wheel", onWheel, { passive: false, capture: true })
        return () => window.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions)
    }, [])

    // The selected page's number stays in sight in the navigator (it scrolls when there are many pages)
    React.useEffect(() => {
        if (!selectedModuleId) return
        document.querySelector(`[data-page-nav-item="${selectedModuleId}"]`)?.scrollIntoView({ block: "nearest" })
    }, [selectedModuleId])
    const goToPage = (id: string) => { setSelectedModuleId(id); setScrollTo(prev => ({ id, n: (prev?.n || 0) + 1 })) }

    /** A blank page after `afterId` (or at the end); `style` carries the page colour when copying a page's look */
    async function handleCreatePage(page: PageSetting, afterId?: string | null, style?: Record<string, unknown>) {
        record()
        const ref = afterId === undefined ? selectedModuleId : afterId
        const idx = ref ? items.findIndex(m => m.id === ref) : -1
        const at = idx >= 0 ? idx + 1 : items.length
        const title = `${String(at + 1).padStart(2, "0")}. Nova página`
        const pageStyle = style && (style.backgroundColor || style.backgroundImage) ? { backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage, backgroundSize: style.backgroundSize, backgroundPosition: style.backgroundPosition } : undefined
        const result = await track(createProposalModuleWithContent(proposalId, { type: "custom", title, content_json: { page, blocks: [], ...(pageStyle ? { style: pageStyle } : {}) } }, at))
        if (!result.success || !("module" in result) || !result.module) {
            toast.error("Não foi possível adicionar a página.")
            return
        }
        const next = [...items]
        next.splice(at, 0, result.module)
        setItems(renumber(next))
        goToPage(result.module.id)
        setFormatModal(null)
        track(reorderProposalModules(next.map((m, i) => ({ id: m.id, order: i }))))
    }

    /** Changes a page's content (colour, animation, transition…) from its toolbar */
    const handleUpdatePage = (id: string, fn: (content: any) => any) => {
        const m = items.find(x => x.id === id)
        if (m) handleUpdateModule(id, fn(m.content_json || {}))
    }

    function handleChangeFormat(page: PageSetting, applyToAll: boolean) {
        const targets = applyToAll ? items : items.filter(m => m.id === selectedModuleId)
        record()
        for (const m of targets) persistContent(m.id, { ...(m.content_json || {}), page })
        setFormatModal(null)
        toast.success(applyToAll ? "Formato aplicado a todas as páginas" : "Formato da página alterado")
    }

    /**
     * Pages named like the templates («03. O Desafio») keep the number of their position after a page is added,
     * moved or removed; other names are left as the user wrote them.
     */
    const renumber = (list: any[]) => {
        const changed: { id: string, title: string }[] = []
        const next = list.map((m, i) => {
            const match = /^\d{1,2}\.\s+(.*)$/.exec(m.title || "")
            if (!match) return m
            const title = `${String(i + 1).padStart(2, "0")}. ${match[1]}`
            if (title === m.title) return m
            changed.push({ id: m.id, title })
            return { ...m, title }
        })
        // Titles go in one request, a moment after the last change (deleting 9 pages sends one rename, not 36)
        for (const c of changed) pendingTitles.current[c.id] = c.title
        if (changed.length) {
            if (titleTimer.current) clearTimeout(titleTimer.current)
            setSaveState("saving")
            titleTimer.current = setTimeout(() => {
                titleTimer.current = null
                const batch = Object.entries(pendingTitles.current).map(([id, title]) => ({ id, title }))
                pendingTitles.current = {}
                if (batch.length) track(renameProposalModules(proposalId, batch))
                else refreshSaveState()
            }, 800)
        }
        return next
    }

    // A component as a new page right after the current one
    async function handleInsertComponentPage(component: ProposalComponent) {
        record()
        const at = Math.max(0, items.findIndex(m => m.id === selectedModuleId) + 1) || items.length
        const content: Record<string, unknown> = { ...instantiateComponent(component, { projectName, clientName }) }
        // A component designed for a format (the A4 pages of «Corporativo») keeps it; the others take the current page's
        if (!content.page && activeModule?.content_json?.page) content.page = activeModule.content_json.page
        const title = `${String(at + 1).padStart(2, "0")}. ${component.pageName || component.categoryLabel}`
        const result = await createProposalModuleWithContent(proposalId, { type: component.type, title, content_json: content }, at)
        if (!result.success || !("module" in result) || !result.module) {
            toast.error("Não foi possível inserir o componente.")
            return
        }
        const next = [...items]
        next.splice(at, 0, result.module)
        setItems(renumber(next))
        setSelectedModuleId(result.module.id)
        setIsComponentsOpen(false)
        track(reorderProposalModules(next.map((m, i) => ({ id: m.id, order: i }))))
        toast.success(`Página «${component.categoryLabel}» adicionada na posição ${at + 1}`)
    }

    // Every page of a style, after the current page (a whole template)
    async function handleInsertTemplate(components: ProposalComponent[]) {
        record()
        let at = Math.max(0, items.findIndex(m => m.id === selectedModuleId) + 1) || items.length
        const created: any[] = []
        const toastId = toast.loading(`A inserir ${components.length} páginas…`)
        for (const component of components) {
            const content: Record<string, unknown> = { ...instantiateComponent(component, { projectName, clientName }) }
            const title = `${String(at + 1).padStart(2, "0")}. ${component.pageName || component.categoryLabel}`
            const result = await track(createProposalModuleWithContent(proposalId, { type: component.type, title, content_json: content }, at))
            if (!result.success || !("module" in result) || !result.module) {
                toast.error("Não foi possível inserir todas as páginas.", { id: toastId })
                break
            }
            created.push(result.module)
            at++
        }
        if (!created.length) return
        const start = Math.max(0, items.findIndex(m => m.id === selectedModuleId) + 1) || items.length
        const next = [...items]
        next.splice(start, 0, ...created)
        setItems(renumber(next))
        goToPage(created[0].id)
        setIsComponentsOpen(false)
        track(reorderProposalModules(next.map((m, i) => ({ id: m.id, order: i }))))
        toast.success(`${created.length} páginas inseridas`, { id: toastId })
    }

    // A component's sections at the end of the current page (the page keeps its own background)
    function handleInsertComponentIntoCurrent(component: ProposalComponent) {
        if (!activeModule) return
        record()
        const content = instantiateComponent(component, { projectName, clientName })
        const blocks = [...(activeModule.content_json?.blocks || []), ...content.blocks]
        handleUpdateModule(activeModule.id, { ...(activeModule.content_json || {}), blocks })
        setIsComponentsOpen(false)
        toast.success(`Secções de «${component.categoryLabel}» adicionadas ao fim desta página`)
    }

    const handleMoveModule = (moduleId: string, direction: "up" | "down") => {
        const from = items.findIndex(m => m.id === moduleId)
        const to = direction === "up" ? from - 1 : from + 1
        if (from < 0 || to < 0 || to >= items.length) return
        record()
        const next = arrayMove(items, from, to)
        setItems(renumber(next))
        track(reorderProposalModules(next.map((m, i) => ({ id: m.id, order: i }))))
    }

    // ---------------------------------------------------------------------------------------------
    // History: Ctrl+Z undoes any change (a letter, a block, a page…), Ctrl+Shift+Z / Ctrl+Y redoes it.
    // Before each change the whole list of pages is kept (they are immutable, so a snapshot is cheap).
    // Undo compares a snapshot with the pages now and sends only the differences to the server.
    // ---------------------------------------------------------------------------------------------
    const itemsRef = useRef(items)
    itemsRef.current = items
    const past = useRef<any[][]>([])
    const future = useRef<any[][]>([])
    const lastStep = useRef<{ key: string, t: number } | null>(null)
    const restoring = useRef(false)
    const historyBusy = useRef(false)
    const [, setHistoryVersion] = useState(0)

    /** Call before a change. Changes with the same key in a quick burst (typing a word) are one step */
    const record = (key?: string) => {
        if (restoring.current || isReadOnly) return
        const now = Date.now()
        if (key && lastStep.current?.key === key && now - lastStep.current.t < 600) { lastStep.current.t = now; return }
        past.current.push(itemsRef.current)
        if (past.current.length > 300) past.current.shift()
        future.current = []
        lastStep.current = { key: key || `op-${now}`, t: now }
        setHistoryVersion(v => v + 1)
    }

    /** A page brought back gets a new id: every snapshot follows it */
    const remapId = (oldId: string, newId: string) => {
        const fix = (list: any[]) => list.map(m => m.id === oldId ? { ...m, id: newId } : m)
        past.current = past.current.map(fix)
        future.current = future.current.map(fix)
    }

    const applySnapshot = async (target: any[]) => {
        restoring.current = true
        try {
            const current = itemsRef.current
            const currentIds = new Set(current.map(m => m.id))
            const targetIds = new Set(target.map(m => m.id))
            const next = [...target]

            // Pages to bring back: a delete not sent yet is just cancelled, otherwise the page is created again
            for (let i = 0; i < next.length; i++) {
                const m = next[i]
                if (currentIds.has(m.id)) continue
                const pending = pendingDeletes.current.indexOf(m.id)
                if (pending >= 0) { pendingDeletes.current.splice(pending, 1); continue }
                const toastId = toast.loading(`A repor «${m.title || "página"}»…`)
                const r = await track(createProposalModuleWithContent(proposalId, { type: m.type, title: m.title, content_json: m.content_json || {} }, i))
                toast.dismiss(toastId)
                if (r.success && "module" in r && r.module) {
                    next[i] = { ...m, id: r.module.id }
                    remapId(m.id, r.module.id)
                    if (m.is_hidden || m.is_locked || m.is_fullscreen) track(updateProposalModule(r.module.id, { is_hidden: !!m.is_hidden, is_locked: !!m.is_locked, is_fullscreen: !!m.is_fullscreen }, proposalId))
                } else {
                    next.splice(i, 1); i--
                    toast.error("Não foi possível repor uma página.")
                }
            }

            // Pages to remove
            const gone = current.filter(m => !targetIds.has(m.id)).map(m => m.id)
            for (const id of gone) {
                if (activeSaveTimeouts.current[id]) { clearTimeout(activeSaveTimeouts.current[id]); delete activeSaveTimeouts.current[id] }
                delete pendingContent.current[id]
                delete pendingTitles.current[id]
            }
            if (gone.length) track(deleteProposalModules(proposalId, gone))

            // What changed in the pages that stay
            const before = new Map(current.map(m => [m.id, m]))
            const titles: { id: string, title: string }[] = []
            for (const m of next) {
                const c = before.get(m.id)
                if (!c) continue
                if (c.content_json !== m.content_json) persistContent(m.id, m.content_json)
                if (c.title !== m.title) { titles.push({ id: m.id, title: m.title }); delete pendingTitles.current[m.id] }
                const flags: Record<string, boolean> = {}
                for (const k of ["is_hidden", "is_locked", "is_fullscreen"]) if (!!c[k] !== !!m[k]) flags[k] = !!m[k]
                if (Object.keys(flags).length) track(updateProposalModule(m.id, flags, proposalId))
            }
            if (titles.length) track(renameProposalModules(proposalId, titles))
            const reordered = next.length !== current.length || next.some((m, i) => current[i]?.id !== m.id)
            if (reordered) track(reorderProposalModules(next.map((m, i) => ({ id: m.id, order: i }))))

            itemsRef.current = next
            setItems(next)
            if (!next.some(m => m.id === selectedModuleId)) setSelectedModuleId(next[0]?.id || null)
        } finally {
            restoring.current = false
        }
    }

    const undo = async () => {
        if (historyBusy.current || !past.current.length) return
        historyBusy.current = true
        const target = past.current.pop()!
        future.current.push(itemsRef.current)
        lastStep.current = null
        try { await applySnapshot(target) } finally { historyBusy.current = false; setHistoryVersion(v => v + 1) }
    }
    const redo = async () => {
        if (historyBusy.current || !future.current.length) return
        historyBusy.current = true
        const target = future.current.pop()!
        past.current.push(itemsRef.current)
        lastStep.current = null
        try { await applySnapshot(target) } finally { historyBusy.current = false; setHistoryVersion(v => v + 1) }
    }

    // Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y — also inside the texts (the editor's history replaces the field's own)
    React.useEffect(() => {
        if (isReadOnly) return
        const onKey = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey) return
            const k = e.key.toLowerCase()
            const isUndo = k === "z" && !e.shiftKey
            const isRedo = (k === "z" && e.shiftKey) || k === "y"
            if (!isUndo && !isRedo) return
            const t = e.target as HTMLElement | null
            if (t?.closest?.("[data-native-undo]")) return
            e.preventDefault()
            e.stopPropagation()
            if (isUndo) undo(); else redo()
        }
        window.addEventListener("keydown", onKey, true)
        return () => window.removeEventListener("keydown", onKey, true)
    })

    const handleUpdateModule = (moduleId: string, newContent: any) => {
        record(`content:${moduleId}`)
        persistContent(moduleId, newContent)
    }

    /** Shows a page's new content and saves it (1s after the last change); no history step */
    const persistContent = (moduleId: string, newContent: any) => {
        setItems(prev => prev.map(item =>
            item.id === moduleId
                ? { ...item, content_json: newContent }
                : item
        ))

        if (activeSaveTimeouts.current[moduleId]) {
            clearTimeout(activeSaveTimeouts.current[moduleId])
        }

        pendingContent.current[moduleId] = newContent
        setSaveState("saving")
        activeSaveTimeouts.current[moduleId] = setTimeout(async () => {
            delete activeSaveTimeouts.current[moduleId]
            delete pendingContent.current[moduleId]
            await saveContent(moduleId, newContent)
        }, 1000)
    }

    const handleRenameModule = async (moduleId: string, newTitle: string) => {
        record(`title:${moduleId}`)
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, title: newTitle } : m))
        await track(updateProposalModule(moduleId, { title: newTitle }, proposalId))
    }

    const handleDuplicateModule = async (moduleId: string) => {
        record()
        const toastId = toast.loading("A duplicar a página…")
        const result = await track(duplicateProposalModule(moduleId, proposalId))
        if (result.success && "module" in result && result.module) {
            // The copy goes right after the original
            const at = items.findIndex(m => m.id === moduleId) + 1 || items.length
            const next = [...items]
            next.splice(at, 0, result.module)
            setItems(renumber(next))
            goToPage(result.module.id)
            track(reorderProposalModules(next.map((m, i) => ({ id: m.id, order: i }))))
            toast.success("Página duplicada", { id: toastId })
        } else {
            toast.error("Erro ao duplicar a página.", { id: toastId })
        }
    }

    const handleDeleteModule = async (moduleId: string) => {
        record()
        const rest = items.filter(m => m.id !== moduleId)
        // Deletes made in a row leave together, before the renumbered titles
        pendingDeletes.current.push(moduleId)
        if (deleteTimer.current) clearTimeout(deleteTimer.current)
        setSaveState("saving")
        const deleting = new Promise<void>(resolve => {
            const run = async () => {
                deleteTimer.current = null
                runDeletes.current = null
                const batch = pendingDeletes.current
                pendingDeletes.current = []
                if (batch.length) await track(deleteProposalModules(proposalId, batch)).catch(() => { })
                resolve()
            }
            runDeletes.current = run
            deleteTimer.current = setTimeout(run, 500)
        })
        delete pendingTitles.current[moduleId]
        // A pending save of this page must not run after it is gone
        if (activeSaveTimeouts.current[moduleId]) { clearTimeout(activeSaveTimeouts.current[moduleId]); delete activeSaveTimeouts.current[moduleId] }
        delete pendingContent.current[moduleId]
        failedSaves.current.delete(`content:${moduleId}`)
        setItems(renumber(rest))
        if (selectedModuleId === moduleId) {
            setSelectedModuleId(rest[0]?.id || null)
        }
        await deleting
    }

    const handleToggleVisibility = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newVal = !item.is_hidden
        record()
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, is_hidden: newVal } : m))
        await track(updateProposalModule(moduleId, { is_hidden: newVal }, proposalId))
    }

    const handleToggleLock = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newVal = !item.is_locked
        record()
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, is_locked: newVal } : m))
        await track(updateProposalModule(moduleId, { is_locked: newVal }, proposalId))
    }

    const handleToggleFullscreen = async (moduleId: string) => {
        const item = items.find(m => m.id === moduleId)
        if (!item) return
        const newVal = !item.is_fullscreen
        record()
        setItems(prev => prev.map(m => m.id === moduleId ? { ...m, is_fullscreen: newVal } : m))
        await track(updateProposalModule(moduleId, { is_fullscreen: newVal }, proposalId))
    }



    return (
        <BrandDesignProvider brandId={brandId} proposalId={proposalId} initialModules={initialModules}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={({ active }) => setActiveDragId(active.id as string)}
                onDragEnd={async (event) => {
                    const { active, over } = event
                    if (over && active.id !== over.id) {
                        record()
                        setItems((items) => {
                            const oldIndex = items.findIndex((item) => item.id === active.id)
                            const newIndex = items.findIndex((item) => item.id === over.id)
                            const newOrder = arrayMove(items, oldIndex, newIndex)

                            // Optimistic update
                            const updates = newOrder.map((item, index) => ({ id: item.id, order: index }))
                            track(reorderProposalModules(updates)) // Fire and forget for now

                            return newOrder
                        })
                    }
                    setActiveDragId(null)
                }}
            >
                <div className="flex h-screen overflow-hidden bg-bg-2 flex-row relative text-white">

                    {/* Main Content Area - Full Width (Sidebar Removed) */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">

                        {/* Top left: back, what is being edited, whether it is saved, and «Concluir» */}
                        {!isReadOnly && (
                            <div className="absolute top-4 left-6 z-50 h-[52px] bg-[#111116] pl-2 pr-2 rounded-full flex items-center gap-3 shadow-2xl border border-[#222]">
                                <button
                                    onClick={leaveBuilder}
                                    title="Guardar e voltar ao projeto"
                                    aria-label="Guardar e voltar ao projeto"
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                {/* On narrower screens the name gives way, so this bar never runs under the one in the middle */}
                                <div className="hidden 2xl:flex flex-col leading-tight min-w-0 max-w-[220px]">
                                    <span className="text-[13px] font-semibold text-white truncate">{projectName || "Proposta"}</span>
                                    <span className="text-[11px] text-[#666] truncate">{proposalIdentifier || "Editor de propostas"}</span>
                                </div>
                                <div className="hidden 2xl:block h-[20px] w-[1px] bg-[#333]" />
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={undo}
                                        disabled={!past.current.length}
                                        title="Desfazer (Ctrl+Z)"
                                        aria-label="Desfazer"
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#888] hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    >
                                        <Undo2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={redo}
                                        disabled={!future.current.length}
                                        title="Refazer (Ctrl+Shift+Z ou Ctrl+Y)"
                                        aria-label="Refazer"
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#888] hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    >
                                        <Redo2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="h-[20px] w-[1px] bg-[#333]" />
                                <div data-save-status={saveState} title={saveState === "saving" ? "A guardar…" : saveState === "error" ? "Erro ao guardar" : "Tudo guardado"} className="flex items-center gap-1.5 text-[12px] whitespace-nowrap xl:min-w-[120px] [&_.save-label]:hidden xl:[&_.save-label]:inline" aria-live="polite">
                                    {saveState === "saving" && <><Loader2 className="w-3.5 h-3.5 animate-spin text-[#888]" /><span className="save-label text-[#888]">A guardar…</span></>}
                                    {saveState === "saved" && (
                                        <span title={savedAt ? `Última gravação: ${savedAt.toLocaleTimeString("pt-PT")}` : "Todas as alterações estão guardadas"} className="flex items-center gap-1.5 text-[#3DDC84]">
                                            <Check className="w-3.5 h-3.5" />
                                            <span className="save-label">{savedAt ? `Guardado às ${savedAt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}` : "Tudo guardado"}</span>
                                        </span>
                                    )}
                                    {saveState === "error" && (
                                        <button onClick={retryFailedSaves} className="flex items-center gap-1.5 text-[#FF5544] hover:text-white" title="Algumas alterações não chegaram ao servidor">
                                            <AlertTriangle className="w-3.5 h-3.5" /> <span className="save-label">Erro ao guardar · Tentar de novo</span>
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={leaveBuilder}
                                    disabled={isLeaving}
                                    title="Concluir — guarda tudo e volta às propostas do projeto"
                                    aria-label="Concluir"
                                    className="h-9 px-3 min-[1440px]:px-4 rounded-full bg-white text-[#111116] text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-white/90 disabled:opacity-60 transition-colors"
                                >
                                    {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                                    {/* Below 1440px the button keeps only its icon (its name shows on hover) */}
                                    <span className="hidden min-[1440px]:inline">{isLeaving ? "A guardar…" : "Concluir"}</span>
                                </button>
                            </div>
                        )}

                        {/* Top Bar Actions (Fixed top/right) */}
                        {!isReadOnly && (
                            <div className="absolute top-4 right-6 z-50 flex items-center gap-4">
                                {/* Control Group */}
                                <div className="h-[52px] bg-[#111116] px-2 pl-6 rounded-full flex items-center shadow-2xl border border-[#222]">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => window.open(`/proposals/${proposalId}/view`, '_blank')}
                                            className="text-[11px] font-black text-white uppercase tracking-[0.2em] bg-[#EF0050] px-6 py-2 rounded-full hover:bg-[#EF0050]/90 transition-all shadow-[0_4px_15px_rgba(239,0,80,0.3)] hover:scale-105 active:scale-95"
                                        >
                                            Visualizar
                                        </button>

                                        <div className="h-[20px] w-[1px] bg-[#333] mx-1"></div>

                                        <span className={cn(
                                            "text-[15px] font-medium transition-colors cursor-pointer",
                                            isPreviewMode ? "text-white" : "text-[#555]"
                                        )} onClick={() => setIsPreviewMode(true)}>
                                            Preview
                                        </span>

                                        {/* Custom Toggle Switch */}
                                        <div
                                            className="w-[52px] h-[28px] bg-[#222] rounded-full relative cursor-pointer"
                                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                                        >
                                            <div className={cn(
                                                "absolute top-[2px] w-[24px] h-[24px] rounded-full shadow-sm transition-all duration-300",
                                                !isPreviewMode ? "left-[26px] bg-[#EF0050]" : "left-[2px] bg-[#555]" // Thumb position
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

                                    {/* Ready-made pages */}
                                    <button
                                        onClick={() => setIsComponentsOpen(true)}
                                        className="text-[15px] font-medium text-[#888] hover:text-white transition-colors mr-5 inline-flex items-center gap-2"
                                    >
                                        <LayoutTemplate className="w-4 h-4" />
                                        Componentes
                                    </button>

                                    {/* Library Link */}
                                    <button
                                        onClick={() => setIsAssetLibraryOpen(true)}
                                        className="text-[15px] font-medium text-[#888] hover:text-white transition-colors mr-4"
                                    >
                                        Asset library
                                    </button>
                                </div>

                                {/* Profile/Settings Group */}
                                <div className="h-[52px] bg-[#111116] px-4 rounded-full flex items-center gap-5 shadow-2xl border border-[#222]">
                                    <button
                                        className="text-[#888] hover:text-white transition-colors"
                                        title="Guardar esta proposta como template"
                                        aria-label="Guardar como template"
                                        onClick={() => setIsSaveTemplateOpen(true)}
                                    >
                                        <BookmarkPlus className="w-5 h-5" />
                                    </button>
                                    <button
                                        className="text-[#888] hover:text-white transition-colors"
                                        title="Cores e fontes da proposta"
                                        aria-label="Cores e fontes da proposta"
                                        onClick={() => setIsSettingsPanelOpen(true)}
                                    >
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={leaveBuilder}
                                        title="Guardar e voltar ao projeto"
                                        aria-label="Guardar e voltar ao projeto"
                                        className="text-[#888] hover:text-white transition-colors"
                                    >
                                        <Home className="w-5 h-5" />
                                    </button>
                                    {/* Gradient Circle */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00FF94] via-[#0000FF] to-[#FF0054]" />
                                </div>
                            </div>
                        )}

                        {/* Floating Section Navigator */}
                        {!isPreviewMode && (
                            // Between the top bar and the bottom of the screen (centred there); with many pages the numbers scroll
                                            // inside it and «+» / «Gerir páginas» stay in sight. The scroll area is wide (tooltips fit) but lets
                                            // clicks through outside the buttons.
                            <div className="absolute left-6 top-[88px] bottom-6 z-[100] flex flex-col justify-center pointer-events-none">
                                {/* The whole navigator is at most 690px tall */}
                                <div data-page-nav-column className="flex flex-col min-h-0 max-h-[690px]">
                                <div data-page-nav className="min-h-0 flex flex-col gap-3 overflow-y-auto overflow-x-hidden overscroll-contain w-[340px] -ml-2 pl-2 py-2 pr-[290px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {items.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        data-page-nav-item={item.id}
                                        onClick={() => goToPage(item.id)}
                                        className={cn(
                                            "group relative w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 border pointer-events-auto",
                                            item.is_hidden && "opacity-40",
                                            selectedModuleId === item.id
                                                ? "bg-[#EF0050] border-[#EF0050] text-white shadow-lg shadow-[#EF0050]/20 scale-110"
                                                : "bg-[#111] border-[#222] text-[#555] hover:border-[#444] hover:text-white"
                                        )}
                                    >
                                        <span className="text-[10px] font-bold">{(idx + 1).toString().padStart(2, '0')}</span>

                                        {/* Tooltip labels */}
                                        <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 rounded-md bg-black/90 border border-white/10 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                                            {item.title}{item.is_hidden ? " · oculta" : ""}
                                            <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-black/90" />
                                        </div>
                                    </button>
                                ))}
                                </div>
                                <div className="h-px bg-[#222] my-1 w-10 shrink-0" />
                                <div className="flex flex-col gap-3 shrink-0 pointer-events-auto w-10">
                                <button
                                    type="button"
                                    onClick={openNewPage}
                                    title="Adicionar página"
                                    aria-label="Adicionar página"
                                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-dashed border-[#333] bg-[#111] text-[#777] hover:text-white hover:border-[#EF0050] transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPagesOpen(true)}
                                    title="Gerir páginas"
                                    aria-label="Gerir páginas"
                                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#222] bg-[#111] text-[#777] hover:text-white hover:border-[#444] transition-colors"
                                >
                                    <Layers className="w-4 h-4" />
                                </button>
                                </div>
                                </div>
                            </div>
                        )}

                        <PagesPanel
                            isOpen={isPagesOpen && !isPreviewMode}
                            onClose={() => setIsPagesOpen(false)}
                            pages={items}
                            selectedId={selectedModuleId}
                            onSelect={setSelectedModuleId}
                            onAdd={() => { setIsPagesOpen(false); openNewPage() }}
                            onRename={handleRenameModule}
                            onMove={handleMoveModule}
                            onToggleHidden={handleToggleVisibility}
                            onDuplicate={handleDuplicateModule}
                            onDelete={handleDeleteModule}
                        />

                        <MainCanvas
                            modules={items}
                            selectedId={selectedModuleId}
                            onSelectPage={setSelectedModuleId}
                            activeBlockId={activeBlockId}
                            onSelectBlock={setActiveBlockId}
                            onUpdateModule={handleUpdateModule}
                            isReadOnly={isPreviewMode}
                            scrollTo={scrollTo}
                            brandId={brandId}
                            actions={{
                                onUpdatePage: handleUpdatePage,
                                onAddPageAfter: (afterId, page, style) => { handleCreatePage(page, afterId, style) },
                                onDuplicatePage: handleDuplicateModule,
                                onDeletePage: handleDeleteModule,
                                onToggleHidden: handleToggleVisibility,
                                onChangeFormat: (id) => { setSelectedModuleId(id); setFormatModal("change") },
                            }}
                        />


                        <DragOverlay>
                            {activeDragId ? (
                                <div className="p-2 bg-bg-3 text-white rounded shadow-lg flex items-center gap-2 w-64 opacity-90 border border-accent-indigo">
                                    <span className="truncate">{items.find(i => i.id === activeDragId)?.title}</span>
                                </div>
                            ) : null}
                        </DragOverlay>

                    </div>

                </div>

                <BrandSettingsPanel
                    isOpen={isSettingsPanelOpen}
                    onClose={() => setIsSettingsPanelOpen(false)}
                    brandId={brandId}
                    sections={["colors", "fonts"]}
                />

                <PageFormatModal
                    isOpen={formatModal !== null}
                    mode={formatModal || "create"}
                    initial={formatModal === "change" ? activeModule?.content_json?.page || { format: "web" } : (activeModule?.content_json?.page || { format: "a4", orientation: "portrait" })}
                    pageCount={items.length}
                    onClose={() => setFormatModal(null)}
                    onConfirm={async (page, { applyToAll }) => {
                        if (formatModal === "create") await handleCreatePage(page)
                        else handleChangeFormat(page, applyToAll)
                    }}
                />

                <SaveTemplateModal
                    isOpen={isSaveTemplateOpen}
                    onClose={() => setIsSaveTemplateOpen(false)}
                    proposalId={proposalId}
                    projectName={projectName}
                    pageCount={items.length}
                    beforeSave={flushSaves}
                />

                <ComponentsModal
                    isOpen={isComponentsOpen}
                    onClose={() => setIsComponentsOpen(false)}
                    onInsertPage={handleInsertComponentPage}
                    onInsertIntoCurrent={handleInsertComponentIntoCurrent}
                    onInsertTemplate={handleInsertTemplate}
                    hasCurrentPage={!!activeModule}
                    context={componentContext}
                />

                <AssetLibrary
                    isOpen={isAssetLibraryOpen}
                    onClose={() => setIsAssetLibraryOpen(false)}
                    brandId={brandId}
                />
            </DndContext >
        </BrandDesignProvider>
    )
}
