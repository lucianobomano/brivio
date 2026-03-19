import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthLayoutInner } from "@/components/layout/AuthLayoutInner"
import { TemplateSelectorPOC } from "@/components/proposals/builder/templates/TemplateSelector"

export default async function TemplatePOCPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url,
        role: "Creative Director"
    }

    return (
        <AuthLayoutInner user={userData} showSidebar={false}>
            <TemplateSelectorPOC />
        </AuthLayoutInner>
    )
}
