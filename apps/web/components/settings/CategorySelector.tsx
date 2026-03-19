"use client"

import * as React from "react"
import { Search, ChevronDown, Palette, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Creative industry specialties/categories
export const creativeCategories = [
    // Design
    { name: "UI/UX Designer", group: "Design" },
    { name: "Product Designer", group: "Design" },
    { name: "Graphic Designer", group: "Design" },
    { name: "Brand Designer", group: "Design" },
    { name: "Visual Designer", group: "Design" },
    { name: "Web Designer", group: "Design" },
    { name: "Motion Designer", group: "Design" },
    { name: "3D Designer", group: "Design" },
    { name: "Game Designer", group: "Design" },
    { name: "Interior Designer", group: "Design" },
    { name: "Industrial Designer", group: "Design" },
    { name: "Fashion Designer", group: "Design" },
    { name: "Packaging Designer", group: "Design" },

    // Development
    { name: "Frontend Developer", group: "Development" },
    { name: "Backend Developer", group: "Development" },
    { name: "Full Stack Developer", group: "Development" },
    { name: "Mobile Developer", group: "Development" },
    { name: "Creative Developer", group: "Development" },
    { name: "Game Developer", group: "Development" },

    // Art & Illustration
    { name: "Illustrator", group: "Art" },
    { name: "Digital Artist", group: "Art" },
    { name: "Concept Artist", group: "Art" },
    { name: "Character Designer", group: "Art" },
    { name: "Comic Artist", group: "Art" },
    { name: "Tattoo Artist", group: "Art" },
    { name: "Fine Artist", group: "Art" },

    // Photography & Video
    { name: "Photographer", group: "Photo & Video" },
    { name: "Videographer", group: "Photo & Video" },
    { name: "Cinematographer", group: "Photo & Video" },
    { name: "Video Editor", group: "Photo & Video" },
    { name: "Colorist", group: "Photo & Video" },
    { name: "Drone Operator", group: "Photo & Video" },

    // Animation & VFX
    { name: "Animator", group: "Animation & VFX" },
    { name: "2D Animator", group: "Animation & VFX" },
    { name: "3D Animator", group: "Animation & VFX" },
    { name: "VFX Artist", group: "Animation & VFX" },
    { name: "Compositing Artist", group: "Animation & VFX" },

    // Audio
    { name: "Music Producer", group: "Audio" },
    { name: "Sound Designer", group: "Audio" },
    { name: "Audio Engineer", group: "Audio" },
    { name: "Composer", group: "Audio" },
    { name: "Voice Actor", group: "Audio" },
    { name: "Podcast Producer", group: "Audio" },

    // Writing & Content
    { name: "Copywriter", group: "Writing" },
    { name: "Content Creator", group: "Writing" },
    { name: "Content Strategist", group: "Writing" },
    { name: "Creative Writer", group: "Writing" },
    { name: "Screenwriter", group: "Writing" },
    { name: "Blogger", group: "Writing" },

    // Marketing & Strategy
    { name: "Brand Strategist", group: "Marketing" },
    { name: "Creative Director", group: "Marketing" },
    { name: "Art Director", group: "Marketing" },
    { name: "Marketing Designer", group: "Marketing" },
    { name: "Social Media Manager", group: "Marketing" },
    { name: "Influencer", group: "Marketing" },

    // Architecture
    { name: "Architect", group: "Architecture" },
    { name: "Landscape Architect", group: "Architecture" },
    { name: "Urban Planner", group: "Architecture" },
    { name: "Architectural Visualizer", group: "Architecture" },

    // Other Creative
    { name: "Creative Consultant", group: "Other" },
    { name: "Multidisciplinary Creative", group: "Other" },
    { name: "Entrepreneur", group: "Other" },
    { name: "Creative Technologist", group: "Other" },
].sort((a, b) => a.name.localeCompare(b.name))

interface CategorySelectorProps {
    selectedCategory: string
    onCategoryChange: (category: string) => void
}

export function CategorySelector({
    selectedCategory,
    onCategoryChange
}: CategorySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredCategories = creativeCategories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.group.toLowerCase().includes(search.toLowerCase())
    )

    // Group categories for display
    const groupedCategories = filteredCategories.reduce((acc, cat) => {
        if (!acc[cat.group]) acc[cat.group] = []
        acc[cat.group].push(cat)
        return acc
    }, {} as Record<string, typeof creativeCategories>)

    const handleSelect = (category: string) => {
        onCategoryChange(category)
        setOpen(false)
        setSearch("")
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Especialidade / Categoria</label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all text-left",
                            "bg-bg-0 border-bg-3 hover:border-bg-2 focus:border-accent-indigo",
                            !selectedCategory && "text-text-tertiary"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-text-tertiary" />
                            <span className={cn(selectedCategory ? "text-text-primary" : "text-text-tertiary")}>
                                {selectedCategory || "Selecione uma especialidade"}
                            </span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform text-text-tertiary", open && "rotate-180")} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 bg-bg-1 border-bg-3 shadow-2xl" align="start">
                    <div className="p-2 border-b border-bg-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <Input
                                placeholder="Pesquisar especialidade..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-bg-0 border-bg-3 focus:border-accent-indigo h-9"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto p-1">
                        {Object.keys(groupedCategories).length === 0 ? (
                            <div className="px-3 py-6 text-center text-text-tertiary text-sm">
                                Nenhuma especialidade encontrada
                            </div>
                        ) : (
                            Object.entries(groupedCategories).map(([group, categories]) => (
                                <div key={group} className="mb-2">
                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                                        {group}
                                    </div>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.name}
                                            onClick={() => handleSelect(cat.name)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                                "hover:bg-bg-2 text-text-primary",
                                                selectedCategory === cat.name && "bg-accent-indigo/10 text-accent-indigo"
                                            )}
                                        >
                                            <span>{cat.name}</span>
                                            {selectedCategory === cat.name && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
