import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { BookOpen, FolderOpen, Layers, Settings, ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function BrandOverviewPage({ params }: { params: Promise<{ brandId: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { brandId } = await params

    const { data: brand, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

    if (error || !brand) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-0 text-white">
                Brand not found
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg-0 text-white flex flex-col">
            <Navbar />
            <main className="flex-1">
                {/* Brand Header */}
                <div className="h-48 bg-bg-2 relative">
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundColor: brand.primary_color || '#4F46E5' }}
                    />
                    <div className="absolute -bottom-10 left-8 flex items-end">
                        <div className="w-24 h-24 rounded-xl bg-bg-1 border-4 border-bg-0 shadow-lg flex items-center justify-center overflow-hidden">
                            {brand.logo_url ? (
                                <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold">{brand.name.substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="ml-4 mb-3">
                            <h1 className="text-3xl font-bold">{brand.name}</h1>
                            <div className="flex items-center text-sm text-text-secondary mt-1 space-x-2">
                                <span>Managed by Workspace</span>
                                <span className="w-1 h-1 rounded-full bg-text-secondary" />
                                <span className="capitalize text-success">{brand.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-8 flex space-x-3">
                        <Link href={`/brand/${brandId}/settings`}>
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                                <Settings className="w-4 h-4 mr-2" /> Settings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Content */}
                {/*
                  - [x] Database Schema Setup <!-- id: 23 -->
                    - [x] Create `proposal_modules` table <!-- id: 24 -->
                    - [x] Add `is_custom_builder` flag to `proposals` table <!-- id: 25 -->
                  - [x] Component Duplication & Adaptation <!-- id: 26 -->
                    - [x] Duplicate `components/brandbook` to `components/proposals/builder` <!-- id: 27 -->
                    - [x] Adapt `ProposalEditor.tsx` (renamed from `BrandbookEditor.tsx`) <!-- id: 28 -->
                    - [x] Update types and context to handle Proposal data <!-- id: 29 -->
                  - [x] Server Actions Implementation <!-- id: 30 -->
                    - [x] Create `app/actions/proposal-builder.ts` with reorder/add module logic <!-- id: 31 -->
                  - [x] Route Setup <!-- id: 32 -->
                    - [x] Create `app/proposals/[id]/builder/page.tsx` <!-- id: 33 -->
                    - [/] Integrate with `ProjectProposalsView.tsx` to allow opening the builder <!-- id: 34 -->
                */}
                <div className="p-8 pt-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Quick Action: Brandbook */}
                        <Link href={`/brand/${brandId}/brandbook`}>
                            <div className="bg-bg-1 border border-bg-3 rounded-xl p-6 hover:border-accent-indigo transition-colors group h-full">
                                <div className="w-12 h-12 bg-accent-indigo/10 rounded-lg flex items-center justify-center mb-4 text-accent-indigo group-hover:bg-accent-indigo group-hover:text-white transition-colors">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Brandbook</h3>
                                <p className="text-text-secondary text-sm mb-4">
                                    Access and edit the living brand guidelines. Typography, colors, logos and more.
                                </p>
                                <span className="text-sm font-medium text-accent-indigo flex items-center">
                                    Open Editor <ExternalLink className="w-4 h-4 ml-2" />
                                </span>
                            </div>
                        </Link>

                        {/* Quick Action: Asset Hub */}
                        <Link href={`/brand/${brandId}/assets`}>
                            <div className="bg-bg-1 border border-bg-3 rounded-xl p-6 hover:border-accent-blue transition-colors group h-full">
                                <div className="w-12 h-12 bg-accent-blue/10 rounded-lg flex items-center justify-center mb-4 text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Asset Hub</h3>
                                <p className="text-text-secondary text-sm mb-4">
                                    Centralized library for all brand files. Smart tagging and AI organization.
                                </p>
                                <span className="text-sm font-medium text-accent-blue flex items-center">
                                    Browse Assets <ExternalLink className="w-4 h-4 ml-2" />
                                </span>
                            </div>
                        </Link>

                        {/* Quick Action: Projects */}
                        <Link href={`/brand/${brandId}/projects`}>
                            <div className="bg-bg-1 border border-bg-3 rounded-xl p-6 hover:border-accent-info transition-colors group h-full">
                                <div className="w-12 h-12 bg-accent-info/10 rounded-lg flex items-center justify-center mb-4 text-accent-info group-hover:bg-accent-info group-hover:text-white transition-colors">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Projects & Tasks</h3>
                                <p className="text-text-secondary text-sm mb-4">
                                    Manage creative workflows, campaigns and design tasks for this brand.
                                </p>
                                <span className="text-sm font-medium text-accent-info flex items-center">
                                    View Roadmap <ExternalLink className="w-4 h-4 ml-2" />
                                </span>
                            </div>
                        </Link>

                    </div>

                    {/* TODO: Recent Brand Activity Section could go here */}
                </div>
            </main>
        </div>
    )
}
