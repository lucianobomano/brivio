"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pipette, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectStageModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (data: { id?: string; name: string; color: string }) => void
    initialData?: { id: string; name: string; color: string } | null
}

const STANDARD_COLORS = [
    "#FF0054", // Brivio Pink
    "#8C92C7", // Brivio Indigo
    "#00D6A0", // Brivio Green
    "#0066FF", // Blue
    "#FF6600", // Orange
    "#8800FF", // Purple
    "#F59E0B", // Amber
    "#EC4899", // Pink
]

export function ProjectStageModal({ isOpen, onClose, onSuccess, initialData }: ProjectStageModalProps) {
    const [name, setName] = React.useState("")
    const [color, setColor] = React.useState(STANDARD_COLORS[0])
    const colorInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name)
                setColor(initialData.color)
            } else {
                setName("")
                setColor(STANDARD_COLORS[0])
            }
        }
    }, [isOpen, initialData])

    const handleSubmit = () => {
        if (!name.trim()) return
        onSuccess?.({
            id: initialData?.id,
            name,
            color
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-bg-1 border-bg-3 rounded-[12px] p-6 gap-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-text-primary tracking-tight">
                        {initialData ? "Editar Etapa" : "Criar Nova Etapa"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-text-tertiary">
                        {initialData ? "Atualize os detalhes desta fase do projeto." : "Defina uma nova fase para o fluxo de trabalho dos seus projetos."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="stage-name" className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                            Nome da Etapa
                        </Label>
                        <Input
                            id="stage-name"
                            placeholder="Ex: Pós-Produção"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-bg-0 border-bg-3 rounded-xl h-11 text-text-primary focus:border-accent-indigo/50 transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                            Cor da Etapa
                        </Label>
                        <div className="flex flex-wrap gap-3 items-center">
                            {STANDARD_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all duration-200 border-2 flex items-center justify-center",
                                        color === c ? "border-white scale-110 shadow-lg shadow-white/10" : "border-transparent hover:scale-110"
                                    )}
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && <Check className="w-4 h-4 text-white" />}
                                </button>
                            ))}

                            {/* Custom Color Picker Toggle */}
                            <div className="relative group">
                                <button
                                    onClick={() => colorInputRef.current?.click()}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 border-dashed border-bg-3 flex items-center justify-center hover:border-text-tertiary transition-all duration-200 overflow-hidden relative",
                                        !STANDARD_COLORS.includes(color) && "border-white border-solid"
                                    )}
                                    style={{ backgroundColor: !STANDARD_COLORS.includes(color) ? color : 'transparent' }}
                                >
                                    <Pipette className={cn(
                                        "w-4 h-4",
                                        !STANDARD_COLORS.includes(color) ? "text-white" : "text-text-tertiary group-hover:text-text-primary"
                                    )} />
                                </button>
                                <input
                                    type="color"
                                    ref={colorInputRef}
                                    className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-xl h-11 text-text-tertiary hover:text-text-primary hover:bg-bg-2 font-bold uppercase text-[11px] tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl h-11 px-8 font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-accent-indigo/20 disabled:opacity-50"
                    >
                        {initialData ? "Gravar Alterações" : "Criar Etapa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
