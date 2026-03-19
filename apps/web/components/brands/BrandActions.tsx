"use client"

import * as React from "react"
import { MoreVertical, Eye, Settings2, Pencil, Trash2, Globe, Lock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateBrand, deleteBrand, updateBrandbookVisibility } from "@/app/actions/brands"
import { toast } from "sonner"

interface BrandActionsProps {
    brand: {
        id: string
        name: string
        brandbooks?: { id: string, status?: string, visibility?: string }[]
    }
}

export function BrandActions({ brand }: BrandActionsProps) {
    const router = useRouter()
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
    const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false)
    const [isVisibilityModalOpen, setIsVisibilityModalOpen] = React.useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)

    // Rename state
    const [newName, setNewName] = React.useState(brand.name)
    const [isRenaming, setIsRenaming] = React.useState(false)

    // Visibility state
    const currentVisibility = brand.brandbooks?.[0]?.visibility || brand.brandbooks?.[0]?.status || 'draft'
    const [selectedVisibility, setSelectedVisibility] = React.useState(currentVisibility)
    const [isUpdatingVisibility, setIsUpdatingVisibility] = React.useState(false)

    // Delete state
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleRename = async () => {
        if (!newName.trim() || newName === brand.name) {
            setIsRenameModalOpen(false)
            return
        }
        setIsRenaming(true)
        try {
            const formData = new FormData()
            formData.append("brandId", brand.id)
            formData.append("name", newName)
            await updateBrand(formData)
            toast.success("Brand renamed successfully")
            setIsRenameModalOpen(false)
        } catch (error) {
            console.error("Rename error:", error)
            toast.error("Failed to rename brand")
        } finally {
            setIsRenaming(false)
        }
    }

    const handleVisibilityUpdate = async () => {
        if (selectedVisibility === currentVisibility) {
            setIsVisibilityModalOpen(false)
            return
        }
        setIsUpdatingVisibility(true)
        try {
            await updateBrandbookVisibility(brand.id, selectedVisibility)
            toast.success(`Visibility updated to ${selectedVisibility}`)
            setIsVisibilityModalOpen(false)
        } catch (error) {
            console.error("Visibility update error:", error)
            toast.error("Failed to update visibility")
        } finally {
            setIsUpdatingVisibility(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteBrand(brand.id)
            toast.success("Brand deleted successfully")
            setIsDeleteModalOpen(false)
        } catch (error) {
            console.error("Delete error:", error)
            // Extract error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            // Check if it's a redirect (Next.js throws on redirect, which is expected)
            if (errorMessage.includes('NEXT_REDIRECT')) {
                // This is actually a success - redirect was triggered
                toast.success("Brand deleted successfully")
                setIsDeleteModalOpen(false)
                return
            }
            toast.error(`Failed to delete brand: ${errorMessage}`)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <button
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100 z-20"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-48 p-1 bg-white border border-gray-200 shadow-xl rounded-xl z-50"
                    side="bottom"
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col gap-0.5">
                        <button
                            onClick={() => {
                                setIsPopoverOpen(false)
                                router.push(`/brand/${brand.id}/brandbook?preview=true`)
                            }}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg w-full text-left font-medium"
                        >
                            <Eye className="w-4 h-4 text-gray-400" />
                            Previsualizar
                        </button>
                        <button
                            onClick={() => {
                                setIsPopoverOpen(false)
                                setIsVisibilityModalOpen(true)
                            }}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg w-full text-left font-medium"
                        >
                            <Settings2 className="w-4 h-4 text-gray-400" />
                            Editar Visibilidade
                        </button>
                        <button
                            onClick={() => {
                                setIsPopoverOpen(false)
                                setIsRenameModalOpen(true)
                            }}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded-lg w-full text-left font-medium"
                        >
                            <Pencil className="w-4 h-4 text-gray-400" />
                            Renomear
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                            onClick={() => {
                                setIsPopoverOpen(false)
                                setIsDeleteModalOpen(true)
                            }}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg w-full text-left font-semibold"
                        >
                            <Trash2 className="w-4 h-4" />
                            Deletar
                        </button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Rename Modal */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl shadow-2xl p-0 overflow-hidden border-none" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-[#FF0054] p-6 text-white">
                        <DialogTitle className="text-xl font-bold">Renomear Marca</DialogTitle>
                        <DialogDescription className="text-white/80 mt-1">
                            Altere o nome da sua marca para melhor identificação.
                        </DialogDescription>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">Nome da Marca</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="h-12 border-gray-200 rounded-xl focus:ring-[#FF0054] focus:border-[#FF0054]"
                                placeholder="Ex: Nike, Adidas..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-0 flex gap-3">
                        <Button variant="outline" onClick={() => setIsRenameModalOpen(false)} className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-bold text-gray-600">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={isRenaming || !newName.trim()}
                            className="flex-1 h-12 rounded-xl bg-[#FF0054] hover:bg-[#E6004B] text-white font-bold shadow-lg shadow-[#FF0054]/20"
                        >
                            {isRenaming ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Visibility Modal */}
            <Dialog open={isVisibilityModalOpen} onOpenChange={setIsVisibilityModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl shadow-2xl p-0 overflow-hidden border-none" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-bg-0 p-6 text-white border-b border-white/10">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Globe className="w-5 h-5 text-accent-pink" />
                            Visibilidade do Brand Book
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 mt-1">
                            Controle quem pode visualizar o seu livro de marca publicamente.
                        </DialogDescription>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">Selecione a Visibilidade</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 justify-between px-4 bg-gray-50 border-gray-200 rounded-xl hover:bg-gray-100 transition-all font-semibold"
                                    >
                                        <div className="flex items-center gap-3">
                                            {selectedVisibility === 'public' && <Globe className="w-5 h-5 text-emerald-500" />}
                                            {selectedVisibility === 'private' && <Lock className="w-5 h-5 text-amber-500" />}
                                            {selectedVisibility === 'draft' && <AlertCircle className="w-5 h-5 text-gray-400" />}
                                            <span className="capitalize text-gray-900">
                                                {selectedVisibility === 'public' ? 'Público' :
                                                    selectedVisibility === 'private' ? 'Privado' : 'Rascunho'}
                                            </span>
                                        </div>
                                        <Settings2 className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[361px] bg-white border border-gray-200 rounded-xl shadow-xl p-1 z-[60]">
                                    <DropdownMenuItem
                                        onClick={() => setSelectedVisibility('public')}
                                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <Globe className="w-4 h-4 text-emerald-500" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Público</p>
                                            <p className="text-xs text-gray-500">Visível para toda a comunidade.</p>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setSelectedVisibility('private')}
                                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <Lock className="w-4 h-4 text-amber-500" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Privado</p>
                                            <p className="text-xs text-gray-500">Apenas membros do workspace.</p>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setSelectedVisibility('draft')}
                                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <AlertCircle className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Rascunho</p>
                                            <p className="text-xs text-gray-500">Em desenvolvimento, não publicado.</p>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 text-blue-700 text-[13px] leading-relaxed border border-blue-100 font-medium">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                {selectedVisibility === 'public'
                                    ? "O brand book aparecerá na galeria da comunidade e será indexado por motores de busca."
                                    : selectedVisibility === 'private'
                                        ? "O brand book ficará restrito apenas aos utilizadores autorizados no teu workspace."
                                        : "O brand book ficará em modo rascunho e não poderá ser visualizado por links externos."}
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="p-8 pt-0 flex gap-3">
                        <Button variant="outline" onClick={() => setIsVisibilityModalOpen(false)} className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-bold text-gray-600">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleVisibilityUpdate}
                            disabled={isUpdatingVisibility}
                            className="flex-1 h-12 rounded-xl bg-bg-0 hover:bg-gray-900 text-white font-bold border border-white/10"
                        >
                            {isUpdatingVisibility ? "Atualizando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl shadow-2xl p-0 overflow-hidden border-none" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-red-50 p-6 text-red-600">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-700 uppercase tracking-tighter">
                            <Trash2 className="w-5 h-5 shrink-0" />
                            Eliminar Marca
                        </DialogTitle>
                    </div>
                    <div className="p-8 space-y-4">
                        <p className="text-gray-900 font-bold text-lg leading-tight">
                            Tens a certeza que queres eliminar a marca <span className="text-[#FF0054] underline decoration-wavy underline-offset-4">{brand.name}</span>?
                        </p>
                        <p className="text-[14px] text-gray-500 leading-relaxed font-medium">
                            Esta ação é <strong className="text-gray-900">irreversível</strong>. Todos os brandbooks, assets e projetos associados a esta marca serão eliminados permanentemente.
                        </p>
                    </div>
                    <DialogFooter className="p-8 pt-0 flex flex-col gap-3">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full h-14 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.1em] shadow-xl shadow-red-600/20"
                        >
                            {isDeleting ? "ELIMINANDO..." : "ELIMINAR PERMANENTEMENTE"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="w-full h-12 text-gray-400 hover:text-gray-600 font-bold hover:bg-transparent"
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
