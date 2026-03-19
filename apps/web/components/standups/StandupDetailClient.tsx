"use client"

import React, { useState } from 'react';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Smile,
    Meh,
    Frown,
    Send,
    ChevronLeft,
    ChevronRight,
    Flame,
    ThumbsUp,
    MessageSquare,
    Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
// import { StandupHeader } from './StandupHeader'; // Assuming this component exists or is self-contained. Previous view showed usage but not import source. Ah, it was imported.
// Keeping original imports
import { StandupHeader } from './StandupHeader';
import { submitStandupUpdate } from '@/app/actions/standups';
import { toast } from "sonner"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import Link from "next/link"

interface StandupDetailClientProps {
    initialStandup: any; // Type strictly if possible, using 'any' for speed as types are server-side inferred
    currentUser: any;
}

export function StandupDetailClient({ initialStandup, currentUser }: StandupDetailClientProps) {
    // Determine if user has submitted today
    const todayStr = new Date().toDateString();
    const existingUpdate = initialStandup.updates.find((u: any) =>
        new Date(u.created_at).toDateString() === todayStr && u.user.id === currentUser.id
    );

    const [hasSubmittedToday, setHasSubmittedToday] = useState(!!existingUpdate);
    const [mood, setMood] = useState<string | null>(null);
    const [blockers, setBlockers] = useState("");
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Parse questions if they are stored as JSON strings or arrays
    const questions = Array.isArray(initialStandup.questions) ? initialStandup.questions : [];

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    const handleSubmit = async () => {
        if (!mood) {
            toast.error("Por favor, seleciona como te sentes hoje.");
            return;
        }

        setSubmitting(true);

        const content = questions.map((q: string, idx: number) => ({
            question: q,
            answer: answers[idx] || ""
        }));

        const result = await submitStandupUpdate(initialStandup.id, {
            content,
            mood,
            blockers
        });

        if (result.success) {
            toast.success("Stand-up submetido com sucesso!");
            setHasSubmittedToday(true);
            window.location.reload(); // Simple reload to refresh data
        } else {
            toast.error("Erro ao submeter: " + result.error);
        }
        setSubmitting(false);
    };

    const teamUpdates = initialStandup.updates.map((u: any) => ({
        id: u.id,
        user: {
            name: u.user.name,
            role: u.user.role || 'Member',
            avatar: u.user.avatar || u.user.name.charAt(0),
            color: 'bg-emerald-500/10 text-emerald-500' // Dynamic color logic can be added later
        },
        time: format(new Date(u.created_at), 'HH:mm'),
        mood: u.mood,
        questions: u.content || [], // Assuming content is array of {question, answer}
        blockers: u.blockers,
        kudos: u.kudos
    }));

    return (
        <div className="flex flex-col min-h-screen font-sans text-white">
            <StandupHeader />

            {/* ===== STANDUP CONTENT ===== */}
            <div className="max-w-[1520px] mx-auto w-full p-8 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* PAGE TITLE */}
                <div className="lg:col-span-3 mb-4">
                    <Link href="/standups" className="inline-flex items-center gap-2 text-[#97A1B3] hover:text-white transition-colors mb-6 text-sm font-bold tracking-wide group">
                        <div className="p-1.5 rounded-lg bg-[#15161B] border border-[#373737]/50 group-hover:border-[#97A1B3]/30 transition-colors">
                            <ChevronLeft size={16} />
                        </div>
                        Voltar
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                                {initialStandup.name}
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20">Live</span>
                            </h1>
                            <p className="text-[#97A1B3] text-sm mt-2 flex items-center gap-2 font-medium capitalize">
                                <CalendarIcon size={14} className="text-[#97A1B3]/70" /> {format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-orange-500/5 text-orange-400 px-5 py-2.5 rounded-full border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                            <Flame size={18} className="fill-orange-500 text-orange-500 animate-pulse" />
                            <span className="font-bold text-sm tracking-wide">12 Dias de Streak!</span>
                        </div>
                    </div>
                </div>

                {/* COLUNA ESQUERDA: O Meu Check-in ou Resumo */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Cartão de Check-in */}
                    {!hasSubmittedToday ? (
                        <div className="bg-[#15161B] rounded-[12px] shadow-xl border border-[#373737]/50 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#EF0050] group-hover:bg-[#FF0054] transition-colors"></div>
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">O teu Check-in de hoje</h2>
                                        <p className="text-sm text-[#97A1B3]">Partilha as tuas vitórias e focos.</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#97A1B3]/60 bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-[#373737]/30 uppercase tracking-wider">~2 min</span>
                                </div>

                                <div className="space-y-8">
                                    {questions.map((q: string, idx: number) => (
                                        <div key={idx}>
                                            <label className="block text-sm font-bold text-[#97A1B3] mb-3 flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-[#25262B] flex items-center justify-center text-white text-xs font-black border border-[#373737]">{idx + 1}</div>
                                                {q}
                                            </label>
                                            <textarea
                                                className="w-full bg-[#0F1014] border border-[#373737]/50 rounded-[16px] p-4 text-sm text-white placeholder:text-[#97A1B3]/30 focus:ring-2 focus:ring-[#EF0050]/50 focus:border-[#EF0050]/50 outline-none min-h-[100px] transition-all resize-none"
                                                placeholder="Responde aqui..."
                                                value={answers[idx] || ""}
                                                onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                            ></textarea>
                                        </div>
                                    ))}

                                    {/* Pergunta Bloqueios (Static for now) */}
                                    <div className="bg-red-500/5 p-5 rounded-[16px] border border-red-500/10 hover:border-red-500/20 transition-colors">
                                        <label className="block text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            Algum impedimento/bloqueio?
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#0F1014] border border-red-500/20 rounded-[12px] p-3 text-sm text-white focus:ring-2 focus:ring-red-500/30 outline-none placeholder:text-red-500/20"
                                            placeholder="Se nada te impede, deixa em branco."
                                            value={blockers}
                                            onChange={(e) => setBlockers(e.target.value)}
                                        />
                                    </div>

                                    {/* Humor */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#97A1B3] mb-4 text-center">Como te sentes hoje?</label>
                                        <div className="flex justify-center gap-6">
                                            <button
                                                onClick={() => setMood('bad')}
                                                className={cn(
                                                    "p-4 rounded-[20px] transition-all border",
                                                    mood === 'bad'
                                                        ? "bg-red-500/10 border-red-500/50 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                                        : "bg-[#0F1014] border-[#373737]/50 hover:bg-[#25262B] hover:border-[#97A1B3]/30"
                                                )}
                                            >
                                                <Frown size={28} className={mood === 'bad' ? 'text-red-500' : 'text-[#97A1B3]'} />
                                            </button>
                                            <button
                                                onClick={() => setMood('neutral')}
                                                className={cn(
                                                    "p-4 rounded-[20px] transition-all border",
                                                    mood === 'neutral'
                                                        ? "bg-yellow-500/10 border-yellow-500/50 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                                                        : "bg-[#0F1014] border-[#373737]/50 hover:bg-[#25262B] hover:border-[#97A1B3]/30"
                                                )}
                                            >
                                                <Meh size={28} className={mood === 'neutral' ? 'text-yellow-500' : 'text-[#97A1B3]'} />
                                            </button>
                                            <button
                                                onClick={() => setMood('happy')}
                                                className={cn(
                                                    "p-4 rounded-[20px] transition-all border",
                                                    mood === 'happy'
                                                        ? "bg-emerald-500/10 border-emerald-500/50 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                        : "bg-[#0F1014] border-[#373737]/50 hover:bg-[#25262B] hover:border-[#97A1B3]/30"
                                                )}
                                            >
                                                <Smile size={28} className={mood === 'happy' ? 'text-emerald-500' : 'text-[#97A1B3]'} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-6 border-t border-[#373737]/30 flex justify-end">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="bg-[#EF0050] hover:bg-[#FF0054] text-white px-8 h-12 rounded-[14px] font-bold text-sm tracking-wide flex items-center gap-2.5 shadow-lg shadow-[#EF0050]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        {submitting ? 'A enviar...' : (
                                            <>
                                                <Send size={16} strokeWidth={2.5} />
                                                Publicar Update
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Estado: Já Submetido
                        <div className="bg-gradient-to-br from-[#15161B] to-[#0F1014] border border-[#373737]/50 rounded-[12px] p-8 relative overflow-hidden mb-8 flex items-center justify-between group">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent opacity-50"></div>
                            <div className="z-10">
                                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                    <div className="bg-emerald-500/10 p-2 rounded-full">
                                        <CheckCircle2 className="text-emerald-400 w-6 h-6" />
                                    </div>
                                    Estás pronto para hoje!
                                </h2>
                                <p className="text-[#97A1B3] text-sm mt-2 ml-14">O teu update foi partilhado com a equipa.</p>
                            </div>
                            <button
                                // onClick={() => setHasSubmittedToday(false)} // Edit not implemented yet
                                className="text-xs font-bold text-[#97A1B3] hover:text-white uppercase tracking-wider underline decoration-[#373737] hover:decoration-white underline-offset-4 transition-all z-10"
                            >
                                {/* Editar */}
                            </button>
                        </div>
                    )}

                    {/* Feed da Equipa */}
                    <div>
                        <h3 className="text-xs font-black text-[#97A1B3]/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                            Updates da Equipa
                            <div className="h-[1px] flex-1 bg-[#373737]/30"></div>
                        </h3>

                        {teamUpdates.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">Nenhum update ainda hoje.</p>
                        ) : (
                            <div className="space-y-5">
                                {teamUpdates.map((update: any) => (
                                    <div key={update.id} className="bg-[#15161B] rounded-[12px] border border-[#373737]/50 p-6 hover:border-[#97A1B3]/20 transition-colors group">
                                        {/* Cabeçalho do Cartão */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center font-bold text-sm border border-white/5", update.user.color)}>
                                                    {update.user.avatar && update.user.avatar.startsWith('http')
                                                        ? <img src={update.user.avatar} alt={update.user.name} className="w-full h-full object-cover rounded-[14px]" />
                                                        : update.user.avatar
                                                    }
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-base">{update.user.name}</h4>
                                                    <p className="text-xs text-[#97A1B3] font-medium mt-0.5">{update.user.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Indicador de Humor */}
                                                <div className={cn("p-2 rounded-xl border border-white/5",
                                                    update.mood === 'happy' ? "bg-emerald-500/10 text-emerald-500" :
                                                        update.mood === 'neutral' ? "bg-yellow-500/10 text-yellow-500" : "bg-[#25262B] text-[#97A1B3]"
                                                )}>
                                                    {update.mood === 'happy' && <Smile size={18} />}
                                                    {update.mood === 'neutral' && <Meh size={18} />}
                                                    {update.mood === 'bad' && <Frown size={18} />}
                                                </div>
                                                <span className="text-xs text-[#97A1B3]/60 font-mono bg-[#0F1014] px-2 py-1 rounded-md border border-[#373737]/30">{update.time}</span>
                                            </div>
                                        </div>

                                        {/* Conteúdo: Questions & Answers */}
                                        <div className="pl-[60px] relative space-y-4">
                                            {/* Linha vertical conectora visual */}
                                            <div className="absolute left-[22px] top-0 bottom-0 w-[2px] bg-[#373737]/30"></div>

                                            {update.questions.map((qa: any, i: number) => (
                                                <div key={i} className="relative">
                                                    <h5 className="text-[10px] font-black text-[#97A1B3]/60 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                        {i === 0 && <CheckCircle2 size={12} className="text-[#97A1B3]" />}
                                                        {i === 1 && <Clock size={12} className="text-[#EF0050]" />}
                                                        {qa.question}
                                                    </h5>
                                                    <p className="text-sm text-white font-medium leading-relaxed">{qa.answer}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Bloqueios (Se existirem) */}
                                        {update.blockers && (
                                            <div className="mt-6 ml-[60px] bg-red-500/5 border border-red-500/10 rounded-[12px] p-4 flex items-start gap-3">
                                                <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="text-xs font-black text-red-400 block mb-1 uppercase tracking-wider">Bloqueio Identificado</span>
                                                    <p className="text-sm text-red-300/80 leading-relaxed">{update.blockers}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Ações Sociais */}
                                        <div className="mt-6 pt-4 ml-[60px] border-t border-[#373737]/30 flex items-center gap-5">
                                            <button className="text-xs font-bold text-[#97A1B3] hover:text-white flex items-center gap-2 transition-colors group/btn">
                                                <ThumbsUp size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                Dar Kudos <span className="text-[#97A1B3]/50">({update.kudos})</span>
                                            </button>
                                            <button className="text-xs font-bold text-[#97A1B3] hover:text-white flex items-center gap-2 transition-colors group/btn">
                                                <MessageSquare size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                Comentar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* COLUNA DIREITA: Stats e Navegação */}
                <div className="space-y-6">

                    {/* Calendário Mini */}
                    <div className="bg-[#15161B] rounded-[12px] shadow-lg border border-[#373737]/50 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white text-sm">Histórico</h3>
                            <div className="flex gap-1">
                                <button className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#97A1B3] hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                                <button className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#97A1B3] hover:text-white transition-colors"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                        {/* Simulação de dias */}
                        <div className="grid grid-cols-7 gap-2 text-center text-xs">
                            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
                                <span key={i} className="text-[#97A1B3]/40 font-bold py-1">{d}</span>
                            ))}

                            <span className="py-2"></span>
                            <span className="py-2"></span>
                            {/* Simple placeholders, would be dynamic in full implementation */}
                            <div className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-full font-bold cursor-pointer mx-auto border border-emerald-500/20">22</div>
                            <div className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full font-black shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer mx-auto">{new Date().getDate()}</div>
                        </div>
                    </div>

                    {/* Quem falta? */}
                    <div className="bg-[#15161B] rounded-[12px] shadow-lg border border-[#373737]/50 p-6">
                        <h3 className="font-bold text-white text-sm mb-5">Ainda falta responder</h3>
                        <div className="space-y-4">
                            {initialStandup.team?.members
                                ?.filter((m: any) => !initialStandup.updates.some((u: any) => u.user.id === m.user.id))
                                .map((m: any) => (
                                    <div key={m.user.id} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="w-9 h-9 rounded-full bg-[#25262B] flex items-center justify-center text-[10px] font-black text-[#97A1B3] border border-[#373737] overflow-hidden">
                                            {m.user.avatar_url ? <img src={m.user.avatar_url} alt={m.user.name} className="w-full h-full object-cover" /> : m.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="text-sm text-white font-medium block">{m.user.name}</span>
                                            <span className="text-[10px] text-[#97A1B3] uppercase tracking-wide">Member</span>
                                        </div>
                                    </div>
                                ))
                            }
                            {/* Fallback if all answered */}
                            {(!initialStandup.team?.members || initialStandup.team.members.every((m: any) => initialStandup.updates.some((u: any) => u.user.id === m.user.id))) && (
                                <p className="text-sm text-[#97A1B3] italic">Todos responderam!</p>
                            )}
                        </div>
                        {/* Button only if someone is missing */}
                        {(initialStandup.team?.members && !initialStandup.team.members.every((m: any) => initialStandup.updates.some((u: any) => u.user.id === m.user.id))) &&
                            <button className="mt-6 w-full py-3 text-xs font-black uppercase tracking-widest text-[#97A1B3] bg-[#0F1014] border border-[#373737]/50 rounded-[12px] hover:bg-[#25262B] hover:text-white transition-all">
                                Enviar Lembrete
                            </button>
                        }
                    </div>

                    {/* Mood da Equipa (Analytics Simples) */}
                    <div className="bg-gradient-to-br from-[#1E1F25] to-[#15161B] rounded-[12px] shadow-lg border border-[#373737]/50 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <Flame size={40} className="text-indigo-500" />
                        </div>
                        <h3 className="font-bold text-white text-sm mb-1 opacity-90">Vibe da Equipa</h3>
                        <p className="text-[11px] text-[#97A1B3] mb-6">Baseado nos check-ins desta semana</p>

                        <div className="flex items-end gap-3 h-28 mb-4 px-2">
                            <div className="flex-1 bg-white/10 rounded-t-[6px] h-[60%] relative group hover:bg-white/20 transition-colors">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">Segunda</div>
                            </div>
                            <div className="flex-1 bg-white/20 rounded-t-[6px] h-[80%] relative group hover:bg-white/30 transition-colors">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">Terça</div>
                            </div>
                            <div className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-[6px] h-[90%] relative group shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">Hoje</div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-medium border-t border-white/5 pt-3">
                            <span className="text-[#97A1B3]">Energia Alta ⚡</span>
                            <span className="text-white font-bold">85%</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
