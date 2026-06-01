import sys

filepath = r"e:\Users\PC\Documents\ANTIGRAVITY\BRIVIO\brivio\apps\web\app\roadmap\RoadmapClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Imports
imports_target = """import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input\""""
imports_replacement = """import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ProjectNotesPanel } from "@/components/roadmap/ProjectNotesPanel"
import { Input } from "@/components/ui/input\""""
if imports_target in content:
    content = content.replace(imports_target, imports_replacement)
else:
    print("Failed to replace imports")

# Replace Lucide imports
lucide_target = """    Trash2,
    ChevronDown,
    ArrowLeft
} from "lucide-react\""""
lucide_replacement = """    Trash2,
    ChevronDown,
    ArrowLeft,
    MessageSquare
} from "lucide-react\""""
if lucide_target in content:
    content = content.replace(lucide_target, lucide_replacement)

# Replace Props Interface
props_target = """interface RoadmapClientProps {
    initialProjects: ProjectBase[]
    initialRoadmap: RoadmapStage[]
    selectedProjectId: string | null
    selectedProject: ProjectBase | null
}"""
props_replacement = """interface RoadmapClientProps {
    initialProjects: ProjectBase[]
    initialRoadmap: RoadmapStage[]
    selectedProjectId: string | null
    selectedProject: ProjectBase | null
    initialNotes?: any[]
}"""
if props_target in content:
    content = content.replace(props_target, props_replacement)

# Replace Function Signature and State
func_target = """export function RoadmapClient({
    initialProjects,
    initialRoadmap,
    selectedProjectId,
    selectedProject
}: RoadmapClientProps) {
    const [roadmap, setRoadmap] = React.useState<RoadmapStage[]>(initialRoadmap)
    const [isLoading, setIsLoading] = React.useState(false)
    const [currentSelectedProject, setCurrentSelectedProject] = React.useState(selectedProject)"""
func_replacement = """export function RoadmapClient({
    initialProjects,
    initialRoadmap,
    selectedProjectId,
    selectedProject,
    initialNotes = []
}: RoadmapClientProps) {
    const [roadmap, setRoadmap] = React.useState<RoadmapStage[]>(initialRoadmap)
    const [isLoading, setIsLoading] = React.useState(false)
    const [currentSelectedProject, setCurrentSelectedProject] = React.useState(selectedProject)
    const [isNotesOpen, setIsNotesOpen] = React.useState(false)"""
if func_target in content:
    content = content.replace(func_target, func_replacement)

# Replace Header Button
header_btn_target = """                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    className="bg-bg-1 border-bg-3 rounded-xl hover:bg-bg-2 flex items-center gap-2 h-11"
                                >
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                    Templates
                                </Button>
                                <Button
                                    variant="outline\""""
header_btn_replacement = """                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    className="bg-bg-1 border-bg-3 rounded-xl hover:bg-bg-2 flex items-center gap-2 h-11"
                                >
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                    Templates
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsNotesOpen(true)}
                                    className="bg-bg-1 border-bg-3 rounded-xl hover:bg-bg-2 flex items-center gap-2 h-11 relative"
                                    title="Notas do Projeto"
                                >
                                    <MessageSquare className="w-4 h-4 text-text-secondary" />
                                    {initialNotes.length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF0055] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                            {initialNotes.length}
                                        </span>
                                    )}
                                </Button>
                                <Button
                                    variant="outline\""""
if header_btn_target in content:
    content = content.replace(header_btn_target, header_btn_replacement)

# Append Panel before </main></div>
panel_target = """            </main>
        </div>
    )
}"""
panel_replacement = """                {/* Notas do Projeto */}
                {selectedProjectId && (
                    <ProjectNotesPanel
                        projectId={selectedProjectId}
                        initialNotes={initialNotes}
                        isClientView={false}
                        isOpen={isNotesOpen}
                        onClose={() => setIsNotesOpen(false)}
                    />
                )}
            </main>
        </div>
    )
}"""
if panel_target in content:
    content = content.replace(panel_target, panel_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully updated RoadmapClient.tsx")
