"use client"

import React, { use } from 'react'
import { Editor } from '@/components/document-editor/Editor'
import Link from 'next/link'
import { ArrowLeft, Save, Share2, MoreVertical } from 'lucide-react'

export default function EditDocumentPage({ params }: { params: Promise<{ templateId: string }> }) {
    const { templateId } = use(params)

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Top Header */}
            <header className="h-16 border-b bg-white flex items-center justify-between px-6 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/document-editor"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <h1 className="text-sm font-bold text-slate-800 tracking-tight">
                        Editor de Proposta <span className="text-slate-400 font-normal ml-2">/ {templateId}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" />
                        Compartilhar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-md shadow-indigo-100">
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden">
                <Editor templateId={templateId} />
            </div>
        </div>
    )
}
