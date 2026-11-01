"use client"

import React, { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Plus, Trash2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { ColorRow, Hint, Range, Segmented, Title, Toggle } from "./panelControls"
import type { Block } from "../types"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { COLUMN_KINDS, type FooterFont, type FooterSettings, type resolveFooterSettings } from "./footer"
import {
    addFooterColumn, applyFooterSettings, footerMainColumns, moveFooterColumn, removeFooterColumn,
    type FooterBuildContext, type NativeFooterContent,
} from "./footerNative"

type Resolved = ReturnType<typeof resolveFooterSettings>

interface Props extends BlockActions {
    content: NativeFooterContent
    resolved: Resolved
    ctx: FooterBuildContext
    onChange: (content: NativeFooterContent) => void
    onClose: () => void
}

/** What a column shows, for its row in the list: its first texts */
const columnSummary = (blocks: Block[] = []) => {
    const texts = blocks.filter(b => b.type === 'text' && b.content?.text).map(b => String(b.content.text).split('\n')[0])
    if (texts.length) return texts.slice(0, 2).join(' · ')
    if (blocks.some(b => b.type === 'image')) return 'Logótipo'
    return blocks.length ? `${blocks.length} ${blocks.length === 1 ? 'item' : 'itens'}` : 'Vazia'
}

export const FooterBlockPanel = ({ content, resolved: s, ctx, onChange, onClose, ...actions }: Props) => {
    const [tab, setTab] = useState<'columns' | 'style' | 'layout'>('columns')
    const columns = footerMainColumns(content)

    // Drag by the header
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const drag = useRef<{ x: number, y: number, px: number, py: number } | null>(null)
    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!drag.current) return
            setPosition({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y })
        }
        const up = () => { drag.current = null }
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', up)
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    }, [])

    // Applied to every text / column of the footer (what was changed on a single text only changes if it's this property)
    const set = (patch: Partial<FooterSettings>) => onChange(applyFooterSettings(content, { ...content.settings, ...patch }, ctx))

    return (
        <div
            className="w-[340px] max-h-[min(700px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none"
                onMouseDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y } }}
            >
                <span className="text-white font-medium text-lg">Rodapé</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>

            <div className="flex gap-1 p-1 mx-4 mt-4 bg-[#16171C] rounded-md shrink-0">
                {([['columns', 'Colunas'], ['style', 'Estilo'], ['layout', 'Layout']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex-1 h-7 rounded text-[11px] font-bold transition-colors", tab === id ? "bg-[#FF0054] text-white" : "text-[#888] hover:text-white")}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'columns' && (
                    <>
                        <Hint>
                            As colunas e os textos do rodapé editam-se como em qualquer secção: passe o rato numa coluna para «Edit column»,
                            clique num texto para a barra de texto (fonte, tamanho, cor, link…) e use «Add Item» para acrescentar textos.
                        </Hint>
                        <div className="flex flex-col gap-1.5">
                            {columns.map((col, i) => (
                                <div key={col.id} className="flex items-center gap-1 pl-3 pr-1 h-10 rounded-lg bg-[#16171C] border border-white/5">
                                    <span className="text-white text-[13px] font-medium shrink-0">{i + 1}.</span>
                                    <span className="flex-1 min-w-0 truncate text-[12px]">{columnSummary(col.blocks)}</span>
                                    <button type="button" title="Mover para a esquerda" disabled={i === 0} onClick={() => onChange(moveFooterColumn(content, col.id, -1))} className="w-7 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowLeft className="w-3.5 h-3.5" /></button>
                                    <button type="button" title="Mover para a direita" disabled={i === columns.length - 1} onClick={() => onChange(moveFooterColumn(content, col.id, 1))} className="w-7 h-8 flex items-center justify-center text-[#666] hover:text-white disabled:opacity-20"><ArrowRight className="w-3.5 h-3.5" /></button>
                                    <button type="button" title="Remover coluna" onClick={() => onChange(removeFooterColumn(content, col.id))} className="w-7 h-8 flex items-center justify-center text-[#666] hover:text-[#FF0054]"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Adicionar coluna</Title>
                            <div className="grid grid-cols-5 gap-1">
                                {COLUMN_KINDS.map(k => (
                                    <button
                                        key={k.id}
                                        type="button"
                                        disabled={columns.length >= 6}
                                        title={k.id === 'pages' ? 'Uma coluna com um texto (com link) por página do menu lateral' : undefined}
                                        onClick={() => onChange(addFooterColumn(content, k.id, ctx))}
                                        className="h-9 rounded-md bg-[#16171C] text-[11px] font-medium text-[#97A1B3] hover:text-white hover:bg-[#FF0054]/20 flex items-center justify-center gap-1 transition-colors disabled:opacity-30"
                                    >
                                        <Plus className="w-3 h-3" />{k.label}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] text-[#555]">Até 6 colunas. Cada uma começa com textos prontos a editar.</span>
                        </div>
                    </>
                )}

                {tab === 'style' && (
                    <>
                        <Hint>Aplica-se a todos os textos do rodapé. Depois, cada texto pode ser ajustado na sua barra de texto.</Hint>
                        <div className="flex flex-col gap-3">
                            <Title>Cores</Title>
                            <ColorRow label="Fundo" value={s.backgroundColor} onChange={(c) => set({ backgroundColor: c })} />
                            <ColorRow label="Texto e links" value={s.textColor} onChange={(c) => set({ textColor: c })} />
                            <ColorRow label="Títulos e detalhes" value={s.mutedColor} onChange={(c) => set({ mutedColor: c })} />
                            <ColorRow label="Hover dos links" value={s.accentColor} onChange={(c) => set({ accentColor: c })} />
                            <ColorRow label="Botão" value={s.buttonColor} onChange={(c) => set({ buttonColor: c })} />
                            <ColorRow label="Texto do botão" value={s.buttonTextColor} onChange={(c) => set({ buttonTextColor: c })} />
                            <ColorRow label="Linhas" value={s.borderColor} onChange={(c) => set({ borderColor: c })} />
                        </div>

                        <div className="h-px bg-[#333]" />

                        <div className="flex flex-col gap-3">
                            <Title>Tipografia</Title>
                            <Segmented
                                value={s.font}
                                options={([['mono', 'Mono'], ['sans', 'Sans'], ['serif', 'Serif'], ['brand', 'Marca']] as [FooterFont, string][]).map(([id, label]) => ({ id, label, title: id === 'brand' ? 'Fonte do texto da marca (Settings → Fonts)' : undefined }))}
                                onChange={(font) => set({ font })}
                            />
                            <Toggle label="Maiúsculas" checked={s.uppercase} onChange={(uppercase) => set({ uppercase })} />
                            <Toggle label="Numerar páginas (01)" checked={s.numbered} onChange={(numbered) => set({ numbered })} />
                            <Toggle label="Sublinhar no hover" checked={s.underline} onChange={(underline) => set({ underline })} />
                            <Range label="Espaço entre letras" value={s.letterSpacing} min={-5} max={30} unit="%" onChange={(letterSpacing) => set({ letterSpacing })} />
                            <Range label="Tamanho dos links" value={s.linkSize} min={10} max={40} unit="px" onChange={(linkSize) => set({ linkSize })} />
                            <Range label="Tamanho dos títulos" value={s.titleSize} min={8} max={24} unit="px" onChange={(titleSize) => set({ titleSize })} />
                            <Range label="Tamanho da marca" value={s.brandSize} min={10} max={48} unit="px" onChange={(brandSize) => set({ brandSize })} />
                            <Range label="Tamanho do texto" value={s.bodySize} min={10} max={64} unit="px" onChange={(bodySize) => set({ bodySize })} />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                // Back to the template look; the rows (wordmark, bottom bar) stay as they are
                                const { showWordmark, showBottomBar, showBackToTop, wordmark, bottomText } = content.settings
                                onChange(applyFooterSettings(content, { showWordmark, showBottomBar, showBackToTop, wordmark, bottomText }, ctx))
                            }}
                            className="flex items-center justify-center gap-1.5 h-8 text-[12px] text-[#666] hover:text-white"
                        >
                            <RotateCcw className="w-3 h-3" /> Repor estilo de origem
                        </button>
                    </>
                )}

                {tab === 'layout' && (
                    <>
                        <div className="flex flex-col gap-3">
                            <Title>Espaçamentos</Title>
                            <Range label="Entre colunas" value={s.columnGap} min={0} max={160} unit="px" onChange={(columnGap) => set({ columnGap })} />
                            <Range label="Entre itens" value={s.itemGap} min={0} max={48} unit="px" onChange={(itemGap) => set({ itemGap })} />
                            <Range label="Margem superior" value={s.paddingTop} min={0} max={200} unit="px" onChange={(paddingTop) => set({ paddingTop })} />
                            <Range label="Margem inferior" value={s.paddingBottom} min={0} max={200} unit="px" onChange={(paddingBottom) => set({ paddingBottom })} />
                            <Range label="Margens laterais" value={s.paddingX} min={0} max={200} unit="px" onChange={(paddingX) => set({ paddingX })} />
                            <Range label="Largura máxima" value={s.maxWidth} min={0} max={1800} step={20} unit={s.maxWidth ? 'px' : ' (total)'} onChange={(maxWidth) => set({ maxWidth })} />
                            <Toggle label="Linha no topo" checked={s.borderTop} onChange={(borderTop) => set({ borderTop })} />
                        </div>

                        <div className="h-px bg-[#333]" />

                        <div className="flex flex-col gap-3">
                            <Toggle label="Nome em grande" checked={s.showWordmark} onChange={(showWordmark) => set({ showWordmark })} />
                            {s.showWordmark && (
                                <Range label="Tamanho" value={s.wordmarkSize} min={48} max={400} step={4} unit="px" onChange={(wordmarkSize) => set({ wordmarkSize })} />
                            )}
                        </div>

                        <div className="h-px bg-[#333]" />

                        <div className="flex flex-col gap-3">
                            <Toggle label="Barra inferior" checked={s.showBottomBar} onChange={(showBottomBar) => set({ showBottomBar })} />
                            {s.showBottomBar && (
                                <Toggle label='"Voltar ao topo"' checked={s.showBackToTop} onChange={(showBackToTop) => set({ showBackToTop })} />
                            )}
                        </div>
                        <Hint>O nome em grande e os textos da barra inferior também se editam diretamente no rodapé.</Hint>
                    </>
                )}
            </div>

            <PanelActions {...actions} />
        </div>
    )
}
