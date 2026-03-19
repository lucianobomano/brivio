"use client"

import * as React from "react"
import { X, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SettingsSidebar } from "./SettingsSidebar"
import { UserProfile, getUserData } from "@/app/actions/settings"

import { ProfileSettings } from "./sections/ProfileSettings"
import { SecuritySettings } from "./sections/SecuritySettings"
import { NotificationSettings } from "./sections/NotificationSettings"
import { WorkspaceGeneralSettings } from "./sections/WorkspaceGeneralSettings"
import { BrandingSettings } from "./sections/BrandingSettings"
import { MembersSettings } from "./sections/MembersSettings"
import { BillingSettings } from "./sections/BillingSettings"
import { CustomDomainSettings } from "./sections/CustomDomainSettings"
import { IntegrationSettings } from "./sections/IntegrationSettings"
import { SMTPSettings } from "./sections/SMTPSettings"

import { useWorkspace } from "@/components/providers/WorkspaceProvider"

interface GlobalSettingsViewProps {
    isOpen: boolean
    onClose: () => void
    initialTab?: string
}

export function GlobalSettingsView({ isOpen, onClose, initialTab = "profile" }: GlobalSettingsViewProps) {
    const { workspace: workspaceData } = useWorkspace()
    const [activeTab, setActiveTab] = React.useState(initialTab)
    const [userData, setUserData] = React.useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        if (isOpen) {
            fetchData()
        }
    }, [isOpen])

    async function fetchData() {
        setIsLoading(true)
        try {
            const u = await getUserData()
            setUserData(u)
        } catch (error) {
            console.error("Error fetching settings data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "relative w-[80%] h-full bg-bg-1 border-l border-bg-3 shadow-2xl flex flex-col",
                    "animate-in slide-in-from-right duration-500 ease-out"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-bg-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Definições Globais</h2>
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider opacity-60">Configura o teu ecossistema Brivio</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-bg-3 transition-all active:scale-90"
                    >
                        <X className="w-6 h-6 text-text-secondary" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-[300px] border-r border-bg-3 bg-bg-2 overflow-y-auto custom-scrollbar">
                        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-bg-1 p-12 custom-scrollbar">
                        <div className="max-w-[800px] mx-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-indigo"></div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {renderContent()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    function renderContent() {
        switch (activeTab) {
            case "profile": return <ProfileSettings user={userData} />
            case "security": return <SecuritySettings />
            case "notifications": return <NotificationSettings user={userData} />
            case "workspace_general": return <WorkspaceGeneralSettings workspace={workspaceData} />
            case "branding": return <BrandingSettings workspace={workspaceData} />
            case "members": return <MembersSettings />
            case "billing": return <BillingSettings />
            case "domain": return <CustomDomainSettings workspace={workspaceData} />
            case "integrations": return <IntegrationSettings />
            case "smtp": return <SMTPSettings workspace={workspaceData} />
            default: return null
        }
    }
}
