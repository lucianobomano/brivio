"use client"

import * as React from "react"
import { WorkspaceSettings, getWorkspaceData } from "@/app/actions/settings"
import { createClient } from "@/lib/supabase/client"

interface WorkspaceContextType {
    workspace: WorkspaceSettings | null
    isLoading: boolean
    refreshWorkspace: () => Promise<void>
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({
    children,
    initialWorkspaceId
}: {
    children: React.ReactNode
    initialWorkspaceId?: string
}) {
    const [workspace, setWorkspace] = React.useState<WorkspaceSettings | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchWorkspace = React.useCallback(async (id: string) => {
        setIsLoading(true)
        try {
            const data = await getWorkspaceData(id)
            setWorkspace(data)
        } catch (error) {
            console.error("Error fetching workspace context:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        if (initialWorkspaceId) {
            fetchWorkspace(initialWorkspaceId)
        } else {
            // Fallback: try to find user's first workspace
            const supabase = createClient()
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase
                        .from('workspace_members')
                        .select('workspace_id')
                        .eq('user_id', user.id)
                        .limit(1)
                        .single()
                        .then(({ data }) => {
                            if (data?.workspace_id) {
                                fetchWorkspace(data.workspace_id)
                            } else {
                                setIsLoading(false)
                            }
                        })
                } else {
                    setIsLoading(false)
                }
            })
        }
    }, [initialWorkspaceId, fetchWorkspace])

    const refreshWorkspace = async () => {
        if (workspace?.id) {
            await fetchWorkspace(workspace.id)
        }
    }

    return (
        <WorkspaceContext.Provider value={{ workspace, isLoading, refreshWorkspace }}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export function useWorkspace() {
    const context = React.useContext(WorkspaceContext)
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider")
    }
    return context
}
