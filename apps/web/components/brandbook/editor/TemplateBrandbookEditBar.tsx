"use client"

/**
 * Shown to superadmins editing a brandbook template (editor opened with ?editTemplate=<id>): the pages of this
 * draft brand are written back into that same template, never into a new one.
 */

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import { toast } from "sonner"
import { Check, ChevronDown, Loader2, LogOut, PencilLine, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveTemplateEdits } from "@/app/actions/brandbook-templates"
import { deleteBrand } from "@/app/actions/brands"

type Module = { title?: string, type?: string, category?: string | null, content_json?: unknown }

interface Props {
    templateId: string
    brandId: string
    brandName: string
    modules: Module[]
    /** Writes the editor's queued changes before the draft is removed */
    flushPendingSaves: () => Promise<unknown>
}

export function TemplateBrandbookEditBar({ templateId, brandId, brandName, modules, flushPendingSaves }: Props) {
    const router = useRouter()
    const [busy, setBusy] = useState<null | 'save' | 'finish' | 'discard'>(null)
    const [savedAt, setSavedAt] = useState<Date | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const templateName = brandName.replace(/^Template · /, '')

    useEffect(() => {
        if (!menuOpen) return
        const onDown = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false) }
        document.addEventListener('pointerdown', onDown, true)
        return () => document.removeEventListener('pointerdown', onDown, true)
    }, [menuOpen])

    const save = async () => {
        const res = await saveTemplateEdits({
            templateId,
            modules: modules.map(m => ({ title: m.title, type: m.type, category: m.category, content_json: m.content_json })),
        })
        if (!res.success) throw new Error(res.error || 'Não foi possível guardar o template')
        setSavedAt(new Date())
    }

    /** The draft brand only exists to edit the template */
    const removeDraft = async () => {
        await flushPendingSaves()
        await deleteBrand(brandId)
        router.push('/brands')
    }

    const run = async (kind: 'save' | 'finish' | 'discard') => {
        if (busy) return
        if (kind === 'discard' && !confirm('Sair sem guardar? As alterações feitas desde a última gravação perdem-se e o rascunho é eliminado.')) return
        setMenuOpen(false)
        setBusy(kind)
        try {
            if (kind !== 'discard') await save()
            if (kind === 'save') toast.success(`Template «${templateName}» atualizado.`)
            if (kind !== 'save') {
                if (kind === 'finish') toast.success(`Template «${templateName}» atualizado.`)
                await removeDraft()
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Ocorreu um erro')
        } finally {
            setBusy(null)
        }
    }

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[3000] flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-[#16171C] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)] text-white">
            <PencilLine className="w-4 h-4 text-[#FF0054] shrink-0" />
            <div className="min-w-0 leading-tight">
                <p className="text-[12px] font-semibold truncate max-w-[260px]">A editar o template «{templateName}»</p>
                <p className="text-[10px] text-white/50">
                    {savedAt ? `Guardado às ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ao guardar, as alterações ficam neste mesmo template'}
                </p>
            </div>
            <button
                type="button"
                onClick={() => run('save')}
                disabled={!!busy}
                className="ml-2 h-9 px-4 rounded-full bg-[#FF0054] hover:bg-[#D90048] text-[12px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
                {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedAt ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                Guardar no template
            </button>
            <div ref={menuRef} className="relative">
                <button
                    type="button"
                    onClick={() => setMenuOpen(o => !o)}
                    disabled={!!busy}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="h-9 pl-3 pr-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[12px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-60"
                >
                    {busy === 'finish' || busy === 'discard' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Terminar
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", menuOpen && "rotate-180")} />
                </button>
                {menuOpen && (
                    <div role="menu" className="absolute bottom-full right-0 mb-2 w-[230px] rounded-xl bg-[#1F1F25] border border-white/10 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-bottom-right">
                        <button type="button" role="menuitem" onClick={() => run('finish')} className="w-full h-9 px-3 rounded-md flex items-center gap-2 text-[12px] text-left text-white hover:bg-white/5">
                            <LogOut className="w-3.5 h-3.5 text-[#FF0054]" /> Guardar e terminar
                        </button>
                        <button type="button" role="menuitem" onClick={() => run('discard')} className="w-full h-9 px-3 rounded-md flex items-center gap-2 text-[12px] text-left text-[#FF6B6B] hover:bg-white/5">
                            <Trash2 className="w-3.5 h-3.5" /> Sair sem guardar
                        </button>
                        <p className="px-3 pt-1.5 pb-1 text-[10px] leading-snug text-white/40">Ao terminar, o rascunho usado para a edição é eliminado. O template fica como foi guardado.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
