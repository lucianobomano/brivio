import React, { useState, useEffect, useRef } from "react"
import { Check, ChevronDown, Circle, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { FONT_GROUPS, SELF_HOSTED_FONTS, loadFontPreview } from "./googleFonts"

interface FontPickerProps {
    currentFont?: string
    onFontChange: (font: string) => void
    children: React.ReactNode
}

/** One font of the list, drawn in its own face once it scrolls into view */
const FontOption = ({ font, active, highlighted, onPick }: { font: string, active: boolean, highlighted: boolean, onPick: (font: string) => void }) => {
    const ref = useRef<HTMLButtonElement>(null)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadFontPreview(font); io.disconnect() } })
        io.observe(el)
        return () => io.disconnect()
    }, [font])
    useEffect(() => { if (highlighted) ref.current?.scrollIntoView({ block: 'nearest' }) }, [highlighted])
    return (
        <button
            ref={ref}
            type="button"
            onClick={() => onPick(font)}
            className={cn(
                "w-full text-left px-3 py-2 flex items-center gap-2 text-[15px] transition-colors",
                active ? "text-white bg-[#FF0054]/15" : highlighted ? "text-white bg-[#2A2B35]" : "text-gray-300 hover:bg-[#2A2B35] hover:text-white"
            )}
            style={{ fontFamily: `'${font}', sans-serif` }}
        >
            <span className="flex-1 truncate">{font}</span>
            {active && <Check className="w-3.5 h-3.5 text-[#FF0054] shrink-0" />}
        </button>
    )
}

export const FontPicker = ({ currentFont = 'Inter', onFontChange, children }: FontPickerProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedFont, setSelectedFont] = useState(currentFont)
    const [query, setQuery] = useState('')
    const [highlight, setHighlight] = useState(0)
    const searchRef = useRef<HTMLInputElement>(null)

    // Load font when selected
    useEffect(() => {
        if (selectedFont && !SELF_HOSTED_FONTS.has(selectedFont)) {
            const linkId = `font-${selectedFont}`
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link')
                link.id = linkId
                link.rel = 'stylesheet'
                link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, '+')}:wght@100;200;300;400;500;700;800;900&display=swap`
                // Fonts without all those weights: ask for the font alone
                link.onerror = () => { link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, '+')}&display=swap` }
                document.head.appendChild(link)
            }
        }
    }, [selectedFont])

    // The search field takes the focus when the list opens
    useEffect(() => {
        if (!isOpen) return
        const id = window.setTimeout(() => searchRef.current?.focus(), 30)
        return () => window.clearTimeout(id)
    }, [isOpen])

    const q = query.trim().toLowerCase()
    const groups = FONT_GROUPS
        .map(g => ({ ...g, fonts: g.fonts.filter(f => !q || f.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
        .filter(g => g.fonts.length)
    const flat = groups.flatMap(g => g.fonts)

    const handleSelect = (font: string) => {
        setSelectedFont(font)
        onFontChange(font)
        setIsOpen(false)
        setQuery('')
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="center"
                // Above the floating block panels (z 9500), which can open it
                className="p-0 border-none w-[280px] bg-transparent shadow-xl z-[10001]"
                sideOffset={10}
            >
                <div className="flex flex-col border border-[#333] rounded-lg bg-[#15161B]">
                    {/* Header */}
                    <div className="bg-[#FF0054] px-4 py-3 flex items-center justify-between rounded-t-lg">
                        <span className="text-white font-medium text-sm">Escolher font</span>
                        <Circle className="w-3 h-3 text-[#15161B] fill-[#15161B]" />
                    </div>

                    {/* Body */}
                    <div className="bg-[#15161B] p-4 rounded-b-lg">
                        <div className="relative">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full h-10 px-3 bg-[#15161B] border border-[#333] rounded-sm flex items-center justify-between text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                            >
                                <span style={{ fontFamily: selectedFont }}>{selectedFont}</span>
                                <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", isOpen && "rotate-180")} />
                            </button>

                            {/* Custom Dropdown List */}
                            {isOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1B21] border border-[#333] rounded-sm z-[70] shadow-md flex flex-col">
                                    {/* Search */}
                                    <div className="p-2 border-b border-[#333]">
                                        <div className="h-9 flex items-center gap-2 px-2.5 rounded-sm bg-[#15161B] border border-[#333] focus-within:border-[#FF0054] transition-colors">
                                            <Search className="w-3.5 h-3.5 text-[#97A1B3] shrink-0" />
                                            <input
                                                ref={searchRef}
                                                value={query}
                                                onChange={(e) => { setQuery(e.target.value); setHighlight(0) }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(flat.length - 1, h + 1)) }
                                                    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(0, h - 1)) }
                                                    else if (e.key === 'Enter' && flat[highlight]) { e.preventDefault(); handleSelect(flat[highlight]) }
                                                    else if (e.key === 'Escape') { e.stopPropagation(); if (query) setQuery(''); else setIsOpen(false) }
                                                }}
                                                placeholder="Pesquisar fonte…"
                                                className="flex-1 min-w-0 bg-transparent text-[13px] text-white placeholder:text-[#666] outline-none"
                                            />
                                            {query && (
                                                <button type="button" title="Limpar" onClick={() => { setQuery(''); searchRef.current?.focus() }} className="text-[#666] hover:text-white">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-[260px] overflow-y-auto custom-scrollbar py-1">
                                        {flat.length === 0 ? (
                                            <p className="px-3 py-4 text-[12px] text-[#666] text-center">Nenhuma fonte com «{query}».</p>
                                        ) : groups.map(g => (
                                            <div key={g.label}>
                                                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#666]">{g.label}</div>
                                                {g.fonts.map(font => (
                                                    <FontOption
                                                        key={font}
                                                        font={font}
                                                        active={font === selectedFont}
                                                        highlighted={!!q && flat[highlight] === font}
                                                        onPick={handleSelect}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
