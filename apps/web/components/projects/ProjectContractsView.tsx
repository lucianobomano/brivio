"use client"

import * as React from "react"
import { Project } from "./ProjectsClient"
import {
    MoreHorizontal,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Download,
    Trash2,
    Eye,
    Upload
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getProjectContracts, deleteContract, createProjectContract, Contract } from "@/app/actions/project-contracts"
import { toast } from "sonner"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface ProjectContractsViewProps {
    project: Project
}

const CONTRACT_STATUS: Record<Contract['status'], { label: string, color: string, bg: string, icon: React.ElementType }> = {
    draft: { label: "Rascunho", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)", icon: Clock },
    pending: { label: "Pendente", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: AlertCircle },
    signed: { label: "Assinado", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: CheckCircle2 },
    expired: { label: "Expirado", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: XCircle }
}

export function ProjectContractsView({ project }: ProjectContractsViewProps) {
    const [contracts, setContracts] = React.useState<Contract[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)

    // Supabase client for upload
    const supabase = createClient()
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const fetchContracts = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getProjectContracts(project.id)
            setContracts(data)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar contratos")
        } finally {
            setIsLoading(false)
        }
    }, [project.id])

    React.useEffect(() => {
        fetchContracts()
    }, [fetchContracts])

    const handleDelete = async (id: string) => {
        const result = await deleteContract(id)
        if (result.success) {
            toast.success("Contrato eliminado")
            fetchContracts()
        } else {
            toast.error(result.error || "Erro ao eliminar contrato")
        }
    }

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setIsUploading(true)
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `${project.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('contracts')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('contracts')
                    .getPublicUrl(filePath)

                return createProjectContract(project.id, {
                    name: file.name,
                    file_url: publicUrl,
                    status: 'draft'
                })
            })

            const results = await Promise.all(uploadPromises)
            const failed = results.filter(r => !r.success)

            if (failed.length > 0) {
                toast.error(`${failed.length} arquivos falharam ao enviar`)
            } else {
                toast.success("Arquivos enviados com sucesso")
            }

            setIsCreateModalOpen(false)
            fetchContracts()
        } catch (error) {
            console.error(error)
            toast.error("Erro ao enviar arquivos")
        } finally {
            setIsUploading(false)
            setIsDragging(false)
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileUpload(e.dataTransfer.files)
    }

    return (
        <div className="flex flex-col gap-6 h-full font-inter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[#97A1B3] mb-1">Contratos Jurídicos</h2>
                    <p className="text-xs text-[#97A1B3]/60">Gerencie os documentos e contratos deste projeto.</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-11 px-6 bg-[#EF0050] hover:bg-[#EF0050]/90 text-white rounded-[8px] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#EF0050]/20 transition-all"
                >
                    <Upload className="w-4 h-4" />
                    SUBIR FICHEIRO
                </Button>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="bg-[#15161B] border-none p-0 gap-0 rounded-[8px] max-w-[800px] overflow-hidden [&>button]:hidden">
                        <div className="h-[45px] bg-[#ff0054] px-6 flex items-center justify-between rounded-t-[8px]">
                            <span className="text-white font-bold text-lg">Subir arquivos</span>
                            <div
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-[21px] h-[21px] rounded-full bg-[#15161B] cursor-pointer hover:opacity-80 transition-opacity"
                            />
                        </div>

                        <div className="p-[70px] bg-[#15161B]">
                            <div
                                className={`
                                    border border-dashed border-[#97a1b3]/30 rounded-[12px] h-[300px]
                                    flex flex-col items-center justify-center gap-4 transition-all
                                    ${isDragging ? 'bg-white/5 border-[#ff0054]' : 'bg-transparent'}
                                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                                `}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                            >
                                {isUploading ? (
                                    <div className="text-center text-[#97a1b3]">
                                        <div className="animate-spin w-8 h-8 border-2 border-[#ff0054] border-t-transparent rounded-full mx-auto mb-4" />
                                        <p>Enviando arquivos...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-[#97a1b3]" />
                                        <div className="text-center">
                                            <p className="text-[#97a1b3] font-bold mb-1">Drag and drop your files here</p>
                                            <p className="text-[#97a1b3]/60 text-sm">or click to upload from your computer</p>
                                        </div>
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-[#ff0054] hover:bg-[#ff0054]/90 text-white font-bold rounded-[8px] px-6 py-2 h-auto mt-2"
                                        >
                                            Select from Library
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            multiple
                                            onChange={(e) => handleFileUpload(e.target.files)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Content Area */}
            <div className="bg-transparent border border-[#373737]/30 rounded-[12px] overflow-hidden flex-1 flex flex-col min-h-0 bg-[#1A1A1A]/20 backdrop-blur-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#373737]/30 bg-black/5">
                                <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest w-[40%]">Documento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#373737]/20">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                        Carregando contratos...
                                    </td>
                                </tr>
                            ) : contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#97A1B3]/40 text-sm font-[300]">
                                        Nenhum contrato encontrado para este projeto.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract) => {
                                    const status = CONTRACT_STATUS[contract.status]
                                    return (
                                        <tr key={contract.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-[#97A1B3]">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white group-hover:text-[#EF0050] transition-colors">{contract.name}</div>
                                                        <div className="text-[10px] text-[#97A1B3]/60 uppercase tracking-tighter">PDF DOCUMENT</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-full px-3 py-1 border-none flex items-center gap-1.5 w-fit"
                                                    style={{ backgroundColor: status.bg, color: status.color }}
                                                >
                                                    <status.icon className="w-3 h-3" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-[#97A1B3] font-[300]">
                                                    {format(new Date(contract.created_at), "dd MMM yyyy", { locale: pt })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 text-[#97A1B3]">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[180px] bg-[#1A1A1A] border-[#373737] p-1">
                                                        <DropdownMenuItem className="gap-2 text-xs text-[#97A1B3] hover:text-white hover:bg-[#EF0050]/10 cursor-pointer">
                                                            <Eye className="w-4 h-4" />
                                                            Visualizar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2 text-xs text-[#97A1B3] hover:text-white hover:bg-[#EF0050]/10 cursor-pointer">
                                                            <Download className="w-4 h-4" />
                                                            Descarregar
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-[#373737] my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(contract.id)}
                                                            className="gap-2 text-xs text-red-500 hover:text-white hover:bg-red-500/10 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Eliminar Contracto
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
