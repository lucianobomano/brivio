"use client"

import * as React from "react"
import { Building, Hash, MapPin, Globe, CreditCard, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WorkspaceSettings, updateWorkspaceSettings } from "@/app/actions/settings"
import { toast } from "sonner"
import { useWorkspace } from "@/components/providers/WorkspaceProvider"

interface WorkspaceGeneralSettingsProps {
    workspace: WorkspaceSettings | null
}

export function WorkspaceGeneralSettings({ workspace }: WorkspaceGeneralSettingsProps) {
    const { refreshWorkspace } = useWorkspace()
    const [isSaving, setIsSaving] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: workspace?.name || "",
        legal_name: workspace?.legal_name || "",
        tax_id: workspace?.tax_id || "",
        fiscal_address: workspace?.fiscal_address || "",
        website: workspace?.website || "",
        default_currency: workspace?.default_currency || "EUR",
        language: workspace?.language || "pt"
    })

    React.useEffect(() => {
        if (workspace) {
            setFormData({
                name: workspace.name || "",
                legal_name: workspace.legal_name || "",
                tax_id: workspace.tax_id || "",
                fiscal_address: workspace.fiscal_address || "",
                website: workspace.website || "",
                default_currency: workspace.default_currency || "EUR",
                language: workspace.language || "pt"
            })
        }
    }, [workspace])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!workspace?.id) return

        setIsSaving(true)
        try {
            const result = await updateWorkspaceSettings(workspace.id, formData)
            if (result.success) {
                toast.success("Definições da empresa atualizadas")
                await refreshWorkspace()
            } else {
                toast.error(result.error || "Erro ao atualizar definições")
            }
        } catch {
            toast.error("Erro inesperado")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-10">
            <div>
                <h3 className="text-2xl font-black text-white mb-2">Geral da Empresa</h3>
                <p className="text-text-secondary">Configura os dados legais e operacionais da tua organização.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Nome Comercial</Label>
                    <div className="relative group">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Nome Legal / Razão Social</Label>
                    <div className="relative group">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={formData.legal_name}
                            onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">NIF / CNPJ / Tax ID</Label>
                    <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={formData.tax_id}
                            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Website</Label>
                    <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                        <Input
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://"
                            className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Endereço Fiscal</Label>
                <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 group-focus-within:text-accent-indigo transition-colors" />
                    <Input
                        value={formData.fiscal_address}
                        onChange={(e) => setFormData({ ...formData, fiscal_address: e.target.value })}
                        className="bg-bg-2 border-bg-3 h-12 pl-12 rounded-xl text-white font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Moeda Padrão</Label>
                    <Select
                        value={formData.default_currency}
                        onValueChange={(v) => setFormData({ ...formData, default_currency: v })}
                    >
                        <SelectTrigger className="bg-bg-2 border-bg-3 h-12 rounded-xl text-white font-medium">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-text-secondary/40" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-bg-2 border-bg-3 text-white">
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            <SelectItem value="AOA">Kwanza (AOA)</SelectItem>
                            <SelectItem value="MZN">Metical (MZN)</SelectItem>
                            <SelectItem value="BRL">Real (BRL)</SelectItem>
                            <SelectItem value="USD">Dólar (USD)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">Idioma Principal</Label>
                    <Select
                        value={formData.language}
                        onValueChange={(v) => setFormData({ ...formData, language: v })}
                    >
                        <SelectTrigger className="bg-bg-2 border-bg-3 h-12 rounded-xl text-white font-medium">
                            <div className="flex items-center gap-3">
                                <Languages className="w-4 h-4 text-text-secondary/40" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-bg-2 border-bg-3 text-white">
                            <SelectItem value="pt">Português (PT/BR)</SelectItem>
                            <SelectItem value="en">English (US/UK)</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
