"use client"

import React, { useState } from 'react';
import { StandupHeader } from './StandupHeader';
import { Plus, ArrowRight, MoreVertical, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { CreateStandupModal } from './CreateStandupModal';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Mock data for standups
const STANDUPS = [
    {
        id: "001",
        name: "Nome da Equipa",
        subtitle: "Diariamente Stand-ups",
        // Blue/Cyan waves approximation
        gradient: "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500",
        image: null,
        members: [1, 2, 3]
    },
    {
        id: "002",
        name: "Nome da Equipa",
        subtitle: "Diariamente Stand-ups",
        // Dark abstract curves (Black/Dark Orange)
        gradient: "bg-gradient-to-br from-black via-zinc-900 to-orange-900",
        members: [1, 2, 3]
    },
    {
        id: "003",
        name: "Nome da Equipa",
        subtitle: "Diariamente Stand-ups",
        // Purple/Blue abstract
        gradient: "bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900",
        members: [1, 2, 3]
    }
];

interface Standup {
    id: string;
    name: string;
    subtitle: string;
    gradient: string;
    coverUrl?: string; // Added optional coverUrl
    members: any[]; // refined type later
}

/** Stand-ups shown per page, next to the «Novo Stand-up» card, so the cards always stay on one row */
function usePerPage() {
    const read = () => typeof window === 'undefined' ? 3 : window.innerWidth >= 1280 ? 3 : window.innerWidth >= 1024 ? 2 : 1
    const [n, setN] = useState(3)
    React.useEffect(() => {
        const update = () => setN(read())
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])
    return n
}

interface StandupListClientProps {
    workspaceId?: string;
    initialStandups?: Standup[];
}

export function StandupListClient({ workspaceId, initialStandups = [] }: StandupListClientProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingStandupId, setEditingStandupId] = useState<string | null>(null);

    // We can use optimistic updates or just rely on revalidatePath
    // For now simple router refresh handling via toast

    const handleEdit = (id: string, fullId: string) => {
        // We'll pass the full ID to the modal, which will fetch data
        setEditingStandupId(fullId || id);
        setIsCreateModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        // Import dynamically to avoid server component issues if any
        const { deleteStandup } = await import('@/app/actions/standups');
        const result = await deleteStandup(id);

        if (result.success) {
            // Toast or reload would happen here. 
            // Since we use server actions with revalidatePath, the page should refresh automatically if successful.
        } else {
            // Handle error
            console.error(result.error);
        }
    };

    const perPage = usePerPage();
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(initialStandups.length / perPage));
    // Keep the page valid when the list or the number per page changes
    React.useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages) }, [currentPage, totalPages]);
    const page = Math.min(currentPage, totalPages);
    const displayStandups = initialStandups.slice((page - 1) * perPage, page * perPage);
    // Cards follow the window height: the row and the pagination stay above the bottom toolbar
    const CARD = "w-full max-w-[372px] h-[clamp(320px,calc(100dvh_-_392px),585px)]";

    return (
        <div className="flex flex-col min-h-screen font-sans text-white bg-bg-0">
            <StandupHeader />

            <main className="flex-1 flex flex-col items-center px-10 pt-10 [@media(max-height:800px)]:pt-6 pb-[120px]">
                <div
                    className="w-full max-w-[1532px] grid gap-[12px] grid-cols-1 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
                    style={{ ['--cols' as string]: perPage + 1 } as React.CSSProperties}
                >
                    {/* New Stand-up Card */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className={cn(CARD, "rounded-[12px] relative group overflow-hidden transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl animate-liquid-gradient")}
                        style={{
                            background: "linear-gradient(135deg, #FF0054 0%, #88007F 33%, #06D6A0 66%, #311C99 100%)"
                        }}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                <Plus className="w-8 h-8 text-white" strokeWidth={3} />
                            </div>
                            <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Novo Stand-up</span>
                        </div>
                    </button>

                    {/* Existing Cards */}
                    <AnimatePresence mode="popLayout" initial={false}>
                    {displayStandups.map((standup) => (
                        <motion.div
                            key={`${page}-${standup.id}`}
                            initial={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className={cn(
                            CARD, "rounded-[12px] relative overflow-hidden flex flex-col justify-between p-6 xl:p-8 text-white transition-transform hover:translate-y-[-5px] shadow-2xl",
                            standup.gradient // keep gradient class as fallback or base
                        )}>
                            {/* Background Image or Gradient */}
                            {/* Background Image or Gradient */}
                            {standup.coverUrl && standup.coverUrl.includes('gradient') ? (
                                <div className="absolute inset-0 z-0" style={{ background: standup.coverUrl }} />
                            ) : standup.coverUrl ? (
                                <div className="absolute inset-0 z-0">
                                    <img loading="lazy" decoding="async" src={standup.coverUrl} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40" />
                                </div>
                            ) : (
                                <div className={cn("absolute inset-0 z-0", standup.gradient)} />
                            )}

                            <div className="absolute inset-0 bg-black/10 pointer-events-none z-10" />

                            {/* Top row */}
                            <div className="flex justify-between items-start relative z-10">
                                <ArrowRight className="w-8 h-8 opacity-80" strokeWidth={1.5} />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-40 p-1 rounded-xl bg-[#1A1B20] border border-[#313131] shadow-xl">
                                        <button
                                            onClick={() => handleEdit(standup.id, (standup as any).fullId)}
                                            className="w-full h-10 px-3 flex items-center gap-3 text-sm text-[#9CA3AF] hover:text-white hover:bg-[#313131] rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                            <span>Editar</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete((standup as any).fullId || standup.id, standup.name)}
                                            className="w-full h-10 px-3 flex items-center gap-3 text-sm text-[#FF0054] hover:bg-[#FF0054]/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            <span>Eliminar</span>
                                        </button>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Spacer to push content down */}
                            <div className="flex-1" />

                            {/* Bottom content */}
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-3">
                                    {/* Index and Button Row */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[clamp(44px,4.4vw,64px)] font-thin opacity-80 tracking-tighter drop-shadow-lg leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                                            {standup.id}
                                        </span>
                                        <Link href={`/standups/${(standup as any).fullId || standup.id}`}>
                                            <button className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-colors shrink-0">
                                                Visualizar
                                            </button>
                                        </Link>
                                    </div>

                                    <div className="h-[1px] w-full bg-gradient-to-r from-white/70 to-transparent" />

                                    <div>
                                        <h3 className="text-2xl font-bold tracking-tight leading-none drop-shadow-md">{standup.name}</h3>
                                        <p className="text-sm opacity-80 font-medium drop-shadow-sm mt-1">{standup.subtitle}</p>
                                    </div>
                                </div>

                                {/* Avatars */}
                                <div className="flex items-center -space-x-3">
                                    {standup.members.map((member: any, i: number) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white/20 bg-neutral-800 overflow-hidden relative shadow-lg">
                                            {/* If member is string (url), use img, else initials */}
                                            {typeof member === 'string' && member.startsWith('http') ? (
                                                <img loading="lazy" decoding="async" src={member} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <div className={`absolute inset-0 bg-gradient-to-br from-neutral-600 to-neutral-800`} />
                                                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/30">
                                                        {typeof member === 'string' ? member : `U${i}`}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>

                {/* Pagination: the same pill as the brands and projects pages */}
                {totalPages > 1 && (
                    <div className="mt-6 [@media(max-height:800px)]:mt-3 flex justify-center">
                        <div className="flex items-center gap-2 bg-white/5 dark:bg-[#16171C]/50 border border-white/10 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Página anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-1.5 px-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setCurrentPage(n)}
                                        className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all", n === page ? "bg-[#FF0054] text-white shadow-md shadow-[#FF0054]/20 scale-105" : "text-gray-400 hover:text-white hover:bg-white/5")}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Próxima página"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <CreateStandupModal
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                    setIsCreateModalOpen(open);
                    if (!open) setEditingStandupId(null);
                }}
                workspaceId={workspaceId}
                editingStandupId={editingStandupId}
            />
        </div>
    )
}
