"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { BrandNode, BrandRelationship, BrandSpace, SemanticRelationship, BrandCategory } from "../types"
import { BrandNodeComponent } from "./BrandNodeComponent"
import { ConnectionLines } from "./ConnectionLines"
import { CanvasFrames, CanvasFrameItem } from "./CanvasFrames"
import { CanvasMinimap } from "./CanvasMinimap"
import { CanvasControls } from "./CanvasControls"
import { BrandMapView } from "./BrandMapView"
import { NodeInspectorDrawer } from "../inspector/NodeInspectorDrawer"
import { CreateBrandWithAIModal } from "../modals/CreateBrandWithAIModal"
import { AskBrandDrawer } from "../modals/AskBrandDrawer"
import { BrandGuardianModal } from "../modals/BrandGuardianModal"
import { AddNodeModal } from "../modals/AddNodeModal"
import { BrandBookExportModal } from "../modals/BrandBookExportModal"
import { 
    saveBrandSpaceCanvas, 
    approveBrandObject, 
    rejectBrandObject, 
    executeNodeAI, 
    generateBrandWorkflowAI,
    updateBrandSpaceContext
} from "@/app/actions/brandops"
import { toast } from "sonner"

type ConnectorKind = 'text' | 'asset' | 'audio' | 'decision' | 'context'

function connectorKindFor(node: BrandNode): ConnectorKind {
    if (['discovery', 'strategy', 'verbal_identity', 'behavioural_identity', 'governance'].includes(node.category)) return 'text'
    if (node.category === 'visual_identity' || ['image', 'video', 'file'].includes(node.type) || node.type.includes('logo') || node.type.includes('color') || node.type.includes('photography')) return 'asset'
    if (node.category === 'sensorial_identity' || node.type === 'audio' || node.type.includes('sonic')) return 'audio'
    if (node.category === 'governance' || ['decision', 'approval'].includes(node.type) || node.type.includes('decision')) return 'decision'
    if (node.category === 'verbal_identity' || ['text', 'note', 'comment', 'url', 'ai_prompt'].includes(node.type) || node.type.includes('naming') || node.type.includes('messaging') || node.type.includes('tone')) return 'text'
    return 'context'
}

interface BrandCanvasProps {
    space: BrandSpace
    initialNodes: BrandNode[]
    initialRelationships: BrandRelationship[]
    brandId: string
    brandName: string
}

export function BrandCanvas({
    space,
    initialNodes,
    initialRelationships,
    brandId,
    brandName
}: BrandCanvasProps) {
    // 1. Canvas Viewport State (pan & zoom)
    const [viewport, setViewport] = useState({
        x: space.viewport?.x || 100,
        y: space.viewport?.y || 80,
        zoom: space.viewport?.zoom || 0.85
    })

    const [containerSize, setContainerSize] = useState({ width: 1400, height: 900 })
    const canvasContainerRef = useRef<HTMLDivElement>(null)

    // 2. Nodes & Relationships State
    const [nodes, setNodes] = useState<BrandNode[]>(initialNodes)
    const [relationships, setRelationships] = useState<BrandRelationship[]>(initialRelationships)
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
    const [inspectingNode, setInspectingNode] = useState<BrandNode | null>(null)

    // 3. Undo / Redo History Stack
    const [history, setHistory] = useState<{ nodes: BrandNode[]; relationships: BrandRelationship[] }[]>([])
    const [future, setFuture] = useState<{ nodes: BrandNode[]; relationships: BrandRelationship[] }[]>([])

    // 4. Tools & Interaction Modes
    const [mode, setMode] = useState<'select' | 'pan'>('select')
    const [viewMode, setViewMode] = useState<'canvas' | 'brand_map'>('canvas')
    const [useOfficialContext, setUseOfficialContext] = useState(space.use_official_context ?? true)

    // 5. Dragging State (Nodes, Canvas Pan, Connection Drag, Marquee)
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })

    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
    const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)
    const [nodeInitialPositions, setNodeInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map())

    const [activeConnection, setActiveConnection] = useState<{
        sourceNodeId: string
        startX: number
        startY: number
        currentX: number
        currentY: number
        connectorKind: ConnectorKind
    } | null>(null)

    const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)

    // 6. Modals State
    const [isCreateAIModalOpen, setIsCreateAIModalOpen] = useState(false)
    const [isAskBrandOpen, setIsAskBrandOpen] = useState(false)
    const [isBrandGuardianOpen, setIsBrandGuardianOpen] = useState(false)
    const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false)
    const [nodePopoverPosition, setNodePopoverPosition] = useState({ x: 80, y: 80 })
    const [isBrandBookExportOpen, setIsBrandBookExportOpen] = useState(false)
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)
    const [isSpacePressed, setIsSpacePressed] = useState(false)
    const hasMounted = useRef(false)

    // Push state into undo history
    const pushHistory = useCallback(() => {
        setHistory(prev => [...prev.slice(-20), { nodes: JSON.parse(JSON.stringify(nodes)), relationships: [...relationships] }])
        setFuture([])
    }, [nodes, relationships])

    // Undo
    const handleUndo = () => {
        if (history.length === 0) return
        const prev = history[history.length - 1]
        setFuture(f => [{ nodes, relationships }, ...f])
        setNodes(prev.nodes)
        setRelationships(prev.relationships)
        setHistory(h => h.slice(0, -1))
        toast.info("Desfeito")
    }

    // Redo
    const handleRedo = () => {
        if (future.length === 0) return
        const next = future[0]
        setHistory(h => [...h, { nodes, relationships }])
        setNodes(next.nodes)
        setRelationships(next.relationships)
        setFuture(f => f.slice(1))
        toast.info("Refeito")
    }

    // Resize listener for minimap and canvas bounds
    useEffect(() => {
        const updateSize = () => {
            if (canvasContainerRef.current) {
                setContainerSize({
                    width: canvasContainerRef.current.clientWidth,
                    height: canvasContainerRef.current.clientHeight
                })
            }
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    // Keyboard shortcuts are scoped to the canvas and never steal input editing.
    useEffect(() => {
        const isEditable = (target: EventTarget | null) => target instanceof HTMLElement &&
            (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

        const onKeyDown = (event: KeyboardEvent) => {
            if (isEditable(event.target)) return
            if (event.code === "Space") {
                event.preventDefault()
                setIsSpacePressed(true)
            }
            if (event.key.toLowerCase() === "v") setMode("select")
            if (event.key.toLowerCase() === "h") setMode("pan")
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
                event.preventDefault()
                if (event.shiftKey) handleRedo()
                else handleUndo()
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
                event.preventDefault()
                handleRedo()
            }
            if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeIds.length > 0) {
                selectedNodeIds.forEach(handleDeleteNode)
            }
        }
        const onKeyUp = (event: KeyboardEvent) => {
            if (event.code === "Space") setIsSpacePressed(false)
        }
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
        }
    }, [selectedNodeIds, history, future, nodes, relationships])

    // Auto-save debounced to Supabase Postgres
    useEffect(() => {
        // Do not overwrite persisted data when the initial server state hydrates.
        if (!hasMounted.current) {
            hasMounted.current = true
            return
        }
        const timer = setTimeout(() => {
            saveBrandSpaceCanvas(space.id, nodes, relationships, viewport)
        }, 1500)
        return () => clearTimeout(timer)
    }, [nodes, relationships, viewport, space.id])

    // 7. Mouse Wheel for Zoom & Pan
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        if (!e.shiftKey) {
            // Wheel always zooms at the pointer, matching the canvas interaction.
            const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
            const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.2), 2.2)

            // Zoom centered on cursor
            const rect = canvasContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
            const cursorX = e.clientX - rect.left
            const cursorY = e.clientY - rect.top

            const newX = cursorX - (cursorX - viewport.x) * (newZoom / viewport.zoom)
            const newY = cursorY - (cursorY - viewport.y) * (newZoom / viewport.zoom)

            setViewport({ x: newX, y: newY, zoom: newZoom })
        } else {
            // Shift + wheel pans horizontally without changing the scale.
            setViewport(prev => ({
                ...prev,
                x: prev.x - e.deltaX * 0.9,
                y: prev.y - e.deltaY * 0.9
            }))
        }
    }

    // 8. Pan & Zoom Controls
    const handleZoomIn = () => {
        setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 2.2) }))
    }

    const handleZoomOut = () => {
        setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.2) }))
    }

    const handleZoomReset = () => {
        setViewport(prev => ({ ...prev, zoom: 1 }))
    }

    const handleFitToScreen = () => {
        if (nodes.length === 0) {
            setViewport({ x: 100, y: 100, zoom: 0.85 })
            return
        }

        const minX = Math.min(...nodes.map(n => n.x))
        const minY = Math.min(...nodes.map(n => n.y))
        const maxX = Math.max(...nodes.map(n => n.x + (n.width || 340)))
        const maxY = Math.max(...nodes.map(n => n.y + (n.height || 220)))

        const contentW = maxX - minX + 200
        const contentH = maxY - minY + 200

        const zoomX = containerSize.width / contentW
        const zoomY = containerSize.height / contentH
        const fitZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.25), 1.2)

        const fitX = (containerSize.width - contentW * fitZoom) / 2 - minX * fitZoom + 100 * fitZoom
        const fitY = (containerSize.height - contentH * fitZoom) / 2 - minY * fitZoom + 100 * fitZoom

        setViewport({ x: fitX, y: fitY, zoom: fitZoom })
    }

    // 9. Node Dragging Handler
    const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
        if (e.button !== 0) return // Left click only
        e.stopPropagation()

        let currentSelection = selectedNodeIds
        if (!selectedNodeIds.includes(nodeId)) {
            currentSelection = [nodeId]
            setSelectedNodeIds([nodeId])
        }

        // Capture the state before moving so Undo genuinely restores positions.
        setHistory(prev => [...prev.slice(-20), { nodes: JSON.parse(JSON.stringify(nodes)), relationships: [...relationships] }])
        setFuture([])
        setDraggingNodeId(nodeId)
        setDragStartPos({ x: e.clientX, y: e.clientY })

        // Snapshot initial positions for all selected nodes to support multi-drag!
        const initialPosMap = new Map<string, { x: number; y: number }>()
        nodes.forEach(n => {
            if (currentSelection.includes(n.id)) {
                initialPosMap.set(n.id, { x: n.x, y: n.y })
            }
        })
        setNodeInitialPositions(initialPosMap)
    }

    // 10. Start Connection Wire Dragging
    const handleStartConnection = (nodeId: string, handleType: 'source' | 'target', e: React.MouseEvent, requestedKind?: string) => {
        e.stopPropagation()
        if (handleType !== 'source') return
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return

        const canvasRect = canvasContainerRef.current?.getBoundingClientRect()
        const portX = canvasRect ? (e.clientX - canvasRect.left - viewport.x) / viewport.zoom : node.x + (node.width || 340) + 21
        const portY = canvasRect ? (e.clientY - canvasRect.top - viewport.y) / viewport.zoom : node.y + 16
        const connectorKind: ConnectorKind = ['image', 'video', 'file', 'asset'].includes(requestedKind || '')
            ? 'asset'
            : ['note', 'comment', 'text'].includes(requestedKind || '')
                ? 'text'
                : requestedKind === 'audio'
                    ? 'audio'
                    : connectorKindFor(node)

        setActiveConnection({
            sourceNodeId: nodeId,
            startX: portX,
            startY: portY,
            currentX: portX,
            currentY: portY,
            connectorKind
        })
    }

    const handleCompleteConnection = (targetNodeId: string, requestedTargetKind: string) => {
        if (!activeConnection || activeConnection.sourceNodeId === targetNodeId) return

        const targetKind: ConnectorKind = ['image', 'video', 'file', 'asset'].includes(requestedTargetKind)
            ? 'asset'
            : ['note', 'comment', 'text'].includes(requestedTargetKind)
                ? 'text'
                : requestedTargetKind === 'audio'
                    ? 'audio'
                    : connectorKindFor(nodes.find(n => n.id === targetNodeId)!)

        if (activeConnection.connectorKind !== targetKind) {
            toast.error("Este conector aceita apenas um contexto compatível.")
            setActiveConnection(null)
            return
        }

        const exists = relationships.some(rel => rel.source_node_id === activeConnection.sourceNodeId && rel.target_node_id === targetNodeId)
        if (!exists) {
            const sourceNode = nodes.find(n => n.id === activeConnection.sourceNodeId)
            pushHistory()
            setRelationships(prev => [...prev, {
                id: crypto.randomUUID(),
                space_id: space.id,
                source_node_id: activeConnection.sourceNodeId,
                target_node_id: targetNodeId,
                relationship_type: 'supports',
                status: 'active',
                metadata: {
                    connector_kind: activeConnection.connectorKind,
                    source_port_index: Math.max(0, Math.round((activeConnection.startY - ((sourceNode?.y || 0) + 16)) / 48))
                }
            }])
            toast.success("Conexão estabelecida.")
        }
        setActiveConnection(null)
    }

    // 11. Mouse Move over Canvas (Handles Pan, Drag Nodes, Connection Wire, Marquee)
    const handleMouseMove = (e: React.MouseEvent) => {
        // A. Panning Canvas
        if (isPanning) {
            setViewport(prev => ({
                ...prev,
                x: prev.x + (e.clientX - panStart.x),
                y: prev.y + (e.clientY - panStart.y)
            }))
            setPanStart({ x: e.clientX, y: e.clientY })
            return
        }

        // B. Dragging Nodes (Multi-node drag)
        if (draggingNodeId && dragStartPos && nodeInitialPositions.size > 0) {
            const dx = (e.clientX - dragStartPos.x) / viewport.zoom
            const dy = (e.clientY - dragStartPos.y) / viewport.zoom

            setNodes(prev => prev.map(n => {
                const initial = nodeInitialPositions.get(n.id)
                if (initial) {
                    return {
                        ...n,
                        x: initial.x + dx,
                        y: initial.y + dy
                    }
                }
                return n
            }))
            return
        }

        // C. Dragging Active Connection Wire
        if (activeConnection) {
            const rect = canvasContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
            const canvasX = (e.clientX - rect.left - viewport.x) / viewport.zoom
            const canvasY = (e.clientY - rect.top - viewport.y) / viewport.zoom

            setActiveConnection(prev => prev ? ({
                ...prev,
                currentX: canvasX,
                currentY: canvasY
            }) : null)
            return
        }

        // D. Marquee Selection Box
        if (marquee) {
            setMarquee(prev => prev ? ({ ...prev, currentX: e.clientX, currentY: e.clientY }) : null)
        }
    }

    // 12. Mouse Up on Canvas
    const handleMouseUp = (e: React.MouseEvent) => {
        if (isPanning) {
            setIsPanning(false)
        }

        if (draggingNodeId) {
            setDraggingNodeId(null)
            setDragStartPos(null)
            setNodeInitialPositions(new Map())
        }

        // Finish Connection Wire
        if (activeConnection) {
            const rect = canvasContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
            const dropX = (e.clientX - rect.left - viewport.x) / viewport.zoom
            const dropY = (e.clientY - rect.top - viewport.y) / viewport.zoom

            // Check if dropped near any target node's input port (left side)
            const targetNode = nodes.find(n => {
                if (n.id === activeConnection.sourceNodeId) return false
                const handleX = n.x - 21
                const handleY = n.y + (n.height || 220) - 16
                const dist = Math.hypot(dropX - handleX, dropY - handleY)
                return dist < 45
            })

            if (targetNode) {
                if (connectorKindFor(targetNode) !== activeConnection.connectorKind) {
                    toast.error("Este conector aceita apenas um contexto compatível.")
                    setActiveConnection(null)
                    return
                }
                // Check if connection already exists
                const exists = relationships.some(r => 
                    r.source_node_id === activeConnection.sourceNodeId && r.target_node_id === targetNode.id
                )

                if (!exists) {
                    pushHistory()
                    const newRel: BrandRelationship = {
                        id: crypto.randomUUID(),
                        space_id: space.id,
                        source_node_id: activeConnection.sourceNodeId,
                        target_node_id: targetNode.id,
                        relationship_type: 'supports',
                        status: 'active',
                        metadata: {
                            connector_kind: activeConnection.connectorKind,
                            source_port_index: Math.max(0, Math.round((activeConnection.startY - ((nodes.find(n => n.id === activeConnection.sourceNodeId)?.y || 0) + 16)) / 48))
                        }
                    }
                    setRelationships(prev => [...prev, newRel])
                    toast.success("Conexão semântica estabelecida!")
                }
            }

            setActiveConnection(null)
        }

        // Finish Marquee Selection
        if (marquee) {
            const rect = canvasContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
            const x1 = Math.min(marquee.startX, marquee.currentX) - rect.left
            const x2 = Math.max(marquee.startX, marquee.currentX) - rect.left
            const y1 = Math.min(marquee.startY, marquee.currentY) - rect.top
            const y2 = Math.max(marquee.startY, marquee.currentY) - rect.top

            // Select all nodes inside the marquee box
            const selected = nodes.filter(n => {
                const screenX = n.x * viewport.zoom + viewport.x
                const screenY = n.y * viewport.zoom + viewport.y
                const screenW = (n.width || 340) * viewport.zoom
                const screenH = (n.height || 220) * viewport.zoom

                return screenX + screenW > x1 && screenX < x2 && screenY + screenH > y1 && screenY < y2
            }).map(n => n.id)

            setSelectedNodeIds(selected)
            setMarquee(null)
        }
    }

    // 13. Canvas Background Mouse Down (Starts Pan or Marquee)
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || mode === 'pan' || isSpacePressed) {
            // Middle click or Pan mode
            setIsPanning(true)
            setPanStart({ x: e.clientX, y: e.clientY })
        } else if (e.button === 0) {
            // Left click on empty space: start marquee selection & deselect
            if (!e.shiftKey) {
                setSelectedNodeIds([])
            }
            setMarquee({
                startX: e.clientX,
                startY: e.clientY,
                currentX: e.clientX,
                currentY: e.clientY
            })
        }
    }

    const handleCanvasContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        const rect = canvasContainerRef.current?.getBoundingClientRect()
        if (!rect) return
        setSelectedNodeIds([])
        setNodePopoverPosition({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 })
        setIsAddNodeModalOpen(true)
    }

    // 14. Node Operations: Approve, Reject, Run AI, Add, Delete
    const handleApproveNode = async (nodeId: string, customRationale?: string) => {
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return

        pushHistory()
        setNodes(prev => prev.map(n => n.id === nodeId ? {
            ...n,
            object: { ...n.object, status: 'approved', is_official: true, rationale: customRationale || n.object?.rationale }
        } : n))

        toast.success(`"${node.title}" aprovado e integrado ao Brand Context oficial!`)
        await approveBrandObject(node.object_id, customRationale)
    }

    const handleRejectNode = async (nodeId: string, customRationale?: string) => {
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return

        pushHistory()
        setNodes(prev => prev.map(n => n.id === nodeId ? {
            ...n,
            object: { ...n.object, status: 'rejected', is_official: false, rationale: customRationale }
        } : n))

        toast.info(`Proposta de "${node.title}" rejeitada. O histórico permanece salvo.`)
        await rejectBrandObject(node.object_id, customRationale)
    }

    const handleRunNodeAI = async (nodeId: string, customPrompt?: string) => {
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, is_executing: true } : n))
        toast.info("Executando BrandOps AI para este nó...")

        try {
            const res = await executeNodeAI(nodeId, customPrompt)
            if (res.success && res.version) {
                pushHistory()
                setNodes(prev => prev.map(n => {
                    if (n.id === nodeId) {
                        return {
                            ...n,
                            is_executing: false,
                            outputs_history: [...(n.outputs_history || []), {
                                ...res.version,
                                status: 'ai_proposed' as const
                            }],
                            object: {
                                ...n.object,
                                content: res.version.content,
                                status: 'ai_proposed',
                                is_official: false,
                                version: res.version.version,
                                rationale: res.version.rationale
                            }
                        }
                    }
                    return n
                }))
                toast.success("Nova versão proposta gerada com sucesso pela IA!")
            } else {
                setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, is_executing: false } : n))
            }
        } catch {
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, is_executing: false } : n))
            toast.error("Falha na execução da IA")
        }
    }

    const handleDeleteNode = (nodeId: string) => {
        pushHistory()
        setNodes(prev => prev.filter(n => n.id !== nodeId))
        setRelationships(prev => prev.filter(r => r.source_node_id !== nodeId && r.target_node_id !== nodeId))
        setSelectedNodeIds(prev => prev.filter(id => id !== nodeId))
        if (inspectingNode?.id === nodeId) setInspectingNode(null)
        toast.success("Nó removido do canvas.")
    }

    const handleAddNode = (type: string, category: BrandCategory, title: string, defaultContent: any) => {
        pushHistory()
        // Center node in current viewport
        const spawnX = Math.round((nodePopoverPosition.x - viewport.x) / viewport.zoom - 170)
        const spawnY = Math.round((nodePopoverPosition.y - viewport.y) / viewport.zoom - 110)

        // Database identifiers are UUIDs; timestamp labels cannot be persisted.
        const newNodeId = crypto.randomUUID()
        const newObjId = crypto.randomUUID()

        const newNode: BrandNode = {
            id: newNodeId,
            space_id: space.id,
            object_id: newObjId,
            type,
            category,
            title,
            x: spawnX,
            y: spawnY,
            width: 340,
            height: 220,
            outputs_history: [],
            object: {
                id: newObjId,
                brand_id: brandId,
                space_id: space.id,
                type,
                category,
                title,
                content: defaultContent,
                status: 'draft',
                confidence: 100,
                source: 'human',
                version: 1,
                is_official: false
            }
        }

        setNodes(prev => [...prev, newNode])
        setSelectedNodeIds([newNodeId])
        toast.success(`Nó "${title}" adicionado ao canvas!`)
    }

    const handleGenerateBrandAI = async (prompt: string) => {
        setIsGeneratingAI(true)
        try {
            const res = await generateBrandWorkflowAI(brandId, space.id, prompt)
            if (res.success && res.nodes) {
                pushHistory()
                // A generated workflow starts as a navigable constellation, not a
                // sequence of forced category columns. People can then compose it freely.
                const centerX = Math.round((-viewport.x + containerSize.width / 2) / viewport.zoom)
                const centerY = Math.round((-viewport.y + containerSize.height / 2) / viewport.zoom)
                const freeNodes = res.nodes.map((node, index) => {
                    const angle = index * 2.399963229728653
                    const radius = 260 + Math.floor(index / 5) * 240
                    return {
                        ...node,
                        x: Math.round(centerX + Math.cos(angle) * radius - (node.width || 340) / 2),
                        y: Math.round(centerY + Math.sin(angle) * radius - (node.height || 220) / 2)
                    }
                })
                setNodes(freeNodes)
                setRelationships(res.relationships || [])
                setIsCreateAIModalOpen(false)
                toast.success("Workflow completo da marca gerado com sucesso!")
                setTimeout(handleFitToScreen, 200)
            } else {
                toast.error(res.error || "Erro ao gerar marca com IA")
            }
        } catch (e: any) {
            toast.error(e.message || "Falha na geração do workflow")
        } finally {
            setIsGeneratingAI(false)
        }
    }

    const handleOfficialContextChange = async (nextValue: boolean) => {
        const previousValue = useOfficialContext
        setUseOfficialContext(nextValue)
        const result = await updateBrandSpaceContext(space.id, nextValue)
        if (!result.success) {
            setUseOfficialContext(previousValue)
            toast.error(result.error || "Não foi possível actualizar o contexto oficial.")
            return
        }
        toast.success(nextValue ? "Este Space passou a usar o contexto oficial." : "Este Space deixou de usar o contexto oficial.")
    }

    // 15. Frames definition for visually grouping nodes
    const frames: CanvasFrameItem[] = [
        { id: 'f_disc', category: 'discovery', title: '1. Discovery & Pesquisa', x: 40, y: 40, width: 380, height: 950 },
        { id: 'f_strat', category: 'strategy', title: '2. Estratégia de Marca', x: 440, y: 40, width: 380, height: 1250 },
        { id: 'f_verb', category: 'verbal_identity', title: '3. Identidade Verbal', x: 840, y: 40, width: 380, height: 1250 },
        { id: 'f_vis', category: 'visual_identity', title: '4. Identidade Visual', x: 1240, y: 40, width: 380, height: 1000 },
        { id: 'f_act', category: 'activation', title: '5. Ativação & Governança', x: 1640, y: 40, width: 380, height: 1000 }
    ]

    // Compute Brand Completeness Score
    const totalApproved = nodes.filter(n => n.object?.status === 'approved').length
    const completenessScore = nodes.length > 0 ? Math.min(100, Math.round((totalApproved / Math.max(nodes.length * 0.7, 1)) * 100)) : 0

    return (
        <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#F7F7F6] text-[#171719] select-none">
            {/* View Mode Switcher: Canvas vs Brand Map */}
            {viewMode === 'brand_map' ? (
                <BrandMapView
                    nodes={nodes}
                    onOpenInspector={(n) => setInspectingNode(n)}
                    onSwitchToCanvas={() => setViewMode('canvas')}
                />
            ) : (
                /* Infinite Canvas Engine */
                <div
                    ref={canvasContainerRef}
                    onWheel={handleWheel}
                    onMouseDown={handleCanvasMouseDown}
                    onContextMenu={handleCanvasContextMenu}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="relative w-full h-full min-h-screen cursor-default overflow-hidden"
                >
                    {/* Scalable Matrix Grid Background */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-transform duration-75"
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(23, 23, 25, 0.18) 1px, transparent 1.15px)`,
                            backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
                            backgroundPosition: `${viewport.x}px ${viewport.y}px`
                        }}
                    />

                    {/* Canvas World Layer (Pan & Zoom Transformed) */}
                    <div
                        className="absolute origin-top-left will-change-transform"
                        style={{
                            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
                        }}
                    >
                        {/* Semantic relationships connect freely placed nodes. */}
                        <ConnectionLines
                            relationships={relationships}
                            nodes={nodes}
                            activeConnection={activeConnection}
                            onDeleteRelationship={(relId) => {
                                pushHistory()
                                setRelationships(prev => prev.filter(r => r.id !== relId))
                                toast.success("Conexão removida.")
                            }}
                            onChangeRelationshipType={(relId, newType) => {
                                pushHistory()
                                setRelationships(prev => prev.map(r => r.id === relId ? { ...r, relationship_type: newType } : r))
                                toast.success("Tipo de relação atualizado.")
                            }}
                            zoom={viewport.zoom}
                        />

                        {/* Brand nodes are never forced into columns. */}
                        {nodes.map((node) => (
                            <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                            >
                                <BrandNodeComponent
                                    node={node}
                                    isSelected={selectedNodeIds.includes(node.id)}
                                    onSelect={(id, multi) => {
                                        if (multi) {
                                            setSelectedNodeIds(prev => 
                                                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                            )
                                        } else {
                                            setSelectedNodeIds([id])
                                        }
                                    }}
                                    onOpenInspector={(n) => setInspectingNode(n)}
                                    onStartConnection={handleStartConnection}
                                    onCompleteConnection={handleCompleteConnection}
                                    onRunNodeAI={handleRunNodeAI}
                                    onApproveNode={handleApproveNode}
                                    onRejectNode={handleRejectNode}
                                    onDeleteNode={handleDeleteNode}
                                    onResizeNode={(nodeId, width, height) => {
                                        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, width, height } : n))
                                    }}
                                    zoom={viewport.zoom}
                                />
                            </div>
                        ))}
                    </div>

                    {nodes.length === 0 && (
                        <section className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <div className="w-[min(920px,calc(100%-96px))] -mt-8 text-center pointer-events-auto">
                                <div className="mx-auto mb-7 h-52 w-52 rounded-full border border-dashed border-fuchsia-300/80 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0,rgba(255,255,255,0.92)_52%,rgba(248,221,246,0.42)_100%)] shadow-[0_0_70px_rgba(217,70,239,0.14)]" />
                                <h1 className="text-3xl font-semibold tracking-tight text-[#171719]">O teu Brand Space está pronto</h1>
                                <p className="mt-2 text-sm text-zinc-500">Escolhe o primeiro nó e começa a construir a marca.</p>
                                <div className="mt-6 flex justify-center gap-5 text-sm text-zinc-600">
                                    <span className="rounded-full bg-zinc-200 px-4 py-2 font-medium text-zinc-900">Começar do zero</span>
                                    <span className="px-2 py-2">Templates</span>
                                    <span className="px-2 py-2">Brand Flows</span>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {[
                                        ['Brief', 'Adiciona o ponto de partida da marca'],
                                        ['Pesquisa', 'Importa referências e evidências'],
                                        ['Estratégia', 'Define a primeira direção'],
                                        ['Agente', 'Pede uma proposta contextual']
                                    ].map(([title, description]) => (
                                        <button key={title} onClick={() => setIsAddNodeModalOpen(true)} className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md">
                                            <span className="block text-sm font-semibold text-zinc-900">{title}</span>
                                            <span className="mt-1 block text-xs leading-5 text-zinc-500">{description}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setIsAddNodeModalOpen(true)} className="mt-5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-zinc-50">+ Adicionar nó</button>
                            </div>
                        </section>
                    )}

                    {/* Marquee Selection Box Overlay */}
                    {marquee && (
                        <div
                            className="absolute border border-[#FF0054] bg-[#FF0054]/10 pointer-events-none rounded z-40"
                            style={{
                                left: Math.min(marquee.startX, marquee.currentX),
                                top: Math.min(marquee.startY, marquee.currentY),
                                width: Math.abs(marquee.currentX - marquee.startX),
                                height: Math.abs(marquee.currentY - marquee.startY)
                            }}
                        />
                    )}

                    {/* Canvas Controls Header & Floating Toolbar */}
                    <CanvasControls
                        spaceName={space.name}
                        brandName={brandName}
                        brandId={brandId}
                        zoom={viewport.zoom}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                        onFitToScreen={handleFitToScreen}
                        canUndo={history.length > 0}
                        canRedo={future.length > 0}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        mode={mode}
                        setMode={setMode}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        useOfficialContext={useOfficialContext}
                        setUseOfficialContext={handleOfficialContextChange}
                        onOpenAddNode={() => { setNodePopoverPosition({ x: 82, y: 84 }); setIsAddNodeModalOpen(true) }}
                        onOpenCreateBrandAI={() => setIsCreateAIModalOpen(true)}
                        onOpenAskBrand={() => setIsAskBrandOpen(true)}
                        onOpenBrandGuardian={() => setIsBrandGuardianOpen(true)}
                        onOpenBrandBookExport={() => setIsBrandBookExportOpen(true)}
                        completenessScore={completenessScore}
                    />

                    {/* Radar Minimap */}
                    <CanvasMinimap
                        nodes={nodes}
                        viewport={viewport}
                        containerSize={containerSize}
                        onPanTo={(nx, ny) => setViewport(prev => ({ ...prev, x: nx, y: ny }))}
                    />
                </div>
            )}

            {/* Slide-over Node Inspector */}
            <NodeInspectorDrawer
                node={inspectingNode}
                onClose={() => setInspectingNode(null)}
                onUpdateNode={(nodeId, updatedObj) => {
                    pushHistory()
                    setNodes(prev => prev.map(n => {
                        if (n.id === nodeId) {
                            return {
                                ...n,
                                title: updatedObj.title || n.title,
                                object: {
                                    ...n.object,
                                    ...updatedObj
                                }
                            }
                        }
                        return n
                    }))
                    setInspectingNode(null)
                }}
                onApproveNode={handleApproveNode}
                onRejectNode={handleRejectNode}
                onDeleteNode={handleDeleteNode}
                onRunNodeAI={handleRunNodeAI}
                relationships={relationships}
                allNodes={nodes}
                onExportToBrandbook={() => {
                    setIsBrandBookExportOpen(true)
                }}
            />

            {/* "Criar Marca com IA" Modal */}
            <CreateBrandWithAIModal
                isOpen={isCreateAIModalOpen}
                onClose={() => setIsCreateAIModalOpen(false)}
                onGenerate={handleGenerateBrandAI}
                isGenerating={isGeneratingAI}
            />

            {/* "Pergunte à Marca" Copilot Drawer */}
            <AskBrandDrawer
                isOpen={isAskBrandOpen}
                onClose={() => setIsAskBrandOpen(false)}
                brandId={brandId}
                brandName={brandName}
            />

            {/* "Brand Guardian" Audit Modal */}
            <BrandGuardianModal
                isOpen={isBrandGuardianOpen}
                onClose={() => setIsBrandGuardianOpen(false)}
                brandName={brandName}
            />

            {/* "+ Adicionar Nó" Modal */}
            <AddNodeModal
                isOpen={isAddNodeModalOpen}
                onClose={() => setIsAddNodeModalOpen(false)}
                onAddNode={handleAddNode}
                position={nodePopoverPosition}
            />

            {/* "Exportar para Brand Book" Modal */}
            <BrandBookExportModal
                isOpen={isBrandBookExportOpen}
                onClose={() => setIsBrandBookExportOpen(false)}
                nodes={nodes}
                brandId={brandId}
                brandName={brandName}
            />
        </div>
    )
}
