"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, HelpCircle, BookOpen, Shield, CornerDownLeft } from "lucide-react"
import { askYourBrandAction } from "@/app/actions/brandops"
import { cn } from "@/lib/utils"

interface AskBrandDrawerProps {
    isOpen: boolean
    onClose: () => void
    brandId: string
    brandName: string
}

interface ChatMessage {
    role: 'user' | 'assistant'
    text: string
    citations?: string[]
    timestamp: string
}

const SUGGESTIONS = [
    "Qual é a nossa proposta de valor oficial?",
    "Podemos utilizar a cor amarela nas embalagens?",
    "Qual é o nosso tom de voz e palavras que devemos evitar?",
    "Como adaptar o posicionamento para expansão em Portugal?"
]

export function AskBrandDrawer({
    isOpen,
    onClose,
    brandId,
    brandName
}: AskBrandDrawerProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            text: `Olá! Sou o BrandOps AI Copilot da marca ${brandName || 'Brivio'}. Posso consultar todos os Brand Objects aprovados, regras de tom de voz, decisões estratégicas e directrizes de design. Em que posso ajudar?`,
            citations: ['Brand Context Oficial', 'Brand Memory Core'],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSend = async (queryText?: string) => {
        const text = queryText || input
        if (!text.trim() || loading) return

        const userMsg: ChatMessage = {
            role: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            const res = await askYourBrandAction(brandId, text)
            if (res.success && res.answer) {
                const botMsg: ChatMessage = {
                    role: 'assistant',
                    text: res.answer,
                    citations: res.citations,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
                setMessages(prev => [...prev, botMsg])
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: "Ocorreu uma falha ao consultar o Brand Context. Por favor tente novamente.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
                />

                {/* Drawer */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="relative w-full max-w-lg h-full bg-[#141416] border-l border-white/10 shadow-2xl flex flex-col pointer-events-auto z-10 text-white"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#111114]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3A86FF] to-[#00F5D4] flex items-center justify-center text-white shadow-lg">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white font-tight">
                                    Pergunte à {brandName || 'Marca'}
                                </h3>
                                <p className="text-[11px] text-zinc-400 font-mono">
                                    Consultando Brand Objects & Brand Memory oficial
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col max-w-[88%] space-y-1.5",
                                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "p-4 rounded-2xl text-xs leading-relaxed shadow-lg",
                                        msg.role === 'user'
                                            ? "bg-[#FF0054] text-white rounded-br-none"
                                            : "bg-[#1E1E22] text-zinc-200 border border-white/10 rounded-bl-none"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>

                                {/* Citations */}
                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                        <span className="text-[10px] text-zinc-500 font-mono">Fontes:</span>
                                        {msg.citations.map((cite, ci) => (
                                            <span 
                                                key={ci} 
                                                className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#06D6A0] font-mono flex items-center gap-1"
                                            >
                                                <BookOpen className="w-2.5 h-2.5" />
                                                {cite}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <span className="text-[9px] text-zinc-500 font-mono px-1">
                                    {msg.timestamp}
                                </span>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono py-2">
                                <Sparkles className="w-4 h-4 text-[#FF0054] animate-spin" />
                                <span>Consultando Brand Context e decisões da marca...</span>
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    <div className="px-6 py-3 border-t border-white/5 bg-[#0E0E10] space-y-2">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
                            Perguntas Frequentes:
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {SUGGESTIONS.map((sug, si) => (
                                <button
                                    key={si}
                                    onClick={() => handleSend(sug)}
                                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 border-t border-white/10 bg-[#141416]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleSend()
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pergunte sobre estratégia, diretrizes, cores, regras..."
                                className="flex-1 bg-[#0E0E10] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF0054]"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 rounded-2xl bg-[#FF0054] hover:bg-[#d90045] disabled:opacity-50 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
