"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { Block } from './types'

// Context type
interface EditorHistoryContextType {
    // State
    blocks: Block[]

    // Actions that track history
    setBlocks: (newBlocks: Block[], description?: string) => void
    setBlocksWithoutHistory: (newBlocks: Block[]) => void

    // Undo/Redo
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
    /** How many steps can be undone / redone (up to HISTORY_LIMIT) */
    undoCount: number
    redoCount: number

    // Toast
    showDeleteToast: (blockType: string) => void
    dismissToast: () => void
    toastData: ToastData | null
}

interface ToastData {
    message: string
    shortcut: string
    visible: boolean
}

const EditorHistoryContext = createContext<EditorHistoryContextType | null>(null)

export function useEditorHistory() {
    const context = useContext(EditorHistoryContext)
    if (!context) {
        throw new Error('useEditorHistory must be used within an EditorHistoryProvider')
    }
    return context
}

// Optional version that returns null when not in provider
export function useEditorHistoryOptional() {
    return useContext(EditorHistoryContext)
}

interface EditorHistoryProviderProps {
    children: React.ReactNode
    initialBlocks: Block[]
    onBlocksChange?: (blocks: Block[]) => void
    /** The page the blocks belong to: every page keeps its own history */
    historyKey?: string
    /** Preview / read-only: the shortcuts do nothing */
    enabled?: boolean
}

/** How many steps can be undone (a setting of the panel later on) */
export const HISTORY_LIMIT = 50

/** Changes to the same block closer than this are one step (typing a word, dragging a slider) */
const COALESCE_MS = 800

interface Stacks { past: Block[][], future: Block[][] }

/** A block's own data, without its columns (they are compared one by one) */
const ownData = (b: Block) => JSON.stringify({ ...b, content: { ...(b.content || {}), columns: undefined } })

/**
 * The one block (or column) that changed between two versions of the page, or null when several changed
 * or blocks were added / removed / moved. Used to merge quick successive edits of the same thing.
 */
const singleChange = (a: Block[], b: Block[]): string | null => {
    let changed: string | null = null
    let count = 0
    const walk = (x: Block[], y: Block[]): boolean => {
        if (x.length !== y.length) return false
        for (let i = 0; i < x.length; i++) {
            const p = x[i], q = y[i]
            if (p === q) continue
            if (!p || !q || p.id !== q.id) return false
            const pc = p.content?.columns as { id: string, settings?: unknown, blocks?: Block[] }[] | undefined
            const qc = q.content?.columns as { id: string, settings?: unknown, blocks?: Block[] }[] | undefined
            if (Array.isArray(pc) || Array.isArray(qc)) {
                if (!Array.isArray(pc) || !Array.isArray(qc) || pc.length !== qc.length) return false
                if (ownData(p) !== ownData(q)) { changed = p.id; count++ }
                for (let j = 0; j < pc.length; j++) {
                    if (pc[j] === qc[j]) continue
                    if (pc[j]?.id !== qc[j]?.id) return false
                    if (JSON.stringify(pc[j].settings) !== JSON.stringify(qc[j].settings)) { changed = pc[j].id; count++ }
                    if (!walk(pc[j].blocks || [], qc[j].blocks || [])) return false
                }
            } else if (JSON.stringify(p) !== JSON.stringify(q)) {
                changed = p.id
                count++
            }
        }
        return true
    }
    return walk(a, b) && count === 1 ? changed : null
}

/** Shortcuts act on the page unless the focus is in a field outside it (a panel, a search, a modal) */
const isOutsideField = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el || !el.tagName) return false
    const editable = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
    return editable && !el.closest('[data-page-scroller]')
}

export function EditorHistoryProvider({
    children,
    initialBlocks,
    onBlocksChange,
    historyKey = 'page',
    enabled = true,
}: EditorHistoryProviderProps) {
    // History of every page, kept while the editor is open
    const stacksRef = useRef(new Map<string, Stacks>())
    const [present, setPresent] = useState<Block[]>(initialBlocks)
    const presentRef = useRef<Block[]>(initialBlocks)
    const lastEdit = useRef<{ id: string | null, at: number }>({ id: null, at: 0 })
    // Steps available on each page (state, so the buttons and counters follow)
    const [counts, setCounts] = useState<Record<string, { undo: number, redo: number }>>({})

    // Toast state
    const [toastData, setToastData] = useState<ToastData | null>(null)
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const stack = useCallback((): Stacks => {
        let s = stacksRef.current.get(historyKey)
        if (!s) { s = { past: [], future: [] }; stacksRef.current.set(historyKey, s) }
        return s
    }, [historyKey])

    const syncCounts = useCallback(() => {
        const s = stack()
        setCounts(c => ({ ...c, [historyKey]: { undo: s.past.length, redo: s.future.length } }))
    }, [stack, historyKey])

    /** Records a new version of the page (merging quick edits of the same block into one step) */
    const record = useCallback((next: Block[]) => {
        const prev = presentRef.current
        if (next === prev) return
        const s = stack()
        const id = singleChange(prev, next)
        const now = Date.now()
        const merge = !!id && id === lastEdit.current.id && now - lastEdit.current.at < COALESCE_MS && s.past.length > 0
        if (!merge) {
            s.past.push(prev)
            if (s.past.length > HISTORY_LIMIT) s.past.splice(0, s.past.length - HISTORY_LIMIT)
        }
        s.future = []
        lastEdit.current = { id, at: now }
        presentRef.current = next
        setPresent(next)
        syncCounts()
    }, [stack, syncCounts])

    // Another page: its own history, starting from what it holds
    const [prevKey, setPrevKey] = useState(historyKey)
    if (prevKey !== historyKey) {
        setPrevKey(historyKey)
        setPresent(initialBlocks)
    }
    useEffect(() => {
        presentRef.current = initialBlocks
        lastEdit.current = { id: null, at: 0 }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the page changes
    }, [historyKey])

    // Changes made outside the canvas (a component from the library, a template, a save) are steps too;
    // the same page coming back from the server (equal content) is not
    useEffect(() => {
        const current = presentRef.current
        if (initialBlocks === current) return
        if ((initialBlocks?.length || 0) === 0 && (current?.length || 0) === 0) return
        if (JSON.stringify(initialBlocks) === JSON.stringify(current)) { presentRef.current = initialBlocks; return }
        record(initialBlocks)
    }, [initialBlocks, record])

    // Set blocks with history tracking
    const setBlocks = useCallback((newBlocks: Block[]) => {
        record(newBlocks)
        onBlocksChange?.(newBlocks)
    }, [record, onBlocksChange])

    // Set blocks without tracking history (for loading, etc.)
    const setBlocksWithoutHistory = useCallback((newBlocks: Block[]) => {
        presentRef.current = newBlocks
        setPresent(newBlocks)
        onBlocksChange?.(newBlocks)
    }, [onBlocksChange])

    const undo = useCallback(() => {
        const s = stack()
        const previous = s.past.pop()
        if (!previous) return
        s.future.unshift(presentRef.current)
        lastEdit.current = { id: null, at: 0 }
        presentRef.current = previous
        setPresent(previous)
        syncCounts()
        onBlocksChange?.(previous)
    }, [stack, syncCounts, onBlocksChange])

    const redo = useCallback(() => {
        const s = stack()
        const next = s.future.shift()
        if (!next) return
        s.past.push(presentRef.current)
        lastEdit.current = { id: null, at: 0 }
        presentRef.current = next
        setPresent(next)
        syncCounts()
        onBlocksChange?.(next)
    }, [stack, syncCounts, onBlocksChange])

    // Keyboard: Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z and Ctrl+Y redo — also while typing in a text of the page
    // (each word, deletion or style change is a step). Fields of panels, searches and modals keep their own.
    useEffect(() => {
        if (!enabled) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey) return
            const key = e.key.toLowerCase()
            const isUndo = key === 'z' && !e.shiftKey
            const isRedo = (key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)
            if (!isUndo && !isRedo) return
            if (isOutsideField(e.target)) return
            e.preventDefault()
            e.stopPropagation()
            if (isUndo) undo()
            else redo()
        }
        document.addEventListener('keydown', handleKeyDown, true)
        return () => document.removeEventListener('keydown', handleKeyDown, true)
    }, [enabled, undo, redo])

    // Show delete toast
    const showDeleteToast = useCallback((blockType: string) => {
        // Clear existing timeout
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current)
        }

        const blockTypeNames: Record<string, string> = {
            'text': 'Texto',
            'heading': 'Título',
            'image': 'Imagem',
            'video': 'Vídeo',
            'layout': 'Layout',
            'gallery': 'Galeria',
            'carousel': 'Carrossel',
            'divider': 'Divisor',
            'separator': 'Separador',
            'spacer': 'Espaçador',
            'color': 'Cor',
            'embed': 'Embed',
            'audio': 'Áudio',
            'story': 'Story Slider',
            'marquee': 'Texto em loop',
            'footer': 'Rodapé',
            'logo-showcase': 'Logótipo',
            'logo-size': 'Tamanho mínimo',
            'logo-misuse': 'Usos incorretos',
            'type-specimen': 'Espécime tipográfico',
            'color-accordion': 'Paleta em acordeão',
            'icon-specimen': 'Iconografia',
            'photo-grade': 'Tratamento fotográfico',
            'motif-field': 'Formas da marca',
            'social-mockup': 'Rede social'
        }

        const typeName = blockTypeNames[blockType] || 'Bloco'

        setToastData({
            message: `${typeName} eliminado`,
            shortcut: 'Ctrl+Z',
            visible: true
        })

        // Auto dismiss after 4 seconds
        toastTimeoutRef.current = setTimeout(() => {
            setToastData(prev => prev ? { ...prev, visible: false } : null)
            setTimeout(() => setToastData(null), 200)
        }, 4000)
    }, [])

    const dismissToast = useCallback(() => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current)
        }
        setToastData(prev => prev ? { ...prev, visible: false } : null)
        setTimeout(() => setToastData(null), 200)
    }, [])

    return (
        <EditorHistoryContext.Provider
            value={{
                blocks: present,
                setBlocks,
                setBlocksWithoutHistory,
                undo,
                redo,
                canUndo: (counts[historyKey]?.undo || 0) > 0,
                canRedo: (counts[historyKey]?.redo || 0) > 0,
                undoCount: counts[historyKey]?.undo || 0,
                redoCount: counts[historyKey]?.redo || 0,
                showDeleteToast,
                dismissToast,
                toastData
            }}
        >
            {children}
        </EditorHistoryContext.Provider>
    )
}
