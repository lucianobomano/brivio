"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Sparkles, FileText, Image, Video, Music, Link, StickyNote, MessageSquare, Bot, CheckCircle2, GitBranch, FileOutput } from "lucide-react"
import { NODE_CATALOG, CATEGORY_CONFIG } from "../constants"
import { BrandCategory, NodeStatus } from "../types"
import { cn } from "@/lib/utils"

interface AddNodeModalProps {
    isOpen: boolean
    onClose: () => void
    onAddNode: (type: string, category: BrandCategory, title: string, defaultContent: any) => void
    position?: { x: number; y: number }
}

export function AddNodeModal({
    isOpen,
    onClose,
    onAddNode,
    position
}: AddNodeModalProps) {
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")

    if (!isOpen) return null

    const categories = [
        { id: "all", label: "Todos" },
        { id: "utility", label: "Utility" },
        { id: "discovery", label: "Discovery" },
        { id: "strategy", label: "Strategy" },
        { id: "verbal_identity", label: "Verbal" },
        { id: "visual_identity", label: "Visual" },
        { id: "sensorial_identity", label: "Sensorial" },
        { id: "behavioural_identity", label: "Behavioural" },
        { id: "activation", label: "Activation" },
        { id: "governance", label: "Governance" },
        { id: "agent", label: "AI Agents" }
    ]

    const filtered = NODE_CATALOG.filter(item => {
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                              item.description.toLowerCase().includes(search.toLowerCase()) ||
                              item.type.toLowerCase().includes(search.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const getNodeIcon = (type: string) => {
        if (type === 'image') return Image
        if (type === 'video') return Video
        if (type === 'audio') return Music
        if (type === 'url') return Link
        if (type === 'note') return StickyNote
        if (type === 'comment') return MessageSquare
        if (type === 'ai_agent') return Bot
        if (type === 'ai_prompt') return Sparkles
        if (type === 'approval') return CheckCircle2
        if (type === 'decision') return GitBranch
        if (type === 'output') return FileOutput
        return FileText
    }

    return (
        <AnimatePresence>
            <div className="absolute z-50 h-[652px] w-[300px] max-w-[calc(100%-2rem)]" style={{ left: position?.x ?? 80, top: position?.y ?? 80 }}>
                <motion.div
                    initial={{ scale: 0.98, opacity: 0, y: -8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.98, opacity: 0, y: -8 }}
                    className="relative h-full rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-[0_18px_50px_rgba(0,0,0,0.16)] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                        <div>
                            <h3 className="text-xl font-black text-white font-tight">
                                Catálogo de Brand Nodes
                            </h3>
                            <p className="text-xs text-zinc-400 font-mono">
                                Escolha o elemento que deseja adicionar ao canvas operacional
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div className="py-3 space-y-3 border-b border-zinc-100">
                        <div className="relative">
                            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Pesquise por nó: posicionamento, logotipo, tom de voz, cores, persona..."
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400"
                            />
                        </div>

                        {/* Category filter pills */}
                        <div className="brandops-popover-scroll flex items-center gap-1.5 overflow-x-auto pb-1">
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedCategory(c.id)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer",
                                        selectedCategory === c.id
                                            ? "bg-zinc-900 text-white shadow-sm"
                                            : "bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
                                    )}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nodes Grid */}
        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 content-start items-start gap-1">
                        {filtered.map((item) => {
                            const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.strategy
                            const NodeIcon = getNodeIcon(item.type)
                            return (
                                <div
                                    key={item.type}
                                    onClick={() => {
                                        onAddNode(item.type, item.category, item.title, item.defaultContent)
                                        onClose()
                                    }}
                        className="h-fit self-start p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all text-left group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                                            <NodeIcon className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium text-zinc-900">{item.title}</span>
                                            <span className="block text-[11px] text-zinc-400">{catConfig.label}</span>
                                        </span>
                                        {item.isAiSupported && <Sparkles className="ml-auto h-3.5 w-3.5 text-zinc-400" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
