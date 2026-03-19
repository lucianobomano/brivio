"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent, BubbleMenu, ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Highlight from '@tiptap/extension-highlight'
import { Bold, Italic, List, Heading1, Heading2 } from 'lucide-react'

import { Commands } from './Commands'
import { CommandList } from './CommandList'
import { VariableExtension } from './VariableExtension'
import { DOCUMENT_TEMPLATES } from '@/lib/document-editor/templates'

interface EditorProps {
    templateId: string
}

export const Editor = ({ templateId }: EditorProps) => {
    const [clientName, setClientName] = useState('João Silva')

    const template = (DOCUMENT_TEMPLATES as any)[templateId] || DOCUMENT_TEMPLATES.branding

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Digite "/" para comandos...',
            }),
            Image,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Highlight.configure({
                multicolor: true,
            }),
            VariableExtension,
            Commands.configure({
                suggestion: {
                    render: () => {
                        let component: any
                        let popup: any

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(CommandList, {
                                    props,
                                    editor: props.editor,
                                })

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                })
                            },
                            onUpdate(props: any) {
                                component.updateProps(props)
                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                })
                            },
                            onKeyDown(props: any) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide()
                                    return true
                                }
                                return component.ref?.onKeyDown(props)
                            },
                            onExit() {
                                popup[0].destroy()
                                component.destroy()
                            },
                        }
                    },
                },
            }),
        ],
        content: template.content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[1056px] p-[20mm]',
            },
        },
    })

    // Effect to handle variable "updates"
    useEffect(() => {
        if (editor) {
            const anyEditor = editor as any
            if (anyEditor.storage?.variable) {
                anyEditor.storage.variable.values = {
                    Cliente: clientName
                }
                editor.view.dispatch(editor.state.tr)
            }
        }
    }, [editor, clientName])

    if (!editor) {
        return null
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r flex flex-col p-6 shadow-sm z-20">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Variáveis</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                            Nome do Cliente
                        </label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Digite o nome..."
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                        As variáveis marcadas com <code className="bg-indigo-50 text-indigo-600 px-1 rounded">{"{{Cliente}}"}</code> serão atualizadas no documento final.
                    </p>
                </div>
            </div>

            {/* Editor Main Canvas */}
            <div className="flex-1 overflow-y-auto flex justify-center p-12">
                <div className="relative shadow-2xl bg-white w-[210mm] min-h-[297mm] h-fit mb-12 flex flex-col overflow-hidden">

                    {editor && (
                        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                            <div className="flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-lg border border-slate-700 shadow-xl">
                                <button
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    className={`p-1.5 hover:bg-slate-800 rounded outline-none transition-colors ${editor.isActive('bold') ? 'text-indigo-400' : ''}`}
                                >
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    className={`p-1.5 hover:bg-slate-800 rounded outline-none transition-colors ${editor.isActive('italic') ? 'text-indigo-400' : ''}`}
                                >
                                    <Italic className="w-4 h-4" />
                                </button>
                                <div className="w-[1px] h-4 bg-slate-700 mx-1" />
                                <button
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                    className={`p-1.5 hover:bg-slate-800 rounded outline-none transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-indigo-400' : ''}`}
                                >
                                    <Heading1 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                    className={`p-1.5 hover:bg-slate-800 rounded outline-none transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-indigo-400' : ''}`}
                                >
                                    <Heading2 className="w-4 h-4" />
                                </button>
                            </div>
                        </BubbleMenu>
                    )}

                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    )
}
