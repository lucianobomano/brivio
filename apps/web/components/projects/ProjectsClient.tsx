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
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
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
    user: AppUser | null
}

const viewNames: Record<string, string> = {
    dashboard: "Dashboard",
    padrao: "Padrão",
    list: "Lista",
    board: "Quadro",
    gallery: "Galeria",
    calendar: "Calendário",
    gantt: "Gantt",
    map: "Mapa",
    workload: "Carga de Trabalho"
}

export function ProjectsClient({ initialProjects, initialStages, workspaceId, user }: ProjectsClientProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

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

    const [projects, setProjects] = React.useState(initialProjects)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isStageModalOpen, setIsStageModalOpen] = React.useState(false)
    const [editingStage, setEditingStage] = React.useState<Stage | null>(null)
    const [stages, setStages] = React.useState<Stage[]>(initialStages)
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
        <div className="flex flex-col h-full bg-bg-0">

            {
                activeProject && (
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
                )
            }

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

            {/* ===== NEW GLOBAL HEADER (From Dashboard) ===== */}
            <UnifiedHeader
                user={user}
                onAddClick={() => setIsCreateModalOpen(true)}
                addLabel="Add project"
                onSecondaryAddClick={() => setIsStageModalOpen(true)}
                secondaryAddLabel="Criar Etapa"
                onSettingsClick={() => setIsSettingsOpen(true)}
            />

            {/* ===== NEW PROJECT NAVIGATION BAR ===== */}
            {
                activeProject && (
                    <div className="w-full flex justify-center shrink-0 z-20 mt-8">
                        <div
                            className="flex items-center border border-[#373737] bg-[#16171C] h-[60px] px-2"
                            style={{ width: "1520px", borderRadius: "100px", gap: "8px" }}
                        >
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
                                        "px-6 h-[44px] rounded-[100px] text-[16px] font-medium transition-all duration-300 font-inter",
                                        activeProjectTab === tab.id
                                            ? "bg-[#2E313C] text-white"
                                            : "text-[#97A1B3] hover:text-white"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col pt-8">
                {/* Secondary Navigation (Filters and Views) */}
                {/* Secondary Navigation (Filters and Views) - Hidden on Dashboard and when NOT on Tasks tab within a project */}
                {(!activeProject || activeProjectTab === "tarefas") && (
                    <div className="px-10 mb-6 shrink-0">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                {activeProject && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveProject(null)}
                                        className="h-11 px-4 rounded-[8px] text-[10px] font-black uppercase tracking-tight hover:bg-bg-2 border border-bg-3 gap-2"
                                    >
                                        <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                                        Voltar
                                    </Button>
                                )}
                                <div className="bg-bg-1 border border-bg-3 p-1.5 rounded-[8px] flex items-center shadow-sm">
                                    <Tabs
                                        value={view}
                                        onValueChange={(v) => {
                                            if (v === 'dashboard') {
                                                router.push('/projects')
                                            } else {
                                                router.push(`/projects?view=${v}`)
                                            }
                                            setView(v as typeof view)
                                        }}
                                        className="bg-transparent border-none"
                                    >
                                        <TabsList className="bg-transparent p-0 border-none h-11 gap-1 flex justify-start overflow-x-auto no-scrollbar">
                                            <TabsTrigger value="dashboard" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <BoardIcon className="w-3.5 h-3.5" />
                                                Dashboard
                                            </TabsTrigger>
                                            <TabsTrigger value="padrao" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <LayoutGrid className="w-3.5 h-3.5" />
                                                Home
                                            </TabsTrigger>
                                            <TabsTrigger value="list" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <Table className="w-3.5 h-3.5" />
                                                Tabela
                                            </TabsTrigger>
                                            <TabsTrigger value="board" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <BoardIcon className="w-3.5 h-3.5" />
                                                Quadro
                                            </TabsTrigger>
                                            <TabsTrigger value="gallery" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <LayoutGrid className="w-3.5 h-3.5" />
                                                Galeria
                                            </TabsTrigger>
                                            <TabsTrigger value="calendar" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                Calendário
                                            </TabsTrigger>
                                            <TabsTrigger value="gantt" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <GanttChartSquare className="w-3.5 h-3.5" />
                                                Gantt
                                            </TabsTrigger>
                                            <TabsTrigger value="map" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <MapIcon className="w-3.5 h-3.5" />
                                                Mapa
                                            </TabsTrigger>
                                            <TabsTrigger value="workload" className="px-5 h-9 rounded-[8px] text-[18px] font-[300] tracking-tight transition-all flex items-center gap-2 data-[state=active]:bg-accent-indigo data-[state=active]:text-white">
                                                <Users className="w-3.5 h-3.5" />
                                                Carga
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-end gap-3">
                                <div className="relative max-w-md w-full">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-bg-1 border border-bg-3 rounded-[8px] pl-12 pr-6 h-12 text-[11px] font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo/50 transition-all shadow-sm"
                                    />
                                </div>
                                <Button variant="outline" className="h-12 px-6 border-bg-3 hover:bg-bg-2 rounded-[8px] text-[11px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2 bg-bg-1 shadow-sm group">
                                    <Filter className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                    Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content View Container */}
                <div className="flex-1 overflow-y-auto p-10 pt-6 no-scrollbar relative min-h-0 bg-bg-0">
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
                                                        />
                                                    )
                                                case "padrao":
                                                    return (
                                                        <ProjectStandardView
                                                            {...commonProps}
                                                            projects={[]}
                                                            stages={roadmap}
                                                            onViewProject={() => { }}
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
