"use client"

import * as React from "react"
import { Palette, Upload, Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorkspaceSettings, updateWorkspaceSettings } from "@/app/actions/settings"
import { toast } from "sonner"

interface BrandingSettingsProps {
    workspace: WorkspaceSettings | null
}

export function BrandingSettings({ workspace }: BrandingSettingsProps) {
    const [isSaving, setIsSaving] = React.useState(false)
    const [formData, setFormData] = React.useState({
        logo_url: workspace?.logo_url || "",
        logo_dark_url: workspace?.logo_dark_url || "",
        favicon_url: workspace?.favicon_url || "",
        primary_color: workspace?.primary_color || "#3b82f6"
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!workspace?.id) return

        setIsSaving(true)
        try {
            const result = await updateWorkspaceSettings(workspace.id, formData)
            if (result.success) {
                toast.success("Branding atualizado")
            } else {
                toast.error(result.error || "Erro ao atualizar branding")
            }
        } catch (err) {
            toast.error("Erro inesperado")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-10">
            <div>
                <h3 className="text-2xl font-black text-white mb-2">Branding (Brand Kit)</h3>
                <p className="text-text-secondary">Personaliza a aparência das tuas propostas e plataforma.</p>
            </div>

            {/* Logo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Light */}
                <div className="p-6 bg-white/[0.02] border border-bg-3 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Logótipo (Claro)</Label>
                        <Sun className="w-4 h-4 text-text-secondary/40" />
                    </div>
                    <div className="h-40 bg-white/5 rounded-xl border border-dashed border-bg-3 flex flex-col items-center justify-center gap-2 group transition-all hover:bg-white/10 hover:border-accent-indigo/40 cursor-pointer">
                        {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo Light" className="max-h-16 object-contain" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-text-secondary/20" />
                                <span className="text-[10px] font-bold text-text-secondary/40">Upload SVG/PNG</span>
                            </>
                        )}
                    </div>
                    <Input
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="URL da imagem..."
                        className="bg-bg-2 border-bg-3 h-10 text-xs text-white"
                    />
                </div>

                {/* Logo Dark */}
                <div className="p-6 bg-white/[0.02] border border-bg-3 rounded-2xl space-y-4 text-white">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Logótipo (Escuro)</Label>
                        <Moon className="w-4 h-4 text-text-secondary/40" />
                    </div>
                    <div className="h-40 bg-black/40 rounded-xl border border-dashed border-bg-3 flex flex-col items-center justify-center gap-2 group transition-all hover:bg-black/60 hover:border-accent-indigo/40 cursor-pointer">
                        {formData.logo_dark_url ? (
                            <img src={formData.logo_dark_url} alt="Logo Dark" className="max-h-16 object-contain" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-text-secondary/20" />
                                <span className="text-[10px] font-bold text-text-secondary/40">Upload SVG/PNG</span>
                            </>
                        )}
                    </div>
                    <Input
                        value={formData.logo_dark_url}
                        onChange={(e) => setFormData({ ...formData, logo_dark_url: e.target.value })}
                        placeholder="URL da imagem..."
                        className="bg-bg-2 border-bg-3 h-10 text-xs text-white"
                    />
                </div>
            </div>

            {/* Colors */}
            <div className="p-8 bg-bg-2 rounded-2xl border border-bg-3 space-y-6">
                <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-accent-indigo" />
                    <h4 className="font-bold text-white">Identidade Visual</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Cor Primária (HEX)</Label>
                        <div className="flex gap-4">
                            <div
                                className="w-12 h-12 rounded-xl border-2 border-bg-1 shadow-xl"
                                style={{ backgroundColor: formData.primary_color }}
                            />
                            <Input
                                value={formData.primary_color}
                                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                className="bg-bg-1 border-bg-3 h-12 rounded-xl text-white font-mono uppercase"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Favicon</Label>
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-bg-1 rounded-xl border border-bg-3 flex items-center justify-center">
                                {formData.favicon_url ? (
                                    <img src={formData.favicon_url} alt="Favicon" className="w-6 h-6" />
                                ) : (
                                    <Monitor className="w-5 h-5 text-text-secondary/20" />
                                )}
                            </div>
                            <Input
                                value={formData.favicon_url}
                                onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                                placeholder="URL do favicon (.ico, .png)"
                                className="bg-bg-1 border-bg-3 h-12 flex-1 rounded-xl text-white text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-bg-3">
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="h-12 px-8 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-full font-bold shadow-lg shadow-accent-indigo/20 active:scale-95 transition-all"
                >
                    {isSaving ? "A guardar..." : "Guardar Kit de Marca"}
                </Button>
            </div>
        </form>
    )
}
