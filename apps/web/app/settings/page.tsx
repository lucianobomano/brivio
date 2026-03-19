import { Navbar } from "@/components/layout/Navbar"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSettingsData } from "@/app/actions/get-settings"
import { SettingsClient } from "./SettingsClient"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const settingsData = await getSettingsData()

    // Get default workspace
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)

    const targetWorkspaceId = members?.[0]?.workspace_id

    const currentUserData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
    }

    return (
        <AuthLayoutInner user={currentUserData} showSidebar={false} workspaceId={targetWorkspaceId}>
            <div className="min-h-screen bg-bg-0 text-white flex flex-col">
                <Navbar />
                <main className="flex-1 w-full">
                    <div className="p-8 px-[55px]">
                        <header className="mb-12 pl-1">
                            <h1 className="text-[42px] font-bold tracking-tight text-white uppercase font-tight leading-none mb-4">
                                Definições
                            </h1>
                            <p className="text-text-secondary text-lg max-w-2xl">
                                Mantenha o seu perfil criativo e workspace actualizados para uma melhor experiência na Brivio°.
                            </p>
                        </header>

                        <SettingsClient initialData={settingsData} />
                    </div>
                </main>
            </div>
        </AuthLayoutInner>
    )
}
