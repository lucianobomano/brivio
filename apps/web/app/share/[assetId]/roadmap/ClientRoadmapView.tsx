"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle2,
    Circle,
    ShieldCheck,
    Lock,
    ArrowUpRight,
    MessageCircle,
    ChevronDown,
    ArrowRight,
    Palette,
    Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ClientRoadmapViewProps {
    project: any
    roadmap: any[]
    globalProgress: number
    currentPhaseName: string
}

type LayoutStyle = 'default' | 'numbered' | 'minimal' | 'cards' | 'timeline'

const LAYOUT_OPTIONS: { id: LayoutStyle; name: string; icon: string; description: string }[] = [
    { id: 'default', name: 'Timeline', icon: '📋', description: 'Cards expansíveis' },
    { id: 'numbered', name: 'Círculos', icon: '🔢', description: 'Números grandes' },
    { id: 'minimal', name: 'Minimal', icon: '✨', description: 'Design clean' },
    { id: 'cards', name: 'Cards', icon: '🃏', description: 'Glassmorphism' },
    { id: 'timeline', name: 'Horizontal', icon: '⏳', description: 'Linha do tempo' },
]

export function ClientRoadmapView({
    project,
    roadmap,
    globalProgress,
    currentPhaseName
}: ClientRoadmapViewProps) {
    const brand = project.brands
    const [layoutStyle, setLayoutStyle] = React.useState<LayoutStyle>('default')
    const [expandedStage, setExpandedStage] = React.useState<string | null>(null)
    const [isLayoutMenuOpen, setIsLayoutMenuOpen] = React.useState(false)

    // Custom cursor and auto-scroll state for numbered circles
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const [cursorPosition, setCursorPosition] = React.useState<{ x: number; y: number } | null>(null)
    const [scrollDirection, setScrollDirection] = React.useState<'left' | 'right' | null>(null)
    const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

    // Handle mouse move for custom cursor and auto-scroll
    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = scrollContainerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const x = e.clientX
        const edgeThreshold = 150 // pixels from edge to trigger scroll

        setCursorPosition({ x: e.clientX, y: e.clientY })

        if (x < rect.left + edgeThreshold) {
            setScrollDirection('left')
        } else if (x > rect.right - edgeThreshold) {
            setScrollDirection('right')
        } else {
            setScrollDirection(null)
        }
    }, [])

    // Auto-scroll effect
    React.useEffect(() => {
        if (scrollDirection && scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const scrollSpeed = 8

            scrollIntervalRef.current = setInterval(() => {
                if (scrollDirection === 'left') {
                    container.scrollLeft -= scrollSpeed
                } else {
                    container.scrollLeft += scrollSpeed
                }
            }, 16)
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current)
            }
        }
    }, [scrollDirection])

    const handleMouseLeave = () => {
        setCursorPosition(null)
        setScrollDirection(null)
    }

    // Calculate stats
    const totalTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.length, 0)
    const completedTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.filter((t: any) => t.completed).length, 0)
    const completedStages = roadmap.filter(s => s.progress === 100).length

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1F] font-inter-tight selection:bg-accent-indigo/10">
            {/* Header / Brand Bar */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-[#E5E5EA]/50">
                <div className="max-w-[1100px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#3d3d3f] flex items-center justify-center text-white font-black text-[14px] shadow-lg">
                            {brand?.logo_url ? (
                                <img src={brand.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                brand?.name?.substring(0, 2).toUpperCase() || "B"
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[16px] font-bold tracking-tight">{project.name}</span>
                            <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">{brand?.name || "Roadmap do Projeto"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Layout Selector */}
                        <Popover open={isLayoutMenuOpen} onOpenChange={setIsLayoutMenuOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-10 px-4 bg-white border-[#E5E5EA] rounded-xl gap-2">
                                    <Palette className="w-4 h-4 text-amber-500" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                        {LAYOUT_OPTIONS.find(l => l.id === layoutStyle)?.name}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-2 bg-white border-[#E5E5EA] rounded-2xl shadow-2xl">
                                <div className="space-y-1">
                                    {LAYOUT_OPTIONS.map(layout => (
                                        <button
                                            key={layout.id}
                                            onClick={() => {
                                                setLayoutStyle(layout.id)
                                                setIsLayoutMenuOpen(false)
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                                layoutStyle === layout.id
                                                    ? "bg-accent-indigo/10 border border-accent-indigo/30"
                                                    : "hover:bg-[#F9F9FB]"
                                            )}
                                        >
                                            <span className="text-xl">{layout.icon}</span>
                                            <div>
                                                <p className="text-[13px] font-bold text-[#1D1D1F]">{layout.name}</p>
                                                <p className="text-[10px] text-[#86868B]">{layout.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="bg-gradient-to-r from-accent-indigo/10 to-accent-mint/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-accent-indigo/20">
                            <ShieldCheck className="w-4 h-4 text-accent-indigo" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-[#1D1D1F]">Acesso Seguro</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1100px] mx-auto pt-16 px-6 pb-32 overflow-visible">
                {/* Hero Status */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-indigo/10 to-accent-mint/10 rounded-full mb-8 border border-accent-indigo/20"
                    >
                        <span className="flex h-2.5 w-2.5 rounded-full bg-accent-indigo animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-accent-indigo">Projeto em Andamento</span>
                    </motion.div>

                    <h1 className="text-[42px] md:text-[56px] font-bold tracking-tight mb-6 leading-[1.1]">
                        <span className="bg-gradient-to-r from-[#1D1D1F] via-[#3d3d3f] to-[#1D1D1F] bg-clip-text text-transparent">
                            Acompanhe o progresso
                        </span>
                        <br />
                        <span className="text-[#86868B]">do seu projeto em tempo real.</span>
                    </h1>

                    {/* Progress Section - Hidden in numbered circles layout */}
                    {layoutStyle !== 'numbered' && (
                        <div className="max-w-[600px] mx-auto">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#E5E5EA]/50 mb-8">
                                <div className="flex justify-between items-end px-1 mb-4">
                                    <span className="text-[14px] font-bold text-[#86868B]">Progresso Global</span>
                                    <span className="text-[32px] font-black text-accent-indigo">{globalProgress}%</span>
                                </div>
                                <div className="h-4 bg-[#F2F2F7] rounded-full overflow-hidden mb-6">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${globalProgress}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full bg-gradient-to-r from-accent-indigo to-accent-mint rounded-full"
                                    />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-[#F9F9FB] rounded-2xl text-center">
                                        <p className="text-[24px] font-black text-[#1D1D1F]">{completedTasks}/{totalTasks}</p>
                                        <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Tarefas</p>
                                    </div>
                                    <div className="p-4 bg-[#F9F9FB] rounded-2xl text-center">
                                        <p className="text-[24px] font-black text-accent-indigo">{completedStages}/{roadmap.length}</p>
                                        <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Fases</p>
                                    </div>
                                    <div className="p-4 bg-[#F9F9FB] rounded-2xl text-center">
                                        <p className="text-[24px] font-black text-[#1D1D1F]">{currentPhaseName.substring(0, 8)}{currentPhaseName.length > 8 ? '...' : ''}</p>
                                        <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Fase Atual</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Empty State */}
                {roadmap.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Sparkles className="w-16 h-16 text-[#E5E5EA] mx-auto mb-6" />
                        <h3 className="text-[20px] font-bold text-[#1D1D1F] mb-2">Roadmap em preparação</h3>
                        <p className="text-[14px] text-[#86868B]">As fases do projeto serão exibidas aqui em breve.</p>
                    </motion.div>
                )}

                {/* Layout Views */}
                <AnimatePresence mode="wait">
                    {/* Default Timeline Layout */}
                    {layoutStyle === 'default' && roadmap.length > 0 && (
                        <motion.div
                            key="default"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative pl-12 space-y-8"
                        >
                            <div className="absolute left-[20px] top-6 bottom-0 w-[2px] bg-gradient-to-b from-accent-indigo via-[#E5E5EA] to-[#E5E5EA]" />

                            {roadmap.map((stage, idx) => {
                                const isCompleted = stage.progress === 100;
                                const isCurrent = stage.progress > 0 && stage.progress < 100;
                                const isFuture = stage.progress === 0;
                                const isExpanded = expandedStage === stage.id;

                                return (
                                    <motion.div
                                        key={stage.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={cn("relative transition-all duration-500", isFuture && "opacity-50")}
                                    >
                                        <div className={cn(
                                            "absolute -left-[56px] w-10 h-10 rounded-2xl border-4 border-[#FAFAFA] z-10 flex items-center justify-center transition-all duration-500 shadow-lg",
                                            isCompleted ? "bg-gradient-to-br from-accent-indigo to-accent-mint"
                                                : isCurrent ? "bg-accent-indigo ring-4 ring-accent-indigo/20 animate-pulse"
                                                    : "bg-[#E5E5EA]"
                                        )}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            ) : (
                                                <span className={cn("text-[14px] font-black", isCurrent ? "text-white" : "text-[#86868B]")}>{idx + 1}</span>
                                            )}
                                        </div>

                                        <motion.div
                                            className={cn(
                                                "bg-white rounded-3xl border transition-all duration-500 overflow-hidden",
                                                isCurrent ? "border-accent-indigo/30 shadow-xl shadow-accent-indigo/10" : "border-[#E5E5EA]/50 shadow-md"
                                            )}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <button onClick={() => setExpandedStage(isExpanded ? null : stage.id)} className="w-full p-6 text-left">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                                                        <h3 className={cn(
                                                            "text-[18px] font-bold tracking-tight",
                                                            isCompleted ? "text-[#1D1D1F]" : isCurrent ? "text-accent-indigo" : "text-[#86868B]"
                                                        )}>{stage.name}</h3>
                                                        {isCurrent && <span className="px-3 py-1 bg-accent-indigo text-white text-[9px] font-black uppercase tracking-widest rounded-full">Em Foco</span>}
                                                        {isCompleted && <span className="px-3 py-1 bg-accent-mint/20 text-accent-mint text-[9px] font-black uppercase tracking-widest rounded-full">Concluído</span>}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[24px] font-black text-accent-indigo">{stage.progress}%</span>
                                                        <ChevronDown className={cn("w-5 h-5 text-[#86868B] transition-transform", isExpanded && "rotate-180")} />
                                                    </div>
                                                </div>

                                                <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stage.progress}%` }} transition={{ duration: 1, delay: idx * 0.1 }} className="h-full bg-gradient-to-r from-accent-indigo to-accent-mint rounded-full" />
                                                </div>
                                                <p className="text-[12px] text-[#86868B] mt-3">{stage.tasks.filter((t: any) => t.completed).length} de {stage.tasks.length} tarefas concluídas</p>
                                            </button>

                                            <AnimatePresence>
                                                {isExpanded && stage.tasks.length > 0 && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#F2F2F7] overflow-hidden">
                                                        <div className="p-6 space-y-3">
                                                            {stage.tasks.map((task: any) => (
                                                                <div key={task.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-[#F9F9FB] transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        {task.completed ? <CheckCircle2 className="w-5 h-5 text-accent-indigo" /> : <Circle className="w-5 h-5 text-[#E5E5EA]" />}
                                                                        <span className={cn("text-[14px]", task.completed ? "text-[#1D1D1F] font-medium" : "text-[#86868B]")}>{task.title}</span>
                                                                    </div>
                                                                    {task.completed && <span className="text-[10px] font-bold text-accent-indigo uppercase tracking-wider">✓ Concluído</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Numbered Circles Layout - Horizontal Single Line */}
                    {layoutStyle === 'numbered' && roadmap.length > 0 && (
                        <motion.div
                            key="numbered"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative pb-8 -mx-6 overflow-visible"
                            style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
                        >
                            {/* Custom Cursor */}
                            <AnimatePresence>
                                {scrollDirection && cursorPosition && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="fixed z-[100] pointer-events-none flex items-center justify-center"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            left: cursorPosition.x - 40,
                                            top: cursorPosition.y - 40,
                                            borderRadius: '50%',
                                            background: 'rgba(79, 70, 229, 0.9)',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)',
                                        }}
                                    >
                                        {scrollDirection === 'left' ? (
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M15 18l-6-6 6-6" />
                                            </svg>
                                        ) : (
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 18l6-6-6-6" />
                                            </svg>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Scrollable Container - Hidden Scrollbar */}
                            <div
                                ref={scrollContainerRef}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                className="overflow-x-auto overflow-y-visible px-6 pt-[60px] pb-[100px]"
                                style={{
                                    cursor: scrollDirection ? 'none' : 'default',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                            >
                                <style jsx>{`
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>

                                <div className="relative min-w-max flex items-center justify-start py-8 px-[100px] overflow-visible" style={{ gap: '250px' }}>
                                    {/* Connecting Line - Goes through the middle of circles */}
                                    <div
                                        className="absolute h-[4px] bg-gradient-to-r from-accent-indigo via-[#E5E5EA] to-[#E5E5EA] z-0"
                                        style={{
                                            left: '100px',
                                            right: '100px',
                                            top: 'calc(50% - 35px)',
                                        }}
                                    />

                                    {/* Animated progress line overlay */}
                                    <motion.div
                                        className="absolute h-[4px] bg-gradient-to-r from-accent-indigo to-accent-mint z-0"
                                        style={{
                                            left: '100px',
                                            top: 'calc(50% - 35px)',
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${(roadmap.filter(s => s.progress === 100).length / roadmap.length) * 100}%`
                                        }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />

                                    {roadmap.map((stage, idx) => {
                                        const isCompleted = stage.progress === 100;
                                        const isCurrent = stage.progress > 0 && stage.progress < 100;

                                        return (
                                            <Popover key={stage.id}>
                                                <PopoverTrigger asChild>
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.15 }}
                                                        className="flex flex-col items-center cursor-pointer group relative z-10"
                                                    >
                                                        {/* Large Number Circle with Progress Bar */}
                                                        <motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className={cn(
                                                                "w-[200px] h-[200px] rounded-full flex items-center justify-center relative transition-all duration-500 z-10",
                                                                isCompleted
                                                                    ? "bg-accent-indigo shadow-2xl shadow-accent-indigo/40 border-none"
                                                                    : "bg-white shadow-xl border-none"
                                                            )}
                                                        >
                                                            {/* Progress Ring for stages in progress */}
                                                            {!isCompleted && (
                                                                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible">
                                                                    {/* Track Circle (Replaces static border) */}
                                                                    <circle
                                                                        cx="100" cy="100" r="97"
                                                                        fill="none"
                                                                        stroke="#E5E5EA"
                                                                        strokeWidth="6"
                                                                    />
                                                                    {/* Progress Circle */}
                                                                    <circle
                                                                        cx="100" cy="100" r="97"
                                                                        fill="none"
                                                                        stroke="var(--color-accent-indigo)"
                                                                        strokeWidth="6"
                                                                        strokeDasharray={`${(stage.progress / 100) * 610} 610`}
                                                                        strokeLinecap="round"
                                                                        className="transition-all duration-1000"
                                                                    />
                                                                </svg>
                                                            )}

                                                            <span className={cn(
                                                                "text-[80px] font-black leading-none transition-colors duration-500",
                                                                isCompleted ? "text-white" : "text-[#1D1D1F]"
                                                            )}>{idx + 1}</span>

                                                        </motion.div>

                                                        {/* Phase Name */}
                                                        <h3 className="mt-6 text-[18px] font-bold text-[#1D1D1F] text-center max-w-[200px]">
                                                            {stage.name}
                                                        </h3>

                                                        {/* Stats */}
                                                        <div className="mt-2 flex items-center gap-3 text-[13px] text-[#86868B]">
                                                            <span>{stage.tasks.length} tarefas</span>
                                                            <span className="w-1 h-1 rounded-full bg-[#86868B]" />
                                                            <span className={cn(
                                                                "font-bold",
                                                                isCompleted ? "text-accent-mint" : isCurrent ? "text-accent-indigo" : ""
                                                            )}>{stage.progress}%</span>
                                                        </div>
                                                    </motion.div>
                                                </PopoverTrigger>

                                                <PopoverContent
                                                    className="w-[320px] p-0 bg-white border-[#E5E5EA] rounded-2xl shadow-2xl overflow-visible"
                                                    sideOffset={20}
                                                    side="top"
                                                >
                                                    {/* Triangular Pin - White */}
                                                    <div
                                                        className="absolute -bottom-[16px] left-1/2 -translate-x-1/2 w-0 h-0"
                                                        style={{
                                                            borderLeft: '12px solid transparent',
                                                            borderRight: '12px solid transparent',
                                                            borderTop: '16px solid white',
                                                        }}
                                                    />

                                                    <div className="p-4 border-b border-[#F2F2F7] flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                                                            <span className="font-bold text-[14px]">{stage.name}</span>
                                                        </div>
                                                        <span className="text-[12px] text-[#86868B]">{stage.tasks.filter((t: any) => t.completed).length}/{stage.tasks.length}</span>
                                                    </div>
                                                    <div className="p-4 space-y-2 max-h-[200px] overflow-y-auto">
                                                        {stage.tasks.map((task: any) => (
                                                            <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F9FB] transition-colors">
                                                                {task.completed
                                                                    ? <CheckCircle2 className="w-4 h-4 text-accent-indigo flex-shrink-0" />
                                                                    : <Circle className="w-4 h-4 text-[#E5E5EA] flex-shrink-0" />
                                                                }
                                                                <span className={cn(
                                                                    "text-[13px]",
                                                                    task.completed && "line-through text-[#86868B]"
                                                                )}>{task.title}</span>
                                                            </div>
                                                        ))}
                                                        {stage.tasks.length === 0 && (
                                                            <p className="text-center text-[#86868B] text-[12px] italic py-4">Sem tarefas definidas</p>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Minimal Layout */}
                    {layoutStyle === 'minimal' && roadmap.length > 0 && (
                        <motion.div
                            key="minimal"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-[900px] mx-auto space-y-4"
                        >
                            {roadmap.map((stage, idx) => {
                                const isCompleted = stage.progress === 100;
                                const isExpanded = expandedStage === stage.id;

                                return (
                                    <motion.div
                                        key={stage.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <button
                                            onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                                            className="w-full flex items-center gap-6 p-6 bg-white border border-[#E5E5EA] rounded-2xl hover:border-accent-indigo/30 transition-all text-left group"
                                        >
                                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ backgroundColor: stage.color + '20', color: stage.color }}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-2">{stage.name}</h3>
                                                <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stage.progress}%` }} transition={{ duration: 1, delay: idx * 0.2 }} className="h-full bg-accent-indigo" />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[24px] font-black text-accent-indigo">{stage.progress}%</p>
                                                <p className="text-[11px] text-[#86868B]">{stage.tasks.filter((t: any) => t.completed).length}/{stage.tasks.length} tarefas</p>
                                            </div>
                                            <ArrowRight className={cn("w-5 h-5 text-[#86868B] transition-all", isExpanded ? "rotate-90" : "group-hover:text-accent-indigo")} />
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                    <div className="mt-2 p-4 bg-[#F9F9FB] rounded-2xl space-y-2">
                                                        {stage.tasks.map((task: any) => (
                                                            <div key={task.id} className="flex items-center gap-2 text-[13px]">
                                                                {task.completed ? <CheckCircle2 className="w-4 h-4 text-accent-indigo" /> : <Circle className="w-4 h-4 text-[#E5E5EA]" />}
                                                                <span className={cn(task.completed && "line-through text-[#86868B]")}>{task.title}</span>
                                                            </div>
                                                        ))}
                                                        {stage.tasks.length === 0 && <p className="text-[12px] text-[#86868B] italic text-center">Sem tarefas</p>}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Cards Glassmorphism Layout */}
                    {layoutStyle === 'cards' && roadmap.length > 0 && (
                        <motion.div
                            key="cards"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {roadmap.map((stage, idx) => {
                                const isCompleted = stage.progress === 100;
                                const isCurrent = stage.progress > 0 && stage.progress < 100;

                                return (
                                    <motion.div
                                        key={stage.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-accent-indigo/10 to-accent-mint/10 rounded-3xl" />
                                        <div className="relative p-6 backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: stage.color }}>
                                                        {idx + 1}
                                                    </div>
                                                    <h3 className="text-[16px] font-bold text-[#1D1D1F]">{stage.name}</h3>
                                                </div>
                                                {isCompleted && <CheckCircle2 className="w-6 h-6 text-accent-indigo" />}
                                            </div>

                                            <div className="mb-4">
                                                <div className="flex justify-between text-[12px] mb-2">
                                                    <span className="text-[#86868B]">Progresso</span>
                                                    <span className="font-bold text-accent-indigo">{stage.progress}%</span>
                                                </div>
                                                <div className="h-3 bg-[#F2F2F7]/50 rounded-full overflow-hidden backdrop-blur-sm">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stage.progress}%` }} transition={{ duration: 1.5, delay: idx * 0.2 }} className="h-full bg-gradient-to-r from-accent-indigo to-accent-mint rounded-full" />
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                                {stage.tasks.slice(0, 5).map((task: any) => (
                                                    <div key={task.id} className="flex items-center gap-2 text-[12px]">
                                                        {task.completed ? <CheckCircle2 className="w-3 h-3 text-accent-indigo" /> : <Circle className="w-3 h-3 text-[#E5E5EA]" />}
                                                        <span className={cn(task.completed && "line-through text-[#86868B]")}>{task.title}</span>
                                                    </div>
                                                ))}
                                                {stage.tasks.length > 5 && <p className="text-[11px] text-[#86868B]">+{stage.tasks.length - 5} mais</p>}
                                                {stage.tasks.length === 0 && <p className="text-center text-[#86868B] text-[12px] italic py-4">Nenhuma tarefa</p>}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-[#E5E5EA]/30 flex items-center justify-between">
                                                <span className="text-[11px] text-[#86868B]">{stage.tasks.filter((t: any) => t.completed).length}/{stage.tasks.length} concluídas</span>
                                                {isCompleted && <span className="text-[10px] font-bold text-accent-mint uppercase">✓ Concluída</span>}
                                                {isCurrent && <span className="text-[10px] font-bold text-accent-indigo uppercase animate-pulse">Em andamento</span>}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Timeline Horizontal Layout */}
                    {layoutStyle === 'timeline' && roadmap.length > 0 && (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="overflow-x-auto pb-8"
                        >
                            <div className="flex items-start gap-0 min-w-max py-8">
                                {roadmap.map((stage, idx) => {
                                    const isCompleted = stage.progress === 100;
                                    const isCurrent = stage.progress > 0 && stage.progress < 100;
                                    const isExpanded = expandedStage === stage.id;

                                    return (
                                        <React.Fragment key={stage.id}>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.15 }}
                                                className="flex flex-col items-center"
                                            >
                                                <button
                                                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                                                    className={cn(
                                                        "w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all cursor-pointer hover:scale-110",
                                                        isCompleted ? "bg-accent-indigo border-accent-indigo text-white"
                                                            : isCurrent ? "bg-accent-indigo/20 border-accent-indigo text-accent-indigo animate-pulse"
                                                                : "bg-white border-[#E5E5EA] text-[#86868B]"
                                                    )}
                                                >
                                                    <span className="text-3xl font-black">{idx + 1}</span>
                                                </button>
                                                <div className="mt-4 text-center max-w-[120px]">
                                                    <h4 className="text-[13px] font-bold text-[#1D1D1F]">{stage.name}</h4>
                                                    <p className="text-[11px] text-[#86868B] mt-1">{stage.progress}%</p>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 w-[200px] bg-white rounded-xl border border-[#E5E5EA] shadow-lg overflow-hidden">
                                                            <div className="p-3 space-y-2 max-h-[150px] overflow-y-auto">
                                                                {stage.tasks.map((task: any) => (
                                                                    <div key={task.id} className="flex items-center gap-2 text-[11px]">
                                                                        {task.completed ? <CheckCircle2 className="w-3 h-3 text-accent-indigo" /> : <Circle className="w-3 h-3 text-[#E5E5EA]" />}
                                                                        <span className={cn(task.completed && "line-through text-[#86868B]")}>{task.title}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>

                                            {idx < roadmap.length - 1 && (
                                                <div className="flex items-center h-24">
                                                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: idx * 0.15 + 0.1 }} className={cn("w-16 h-1 origin-left", isCompleted ? "bg-accent-indigo" : "bg-[#E5E5EA]")} />
                                                    <ArrowRight className={cn("w-5 h-5 -ml-1", isCompleted ? "text-accent-indigo" : "text-[#E5E5EA]")} />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Security */}
                <div className="mt-32 pt-12 border-t border-[#E5E5EA] text-center space-y-6">
                    <div className="flex items-center justify-center gap-8">
                        <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-[0.2em] flex items-center gap-2">
                            Powered by <span className="text-[#1D1D1F]">BRIVIO™</span>
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-[#86868B]">
                        <Lock className="w-3 h-3" />
                        <span>Esta página é protegida e destinada apenas ao cliente autorizado.</span>
                    </div>
                </div>
            </main>

            {/* Floating Actions */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-3">
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="h-14 w-14 bg-white border border-[#E5E5EA] rounded-full shadow-xl hover:scale-110 transition-transform flex items-center justify-center"
                >
                    <MessageCircle className="w-5 h-5 text-[#1D1D1F]" />
                </motion.button>
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="h-14 px-6 bg-[#1D1D1F] text-white rounded-full font-bold flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform"
                >
                    Suporte
                    <ArrowUpRight className="w-4 h-4" />
                </motion.button>
            </div>
        </div>
    )
}
