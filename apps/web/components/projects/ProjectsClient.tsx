"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Layout as BoardIcon,
    Table,
    LayoutGrid,
    Calendar as CalendarIcon,
    GanttChartSquare,
    Map as MapIcon,
    Users,
    Search,
    Filter,
    ChevronDown,
    Sparkles,
    Plus,
    ArrowLeft,
    Eye,
    PanelLeft,
    Moon,
    Sun,
    Timer,
    ChevronsUpDown,
    Home,
} from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useRouter } from "nextjs-toploader/app"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ProjectListView } from "./ProjectListView"
import { ProjectBoardView } from "./ProjectBoardView"
import { ProjectGalleryView } from "./ProjectGalleryView"
import { ProjectCalendarView } from "./ProjectCalendarView"
import { ProjectGanttView } from "./ProjectGanttView"
import { ProjectMapView } from "./ProjectMapView"
import { ProjectWorkloadView } from "./ProjectWorkloadView"
import { ProjectCreateModal } from "./ProjectCreateModal"
import { ProjectStageModal } from "./ProjectStageModal"
import { ProjectDetailsModal } from "./ProjectDetailsModal"
import { ProjectGridView } from "./ProjectGridView"
import { ProjectStandardView } from "./ProjectStandardView"
import { ProjectTaskCreateModal } from "./ProjectTaskCreateModal"
import { ProjectDashboardView } from "./ProjectDashboardView"
import { ProjectOverviewView } from "./ProjectOverviewView"
import { ProjectPipelineGanttView } from "./ProjectPipelineGanttView"
import { ProjectProposalsView } from "./ProjectProposalsView"
import { ProjectContractsView } from "./ProjectContractsView"
import { ProjectBillingsView } from "./ProjectBillingsView"
import { ProjectFilesView } from "./ProjectFilesView"
import { TaskDetailsModal } from "./TaskDetailsModal"
import { getProjectRoadmap, RoadmapStage, toggleRoadmapTask } from "@/app/actions/roadmap"
import { getSprints, type Sprint } from "@/app/actions/sprints"
import {
    createProjectStage,
    updateProjectStage,
    bulkUpdateProjectCategory
} from "@/app/actions/projects"


import { GlobalSettingsView } from "../settings/GlobalSettingsView"
import { UnifiedHeader } from "@/components/layout/UnifiedHeader"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/components/providers/WorkspaceProvider"
import type { WorkspaceSettings } from "@/app/actions/settings"

export interface Project {
    id: string
    name: string
    status: string
    status_label?: string
    budget?: number
    budget_type?: string
    budget_amount?: number
    currency?: string
    progress: number
    brand?: {
        id: string
        name: string
        logo_url?: string
    }
    brand_id?: string
    workspace_id?: string
    description?: string
    priority?: string
    creator?: {
        id: string
        name: string
        avatar_url?: string
    }
    cover_url?: string
    stage_id?: string
    start_date?: string
    due_date?: string
    dependency_id?: string
    tags?: string[]
    tasks?: { id: string; title: string; completed: boolean; assignee?: { name: string } }[]
    category?: string
    type?: string
    tasks_count?: number
}

export interface Task {
    id: string
    title: string
    status: string
    completed: boolean
    cover_url?: string
    description?: string
    estimated_time?: number
    start_date?: string
    due_date?: string
    priority?: string
}

export interface Stage {
    id: string
    name: string
    color: string
}

interface AppUser {
    id: string
    email: string
    profile?: {
        name: string
        avatar_url?: string
        cover_url?: string
        profile_type?: string
    }
    creatorProfile?: {
        category: string
    }
}

interface ProjectsClientProps {
    initialProjects: Project[]
    initialStages: Stage[]
    workspaceId?: string
    initialWorkspace?: WorkspaceSettings | null
    user: AppUser | null
}

const viewNames: Record<string, string> = {
    dashboard: "Dashboard",
    padrao: "Grupo",
    list: "Tabela",
    board: "Quadro",
    gallery: "Galeria",
    calendar: "Calendário",
    gantt: "Gantt",
    map: "Mapa",
    workload: "Carga"
}

export function ProjectsClient({ initialProjects, initialStages, workspaceId, initialWorkspace, user }: ProjectsClientProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    const { workspace } = useWorkspace()

    const currentWorkspace = workspace || initialWorkspace
    const studioName = currentWorkspace?.name || user?.profile?.name || "Studio"
    const studioInitial = (studioName.trim()[0] || "S").toUpperCase()
    const studioLogo = currentWorkspace?.logo_url || currentWorkspace?.favicon_url

    React.useEffect(() => {
        setMounted(true)
    }, [])

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    // View state driven by query parameter
    const [view, setView] = React.useState((searchParams.get("view") as "dashboard" | "padrao" | "list" | "board" | "gallery" | "calendar" | "gantt" | "map" | "workload") || "dashboard")

    // Sync view with URL param
    React.useEffect(() => {
        const urlView = searchParams.get("view") as typeof view | null
        if (urlView && urlView !== view) {
            setView(urlView)
        } else if (!urlView && view !== "dashboard") {
            setView("dashboard")
        }
    }, [searchParams, view])

    // Listen to browser back/forward navigation for instant view changes
    React.useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search)
            const urlView = params.get("view") as typeof view | null
            if (urlView) {
                setView(urlView)
            } else {
                setView("dashboard")
            }
        }
        window.addEventListener("popstate", handlePopState)
        return () => window.removeEventListener("popstate", handlePopState)
    }, [])

    const handleNavClick = (itemId: string) => {
        setView(itemId as typeof view)
        setActiveProject(null)
        const params = new URLSearchParams(window.location.search)
        if (itemId === "dashboard") {
            params.delete("view")
        } else {
            params.set("view", itemId)
        }
        const newSearch = params.toString()
        const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`
        window.history.pushState(null, "", newUrl)
    }

    const SIDEBAR_NAV_ITEMS = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "padrao", label: "Grupo", icon: LayoutGrid },
        { id: "list", label: "Tabela", icon: Table },
        { id: "board", label: "Quadro", icon: BoardIcon },
        { id: "gallery", label: "Galeria", icon: LayoutGrid },
        { id: "calendar", label: "Calendário", icon: CalendarIcon },
        { id: "gantt", label: "Gantt", icon: GanttChartSquare },
        { id: "map", label: "Mapa", icon: MapIcon },
        { id: "workload", label: "Carga", icon: Users },
    ]

    const [projects, setProjects] = React.useState<Project[]>(initialProjects || [])
    const [stages, setStages] = React.useState<Stage[]>(initialStages || [])

    React.useEffect(() => {
        if (!initialProjects || initialProjects.length === 0) {
            import("@/app/actions/projects").then(({ getProjectPipeline_v2 }) => {
                getProjectPipeline_v2().then((data) => {
                    setProjects(data as Project[])
                })
            })
        } else {
            setProjects(initialProjects)
        }
    }, [initialProjects])

    React.useEffect(() => {
        if (!initialStages || initialStages.length === 0) {
            import("@/lib/supabase/client").then(({ createClient }) => {
                const supabase = createClient()
                supabase.from('workspace_members')
                    .select('workspace_id')
                    .limit(1)
                    .then(({ data }) => {
                        const wId = data?.[0]?.workspace_id
                        if (wId) {
                            supabase.from('project_stages')
                                .select('*')
                                .eq('workspace_id', wId)
                                .order('position', { ascending: true })
                                .then(({ data: stg }) => {
                                    if (stg) setStages(stg as Stage[])
                                })
                        }
                    })
            })
        }
    }, [initialStages])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isStageModalOpen, setIsStageModalOpen] = React.useState(false)
    const [editingStage, setEditingStage] = React.useState<Stage | null>(null)
    const [activeProject, setActiveProject] = React.useState<Project | null>(null)
    const [activeProjectTab, setActiveProjectTab] = React.useState<string>("overview")
    const [roadmap, setRoadmap] = React.useState<RoadmapStage[]>([])
    const [isLoadingRoadmap, setIsLoadingRoadmap] = React.useState(false)
    const [projectForDetails, setProjectForDetails] = React.useState<Project | null>(null)
    const [editingProject, setEditingProject] = React.useState<Project | null>(null)
    const [taskForDetails, setTaskForDetails] = React.useState<RoadmapStage['tasks'][0] | null>(null)
    const [sprints, setSprints] = React.useState<Sprint[]>([])
    const [categoryColors, setCategoryColors] = React.useState<Record<string, string>>({})
    // State for task creation modal
    const [isTaskCreateModalOpen, setIsTaskCreateModalOpen] = React.useState(false)
    const [selectedStageIdForTask, setSelectedStageIdForTask] = React.useState<string | undefined>(undefined)
    const [selectedDateForTask, setSelectedDateForTask] = React.useState<string | undefined>(undefined)
    const [selectedDateForProject, setSelectedDateForProject] = React.useState<string | undefined>(undefined)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

    // Direct link to a project tab (e.g. from Finanças: ?project=<id>&tab=cobrancas), opened once the projects are here
    const deepLinkDone = React.useRef(false)
    React.useEffect(() => {
        if (deepLinkDone.current) return
        const id = searchParams.get("project")
        if (!id) { deepLinkDone.current = true; return }
        const found = projects.find(p => p.id === id)
        if (!found) return
        deepLinkDone.current = true
        setActiveProject(found)
        setActiveProjectTab(searchParams.get("tab") || "overview")
    }, [projects, searchParams])

    // Sync state with props when router refreshes
    React.useEffect(() => {
        setProjects(initialProjects)
        if (activeProject) {
            const updated = initialProjects.find(p => p.id === activeProject.id)
            if (updated) setActiveProject(updated)
        }
    }, [initialProjects, activeProject])

    React.useEffect(() => {
        setStages(initialStages)
    }, [initialStages])

    // Fetch roadmap and sprints when active project changes
    React.useEffect(() => {
        async function fetchProjectData() {
            if (activeProject) {
                setIsLoadingRoadmap(true)
                try {
                    const [roadmapData, sprintsData] = await Promise.all([
                        getProjectRoadmap(activeProject.id),
                        getSprints({})
                    ])
                    setRoadmap(roadmapData)
                    setSprints(sprintsData)
                } catch (error) {
                    console.error("Error fetching project data:", error)
                    toast.error("Erro ao carregar dados do projeto")
                } finally {
                    setIsLoadingRoadmap(false)
                }
            } else {
                setRoadmap([])
                setSprints([])
            }
        }

        fetchProjectData()
    }, [activeProject, activeProject?.id])

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const refreshData = async () => {
        router.refresh()
    }

    const handleTaskSuccess = () => {
        refreshData()
        setIsTaskCreateModalOpen(false)
        setSelectedStageIdForTask(undefined)
        setSelectedDateForTask(undefined)
    }

    // Compute categories for the Board View
    const projectCategories = React.useMemo(() => {
        const uniqueCats = Array.from(new Set(projects.map(p => p.category).filter(Boolean)))
        const cats = uniqueCats.map(cat => ({
            id: cat as string,
            name: cat?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Geral',
            color: categoryColors[cat as string] || '#6366f1' // Use custom color if set
        }))

        // Ensure at least one category if none exist, or if there are projects without category
        const hasUncategorized = projects.some(p => !p.category)
        if (hasUncategorized || cats.length === 0) {
            cats.push({ id: 'uncategorized', name: 'Geral', color: '#94a3b8' })
        }
        return cats
    }, [projects, categoryColors])
    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg-0 text-text-primary font-sans">
            {/* Modals */}
            {activeProject && (
                <ProjectTaskCreateModal
                    isOpen={isTaskCreateModalOpen}
                    onClose={() => {
                        setIsTaskCreateModalOpen(false)
                        setSelectedStageIdForTask(undefined)
                        setSelectedDateForTask(undefined)
                    }}
                    onSuccess={handleTaskSuccess}
                    projectId={activeProject.id}
                    stages={roadmap.map(s => ({ id: s.id, name: s.name, color: s.color }))}
                    sprints={sprints.filter(s => !s.project_id || s.project_id === activeProject.id)}
                    initialStageId={selectedStageIdForTask}
                    initialStartDate={selectedDateForTask}
                />
            )}

            <ProjectDetailsModal
                isOpen={!!projectForDetails}
                onClose={() => setProjectForDetails(null)}
                project={projectForDetails}
                stages={stages}
                onRefresh={refreshData}
                onEdit={(p: Project) => {
                    setEditingProject(p)
                    setIsCreateModalOpen(true)
                }}
            />

            <ProjectCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setEditingProject(null)
                    setSelectedDateForProject(undefined)
                }}
                projectToEdit={editingProject}
                initialStartDate={selectedDateForProject}
                stages={stages}
                workspaceId={workspaceId}
                onSuccess={refreshData}
            />

            <ProjectStageModal
                isOpen={isStageModalOpen}
                onClose={() => {
                    setIsStageModalOpen(false)
                    setEditingStage(null)
                }}
                initialData={editingStage}
                onSuccess={async (data) => {
                    if (!workspaceId) {
                        toast.error("Erro: Workspace não encontrado")
                        return
                    }

                    // Check if we are in category view and editing a category
                    const currentView = typeof view !== 'undefined' ? view : 'board'
                    const isCategory = currentView === 'padrao' && !activeProject && projectCategories.some(c => c.id === data.id)

                    if (isCategory && data.id) {
                        const loadingToast = toast.loading(`A atualizar categoria "${data.name}"...`)
                        const slugifiedName = data.name.toLowerCase().replace(/\s+/g, '-')

                        const res = await bulkUpdateProjectCategory(data.id, slugifiedName)

                        if (res.success) {
                            setCategoryColors(prev => ({ ...prev, [slugifiedName]: data.color }))
                            toast.success(`Categoria atualizada para "${data.name}"!`, { id: loadingToast })
                            refreshData()
                        } else {
                            toast.error("Erro ao atualizar categoria", { id: loadingToast })
                        }
                    } else if (data.id) {
                        await updateProjectStage(data.id, {
                            name: data.name,
                            color: data.color
                        })
                        setStages(prev => prev.map(s => s.id === data.id ? { ...s, name: data.name, color: data.color } : s))
                        toast.success(`Etapa "${data.name}" atualizada!`)
                    } else {
                        const res = await createProjectStage({
                            workspace_id: workspaceId,
                            name: data.name,
                            color: data.color,
                            position: stages.length
                        })
                        if (res.success && res.stage) {
                            setStages(prev => [...prev, res.stage!])
                            toast.success(`Etapa "${data.name}" criada!`)
                        }
                    }
                    setIsStageModalOpen(false)
                    setEditingStage(null)
                    refreshData()
                }}
            />

            {/* ===== LEFT SIDEBAR (Styled like Image 4) ===== */}
            <aside className={cn(
                "h-screen flex flex-col shrink-0 border-r border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#09090b] transition-all duration-300 z-30 select-none shadow-xs",
                isSidebarCollapsed ? "w-[68px]" : "w-[260px]"
            )}>
                {/* Header: Studio Badge & Real Name, Moon/Sun, Collapse */}
                <div className={cn(
                    "h-14 px-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] shrink-0",
                    isSidebarCollapsed ? "justify-center px-0" : ""
                )}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-xs font-bold text-zinc-900 dark:text-white shrink-0 shadow-sm overflow-hidden">
                            {studioLogo ? (
                                <Image
                                    src={studioLogo}
                                    alt={studioName}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                studioInitial
                            )}
                        </div>
                        {!isSidebarCollapsed && (
                            <span className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 truncate tracking-tight" title={studioName}>
                                {studioName}
                            </span>
                        )}
                    </div>
                    {!isSidebarCollapsed ? (
                        <div className="flex items-center gap-0.5 shrink-0">
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                                title="Alternar tema"
                            >
                                {mounted && theme === "light" ? (
                                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                    <Moon className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <button
                                onClick={() => setIsSidebarCollapsed(true)}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                                title="Recolher barra lateral"
                            >
                                <PanelLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsSidebarCollapsed(false)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors mt-1"
                            title="Expandir barra lateral"
                        >
                            <PanelLeft className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                {!isSidebarCollapsed ? (
                    <div className="px-3 pt-3 pb-1.5 shrink-0">
                        <div className="relative flex items-center">
                            <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-white/[0.06] rounded-lg pl-8 pr-9 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/20 transition-colors"
                            />
                            <div className="absolute right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-[9px] font-mono text-zinc-500 dark:text-zinc-400 shadow-xs">
                                <span>⌘</span>
                                <span>K</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <button
                            onClick={() => setIsSidebarCollapsed(false)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
                            title="Pesquisar (⌘K)"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Middle scrollable section: Views (Image 3) + Projects */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-1">
                    {/* Primary Views (from Image 3) */}
                    {SIDEBAR_NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const isActive = view === item.id && !activeProject

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors text-left",
                                    isSidebarCollapsed ? "justify-center px-0 py-2.5" : "",
                                    isActive
                                        ? "bg-zinc-100 dark:bg-[#1c1c20] text-zinc-900 dark:text-white font-medium shadow-xs"
                                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                                )}
                                title={item.label}
                            >
                                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400")} />
                                {!isSidebarCollapsed && <span>{item.label}</span>}
                            </button>
                        )
                    })}

                    {/* Divider */}
                    <div className="my-3 border-t border-zinc-200 dark:border-white/[0.06] mx-1" />

                    {/* Projects / Clients List (Image 4) */}
                    <div className="space-y-0.5">
                        {projects.slice(0, 5).map((p, idx) => {
                            const initial = (p.name || "P")[0].toUpperCase()
                            const colors = [
                                "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
                                "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
                                "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                                "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
                                "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                            ]
                            const colorClass = colors[idx % colors.length]
                            const isSelected = activeProject?.id === p.id

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setActiveProject(p)
                                        setActiveProjectTab("overview")
                                        setView("padrao")
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                                        isSidebarCollapsed ? "justify-center px-0" : "",
                                        isSelected
                                            ? "bg-zinc-100 dark:bg-[#1c1c20] text-zinc-900 dark:text-white font-medium shadow-xs"
                                            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                                    )}
                                    title={p.name}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border shrink-0",
                                        colorClass
                                    )}>
                                        {initial}
                                    </div>
                                    {!isSidebarCollapsed && (
                                        <span className="truncate flex-1">{p.name}</span>
                                    )}
                                </button>
                            )
                        })}

                        {/* Add Client / Add Project button */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors",
                                isSidebarCollapsed ? "justify-center px-0" : ""
                            )}
                            title="Add client"
                        >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            {!isSidebarCollapsed && <span>Add client</span>}
                        </button>
                    </div>
                </div>

                {/* Bottom Section (Image 4): Free trial + Track time + User profile */}
                <div className="mt-auto border-t border-zinc-200 dark:border-white/[0.06] p-3 space-y-3 shrink-0">
                    {/* Trial banner */}
                    {!isSidebarCollapsed && (
                        <div className="space-y-1.5 px-1">
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                                14 days left on your free trial
                            </div>
                            <div className="w-full h-1 bg-zinc-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                                <div className="w-[38%] h-full bg-zinc-800 dark:bg-white/70 rounded-full" />
                            </div>
                        </div>
                    )}

                    {/* Track time */}
                    <button
                        onClick={() => router.push("/focus")}
                        className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors",
                            isSidebarCollapsed ? "justify-center px-0" : ""
                        )}
                        title="Track time"
                    >
                        <Timer className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                        {!isSidebarCollapsed && <span>Track time</span>}
                    </button>

                    {/* User profile card */}
                    <div
                        onClick={() => setIsSettingsOpen(true)}
                        className={cn(
                            "flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-zinc-200/80 dark:border-white/[0.04] cursor-pointer transition-colors shadow-xs",
                            isSidebarCollapsed ? "justify-center p-1.5" : ""
                        )}
                        title={user?.profile?.name || user?.name || "Luciano Bom-Ano"}
                    >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                            {user?.profile?.avatar_url || user?.avatar ? (
                                <Image
                                    src={user?.profile?.avatar_url || user?.avatar || ""}
                                    alt="User Avatar"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                    {(user?.profile?.name || user?.name || "L")[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        {!isSidebarCollapsed && (
                            <>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate leading-tight">
                                        {user?.profile?.name || user?.name || "Luciano Bom-Ano"}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                                        {user?.email || "lucistarlucianolusseque..."}
                                    </span>
                                </div>
                                <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ===== MAIN CONTENT AREA ===== */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-bg-0">
                {/* Unified Project Navigation Bar (when inside a project) */}
                {activeProject ? (
                    <div className="w-full flex justify-center shrink-0 z-20 mt-6 mb-2 px-6">
                        <div
                            className="flex items-center justify-between border border-zinc-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0e0e11]/95 backdrop-blur-md h-[56px] px-3.5 shadow-md dark:shadow-xl w-full max-w-[1520px] rounded-full gap-3"
                        >
                            {/* Lado Esquerdo: Info do Projeto (Imagem 1) */}
                            <div className="flex items-center gap-3 shrink-0 min-w-0 pr-4 border-r border-zinc-200 dark:border-white/[0.08]">
                                <button
                                    onClick={() => {
                                        setActiveProject(null)
                                        setActiveProjectTab("overview")
                                    }}
                                    title="Voltar aos projetos"
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>

                                {/* Ícone Quadrado do Projeto */}
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#181215] border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                    {activeProject.brand?.logo_url ? (
                                        <Image
                                            src={activeProject.brand.logo_url}
                                            alt={activeProject.name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-red-500 font-bold text-xs">
                                            {(activeProject.name || "P")[0]?.toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Título e Subtítulo */}
                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                                        {activeProject.name}
                                    </h1>
                                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 leading-tight truncate">
                                        <span>{activeProject.category || "branding"}</span>
                                        <span>·</span>
                                        <span>Design</span>
                                        <span className="text-zinc-400 dark:text-zinc-600 font-medium">···</span>
                                    </div>
                                </div>
                            </div>

                            {/* Centro: Abas de Navegação (Imagem 2) */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                                {[
                                    { id: "overview", label: "Overview" },
                                    { id: "tarefas", label: "Tarefas" },
                                    { id: "cronograma", label: "Cronograma" },
                                    { id: "propostas", label: "Propostas" },
                                    { id: "cobrancas", label: "Cobranças" },
                                    { id: "arquivos", label: "Arquivos" },
                                    { id: "contratos", label: "Contratos" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveProjectTab(tab.id)}
                                        className={cn(
                                            "px-4 h-[36px] rounded-full text-xs font-medium transition-all duration-200 font-sans whitespace-nowrap",
                                            activeProjectTab === tab.id
                                                ? "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                                                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.03]"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Lado Direito: Ação "Ver como cliente" (Imagem 1) */}
                            <div className="flex items-center shrink-0 pl-3 border-l border-zinc-200 dark:border-white/[0.08]">
                                <button
                                    onClick={() => toast.info("Modo de visualização do cliente ativado")}
                                    className="flex items-center gap-1.5 px-3.5 h-[36px] rounded-full border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-all shadow-sm"
                                >
                                    <Eye className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                    <span className="whitespace-nowrap">Ver como cliente</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-14 px-8 flex items-center justify-between border-b border-zinc-200/80 dark:border-white/[0.04] shrink-0 bg-transparent">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 font-medium">Projectos</span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-600">/</span>
                            <span className="text-xs text-zinc-900 dark:text-zinc-200 font-semibold">{viewNames[view]}</span>
                        </div>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            size="sm"
                            className="h-8 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Novo Projeto</span>
                        </Button>
                    </div>
                )}

                {/* Content View Container */}
                <div className="flex-1 overflow-y-auto p-10 pt-6 no-scrollbar relative min-h-0 bg-bg-0 pb-36">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeProject ? `project-${activeProject.id}-${view}` : `grid-${view}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {!activeProject ? (
                                (() => {
                                    const commonProps = {
                                        onRefresh: refreshData,
                                        onViewProject: (p: Project) => {
                                            setActiveProject(p)
                                            setActiveProjectTab("overview")
                                            setView("padrao")
                                        },
                                        onOpenDetails: (p: Project) => {
                                            setProjectForDetails(p)
                                        },
                                        onEdit: (p: Project) => {
                                            setEditingProject(p)
                                            setIsCreateModalOpen(true)
                                        },
                                        onAddProject: () => setIsCreateModalOpen(true)
                                    }

                                    switch (view) {
                                        case "dashboard":
                                            return (
                                                <ProjectDashboardView
                                                    projects={filteredProjects}
                                                    onViewChange={(v) => setView(v as typeof view)}
                                                />
                                            )
                                        case "padrao":
                                            return (
                                                <ProjectStandardView
                                                    {...commonProps}
                                                    projects={filteredProjects.map(p => ({
                                                        ...p,
                                                        category: p.category || 'uncategorized'
                                                    }))}
                                                    stages={projectCategories}
                                                    groupingField="category"
                                                    onEditStage={(cat) => {
                                                        setEditingStage(cat)
                                                        setIsStageModalOpen(true)
                                                    }}
                                                />
                                            )
                                        case "list":
                                            return <ProjectListView {...commonProps} projects={filteredProjects} stages={stages} />
                                        case "board":
                                            return (
                                                <ProjectBoardView
                                                    {...commonProps}
                                                    projects={filteredProjects.map(p => ({
                                                        ...p,
                                                        category: p.category || 'uncategorized'
                                                    }))}
                                                    stages={projectCategories}
                                                    groupingField="category"
                                                    onAddProject={() => setIsCreateModalOpen(true)}
                                                />
                                            )
                                        case "gallery":
                                            return <ProjectGalleryView projects={filteredProjects} onViewProject={setActiveProject} onOpenDetails={setProjectForDetails} />
                                        case "calendar":
                                            return (
                                                <ProjectCalendarView
                                                    projects={filteredProjects}
                                                    onViewProject={setActiveProject}
                                                    onOpenDetails={setProjectForDetails}
                                                    onAddTask={(date) => {
                                                        setSelectedDateForProject(date.toISOString().split('T')[0])
                                                        setIsCreateModalOpen(true)
                                                    }}
                                                />
                                            )
                                        case "gantt":
                                            return (
                                                <ProjectGanttView
                                                    {...commonProps}
                                                    projects={filteredProjects.map(p => ({
                                                        ...p,
                                                        category: p.category || 'uncategorized'
                                                    }))}
                                                    stages={projectCategories}
                                                    groupingField="category"
                                                />
                                            )
                                        case "map":
                                            return <ProjectMapView projects={filteredProjects} />
                                        case "workload":
                                            return <ProjectWorkloadView projects={filteredProjects} />
                                        default:
                                            return (
                                                <ProjectGridView
                                                    projects={filteredProjects}
                                                    onSelectProject={(p) => {
                                                        setActiveProject(p)
                                                        setActiveProjectTab("overview")
                                                        setView("padrao")
                                                    }}
                                                    onOpenDetails={setProjectForDetails}
                                                    onCreateProject={() => setIsCreateModalOpen(true)}
                                                />
                                            )
                                    }
                                })()
                            ) : (
                                <>
                                    {isLoadingRoadmap ? (
                                        <div className="h-full flex items-center justify-center">
                                            <Sparkles className="w-12 h-12 text-accent-indigo animate-pulse" />
                                        </div>
                                    ) : activeProjectTab === "overview" ? (
                                        <ProjectOverviewView
                                            project={activeProject}
                                            stages={roadmap}
                                            onNavigateTab={setActiveProjectTab}
                                            onBack={() => {
                                                setActiveProject(null)
                                                setActiveProjectTab("overview")
                                            }}
                                        />
                                    ) : activeProjectTab === "cronograma" ? (
                                        <ProjectPipelineGanttView
                                            project={activeProject}
                                            stages={roadmap}
                                            onRefresh={refreshData}
                                        />
                                    ) : activeProjectTab === "propostas" ? (
                                        <ProjectProposalsView
                                            project={activeProject}
                                        />
                                    ) : activeProjectTab === "contratos" ? (
                                        <ProjectContractsView
                                            project={activeProject}
                                        />
                                    ) : activeProjectTab === "cobrancas" ? (
                                        <ProjectBillingsView
                                            project={activeProject}
                                        />
                                    ) : activeProjectTab === "arquivos" ? (
                                        <ProjectFilesView
                                            project={activeProject}
                                        />
                                    ) : activeProjectTab !== "tarefas" ? (
                                        <div className="h-full flex items-center justify-center border border-dashed border-[#373737] rounded-[24px]">
                                            <span className="text-[#97A1B3] font-medium">Módulo {activeProjectTab} em desenvolvimento</span>
                                        </div>
                                    ) : (
                                        (() => {
                                            const totalTasks = roadmap.reduce((acc, stage) => acc + stage.tasks.length, 0)

                                            if (totalTasks === 0 && !isLoadingRoadmap) {
                                                return (
                                                    <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-bg-3 rounded-[32px] bg-bg-1/30 backdrop-blur-sm">
                                                        <div className="w-24 h-24 rounded-3xl bg-accent-indigo/5 flex items-center justify-center mb-8 border border-accent-indigo/10 shadow-inner">
                                                            <Sparkles className="w-10 h-10 text-accent-indigo/40 animate-pulse" />
                                                        </div>
                                                        <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-3">Nenhuma tarefa encontrada</h3>
                                                        <p className="text-text-secondary text-base max-w-sm text-center mb-10 leading-relaxed font-medium">
                                                            Ainda não foram criadas tarefas para este projeto. Comece a planejar o seu roteiro agora mesmo!
                                                        </p>
                                                        <Button
                                                            onClick={() => setIsTaskCreateModalOpen(true)}
                                                            className="h-14 px-12 bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-accent-indigo/20 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                            Adicionar Primeira Tarefa
                                                        </Button>
                                                    </div>
                                                )
                                            }

                                            const commonProps = {
                                                onRefresh: refreshData,
                                                isTaskMode: true,
                                                projectId: activeProject.id,
                                                onAddProject: () => setIsCreateModalOpen(true)
                                            }

                                            switch (view) {
                                                case "board":
                                                    return (
                                                        <ProjectBoardView
                                                            {...commonProps}
                                                            projects={[]}
                                                            stages={roadmap}
                                                            onAddProject={(stageId: string | undefined) => {
                                                                setSelectedStageIdForTask(stageId)
                                                                setIsTaskCreateModalOpen(true)
                                                            }}
                                                            onViewProject={() => { }}
                                                            onViewTask={(task: RoadmapStage['tasks'][0]) => setTaskForDetails(task)}
                                                        />
                                                    )
                                                case "list":
                                                    return (
                                                        <ProjectListView
                                                            {...commonProps}
                                                            projects={[]}
                                                            stages={roadmap}
                                                            onViewProject={() => { }}
                                                            onViewTask={(task) => setTaskForDetails(task)}
                                                        />
                                                    )
                                                case "padrao":
                                                    return (
                                                        <ProjectStandardView
                                                            {...commonProps}
                                                            projects={[]}
                                                            stages={roadmap}
                                                            onViewProject={() => { }}
                                                            onViewTask={(task) => setTaskForDetails(task)}
                                                            onAddTask={(stageId) => {
                                                                setSelectedStageIdForTask(stageId)
                                                                setIsTaskCreateModalOpen(true)
                                                            }}
                                                        />
                                                    )
                                                case "gallery":
                                                    return (
                                                        <ProjectGalleryView
                                                            projects={[]}
                                                            tasks={roadmap.flatMap(s => s.tasks)}
                                                            isTaskMode={true}
                                                            onViewTask={(task) => setTaskForDetails(task)}
                                                        />
                                                    )
                                                case "calendar":
                                                    return (
                                                        <ProjectCalendarView
                                                            projects={[]}
                                                            tasks={roadmap.flatMap(s => s.tasks)}
                                                            isTaskMode={true}
                                                            onViewTask={(taskId) => {
                                                                const task = roadmap.flatMap(s => s.tasks).find(t => t.id === taskId)
                                                                if (task) setTaskForDetails(task)
                                                            }}
                                                            onToggleTaskComplete={async (taskId) => {
                                                                if (activeProject) {
                                                                    await toggleRoadmapTask(taskId, activeProject.id)
                                                                    refreshData()
                                                                }
                                                            }}
                                                            onAddTask={(date) => {
                                                                setSelectedDateForTask(date.toISOString())
                                                                setIsTaskCreateModalOpen(true)
                                                            }}
                                                        />
                                                    )
                                                case "gantt":
                                                    return (
                                                        <ProjectGanttView
                                                            projects={[]}
                                                            tasks={roadmap.flatMap(s => s.tasks)}
                                                            isTaskMode={true}
                                                            stages={roadmap}
                                                            projectId={activeProject?.id || ''}
                                                            onRefresh={refreshData}
                                                            onViewTask={(task) => setTaskForDetails(task)}
                                                        />
                                                    )
                                                case "map":
                                                    return <ProjectMapView projects={filteredProjects} />
                                                case "workload":
                                                    return <ProjectWorkloadView projects={filteredProjects} />
                                                default:
                                                    return (
                                                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-bg-3 rounded-3xl bg-bg-1/50">
                                                            <Sparkles className="w-12 h-12 text-accent-indigo/20 mb-4 animate-pulse" />
                                                            <h3 className="text-text-primary font-bold text-lg">Em Desenvolvimento</h3>
                                                            <p className="text-text-secondary text-sm max-w-xs text-center mt-2">
                                                                Estamos a preparar a vista de <span className="text-accent-indigo font-bold">{viewNames[view]}</span> para uma experiência premium.
                                                            </p>
                                                            <Button
                                                                variant="outline"
                                                                className="mt-6 border-bg-3 hover:bg-bg-2 rounded-xl"
                                                                onClick={() => setView("padrao")}
                                                            >
                                                                Voltar para Vista Padrão
                                                            </Button>
                                                        </div>
                                                    )
                                            }
                                        })()
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            <ProjectTaskCreateModal
                isOpen={isTaskCreateModalOpen}
                onClose={() => setIsTaskCreateModalOpen(false)}
                projectId={activeProject?.id || ""}
                stages={roadmap}
                sprints={sprints.filter(s => !s.project_id || s.project_id === activeProject?.id)}
                onSuccess={refreshData}
                initialStartDate={selectedDateForTask}
            />



            <TaskDetailsModal
                task={taskForDetails}
                projectId={activeProject?.id || ""}
                isOpen={!!taskForDetails}
                onClose={() => setTaskForDetails(null)}
                stages={roadmap.map(s => ({ id: s.id, name: s.name, color: s.color }))}
                onRefresh={refreshData}
                sprints={sprints.filter(s => !s.project_id || s.project_id === activeProject?.id)}
            />

            <GlobalSettingsView
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div >
    )
}
