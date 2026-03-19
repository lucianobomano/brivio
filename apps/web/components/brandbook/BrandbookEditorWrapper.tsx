"use client"

import dynamic from "next/dynamic"

const BrandbookEditor = dynamic(() => import("./BrandbookEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-full bg-[#0A0A0B] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-[#ff0054] animate-spin" />
                <span className="text-[14px] text-[#555] font-medium animate-pulse">Loading Workspace...</span>
            </div>
        </div>
    )
})

interface BrandbookModule {
    id: string
    brandbook_id: string
    title: string
    type: string
    order: number
    category: string
    content_json: Record<string, unknown>
    created_at?: string
    updated_at?: string
}

interface UserData {
    name: string
    avatar_url?: string
}

interface BrandbookEditorProps {
    initialModules: BrandbookModule[]
    brandbookId: string
    brandId: string
    brandName?: string
    isReadOnly?: boolean
    userData?: UserData | null
}

export default function BrandbookEditorWrapper(props: BrandbookEditorProps) {
    return <BrandbookEditor {...props} />
}
