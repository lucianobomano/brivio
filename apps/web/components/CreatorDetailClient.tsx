"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Share2, Globe, ArrowRight, Check, Plus, Instagram, Twitter, Facebook, Linkedin, Clock, RotateCcw, Send, X } from "lucide-react"
import { SiBehance } from "react-icons/si"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ProjectViewerModal } from "./ProjectViewerModal"
import { FloatingMenu } from "./layout/FloatingMenu"

interface Project {
    id: string
    title: string
    category: string
    image: string
    awards: string[]
    content_json?: any[]
}

interface Service {
    id: string | number
    title: string
    description: string
    price: string
    delivery: string
    image: string
}

interface Creator {
    id: string
    name: string
    isPro: boolean
    location: string
    website: string
    category: string
    type: string
    country: string
    awards: { p: string, w: string, l: string, s: string }
    avatar: string | null
    initials: string
    featuredImage: string
    bio: string
    about: string
    skills: string[]
    tools: any[]
    experience: any[]
    languages: any[]
    education: any[]
}

export function CreatorDetailClient({
    initialCreator,
    initialProjects = [],
    initialServices = []
}: {
    initialCreator: Creator,
    initialProjects?: Project[],
    initialServices?: Service[]
}) {
    const creator = initialCreator
    const creatorProjects = initialProjects
    const creatorServices = initialServices

    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [selectedService, setSelectedService] = useState<any>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'projects' | 'services' | 'profile'>('projects')
    const [isFollowing, setIsFollowing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-bg-0 text-text-primary font-inter-tight relative">
            {/* Top Navigation Strip */}
            <div className="px-[55px] py-4 border-b border-bg-3 flex items-center justify-between bg-bg-0/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    <Link href="/creators-pool" className="text-[13px] font-bold text-text-secondary hover:text-text-primary transition-colors">
                        Creators Pool
                    </Link>
                    <div className="h-4 w-[1px] bg-bg-3" />
                    <span className="text-[13px] font-bold text-text-primary uppercase tracking-widest">{creator.name}</span>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-bg-1 rounded-full transition-colors border border-bg-3">
                        <Share2 className="w-4 h-4 text-text-tertiary" />
                    </button>
                    <button className="p-2 hover:bg-bg-1 rounded-full transition-colors border border-bg-3 text-text-tertiary group">
                        <Globe className="w-4 h-4 group-hover:text-text-primary transition-colors" />
                    </button>
                </div>
            </div>

            <main className="max-w-[1920px] mx-auto pb-48">
                {/* Hero section */}
                <div className="flex flex-col items-center py-40 text-center px-[55px]">
                    <div className="w-24 h-24 rounded-full bg-bg-1 border border-bg-3 flex items-center justify-center text-2xl font-bold text-text-secondary mb-12 shadow-2xl relative">
                        <div className="w-full h-full bg-gradient-to-tr from-bg-2 to-bg-0 flex items-center justify-center text-text-secondary rounded-full overflow-hidden">
                            {creator.avatar ? (
                                <Image src={creator.avatar} alt={creator.name} width={96} height={96} className="w-full h-full object-cover" />
                            ) : (
                                creator.initials
                            )}
                        </div>
                        {creator.isPro && (
                            <div className="absolute -bottom-2 right-0 bg-accent-indigo text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                                Pro
                            </div>
                        )}
                    </div>

                    <h1 className="text-[12vw] lg:text-[180px] font-normal tracking-[-0.04em] text-text-primary mb-6 uppercase leading-[0.8] font-inter-tight">
                        {creator.name}
                    </h1>

                    <p className="text-[18px] font-semibold text-text-secondary mb-12 tracking-tight">
                        {creator.location}
                    </p>

                    {/* Stats Desk */}
                    <div className="border border-bg-3 rounded-2xl overflow-hidden flex items-center bg-bg-1/50 backdrop-blur-sm shadow-xl mb-12">
                        {[
                            { label: "Works", val: creator.awards.p },
                            { label: "SOTY", val: "00" },
                            { label: "SOTM", val: "02" },
                            { label: "SOTD", val: creator.awards.w },
                            { label: "HM", val: creator.awards.l },
                        ].map((stat, idx) => (
                            <div key={idx} className={cn(
                                "flex flex-col items-center px-10 py-6",
                                idx !== 4 && "border-r border-bg-3"
                            )}>
                                <span className="text-[24px] font-black text-text-primary mb-1">{stat.val}</span>
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Follow and Socials */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsFollowing(!isFollowing)}
                            className={cn(
                                "h-[54px] px-8 rounded-full text-[14px] font-bold transition-all flex items-center gap-2",
                                isFollowing
                                    ? "bg-bg-3 text-text-primary border border-bg-3"
                                    : "bg-text-primary text-bg-0 hover:scale-105"
                            )}
                        >
                            {isFollowing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isFollowing ? "Following" : "Follow"}
                        </button>

                        <div className="flex items-center gap-2 ml-4">
                            {[Twitter, Instagram, SiBehance, Facebook, Linkedin].map((Icon, idx) => (
                                <button key={idx} className="w-[54px] h-[54px] rounded-full border border-bg-3 flex items-center justify-center text-text-secondary hover:bg-bg-1 hover:text-text-primary transition-all">
                                    <Icon className="w-5 h-5 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-[55px] pt-24 border-t border-bg-3">
                    <div className="flex flex-col items-center mb-24 text-center">
                        <h2 className="text-[42px] font-normal tracking-[-0.02em] text-text-primary mb-4 font-inter-tight">
                            {activeTab === 'projects' ? "See a collection of our best work below" : activeTab === 'services' ? "Customized services for your brand" : "Information about the creator"}
                        </h2>
                        <div className="w-12 h-[2px] bg-accent-indigo rounded-full" />
                    </div>

                    {/* Projects Grid */}
                    {activeTab === 'projects' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {creatorProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => setSelectedProject(project)}
                                        className="flex flex-col group cursor-pointer"
                                    >
                                        <div className="aspect-[1.25/1] bg-bg-1 rounded-[32px] mb-8 overflow-hidden transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-2xl border border-bg-3 relative">
                                            {project.image?.startsWith('http') ? (
                                                <Image src={project.image} alt={project.title} width={600} height={480} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className={cn("w-full h-full transition-transform duration-700 group-hover:scale-110", project.image)} />
                                            )}

                                            {/* Project Badges on Card */}
                                            <div className="absolute top-6 right-6 flex flex-col gap-2">
                                                {project.awards.map(award => (
                                                    <div key={award} className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/20">
                                                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">{award}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-500">
                                                    <ArrowRight className="w-6 h-6" />
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-[24px] font-bold text-text-primary group-hover:text-accent-indigo transition-colors px-2 mb-1">{project.title}</h3>
                                        <p className="text-[14px] text-text-secondary px-2">{project.category}</p>
                                    </div>
                                ))}
                            </div>
                            {creatorProjects.length === 0 && (
                                <div className="py-24 text-center">
                                    <p className="text-text-tertiary font-bold uppercase tracking-widest text-[13px]">No projects showcased yet.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Services Grid */}
                    {activeTab === 'services' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {creatorServices.map((service: any) => (
                                    <div
                                        key={service.id}
                                        className="bg-bg-1 border border-bg-3 rounded-[32px] flex flex-col group hover:border-accent-indigo/30 transition-all duration-500 hover:shadow-2xl relative overflow-hidden h-[570px] w-full max-w-[438px] mx-auto"
                                    >
                                        {/* Banner Logic - 240px */}
                                        <div className="h-[240px] relative w-full overflow-hidden shrink-0 border-b border-bg-3">
                                            {service.cover_url ? (
                                                <Image src={service.cover_url} alt={service.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : service.projects && service.projects.length > 0 ? (
                                                <div className="flex h-full w-full">
                                                    {service.projects.slice(0, 3).map((p: any, idx: number) => (
                                                        <div key={p.project?.id || idx} className="h-full flex-1 border-r border-bg-3 last:border-r-0 relative">
                                                            <Image
                                                                src={p.project?.cover_url || "/placeholder-service.jpg"}
                                                                alt={p.project?.name || "Project cover"}
                                                                fill
                                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className={cn("w-full h-full bg-gradient-to-br opacity-60", service.image || "from-bg-2 to-bg-3")} />
                                            )}
                                        </div>

                                        <div className="p-8 flex flex-col flex-1">
                                            <h3 className="text-[22px] font-black text-text-primary mb-3 group-hover:text-accent-indigo transition-colors line-clamp-1">{service.title}</h3>
                                            <p className="text-[14px] text-text-secondary mb-6 line-clamp-3 leading-relaxed flex-1">
                                                {service.description}
                                            </p>

                                            <div className="space-y-4 pt-6 mt-auto border-t border-bg-2/50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Price</span>
                                                    <span className="text-[15px] font-black text-text-primary">{service.price}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Delivery</span>
                                                    <span className="text-[15px] font-black text-text-primary">{service.delivery}</span>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setSelectedService(service)
                                                        setIsDetailModalOpen(true)
                                                    }}
                                                    className="mt-2 w-full h-[40px] bg-accent-pink/10 hover:bg-accent-pink/20 border border-accent-pink/20 text-accent-pink rounded-full flex items-center justify-center gap-2 group/btn transition-all duration-300 font-bold text-[13px]"
                                                >
                                                    <span>Ver detalhes</span>
                                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {creatorServices.length === 0 && (
                                <div className="py-24 text-center">
                                    <p className="text-text-tertiary font-bold uppercase tracking-widest text-[13px]">No services offered yet.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Profile Section */}
                    {activeTab === 'profile' && (
                        <div className="max-w-[1200px] mx-auto py-12">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                                {/* Left Column: About & Experience */}
                                <div className="lg:col-span-7 space-y-24">
                                    <section>
                                        <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-8">About</h3>
                                        <p className="text-[20px] text-text-primary leading-relaxed font-medium whitespace-pre-line">
                                            {creator.about}
                                        </p>
                                    </section>

                                    <section className="pt-12">
                                        <h3 className="text-[12px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-8">Experience</h3>
                                        <div className="space-y-8">
                                            {creator.experience?.map((exp, idx) => (
                                                <div key={idx} className="flex items-start justify-between group">
                                                    <div>
                                                        <h4 className="text-[18px] font-bold text-text-primary group-hover:text-accent-indigo transition-colors">{exp.role}</h4>
                                                        <p className="text-[15px] text-text-secondary font-semibold">{exp.company}</p>
                                                    </div>
                                                    <span className="text-[13px] font-bold text-text-tertiary uppercase tracking-tight">{exp.period}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Skills, Tools, Education */}
                                <div className="lg:col-span-5 space-y-20 p-12 bg-bg-1/50 rounded-[32px] border border-bg-3 h-fit sticky top-24">
                                    <section>
                                        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-6">Expertise</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {creator.skills?.map(skill => (
                                                <span key={skill} className="px-4 py-2 bg-bg-2 border border-bg-3 rounded-full text-[13px] font-bold text-text-secondary">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="pt-8 border-t border-bg-3">
                                        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-6">Tools & Software</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {creator.tools?.map(tool => (
                                                <span key={tool} className="px-4 py-2 bg-bg-0 border border-bg-3 rounded-xl text-[13px] font-bold text-text-primary shadow-sm hover:border-accent-indigo/50 transition-all">
                                                    {tool}
                                                </span>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="pt-8 border-t border-bg-3" title="Languages known by the creator">
                                        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-6">Languages</h3>
                                        <div className="space-y-4">
                                            {creator.languages?.map(lang => (
                                                <div key={lang} className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
                                                    <span className="text-[14px] font-bold text-text-secondary">{lang}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="pt-8 border-t border-bg-3">
                                        <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-6">Education</h3>
                                        {creator.education?.map((edu, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <p className="text-[15px] font-bold text-text-primary">{edu.degree}</p>
                                                <p className="text-[13px] text-text-secondary font-semibold">{edu.school}, {edu.year}</p>
                                            </div>
                                        ))}
                                    </section>

                                    <button className="w-full h-[60px] bg-text-primary text-bg-0 rounded-2xl flex items-center justify-center gap-2 font-bold hover:scale-[1.02] transition-all mt-8">
                                        Contact Directly
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Footer Menu */}
            <FloatingMenu
                leftElement={
                    <div className="w-[60px] h-[60px] bg-[#232323]/80 rounded-full flex items-center justify-center group cursor-pointer hover:bg-[#2a2a2a] transition-colors shrink-0 relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#311C99] to-[#06D6A0] flex items-center justify-center text-[10px] font-black text-white overflow-hidden">
                            {creator.avatar ? (
                                <Image
                                    src={creator.avatar}
                                    alt={creator.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                creator.initials
                            )}
                        </div>
                        {creator.isPro && (
                            <div className="absolute -top-1 -right-1 bg-accent-indigo text-white text-[7px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-lg">
                                PRO
                            </div>
                        )}
                    </div>
                }
                rightElement={
                    <button className="w-fit h-[60px] bg-[#06D6A0] rounded-full text-[13px] font-bold text-[#222222] hover:bg-[#05bb8c] transition-colors px-10 shadow-lg flex items-center gap-2 group">
                        Visit us
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                }
            >
                {[
                    { label: 'Projects', id: 'projects' },
                    { label: 'Services', id: 'services' },
                    { label: 'Profile', id: 'profile' }
                ].map(item => (
                    <button
                        key={item.label}
                        onClick={() => setActiveTab(item.id as 'projects' | 'services' | 'profile')}
                        className={cn(
                            "h-[48px] rounded-full border-[0.5px] px-[20px] whitespace-nowrap transition-all text-[13px] font-bold font-inter-tight",
                            activeTab === item.id
                                ? "bg-[#E9E9E9] text-black border-[#E9E9E9] shadow-md"
                                : "border-[#727272]/50 text-[#727272] hover:border-[#E9E9E9] hover:text-[#E9E9E9]"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </FloatingMenu>

            {selectedProject && (
                <ProjectViewerModal
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    project={{
                        id: selectedProject.id,
                        name: selectedProject.title,
                        content_json: selectedProject.content_json || [],
                        category: selectedProject.category,
                        cover_url: selectedProject.image,
                        author: creator.name,
                        avatar: creator.avatar || undefined
                    }}
                />
            )}

            <ServiceDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                service={selectedService}
                creator={initialCreator}
            />
        </div>
    )
}

function ServiceDetailModal({ isOpen, onClose, service, creator }: any) {
    if (!service) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-[1240px] h-[min(850px,90vh)] bg-bg-1 border border-bg-3 rounded-[24px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-20 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Left Side: Media/Projects */}
                        <div className="w-full md:w-[60%] bg-bg-0 border-r border-bg-3 overflow-y-auto custom-scrollbar p-10 flex flex-col gap-8">
                            {service.projects && service.projects.length > 0 ? (
                                <div className="space-y-8">
                                    {service.projects.map((p: any) => (
                                        <div key={p.project?.id} className="w-full rounded-[24px] overflow-hidden group">
                                            <div className="relative aspect-video">
                                                <Image
                                                    src={p.project?.cover_url || "/placeholder-service.jpg"}
                                                    alt={p.project?.name || "Project cover"}
                                                    fill
                                                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                                />
                                                <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-10">
                                                    <h4 className="text-white font-black text-xl">{p.project?.name}</h4>
                                                    <p className="text-white/70 text-sm mt-1">Associated Project</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={cn("w-full h-full rounded-[24px] bg-gradient-to-br min-h-[400px] relative", service.image || "from-bg-2 to-bg-3")}>
                                    {service.cover_url && (
                                        <Image src={service.cover_url} fill className="object-cover rounded-[24px]" alt="Service Cover" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Side: Details & Actions */}
                        <div className="flex-1 p-10 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="mb-8">
                                <h2 className="text-[36px] font-black text-text-primary leading-[1.1] mb-4">{service.title}</h2>
                                <div className="flex items-center gap-4 text-[20px] font-bold text-[#ff0054] mb-8">
                                    <span>De {service.price}</span>
                                </div>

                                <div className="flex items-center gap-3 mb-10 pb-8 border-b border-bg-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-3 border border-bg-4 relative">
                                        <Image src={creator.avatar || '/placeholder.png'} fill className="object-cover" alt={creator.name} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-text-primary">{creator.name}</span>
                                            {creator.isPro && (
                                                <Badge className="bg-[#ff0054] text-white text-[10px] px-1.5 h-4 rounded-sm font-bold flex items-center">PRO</Badge>
                                            )}
                                        </div>
                                        <span className="text-[12px] text-text-tertiary">@{creator.name.toLowerCase().replace(' ', '_')}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-bg-2 flex items-center justify-center text-[#ff0054]">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest text-[9px]">Hora de entrega</span>
                                            <span className="text-sm font-bold text-text-primary">{service.delivery}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-bg-2 flex items-center justify-center text-[#ff0054]">
                                            <RotateCcw className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest text-[9px]">Conceitos e revisões</span>
                                            <span className="text-sm font-bold text-text-primary">Ilimitadas</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed mb-10">
                                    {service.description}
                                </div>

                                <div className="space-y-4 mb-12">
                                    <h4 className="font-black text-text-primary flex items-center gap-2">
                                        Process & Communication 🤝
                                    </h4>
                                    <ul className="space-y-3">
                                        {[
                                            "Discovery Call (20-30 minutes)",
                                            "A session to discuss your requirements",
                                            "Weekly progress updates",
                                            "Final design handover"
                                        ].map((item, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-text-secondary">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#ff0054] mt-1.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-auto p-8 rounded-[24px] bg-bg-0 border border-bg-3">
                                <h5 className="font-bold text-text-primary mb-5">Informe-se sobre esse serviço</h5>
                                <Textarea
                                    placeholder={`Escreva uma mensagem para ${creator.name}. Compartilhar mais detalhes aumentará as chances de receber uma resposta`}
                                    className="w-full min-h-[140px] bg-bg-1 border border-bg-3 focus:border-[#ff0054] rounded-[24px] mb-6 p-4 text-sm leading-relaxed outline-none transition-colors"
                                />
                                <Button className="w-full h-14 bg-[#ff0054] hover:bg-[#ff0054]/90 text-white rounded-[24px] font-black text-lg gap-3 transition-all hover:scale-[1.02]">
                                    <Send className="w-5 h-5" />
                                    Enviar consulta
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
