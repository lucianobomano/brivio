import Link from "next/link"
import { FolderKanban, Home } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-bg-0 text-text-primary flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-6 shadow-sm">
                <span className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-200">404</span>
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">
                Página não encontrada
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
                O endereço acessado não existe ou foi movido.
            </p>

            <div className="flex items-center gap-3">
                <Link
                    href="/projects"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Voltar para Projectos</span>
                </Link>

                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                    <Home className="w-3.5 h-3.5" />
                    <span>Ir para o Dashboard</span>
                </Link>
            </div>
        </div>
    )
}
