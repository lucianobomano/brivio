"use client"

import React, { useState, useEffect } from "react"
import { TextModule } from "../modules/TextModule"
import { PaletteModule } from "../modules/PaletteModule"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AddSectionDialog } from "./AddSectionDialog"
import { AddItemDialog } from "./AddItemDialog"
import { SectionSettingsPanel, SectionSettings } from "./SectionSettingsPanel"
import { Block } from "./types"
import { BlockRenderer } from "./blocks/BlockRenderer"
import { ArrowUp, ArrowDown } from "lucide-react"
import { useBrandDesign } from "./BrandDesignContext"

// Helper Component for Section Divider
const SectionDivider = ({ onClick }: { onClick: () => void }) => (
    <div className="relative h-4 flex items-center justify-center group my-1">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-200" />
        <button
            onClick={onClick}
            className="relative z-10 bg-[#FF0054] text-white px-4 py-1.5 rounded-full text-xs font-medium opacity-50 hover:opacity-100 transition-opacity duration-200 flex items-center gap-2"
        >
            <span>+ Add Section</span>
        </button>
    </div>
)

// Helper Component for Section Wrapper
const SectionWrapper = ({ children, onMoveUp, onMoveDown, onEdit, isFirst, isLast, settingsPanel, settings, isReadOnly }: any) => {
    return (
        <div
            className={cn(
                "relative border border-dashed transition-colors p-[40px]",
                isReadOnly ? "border-transparent mb-0" : "group border-gray-200 hover:border-[#FF0054] mb-4"
            )}
            style={{
                backgroundColor: settings?.backgroundColor,
                backgroundImage: settings?.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                paddingTop: settings?.sectionPadding?.top || 40,
                paddingRight: settings?.sectionPadding?.right || 40,
                paddingBottom: settings?.sectionPadding?.bottom || 40,
                paddingLeft: settings?.sectionPadding?.left || 40,
            }}
        >
            {/* Toolbar - Only show if NOT read only */}
            {!isReadOnly && (
                <div className={cn(
                    "absolute -top-[28px] left-0 right-0 flex justify-between items-end transition-opacity z-10 px-[1px]",
                    settingsPanel ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <div className="flex gap-[1px]">
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                            disabled={isFirst}
                            className="bg-[#FF0054] text-white w-[36px] h-[28px] flex items-center justify-center disabled:opacity-50 hover:bg-[#D90046] rounded-t-[4px]"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                            disabled={isLast}
                            className="bg-[#FF0054] text-white w-[36px] h-[28px] flex items-center justify-center disabled:opacity-50 hover:bg-[#D90046] rounded-t-[4px]"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(e); }}
                            className="bg-[#FF0054] text-white px-6 h-[28px] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#D90046] rounded-t-[4px] flex items-center"
                        >
                            Editar secção
                        </button>
                        {/* Settings Panel anchored to the button - Positioned to the LEFT (right-full) to stay on screen */}
                        {settingsPanel && (
                            <div className="absolute top-0 right-[calc(100%+4px)] z-[100] cursor-default" onClick={(e) => e.stopPropagation()}>
                                {settingsPanel}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {children}
            {/* Overlay for inactive blocks if needed, but not requested */}
        </div>
    )
}

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9)

interface MainCanvasProps {
    activeModule: any | null
    onUpdateModule?: (id: string, content: any) => void
    activeBlockId: string | null
    onSelectBlock: (id: string | null) => void
    isReadOnly?: boolean
}

export function MainCanvas({ activeModule, onUpdateModule, activeBlockId, onSelectBlock, isReadOnly = false }: MainCanvasProps) {
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
    const [isAddItemOpen, setIsAddItemOpen] = useState(false)
    const [blocks, setBlocks] = useState<Block[]>([])
    // Context for adding blocks (if null, adds to root)
    const [addingContext, setAddingContext] = useState<{ parentId?: string, columnId?: string, insertIndex?: number } | null>(null)
    const [panelInitialPos, setPanelInitialPos] = useState<{ top: number, left: number } | null>(null)
    const { settings } = useBrandDesign()

    // Initialize blocks from activeModule content
    useEffect(() => {
        if (activeModule?.content_json?.blocks) {
            setBlocks(activeModule.content_json.blocks)
        } else {
            // New or legacy module without blocks
            setBlocks([])
        }
    }, [activeModule])

    const handleRequestAdd = (parentId: string, columnId: string) => {
        if (isReadOnly) return
        setAddingContext({ parentId, columnId })
        setIsAddItemOpen(true)
    }

    const handleAddBlock = (type: string, variant?: string) => {
        let content: any = { text: "" }

        // Initialize specific content structures
        if (type === 'heading') {
            content = {
                text: "Este é um Título padrão Brivio°",
                style: { fontSize: '82px' }
            }
        } else if (type === 'text') {
            content = {
                text: "Este é apenas um espaço em branco à espera da sua voz criativa. Substitua este texto quando a ideia certa aparecer.",
                style: { fontSize: '20px' }
            }
        }
        if (type === 'layout') {
            const cols = parseInt(variant?.split('-')[0] || '1')
            content = {
                columns: Array.from({ length: cols }).map(() => ({
                    id: generateId(),
                    blocks: []
                })),
                settings: {
                    columns: cols,
                    height: '385px',
                    paddingLock: true,
                    ratio: 0
                }
            }
        } else if (type === 'list' || type === 'do-dont') {
            content = { items: [] }
            if (variant === 'do-dont') content.items = [{ text: "", type: 'do' }, { text: "", type: 'dont' }]
        } else if (type === 'composite') {
            content = {
                image: null,
                text: "Este é apenas um espaço em branco à espera da sua voz criativa. Substitua este texto quando a ideia certa aparecer.",
                heading: "",
                reverse: false,
                style: { color: '#374151' } // Default to gray-700 equivalent
            }
        } else if (type === 'button') {
            content = {
                text: "Botão brivio°",
                style: {
                    backgroundColor: '#FF0054',
                    width: '150px',
                    height: '40px',
                    fontSize: '16px',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    textAlign: 'center',
                    fontWeight: 500
                }
            }
        } else if (type === 'palette') {
            content = {
                colors: []
            }
        } else if (['image', 'video'].includes(type)) {
            content = { url: "", caption: "" }
        } else if (type === 'pricing-table') {
            content = {
                items: [
                    { description: "Item de Exemplo", quantity: 1, price: 0 }
                ]
            }
        } else if (type === 'scope-list') {
            content = {
                items: [
                    { text: "Entregável 01", checked: true }
                ]
            }
        } else if (type === 'timeline') {
            content = {
                items: [
                    { title: "Início", date: "Semana 1", description: "Descrição do marco" }
                ]
            }
        }

        const newBlock: Block = {
            id: generateId(),
            type: type as any,
            variant: variant,
            content: content
        }

        let newBlocks = [...blocks]

        if (addingContext?.parentId) {
            // Add to nested column
            newBlocks = blocks.map(b => {
                if (b.id === addingContext.parentId && b.type === 'layout') {
                    const newColumns = b.content.columns.map((col: any) => {
                        if (col.id === addingContext.columnId) {
                            return { ...col, blocks: [...col.blocks, newBlock] }
                        }
                        return col
                    })
                    return { ...b, content: { ...b.content, columns: newColumns } }
                }
                return b
            })
        } else if (addingContext?.insertIndex !== undefined) {
            // Insert at specific index (Divider)
            newBlocks.splice(addingContext.insertIndex, 0, newBlock)
        } else {
            // Add to root (end)
            newBlocks = [...blocks, newBlock]
        }

        setBlocks(newBlocks)
        setAddingContext(null) // Reset context
        setIsAddSectionOpen(false)
        setIsAddItemOpen(false)

        // Optimistic update of parent/server state
        if (onUpdateModule && activeModule) {
            const updatedContent = {
                ...activeModule.content_json,
                blocks: newBlocks
            }
            console.log('[MainCanvas] Calling onUpdateModule with:', { moduleId: activeModule.id, blocksCount: newBlocks.length })
            onUpdateModule(activeModule.id, updatedContent)
        }
    }

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        if (isReadOnly || !activeModule) return
        const newBlocks = [...blocks]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= newBlocks.length) return

        // Swap
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
        setBlocks(newBlocks)

        // Persist
        if (onUpdateModule) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleUpdateBlock = (blockId: string, content: any) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content } : b)
        setBlocks(newBlocks)

        // Persist to server (debounced in parent)
        if (onUpdateModule && activeModule) {
            const updatedContent = {
                ...activeModule.content_json,
                blocks: newBlocks
            }
            onUpdateModule(activeModule.id, updatedContent)
        }
    }

    const handleDuplicateBlock = (blockId: string) => {
        const index = blocks.findIndex(b => b.id === blockId)
        if (index === -1) return
        const blockToClone = blocks[index]
        const newBlock = {
            ...blockToClone,
            id: generateId(),
            content: JSON.parse(JSON.stringify(blockToClone.content))
        }
        const newBlocks = [...blocks]
        newBlocks.splice(index + 1, 0, newBlock)
        setBlocks(newBlocks)

        if (onUpdateModule && activeModule) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleDeleteBlock = (blockId: string) => {
        const newBlocks = blocks.filter(b => b.id !== blockId)
        setBlocks(newBlocks)
        onSelectBlock(null)

        if (onUpdateModule && activeModule) {
            onUpdateModule(activeModule.id, { ...activeModule.content_json, blocks: newBlocks })
        }
    }

    const handleCutBlock = (blockId: string) => {
        const block = blocks.find(b => b.id === blockId)
        if (block) {
            try {
                navigator.clipboard.writeText(JSON.stringify(block))
            } catch (e) {
                console.error("Failed to copy to clipboard", e)
            }
        }
        handleDeleteBlock(blockId)
    }

    const handleSaveAsComponent = (blockId: string) => {
        alert("Funcionalidade de salvar componente em desenvolvimento.")
    }

    const handleUpdateSectionSettings = (blockId: string, newSettings: SectionSettings) => {
        const blockIndex = blocks.findIndex(b => b.id === blockId)
        if (blockIndex === -1) return

        const currentBlock = blocks[blockIndex]
        const currentCols = currentBlock.content.columns || []
        const currentCount = currentCols.length
        const newCount = newSettings.columns

        let newCols = [...currentCols]

        // Handle Column Resizing
        if (newCount > currentCount) {
            // Add columns
            const toAdd = newCount - currentCount
            for (let i = 0; i < toAdd; i++) {
                newCols.push({ id: generateId(), blocks: [] })
            }
        } else if (newCount < currentCount) {
            // Remove columns (truncate)
            newCols = newCols.slice(0, newCount)
        }

        const updatedContent = {
            ...currentBlock.content,
            columns: newCols,
            settings: newSettings
        }

        handleUpdateBlock(blockId, updatedContent)
    }

    if (!activeModule) {
        return (
            <div className="flex-1 h-full bg-white p-8 pt-16 custom-scrollbar flex flex-col items-center relative">
                {!isReadOnly && (
                    <div className="mb-8 mt-4">
                        <Button
                            onClick={() => {
                                setAddingContext(null)
                                setIsAddSectionOpen(true)
                            }}
                            className="bg-pink-300 hover:bg-pink-400 text-white font-medium px-8 shadow-lg shadow-pink-500/20 rounded-md h-10"
                        >
                            Add Sessão
                        </Button>
                    </div>
                )}
                <div className="text-center text-gray-500 max-w-md">
                    <h2 className="text-xl font-medium text-gray-900 mb-2">Editor Canvas</h2>
                    <p>Select a module from the sidebar{isReadOnly ? "." : " or click \"Add Sessão\" to create a new one."}</p>
                </div>
                <AddSectionDialog
                    isOpen={isAddSectionOpen}
                    onOpenChange={(open) => {
                        setIsAddSectionOpen(open)
                        if (!open) setAddingContext(null)
                    }}
                    onSelectBlock={handleAddBlock}
                />
                <AddItemDialog
                    isOpen={isAddItemOpen}
                    onOpenChange={(open) => {
                        setIsAddItemOpen(open)
                        if (!open) setAddingContext(null)
                    }}
                    onSelectBlock={handleAddBlock}
                />
            </div>
        )
    }

    return (
        <div
            className="flex-1 h-full overflow-y-auto bg-white p-0 custom-scrollbar relative transition-colors duration-300"
            style={{ backgroundColor: settings?.main_project_bg }}
        >
            <div className={cn("w-full max-w-[1080px] mx-auto min-h-[800px] bg-transparent p-0 relative", !isReadOnly && "pt-[60px]")}>
                <div className="prose max-w-none text-gray-600">
                    <div className={!isReadOnly ? "space-y-6" : ""}>
                        {blocks.length > 0 ? (
                            <>
                                {/* Divider before first section */}
                                {!isReadOnly && (
                                    <SectionDivider onClick={() => {
                                        setAddingContext({ insertIndex: 0 })
                                        setIsAddSectionOpen(true)
                                    }} />
                                )}

                                {blocks.map((block, index) => (
                                    <React.Fragment key={block.id}>
                                        <SectionWrapper
                                            onMoveUp={() => handleMoveBlock(index, 'up')}
                                            onMoveDown={() => handleMoveBlock(index, 'down')}
                                            onEdit={(e: React.MouseEvent) => {
                                                const rect = e.currentTarget.getBoundingClientRect()
                                                // Position to the left of the button (280px width + 10px gap)
                                                setPanelInitialPos({ top: rect.top, left: rect.left - 290 })
                                                onSelectBlock(activeBlockId === block.id ? null : block.id)
                                            }}
                                            isFirst={index === 0}
                                            isLast={index === blocks.length - 1}
                                            settingsPanel={
                                                activeBlockId === block.id && (
                                                    <SectionSettingsPanel
                                                        settings={block.content.settings}
                                                        onUpdate={(newSettings) => handleUpdateSectionSettings(block.id, newSettings)}
                                                        onClose={() => onSelectBlock(null)}
                                                        onCut={() => handleCutBlock(block.id)}
                                                        onSaveAsComponent={() => handleSaveAsComponent(block.id)}
                                                        onDuplicate={() => handleDuplicateBlock(block.id)}
                                                        onDelete={() => handleDeleteBlock(block.id)}
                                                        initialTop={panelInitialPos?.top}
                                                        initialLeft={panelInitialPos?.left}
                                                    />
                                                )
                                            }
                                            settings={block.content.settings}
                                            isReadOnly={isReadOnly}
                                        >
                                            <BlockRenderer
                                                block={block}
                                                isReadOnly={isReadOnly}
                                                onUpdate={handleUpdateBlock}
                                                onAddBlock={(parentId, colId) => handleRequestAdd(parentId, colId)}
                                                onSelect={onSelectBlock}
                                                activeBlockId={activeBlockId}
                                            />
                                        </SectionWrapper>

                                        {!isReadOnly && (
                                            <SectionDivider onClick={() => {
                                                setAddingContext({ insertIndex: index + 1 })
                                                setIsAddSectionOpen(true)
                                            }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </>
                        ) : (
                            /* Empty State */
                            !isReadOnly && (
                                <>
                                    <div className="flex justify-center py-8">
                                        <Button
                                            onClick={() => {
                                                setAddingContext(null)
                                                setIsAddSectionOpen(true)
                                            }}
                                            className="bg-[#FF0054] hover:bg-[#D90046] text-white font-medium px-8 shadow-lg shadow-pink-500/20 rounded-full h-10 tracking-wide"
                                        >
                                            + Add Section
                                        </Button>
                                    </div>
                                    <div className="text-center p-12 text-gray-400 italic">
                                        Start adding sections to build your page.
                                    </div>
                                </>
                            )
                        )}
                    </div>
                </div>
            </div >

            <AddSectionDialog
                isOpen={isAddSectionOpen}
                onOpenChange={(open) => {
                    setIsAddSectionOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
            />

            <AddItemDialog
                isOpen={isAddItemOpen}
                onOpenChange={(open) => {
                    setIsAddItemOpen(open)
                    if (!open) setAddingContext(null)
                }}
                onSelectBlock={handleAddBlock}
            />
        </div >
    )
}
