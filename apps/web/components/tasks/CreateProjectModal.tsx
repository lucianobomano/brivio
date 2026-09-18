"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderPlus, Loader2 } from "lucide-react"
import { createQuickProject } from "@/app/actions/tasks"

interface CreateProjectModalProps {
    children: React.ReactNode
    userId: string
    onProjectCreated?: () => void
}

export function CreateProjectModal({ children, userId, onProjectCreated }: CreateProjectModalProps) {
    const [name, setName] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleCreate = async () => {
        if (!name.trim() || isLoading) return

        setIsLoading(true)

        const result = await createQuickProject({
            name: name.trim(),
            userId,
        })

        setIsLoading(false)

        if (result.success) {
            setName("")
            setIsOpen(false)
            onProjectCreated?.()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-bg-1 border border-zinc-200 dark:border-bg-3 text-zinc-900 dark:text-white p-8 rounded-2xl shadow-2xl">
                <DialogHeader className="text-center pb-2">
                    <DialogTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white">
                        Create a new project
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center my-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff0054] to-pink-400 shadow-md flex items-center justify-center">
                        <FolderPlus className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-3 tracking-wide">New Workspace Project</p>
                    <p className="text-xs text-zinc-500 dark:text-text-secondary">All project tasks and Kanban boards will be organized inside.</p>
                </div>

                {/* Project Name Input */}
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name..."
                    className="h-12 bg-zinc-50 dark:bg-bg-2 border border-zinc-200 dark:border-bg-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-text-secondary focus:ring-2 focus:ring-[#ff0054] focus:border-transparent text-base rounded-xl"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                />

                {/* Actions */}
                <DialogFooter className="flex gap-3 mt-6 sm:justify-center">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="flex-1 h-12 border border-zinc-200 dark:border-bg-3 bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-bg-2 rounded-full font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim() || isLoading}
                        className="flex-1 h-12 bg-[#ff0054] hover:bg-[#e0004a] text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Project'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
