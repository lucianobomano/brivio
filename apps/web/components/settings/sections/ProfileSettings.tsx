"use client"

import * as React from "react"
import { User, Camera, Mail, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserProfile, updateProfile } from "@/app/actions/settings"
import { toast } from "sonner"

interface ProfileSettingsProps {
    user: UserProfile | null
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
    const [isSaving, setIsSaving] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: user?.name || "",
        bio: user?.bio || "",
        avatar_url: user?.avatar_url || ""
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const result = await updateProfile(formData)
            if (result.success) {
                toast.success("Perfil atualizado com sucesso")
            } else {
                toast.error(result.error || "Erro ao atualizar perfil")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-10">
            <div>
                <h3 className="text-2xl font-black text-white mb-2">O Meu Perfil</h3>
                <p className="text-text-secondary">Gere a tua identidade pública e informações de contacto.</p>
            </div>

            {/* Avatar Upload */}
            <div className="flex items-center gap-8 p-6 bg-bg-2 rounded-2xl border border-bg-3">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-accent-indigo flex items-center justify-center text-3xl text-white font-black overflow-hidden border-4 border-bg-1 shadow-xl">
                        {formData.avatar_url ? (
                            <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span>{formData.name.substring(0, 2).toUpperCase()}</span>
                        )}
                    </div>
                    <button type="button" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Camera className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-white">Foto de Perfil</h4>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-[300px]">
                        Recomendamos uma imagem quadrada de pelo menos 400x400px.
                    </p>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-bg-3 hover:bg-bg-3">
                            Alterar Foto
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10">
                            Remover
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Nome Completo</Label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl focus:ring-accent-indigo/20 text-white font-medium"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Email (Privado)</Label>
                    <div className="relative opacity-60">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40" />
                        <Input
                            value={user?.email || ""}
                            disabled
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Bio / Descrição</Label>
                <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Conta um pouco sobre ti..."
                    className="bg-bg-2 border-bg-3 min-h-[120px] rounded-xl p-4 focus:ring-accent-indigo/20 text-white font-medium leading-relaxed"
                />
            </div>

            <div className="flex justify-end pt-6 border-t border-bg-3">
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="h-12 px-8 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-full font-bold shadow-lg shadow-accent-indigo/20 active:scale-95 transition-all"
                >
                    {isSaving ? "A guardar..." : "Guardar Alterações"}
                </Button>
            </div>
        </form>
    )
}
