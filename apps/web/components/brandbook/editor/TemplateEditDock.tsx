"use client"
/* eslint-disable @typescript-eslint/no-explicit-any -- walks the page JSON (sections, columns, blocks of any shape) */

import React, { useState } from "react"
import { toast } from "sonner"
import { Loader2, PencilLine, Save, X } from "lucide-react"
import { savePresetOverride } from "@/app/actions/components"
import type { Block } from "./types"
import type { ComponentKind } from "./componentPresets"

/**
 * Editing a ready-made template (superadmins). "Editar" in the components library places the template on
 * the page with a marker; it is edited like any other section / column / block, and this dock saves it over
 * the template (everyone then gets the new version) or stops editing it (the content stays on the page).
 */

export const TEMPLATE_MARK = '__template'

/**
 * The template a node is being edited for. Its key must not be called "id": the editor gives every "id" of a
 * component a new value when it is placed on the page.
 */
export interface TemplateMark { presetId: string, name: string, description?: string, kind: ComponentKind }

interface Found { mark: TemplateMark, node: any }

/** Every template being edited on the page: sections, their columns and the blocks inside */
const findMarked = (blocks: Block[]): Found[] => {
    const out: Found[] = []
    const visit = (b: any) => {
        if (!b || typeof b !== 'object') return
        if (b.type === 'layout' && b.content?.settings?.[TEMPLATE_MARK]) out.push({ mark: b.content.settings[TEMPLATE_MARK], node: b })
        else if (b.content?.[TEMPLATE_MARK]) out.push({ mark: b.content[TEMPLATE_MARK], node: b })
        for (const col of b.content?.columns || []) {
            if (col?.settings?.[TEMPLATE_MARK]) out.push({ mark: col.settings[TEMPLATE_MARK], node: col })
            ;(col?.blocks || []).forEach(visit)
        }
    }
    blocks.forEach(visit)
    return out
}

/** A copy of the node without its marker (what gets saved) */
const withoutMark = (node: any) => {
    const copy = JSON.parse(JSON.stringify(node))
    if (copy.content?.settings?.[TEMPLATE_MARK]) delete copy.content.settings[TEMPLATE_MARK]
    if (copy.content?.[TEMPLATE_MARK]) delete copy.content[TEMPLATE_MARK]
    if (copy.settings?.[TEMPLATE_MARK]) delete copy.settings[TEMPLATE_MARK]
    return copy
}

/** The page with the marker of one node removed */
const unmark = (blocks: Block[], nodeId: string): Block[] => {
    const walk = (b: any): any => {
        if (!b || typeof b !== 'object') return b
        let next = b
        if (b.id === nodeId) next = withoutMark(b)
        if (next.content?.columns) {
            next = {
                ...next,
                content: {
                    ...next.content,
                    columns: next.content.columns.map((c: any) => {
                        const col = c.id === nodeId ? withoutMark(c) : c
                        return { ...col, blocks: (col.blocks || []).map(walk) }
                    }),
                },
            }
        }
        return next
    }
    return blocks.map(walk)
}

export const TemplateEditDock = ({ blocks, onChange }: { blocks: Block[], onChange: (blocks: Block[]) => void }) => {
    const marked = findMarked(blocks || [])
    const [names, setNames] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<string | null>(null)
    if (!marked.length) return null

    const save = async ({ mark, node }: Found) => {
        setSaving(node.id)
        const name = (names[node.id] ?? mark.name).trim() || mark.name
        const result = await savePresetOverride({ presetId: mark.presetId, name, description: mark.description, kind: mark.kind, data: withoutMark(node) })
        setSaving(null)
        if (!result.success) { toast.error(result.error || 'Não foi possível guardar o template'); return }
        toast.success('Template atualizado', { description: `«${name}» já aparece com esta versão na biblioteca.` })
        onChange(unmark(blocks, node.id))
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {marked.map(found => (
                <div key={found.node.id} className="h-14 rounded-full bg-[#15161B] border border-[#FF0054]/60 shadow-[0_16px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 pl-5 pr-2">
                    <PencilLine className="w-4 h-4 text-[#FF0054] shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#97A1B3] whitespace-nowrap">Template em edição</span>
                    <input
                        value={names[found.node.id] ?? found.mark.name}
                        onChange={(e) => setNames(n => ({ ...n, [found.node.id]: e.target.value }))}
                        title="Nome do template"
                        className="w-[240px] h-9 rounded-full bg-white/5 border border-white/10 focus:border-[#FF0054] px-4 text-[13px] text-white outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => save(found)}
                        disabled={saving === found.node.id}
                        className="h-10 px-5 rounded-full bg-[#FF0054] hover:bg-[#D90048] text-white text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60"
                    >
                        {saving === found.node.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar template
                    </button>
                    <button
                        type="button"
                        title="Parar de editar (o conteúdo fica na página)"
                        onClick={() => onChange(unmark(blocks, found.node.id))}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-[#97A1B3] hover:text-white flex items-center justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
