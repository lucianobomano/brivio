"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, X, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { addProjectNote } from "@/app/actions/notes"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ProjectNote {
    id: string
    content: string
    author_name: string | null
    is_from_client: boolean
    created_at: string | Date | null
}

interface ProjectNotesPanelProps {
    projectId: string
    initialNotes: ProjectNote[]
    isClientView: boolean
    isOpen: boolean
    onClose: () => void
}

export function ProjectNotesPanel({ projectId, initialNotes, isClientView, isOpen, onClose }: ProjectNotesPanelProps) {
    const [notes, setNotes] = React.useState<ProjectNote[]>(initialNotes)
    const [newNote, setNewNote] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const notesEndRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        notesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [isOpen, notes])

    // Update notes when initialNotes changes (e.g. from server revalidation)
    React.useEffect(() => {
        setNotes(initialNotes)
    }, [initialNotes])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newNote.trim() || isSubmitting) return

        setIsSubmitting(true)
        const content = newNote.trim()
        setNewNote("")

        try {
            const res = await addProjectNote(projectId, content, isClientView)
            if (res.success && res.note) {
                // Optimistic UI update might be overridden by server revalidation, which is fine
                setNotes(prev => [...prev, res.note as any])
                toast.success("Nota adicionada com sucesso")
            } else {
                toast.error("Erro ao adicionar nota")
                setNewNote(content) // restore
            }
        } catch (error) {
            toast.error("Erro inesperado")
            setNewNote(content) // restore
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-5 right-5 bottom-5 h-[calc(100%-40px)] w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border border-gray-200 rounded-3xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Notas do Projeto</h2>
                                    <p className="text-sm text-gray-500">
                                        {isClientView ? "Deixe as suas anotações ou dúvidas aqui." : "Comunicação com o cliente"}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5 text-gray-500" />
                                </Button>
                            </div>

                            {/* Notes List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                                {notes.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                                            <MessageSquare className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p>Ainda não existem notas neste projeto.<br/>Seja o primeiro a escrever!</p>
                                    </div>
                                ) : (
                                    notes.map((note) => {
                                        const isMine = note.is_from_client === isClientView
                                        return (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "flex flex-col max-w-[85%]",
                                                    isMine ? "ml-auto items-end" : "mr-auto items-start"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                                    <span className="text-[11px] font-semibold text-gray-700">
                                                        {note.author_name || (note.is_from_client ? "Cliente" : "Equipa")}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {note.created_at ? format(new Date(note.created_at), "dd MMM HH:mm", { locale: ptBR }) : ""}
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                                        isMine
                                                            ? "bg-accent-indigo text-white rounded-tr-sm"
                                                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                                                    )}
                                                >
                                                    {note.content}
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                )}
                                <div ref={notesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Escreva uma nota..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 min-h-[50px] max-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-accent-indigo/20 focus:border-accent-indigo transition-all text-sm text-gray-900 placeholder:text-gray-400 pr-12"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSubmit(e)
                                            }
                                        }}
                                    />
                                    <Button 
                                        type="submit" 
                                        size="icon" 
                                        disabled={!newNote.trim() || isSubmitting}
                                        className="absolute right-2 bottom-2 rounded-full w-8 h-8 bg-accent-indigo hover:bg-accent-indigo/90"
                                    >
                                        <Send className="w-4 h-4 text-white" />
                                    </Button>
                                </form>
                                <p className="text-[10px] text-center text-gray-400 mt-3">
                                    Pressione Enter para enviar
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
