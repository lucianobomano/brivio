"use client"

import React from "react"
import { Trash2, MoreVertical, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BaseModuleProps {
    title: string
    isReadOnly?: boolean // For future public view
    onDelete?: () => void
    children: React.ReactNode
}

export function BaseModule({ title, isReadOnly = false, onDelete, children }: BaseModuleProps) {
    return (
        <div className="p-8 relative">
            <div className="flex items-start justify-between mb-6">
                <h3 className="text-2xl font-bold text-white outline-none focus:border-b border-accent-indigo" contentEditable={!isReadOnly} suppressContentEditableWarning>
                    {title}
                </h3>

                {!isReadOnly && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-secondary hover:text-white">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-bg-2 border-bg-3">
                                <DropdownMenuItem className="text-error hover:bg-error/10 hover:text-error cursor-pointer" onClick={onDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Module
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            <div className="module-content">
                {children}
            </div>
        </div>
    )
}
