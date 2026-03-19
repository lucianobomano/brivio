"use client"

import * as React from "react"
import Link from "next/link"
import { Share2, Heart, Eye, MessageSquare, Info, Users, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"

interface Project {
    id: string | number
    title: string
    category: string
    description: string
    stats: { views: string | number, appreciates: string | number, comments: string | number }
    images: string[]
    tools: { name: string, icon: any }[]
    credits: { role: string, name: string }[]
    tags: string[]
}

interface ProjectCreator {
    id: string
    name: string
    avatar: string
    location: string
    isPro: boolean
}

export function ProjectDetailClient({
    initialProject,
    initialCreator
}: {
    initialProject: Project,
    initialCreator: ProjectCreator
}) {
    const project = initialProject
    const creator = initialCreator

    const [isAppreciated, setIsAppreciated] = React.useState(false)
    const [isFollowing, setIsFollowing] = React.useState(false)

    return (
        <div className="flex-1 overflow-y-auto bg-bg-0 text-text-primary font-inter-tight">
            {/* Behance-style Top Bar */}
            <div className="fixed top-[81px] left-0 right-0 h-[72px] bg-bg-0/90 backdrop-blur-xl border-b border-bg-3 z-50 flex items-center justify-between px-[55px]">
                <div className="flex items-center gap-4">
                    <Link href={`/creators/${creator.id}`} className="group flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-indigo to-accent-mint flex items-center justify-center text-[12px] font-black text-white shadow-lg group-hover:scale-105 transition-transform">
                            {creator.avatar}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-text-primary group-hover:text-accent-indigo transition-colors">{creator.name}</span>
                            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-tight">{creator.location}</span>
                        </div>
                    </Link>
                    <div className="h-6 w-[1px] bg-bg-3 mx-2" />
                    <button
                        onClick={() => setIsFollowing(!isFollowing)}
                        className={cn(
                            "text-[13px] font-bold transition-colors",
                            isFollowing ? "text-text-tertiary" : "text-accent-indigo hover:text-accent-indigo/80"
                        )}
                    >
                        {isFollowing ? "Following" : "Follow"}
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-6 mr-6">
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-text-tertiary" />
                            <span className="text-[13px] font-bold text-text-secondary">{project.stats.views}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Heart className={cn("w-4 h-4", isAppreciated ? "fill-red-500 text-red-500" : "text-text-tertiary")} />
                            <span className="text-[13px] font-bold text-text-secondary">{project.stats.appreciates}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-text-tertiary" />
                            <span className="text-[13px] font-bold text-text-secondary">{project.stats.comments}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAppreciated(!isAppreciated)}
                            className={cn(
                                "h-[42px] px-6 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all",
                                isAppreciated
                                    ? "bg-red-500 text-white shadow-lg"
                                    : "bg-text-primary text-bg-0 hover:bg-text-secondary"
                            )}
                        >
                            <Heart className={cn("w-4 h-4", isAppreciated && "fill-white")} />
                            {isAppreciated ? "Appreciated" : "Appreciate"}
                        </button>
                        <button className="h-[42px] w-[42px] rounded-full border border-bg-3 flex items-center justify-center text-text-secondary hover:bg-bg-1 transition-colors">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto pt-[72px]">
                {/* Project Header */}
                <div className="py-24 px-[55px] text-center">
                    <h1 className="text-[64px] font-bold tracking-tight text-text-primary mb-6">{project.title}</h1>
                    <div className="flex items-center justify-center gap-3 mb-12">
                        {project.tags.map(tag => (
                            <span key={tag} className="px-4 py-1.5 bg-bg-1 border border-bg-3 rounded-full text-[12px] font-bold text-text-tertiary uppercase tracking-widest">{tag}</span>
                        ))}
                    </div>
                    <p className="max-w-3xl mx-auto text-[18px] text-text-secondary leading-relaxed font-medium">
                        {project.description}
                    </p>
                </div>

                {/* Behance-Style Image Stack */}
                <div className="space-y-4 px-4 sm:px-10 lg:px-20 mb-32">
                    {project.images.map((img, idx) => (
                        <div key={idx} className={cn("w-full aspect-video rounded-[8px] overflow-hidden border border-bg-3 relative")}>
                            {img.startsWith('http') ? (
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className={cn("w-full h-full", img)} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Project Details Footer */}
                <div className="px-[55px] pb-40 grid grid-cols-1 md:grid-cols-12 gap-20">
                    <div className="md:col-span-8 space-y-20">
                        <section>
                            <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Project Info
                            </h3>
                            <p className="text-[16px] text-text-secondary leading-relaxed">
                                {project.description}
                            </p>
                        </section>

                        <section className="pt-10 border-t border-bg-3">
                            <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Credits
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {project.credits.map((credit, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <span className="text-[12px] font-bold text-text-tertiary uppercase tracking-tight">{credit.role}</span>
                                        <span className="text-[15px] font-bold text-text-primary">{credit.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="md:col-span-4 space-y-12">
                        <section className="p-8 bg-bg-1/50 rounded-[24px] border border-bg-3">
                            <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                Tools Used
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {project.tools.map((tool, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-bg-2 border border-bg-3 rounded-xl group hover:border-accent-indigo/50 transition-all">
                                        {tool.icon && <tool.icon className="w-4 h-4 text-text-secondary group-hover:text-accent-indigo transition-colors" />}
                                        <span className="text-[13px] font-bold text-text-primary">{tool.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="flex flex-col gap-4">
                            <button className="w-full h-[54px] bg-accent-indigo text-white rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all font-bold text-[14px]">
                                Follow {creator.name}
                            </button>
                            <Link href="/community" className="w-full h-[54px] border border-bg-3 text-text-primary rounded-xl hover:bg-bg-1 transition-all font-bold text-[14px] flex items-center justify-center">
                                More Projects
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
