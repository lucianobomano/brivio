"use client"

import * as React from "react"
import { useForm, type ControllerRenderProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createSprint, updateSprint, type Sprint } from "@/app/actions/sprints"

const sprintSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    goal: z.string().optional(),
    projectId: z.string().optional(),
    workspaceId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(["planned", "active", "completed"]).default("planned"),
})

type SprintFormValues = z.infer<typeof sprintSchema>

interface SprintModalProps {
    isOpen: boolean
    onClose: () => void
    sprint?: Sprint | null
    projectId?: string
    workspaceId?: string
    projects: { id: string, name: string }[]
    onSuccess?: (sprint: Sprint) => void
}

export function SprintModal({ isOpen, onClose, sprint, projectId, workspaceId, projects, onSuccess }: SprintModalProps) {
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<SprintFormValues>({
        resolver: zodResolver(sprintSchema),
        defaultValues: {
            name: "",
            goal: "",
            projectId: projectId || "",
            workspaceId: workspaceId || "",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "planned",
        },
    })

    React.useEffect(() => {
        if (sprint) {
            form.reset({
                name: sprint.name,
                goal: sprint.goal || "",
                projectId: sprint.project_id || "",
                workspaceId: sprint.workspace_id || "",
                startDate: sprint.start_date ? new Date(sprint.start_date).toISOString().split('T')[0] : "",
                endDate: sprint.end_date ? new Date(sprint.end_date).toISOString().split('T')[0] : "",
                status: sprint.status,
            })
        } else {
            form.reset({
                name: "",
                goal: "",
                projectId: projectId || "",
                workspaceId: workspaceId || "",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: "planned",
            })
        }
    }, [sprint, isOpen, projectId, workspaceId, form])

    const onSubmit = async (values: SprintFormValues) => {
        setIsLoading(true)
        try {
            if (sprint) {
                const res = await updateSprint(sprint.id, {
                    name: values.name,
                    goal: values.goal,
                    project_id: values.projectId,
                    start_date: values.startDate ? new Date(values.startDate).toISOString() : null,
                    end_date: values.endDate ? new Date(values.endDate).toISOString() : null,
                    status: values.status,
                })
                if (res.success && res.sprint) {
                    toast.success("Sprint atualizada com sucesso")
                    onSuccess?.(res.sprint)
                    onClose()
                } else {
                    toast.error("Erro ao atualizar sprint: " + res.error)
                }
            } else {
                const res = await createSprint({
                    ...values,
                    startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
                    endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
                })
                if (res.success && res.sprint) {
                    toast.success("Sprint criada com sucesso")
                    onSuccess?.(res.sprint)
                    onClose()
                } else {
                    toast.error("Erro ao criar sprint: " + res.error)
                }
            }
        } catch (error) {
            console.error(error)
            toast.error("Ocorreu um erro ao processar a sprint")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-bg-1 border-bg-3 p-0 gap-0 overflow-hidden rounded-[24px]">
                <DialogHeader className="p-6 border-b border-bg-3">
                    <DialogTitle className="text-xl font-bold text-text-primary">
                        {sprint ? "Editar Sprint" : "Nova Sprint"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Nome da Sprint</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="ex: Sprint 1 - Discovery" className="bg-bg-0 border-bg-3 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="goal"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Objetivo</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Qual o objetivo desta sprint?" className="bg-bg-0 border-bg-3 rounded-xl min-h-[100px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Data Início</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-bg-0 border-bg-3 rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Data Fim</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-bg-0 border-bg-3 rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="projectId"
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Projeto</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-bg-0 border-bg-3 rounded-xl">
                                                    <SelectValue placeholder="Selecione um projeto" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-bg-1 border-bg-3 rounded-xl">
                                                {projects.map((p) => (
                                                    <SelectItem key={p.id} value={p.id} className="cursor-pointer hover:bg-bg-2">
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-bg-0 border-bg-3 rounded-xl">
                                                    <SelectValue placeholder="Selecione o status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-bg-1 border-bg-3 rounded-xl">
                                                <SelectItem value="planned" className="cursor-pointer hover:bg-bg-2">Planeado</SelectItem>
                                                <SelectItem value="active" className="cursor-pointer hover:bg-bg-2 text-blue-500 font-bold">Ativo</SelectItem>
                                                <SelectItem value="completed" className="cursor-pointer hover:bg-bg-2 text-green-500 font-bold">Concluído</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-6 border-t border-bg-3">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-xl px-8 shadow-lg shadow-accent-indigo/20">
                                {isLoading ? "A guardar..." : (sprint ? "Guardar Alterações" : "Criar Sprint")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
