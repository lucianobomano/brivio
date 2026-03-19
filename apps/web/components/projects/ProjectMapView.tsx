"use client"

import * as React from "react"
import type { Project } from "./ProjectsClient"
import {
    Map as MapIcon,
    Navigation,
    LocateFixed,
    Layers,
    ChevronRight,
    Search as SearchIcon,
    Plus,
    Minus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface ProjectMapViewProps {
    projects: Project[]
}

export function ProjectMapView({ projects }: ProjectMapViewProps) {
    const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Mock locations for projects
    const locations = [
        { id: '1', city: 'Lisboa', coords: { x: 25, y: 70 }, count: 12 },
        { id: '2', city: 'Porto', coords: { x: 20, y: 25 }, count: 8 },
        { id: '3', city: 'Luanda', coords: { x: 65, y: 55 }, count: 5 },
        { id: '4', city: 'Madrid', coords: { x: 45, y: 65 }, count: 3 },
        { id: '5', city: 'São Paulo', coords: { x: 35, y: 85 }, count: 2 },
    ]

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex h-full bg-bg-1 border border-bg-3 dark:border-bg-3 rounded-[32px] overflow-hidden shadow-xl">
            {/* Sidebar - Location Filter & Project List */}
            <div className="w-[350px] border-r border-bg-3 dark:border-bg-3 flex flex-col shrink-0 bg-bg-1/50 backdrop-blur-xl">
                <div className="p-6 border-b border-bg-3 dark:border-bg-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-accent-indigo" />
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">Geo Hub</h2>
                        </div>
                        <Badge className="bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                            {projects.length} Projectos
                        </Badge>
                    </div>

                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#97A1B3]" />
                        <input
                            type="text"
                            placeholder="Pesquisar localização..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-2/50 border border-bg-3 dark:border-bg-3 rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary placeholder:text-[#97A1B3] focus:outline-none focus:border-accent-indigo/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                    <div>
                        <span className="text-[10px] font-bold text-[#97A1B3] uppercase tracking-widest block mb-4">Principais Hubs</span>
                        <div className="space-y-2">
                            {locations.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => setSelectedLocation(loc.city)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group",
                                        selectedLocation === loc.city
                                            ? "bg-accent-indigo border-accent-indigo shadow-lg shadow-accent-indigo/20 text-white"
                                            : "bg-bg-1 border-bg-3 dark:border-bg-3 text-text-primary hover:border-accent-indigo/30"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                            selectedLocation === loc.city ? "bg-white/20" : "bg-bg-2 group-hover:bg-bg-3"
                                        )}>
                                            <LocateFixed className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold leading-none">{loc.city}</p>
                                            <p className={cn(
                                                "text-[9px] font-bold uppercase tracking-wider mt-1",
                                                selectedLocation === loc.city ? "text-white/60" : "text-[#97A1B3]"
                                            )}>Região Activa</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                                        selectedLocation === loc.city ? "bg-white/20" : "bg-bg-2"
                                    )}>{loc.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold text-[#97A1B3] uppercase tracking-widest block mb-4">Projectos Recentes</span>
                        <div className="space-y-3">
                            {filteredProjects.slice(0, 5).map((project) => (
                                <div key={project.id} className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-bg-3 hover:bg-bg-2/50 transition-all group cursor-pointer">
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-bg-3">
                                        {project.cover_url ? (
                                            <Image src={project.cover_url} alt="" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-bg-3 dark:bg-[#373737] flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-accent-indigo">{project.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-text-primary truncate">{project.name}</p>
                                        <p className="text-[9px] font-bold text-[#97A1B3] uppercase truncate">{project.brand?.name || 'Sem Marca'}</p>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-[#97A1B3] group-hover:text-accent-indigo group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-bg-2/30">
                {/* Mock Map Background Style */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.2) 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />

                {/* Simplified Worldmap/SVG Container */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="relative w-full h-full max-w-4xl max-h-[600px] bg-bg-1/40 rounded-[48px] border border-bg-3/50 dark:border-bg-3 overflow-hidden shadow-inner">
                        {/* Map Markers */}
                        {locations.map((loc) => (
                            <motion.button
                                key={loc.id}
                                whileHover={{ scale: 1.1 }}
                                onClick={() => setSelectedLocation(loc.city)}
                                className="absolute group z-10"
                                style={{ left: `${loc.coords.x}%`, top: `${loc.coords.y}%` }}
                            >
                                <div className="relative flex items-center justify-center">
                                    <div className={cn(
                                        "absolute w-12 h-12 rounded-full blur-xl transition-all duration-500",
                                        selectedLocation === loc.city ? "bg-accent-indigo opacity-40 scale-150" : "bg-accent-indigo/20 opacity-0 group-hover:opacity-40"
                                    )} />
                                    <div className={cn(
                                        "w-8 h-8 rounded-2xl rotate-45 border-2 flex items-center justify-center transition-all duration-500 shadow-xl",
                                        selectedLocation === loc.city
                                            ? "bg-accent-indigo border-white scale-110 shadow-accent-indigo/40"
                                            : "bg-bg-1 border-bg-3 group-hover:border-accent-indigo"
                                    )}>
                                        <div className="-rotate-45 font-black text-[10px]">
                                            {selectedLocation === loc.city ? (
                                                <Navigation className="w-4 h-4 text-white p-0.5" />
                                            ) : (
                                                <span className="text-accent-indigo">{loc.count}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tooltip */}
                                    <div className={cn(
                                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-4 whitespace-nowrap px-3 py-1.5 rounded-xl bg-bg-0 border border-bg-3 dark:border-bg-3 shadow-2xl transition-all duration-300",
                                        selectedLocation === loc.city ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                                    )}>
                                        <span className="text-[10px] font-black uppercase tracking-tight text-text-primary">{loc.city}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-0 border-r border-b border-bg-3 dark:border-bg-3 rotate-45 -mt-1" />
                                    </div>
                                </div>
                            </motion.button>
                        ))}

                        {/* Connection Lines (Visual Detail) */}
                        <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-10">
                            {locations.slice(1).map((loc, i) => (
                                <path
                                    key={i}
                                    d={`M ${locations[0].coords.x}% ${locations[0].coords.y}% Q ${(locations[0].coords.x + loc.coords.x) / 2}% ${(locations[0].coords.y + loc.coords.y) / 2 - 10}% ${loc.coords.x}% ${loc.coords.y}%`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray="8 4"
                                />
                            ))}
                        </svg>
                    </div>
                </div>

                {/* Map Controls */}
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                    <Button size="icon" variant="outline" className="h-10 w-10 border-bg-3 dark:border-bg-3 bg-bg-0/80 backdrop-blur-md rounded-xl hover:bg-bg-3 shadow-lg">
                        <Plus className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-10 w-10 border-bg-3 dark:border-bg-3 bg-bg-0/80 backdrop-blur-md rounded-xl hover:bg-bg-3 shadow-lg">
                        <Minus className="w-5 h-5" />
                    </Button>
                    <div className="h-1 w-full" />
                    <Button size="icon" variant="outline" className="h-10 w-10 border-bg-3 dark:border-bg-3 bg-bg-0/80 backdrop-blur-md rounded-xl hover:bg-bg-3 shadow-lg">
                        <Layers className="w-5 h-5 text-accent-indigo" />
                    </Button>
                </div>

                {/* Selected Info Toast */}
                <AnimatePresence>
                    {selectedLocation && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="absolute bottom-6 right-6 left-[370px] bg-bg-0/80 backdrop-blur-2xl border border-bg-3 dark:border-bg-3 p-6 rounded-[32px] shadow-2xl flex items-center justify-between z-20"
                        >
                            <div className="flex items-center gap-6">
                                <div className="p-3 rounded-2xl bg-accent-indigo/10 border border-accent-indigo/20">
                                    <LocateFixed className="w-6 h-6 text-accent-indigo" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-text-primary tracking-tight">{selectedLocation}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-black uppercase">
                                            High Active Hub
                                        </div>
                                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Tempo Local: 14:30 GMT</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-bg-0 bg-bg-2 flex items-center justify-center text-[10px] font-bold text-[#97A1B3]">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                                <div className="h-10 w-[1px] bg-bg-3 dark:bg-[#373737]" />
                                <Button className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-2xl px-6 font-bold shadow-lg shadow-accent-indigo/20">
                                    Explorar Cluster
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>

                            <button
                                onClick={() => setSelectedLocation(null)}
                                className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
                            >
                                <Plus className="w-4 h-4 rotate-45" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
