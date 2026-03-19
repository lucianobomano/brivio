"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Palette, TrendingUp, ChevronRight } from 'lucide-react'
import { DOCUMENT_TEMPLATES } from '@/lib/document-editor/templates'

export default function DocumentEditorGallery() {
    const templates = Object.values(DOCUMENT_TEMPLATES)

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                        Escolha um Template para sua Proposta
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Selecione uma base estruturada e comece a editar seu documento de forma profissional com nosso editor baseado em blocos.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {templates.map((template, index) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={`/document-editor/edit/${template.id}`}
                                className="group block bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative overflow-hidden h-full"
                            >
                                {/* Decoration */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 -mr-8 -mt-8 rounded-full group-hover:bg-indigo-100 transition-colors duration-300" />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
                                        {template.id === 'branding' && <Palette className="w-6 h-6" />}
                                        {template.id === 'marketing' && <TrendingUp className="w-6 h-6" />}
                                        {template.id === 'contract' && <FileText className="w-6 h-6" />}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {template.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                        {template.description}
                                    </p>

                                    <div className="flex items-center text-indigo-600 text-sm font-semibold gap-1">
                                        Começar a Editar
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State / Custom Info */}
                <div className="mt-20 p-8 bg-indigo-900 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
                    <div className="relative z-10 flex-1">
                        <h2 className="text-2xl font-bold mb-2">Deseja criar do zero?</h2>
                        <p className="text-indigo-200">Você também pode iniciar um documento em branco e utilizar nossos comandos de barra.</p>
                    </div>
                    <button className="relative z-10 px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                        Documento em Branco
                    </button>

                    {/* Background circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32" />
                </div>
            </div>
        </div>
    )
}
