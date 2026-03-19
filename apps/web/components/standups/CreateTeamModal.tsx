"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X, ChevronDown, Check, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { getWorkspaceMembers, createStandupTeam } from "@/app/actions/standups";
import { toast } from "sonner";

interface CreateTeamModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId?: string;
}

interface User {
    id: string;
    name: string;
    avatar_url?: string | null;
}

export function CreateTeamModal({ open, onOpenChange, workspaceId }: CreateTeamModalProps) {
    const [teamName, setTeamName] = useState("Equipa de Marketing");
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [leaderId, setLeaderId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

    useEffect(() => {
        if (open && workspaceId) {
            setLoading(true);
            getWorkspaceMembers(workspaceId).then(users => {
                setAvailableUsers(users);
                if (users.length > 0 && !leaderId) {
                    setLeaderId(users[0].id);
                }
                setLoading(false);
            });
        }
    }, [open, workspaceId]);

    const handleClose = () => {
        onOpenChange(false);
    }

    const removeMember = (idToRemove: string) => {
        setSelectedMemberIds(selectedMemberIds.filter(id => id !== idToRemove));
    }

    const addMember = (userId: string) => {
        if (!selectedMemberIds.includes(userId)) {
            setSelectedMemberIds([...selectedMemberIds, userId]);
        }
        setIsAddMemberOpen(false);
    }

    const handleSave = async () => {
        if (!workspaceId) {
            toast.error("Workspace ID missing");
            return;
        }
        if (!teamName || !leaderId) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        const result = await createStandupTeam({
            name: teamName,
            leaderId,
            memberIds: selectedMemberIds,
            workspaceId
        });

        setLoading(false);
        if (result.success) {
            toast.success("Team created successfully");
            onOpenChange(false);
        } else {
            toast.error(result.error || "Failed to create team");
        }
    }

    const getMemberName = (id: string) => availableUsers.find(u => u.id === id)?.name || id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[800px] p-0 bg-[#15161B] border-none text-white overflow-visible rounded-[8px] shadow-2xl gap-0 block">

                {/* Header */}
                <div className="h-[72px] bg-[#FF0054] flex items-center justify-between px-8 shrink-0 rounded-t-[8px]">
                    <h2 className="text-xl font-bold text-white">Nova equipa</h2>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-[#15161B] text-[#FF0054] flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-10 flex flex-col gap-10">

                    {/* Team Name */}
                    <div className="space-y-2">
                        <label className="text-base text-[#9CA3AF]">Nome da equipa</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full bg-transparent border-b border-[#313131] pb-2 text-lg text-[#52525b] focus:text-white focus:border-[#FF0054] outline-none transition-colors font-medium placeholder:text-[#313131]"
                            placeholder="Equipa de Marketing"
                        />
                    </div>

                    {/* Members */}
                    <div className="space-y-4 relative">
                        <label className="text-base text-[#9CA3AF]">Membros</label>
                        <div className="w-full border-b border-[#313131] pb-2 flex flex-wrap gap-3 min-h-[40px] items-center">
                            {selectedMemberIds.map(memberId => (
                                <div key={memberId} className="flex items-center gap-2 bg-[#F4F4F5]/10 px-3 py-1.5 rounded-full border border-white/5">
                                    <button onClick={() => removeMember(memberId)} className="text-[#9CA3AF] hover:text-white transition-colors">
                                        <X size={12} />
                                    </button>
                                    <span className="text-sm text-[#9CA3AF]">{getMemberName(memberId)}</span>
                                </div>
                            ))}

                            <div className="relative">
                                <button
                                    onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                                    className="flex items-center gap-1 text-[#FF0054] text-sm font-bold hovering:underline px-2 py-1"
                                >
                                    <Plus size={16} /> Adicionar
                                </button>

                                {isAddMemberOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1B20] border border-[#313131] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                        {availableUsers.filter(u => !selectedMemberIds.includes(u.id)).map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => addMember(user.id)}
                                                className="w-full text-left px-4 py-3 hover:bg-[#313131] text-sm text-[#9CA3AF] hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gray-600 overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                {user.name}
                                            </button>
                                        ))}
                                        {availableUsers.filter(u => !selectedMemberIds.includes(u.id)).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-[#52525b]">No more members</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Team Leader */}
                    <div className="space-y-2">
                        <label className="text-base text-[#9CA3AF]">Líder da equipa</label>
                        <Select value={leaderId} onValueChange={setLeaderId}>
                            <SelectTrigger className="w-full bg-transparent border-b border-[#313131] border-t-0 border-x-0 rounded-none px-0 py-2 h-auto text-lg text-[#52525b] focus:ring-0 focus:border-[#FF0054] font-medium">
                                <SelectValue placeholder="Select leader" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1B20] border-[#313131] text-white">
                                {availableUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id} className="text-[#9CA3AF] focus:text-white focus:bg-[#313131]">
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-10 flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            className="border-[#313131] text-white hover:bg-[#313131] bg-transparent h-12 w-32 rounded-[24px] font-bold text-base bg-[#1A1B20]"
                            style={{ borderRadius: "24px", background: "#15161B" }}
                        >
                            Cancelar
                        </Button>

                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-[#FF0054] hover:bg-[#ff1a66] text-white h-12 w-32 rounded-[24px] border-none font-bold text-base"
                        >
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
