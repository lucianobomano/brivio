"use client"

import * as React from "react"
import { Project } from "./ProjectsClient"
import {
    Plus,
    FileText,
    Image as ImageIcon,
    FileVideo,
    File as FileIcon,
    Download,
    Trash2,
    Search,
    Grid,
    List,
    Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { getProjectFiles, deleteProjectFile, ProjectFile } from "@/app/actions/project-files"
import { toast } from "sonner"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface ProjectFilesViewProps {
    project: Project
}

import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog"

export function ProjectFilesView({ project }: ProjectFilesViewProps) {
    const [files, setFiles] = React.useState<ProjectFile[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isUploading, setIsUploading] = React.useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const fetchFiles = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getProjectFiles(project.id)
            setFiles(data)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar arquivos")
        } finally {
            setIsLoading(false)
        }
    }, [project.id])

    React.useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    const handleDelete = async (id: string) => {
        const result = await deleteProjectFile(id)
        if (result.success) {
            toast.success("Arquivo removido")
            fetchFiles()
        } else {
            toast.error("Erro ao remover arquivo")
        }
    }

    const handleFileUpload = async (filesToCheck: FileList | null) => {
        if (!filesToCheck || filesToCheck.length === 0) return

        setIsUploading(true)
        try {
            const uploadPromises = Array.from(filesToCheck).map(async (file) => {
                return uploadProjectFile(project.id, file, file.name)
            })

            const results = await Promise.all(uploadPromises)
            const failed = results.filter(r => !r.success)

            if (failed.length > 0) {
                toast.error(`${failed.length} arquivos falharam ao enviar`)
            } else {
                toast.success("Arquivos enviados com sucesso")
            }

            setIsCreateModalOpen(false)
            fetchFiles()
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

    const filteredFiles = React.useMemo(() => {
        if (!searchQuery) return files
        const query = searchQuery.toLowerCase()
        return files.filter(file =>
            file.name.toLowerCase().includes(query) ||
            file.type.toLowerCase().includes(query)
        )
    }, [files, searchQuery])

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return ImageIcon
        if (type.startsWith('video/')) return FileVideo
        if (type === 'application/pdf') return FileText
        return FileIcon
    }

    return (
        <div className="flex flex-col gap-6 h-full font-inter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[#97A1B3] mb-1">Arquivo de Media</h2>
                    <p className="text-xs text-[#97A1B3]/60">Organize ativos, referências e entregas do projeto.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center bg-black/20 rounded-lg p-1 border border-[#373737]/30">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-[#EF0050]' : 'text-[#97A1B3]'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-[#EF0050]' : 'text-[#97A1B3]'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-11 px-6 bg-[#EF0050] hover:bg-[#EF0050]/90 text-white rounded-[8px] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#EF0050]/20 transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        SUBIR FICHEIRO
                    </Button>
                </div>
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

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#97A1B3]/40" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquise por nome, formato ou data..."
                    className="h-12 w-full bg-[#1A1A1A]/20 border-[#373737]/30 pl-11 rounded-[12px] text-sm text-[#97A1B3] placeholder:text-[#97A1B3]/20 focus:ring-[#EF0050]/50"
                />
            </div>

            {/* Files Grid/List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-[#97A1B3]/40 text-sm font-[300]">
                        Carregando arquivos...
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[#373737]/20 rounded-[20px] bg-black/5">
                        <FileIcon className="w-12 h-12 text-[#373737] mb-4" />
                        <span className="text-[#97A1B3]/40 text-sm font-[300]">Nenhum ficheiro disponível</span>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredFiles.map((file) => {
                            const Icon = getFileIcon(file.type)
                            return (
                                <div key={file.id} className="group relative bg-[#1A1A1A]/40 border border-[#373737]/30 rounded-[16px] p-4 transition-all hover:border-[#EF0050]/40 hover:scale-[1.02]">
                                    <div className="aspect-square rounded-[12px] bg-black/20 flex items-center justify-center mb-3 text-[#97A1B3] group-hover:text-[#EF0050] transition-colors overflow-hidden">
                                        {file.type.startsWith('image/') ? (
                                            <Image src={file.file_url} alt={file.name} fill className="object-cover" />
                                        ) : (
                                            <Icon className="w-8 h-8" />
                                        )}
                                    </div>
                                    <div className="text-xs font-bold text-white truncate mb-1">{file.name}</div>
                                    <div className="text-[10px] text-[#97A1B3]/60 uppercase tracking-tighter">{(file.size / 1024 / 1024).toFixed(2)} MB</div>

                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 bg-black/60 backdrop-blur-md rounded-full hover:text-red-500"
                                            onClick={() => handleDelete(file.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-[#1A1A1A]/20 border border-[#373737]/30 rounded-[12px] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#373737]/30 bg-black/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest w-[50%]">Nome</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Tamanho</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#97A1B3] uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#373737]/20">
                                {filteredFiles.map((file) => {
                                    const Icon = getFileIcon(file.type)
                                    return (
                                        <tr key={file.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-4 h-4 text-[#97A1B3]" />
                                                    <span className="text-sm font-bold text-white group-hover:text-[#EF0050] transition-colors">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-[#97A1B3]">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </td>
                                            <td className="px-6 py-4 text-xs text-[#97A1B3]">
                                                {format(new Date(file.created_at), "dd MMM yyyy", { locale: pt })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#97A1B3] hover:text-[#EF0050]">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#97A1B3] hover:text-red-500" onClick={() => handleDelete(file.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
