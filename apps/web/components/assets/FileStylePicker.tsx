"use client"

import React from "react"
import { Check, FileType } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FILE_STYLES, type FileStyle } from "@/lib/hooks/use-file-style"
import { FileTypeTile } from "./FileTypeTile"

const SAMPLES = ["Logo.ai", "Cartaz.psd", "Manual.pdf"]

/** «Estilo dos ficheiros» in the Asset Hub toolbar: how files without a preview are drawn */
export function FileStylePicker({ value, onChange, light }: { value: FileStyle, onChange: (s: FileStyle) => Promise<boolean>, light?: boolean }) {
    const [open, setOpen] = React.useState(false)
    const current = FILE_STYLES.find(s => s.id === value)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button type="button" className="flex items-center gap-2 hover:text-text-primary transition-colors" title="Escolher o estilo dos ficheiros">
                    <FileType className="w-4 h-4" />
                    <span className="text-sm font-bold">Estilo dos ficheiros</span>
                    <span className="text-xs font-medium opacity-70">· {current?.label}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className={cn("w-[480px] p-4 rounded-2xl shadow-2xl z-[60]", light ? "bg-white border-[#E5E7EB]" : "bg-[#15161B] border-[#2a2a33]")}>
                <p className={cn("text-[13px] font-semibold mb-1", light ? "text-[#111]" : "text-white")}>Estilo dos ficheiros</p>
                <p className="text-[11px] text-text-secondary mb-4">Como aparecem os ficheiros sem pré-visualização (.ai, .psd, .pdf, fontes…). Cada formato tem a sua cor. A escolha fica guardada na sua conta.</p>
                <div className="grid grid-cols-2 gap-3">
                    {FILE_STYLES.map(s => {
                        const active = s.id === value
                        return (
                            <button
                                key={s.id}
                                type="button"
                                aria-pressed={active}
                                onClick={async () => {
                                    const ok = await onChange(s.id)
                                    if (!ok) toast.error("A escolha ficou só neste navegador: não foi possível guardá-la na conta.")
                                    setOpen(false)
                                }}
                                className={cn(
                                    "relative rounded-xl border p-3 flex flex-col gap-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#FF0054]",
                                    active ? "border-[#FF0054] bg-[#FF0054]/5" : light ? "border-[#E5E7EB] hover:border-[#c9ccd3]" : "border-[#2a2a33] hover:border-[#444]"
                                )}
                            >
                                {active && <span className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-[#FF0054] text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                                <div className="grid grid-cols-3 gap-1.5">
                                    {SAMPLES.map(n => (
                                        <div key={n} className="aspect-square rounded-lg overflow-hidden">
                                            <FileTypeTile name={n} style={s.id} />
                                        </div>
                                    ))}
                                </div>
                                <span>
                                    <span className={cn("block text-[12px] font-semibold", light ? "text-[#111]" : "text-white")}>{s.label}</span>
                                    <span className="block text-[10px] text-text-secondary">{s.hint}</span>
                                </span>
                            </button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
