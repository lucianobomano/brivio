"use client"

import React, { useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createTaskList } from "@/app/actions/tasks"

interface CreateListModalProps {
    children: React.ReactNode
    userId: string
    onListCreated?: () => void
}

const colorOptions = [
    { name: "Gradient Blue-Green", value: "linear-gradient(135deg, #2dd4bf, #3b82f6)", hex: "#2dd4bf" },
    { name: "Indigo", value: "#8c92c7", hex: "#8c92c7" },
    { name: "Yellow", value: "#facc15", hex: "#facc15" },
    { name: "Pink", value: "#ec4899", hex: "#ec4899" },
    { name: "Green", value: "#22c55e", hex: "#22c55e" },
    { name: "Blue", value: "#3b82f6", hex: "#3b82f6" },
    { name: "Orange", value: "#fb923c", hex: "#fb923c" },
    { name: "Gray", value: "#6b7280", hex: "#6b7280" },
]

export function CreateListModal({ children, userId, onListCreated }: CreateListModalProps) {
    const [title, setTitle] = useState("")
    const [selectedColor, setSelectedColor] = useState(colorOptions[0].value)
    const [customColor, setCustomColor] = useState("#8c92c7")
    const [isCustomColorSelected, setIsCustomColorSelected] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const colorInputRef = useRef<HTMLInputElement>(null)

    const activeColor = isCustomColorSelected ? customColor : selectedColor

    const handleColorSelect = (colorValue: string) => {
        setSelectedColor(colorValue)
        setIsCustomColorSelected(false)
    }

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomColor(e.target.value)
        setIsCustomColorSelected(true)
    }

    const handleCreate = async () => {
        if (!title.trim() || isLoading) return

        setIsLoading(true)

        const result = await createTaskList({
            title: title.trim(),
            color: activeColor,
            userId,
        })

        setIsLoading(false)

        if (result.success) {
            // Reset and close
            setTitle("")
            setSelectedColor(colorOptions[0].value)
            setIsCustomColorSelected(false)
            setIsOpen(false)
            onListCreated?.()
        }
    }

    // Get background style for icon area
    const getIconBgStyle = () => {
        if (activeColor.includes('gradient')) {
            return { background: activeColor }
        }
        return { backgroundColor: activeColor }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-bg-1 border-bg-3 text-white p-8">
                <DialogHeader className="text-center pb-2">
                    <DialogTitle className="text-2xl font-bold text-center">Create a new list</DialogTitle>
                </DialogHeader>

                {/* Icon Upload Area - Background changes with selected color */}
                <div className="flex flex-col items-center my-6">
                    <div
                        className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:opacity-80 transition-all group"
                        style={getIconBgStyle()}
                    >
                        <ImageIcon className="w-8 h-8 text-white drop-shadow-md group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm font-semibold text-white mt-3 uppercase tracking-wide">Upload an Icon</p>
                    <p className="text-xs text-text-secondary">Optional (jpg, png, svg)</p>
                </div>

                {/* Color Picker */}
                <div className="mb-6">
                    <p className="text-sm text-text-secondary mb-3">Pick a list color</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        {colorOptions.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => handleColorSelect(color.value)}
                                className={cn(
                                    "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                                    !isCustomColorSelected && selectedColor === color.value
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-bg-1 scale-110"
                                        : "hover:scale-105"
                                )}
                                style={color.value.includes('gradient')
                                    ? { background: color.value }
                                    : { backgroundColor: color.hex }
                                }
                                title={color.name}
                            >
                                {!isCustomColorSelected && selectedColor === color.value && (
                                    <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}

                        {/* Custom Color Picker with Rainbow Gradient */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                                        "bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]",
                                        isCustomColorSelected
                                            ? "ring-2 ring-white ring-offset-2 ring-offset-bg-1 scale-110"
                                            : "hover:scale-105"
                                    )}
                                    title="Custom Color"
                                >
                                    {isCustomColorSelected && (
                                        <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4 bg-bg-2 border-bg-3">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-white">Choose a custom color</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            ref={colorInputRef}
                                            type="color"
                                            value={customColor}
                                            onChange={handleCustomColorChange}
                                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-bg-3 bg-transparent"
                                        />
                                        <div className="flex-1">
                                            <Input
                                                value={customColor}
                                                onChange={(e) => {
                                                    setCustomColor(e.target.value)
                                                    setIsCustomColorSelected(true)
                                                }}
                                                placeholder="#000000"
                                                className="h-10 bg-bg-1 border-bg-3 text-white font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        className="h-8 rounded-lg border border-bg-3"
                                        style={{ backgroundColor: customColor }}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Title Input */}
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your list title"
                    className="h-12 bg-bg-2 border-bg-3 text-white placeholder:text-text-secondary focus:ring-2 focus:ring-accent-indigo focus:border-transparent text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />

                {/* Actions */}
                <DialogFooter className="flex gap-3 mt-6 sm:justify-center">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="flex-1 h-12 border-bg-3 bg-transparent text-white hover:bg-bg-2 rounded-full font-semibold"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleCreate}
                        disabled={!title.trim() || isLoading}
                        className="flex-1 h-12 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-black font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
