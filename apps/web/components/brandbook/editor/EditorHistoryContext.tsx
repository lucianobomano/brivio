"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { Block } from './types'

// History entry type
interface HistoryEntry {
    blocks: Block[]
    description: string
    timestamp: number
}

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
}

export function EditorHistoryProvider({
    children,
    initialBlocks,
    onBlocksChange
}: EditorHistoryProviderProps) {
    // History stacks
    const [past, setPast] = useState<HistoryEntry[]>([])
    const [present, setPresent] = useState<Block[]>(initialBlocks)
    const [future, setFuture] = useState<HistoryEntry[]>([])

    // Toast state
    const [toastData, setToastData] = useState<ToastData | null>(null)
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Flag to prevent adding to history on internal updates
    const isInternalUpdate = useRef(false)

    // Max history size
    const MAX_HISTORY = 50

    // Log initialization
    console.log('[EditorHistoryProvider] Mounted with', initialBlocks.length, 'initial blocks')

    // Track if this is the first render
    const isFirstRender = useRef(true)
    const initialBlocksKey = JSON.stringify(initialBlocks)

    // Sync with external initial blocks when module changes
    useEffect(() => {
        // Skip first render since we already initialize with initialBlocks
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        // Only sync if not from internal update
        if (!isInternalUpdate.current) {
            setPresent(initialBlocks)
            // Clear history when switching modules
            setPast([])
            setFuture([])
        }
    }, [initialBlocksKey]) // eslint-disable-line react-hooks/exhaustive-deps

    // Set blocks with history tracking
    const setBlocks = useCallback((newBlocks: Block[], description: string = 'Edit') => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false
            setPresent(newBlocks)
            return
        }

        setPast(prev => {
            const newPast = [...prev, { blocks: present, description, timestamp: Date.now() }]
            // Limit history size
            if (newPast.length > MAX_HISTORY) {
                return newPast.slice(-MAX_HISTORY)
            }
            return newPast
        })

        setPresent(newBlocks)
        setFuture([]) // Clear redo stack on new action

        // Notify parent
        if (onBlocksChange) {
            onBlocksChange(newBlocks)
        }
    }, [present, onBlocksChange])

    // Set blocks without tracking history (for loading, etc.)
    const setBlocksWithoutHistory = useCallback((newBlocks: Block[]) => {
        isInternalUpdate.current = true
        setPresent(newBlocks)
        if (onBlocksChange) {
            onBlocksChange(newBlocks)
        }
    }, [onBlocksChange])

    // Undo
    const undo = useCallback(() => {
        if (past.length === 0) return

        const previous = past[past.length - 1]
        const newPast = past.slice(0, -1)

        isInternalUpdate.current = true
        setPast(newPast)
        setFuture(prev => [{ blocks: present, description: 'Undo', timestamp: Date.now() }, ...prev])
        setPresent(previous.blocks)

        if (onBlocksChange) {
            onBlocksChange(previous.blocks)
        }
    }, [past, present, onBlocksChange])

    // Redo
    const redo = useCallback(() => {
        if (future.length === 0) return

        const next = future[0]
        const newFuture = future.slice(1)

        isInternalUpdate.current = true
        setFuture(newFuture)
        setPast(prev => [...prev, { blocks: present, description: 'Redo', timestamp: Date.now() }])
        setPresent(next.blocks)

        if (onBlocksChange) {
            onBlocksChange(next.blocks)
        }
    }, [future, present, onBlocksChange])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input or contenteditable
            const target = e.target as HTMLElement
            const isEditing = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable

            if (isEditing) {
                return
            }

            const key = e.key.toLowerCase()

            // CTRL+Z or CMD+Z for Undo
            if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
                e.preventDefault()
                console.log('[EditorHistory] Undo triggered, canUndo:', past.length > 0)
                undo()
            }

            // CTRL+SHIFT+Z or CMD+SHIFT+Z for Redo
            if ((e.ctrlKey || e.metaKey) && key === 'z' && e.shiftKey) {
                e.preventDefault()
                console.log('[EditorHistory] Redo triggered (Shift+Z), canRedo:', future.length > 0)
                redo()
            }

            // CTRL+Y for Redo (Windows)
            if ((e.ctrlKey || e.metaKey) && key === 'y') {
                e.preventDefault()
                console.log('[EditorHistory] Redo triggered (Y), canRedo:', future.length > 0)
                redo()
            }
        }

        console.log('[EditorHistory] Keyboard listener attached')
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            console.log('[EditorHistory] Keyboard listener removed')
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [undo, redo, past.length, future.length])

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
            'audio': 'Áudio'
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
                canUndo: past.length > 0,
                canRedo: future.length > 0,
                showDeleteToast,
                dismissToast,
                toastData
            }}
        >
            {children}
        </EditorHistoryContext.Provider>
    )
}
