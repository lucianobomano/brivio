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
import { Switch } from "@/components/ui/switch"
import {
    Moon,
    Sun,
    Users,
    Mail,
    Search,
    Check,
    Loader2,
    UserPlus,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createWorkspaceWithSettings, searchDesigners } from "@/app/actions/settings"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface WorkspaceCreateModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (workspaceId: string) => void
}

interface SelectedMember {
    id: string
    name: string
    email: string
    avatar_url?: string
    type: 'platform' | 'email'
}

export function WorkspaceCreateModal({ isOpen, onClose, onSuccess }: WorkspaceCreateModalProps) {
    const [name, setName] = React.useState("")
    const [theme, setTheme] = React.useState<'light' | 'dark'>('dark')
    const [inviteByEmail, setInviteByEmail] = React.useState(false)
    const [emailInput, setEmailInput] = React.useState("")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [searchResults, setSearchResults] = React.useState<any[]>([])
    const [selectedMembers, setSelectedMembers] = React.useState<SelectedMember[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSearching, setIsSearching] = React.useState(false)

    // Search logic
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2 && !inviteByEmail) {
                setIsSearching(true)
                const results = await searchDesigners(searchQuery)
                setSearchResults(results)
                setIsSearching(false)
            } else {
                setSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, inviteByEmail])

    const handleAddMember = (user: any) => {
        if (selectedMembers.find(m => m.id === user.id)) return
        setSelectedMembers(prev => [...prev, {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url,
            type: 'platform'
        }])
        setSearchQuery("")
        setSearchResults([])
    }

    const handleAddEmail = () => {
        if (!emailInput.includes('@')) {
            toast.error("Coloque um e-mail válido")
            return
        }
        if (selectedMembers.find(m => m.email === emailInput)) return
        setSelectedMembers(prev => [...prev, {
            id: emailInput,
            name: emailInput.split('@')[0],
            email: emailInput,
            type: 'email'
        }])
        setEmailInput("")
    }

    const removeMember = (id: string) => {
        setSelectedMembers(prev => prev.filter(m => m.id !== id))
    }

    const handleSubmit = async () => {
        if (!name.trim()) return
        setIsLoading(true)
        try {
            const result = await createWorkspaceWithSettings({
                name,
                theme,
                members: selectedMembers.map(m => ({ type: m.type, value: m.type === 'platform' ? m.id : m.email }))
            })

            if (result.success && result.workspaceId) {
                toast.success("Workspace criado com sucesso!")
                onSuccess(result.workspaceId)
                onClose()
            } else {
                toast.error(result.error || "Erro ao criar workspace")
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-bg-1 border-bg-3 rounded-[24px] p-0 overflow-hidden gap-0">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-text-primary tracking-tight uppercase font-tight">
                            Criar Novo Workspace
                        </DialogTitle>
                        <DialogDescription className="text-text-tertiary text-[14px]">
                            Configure o seu ambiente de trabalho criativo e convide a sua equipa.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Workspace Name */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                Nome do Workspace
                            </Label>
                            <Input
                                placeholder="Ex: Brivio Design Studio"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-bg-0 border-bg-3 rounded-2xl h-14 text-text-primary focus:border-accent-indigo transition-all px-5 text-lg"
                            />
                        </div>

                        {/* Theme Selection */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                Modo de Visualização Padrão
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        "flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all",
                                        theme === 'light'
                                            ? "border-accent-indigo bg-accent-indigo/5 text-accent-indigo"
                                            : "border-bg-3 bg-bg-0 text-text-tertiary hover:border-text-tertiary"
                                    )}
                                >
                                    <Sun className="w-5 h-5" />
                                    <span className="font-bold">Light Mode</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all",
                                        theme === 'dark'
                                            ? "border-accent-indigo bg-accent-indigo/5 text-accent-indigo"
                                            : "border-bg-3 bg-bg-0 text-text-tertiary hover:border-text-tertiary"
                                    )}
                                >
                                    <Moon className="w-5 h-5" />
                                    <span className="font-bold">Dark Mode</span>
                                </button>
                            </div>
                        </div>

                        {/* Team Invitation */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                        Convidar Equipa
                                    </Label>
                                    <p className="text-[12px] text-text-tertiary">
                                        {inviteByEmail ? "Convidar por e-mail externo" : "Procurar utilizadores Brivio"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 bg-bg-0 p-1.5 rounded-full border border-bg-3">
                                    <Users className={cn("w-4 h-4", !inviteByEmail ? "text-accent-indigo" : "text-text-tertiary")} />
                                    <Switch
                                        checked={inviteByEmail}
                                        onCheckedChange={setInviteByEmail}
                                        className="data-[state=checked]:bg-accent-indigo"
                                    />
                                    <Mail className={cn("w-4 h-4", inviteByEmail ? "text-accent-indigo" : "text-text-tertiary")} />
                                </div>
                            </div>

                            <div className="relative">
                                {inviteByEmail ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="email@exemplo.com"
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                                            className="bg-bg-0 border-bg-3 rounded-2xl h-12 text-text-primary focus:border-accent-indigo transition-all px-5"
                                        />
                                        <Button
                                            onClick={handleAddEmail}
                                            className="h-12 w-12 rounded-2xl bg-accent-indigo hover:bg-accent-indigo/90 shrink-0"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                            <Input
                                                placeholder="Pesquisar designers pelo nome ou e-mail..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-bg-0 border-bg-3 rounded-2xl h-12 text-text-primary focus:border-accent-indigo transition-all pl-11 pr-5"
                                            />
                                            {isSearching && (
                                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-indigo animate-spin" />
                                            )}
                                        </div>

                                        {/* Search Results Dropdown */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-[calc(100%+8px)] inset-x-0 bg-bg-1 border border-bg-3 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[240px] overflow-y-auto">
                                                {searchResults.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => handleAddMember(user)}
                                                        className="w-full p-4 flex items-center gap-3 hover:bg-bg-0 transition-colors text-left group"
                                                    >
                                                        <Avatar className="w-10 h-10 border border-bg-3">
                                                            <AvatarImage src={user.avatar_url} />
                                                            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-text-primary truncate">{user.name}</p>
                                                            <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-accent-indigo/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Check className="w-4 h-4 text-accent-indigo" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Selected Members Chips */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selectedMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-2 bg-bg-0 border border-bg-3 pl-1.5 pr-3 py-1.5 rounded-full group"
                                    >
                                        <Avatar className="w-6 h-6 border border-bg-3">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback className="text-[10px]">{member.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[12px] font-bold text-text-primary">{member.name}</span>
                                        <button
                                            onClick={() => removeMember(member.id)}
                                            className="text-text-tertiary hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-bg-0 border-t border-bg-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-text-tertiary hover:text-text-primary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !name.trim()}
                        className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-accent-indigo/20 disabled:opacity-50 min-w-[200px]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Criar Workspace"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
