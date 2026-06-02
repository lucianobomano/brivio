import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/app/actions/admin"
import { AdminClient } from "./AdminClient"

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { isAdmin, role } = await checkIsAdmin(user.email)
    
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 space-y-4">
                <h1 className="text-2xl font-bold text-red-500">Acesso Negado</h1>
                <p>O seu e-mail <strong>{user.email}</strong> não tem permissões de administrador.</p>
                <p className="text-sm text-text-tertiary">Se acredita que isto é um erro, por favor contacte o administrador do sistema para solicitar acesso a esta área.</p>
                <a href="/dashboard" className="mt-4 px-6 py-2 bg-white text-black rounded-lg font-bold">Voltar ao Dashboard</a>
            </div>
        )
    }

    return <AdminClient userEmail={user.email || ''} role={role || 'admin'} />
}
