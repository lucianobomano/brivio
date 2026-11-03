"use client"

import React from "react"
import { Check, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { GlassFolder } from "@/components/ui/glass-folder-cards"
import { FOLDER_STYLES, type FolderStyle } from "@/lib/hooks/use-folder-style"

const SAMPLE = [{ name: "Logótipo", meta: "SVG" }, { name: "Paleta", meta: "PDF" }]

/** A small live sample of each style */
function StyleSample({ id }: { id: FolderStyle }) {
    if (id === "classic") {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src="/images/custom-folder-icon.png" alt="" className="w-[92px] h-[74px] object-contain" />
    }
    const props = id === "milk" ? { tone: "light" as const, art: "aurora" as const, labelPlacement: "bottom-left" as const }
        : id === "archive" ? { tone: "light" as const, art: "none" as const, labelPlacement: "top-left" as const }
            : { tone: "dark" as const, art: "ember" as const, labelPlacement: "top-right" as const }
    return (
        <div className="pointer-events-none">
            <div inert><GlassFolder label="Marca" files={SAMPLE} action="none" width={112} appear={false} seed={5} {...props} /></div>
        </div>
    )
}

/** «Estilo das pastas» in the Asset Hub toolbar: the classic icon or one of the three glass folders */
export function FolderStylePicker({ value, onChange, light }: { value: FolderStyle, onChange: (s: FolderStyle) => Promise<boolean>, light?: boolean }) {
    const [open, setOpen] = React.useState(false)
    const current = FOLDER_STYLES.find(s => s.id === value)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button type="button" className="flex items-center gap-2 hover:text-text-primary transition-colors" title="Escolher o estilo das pastas">
                    <FolderOpen className="w-4 h-4" />
                    <span className="text-sm font-bold">Estilo das pastas</span>
                    <span className="text-xs font-medium opacity-70">· {current?.label}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className={cn("w-[440px] p-4 rounded-2xl shadow-2xl z-[60]", light ? "bg-white border-[#E5E7EB]" : "bg-[#15161B] border-[#2a2a33]")}>
                <p className={cn("text-[13px] font-semibold mb-1", light ? "text-[#111]" : "text-white")}>Estilo das pastas</p>
                <p className="text-[11px] text-text-secondary mb-4">Como as pastas aparecem no seu Asset Hub. A escolha fica guardada na sua conta.</p>
                <div className="grid grid-cols-2 gap-3">
                    {FOLDER_STYLES.map(s => {
                        const active = s.id === value
                        const choose = async () => {
                            const ok = await onChange(s.id)
                            if (!ok) toast.error("A escolha ficou só neste navegador: não foi possível guardá-la na conta.")
                            setOpen(false)
                        }
                        return (
                            // Not a <button>: the live glass sample inside has buttons of its own
                            <div
                                key={s.id}
                                role="button"
                                tabIndex={0}
                                aria-pressed={active}
                                aria-label={s.label}
                                onClick={choose}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose() } }}
                                className={cn(
                                    "relative rounded-xl border p-3 flex flex-col items-center gap-2 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FF0054]",
                                    active ? "border-[#FF0054] bg-[#FF0054]/5" : light ? "border-[#E5E7EB] hover:border-[#c9ccd3]" : "border-[#2a2a33] hover:border-[#444]"
                                )}
                            >
                                {active && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FF0054] text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                                <div className={cn("w-full h-[110px] rounded-lg flex items-center justify-center overflow-hidden", light ? "bg-[#EFF0F2]" : "bg-[#0F1012]")}>
                                    <StyleSample id={s.id} />
                                </div>
                                <span className="w-full">
                                    <span className={cn("block text-[12px] font-semibold", light ? "text-[#111]" : "text-white")}>{s.label}</span>
                                    <span className="block text-[10px] text-text-secondary">{s.hint}</span>
                                </span>
                            </div>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
