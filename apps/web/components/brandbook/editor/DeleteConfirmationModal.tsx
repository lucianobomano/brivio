"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DeleteConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    message?: string
    confirmLabel?: string
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Eliminar página",
    message = "Esta ação é irreversível. Todos os arquivos, informações e configurações associadas a esta página serão eliminadas permanentemente.",
    confirmLabel = "Confirmar"
}: DeleteConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="bg-[#111116] border-[#222] rounded-[16px] p-0 shadow-2xl overflow-hidden [&>button]:hidden flex flex-col"
                style={{ width: '400px', height: '325px', maxWidth: '400px' }}
            >
                {/* Header decorativo rosa */}
                <div className="h-[50px] bg-[#FF0054] px-6 flex items-center justify-between shrink-0">
                    <span className="text-white font-bold text-[16px] tracking-tight">{title}</span>
                    <button
                        onClick={onClose}
                        className="w-[22px] h-[22px] rounded-full bg-[#111116] hover:bg-black/40 transition-colors flex items-center justify-center group"
                        aria-label="Close"
                    >
                        <X className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="p-8 flex flex-col justify-between flex-1">
                    <DialogHeader className="flex flex-col items-start gap-2">
                        <DialogDescription className="text-[15px] text-gray-400 text-left leading-relaxed">
                            {message}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 rounded-xl h-11 text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                onConfirm()
                                onClose()
                            }}
                            className="flex-1 bg-[#FF0054] hover:bg-[#D90046] text-white rounded-xl h-11 font-medium shadow-lg shadow-[#FF0054]/20 transition-all border-none"
                        >
                            {confirmLabel}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
