"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { CreateTeamModal } from './CreateTeamModal';
import { getWorkspaceTeams, createStandup, getStandupById, updateStandup } from "@/app/actions/standups";
import { toast } from "sonner";

interface CreateStandupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId?: string;
    editingStandupId?: string | null;
}

type Step = 1 | 2 | 3;

interface Team {
    id: string;
    name: string;
    memberCount: number;
}

export function CreateStandupModal({ open, onOpenChange, workspaceId, editingStandupId }: CreateStandupModalProps) {
    const [step, setStep] = useState<Step>(1);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Data State
    const [teams, setTeams] = useState<Team[]>([]);

    // Form State
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [updateTarget, setUpdateTarget] = useState<"leader" | "all">("leader");
    const [standupName, setStandupName] = useState("");
    const [frequency, setFrequency] = useState("Diariamente");
    const [reminderTime, setReminderTime] = useState("09:00");
    const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    const [questions, setQuestions] = useState(["O que você fez ontem?", "O que fará hoje?", "Algum impedimento?"]);
    const [coverType, setCoverType] = useState<"upload" | "gallery">("upload");
    const [selectedCover, setSelectedCover] = useState<string>("");

    type GalleryItem = { type: 'gradient' | 'image', value: string, label?: string };

    const galleryItems: GalleryItem[] = [
        { type: 'gradient', value: "linear-gradient(135deg, #FF0054 0%, #88007F 100%)", label: "Pink Purple" },
        { type: 'gradient', value: "linear-gradient(135deg, #06D6A0 0%, #311C99 100%)", label: "Green Blue" },
        { type: 'gradient', value: "linear-gradient(135deg, #FFD166 0%, #EF476F 100%)", label: "Yellow Red" },
        { type: 'gradient', value: "linear-gradient(135deg, #118AB2 0%, #073B4C 100%)", label: "Blue Dark" },
        { type: 'image', value: "/images/gallery/Frame 604.png", label: "Frame 604" },
        { type: 'image', value: "/images/gallery/Frame 605.png", label: "Frame 605" },
        { type: 'image', value: "/images/gallery/Frame 606.png", label: "Frame 606" },
        { type: 'image', value: "/images/gallery/Frame 607.png", label: "Frame 607" },
        { type: 'image', value: "/images/gallery/Frame 608.png", label: "Frame 608" },
        { type: 'image', value: "/images/gallery/Frame 609.png", label: "Frame 609" },
        { type: 'image', value: "/images/gallery/Frame 610.png", label: "Frame 610" },
        { type: 'image', value: "/images/gallery/Frame 611.png", label: "Frame 611" },
        { type: 'image', value: "/images/gallery/Frame 612.png", label: "Frame 612" },
        { type: 'image', value: "/images/gallery/Frame 613.png", label: "Frame 613" },
        { type: 'image', value: "/images/gallery/Frame 614.png", label: "Frame 614" },
        { type: 'image', value: "/images/gallery/Frame 615.png", label: "Frame 615" },
        { type: 'image', value: "/images/gallery/Frame 616.png", label: "Frame 616" },
        { type: 'image', value: "/images/gallery/Frame 617.png", label: "Frame 617" },
        { type: 'image', value: "/images/gallery/Frame 618.png", label: "Frame 618" },
    ];

    useEffect(() => {
        if (open && workspaceId) {
            console.log("Fetching teams for workspace:", workspaceId);
            getWorkspaceTeams(workspaceId).then(result => {
                if (result.success && result.teams) {
                    console.log("Fetched teams:", result.teams);
                    setTeams(result.teams.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        memberCount: t.members?.length || 0
                    })));

                    if (result.teams.length > 0 && !selectedTeamId && !editingStandupId) {
                        setSelectedTeamId(result.teams[0].id)
                    }
                } else {
                    console.error("Failed to fetch teams:", result.error);
                    // toast.error("Erro ao carregar equipas: " + result.error); // Optional: silent fail if no teams
                }
            }).catch(err => {
                console.error("Failed to fetch teams:", err);
            });
        }

        // Edit mode data load
        if (open && editingStandupId) {
            const loadStandup = async () => {
                setLoading(true);
                const standup = await getStandupById(editingStandupId);
                if (standup) {
                    setStandupName(standup.name);
                    setSelectedTeamId(standup.team_id);
                    setFrequency(standup.frequency);
                    setReminderTime(standup.reminder_time);
                    setSelectedDays(standup.schedule_days);
                    setQuestions((standup.questions as any) || []);
                    setUpdateTarget(standup.target_audience as any);
                    setSelectedCover(standup.cover_url || "");

                    if (standup.cover_url && standup.cover_url.startsWith('/')) {
                        setCoverType("gallery");
                    }
                }
                setLoading(false);
            };
            loadStandup();
        }
    }, [open, workspaceId, editingStandupId]);

    useEffect(() => {
        if (!open) {
            // Reset form when closed
            setTimeout(() => {
                setStandupName("");
                setFrequency("Diariamente");
                setReminderTime("09:00");
                setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
                setQuestions(["O que você fez ontem?", "O que fará hoje?", "Algum impedimento?"]);
                setSelectedCover("");
                setStep(1);
            }, 300); // Small delay to allow fade out
        }
    }, [open]);

    const resetAndClose = () => {
        onOpenChange(false);
    }

    const nextStep = () => {
        if (step === 1 && !selectedTeamId) {
            toast.error("Please select a team");
            return;
        }
        if (step === 2 && !standupName) {
            toast.error("Please enter standup name");
            return;
        }

        if (step < 3) setStep((prev) => (prev + 1) as Step);
        else handleSave();
    };

    const prevStep = () => {
        if (step > 1) setStep((prev) => (prev - 1) as Step);
    };

    const handleSave = async () => {
        if (!selectedTeamId || !standupName) return;

        setLoading(true);
        let result;

        if (editingStandupId) {
            result = await updateStandup(editingStandupId, {
                teamId: selectedTeamId,
                name: standupName,
                frequency,
                reminderTime,
                days: selectedDays,
                questions: questions.filter(q => q.trim() !== ""),
                targetAudience: updateTarget,
                coverUrl: selectedCover
            });
        } else {
            result = await createStandup({
                teamId: selectedTeamId,
                name: standupName,
                frequency,
                reminderTime,
                days: selectedDays,
                questions: questions.filter(q => q.trim() !== ""),
                targetAudience: updateTarget,
                coverUrl: selectedCover
            });
        }

        setLoading(false);
        if (result.success) {
            toast.success(editingStandupId ? "Standup updated" : "Standup created");
            resetAndClose();
        } else {
            toast.error(result.error || "Failed to save standup");
        }
    }

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    }

    const updateQuestion = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index] = value;
        setQuestions(newQuestions);
    }

    // Render Steps
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[800px] h-[800px] p-0 bg-[#15161B] border-none text-white overflow-hidden rounded-[8px] shadow-2xl gap-0 flex flex-col">

                {/* Header */}
                <div className="h-[72px] bg-[#FF0054] flex items-center justify-between px-8 shrink-0 rounded-t-[8px]">
                    <h2 className="text-xl font-bold text-white">Novo Stand-up</h2>
                    <button
                        onClick={resetAndClose}
                        className="w-8 h-8 rounded-full bg-[#15161B] text-[#FF0054] flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-10 flex-1 flex flex-col overflow-y-auto min-h-0">

                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-16 relative">
                        {/* Connecting Lines */}
                        <div className="absolute top-[22px] left-[25%] right-[25%] h-[1px] bg-[#313131] -z-0"></div>
                        <div
                            className="absolute top-[22px] left-[25%] h-[1px] bg-[#FF0054] -z-0 transition-all duration-300"
                            style={{ width: step === 1 ? '0%' : step === 2 ? '25%' : '50%' }}
                        ></div>

                        <div className="flex justify-between w-[60%] z-10">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-11 h-11 rounded-full flex items-center justify-center text-xl font-medium transition-colors border-0",
                                    step >= 1 ? "bg-[#FF0054] text-white" : "bg-[#25262B] text-[#9CA3AF]"
                                )}>
                                    {step > 1 ? <Check size={24} strokeWidth={3} /> : "1"}
                                </div>
                                <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wider">ESCOLHER EQUIPA</span>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-11 h-11 rounded-full flex items-center justify-center text-xl font-medium transition-colors border-0",
                                    step >= 2 ? "bg-[#FF0054] text-white" : "bg-[#25262B] text-[#9CA3AF]"
                                )}>
                                    {step > 2 ? <Check size={24} strokeWidth={3} /> : "2"}
                                </div>
                                <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wider">CONFIGURAR STAND-UPS</span>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-11 h-11 rounded-full flex items-center justify-center text-xl font-medium transition-colors border-0",
                                    step >= 3 ? "bg-[#FF0054] text-white" : "bg-[#25262B] text-[#9CA3AF]"
                                )}>
                                    3
                                </div>
                                <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wider">PERGUNTAS</span>
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-medium text-[#c9c9c9] mb-8">Escolher equipa</h1>

                                <div className="space-y-10">
                                    {/* Team Select */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <label className="text-base text-[#9CA3AF]">Equipa</label>
                                            <button
                                                onClick={() => setIsCreateTeamModalOpen(true)}
                                                className="text-[#9CA3AF] font-bold text-sm hover:text-white transition-colors"
                                            >
                                                Criar equipa
                                            </button>
                                        </div>

                                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                            <SelectTrigger className="w-full bg-transparent border-b border-[#313131] border-t-0 border-x-0 rounded-none px-0 py-2 h-auto text-lg text-[#52525b] focus:ring-0 focus:border-[#FF0054] font-medium">
                                                <SelectValue placeholder="Selecione uma equipa" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1A1B20] border-[#313131] text-white">
                                                {teams.map(t => (
                                                    <SelectItem key={t.id} value={t.id} className="text-[#9CA3AF] focus:text-white focus:bg-[#313131]">
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                                {teams.length === 0 && (
                                                    <div className="p-2 text-sm text-gray-500">Nenhuma equipa encontrada. Crie uma nova.</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Updates Target */}
                                    <div className="space-y-4">
                                        <label className="text-base text-[#9CA3AF]">Enviar actualizações para</label>
                                        <div className="flex gap-8">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                                                    updateTarget === 'leader' ? "border-[#9CA3AF]" : "border-[#313131] group-hover:border-[#9CA3AF]"
                                                )}>
                                                    {updateTarget === 'leader' && <div className="w-3 h-3 rounded-full bg-[#9CA3AF]" />}
                                                </div>
                                                <span className="text-[#9CA3AF] text-sm uppercase font-medium">LÍDER DA EQUIPA</span>
                                                <input type="radio" className="hidden" name="target" checked={updateTarget === 'leader'} onChange={() => setUpdateTarget('leader')} />
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                                                    updateTarget === 'all' ? "border-[#9CA3AF]" : "border-[#313131] group-hover:border-[#9CA3AF]"
                                                )}>
                                                    {updateTarget === 'all' && <div className="w-3 h-3 rounded-full bg-[#9CA3AF]" />}
                                                </div>
                                                <span className="text-[#9CA3AF] text-sm uppercase font-medium">TODOS</span>
                                                <input type="radio" className="hidden" name="target" checked={updateTarget === 'all'} onChange={() => setUpdateTarget('all')} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-medium text-[#c9c9c9] mb-8">Configurar Stand-ups</h1>

                                <div className="space-y-8">
                                    {/* Name Input */}
                                    <div className="space-y-2">
                                        <label className="text-base text-[#9CA3AF]">Nome do Stand-ups</label>
                                        <input
                                            type="text"
                                            value={standupName}
                                            onChange={(e) => setStandupName(e.target.value)}
                                            className="w-full bg-transparent border-b border-[#313131] pb-2 text-lg text-[#52525b] focus:text-white focus:border-[#FF0054] outline-none transition-colors font-medium placeholder:text-[#313131]"
                                            placeholder="Ex: Equipa de Designers"
                                        />
                                    </div>

                                    {/* Cover Image Selection */}
                                    <div className="space-y-4">
                                        <label className="text-base text-[#9CA3AF]">Capa do Stand-up</label>

                                        <div className="flex gap-6 border-b border-[#313131]">
                                            <button
                                                onClick={() => setCoverType("upload")}
                                                className={cn(
                                                    "pb-2 text-sm font-medium transition-colors relative",
                                                    coverType === "upload" ? "text-white" : "text-[#52525b] hover:text-[#9CA3AF]"
                                                )}
                                            >
                                                Upload
                                                {coverType === "upload" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF0054]" />}
                                            </button>
                                            <button
                                                onClick={() => setCoverType("gallery")}
                                                className={cn(
                                                    "pb-2 text-sm font-medium transition-colors relative",
                                                    coverType === "gallery" ? "text-white" : "text-[#52525b] hover:text-[#9CA3AF]"
                                                )}
                                            >
                                                Galeria
                                                {coverType === "gallery" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF0054]" />}
                                            </button>
                                        </div>

                                        <div className="pt-2">
                                            {coverType === "upload" ? (
                                                <div className="w-full h-32 border border-dashed border-[#313131] rounded-[8px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#52525b] transition-colors group bg-[#1A1B20]">
                                                    <div className="w-10 h-10 rounded-full bg-[#25262B] flex items-center justify-center text-[#9CA3AF] group-hover:text-white transition-colors">
                                                        <Upload size={18} />
                                                    </div>
                                                    <span className="text-sm text-[#52525b] group-hover:text-[#9CA3AF] transition-colors">Clique para fazer upload</span>
                                                    <span className="text-xs text-[#313131]">SVG, PNG, JPG or GIF (max. 800x400px)</span>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-4 gap-4">
                                                    {galleryItems.map((item, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setSelectedCover(item.value)}
                                                            className={cn(
                                                                "h-20 rounded-[8px] w-full transition-all relative overflow-hidden group border border-[#313131]",
                                                                selectedCover === item.value ? "ring-2 ring-[#FF0054] ring-offset-2 ring-offset-[#15161B]" : "hover:opacity-80"
                                                            )}
                                                        >
                                                            {item.type === 'gradient' ? (
                                                                <div className="w-full h-full" style={{ background: item.value }} />
                                                            ) : (
                                                                <img src={item.value} alt={item.label} className="w-full h-full object-cover" />
                                                            )}

                                                            {selectedCover === item.value && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                    <Check className="text-white" size={20} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Frequency */}
                                    <div className="space-y-2">
                                        <label className="text-base text-[#9CA3AF]">Frequência</label>
                                        <Select value={frequency} onValueChange={setFrequency}>
                                            <SelectTrigger className="w-full bg-transparent border-b border-[#313131] border-t-0 border-x-0 rounded-none px-0 py-2 h-auto text-lg text-[#52525b] focus:ring-0 focus:border-[#FF0054] font-medium">
                                                <SelectValue placeholder="Select Frequency" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1A1B20] border-[#313131] text-white">
                                                <SelectItem value="daily" className="text-[#9CA3AF] focus:text-white focus:bg-[#313131]">Diariamente</SelectItem>
                                                <SelectItem value="weekly" className="text-[#9CA3AF] focus:text-white focus:bg-[#313131]">Semanalmente</SelectItem>
                                                <SelectItem value="monthly" className="text-[#9CA3AF] focus:text-white focus:bg-[#313131]">Mensalmente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Days Collection */}
                                    <div className="space-y-3">
                                        <label className="text-base text-[#9CA3AF]">Coletar em</label>
                                        <div className="flex gap-3">
                                            {['Do', 'Se', 'Te', 'Qa', 'Qi', 'Se', 'Sa'].map((day, index) => {
                                                const dayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index];
                                                const isSelected = selectedDays.includes(dayKey);
                                                return (
                                                    <button
                                                        key={dayKey}
                                                        onClick={() => toggleDay(dayKey)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors border",
                                                            isSelected
                                                                ? "bg-transparent border-[#52525b] text-[#9CA3AF]"
                                                                : "bg-transparent border-[#313131] text-[#52525b] hover:border-[#52525b]"
                                                        )}
                                                    >
                                                        {day}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Reminder Time */}
                                    <div className="space-y-2">
                                        <label className="text-base text-[#9CA3AF]">Enviar lembrete em</label>
                                        <Select value={reminderTime} onValueChange={setReminderTime}>
                                            <SelectTrigger className="w-[30%] bg-transparent border-b border-[#313131] border-t-0 border-x-0 rounded-none px-0 py-2 h-auto text-lg text-[#52525b] focus:ring-0 focus:border-[#FF0054] font-medium">
                                                <SelectValue placeholder="Select Time" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1A1B20] border-[#313131] text-white h-60">
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`} className="text-[#9CA3AF] focus:text-white focus:bg-[#313131]">
                                                        {`${i.toString().padStart(2, '0')}:00`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-[#c9c9c9]">Um lembrete será enviado no próximo dia disponível</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h1 className="text-2xl font-medium text-[#c9c9c9] mb-8">Perguntas</h1>

                                <div className="space-y-10">
                                    {questions.map((q, i) => (
                                        <div key={i} className="space-y-2">
                                            <label className="text-base text-[#9CA3AF]">{`Pergunta ${i + 1}`}</label>
                                            <input
                                                type="text"
                                                value={q}
                                                onChange={(e) => updateQuestion(i, e.target.value)}
                                                placeholder={`Ex: ${i === 0 ? "O que conseguiste fazer ontem?" : i === 1 ? "Qual é o foco para hoje?" : "Algum impedimento/bloqueio?"}`}
                                                className="w-full bg-transparent border-b border-[#313131] pb-2 text-lg text-[#52525b] focus:text-white focus:border-[#FF0054] outline-none transition-colors font-medium placeholder:text-[#313131]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-auto pt-10 flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={resetAndClose}
                            className="border-[#52525b] text-[#9CA3AF] hover:text-white hover:border-white bg-transparent h-12 w-32 rounded-[8px]"
                        >
                            Cancelar
                        </Button>

                        <div className="flex gap-4">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={prevStep}
                                    className="border-[#52525b] text-[#9CA3AF] hover:text-white hover:border-white bg-transparent h-12 w-32 rounded-[8px]"
                                >
                                    Voltar
                                </Button>
                            )}
                            <Button
                                onClick={nextStep}
                                disabled={loading}
                                className="bg-[#FF0054] hover:bg-[#ff1a66] text-white h-12 w-32 rounded-[8px] border-none font-medium text-base"
                            >
                                {step === 3 ? (loading ? "Criando..." : "Criar") : "Avançar"}
                            </Button>
                        </div>
                    </div>
                </div>

            </DialogContent>

            <CreateTeamModal open={isCreateTeamModalOpen} onOpenChange={setIsCreateTeamModalOpen} workspaceId={workspaceId} />
        </Dialog >
    );
}
