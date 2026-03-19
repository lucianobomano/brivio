"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    User,
    Lock,
    Bell,
    Users,
    MapPin,
    Briefcase,
    Code,
    Mail,
    ShieldCheck,
    Camera,
    Plus,
    X,
    Check,
    Loader2,
    Trash2,
    Sparkles,
    Edit3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { updateProfile, updateSocialLinks, updateWorkspaceSettings } from "@/app/actions/settings"
import { addService, updateService, deleteService } from "@/app/actions/services"
import { uploadAvatar } from "@/app/actions/upload-avatar"
import { uploadCover } from "@/app/actions/upload-cover"
import { LocationSelector } from "@/components/settings/LocationSelector"
import { CategorySelector } from "@/components/settings/CategorySelector"
import { ServiceModal } from "@/components/settings/ServiceModal"

interface SocialLink {
    platform: string;
    url: string;
}

interface SettingsClientProps {
    initialData: any;
}

export function SettingsClient({ initialData }: SettingsClientProps) {
    const [activeTab, setActiveTab] = React.useState("profile")
    const [isSaving, setIsSaving] = React.useState(false)
    const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [services, setServices] = React.useState(initialData?.services || [])
    const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false)
    const [editingService, setEditingService] = React.useState<any>(null)

    // Debug log
    console.log("SettingsClient initialData:", initialData)

    // Form States
    const [profile, setProfile] = React.useState({
        name: initialData?.user?.name || "",
        avatar_url: initialData?.user?.avatar_url || "",
        cover_url: initialData?.user?.cover_url || "",
        bio: initialData?.user?.bio || "",
        country: initialData?.creatorProfile?.country || "",
        state: initialData?.creatorProfile?.location || "",
        website: initialData?.creatorProfile?.website || "",
        category: initialData?.creatorProfile?.category || "",
        expertise: initialData?.creatorProfile?.expertise || [],
        about: initialData?.creatorProfile?.about || "",
        profile_type: initialData?.user?.profile_type || "",
    })

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ type, message })
        setTimeout(() => setFeedback(null), 3000)
    }

    const [socialLinks, setSocialLinks] = React.useState<SocialLink[]>(
        initialData?.creatorProfile?.social_links?.map((l: any) => ({
            platform: l.platform,
            url: l.url
        })) || []
    )

    const [workspace, setWorkspace] = React.useState({
        name: initialData?.workspace?.name || "",
        slug: initialData?.workspace?.slug || "",
    })

    const handleSaveProfile = async () => {
        setIsSaving(true)
        const res = await updateProfile(profile)
        if (res.success) {
            showFeedback('success', 'Perfil actualizado com sucesso!')
        } else {
            showFeedback('error', res.error || 'Erro ao guardar perfil')
        }
        setIsSaving(false)
    }

    const handleSaveSocials = async () => {
        setIsSaving(true)
        const res = await updateSocialLinks(socialLinks)
        if (res.success) {
            showFeedback('success', 'Redes sociais actualizadas!')
        } else {
            showFeedback('error', res.error || 'Erro ao guardar links')
        }
        setIsSaving(false)
    }

    const handleSaveWorkspace = async () => {
        setIsSaving(true)
        const res = await updateWorkspaceSettings(initialData?.workspace?.id, workspace)
        if (res.success) {
            showFeedback('success', 'Workspace actualizado!')
        } else {
            showFeedback('error', res.error || 'Erro ao guardar workspace')
        }
        setIsSaving(false)
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsSaving(true)
        const formData = new FormData()
        formData.append('file', file)

        const res = await uploadAvatar(formData)
        if (res.success) {
            setProfile(prev => ({ ...prev, avatar_url: res.url }))
            showFeedback('success', 'Foto de perfil actualizada!')
        } else {
            showFeedback('error', res.error || 'Erro no upload')
        }
        setIsSaving(false)
    }

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsSaving(true)
        const formData = new FormData()
        formData.append('file', file)

        const res = await uploadCover(formData)
        if (res.success) {
            setProfile(prev => ({ ...prev, cover_url: res.url }))
            showFeedback('success', 'Imagem de capa actualizada!')
        } else {
            showFeedback('error', res.error || 'Erro no upload da capa')
        }
        setIsSaving(false)
    }

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "services", label: "Services", icon: Sparkles },
        { id: "account", label: "Account", icon: Lock },
        { id: "workspace", label: "Workspace", icon: Briefcase },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "team", label: "Team", icon: Users },
    ]

    return (
        <div className="flex flex-col gap-8 relative">
            {/* Feedback Toast */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={cn(
                            "fixed top-8 left-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border font-bold text-sm",
                            feedback.type === 'success' ? "bg-bg-1 border-green-500/50 text-green-500" : "bg-bg-1 border-red-500/50 text-red-500"
                        )}
                    >
                        {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {feedback.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-12 gap-12">
                {/* Navigation Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                    activeTab === tab.id
                                        ? "bg-bg-3 text-text-primary shadow-sm"
                                        : "text-text-secondary hover:text-text-primary hover:bg-bg-2"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", activeTab === tab.id ? "text-accent-indigo" : "text-text-secondary")} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Content Area */}
                <div className="col-span-12 lg:col-span-9">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-bg-1 border border-bg-3 rounded-2xl overflow-hidden shadow-xl"
                        >
                            {activeTab === "profile" && (
                                <ProfileModule
                                    profile={profile}
                                    setProfile={setProfile}
                                    socialLinks={socialLinks}
                                    setSocialLinks={setSocialLinks}
                                    onSaveProfile={handleSaveProfile}
                                    onSaveSocials={handleSaveSocials}
                                    onAvatarUpload={handleAvatarUpload}
                                    onCoverUpload={handleCoverUpload}
                                    isSaving={isSaving}
                                />
                            )}
                            {activeTab === "account" && <AccountModule email={initialData?.user?.email} />}
                            {activeTab === "workspace" && (
                                <WorkspaceModule
                                    workspace={workspace}
                                    setWorkspace={setWorkspace}
                                    onSave={handleSaveWorkspace}
                                    isSaving={isSaving}
                                />
                            )}
                            {activeTab === "notifications" && <NotificationsModule />}
                            {activeTab === "team" && <TeamModule initialData={initialData} />}
                            {activeTab === "services" && (
                                <ServicesModule
                                    services={services}
                                    onAdd={() => {
                                        setEditingService(null)
                                        setIsServiceModalOpen(true)
                                    }}
                                    onEdit={(s: any) => {
                                        setEditingService(s)
                                        setIsServiceModalOpen(true)
                                    }}
                                    onDelete={async (id: string) => {
                                        const res = await deleteService(id)
                                        if (res.success) {
                                            setServices(prev => prev.filter(s => s.id !== id))
                                            showFeedback('success', 'Serviço removido!')
                                        }
                                    }}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <ServiceModal
                isOpen={isServiceModalOpen}
                onClose={() => {
                    setIsServiceModalOpen(false)
                    setEditingService(null)
                }}
                editingService={editingService}
                userProjects={initialData?.userProjects || []}
                onSave={async (data) => {
                    if (editingService) {
                        const res = await updateService(editingService.id, data)
                        if (res.success) {
                            setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...data } : s))
                            showFeedback('success', 'Serviço actualizado!')
                        }
                    } else {
                        const res = await addService(data)
                        if (res.success) {
                            showFeedback('success', 'Serviço publicado!')
                            // In a real scenario, we might need to fetch the full services list again 
                            // or have addService return the full object with relations
                        }
                    }
                }}
            />
        </div>
    )
}

function ProfileModule({ profile, setProfile, socialLinks, setSocialLinks, onSaveProfile, onSaveSocials, onAvatarUpload, onCoverUpload, isSaving }: any) {
    const [newExpertise, setNewExpertise] = React.useState("")
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const coverInputRef = React.useRef<HTMLInputElement>(null)

    const addExpertise = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && newExpertise.trim()) {
            setProfile({
                ...profile,
                expertise: [...new Set([...profile.expertise, newExpertise.trim()])]
            })
            setNewExpertise("")
            e.preventDefault()
        }
    }

    const removeExpertise = (tag: string) => {
        setProfile({
            ...profile,
            expertise: profile.expertise.filter((t: string) => t !== tag)
        })
    }

    return (
        <div className="flex flex-col">
            <div className="p-8 border-b border-bg-2">
                <h3 className="text-xl font-bold mb-1">Perfil Criativo</h3>
                <p className="text-text-secondary text-sm">Mostre ao mundo quem você é e do que é capaz.</p>
            </div>

            <div className="p-8 space-y-10">
                {/* Cover Image Section */}
                <div className="space-y-4">
                    <Label>Imagem de Capa</Label>
                    <div
                        className="relative w-full h-32 rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 group cursor-pointer border border-bg-3"
                        onClick={() => coverInputRef.current?.click()}
                        style={{
                            backgroundImage: profile.cover_url ? `url(${profile.cover_url})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center"
                        }}
                    >
                        {!profile.cover_url && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-black text-white/10 uppercase tracking-widest">
                                    {profile.name || "COVER"}
                                </span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white">
                                <Camera className="w-5 h-5" />
                                <span className="text-sm font-medium">Alterar capa</span>
                            </div>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={coverInputRef}
                        onChange={onCoverUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <p className="text-[11px] text-text-tertiary">Recomendado: 1200x300px. Esta imagem aparece no popover do seu perfil.</p>
                </div>

                {/* Visual Header */}
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-bg-3 flex items-center justify-center text-3xl font-black text-white overflow-hidden border-4 border-bg-2 shadow-2xl">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile.name?.substring(0, 2).toUpperCase() || "?"
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-text-primary text-bg-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onAvatarUpload}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold">{profile.name || "Seu Nome"}</h4>
                        <p className="text-text-secondary text-sm">Membro desde {new Date().getFullYear()}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Nome de Exibição</Label>
                    <Input
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        className="bg-bg-0 border-bg-3 focus:border-accent-indigo transition-all"
                        placeholder="Como você quer ser chamado?"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Tipo de Perfil</Label>
                    <select
                        value={profile.profile_type}
                        onChange={e => setProfile({ ...profile, profile_type: e.target.value })}
                        className="w-full h-10 bg-bg-0 border border-bg-3 rounded-md px-3 py-2 text-sm focus:border-accent-indigo outline-none transition-all"
                    >
                        <option value="" disabled className="bg-bg-1">Selecionar tipo...</option>
                        <option value="Hirer" className="bg-bg-1">Hirer</option>
                        <option value="Creator" className="bg-bg-1">Creator</option>
                        <option value="Agency" className="bg-bg-1">Agency</option>
                        <option value="Company" className="bg-bg-1">Company</option>
                    </select>
                </div>

                {/* Location Selector */}
                <LocationSelector
                    selectedCountry={profile.country}
                    selectedState={profile.state}
                    onCountryChange={(country) => setProfile(prev => ({ ...prev, country, state: "" }))}
                    onStateChange={(state) => setProfile(prev => ({ ...prev, state }))}
                />

                <div className="space-y-2">
                    <Label>Bio Curta</Label>
                    <Input
                        value={profile.bio}
                        onChange={e => setProfile({ ...profile, bio: e.target.value })}
                        className="bg-bg-0 border-bg-3 focus:border-accent-indigo transition-all font-medium"
                        placeholder="Uma frase marcante sobre você..."
                    />
                    <p className="text-[11px] text-text-tertiary">Aparece abaixo do seu nome nos cards de comunidade.</p>
                </div>

                <div className="space-y-2">
                    <Label>Sobre Você</Label>
                    <Textarea
                        value={profile.about}
                        onChange={e => setProfile({ ...profile, about: e.target.value })}
                        className="bg-bg-0 border-bg-3 min-h-[120px] focus:border-accent-indigo transition-all"
                        placeholder="Conte sua história, desafios e paixões..."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Website / Portfólio</Label>
                    <Input
                        value={profile.website}
                        onChange={e => setProfile({ ...profile, website: e.target.value })}
                        className="bg-bg-0 border-bg-3 focus:border-accent-indigo transition-all"
                        placeholder="https://seusite.com"
                    />
                    <p className="text-[11px] text-text-tertiary">Seu site pessoal ou portfólio online.</p>
                </div>

                <CategorySelector
                    selectedCategory={profile.category}
                    onCategoryChange={(category) => setProfile(prev => ({ ...prev, category }))}
                />

                <div className="space-y-4">
                    <Label>Experiência e Competências (Expertise)</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {profile.expertise.map((tag: string) => (
                            <Badge key={tag} className="bg-bg-3 text-text-primary border-bg-2 py-1.5 px-3 rounded-full flex items-center gap-2 group">
                                {tag}
                                <button onClick={() => removeExpertise(tag)} className="text-text-tertiary hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="relative">
                        <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <Input
                            value={newExpertise}
                            onChange={e => setNewExpertise(e.target.value)}
                            onKeyDown={addExpertise}
                            className="bg-bg-0 border-bg-3 pl-10 focus:border-accent-indigo transition-all"
                            placeholder="Digite uma competência e aperte Enter..."
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={onSaveProfile}
                        disabled={isSaving}
                        className="bg-accent-indigo hover:bg-accent-indigo/90 min-w-[140px]"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Perfil"}
                    </Button>
                </div>
            </div>

            {/* Social Links Section */}
            <div className="p-8 bg-bg-2/30 border-t border-bg-2 mt-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="font-bold text-lg">Ligações Externas</h4>
                        <p className="text-text-secondary text-sm">Conecte seus outros canais e redes sociais.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {socialLinks.map((link: SocialLink, idx: number) => (
                        <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
                            <Input
                                placeholder="Plataforma (Ex: Instagram, Behance)"
                                value={link.platform}
                                onChange={e => {
                                    const newLinks = [...socialLinks]
                                    newLinks[idx].platform = e.target.value
                                    setSocialLinks(newLinks)
                                }}
                                className="bg-bg-0 border-bg-3 flex-1"
                            />
                            <Input
                                placeholder="URL do Link"
                                value={link.url}
                                onChange={e => {
                                    const newLinks = [...socialLinks]
                                    newLinks[idx].url = e.target.value
                                    setSocialLinks(newLinks)
                                }}
                                className="bg-bg-0 border-bg-3 flex-[2]"
                            />
                            <button
                                onClick={() => setSocialLinks(socialLinks.filter((_: any, i: number) => i !== idx))}
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <Button
                        variant="ghost"
                        onClick={() => setSocialLinks([...socialLinks, { platform: "", url: "" }])}
                        className="w-full border border-dashed border-bg-3 hover:bg-bg-3 text-text-secondary"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Rede Social
                    </Button>
                </div>

                <div className="flex justify-end pt-8">
                    <Button
                        onClick={onSaveSocials}
                        disabled={isSaving}
                        className="bg-white text-black hover:bg-white/90 min-w-[140px]"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar Links"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function AccountModule({ email }: { email: string }) {
    return (
        <div className="flex flex-col">
            <div className="p-8 border-b border-bg-2">
                <h3 className="text-xl font-bold mb-1">Conta & Segurança</h3>
                <p className="text-text-secondary text-sm">Gerencie suas credenciais de acesso e segurança.</p>
            </div>

            <div className="p-8 space-y-8">
                <div className="space-y-2">
                    <Label>Endereço de Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <Input defaultValue={email} disabled className="bg-bg-0 border-bg-3 pl-10 opacity-60" />
                    </div>
                    <p className="text-[11px] text-text-tertiary">O email não pode ser alterado diretamente por questões de segurança.</p>
                </div>

                <div className="pt-4 border-t border-bg-3">
                    <h4 className="font-bold mb-4">Mudar Palavra-passe</h4>
                    <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label>Palavra-passe Atual</Label>
                            <Input type="password" placeholder="••••••••" className="bg-bg-0 border-bg-3" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nova Palavra-passe</Label>
                            <Input type="password" placeholder="Mínimo 8 caracteres" className="bg-bg-0 border-bg-3" />
                        </div>
                        <Button className="bg-bg-3 text-text-primary hover:bg-bg-2 border border-bg-3">
                            Atualizar palavra-passe
                        </Button>
                    </div>
                </div>

                <div className="pt-4 border-t border-bg-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-2/40 border border-bg-3">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Autenticação de Dois Factores (2FA)</p>
                                <p className="text-xs text-text-tertiary">Adicione uma camada extra de segurança à sua conta.</p>
                            </div>
                        </div>
                        <Button variant="outline" className="text-xs border-bg-3 hover:bg-bg-3">Activar</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function WorkspaceModule({ workspace, setWorkspace, onSave, isSaving }: any) {
    return (
        <div className="flex flex-col">
            <div className="p-8 border-b border-bg-2">
                <h3 className="text-xl font-bold mb-1">Meu Workspace</h3>
                <p className="text-text-secondary text-sm">Personalize o seu espaço de trabalho criativo.</p>
            </div>

            <div className="p-8 space-y-6">
                <div className="space-y-2">
                    <Label>Nome do Workspace</Label>
                    <Input
                        value={workspace.name}
                        onChange={e => setWorkspace({ ...workspace, name: e.target.value })}
                        className="bg-bg-0 border-bg-3"
                        placeholder="Ex: Design Studio"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Slug URL</Label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm font-mono">brivio.co/</div>
                        <Input
                            value={workspace.slug}
                            onChange={e => setWorkspace({ ...workspace, slug: e.target.value })}
                            className="bg-bg-0 border-bg-3 pl-[75px] font-mono"
                            placeholder="meu-studio"
                        />
                    </div>
                </div>

                <div className="pt-8 flex justify-end">
                    <Button onClick={onSave} disabled={isSaving} className="bg-accent-indigo hover:bg-accent-indigo/90">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Alterações"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function NotificationsModule() {
    return (
        <div className="flex flex-col">
            <div className="p-8 border-b border-bg-2">
                <h3 className="text-xl font-bold mb-1">Notificações</h3>
                <p className="text-text-secondary text-sm">Controle como e quando você recebe atualizações.</p>
            </div>

            <div className="p-8 space-y-6">
                {[
                    { title: "Novos Comentários", desc: "Sempre que alguém comentar nos seus projetos publicados." },
                    { title: "Novas Curtidas", desc: "Receba um aviso quando seu trabalho for apreciado." },
                    { title: "Seguidores", desc: "Saiba quando um novo criador começar a seguir você." },
                    { title: "Mensagens", desc: "Notificações de novas mensagens diretas de potenciais clientes." },
                    { title: "Atualizações de Sistema", desc: "Novas funcionalidades e notícias da Brivio°." }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl hover:bg-bg-2/30 transition-all">
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm">{item.title}</span>
                            <span className="text-xs text-text-tertiary">{item.desc}</span>
                        </div>
                        <div className="w-12 h-6 rounded-full bg-accent-indigo relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ServicesModule({ services, onAdd, onEdit, onDelete }: any) {
    return (
        <div className="flex flex-col">
            <div className="p-8 border-b border-bg-2 flex items-center justify-between bg-bg-1/50">
                <div>
                    <h3 className="text-xl font-bold mb-1">Serviços Criativos</h3>
                    <p className="text-text-secondary text-sm">Gerencie o que você oferece aos seus clientes.</p>
                </div>
                <Button
                    onClick={onAdd}
                    className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-full px-6 flex items-center gap-2 font-bold shadow-lg shadow-accent-indigo/20 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4" />
                    Novo Serviço
                </Button>
            </div>

            <div className="p-8">
                {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-bg-3 rounded-[32px] bg-bg-2/20">
                        <div className="w-16 h-16 rounded-full bg-bg-3 flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h4 className="text-lg font-bold mb-2">Ainda não tem serviços?</h4>
                        <p className="text-text-secondary text-sm max-w-[320px] mb-8 leading-relaxed">
                            Crie o seu primeiro serviço para aparecer no seu perfil e começar a receber pedidos de trabalho.
                        </p>
                        <Button
                            onClick={onAdd}
                            variant="outline"
                            className="border-bg-3 hover:bg-bg-3 hover:text-text-primary rounded-full px-8 font-bold"
                        >
                            Começar agora
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service: any) => (
                            <div
                                key={service.id}
                                className="bg-bg-0 border border-bg-3 rounded-[32px] p-8 flex flex-col group hover:border-accent-indigo/30 transition-all duration-500 relative overflow-hidden h-full"
                            >
                                <div className={cn("absolute inset-0 opacity-10 group-hover:opacity-20 transition-all duration-500 bg-gradient-to-br", service.image)} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <h4 className="text-xl font-bold text-text-primary group-hover:text-accent-indigo transition-colors">{service.title}</h4>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <button
                                                onClick={() => onEdit(service)}
                                                className="p-2 bg-bg-2 hover:bg-bg-3 rounded-full text-text-secondary hover:text-text-primary transition-all border border-bg-3"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(service.id)}
                                                className="p-2 bg-bg-2 hover:bg-red-500/10 rounded-full text-text-secondary hover:text-red-500 transition-all border border-bg-3"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-text-secondary mb-8 line-clamp-3 leading-relaxed">
                                        {service.description}
                                    </p>

                                    <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-bg-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Preço</span>
                                            <span className="text-sm font-black text-text-primary">{service.price}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Entrega</span>
                                            <span className="text-sm font-black text-text-primary">{service.delivery}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function TeamModule({ initialData: _initialData }: any) {
    // ... rest of file (keeps previous content)
    return (
        <div className="flex flex-col">
            <div className="p-8 border-b border-bg-2">
                <h3 className="text-xl font-bold mb-1">Equipa & Colaboração</h3>
                <p className="text-text-secondary text-sm">Convide parceiros e gerencie permissões de acesso.</p>
            </div>

            <div className="p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-bg-3 rounded-2xl bg-bg-1/50">
                    <div className="w-16 h-16 rounded-full bg-bg-3 flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <h4 className="font-bold mb-2">Trabalhe em Conjunto</h4>
                    <p className="text-text-secondary text-sm max-w-[300px] mb-6">
                        A funcionalidade de equipas permite que você adicione colaboradores aos seus projetos.
                    </p>
                    <Button className="bg-text-primary text-bg-1 hover:scale-105 transition-all">
                        Upgrade para Equipa
                    </Button>
                </div>
            </div>
        </div>
    )
}
