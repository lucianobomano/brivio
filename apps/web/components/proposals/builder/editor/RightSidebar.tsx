"use client"

import React from "react"
import { Settings, Sparkles, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Block } from "./types"

interface RightSidebarProps {
    activeModule: any | null
    activeBlock: Block | null
    onDeleteModule?: (id: string) => void
    onUpdateModule?: (moduleId: string, newContent: any) => void
    onUpdateBlock?: (blockId: string, content: any) => void
}

export function RightSidebar({ activeModule, activeBlock, onDeleteModule, onUpdateModule, onUpdateBlock }: RightSidebarProps) {

    const handleBlockUpdate = (key: string, value: any) => {
        if (!activeBlock || !onUpdateBlock) return
        onUpdateBlock(activeBlock.id, { ...activeBlock.content, [key]: value })
    }
    return (
        <div className="w-80 h-full border-l border-bg-3 bg-bg-1 flex flex-col flex-shrink-0">
            {/* Context Settings Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center gap-2 text-text-secondary mb-6">
                    <Settings className="w-4 h-4" />
                    <span className="text-xs uppercase font-bold tracking-wider">
                        {activeBlock ? "Block Settings" : (activeModule ? "Module Settings" : "Global Settings")}
                    </span>
                </div>

                {activeBlock ? (
                    <div className="space-y-6">
                        {/* Block Info */}
                        <div className="space-y-2">
                            <label className="text-xs text-text-secondary">Block Type</label>
                            <div className="p-2 bg-bg-2 rounded text-sm text-white capitalize">
                                {activeBlock.type} {activeBlock.variant ? `(${activeBlock.variant})` : ''}
                            </div>
                        </div>
                        <div className="text-sm text-text-tertiary">
                            Settings for this block will appear here.
                        </div>
                    </div>
                ) : activeModule ? (
                    <div className="space-y-6">
                        {/* Module Info */}
                        <div className="space-y-2">
                            <label className="text-xs text-text-secondary">Module Name</label>
                            <div className="p-2 bg-bg-2 rounded text-sm text-white">
                                {activeModule.title}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start text-text-secondary hover:text-white border-bg-3">
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate Module
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-full justify-start bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 border border-red-900/50"
                                onClick={() => onDeleteModule?.(activeModule.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Module
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-text-tertiary">
                        Select a module to configure its settings.
                    </div>
                )}
            </div>

            {/* AI Panel (Sticky Bottom) */}
            <div className="border-t border-bg-3 bg-bg-0/50 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        AI Assistant
                    </span>
                </div>

                <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-xs h-9 border-bg-3 hover:bg-bg-2 hover:border-purple-500/50 transition-colors">
                        Generate Content
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-9 border-bg-3 hover:bg-bg-2 hover:border-purple-500/50 transition-colors">
                        Check Consistency
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-9 border-bg-3 hover:bg-bg-2 hover:border-purple-500/50 transition-colors">
                        Create Tasks
                    </Button>
                </div>
            </div>
        </div>
    )
}
